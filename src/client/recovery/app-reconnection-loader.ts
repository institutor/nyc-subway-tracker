import type {
  BoardEnvelopeDto,
  MapOverlayEnvelopeDto,
  TransitApiClient,
} from '../api/client';
import type { Direction } from '../../shared/domain/types';
import type {
  OwnerAcceptance,
  PreservedReconnectionContext,
  ReconnectionScopeMembership,
  ReconnectionStageResult,
} from '../../shared/domain/reconnection';
import type { ReconnectionStageRequest } from './run-reconnection';

export interface AppReconnectionArtifacts {
  selectedBoard?: BoardEnvelopeDto;
  mapOverlay?: MapOverlayEnvelopeDto;
}

export interface AppReconnectionLoaderOptions {
  readonly api: TransitApiClient;
  readonly stationId: string | null;
  readonly filters: {
    readonly routeIds: readonly string[];
    readonly direction?: Direction;
  };
  readonly hasUnrelatedSavedRecords: boolean;
  readonly artifacts: AppReconnectionArtifacts;
}

export function createAppReconnectionStageLoader(options: AppReconnectionLoaderOptions) {
  return async (
    request: ReconnectionStageRequest,
    signal: AbortSignal,
  ): Promise<ReconnectionStageResult | undefined> => {
    const { stage, context } = request;
    if (stage === 1 || stage === 4) return undefined;
    if (stage === 2) return loadServiceChanges(options, context, signal);
    if (stage === 3) return loadArrivals(options, context, signal);
    return loadBackground(options, context, signal);
  };
}

async function loadServiceChanges(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  if (!options.stationId || context.activeTripId !== null) return undefined;
  const board = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(board, context, options.stationId)) return undefined;
  const serviceChanges = acceptedGate(context, 'service-change', board.responseIdentity, board.decidedAt, stationScope(context, options.stationId));
  return {
    stage: 2,
    serviceChanges: { gate: serviceChanges, disposition: 'resolved', vetoesApplied: true },
    tripServicePattern: 'not-applicable',
    invalidation: null,
  };
}

async function loadArrivals(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  if (!options.stationId || context.hasStoredTrainChoice) return undefined;
  const first = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(first, context, options.stationId)) return undefined;
  const second = await options.api.board(options.stationId, options.filters, signal);
  if (!isFreshBoard(second, context, options.stationId)
    || first.responseIdentity === second.responseIdentity
    || Date.parse(second.decidedAt) < Date.parse(first.decidedAt)) return undefined;

  const scope = stationScope(context, options.stationId);
  const firstSnapshot = acceptedGate(context, 'arrivals', first.responseIdentity, first.decidedAt, scope);
  const secondSnapshot = acceptedGate(context, 'arrivals', second.responseIdentity, second.decidedAt, scope);
  options.artifacts.selectedBoard = second;
  return {
    stage: 3,
    feedRecovery: {
      gate: acceptedGate(context, 'feed-health', second.responseIdentity, second.decidedAt, scope),
      disposition: 'readmitted',
    },
    trainReadmission: {
      gate: acceptedGate(context, 'train-admission', second.responseIdentity, second.decidedAt, scope),
      disposition: 'admitted',
    },
    arrivals: {
      gate: acceptedGate(
        context,
        'arrivals',
        `${first.responseIdentity}:${second.responseIdentity}`,
        second.decidedAt,
        scope,
      ),
      disposition: 'current',
      freshSnapshotCount: 2,
      freshSnapshots: [firstSnapshot, secondSnapshot],
    },
    storedTrainChoice: 'none',
    invalidation: null,
  };
}

async function loadBackground(
  options: AppReconnectionLoaderOptions,
  context: PreservedReconnectionContext,
  signal: AbortSignal,
): Promise<ReconnectionStageResult | undefined> {
  const overlay = await options.api.mapOverlay(context.mapTuple.theme, signal);
  if (!isFreshOverlay(overlay, context)) return undefined;
  const mapScope = exactScope(context, 'map', context.mapTuple.viewportKey);
  const savedScope = exactScope(context, 'context', context.recovery.contextKey);
  const mapGate = acceptedGate(context, 'maps', overlay.responseIdentity, overlay.decidedAt, mapScope);
  const savedGate: OwnerAcceptance = options.hasUnrelatedSavedRecords
    ? failClosedGate(context, 'saved', overlay.decidedAt, savedScope, 'Saved-station owners were not refreshed by this request.')
    : acceptedGate(context, 'saved', `${overlay.responseIdentity}:empty-saved-scope`, overlay.decidedAt, savedScope);
  options.artifacts.mapOverlay = overlay;
  return {
    stage: 5,
    maps: { gate: mapGate, disposition: 'refreshed' },
    unrelatedSaved: {
      gate: savedGate,
      disposition: savedGate.disposition === 'accepted-fresh' ? 'refreshed' : 'unchanged-fail-closed',
    },
  };
}

function acceptedGate(
  context: PreservedReconnectionContext,
  domain: OwnerAcceptance['domain'],
  evidenceId: string,
  evidenceAt: string,
  scopeMembership: readonly ReconnectionScopeMembership[],
): OwnerAcceptance {
  return {
    domain,
    ownerId: `${domain}-owner`,
    evidenceId,
    evidenceAt,
    acceptedAt: evidenceAt,
    recoveryEpochId: context.recovery.epochId,
    requestIdentity: context.recovery.requestIdentity,
    generation: context.recovery.generation,
    activeTripId: context.recovery.activeTripId,
    contextKey: context.recovery.contextKey,
    scopeMembership,
    disposition: 'accepted-fresh',
  };
}

function failClosedGate(
  context: PreservedReconnectionContext,
  domain: OwnerAcceptance['domain'],
  acceptedAt: string,
  scopeMembership: readonly ReconnectionScopeMembership[],
  reason: string,
): OwnerAcceptance {
  return {
    ...acceptedGate(context, domain, `${context.recovery.requestIdentity}:${domain}:unavailable`, acceptedAt, scopeMembership),
    disposition: 'governed-fail-closed',
    reason,
  };
}

function stationScope(context: PreservedReconnectionContext, stationId: string): readonly ReconnectionScopeMembership[] {
  return exactScope(context, 'station', stationId);
}

function exactScope(
  context: PreservedReconnectionContext,
  kind: ReconnectionScopeMembership['kind'],
  id: string,
): readonly ReconnectionScopeMembership[] {
  const scope = context.recovery.eligibleScopes.find((candidate) => candidate.kind === kind && candidate.id === id);
  if (!scope) throw new Error(`Recovery scope ${kind}:${id} is not eligible`);
  return [scope];
}

function isFreshBoard(
  board: BoardEnvelopeDto,
  context: PreservedReconnectionContext,
  stationId: string,
): boolean {
  return board.cacheState === 'network'
    && board.runtime.availability === 'available'
    && board.data?.mode === 'live'
    && board.data.station?.id === stationId
    && board.data.capabilities.arrivals === 'available'
    && board.data.directions.length > 0
    && board.data.sourceHealth.some(({ source, state }) => source === 'gtfs-rt' && state === 'current')
    && freshInstant(board.decidedAt, context.recovery.startedAt)
    && freshInstant(board.serverTime, context.recovery.startedAt);
}

function isFreshOverlay(overlay: MapOverlayEnvelopeDto, context: PreservedReconnectionContext): boolean {
  return overlay.cacheState === 'network'
    && overlay.runtime.availability === 'available'
    && overlay.data?.theme === context.mapTuple.theme
    && typeof overlay.data.serviceEpoch === 'string'
    && overlay.data.serviceEpoch.length > 0
    && freshInstant(overlay.decidedAt, context.recovery.startedAt)
    && freshInstant(overlay.serverTime, context.recovery.startedAt);
}

function freshInstant(candidate: string, epoch: string): boolean {
  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === candidate && parsed >= Date.parse(epoch);
}
