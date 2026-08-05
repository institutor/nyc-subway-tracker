import { TransitApiError } from '../api/client';
import {
  acceptReconnectionStage,
  commitReconnectionStage,
  createReconnectionState,
  presentReconnectionStage,
  requestReconnectionStage,
  type OwnerAcceptance,
  type PreservedReconnectionContext,
  type ReconnectionInitialPresentation,
  type ReconnectionInvalidation,
  type ReconnectionScopeKind,
  type ReconnectionScopeMembership,
  type ReconnectionStage,
  type ReconnectionStageResult,
  type ReconnectionState,
} from '../../shared/domain/reconnection';

export interface ReconnectionStageRequest {
  readonly stage: ReconnectionStage;
  readonly state: ReconnectionState;
  readonly context: PreservedReconnectionContext;
}

export interface ReconnectionTransition {
  readonly phase: 'requested' | 'presented';
  readonly stage: ReconnectionStage;
  readonly state: ReconnectionState;
}

export interface RunReconnectionOptions {
  readonly context: PreservedReconnectionContext;
  readonly initial: ReconnectionInitialPresentation;
  readonly loadStage: (
    request: ReconnectionStageRequest,
    signal: AbortSignal,
  ) => Promise<ReconnectionStageResult | undefined>;
  readonly onTransition?: (transition: ReconnectionTransition) => void;
  readonly signal?: AbortSignal;
  readonly now?: () => Date;
}

export type RunReconnectionResult =
  | { readonly kind: 'complete'; readonly state: ReconnectionState }
  | { readonly kind: 'network-unreachable'; readonly state: ReconnectionState }
  | { readonly kind: 'aborted'; readonly state: ReconnectionState };

export async function runReconnection(options: RunReconnectionOptions): Promise<RunReconnectionResult> {
  const signal = options.signal ?? new AbortController().signal;
  const now = options.now ?? (() => new Date());
  let state = createReconnectionState(options.context, options.initial);

  for (const stage of [1, 2, 3, 4, 5] as const) {
    if (signal.aborted) return { kind: 'aborted', state };
    state = requestReconnectionStage(state, stage);
    options.onTransition?.({ phase: 'requested', stage, state });

    let result: ReconnectionStageResult;
    let acceptedThrough: string;
    try {
      const loaded = await options.loadStage({ stage, state, context: state.context }, signal);
      if (signal.aborted) return { kind: 'aborted', state };
      acceptedThrough = exactNow(now);
      result = loaded
        ? bindLocalAcceptance(loaded, acceptedThrough)
        : createFailClosedReconnectionStage(state, stage, 'Owner endpoint is unavailable.', acceptedThrough);
    } catch (error) {
      if (signal.aborted || isAbort(error)) return { kind: 'aborted', state };
      if (error instanceof TransitApiError && error.category === 'network-unreachable') {
        return { kind: 'network-unreachable', state };
      }
      acceptedThrough = exactNow(now);
      result = createFailClosedReconnectionStage(state, stage, 'Owner result is unavailable.', acceptedThrough);
    }

    try {
      state = acceptReconnectionStage(state, result, acceptedThrough);
    } catch {
      acceptedThrough = exactNow(now);
      state = acceptReconnectionStage(
        state,
        createFailClosedReconnectionStage(state, stage, 'Owner evidence was rejected.', acceptedThrough),
        acceptedThrough,
      );
    }
    state = commitReconnectionStage(state, stage);
    state = presentReconnectionStage(state, stage);
    options.onTransition?.({ phase: 'presented', stage, state });
  }

  return { kind: 'complete', state };
}

export function createFailClosedReconnectionStage(
  state: ReconnectionState,
  stage: ReconnectionStage,
  reason: string,
  acceptedAt: string,
): ReconnectionStageResult {
  const gate = (domain: OwnerAcceptance['domain'], suffix = domain): OwnerAcceptance => ({
    domain,
    ownerId: `${domain}-owner`,
    evidenceId: `${state.context.recovery.requestIdentity}:${stage}:${suffix}:unavailable`,
    evidenceAt: acceptedAt,
    acceptedAt,
    recoveryEpochId: state.context.recovery.epochId,
    requestIdentity: state.context.recovery.requestIdentity,
    generation: state.context.recovery.generation,
    activeTripId: state.context.recovery.activeTripId,
    contextKey: state.context.recovery.contextKey,
    scopeMembership: state.context.recovery.ownerScopes[domain],
    disposition: 'governed-fail-closed',
    reason,
  });
  const warning = (
    ownerGate: OwnerAcceptance,
    changedFact: string,
    consequence: string,
  ): ReconnectionInvalidation => ({
    id: `${state.context.recovery.requestIdentity}:warning:${stage}`,
    stage: stage as 1 | 2 | 3 | 4,
    ownerGate,
    changedFact,
    scopes: warningScopes(ownerGate.scopeMembership),
    consequence,
    lastVerifiedDecisionPoint: state.context.manualCursor
      ? { id: state.context.manualCursor.stopId, label: `Stored trip point ${state.context.manualCursor.stopId}` }
      : null,
    verifiedAlternative: null,
  });

  if (stage === 1) {
    const equipment = gate('equipment');
    const accessiblePath = gate('accessible-path');
    const required = state.context.activeTripId !== null && state.context.accessibleRouteOnly;
    return {
      stage,
      equipment: { gate: equipment, disposition: 'unknown' },
      accessiblePath: {
        gate: accessiblePath,
        requiredForActiveTrip: required,
        completeness: 'incomplete-or-unknown',
        disposition: 'unverified',
      },
      invalidation: required
        ? warning(accessiblePath, 'The required accessible path could not be reverified.', 'Do not continue on the stored accessible path.')
        : null,
    };
  }
  if (stage === 2) {
    const serviceChanges = gate('service-change');
    const active = state.context.activeTripId !== null;
    return {
      stage,
      serviceChanges: { gate: serviceChanges, disposition: 'unresolved-fail-closed', vetoesApplied: true },
      tripServicePattern: active ? 'unverified' : 'not-applicable',
      invalidation: active
        ? warning(serviceChanges, 'Service changes could not be resolved for the stored trip.', 'Do not rely on the stored service pattern.')
        : null,
    };
  }
  if (stage === 3) {
    const feed = gate('feed-health');
    const train = gate('train-admission');
    const arrivals = gate('arrivals');
    const active = state.context.hasStoredTrainChoice;
    return {
      stage,
      feedRecovery: { gate: feed, disposition: 'blocked' },
      trainReadmission: { gate: train, disposition: 'blocked' },
      arrivals: { gate: arrivals, disposition: 'withheld', freshSnapshotCount: 0, freshSnapshots: [] },
      storedTrainChoice: active ? 'unverified' : 'none',
      invalidation: active
        ? warning(train, 'The stored train choice could not be readmitted.', 'Use the historical arrival only as a past observation.')
        : null,
    };
  }
  if (stage === 4) {
    const positioning = gate('positioning');
    const transferGuidance = gate('transfer-guidance');
    const requiredOwner = state.context.guidanceRequirements.positioning === 'required'
      ? positioning
      : state.context.guidanceRequirements.transfer === 'required' ? transferGuidance : null;
    return {
      stage,
      positioning: {
        gate: positioning,
        requirement: state.context.guidanceRequirements.positioning,
        disposition: 'removed',
      },
      transferGuidance: {
        gate: transferGuidance,
        requirement: state.context.guidanceRequirements.transfer,
        disposition: 'removed',
      },
      invalidation: requiredOwner
        ? warning(requiredOwner, 'Required positioning or transfer guidance could not be reverified.', 'Stop at the last verified decision point.')
        : null,
    };
  }
  return {
    stage,
    maps: { gate: gate('maps'), disposition: 'unchanged-fail-closed' },
    unrelatedSaved: { gate: gate('saved'), disposition: 'unchanged-fail-closed' },
  };
}

function bindLocalAcceptance<T>(value: T, acceptedAt: string): T {
  if (Array.isArray(value)) return value.map((entry) => bindLocalAcceptance(entry, acceptedAt)) as T;
  if (value === null || typeof value !== 'object') return value;
  const candidate = value as Record<string, unknown>;
  const bound: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(candidate)) {
    bound[key] = bindLocalAcceptance(entry, acceptedAt);
  }
  if ('domain' in candidate && 'ownerId' in candidate && 'evidenceId' in candidate && 'acceptedAt' in candidate) {
    bound.acceptedAt = acceptedAt;
  }
  return bound as T;
}

function warningScopes(scopes: readonly ReconnectionScopeMembership[]) {
  const applicable = scopes.filter(isInvalidationScopeMembership);
  if (applicable.length === 0) throw new Error('A fail-closed warning requires an eligible scope');
  return applicable.map((scope) => ({ ...scope, label: `${scope.kind} ${scope.id}` }));
}

function isInvalidationScopeMembership(
  scope: ReconnectionScopeMembership,
): scope is ReconnectionScopeMembership & { readonly kind: ReconnectionScopeKind } {
  return scope.kind !== 'context' && scope.kind !== 'map' && scope.kind !== 'saved-record';
}

function exactNow(now: () => Date): string {
  const value = now();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('Recovery clock returned an invalid instant');
  return new Date(value.getTime()).toISOString();
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
