import { describe, expect, test, vi } from 'vitest';

import {
  createCommuteDeliveryAuthorization,
  createCommuteEvaluationAuthorization,
  createProductionNotificationPipeline,
} from '../../src/server/notifications/notification-runtime';
import { createSubscriptionStore } from '../../src/server/notifications/subscription-store';

describe('production notification composition', () => {
  test('is runnable but performs no initialization, capture, scheduling, or delivery while closed', async () => {
    const capture = vi.fn(() => []);
    const loadVapid = vi.fn();
    const schedule = vi.fn();
    const pipeline = await createProductionNotificationPipeline({ stage: 'disabled', capture, loadVapid, schedule });
    expect(pipeline.runtime.stage).toBe('disabled');
    expect(await pipeline.runNow(new Date('2026-08-03T12:00:00.000Z'))).toEqual({ kind: 'locked' });
    expect(capture).not.toHaveBeenCalled();
    expect(loadVapid).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  test('starts an authorized injected scheduler with VAPID, capture, and concrete Web Push delivery wired', async () => {
    const evaluationAuthorization = createCommuteEvaluationAuthorization({
      stage: 'delivery', exposureKey: 'commute-evaluation', authorizationId: 'evaluation-a',
    });
    const deliveryAuthorization = createCommuteDeliveryAuthorization({
      stage: 'delivery', exposureKey: 'commute-delivery', authorizationId: 'delivery-a',
    });
    expect(Object.isFrozen(evaluationAuthorization)).toBe(true);
    expect(Object.isFrozen(deliveryAuthorization)).toBe(true);

    const schedule = vi.fn((_task: () => Promise<void>, _intervalMs: number) => Object.freeze({ stop: vi.fn() }));
    const sendNotification = vi.fn(async (_subscription: unknown, _payload?: string) => undefined);
    const subscriptions = createSubscriptionStore();
    subscriptions.upsert({
      endpoint: 'https://push.example/runtime', keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
      commuteWindows: [{
        id: 'commute-a', lifecycle: 'active', notificationEnabled: true,
        weekdays: [1], startsAt: '08:00', endsAt: '09:00', preparationLeadMinutes: 15,
        scope: {
          routeId: 'F', direction: 'southbound', actualDestination: 'Coney Island–Stillwell Av',
          originStationId: 'D15', destinationStationId: 'D21',
          segmentStationIds: ['D15', 'D18', 'D21'],
        },
      }],
    });
    const pipeline = await createProductionNotificationPipeline({
      stage: 'delivery', evaluationAuthorization, deliveryAuthorization,
      capture: () => [{
        episodeId: 'episode-a', kind: 'bypass', routeId: 'F', direction: 'southbound', affectedStationIds: ['D18'],
        activeFrom: new Date('2026-08-03T11:50:00.000Z'), activeUntil: new Date('2026-08-03T13:00:00.000Z'),
        evidenceCurrent: true, decisionChanging: true, correctionOnly: false, addedJourneySeconds: 600,
        recommendedActions: [{ id: 'use-a-c', tier: 1, riderRank: 1, label: 'Use the A/C.' }],
      }],
      loadVapid: async () => ({ publicKey: 'public-key', privateKey: 'private-key' }),
      subscriptions, webPush: { setVapidDetails: vi.fn(), sendNotification }, schedule,
    });
    pipeline.start();
    expect(await pipeline.runNow(new Date('2026-08-03T12:00:00.000Z'))).toMatchObject({ delivered: 1 });
    expect(pipeline.runtime.publicKey).toBe('public-key');
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(sendNotification.mock.calls[0][1])) as { body: string; episodeId: string; url: string };
    expect(payload).toMatchObject({ episodeId: 'episode-a', url: '/?surface=commute' });
    expect(payload.body).toContain('toward Coney Island–Stillwell Av');
    expect(payload.body).not.toContain('toward D21');
  });

  test('preserves paused, expired, and disabled subscription windows without evaluating them', async () => {
    const subscriptions = createSubscriptionStore();
    const commuteWindows = [
      registration('paused-window', 'paused', true),
      registration('expired-window', 'expired', true),
      registration('disabled-window', 'active', false),
    ];
    subscriptions.upsert({
      endpoint: 'https://push.example/inactive', keys: { p256dh: 'p256dh-value', auth: 'auth-value' }, commuteWindows,
    });
    expect(subscriptions.windows('delivery')).toMatchObject([
      { id: 'disabled-window', lifecycle: 'active', notificationEnabled: false },
      { id: 'expired-window', lifecycle: 'expired', notificationEnabled: true },
      { id: 'paused-window', lifecycle: 'paused', notificationEnabled: true },
    ]);

    const capture = vi.fn(() => []);
    const pipeline = await createProductionNotificationPipeline({
      stage: 'delivery',
      evaluationAuthorization: createCommuteEvaluationAuthorization({
        stage: 'delivery', exposureKey: 'commute-evaluation', authorizationId: 'evaluation-inactive',
      }),
      deliveryAuthorization: createCommuteDeliveryAuthorization({
        stage: 'delivery', exposureKey: 'commute-delivery', authorizationId: 'delivery-inactive',
      }),
      capture, subscriptions,
      loadVapid: async () => ({ publicKey: 'public-key', privateKey: 'private-key' }),
      webPush: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
    });
    expect(await pipeline.runNow(new Date('2026-08-03T12:00:00.000Z'))).toMatchObject({ evaluated: 0, delivered: 0 });
    expect(capture).not.toHaveBeenCalled();
  });

  test('contains scheduled capture failures, reports only a safe reason, and continues later ticks', async () => {
    let task: (() => Promise<void>) | undefined;
    const schedule = (scheduled: () => Promise<void>) => {
      task = scheduled;
      return Object.freeze({ stop: vi.fn() });
    };
    const capture = vi.fn()
      .mockImplementationOnce(() => { throw new Error('contains private scope'); })
      .mockReturnValue([]);
    const diagnostic = vi.fn();
    const pipeline = await createProductionNotificationPipeline({
      stage: 'delivery',
      evaluationAuthorization: createCommuteEvaluationAuthorization({
        stage: 'delivery', exposureKey: 'commute-evaluation', authorizationId: 'evaluation-errors',
      }),
      capture, windows: () => [{
        ...runtimeWindow(), weekdays: [1, 2, 3, 4, 5, 6, 7], startsAt: '00:00', endsAt: '23:59',
      }], schedule,
      loadVapid: async () => ({ publicKey: 'not-loaded', privateKey: 'not-loaded' }),
      onDiagnostic: diagnostic,
    } as Parameters<typeof createProductionNotificationPipeline>[0]);
    pipeline.start();
    await expect(task!()).resolves.toBeUndefined();
    await expect(task!()).resolves.toBeUndefined();
    expect(capture).toHaveBeenCalledTimes(2);
    expect(diagnostic).toHaveBeenCalledTimes(1);
    expect(diagnostic).toHaveBeenCalledWith('COMMUTE_NOTIFICATION_TICK_FAILED');
  });

  test('rejects a delivery authorization paired with the wrong exact stage or exposure key', () => {
    expect(() => createCommuteDeliveryAuthorization({
      stage: 'pilot', exposureKey: 'commute-delivery', authorizationId: 'wrong-key',
    })).toThrow(/authorization/i);
  });
});

function registration(id: string, lifecycle: 'active' | 'paused' | 'expired', notificationEnabled: boolean) {
  return {
    id, lifecycle, notificationEnabled, weekdays: [1] as const, startsAt: '08:00', endsAt: '09:00', preparationLeadMinutes: 15,
    scope: {
      routeId: 'F', direction: 'southbound' as const, actualDestination: 'Coney Island–Stillwell Av',
      originStationId: 'D15', destinationStationId: 'D21', segmentStationIds: ['D15', 'D18', 'D21'],
    },
  };
}

function runtimeWindow() {
  return {
    ...registration('commute-errors', 'active', true), savedRecordId: 'saved-errors', stage: 'delivery' as const,
  };
}
