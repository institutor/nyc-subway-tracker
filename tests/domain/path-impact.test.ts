import { describe, expect, test } from 'vitest';
import { accessiblePathDecisionAllowsUse } from '../../src/shared/domain/accessible-path';
import { acceptEquipmentHistory, acceptEquipmentInventory, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { classifyPathImpact, impactDecisionAllowsUse } from '../../src/shared/domain/path-impact';
import { resolvedPath } from '../fixtures/accessibility-decisions';

function equipment(targetEquipmentId = 'EL-1', sourceScopeId = 'nyc-equipment', sourceVersion = 'equipment-v1') {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId, sourceVersion: 'inv-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-1', 'EL-2'] });
  const history = acceptEquipmentHistory({ historyId: 'history', evidenceOwner: 'official-equipment-status', sourceScopeId, sourceVersion, inventoryVersion: 'inv-v1', snapshots: [{ snapshotId: 'snap', sequenceOrdinal: 1, predecessorSnapshotId: null, evidenceOwner: 'official-equipment-status', sourceScopeId, sourceVersion, inventoryVersion: 'inv-v1', sourceTimestamp: '2026-08-01T00:01:00.000Z', acceptedAt: '2026-08-01T00:01:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out-1', equipmentId: 'EL-1', state: 'out-of-service' }] }] }, inventory);
  return assessEquipmentStatus({ targetEquipmentId, decisionTime: new Date('2026-08-01T00:02:00.000Z'), inventory, history });
}

function adverseEquipmentAt(decisionTime: string) {
  const inventory = acceptEquipmentInventory({
    inventoryId: 'stale-adverse-inventory', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inv-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-1'],
  });
  const history = acceptEquipmentHistory({
    historyId: 'stale-adverse-history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', snapshots: [{
      snapshotId: 'stale-adverse', sequenceOrdinal: 1, predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1',
      sourceTimestamp: '2026-08-01T00:00:00.000Z', acceptedAt: '2026-08-01T00:00:01.000Z', declaredRecordCount: 1,
      records: [{ recordId: 'out-1', equipmentId: 'EL-1', state: 'out-of-service' }],
    }],
  }, inventory);
  return assessEquipmentStatus({
    targetEquipmentId: 'EL-1', decisionTime: new Date(decisionTime), inventory, history,
  });
}

function supersededSelectedPathContext() {
  const inventory = acceptEquipmentInventory({
    inventoryId: 'superseded-selected-inventory', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inv-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-1', 'EL-2'],
  });
  const first = {
    snapshotId: 'healthy-first', sequenceOrdinal: 1, predecessorSnapshotId: null,
    evidenceOwner: 'official-equipment-status' as const, sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1',
    sourceTimestamp: '2026-08-01T00:00:00.000Z', acceptedAt: '2026-08-01T00:00:01.000Z', declaredRecordCount: 1,
    records: [{ recordId: 'out-other', equipmentId: 'EL-2', state: 'out-of-service' as const }],
  };
  const initial = acceptEquipmentHistory({
    historyId: 'superseded-selected-history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', snapshots: [first],
  }, inventory);
  const healthy = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime: new Date('2026-08-01T00:01:00.000Z'), inventory, history: initial });
  const selectedPath = path('selected', ['EL-1'], true, {
    decisionTime: '2026-08-01T00:01:00.000Z', equipmentDecisions: { 'EL-1': healthy },
  });
  const extended = acceptEquipmentHistory({
    historyId: 'superseded-selected-history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', snapshots: [first, {
      snapshotId: 'new-adverse', sequenceOrdinal: 2, predecessorSnapshotId: 'healthy-first',
      evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1',
      sourceTimestamp: '2026-08-01T00:02:00.000Z', acceptedAt: '2026-08-01T00:02:01.000Z', declaredRecordCount: 1,
      records: [{ recordId: 'new-outage', equipmentId: 'EL-1', state: 'out-of-service' }],
    }],
  }, inventory);
  const decisionTime = new Date('2026-08-01T00:06:00.000Z');
  const adverse = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime, inventory, history: extended });
  return { selectedPath, adverse, decisionTime };
}

const path = (id: string, equipmentIds: readonly string[], eligible = true, overrides: Parameters<typeof resolvedPath>[2] = {}) =>
  resolvedPath(id, eligible ? 'eligible' : 'ineligible', { equipmentIds, ...overrides });
const impactTime = new Date('2026-08-01T00:02:00.000Z');

describe('selected-path equipment impact', () => {
  test('classifies an exact non-member first as Unrelated without widening station scope', () => {
    expect(classifyPathImpact({ changedEquipment: equipment('EL-2'), selectedPath: path('selected', ['EL-1']), alternatePaths: [], decisionTime: impactTime }))
      .toMatchObject({ kind: 'unrelated', affectedPathId: null, accessibleRouteOnly: true, destinationIntent: 'destination-street' });
  });

  test('does not create an impact from a current healthy member decision', () => {
    expect(classifyPathImpact({
      changedEquipment: equipment('EL-2'), selectedPath: path('selected', ['EL-2']), alternatePaths: [], decisionTime: impactTime,
    })).toBeUndefined();
  });

  test('creates a fail-closed impact from genuine degraded adverse evidence', () => {
    const decisionTime = new Date('2026-08-01T00:05:00.001Z');
    const selectedPath = path('selected', ['EL-1'], true, { decisionTime: '2026-08-01T00:05:00.000Z' });
    expect(classifyPathImpact({
      changedEquipment: adverseEquipmentAt(decisionTime.toISOString()), selectedPath, alternatePaths: [], decisionTime,
    })).toMatchObject({ kind: 'blocking', evidenceState: 'out-of-service-rechecking', affectedPathId: 'selected' });
  });

  test('creates a fail-closed impact from an opaque selected path revoked by its appended outage', () => {
    const context = supersededSelectedPathContext();
    expect(accessiblePathDecisionAllowsUse(context.selectedPath, context.decisionTime)).toBe(false);
    const impact = classifyPathImpact({
      changedEquipment: context.adverse, selectedPath: context.selectedPath, alternatePaths: [], decisionTime: context.decisionTime,
    });
    expect(impact).toMatchObject({ kind: 'blocking', evidenceState: 'out-of-service', affectedPathId: 'selected' });
    expect(impactDecisionAllowsUse(impact, context.decisionTime)).toBe(true);
  });

  test('creates a fail-closed impact from an unrestored accepted outage beyond fifteen minutes', () => {
    const decisionTime = new Date('2026-08-01T00:15:00.001Z');
    const selectedPath = path('selected', ['EL-1'], true, { decisionTime: decisionTime.toISOString() });
    expect(classifyPathImpact({
      changedEquipment: adverseEquipmentAt(decisionTime.toISOString()), selectedPath, alternatePaths: [], decisionTime,
    })).toMatchObject({ kind: 'blocking', evidenceState: 'out-of-service-rechecking', affectedPathId: 'selected' });
  });

  test('rejects the same equipment identity from a different official stream', () => {
    expect(classifyPathImpact({
      changedEquipment: equipment('EL-1', 'other-scope'), selectedPath: path('selected', ['EL-1']), alternatePaths: [], decisionTime: impactTime,
    })).toBeUndefined();
  });

  test('classifies Reroutable only with an independently resolved eligible same-complex path', () => {
    const base = { changedEquipment: equipment(), selectedPath: path('selected', ['EL-1']), decisionTime: impactTime };
    expect(classifyPathImpact({ ...base, alternatePaths: [path('alternate', ['EL-2'])] })).toMatchObject({ kind: 'reroutable-within-station', replacementPathId: 'alternate', autoSelected: false, evidenceState: 'out-of-service' });
    expect(classifyPathImpact({ ...base, alternatePaths: [path('alternate', ['EL-2'], false)] })).toMatchObject({ kind: 'blocking', evidenceState: 'out-of-service' });
  });

  test('preserves exact destination intent and Accessible Route Only when Blocking', () => {
    expect(classifyPathImpact({ changedEquipment: equipment(), selectedPath: path('selected', ['EL-1'], true, { destinationIntent: 'other-destination' }), alternatePaths: [path('wrong-scope', ['EL-2'])], decisionTime: impactTime }))
      .toMatchObject({ kind: 'blocking', accessibleRouteOnly: true, destinationIntent: 'other-destination' });
  });

  test('rejects caller-authored path or equipment approval objects', () => {
    const selected = path('selected', ['EL-1']);
    expect(classifyPathImpact({ changedEquipment: { ...equipment() } as never, selectedPath: selected, alternatePaths: [], decisionTime: impactTime })).toBeUndefined();
    expect(classifyPathImpact({ changedEquipment: equipment(), selectedPath: { ...selected } as never, alternatePaths: [], decisionTime: impactTime })).toBeUndefined();
  });

  test('does not let a caller invent equipment membership around an opaque path decision', () => {
    const selected = path('selected', []);
    expect(classifyPathImpact({ changedEquipment: equipment(), selectedPath: selected, alternatePaths: [], decisionTime: impactTime }))
      .toMatchObject({ kind: 'unrelated', affectedPathId: null });
  });

  test('does not let a caller mask a wrong-complex path as a same-complex alternate', () => {
    const selected = path('selected', ['EL-1']);
    const disguised = path('alternate', ['EL-2'], true, { stationComplexId: 'B99' });
    expect(classifyPathImpact({ changedEquipment: equipment(), selectedPath: selected, alternatePaths: [disguised], decisionTime: impactTime }))
      .toMatchObject({ kind: 'blocking' });
  });
});
