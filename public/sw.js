const CACHE_NAMES = Object.freeze({
  shell: 'subway-first-shell-v1',
  structural: 'subway-first-structural-v1',
  historical: 'subway-first-history-v1',
});

const RETIRED_CACHES = Object.freeze([
  'subway-first-shell-v0',
  'subway-first-structural-v0',
  'subway-first-history-v0',
]);

const SHELL_URLS = Object.freeze([
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/app-icon.svg',
]);

const SENSITIVE_QUERY_KEYS = new Set([
  'accuracy', 'apikey', 'authorization', 'coordinate', 'coordinates', 'cookie',
  'key', 'lat', 'latitude', 'lng', 'location', 'lon', 'longitude', 'session', 'token',
]);

const HISTORICAL_LIMIT = 48;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE_NAMES.shell);
    await shell.addAll(SHELL_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const existing = new Set(await caches.keys());
    for (const retired of RETIRED_CACHES) {
      if (existing.has(retired)) await caches.delete(retired);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const policy = classifyRequest(event.request);
  if (policy === null) return;
  if (policy === 'navigation') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }
  if (policy === 'shell') {
    event.respondWith(cacheFirst(event.request, CACHE_NAMES.shell));
    return;
  }
  if (policy === 'structural') {
    event.respondWith(cacheFirst(event.request, CACHE_NAMES.structural));
    return;
  }
  event.respondWith(networkFirstHistorical(event.request));
});

function classifyRequest(request) {
  if (!request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || hasSensitiveRequestMaterial(request, url)) return null;

  if (request.mode === 'navigate') return 'navigation';
  if (url.search !== '') return classifyEligibleQuery(url);

  if (/^\/assets\/[A-Za-z0-9_.-]+\.(?:css|js|png|svg|woff|woff2)$/.test(url.pathname)
    || url.pathname === '/manifest.webmanifest'
    || url.pathname === '/icons/app-icon.svg') return 'shell';

  if (/^\/api\/v1\/stations\/catalog\/[^/]+$/.test(url.pathname)
    || /^\/api\/v1\/maps\/(?:day|night)\/reference\/[^/]+$/.test(url.pathname)) return 'structural';

  if (/^\/api\/v1\/stations\/[^/]+\/board$/.test(url.pathname)
    || /^\/api\/v1\/maps\/(?:day|night)\/overlay$/.test(url.pathname)
    || url.pathname === '/api/v1/status') return 'historical';

  return null;
}

function classifyEligibleQuery(url) {
  if (!/^\/api\/v1\/stations\/[^/]+\/board$/.test(url.pathname)) return null;
  const allowed = new Set(['direction', 'routes']);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key)) return null;
  }
  return 'historical';
}

function hasSensitiveRequestMaterial(request, url) {
  if (request.headers?.has('authorization')
    || request.headers?.has('cookie')
    || request.headers?.has('x-api-key')) return true;
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) return true;
  }
  return false;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response, false)) {
      const shell = await caches.open(CACHE_NAMES.shell);
      await shell.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    const shell = await caches.open(CACHE_NAMES.shell);
    const fallback = await shell.match('/index.html') || await shell.match('/');
    if (fallback) return fallback;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const stored = await cache.match(request);
  if (stored) return stored;
  const response = await fetch(request);
  if (isCacheableResponse(response, cacheName === CACHE_NAMES.structural)) await cache.put(request, response.clone());
  return response;
}

async function networkFirstHistorical(request) {
  const cache = await caches.open(CACHE_NAMES.historical);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response, true)) {
      await cache.put(request, response.clone());
      await trimCache(cache, HISTORICAL_LIMIT);
    }
    return response;
  } catch (error) {
    const stored = await cache.match(request);
    if (!stored) throw error;
    const body = await stored.arrayBuffer();
    const headers = new Headers(stored.headers);
    headers.set('x-subway-cache-state', 'historical');
    return new Response(body, {
      status: stored.status,
      statusText: stored.statusText,
      headers,
    });
  }
}

function isCacheableResponse(response, requireJson) {
  if (!response || !response.ok || response.type === 'opaque') return false;
  if (requireJson && !/^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) return false;
  const cacheControl = response.headers.get('cache-control')?.toLowerCase() || '';
  if (cacheControl.includes('no-store') || cacheControl.includes('private')) return false;
  if (response.headers.has('set-cookie') || response.headers.get('vary') === '*') return false;
  return true;
}

async function trimCache(cache, maximum) {
  const keys = await cache.keys();
  const excess = keys.length - maximum;
  for (let index = 0; index < excess; index += 1) await cache.delete(keys[index]);
}
