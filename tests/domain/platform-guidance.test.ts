import guidanceRegistry from '../../src/shared/data/platform-guidance.json';
import { describe, expect, test } from 'vitest';
import { resolvePlatformGuidance, validatePlatformGuidanceRegistry, type PlatformGuidanceRecord } from '../../src/shared/domain/platform-guidance';
import {
  PRODUCTION_EXPOSURE_REGISTRY,
  VALIDATION_EXPOSURE_REGISTRY,
  resolveGuidanceExposure,
  type ResolvedGuidanceExposure,
} from '../../src/shared/domain/exposure-decision';

const complex = { id: 'A12', name: '125 St' } as const;
const constituent = { id: 'A12', name: '125 St (8 Av)' } as const;
const review = (role: PlatformGuidanceRecord['productDecision']['role'], reviewer: string) => ({
  reviewId: `guidance-a12-v1:${role}`,
  parentCoverageRowId: 'guidance-a12-v1',
  parentRecordVersion: 'v1',
  role,
  decision: 'approve' as const,
  reviewer,
  reviewedOn: '2026-07-30',
});

const record = (overrides: Partial<PlatformGuidanceRecord> = {}): PlatformGuidanceRecord => ({
  coverageRowId: 'guidance-a12-v1',
  immutableVersion: 'v1',
  supersededVersion: null,
  complex,
  constituent,
  priorityCategory: 'accessible-objective',
  categoryEvidence: { sourceId: 'fixture-source', reviewedOn: '2026-07-30', status: 'reviewed', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1' },
  route: 'A',
  servicePattern: 'ordinary',
  direction: 'northbound',
  destination: 'Inwood-207 St',
  platformId: 'A12N',
  layoutOrientation: 'northbound travel axis',
  frontRearOrder: 'front-to-back north',
  zoneGeometry: 'middle zone markers 4-6',
  objectiveType: 'accessible-exit',
  objectiveTarget: 'EL-A12-01',
  physicalRelationships: 'platform to elevator to mezzanine to street',
  zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator' },
  certaintyCeiling: 'verified',
  accessiblePathVersion: 'path-v1',
  restrictions: ['ordinary pattern only'],
  supportedScope: { complex, constituent, route: 'A', servicePattern: 'ordinary', direction: 'northbound', destination: 'Inwood-207 St', platformId: 'A12N', layoutOrientation: 'northbound travel axis', objectiveType: 'accessible-exit', objectiveTarget: 'EL-A12-01', accessiblePathVersion: 'path-v1', position: 'middle' },
  unsupportedScope: { complexIds: [], constituentIds: [], routes: [], servicePatterns: ['rerouted'], directions: ['southbound'], destinations: [], platformIds: ['A12S'], layoutOrientations: [], objectiveTypes: [], objectiveTargets: ['other-target'], accessiblePathVersions: [], positions: [], conditions: ['rerouted'] },
  task7RecordVersion: 'task7-a12-v1',
  durableFieldEvidence: 'evidence/guidance-a12-v1.json',
  verificationDate: '2026-07-30',
  verifier: { name: 'Fixture Verifier', role: 'Accessibility' },
  reverificationTriggers: [],
  reverificationStatus: { status: 'current', decidedOn: '2026-07-30', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1' },
  feedbackCorrections: [],
  productDecision: review('product', 'Product Reviewer'),
  accessibilityDecision: review('accessibility', 'Accessibility Reviewer'),
  dataQualityDecision: review('data-quality', 'Data Reviewer'),
  contentDecision: review('content', 'Content Reviewer'),
  operationsDecision: review('operations', 'Operations Reviewer'),
  disposition: { status: 'eligible-for-runtime-evaluation', decidedOn: '2026-07-30', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1' },
  releasePackage: { packageVersion: 'package-v1', decisionId: 'validation-guidance-release-package-v1', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1', inclusion: 'included', scope: 'exact-scope', reason: 'fixture', decidedOn: '2026-07-30' },
  position: 'middle',
  provenance: { sourceId: 'fixture-guidance', version: 'v1', immutable: true, reviewed: true, parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1', packageVersion: 'package-v1', acceptedOn: '2026-07-30' },
  ...overrides,
});

function relinkedRecord(rowId: string, releaseId = `validation-guidance-release-${rowId}`): PlatformGuidanceRecord {
  const fixture = record();
  const relinkReview = (decision: PlatformGuidanceRecord['productDecision']) => ({
    ...decision,
    reviewId: `${rowId}:${decision.role}`,
    parentCoverageRowId: rowId,
  });
  return {
    ...fixture,
    coverageRowId: rowId,
    categoryEvidence: { ...fixture.categoryEvidence, parentCoverageRowId: rowId },
    reverificationStatus: { ...fixture.reverificationStatus, parentCoverageRowId: rowId },
    productDecision: relinkReview(fixture.productDecision),
    accessibilityDecision: relinkReview(fixture.accessibilityDecision),
    dataQualityDecision: relinkReview(fixture.dataQualityDecision),
    contentDecision: relinkReview(fixture.contentDecision),
    operationsDecision: relinkReview(fixture.operationsDecision),
    disposition: { ...fixture.disposition, parentCoverageRowId: rowId },
    releasePackage: { ...fixture.releasePackage, decisionId: releaseId, parentCoverageRowId: rowId },
    provenance: { ...fixture.provenance, parentCoverageRowId: rowId },
  };
}

const validationGuidanceExposure = resolveGuidanceExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-guidance-package-v1', 'package-v1', new Date('2026-08-01T00:00:00Z'))!;
const request = { complex, constituent, route: 'A', servicePattern: 'ordinary', direction: 'northbound' as const, destination: 'Inwood-207 St', platformId: 'A12N', orientation: 'northbound travel axis', objectiveType: 'accessible-exit' as const, objectiveTarget: 'EL-A12-01', accessiblePathVersion: 'path-v1', now: new Date('2026-08-01T00:00:00Z'), platformState: 'confirmed' as const, rerouted: false, exposure: validationGuidanceExposure };

describe('immutable platform guidance', () => {
  test('keeps the production registry empty without reviewed provenance-bearing records', () => {
    expect(guidanceRegistry).toEqual([]);
  });

  test('rejects an incomplete immutable 38-field coverage record', () => {
    const raw = { ...record() } as Record<string, unknown>;
    delete raw.operationsDecision;
    expect(() => validatePlatformGuidanceRegistry([raw])).toThrow(/operationsDecision/);
  });

  test('rejects extra fields and incomplete nested release or provenance schemas', () => {
    const candidates = [
      { ...record(), unexpected: true },
      { ...record(), releasePackage: { ...record().releasePackage, unexpected: true } },
      { ...record(), provenance: { ...record().provenance, unexpected: true } },
      { ...record(), position: undefined },
      { ...record(), provenance: undefined },
    ];
    for (const candidate of candidates) expect(() => validatePlatformGuidanceRegistry([candidate])).toThrow(/exact schema|position|provenance/i);
  });

  test.each([
    ['object-valued route', { route: { id: 'A' } }],
    ['number-valued zone geometry', { zoneGeometry: 7 }],
    ['non-canonical category evidence date', { categoryEvidence: { ...record().categoryEvidence, reviewedOn: 'tomorrow' } }],
    ['non-canonical structured review date', { productDecision: { ...record().productDecision, reviewedOn: 'bad-date' } }],
    ['suffix-injected structured status', { reverificationStatus: { ...record().reverificationStatus, status: 'current|attacker' } }],
  ])('rejects value-permissive guidance fields: %s', (_label, overrides) => {
    expect(() => validatePlatformGuidanceRegistry([{ ...record(), ...overrides }])).toThrow();
  });

  test('rejects scalar review decisions instead of treating a delimiter prefix as structured approval', () => {
    expect(() => validatePlatformGuidanceRegistry([record({ productDecision: 'approve|v1|2026-07-30|Product Reviewer' } as never)])).toThrow(/structured.*review|review.*schema/i);
  });

  test('rejects a review with a non-canonical date even when its scalar prefix says approve', () => {
    const candidate = record({ productDecision: 'approve|v1|bad-date|Product Reviewer' } as never);
    expect(resolvePlatformGuidance([candidate], request)).toBeUndefined();
  });

  test('rejects suffix injection in reverification status and runtime disposition', () => {
    expect(resolvePlatformGuidance([record({ reverificationStatus: 'current|2026-07-30|attacker' } as never)], request)).toBeUndefined();
    expect(resolvePlatformGuidance([record({ disposition: 'eligible-for-runtime-evaluation|2026-07-30|attacker' } as never)], request)).toBeUndefined();
  });

  test.each([
    ['destination', { ...record().supportedScope, destination: 'Far Rockaway-Mott Av' }],
    ['platform', { ...record().supportedScope, platformId: 'A12S' }],
  ])('rejects supportedScope whose %s conflicts with the record', (_field, supportedScope) => {
    expect(resolvePlatformGuidance([record({ supportedScope })], request)).toBeUndefined();
  });

  test('rejects unsupported scope that includes the supported direction or platform', () => {
    const unsupportedScope = { ...record().unsupportedScope, directions: ['northbound'] as const, platformIds: ['A12N'] };
    expect(resolvePlatformGuidance([record({ unsupportedScope })], request)).toBeUndefined();
  });

  test.each([
    ['layout orientation', record({ layoutOrientation: 'southbound travel axis' })],
    ['front/rear order', record({ frontRearOrder: 'back-to-front north' })],
    ['position and zone benefit', record({ position: 'front', zoneGeometry: 'front zone markers 1-3', supportedScope: { ...record().supportedScope, position: 'front' }, zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator' } })],
  ])('rejects a genuine %s contradiction', (_label, candidate) => {
    expect(resolvePlatformGuidance([candidate], request)).toBeUndefined();
  });

  test.each(['release', 'provenance'] as const)('rejects a %s object copied onto another coverage row', (kind) => {
    const fixture = record();
    const other = relinkedRecord('guidance-other-v1');
    const copied = kind === 'release'
      ? { ...other, releasePackage: fixture.releasePackage }
      : { ...other, provenance: fixture.provenance };
    expect(() => validatePlatformGuidanceRegistry([copied])).toThrow(/release|provenance|parent|link/i);
  });

  test('rejects release and provenance chronology that predates owned review or approval evidence', () => {
    const laterReview = record({ productDecision: { ...record().productDecision, reviewedOn: '2026-07-31' } });
    expect(() => validatePlatformGuidanceRegistry([laterReview])).toThrow(/release.*predates/i);
    const lateRelease = record({ releasePackage: { ...record().releasePackage, decidedOn: '2026-07-31' } });
    expect(() => validatePlatformGuidanceRegistry([lateRelease])).toThrow(/provenance.*predates/i);
  });

  test.each(['coverage', 'review', 'release'] as const)('rejects duplicate %s identities in the registry', (kind) => {
    const first = record();
    if (kind === 'coverage') {
      expect(() => validatePlatformGuidanceRegistry([first, record()])).toThrow(/duplicate.*coverage/i);
      return;
    }
    const other = relinkedRecord('guidance-other-v1', kind === 'release' ? first.releasePackage.decisionId : undefined);
    const duplicate = kind === 'review'
      ? { ...other, productDecision: { ...other.productDecision, reviewId: first.productDecision.reviewId } }
      : other;
    expect(() => validatePlatformGuidanceRegistry([first, duplicate])).toThrow(new RegExp(`duplicate.*${kind}`, 'i'));
  });

  test('reconstructs detached deeply frozen records and rejects non-canonical request values', () => {
    const raw = record({ complex: { ...complex } });
    const accepted = validatePlatformGuidanceRegistry([raw])[0];
    expect(accepted).not.toBe(raw);
    expect(accepted.complex).not.toBe(raw.complex);
    expect(Object.isFrozen(accepted.releasePackage)).toBe(true);
    (raw.complex as { name: string }).name = 'Forged';
    expect(accepted.complex.name).toBe('125 St');
    expect(resolvePlatformGuidance([record()], { ...request, complex: { ...complex, id: ' A12' } } as never)).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, unexpected: true } as never)).toBeUndefined();
  });

  test('rejects crowding fields from the guidance schema', () => {
    expect(() => validatePlatformGuidanceRegistry([{ ...record(), crowding: 'quiet car' }])).toThrow(/crowding/i);
  });

  test('returns guidance only for exact scope, orientation objective and current platform match', () => {
    expect(resolvePlatformGuidance([record()], request)?.position).toBe('middle');
    expect(resolvePlatformGuidance([record()], { ...request, direction: 'southbound' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, objectiveTarget: 'other-exit' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, platformId: 'A12S' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, orientation: 'southbound travel axis' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, exposure: undefined })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, exposure: resolveGuidanceExposure(PRODUCTION_EXPOSURE_REGISTRY, 'public-guidance-package-v1', 'package-v1', request.now) })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, exposure: resolveGuidanceExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-guidance-package-v1', 'wrong-v2', request.now) })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, orientation: undefined } as unknown as typeof request)).toBeUndefined();
  });

  test('omits outdated, wrong-platform, rerouted, unreviewed, and provenance-free guidance', () => {
    expect(resolvePlatformGuidance([record({ reverificationStatus: { ...record().reverificationStatus, status: 'reverification-required', decidedOn: '2026-08-01' } })], request)).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, rerouted: true })).toBeUndefined();
    expect(resolvePlatformGuidance([record({ provenance: { ...record().provenance, sourceId: 'x', immutable: false } as never })], request)).toBeUndefined();
    expect(resolvePlatformGuidance([record({ disposition: { ...record().disposition, status: 'pending' } })], request)).toBeUndefined();
  });

  test('does not invent an expiry when a reviewed record remains explicitly current', () => {
    expect(resolvePlatformGuidance([record({ verificationDate: '2020-01-01' })], request)?.position).toBe('middle');
  });

  test('rejects a caller-authored same-version approved public guidance object', () => {
    const approved = { owner: 'guidance', surface: 'public', packageVersion: 'package-v1', releaseDecisionId: 'validation-guidance-release-package-v1', releaseStatus: 'approved' } as unknown as ResolvedGuidanceExposure;
    expect(resolvePlatformGuidance([record()], { ...request, exposure: approved })).toBeUndefined();
  });

  test('rejects reuse of a genuine guidance exposure after its validity window', () => {
    expect(resolvePlatformGuidance([record()], { ...request, now: new Date('2027-07-30T23:59:59.001Z') })).toBeUndefined();
  });

  test('returns an immutable resolved validation exposure identity', () => {
    expect(Object.isFrozen(validationGuidanceExposure)).toBe(true);
    expect(() => { (validationGuidanceExposure as { packageVersion: string }).packageVersion = 'forged'; }).toThrow();
  });
});
