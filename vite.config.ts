import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  '/api/v1': 'http://localhost:3000',
};

export default defineConfig({
  root: 'src/client',
  publicDir: '../../public',
  plugins: [react()],
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
