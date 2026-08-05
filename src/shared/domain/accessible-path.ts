import { compareCanonicalIdentity, normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import { equipmentDecisionAllowsUse, type EquipmentStatusDecision } from './equipment-status';
import type { Direction } from './types';
import { exposureAllowsEvaluation, type ResolvedAccessibilityExposure } from './exposure-decision';
import type { ExposureSurface } from './exposure-decision';

interface ReviewDecision { readonly decision: 'approve' | 'changes-required'; readonly reviewer: string; readonly date: string; readonly recordVersion: string }
export interface StationDirectionCoverageRow {
  readonly coverageRecordId: string; readonly coverageRecordVersion: string;
  readonly stationComplex: { readonly id: string; readonly name: string }; readonly constituentStation: { readonly id: string; readonly name: string };
  readonly routeOrLine: string; readonly normalizedDirection: Direction;
  readonly accessibleStreetEntrance: { readonly id: string; readonly description: string }; readonly streetCorner: string;
  readonly directionalPlatform: string; readonly boardingArea: string; readonly completePathId: string; readonly orderedEdgeIds: readonly string[];
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
  readonly start: { readonly id: string; readonly level: string }; readonly end: { readonly id: string; readonly level: string };
  readonly routeId: string; readonly direction: Direction; readonly platformId: string; readonly equipmentId: string | null;
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
  readonly stationId: string;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly platformId: string;
  readonly equipmentSourceScopeId: string;
  readonly equipmentSourceVersion: string;
  readonly equipment: Readonly<Record<string, EquipmentStatusDecision>>;
  readonly exposure?: ResolvedAccessibilityExposure;
  readonly decisionTime: Date;
}

const COVERAGE_FIELDS = ['coverageRecordId','coverageRecordVersion','stationComplex','constituentStation','routeOrLine','normalizedDirection','accessibleStreetEntrance','streetCorner','directionalPlatform','boardingArea','completePathId','orderedEdgeIds','equipmentIds','accessiblePathMembershipByEdge','operatingRestrictions','evidenceSources','evidenceReferences','verificationDate','verifier','productDecision','accessibilityDecision','dataQualityDecision','contentDecision','operationsDecision','structuralDisposition','unsupportedScope'] as const;
const EDGE_EVIDENCE_FIELDS = ['movementType','start','routeId','direction','equipmentId','officialAccessiblePath','restrictions','verificationDate'] as const;
const DIRECTIONS: readonly Direction[] = ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'];
const MOVEMENT_TYPES: readonly AccessiblePathEdge['movementType'][] = ['elevator', 'compliant-ramp', 'level-path', 'stairs', 'escalator'];
const REVIEW_FIELDS = ['decision', 'reviewer', 'date', 'recordVersion'] as const;
const APPROVAL_FIELDS = ['receiptId', 'evidenceOwner', 'decision', 'packageId', 'packageVersion', 'coverageRecordId', 'coverageRecordVersion', 'canonicalPathIdentity', 'approvedOn'] as const;

export function validateCoverageRow(raw: unknown): StationDirectionCoverageRow {
  const root = exactRecord(raw, COVERAGE_FIELDS, '26-field station-direction coverage row');
  const coverageRecordId = canonicalIdentifier(root.coverageRecordId, 'coverage record');
  const coverageRecordVersion = canonicalIdentifier(root.coverageRecordVersion, 'coverage record version');
  const stationComplex = namedIdentity(root.stationComplex, 'station complex');
  const constituentStation = namedIdentity(root.constituentStation, 'constituent station');
  const entranceRoot = exactRecord(root.accessibleStreetEntrance, ['id', 'description'], 'accessible street entrance');
  const accessibleStreetEntrance = {
    id: canonicalIdentifier(entranceRoot.id, 'accessible entrance'),
    description: canonicalText(entranceRoot.description, 'accessible entrance description'),
  };
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
  const normalizedDirection = direction(root.normalizedDirection, 'coverage direction');
  const routeOrLine = canonicalIdentifier(root.routeOrLine, 'coverage route');
  const directionalPlatform = canonicalIdentifier(root.directionalPlatform, 'directional platform');
  const completePathId = canonicalIdentifier(root.completePathId, 'complete path');
  if (unsupportedScope.lines.includes(routeOrLine)
    || unsupportedScope.directions.includes(normalizedDirection)
    || unsupportedScope.entrances.includes(accessibleStreetEntrance.id)
    || unsupportedScope.platforms.includes(directionalPlatform)
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
    stationComplex,
    constituentStation,
    routeOrLine,
    normalizedDirection,
    accessibleStreetEntrance,
    streetCorner: canonicalText(root.streetCorner, 'street corner'),
    directionalPlatform,
    boardingArea: canonicalIdentifier(root.boardingArea, 'boarding area'),
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
  const edges = root.edges.map(validateEdge).sort((a, b) => a.order - b.order);
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
  for (let index = 1; index < edges.length; index += 1) if (edges[index - 1].end.id !== edges[index].start.id || edges[index - 1].end.level !== edges[index].start.level) throw new Error('Ordered path edge endpoints are discontinuous');
  for (const edge of edges) {
    if (edge.routeId !== coverage.routeOrLine || edge.direction !== coverage.normalizedDirection || edge.platformId !== coverage.directionalPlatform) throw new Error('Path edge route, direction, or platform scope does not match coverage');
    if (edge.canonicalPathIdentity !== value.canonicalPathIdentity || coverage.accessiblePathMembershipByEdge[edge.id] !== true) throw new Error('Path edge identity or official membership does not match coverage');
  }
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
  const originIntent = intent(request.originIntent, 'path origin intent');
  const destinationIntent = intent(request.destinationIntent, 'path destination intent');
  const dependencies: EquipmentStatusDecision[] = [];
  const acceptedExposure = exposureAllowsEvaluation(request.exposure, item.version, 'accessibility', request.decisionTime)
    ? request.exposure
    : undefined;
  const decide = (status: ResolvedAccessiblePathDecision['status'], reason: string, offlineCopy?: ResolvedAccessiblePathDecision['offlineCopy']) => resolvedPathDecision(
    item, request, originIntent, destinationIntent, dependencies, status, reason, evaluatedAt, acceptedExposure, offlineCopy,
  );
  if (!acceptedExposure) return decide('unknown', 'Accessibility exposure evidence is pending, expired, or does not match this immutable package.');
  if (item.coverage.constituentStation.id !== request.stationId || item.coverage.routeOrLine !== request.routeId || item.coverage.normalizedDirection !== request.direction || item.coverage.directionalPlatform !== request.platformId) return decide('ineligible', 'No reviewed path package matches the exact station, route, direction, and platform.');
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
    if (equipment.state === 'out-of-service' || equipment.state === 'out-of-service-rechecking') return decide('ineligible', `Required equipment ${id} has accepted adverse evidence.`);
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
    stationComplexId: item.coverage.stationComplex.id,
    constituentStationId: item.coverage.constituentStation.id,
    originIntent,
    destinationIntent,
    routeId: item.coverage.routeOrLine,
    direction: item.coverage.normalizedDirection,
    platformId: item.coverage.directionalPlatform,
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
  const root = exactRecord(raw, ['id','order',...EDGE_EVIDENCE_FIELDS,'end','platformId','evidenceReference','reviewDisposition','canonicalPathIdentity'], 'path edge');
  const startRoot = exactRecord(root.start, ['id', 'level'], 'path edge start');
  const endRoot = exactRecord(root.end, ['id', 'level'], 'path edge end');
  if (!Number.isInteger(root.order) || Number(root.order) < 1) throw new Error('Path edge order is invalid');
  const movementType = enumValue(root.movementType, MOVEMENT_TYPES, 'Path edge movement type is invalid');
  const edgeDirection = direction(root.direction, 'edge direction');
  if (root.officialAccessiblePath !== true) throw new Error('Official accessible-path membership must be the boolean true');
  if (root.reviewDisposition !== 'approved') throw new Error('Path edge review disposition is not approved');
  const equipmentId = root.equipmentId === null ? null : canonicalIdentifier(root.equipmentId, 'path edge equipment');
  if (movementType === 'elevator' && equipmentId === null) throw new Error('Path edge equipmentId is required for an elevator');
  if (movementType !== 'elevator' && equipmentId !== null) throw new Error('Only elevator edges may name route-critical equipment');
  if (movementType === 'stairs' || movementType === 'escalator') throw new Error('Path edge is not wheelchair-accessible');
  const restrictions = canonicalStringArray(root.restrictions, 'path edge restrictions', canonicalText, true);
  if (restrictions.includes('staff-only')) throw new Error('Path edge evidence is not approved for rider use');
  const value: AccessiblePathEdge = {
    id: canonicalIdentifier(root.id, 'path edge'),
    order: Number(root.order),
    movementType,
    start: { id: canonicalIdentifier(startRoot.id, 'path edge start'), level: canonicalText(startRoot.level, 'path edge start level') },
    end: { id: canonicalIdentifier(endRoot.id, 'path edge end'), level: canonicalText(endRoot.level, 'path edge end level') },
    routeId: canonicalIdentifier(root.routeId, 'path edge route'),
    direction: edgeDirection,
    platformId: canonicalIdentifier(root.platformId, 'path edge platform'),
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
  const unexpected = Object.keys(record).filter((field) => !fields.includes(field));
  if (missing.length || unexpected.length) throw new Error(`${name} must contain its exact schema; missing: ${missing.join(',') || 'none'}; unexpected: ${unexpected.join(',') || 'none'}`);
  return record;
}
function canonicalDate(value: Date, label: string): string { if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`${label} is invalid`); return value.toISOString(); }
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); } return value; }
