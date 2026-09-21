import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Dev server for the three learning sites (`docs/plans/learning-sites.md`).
 * Separate from the game's own `vite.config.ts`: this root never touches
 * `src/`, `public/`, or the game's `dist/`.
 *
 * `publicDir` points at the game's own `public/` so `/art/**` and
 * `/fonts/**` resolve in dev without copying anything. `copyPublicDir` is
 * false on build so the 368 MB `public/art/` tree never lands in
 * `dist-learn` — the published site reads art and fonts from the game's own
 * deploy instead (`learn/shared/urls.ts`).
 */
export default defineConfig({
  root: import.meta.dirname,
  publicDir: '../public',
  server: {
    host: '127.0.0.1',
    port: 5310,
    strictPort: true,
    fs: {
      // learn/** imports ../src/battle and ../src/data (both pure, no DOM).
      allow: ['..'],
    },
  },
  build: {
    target: 'es2022',
    outDir: '../dist-learn',
    copyPublicDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        atlas: resolve(import.meta.dirname, 'atlas/index.html'),
        studio: resolve(import.meta.dirname, 'studio/index.html'),
        exploded: resolve(import.meta.dirname, 'exploded/index.html'),
      },
    },
  },
});
