import { compareCanonicalIdentity, normalizeBoundedIdentity } from '../../shared/domain/canonical';

export interface PushSubscriptionRecord {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
  readonly commuteWindowIds: readonly string[];
}

export interface SubscriptionStore {
  readonly size: number;
  upsert(value: PushSubscriptionRecord): void;
  delete(endpoint: string): boolean;
  all(commuteWindowId?: string): readonly PushSubscriptionRecord[];
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
    all(commuteWindowId?: string): readonly PushSubscriptionRecord[] {
      const normalizedWindowId = commuteWindowId === undefined
        ? undefined
        : normalizeBoundedIdentity(commuteWindowId, 'commute window');
      return Object.freeze([...records.values()]
        .filter(({ commuteWindowIds }) => normalizedWindowId === undefined
          || commuteWindowIds.includes(normalizedWindowId))
        .sort((left, right) => compareCanonicalIdentity(left.endpoint, right.endpoint))
        .map(clone));
    },
  });
}

function capture(value: PushSubscriptionRecord): PushSubscriptionRecord {
  if (!value || typeof value !== 'object' || !value.keys || typeof value.keys !== 'object') throw new Error('Invalid push subscription');
  const endpoint = endpointValue(value.endpoint);
  const p256dh = token(value.keys.p256dh, 'p256dh', 1_024);
  const auth = token(value.keys.auth, 'auth', 512);
  if (!Array.isArray(value.commuteWindowIds)) throw new Error('Invalid commute window subscriptions');
  const commuteWindowIds = value.commuteWindowIds.map((id) => normalizeBoundedIdentity(id, 'commute window'));
  if (commuteWindowIds.length < 1 || commuteWindowIds.length > 128 || new Set(commuteWindowIds).size !== commuteWindowIds.length) {
    throw new Error('Invalid commute window subscriptions');
  }
  return deepFreeze({ endpoint, keys: { p256dh, auth }, commuteWindowIds });
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
  return deepFreeze({ endpoint: value.endpoint, keys: { ...value.keys }, commuteWindowIds: [...value.commuteWindowIds] });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
