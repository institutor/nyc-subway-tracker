export type EvidenceOwner = 'accessibility' | 'guidance';
export type EvidenceRole = 'product' | 'accessibility' | 'data-quality' | 'content' | 'operations';
export type ExposureSurface = 'validation' | 'public';

export interface ExposureRoleReview {
  readonly reviewId: string;
  readonly role: EvidenceRole;
  readonly decision: 'approve';
  readonly packageVersion: string;
  readonly decidedAt: string;
}

export interface ExposureReleaseDecision {
  readonly releaseDecisionId: string;
  readonly owner: EvidenceOwner;
  readonly packageVersion: string;
  readonly status: 'pending' | 'approved';
  readonly decidedAt: string;
}

export interface ExposureDecisionRecord {
  readonly decisionId: string;
  readonly decisionVersion: string;
  readonly owner: EvidenceOwner;
  readonly surface: ExposureSurface;
  readonly packageVersion: string;
  readonly validFrom: string;
  readonly validThrough: string;
  readonly acceptedAt: string;
  readonly reviews: readonly ExposureRoleReview[];
  readonly release: ExposureReleaseDecision;
}

const exposureDecisionBrand: unique symbol = Symbol('resolved-exposure-decision');
export interface ResolvedExposureDecision<Owner extends EvidenceOwner> {
  readonly [exposureDecisionBrand]: Owner;
  readonly decisionId: string;
  readonly decisionVersion: string;
  readonly owner: Owner;
  readonly surface: ExposureSurface;
  readonly packageVersion: string;
  readonly releaseDecisionId: string;
  readonly releaseStatus: 'pending' | 'approved';
  readonly acceptedAt: string;
}
export type ResolvedAccessibilityExposure = ResolvedExposureDecision<'accessibility'>;
export type ResolvedGuidanceExposure = ResolvedExposureDecision<'guidance'>;

const exposureRegistryBrand: unique symbol = Symbol('trusted-exposure-registry');
export interface ExposureDecisionRegistry {
  readonly [exposureRegistryBrand]: true;
  readonly surface: ExposureSurface;
  readonly records: readonly ExposureDecisionRecord[];
}

const trustedRegistries = new WeakSet<object>();
const resolvedDecisions = new WeakSet<object>();

const validationRecords: readonly ExposureDecisionRecord[] = [
  fixtureDecision('validation-accessibility-coverage-v1', 'accessibility', 'coverage-v1', 'validation-accessibility-release-coverage-v1'),
  fixtureDecision('validation-guidance-package-v1', 'guidance', 'package-v1', 'validation-guidance-release-package-v1'),
  fixtureDecision('validation-accessibility-stale-v1', 'accessibility', 'stale-v1', 'validation-accessibility-release-stale-v1', '2026-07-31T23:59:59.000Z'),
];

export const VALIDATION_EXPOSURE_REGISTRY = createTrustedRegistry('validation', validationRecords);
export const PRODUCTION_EXPOSURE_REGISTRY = createTrustedRegistry('public', []);
export const PRODUCTION_ACCESSIBILITY_EXPOSURE: ResolvedAccessibilityExposure | undefined = undefined;
export const PRODUCTION_GUIDANCE_EXPOSURE: ResolvedGuidanceExposure | undefined = undefined;

export function resolveAccessibilityExposure(
  registry: ExposureDecisionRegistry,
  decisionId: string,
  packageVersion: string,
  now: Date,
): ResolvedAccessibilityExposure | undefined {
  return resolveExposure(registry, decisionId, 'accessibility', packageVersion, now) as ResolvedAccessibilityExposure | undefined;
}

export function resolveGuidanceExposure(
  registry: ExposureDecisionRegistry,
  decisionId: string,
  packageVersion: string,
  now: Date,
): ResolvedGuidanceExposure | undefined {
  return resolveExposure(registry, decisionId, 'guidance', packageVersion, now) as ResolvedGuidanceExposure | undefined;
}

export function exposureAllowsEvaluation(
  decision: ResolvedAccessibilityExposure | ResolvedGuidanceExposure | null | undefined,
  packageVersion: string,
  owner: EvidenceOwner,
): boolean {
  return Boolean(decision && resolvedDecisions.has(decision) && decision.owner === owner && decision.packageVersion === packageVersion);
}

export function validateExposureDecisionRegistry(raw: readonly unknown[]): readonly ExposureDecisionRecord[] {
  if (!Array.isArray(raw)) throw new Error('Exposure decision registry must be an array');
  const decisionIds = new Set<string>();
  const releaseIds = new Set<string>();
  const reviewIds = new Set<string>();
  const records = raw.map((candidate) => {
    const root = strictRecord(candidate, [
      'decisionId', 'decisionVersion', 'owner', 'surface', 'packageVersion', 'validFrom', 'validThrough',
      'acceptedAt', 'reviews', 'release',
    ], 'exposure decision');
    const decisionId = identity(root.decisionId, 'decision identity');
    if (decisionIds.has(decisionId)) throw new Error(`Duplicate decision identity: ${decisionId}`);
    decisionIds.add(decisionId);
    const decisionVersion = identity(root.decisionVersion, 'decision version');
    const owner = enumeration(root.owner, ['accessibility', 'guidance'] as const, 'decision owner');
    const surface = enumeration(root.surface, ['validation', 'public'] as const, 'decision surface');
    const packageVersion = identity(root.packageVersion, 'decision package version');
    const validFrom = instant(root.validFrom, 'decision validity start');
    const validThrough = instant(root.validThrough, 'decision validity end');
    const acceptedAt = instant(root.acceptedAt, 'decision acceptance');
    if (!Array.isArray(root.reviews) || root.reviews.length !== 5) throw new Error('Exposure decision requires the complete five-role review package');
    const roles = new Set<EvidenceRole>();
    const reviews = root.reviews.map((reviewValue) => {
      const review = strictRecord(reviewValue, ['reviewId', 'role', 'decision', 'packageVersion', 'decidedAt'], 'exposure role review');
      const reviewId = identity(review.reviewId, 'review identity');
      if (reviewIds.has(reviewId)) throw new Error(`Duplicate review identity: ${reviewId}`);
      reviewIds.add(reviewId);
      const role = enumeration(review.role, ['product', 'accessibility', 'data-quality', 'content', 'operations'] as const, 'review role');
      if (roles.has(role)) throw new Error(`Duplicate review role: ${role}`);
      roles.add(role);
      if (review.decision !== 'approve') throw new Error('Every exposure role must explicitly approve');
      if (review.packageVersion !== packageVersion) throw new Error('Review package version does not match decision');
      return {
        reviewId,
        role,
        decision: 'approve' as const,
        packageVersion,
        decidedAt: instant(review.decidedAt, 'review decision'),
      };
    });
    const releaseRoot = strictRecord(root.release, ['releaseDecisionId', 'owner', 'packageVersion', 'status', 'decidedAt'], 'release decision');
    const releaseDecisionId = identity(releaseRoot.releaseDecisionId, 'release decision identity');
    if (releaseIds.has(releaseDecisionId)) throw new Error(`Duplicate release identity: ${releaseDecisionId}`);
    releaseIds.add(releaseDecisionId);
    if (releaseRoot.owner !== owner || releaseRoot.packageVersion !== packageVersion) throw new Error('Release owner or package version does not match decision');
    const releaseStatus = enumeration(releaseRoot.status, ['pending', 'approved'] as const, 'release status');
    if (surface === 'public' && releaseStatus !== 'approved') throw new Error('Public exposure requires an approved release decision');
    const releaseDecidedAt = instant(releaseRoot.decidedAt, 'release decision');
    const latestReviewAt = Math.max(...reviews.map((review) => Date.parse(review.decidedAt)));
    if (Date.parse(releaseDecidedAt) < latestReviewAt) throw new Error('Release decision predates required role review');
    if (Date.parse(acceptedAt) < Date.parse(releaseDecidedAt)) throw new Error('Decision acceptance predates release decision');
    if (Date.parse(validFrom) < Date.parse(acceptedAt) || Date.parse(validThrough) <= Date.parse(validFrom)) throw new Error('Decision validity chronology is invalid');
    return {
      decisionId,
      decisionVersion,
      owner,
      surface,
      packageVersion,
      validFrom,
      validThrough,
      acceptedAt,
      reviews,
      release: {
        releaseDecisionId,
        owner,
        packageVersion,
        status: releaseStatus,
        decidedAt: releaseDecidedAt,
      },
    } satisfies ExposureDecisionRecord;
  });
  return deepFreeze(records);
}

function resolveExposure(
  registry: ExposureDecisionRegistry,
  decisionId: string,
  owner: EvidenceOwner,
  packageVersion: string,
  now: Date,
): ResolvedAccessibilityExposure | ResolvedGuidanceExposure | undefined {
  if (!trustedRegistries.has(registry)) return undefined;
  const record = registry.records.find((candidate) => candidate.decisionId === decisionId);
  const nowMs = now instanceof Date ? now.getTime() : Number.NaN;
  if (!record || record.owner !== owner || record.packageVersion !== packageVersion || record.surface !== registry.surface
    || !Number.isFinite(nowMs) || nowMs < Date.parse(record.validFrom) || nowMs > Date.parse(record.validThrough)
    || (record.surface === 'public' && record.release.status !== 'approved')) return undefined;
  const resolved = Object.freeze({
    [exposureDecisionBrand]: owner,
    decisionId: record.decisionId,
    decisionVersion: record.decisionVersion,
    owner,
    surface: record.surface,
    packageVersion: record.packageVersion,
    releaseDecisionId: record.release.releaseDecisionId,
    releaseStatus: record.release.status,
    acceptedAt: record.acceptedAt,
  }) as ResolvedAccessibilityExposure | ResolvedGuidanceExposure;
  resolvedDecisions.add(resolved);
  return resolved;
}

function createTrustedRegistry(surface: ExposureSurface, records: readonly ExposureDecisionRecord[]): ExposureDecisionRegistry {
  const accepted = validateExposureDecisionRegistry(records);
  if (accepted.some((record) => record.surface !== surface)) throw new Error('Exposure registry surface does not match its records');
  const registry = deepFreeze({ [exposureRegistryBrand]: true, surface, records: accepted }) as ExposureDecisionRegistry;
  trustedRegistries.add(registry);
  return registry;
}

function strictRecord(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const root = value as Record<string, unknown>;
  const keys = Object.keys(root);
  if (keys.length !== fields.length || fields.some((field) => !(field in root))) throw new Error(`${label} must contain its exact schema`);
  return root;
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() !== value || value.length === 0 || value.length > 160) throw new Error(`${label} is invalid`);
  return value;
}

function enumeration<const T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== 'string' || !values.includes(value)) throw new Error(`${label} is invalid`);
  return value as T[number];
}

function instant(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be an ISO instant`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new Error(`${label} must be a canonical ISO instant`);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    if (!Object.isFrozen(value)) Object.freeze(value);
  }
  return value;
}

function fixtureDecision(
  decisionId: string,
  owner: EvidenceOwner,
  packageVersion: string,
  releaseDecisionId: string,
  validThrough = '2027-07-30T23:59:59.000Z',
): ExposureDecisionRecord {
  const reviews = (['product', 'accessibility', 'data-quality', 'content', 'operations'] as const).map((role, index) => ({
    reviewId: `${decisionId}-${role}`,
    role,
    decision: 'approve' as const,
    packageVersion,
    decidedAt: `2026-07-30T14:0${index}:00.000Z`,
  }));
  return {
    decisionId,
    decisionVersion: 'decision-v1',
    owner,
    surface: 'validation',
    packageVersion,
    validFrom: '2026-07-30T15:10:00.000Z',
    validThrough,
    acceptedAt: '2026-07-30T15:10:00.000Z',
    reviews,
    release: {
      releaseDecisionId,
      owner,
      packageVersion,
      status: 'pending',
      decidedAt: '2026-07-30T15:05:00.000Z',
    },
  };
}
