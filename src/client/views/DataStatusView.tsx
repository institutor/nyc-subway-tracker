import { useEffect, useState } from 'react';

import type { StatusEnvelopeDto, TransitApiClient } from '../api/client';

type DataStatusState =
  | { readonly phase: 'loading' }
  | { readonly phase: 'offline' | 'error' }
  | { readonly phase: 'ready'; readonly response: StatusEnvelopeDto };

const gateLabels: Readonly<Record<string, string>> = Object.freeze({
  'arrival-boards': 'Arrival boards',
  'nearby-offline': 'Nearby and offline',
  accessibility: 'Accessibility',
  guidance: 'Platform guidance',
  'maps-rights': 'Map rights',
  'commute-evaluation': 'Commute evaluation',
  'commute-silent': 'Silent commute checks',
  'commute-limited-pilot': 'Commute pilot',
  'commute-delivery': 'Commute notifications',
});

export function DataStatusView({ api, connected }: { readonly api: TransitApiClient; readonly connected: boolean }) {
  const [state, setState] = useState<DataStatusState>(connected ? { phase: 'loading' } : { phase: 'offline' });

  useEffect(() => {
    if (!connected) {
      setState({ phase: 'offline' });
      return undefined;
    }
    const controller = new AbortController();
    setState({ phase: 'loading' });
    void api.status(controller.signal).then((response) => {
      if (!controller.signal.aborted) setState({ phase: 'ready', response });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ phase: 'error' });
    });
    return () => controller.abort();
  }, [api, connected]);

  const diagnostics = state.phase === 'ready' ? state.response.data?.diagnostics : undefined;
  return (
    <section className="surface surface--data-status" aria-labelledby="data-status-heading">
      <p className="section-kicker">Source signals</p>
      <h2 id="data-status-heading" className="surface-title">Data status</h2>
      <p className="quiet-copy">See when subway sources were last accepted and which parts of the app are still held back from riders.</p>

      {state.phase === 'loading' ? <p role="status">Checking source status...</p> : null}
      {state.phase === 'offline' ? <p role="status">Offline. Current source status is unavailable.</p> : null}
      {state.phase === 'error' ? <p role="status">Source status could not be checked. No current state is being assumed.</p> : null}
      {state.phase === 'ready' && !diagnostics ? <p role="status">Data status is locked in this runtime.</p> : null}
      {diagnostics ? (
        <>
          <section aria-labelledby="source-signal-heading">
            <h3 id="source-signal-heading">Source cadence</h3>
            <div className="source-signal-strip">
              {diagnostics.sourceSignals.length === 0 ? <p>No accepted source signal is available.</p> : diagnostics.sourceSignals.map((signal) => (
                <article className={`source-signal source-signal--${signal.state}`} key={`${signal.source}:${signal.sourceId}`}>
                  <span className="source-signal__pulse" aria-hidden="true" />
                  <div>
                    <h4>{signal.sourceId}</h4>
                    <p>{sourceStateLabel(signal.state)}</p>
                  </div>
                  <p className="source-signal__age">{signal.ageSeconds === undefined ? 'Age unavailable' : ageLabel(signal.ageSeconds)}</p>
                </article>
              ))}
            </div>
          </section>
          <section aria-labelledby="release-area-heading">
            <h3 id="release-area-heading">Release areas</h3>
            <ul className="gate-status-list">
              {diagnostics.exposureGates.map((gate) => (
                <li key={gate.stage}><span>{gateLabels[gate.stage] ?? 'Unavailable area'}</span><strong>Locked</strong></li>
              ))}
            </ul>
            <p className="quiet-copy">Validation and shadow checks do not open these areas to riders.</p>
          </section>
        </>
      ) : null}
    </section>
  );
}

function sourceStateLabel(state: 'current' | 'degraded' | 'unavailable' | 'quarantined'): string {
  if (state === 'current') return 'Source updates current';
  if (state === 'degraded') return 'Delayed source updates';
  if (state === 'quarantined') return 'Source held for review';
  return 'Source unavailable';
}

function ageLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} sec old`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining === 0 ? `${minutes} min old` : `${minutes} min ${remaining} sec old`;
}
