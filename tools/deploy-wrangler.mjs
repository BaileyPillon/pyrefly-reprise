/**
 * How wrangler is invoked and how its answers are read: the pure half of the Cloudflare deploy.
 * Argument lists for a Workers deploy, a Pages deploy and a Pages project, wrangler's environment,
 * where its binary lives, its output file, `whoami`, and the note it keeps with a deployment.
 * `tools/deploy-host.mjs` says WHERE a build can go and what it must look like; this file says how
 * wrangler is asked to put it there. `tools/deploy-cloudflare.mjs` runs both, with every side effect
 * injected.
 *
 * Everything here is pure given what it is handed (nothing spawns or touches the network; the only
 * files read are package.json, a wrangler package.json and the small config files, through a
 * `readFile` that tests replace), so tests/unit/deploy-wrangler.test.ts covers it without wrangler.
 * The field names and flags are those of the pinned wrangler (4.147.0), read from its source and its
 * `--help`. Nothing here ever sets, reads or prints a credential. Game case: both (delivery
 * tooling). Types: deploy-wrangler.d.mts.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** wrangler's output file is newline-delimited JSON; one bad line never hides the rest. */
export function parseWranglerOutput(text) {
  const entries = [];
  let malformed = 0;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line);
      if (value && typeof value === 'object') entries.push(value);
      else malformed += 1;
    } catch {
      malformed += 1;
    }
  }
  return { entries, malformed };
}

/**
 * The last entry that says where a deploy went, for the Worker or Pages project asked about:
 * `deploy` (Workers) or `pages-deploy-detailed` (Pages), whose field names wrangler 4.147.0 writes.
 */
export function pickDeployEntry(entries, name = null, kind = 'workers') {
  const type = kind === 'pages' ? 'pages-deploy-detailed' : 'deploy';
  const field = kind === 'pages' ? 'pages_project' : 'worker_name';
  const found = entries.filter((e) => e && e.type === type && (!name || e[field] === name));
  return found.length ? found[found.length - 1] : null;
}

/**
 * A Custom Domain in a Workers entry's `targets`, as wrangler 4.147.0 renders it (`renderRoute`, read from its
 * source): `echoesofspira.com (custom domain)`, with ` - zone id: ...` or ` - zone name: ...` and a trailing
 * ` [production: enabled, ...]` only when the config says so. It is a hostname, not a URL, and not a route
 * pattern either (`example.com/*` has no such suffix), so it gets its own reading.
 */
const CUSTOM_DOMAIN_TARGET = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+) \(custom domain\b[^)]*\)(?: \[[^\]]*\])?$/i;

/**
 * https URLs (and loopback ones, for a local rehearsal) a deploy entry names, each with a trailing
 * slash and once: a Workers entry's `targets` (the workers.dev address, and each Custom Domain as
 * `https://<hostname>/`; route patterns are not URLs and are skipped), or a Pages entry's `url` (this
 * exact deployment) followed by its `.pages.dev` `alias`.
 */
export function pickDeployedUrls(entry) {
  const candidates = [...(Array.isArray(entry?.targets) ? entry.targets : []), entry?.url, entry?.alias];
  const urls = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    let url = candidate.trim();
    const domain = url.match(CUSTOM_DOMAIN_TARGET);
    if (domain) url = `https://${domain[1].toLowerCase()}`;
    if (!/^https:\/\/[^\s/]+(\/\S*)?$/.test(url) && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(\/\S*)?$/.test(url)) continue;
    const withSlash = url.endsWith('/') ? url : `${url}/`;
    if (!urls.includes(withSlash)) urls.push(withSlash);
  }
  return urls;
}

/** The note wrangler keeps with the version or deployment: plain ASCII, one line, at most 100 characters. */
export function wranglerMessage({ mainSha, isoNow, preview = false, extra = '' }) {
  const base = `Pyrefly ${mainSha} ${isoNow}${preview ? ' preview' : ''}`;
  const text = (extra ? `${base}: ${extra}` : base).replace(/[^\x20-\x7e]+/g, ' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 100);
}

/**
 * The arguments after the wrangler binary for a Workers deploy. An explicit --config keeps wrangler
 * from running its framework auto-configuration in this Vite project, and nothing here ever carries
 * a credential.
 */
export function buildWranglerDeployArgs({ configPath, workerName, message = '', tag = '', dryRun = false }) {
  const args = ['deploy', '--config', configPath, '--name', workerName];
  if (message) args.push('--message', message);
  if (tag) args.push('--tag', tag);
  if (dryRun) args.push('--dry-run');
  return args;
}

/**
 * The arguments for a Pages direct upload. `--branch` is always there: it chooses production or
 * preview, and its presence (like `--commit-hash` and `--commit-message`) is what keeps wrangler,
 * which detects agent sessions, from turning a deploy to a new project into a Workers deploy
 * (`getUnsupportedDeployDelegateArgs` in wrangler 4.147.0).
 */
export function buildPagesDeployArgs({ dist, projectName, branch, commitHash, commitMessage }) {
  return ['pages', 'deploy', dist, '--project-name', projectName, '--branch', branch, '--commit-hash', commitHash, '--commit-message', commitMessage];
}

/**
 * Creating the Pages project. The hidden `--force` is what makes it a real Pages project: without
 * it, wrangler 4.147.0 run by an agent session converts `pages project create` into a Workers deploy
 * from the current directory ("bypassing the automatic delegation to Cloudflare Workers").
 */
export function buildPagesProjectCreateArgs({ projectName, productionBranch }) {
  return ['pages', 'project', 'create', projectName, '--production-branch', productionBranch, '--force'];
}

/** The project names in `wrangler pages project list --json`, or null when the output cannot be read. */
export function parsePagesProjectNames(stdout) {
  const text = String(stdout ?? '');
  const start = text.indexOf('[');
  if (start < 0) return null;
  try {
    const rows = JSON.parse(text.slice(start).trim());
    if (!Array.isArray(rows)) return null;
    return rows.map((row) => row?.['Project Name']).filter((n) => typeof n === 'string');
  } catch {
    return null;
  }
}

/**
 * wrangler's environment: telemetry and error reports off, plain output, and the file it records
 * the deployed URLs in. Credentials are never set, read or printed here; whatever login wrangler
 * already has passes through untouched. Returns a copy.
 */
export function wranglerEnv(baseEnv, { outputFile = null } = {}) {
  const env = {
    ...baseEnv,
    WRANGLER_SEND_METRICS: 'false',
    WRANGLER_SEND_ERROR_REPORTS: 'false',
    DO_NOT_TRACK: '1',
    NO_COLOR: '1',
    FORCE_COLOR: '0',
  };
  delete env.WRANGLER_OUTPUT_FILE_PATH;
  delete env.WRANGLER_OUTPUT_FILE_DIRECTORY;
  if (outputFile) env.WRANGLER_OUTPUT_FILE_PATH = outputFile;
  return env;
}

/** How wrangler is spawned: stdin closed, so it is never interactive and no prompt (project, skills install, workers.dev name) can appear. */
export const WRANGLER_STDIO = Object.freeze(['ignore', 'inherit', 'inherit']);

/** The one file that says where the pinned wrangler is installed outside the repo, and which version that is. */
export const WRANGLER_INSTALL_CONFIG = 'tools/cloudflare/wrangler-install.json';

const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

/** The exact version this repo pins (`devDependencies.wrangler` in package.json), or null when that cannot be read. */
export function readPinnedWranglerVersion(root, readFile = readFileSync) {
  try {
    const pinned = JSON.parse(readFile(join(root, 'package.json'), 'utf8'))?.devDependencies?.wrangler;
    return typeof pinned === 'string' && EXACT_VERSION.test(pinned) ? pinned : null;
  } catch {
    return null;
  }
}

/** The version of the wrangler package that a `<package>/bin/wrangler.js` belongs to, or null. */
export function readWranglerVersion(bin, readFile = readFileSync) {
  try {
    const version = JSON.parse(readFile(join(dirname(dirname(bin)), 'package.json'), 'utf8'))?.version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}

/** Where the pinned wrangler is installed outside the repo (`WRANGLER_INSTALL_CONFIG`), or null when that file cannot be read. */
export function readWranglerInstall(root, readFile = readFileSync) {
  try {
    const c = JSON.parse(readFile(join(root, ...WRANGLER_INSTALL_CONFIG.split('/')), 'utf8'));
    if (typeof c?.version !== 'string' || typeof c?.dir !== 'string' || typeof c?.bin !== 'string') return null;
    return { version: c.version, dir: c.dir, bin: join(c.dir, ...c.bin.split('/')) };
  } catch {
    return null;
  }
}

const HOW_TO_INSTALL_WRANGLER =
  'Install it once OUTSIDE the shared node_modules: put tools/cloudflare/wrangler-install/package.json and package-lock.json in the folder named by tools/cloudflare/wrangler-install.json and run `npm ci --ignore-scripts` there (docs/handoff/cf-switch.md has the commands). '
  + 'Never run npm install, npm ci or npm install --dry-run in the main tree or through a worktree junction: even a dry run rewrites the shared hidden lockfile, and a real install would re-extract every package in it. '
  + 'Or point PYREFLY_WRANGLER_BIN at any wrangler.js.';

/**
 * Where wrangler lives, the first that exists:
 *   1. `PYREFLY_WRANGLER_BIN`, when set: any copy, taken as it is (its version is reported, never refused).
 *   2. the repo's own devDependency, `node_modules/wrangler` (it is there only after a real `npm install`).
 *   3. the pinned install outside the repo that `tools/cloudflare/wrangler-install.json` names
 *      (D:/Tools/wrangler/4.147.0): a standalone `npm ci` from `tools/cloudflare/wrangler-install/`, safe from
 *      the shared tree, from worktree removal and from `npm ci`.
 * A copy found in 2 or 3 must be the version package.json pins, or it is skipped and the reason reported.
 */
export function resolveWranglerBin(root, exists = existsSync, env = process.env, readFile = readFileSync) {
  const pinned = readPinnedWranglerVersion(root, readFile);
  const override = env.PYREFLY_WRANGLER_BIN;
  if (override) {
    return exists(override)
      ? { ok: true, bin: override, source: 'env', version: readWranglerVersion(override, readFile), pinned }
      : { ok: false, error: `PYREFLY_WRANGLER_BIN points at ${override}, which does not exist` };
  }
  const candidates = [{ source: 'repo', bin: join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js') }];
  const install = readWranglerInstall(root, readFile);
  if (install) candidates.push({ source: 'tools', bin: install.bin });
  const notes = [];
  for (const candidate of candidates) {
    if (!exists(candidate.bin)) {
      notes.push(`${candidate.bin} is missing`);
      continue;
    }
    const version = readWranglerVersion(candidate.bin, readFile);
    if (pinned && version !== pinned) {
      notes.push(`${candidate.bin} is wrangler ${version ?? '(version unreadable)'}, but this repo pins ${pinned}`);
      continue;
    }
    return { ok: true, bin: candidate.bin, source: candidate.source, version, pinned };
  }
  return { ok: false, error: `the pinned wrangler${pinned ? ` ${pinned}` : ''} was not found: ${notes.join('; ')}. ${HOW_TO_INSTALL_WRANGLER}` };
}

/** Whole-line `//` comments are all the committed wrangler configs carry; strip them and parse. */
export function parseWranglerConfigText(text) {
  return JSON.parse(String(text).split(/\r?\n/).filter((line) => !/^\s*\/\//.test(line)).join('\n'));
}

/**
 * Problems with a wrangler config for a Workers run, checked before wrangler is asked to deploy. The two
 * configs are public files and assets-only: the name must be the Worker this run deploys, workers.dev must stay on
 * (it is the backup address, and wrangler switches it off by default as soon as `routes` exist), the assets must be
 * the build, and the ONLY route is the production Worker's Custom Domain. A preview config with a route would move
 * that domain onto the preview Worker: wrangler overrides an existing Custom Domain without asking when it runs
 * without a terminal.
 */
export function checkWranglerConfig(text, { name, preview = false, customDomain }) {
  let config;
  try {
    config = parseWranglerConfigText(text);
  } catch (err) {
    return [`the wrangler config cannot be read: ${err.message}`];
  }
  const problems = [];
  const allowed = ['assets', 'compatibility_date', 'name', 'preview_urls', 'routes', 'workers_dev'];
  const extra = Object.keys(config).filter((key) => !allowed.includes(key));
  if (extra.length) problems.push(`unexpected key(s) ${extra.join(', ')}: the config is public and assets-only (no account id, binding, or route of its own)`);
  if (config.name !== name) problems.push(`name is ${JSON.stringify(config.name)}, but this run deploys the Worker ${name}`);
  if (config.workers_dev !== true) problems.push('workers_dev must be true: the workers.dev address is the backup address');
  if (config.preview_urls !== false) problems.push('preview_urls must be false');
  if (config.assets?.directory !== '../../dist-release') problems.push('assets.directory must be ../../dist-release, the build');
  if (preview) {
    if (config.routes !== undefined) problems.push(`a preview config must have no routes (found ${JSON.stringify(config.routes)}): a route would move the Custom Domain onto the preview Worker`);
  } else {
    const wanted = JSON.stringify([{ pattern: customDomain, custom_domain: true }]);
    if (JSON.stringify(config.routes) !== wanted) problems.push(`routes must be exactly ${wanted}, the one Custom Domain (found ${JSON.stringify(config.routes)})`);
  }
  return problems;
}

/** Read `wrangler whoami --json`. Only whether a login exists and how many accounts it sees; the email and ids are never kept. */
export function parseWhoami(status, stdout) {
  if (status !== 0) return { loggedIn: false, accounts: 0 };
  try {
    const data = JSON.parse(String(stdout ?? '').trim());
    if (data?.loggedIn !== true) return { loggedIn: false, accounts: 0 };
    return { loggedIn: true, accounts: Array.isArray(data.accounts) ? data.accounts.length : 0 };
  } catch {
    return { loggedIn: false, accounts: 0 };
  }
}
