import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { AccessibilityPanel } from '../../src/client/components/AccessibilityPanel';
import { PlatformGuidance } from '../../src/client/components/PlatformGuidance';
import type { ResolvedAccessiblePathDecision } from '../../src/shared/domain/accessible-path';
import { resolvedAlternativeSelection, resolvedWarning } from '../fixtures/accessibility-decisions';

const warning = resolvedWarning();
const alternative = resolvedAlternativeSelection();

describe('accessible-path rider panel', () => {
  test('renders the warning and safe action first visually and in assistive DOM order', () => {
    const { container } = render(<AccessibilityPanel warning={warning} path={undefined} equipment={[]} alternative={alternative} onSelectAlternative={() => undefined} />);
    expect(container.firstElementChild?.firstElementChild?.getAttribute('role')).toBe('alert');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Elevator status is Unknown.');
    expect(screen.getByRole('button', { name: 'Use the verified same-complex path.' })).toBeTruthy();
  });

  test('never auto-selects a replacement and keeps explicit action keyboard-operable', () => {
    let selected = '';
    render(<AccessibilityPanel warning={warning} path={undefined} equipment={[]} alternative={alternative} onSelectAlternative={(id) => { selected = id; }} />);
    expect(selected).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Use the verified same-complex path.' }));
    expect(selected).toBe('alt');
  });

  test('omits guidance completely, visibly and assistively, when no exact record exists', () => {
    const { container } = render(<PlatformGuidance guidance={undefined} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('region', { name: /platform guidance/i })).toBeNull();
  });

  test('does not render a positive path or guidance claim from caller-authored scalar objects', () => {
    const forgedGuidance = { position: 'front', zoneBenefit: 'front|Caller says best' } as never;
    const forgedPath = { status: 'eligible' } as unknown as ResolvedAccessiblePathDecision;
    const { rerender } = render(<AccessibilityPanel warning={null} path={forgedPath} equipment={[]} alternative={null} onSelectAlternative={() => undefined} />);
    expect(screen.queryByText('Complete path verified')).toBeNull();

    rerender(<PlatformGuidance guidance={forgedGuidance} />);
    expect(screen.queryByRole('region', { name: /platform guidance/i })).toBeNull();
    expect(screen.queryByText(/Board near the front/i)).toBeNull();

    rerender(<AccessibilityPanel warning={null} path={undefined} equipment={[{ id: 'EL-1', label: 'Elevator', state: 'no-official-outage-reported', freshnessCopy: 'Checked now', required: true }] as never} alternative={null} onSelectAlternative={() => undefined} />);
    expect(screen.queryByText('No official outage reported')).toBeNull();

    rerender(<AccessibilityPanel warning={{ ...warning } as never} path={undefined} equipment={[]} alternative={{ ...alternative } as never} onSelectAlternative={() => undefined} />);
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<AccessibilityPanel warning={warning} path={undefined} equipment={[]} alternative={{ ...alternative } as never} onSelectAlternative={() => undefined} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('contains no crowding schema, copy, control, placeholder, or proxy surface', () => {
    const { container } = render(<AccessibilityPanel warning={null} path={undefined} equipment={[]} alternative={null} onSelectAlternative={() => undefined} />);
    expect(container.textContent?.toLowerCase()).not.toContain('crowd');
    expect(JSON.stringify({ warning, pathStatus: 'unknown' }).toLowerCase()).not.toContain('crowd');
    expect(container.querySelector('[data-crowding], [aria-label*="crowd" i]')).toBeNull();
  });
});
