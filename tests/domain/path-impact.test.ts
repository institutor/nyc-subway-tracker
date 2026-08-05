import { describe, expect, test } from 'vitest';
import { classifyPathImpact } from '../../src/shared/domain/path-impact';

const path = (id: string, equipmentIds: readonly string[], verified = true) => ({
  id, canonicalIdentity: id, complexId: 'A12', origin: 'origin-street', destination: 'destination-street', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentIds, everyEdgeCurrentAndVerified: verified,
  edges: [{ id: `${id}-edge`, routeId: 'A', direction: 'northbound', platformId: 'A12N', current: verified, structurallyVerified: verified, officialAccessiblePath: verified }],
});

describe('selected-path equipment impact', () => {
  test('classifies an exact non-member first as Unrelated without widening station scope', () => {
    expect(classifyPathImpact({ changedEquipmentId: 'EL-OTHER', equipmentState: 'out-of-service', selectedPath: path('selected', ['EL-1']), alternatePaths: [], accessibleRouteOnly: true, destinationIntent: 'destination-street' })).toEqual({ kind: 'unrelated', affectedPathId: null, accessibleRouteOnly: true, destinationIntent: 'destination-street' });
  });

  test('classifies Reroutable only with an independently complete current same-complex chain', () => {
    const base = { changedEquipmentId: 'EL-1', equipmentState: 'unknown' as const, selectedPath: path('selected', ['EL-1']), accessibleRouteOnly: true, destinationIntent: 'destination-street' };
    expect(classifyPathImpact({ ...base, alternatePaths: [path('alternate', ['EL-2'])] })).toMatchObject({ kind: 'reroutable-within-station', replacementPathId: 'alternate', autoSelected: false, evidenceState: 'unknown' });
    expect(classifyPathImpact({ ...base, alternatePaths: [path('alternate', ['EL-2'], false)] })).toMatchObject({ kind: 'blocking', evidenceState: 'unknown' });
  });

  test('preserves exact destination intent and Accessible Route Only when Blocking', () => {
    expect(classifyPathImpact({ changedEquipmentId: 'EL-1', equipmentState: 'out-of-service', selectedPath: path('selected', ['EL-1']), alternatePaths: [path('wrong-scope', ['EL-2'])], accessibleRouteOnly: true, destinationIntent: 'other-destination' })).toMatchObject({ kind: 'blocking', accessibleRouteOnly: true, destinationIntent: 'other-destination' });
  });

  test('does not trust a passing summary when any alternate edge lacks independent current evidence', () => {
    const alternate = { ...path('alternate', ['EL-2']), edges: [{ id: 'alt-edge', routeId: 'A', direction: 'northbound', platformId: 'A12N', current: false, structurallyVerified: true, officialAccessiblePath: true }] };
    expect(classifyPathImpact({ changedEquipmentId: 'EL-1', equipmentState: 'unknown', selectedPath: path('selected', ['EL-1']), alternatePaths: [alternate], accessibleRouteOnly: true, destinationIntent: 'destination-street' })).toMatchObject({ kind: 'blocking' });
  });
});
