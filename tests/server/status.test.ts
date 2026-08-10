import { describe, expect, test } from 'vitest';

import { createApp } from '../../src/server/app';
import { createProductionDependencies } from '../../src/server/bootstrap';
import { createFixedClock } from '../../src/shared/domain/clock';
import { withApi } from '../helpers/api-harness';

const NOW = new Date('2026-08-04T12:00:00.000Z');

function dependencies(mode: 'validation' | 'live' | 'shadow' = 'validation') {
  return createProductionDependencies({
    mode,
    dataDirectory: '.data',
    sources: {},
  }, {
    clock: createFixedClock(NOW),
    snapshotProvider: {
      capture: () => ({
        identity: 'status-diagnostic-fixture',
        sourceHealth: [{
          source: 'gtfs-rt',
          sourceId: 'subway-rt-ace',
          state: 'degraded',
          assessedAt: '2026-08-04T11:59:50.000Z',
          lastAcceptedAt: '2026-08-04T11:58:29.000Z',
          reasonCode: 'provider-detail-must-not-escape',
        }],
        provenance: [{
          source: 'gtfs-rt',
          sourceId: 'subway-rt-ace',
          observedAt: '2026-08-04T11:58:28.000Z',
          retrievedAt: '2026-08-04T11:58:29.000Z',
          version: 'secret-feed-version',
        }],
        boards: [],
        riderLocation: { latitude: 40.7, longitude: -74 },
        savedRecords: [{ label: 'Home', stationId: 'A12' }],
        activeTrip: { cursor: 'A12N', endpoint: 'push-secret' },
      } as never),
    },
  });
}

describe('bounded status diagnostics', () => {
  test('shows exact source age and public reason while keeping every immutable exposure stage locked', async () => {
    await withApi(createApp(dependencies()), async (api) => {
      const response = await api.request('/api/v1/status');
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.data.diagnostics.sourceSignals).toEqual([{
        source: 'gtfs-rt',
        sourceId: 'mta-realtime-ace',
        state: 'degraded',
        reasonCode: 'SOURCE_DEGRADED',
        ageSeconds: 91,
        lastAcceptedAt: '2026-08-04T11:58:29.000Z',
      }]);
      expect(body.data.diagnostics.exposureGates).toHaveLength(9);
      expect(body.data.diagnostics.exposureGates.every((gate: any) => gate.exposed === false)).toBe(true);
      expect(body.data.diagnostics.exposureGates[0]).toEqual({
        stage: 'arrival-boards',
        exposed: false,
        reasonCode: 'GATE_0_NOT_PASSED',
        decision: body.gates['arrival-boards'].decision,
      });
    });
  });

  test('omits rider, coordinate, permission, notification, secret, and joinable fields', async () => {
    await withApi(createApp(dependencies()), async (api) => {
      const response = await api.request('/api/v1/status');
      const serialized = JSON.stringify(await response.json());

      expect(serialized).not.toMatch(/latitude|longitude|coordinate|savedRecords|Home|activeTrip|cursor|permission|push-secret|secret-feed-version|provider-detail/i);
    });
  });

  test.each(['live', 'shadow'] as const)('%s mode keeps diagnostics isolated and rider status data omitted', async (mode) => {
    await withApi(createApp(dependencies(mode)), async (api) => {
      const response = await api.request('/api/v1/status');
      const body = await response.json() as any;

      expect(body.runtime).toEqual({ mode, surface: 'public', availability: 'locked' });
      expect(body.data).toBeNull();
      expect(body).not.toHaveProperty('diagnostics');
      expect(body.gates['arrival-boards'].exposed).toBe(false);
    });
  });
});
