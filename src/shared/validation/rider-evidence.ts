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
import { JOURNEY_CAPTURE_DISCLOSURE } from '../domain/journey-capture';
import { encodeCanonicalStringTuple } from '../domain/canonical';

const PATH_ID = 'path-a15-a34-accessible';
const PATH_VERSION = 'coverage-v1';
const EQUIPMENT_ID = 'EL-A34-01';
const EQUIPMENT_SCOPE = 'validation-equipment-scope';
const EQUIPMENT_VERSION = 'validation-equipment-v1';
const SNAPSHOT_ID = 'validation-snapshot-2026-08-04-v2';
const CATALOG_VERSION = 'validation-catalog-2026-08-04-v2';
const JOURNEY_VERSION = 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d';
const MAP_DAY_VERSION = 'validation-map-day-2026-08-04-v2';
const MAP_NIGHT_VERSION = 'validation-map-night-2026-08-04-v2';

export const VALIDATION_RIDER_EVIDENCE_MANIFEST = Object.freeze({
  decisionSnapshotIdentity: SNAPSHOT_ID,
  stationCatalogVersion: CATALOG_VERSION,
  journeyGraphVersion: JOURNEY_VERSION,
  mapDayVersion: MAP_DAY_VERSION,
  mapNightVersion: MAP_NIGHT_VERSION,
  pathId: PATH_ID,
  originStationId: 'A15', originPlatformId: 'A15S',
  destinationStationId: 'A34', destinationPlatformId: 'A34S',
  routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
} as const);

export interface ValidationRiderEvidenceOwner {
  readonly decisionIdentity: string;
  readonly snapshotIdentity: string;
  readonly decisionTime: Date;
  readonly disclosure: typeof JOURNEY_CAPTURE_DISCLOSURE;
  readonly contentVersions: {
    readonly stationCatalog: string;
    readonly maps: { readonly day: string; readonly night: string };
    readonly journeyGraph: string;
  };
}

export interface ValidationRiderEvidenceReceipt {
  readonly bootstrapDecisionIdentity: string;
  readonly decisionSnapshotIdentity: string;
  readonly stationCatalogVersion: string;
  readonly journeyGraphVersion: string;
  readonly mapDayVersion: string;
  readonly mapNightVersion: string;
  readonly pathId: string;
  readonly originStationId: 'A15';
  readonly originPlatformId: 'A15S';
  readonly destinationStationId: 'A34';
  readonly destinationPlatformId: 'A34S';
  readonly routeId: 'A';
  readonly direction: 'southbound';
  readonly actualDestination: 'Far Rockaway';
}

export type ValidationRiderEvidence = Readonly<{
  path: NonNullable<ReturnType<typeof assessAccessiblePath>>;
  equipment: readonly {
    readonly decision: EquipmentStatusDecision;
    readonly label: 'Canal St platform elevator';
    readonly required: true;
  }[];
  guidance: NonNullable<ReturnType<typeof resolvePlatformGuidance>>;
  decisionTime: Date;
  receipt: ValidationRiderEvidenceReceipt;
}>;

export type BoundValidationRiderEvidence = ValidationRiderEvidence & Readonly<{
  journeyReceipt: {
    readonly journeyDecisionIdentity: string;
    readonly canonicalItineraryIdentity: string;
    readonly capturePackageIdentity: string;
  };
}>;

interface ValidationJourneyResponseOwner {
  readonly responseIdentity: string;
  readonly decidedAt: string;
  readonly decisionSnapshotIdentity?: string;
  readonly demonstrationLabel?: string;
  readonly runtime: { readonly mode: string; readonly surface: string; readonly availability: string };
  readonly data: null | {
    readonly kind: string;
    readonly scope: {
      readonly mode: string;
      readonly originStationId: string;
      readonly destinationStationId: string;
      readonly accessibleRouteOnly: boolean;
    };
  };
}

interface ValidationJourneyItineraryOwner {
  readonly id: string;
  readonly transfers: number;
  readonly transferIds: readonly string[];
  readonly legs: readonly {
    readonly patternId: string;
    readonly routeId: string;
    readonly direction: string;
    readonly actualDestination: string;
    readonly fromOccurrenceId: string;
    readonly toOccurrenceId: string;
    readonly orderedOccurrenceIds: readonly string[];
    readonly fromStationId: string;
    readonly toStationId: string;
    readonly orderedStationIds: readonly string[];
  }[];
  readonly capture?: {
    readonly itineraryId: string;
    readonly requestMode: string;
    readonly timing: string;
    readonly capturedAt: string;
    readonly disclosure?: string;
    readonly scope: {
      readonly mode: string;
      readonly originStationId: string;
      readonly destinationStationId: string;
      readonly accessibleRouteOnly: boolean;
    };
    readonly equipmentClaims: readonly {
      readonly equipmentId: string;
      readonly connectionId: string;
      readonly pathId: string;
      readonly observation: string;
    }[];
  };
}

/** Bounded demonstration evidence composed through the same domain gates used by rider components. */
export function createValidationRiderEvidence(owner: ValidationRiderEvidenceOwner): ValidationRiderEvidence | undefined {
  if (!owner || typeof owner !== 'object'
    || typeof owner.decisionIdentity !== 'string' || !owner.decisionIdentity
    || owner.snapshotIdentity !== SNAPSHOT_ID
    || owner.disclosure !== JOURNEY_CAPTURE_DISCLOSURE
    || owner.contentVersions?.stationCatalog !== CATALOG_VERSION
    || owner.contentVersions?.journeyGraph !== JOURNEY_VERSION
    || owner.contentVersions?.maps?.day !== MAP_DAY_VERSION
    || owner.contentVersions?.maps?.night !== MAP_NIGHT_VERSION) return undefined;
  const now = cloneInstant(owner.decisionTime);
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
    complex: { id: 'A34', name: 'Canal St' },
    constituent: { id: 'A34', name: 'Canal St' },
    route: 'A',
    servicePattern: 'ordinary',
    direction: 'southbound',
    destination: 'Far Rockaway',
    platformId: 'A34S',
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
    equipment: [{ decision: equipmentDecision, label: 'Canal St platform elevator', required: true }],
    guidance,
    decisionTime: now,
    receipt: {
      bootstrapDecisionIdentity: owner.decisionIdentity,
      decisionSnapshotIdentity: owner.snapshotIdentity,
      stationCatalogVersion: owner.contentVersions.stationCatalog,
      journeyGraphVersion: owner.contentVersions.journeyGraph,
      mapDayVersion: owner.contentVersions.maps.day,
      mapNightVersion: owner.contentVersions.maps.night,
      pathId: PATH_ID,
      originStationId: 'A15', originPlatformId: 'A15S',
      destinationStationId: 'A34', destinationPlatformId: 'A34S',
      routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
    },
  });
}

export function bindValidationRiderEvidenceToItinerary(
  evidence: ValidationRiderEvidence | undefined,
  response: ValidationJourneyResponseOwner,
  itinerary: ValidationJourneyItineraryOwner,
): BoundValidationRiderEvidence | undefined {
  if (!evidence || !response.data || (response.data.kind !== 'planned' && response.data.kind !== 'untimed')) return undefined;
  const [leg] = itinerary.legs;
  const capture = itinerary.capture;
  const [equipment] = capture?.equipmentClaims ?? [];
  const exact = response.runtime.mode === 'validation'
    && response.runtime.surface === 'demonstration'
    && response.runtime.availability === 'available'
    && response.demonstrationLabel === JOURNEY_CAPTURE_DISCLOSURE
    && response.decisionSnapshotIdentity === evidence.receipt.decisionSnapshotIdentity
    && response.decidedAt === evidence.decisionTime.toISOString()
    && response.data.scope.mode === 'online-current'
    && response.data.scope.accessibleRouteOnly
    && response.data.scope.originStationId === evidence.receipt.originStationId
    && response.data.scope.destinationStationId === evidence.receipt.destinationStationId
    && itinerary.transfers === 0 && itinerary.transferIds.length === 0 && itinerary.legs.length === 1
    && leg?.patternId === 'pattern-direct'
    && leg.routeId === evidence.receipt.routeId
    && leg.direction === evidence.receipt.direction
    && leg.actualDestination === evidence.receipt.actualDestination
    && leg.fromStationId === evidence.receipt.originStationId
    && leg.toStationId === evidence.receipt.destinationStationId
    && exactStrings(leg.orderedStationIds, ['A15', 'A34'])
    && leg.fromOccurrenceId === 'occ-a15-direct'
    && leg.toOccurrenceId === 'occ-a34-direct'
    && exactStrings(leg.orderedOccurrenceIds, ['occ-a15-direct', 'occ-a34-direct'])
    && capture?.itineraryId === itinerary.id
    && capture.requestMode === 'online-current'
    && capture.timing === 'timed'
    && capture.capturedAt === response.decidedAt
    && capture.disclosure === JOURNEY_CAPTURE_DISCLOSURE
    && capture.scope.mode === response.data.scope.mode
    && capture.scope.originStationId === response.data.scope.originStationId
    && capture.scope.destinationStationId === response.data.scope.destinationStationId
    && capture.scope.accessibleRouteOnly === response.data.scope.accessibleRouteOnly
    && capture.equipmentClaims.length === 1
    && equipment?.equipmentId === EQUIPMENT_ID
    && equipment.connectionId === 'connection-a34-platform'
    && equipment.pathId === evidence.receipt.pathId
    && equipment.observation === 'working';
  if (!exact || !capture) return undefined;
  return deepFreeze({
    ...evidence,
    journeyReceipt: {
      journeyDecisionIdentity: response.responseIdentity,
      canonicalItineraryIdentity: itinerary.id,
      capturePackageIdentity: encodeCanonicalStringTuple([
        'validation-capture-package-v1', response.responseIdentity, itinerary.id, capture.capturedAt,
        capture.scope.originStationId, capture.scope.destinationStationId, capture.requestMode,
      ]),
    },
  });
}

function exactStrings(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
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
      stationComplexId: 'A15', constituentStationId: 'A15', entranceId: 'ENT-A15-VALIDATION',
      streetEndpointId: 'endpoint-a15-street', platformId: 'A15S', boardingAreaId: 'A15S-middle',
    },
    destination: {
      stationComplexId: 'A34', constituentStationId: 'A34', platformId: 'A34S',
      exitId: 'EXIT-A34-VALIDATION', streetEndpointId: 'endpoint-a34-street',
    },
    rideSegments: [{
      id: 'ride-a15-a34', routeId: 'A', direction: 'southbound',
      origin: {
        stationComplexId: 'A15', constituentStationId: 'A15', platformId: 'A15S',
        boardingAreaId: 'A15S-middle', endpointId: 'endpoint-a15-platform',
      },
      destination: {
        stationComplexId: 'A34', constituentStationId: 'A34', platformId: 'A34S', endpointId: 'endpoint-a34-platform',
      },
    }],
    transferIds: [],
  };
}

function accessibilityPackage(): AccessibilityPackage {
  const originStreet = endpoint('endpoint-a15-street', 'street', 'A15', 'A15', null);
  const originPlatform = endpoint('endpoint-a15-platform', 'platform', 'A15', 'A15', 'A15S');
  const destinationPlatform = endpoint('endpoint-a34-platform', 'platform', 'A34', 'A34', 'A34S');
  const destinationStreet = endpoint('endpoint-a34-street', 'street', 'A34', 'A34', null);
  const originEdgeId = 'edge-a15-level';
  const destinationEdgeId = 'edge-a34-elevator';
  const coverage: StationDirectionCoverageRow = {
    coverageRecordId: 'validation-accessible-a15-a34',
    coverageRecordVersion: PATH_VERSION,
    origin: {
      stationComplex: { id: 'A15', name: '125 St' },
      constituentStation: { id: 'A15', name: '125 St' },
      entrance: {
        id: 'ENT-A15-VALIDATION', description: 'St Nicholas Avenue accessible entrance', streetCorner: 'southwest',
        streetEndpoint: originStreet,
      },
      platform: { id: 'A15S', boardingAreaId: 'A15S-middle', endpoint: originPlatform },
      orderedAccessEdgeIds: [originEdgeId],
      equipmentIds: [],
    },
    destination: {
      stationComplex: { id: 'A34', name: 'Canal St' },
      constituentStation: { id: 'A34', name: 'Canal St' },
      platform: { id: 'A34S', endpoint: destinationPlatform },
      exit: {
        id: 'EXIT-A34-VALIDATION', description: 'Canal Street accessible exit', streetCorner: 'northeast',
        streetEndpoint: destinationStreet,
      },
      orderedAccessEdgeIds: [destinationEdgeId],
      equipmentIds: [EQUIPMENT_ID],
    },
    rideSegments: [{
      id: 'ride-a15-a34', routeId: 'A', direction: 'southbound',
      origin: {
        stationComplexId: 'A15', constituentStationId: 'A15', platformId: 'A15S',
        boardingAreaId: 'A15S-middle', endpoint: originPlatform,
      },
      destination: {
        stationComplexId: 'A34', constituentStationId: 'A34', platformId: 'A34S', endpoint: destinationPlatform,
      },
    }],
    transfers: [],
    orderedRideSegmentIds: ['ride-a15-a34'],
    orderedTransferIds: [],
    journeyChain: [
      { kind: 'access-edge', edgeId: originEdgeId },
      { kind: 'ride', rideSegmentId: 'ride-a15-a34' },
      { kind: 'access-edge', edgeId: destinationEdgeId },
    ],
    completePathId: PATH_ID,
    orderedEdgeIds: [originEdgeId, destinationEdgeId],
    equipmentIds: [EQUIPMENT_ID],
    accessiblePathMembershipByEdge: { [originEdgeId]: true, [destinationEdgeId]: true },
    operatingRestrictions: ['ordinary A service only'],
    evidenceSources: ['Committed validation accessibility package'],
    evidenceReferences: ['validation/accessibility-a15-a34-v1'],
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
    packageId: 'validation-accessibility-package-a15-a34',
    version: PATH_VERSION,
    canonicalPathIdentity: PATH_ID,
    coverage,
    edges: [
      {
        id: originEdgeId, order: 1, movementType: 'level-path', start: originStreet, end: originPlatform,
        journeyScope: {
          kind: 'origin-access', rideSegmentId: 'ride-a15-a34', transferId: null,
          stationComplexId: 'A15', constituentStationId: 'A15', routeId: 'A', direction: 'southbound', platformId: 'A15S',
        },
        equipmentId: null, officialAccessiblePath: true, restrictions: ['ordinary A service only'],
        verificationDate: '2026-07-30', evidenceReference: 'validation/accessibility-a15-a34-v1',
        reviewDisposition: 'approved', canonicalPathIdentity: PATH_ID,
      },
      {
        id: destinationEdgeId, order: 2, movementType: 'elevator', start: destinationPlatform, end: destinationStreet,
        journeyScope: {
          kind: 'destination-access', rideSegmentId: 'ride-a15-a34', transferId: null,
          stationComplexId: 'A34', constituentStationId: 'A34', routeId: 'A', direction: 'southbound', platformId: 'A34S',
        },
        equipmentId: EQUIPMENT_ID, officialAccessiblePath: true, restrictions: ['ordinary A service only'],
        verificationDate: '2026-07-30', evidenceReference: 'validation/accessibility-a15-a34-v1',
        reviewDisposition: 'approved', canonicalPathIdentity: PATH_ID,
      },
    ],
    approvalReceipt: {
      receiptId: 'validation-accessibility-approval-a15-a34',
      evidenceOwner: 'app-owned-accessibility-path-approvals',
      decision: 'approved',
      packageId: 'validation-accessibility-package-a15-a34',
      packageVersion: PATH_VERSION,
      coverageRecordId: 'validation-accessible-a15-a34',
      coverageRecordVersion: PATH_VERSION,
      canonicalPathIdentity: PATH_ID,
      approvedOn: '2026-07-30',
    },
  };
}

function guidanceRecord(): PlatformGuidanceRecord {
  const complex = { id: 'A34', name: 'Canal St' } as const;
  const constituent = { id: 'A34', name: 'Canal St' } as const;
  const parent = 'validation-guidance-a34-v1';
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
    route: 'A', servicePattern: 'ordinary', direction: 'southbound', destination: 'Far Rockaway', platformId: 'A34S',
    layoutOrientation: 'southbound travel axis', frontRearOrder: 'front-to-back south', zoneGeometry: 'middle zone markers 4-6',
    objectiveType: 'accessible-exit', objectiveTarget: EQUIPMENT_ID,
    physicalRelationships: 'platform to elevator to mezzanine to street',
    zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator at Canal St' },
    certaintyCeiling: 'verified', accessiblePathVersion: PATH_VERSION, restrictions: ['ordinary pattern only'],
    supportedScope: {
      complex, constituent, route: 'A', servicePattern: 'ordinary', direction: 'southbound', destination: 'Far Rockaway',
      platformId: 'A34S', layoutOrientation: 'southbound travel axis', objectiveType: 'accessible-exit',
      objectiveTarget: EQUIPMENT_ID, accessiblePathVersion: PATH_VERSION, position: 'middle',
    },
    unsupportedScope: {
      complexIds: [], constituentIds: [], routes: [], servicePatterns: ['rerouted'], directions: ['northbound'],
      destinations: [], platformIds: ['A34N'], layoutOrientations: [], objectiveTypes: [],
      objectiveTargets: [], accessiblePathVersions: [], positions: [], conditions: ['rerouted'],
    },
    task7RecordVersion: 'validation-task7-a34-v1',
    durableFieldEvidence: 'validation/guidance-a34-v1',
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
