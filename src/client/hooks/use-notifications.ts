import { useCallback, useMemo, useState } from 'react';

export interface NotificationEnvironment {
  readonly supported: boolean;
  readonly permission: NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  subscribe(): Promise<void>;
  unsubscribe(): Promise<void>;
}

export type NotificationCapability = 'locked' | 'unsupported' | 'ready' | 'denied' | 'enabled' | 'error';

export function useNotifications(input: {
  readonly stage: 'disabled' | 'deterministic-test' | 'silent-evaluation' | 'pilot' | 'delivery';
  readonly gateOpen: boolean;
  readonly environment?: NotificationEnvironment;
}) {
  const environment = useMemo(() => input.environment ?? browserNotificationEnvironment(), [input.environment]);
  const [permission, setPermission] = useState<NotificationPermission>(environment.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [failed, setFailed] = useState(false);
  const locked = input.stage === 'disabled' || !input.gateOpen;
  const capability: NotificationCapability = locked ? 'locked'
    : !environment.supported ? 'unsupported'
      : permission === 'denied' ? 'denied'
        : failed ? 'error'
          : subscribed ? 'enabled' : 'ready';

  const enable = useCallback(async () => {
    if (locked || !environment.supported) return;
    setFailed(false);
    try {
      const nextPermission = permission === 'granted' ? permission : await environment.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== 'granted') return;
      await environment.subscribe();
      setSubscribed(true);
    } catch {
      setFailed(true);
    }
  }, [environment, locked, permission]);

  const disable = useCallback(async () => {
    if (!environment.supported || !subscribed) return;
    try {
      await environment.unsubscribe();
      setSubscribed(false);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [environment, subscribed]);

  return Object.freeze({ capability, enable, disable });
}

function browserNotificationEnvironment(): NotificationEnvironment {
  const notification = typeof Notification === 'undefined' ? undefined : Notification;
  const serviceWorker = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  const supported = Boolean(notification && serviceWorker && typeof PushManager !== 'undefined');
  return {
    supported,
    permission: notification?.permission ?? 'default',
    requestPermission: async () => notification ? notification.requestPermission() : 'denied',
    subscribe: async () => {
      if (!serviceWorker) throw new Error('Background notifications unsupported');
      const keyResponse = await fetch('/api/v1/notifications/vapid-public-key', { cache: 'no-store' });
      if (!keyResponse.ok) throw new Error('Notification delivery unavailable');
      const body = await keyResponse.json() as { publicKey?: unknown };
      if (typeof body.publicKey !== 'string') throw new Error('Notification delivery unavailable');
      const registration = await serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlBytes(body.publicKey),
      });
      const response = await fetch('/api/v1/notifications/subscriptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error('Notification delivery unavailable');
      }
    },
    unsubscribe: async () => {
      if (!serviceWorker) return;
      const registration = await serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;
      await fetch('/api/v1/notifications/subscriptions', {
        method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    },
  };
}

function base64UrlBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('Invalid application server key');
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
