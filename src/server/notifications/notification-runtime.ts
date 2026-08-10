import webPush from 'web-push';

import type { CommuteRuntimeWindow } from '../../shared/domain/commute-window';
import type { NotificationImpact } from '../../shared/domain/notification-decision';
import type { CommuteStage } from '../../shared/domain/types';
import {
  createCommuteMonitor,
  type CommuteMonitor,
  type CommutePushPayload,
  type PushDeliveryResult,
  type WebPushSender,
} from './commute-monitor';
import {
  authorizesDelivery,
  authorizesEvaluation,
  createCommuteDeliveryAuthorization,
  createCommuteEvaluationAuthorization,
  type CommuteDeliveryAuthorization,
  type CommuteEvaluationAuthorization,
} from './notification-authorization';
import { createSubscriptionStore, type PushSubscriptionRecord, type SubscriptionStore } from './subscription-store';
import type { VapidKeyPair } from './vapid-store';
import type { NotificationRuntime } from '../routes/notifications';

export { createCommuteDeliveryAuthorization, createCommuteEvaluationAuthorization };
export type { CommuteDeliveryAuthorization, CommuteEvaluationAuthorization };

export interface WebPushApi {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  sendNotification(subscription: webPush.PushSubscription, payload?: string): Promise<unknown>;
}

export interface NotificationScheduleHandle { stop(): void }

export interface ProductionNotificationPipeline {
  readonly runtime: NotificationRuntime;
  readonly monitor: CommuteMonitor;
  runNow(at?: Date): ReturnType<CommuteMonitor['evaluate']>;
  start(): NotificationScheduleHandle;
}

export async function createProductionNotificationPipeline(input: {
  readonly stage: CommuteStage;
  readonly evaluationAuthorization?: CommuteEvaluationAuthorization;
  readonly deliveryAuthorization?: CommuteDeliveryAuthorization;
  readonly capture: (window: CommuteRuntimeWindow, at: Date) => readonly NotificationImpact[];
  readonly loadVapid: () => Promise<VapidKeyPair>;
  readonly windows?: () => readonly CommuteRuntimeWindow[];
  readonly subscriptions?: SubscriptionStore;
  readonly webPush?: WebPushApi;
  readonly vapidSubject?: string;
  readonly intervalMs?: number;
  readonly schedule?: (task: () => Promise<void>, intervalMs: number) => NotificationScheduleHandle;
  readonly onDiagnostic?: (reasonCode: 'COMMUTE_NOTIFICATION_TICK_FAILED') => void;
}): Promise<ProductionNotificationPipeline> {
  const subscriptions = input.subscriptions ?? createSubscriptionStore();
  const deliveryAuthorized = authorizesDelivery(input.deliveryAuthorization, input.stage);
  const keys = deliveryAuthorized ? await input.loadVapid() : undefined;
  const sender = keys
    ? createConcreteWebPushSender(input.webPush ?? webPush, keys, input.vapidSubject ?? 'mailto:notifications@localhost.invalid')
    : lockedSender;
  const monitor = createCommuteMonitor({
    stage: input.stage,
    evaluationAuthorization: input.evaluationAuthorization,
    deliveryAuthorization: input.deliveryAuthorization,
    capture: input.capture,
    sender,
    subscriptions,
  });
  const runtime: NotificationRuntime = Object.freeze({
    stage: input.stage,
    deliveryAuthorization: input.deliveryAuthorization,
    ...(keys ? { publicKey: keys.publicKey } : {}),
    subscriptions,
  });
  const runNow = (at = new Date()) => monitor.evaluate({
    trigger: 'scheduled', at, windows: input.windows?.() ?? subscriptions.windows(input.stage), connected: true, permissionGranted: true,
  });
  return Object.freeze({
    runtime,
    monitor,
    runNow,
    start(): NotificationScheduleHandle {
      if (!authorizesEvaluation(input.evaluationAuthorization, input.stage)) return Object.freeze({ stop: () => undefined });
      const schedule = input.schedule ?? defaultSchedule;
      return schedule(async () => {
        try {
          await runNow();
        } catch {
          try { input.onDiagnostic?.('COMMUTE_NOTIFICATION_TICK_FAILED'); } catch { /* Diagnostics cannot destabilize scheduling. */ }
        }
      }, boundedInterval(input.intervalMs ?? 60_000));
    },
  });
}

export function createConcreteWebPushSender(
  api: WebPushApi,
  keys: VapidKeyPair,
  subject: string,
): WebPushSender {
  api.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  return Object.freeze({
    async send(subscription: PushSubscriptionRecord, payload: CommutePushPayload): Promise<PushDeliveryResult> {
      try {
        await api.sendNotification({ endpoint: subscription.endpoint, keys: { ...subscription.keys } }, JSON.stringify(payload));
        return { kind: 'delivered' };
      } catch (error) {
        const statusCode = error && typeof error === 'object' ? (error as { statusCode?: unknown }).statusCode : undefined;
        return statusCode === 404 || statusCode === 410 ? { kind: 'invalid-subscription' } : { kind: 'failed' };
      }
    },
  });
}

const lockedSender: WebPushSender = Object.freeze({ send: async () => ({ kind: 'failed' as const }) });

function defaultSchedule(task: () => Promise<void>, intervalMs: number): NotificationScheduleHandle {
  const timer = setInterval(() => { void task().catch(() => undefined); }, intervalMs);
  timer.unref?.();
  return Object.freeze({ stop: () => clearInterval(timer) });
}

function boundedInterval(value: number): number {
  if (!Number.isSafeInteger(value) || value < 15_000 || value > 86_400_000) throw new Error('Invalid notification interval');
  return value;
}
