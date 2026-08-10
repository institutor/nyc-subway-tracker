import { createHash } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';

import { encodeCanonicalStringTuple } from '../../src/shared/domain/canonical';

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
      alertSourceRecord: acceptedAlertSource(),
      alertSnapshot: emptyAlertSnapshot(),
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
      snapshot: snapshot([stale]), sourceRecord: acceptedSource(), alertSnapshot: emptyAlertSnapshot(), decisionTime: DECISION_TIME,
      alertSourceRecord: acceptedAlertSource(),
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
      alertSourceRecord: failedAlertSource(), alertSnapshot: null, decisionTime: DECISION_TIME,
    })).toThrow(/source.*ownership|provenance.*join/i);
  });

  test('bounds a maximal 500-claim projection below the fixed encoded record ceiling without embedding alert text', async () => {
    const module = await import('../../src/server/services/shadow-validation') as any;
    const updates = Array.from({ length: 250 }, (_, index) => trip(`train-${index}`, true));
    const claims = module.projectShadowClaims({
      snapshot: snapshot(updates), sourceRecord: acceptedSource(), alertSnapshot: alertSnapshot(), decisionTime: DECISION_TIME,
      alertSourceRecord: acceptedAlertSource(),
    });
    expect(claims).toHaveLength(500);
    expect(Buffer.byteLength(JSON.stringify({ claims }), 'utf8')).toBeLessThanOrEqual(1_000_000);
    expect(JSON.stringify(claims)).not.toContain('MAXIMAL OFFICIAL ALERT');
    expect(claims.every((claim: any) => Object.keys(claim.decisions.admission).sort().join(',') === 'disposition,kind,reasonCode')).toBe(true);
  });

  test('exact-joins accepted alert provenance and rejects an unowned or stale alert snapshot', async () => {
    const module = await import('../../src/server/services/shadow-validation') as any;
    const accepted = module.projectShadowClaims({
      snapshot: snapshot([trip('train-alert', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: alertSnapshot(), alertSourceRecord: acceptedAlertSource(), decisionTime: DECISION_TIME,
    });
    expect(accepted.every((claim: any) => claim.decisions.serviceChange.alertContext
      && JSON.stringify(claim.decisions.serviceChange.alertContext) === JSON.stringify({
        state: 'accepted', sourceId: 'subway-alerts', observedAt: DECISION_TIME.toISOString(),
        retrievedAt: DECISION_TIME.toISOString(), sha256: 'b'.repeat(64),
        snapshotState: 'current', alertContextIdentity: sourceAlertIdentity(DECISION_TIME, DECISION_TIME),
      })
      && typeof claim.decisions.serviceChange.alertContext.alertContextIdentity === 'string')).toBe(true);
    expect(() => module.projectShadowClaims({
      snapshot: snapshot([trip('train-alert', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: alertSnapshot(), alertSourceRecord: { ...acceptedAlertSource(), sha256: 'c'.repeat(64) }, decisionTime: DECISION_TIME,
    })).toThrow(/alert.*ownership|alert.*provenance/i);

    const staleAt = new Date(DECISION_TIME.getTime() - 600_001);
    const staleSnapshot = alertSnapshot(staleAt, DECISION_TIME);
    expect(() => module.projectShadowClaims({
      snapshot: snapshot([trip('train-alert', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: staleSnapshot, alertSourceRecord: acceptedAlertSource(staleAt, DECISION_TIME), decisionTime: DECISION_TIME,
    })).not.toThrow();
    const staleClaims = module.projectShadowClaims({
      snapshot: snapshot([trip('train-alert', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: staleSnapshot, alertSourceRecord: acceptedAlertSource(staleAt, DECISION_TIME), decisionTime: DECISION_TIME,
    });
    expect(staleClaims.every((claim: any) => claim.decisions.serviceChange.disposition === 'quarantined'
      && claim.decisions.serviceChange.alertContext.snapshotState === 'stale'
      && claim.suppressionReasonCode === 'SERVICE_CHANGE_NOT_ELIGIBLE')).toBe(true);
  });

  test('keeps accepted alert evidence current at exactly ten minutes and quarantines it one millisecond later', async () => {
    const { projectShadowClaims } = await import('../../src/server/services/shadow-validation') as any;
    const boundary = new Date(DECISION_TIME.getTime() - 600_000);
    const current = projectShadowClaims({ snapshot: snapshot([trip('train-alert-boundary', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: alertSnapshot(boundary, DECISION_TIME), alertSourceRecord: acceptedAlertSource(boundary, DECISION_TIME), decisionTime: DECISION_TIME });
    expect(current.every((claim: any) => claim.decisions.serviceChange.alertContext.snapshotState === 'current'
      && claim.decisions.serviceChange.disposition === 'eligible')).toBe(true);
    const stale = new Date(boundary.getTime() - 1);
    const quarantined = projectShadowClaims({ snapshot: snapshot([trip('train-alert-stale', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: alertSnapshot(stale, DECISION_TIME), alertSourceRecord: acceptedAlertSource(stale, DECISION_TIME), decisionTime: DECISION_TIME });
    expect(quarantined.every((claim: any) => claim.decisions.serviceChange.alertContext.snapshotState === 'stale'
      && claim.decisions.serviceChange.disposition === 'quarantined')).toBe(true);
  });

  test('a failed canonical alert source cannot yield eligible service', async () => {
    const { projectShadowClaims } = await import('../../src/server/services/shadow-validation') as any;
    const claims = projectShadowClaims({
      snapshot: snapshot([trip('train-alert-failed', true)]), sourceRecord: acceptedSource(),
      alertSnapshot: null, alertSourceRecord: failedAlertSource(), decisionTime: DECISION_TIME,
    });
    expect(claims.every((claim: any) => claim.decisions.serviceChange.kind === 'quarantine-or-limitation'
      && claim.decisions.serviceChange.disposition === 'quarantined'
      && JSON.stringify(claim.decisions.serviceChange.alertContext) === JSON.stringify({
        state: 'failed', sourceId: 'subway-alerts', reasonCode: 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED',
      }))).toBe(true);
  });

  test('uses exact recent prior service-instance progress to admit through the existing arrival boundary', async () => {
    const admissionModule = await import('../../src/shared/domain/arrival-admission');
    const admissionSpy = vi.spyOn(admissionModule, 'admitArrivalCandidate');
    const { projectShadowClaims } = await import('../../src/server/services/shadow-validation') as any;
    const currentAt = new Date('2026-08-10T12:02:00.000Z');
    const currentTrip = trip('train-history', true, currentAt);
    currentTrip.remainingStopCalls = [
      { remainingOrder: 0, sourceStopSequence: 2, stopId: 'A16N', arrivalTime: new Date('2026-08-10T12:03:00.000Z'), departureTime: new Date('2026-08-10T12:03:10.000Z'), scheduleRelationship: null, scheduledTrack: '1', actualTrack: '1' },
    ];
    currentTrip.vehicleProgress!.currentStopSequence = 2;
    currentTrip.vehicleProgress!.stopId = 'A16N';
    const prior = priorRecordFor('train-history');
    const claims = projectShadowClaims({
      snapshot: snapshot([currentTrip], currentAt), sourceRecord: acceptedSource(currentAt),
      alertSnapshot: alertSnapshot(currentAt, currentAt), alertSourceRecord: acceptedAlertSource(currentAt, currentAt),
      priorRecord: prior, decisionTime: currentAt,
    });
    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({
      serviceDate: '20260810', serviceInstanceId: prior.claims[0].serviceInstanceId,
      targetStopCallIdentity: 'A16N\u0000sequence:2', disposition: 'admitted',
      decisions: { admission: { kind: 'admitted', disposition: 'admitted', reasonCode: 'GOVERNED_ADMISSION' } },
    });
    expect(JSON.stringify(claims[0])).not.toMatch(/supportedRange|identityDisposition|recoveryDisposition|movementDisposition/);
    expect(admissionSpy).toHaveBeenCalledWith(expect.objectContaining({
      serviceChangeGate: expect.objectContaining({ claimIdentity: expect.any(String), assessedAtMs: currentAt.getTime() }),
      serviceClaimId: expect.any(String),
    }), expect.objectContaining({
      serviceAssessmentAt: currentAt,
      serviceAlertContextIdentity: expect.any(String),
    }));
    const [admissionCandidate, admissionScope] = admissionSpy.mock.calls[0];
    expect(admissionScope.serviceAlertContextIdentity).toBe(admissionCandidate.serviceChangeGate?.alertContextIdentity);
    admissionSpy.mockRestore();
  });
});

function acceptedSource(moment = DECISION_TIME) {
  return {
    sourceId: 'subway-rt-ace', role: 'subway-realtime', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
    feedGroupId: 'subway-rt-ace', observedAt: moment.toISOString(), retrievedAt: moment.toISOString(), sha256: 'a'.repeat(64),
  };
}

function acceptedAlertSource(observed = DECISION_TIME, retrieved = observed) {
  return {
    sourceId: 'subway-alerts', role: 'subway-alerts', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
    observedAt: observed.toISOString(), retrievedAt: retrieved.toISOString(), sha256: 'b'.repeat(64),
  };
}

function failedAlertSource() {
  return { sourceId: 'subway-alerts', role: 'subway-alerts', outcome: 'failed', reasonCode: 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED' };
}

function alertSnapshot(observed = DECISION_TIME, retrieved = observed) {
  return {
    sourceId: 'subway-alerts', sourceUrl: 'https://api.mta.info/alerts', retrievedAt: retrieved,
    provenance: { sourceId: 'subway-alerts', sha256: 'b'.repeat(64) }, rawEvidence: {},
    gtfsRealtimeVersion: '2.0', incrementality: 'FULL_DATASET', feedTimestamp: observed,
    contentHash: 'b'.repeat(64), entityCount: 1,
    alerts: [{
      id: 'alert-maximal', evidenceId: 'alert-evidence', kind: 'system', officialText: 'MAXIMAL OFFICIAL ALERT'.repeat(64),
      rawOfficialText: 'MAXIMAL OFFICIAL ALERT'.repeat(64), description: null, rawDescription: null,
      language: 'en', cause: null, effect: 'SIGNIFICANT_DELAYS', activePeriods: [], informedEntities: [],
    }],
  };
}

function emptyAlertSnapshot(observed = DECISION_TIME, retrieved = observed) {
  return { ...alertSnapshot(observed, retrieved), entityCount: 0, alerts: [] };
}

function snapshot(tripUpdates: readonly any[], moment = DECISION_TIME) {
  return {
    sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace', sourceUrl: 'https://api.mta.info/feed',
    retrievedAt: moment,
    provenance: {
      sourceId: 'subway-rt-ace', sourceAuthority: 'MTA', sourceRole: 'subway-realtime',
      sourceUrl: 'https://api.mta.info/feed', retrievedAt: moment.toISOString(),
      finalUrl: 'https://api.mta.info/feed', redirectCount: 0,
      declaredContentType: 'application/x-protobuf', observedContentType: 'application/x-protobuf',
      declaredBytes: 100, receivedBytes: 100, sha256: 'a'.repeat(64),
    },
    rawEvidence: { evidenceId: `sha256:${'a'.repeat(64)}`, mediaType: 'application/x-protobuf', receivedBytes: 100, payloadBase64: 'AA==' },
    gtfsRealtimeVersion: '1.0', nyctSubwayVersion: '1.0', incrementality: 'FULL_DATASET',
    feedTimestamp: moment, contentHash: 'a'.repeat(64), entityCount: tripUpdates.length,
    coveredRouteIds: ['A'], tripReplacementPeriods: [], tripUpdates, vehiclePositions: [], embeddedTrainAlerts: [],
  };
}

function trip(trainInstanceId: string, movement: boolean, moment = DECISION_TIME) {
  return {
    entityId: trainInstanceId, evidenceId: `evidence-${trainInstanceId}`, trainInstanceId,
    trip: {
      tripId: `trip-${trainInstanceId}`, routeId: 'A', directionId: 0,
      startDate: '20260810', startTime: '12:00:00', nyct: { trainId: trainInstanceId },
    },
    updateTimestamp: moment,
    remainingStopCalls: [
      { remainingOrder: 0, sourceStopSequence: 1, stopId: 'A14N', arrivalTime: new Date(moment.getTime() + 60_000), departureTime: new Date(moment.getTime() + 70_000), scheduleRelationship: null, scheduledTrack: '1', actualTrack: '1' },
      { remainingOrder: 1, sourceStopSequence: 2, stopId: 'A16N', arrivalTime: new Date(moment.getTime() + 180_000), departureTime: new Date(moment.getTime() + 190_000), scheduleRelationship: null, scheduledTrack: '1', actualTrack: '1' },
    ],
    vehicleProgress: movement ? {
      entityId: `vehicle-${trainInstanceId}`, vehicleId: trainInstanceId, currentStopSequence: 1,
      stopId: 'A14N', currentStatus: 'IN_TRANSIT_TO', movementTimestamp: moment,
    } : null,
  };
}

function priorRecordFor(trainId: string) {
  const serviceIdentity = { tripId: `trip-${trainId}`, startDate: '20260810', startTime: '12:00:00', trainIdentity: trainId };
  const serviceInstanceId = `service:${createHash('sha256').update(encodeCanonicalStringTuple(Object.values(serviceIdentity))).digest('hex')}`;
  const claimKey = `claim:${createHash('sha256').update(encodeCanonicalStringTuple([
    'subway-rt-ace', trainId, '20260810', serviceInstanceId, 'A16N\u0000sequence:2',
  ])).digest('hex')}`;
  return {
    recordId: 'shadow-prior-history', decisionTime: DECISION_TIME.toISOString(), recordedAt: at(1).toISOString(),
    claims: [{
      claimKey, sourceId: 'subway-rt-ace', operationalTrainId: trainId, serviceDate: '20260810', serviceInstanceId, serviceIdentity,
      routeId: 'A', direction: 'northbound', terminalDestinationStopId: 'A16N',
      nextStopId: 'A14N', nextStopCallIdentity: 'A14N\u0000sequence:1', targetStopId: 'A16N', targetStopCallIdentity: 'A16N\u0000sequence:2',
      remainingStopCallIdentities: ['A14N\u0000sequence:1', 'A16N\u0000sequence:2'],
      observedAt: DECISION_TIME.toISOString(), disposition: 'suppressed',
    }],
  };
}

function sourceAlertIdentity(observed: Date, retrieved: Date) {
  return `alert-context:${createHash('sha256').update(encodeCanonicalStringTuple([
    'subway-alerts', observed.toISOString(), retrieved.toISOString(), 'b'.repeat(64),
  ])).digest('hex')}`;
}
