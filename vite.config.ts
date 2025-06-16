import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    host: true,
    port: 10000,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
