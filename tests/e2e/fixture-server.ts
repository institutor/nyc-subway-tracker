import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { build } from 'vite';

import { createApp } from '../../src/server/app';
import type { DecisionSnapshot } from '../../src/server/api/decision-snapshot';
import { createProductionDependencies } from '../../src/server/bootstrap';
import type { BoardDecision } from '../../src/shared/domain/types';
import { journeyGraphFixture } from '../helpers/journey-graph-fixture';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const clientDirectory = resolve(projectRoot, 'dist/client');
const fixtureOrigin = '127.0.0.1';
const fixturePort = 4173;

interface FixtureState {
  boardTransport: 'ok' | 'drop';
  overlay: 'ready' | 'missing';
}

const state: FixtureState = { boardTransport: 'ok', overlay: 'ready' };
const requestLog: string[] = [];
let snapshotSequence = 0;
let lastClockMillisecond = 0;

const fixtureClock = Object.freeze({
  now(): Date {
    lastClockMillisecond = Math.max(Date.now(), lastClockMillisecond + 1);
    return new Date(lastClockMillisecond);
  },
});

const catalog = {
  contentVersion: 'catalog-browser-fixture-v1',
  complexes: [
    {
      id: 'A12',
      name: '125 St',
      routeIds: ['A', 'C'],
      constituents: [{ id: 'A12', name: '125 St', directionalStopIds: ['A12N', 'A12S'] }],
    },
    {
      id: 'R20',
      name: 'Canal St',
      routeIds: ['N', 'Q', 'R', 'W'],
      constituents: [{ id: 'R20', name: 'Canal St', directionalStopIds: ['R20N', 'R20S'] }],
    },
  ],
} as const;

const mapReferences = {
  day: {
    contentVersion: 'map-day-browser-fixture-v1',
    attribution: 'Unofficial app-owned subway reference geometry',
    features: [
      {
        id: 'segment-a-uptown',
        kind: 'line',
        routeIds: ['A'],
        geometry: { type: 'LineString', coordinates: [[-73.952, 40.811], [-74.002, 40.719]] },
      },
      {
        id: 'station-a12',
        kind: 'station',
        routeIds: ['A', 'C'],
        geometry: { type: 'Point', coordinates: [-73.952, 40.811] },
      },
      {
        id: 'station-r20',
        kind: 'station',
        routeIds: ['N', 'Q', 'R', 'W'],
        geometry: { type: 'Point', coordinates: [-74.002, 40.719] },
      },
    ],
  },
  night: {
    contentVersion: 'map-night-browser-fixture-v1',
    attribution: 'Unofficial app-owned subway reference geometry',
    features: [
      {
        id: 'segment-a-uptown',
        kind: 'line',
        routeIds: ['A'],
        geometry: { type: 'LineString', coordinates: [[-73.952, 40.811], [-74.002, 40.719]] },
      },
      {
        id: 'station-a12',
        kind: 'station',
        routeIds: ['A'],
        geometry: { type: 'Point', coordinates: [-73.952, 40.811] },
      },
      {
        id: 'station-r20',
        kind: 'station',
        routeIds: ['N'],
        geometry: { type: 'Point', coordinates: [-74.002, 40.719] },
      },
    ],
  },
} as const;

const dependencies = createProductionDependencies({
  dataDirectory: resolve(projectRoot, '.data-browser-fixture-do-not-read'),
  mode: 'validation',
  sources: {},
}, {
  clock: fixtureClock,
  catalog,
  mapReferences,
  snapshotProvider: Object.freeze({ capture: createSnapshot }),
});

await build({ configFile: resolve(projectRoot, 'vite.config.ts') });

const fixture = express();
fixture.disable('x-powered-by');
fixture.use(express.json({ limit: '4kb', strict: true }));
fixture.get('/__test/health', (_request, response) => response.status(200).json({ ready: true }));
fixture.post('/__test/reset', (_request, response) => {
  state.boardTransport = 'ok';
  state.overlay = 'ready';
  requestLog.length = 0;
  response.status(204).end();
});
fixture.post('/__test/state', (request, response) => {
  const candidate = request.body as Partial<FixtureState>;
  if (candidate.boardTransport !== undefined) {
    if (candidate.boardTransport !== 'ok' && candidate.boardTransport !== 'drop') {
      response.status(400).json({ error: 'invalid board transport' });
      return;
    }
    state.boardTransport = candidate.boardTransport;
  }
  if (candidate.overlay !== undefined) {
    if (candidate.overlay !== 'ready' && candidate.overlay !== 'missing') {
      response.status(400).json({ error: 'invalid overlay state' });
      return;
    }
    state.overlay = candidate.overlay;
  }
  response.status(204).end();
});
fixture.get('/__test/requests', (_request, response) => response.status(200).json({ requests: [...requestLog] }));
fixture.post('/__test/requests/clear', (_request, response) => {
  requestLog.length = 0;
  response.status(204).end();
});
fixture.use((request, response, next) => {
  if (!request.path.startsWith('/api/v1/')) {
    next();
    return;
  }
  requestLog.push(`${request.method} ${request.path}`);
  if (state.boardTransport === 'drop' && /^\/api\/v1\/stations\/[^/]+\/board$/.test(request.path)) {
    response.destroy();
    return;
  }
  next();
});
fixture.use(express.static(clientDirectory, { dotfiles: 'allow', index: false }));
fixture.get('/', (_request, response) => response.sendFile(
  resolve(clientDirectory, 'index.html'),
  { dotfiles: 'allow' },
));
fixture.use(createApp(dependencies));

const listener = fixture.listen(fixturePort, fixtureOrigin);
await once(listener, 'listening');

const close = () => listener.close();
process.once('SIGINT', close);
process.once('SIGTERM', close);

function createSnapshot(): DecisionSnapshot {
  snapshotSequence += 1;
  const capturedAt = new Date(Date.now() - 25);
  const observedAt = new Date(capturedAt.getTime() - 2_000);
  const retrievedAt = new Date(capturedAt.getTime() - 1_000);
  const board = createBoard(capturedAt, observedAt, retrievedAt);
  return {
    identity: `browser-fixture-snapshot-${snapshotSequence}`,
    sourceHealth: [
      {
        source: 'gtfs-rt',
        sourceId: 'subway-rt-ace',
        state: 'current',
        assessedAt: capturedAt.toISOString(),
        lastAcceptedAt: retrievedAt.toISOString(),
      },
      {
        source: 'alerts',
        sourceId: 'subway-alerts',
        state: 'current',
        assessedAt: capturedAt.toISOString(),
        lastAcceptedAt: retrievedAt.toISOString(),
      },
    ],
    provenance: [
      {
        source: 'gtfs-rt',
        sourceId: 'subway-rt-ace',
        observedAt: observedAt.toISOString(),
        retrievedAt: retrievedAt.toISOString(),
        version: `fixture-rt-${snapshotSequence}`,
      },
      {
        source: 'alerts',
        sourceId: 'subway-alerts',
        observedAt: observedAt.toISOString(),
        retrievedAt: retrievedAt.toISOString(),
        version: `fixture-alerts-${snapshotSequence}`,
      },
    ],
    boards: [{ decision: board, validThrough: new Date(capturedAt.getTime() + 90_000).toISOString() }],
    ...(state.overlay === 'ready' ? {
      mapOverlays: [{
        theme: 'day',
        serviceEpoch: `browser-fixture-epoch-${snapshotSequence}`,
        segments: [{ id: 'segment-a-uptown', routeIds: ['A'], state: 'affected', alertIds: ['alert-a-north'] }],
      }],
    } : { mapOverlays: [] }),
    journeyGraph: journeyGraphFixture,
  };
}

function createBoard(capturedAt: Date, observedAt: Date, retrievedAt: Date): BoardDecision {
  const provenance = {
    source: 'gtfs-rt' as const,
    sourceId: 'subway-rt-ace',
    observedAt,
    retrievedAt,
    version: `fixture-rt-${snapshotSequence}`,
  };
  const arrival = (id: string, routeId: 'A' | 'C', direction: 'northbound' | 'southbound', minutes: number) => ({
    id,
    kind: 'live' as const,
    route: { id: routeId, label: routeId },
    direction,
    destination: direction === 'northbound' ? routeId === 'A' ? 'Inwood–207 St' : '168 St' : 'Far Rockaway',
    at: new Date(capturedAt.getTime() + minutes * 60_000),
    provenance,
  });
  return {
    responseIdentity: `domain-board-a12-${snapshotSequence}`,
    mode: 'live',
    station: { id: 'A12', name: '125 St', complexId: 'A12', routeIds: ['A', 'C'] },
    directions: [
      {
        direction: 'northbound',
        primary: [
          arrival(`train-a-n-${snapshotSequence}`, 'A', 'northbound', 3),
          arrival(`train-c-n-${snapshotSequence}`, 'C', 'northbound', 5),
          arrival(`train-a-n2-${snapshotSequence}`, 'A', 'northbound', 7),
        ],
        secondary: [],
        explanations: [],
      },
      {
        direction: 'southbound',
        primary: [
          arrival(`train-a-s-${snapshotSequence}`, 'A', 'southbound', 4),
          arrival(`train-c-s-${snapshotSequence}`, 'C', 'southbound', 6),
          arrival(`train-a-s2-${snapshotSequence}`, 'A', 'southbound', 8),
        ],
        secondary: [],
        explanations: [],
      },
    ],
    feedHealth: [{ source: 'gtfs-rt', state: 'current', assessedAt: capturedAt, lastAcceptedAt: retrievedAt }],
    alerts: [{
      id: 'alert-a-north',
      text: 'A trains are running with delays.',
      activeFrom: new Date(capturedAt.getTime() - 15 * 60_000),
      routeIds: ['A'],
      stationIds: ['A12'],
      directions: ['northbound'],
      provenance: {
        source: 'alerts',
        sourceId: 'subway-alerts',
        observedAt,
        retrievedAt,
        version: `fixture-alerts-${snapshotSequence}`,
      },
    }],
    decidedAt: capturedAt,
    explanations: [{ code: 'SERVICE_CONTEXT', message: 'Review current service information.' }],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  };
}
