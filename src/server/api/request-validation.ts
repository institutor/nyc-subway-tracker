import type { NextFunction, Request, Response } from 'express';

import { normalizeBoundedIdentity, normalizeCanonicalIdentity } from '../../shared/domain/canonical';
import { parseCoordinate } from '../../shared/domain/geo';
import type { JourneyQuery } from '../../shared/domain/journey-router';
import type { Direction } from '../../shared/domain/types';
import { sendNoStoreJson } from './http';
import type { SafeLogger } from '../bootstrap';

export const MAX_URL_BYTES = 2_048;
export const MAX_JSON_BYTES = 16 * 1_024;

export class ApiRequestError extends Error {
  constructor(readonly status: number, readonly code: string = 'invalid_request') {
    super(code);
  }
}

export function enforceUrlLimit(request: Request, response: Response, next: NextFunction): void {
  if (Buffer.byteLength(request.originalUrl, 'utf8') > MAX_URL_BYTES) {
    sendNoStoreJson(response, 414, { error: { code: 'uri_too_long', message: 'Request could not be processed.' } });
    return;
  }
  next();
}

export function verifyStrictJson(_request: Request, _response: Response, buffer: Buffer): void {
  assertNoDuplicateObjectKeys(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
}

export function assertExactQuery(request: Request, allowed: readonly string[]): Record<string, string | undefined> {
  const query = request.query as Record<string, unknown>;
  const keys = Object.keys(query);
  if (keys.some((key) => !allowed.includes(key))) throw new ApiRequestError(400);
  const result: Record<string, string | undefined> = {};
  for (const key of allowed) {
    const value = query[key];
    if (value !== undefined && typeof value !== 'string') throw new ApiRequestError(400);
    result[key] = value as string | undefined;
  }
  return result;
}

export function parseApiIdentifier(value: unknown, label = 'identifier'): string {
  if (typeof value !== 'string') throw new ApiRequestError(400);
  try {
    const normalized = normalizeBoundedIdentity(value, label, 128);
    if (new TextEncoder().encode(normalized).byteLength > 128) throw new Error('byte limit');
    return normalized;
  } catch {
    throw new ApiRequestError(400);
  }
}

export function parseSearchRequest(request: Request): { query: string; limit: number } {
  const values = assertExactQuery(request, ['q', 'limit']);
  if (typeof values.q !== 'string') throw new ApiRequestError(400);
  let normalized: string;
  try { normalized = normalizeCanonicalIdentity(values.q); } catch { throw new ApiRequestError(400); }
  if (/[\u0000-\u001f\u007f]/u.test(normalized)) throw new ApiRequestError(400);
  normalized = normalized.trim();
  const scalars = [...normalized].length;
  if (scalars < 1 || scalars > 100 || new TextEncoder().encode(normalized).byteLength > 256) throw new ApiRequestError(400);
  return { query: normalized, limit: values.limit === undefined ? 10 : parseLimit(values.limit) };
}

export function parseBoardRequest(request: Request) {
  const stationId = parseApiIdentifier(request.params.stationId, 'station');
  const values = assertExactQuery(request, ['routes', 'direction']);
  return { stationId, routeIds: parseRouteIds(values.routes), direction: parseDirection(values.direction) };
}

export function parseStatusRequest(request: Request) {
  const values = assertExactQuery(request, ['stationId', 'routes', 'direction']);
  return {
    stationId: values.stationId === undefined ? undefined : parseApiIdentifier(values.stationId, 'station'),
    routeIds: parseRouteIds(values.routes),
    direction: parseDirection(values.direction),
  };
}

export function parseNearbyRequest(request: Request) {
  assertExactQuery(request, []);
  const record = strictRecord(request.body, ['location', 'accessibleRouteOnly']);
  if (typeof record.accessibleRouteOnly !== 'boolean') throw new ApiRequestError(400);
  const location = strictRecord(record.location, ['latitude', 'longitude', 'accuracyMeters']);
  if (typeof location.accuracyMeters !== 'number' || !Number.isFinite(location.accuracyMeters) || location.accuracyMeters <= 0) throw new ApiRequestError(400);
  try {
    return {
      coordinate: parseCoordinate({ latitude: location.latitude, longitude: location.longitude }),
      accuracyMeters: location.accuracyMeters,
      accessibleRouteOnly: record.accessibleRouteOnly,
    };
  } catch { throw new ApiRequestError(400); }
}

export function parseJourneyRequest(request: Request): JourneyQuery {
  assertExactQuery(request, []);
  const record = strictRecord(
    request.body,
    ['mode', 'originStationId', 'destinationStationId', 'accessibleRouteOnly'],
    ['requiredFirstDirection', 'requiredActualDestination', 'serviceDate'],
  );
  const mode = record.mode;
  if (mode !== 'online-current' && mode !== 'online-future' && mode !== 'offline-reference') throw new ApiRequestError(400);
  if (typeof record.accessibleRouteOnly !== 'boolean') throw new ApiRequestError(400);
  const requiredFirstDirection = parseDirection(record.requiredFirstDirection as string | undefined);
  if (record.requiredActualDestination !== undefined && !validDisplayText(record.requiredActualDestination)) throw new ApiRequestError(400);
  if (mode === 'online-future') {
    if (typeof record.serviceDate !== 'string' || !validServiceDate(record.serviceDate)) throw new ApiRequestError(400);
  } else if (record.serviceDate !== undefined) throw new ApiRequestError(400);
  return {
    mode,
    originStationId: parseApiIdentifier(record.originStationId, 'origin station'),
    destinationStationId: parseApiIdentifier(record.destinationStationId, 'destination station'),
    ...(requiredFirstDirection === undefined ? {} : { requiredFirstDirection }),
    ...(record.requiredActualDestination === undefined ? {} : { requiredActualDestination: record.requiredActualDestination as string }),
    accessibleRouteOnly: record.accessibleRouteOnly,
    ...(record.serviceDate === undefined ? {} : { serviceDate: record.serviceDate as string }),
  };
}

export function methodNotAllowed(allowed: readonly string[]) {
  return (_request: Request, response: Response): void => {
    response.setHeader('Allow', allowed.join(', '));
    sendNoStoreJson(response, 405, { error: { code: 'method_not_allowed', message: 'Request method is not allowed.' } });
  };
}

export function notFound(_request: Request, response: Response): void {
  sendNoStoreJson(response, 404, { error: { code: 'not_found', message: 'Resource not found.' } });
}

export function createApiErrorHandler(logger: SafeLogger) {
  return (error: unknown, request: Request, response: Response, _next: NextFunction): void => {
    if (response.headersSent || response.destroyed) return;
    const shaped = error as { status?: unknown; type?: unknown };
    const status = error instanceof ApiRequestError ? error.status
      : shaped?.type === 'entity.too.large' ? 413
        : shaped?.type === 'entity.parse.failed' || shaped?.type === 'entity.verify.failed' ? 400
          : shaped?.status === 415 ? 415 : 500;
    const code = error instanceof ApiRequestError ? error.code
      : status === 413 ? 'payload_too_large'
        : status === 415 ? 'unsupported_media_type'
          : status === 500 ? 'internal_error' : 'invalid_request';
    try { logger.log({ event: 'request_rejected', method: request.method, status, code }); } catch { /* logging never changes the response */ }
    sendNoStoreJson(response, status, {
      error: { code, message: status === 500 ? 'Request could not be completed.' : 'Request could not be processed.' },
    });
  };
}

function parseLimit(value: string): number {
  if (!/^(?:[1-9]|1\d|2[0-5])$/.test(value)) throw new ApiRequestError(400);
  return Number(value);
}

function parseRouteIds(value: string | undefined): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  const raw = value.split(',');
  if (raw.length < 1 || raw.length > 12 || raw.some((item) => item === '')) throw new ApiRequestError(400);
  const values = raw.map((item) => parseApiIdentifier(item, 'route'));
  if (new Set(values).size !== values.length) throw new ApiRequestError(400);
  return Object.freeze(values);
}

function parseDirection(value: string | undefined): Direction | undefined {
  if (value === undefined) return undefined;
  const directions: readonly Direction[] = ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'];
  if (!directions.includes(value as Direction)) throw new ApiRequestError(400);
  return value as Direction;
}

function strictRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new ApiRequestError(400);
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const allowed = [...required, ...optional];
  if (required.some((key) => !Object.hasOwn(record, key)) || keys.some((key) => !allowed.includes(key))) throw new ApiRequestError(400);
  return record;
}

function validDisplayText(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const normalized = normalizeCanonicalIdentity(value).trim();
    return normalized.length > 0 && [...normalized].length <= 256
      && new TextEncoder().encode(normalized).byteLength <= 1_024
      && !/[\u0000-\u001f\u007f]/u.test(normalized);
  } catch { return false; }
}

function validServiceDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() + 1 === Number(match[2]) && date.getUTCDate() === Number(match[3]);
}

function assertNoDuplicateObjectKeys(text: string): void {
  let index = 0;
  const whitespace = () => { while (/\s/u.test(text[index] ?? '')) index += 1; };
  const string = (): string => {
    const start = index;
    if (text[index] !== '"') throw new Error('Invalid JSON string');
    index += 1;
    while (index < text.length) {
      if (text[index] === '\\') { index += 2; continue; }
      if (text[index] === '"') { index += 1; return JSON.parse(text.slice(start, index)) as string; }
      index += 1;
    }
    throw new Error('Unterminated JSON string');
  };
  const value = (): void => {
    whitespace();
    if (text[index] === '{') { object(); return; }
    if (text[index] === '[') { array(); return; }
    if (text[index] === '"') { string(); return; }
    const start = index;
    while (index < text.length && !/[\s,\]}]/u.test(text[index])) index += 1;
    if (start === index) throw new Error('Invalid JSON value');
    JSON.parse(text.slice(start, index));
  };
  const object = (): void => {
    index += 1; whitespace();
    const keys = new Set<string>();
    if (text[index] === '}') { index += 1; return; }
    while (true) {
      whitespace();
      const key = string();
      if (keys.has(key)) throw new Error('Duplicate JSON object key');
      keys.add(key); whitespace();
      if (text[index] !== ':') throw new Error('Invalid JSON object');
      index += 1; value(); whitespace();
      if (text[index] === '}') { index += 1; return; }
      if (text[index] !== ',') throw new Error('Invalid JSON object');
      index += 1;
    }
  };
  const array = (): void => {
    index += 1; whitespace();
    if (text[index] === ']') { index += 1; return; }
    while (true) {
      value(); whitespace();
      if (text[index] === ']') { index += 1; return; }
      if (text[index] !== ',') throw new Error('Invalid JSON array');
      index += 1;
    }
  };
  whitespace(); value(); whitespace();
  if (index !== text.length) throw new Error('Trailing JSON input');
}
