/**
 * The conference-demo playtest server's Tidus switch, T1 or T2 (`vite.demo.config.ts`; the dev server and `vite preview` of THAT config only, never `vite.config.ts` and never a build).
 *
 * Bailey (2026-10-22): Tidus "show me both Thursday". T1 is every Tidus painting locked to the darker live idle (the art mirror `public/art` points at); T2 is the brighter idle with the shorts,
 * and its 13 poses locked to it (a folder of 14 paintings, `D:/pyrefly-art-motion-t2/characters/tidus` while that mirror is up, else `D:/pyrefly-art-motion-t2-tidus-stash`; `PYREFLY_TIDUS_T2`
 * names another). The game cannot swap one figure's paintings at run time (its registration rows are compiled in), but Tidus's rows (scale, stance, head box) are IDENTICAL in T1 and T2, only
 * each painting's sha and overlap record differ and no code reads those: so the whole switch is which FILE answers `/art/characters/tidus/<file>`.
 *
 * - The address says which: `?tidus=t1` or `?tidus=t2` on the page sets the cookie `pyrefly_tidus`, which the art requests then carry. No word: the cookie decides, else T1.
 * - T2 answers a file the T2 folder has; a file it lacks falls through to T1 (nothing breaks). Every T2 answer is `Cache-Control: no-store`, so the browser never keeps a T2 body under a T1 URL.
 * - Every `/art/characters/tidus/` answer carries `X-Pyrefly-Tidus: t1|t2`, which the playtest switchboard reads to tell Bailey which Tidus he is looking at.
 * - Read-only (GET and HEAD), one folder, no `..`, no backslash: a request that is not a plain file name in that folder is not touched.
 *
 * A production build is not served this way (it ships WebP derivatives of T1); to look at T2 in a build, make a build with the T2 folder as `characters/tidus`.
 * Game case: FFX only (Tidus); shared dev plumbing.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const TIDUS_PREFIX = '/art/characters/tidus/';
export const TIDUS_COOKIE = 'pyrefly_tidus';
const CANDIDATES = ['D:/pyrefly-art-motion-t2/characters/tidus', 'D:/pyrefly-art-motion-t2-tidus-stash'];
const TYPES = { '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp' };

/** The folder holding the T2 Tidus, or null. */
export function t2Folder(env = process.env) {
  const named = env['PYREFLY_TIDUS_T2'];
  for (const dir of named ? [named, ...CANDIDATES] : CANDIDATES) {
    try {
      if (existsSync(join(dir, 'idle.png'))) return dir;
    } catch {
      /* next */
    }
  }
  return null;
}

/** `t1` or `t2` for a request: the page's `?tidus=` first (it also sets the cookie), then the cookie, else `t1`. */
export function variantOf(url, cookieHeader) {
  const q = /[?&]tidus=(t1|t2)\b/i.exec(url ?? '');
  if (q) return q[1].toLowerCase();
  const c = new RegExp(`(?:^|;\\s*)${TIDUS_COOKIE}=(t1|t2)\\b`, 'i').exec(cookieHeader ?? '');
  return c ? c[1].toLowerCase() : 't1';
}

/** The plain file name of a Tidus art request, or null (anything else is not ours). */
export function tidusFile(pathname) {
  if (!pathname.startsWith(TIDUS_PREFIX)) return null;
  let name;
  try {
    name = decodeURIComponent(pathname.slice(TIDUS_PREFIX.length));
  } catch {
    return null;
  }
  return /^[A-Za-z0-9_@.-]+$/.test(name) && !name.includes('..') ? name : null;
}

export function pyreflyArtVariant() {
  const middleware = (req, res, next) => {
    try {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || typeof req.url !== 'string') return next();
      const at = req.url.search(/[?#]/);
      const pathname = at < 0 ? req.url : req.url.slice(0, at);
      const file = tidusFile(pathname);
      if (file === null) {
        // a page request carrying ?tidus= keeps the choice in a cookie, for the art requests that follow
        const q = /[?&]tidus=(t1|t2)\b/i.exec(req.url);
        if (q && (pathname === '/' || pathname.endsWith('.html'))) res.setHeader('Set-Cookie', `${TIDUS_COOKIE}=${q[1].toLowerCase()}; Path=/; SameSite=Lax; Max-Age=86400`);
        return next();
      }
      const variant = variantOf(req.url, req.headers['cookie']);
      const dir = variant === 't2' ? t2Folder() : null;
      const full = dir ? join(dir, file) : null;
      if (full && existsSync(full) && statSync(full).isFile()) {
        const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
        res.statusCode = 200;
        res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream');
        res.setHeader('Content-Length', String(statSync(full).size));
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Pyrefly-Tidus', 't2');
        if (req.method === 'HEAD') return void res.end();
        return void createReadStream(full).pipe(res);
      }
      res.setHeader('X-Pyrefly-Tidus', 't1');
      if (variant === 't2') res.setHeader('X-Pyrefly-Tidus-Note', dir ? 'file-not-in-t2' : 'no-t2-folder');
      return next();
    } catch {
      return next();
    }
  };
  return {
    name: 'pyrefly-art-variant',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
