import { describe, expect, test } from 'vitest';

import {
  materialNotificationDecision,
  rankRecommendedActions,
  type DeliveredNotificationBaseline,
  type NotificationImpact,
} from '../../src/shared/domain/notification-decision';
import {
  createCommuteRuntimeWindow,
  resolveCommuteOccurrence,
} from '../../src/shared/domain/commute-window';

const window = createCommuteRuntimeWindow({
  id: 'weekday-a',
  savedRecordId: 'saved-a',
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

describe('New York commute occurrences', () => {
  test('uses an inclusive preparation boundary and exclusive end boundary', () => {
    expect(resolveCommuteOccurrence(window, new Date('2026-08-03T11:45:00.000Z')).kind).toBe('watching');
    expect(resolveCommuteOccurrence(window, new Date('2026-08-03T13:00:00.000Z'))).toEqual({
      kind: 'outside-window',
    });
  });

  test('assigns an overnight interval to the weekday on which it starts', () => {
    const overnight = createCommuteRuntimeWindow({ ...window, startsAt: '23:30', endsAt: '00:30' });
    const occurrence = resolveCommuteOccurrence(overnight, new Date('2026-08-04T04:15:00.000Z'));
    expect(occurrence).toMatchObject({
      kind: 'watching',
      localStartDate: '2026-08-03',
      localEndDate: '2026-08-04',
    });
  });

  test('omits a wholly nonexistent spring-forward occurrence and dedupes the repeated fall-back hour', () => {
    const sunday = createCommuteRuntimeWindow({ ...window, weekdays: [7], startsAt: '02:10', endsAt: '02:40' });
    expect(resolveCommuteOccurrence(sunday, new Date('2026-03-08T07:20:00.000Z'))).toEqual({ kind: 'outside-window' });

    const repeated = createCommuteRuntimeWindow({ ...window, weekdays: [7], startsAt: '01:10', endsAt: '01:50' });
    const earlier = resolveCommuteOccurrence(repeated, new Date('2026-11-01T05:30:00.000Z'));
    const later = resolveCommuteOccurrence(repeated, new Date('2026-11-01T06:30:00.000Z'));
    expect(earlier).toMatchObject({ kind: 'watching' });
    expect(later).toMatchObject({ kind: 'watching' });
    expect(earlier.kind === 'watching' && later.kind === 'watching' && earlier.occurrenceId).toBe(later.kind === 'watching' ? later.occurrenceId : '');
  });
});

describe('material notification decisions', () => {
  test('requires exact route, direction, and used segment relevance', () => {
    const base = impact();
    expect(decide(base).outcome).toBe('send');
    expect(decide({ ...base, routeId: 'A' })).toEqual({ outcome: 'suppress', reason: 'route-irrelevant' });
    expect(decide({ ...base, direction: 'northbound' })).toEqual({ outcome: 'suppress', reason: 'direction-irrelevant' });
    expect(decide({ ...base, affectedStationIds: ['D22'] })).toEqual({ outcome: 'suppress', reason: 'segment-irrelevant' });
  });

  test('suppresses equivalent delivery in one episode but permits a new episode', () => {
    const delivered = baseline();
    expect(decide(impact(), [delivered])).toEqual({ outcome: 'suppress', reason: 'equivalent-delivered' });
    expect(decide({ ...impact(), episodeId: 'episode-2' }, [delivered]).outcome).toBe('send');
  });

  test('never sends correction wording without an independent material change', () => {
    expect(decide({ ...impact(), correctionOnly: true })).toEqual({ outcome: 'suppress', reason: 'correction-only' });
  });

  test('keeps the canonical first action stable when fully tied inputs are shuffled', () => {
    const actions = [
      { id: 'path-b', tier: 1, riderRank: 1, label: 'Second enumeration' },
      { id: 'path-a', tier: 1, riderRank: 1, label: 'First canonical identity' },
    ];
    expect(rankRecommendedActions(actions).map(({ id }) => id)).toEqual(['path-a', 'path-b']);
    expect(rankRecommendedActions([...actions].reverse()).map(({ id }) => id)).toEqual(['path-a', 'path-b']);
  });

  test('creates an escalation only at inclusive material boundaries', () => {
    const delivered = baseline();
    expect(decide({ ...impact(), addedJourneySeconds: 899 }, [delivered])).toEqual({ outcome: 'suppress', reason: 'equivalent-delivered' });
    expect(decide({ ...impact(), addedJourneySeconds: 900 }, [delivered])).toMatchObject({ outcome: 'send', kind: 'escalation' });
    const shorter = { ...delivered, activeUntil: new Date('2026-08-03T12:30:00.000Z') };
    expect(decide({ ...impact(), activeUntil: new Date('2026-08-03T12:59:59.000Z') }, [shorter])).toEqual({ outcome: 'suppress', reason: 'equivalent-delivered' });
    expect(decide({ ...impact(), activeUntil: new Date('2026-08-03T13:00:00.000Z') }, [shorter])).toMatchObject({ outcome: 'send', kind: 'escalation' });
  });
});

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

function baseline(): DeliveredNotificationBaseline {
  return {
    episodeId: 'episode-1',
    impactKind: 'bypass',
    routeId: 'F',
    direction: 'southbound',
    affectedStationIds: ['D18'],
    addedJourneySeconds: 600,
    activeUntil: new Date('2026-08-03T13:00:00.000Z'),
    recommendedActionId: 'use-a-c',
    deliveredAt: new Date('2026-08-03T11:55:00.000Z'),
  };
}

function decide(value: NotificationImpact, history: readonly DeliveredNotificationBaseline[] = []) {
  const occurrence = resolveCommuteOccurrence(window, new Date('2026-08-03T12:00:00.000Z'));
  if (occurrence.kind !== 'watching') throw new Error('fixture occurrence is not watching');
  return materialNotificationDecision({ window, occurrence, impact: value, delivered: history });
}
