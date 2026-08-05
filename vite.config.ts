import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  '/api/v1': 'http://localhost:3000',
};

const serviceWorkerSource = fileURLToPath(new URL('./public/sw.js', import.meta.url));

function precacheBuiltShell(): Plugin {
  return {
    name: 'subway-shell-precache',
    apply: 'build',
    enforce: 'post',
    writeBundle(outputOptions, bundle) {
      const buildAssets = Object.values(bundle)
        .map(({ fileName }) => fileName.replaceAll('\\', '/'))
        .filter((fileName) => /^assets\/[A-Za-z0-9_.-]+\.(?:css|js|png|svg|woff|woff2)$/.test(fileName))
        .map((fileName) => `/${fileName}`)
        .sort();
      const source = readFileSync(serviceWorkerSource, 'utf8');
      const marker = 'self.__SUBWAY_BUILD_ASSETS__';
      if (source.split(marker).length !== 2) throw new Error('Service-worker build asset marker is invalid.');
      const outputDirectory = outputOptions.dir ?? resolve(dirname(serviceWorkerSource), '../dist/client');
      writeFileSync(resolve(outputDirectory, 'sw.js'), source.replace(marker, JSON.stringify(buildAssets)), 'utf8');
    },
  };
}

export default defineConfig({
  root: 'src/client',
  publicDir: '../../public',
  plugins: [react(), precacheBuiltShell()],
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
