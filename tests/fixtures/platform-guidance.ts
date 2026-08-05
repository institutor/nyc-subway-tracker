import { resolveGuidanceExposure, VALIDATION_EXPOSURE_REGISTRY } from '../../src/shared/domain/exposure-decision';
import { resolvePlatformGuidance, type PlatformGuidanceRecord } from '../../src/shared/domain/platform-guidance';

export function resolvedValidationGuidance() {
  const complex = { id: 'A12', name: '125 St' } as const;
  const constituent = { id: 'A12', name: '125 St (8 Av)' } as const;
  const review = (role: PlatformGuidanceRecord['productDecision']['role'], reviewer: string) => ({
    reviewId: `guidance-a12-v1:${role}`, parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1',
    role, decision: 'approve' as const, reviewer, reviewedOn: '2026-07-30',
  });
  const record: PlatformGuidanceRecord = {
    coverageRowId: 'guidance-a12-v1', immutableVersion: 'v1', supersededVersion: null, complex, constituent,
    priorityCategory: 'accessible-objective', categoryEvidence: { sourceId: 'fixture-source', reviewedOn: '2026-07-30', status: 'reviewed', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1' },
    route: 'A', servicePattern: 'ordinary', direction: 'northbound', destination: 'Inwood-207 St', platformId: 'A12N',
    layoutOrientation: 'northbound travel axis', frontRearOrder: 'front-to-back north', zoneGeometry: 'middle zone markers 4-6',
    objectiveType: 'accessible-exit', objectiveTarget: 'EL-A12-01', physicalRelationships: 'platform to elevator to mezzanine to street',
    zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator' }, certaintyCeiling: 'verified', accessiblePathVersion: 'path-v1',
    restrictions: ['ordinary pattern only'],
    supportedScope: { complex, constituent, route: 'A', servicePattern: 'ordinary', direction: 'northbound', destination: 'Inwood-207 St', platformId: 'A12N', layoutOrientation: 'northbound travel axis', objectiveType: 'accessible-exit', objectiveTarget: 'EL-A12-01', accessiblePathVersion: 'path-v1', position: 'middle' },
    unsupportedScope: { complexIds: [], constituentIds: [], routes: [], servicePatterns: ['rerouted'], directions: ['southbound'], destinations: [], platformIds: ['A12S'], layoutOrientations: [], objectiveTypes: [], objectiveTargets: ['other-target'], accessiblePathVersions: [], positions: [], conditions: ['rerouted'] },
    task7RecordVersion: 'task7-a12-v1', durableFieldEvidence: 'evidence/guidance-a12-v1.json', verificationDate: '2026-07-30',
    verifier: { name: 'Fixture Verifier', role: 'Accessibility' }, reverificationTriggers: [],
    reverificationStatus: { status: 'current', decidedOn: '2026-07-30', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1' },
    feedbackCorrections: [], productDecision: review('product', 'Product Reviewer'), accessibilityDecision: review('accessibility', 'Accessibility Reviewer'),
    dataQualityDecision: review('data-quality', 'Data Reviewer'), contentDecision: review('content', 'Content Reviewer'), operationsDecision: review('operations', 'Operations Reviewer'),
    disposition: { status: 'eligible-for-runtime-evaluation', decidedOn: '2026-07-30', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1' },
    releasePackage: { packageVersion: 'package-v1', decisionId: 'validation-guidance-release-package-v1', parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1', inclusion: 'included', scope: 'exact-scope', reason: 'fixture', decidedOn: '2026-07-30' },
    position: 'middle', provenance: { sourceId: 'fixture-guidance', version: 'v1', immutable: true, reviewed: true, parentCoverageRowId: 'guidance-a12-v1', parentRecordVersion: 'v1', packageVersion: 'package-v1', acceptedOn: '2026-07-30' },
  };
  const now = new Date('2026-08-01T00:00:00.000Z');
  const exposure = resolveGuidanceExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-guidance-package-v1', 'package-v1', now)!;
  return resolvePlatformGuidance([record], { complex, constituent, route: 'A', servicePattern: 'ordinary', direction: 'northbound', destination: 'Inwood-207 St', platformId: 'A12N', orientation: 'northbound travel axis', objectiveType: 'accessible-exit', objectiveTarget: 'EL-A12-01', accessiblePathVersion: 'path-v1', now, platformState: 'confirmed', rerouted: false, exposure })!;
}
