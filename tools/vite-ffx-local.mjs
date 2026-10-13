/**
 * The dev server's read-only route to Bailey's own converted FFX files, `GET /__ffx-local/*` (the hidden Fayth chapter's `ffx` skin; `docs/plans/fayth-3d.md`, "Two skins, one scene").
 *
 * The files are his own copy of the game, converted on his PC to glTF and PNG under `D:\Tools\ffx-parity\assets\runtime\` (`PYREFLY_FFX_LOCAL` overrides the folder). They are local only and **never in
 * the repo, in `public/`, in `dist/` or on the site** (AGENTS.md hard rule 8: "No retail Square Enix assets, ever"). So this is the one way they reach the game, and it is built so it cannot ship:
 *
 * - **`apply: 'serve'` and `configureServer` only.** No `configurePreviewServer`, so `vite preview` (which serves the production build) never mounts it; no build hook of any kind, and `apply: 'serve'`
 *   keeps the plugin out of `vite build` altogether. A production bundle therefore has neither the route nor a file behind it (`tests/unit/ffx-local-guard.test.ts` pins all of this, with Vite's own
 *   resolution of the plugin for `build` and for `serve`).
 * - **Read-only.** `GET` and `HEAD` only (anything else is 405), `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. Nothing is written, listed or indexed: a directory is a 404.
 * - **Only files inside the root.** The request path is decoded once; an absolute path, a drive letter, a backslash, a NUL byte or any `..` segment is refused outright; then the root and the file are
 *   both resolved through their symlinks and the file must still lie inside the root, so a link out of the folder serves nothing either.
 * - **A missing root is a 404, never a crash.** Every failure answers 404 with a short text body; nothing throws into Vite's middleware chain.
 *
 * The page asks `src/engine/ffx3d/localAssets.ts` (`probeFfxLocal`), which does nothing outside `import.meta.env.DEV`.
 *
 * Game case: FFX only (the files are FFX's); the plugin is shared dev plumbing and inert without the folder.
 */

import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';

/** The URL prefix the route answers under (after Vite's base, which is `/` in dev). */
export const FFX_LOCAL_ROUTE = '/__ffx-local/';

/** The environment variable that names the folder served. */
export const FFX_LOCAL_ENV = 'PYREFLY_FFX_LOCAL';

/** The folder served when the variable is not set: where the converter writes its output. */
export const FFX_LOCAL_DEFAULT_ROOT = 'D:/Tools/ffx-parity/assets/runtime';

/** What the converter writes and the game reads: models, textures and the manifest. Anything else is served as plain bytes. */
const TYPES = {
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
};

/** The folder served: the environment's, else the default. Read on every request, so the variable can change without a restart. */
export function ffxLocalRoot(env = process.env) {
  const named = env[FFX_LOCAL_ENV];
  return typeof named === 'string' && named.trim() !== '' ? named : FFX_LOCAL_DEFAULT_ROOT;
}

/**
 * The file a request path names, if and only if it is a regular file inside `root` after every symlink is resolved. `rel` is the part of the URL after the route prefix (percent-encoded, no query).
 * Returns `{ file, size }` or null: never throws.
 */
export async function resolveInside(root, rel) {
  try {
    let decoded;
    try {
      decoded = decodeURIComponent(rel);
    } catch {
      return null; // a malformed percent escape
    }
    if (decoded === '' || decoded.includes('\0')) return null;
    if (decoded.includes('\\') || /^[a-zA-Z]:/.test(decoded) || decoded.startsWith('/') || isAbsolute(decoded)) return null;
    const parts = decoded.split('/');
    if (parts.some((part) => part === '..' || part === '')) return null; // no parent steps, no empty steps (`a//b`)
    const rootReal = await realpath(resolve(root));
    const fileReal = await realpath(resolve(rootReal, ...parts));
    const inside = relative(rootReal, fileReal);
    if (inside === '' || inside === '..' || inside.startsWith('..\\') || inside.startsWith('../') || isAbsolute(inside)) return null;
    const info = await stat(fileReal);
    return info.isFile() ? { file: fileReal, size: info.size } : null;
  } catch {
    return null; // a missing root, a missing file, a permission error: all the same answer
  }
}

function send(res, status, headers, body) {
  res.statusCode = status;
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(body);
}

/**
 * The connect middleware behind the route. `options.root` pins the folder (tests); otherwise it is {@link ffxLocalRoot} on each request. `options.base` is Vite's base (`/` in dev).
 * A request for anything outside the route goes straight on to `next()`.
 */
export function ffxLocalMiddleware(options = {}) {
  const base = (options.base ?? '/').replace(/\/+$/, '');
  const prefix = `${base}${FFX_LOCAL_ROUTE}`;
  return async (req, res, next) => {
    const url = typeof req.url === 'string' ? req.url : '';
    const pathname = url.split(/[?#]/, 1)[0];
    if (!pathname.startsWith(prefix)) return next();
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, { ...headers, Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, 'read-only');
    }
    const found = await resolveInside(options.root ?? ffxLocalRoot(), pathname.slice(prefix.length));
    if (!found) return send(res, 404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }, 'not found');
    res.statusCode = 200;
    for (const [name, value] of Object.entries({ ...headers, 'Content-Type': TYPES[extname(found.file).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': String(found.size) })) res.setHeader(name, value);
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(found.file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  };
}

/** The Vite plugin: the dev server only. */
export function pyreflyFfxLocal(options = {}) {
  return {
    name: 'pyrefly-ffx-local',
    apply: 'serve', // never `vite build`
    configureServer(server) {
      // No `configurePreviewServer`: `vite preview` serves the production build and must not see this route.
      server.middlewares.use(ffxLocalMiddleware({ base: server.config?.base ?? '/', ...options }));
    },
  };
}
