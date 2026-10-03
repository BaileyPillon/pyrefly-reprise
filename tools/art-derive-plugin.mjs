/**
 * The Vite plugin that puts `tools/art-derive.mjs` into every production build (release 38, "r38-bytes").
 *
 * A build by any route (`npm run build`, `tools/deploy-pages.mjs`'s `vite build --outDir dist-release`, a critic's
 * `vite build --outDir dist-gate`) therefore ships the same art: lossless WebP for each master PNG that it makes smaller, the
 * PNG recompressed where the WebP is not smaller, the masters in `public/art` untouched. The dev server and `vite preview` do
 * not load this plugin (`apply: 'build'`), so dev serves the PNGs and `ArtShipped.ts` maps every URL to itself.
 *
 * Two hooks, in the order a build runs them:
 *   - `config`: plans the derivation BEFORE the bundler starts (encoding what the cache lacks, which is slow only once per
 *     master) and inserts the list of derived masters as the constant `__PYREFLY_ART_WEBP__`, the one thing the run-time mapping
 *     reads (`src/engine/ArtShipped.ts`). The list must be in the bundle, so it cannot wait for the output to exist.
 *   - `closeBundle`: copies each derived file into the output and removes the PNG it replaces, from the OUTPUT only, then
 *     rewrites the names in the written `index.html`. That page preloads the title plate by name (`href` and `imagesrcset`)
 *     before any script runs, and the hint has to name the file the site serves. It is done on the finished file, not in
 *     `transformIndexHtml`: Vite writes `imagesrcset` after the post hooks and a rewrite made there is lost (the reference
 *     audit, `tools/art-verify.mjs`, caught exactly that).
 *
 * `PYREFLY_ART_WEBP=off|partial|safe|all` picks what is derived (default safe); `off` makes the plugin a no-op (the PNGs ship
 * as before): the switch for a live problem.
 *
 * Game case: both (shared build plumbing).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

import { applyPlan, planArtDerivation, resolveCache, resolveScope, shippedList, webpName } from './art-derive-lib.mjs';

/** `art/<...>.png` as it sits in a page, behind any base path. */
const ART_PNG_NAME = /(?<![\w-])art\/[A-Za-z0-9_@.\-/]+?\.png(?![\w])/g;

/** @param {{ scope?: string, cacheDir?: string, jobs?: number }} [options] */
export function pyreflyArtDerive({ scope = resolveScope(), cacheDir = resolveCache(), jobs } = {}) {
  let plan = null;
  let shipped = new Set();
  let outDir = 'dist';
  let applied = false;
  return {
    name: 'pyrefly-art-derive',
    apply: 'build',
    async config(user) {
      const root = resolve(user.root ?? process.cwd());
      const publicDir = user.publicDir === false ? null : resolve(root, user.publicDir ?? 'public');
      if (scope === 'off' || publicDir === null) return { define: { __PYREFLY_ART_WEBP__: '[]' } };
      plan = await planArtDerivation({ publicDir, cacheDir, scope, ...(jobs ? { jobs } : {}), log: (m) => console.log(m) });
      const list = shippedList(plan);
      shipped = new Set(list);
      const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;
      console.log(`[pyrefly-art-derive] scope ${scope}: ${plan.counts.webp} lossless WebP, ${plan.counts.png} recompressed PNG, ${plan.counts.copy} unchanged; art ${mb(plan.bytes.masters)} -> ${mb(plan.bytes.shipped)} (saves ${mb(plan.bytes.saved)})`);
      return { define: { __PYREFLY_ART_WEBP__: JSON.stringify(list) } };
    },
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (plan === null || applied || !existsSync(join(outDir, 'index.html'))) return;
      applied = true;
      const done = applyPlan(outDir, plan);
      // The constant in the bundle names every derived master, so a master whose PNG the build did not copy would be a name with no file.
      if (done.skipped.length) throw new Error(`pyrefly-art-derive: ${done.skipped.length} planned art file(s) are not in the build output, e.g. ${done.skipped.slice(0, 3).join(', ')}`);
      const page = join(outDir, 'index.html');
      const html = readFileSync(page, 'utf8');
      const named = html.replace(ART_PNG_NAME, (name) => (shipped.has(name) ? webpName(name) : name));
      if (named !== html) writeFileSync(page, named);
      console.log(`[pyrefly-art-derive] applied to ${outDir}: ${done.webp} WebP written and their PNGs left out, ${done.png} PNG recompressed${named !== html ? ', index.html names the served files' : ''}`);
    },
  };
}
