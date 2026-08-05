import { compareCanonicalIdentity, normalizeBoundedIdentity, normalizeCanonicalIdentity } from '../../shared/domain/canonical';

export interface CatalogConstituentInput {
  readonly id: string;
  readonly name: string;
  readonly directionalStopIds: readonly string[];
}

export interface CatalogComplexInput {
  readonly id: string;
  readonly name: string;
  readonly routeIds: readonly string[];
  readonly constituents: readonly CatalogConstituentInput[];
}

export interface CatalogInput {
  readonly contentVersion: string;
  readonly complexes: readonly CatalogComplexInput[];
}

export interface CatalogService {
  readonly contentVersion: string;
  all(): readonly CatalogComplexInput[];
  search(query: string, limit: number): readonly CatalogComplexInput[];
}

export function createCatalogService(input: CatalogInput): CatalogService {
  const contentVersion = normalizeBoundedIdentity(input.contentVersion, 'catalog content version', 128);
  const complexes = input.complexes.map(captureComplex);
  assertUnique(complexes.map(({ id }) => id), 'catalog complex');
  complexes.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  const frozen = deepFreeze(complexes);
  return Object.freeze({
    contentVersion,
    all: () => frozen,
    search(query: string, limit: number) {
      const needle = normalizeCanonicalIdentity(query).toLocaleLowerCase('en-US');
      return deepFreeze(frozen
        .filter((complex) => complex.name.toLocaleLowerCase('en-US').includes(needle)
          || complex.id.toLocaleLowerCase('en-US').includes(needle)
          || complex.constituents.some(({ name }) => name.toLocaleLowerCase('en-US').includes(needle)))
        .sort((left, right) => searchRank(left, needle) - searchRank(right, needle)
          || compareCanonicalIdentity(left.name, right.name)
          || compareCanonicalIdentity(left.id, right.id))
        .slice(0, limit));
    },
  });
}

function captureComplex(input: CatalogComplexInput): CatalogComplexInput {
  const id = normalizeBoundedIdentity(input.id, 'catalog complex', 128);
  const name = displayText(input.name, 'catalog complex name');
  const routeIds = input.routeIds.map((value) => normalizeBoundedIdentity(value, 'catalog route', 128));
  assertUnique(routeIds, 'catalog route');
  routeIds.sort(compareCanonicalIdentity);
  const constituents = input.constituents.map((constituent) => ({
    id: normalizeBoundedIdentity(constituent.id, 'catalog constituent', 128),
    name: displayText(constituent.name, 'catalog constituent name'),
    directionalStopIds: [...constituent.directionalStopIds]
      .map((value) => normalizeBoundedIdentity(value, 'catalog directional stop', 128))
      .sort(compareCanonicalIdentity),
  }));
  assertUnique(constituents.map(({ id: value }) => value), 'catalog constituent');
  constituents.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  return { id, name, routeIds, constituents };
}

function displayText(value: string, label: string): string {
  const normalized = normalizeCanonicalIdentity(value).trim();
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function searchRank(value: CatalogComplexInput, needle: string): number {
  const name = value.name.toLocaleLowerCase('en-US');
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  return 2;
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} identity`);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
