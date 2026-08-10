import { describe, expect, test } from 'vitest';

const DECISION_TIME = new Date('2026-08-10T12:00:00.000Z');
const at = (seconds: number) => new Date(DECISION_TIME.getTime() + seconds * 1_000);

describe('shadow station-claim decisions', () => {
  test('suppresses one-snapshot claims without manufacturing identity, recovery, movement, range, or destination evidence', async () => {
    const module = await import('../../src/server/services/shadow-validation').catch(() => ({} as any)) as any;
    expect(typeof module.projectShadowClaims).toBe('function');

    const claims = module.projectShadowClaims({
      snapshot: snapshot([
        trip('train-admitted', true),
        trip('train-without-movement', false),
      ]),
      sourceRecord: acceptedSource(),
      alertSnapshot: null,
      decisionTime: DECISION_TIME,
    });

    expect(claims).toHaveLength(4);
    const intermediateTarget = claims.find((claim: any) => claim.operationalTrainId === 'train-admitted' && claim.targetStopId === 'A14N');
    const suppressedTarget = claims.find((claim: any) => claim.operationalTrainId === 'train-without-movement' && claim.targetStopId === 'A16N');
    expect(intermediateTarget).toMatchObject({
      disposition: 'suppressed', targetStopId: 'A14N', terminalDestinationStopId: 'A16N', decisionTime: DECISION_TIME.toISOString(),
      suppressionReasonCode: 'TRUSTED_HISTORY_UNAVAILABLE',
      provenance: {
        source: 'gtfs-rt', sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace',
        observedAt: DECISION_TIME.toISOString(), retrievedAt: DECISION_TIME.toISOString(),
        sha256: 'a'.repeat(64),
      },
      decisions: {
        feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
        serviceChange: { kind: 'eligible-context', disposition: 'eligible' },
        admission: { kind: 'rejected', disposition: 'suppressed', reasonCode: 'TRUSTED_HISTORY_UNAVAILABLE' },
      },
    });
    expect(suppressedTarget).toMatchObject({
      disposition: 'suppressed', targetStopId: 'A16N',
      suppressionReasonCode: 'TRUSTED_HISTORY_UNAVAILABLE',
      decisions: { admission: { kind: 'rejected', disposition: 'suppressed', reasonCode: 'TRUSTED_HISTORY_UNAVAILABLE' } },
    });
    expect(new Set(claims.map((claim: any) => claim.targetStopCallIdentity))).toEqual(new Set([
      'A14N\u0000sequence:1', 'A16N\u0000sequence:2',
    ]));
    expect(JSON.stringify(claims)).not.toMatch(/latitude|longitude|permission|endpoint|token|privateKey|secret/i);
    expect(JSON.stringify(claims)).not.toMatch(/supportedRange|recoveryDisposition|identityDisposition|movementDisposition|riderCopy|rawAudit|officialDetails/i);
  });

  test('suppresses stale movement evidence explicitly and never upgrades it from mere presence', async () => {
    const stale = trip('train-stale', true);
    stale.vehicleProgress!.movementTimestamp = at(-91);
    const claims = (await import('../../src/server/services/shadow-validation') as any).projectShadowClaims({
      snapshot: snapshot([stale]), sourceRecord: acceptedSource(), alertSnapshot: null, decisionTime: DECISION_TIME,
    });
    expect(claims).toHaveLength(2);
    expect(claims.every((claim: any) => claim.disposition === 'suppressed'
      && claim.suppressionReasonCode === 'STALE_MOVEMENT_EVIDENCE')).toBe(true);
  });

  test('rejects a snapshot that is not exactly owned by its canonical accepted source row', async () => {
    const module = await import('../../src/server/services/shadow-validation') as any;
    await expect(() => module.projectShadowClaims({
      snapshot: snapshot([trip('train-unowned', true)]),
      sourceRecord: { ...acceptedSource(), sourceId: 'subway-rt-bdfm' },
      alertSnapshot: null, decisionTime: DECISION_TIME,
    })).toThrow(/source.*ownership|provenance.*join/i);
  });

  test('bounds a maximal 500-claim projection below the fixed encoded record ceiling without embedding alert text', async () => {
    const module = await import('../../src/server/services/shadow-validation') as any;
    const updates = Array.from({ length: 250 }, (_, index) => trip(`train-${index}`, true));
    const claims = module.projectShadowClaims({
      snapshot: snapshot(updates), sourceRecord: acceptedSource(), alertSnapshot: alertSnapshot(), decisionTime: DECISION_TIME,
    });
    expect(claims).toHaveLength(500);
    expect(Buffer.byteLength(JSON.stringify({ claims }), 'utf8')).toBeLessThanOrEqual(1_000_000);
    expect(JSON.stringify(claims)).not.toContain('MAXIMAL OFFICIAL ALERT');
    expect(claims.every((claim: any) => Object.keys(claim.decisions.admission).sort().join(',') === 'disposition,kind,reasonCode')).toBe(true);
  });
});

function acceptedSource() {
  return {
    sourceId: 'subway-rt-ace', role: 'subway-realtime', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
    feedGroupId: 'subway-rt-ace', observedAt: DECISION_TIME.toISOString(), retrievedAt: DECISION_TIME.toISOString(), sha256: 'a'.repeat(64),
  };
}

function alertSnapshot() {
  return {
    sourceId: 'subway-alerts', sourceUrl: 'https://api.mta.info/alerts', retrievedAt: DECISION_TIME,
    provenance: { sourceId: 'subway-alerts', sha256: 'b'.repeat(64) }, rawEvidence: {},
    gtfsRealtimeVersion: '2.0', incrementality: 'FULL_DATASET', feedTimestamp: DECISION_TIME,
    contentHash: 'b'.repeat(64), entityCount: 1,
    alerts: [{
      id: 'alert-maximal', evidenceId: 'alert-evidence', kind: 'system', officialText: 'MAXIMAL OFFICIAL ALERT'.repeat(64),
      rawOfficialText: 'MAXIMAL OFFICIAL ALERT'.repeat(64), description: null, rawDescription: null,
      language: 'en', cause: null, effect: 'SIGNIFICANT_DELAYS', activePeriods: [], informedEntities: [],
    }],
  };
}

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
