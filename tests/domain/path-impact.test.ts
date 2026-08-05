import { describe, expect, test } from 'vitest';
import { acceptEquipmentInventory, acceptEquipmentSnapshot, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { classifyPathImpact, type ImpactPath } from '../../src/shared/domain/path-impact';
import { resolvedPath } from '../fixtures/accessibility-decisions';

function equipment(targetEquipmentId = 'EL-1') {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'scope', sourceVersion: 'inv-v1', acceptedAt: '2026-07-30T00:00:00.000Z', equipmentIds: ['EL-1', 'EL-2'] });
  const currentSnapshot = acceptEquipmentSnapshot({ snapshotId: 'snap', evidenceOwner: 'official-equipment-status', sourceScopeId: 'scope', sourceVersion: 'status-v1', inventoryVersion: 'inv-v1', sourceTimestamp: '2026-07-30T12:00:00.000Z', acceptedAt: '2026-07-30T12:00:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out-1', equipmentId: 'EL-1', state: 'out-of-service' }] }, inventory);
  return assessEquipmentStatus({ targetEquipmentId, decisionTime: new Date('2026-07-30T12:01:00.000Z'), inventory, currentSnapshot });
}

const path = (id: string, equipmentIds: readonly string[], eligible = true): ImpactPath => ({
  canonicalIdentity: id, complexId: 'A12', origin: 'origin-street', destination: 'destination-street', routeId: 'A',
  direction: 'northbound', platformId: 'A12N', equipmentIds, pathDecision: resolvedPath(id, eligible ? 'eligible' : 'ineligible'),
});

describe('selected-path equipment impact', () => {
  test('classifies an exact non-member first as Unrelated without widening station scope', () => {
    expect(classifyPathImpact({ changedEquipment: equipment('EL-2'), selectedPath: path('selected', ['EL-1']), alternatePaths: [], destinationIntent: 'destination-street' }))
      .toMatchObject({ kind: 'unrelated', affectedPathId: null, accessibleRouteOnly: true, destinationIntent: 'destination-street' });
  });

  test('classifies Reroutable only with an independently resolved eligible same-complex path', () => {
    const base = { changedEquipment: equipment(), selectedPath: path('selected', ['EL-1']), destinationIntent: 'destination-street' };
    expect(classifyPathImpact({ ...base, alternatePaths: [path('alternate', ['EL-2'])] })).toMatchObject({ kind: 'reroutable-within-station', replacementPathId: 'alternate', autoSelected: false, evidenceState: 'out-of-service' });
    expect(classifyPathImpact({ ...base, alternatePaths: [path('alternate', ['EL-2'], false)] })).toMatchObject({ kind: 'blocking', evidenceState: 'out-of-service' });
  });

  test('preserves exact destination intent and Accessible Route Only when Blocking', () => {
    expect(classifyPathImpact({ changedEquipment: equipment(), selectedPath: path('selected', ['EL-1']), alternatePaths: [path('wrong-scope', ['EL-2'])], destinationIntent: 'other-destination' }))
      .toMatchObject({ kind: 'blocking', accessibleRouteOnly: true, destinationIntent: 'other-destination' });
  });

  test('rejects caller-authored path or equipment approval objects', () => {
    const selected = path('selected', ['EL-1']);
    expect(classifyPathImpact({ changedEquipment: { ...equipment() } as never, selectedPath: selected, alternatePaths: [], destinationIntent: 'destination-street' })).toBeUndefined();
    expect(classifyPathImpact({ changedEquipment: equipment(), selectedPath: { ...selected, pathDecision: { ...selected.pathDecision } as never }, alternatePaths: [], destinationIntent: 'destination-street' })).toBeUndefined();
  });
});
