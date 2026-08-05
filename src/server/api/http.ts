import { createHash } from 'node:crypto';

import type { Request, Response } from 'express';

export function sendNoStoreJson(response: Response, status: number, body: unknown): void {
  response.setHeader('Cache-Control', 'no-store');
  response.status(status).json(body);
}

export function createStrongEtag(body: unknown): string {
  return `"${createHash('sha256').update(JSON.stringify(body)).digest('hex')}"`;
}

export function sendImmutableJson(request: Request, response: Response, body: unknown): void {
  const etag = createStrongEtag(body);
  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  response.setHeader('ETag', etag);
  if (ifNoneMatch(request.headers['if-none-match'], etag)) {
    response.status(304).end();
    return;
  }
  response.status(200).json(body);
}

function ifNoneMatch(value: string | undefined, etag: string): boolean {
  if (!value) return false;
  return value.split(',').some((candidate) => {
    const normalized = candidate.trim();
    return normalized === '*' || normalized === etag || normalized === `W/${etag}`;
  });
}
