// @vitest-environment node

import { describe, expect, it } from 'vitest';

import viteConfig from '../../vite.config';

describe('client development server', () => {
  it('proxies only versioned API requests so the client API module remains loadable', () => {
    expect(viteConfig.server?.proxy).toEqual({
      '/api/v1': 'http://localhost:3000',
    });
  });

  it('uses the same narrow API boundary for production-preview offline testing', () => {
    expect(viteConfig.preview?.proxy).toEqual({
      '/api/v1': 'http://localhost:3000',
    });
  });

  it('copies only the reviewed root PWA assets into the production client', () => {
    expect(viteConfig.publicDir).toBe('../../public');
  });
});
