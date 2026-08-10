import { describe, expect, test, vi } from 'vitest';

import { createCommuteRuntimeWindow } from '../../src/shared/domain/commute-window';
import type { NotificationImpact } from '../../src/shared/domain/notification-decision';
import {
  commuteExposureKey,
  createCommuteMonitor,
  type WebPushSender,
} from '../../src/server/notifications/commute-monitor';
import { createSubscriptionStore } from '../../src/server/notifications/subscription-store';

const now = new Date('2026-08-03T12:00:00.000Z');

describe('commute monitor stages and delivery', () => {
  test('maps stage names to separately named exposure keys and a closed gate does no work', async () => {
    expect(commuteExposureKey('disabled')).toBeNull();
    expect(commuteExposureKey('deterministic-test')).toBe('commute-evaluation');
    expect(commuteExposureKey('silent-evaluation')).toBe('commute-silent');
    expect(commuteExposureKey('pilot')).toBe('commute-limited-pilot');
    expect(commuteExposureKey('delivery')).toBe('commute-delivery');

    const capture = vi.fn(() => [impact()]);
    const sender = senderFixture();
    const monitor = createCommuteMonitor({
      stage: 'delivery', gateOpen: false, capture, sender, subscriptions: createSubscriptionStore(),
    });
    expect(await monitor.evaluate({ trigger: 'scheduled', at: now, windows: [runtimeWindow()] })).toEqual({ kind: 'locked' });
    expect(capture).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });

  test('dedupes an episode, suppresses correction-only updates, and deletes invalid subscriptions', async () => {
    const subscriptions = createSubscriptionStore();
    subscriptions.upsert(subscription());
    const sender = senderFixture({ kind: 'invalid-subscription' });
    const monitor = createCommuteMonitor({
      stage: 'delivery', gateOpen: true, capture: () => [impact()], sender, subscriptions,
    });
    expect(await monitor.evaluate({ trigger: 'scheduled', at: now, windows: [runtimeWindow()] })).toMatchObject({ kind: 'evaluated', delivered: 0 });
    expect(subscriptions.size).toBe(0);
    expect(await monitor.evaluate({ trigger: 'scheduled', at: new Date(now.getTime() + 60_000), windows: [runtimeWindow()] })).toMatchObject({
      kind: 'evaluated', candidates: 0,
    });
  });

  test('reconnect performs a current evaluation without replaying a candidate missed while offline', async () => {
    const subscriptions = createSubscriptionStore();
    subscriptions.upsert(subscription());
    const sender = senderFixture({ kind: 'delivered' });
    const monitor = createCommuteMonitor({
      stage: 'delivery', gateOpen: true, capture: () => [impact()], sender, subscriptions,
    });
    await monitor.evaluate({ trigger: 'scheduled', at: now, windows: [runtimeWindow()], connected: false });
    expect(await monitor.evaluate({
      trigger: 'reconnect', at: new Date(now.getTime() + 60_000), windows: [runtimeWindow()], connected: true,
    })).toMatchObject({ kind: 'evaluated', candidates: 0, delivered: 0 });
    expect(sender.send).not.toHaveBeenCalled();
  });

  test('deterministic tests and silent evaluation never deliver or mutate public delivery state', async () => {
    for (const stage of ['deterministic-test', 'silent-evaluation'] as const) {
      const subscriptions = createSubscriptionStore();
      subscriptions.upsert(subscription());
      const sender = senderFixture({ kind: 'delivered' });
      const monitor = createCommuteMonitor({ stage, gateOpen: true, capture: () => [impact()], sender, subscriptions });
      expect(await monitor.evaluate({ trigger: 'scheduled', at: now, windows: [runtimeWindow({ stage })] })).toMatchObject({
        kind: 'evaluated', delivered: 0,
      });
      expect(sender.send).not.toHaveBeenCalled();
    }
  });
});

function runtimeWindow(overrides: { stage?: 'deterministic-test' | 'silent-evaluation' } = {}) {
  return createCommuteRuntimeWindow({
    id: 'commute-a', savedRecordId: 'saved-a', lifecycle: 'active', weekdays: [1], startsAt: '08:00', endsAt: '09:00',
    preparationLeadMinutes: 15, stage: overrides.stage ?? 'delivery', notificationEnabled: true,
    scope: {
      routeId: 'F', direction: 'southbound', actualDestination: 'Coney Island–Stillwell Av',
      originStationId: 'D15', destinationStationId: 'D21', segmentStationIds: ['D15', 'D18', 'D21'],
    },
  });
}

function impact(): NotificationImpact {
  return {
    episodeId: 'episode-a', kind: 'bypass', routeId: 'F', direction: 'southbound', affectedStationIds: ['D18'],
    activeFrom: new Date('2026-08-03T11:50:00.000Z'), activeUntil: new Date('2026-08-03T13:00:00.000Z'),
    evidenceCurrent: true, decisionChanging: true, correctionOnly: false, addedJourneySeconds: 600,
    recommendedActions: [{ id: 'use-a-c', tier: 1, riderRank: 1, label: 'Use the A/C from W 4 St.' }],
  };
}

function subscription() {
  return {
    endpoint: 'https://push.example/subscription-a',
    keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
    commuteWindowIds: ['commute-a'],
  };
}

function senderFixture(result: Awaited<ReturnType<WebPushSender['send']>> = { kind: 'delivered' }) {
  return { send: vi.fn(async () => result) } satisfies WebPushSender;
}
