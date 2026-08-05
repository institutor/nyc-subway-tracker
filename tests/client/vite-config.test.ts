// @vitest-environment node

import { describe, expect, it } from 'vitest';

import viteConfig from '../../vite.config';

describe('client development server', () => {
  it('proxies only versioned API requests so the client API module remains loadable', () => {
    expect(viteConfig.server?.proxy).toEqual({
      '/api/v1': 'http://localhost:3000',
    });
  });
});
