import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  TRUTH_VALIDATION_SCENARIOS,
  runTruthValidationCli,
  runTruthValidationScenario,
  runTruthValidationSuite,
  type TruthValidationReceipt,
} from '../../scripts/truth-validation';

const expectedChecks = {
  'normal-weekday': [
    'coordinated-fixture-sources',
    'realtime-claim-binding',
    'operating-service-date',
    'current-feed-health',
    'governed-arrival-admission',
    'public-exposure-locks',
  ],
  'weekend-planned-work': [
    'weekend-fixture-binding',
    'supplemented-owner',
    'planned-stop-exclusion',
    'omitted-stop-board-empty',
    'public-exposure-locks',
  ],
  'late-night-midnight': [
    'after-midnight-service-date',
    'gtfs-time-over-24-hours',
    'realtime-service-date',
    'public-exposure-locks',
  ],
  'major-disruption': [
    'disruption-fixture-binding',
    'resolved-service-suppression',
    'dependent-product-containment',
    'arrival-claim-suppression',
    'public-exposure-locks',
  ],
  'later-stop-comparison': [
    'bound-later-observation',
    'next-stop-advanced',
    'disposition-transition',
    'public-exposure-locks',
  ],
  'route-group-bulk-drop': [
    'official-route-group-inventory',
    'subway-rt-1234567s-bulk-drop',
    'subway-rt-ace-bulk-drop',
    'subway-rt-bdfm-bulk-drop',
    'subway-rt-g-bulk-drop',
    'subway-rt-jz-bulk-drop',
    'subway-rt-l-bulk-drop',
    'subway-rt-nqrw-bulk-drop',
    'unrelated-group-isolation',
    'public-exposure-locks',
  ],
  'false-bypass-incident-drill': [
    'incident-fixture-binding',
    'original-admission-reconstruction',
    'current-bypass-veto',
    'containment-product-scope',
    'zero-exposure-incident-path',
    'public-exposure-locks',
  ],
} as const;

describe('bounded deterministic truth validation', () => {
  test('runs every required cohort and drill through the real validation runner', async () => {
    expect(TRUTH_VALIDATION_SCENARIOS).toEqual([
      'normal-weekday',
      'weekend-planned-work',
      'late-night-midnight',
      'major-disruption',
      'later-stop-comparison',
      'route-group-bulk-drop',
      'false-bypass-incident-drill',
    ]);

    const bundle = await runTruthValidationSuite();

    expect(bundle.receipts.map((receipt) => receipt.scenario)).toEqual(TRUTH_VALIDATION_SCENARIOS);
    expect(bundle).toMatchObject({
      schemaVersion: 'truth-validation-bundle-v1',
      outcome: 'PASS',
      gate0Decision: 'NO-GO',
      riderExposure: false,
      boardsExposed: false,
      counts: { scenarios: 7, passed: 7, failed: 0 },
    });
    for (const receipt of bundle.receipts) assertClosedValidationReceipt(receipt);
  });

  test.each(TRUTH_VALIDATION_SCENARIOS)('%s records the exact observable checks for its risk', async (scenario) => {
    const receipt = await runTruthValidationScenario(scenario);

    expect(receipt.checks.map((check) => check.id)).toEqual(expectedChecks[scenario]);
    expect(receipt.checks.every((check) => check.result === 'pass')).toBe(true);
  });

  test('keeps receipts deterministic, signed over their exact payload, bounded, and privacy safe', async () => {
    const first = await runTruthValidationScenario('weekend-planned-work');
    const second = await runTruthValidationScenario('weekend-planned-work');
    const serialized = JSON.stringify(first);

    expect(second).toEqual(first);
    expect(Buffer.byteLength(serialized, 'utf8')).toBeLessThanOrEqual(32_768);
    expect(serialized).not.toMatch(/latitude|longitude|coordinate|permission|token|secret|private.?key|sourceUrl|finalUrl|officialText|descriptionRaw/i);
    expect(first.receiptDigest).toBe(digestReceipt(first));
    expect(first.checks.every((check) => /^sha256:[a-f0-9]{64}$/.test(check.evidenceDigest))).toBe(true);
  });

  test('proves exact 40 percent bulk-drop quarantine independently for every official subway route group', async () => {
    const receipt = await runTruthValidationScenario('route-group-bulk-drop');
    const groupChecks = receipt.checks.filter((check) => check.id.endsWith('-bulk-drop'));

    expect(groupChecks).toHaveLength(7);
    expect(groupChecks.every((check) => check.reasonCode === 'BULK_POPULATION_LOSS_AT_40_PERCENT')).toBe(true);
    expect(receipt.checks).toContainEqual(expect.objectContaining({
      id: 'unrelated-group-isolation',
      reasonCode: 'UNAFFECTED_GROUPS_REMAIN_CURRENT',
    }));
  });

  test('records a successful false-bypass containment drill without claiming incident closure or Gate 0 passage', async () => {
    const receipt = await runTruthValidationScenario('false-bypass-incident-drill');
    const serialized = JSON.stringify(receipt);

    expect(receipt).toMatchObject({
      outcome: 'PASS', gate0Decision: 'NO-GO', riderExposure: false, boardsExposed: false,
    });
    expect(receipt.checks).toContainEqual(expect.objectContaining({
      id: 'current-bypass-veto', reasonCode: 'RESOLVED_SERVICE_VETO_BLOCKED_ARRIVAL',
    }));
    expect(serialized).not.toMatch(/"gate0Decision":"PASS"|"incidentDisposition":"CLOSED"|zero incidents/i);
  });

  test('fails closed when the normalized weekday realtime fixture bytes are corrupted', async () => {
    const source = new Uint8Array(await readFile(resolve('tests', 'fixtures', 'realtime', 'current.pb')));
    const bytes = source.slice(0, Math.floor(source.byteLength / 2));

    await expect(runTruthValidationScenario('normal-weekday', {
      fixtureOverrides: { weekdayRealtime: bytes },
    })).rejects.toThrow(/fixture|source|validation|decode|join/i);
  });

  test('fails closed when the weekend supplement does not own the exact loaded route and omitted stop', async () => {
    const wrongSupplement = new Uint8Array(await readFile(resolve('tests', 'fixtures', 'gtfs', 'regular.zip')));

    await expect(runTruthValidationScenario('weekend-planned-work', {
      fixtureOverrides: { weekendSupplementedGtfs: wrongSupplement },
    })).rejects.toThrow(/weekend|supplement|pattern|omitted|join/i);
  });

  test('fails the disruption receipt when substituted normalized alerts do not support its consequence', async () => {
    const ordinaryAlerts = new Uint8Array(await readFile(resolve('tests', 'fixtures', 'alerts', 'subway-alerts.json')));
    const receipt = await runTruthValidationScenario('major-disruption', {
      fixtureOverrides: { majorDisruptionAlerts: ordinaryAlerts },
    });

    expect(receipt).toMatchObject({
      outcome: 'FAIL', gate0Decision: 'NO-GO', riderExposure: false, boardsExposed: false,
    });
    expect(receipt.checks).toContainEqual(expect.objectContaining({
      id: 'disruption-fixture-binding', result: 'fail',
    }));
    expect(receipt.publicLocks.every((lock) => lock.exposed === false)).toBe(true);
  });
});

describe('truth validation command boundary', () => {
  test('emits exactly one parseable receipt and succeeds only after all checks pass', async () => {
    let stdout = '';
    let stderr = '';
    const exitCode = await runTruthValidationCli(['normal-weekday'], {
      stdout: (value) => { stdout += value; },
      stderr: (value) => { stderr += value; },
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
    expect(stdout.endsWith('\n')).toBe(true);
    assertClosedValidationReceipt(JSON.parse(stdout) as TruthValidationReceipt);
  });

  test('fails closed with a bounded generic receipt when required fixture evidence is unavailable', async () => {
    let stdout = '';
    let stderr = '';
    const exitCode = await runTruthValidationCli(['normal-weekday'], {
      stdout: (value) => { stdout += value; },
      stderr: (value) => { stderr += value; },
    }, { fixtureRoot: resolve('tests', 'fixtures', 'missing-truth-validation-fixtures') });

    expect(exitCode).toBe(1);
    expect(stdout).toBe('');
    expect(JSON.parse(stderr)).toEqual({
      schemaVersion: 'truth-validation-error-v1',
      outcome: 'FAIL',
      gate0Decision: 'NO-GO',
      riderExposure: false,
      boardsExposed: false,
      reasonCode: 'VALIDATION_EXECUTION_FAILED',
    });
    expect(stderr).not.toContain('missing-truth-validation-fixtures');
    expect(Buffer.byteLength(stderr, 'utf8')).toBeLessThanOrEqual(1_024);
  });

  test('rejects an unknown or ambiguous command without running a scenario', async () => {
    for (const argv of [[], ['unknown'], ['normal-weekday', 'major-disruption']]) {
      let stderr = '';
      const exitCode = await runTruthValidationCli(argv, {
        stdout: () => undefined,
        stderr: (value) => { stderr += value; },
      });

      expect(exitCode).toBe(2);
      expect(JSON.parse(stderr)).toMatchObject({
        schemaVersion: 'truth-validation-error-v1',
        outcome: 'FAIL',
        gate0Decision: 'NO-GO',
        reasonCode: 'INVALID_VALIDATION_COMMAND',
      });
    }
  });
});

function assertClosedValidationReceipt(receipt: TruthValidationReceipt): void {
  expect(receipt).toMatchObject({
    schemaVersion: 'truth-validation-receipt-v1',
    validationMode: 'deterministic-zero-exposure',
    artifactStatus: 'VALIDATION_ONLY',
    outcome: 'PASS',
    gate0Decision: 'NO-GO',
    riderExposure: false,
    boardsExposed: false,
  });
  expect(receipt.counts).toEqual({
    checks: receipt.checks.length,
    passed: receipt.checks.length,
    failed: 0,
  });
  expect(receipt.publicLocks).toHaveLength(9);
  expect(receipt.publicLocks.every((lock) => lock.exposed === false && lock.reasonCode.length > 0)).toBe(true);
}

function digestReceipt(receipt: TruthValidationReceipt): string {
  const { receiptDigest: _digest, ...payload } = receipt;
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}
