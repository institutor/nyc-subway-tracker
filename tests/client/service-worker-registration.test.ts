// @vitest-environment node

import { describe, expect, test, vi } from 'vitest';

import { registerSubwayServiceWorker } from '../../src/client/pwa/register-service-worker';

describe('subway service-worker registration', () => {
  test('registers the fixed offline shell scope without consulting a remote bootstrap', async () => {
    const registration = {} as ServiceWorkerRegistration;
    const register = vi.fn(async () => registration);

    await expect(registerSubwayServiceWorker({ serviceWorker: { register } })).resolves.toBe(registration);
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
  });

  test('leaves unsupported and failed registration as a non-blocking capability absence', async () => {
    await expect(registerSubwayServiceWorker({})).resolves.toBeUndefined();
    await expect(registerSubwayServiceWorker({
      serviceWorker: { register: async () => { throw new Error('blocked'); } },
    })).resolves.toBeUndefined();
  });
});
