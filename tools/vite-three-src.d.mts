/** Types for `tools/vite-three-src.mjs`, so `vite.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Plugin } from 'vite';

/** The environment variable that turns the plugin on (`on`); since release 75 a build without it is the stock `three` build. */
export declare const THREE_SRC_ENV: 'PYREFLY_THREE_SRC';
/** What the bare `three` resolves to in a build. */
export declare const THREE_SRC_ENTRY: 'three/src/Three.js';
/** Is the plugin on? Off by default since release 75 (INT-3): `PYREFLY_THREE_SRC=on` is the one thing that turns it on. */
export declare function threeSrcOn(env?: Record<string, string | undefined>): boolean;
/** `three`'s own shader step: each glsl template literal becomes a JSON string without its comments and blank-line runs. Unchanged when the code has no such literal. */
export declare function minifyGlsl(code: string): string;
/** The Vite plugin (build only): `three` resolves to its source modules and their shaders are minified as `three`'s build does. `env` is injectable for tests. */
export declare function pyreflyThreeSrc(options?: { env?: Record<string, string | undefined> }): Plugin;
