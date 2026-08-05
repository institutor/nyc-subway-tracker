import type { Request, Response } from 'express';

import { rankNearbyStations } from '../../shared/domain/station-ranking';
import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendNoStoreJson } from '../api/http';
import { projectPublicSource, toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import { capturePracticalWalkDecision, type PracticalWalkDecision } from '../walk/practical-walk-adapter';
import { parseNearbyRequest } from '../api/request-validation';

export function nearbyHandler(dependencies: AppDependencies) {
  return async (request: Request, response: Response): Promise<void> => {
    let parsed: { coordinate: { latitude: number; longitude: number }; accuracyMeters: number; accessibleRouteOnly: boolean };
    try {
      parsed = parseNearbyRequest(request);
    } catch {
      sendNoStoreJson(response, 400, { error: { code: 'invalid_request', message: 'Request could not be processed.' } });
      return;
    }

    if (dependencies.config.mode !== 'validation') {
      const decidedAt = captureNow(dependencies).toISOString();
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity(['nearby-locked', dependencies.config.mode, decidedAt]),
        decidedAt,
        serverTime: decidedAt,
        runtime: { mode: dependencies.config.mode, surface: 'public', availability: 'locked' },
        gates: dependencies.exposure.public,
        gateDecision: dependencies.exposure.public['nearby-offline'],
        data: null,
      });
      return;
    }

    const cancellation = requestCancellation(request, response);
    let walk: PracticalWalkDecision;
    try {
      const rawWalk = await dependencies.walk({
        origin: parsed.coordinate,
        destinations: dependencies.nearbyUniverse,
      }, { signal: cancellation.signal });
      walk = capturePracticalWalkDecision(rawWalk, dependencies.nearbyUniverse);
    } catch {
      if (cancellation.signal.aborted || response.destroyed) {
        cancellation.dispose();
        return;
      }
      walk = Object.freeze({ kind: 'unavailable', reason: 'invalid' });
    }
    if (cancellation.signal.aborted || response.destroyed) {
      cancellation.dispose();
      return;
    }

    try {
      const decidedAt = captureNow(dependencies).toISOString();
      const snapshot = captureDecisionSnapshot(dependencies.snapshotProvider);
      const nearby = snapshot.nearby ?? {
        complexes: [], constituents: [], entrances: [], services: [],
      };
      const data = rankNearbyStations({
        ...nearby,
        walk,
        accessibleRouteOnly: parsed.accessibleRouteOnly,
        locationAccuracyMeters: parsed.accuracyMeters,
      });
      const practicalWalkEvidence = toPracticalWalkEvidence(walk);
      const sourceHealth = toSourceHealthDtos(snapshot.sourceHealth);
      const provenance = toProvenanceDtos(snapshot.provenance);
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity([
          'nearby', decidedAt, JSON.stringify(sourceHealth), JSON.stringify(provenance),
          JSON.stringify(practicalWalkEvidence), JSON.stringify(data),
        ]),
        decidedAt,
        serverTime: decidedAt,
        runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
        gates: dependencies.exposure.public,
        gateDecision: dependencies.exposure.public['nearby-offline'],
        demonstrationLabel: DEMONSTRATION_LABEL,
        sourceHealth,
        provenance,
        practicalWalkEvidence,
        data,
      });
    } finally {
      cancellation.dispose();
    }
  };
}

function toPracticalWalkEvidence(walk: PracticalWalkDecision) {
  if (walk.kind === 'unavailable') {
    const reasons = ['disabled', 'unapproved', 'unsupported', 'limit', 'cancelled', 'timeout', 'invalid', 'incomplete'];
    const reason = reasons.includes(walk.reason) ? walk.reason : 'invalid';
    return Object.freeze({ kind: walk.kind, reason });
  }
  const coverageKind = walk.coverage?.kind;
  if (coverageKind !== 'complete-universe' && coverageKind !== 'certified-third-card-cutoff') {
    return Object.freeze({ kind: 'unavailable' as const, reason: 'invalid' as const });
  }
  const coverage = coverageKind === 'complete-universe'
    ? Object.freeze({ kind: coverageKind })
    : Object.freeze({
        kind: coverageKind,
        consideredDestinationIds: Object.freeze([...walk.coverage.consideredDestinationIds].sort()),
        excludedDestinationIds: Object.freeze([...walk.coverage.excludedDestinationIds].sort()),
        thirdCardMaximumSeconds: walk.coverage.thirdCardMaximumSeconds,
        excludedMinimumSeconds: walk.coverage.excludedMinimumSeconds,
      });
  return Object.freeze({
    kind: walk.kind,
    ...projectPublicSource(walk.source, walk.sourceId),
    coverage,
  });
}

function captureNow(dependencies: AppDependencies): Date {
  const value = dependencies.clock.now();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('Clock returned an invalid instant');
  return new Date(value.getTime());
}

function requestCancellation(request: Request, response: Response) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const close = () => {
    if (!response.writableEnded) cancel();
  };
  request.once('aborted', cancel);
  response.once('close', close);
  return {
    signal: controller.signal,
    dispose() {
      request.off('aborted', cancel);
      response.off('close', close);
    },
  };
}
