import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { AccessibilityPanel, ValidationAccessibilityPanel } from '../../src/client/components/AccessibilityPanel';
import { PlatformGuidance, ValidationPlatformGuidance } from '../../src/client/components/PlatformGuidance';
import type { ResolvedAccessiblePathDecision } from '../../src/shared/domain/accessible-path';
import { resolvedAlternativeSelection, resolvedEquipmentStatus, resolvedWarning } from '../fixtures/accessibility-decisions';
import { transitionAccessibilityWarning } from '../../src/shared/domain/underway-warning';
import { resolvedPath } from '../fixtures/accessibility-decisions';
import { resolvedValidationGuidance } from '../fixtures/platform-guidance';

const selectedPath = resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' });
const alternative = resolvedAlternativeSelection(selectedPath);
const warning = resolvedWarning(selectedPath, alternative);
const decisionTime = new Date('2026-08-01T00:02:00.000Z');

describe('accessible-path rider panel', () => {
  test('renders the warning and safe action first visually and in assistive DOM order', () => {
    const { container } = render(<ValidationAccessibilityPanel warning={warning} path={selectedPath} equipment={[]} alternative={alternative} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(container.firstElementChild?.firstElementChild?.getAttribute('role')).toBe('alert');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Official status: EL-1 is out of service.');
    expect(screen.getByRole('button', { name: 'Use the verified same-complex path.' })).toBeTruthy();
  });

  test('never auto-selects a replacement and keeps explicit action keyboard-operable', () => {
    let selected = '';
    render(<ValidationAccessibilityPanel warning={warning} path={selectedPath} equipment={[]} alternative={alternative} onSelectAlternative={(id) => { selected = id; }} decisionTime={decisionTime} />);
    expect(selected).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Use the verified same-complex path.' }));
    expect(selected).toBe('alt');
  });

  test('omits guidance completely, visibly and assistively, when no exact record exists', () => {
    const { container } = render(<PlatformGuidance guidance={undefined} decisionTime={decisionTime} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('region', { name: /platform guidance/i })).toBeNull();
  });

  test('public components omit genuine validation-surface artifacts', () => {
    const { rerender } = render(<AccessibilityPanel warning={warning} path={resolvedPath('selected')} equipment={[]} alternative={alternative} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Complete path verified')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<PlatformGuidance guidance={resolvedValidationGuidance()} decisionTime={decisionTime} />);
    expect(screen.queryByRole('region', { name: /platform guidance/i })).toBeNull();

    rerender(<ValidationPlatformGuidance guidance={resolvedValidationGuidance()} decisionTime={decisionTime} />);
    expect(screen.getByRole('region', { name: /platform guidance/i })).toBeTruthy();
  });

  test('does not render a positive path or guidance claim from caller-authored scalar objects', () => {
    const forgedGuidance = { position: 'front', zoneBenefit: 'front|Caller says best' } as never;
    const forgedPath = { status: 'eligible' } as unknown as ResolvedAccessiblePathDecision;
    const { rerender } = render(<AccessibilityPanel warning={null} path={forgedPath} equipment={[]} alternative={null} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.queryByText('Complete path verified')).toBeNull();

    rerender(<PlatformGuidance guidance={forgedGuidance} decisionTime={decisionTime} />);
    expect(screen.queryByRole('region', { name: /platform guidance/i })).toBeNull();
    expect(screen.queryByText(/Board near the front/i)).toBeNull();

    rerender(<AccessibilityPanel warning={null} path={undefined} equipment={[{ id: 'EL-1', label: 'Elevator', state: 'no-official-outage-reported', freshnessCopy: 'Checked now', required: true }] as never} alternative={null} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.queryByText('No official outage reported')).toBeNull();

    rerender(<ValidationAccessibilityPanel warning={{ ...warning } as never} path={resolvedPath('selected')} equipment={[]} alternative={{ ...alternative } as never} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<ValidationAccessibilityPanel warning={warning} path={resolvedPath('selected')} equipment={[]} alternative={{ ...alternative } as never} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('does not render or invoke an offer from a selection unrelated to the warning receipt', () => {
    let selected = '';
    const unrelated = resolvedAlternativeSelection(resolvedPath('other-selected'));
    render(<ValidationAccessibilityPanel warning={warning} path={selectedPath} equipment={[]} alternative={unrelated} onSelectAlternative={(id) => { selected = id; }} decisionTime={decisionTime} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(selected).toBe('');
  });

  test('does not replay a separately resolved lookalike selection against the warning-owned receipt', () => {
    const replay = resolvedAlternativeSelection(selectedPath);
    expect(replay).not.toBe(alternative);
    expect(replay.decisionId).toBe(alternative.decisionId);
    render(<ValidationAccessibilityPanel warning={warning} path={selectedPath} equipment={[]} alternative={replay} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('does not render a genuine warning for an unrelated displayed path', () => {
    const unrelatedPath = resolvedPath('other-selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' });
    render(<ValidationAccessibilityPanel warning={resolvedWarning(unrelatedPath)} path={selectedPath} equipment={[]} alternative={null} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('keeps a warning visible for a newer current evaluation of the same exact path scope', () => {
    const laterDecisionTime = new Date('2026-08-01T00:03:00.000Z');
    const newerSamePath = resolvedPath('selected', 'eligible', {
      equipmentIds: ['EL-1'],
      destinationIntent: '168 St',
      decisionTime: laterDecisionTime.toISOString(),
    });
    render(<ValidationAccessibilityPanel warning={warning} path={newerSamePath} equipment={[]} alternative={null} onSelectAlternative={() => undefined} decisionTime={laterDecisionTime} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  test('keeps an active offline warning visible after the positive selected-path receipt expires', () => {
    const offlineWarning = transitionAccessibilityWarning(warning, { type: 'go-offline' }, new Date('2026-08-01T00:03:00.000Z'));
    render(<ValidationAccessibilityPanel
      warning={offlineWarning}
      path={selectedPath}
      equipment={[]}
      alternative={alternative}
      onSelectAlternative={() => undefined}
      decisionTime={new Date('2026-08-01T00:06:00.001Z')}
    />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Current path not verified')).toBeTruthy();
    expect(screen.queryByText('Use the verified same-complex path.')).toBeNull();
    expect(screen.getByText('No current verified replacement is available; wait for a fresh accessible route.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('does not render a genuine same-machine equipment receipt that the displayed path did not own', () => {
    const unrelatedReceipt = resolvedEquipmentStatus('EL-1', 'different-snapshot');
    render(<ValidationAccessibilityPanel
      warning={null}
      path={selectedPath}
      equipment={[{ decision: unrelatedReceipt, label: 'Elevator EL-1', required: true }]}
      alternative={null}
      onSelectAlternative={() => undefined}
      decisionTime={decisionTime}
    />);
    expect(screen.queryByRole('list', { name: 'Path equipment status' })).toBeNull();
    expect(screen.queryByText('No official outage reported')).toBeNull();
  });

  test('contains no crowding schema, copy, control, placeholder, or proxy surface', () => {
    const { container } = render(<AccessibilityPanel warning={null} path={undefined} equipment={[]} alternative={null} onSelectAlternative={() => undefined} decisionTime={decisionTime} />);
    expect(container.textContent?.toLowerCase()).not.toContain('crowd');
    expect(JSON.stringify({ warning, pathStatus: 'unknown' }).toLowerCase()).not.toContain('crowd');
    expect(container.querySelector('[data-crowding], [aria-label*="crowd" i]')).toBeNull();
  });
});
