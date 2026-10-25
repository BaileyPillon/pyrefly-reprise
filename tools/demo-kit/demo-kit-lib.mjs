/**
 * The conference demo kit's pure parts (R61, Bailey, 2026-10-20: "I demo my game in a week at a huge gaming conference"; his pick "This PC":
 * the demo runs on his desktop, from an offline copy, so it does not need the conference wifi). No game code, no network, no Windows calls:
 * everything here is a function of its arguments, so `tests/unit/demo-kit.test.ts` runs it without a server or a browser.
 *
 * Used by `serve-offline.mjs` (the static server), `demo-kit.mjs` (start / stop / reset / status) and `fetch-site.mjs` (the downloader).
 * Game case: both (tooling; the demo chapters are Chapter I, FFX, and Chapter IV, FFX-2; nothing here knows a game).
 */

import { createHash } from 'node:crypto';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';

/** Files a manifest lists that no address serves (Cloudflare reads them at deploy time). `tools/artifact-manifest.mjs` calls the same list HOST_READ_FILES. */
export const HOST_READ_FILES = Object.freeze(['_headers']);

/** The address the kit opens: `?demo=1` is the demo switch (`src/app/demoMode.ts`; kept for the tab, so a reload keeps it). */
export const DEMO_QUERY = '?demo=1';

/**
 * The conference pack's switch, added to the address after `?demo=1` (2026-10-24; Bailey's booth is the conference build): `?pack=demo` turns on the F1 HUD, the sound pass, the pro look / camera / staging,
 * the boss re-cut, the booth cards and the fight prebuild (`packDemo` in `src/engine/motion/DemoGate.ts` reads it). With `?demo=1` alone the booth shows the plain demo (release 62). `--plain` opens that.
 */
export const PACK_QUERY = '&pack=demo';

/** The port the live dev setup and `npm run preview` already use; a busy port falls through to the next free one. */
export const DEFAULT_PORT = 5173;

/** Content types for everything the site ships (the file types of the artifact manifest, plus the usual few). */
export const CONTENT_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
});

/** The content type of a path by its extension (case-insensitive); anything unknown is plain bytes. */
export function contentTypeOf(path) {
  const dot = path.lastIndexOf('.');
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  const ext = dot > slash ? path.slice(dot).toLowerCase() : '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * The cache rule of the live site (`public/_headers`): a hashed bundle under `assets/` never changes under its name; everything else is asked about every time and answered 304.
 * Pure on the URL path.
 */
export function cacheControlOf(urlPath) {
  return urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate';
}

/**
 * The file a URL path names under `root`, or null when it names none that is allowed. The path is percent-decoded once (the live host serves `idle%404x.png` for the file `idle@4x.png`);
 * a NUL byte, a `..` segment, a backslash, a drive letter or anything that resolves outside `root` is refused. `/` and a trailing slash name the folder's index.html.
 */
export function safeJoin(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || decoded.includes('\\') || /^\/?[A-Za-z]:/.test(decoded)) return null;
  const segments = decoded.split('/').filter((s) => s !== '');
  if (segments.some((s) => s === '..' || s === '.')) return null;
  const rel = segments.length === 0 || decoded.endsWith('/') ? [...segments, 'index.html'] : segments;
  const base = resolve(root);
  const full = resolve(base, ...rel);
  if (full !== base && !full.startsWith(base.endsWith(sep) ? base : base + sep)) return null;
  return normalize(full);
}

/**
 * `Range: bytes=a-b` against a file of `size` bytes: `{ start, end }` (inclusive) for a satisfiable single range, `'unsatisfiable'` for one that starts past the end, or null for no range header, a
 * header that is not a single bytes range (served whole, as a server may) or an empty file.
 */
export function parseRange(header, size) {
  if (!header || size <= 0) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start;
  let end;
  if (m[1] === '') {
    const n = Number(m[2]);
    if (n === 0) return 'unsatisfiable';
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}

/** The address the kit opens for a port: `http://127.0.0.1:<port>/?demo=1`. The server listens on the loopback only. */
export function demoUrl(port, extra = '') {
  return `http://127.0.0.1:${port}/${DEMO_QUERY}${extra}`;
}

/**
 * The address the booth opens: `http://127.0.0.1:<port>/?demo=1&pack=demo` (the conference pack on), or with `plain` the plain demo `http://127.0.0.1:<port>/?demo=1`.
 * `start` writes it into the kit's state file and `reset` reopens that one, so a reset between visitors keeps whichever the day started with.
 */
export function boothUrl(port, { plain = false } = {}) {
  return demoUrl(port, plain ? '' : PACK_QUERY);
}

/** Is this the plain demo's address (no `pack=demo` key)? Pure on the text; a state file from before the pack default reads as plain. */
export function isPlainBoothUrl(url) {
  return !/[?&]pack=demo(?:&|#|$)/.test(url);
}

/**
 * Chrome's and Edge's switches for a booth: full-screen kiosk, a profile of its own (so nothing of Bailey's own browsing is touched and a reset is a folder delete), no first-run pages,
 * no restore-session or translate bubbles, sound without a first click, no pinch zoom or swipe-back, a disk cache small enough not to keep 10 GB of paintings twice.
 */
export function browserArgs({ url, profileDir, kiosk = true }) {
  const args = [
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate,TranslateUI',
    '--disable-session-crashed-bubble',
    '--hide-crash-restore-bubble',
    '--noerrdialogs',
    '--disable-infobars',
    '--autoplay-policy=no-user-gesture-required',
    '--overscroll-history-navigation=0',
    '--disable-pinch',
    '--disk-cache-size=1073741824',
    '--check-for-update-interval=31536000',
  ];
  if (kiosk) args.push('--kiosk', '--start-fullscreen');
  else args.push('--window-size=1600,900');
  args.push(url);
  return args;
}

/**
 * What a fresh visitor's reset deletes from the browser profile: the game's save (`localStorage`), its per-tab memory (`sessionStorage`, which holds the demo's seed counters), IndexedDB and any restored session,
 * under the profile's `Default` folder. **Not** the caches: the GPU's compiled-shader cache and the HTTP cache stay, so the next visitor's first fight starts warm (a cold first fight stalls the page for about
 * 2 s while the graphics driver builds the scene's shaders: `docs/handoff/r61-booth.md`). `stop --wipe` and `start --cold` delete the whole profile.
 */
export const SAVE_PATHS = Object.freeze(['Default/Local Storage', 'Default/Session Storage', 'Default/IndexedDB', 'Default/Sessions', 'Default/Service Worker', 'Default/Sync Data']);

/** Where a browser may live, in the order the kit prefers: Chrome, then Edge. Pure on the environment it is given. */
export function browserCandidates(env = process.env) {
  const pf = env['ProgramFiles'] ?? 'C:\\Program Files';
  const pf86 = env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
  const local = env['LOCALAPPDATA'] ?? '';
  const list = [
    { name: 'chrome', path: join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe') },
    { name: 'chrome', path: join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe') },
    { name: 'edge', path: join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
    { name: 'edge', path: join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
  ];
  if (local) list.splice(2, 0, { name: 'chrome', path: join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') });
  return list;
}

/** The first browser of `prefer` ('chrome' | 'edge' | undefined for either) that exists, or null. `exists` is injected so a test needs no disk. */
export function findBrowser(exists, prefer, env = process.env) {
  for (const c of browserCandidates(env)) {
    if (prefer && c.name !== prefer) continue;
    if (exists(c.path)) return c;
  }
  return null;
}

/** Where the kit keeps its state, its browser profile and (by default) the offline copy of the site: one folder, on the system drive, outside every repo. */
export function kitHome(env = process.env) {
  const base = env['ECHOES_DEMO_HOME'] ?? join(env['LOCALAPPDATA'] ?? env['USERPROFILE'] ?? '.', 'EchoesDemoKit');
  return resolve(base);
}

/** The folder the offline copy lives in unless `--dir` or `ECHOES_DEMO_SITE` says otherwise. */
export function defaultSiteDir(env = process.env) {
  return env['ECHOES_DEMO_SITE'] ? resolve(env['ECHOES_DEMO_SITE']) : join(kitHome(env), 'site');
}

/** sha256 of some bytes, hex. */
export function sha256hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** A human size: 1536 -> "1.5 KB", 10961893980 -> "10.21 GB" (binary units, the way the disk tools print them). */
export function formatBytes(n) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 ? v : v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}

/** The resolution tier a shipped file belongs to: `idle@4x.png` is 4, `idle@2x.webp` is 2, anything else (the approved 1x painting, audio, code) is 1. */
export function tierOf(path) {
  const m = /@([2-9])x\.[A-Za-z0-9]+$/.exec(path);
  return m ? Number(m[1]) : 1;
}

/**
 * The address of a manifest path on a host: every segment percent-encoded (`@` becomes `%40`: the host answers a raw `@` with a redirect, the encoded form with the file).
 * `base` ends with a slash or not, either way.
 */
export function urlFor(base, path) {
  const b = base.endsWith('/') ? base : `${base}/`;
  return b + path.split('/').map((s) => encodeURIComponent(s)).join('/');
}

/**
 * Which files of an artifact manifest to fetch. Host-read files are never fetched (no address serves them). `only` keeps the paths that start with any of its prefixes (exact file names count as
 * prefixes of themselves); `maxTier` leaves out the `@3x` and `@4x` masters above it (the engine falls back one tier down when a master does not load, `src/engine/ArtTier.ts`); `limit` keeps the first n
 * (sorted), for a test. Returns the sorted paths.
 */
export function selectFiles(manifest, { only = [], maxTier = 9, limit = Infinity } = {}) {
  const out = Object.keys(manifest.files)
    .filter((p) => !HOST_READ_FILES.includes(p))
    .filter((p) => only.length === 0 || only.some((o) => p.startsWith(o)))
    .filter((p) => tierOf(p) <= maxTier)
    .sort();
  return out.slice(0, limit);
}

/** The bytes a selection comes to, from the manifest. */
export function bytesOf(manifest, paths) {
  return paths.reduce((sum, p) => sum + (manifest.files[p]?.bytes ?? 0), 0);
}

/**
 * Is a folder path safe to write under? Absolute, not a drive root, not above the working directory's drive: the downloader writes only below a folder the user named, and a manifest path
 * (which could name `..`) never leaves it.
 */
export function destPath(dir, manifestPath) {
  if (isAbsolute(manifestPath) || manifestPath.split('/').some((s) => s === '..' || s === '' || s.includes('\\') || s.includes('\0') || /^[A-Za-z]:/.test(s))) return null;
  const base = resolve(dir);
  const full = resolve(base, ...manifestPath.split('/'));
  return full.startsWith(base.endsWith(sep) ? base : base + sep) ? full : null;
}
