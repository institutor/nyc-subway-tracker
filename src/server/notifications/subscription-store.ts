import { compareCanonicalIdentity, normalizeBoundedIdentity } from '../../shared/domain/canonical';
import {
  createCommuteWindowRegistration,
  runtimeWindowFromRegistration,
  type CommuteRuntimeWindow,
  type CommuteWindowRegistration,
} from '../../shared/domain/commute-window';
import type { CommuteStage } from '../../shared/domain/types';

export interface PushSubscriptionRecord {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
  readonly commuteWindows: readonly CommuteWindowRegistration[];
}

export interface SubscriptionStore {
  readonly size: number;
  upsert(value: PushSubscriptionRecord): void;
  delete(endpoint: string): boolean;
  get(endpoint: string): PushSubscriptionRecord | undefined;
  all(commuteWindowId?: string): readonly PushSubscriptionRecord[];
  windows(stage: CommuteStage): readonly CommuteRuntimeWindow[];
}

export function createSubscriptionStore(maximum = 512): SubscriptionStore {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 10_000) throw new Error('Invalid subscription limit');
  const records = new Map<string, PushSubscriptionRecord>();
  return Object.freeze({
    get size() { return records.size; },
    upsert(value: PushSubscriptionRecord): void {
      const captured = capture(value);
      if (!records.has(captured.endpoint) && records.size >= maximum) throw new Error('Subscription store limit reached');
      records.set(captured.endpoint, captured);
    },
    delete(endpoint: string): boolean {
      return records.delete(endpointValue(endpoint));
    },
    get(endpoint: string): PushSubscriptionRecord | undefined {
      const value = records.get(endpointValue(endpoint));
      return value ? clone(value) : undefined;
    },
    all(commuteWindowId?: string): readonly PushSubscriptionRecord[] {
      const normalizedWindowId = commuteWindowId === undefined
        ? undefined
        : normalizeBoundedIdentity(commuteWindowId, 'commute window');
      return Object.freeze([...records.values()]
        .filter(({ commuteWindows }) => normalizedWindowId === undefined
          || commuteWindows.some(({ id }) => id === normalizedWindowId))
        .sort((left, right) => compareCanonicalIdentity(left.endpoint, right.endpoint))
        .map(clone));
    },
    windows(stage: CommuteStage): readonly CommuteRuntimeWindow[] {
      const registrations = new Map<string, { serialized: string; value: CommuteWindowRegistration }>();
      const conflicted = new Set<string>();
      for (const subscription of records.values()) {
        for (const registration of subscription.commuteWindows) {
          const serialized = JSON.stringify(registration);
          const existing = registrations.get(registration.id);
          if (existing && existing.serialized !== serialized) conflicted.add(registration.id);
          else if (!existing) registrations.set(registration.id, { serialized, value: registration });
        }
      }
      return Object.freeze([...registrations.values()]
        .filter(({ value }) => !conflicted.has(value.id))
        .sort((left, right) => compareCanonicalIdentity(left.value.id, right.value.id))
        .map(({ value }) => runtimeWindowFromRegistration(value, stage)));
    },
  });
}

function capture(value: PushSubscriptionRecord): PushSubscriptionRecord {
  if (!value || typeof value !== 'object' || !value.keys || typeof value.keys !== 'object') throw new Error('Invalid push subscription');
  const endpoint = endpointValue(value.endpoint);
  const p256dh = token(value.keys.p256dh, 'p256dh', 1_024);
  const auth = token(value.keys.auth, 'auth', 512);
  if (!Array.isArray(value.commuteWindows)) throw new Error('Invalid commute window subscriptions');
  const commuteWindows = value.commuteWindows.map(createCommuteWindowRegistration);
  const ids = commuteWindows.map(({ id }) => id);
  if (commuteWindows.length < 1 || commuteWindows.length > 128 || new Set(ids).size !== ids.length) {
    throw new Error('Invalid commute window subscriptions');
  }
  return deepFreeze({ endpoint, keys: { p256dh, auth }, commuteWindows });
}

function endpointValue(value: string): string {
  if (typeof value !== 'string' || new TextEncoder().encode(value).byteLength > 2_048) throw new Error('Invalid push endpoint');
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Invalid push endpoint'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Invalid push endpoint');
  return url.toString();
}

function token(value: string, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error(`Invalid subscription ${label}`);
  }
  return value;
}

function clone(value: PushSubscriptionRecord): PushSubscriptionRecord {
  return deepFreeze({
    endpoint: value.endpoint,
    keys: { ...value.keys },
    commuteWindows: value.commuteWindows.map((window) => ({ ...window, weekdays: [...window.weekdays], scope: { ...window.scope, segmentStationIds: [...window.scope.segmentStationIds] } })),
  });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
