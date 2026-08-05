import { describe, expect, test, vi } from 'vitest';

import {
  requestPracticalWalks,
  type PracticalWalkTransport,
} from '../../src/server/walk/practical-walk-adapter';

const destination = (id: string, latitude = 40.71, longitude = -74.01) => ({
  id,
  coordinate: { latitude, longitude },
});

const request = (destinations = [destination('entrance-a')]) => ({
  origin: { latitude: 40.7, longitude: -74 },
  destinations,
});

const config = (overrides: Record<string, unknown> = {}) => ({
  enabled: true,
  auditApproved: true,
  supported: true,
  endpoint: 'https://walk.example.test/v1/matrix',
  allowedOrigin: 'https://walk.example.test',
  sourceId: 'audited-walk-v1',
  ...overrides,
});

const jsonResponse = (value: unknown, overrides: Record<string, unknown> = {}) => {
  const body = new TextEncoder().encode(JSON.stringify(value));
  return {
    status: 200,
    contentType: 'application/json',
    body,
    ...overrides,
  };
};

const complete = (ids: readonly string[]) => ({
  coverage: { kind: 'complete-universe' },
  results: ids.map((destinationId, index) => ({
    destinationId,
    minimumSeconds: 100 + index,
    maximumSeconds: 120 + index,
  })),
});

describe('audited practical-walk adapter', () => {
  test.each([
    [{ enabled: false }, 'disabled'],
    [{ auditApproved: false }, 'unapproved'],
    [{ supported: false }, 'unsupported'],
  ])('returns typed %s state without handling rider coordinates', async (override, reason) => {
    const transport = vi.fn<PracticalWalkTransport>();
    const result = await requestPracticalWalks(request(), config(override), transport);
    expect(result).toEqual({ kind: 'unavailable', reason });
    expect(transport).not.toHaveBeenCalled();
  });

  test('sends one exact bounded POST with zero redirects and emits no coordinates or path', async () => {
    let observed: Parameters<PracticalWalkTransport>[0] | undefined;
    const transport: PracticalWalkTransport = async (input) => {
      observed = input;
      return jsonResponse(complete(['entrance-a', 'entrance-b']));
    };
    const input = request([
      destination('entrance-b', 40.72, -74.02),
      destination('entrance-a', 40.71, -74.01),
    ]);
    const result = await requestPracticalWalks(input, config(), transport);

    expect(observed).toMatchObject({
      url: 'https://walk.example.test/v1/matrix',
      method: 'POST',
      redirect: 'error',
      timeoutMs: 4_000,
      maxResponseBytes: 1_048_576,
    });
    expect(observed?.signal.aborted).toBe(false);
    expect(observed?.body.byteLength).toBeLessThanOrEqual(524_288);
    expect(JSON.parse(new TextDecoder().decode(observed?.body))).toEqual({
      origin: { latitude: 40.7, longitude: -74 },
      destinations: [
        { id: 'entrance-a', coordinate: { latitude: 40.71, longitude: -74.01 } },
        { id: 'entrance-b', coordinate: { latitude: 40.72, longitude: -74.02 } },
      ],
    });
    expect(result).toMatchObject({
      kind: 'available', source: 'practical-walk', sourceId: 'practical-walk',
      coverage: { kind: 'complete-universe' },
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('40.7');
    expect(serialized).not.toContain('-74');
    expect(serialized.toLowerCase()).not.toContain('path');
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('returns typed cancellation before transport for an already-aborted caller', async () => {
    const caller = new AbortController();
    caller.abort();
    const transport = vi.fn<PracticalWalkTransport>(async () => jsonResponse(complete(['entrance-a'])));

    await expect(requestPracticalWalks(request(), config(), transport, { signal: caller.signal })).resolves.toEqual({
      kind: 'unavailable',
      reason: 'cancelled',
    });
    expect(transport).not.toHaveBeenCalled();
  });

  test('propagates mid-flight caller cancellation to transport and settles promptly', async () => {
    const caller = new AbortController();
    let observedSignal: AbortSignal | undefined;
    let completeTransport: ((response: ReturnType<typeof jsonResponse>) => void) | undefined;
    const transport: PracticalWalkTransport = ({ signal }) => new Promise((resolve, reject) => {
      observedSignal = signal;
      completeTransport = resolve;
      signal.addEventListener('abort', () => reject(Object.assign(new Error('transport aborted'), { name: 'AbortError' })), { once: true });
    });
    const pending = requestPracticalWalks(request(), config(), transport, { signal: caller.signal });
    await Promise.resolve();

    caller.abort();
    const stillPending = Symbol('still-pending');
    const result = await Promise.race([
      pending,
      new Promise<typeof stillPending>((resolve) => setTimeout(() => resolve(stillPending), 25)),
    ]);
    if (result === stillPending) {
      completeTransport?.(jsonResponse(complete(['entrance-a'])));
      await pending;
    }

    expect(result).toEqual({ kind: 'unavailable', reason: 'cancelled' });
    expect(observedSignal?.aborted).toBe(true);
  });

  test('keeps the four-second timeout authoritative and aborts the observed transport signal', async () => {
    vi.useFakeTimers();
    try {
      let observedSignal: AbortSignal | undefined;
      const transport: PracticalWalkTransport = ({ signal }) => new Promise((_resolve, reject) => {
        observedSignal = signal;
        signal.addEventListener('abort', () => reject(Object.assign(new Error('transport aborted'), { name: 'AbortError' })), { once: true });
      });
      const pending = requestPracticalWalks(request(), config(), transport);
      await vi.advanceTimersByTimeAsync(4_000);

      await expect(pending).resolves.toEqual({ kind: 'unavailable', reason: 'timeout' });
      expect(observedSignal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  test('detaches caller cancellation after transport settlement', async () => {
    const caller = new AbortController();
    let observedSignal: AbortSignal | undefined;
    const result = await requestPracticalWalks(request(), config(), async ({ signal }) => {
      observedSignal = signal;
      return jsonResponse(complete(['entrance-a']));
    }, { signal: caller.signal });

    expect(result.kind).toBe('available');
    expect(observedSignal?.aborted).toBe(false);
    caller.abort();
    expect(observedSignal?.aborted).toBe(false);
  });

  test('requires exact complete one-to-one destination results and never returns a partial matrix', async () => {
    const inputs = [
      complete(['entrance-a']),
      complete(['entrance-a', 'entrance-b', 'entrance-extra']),
      { ...complete(['entrance-a', 'entrance-b']), results: [complete(['entrance-a']).results[0], complete(['entrance-a']).results[0]] },
    ];
    for (const provider of inputs) {
      const result = await requestPracticalWalks(
        request([destination('entrance-a'), destination('entrance-b')]),
        config(),
        async () => jsonResponse(provider),
      );
      expect(result).toEqual({ kind: 'unavailable', reason: 'incomplete' });
    }
  });

  test('accepts a certified third-card cutoff only when the proof partitions the full universe', async () => {
    const input = request(['a', 'b', 'c', 'd'].map((id) => destination(id)));
    const valid = {
      coverage: {
        kind: 'certified-third-card-cutoff',
        consideredDestinationIds: ['a', 'b', 'c'],
        excludedDestinationIds: ['d'],
        thirdCardMaximumSeconds: 180,
        excludedMinimumSeconds: 181,
      },
      results: ['a', 'b', 'c'].map((destinationId, index) => ({
        destinationId,
        minimumSeconds: 100 + index,
        maximumSeconds: 150 + index,
      })),
    };
    const result = await requestPracticalWalks(input, config(), async () => jsonResponse(valid));
    expect(result).toMatchObject({ kind: 'available', coverage: { kind: 'certified-third-card-cutoff' } });

    const invalid = structuredClone(valid);
    invalid.coverage.excludedMinimumSeconds = 180;
    await expect(requestPracticalWalks(input, config(), async () => jsonResponse(invalid))).resolves.toEqual({
      kind: 'unavailable',
      reason: 'incomplete',
    });
  });

  test('does not truncate or geometrically prefilter the maximum complete destination universe', async () => {
    const destinations = Array.from({ length: 2_048 }, (_, index) =>
      destination(`entrance-${String(index).padStart(4, '0')}`, index % 2 ? -89 : 89, index % 2 ? -179 : 179),
    );
    let sentCount = 0;
    const result = await requestPracticalWalks(request(destinations), config(), async ({ body }) => {
      sentCount = (JSON.parse(new TextDecoder().decode(body)) as { destinations: unknown[] }).destinations.length;
      return jsonResponse(complete(destinations.map(({ id }) => id)));
    });
    expect(sentCount).toBe(2_048);
    expect(result).toMatchObject({ kind: 'available' });
  });

  test('fails with typed limits before transport instead of truncating destinations or request bodies', async () => {
    const transport = vi.fn<PracticalWalkTransport>();
    const tooMany = Array.from({ length: 2_049 }, (_, index) => destination(`e-${index}`));
    await expect(requestPracticalWalks(request(tooMany), config(), transport)).resolves.toEqual({
      kind: 'unavailable', reason: 'limit',
    });
    const huge = Array.from({ length: 2_048 }, (_, index) => destination(`${'x'.repeat(250)}-${index}`));
    await expect(requestPracticalWalks(request(huge), config(), transport)).resolves.toEqual({
      kind: 'unavailable', reason: 'limit',
    });
    expect(transport).not.toHaveBeenCalled();
  });

  test.each([
    ['timeout', async () => { throw Object.assign(new Error('secret coordinate 40.7'), { name: 'AbortError' }); }],
    ['limit', async () => jsonResponse(complete(['entrance-a']), { body: new Uint8Array(1_048_577) })],
    ['invalid', async () => jsonResponse({ results: [] }, { contentType: 'text/html' })],
    ['invalid', async () => jsonResponse({ coverage: { kind: 'complete-universe' }, results: [{ destinationId: 'entrance-a', minimumSeconds: 1.5, maximumSeconds: 2 }] })],
  ] as const)('maps provider failure to coordinate-free typed %s unavailability', async (reason, transport) => {
    const result = await requestPracticalWalks(request(), config(), transport);
    expect(result).toEqual({ kind: 'unavailable', reason });
    expect(JSON.stringify(result)).not.toContain('40.7');
  });

  test.each([
    { endpoint: 'http://walk.example.test/v1/matrix' },
    { endpoint: 'https://other.example.test/v1/matrix' },
    { endpoint: 'https://user:secret@walk.example.test/v1/matrix' },
    { endpoint: 'https://walk.example.test/v1/matrix?q=coordinate' },
  ])('rejects a transport endpoint outside the exact configured HTTPS origin %#', async (override) => {
    const transport = vi.fn<PracticalWalkTransport>();
    await expect(requestPracticalWalks(request(), config(override), transport)).resolves.toEqual({
      kind: 'unavailable', reason: 'invalid',
    });
    expect(transport).not.toHaveBeenCalled();
  });
});
