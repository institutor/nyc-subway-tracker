import { describe, expect, test } from 'vitest';

import {
  assessAccessiblePath,
  orderAccessiblePaths,
  validateAccessibilityRegistry,
  type AccessibilityPackage,
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

function coverage(overrides: Partial<StationDirectionCoverageRow> = {}): StationDirectionCoverageRow {
  return {
    coverageRecordId: 'coverage:a12:north:a', coverageRecordVersion: 'coverage-v1', stationComplex: { id: 'A12', name: '125 St' },
    constituentStation: { id: 'A12', name: '125 St (8 Av)' }, routeOrLine: 'A', normalizedDirection: 'northbound',
    accessibleStreetEntrance: { id: 'ENT-A', description: 'SW corner of 125 St and St Nicholas Ave' }, streetCorner: 'southwest',
    directionalPlatform: 'A12N', boardingArea: 'A12N-zone-2', completePathId: 'path:a12:north:a', orderedEdgeIds: ['edge-1', 'edge-2'],
    equipmentIds: ['EL-A12-01'], accessiblePathMembershipByEdge: { 'edge-1': true, 'edge-2': true }, operatingRestrictions: ['none'],
    evidenceSources: ['immutable-fixture'], evidenceReferences: ['evidence/path-a12-v1.json'], verificationDate: '2026-07-30',
    verifier: { name: 'Fixture Verifier', role: 'Accessibility reviewer' },
    productDecision: review('Product'), accessibilityDecision: review('Accessibility'), dataQualityDecision: review('Data Quality'),
    contentDecision: review('Content'), operationsDecision: review('Operations'),
    structuralDisposition: { status: 'accepted', reason: 'Complete synthetic evidence' },
    unsupportedScope: { lines: ['C'], directions: ['southbound'], entrances: ['ENT-B'], platforms: ['A12S'], servicePatterns: ['rerouted'], paths: ['path:a12:south:a'] },
    ...overrides,
  };
}

function review(role: string) {
  return { decision: 'approve' as const, reviewer: `${role} Reviewer`, date: '2026-07-30', recordVersion: 'coverage-v1' };
}

function packageFixture(overrides: Partial<AccessibilityPackage> = {}): AccessibilityPackage {
  const base = {
    packageId: 'package-a12-v1', version: 'coverage-v1', canonicalPathIdentity: 'path:a12:north:a', coverage: coverage(),
    edges: [
      { id: 'edge-1', order: 1, movementType: 'elevator', start: { id: 'street', level: 'street' }, end: { id: 'mezz', level: 'mezzanine' }, routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentId: 'EL-A12-01', officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30', evidenceReference: 'evidence/edge-1.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:north:a' },
      { id: 'edge-2', order: 2, movementType: 'level-path', start: { id: 'mezz', level: 'mezzanine' }, end: { id: 'platform', level: 'platform' }, routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30', evidenceReference: 'evidence/edge-2.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:north:a' },
    ],
  };
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

function equipment(overrides: { targetEquipmentId?: string; snapshotScope?: string } = {}) {
  const sourceScopeId = overrides.snapshotScope ?? 'nyc-equipment';
  const inventory = acceptEquipmentInventory({
    inventoryId: 'inventory-v1', evidenceOwner: 'official-equipment-inventory', sourceScopeId,
    sourceVersion: 'inventory-v1', acceptedAt: '2026-07-31T23:00:00.000Z', equipmentIds: ['EL-A12-01', 'EL-OTHER'],
  });
  const history = acceptEquipmentHistory({
    historyId: 'history-v1', evidenceOwner: 'official-equipment-status', sourceScopeId,
    sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1', snapshots: [{
      snapshotId: 'snapshot-v1', sequenceOrdinal: 1, predecessorSnapshotId: null,
      evidenceOwner: 'official-equipment-status', sourceScopeId, sourceVersion: 'equipment-v1', inventoryVersion: 'inventory-v1',
      sourceTimestamp: '2026-07-31T23:59:00.000Z', acceptedAt: '2026-07-31T23:59:01.000Z', declaredRecordCount: 1,
      records: [{ recordId: 'out-other', equipmentId: 'EL-OTHER', state: 'out-of-service' }],
    }],
  }, inventory);
  return assessEquipmentStatus({
    targetEquipmentId: overrides.targetEquipmentId ?? 'EL-A12-01', decisionTime: at('2026-08-01T00:00:00Z'), inventory, history,
  });
}

const equipmentEvidence = {
  originIntent: 'origin-street', destinationIntent: 'destination-street',
  equipmentSourceScopeId: 'nyc-equipment', equipmentSourceVersion: 'equipment-v1',
  decisionTime: at('2026-08-01T00:00:00Z'),
} as const;

const validationAccessibilityExposure = resolveAccessibilityExposure(
  VALIDATION_EXPOSURE_REGISTRY,
  'validation-accessibility-coverage-v1',
  'coverage-v1',
  at('2026-08-01T00:00:00Z'),
)!;

describe('complete accessible path evidence', () => {
  test('rejects a station label because only exact direction and platform evidence can pass', () => {
    expect(() => loadStationAccessibility([{ stationId: 'A12', accessible: true }])).toThrow(/26-field/i);
  });

  test('rejects any missing field from the complete 26-field atomic row', () => {
    const raw = { ...coverage() } as Record<string, unknown>;
    delete raw.operationsDecision;
    expect(() => loadStationAccessibility([raw])).toThrow(/operationsDecision/);
  });

  test.each([
    'coverageRecordId','coverageRecordVersion','stationComplex','constituentStation','routeOrLine','normalizedDirection','accessibleStreetEntrance','streetCorner','directionalPlatform','boardingArea','completePathId','orderedEdgeIds','equipmentIds','accessiblePathMembershipByEdge','operatingRestrictions','evidenceSources','evidenceReferences','verificationDate','verifier','productDecision','accessibilityDecision','dataQualityDecision','contentDecision','operationsDecision','structuralDisposition','unsupportedScope',
  ])('rejects missing atomic coverage field %s', (field) => {
    const raw = { ...coverage() } as Record<string, unknown>;
    delete raw[field];
    expect(() => loadStationAccessibility([raw])).toThrow(new RegExp(field));
  });

  test('rejects incomplete nested endpoints, levels, equipment joins, restrictions, evidence, verification, and scope review', () => {
    const base = packageFixture();
    const invalid = [
      packageFixture({ edges: [{ ...base.edges[0], start: { id: 'street', level: '' } }, base.edges[1]] }),
      packageFixture({ coverage: coverage({ equipmentIds: ['EL-WRONG'] }) }),
      packageFixture({ coverage: coverage({ operatingRestrictions: [] }) }),
      packageFixture({ coverage: coverage({ evidenceReferences: [] }) }),
      packageFixture({ coverage: coverage({ verificationDate: '' }) }),
      packageFixture({ coverage: coverage({ verifier: { name: '', role: '' } }) }),
      packageFixture({ coverage: coverage({ unsupportedScope: {} as StationDirectionCoverageRow['unsupportedScope'] }) }),
    ];
    for (const item of invalid) expect(() => loadPathEvidence([item])).toThrow();
  });

  test('rejects extra fields at every fixed path-package schema boundary', () => {
    const fixture = packageFixture();
    const candidates = [
      { ...fixture, unexpected: true },
      { ...fixture, coverage: { ...fixture.coverage, stationComplex: { ...fixture.coverage.stationComplex, unexpected: true } } },
      { ...fixture, coverage: { ...fixture.coverage, verifier: { ...fixture.coverage.verifier, unexpected: true } } },
      { ...fixture, coverage: { ...fixture.coverage, productDecision: { ...fixture.coverage.productDecision, unexpected: true } } },
      { ...fixture, coverage: { ...fixture.coverage, structuralDisposition: { ...fixture.coverage.structuralDisposition, unexpected: true } } },
      { ...fixture, coverage: { ...fixture.coverage, unsupportedScope: { ...fixture.coverage.unsupportedScope, unexpected: [] } } },
      { ...fixture, edges: [{ ...fixture.edges[0], unexpected: true }, fixture.edges[1]] },
      { ...fixture, edges: [{ ...fixture.edges[0], start: { ...fixture.edges[0].start, unexpected: true } }, fixture.edges[1]] },
    ];
    for (const candidate of candidates) expect(() => loadPathEvidence([candidate])).toThrow(/exact schema/i);
  });

  test('rejects an unknown normalized direction at the atomic coverage-row boundary', () => {
    expect(() => loadStationAccessibility([{ ...coverage(), normalizedDirection: 'sideways' }])).toThrow(/coverage direction is invalid/i);
  });

  test('rejects an unknown edge direction as an enum violation before package scope comparison', () => {
    const fixture = packageFixture();
    const candidate = { ...fixture, edges: [{ ...fixture.edges[0], direction: 'sideways' }, fixture.edges[1]] };
    expect(() => loadPathEvidence([candidate])).toThrow(/edge direction is invalid/i);
  });

  test.each([
    ['unknown movement enum', () => {
      const fixture = packageFixture();
      return { ...fixture, edges: [{ ...fixture.edges[0], movementType: 'teleport' }, fixture.edges[1]] };
    }],
    ['a string in place of a restrictions array', () => {
      const fixture = packageFixture();
      return { ...fixture, edges: [{ ...fixture.edges[0], restrictions: 'none' }, fixture.edges[1]] };
    }],
    ['a non-canonical review date', () => {
      const fixture = packageFixture();
      return { ...fixture, coverage: { ...fixture.coverage, productDecision: { ...fixture.coverage.productDecision, date: 'tomorrow' } } };
    }],
    ['a non-canonical verification date', () => {
      const fixture = packageFixture();
      return { ...fixture, coverage: { ...fixture.coverage, verificationDate: '2026-02-30' } };
    }],
    ['a supported route inside unsupported scope', () => {
      const fixture = packageFixture();
      return { ...fixture, coverage: { ...fixture.coverage, unsupportedScope: { ...fixture.coverage.unsupportedScope, lines: ['A'] } } };
    }],
    ['an extra path-membership key', () => {
      const fixture = packageFixture();
      return { ...fixture, coverage: { ...fixture.coverage, accessiblePathMembershipByEdge: { ...fixture.coverage.accessiblePathMembershipByEdge, 'edge-extra': true } } };
    }],
    ['duplicate route-critical equipment identities', () => {
      const fixture = packageFixture();
      const second = { ...fixture.edges[1], movementType: 'elevator', equipmentId: 'EL-A12-01' };
      return { ...fixture, coverage: { ...fixture.coverage, equipmentIds: ['EL-A12-01', 'EL-A12-01'] }, edges: [fixture.edges[0], second] };
    }],
    ['duplicate ordered edge identities', () => {
      const fixture = packageFixture();
      const second = { ...fixture.edges[1], id: 'edge-1' };
      return {
        ...fixture,
        coverage: { ...fixture.coverage, orderedEdgeIds: ['edge-1', 'edge-1'], accessiblePathMembershipByEdge: { 'edge-1': true } },
        edges: [fixture.edges[0], second],
      };
    }],
    ['a string boolean in official path membership', () => {
      const fixture = packageFixture();
      return { ...fixture, edges: [{ ...fixture.edges[0], officialAccessiblePath: 'true' }, fixture.edges[1]] };
    }],
    ['a non-string evidence-array member', () => {
      const fixture = packageFixture();
      return { ...fixture, coverage: { ...fixture.coverage, evidenceSources: [7] } };
    }],
    ['an endpoint whose required fields are inherited instead of owned', () => {
      const fixture = packageFixture();
      const inheritedEndpoint = Object.create({ id: 'street', level: 'street' }) as { id: string; level: string };
      return { ...fixture, edges: [{ ...fixture.edges[0], start: inheritedEndpoint }, fixture.edges[1]] };
    }],
  ])('rejects value-permissive path evidence: %s', (_label, candidate) => {
    expect(() => loadPathEvidence([candidate()])).toThrow();
  });

  test('requires a structured approval receipt joined to the exact package, coverage row, version, and path', () => {
    const fixture = packageFixture();
    const { approvalReceipt: _receipt, ...withoutReceipt } = fixture;
    expect(() => loadPathEvidence([fixture])).not.toThrow();
    expect(() => loadPathEvidence([{ ...withoutReceipt, approvedVersion: fixture.version }])).toThrow(/approvalReceipt|approval receipt/i);
    expect(() => loadPathEvidence([{ ...fixture, packageId: 'package-other' }])).toThrow(/approval receipt/i);
  });

  test('rejects an approval receipt that predates any edge verification in the approved package', () => {
    const fixture = packageFixture();
    const changedEdge = { ...fixture.edges[1], verificationDate: '2026-07-31' };
    expect(() => loadPathEvidence([{ ...fixture, edges: [fixture.edges[0], changedEdge] }])).toThrow(/approval.*predates/i);
  });

  test('rejects reuse of one package identity and version for a different canonical path', () => {
    const first = packageFixture();
    const secondCoverage = coverage({
      coverageRecordId: 'coverage:a12:north:a:other',
      completePathId: 'path:a12:north:a:other',
    });
    const secondBase = packageFixture({
      packageId: first.packageId,
      version: first.version,
      canonicalPathIdentity: 'path:a12:north:a:other',
      coverage: secondCoverage,
      edges: first.edges.map((edge) => ({ ...edge, canonicalPathIdentity: 'path:a12:north:a:other' })),
    });
    const second = { ...secondBase, approvalReceipt: { ...secondBase.approvalReceipt, receiptId: 'approval:package-a12-v1:other' } };
    expect(() => loadPathEvidence([first, second])).toThrow(/duplicate.*package/i);
  });

  test('rejects crowding fields from the accessibility package schema', () => {
    expect(() => loadPathEvidence([{ ...packageFixture(), crowding: { carLoad: 'low' } }])).toThrow(/crowding/i);
  });

  test('keeps optional official equipment ingestion unavailable when absent and exact-ID joined when supplied', () => {
    expect(loadOptionalOfficialEquipment(undefined)).toMatchObject({ status: 'unavailable', inventory: [], outages: [] });
    expect(loadOptionalOfficialEquipment({ inventory: [{ equipmentId: 'EL-1' }], outages: [{ equipmentId: 'EL-1', state: 'out-of-service' }], sourceTimestamp: '2026-07-30T12:00:00Z' })).toMatchObject({ status: 'accepted', inventory: [{ equipmentId: 'EL-1' }] });
    expect(() => loadOptionalOfficialEquipment({ inventory: [{ description: 'Elevator' }], outages: [], sourceTimestamp: '2026-07-30T12:00:00Z' })).toThrow(/equipmentId/);
  });

  test.each(['movementType', 'start', 'routeId', 'equipmentId', 'officialAccessiblePath', 'restrictions', 'verificationDate'])(
    'rejects a path edge missing required evidence field %s', (field) => {
      const fixture = packageFixture();
      const edge = { ...fixture.edges[0] } as Record<string, unknown>;
      delete edge[field];
      expect(() => loadPathEvidence([{ ...fixture, edges: [edge, fixture.edges[1]] }])).toThrow(new RegExp(field));
    },
  );

  test('rejects discontinuous endpoints, wrong scope, rerouted platforms, restrictions, and review-version mismatches', () => {
    const cases: AccessibilityPackage[] = [
      packageFixture({ edges: [packageFixture().edges[0], { ...packageFixture().edges[1], start: { id: 'other', level: 'mezzanine' } }] }),
      packageFixture({ coverage: coverage({ normalizedDirection: 'southbound' }) }),
      packageFixture({ coverage: coverage({ directionalPlatform: 'A12-REROUTE' }) }),
      packageFixture({ edges: [{ ...packageFixture().edges[0], restrictions: ['staff-only'] }, packageFixture().edges[1]] }),
      packageFixture({ approvalReceipt: { ...packageFixture().approvalReceipt, packageVersion: 'coverage-v2' } }),
    ];
    for (const candidate of cases) expect(() => loadPathEvidence([candidate])).toThrow();
  });

  test('keeps the production path registry empty until immutable reviewed evidence exists', () => {
    expect(PRODUCTION_PATH_REGISTRY).toEqual([]);
    expect(Object.isFrozen(PRODUCTION_PATH_REGISTRY)).toBe(true);
  });

  test('requires exact current evidence for every machine and returns Unknown without calling it an outage', () => {
    const decision = assessAccessiblePath(packageFixture(), {
      stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: { 'EL-A12-01': equipment({ snapshotScope: 'wrong-scope' }) }, exposure: validationAccessibilityExposure, ...equipmentEvidence,
    });
    expect(decision).toMatchObject({ status: 'unknown', accessibleRouteOnly: true });
    expect(decision.reason.toLowerCase()).not.toContain('outage');
  });

  test('admits one exact directional path and preserves structural-only copy when live status is unavailable', () => {
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: { 'EL-A12-01': equipment() }, exposure: validationAccessibilityExposure, ...equipmentEvidence }).status).toBe('eligible');
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'southbound', platformId: 'A12S', equipment: {}, exposure: validationAccessibilityExposure, ...equipmentEvidence }).status).toBe('ineligible');
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: {}, exposure: validationAccessibilityExposure, ...equipmentEvidence }).offlineCopy).toBe('Structurally step-free; live elevator status unavailable');
  });

  test('owns exact path scope, rider intent, equipment decisions, exposure, and intersected validity', () => {
    const machine = equipment();
    const decision = assessAccessiblePath(packageFixture(), {
      stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N',
      equipment: { 'EL-A12-01': machine }, exposure: validationAccessibilityExposure, ...equipmentEvidence,
    });
    expect(decision).toMatchObject({
      stationComplexId: 'A12', constituentStationId: 'A12', originIntent: 'origin-street', destinationIntent: 'destination-street',
      routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentIds: ['EL-A12-01'],
      equipmentDecisionIds: { 'EL-A12-01': machine.decisionId }, equipmentSourceScopeId: 'nyc-equipment',
      equipmentSourceVersion: 'equipment-v1', exposureDecisionId: validationAccessibilityExposure.decisionId,
      exposureReleaseDecisionId: validationAccessibilityExposure.releaseDecisionId, validThrough: machine.validThrough,
    });
    expect(Object.isFrozen(decision.equipmentIds)).toBe(true);
    expect(Object.isFrozen(decision.equipmentDecisionIds)).toBe(true);
  });

  test('rejects a genuine positive equipment decision after its source-validity window', () => {
    expect(assessAccessiblePath(packageFixture(), {
      stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N',
      equipment: { 'EL-A12-01': equipment() }, exposure: validationAccessibilityExposure, ...equipmentEvidence,
      decisionTime: at('2026-08-01T00:04:00.001Z'),
    }).status).toBe('unknown');
  });

  test('keeps public accessibility locked while pending and rejects wrong-version exposure', () => {
    const evidence = { stationId: 'A12', routeId: 'A', direction: 'northbound' as const, platformId: 'A12N', equipment: { 'EL-A12-01': equipment() }, ...equipmentEvidence };
    const publicExposure = resolveAccessibilityExposure(PRODUCTION_EXPOSURE_REGISTRY, 'public-accessibility-coverage-v1', 'coverage-v1', at('2026-08-01T00:00:00Z'));
    const wrongVersion = resolveAccessibilityExposure(VALIDATION_EXPOSURE_REGISTRY, 'validation-accessibility-coverage-v1', 'wrong-v2', at('2026-08-01T00:00:00Z'));
    expect(assessAccessiblePath(packageFixture(), { ...evidence, exposure: publicExposure }).status).toBe('unknown');
    expect(assessAccessiblePath(packageFixture(), { ...evidence, exposure: wrongVersion }).status).toBe('unknown');
  });

  test('rejects reuse of a genuine exposure token after its validity window', () => {
    expect(assessAccessiblePath(packageFixture(), {
      stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N',
      equipment: { 'EL-A12-01': equipment() }, exposure: validationAccessibilityExposure, ...equipmentEvidence,
      decisionTime: at('2027-07-30T23:59:59.001Z'),
    }).status).toBe('unknown');
  });

  test('rejects a caller-authored same-version approved public accessibility object', () => {
    const approved = { owner: 'accessibility', surface: 'public', packageVersion: 'coverage-v1', releaseDecisionId: 'forged', releaseStatus: 'approved' } as unknown as ResolvedAccessibilityExposure;
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: { 'EL-A12-01': equipment() }, exposure: approved, ...equipmentEvidence }).status).toBe('unknown');
  });

  test('rejects duplicate canonical path identities and uses the canonical byte order only after a full tie', () => {
    expect(() => validateAccessibilityRegistry([packageFixture(), packageFixture({ packageId: 'other' })])).toThrow(/duplicate canonical/i);
    const beta = packageFixture({ packageId: 'beta', canonicalPathIdentity: 'path:Ã©' });
    const alpha = packageFixture({ packageId: 'alpha', canonicalPathIdentity: 'path:e' });
    expect(orderAccessiblePaths([beta, alpha]).map(({ packageId }) => packageId)).toEqual(['alpha', 'beta']);
  });
});

describe('equipment decision identity at the path boundary', () => {
  test('rejects re-keying a resolved status decision to another required machine', () => {
    const otherMachine = equipment({ targetEquipmentId: 'EL-OTHER' });
    expect(otherMachine).toMatchObject({
      targetEquipmentId: 'EL-OTHER',
      evidenceOwner: 'official-equipment-status',
    });
    expect(assessAccessiblePath(packageFixture(), {
      stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N',
      equipment: { 'EL-A12-01': otherMachine }, exposure: validationAccessibilityExposure, ...equipmentEvidence,
    }).status).toBe('unknown');
  });
});
