import { describe, expect, test } from 'vitest';

import type { JourneyGraphReferenceDto } from '../../src/client/api/client';
import { planOfflineJourney } from '../../src/client/offline/plan-offline-journey';
import { journeyGraphFixture } from '../helpers/journey-graph-fixture';

const reference: JourneyGraphReferenceDto = {
  contentVersion: 'journey-graph-7',
  graph: journeyGraphFixture,
};

describe('device-local offline journey planning', () => {
  test('routes direct and transfer alternatives through the stored graph with no current timing claims', () => {
    const response = planOfflineJourney(reference, {
      mode: 'offline-reference',
      originStationId: 'A12',
      destinationStationId: 'R20',
      accessibleRouteOnly: false,
    });

    expect(response.data).toMatchObject({
      kind: 'untimed',
      label: 'Untimed structural route',
      scope: {
        mode: 'offline-reference',
        originStationId: 'A12',
        destinationStationId: 'R20',
        accessibleRouteOnly: false,
      },
      itineraries: [
        { transfers: 0, timing: 'untimed', legs: [{ fromStationId: 'A12', toStationId: 'R20' }] },
        {
          transfers: 1,
          timing: 'untimed',
          legs: [
            { fromStationId: 'A12', toStationId: 'D14' },
            { fromStationId: 'D14', toStationId: 'R20' },
          ],
          transferInstructions: [{ stationId: 'D14', transferId: 'transfer-d14' }],
        },
      ],
    });
    expect(JSON.stringify(response)).not.toMatch(/arrivalSeconds|current-supplemented|admitted/);
  });

  test('returns an exact no-path decision locally and rejects non-offline queries', () => {
    expect(planOfflineJourney(reference, {
      mode: 'offline-reference',
      originStationId: 'A12',
      destinationStationId: 'missing-station',
      accessibleRouteOnly: false,
    }).data).toMatchObject({
      kind: 'no-path',
      reason: 'no-service-path',
      scope: { originStationId: 'A12', destinationStationId: 'missing-station' },
    });

    expect(() => planOfflineJourney(reference, {
      mode: 'online-current',
      originStationId: 'A12',
      destinationStationId: 'R20',
      accessibleRouteOnly: false,
    })).toThrow(/offline-reference/);
  });
});
