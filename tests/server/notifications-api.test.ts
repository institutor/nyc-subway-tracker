import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { createApp } from '../../src/server/app';
import { createProductionDependencies } from '../../src/server/bootstrap';
import { createSubscriptionStore } from '../../src/server/notifications/subscription-store';
import { createVapidStore } from '../../src/server/notifications/vapid-store';
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
      { notifications: { stage: 'delivery', gateOpen: true, publicKey: 'public-key', subscriptions } },
    );
    await withApi(createApp(dependencies), async ({ request }) => {
      expect(await (await request('/api/v1/notifications/vapid-public-key')).json()).toEqual({ publicKey: 'public-key' });
      const response = await request('/api/v1/notifications/subscriptions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: 'https://push.example/a', keys: { p256dh: 'p256dh-value', auth: 'auth-value' } }),
      });
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ subscribed: true });
      expect(subscriptions.size).toBe(1);
      expect(JSON.stringify(await (await request('/api/v1/notifications/vapid-public-key')).json())).not.toContain('auth-value');
    });
  });
});
