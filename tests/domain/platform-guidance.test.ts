import guidanceRegistry from '../../src/shared/data/platform-guidance.json';
import { describe, expect, test } from 'vitest';
import { resolvePlatformGuidance, validatePlatformGuidanceRegistry, type PlatformGuidanceRecord } from '../../src/shared/domain/platform-guidance';
import { PRODUCTION_GUIDANCE_EXPOSURE, type GuidanceExposureDecision } from '../../src/shared/domain/exposure-decision';

const record = (overrides: Partial<PlatformGuidanceRecord> = {}): PlatformGuidanceRecord => ({
  coverageRowId: 'guidance-a12-v1', immutableVersion: 'v1', supersededVersion: 'none-reviewed', complex: 'A12|125 St', constituent: 'A12|125 St (8 Av)', priorityCategory: 'accessible-objective', categoryEvidence: 'fixture-source|2026-07-30|reviewed', route: 'A', servicePattern: 'ordinary', direction: 'northbound', destination: 'Inwood-207 St', platformId: 'A12N', layoutOrientation: 'northbound travel axis', frontRearOrder: 'front-to-back north', zoneGeometry: 'middle zone markers 4-6', objectiveType: 'accessible-exit', objectiveTarget: 'EL-A12-01', physicalRelationships: 'platform to elevator to mezzanine to street', zoneBenefit: 'middle|nearest verified elevator', certaintyCeiling: 'verified', accessiblePathVersion: 'path-v1', restrictions: 'ordinary pattern only', supportedScope: 'A|northbound|ordinary|A12N|Inwood-207 St|accessible-exit|EL-A12-01', unsupportedScope: 'reroutes|southbound|other targets', task7RecordVersion: 'task7-a12-v1', durableFieldEvidence: 'evidence/guidance-a12-v1.json', verificationDate: '2026-07-30', verifier: 'Fixture Verifier|Accessibility', reverificationTriggers: 'none-open', reverificationStatus: 'current|2026-07-30', feedbackCorrections: 'none-reviewed', productDecision: 'approve|v1|2026-07-30|Product Reviewer', accessibilityDecision: 'approve|v1|2026-07-30|Accessibility Reviewer', dataQualityDecision: 'approve|v1|2026-07-30|Data Reviewer', contentDecision: 'approve|v1|2026-07-30|Content Reviewer', operationsDecision: 'approve|v1|2026-07-30|Operations Reviewer', disposition: 'eligible-for-runtime-evaluation|2026-07-30', releasePackage: { packageVersion: 'package-v1', inclusion: 'included', scope: 'exact-scope', reason: 'fixture', downstreamDecision: 'pending' }, position: 'middle', provenance: { sourceId: 'fixture-guidance', version: 'v1', immutable: true, reviewed: true }, ...overrides,
});

const validationGuidanceExposure = { owner: 'guidance', exposed: true, surface: 'validation', packageVersion: 'package-v1', immutable: true, reviewed: true } as const satisfies GuidanceExposureDecision;
const request = { complex: 'A12|125 St', constituent: 'A12|125 St (8 Av)', route: 'A', servicePattern: 'ordinary', direction: 'northbound', destination: 'Inwood-207 St', platformId: 'A12N', orientation: 'northbound travel axis', objectiveType: 'accessible-exit', objectiveTarget: 'EL-A12-01', accessiblePathVersion: 'path-v1', now: new Date('2026-08-01T00:00:00Z'), platformState: 'confirmed' as const, rerouted: false, exposure: validationGuidanceExposure };

describe('immutable platform guidance', () => {
  test('keeps the production registry empty without reviewed provenance-bearing records', () => {
    expect(guidanceRegistry).toEqual([]);
  });

  test('rejects an incomplete immutable 38-field coverage record', () => {
    const raw = { ...record() } as Record<string, unknown>;
    delete raw.operationsDecision;
    expect(() => validatePlatformGuidanceRegistry([raw])).toThrow(/operationsDecision/);
  });

  test('returns guidance only for exact scope, orientation objective and current platform match', () => {
    expect(resolvePlatformGuidance([record()], request)?.position).toBe('middle');
    expect(resolvePlatformGuidance([record()], { ...request, direction: 'southbound' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, objectiveTarget: 'other-exit' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, platformId: 'A12S' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, orientation: 'southbound travel axis' })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, exposure: { owner: 'guidance', surface: 'public', exposed: false, packageVersion: 'package-v1', immutable: true, reviewed: true, reason: 'pending' } })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, exposure: PRODUCTION_GUIDANCE_EXPOSURE })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, exposure: { ...validationGuidanceExposure, packageVersion: 'wrong-v2' } })).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, orientation: undefined } as unknown as typeof request)).toBeUndefined();
  });

  test('omits outdated, wrong-platform, rerouted, unreviewed, and provenance-free guidance', () => {
    expect(resolvePlatformGuidance([record({ reverificationStatus: 'reverification-required|2026-08-01' })], request)).toBeUndefined();
    expect(resolvePlatformGuidance([record()], { ...request, rerouted: true })).toBeUndefined();
    expect(resolvePlatformGuidance([record({ provenance: { sourceId: 'x', version: 'v1', immutable: false, reviewed: true } })], request)).toBeUndefined();
    expect(resolvePlatformGuidance([record({ disposition: 'pending-ineligible' })], request)).toBeUndefined();
  });

  test('does not invent an expiry when a reviewed record remains explicitly current', () => {
    expect(resolvePlatformGuidance([record({ verificationDate: '2020-01-01' })], request)?.position).toBe('middle');
  });

  test('allows only immutable reviewed same-version approved public guidance evaluation', () => {
    const approved = { owner: 'guidance', surface: 'public', exposed: true, packageVersion: 'package-v1', immutable: true, reviewed: true, approval: { status: 'approved', version: 'package-v1', immutable: true, reviewed: true } } satisfies GuidanceExposureDecision;
    expect(resolvePlatformGuidance([record()], { ...request, exposure: approved })).toBeUndefined();
    expect(resolvePlatformGuidance([record({ releasePackage: { packageVersion: 'package-v1', inclusion: 'included', scope: 'exact-scope', reason: 'fixture', downstreamDecision: 'approved' } })], { ...request, exposure: approved })?.position).toBe('middle');
  });

  test('recursively freezes approved public exposure evidence before evaluation', () => {
    const approved = { owner: 'guidance', surface: 'public', exposed: true, packageVersion: 'package-v1', immutable: true, reviewed: true, approval: { status: 'approved', version: 'package-v1', immutable: true, reviewed: true } } satisfies GuidanceExposureDecision;
    resolvePlatformGuidance([record()], { ...request, exposure: approved });
    expect(Object.isFrozen(approved)).toBe(true);
    expect(Object.isFrozen(approved.approval)).toBe(true);
  });
});
