import { defineConfig } from 'vite';

/** The base a production build is served from. Also used by tools/screenshot.mjs. */
export const PROD_BASE = process.env.BASE_PATH ?? '/pyrefly-reprise/';

/**
 * Base path:
 *   - dev (`vite`)                 -> '/'  so http://localhost:5173/ just works
 *   - production build and preview -> PROD_BASE
 *
 * GitHub Pages serves a project site from /<repo>/, hence the default. Preview
 * uses the same base as the build so what Playwright loads is byte-for-byte
 * what Pages will serve. Override with BASE_PATH=/ for a user page or a custom
 * domain.
 */
export default defineConfig(({ command, isPreview }) => {
  const base = command === 'build' || isPreview ? PROD_BASE : '/';

  return {
    base,
    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      chunkSizeWarningLimit: 1200,
    },
    server: {
      port: 5173,
      host: '127.0.0.1',
    },
    preview: {
      port: 4173,
      host: '127.0.0.1',
    },
  };
});
