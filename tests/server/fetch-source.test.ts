import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vitest';

import { fetchSource } from '../../src/server/data/fetch-source';
import { createSourceRegistry, type RemoteSource } from '../../src/server/data/source-registry';

const temporaryDirectories: string[] = [];

async function destination(name = 'source.bin'): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'transit-fetch-'));
  temporaryDirectories.push(directory);
  return join(directory, name);
}

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

function source(overrides: Partial<RemoteSource> = {}): RemoteSource {
  return {
    id: 'test-static',
    authority: 'MTA',
    kind: 'remote',
    role: 'regular-gtfs',
    required: true,
    supports: ['regular-schedule'],
    url: 'https://example.test/source.zip',
    expectedFormat: 'zip',
    acceptedContentTypes: ['application/zip'],
    allowedOrigins: ['https://example.test'],
    retrieval: { timeoutMs: 1_000, maxRedirects: 2, maxBytes: 64, maxUrlLength: 512 },
    ...overrides,
  };
}

function zipResponse(body: BodyInit, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/zip', ...headers },
  });
}

describe('bounded source retrieval', () => {
  test('aborts a response that does not arrive before the hard timeout', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }),
    );
    const destinationPath = await destination();

    const result = fetchSource(
      source({ retrieval: { timeoutMs: 25, maxRedirects: 2, maxBytes: 64, maxUrlLength: 512 } }),
      {
      destinationPath,
      fetchImpl,
      now: () => new Date('2026-08-04T12:00:00.000Z'),
      },
    );
    const timeoutRejection = expect(result).rejects.toThrow('timed out after 25ms');
    await vi.advanceTimersByTimeAsync(25);

    await timeoutRejection;
    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test('rejects a declared content type outside the source policy without promoting it', async () => {
    const destinationPath = await destination();

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
      }),
    ).rejects.toThrow('declared content type text/html');

    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test.each([
    [
      'HTTP status',
      () => new Response('upstream failure', { status: 503, headers: { 'content-type': 'text/plain' } }),
      'HTTP 503',
    ],
    [
      'declared content type',
      () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
      'declared content type text/html',
    ],
    [
      'declared byte ceiling',
      () => zipResponse('PK\u0003\u0004body', { 'content-length': '65' }),
      '64 byte limit',
    ],
  ])('cancels a response body rejected before a reader for %s', async (_caseName, createResponse, message) => {
    const destinationPath = await destination();
    const response = createResponse();
    const cancel = vi.spyOn(response.body!, 'cancel');

    await expect(
      fetchSource(source(), { destinationPath, fetchImpl: async () => response }),
    ).rejects.toThrow(message);

    expect(cancel).toHaveBeenCalledOnce();
  });

  test('rejects HTML disguised with an allowed declared type using observed bytes', async () => {
    const destinationPath = await destination();

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () => zipResponse('<html>upstream error</html>'),
      }),
    ).rejects.toThrow('observed content does not match zip');

    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test('rejects a malformed cross-paired ZIP signature despite an allowed declared type', async () => {
    const destinationPath = await destination();
    const malformedSignature = Uint8Array.from([0x50, 0x4b, 0x03, 0x06, 0x01]);

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () => zipResponse(malformedSignature),
      }),
    ).rejects.toThrow('observed content does not match zip');

    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test('rejects HTTP partial content instead of promoting an incomplete source', async () => {
    const destinationPath = await destination();

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () =>
          new Response('PK\u0003\u0004partial', {
            status: 206,
            headers: {
              'content-type': 'application/zip',
              'content-range': 'bytes 0-10/100',
            },
          }),
      }),
    ).rejects.toThrow('HTTP 206');

    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test('recognizes a valid format signature split across arbitrary response chunks', async () => {
    const destinationPath = await destination('split-signature.zip');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.from([0x50]));
        controller.enqueue(Uint8Array.from([0x4b, 0x03]));
        controller.enqueue(Uint8Array.from([0x04, 0x01, 0x02]));
        controller.close();
      },
    });

    const result = await fetchSource(source(), {
      destinationPath,
      fetchImpl: async () => zipResponse(stream),
    });

    expect(result.receivedBytes).toBe(6);
    expect(await readFile(destinationPath)).toEqual(
      Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02]),
    );
  });

  test.each([
    ['declared length', zipResponse('PK\u0003\u0004too-large', { 'content-length': '65' })],
    [
      'streamed bytes with a missing length',
      zipResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`PK\u0003\u0004${'x'.repeat(61)}`));
            controller.close();
          },
        }),
      ),
    ],
    [
      'streamed bytes beyond a misleading length',
      zipResponse(`PK\u0003\u0004${'x'.repeat(61)}`, { 'content-length': '8' }),
    ],
  ])('rejects %s above the byte ceiling and leaves no partial cache', async (_caseName, response) => {
    const destinationPath = await destination();

    await expect(
      fetchSource(source(), { destinationPath, fetchImpl: async () => response }),
    ).rejects.toThrow('64 byte limit');

    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test('rejects a truncated response whose body is shorter than content-length', async () => {
    const destinationPath = await destination();

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () => zipResponse('PK\u0003\u0004body', { 'content-length': '30' }),
      }),
    ).rejects.toThrow('truncated body: declared 30 bytes, received 8');

    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test('enforces the redirect ceiling before retrieving a body', async () => {
    const destinationPath = await destination();
    const fetchImpl = vi.fn(async (input: string | URL | Request) =>
      new Response(null, {
        status: 302,
        headers: { location: `${String(input)}/next` },
      }),
    );

    await expect(
      fetchSource(
        source({
          retrieval: { timeoutMs: 1_000, maxRedirects: 1, maxBytes: 64, maxUrlLength: 512 },
        }),
        { destinationPath, fetchImpl },
      ),
    ).rejects.toThrow('redirect limit of 1');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
  });

  test.each([
    ['plain HTTP', 'http://example.test/source.zip', 'must use HTTPS'],
    ['userinfo', 'https://api-key:secret@example.test/source.zip', 'must not contain userinfo'],
    ['malformed URL', 'not a URL', 'invalid URL'],
    ['overlong URL', `https://example.test/${'x'.repeat(600)}`, 'exceeds its 512 character URL limit'],
  ])('rejects an initial %s URL before making a request', async (_caseName, url, message) => {
    const destinationPath = await destination();
    let transportCalled = false;

    await expect(
      fetchSource(source({ url }), {
        destinationPath,
        fetchImpl: async () => {
          transportCalled = true;
          return zipResponse('PK\u0003\u0004body');
        },
      }),
    ).rejects.toThrow(message);

    expect(transportCalled).toBe(false);
  });

  test('rejects a credential-bearing redirect to an unauthorized origin without forwarding it', async () => {
    const destinationPath = await destination();
    const requests: Array<{ url: string; apiKey: string | null }> = [];
    const redirectResponse = new Response('redirect body', {
      status: 302,
      headers: { location: 'https://attacker.test/stolen' },
    });
    const cancelRedirectBody = vi.spyOn(redirectResponse.body!, 'cancel');

    await expect(
      fetchSource(source(), {
        destinationPath,
        headers: { 'x-api-key': 'top-secret' },
        fetchImpl: async (input, init) => {
          requests.push({
            url: String(input),
            apiKey: new Headers(init?.headers).get('x-api-key'),
          });
          return redirectResponse;
        },
      }),
    ).rejects.toThrow('origin https://attacker.test is not allowed');

    expect(requests).toEqual([
      { url: 'https://example.test/source.zip', apiKey: 'top-secret' },
    ]);
    expect(cancelRedirectBody).toHaveBeenCalledOnce();
  });

  test.each([
    ['custom secret', 'x-client-secret', 'top-secret'],
    ['mixed-case custom secret', 'X-CliEnT-SeCrEt', 'mixed-secret'],
    ['cookie', 'Cookie', 'session=top-secret'],
    ['proxy credential', 'Proxy-Authorization', 'Basic top-secret'],
    ['API key', 'x-api-key', 'top-secret'],
    ['authorization credential', 'Authorization', 'Bearer top-secret'],
    ['language preference', 'Accept-Language', 'en-US-private'],
  ])(
    'strips a %s while retaining only safe headers across an allowed cross-origin redirect',
    async (_caseName, unsafeHeaderName, unsafeHeaderValue) => {
      const destinationPath = await destination();
      const requestedUrls: string[] = [];
      let downstreamHeaders: Headers | undefined;

      const result = await fetchSource(
        source({ allowedOrigins: ['https://example.test', 'https://mirror.test'] }),
        {
          destinationPath,
          headers: {
            [unsafeHeaderName]: unsafeHeaderValue,
            Accept: 'application/zip',
            'If-None-Match': '"governed-etag"',
          },
          fetchImpl: async (input, init) => {
            const url = String(input);
            requestedUrls.push(url);
            if (url === 'https://example.test/source.zip') {
              return new Response('redirect body', {
                status: 302,
                headers: { location: 'https://mirror.test/final.zip' },
              });
            }
            downstreamHeaders = new Headers(init?.headers);
            return zipResponse('PK\u0003\u0004mirror');
          },
        },
      );

      expect(result.finalUrl).toBe('https://mirror.test/final.zip');
      expect(requestedUrls).toEqual([
        'https://example.test/source.zip',
        'https://mirror.test/final.zip',
      ]);
      expect(Object.fromEntries(downstreamHeaders!)).toEqual({
        accept: 'application/zip',
        'if-none-match': '"governed-etag"',
      });
      expect(downstreamHeaders!.get(unsafeHeaderName)).toBeNull();
    },
  );

  test('rejects a cross-origin hop when a credentialed source has unknown authentication headers', async () => {
    const destinationPath = await destination();
    const requestedUrls: string[] = [];

    await expect(
      fetchSource(
        source({
          allowedOrigins: ['https://example.test', 'https://mirror.test'],
          credentialEnv: 'MTA_API_KEY',
        }),
        {
          destinationPath,
          headers: { 'x-client-secret': 'top-secret' },
          fetchImpl: async (input) => {
            requestedUrls.push(String(input));
            return new Response('redirect body', {
              status: 302,
              headers: { location: 'https://mirror.test/final.zip' },
            });
          },
        },
      ),
    ).rejects.toThrow('refused a cross-origin redirect for a credentialed source');

    expect(requestedUrls).toEqual(['https://example.test/source.zip']);
  });

  test('follows a safe same-origin redirect and preserves its authorized header', async () => {
    const destinationPath = await destination();
    const requests: Array<{ url: string; apiKey: string | null }> = [];
    const redirectResponse = new Response('redirect body', {
      status: 302,
      headers: { location: '/final.zip' },
    });
    const cancelRedirectBody = vi.spyOn(redirectResponse.body!, 'cancel');

    const result = await fetchSource(source(), {
      destinationPath,
      headers: { 'x-api-key': 'top-secret' },
      fetchImpl: async (input, init) => {
        requests.push({
          url: String(input),
          apiKey: new Headers(init?.headers).get('x-api-key'),
        });
        if (requests.length === 1) {
          return redirectResponse;
        }
        return zipResponse('PK\u0003\u0004final');
      },
    });

    expect(result.finalUrl).toBe('https://example.test/final.zip');
    expect(result.redirectCount).toBe(1);
    expect(requests).toEqual([
      { url: 'https://example.test/source.zip', apiKey: 'top-secret' },
      { url: 'https://example.test/final.zip', apiKey: 'top-secret' },
    ]);
    expect(cancelRedirectBody).toHaveBeenCalledOnce();
  });

  test('validates each URL in a same-origin redirect chain', async () => {
    const destinationPath = await destination();
    const requestedUrls: string[] = [];

    const result = await fetchSource(source(), {
      destinationPath,
      fetchImpl: async (input) => {
        const url = String(input);
        requestedUrls.push(url);
        if (url.endsWith('/source.zip')) {
          return new Response('one', { status: 302, headers: { location: '/second' } });
        }
        if (url.endsWith('/second')) {
          return new Response('two', { status: 307, headers: { location: './final' } });
        }
        return zipResponse('PK\u0003\u0004complete');
      },
    });

    expect(result.redirectCount).toBe(2);
    expect(requestedUrls).toEqual([
      'https://example.test/source.zip',
      'https://example.test/second',
      'https://example.test/final',
    ]);
  });

  test.each([
    ['HTTP', 'http://example.test/insecure', 'must use HTTPS'],
    ['userinfo', 'https://name:password@example.test/private', 'must not contain userinfo'],
    ['overlong', `https://example.test/${'x'.repeat(600)}`, 'exceeds its 512 character URL limit'],
  ])('rejects an invalid %s redirect target before the next request', async (_caseName, location, message) => {
    const destinationPath = await destination();
    let requestCount = 0;

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () => {
          requestCount += 1;
          return new Response('redirect body', { status: 302, headers: { location } });
        },
      }),
    ).rejects.toThrow(message);

    expect(requestCount).toBe(1);
  });

  test.each([
    [
      'observed format',
      () => zipResponse('<html>disguised</html>'),
      'observed content does not match zip',
    ],
    [
      'streamed size',
      () => zipResponse(`PK\u0003\u0004${'x'.repeat(61)}`),
      '64 byte limit',
    ],
    [
      'truncated body',
      () => zipResponse('PK\u0003\u0004body', { 'content-length': '30' }),
      'truncated body',
    ],
  ])('cancels the active reader after a streamed %s rejection', async (_caseName, createResponse, message) => {
    const destinationPath = await destination();
    const cancelReader = vi.spyOn(ReadableStreamDefaultReader.prototype, 'cancel');

    await expect(
      fetchSource(source(), { destinationPath, fetchImpl: async () => createResponse() }),
    ).rejects.toThrow(message);

    expect(cancelReader).toHaveBeenCalledOnce();
  });

  test('cancels the active reader when the hard timeout expires during the body', async () => {
    const destinationPath = await destination();
    let cancelCalls = 0;
    let reads = 0;

    const result = fetchSource(
      source({ retrieval: { timeoutMs: 25, maxRedirects: 2, maxBytes: 64, maxUrlLength: 512 } }),
      {
        destinationPath,
        fetchImpl: async (_input, init) => {
          const reader = {
            async read(): Promise<ReadableStreamReadResult<Uint8Array>> {
              reads += 1;
              if (reads === 1) {
                return { done: false, value: Uint8Array.from([0x50, 0x4b, 0x03, 0x04]) };
              }
              return new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () =>
                  reject(new DOMException('aborted', 'AbortError')),
                );
              });
            },
            async cancel(): Promise<void> {
              cancelCalls += 1;
            },
            releaseLock(): void {},
          };
          return {
            status: 200,
            headers: new Headers({ 'content-type': 'application/zip' }),
            body: { getReader: () => reader },
          } as unknown as Response;
        },
      },
    );
    await expect(result).rejects.toThrow('timed out after 25ms');
    expect(cancelCalls).toBe(1);
  });

  test('promotes a complete response and returns exact retrieval provenance', async () => {
    const destinationPath = await destination('regular.zip');
    const bytes = Buffer.from('PK\u0003\u0004fixture');

    const result = await fetchSource(source(), {
      destinationPath,
      fetchImpl: async () => zipResponse(bytes, { 'content-length': String(bytes.byteLength) }),
      now: () => new Date('2026-08-04T12:34:56.000Z'),
    });

    expect(await readFile(destinationPath)).toEqual(bytes);
    expect(result).toEqual({
      sourceId: 'test-static',
      sourceAuthority: 'MTA',
      sourceRole: 'regular-gtfs',
      sourceUrl: 'https://example.test/source.zip',
      retrievedAt: '2026-08-04T12:34:56.000Z',
      finalUrl: 'https://example.test/source.zip',
      redirectCount: 0,
      declaredContentType: 'application/zip',
      observedContentType: 'application/zip',
      declaredBytes: bytes.byteLength,
      receivedBytes: bytes.byteLength,
      sha256: '102855d599837ca8258d565736139b711e301989df39f506468076decfea1dac',
    });
  });

  test.each([
    [
      'throwing clock',
      () => {
        throw new Error('clock unavailable');
      },
      'clock unavailable',
    ],
    ['invalid Date', () => new Date(Number.NaN), 'invalid retrieval Date'],
  ])('preserves destination bytes when provenance uses a %s', async (_caseName, now, message) => {
    const destinationPath = await destination('provenance.zip');
    await writeFile(destinationPath, 'last-good');

    await expect(
      fetchSource(source(), {
        destinationPath,
        fetchImpl: async () => zipResponse('PK\u0003\u0004replacement'),
        now,
      }),
    ).rejects.toThrow(message);

    expect(await readFile(destinationPath, 'utf8')).toBe('last-good');
    expect(await readdir(join(destinationPath, '..'))).toEqual(['provenance.zip']);
  });

  test.each([
    ['source id', { id: ' ' }, 'non-empty source id'],
    ['source authority', { authority: '' }, 'non-empty source authority'],
  ])('preserves destination bytes for invalid provenance %s', async (_caseName, overrides, message) => {
    const destinationPath = await destination('metadata.zip');
    await writeFile(destinationPath, 'last-good');

    await expect(
      fetchSource(source(overrides), {
        destinationPath,
        fetchImpl: async () => zipResponse('PK\u0003\u0004replacement'),
      }),
    ).rejects.toThrow(message);

    expect(await readFile(destinationPath, 'utf8')).toBe('last-good');
  });

  test('ties cache ordering to fetch start so a slower older response cannot overwrite newer data', async () => {
    const destinationPath = await destination('concurrent.zip');
    let releaseOlderResponse = (_response: Response): void => undefined;
    const olderResponse = new Promise<Response>((resolve) => {
      releaseOlderResponse = resolve;
    });

    const olderFetch = fetchSource(source(), {
      destinationPath,
      fetchImpl: async () => olderResponse,
    });
    const staleRejection = expect(olderFetch).rejects.toThrow('stale cache generation');

    await fetchSource(source(), {
      destinationPath,
      fetchImpl: async () => zipResponse('PK\u0003\u0004newer'),
    });
    releaseOlderResponse(zipResponse('PK\u0003\u0004older'));

    await staleRejection;
    expect(await readFile(destinationPath, 'utf8')).toBe('PK\u0003\u0004newer');
    expect(await readdir(join(destinationPath, '..'))).toEqual(['concurrent.zip']);
  });
});

describe('official transit source registry', () => {
  test('owns only truthful source-level claims for every governed source', () => {
    const registry = createSourceRegistry({
      practicalWalkUrl: 'https://walk.example.test/v1',
      equipmentUrl: 'https://api.example.test/equipment',
      outageUrl: 'https://api.example.test/outages',
    });

    expect(
      Object.fromEntries(registry.map((item) => [item.id, { required: item.required, supports: item.supports }])),
    ).toEqual({
      'regular-subway-gtfs': {
        required: true,
        supports: ['regular-schedule', 'offline-reference'],
      },
      'supplemented-subway-gtfs': {
        required: true,
        supports: ['supplemented-schedule', 'offline-reference', 'commute-evaluation'],
      },
      'subway-rt-1234567s': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-rt-ace': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-rt-bdfm': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-rt-g': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-rt-jz': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-rt-l': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-rt-nqrw': { required: true, supports: ['arrival-evidence', 'commute-evaluation'] },
      'subway-alerts': { required: true, supports: ['service-changes', 'commute-evaluation'] },
      'subway-entrances-i9wp-a4ja': {
        required: true,
        supports: ['nearby-entrances', 'offline-reference'],
      },
      'station-accessibility-39hk-dx4f': {
        required: true,
        supports: ['accessibility-structure', 'offline-reference'],
      },
      'equipment-inventory': { required: false, supports: ['accessibility-equipment-inventory'] },
      'equipment-outages': {
        required: false,
        supports: ['accessibility-equipment-status', 'commute-evaluation'],
      },
      'practical-walk': { required: false, supports: ['nearby-practical-walk'] },
      'complete-path-packages': {
        required: false,
        supports: ['accessibility-structure', 'offline-reference', 'commute-evaluation'],
      },
      'guidance-packages': { required: false, supports: ['guidance'] },
    });
    expect(registry.every((item) => !('requiredForExposure' in item))).toBe(true);
    expect(registry.some((item) => item.supports.includes('commute-delivery'))).toBe(false);

    const entrances = registry.find((item) => item.id === 'subway-entrances-i9wp-a4ja');
    expect(entrances).toMatchObject({
      authority: 'MTA via NY Open Data',
      required: true,
      url: 'https://data.ny.gov/resource/i9wp-a4ja.json?$limit=50000',
    });
    expect(registry.find((item) => item.id === 'subway-alerts')).toMatchObject({
      url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys/subway-alerts',
    });
    expect(registry.find((item) => item.id === 'complete-path-packages')).toMatchObject({
      kind: 'immutable-package',
      required: false,
      records: [],
      supports: ['accessibility-structure', 'offline-reference', 'commute-evaluation'],
    });
    expect(registry.find((item) => item.id === 'guidance-packages')).toMatchObject({
      kind: 'immutable-package',
      required: false,
      records: [],
      supports: ['guidance'],
    });
  });

  test('keeps optional credential-backed and adapter sources disabled unless configured', () => {
    const registry = createSourceRegistry({});

    expect(registry.find((item) => item.id === 'equipment-inventory')).toMatchObject({
      required: false,
      enabled: false,
      credentialEnv: 'MTA_API_KEY',
    });
    expect(registry.find((item) => item.id === 'equipment-outages')).toMatchObject({
      required: false,
      enabled: false,
      credentialEnv: 'MTA_API_KEY',
    });
    expect(registry.find((item) => item.id === 'practical-walk')).toMatchObject({
      required: false,
      enabled: false,
      auditRequired: true,
      supports: ['nearby-practical-walk'],
      retrieval: { timeoutMs: 4_000, maxRedirects: 0, maxBytes: 1_048_576 },
    });
    expect(createSourceRegistry({ practicalWalkUrl: 'https://walk.example.test/v1/matrix' })
      .find((item) => item.id === 'practical-walk')).toMatchObject({ enabled: false });
    expect(createSourceRegistry({
      practicalWalkUrl: 'https://walk.example.test/v1/matrix',
      practicalWalkAuditApproved: true,
    }).find((item) => item.id === 'practical-walk')).toMatchObject({
      enabled: true,
      allowedOrigins: ['https://walk.example.test'],
    });
  });

  test('applies a matching observed JSON-or-XML policy to configured equipment feeds', async () => {
    const equipment = createSourceRegistry({ equipmentUrl: 'https://api.example.test/equipment' }).find(
      (item) => item.id === 'equipment-inventory',
    );
    if (!equipment || equipment.kind !== 'remote') throw new Error('equipment source missing');
    const destinationPath = await destination('equipment.xml');

    const result = await fetchSource(equipment, {
      destinationPath,
      fetchImpl: async () =>
        new Response('<?xml version="1.0"?><equipment />', {
          headers: { 'content-type': 'application/xml' },
        }),
      now: () => new Date('2026-08-04T13:00:00.000Z'),
    });

    expect(result.observedContentType).toBe('application/xml');
    expect(await readFile(destinationPath, 'utf8')).toBe('<?xml version="1.0"?><equipment />');
  });
});
