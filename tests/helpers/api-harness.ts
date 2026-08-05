import { createServer, request as createRequest, type Server } from 'node:http';

import type { Express } from 'express';

export interface ApiHarness {
  readonly baseUrl: string;
  request(path: string, init?: RequestInit): Promise<Response>;
  rawRequest(path: string, init?: { readonly method?: string; readonly headers?: Record<string, string>; readonly body?: string }): Promise<Response>;
}

export async function withApi<T>(app: Express, use: (api: ApiHarness) => Promise<T>): Promise<T> {
  const server = createServer(app);
  await listen(server);
  const address = server.address();
  if (!address || typeof address === 'string') {
    await close(server);
    throw new Error('API test server did not bind a TCP address');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await use({
      baseUrl,
      request: (path, init) => fetch(`${baseUrl}${path}`, init),
      rawRequest: (path, init) => requestRaw(address.port, path, init),
    });
  } finally {
    await close(server);
  }
}

function requestRaw(
  port: number,
  path: string,
  init: { readonly method?: string; readonly headers?: Record<string, string>; readonly body?: string } = {},
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = createRequest({
      host: '127.0.0.1', port, path, method: init.method ?? 'GET', headers: init.headers,
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.once('error', reject);
      response.once('end', () => resolve(new Response(Buffer.concat(chunks), {
        status: response.statusCode ?? 500,
        headers: Object.fromEntries(Object.entries(response.headers)
          .filter((entry): entry is [string, string | string[]] => entry[1] !== undefined)
          .map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value])),
      })));
    });
    request.once('error', reject);
    if (init.body !== undefined) request.write(init.body);
    request.end();
  });
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}
