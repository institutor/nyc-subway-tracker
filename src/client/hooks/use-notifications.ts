import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CommuteRuntimeWindow, CommuteWindowRegistration } from '../../shared/domain/commute-window';

export interface NotificationEnvironment {
  readonly supported: boolean;
  readonly permission: NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  inspect?(windows: readonly CommuteRuntimeWindow[]): Promise<'none' | 'current' | 'stale'>;
  subscribe(windows: readonly CommuteRuntimeWindow[]): Promise<void>;
  unsubscribe(): Promise<void>;
}

export type NotificationCapability = 'locked' | 'unsupported' | 'checking' | 'ready' | 'stale' | 'denied' | 'enabled' | 'error';

export function useNotifications(input: {
  readonly stage: 'disabled' | 'deterministic-test' | 'silent-evaluation' | 'pilot' | 'delivery';
  readonly gateOpen: boolean;
  readonly windows: readonly CommuteRuntimeWindow[];
  readonly environment?: NotificationEnvironment;
}) {
  const environment = useMemo(() => input.environment ?? browserNotificationEnvironment(), [input.environment]);
  const deliveryStage = input.stage === 'pilot' || input.stage === 'delivery';
  const locked = !deliveryStage || !input.gateOpen || input.windows.length === 0;
  const [permission, setPermission] = useState<NotificationPermission>(environment.permission);
  const [subscription, setSubscription] = useState<'checking' | 'none' | 'current' | 'stale'>(
    !locked && environment.inspect ? 'checking' : 'none',
  );
  const [failed, setFailed] = useState(false);
  const scopeKey = JSON.stringify(input.windows.map(notificationRegistration));
  const scopedWindows = useMemo(() => input.windows, [scopeKey]);
  const capability: NotificationCapability = locked ? 'locked'
    : !environment.supported ? 'unsupported'
      : permission === 'denied' ? 'denied'
        : failed ? 'error'
          : subscription === 'checking' ? 'checking'
            : subscription === 'current' ? 'enabled'
              : subscription === 'stale' ? 'stale' : 'ready';

  useEffect(() => {
    let active = true;
    if (locked || !environment.supported) {
      return () => { active = false; };
    }
    setFailed(false);
    setSubscription('checking');
    void (environment.inspect?.(scopedWindows) ?? Promise.resolve('none')).then(
      (next) => { if (active) setSubscription(next); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [environment, locked, scopeKey]);

  const enable = useCallback(async () => {
    if (locked || !environment.supported) return;
    setFailed(false);
    try {
      const nextPermission = permission === 'granted' ? permission : await environment.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== 'granted') return;
      await environment.subscribe(scopedWindows);
      setSubscription('current');
    } catch {
      setFailed(true);
    }
  }, [environment, locked, permission, scopedWindows]);

  const disable = useCallback(async () => {
    if (!environment.supported || subscription !== 'current') return;
    try {
      await environment.unsubscribe();
      setSubscription('none');
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [environment, subscription]);

  return Object.freeze({ capability, enable, disable });
}

export function browserNotificationEnvironment(): NotificationEnvironment {
  const notification = typeof Notification === 'undefined' ? undefined : Notification;
  const serviceWorker = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  const supported = Boolean(notification && serviceWorker && typeof PushManager !== 'undefined');
  return {
    supported,
    permission: notification?.permission ?? 'default',
    requestPermission: async () => notification ? notification.requestPermission() : 'denied',
    inspect: async (windows) => {
      if (!serviceWorker) return 'none';
      const registration = await serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return 'none';
      const response = await fetch('/api/v1/notifications/subscriptions/status', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint, commuteWindows: windows.map(notificationRegistration) }),
      });
      if (!response.ok) throw new Error('Notification subscription state unavailable');
      const body = await response.json() as { state?: unknown };
      if (body.state !== 'current' && body.state !== 'stale' && body.state !== 'none') throw new Error('Invalid notification subscription state');
      return body.state;
    },
    subscribe: async (windows) => {
      if (!serviceWorker) throw new Error('Background notifications unsupported');
      const keyResponse = await fetch('/api/v1/notifications/vapid-public-key', { cache: 'no-store' });
      if (!keyResponse.ok) throw new Error('Notification delivery unavailable');
      const body = await keyResponse.json() as { publicKey?: unknown };
      if (typeof body.publicKey !== 'string') throw new Error('Notification delivery unavailable');
      const registration = await serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlBytes(body.publicKey),
        });
      const serialized = subscription.toJSON();
      const response = await fetch('/api/v1/notifications/subscriptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: serialized.keys,
          commuteWindows: windows.map(notificationRegistration),
        }),
      });
      if (!response.ok) {
        if (!existing) await subscription.unsubscribe();
        throw new Error('Notification delivery unavailable');
      }
    },
    unsubscribe: async () => {
      if (!serviceWorker) return;
      const registration = await serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;
      const response = await fetch('/api/v1/notifications/subscriptions', {
        method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!response.ok) throw new Error('Notification subscription deletion unavailable');
      await subscription.unsubscribe();
    },
  };
}

function notificationRegistration({
  id,
  lifecycle,
  notificationEnabled,
  weekdays,
  startsAt,
  endsAt,
  preparationLeadMinutes,
  scope,
}: CommuteRuntimeWindow): CommuteWindowRegistration {
  return {
    id,
    lifecycle,
    notificationEnabled,
    weekdays,
    startsAt,
    endsAt,
    preparationLeadMinutes,
    scope: {
      routeId: scope.routeId,
      direction: scope.direction,
      actualDestination: scope.actualDestination,
      originStationId: scope.originStationId,
      destinationStationId: scope.destinationStationId,
      segmentStationIds: scope.segmentStationIds,
    },
  };
}

function base64UrlBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('Invalid application server key');
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
