import { compareCanonicalIdentity, normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import { equipmentDecisionAllowsUse, type EquipmentStatusDecision } from './equipment-status';
import type { Direction } from './types';
import { exposureAllowsEvaluation, type ResolvedAccessibilityExposure } from './exposure-decision';
import type { ExposureSurface } from './exposure-decision';

interface ReviewDecision { readonly decision: 'approve' | 'changes-required'; readonly reviewer: string; readonly date: string; readonly recordVersion: string }
export interface JourneyEndpoint {
  readonly id: string;
  readonly level: string;
  readonly stationComplexId: string;
  readonly constituentStationId: string;
  readonly platformId: string | null;
}
interface RideEndpoint {
  readonly stationComplexId: string;
  readonly constituentStationId: string;
  readonly platformId: string;
  readonly endpoint: JourneyEndpoint;
}
interface RideOrigin extends RideEndpoint { readonly boardingAreaId: string }
export interface AccessibleRideSegment {
  readonly id: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly origin: RideOrigin;
  readonly destination: RideEndpoint;
}
export interface AccessibleTransfer {
  readonly id: string;
  readonly incomingRideSegmentId: string;
  readonly outgoingRideSegmentId: string;
  readonly stationComplexId: string;
  readonly incomingConstituentStationId: string;
  readonly incomingPlatformId: string;
  readonly outgoingConstituentStationId: string;
  readonly outgoingPlatformId: string;
  readonly orderedAccessEdgeIds: readonly string[];
  readonly equipmentIds: readonly string[];
}
export type AccessibleJourneyChainEntry =
  | Readonly<{ kind: 'access-edge'; edgeId: string }>
  | Readonly<{ kind: 'ride'; rideSegmentId: string }>;
export interface StationDirectionCoverageRow {
  readonly coverageRecordId: string; readonly coverageRecordVersion: string;
  readonly origin: {
    readonly stationComplex: { readonly id: string; readonly name: string };
    readonly constituentStation: { readonly id: string; readonly name: string };
    readonly entrance: { readonly id: string; readonly description: string; readonly streetCorner: string; readonly streetEndpoint: JourneyEndpoint };
    readonly platform: { readonly id: string; readonly boardingAreaId: string; readonly endpoint: JourneyEndpoint };
    readonly orderedAccessEdgeIds: readonly string[];
    readonly equipmentIds: readonly string[];
  };
  readonly destination: {
    readonly stationComplex: { readonly id: string; readonly name: string };
    readonly constituentStation: { readonly id: string; readonly name: string };
    readonly platform: { readonly id: string; readonly endpoint: JourneyEndpoint };
    readonly exit: { readonly id: string; readonly description: string; readonly streetCorner: string; readonly streetEndpoint: JourneyEndpoint };
    readonly orderedAccessEdgeIds: readonly string[];
    readonly equipmentIds: readonly string[];
  };
  readonly rideSegments: readonly AccessibleRideSegment[];
  readonly transfers: readonly AccessibleTransfer[];
  readonly orderedRideSegmentIds: readonly string[];
  readonly orderedTransferIds: readonly string[];
  readonly journeyChain: readonly AccessibleJourneyChainEntry[];
  readonly completePathId: string; readonly orderedEdgeIds: readonly string[];
  readonly equipmentIds: readonly string[]; readonly accessiblePathMembershipByEdge: Readonly<Record<string, boolean>>;
  readonly operatingRestrictions: readonly string[]; readonly evidenceSources: readonly string[]; readonly evidenceReferences: readonly string[];
  readonly verificationDate: string; readonly verifier: { readonly name: string; readonly role: string };
  readonly productDecision: ReviewDecision; readonly accessibilityDecision: ReviewDecision; readonly dataQualityDecision: ReviewDecision;
  readonly contentDecision: ReviewDecision; readonly operationsDecision: ReviewDecision;
  readonly structuralDisposition: { readonly status: 'accepted' | 'rejected' | 'pending'; readonly reason: string };
  readonly unsupportedScope: { readonly lines: readonly string[]; readonly directions: readonly string[]; readonly entrances: readonly string[]; readonly platforms: readonly string[]; readonly servicePatterns: readonly string[]; readonly paths: readonly string[] };
}
export interface AccessiblePathEdge {
  readonly id: string; readonly order: number; readonly movementType: 'elevator' | 'compliant-ramp' | 'level-path' | 'stairs' | 'escalator';
  readonly start: JourneyEndpoint; readonly end: JourneyEndpoint;
  readonly journeyScope: {
    readonly kind: 'origin-access' | 'transfer-access' | 'destination-access';
    readonly rideSegmentId: string;
    readonly transferId: string | null;
    readonly stationComplexId: string;
    readonly constituentStationId: string;
    readonly routeId: string;
    readonly direction: Direction;
    readonly platformId: string;
  };
  readonly equipmentId: string | null;
  readonly officialAccessiblePath: boolean; readonly restrictions: readonly string[]; readonly verificationDate: string;
  readonly evidenceReference: string; readonly reviewDisposition: 'approved' | 'rejected' | 'pending'; readonly canonicalPathIdentity: string;
}
export interface AccessibilityPackageApprovalReceipt {
  readonly receiptId: string;
  readonly evidenceOwner: 'app-owned-accessibility-path-approvals';
  readonly decision: 'approved';
  readonly packageId: string;
  readonly packageVersion: string;
  readonly coverageRecordId: string;
  readonly coverageRecordVersion: string;
  readonly canonicalPathIdentity: string;
  readonly approvedOn: string;
}
export interface AccessibilityPackage {
  readonly packageId: string;
  readonly version: string;
  readonly canonicalPathIdentity: string;
  readonly coverage: StationDirectionCoverageRow;
  readonly edges: readonly AccessiblePathEdge[];
  readonly approvalReceipt: AccessibilityPackageApprovalReceipt;
}
const accessiblePathDecisionBrand: unique symbol = Symbol('resolved-accessible-path-decision');
export interface ResolvedAccessiblePathDecision {
  readonly [accessiblePathDecisionBrand]: true;
  readonly evaluationId: string;
  readonly pathId: string;
  readonly packageVersion: string;
  readonly stationComplexId: string;
  readonly constituentStationId: string;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly platformId: string;
  readonly journeyScope: AccessibleJourneyIntent;
  readonly journeyChain: readonly AccessibleJourneyChainEntry[];
  readonly equipmentIds: readonly string[];
  readonly equipmentDecisionIds: Readonly<Record<string, string>>;
  readonly equipmentSourceScopeId: string;
  readonly equipmentSourceVersion: string;
  readonly exposureDecisionId: string | null;
  readonly exposureReleaseDecisionId: string | null;
  readonly surface: ExposureSurface | 'locked';
  readonly evaluatedAt: string;
  readonly validFrom: string;
  readonly validThrough: string;
  readonly status: 'eligible' | 'ineligible' | 'unknown';
  readonly reason: string;
  readonly accessibleRouteOnly: true;
  readonly offlineCopy?: 'Structurally step-free; live elevator status unavailable';
}
const resolvedAccessiblePathDecisions = new WeakSet<object>();
const resolvedPathEquipmentDependencies = new WeakMap<object, readonly EquipmentStatusDecision[]>();

export interface AccessiblePathAssessmentRequest {
  readonly journey: AccessibleJourneyIntent;
  readonly equipmentSourceScopeId: string;
  readonly equipmentSourceVersion: string;
  readonly equipment: Readonly<Record<string, EquipmentStatusDecision>>;
  readonly exposure?: ResolvedAccessibilityExposure;
  readonly decisionTime: Date;
}

export interface AccessibleJourneyIntent {
  readonly origin: {
    readonly stationComplexId: string; readonly constituentStationId: string; readonly entranceId: string;
    readonly streetEndpointId: string; readonly platformId: string; readonly boardingAreaId: string;
  };
  readonly destination: {
    readonly stationComplexId: string; readonly constituentStationId: string; readonly platformId: string;
    readonly exitId: string; readonly streetEndpointId: string;
  };
  readonly rideSegments: readonly {
    readonly id: string; readonly routeId: string; readonly direction: Direction;
    readonly origin: { readonly stationComplexId: string; readonly constituentStationId: string; readonly platformId: string; readonly boardingAreaId: string; readonly endpointId: string };
    readonly destination: { readonly stationComplexId: string; readonly constituentStationId: string; readonly platformId: string; readonly endpointId: string };
  }[];
  readonly transferIds: readonly string[];
}

const COVERAGE_FIELDS = ['coverageRecordId','coverageRecordVersion','origin','destination','rideSegments','transfers','orderedRideSegmentIds','orderedTransferIds','journeyChain','completePathId','orderedEdgeIds','equipmentIds','accessiblePathMembershipByEdge','operatingRestrictions','evidenceSources','evidenceReferences','verificationDate','verifier','productDecision','accessibilityDecision','dataQualityDecision','contentDecision','operationsDecision','structuralDisposition','unsupportedScope'] as const;
const DIRECTIONS: readonly Direction[] = ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'];
const MOVEMENT_TYPES: readonly AccessiblePathEdge['movementType'][] = ['elevator', 'compliant-ramp', 'level-path', 'stairs', 'escalator'];
const REVIEW_FIELDS = ['decision', 'reviewer', 'date', 'recordVersion'] as const;
const APPROVAL_FIELDS = ['receiptId', 'evidenceOwner', 'decision', 'packageId', 'packageVersion', 'coverageRecordId', 'coverageRecordVersion', 'canonicalPathIdentity', 'approvedOn'] as const;

export function validateCoverageRow(raw: unknown): StationDirectionCoverageRow {
  const root = exactRecord(raw, COVERAGE_FIELDS, '26-field station-direction coverage row');
  const coverageRecordId = canonicalIdentifier(root.coverageRecordId, 'coverage record');
  const coverageRecordVersion = canonicalIdentifier(root.coverageRecordVersion, 'coverage record version');
  const origin = originCoverage(root.origin);
  const destination = destinationCoverage(root.destination);
  if (!Array.isArray(root.rideSegments) || root.rideSegments.length === 0) throw new Error('Coverage ride segments must be a non-empty array');
  const rideSegments = root.rideSegments.map(rideSegment);
  if (!Array.isArray(root.transfers)) throw new Error('Coverage transfers must be an array');
  const transfers = root.transfers.map(transfer);
  const orderedRideSegmentIds = canonicalStringArray(root.orderedRideSegmentIds, 'ordered ride segment identities', canonicalIdentifier, true);
  const orderedTransferIds = canonicalStringArray(root.orderedTransferIds, 'ordered transfer identities', canonicalIdentifier, false);
  if (!Array.isArray(root.journeyChain) || root.journeyChain.length === 0) throw new Error('Coverage journey chain must be a non-empty array');
  const journeyChain = root.journeyChain.map(journeyChainEntry);
  const verifierRoot = exactRecord(root.verifier, ['name', 'role'], 'coverage verifier');
  const verifier = {
    name: canonicalText(verifierRoot.name, 'coverage verifier name'),
    role: canonicalText(verifierRoot.role, 'coverage verifier role'),
  };
  const orderedEdgeIds = canonicalStringArray(root.orderedEdgeIds, 'ordered edge identities', canonicalIdentifier, true);
  const equipmentIds = canonicalStringArray(root.equipmentIds, 'route-critical equipment identities', canonicalIdentifier, false);
  const membershipRoot = exactRecord(root.accessiblePathMembershipByEdge, orderedEdgeIds, 'official accessible-path membership');
  const accessiblePathMembershipByEdge = Object.fromEntries(orderedEdgeIds.map((edgeId) => {
    if (membershipRoot[edgeId] !== true) throw new Error('Coverage row official accessible-path membership values must be true');
    return [edgeId, true] as const;
  }));
  const structuralRoot = exactRecord(root.structuralDisposition, ['status', 'reason'], 'structural disposition');
  if (structuralRoot.status !== 'accepted') throw new Error('Coverage row is not structurally accepted');
  const unsupportedRoot = exactRecord(root.unsupportedScope, ['lines','directions','entrances','platforms','servicePatterns','paths'], 'unsupported scope');
  const unsupportedScope = {
    lines: canonicalStringArray(unsupportedRoot.lines, 'unsupported lines', canonicalIdentifier, false),
    directions: directionArray(unsupportedRoot.directions, 'unsupported directions'),
    entrances: canonicalStringArray(unsupportedRoot.entrances, 'unsupported entrances', canonicalIdentifier, false),
    platforms: canonicalStringArray(unsupportedRoot.platforms, 'unsupported platforms', canonicalIdentifier, false),
    servicePatterns: canonicalStringArray(unsupportedRoot.servicePatterns, 'unsupported service patterns', canonicalIdentifier, false),
    paths: canonicalStringArray(unsupportedRoot.paths, 'unsupported paths', canonicalIdentifier, false),
  };
  assertExactOrderedIdentitySet(rideSegments.map((segment) => segment.id), orderedRideSegmentIds, 'ride segment');
  assertExactOrderedIdentitySet(transfers.map((item) => item.id), orderedTransferIds, 'transfer');
  if (orderedTransferIds.length !== Math.max(0, orderedRideSegmentIds.length - 1)) {
    throw new Error('Every journey transfer must bind exactly one adjacent ride pair');
  }
  for (let index = 0; index < transfers.length; index += 1) {
    const item = transfers[index];
    if (item.incomingRideSegmentId !== orderedRideSegmentIds[index]
      || item.outgoingRideSegmentId !== orderedRideSegmentIds[index + 1]) {
      throw new Error('Transfer incoming and outgoing ride segment order does not match the journey');
    }
  }
  const completePathId = canonicalIdentifier(root.completePathId, 'complete path');
  if (rideSegments.some((segment) => unsupportedScope.lines.includes(segment.routeId)
      || unsupportedScope.directions.includes(segment.direction))
    || unsupportedScope.entrances.includes(origin.entrance.id)
    || unsupportedScope.platforms.includes(origin.platform.id)
    || unsupportedScope.platforms.includes(destination.platform.id)
    || unsupportedScope.paths.includes(completePathId)) {
    throw new Error('Unsupported scope contradicts a supported coverage fact');
  }
  const reviews = {
    productDecision: reviewDecision(root.productDecision, coverageRecordVersion, 'product coverage review'),
    accessibilityDecision: reviewDecision(root.accessibilityDecision, coverageRecordVersion, 'accessibility coverage review'),
    dataQualityDecision: reviewDecision(root.dataQualityDecision, coverageRecordVersion, 'data-quality coverage review'),
    contentDecision: reviewDecision(root.contentDecision, coverageRecordVersion, 'content coverage review'),
    operationsDecision: reviewDecision(root.operationsDecision, coverageRecordVersion, 'operations coverage review'),
  };
  const value: StationDirectionCoverageRow = {
    coverageRecordId,
    coverageRecordVersion,
    origin,
    destination,
    rideSegments,
    transfers,
    orderedRideSegmentIds,
    orderedTransferIds,
    journeyChain,
    completePathId,
    orderedEdgeIds,
    equipmentIds,
    accessiblePathMembershipByEdge,
    operatingRestrictions: canonicalStringArray(root.operatingRestrictions, 'operating restrictions', canonicalText, true),
    evidenceSources: canonicalStringArray(root.evidenceSources, 'coverage evidence sources', canonicalText, true),
    evidenceReferences: canonicalStringArray(root.evidenceReferences, 'coverage evidence references', canonicalText, true),
    verificationDate: canonicalDay(root.verificationDate, 'coverage verification date'),
    verifier,
    ...reviews,
    structuralDisposition: { status: 'accepted', reason: canonicalText(structuralRoot.reason, 'structural disposition reason') },
    unsupportedScope,
  };
  return deepFreeze(value);
}

export function validateAccessibilityPackage(raw: unknown): AccessibilityPackage {
  const root = exactRecord(raw, ['packageId', 'version', 'canonicalPathIdentity', 'coverage', 'edges', 'approvalReceipt'], 'accessibility package');
  const packageId = canonicalIdentifier(root.packageId, 'accessibility package');
  const version = canonicalIdentifier(root.version, 'accessibility package version');
  const canonicalPathIdentity = canonicalIdentifier(root.canonicalPathIdentity, 'canonical path');
  const coverage = validateCoverageRow(root.coverage);
  if (!Array.isArray(root.edges)) throw new Error('Accessibility package edges are required');
  const edges = root.edges.map(validateEdge);
  if (!edges.length) throw new Error('Accessibility package edges are required');
  if (new Set(edges.map((edge) => edge.id)).size !== edges.length) throw new Error('Duplicate path edge identity');
  const approvalReceipt = approval(root.approvalReceipt);
  const value: AccessibilityPackage = { packageId, version, canonicalPathIdentity, coverage, edges, approvalReceipt };
  if (version !== coverage.coverageRecordVersion) throw new Error('Path package and coverage must use the same version');
  if (coverage.completePathId !== value.canonicalPathIdentity) throw new Error('Coverage path identity does not match package identity');
  if (approvalReceipt.packageId !== packageId
    || approvalReceipt.packageVersion !== version
    || approvalReceipt.coverageRecordId !== coverage.coverageRecordId
    || approvalReceipt.coverageRecordVersion !== coverage.coverageRecordVersion
    || approvalReceipt.canonicalPathIdentity !== canonicalPathIdentity) {
    throw new Error('Approval receipt does not join to the exact path package, coverage row, version, and identity');
  }
  const latestReviewDate = Math.max(
    Date.parse(`${coverage.verificationDate}T00:00:00.000Z`),
    ...edges.map((edge) => Date.parse(`${edge.verificationDate}T00:00:00.000Z`)),
    ...[coverage.productDecision, coverage.accessibilityDecision, coverage.dataQualityDecision, coverage.contentDecision, coverage.operationsDecision]
      .map((decision) => Date.parse(`${decision.date}T00:00:00.000Z`)),
  );
  if (Date.parse(`${approvalReceipt.approvedOn}T00:00:00.000Z`) < latestReviewDate) {
    throw new Error('Approval receipt predates package verification or review evidence');
  }
  if (edges.length !== coverage.orderedEdgeIds.length || edges.some((edge, index) => edge.id !== coverage.orderedEdgeIds[index] || edge.order !== index + 1)) throw new Error('Ordered edge IDs do not match complete chain');
  for (const edge of edges) if (edge.canonicalPathIdentity !== value.canonicalPathIdentity || coverage.accessiblePathMembershipByEdge[edge.id] !== true) throw new Error('Path edge identity or official membership does not match coverage');
  validateCompleteJourney(coverage, edges);
  const edgeEquipmentIds = edges.flatMap((edge) => edge.equipmentId ? [edge.equipmentId] : []).sort();
  const coverageEquipmentIds = [...coverage.equipmentIds].sort();
  if (edgeEquipmentIds.length !== coverageEquipmentIds.length || edgeEquipmentIds.some((id,index) => id !== coverageEquipmentIds[index])) throw new Error('Official equipment identities do not join exactly between coverage and edges');
  return deepFreeze(value);
}

export function validateAccessibilityRegistry(raw: readonly unknown[]): readonly AccessibilityPackage[] {
  if (!Array.isArray(raw)) throw new Error('Accessibility registry must be an array');
  const values = raw.map(validateAccessibilityPackage);
  const identities = new Set<string>();
  const packages = new Set<string>();
  const coverageRows = new Set<string>();
  const receipts = new Set<string>();
  for (const value of values) {
    const identity = normalizeCanonicalIdentity(value.canonicalPathIdentity);
    if (identities.has(identity)) throw new Error(`Duplicate canonical path identity: ${identity}`);
    const packageIdentityVersion = `${value.packageId}\u0000${value.version}`;
    if (packages.has(packageIdentityVersion)) throw new Error('Duplicate accessibility package identity and version');
    if (coverageRows.has(value.coverage.coverageRecordId)) throw new Error('Duplicate accessibility coverage record identity');
    if (receipts.has(value.approvalReceipt.receiptId)) throw new Error('Duplicate accessibility approval receipt identity');
    identities.add(identity);
    packages.add(packageIdentityVersion);
    coverageRows.add(value.coverage.coverageRecordId);
    receipts.add(value.approvalReceipt.receiptId);
  }
  return deepFreeze(values);
}
export function orderAccessiblePaths(paths: readonly AccessibilityPackage[]): readonly AccessibilityPackage[] { return Object.freeze([...paths].sort((a,b) => compareCanonicalIdentity(a.canonicalPathIdentity,b.canonicalPathIdentity))); }

export function assessAccessiblePath(rawPackage: AccessibilityPackage, request: AccessiblePathAssessmentRequest): ResolvedAccessiblePathDecision {
  const item = validateAccessibilityPackage(rawPackage);
  const evaluatedAt = canonicalDate(request.decisionTime, 'path decision time');
  const expectedJourney = journeyIntentFor(item.coverage);
  const requestedJourney = parseJourneyIntent(request.journey);
  const originIntent = item.coverage.origin.stationComplex.name;
  const destinationIntent = item.coverage.destination.stationComplex.name;
  const dependencies: EquipmentStatusDecision[] = [];
  const acceptedExposure = exposureAllowsEvaluation(request.exposure, item.version, 'accessibility', request.decisionTime)
    ? request.exposure
    : undefined;
  const decide = (status: ResolvedAccessiblePathDecision['status'], reason: string, offlineCopy?: ResolvedAccessiblePathDecision['offlineCopy']) => resolvedPathDecision(
    item, request, originIntent, destinationIntent, dependencies, status, reason, evaluatedAt, acceptedExposure, offlineCopy,
  );
  if (!acceptedExposure) return decide('unknown', 'Accessibility exposure evidence is pending, expired, or does not match this immutable package.');
  if (!sameJson(expectedJourney, requestedJourney)) return decide('ineligible', 'No reviewed path package matches the exact complete origin-to-destination journey.');
  const missing = item.coverage.equipmentIds.filter((id) => !request.equipment[id]);
  if (missing.length) return decide('unknown', 'Live route-critical equipment evidence is missing.', 'Structurally step-free; live elevator status unavailable');
  for (const id of item.coverage.equipmentIds) {
    const equipment = request.equipment[id];
    if (!equipmentDecisionAllowsUse(equipment, request.decisionTime) || equipment.targetEquipmentId !== id
      || equipment.evidenceOwner !== 'official-equipment-status'
      || equipment.sourceScopeId !== request.equipmentSourceScopeId
      || equipment.sourceVersion !== request.equipmentSourceVersion) {
      return decide('unknown', `Current status evidence for required equipment ${id} has the wrong identity, owner, scope, or version.`);
    }
    dependencies.push(equipment);
    if (equipment.state === 'out-of-service' || equipment.state === 'planned-outage' || equipment.state === 'out-of-service-rechecking') return decide('ineligible', `Required equipment ${id} has accepted adverse evidence.`);
    if (equipment.health !== 'current' || equipment.state !== 'no-official-outage-reported') return decide('unknown', `Current status for required equipment ${id} is not verified.`);
  }
  return decide('eligible', 'Every structural edge and route-critical equipment decision passes for the exact path.');
}

export function isResolvedAccessiblePathDecision(value: unknown): value is ResolvedAccessiblePathDecision {
  return Boolean(value && typeof value === 'object' && resolvedAccessiblePathDecisions.has(value));
}

export function accessiblePathDecisionAllowsPresentation(value: unknown, surface: ExposureSurface, decisionTime: Date): value is ResolvedAccessiblePathDecision {
  return accessiblePathDecisionAllowsUse(value, decisionTime) && value.surface === surface;
}

export function accessiblePathDecisionAllowsUse(value: unknown, decisionTime: Date): value is ResolvedAccessiblePathDecision {
  const time = decisionTime instanceof Date ? decisionTime.getTime() : Number.NaN;
  const dependencies = value && typeof value === 'object' ? resolvedPathEquipmentDependencies.get(value) : undefined;
  return isResolvedAccessiblePathDecision(value) && Number.isFinite(time)
    && time >= Date.parse(value.validFrom) && time <= Date.parse(value.validThrough)
    && Boolean(dependencies)
    && dependencies!.every((decision) => equipmentDecisionAllowsUse(decision, decisionTime));
}

export function accessiblePathDecisionSupportsImpact(
  value: unknown,
  decisionTime: Date,
): value is ResolvedAccessiblePathDecision {
  const time = decisionTime instanceof Date ? decisionTime.getTime() : Number.NaN;
  const dependencies = value && typeof value === 'object' ? resolvedPathEquipmentDependencies.get(value) : undefined;
  return isResolvedAccessiblePathDecision(value) && Number.isFinite(time) && Boolean(dependencies)
    && value.status === 'eligible' && time >= Date.parse(value.evaluatedAt);
}

export function accessiblePathEquipmentDependenciesPostdate(
  value: unknown,
  adverseAssessment: Date,
): value is ResolvedAccessiblePathDecision {
  const cutoff = adverseAssessment instanceof Date ? adverseAssessment.getTime() : Number.NaN;
  const dependencies = value && typeof value === 'object' ? resolvedPathEquipmentDependencies.get(value) : undefined;
  return isResolvedAccessiblePathDecision(value) && Number.isFinite(cutoff) && Boolean(dependencies)
    && dependencies!.every((decision) => Date.parse(decision.assessedAt) > cutoff);
}

function resolvedPathDecision(
  item: AccessibilityPackage,
  request: AccessiblePathAssessmentRequest,
  originIntent: string,
  destinationIntent: string,
  equipmentDependencies: readonly EquipmentStatusDecision[],
  status: ResolvedAccessiblePathDecision['status'],
  reason: string,
  evaluatedAt: string,
  exposure?: ResolvedAccessibilityExposure,
  offlineCopy?: ResolvedAccessiblePathDecision['offlineCopy'],
): ResolvedAccessiblePathDecision {
  const firstRide = item.coverage.rideSegments[0];
  const journeyScope = journeyIntentFor(item.coverage);
  const validFromMs = Math.max(
    Date.parse(evaluatedAt),
    ...equipmentDependencies.map((dependency) => Date.parse(dependency.validFrom)),
    ...(exposure ? [Date.parse(exposure.validFrom)] : []),
  );
  const validThroughMs = Math.min(
    ...(exposure ? [Date.parse(exposure.validThrough)] : [Date.parse(evaluatedAt)]),
    ...equipmentDependencies.map((dependency) => Date.parse(dependency.validThrough)),
  );
  const equipmentDecisionIds = Object.fromEntries(equipmentDependencies.map((dependency) => [dependency.targetEquipmentId, dependency.decisionId]));
  const decision = deepFreeze({
    [accessiblePathDecisionBrand]: true as const,
    evaluationId: [item.packageId, item.version, status, evaluatedAt, originIntent, destinationIntent,
      exposure?.decisionId ?? 'locked', ...equipmentDependencies.map((dependency) => dependency.decisionId)].join('|'),
    pathId: item.canonicalPathIdentity,
    packageVersion: item.version,
    stationComplexId: item.coverage.origin.stationComplex.id,
    constituentStationId: item.coverage.origin.constituentStation.id,
    originIntent,
    destinationIntent,
    routeId: firstRide.routeId,
    direction: firstRide.direction,
    platformId: item.coverage.origin.platform.id,
    journeyScope,
    journeyChain: item.coverage.journeyChain.map((entry) => ({ ...entry })),
    equipmentIds: [...item.coverage.equipmentIds],
    equipmentDecisionIds,
    equipmentSourceScopeId: request.equipmentSourceScopeId,
    equipmentSourceVersion: request.equipmentSourceVersion,
    exposureDecisionId: exposure?.decisionId ?? null,
    exposureReleaseDecisionId: exposure?.releaseDecisionId ?? null,
    surface: exposure?.surface ?? ('locked' as const),
    evaluatedAt,
    validFrom: new Date(validFromMs).toISOString(),
    validThrough: new Date(validThroughMs).toISOString(),
    status,
    reason,
    accessibleRouteOnly: true as const,
    ...(offlineCopy ? { offlineCopy } : {}),
  });
  resolvedAccessiblePathDecisions.add(decision);
  resolvedPathEquipmentDependencies.set(decision, Object.freeze([...equipmentDependencies]));
  return decision;
}

function validateEdge(raw: unknown): AccessiblePathEdge {
  const root = exactRecord(raw, ['id','order','movementType','start','end','journeyScope','equipmentId','officialAccessiblePath','restrictions','verificationDate','evidenceReference','reviewDisposition','canonicalPathIdentity'], 'path edge');
  if (!Number.isInteger(root.order) || Number(root.order) < 1) throw new Error('Path edge order is invalid');
  const movementType = enumValue(root.movementType, MOVEMENT_TYPES, 'Path edge movement type is invalid');
  if (root.officialAccessiblePath !== true) throw new Error('Official accessible-path membership must be the boolean true');
  if (root.reviewDisposition !== 'approved') throw new Error('Path edge review disposition is not approved');
  const equipmentId = root.equipmentId === null ? null : canonicalIdentifier(root.equipmentId, 'path edge equipment');
  if (movementType === 'elevator' && equipmentId === null) throw new Error('Path edge equipmentId is required for an elevator');
  if (movementType !== 'elevator' && equipmentId !== null) throw new Error('Only elevator edges may name route-critical equipment');
  if (movementType === 'stairs' || movementType === 'escalator') throw new Error('Path edge is not wheelchair-accessible');
  const restrictions = canonicalStringArray(root.restrictions, 'path edge restrictions', canonicalText, true);
  if (restrictions.includes('staff-only')) throw new Error('Path edge evidence is not approved for rider use');
  const scopeRoot = exactRecord(root.journeyScope, ['kind','rideSegmentId','transferId','stationComplexId','constituentStationId','routeId','direction','platformId'], 'path edge journey scope');
  const kind = enumValue(scopeRoot.kind, ['origin-access','transfer-access','destination-access'] as const, 'Path edge journey scope kind is invalid');
  const value: AccessiblePathEdge = {
    id: canonicalIdentifier(root.id, 'path edge'),
    order: Number(root.order),
    movementType,
    start: journeyEndpoint(root.start, 'path edge start'),
    end: journeyEndpoint(root.end, 'path edge end'),
    journeyScope: {
      kind,
      rideSegmentId: canonicalIdentifier(scopeRoot.rideSegmentId, 'path edge ride segment'),
      transferId: scopeRoot.transferId === null ? null : canonicalIdentifier(scopeRoot.transferId, 'path edge transfer'),
      stationComplexId: canonicalIdentifier(scopeRoot.stationComplexId, 'path edge station complex'),
      constituentStationId: canonicalIdentifier(scopeRoot.constituentStationId, 'path edge constituent station'),
      routeId: canonicalIdentifier(scopeRoot.routeId, 'path edge route'),
      direction: direction(scopeRoot.direction, 'path edge direction'),
      platformId: canonicalIdentifier(scopeRoot.platformId, 'path edge platform'),
    },
    equipmentId,
    officialAccessiblePath: true,
    restrictions,
    verificationDate: canonicalDay(root.verificationDate, 'path edge verification date'),
    evidenceReference: canonicalText(root.evidenceReference, 'path edge evidence reference'),
    reviewDisposition: 'approved',
    canonicalPathIdentity: canonicalIdentifier(root.canonicalPathIdentity, 'path edge canonical path'),
  };
  if (value.start.id === value.end.id && value.start.level === value.end.level) throw new Error('Path edge endpoints must describe movement');
  return deepFreeze(value);
}

function originCoverage(raw: unknown): StationDirectionCoverageRow['origin'] {
  const root = exactRecord(raw, ['stationComplex','constituentStation','entrance','platform','orderedAccessEdgeIds','equipmentIds'], 'origin journey coverage');
  const entranceRoot = exactRecord(root.entrance, ['id','description','streetCorner','streetEndpoint'], 'origin entrance');
  const platformRoot = exactRecord(root.platform, ['id','boardingAreaId','endpoint'], 'origin platform');
  const stationComplex = namedIdentity(root.stationComplex, 'origin station complex');
  const constituentStation = namedIdentity(root.constituentStation, 'origin constituent station');
  const entrance = {
    id: canonicalIdentifier(entranceRoot.id, 'origin entrance'),
    description: canonicalText(entranceRoot.description, 'origin entrance description'),
    streetCorner: canonicalText(entranceRoot.streetCorner, 'origin street corner'),
    streetEndpoint: journeyEndpoint(entranceRoot.streetEndpoint, 'origin street endpoint'),
  };
  const platform = {
    id: canonicalIdentifier(platformRoot.id, 'origin platform'),
    boardingAreaId: canonicalIdentifier(platformRoot.boardingAreaId, 'origin boarding area'),
    endpoint: journeyEndpoint(platformRoot.endpoint, 'origin platform endpoint'),
  };
  if (!endpointAt(entrance.streetEndpoint, stationComplex.id, constituentStation.id, null, 'street')
    || !endpointAt(platform.endpoint, stationComplex.id, constituentStation.id, platform.id, 'platform')) {
    throw new Error('Origin endpoints do not join the exact station, entrance, and platform');
  }
  return deepFreeze({
    stationComplex, constituentStation, entrance, platform,
    orderedAccessEdgeIds: canonicalStringArray(root.orderedAccessEdgeIds, 'origin access edge identities', canonicalIdentifier, true),
    equipmentIds: canonicalStringArray(root.equipmentIds, 'origin equipment identities', canonicalIdentifier, false),
  });
}

function destinationCoverage(raw: unknown): StationDirectionCoverageRow['destination'] {
  const root = exactRecord(raw, ['stationComplex','constituentStation','platform','exit','orderedAccessEdgeIds','equipmentIds'], 'destination journey coverage');
  const platformRoot = exactRecord(root.platform, ['id','endpoint'], 'destination platform');
  const exitRoot = exactRecord(root.exit, ['id','description','streetCorner','streetEndpoint'], 'destination exit');
  const stationComplex = namedIdentity(root.stationComplex, 'destination station complex');
  const constituentStation = namedIdentity(root.constituentStation, 'destination constituent station');
  const platform = {
    id: canonicalIdentifier(platformRoot.id, 'destination platform'),
    endpoint: journeyEndpoint(platformRoot.endpoint, 'destination platform endpoint'),
  };
  const exit = {
    id: canonicalIdentifier(exitRoot.id, 'destination exit'),
    description: canonicalText(exitRoot.description, 'destination exit description'),
    streetCorner: canonicalText(exitRoot.streetCorner, 'destination street corner'),
    streetEndpoint: journeyEndpoint(exitRoot.streetEndpoint, 'destination street endpoint'),
  };
  if (!endpointAt(platform.endpoint, stationComplex.id, constituentStation.id, platform.id, 'platform')
    || !endpointAt(exit.streetEndpoint, stationComplex.id, constituentStation.id, null, 'street')) {
    throw new Error('Destination endpoints do not join the exact station, platform, and exit');
  }
  return deepFreeze({
    stationComplex, constituentStation, platform, exit,
    orderedAccessEdgeIds: canonicalStringArray(root.orderedAccessEdgeIds, 'destination access edge identities', canonicalIdentifier, true),
    equipmentIds: canonicalStringArray(root.equipmentIds, 'destination equipment identities', canonicalIdentifier, false),
  });
}

function rideSegment(raw: unknown): AccessibleRideSegment {
  const root = exactRecord(raw, ['id','routeId','direction','origin','destination'], 'ride segment');
  const originRoot = exactRecord(root.origin, ['stationComplexId','constituentStationId','platformId','boardingAreaId','endpoint'], 'ride origin');
  const destinationRoot = exactRecord(root.destination, ['stationComplexId','constituentStationId','platformId','endpoint'], 'ride destination');
  const origin = {
    stationComplexId: canonicalIdentifier(originRoot.stationComplexId, 'ride origin station complex'),
    constituentStationId: canonicalIdentifier(originRoot.constituentStationId, 'ride origin constituent station'),
    platformId: canonicalIdentifier(originRoot.platformId, 'ride origin platform'),
    boardingAreaId: canonicalIdentifier(originRoot.boardingAreaId, 'ride origin boarding area'),
    endpoint: journeyEndpoint(originRoot.endpoint, 'ride origin endpoint'),
  };
  const destination = {
    stationComplexId: canonicalIdentifier(destinationRoot.stationComplexId, 'ride destination station complex'),
    constituentStationId: canonicalIdentifier(destinationRoot.constituentStationId, 'ride destination constituent station'),
    platformId: canonicalIdentifier(destinationRoot.platformId, 'ride destination platform'),
    endpoint: journeyEndpoint(destinationRoot.endpoint, 'ride destination endpoint'),
  };
  if (!endpointAt(origin.endpoint, origin.stationComplexId, origin.constituentStationId, origin.platformId, 'platform')
    || !endpointAt(destination.endpoint, destination.stationComplexId, destination.constituentStationId, destination.platformId, 'platform')) {
    throw new Error('Ride segment endpoints do not join their exact station and platform scope');
  }
  return deepFreeze({
    id: canonicalIdentifier(root.id, 'ride segment'),
    routeId: canonicalIdentifier(root.routeId, 'ride route'),
    direction: direction(root.direction, 'ride direction'),
    origin,
    destination,
  });
}

function transfer(raw: unknown): AccessibleTransfer {
  const root = exactRecord(raw, ['id','incomingRideSegmentId','outgoingRideSegmentId','stationComplexId','incomingConstituentStationId','incomingPlatformId','outgoingConstituentStationId','outgoingPlatformId','orderedAccessEdgeIds','equipmentIds'], 'transfer scope');
  return deepFreeze({
    id: canonicalIdentifier(root.id, 'transfer'),
    incomingRideSegmentId: canonicalIdentifier(root.incomingRideSegmentId, 'incoming ride segment'),
    outgoingRideSegmentId: canonicalIdentifier(root.outgoingRideSegmentId, 'outgoing ride segment'),
    stationComplexId: canonicalIdentifier(root.stationComplexId, 'transfer station complex'),
    incomingConstituentStationId: canonicalIdentifier(root.incomingConstituentStationId, 'incoming constituent station'),
    incomingPlatformId: canonicalIdentifier(root.incomingPlatformId, 'incoming platform'),
    outgoingConstituentStationId: canonicalIdentifier(root.outgoingConstituentStationId, 'outgoing constituent station'),
    outgoingPlatformId: canonicalIdentifier(root.outgoingPlatformId, 'outgoing platform'),
    orderedAccessEdgeIds: canonicalStringArray(root.orderedAccessEdgeIds, 'transfer access edge identities', canonicalIdentifier, true),
    equipmentIds: canonicalStringArray(root.equipmentIds, 'transfer equipment identities', canonicalIdentifier, false),
  });
}

function journeyChainEntry(raw: unknown): AccessibleJourneyChainEntry {
  const base = asRecord(raw, 'journey chain entry');
  if (base.kind === 'access-edge') {
    const root = exactRecord(base, ['kind','edgeId'], 'journey chain access edge');
    return deepFreeze({ kind: 'access-edge' as const, edgeId: canonicalIdentifier(root.edgeId, 'journey chain edge') });
  }
  if (base.kind === 'ride') {
    const root = exactRecord(base, ['kind','rideSegmentId'], 'journey chain ride');
    return deepFreeze({ kind: 'ride' as const, rideSegmentId: canonicalIdentifier(root.rideSegmentId, 'journey chain ride segment') });
  }
  throw new Error('Journey chain entry kind is invalid');
}

function journeyEndpoint(raw: unknown, label: string): JourneyEndpoint {
  const root = exactRecord(raw, ['id','level','stationComplexId','constituentStationId','platformId'], label);
  return deepFreeze({
    id: canonicalIdentifier(root.id, label),
    level: canonicalText(root.level, `${label} level`),
    stationComplexId: canonicalIdentifier(root.stationComplexId, `${label} station complex`),
    constituentStationId: canonicalIdentifier(root.constituentStationId, `${label} constituent station`),
    platformId: root.platformId === null ? null : canonicalIdentifier(root.platformId, `${label} platform`),
  });
}

function validateCompleteJourney(coverage: StationDirectionCoverageRow, edges: readonly AccessiblePathEdge[]): void {
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const rideById = new Map(coverage.rideSegments.map((ride) => [ride.id, ride]));
  const transferById = new Map(coverage.transfers.map((item) => [item.id, item]));
  const expectedChain: AccessibleJourneyChainEntry[] = coverage.origin.orderedAccessEdgeIds.map((edgeId) => ({ kind: 'access-edge', edgeId }));
  for (let index = 0; index < coverage.orderedRideSegmentIds.length; index += 1) {
    expectedChain.push({ kind: 'ride', rideSegmentId: coverage.orderedRideSegmentIds[index] });
    if (index < coverage.orderedTransferIds.length) {
      const item = transferById.get(coverage.orderedTransferIds[index])!;
      expectedChain.push(...item.orderedAccessEdgeIds.map((edgeId) => ({ kind: 'access-edge' as const, edgeId })));
    }
  }
  expectedChain.push(...coverage.destination.orderedAccessEdgeIds.map((edgeId) => ({ kind: 'access-edge' as const, edgeId })));
  if (!sameJson(expectedChain, coverage.journeyChain)) throw new Error('Journey chain does not consume every edge, ride, and transfer exactly once in order');
  const chainEdgeIds = coverage.journeyChain.flatMap((entry) => entry.kind === 'access-edge' ? [entry.edgeId] : []);
  assertExactOrderedIdentitySet(chainEdgeIds, coverage.orderedEdgeIds, 'journey chain edge');
  let priorEnd: JourneyEndpoint | undefined;
  for (const entry of coverage.journeyChain) {
    const start = entry.kind === 'access-edge' ? edgeById.get(entry.edgeId)?.start : rideById.get(entry.rideSegmentId)?.origin.endpoint;
    const end = entry.kind === 'access-edge' ? edgeById.get(entry.edgeId)?.end : rideById.get(entry.rideSegmentId)?.destination.endpoint;
    if (!start || !end) throw new Error('Journey chain references an undeclared edge or ride segment');
    if (priorEnd && !sameEndpoint(priorEnd, start)) throw new Error('Journey endpoint chain is not continuous');
    priorEnd = end;
  }
  const firstEdge = edgeById.get(coverage.origin.orderedAccessEdgeIds[0]);
  const lastEdge = edgeById.get(coverage.destination.orderedAccessEdgeIds.at(-1)!);
  if (!firstEdge || !sameEndpoint(firstEdge.start, coverage.origin.entrance.streetEndpoint)) throw new Error('Journey must begin at the exact origin street endpoint');
  if (!lastEdge || !sameEndpoint(lastEdge.end, coverage.destination.exit.streetEndpoint)) throw new Error('Journey must end at the exact destination street endpoint');
  validateAccessScope(coverage.origin.orderedAccessEdgeIds, edges, coverage.origin.equipmentIds, {
    kind: 'origin-access', transferId: null, ride: coverage.rideSegments[0], stationComplexId: coverage.origin.stationComplex.id,
    constituentStationId: coverage.origin.constituentStation.id, platformId: coverage.origin.platform.id,
  });
  const lastRide = coverage.rideSegments.at(-1)!;
  validateAccessScope(coverage.destination.orderedAccessEdgeIds, edges, coverage.destination.equipmentIds, {
    kind: 'destination-access', transferId: null, ride: lastRide, stationComplexId: coverage.destination.stationComplex.id,
    constituentStationId: coverage.destination.constituentStation.id, platformId: coverage.destination.platform.id,
  });
  for (const item of coverage.transfers) {
    const incoming = rideById.get(item.incomingRideSegmentId)!;
    const outgoing = rideById.get(item.outgoingRideSegmentId)!;
    if (incoming.destination.stationComplexId !== item.stationComplexId || outgoing.origin.stationComplexId !== item.stationComplexId
      || incoming.destination.constituentStationId !== item.incomingConstituentStationId || incoming.destination.platformId !== item.incomingPlatformId
      || outgoing.origin.constituentStationId !== item.outgoingConstituentStationId || outgoing.origin.platformId !== item.outgoingPlatformId) {
      throw new Error('Transfer scope does not join its incoming and outgoing ride endpoints');
    }
    validateAccessScope(item.orderedAccessEdgeIds, edges, item.equipmentIds, {
      kind: 'transfer-access', transferId: item.id, ride: outgoing, stationComplexId: item.stationComplexId,
      constituentStationId: item.outgoingConstituentStationId, platformId: item.outgoingPlatformId,
    });
  }
}

function validateAccessScope(
  edgeIds: readonly string[], edges: readonly AccessiblePathEdge[], equipmentIds: readonly string[],
  expected: { readonly kind: AccessiblePathEdge['journeyScope']['kind']; readonly transferId: string | null; readonly ride: AccessibleRideSegment; readonly stationComplexId: string; readonly constituentStationId: string; readonly platformId: string },
): void {
  const byId = new Map(edges.map((edge) => [edge.id, edge]));
  const scopedEdges = edgeIds.map((id) => byId.get(id));
  if (scopedEdges.some((edge) => !edge)) throw new Error('Access scope references an undeclared edge');
  for (const edge of scopedEdges as AccessiblePathEdge[]) {
    const scope = edge.journeyScope;
    if (scope.kind !== expected.kind || scope.transferId !== expected.transferId || scope.rideSegmentId !== expected.ride.id
      || scope.stationComplexId !== expected.stationComplexId || scope.constituentStationId !== expected.constituentStationId
      || scope.routeId !== expected.ride.routeId || scope.direction !== expected.ride.direction || scope.platformId !== expected.platformId) {
      throw new Error('Access edge scope does not match its governed ride segment');
    }
  }
  const edgeEquipment = (scopedEdges as AccessiblePathEdge[]).flatMap((edge) => edge.equipmentId ? [edge.equipmentId] : []);
  assertExactIdentitySet(edgeEquipment, equipmentIds, `${expected.kind} equipment`);
}

function journeyIntentFor(coverage: StationDirectionCoverageRow): AccessibleJourneyIntent {
  return deepFreeze({
    origin: {
      stationComplexId: coverage.origin.stationComplex.id, constituentStationId: coverage.origin.constituentStation.id,
      entranceId: coverage.origin.entrance.id, streetEndpointId: coverage.origin.entrance.streetEndpoint.id,
      platformId: coverage.origin.platform.id, boardingAreaId: coverage.origin.platform.boardingAreaId,
    },
    destination: {
      stationComplexId: coverage.destination.stationComplex.id, constituentStationId: coverage.destination.constituentStation.id,
      platformId: coverage.destination.platform.id, exitId: coverage.destination.exit.id,
      streetEndpointId: coverage.destination.exit.streetEndpoint.id,
    },
    rideSegments: coverage.rideSegments.map((segment) => ({
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
    transferIds: [...coverage.orderedTransferIds],
  });
}

function parseJourneyIntent(raw: unknown): AccessibleJourneyIntent {
  const root = exactRecord(raw, ['origin','destination','rideSegments','transferIds'], 'accessible journey intent');
  const origin = exactRecord(root.origin, ['stationComplexId','constituentStationId','entranceId','streetEndpointId','platformId','boardingAreaId'], 'journey intent origin');
  const destination = exactRecord(root.destination, ['stationComplexId','constituentStationId','platformId','exitId','streetEndpointId'], 'journey intent destination');
  if (!Array.isArray(root.rideSegments) || root.rideSegments.length === 0) throw new Error('Journey intent ride segments must be a non-empty array');
  return deepFreeze({
    origin: mapIdentifiers(origin, ['stationComplexId','constituentStationId','entranceId','streetEndpointId','platformId','boardingAreaId']) as AccessibleJourneyIntent['origin'],
    destination: mapIdentifiers(destination, ['stationComplexId','constituentStationId','platformId','exitId','streetEndpointId']) as AccessibleJourneyIntent['destination'],
    rideSegments: root.rideSegments.map((rawRide) => {
      const ride = exactRecord(rawRide, ['id','routeId','direction','origin','destination'], 'journey intent ride');
      const rideOrigin = exactRecord(ride.origin, ['stationComplexId','constituentStationId','platformId','boardingAreaId','endpointId'], 'journey intent ride origin');
      const rideDestination = exactRecord(ride.destination, ['stationComplexId','constituentStationId','platformId','endpointId'], 'journey intent ride destination');
      return {
        id: canonicalIdentifier(ride.id, 'journey intent ride'), routeId: canonicalIdentifier(ride.routeId, 'journey intent route'), direction: direction(ride.direction, 'journey intent direction'),
        origin: mapIdentifiers(rideOrigin, ['stationComplexId','constituentStationId','platformId','boardingAreaId','endpointId']) as AccessibleJourneyIntent['rideSegments'][number]['origin'],
        destination: mapIdentifiers(rideDestination, ['stationComplexId','constituentStationId','platformId','endpointId']) as AccessibleJourneyIntent['rideSegments'][number]['destination'],
      };
    }),
    transferIds: canonicalStringArray(root.transferIds, 'journey intent transfers', canonicalIdentifier, false),
  });
}
function approval(raw: unknown): AccessibilityPackageApprovalReceipt {
  const root = exactRecord(raw, APPROVAL_FIELDS, 'accessibility package approval receipt');
  if (root.evidenceOwner !== 'app-owned-accessibility-path-approvals' || root.decision !== 'approved') {
    throw new Error('Accessibility package approval receipt owner or decision is invalid');
  }
  return deepFreeze({
    receiptId: canonicalIdentifier(root.receiptId, 'approval receipt'),
    evidenceOwner: 'app-owned-accessibility-path-approvals' as const,
    decision: 'approved' as const,
    packageId: canonicalIdentifier(root.packageId, 'approved package'),
    packageVersion: canonicalIdentifier(root.packageVersion, 'approved package version'),
    coverageRecordId: canonicalIdentifier(root.coverageRecordId, 'approved coverage record'),
    coverageRecordVersion: canonicalIdentifier(root.coverageRecordVersion, 'approved coverage version'),
    canonicalPathIdentity: canonicalIdentifier(root.canonicalPathIdentity, 'approved canonical path'),
    approvedOn: canonicalDay(root.approvedOn, 'approval receipt date'),
  });
}
function reviewDecision(raw: unknown, recordVersion: string, label: string): ReviewDecision {
  const root = exactRecord(raw, REVIEW_FIELDS, label);
  if (root.decision !== 'approve') throw new Error(`${label} must approve the immutable coverage row`);
  const parsed: ReviewDecision = {
    decision: 'approve',
    reviewer: canonicalText(root.reviewer, `${label} reviewer`),
    date: canonicalDay(root.date, `${label} date`),
    recordVersion: canonicalIdentifier(root.recordVersion, `${label} version`),
  };
  if (parsed.recordVersion !== recordVersion) throw new Error('Coverage reviews must approve the same immutable version');
  return parsed;
}
function namedIdentity(raw: unknown, label: string): { readonly id: string; readonly name: string } {
  const root = exactRecord(raw, ['id', 'name'], label);
  return { id: canonicalIdentifier(root.id, `${label} identity`), name: canonicalText(root.name, `${label} name`) };
}
function endpointAt(endpoint: JourneyEndpoint, stationComplexId: string, constituentStationId: string, platformId: string | null, level: string): boolean {
  return endpoint.stationComplexId === stationComplexId && endpoint.constituentStationId === constituentStationId
    && endpoint.platformId === platformId && endpoint.level === level;
}
function sameEndpoint(left: JourneyEndpoint, right: JourneyEndpoint): boolean {
  return left.id === right.id && left.level === right.level && left.stationComplexId === right.stationComplexId
    && left.constituentStationId === right.constituentStationId && left.platformId === right.platformId;
}
function assertExactOrderedIdentitySet(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} identities are duplicate, unused, or out of order`);
  }
}
function assertExactIdentitySet(actual: readonly string[], expected: readonly string[], label: string): void {
  const left = [...actual].sort(compareCanonicalIdentity);
  const right = [...expected].sort(compareCanonicalIdentity);
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) throw new Error(`${label} identities do not join exactly`);
}
function mapIdentifiers(record: Record<string, unknown>, fields: readonly string[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field, canonicalIdentifier(record[field], field)]));
}
function sameJson(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function direction(value: unknown, label: string): Direction {
  if (typeof value !== 'string' || !DIRECTIONS.includes(value as Direction)) throw new Error(`${label} is invalid`);
  return value as Direction;
}
function directionArray(value: unknown, label: string): readonly Direction[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const parsed = value.map((entry) => direction(entry, label));
  if (new Set(parsed).size !== parsed.length) throw new Error(`${label} contains a duplicate value`);
  return parsed;
}
function enumValue<T extends string>(value: unknown, allowed: readonly T[], error: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new Error(error);
  return value as T;
}
function canonicalStringArray(
  value: unknown,
  label: string,
  parse: (entry: unknown, label: string) => string,
  required: boolean,
): readonly string[] {
  if (!Array.isArray(value) || (required && value.length === 0)) throw new Error(`${label} must be a${required ? ' non-empty' : 'n'} array`);
  const parsed = value.map((entry) => parse(entry, label));
  if (new Set(parsed).size !== parsed.length) throw new Error(`${label} contains a duplicate value`);
  return parsed;
}
function canonicalIdentifier(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} identity is invalid`);
  const normalized = normalizeBoundedIdentity(value, label);
  if (normalized !== value || ['__proto__', 'prototype', 'constructor'].includes(value)) throw new Error(`${label} identity is not canonical`);
  return value;
}
function canonicalText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() !== value || !value || [...value].length > 500 || /\p{C}/u.test(value)) throw new Error(`${label} is invalid`);
  if (normalizeCanonicalIdentity(value) !== value) throw new Error(`${label} is not canonical`);
  return value;
}
function canonicalDay(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be a canonical YYYY-MM-DD date`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} must be a real canonical YYYY-MM-DD date`);
  return value;
}
function asRecord(value: unknown, name: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`); return value as Record<string, unknown>; }
function intent(value: unknown, name: string): string { if (typeof value !== 'string' || value.trim() !== value || !value || value.length > 240) throw new Error(`${name} is invalid`); return value; }
function exactRecord(value: unknown, fields: readonly string[], name: string): Record<string, unknown> {
  const record = asRecord(value, name);
  const missing = fields.filter((field) => !Object.prototype.hasOwnProperty.call(record, field));
  const ownKeys = Reflect.ownKeys(record);
  const unexpected = ownKeys.filter((field) => typeof field !== 'string' || !fields.includes(field)).map(String);
  if (missing.length || unexpected.length) throw new Error(`${name} must contain its exact schema; missing: ${missing.join(',') || 'none'}; unexpected: ${unexpected.join(',') || 'none'}`);
  return record;
}
function canonicalDate(value: Date, label: string): string { if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`${label} is invalid`); return value.toISOString(); }
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); } return value; }
