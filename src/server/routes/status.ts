import type { Request, Response } from 'express';

import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendNoStoreJson, sendPublicHistoricalJson } from '../api/http';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import { buildStatusDto } from '../services/board-service';
import { captureNow } from './boards';
import { parseStatusRequest } from '../api/request-validation';

export function statusHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    const { stationId, routeIds, direction } = parseStatusRequest(request);
    const decidedAt = captureNow(dependencies).toISOString();
    const gateDecision = dependencies.exposure.public['arrival-boards'];
    if (dependencies.config.mode !== 'validation') {
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity(['status-locked', dependencies.config.mode, decidedAt]),
        decidedAt,
        serverTime: decidedAt,
        runtime: { mode: dependencies.config.mode, surface: 'public', availability: 'locked' },
        gates: dependencies.exposure.public,
        gateDecision,
        data: null,
      });
      return;
    }
    const snapshot = captureDecisionSnapshot(dependencies.snapshotProvider);
    const boards = (snapshot.boards ?? []).map(({ decision }) => decision);
    const data = buildStatusDto(
      boards,
      stationId,
      routeIds,
      direction,
      snapshot.sourceHealth,
      snapshot.provenance,
      decidedAt,
      dependencies.exposure.public,
    );
    sendPublicHistoricalJson(response, 200, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      responseIdentity: createResponseIdentity(['status', stationId ?? '', routeIds.join(','), direction ?? '', decidedAt, JSON.stringify(data)]),
      decidedAt,
      serverTime: decidedAt,
      runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
      gates: dependencies.exposure.public,
      gateDecision,
      demonstrationLabel: DEMONSTRATION_LABEL,
      sourceHealth: data.sourceHealth,
      provenance: data.provenance,
      data,
    });
  };
}
