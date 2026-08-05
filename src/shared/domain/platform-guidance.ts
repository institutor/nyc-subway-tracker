import { exposureAllowsEvaluation, type ResolvedGuidanceExposure } from './exposure-decision';
import type { ExposureSurface } from './exposure-decision';
import { normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import type { Direction } from './types';
export type PlatformGuidancePosition = 'front' | 'middle' | 'back';
export type PlatformGuidanceDirection = Exclude<Direction, 'unknown'>;
export type PlatformGuidanceObjectiveType = 'accessible-exit' | 'accessible-transfer' | 'accessible-boarding-area';
export type PlatformGuidanceReviewRole = 'product' | 'accessibility' | 'data-quality' | 'content' | 'operations';
export interface PlatformGuidancePlace { readonly id: string; readonly name: string }
export interface PlatformGuidanceReviewDecision {
  readonly reviewId: string; readonly parentCoverageRowId: string; readonly parentRecordVersion: string;
  readonly role: PlatformGuidanceReviewRole; readonly decision: 'approve' | 'changes-required';
  readonly reviewer: string; readonly reviewedOn: string;
}
export interface PlatformGuidanceSupportedScope {
  readonly complex: PlatformGuidancePlace; readonly constituent: PlatformGuidancePlace;
  readonly route: string; readonly servicePattern: string; readonly direction: PlatformGuidanceDirection;
  readonly destination: string; readonly platformId: string; readonly layoutOrientation: string;
  readonly objectiveType: PlatformGuidanceObjectiveType; readonly objectiveTarget: string;
  readonly accessiblePathVersion: string; readonly position: PlatformGuidancePosition;
}
export interface PlatformGuidanceUnsupportedScope {
  readonly complexIds: readonly string[]; readonly constituentIds: readonly string[]; readonly routes: readonly string[];
  readonly servicePatterns: readonly string[]; readonly directions: readonly PlatformGuidanceDirection[];
  readonly destinations: readonly string[]; readonly platformIds: readonly string[]; readonly layoutOrientations: readonly string[];
  readonly objectiveTypes: readonly PlatformGuidanceObjectiveType[]; readonly objectiveTargets: readonly string[];
  readonly accessiblePathVersions: readonly string[]; readonly positions: readonly PlatformGuidancePosition[];
  readonly conditions: readonly ('rerouted')[];
}
export interface PlatformGuidanceReleasePackage {
  readonly packageVersion: string; readonly decisionId: string; readonly parentCoverageRowId: string;
  readonly parentRecordVersion: string; readonly inclusion: 'included' | 'excluded'; readonly scope: 'exact-scope';
  readonly reason: string; readonly decidedOn: string;
}
export interface PlatformGuidanceProvenance {
  readonly sourceId: string; readonly version: string; readonly immutable: true; readonly reviewed: true;
  readonly parentCoverageRowId: string; readonly parentRecordVersion: string; readonly packageVersion: string;
  readonly acceptedOn: string;
}
export interface PlatformGuidanceRecord {
  readonly coverageRowId: string; readonly immutableVersion: string; readonly supersededVersion: string | null;
  readonly complex: PlatformGuidancePlace; readonly constituent: PlatformGuidancePlace;
  readonly priorityCategory: 'accessible-objective';
  readonly categoryEvidence: { readonly sourceId: string; readonly reviewedOn: string; readonly status: 'reviewed'; readonly parentCoverageRowId: string; readonly parentRecordVersion: string };
  readonly route: string; readonly servicePattern: string; readonly direction: PlatformGuidanceDirection; readonly destination: string;
  readonly platformId: string; readonly layoutOrientation: string; readonly frontRearOrder: string; readonly zoneGeometry: string;
  readonly objectiveType: PlatformGuidanceObjectiveType; readonly objectiveTarget: string; readonly physicalRelationships: string;
  readonly zoneBenefit: { readonly position: PlatformGuidancePosition; readonly copy: string };
  readonly certaintyCeiling: 'verified' | 'limited' | 'unknown'; readonly accessiblePathVersion: string;
  readonly restrictions: readonly string[]; readonly supportedScope: PlatformGuidanceSupportedScope;
  readonly unsupportedScope: PlatformGuidanceUnsupportedScope; readonly task7RecordVersion: string;
  readonly durableFieldEvidence: string; readonly verificationDate: string;
  readonly verifier: { readonly name: string; readonly role: string }; readonly reverificationTriggers: readonly string[];
  readonly reverificationStatus: { readonly status: 'current' | 'reverification-required'; readonly decidedOn: string; readonly parentCoverageRowId: string; readonly parentRecordVersion: string };
  readonly feedbackCorrections: readonly string[]; readonly productDecision: PlatformGuidanceReviewDecision;
  readonly accessibilityDecision: PlatformGuidanceReviewDecision; readonly dataQualityDecision: PlatformGuidanceReviewDecision;
  readonly contentDecision: PlatformGuidanceReviewDecision; readonly operationsDecision: PlatformGuidanceReviewDecision;
  readonly disposition: { readonly status: 'eligible-for-runtime-evaluation' | 'pending' | 'ineligible'; readonly decidedOn: string; readonly parentCoverageRowId: string; readonly parentRecordVersion: string };
  readonly releasePackage: PlatformGuidanceReleasePackage; readonly position: PlatformGuidancePosition;
  readonly provenance: PlatformGuidanceProvenance;
}
const platformGuidanceBrand: unique symbol = Symbol('resolved-platform-guidance');
export type ResolvedPlatformGuidance = PlatformGuidanceRecord & {
  readonly [platformGuidanceBrand]: true;
  readonly exposureDecisionId: string;
  readonly releaseDecisionId: string;
  readonly surface: ExposureSurface;
  readonly evaluatedAt: string;
  readonly validFrom: string;
  readonly validThrough: string;
};
const resolvedPlatformGuidance = new WeakSet<object>();
export interface PlatformGuidanceRequest { readonly complex:PlatformGuidancePlace; readonly constituent:PlatformGuidancePlace; readonly route:string; readonly servicePattern:string; readonly direction:PlatformGuidanceDirection; readonly destination:string; readonly platformId:string; readonly orientation:string; readonly objectiveType:PlatformGuidanceObjectiveType; readonly objectiveTarget:string; readonly accessiblePathVersion:string; readonly now:Date; readonly platformState:'confirmed'|'expected'|'check-signs'; readonly rerouted:boolean; readonly exposure?:ResolvedGuidanceExposure }
const FIELDS = ['coverageRowId','immutableVersion','supersededVersion','complex','constituent','priorityCategory','categoryEvidence','route','servicePattern','direction','destination','platformId','layoutOrientation','frontRearOrder','zoneGeometry','objectiveType','objectiveTarget','physicalRelationships','zoneBenefit','certaintyCeiling','accessiblePathVersion','restrictions','supportedScope','unsupportedScope','task7RecordVersion','durableFieldEvidence','verificationDate','verifier','reverificationTriggers','reverificationStatus','feedbackCorrections','productDecision','accessibilityDecision','dataQualityDecision','contentDecision','operationsDecision','disposition','releasePackage','position','provenance'] as const;
const REQUEST_FIELDS = ['complex','constituent','route','servicePattern','direction','destination','platformId','orientation','objectiveType','objectiveTarget','accessiblePathVersion','now','platformState','rerouted','exposure'] as const;
const DIRECTIONS: readonly PlatformGuidanceDirection[] = ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'];
const POSITIONS: readonly PlatformGuidancePosition[] = ['front', 'middle', 'back'];
const OBJECTIVE_TYPES: readonly PlatformGuidanceObjectiveType[] = ['accessible-exit', 'accessible-transfer', 'accessible-boarding-area'];
const REVIEW_ROLES: readonly PlatformGuidanceReviewRole[] = ['product', 'accessibility', 'data-quality', 'content', 'operations'];
const REVIEW_FIELDS = ['reviewId','parentCoverageRowId','parentRecordVersion','role','decision','reviewer','reviewedOn'] as const;
const PARENT_STATUS_FIELDS = ['status','decidedOn','parentCoverageRowId','parentRecordVersion'] as const;
const SUPPORTED_SCOPE_FIELDS = ['complex','constituent','route','servicePattern','direction','destination','platformId','layoutOrientation','objectiveType','objectiveTarget','accessiblePathVersion','position'] as const;
const UNSUPPORTED_SCOPE_FIELDS = ['complexIds','constituentIds','routes','servicePatterns','directions','destinations','platformIds','layoutOrientations','objectiveTypes','objectiveTargets','accessiblePathVersions','positions','conditions'] as const;

export function validatePlatformGuidanceRegistry(raw: readonly unknown[]): readonly PlatformGuidanceRecord[] {
  if (!Array.isArray(raw)) throw new Error('Platform guidance registry must be an array');
  const coverageIds = new Set<string>();
  const reviewIds = new Set<string>();
  const releaseIds = new Set<string>();
  const records = raw.map(reconstructPlatformGuidanceRecord);
  for (const record of records) {
    if (coverageIds.has(record.coverageRowId)) throw new Error('Duplicate platform guidance coverage row identity');
    coverageIds.add(record.coverageRowId);
    for (const review of guidanceReviews(record)) {
      if (reviewIds.has(review.reviewId)) throw new Error('Duplicate platform guidance review identity');
      reviewIds.add(review.reviewId);
    }
    if (releaseIds.has(record.releasePackage.decisionId)) throw new Error('Duplicate platform guidance release decision identity');
    releaseIds.add(record.releasePackage.decisionId);
  }
  return deepFreeze(records);
}

export function resolvePlatformGuidance(raw: readonly unknown[], request: PlatformGuidanceRequest): ResolvedPlatformGuidance | undefined {
  const acceptedRequest = reconstructRequest(request);
  if (!acceptedRequest || acceptedRequest.rerouted || acceptedRequest.platformState !== 'confirmed' || !acceptedRequest.exposure) return undefined;
  let registry: readonly PlatformGuidanceRecord[];
  try {
    registry = validatePlatformGuidanceRegistry(raw);
  } catch {
    return undefined;
  }
  const record = registry.find((candidate) => {
    const release = candidate.releasePackage;
    const releaseDecisionAllowed = acceptedRequest.exposure?.releaseDecisionId === release.decisionId
      && (acceptedRequest.exposure.surface === 'validation' || acceptedRequest.exposure.releaseStatus === 'approved');
    return exposureAllowsEvaluation(acceptedRequest.exposure, release.packageVersion, 'guidance', acceptedRequest.now)
      && release.inclusion === 'included'
      && release.scope === 'exact-scope'
      && releaseDecisionAllowed
      && candidate.certaintyCeiling === 'verified'
      && candidate.reverificationStatus.status === 'current'
      && candidate.disposition.status === 'eligible-for-runtime-evaluation'
      && guidanceReviews(candidate).every((review) => review.decision === 'approve')
      && dayMs(candidate.provenance.acceptedOn) <= acceptedRequest.now.getTime()
      && samePlace(candidate.complex, acceptedRequest.complex)
      && samePlace(candidate.constituent, acceptedRequest.constituent)
      && candidate.route === acceptedRequest.route
      && candidate.servicePattern === acceptedRequest.servicePattern
      && candidate.direction === acceptedRequest.direction
      && candidate.destination === acceptedRequest.destination
      && candidate.platformId === acceptedRequest.platformId
      && candidate.layoutOrientation === acceptedRequest.orientation
      && candidate.objectiveType === acceptedRequest.objectiveType
      && candidate.objectiveTarget === acceptedRequest.objectiveTarget
      && candidate.accessiblePathVersion === acceptedRequest.accessiblePathVersion;
  });
  if (!record) return undefined;
  const resolved = deepFreeze({
    ...record,
    [platformGuidanceBrand]: true as const,
    exposureDecisionId: acceptedRequest.exposure.decisionId,
    releaseDecisionId: acceptedRequest.exposure.releaseDecisionId,
    surface: acceptedRequest.exposure.surface,
    evaluatedAt: acceptedRequest.now.toISOString(),
    validFrom: acceptedRequest.exposure.validFrom,
    validThrough: acceptedRequest.exposure.validThrough,
  });
  resolvedPlatformGuidance.add(resolved);
  return resolved;
}

export function isResolvedPlatformGuidance(value: unknown): value is ResolvedPlatformGuidance {
  return Boolean(value && typeof value === 'object' && resolvedPlatformGuidance.has(value));
}

export function platformGuidanceAllowsPresentation(
  value: unknown,
  surface: ExposureSurface,
  decisionTime: Date,
): value is ResolvedPlatformGuidance {
  const time = decisionTime instanceof Date ? decisionTime.getTime() : Number.NaN;
  return isResolvedPlatformGuidance(value) && value.surface === surface && Number.isFinite(time)
    && time >= Date.parse(value.validFrom) && time <= Date.parse(value.validThrough);
}

function reconstructPlatformGuidanceRecord(value: unknown): PlatformGuidanceRecord {
  const root = strictRecord(value, FIELDS, 'platform guidance record');
  const coverageRowId = canonicalIdentifier(root.coverageRowId, 'platform guidance coverage row');
  const immutableVersion = canonicalIdentifier(root.immutableVersion, 'platform guidance record version');
  const supersededVersion = root.supersededVersion === null
    ? null
    : canonicalIdentifier(root.supersededVersion, 'superseded platform guidance version');
  if (supersededVersion === immutableVersion) throw new Error('Platform guidance cannot supersede its own immutable version');
  const complex = place(root.complex, 'platform guidance complex');
  const constituent = place(root.constituent, 'platform guidance constituent');
  if (root.priorityCategory !== 'accessible-objective') throw new Error('Platform guidance priority category is invalid');
  const categoryEvidence = categoryEvidenceReceipt(root.categoryEvidence, coverageRowId, immutableVersion);
  const route = canonicalIdentifier(root.route, 'platform guidance route');
  const servicePattern = canonicalIdentifier(root.servicePattern, 'platform guidance service pattern');
  const direction = enumeration(root.direction, DIRECTIONS, 'platform guidance direction');
  const destination = canonicalText(root.destination, 'platform guidance destination');
  const platformId = canonicalIdentifier(root.platformId, 'platform guidance platform');
  const layoutOrientation = canonicalText(root.layoutOrientation, 'platform layout orientation');
  const frontRearOrder = canonicalText(root.frontRearOrder, 'platform front/rear order');
  const position = enumeration(root.position, POSITIONS, 'platform guidance position');
  const expectedOrientation = `${direction} travel axis`;
  const expectedOrder = `front-to-back ${directionAxis(direction)}`;
  if (layoutOrientation !== expectedOrientation || frontRearOrder !== expectedOrder) {
    throw new Error('Platform front/rear order and layout orientation contradict the exact direction');
  }
  const zoneGeometry = canonicalText(root.zoneGeometry, 'platform zone geometry');
  if (!zoneGeometry.startsWith(`${position} zone `)) throw new Error('Platform zone geometry contradicts the selected position');
  const objectiveType = enumeration(root.objectiveType, OBJECTIVE_TYPES, 'platform guidance objective type');
  const objectiveTarget = canonicalIdentifier(root.objectiveTarget, 'platform guidance objective target');
  const physicalRelationships = canonicalText(root.physicalRelationships, 'platform physical relationships');
  const zoneBenefit = zoneBenefitReceipt(root.zoneBenefit);
  if (zoneBenefit.position !== position) throw new Error('Platform zone benefit contradicts the selected position');
  const certaintyCeiling = enumeration(root.certaintyCeiling, ['verified', 'limited', 'unknown'] as const, 'platform guidance certainty ceiling');
  const accessiblePathVersion = canonicalIdentifier(root.accessiblePathVersion, 'platform guidance accessible-path version');
  const restrictions = stringArray(root.restrictions, 'platform guidance restrictions', canonicalText, true);
  const supportedScope = supportedScopeReceipt(root.supportedScope);
  const unsupportedScope = unsupportedScopeReceipt(root.unsupportedScope);
  const task7RecordVersion = canonicalIdentifier(root.task7RecordVersion, 'Task 7 guidance record version');
  const durableFieldEvidence = canonicalText(root.durableFieldEvidence, 'durable platform guidance evidence');
  const verificationDate = canonicalDay(root.verificationDate, 'platform guidance verification date');
  const verifierRoot = strictRecord(root.verifier, ['name', 'role'], 'platform guidance verifier');
  const verifier = { name: canonicalText(verifierRoot.name, 'platform guidance verifier name'), role: canonicalText(verifierRoot.role, 'platform guidance verifier role') };
  const reverificationTriggers = stringArray(root.reverificationTriggers, 'platform guidance reverification triggers', canonicalText, false);
  const reverificationStatus = parentStatusReceipt(root.reverificationStatus, coverageRowId, immutableVersion, ['current', 'reverification-required'] as const, 'reverification status');
  const feedbackCorrections = stringArray(root.feedbackCorrections, 'platform guidance feedback corrections', canonicalText, false);
  const productDecision = reviewReceipt(root.productDecision, coverageRowId, immutableVersion, 'product');
  const accessibilityDecision = reviewReceipt(root.accessibilityDecision, coverageRowId, immutableVersion, 'accessibility');
  const dataQualityDecision = reviewReceipt(root.dataQualityDecision, coverageRowId, immutableVersion, 'data-quality');
  const contentDecision = reviewReceipt(root.contentDecision, coverageRowId, immutableVersion, 'content');
  const operationsDecision = reviewReceipt(root.operationsDecision, coverageRowId, immutableVersion, 'operations');
  const disposition = parentStatusReceipt(root.disposition, coverageRowId, immutableVersion, ['eligible-for-runtime-evaluation', 'pending', 'ineligible'] as const, 'runtime disposition');
  const releasePackage = releaseReceipt(root.releasePackage, coverageRowId, immutableVersion);
  const provenance = provenanceReceipt(root.provenance, coverageRowId, immutableVersion, releasePackage.packageVersion);

  const reconstructed: PlatformGuidanceRecord = {
    coverageRowId, immutableVersion, supersededVersion, complex, constituent, priorityCategory: 'accessible-objective',
    categoryEvidence, route, servicePattern, direction, destination, platformId, layoutOrientation, frontRearOrder,
    zoneGeometry, objectiveType, objectiveTarget, physicalRelationships, zoneBenefit, certaintyCeiling,
    accessiblePathVersion, restrictions, supportedScope, unsupportedScope, task7RecordVersion, durableFieldEvidence,
    verificationDate, verifier, reverificationTriggers, reverificationStatus, feedbackCorrections,
    productDecision, accessibilityDecision, dataQualityDecision, contentDecision, operationsDecision,
    disposition, releasePackage, position, provenance,
  };
  if (!scopeMatchesRecord(supportedScope, reconstructed)) throw new Error('Platform guidance supported scope does not match the exact record tuple');
  if (unsupportedContradictsRecord(unsupportedScope, reconstructed)) throw new Error('Platform guidance unsupported scope contains a supported fact');
  const latestGovernanceInput = Math.max(
    dayMs(verificationDate), dayMs(categoryEvidence.reviewedOn), dayMs(reverificationStatus.decidedOn), dayMs(disposition.decidedOn),
    ...guidanceReviews(reconstructed).map((review) => dayMs(review.reviewedOn)),
  );
  if (dayMs(releasePackage.decidedOn) < latestGovernanceInput) throw new Error('Platform guidance release approval predates review or decision evidence');
  if (dayMs(provenance.acceptedOn) < dayMs(releasePackage.decidedOn)) throw new Error('Platform guidance provenance predates the release approval');
  return deepFreeze(reconstructed);
}

function reconstructRequest(value: unknown): PlatformGuidanceRequest | undefined {
  try {
    const root = strictRecord(value, REQUEST_FIELDS, 'platform guidance request');
    if (!(root.now instanceof Date) || !Number.isFinite(root.now.getTime())) throw new Error('Platform guidance request time is invalid');
    if (typeof root.rerouted !== 'boolean') throw new Error('Platform guidance reroute state is invalid');
    const request: PlatformGuidanceRequest = {
      complex: place(root.complex, 'requested complex'),
      constituent: place(root.constituent, 'requested constituent'),
      route: canonicalIdentifier(root.route, 'requested route'),
      servicePattern: canonicalIdentifier(root.servicePattern, 'requested service pattern'),
      direction: enumeration(root.direction, DIRECTIONS, 'requested direction'),
      destination: canonicalText(root.destination, 'requested destination'),
      platformId: canonicalIdentifier(root.platformId, 'requested platform'),
      orientation: canonicalText(root.orientation, 'requested platform orientation'),
      objectiveType: enumeration(root.objectiveType, OBJECTIVE_TYPES, 'requested objective type'),
      objectiveTarget: canonicalIdentifier(root.objectiveTarget, 'requested objective target'),
      accessiblePathVersion: canonicalIdentifier(root.accessiblePathVersion, 'requested accessible-path version'),
      now: new Date(root.now.getTime()),
      platformState: enumeration(root.platformState, ['confirmed', 'expected', 'check-signs'] as const, 'requested platform state'),
      rerouted: root.rerouted,
      exposure: root.exposure as ResolvedGuidanceExposure | undefined,
    };
    return request;
  } catch {
    return undefined;
  }
}

function categoryEvidenceReceipt(raw: unknown, rowId: string, version: string): PlatformGuidanceRecord['categoryEvidence'] {
  const root = strictRecord(raw, ['sourceId','reviewedOn','status','parentCoverageRowId','parentRecordVersion'], 'platform guidance category evidence');
  if (root.status !== 'reviewed') throw new Error('Platform guidance category evidence status is invalid');
  assertParent(root, rowId, version, 'category evidence');
  return {
    sourceId: canonicalIdentifier(root.sourceId, 'category evidence source'),
    reviewedOn: canonicalDay(root.reviewedOn, 'category evidence review date'),
    status: 'reviewed', parentCoverageRowId: rowId, parentRecordVersion: version,
  };
}

function reviewReceipt(raw: unknown, rowId: string, version: string, expectedRole: PlatformGuidanceReviewRole): PlatformGuidanceReviewDecision {
  const root = strictRecord(raw, REVIEW_FIELDS, `structured ${expectedRole} platform guidance review`);
  assertParent(root, rowId, version, `${expectedRole} review`);
  const role = enumeration(root.role, REVIEW_ROLES, 'platform guidance review role');
  if (role !== expectedRole) throw new Error('Platform guidance review role does not match its owning field');
  return {
    reviewId: canonicalIdentifier(root.reviewId, 'platform guidance review'), parentCoverageRowId: rowId,
    parentRecordVersion: version, role, decision: enumeration(root.decision, ['approve', 'changes-required'] as const, 'platform guidance review decision'),
    reviewer: canonicalText(root.reviewer, 'platform guidance reviewer'), reviewedOn: canonicalDay(root.reviewedOn, 'platform guidance review date'),
  };
}

function parentStatusReceipt<const T extends readonly string[]>(
  raw: unknown,
  rowId: string,
  version: string,
  statuses: T,
  label: string,
): { readonly status: T[number]; readonly decidedOn: string; readonly parentCoverageRowId: string; readonly parentRecordVersion: string } {
  const root = strictRecord(raw, PARENT_STATUS_FIELDS, `structured platform guidance ${label}`);
  assertParent(root, rowId, version, label);
  return { status: enumeration(root.status, statuses, `platform guidance ${label}`), decidedOn: canonicalDay(root.decidedOn, `platform guidance ${label} date`), parentCoverageRowId: rowId, parentRecordVersion: version };
}

function releaseReceipt(raw: unknown, rowId: string, version: string): PlatformGuidanceReleasePackage {
  const root = strictRecord(raw, ['packageVersion','decisionId','parentCoverageRowId','parentRecordVersion','inclusion','scope','reason','decidedOn'], 'platform guidance release package');
  assertParent(root, rowId, version, 'release package');
  return {
    packageVersion: canonicalIdentifier(root.packageVersion, 'guidance release package version'),
    decisionId: canonicalIdentifier(root.decisionId, 'guidance release decision'), parentCoverageRowId: rowId,
    parentRecordVersion: version, inclusion: enumeration(root.inclusion, ['included', 'excluded'] as const, 'guidance release inclusion'),
    scope: enumeration(root.scope, ['exact-scope'] as const, 'guidance release scope'),
    reason: canonicalText(root.reason, 'guidance release reason'), decidedOn: canonicalDay(root.decidedOn, 'guidance release decision date'),
  };
}

function provenanceReceipt(raw: unknown, rowId: string, version: string, packageVersion: string): PlatformGuidanceProvenance {
  const root = strictRecord(raw, ['sourceId','version','immutable','reviewed','parentCoverageRowId','parentRecordVersion','packageVersion','acceptedOn'], 'platform guidance provenance');
  assertParent(root, rowId, version, 'provenance');
  if (root.immutable !== true || root.reviewed !== true) throw new Error('Platform guidance provenance must be immutable and reviewed');
  const provenanceVersion = canonicalIdentifier(root.version, 'platform guidance provenance version');
  const provenancePackage = canonicalIdentifier(root.packageVersion, 'platform guidance provenance package version');
  if (provenanceVersion !== version || provenancePackage !== packageVersion) throw new Error('Platform guidance provenance version or package linkage is invalid');
  return {
    sourceId: canonicalIdentifier(root.sourceId, 'platform guidance provenance source'), version: provenanceVersion,
    immutable: true, reviewed: true, parentCoverageRowId: rowId, parentRecordVersion: version,
    packageVersion: provenancePackage, acceptedOn: canonicalDay(root.acceptedOn, 'platform guidance provenance acceptance date'),
  };
}

function supportedScopeReceipt(raw: unknown): PlatformGuidanceSupportedScope {
  const root = strictRecord(raw, SUPPORTED_SCOPE_FIELDS, 'platform guidance supported scope');
  return {
    complex: place(root.complex, 'supported complex'), constituent: place(root.constituent, 'supported constituent'),
    route: canonicalIdentifier(root.route, 'supported route'), servicePattern: canonicalIdentifier(root.servicePattern, 'supported service pattern'),
    direction: enumeration(root.direction, DIRECTIONS, 'supported direction'), destination: canonicalText(root.destination, 'supported destination'),
    platformId: canonicalIdentifier(root.platformId, 'supported platform'), layoutOrientation: canonicalText(root.layoutOrientation, 'supported layout orientation'),
    objectiveType: enumeration(root.objectiveType, OBJECTIVE_TYPES, 'supported objective type'), objectiveTarget: canonicalIdentifier(root.objectiveTarget, 'supported objective target'),
    accessiblePathVersion: canonicalIdentifier(root.accessiblePathVersion, 'supported accessible-path version'), position: enumeration(root.position, POSITIONS, 'supported position'),
  };
}

function unsupportedScopeReceipt(raw: unknown): PlatformGuidanceUnsupportedScope {
  const root = strictRecord(raw, UNSUPPORTED_SCOPE_FIELDS, 'platform guidance unsupported scope');
  return {
    complexIds: stringArray(root.complexIds, 'unsupported complex identities', canonicalIdentifier, false),
    constituentIds: stringArray(root.constituentIds, 'unsupported constituent identities', canonicalIdentifier, false),
    routes: stringArray(root.routes, 'unsupported routes', canonicalIdentifier, false),
    servicePatterns: stringArray(root.servicePatterns, 'unsupported service patterns', canonicalIdentifier, false),
    directions: enumArray(root.directions, DIRECTIONS, 'unsupported directions'),
    destinations: stringArray(root.destinations, 'unsupported destinations', canonicalText, false),
    platformIds: stringArray(root.platformIds, 'unsupported platform identities', canonicalIdentifier, false),
    layoutOrientations: stringArray(root.layoutOrientations, 'unsupported layout orientations', canonicalText, false),
    objectiveTypes: enumArray(root.objectiveTypes, OBJECTIVE_TYPES, 'unsupported objective types'),
    objectiveTargets: stringArray(root.objectiveTargets, 'unsupported objective targets', canonicalIdentifier, false),
    accessiblePathVersions: stringArray(root.accessiblePathVersions, 'unsupported accessible-path versions', canonicalIdentifier, false),
    positions: enumArray(root.positions, POSITIONS, 'unsupported positions'),
    conditions: enumArray(root.conditions, ['rerouted'] as const, 'unsupported conditions'),
  };
}

function zoneBenefitReceipt(raw: unknown): PlatformGuidanceRecord['zoneBenefit'] {
  const root = strictRecord(raw, ['position', 'copy'], 'platform guidance zone benefit');
  return { position: enumeration(root.position, POSITIONS, 'zone benefit position'), copy: canonicalText(root.copy, 'zone benefit copy') };
}

function scopeMatchesRecord(scope: PlatformGuidanceSupportedScope, record: PlatformGuidanceRecord): boolean {
  return samePlace(scope.complex, record.complex) && samePlace(scope.constituent, record.constituent)
    && scope.route === record.route && scope.servicePattern === record.servicePattern && scope.direction === record.direction
    && scope.destination === record.destination && scope.platformId === record.platformId && scope.layoutOrientation === record.layoutOrientation
    && scope.objectiveType === record.objectiveType && scope.objectiveTarget === record.objectiveTarget
    && scope.accessiblePathVersion === record.accessiblePathVersion && scope.position === record.position;
}

function unsupportedContradictsRecord(scope: PlatformGuidanceUnsupportedScope, record: PlatformGuidanceRecord): boolean {
  return scope.complexIds.includes(record.complex.id) || scope.constituentIds.includes(record.constituent.id)
    || scope.routes.includes(record.route) || scope.servicePatterns.includes(record.servicePattern)
    || scope.directions.includes(record.direction) || scope.destinations.includes(record.destination)
    || scope.platformIds.includes(record.platformId) || scope.layoutOrientations.includes(record.layoutOrientation)
    || scope.objectiveTypes.includes(record.objectiveType) || scope.objectiveTargets.includes(record.objectiveTarget)
    || scope.accessiblePathVersions.includes(record.accessiblePathVersion) || scope.positions.includes(record.position);
}

function guidanceReviews(record: PlatformGuidanceRecord): readonly PlatformGuidanceReviewDecision[] {
  return [record.productDecision, record.accessibilityDecision, record.dataQualityDecision, record.contentDecision, record.operationsDecision];
}

function assertParent(root: Record<string, unknown>, rowId: string, version: string, label: string): void {
  if (root.parentCoverageRowId !== rowId || root.parentRecordVersion !== version) throw new Error(`Platform guidance ${label} parent linkage is invalid`);
}

function place(raw: unknown, label: string): PlatformGuidancePlace {
  const root = strictRecord(raw, ['id', 'name'], label);
  return { id: canonicalIdentifier(root.id, `${label} identity`), name: canonicalText(root.name, `${label} name`) };
}

function samePlace(left: PlatformGuidancePlace, right: PlatformGuidancePlace): boolean {
  return left.id === right.id && left.name === right.name;
}

function directionAxis(direction: PlatformGuidanceDirection): string {
  if (direction === 'northbound') return 'north';
  if (direction === 'southbound') return 'south';
  if (direction === 'eastbound') return 'east';
  if (direction === 'westbound') return 'west';
  return direction;
}

function stringArray(
  value: unknown,
  label: string,
  parse: (entry: unknown, entryLabel: string) => string,
  required: boolean,
): readonly string[] {
  if (!Array.isArray(value) || (required && value.length === 0)) throw new Error(`${label} must be a${required ? ' non-empty' : 'n'} array`);
  const parsed = value.map((entry) => parse(entry, label));
  if (new Set(parsed).size !== parsed.length) throw new Error(`${label} contains a duplicate value`);
  return parsed;
}

function enumArray<const T extends readonly string[]>(value: unknown, allowed: T, label: string): readonly T[number][] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const parsed = value.map((entry) => enumeration(entry, allowed, label));
  if (new Set(parsed).size !== parsed.length) throw new Error(`${label} contains a duplicate value`);
  return parsed;
}

function enumeration<const T extends readonly string[]>(value: unknown, allowed: T, label: string): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) throw new Error(`${label} is invalid`);
  return value as T[number];
}

function canonicalIdentifier(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} identity is invalid`);
  const normalized = normalizeBoundedIdentity(value, label);
  if (normalized !== value || ['__proto__', 'prototype', 'constructor'].includes(value)) throw new Error(`${label} identity is not canonical`);
  return value;
}

function canonicalText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value || value.trim() !== value || [...value].length > 500 || /\p{C}/u.test(value)) throw new Error(`${label} is invalid`);
  if (normalizeCanonicalIdentity(value) !== value) throw new Error(`${label} is not canonical`);
  return value;
}

function canonicalDay(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be a canonical YYYY-MM-DD date`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} must be a real canonical YYYY-MM-DD date`);
  return value;
}

function dayMs(value: string): number { return Date.parse(`${value}T00:00:00.000Z`); }

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function strictRecord(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const root = value as Record<string, unknown>;
  const missing = fields.filter((field) => !Object.prototype.hasOwnProperty.call(root, field));
  const unexpected = Object.keys(root).filter((field) => !fields.includes(field));
  if (missing.length || unexpected.length) throw new Error(`${label} must contain its exact schema; missing: ${missing.join(',') || 'none'}; unexpected: ${unexpected.join(',') || 'none'}`);
  return root;
}
