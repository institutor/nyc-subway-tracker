import { assessAccessiblePath, type AccessibilityPackage, type StationDirectionCoverageRow } from '../../src/shared/domain/accessible-path';
import { resolveAccessibilityExposure, VALIDATION_EXPOSURE_REGISTRY } from '../../src/shared/domain/exposure-decision';
import { chooseAccessibilityAlternative, type AccessibilityAlternative } from '../../src/shared/domain/accessibility-alternatives';
import { acceptEquipmentHistory, acceptEquipmentInventory, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { classifyPathImpact, type ImpactPath } from '../../src/shared/domain/path-impact';
import { createAccessibilityWarning } from '../../src/shared/domain/underway-warning';

function review(role: string) {
  return { decision: 'approve' as const, reviewer: `${role} Reviewer`, date: '2026-07-30', recordVersion: 'coverage-v1' };
}

export function resolvedPath(pathId: string, status: 'eligible' | 'ineligible' = 'eligible') {
  const coverage: StationDirectionCoverageRow = {
    coverageRecordId: `coverage:${pathId}`, coverageRecordVersion: 'coverage-v1', stationComplex: { id: 'A12', name: '125 St' },
    constituentStation: { id: 'A12', name: '125 St (8 Av)' }, routeOrLine: 'A', normalizedDirection: 'northbound',
    accessibleStreetEntrance: { id: 'ENT-A', description: 'Verified entrance' }, streetCorner: 'southwest', directionalPlatform: 'A12N',
    boardingArea: 'zone-2', completePathId: pathId, orderedEdgeIds: [`${pathId}:edge`], equipmentIds: [],
    accessiblePathMembershipByEdge: { [`${pathId}:edge`]: true }, operatingRestrictions: ['none'], evidenceSources: ['fixture'],
    evidenceReferences: ['fixture.json'], verificationDate: '2026-07-30', verifier: { name: 'Fixture', role: 'Accessibility' },
    productDecision: review('Product'), accessibilityDecision: review('Accessibility'), dataQualityDecision: review('Data Quality'),
    contentDecision: review('Content'), operationsDecision: review('Operations'), structuralDisposition: { status: 'accepted', reason: 'fixture' },
    unsupportedScope: { lines: [], directions: [], entrances: [], platforms: [], servicePatterns: [], paths: [] },
  };
  const item: AccessibilityPackage = {
    packageId: `package:${pathId}`, version: 'coverage-v1', canonicalPathIdentity: pathId, coverage,
    edges: [{ id: `${pathId}:edge`, order: 1, movementType: 'level-path', start: { id: 'street', level: 'street' }, end: { id: 'platform', level: 'platform' }, routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30', evidenceReference: 'fixture.json', reviewDisposition: 'approved', canonicalPathIdentity: pathId }],
    approvedVersion: 'coverage-v1',
  };
  const exposure = resolveAccessibilityExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-accessibility-coverage-v1', 'coverage-v1', new Date('2026-08-01T00:00:00.000Z'))!;
  return assessAccessiblePath(item, {
    stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: status === 'eligible' ? 'A12N' : 'A12S',
    equipmentSourceScopeId: 'nyc-equipment', equipmentSourceVersion: 'equipment-v1', equipment: {}, exposure,
    decisionTime: new Date('2026-08-01T00:00:00.000Z'),
  });
}

export function resolvedAlternativeSelection() {
  const pathDecision = resolvedPath('alt');
  const candidate: AccessibilityAlternative = { id: 'alt', label: 'Use the verified same-complex path.', canonicalIdentity: 'alt', tier: 'same-complex', pathDecision, singlePointElevatorDependencies: 0, transfers: 0, accessibleWalkingMeters: 100, disruptionRisk: 0, travelSeconds: 60, includesBus: false };
  return chooseAccessibilityAlternative([candidate], { includeBuses: false });
}

export function resolvedWarning() {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'scope', sourceVersion: 'inv-v1', acceptedAt: '2026-07-30T00:00:00.000Z', equipmentIds: ['EL-1'] });
  const history = acceptEquipmentHistory({ historyId: 'history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'scope', sourceVersion: 'status-v1', inventoryVersion: 'inv-v1', snapshots: [{ snapshotId: 'snap', sequenceOrdinal: 1, predecessorSnapshotId: null, evidenceOwner: 'official-equipment-status', sourceScopeId: 'scope', sourceVersion: 'status-v1', inventoryVersion: 'inv-v1', sourceTimestamp: '2026-07-30T12:00:00.000Z', acceptedAt: '2026-07-30T12:00:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out', equipmentId: 'EL-1', state: 'out-of-service' }] }] }, inventory);
  const changedEquipment = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime: new Date('2026-07-30T12:01:00.000Z'), inventory, history });
  const selectedPath: ImpactPath = { canonicalIdentity: 'selected', complexId: 'A12', origin: 'origin', destination: '168 St', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentIds: ['EL-1'], pathDecision: resolvedPath('selected') };
  const impactDecision = classifyPathImpact({ changedEquipment, selectedPath, alternatePaths: [], destinationIntent: '168 St' })!;
  return createAccessibilityWarning({ fact: 'Elevator status is Unknown.', connection: 'Northbound transfer elevator', consequence: 'The selected step-free path cannot be verified right now.', freshness: 'Checked time unavailable', phase: 'underway', decisionPoint: { status: 'unknown' }, impactDecision, alternativeSelection: resolvedAlternativeSelection() });
}
