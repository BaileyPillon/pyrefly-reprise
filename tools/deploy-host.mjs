/**
 * Where a build can be published, and the rules that belong to each place.
 *
 * `tools/deploy-pages.mjs` builds, hashes, gates and reviews a candidate the same way for every
 * host; only the build's base path, the publishing step and the address the live check reads
 * differ.
 *
 * THE SWITCH (Bailey, 2026-10-04: "Yes I will go with your recommendation", to putting release 38 on
 * echoesofspira.com as the production Cloudflare site): Cloudflare is the DEFAULT host and
 * https://echoesofspira.com/ is the game's one permanent address (a Workers Custom Domain; the
 * workers.dev address of the same Worker stays on as a backup, `www` forwards to the apex with a
 * dashboard Redirect Rule). GitHub Pages is now the OLD address: it stays deployable with an explicit
 * `--host=github`, as a LEGACY deploy that carries the "we've moved" note and records nothing the
 * critic reads as "the live build" (see `parseHostArgs`). The record of the switch is
 * docs/handoff/cf-switch.md; the earlier groundwork is docs/handoff/r39-cloudflare.md.
 *
 * Cloudflare has two kinds, chosen by `HOSTS.cloudflare.kind` or `--kind=` for one run:
 *   workers  Workers static assets, an assets-only Worker. Cloudflare's own Pages overview now tells
 *            new projects to start here, so it is the default (decision record: the handoff).
 *   pages    Cloudflare Pages by direct upload, the host named in decision D-369. Not wired to the
 *            custom domain: only the workers kind serves echoesofspira.com.
 * Both are named after the new title (D-368, D-369): echoes-of-spira.
 *
 * This file is the "where and what": the hosts, the flags, what a build and an upload must look like.
 * How wrangler is asked to do it is `tools/deploy-wrangler.mjs`. Game case: both (delivery tooling,
 * no gameplay). Nothing here touches the network or a Cloudflare account; `listUploadFiles` reads
 * only the directory it is given. Everything else is pure, so tests/unit/deploy-host.test.ts covers
 * it without wrangler. Types: deploy-host.d.mts.
 *
 * The Cloudflare numbers were read from Cloudflare's own documentation on 2026-10-04 and the
 * 25 MiB edge was proved with the pinned wrangler (4.147.0): a file of 26,214,400 bytes passes
 * `wrangler deploy --dry-run` and one of 26,214,401 bytes fails.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MIB = 1024 * 1024;

/**
 * Switched to Cloudflare on 2026-10-04 (Bailey: "Yes I will go with your recommendation"). The
 * default host is where a production deploy goes, whose address is "the live build" to the critic,
 * and whose last `status=ok` line in docs/deploys.log `critic-plan` reads. Flipping it back is one
 * line here, and the tripwire test `the default host` in tests/unit/deploy-host.test.ts.
 */
export const DEFAULT_HOST = 'cloudflare';

export const HOSTS = Object.freeze({
  github: Object.freeze({
    name: 'github',
    label: 'GitHub Pages',
    /** The OLD address since the switch: it serves the game with a "we've moved" note on the title screen, and saves made there stay there. */
    liveUrl: 'https://baileypillon.github.io/pyrefly-reprise/',
    /** vite.config.ts PROD_BASE: a project site is served from /<repo>/. */
    base: '/pyrefly-reprise/',
    /**
     * Not the default host any more, yet still deployable with an explicit `--host=github`: a LEGACY
     * deploy, which runs every gate but records nothing the critic reads as the live build
     * (docs/legacy-deploys.log instead of docs/deploys.log; no critic marker, ledger entry or artifact).
     */
    legacy: true,
  }),
  cloudflare: Object.freeze({
    name: 'cloudflare',
    label: 'Cloudflare',
    /** Served from the root of its address, so the build is made with BASE_PATH=/. */
    base: '/',
    kind: 'workers',
    /** D-368 and D-369: the project and its address are named after the new title. */
    workerName: 'echoes-of-spira',
    previewWorkerName: 'echoes-of-spira-preview',
    pagesProject: 'echoes-of-spira',
    pagesProductionBranch: 'main',
    pagesPreviewBranch: 'preview',
    /**
     * Production: the Worker `echoes-of-spira`, its Custom Domain (`routes`) and its workers.dev backup address.
     * Preview: a second Worker with NO routes. They are two files on purpose: a preview deployed with the
     * production file would try to move echoesofspira.com onto the preview Worker (wrangler overrides an
     * existing Custom Domain without asking when it runs without a terminal).
     */
    wranglerConfig: 'tools/cloudflare/wrangler.jsonc',
    previewWranglerConfig: 'tools/cloudflare/wrangler.preview.jsonc',
    /** The game's permanent address, bought by Bailey and Active in the same Cloudflare account as the Worker. Saves are tied to it. */
    customDomain: 'echoesofspira.com',
    /** `www` is not a second address: a zone Redirect Rule (dashboard, not wrangler) forwards it to the apex, so saves never split between two origins. */
    wwwHost: 'www.echoesofspira.com',
    liveUrl: 'https://echoesofspira.com/',
  }),
});

/** The address of the default host: where the game lives, and what every tool that needs "the live URL" reads. One constant, so nothing hard-codes it. */
export const LIVE_URL = HOSTS[DEFAULT_HOST].liveUrl;

/** The two Cloudflare products a build can go to, with the name used in messages. */
export const CLOUDFLARE_KINDS = Object.freeze({
  workers: 'Cloudflare Workers static assets',
  pages: 'Cloudflare Pages',
});

/**
 * What a Cloudflare static-assets upload accepts (free plan; paid plans allow 100,000 files), the
 * same for Workers static assets and Pages. Sources: https://developers.cloudflare.com/workers/platform/limits/#static-assets
 * and https://developers.cloudflare.com/pages/platform/limits/ , both "last updated 2026-09-05",
 * read 2026-10-04. Neither page states a total-size limit.
 */
export const CLOUDFLARE_LIMITS = Object.freeze({
  maxFileBytes: 25 * MIB,
  maxFiles: 20000,
  paidMaxFiles: 100000,
});

/**
 * Root files a Workers upload reads as configuration and never serves. None may ship except a vetted `_headers`
 * (`checkHeadersFile`, release 39): the live byte check does not download a host-read file (`HOST_READ_FILES` in
 * `tools/artifact-manifest.mjs`), but `_redirects` and `.assetsignore` change what is served, so they stay refused.
 */
export const CLOUDFLARE_CONFIG_FILES = Object.freeze(['_headers', '_redirects', '.assetsignore']);

/**
 * The one `_headers` a Cloudflare build may ship. Vite names every file it emits under `assets/` with a content hash
 * (`index-<hash>.js`, `.css`, the workers), so a hashed bundle can be cached for a year and never goes stale: a new build
 * changes the name, and index.html, which names it, keeps Cloudflare's default (`max-age=0, must-revalidate`). Nothing
 * else carries a content hash in its URL (the art, the fonts and the depth maps keep plain names), so nothing else is touched.
 */
export const VETTED_HEADERS = Object.freeze({
  patterns: Object.freeze(['/assets/*']),
  cacheControl: 'public, max-age=31536000, immutable',
});

/**
 * Is this `_headers` exactly the vetted one? Returns the problems found (none means it is vetted). Each rule is a URL
 * pattern at the start of a line followed by indented `Name: value` lines (Cloudflare's format); comments and blank lines
 * are free. Only the patterns in VETTED_HEADERS, only `Cache-Control`, only that value, each pattern once with the header
 * once; a `! Name` detach line, a placeholder, a second header or any other pattern is refused.
 */
export function checkHeadersFile(text) {
  const problems = [];
  const patterns = new Map(); // pattern -> how many Cache-Control lines it has
  let current = null;
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const at = `_headers line ${i + 1}`;
    if (!raw.trim() || raw.trimStart().startsWith('#')) return;
    if (!/^\s/.test(raw)) {
      current = raw.trim();
      if (!VETTED_HEADERS.patterns.includes(current)) problems.push(`${at}: the pattern "${current}" is not vetted (only ${VETTED_HEADERS.patterns.join(', ')})`);
      else if (patterns.has(current)) problems.push(`${at}: the pattern "${current}" appears twice`);
      patterns.set(current, patterns.get(current) ?? 0);
      return;
    }
    if (current === null) { problems.push(`${at}: a header before any URL pattern`); return; }
    const m = /^\s+([A-Za-z][A-Za-z0-9-]*):\s*(.*?)\s*$/.exec(raw);
    if (!m) problems.push(`${at}: "${raw.trim()}" is not a "Name: value" header (a "! Name" detach line is not vetted)`);
    else if (m[1].toLowerCase() !== 'cache-control' || m[2] !== VETTED_HEADERS.cacheControl) problems.push(`${at}: only "Cache-Control: ${VETTED_HEADERS.cacheControl}" is vetted, found "${m[1]}: ${m[2]}"`);
    else patterns.set(current, (patterns.get(current) ?? 0) + 1);
  });
  for (const [pattern, count] of patterns) {
    if (VETTED_HEADERS.patterns.includes(pattern) && count !== 1) problems.push(`the pattern "${pattern}" must carry "Cache-Control: ${VETTED_HEADERS.cacheControl}" once (it has ${count})`);
  }
  if (patterns.size === 0) problems.push('the file has no rule');
  return problems;
}

/** What the Pages walker skips at the root (configuration and Functions) and at any depth (proved from wrangler 4.147.0's own list). */
const PAGES_ROOT_SKIPPED = Object.freeze(['_worker.js', '_redirects', '_headers', '_routes.json', 'functions']);
const PAGES_SKIPPED_ANYWHERE = Object.freeze(['.git', '.DS_Store', 'node_modules', '.wrangler']);

/** Cloudflare previews are logged here, never in deploys.log: critic-plan and critic-status read the last `status=ok` line there as the live build. */
export const PREVIEW_LOG_NAME = 'preview-deploys.log';

/** Legacy deploys (the old GitHub Pages address, since the switch) are logged here for the same reason. */
export const LEGACY_LOG_NAME = 'legacy-deploys.log';

/** The name of the Worker or Pages project a run deploys to. */
export function siteNameFor(host, kind, preview) {
  if (kind === 'pages') return host.pagesProject;
  return preview ? host.previewWorkerName : host.workerName;
}

/** The wrangler config a Workers run uses, relative to the repo root: the preview Worker never reads the production file. */
export function wranglerConfigFor(host, preview) {
  return preview ? host.previewWranglerConfig : host.wranglerConfig;
}

/**
 * Read the host flags out of the parsed argv: `--host=github|cloudflare` (default DEFAULT_HOST);
 * Cloudflare only: `--kind=workers|pages`, `--preview` (the preview Worker, or the preview branch of
 * the Pages project, instead of production), `--full-verify` (compare every file byte for byte,
 * which a preview always does) and, for Pages only, `--create-project`.
 *
 * A production deploy goes to the default host, and only that one writes docs/deploys.log, a critic
 * marker and a ledger entry: `critic-plan`'s "last deployed build" and the critic's "live build" are
 * the default host's. Another host is allowed in two ways, each recorded elsewhere:
 *   - `--preview` (Cloudflare only): the preview Worker, logged in docs/preview-deploys.log;
 *   - a LEGACY host (GitHub Pages since the switch) named with `--host=`: the old address, logged
 *     in docs/legacy-deploys.log, `legacy: true` in the result.
 * Any other request for a non-default host without `--preview` still parses, with `refusal` set;
 * a dry run only prints it, a real run fails.
 */
export function parseHostArgs(args) {
  const raw = args.host;
  if (raw === true || (raw !== undefined && typeof raw !== 'string')) {
    return { ok: false, error: `--host needs a value: ${Object.keys(HOSTS).map((n) => `--host=${n}`).join(' or ')}` };
  }
  const name = raw === undefined ? DEFAULT_HOST : raw.trim().toLowerCase();
  if (!Object.hasOwn(HOSTS, name)) {
    return { ok: false, error: `unknown ${JSON.stringify(`--host=${raw}`)}; choose one of: ${Object.keys(HOSTS).join(', ')}` };
  }
  const host = HOSTS[name];
  for (const flag of ['preview', 'full-verify', 'create-project', 'kind']) {
    const value = args[flag];
    if (value === undefined) continue;
    if (host.name !== 'cloudflare') return { ok: false, error: `--${flag} needs --host=cloudflare (${host.label} has no such mode)` };
    if (flag !== 'kind' && value !== true) return { ok: false, error: `--${flag} takes no value (got ${JSON.stringify(value)})` };
  }
  let kind = null;
  if (host.name === 'cloudflare') {
    const wanted = args.kind === undefined ? host.kind : typeof args.kind === 'string' ? args.kind.trim().toLowerCase() : '';
    if (!Object.hasOwn(CLOUDFLARE_KINDS, wanted)) {
      return { ok: false, error: `--kind needs a value: ${Object.keys(CLOUDFLARE_KINDS).map((k) => `--kind=${k}`).join(' or ')}` };
    }
    kind = wanted;
  }
  if (args['create-project'] === true && kind !== 'pages') {
    return { ok: false, error: '--create-project needs --kind=pages: a Worker is created by its first deploy, a Pages project has to exist first' };
  }
  const preview = args.preview === true;
  const { legacy, refusal } = hostRequestRole(host, { preview });
  return {
    ok: true, host, kind, preview, legacy, fullVerify: preview || args['full-verify'] === true, createProject: args['create-project'] === true, refusal,
  };
}

/**
 * What a request for this host means, given which host is the default: nothing special (the default host, or any
 * preview), a LEGACY deploy (a non-default host flagged `legacy`, the old GitHub Pages address), or a refusal
 * (a non-default host that is not legacy: its production deploy would mix hosts in docs/deploys.log).
 */
export function hostRequestRole(host, { preview = false, defaultHost = DEFAULT_HOST } = {}) {
  if (preview || host.name === defaultHost) return { legacy: false, refusal: null };
  if (host.legacy === true) return { legacy: true, refusal: null };
  const home = HOSTS[defaultHost];
  return {
    legacy: false,
    refusal: `${host.label} is not the default host (${home.label}), and a production deploy goes only to the default host so that docs/deploys.log and the critic's "last deployed build" never mix hosts. Switching is Bailey's word: change DEFAULT_HOST in tools/deploy-host.mjs (docs/handoff/cf-switch.md). To rehearse on ${host.label} first, add --preview`,
  };
}

/**
 * The extra environment `vite build` needs for this host. Both bases are set explicitly: Cloudflare serves from
 * the root, and GitHub Pages from its project folder. A build for GitHub used to inherit vite's own default and
 * whatever BASE_PATH the shell happened to carry, so a leftover BASE_PATH=/ from a Cloudflare rehearsal would
 * have built the old address a blank page.
 */
export function hostBuildEnv(host) {
  return { BASE_PATH: host.base };
}

/**
 * A build for the wrong base serves a blank page (every asset 404s), so check the built
 * index.html: it must load `<base>assets/index-*.js`, every root-relative address must start with
 * the base, and a Cloudflare build must not carry the GitHub base. Returns the problems found.
 */
export function checkBuildBase(html, base) {
  const rooted = [];
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["'](\/[^"']*)["']/g)) rooted.push(m[1]);
  for (const m of html.matchAll(/url\(\s*["']?(\/[^)"']*)/g)) rooted.push(m[1]);
  const urls = rooted.filter((u) => !u.startsWith('//'));
  const problems = [];
  if (!urls.some((u) => u.startsWith(`${base}assets/index-`))) {
    problems.push(`index.html does not load ${base}assets/index-*.js: the build was made for a different base than ${base}`);
  }
  const githubBase = HOSTS.github.base;
  const wrong = urls.filter((u) => !u.startsWith(base) || (base !== githubBase && u.startsWith(githubBase)));
  if (wrong.length) problems.push(`${wrong.length} address(es) in index.html do not belong to the base ${base}, e.g. ${wrong.slice(0, 3).join(', ')}`);
  return problems;
}

/**
 * The files wrangler would upload from `dir`, the way its own walker for this kind sees them, with
 * the root config files it reads instead of serving returned apart as `configFiles`.
 *   workers  everything: dotfiles and `.git` included (proved 2026-10-04 with a 26 MiB file hidden in
 *            a `.git` folder), except `_headers`, `_redirects` and `.assetsignore` at the root.
 *   pages    everything except `.git`, `.DS_Store`, `node_modules` and `.wrangler` at any depth, and at
 *            the root `_worker.js`, `_redirects`, `_headers`, `_routes.json` and `functions/`.
 */
export function listUploadFiles(dir, kind = 'workers') {
  const files = [];
  const configFiles = [];
  const walk = (abs, rel) => {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const childAbs = join(abs, entry.name);
      if (kind === 'pages' && PAGES_SKIPPED_ANYWHERE.includes(entry.name)) continue;
      const rootConfig = kind === 'pages' ? PAGES_ROOT_SKIPPED : CLOUDFLARE_CONFIG_FILES;
      if (!rel && rootConfig.includes(entry.name)) {
        configFiles.push(entry.name);
      } else if (entry.isDirectory()) {
        walk(childAbs, childRel);
      } else {
        files.push({ path: childRel, bytes: statSync(childAbs).size });
      }
    }
  };
  walk(dir, '');
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { files, configFiles };
}

const mib = (bytes) => `${(bytes / MIB).toFixed(2)} MiB`;

/** Check an upload set against the limits. A file is too big only when it is OVER the limit: exactly 25 MiB passes. */
export function checkUploadLimits(files, limits = CLOUDFLARE_LIMITS) {
  const problems = [];
  const tooBig = files.filter((f) => f.bytes > limits.maxFileBytes);
  for (const f of tooBig.slice(0, 10)) {
    problems.push(`${f.path}: ${f.bytes} bytes (${mib(f.bytes)}) is over the ${mib(limits.maxFileBytes)} limit for one file`);
  }
  if (tooBig.length > 10) problems.push(`... and ${tooBig.length - 10} more file(s) over the per-file limit`);
  if (files.length > limits.maxFiles) {
    problems.push(`${files.length} files is over the ${limits.maxFiles}-file limit of the free plan (paid plans allow ${limits.paidMaxFiles})`);
  }
  const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 3);
  return {
    ok: problems.length === 0,
    fileCount: files.length,
    totalBytes: files.reduce((n, f) => n + f.bytes, 0),
    largest,
    problems,
  };
}

/** What would be uploaded against what the artifact manifest verified: nothing may differ. */
export function compareUploadSet(files, manifestFiles, manifestName) {
  const listed = new Set([...Object.keys(manifestFiles), manifestName]);
  const present = new Set(files.map((f) => f.path));
  return {
    unlisted: files.map((f) => f.path).filter((p) => !listed.has(p)),
    missing: [...listed].filter((p) => !present.has(p)),
  };
}

/**
 * A `docs/deploys.log` style line for a Cloudflare preview. `status=preview` never matches the
 * `status=ok` readers look for. A preview that went out under the owner's override says so, as in
 * deploys.log (a trailing `override=owner`). A `release` (what the build was stamped with: `Preview`) is a last
 * `release=<name>` field; without one the line is exactly what it always was.
 */
export function formatPreviewLogLine({ isoNow, mainSha, bundleHash, artFileCount, host, kind, site, url, overrideUsed = false, release = null }) {
  const line = `${isoNow}\tmain=${mainSha}\tbundle=${bundleHash}\tartFiles=${artFileCount}\tstatus=preview\thost=${host}\tkind=${kind}\tsite=${site}\turl=${url}`;
  const withOverride = overrideUsed ? `${line}\toverride=owner` : line;
  return `${release ? `${withOverride}\trelease=${release}` : withOverride}\n`;
}

/**
 * A `docs/legacy-deploys.log` line for a deploy to the old GitHub Pages address. `status=legacy` never
 * matches the `status=ok` readers look for (critic-plan's "last deployed build", critic-status). The
 * owner's override shows as in deploys.log, a trailing `override=owner`; a `release` is a last `release=<name>` field.
 */
export function formatLegacyLogLine({ isoNow, mainSha, bundleHash, artFileCount, host, url, overrideUsed = false, release = null }) {
  const line = `${isoNow}\tmain=${mainSha}\tbundle=${bundleHash}\tartFiles=${artFileCount}\tstatus=legacy\thost=${host}\turl=${url}`;
  const withOverride = overrideUsed ? `${line}\toverride=owner` : line;
  return `${release ? `${withOverride}\trelease=${release}` : withOverride}\n`;
}

/** What a run on this host will do, printed at the top of every run and on --dry-run. */
export function describeHostPlan(host, { kind = null, preview = false, fullVerify = false, createProject = false, legacy = false } = {}) {
  if (host.name === 'github') {
    if (legacy) {
      return [
        `host: ${host.label}, LEGACY deployment to the OLD address ${host.liveUrl} (the default host is ${HOSTS[DEFAULT_HOST].label}, ${HOSTS[DEFAULT_HOST].liveUrl})`,
        `  build: BASE_PATH=${host.base}; the title screen carries the "we've moved" note here and nowhere else; saves made on this address stay on it`,
        `  publish: gh-pages force-pushed as one commit, a Pages build kicked and polled, then ${host.liveUrl} compared byte for byte`,
        `  record: ${LEGACY_LOG_NAME} only; no critic obligation, no ledger entry, no stored artifact (the live build is ${HOSTS[DEFAULT_HOST].liveUrl})`,
      ];
    }
    return [`host: ${host.label}, live address ${host.liveUrl} (the default)`];
  }
  const site = siteNameFor(host, kind, preview);
  const publish = kind === 'pages'
    ? `wrangler pages deploy to branch ${preview ? host.pagesPreviewBranch : host.pagesProductionBranch} (Pages has no local dry run); the login is checked first${createProject ? '; the project is created first if missing (--create-project, with the hidden --force)' : '; the project must already exist'}`
    : 'wrangler deploy --dry-run (its own local check), then the real deploy; the login is checked first';
  const config = wranglerConfigFor(host, preview);
  const domain = !preview && kind !== 'pages' && host.customDomain
    ? [`  address: Custom Domain ${host.customDomain} (the live address ${host.liveUrl}) plus the workers.dev backup address; verified byte for byte on both; ${host.wwwHost} must forward to it (a dashboard Redirect Rule, checked and reported, never changed here)`]
    : [];
  return [
    `host: ${CLOUDFLARE_KINDS[kind] ?? host.label}${preview ? ', PREVIEW deployment (never the canonical address)' : `, PRODUCTION${host.name === DEFAULT_HOST ? ' (the default host)' : ''}`}`,
    kind === 'pages' ? `  project: ${site}, branch ${preview ? host.pagesPreviewBranch : host.pagesProductionBranch}` : `  worker: ${site}, config ${config}`,
    ...domain,
    `  build: BASE_PATH=${host.base}, because the site is served from the root of its address`,
    `  upload gate: ${CLOUDFLARE_LIMITS.maxFileBytes / MIB} MiB per file, ${CLOUDFLARE_LIMITS.maxFiles} files; dist-release/.git is removed; the files uploaded must equal the artifact manifest`,
    `  publish: ${publish}`,
    `  verify: ${fullVerify ? 'every file compared byte for byte' : 'the page, all code, every changed file and an even sample, byte for byte'}, against the address wrangler reports${domain.length ? ` and ${host.liveUrl}` : ''}`,
    preview
      ? `  record: ${PREVIEW_LOG_NAME} only; no critic obligation, no ledger entry`
      : '  record: docs/deploys.log (host=cloudflare), critic marker, ledger, as for any live build',
  ];
}
