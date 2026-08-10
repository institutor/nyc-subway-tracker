import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '..', '..');

describe('isolated live shadow composition', () => {
  test('dry-run composes only official operational sources while every rider gate stays locked', () => {
    const result = spawnSync(process.execPath, [
      resolve(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      resolve(root, 'scripts', 'live-shadow.ts'),
      '--dry-run',
    ], { cwd: root, encoding: 'utf8' });

    expect(result.status, result.stderr).toBe(0);
    const record = JSON.parse(result.stdout);
    expect(record).toMatchObject({
      schemaVersion: 'shadow-v1', mode: 'shadow', riderExposure: false,
      boardsExposed: false, outcome: 'DRY_RUN_NO_NETWORK',
    });
    expect(record.sources).toHaveLength(8);
    expect(record.sources.every((source: any) => ['subway-realtime', 'subway-alerts'].includes(source.role))).toBe(true);
    expect(record.gates).toHaveLength(9);
    expect(record.gates.every((gate: any) => gate.exposed === false)).toBe(true);
    expect(JSON.stringify(record)).not.toMatch(/latitude|longitude|coordinate|saved|riderLabel|activeTrip|cursor|permission|endpoint|token|privateKey|secret/i);
  });
});
