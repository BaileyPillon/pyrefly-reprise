/**
 * Which files of a build may be cached for a year (PR-0396, round 25; both games, shared delivery tooling).
 *
 * The round-25 delivery check read `Cache-Control: public, max-age=0, must-revalidate` on the hashed bundle: every return visit
 * asked the server about every file. A year-long `immutable` is safe for exactly one kind of file, one whose NAME changes when its
 * CONTENT does, so a new build can never be served from an old copy. Vite names what it emits under `assets/` that way:
 * `assets/<name>-<hash>.<ext>`, the hash being 8 base64url characters of the content (`index-Chs9J3OY.js`, `index-DiS-CYp9.css`,
 * `worker-CJvtQ5Pf.js`). Nothing else in the site has a hash in its name: `index.html` (which names the bundle, so it must always
 * be asked about), the painted art, the audio, the fonts and the depth maps keep plain names, and so keep Cloudflare's default
 * (`public, max-age=0, must-revalidate` with an ETag, a 304 on a return visit).
 *
 * The shape of a name is NOT enough to call a file hashed. The art has names that look like it (`art/backdrops/road-to-the-farplane.webp`
 * ends in a dash and eight letters), and a year of `immutable` on a file that does change would pin a visitor to the old one. So a
 * file is content-hashed only when it sits under `assets/` AND its name has the shape: the place Vite writes the hashed files to
 * (`build.assetsDir` in `vite.config.ts`, which `tests/unit/cache-class.test.ts` proves with a real Vite build) and the shape it names
 * them with.
 *
 * The rule itself is the one `_headers` the upload gate allows (`VETTED_HEADERS` in `tools/deploy-host.mjs`): the pattern `/assets/*`
 * with `Cache-Control: public, max-age=31536000, immutable`. This module classifies a path, reads a `_headers` text the way
 * Cloudflare does (`*` is a splat that matches anything, slashes included), and `unhashedUnderRule` is the deploy gate's check
 * that every file the rule matches is content-hashed (`prepareCloudflareUpload`), so an unhashed file dropped into `assets/` (a
 * `public/assets/logo.svg`) stops the deploy instead of being cached for a year. Pure: no file reads, no network.
 * Types: cache-class.d.mts.
 */

import { VETTED_HEADERS } from './deploy-host.mjs';

/** The folder Vite writes its hashed files to (`build.assetsDir`), with the trailing slash. */
export const HASHED_DIR = 'assets/';

/** The name Vite gives a file: `<name>-<8 base64url characters>.<extension>`. */
const HASHED_NAME = /^.+-[A-Za-z0-9_-]{8}\.[A-Za-z0-9]+$/;

/** The two classes a path can be in. */
export const CACHE_CLASSES = Object.freeze({
  immutable: VETTED_HEADERS.cacheControl,
  revalidate: null,
});

/** A site path with forward slashes and no leading slash, query or fragment (the form the artifact manifest uses). */
function sitePath(path) {
  return String(path).replace(/\\/g, '/').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

/** Is this file's name changed by its content: under `assets/` and named the way Vite names a hashed file? */
export function isContentHashed(path) {
  const p = sitePath(path);
  return p.startsWith(HASHED_DIR) && HASHED_NAME.test(p.slice(p.lastIndexOf('/') + 1));
}

/**
 * The cache class a build's file must have: `immutable` (a year, never revalidated) for a content-hashed file, `revalidate`
 * (the host's default, asked about on every visit) for everything else.
 * @returns {{ cache: 'immutable' | 'revalidate', cacheControl: string | null }}
 */
export function classifyCache(path) {
  const cache = isContentHashed(path) ? 'immutable' : 'revalidate';
  return { cache, cacheControl: CACHE_CLASSES[cache] };
}

/** Does a `_headers` URL pattern match this site path? Only `*` (a splat: anything, slashes included) is understood, as in Cloudflare's format. */
export function patternMatches(pattern, path) {
  const source = String(pattern)
    .replace(/^\/+/, '')
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}$`).test(sitePath(path));
}

/** The rules of a `_headers` text: each URL pattern with the Cache-Control it carries (null when it carries none). */
export function cacheRules(text) {
  const rules = [];
  for (const raw of String(text).split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      rules.push({ pattern: raw.trim(), cacheControl: null });
      continue;
    }
    const m = /^\s+Cache-Control:\s*(.*?)\s*$/i.exec(raw);
    if (m && rules.length) rules.at(-1).cacheControl = m[1];
  }
  return rules;
}

/** What a `_headers` text makes of a path: `immutable` when a rule carrying the long cache matches it, else `revalidate`. */
export function cacheFromHeaders(path, text) {
  const long = cacheRules(text).some((rule) => rule.cacheControl === VETTED_HEADERS.cacheControl && patternMatches(rule.pattern, path));
  return long ? 'immutable' : 'revalidate';
}

/**
 * The deploy gate's check on a `_headers` text and the files that would be uploaded: every file the long-cache rule matches must
 * be content-hashed. Returns the offending paths (none: the rule touches only files whose names change with their content).
 * The other direction (a hashed file the rule misses) costs a revalidation, not a stale file, so it is not a problem here.
 */
export function unhashedUnderRule(text, paths) {
  return [...paths].map(sitePath).filter((p) => cacheFromHeaders(p, text) === 'immutable' && !isContentHashed(p)).sort();
}
