/**
 * The pure rules behind `tools/deploy-pages.mjs --host=cloudflare` (r39-cloudflare, 2026-10-04):
 * which host and Cloudflare kind a run targets, what a Cloudflare build and upload must look like,
 * how wrangler is invoked and its output read, and how the logs stay readable by the critic tools.
 *
 * No network, no account, no wrangler: every function here is pure, or reads only a temporary
 * directory the test made. Game case: both (delivery tooling, no gameplay).
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { lastDeployedSha } from '../../tools/critic-plan.mjs';
import { formatDeployLogLine } from '../../tools/deploy-pages.mjs';
import {
  CLOUDFLARE_KINDS,
  CLOUDFLARE_LIMITS,
  DEFAULT_HOST,
  HOSTS,
  LEGACY_LOG_NAME,
  LIVE_URL,
  PREVIEW_LOG_NAME,
  checkBuildBase,
  checkUploadLimits,
  compareUploadSet,
  describeHostPlan,
  formatLegacyLogLine,
  formatPreviewLogLine,
  hostBuildEnv,
  hostRequestRole,
  listUploadFiles,
  parseHostArgs,
  siteNameFor,
  wranglerConfigFor,
} from '../../tools/deploy-host.mjs';
import { checkWranglerConfig } from '../../tools/deploy-wrangler.mjs';

const REPO = resolve(__dirname, '..', '..');
const MIB = 1024 * 1024;

describe('the default host: Cloudflare, since the switch of 2026-10-04', () => {
  // Deliberate tripwire. Switching the default host is Bailey's word and one commit (docs/handoff/cf-switch.md):
  // that commit changes DEFAULT_HOST and this expectation together. Bailey, 2026-10-04: "Yes I will go with
  // your recommendation" (release 38 on echoesofspira.com as the production Cloudflare site).
  it('is cloudflare, and the live address is echoesofspira.com', () => {
    expect(DEFAULT_HOST).toBe('cloudflare');
    expect(HOSTS.cloudflare.liveUrl).toBe('https://echoesofspira.com/');
    expect(LIVE_URL).toBe('https://echoesofspira.com/');
    expect(LIVE_URL).toBe(HOSTS[DEFAULT_HOST].liveUrl);
  });

  it('keeps GitHub Pages as the OLD address, deployable only as a legacy host', () => {
    expect(HOSTS.github.liveUrl).toBe('https://baileypillon.github.io/pyrefly-reprise/');
    expect(HOSTS.github.base).toBe('/pyrefly-reprise/');
    expect(HOSTS.github.legacy).toBe(true);
    expect(HOSTS.cloudflare.legacy).toBeUndefined();
  });

  it('serves Cloudflare from the root, named after the new title (D-368, D-369), at the Custom Domain Bailey bought', () => {
    expect(HOSTS.cloudflare.base).toBe('/');
    expect(HOSTS.cloudflare.customDomain).toBe('echoesofspira.com');
    expect(HOSTS.cloudflare.liveUrl).toBe(`https://${HOSTS.cloudflare.customDomain}/`);
    expect(HOSTS.cloudflare.wwwHost).toBe(`www.${HOSTS.cloudflare.customDomain}`);
    expect(HOSTS.cloudflare.workerName).toBe('echoes-of-spira');
    expect(HOSTS.cloudflare.pagesProject).toBe('echoes-of-spira');
    expect(HOSTS.cloudflare.previewWorkerName).toBe(`${HOSTS.cloudflare.workerName}-preview`);
  });

  it('prepares Workers static assets by default and Pages as the other kind', () => {
    expect(HOSTS.cloudflare.kind).toBe('workers');
    expect(Object.keys(CLOUDFLARE_KINDS)).toEqual(['workers', 'pages']);
  });

  it('gives the preview Worker its own config file, so it never reads the production one', () => {
    expect(wranglerConfigFor(HOSTS.cloudflare, false)).toBe('tools/cloudflare/wrangler.jsonc');
    expect(wranglerConfigFor(HOSTS.cloudflare, true)).toBe('tools/cloudflare/wrangler.preview.jsonc');
  });
});

describe('parseHostArgs', () => {
  it('defaults to the default host: a production Workers deploy, with nothing to refuse and no legacy mode', () => {
    expect(parseHostArgs({})).toMatchObject({ ok: true, kind: 'workers', preview: false, legacy: false, fullVerify: false, createProject: false, refusal: null });
    const home = parseHostArgs({});
    expect(home.ok && home.host.name).toBe('cloudflare');
  });

  it('takes --host=github as a LEGACY deploy of the old address: allowed, never refused, never a preview', () => {
    const github = parseHostArgs({ host: 'github' });
    expect(github).toMatchObject({ ok: true, kind: null, preview: false, legacy: true, fullVerify: false, refusal: null });
    expect(github.ok && github.host.name).toBe('github');
    expect(parseHostArgs({ host: ' GitHub ' })).toMatchObject({ ok: true, legacy: true });
  });

  it('accepts a Cloudflare preview, which always compares every file', () => {
    const r = parseHostArgs({ host: 'Cloudflare', preview: true });
    expect(r).toMatchObject({ ok: true, kind: 'workers', preview: true, legacy: false, fullVerify: true, refusal: null });
    expect(r.ok && r.host.name).toBe('cloudflare');
    expect(parseHostArgs({ preview: true })).toMatchObject({ ok: true, preview: true, fullVerify: true });
  });

  it('refuses a production request for a host that is neither the default nor legacy (the rule that keeps docs/deploys.log to one host)', () => {
    // No such host exists today (GitHub is legacy), so the rule is shown on the decision itself, as if the defaults were switched back.
    const home = hostRequestRole(HOSTS.cloudflare, { defaultHost: 'github' });
    expect(home.legacy).toBe(false);
    expect(home.refusal).toMatch(/Cloudflare is not the default host \(GitHub Pages\)/);
    expect(home.refusal).toMatch(/DEFAULT_HOST/);
    expect(home.refusal).toMatch(/--preview/);
    expect(hostRequestRole(HOSTS.cloudflare, { defaultHost: 'github', preview: true })).toEqual({ legacy: false, refusal: null });
    expect(hostRequestRole(HOSTS.cloudflare, { defaultHost: 'cloudflare' })).toEqual({ legacy: false, refusal: null });
    expect(hostRequestRole(HOSTS.github, { defaultHost: 'cloudflare' })).toEqual({ legacy: true, refusal: null });
    expect(hostRequestRole(HOSTS.github, { defaultHost: 'github' })).toEqual({ legacy: false, refusal: null });
    expect(hostRequestRole({ name: 'cloudflare', label: 'Cloudflare' }, { defaultHost: 'github' }).refusal).toMatch(/not the default host/);
  });

  it('lets --full-verify widen a production check on Cloudflare', () => {
    const r = parseHostArgs({ host: 'cloudflare', 'full-verify': true });
    expect(r.ok && r.fullVerify).toBe(true);
  });

  it('picks the Cloudflare kind from --kind, case-insensitively, and refuses anything else', () => {
    expect(parseHostArgs({ host: 'cloudflare', kind: 'Pages', preview: true })).toMatchObject({ ok: true, kind: 'pages' });
    expect(parseHostArgs({ host: 'cloudflare', kind: 'workers', preview: true })).toMatchObject({ ok: true, kind: 'workers' });
    const bad = parseHostArgs({ host: 'cloudflare', kind: 'lambda', preview: true });
    expect(!bad.ok && bad.error).toMatch(/--kind=workers or --kind=pages/);
    expect(parseHostArgs({ host: 'cloudflare', kind: true, preview: true })).toMatchObject({ ok: false });
    const onGithub = parseHostArgs({ host: 'github', kind: 'pages' });
    expect(!onGithub.ok && onGithub.error).toMatch(/--kind needs --host=cloudflare/);
  });

  it('allows --create-project only for Pages, where the project has to exist first', () => {
    expect(parseHostArgs({ host: 'cloudflare', kind: 'pages', preview: true, 'create-project': true })).toMatchObject({ ok: true, createProject: true });
    const workers = parseHostArgs({ host: 'cloudflare', preview: true, 'create-project': true });
    expect(!workers.ok && workers.error).toMatch(/needs --kind=pages/);
    expect(parseHostArgs({ 'create-project': true })).toMatchObject({ ok: false });
    expect(parseHostArgs({ host: 'github', 'create-project': true })).toMatchObject({ ok: false });
  });

  it('names the choices for an unknown host and refuses a bare --host', () => {
    const unknown = parseHostArgs({ host: 'netlify' });
    expect(unknown).toMatchObject({ ok: false });
    expect(!unknown.ok && unknown.error).toMatch(/github, cloudflare/);
    expect(parseHostArgs({ host: true })).toMatchObject({ ok: false });
  });

  it('keeps Cloudflare-only flags off GitHub Pages, and takes no value for a flag', () => {
    const preview = parseHostArgs({ host: 'github', preview: true });
    expect(!preview.ok && preview.error).toMatch(/--preview needs --host=cloudflare/);
    expect(parseHostArgs({ host: 'github', 'full-verify': true })).toMatchObject({ ok: false });
    const valued = parseHostArgs({ host: 'cloudflare', preview: 'yes' });
    expect(!valued.ok && valued.error).toMatch(/takes no value/);
  });

  it('names the Worker or the Pages project a run deploys to', () => {
    expect(siteNameFor(HOSTS.cloudflare, 'workers', false)).toBe('echoes-of-spira');
    expect(siteNameFor(HOSTS.cloudflare, 'workers', true)).toBe('echoes-of-spira-preview');
    expect(siteNameFor(HOSTS.cloudflare, 'pages', false)).toBe('echoes-of-spira');
    expect(siteNameFor(HOSTS.cloudflare, 'pages', true)).toBe('echoes-of-spira');
  });
});

describe('hostBuildEnv: the base each host builds with', () => {
  it('sets both bases explicitly, so a BASE_PATH left in the shell by an earlier run cannot decide a build', () => {
    expect(hostBuildEnv(HOSTS.github)).toEqual({ BASE_PATH: '/pyrefly-reprise/' });
    expect(hostBuildEnv(HOSTS.cloudflare)).toEqual({ BASE_PATH: '/' });
  });

  it('gives GitHub the same base vite.config.ts defaults to, so a plain build and a deploy build agree', () => {
    const config = readFileSync(join(REPO, 'vite.config.ts'), 'utf8');
    expect(config).toContain(`process.env.BASE_PATH ?? '${HOSTS.github.base}'`);
  });
});

describe('checkBuildBase: a build for the wrong base serves a blank page', () => {
  const root = '<script type="module" crossorigin src="/assets/index-AbC123_x.js"></script><link rel="preload" as="image" href="/art/title/keyart.png">';
  const project = root.replaceAll('"/', '"/pyrefly-reprise/');

  it('accepts a root build for Cloudflare and a project build for GitHub Pages', () => {
    expect(checkBuildBase(root, '/')).toEqual([]);
    expect(checkBuildBase(project, '/pyrefly-reprise/')).toEqual([]);
  });

  it('refuses the GitHub build on Cloudflare, naming the leftover base', () => {
    const problems = checkBuildBase(project, '/');
    expect(problems.length).toBeGreaterThanOrEqual(2);
    expect(problems.join('\n')).toMatch(/\/pyrefly-reprise\/assets\/index-AbC123_x\.js/);
  });

  it('refuses the base Git Bash\'s path conversion makes of BASE_PATH=/', () => {
    const mangled = root.replaceAll('"/', '"/Program Files/Git/');
    expect(checkBuildBase(mangled, '/').join('\n')).toMatch(/\/Program Files\/Git\/assets\/index-AbC123_x\.js|does not load \/assets\/index-/);
    expect(checkBuildBase(mangled, '/')).not.toEqual([]);
  });

  it('refuses a root address on a project-base build and an index with no bundle at all', () => {
    expect(checkBuildBase(`${project}<link href="/art/x.png">`, '/pyrefly-reprise/').join('\n')).toMatch(/\/art\/x\.png/);
    expect(checkBuildBase('<h1>hello</h1>', '/')[0]).toMatch(/does not load \/assets\/index-/);
  });

  it('reads url(...) addresses too and ignores relative and protocol-relative ones', () => {
    const css = `${root}<style>body{background:url(/pyrefly-reprise/art/a.png)}</style>`;
    expect(checkBuildBase(css, '/').join('\n')).toMatch(/\/pyrefly-reprise\/art\/a\.png/);
    const ignored = `${root}<script src="//cdn.example.com/x.js"></script><img src="./local.png">`;
    expect(checkBuildBase(ignored, '/')).toEqual([]);
  });
});

describe('the upload set and its limits (read from Cloudflare\'s docs, proved with wrangler 4.147.0 on 2026-10-04)', () => {
  let dir = '';
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pyrefly-deploy-host-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const put = (rel: string, body = 'x') => {
    const full = join(dir, ...rel.split('/'));
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };

  it('lists what a Workers upload would send: dotfiles and .git included, root config files apart', () => {
    put('index.html', '<h1>x</h1>');
    put('art/a.png', 'png');
    put('.nojekyll', '');
    put('.git/objects/aa/bbb', 'object');
    put('_headers');
    put('_redirects');
    put('.assetsignore');
    put('sub/_headers', 'not at the root, so an ordinary file');
    const { files, configFiles } = listUploadFiles(dir);
    expect(files.map((f) => f.path)).toEqual(['.git/objects/aa/bbb', '.nojekyll', 'art/a.png', 'index.html', 'sub/_headers']);
    expect(files.find((f) => f.path === 'index.html')?.bytes).toBe(10);
    expect([...configFiles].sort()).toEqual(['.assetsignore', '_headers', '_redirects']);
  });

  it('lists what a Pages upload would send: it skips .git, .wrangler, node_modules and .DS_Store anywhere, and the root config and Functions', () => {
    put('index.html', '<h1>x</h1>');
    put('art/.DS_Store');
    put('art/a.png', 'png');
    put('.nojekyll', '');
    put('.git/HEAD', 'ref');
    put('.wrangler/tmp/x', 'x');
    put('sub/node_modules/pkg/index.js', 'x');
    put('_headers');
    put('_routes.json');
    put('_worker.js');
    put('functions/api.js', 'a Pages Function, not an asset');
    put('sub/_routes.json', 'not at the root, so an ordinary file');
    const { files, configFiles } = listUploadFiles(dir, 'pages');
    expect(files.map((f) => f.path)).toEqual(['.nojekyll', 'art/a.png', 'index.html', 'sub/_routes.json']);
    expect([...configFiles].sort()).toEqual(['_headers', '_routes.json', '_worker.js', 'functions']);
  });

  it('puts the per-file edge exactly where wrangler does: 25 MiB passes, one byte more fails', () => {
    expect(CLOUDFLARE_LIMITS.maxFileBytes).toBe(26_214_400);
    expect(checkUploadLimits([{ path: 'a.png', bytes: 26_214_400 }]).ok).toBe(true);
    const over = checkUploadLimits([{ path: 'big/idle.png', bytes: 26_214_401 }]);
    expect(over.ok).toBe(false);
    expect(over.problems[0]).toMatch(/big\/idle\.png/);
    expect(over.problems[0]).toMatch(/25\.00 MiB/);
  });

  it('lists the first ten oversize files and counts the rest', () => {
    const files = Array.from({ length: 12 }, (_, i) => ({ path: `f${i}.png`, bytes: 30 * MIB }));
    const report = checkUploadLimits(files);
    expect(report.problems).toHaveLength(11);
    expect(report.problems[10]).toMatch(/and 2 more/);
  });

  it('holds the file count to the free plan\'s 20,000 and says what a paid plan allows', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ path: `f${i}`, bytes: 1 }));
    expect(checkUploadLimits(many(20_000)).ok).toBe(true);
    const over = checkUploadLimits(many(20_001));
    expect(over.ok).toBe(false);
    expect(over.problems[0]).toMatch(/20000/);
    expect(over.problems[0]).toMatch(/100000/);
  });

  it('reports the total and the three largest files', () => {
    const report = checkUploadLimits([
      { path: 'a', bytes: 5 }, { path: 'b', bytes: 50 }, { path: 'c', bytes: 20 }, { path: 'd', bytes: 10 },
    ]);
    expect(report.totalBytes).toBe(85);
    expect(report.largest.map((f) => f.path)).toEqual(['b', 'c', 'd']);
    expect(report.fileCount).toBe(4);
  });

  it('compares the upload set with the manifest, the manifest file itself counting as listed', () => {
    const files = [
      { path: 'index.html', bytes: 1 }, { path: 'artifact-manifest.json', bytes: 1 }, { path: '.git/HEAD', bytes: 1 },
    ];
    const manifestFiles = { 'index.html': {}, 'art/a.png': {} };
    expect(compareUploadSet(files, manifestFiles, 'artifact-manifest.json')).toEqual({
      unlisted: ['.git/HEAD'],
      missing: ['art/a.png'],
    });
    const clean = [{ path: 'index.html', bytes: 1 }, { path: 'art/a.png', bytes: 1 }, { path: 'artifact-manifest.json', bytes: 1 }];
    expect(compareUploadSet(clean, manifestFiles, 'artifact-manifest.json')).toEqual({ unlisted: [], missing: [] });
  });
});

describe('the logs stay readable by the critic tools', () => {
  const base = { isoNow: '2026-10-04T10:00:00.000Z', mainSha: 'abc1234', bundleHash: 'Bund1e', artFileCount: 10, status: 'ok' };
  const preview = { isoNow: base.isoNow, mainSha: 'abc1234', bundleHash: 'Bund1e', artFileCount: 10, host: 'cloudflare', kind: 'workers', site: 'echoes-of-spira-preview', url: 'https://x.workers.dev/' };

  it('gives docs/deploys.log a trailing host field and changes nothing else', () => {
    expect(formatDeployLogLine({ ...base, host: 'cloudflare' })).toBe('2026-10-04T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=ok\thost=cloudflare\n');
    expect(formatDeployLogLine({ ...base, overrideUsed: true, host: 'github' })).toBe('2026-10-04T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=ok\toverride=owner\thost=github\n');
    expect(formatDeployLogLine(base)).toBe('2026-10-04T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=ok\n');
  });

  it('logs a preview in its own file, with a status no reader mistakes for the live build', () => {
    expect(PREVIEW_LOG_NAME).not.toBe('deploys.log');
    const line = formatPreviewLogLine(preview);
    expect(line).toBe('2026-10-04T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=preview\thost=cloudflare\tkind=workers\tsite=echoes-of-spira-preview\turl=https://x.workers.dev/\n');
    expect(line).not.toMatch(/\tstatus=ok/);
  });

  it('shows in the preview line when Bailey\'s override let it out, as deploys.log does', () => {
    expect(formatPreviewLogLine({ ...preview, overrideUsed: true })).toBe(`${formatPreviewLogLine(preview).trimEnd()}\toverride=owner\n`);
    expect(formatPreviewLogLine({ ...preview, overrideUsed: true })).not.toMatch(/\tstatus=ok/);
  });

  it('keeps critic-plan\'s "last deployed build" on the last real deploy even if a preview line ever reaches the log', () => {
    const root = mkdtempSync(join(tmpdir(), 'pyrefly-deploy-log-'));
    try {
      mkdirSync(join(root, 'docs'));
      const stray = formatPreviewLogLine({ ...preview, isoNow: '2026-10-05T10:00:00.000Z', mainSha: 'fffffff' });
      writeFileSync(join(root, 'docs', 'deploys.log'), `${formatDeployLogLine({ ...base, host: 'github' })}${stray}`);
      expect(lastDeployedSha(root)).toBe('abc1234');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  const legacy = { isoNow: base.isoNow, mainSha: 'abc1234', bundleHash: 'Bund1e', artFileCount: 10, host: 'github', url: 'https://baileypillon.github.io/pyrefly-reprise/' };

  it('logs a legacy deploy of the old GitHub address in its own file, with a status no reader mistakes for the live build', () => {
    expect(LEGACY_LOG_NAME).toBe('legacy-deploys.log');
    expect(LEGACY_LOG_NAME).not.toBe('deploys.log');
    expect(LEGACY_LOG_NAME).not.toBe(PREVIEW_LOG_NAME);
    const line = formatLegacyLogLine(legacy);
    expect(line).toBe('2026-10-04T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=legacy\thost=github\turl=https://baileypillon.github.io/pyrefly-reprise/\n');
    expect(line).not.toMatch(/\tstatus=ok/);
    expect(formatLegacyLogLine({ ...legacy, overrideUsed: true })).toBe(`${line.trimEnd()}\toverride=owner\n`);
  });

  it('keeps the live build on the last real deploy even when a legacy line, newer than it, reaches deploys.log', () => {
    const root = mkdtempSync(join(tmpdir(), 'pyrefly-deploy-log-'));
    try {
      mkdirSync(join(root, 'docs'));
      const stray = formatLegacyLogLine({ ...legacy, isoNow: '2026-10-05T10:00:00.000Z', mainSha: 'eeeeeee' });
      writeFileSync(join(root, 'docs', 'deploys.log'), `${formatDeployLogLine({ ...base, host: 'cloudflare' })}${stray}`);
      expect(lastDeployedSha(root)).toBe('abc1234');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('describeHostPlan', () => {
  it('says plainly what each run will do', () => {
    const workers = describeHostPlan(HOSTS.cloudflare, { kind: 'workers', preview: true, fullVerify: true }).join('\n');
    expect(workers).toMatch(/Cloudflare Workers static assets, PREVIEW/);
    expect(workers).toMatch(/worker: echoes-of-spira-preview, config tools\/cloudflare\/wrangler\.preview\.jsonc/);
    expect(workers).toMatch(/BASE_PATH=\//);
    expect(workers).toMatch(/deploy --dry-run/);
    expect(workers).toMatch(/every file compared byte for byte/);
    expect(workers).toContain(PREVIEW_LOG_NAME);
    expect(workers).not.toMatch(/Custom Domain/);
    const production = describeHostPlan(HOSTS.cloudflare, { kind: 'workers' }).join('\n');
    expect(production).toMatch(/PRODUCTION \(the default host\)/);
    expect(production).toMatch(/worker: echoes-of-spira, config tools\/cloudflare\/wrangler\.jsonc/);
    expect(production).toMatch(/Custom Domain echoesofspira\.com \(the live address https:\/\/echoesofspira\.com\/\) plus the workers\.dev backup address/);
    expect(production).toMatch(/www\.echoesofspira\.com must forward to it/);
    expect(production).toMatch(/docs\/deploys\.log \(host=cloudflare\)/);
  });

  it('describes the legacy deploy of the old GitHub address: what it carries, and what it does not record', () => {
    const legacy = describeHostPlan(HOSTS.github, { legacy: true }).join('\n');
    expect(legacy).toMatch(/GitHub Pages, LEGACY deployment to the OLD address https:\/\/baileypillon\.github\.io\/pyrefly-reprise\//);
    expect(legacy).toMatch(/default host is Cloudflare, https:\/\/echoesofspira\.com\//);
    expect(legacy).toMatch(/BASE_PATH=\/pyrefly-reprise\//);
    expect(legacy).toMatch(/we've moved/);
    expect(legacy).toContain(LEGACY_LOG_NAME);
    expect(legacy).toMatch(/no critic obligation, no ledger entry, no stored artifact/);
  });

  it('still describes GitHub as a default host, for the day the default is switched back', () => {
    expect(describeHostPlan(HOSTS.github).join('\n')).toMatch(/GitHub Pages.*baileypillon\.github\.io.*the default/);
  });

  it('describes the Pages kind: branch, no local dry run, and what --create-project does', () => {
    const pages = describeHostPlan(HOSTS.cloudflare, { kind: 'pages', preview: true, createProject: true }).join('\n');
    expect(pages).toMatch(/Cloudflare Pages, PREVIEW/);
    expect(pages).toMatch(/project: echoes-of-spira, branch preview/);
    expect(pages).toMatch(/Pages has no local dry run/);
    expect(pages).toMatch(/--create-project, with the hidden --force/);
    const existing = describeHostPlan(HOSTS.cloudflare, { kind: 'pages' }).join('\n');
    expect(existing).toMatch(/branch main/);
    expect(existing).toMatch(/the project must already exist/);
  });
});

describe('what is committed for Cloudflare', () => {
  const stripComments = (text: string) => text.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const readConfig = (rel: string) => readFileSync(join(REPO, ...rel.split('/')), 'utf8');

  it('keeps the production config an assets-only Worker with one Custom Domain, nothing secret or account-specific in it', () => {
    const config = JSON.parse(stripComments(readConfig(HOSTS.cloudflare.wranglerConfig!)));
    expect(Object.keys(config).sort()).toEqual(['assets', 'compatibility_date', 'name', 'preview_urls', 'routes', 'workers_dev']);
    expect(config.name).toBe(HOSTS.cloudflare.workerName);
    expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(config.workers_dev).toBe(true);
    expect(config.preview_urls).toBe(false);
    expect(config.routes).toEqual([{ pattern: 'echoesofspira.com', custom_domain: true }]);
    expect(config.assets).toEqual({ directory: '../../dist-release' });
  });

  it('keeps the preview config the same Worker under its own name with NO routes, so a preview cannot move the Custom Domain', () => {
    const config = JSON.parse(stripComments(readConfig(HOSTS.cloudflare.previewWranglerConfig!)));
    expect(Object.keys(config).sort()).toEqual(['assets', 'compatibility_date', 'name', 'preview_urls', 'workers_dev']);
    expect(config.name).toBe(HOSTS.cloudflare.previewWorkerName);
    expect(config.workers_dev).toBe(true);
    expect(JSON.stringify(config)).not.toMatch(/route|custom_domain|echoesofspira\.com/);
    expect(config.assets).toEqual({ directory: '../../dist-release' });
  });

  it('passes the same check the deploy runs before it asks wrangler to deploy, for both committed configs', () => {
    const production = checkWranglerConfig(readConfig(HOSTS.cloudflare.wranglerConfig!), { name: HOSTS.cloudflare.workerName!, customDomain: HOSTS.cloudflare.customDomain });
    const preview = checkWranglerConfig(readConfig(HOSTS.cloudflare.previewWranglerConfig!), { name: HOSTS.cloudflare.previewWorkerName!, preview: true, customDomain: HOSTS.cloudflare.customDomain });
    expect(production).toEqual([]);
    expect(preview).toEqual([]);
    // and each file fails the other's check, which is the whole point of having two
    expect(checkWranglerConfig(readConfig(HOSTS.cloudflare.wranglerConfig!), { name: HOSTS.cloudflare.previewWorkerName!, preview: true, customDomain: HOSTS.cloudflare.customDomain }).join('\n')).toMatch(/must have no routes/);
    expect(checkWranglerConfig(readConfig(HOSTS.cloudflare.previewWranglerConfig!), { name: HOSTS.cloudflare.workerName!, customDomain: HOSTS.cloudflare.customDomain }).join('\n')).toMatch(/routes must be exactly/);
  });

  it('pins wrangler exactly, from npmjs.com, at the version the lockfile resolves', () => {
    const pkg = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as { devDependencies: Record<string, string> };
    const lock = JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8')) as { packages: Record<string, { version: string; resolved: string; integrity: string }> };
    const pinned = pkg.devDependencies.wrangler;
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
    const entry = lock.packages['node_modules/wrangler'];
    expect(entry?.version).toBe(pinned);
    expect(entry?.resolved).toBe(`https://registry.npmjs.org/wrangler/-/wrangler-${pinned}.tgz`);
    expect(entry?.integrity).toMatch(/^sha512-/);
  });

  it('ignores wrangler\'s scratch folder so it can never count as a dirty build path', () => {
    const ignore = readFileSync(join(REPO, '.gitignore'), 'utf8').split(/\r?\n/);
    expect(ignore).toContain('.wrangler/');
  });
});

describe('the pinned wrangler install outside the repo (tools/cloudflare/wrangler-install.json)', () => {
  interface Lock { packages: Record<string, { version?: string; resolved?: string; integrity?: string }> }
  const json = <T>(rel: string) => JSON.parse(readFileSync(join(REPO, ...rel.split('/')), 'utf8')) as T;
  const nameOf = (key: string) => key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);
  const byNameVersion = (lock: Lock) => new Map(
    Object.entries(lock.packages).filter(([key, v]) => key !== '' && v.version && v.integrity).map(([key, v]) => [`${nameOf(key)}@${v.version}`, v.integrity]),
  );

  it('names a folder on D: and the exact version package.json pins', () => {
    const install = json<{ version: string; dir: string; bin: string; recipe: string }>('tools/cloudflare/wrangler-install.json');
    const pkg = json<{ devDependencies: Record<string, string> }>('package.json');
    expect(install.version).toBe(pkg.devDependencies.wrangler);
    expect(install.dir).toBe(`D:/Tools/wrangler/${install.version}`);
    expect(install.bin).toBe('node_modules/wrangler/bin/wrangler.js');
    expect(install.recipe).toBe('tools/cloudflare/wrangler-install');
  });

  it('keeps a recipe that installs exactly that version, and nothing else, from a lockfile', () => {
    const pkg = json<{ devDependencies: Record<string, string> }>('package.json');
    const recipe = json<{ private: boolean; dependencies: Record<string, string>; devDependencies?: unknown }>('tools/cloudflare/wrangler-install/package.json');
    expect(recipe.private).toBe(true);
    expect(recipe.dependencies).toEqual({ wrangler: pkg.devDependencies.wrangler });
    expect(recipe.devDependencies).toBeUndefined();
    const lock = json<Lock & { lockfileVersion: number }>('tools/cloudflare/wrangler-install/package-lock.json');
    expect(lock.lockfileVersion).toBe(3);
    expect(lock.packages['node_modules/wrangler']?.version).toBe(pkg.devDependencies.wrangler);
    expect(lock.packages['node_modules/wrangler']?.resolved).toBe(`https://registry.npmjs.org/wrangler/-/wrangler-${pkg.devDependencies.wrangler}.tgz`);
  });

  it('agrees with the repo lockfile on the integrity of every package they share, wrangler first', () => {
    const repo = byNameVersion(json<Lock>('package-lock.json'));
    const recipe = byNameVersion(json<Lock>('tools/cloudflare/wrangler-install/package-lock.json'));
    const pkg = json<{ devDependencies: Record<string, string> }>('package.json');
    expect(recipe.get(`wrangler@${pkg.devDependencies.wrangler}`)).toBe(repo.get(`wrangler@${pkg.devDependencies.wrangler}`));
    expect(recipe.get(`wrangler@${pkg.devDependencies.wrangler}`)).toMatch(/^sha512-/);
    const missing = [...recipe.keys()].filter((key) => !repo.has(key));
    expect(missing).toEqual([]);
    for (const [key, integrity] of recipe) expect(repo.get(key)).toBe(integrity);
  });

  it('holds only registry.npmjs.org addresses and no path or address of this machine', () => {
    const text = readFileSync(join(REPO, 'tools', 'cloudflare', 'wrangler-install', 'package-lock.json'), 'utf8');
    const resolved = [...text.matchAll(/"resolved": "([^"]+)"/g)].map((m) => m[1]);
    expect(resolved.length).toBeGreaterThan(30);
    for (const url of resolved) expect(url).toMatch(/^https:\/\/registry\.npmjs\.org\//);
    expect(text).not.toMatch(/\b[A-Za-z]:[\\/](?!\/)/);
  });
});
