import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { pruneUnshipped } from './tools/dist-filter.mjs';

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
/**
 * Audition candidates, raw renders and numbered art takes sit in `public/` but
 * never ship (PR-0100, PR-0173; the rule is `tools/dist-filter.mjs`). Pruned
 * after the build, so `npm run build` and `npm run deploy` both leave them out;
 * the dev server still serves them for local auditions.
 */
function distFilter(): Plugin {
  let outDir = 'dist';
  return {
    name: 'pyrefly-dist-filter',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const removed = pruneUnshipped(outDir);
      if (removed.length) this.info?.(`dist-filter: left out ${removed.length} unshipped file(s)`);
    },
  };
}

export default defineConfig(({ command, isPreview }) => {
  const base = command === 'build' || isPreview ? PROD_BASE : '/';

  return {
    base,
    plugins: [distFilter()],
    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      chunkSizeWarningLimit: 1200,
    },
    // Advisor v4's search runs in a module worker (`src/app/advisorV4/worker.ts`, `type: 'module'`);
    // ES output lets its import graph split like the page's.
    worker: {
      format: 'es',
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
