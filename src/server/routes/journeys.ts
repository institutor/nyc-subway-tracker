import type { Request, Response } from 'express';

import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendNoStoreJson } from '../api/http';
import { toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import { planJourney } from '../services/journey-service';
import { captureNow } from './boards';
import type { JourneyQuery } from '../../shared/domain/journey-router';
import { parseJourneyRequest } from '../api/request-validation';

export function journeyHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    let query: JourneyQuery;
    try {
      query = parseJourneyRequest(request);
    } catch {
      sendNoStoreJson(response, 400, { error: { code: 'invalid_request', message: 'Request could not be processed.' } });
      return;
    }

    if (dependencies.config.mode !== 'validation') {
      const decidedAt = captureNow(dependencies).toISOString();
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity(['journey-locked', dependencies.config.mode, decidedAt]),
        decidedAt,
        serverTime: decidedAt,
        runtime: { mode: dependencies.config.mode, surface: 'public', availability: 'locked' },
        gates: dependencies.exposure.public,
        gateDecision: dependencies.exposure.public['nearby-offline'],
        data: null,
      });
      return;
    }
    const decidedAt = captureNow(dependencies).toISOString();
    const snapshot = captureDecisionSnapshot(dependencies.snapshotProvider);
    const data = planJourney(snapshot.journeyGraph, query);
    sendNoStoreJson(response, 200, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      responseIdentity: createResponseIdentity([
        'journey', snapshot.identity, query.mode, query.originStationId, query.destinationStationId, decidedAt, JSON.stringify(data),
      ]),
      decidedAt,
      serverTime: decidedAt,
      runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
      gates: dependencies.exposure.public,
      gateDecision: dependencies.exposure.public['nearby-offline'],
      demonstrationLabel: DEMONSTRATION_LABEL,
      sourceHealth: toSourceHealthDtos(snapshot.sourceHealth),
      provenance: toProvenanceDtos(snapshot.provenance),
      data,
    });
  };
}
