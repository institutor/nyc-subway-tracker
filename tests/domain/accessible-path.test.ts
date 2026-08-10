import { describe, expect, test } from 'vitest';

import {
  accessiblePathDecisionAllowsUse,
  assessAccessiblePath,
  orderAccessiblePaths,
  validateAccessibilityRegistry,
  type AccessibilityPackage,
  type AccessibleJourneyIntent,
  type AccessiblePathAssessmentRequest,
  type JourneyEndpoint,
  type StationDirectionCoverageRow,
} from '../../src/shared/domain/accessible-path';
import { acceptEquipmentHistory, acceptEquipmentInventory, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import {
  PRODUCTION_EXPOSURE_REGISTRY,
  VALIDATION_EXPOSURE_REGISTRY,
  resolveAccessibilityExposure,
  type ResolvedAccessibilityExposure,
} from '../../src/shared/domain/exposure-decision';
import { loadOptionalOfficialEquipment, loadStationAccessibility } from '../../src/server/accessibility/station-accessibility-loader';
import { loadPathEvidence, PRODUCTION_PATH_REGISTRY } from '../../src/server/accessibility/path-evidence-loader';

const at = (value: string) => new Date(value);

function review(role: string) {
  return { decision: 'approve' as const, reviewer: `${role} Reviewer`, date: '2026-07-30', recordVersion: 'coverage-v1' };
}

function endpoint(
  id: string,
  level: string,
  stationComplexId: string,
  constituentStationId: string,
  platformId: string | null,
): JourneyEndpoint {
  return { id, level, stationComplexId, constituentStationId, platformId };
}

const ORIGIN_STREET = endpoint('origin-street', 'street', 'A12', 'A12', null);
const ORIGIN_MEZZ = endpoint('origin-mezz', 'mezzanine', 'A12', 'A12', null);
const ORIGIN_PLATFORM = endpoint('origin-board-a12n-zone-2', 'platform', 'A12', 'A12', 'A12N');
const DESTINATION_PLATFORM = endpoint('destination-alight-d99s', 'platform', 'D99', 'D99', 'D99S');
const DESTINATION_MEZZ = endpoint('destination-mezz', 'mezzanine', 'D99', 'D99', null);
const DESTINATION_STREET = endpoint('destination-street', 'street', 'D99', 'D99', null);

function scope(
  kind: 'origin-access' | 'transfer-access' | 'destination-access',
  rideSegmentId: string,
  transferId: string | null,
  stationComplexId: string,
  constituentStationId: string,
  routeId: string,
  direction: 'northbound' | 'southbound',
  platformId: string,
) {
  return { kind, rideSegmentId, transferId, stationComplexId, constituentStationId, routeId, direction, platformId } as const;
}

function coverage(overrides: Partial<StationDirectionCoverageRow> = {}): StationDirectionCoverageRow {
  return {
    coverageRecordId: 'coverage:a12:to:d99',
    coverageRecordVersion: 'coverage-v1',
    origin: {
      stationComplex: { id: 'A12', name: 'origin-street' },
      constituentStation: { id: 'A12', name: '125 St (8 Av)' },
      entrance: { id: 'ENT-A', description: 'SW corner of 125 St and St Nicholas Ave', streetCorner: 'southwest', streetEndpoint: ORIGIN_STREET },
      platform: { id: 'A12N', boardingAreaId: 'A12N-zone-2', endpoint: ORIGIN_PLATFORM },
      orderedAccessEdgeIds: ['edge-origin-elevator', 'edge-origin-platform'],
      equipmentIds: ['EL-A12-01'],
    },
    destination: {
      stationComplex: { id: 'D99', name: 'destination-street' },
      constituentStation: { id: 'D99', name: 'Destination constituent' },
      platform: { id: 'D99S', endpoint: DESTINATION_PLATFORM },
      exit: { id: 'EXIT-D', description: 'Verified destination exit', streetCorner: 'northeast', streetEndpoint: DESTINATION_STREET },
      orderedAccessEdgeIds: ['edge-destination-elevator', 'edge-destination-street'],
      equipmentIds: ['EL-D99-01'],
    },
    rideSegments: [{
      id: 'ride-a', routeId: 'A', direction: 'northbound',
      origin: { stationComplexId: 'A12', constituentStationId: 'A12', platformId: 'A12N', boardingAreaId: 'A12N-zone-2', endpoint: ORIGIN_PLATFORM },
      destination: { stationComplexId: 'D99', constituentStationId: 'D99', platformId: 'D99S', endpoint: DESTINATION_PLATFORM },
    }],
    transfers: [],
    orderedRideSegmentIds: ['ride-a'],
    orderedTransferIds: [],
    journeyChain: [
      { kind: 'access-edge', edgeId: 'edge-origin-elevator' },
      { kind: 'access-edge', edgeId: 'edge-origin-platform' },
      { kind: 'ride', rideSegmentId: 'ride-a' },
      { kind: 'access-edge', edgeId: 'edge-destination-elevator' },
      { kind: 'access-edge', edgeId: 'edge-destination-street' },
    ],
    completePathId: 'path:a12:to:d99',
    orderedEdgeIds: ['edge-origin-elevator', 'edge-origin-platform', 'edge-destination-elevator', 'edge-destination-street'],
    equipmentIds: ['EL-A12-01', 'EL-D99-01'],
    accessiblePathMembershipByEdge: {
      'edge-origin-elevator': true,
      'edge-origin-platform': true,
      'edge-destination-elevator': true,
      'edge-destination-street': true,
    },
    operatingRestrictions: ['none'],
    evidenceSources: ['immutable-fixture'],
    evidenceReferences: ['evidence/path-a12-d99-v1.json'],
    verificationDate: '2026-07-30',
    verifier: { name: 'Fixture Verifier', role: 'Accessibility reviewer' },
    productDecision: review('Product'),
    accessibilityDecision: review('Accessibility'),
    dataQualityDecision: review('Data Quality'),
    contentDecision: review('Content'),
    operationsDecision: review('Operations'),
    structuralDisposition: { status: 'accepted', reason: 'Complete synthetic evidence' },
    unsupportedScope: {
      lines: ['C'], directions: ['southbound'], entrances: ['ENT-B'], platforms: ['A12S'],
      servicePatterns: ['rerouted'], paths: ['path:a12:to:other'],
    },
    ...overrides,
  };
}

function packageFixture(overrides: Partial<AccessibilityPackage> = {}): AccessibilityPackage {
  const baseCoverage = coverage();
  const base = {
    packageId: 'package-a12-d99-v1', version: 'coverage-v1', canonicalPathIdentity: 'path:a12:to:d99', coverage: baseCoverage,
    edges: [
      {
        id: 'edge-origin-elevator', order: 1, movementType: 'elevator', start: ORIGIN_STREET, end: ORIGIN_MEZZ,
        journeyScope: scope('origin-access', 'ride-a', null, 'A12', 'A12', 'A', 'northbound', 'A12N'),
        equipmentId: 'EL-A12-01', officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
        evidenceReference: 'evidence/edge-origin-elevator.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:to:d99',
      },
      {
        id: 'edge-origin-platform', order: 2, movementType: 'level-path', start: ORIGIN_MEZZ, end: ORIGIN_PLATFORM,
        journeyScope: scope('origin-access', 'ride-a', null, 'A12', 'A12', 'A', 'northbound', 'A12N'),
        equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
        evidenceReference: 'evidence/edge-origin-platform.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:to:d99',
      },
      {
        id: 'edge-destination-elevator', order: 3, movementType: 'elevator', start: DESTINATION_PLATFORM, end: DESTINATION_MEZZ,
        journeyScope: scope('destination-access', 'ride-a', null, 'D99', 'D99', 'A', 'northbound', 'D99S'),
        equipmentId: 'EL-D99-01', officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
        evidenceReference: 'evidence/edge-destination-elevator.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:to:d99',
      },
      {
        id: 'edge-destination-street', order: 4, movementType: 'level-path', start: DESTINATION_MEZZ, end: DESTINATION_STREET,
        journeyScope: scope('destination-access', 'ride-a', null, 'D99', 'D99', 'A', 'northbound', 'D99S'),
        equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
        evidenceReference: 'evidence/edge-destination-street.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:to:d99',
      },
    ],
  } satisfies Omit<AccessibilityPackage, 'approvalReceipt'>;
  const merged = { ...base, ...overrides } as Omit<AccessibilityPackage, 'approvalReceipt'> & Partial<Pick<AccessibilityPackage, 'approvalReceipt'>>;
  return {
    ...merged,
    approvalReceipt: overrides.approvalReceipt ?? {
      receiptId: `approval:${merged.packageId}`,
      evidenceOwner: 'app-owned-accessibility-path-approvals',
      decision: 'approved',
      packageId: merged.packageId,
      packageVersion: merged.version,
      coverageRecordId: merged.coverage.coverageRecordId,
      coverageRecordVersion: merged.coverage.coverageRecordVersion,
      canonicalPathIdentity: merged.canonicalPathIdentity,
      approvedOn: '2026-07-30',
    },
  };
}

function transferPackageFixture(): AccessibilityPackage {
  const transferArrival = endpoint('transfer-arrive-t50a', 'platform', 'T50', 'T50-A', 'T50A-N');
  const transferMezz = endpoint('transfer-mezz', 'mezzanine', 'T50', 'T50-C', null);
  const transferBoard = endpoint('transfer-board-t50c', 'platform', 'T50', 'T50-C', 'T50C-S');
  const finalPlatform = endpoint('destination-alight-d99c', 'platform', 'D99', 'D99', 'D99C-S');
  const transferCoverage = coverage({
    unsupportedScope: {
      ...coverage().unsupportedScope,
      lines: [],
      directions: [],
    },
    destination: {
      ...coverage().destination,
      platform: { id: 'D99C-S', endpoint: finalPlatform },
      orderedAccessEdgeIds: ['edge-destination-elevator', 'edge-destination-street'],
    },
    rideSegments: [
      {
        id: 'ride-a', routeId: 'A', direction: 'northbound',
        origin: { stationComplexId: 'A12', constituentStationId: 'A12', platformId: 'A12N', boardingAreaId: 'A12N-zone-2', endpoint: ORIGIN_PLATFORM },
        destination: { stationComplexId: 'T50', constituentStationId: 'T50-A', platformId: 'T50A-N', endpoint: transferArrival },
      },
      {
        id: 'ride-c', routeId: 'C', direction: 'southbound',
        origin: { stationComplexId: 'T50', constituentStationId: 'T50-C', platformId: 'T50C-S', boardingAreaId: 'T50C-S-zone-1', endpoint: transferBoard },
        destination: { stationComplexId: 'D99', constituentStationId: 'D99', platformId: 'D99C-S', endpoint: finalPlatform },
      },
    ],
    transfers: [{
      id: 'transfer-t50', incomingRideSegmentId: 'ride-a', outgoingRideSegmentId: 'ride-c', stationComplexId: 'T50',
      incomingConstituentStationId: 'T50-A', incomingPlatformId: 'T50A-N', outgoingConstituentStationId: 'T50-C', outgoingPlatformId: 'T50C-S',
      orderedAccessEdgeIds: ['edge-transfer-elevator', 'edge-transfer-platform'], equipmentIds: ['EL-T50-01'],
    }],
    orderedRideSegmentIds: ['ride-a', 'ride-c'],
    orderedTransferIds: ['transfer-t50'],
    journeyChain: [
      { kind: 'access-edge', edgeId: 'edge-origin-elevator' },
      { kind: 'access-edge', edgeId: 'edge-origin-platform' },
      { kind: 'ride', rideSegmentId: 'ride-a' },
      { kind: 'access-edge', edgeId: 'edge-transfer-elevator' },
      { kind: 'access-edge', edgeId: 'edge-transfer-platform' },
      { kind: 'ride', rideSegmentId: 'ride-c' },
      { kind: 'access-edge', edgeId: 'edge-destination-elevator' },
      { kind: 'access-edge', edgeId: 'edge-destination-street' },
    ],
    orderedEdgeIds: ['edge-origin-elevator', 'edge-origin-platform', 'edge-transfer-elevator', 'edge-transfer-platform', 'edge-destination-elevator', 'edge-destination-street'],
    equipmentIds: ['EL-A12-01', 'EL-T50-01', 'EL-D99-01'],
    accessiblePathMembershipByEdge: {
      'edge-origin-elevator': true, 'edge-origin-platform': true, 'edge-transfer-elevator': true,
      'edge-transfer-platform': true, 'edge-destination-elevator': true, 'edge-destination-street': true,
    },
  });
  const fixture = packageFixture({ coverage: transferCoverage });
  return {
    ...fixture,
    edges: [
      fixture.edges[0], fixture.edges[1],
      {
        id: 'edge-transfer-elevator', order: 3, movementType: 'elevator', start: transferArrival, end: transferMezz,
        journeyScope: scope('transfer-access', 'ride-c', 'transfer-t50', 'T50', 'T50-C', 'C', 'southbound', 'T50C-S'),
        equipmentId: 'EL-T50-01', officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
        evidenceReference: 'evidence/edge-transfer-elevator.json', reviewDisposition: 'approved', canonicalPathIdentity: fixture.canonicalPathIdentity,
      },
      {
        id: 'edge-transfer-platform', order: 4, movementType: 'level-path', start: transferMezz, end: transferBoard,
        journeyScope: scope('transfer-access', 'ride-c', 'transfer-t50', 'T50', 'T50-C', 'C', 'southbound', 'T50C-S'),
        equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30',
        evidenceReference: 'evidence/edge-transfer-platform.json', reviewDisposition: 'approved', canonicalPathIdentity: fixture.canonicalPathIdentity,
      },
      {
        ...fixture.edges[2], order: 5, start: finalPlatform,
        journeyScope: scope('destination-access', 'ride-c', null, 'D99', 'D99', 'C', 'southbound', 'D99C-S'),
      },
      {
        ...fixture.edges[3], order: 6,
        journeyScope: scope('destination-access', 'ride-c', null, 'D99', 'D99', 'C', 'southbound', 'D99C-S'),
      },
    ],
  };
}

function alternateDestinationPackage(): AccessibilityPackage {
  const destinationPlatform = endpoint('destination-alight-e77s', 'platform', 'E77', 'E77', 'E77S');
  const destinationMezz = endpoint('destination-e77-mezz', 'mezzanine', 'E77', 'E77', null);
  const destinationStreet = endpoint('destination-e77-street', 'street', 'E77', 'E77', null);
  const pathId = 'path:a12:to:e77';
  const edgeIds = ['e77-edge-origin-elevator', 'e77-edge-origin-platform', 'e77-edge-destination-elevator', 'e77-edge-destination-street'];
  const itemCoverage = coverage({
    coverageRecordId: 'coverage:a12:to:e77',
    origin: {
      ...coverage().origin,
      orderedAccessEdgeIds: edgeIds.slice(0, 2),
    },
    destination: {
      stationComplex: { id: 'E77', name: 'second-destination' }, constituentStation: { id: 'E77', name: 'Second destination constituent' },
      platform: { id: 'E77S', endpoint: destinationPlatform },
      exit: { id: 'EXIT-E', description: 'Second verified destination exit', streetCorner: 'southeast', streetEndpoint: destinationStreet },
      orderedAccessEdgeIds: edgeIds.slice(2), equipmentIds: ['EL-E77-01'],
    },
    rideSegments: [{
      id: 'ride-a-e77', routeId: 'A', direction: 'northbound',
      origin: { stationComplexId: 'A12', constituentStationId: 'A12', platformId: 'A12N', boardingAreaId: 'A12N-zone-2', endpoint: ORIGIN_PLATFORM },
      destination: { stationComplexId: 'E77', constituentStationId: 'E77', platformId: 'E77S', endpoint: destinationPlatform },
    }],
    orderedRideSegmentIds: ['ride-a-e77'],
    journeyChain: [
      { kind: 'access-edge', edgeId: edgeIds[0] }, { kind: 'access-edge', edgeId: edgeIds[1] },
      { kind: 'ride', rideSegmentId: 'ride-a-e77' },
      { kind: 'access-edge', edgeId: edgeIds[2] }, { kind: 'access-edge', edgeId: edgeIds[3] },
    ],
    completePathId: pathId,
    orderedEdgeIds: edgeIds,
    equipmentIds: ['EL-A12-01', 'EL-E77-01'],
    accessiblePathMembershipByEdge: Object.fromEntries(edgeIds.map((id) => [id, true])),
  });
  return {
    packageId: 'package-a12-e77-v1', version: 'coverage-v1', canonicalPathIdentity: pathId, coverage: itemCoverage,
    edges: [
      {
        ...packageFixture().edges[0], id: edgeIds[0], order: 1, canonicalPathIdentity: pathId,
        journeyScope: scope('origin-access', 'ride-a-e77', null, 'A12', 'A12', 'A', 'northbound', 'A12N'),
      },
      {
        ...packageFixture().edges[1], id: edgeIds[1], order: 2, canonicalPathIdentity: pathId,
        journeyScope: scope('origin-access', 'ride-a-e77', null, 'A12', 'A12', 'A', 'northbound', 'A12N'),
      },
      {
        ...packageFixture().edges[2], id: edgeIds[2], order: 3, start: destinationPlatform, end: destinationMezz,
        equipmentId: 'EL-E77-01', canonicalPathIdentity: pathId,
        journeyScope: scope('destination-access', 'ride-a-e77', null, 'E77', 'E77', 'A', 'northbound', 'E77S'),
      },
      {
        ...packageFixture().edges[3], id: edgeIds[3], order: 4, start: destinationMezz, end: destinationStreet,
        canonicalPathIdentity: pathId,
        journeyScope: scope('destination-access', 'ride-a-e77', null, 'E77', 'E77', 'A', 'northbound', 'E77S'),
      },
    ],
    approvalReceipt: {
      receiptId: 'approval:package-a12-e77-v1', evidenceOwner: 'app-owned-accessibility-path-approvals', decision: 'approved',
      packageId: 'package-a12-e77-v1', packageVersion: 'coverage-v1', coverageRecordId: 'coverage:a12:to:e77',
      coverageRecordVersion: 'coverage-v1', canonicalPathIdentity: pathId, approvedOn: '2026-07-30',
    },
  };
}

function journeyIntent(item: AccessibilityPackage): AccessibleJourneyIntent {
  const { coverage: value } = item;
  return {
    origin: {
      stationComplexId: value.origin.stationComplex.id,
      constituentStationId: value.origin.constituentStation.id,
      entranceId: value.origin.entrance.id,
      streetEndpointId: value.origin.entrance.streetEndpoint.id,
      platformId: value.origin.platform.id,
      boardingAreaId: value.origin.platform.boardingAreaId,
    },
    destination: {
      stationComplexId: value.destination.stationComplex.id,
      constituentStationId: value.destination.constituentStation.id,
      platformId: value.destination.platform.id,
      exitId: value.destination.exit.id,
      streetEndpointId: value.destination.exit.streetEndpoint.id,
    },
    rideSegments: value.rideSegments.map((segment) => ({
      id: segment.id, routeId: segment.routeId, direction: segment.direction,
      origin: {
        stationComplexId: segment.origin.stationComplexId, constituentStationId: segment.origin.constituentStationId,
        platformId: segment.origin.platformId, boardingAreaId: segment.origin.boardingAreaId, endpointId: segment.origin.endpoint.id,
      },
      destination: {
        stationComplexId: segment.destination.stationComplexId, constituentStationId: segment.destination.constituentStationId,
        platformId: segment.destination.platformId, endpointId: segment.destination.endpoint.id,
      },
    })),
    transferIds: [...value.orderedTransferIds],
  };
}

function equipment(overrides: {
  targetEquipmentId?: string;
  snapshotScope?: string;
  decisionTime?: Date;
  adverse?: boolean;
} = {}) {
  const sourceScopeId = overrides.snapshotScope ?? 'nyc-equipment';
  const targetEquipmentId = overrides.targetEquipmentId ?? 'EL-A12-01';
  const decisionTime = overrides.decisionTime ?? at('2026-08-01T00:00:00Z');
  const inventory = acceptEquipmentInventory({
    inventoryId: `inventory:${targetEquipmentId}:${decisionTime.toISOString()}`, evidenceOwner: 'official-equipment-inventory', sourceScopeId,
    sourceVersion: 'inventory-v1', acceptedAt: new Date(decisionTime.getTime() - 60 * 60_000).toISOString(),
    equipmentIds: ['EL-A12-01', 'EL-D99-01', 'EL-T50-01', 'EL-E77-01', 'EL-OTHER'],
  });
  const sourceTimestamp = new Date(decisionTime.getTime() - 60_000).toISOString();
  const history = acceptEquipmentHistory({
    historyId: `history:${targetEquipmentId}:${decisionTime.toISOString()}`, evidenceOwner: 'official-equipment-status', sourceScopeId,
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [{
      snapshotId: `snapshot:${targetEquipmentId}:${decisionTime.toISOString()}`, sequenceOrdinal: 1, predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status', sourceScopeId, sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
      sourceTimestamp, acceptedAt: new Date(decisionTime.getTime() - 59_000).toISOString(), declaredRecordCount: 1,
      records: [{ recordId: overrides.adverse ? `out:${targetEquipmentId}` : 'out-other', equipmentId: overrides.adverse ? targetEquipmentId : 'EL-OTHER', state: 'out-of-service' }],
    }],
  }, inventory);
  return assessEquipmentStatus({ targetEquipmentId, decisionTime, inventory, history });
}

function equipmentMap(item: AccessibilityPackage, decisionTime = at('2026-08-01T00:00:00Z')) {
  return Object.fromEntries(item.coverage.equipmentIds.map((id) => [id, equipment({ targetEquipmentId: id, decisionTime })]));
}

function supersessionContext() {
  const inventory = acceptEquipmentInventory({
    inventoryId: 'supersession-inventory', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'inventory-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-A12-01', 'EL-D99-01', 'EL-OTHER'],
  });
  const first = {
    snapshotId: 'healthy-first', sequenceOrdinal: 1, predecessorSnapshotId: null,
    evidenceOwner: 'official-equipment-status' as const, sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
    sourceTimestamp: '2026-08-01T00:00:00.000Z', acceptedAt: '2026-08-01T00:00:01.000Z', declaredRecordCount: 1,
    records: [{ recordId: 'out-other', equipmentId: 'EL-OTHER', state: 'out-of-service' as const }],
  };
  const initial = acceptEquipmentHistory({
    historyId: 'supersession-history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [first],
  }, inventory);
  const machine = assessEquipmentStatus({ targetEquipmentId: 'EL-A12-01', decisionTime: at('2026-08-01T00:01:00.000Z'), inventory, history: initial });
  const extend = () => acceptEquipmentHistory({
    historyId: 'supersession-history', evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment',
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [first, {
      snapshotId: 'new-adverse', sequenceOrdinal: 2, predecessorSnapshotId: 'healthy-first',
      evidenceOwner: 'official-equipment-status', sourceScopeId: 'nyc-equipment', sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
      sourceTimestamp: '2026-08-01T00:02:00.000Z', acceptedAt: '2026-08-01T00:02:01.000Z', declaredRecordCount: 1,
      records: [{ recordId: 'new-outage', equipmentId: 'EL-A12-01', state: 'out-of-service' as const }],
    }],
  }, inventory);
  return { machine, extend };
}

const validationAccessibilityExposure = resolveAccessibilityExposure(
  VALIDATION_EXPOSURE_REGISTRY,
  'validation-accessibility-coverage-v1',
  'coverage-v1',
  at('2026-08-01T00:00:00Z'),
)!;

function requestFor(
  item: AccessibilityPackage = packageFixture(),
  overrides: Partial<AccessiblePathAssessmentRequest> = {},
): AccessiblePathAssessmentRequest {
  const decisionTime = overrides.decisionTime ?? at('2026-08-01T00:00:00Z');
  return {
    journey: journeyIntent(item),
    equipmentSourceScopeId: 'nyc-equipment',
    equipmentSourceVersion: 'equipment-v1',
    equipment: equipmentMap(item, decisionTime),
    exposure: validationAccessibilityExposure,
    decisionTime,
    ...overrides,
  };
}

describe('complete origin-to-destination accessible path evidence', () => {
  test('accepts an exact direct street-to-street package with a train ride distinct from physical access edges', () => {
    expect(loadPathEvidence([packageFixture()])).toHaveLength(1);
    expect(assessAccessiblePath(packageFixture(), requestFor()).status).toBe('eligible');
  });

  test('rejects a station label because only a complete structured journey can pass', () => {
    expect(() => loadStationAccessibility([{ stationId: 'A12', accessible: true }])).toThrow(/complete|schema|coverage/i);
  });

  test.each([
    'coverageRecordId', 'coverageRecordVersion', 'origin', 'destination', 'rideSegments', 'transfers',
    'orderedRideSegmentIds', 'orderedTransferIds', 'journeyChain', 'completePathId', 'orderedEdgeIds', 'equipmentIds',
    'accessiblePathMembershipByEdge', 'operatingRestrictions', 'evidenceSources', 'evidenceReferences', 'verificationDate',
    'verifier', 'productDecision', 'accessibilityDecision', 'dataQualityDecision', 'contentDecision', 'operationsDecision',
    'structuralDisposition', 'unsupportedScope',
  ])('rejects missing exact coverage field %s', (field) => {
    const raw = { ...coverage() } as Record<string, unknown>;
    delete raw[field];
    expect(() => loadStationAccessibility([raw])).toThrow(new RegExp(field));
  });

  test('rejects a package whose destination half is absent', () => {
    const raw = { ...coverage() } as Record<string, unknown>;
    delete raw.destination;
    expect(() => loadPathEvidence([{ ...packageFixture(), coverage: raw }])).toThrow(/destination/i);
  });

  test('rejects extra and inherited fields at every fixed journey boundary', () => {
    const fixture = packageFixture();
    const inheritedEndpoint = Object.create({ ...ORIGIN_STREET }) as JourneyEndpoint;
    const candidates = [
      { ...fixture, unexpected: true },
      { ...fixture, coverage: { ...fixture.coverage, origin: { ...fixture.coverage.origin, unexpected: true } } },
      { ...fixture, coverage: { ...fixture.coverage, destination: { ...fixture.coverage.destination, unexpected: true } } },
      { ...fixture, coverage: { ...fixture.coverage, rideSegments: [{ ...fixture.coverage.rideSegments[0], unexpected: true }] } },
      { ...fixture, coverage: { ...fixture.coverage, destination: { ...fixture.coverage.destination, exit: { ...fixture.coverage.destination.exit, unexpected: true } } } },
      { ...fixture, edges: [{ ...fixture.edges[0], journeyScope: { ...fixture.edges[0].journeyScope, unexpected: true } }, ...fixture.edges.slice(1)] },
      { ...fixture, edges: [{ ...fixture.edges[0], start: inheritedEndpoint }, ...fixture.edges.slice(1)] },
    ];
    for (const candidate of candidates) expect(() => loadPathEvidence([candidate])).toThrow(/exact schema/i);
  });

  test.each([
    ['unknown ride direction', () => ({ ...coverage(), rideSegments: [{ ...coverage().rideSegments[0], direction: 'sideways' }] })],
    ['unknown edge movement', () => {
      const item = packageFixture();
      return { ...item, edges: [{ ...item.edges[0], movementType: 'teleport' }, ...item.edges.slice(1)] };
    }],
    ['string restrictions', () => {
      const item = packageFixture();
      return { ...item, edges: [{ ...item.edges[0], restrictions: 'none' }, ...item.edges.slice(1)] };
    }],
    ['noncanonical review date', () => ({ ...packageFixture(), coverage: coverage({ productDecision: { ...review('Product'), date: 'tomorrow' } }) })],
    ['supported route in unsupported scope', () => ({ ...packageFixture(), coverage: coverage({ unsupportedScope: { ...coverage().unsupportedScope, lines: ['A'] } }) })],
    ['extra membership key', () => ({ ...packageFixture(), coverage: coverage({ accessiblePathMembershipByEdge: { ...coverage().accessiblePathMembershipByEdge, extra: true } }) })],
    ['string official membership', () => {
      const item = packageFixture();
      return { ...item, edges: [{ ...item.edges[0], officialAccessiblePath: 'true' }, ...item.edges.slice(1)] };
    }],
    ['stairs', () => {
      const item = packageFixture();
      return { ...item, edges: [{ ...item.edges[0], movementType: 'stairs', equipmentId: null }, ...item.edges.slice(1)] };
    }],
  ])('rejects value-permissive complete-path evidence: %s', (_label, candidate) => {
    expect(() => loadPathEvidence([candidate()])).toThrow();
  });

  test('requires a structured approval receipt joined to the exact package, coverage row, version, and path', () => {
    const fixture = packageFixture();
    const { approvalReceipt: _receipt, ...withoutReceipt } = fixture;
    expect(() => loadPathEvidence([fixture])).not.toThrow();
    expect(() => loadPathEvidence([{ ...withoutReceipt, approvedVersion: fixture.version }])).toThrow(/approvalReceipt|approval receipt/i);
    expect(() => loadPathEvidence([{ ...fixture, approvalReceipt: { ...fixture.approvalReceipt, packageId: 'wrong' } }])).toThrow(/approval receipt/i);
  });

  test('rejects an approval receipt that predates any edge verification in the package', () => {
    const fixture = packageFixture();
    const changed = { ...fixture.edges[3], verificationDate: '2026-07-31' };
    expect(() => loadPathEvidence([{ ...fixture, edges: [...fixture.edges.slice(0, 3), changed] }])).toThrow(/approval.*predates/i);
  });

  test.each([
    ['wrong first street endpoint', 0, { ...ORIGIN_STREET, id: 'wrong-origin-street' }, undefined],
    ['wrong last street endpoint', 3, undefined, { ...DESTINATION_STREET, id: 'wrong-destination-street' }],
    ['adjacent endpoint identity mismatch', 1, { ...ORIGIN_MEZZ, id: 'wrong-mezz' }, undefined],
    ['adjacent endpoint level mismatch', 1, { ...ORIGIN_MEZZ, level: 'concourse' }, undefined],
  ])('rejects %s', (_label, edgeIndex, start, end) => {
    const fixture = packageFixture();
    const edges = fixture.edges.map((edge, index) => index === edgeIndex ? { ...edge, ...(start ? { start } : {}), ...(end ? { end } : {}) } : edge);
    expect(() => loadPathEvidence([{ ...fixture, edges }])).toThrow(/endpoint|street|continuous/i);
  });

  test.each([
    ['route', { routeId: 'C' }],
    ['direction', { direction: 'southbound' }],
    ['platform', { platformId: 'WRONG' }],
    ['station complex', { stationComplexId: 'WRONG' }],
    ['constituent station', { constituentStationId: 'WRONG' }],
    ['ride segment', { rideSegmentId: 'wrong-ride' }],
  ])('rejects an edge whose governed %s scope does not match its ride segment', (_label, changed) => {
    const fixture = packageFixture();
    const edge = { ...fixture.edges[3], journeyScope: { ...fixture.edges[3].journeyScope, ...changed } };
    expect(() => loadPathEvidence([{ ...fixture, edges: [...fixture.edges.slice(0, 3), edge] }])).toThrow(/scope|segment/i);
  });

  test('accepts one complete transfer package and rejects missing, undeclared, and misordered transfer scope', () => {
    const fixture = transferPackageFixture();
    expect(() => loadPathEvidence([fixture])).not.toThrow();
    expect(() => loadPathEvidence([{ ...fixture, coverage: { ...fixture.coverage, transfers: [] } }])).toThrow(/transfer/i);
    expect(() => loadPathEvidence([{ ...fixture, coverage: { ...fixture.coverage, orderedTransferIds: [] } }])).toThrow(/transfer/i);
    const chain = [...fixture.coverage.journeyChain];
    [chain[3], chain[5]] = [chain[5], chain[3]];
    expect(() => loadPathEvidence([{ ...fixture, coverage: { ...fixture.coverage, journeyChain: chain } }])).toThrow(/journey chain|transfer|order/i);
    const transferEdge = { ...fixture.edges[2], journeyScope: { ...fixture.edges[2].journeyScope, transferId: 'undeclared-transfer' } };
    expect(() => loadPathEvidence([{ ...fixture, edges: [...fixture.edges.slice(0, 2), transferEdge, ...fixture.edges.slice(3)] }])).toThrow(/transfer|scope/i);
  });

  test.each([
    ['duplicate ordered ride ID', () => ({ ...coverage(), orderedRideSegmentIds: ['ride-a', 'ride-a'] })],
    ['unused ride receipt', () => ({ ...coverage(), rideSegments: [...coverage().rideSegments, { ...coverage().rideSegments[0], id: 'unused-ride' }] })],
    ['duplicate transfer ID', () => {
      const value = transferPackageFixture().coverage;
      return { ...value, orderedTransferIds: ['transfer-t50', 'transfer-t50'] };
    }],
    ['duplicate ride use in journey chain', () => {
      const value = coverage();
      return { ...value, journeyChain: [...value.journeyChain.slice(0, 3), { kind: 'ride' as const, rideSegmentId: 'ride-a' }, ...value.journeyChain.slice(3)] };
    }],
  ])('rejects %s', (_label, changedCoverage) => {
    expect(() => loadPathEvidence([{ ...packageFixture(), coverage: changedCoverage() }])).toThrow(/duplicate|unused|ride|transfer|journey chain|order/i);
  });

  test.each([
    ['destination equipment omitted from destination scope', () => ({ ...coverage(), destination: { ...coverage().destination, equipmentIds: [] } })],
    ['destination equipment omitted from global join', () => ({ ...coverage(), equipmentIds: ['EL-A12-01'] })],
    ['transfer equipment omitted from transfer scope', () => {
      const value = transferPackageFixture().coverage;
      return { ...value, transfers: [{ ...value.transfers[0], equipmentIds: [] }] };
    }],
  ])('rejects %s', (_label, changedCoverage) => {
    const fixture = changedCoverage().transfers?.length ? transferPackageFixture() : packageFixture();
    expect(() => loadPathEvidence([{ ...fixture, coverage: changedCoverage() }])).toThrow(/equipment/i);
  });

  test('keeps optional official equipment ingestion unavailable when absent and exact-ID joined when supplied', () => {
    expect(loadOptionalOfficialEquipment(undefined)).toMatchObject({ status: 'unavailable', inventory: [], outages: [] });
    expect(loadOptionalOfficialEquipment({ inventory: [{ equipmentId: 'EL-1' }], outages: [{ equipmentId: 'EL-1', state: 'out-of-service' }], sourceTimestamp: '2026-07-30T12:00:00Z' })).toMatchObject({ status: 'accepted', inventory: [{ equipmentId: 'EL-1' }] });
    expect(() => loadOptionalOfficialEquipment({ inventory: [{ description: 'Elevator' }], outages: [], sourceTimestamp: '2026-07-30T12:00:00Z' })).toThrow(/equipmentId/);
  });

  test('keeps the production path registry empty until immutable reviewed evidence exists', () => {
    expect(PRODUCTION_PATH_REGISTRY).toEqual([]);
    expect(Object.isFrozen(PRODUCTION_PATH_REGISTRY)).toBe(true);
  });
});

describe('complete journey assessment', () => {
  test.each([
    ['destination station', (value: AccessibleJourneyIntent) => ({ ...value, destination: { ...value.destination, stationComplexId: 'OTHER' } })],
    ['destination exit', (value: AccessibleJourneyIntent) => ({ ...value, destination: { ...value.destination, exitId: 'OTHER-EXIT' } })],
    ['origin entrance', (value: AccessibleJourneyIntent) => ({ ...value, origin: { ...value.origin, entranceId: 'OTHER-ENTRANCE' } })],
    ['origin platform', (value: AccessibleJourneyIntent) => ({ ...value, origin: { ...value.origin, platformId: 'A12S' } })],
    ['ride route', (value: AccessibleJourneyIntent) => ({ ...value, rideSegments: [{ ...value.rideSegments[0], routeId: 'C' }] })],
    ['ride destination platform', (value: AccessibleJourneyIntent) => ({ ...value, rideSegments: [{ ...value.rideSegments[0], destination: { ...value.rideSegments[0].destination, platformId: 'WRONG' } }] })],
    ['transfer set', (value: AccessibleJourneyIntent) => ({ ...value, transferIds: ['undeclared-transfer'] })],
  ])('fails closed when the same package is requested with a different %s identity', (_label, mutate) => {
    const fixture = packageFixture();
    const request = requestFor(fixture, { journey: mutate(journeyIntent(fixture)) });
    expect(assessAccessiblePath(fixture, request).status).toBe('ineligible');
  });

  test('requires exact current evidence for every origin and destination machine without calling missing evidence an outage', () => {
    const fixture = packageFixture();
    const decision = assessAccessiblePath(fixture, requestFor(fixture, {
      equipment: { 'EL-A12-01': equipment({ snapshotScope: 'wrong-scope' }) },
    }));
    expect(decision).toMatchObject({ status: 'unknown', accessibleRouteOnly: true });
    expect(decision.reason.toLowerCase()).not.toContain('outage');
    expect(decision.offlineCopy).toBe('Structurally step-free; live elevator status unavailable');
  });

  test('a destination elevator outage invalidates the entire route', () => {
    const fixture = packageFixture();
    const request = requestFor(fixture, {
      equipment: {
        'EL-A12-01': equipment({ targetEquipmentId: 'EL-A12-01' }),
        'EL-D99-01': equipment({ targetEquipmentId: 'EL-D99-01', adverse: true }),
      },
    });
    expect(assessAccessiblePath(fixture, request)).toMatchObject({ status: 'ineligible', equipmentIds: ['EL-A12-01', 'EL-D99-01'] });
  });

  test('owns the complete structured journey, derived reviewed labels, equipment decisions, exposure, and validity', () => {
    const fixture = transferPackageFixture();
    const machines = equipmentMap(fixture);
    const decision = assessAccessiblePath(fixture, requestFor(fixture, { equipment: machines }));
    expect(decision).toMatchObject({
      stationComplexId: 'A12', constituentStationId: 'A12', originIntent: 'origin-street', destinationIntent: 'destination-street',
      routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentIds: ['EL-A12-01', 'EL-T50-01', 'EL-D99-01'],
      journeyScope: journeyIntent(fixture),
      equipmentSourceScopeId: 'nyc-equipment', equipmentSourceVersion: 'equipment-v1',
      exposureDecisionId: validationAccessibilityExposure.decisionId,
      exposureReleaseDecisionId: validationAccessibilityExposure.releaseDecisionId,
    });
    expect(decision.equipmentDecisionIds).toEqual(Object.fromEntries(Object.values(machines).map((machine) => [machine.targetEquipmentId, machine.decisionId])));
    expect(Object.isFrozen(decision.journeyScope)).toBe(true);
    expect(Object.isFrozen(decision.journeyScope.destination)).toBe(true);
    expect(Object.isFrozen(decision.equipmentIds)).toBe(true);
    expect(Object.isFrozen(decision.equipmentDecisionIds)).toBe(true);
  });

  test('rejects a genuine positive equipment decision after its source-validity window', () => {
    const fixture = packageFixture();
    const old = equipmentMap(fixture, at('2026-08-01T00:00:00.000Z'));
    expect(assessAccessiblePath(fixture, requestFor(fixture, {
      equipment: old, decisionTime: at('2026-08-01T00:04:00.001Z'),
    })).status).toBe('unknown');
  });

  test('rejects a still-time-valid positive decision after its ledger accepts a newer outage', () => {
    const fixture = packageFixture();
    const context = supersessionContext();
    context.extend();
    expect(assessAccessiblePath(fixture, requestFor(fixture, {
      equipment: {
        'EL-A12-01': context.machine,
        'EL-D99-01': equipment({ targetEquipmentId: 'EL-D99-01', decisionTime: at('2026-08-01T00:01:00.000Z') }),
      },
      decisionTime: at('2026-08-01T00:03:00.000Z'),
    })).status).toBe('unknown');
  });

  test('revokes an earlier eligible complete path when any dependency ledger accepts a newer outage', () => {
    const fixture = packageFixture();
    const context = supersessionContext();
    const path = assessAccessiblePath(fixture, requestFor(fixture, {
      equipment: {
        'EL-A12-01': context.machine,
        'EL-D99-01': equipment({ targetEquipmentId: 'EL-D99-01', decisionTime: at('2026-08-01T00:01:00.000Z') }),
      },
      decisionTime: at('2026-08-01T00:01:00.000Z'),
    }));
    expect(path.status).toBe('eligible');
    context.extend();
    expect(accessiblePathDecisionAllowsUse(path, at('2026-08-01T00:03:00.000Z'))).toBe(false);
  });

  test('keeps public accessibility locked while pending and rejects wrong-version exposure', () => {
    const fixture = packageFixture();
    const publicExposure = resolveAccessibilityExposure(PRODUCTION_EXPOSURE_REGISTRY, 'public-accessibility-coverage-v1', 'coverage-v1', at('2026-08-01T00:00:00Z'));
    const wrongVersion = resolveAccessibilityExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-accessibility-coverage-v1', 'wrong-v2', at('2026-08-01T00:00:00Z'));
    expect(assessAccessiblePath(fixture, requestFor(fixture, { exposure: publicExposure })).status).toBe('unknown');
    expect(assessAccessiblePath(fixture, requestFor(fixture, { exposure: wrongVersion })).status).toBe('unknown');
  });

  test('rejects reuse of a genuine exposure token after its validity window', () => {
    const fixture = packageFixture();
    expect(assessAccessiblePath(fixture, requestFor(fixture, {
      decisionTime: at('2027-07-30T23:59:59.001Z'), equipment: equipmentMap(fixture),
    })).status).toBe('unknown');
  });

  test('rejects a caller-authored same-version approved public accessibility object', () => {
    const fixture = packageFixture();
    const approved = { owner: 'accessibility', surface: 'public', packageVersion: 'coverage-v1', releaseDecisionId: 'forged', releaseStatus: 'approved' } as unknown as ResolvedAccessibilityExposure;
    expect(assessAccessiblePath(fixture, requestFor(fixture, { exposure: approved })).status).toBe('unknown');
  });

  test('rejects re-keying a resolved status decision to another required machine', () => {
    const fixture = packageFixture();
    const otherMachine = equipment({ targetEquipmentId: 'EL-OTHER' });
    expect(assessAccessiblePath(fixture, requestFor(fixture, {
      equipment: { 'EL-A12-01': otherMachine, 'EL-D99-01': equipment({ targetEquipmentId: 'EL-D99-01' }) },
    })).status).toBe('unknown');
  });

  test('keeps two independently complete destination packages separately eligible', () => {
    const first = packageFixture();
    const second = alternateDestinationPackage();
    expect(validateAccessibilityRegistry([first, second])).toHaveLength(2);
    expect(assessAccessiblePath(first, requestFor(first)).status).toBe('eligible');
    expect(assessAccessiblePath(second, requestFor(second)).status).toBe('eligible');
  });

  test('rejects duplicate canonical paths and applies canonical byte ordering only after full validation', () => {
    const fixture = packageFixture();
    expect(() => validateAccessibilityRegistry([fixture, packageFixture({ packageId: 'other' })])).toThrow(/duplicate canonical/i);
    const betaBase = alternateDestinationPackage();
    const betaPath = 'path:ÃƒÂ©';
    const beta = {
      ...betaBase, packageId: 'beta', canonicalPathIdentity: betaPath,
      coverage: { ...betaBase.coverage, completePathId: betaPath },
      edges: betaBase.edges.map((edge) => ({ ...edge, canonicalPathIdentity: betaPath })),
      approvalReceipt: { ...betaBase.approvalReceipt, receiptId: 'approval:beta', packageId: 'beta', canonicalPathIdentity: betaPath },
    };
    const alphaBase = packageFixture();
    const alphaPath = 'path:e';
    const alpha = {
      ...alphaBase, packageId: 'alpha', canonicalPathIdentity: alphaPath,
      coverage: { ...alphaBase.coverage, completePathId: alphaPath },
      edges: alphaBase.edges.map((edge) => ({ ...edge, canonicalPathIdentity: alphaPath })),
      approvalReceipt: { ...alphaBase.approvalReceipt, receiptId: 'approval:alpha', packageId: 'alpha', canonicalPathIdentity: alphaPath },
    };
    expect(orderAccessiblePaths([beta, alpha]).map(({ packageId }) => packageId)).toEqual(['alpha', 'beta']);
  });
});
