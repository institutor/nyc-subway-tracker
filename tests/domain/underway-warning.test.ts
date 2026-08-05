import { describe, expect, test } from 'vitest';
import { createAccessibilityWarning, deriveLastAccessibleDecisionPoint, transitionAccessibilityWarning } from '../../src/shared/domain/underway-warning';

describe('underway accessibility warning', () => {
  test('chooses the latest still-reachable verified decision point before the affected connection', () => {
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p2', order: 2, reachable: true, hasVerifiedSafeAction: true }, { id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true }, { id: 'p6', order: 6, reachable: true, hasVerifiedSafeAction: true }] })).toEqual({ status: 'known', pointId: 'p4' });
  });

  test('returns Unknown when reachability is unknown or the point may have passed', () => {
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 4, affectedOrder: 5, points: [{ id: 'p3', order: 3, reachable: 'unknown', hasVerifiedSafeAction: true }] })).toEqual({ status: 'unknown' });
  });

  test('warns immediately when an otherwise reachable decision point may already have passed', () => {
    expect(deriveLastAccessibleDecisionPoint({ cursorOrder: 1, affectedOrder: 5, points: [{ id: 'p4', order: 4, reachable: true, hasVerifiedSafeAction: true, possiblyPassed: true }] })).toEqual({ status: 'unknown' });
  });

  test('distinguishes predeparture, underway known-point, and immediate states with exact warning content', () => {
    const base = { fact: 'Elevator EL-1 status is Unknown.', connection: 'Northbound platform elevator', consequence: 'The selected step-free path cannot be verified right now.', freshness: 'Checked time unavailable', safeAction: 'Use the verified 127 St entrance path.', selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true };
    expect(createAccessibilityWarning({ ...base, phase: 'predeparture', decisionPoint: { status: 'known', pointId: 'origin' } }).state).toBe('predeparture-action-required');
    expect(createAccessibilityWarning({ ...base, phase: 'underway', decisionPoint: { status: 'known', pointId: '59 St' } }).state).toBe('underway-known-point');
    const immediate = createAccessibilityWarning({ ...base, phase: 'underway', decisionPoint: { status: 'unknown' } });
    expect(immediate.state).toBe('underway-immediate');
    expect(immediate.content).toEqual([base.fact, base.connection, base.consequence, 'Warn now—the last accessible decision point is not confirmed.', base.freshness, base.safeAction]);
  });

  test.each(['acknowledge', 'navigate', 'go-offline', 'reconnect', 'progress', 'lower-priority-recovered', 'single-machine-restored'] as const)(
    'persists through %s without silently clearing', (type) => {
      const warning = createAccessibilityWarning({ fact: 'Status Unknown.', connection: 'Transfer elevator', consequence: 'Path not verified.', freshness: 'Checked time unavailable', safeAction: 'Stay on this verified path.', phase: 'underway', decisionPoint: { status: 'unknown' }, selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true });
      expect(transitionAccessibilityWarning(warning, { type })).toMatchObject({ active: true, selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true });
    },
  );

  test('clears only after explicit still-passing replacement or owner resolution plus fresh full-path pass', () => {
    const warning = createAccessibilityWarning({ fact: 'Out of service.', connection: 'Exit elevator', consequence: 'Path blocked.', freshness: 'Checked 1 min ago', safeAction: 'Use alternate.', phase: 'underway', decisionPoint: { status: 'known', pointId: '59 St' }, selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true });
    expect(transitionAccessibilityWarning(warning, { type: 'replacement-selected', pathId: 'alt', stillPassing: false }).active).toBe(true);
    expect(transitionAccessibilityWarning(warning, { type: 'replacement-selected', pathId: 'alt', stillPassing: true })).toMatchObject({ active: false, selectedPathId: 'alt' });
    expect(transitionAccessibilityWarning(warning, { type: 'owner-resolved', freshFullPathPassed: false }).active).toBe(true);
    expect(transitionAccessibilityWarning(warning, { type: 'owner-resolved', freshFullPathPassed: true }).active).toBe(false);
  });
});
