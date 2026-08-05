import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { AccessibilityPanel } from '../../src/client/components/AccessibilityPanel';
import { PlatformGuidance } from '../../src/client/components/PlatformGuidance';

const warning = { active: true as const, state: 'underway-immediate' as const, priority: 'urgent' as const, content: ['Elevator status is Unknown.', 'Northbound transfer elevator', 'The selected step-free path cannot be verified right now.', 'Warn now—the last accessible decision point is not confirmed.', 'Checked time unavailable', 'Use the verified same-complex path.'], selectedPathId: 'selected', destinationIntent: '168 St', accessibleRouteOnly: true, acknowledged: false, stale: false };

describe('accessible-path rider panel', () => {
  test('renders the warning and safe action first visually and in assistive DOM order', () => {
    const { container } = render(<AccessibilityPanel warning={warning} pathStatus="unknown" equipment={[{ id: 'EL-1', label: 'Transfer elevator', state: 'unknown', freshnessCopy: 'Checked time unavailable', required: true }]} alternative={{ id: 'alt', label: 'Use the verified same-complex path.' }} onSelectAlternative={() => undefined} />);
    expect(container.firstElementChild?.firstElementChild?.getAttribute('role')).toBe('alert');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Elevator status is Unknown.');
    expect(screen.getByRole('button', { name: 'Use the verified same-complex path.' })).toBeTruthy();
  });

  test('never auto-selects a replacement and keeps explicit action keyboard-operable', () => {
    let selected = '';
    render(<AccessibilityPanel warning={warning} pathStatus="unknown" equipment={[]} alternative={{ id: 'alt', label: 'Use alternate path' }} onSelectAlternative={(id) => { selected = id; }} />);
    expect(selected).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Use alternate path' }));
    expect(selected).toBe('alt');
  });

  test('omits guidance completely, visibly and assistively, when no exact record exists', () => {
    const { container } = render(<PlatformGuidance guidance={undefined} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('region', { name: /platform guidance/i })).toBeNull();
  });

  test('contains no crowding schema, copy, control, placeholder, or proxy surface', () => {
    const { container } = render(<AccessibilityPanel warning={null} pathStatus="eligible" equipment={[]} alternative={null} onSelectAlternative={() => undefined} />);
    expect(container.textContent?.toLowerCase()).not.toContain('crowd');
    expect(JSON.stringify({ warning, pathStatus: 'unknown' }).toLowerCase()).not.toContain('crowd');
    expect(container.querySelector('[data-crowding], [aria-label*="crowd" i]')).toBeNull();
  });
});
