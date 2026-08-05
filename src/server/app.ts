import express from 'express';

import type { AppDependencies } from './bootstrap';
import { boardHandler } from './routes/boards';
import { bootstrapHandler } from './routes/bootstrap';
import { catalogHandler, searchHandler } from './routes/stations';
import { nearbyHandler } from './routes/nearby';
import { statusHandler } from './routes/status';
import { mapOverlayHandler, mapReferenceHandler } from './routes/maps';
import { journeyHandler } from './routes/journeys';
import {
  createApiErrorHandler,
  enforceUrlLimit,
  MAX_JSON_BYTES,
  methodNotAllowed,
  notFound,
  verifyStrictJson,
} from './api/request-validation';

export function createApp(dependencies: AppDependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use(enforceUrlLimit);
  app.use(express.json({ limit: MAX_JSON_BYTES, strict: true, verify: verifyStrictJson }));
  app.get('/api/v1/bootstrap', bootstrapHandler(dependencies));
  app.get('/api/v1/stations/catalog/:contentVersion', catalogHandler(dependencies));
  app.get('/api/v1/stations/search', searchHandler(dependencies));
  app.post('/api/v1/nearby', nearbyHandler(dependencies));
  app.get('/api/v1/status', statusHandler(dependencies));
  app.get('/api/v1/maps/:theme/reference/:contentVersion', mapReferenceHandler(dependencies));
  app.get('/api/v1/maps/:theme/overlay', mapOverlayHandler(dependencies));
  app.post('/api/v1/journeys', journeyHandler(dependencies));
  app.get('/api/v1/stations/:stationId/board', boardHandler(dependencies));
  app.all('/api/v1/bootstrap', methodNotAllowed(['GET']));
  app.all('/api/v1/stations/catalog/:contentVersion', methodNotAllowed(['GET']));
  app.all('/api/v1/stations/search', methodNotAllowed(['GET']));
  app.all('/api/v1/nearby', methodNotAllowed(['POST']));
  app.all('/api/v1/status', methodNotAllowed(['GET']));
  app.all('/api/v1/maps/:theme/reference/:contentVersion', methodNotAllowed(['GET']));
  app.all('/api/v1/maps/:theme/overlay', methodNotAllowed(['GET']));
  app.all('/api/v1/journeys', methodNotAllowed(['POST']));
  app.all('/api/v1/stations/:stationId/board', methodNotAllowed(['GET']));
  app.use(notFound);
  app.use(createApiErrorHandler(dependencies.logger));
  return app;
}
