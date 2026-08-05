import type { RuntimeDto } from '../api/client';

export function AppHeader({ runtime }: { readonly runtime?: RuntimeDto }) {
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
    </header>
  );
}
