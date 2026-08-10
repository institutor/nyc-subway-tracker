import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { expect, test, vi } from 'vitest';

import { App } from '../../src/client/App';

test('shows a rider-readable source cadence and every locked release area', async () => {
  const status = vi.fn(async () => ({
    apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'status-safe',
    decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
    gates: {}, data: {
      alerts: [], sourceHealth: [], provenance: [], explanations: [],
      diagnostics: {
        sourceSignals: [{
          source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'degraded',
          reasonCode: 'SOURCE_DEGRADED', ageSeconds: 91,
          lastAcceptedAt: '2026-08-04T11:58:29.000Z',
        }],
        exposureGates: [
          { stage: 'arrival-boards', exposed: false, reasonCode: 'GATE_0_NOT_PASSED', decision: 'NO-GO' },
          { stage: 'nearby-offline', exposed: false, reasonCode: 'NEARBY_GATE_0_NOT_PASSED', decision: 'NO-GO' },
        ],
      },
    },
  }));
  const api = {
    status,
    bootstrap: () => new Promise(() => undefined),
  } as any;

  render(<App api={api} geolocation={null} connectivity="online" />);
  fireEvent.click(screen.getByRole('button', { name: 'Data status' }));

  await waitFor(() => expect(screen.getByText('mta-realtime-ace')).toBeInTheDocument());
  expect(screen.getByText('1 min 31 sec old')).toBeInTheDocument();
  expect(screen.getByText('Delayed source updates')).toBeInTheDocument();
  expect(screen.getByText('The latest accepted update is delayed.')).toBeInTheDocument();
  expect(screen.getByText(/Last accepted.*11:58:29/i)).toBeInTheDocument();
  expect(screen.getByText('Arrival boards')).toBeInTheDocument();
  expect(screen.getByText('Nearby and offline')).toBeInTheDocument();
  expect(screen.getByText('Arrival evidence has not passed validation.')).toBeInTheDocument();
  expect(screen.queryByText(/coordinates|saved station|push endpoint/i)).not.toBeInTheDocument();
  expect(status).toHaveBeenCalledTimes(1);
});

test('advances source age monotonically from the response as-of time while the page stays open', async () => {
  vi.useFakeTimers();
  try {
    const api = {
      status: vi.fn(async () => ({
        apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'status-safe',
        decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
        runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
        gates: {}, data: { alerts: [], sourceHealth: [], provenance: [], explanations: [], diagnostics: {
          sourceSignals: [{ source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'current', reasonCode: 'SOURCE_CURRENT', ageSeconds: 10, lastAcceptedAt: '2026-08-04T11:59:50.000Z' }],
          exposureGates: [],
        } },
      })),
      bootstrap: () => new Promise(() => undefined),
    } as any;
    render(<App api={api} geolocation={null} connectivity="online" />);
    fireEvent.click(screen.getByRole('button', { name: 'Data status' }));
    await act(async () => undefined);
    expect(screen.getByText('10 sec old')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByText('40 sec old')).toBeInTheDocument();
    expect(screen.getByText(/As of.*12:00:00/i)).toBeInTheDocument();
    expect(api.status).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
