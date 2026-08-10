import type { RuntimeDto } from '../api/client';
import type { AppState } from '../state/app-state';

export function AppHeader({
  runtime,
  activeUtility,
  onUtilityChange,
}: {
  readonly runtime?: RuntimeDto;
  readonly activeUtility?: Extract<AppState['surface'], 'data-status' | 'settings'>;
  readonly onUtilityChange: (surface: Extract<AppState['surface'], 'data-status' | 'settings'>) => void;
}) {
  const status = runtime?.surface === 'demonstration'
    ? 'Validation view'
    : runtime?.availability === 'locked'
      ? 'Public data locked'
      : 'Subway first';
  return (
    <header className="app-header">
      <div className="brand-line">
        <span className="brand-kicker">Subway First</span>
        <span className="unofficial-badge">Unofficial</span>
        <span className="runtime-label">{status}</span>
      </div>
      <h1 id="app-title">NYC Subway Train Time Tracker</h1>
      <p className="purpose-copy">Use your location to show nearby subway entrances and live arrivals.</p>
      <nav className="utility-nav" aria-label="App information and controls">
        <button type="button" aria-current={activeUtility === 'data-status' ? 'page' : undefined} onClick={() => onUtilityChange('data-status')}>Data status</button>
        <button type="button" aria-current={activeUtility === 'settings' ? 'page' : undefined} onClick={() => onUtilityChange('settings')}>Settings</button>
      </nav>
    </header>
  );
}
