import { describe, expect, test } from 'vitest';

import {
  acceptEquipmentInventory,
  acceptEquipmentRestoration,
  acceptEquipmentSnapshot,
  assessEquipmentStatus,
  type AcceptedEquipmentInventory,
  type AcceptedEquipmentSnapshot,
  type EquipmentOutageRecord,
} from '../../src/shared/domain/equipment-status';

const at = (value: string) => new Date(value);

function inventory(overrides: Record<string, unknown> = {}) {
  return acceptEquipmentInventory({
    inventoryId: 'inventory-v1', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inventory-v1', acceptedAt: '2026-07-30T00:00:00.000Z',
    equipmentIds: ['EL-1', 'EL-2', ...Array.from({ length: 20 }, (_, index) => `EL-X${index}`)], ...overrides,
  });
}

function snapshot(
  acceptedInventory: AcceptedEquipmentInventory,
  overrides: Record<string, unknown> = {},
): AcceptedEquipmentSnapshot {
  const records = (overrides.records ?? [{ recordId: 'out-2', equipmentId: 'EL-2', state: 'out-of-service' }]) as readonly unknown[];
  return acceptEquipmentSnapshot({
    snapshotId: 'snapshot-current', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', sourceTimestamp: '2026-07-30T12:00:00.000Z',
    acceptedAt: '2026-07-30T12:00:05.000Z', declaredRecordCount: records.length, records, ...overrides,
  }, acceptedInventory);
}

function assess(options: {
  targetEquipmentId?: string;
  decisionTime?: string;
  inventory?: AcceptedEquipmentInventory;
  currentSnapshot?: AcceptedEquipmentSnapshot;
  priorDecision?: ReturnType<typeof assessEquipmentStatus>;
  recoverySnapshots?: readonly AcceptedEquipmentSnapshot[];
  restorationRecords?: readonly ReturnType<typeof acceptEquipmentRestoration>[];
} = {}) {
  const acceptedInventory = options.inventory ?? inventory();
  const currentSnapshot = options.currentSnapshot ?? snapshot(acceptedInventory);
  return assessEquipmentStatus({
    targetEquipmentId: options.targetEquipmentId ?? 'EL-1', decisionTime: at(options.decisionTime ?? '2026-07-30T12:02:00.000Z'),
    inventory: acceptedInventory, currentSnapshot, priorDecision: options.priorDecision,
    recoverySnapshots: options.recoverySnapshots, restorationRecords: options.restorationRecords,
  });
}

function priorOutage(acceptedInventory: AcceptedEquipmentInventory) {
  const adverse = snapshot(acceptedInventory, {
    snapshotId: 'snapshot-outage', sourceTimestamp: '2026-07-30T12:00:00.000Z', acceptedAt: '2026-07-30T12:00:05.000Z',
    records: [{ recordId: 'outage-1', equipmentId: 'EL-1', state: 'out-of-service' }],
  });
  return assess({ inventory: acceptedInventory, currentSnapshot: adverse, decisionTime: '2026-07-30T12:01:00.000Z' });
}

function omission(acceptedInventory: AcceptedEquipmentInventory, id: string, time: string, overrides: Record<string, unknown> = {}) {
  return snapshot(acceptedInventory, {
    snapshotId: id, sourceTimestamp: time, acceptedAt: new Date(Date.parse(time) + 5_000).toISOString(), records: [], ...overrides,
  });
}

describe('accepted equipment evidence', () => {
  test('copies and deeply freezes accepted inventory and snapshot populations', () => {
    const ids = ['EL-1', 'EL-2'];
    const rawRecords: EquipmentOutageRecord[] = [{ recordId: 'out-2', equipmentId: 'EL-2', state: 'out-of-service' }];
    const acceptedInventory = inventory({ equipmentIds: ids });
    const acceptedSnapshot = snapshot(acceptedInventory, { records: rawRecords });
    ids[0] = 'FORGED'; rawRecords[0] = { recordId: 'forged', equipmentId: 'EL-1', state: 'out-of-service' };
    expect(acceptedInventory.equipmentIds).toEqual(['EL-1', 'EL-2']);
    expect(acceptedSnapshot.records).toEqual([{ recordId: 'out-2', equipmentId: 'EL-2', state: 'out-of-service' }]);
    expect(Object.isFrozen(acceptedInventory.equipmentIds)).toBe(true);
    expect(Object.isFrozen(acceptedSnapshot.records)).toBe(true);
    expect(Object.isFrozen(acceptedSnapshot.records[0])).toBe(true);
  });

  test('rejects scalar or caller-authored snapshot lookalikes', () => {
    const acceptedInventory = inventory();
    const forged = { ...snapshot(acceptedInventory) } as AcceptedEquipmentSnapshot;
    expect(assess({ inventory: acceptedInventory, currentSnapshot: forged })).toMatchObject({ health: 'unavailable', state: 'unknown' });
  });

  test.each([
    ['2026-07-30T12:05:00.000Z', 'current'], ['2026-07-30T12:05:00.001Z', 'degraded'],
    ['2026-07-30T12:15:00.000Z', 'degraded'], ['2026-07-30T12:15:00.001Z', 'unavailable'],
  ])('classifies exact equipment age boundary %s as %s', (decisionTime, health) => {
    expect(assess({ decisionTime }).health).toBe(health);
  });

  test('fails impossible chronology and exact seven-day inventory expiry closed', () => {
    expect(assess({ decisionTime: '2026-07-30T11:59:59.999Z' }).health).toBe('unavailable');
    const acceptedInventory = inventory({ acceptedAt: '2026-07-23T12:00:00.000Z' });
    expect(assess({ inventory: acceptedInventory, currentSnapshot: snapshot(acceptedInventory), decisionTime: '2026-07-30T12:00:00.000Z' }))
      .toMatchObject({ inventoryReview: 'expired', health: 'unavailable', state: 'unknown' });
  });

  test('keeps the first empty provisional and confirms only a coherent consecutive minute pair', () => {
    const acceptedInventory = inventory();
    const first = omission(acceptedInventory, 'empty-1', '2026-07-30T12:01:00.000Z');
    const early = omission(acceptedInventory, 'empty-early', '2026-07-30T12:01:59.999Z');
    const exact = omission(acceptedInventory, 'empty-2', '2026-07-30T12:02:00.000Z');
    expect(assess({ inventory: acceptedInventory, currentSnapshot: first, decisionTime: '2026-07-30T12:01:10.000Z' })).toMatchObject({ state: 'unknown', provisionalEmpty: true });
    expect(assess({ inventory: acceptedInventory, currentSnapshot: early, recoverySnapshots: [first, early], decisionTime: '2026-07-30T12:02:05.000Z' }).state).toBe('unknown');
    expect(assess({ inventory: acceptedInventory, currentSnapshot: exact, recoverySnapshots: [first, exact], decisionTime: '2026-07-30T12:02:05.000Z' }).state).toBe('no-official-outage-reported');
  });

  test.each([
    ['malformed', 10, 1, 'current'], ['malformed', 9, 1, 'degraded'],
    ['duplicate', 10, 1, 'current'], ['duplicate', 9, 1, 'degraded'],
    ['unmatched', 10, 1, 'current'], ['unmatched', 9, 1, 'degraded'],
  ])('uses a strict greater-than-10%% boundary for %s population evidence', (category, count, bad, health) => {
    const acceptedInventory = inventory();
    const records: unknown[] = Array.from({ length: count }, (_, index) => ({ recordId: `out-${index}`, equipmentId: `EL-X${index}`, state: 'planned-outage' }));
    if (category === 'malformed') records[count - bad] = { broken: true };
    if (category === 'duplicate') records[count - bad] = { recordId: 'duplicate', equipmentId: 'EL-X0', state: 'planned-outage' };
    if (category === 'unmatched') records[count - bad] = { recordId: 'unmatched', equipmentId: 'EL-NOT-IN-INVENTORY', state: 'planned-outage' };
    expect(assess({ inventory: acceptedInventory, currentSnapshot: snapshot(acceptedInventory, { records }) }).health).toBe(health);
  });

  test('prioritizes a current exact adverse record even when the surrounding population is anomalous', () => {
    const acceptedInventory = inventory();
    const records = [{ recordId: 'current-outage', equipmentId: 'EL-1', state: 'out-of-service' }, ...Array.from({ length: 8 }, () => ({ broken: true }))];
    expect(assess({ inventory: acceptedInventory, currentSnapshot: snapshot(acceptedInventory, { records }) }))
      .toMatchObject({ state: 'out-of-service', adverseRecordId: 'current-outage', anomaly: true });
  });
});

describe('restoration evidence', () => {
  test('accepts an exact restoration bound to the prior outage, machine, scope, version, and chronology', () => {
    const acceptedInventory = inventory();
    const priorDecision = priorOutage(acceptedInventory);
    const currentSnapshot = omission(acceptedInventory, 'current-empty', '2026-07-30T12:03:00.000Z');
    const restoration = acceptEquipmentRestoration({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z',
    });
    expect(assess({ inventory: acceptedInventory, currentSnapshot, priorDecision, restorationRecords: [restoration], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ restored: true, state: 'no-official-outage-reported' });
  });

  test.each([
    ['future', { restoredAt: '2026-07-30T12:05:00.000Z', acceptedAt: '2026-07-30T12:05:05.000Z' }],
    ['before-outage', { restoredAt: '2026-07-30T11:59:59.999Z', acceptedAt: '2026-07-30T12:02:05.000Z' }],
    ['wrong-scope', { sourceScopeId: 'other-scope' }],
    ['wrong-version', { sourceVersion: 'equipment-v2' }],
    ['wrong-machine', { equipmentId: 'EL-2' }],
    ['wrong-outage', { outageRecordId: 'other-outage' }],
  ])('rejects %s explicit restoration evidence', (_label, overrides) => {
    const acceptedInventory = inventory();
    const priorDecision = priorOutage(acceptedInventory);
    const currentSnapshot = omission(acceptedInventory, 'current-empty', '2026-07-30T12:03:00.000Z');
    const restoration = acceptEquipmentRestoration({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z', ...overrides,
    });
    expect(assess({ inventory: acceptedInventory, currentSnapshot, priorDecision, restorationRecords: [restoration], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ restored: false, state: 'out-of-service-rechecking' });
  });

  test('rejects a restoration accepted before its claimed source time', () => {
    expect(() => acceptEquipmentRestoration({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:01:59.999Z',
    })).toThrow(/chronology/i);
  });

  test.each([
    ['before outage', { firstTime: '2026-07-30T11:57:00.000Z', secondTime: '2026-07-30T11:58:00.000Z' }],
    ['future', { firstTime: '2026-07-30T12:04:00.000Z', secondTime: '2026-07-30T12:05:00.000Z' }],
    ['wrong scope', { first: { sourceScopeId: 'other-scope' } }],
    ['wrong version', { first: { sourceVersion: 'equipment-v2' } }],
    ['wrong inventory', { first: { inventoryVersion: 'inventory-v2' } }],
    ['incoherent', { first: { acceptedAt: '2026-07-30T12:00:00.000Z' } }],
  ])('rejects omission recovery that is %s', (_label, options: { firstTime?: string; secondTime?: string; first?: Record<string, unknown> }) => {
    const acceptedInventory = inventory();
    const priorDecision = priorOutage(acceptedInventory);
    const first = omission(acceptedInventory, 'omit-1', options.firstTime ?? '2026-07-30T12:01:00.000Z', options.first);
    const second = omission(acceptedInventory, 'omit-2', options.secondTime ?? '2026-07-30T12:02:00.000Z');
    expect(assess({ inventory: acceptedInventory, currentSnapshot: second, priorDecision, recoverySnapshots: [first, second], decisionTime: '2026-07-30T12:03:00.000Z' }))
      .toMatchObject({ restored: false, state: 'out-of-service-rechecking' });
  });

  test('requires the recovery sequence to end at the current snapshot and contain two consecutive target omissions', () => {
    const acceptedInventory = inventory();
    const priorDecision = priorOutage(acceptedInventory);
    const first = omission(acceptedInventory, 'omit-1', '2026-07-30T12:01:00.000Z');
    const current = omission(acceptedInventory, 'current', '2026-07-30T12:03:00.000Z');
    const otherCurrent = omission(acceptedInventory, 'other-current', '2026-07-30T12:03:00.000Z');
    const interruption = snapshot(acceptedInventory, { snapshotId: 'interruption', sourceTimestamp: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z', records: [{ recordId: 'again', equipmentId: 'EL-1', state: 'out-of-service' }] });
    expect(assess({ inventory: acceptedInventory, currentSnapshot: current, priorDecision, recoverySnapshots: [first, otherCurrent], decisionTime: '2026-07-30T12:04:00.000Z' }).restored).toBe(false);
    expect(assess({ inventory: acceptedInventory, currentSnapshot: current, priorDecision, recoverySnapshots: [first, interruption, current], decisionTime: '2026-07-30T12:04:00.000Z' }).restored).toBe(false);
  });

  test('a current adverse record always overrides otherwise valid restoration evidence', () => {
    const acceptedInventory = inventory();
    const priorDecision = priorOutage(acceptedInventory);
    const currentSnapshot = snapshot(acceptedInventory, { snapshotId: 'current-adverse', sourceTimestamp: '2026-07-30T12:03:00.000Z', acceptedAt: '2026-07-30T12:03:05.000Z', records: [{ recordId: 'new-outage', equipmentId: 'EL-1', state: 'out-of-service' }] });
    const restoration = acceptEquipmentRestoration({ restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z' });
    expect(assess({ inventory: acceptedInventory, currentSnapshot, priorDecision, restorationRecords: [restoration], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ state: 'out-of-service', restored: false, adverseRecordId: 'new-outage' });
  });
});
