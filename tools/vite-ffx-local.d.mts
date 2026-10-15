/** Types for `tools/vite-ffx-local.mjs`, so `vite.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

/** The URL prefix the route answers under (after Vite's base). */
export declare const FFX_LOCAL_ROUTE: '/__ffx-local/';
/** The environment variable that names the folder served. */
export declare const FFX_LOCAL_ENV: 'PYREFLY_FFX_LOCAL';
/** The folder served when the variable is not set. */
export declare const FFX_LOCAL_DEFAULT_ROOT: string;
/** The folder served: the environment's, else the default. */
export declare function ffxLocalRoot(env?: Record<string, string | undefined>): string;
/** The regular file a request path names inside `root` after every symlink is resolved, or null. Never throws. */
export declare function resolveInside(root: string, rel: string): Promise<{ file: string; size: number } | null>;
/** The connect middleware behind the route; `root` pins the folder (tests), `base` is Vite's base. A request outside the route goes on to `next()`. */
export declare function ffxLocalMiddleware(options?: { root?: string; base?: string }): (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
/** Dev server only: serves `GET /__ffx-local/*` read-only from the local converted-files folder. No preview server, no build. */
export declare function pyreflyFfxLocal(options?: { root?: string; base?: string }): Plugin;
