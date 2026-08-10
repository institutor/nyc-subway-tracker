import { mountSubwayApp } from './bootstrap';
import { registerSubwayServiceWorker } from './pwa/register-service-worker';

mountSubwayApp(document.getElementById('root')!);

void registerSubwayServiceWorker();
