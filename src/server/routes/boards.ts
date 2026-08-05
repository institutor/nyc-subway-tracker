import type { Request, Response } from 'express';

import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendNoStoreJson, sendPublicHistoricalJson } from '../api/http';
import { toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import { buildBoardDto } from '../services/board-service';
import { parseBoardRequest } from '../api/request-validation';

export function boardHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    const filters = parseBoardRequest(request);
    const decidedAt = captureNow(dependencies).toISOString();
    const gateDecision = dependencies.exposure.public['arrival-boards'];
    if (dependencies.config.mode !== 'validation') {
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity(['board-locked', filters.stationId, dependencies.config.mode, decidedAt]),
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
    const selected = snapshot.boards?.find(({ decision }) => decision.station.id === filters.stationId);
    const data = selected
      ? buildBoardDto(selected.decision, selected.validThrough, filters, snapshot.sourceHealth, snapshot.provenance)
      : {
          mode: 'unavailable' as const,
          station: null,
          directions: Object.freeze([]),
          alerts: Object.freeze([]),
          explanations: Object.freeze([{ code: 'BOARD_UNAVAILABLE', message: 'Arrival information is unavailable.' }]),
          sourceHealth: toSourceHealthDtos(snapshot.sourceHealth),
          provenance: toProvenanceDtos(snapshot.provenance),
          capabilities: Object.freeze({ arrivals: 'unavailable', accessibility: 'locked', guidance: 'locked', commute: 'locked' }),
        };
    sendPublicHistoricalJson(response, 200, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      responseIdentity: createResponseIdentity(['board', filters.stationId, filters.direction ?? '', filters.routeIds.join(','), decidedAt, JSON.stringify(data)]),
      decidedAt,
      serverTime: decidedAt,
      runtime: { mode: 'validation', surface: 'demonstration', availability: 'available' },
      gates: dependencies.exposure.public,
      gateDecision,
      demonstrationLabel: DEMONSTRATION_LABEL,
      sourceHealth: toSourceHealthDtos(snapshot.sourceHealth),
      provenance: toProvenanceDtos(snapshot.provenance),
      data,
    });
  };
}

export function captureNow(dependencies: AppDependencies): Date {
  const value = dependencies.clock.now();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('Clock returned an invalid instant');
  return new Date(value.getTime());
}
