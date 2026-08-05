import { describe, expect, test } from 'vitest';

import {
  assessAccessiblePath,
  orderAccessiblePaths,
  validateAccessibilityRegistry,
  type AccessibilityPackage,
  type StationDirectionCoverageRow,
} from '../../src/shared/domain/accessible-path';
import { assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
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
  return {
    packageId: 'package-a12-v1', version: 'coverage-v1', canonicalPathIdentity: 'path:a12:north:a', coverage: coverage(),
    edges: [
      { id: 'edge-1', order: 1, movementType: 'elevator', start: { id: 'street', level: 'street' }, end: { id: 'mezz', level: 'mezzanine' }, routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentId: 'EL-A12-01', officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30', evidenceReference: 'evidence/edge-1.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:north:a' },
      { id: 'edge-2', order: 2, movementType: 'level-path', start: { id: 'mezz', level: 'mezzanine' }, end: { id: 'platform', level: 'platform' }, routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentId: null, officialAccessiblePath: true, restrictions: ['none'], verificationDate: '2026-07-30', evidenceReference: 'evidence/edge-2.json', reviewDisposition: 'approved', canonicalPathIdentity: 'path:a12:north:a' },
    ],
    approvedVersion: 'coverage-v1',
    ...overrides,
  };
}

function equipment(overrides: Record<string, unknown> = {}) {
  return assessEquipmentStatus({
    targetEquipmentId: 'EL-A12-01', sourceTimestamp: at('2026-07-30T12:00:00Z'), decisionTime: at('2026-07-30T12:02:00Z'),
    retrievalSucceeded: true, structureValid: true, complete: true, internallyConsistent: true, joinable: true,
    records: [{ equipmentId: 'EL-OTHER', state: 'out-of-service' }], totalRecordCount: 1, badRecordCount: 0,
    inventory: { acceptedAt: at('2026-07-30T00:00:00Z'), equipmentIds: ['EL-A12-01', 'EL-OTHER'] }, ...overrides,
  });
}

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
      packageFixture({ approvedVersion: 'coverage-v2' }),
    ];
    for (const candidate of cases) expect(() => loadPathEvidence([candidate])).toThrow();
  });

  test('keeps the production path registry empty until immutable reviewed evidence exists', () => {
    expect(PRODUCTION_PATH_REGISTRY).toEqual([]);
    expect(Object.isFrozen(PRODUCTION_PATH_REGISTRY)).toBe(true);
  });

  test('requires exact current evidence for every machine and returns Unknown without calling it an outage', () => {
    const decision = assessAccessiblePath(packageFixture(), {
      stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: { 'EL-A12-01': equipment({ joinable: false }) },
    });
    expect(decision).toMatchObject({ status: 'unknown', accessibleRouteOnly: true });
    expect(decision.reason.toLowerCase()).not.toContain('outage');
  });

  test('admits one exact directional path and preserves structural-only copy when live status is unavailable', () => {
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: { 'EL-A12-01': equipment() } }).status).toBe('eligible');
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'southbound', platformId: 'A12S', equipment: {} }).status).toBe('ineligible');
    expect(assessAccessiblePath(packageFixture(), { stationId: 'A12', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipment: {} }).offlineCopy).toBe('Structurally step-free; live elevator status unavailable');
  });

  test('rejects duplicate canonical path identities and uses the canonical byte order only after a full tie', () => {
    expect(() => validateAccessibilityRegistry([packageFixture(), packageFixture({ packageId: 'other' })])).toThrow(/duplicate canonical/i);
    const beta = packageFixture({ packageId: 'beta', canonicalPathIdentity: 'path:é' });
    const alpha = packageFixture({ packageId: 'alpha', canonicalPathIdentity: 'path:e' });
    expect(orderAccessiblePaths([beta, alpha]).map(({ packageId }) => packageId)).toEqual(['alpha', 'beta']);
  });
});

describe('official equipment truth', () => {
  test.each([
    ['2026-07-30T12:05:00Z', 'current'], ['2026-07-30T12:05:01Z', 'degraded'],
    ['2026-07-30T12:15:00Z', 'degraded'], ['2026-07-30T12:15:01Z', 'unavailable'],
  ])('classifies exact equipment age boundary %s as %s', (decisionTime, health) => {
    expect(equipment({ decisionTime: at(decisionTime) }).health).toBe(health);
  });

  test('makes invalid chronology and impossible inventory joins unavailable', () => {
    expect(equipment({ decisionTime: at('2026-07-30T11:59:59Z') }).health).toBe('unavailable');
    expect(equipment({ joinable: false }).health).toBe('unavailable');
  });

  test('keeps first empty provisional and confirms a second only at the exact one-minute boundary', () => {
    const empty = { records: [], totalRecordCount: 0, badRecordCount: 0, previousZeroSnapshotAt: at('2026-07-30T12:00:00Z') };
    expect(equipment({ ...empty, sourceTimestamp: at('2026-07-30T12:00:59Z'), decisionTime: at('2026-07-30T12:01:00Z') }).state).toBe('unknown');
    expect(equipment({ ...empty, sourceTimestamp: at('2026-07-30T12:01:00Z'), decisionTime: at('2026-07-30T12:01:01Z') }).state).toBe('no-official-outage-reported');
    expect(equipment({ ...empty, previousZeroSnapshotAt: undefined }).provisionalEmpty).toBe(true);
  });

  test('admits exact-target absence only in a healthy non-empty same-scope population', () => {
    expect(equipment().state).toBe('no-official-outage-reported');
    expect(equipment({ records: [{ equipmentId: 'EL-UNKNOWN', state: 'out-of-service' }] }).state).toBe('unknown');
  });

  test('uses strict population anomaly boundaries while contextual inconsistency can still degrade', () => {
    expect(equipment({ previousActiveOutageIds: Array.from({ length: 100 }, (_, i) => `EQ-${i}`), records: Array.from({ length: 50 }, (_, i) => ({ equipmentId: `EQ-${i}`, state: 'out-of-service' })), totalRecordCount: 50, inventory: { acceptedAt: at('2026-07-30T00:00:00Z'), equipmentIds: ['EL-A12-01', ...Array.from({ length: 100 }, (_, i) => `EQ-${i}`)] } }).health).toBe('current');
    expect(equipment({ previousActiveOutageIds: Array.from({ length: 100 }, (_, i) => `EQ-${i}`), records: Array.from({ length: 49 }, (_, i) => ({ equipmentId: `EQ-${i}`, state: 'out-of-service' })), totalRecordCount: 49, inventory: { acceptedAt: at('2026-07-30T00:00:00Z'), equipmentIds: ['EL-A12-01', ...Array.from({ length: 100 }, (_, i) => `EQ-${i}`)] } }).health).toBe('degraded');
    expect(equipment({ totalRecordCount: 10, badRecordCount: 1 }).health).toBe('current');
    expect(equipment({ totalRecordCount: 100, badRecordCount: 11 }).health).toBe('degraded');
    expect(equipment({ contextualInconsistency: true }).health).toBe('degraded');
  });

  test('records daily review breach and fails closed at exactly seven days', () => {
    expect(equipment({ decisionTime: at('2026-07-30T12:00:00Z'), inventory: { acceptedAt: at('2026-07-24T12:00:00Z'), equipmentIds: ['EL-A12-01', 'EL-OTHER'] } }).inventoryReview).toBe('overdue');
    const expired = equipment({ decisionTime: at('2026-07-30T12:00:00Z'), inventory: { acceptedAt: at('2026-07-23T12:00:00Z'), equipmentIds: ['EL-A12-01', 'EL-OTHER'] } });
    expect(expired).toMatchObject({ inventoryReview: 'expired', state: 'unknown' });
  });

  test('requires explicit restoration or two consecutive omissions at least one minute apart', () => {
    expect(equipment({ priorOutage: true, omissionTimestamps: [at('2026-07-30T12:01:00Z')] }).state).toBe('out-of-service-rechecking');
    expect(equipment({ priorOutage: true, omissionTimestamps: [at('2026-07-30T12:01:00Z'), at('2026-07-30T12:01:59Z')] }).restored).toBe(false);
    expect(equipment({ priorOutage: true, omissionTimestamps: [at('2026-07-30T12:01:00Z'), at('2026-07-30T12:02:00Z')] }).restored).toBe(true);
    expect(equipment({ priorOutage: true, explicitRestoration: true }).restored).toBe(true);
    expect(equipment({ priorOutage: true, omissionTimestamps: [at('2026-07-30T12:01:00Z'), null, at('2026-07-30T12:02:00Z')] }).restored).toBe(false);
    expect(equipment({ priorOutage: true, omissionTimestamps: [at('2026-07-30T12:01:00Z'), at('2026-07-30T12:03:00Z')], decisionTime: at('2026-07-30T12:02:00Z') }).restored).toBe(false);
  });

  test('shows governed freshness and preserves stale or missing outage evidence without positive copy', () => {
    expect(equipment().freshnessCopy).toBe('Checked 2 min ago');
    const missing = equipment({ sourceTimestamp: undefined });
    expect(missing).toMatchObject({ health: 'unavailable', state: 'unknown', freshnessCopy: 'Checked time unavailable' });
    expect(`${missing.state} ${missing.freshnessCopy}`.toLowerCase()).not.toMatch(/\b(?:working|available)\b/);
  });
});
