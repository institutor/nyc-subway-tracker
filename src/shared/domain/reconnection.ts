export type ReconnectionStage = 1 | 2 | 3 | 4 | 5;

export type ReconnectionOwnerDomain =
  | 'equipment'
  | 'accessible-path'
  | 'service-change'
  | 'feed-health'
  | 'train-admission'
  | 'arrivals'
  | 'positioning'
  | 'transfer-guidance'
  | 'maps'
  | 'saved';

export type ReconnectionScopeKind =
  | 'route'
  | 'direction'
  | 'station'
  | 'segment'
  | 'leg'
  | 'transfer'
  | 'entrance'
  | 'passage'
  | 'platform'
  | 'machine'
  | 'connection'
  | 'path'
  | 'train';

export interface ReconnectionScopeMembership {
  readonly kind: ReconnectionScopeKind | 'context' | 'map' | 'saved-record';
  readonly id: string;
}

export interface ReconnectionRequestOwnership {
  readonly epochId: string;
  readonly requestIdentity: string;
  readonly generation: number;
  readonly startedAt: string;
  readonly activeTripId: string | null;
  readonly contextKey: string;
  readonly eligibleScopes: readonly ReconnectionScopeMembership[];
  readonly ownerScopes: Readonly<Record<ReconnectionOwnerDomain, readonly ReconnectionScopeMembership[]>>;
}

interface OwnerAcceptanceBase {
  readonly domain: ReconnectionOwnerDomain;
  readonly ownerId: string;
  readonly evidenceId: string;
  readonly evidenceAt: string;
  readonly acceptedAt: string;
  readonly recoveryEpochId: string;
  readonly requestIdentity: string;
  readonly generation: number;
  readonly activeTripId: string | null;
  readonly contextKey: string;
  readonly scopeMembership: readonly ReconnectionScopeMembership[];
}

export type OwnerAcceptance =
  | (OwnerAcceptanceBase & {
      readonly disposition: 'accepted-fresh';
      readonly reason?: never;
    })
  | (OwnerAcceptanceBase & {
      readonly disposition: 'governed-fail-closed';
      readonly reason: string;
    });

export interface ReconnectionInvalidationScope {
  readonly kind: ReconnectionScopeKind;
  readonly id: string;
  readonly label: string;
}

export interface VerifiedReconnectionAlternative {
  readonly id: string;
  readonly summary: string;
  readonly gate: OwnerAcceptance & { readonly disposition: 'accepted-fresh' };
}

export interface ReconnectionInvalidation {
  readonly id: string;
  readonly stage: 1 | 2 | 3 | 4;
  readonly ownerGate: OwnerAcceptance;
  readonly changedFact: string;
  readonly scopes: readonly ReconnectionInvalidationScope[];
  readonly consequence: string;
  readonly lastVerifiedDecisionPoint: {
    readonly id: string;
    readonly label: string;
  } | null;
  readonly verifiedAlternative: VerifiedReconnectionAlternative | null;
}

export interface EquipmentAndPathStageResult {
  readonly stage: 1;
  readonly equipment: {
    readonly gate: OwnerAcceptance;
    readonly disposition:
      | 'verified-operational'
      | 'verified-out-of-service'
      | 'unknown'
      | 'last-known-outage-rechecking';
  };
  readonly accessiblePath: {
    readonly gate: OwnerAcceptance;
    readonly requiredForActiveTrip: boolean;
    readonly completeness: 'complete-exact-path' | 'incomplete-or-unknown';
    readonly disposition: 'verified' | 'unusable' | 'unverified';
  };
  readonly invalidation: ReconnectionInvalidation | null;
}

export interface ServiceChangesStageResult {
  readonly stage: 2;
  readonly serviceChanges: {
    readonly gate: OwnerAcceptance;
    readonly disposition: 'resolved' | 'unresolved-fail-closed';
    readonly vetoesApplied: boolean;
  };
  readonly tripServicePattern: 'verified' | 'unusable' | 'unverified' | 'not-applicable';
  readonly invalidation: ReconnectionInvalidation | null;
}

export interface ArrivalsStageResult {
  readonly stage: 3;
  readonly feedRecovery: {
    readonly gate: OwnerAcceptance;
    readonly disposition: 'readmitted' | 'blocked';
  };
  readonly trainReadmission: {
    readonly gate: OwnerAcceptance;
    readonly disposition: 'admitted' | 'blocked';
  };
  readonly arrivals: {
    readonly gate: OwnerAcceptance;
    readonly disposition: 'current' | 'withheld';
    readonly freshSnapshotCount: number;
    readonly freshSnapshots: readonly OwnerAcceptance[];
  };
  readonly storedTrainChoice: 'none' | 'verified' | 'unusable' | 'unverified';
  readonly invalidation: ReconnectionInvalidation | null;
}

export interface GuidanceStageResult {
  readonly stage: 4;
  readonly positioning: {
    readonly gate: OwnerAcceptance;
    readonly requirement: 'required' | 'optional' | 'none';
    readonly disposition: 'verified' | 'removed';
  };
  readonly transferGuidance: {
    readonly gate: OwnerAcceptance;
    readonly requirement: 'required' | 'optional' | 'none';
    readonly disposition: 'verified' | 'removed';
  };
  readonly invalidation: ReconnectionInvalidation | null;
}

export interface BackgroundStageResult {
  readonly stage: 5;
  readonly maps: {
    readonly gate: OwnerAcceptance;
    readonly disposition: 'refreshed' | 'unchanged-fail-closed';
  };
  readonly unrelatedSaved: {
    readonly gate: OwnerAcceptance;
    readonly disposition: 'refreshed' | 'unchanged-fail-closed';
  };
}

export type ReconnectionStageResult =
  | EquipmentAndPathStageResult
  | ServiceChangesStageResult
  | ArrivalsStageResult
  | GuidanceStageResult
  | BackgroundStageResult;

export interface PreservedReconnectionContext {
  readonly stationId: string | null;
  readonly direction: string;
  readonly routeFilters: readonly string[];
  readonly accessibleRouteOnly: boolean;
  readonly mapTuple: {
    readonly referenceMode: 'actual' | 'typical-weekday' | 'late-night';
    readonly theme: 'day' | 'night';
    readonly contentVersion: string;
    readonly viewportKey: string;
  };
  readonly activeTripId: string | null;
  readonly manualCursor: {
    readonly legIndex: number;
    readonly stopId: string;
  } | null;
  readonly hasStoredTrainChoice: boolean;
  readonly guidanceRequirements: {
    readonly positioning: 'required' | 'optional' | 'none';
    readonly transfer: 'required' | 'optional' | 'none';
  };
  readonly activeSurface: 'nearby' | 'station' | 'saved' | 'map' | 'commute';
  readonly scrollOffset: number;
  readonly focusTargetId: string | null;
  readonly readingAnchorId: string | null;
  readonly recovery: ReconnectionRequestOwnership;
}

export interface ReconnectionAuditEvent {
  readonly kind:
    | 'stage-requested'
    | 'stage-owner-accepted'
    | 'stage-committed'
    | 'warning-presented'
    | 'stage-presented'
    | 'warning-resolved';
  readonly stage: ReconnectionStage;
  readonly warningId?: string;
}

export interface ReconnectionStageRecord {
  readonly stage: ReconnectionStage;
  readonly status: 'blocked' | 'ready' | 'requested' | 'accepted' | 'committed' | 'presented';
  readonly result: ReconnectionStageResult | null;
}

export interface ReconnectionVisibleState {
  readonly activeWarnings: readonly ReconnectionInvalidation[];
  readonly currentArrivalsRestored: boolean;
  readonly positioningGuidance: 'historical' | 'verified-current' | 'removed' | 'absent';
  readonly transferGuidance: 'historical' | 'verified-current' | 'removed' | 'absent';
}

export interface ReconnectionState {
  readonly status: 'reconnecting' | 'complete';
  readonly currentStage: ReconnectionStage | null;
  readonly context: PreservedReconnectionContext;
  readonly stages: readonly ReconnectionStageRecord[];
  readonly visible: ReconnectionVisibleState;
  readonly audit: readonly ReconnectionAuditEvent[];
}

export interface ReconnectionInitialPresentation {
  readonly historicalPositioningGuidance: boolean;
  readonly historicalTransferGuidance?: boolean;
}

export type ReconnectionWarningResolution =
  | {
      readonly kind: 'owner-resolved';
      readonly gate: OwnerAcceptance & { readonly disposition: 'accepted-fresh' };
    }
  | {
      readonly kind: 'rider-replaced-decision';
      readonly actionId: string;
      readonly actedAt: string;
    };

export interface ResolveReconnectionWarningInput {
  readonly warningId: string;
  readonly resolution: ReconnectionWarningResolution;
}

export function createReconnectionState(
  context: PreservedReconnectionContext,
  initial: ReconnectionInitialPresentation,
): ReconnectionState {
  validateRequestOwnership(context);
  return immutableState({
    status: 'reconnecting',
    currentStage: 1,
    context,
    stages: ([1, 2, 3, 4, 5] as const).map((stage) => ({
      stage,
      status: stage === 1 ? 'ready' : 'blocked',
      result: null,
    })),
    visible: {
      activeWarnings: [],
      currentArrivalsRestored: false,
      positioningGuidance: initial.historicalPositioningGuidance ? 'historical' : 'absent',
      transferGuidance: initial.historicalTransferGuidance ? 'historical' : 'absent',
    },
    audit: [],
  });
}

export function requestReconnectionStage(state: ReconnectionState, stage: ReconnectionStage): ReconnectionState {
  assertCurrentStage(state, stage);
  assertStageStatus(state, stage, 'ready', `Stage ${stage} is not ready to be requested`);
  return transitionStage(state, stage, 'requested', null, 'stage-requested');
}

export function acceptReconnectionStage(
  state: ReconnectionState,
  result: ReconnectionStageResult,
  acceptedThrough: string,
): ReconnectionState {
  const stage = result.stage;
  assertCurrentStage(state, stage);
  assertStageStatus(state, stage, 'requested', `Stage ${stage} must be requested before owner acceptance`);
  if (!canonicalInstant(acceptedThrough)
    || Date.parse(acceptedThrough) < Date.parse(state.context.recovery.startedAt)) {
    throw new Error('Owner acceptance requires an exact local receipt time inside the recovery epoch');
  }
  validateStageOwnerGates(result, state.context.recovery, acceptedThrough);
  validateStageDependencies(state, result);
  validateStageSemantics(result, state.context.recovery, acceptedThrough);
  return transitionStage(state, stage, 'accepted', result, 'stage-owner-accepted');
}

function validateStageDependencies(state: ReconnectionState, result: ReconnectionStageResult): void {
  if (result.stage !== 3
    || state.context.activeTripId === null
    || result.arrivals.disposition !== 'current') return;

  const serviceResult = stageRecord(state, 2).result;
  if (serviceResult?.stage !== 2
    || serviceResult.serviceChanges.disposition !== 'resolved'
    || serviceResult.serviceChanges.gate.disposition !== 'accepted-fresh'
    || serviceResult.tripServicePattern !== 'verified') {
    throw new Error('The active trip service pattern must be verified before restoring current arrivals');
  }
}

export function commitReconnectionStage(state: ReconnectionState, stage: ReconnectionStage): ReconnectionState {
  assertCurrentStage(state, stage);
  assertStageStatus(state, stage, 'accepted', `Stage ${stage} must be accepted before commit`);
  return transitionStage(state, stage, 'committed', stageRecord(state, stage).result, 'stage-committed');
}

export function presentReconnectionStage(state: ReconnectionState, stage: ReconnectionStage): ReconnectionState {
  assertCurrentStage(state, stage);
  assertStageStatus(state, stage, 'committed', `Stage ${stage} must be committed before presentation`);

  const result = stageRecord(state, stage).result;
  if (!result) throw new Error(`Stage ${stage} has no accepted owner result`);
  const invalidation = result.stage === 5 ? null : result.invalidation;
  const nextStage = stage === 5 ? null : ((stage + 1) as ReconnectionStage);
  const stages = state.stages.map((record) => {
    if (record.stage === stage) return { ...record, status: 'presented' as const };
    if (record.stage === nextStage) return { ...record, status: 'ready' as const };
    return record;
  });
  let stageVisible: ReconnectionVisibleState = state.visible;
  if (result.stage === 3) {
    stageVisible = { ...stageVisible, currentArrivalsRestored: result.arrivals.disposition === 'current' };
  }
  if (result.stage === 4) {
    stageVisible = {
      ...stageVisible,
      positioningGuidance: result.positioning.disposition === 'verified' ? 'verified-current' : 'removed',
      transferGuidance: result.transferGuidance.disposition === 'verified' ? 'verified-current' : 'removed',
    };
  }
  return immutableState({
    ...state,
    status: nextStage === null ? 'complete' : 'reconnecting',
    currentStage: nextStage,
    stages,
    visible: invalidation === null ? stageVisible : {
      ...stageVisible,
      activeWarnings: [...stageVisible.activeWarnings, invalidation],
    },
    audit: [
      ...state.audit,
      ...(invalidation === null
        ? []
        : [{ kind: 'warning-presented' as const, stage, warningId: invalidation.id }]),
      { kind: 'stage-presented', stage },
    ],
  });
}

export function resolveReconnectionWarning(
  state: ReconnectionState,
  input: ResolveReconnectionWarningInput,
  acceptedThrough: string,
): ReconnectionState {
  const warning = state.visible.activeWarnings.find((candidate) => candidate.id === input?.warningId);
  if (!warning) throw new Error('Exact active reconnection warning is required');
  if (!canonicalInstant(acceptedThrough)
    || Date.parse(acceptedThrough) < Date.parse(state.context.recovery.startedAt)) {
    throw new Error('Warning resolution requires an exact local receipt time inside the recovery epoch');
  }
  const resolution = input.resolution as ReconnectionWarningResolution | undefined;
  if (resolution?.kind === 'owner-resolved') {
    validateOwnerGate(
      resolution.gate,
      warning.ownerGate.domain,
      'Warning resolution',
      state.context.recovery,
      acceptedThrough,
    );
    if (resolution.gate.disposition !== 'accepted-fresh') {
      throw new Error('Warning resolution requires fresh owner-accepted evidence');
    }
    if (Date.parse(resolution.gate.acceptedAt) < Date.parse(warning.ownerGate.acceptedAt)) {
      throw new Error('Warning resolution evidence cannot predate the invalidation');
    }
    if (resolution.gate.evidenceId === warning.ownerGate.evidenceId) {
      throw new Error('Warning resolution requires new evidence for the exact invalidation');
    }
  } else if (resolution?.kind === 'rider-replaced-decision') {
    if (!nonempty(resolution.actionId) || !canonicalInstant(resolution.actedAt)) {
      throw new Error('Governed rider replacement requires an exact action and time');
    }
    if (Date.parse(resolution.actedAt) < Date.parse(state.context.recovery.startedAt)
      || Date.parse(resolution.actedAt) < Date.parse(warning.ownerGate.acceptedAt)) {
      throw new Error('Governed rider replacement violates recovery chronology');
    }
    if (Date.parse(resolution.actedAt) > Date.parse(acceptedThrough)) {
      throw new Error('Governed rider replacement cannot postdate the local receipt');
    }
  } else {
    throw new Error('Acknowledgement alone does not resolve an active-trip invalidation');
  }

  return immutableState({
    ...state,
    visible: {
      ...state.visible,
      activeWarnings: state.visible.activeWarnings.filter((candidate) => candidate.id !== warning.id),
    },
    audit: [...state.audit, { kind: 'warning-resolved', stage: warning.stage, warningId: warning.id }],
  });
}

function transitionStage(
  state: ReconnectionState,
  stage: ReconnectionStage,
  status: ReconnectionStageRecord['status'],
  result: ReconnectionStageResult | null,
  auditKind: ReconnectionAuditEvent['kind'],
): ReconnectionState {
  return immutableState({
    ...state,
    stages: state.stages.map((record) => record.stage === stage ? { ...record, status, result } : record),
    audit: [...state.audit, { kind: auditKind, stage }],
  });
}

function validateStageOwnerGates(
  result: ReconnectionStageResult,
  ownership: ReconnectionRequestOwnership,
  acceptedThrough: string,
): void {
  switch (result.stage) {
    case 1:
      validateOwnerGate(result.equipment?.gate, 'equipment', 'Equipment', ownership, acceptedThrough);
      validateOwnerGate(result.accessiblePath?.gate, 'accessible-path', 'Accessible path', ownership, acceptedThrough);
      return;
    case 2:
      validateOwnerGate(result.serviceChanges?.gate, 'service-change', 'Service change', ownership, acceptedThrough);
      return;
    case 3:
      validateOwnerGate(result.feedRecovery?.gate, 'feed-health', 'Feed recovery', ownership, acceptedThrough);
      validateOwnerGate(result.trainReadmission?.gate, 'train-admission', 'Train readmission', ownership, acceptedThrough);
      validateOwnerGate(result.arrivals?.gate, 'arrivals', 'Arrivals', ownership, acceptedThrough);
      return;
    case 4:
      validateOwnerGate(result.positioning?.gate, 'positioning', 'Positioning', ownership, acceptedThrough);
      validateOwnerGate(result.transferGuidance?.gate, 'transfer-guidance', 'Transfer guidance', ownership, acceptedThrough);
      return;
    case 5:
      validateOwnerGate(result.maps?.gate, 'maps', 'Maps', ownership, acceptedThrough);
      validateOwnerGate(result.unrelatedSaved?.gate, 'saved', 'Saved', ownership, acceptedThrough);
  }
}

function validateStageSemantics(
  result: ReconnectionStageResult,
  ownership: ReconnectionRequestOwnership,
  acceptedThrough: string,
): void {
  switch (result.stage) {
    case 1: {
      if (typeof result.accessiblePath.requiredForActiveTrip !== 'boolean') {
        throw new Error('Stage 1 requires an exact active-trip path requirement');
      }
      if (result.equipment.disposition !== 'verified-operational'
        && result.equipment.disposition !== 'verified-out-of-service'
        && result.equipment.disposition !== 'unknown'
        && result.equipment.disposition !== 'last-known-outage-rechecking') {
        throw new Error('Equipment disposition must be an exact governed state');
      }
      if (result.accessiblePath.disposition !== 'verified'
        && result.accessiblePath.disposition !== 'unusable'
        && result.accessiblePath.disposition !== 'unverified') {
        throw new Error('Accessible path disposition must be an exact governed state');
      }
      if (result.accessiblePath.completeness !== 'complete-exact-path'
        && result.accessiblePath.completeness !== 'incomplete-or-unknown') {
        throw new Error('Accessible path completeness must be exact');
      }
      if (result.equipment.gate.disposition === 'governed-fail-closed'
        && result.equipment.disposition !== 'unknown'
        && result.equipment.disposition !== 'last-known-outage-rechecking') {
        throw new Error('Fail-closed equipment evidence cannot restore a current equipment claim');
      }
      if (result.accessiblePath.gate.disposition === 'governed-fail-closed'
        && result.accessiblePath.disposition !== 'unverified') {
        throw new Error('Fail-closed accessible path evidence cannot restore a verified path claim');
      }
      if ((result.accessiblePath.disposition === 'verified'
          || result.accessiblePath.disposition === 'unusable')
        && result.accessiblePath.completeness !== 'complete-exact-path') {
        throw new Error('A current path decision requires a complete exact accessible path');
      }
      if (result.accessiblePath.disposition === 'unverified'
        && result.accessiblePath.completeness !== 'incomplete-or-unknown') {
        throw new Error('An unverified path cannot claim a complete exact accessible path');
      }
      validateInvalidation(
        result.accessiblePath.requiredForActiveTrip && result.accessiblePath.disposition !== 'verified',
        result.invalidation,
        result.stage,
        [result.equipment.gate, result.accessiblePath.gate],
        ownership,
        acceptedThrough,
      );
      return;
    }
    case 2:
      if (result.serviceChanges.disposition !== 'resolved'
        && result.serviceChanges.disposition !== 'unresolved-fail-closed') {
        throw new Error('Service-change disposition must be an exact governed state');
      }
      if (result.tripServicePattern !== 'verified'
        && result.tripServicePattern !== 'unusable'
        && result.tripServicePattern !== 'unverified'
        && result.tripServicePattern !== 'not-applicable') {
        throw new Error('Trip service pattern must be an exact governed state');
      }
      if ((ownership.activeTripId === null) !== (result.tripServicePattern === 'not-applicable')) {
        throw new Error('Trip service pattern applicability must match the exact active trip');
      }
      if (result.serviceChanges.vetoesApplied !== true) {
        throw new Error('Every service-change veto must be applied before stage 2 owner acceptance');
      }
      if ((result.serviceChanges.gate.disposition === 'accepted-fresh')
        !== (result.serviceChanges.disposition === 'resolved')) {
        throw new Error('Service-change resolution must match its owner acceptance gate');
      }
      validateInvalidation(
        ownership.activeTripId !== null && result.tripServicePattern !== 'verified',
        result.invalidation,
        result.stage,
        [result.serviceChanges.gate],
        ownership,
        acceptedThrough,
      );
      return;
    case 3:
      if (result.feedRecovery.disposition !== 'readmitted'
        && result.feedRecovery.disposition !== 'blocked') {
        throw new Error('Feed recovery disposition must be an exact governed state');
      }
      if (result.trainReadmission.disposition !== 'admitted'
        && result.trainReadmission.disposition !== 'blocked') {
        throw new Error('Train readmission disposition must be an exact governed state');
      }
      if (result.arrivals.disposition !== 'current' && result.arrivals.disposition !== 'withheld') {
        throw new Error('Arrival disposition must be an exact governed state');
      }
      if (result.storedTrainChoice !== 'none'
        && result.storedTrainChoice !== 'verified'
        && result.storedTrainChoice !== 'unusable'
        && result.storedTrainChoice !== 'unverified') {
        throw new Error('Stored train choice must be an exact governed state');
      }
      if (!Number.isSafeInteger(result.arrivals.freshSnapshotCount)
        || result.arrivals.freshSnapshotCount < 0) {
        throw new Error('Arrival recovery snapshot count must be a nonnegative whole number');
      }
      if (!Array.isArray(result.arrivals.freshSnapshots)
        || result.arrivals.freshSnapshots.length !== result.arrivals.freshSnapshotCount) {
        throw new Error('Arrival recovery requires exact fresh snapshot evidence for every counted snapshot');
      }
      for (const snapshot of result.arrivals.freshSnapshots) {
        validateOwnerGate(snapshot, 'arrivals', 'Arrival snapshot', ownership, acceptedThrough);
        if (snapshot.disposition !== 'accepted-fresh') {
          throw new Error('Arrival snapshots must be owner-accepted fresh evidence');
        }
      }
      if (new Set(result.arrivals.freshSnapshots.map(({ evidenceId }) => evidenceId)).size
        !== result.arrivals.freshSnapshots.length) {
        throw new Error('Arrival recovery snapshots require distinct evidence identities');
      }
      if (result.arrivals.disposition === 'current' && result.arrivals.freshSnapshotCount < 2) {
        throw new Error('One fresh arrival snapshot restores nothing');
      }
      if (result.feedRecovery.gate.disposition === 'governed-fail-closed'
        && result.feedRecovery.disposition !== 'blocked') {
        throw new Error('Fail-closed feed recovery cannot claim readmission');
      }
      if (result.trainReadmission.gate.disposition === 'governed-fail-closed'
        && result.trainReadmission.disposition !== 'blocked') {
        throw new Error('Fail-closed train admission cannot admit a train');
      }
      if (result.trainReadmission.disposition === 'admitted'
        && result.feedRecovery.disposition !== 'readmitted') {
        throw new Error('Train readmission cannot overtake owning feed recovery');
      }
      if (result.arrivals.gate.disposition === 'governed-fail-closed'
        && result.arrivals.disposition !== 'withheld') {
        throw new Error('Fail-closed arrival evidence cannot restore current arrivals');
      }
      if (result.arrivals.disposition === 'current'
        && (result.feedRecovery.gate.disposition !== 'accepted-fresh'
          || result.feedRecovery.disposition !== 'readmitted'
          || result.trainReadmission.gate.disposition !== 'accepted-fresh'
          || result.trainReadmission.disposition !== 'admitted'
          || result.arrivals.gate.disposition !== 'accepted-fresh')) {
        throw new Error('Current arrivals require complete owning feed recovery and train readmission');
      }
      validateInvalidation(
        result.storedTrainChoice === 'unusable' || result.storedTrainChoice === 'unverified',
        result.invalidation,
        result.stage,
        [result.feedRecovery.gate, result.trainReadmission.gate, result.arrivals.gate],
        ownership,
        acceptedThrough,
      );
      return;
    case 4: {
      validateGuidanceClaim(result.positioning, 'Positioning');
      validateGuidanceClaim(result.transferGuidance, 'Transfer guidance');
      const requiredDecisionLost = (result.positioning.requirement === 'required'
          && result.positioning.disposition === 'removed')
        || (result.transferGuidance.requirement === 'required'
          && result.transferGuidance.disposition === 'removed');
      validateInvalidation(
        requiredDecisionLost,
        result.invalidation,
        result.stage,
        [result.positioning.gate, result.transferGuidance.gate],
        ownership,
        acceptedThrough,
      );
      return;
    }
    case 5:
      validateBackgroundClaim(result.maps.gate, result.maps.disposition, 'Maps');
      validateBackgroundClaim(result.unrelatedSaved.gate, result.unrelatedSaved.disposition, 'Saved');
  }
}

function validateGuidanceClaim(
  claim: GuidanceStageResult['positioning'] | GuidanceStageResult['transferGuidance'],
  label: string,
): void {
  if (claim.requirement !== 'required' && claim.requirement !== 'optional' && claim.requirement !== 'none') {
    throw new Error(`${label} guidance requirement must be exact`);
  }
  if (claim.disposition !== 'verified' && claim.disposition !== 'removed') {
    throw new Error(`${label} guidance disposition must be exact`);
  }
  if (claim.gate.disposition === 'governed-fail-closed' && claim.disposition !== 'removed') {
    throw new Error(`${label} fail-closed evidence cannot restore guidance`);
  }
  if (claim.requirement === 'none' && claim.disposition !== 'removed') {
    throw new Error(`${label} cannot be verified when it is not applicable`);
  }
}

function validateBackgroundClaim(
  gate: OwnerAcceptance,
  disposition: BackgroundStageResult['maps']['disposition'],
  label: string,
): void {
  if ((gate.disposition === 'accepted-fresh') !== (disposition === 'refreshed')) {
    throw new Error(`${label} refresh disposition must match its owner acceptance gate`);
  }
}

function validateInvalidation(
  required: boolean,
  invalidation: ReconnectionInvalidation | null,
  stage: 1 | 2 | 3 | 4,
  ownerGates: readonly OwnerAcceptance[],
  ownership: ReconnectionRequestOwnership,
  acceptedThrough: string,
): void {
  if (required && invalidation === null) {
    throw new Error(`Stage ${stage} requires a required active-trip invalidation warning`);
  }
  if (!required && invalidation !== null) {
    throw new Error(`Stage ${stage} cannot invent an active-trip invalidation`);
  }
  if (invalidation === null) return;
  if (invalidation.stage !== stage) throw new Error('Active-trip invalidation stage must match its owner result');
  if (!nonempty(invalidation.id) || !nonempty(invalidation.changedFact) || !nonempty(invalidation.consequence)) {
    throw new Error('Active-trip invalidation requires exact identity, changed fact, and consequence');
  }
  if (!Array.isArray(invalidation.scopes) || invalidation.scopes.length === 0
    || invalidation.scopes.some((scope) => !scope || !nonempty(scope.id) || !nonempty(scope.label))) {
    throw new Error('Active-trip invalidation requires at least one exact affected scope');
  }
  if (invalidation.scopes.some((scope) => !validInvalidationScopeKind(scope.kind))) {
    throw new Error('Active-trip invalidation requires an exact affected scope kind');
  }
  if (invalidation.scopes.some((scope) => !hasEligibleScope(ownership, scope))) {
    throw new Error('Active-trip invalidation scope must belong to the exact eligible recovery scope');
  }
  if (!ownerGates.some((gate) => sameOwnerGate(gate, invalidation.ownerGate))) {
    throw new Error('Active-trip invalidation must retain a gate accepted by an owner in the current stage');
  }
  if (invalidation.lastVerifiedDecisionPoint !== null
    && (!nonempty(invalidation.lastVerifiedDecisionPoint.id)
      || !nonempty(invalidation.lastVerifiedDecisionPoint.label))) {
    throw new Error('Last verified decision point must have an exact identity and label');
  }
  if (invalidation.verifiedAlternative !== null) {
    const alternative = invalidation.verifiedAlternative;
    if (!nonempty(alternative.id) || !nonempty(alternative.summary)) {
      throw new Error('Owner-verified alternative requires an exact identity and summary');
    }
    validateOwnerGate(alternative.gate, alternative.gate?.domain, 'Alternative', ownership, acceptedThrough);
    if (alternative.gate.disposition !== 'accepted-fresh') {
      throw new Error('An alternative must be freshly verified by its owner');
    }
  }
}

function sameOwnerGate(left: OwnerAcceptance, right: OwnerAcceptance): boolean {
  return left.domain === right?.domain
    && left.ownerId === right.ownerId
    && left.evidenceId === right.evidenceId
    && left.evidenceAt === right.evidenceAt
    && left.acceptedAt === right.acceptedAt
    && left.recoveryEpochId === right.recoveryEpochId
    && left.requestIdentity === right.requestIdentity
    && left.generation === right.generation
    && left.activeTripId === right.activeTripId
    && left.contextKey === right.contextKey
    && sameScopeMembership(left.scopeMembership, right.scopeMembership)
    && left.disposition === right.disposition
    && left.reason === right.reason;
}

function validInvalidationScopeKind(value: unknown): value is ReconnectionScopeKind {
  return value === 'route'
    || value === 'direction'
    || value === 'station'
    || value === 'segment'
    || value === 'leg'
    || value === 'transfer'
    || value === 'entrance'
    || value === 'passage'
    || value === 'platform'
    || value === 'machine'
    || value === 'connection'
    || value === 'path'
    || value === 'train';
}

function validateOwnerGate(
  candidate: OwnerAcceptance | undefined,
  expectedDomain: ReconnectionOwnerDomain,
  label: string,
  ownership: ReconnectionRequestOwnership,
  acceptedThrough: string,
): asserts candidate is OwnerAcceptance {
  if (!candidate || candidate.domain !== expectedDomain) {
    throw new Error(`${label} owner gate must come from the exact ${expectedDomain} owner`);
  }
  if (!nonempty(candidate.ownerId) || !nonempty(candidate.evidenceId)
    || !canonicalInstant(candidate.evidenceAt) || !canonicalInstant(candidate.acceptedAt)) {
    throw new Error(`${label} owner gate requires exact owner, evidence, and acceptance time`);
  }
  if (candidate.recoveryEpochId !== ownership.epochId) throw new Error(`${label} recovery epoch does not match the active request`);
  if (candidate.requestIdentity !== ownership.requestIdentity) throw new Error(`${label} request identity does not match the active request`);
  if (candidate.generation !== ownership.generation) throw new Error(`${label} generation does not match the active request`);
  if (candidate.activeTripId !== ownership.activeTripId) throw new Error(`${label} active trip does not match the preserved context`);
  if (candidate.contextKey !== ownership.contextKey) throw new Error(`${label} context does not match the preserved request`);
  if (Date.parse(candidate.evidenceAt) < Date.parse(ownership.startedAt)
    || Date.parse(candidate.acceptedAt) < Date.parse(ownership.startedAt)) {
    throw new Error(`${label} evidence cannot predate the recovery epoch`);
  }
  if (Date.parse(candidate.evidenceAt) > Date.parse(candidate.acceptedAt)) {
    throw new Error(`${label} evidence cannot postdate its local acceptance`);
  }
  if (Date.parse(candidate.acceptedAt) > Date.parse(acceptedThrough)) {
    throw new Error(`${label} acceptance cannot postdate the local receipt bound`);
  }
  if (!Array.isArray(candidate.scopeMembership) || candidate.scopeMembership.length === 0
    || candidate.scopeMembership.some((scope) => !hasEligibleScope(ownership, scope))) {
    throw new Error(`${label} evidence must belong to the exact eligible scope`);
  }
  if (!sameScopeMembership(candidate.scopeMembership, ownership.ownerScopes[expectedDomain])) {
    throw new Error(`${label} evidence must belong to the exact ${expectedDomain} owner scope`);
  }
  if (candidate.disposition !== 'accepted-fresh' && candidate.disposition !== 'governed-fail-closed') {
    throw new Error(`${label} result must be owner-accepted fresh or governed fail-closed`);
  }
  if (candidate.disposition === 'governed-fail-closed' && !nonempty(candidate.reason)) {
    throw new Error(`${label} governed fail-closed result requires a reason`);
  }
}

function validateRequestOwnership(context: PreservedReconnectionContext): void {
  const ownership = context.recovery;
  if (!ownership || !nonempty(ownership.epochId) || !nonempty(ownership.requestIdentity)
    || !Number.isSafeInteger(ownership.generation) || ownership.generation < 1
    || !canonicalInstant(ownership.startedAt)
    || (ownership.activeTripId !== null && !nonempty(ownership.activeTripId))
    || !nonempty(ownership.contextKey) || ownership.activeTripId !== context.activeTripId) {
    throw new Error('Reconnection requires exact epoch, request, generation, active-trip, and context ownership');
  }
  if (!Array.isArray(ownership.eligibleScopes) || ownership.eligibleScopes.length === 0
    || ownership.eligibleScopes.some((scope) => !scope || !validScopeMembershipKind(scope.kind) || !nonempty(scope.id))) {
    throw new Error('Reconnection requires an exact bounded eligible scope');
  }
  const keys = ownership.eligibleScopes.map((scope) => `${scope.kind}\u0000${scope.id}`);
  if (new Set(keys).size !== keys.length) throw new Error('Reconnection eligible scopes must be unique');
  for (const domain of RECONNECTION_OWNER_DOMAINS) {
    const scopes = ownership.ownerScopes?.[domain];
    if (!Array.isArray(scopes) || scopes.length === 0
      || scopes.some((scope) => !hasEligibleScope(ownership, scope))) {
      throw new Error(`Reconnection requires an exact ${domain} owner scope`);
    }
    const ownerKeys = scopes.map((scope) => `${scope.kind}\u0000${scope.id}`);
    if (new Set(ownerKeys).size !== ownerKeys.length) {
      throw new Error(`Reconnection ${domain} owner scopes must be unique`);
    }
  }
}

const RECONNECTION_OWNER_DOMAINS: readonly ReconnectionOwnerDomain[] = [
  'equipment', 'accessible-path', 'service-change', 'feed-health', 'train-admission',
  'arrivals', 'positioning', 'transfer-guidance', 'maps', 'saved',
];

function hasEligibleScope(
  ownership: ReconnectionRequestOwnership,
  scope: ReconnectionScopeMembership | undefined,
): boolean {
  return Boolean(scope && validScopeMembershipKind(scope.kind) && nonempty(scope.id)
    && ownership.eligibleScopes.some((eligible) => eligible.kind === scope.kind && eligible.id === scope.id));
}

function validScopeMembershipKind(value: unknown): value is ReconnectionScopeMembership['kind'] {
  return validInvalidationScopeKind(value) || value === 'context' || value === 'map' || value === 'saved-record';
}

function sameScopeMembership(
  left: readonly ReconnectionScopeMembership[],
  right: readonly ReconnectionScopeMembership[],
): boolean {
  return left.length === right.length
    && left.every((scope, index) => scope.kind === right[index]?.kind && scope.id === right[index]?.id);
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function canonicalInstant(value: unknown): value is string {
  if (!nonempty(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function assertCurrentStage(state: ReconnectionState, requested: ReconnectionStage): void {
  if (state.currentStage !== requested) {
    const blocking = state.currentStage === null ? 'all stages are complete' : `stage ${state.currentStage} must finish`;
    throw new Error(`${blocking} before stage ${requested}`);
  }
}

function assertStageStatus(
  state: ReconnectionState,
  stage: ReconnectionStage,
  expected: ReconnectionStageRecord['status'],
  message: string,
): void {
  if (stageRecord(state, stage).status !== expected) throw new Error(message);
}

function stageRecord(state: ReconnectionState, stage: ReconnectionStage): ReconnectionStageRecord {
  const record = state.stages.find((candidate) => candidate.stage === stage);
  if (!record) throw new Error(`Missing reconnection stage ${stage}`);
  return record;
}

function immutableState(input: ReconnectionState): ReconnectionState {
  return deepFreeze(clonePlain(input));
}

function clonePlain<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => clonePlain(entry)) as T;
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = Object.create(null);
    for (const [key, entry] of Object.entries(value)) result[key] = clonePlain(entry);
    return result as T;
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}
