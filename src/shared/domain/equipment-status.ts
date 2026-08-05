export type EquipmentHealth = 'current' | 'degraded' | 'unavailable';
export type EquipmentMachineState = 'no-official-outage-reported' | 'out-of-service' | 'planned-outage' | 'unknown' | 'out-of-service-rechecking';

export interface EquipmentOutageRecord {
  readonly recordId: string;
  readonly equipmentId: string;
  readonly state: 'out-of-service' | 'planned-outage';
}

export interface EquipmentInventoryEvidenceInput {
  readonly inventoryId: string;
  readonly evidenceOwner: 'official-equipment-inventory';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly acceptedAt: string;
  readonly equipmentIds: readonly string[];
}

const inventoryBrand: unique symbol = Symbol('accepted-equipment-inventory');
export interface AcceptedEquipmentInventory extends EquipmentInventoryEvidenceInput {
  readonly [inventoryBrand]: true;
}

export interface EquipmentSnapshotEvidenceInput {
  readonly snapshotId: string;
  readonly sequenceOrdinal: number;
  readonly predecessorSnapshotId: string | null;
  readonly evidenceOwner: 'official-equipment-status';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly inventoryVersion: string;
  readonly sourceTimestamp: string;
  readonly acceptedAt: string;
  readonly declaredRecordCount: number;
  readonly records: readonly unknown[];
}

const snapshotBrand: unique symbol = Symbol('accepted-equipment-snapshot');
export interface AcceptedEquipmentSnapshot {
  readonly [snapshotBrand]: true;
  readonly snapshotId: string;
  readonly sequenceOrdinal: number;
  readonly predecessorSnapshotId: string | null;
  readonly evidenceOwner: 'official-equipment-status';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly inventoryVersion: string;
  readonly sourceTimestamp: string;
  readonly acceptedAt: string;
  readonly declaredRecordCount: number;
  readonly records: readonly EquipmentOutageRecord[];
  readonly malformedRecordCount: number;
  readonly duplicateRecordCount: number;
  readonly unmatchedRecordCount: number;
  readonly badRecordCount: number;
  readonly coherent: boolean;
}

export interface EquipmentHistoryEvidenceInput {
  readonly historyId: string;
  readonly evidenceOwner: 'official-equipment-status';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly inventoryVersion: string;
  readonly snapshots: readonly EquipmentSnapshotEvidenceInput[];
}

const historyBrand: unique symbol = Symbol('accepted-equipment-history');
export interface AcceptedEquipmentHistory {
  readonly [historyBrand]: true;
  readonly historyId: string;
  readonly evidenceOwner: 'official-equipment-status';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly inventoryVersion: string;
}

export interface EquipmentRestorationEvidenceInput {
  readonly restorationId: string;
  readonly evidenceOwner: 'official-equipment-status';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly equipmentId: string;
  readonly outageRecordId: string;
  readonly restoredAt: string;
  readonly acceptedAt: string;
}

const restorationBrand: unique symbol = Symbol('accepted-equipment-restoration');
export interface AcceptedEquipmentRestoration extends EquipmentRestorationEvidenceInput {
  readonly [restorationBrand]: true;
}

const decisionBrand: unique symbol = Symbol('resolved-equipment-status');
export interface EquipmentStatusDecision {
  readonly [decisionBrand]: true;
  readonly decisionId: string;
  readonly targetEquipmentId: string;
  readonly evidenceOwner: 'official-equipment-status';
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly snapshotId: string;
  readonly sourceTimestamp: string;
  readonly assessedAt: string;
  readonly validFrom: string;
  readonly validThrough: string;
  readonly adverseRecordId?: string;
  readonly health: EquipmentHealth;
  readonly state: EquipmentMachineState;
  readonly freshnessCopy: string;
  readonly inventoryReview: 'current' | 'overdue' | 'expired';
  readonly anomaly: boolean;
  readonly provisionalEmpty: boolean;
  readonly restored: boolean;
  readonly reason: string;
}

export interface EquipmentStatusAssessmentInput {
  readonly targetEquipmentId: string;
  readonly decisionTime: Date;
  readonly inventory: AcceptedEquipmentInventory;
  readonly history: AcceptedEquipmentHistory;
  readonly restorationRecords?: readonly AcceptedEquipmentRestoration[];
}

const acceptedInventories = new WeakSet<object>();
const acceptedSnapshots = new WeakSet<object>();
const acceptedHistories = new WeakSet<object>();
interface EquipmentLedgerState {
  readonly historyId: string;
  readonly sourceScopeId: string;
  readonly sourceVersion: string;
  readonly inventoryVersion: string;
  readonly snapshots: AcceptedEquipmentSnapshot[];
}
interface EquipmentDecisionEvidence {
  readonly ledger: EquipmentLedgerState;
  readonly snapshotId: string;
}
const canonicalEquipmentHistories = new WeakMap<object, EquipmentLedgerState>();
const equipmentStreamsByInventory = new WeakMap<object, Map<string, EquipmentLedgerState>>();
const acceptedRestorations = new WeakSet<object>();
const resolvedEquipmentDecisions = new WeakSet<object>();
const resolvedEquipmentDecisionEvidence = new WeakMap<object, EquipmentDecisionEvidence>();
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function acceptEquipmentInventory(raw: EquipmentInventoryEvidenceInput): AcceptedEquipmentInventory {
  const root = strictRecord(raw, ['inventoryId', 'evidenceOwner', 'sourceScopeId', 'sourceVersion', 'acceptedAt', 'equipmentIds'], 'equipment inventory');
  if (root.evidenceOwner !== 'official-equipment-inventory') throw new Error('Equipment inventory owner is invalid');
  const equipmentIds = stringArray(root.equipmentIds, 'inventory equipment identities');
  if (new Set(equipmentIds).size !== equipmentIds.length) throw new Error('Duplicate inventory equipment identity');
  const accepted = deepFreeze({
    [inventoryBrand]: true as const,
    inventoryId: identity(root.inventoryId, 'inventory identity'),
    evidenceOwner: 'official-equipment-inventory' as const,
    sourceScopeId: identity(root.sourceScopeId, 'inventory scope'),
    sourceVersion: identity(root.sourceVersion, 'inventory version'),
    acceptedAt: instant(root.acceptedAt, 'inventory acceptance'),
    equipmentIds,
  });
  acceptedInventories.add(accepted);
  return accepted;
}

export function acceptEquipmentHistory(
  raw: EquipmentHistoryEvidenceInput,
  inventory: AcceptedEquipmentInventory,
): AcceptedEquipmentHistory {
  if (!acceptedInventories.has(inventory)) throw new Error('Equipment history requires an accepted inventory');
  const root = strictRecord(raw, ['historyId', 'evidenceOwner', 'sourceScopeId', 'sourceVersion', 'inventoryVersion', 'snapshots'], 'equipment history');
  if (root.evidenceOwner !== 'official-equipment-status') throw new Error('Equipment history owner is invalid');
  const historyId = identity(root.historyId, 'equipment history identity');
  const sourceScopeId = identity(root.sourceScopeId, 'equipment history scope');
  const sourceVersion = identity(root.sourceVersion, 'equipment history version');
  const inventoryVersion = identity(root.inventoryVersion, 'equipment history inventory version');
  if (sourceScopeId !== inventory.sourceScopeId || inventoryVersion !== inventory.sourceVersion) {
    throw new Error('Equipment history inventory join is invalid');
  }
  if (!Array.isArray(root.snapshots) || root.snapshots.length === 0) throw new Error('Equipment history snapshots are required');
  const streamKey = `${sourceScopeId}\u0000${sourceVersion}\u0000${inventoryVersion}`;
  const acceptedStreams = equipmentStreamsByInventory.get(inventory) ?? new Map<string, EquipmentLedgerState>();
  const existingLedger = acceptedStreams.get(streamKey);
  const snapshots = root.snapshots.map((value) => parseEquipmentSnapshot(value, inventory));
  const snapshotIds = new Set<string>();
  for (const [index, snapshot] of snapshots.entries()) {
    const predecessor = index === 0 ? null : snapshots[index - 1].snapshotId;
    if (snapshot.sourceScopeId !== sourceScopeId || snapshot.sourceVersion !== sourceVersion
      || snapshot.inventoryVersion !== inventoryVersion) throw new Error('Equipment history stream join is invalid');
    if (snapshot.sequenceOrdinal !== index + 1 || snapshot.predecessorSnapshotId !== predecessor) {
      throw new Error('Equipment history sequence is not complete and adjacent');
    }
    if (snapshotIds.has(snapshot.snapshotId)) throw new Error('Duplicate equipment history snapshot identity');
    snapshotIds.add(snapshot.snapshotId);
    if (Date.parse(snapshot.acceptedAt) < Date.parse(snapshot.sourceTimestamp)) {
      throw new Error('Equipment history snapshot receipt chronology is invalid');
    }
    if (index > 0 && (Date.parse(snapshot.sourceTimestamp) <= Date.parse(snapshots[index - 1].sourceTimestamp)
      || Date.parse(snapshot.acceptedAt) <= Date.parse(snapshots[index - 1].acceptedAt))) {
      throw new Error('Equipment history chronology is not strictly monotonic');
    }
    if (Date.parse(inventory.acceptedAt) > Date.parse(snapshot.acceptedAt)) throw new Error('Equipment history predates its inventory');
  }
  let ledger: EquipmentLedgerState;
  if (existingLedger) {
    if (historyId !== existingLedger.historyId || snapshots.length <= existingLedger.snapshots.length) {
      throw new Error('Equipment history stream already has a canonical accepted ledger; only an exact-prefix extension is allowed');
    }
    for (let index = 0; index < existingLedger.snapshots.length; index += 1) {
      if (!sameEquipmentSnapshot(existingLedger.snapshots[index], snapshots[index])) {
        throw new Error('Equipment history extension does not preserve the canonical accepted prefix');
      }
    }
    const appended = snapshots.slice(existingLedger.snapshots.length);
    for (const snapshot of appended) acceptedSnapshots.add(snapshot);
    existingLedger.snapshots.push(...appended);
    ledger = existingLedger;
  } else {
    for (const snapshot of snapshots) acceptedSnapshots.add(snapshot);
    ledger = { historyId, sourceScopeId, sourceVersion, inventoryVersion, snapshots: [...snapshots] };
    acceptedStreams.set(streamKey, ledger);
    equipmentStreamsByInventory.set(inventory, acceptedStreams);
  }
  const accepted = deepFreeze({
    [historyBrand]: true as const,
    historyId,
    evidenceOwner: 'official-equipment-status' as const,
    sourceScopeId,
    sourceVersion,
    inventoryVersion,
  });
  acceptedHistories.add(accepted);
  canonicalEquipmentHistories.set(accepted, ledger);
  return accepted;
}

function parseEquipmentSnapshot(
  raw: EquipmentSnapshotEvidenceInput,
  inventory: AcceptedEquipmentInventory,
): AcceptedEquipmentSnapshot {
  const root = strictRecord(raw, ['snapshotId', 'sequenceOrdinal', 'predecessorSnapshotId', 'evidenceOwner', 'sourceScopeId', 'sourceVersion', 'inventoryVersion', 'sourceTimestamp', 'acceptedAt', 'declaredRecordCount', 'records'], 'equipment snapshot');
  if (root.evidenceOwner !== 'official-equipment-status') throw new Error('Equipment snapshot owner is invalid');
  if (!Array.isArray(root.records) || !Number.isInteger(root.declaredRecordCount) || (root.declaredRecordCount as number) < 0) throw new Error('Equipment snapshot population is invalid');
  if (!Number.isInteger(root.sequenceOrdinal) || (root.sequenceOrdinal as number) < 1) throw new Error('Equipment snapshot sequence ordinal is invalid');
  if (root.predecessorSnapshotId !== null && typeof root.predecessorSnapshotId !== 'string') throw new Error('Equipment snapshot predecessor is invalid');
  const parsed = root.records.map((value, index) => ({ index, record: parseOutageRecord(value) }));
  const records = parsed.flatMap(({ record }) => record ? [record] : []);
  const malformedIndexes = parsed.filter(({ record }) => !record).map(({ index }) => index);
  const seenEquipmentIds = new Set<string>();
  const duplicateIndexes: number[] = [];
  for (const { index, record } of parsed) {
    if (!record) continue;
    if (seenEquipmentIds.has(record.equipmentId)) duplicateIndexes.push(index);
    seenEquipmentIds.add(record.equipmentId);
  }
  const inventoryIds = new Set(inventory.equipmentIds);
  const unmatchedIndexes = parsed.filter(({ record }) => record && !inventoryIds.has(record.equipmentId)).map(({ index }) => index);
  const badRecordCount = new Set([...malformedIndexes, ...duplicateIndexes, ...unmatchedIndexes]).size;
  const sourceTimestamp = instant(root.sourceTimestamp, 'snapshot source time');
  const acceptedAt = instant(root.acceptedAt, 'snapshot acceptance');
  const accepted = deepFreeze({
    [snapshotBrand]: true as const,
    snapshotId: identity(root.snapshotId, 'snapshot identity'),
    sequenceOrdinal: root.sequenceOrdinal as number,
    predecessorSnapshotId: root.predecessorSnapshotId === null ? null : identity(root.predecessorSnapshotId, 'snapshot predecessor'),
    evidenceOwner: 'official-equipment-status' as const,
    sourceScopeId: identity(root.sourceScopeId, 'snapshot scope'),
    sourceVersion: identity(root.sourceVersion, 'snapshot version'),
    inventoryVersion: identity(root.inventoryVersion, 'snapshot inventory version'),
    sourceTimestamp,
    acceptedAt,
    declaredRecordCount: root.declaredRecordCount as number,
    records,
    malformedRecordCount: malformedIndexes.length,
    duplicateRecordCount: duplicateIndexes.length,
    unmatchedRecordCount: unmatchedIndexes.length,
    badRecordCount,
    coherent: (root.declaredRecordCount as number) === root.records.length && Date.parse(acceptedAt) >= Date.parse(sourceTimestamp),
  });
  return accepted;
}

export function acceptEquipmentRestoration(raw: EquipmentRestorationEvidenceInput): AcceptedEquipmentRestoration {
  const root = strictRecord(raw, ['restorationId', 'evidenceOwner', 'sourceScopeId', 'sourceVersion', 'equipmentId', 'outageRecordId', 'restoredAt', 'acceptedAt'], 'equipment restoration');
  if (root.evidenceOwner !== 'official-equipment-status') throw new Error('Equipment restoration owner is invalid');
  const restoredAt = instant(root.restoredAt, 'restoration source time');
  const acceptedAt = instant(root.acceptedAt, 'restoration acceptance');
  if (Date.parse(acceptedAt) < Date.parse(restoredAt)) throw new Error('Equipment restoration chronology is invalid');
  const accepted = deepFreeze({
    [restorationBrand]: true as const,
    restorationId: identity(root.restorationId, 'restoration identity'),
    evidenceOwner: 'official-equipment-status' as const,
    sourceScopeId: identity(root.sourceScopeId, 'restoration scope'),
    sourceVersion: identity(root.sourceVersion, 'restoration version'),
    equipmentId: identity(root.equipmentId, 'restoration equipment'),
    outageRecordId: identity(root.outageRecordId, 'restoration outage record'),
    restoredAt,
    acceptedAt,
  });
  acceptedRestorations.add(accepted);
  return accepted;
}

export function assessEquipmentStatus(input: EquipmentStatusAssessmentInput): EquipmentStatusDecision {
  const history = input.history;
  const inventory = input.inventory;
  const assessedAt = canonicalDate(input.decisionTime, 'equipment assessment');
  const targetEquipmentId = identity(input.targetEquipmentId, 'target equipment');
  const ledger = canonicalEquipmentHistories.get(history);
  const canonicalHistory = ledger?.snapshots;
  const trustedHistory = acceptedHistories.has(history) && acceptedInventories.has(inventory)
    && history.sourceScopeId === inventory.sourceScopeId && history.inventoryVersion === inventory.sourceVersion
    && Boolean(ledger) && ledger?.historyId === history.historyId
    && ledger?.sourceScopeId === history.sourceScopeId && ledger?.sourceVersion === history.sourceVersion
    && ledger?.inventoryVersion === history.inventoryVersion;
  const acceptedByDecision = trustedHistory && canonicalHistory
    ? canonicalHistory.filter((candidate) => acceptedSnapshots.has(candidate) && Date.parse(candidate.acceptedAt) <= Date.parse(assessedAt))
    : [];
  const snapshot = acceptedByDecision.at(-1) ?? canonicalHistory?.at(-1);
  if (!snapshot) throw new Error('Equipment assessment requires a canonical accepted history');
  const trusted = trustedHistory && acceptedByDecision.length > 0;
  const age = trusted ? Date.parse(assessedAt) - Date.parse(snapshot.sourceTimestamp) : Number.NaN;
  const inventoryAge = trusted ? Date.parse(assessedAt) - Date.parse(inventory.acceptedAt) : Number.NaN;
  const inventoryReview = inventoryAge >= 7 * DAY ? 'expired' : inventoryAge > DAY ? 'overdue' : 'current';
  const badRatio = trusted && snapshot.declaredRecordCount > 0 ? snapshot.badRecordCount / snapshot.declaredRecordCount : 0;
  const previous = acceptedByDecision.at(-2);
  const acceptedInventoryIds = new Set(inventory.equipmentIds);
  const previousRecords = previous?.records.filter((record) => acceptedInventoryIds.has(record.equipmentId)) ?? [];
  const currentRecords = snapshot.records.filter((record) => acceptedInventoryIds.has(record.equipmentId));
  const disappearanceRatio = previous?.coherent && snapshot.coherent
    ? Math.max(
      setDisappearanceRatio(previousRecords.map((record) => record.recordId), currentRecords.map((record) => record.recordId)),
      setDisappearanceRatio(previousRecords.map((record) => record.equipmentId), currentRecords.map((record) => record.equipmentId)),
    )
    : 0;
  const anomaly = badRatio > 0.1 || disappearanceRatio > 0.5;
  const joined = trusted && inventory.sourceScopeId === snapshot.sourceScopeId
    && inventory.sourceVersion === snapshot.inventoryVersion && inventory.equipmentIds.includes(targetEquipmentId);
  const unusable = !trusted || !snapshot.coherent || !joined || !Number.isFinite(age) || age < 0 || inventoryAge < 0 || inventoryReview === 'expired';
  const health: EquipmentHealth = unusable || age > 15 * MINUTE ? 'unavailable' : anomaly || age > 5 * MINUTE ? 'degraded' : 'current';
  const freshnessCopy = Number.isFinite(age) && age >= 0 ? `Checked ${Math.floor(age / MINUTE)} min ago` : 'Checked time unavailable';
  const target = snapshot.records.find((record) => record.equipmentId === targetEquipmentId);
  const currentExactAdverse = trusted && joined && snapshot.coherent && age >= 0 && age <= 5 * MINUTE
    && (target?.state === 'out-of-service' || target?.state === 'planned-outage');
  const latestAdverse = latestAcceptedAdverse(acceptedByDecision, targetEquipmentId);
  const restored = !currentExactAdverse && health === 'current' && restorationPasses(input, acceptedByDecision, latestAdverse);
  const confirmedEmpty = health === 'current' && snapshot.records.length === 0
    && omissionPairPasses(acceptedByDecision, targetEquipmentId, undefined, true);
  const provisionalEmpty = health === 'current' && snapshot.records.length === 0 && !restored && !confirmedEmpty;
  let state: EquipmentMachineState = 'unknown';
  let reason = 'Current status cannot be verified from accepted evidence.';
  if (currentExactAdverse && target?.state === 'out-of-service') {
    state = 'out-of-service'; reason = 'A current official outage record matches the exact equipment identity.';
  } else if (currentExactAdverse && target?.state === 'planned-outage') {
    state = 'planned-outage'; reason = 'A current official planned outage matches the exact equipment identity.';
  } else if (latestAdverse && !restored) {
    state = 'out-of-service-rechecking'; reason = 'A prior official outage awaits qualifying restoration evidence.';
  } else if (health === 'current' && restored) {
    state = 'no-official-outage-reported'; reason = 'Accepted exact-machine restoration evidence passed.';
  } else if (confirmedEmpty) {
    state = 'no-official-outage-reported'; reason = 'Two coherent current zero-outage snapshots are at least one authoritative minute apart.';
  } else if (health === 'current' && snapshot.records.length > 0 && !target) {
    state = 'no-official-outage-reported'; reason = 'A coherent non-empty same-scope snapshot has no matching target outage.';
  } else if (provisionalEmpty) {
    reason = 'The first coherent zero-outage snapshot is Provisional empty.';
  }
  return resolvedDecision({
    targetEquipmentId,
    snapshot,
    assessedAt,
    health,
    state,
    freshnessCopy,
    inventoryReview,
    anomaly,
    provisionalEmpty,
    restored,
    reason,
    ledger: ledger!,
    ...((currentExactAdverse && target) || (latestAdverse && !restored)
      ? { adverseRecordId: (target ?? latestAdverse!.record).recordId }
      : {}),
  });
}

export function isResolvedEquipmentStatusDecision(value: unknown): value is EquipmentStatusDecision {
  return Boolean(value && typeof value === 'object' && resolvedEquipmentDecisions.has(value));
}

export function equipmentDecisionAllowsUse(value: unknown, decisionTime: Date): value is EquipmentStatusDecision {
  return equipmentDecisionMatchesLatestObservation(value, decisionTime) && value.health === 'current';
}

export function equipmentDecisionSupportsAdverseImpact(value: unknown, decisionTime: Date): value is EquipmentStatusDecision {
  return equipmentDecisionMatchesLatestObservation(value, decisionTime)
    && (value.state === 'out-of-service' || value.state === 'planned-outage' || value.state === 'out-of-service-rechecking');
}

interface PriorAdverse {
  readonly index: number;
  readonly snapshot: AcceptedEquipmentSnapshot;
  readonly record: EquipmentOutageRecord;
}

function latestAcceptedAdverse(
  observations: readonly AcceptedEquipmentSnapshot[],
  targetEquipmentId: string,
): PriorAdverse | undefined {
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const record = observations[index].records.find((candidate) => candidate.equipmentId === targetEquipmentId);
    if (record) return { index, snapshot: observations[index], record };
  }
  return undefined;
}

function restorationPasses(
  input: EquipmentStatusAssessmentInput,
  observations: readonly AcceptedEquipmentSnapshot[],
  prior: PriorAdverse | undefined,
): boolean {
  if (!prior) return false;
  const snapshot = observations.at(-1)!;
  const assessedAt = input.decisionTime.getTime();
  const explicit = input.restorationRecords?.find((record) => acceptedRestorations.has(record)
    && record.equipmentId === input.targetEquipmentId
    && record.outageRecordId === prior.record.recordId
    && record.sourceScopeId === snapshot.sourceScopeId
    && record.sourceVersion === snapshot.sourceVersion
    && Date.parse(record.restoredAt) > Date.parse(prior.snapshot.sourceTimestamp)
    && Date.parse(record.restoredAt) <= Date.parse(snapshot.sourceTimestamp)
    && Date.parse(record.acceptedAt) <= assessedAt);
  if (explicit) return true;
  return omissionPairPasses(observations, input.targetEquipmentId, prior.index, false);
}

function omissionPairPasses(
  observations: readonly AcceptedEquipmentSnapshot[],
  targetEquipmentId: string,
  afterIndex: number | undefined,
  requireEmpty: boolean,
): boolean {
  const first = observations.at(-2);
  const second = observations.at(-1);
  return Boolean(first && second && acceptedSnapshots.has(first) && acceptedSnapshots.has(second)
    && first.coherent && second.coherent
    && (afterIndex === undefined || observations.length - 2 > afterIndex)
    && (!requireEmpty || (first.records.length === 0 && second.records.length === 0))
    && !first.records.some((record) => record.equipmentId === targetEquipmentId)
    && !second.records.some((record) => record.equipmentId === targetEquipmentId)
    && Date.parse(second.sourceTimestamp) - Date.parse(first.sourceTimestamp) >= MINUTE);
}

function equipmentDecisionMatchesLatestObservation(
  value: unknown,
  decisionTime: Date,
): value is EquipmentStatusDecision {
  if (!isResolvedEquipmentStatusDecision(value) || !(decisionTime instanceof Date) || !Number.isFinite(decisionTime.getTime())) return false;
  const instant = decisionTime.getTime();
  if (instant < Date.parse(value.validFrom) || instant > Date.parse(value.validThrough)) return false;
  const evidence = resolvedEquipmentDecisionEvidence.get(value);
  if (!evidence) return false;
  const latest = evidence.ledger.snapshots
    .filter((snapshot) => acceptedSnapshots.has(snapshot) && Date.parse(snapshot.acceptedAt) <= instant)
    .at(-1);
  return latest?.snapshotId === evidence.snapshotId;
}

function setDisappearanceRatio(previousValues: readonly string[], currentValues: readonly string[]): number {
  const previous = new Set(previousValues);
  if (previous.size === 0) return 0;
  const current = new Set(currentValues);
  let disappeared = 0;
  for (const value of previous) if (!current.has(value)) disappeared += 1;
  return disappeared / previous.size;
}

function sameEquipmentSnapshot(left: AcceptedEquipmentSnapshot, right: AcceptedEquipmentSnapshot): boolean {
  return left.snapshotId === right.snapshotId
    && left.sequenceOrdinal === right.sequenceOrdinal
    && left.predecessorSnapshotId === right.predecessorSnapshotId
    && left.evidenceOwner === right.evidenceOwner
    && left.sourceScopeId === right.sourceScopeId
    && left.sourceVersion === right.sourceVersion
    && left.inventoryVersion === right.inventoryVersion
    && left.sourceTimestamp === right.sourceTimestamp
    && left.acceptedAt === right.acceptedAt
    && left.declaredRecordCount === right.declaredRecordCount
    && left.malformedRecordCount === right.malformedRecordCount
    && left.duplicateRecordCount === right.duplicateRecordCount
    && left.unmatchedRecordCount === right.unmatchedRecordCount
    && left.badRecordCount === right.badRecordCount
    && left.coherent === right.coherent
    && left.records.length === right.records.length
    && left.records.every((record, index) => record.recordId === right.records[index].recordId
      && record.equipmentId === right.records[index].equipmentId
      && record.state === right.records[index].state);
}

function resolvedDecision(input: {
  readonly targetEquipmentId: string;
  readonly snapshot: AcceptedEquipmentSnapshot;
  readonly assessedAt: string;
  readonly health: EquipmentHealth;
  readonly state: EquipmentMachineState;
  readonly freshnessCopy: string;
  readonly inventoryReview: 'current' | 'overdue' | 'expired';
  readonly anomaly: boolean;
  readonly provisionalEmpty: boolean;
  readonly restored: boolean;
  readonly reason: string;
  readonly ledger: EquipmentLedgerState;
  readonly adverseRecordId?: string;
}): EquipmentStatusDecision {
  const validThrough = input.health === 'current'
    ? Date.parse(input.snapshot.sourceTimestamp) + 5 * MINUTE
    : input.health === 'degraded'
      ? Date.parse(input.snapshot.sourceTimestamp) + 15 * MINUTE
      : Date.parse(input.assessedAt);
  const decision = Object.freeze({
    [decisionBrand]: true as const,
    decisionId: `${input.snapshot.snapshotId}:${input.targetEquipmentId}`,
    targetEquipmentId: input.targetEquipmentId,
    evidenceOwner: 'official-equipment-status' as const,
    sourceScopeId: input.snapshot.sourceScopeId,
    sourceVersion: input.snapshot.sourceVersion,
    snapshotId: input.snapshot.snapshotId,
    sourceTimestamp: input.snapshot.sourceTimestamp,
    assessedAt: input.assessedAt,
    validFrom: input.assessedAt,
    validThrough: new Date(Math.max(Date.parse(input.assessedAt), validThrough)).toISOString(),
    ...(input.adverseRecordId ? { adverseRecordId: input.adverseRecordId } : {}),
    health: input.health,
    state: input.state,
    freshnessCopy: input.freshnessCopy,
    inventoryReview: input.inventoryReview,
    anomaly: input.anomaly,
    provisionalEmpty: input.provisionalEmpty,
    restored: input.restored,
    reason: input.reason,
  });
  resolvedEquipmentDecisions.add(decision);
  resolvedEquipmentDecisionEvidence.set(decision, { ledger: input.ledger, snapshotId: input.snapshot.snapshotId });
  return decision;
}

function parseOutageRecord(value: unknown): EquipmentOutageRecord | undefined {
  try {
    const root = strictRecord(value, ['recordId', 'equipmentId', 'state'], 'equipment outage record');
    if (root.state !== 'out-of-service' && root.state !== 'planned-outage') return undefined;
    return {
      recordId: identity(root.recordId, 'outage record identity'),
      equipmentId: identity(root.equipmentId, 'outage equipment identity'),
      state: root.state,
    };
  } catch {
    return undefined;
  }
}

function strictRecord(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const root = value as Record<string, unknown>;
  const ownKeys = Reflect.ownKeys(root);
  if (ownKeys.length !== fields.length
    || fields.some((field) => !Object.prototype.hasOwnProperty.call(root, field))
    || ownKeys.some((field) => typeof field !== 'string' || !fields.includes(field))) {
    throw new Error(`${label} must contain its exact schema`);
  }
  return root;
}
function identity(value: unknown, label: string): string { if (typeof value !== 'string' || value.trim() !== value || !value || value.length > 160) throw new Error(`${label} is invalid`); return value; }
function instant(value: unknown, label: string): string { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error(`${label} must be a canonical ISO instant`); return value; }
function canonicalDate(value: Date, label: string): string { if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`${label} is invalid`); return value.toISOString(); }
function stringArray(value: unknown, label: string): readonly string[] { if (!Array.isArray(value)) throw new Error(`${label} must be an array`); return value.map((item) => identity(item, label)); }
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object') { for (const child of Object.values(value)) deepFreeze(child); if (!Object.isFrozen(value)) Object.freeze(value); } return value; }
