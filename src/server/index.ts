import { pathToFileURL } from 'node:url';

import { createApp } from './app';
import { createProductionDependencies } from './bootstrap';
import { loadServerConfig } from './config';

export function startProductionServer(port = Number(process.env.PORT ?? 3000)) {
  const dependencies = createProductionDependencies(loadServerConfig());
  const app = createApp(dependencies);
  return app.listen(port, '127.0.0.1', () => {
    console.log(`Server listening on 127.0.0.1:${port}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startProductionServer();
}
