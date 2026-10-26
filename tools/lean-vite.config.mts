/**
 * A LEAN PRODUCTION BUILD, for timing work on a PC whose D: drive cannot hold a second 11 GB `dist` (post-conference lane "post-fight-start", both games; build plumbing only, nothing ships from it).
 *
 *   BASE_PATH=/ PYREFLY_RELEASE=64 PYREFLY_BUILD_SHA=e9907cad npx vite build --config tools/lean-vite.config.mts --outDir <dir> --emptyOutDir
 *
 * It is `vite.config.ts` exactly (the same define constants, the same plugins, the same minifier), with the two things that make the output 11 GB left out: `copyPublicDir: false` (no art, audio, fonts or
 * depth maps are copied) and the art plugin's `closeBundle` (the step that writes the derived WebP files and redacts the sidecars into the output). The plugin's `config` hook still plans the derivation
 * from `public/art`, so `__PYREFLY_ART_WEBP__` and `__PYREFLY_ART_THUMBS__` in the bundle are what a full build writes, which is what makes the JavaScript the same bytes: building the commit of release 64 with its
 * deploy environment reproduces the live `index-BygGxbJE.js`, name and hash (checked 2026-10-26 in the lane's notes).
 *
 * What it leaves to the caller is every file a full build would copy from `public/`: `tools/overlay-static.mjs` serves this output over a full build of the same art (for example the live artifact), so
 * a lean `assets/` and `index.html` run against the real paintings, sounds and fonts. Never deployed, never reviewed: a deploy builds with `vite.config.ts` (`tools/deploy-pages.mjs`).
 */
import { defineConfig, type Plugin } from 'vite';

import base from '../vite.config.ts';

export default defineConfig(async (env) => {
  const cfg = await (typeof base === 'function' ? base(env) : base);
  const plugins = (cfg.plugins ?? []).map((p) => (p && !Array.isArray(p) && (p as Plugin).name === 'pyrefly-art-derive' ? ({ ...(p as Plugin), closeBundle: undefined } as Plugin) : p));
  return { ...cfg, plugins, build: { ...cfg.build, copyPublicDir: false } };
});
