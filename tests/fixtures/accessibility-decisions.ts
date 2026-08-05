import { assessAccessiblePath, type AccessibilityPackage, type StationDirectionCoverageRow } from '../../src/shared/domain/accessible-path';
import type { Direction } from '../../src/shared/domain/types';
import { resolveAccessibilityExposure, VALIDATION_EXPOSURE_REGISTRY } from '../../src/shared/domain/exposure-decision';
import { acceptAccessibilityAlternativeRegistry, chooseAccessibilityAlternative } from '../../src/shared/domain/accessibility-alternatives';
import { acceptEquipmentHistory, acceptEquipmentInventory, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { classifyPathImpact } from '../../src/shared/domain/path-impact';
import { createAccessibilityWarning } from '../../src/shared/domain/underway-warning';

function review(role: string) {
  return { decision: 'approve' as const, reviewer: `${role} Reviewer`, date: '2026-07-30', recordVersion: 'coverage-v1' };
}

export function resolvedPath(
  pathId: string,
  status: 'eligible' | 'ineligible' = 'eligible',
  overrides: {
    readonly stationComplexId?: string;
    readonly constituentStationId?: string;
    readonly originIntent?: string;
    readonly destinationIntent?: string;
    readonly routeId?: string;
    readonly direction?: Direction;
    readonly platformId?: string;
    readonly equipmentIds?: readonly string[];
    readonly decisionTime?: string;
  } = {},
) {
  const stationComplexId = overrides.stationComplexId ?? 'A12';
  const constituentStationId = overrides.constituentStationId ?? 'A12';
  const routeId = overrides.routeId ?? 'A';
  const direction = overrides.direction ?? 'northbound';
  const platformId = overrides.platformId ?? 'A12N';
  const equipmentIds = [...(overrides.equipmentIds ?? [])];
  const edgeIds = equipmentIds.length ? equipmentIds.map((_, index) => `${pathId}:edge:${index + 1}`) : [`${pathId}:edge`];
  const edges = equipmentIds.length ? equipmentIds.map((equipmentId, index) => ({
    id: edgeIds[index], order: index + 1, movementType: 'elevator' as const,
    start: { id: index === 0 ? 'street' : `${pathId}:node:${index}`, level: index === 0 ? 'street' : 'mezzanine' },
    end: { id: index === equipmentIds.length - 1 ? 'platform' : `${pathId}:node:${index + 1}`, level: index === equipmentIds.length - 1 ? 'platform' : 'mezzanine' },
    routeId, direction, platformId, equipmentId, officialAccessiblePath: true, restrictions: ['none'],
    verificationDate: '2026-07-30', evidenceReference: 'fixture.json', reviewDisposition: 'approved' as const,
    canonicalPathIdentity: pathId,
  })) : [{
    id: edgeIds[0], order: 1, movementType: 'level-path' as const,
    start: { id: 'street', level: 'street' }, end: { id: 'platform', level: 'platform' }, routeId, direction,
    platformId, equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
    evidenceReference: 'fixture.json', reviewDisposition: 'approved' as const, canonicalPathIdentity: pathId,
  }];
  const coverage: StationDirectionCoverageRow = {
    coverageRecordId: `coverage:${pathId}`, coverageRecordVersion: 'coverage-v1', stationComplex: { id: stationComplexId, name: '125 St' },
    constituentStation: { id: constituentStationId, name: '125 St (8 Av)' }, routeOrLine: routeId, normalizedDirection: direction,
    accessibleStreetEntrance: { id: 'ENT-A', description: 'Verified entrance' }, streetCorner: 'southwest', directionalPlatform: platformId,
    boardingArea: 'zone-2', completePathId: pathId, orderedEdgeIds: edgeIds, equipmentIds,
    accessiblePathMembershipByEdge: Object.fromEntries(edgeIds.map((id) => [id, true])), operatingRestrictions: ['none'], evidenceSources: ['fixture'],
    evidenceReferences: ['fixture.json'], verificationDate: '2026-07-30', verifier: { name: 'Fixture', role: 'Accessibility' },
    productDecision: review('Product'), accessibilityDecision: review('Accessibility'), dataQualityDecision: review('Data Quality'),
    contentDecision: review('Content'), operationsDecision: review('Operations'), structuralDisposition: { status: 'accepted', reason: 'fixture' },
    unsupportedScope: { lines: [], directions: [], entrances: [], platforms: [], servicePatterns: [], paths: [] },
  };
  const item: AccessibilityPackage = {
    packageId: `package:${pathId}`, version: 'coverage-v1', canonicalPathIdentity: pathId, coverage,
    edges,
    approvedVersion: 'coverage-v1',
  };
  const decisionTime = new Date(overrides.decisionTime ?? '2026-08-01T00:00:00.000Z');
  const exposure = resolveAccessibilityExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-accessibility-coverage-v1', 'coverage-v1', decisionTime)!;
  const equipment = equipmentIds.length ? healthyEquipment(equipmentIds, decisionTime) : {};
  return assessAccessiblePath(item, {
    stationId: constituentStationId, routeId, direction, platformId: status === 'eligible' ? platformId : `${platformId}:wrong`,
    originIntent: overrides.originIntent ?? 'origin-street', destinationIntent: overrides.destinationIntent ?? 'destination-street',
    equipmentSourceScopeId: 'nyc-equipment', equipmentSourceVersion: 'equipment-v1', equipment, exposure, decisionTime,
  });
}

function healthyEquipment(equipmentIds: readonly string[], decisionTime: Date) {
  const inventory = acceptEquipmentInventory({
    inventoryId: `inventory:${equipmentIds.join(',')}`, evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inventory-v1', acceptedAt: new Date(decisionTime.getTime() - 60 * 60_000).toISOString(),
    equipmentIds: [...equipmentIds, 'EL-OTHER'],
  });
  const sourceTimestamp = new Date(decisionTime.getTime() - 60_000).toISOString();
  const history = acceptEquipmentHistory({
    historyId: `history:${equipmentIds.join(',')}`, evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [{
      snapshotId: `snapshot:${equipmentIds.join(',')}`, sequenceOrdinal: 1, predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
      sourceTimestamp, acceptedAt: new Date(decisionTime.getTime() - 59_000).toISOString(), declaredRecordCount: 1,
      records: [{ recordId: 'out-other', equipmentId: 'EL-OTHER', state: 'out-of-service' }],
    }],
  }, inventory);
  return Object.fromEntries(equipmentIds.map((equipmentId) => [equipmentId, assessEquipmentStatus({
    targetEquipmentId: equipmentId, decisionTime, inventory, history,
  })]));
}

export function resolvedAlternativeSelection(selectedPath = resolvedPath('selected')) {
  const pathDecision = resolvedPath('alt', 'eligible', {
    originIntent: selectedPath.originIntent,
    destinationIntent: selectedPath.destinationIntent,
  });
  const registry = acceptAccessibilityAlternativeRegistry({
    registryId: `registry:${selectedPath.pathId}:alt`, evidenceOwner: 'app-owned-accessibility-alternatives',
    selectedPathEvaluationId: selectedPath.evaluationId, createdAt: '2026-08-01T00:00:00.000Z', validThrough: '2026-08-01T00:04:00.000Z',
    offers: [{
      offerId: 'alt', evidenceOwner: 'app-owned-accessibility-alternatives', label: 'Use the verified same-complex path.',
      canonicalIdentity: pathDecision.pathId, pathEvaluationId: pathDecision.evaluationId, pathPackageVersion: pathDecision.packageVersion,
      tier: 'same-complex', originIntent: pathDecision.originIntent, destinationIntent: pathDecision.destinationIntent,
      singlePointElevatorDependencies: 0, transfers: 0, accessibleWalkingMeters: 100, disruptionRisk: 0,
      travelSeconds: 60, includesBus: false,
    }],
  }, selectedPath, [pathDecision]);
  return chooseAccessibilityAlternative(registry, { decisionTime: new Date('2026-08-01T00:00:00.000Z') });
}

export function resolvedWarning() {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment', sourceVersion: 'inv-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-1'] });
  const history = acceptEquipmentHistory({ historyId: 'history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', snapshots: [{ snapshotId: 'snap', sequenceOrdinal: 1, predecessorSnapshotId: null, evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', sourceTimestamp: '2026-08-01T00:01:00.000Z', acceptedAt: '2026-08-01T00:01:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out', equipmentId: 'EL-1', state: 'out-of-service' }] }] }, inventory);
  const changedEquipment = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime: new Date('2026-08-01T00:02:00.000Z'), inventory, history });
  const selectedPath = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' });
  const impactDecision = classifyPathImpact({ changedEquipment, selectedPath, alternatePaths: [], decisionTime: new Date('2026-08-01T00:02:00.000Z') })!;
  return createAccessibilityWarning({ fact: 'Elevator status is Unknown.', connection: 'Northbound transfer elevator', consequence: 'The selected step-free path cannot be verified right now.', freshness: 'Checked time unavailable', phase: 'underway', decisionPoint: { status: 'unknown' }, impactDecision, alternativeSelection: resolvedAlternativeSelection(selectedPath) });
}
