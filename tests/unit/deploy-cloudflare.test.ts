/**
 * The Cloudflare half of the deploy (`tools/deploy-cloudflare.mjs`, r39-cloudflare, 2026-10-04),
 * driven end to end with fakes, for both kinds (Workers static assets and Pages): a fake wrangler
 * that records how it was run and writes the output file the real one would, a fake `verifyLive`,
 * a fake fetch and a fake clock. No network, no account, no wrangler, no waiting.
 * Game case: both (delivery tooling, no gameplay).
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  NOT_LOGGED_IN,
  checkCloudflareLogin,
  checkWwwForwarding,
  prepareCloudflareUpload,
  publishToCloudflare,
  type CloudflareDeps,
  type LiveCheck,
} from '../../tools/deploy-cloudflare.mjs';
import { CLOUDFLARE_LIMITS, HOSTS } from '../../tools/deploy-host.mjs';
import { WRANGLER_STDIO } from '../../tools/deploy-wrangler.mjs';

const REPO = resolve(__dirname, '..', '..');
const MIB = 1024 * 1024;
const SECRET = 'SECRET-TOKEN-must-never-appear-anywhere';
const WORKERS_URL = 'https://echoes-of-spira.bailey.workers.dev/';
const CANONICAL = 'https://echoesofspira.com/';
const PAGES_DEPLOYMENT = 'https://abc123.echoes-of-spira.pages.dev/';
const PAGES_ALIAS = 'https://echoes-of-spira.pages.dev/';
const PAGES_PREVIEW_ALIAS = 'https://preview.echoes-of-spira.pages.dev/';

interface Call { command: string; args: string[]; options: Record<string, unknown> }

class Failed extends Error {}

const liveCheck = (over: Partial<LiveCheck> = {}): LiveCheck => ({
  result: 'PASS', checked: 40, liveManifest: 'match', mismatched: [], missing: [], wrongType: [], errors: [], ...over,
});

// What wrangler 4.147.0 really writes for the production Worker: the workers.dev address with https:// added, and the Custom Domain as "host (custom domain)".
const WORKERS_ENTRY = '{"type":"deploy","version":1,"worker_name":"echoes-of-spira","version_id":"ver-1","targets":["https://echoes-of-spira.bailey.workers.dev","echoesofspira.com (custom domain)"]}';
const WORKERS_ONLY_ENTRY = '{"type":"deploy","version":1,"worker_name":"echoes-of-spira","version_id":"ver-1","targets":["https://echoes-of-spira.bailey.workers.dev"]}';
const PREVIEW_ENTRY = '{"type":"deploy","version":1,"worker_name":"echoes-of-spira-preview","version_id":"pv-1","targets":["https://echoes-of-spira-preview.bailey.workers.dev"]}';
const pagesEntry = (alias: string) => JSON.stringify({
  type: 'pages-deploy-detailed', version: 1, pages_project: 'echoes-of-spira', deployment_id: 'dep-1',
  url: 'https://abc123.echoes-of-spira.pages.dev', alias, environment: 'production',
});

interface Scenario {
  /** What the fake wrangler writes to its output file for the real deploy; null writes nothing. */
  output?: string | null;
  dryStatus?: number;
  deployStatus?: number;
  whoami?: { status: number; stdout: string };
  /** The projects `pages project list --json` reports, or 'unreadable'. */
  projects?: string[] | 'unreadable';
  listStatus?: number;
  createStatus?: number;
  /** What www.echoesofspira.com answers (default: it forwards to the apex). */
  www?: 'forwards' | 'serves-game' | 'error' | 'redirect-elsewhere' | 'unreachable';
  /** Replaces any dependency by name. */
  deps?: Partial<CloudflareDeps>;
}

/** Fakes for everything the module touches. */
function harness(dir: string, scenario: Scenario = {}) {
  const calls: Call[] = [];
  const logs: string[] = [];
  const sleeps: number[] = [];
  const fetches: { url: string; init?: Record<string, unknown> }[] = [];
  const checks: LiveCheck[] = [];
  const verifyCalls: { url: string; options: { changed: string[]; full: boolean } }[] = [];
  const deps: CloudflareDeps = {
    existsSync: (path: string) => path.replaceAll('\\', '/').endsWith('node_modules/wrangler/bin/wrangler.js') || existsSync(path),
    spawnSync: (command, args, options) => {
      calls.push({ command, args, options });
      const [, first, second, third] = args;
      if (first === 'whoami') {
        return scenario.whoami ?? { status: 0, stdout: '{"loggedIn":true,"email":"someone@example.com","accounts":[{"id":"a1"}]}' };
      }
      if (first === 'pages' && second === 'project' && third === 'list') {
        if (scenario.listStatus) return { status: scenario.listStatus };
        const names = scenario.projects ?? ['echoes-of-spira'];
        return { status: 0, stdout: names === 'unreadable' ? 'unreadable' : JSON.stringify(names.map((n) => ({ 'Project Name': n }))) };
      }
      if (first === 'pages' && second === 'project' && third === 'create') return { status: scenario.createStatus ?? 0 };
      if (args.includes('--dry-run')) return { status: scenario.dryStatus ?? 0 };
      const isPages = first === 'pages';
      const alias = args.includes('preview') ? PAGES_PREVIEW_ALIAS.slice(0, -1) : PAGES_ALIAS.slice(0, -1);
      const workersEntry = (args[args.indexOf('--name') + 1] ?? '').endsWith('-preview') ? PREVIEW_ENTRY : WORKERS_ENTRY;
      const output = scenario.output === undefined
        ? `{"type":"wrangler-session","version":1}\n${isPages ? pagesEntry(alias) : workersEntry}`
        : scenario.output;
      const env = options.env as Record<string, string>;
      if (output !== null && env.WRANGLER_OUTPUT_FILE_PATH) writeFileSync(env.WRANGLER_OUTPUT_FILE_PATH, output);
      return { status: scenario.deployStatus ?? 0 };
    },
    env: { PATH: 'x', CLOUDFLARE_API_TOKEN: SECRET },
    // The committed configs are read for real, as ROOT/tools/cloudflare/<name>: the run checks them before it asks wrangler to deploy.
    readFileSync: (path: string, encoding: 'utf8') => {
      const config = path.replaceAll('\\', '/').match(/^ROOT\/tools\/cloudflare\/(wrangler(?:\.preview)?\.jsonc)$/);
      return readFileSync(config ? join(REPO, 'tools', 'cloudflare', config[1] as string) : path, encoding);
    },
    tmpFile: () => join(dir, 'wrangler-output.ndjson'),
    sleep: async (ms) => { sleeps.push(ms); },
    log: (m) => { logs.push(m); },
    fail: (m) => { throw new Failed(m); },
    fetchImpl: async (url, init) => {
      fetches.push({ url, init });
      if (url.startsWith('https://www.')) return wwwAnswer(scenario.www ?? 'forwards');
      return { status: 200, text: async () => '<script src="/assets/index-GoodHash.js"></script>' };
    },
    verifyLive: async (_manifest, url, options) => {
      verifyCalls.push({ url, options });
      return checks.shift() ?? liveCheck();
    },
    ...scenario.deps,
  };
  return { deps, calls, logs, sleeps, checks, verifyCalls, fetches };
}

/** What www.echoesofspira.com answers, in the four ways that matter. */
function wwwAnswer(kind: 'forwards' | 'serves-game' | 'error' | 'redirect-elsewhere' | 'unreachable') {
  if (kind === 'unreachable') throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } });
  if (kind === 'forwards') return { status: 301, text: async () => '', headers: { get: (name: string) => (name.toLowerCase() === 'location' ? CANONICAL : null) } };
  if (kind === 'redirect-elsewhere') return { status: 302, text: async () => '', headers: { get: (name: string) => (name.toLowerCase() === 'location' ? 'https://example.com/' : null) } };
  if (kind === 'error') return { status: 522, text: async () => 'connection timed out', headers: { get: () => null } };
  return { status: 200, text: async () => '<script src="/assets/index-GoodHash.js"></script>', headers: { get: () => null } };
}

const manifest = { artifactHash: 'a'.repeat(64), files: { 'index.html': {}, 'art/a.png': {} } };
type PublishInput = Parameters<typeof publishToCloudflare>[0];
const publishArgs = (extra: Partial<PublishInput> = {}): PublishInput => ({
  root: 'ROOT', dist: 'ROOT/dist-release', mainSha: 'abc1234', bundleHash: 'GoodHash', isoNow: '2026-10-04T12:00:00.000Z', manifest, changedShipped: ['art/a.png'], ...extra,
});

let dir = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pyrefly-deploy-cf-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** Whatever happens, none of these may ever reach wrangler, a log line or an error message. */
function expectNothingForbidden(h: ReturnType<typeof harness>, extra: string[] = []) {
  const everything = [...h.logs, ...extra, ...h.calls.flatMap((c) => c.args)].join('\n');
  expect(everything).not.toContain(SECRET);
  expect(everything).not.toMatch(/--temporary/);
  expect(everything).not.toMatch(/someone@example\.com/);
  for (const c of h.calls) expect(c.args).not.toContain('login');
}

const slash = (value: string | undefined) => value?.replaceAll('\\', '/');

describe('checkCloudflareLogin: no login, no deploy', () => {
  it('stops before wrangler is asked to deploy anything, with the instruction for Bailey', () => {
    const h = harness(dir, { whoami: { status: 1, stdout: '{"loggedIn":false}' } });
    expect(() => checkCloudflareLogin({ root: 'ROOT', deps: h.deps })).toThrow(NOT_LOGGED_IN);
    expect(NOT_LOGGED_IN).toMatch(/npx wrangler login/);
    expect(NOT_LOGGED_IN).toMatch(/Agents never create an account/);
    expect(h.calls).toHaveLength(1);
    expect(h.calls[0]?.args.slice(1)).toEqual(['whoami', '--json']);
    expect(h.calls[0]?.options).toMatchObject({ shell: false, cwd: 'ROOT' });
    expect(h.calls[0]?.options.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    expectNothingForbidden(h);
  });

  it('accepts a login, never prints the email or an account id, and warns when it sees several accounts', () => {
    const h = harness(dir, { whoami: { status: 0, stdout: '{"loggedIn":true,"email":"someone@example.com","accounts":[{"id":"a1"},{"id":"a2"}]}' } });
    expect(checkCloudflareLogin({ root: 'ROOT', deps: h.deps })).toEqual({ loggedIn: true, accounts: 2 });
    expect(h.logs.join('\n')).toMatch(/Cloudflare login: ok \(2 account\(s\) visible\)/);
    expect(h.logs.join('\n')).toMatch(/set CLOUDFLARE_ACCOUNT_ID/);
    expectNothingForbidden(h);
    expect((h.calls[0]?.options.env as Record<string, string>).WRANGLER_SEND_METRICS).toBe('false');
  });

  it('says to install wrangler when it is missing, and never spawns anything', () => {
    const h = harness(dir, { deps: { existsSync: () => false } });
    expect(() => checkCloudflareLogin({ root: 'ROOT', deps: h.deps })).toThrow(/npm install/);
    expect(h.calls).toHaveLength(0);
  });

  it('reports a wrangler that could not even start', () => {
    const h = harness(dir, { deps: { spawnSync: () => ({ status: null, error: new Error('spawn ENOENT') }) } });
    expect(() => checkCloudflareLogin({ root: 'ROOT', deps: h.deps })).toThrow(/could not run wrangler: spawn ENOENT/);
  });

  it('runs the wrangler that PYREFLY_WRANGLER_BIN names, with no install needed', () => {
    const bin = 'D:/scratch/wrangler/bin/wrangler.js';
    const h = harness(dir, { deps: { existsSync: (p: string) => p === bin, env: { PYREFLY_WRANGLER_BIN: bin, CLOUDFLARE_API_TOKEN: SECRET } } });
    checkCloudflareLogin({ root: 'ROOT', deps: h.deps });
    expect(h.calls[0]?.args[0]).toBe(bin);
  });
});

describe('prepareCloudflareUpload: the gate on what would be uploaded', () => {
  const tree = (files: Record<string, string>) => {
    for (const [rel, body] of Object.entries(files)) {
      const full = join(dir, ...rel.split('/'));
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, body);
    }
  };
  const base = { 'index.html': '<h1>x</h1>', 'art/a.png': 'png', 'artifact-manifest.json': '{}' };
  const prepare = (h: ReturnType<typeof harness>, kind: 'workers' | 'pages' = 'workers') => prepareCloudflareUpload({ dist: dir, manifest, manifestName: 'artifact-manifest.json', kind, deps: h.deps });

  it('removes the throwaway .git first, then passes a set that equals the manifest', () => {
    tree({ ...base, '.git/objects/pack/pack-x.pack': 'pack', '.git/HEAD': 'ref' });
    const h = harness(dir);
    const report = prepare(h);
    expect(existsSync(join(dir, '.git'))).toBe(false);
    expect(report.fileCount).toBe(3);
    expect(h.logs.join('\n')).toMatch(/removing dist-release\/\.git/);
    expect(h.logs.join('\n')).toMatch(/upload set ok: 3 files/);
  });

  it('applies the Pages rules for a Pages upload and the Workers rules otherwise', () => {
    tree({ ...base, '_routes.json': '{}' });
    const pages = harness(dir);
    expect(() => prepare(pages, 'pages')).toThrow(Failed);
    expect(pages.logs.join('\n')).toMatch(/_routes\.json/);
    // _routes.json is an ordinary file in a Workers upload, so the manifest would be missing it
    const workers = harness(dir);
    expect(() => prepare(workers, 'workers')).toThrow(Failed);
    expect(workers.logs.join('\n')).toMatch(/_routes\.json/);
    expect(workers.logs.join('\n')).toMatch(/does not list/);
  });

  it('refuses root config files, which Cloudflare reads instead of serving', () => {
    tree({ ...base, _headers: '/*\n  X-Test: 1\n' });
    const h = harness(dir);
    expect(() => prepare(h)).toThrow(/not fit for the Cloudflare upload/);
    expect(h.logs.join('\n')).toMatch(/_headers/);
  });

  it('refuses a file the manifest does not list', () => {
    tree({ ...base, 'stray.txt': 'x' });
    const h = harness(dir);
    expect(() => prepare(h)).toThrow(Failed);
    expect(h.logs.join('\n')).toMatch(/stray\.txt/);
  });

  it('refuses a listed file that would not be uploaded', () => {
    tree({ 'index.html': '<h1>x</h1>', 'artifact-manifest.json': '{}' });
    const h = harness(dir);
    expect(() => prepare(h)).toThrow(Failed);
    expect(h.logs.join('\n')).toMatch(/art\/a\.png/);
  });

  it('refuses a file one byte over 25 MiB and passes one exactly 25 MiB', () => {
    const list = (bytes: number) => () => ({
      files: [{ path: 'index.html', bytes: 1 }, { path: 'art/a.png', bytes }, { path: 'artifact-manifest.json', bytes: 1 }],
      configFiles: [],
    });
    const over = harness(dir, { deps: { list: list(CLOUDFLARE_LIMITS.maxFileBytes + 1) } });
    expect(() => prepare(over)).toThrow(Failed);
    expect(over.logs.join('\n')).toMatch(/art\/a\.png.*25\.00 MiB/);
    const edge = harness(dir, { deps: { list: list(25 * MIB) } });
    expect(prepare(edge).ok).toBe(true);
  });
});

describe('publishToCloudflare, Workers static assets (production: the Custom Domain)', () => {
  it('checks the config, runs wrangler\'s local check, then the real deploy, then verifies workers.dev and the Custom Domain', async () => {
    const h = harness(dir);
    const result = await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect(h.calls).toHaveLength(2);
    const [dry, real] = h.calls as [Call, Call];
    for (const c of [dry, real]) {
      expect(c.command).toBe(process.execPath);
      expect(slash(c.args[0])).toBe('ROOT/node_modules/wrangler/bin/wrangler.js');
      expect(c.args.slice(1, 3)).toEqual(['deploy', '--config']);
      expect(slash(c.args[3])).toBe('ROOT/tools/cloudflare/wrangler.jsonc');
      expect(c.args[c.args.indexOf('--name') + 1]).toBe('echoes-of-spira');
      expect(c.args[c.args.indexOf('--tag') + 1]).toBe('abc1234');
      expect(c.options).toMatchObject({ cwd: 'ROOT', shell: false });
      expect(c.options.stdio).toEqual([...WRANGLER_STDIO]);
    }
    expect(dry.args).toContain('--dry-run');
    expect(real.args).not.toContain('--dry-run');
    expect((dry.options.env as Record<string, string>).WRANGLER_OUTPUT_FILE_PATH).toBeUndefined();
    expect((real.options.env as Record<string, string>).WRANGLER_OUTPUT_FILE_PATH).toBe(join(dir, 'wrangler-output.ndjson'));
    // the Worker is proved on the address that answers at once, then the Custom Domain, which is the live address
    expect(result).toMatchObject({ kind: 'workers', siteName: 'echoes-of-spira', versionId: 'ver-1', urls: [WORKERS_URL, CANONICAL], liveUrl: CANONICAL });
    expect(h.verifyCalls).toEqual([
      { url: WORKERS_URL, options: { changed: ['art/a.png'], full: false } },
      { url: CANONICAL, options: { changed: ['art/a.png'], full: false } },
    ]);
    expect(existsSync(join(dir, 'wrangler-output.ndjson'))).toBe(false);
    const logs = h.logs.join('\n');
    expect(logs).toMatch(/tools\/cloudflare\/wrangler\.jsonc ok: the Custom Domain echoesofspira\.com is its only route, and workers\.dev stays on as the backup address/);
    expect(logs).toMatch(/https:\/\/echoesofspira\.com\/ serves artifact a{16} byte for byte \(40 files compared\)/);
    expect(logs).toMatch(/www check: www\.echoesofspira\.com forwards to the apex/);
    expect(result.www).toMatchObject({ state: 'forwards' });
    expectNothingForbidden(h);
  });

  it('verifies the Custom Domain even when wrangler does not list it, and says so', async () => {
    const h = harness(dir, { output: `{"type":"wrangler-session","version":1}\n${WORKERS_ONLY_ENTRY}` });
    const result = await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect(result.urls).toEqual([WORKERS_URL, CANONICAL]);
    expect(result.liveUrl).toBe(CANONICAL);
    expect(h.verifyCalls.map((v) => v.url)).toEqual([WORKERS_URL, CANONICAL]);
    expect(h.logs.join('\n')).toMatch(/wrangler did not list https:\/\/echoesofspira\.com\/ among its targets; it is verified anyway, as the live address/);
  });

  it('reports the Custom Domain as the live address, never the workers.dev one, whatever order wrangler lists them in', async () => {
    const reversed = '{"type":"deploy","version":1,"worker_name":"echoes-of-spira","version_id":"ver-2","targets":["echoesofspira.com (custom domain)","https://echoes-of-spira.bailey.workers.dev"]}';
    const h = harness(dir, { output: reversed });
    const result = await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect(result.urls).toEqual([WORKERS_URL, CANONICAL]);
    expect(result.liveUrl).toBe(CANONICAL);
    expect(h.logs.join('\n')).not.toMatch(/did not list/);
  });

  it('works with only the Custom Domain listed, the workers.dev address being absent', async () => {
    const h = harness(dir, { output: '{"type":"deploy","version":1,"worker_name":"echoes-of-spira","version_id":"ver-3","targets":["echoesofspira.com (custom domain)"]}' });
    const result = await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect(result.urls).toEqual([CANONICAL]);
    expect(h.verifyCalls.map((v) => v.url)).toEqual([CANONICAL]);
  });

  it('gives the Custom Domain ten minutes to serve the build (a fresh one needs its DNS record and certificate), the workers.dev address one and a half', async () => {
    const attempts: Record<string, number> = {};
    const h = harness(dir, { deps: { fetchImpl: async (url) => {
      attempts[url] = (attempts[url] ?? 0) + 1;
      if (url.startsWith('https://www.')) return wwwAnswer('forwards');
      return { status: 200, text: async () => `<script src="/assets/index-${url === CANONICAL ? 'OldHash' : 'GoodHash'}.js"></script>` };
    } } });
    await expect(publishToCloudflare({ ...publishArgs(), deps: h.deps })).rejects.toThrow(/https:\/\/echoesofspira\.com\/ never served the built bundle \(local GoodHash, last seen OldHash.*The Worker itself is published.*Domains & Routes.*ipconfig \/flushdns/s);
    expect(attempts[WORKERS_URL]).toBe(1);
    expect(attempts[CANONICAL]).toBe(20);
    expect(h.sleeps).toHaveLength(19);
    expect(h.verifyCalls.map((v) => v.url)).toEqual([WORKERS_URL]);
  });

  it('refuses to start when the production config lost its Custom Domain, and runs nothing', async () => {
    const h = harness(dir, { deps: { readFileSync: (path: string, encoding: 'utf8') => {
      const isConfig = path.replaceAll('\\', '/').endsWith('wrangler.jsonc');
      const text = readFileSync(isConfig ? join(REPO, 'tools', 'cloudflare', 'wrangler.jsonc') : path, encoding);
      return isConfig ? text.replace(/"routes": \[[^\]]*\],?/s, '') : text;
    } } });
    await expect(publishToCloudflare({ ...publishArgs(), deps: h.deps })).rejects.toThrow(/tools\/cloudflare\/wrangler\.jsonc is not fit to deploy echoes-of-spira.*nothing was uploaded/s);
    expect(h.calls).toHaveLength(0);
    expect(h.logs.join('\n')).toMatch(/routes must be exactly/);
  });

  it('refuses to start when the config cannot be read, and runs nothing', async () => {
    const h = harness(dir, { deps: { readFileSync: () => { throw new Error('ENOENT: no such file'); } } });
    await expect(publishToCloudflare({ ...publishArgs(), deps: h.deps })).rejects.toThrow(/could not read tools\/cloudflare\/wrangler\.jsonc: ENOENT/);
    expect(h.calls).toHaveLength(0);
  });

  it('does not upload when wrangler\'s own local check fails', async () => {
    const h = harness(dir, { dryStatus: 1 });
    await expect(publishToCloudflare({ ...publishArgs(), deps: h.deps })).rejects.toThrow(/local check failed \(exit 1\).*nothing was uploaded/);
    expect(h.calls).toHaveLength(1);
    expect(h.verifyCalls).toHaveLength(0);
  });

  it('verifies nothing when the real deploy fails, and says an interrupted upload is safe to repeat and what a Custom Domain failure means', async () => {
    const h = harness(dir, { deployStatus: 1 });
    await expect(publishToCloudflare({ ...publishArgs(), deps: h.deps })).rejects.toThrow(/nothing was verified or recorded.*workers\.dev name.*"Custom domains".*echoesofspira\.com could not be attached.*Active.*no CNAME.*safe to repeat/s);
    expect(h.verifyCalls).toHaveLength(0);
  });

  it('fails when wrangler leaves no output file or no deploy entry', async () => {
    const none = harness(dir, { output: null });
    await expect(publishToCloudflare({ ...publishArgs(), deps: none.deps })).rejects.toThrow(/left no output file/);
    const noEntry = harness(dir, { output: '{"type":"wrangler-session","version":1}' });
    await expect(publishToCloudflare({ ...publishArgs(), deps: noEntry.deps })).rejects.toThrow(/no deploy entry for echoes-of-spira/);
  });

  it('waits for an address to serve this build\'s bundle', async () => {
    let n = 0;
    const h = harness(dir, { deps: { fetchImpl: async (url) => {
      if (url.startsWith('https://www.')) return wwwAnswer('forwards');
      return { status: 200, text: async () => `<script src="/assets/index-${++n < 3 ? 'OldHash' : 'GoodHash'}.js"></script>` };
    } } });
    await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    // workers.dev needed three tries; the Custom Domain, asked after it, served the build at once
    expect(n).toBe(4);
    expect(h.sleeps).toEqual([30_000, 30_000]);
  });

  it('retries a failing byte-for-byte check four times, then fails naming the files', async () => {
    const h = harness(dir);
    for (let i = 0; i < 3; i++) h.checks.push(liveCheck({ result: 'FAIL', mismatched: ['art/a.png'] }));
    h.checks.push(liveCheck({ result: 'FAIL', mismatched: ['art/a.png'], missing: ['audio/x.mp3 (404)'] }));
    await expect(publishToCloudflare({ ...publishArgs(), deps: h.deps })).rejects.toThrow(/does not serve this exact artifact \(FAIL\)/);
    expect(h.verifyCalls).toHaveLength(4);
    expect(h.logs.join('\n')).toMatch(/audio\/x\.mp3 \(404\)/);
  });

  it('passes on a second attempt after one unverified check', async () => {
    const h = harness(dir);
    h.checks.push(liveCheck({ result: 'UNVERIFIED', checked: 0, liveManifest: 'missing' }), liveCheck());
    const result = await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect(result.liveArtifact.result).toBe('PASS');
    expect(h.verifyCalls).toHaveLength(3);
  });

  it('never lets the token, the email or a throwaway account near wrangler, a log or an error', async () => {
    const h = harness(dir);
    await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect((h.calls[1]?.options.env as Record<string, string>).CLOUDFLARE_API_TOKEN).toBe(SECRET);
    expectNothingForbidden(h);

    const failed = harness(dir, { deployStatus: 2 });
    let message = '';
    try {
      await publishToCloudflare({ ...publishArgs(), deps: failed.deps });
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toMatch(/wrangler deploy failed \(exit 2\)/);
    expectNothingForbidden(failed, [message]);
  });
});

describe('publishToCloudflare, Workers static assets (preview: the second Worker, never the Custom Domain)', () => {
  it('deploys to the preview Worker with the preview config, which has no routes, and compares every file', async () => {
    const h = harness(dir);
    const result = await publishToCloudflare({ ...publishArgs({ preview: true, fullVerify: true, extraMessage: 'first try' }), deps: h.deps });
    for (const c of h.calls) {
      expect(slash(c.args[c.args.indexOf('--config') + 1])).toBe('ROOT/tools/cloudflare/wrangler.preview.jsonc');
      expect(c.args[c.args.indexOf('--name') + 1]).toBe('echoes-of-spira-preview');
    }
    const real = h.calls[1] as Call;
    expect(real.args[real.args.indexOf('--message') + 1]).toMatch(/^Pyrefly abc1234 .* preview: first try$/);
    expect(result.siteName).toBe('echoes-of-spira-preview');
    expect(result.urls).toEqual(['https://echoes-of-spira-preview.bailey.workers.dev/']);
    expect(result.liveUrl).toBe('https://echoes-of-spira-preview.bailey.workers.dev/');
    expect(h.verifyCalls.map((v) => v.url)).toEqual(['https://echoes-of-spira-preview.bailey.workers.dev/']);
    expect(h.verifyCalls[0]?.options.full).toBe(true);
    expect(h.logs.join('\n')).toMatch(/\(PREVIEW\)/);
    expect(h.logs.join('\n')).toMatch(/wrangler\.preview\.jsonc ok: no routes, so a preview can never touch the Custom Domain/);
  });

  it('never verifies, names or checks the live address or www: a preview is not the live build', async () => {
    const h = harness(dir);
    const result = await publishToCloudflare({ ...publishArgs({ preview: true }), deps: h.deps });
    expect(result.www).toBeNull();
    expect(h.fetches.map((f) => f.url).join(' ')).not.toMatch(/echoesofspira\.com/);
    expect(h.verifyCalls.map((v) => v.url).join(' ')).not.toMatch(/echoesofspira\.com/);
    expect(h.logs.join('\n')).not.toMatch(/www check/);
  });

  it('refuses a preview whose config carries a route, because that would move the Custom Domain onto the preview Worker', async () => {
    const withRoute = JSON.stringify({
      name: 'echoes-of-spira-preview', compatibility_date: '2026-10-04', workers_dev: true, preview_urls: false,
      routes: [{ pattern: 'echoesofspira.com', custom_domain: true }], assets: { directory: '../../dist-release' },
    });
    const h = harness(dir, { deps: { readFileSync: () => withRoute } });
    await expect(publishToCloudflare({ ...publishArgs({ preview: true }), deps: h.deps })).rejects.toThrow(/wrangler\.preview\.jsonc is not fit to deploy echoes-of-spira-preview/);
    expect(h.calls).toHaveLength(0);
    expect(h.logs.join('\n')).toMatch(/must have no routes/);
  });

  it('refuses the production config as a preview config, which is the same mistake by another route', async () => {
    const h = harness(dir, { deps: { readFileSync: (path: string, encoding: 'utf8') => readFileSync(path.replaceAll('\\', '/').endsWith('.jsonc') ? join(REPO, 'tools', 'cloudflare', 'wrangler.jsonc') : path, encoding) } });
    await expect(publishToCloudflare({ ...publishArgs({ preview: true }), deps: h.deps })).rejects.toThrow(/not fit to deploy echoes-of-spira-preview/);
    expect(h.calls).toHaveLength(0);
  });

  it('fails when wrangler names no address for the preview Worker', async () => {
    const h = harness(dir, { output: '{"type":"deploy","version":1,"worker_name":"echoes-of-spira-preview","targets":["pyrefly.example.com/*"]}' });
    await expect(publishToCloudflare({ ...publishArgs({ preview: true }), deps: h.deps })).rejects.toThrow(/reported no address.*workers_dev in tools\/cloudflare\/wrangler\.preview\.jsonc/s);
  });

  it('gives a preview address six tries, like any address other than the Custom Domain', async () => {
    let n = 0;
    const h = harness(dir, { deps: { fetchImpl: async () => { n++; return { status: 200, text: async () => '<script src="/assets/index-OldHash.js"></script>' }; } } });
    await expect(publishToCloudflare({ ...publishArgs({ preview: true }), deps: h.deps })).rejects.toThrow(/never served the built bundle \(local GoodHash, last seen OldHash/);
    expect(n).toBe(6);
    expect(h.sleeps).toHaveLength(5);
    expect(h.verifyCalls).toHaveLength(0);
  });
});

describe('checkWwwForwarding: www must forward to the apex, or saves split between two origins', () => {
  const run = async (kind: Parameters<typeof wwwAnswer>[0]) => {
    const h = harness(dir, { www: kind });
    const result = await checkWwwForwarding({ host: HOSTS.cloudflare, deps: h.deps });
    return { result, h, logs: h.logs.join('\n') };
  };

  it('is happy when www answers with a redirect to the apex, and asks it without following the redirect', async () => {
    const { result, h, logs } = await run('forwards');
    expect(result).toEqual({ state: 'forwards', detail: '301 to https://echoesofspira.com/' });
    expect(logs).toMatch(/www check: www\.echoesofspira\.com forwards to the apex \(301 to https:\/\/echoesofspira\.com\/\)/);
    expect(logs).not.toMatch(/WARNING/);
    expect(h.fetches).toEqual([{ url: 'https://www.echoesofspira.com/', init: { redirect: 'manual' } }]);
  });

  it('warns loudly when www serves the game itself, because saves made there would not be the saves on the apex', async () => {
    const { result, logs } = await run('serves-game');
    expect(result.state).toBe('serves-game');
    expect(logs).toMatch(/WARNING: www check: .*answers 200 with the game itself\. Saves made there would NOT be the saves on https:\/\/echoesofspira\.com\//);
    expect(logs).toMatch(/docs\/handoff\/cf-switch\.md/);
    expect(logs).toMatch(/Nothing was changed/);
  });

  it('warns, and changes nothing, when www answers with an error, redirects elsewhere or does not resolve yet', async () => {
    const error = await run('error');
    expect(error.result).toEqual({ state: 'other', detail: 'status 522' });
    expect(error.logs).toMatch(/WARNING: www check: www\.echoesofspira\.com does not forward to https:\/\/echoesofspira\.com\/ yet \(status 522\)/);
    const elsewhere = await run('redirect-elsewhere');
    expect(elsewhere.result).toEqual({ state: 'other', detail: 'status 302, Location https://example.com/' });
    const gone = await run('unreachable');
    expect(gone.result.state).toBe('unreachable');
    expect(gone.result.detail).toMatch(/did not answer \(ENOTFOUND\)/);
    expect(gone.logs).toMatch(/WARNING: www check/);
  });

  it('never fails the deploy: a www that is not set up yet is a warning, and the Custom Domain still records as the live address', async () => {
    const h = harness(dir, { www: 'unreachable' });
    const result = await publishToCloudflare({ ...publishArgs(), deps: h.deps });
    expect(result.liveUrl).toBe(CANONICAL);
    expect(result.www?.state).toBe('unreachable');
    expect(h.logs.join('\n')).toMatch(/WARNING: www check/);
  });

  it('does nothing for a host with no www', async () => {
    const h = harness(dir);
    expect(await checkWwwForwarding({ host: { ...HOSTS.cloudflare, wwwHost: undefined }, deps: h.deps })).toMatchObject({ state: 'skipped' });
    expect(h.fetches).toHaveLength(0);
  });
});

describe('publishToCloudflare, Pages', () => {
  const pages = (extra: Partial<PublishInput> = {}) => publishArgs({ kind: 'pages', ...extra });

  it('deploys to the production branch of an existing project, then verifies this deployment and its alias', async () => {
    const h = harness(dir);
    const result = await publishToCloudflare({ ...pages(), deps: h.deps });
    expect(h.calls.map((c) => c.args.slice(1, 4).join(' '))).toEqual(['pages project list', 'pages deploy ROOT/dist-release']);
    const deploy = h.calls[1] as Call;
    expect(deploy.args.slice(1)).toEqual([
      'pages', 'deploy', 'ROOT/dist-release', '--project-name', 'echoes-of-spira', '--branch', 'main',
      '--commit-hash', 'abc1234', '--commit-message', 'Pyrefly abc1234 2026-10-04T12:00:00.000Z',
    ]);
    expect(deploy.options).toMatchObject({ cwd: 'ROOT', shell: false });
    expect(deploy.options.stdio).toEqual([...WRANGLER_STDIO]);
    expect((deploy.options.env as Record<string, string>).WRANGLER_OUTPUT_FILE_PATH).toBe(join(dir, 'wrangler-output.ndjson'));
    expect(h.calls[0]?.options.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    expect(result).toMatchObject({ kind: 'pages', siteName: 'echoes-of-spira', versionId: 'dep-1', urls: [PAGES_DEPLOYMENT, PAGES_ALIAS], liveUrl: PAGES_ALIAS });
    expect(h.verifyCalls.map((v) => v.url)).toEqual([PAGES_DEPLOYMENT, PAGES_ALIAS]);
    expect(h.logs.join('\n')).toMatch(/Pages project echoes-of-spira exists/);
    expect(h.logs.join('\n')).not.toMatch(/dry-run/);
    expectNothingForbidden(h);
  });

  it('sends a preview to the preview branch of the same project and compares every file', async () => {
    const h = harness(dir);
    const result = await publishToCloudflare({ ...pages({ preview: true, fullVerify: true }), deps: h.deps });
    const deploy = h.calls[1] as Call;
    expect(deploy.args[deploy.args.indexOf('--branch') + 1]).toBe('preview');
    expect(deploy.args[deploy.args.indexOf('--project-name') + 1]).toBe('echoes-of-spira');
    expect(result.liveUrl).toBe(PAGES_PREVIEW_ALIAS);
    expect(h.verifyCalls.every((v) => v.options.full)).toBe(true);
    expect(h.logs.join('\n')).toMatch(/branch preview.*\(PREVIEW\)/);
  });

  it('stops when the project does not exist and --create-project was not given, telling how', async () => {
    const h = harness(dir, { projects: ['someone-elses-project'] });
    await expect(publishToCloudflare({ ...pages(), deps: h.deps })).rejects.toThrow(/does not exist in this account yet.*--create-project.*--production-branch main --force/s);
    expect(h.calls).toHaveLength(1);
    expect(h.verifyCalls).toHaveLength(0);
  });

  it('creates the project with the hidden --force when asked, then deploys', async () => {
    const h = harness(dir, { projects: [] });
    await publishToCloudflare({ ...pages({ createProject: true }), deps: h.deps });
    expect(h.calls.map((c) => c.args.slice(1, 4).join(' '))).toEqual(['pages project list', 'pages project create', 'pages deploy ROOT/dist-release']);
    expect((h.calls[1] as Call).args.slice(1)).toEqual(['pages', 'project', 'create', 'echoes-of-spira', '--production-branch', 'main', '--force']);
    expect((h.calls[1] as Call).options.stdio).toEqual([...WRANGLER_STDIO]);
    expect(h.logs.join('\n')).toMatch(/creating the Pages project echoes-of-spira/);
    expectNothingForbidden(h);
  });

  it('does not create a project that already exists, even with --create-project', async () => {
    const h = harness(dir);
    await publishToCloudflare({ ...pages({ createProject: true }), deps: h.deps });
    expect(h.calls.some((c) => c.args.includes('create'))).toBe(false);
  });

  it('stops before uploading when the project cannot be created, listed or read', async () => {
    const failedCreate = harness(dir, { projects: [], createStatus: 1 });
    await expect(publishToCloudflare({ ...pages({ createProject: true }), deps: failedCreate.deps })).rejects.toThrow(/creating the Pages project echoes-of-spira failed \(exit 1\).*nothing was uploaded/s);
    expect(failedCreate.calls.some((c) => c.args[1] === 'pages' && c.args[2] === 'deploy')).toBe(false);
    const failedList = harness(dir, { listStatus: 1 });
    await expect(publishToCloudflare({ ...pages(), deps: failedList.deps })).rejects.toThrow(/could not list the Pages projects \(exit 1\)/);
    const unreadable = harness(dir, { projects: 'unreadable' });
    await expect(publishToCloudflare({ ...pages(), deps: unreadable.deps })).rejects.toThrow(/could not read the list of Pages projects/);
  });

  it('fails clearly when the Pages deploy fails, leaves no entry, or names no address', async () => {
    const failed = harness(dir, { deployStatus: 1 });
    await expect(publishToCloudflare({ ...pages(), deps: failed.deps })).rejects.toThrow(/wrangler pages deploy failed \(exit 1\).*nothing was verified or recorded/s);
    const noEntry = harness(dir, { output: '{"type":"deploy","version":1,"worker_name":"echoes-of-spira","targets":[]}' });
    await expect(publishToCloudflare({ ...pages(), deps: noEntry.deps })).rejects.toThrow(/no deploy entry for echoes-of-spira/);
    const noUrl = harness(dir, { output: '{"type":"pages-deploy-detailed","version":1,"pages_project":"echoes-of-spira"}' });
    await expect(publishToCloudflare({ ...pages(), deps: noUrl.deps })).rejects.toThrow(/reported no address.*no \.pages\.dev address/s);
  });

  it('works with only the deployment address when Pages names no alias', async () => {
    const out = '{"type":"pages-deploy-detailed","version":1,"pages_project":"echoes-of-spira","deployment_id":"dep-9","url":"https://abc123.echoes-of-spira.pages.dev"}';
    const h = harness(dir, { output: out });
    const result = await publishToCloudflare({ ...pages(), deps: h.deps });
    expect(result.urls).toEqual([PAGES_DEPLOYMENT]);
    expect(result.liveUrl).toBe(PAGES_DEPLOYMENT);
  });

  it('runs the wrangler that PYREFLY_WRANGLER_BIN names for every call', async () => {
    const bin = 'D:/scratch/wrangler/bin/wrangler.js';
    const h = harness(dir, { deps: { existsSync: (p: string) => p === bin, env: { PYREFLY_WRANGLER_BIN: bin, CLOUDFLARE_API_TOKEN: SECRET } } });
    await publishToCloudflare({ ...pages(), deps: h.deps });
    expect(h.calls.every((c) => c.args[0] === bin)).toBe(true);
  });
});
