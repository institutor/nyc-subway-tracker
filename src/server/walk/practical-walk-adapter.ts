import { compareCanonicalIdentity, normalizeBoundedIdentity } from '../../shared/domain/canonical';
import { parseCoordinate, parseWalkRange, type Coordinate, type WalkRange } from '../../shared/domain/geo';

const MAX_DESTINATIONS = 2_048;
const MAX_REQUEST_BYTES = 512 * 1_024;
const MAX_RESPONSE_BYTES = 1_048_576 as const;
const TIMEOUT_MS = 4_000;

export const PRACTICAL_WALK_SOURCE = Object.freeze({
  source: 'practical-walk' as const,
  sourceId: 'practical-walk' as const,
});

export interface PracticalWalkDestination {
  readonly id: string;
  readonly coordinate: Coordinate;
}

export interface PracticalWalkRequest {
  readonly origin: Coordinate;
  readonly destinations: readonly PracticalWalkDestination[];
}

export interface PracticalWalkAdapterConfig {
  readonly enabled: boolean;
  readonly auditApproved: boolean;
  readonly supported: boolean;
  readonly endpoint: string;
  readonly allowedOrigin: string;
  readonly sourceId: string;
}

export interface PracticalWalkCallOptions {
  readonly signal?: AbortSignal;
}

export interface PracticalWalkTransportRequest {
  readonly url: string;
  readonly method: 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Uint8Array;
  readonly signal: AbortSignal;
  readonly redirect: 'error';
  readonly timeoutMs: 4_000;
  readonly maxResponseBytes: 1_048_576;
}

export interface PracticalWalkTransportResponse {
  readonly status: number;
  readonly contentType: string;
  readonly body: Uint8Array;
}

export type PracticalWalkTransport = (
  request: PracticalWalkTransportRequest,
) => Promise<PracticalWalkTransportResponse>;

export type PracticalWalkUnavailableReason =
  | 'disabled'
  | 'unapproved'
  | 'unsupported'
  | 'limit'
  | 'cancelled'
  | 'timeout'
  | 'invalid'
  | 'incomplete';

export interface CompleteUniverseCoverage {
  readonly kind: 'complete-universe';
}

export interface CertifiedThirdCardCoverage {
  readonly kind: 'certified-third-card-cutoff';
  readonly consideredDestinationIds: readonly string[];
  readonly excludedDestinationIds: readonly string[];
  readonly thirdCardMaximumSeconds: number;
  readonly excludedMinimumSeconds: number;
}

export type PracticalWalkCoverage = CompleteUniverseCoverage | CertifiedThirdCardCoverage;

export interface PracticalWalkResult {
  readonly destinationId: string;
  readonly range: WalkRange;
}

export type PracticalWalkDecision =
  | {
      readonly kind: 'available';
      readonly source: 'practical-walk';
      readonly sourceId: string;
      readonly coverage: PracticalWalkCoverage;
      readonly results: readonly PracticalWalkResult[];
    }
  | { readonly kind: 'unavailable'; readonly reason: PracticalWalkUnavailableReason };

const unavailable = (reason: PracticalWalkUnavailableReason): PracticalWalkDecision =>
  Object.freeze({ kind: 'unavailable', reason });

export async function requestPracticalWalks(
  rawRequest: PracticalWalkRequest,
  config: PracticalWalkAdapterConfig,
  transport: PracticalWalkTransport,
  rawOptions: PracticalWalkCallOptions = {},
): Promise<PracticalWalkDecision> {
  let callerSignal: AbortSignal | undefined;
  try {
    callerSignal = captureCallerSignal(rawOptions);
  } catch {
    return unavailable('invalid');
  }
  if (callerSignal?.aborted) return unavailable('cancelled');
  if (!config.enabled) return unavailable('disabled');
  if (!config.auditApproved) return unavailable('unapproved');
  if (!config.supported || typeof transport !== 'function') return unavailable('unsupported');
  if (!validEndpoint(config)) return unavailable('invalid');
  if (!Array.isArray(rawRequest.destinations) || rawRequest.destinations.length > MAX_DESTINATIONS) {
    return unavailable('limit');
  }

  let captured: CapturedRequest;
  try {
    captured = captureRequest(rawRequest);
  } catch {
    return unavailable('invalid');
  }

  const body = new TextEncoder().encode(JSON.stringify(captured));
  if (body.byteLength > MAX_REQUEST_BYTES) return unavailable('limit');

  let response: PracticalWalkTransportResponse;
  try {
    response = await boundedTransport(transport, {
      url: config.endpoint,
      method: 'POST',
      headers: Object.freeze({ 'content-type': 'application/json', accept: 'application/json' }),
      body,
      redirect: 'error',
      timeoutMs: TIMEOUT_MS,
      maxResponseBytes: MAX_RESPONSE_BYTES,
    }, callerSignal);
  } catch (error) {
    return unavailable(error instanceof CallerCancelled
      ? 'cancelled'
      : error instanceof WalkTimeout || isTimeout(error) ? 'timeout' : 'invalid');
  }

  if (!isByteView(response.body)) return unavailable('invalid');
  if (response.body.byteLength > MAX_RESPONSE_BYTES) return unavailable('limit');
  if (response.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(response.contentType)) {
    return unavailable('invalid');
  }

  let provider: unknown;
  try {
    provider = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(byteView(response.body)));
  } catch {
    return unavailable('invalid');
  }

  try {
    return parseProviderDecision(provider, captured.destinations.map(({ id }) => id));
  } catch (error) {
    return unavailable(error instanceof IncompleteEvidence ? 'incomplete' : 'invalid');
  }
}

export function capturePracticalWalkDecision(
  rawDecision: unknown,
  destinations: readonly PracticalWalkDestination[],
): PracticalWalkDecision {
  try {
    const universe = captureUniverseIds(destinations);
    if (!rawDecision || typeof rawDecision !== 'object' || Array.isArray(rawDecision)) throw new Error('Invalid walk decision');
    if ((rawDecision as Record<string, unknown>).kind === 'unavailable') {
      const record = strictRecord(rawDecision, ['kind', 'reason']);
      const reasons: readonly PracticalWalkUnavailableReason[] = [
        'disabled', 'unapproved', 'unsupported', 'limit', 'cancelled', 'timeout', 'invalid', 'incomplete',
      ];
      if (!reasons.includes(record.reason as PracticalWalkUnavailableReason)) throw new Error('Invalid walk reason');
      return unavailable(record.reason as PracticalWalkUnavailableReason);
    }

    const record = strictRecord(rawDecision, ['kind', 'source', 'sourceId', 'coverage', 'results']);
    if (record.kind !== 'available'
      || record.source !== PRACTICAL_WALK_SOURCE.source
      || record.sourceId !== PRACTICAL_WALK_SOURCE.sourceId
      || !Array.isArray(record.results)
      || record.results.length > MAX_DESTINATIONS) {
      throw new Error('Invalid walk decision');
    }
    const results = record.results.map(captureDecisionResult);
    assertUnique(results.map(({ destinationId }) => destinationId), 'walk result');
    const returned = sortedIdentities(results.map(({ destinationId }) => destinationId));
    const coverage = captureDecisionCoverage(record.coverage);

    if (coverage.kind === 'complete-universe') {
      if (!sameIdentities(universe, returned)) throw new Error('Incomplete complete-universe evidence');
    } else {
      const considered = sortedIdentities(coverage.consideredDestinationIds);
      const excluded = sortedIdentities(coverage.excludedDestinationIds);
      assertUnique([...considered, ...excluded], 'coverage destination');
      if (considered.length < 3
        || !sameIdentities(returned, considered)
        || !sameIdentities(universe, sortedIdentities([...considered, ...excluded]))
        || coverage.excludedMinimumSeconds <= coverage.thirdCardMaximumSeconds
        || results.some(({ range }) => range.maximumSeconds > coverage.thirdCardMaximumSeconds)) {
        throw new Error('Invalid certified evidence');
      }
    }

    results.sort((left, right) => compareCanonicalIdentity(left.destinationId, right.destinationId));
    return deepFreeze({
      kind: 'available',
      ...PRACTICAL_WALK_SOURCE,
      coverage,
      results,
    });
  } catch {
    return unavailable('invalid');
  }
}

interface CapturedRequest {
  readonly origin: Coordinate;
  readonly destinations: readonly PracticalWalkDestination[];
}

function captureRequest(input: PracticalWalkRequest): CapturedRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid walk request');
  const origin = parseCoordinate(input.origin);
  const identities = new Set<string>();
  const destinations = input.destinations.map((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Invalid destination');
    const keys = Object.keys(candidate);
    if (keys.length !== 2 || !keys.includes('id') || !keys.includes('coordinate')) throw new Error('Invalid destination fields');
    const id = normalizeBoundedIdentity(candidate.id, 'walk destination');
    if (identities.has(id)) throw new Error('Duplicate walk destination');
    identities.add(id);
    return { id, coordinate: parseCoordinate(candidate.coordinate) };
  });
  destinations.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  return { origin, destinations };
}

function validEndpoint(config: PracticalWalkAdapterConfig): boolean {
  try {
    const endpoint = new URL(config.endpoint);
    const origin = new URL(config.allowedOrigin);
    return endpoint.protocol === 'https:'
      && !endpoint.username
      && !endpoint.password
      && !endpoint.search
      && !endpoint.hash
      && origin.protocol === 'https:'
      && origin.origin === config.allowedOrigin
      && endpoint.origin === origin.origin
      && Boolean(normalizeBoundedIdentity(config.sourceId, 'walk source'));
  } catch {
    return false;
  }
}

async function boundedTransport(
  transport: PracticalWalkTransport,
  request: Omit<PracticalWalkTransportRequest, 'signal'>,
  callerSignal?: AbortSignal,
): Promise<PracticalWalkTransportResponse> {
  if (callerSignal?.aborted) throw new CallerCancelled();
  const controller = new AbortController();
  let disposition: 'active' | 'caller-cancelled' | 'timed-out' | 'settled' = 'active';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectBoundary!: (reason: Error) => void;
  const boundary = new Promise<never>((_resolve, reject) => {
    rejectBoundary = reject;
  });
  const cancelFromCaller = () => {
    if (disposition !== 'active') return;
    disposition = 'caller-cancelled';
    rejectBoundary(new CallerCancelled());
    controller.abort();
  };
  callerSignal?.addEventListener('abort', cancelFromCaller, { once: true });
  if (callerSignal?.aborted) cancelFromCaller();
  if (disposition === 'active') {
    timer = setTimeout(() => {
      if (disposition !== 'active') return;
      disposition = 'timed-out';
      rejectBoundary(new WalkTimeout());
      controller.abort();
    }, TIMEOUT_MS);
  }
  try {
    return await Promise.race([
      Promise.resolve().then(() => transport({ ...request, signal: controller.signal })),
      boundary,
    ]);
  } finally {
    if (disposition === 'active') disposition = 'settled';
    if (timer !== undefined) clearTimeout(timer);
    callerSignal?.removeEventListener('abort', cancelFromCaller);
  }
}

function captureCallerSignal(options: PracticalWalkCallOptions): AbortSignal | undefined {
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.getPrototypeOf(options) !== Object.prototype) {
    throw new Error('Invalid practical walk call options');
  }
  const keys = Object.keys(options);
  if (keys.length === 0) return undefined;
  if (keys.length !== 1 || keys[0] !== 'signal' || !isAbortSignal(options.signal)) {
    throw new Error('Invalid practical walk caller signal');
  }
  return options.signal;
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return value !== null
    && typeof value === 'object'
    && Object.prototype.toString.call(value) === '[object AbortSignal]'
    && typeof (value as AbortSignal).aborted === 'boolean'
    && typeof (value as AbortSignal).addEventListener === 'function'
    && typeof (value as AbortSignal).removeEventListener === 'function';
}

function parseProviderDecision(provider: unknown, requestedIds: readonly string[]): PracticalWalkDecision {
  const root = strictRecord(provider, ['coverage', 'results']);
  if (!Array.isArray(root.results) || root.results.length > MAX_DESTINATIONS) throw new Error('Invalid walk results');
  const results = root.results.map(parseProviderResult);
  assertUnique(results.map(({ destinationId }) => destinationId), 'provider destination');
  const coverage = parseCoverage(root.coverage);
  const requested = sortedIdentities(requestedIds);
  const returned = sortedIdentities(results.map(({ destinationId }) => destinationId));

  if (coverage.kind === 'complete-universe') {
    if (!sameIdentities(requested, returned)) throw new IncompleteEvidence();
  } else {
    const considered = sortedIdentities(coverage.consideredDestinationIds);
    const excluded = sortedIdentities(coverage.excludedDestinationIds);
    assertUnique([...considered, ...excluded], 'coverage destination');
    if (considered.length < 3
      || !sameIdentities(returned, considered)
      || !sameIdentities(requested, sortedIdentities([...considered, ...excluded]))
      || coverage.excludedMinimumSeconds <= coverage.thirdCardMaximumSeconds
      || results.some(({ range }) => range.maximumSeconds > coverage.thirdCardMaximumSeconds)) {
      throw new IncompleteEvidence();
    }
  }

  results.sort((left, right) => compareCanonicalIdentity(left.destinationId, right.destinationId));
  return deepFreeze({
    kind: 'available',
    ...PRACTICAL_WALK_SOURCE,
    coverage,
    results,
  });
}

function captureUniverseIds(destinations: readonly PracticalWalkDestination[]): string[] {
  if (!Array.isArray(destinations) || destinations.length > MAX_DESTINATIONS) throw new Error('Invalid walk universe');
  const identities = destinations.map((destination) => {
    if (!destination || typeof destination !== 'object' || Array.isArray(destination)) throw new Error('Invalid walk destination');
    return normalizeBoundedIdentity(destination.id, 'walk destination');
  });
  assertUnique(identities, 'walk universe');
  return sortedIdentities(identities);
}

function captureDecisionResult(input: unknown): PracticalWalkResult {
  const record = strictRecord(input, ['destinationId', 'range']);
  return {
    destinationId: normalizeBoundedIdentity(record.destinationId as string, 'walk result destination'),
    range: parseWalkRange(record.range),
  };
}

function captureDecisionCoverage(input: unknown): PracticalWalkCoverage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid walk coverage');
  if ((input as Record<string, unknown>).kind === 'complete-universe') {
    strictRecord(input, ['kind']);
    return Object.freeze({ kind: 'complete-universe' });
  }
  const record = strictRecord(input, [
    'kind', 'consideredDestinationIds', 'excludedDestinationIds', 'thirdCardMaximumSeconds', 'excludedMinimumSeconds',
  ]);
  if (record.kind !== 'certified-third-card-cutoff'
    || !Array.isArray(record.consideredDestinationIds)
    || !Array.isArray(record.excludedDestinationIds)
    || record.consideredDestinationIds.length > MAX_DESTINATIONS
    || record.excludedDestinationIds.length > MAX_DESTINATIONS) {
    throw new Error('Invalid walk coverage');
  }
  const consideredDestinationIds = record.consideredDestinationIds
    .map((id) => normalizeBoundedIdentity(id as string, 'walk considered destination'));
  const excludedDestinationIds = record.excludedDestinationIds
    .map((id) => normalizeBoundedIdentity(id as string, 'walk excluded destination'));
  const thirdCardMaximumSeconds = parseWalkRange({
    minimumSeconds: 0, maximumSeconds: record.thirdCardMaximumSeconds,
  }).maximumSeconds;
  const excludedMinimumSeconds = parseWalkRange({
    minimumSeconds: record.excludedMinimumSeconds, maximumSeconds: 86_400,
  }).minimumSeconds;
  return deepFreeze({
    kind: 'certified-third-card-cutoff',
    consideredDestinationIds: sortedIdentities(consideredDestinationIds),
    excludedDestinationIds: sortedIdentities(excludedDestinationIds),
    thirdCardMaximumSeconds,
    excludedMinimumSeconds,
  });
}

function parseProviderResult(input: unknown): PracticalWalkResult {
  const record = strictRecord(input, ['destinationId', 'minimumSeconds', 'maximumSeconds']);
  return {
    destinationId: normalizeBoundedIdentity(record.destinationId as string, 'provider destination'),
    range: parseWalkRange({ minimumSeconds: record.minimumSeconds, maximumSeconds: record.maximumSeconds }),
  };
}

function parseCoverage(input: unknown): PracticalWalkCoverage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid walk coverage');
  const kind = (input as Record<string, unknown>).kind;
  if (kind === 'complete-universe') {
    strictRecord(input, ['kind']);
    return Object.freeze({ kind });
  }
  if (kind !== 'certified-third-card-cutoff') throw new Error('Invalid walk coverage');
  const record = strictRecord(input, [
    'kind',
    'consideredDestinationIds',
    'excludedDestinationIds',
    'thirdCardMaximumSeconds',
    'excludedMinimumSeconds',
  ]);
  if (!Array.isArray(record.consideredDestinationIds) || !Array.isArray(record.excludedDestinationIds)) {
    throw new Error('Invalid walk coverage IDs');
  }
  const consideredDestinationIds = record.consideredDestinationIds.map((id) => normalizeBoundedIdentity(id as string, 'coverage destination'));
  const excludedDestinationIds = record.excludedDestinationIds.map((id) => normalizeBoundedIdentity(id as string, 'coverage destination'));
  const thirdCardMaximumSeconds = parseWalkRange({ minimumSeconds: 0, maximumSeconds: record.thirdCardMaximumSeconds }).maximumSeconds;
  const excludedMinimumSeconds = parseWalkRange({ minimumSeconds: record.excludedMinimumSeconds, maximumSeconds: 86_400 }).minimumSeconds;
  return deepFreeze({
    kind,
    consideredDestinationIds: sortedIdentities(consideredDestinationIds),
    excludedDestinationIds: sortedIdentities(excludedDestinationIds),
    thirdCardMaximumSeconds,
    excludedMinimumSeconds,
  });
}

function strictRecord(input: unknown, exactKeys: readonly string[]): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
    throw new Error('Invalid provider record');
  }
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== exactKeys.length || keys.some((key) => !exactKeys.includes(key))) throw new Error('Invalid provider fields');
  return record;
}

function sortedIdentities(values: readonly string[]): string[] {
  return [...values].sort(compareCanonicalIdentity);
}

function sameIdentities(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertUnique(values: readonly string[], label: string): void {
  const normalized = values.map((value) => value.normalize('NFC'));
  if (new Set(normalized).size !== normalized.length) throw new IncompleteEvidence(`Duplicate ${label}`);
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function isByteView(value: unknown): value is Uint8Array {
  return ArrayBuffer.isView(value) && (value as { BYTES_PER_ELEMENT?: unknown }).BYTES_PER_ELEMENT === 1;
}

function byteView(value: Uint8Array): Uint8Array {
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

class IncompleteEvidence extends Error {}
class CallerCancelled extends Error {}
class WalkTimeout extends Error {}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
