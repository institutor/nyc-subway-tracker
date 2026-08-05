// @vitest-environment node

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, test, vi } from 'vitest';

const SW_PATH = new URL('../../public/sw.js', import.meta.url);

describe('offline service-worker policy', () => {
  test('precaches the reloadable app shell in its own versioned cohort', async () => {
    const worker = createWorker();

    await worker.dispatchLifecycle('install');

    expect(worker.cache('subway-first-shell-v1').added).toEqual([
      '/', '/index.html', '/manifest.webmanifest', '/icons/app-icon.svg',
    ]);
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1);
    expect(worker.cacheNames()).toEqual(['subway-first-shell-v1']);
  });

  test('migrates only explicitly retired Subway First cohorts and preserves unrelated caches', async () => {
    const worker = createWorker([
      'subway-first-shell-v0', 'subway-first-structural-v0', 'subway-first-history-v0',
      'another-product-v4', 'subway-first-not-owned',
    ]);

    await worker.dispatchLifecycle('activate');

    expect(worker.deleted).toEqual([
      'subway-first-shell-v0', 'subway-first-structural-v0', 'subway-first-history-v0',
    ]);
    expect(worker.cacheNames()).toEqual(['another-product-v4', 'subway-first-not-owned']);
    expect(worker.claimClients).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['POST Nearby', request('/api/v1/nearby', { method: 'POST' })],
    ['coordinate query', request('/api/v1/stations/catalog/catalog-v1?latitude=40.7')],
    ['secret query', request('/api/v1/maps/day/reference/map-v1?token=secret')],
    ['underscored API key', request('/api/v1/maps/day/reference/map-v1?api_key=secret')],
    ['authorization header', request('/api/v1/stations/station-a/board', { headers: { authorization: 'Bearer secret' } })],
    ['private diagnostics', request('/api/v1/diagnostics/source-health')],
    ['unowned broad API path', request('/api/v1/stations/station-a')],
    ['cross-origin request', request('https://example.net/api/v1/maps/day/reference/map-v1')],
  ])('does not intercept or cache %s', async (_name, controlledRequest) => {
    const worker = createWorker();

    const response = await worker.dispatchFetch(controlledRequest);

    expect(response).toBeUndefined();
    expect(worker.fetcher).not.toHaveBeenCalled();
    expect(worker.allPuts()).toEqual([]);
  });

  test('cache-first stores only exact immutable station catalogs and map references', async () => {
    const worker = createWorker();
    worker.fetcher.mockResolvedValue(new Response('{"ok":true}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await worker.dispatchFetch(request('/api/v1/stations/catalog/catalog-v1'));
    await worker.dispatchFetch(request('/api/v1/maps/night/reference/map-v1'));

    expect(worker.cache('subway-first-structural-v1').puts.map(({ key }) => key)).toEqual([
      'https://subway.test/api/v1/stations/catalog/catalog-v1',
      'https://subway.test/api/v1/maps/night/reference/map-v1',
    ]);
    expect(worker.cache('subway-first-history-v1').puts).toEqual([]);
  });

  test('serves a failed recent board or overlay only as explicitly historical content', async () => {
    const worker = createWorker();
    const board = request('/api/v1/stations/station-a/board?routes=F&direction=northbound');
    const overlay = request('/api/v1/maps/day/overlay');
    worker.cache('subway-first-history-v1').seed(board.url, new Response('{"board":"stored"}', {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    worker.cache('subway-first-history-v1').seed(overlay.url, new Response('{"overlay":"stored"}', {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    worker.fetcher.mockRejectedValue(new TypeError('network unreachable'));

    const boardResponse = await worker.dispatchFetch(board);
    const overlayResponse = await worker.dispatchFetch(overlay);

    expect(boardResponse?.headers.get('x-subway-cache-state')).toBe('historical');
    expect(await boardResponse?.json()).toEqual({ board: 'stored' });
    expect(overlayResponse?.headers.get('x-subway-cache-state')).toBe('historical');
  });

  test('does not persist private or no-store responses even for an eligible public path', async () => {
    const worker = createWorker();
    worker.fetcher.mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'cache-control': 'private, no-store', 'set-cookie': 'session=secret' },
    }));

    await worker.dispatchFetch(request('/api/v1/stations/station-a/board'));

    expect(worker.allPuts()).toEqual([]);
  });

  test('does not persist an HTML or otherwise non-JSON response under an eligible API key', async () => {
    const worker = createWorker();
    worker.fetcher.mockResolvedValue(new Response('<form>sign in</form>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));

    await worker.dispatchFetch(request('/api/v1/stations/catalog/catalog-v1'));

    expect(worker.allPuts()).toEqual([]);
  });

  test('reloads the cached app shell when a navigation request cannot reach the network', async () => {
    const worker = createWorker();
    worker.cache('subway-first-shell-v1').seed('/index.html', new Response('<main>offline shell</main>', {
      status: 200, headers: { 'content-type': 'text/html' },
    }));
    worker.fetcher.mockRejectedValue(new TypeError('network unreachable'));

    const response = await worker.dispatchFetch(request('/saved', { mode: 'navigate' }));

    expect(await response?.text()).toBe('<main>offline shell</main>');
  });
});

interface ControlledRequest {
  readonly url: string;
  readonly method: string;
  readonly mode: string;
  readonly destination: string;
  readonly headers: Headers;
}

function request(path: string, init: { method?: string; mode?: string; destination?: string; headers?: HeadersInit } = {}): ControlledRequest {
  return {
    url: path.startsWith('http') ? path : `https://subway.test${path}`,
    method: init.method ?? 'GET',
    mode: init.mode ?? 'cors',
    destination: init.destination ?? '',
    headers: new Headers(init.headers),
  };
}

function createWorker(initialCaches: readonly string[] = []) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const caches = new ControlledCacheStorage(initialCaches);
  const fetcher = vi.fn<(request: ControlledRequest) => Promise<Response>>();
  const skipWaiting = vi.fn(async () => undefined);
  const claimClients = vi.fn(async () => undefined);
  const workerScope: Record<string, unknown> = {
    URL,
    Headers,
    Response,
    Request,
    console,
    setTimeout,
    clearTimeout,
    caches,
    fetch: fetcher,
    location: { origin: 'https://subway.test' },
    clients: { claim: claimClients },
    skipWaiting,
    addEventListener: (type: string, listener: (event: Record<string, unknown>) => void) => listeners.set(type, listener),
  };
  workerScope.self = workerScope;
  runInNewContext(readFileSync(SW_PATH, 'utf8'), workerScope, { filename: SW_PATH.pathname });

  return {
    fetcher,
    skipWaiting,
    claimClients,
    deleted: caches.deleted,
    cache: (name: string) => caches.cache(name),
    cacheNames: () => caches.names(),
    allPuts: () => caches.allPuts(),
    async dispatchLifecycle(type: 'install' | 'activate') {
      let work: Promise<unknown> | undefined;
      listeners.get(type)?.({ waitUntil: (promise: Promise<unknown>) => { work = promise; } });
      await work;
    },
    async dispatchFetch(controlledRequest: ControlledRequest): Promise<Response | undefined> {
      let response: Promise<Response> | undefined;
      listeners.get('fetch')?.({
        request: controlledRequest,
        respondWith: (promise: Promise<Response>) => { response = promise; },
      });
      return response ? response : undefined;
    },
  };
}

class ControlledCacheStorage {
  readonly deleted: string[] = [];
  private readonly values = new Map<string, ControlledCache>();

  constructor(names: readonly string[]) {
    for (const name of names) this.values.set(name, new ControlledCache());
  }

  async open(name: string): Promise<ControlledCache> {
    return this.cache(name);
  }

  async keys(): Promise<string[]> {
    return this.names();
  }

  async delete(name: string): Promise<boolean> {
    this.deleted.push(name);
    return this.values.delete(name);
  }

  cache(name: string): ControlledCache {
    const existing = this.values.get(name);
    if (existing) return existing;
    const created = new ControlledCache();
    this.values.set(name, created);
    return created;
  }

  names(): string[] {
    return [...this.values.keys()];
  }

  allPuts(): Array<{ key: string; response: Response }> {
    return [...this.values.values()].flatMap(({ puts }) => puts);
  }
}

class ControlledCache {
  readonly added: string[] = [];
  readonly puts: Array<{ key: string; response: Response }> = [];
  private readonly values = new Map<string, Response>();

  async addAll(urls: readonly string[]): Promise<void> {
    this.added.push(...urls);
  }

  async match(input: string | ControlledRequest): Promise<Response | undefined> {
    const key = typeof input === 'string' ? input : input.url;
    return this.values.get(key)?.clone();
  }

  async put(input: string | ControlledRequest, response: Response): Promise<void> {
    const key = typeof input === 'string' ? input : input.url;
    this.puts.push({ key, response: response.clone() });
    this.values.set(key, response.clone());
  }

  async keys(): Promise<Array<{ url: string }>> {
    return [...this.values.keys()].map((url) => ({ url }));
  }

  async delete(input: { url: string }): Promise<boolean> {
    return this.values.delete(input.url);
  }

  seed(key: string, response: Response): void {
    this.values.set(key, response.clone());
  }
}
