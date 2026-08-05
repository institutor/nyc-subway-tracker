import { describe, expect, test } from 'vitest';

import {
  acceptEquipmentInventory,
  acceptEquipmentHistory,
  acceptEquipmentRestoration,
  assessEquipmentStatus,
  equipmentDecisionAllowsUse,
  equipmentDecisionSupportsAdverseImpact,
  type AcceptedEquipmentHistory,
  type AcceptedEquipmentInventory,
  type EquipmentHistoryEvidenceInput,
  type EquipmentOutageRecord,
  type EquipmentSnapshotEvidenceInput,
} from '../../src/shared/domain/equipment-status';

const at = (value: string) => new Date(value);

function withInheritedField<T extends Record<string, unknown>, K extends keyof T>(value: T, field: K): T {
  const own = { ...value };
  delete own[field];
  return Object.assign(Object.create({ [field]: value[field] }), own, { unexpectedOwnField: true }) as T;
}

function inventory(overrides: Record<string, unknown> = {}) {
  return acceptEquipmentInventory({
    inventoryId: 'inventory-v1', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inventory-v1', acceptedAt: '2026-07-30T00:00:00.000Z',
    equipmentIds: ['EL-1', 'EL-2', ...Array.from({ length: 20 }, (_, index) => `EL-X${index}`)], ...overrides,
  });
}

function snapshot(
  overrides: Record<string, unknown> = {},
): EquipmentSnapshotEvidenceInput {
  const records = (overrides.records ?? [{ recordId: 'out-2', equipmentId: 'EL-2', state: 'out-of-service' }]) as readonly unknown[];
  return {
    snapshotId: 'snapshot-current', sequenceOrdinal: 1, predecessorSnapshotId: null,
    evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', sourceTimestamp: '2026-07-30T12:00:00.000Z',
    acceptedAt: '2026-07-30T12:00:05.000Z', declaredRecordCount: records.length, records, ...overrides,
  } as EquipmentSnapshotEvidenceInput;
}

function history(
  acceptedInventory: AcceptedEquipmentInventory,
  snapshots: readonly EquipmentSnapshotEvidenceInput[],
  overrides: Partial<EquipmentHistoryEvidenceInput> = {},
): AcceptedEquipmentHistory {
  const chained = snapshots.map((item, index) => ({
    ...item,
    sequenceOrdinal: index + 1,
    predecessorSnapshotId: index === 0 ? null : snapshots[index - 1].snapshotId,
  }));
  const first = chained[0];
  return acceptEquipmentHistory({
    historyId: 'equipment-history-v1', evidenceOwner: 'official-equipment-status',
    sourceScopeId: first.sourceScopeId, sourceVersion: first.sourceVersion,
    inventoryVersion: first.inventoryVersion, snapshots: chained, ...overrides,
  }, acceptedInventory);
}

function assess(options: {
  targetEquipmentId?: string;
  decisionTime?: string;
  inventory?: AcceptedEquipmentInventory;
  history?: AcceptedEquipmentHistory;
  snapshots?: readonly EquipmentSnapshotEvidenceInput[];
  restorationRecords?: readonly ReturnType<typeof acceptEquipmentRestoration>[];
} = {}) {
  const acceptedInventory = options.inventory ?? inventory();
  const acceptedHistory = options.history ?? history(acceptedInventory, options.snapshots ?? [snapshot()]);
  return assessEquipmentStatus({
    targetEquipmentId: options.targetEquipmentId ?? 'EL-1', decisionTime: at(options.decisionTime ?? '2026-07-30T12:02:00.000Z'),
    inventory: acceptedInventory, history: acceptedHistory, restorationRecords: options.restorationRecords,
  });
}

function adverse(overrides: Record<string, unknown> = {}) {
  return snapshot({
    snapshotId: 'snapshot-outage', sourceTimestamp: '2026-07-30T12:00:00.000Z', acceptedAt: '2026-07-30T12:00:05.000Z',
    records: [{ recordId: 'outage-1', equipmentId: 'EL-1', state: 'out-of-service' }],
    ...overrides,
  });
}

function omission(id: string, time: string, overrides: Record<string, unknown> = {}) {
  return snapshot({
    snapshotId: id, sourceTimestamp: time, acceptedAt: new Date(Date.parse(time) + 5_000).toISOString(), records: [], ...overrides,
  });
}

describe('accepted equipment evidence', () => {
  test('rejects crowding fields from accepted equipment evidence', () => {
    expect(() => acceptEquipmentInventory({
      inventoryId: 'inventory-v1', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'inventory-v1', acceptedAt: '2026-07-30T00:00:00.000Z', equipmentIds: ['EL-1'], crowding: 'low',
    } as never)).toThrow(/exact schema/i);
  });

  test('copies and deeply freezes accepted inventory and snapshot populations', () => {
    const ids = ['EL-1', 'EL-2'];
    const rawRecords: EquipmentOutageRecord[] = [{ recordId: 'out-2', equipmentId: 'EL-2', state: 'out-of-service' }];
    const acceptedInventory = inventory({ equipmentIds: ids });
    const acceptedHistory = history(acceptedInventory, [snapshot({ records: rawRecords })]);
    ids[0] = 'FORGED'; rawRecords[0] = { recordId: 'forged', equipmentId: 'EL-1', state: 'out-of-service' };
    expect(acceptedInventory.equipmentIds).toEqual(['EL-1', 'EL-2']);
    expect(assess({ inventory: acceptedInventory, history: acceptedHistory })).toMatchObject({ state: 'no-official-outage-reported' });
    expect(Object.isFrozen(acceptedInventory.equipmentIds)).toBe(true);
    expect(Object.isFrozen(acceptedHistory)).toBe(true);
  });

  test('rejects caller-authored history lookalikes', () => {
    const acceptedInventory = inventory();
    const acceptedHistory = history(acceptedInventory, [snapshot()]);
    const forged = { ...acceptedHistory } as AcceptedEquipmentHistory;
    expect(() => assess({ inventory: acceptedInventory, history: forged })).toThrow(/canonical accepted history/i);
  });

  test('owns one canonical stream per accepted inventory and rejects a genuine shortened relabelled ledger', () => {
    const acceptedInventory = inventory();
    const full = [
      adverse(),
      omission('empty-1', '2026-07-30T12:01:00.000Z'),
      omission('empty-2', '2026-07-30T12:02:00.000Z'),
    ];
    history(acceptedInventory, full);
    expect(() => history(acceptedInventory, [full[0], full[2]], { historyId: 'relabeled-short-history' }))
      .toThrow(/canonical accepted ledger/i);
  });

  test('accepts an exact-prefix extension as the next state of the same canonical ledger', () => {
    const acceptedInventory = inventory();
    const first = snapshot({ snapshotId: 'healthy-first' });
    history(acceptedInventory, [first]);
    const extended = history(acceptedInventory, [
      first,
      adverse({ snapshotId: 'new-adverse', sourceTimestamp: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z' }),
    ]);

    expect(assess({ inventory: acceptedInventory, history: extended, decisionTime: '2026-07-30T12:03:00.000Z' }))
      .toMatchObject({ snapshotId: 'new-adverse', state: 'out-of-service' });
  });

  test('revokes an earlier healthy decision as soon as its ledger accepts a newer adverse observation', () => {
    const acceptedInventory = inventory();
    const first = snapshot({ snapshotId: 'healthy-first' });
    const initial = history(acceptedInventory, [first]);
    const earlier = assess({ inventory: acceptedInventory, history: initial, decisionTime: '2026-07-30T12:01:00.000Z' });
    history(acceptedInventory, [
      first,
      adverse({ snapshotId: 'new-adverse', sourceTimestamp: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z' }),
    ]);

    expect(equipmentDecisionAllowsUse(earlier, at('2026-07-30T12:03:00.000Z'))).toBe(false);
  });

  test('rejects a relabelled or non-prefix extension of an accepted ledger', () => {
    const acceptedInventory = inventory();
    const first = snapshot({ snapshotId: 'healthy-first' });
    history(acceptedInventory, [first]);
    const changedPrefix = snapshot({ snapshotId: 'healthy-first', records: [] });
    const next = adverse({ snapshotId: 'new-adverse', sourceTimestamp: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z' });

    expect(() => history(acceptedInventory, [first, next], { historyId: 'relabelled-ledger' }))
      .toThrow(/canonical accepted ledger/i);
    expect(() => history(acceptedInventory, [changedPrefix, next]))
      .toThrow(/prefix|canonical accepted ledger/i);
  });

  test.each([
    ['out-of-order ordinal', { sequenceOrdinal: 3 }],
    ['wrong predecessor', { predecessorSnapshotId: 'not-the-prior-snapshot' }],
    ['duplicate snapshot identity', { snapshotId: 'snapshot-current' }],
  ])('rejects a canonical history with %s', (_label, secondOverrides) => {
    const acceptedInventory = inventory();
    const first = snapshot();
    const second = {
      ...omission('snapshot-next', '2026-07-30T12:01:00.000Z'),
      sequenceOrdinal: 2,
      predecessorSnapshotId: first.snapshotId,
      ...secondOverrides,
    };
    expect(() => acceptEquipmentHistory({
      historyId: 'invalid-chain', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [first, second],
    }, acceptedInventory)).toThrow(/sequence|duplicate/i);
  });

  test('rejects a snapshot receipt that predates its own source observation', () => {
    const acceptedInventory = inventory();
    expect(() => history(acceptedInventory, [snapshot({ acceptedAt: '2026-07-30T11:59:59.999Z' })]))
      .toThrow(/chronology/i);
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
    expect(assess({ inventory: acceptedInventory, snapshots: [snapshot({ sourceTimestamp: '2026-07-30T11:59:55.000Z', acceptedAt: '2026-07-30T12:00:00.000Z' })], decisionTime: '2026-07-30T12:00:00.000Z' }))
      .toMatchObject({ inventoryReview: 'expired', health: 'unavailable', state: 'unknown' });
  });

  test('rejects a current snapshot accepted after the assessment receipt', () => {
    const acceptedInventory = inventory();
    const acceptedLater = snapshot({ acceptedAt: '2026-07-30T12:03:00.000Z' });
    expect(assess({ inventory: acceptedInventory, snapshots: [acceptedLater], decisionTime: '2026-07-30T12:02:00.000Z' }))
      .toMatchObject({ health: 'unavailable', state: 'unknown' });
  });

  test('keeps the first empty provisional and confirms only a coherent consecutive minute pair', () => {
    const acceptedInventory = inventory();
    const first = omission('empty-1', '2026-07-30T12:01:00.000Z');
    const early = omission('empty-early', '2026-07-30T12:01:59.999Z');
    const exact = omission('empty-2', '2026-07-30T12:02:59.999Z');
    const acceptedHistory = history(acceptedInventory, [first, early, exact]);
    expect(assess({ inventory: acceptedInventory, history: acceptedHistory, decisionTime: '2026-07-30T12:01:10.000Z' })).toMatchObject({ state: 'unknown', provisionalEmpty: true });
    expect(assess({ inventory: acceptedInventory, history: acceptedHistory, decisionTime: '2026-07-30T12:02:05.000Z' }).state).toBe('unknown');
    expect(assess({ inventory: acceptedInventory, history: acceptedHistory, decisionTime: '2026-07-30T12:03:05.000Z' }).state).toBe('no-official-outage-reported');
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
    expect(assess({ inventory: acceptedInventory, snapshots: [snapshot({ records })] }).health).toBe(health);
  });

  test('prioritizes a current exact adverse record even when the surrounding population is anomalous', () => {
    const acceptedInventory = inventory();
    const records = [{ recordId: 'current-outage', equipmentId: 'EL-1', state: 'out-of-service' }, ...Array.from({ length: 8 }, () => ({ broken: true }))];
    expect(assess({ inventory: acceptedInventory, snapshots: [snapshot({ records })] }))
      .toMatchObject({ state: 'out-of-service', adverseRecordId: 'current-outage', anomaly: true });
  });

  test('retains the latest exact outage as rechecking one millisecond beyond the current boundary', () => {
    expect(assess({
      snapshots: [adverse()],
      decisionTime: '2026-07-30T12:05:00.001Z',
    })).toMatchObject({
      health: 'degraded',
      state: 'out-of-service-rechecking',
      adverseRecordId: 'outage-1',
      restored: false,
    });
  });

  test('retains an unrestored latest outage and permits only adverse-impact use beyond the unavailable boundary', () => {
    const decisionTime = at('2026-07-30T12:15:00.001Z');
    const decision = assess({ snapshots: [adverse()], decisionTime: decisionTime.toISOString() });
    expect(decision).toMatchObject({
      health: 'unavailable', state: 'out-of-service-rechecking', adverseRecordId: 'outage-1', restored: false,
    });
    expect(equipmentDecisionAllowsUse(decision, decisionTime)).toBe(false);
    expect(equipmentDecisionSupportsAdverseImpact(decision, decisionTime)).toBe(true);
  });

  test('uses the union of bad record identities so overlapping duplicate and unmatched evidence is counted once', () => {
    const acceptedInventory = inventory();
    const records = [
      ...Array.from({ length: 18 }, (_, index) => ({ recordId: `good-${index}`, equipmentId: `EL-X${index}`, state: 'planned-outage' })),
      { recordId: 'unknown-1', equipmentId: 'EL-UNKNOWN', state: 'planned-outage' },
      { recordId: 'unknown-2', equipmentId: 'EL-UNKNOWN', state: 'planned-outage' },
    ];
    expect(assess({ inventory: acceptedInventory, snapshots: [snapshot({ records })] }))
      .toMatchObject({ health: 'current', anomaly: false });
  });

  test('degrades only when the complete adjacent population disappearance is greater than fifty percent', () => {
    const acceptedInventory = inventory();
    const records = (count: number) => Array.from({ length: count }, (_, index) => ({ recordId: `out-${index}`, equipmentId: `EL-X${index}`, state: 'planned-outage' }));
    const previousExact = snapshot({ snapshotId: 'previous-exact', sourceTimestamp: '2026-07-30T11:59:00.000Z', acceptedAt: '2026-07-30T11:59:05.000Z', records: records(4) });
    const exact = snapshot({ records: records(2) });
    expect(assess({ inventory: acceptedInventory, snapshots: [previousExact, exact] }).health).toBe('current');
    const anotherInventory = inventory();
    const previousAbove = snapshot({ snapshotId: 'previous-above', sourceTimestamp: '2026-07-30T11:59:00.000Z', acceptedAt: '2026-07-30T11:59:05.000Z', records: records(5) });
    const above = snapshot({ records: records(2) });
    expect(assess({ inventory: anotherInventory, snapshots: [previousAbove, above] }).health).toBe('degraded');
  });

  test('detects a same-size wholesale replacement of accepted record and equipment identities', () => {
    const acceptedInventory = inventory();
    const population = (prefix: string, equipmentOffset: number) => Array.from({ length: 4 }, (_, index) => ({
      recordId: `${prefix}-${index}`,
      equipmentId: `EL-X${equipmentOffset + index}`,
      state: 'planned-outage',
    }));
    const previous = snapshot({
      snapshotId: 'previous-identities', sourceTimestamp: '2026-07-30T11:59:00.000Z', acceptedAt: '2026-07-30T11:59:05.000Z',
      records: population('prior', 0),
    });
    const replacement = snapshot({ records: population('replacement', 10) });

    expect(assess({ inventory: acceptedInventory, snapshots: [previous, replacement] }))
      .toMatchObject({ health: 'degraded', anomaly: true });
  });

  test('keeps exact fifty-percent identity disappearance non-anomalous and degrades only above it', () => {
    const acceptedInventory = inventory();
    const record = (id: number) => ({ recordId: `out-${id}`, equipmentId: `EL-X${id}`, state: 'planned-outage' });
    const previous = snapshot({
      snapshotId: 'previous-identities', sourceTimestamp: '2026-07-30T11:59:00.000Z', acceptedAt: '2026-07-30T11:59:05.000Z',
      records: [record(0), record(1), record(2), record(3)],
    });
    const exactHalf = snapshot({ records: [record(0), record(1), record(10), record(11)] });
    expect(assess({ inventory: acceptedInventory, snapshots: [previous, exactHalf] }))
      .toMatchObject({ health: 'current', anomaly: false });

    const anotherInventory = inventory();
    const previousFive = snapshot({
      snapshotId: 'previous-five', sourceTimestamp: '2026-07-30T11:59:00.000Z', acceptedAt: '2026-07-30T11:59:05.000Z',
      records: [record(0), record(1), record(2), record(3), record(4)],
    });
    const aboveHalf = snapshot({ records: [record(0), record(1), record(10), record(11), record(12)] });
    expect(assess({ inventory: anotherInventory, snapshots: [previousFive, aboveHalf] }))
      .toMatchObject({ health: 'degraded', anomaly: true });
  });

  test('expires even genuine positive equipment decisions at the five-minute source boundary', () => {
    const decision = assess({ decisionTime: '2026-07-30T12:01:00.000Z' });
    expect(equipmentDecisionAllowsUse(decision, at('2026-07-30T12:05:00.000Z'))).toBe(true);
    expect(equipmentDecisionAllowsUse(decision, at('2026-07-30T12:05:00.001Z'))).toBe(false);
  });
});

describe('equipment evidence own-key schemas', () => {
  test('rejects an inventory whose required owner is inherited beside an extra own field', () => {
    const raw = withInheritedField({
      inventoryId: 'inventory-v1', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'inventory-v1', acceptedAt: '2026-07-30T00:00:00.000Z', equipmentIds: ['EL-1'],
    }, 'evidenceOwner');
    expect(() => acceptEquipmentInventory(raw as never)).toThrow(/exact schema/i);
  });

  test('rejects a history whose required owner is inherited beside an extra own field', () => {
    const acceptedInventory = inventory();
    const raw = withInheritedField({
      historyId: 'equipment-history-v1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [snapshot()],
    }, 'evidenceOwner');
    expect(() => acceptEquipmentHistory(raw as never, acceptedInventory)).toThrow(/exact schema/i);
  });

  test('rejects a snapshot whose required owner is inherited beside an extra own field', () => {
    const acceptedInventory = inventory();
    const inherited = withInheritedField(snapshot() as unknown as Record<string, unknown>, 'evidenceOwner');
    expect(() => acceptEquipmentHistory({
      historyId: 'equipment-history-v1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [inherited as never],
    }, acceptedInventory)).toThrow(/exact schema/i);
  });

  test('rejects a restoration whose required owner is inherited beside an extra own field', () => {
    const raw = withInheritedField({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z',
    }, 'evidenceOwner');
    expect(() => acceptEquipmentRestoration(raw as never)).toThrow(/exact schema/i);
  });

  test('does not accept an outage record whose state is inherited beside an extra own field', () => {
    const inherited = withInheritedField({ recordId: 'outage-1', equipmentId: 'EL-1', state: 'out-of-service' }, 'state');
    expect(assess({ snapshots: [snapshot({ records: [inherited] })] }).state).not.toBe('out-of-service');
  });
});

describe('restoration evidence', () => {
  test('accepts an exact restoration bound to the prior outage, machine, scope, version, and chronology', () => {
    const acceptedInventory = inventory();
    const currentSnapshot = snapshot({ snapshotId: 'current-status', sourceTimestamp: '2026-07-30T12:03:00.000Z', acceptedAt: '2026-07-30T12:03:05.000Z' });
    const restoration = acceptEquipmentRestoration({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z',
    });
    const outageWithStablePopulation = adverse({
      records: [
        { recordId: 'outage-1', equipmentId: 'EL-1', state: 'out-of-service' },
        { recordId: 'out-2', equipmentId: 'EL-2', state: 'out-of-service' },
      ],
    });
    expect(assess({ inventory: acceptedInventory, snapshots: [outageWithStablePopulation, currentSnapshot], restorationRecords: [restoration], decisionTime: '2026-07-30T12:04:00.000Z' }))
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
    const currentSnapshot = omission('current-empty', '2026-07-30T12:03:00.000Z');
    const restoration = acceptEquipmentRestoration({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z', ...overrides,
    });
    expect(assess({ inventory: acceptedInventory, snapshots: [adverse(), currentSnapshot], restorationRecords: [restoration], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ restored: false, state: 'out-of-service-rechecking' });
  });

  test('rejects a restoration accepted before its claimed source time', () => {
    expect(() => acceptEquipmentRestoration({
      restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1',
      equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:01:59.999Z',
    })).toThrow(/chronology/i);
  });

  test('accepts only two consecutive target omissions after the latest adverse observation', () => {
    const acceptedInventory = inventory();
    const first = omission('omit-1', '2026-07-30T12:01:00.000Z');
    const second = omission('omit-2', '2026-07-30T12:02:00.000Z');
    expect(assess({ inventory: acceptedInventory, snapshots: [adverse(), first, second], decisionTime: '2026-07-30T12:03:00.000Z' }))
      .toMatchObject({ restored: true, state: 'no-official-outage-reported' });
  });

  test('does not use omissions before the latest adverse observation', () => {
    const acceptedInventory = inventory();
    const first = omission('old-omit-1', '2026-07-30T11:57:00.000Z');
    const second = omission('old-omit-2', '2026-07-30T11:58:00.000Z');
    const current = omission('current', '2026-07-30T12:03:00.000Z');
    expect(assess({ inventory: acceptedInventory, snapshots: [first, second, adverse(), current], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ restored: false, state: 'out-of-service-rechecking' });
  });

  test('cannot restore when the canonical accepted stream contains an intervening adverse snapshot', () => {
    const acceptedInventory = inventory();
    const first = omission('omit-1', '2026-07-30T12:01:00.000Z');
    const interruption = adverse({ snapshotId: 'intervening-adverse', sourceTimestamp: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z', records: [{ recordId: 'again', equipmentId: 'EL-1', state: 'out-of-service' }] });
    const current = omission('current', '2026-07-30T12:03:00.000Z');
    expect(assess({ inventory: acceptedInventory, snapshots: [adverse(), first, interruption, current], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ restored: false, state: 'out-of-service-rechecking' });
  });

  test.each([
    ['wrong scope', { sourceScopeId: 'other-scope' }],
    ['wrong version', { sourceVersion: 'equipment-v2' }],
    ['wrong inventory', { inventoryVersion: 'inventory-v2' }],
  ])('rejects a history event with the %s stream join', (_label, overrides) => {
    const acceptedInventory = inventory();
    expect(() => history(acceptedInventory, [adverse(), omission('omit-1', '2026-07-30T12:01:00.000Z', overrides)]))
      .toThrow(/stream join/i);
  });

  test('rejects non-monotonic source and acceptance chronology at history acceptance', () => {
    const acceptedInventory = inventory();
    const backwardsSource = omission('backwards-source', '2026-07-30T11:59:00.000Z');
    expect(() => history(acceptedInventory, [adverse(), backwardsSource])).toThrow(/chronology/i);
    const anotherInventory = inventory();
    const backwardsReceipt = omission('backwards-receipt', '2026-07-30T12:01:00.000Z', { acceptedAt: '2026-07-30T12:00:04.000Z' });
    expect(() => history(anotherInventory, [adverse(), backwardsReceipt])).toThrow(/chronology/i);
  });

  test('a current adverse record always overrides otherwise valid restoration evidence', () => {
    const acceptedInventory = inventory();
    const currentSnapshot = adverse({ snapshotId: 'current-adverse', sourceTimestamp: '2026-07-30T12:03:00.000Z', acceptedAt: '2026-07-30T12:03:05.000Z', records: [{ recordId: 'new-outage', equipmentId: 'EL-1', state: 'out-of-service' }] });
    const restoration = acceptEquipmentRestoration({ restorationId: 'restore-1', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', equipmentId: 'EL-1', outageRecordId: 'outage-1', restoredAt: '2026-07-30T12:02:00.000Z', acceptedAt: '2026-07-30T12:02:05.000Z' });
    expect(assess({ inventory: acceptedInventory, snapshots: [adverse(), currentSnapshot], restorationRecords: [restoration], decisionTime: '2026-07-30T12:04:00.000Z' }))
      .toMatchObject({ state: 'out-of-service', restored: false, adverseRecordId: 'new-outage' });
  });
});
