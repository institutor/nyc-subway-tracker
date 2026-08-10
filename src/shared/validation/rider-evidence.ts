import {
  assessAccessiblePath,
  type AccessibilityPackage,
  type AccessibleJourneyIntent,
  type StationDirectionCoverageRow,
} from '../domain/accessible-path';
import {
  acceptEquipmentHistory,
  acceptEquipmentInventory,
  assessEquipmentStatus,
  type EquipmentStatusDecision,
} from '../domain/equipment-status';
import {
  resolveAccessibilityExposure,
  resolveGuidanceExposure,
  VALIDATION_EXPOSURE_REGISTRY,
} from '../domain/exposure-decision';
import {
  resolvePlatformGuidance,
  type PlatformGuidanceRecord,
} from '../domain/platform-guidance';

const PATH_ID = 'path-a12-r20-accessible';
const PATH_VERSION = 'coverage-v1';
const EQUIPMENT_ID = 'EL-A12-01';
const EQUIPMENT_SCOPE = 'validation-equipment-scope';
const EQUIPMENT_VERSION = 'validation-equipment-v1';

export type ValidationRiderEvidence = Readonly<{
  path: NonNullable<ReturnType<typeof assessAccessiblePath>>;
  equipment: readonly {
    readonly decision: EquipmentStatusDecision;
    readonly label: '125 St platform elevator';
    readonly required: true;
  }[];
  guidance: NonNullable<ReturnType<typeof resolvePlatformGuidance>>;
  decisionTime: Date;
}>;

/** Bounded demonstration evidence composed through the same domain gates used by rider components. */
export function createValidationRiderEvidence(decisionTime: Date): ValidationRiderEvidence | undefined {
  const now = cloneInstant(decisionTime);
  if (!now) return undefined;
  const accessibilityExposure = resolveAccessibilityExposure(
    VALIDATION_EXPOSURE_REGISTRY,
    'validation-accessibility-coverage-v1',
    PATH_VERSION,
    now,
  );
  const guidanceExposure = resolveGuidanceExposure(
    VALIDATION_EXPOSURE_REGISTRY,
    'validation-guidance-package-v1',
    'package-v1',
    now,
  );
  if (!accessibilityExposure || !guidanceExposure) return undefined;

  const equipmentDecision = createEquipmentDecision(now);
  const path = assessAccessiblePath(accessibilityPackage(), {
    journey: accessibleJourney(),
    equipmentSourceScopeId: EQUIPMENT_SCOPE,
    equipmentSourceVersion: EQUIPMENT_VERSION,
    equipment: { [EQUIPMENT_ID]: equipmentDecision },
    exposure: accessibilityExposure,
    decisionTime: now,
  });
  if (path.status !== 'eligible') return undefined;
  const guidance = resolvePlatformGuidance([guidanceRecord()], {
    complex: { id: 'A12', name: '125 St' },
    constituent: { id: 'A12', name: '125 St' },
    route: 'A',
    servicePattern: 'ordinary',
    direction: 'southbound',
    destination: 'Far Rockaway',
    platformId: 'A12S',
    orientation: 'southbound travel axis',
    objectiveType: 'accessible-exit',
    objectiveTarget: EQUIPMENT_ID,
    accessiblePathVersion: PATH_VERSION,
    now,
    platformState: 'confirmed',
    rerouted: false,
    exposure: guidanceExposure,
  });
  if (!guidance) return undefined;
  return deepFreeze({
    path,
    equipment: [{ decision: equipmentDecision, label: '125 St platform elevator', required: true }],
    guidance,
    decisionTime: now,
  });
}

function createEquipmentDecision(now: Date): EquipmentStatusDecision {
  const acceptedAt = new Date(now.getTime() - 60 * 60_000).toISOString();
  const sourceTimestamp = new Date(now.getTime() - 60_000).toISOString();
  const inventory = acceptEquipmentInventory({
    inventoryId: 'validation-equipment-inventory-v1',
    evidenceOwner: 'official-equipment-inventory',
    sourceScopeId: EQUIPMENT_SCOPE,
    sourceVersion: 'validation-inventory-v1',
    acceptedAt,
    equipmentIds: [EQUIPMENT_ID, 'EL-VALIDATION-OTHER'],
  });
  const history = acceptEquipmentHistory({
    historyId: 'validation-equipment-history-v1',
    evidenceOwner: 'official-equipment-status',
    sourceScopeId: EQUIPMENT_SCOPE,
    sourceVersion: EQUIPMENT_VERSION,
    inventoryVersion: 'validation-inventory-v1',
    snapshots: [{
      snapshotId: 'validation-equipment-snapshot-v1',
      sequenceOrdinal: 1,
      predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status',
      sourceScopeId: EQUIPMENT_SCOPE,
      sourceVersion: EQUIPMENT_VERSION,
      inventoryVersion: 'validation-inventory-v1',
      sourceTimestamp,
      acceptedAt: new Date(now.getTime() - 59_000).toISOString(),
      declaredRecordCount: 1,
      records: [{ recordId: 'validation-other-outage', equipmentId: 'EL-VALIDATION-OTHER', state: 'out-of-service' }],
    }],
  }, inventory);
  return assessEquipmentStatus({ targetEquipmentId: EQUIPMENT_ID, decisionTime: now, inventory, history });
}

function accessibleJourney(): AccessibleJourneyIntent {
  return {
    origin: {
      stationComplexId: 'A12', constituentStationId: 'A12', entranceId: 'ENT-A12-VALIDATION',
      streetEndpointId: 'endpoint-a12-street', platformId: 'A12S', boardingAreaId: 'A12S-middle',
    },
    destination: {
      stationComplexId: 'R20', constituentStationId: 'R20', platformId: 'R20S',
      exitId: 'EXIT-R20-VALIDATION', streetEndpointId: 'endpoint-r20-street',
    },
    rideSegments: [{
      id: 'ride-a12-r20', routeId: 'A', direction: 'southbound',
      origin: {
        stationComplexId: 'A12', constituentStationId: 'A12', platformId: 'A12S',
        boardingAreaId: 'A12S-middle', endpointId: 'endpoint-a12-platform',
      },
      destination: {
        stationComplexId: 'R20', constituentStationId: 'R20', platformId: 'R20S', endpointId: 'endpoint-r20-platform',
      },
    }],
    transferIds: [],
  };
}

function accessibilityPackage(): AccessibilityPackage {
  const originStreet = endpoint('endpoint-a12-street', 'street', 'A12', 'A12', null);
  const originPlatform = endpoint('endpoint-a12-platform', 'platform', 'A12', 'A12', 'A12S');
  const destinationPlatform = endpoint('endpoint-r20-platform', 'platform', 'R20', 'R20', 'R20S');
  const destinationStreet = endpoint('endpoint-r20-street', 'street', 'R20', 'R20', null);
  const originEdgeId = 'edge-a12-elevator';
  const destinationEdgeId = 'edge-r20-level';
  const coverage: StationDirectionCoverageRow = {
    coverageRecordId: 'validation-accessible-a12-r20',
    coverageRecordVersion: PATH_VERSION,
    origin: {
      stationComplex: { id: 'A12', name: '125 St' },
      constituentStation: { id: 'A12', name: '125 St' },
      entrance: {
        id: 'ENT-A12-VALIDATION', description: 'St Nicholas Avenue accessible entrance', streetCorner: 'southwest',
        streetEndpoint: originStreet,
      },
      platform: { id: 'A12S', boardingAreaId: 'A12S-middle', endpoint: originPlatform },
      orderedAccessEdgeIds: [originEdgeId],
      equipmentIds: [EQUIPMENT_ID],
    },
    destination: {
      stationComplex: { id: 'R20', name: 'Canal St' },
      constituentStation: { id: 'R20', name: 'Canal St' },
      platform: { id: 'R20S', endpoint: destinationPlatform },
      exit: {
        id: 'EXIT-R20-VALIDATION', description: 'Canal Street accessible exit', streetCorner: 'northeast',
        streetEndpoint: destinationStreet,
      },
      orderedAccessEdgeIds: [destinationEdgeId],
      equipmentIds: [],
    },
    rideSegments: [{
      id: 'ride-a12-r20', routeId: 'A', direction: 'southbound',
      origin: {
        stationComplexId: 'A12', constituentStationId: 'A12', platformId: 'A12S',
        boardingAreaId: 'A12S-middle', endpoint: originPlatform,
      },
      destination: {
        stationComplexId: 'R20', constituentStationId: 'R20', platformId: 'R20S', endpoint: destinationPlatform,
      },
    }],
    transfers: [],
    orderedRideSegmentIds: ['ride-a12-r20'],
    orderedTransferIds: [],
    journeyChain: [
      { kind: 'access-edge', edgeId: originEdgeId },
      { kind: 'ride', rideSegmentId: 'ride-a12-r20' },
      { kind: 'access-edge', edgeId: destinationEdgeId },
    ],
    completePathId: PATH_ID,
    orderedEdgeIds: [originEdgeId, destinationEdgeId],
    equipmentIds: [EQUIPMENT_ID],
    accessiblePathMembershipByEdge: { [originEdgeId]: true, [destinationEdgeId]: true },
    operatingRestrictions: ['ordinary A service only'],
    evidenceSources: ['Committed validation accessibility package'],
    evidenceReferences: ['validation/accessibility-a12-r20-v1'],
    verificationDate: '2026-07-30',
    verifier: { name: 'Validation Accessibility Reviewer', role: 'Accessibility' },
    productDecision: review('Product'),
    accessibilityDecision: review('Accessibility'),
    dataQualityDecision: review('Data Quality'),
    contentDecision: review('Content'),
    operationsDecision: review('Operations'),
    structuralDisposition: { status: 'accepted', reason: 'Complete fixed validation path' },
    unsupportedScope: { lines: [], directions: [], entrances: [], platforms: [], servicePatterns: [], paths: [] },
  };
  return {
    packageId: 'validation-accessibility-package-a12-r20',
    version: PATH_VERSION,
    canonicalPathIdentity: PATH_ID,
    coverage,
    edges: [
      {
        id: originEdgeId, order: 1, movementType: 'elevator', start: originStreet, end: originPlatform,
        journeyScope: {
          kind: 'origin-access', rideSegmentId: 'ride-a12-r20', transferId: null,
          stationComplexId: 'A12', constituentStationId: 'A12', routeId: 'A', direction: 'southbound', platformId: 'A12S',
        },
        equipmentId: EQUIPMENT_ID, officialAccessiblePath: true, restrictions: ['ordinary A service only'],
        verificationDate: '2026-07-30', evidenceReference: 'validation/accessibility-a12-r20-v1',
        reviewDisposition: 'approved', canonicalPathIdentity: PATH_ID,
      },
      {
        id: destinationEdgeId, order: 2, movementType: 'level-path', start: destinationPlatform, end: destinationStreet,
        journeyScope: {
          kind: 'destination-access', rideSegmentId: 'ride-a12-r20', transferId: null,
          stationComplexId: 'R20', constituentStationId: 'R20', routeId: 'A', direction: 'southbound', platformId: 'R20S',
        },
        equipmentId: null, officialAccessiblePath: true, restrictions: ['ordinary A service only'],
        verificationDate: '2026-07-30', evidenceReference: 'validation/accessibility-a12-r20-v1',
        reviewDisposition: 'approved', canonicalPathIdentity: PATH_ID,
      },
    ],
    approvalReceipt: {
      receiptId: 'validation-accessibility-approval-a12-r20',
      evidenceOwner: 'app-owned-accessibility-path-approvals',
      decision: 'approved',
      packageId: 'validation-accessibility-package-a12-r20',
      packageVersion: PATH_VERSION,
      coverageRecordId: 'validation-accessible-a12-r20',
      coverageRecordVersion: PATH_VERSION,
      canonicalPathIdentity: PATH_ID,
      approvedOn: '2026-07-30',
    },
  };
}

function guidanceRecord(): PlatformGuidanceRecord {
  const complex = { id: 'A12', name: '125 St' } as const;
  const constituent = { id: 'A12', name: '125 St' } as const;
  const parent = 'validation-guidance-a12-v1';
  const version = 'v1';
  const roleReview = (role: PlatformGuidanceRecord['productDecision']['role'], reviewer: string) => ({
    reviewId: `${parent}:${role}`,
    parentCoverageRowId: parent,
    parentRecordVersion: version,
    role,
    decision: 'approve' as const,
    reviewer,
    reviewedOn: '2026-07-30',
  });
  return {
    coverageRowId: parent,
    immutableVersion: version,
    supersededVersion: null,
    complex,
    constituent,
    priorityCategory: 'accessible-objective',
    categoryEvidence: {
      sourceId: 'validation-guidance-source', reviewedOn: '2026-07-30', status: 'reviewed',
      parentCoverageRowId: parent, parentRecordVersion: version,
    },
    route: 'A', servicePattern: 'ordinary', direction: 'southbound', destination: 'Far Rockaway', platformId: 'A12S',
    layoutOrientation: 'southbound travel axis', frontRearOrder: 'front-to-back south', zoneGeometry: 'middle zone markers 4-6',
    objectiveType: 'accessible-exit', objectiveTarget: EQUIPMENT_ID,
    physicalRelationships: 'platform to elevator to mezzanine to street',
    zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator' },
    certaintyCeiling: 'verified', accessiblePathVersion: PATH_VERSION, restrictions: ['ordinary pattern only'],
    supportedScope: {
      complex, constituent, route: 'A', servicePattern: 'ordinary', direction: 'southbound', destination: 'Far Rockaway',
      platformId: 'A12S', layoutOrientation: 'southbound travel axis', objectiveType: 'accessible-exit',
      objectiveTarget: EQUIPMENT_ID, accessiblePathVersion: PATH_VERSION, position: 'middle',
    },
    unsupportedScope: {
      complexIds: [], constituentIds: [], routes: [], servicePatterns: ['rerouted'], directions: ['northbound'],
      destinations: [], platformIds: ['A12N'], layoutOrientations: [], objectiveTypes: [],
      objectiveTargets: [], accessiblePathVersions: [], positions: [], conditions: ['rerouted'],
    },
    task7RecordVersion: 'validation-task7-a12-v1',
    durableFieldEvidence: 'validation/guidance-a12-v1',
    verificationDate: '2026-07-30',
    verifier: { name: 'Validation Guidance Reviewer', role: 'Accessibility' },
    reverificationTriggers: [],
    reverificationStatus: { status: 'current', decidedOn: '2026-07-30', parentCoverageRowId: parent, parentRecordVersion: version },
    feedbackCorrections: [],
    productDecision: roleReview('product', 'Product Reviewer'),
    accessibilityDecision: roleReview('accessibility', 'Accessibility Reviewer'),
    dataQualityDecision: roleReview('data-quality', 'Data Reviewer'),
    contentDecision: roleReview('content', 'Content Reviewer'),
    operationsDecision: roleReview('operations', 'Operations Reviewer'),
    disposition: { status: 'eligible-for-runtime-evaluation', decidedOn: '2026-07-30', parentCoverageRowId: parent, parentRecordVersion: version },
    releasePackage: {
      packageVersion: 'package-v1', decisionId: 'validation-guidance-release-package-v1',
      parentCoverageRowId: parent, parentRecordVersion: version, inclusion: 'included', scope: 'exact-scope',
      reason: 'Committed validation guidance', decidedOn: '2026-07-30',
    },
    position: 'middle',
    provenance: {
      sourceId: 'validation-guidance-source', version, immutable: true, reviewed: true,
      parentCoverageRowId: parent, parentRecordVersion: version, packageVersion: 'package-v1', acceptedOn: '2026-07-30',
    },
  };
}

function endpoint(id: string, level: string, stationComplexId: string, constituentStationId: string, platformId: string | null) {
  return { id, level, stationComplexId, constituentStationId, platformId };
}

function review(role: string) {
  return { decision: 'approve' as const, reviewer: `${role} Reviewer`, date: '2026-07-30', recordVersion: PATH_VERSION };
}

function cloneInstant(value: Date): Date | undefined {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return undefined;
  return new Date(value.getTime());
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
