import type { Request, Response } from 'express';

import type { CommuteStage } from '../../shared/domain/types';
import { normalizeBoundedIdentity } from '../../shared/domain/canonical';
import { sendNoStoreJson } from '../api/http';
import { ApiRequestError, assertExactQuery } from '../api/request-validation';
import type { SubscriptionStore } from '../notifications/subscription-store';

export interface NotificationRuntime {
  readonly stage: CommuteStage;
  readonly gateOpen: boolean;
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
    const body = strictRecord(request.body, ['endpoint', 'keys', 'commuteWindowIds']);
    const keys = strictRecord(body.keys, ['p256dh', 'auth']);
    try {
      runtime.subscriptions.upsert({
        endpoint: string(body.endpoint),
        keys: { p256dh: string(keys.p256dh), auth: string(keys.auth) },
        commuteWindowIds: identities(body.commuteWindowIds),
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

function canSubscribe(runtime: NotificationRuntime): boolean {
  return runtime.gateOpen && (runtime.stage === 'pilot' || runtime.stage === 'delivery');
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

function identities(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 128) throw new ApiRequestError(400);
  try { return value.map((entry) => normalizeBoundedIdentity(string(entry), 'commute window')); } catch { throw new ApiRequestError(400); }
}
