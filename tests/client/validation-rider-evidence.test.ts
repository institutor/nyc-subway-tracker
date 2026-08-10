import { describe, expect, test } from 'vitest';

import { accessiblePathDecisionAllowsPresentation } from '../../src/shared/domain/accessible-path';
import { equipmentDecisionAllowsUse } from '../../src/shared/domain/equipment-status';
import { platformGuidanceAllowsPresentation } from '../../src/shared/domain/platform-guidance';
import {
  bindValidationRiderEvidenceToItinerary,
  createValidationRiderEvidence,
  type ValidationRiderEvidenceOwner,
} from '../../src/shared/validation/rider-evidence';

const decisionTime = new Date('2026-08-04T12:00:00.000Z');
const committedOwner = {
  decisionIdentity: 'response:committed-validation-bootstrap',
  snapshotIdentity: 'validation-snapshot-2026-08-04-v2',
  decisionTime,
  disclosure: 'Demonstration data — not live',
  contentVersions: {
    stationCatalog: 'validation-catalog-2026-08-04-v2',
    maps: {
      day: 'validation-map-day-2026-08-04-v2',
      night: 'validation-map-night-2026-08-04-v2',
    },
    journeyGraph: 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d',
  },
} as const;

describe('production-owned validation rider evidence', () => {
  test('composes the exact A15-to-A34 destination-scoped path and guidance through domain resolvers', () => {
    const evidence = createValidationRiderEvidence(committedOwner);

    expect(evidence).toBeDefined();
    if (!evidence) throw new Error('Expected validation rider evidence');
    expect(accessiblePathDecisionAllowsPresentation(evidence.path, 'validation', decisionTime)).toBe(true);
    expect(evidence.path).toMatchObject({
      status: 'eligible', surface: 'validation', accessibleRouteOnly: true,
      stationComplexId: 'A15', constituentStationId: 'A15', routeId: 'A', direction: 'southbound',
      equipmentIds: ['EL-A34-01'],
      journeyScope: {
        origin: { stationComplexId: 'A15', constituentStationId: 'A15', platformId: 'A15S' },
        destination: { stationComplexId: 'A34', constituentStationId: 'A34', platformId: 'A34S' },
        rideSegments: [{
          routeId: 'A', direction: 'southbound',
          origin: { stationComplexId: 'A15', constituentStationId: 'A15', platformId: 'A15S' },
          destination: { stationComplexId: 'A34', constituentStationId: 'A34', platformId: 'A34S' },
        }],
        transferIds: [],
      },
    });
    expect(evidence.equipment).toHaveLength(1);
    expect(equipmentDecisionAllowsUse(evidence.equipment[0]!.decision, decisionTime)).toBe(true);
    expect(evidence.equipment[0]).toMatchObject({ label: 'Canal St platform elevator', required: true });
    expect(platformGuidanceAllowsPresentation(evidence.guidance, 'validation', decisionTime)).toBe(true);
    expect(evidence.guidance).toMatchObject({
      complex: { id: 'A34', name: 'Canal St' }, constituent: { id: 'A34', name: 'Canal St' },
      platformId: 'A34S', objectiveTarget: 'EL-A34-01', route: 'A', direction: 'southbound',
      destination: 'Far Rockaway', position: 'middle',
      zoneBenefit: { position: 'middle', copy: 'Nearest verified elevator at Canal St' },
    });
    expect(evidence.receipt).toEqual({
      bootstrapDecisionIdentity: 'response:committed-validation-bootstrap',
      decisionSnapshotIdentity: 'validation-snapshot-2026-08-04-v2',
      stationCatalogVersion: 'validation-catalog-2026-08-04-v2',
      journeyGraphVersion: 'journey-graph-ca6e27786a0488d3dbdfe272ba834c89fec49413d22ae63407e23f4cf883831d',
      mapDayVersion: 'validation-map-day-2026-08-04-v2',
      mapNightVersion: 'validation-map-night-2026-08-04-v2',
      pathId: 'path-a15-a34-accessible',
      originStationId: 'A15', originPlatformId: 'A15S',
      destinationStationId: 'A34', destinationPlatformId: 'A34S',
      routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
    });
  });

  test.each([
    ['catalog version', { contentVersions: { ...committedOwner.contentVersions, stationCatalog: 'validation-catalog-other' } }],
    ['journey version', { contentVersions: { ...committedOwner.contentVersions, journeyGraph: 'journey-graph-other' } }],
    ['map version', { contentVersions: { ...committedOwner.contentVersions, maps: { ...committedOwner.contentVersions.maps, day: 'map-day-other' } } }],
    ['snapshot identity', { snapshotIdentity: 'validation-snapshot-other' }],
    ['disclosure', { disclosure: undefined }],
  ])('fails closed when the committed %s does not match', (_name, change) => {
    const owner = {
      ...committedOwner,
      ...change,
      contentVersions: 'contentVersions' in change ? change.contentVersions : committedOwner.contentVersions,
    };
    expect(createValidationRiderEvidence(owner as ValidationRiderEvidenceOwner)).toBeUndefined();
  });

  test('returns no branded evidence outside the committed validation decision window', () => {
    expect(createValidationRiderEvidence({
      ...committedOwner, decisionTime: new Date('2028-08-04T12:00:00.000Z'),
    })).toBeUndefined();
  });

  test('binds the exact direct response/capture and rejects the A-to-C transfer alternative', () => {
    const evidence = createValidationRiderEvidence(committedOwner);
    const response = validationJourneyResponse();
    const direct = validationDirectItinerary();

    expect(bindValidationRiderEvidenceToItinerary(evidence, response, direct)).toMatchObject({
      journeyReceipt: {
        journeyDecisionIdentity: 'response:validation-journey-v2',
        canonicalItineraryIdentity: 'validation-direct-itinerary',
      },
    });
    expect(bindValidationRiderEvidenceToItinerary(evidence, response, validationTransferItinerary())).toBeUndefined();
  });

  test.each([
    ['response snapshot', (response: any, _itinerary: any) => { response.decisionSnapshotIdentity = 'snapshot-other'; }],
    ['response decision time', (response: any, _itinerary: any) => { response.decidedAt = '2026-08-04T12:00:01.000Z'; }],
    ['canonical itinerary', (_response: any, itinerary: any) => { itinerary.capture.itineraryId = 'other-itinerary'; }],
    ['ordered station endpoint', (_response: any, itinerary: any) => { itinerary.legs[0].orderedStationIds[1] = 'A33'; }],
    ['ordered platform occurrence', (_response: any, itinerary: any) => { itinerary.legs[0].orderedOccurrenceIds[1] = 'occ-a33-direct'; }],
    ['capture path', (_response: any, itinerary: any) => { itinerary.capture.equipmentClaims[0].pathId = 'path-other'; }],
  ])('withholds evidence when the exact %s identity changes', (_name, mutate) => {
    const response = structuredClone(validationJourneyResponse());
    const itinerary = structuredClone(validationDirectItinerary());
    mutate(response, itinerary);
    expect(bindValidationRiderEvidenceToItinerary(createValidationRiderEvidence(committedOwner), response, itinerary)).toBeUndefined();
  });
});

function validationJourneyResponse() {
  return {
    responseIdentity: 'response:validation-journey-v2', decidedAt: '2026-08-04T12:00:00.000Z',
    decisionSnapshotIdentity: 'validation-snapshot-2026-08-04-v2', demonstrationLabel: 'Demonstration data — not live',
    runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
    data: { kind: 'planned', scope: {
      mode: 'online-current', originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: true,
    } },
  } as const;
}

function validationDirectItinerary() {
  return {
    id: 'validation-direct-itinerary', transfers: 0, transferIds: [],
    legs: [{
      patternId: 'pattern-direct', routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
      fromOccurrenceId: 'occ-a15-direct', toOccurrenceId: 'occ-a34-direct',
      orderedOccurrenceIds: ['occ-a15-direct', 'occ-a34-direct'],
      fromStationId: 'A15', toStationId: 'A34', orderedStationIds: ['A15', 'A34'],
    }],
    capture: {
      itineraryId: 'validation-direct-itinerary', requestMode: 'online-current', timing: 'timed',
      capturedAt: '2026-08-04T12:00:00.000Z', disclosure: 'Demonstration data — not live',
      scope: { mode: 'online-current', originStationId: 'A15', destinationStationId: 'A34', accessibleRouteOnly: true },
      equipmentClaims: [{
        equipmentId: 'EL-A34-01', connectionId: 'connection-a34-platform',
        pathId: 'path-a15-a34-accessible', observation: 'working',
      }],
    },
  } as const;
}

function validationTransferItinerary() {
  return {
    id: 'validation-transfer-itinerary', transfers: 1, transferIds: ['transfer-a24'],
    legs: [
      { patternId: 'pattern-transfer-a', routeId: 'A', direction: 'southbound', actualDestination: 'Far Rockaway',
        fromOccurrenceId: 'occ-a15-transfer', toOccurrenceId: 'occ-a24-in', orderedOccurrenceIds: ['occ-a15-transfer', 'occ-a24-in'],
        fromStationId: 'A15', toStationId: 'A24', orderedStationIds: ['A15', 'A24'] },
      { patternId: 'pattern-transfer-c', routeId: 'C', direction: 'southbound', actualDestination: 'Euclid Av',
        fromOccurrenceId: 'occ-a24-out', toOccurrenceId: 'occ-a34-transfer', orderedOccurrenceIds: ['occ-a24-out', 'occ-a34-transfer'],
        fromStationId: 'A24', toStationId: 'A34', orderedStationIds: ['A24', 'A34'] },
    ],
  } as const;
}
