import type { CommuteRuntimeWindow } from '../../shared/domain/commute-window';
import { resolveCommuteOccurrence } from '../../shared/domain/commute-window';
import {
  materialNotificationDecision,
  type DeliveredNotificationBaseline,
  type NotificationImpact,
} from '../../shared/domain/notification-decision';
import type { CommuteStage } from '../../shared/domain/types';
import type { ExposureStage } from '../release/exposure-gates';
import type { PushSubscriptionRecord, SubscriptionStore } from './subscription-store';

export type PushDeliveryResult =
  | { readonly kind: 'delivered' }
  | { readonly kind: 'invalid-subscription' }
  | { readonly kind: 'failed' };

export interface WebPushSender {
  send(subscription: PushSubscriptionRecord, payload: CommutePushPayload): Promise<PushDeliveryResult>;
}

export interface CommutePushPayload {
  readonly title: string;
  readonly body: string;
  readonly url: '/?surface=commute';
  readonly episodeId: string;
}

export interface CommuteMonitor {
  evaluate(input: {
    readonly trigger: 'scheduled' | 'reconnect' | 'permission-restored';
    readonly at: Date;
    readonly windows: readonly CommuteRuntimeWindow[];
    readonly connected?: boolean;
    readonly permissionGranted?: boolean;
  }): Promise<
    | { readonly kind: 'locked' }
    | { readonly kind: 'evaluated'; readonly evaluated: number; readonly candidates: number; readonly delivered: number }
  >;
}

export function commuteExposureKey(stage: CommuteStage): ExposureStage | null {
  switch (stage) {
    case 'disabled': return null;
    case 'deterministic-test': return 'commute-evaluation';
    case 'silent-evaluation': return 'commute-silent';
    case 'pilot': return 'commute-limited-pilot';
    case 'delivery': return 'commute-delivery';
  }
}

export function createCommuteMonitor(input: {
  readonly stage: CommuteStage;
  readonly gateOpen: boolean;
  readonly capture: (window: CommuteRuntimeWindow, at: Date) => readonly NotificationImpact[];
  readonly sender: WebPushSender;
  readonly subscriptions: SubscriptionStore;
}): CommuteMonitor {
  const observed = new Set<string>();
  const delivered: DeliveredNotificationBaseline[] = [];

  return Object.freeze({
    async evaluate(request: Parameters<CommuteMonitor['evaluate']>[0]) {
      if (input.stage === 'disabled' || !input.gateOpen) return { kind: 'locked' } as const;
      let evaluated = 0;
      let candidates = 0;
      let deliveredCount = 0;
      const mutateOperationalState = input.stage !== 'deterministic-test';

      for (const window of request.windows) {
        if (window.stage !== input.stage) continue;
        const occurrence = resolveCommuteOccurrence(window, request.at);
        if (occurrence.kind !== 'watching') continue;
        const impacts = input.capture(window, request.at);
        evaluated += impacts.length;
        for (const impact of impacts) {
          const observationKey = `${window.id}:${occurrence.occurrenceId}:${impact.episodeId}`;
          if (observed.has(observationKey)) continue;
          const decision = materialNotificationDecision({ window, occurrence, impact, delivered });
          if (decision.outcome !== 'send') {
            if (mutateOperationalState) observed.add(observationKey);
            continue;
          }
          candidates += 1;
          if (mutateOperationalState) observed.add(observationKey);
          const deliveryStage = input.stage === 'pilot' || input.stage === 'delivery';
          const capable = request.connected !== false && request.permissionGranted !== false;
          if (!deliveryStage || !capable) continue;

          const payload = renderPush(window, occurrence, impact, decision.action?.label);
          let successful = false;
          for (const subscription of input.subscriptions.all(window.id)) {
            const result = await input.sender.send(subscription, payload);
            if (result.kind === 'invalid-subscription') input.subscriptions.delete(subscription.endpoint);
            if (result.kind === 'delivered') successful = true;
          }
          if (successful) {
            deliveredCount += 1;
            delivered.push({
              episodeId: impact.episodeId,
              impactKind: impact.kind,
              routeId: impact.routeId,
              direction: impact.direction,
              affectedStationIds: [...impact.affectedStationIds],
              ...(impact.addedJourneySeconds === undefined ? {} : { addedJourneySeconds: impact.addedJourneySeconds }),
              ...(impact.severityRank === undefined ? {} : { severityRank: impact.severityRank }),
              activeUntil: new Date(impact.activeUntil),
              ...(decision.action ? { recommendedActionId: decision.action.id } : {}),
              deliveredAt: new Date(request.at),
            });
          }
        }
      }
      return { kind: 'evaluated', evaluated, candidates, delivered: deliveredCount } as const;
    },
  });
}

function renderPush(
  window: CommuteRuntimeWindow,
  occurrence: ReturnType<typeof resolveCommuteOccurrence> & { kind: 'watching' },
  impact: NotificationImpact,
  action?: string,
): CommutePushPayload {
  const trip = `${impact.routeId} ${directionLabel(window.scope.direction)} toward ${window.scope.actualDestination}`;
  const station = impact.affectedStationIds[0] ?? window.scope.originStationId;
  const during = formatOccurrence(occurrence.startsAt, occurrence.endsAt);
  const safeAction = action || 'No verified alternative is available.';
  const content = impact.kind === 'bypass'
    ? { title: `${station} stop change`, body: `${trip} trains are not stopping at ${station} during ${during}. ${safeAction} Open current details.` }
    : impact.kind === 'suspension'
      ? { title: `Service suspended for ${trip}`, body: `${trip} service is suspended on ${station} during ${during}. ${safeAction} Open current details.` }
      : impact.kind === 'delay'
        ? { title: `Delay affects ${trip}`, body: `${trip} service is delayed on ${station} during ${during}. ${safeAction} Open current details.` }
        : { title: `Update for ${trip}`, body: `${impact.kind} now affects ${station} during ${during}. ${safeAction} Open current details.` };
  return Object.freeze({ ...content, url: '/?surface=commute', episodeId: impact.episodeId });
}

function directionLabel(value: string): string {
  return value.replace(/bound$/u, 'bound');
}

function formatOccurrence(start: Date, end: Date): string {
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
  const startDate = date.format(start);
  const endDate = date.format(end);
  return startDate === endDate
    ? `${startDate}, ${time.format(start)}–${time.format(end)}`
    : `${startDate}, ${time.format(start)}–${endDate}, ${time.format(end)}`;
}
