import type { Request, Response } from 'express';

import type { CommuteStage } from '../../shared/domain/types';
import { createCommuteWindowRegistration, type CommuteWindowRegistration } from '../../shared/domain/commute-window';
import { sendNoStoreJson } from '../api/http';
import { ApiRequestError, assertExactQuery } from '../api/request-validation';
import type { SubscriptionStore } from '../notifications/subscription-store';
import { authorizesDelivery, type CommuteDeliveryAuthorization } from '../notifications/notification-authorization';

export interface NotificationRuntime {
  readonly stage: CommuteStage;
  readonly deliveryAuthorization?: CommuteDeliveryAuthorization;
  readonly publicKey?: string;
  readonly subscriptions: SubscriptionStore;
}

export function vapidPublicKeyHandler(runtime: NotificationRuntime) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    if (!canSubscribe(runtime) || !runtime.publicKey) {
      sendNoStoreJson(response, 423, { availability: 'locked' });
      return;
    }
    sendNoStoreJson(response, 200, { publicKey: runtime.publicKey });
  };
}

export function createSubscriptionHandler(runtime: NotificationRuntime) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    if (!canSubscribe(runtime)) {
      sendNoStoreJson(response, 423, { availability: 'locked' });
      return;
    }
    const body = strictRecord(request.body, ['endpoint', 'keys', 'commuteWindows']);
    const keys = strictRecord(body.keys, ['p256dh', 'auth']);
    try {
      runtime.subscriptions.upsert({
        endpoint: string(body.endpoint),
        keys: { p256dh: string(keys.p256dh), auth: string(keys.auth) },
        commuteWindows: registrations(body.commuteWindows),
      });
    } catch {
      throw new ApiRequestError(400);
    }
    sendNoStoreJson(response, 201, { subscribed: true });
  };
}

export function deleteSubscriptionHandler(runtime: NotificationRuntime) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    if (!canSubscribe(runtime)) {
      sendNoStoreJson(response, 423, { availability: 'locked' });
      return;
    }
    const body = strictRecord(request.body, ['endpoint']);
    let removed = false;
    try { removed = runtime.subscriptions.delete(string(body.endpoint)); } catch { throw new ApiRequestError(400); }
    sendNoStoreJson(response, 200, { subscribed: false, removed });
  };
}

export function subscriptionStatusHandler(runtime: NotificationRuntime) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    if (!canSubscribe(runtime)) {
      sendNoStoreJson(response, 423, { availability: 'locked' });
      return;
    }
    const body = strictRecord(request.body, ['endpoint', 'commuteWindows']);
    let endpoint: string;
    let requested: readonly CommuteWindowRegistration[];
    try {
      endpoint = string(body.endpoint);
      requested = registrations(body.commuteWindows);
    } catch {
      throw new ApiRequestError(400);
    }
    const subscription = runtime.subscriptions.get(endpoint);
    const state = !subscription ? 'none'
      : sameRegistrations(subscription.commuteWindows, requested) ? 'current' : 'stale';
    sendNoStoreJson(response, 200, { state });
  };
}

function canSubscribe(runtime: NotificationRuntime): boolean {
  return authorizesDelivery(runtime.deliveryAuthorization, runtime.stage);
}

function strictRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new ApiRequestError(400);
  const record = value as Record<string, unknown>;
  const allowed = [...required, ...optional];
  if (required.some((key) => !Object.hasOwn(record, key)) || Object.keys(record).some((key) => !allowed.includes(key))) throw new ApiRequestError(400);
  return record;
}

function string(value: unknown): string {
  if (typeof value !== 'string') throw new ApiRequestError(400);
  return value;
}

function registrations(value: unknown): readonly CommuteWindowRegistration[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 128) throw new ApiRequestError(400);
  try {
    return value.map((entry) => {
      const row = strictRecord(entry, ['id', 'weekdays', 'startsAt', 'endsAt', 'preparationLeadMinutes', 'scope']);
      const scope = strictRecord(row.scope, ['routeId', 'direction', 'originStationId', 'destinationStationId', 'segmentStationIds']);
      return createCommuteWindowRegistration({
        id: string(row.id),
        weekdays: numberArray(row.weekdays) as CommuteWindowRegistration['weekdays'],
        startsAt: string(row.startsAt),
        endsAt: string(row.endsAt),
        preparationLeadMinutes: number(row.preparationLeadMinutes),
        scope: {
          routeId: string(scope.routeId),
          direction: string(scope.direction) as CommuteWindowRegistration['scope']['direction'],
          originStationId: string(scope.originStationId),
          destinationStationId: string(scope.destinationStationId),
          segmentStationIds: stringArray(scope.segmentStationIds),
        },
      });
    });
  } catch {
    throw new ApiRequestError(400);
  }
}

function number(value: unknown): number {
  if (typeof value !== 'number') throw new ApiRequestError(400);
  return value;
}

function numberArray(value: unknown): readonly number[] {
  if (!Array.isArray(value)) throw new ApiRequestError(400);
  return value.map(number);
}

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) throw new ApiRequestError(400);
  return value.map(string);
}

function sameRegistrations(left: readonly CommuteWindowRegistration[], right: readonly CommuteWindowRegistration[]): boolean {
  const serialized = (values: readonly CommuteWindowRegistration[]) => values
    .map((value) => JSON.stringify(createCommuteWindowRegistration(value)))
    .sort();
  return JSON.stringify(serialized(left)) === JSON.stringify(serialized(right));
}
