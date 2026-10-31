/** Types for `tools/vite-fx-assets.mjs`, so `vite.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Plugin } from 'vite';

/** The arguments of the one call the plugin makes: exactly `npm run dev`'s `predev` step (`node tools/fx-assets.mjs ensure --warn`). */
export declare const FX_ENSURE_ARGS: readonly ['ensure', '--warn'];
/** Run `node tools/fx-assets.mjs <args>` in this tree, its output on the server's own console; the exit status. */
export declare function runFxAssets(args: readonly string[]): number;
/** Dev server only: checks `public/fx` (the depth maps) once when the server is configured, restoring what is missing from the backup. No preview server, no build. `run` is injectable for tests. */
export declare function pyreflyFxAssets(options?: { run?: (args: string[]) => number }): Plugin;
