import { createServer, type Server } from 'node:http';

import type { Express } from 'express';

export interface ApiHarness {
  readonly baseUrl: string;
  request(path: string, init?: RequestInit): Promise<Response>;
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
    });
  } finally {
    await close(server);
  }
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
