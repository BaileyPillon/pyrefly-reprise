/**
 * How wrangler is invoked and how its answers are read: the pure half of the Cloudflare deploy.
 * Argument lists for a Workers deploy, a Pages deploy and a Pages project, wrangler's environment,
 * where its binary lives, its output file, `whoami`, and the note it keeps with a deployment.
 * `tools/deploy-host.mjs` says WHERE a build can go and what it must look like; this file says how
 * wrangler is asked to put it there. `tools/deploy-cloudflare.mjs` runs both, with every side effect
 * injected.
 *
 * Everything here is pure (nothing spawns, reads a file or touches the network), so
 * tests/unit/deploy-host.test.ts covers it without wrangler. The field names and flags are those of
 * the pinned wrangler (4.147.0), read from its source and its `--help`. Nothing here ever sets,
 * reads or prints a credential. Game case: both (delivery tooling). Types: deploy-wrangler.d.mts.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

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
 * https URLs (and loopback ones, for a local rehearsal) a deploy entry names, each with a trailing
 * slash and once: a Workers entry's `targets` (route patterns are not URLs and are skipped), or a
 * Pages entry's `url` (this exact deployment) followed by its `.pages.dev` `alias`.
 */
export function pickDeployedUrls(entry) {
  const candidates = [...(Array.isArray(entry?.targets) ? entry.targets : []), entry?.url, entry?.alias];
  const urls = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const url = candidate.trim();
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

/**
 * Where wrangler lives: `PYREFLY_WRANGLER_BIN` when set (any copy, so a preview can run before the
 * branch is merged and without touching the shared node_modules), else the repo's own devDependency.
 */
export function resolveWranglerBin(root, exists = existsSync, env = process.env) {
  const override = env.PYREFLY_WRANGLER_BIN;
  if (override) {
    return exists(override)
      ? { ok: true, bin: override }
      : { ok: false, error: `PYREFLY_WRANGLER_BIN points at ${override}, which does not exist` };
  }
  const bin = join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  if (exists(bin)) return { ok: true, bin };
  return {
    ok: false,
    error: `wrangler is not installed (${bin} is missing). It is a devDependency of this repo: run \`npm install\` once in the main tree (the release worktrees share its node_modules through a junction). Never \`npm ci\`, which empties the shared node_modules first. Or point PYREFLY_WRANGLER_BIN at a wrangler.js.`,
  };
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
