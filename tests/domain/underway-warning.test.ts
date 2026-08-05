import { describe, expect, test } from 'vitest';
import { chooseAccessibilityAlternative, type AccessibilityAlternative } from '../../src/shared/domain/accessibility-alternatives';
import { acceptEquipmentInventory, acceptEquipmentSnapshot, assessEquipmentStatus } from '../../src/shared/domain/equipment-status';
import { classifyPathImpact, type ImpactPath } from '../../src/shared/domain/path-impact';
import { createAccessibilityWarning, deriveLastAccessibleDecisionPoint, transitionAccessibilityWarning } from '../../src/shared/domain/underway-warning';
import { resolvedPath } from '../fixtures/accessibility-decisions';

function impact() {
  const inventory = acceptEquipmentInventory({ inventoryId: 'inv', evidenceOwner: 'official-equipment-inventory', sourceScopeId: 'scope', sourceVersion: 'inv-v1', acceptedAt: '2026-07-30T00:00:00.000Z', equipmentIds: ['EL-1'] });
  const snapshot = acceptEquipmentSnapshot({ snapshotId: 'snap', evidenceOwner: 'official-equipment-status', sourceScopeId: 'scope', sourceVersion: 'status-v1', inventoryVersion: 'inv-v1', sourceTimestamp: '2026-07-30T12:00:00.000Z', acceptedAt: '2026-07-30T12:00:01.000Z', declaredRecordCount: 1, records: [{ recordId: 'out', equipmentId: 'EL-1', state: 'out-of-service' }] }, inventory);
  const changedEquipment = assessEquipmentStatus({ targetEquipmentId: 'EL-1', decisionTime: new Date('2026-07-30T12:01:00.000Z'), inventory, currentSnapshot: snapshot });
  const selectedPath: ImpactPath = { canonicalIdentity: 'selected', complexId: 'A12', origin: 'origin', destination: '168 St', routeId: 'A', direction: 'northbound', platformId: 'A12N', equipmentIds: ['EL-1'], pathDecision: resolvedPath('selected') };
  return classifyPathImpact({ changedEquipment, selectedPath, alternatePaths: [], destinationIntent: '168 St' })!;
}

function alternatives() {
  const pathDecision = resolvedPath('alt');
  const candidate: AccessibilityAlternative = { id: 'alt', label: 'Use the verified 127 St entrance path.', canonicalIdentity: 'alt', tier: 'same-complex', pathDecision, singlePointElevatorDependencies: 0, transfers: 0, accessibleWalkingMeters: 100, disruptionRisk: 0, travelSeconds: 60, includesBus: false };
  return chooseAccessibilityAlternative([candidate], { includeBuses: false });
}

function warning(phase: 'predeparture' | 'underway' = 'underway', decisionPoint: ReturnType<typeof deriveLastAccessibleDecisionPoint> = { status: 'unknown' }) {
  return createAccessibilityWarning({ fact: 'Elevator EL-1 status is Unknown.', connection: 'Northbound platform elevator', consequence: 'The selected step-free path cannot be verified right now.', freshness: 'Checked time unavailable', phase, decisionPoint, impactDecision: impact(), alternativeSelection: alternatives() });
}

describe('underway accessibility warning', () => {
  test('chooses the latest still-reachable verified decision point before the affected connection', () => {
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p2', order: 2, reachable: true, hasVerifiedSafeAction: true }, { id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true }, { id: 'p6', order: 6, reachable: true, hasVerifiedSafeAction: true }] })).toEqual({ status: 'known', pointId: 'p4' });
  });

  test('returns Unknown when reachability is unknown or the point may have passed', () => {
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 4, affectedOrder: 5, points: [{ id: 'p4', order: 4, reachable: 'unknown', hasVerifiedSafeAction: true }] })).toEqual({ status: 'unknown' });
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true, possiblyPassed: true }] })).toEqual({ status: 'unknown' });
  });

  test('distinguishes predeparture, underway known-point, and immediate states with exact warning content', () => {
    expect(warning('predeparture', { status: 'known', pointId: 'origin' }).state).toBe('predeparture-action-required');
    expect(warning('underway', { status: 'known', pointId: '59 St' }).state).toBe('underway-known-point');
    const immediate = warning();
    expect(immediate.state).toBe('underway-immediate');
    expect(immediate.content.at(-1)).toBe('Use the verified 127 St entrance path.');
  });

  test.each(['acknowledge', 'navigate', 'go-offline', 'reconnect', 'progress', 'lower-priority-recovered', 'single-machine-restored'] as const)(
    'persists through %s without silently clearing', (type) => {
      expect(transitionAccessibilityWarning(warning(), { type })).toMatchObject({ active: true, selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true });
    },
  );

  test('clears only with an opaque eligible offered replacement or exact owner path reevaluation', () => {
    const active = warning();
    expect(transitionAccessibilityWarning(active, { type: 'replacement-selected', pathDecision: resolvedPath('other') }).active).toBe(true);
    expect(transitionAccessibilityWarning(active, { type: 'replacement-selected', pathDecision: resolvedPath('alt', 'ineligible') }).active).toBe(true);
    expect(transitionAccessibilityWarning(active, { type: 'replacement-selected', pathDecision: alternatives().first!.pathDecision })).toMatchObject({ active: false, selectedPathId: 'alt' });
    expect(transitionAccessibilityWarning(active, { type: 'owner-resolved', pathDecision: resolvedPath('selected', 'ineligible') }).active).toBe(true);
    expect(transitionAccessibilityWarning(active, { type: 'owner-resolved', pathDecision: resolvedPath('selected') }).active).toBe(false);
  });

  test('rejects scalar clearing assertions and caller-authored warnings', () => {
    const active = warning();
    expect(transitionAccessibilityWarning(active, { type: 'owner-resolved', freshFullPathPassed: true } as never).active).toBe(true);
    expect(() => transitionAccessibilityWarning({ ...active } as never, { type: 'acknowledge' })).toThrow(/resolved accessibility warning/i);
  });
});
