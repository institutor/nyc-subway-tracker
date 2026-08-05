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
  readonly coherent: boolean;
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
  readonly currentSnapshot: AcceptedEquipmentSnapshot;
  readonly priorDecision?: EquipmentStatusDecision;
  readonly recoverySnapshots?: readonly AcceptedEquipmentSnapshot[];
  readonly restorationRecords?: readonly AcceptedEquipmentRestoration[];
}

const acceptedInventories = new WeakSet<object>();
const acceptedSnapshots = new WeakSet<object>();
const acceptedRestorations = new WeakSet<object>();
const resolvedEquipmentDecisions = new WeakSet<object>();
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

export function acceptEquipmentSnapshot(
  raw: EquipmentSnapshotEvidenceInput,
  inventory: AcceptedEquipmentInventory,
): AcceptedEquipmentSnapshot {
  if (!acceptedInventories.has(inventory)) throw new Error('Equipment snapshot requires an accepted inventory');
  const root = strictRecord(raw, ['snapshotId', 'evidenceOwner', 'sourceScopeId', 'sourceVersion', 'inventoryVersion', 'sourceTimestamp', 'acceptedAt', 'declaredRecordCount', 'records'], 'equipment snapshot');
  if (root.evidenceOwner !== 'official-equipment-status') throw new Error('Equipment snapshot owner is invalid');
  if (!Array.isArray(root.records) || !Number.isInteger(root.declaredRecordCount) || (root.declaredRecordCount as number) < 0) throw new Error('Equipment snapshot population is invalid');
  const parsed = root.records.map(parseOutageRecord);
  const records = parsed.filter((record): record is EquipmentOutageRecord => record !== undefined);
  const malformedRecordCount = parsed.length - records.length;
  const duplicateRecordCount = records.length - new Set(records.map((record) => record.equipmentId)).size;
  const inventoryIds = new Set(inventory.equipmentIds);
  const unmatchedRecordCount = records.filter((record) => !inventoryIds.has(record.equipmentId)).length;
  const sourceTimestamp = instant(root.sourceTimestamp, 'snapshot source time');
  const acceptedAt = instant(root.acceptedAt, 'snapshot acceptance');
  const accepted = deepFreeze({
    [snapshotBrand]: true as const,
    snapshotId: identity(root.snapshotId, 'snapshot identity'),
    evidenceOwner: 'official-equipment-status' as const,
    sourceScopeId: identity(root.sourceScopeId, 'snapshot scope'),
    sourceVersion: identity(root.sourceVersion, 'snapshot version'),
    inventoryVersion: identity(root.inventoryVersion, 'snapshot inventory version'),
    sourceTimestamp,
    acceptedAt,
    declaredRecordCount: root.declaredRecordCount as number,
    records,
    malformedRecordCount,
    duplicateRecordCount,
    unmatchedRecordCount,
    coherent: (root.declaredRecordCount as number) === root.records.length && Date.parse(acceptedAt) >= Date.parse(sourceTimestamp),
  });
  acceptedSnapshots.add(accepted);
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
  const snapshot = input.currentSnapshot;
  const inventory = input.inventory;
  const assessedAt = canonicalDate(input.decisionTime, 'equipment assessment');
  const targetEquipmentId = identity(input.targetEquipmentId, 'target equipment');
  const trusted = acceptedSnapshots.has(snapshot) && acceptedInventories.has(inventory);
  const age = trusted ? Date.parse(assessedAt) - Date.parse(snapshot.sourceTimestamp) : Number.NaN;
  const inventoryAge = trusted ? Date.parse(assessedAt) - Date.parse(inventory.acceptedAt) : Number.NaN;
  const inventoryReview = inventoryAge >= 7 * DAY ? 'expired' : inventoryAge > DAY ? 'overdue' : 'current';
  const badPopulation = trusted ? snapshot.malformedRecordCount + snapshot.duplicateRecordCount + snapshot.unmatchedRecordCount : 0;
  const badRatio = trusted && snapshot.declaredRecordCount > 0 ? badPopulation / snapshot.declaredRecordCount : 0;
  const anomaly = badRatio > 0.1;
  const joined = trusted && inventory.sourceScopeId === snapshot.sourceScopeId
    && inventory.sourceVersion === snapshot.inventoryVersion && inventory.equipmentIds.includes(targetEquipmentId);
  const unusable = !trusted || !snapshot.coherent || !joined || !Number.isFinite(age) || age < 0 || inventoryAge < 0 || inventoryReview === 'expired';
  const health: EquipmentHealth = unusable || age > 15 * MINUTE ? 'unavailable' : anomaly || age > 5 * MINUTE ? 'degraded' : 'current';
  const freshnessCopy = Number.isFinite(age) && age >= 0 ? `Checked ${Math.floor(age / MINUTE)} min ago` : 'Checked time unavailable';
  const target = snapshot.records.find((record) => record.equipmentId === targetEquipmentId);
  const currentExactAdverse = trusted && joined && snapshot.coherent && age >= 0 && age <= 5 * MINUTE
    && (target?.state === 'out-of-service' || target?.state === 'planned-outage');
  const prior = isResolvedEquipmentStatusDecision(input.priorDecision) ? input.priorDecision : undefined;
  const restored = !currentExactAdverse && health === 'current' && restorationPasses(input, prior);
  const confirmedEmpty = health === 'current' && snapshot.records.length === 0 && omissionPairPasses(input);
  const provisionalEmpty = health === 'current' && snapshot.records.length === 0 && !restored && !confirmedEmpty;
  let state: EquipmentMachineState = 'unknown';
  let reason = 'Current status cannot be verified from accepted evidence.';
  if (currentExactAdverse && target?.state === 'out-of-service') {
    state = 'out-of-service'; reason = 'A current official outage record matches the exact equipment identity.';
  } else if (currentExactAdverse && target?.state === 'planned-outage') {
    state = 'planned-outage'; reason = 'A current official planned outage matches the exact equipment identity.';
  } else if (prior?.state === 'out-of-service' && !restored) {
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
    ...(currentExactAdverse && target ? { adverseRecordId: target.recordId } : {}),
  });
}

export function isResolvedEquipmentStatusDecision(value: unknown): value is EquipmentStatusDecision {
  return Boolean(value && typeof value === 'object' && resolvedEquipmentDecisions.has(value));
}

function restorationPasses(input: EquipmentStatusAssessmentInput, prior: EquipmentStatusDecision | undefined): boolean {
  if (!prior || prior.state !== 'out-of-service') return false;
  const snapshot = input.currentSnapshot;
  const assessedAt = input.decisionTime.getTime();
  if (prior.targetEquipmentId !== input.targetEquipmentId
    || prior.evidenceOwner !== 'official-equipment-status'
    || prior.sourceScopeId !== snapshot.sourceScopeId
    || prior.sourceVersion !== snapshot.sourceVersion
    || !prior.adverseRecordId
    || Date.parse(prior.sourceTimestamp) >= Date.parse(snapshot.sourceTimestamp)) return false;
  const explicit = input.restorationRecords?.find((record) => acceptedRestorations.has(record)
    && record.equipmentId === input.targetEquipmentId
    && record.outageRecordId === prior.adverseRecordId
    && record.sourceScopeId === snapshot.sourceScopeId
    && record.sourceVersion === snapshot.sourceVersion
    && Date.parse(record.restoredAt) > Date.parse(prior.sourceTimestamp)
    && Date.parse(record.restoredAt) <= Date.parse(snapshot.sourceTimestamp)
    && Date.parse(record.acceptedAt) <= assessedAt);
  if (explicit) return true;
  return omissionPairPasses(input, prior);
}

function omissionPairPasses(input: EquipmentStatusAssessmentInput, prior?: EquipmentStatusDecision): boolean {
  const observations = input.recoverySnapshots ?? [];
  const first = observations.at(-2);
  const second = observations.at(-1);
  const current = input.currentSnapshot;
  const assessedAt = input.decisionTime.getTime();
  return Boolean(first && second && acceptedSnapshots.has(first) && acceptedSnapshots.has(second)
    && second === current
    && first.coherent && second.coherent
    && first.sourceScopeId === current.sourceScopeId && second.sourceScopeId === current.sourceScopeId
    && first.sourceVersion === current.sourceVersion && second.sourceVersion === current.sourceVersion
    && first.inventoryVersion === current.inventoryVersion && second.inventoryVersion === current.inventoryVersion
    && (!prior || Date.parse(first.sourceTimestamp) > Date.parse(prior.sourceTimestamp))
    && Date.parse(first.acceptedAt) <= assessedAt && Date.parse(second.acceptedAt) <= assessedAt
    && !first.records.some((record) => record.equipmentId === input.targetEquipmentId)
    && !second.records.some((record) => record.equipmentId === input.targetEquipmentId)
    && Date.parse(second.sourceTimestamp) - Date.parse(first.sourceTimestamp) >= MINUTE);
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
  readonly adverseRecordId?: string;
}): EquipmentStatusDecision {
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
  if (Object.keys(root).length !== fields.length || fields.some((field) => !(field in root))) throw new Error(`${label} must contain its exact schema`);
  return root;
}
function identity(value: unknown, label: string): string { if (typeof value !== 'string' || value.trim() !== value || !value || value.length > 160) throw new Error(`${label} is invalid`); return value; }
function instant(value: unknown, label: string): string { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error(`${label} must be a canonical ISO instant`); return value; }
function canonicalDate(value: Date, label: string): string { if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`${label} is invalid`); return value.toISOString(); }
function stringArray(value: unknown, label: string): readonly string[] { if (!Array.isArray(value)) throw new Error(`${label} must be an array`); return value.map((item) => identity(item, label)); }
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object') { for (const child of Object.values(value)) deepFreeze(child); if (!Object.isFrozen(value)) Object.freeze(value); } return value; }
