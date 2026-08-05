import type { Request, Response } from 'express';

import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendImmutableJson, sendNoStoreJson } from '../api/http';
import { toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import type { MapTheme } from '../services/map-service';
import { captureNow } from './boards';
import { ApiRequestError, assertExactQuery, parseApiIdentifier } from '../api/request-validation';

export function mapReferenceHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    const theme = parseTheme(request.params.theme);
    const contentVersion = parseApiIdentifier(request.params.contentVersion, 'map content version');
    const gateDecision = dependencies.exposure.public['maps-rights'];
    if (dependencies.config.mode !== 'validation') {
      const decidedAt = captureNow(dependencies).toISOString();
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity(['map-reference-locked', theme, dependencies.config.mode, decidedAt]),
        decidedAt,
        serverTime: decidedAt,
        runtime: { mode: dependencies.config.mode, surface: 'public', availability: 'locked' },
        gates: dependencies.exposure.public,
        gateDecision,
        data: null,
      });
      return;
    }
    const reference = dependencies.maps.get(theme);
    if (contentVersion !== reference.contentVersion) {
      sendNoStoreJson(response, 404, { error: { code: 'not_found', message: 'Resource not found.' } });
      return;
    }
    sendImmutableJson(request, response, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: reference.contentVersion,
      demonstrationLabel: DEMONSTRATION_LABEL,
      data: reference,
    });
  };
}

export function mapOverlayHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    const theme = parseTheme(request.params.theme);
    const decidedAt = captureNow(dependencies).toISOString();
    const gateDecision = dependencies.exposure.public['maps-rights'];
    if (dependencies.config.mode !== 'validation') {
      sendNoStoreJson(response, 200, {
        apiVersion: API_VERSION,
        schemaVersion: SCHEMA_VERSION,
        responseIdentity: createResponseIdentity(['map-overlay-locked', theme, dependencies.config.mode, decidedAt]),
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
    const overlay = snapshot.mapOverlays?.find((value) => value.theme === theme);
    const data = overlay
      ? deepFreeze({
          theme,
          serviceEpoch: overlay.serviceEpoch,
          segments: overlay.segments.map((segment) => ({
            id: segment.id,
            routeIds: [...segment.routeIds],
            state: segment.state,
            alertIds: [...segment.alertIds],
          })),
        })
      : deepFreeze({ theme, serviceEpoch: null, segments: [] });
    sendNoStoreJson(response, 200, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      responseIdentity: createResponseIdentity(['map-overlay', theme, snapshot.identity, decidedAt, JSON.stringify(data)]),
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

function parseTheme(value: unknown): MapTheme {
  if (value !== 'day' && value !== 'night') throw new ApiRequestError(400);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
