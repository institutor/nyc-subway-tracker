import { compareCanonicalIdentity, encodeCanonicalStringTuple, normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import { parseWalkRange, type WalkRange } from './geo';
import type { Direction } from './types';

const MAX_NODES = 10_000;
const MAX_PATTERNS = 20_000;
const MAX_TRANSFERS = 20_000;
const MAX_STOPS_PER_PATTERN = 256;
const MAX_TRANSFER_COUNT = 4;
const MAX_LEGS = 8;
const MAX_EXPANDED_LABELS = 50_000;
const MAX_LABELS_PER_NODE = 64;
const MAX_ALTERNATIVES = 8;

export type JourneyRisk = 'clear' | 'affected' | 'uncertain' | 'blocked';
export type JourneyValidity = 'valid' | 'limited';
export type JourneyAccessibility = 'eligible' | 'unknown' | 'ineligible';

export interface JourneyOccurrenceNode {
  readonly id: string;
  readonly occurrenceId: string;
  readonly stationId: string;
  readonly directionalStopId: string;
}

export interface CurrentPatternEvidence {
  readonly status: 'admitted' | 'missing' | 'vetoed';
  readonly serviceDecision: 'pass' | 'veto' | 'unknown';
  readonly validity: JourneyValidity;
  readonly risk: JourneyRisk;
  readonly arrivalSeconds?: number;
}

export interface FuturePatternEvidence {
  readonly serviceDate: string;
  readonly owner: 'regular' | 'supplemented';
  readonly occurrence: 'present' | 'absent';
  readonly usableSupplementMask: boolean;
  readonly serviceDecision: 'pass' | 'veto' | 'unknown';
  readonly validity: JourneyValidity;
  readonly risk: JourneyRisk;
  readonly arrivalSeconds?: number;
}

export interface OfflinePatternEvidence {
  readonly schedule: 'current-supplemented' | 'stale-supplemented' | 'regular-only' | 'missing' | 'quarantined' | 'mismatch';
  readonly serviceDecision: 'pass' | 'veto' | 'unknown';
  readonly patternMatch: 'exact' | 'mismatch';
  readonly validity: JourneyValidity;
  readonly risk: JourneyRisk;
  readonly arrivalSeconds?: number;
}

export interface JourneyPattern {
  readonly id: string;
  readonly routeId: string;
  readonly routeLabel: string;
  readonly direction: Direction;
  readonly actualDestination: string;
  readonly orderedOccurrenceIds: readonly string[];
  readonly accessibility: JourneyAccessibility;
  readonly current: CurrentPatternEvidence;
  readonly future: readonly FuturePatternEvidence[];
  readonly offline: OfflinePatternEvidence;
}

export type TransferEvidence =
  | { readonly kind: 'structural-only' }
  | { readonly kind: 'verified'; readonly accessibility: JourneyAccessibility; readonly risk: JourneyRisk };

export interface JourneyTransfer {
  readonly id: string;
  readonly fromOccurrenceId: string;
  readonly toOccurrenceId: string;
  readonly evidence: TransferEvidence;
}

export interface JourneyGraph {
  readonly nodes: readonly JourneyOccurrenceNode[];
  readonly patterns: readonly JourneyPattern[];
  readonly transfers: readonly JourneyTransfer[];
}

export interface JourneyQuery {
  readonly mode: 'online-current' | 'online-future' | 'offline-reference';
  readonly originStationId: string;
  readonly destinationStationId: string;
  readonly requiredFirstDirection?: Direction;
  readonly requiredActualDestination?: string;
  readonly serviceDate?: string;
  readonly accessibleRouteOnly: boolean;
  readonly practicalWalkEvidence?: readonly { readonly patternId: string; readonly range: WalkRange }[];
}

export interface RoutedJourneyLeg {
  readonly patternId: string;
  readonly routeId: string;
  readonly routeLabel: string;
  readonly direction: Direction;
  readonly actualDestination: string;
  readonly fromOccurrenceId: string;
  readonly toOccurrenceId: string;
  readonly orderedOccurrenceIds: readonly string[];
}

export interface RoutedJourney {
  readonly id: string;
  readonly legs: readonly RoutedJourneyLeg[];
  readonly transferIds: readonly string[];
  readonly transfers: number;
  readonly validity: JourneyValidity;
  readonly accessibility: JourneyAccessibility;
  readonly risk: JourneyRisk;
  readonly timing: 'timed' | 'untimed';
  readonly practicalWalkRange?: WalkRange;
  readonly arrivalSeconds?: number;
}

export type JourneyRouteDecision =
  | { readonly kind: 'planned'; readonly label?: 'Reference itinerary'; readonly itineraries: readonly RoutedJourney[] }
  | { readonly kind: 'untimed'; readonly label: 'Untimed structural route'; readonly itineraries: readonly RoutedJourney[] }
  | { readonly kind: 'no-path'; readonly reason: 'no-service-path' }
  | { readonly kind: 'unavailable'; readonly reason: 'no-verified-accessible-path' | 'incomparable-evidence' | 'search-limit-reached' };

interface PatternDecision {
  validity: JourneyValidity;
  accessibility: JourneyAccessibility;
  risk: JourneyRisk;
  arrivalSeconds?: number;
  timed: boolean;
}

interface InternalRide {
  patternId: string;
  occurrenceIds: string[];
}

interface SearchState {
  occurrenceId: string;
  actions: string[];
  rides: InternalRide[];
  transferIds: string[];
  visited: Set<string>;
  lastAction: 'start' | 'ride' | 'transfer';
  validityRank: number;
  accessibilityRank: number;
  riskRank: number;
  timing: boolean;
  arrivalSeconds?: number;
  firstPatternId?: string;
}

interface RideEdge { pattern: JourneyPattern; toOccurrenceId: string }

class SearchLimitReached extends Error {}

export function validateJourneyGraph(rawGraph: JourneyGraph): JourneyGraph {
  const root = strictRecord(rawGraph, ['nodes', 'patterns', 'transfers'], 'journey graph');
  if (!Array.isArray(root.nodes) || root.nodes.length > MAX_NODES) throw new Error('Journey graph node limit exceeded');
  if (!Array.isArray(root.patterns) || root.patterns.length > MAX_PATTERNS) throw new Error('Journey graph pattern limit exceeded');
  if (!Array.isArray(root.transfers) || root.transfers.length > MAX_TRANSFERS) throw new Error('Journey graph transfer limit exceeded');
  const nodes = root.nodes.map(captureNode);
  const patterns = root.patterns.map(capturePattern);
  const transfers = root.transfers.map(captureTransfer);
  assertUnique(nodes.map(({ id }) => id), 'node');
  assertUnique(nodes.map(({ occurrenceId }) => occurrenceId), 'occurrence');
  assertUnique(patterns.map(({ id }) => id), 'pattern');
  assertUnique(transfers.map(({ id }) => id), 'transfer');
  const occurrenceIds = new Set(nodes.map(({ occurrenceId }) => occurrenceId));
  for (const pattern of patterns) {
    for (const occurrenceId of pattern.orderedOccurrenceIds) {
      if (!occurrenceIds.has(occurrenceId)) throw new Error(`Journey pattern references unknown occurrence ${occurrenceId}`);
    }
  }
  for (const transfer of transfers) {
    if (!occurrenceIds.has(transfer.fromOccurrenceId) || !occurrenceIds.has(transfer.toOccurrenceId)) {
      throw new Error('Journey transfer references unknown occurrence');
    }
    if (transfer.fromOccurrenceId === transfer.toOccurrenceId) throw new Error('Journey transfer cannot self-reference');
  }
  nodes.sort((left, right) => compareCanonicalIdentity(left.occurrenceId, right.occurrenceId));
  patterns.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  transfers.sort((left, right) => compareCanonicalIdentity(left.id, right.id));
  return deepFreeze({ nodes, patterns, transfers });
}

export function createOfflineStructuralJourneyGraph(rawGraph: JourneyGraph): JourneyGraph {
  const validated = validateJourneyGraph(rawGraph);
  return validateJourneyGraph({
    nodes: validated.nodes,
    patterns: validated.patterns.map((pattern) => ({
      ...pattern,
      current: {
        status: 'missing',
        serviceDecision: 'unknown',
        validity: 'limited',
        risk: 'uncertain',
      },
      future: [],
      offline: {
        schedule: 'missing',
        serviceDecision: 'unknown',
        patternMatch: 'exact',
        validity: 'limited',
        risk: 'uncertain',
      },
    })),
    transfers: validated.transfers.map((transfer) => ({
      ...transfer,
      evidence: { kind: 'structural-only' },
    })),
  });
}

export function routeJourney(rawGraph: JourneyGraph, rawQuery: JourneyQuery): JourneyRouteDecision {
  const graph = validateJourneyGraph(rawGraph);
  const query = validateJourneyQuery(rawQuery);
  const nodesByOccurrence = new Map(graph.nodes.map((node) => [node.occurrenceId, node]));
  const rideEdges = new Map<string, RideEdge[]>();
  const patternDecisions = new Map<string, PatternDecision>();
  for (const pattern of graph.patterns) {
    const decision = decisionForPattern(pattern, query);
    if (!decision) continue;
    patternDecisions.set(pattern.id, decision);
    for (let index = 0; index < pattern.orderedOccurrenceIds.length - 1; index += 1) {
      const from = pattern.orderedOccurrenceIds[index];
      const edge = { pattern, toOccurrenceId: pattern.orderedOccurrenceIds[index + 1] };
      rideEdges.set(from, [...(rideEdges.get(from) ?? []), edge]);
    }
  }
  for (const edges of rideEdges.values()) edges.sort((left, right) =>
    compareCanonicalIdentity(left.pattern.id, right.pattern.id)
    || compareCanonicalIdentity(left.toOccurrenceId, right.toOccurrenceId));
  const transfers = new Map<string, JourneyTransfer[]>();
  for (const transfer of graph.transfers) transfers.set(transfer.fromOccurrenceId, [...(transfers.get(transfer.fromOccurrenceId) ?? []), transfer]);
  for (const edges of transfers.values()) edges.sort((left, right) => compareCanonicalIdentity(left.id, right.id));

  const queue: SearchState[] = graph.nodes
    .filter(({ stationId }) => stationId === query.originStationId)
    .map(({ occurrenceId }) => initialState(occurrenceId));
  const labelFrontier = new Map<string, SearchState[]>();
  for (const state of queue) admitLabel(labelFrontier, state);
  const candidates: SearchState[] = [];
  let expanded = 0;
  try {
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const state = queue[cursor];
      expanded += 1;
      if (expanded > MAX_EXPANDED_LABELS) throw new SearchLimitReached();
      const node = nodesByOccurrence.get(state.occurrenceId)!;
      if (node.stationId === query.destinationStationId && state.rides.length > 0) {
        candidates.push(state);
        continue;
      }
      for (const edge of rideEdges.get(state.occurrenceId) ?? []) {
        if (state.visited.has(edge.toOccurrenceId)) continue;
        if (!state.firstPatternId
          && ((query.requiredFirstDirection && edge.pattern.direction !== query.requiredFirstDirection)
            || (query.requiredActualDestination && edge.pattern.actualDestination !== query.requiredActualDestination))) continue;
        const next = rideState(state, edge, patternDecisions.get(edge.pattern.id)!);
        if (next.rides.length > MAX_LEGS) continue;
        if (admitLabel(labelFrontier, next)) queue.push(next);
      }
      for (const transfer of transfers.get(state.occurrenceId) ?? []) {
        if (state.transferIds.length >= MAX_TRANSFER_COUNT || state.visited.has(transfer.toOccurrenceId)) continue;
        const next = transferState(state, transfer);
        if (admitLabel(labelFrontier, next)) queue.push(next);
      }
    }
  } catch (error) {
    if (error instanceof SearchLimitReached) return Object.freeze({ kind: 'unavailable', reason: 'search-limit-reached' });
    throw error;
  }

  const uniqueCandidates = deduplicateCandidates(candidates);
  if (uniqueCandidates.length === 0) return Object.freeze({ kind: 'no-path', reason: 'no-service-path' });
  const accessibleCandidates = query.accessibleRouteOnly
    ? uniqueCandidates.filter((candidate) => candidate.accessibilityRank === 0)
    : uniqueCandidates;
  if (accessibleCandidates.length === 0) return Object.freeze({ kind: 'unavailable', reason: 'no-verified-accessible-path' });
  const walkByPattern = new Map((query.practicalWalkEvidence ?? []).map(({ patternId, range }) => [patternId, range]));
  const routed = accessibleCandidates.map((candidate) => toRoutedJourney(candidate, graph, patternDecisions, walkByPattern));
  if (hasIncomparableEvidence(routed)) return Object.freeze({ kind: 'unavailable', reason: 'incomparable-evidence' });
  const walkTiers = cohortWalkTiers(routed);
  routed.sort((left, right) => compareRouted(left, right, walkTiers));
  const itineraries = deepFreeze(routed.slice(0, MAX_ALTERNATIVES));
  if (query.mode === 'offline-reference') {
    if (itineraries[0].timing === 'timed') return deepFreeze({ kind: 'planned', label: 'Reference itinerary', itineraries });
    return deepFreeze({ kind: 'untimed', label: 'Untimed structural route', itineraries });
  }
  return deepFreeze({ kind: 'planned', itineraries });
}

export function validateJourneyQuery(rawQuery: JourneyQuery): JourneyQuery {
  return captureQuery(rawQuery);
}

function captureNode(value: unknown): JourneyOccurrenceNode {
  const record = strictRecord(value, ['id', 'occurrenceId', 'stationId', 'directionalStopId'], 'journey node fields');
  return {
    id: identity(record.id, 'node'),
    occurrenceId: identity(record.occurrenceId, 'occurrence'),
    stationId: identity(record.stationId, 'station'),
    directionalStopId: identity(record.directionalStopId, 'directional stop'),
  };
}

function capturePattern(value: unknown): JourneyPattern {
  const record = strictRecord(value, [
    'id', 'routeId', 'routeLabel', 'direction', 'actualDestination', 'orderedOccurrenceIds',
    'accessibility', 'current', 'future', 'offline',
  ], 'journey pattern fields');
  if (!Array.isArray(record.orderedOccurrenceIds)
    || record.orderedOccurrenceIds.length < 2
    || record.orderedOccurrenceIds.length > MAX_STOPS_PER_PATTERN) throw new Error('Invalid stops per journey pattern');
  const orderedOccurrenceIds = record.orderedOccurrenceIds.map((id) => identity(id, 'pattern occurrence'));
  assertUnique(orderedOccurrenceIds, 'pattern occurrence');
  if (!Array.isArray(record.future) || record.future.length > 366) throw new Error('Invalid future evidence count');
  const future = record.future.map(captureFutureEvidence);
  assertUnique(future.map(({ serviceDate }) => serviceDate), 'future service date');
  return {
    id: identity(record.id, 'pattern'),
    routeId: identity(record.routeId, 'route'),
    routeLabel: display(record.routeLabel, 'route label'),
    direction: parseDirection(record.direction),
    actualDestination: display(record.actualDestination, 'actual destination'),
    orderedOccurrenceIds: Object.freeze(orderedOccurrenceIds),
    accessibility: parseAccessibility(record.accessibility),
    current: captureCurrentEvidence(record.current),
    future: Object.freeze(future.sort((left, right) => compareCanonicalIdentity(left.serviceDate, right.serviceDate))),
    offline: captureOfflineEvidence(record.offline),
  };
}

function captureCurrentEvidence(value: unknown): CurrentPatternEvidence {
  const record = evidenceRecord(value, ['status', 'serviceDecision', 'validity', 'risk']);
  return {
    status: enumeration(record.status, ['admitted', 'missing', 'vetoed'] as const, 'current status'),
    serviceDecision: parseServiceDecision(record.serviceDecision),
    validity: parseValidity(record.validity),
    risk: parseRisk(record.risk),
    ...optionalArrival(record.arrivalSeconds),
  };
}

function captureFutureEvidence(value: unknown): FuturePatternEvidence {
  const record = evidenceRecord(value, [
    'serviceDate', 'owner', 'occurrence', 'usableSupplementMask', 'serviceDecision', 'validity', 'risk',
  ]);
  if (typeof record.usableSupplementMask !== 'boolean') throw new Error('Invalid supplement mask evidence');
  return {
    serviceDate: serviceDate(record.serviceDate),
    owner: enumeration(record.owner, ['regular', 'supplemented'] as const, 'schedule owner'),
    occurrence: enumeration(record.occurrence, ['present', 'absent'] as const, 'schedule occurrence'),
    usableSupplementMask: record.usableSupplementMask,
    serviceDecision: parseServiceDecision(record.serviceDecision),
    validity: parseValidity(record.validity),
    risk: parseRisk(record.risk),
    ...optionalArrival(record.arrivalSeconds),
  };
}

function captureOfflineEvidence(value: unknown): OfflinePatternEvidence {
  const record = evidenceRecord(value, ['schedule', 'serviceDecision', 'patternMatch', 'validity', 'risk']);
  return {
    schedule: enumeration(record.schedule, ['current-supplemented', 'stale-supplemented', 'regular-only', 'missing', 'quarantined', 'mismatch'] as const, 'offline schedule'),
    serviceDecision: parseServiceDecision(record.serviceDecision),
    patternMatch: enumeration(record.patternMatch, ['exact', 'mismatch'] as const, 'offline pattern match'),
    validity: parseValidity(record.validity),
    risk: parseRisk(record.risk),
    ...optionalArrival(record.arrivalSeconds),
  };
}

function evidenceRecord(value: unknown, required: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid pattern evidence');
  const keys = [...required];
  if ('arrivalSeconds' in value) keys.push('arrivalSeconds');
  return strictRecord(value, keys, 'pattern evidence fields');
}

function optionalArrival(value: unknown): { arrivalSeconds?: number } {
  if (value === undefined) return {};
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 86_400) throw new Error('Invalid arrival seconds');
  return { arrivalSeconds: value as number };
}

function captureTransfer(value: unknown): JourneyTransfer {
  const record = strictRecord(value, ['id', 'fromOccurrenceId', 'toOccurrenceId', 'evidence'], 'journey transfer fields');
  return {
    id: identity(record.id, 'transfer'),
    fromOccurrenceId: identity(record.fromOccurrenceId, 'transfer origin'),
    toOccurrenceId: identity(record.toOccurrenceId, 'transfer destination'),
    evidence: captureTransferEvidence(record.evidence),
  };
}

function captureTransferEvidence(value: unknown): TransferEvidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid transfer evidence');
  if ((value as Record<string, unknown>).kind === 'structural-only') {
    strictRecord(value, ['kind'], 'transfer evidence fields');
    return Object.freeze({ kind: 'structural-only' });
  }
  const record = strictRecord(value, ['kind', 'accessibility', 'risk'], 'transfer evidence fields');
  if (record.kind !== 'verified') throw new Error('Invalid transfer evidence kind');
  return Object.freeze({ kind: 'verified', accessibility: parseAccessibility(record.accessibility), risk: parseRisk(record.risk) });
}

function captureQuery(value: JourneyQuery): JourneyQuery {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid journey query');
  const required = ['mode', 'originStationId', 'destinationStationId', 'accessibleRouteOnly'];
  const optional = ['requiredFirstDirection', 'requiredActualDestination', 'serviceDate', 'practicalWalkEvidence'];
  const actual = Object.keys(value);
  if (required.some((key) => !actual.includes(key)) || actual.some((key) => !required.includes(key) && !optional.includes(key))) {
    throw new Error('Invalid journey query fields');
  }
  if (typeof value.accessibleRouteOnly !== 'boolean') throw new Error('Invalid Accessible Route Only query');
  const mode = enumeration(value.mode, ['online-current', 'online-future', 'offline-reference'] as const, 'journey mode');
  if (mode === 'online-future' && value.serviceDate === undefined) throw new Error('Future journey requires service date');
  const practicalWalkEvidence = value.practicalWalkEvidence === undefined
    ? undefined
    : captureWalkEvidence(value.practicalWalkEvidence);
  return deepFreeze({
    mode,
    originStationId: identity(value.originStationId, 'journey origin'),
    destinationStationId: identity(value.destinationStationId, 'journey destination'),
    ...(value.requiredFirstDirection === undefined ? {} : { requiredFirstDirection: parseDirection(value.requiredFirstDirection) }),
    ...(value.requiredActualDestination === undefined ? {} : { requiredActualDestination: display(value.requiredActualDestination, 'required destination') }),
    ...(value.serviceDate === undefined ? {} : { serviceDate: serviceDate(value.serviceDate) }),
    accessibleRouteOnly: value.accessibleRouteOnly,
    ...(practicalWalkEvidence === undefined ? {} : { practicalWalkEvidence }),
  });
}

function captureWalkEvidence(value: unknown): readonly { patternId: string; range: WalkRange }[] {
  if (!Array.isArray(value) || value.length > MAX_PATTERNS) throw new Error('Invalid journey walk evidence');
  const rows = value.map((row) => {
    const record = strictRecord(row, ['patternId', 'range'], 'journey walk fields');
    return { patternId: identity(record.patternId, 'walk pattern'), range: parseWalkRange(record.range) };
  });
  assertUnique(rows.map(({ patternId }) => patternId), 'walk pattern');
  return deepFreeze(rows.sort((left, right) => compareCanonicalIdentity(left.patternId, right.patternId)));
}

function decisionForPattern(pattern: JourneyPattern, query: JourneyQuery): PatternDecision | undefined {
  if (query.mode === 'online-current') {
    if (pattern.current.status !== 'admitted' || pattern.current.serviceDecision !== 'pass') return undefined;
    return { ...pattern.current, accessibility: pattern.accessibility, timed: true };
  }
  if (query.mode === 'online-future') {
    const evidence = pattern.future.find(({ serviceDate: date }) => date === query.serviceDate);
    if (!evidence
      || evidence.occurrence !== 'present'
      || evidence.serviceDecision !== 'pass'
      || (evidence.owner === 'regular' && evidence.usableSupplementMask)) return undefined;
    return { ...evidence, accessibility: pattern.accessibility, timed: true };
  }
  const timed = (pattern.offline.schedule === 'current-supplemented' || pattern.offline.schedule === 'stale-supplemented')
    && pattern.offline.patternMatch === 'exact'
    && pattern.offline.serviceDecision === 'pass';
  return {
    validity: timed ? pattern.offline.validity : 'limited',
    accessibility: pattern.accessibility,
    risk: timed ? pattern.offline.risk : 'uncertain',
    ...(timed && pattern.offline.arrivalSeconds !== undefined ? { arrivalSeconds: pattern.offline.arrivalSeconds } : {}),
    timed,
  };
}

function initialState(occurrenceId: string): SearchState {
  return {
    occurrenceId,
    actions: [],
    rides: [],
    transferIds: [],
    visited: new Set([occurrenceId]),
    lastAction: 'start',
    validityRank: 0,
    accessibilityRank: 0,
    riskRank: 0,
    timing: true,
  };
}

function rideState(state: SearchState, edge: RideEdge, decision: PatternDecision): SearchState {
  const continuing = state.lastAction === 'ride' && state.rides.at(-1)?.patternId === edge.pattern.id;
  const rides = state.rides.map((ride) => ({ patternId: ride.patternId, occurrenceIds: [...ride.occurrenceIds] }));
  if (continuing) rides.at(-1)!.occurrenceIds.push(edge.toOccurrenceId);
  else rides.push({ patternId: edge.pattern.id, occurrenceIds: [state.occurrenceId, edge.toOccurrenceId] });
  return {
    occurrenceId: edge.toOccurrenceId,
    actions: [...state.actions, encodeCanonicalStringTuple(['ride-edge', edge.pattern.id, state.occurrenceId, edge.toOccurrenceId])],
    rides,
    transferIds: [...state.transferIds],
    visited: new Set([...state.visited, edge.toOccurrenceId]),
    lastAction: 'ride',
    validityRank: Math.max(state.validityRank, validityRank(decision.validity)),
    accessibilityRank: Math.max(state.accessibilityRank, accessibilityRank(decision.accessibility)),
    riskRank: Math.max(state.riskRank, riskRank(decision.risk)),
    timing: state.timing && decision.timed,
    ...(state.firstPatternId === undefined && decision.arrivalSeconds !== undefined
      ? { arrivalSeconds: decision.arrivalSeconds }
      : state.arrivalSeconds === undefined ? {} : { arrivalSeconds: state.arrivalSeconds }),
    firstPatternId: state.firstPatternId ?? edge.pattern.id,
  };
}

function transferState(state: SearchState, transfer: JourneyTransfer): SearchState {
  const access = transfer.evidence.kind === 'verified' ? transfer.evidence.accessibility : 'unknown';
  const risk = transfer.evidence.kind === 'verified' ? transfer.evidence.risk : 'uncertain';
  return {
    ...state,
    occurrenceId: transfer.toOccurrenceId,
    actions: [...state.actions, encodeCanonicalStringTuple(['transfer-edge', transfer.id, state.occurrenceId, transfer.toOccurrenceId])],
    rides: state.rides.map((ride) => ({ patternId: ride.patternId, occurrenceIds: [...ride.occurrenceIds] })),
    transferIds: [...state.transferIds, transfer.id],
    visited: new Set([...state.visited, transfer.toOccurrenceId]),
    lastAction: 'transfer',
    accessibilityRank: Math.max(state.accessibilityRank, accessibilityRank(access)),
    riskRank: Math.max(state.riskRank, riskRank(risk)),
  };
}

function admitLabel(frontier: Map<string, SearchState[]>, candidate: SearchState): boolean {
  const labels = frontier.get(candidate.occurrenceId) ?? [];
  const sameOperationalPath = (left: SearchState, right: SearchState) =>
    left.firstPatternId === right.firstPatternId
    && left.lastAction === right.lastAction
    && left.rides.at(-1)?.patternId === right.rides.at(-1)?.patternId;
  if (labels.some((label) => sameOperationalPath(label, candidate)
    && label.transferIds.length <= candidate.transferIds.length
    && label.rides.length <= candidate.rides.length
    && label.validityRank <= candidate.validityRank
    && label.accessibilityRank <= candidate.accessibilityRank
    && label.riskRank <= candidate.riskRank)) return false;
  const retained = labels.filter((label) => !(sameOperationalPath(label, candidate)
    && candidate.transferIds.length <= label.transferIds.length
    && candidate.rides.length <= label.rides.length
    && candidate.validityRank <= label.validityRank
    && candidate.accessibilityRank <= label.accessibilityRank
    && candidate.riskRank <= label.riskRank));
  retained.push(candidate);
  if (retained.length > MAX_LABELS_PER_NODE) throw new SearchLimitReached();
  frontier.set(candidate.occurrenceId, retained);
  return true;
}

function deduplicateCandidates(candidates: readonly SearchState[]): SearchState[] {
  const byIdentity = new Map<string, SearchState>();
  for (const candidate of candidates) {
    const id = pathIdentity(candidate);
    if (!byIdentity.has(id)) byIdentity.set(id, candidate);
  }
  return [...byIdentity.values()];
}

function toRoutedJourney(
  state: SearchState,
  graph: JourneyGraph,
  _decisions: ReadonlyMap<string, PatternDecision>,
  walkByPattern: ReadonlyMap<string, WalkRange>,
): RoutedJourney {
  const patternById = new Map(graph.patterns.map((pattern) => [pattern.id, pattern]));
  const legs = state.rides.map((ride): RoutedJourneyLeg => {
    const pattern = patternById.get(ride.patternId)!;
    return {
      patternId: pattern.id,
      routeId: pattern.routeId,
      routeLabel: pattern.routeLabel,
      direction: pattern.direction,
      actualDestination: pattern.actualDestination,
      fromOccurrenceId: ride.occurrenceIds[0],
      toOccurrenceId: ride.occurrenceIds.at(-1)!,
      orderedOccurrenceIds: Object.freeze([...ride.occurrenceIds]),
    };
  });
  const firstPatternId = state.firstPatternId!;
  const walk = walkByPattern.get(firstPatternId);
  return deepFreeze({
    id: pathIdentity(state),
    legs,
    transferIds: [...state.transferIds],
    transfers: state.transferIds.length,
    validity: validityFromRank(state.validityRank),
    accessibility: accessibilityFromRank(state.accessibilityRank),
    risk: riskFromRank(state.riskRank),
    timing: state.timing ? 'timed' : 'untimed',
    ...(walk ? { practicalWalkRange: { ...walk } } : {}),
    ...(state.arrivalSeconds === undefined ? {} : { arrivalSeconds: state.arrivalSeconds }),
  });
}

function hasIncomparableEvidence(journeys: readonly RoutedJourney[]): boolean {
  const byPrefix = groupBy(journeys, higherPriorityCohort);
  for (const group of byPrefix.values()) {
    if (group.length < 2) continue;
    if (group.some(({ practicalWalkRange }) => practicalWalkRange === undefined)) return true;
    const tiers = overlapTiers(group.map((journey) => ({ key: journey.id, range: journey.practicalWalkRange! })));
    const byWalkTier = groupBy(group, (journey) => String(tiers.get(journey.id)));
    for (const tied of byWalkTier.values()) {
      if (tied.length > 1 && tied.some(({ arrivalSeconds }) => arrivalSeconds === undefined)) return true;
    }
  }
  return false;
}

function cohortWalkTiers(journeys: readonly RoutedJourney[]): Map<string, number> {
  const tiers = new Map<string, number>();
  for (const cohort of groupBy(journeys, higherPriorityCohort).values()) {
    const local = overlapTiers(cohort
      .filter((journey) => journey.practicalWalkRange)
      .map((journey) => ({ key: journey.id, range: journey.practicalWalkRange! })));
    for (const [id, tier] of local) tiers.set(id, tier);
  }
  return tiers;
}

function higherPriorityCohort(journey: RoutedJourney): string {
  return [
    validityRank(journey.validity),
    accessibilityRank(journey.accessibility),
    riskRank(journey.risk),
    journey.transfers,
  ].join(':');
}

function compareRouted(left: RoutedJourney, right: RoutedJourney, walkTiers: ReadonlyMap<string, number>): number {
  return validityRank(left.validity) - validityRank(right.validity)
    || accessibilityRank(left.accessibility) - accessibilityRank(right.accessibility)
    || riskRank(left.risk) - riskRank(right.risk)
    || left.transfers - right.transfers
    || (walkTiers.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (walkTiers.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    || (left.arrivalSeconds ?? Number.MAX_SAFE_INTEGER) - (right.arrivalSeconds ?? Number.MAX_SAFE_INTEGER)
    || compareCanonicalIdentity(left.id, right.id);
}

function overlapTiers(values: readonly { key: string; range: WalkRange }[]): Map<string, number> {
  const sorted = [...values].sort((left, right) =>
    left.range.minimumSeconds - right.range.minimumSeconds
    || left.range.maximumSeconds - right.range.maximumSeconds
    || compareCanonicalIdentity(left.key, right.key));
  const tiers = new Map<string, number>();
  let tier = -1;
  let maximum = -1;
  for (const value of sorted) {
    if (tier < 0 || value.range.minimumSeconds > maximum) {
      tier += 1;
      maximum = value.range.maximumSeconds;
    } else maximum = Math.max(maximum, value.range.maximumSeconds);
    tiers.set(value.key, tier);
  }
  return tiers;
}

function pathIdentity(state: SearchState): string {
  return encodeCanonicalStringTuple(['journey-path-v1', ...state.actions]);
}

function validityRank(value: JourneyValidity): number { return value === 'valid' ? 0 : 1; }
function accessibilityRank(value: JourneyAccessibility): number { return value === 'eligible' ? 0 : value === 'unknown' ? 1 : 2; }
function riskRank(value: JourneyRisk): number { return value === 'clear' ? 0 : value === 'affected' ? 1 : value === 'uncertain' ? 2 : 3; }
function validityFromRank(value: number): JourneyValidity { return value === 0 ? 'valid' : 'limited'; }
function accessibilityFromRank(value: number): JourneyAccessibility { return value === 0 ? 'eligible' : value === 1 ? 'unknown' : 'ineligible'; }
function riskFromRank(value: number): JourneyRisk { return value === 0 ? 'clear' : value === 1 ? 'affected' : value === 2 ? 'uncertain' : 'blocked'; }

function parseValidity(value: unknown): JourneyValidity { return enumeration(value, ['valid', 'limited'] as const, 'journey validity'); }
function parseAccessibility(value: unknown): JourneyAccessibility { return enumeration(value, ['eligible', 'unknown', 'ineligible'] as const, 'journey accessibility'); }
function parseRisk(value: unknown): JourneyRisk { return enumeration(value, ['clear', 'affected', 'uncertain', 'blocked'] as const, 'journey risk'); }
function parseServiceDecision(value: unknown): 'pass' | 'veto' | 'unknown' { return enumeration(value, ['pass', 'veto', 'unknown'] as const, 'service decision'); }
function parseDirection(value: unknown): Direction { return enumeration(value, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'] as const, 'direction'); }

function serviceDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid journey service date');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('Invalid journey service date');
  return value;
}

function strictRecord(value: unknown, exactKeys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`Invalid ${label}`);
  const keys = Object.keys(value);
  if (keys.length !== exactKeys.length || keys.some((key) => !exactKeys.includes(key))) throw new Error(`Invalid ${label}`);
  return value as Record<string, unknown>;
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  return normalizeBoundedIdentity(value, label);
}

function display(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  const normalized = normalizeCanonicalIdentity(value).trim();
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function enumeration<const T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid ${label}`);
  return value as T[number];
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} identity`);
}

function groupBy<T>(values: readonly T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) groups.set(key(value), [...(groups.get(key(value)) ?? []), value]);
  return groups;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
