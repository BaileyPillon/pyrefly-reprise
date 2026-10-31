/**
 * The dev server checks `public/fx` itself (release 69 `r69-fix`; both games, shared dev plumbing; serve only, nothing in a build or a preview).
 *
 * `public/fx` (eye-candy B's depth maps, `tools/fx-assets.mjs`) is gitignored, so a worktree, a `git archive` copy or a tree made by `tools/mirror-tree.mjs` that did not link it has none. The game then asks for
 * `fx/<backdrop>/depth.png`, the dev server answers with `index.html`, B logs "depth plates unavailable" and draws NO plates and NO lamps: Chapter I's first menu at 1600 x 900 differs from the shipped frame in
 * 20 to 23 percent of its pixels (the centre cell 23 to 27 luma darker), with no error in the console. `npm run dev` runs `node tools/fx-assets.mjs ensure --warn` as its `predev`, but `npx vite --port 5190` (the
 * fallback AGENTS.md names), `node_modules/.bin/vite` and every tool that starts its own server skip `predev`, so a lane that started its server that way compared a plate-less frame with a shipped one for a day.
 *
 * This plugin runs the same command once when the dev server is configured: it verifies `public/fx` against the recorded list and the room registry, restores what is missing from the backup, and prints
 * what it did. `--warn` means a failure is a printed warning, never a stopped server. Nothing here deletes a file (the tool only copies).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'fx-assets.mjs');

/** The arguments of the one call the plugin makes: exactly `npm run dev`'s `predev` step. */
export const FX_ENSURE_ARGS = Object.freeze(['ensure', '--warn']);

/** Run `node tools/fx-assets.mjs <args>` in this tree, its output on the server's own console. */
export function runFxAssets(args) {
  const run = spawnSync(process.execPath, [TOOL, ...args], { stdio: 'inherit' });
  return run.status ?? 1;
}

/** The Vite plugin: `apply: 'serve'` and `configureServer` only (no build hook, no preview hook). `run` is injectable for tests. */
export function pyreflyFxAssets({ run = runFxAssets } = {}) {
  return {
    name: 'pyrefly-fx-assets',
    apply: 'serve',
    configureServer() {
      try {
        run([...FX_ENSURE_ARGS]);
      } catch (error) {
        console.log(`fx-assets: the check could not run (${error?.message ?? error}); the dev server goes on without it`);
      }
    },
  };
}
