import { compareCanonicalIdentity, normalizeBoundedIdentity } from './canonical';
import type { CommuteRuntimeWindow, WatchingCommuteOccurrence } from './commute-window';
import type { Direction } from './types';

export type NotificationImpactKind = 'delay' | 'suspension' | 'bypass' | 'short-turn' | 'closure' | 'accessibility';

export interface RecommendedAction {
  readonly id: string;
  readonly tier: number;
  readonly riderRank: number;
  readonly label: string;
}

export interface NotificationImpact {
  readonly episodeId: string;
  readonly kind: NotificationImpactKind;
  readonly routeId: string;
  readonly direction: Direction;
  readonly affectedStationIds: readonly string[];
  readonly activeFrom: Date;
  readonly activeUntil: Date;
  readonly evidenceCurrent: boolean;
  readonly decisionChanging: boolean;
  readonly correctionOnly: boolean;
  readonly addedJourneySeconds?: number;
  readonly severityRank?: number;
  readonly recommendedActions: readonly RecommendedAction[];
  readonly acceptedActionRankingChange?: boolean;
}

export interface DeliveredNotificationBaseline {
  readonly episodeId: string;
  readonly impactKind: NotificationImpactKind;
  readonly routeId: string;
  readonly direction: Direction;
  readonly affectedStationIds: readonly string[];
  readonly addedJourneySeconds?: number;
  readonly severityRank?: number;
  readonly activeUntil: Date;
  readonly recommendedActionId?: string;
  readonly deliveredAt: Date;
}

export type NotificationDecision =
  | { readonly outcome: 'send'; readonly kind: 'initial' | 'escalation'; readonly action?: RecommendedAction }
  | { readonly outcome: 'suppress'; readonly reason: string }
  | { readonly outcome: 'hold'; readonly reason: string };

export function rankRecommendedActions(actions: readonly RecommendedAction[]): readonly RecommendedAction[] {
  const captured = actions.map((action) => {
    if (!Number.isFinite(action.tier) || !Number.isFinite(action.riderRank)) throw new Error('Invalid action ranking');
    return {
      id: normalizeBoundedIdentity(action.id, 'recommended action'),
      tier: action.tier,
      riderRank: action.riderRank,
      label: action.label.normalize('NFC').trim(),
    };
  });
  if (new Set(captured.map(({ id }) => id)).size !== captured.length) throw new Error('Duplicate recommended action identity');
  captured.sort((left, right) => left.tier - right.tier
    || left.riderRank - right.riderRank
    || compareCanonicalIdentity(left.id, right.id));
  return Object.freeze(captured.map((value) => Object.freeze(value)));
}

export function materialNotificationDecision(input: {
  readonly window: CommuteRuntimeWindow;
  readonly occurrence: WatchingCommuteOccurrence;
  readonly impact: NotificationImpact;
  readonly delivered: readonly DeliveredNotificationBaseline[];
}): NotificationDecision {
  const { window, occurrence, impact } = input;
  if (window.lifecycle !== 'active' || !window.notificationEnabled) return suppress('window-inactive');
  if (!impact.evidenceCurrent) return { outcome: 'hold', reason: 'evidence-unresolved' };
  if (!overlaps(impact.activeFrom, impact.activeUntil, occurrence.opensAt, occurrence.endsAt)) return suppress('time-irrelevant');
  if (impact.routeId !== window.scope.routeId) return suppress('route-irrelevant');
  if (impact.direction !== window.scope.direction) return suppress('direction-irrelevant');
  if (!impact.affectedStationIds.some((stationId) => window.scope.segmentStationIds.includes(stationId))) return suppress('segment-irrelevant');
  if (!impact.decisionChanging) return suppress('not-decision-changing');

  const actions = rankRecommendedActions(impact.recommendedActions);
  const baseline = [...input.delivered]
    .filter(({ episodeId }) => episodeId === impact.episodeId)
    .sort((left, right) => right.deliveredAt.getTime() - left.deliveredAt.getTime())[0];
  if (!baseline) {
    if (impact.correctionOnly) return suppress('correction-only');
    return { outcome: 'send', kind: 'initial', ...(actions[0] ? { action: actions[0] } : {}) };
  }

  const material = materialEscalation(impact, baseline, occurrence, actions[0]);
  if (!material) return suppress(impact.correctionOnly ? 'correction-only' : 'equivalent-delivered');
  return { outcome: 'send', kind: 'escalation', ...(actions[0] ? { action: actions[0] } : {}) };
}

function materialEscalation(
  impact: NotificationImpact,
  baseline: DeliveredNotificationBaseline,
  occurrence: WatchingCommuteOccurrence,
  action: RecommendedAction | undefined,
): boolean {
  const addedTime = impact.addedJourneySeconds !== undefined && baseline.addedJourneySeconds !== undefined
    && impact.addedJourneySeconds - baseline.addedJourneySeconds >= 300;
  const newPlace = impact.affectedStationIds.some((stationId) => !baseline.affectedStationIds.includes(stationId));
  const newDirection = impact.direction !== baseline.direction;
  const severity = impact.severityRank !== undefined && baseline.severityRank !== undefined
    && impact.severityRank > baseline.severityRank;
  const oldEnd = Math.min(baseline.activeUntil.getTime(), occurrence.endsAt.getTime());
  const newEnd = Math.min(impact.activeUntil.getTime(), occurrence.endsAt.getTime());
  const extension = newEnd - oldEnd >= 1_800_000;
  const actionChanged = impact.acceptedActionRankingChange === true
    && action?.id !== baseline.recommendedActionId;
  return addedTime || newPlace || newDirection || severity || extension || actionChanged;
}

function overlaps(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date): boolean {
  return leftStart.getTime() < rightEnd.getTime() && leftEnd.getTime() > rightStart.getTime();
}

function suppress(reason: string): NotificationDecision {
  return { outcome: 'suppress', reason };
}
