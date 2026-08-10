import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { createApp } from './app';
import { createProductionDependencies } from './bootstrap';
import { loadServerConfig } from './config';
import { createProductionNotificationPipeline } from './notifications/notification-runtime';
import { createVapidStore } from './notifications/vapid-store';

export async function startProductionServer(requestedPort?: number) {
  loadCheckoutEnvironment();
  const port = requestedPort ?? Number(process.env.PORT ?? 3000);
  const config = loadServerConfig();
  const notificationPipeline = await createProductionNotificationPipeline({
    stage: 'disabled',
    capture: () => [],
    loadVapid: () => createVapidStore(join(config.dataDirectory, 'notifications', 'vapid.json')).loadOrCreate(),
  });
  const dependencies = createProductionDependencies(config, { notifications: notificationPipeline.runtime });
  const app = createApp(dependencies);
  const schedule = notificationPipeline.start();
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Server listening on 127.0.0.1:${port}`);
  });
  server.once('close', () => schedule.stop());
  return server;
}

function loadCheckoutEnvironment(): void {
  try {
    loadEnvFile(resolve('.env'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startProductionServer();
}
