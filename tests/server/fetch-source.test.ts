import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
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
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

function source(overrides: Partial<RemoteSource> = {}): RemoteSource {
  return {
    id: 'test-static',
    authority: 'MTA',
    kind: 'remote',
    role: 'regular-gtfs',
    required: true,
    requiredForExposure: ['arrival-boards'],
    url: 'https://example.test/source.zip',
    expectedFormat: 'zip',
    acceptedContentTypes: ['application/zip'],
    retrieval: { timeoutMs: 1_000, maxRedirects: 2, maxBytes: 64 },
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

    const result = fetchSource(source({ retrieval: { timeoutMs: 25, maxRedirects: 2, maxBytes: 64 } }), {
      destinationPath,
      fetchImpl,
      now: () => new Date('2026-08-04T12:00:00.000Z'),
    });
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
      fetchSource(source({ retrieval: { timeoutMs: 1_000, maxRedirects: 1, maxBytes: 64 } }), {
        destinationPath,
        fetchImpl,
      }),
    ).rejects.toThrow('redirect limit of 1');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await readdir(join(destinationPath, '..'))).toEqual([]);
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
});

describe('official transit source registry', () => {
  test('registers every subway realtime group and the exact governed source classes', () => {
    const registry = createSourceRegistry({
      practicalWalkUrl: 'https://walk.example.test/v1',
      equipmentUrl: 'https://api.example.test/equipment',
      outageUrl: 'https://api.example.test/outages',
    });

    expect(registry.filter((item) => item.role === 'subway-realtime').map((item) => item.id)).toEqual([
      'subway-rt-1234567s',
      'subway-rt-ace',
      'subway-rt-bdfm',
      'subway-rt-g',
      'subway-rt-jz',
      'subway-rt-l',
      'subway-rt-nqrw',
    ]);
    expect(registry.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'regular-subway-gtfs',
        'supplemented-subway-gtfs',
        'subway-alerts',
        'subway-entrances-i9wp-a4ja',
        'station-accessibility-39hk-dx4f',
        'equipment-inventory',
        'equipment-outages',
        'practical-walk',
        'complete-path-packages',
        'guidance-packages',
      ]),
    );

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
      requiredForExposure: ['accessibility'],
    });
    expect(registry.find((item) => item.id === 'guidance-packages')).toMatchObject({
      kind: 'immutable-package',
      required: false,
      records: [],
      requiredForExposure: ['guidance'],
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
      requiredForExposure: ['nearby-offline'],
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
