import { createCommuteRuntimeWindow } from '../../src/shared/domain/commute-window';
import type { NotificationImpact } from '../../src/shared/domain/notification-decision';
import { createCommuteMonitor } from '../../src/server/notifications/commute-monitor';
import { createCommuteEvaluationAuthorization } from '../../src/server/notifications/notification-authorization';
import { createSubscriptionStore } from '../../src/server/notifications/subscription-store';

const window = createCommuteRuntimeWindow({
  id: 'weekday-f',
  savedRecordId: 'saved-f',
  lifecycle: 'active',
  weekdays: [1],
  startsAt: '08:00',
  endsAt: '09:00',
  preparationLeadMinutes: 15,
  stage: 'deterministic-test',
  notificationEnabled: true,
  scope: {
    routeId: 'F',
    direction: 'southbound',
    actualDestination: 'Coney Island–Stillwell Av',
    originStationId: 'D15',
    destinationStationId: 'D21',
    segmentStationIds: ['D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21'],
  },
});

export async function lockedCommuteReceipt(): Promise<{
  readonly kind: string;
  readonly delivered: number;
  readonly senderCalls: number;
}> {
  let senderCalls = 0;
  const subscriptions = createSubscriptionStore();
  subscriptions.upsert({
    endpoint: 'https://push.example.test/subway-validation',
    keys: { p256dh: 'fixture-key', auth: 'fixture-auth' },
    commuteWindows: [{
      id: window.id,
      lifecycle: window.lifecycle,
      notificationEnabled: window.notificationEnabled,
      weekdays: window.weekdays,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      preparationLeadMinutes: window.preparationLeadMinutes,
      scope: window.scope,
    }],
  });
  const monitor = createCommuteMonitor({
    stage: 'deterministic-test',
    evaluationAuthorization: createCommuteEvaluationAuthorization({
      stage: 'deterministic-test',
      exposureKey: 'commute-evaluation',
      authorizationId: 'validation-evaluation-only',
    }),
    deliveryAuthorization: undefined,
    capture: () => [impact()],
    sender: {
      send: async () => {
        senderCalls += 1;
        return { kind: 'delivered' as const };
      },
    },
    subscriptions,
  });
  const receipt = await monitor.evaluate({
    trigger: 'scheduled',
    at: new Date('2026-08-03T12:00:00.000Z'),
    windows: [window],
    connected: true,
    permissionGranted: true,
  });
  const result = {
    kind: receipt.kind,
    delivered: receipt.kind === 'evaluated' ? receipt.delivered : 0,
    senderCalls,
  };
  if (result.kind !== 'evaluated' || result.delivered !== 0 || result.senderCalls !== 0) {
    throw new Error('Delivery lock receipt did not remain closed with a matching subscription');
  }
  return Object.freeze(result);
}

function impact(): NotificationImpact {
  return {
    episodeId: 'episode-1',
    kind: 'bypass',
    routeId: 'F',
    direction: 'southbound',
    affectedStationIds: ['D18'],
    activeFrom: new Date('2026-08-03T11:50:00.000Z'),
    activeUntil: new Date('2026-08-03T13:00:00.000Z'),
    evidenceCurrent: true,
    decisionChanging: true,
    correctionOnly: false,
    addedJourneySeconds: 600,
    recommendedActions: [{ id: 'use-a-c', tier: 1, riderRank: 1, label: 'Use the A/C from W 4 St.' }],
  };
}
