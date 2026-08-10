import { describe, expect, test } from 'vitest';
import {
  acceptAccessibilityAlternativeRegistry,
  acceptNearbyStationEvidence,
  alternativeSelectionAllowsUse,
  chooseAccessibilityAlternative,
  grantBusAlternativeConsent,
  type AccessibilityAlternativeOfferInput,
  type AccessibilityAlternativeTier,
} from '../../src/shared/domain/accessibility-alternatives';
import { acceptEquipmentHistory, acceptEquipmentInventory, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { resolvedPath } from '../fixtures/accessibility-decisions';

const decisionTime = new Date('2026-08-01T00:00:00.000Z');

function candidate(
  id: string,
  tier: AccessibilityAlternativeTier,
  overrides: Partial<AccessibilityAlternativeOfferInput> = {},
) {
  const path = resolvedPath(id, 'eligible', {
    stationComplexId: tier === 'nearby-station' || tier === 'bus-inclusive' ? `complex:${id}` : 'A12',
  });
  const offer: AccessibilityAlternativeOfferInput = {
    offerId: id,
    evidenceOwner: 'app-owned-accessibility-alternatives',
    label: `Use ${id}`,
    canonicalIdentity: path.pathId,
    pathEvaluationId: path.evaluationId,
    pathPackageVersion: path.packageVersion,
    tier,
    originIntent: path.originIntent,
    destinationIntent: path.destinationIntent,
    singlePointElevatorDependencies: 1,
    transfers: 1,
    accessibleWalkingMeters: 200,
    disruptionRisk: 1,
    travelSeconds: 1200,
    includesBus: tier === 'bus-inclusive',
    ...overrides,
  };
  return { path, offer };
}

function registry(
  candidates: readonly ReturnType<typeof candidate>[],
  selectedPath = resolvedPath('selected'),
  nearbyEvidence = candidates.filter(({ offer }) => offer.tier === 'nearby-station').map(({ path }, index) => acceptNearbyStationEvidence({
    evidenceId: `nearby:${index}:${path.pathId}`,
    evidenceOwner: 'app-owned-nearby-stations',
    selectedStationComplexId: selectedPath.stationComplexId,
    candidateStationComplexId: path.stationComplexId,
    originIntent: selectedPath.originIntent,
    destinationIntent: selectedPath.destinationIntent,
    verifiedAt: decisionTime.toISOString(),
    validThrough: '2026-08-01T00:10:00.000Z',
  }, selectedPath, path)),
  validThrough = '2026-08-01T00:10:00.000Z',
) {
  return acceptAccessibilityAlternativeRegistry({
    registryId: `registry:${candidates.map(({ offer }) => offer.offerId).join(',') || 'empty'}`,
    evidenceOwner: 'app-owned-accessibility-alternatives',
    selectedPathEvaluationId: selectedPath.evaluationId,
    createdAt: decisionTime.toISOString(),
    validThrough,
    offers: candidates.map(({ offer }) => offer),
  }, selectedPath, candidates.map(({ path }) => path), nearbyEvidence);
}

describe('accessible alternatives', () => {
  test('uses exact tier order and never lets a faster later tier overtake same-complex evidence', () => {
    const candidates = [
      candidate('bus', 'bus-inclusive', { travelSeconds: 60 }),
      candidate('detour', 'subway-detour', { travelSeconds: 120 }),
      candidate('nearby', 'nearby-station', { travelSeconds: 180 }),
      candidate('same', 'same-complex', { travelSeconds: 900 }),
    ];
    const accepted = registry(candidates);
    const result = chooseAccessibilityAlternative(accepted, { busConsent: grantBusAlternativeConsent(accepted, decisionTime), decisionTime });
    expect(result).toMatchObject({ first: { id: 'same' }, selectedId: null });
  });

  test('applies rider-relevant lexicographic order then canonical identity within one tier', () => {
    const options = [
      candidate('z', 'same-complex'),
      candidate('a', 'same-complex'),
      candidate('fewer-elevators', 'same-complex', { singlePointElevatorDependencies: 0, travelSeconds: 5000 }),
    ];
    expect(chooseAccessibilityAlternative(registry(options), { decisionTime }).first?.id).toBe('fewer-elevators');
    expect(chooseAccessibilityAlternative(registry(options.slice(0, 2)), { decisionTime }).first?.id).toBe('a');
  });

  test('rejects unresolved or caller-authored path evaluations and exposes only the first verified option', () => {
    const valid = candidate('bad', 'same-complex');
    const bad = { ...valid, path: resolvedPath('bad', 'ineligible') };
    expect(() => registry([bad])).toThrow(/exact current accepted path evaluation/i);

    const options = [candidate('nearby', 'nearby-station'), candidate('detour', 'subway-detour')];
    const accepted = registry(options);
    const result = chooseAccessibilityAlternative(accepted, { decisionTime });
    expect(result).toMatchObject({ first: { id: 'nearby' }, visible: [{ id: 'nearby' }], selectedId: null, accessibleRouteOnly: true });
    expect(() => chooseAccessibilityAlternative({ ...accepted } as never, { decisionTime })).toThrow(/accepted/i);
  });

  test('requires a separate explicit choice before bus-inclusive options enter consideration', () => {
    const accepted = registry([candidate('bus', 'bus-inclusive')]);
    expect(chooseAccessibilityAlternative(accepted, { decisionTime }).first).toBeNull();
    const consent = grantBusAlternativeConsent(accepted, decisionTime);
    expect(chooseAccessibilityAlternative(accepted, { busConsent: consent, decisionTime }).first?.id).toBe('bus');
    expect(chooseAccessibilityAlternative(accepted, { busConsent: { ...consent } as never, decisionTime }).first).toBeNull();
    const otherRegistry = registry([candidate('bus', 'bus-inclusive')], resolvedPath('other-selected'));
    expect(chooseAccessibilityAlternative(otherRegistry, { busConsent: consent, decisionTime }).first).toBeNull();
  });

  test('returns an opaque, immutable selection with exact offer and path evaluation linkage', () => {
    const accepted = registry([candidate('same', 'same-complex')]);
    const selection = chooseAccessibilityAlternative(accepted, { decisionTime });
    expect(selection).toMatchObject({ registryId: accepted.registryId, first: { offerId: 'same', pathEvaluationId: expect.any(String) } });
    expect(Object.isFrozen(selection)).toBe(true);
    expect(Object.isFrozen(selection.visible)).toBe(true);
  });

  test('does not let copied offer fields erase bus consent or forge a better tier and metrics', () => {
    const bus = candidate('bus', 'bus-inclusive');
    const forged = {
      ...bus,
      offer: {
        ...bus.offer,
        tier: 'same-complex' as const,
        includesBus: false,
        singlePointElevatorDependencies: 0,
        transfers: 0,
        accessibleWalkingMeters: 0,
        disruptionRisk: 0,
        travelSeconds: 1,
      },
    };
    expect(() => registry([forged])).toThrow(/same-complex|station scope/i);
    const verified = registry([candidate('verified', 'same-complex')]);
    expect(chooseAccessibilityAlternative(verified, { decisionTime }).first?.id).toBe('verified');
  });

  test('rejects reusing the selected evaluation or canonical path as its own alternative', () => {
    const selectedPath = resolvedPath('selected');
    const reused = candidate('selected', 'same-complex');
    expect(reused.path.pathId).toBe(selectedPath.pathId);
    expect(() => registry([reused], selectedPath)).toThrow(/selected path|alternative/i);
  });

  test('requires opaque app-owned nearby-station evidence instead of trusting the caller tier', () => {
    const selectedPath = resolvedPath('selected');
    const nearby = candidate('nearby-owned', 'nearby-station');
    expect(() => registry([nearby], selectedPath, [])).toThrow(/nearby.*evidence|evidence.*nearby/i);
    const genuine = acceptNearbyStationEvidence({
      evidenceId: 'nearby-owned-evidence', evidenceOwner: 'app-owned-nearby-stations',
      selectedStationComplexId: selectedPath.stationComplexId, candidateStationComplexId: nearby.path.stationComplexId,
      originIntent: selectedPath.originIntent, destinationIntent: selectedPath.destinationIntent,
      verifiedAt: decisionTime.toISOString(), validThrough: '2026-08-01T00:10:00.000Z',
    }, selectedPath, nearby.path);
    expect(() => registry([nearby], selectedPath, [{ ...genuine } as never])).toThrow(/nearby.*evidence|accepted/i);
    expect(chooseAccessibilityAlternative(registry([nearby], selectedPath, [genuine]), { decisionTime }).first?.id).toBe('nearby-owned');
  });

  test('revokes a resolved selection when its candidate equipment ledger advances before the selection interval ends', () => {
    const inventory = acceptEquipmentInventory({
      inventoryId: 'inventory:live-candidate', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'inventory-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-CANDIDATE', 'EL-OTHER'],
    });
    const firstSnapshot = {
      snapshotId: 'candidate-snapshot-1', sequenceOrdinal: 1, predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status' as const, sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
      sourceTimestamp: '2026-08-01T00:00:00.000Z', acceptedAt: '2026-08-01T00:00:00.000Z', declaredRecordCount: 1,
      records: [{ recordId: 'out-other', equipmentId: 'EL-OTHER', state: 'out-of-service' }],
    };
    const history = acceptEquipmentHistory({
      historyId: 'history:live-candidate', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [firstSnapshot],
    }, inventory);
    const candidateEquipment = assessEquipmentStatus({ targetEquipmentId: 'EL-CANDIDATE', decisionTime, inventory, history });
    const path = resolvedPath('live-candidate', 'eligible', {
      equipmentIds: ['EL-CANDIDATE'], equipmentDecisions: { 'EL-CANDIDATE': candidateEquipment },
    });
    const liveCandidate = {
      path,
      offer: {
        offerId: 'live-candidate', evidenceOwner: 'app-owned-accessibility-alternatives' as const, label: 'Use live candidate',
        canonicalIdentity: path.pathId, pathEvaluationId: path.evaluationId, pathPackageVersion: path.packageVersion,
        tier: 'same-complex' as const, originIntent: path.originIntent, destinationIntent: path.destinationIntent,
        singlePointElevatorDependencies: 1, transfers: 0, accessibleWalkingMeters: 100, disruptionRisk: 0,
        travelSeconds: 60, includesBus: false,
      },
    };
    const selection = chooseAccessibilityAlternative(
      registry([liveCandidate], resolvedPath('selected'), [], '2026-08-01T00:04:00.000Z'),
      { decisionTime },
    );
    expect(alternativeSelectionAllowsUse(selection, decisionTime)).toBe(true);

    acceptEquipmentHistory({
      historyId: 'history:live-candidate', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
      sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [firstSnapshot, {
        snapshotId: 'candidate-snapshot-2', sequenceOrdinal: 2, predecessorSnapshotId: 'candidate-snapshot-1',
        evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
        sourceTimestamp: '2026-08-01T00:01:00.000Z', acceptedAt: '2026-08-01T00:01:01.000Z', declaredRecordCount: 2,
        records: [
          { recordId: 'out-other', equipmentId: 'EL-OTHER', state: 'out-of-service' },
          { recordId: 'out-candidate', equipmentId: 'EL-CANDIDATE', state: 'out-of-service' },
        ],
      }],
    }, inventory);

    expect(alternativeSelectionAllowsUse(selection, new Date('2026-08-01T00:02:00.000Z'))).toBe(false);
  });

  test.each([
    ['negative', { travelSeconds: -1 }],
    ['non-finite', { disruptionRisk: Number.POSITIVE_INFINITY }],
    ['fractional count', { transfers: 0.5 }],
  ])('rejects %s rider-relevant ranking metrics', (_label, overrides) => {
    expect(() => registry([candidate('invalid', 'same-complex', overrides)])).toThrow(/invalid/i);
  });
});
