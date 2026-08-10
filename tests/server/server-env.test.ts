import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { afterEach, expect, test } from 'vitest';

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

test('the production server process loads validation mode from a fresh-checkout .env', async () => {
  const root = resolve(import.meta.dirname, '..', '..');
  const directory = await mkdtemp(join(root, '.tmp-server-env-'));
  directories.push(directory);
  await writeFile(join(directory, '.env'), await readFile(join(root, '.env.example'), 'utf8'), 'utf8');
  const entry = pathToFileURL(resolve(root, 'src', 'server', 'index.ts')).href;
  const script = `void (async () => {
    const { startProductionServer } = await import('${entry}');
    const server = await startProductionServer(0);
    if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const origin = 'http://127.0.0.1:' + address.port;
    const get = async (path) => {
      const response = await fetch(origin + path);
      return { status: response.status, body: await response.json() };
    };
    const post = async (path, body) => {
      const response = await fetch(origin + path, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const bootstrap = await get('/api/v1/bootstrap');
    const versions = bootstrap.body.data.contentVersions;
    const catalog = await get('/api/v1/stations/catalog/' + versions.stationCatalog);
    const search = await get('/api/v1/stations/search?q=Canal&limit=10');
    const nearby = await post('/api/v1/nearby', {
      location: { latitude: 40.811, longitude: -73.952, accuracyMeters: 18 }, accessibleRouteOnly: true,
    });
    const board = await get('/api/v1/stations/A34/board?routes=A&direction=northbound');
    const journey = await post('/api/v1/journeys', {
      mode: 'online-current', originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: true,
    });
    const map = await get('/api/v1/maps/day/reference/' + versions.maps.day);
    const overlay = await get('/api/v1/maps/day/overlay');
    console.log(JSON.stringify({
      bootstrap: { status: bootstrap.status, runtime: bootstrap.body.runtime, label: bootstrap.body.demonstrationLabel,
        snapshotIdentity: bootstrap.body.decisionSnapshotIdentity, versions, gates: Object.values(bootstrap.body.gates).map((gate) => gate.exposed) },
      catalog: { status: catalog.status, complexes: catalog.body.data.complexes },
      search: { status: search.status, rows: search.body.results },
      nearby: { status: nearby.status, label: nearby.body.demonstrationLabel, kind: nearby.body.data.kind,
        cards: Array.isArray(nearby.body.data.cards) ? nearby.body.data.cards : [] },
      board: { status: board.status, label: board.body.demonstrationLabel, mode: board.body.data.mode, station: board.body.data.station,
        arrivals: board.body.data.directions.flatMap((direction) => direction.primary), alerts: board.body.data.alerts },
      journey: { status: journey.status, label: journey.body.demonstrationLabel, kind: journey.body.data.kind,
        snapshotIdentity: journey.body.decisionSnapshotIdentity,
        accessible: journey.body.data.scope.accessibleRouteOnly,
        itineraries: Array.isArray(journey.body.data.itineraries) ? journey.body.data.itineraries : [] },
      map: { status: map.status, label: map.body.demonstrationLabel, features: map.body.data.features },
      overlay: { status: overlay.status, label: overlay.body.demonstrationLabel, segments: overlay.body.data.segments.length },
    }));
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  })()`;
  const environment = { ...process.env };
  delete environment.TRANSIT_RUNTIME_MODE;
  delete environment.TRANSIT_DATA_DIRECTORY;
  const result = spawnSync(process.execPath, [resolve(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--eval', script], {
    cwd: directory, env: environment, encoding: 'utf8', timeout: 30_000,
  });

  expect(result.status, result.stderr).toBe(0);
  const output = result.stdout.trim().split(/\r?\n/u).at(-1);
  expect(JSON.parse(output!)).toMatchObject({
    bootstrap: {
      status: 200,
      runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
      label: 'Demonstration data — not live',
      snapshotIdentity: 'validation-snapshot-2026-08-04-v2',
      versions: {
        stationCatalog: 'validation-catalog-2026-08-04-v2',
        maps: { day: 'validation-map-day-2026-08-04-v2', night: 'validation-map-night-2026-08-04-v2' },
        journeyGraph: 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d',
      },
      gates: Array(9).fill(false),
    },
    catalog: { status: 200, complexes: expect.arrayContaining([
      { id: 'A15', name: '125 St', routeIds: ['A', 'B', 'C', 'D'], constituents: [{ id: 'A15', name: '125 St', directionalStopIds: ['A15N', 'A15S'] }] },
      { id: 'A34', name: 'Canal St', routeIds: ['A', 'C', 'E'], constituents: [{ id: 'A34', name: 'Canal St', directionalStopIds: ['A34N', 'A34S'] }] },
    ]) },
    search: { status: 200, rows: [{ id: 'A34', name: 'Canal St', routeIds: ['A', 'C', 'E'], constituents: [{ id: 'A34', name: 'Canal St', directionalStopIds: ['A34N', 'A34S'] }] }] },
    nearby: { status: 200, label: 'Demonstration data — not live', kind: 'ranked' },
    board: { status: 200, label: 'Demonstration data — not live', mode: 'demonstration', station: {
      id: 'A34', name: 'Canal St', complexId: 'A34', routeIds: ['A', 'C', 'E'],
    } },
    journey: { status: 200, label: 'Demonstration data — not live', kind: 'planned', accessible: true,
      snapshotIdentity: 'validation-snapshot-2026-08-04-v2' },
    map: { status: 200, label: 'Demonstration data — not live' },
    overlay: { status: 200, label: 'Demonstration data — not live', segments: 2 },
  });
  const resultBody = JSON.parse(output!);
  expect(resultBody.nearby.cards).toHaveLength(3);
  expect(resultBody.nearby.cards).toEqual(expect.arrayContaining([
    expect.objectContaining({ complexId: 'A15', directions: expect.arrayContaining([
      expect.objectContaining({ directionalStopId: 'A15S', routeIds: ['A', 'B', 'C', 'D'] }),
    ]) }),
    expect.objectContaining({ complexId: 'A34', directions: expect.arrayContaining([
      expect.objectContaining({ directionalStopId: 'A34S', routeIds: ['A', 'C', 'E'] }),
    ]) }),
  ]));
  expect(resultBody.map.features).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'station-a15', kind: 'station', routeIds: ['A', 'B', 'C', 'D'] }),
    expect.objectContaining({ id: 'station-a34', kind: 'station', routeIds: ['A', 'C', 'E'] }),
  ]));
  expect(resultBody.journey.itineraries).toHaveLength(2);
  expect(resultBody.journey.itineraries[0]).toMatchObject({
    transfers: 0, transferIds: [],
    legs: [{ routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
      fromStationId: 'A15', toStationId: 'A34', orderedStationIds: ['A15', 'A34'],
      fromOccurrenceId: 'occ-a15-direct', toOccurrenceId: 'occ-a34-direct' }],
    capture: { scope: { originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: true },
      equipmentClaims: [{ equipmentId: 'EL-A34-01', connectionId: 'connection-a34-platform', pathId: 'path-a15-a34-accessible' }] },
  });
  expect(resultBody.journey.itineraries[1]).toMatchObject({
    transfers: 1, transferIds: ['transfer-a24'],
    legs: [
      { routeId: 'A', direction: 'southbound', fromStationId: 'A15', toStationId: 'A24' },
      { routeId: 'C', direction: 'southbound', fromStationId: 'A24', toStationId: 'A34' },
    ],
  });
  expect(resultBody.journey.itineraries[1]).not.toHaveProperty('capture');
  expect(resultBody.board.arrivals).toHaveLength(3);
  expect(resultBody.board.arrivals.every((arrival: { demonstrationLabel?: string }) => arrival.demonstrationLabel === 'Demonstration data — not live')).toBe(true);
  expect(resultBody.board.alerts).toHaveLength(1);
  expect(resultBody.board.alerts[0].demonstrationLabel).toBe('Demonstration data — not live');
});

test('the no-env production process stays live/public, empty, and fail-closed', async () => {
  const root = resolve(import.meta.dirname, '..', '..');
  const directory = await mkdtemp(join(root, '.tmp-server-live-'));
  directories.push(directory);
  const entry = pathToFileURL(resolve(root, 'src', 'server', 'index.ts')).href;
  const script = `void (async () => {
    const { startProductionServer } = await import('${entry}');
    const server = await startProductionServer(0);
    if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const origin = 'http://127.0.0.1:' + address.port;
    const bootstrap = await (await fetch(origin + '/api/v1/bootstrap')).json();
    const catalog = await (await fetch(origin + '/api/v1/stations/catalog/' + bootstrap.data.contentVersions.stationCatalog)).json();
    const board = await (await fetch(origin + '/api/v1/stations/A12/board')).json();
    console.log(JSON.stringify({ runtime: bootstrap.runtime, label: bootstrap.demonstrationLabel ?? null,
      gates: Object.values(bootstrap.gates).map((gate) => gate.exposed), complexes: catalog.data.complexes.length,
      boardRuntime: board.runtime, boardData: board.data }));
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  })()`;
  const environment = { ...process.env };
  delete environment.TRANSIT_RUNTIME_MODE;
  delete environment.TRANSIT_DATA_DIRECTORY;
  const result = spawnSync(process.execPath, [resolve(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--eval', script], {
    cwd: directory, env: environment, encoding: 'utf8', timeout: 30_000,
  });

  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout.trim().split(/\r?\n/u).at(-1)!)).toEqual({
    runtime: { mode: 'live', surface: 'public', availability: 'available' },
    label: null,
    gates: Array(9).fill(false),
    complexes: 0,
    boardRuntime: { mode: 'live', surface: 'public', availability: 'locked' },
    boardData: null,
  });
});
