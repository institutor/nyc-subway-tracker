import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  await writeFile(join(directory, '.env'), 'TRANSIT_RUNTIME_MODE=validation\nTRANSIT_DATA_DIRECTORY=.data\n', 'utf8');
  const entry = pathToFileURL(resolve(root, 'src', 'server', 'index.ts')).href;
  const script = `void (async () => {
    const { startProductionServer } = await import('${entry}');
    const server = await startProductionServer(0);
    if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const response = await fetch('http://127.0.0.1:' + address.port + '/api/v1/status');
    console.log(JSON.stringify({ status: response.status, runtime: (await response.json()).runtime }));
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
  expect(JSON.parse(output!)).toEqual({
    status: 200, runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
  });
});
