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
  PREVIEW_LOG_NAME,
  checkBuildBase,
  checkUploadLimits,
  compareUploadSet,
  describeHostPlan,
  formatPreviewLogLine,
  hostBuildEnv,
  listUploadFiles,
  parseHostArgs,
  siteNameFor,
} from '../../tools/deploy-host.mjs';

const REPO = resolve(__dirname, '..', '..');
const MIB = 1024 * 1024;

describe('the default host: GitHub Pages stays the default until Bailey switches', () => {
  // Deliberate tripwire. Switching is Bailey's word and one commit (docs/handoff/r39-cloudflare.md,
  // "The switch"): that commit changes DEFAULT_HOST and this expectation together.
  it('is github, at its known address and base', () => {
    expect(DEFAULT_HOST).toBe('github');
    expect(HOSTS.github.liveUrl).toBe('https://baileypillon.github.io/pyrefly-reprise/');
    expect(HOSTS.github.base).toBe('/pyrefly-reprise/');
  });

  it('serves Cloudflare from the root, named after the new title (D-368, D-369), its address unknown until a deploy reports it', () => {
    expect(HOSTS.cloudflare.base).toBe('/');
    expect(HOSTS.cloudflare.liveUrl).toBeNull();
    expect(HOSTS.cloudflare.workerName).toBe('echoes-of-spira');
    expect(HOSTS.cloudflare.pagesProject).toBe('echoes-of-spira');
    expect(HOSTS.cloudflare.previewWorkerName).toBe(`${HOSTS.cloudflare.workerName}-preview`);
  });

  it('prepares Workers static assets by default and Pages as the other kind', () => {
    expect(HOSTS.cloudflare.kind).toBe('workers');
    expect(Object.keys(CLOUDFLARE_KINDS)).toEqual(['workers', 'pages']);
  });
});

describe('parseHostArgs', () => {
  it('defaults to the default host, with nothing to refuse and no Cloudflare kind', () => {
    expect(parseHostArgs({})).toMatchObject({ ok: true, kind: null, preview: false, fullVerify: false, createProject: false, refusal: null });
    const github = parseHostArgs({ host: 'github' });
    expect(github.ok && github.host.name).toBe('github');
  });

  it('accepts a Cloudflare preview, which always compares every file', () => {
    const r = parseHostArgs({ host: 'Cloudflare', preview: true });
    expect(r).toMatchObject({ ok: true, kind: 'workers', preview: true, fullVerify: true, refusal: null });
    expect(r.ok && r.host.name).toBe('cloudflare');
  });

  it('parses a production request for a non-default host but marks it refused', () => {
    const r = parseHostArgs({ host: 'cloudflare' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.refusal).toMatch(/not the default host/);
    expect(r.refusal).toMatch(/DEFAULT_HOST/);
    expect(r.refusal).toMatch(/--preview/);
    expect(r.fullVerify).toBe(false);
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
    const onGithub = parseHostArgs({ kind: 'pages' });
    expect(!onGithub.ok && onGithub.error).toMatch(/--kind needs --host=cloudflare/);
  });

  it('allows --create-project only for Pages, where the project has to exist first', () => {
    expect(parseHostArgs({ host: 'cloudflare', kind: 'pages', preview: true, 'create-project': true })).toMatchObject({ ok: true, createProject: true });
    const workers = parseHostArgs({ host: 'cloudflare', preview: true, 'create-project': true });
    expect(!workers.ok && workers.error).toMatch(/needs --kind=pages/);
    expect(parseHostArgs({ 'create-project': true })).toMatchObject({ ok: false });
  });

  it('names the choices for an unknown host and refuses a bare --host', () => {
    const unknown = parseHostArgs({ host: 'netlify' });
    expect(unknown).toMatchObject({ ok: false });
    expect(!unknown.ok && unknown.error).toMatch(/github, cloudflare/);
    expect(parseHostArgs({ host: true })).toMatchObject({ ok: false });
  });

  it('keeps Cloudflare-only flags off GitHub Pages, and takes no value for a flag', () => {
    const preview = parseHostArgs({ preview: true });
    expect(!preview.ok && preview.error).toMatch(/--preview needs --host=cloudflare/);
    expect(parseHostArgs({ 'full-verify': true })).toMatchObject({ ok: false });
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
  it('leaves GitHub Pages on vite.config.ts\'s own default and builds Cloudflare for the root', () => {
    expect(hostBuildEnv(HOSTS.github)).toEqual({});
    expect(hostBuildEnv(HOSTS.cloudflare)).toEqual({ BASE_PATH: '/' });
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
});

describe('describeHostPlan', () => {
  it('says plainly what each run will do', () => {
    expect(describeHostPlan(HOSTS.github).join('\n')).toMatch(/GitHub Pages.*baileypillon\.github\.io.*the default/);
    const workers = describeHostPlan(HOSTS.cloudflare, { kind: 'workers', preview: true, fullVerify: true }).join('\n');
    expect(workers).toMatch(/Cloudflare Workers static assets, PREVIEW/);
    expect(workers).toMatch(/worker: echoes-of-spira-preview/);
    expect(workers).toMatch(/BASE_PATH=\//);
    expect(workers).toMatch(/deploy --dry-run/);
    expect(workers).toMatch(/every file compared byte for byte/);
    expect(workers).toContain(PREVIEW_LOG_NAME);
    const production = describeHostPlan(HOSTS.cloudflare, { kind: 'workers' }).join('\n');
    expect(production).toMatch(/PRODUCTION/);
    expect(production).toMatch(/docs\/deploys\.log \(host=cloudflare\)/);
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

  it('keeps the wrangler config an assets-only Worker with nothing secret or account-specific in it', () => {
    const file = join(REPO, ...HOSTS.cloudflare.wranglerConfig!.split('/'));
    const config = JSON.parse(stripComments(readFileSync(file, 'utf8')));
    expect(Object.keys(config).sort()).toEqual(['assets', 'compatibility_date', 'name', 'preview_urls', 'workers_dev']);
    expect(config.name).toBe(HOSTS.cloudflare.workerName);
    expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(config.workers_dev).toBe(true);
    expect(config.assets).toEqual({ directory: '../../dist-release' });
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
