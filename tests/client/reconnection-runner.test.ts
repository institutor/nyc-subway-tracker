import { describe, expect, test, vi } from 'vitest';

import { TransitApiError } from '../../src/client/api/client';
import { runReconnection } from '../../src/client/recovery/run-reconnection';
import type {
  OwnerAcceptance,
  PreservedReconnectionContext,
  ReconnectionStage,
  ReconnectionStageResult,
} from '../../src/shared/domain/reconnection';

const ACCEPTED_AT = '2026-08-05T12:00:01.000Z';
const context: PreservedReconnectionContext = {
  stationId: 'A12',
  direction: 'northbound',
  routeFilters: ['A'],
  accessibleRouteOnly: false,
  mapTuple: { referenceMode: 'actual', theme: 'night', contentVersion: 'map-7', viewportKey: 'viewport-7' },
  activeTripId: 'trip-7',
  manualCursor: { legIndex: 0, stopId: 'A12' },
  hasStoredTrainChoice: true,
  guidanceRequirements: { positioning: 'optional', transfer: 'required' },
  activeSurface: 'map',
  scrollOffset: 212,
  focusTargetId: 'trip-next',
  readingAnchorId: 'point-a12',
  recovery: {
    epochId: 'epoch-7', requestIdentity: 'request-7', generation: 7,
    startedAt: '2026-08-05T12:00:00.000Z', activeTripId: 'trip-7', contextKey: 'context-7',
    eligibleScopes: [
      { kind: 'context', id: 'context-7' },
      { kind: 'station', id: 'A12' }, { kind: 'route', id: 'A' },
      { kind: 'direction', id: 'northbound' }, { kind: 'transfer', id: 'transfer-7' },
      { kind: 'train', id: 'train-7' }, { kind: 'map', id: 'viewport-7' },
      { kind: 'saved-record', id: 'saved-7' },
    ],
    ownerScopes: {
      equipment: [{ kind: 'station', id: 'A12' }],
      'accessible-path': [{ kind: 'station', id: 'A12' }],
      'service-change': [{ kind: 'route', id: 'A' }],
      'feed-health': [{ kind: 'station', id: 'A12' }],
      'train-admission': [{ kind: 'train', id: 'train-7' }],
      arrivals: [{ kind: 'station', id: 'A12' }],
      positioning: [{ kind: 'station', id: 'A12' }],
      'transfer-guidance': [{ kind: 'transfer', id: 'transfer-7' }],
      maps: [{ kind: 'map', id: 'viewport-7' }],
      saved: [{ kind: 'saved-record', id: 'saved-7' }],
    },
  },
};

describe('client reconnection runner', () => {
  test('does not call locked equipment or accessibility owners and creates no stage-one requirement or warning', async () => {
    const lockedContext: PreservedReconnectionContext = {
      ...context,
      accessibleRouteOnly: true,
      guidanceRequirements: { ...context.guidanceRequirements, positioning: 'none' },
      recovery: {
        ...context.recovery,
        ownerScopes: { ...context.recovery.ownerScopes, equipment: [], 'accessible-path': [], positioning: [] },
      },
    };
    const loads: number[] = [];
    const result = await runReconnection({
      context: lockedContext,
      initial: { historicalPositioningGuidance: false, historicalTransferGuidance: true },
      loadStage: async ({ stage }) => { loads.push(stage); return validResult(stage); },
      now: () => new Date(ACCEPTED_AT),
    });
    expect(loads).toEqual([2, 3, 4, 5]);
    expect(result.state.stages[0]?.result).toMatchObject({ accessiblePath: { requiredForActiveTrip: false }, invalidation: null });
    expect(result.state.visible.activeWarnings.some(({ stage }) => stage === 1)).toBe(false);
  });

  test('requests and presents all five owners sequentially without mutating preserved context', async () => {
    const loads: number[] = [];
    const transitions: string[] = [];

    const result = await runReconnection({
      context,
      initial: { historicalPositioningGuidance: true, historicalTransferGuidance: true },
      loadStage: async ({ stage }) => {
        loads.push(stage);
        return validResult(stage);
      },
      now: () => new Date(ACCEPTED_AT),
      onTransition: ({ phase, stage, state }) => {
        transitions.push(`${phase}:${stage}`);
        expect(state.context).toEqual(context);
      },
    });

    expect(result.kind).toBe('complete');
    expect(loads).toEqual([1, 2, 3, 4, 5]);
    expect(transitions).toEqual([
      'requested:1', 'presented:1', 'requested:2', 'presented:2', 'requested:3', 'presented:3',
      'requested:4', 'presented:4', 'requested:5', 'presented:5',
    ]);
    expect(result.state.context).toEqual(context);
    expect(result.state.status).toBe('complete');
  });

  test('stops before lower stages and reports Offline when a stage owner cannot reach the network', async () => {
    const loads: number[] = [];
    const result = await runReconnection({
      context,
      initial: { historicalPositioningGuidance: true },
      loadStage: vi.fn(async ({ stage }) => {
        loads.push(stage);
        if (stage === 3) throw new TransitApiError('network-unreachable');
        return validResult(stage);
      }),
      now: () => new Date(ACCEPTED_AT),
    });

    expect(result.kind).toBe('network-unreachable');
    expect(loads).toEqual([1, 2, 3]);
    expect(result.state.currentStage).toBe(3);
    expect(result.state.stages.find(({ stage }) => stage === 4)?.status).toBe('blocked');
  });

  test('does not accept or present a late owner result after its recovery epoch is aborted', async () => {
    const controller = new AbortController();
    const firstOwner = deferred<ReconnectionStageResult>();
    const transitions: string[] = [];
    const recovery = runReconnection({
      context,
      initial: { historicalPositioningGuidance: true },
      signal: controller.signal,
      loadStage: async () => firstOwner.promise,
      onTransition: ({ phase, stage }) => transitions.push(`${phase}:${stage}`),
    });

    await vi.waitFor(() => expect(transitions).toEqual(['requested:1']));
    controller.abort();
    firstOwner.resolve(validResult(1));

    const result = await recovery;
    expect(result.kind).toBe('aborted');
    expect(transitions).toEqual(['requested:1']);
    expect(result.state.stages[0]?.status).toBe('requested');
    expect(result.state.stages[1]?.status).toBe('blocked');
  });

  test('finishes through exact governed fail-closed results when owner endpoints are absent and presents warnings first', async () => {
    const result = await runReconnection({
      context,
      initial: { historicalPositioningGuidance: true, historicalTransferGuidance: true },
      loadStage: async () => undefined,
      now: () => new Date(ACCEPTED_AT),
    });

    expect(result.kind).toBe('complete');
    expect(result.state.visible.currentArrivalsRestored).toBe(false);
    expect(result.state.visible.activeWarnings.map(({ stage }) => stage)).toEqual([2, 3, 4]);
    expect(result.state.visible.activeWarnings.map(({ stage, ownerGate, scopes }) => ({
      stage,
      ownerScopes: ownerGate.scopeMembership,
      warningScopes: scopes.map(({ kind, id }) => ({ kind, id })),
    }))).toEqual([
      { stage: 2, ownerScopes: [{ kind: 'route', id: 'A' }], warningScopes: [{ kind: 'route', id: 'A' }] },
      { stage: 3, ownerScopes: [{ kind: 'train', id: 'train-7' }], warningScopes: [{ kind: 'train', id: 'train-7' }] },
      { stage: 4, ownerScopes: [{ kind: 'transfer', id: 'transfer-7' }], warningScopes: [{ kind: 'transfer', id: 'transfer-7' }] },
    ]);
    for (const stage of [2, 3, 4] as const) {
      const warning = result.state.audit.findIndex((event) => event.kind === 'warning-presented' && event.stage === stage);
      const presented = result.state.audit.findIndex((event) => event.kind === 'stage-presented' && event.stage === stage);
      expect(warning).toBeGreaterThanOrEqual(0);
      expect(warning).toBeLessThan(presented);
    }
  });

  test('retains every exact applicable owner scope in multi-scope fail-closed warnings', async () => {
    const multiScopeContext: PreservedReconnectionContext = {
      ...context,
      recovery: {
        ...context.recovery,
        eligibleScopes: [
          ...context.recovery.eligibleScopes,
          { kind: 'leg', id: 'leg-current' },
          { kind: 'leg', id: 'leg-upcoming' },
          { kind: 'transfer', id: 'transfer-8' },
        ],
        ownerScopes: {
          ...context.recovery.ownerScopes,
          'service-change': [
            { kind: 'leg', id: 'leg-current' },
            { kind: 'leg', id: 'leg-upcoming' },
          ],
          'transfer-guidance': [
            { kind: 'transfer', id: 'transfer-7' },
            { kind: 'transfer', id: 'transfer-8' },
          ],
        },
      },
    };

    const result = await runReconnection({
      context: multiScopeContext,
      initial: { historicalPositioningGuidance: false, historicalTransferGuidance: true },
      loadStage: async () => undefined,
      now: () => new Date(ACCEPTED_AT),
    });

    expect(result.kind).toBe('complete');
    const serviceWarning = result.state.visible.activeWarnings.find(({ stage }) => stage === 2);
    const transferWarning = result.state.visible.activeWarnings.find(({ stage }) => stage === 4);
    expect(serviceWarning?.scopes.map(({ kind, id }) => ({ kind, id }))).toEqual([
      { kind: 'leg', id: 'leg-current' },
      { kind: 'leg', id: 'leg-upcoming' },
    ]);
    expect(transferWarning?.scopes.map(({ kind, id }) => ({ kind, id }))).toEqual([
      { kind: 'transfer', id: 'transfer-7' },
      { kind: 'transfer', id: 'transfer-8' },
    ]);
  });

  test('continues later diagnostics but withholds current arrivals after trip service evidence fails closed', async () => {
    const loads: number[] = [];
    const result = await runReconnection({
      context,
      initial: { historicalPositioningGuidance: true, historicalTransferGuidance: true },
      loadStage: async ({ stage }) => {
        loads.push(stage);
        return stage === 2 ? undefined : validResult(stage);
      },
      now: () => new Date(ACCEPTED_AT),
    });

    expect(result.kind).toBe('complete');
    expect(loads).toEqual([1, 2, 3, 4, 5]);
    expect(result.state.stages.find(({ stage }) => stage === 3)?.result).toMatchObject({
      stage: 3,
      arrivals: { disposition: 'withheld' },
    });
    expect(result.state.visible.currentArrivalsRestored).toBe(false);
  });

  test('binds every returned owner result to the local receipt clock after that response', async () => {
    const ticks = [10, 11, 12, 13, 14].map((second) => `2026-08-05T12:00:${second}.000Z`);
    const now = vi.fn(() => new Date(ticks.shift()!));

    const result = await runReconnection({
      context,
      initial: { historicalPositioningGuidance: true, historicalTransferGuidance: true },
      loadStage: async ({ stage }) => validResult(stage),
      now,
    });

    expect(result.kind).toBe('complete');
    expect(now).toHaveBeenCalledTimes(5);
    expect(result.state.stages.map(({ result: stageResult }) => {
      if (!stageResult) return null;
      if (stageResult.stage === 1) return stageResult.equipment.gate.acceptedAt;
      if (stageResult.stage === 2) return stageResult.serviceChanges.gate.acceptedAt;
      if (stageResult.stage === 3) return stageResult.arrivals.gate.acceptedAt;
      if (stageResult.stage === 4) return stageResult.positioning.gate.acceptedAt;
      return stageResult.maps.gate.acceptedAt;
    })).toEqual([
      '2026-08-05T12:00:10.000Z',
      '2026-08-05T12:00:11.000Z',
      '2026-08-05T12:00:12.000Z',
      '2026-08-05T12:00:13.000Z',
      '2026-08-05T12:00:14.000Z',
    ]);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  return { promise, resolve };
}

function gate(domain: OwnerAcceptance['domain'], evidenceId = `${domain}-evidence`): OwnerAcceptance {
  return {
    domain, ownerId: `${domain}-owner`, evidenceId, evidenceAt: ACCEPTED_AT, acceptedAt: ACCEPTED_AT,
    recoveryEpochId: context.recovery.epochId, requestIdentity: context.recovery.requestIdentity,
    generation: context.recovery.generation, activeTripId: context.recovery.activeTripId,
    contextKey: context.recovery.contextKey, scopeMembership: context.recovery.ownerScopes[domain],
    disposition: 'accepted-fresh',
  };
}

function validResult(stage: ReconnectionStage): ReconnectionStageResult {
  if (stage === 1) return {
    stage, equipment: { gate: gate('equipment'), disposition: 'verified-operational' },
    accessiblePath: { gate: gate('accessible-path'), requiredForActiveTrip: false, completeness: 'complete-exact-path', disposition: 'verified' },
    invalidation: null,
  };
  if (stage === 2) return {
    stage, serviceChanges: { gate: gate('service-change'), disposition: 'resolved', vetoesApplied: true },
    tripServicePattern: 'verified', invalidation: null,
  };
  if (stage === 3) return {
    stage, feedRecovery: { gate: gate('feed-health'), disposition: 'readmitted' },
    trainReadmission: { gate: gate('train-admission'), disposition: 'admitted' },
    arrivals: {
      gate: gate('arrivals', 'arrivals-aggregate'), disposition: 'current', freshSnapshotCount: 2,
      freshSnapshots: [gate('arrivals', 'arrivals-snapshot-1'), gate('arrivals', 'arrivals-snapshot-2')],
    },
    storedTrainChoice: 'verified', invalidation: null,
  };
  if (stage === 4) return {
    stage, positioning: { gate: gate('positioning'), requirement: 'optional', disposition: 'verified' },
    transferGuidance: { gate: gate('transfer-guidance'), requirement: 'required', disposition: 'verified' },
    invalidation: null,
  };
  return {
    stage, maps: { gate: gate('maps'), disposition: 'refreshed' },
    unrelatedSaved: { gate: gate('saved'), disposition: 'refreshed' },
  };
}
