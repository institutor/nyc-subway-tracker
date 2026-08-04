import { expect, test } from 'vitest';

import type { ServiceDate } from '../../src/shared/domain/clock';
import type {
  Accessibility,
  Arrival,
  BoardDecision,
  CommuteStage,
  ExposureStage,
  PrimaryArrival,
  SecondaryArrival,
} from '../../src/shared/domain/types';

test('rejects impossible decision-state combinations at compile time', () => {
  const secondary: SecondaryArrival = {
    id: 'train-1',
    route: { id: 'A', label: 'A' },
    direction: 'northbound',
    destination: 'Inwood-207 St',
    kind: 'uncertain',
    reason: 'Movement evidence is too old.',
    provenance: {
      source: 'gtfs-rt',
      sourceId: 'fixture',
      observedAt: new Date('2026-08-04T11:59:00.000Z'),
      retrievedAt: new Date('2026-08-04T12:00:00.000Z'),
    },
  };

  // @ts-expect-error Holding and uncertain rows cannot occupy a primary slot.
  const invalidPrimary: PrimaryArrival = secondary;

  // @ts-expect-error Uncertain rows must never carry an exact arrival minute.
  const uncertain: Arrival = {
    id: 'train-1',
    route: { id: 'A', label: 'A' },
    direction: 'northbound',
    destination: 'Inwood-207 St',
    kind: 'uncertain',
    reason: 'Movement evidence is too old.',
    at: new Date('2026-08-04T12:00:00.000Z'),
    provenance: {
      source: 'gtfs-rt',
      sourceId: 'fixture',
      observedAt: new Date('2026-08-04T11:59:00.000Z'),
      retrievedAt: new Date('2026-08-04T12:00:00.000Z'),
    },
  };

  // @ts-expect-error Eligible accessibility always requires a complete path and provenance.
  const incompleteAccessibility: Accessibility = { kind: 'eligible', entranceId: 'entrance-1' };
  const commuteStage: CommuteStage = 'delivery';
  const exposureStage: ExposureStage = 'locked';

  const uncertainWithExactMinute = { ...secondary, at: new Date('2026-08-04T12:00:00.000Z') };
  // @ts-expect-error An exact minute cannot enter an uncertain row through structural assignment.
  const unsafeUncertain: Arrival = uncertainWithExactMinute;

  // @ts-expect-error A commute pilot stage is not an arrival-exposure stage.
  const invalidExposureStage: ExposureStage = 'pilot';

  // @ts-expect-error A live board cannot contain a scheduled primary arrival.
  const invalidLiveBoard: BoardDecision = {
    responseIdentity: 'board-1',
    mode: 'live',
    station: { id: 'station-1', name: 'Station', complexId: 'complex-1', routeIds: ['A'] },
    directions: [{
      direction: 'northbound',
      primary: [{
        id: 'scheduled-1',
        route: { id: 'A', label: 'A' },
        direction: 'northbound',
        destination: 'Inwood-207 St',
        kind: 'scheduled',
        at: new Date('2026-08-04T12:00:00.000Z'),
        serviceDate: '2026-08-04' as ServiceDate,
        provenance: {
          source: 'supplemented-gtfs',
          sourceId: 'fixture',
          observedAt: new Date('2026-08-04T11:59:00.000Z'),
          retrievedAt: new Date('2026-08-04T12:00:00.000Z'),
        },
      }],
      secondary: [],
      explanations: [],
    }],
    feedHealth: [],
    alerts: [],
    decidedAt: new Date('2026-08-04T12:00:00.000Z'),
    explanations: [],
    capabilities: { arrivals: 'available', accessibility: 'locked', guidance: 'locked', commute: 'locked' },
  };

  expect(invalidPrimary).toBeDefined();
  expect(uncertain).toBeDefined();
  expect(incompleteAccessibility).toBeDefined();
  expect(unsafeUncertain).toBeDefined();
  expect(invalidExposureStage).toBeDefined();
  expect(invalidLiveBoard).toBeDefined();
  expect(commuteStage).toBe('delivery');
  expect(exposureStage).toBe('locked');
});
