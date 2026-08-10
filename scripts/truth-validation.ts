import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SourceProvenance } from '../src/server/data/fetch-source';
import { createSourceRegistry, type RemoteSource } from '../src/server/data/source-registry';
import {
  decodeAlertSnapshotJson,
  type AlertSnapshot,
  type NormalizedAlert,
} from '../src/server/gtfs/alert-loader';
import type { NormalizedStopCall, NormalizedTripUpdate, RealtimeSnapshot } from '../src/server/gtfs/realtime-normalizer';
import { loadStaticGtfsArchive } from '../src/server/gtfs/static-loader';
import {
  isServiceActive,
  serviceTimeToInstant,
  type ServicePattern,
} from '../src/server/gtfs/static-normalizer';
import { evaluateExposure, type ExposureStage } from '../src/server/release/exposure-gates';
import {
  buildBoundedShadowRecord,
  canonicalShadowAlertContextIdentity,
  canonicalShadowClaimIdentity,
  canonicalShadowServiceInstance,
  compareShadowProgress,
  createShadowComparisonContext,
  validateShadowComparisonBinding,
  type ShadowProgressClaim,
  type ShadowProgressRecord,
  type ShadowServiceIdentity,
} from '../src/server/services/shadow-progress';
import { createSourceCoordinator } from '../src/server/services/source-coordinator';
import {
  admitArrivalCandidate,
  type ArrivalAdmissionCandidate,
  type ArrivalBoardScope,
} from '../src/shared/domain/arrival-admission';
import {
  classifyAlertSnapshot,
  type DeclaredServiceConsequence,
  type ServiceAlertEvidence,
  type ServiceClaimScope,
  type StructuredAlertEffect,
} from '../src/shared/domain/alert-scope';
import { FeedHealthGovernor, type FeedHealthDecision } from '../src/shared/domain/feed-health';
import { resolveRerouteClaim } from '../src/shared/domain/reroute';
import { buildScheduleFallback } from '../src/shared/domain/schedule-fallback';
import { ScheduleEditionRegistry } from '../src/shared/domain/schedule-owner';
import {
  CLAIM_SUPPRESSED_PRODUCTS,
  evaluateServiceChanges,
  type ServiceChangeDecision,
} from '../src/shared/domain/service-impact';
import type { NormalizedSnapshotEvidence } from '../src/shared/domain/snapshot-anomaly';

export const TRUTH_VALIDATION_SCENARIOS = Object.freeze([
  'normal-weekday',
  'weekend-planned-work',
  'late-night-midnight',
  'major-disruption',
  'later-stop-comparison',
  'route-group-bulk-drop',
  'false-bypass-incident-drill',
] as const);

export type TruthValidationScenario = typeof TRUTH_VALIDATION_SCENARIOS[number];

export interface TruthValidationCheck {
  readonly id: string;
  readonly result: 'pass' | 'fail';
  readonly reasonCode: string;
  readonly evidenceDigest: string;
}

export interface TruthValidationReceipt {
  readonly schemaVersion: 'truth-validation-receipt-v1';
  readonly validationMode: 'deterministic-zero-exposure';
  readonly artifactStatus: 'VALIDATION_ONLY';
  readonly fixtureEpoch: '2026-08-04';
  readonly scenario: TruthValidationScenario;
  readonly outcome: 'PASS' | 'FAIL';
  readonly gate0Decision: 'NO-GO';
  readonly riderExposure: false;
  readonly boardsExposed: false;
  readonly publicLocks: readonly {
    readonly stage: ExposureStage;
    readonly exposed: false;
    readonly reasonCode: string;
  }[];
  readonly counts: { readonly checks: number; readonly passed: number; readonly failed: number };
  readonly checks: readonly TruthValidationCheck[];
  readonly receiptDigest: string;
}

export interface TruthValidationBundle {
  readonly schemaVersion: 'truth-validation-bundle-v1';
  readonly outcome: 'PASS' | 'FAIL';
  readonly gate0Decision: 'NO-GO';
  readonly riderExposure: false;
  readonly boardsExposed: false;
  readonly counts: { readonly scenarios: number; readonly passed: number; readonly failed: number };
  readonly receipts: readonly TruthValidationReceipt[];
  readonly bundleDigest: string;
}

export interface TruthValidationIo {
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

export interface TruthFixtureOverrides {
  readonly weekdayRealtime?: Uint8Array;
  readonly weekdayAlerts?: Uint8Array;
  readonly weekendRegularGtfs?: Uint8Array;
  readonly weekendSupplementedGtfs?: Uint8Array;
  readonly weekendAlerts?: Uint8Array;
  readonly majorDisruptionAlerts?: Uint8Array;
  readonly falseBypassAlerts?: Uint8Array;
}

export interface TruthValidationOptions {
  readonly fixtureRoot?: string;
  readonly fixtureOverrides?: TruthFixtureOverrides;
}

const NORMAL_BASE = new Date('2026-08-04T06:01:00.000Z');
const DAY_BASE = new Date('2026-08-04T12:00:00.000Z');
const WEEKEND_BASE = new Date('2026-08-08T12:00:00.000Z');
const SHADOW_SHA256 = 'a'.repeat(64);
const DEFAULT_FIXTURE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures');

export async function runTruthValidationScenario(
  scenario: TruthValidationScenario,
  options: TruthValidationOptions = {},
): Promise<TruthValidationReceipt> {
  const fixtureRoot = options.fixtureRoot ?? DEFAULT_FIXTURE_ROOT;
  const checks = await scenarioChecks(scenario, fixtureRoot, options.fixtureOverrides ?? {});
  return finalizeReceipt(scenario, checks);
}

export async function runTruthValidationSuite(
  options: TruthValidationOptions = {},
): Promise<TruthValidationBundle> {
  const receipts: TruthValidationReceipt[] = [];
  for (const scenario of TRUTH_VALIDATION_SCENARIOS) {
    receipts.push(await runTruthValidationScenario(scenario, options));
  }
  const passed = receipts.filter((receipt) => receipt.outcome === 'PASS').length;
  const payload = {
    schemaVersion: 'truth-validation-bundle-v1' as const,
    outcome: (passed === receipts.length ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
    gate0Decision: 'NO-GO' as const,
    riderExposure: false as const,
    boardsExposed: false as const,
    counts: { scenarios: receipts.length, passed, failed: receipts.length - passed },
    receipts: Object.freeze(receipts),
  };
  return Object.freeze({ ...payload, bundleDigest: digestJson(payload) });
}

export async function runTruthValidationCli(
  argv: readonly string[],
  io: TruthValidationIo,
  options: TruthValidationOptions = {},
): Promise<number> {
  if (argv.length !== 1 || (argv[0] !== 'all' && !isScenario(argv[0]))) {
    io.stderr(`${JSON.stringify(errorReceipt('INVALID_VALIDATION_COMMAND'))}\n`);
    return 2;
  }
  try {
    const output = argv[0] === 'all'
      ? await runTruthValidationSuite(options)
      : await runTruthValidationScenario(argv[0], options);
    const passed = output.outcome === 'PASS';
    (passed ? io.stdout : io.stderr)(`${JSON.stringify(output)}\n`);
    return passed ? 0 : 1;
  } catch {
    io.stderr(`${JSON.stringify(errorReceipt('VALIDATION_EXECUTION_FAILED'))}\n`);
    return 1;
  }
}

async function scenarioChecks(
  scenario: TruthValidationScenario,
  fixtureRoot: string,
  overrides: TruthFixtureOverrides,
): Promise<readonly TruthValidationCheck[]> {
  switch (scenario) {
    case 'normal-weekday': return normalWeekdayChecks(fixtureRoot, overrides);
    case 'weekend-planned-work': return weekendPlannedWorkChecks(overrides);
    case 'late-night-midnight': return lateNightChecks(fixtureRoot);
    case 'major-disruption': return majorDisruptionChecks(fixtureRoot, overrides);
    case 'later-stop-comparison': return laterStopComparisonChecks();
    case 'route-group-bulk-drop': return routeGroupBulkDropChecks();
    case 'false-bypass-incident-drill': return falseBypassDrillChecks(fixtureRoot, overrides);
  }
}

async function normalWeekdayChecks(
  fixtureRoot: string,
  overrides: TruthFixtureOverrides,
): Promise<readonly TruthValidationCheck[]> {
  const { realtime, alerts } = await coordinatedFixtures(fixtureRoot, {
    realtimeBytes: overrides.weekdayRealtime,
    alertBytes: overrides.weekdayAlerts,
    retrievedAt: NORMAL_BASE.toISOString(),
  });
  const regular = await loadRegularFixture(fixtureRoot);
  const health = new FeedHealthGovernor().observe(realtime, NORMAL_BASE);
  const bound = deriveRealtimeArrivalFixture(realtime, alerts, NORMAL_BASE, health);
  const admission = admitArrivalCandidate(bound.candidate, bound.scope);

  return [
    check('coordinated-fixture-sources', realtime.entityCount === 5 && alerts.alerts.length === 2,
      'FIXTURE_SOURCES_ACCEPTED', {
        realtimeSource: realtime.sourceId,
        realtimeHash: realtime.contentHash,
        alertSource: alerts.sourceId,
        alertHash: alerts.contentHash,
      }),
    check('realtime-claim-binding', bound.bindingComplete,
      'ARRIVAL_SCOPE_DERIVED_FROM_NORMALIZED_REALTIME', {
        realtimeHash: realtime.contentHash,
        alertHash: alerts.contentHash,
        entityEvidenceId: bound.update.evidenceId,
        routeId: bound.claim.routeId,
        direction: bound.claim.direction,
        targetStopId: bound.claim.exactDirectionalStopId,
        tripId: bound.claim.tripId,
        trainId: bound.claim.trainId,
        destinationStopId: bound.destinationStopId,
      }),
    check('operating-service-date', isServiceActive(regular.data, 'WEEK', '20260804'),
      'OPERATING_SERVICE_ACTIVE', { serviceId: 'WEEK', serviceDate: '20260804', edition: regular.canonicalContentId }),
    check('current-feed-health', health.kind === 'current' && health.reasonCode === 'accepted-current',
      'FEED_CURRENT', health),
    check('governed-arrival-admission', admission.kind === 'admitted' && admission.confidence === 'live',
      'GOVERNED_LIVE_ADMISSION', admission),
  ];
}

async function weekendPlannedWorkChecks(
  overrides: TruthFixtureOverrides,
): Promise<readonly TruthValidationCheck[]> {
  const coverage = weekendCoverage();
  const regular = await loadStaticGtfsArchive(
    overrides.weekendRegularGtfs ?? weekendGtfsBytes('regular'),
    {
      source: 'regular-gtfs', retrievedAt: plusSeconds(WEEKEND_BASE, -7_200), coverage: [coverage],
      wrapper: { fixture: 'weekend-regular-v1' },
    },
  );
  const supplemented = await loadStaticGtfsArchive(
    overrides.weekendSupplementedGtfs ?? weekendGtfsBytes('supplemented'),
    {
      source: 'supplemented-gtfs', publishedAt: plusSeconds(WEEKEND_BASE, -7_100),
      retrievedAt: plusSeconds(WEEKEND_BASE, -7_000), sourceOrder: 1, coverage: [coverage],
      wrapper: { fixture: 'weekend-supplemented-v1' },
    },
  );
  const alerts = decodeFixtureAlerts(
    overrides.weekendAlerts ?? weekendAlertBytes(),
    plusSeconds(WEEKEND_BASE, -30),
  );
  const regularPattern = exactPattern(regular.data.servicePatterns, 'weekend regular');
  const supplementedPattern = exactPattern(supplemented.data.servicePatterns, 'weekend supplemented');
  if (regularPattern.routeId !== supplementedPattern.routeId || regularPattern.direction !== supplementedPattern.direction) {
    throw new Error('Weekend regular and supplemented pattern ownership join failed');
  }
  const omittedStops = regularPattern.stopIds.filter((stopId) => !supplementedPattern.stopIds.includes(stopId));
  if (omittedStops.length !== 1) throw new Error('Weekend supplemented pattern must own exactly one omitted stop');
  const targetStopId = omittedStops[0];
  const matchingAlert = exactAlertFor(alerts, {
    routeId: regularPattern.routeId, stopId: targetStopId, directionId: 0, effect: 'MODIFIED_SERVICE',
  }, 'weekend planned work');
  const reroute = resolveRerouteClaim({
    changeKind: 'reroute',
    planned: true,
    assessedAt: WEEKEND_BASE,
    alertScope: 'match',
    originalRoute: { id: regularPattern.routeId, label: regularPattern.routeId },
    direction: regularPattern.direction === 'northbound' ? 'northbound' : 'southbound',
    targetExactDirectionalStopId: targetStopId,
    originalDirectionalStopIds: regularPattern.stopIds,
    effectiveSupplementedPattern: {
      sourceId: supplemented.canonicalContentId,
      routeId: supplementedPattern.routeId,
      direction: supplementedPattern.direction === 'northbound' ? 'northbound' : 'southbound',
      orderedDirectionalStopIds: supplementedPattern.stopIds,
      provenance: {
        source: 'supplemented-gtfs', acceptance: 'accepted', currency: 'current',
        editionId: `supplemented-gtfs:${supplemented.canonicalContentId}`,
        canonicalContentId: supplemented.canonicalContentId,
        publishedAt: new Date(supplemented.publishedAt!),
        firstAcceptedRetrievedAt: new Date(supplemented.retrievedAt),
        observedAt: new Date(supplemented.retrievedAt),
        acceptedAt: new Date(supplemented.retrievedAt),
        sourceOrder: supplemented.sourceOrder!,
      },
    },
    liveRemainingStopIds: supplementedPattern.stopIds,
    pathEvidence: [],
  });
  const registry = new ScheduleEditionRegistry();
  const regularObservation = registry.observe(regular);
  const supplementObservation = registry.observe(supplemented);
  const fallback = buildScheduleFallback({
    feedDecision: {
      feedGroupId: 'subway-rt-bdfm', kind: 'unavailable', fallbackEligibility: 'eligible', presentation: 'none',
    },
    scope: {
      feedGroupId: 'subway-rt-bdfm', exactStopId: targetStopId, direction: regularPattern.direction,
      operationalAxis: regularPattern.direction, comparisonAt: plusSeconds(WEEKEND_BASE, -300),
      serviceDates: ['20260808'], routeIds: [regularPattern.routeId],
    },
    registry,
  });
  const fixtureBound = matchingAlert.evidenceId === alerts.rawEvidence.evidenceId
    && regularPattern.stopIds.includes(targetStopId)
    && !supplementedPattern.stopIds.includes(targetStopId)
    && isServiceActive(regular.data, 'WKND', '20260808')
    && isServiceActive(supplemented.data, 'WKND', '20260808');

  return [
    check('weekend-fixture-binding', fixtureBound,
      'PLANNED_WORK_SCOPE_BOUND_TO_NORMALIZED_FIXTURES', {
        regularEdition: regular.canonicalContentId,
        supplementedEdition: supplemented.canonicalContentId,
        alertHash: alerts.contentHash,
        alertEvidenceId: matchingAlert.evidenceId,
        routeId: regularPattern.routeId,
        direction: regularPattern.direction,
        targetStopId,
        serviceDate: '20260808',
      }),
    check('supplemented-owner', regularObservation.status === 'accepted-new'
      && supplementObservation.status === 'accepted-new'
      && fallback.source === 'supplemented-gtfs',
    'SUPPLEMENTED_SCHEDULE_OWNS_EXACT_SCOPE', {
      regularObservation, supplementObservation, fallbackSource: fallback.source,
      fallbackCurrency: fallback.currency,
    }),
    check('planned-stop-exclusion', reroute.kind === 'suppressed'
      && reroute.reason === 'original-stop-excluded-by-effective-pattern',
    'PLANNED_STOP_EXCLUDED', reroute),
    check('omitted-stop-board-empty', fallback.mode === 'scheduled-fallback'
      && fallback.rows.length === 0 && fallback.exclusions.length === 0,
    'SUPPLEMENT_MASK_PREVENTED_REGULAR_ARRIVAL', fallback),
  ];
}

async function lateNightChecks(fixtureRoot: string): Promise<readonly TruthValidationCheck[]> {
  const regular = await loadRegularFixture(fixtureRoot);
  const { realtime } = await coordinatedFixtures(fixtureRoot);
  const afterMidnight = regular.data.stopTimes.find((row) => row.tripId === 'after-midnight' && row.stopSequence === 1);
  const operatingInstant = serviceTimeToInstant('20260804', afterMidnight?.departureTime ?? 'invalid');
  const realtimeTrip = realtime.tripUpdates.find((trip) => trip.trip.startDate === '20260803');

  return [
    check('after-midnight-service-date', isServiceActive(regular.data, 'WEEK', '20260804')
      && operatingInstant.toISOString() === '2026-08-05T05:10:30.000Z',
    'SERVICE_DATE_RETAINED_AFTER_MIDNIGHT', {
      serviceDate: '20260804', operatingInstant: operatingInstant.toISOString(), serviceId: 'WEEK',
    }),
    check('gtfs-time-over-24-hours', afterMidnight?.departureTime === '25:10:30'
      && afterMidnight.departureSeconds === 90_630,
    'GTFS_TIME_OVER_24_HOURS_ACCEPTED', {
      departureTime: afterMidnight?.departureTime, departureSeconds: afterMidnight?.departureSeconds,
    }),
    check('realtime-service-date', realtimeTrip?.trip.startDate === '20260803'
      && realtime.feedTimestamp.toISOString().startsWith('2026-08-04'),
    'REALTIME_SERVICE_DATE_RETAINED', {
      serviceDate: realtimeTrip?.trip.startDate,
      feedTimestamp: realtime.feedTimestamp.toISOString(),
      trainIdentity: realtimeTrip?.trainInstanceId,
    }),
  ];
}

async function majorDisruptionChecks(
  fixtureRoot: string,
  overrides: TruthFixtureOverrides,
): Promise<readonly TruthValidationCheck[]> {
  const { realtime, alerts } = await coordinatedFixtures(fixtureRoot, {
    alertBytes: overrides.majorDisruptionAlerts ?? majorDisruptionAlertBytes(),
    retrievedAt: NORMAL_BASE.toISOString(),
  });
  const health = new FeedHealthGovernor().observe(realtime, NORMAL_BASE);
  const bound = deriveRealtimeArrivalFixture(realtime, alerts, NORMAL_BASE, health);
  const admission = admitArrivalCandidate(bound.candidate, bound.scope);
  const matchedAlert = findAlertFor(alerts, {
    routeId: bound.claim.routeId,
    stopId: bound.claim.exactDirectionalStopId,
    directionId: directionId(bound.claim.direction),
    effect: 'NO_SERVICE',
  });

  return [
    check('disruption-fixture-binding', bound.bindingComplete && matchedAlert !== null
      && matchedAlert.evidenceId === alerts.rawEvidence.evidenceId,
    'DISRUPTION_SCOPE_DERIVED_FROM_NORMALIZED_SOURCES', {
      realtimeHash: realtime.contentHash,
      alertHash: alerts.contentHash,
      alertEvidenceId: matchedAlert?.evidenceId,
      routeId: bound.claim.routeId,
      direction: bound.claim.direction,
      targetStopId: bound.claim.exactDirectionalStopId,
      tripId: bound.claim.tripId,
      trainId: bound.claim.trainId,
    }),
    check('resolved-service-suppression', bound.gate.kind === 'resolved-suppression'
      && bound.gate.disposition === 'resolved-ineligible', 'RESOLVED_MAJOR_DISRUPTION', bound.gate),
    check('dependent-product-containment', sameStrings(bound.gate.suppressedProducts, CLAIM_SUPPRESSED_PRODUCTS),
      'ALL_DEPENDENT_PRODUCTS_SUPPRESSED', bound.gate.suppressedProducts),
    check('arrival-claim-suppression', admission.kind === 'rejected'
      && admission.failedGate === 'service' && admission.boardTreatment === 'resolved-suppression',
    'ARRIVAL_NOT_ADMITTED', admission),
  ];
}

async function laterStopComparisonChecks(): Promise<readonly TruthValidationCheck[]> {
  const earlier = shadowRecord('shadow-replay-earlier', '2026-08-10T12:00:00.000Z', shadowClaim({
    observedAt: '2026-08-10T12:00:00.000Z',
    nextStopId: 'A12N',
    nextStopCallIdentity: stopCall('A12N', 1),
    remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2), stopCall('A16N', 3)],
  }));
  const laterBase = shadowRecordInput('shadow-replay-later', '2026-08-10T12:02:00.000Z', shadowClaim({
    observedAt: '2026-08-10T12:02:00.000Z',
    nextStopId: 'A14N',
    nextStopCallIdentity: stopCall('A14N', 2),
    remainingStopCallIdentities: [stopCall('A14N', 2), stopCall('A16N', 3)],
  }));
  const earlierBytes = JSON.stringify(earlier);
  const context = createShadowComparisonContext({
    earlier,
    earlierBytes,
    later: { ...laterBase, truncation: emptyTruncation() } as ShadowProgressRecord,
  });
  const provisional = buildBoundedShadowRecord({ ...laterBase, comparisonContext: context });
  const comparisons = compareShadowProgress(earlier, provisional);
  const later = buildBoundedShadowRecord({ ...laterBase, comparisonContext: context, progressComparisons: comparisons });
  validateShadowComparisonBinding(later, earlierBytes);
  const comparison = later.progressComparisons[0];

  return [
    check('bound-later-observation', later.comparisonContext?.intervalMilliseconds === 120_000
      && comparison?.earlierObservedAt === '2026-08-10T12:00:00.000Z'
      && comparison?.laterObservedAt === '2026-08-10T12:02:00.000Z',
    'LATER_OBSERVATION_EXACTLY_BOUND', {
      comparisonContext: later.comparisonContext,
      earlierObservedAt: comparison?.earlierObservedAt,
      laterObservedAt: comparison?.laterObservedAt,
    }),
    check('next-stop-advanced', comparison?.result === 'progressed'
      && comparison.reasonCode === 'NEXT_STOP_ADVANCED', 'NEXT_STOP_ADVANCED', comparison),
    check('disposition-transition', comparison?.dispositionTransition === 'suppressed-to-suppressed',
      'SUPPRESSED_TO_SUPPRESSED', comparison),
  ];
}

async function routeGroupBulkDropChecks(): Promise<readonly TruthValidationCheck[]> {
  const groupIds = officialRealtimeGroupIds();
  const checks: TruthValidationCheck[] = [
    check('official-route-group-inventory', groupIds.length === 7,
      'SEVEN_REQUIRED_SUBWAY_ROUTE_GROUPS', groupIds),
  ];
  let allUnrelatedCurrent = true;

  for (const affectedGroup of groupIds) {
    const governor = new FeedHealthGovernor();
    for (const groupId of groupIds) governor.observe(snapshot(groupId, 0, 100), DAY_BASE);
    const affected = governor.observe(snapshot(affectedGroup, 30, 60), plusSeconds(DAY_BASE, 30));
    const unrelated = groupIds
      .filter((groupId) => groupId !== affectedGroup)
      .map((groupId) => governor.assess(groupId, plusSeconds(DAY_BASE, 30)));
    allUnrelatedCurrent &&= unrelated.every((decision) => decision.kind === 'current');
    checks.push(check(`${affectedGroup}-bulk-drop`, affected.kind === 'unavailable'
      && affected.reasonCode === 'bulk-population-loss'
      && affected.lastGood?.entityCount === 100,
    'BULK_POPULATION_LOSS_AT_40_PERCENT', {
      affectedGroup,
      kind: affected.kind,
      reasonCode: affected.reasonCode,
      lastGoodCount: affected.lastGood?.entityCount,
      candidateCount: 60,
    }));
  }
  checks.push(check('unrelated-group-isolation', allUnrelatedCurrent,
    'UNAFFECTED_GROUPS_REMAIN_CURRENT', { groupIds, testedAffectedGroups: groupIds.length }));
  return checks;
}

async function falseBypassDrillChecks(
  fixtureRoot: string,
  overrides: TruthFixtureOverrides,
): Promise<readonly TruthValidationCheck[]> {
  const originalAt = new Date('2026-08-04T06:00:30.000Z');
  const incidentAt = NORMAL_BASE;
  const originalSources = await coordinatedFixtures(fixtureRoot, { retrievedAt: originalAt.toISOString() });
  const incidentSources = await coordinatedFixtures(fixtureRoot, {
    alertBytes: overrides.falseBypassAlerts ?? falseBypassAlertBytes(),
    retrievedAt: incidentAt.toISOString(),
  });
  const originalHealth = new FeedHealthGovernor().observe(originalSources.realtime, originalAt);
  const incidentHealth = new FeedHealthGovernor().observe(incidentSources.realtime, incidentAt);
  const originalBound = deriveRealtimeArrivalFixture(
    originalSources.realtime, originalSources.alerts, originalAt, originalHealth,
  );
  const incidentBound = deriveRealtimeArrivalFixture(
    incidentSources.realtime, incidentSources.alerts, incidentAt, incidentHealth,
  );
  const original = admitArrivalCandidate(originalBound.candidate, originalBound.scope);
  const contained = admitArrivalCandidate(incidentBound.candidate, incidentBound.scope);
  const matchedAlert = findAlertFor(incidentSources.alerts, {
    routeId: incidentBound.claim.routeId,
    stopId: incidentBound.claim.exactDirectionalStopId,
    directionId: directionId(incidentBound.claim.direction),
    effect: 'NO_SERVICE',
  });
  const sameOperationalClaim = originalSources.realtime.contentHash === incidentSources.realtime.contentHash
    && originalBound.claim.routeId === incidentBound.claim.routeId
    && originalBound.claim.exactDirectionalStopId === incidentBound.claim.exactDirectionalStopId
    && originalBound.claim.direction === incidentBound.claim.direction
    && originalBound.claim.tripId === incidentBound.claim.tripId
    && originalBound.claim.trainId === incidentBound.claim.trainId
    && originalBound.destinationStopId === incidentBound.destinationStopId;

  return [
    check('incident-fixture-binding', sameOperationalClaim && originalBound.bindingComplete
      && incidentBound.bindingComplete && matchedAlert?.evidenceId === incidentSources.alerts.rawEvidence.evidenceId,
    'INCIDENT_TIMELINE_BOUND_TO_NORMALIZED_SOURCES', {
      originalRealtimeHash: originalSources.realtime.contentHash,
      originalAlertHash: originalSources.alerts.contentHash,
      incidentRealtimeHash: incidentSources.realtime.contentHash,
      incidentAlertHash: incidentSources.alerts.contentHash,
      incidentAlertEvidenceId: matchedAlert?.evidenceId,
      routeId: incidentBound.claim.routeId,
      direction: incidentBound.claim.direction,
      targetStopId: incidentBound.claim.exactDirectionalStopId,
      tripId: incidentBound.claim.tripId,
      trainId: incidentBound.claim.trainId,
    }),
    check('original-admission-reconstruction', original.kind === 'admitted',
      'ORIGINAL_DECISION_RECONSTRUCTED', original),
    check('current-bypass-veto', contained.kind === 'rejected'
      && contained.failedGate === 'service' && contained.boardTreatment === 'resolved-suppression',
    'RESOLVED_SERVICE_VETO_BLOCKED_ARRIVAL', contained),
    check('containment-product-scope', sameStrings(incidentBound.gate.suppressedProducts, CLAIM_SUPPRESSED_PRODUCTS),
      'FALSE_BYPASS_DEPENDENCIES_CONTAINED', incidentBound.gate.suppressedProducts),
    check('zero-exposure-incident-path', contained.kind === 'rejected'
      && allPublicLocksClosed(), 'POTENTIAL_FALSE_BYPASS_CONTAINED_IN_VALIDATION', {
        candidateDisposition: contained.kind,
        gate0Decision: 'NO-GO',
        riderExposure: false,
        incidentDisposition: 'OPEN_FOR_GOVERNED_REVIEW',
      }),
  ];
}

function finalizeReceipt(
  scenario: TruthValidationScenario,
  scenarioChecks: readonly TruthValidationCheck[],
): TruthValidationReceipt {
  const exposure = evaluateExposure({ mode: 'validation' });
  const publicLocks = Object.entries(exposure.public).map(([stage, decision]) => Object.freeze({
    stage: stage as ExposureStage,
    exposed: decision.exposed,
    reasonCode: decision.reasonCode,
  }));
  const lockCheck = check('public-exposure-locks', publicLocks.length === 9
    && publicLocks.every((lock) => lock.exposed === false)
    && exposure.diagnostics.riderExposure === false,
  'ALL_PUBLIC_EXPOSURE_LOCKS_CLOSED', publicLocks);
  const checks = Object.freeze([...scenarioChecks, lockCheck]);
  const passed = checks.filter((item) => item.result === 'pass').length;
  const payload = {
    schemaVersion: 'truth-validation-receipt-v1' as const,
    validationMode: 'deterministic-zero-exposure' as const,
    artifactStatus: 'VALIDATION_ONLY' as const,
    fixtureEpoch: '2026-08-04' as const,
    scenario,
    outcome: (passed === checks.length ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
    gate0Decision: 'NO-GO' as const,
    riderExposure: false as const,
    boardsExposed: false as const,
    publicLocks: Object.freeze(publicLocks),
    counts: { checks: checks.length, passed, failed: checks.length - passed },
    checks,
  };
  const receipt = Object.freeze({ ...payload, receiptDigest: digestJson(payload) });
  if (Buffer.byteLength(JSON.stringify(receipt), 'utf8') > 32_768) {
    throw new Error('Truth validation receipt exceeds byte limit');
  }
  return receipt;
}

function check(id: string, passed: boolean, reasonCode: string, evidence: unknown): TruthValidationCheck {
  return Object.freeze({
    id,
    result: passed ? 'pass' : 'fail',
    reasonCode,
    evidenceDigest: digestStable(evidence),
  });
}

async function coordinatedFixtures(
  fixtureRoot: string,
  options: {
    readonly realtimeBytes?: Uint8Array;
    readonly alertBytes?: Uint8Array;
    readonly retrievedAt?: string;
  } = {},
) {
  const realtimeBytes = options.realtimeBytes
    ?? await readFile(join(fixtureRoot, 'realtime', 'current.pb'));
  const alertBytes = options.alertBytes
    ?? await readFile(join(fixtureRoot, 'alerts', 'subway-alerts.json'));
  const retrievedAt = options.retrievedAt ?? NORMAL_BASE.toISOString();
  const registry = createSourceRegistry({});
  const realtimeSource = requiredRemote(registry, 'subway-rt-ace');
  const alertSource = requiredRemote(registry, 'subway-alerts');
  const coordinator = createSourceCoordinator({
    realtimeGroups: [realtimeSource],
    alertSource,
    retrieve: async (source) => {
      const json = source.id === 'subway-alerts';
      const bytes = json ? alertBytes : realtimeBytes;
      return { bytes, provenance: fixtureProvenance(source, bytes, json, retrievedAt) };
    },
  });
  await coordinator.refreshAll();
  const realtime = coordinator.getRealtimeSnapshot('subway-rt-ace');
  const alerts = coordinator.getAlertSnapshot();
  if (!realtime || !alerts || coordinator.getLastError('subway-rt-ace') || coordinator.getLastError('subway-alerts')) {
    throw new Error('Deterministic coordinated source validation failed');
  }
  return { realtime, alerts };
}

async function loadRegularFixture(fixtureRoot: string) {
  return loadStaticGtfsArchive(await readFile(join(fixtureRoot, 'gtfs', 'regular.zip')), {
    source: 'regular-gtfs',
    retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
    coverage: [scheduleCoverage('regular-all')],
    wrapper: { filename: 'regular.zip' },
  });
}

function scheduleCoverage(id: string) {
  return {
    id,
    routeIds: ['A', 'B'],
    serviceDates: ['20260803', '20260804', '20260808'],
    effectiveFrom: '2026-08-03T04:00:00.000Z',
    effectiveUntil: '2026-08-09T04:00:00.000Z',
    directions: ['northbound', 'southbound'] as const,
  };
}

function fixtureProvenance(
  source: RemoteSource,
  bytes: Uint8Array,
  json: boolean,
  retrievedAt = NORMAL_BASE.toISOString(),
): SourceProvenance {
  const mediaType = json ? 'application/json' : 'application/x-protobuf';
  return Object.freeze({
    sourceId: source.id,
    sourceAuthority: source.authority,
    sourceRole: source.role,
    sourceUrl: source.url,
    retrievedAt,
    finalUrl: source.url,
    redirectCount: 0,
    declaredContentType: mediaType,
    observedContentType: mediaType,
    declaredBytes: bytes.byteLength,
    receivedBytes: bytes.byteLength,
    sha256: sha256Hex(bytes),
  });
}

function requiredRemote(registry: ReturnType<typeof createSourceRegistry>, id: string): RemoteSource {
  const source = registry.find((candidate): candidate is RemoteSource => candidate.kind === 'remote' && candidate.id === id);
  if (!source) throw new Error(`Required deterministic source ${id} is absent`);
  return source;
}

function deriveRealtimeArrivalFixture(
  realtime: RealtimeSnapshot,
  alerts: AlertSnapshot,
  decisionAt: Date,
  health: FeedHealthDecision,
): {
  readonly update: NormalizedTripUpdate;
  readonly target: NormalizedStopCall;
  readonly destinationStopId: string;
  readonly claim: ServiceClaimScope;
  readonly gate: ServiceChangeDecision;
  readonly candidate: ArrivalAdmissionCandidate;
  readonly scope: ArrivalBoardScope;
  readonly bindingComplete: boolean;
} {
  const candidates = realtime.tripUpdates.flatMap((update) => {
    const direction = directionFromTrip(update);
    const movement = update.vehicleProgress;
    if (!direction || !update.trip.routeId || !update.trip.tripId || !movement?.movementTimestamp) return [];
    return update.remainingStopCalls
      .filter((call) => {
        const event = stopEvent(call);
        return event !== null && event.getTime() > decisionAt.getTime()
          && call.scheduledTrack !== null && call.actualTrack === call.scheduledTrack
          && movement.stopId === call.stopId
          && movement.movementTimestamp!.getTime() <= decisionAt.getTime()
          && decisionAt.getTime() - movement.movementTimestamp!.getTime() <= 90_000;
      })
      .map((target) => ({ update, target, direction }));
  });
  if (candidates.length !== 1) throw new Error('Normalized realtime fixture must own exactly one admissible claim');
  const { update, target, direction } = candidates[0];
  const destinationStopId = update.remainingStopCalls.at(-1)?.stopId;
  const eventAt = stopEvent(target);
  if (!destinationStopId || !eventAt) throw new Error('Normalized realtime fixture has no exact terminal or event');
  const claimId = `fixture-claim:${sha256Hex(stableJson([
    realtime.contentHash, update.trainInstanceId, update.trip.tripId, target.stopId, direction,
  ]))}`;
  const claim: ServiceClaimScope = {
    claimId,
    routeId: update.trip.routeId!,
    exactDirectionalStopId: target.stopId,
    constituentStopId: target.stopId.replace(/[NSEW]$/u, ''),
    direction,
    tripId: update.trip.tripId,
    trainId: update.trainInstanceId,
  };
  const gate = evaluateServiceChanges({ snapshot: classifiedAlertFixture(alerts, decisionAt), claim });
  const candidate: ArrivalAdmissionCandidate = {
    stableTrainIdentity: update.trainInstanceId,
    publishedTripId: update.trip.tripId,
    patternIdentity: `fixture-pattern:${sha256Hex(stableJson(update.remainingStopCalls.map((call) => ({
      stopId: call.stopId, remainingOrder: call.remainingOrder, sourceStopSequence: call.sourceStopSequence,
    }))))}`,
    feedGroupId: realtime.feedGroupId,
    route: { id: update.trip.routeId!, label: update.trip.routeId! },
    routeOrderKind: /^\d/u.test(update.trip.routeId!) ? 'numbered' : 'lettered',
    direction,
    destination: destinationStopId,
    remainingStopCalls: update.remainingStopCalls.map((call) => ({
      stopId: call.stopId,
      sourceStopSequence: call.sourceStopSequence,
      occurrenceId: call.sourceStopSequence === null ? `${update.entityId}:${call.remainingOrder}` : null,
      arrivalAt: call.arrivalTime,
      departureAt: call.departureTime,
      scheduleRelationship: call.scheduleRelationship,
    })),
    serviceChangeGate: gate,
    serviceClaimId: claimId,
    serviceDisposition: gate.disposition,
    trackDisposition: target.actualTrack === target.scheduledTrack && target.actualTrack !== null ? 'eligible' : 'quarantined',
    freshness: health.kind,
    identityDisposition: 'coherent',
    recoveryDisposition: 'live-continuity',
    movementDisposition: 'plausible',
    confidence: { kind: 'live', supportedRange: { startsAt: eventAt, endsAt: eventAt } },
    provenance: {
      source: 'gtfs-rt', sourceId: realtime.sourceId,
      observedAt: realtime.feedTimestamp, retrievedAt: realtime.retrievedAt,
      version: realtime.contentHash,
    },
  };
  const scope: ArrivalBoardScope = {
    feedGroupId: realtime.feedGroupId,
    exactStopId: target.stopId,
    direction,
    destination: destinationStopId,
    comparisonAt: decisionAt,
    serviceAssessmentAt: decisionAt,
    serviceAlertContextIdentity: gate.alertContextIdentity,
  };
  const bindingComplete = update.evidenceId === realtime.rawEvidence.evidenceId
    && realtime.contentHash === realtime.rawEvidence.evidenceId
    && alerts.contentHash === alerts.rawEvidence.evidenceId
    && claim.routeId === candidate.route.id
    && claim.exactDirectionalStopId === scope.exactStopId
    && claim.direction === candidate.direction
    && claim.tripId === candidate.publishedTripId
    && claim.trainId === candidate.stableTrainIdentity
    && target.stopId === update.vehicleProgress?.stopId
    && target.actualTrack !== null && target.actualTrack === target.scheduledTrack
    && gate.evaluatedClaim.claimId === claimId;
  return { update, target, destinationStopId, claim, gate, candidate, scope, bindingComplete };
}

function classifiedAlertFixture(snapshot: AlertSnapshot, assessedAt: Date) {
  if (snapshot.sourceId !== 'subway-alerts' || snapshot.contentHash !== snapshot.rawEvidence.evidenceId
    || snapshot.provenance.sha256 !== snapshot.contentHash.replace(/^sha256:/u, '')) {
    throw new Error('Normalized alert fixture provenance join failed');
  }
  return classifyAlertSnapshot({
    status: 'accepted',
    feedTimestamp: snapshot.feedTimestamp,
    retrievedAt: snapshot.retrievedAt,
    alerts: snapshot.alerts.map(serviceAlertFromNormalized),
  }, assessedAt);
}

function serviceAlertFromNormalized(alert: NormalizedAlert): ServiceAlertEvidence {
  return {
    alertId: alert.id,
    activePeriods: alert.activePeriods,
    selectors: alert.informedEntities.map((entity, index) => ({
      selectorId: `${alert.id}:${index}`,
      ...(entity.routeId === null ? {} : { routeId: entity.routeId }),
      ...(entity.stopId === null ? {} : { exactDirectionalStopId: entity.stopId }),
      ...(entity.directionId === null ? {} : { direction: directionFromId(entity.directionId) }),
      ...(entity.trip?.tripId ? { tripId: entity.trip.tripId } : {}),
      ...(entity.trip?.nyct.trainId ? { trainId: entity.trip.nyct.trainId } : {}),
    })),
    structuredEffect: structuredEffectFromNormalized(alert.effect),
    declaredConsequence: declaredConsequenceFromNormalized(alert.effect),
    official: { headerRaw: alert.rawOfficialText, descriptionRaw: alert.rawDescription ?? '' },
  };
}

function structuredEffectFromNormalized(effect: string | null): StructuredAlertEffect {
  return ['NO_SERVICE', 'MODIFIED_SERVICE', 'SIGNIFICANT_DELAYS', 'ACCESSIBILITY_ISSUE', 'UNKNOWN_EFFECT']
    .includes(String(effect)) ? effect as StructuredAlertEffect : 'OTHER_EFFECT';
}

function declaredConsequenceFromNormalized(effect: string | null): DeclaredServiceConsequence {
  if (effect === 'NO_SERVICE') return 'full-suspension';
  if (effect === 'SIGNIFICANT_DELAYS') return 'delay-only';
  if (effect === 'ACCESSIBILITY_ISSUE') return 'entrance-equipment';
  return 'generic-affected';
}

function directionFromTrip(update: NormalizedTripUpdate): 'northbound' | 'southbound' | null {
  if (update.trip.nyct.direction === 'NORTH') return 'northbound';
  if (update.trip.nyct.direction === 'SOUTH') return 'southbound';
  return directionFromId(update.trip.directionId) ?? null;
}

function directionFromId(value: number | null): 'northbound' | 'southbound' | undefined {
  return value === 0 ? 'northbound' : value === 1 ? 'southbound' : undefined;
}

function directionId(value: ServiceClaimScope['direction']): number {
  if (value === 'northbound') return 0;
  if (value === 'southbound') return 1;
  throw new Error('Fixture requires a northbound or southbound direction');
}

function stopEvent(call: NormalizedStopCall): Date | null {
  return call.departureTime ?? call.arrivalTime;
}

function findAlertFor(
  snapshot: AlertSnapshot,
  expected: { readonly routeId: string; readonly stopId: string; readonly directionId: number; readonly effect: string },
): NormalizedAlert | null {
  const matches = snapshot.alerts.filter((alert) => alert.effect === expected.effect
    && alert.informedEntities.some((entity) => entity.routeId === expected.routeId
      && entity.stopId === expected.stopId && entity.directionId === expected.directionId));
  return matches.length === 1 ? matches[0] : null;
}

function exactAlertFor(
  snapshot: AlertSnapshot,
  expected: { readonly routeId: string; readonly stopId: string; readonly directionId: number; readonly effect: string },
  label: string,
): NormalizedAlert {
  const alert = findAlertFor(snapshot, expected);
  if (!alert) throw new Error(`${label} alert scope and consequence join failed`);
  return alert;
}

function decodeFixtureAlerts(bytes: Uint8Array, retrievedAt: Date): AlertSnapshot {
  const source = requiredRemote(createSourceRegistry({}), 'subway-alerts');
  return decodeAlertSnapshotJson(bytes, {
    provenance: fixtureProvenance(source, bytes, true, retrievedAt.toISOString()),
  });
}

function majorDisruptionAlertBytes(): Uint8Array {
  return alertFixtureBytes({
    id: 'major-a-suspension', feedTimestamp: plusSeconds(NORMAL_BASE, -60), routeId: 'A', stopId: 'A24S',
    directionId: 1, effect: 'NO_SERVICE', header: 'A service is suspended', description: 'No A trains are running.',
  });
}

function falseBypassAlertBytes(): Uint8Array {
  return alertFixtureBytes({
    id: 'false-bypass-a24s', feedTimestamp: NORMAL_BASE, routeId: 'A', stopId: 'A24S', directionId: 1,
    effect: 'NO_SERVICE', header: 'A service is suspended', description: 'No A trains are running.',
  });
}

function weekendAlertBytes(): Uint8Array {
  return alertFixtureBytes({
    id: 'weekend-f-reroute', feedTimestamp: plusSeconds(WEEKEND_BASE, -60), routeId: 'F', stopId: 'D17N',
    directionId: 0, effect: 'MODIFIED_SERVICE', header: 'F trains are rerouted',
    description: 'F trains follow the supplemented stopping pattern.',
  });
}

function alertFixtureBytes(input: {
  readonly id: string;
  readonly feedTimestamp: Date;
  readonly routeId: string;
  readonly stopId: string;
  readonly directionId: number;
  readonly effect: string;
  readonly header: string;
  readonly description: string;
}): Uint8Array {
  const timestamp = Math.trunc(input.feedTimestamp.getTime() / 1_000);
  return new TextEncoder().encode(JSON.stringify({
    header: { gtfsRealtimeVersion: '2.0', incrementality: 'FULL_DATASET', timestamp },
    entity: [{
      id: input.id,
      alert: {
        activePeriod: [{ start: timestamp - 300, end: timestamp + 3_600 }],
        informedEntity: [{ routeId: input.routeId, stopId: input.stopId, directionId: input.directionId }],
        cause: 'CONSTRUCTION',
        effect: input.effect,
        headerText: { translation: [{ text: input.header, language: 'en' }] },
        descriptionText: { translation: [{ text: input.description, language: 'en' }] },
      },
    }],
  }));
}

function exactPattern(
  patterns: readonly ServicePattern[],
  label: string,
): ServicePattern {
  if (patterns.length !== 1 || patterns[0].stopIds.length === 0) {
    throw new Error(`${label} fixture requires one exact nonempty pattern`);
  }
  return patterns[0];
}

function weekendCoverage() {
  return {
    id: 'weekend-f-20260808',
    routeIds: ['F'],
    serviceDates: ['20260808'],
    effectiveFrom: '2026-08-08T04:00:00.000Z',
    effectiveUntil: '2026-08-09T04:00:00.000Z',
    directions: ['northbound'] as const,
  };
}

function weekendGtfsBytes(kind: 'regular' | 'supplemented'): Uint8Array {
  const tripId = kind === 'regular' ? 'f-weekend-regular' : 'f-weekend-supplemented';
  const calls = kind === 'regular'
    ? [
        `${tripId},10:00:00,10:00:00,D15N,1`,
        `${tripId},10:05:00,10:05:00,D17N,2`,
        `${tripId},10:10:00,10:10:00,D18N,3`,
      ]
    : [
        `${tripId},10:00:00,10:00:00,D15N,1`,
        `${tripId},10:10:00,10:10:00,D18N,2`,
      ];
  return buildStoredZip(Object.entries({
    'agency.txt': 'agency_id,agency_name,agency_url,agency_timezone\nMTA,Fixture Transit,https://example.test,America/New_York\n',
    'stops.txt': [
      'stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station',
      'D15,Origin,40.70,-74.00,1,', 'D15N,Origin northbound,40.70,-74.00,0,D15',
      'D17,Bypassed,40.71,-73.99,1,', 'D17N,Bypassed northbound,40.71,-73.99,0,D17',
      'D18,Destination,40.72,-73.98,1,', 'D18N,Destination northbound,40.72,-73.98,0,D18', '',
    ].join('\n'),
    'routes.txt': 'route_id,agency_id,route_short_name,route_long_name,route_type\nF,MTA,F,Weekend fixture,1\n',
    'trips.txt': `route_id,service_id,trip_id,trip_headsign,direction_id,shape_id\nF,WKND,${tripId},Uptown,0,\n`,
    'stop_times.txt': ['trip_id,arrival_time,departure_time,stop_id,stop_sequence', ...calls, ''].join('\n'),
    'calendar.txt': 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nWKND,0,0,0,0,0,1,0,20260801,20260831\n',
  }));
}

function buildStoredZip(entries: ReadonlyArray<readonly [string, string]>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const [name, value] of entries) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(value);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);
    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    offset += local.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return concatBytes([...localParts, ...centralParts, end]);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function shadowRecord(recordId: string, observedAt: string, claim: ShadowProgressClaim): ShadowProgressRecord {
  return buildBoundedShadowRecord(shadowRecordInput(recordId, observedAt, claim));
}

function shadowRecordInput(recordId: string, observedAt: string, claim: ShadowProgressClaim) {
  return {
    schemaVersion: 'shadow-v2' as const,
    recordId,
    mode: 'shadow' as const,
    recordedAt: new Date(Date.parse(observedAt) + 1_000).toISOString(),
    decisionTime: observedAt,
    riderExposure: false as const,
    boardsExposed: false as const,
    outcome: 'COMPLETED' as const,
    sources: shadowSources(observedAt),
    gates: Object.entries(evaluateExposure({ mode: 'shadow' }).public).map(([stage, gate]) => ({ stage, ...gate })),
    comparisonContext: null,
    claims: [claim],
    progressComparisons: [],
  };
}

function shadowClaim(overrides: Partial<ShadowProgressClaim>): ShadowProgressClaim {
  const observedAt = overrides.observedAt ?? '2026-08-10T12:00:00.000Z';
  const serviceIdentity: ShadowServiceIdentity = {
    tripId: 'trip-1', startDate: '20260810', startTime: '12:00:00', trainIdentity: 'train-1',
  };
  const serviceInstanceId = canonicalShadowServiceInstance(serviceIdentity);
  const targetStopCallIdentity = stopCall('A16N', 3);
  const identity = canonicalShadowClaimIdentity([
    'subway-rt-ace', 'train-1', '20260810', serviceInstanceId, targetStopCallIdentity,
  ]);
  const alertContextIdentity = canonicalShadowAlertContextIdentity({
    sourceId: 'subway-alerts', observedAt, retrievedAt: observedAt, sha256: SHADOW_SHA256,
  });
  return {
    ...identity,
    sourceId: 'subway-rt-ace',
    observedAt,
    operationalTrainId: 'train-1',
    serviceDate: '20260810',
    serviceInstanceId,
    serviceIdentity,
    routeId: 'A',
    direction: 'northbound',
    terminalDestinationStopId: 'A16N',
    nextStopId: 'A12N',
    nextStopCallIdentity: stopCall('A12N', 1),
    targetStopId: 'A16N',
    targetStopCallIdentity,
    remainingStopCallIdentities: [stopCall('A12N', 1), stopCall('A14N', 2), targetStopCallIdentity],
    decisionTime: observedAt,
    disposition: 'suppressed',
    suppressionReasonCode: 'TRUSTED_HISTORY_UNAVAILABLE',
    provenance: {
      source: 'gtfs-rt', sourceId: 'subway-rt-ace', feedGroupId: 'subway-rt-ace',
      observedAt, retrievedAt: observedAt, sha256: SHADOW_SHA256,
    },
    decisions: {
      feedHealth: { kind: 'current', reasonCode: 'accepted-current' },
      serviceChange: {
        kind: 'eligible-context', disposition: 'eligible',
        alertContext: {
          state: 'accepted', sourceId: 'subway-alerts', observedAt, retrievedAt: observedAt,
          sha256: SHADOW_SHA256, snapshotState: 'current', alertContextIdentity,
        },
      },
      admission: { kind: 'rejected', disposition: 'suppressed', reasonCode: 'TRUSTED_HISTORY_UNAVAILABLE' },
    },
    ...overrides,
  };
}

function shadowSources(observedAt: string): readonly Record<string, unknown>[] {
  return Object.freeze([
    ...officialRealtimeGroupIds().map((sourceId) => ({
      sourceId, role: 'subway-realtime', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
      feedGroupId: sourceId, observedAt, retrievedAt: observedAt, sha256: SHADOW_SHA256,
    })),
    {
      sourceId: 'subway-alerts', role: 'subway-alerts', outcome: 'accepted', reasonCode: 'SOURCE_ACCEPTED',
      observedAt, retrievedAt: observedAt, sha256: SHADOW_SHA256,
    },
  ]);
}

function emptyTruncation() {
  return {
    claims: { consideredCount: 1, includedCount: 1, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' as const },
    comparisons: { consideredCount: 0, includedCount: 0, omittedCount: 0, reasonCode: 'NOT_TRUNCATED' as const },
  };
}

function officialRealtimeGroupIds(): readonly string[] {
  return Object.freeze(createSourceRegistry({})
    .filter((source): source is RemoteSource => source.kind === 'remote' && source.role === 'subway-realtime' && source.required)
    .map((source) => source.id));
}

function snapshot(groupId: string, seconds: number, entityCount: number): NormalizedSnapshotEvidence {
  const at = plusSeconds(DAY_BASE, seconds);
  return {
    sourceId: groupId,
    feedGroupId: groupId,
    feedTimestamp: at,
    retrievedAt: at,
    contentHash: `${groupId}-${seconds}-${entityCount}`,
    entityCount,
    coveredRouteIds: [groupId],
  };
}

function allPublicLocksClosed(): boolean {
  return Object.values(evaluateExposure({ mode: 'validation' }).public).every((decision) => decision.exposed === false);
}

function stopCall(stopId: string, sequence: number): string {
  return `${stopId}\u0000sequence:${sequence}`;
}

function plusSeconds(at: Date, seconds: number): Date {
  return new Date(at.getTime() + seconds * 1_000);
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sha256Hex(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function digestJson(value: unknown): string {
  return `sha256:${sha256Hex(JSON.stringify(value))}`;
}

function digestStable(value: unknown): string {
  return `sha256:${sha256Hex(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function isScenario(value: string): value is TruthValidationScenario {
  return (TRUTH_VALIDATION_SCENARIOS as readonly string[]).includes(value);
}

function errorReceipt(reasonCode: 'INVALID_VALIDATION_COMMAND' | 'VALIDATION_EXECUTION_FAILED') {
  return {
    schemaVersion: 'truth-validation-error-v1',
    outcome: 'FAIL',
    gate0Decision: 'NO-GO',
    riderExposure: false,
    boardsExposed: false,
    reasonCode,
  } as const;
}

function isDirectInvocation(): boolean {
  return typeof process.argv[1] === 'string' && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
}

if (isDirectInvocation()) {
  void runTruthValidationCli(process.argv.slice(2), {
    stdout: (value) => process.stdout.write(value),
    stderr: (value) => process.stderr.write(value),
  }).then((exitCode) => { process.exitCode = exitCode; });
}
