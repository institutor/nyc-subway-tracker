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
    const board = await get('/api/v1/stations/A12/board?routes=A&direction=northbound');
    const journey = await post('/api/v1/journeys', {
      mode: 'online-current', originStationId: 'A12', destinationStationId: 'R20', accessibleRouteOnly: true,
    });
    const map = await get('/api/v1/maps/day/reference/' + versions.maps.day);
    const overlay = await get('/api/v1/maps/day/overlay');
    console.log(JSON.stringify({
      bootstrap: { status: bootstrap.status, runtime: bootstrap.body.runtime, label: bootstrap.body.demonstrationLabel,
        gates: Object.values(bootstrap.body.gates).map((gate) => gate.exposed) },
      catalog: { status: catalog.status, complexes: catalog.body.data.complexes.length },
      search: { status: search.status, names: search.body.results.map((row) => row.name) },
      nearby: { status: nearby.status, label: nearby.body.demonstrationLabel, kind: nearby.body.data.kind,
        cards: Array.isArray(nearby.body.data.cards) ? nearby.body.data.cards.length : 0 },
      board: { status: board.status, label: board.body.demonstrationLabel, mode: board.body.data.mode,
        arrivals: board.body.data.directions.flatMap((direction) => direction.primary), alerts: board.body.data.alerts },
      journey: { status: journey.status, label: journey.body.demonstrationLabel, kind: journey.body.data.kind,
        accessible: journey.body.data.scope.accessibleRouteOnly,
        captures: Array.isArray(journey.body.data.itineraries) ? journey.body.data.itineraries.map((row) => Boolean(row.capture)) : [] },
      map: { status: map.status, label: map.body.demonstrationLabel, features: map.body.data.features.length },
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
      gates: Array(9).fill(false),
    },
    catalog: { status: 200, complexes: 4 },
    search: { status: 200, names: ['Canal St'] },
    nearby: { status: 200, label: 'Demonstration data — not live', kind: 'ranked', cards: 3 },
    board: { status: 200, label: 'Demonstration data — not live', mode: 'demonstration' },
    journey: { status: 200, label: 'Demonstration data — not live', kind: 'planned', accessible: true, captures: [true, false] },
    map: { status: 200, label: 'Demonstration data — not live', features: 4 },
    overlay: { status: 200, label: 'Demonstration data — not live', segments: 2 },
  });
  const resultBody = JSON.parse(output!);
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
