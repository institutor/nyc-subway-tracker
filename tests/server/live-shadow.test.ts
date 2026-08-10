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
      schemaVersion: 'shadow-v2', mode: 'shadow', riderExposure: false,
      boardsExposed: false, outcome: 'DRY_RUN_NO_NETWORK', comparisonContext: null,
      truncation: {
        claims: { consideredCount: 0, includedCount: 0, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' },
        comparisons: { consideredCount: 0, includedCount: 0, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' },
      },
    });
    expect(record.recordId).toMatch(/^shadow-/);
    expect(new Date(record.recordedAt).toISOString()).toBe(record.recordedAt);
    expect(new Date(record.decisionTime).toISOString()).toBe(record.decisionTime);
    expect(record.sources).toHaveLength(8);
    expect(record.sources.every((source: any) => ['subway-realtime', 'subway-alerts'].includes(source.role))).toBe(true);
    expect(record.gates).toHaveLength(9);
    expect(record.gates.every((gate: any) => gate.exposed === false)).toBe(true);
    expect(record.claims).toEqual([]);
    expect(Object.keys(record).sort()).toEqual([
      'boardsExposed', 'claims', 'comparisonContext', 'decisionTime', 'gates', 'mode', 'outcome', 'progressComparisons',
      'recordId', 'recordedAt', 'riderExposure', 'schemaVersion', 'sources', 'truncation',
    ]);
    expect(JSON.stringify(record)).not.toMatch(/latitude|longitude|coordinate|saved|riderLabel|activeTrip|cursor|permission|endpoint|token|privateKey|secret/i);
  });

  test('fails closed when --compare has no path value', () => {
    const result = spawnSync(process.execPath, [
      resolve(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      resolve(root, 'scripts', 'live-shadow.ts'), '--dry-run', '--compare',
    ], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/compare.*path/i);
    expect(result.stdout).toBe('');
  });
});
