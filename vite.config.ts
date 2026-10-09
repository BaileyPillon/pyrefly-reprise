import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { BTS_LIVE } from './src/app/changelog/behindTheScenes.ts';
import { pyreflyArtDerive } from './tools/art-derive-plugin.mjs';
import { releaseFromEnv } from './tools/build-stamp.mjs';
import { SOURCEMAP_DIR_ENV, keepSourceMaps, pruneUnshipped } from './tools/dist-filter.mjs';
import { pyreflyArtAtSign } from './tools/vite-art-at.mjs';

/** The base a production build is served from. Also used by tools/screenshot.mjs. */
export const PROD_BASE = process.env.BASE_PATH ?? '/pyrefly-reprise/';

/** Where a build writes the licence texts of every bundled dependency (three.js's MIT notice among them). */
export const THIRD_PARTY_LICENCES = 'third-party-licenses.md';

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
 * never ship (PR-0100, PR-0173; the rule is `tools/dist-filter.mjs`), and
 * neither does any source map (PR-0328, D-335). Pruned after the build, so
 * `npm run build` and `npm run deploy` both leave them out; the dev server
 * still serves them for local auditions. When `sourceMapDir` is set the maps
 * are copied there first; a copy that fails is a warning, never a failed build.
 */
function distFilter(sourceMapDir: string | null): Plugin {
  let outDir = 'dist';
  return {
    name: 'pyrefly-dist-filter',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (sourceMapDir) {
        try {
          const kept = keepSourceMaps(outDir, sourceMapDir);
          this.info?.(`dist-filter: kept ${kept.length} source map(s) in ${sourceMapDir}, none ship`);
        } catch (err) {
          this.warn?.(`dist-filter: could not keep the source maps in ${sourceMapDir}: ${(err as Error).message}`);
        }
      }
      const removed = pruneUnshipped(outDir);
      if (removed.length) this.info?.(`dist-filter: left out ${removed.length} unshipped file(s)`);
    },
  };
}

/**
 * The short commit this build is made from, for the hidden mark key's record (`src/app/markMoment.ts`, release 39.1, N1): the build a marked moment came
 * from. `PYREFLY_BUILD_SHA` overrides it; `unknown` where there is no git (a source archive). Never fails a build.
 */
function buildSha(): string {
  const set = process.env['PYREFLY_BUILD_SHA'];
  if (set) return set;
  try {
    return execSync('git rev-parse --short=8 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * The release name this build is stamped with, for the title screen's build number (`src/app/changelog/buildInfo.ts`,
 * Bailey, 2026-10-08). `npm run deploy -- --release=39.5` sets `PYREFLY_RELEASE`; a dev server or a hand-run build sets
 * nothing and the title shows the commit alone. A value that is not a release name stops the build (`tools/build-stamp.mjs`).
 */
function releaseName(): string {
  return releaseFromEnv(process.env);
}

export default defineConfig(({ command, isPreview }) => {
  const base = command === 'build' || isPreview ? PROD_BASE : '/';
  // PR-0328, D-335: no source map ever ships. The variable SOURCEMAP_DIR_ENV names
  // the folder a build keeps its maps in (the deploy sets it to
  // D:/Tools/pyrefly-sourcemaps/<sha>): then the bundler writes them 'hidden' (no
  // sourceMappingURL comment in the code), the dist-filter plugin copies them there
  // and prunes them from the build. Unset, none are made at all (nothing reads them).
  const sourceMapDir = process.env[SOURCEMAP_DIR_ENV] || null;

  return {
    base,
    define: {
      __PYREFLY_BUILD_SHA__: JSON.stringify(buildSha()),
      __PYREFLY_RELEASE__: JSON.stringify(releaseName()),
      // BEHIND THE SCENES (Bailey, 2026-10-08): the page's switch, from the one source constant, so a build with it off sees a
      // literal `false` at the page's single dynamic import and ships none of the page (src/app/screens/frontend/titleInfo.ts).
      __PYREFLY_BTS__: JSON.stringify(BTS_LIVE),
    },
    // Release 38 (r38-bytes): a production build ships the painted art as lossless WebP, derived from the PNG masters, which
    // stay in public/art untouched (`tools/art-derive.mjs`; `PYREFLY_ART_WEBP=off` ships the PNGs as before). Dev serves PNG.
    // Release 39: the game asks for a master as `idle%402x.png` (ArtShipped.ts); dev and preview serve it from `idle@2x.png` (tools/vite-art-at.mjs).
    plugins: [distFilter(sourceMapDir), pyreflyArtDerive(), pyreflyArtAtSign()],
    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: sourceMapDir ? 'hidden' : false,
      chunkSizeWarningLimit: 1200,
      // The MIT licence of three.js (and of anything else bundled) asks its
      // copyright and permission notice to travel with the code. The minifier
      // drops every comment by default, so keep the `@license` headers in the
      // bundle and ship the full licence texts beside it.
      license: { fileName: THIRD_PARTY_LICENCES },
      rolldownOptions: { output: { comments: { legal: true } } },
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
