import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { build } from 'vite';

import { createApp } from '../../src/server/app';
import type { DecisionSnapshot } from '../../src/server/api/decision-snapshot';
import { createProductionDependencies } from '../../src/server/bootstrap';
import { planJourney } from '../../src/server/services/journey-service';
import type { JourneyCapturePackage } from '../../src/shared/domain/journey-capture';
import type { BoardDecision } from '../../src/shared/domain/types';
import { journeyGraphFixture } from '../helpers/journey-graph-fixture';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const clientDirectory = resolve(projectRoot, 'dist/client');
const validationClientDirectory = resolve(projectRoot, 'dist/e2e-client');
const fixtureOrigin = '127.0.0.1';
const fixturePort = 4173;

interface FixtureState {
  boardTransport: 'ok' | 'drop';
  overlay: 'ready' | 'missing';
}

const state: FixtureState = { boardTransport: 'ok', overlay: 'ready' };
const requestLog: string[] = [];
const transitionLog: ValidationTransition[] = [];
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
    {
      id: 'L03',
      name: '14 St–Union Sq',
      routeIds: ['L'],
      constituents: [{ id: 'L03', name: '14 St–Union Sq', directionalStopIds: ['L03N', 'L03S'] }],
    },
  ],
} as const;

const nearbyUniverse = [
  { id: 'entrance-a12', coordinate: { latitude: 40.811, longitude: -73.952 } },
  { id: 'entrance-r20', coordinate: { latitude: 40.719, longitude: -74.002 } },
  { id: 'entrance-l03', coordinate: { latitude: 40.735, longitude: -73.991 } },
] as const;

const currentJourney = planJourney(journeyGraphFixture, {
  mode: 'online-current', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: false,
});
if (currentJourney.kind !== 'planned' || !currentJourney.itineraries[0]) {
  throw new Error('Browser journey fixture must produce one current itinerary');
}
const currentJourneyItinerary = currentJourney.itineraries[0];

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
  nearbyUniverse,
  walk: async ({ destinations }) => Object.freeze({
    kind: 'available' as const,
    source: 'practical-walk' as const,
    sourceId: 'practical-walk',
    coverage: Object.freeze({ kind: 'complete-universe' as const }),
    results: Object.freeze(destinations.map(({ id }) => Object.freeze({
      destinationId: id,
      range: id === 'entrance-a12'
        ? { minimumSeconds: 95, maximumSeconds: 120 }
        : id === 'entrance-r20'
          ? { minimumSeconds: 135, maximumSeconds: 160 }
          : { minimumSeconds: 175, maximumSeconds: 205 },
    }))),
  }),
  mapReferences,
  snapshotProvider: Object.freeze({ capture: createSnapshot }),
});

await build({ configFile: resolve(projectRoot, 'vite.config.ts') });
await build({ configFile: resolve(projectRoot, 'tests/e2e/fixture-vite.config.ts') });

const fixture = express();
fixture.disable('x-powered-by');
fixture.use(express.json({ limit: '4kb', strict: true }));
fixture.get('/__test/health', (_request, response) => response.status(200).json({ ready: true }));
fixture.post('/__test/reset', (_request, response) => {
  state.boardTransport = 'ok';
  state.overlay = 'ready';
  requestLog.length = 0;
  transitionLog.length = 0;
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
fixture.get('/__test/transitions', (_request, response) => response.status(200).json({ transitions: [...transitionLog] }));
fixture.post('/__test/transitions', (request, response) => {
  const candidate = request.body as Partial<ValidationTransition>;
  const keys = Object.keys(candidate);
  if (keys.length !== 3 || !keys.every((key) => ['scenario', 'phase', 'stage'].includes(key))
    || !RECONNECTION_SCENARIOS.includes(candidate.scenario as ReconnectionScenario)
    || (candidate.phase !== 'requested' && candidate.phase !== 'presented')
    || ![1, 2, 3, 4, 5].includes(candidate.stage as number)) {
    response.status(400).json({ error: 'invalid transition receipt' });
    return;
  }
  transitionLog.push({
    scenario: candidate.scenario as ReconnectionScenario,
    phase: candidate.phase,
    stage: candidate.stage as 1 | 2 | 3 | 4 | 5,
  });
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
fixture.use('/__validation', express.static(validationClientDirectory, { dotfiles: 'allow', index: false }));
fixture.get(['/__validation', '/__validation/'], (_request, response) => response.sendFile(
  resolve(validationClientDirectory, 'index.html'),
  { dotfiles: 'allow' },
));
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
  const capturedAt = new Date(lastClockMillisecond || Date.now());
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
    nearby: nearbySnapshot(),
    ...(state.overlay === 'ready' ? {
      mapOverlays: [{
        theme: 'day',
        serviceEpoch: `browser-fixture-epoch-${snapshotSequence}`,
        segments: [{ id: 'segment-a-uptown', routeIds: ['A'], state: 'affected', alertIds: ['alert-a-north'] }],
      }],
    } : { mapOverlays: [] }),
    journeyGraph: journeyGraphFixture,
    journeyCaptures: [journeyCapture(capturedAt)],
  };
}

function nearbySnapshot(): NonNullable<DecisionSnapshot['nearby']> {
  const complexes = catalog.complexes.map(({ id, name }) => ({ id, name }));
  const constituents = catalog.complexes.map(({ id, name }) => ({ id, complexId: id, publicName: name }));
  const entrances = catalog.complexes.map(({ id, name }) => ({
    id: `entrance-${id.toLowerCase()}`,
    complexId: id,
    constituentId: id,
    publicDescription: `${name} main entrance`,
    entryPermission: 'entry' as const,
    joinStatus: 'matched' as const,
    directionalStopIds: [`${id}N`, `${id}S`],
    usability: 'open' as const,
    accessibility: 'eligible' as const,
  }));
  const serviceRows = [
    ['A12', ['A', 'C'], 'Inwood–207 St', 'Far Rockaway'],
    ['R20', ['N', 'Q'], 'Astoria–Ditmars Blvd', 'Coney Island–Stillwell Av'],
    ['L03', ['L'], '8 Av', 'Canarsie–Rockaway Pkwy'],
  ] as const;
  const services = serviceRows.flatMap(([id, routes, northDestination, southDestination]) => routes.flatMap((routeId) => ([
    {
      id: `service-${id}-${routeId}-north`, complexId: id, constituentId: id, directionalStopId: `${id}N`,
      routeId, direction: 'northbound' as const, actualDestination: northDestination,
      state: 'current' as const, arrivalState: 'available' as const,
    },
    {
      id: `service-${id}-${routeId}-south`, complexId: id, constituentId: id, directionalStopId: `${id}S`,
      routeId, direction: 'southbound' as const, actualDestination: southDestination,
      state: 'current' as const, arrivalState: 'available' as const,
    },
  ])));
  return { complexes, constituents, entrances, services };
}

function journeyCapture(capturedAt: Date): JourneyCapturePackage {
  const instant = capturedAt.toISOString();
  const serviceDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(capturedAt);
  const anchorAt = new Date(capturedAt.getTime() - 3_600_000).toISOString();
  const lastRetrievedAt = new Date(capturedAt.getTime() - 30_000).toISOString();
  return {
    itineraryId: currentJourneyItinerary.id,
    requestMode: 'online-current',
    scope: { mode: 'online-current', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: false },
    serviceDate,
    timing: 'timed',
    capturedAt: instant,
    disclosure: 'Demonstration data — not live',
    validity: {
      result: 'current-itinerary',
      pattern: 'actual-now',
      schedule: {
        kind: 'current', editionId: 'fixture-supplemented-edition', anchorKind: 'published',
        anchorAt, lastRetrievedAt, effectiveFrom: serviceDate, effectiveUntil: serviceDate,
        currencyAgeSeconds: 3_600,
        departures: currentJourneyItinerary.legs.map((leg) => ({
          patternId: leg.patternId,
          occurrenceId: leg.orderedOccurrenceIds[0],
          clockTime: '08:15',
          evidence: 'scheduled' as const,
          timeZone: 'America/New_York' as const,
        })),
      },
      warnings: [], vetoes: [],
    },
    serviceClaims: [], equipmentClaims: [],
  };
}

const RECONNECTION_SCENARIOS = [
  'Reconnect · stage 1 path invalidation',
  'Reconnect · stage 2 service invalidation',
  'Reconnect · stage 3 train invalidation',
  'Reconnect · stage 4 required guidance invalidation',
  'Reconnect · optional guidance removed',
] as const;
type ReconnectionScenario = typeof RECONNECTION_SCENARIOS[number];
interface ValidationTransition {
  readonly scenario: ReconnectionScenario;
  readonly phase: 'requested' | 'presented';
  readonly stage: 1 | 2 | 3 | 4 | 5;
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
