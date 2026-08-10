import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SourceProvenance } from '../src/server/data/fetch-source';
import { createSourceRegistry, type RemoteSource } from '../src/server/data/source-registry';
import { loadStaticGtfsArchive } from '../src/server/gtfs/static-loader';
import { isServiceActive, serviceTimeToInstant } from '../src/server/gtfs/static-normalizer';
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
  type ServiceAlertEvidence,
  type ServiceClaimScope,
} from '../src/shared/domain/alert-scope';
import { FeedHealthGovernor } from '../src/shared/domain/feed-health';
import { resolveRerouteClaim, type RerouteClaimInput } from '../src/shared/domain/reroute';
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

interface TruthValidationOptions {
  readonly fixtureRoot?: string;
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
  const checks = await scenarioChecks(scenario, fixtureRoot);
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
): Promise<readonly TruthValidationCheck[]> {
  switch (scenario) {
    case 'normal-weekday': return normalWeekdayChecks(fixtureRoot);
    case 'weekend-planned-work': return weekendPlannedWorkChecks(fixtureRoot);
    case 'late-night-midnight': return lateNightChecks(fixtureRoot);
    case 'major-disruption': return majorDisruptionChecks();
    case 'later-stop-comparison': return laterStopComparisonChecks();
    case 'route-group-bulk-drop': return routeGroupBulkDropChecks();
    case 'false-bypass-incident-drill': return falseBypassDrillChecks();
  }
}

async function normalWeekdayChecks(fixtureRoot: string): Promise<readonly TruthValidationCheck[]> {
  const { realtime, alerts } = await coordinatedFixtures(fixtureRoot);
  const regular = await loadRegularFixture(fixtureRoot);
  const health = new FeedHealthGovernor().observe(realtime, NORMAL_BASE);
  const claim = serviceClaim({
    claimId: 'weekday-a-a23n', routeId: 'A', exactDirectionalStopId: 'A23N', constituentStopId: 'A23',
    direction: 'northbound', tripId: realtime.tripUpdates[0].trip.tripId,
    trainId: realtime.tripUpdates[0].trainInstanceId,
  });
  const gate = emptyServiceDecision(claim, NORMAL_BASE);
  const admission = admitArrivalCandidate(arrivalCandidate({
    at: NORMAL_BASE,
    routeId: 'A',
    feedGroupId: 'subway-rt-ace',
    exactStopId: 'A23N',
    destination: 'Inwood-207 St',
    stableTrainIdentity: realtime.tripUpdates[0].trainInstanceId,
    publishedTripId: realtime.tripUpdates[0].trip.tripId,
    serviceClaimId: claim.claimId,
    serviceChangeGate: gate,
  }), scopeFor(gate, {
    at: NORMAL_BASE, feedGroupId: 'subway-rt-ace', exactStopId: 'A23N', destination: 'Inwood-207 St',
  }));

  return [
    check('coordinated-fixture-sources', realtime.entityCount === 5 && alerts.alerts.length === 2,
      'FIXTURE_SOURCES_ACCEPTED', {
        realtimeSource: realtime.sourceId,
        realtimeHash: realtime.contentHash,
        alertSource: alerts.sourceId,
        alertHash: alerts.contentHash,
      }),
    check('operating-service-date', isServiceActive(regular.data, 'WEEK', '20260804'),
      'OPERATING_SERVICE_ACTIVE', { serviceId: 'WEEK', serviceDate: '20260804', edition: regular.canonicalContentId }),
    check('current-feed-health', health.kind === 'current' && health.reasonCode === 'accepted-current',
      'FEED_CURRENT', health),
    check('governed-arrival-admission', admission.kind === 'admitted' && admission.confidence === 'live',
      'GOVERNED_LIVE_ADMISSION', admission),
  ];
}

async function weekendPlannedWorkChecks(fixtureRoot: string): Promise<readonly TruthValidationCheck[]> {
  const supplemented = await loadSupplementedFixture(fixtureRoot);
  const reroute = resolveRerouteClaim(plannedWeekendReroute());
  const claim = serviceClaim({
    claimId: 'weekend-f-d17n', routeId: 'F', exactDirectionalStopId: 'D17N', constituentStopId: 'D17',
    direction: 'northbound', tripId: 'weekend-f-1', trainId: 'weekend-f-train-1',
  });
  const gate = hardServiceDecision(claim, WEEKEND_BASE, {
    alertId: 'planned-weekend-bypass',
    activePeriods: [],
    selectors: [{
      selectorId: 'planned-exact-stop', routeId: 'F', direction: 'northbound', exactDirectionalStopId: 'D17N',
    }],
    structuredEffect: 'NO_SERVICE',
    declaredConsequence: 'station-closure',
    official: { headerRaw: 'F trains bypass this stop', descriptionRaw: 'F trains are not stopping at this station.' },
  });
  const admission = admitArrivalCandidate(arrivalCandidate({
    at: WEEKEND_BASE, routeId: 'F', feedGroupId: 'subway-rt-bdfm', exactStopId: 'D17N',
    destination: 'Jamaica-179 St', stableTrainIdentity: 'weekend-f-train-1', publishedTripId: 'weekend-f-1',
    serviceClaimId: claim.claimId, serviceChangeGate: gate,
  }), scopeFor(gate, {
    at: WEEKEND_BASE, feedGroupId: 'subway-rt-bdfm', exactStopId: 'D17N', destination: 'Jamaica-179 St',
  }));

  return [
    check('supplemented-edition', supplemented.source === 'supplemented-gtfs'
      && !supplemented.data.trips.some((trip) => trip.tripId === 'regular-omitted'),
    'SUPPLEMENTED_EDITION_ACCEPTED', {
      edition: supplemented.canonicalContentId,
      sourceOrder: supplemented.sourceOrder,
      tripCount: supplemented.data.trips.length,
    }),
    check('planned-stop-exclusion', reroute.kind === 'suppressed'
      && reroute.reason === 'original-stop-excluded-by-effective-pattern',
    'PLANNED_STOP_EXCLUDED', reroute),
    check('service-veto-precedence', admission.kind === 'rejected'
      && admission.failedGate === 'service' && admission.boardTreatment === 'resolved-suppression',
    'SERVICE_CHANGE_VETO_BLOCKED_ARRIVAL', admission),
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

async function majorDisruptionChecks(): Promise<readonly TruthValidationCheck[]> {
  const claim = serviceClaim({
    claimId: 'disruption-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
    direction: 'northbound', tripId: 'disruption-f-1', trainId: 'disruption-f-train-1',
  });
  const gate = hardServiceDecision(claim, DAY_BASE, {
    alertId: 'major-f-suspension',
    activePeriods: [],
    selectors: [{ selectorId: 'entire-route', routeId: 'F' }],
    structuredEffect: 'NO_SERVICE',
    declaredConsequence: 'full-suspension',
    official: { headerRaw: 'F service is suspended', descriptionRaw: 'No F trains are running.' },
  });
  const admission = admitArrivalCandidate(arrivalCandidate({
    at: DAY_BASE, routeId: 'F', feedGroupId: 'subway-rt-bdfm', exactStopId: 'A24N',
    destination: 'Jamaica-179 St', stableTrainIdentity: 'disruption-f-train-1', publishedTripId: 'disruption-f-1',
    serviceClaimId: claim.claimId, serviceChangeGate: gate,
  }), scopeFor(gate, {
    at: DAY_BASE, feedGroupId: 'subway-rt-bdfm', exactStopId: 'A24N', destination: 'Jamaica-179 St',
  }));

  return [
    check('resolved-service-suppression', gate.kind === 'resolved-suppression'
      && gate.disposition === 'resolved-ineligible', 'RESOLVED_MAJOR_DISRUPTION', gate),
    check('dependent-product-containment', sameStrings(gate.suppressedProducts, CLAIM_SUPPRESSED_PRODUCTS),
      'ALL_DEPENDENT_PRODUCTS_SUPPRESSED', gate.suppressedProducts),
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

async function falseBypassDrillChecks(): Promise<readonly TruthValidationCheck[]> {
  const claim = serviceClaim({
    claimId: 'drill-f-a24n', routeId: 'F', exactDirectionalStopId: 'A24N', constituentStopId: 'A24',
    direction: 'northbound', tripId: 'drill-f-1', trainId: 'drill-f-train-1',
  });
  const originalGate = emptyServiceDecision(claim, DAY_BASE);
  const candidate = arrivalCandidate({
    at: DAY_BASE, routeId: 'F', feedGroupId: 'subway-rt-bdfm', exactStopId: 'A24N',
    destination: 'Jamaica-179 St', stableTrainIdentity: 'drill-f-train-1', publishedTripId: 'drill-f-1',
    serviceClaimId: claim.claimId, serviceChangeGate: originalGate,
  });
  const original = admitArrivalCandidate(candidate, scopeFor(originalGate, {
    at: DAY_BASE, feedGroupId: 'subway-rt-bdfm', exactStopId: 'A24N', destination: 'Jamaica-179 St',
  }));
  const incidentAt = plusSeconds(DAY_BASE, 30);
  const veto = hardServiceDecision(claim, incidentAt, {
    alertId: 'drill-confirmed-bypass',
    activePeriods: [],
    selectors: [{
      selectorId: 'drill-exact-stop', routeId: 'F', direction: 'northbound', exactDirectionalStopId: 'A24N',
    }],
    structuredEffect: 'NO_SERVICE',
    declaredConsequence: 'station-closure',
    official: { headerRaw: 'F trains bypass 14 St', descriptionRaw: 'F trains are not stopping at 14 St.' },
  });
  const containedCandidate = arrivalCandidate({
    at: incidentAt, routeId: 'F', feedGroupId: 'subway-rt-bdfm', exactStopId: 'A24N',
    destination: 'Jamaica-179 St', stableTrainIdentity: 'drill-f-train-1', publishedTripId: 'drill-f-1',
    serviceClaimId: claim.claimId, serviceChangeGate: veto,
  });
  const contained = admitArrivalCandidate(containedCandidate, scopeFor(veto, {
    at: incidentAt, feedGroupId: 'subway-rt-bdfm', exactStopId: 'A24N', destination: 'Jamaica-179 St',
  }));

  return [
    check('original-admission-reconstruction', original.kind === 'admitted',
      'ORIGINAL_DECISION_RECONSTRUCTED', original),
    check('current-bypass-veto', contained.kind === 'rejected'
      && contained.failedGate === 'service' && contained.boardTreatment === 'resolved-suppression',
    'RESOLVED_SERVICE_VETO_BLOCKED_ARRIVAL', contained),
    check('containment-product-scope', sameStrings(veto.suppressedProducts, CLAIM_SUPPRESSED_PRODUCTS),
      'FALSE_BYPASS_DEPENDENCIES_CONTAINED', veto.suppressedProducts),
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

async function coordinatedFixtures(fixtureRoot: string) {
  const realtimeBytes = await readFile(join(fixtureRoot, 'realtime', 'current.pb'));
  const alertBytes = await readFile(join(fixtureRoot, 'alerts', 'subway-alerts.json'));
  const registry = createSourceRegistry({});
  const realtimeSource = requiredRemote(registry, 'subway-rt-ace');
  const alertSource = requiredRemote(registry, 'subway-alerts');
  const coordinator = createSourceCoordinator({
    realtimeGroups: [realtimeSource],
    alertSource,
    retrieve: async (source) => {
      const json = source.id === 'subway-alerts';
      const bytes = json ? alertBytes : realtimeBytes;
      return { bytes, provenance: fixtureProvenance(source, bytes, json) };
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

async function loadSupplementedFixture(fixtureRoot: string) {
  return loadStaticGtfsArchive(await readFile(join(fixtureRoot, 'gtfs', 'supplemented.zip')), {
    source: 'supplemented-gtfs',
    retrievedAt: new Date('2026-08-08T10:00:00.000Z'),
    publishedAt: new Date('2026-08-08T09:00:00.000Z'),
    sourceOrder: 2,
    coverage: [scheduleCoverage('weekend-supplement')],
    wrapper: { filename: 'supplemented.zip' },
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

function fixtureProvenance(source: RemoteSource, bytes: Uint8Array, json: boolean): SourceProvenance {
  const mediaType = json ? 'application/json' : 'application/x-protobuf';
  return Object.freeze({
    sourceId: source.id,
    sourceAuthority: source.authority,
    sourceRole: source.role,
    sourceUrl: source.url,
    retrievedAt: '2026-08-04T06:01:00.000Z',
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

function serviceClaim(input: ServiceClaimScope): ServiceClaimScope {
  return input;
}

function emptyServiceDecision(claim: ServiceClaimScope, at: Date): ServiceChangeDecision {
  return evaluateServiceChanges({
    snapshot: classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at, retrievedAt: at, alerts: [] }, at),
    claim,
  });
}

function hardServiceDecision(
  claim: ServiceClaimScope,
  at: Date,
  alert: ServiceAlertEvidence,
): ServiceChangeDecision {
  return evaluateServiceChanges({
    snapshot: classifyAlertSnapshot({ status: 'accepted', feedTimestamp: at, retrievedAt: at, alerts: [alert] }, at),
    claim,
  });
}

function arrivalCandidate(input: {
  readonly at: Date;
  readonly routeId: string;
  readonly feedGroupId: string;
  readonly exactStopId: string;
  readonly destination: string;
  readonly stableTrainIdentity: string;
  readonly publishedTripId: string;
  readonly serviceClaimId: string;
  readonly serviceChangeGate: ServiceChangeDecision;
}): ArrivalAdmissionCandidate {
  return {
    stableTrainIdentity: input.stableTrainIdentity,
    publishedTripId: input.publishedTripId,
    patternIdentity: `${input.exactStopId}:1`,
    feedGroupId: input.feedGroupId,
    route: { id: input.routeId, label: input.routeId },
    routeOrderKind: /^\d/.test(input.routeId) ? 'numbered' : 'lettered',
    direction: 'northbound',
    destination: input.destination,
    remainingStopCalls: [{
      stopId: input.exactStopId,
      sourceStopSequence: 1,
      arrivalAt: plusSeconds(input.at, 180),
      departureAt: plusSeconds(input.at, 190),
      scheduleRelationship: 'SCHEDULED',
    }],
    serviceChangeGate: input.serviceChangeGate,
    serviceClaimId: input.serviceClaimId,
    serviceDisposition: 'eligible',
    trackDisposition: 'eligible',
    freshness: 'current',
    identityDisposition: 'coherent',
    recoveryDisposition: 'live-continuity',
    movementDisposition: 'plausible',
    confidence: {
      kind: 'live',
      supportedRange: { startsAt: plusSeconds(input.at, 160), endsAt: plusSeconds(input.at, 200) },
    },
    provenance: {
      source: 'gtfs-rt', sourceId: input.feedGroupId,
      observedAt: plusSeconds(input.at, -30), retrievedAt: input.at,
    },
  };
}

function scopeFor(
  gate: ServiceChangeDecision,
  input: { readonly at: Date; readonly feedGroupId: string; readonly exactStopId: string; readonly destination: string },
): ArrivalBoardScope {
  return {
    feedGroupId: input.feedGroupId,
    exactStopId: input.exactStopId,
    direction: 'northbound',
    destination: input.destination,
    comparisonAt: input.at,
    serviceAssessmentAt: input.at,
    serviceAlertContextIdentity: gate.alertContextIdentity,
  };
}

function plannedWeekendReroute(): RerouteClaimInput {
  return {
    changeKind: 'reroute',
    planned: true,
    assessedAt: WEEKEND_BASE,
    alertScope: 'match',
    originalRoute: { id: 'F', label: 'F' },
    direction: 'northbound',
    targetExactDirectionalStopId: 'D17N',
    originalDirectionalStopIds: ['B02N', 'D15N', 'D16N', 'D17N', 'D18N'],
    effectiveSupplementedPattern: {
      sourceId: 'weekend-supplement-20260808',
      routeId: 'F',
      direction: 'northbound',
      orderedDirectionalStopIds: ['B02N', 'F14N', 'A24N', 'A25N', 'A27N'],
      provenance: {
        source: 'supplemented-gtfs',
        acceptance: 'accepted',
        currency: 'current',
        editionId: 'supplemented-gtfs:weekend-20260808',
        canonicalContentId: 'weekend-20260808',
        publishedAt: plusSeconds(WEEKEND_BASE, -3_600),
        firstAcceptedRetrievedAt: plusSeconds(WEEKEND_BASE, -3_590),
        observedAt: plusSeconds(WEEKEND_BASE, -60),
        acceptedAt: plusSeconds(WEEKEND_BASE, -30),
        sourceOrder: 2,
        priorAcceptedEdition: {
          editionId: 'supplemented-gtfs:weekend-20260801',
          canonicalContentId: 'weekend-20260801',
          publishedAt: plusSeconds(WEEKEND_BASE, -7_200),
          firstAcceptedRetrievedAt: plusSeconds(WEEKEND_BASE, -7_190),
          observedAt: plusSeconds(WEEKEND_BASE, -3_700),
          acceptedAt: plusSeconds(WEEKEND_BASE, -3_650),
          sourceOrder: 1,
        },
      },
    },
    liveRemainingStopIds: ['F14N', 'A24N', 'A25N', 'A27N'],
    pathEvidence: [{
      evidenceId: 'weekend-alert-path-1', routeId: 'F', direction: 'northbound',
      orderedDirectionalStopIds: ['F14N', 'A24N', 'A25N', 'A27N'], supportedViaLabel: 'Via E',
    }],
  };
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
