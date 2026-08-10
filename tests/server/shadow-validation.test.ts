import { describe, expect, test } from 'vitest';

const DECISION_TIME = new Date('2026-08-10T12:00:00.000Z');
const at = (seconds: number) => new Date(DECISION_TIME.getTime() + seconds * 1_000);

describe('shadow station-claim decisions', () => {
  test('persists the real feed-health, service-change, and arrival-admission disposition for each target claim', async () => {
    const module = await import('../../src/server/services/shadow-validation').catch(() => ({} as any)) as any;
    expect(typeof module.projectShadowClaims).toBe('function');

    const claims = module.projectShadowClaims({
      snapshot: snapshot([
        trip('train-admitted', true),
        trip('train-without-movement', false),
      ]),
      alertSnapshot: null,
      decisionTime: DECISION_TIME,
    });

    expect(claims).toHaveLength(4);
    const admittedTarget = claims.find((claim: any) => claim.operationalTrainId === 'train-admitted' && claim.targetStopId === 'A16N');
    const suppressedTarget = claims.find((claim: any) => claim.operationalTrainId === 'train-without-movement' && claim.targetStopId === 'A16N');
    expect(admittedTarget).toMatchObject({
      disposition: 'admitted', targetStopId: 'A16N', decisionTime: DECISION_TIME.toISOString(),
      provenance: {
        source: 'gtfs-rt', sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace',
        observedAt: DECISION_TIME.toISOString(), retrievedAt: DECISION_TIME.toISOString(),
        sha256: 'a'.repeat(64),
      },
      decisions: {
        feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
        serviceChange: { kind: 'eligible-context', disposition: 'eligible' },
        admission: { kind: 'admitted', stopCallIdentity: 'A16N\u0000sequence:2' },
      },
    });
    expect(admittedTarget).not.toHaveProperty('suppressionReasonCode');
    expect(suppressedTarget).toMatchObject({
      disposition: 'suppressed', targetStopId: 'A16N',
      suppressionReasonCode: 'MOVEMENT_EVIDENCE_UNCONFIRMED',
      decisions: { admission: { kind: 'secondary', failedGate: 'movement-time' } },
    });
    expect(new Set(claims.map((claim: any) => claim.targetStopCallIdentity))).toEqual(new Set([
      'A14N\u0000sequence:1', 'A16N\u0000sequence:2',
    ]));
    expect(JSON.stringify(claims)).not.toMatch(/latitude|longitude|permission|endpoint|token|privateKey|secret/i);
  });
});

function snapshot(tripUpdates: readonly any[]) {
  return {
    sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace', sourceUrl: 'https://api.mta.info/feed',
    retrievedAt: DECISION_TIME,
    provenance: {
      sourceId: 'subway-rt-ace', sourceAuthority: 'MTA', sourceRole: 'subway-realtime',
      sourceUrl: 'https://api.mta.info/feed', retrievedAt: DECISION_TIME.toISOString(),
      finalUrl: 'https://api.mta.info/feed', redirectCount: 0,
      declaredContentType: 'application/x-protobuf', observedContentType: 'application/x-protobuf',
      declaredBytes: 100, receivedBytes: 100, sha256: 'a'.repeat(64),
    },
    rawEvidence: { evidenceId: `sha256:${'a'.repeat(64)}`, mediaType: 'application/x-protobuf', receivedBytes: 100, payloadBase64: 'AA==' },
    gtfsRealtimeVersion: '1.0', nyctSubwayVersion: '1.0', incrementality: 'FULL_DATASET',
    feedTimestamp: DECISION_TIME, contentHash: 'a'.repeat(64), entityCount: tripUpdates.length,
    coveredRouteIds: ['A'], tripReplacementPeriods: [], tripUpdates, vehiclePositions: [], embeddedTrainAlerts: [],
  };
}

function trip(trainInstanceId: string, movement: boolean) {
  return {
    entityId: trainInstanceId, evidenceId: `evidence-${trainInstanceId}`, trainInstanceId,
    trip: {
      tripId: `trip-${trainInstanceId}`, routeId: 'A', directionId: 0,
      startDate: '20260810', startTime: '12:00:00', nyct: { trainId: trainInstanceId },
    },
    updateTimestamp: DECISION_TIME,
    remainingStopCalls: [
      { remainingOrder: 0, sourceStopSequence: 1, stopId: 'A14N', arrivalTime: at(60), departureTime: at(70), scheduleRelationship: null, scheduledTrack: '1', actualTrack: '1' },
      { remainingOrder: 1, sourceStopSequence: 2, stopId: 'A16N', arrivalTime: at(180), departureTime: at(190), scheduleRelationship: null, scheduledTrack: '1', actualTrack: '1' },
    ],
    vehicleProgress: movement ? {
      entityId: `vehicle-${trainInstanceId}`, vehicleId: trainInstanceId, currentStopSequence: 1,
      stopId: 'A14N', currentStatus: 'IN_TRANSIT_TO', movementTimestamp: DECISION_TIME,
    } : null,
  };
}
