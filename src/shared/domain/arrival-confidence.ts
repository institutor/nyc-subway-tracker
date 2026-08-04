import type { Direction } from './types';

export interface SupportedArrivalRange {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface ExpectedEvidenceUpdate {
  readonly evidenceId: string;
  readonly sourceTimestamp: Date;
  readonly stableTrainIdentity: string;
  readonly patternIdentity: string;
  readonly direction: Direction;
  readonly destination: string;
  readonly exactTargetStopCallIdentity: string;
  readonly assignedPhysicalTrain: boolean;
  readonly atOrigin: boolean;
  readonly movementObserved: boolean;
  readonly overdueVerdict: 'not-overdue' | 'overdue' | 'unknown';
  readonly supportedRange: SupportedArrivalRange;
  readonly accepted: boolean;
}

export interface ExpectedEvidencePolicy {
  readonly rangeStable?: (prior: SupportedArrivalRange, current: SupportedArrivalRange) => boolean;
}

export type ExpectedEvidenceDecision =
  | { readonly eligible: true; readonly supportedRange: SupportedArrivalRange; readonly stableTrainIdentity: string }
  | { readonly eligible: false; readonly reason: string };

export function evaluateExpectedEvidencePair(
  updates: readonly ExpectedEvidenceUpdate[],
  policy: ExpectedEvidencePolicy = {},
): ExpectedEvidenceDecision {
  if (!Array.isArray(updates)) throw new Error('Expected evidence updates are required');
  for (const update of updates) validateExpectedUpdate(update);
  if (updates.length !== 2) return frozenIneligible('Expected requires exactly two consecutive accepted updates');
  const [prior, current] = updates;
  if (!prior.accepted || !current.accepted) return frozenIneligible('Expected confirmation pair is broken');
  if (current.sourceTimestamp.getTime() <= prior.sourceTimestamp.getTime() || current.evidenceId === prior.evidenceId) {
    return frozenIneligible('Expected confirmation requires distinct advancing evidence');
  }
  for (const update of updates) {
    if (!update.assignedPhysicalTrain || !update.atOrigin || update.movementObserved || update.overdueVerdict !== 'not-overdue') {
      return frozenIneligible('Expected origin assignment conditions are not proven');
    }
  }
  const stable = prior.stableTrainIdentity === current.stableTrainIdentity
    && prior.patternIdentity === current.patternIdentity
    && prior.direction === current.direction
    && prior.destination === current.destination
    && prior.exactTargetStopCallIdentity === current.exactTargetStopCallIdentity;
  if (!stable) return frozenIneligible('Expected identity, pattern, direction, destination, or target changed');
  const rangeStable = policy.rangeStable
    ? policy.rangeStable(prior.supportedRange, current.supportedRange)
    : sameRange(prior.supportedRange, current.supportedRange);
  if (!rangeStable) return frozenIneligible('Expected supported range changed');
  return Object.freeze({
    eligible: true,
    supportedRange: freezeRange(current.supportedRange),
    stableTrainIdentity: current.stableTrainIdentity,
  });
}

export type ConfidenceRecoveryDisposition =
  | 'live-continuity'
  | 'precision-withheld'
  | 'hard-suppressed'
  | 'live-readmission-eligible';

export interface ArrivalConfidenceInput {
  readonly assessedAt: Date;
  readonly feedState: 'current' | 'degraded' | 'unavailable' | 'quarantined';
  readonly exactStopConfirmed: boolean;
  readonly trackPathConfirmed: boolean;
  readonly recoveryDisposition: ConfidenceRecoveryDisposition;
  readonly trainPhase: 'running' | 'origin-awaiting-departure';
  readonly progressAt: Date | null;
  readonly predictedAt: Date;
  readonly lastSupportedAt: Date;
  readonly dueStartedAt: Date | null;
  readonly unusualDwellVerdict: 'unusual' | 'not-unusual' | 'not-evaluated';
  readonly expectedUpdates?: readonly ExpectedEvidenceUpdate[];
  readonly expectedPolicy?: ExpectedEvidencePolicy;
}

export type ArrivalConfidenceDecision = Readonly<{
  kind: 'live' | 'expected' | 'holding' | 'uncertain' | 'withheld' | 'feed-updating';
  primary: boolean;
  label: 'live' | 'due' | 'expected' | null;
  exactTime: Date | null;
  supportedRange: SupportedArrivalRange | null;
  movementAgeSeconds: number | null;
  dueElapsedSeconds: number | null;
  unusualDwell: boolean;
  reason: string;
}>;

export function assessArrivalConfidence(input: ArrivalConfidenceInput): ArrivalConfidenceDecision {
  validateConfidenceInput(input);
  const assessedAt = input.assessedAt.getTime();
  const unusualDwell = input.unusualDwellVerdict === 'unusual';
  const common = { unusualDwell };
  if (input.feedState === 'degraded') return decision('feed-updating', false, null, null, null, null, null, common, 'Live data updating');
  if (input.feedState !== 'current') return decision('withheld', false, null, null, null, null, null, common, 'Current feed evidence is required');
  if (!input.exactStopConfirmed || !input.trackPathConfirmed) {
    return decision('withheld', false, null, null, null, null, null, common, 'Exact stop and track/path must remain confirmed');
  }
  if (input.recoveryDisposition === 'precision-withheld' || input.recoveryDisposition === 'hard-suppressed') {
    return decision('withheld', false, null, null, null, null, null, common, 'Recovery decision blocks primary precision');
  }
  if (input.trainPhase === 'origin-awaiting-departure') {
    if (input.recoveryDisposition !== 'live-continuity') {
      return decision('withheld', false, null, null, null, null, null, common, 'Recovery cannot restore Expected');
    }
    const expected = evaluateExpectedEvidencePair(input.expectedUpdates ?? [], input.expectedPolicy);
    if (!expected.eligible) return decision('withheld', false, null, null, null, null, null, common, expected.reason);
    return decision('expected', true, 'expected', null, expected.supportedRange, null, null, common, 'Stable origin assignment');
  }
  if (input.progressAt === null) {
    return decision('withheld', false, null, null, null, null, null, common, 'Running train progress is required');
  }
  const movementAgeSeconds = elapsedSeconds(input.progressAt.getTime(), assessedAt, 'movement age');
  const dueEpisodeStart = input.dueStartedAt === null ? null : Math.max(input.dueStartedAt.getTime(), input.progressAt.getTime());
  const dueElapsedSeconds = dueEpisodeStart === null ? null : elapsedSeconds(dueEpisodeStart, assessedAt, 'Due no-progress age');
  if (movementAgeSeconds > 180) {
    return decision('uncertain', false, null, null, null, movementAgeSeconds, dueElapsedSeconds, common, 'Arrival uncertain');
  }
  if (movementAgeSeconds > 90 || (dueElapsedSeconds !== null && dueElapsedSeconds > 60)) {
    return decision('holding', false, null, input.lastSupportedAt, null, movementAgeSeconds, dueElapsedSeconds, common, 'Holding');
  }
  return decision(
    'live',
    true,
    dueElapsedSeconds === null ? 'live' : 'due',
    input.predictedAt,
    null,
    movementAgeSeconds,
    dueElapsedSeconds,
    common,
    dueElapsedSeconds === null ? 'Live' : 'Due',
  );
}

function validateExpectedUpdate(update: ExpectedEvidenceUpdate): void {
  if (!update || typeof update !== 'object' || !update.evidenceId || !update.stableTrainIdentity || !update.patternIdentity
    || !update.destination || !update.exactTargetStopCallIdentity || update.direction === 'unknown') {
    throw new Error('Incomplete Expected evidence update');
  }
  validDate(update.sourceTimestamp, 'Expected source timestamp');
  validateRange(update.supportedRange);
  for (const [name, value] of [['assignedPhysicalTrain', update.assignedPhysicalTrain], ['atOrigin', update.atOrigin],
    ['movementObserved', update.movementObserved], ['accepted', update.accepted]] as const) {
    if (typeof value !== 'boolean') throw new Error(`Expected ${name} must be boolean`);
  }
  if (!['not-overdue', 'overdue', 'unknown'].includes(update.overdueVerdict)) throw new Error('Expected overdue verdict is required');
}

function validateConfidenceInput(input: ArrivalConfidenceInput): void {
  if (!input || typeof input !== 'object') throw new Error('Arrival confidence input is required');
  validDate(input.assessedAt, 'confidence assessment instant');
  validDate(input.predictedAt, 'predicted arrival instant');
  validDate(input.lastSupportedAt, 'last supported arrival instant');
  if (input.progressAt !== null) validDate(input.progressAt, 'progress instant');
  if (input.dueStartedAt !== null) validDate(input.dueStartedAt, 'Due start instant');
  if (typeof input.exactStopConfirmed !== 'boolean' || typeof input.trackPathConfirmed !== 'boolean') {
    throw new Error('Stop and path confirmation must be boolean');
  }
  if (!['unusual', 'not-unusual', 'not-evaluated'].includes(input.unusualDwellVerdict)) {
    throw new Error('Governed unusual-dwell verdict is required');
  }
}

function decision(
  kind: ArrivalConfidenceDecision['kind'], primary: boolean, label: ArrivalConfidenceDecision['label'], exactTime: Date | null,
  supportedRange: SupportedArrivalRange | null, movementAgeSeconds: number | null, dueElapsedSeconds: number | null,
  flags: { unusualDwell: boolean }, reason: string,
): ArrivalConfidenceDecision {
  return Object.freeze({ kind, primary, label, exactTime: exactTime ? new Date(exactTime) : null,
    supportedRange: supportedRange ? freezeRange(supportedRange) : null, movementAgeSeconds, dueElapsedSeconds,
    unusualDwell: flags.unusualDwell, reason });
}

function sameRange(left: SupportedArrivalRange, right: SupportedArrivalRange): boolean {
  return left.startsAt.getTime() === right.startsAt.getTime() && left.endsAt.getTime() === right.endsAt.getTime();
}

function validateRange(range: SupportedArrivalRange): void {
  if (!range || typeof range !== 'object') throw new Error('Supported range is required');
  const start = validDate(range.startsAt, 'supported range start');
  const end = validDate(range.endsAt, 'supported range end');
  if (end < start) throw new Error('Supported range ends before it starts');
}

function freezeRange(range: SupportedArrivalRange): SupportedArrivalRange {
  validateRange(range);
  return Object.freeze({ startsAt: new Date(range.startsAt), endsAt: new Date(range.endsAt) });
}

function frozenIneligible(reason: string): ExpectedEvidenceDecision {
  return Object.freeze({ eligible: false, reason });
}

function elapsedSeconds(from: number, to: number, label: string): number {
  if (to < from) throw new Error(`Negative ${label} is invalid`);
  return (to - from) / 1_000;
}

function validDate(value: Date, label: string): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Invalid ${label}`);
  return value.getTime();
}
