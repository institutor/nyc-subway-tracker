import { describe, expect, test } from 'vitest';

import { createTransitApiClient } from '../../src/client/api/client';

const gates = {
  'arrival-boards': { exposed: false, reasonCode: 'GATE_0_NOT_PASSED', decision: 'NO-GO \u2014 GATE 0 NOT PASSED' },
  'nearby-offline': { exposed: false, reasonCode: 'NEARBY_GATE_0_NOT_PASSED', decision: 'NO-GO \u2014 GATE 0 NOT PASSED' },
  accessibility: { exposed: false, reasonCode: 'ACCESSIBILITY_EVIDENCE_NOT_DEMONSTRATED', decision: 'NO-GO \u2014 REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED' },
  guidance: { exposed: false, reasonCode: 'GUIDANCE_EVIDENCE_NOT_DEMONSTRATED', decision: 'NO-GO \u2014 RELEASE 2 POSITIONING AND TRANSFER EVIDENCE IS NOT DEMONSTRATED' },
  'maps-rights': { exposed: false, reasonCode: 'MAP_RIGHTS_NOT_DOCUMENTED', decision: 'Blocked from public release \u2014 rights not documented.' },
  'commute-evaluation': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO \u2014 prerequisites and fixed-version evidence incomplete' },
  'commute-silent': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO \u2014 prerequisites and fixed-version evidence incomplete' },
  'commute-limited-pilot': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO \u2014 prerequisites and fixed-version evidence incomplete' },
  'commute-delivery': { exposed: false, reasonCode: 'COMMUTE_PREREQUISITES_INCOMPLETE', decision: 'NO-GO \u2014 prerequisites and fixed-version evidence incomplete' },
} as const;
const gate = gates['arrival-boards'];

function statusEnvelope(): any {
  const responseGates = structuredClone(gates);
  return {
    apiVersion: 'v1', schemaVersion: '2026-08-04', responseIdentity: 'status-safe',
    decidedAt: '2026-08-04T12:00:00.000Z', serverTime: '2026-08-04T12:00:00.000Z',
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
    gates: responseGates, gateDecision: structuredClone(gate), demonstrationLabel: 'Demonstration data \u2014 not live',
    sourceHealth: [{
      source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'degraded',
      assessedAt: '2026-08-04T11:59:50.000Z', lastAcceptedAt: '2026-08-04T11:58:29.000Z',
      reasonCode: 'SOURCE_DEGRADED',
    }],
    provenance: [],
    data: {
      alerts: [], sourceHealth: [{
        source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'degraded',
        assessedAt: '2026-08-04T11:59:50.000Z', lastAcceptedAt: '2026-08-04T11:58:29.000Z',
        reasonCode: 'SOURCE_DEGRADED',
      }], provenance: [], explanations: [],
      diagnostics: {
        sourceSignals: [{
          source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'degraded',
          reasonCode: 'SOURCE_DEGRADED', ageSeconds: 91,
          lastAcceptedAt: '2026-08-04T11:58:29.000Z',
        }],
        exposureGates: Object.entries(responseGates).map(([stage, value]) => ({ stage, ...value })),
      },
    },
  };
}

function response(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('status client boundary', () => {
  test('accepts only the bounded diagnostic schema', async () => {
    const client = createTransitApiClient(async () => response(statusEnvelope()));

    expect(typeof (client as any).status).toBe('function');
    const result = await (client as any).status();
    expect(result.data.diagnostics.sourceSignals[0]).toEqual({
      source: 'gtfs-rt', sourceId: 'mta-realtime-ace', state: 'degraded',
      reasonCode: 'SOURCE_DEGRADED', ageSeconds: 91,
      lastAcceptedAt: '2026-08-04T11:58:29.000Z',
    });
  });

  test.each([
    ['secret expansion', (value: any) => { value.data.diagnostics.sourceSignals[0].pushEndpoint = 'secret'; }],
    ['fractional source age', (value: any) => { value.data.diagnostics.sourceSignals[0].ageSeconds = 1.5; }],
    ['opened gate', (value: any) => { value.data.diagnostics.exposureGates[0].exposed = true; }],
  ])('fails closed on %s', async (_label, alter) => {
    const value = statusEnvelope();
    alter(value);
    const client = createTransitApiClient(async () => response(value));

    await expect((client as any).status()).rejects.toThrow('Transit information is unavailable.');
  });

  test.each([
    ['missing gate', (value: any) => { delete value.gates.guidance; }],
    ['extra gate', (value: any) => { value.gates.future = gate; }],
    ['empty gates', (value: any) => { value.gates = {}; }],
    ['wrong canonical reason', (value: any) => { value.gates['maps-rights'].reasonCode = 'GATE_0_NOT_PASSED'; }],
    ['wrong canonical decision', (value: any) => { value.gates.accessibility.decision = 'NO-GO'; }],
  ])('rejects %s before accepting validation data', async (_label, alter) => {
    const value = statusEnvelope();
    alter(value);
    await expect(createTransitApiClient(async () => response(value)).status())
      .rejects.toThrow('Transit information is unavailable.');
  });

  test('rejects a malformed gate set even when locked runtime data is null', async () => {
    const value = statusEnvelope();
    value.runtime = { mode: 'shadow', surface: 'public', availability: 'locked' };
    value.data = null;
    delete value.gates['commute-delivery'];

    await expect(createTransitApiClient(async () => response(value)).status())
      .rejects.toThrow('Transit information is unavailable.');
  });
});
