import { defineConfig } from 'vite';

export default defineConfig({
  base: '/super-miti-egizi/',
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 },
});
