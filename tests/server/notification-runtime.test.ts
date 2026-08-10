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
        id: 'commute-a', weekdays: [1], startsAt: '08:00', endsAt: '09:00', preparationLeadMinutes: 15,
        scope: {
          routeId: 'F', direction: 'southbound', originStationId: 'D15', destinationStationId: 'D21',
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
    expect(JSON.parse(String(sendNotification.mock.calls[0][1]))).toMatchObject({ episodeId: 'episode-a', url: '/?surface=commute' });
  });

  test('rejects a delivery authorization paired with the wrong exact stage or exposure key', () => {
    expect(() => createCommuteDeliveryAuthorization({
      stage: 'pilot', exposureKey: 'commute-delivery', authorizationId: 'wrong-key',
    })).toThrow(/authorization/i);
  });
});
