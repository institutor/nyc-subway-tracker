import { assessAccessiblePath, type AccessibilityPackage, type StationDirectionCoverageRow } from '../../src/shared/domain/accessible-path';
import type { Direction } from '../../src/shared/domain/types';
import { resolveAccessibilityExposure, VALIDATION_EXPOSURE_REGISTRY } from '../../src/shared/domain/exposure-decision';
import { acceptAccessibilityAlternativeRegistry, chooseAccessibilityAlternative } from '../../src/shared/domain/accessibility-alternatives';
import {
  acceptEquipmentHistory,
  acceptEquipmentInventory,
  assessEquipmentStatus,
  type EquipmentStatusDecision,
} from '../../src/shared/domain/equipment-status';
import { classifyPathImpact } from '../../src/shared/domain/path-impact';
import { acceptAccessibilityJourneyProgress, createAccessibilityWarning, deriveLastAccessibleDecisionPoint } from '../../src/shared/domain/underway-warning';

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
    readonly equipmentDecisions?: Readonly<Record<string, EquipmentStatusDecision>>;
    readonly decisionTime?: string;
    readonly equipmentDecisionTime?: string;
  } = {},
) {
  const stationComplexId = overrides.stationComplexId ?? 'A12';
  const constituentStationId = overrides.constituentStationId ?? 'A12';
  const routeId = overrides.routeId ?? 'A';
  const direction = overrides.direction ?? 'northbound';
  const platformId = overrides.platformId ?? 'A12N';
  const equipmentIds = [...(overrides.equipmentIds ?? [])];
  const originIntent = overrides.originIntent ?? 'origin-street';
  const destinationIntent = overrides.destinationIntent ?? 'destination-street';
  const destinationPlatformId = `${platformId}:destination`;
  const endpoint = (id: string, level: string, scopedPlatformId: string | null) => ({
    id, level, stationComplexId, constituentStationId, platformId: scopedPlatformId,
  });
  const originStreet = endpoint(`${pathId}:origin-street`, 'street', null);
  const originPlatform = endpoint(`${pathId}:origin-platform`, 'platform', platformId);
  const destinationPlatform = endpoint(`${pathId}:destination-platform`, 'platform', destinationPlatformId);
  const destinationStreet = endpoint(`${pathId}:destination-street`, 'street', null);
  const originEdgeIds = equipmentIds.length ? equipmentIds.map((_, index) => `${pathId}:origin-edge:${index + 1}`) : [`${pathId}:origin-edge`];
  const destinationEdgeId = `${pathId}:destination-edge`;
  const edgeIds = [...originEdgeIds, destinationEdgeId];
  const accessScope = (kind: 'origin-access' | 'destination-access', scopedPlatformId: string) => ({
    kind, rideSegmentId: `${pathId}:ride`, transferId: null, stationComplexId, constituentStationId,
    routeId, direction, platformId: scopedPlatformId,
  });
  const originEdges = equipmentIds.length ? equipmentIds.map((equipmentId, index) => ({
    id: originEdgeIds[index], order: index + 1, movementType: 'elevator' as const,
    start: index === 0 ? originStreet : endpoint(`${pathId}:node:${index}`, 'mezzanine', null),
    end: index === equipmentIds.length - 1 ? originPlatform : endpoint(`${pathId}:node:${index + 1}`, 'mezzanine', null),
    journeyScope: accessScope('origin-access', platformId), equipmentId, officialAccessiblePath: true, restrictions: ['none'],
    verificationDate: '2026-07-30', evidenceReference: 'fixture.json', reviewDisposition: 'approved' as const,
    canonicalPathIdentity: pathId,
  })) : [{
    id: originEdgeIds[0], order: 1, movementType: 'level-path' as const, start: originStreet, end: originPlatform,
    journeyScope: accessScope('origin-access', platformId), equipmentId: null, officialAccessiblePath: true, restrictions: ['none'],
    verificationDate: '2026-07-30', evidenceReference: 'fixture.json', reviewDisposition: 'approved' as const,
    canonicalPathIdentity: pathId,
  }];
  const edges = [...originEdges, {
    id: destinationEdgeId, order: originEdges.length + 1, movementType: 'level-path' as const,
    start: destinationPlatform, end: destinationStreet, journeyScope: accessScope('destination-access', destinationPlatformId),
    equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
    evidenceReference: 'fixture.json', reviewDisposition: 'approved' as const, canonicalPathIdentity: pathId,
  }];
  const coverage: StationDirectionCoverageRow = {
    coverageRecordId: `coverage:${pathId}`, coverageRecordVersion: 'coverage-v1',
    origin: {
      stationComplex: { id: stationComplexId, name: originIntent }, constituentStation: { id: constituentStationId, name: '125 St (8 Av)' },
      entrance: { id: 'ENT-A', description: 'Verified entrance', streetCorner: 'southwest', streetEndpoint: originStreet },
      platform: { id: platformId, boardingAreaId: 'zone-2', endpoint: originPlatform },
      orderedAccessEdgeIds: originEdgeIds, equipmentIds,
    },
    destination: {
      stationComplex: { id: stationComplexId, name: destinationIntent }, constituentStation: { id: constituentStationId, name: 'Destination constituent' },
      platform: { id: destinationPlatformId, endpoint: destinationPlatform },
      exit: { id: 'EXIT-A', description: 'Verified exit', streetCorner: 'northeast', streetEndpoint: destinationStreet },
      orderedAccessEdgeIds: [destinationEdgeId], equipmentIds: [],
    },
    rideSegments: [{
      id: `${pathId}:ride`, routeId, direction,
      origin: { stationComplexId, constituentStationId, platformId, boardingAreaId: 'zone-2', endpoint: originPlatform },
      destination: { stationComplexId, constituentStationId, platformId: destinationPlatformId, endpoint: destinationPlatform },
    }],
    transfers: [], orderedRideSegmentIds: [`${pathId}:ride`], orderedTransferIds: [],
    journeyChain: [
      ...originEdgeIds.map((edgeId) => ({ kind: 'access-edge' as const, edgeId })),
      { kind: 'ride' as const, rideSegmentId: `${pathId}:ride` },
      { kind: 'access-edge' as const, edgeId: destinationEdgeId },
    ],
    completePathId: pathId, orderedEdgeIds: edgeIds, equipmentIds,
    accessiblePathMembershipByEdge: Object.fromEntries(edgeIds.map((id) => [id, true])), operatingRestrictions: ['none'], evidenceSources: ['fixture'],
    evidenceReferences: ['fixture.json'], verificationDate: '2026-07-30', verifier: { name: 'Fixture', role: 'Accessibility' },
    productDecision: review('Product'), accessibilityDecision: review('Accessibility'), dataQualityDecision: review('Data Quality'),
    contentDecision: review('Content'), operationsDecision: review('Operations'), structuralDisposition: { status: 'accepted', reason: 'fixture' },
    unsupportedScope: { lines: [], directions: [], entrances: [], platforms: [], servicePatterns: [], paths: [] },
  };
  const item: AccessibilityPackage = {
    packageId: `package:${pathId}`, version: 'coverage-v1', canonicalPathIdentity: pathId, coverage,
    edges,
    approvalReceipt: {
      receiptId: `approval:package:${pathId}`,
      evidenceOwner: 'app-owned-accessibility-path-approvals',
      decision: 'approved',
      packageId: `package:${pathId}`,
      packageVersion: 'coverage-v1',
      coverageRecordId: `coverage:${pathId}`,
      coverageRecordVersion: 'coverage-v1',
      canonicalPathIdentity: pathId,
      approvedOn: '2026-07-30',
    },
  };
  const decisionTime = new Date(overrides.decisionTime ?? '2026-08-01T00:00:00.000Z');
  const exposure = resolveAccessibilityExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-accessibility-coverage-v1', 'coverage-v1', decisionTime)!;
  const equipmentDecisionTime = new Date(overrides.equipmentDecisionTime ?? decisionTime.toISOString());
  const equipment = overrides.equipmentDecisions ?? (equipmentIds.length ? healthyEquipment(equipmentIds, equipmentDecisionTime) : {});
  return assessAccessiblePath(item, {
    journey: {
      origin: { stationComplexId, constituentStationId, entranceId: 'ENT-A', streetEndpointId: originStreet.id, platformId: status === 'eligible' ? platformId : `${platformId}:wrong`, boardingAreaId: 'zone-2' },
      destination: { stationComplexId, constituentStationId, platformId: destinationPlatformId, exitId: 'EXIT-A', streetEndpointId: destinationStreet.id },
      rideSegments: [{
        id: `${pathId}:ride`, routeId, direction,
        origin: { stationComplexId, constituentStationId, platformId, boardingAreaId: 'zone-2', endpointId: originPlatform.id },
        destination: { stationComplexId, constituentStationId, platformId: destinationPlatformId, endpointId: destinationPlatform.id },
      }],
      transferIds: [],
    },
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

export function resolvedEquipmentStatus(targetEquipmentId = 'EL-1', snapshotId = 'unrelated-snapshot') {
  const inventory = acceptEquipmentInventory({
    inventoryId: `inventory:${snapshotId}`,
    evidenceOwner: 'official-equipment-inventory',
    sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inventory-v1',
    acceptedAt: '2026-07-31T23:00:00.000Z',
    equipmentIds: [targetEquipmentId, 'EL-OTHER'],
  });
  const history = acceptEquipmentHistory({
    historyId: `history:${snapshotId}`,
    evidenceOwner: 'official-equipment-status',
    sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1',
    inventoryVersion: 'inventory-v1',
    snapshots: [{
      snapshotId,
      sequenceOrdinal: 1,
      predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status',
      sourceScopeId: 'nyc-equipment',
      sourceVersion: 'equipment-v1',
      inventoryVersion: 'inventory-v1',
      sourceTimestamp: '2026-08-01T00:01:00.000Z',
      acceptedAt: '2026-08-01T00:01:01.000Z',
      declaredRecordCount: 1,
      records: [{ recordId: 'out-other', equipmentId: 'EL-OTHER', state: 'out-of-service' }],
    }],
  }, inventory);
  return assessEquipmentStatus({
    targetEquipmentId,
    decisionTime: new Date('2026-08-01T00:02:00.000Z'),
    inventory,
    history,
  });
}

export function resolvedWarning(
  selectedPath = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' }),
) {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment', sourceVersion: 'inv-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-1'] });
  const history = acceptEquipmentHistory({ historyId: 'history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', snapshots: [{ snapshotId: 'snap', sequenceOrdinal: 1, predecessorSnapshotId: null, evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inv-v1', sourceTimestamp: '2026-08-01T00:01:00.000Z', acceptedAt: '2026-08-01T00:01:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out', equipmentId: 'EL-1', state: 'out-of-service' }] }] }, inventory);
  const changedEquipment = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime: new Date('2026-08-01T00:02:00.000Z'), inventory, history });
  const impactDecision = classifyPathImpact({ changedEquipment, selectedPath, alternatePaths: [], decisionTime: new Date('2026-08-01T00:02:00.000Z') })!;
  const decisionTime = new Date('2026-08-01T00:02:00.000Z');
  const progress = acceptAccessibilityJourneyProgress({
    progressId: `progress:${selectedPath.pathId}`, evidenceOwner: 'app-owned-accessibility-journey-progress',
    selectedPathEvaluationId: selectedPath.evaluationId, observedThroughOrder: 1, possibleThroughOrder: 1,
    affectedOrder: 3, decisionPoints: [], evaluatedAt: decisionTime.toISOString(),
  }, selectedPath);
  const decisionPoint = deriveLastAccessibleDecisionPoint({ evidence: progress, selectedPath, decisionTime });
  return createAccessibilityWarning({ phase: 'underway', decisionPoint, impactDecision, alternativeSelection: resolvedAlternativeSelection(selectedPath), decisionTime });
}
