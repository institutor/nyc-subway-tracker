import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { createApp } from '../../src/server/app';
import { createProductionDependencies, type ProductionDependencyOverrides } from '../../src/server/bootstrap';
import { createSubscriptionStore } from '../../src/server/notifications/subscription-store';
import { createVapidStore } from '../../src/server/notifications/vapid-store';
import { createCommuteDeliveryAuthorization } from '../../src/server/notifications/notification-runtime';
import { withApi } from '../helpers/api-harness';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

describe('local notification boundaries', () => {
  test('persists one local VAPID key pair without exposing the private key', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'subway-vapid-'));
    directories.push(directory);
    const path = join(directory, 'vapid.json');
    const first = await createVapidStore(path).loadOrCreate();
    const second = await createVapidStore(path).loadOrCreate();
    expect(second).toEqual(first);
    expect(first.publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first.privateKey).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first.publicKey).not.toBe(first.privateKey);
    expect((await readFile(path, 'utf8')).length).toBeLessThan(4096);
  });

  test('keeps all notification routes closed by default and no-stores the response', async () => {
    const dependencies = createProductionDependencies({ dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {} });
    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/notifications/vapid-public-key');
      expect(response.status).toBe(423);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ availability: 'locked' });
    });
  });

  test('accepts a bounded subscription only for an explicitly open delivery stage', async () => {
    const subscriptions = createSubscriptionStore();
    const dependencies = createProductionDependencies(
      { dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {} },
      { notifications: { stage: 'delivery', deliveryAuthorization: deliveryAuthorization(), publicKey: 'public-key', subscriptions } },
    );
    await withApi(createApp(dependencies), async ({ request }) => {
      expect(await (await request('/api/v1/notifications/vapid-public-key')).json()).toEqual({ publicKey: 'public-key' });
      const response = await request('/api/v1/notifications/subscriptions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example/a',
          keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
          commuteWindows: [registration('saved-commute-a')],
        }),
      });
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ subscribed: true });
      expect(subscriptions.size).toBe(1);
      expect(JSON.stringify(await (await request('/api/v1/notifications/vapid-public-key')).json())).not.toContain('auth-value');
      expect(subscriptions.all('saved-commute-a')).toHaveLength(1);
      expect(subscriptions.all('unrelated-commute')).toHaveLength(0);
      expect(Object.keys(subscriptions.get('https://push.example/a')!.commuteWindows[0]).sort()).toEqual([
        'endsAt', 'id', 'preparationLeadMinutes', 'scope', 'startsAt', 'weekdays',
      ]);
      expect(JSON.stringify(subscriptions.get('https://push.example/a')!.commuteWindows)).not.toMatch(
        /savedRecordId|actualDestination|coordinate|home|work|label/i,
      );

      const status = await request('/api/v1/notifications/subscriptions/status', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: 'https://push.example/a', commuteWindows: [registration('saved-commute-a')] }),
      });
      expect(await status.json()).toEqual({ state: 'current' });

      const changedScope = registration('saved-commute-a');
      const stale = await request('/api/v1/notifications/subscriptions/status', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example/a',
          commuteWindows: [{ ...changedScope, scope: { ...changedScope.scope, routeId: 'C' } }],
        }),
      });
      expect(await stale.json()).toEqual({ state: 'stale' });

      const replacement = { ...changedScope, scope: { ...changedScope.scope, routeId: 'C' } };
      expect((await request('/api/v1/notifications/subscriptions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example/a', keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
          commuteWindows: [replacement],
        }),
      })).status).toBe(201);
      expect(subscriptions.get('https://push.example/a')!.commuteWindows).toEqual([replacement]);
      expect(subscriptions.windows('delivery')).toHaveLength(1);

      expect((await request('/api/v1/notifications/subscriptions', {
        method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: 'https://push.example/a' }),
      })).status).toBe(200);
      expect(subscriptions.size).toBe(0);
      expect(subscriptions.windows('delivery')).toEqual([]);
    });
  });

  test('keeps subscription and VAPID routes locked without an independent delivery authorization', async () => {
    const subscriptions = createSubscriptionStore();
    const dependencies = createProductionDependencies(
      { dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {} },
      { notifications: {
        stage: 'delivery', deliveryAuthorization: undefined,
        publicKey: 'public-key', subscriptions,
      } as ProductionDependencyOverrides['notifications'] },
    );
    await withApi(createApp(dependencies), async ({ request }) => {
      expect((await request('/api/v1/notifications/vapid-public-key')).status).toBe(423);
      expect((await request('/api/v1/notifications/subscriptions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example/a', keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
          commuteWindowIds: ['saved-a'],
        }),
      })).status).toBe(423);
    });
  });

  test('rejects an unscoped subscription instead of treating it as a wildcard', async () => {
    const subscriptions = createSubscriptionStore();
    const dependencies = createProductionDependencies(
      { dataDirectory: '.data-test-do-not-read', mode: 'validation', sources: {} },
      { notifications: { stage: 'delivery', deliveryAuthorization: deliveryAuthorization(), publicKey: 'public-key', subscriptions } },
    );
    await withApi(createApp(dependencies), async ({ request }) => {
      const response = await request('/api/v1/notifications/subscriptions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: 'https://push.example/a', keys: { p256dh: 'p256dh-value', auth: 'auth-value' } }),
      });
      expect(response.status).toBe(400);
      expect(subscriptions.size).toBe(0);
    });
  });

  test('returns one persisted VAPID winner and removes every losing secret temporary file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'subway-vapid-race-'));
    directories.push(directory);
    const path = join(directory, 'vapid.json');
    const results = await Promise.all(Array.from({ length: 16 }, () => createVapidStore(path).loadOrCreate()));
    expect(new Set(results.map(({ publicKey }) => publicKey))).toEqual(new Set([results[0].publicKey]));
    expect(new Set(results.map(({ privateKey }) => privateKey))).toEqual(new Set([results[0].privateKey]));
    expect(await readdir(directory)).toEqual(['vapid.json']);
  });
});

function deliveryAuthorization() {
  return createCommuteDeliveryAuthorization({
    stage: 'delivery', exposureKey: 'commute-delivery', authorizationId: 'delivery-api-a',
  });
}

function registration(id: string) {
  return {
    id, weekdays: [1, 2, 3, 4, 5], startsAt: '08:00', endsAt: '09:00', preparationLeadMinutes: 15,
    scope: {
      routeId: 'A', direction: 'southbound', originStationId: 'A12', destinationStationId: 'A24',
      segmentStationIds: ['A12', 'A15', 'A24'],
    },
  };
}
