import type { Request, Response } from 'express';

import { API_VERSION, SCHEMA_VERSION, type StaticEnvelope } from '../api/contracts';
import { sendImmutableJson, sendNoStoreJson } from '../api/http';
import type { AppDependencies } from '../bootstrap';
import { assertExactQuery, parseApiIdentifier, parseSearchRequest } from '../api/request-validation';

export function catalogHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    assertExactQuery(request, []);
    const contentVersion = parseApiIdentifier(request.params.contentVersion, 'catalog content version');
    if (contentVersion !== dependencies.catalog.contentVersion) {
      sendNoStoreJson(response, 404, { error: { code: 'not_found', message: 'Resource not found.' } });
      return;
    }
    const body: StaticEnvelope<{ readonly complexes: ReturnType<AppDependencies['catalog']['all']> }> = {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: dependencies.catalog.contentVersion,
      data: { complexes: dependencies.catalog.all() },
    };
    sendImmutableJson(request, response, body);
  };
}

export function searchHandler(dependencies: AppDependencies) {
  return (request: Request, response: Response): void => {
    const { query, limit } = parseSearchRequest(request);
    sendNoStoreJson(response, 200, {
      apiVersion: API_VERSION,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: dependencies.catalog.contentVersion,
      query,
      results: dependencies.catalog.search(query, limit),
    });
  };
}
