import { createHash } from 'node:crypto';

import { parseCsv, canonicalCsvRowIdentity, type ParsedCsv } from './csv-reader';
import {
  normalizeGtfsTables,
  type StaticGtfsEditionCandidate,
  type StaticGtfsLoadOptions,
} from './static-normalizer';
import { validateAndReadGtfsZip, type GtfsZipLimits } from './zip-validator';

const SEMANTIC_TABLES = new Set([
  'agency.txt',
  'stops.txt',
  'routes.txt',
  'trips.txt',
  'stop_times.txt',
  'calendar.txt',
  'calendar_dates.txt',
  'transfers.txt',
  'shapes.txt',
]);

export async function loadStaticGtfsArchive(
  archive: Uint8Array,
  options: StaticGtfsLoadOptions,
  zipLimits?: Partial<GtfsZipLimits>,
): Promise<StaticGtfsEditionCandidate> {
  const retrievedAt = validIso(options.retrievedAt, 'retrievedAt');
  const publishedAt = options.publishedAt ? validIso(options.publishedAt, 'publishedAt') : undefined;
  if (options.sourceOrder !== undefined && (!Number.isSafeInteger(options.sourceOrder) || options.sourceOrder < 0)) {
    throw new Error('sourceOrder must be a non-negative safe integer');
  }
  if (options.coverage.length === 0) throw new Error('At least one schedule coverage mask is required');

  const files = await validateAndReadGtfsZip(archive, zipLimits);
  const parsed = new Map<string, ParsedCsv>();
  const canonicalTables = new Map<string, string>();
  for (const [name, bytes] of files) {
    if (!name.endsWith('.txt')) continue;
    const table = parseCsv(bytes);
    parsed.set(name, table);
    if (SEMANTIC_TABLES.has(name)) canonicalTables.set(name, canonicalizeTable(table));
  }
  const data = normalizeGtfsTables(parsed);
  const coverage = cloneAndFreezeCoverage(options.coverage);
  const canonicalContentId = semanticIdentity(canonicalTables, coverage);
  const wrapper = Object.freeze({ ...(options.wrapper ?? {}) });

  return deepFreeze({
    source: options.source,
    canonicalContentId,
    retrievedAt,
    ...(publishedAt ? { publishedAt } : {}),
    ...(options.sourceOrder === undefined ? {} : { sourceOrder: options.sourceOrder }),
    coverage,
    wrapper,
    semanticTables: readonlyMap(canonicalTables),
    data,
  });
}

function canonicalizeTable(table: ParsedCsv): string {
  const headers = [...table.headers].sort(compareText);
  const rows = [...table.rows].sort((left, right) =>
    compareText(canonicalCsvRowIdentity(left), canonicalCsvRowIdentity(right)),
  );
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((fields) => fields.map(encodeCsvField).join(','))
    .join('\n') + '\n';
}

function semanticIdentity(
  tables: ReadonlyMap<string, string>,
  coverage: readonly StaticGtfsLoadOptions['coverage'][number][],
): string {
  const hash = createHash('sha256');
  for (const [name, content] of [...tables.entries()].sort(([left], [right]) => compareText(left, right))) {
    updateLengthPrefixed(hash, name);
    updateLengthPrefixed(hash, content);
  }
  updateLengthPrefixed(hash, stableJson(coverage));
  return `sha256:${hash.digest('hex')}`;
}

function cloneAndFreezeCoverage(coverage: StaticGtfsLoadOptions['coverage']) {
  const cloned = coverage.map((mask) => {
    const effectiveFrom = validIsoString(mask.effectiveFrom, `${mask.id} effectiveFrom`);
    const effectiveUntil = validIsoString(mask.effectiveUntil, `${mask.id} effectiveUntil`);
    if (effectiveFrom > effectiveUntil) throw new Error(`Coverage ${mask.id} has reversed effective chronology`);
    if (!mask.id || mask.routeIds.length === 0 || mask.serviceDates.length === 0) {
      throw new Error('Coverage masks require identity, routes, and service dates');
    }
    return Object.freeze({
      id: mask.id,
      routeIds: Object.freeze([...new Set(mask.routeIds)].sort(compareText)),
      serviceDates: Object.freeze([...new Set(mask.serviceDates)].sort(compareText)),
      effectiveFrom,
      effectiveUntil,
      directions: Object.freeze([...new Set(mask.directions)].sort(compareText)),
    });
  });
  const ids = new Set<string>();
  for (const mask of cloned) {
    if (ids.has(mask.id)) throw new Error(`Duplicate coverage mask identity: ${mask.id}`);
    ids.add(mask.id);
  }
  return Object.freeze(cloned.sort((left, right) => compareText(left.id, right.id)));
}

function validIso(value: Date, label: string): string {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.toISOString();
}

function validIsoString(value: string, label: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new Error(`Invalid ${label}`);
  return value;
}

function encodeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function updateLengthPrefixed(hash: ReturnType<typeof createHash>, value: string): void {
  const bytes = Buffer.from(value);
  const length = Buffer.allocUnsafe(4);
  length.writeUInt32BE(bytes.length);
  hash.update(length).update(bytes);
}

function compareText(left: string, right: string): number {
  return Buffer.from(left).compare(Buffer.from(right));
}

function readonlyMap<K, V>(source: Map<K, V>): ReadonlyMap<K, V> {
  const backing = new Map(source);
  return Object.freeze({
    get size() {
      return backing.size;
    },
    get: (key: K) => backing.get(key),
    has: (key: K) => backing.has(key),
    entries: () => backing.entries(),
    keys: () => backing.keys(),
    values: () => backing.values(),
    forEach: (callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown) =>
      backing.forEach((value, key) => callback.call(thisArg, value, key, backing)),
    [Symbol.iterator]: () => backing[Symbol.iterator](),
  });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
