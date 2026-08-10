import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve('tests/e2e/fixture-client'),
  base: '/__validation/',
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: resolve('dist/e2e-client'),
    emptyOutDir: true,
  },
});
