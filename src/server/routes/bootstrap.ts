import type { Request, Response } from 'express';

import { API_VERSION, DEMONSTRATION_LABEL, SCHEMA_VERSION, type DynamicEnvelope } from '../api/contracts';
import { captureDecisionSnapshot } from '../api/decision-snapshot';
import { sendNoStoreJson } from '../api/http';
import { toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import { createResponseIdentity } from '../api/response-identity';
import type { AppDependencies } from '../bootstrap';
import { assertExactQuery } from '../api/request-validation';

interface BootstrapData {
  readonly productName: 'NYC Subway Tracker';
  readonly unofficial: true;
  readonly contentVersions: {
    readonly stationCatalog: string;
    readonly maps: {
      readonly day: string;
      readonly night: string;
    };
  };
}

export function bootstrapHandler(dependencies: AppDependencies) {
  return (_request: Request, response: Response): void => {
    assertExactQuery(_request, []);
    const decidedAt = captureClock(dependencies).toISOString();
    const snapshot = captureDecisionSnapshot(dependencies.snapshotProvider);
    const validation = dependencies.config.mode === 'validation';
    const contentVersions = {
      stationCatalog: dependencies.catalog.contentVersion,
      maps: {
        day: dependencies.maps.get('day').contentVersion,
        night: dependencies.maps.get('night').contentVersion,
      },
    };
    const body: DynamicEnvelope<BootstrapData> = {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      responseIdentity: createResponseIdentity([
        'bootstrap', dependencies.config.mode, snapshot.identity, decidedAt, JSON.stringify(contentVersions),
      ]),
      decidedAt,
      serverTime: decidedAt,
      runtime: {
        mode: dependencies.config.mode,
        surface: validation ? 'demonstration' : 'public',
        availability: 'available',
      },
      gates: dependencies.exposure.public,
      sourceHealth: toSourceHealthDtos(snapshot.sourceHealth),
      provenance: toProvenanceDtos(snapshot.provenance),
      ...(validation ? { demonstrationLabel: DEMONSTRATION_LABEL } : {}),
      data: { productName: 'NYC Subway Tracker', unofficial: true, contentVersions },
    };
    sendNoStoreJson(response, 200, body);
  };
}

function captureClock(dependencies: AppDependencies): Date {
  const value = dependencies.clock.now();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('Clock returned an invalid instant');
  return new Date(value.getTime());
}
