export type EquipmentHealth = 'current' | 'degraded' | 'unavailable';
export type EquipmentMachineState = 'no-official-outage-reported' | 'out-of-service' | 'planned-outage' | 'unknown' | 'out-of-service-rechecking';
export interface EquipmentOutageRecord { readonly equipmentId: string; readonly state: 'out-of-service' | 'planned-outage' | 'restored' }
export interface EquipmentStatusInput {
  readonly targetEquipmentId: string; readonly sourceTimestamp?: Date; readonly decisionTime: Date;
  readonly retrievalSucceeded: boolean; readonly structureValid: boolean; readonly complete: boolean;
  readonly internallyConsistent: boolean; readonly joinable: boolean; readonly records: readonly EquipmentOutageRecord[];
  readonly totalRecordCount: number; readonly badRecordCount: number;
  readonly inventory: { readonly acceptedAt: Date; readonly equipmentIds: readonly string[] };
  readonly previousActiveOutageIds?: readonly string[]; readonly previousZeroSnapshotAt?: Date;
  readonly contextualInconsistency?: boolean; readonly priorOutage?: boolean; readonly explicitRestoration?: boolean;
  readonly explicitRestorationIds?: readonly string[]; readonly omissionTimestamps?: readonly (Date | null)[];
}
export interface EquipmentStatusDecision {
  readonly health: EquipmentHealth; readonly state: EquipmentMachineState; readonly freshnessCopy: string;
  readonly inventoryReview: 'current' | 'overdue' | 'expired'; readonly anomaly: boolean;
  readonly provisionalEmpty: boolean; readonly restored: boolean; readonly reason: string;
}
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function assessEquipmentStatus(input: EquipmentStatusInput): EquipmentStatusDecision {
  const age = input.sourceTimestamp ? input.decisionTime.getTime() - input.sourceTimestamp.getTime() : Number.NaN;
  const inventoryAge = input.decisionTime.getTime() - input.inventory.acceptedAt.getTime();
  const inventoryReview = inventoryAge >= 7 * DAY ? 'expired' : inventoryAge > DAY ? 'overdue' : 'current';
  const inventory = new Set(input.inventory.equipmentIds);
  const duplicateCount = input.records.length - new Set(input.records.map((record) => record.equipmentId)).size;
  const unmatchedCount = input.records.filter((record) => !inventory.has(record.equipmentId)).length;
  const badRatio = input.totalRecordCount === 0 ? 0 : (input.badRecordCount + duplicateCount + unmatchedCount) / input.totalRecordCount;
  const previous = new Set(input.previousActiveOutageIds ?? []);
  const current = new Set(input.records.filter((record) => record.state === 'out-of-service').map((record) => record.equipmentId));
  const explicit = new Set(input.explicitRestorationIds ?? []);
  const missing = [...previous].filter((id) => !current.has(id) && !explicit.has(id)).length;
  const disappearanceRatio = previous.size === 0 ? 0 : missing / previous.size;
  const anomaly = disappearanceRatio > 0.5 || badRatio > 0.1 || input.contextualInconsistency === true;
  const unusable = !input.retrievalSucceeded || !input.structureValid || !input.complete || !input.internallyConsistent
    || !input.joinable || !Number.isFinite(age) || age < 0 || inventoryAge < 0 || unmatchedCount > 0 || inventoryReview === 'expired';
  const health: EquipmentHealth = unusable || age > 15 * MINUTE ? 'unavailable' : anomaly || age > 5 * MINUTE ? 'degraded' : 'current';
  const freshnessCopy = Number.isFinite(age) && age >= 0 ? `Checked ${Math.floor(age / MINUTE)} min ago` : 'Checked time unavailable';
  const target = input.records.find((record) => record.equipmentId === input.targetEquipmentId);
  const restored = health === 'current' && restorationPasses(input, target);
  const provisionalEmpty = health === 'current' && input.records.length === 0
    && (!input.previousZeroSnapshotAt || !input.sourceTimestamp || input.sourceTimestamp.getTime() - input.previousZeroSnapshotAt.getTime() < MINUTE);
  let state: EquipmentMachineState = 'unknown';
  let reason = 'Current status cannot be verified from accepted evidence.';
  if (health !== 'current') {
    if (input.priorOutage) { state = 'out-of-service-rechecking'; reason = 'A prior official outage is being rechecked.'; }
  } else if (input.priorOutage && !restored) {
    state = 'out-of-service-rechecking'; reason = 'A prior official outage awaits qualifying restoration evidence.';
  } else if (target?.state === 'out-of-service') {
    state = 'out-of-service'; reason = 'A current official outage record matches the exact equipment identity.';
  } else if (target?.state === 'planned-outage') {
    state = 'planned-outage'; reason = 'A future official planned outage matches the exact equipment identity.';
  } else if (input.records.length === 0) {
    if (!provisionalEmpty && input.previousZeroSnapshotAt) { state = 'no-official-outage-reported'; reason = 'Two coherent current zero-outage snapshots are at least one authoritative minute apart.'; }
    else reason = 'The first coherent zero-outage snapshot is Provisional empty.';
  } else if (inventory.has(input.targetEquipmentId) && !target) {
    state = 'no-official-outage-reported'; reason = 'A coherent non-empty same-scope snapshot has no matching target outage.';
  } else if (restored) {
    state = 'no-official-outage-reported'; reason = 'Accepted exact-machine restoration evidence passed.';
  }
  return Object.freeze({ health, state, freshnessCopy, inventoryReview, anomaly, provisionalEmpty, restored, reason });
}

function restorationPasses(input: EquipmentStatusInput, target: EquipmentOutageRecord | undefined): boolean {
  if (!input.priorOutage) return false;
  if (input.explicitRestoration || target?.state === 'restored') return true;
  const observations = input.omissionTimestamps ?? [];
  const first = observations.at(-2); const second = observations.at(-1);
  return first instanceof Date && second instanceof Date
    && second.getTime() - first.getTime() >= MINUTE
    && first.getTime() <= input.decisionTime.getTime()
    && second.getTime() <= input.decisionTime.getTime();
}
