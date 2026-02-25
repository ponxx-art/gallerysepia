import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gallerysepia/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist'
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
