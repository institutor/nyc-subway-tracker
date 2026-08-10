import type { CommuteRuntimeWindow } from '../../shared/domain/commute-window';
import { resolveCommuteOccurrence } from '../../shared/domain/commute-window';
import {
  materialNotificationDecision,
  type DeliveredNotificationBaseline,
  type NotificationImpact,
} from '../../shared/domain/notification-decision';
import type { CommuteStage } from '../../shared/domain/types';
import { normalizeBoundedIdentity } from '../../shared/domain/canonical';
import type { ExposureStage } from '../release/exposure-gates';
import {
  authorizesDelivery,
  authorizesEvaluation,
  type CommuteDeliveryAuthorization,
  type CommuteEvaluationAuthorization,
} from './notification-authorization';
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
  readonly evaluationAuthorization?: CommuteEvaluationAuthorization;
  readonly deliveryAuthorization?: CommuteDeliveryAuthorization;
  readonly capture: (window: CommuteRuntimeWindow, at: Date) => readonly NotificationImpact[];
  readonly sender: WebPushSender;
  readonly subscriptions: SubscriptionStore;
}): CommuteMonitor {
  const attempted = new Set<string>();
  const missed = new Set<string>();
  const delivered: DeliveredNotificationBaseline[] = [];

  return Object.freeze({
    async evaluate(request: Parameters<CommuteMonitor['evaluate']>[0]) {
      if (!authorizesEvaluation(input.evaluationAuthorization, input.stage)) return { kind: 'locked' } as const;
      let evaluated = 0;
      let candidates = 0;
      let deliveredCount = 0;
      const mutateOperationalState = input.stage !== 'deterministic-test';

      for (const window of request.windows) {
        if (window.stage !== input.stage) continue;
        const occurrence = resolveCommuteOccurrence(window, request.at);
        if (occurrence.kind !== 'watching') continue;
        const impacts = input.capture(window, request.at);
        if (!Array.isArray(impacts)) continue;
        evaluated += impacts.length;
        for (const impact of impacts) {
          if (!isNotificationImpact(impact)) continue;
          const deliveryGroup = `${window.id}:${occurrence.occurrenceId}:${impact.episodeId}`;
          const attemptKey = `${deliveryGroup}:${impactStateKey(impact)}`;
          if (missed.has(deliveryGroup) || attempted.has(attemptKey)) continue;
          const decision = materialNotificationDecision({ window, occurrence, impact, delivered });
          if (decision.outcome !== 'send') continue;
          candidates += 1;
          const deliveryStage = authorizesDelivery(input.deliveryAuthorization, input.stage);
          const capable = request.connected !== false && request.permissionGranted !== false;
          if (!deliveryStage) continue;
          if (!capable) {
            if (mutateOperationalState) missed.add(deliveryGroup);
            continue;
          }

          const payload = renderPush(window, occurrence, impact, decision.action?.label);
          if (!isCommutePushPayload(payload)) continue;
          if (mutateOperationalState) attempted.add(attemptKey);
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

function isNotificationImpact(value: unknown): value is NotificationImpact {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const impact = value as Partial<NotificationImpact>;
  if (!boundedIdentity(impact.episodeId, 'episode', 128)
    || !['delay', 'suspension', 'bypass', 'short-turn', 'closure', 'accessibility'].includes(String(impact.kind))
    || !boundedIdentity(impact.routeId, 'route')
    || !['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'].includes(String(impact.direction))
    || !boundedIdentityArray(impact.affectedStationIds, 'affected station', 512)
    || !validDate(impact.activeFrom) || !validDate(impact.activeUntil)
    || impact.activeFrom.getTime() >= impact.activeUntil.getTime()
    || typeof impact.evidenceCurrent !== 'boolean'
    || typeof impact.decisionChanging !== 'boolean'
    || typeof impact.correctionOnly !== 'boolean'
    || !optionalFinite(impact.addedJourneySeconds, true)
    || !optionalFinite(impact.severityRank)
    || (impact.acceptedActionRankingChange !== undefined && typeof impact.acceptedActionRankingChange !== 'boolean')
    || !Array.isArray(impact.recommendedActions) || impact.recommendedActions.length > 128) return false;
  const actionIds = new Set<string>();
  for (const action of impact.recommendedActions) {
    if (!action || typeof action !== 'object'
      || !boundedIdentity(action.id, 'recommended action')
      || actionIds.has(action.id)
      || !Number.isFinite(action.tier) || !Number.isFinite(action.riderRank)
      || !boundedDisplayText(action.label, 4_096)) return false;
    actionIds.add(action.id);
  }
  return true;
}

function boundedIdentity(value: unknown, label: string, maximum = 256): value is string {
  if (typeof value !== 'string') return false;
  try { return normalizeBoundedIdentity(value, label, maximum) === value; } catch { return false; }
}

function boundedIdentityArray(value: unknown, label: string, maximumLength: number): value is readonly string[] {
  return Array.isArray(value) && value.length > 0 && value.length <= maximumLength
    && value.every((item) => boundedIdentity(item, label)) && new Set(value).size === value.length;
}

function boundedDisplayText(value: unknown, maximumCodePoints: number): value is string {
  if (typeof value !== 'string') return false;
  try {
    const normalized = value.normalize('NFC').trim();
    return normalized === value && normalized.length > 0 && [...normalized].length <= maximumCodePoints && !/\p{C}/u.test(normalized);
  } catch { return false; }
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function optionalFinite(value: unknown, nonnegative = false): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && (!nonnegative || value >= 0));
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
  return Object.freeze({
    title: boundedText(content.title, 160),
    body: boundedText(content.body, 1_024),
    url: '/?surface=commute' as const,
    episodeId: impact.episodeId,
  });
}

export function isCommutePushPayload(value: unknown): value is CommutePushPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.length === 4 && ['title', 'body', 'url', 'episodeId'].every((key) => keys.includes(key))
    && typeof record.title === 'string' && record.title.length > 0 && record.title.length <= 160
    && typeof record.body === 'string' && record.body.length > 0 && record.body.length <= 1_024
    && record.url === '/?surface=commute'
    && typeof record.episodeId === 'string' && /^[A-Za-z0-9._:-]{1,128}$/u.test(record.episodeId);
}

function boundedText(value: string, maximum: number): string {
  return value.length <= maximum ? value : value.slice(0, maximum);
}

function impactStateKey(impact: NotificationImpact): string {
  return JSON.stringify([
    impact.kind,
    impact.routeId,
    impact.direction,
    [...impact.affectedStationIds].sort(),
    impact.activeFrom.toISOString(),
    impact.activeUntil.toISOString(),
    impact.addedJourneySeconds ?? null,
    impact.correctionOnly,
    impact.decisionChanging,
    impact.acceptedActionRankingChange ?? false,
    impact.recommendedActions.map(({ id, tier, riderRank }) => [id, tier, riderRank]),
  ]);
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
