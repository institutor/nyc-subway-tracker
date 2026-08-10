import { afterEach, describe, expect, test, vi } from 'vitest';

import { browserNotificationEnvironment } from '../../src/client/hooks/use-notifications';

afterEach(() => vi.unstubAllGlobals());

describe('browser notification deletion truth', () => {
  test('reports no device subscription without making a remote request', async () => {
    const fetcher = vi.fn();
    installBrowserNotification(undefined, fetcher);

    expect(await browserNotificationEnvironment().unsubscribe()).toEqual({
      state: 'Not present', remote: 'Not present', local: 'Not present',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test.each([
    [false, true, { state: 'Failed', remote: 'Not present', local: 'Deleted' }],
    [true, false, { state: 'Failed', remote: 'Deleted', local: 'Failed' }],
  ])('never reports Deleted when remote removed=%s and local unsubscribe=%s', async (removed, local, expected) => {
    const subscription = { endpoint: 'https://push.example/a', unsubscribe: vi.fn(async () => local) };
    installBrowserNotification(subscription, vi.fn(async () => new Response(JSON.stringify({ subscribed: false, removed }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));

    expect(await browserNotificationEnvironment().unsubscribe()).toEqual(expected);
  });
});

function installBrowserNotification(subscription: object | undefined, fetcher: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn(async () => 'granted') });
  vi.stubGlobal('PushManager', class PushManager {});
  vi.stubGlobal('fetch', fetcher);
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager: { getSubscription: async () => subscription ?? null } }) },
  });
}
