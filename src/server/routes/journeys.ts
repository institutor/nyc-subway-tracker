import type { Request, Response } from 'express';

import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendImmutableJson, sendNoStoreJson } from '../api/http';
import { toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import { createJourneyGraphReference, planJourney } from '../services/journey-service';
import { captureNow } from './boards';
import type { JourneyQuery } from '../../shared/domain/journey-router';
import { assertExactQuery, parseApiIdentifier, parseJourneyRequest } from '../api/request-validation';

export function journeyReferenceHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    const contentVersion = parseApiIdentifier(request.params.contentVersion, 'journey graph content version');
    const snapshot = captureDecisionSnapshot(dependencies.snapshotProvider);
    const reference = createJourneyGraphReference(snapshot.journeyGraph);
    if (contentVersion !== reference.contentVersion) {
      sendNoStoreJson(response, 404, { error: { code: 'not_found', message: 'Resource not found.' } });
      return;
    }
    sendImmutableJson(request, response, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      contentVersion,
      ...(dependencies.config.mode === 'validation' ? { demonstrationLabel: DEMONSTRATION_LABEL } : {}),
      data: reference,
    });
  };
}

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
    const sourceHealth = toSourceHealthDtos(snapshot.sourceHealth);
    const provenance = toProvenanceDtos(snapshot.provenance);
    sendNoStoreJson(response, 200, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      responseIdentity: createResponseIdentity([
        'journey', query.mode, query.originStationId, query.destinationStationId, decidedAt,
        JSON.stringify(sourceHealth), JSON.stringify(provenance), JSON.stringify(data),
      ]),
      decidedAt,
      serverTime: decidedAt,
      runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
      gates: dependencies.exposure.public,
      gateDecision: dependencies.exposure.public['nearby-offline'],
      demonstrationLabel: DEMONSTRATION_LABEL,
      sourceHealth,
      provenance,
      data,
    });
  };
}
