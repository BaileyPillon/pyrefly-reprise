/**
 * How wrangler is invoked and how its answers are read (`tools/deploy-wrangler.mjs`, r39-cloudflare,
 * 2026-10-04): the argument lists for a Workers deploy, a Pages deploy and a Pages project, its
 * environment and where its binary lives, its output file, and `whoami`. The field names and flags are
 * those of the pinned wrangler, 4.147.0.
 *
 * No network, no account, no wrangler: every function here is pure. Game case: both (delivery tooling).
 */

import { describe, expect, it } from 'vitest';

import {
  WRANGLER_STDIO,
  buildPagesDeployArgs,
  buildPagesProjectCreateArgs,
  buildWranglerDeployArgs,
  checkWranglerConfig,
  parsePagesProjectNames,
  parseWhoami,
  parseWranglerConfigText,
  parseWranglerOutput,
  pickDeployEntry,
  pickDeployedUrls,
  readPinnedWranglerVersion,
  readWranglerInstall,
  readWranglerVersion,
  resolveWranglerBin,
  wranglerEnv,
  wranglerMessage,
} from '../../tools/deploy-wrangler.mjs';

describe('reading wrangler\'s output file', () => {
  const session = '{"type":"wrangler-session","version":1,"wrangler_version":"4.147.0"}';
  const deploy = (name: string, targets: unknown, extra = '') => `{"type":"deploy","version":1,"worker_name":"${name}","version_id":"v-${extra}1","targets":${JSON.stringify(targets)}}`;
  const pagesDeploy = (project: string, url: string, alias?: string) => JSON.stringify({
    type: 'pages-deploy-detailed', version: 1, pages_project: project, deployment_id: 'dep-1', url, alias, environment: 'preview',
  });

  it('reads newline-delimited JSON and skips a bad line without losing the rest', () => {
    const { entries, malformed } = parseWranglerOutput(`${session}\n\nnot json\n${deploy('echoes-of-spira', ['https://echoes-of-spira.bailey.workers.dev'])}\n`);
    expect(entries).toHaveLength(2);
    expect(malformed).toBe(1);
    expect(parseWranglerOutput(undefined)).toEqual({ entries: [], malformed: 0 });
  });

  it('picks the last Workers deploy entry for the Worker asked about', () => {
    const { entries } = parseWranglerOutput([
      deploy('echoes-of-spira', ['https://one.workers.dev'], 'a'),
      deploy('echoes-of-spira-preview', ['https://two.workers.dev']),
      deploy('echoes-of-spira', ['https://three.workers.dev'], 'b'),
    ].join('\n'));
    expect(pickDeployEntry(entries, 'echoes-of-spira')?.version_id).toBe('v-b1');
    expect(pickDeployEntry(entries, 'echoes-of-spira-preview')?.version_id).toBe('v-1');
    expect(pickDeployEntry(entries, 'nobody')).toBeNull();
    expect(pickDeployEntry([], null)).toBeNull();
  });

  it('picks the Pages entry of the project, and a Workers entry never answers for Pages or the reverse', () => {
    const { entries } = parseWranglerOutput([
      session,
      deploy('echoes-of-spira', ['https://w.workers.dev']),
      '{"type":"pages-deploy","version":1,"pages_project":"echoes-of-spira","url":"https://old.echoes-of-spira.pages.dev"}',
      pagesDeploy('echoes-of-spira', 'https://abc123.echoes-of-spira.pages.dev', 'https://preview.echoes-of-spira.pages.dev'),
      pagesDeploy('other-project', 'https://zzz.other-project.pages.dev'),
    ].join('\n'));
    expect(pickDeployEntry(entries, 'echoes-of-spira', 'pages')?.deployment_id).toBe('dep-1');
    expect(pickDeployEntry(entries, 'echoes-of-spira', 'pages')?.url).toBe('https://abc123.echoes-of-spira.pages.dev');
    expect(pickDeployEntry(entries, 'echoes-of-spira', 'workers')?.type).toBe('deploy');
    expect(pickDeployEntry(parseWranglerOutput(deploy('echoes-of-spira', [])).entries, 'echoes-of-spira', 'pages')).toBeNull();
  });

  it('keeps only https addresses (and loopback ones, for a local rehearsal), each with a trailing slash, once', () => {
    const entry = { targets: [
      'https://echoes-of-spira.bailey.workers.dev', 'https://echoes-of-spira.bailey.workers.dev/', 'pyrefly.example.com/*',
      'http://127.0.0.1:4173', 'http://evil.example.com/', 'javascript:alert(1)', 42, null,
    ] };
    expect(pickDeployedUrls(entry)).toEqual(['https://echoes-of-spira.bailey.workers.dev/', 'http://127.0.0.1:4173/']);
    expect(pickDeployedUrls({})).toEqual([]);
    expect(pickDeployedUrls(null)).toEqual([]);
  });

  it('reads a Custom Domain target ("host (custom domain)", how wrangler 4.147.0 renders one) as the https address of that host', () => {
    // wrangler lists the workers.dev address with "https://" added and a Custom Domain without any scheme, then " (custom domain)".
    const entry = { targets: ['https://echoes-of-spira.bailey.workers.dev', 'echoesofspira.com (custom domain)'] };
    expect(pickDeployedUrls(entry)).toEqual(['https://echoes-of-spira.bailey.workers.dev/', 'https://echoesofspira.com/']);
    expect(pickDeployedUrls({ targets: ['EchoesOfSpira.com (custom domain)'] })).toEqual(['https://echoesofspira.com/']);
    expect(pickDeployedUrls({ targets: ['shop.example.co.uk (custom domain - zone name: example.co.uk)'] })).toEqual(['https://shop.example.co.uk/']);
    expect(pickDeployedUrls({ targets: ['echoesofspira.com (custom domain) [production: enabled, previews: disabled]'] })).toEqual(['https://echoesofspira.com/']);
    expect(pickDeployedUrls({ targets: ['echoesofspira.com (custom domain)', 'https://echoesofspira.com'] })).toEqual(['https://echoesofspira.com/']);
  });

  it('still skips route patterns, and anything that only looks like a Custom Domain', () => {
    const entry = { targets: [
      'example.com/* (zone name: example.com)', 'example.com/*', 'echoesofspira.com', 'localhost (custom domain)', '(custom domain)',
      'evil.example.com/path (custom domain)', 'a b.example.com (custom domain)', 'echoesofspira.com (custom domain) trailing',
    ] };
    expect(pickDeployedUrls(entry)).toEqual([]);
  });

  it('gives a Pages entry\'s exact deployment first and its .pages.dev alias last', () => {
    const entry = { url: 'https://abc123.echoes-of-spira.pages.dev', alias: 'https://echoes-of-spira.pages.dev' };
    expect(pickDeployedUrls(entry)).toEqual(['https://abc123.echoes-of-spira.pages.dev/', 'https://echoes-of-spira.pages.dev/']);
    expect(pickDeployedUrls({ url: 'https://abc123.echoes-of-spira.pages.dev' })).toEqual(['https://abc123.echoes-of-spira.pages.dev/']);
  });

  it('reads the project names from `wrangler pages project list --json`, tolerating text before the array', () => {
    const json = JSON.stringify([
      { 'Project Name': 'echoes-of-spira', 'Project Domains': 'echoes-of-spira.pages.dev', 'Git Provider': 'No', 'Last Modified': 'x' },
      { 'Project Name': 'other', 'Project Domains': 'other.pages.dev' },
    ], null, 2);
    expect(parsePagesProjectNames(json)).toEqual(['echoes-of-spira', 'other']);
    expect(parsePagesProjectNames(`some warning\n${json}`)).toEqual(['echoes-of-spira', 'other']);
    expect(parsePagesProjectNames('[]')).toEqual([]);
    expect(parsePagesProjectNames('not json')).toBeNull();
    expect(parsePagesProjectNames('{"a":1}')).toBeNull();
    expect(parsePagesProjectNames(undefined)).toBeNull();
  });
});

describe('how wrangler is invoked', () => {
  it('builds the Workers deploy arguments in a fixed order, the dry run last', () => {
    const base = { configPath: 'C:/repo/tools/cloudflare/wrangler.jsonc', workerName: 'echoes-of-spira', message: 'Pyrefly abc12345', tag: 'abc12345' };
    expect(buildWranglerDeployArgs(base)).toEqual([
      'deploy', '--config', 'C:/repo/tools/cloudflare/wrangler.jsonc', '--name', 'echoes-of-spira', '--message', 'Pyrefly abc12345', '--tag', 'abc12345',
    ]);
    expect(buildWranglerDeployArgs({ ...base, dryRun: true }).at(-1)).toBe('--dry-run');
    expect(buildWranglerDeployArgs({ configPath: 'c', workerName: 'w' })).toEqual(['deploy', '--config', 'c', '--name', 'w']);
  });

  it('builds the Pages deploy arguments, always with --branch so wrangler never turns it into a Workers deploy', () => {
    const args = buildPagesDeployArgs({ dist: 'D:/x/dist-release', projectName: 'echoes-of-spira', branch: 'preview', commitHash: 'abc12345', commitMessage: 'Pyrefly abc12345 preview' });
    expect(args).toEqual([
      'pages', 'deploy', 'D:/x/dist-release', '--project-name', 'echoes-of-spira', '--branch', 'preview',
      '--commit-hash', 'abc12345', '--commit-message', 'Pyrefly abc12345 preview',
    ]);
    // wrangler 4.147.0 (getUnsupportedDeployDelegateArgs): these flags make a deploy ineligible for the agent-session conversion.
    expect(args).toContain('--branch');
    expect(args).toContain('--commit-hash');
    expect(args).toContain('--commit-message');
  });

  it('creates a Pages project with the hidden --force, or an agent-run wrangler would deploy a Worker from this directory instead', () => {
    expect(buildPagesProjectCreateArgs({ projectName: 'echoes-of-spira', productionBranch: 'main' })).toEqual([
      'pages', 'project', 'create', 'echoes-of-spira', '--production-branch', 'main', '--force',
    ]);
  });

  it('never carries a login, a token or a throwaway account in its arguments', () => {
    const all = [
      buildWranglerDeployArgs({ configPath: 'c', workerName: 'w', message: 'm', tag: 't', dryRun: true }),
      buildPagesDeployArgs({ dist: 'd', projectName: 'p', branch: 'b', commitHash: 'h', commitMessage: 'm' }),
      buildPagesProjectCreateArgs({ projectName: 'p', productionBranch: 'main' }),
    ].flat().join(' ');
    expect(all).not.toMatch(/login|token|temporary|api-key|install-skills/i);
  });

  it('spawns wrangler with stdin closed, so it is never interactive and no prompt can appear', () => {
    expect(WRANGLER_STDIO).toEqual(['ignore', 'inherit', 'inherit']);
  });

  it('keeps the version note plain, one line and at most 100 characters', () => {
    const iso = '2026-10-04T12:00:00.000Z';
    expect(wranglerMessage({ mainSha: 'abc12345', isoNow: iso })).toBe(`Pyrefly abc12345 ${iso}`);
    expect(wranglerMessage({ mainSha: 'abc12345', isoNow: iso, preview: true })).toBe(`Pyrefly abc12345 ${iso} preview`);
    const long = wranglerMessage({ mainSha: 'abc12345', isoNow: iso, extra: `Caf\u00e9\n${'x'.repeat(200)}` });
    expect(long.length).toBeLessThanOrEqual(100);
    expect(long).toMatch(/^[\x20-\x7e]+$/);
  });

  it('sets telemetry off and the output file on, passes the login through, and copies rather than mutates', () => {
    const base = { PATH: '/bin', CLOUDFLARE_API_TOKEN: 'carried-through-untouched', WRANGLER_OUTPUT_FILE_PATH: 'inherited.ndjson' };
    const env = wranglerEnv(base, { outputFile: 'out.ndjson' });
    expect(env).toMatchObject({
      WRANGLER_SEND_METRICS: 'false', WRANGLER_SEND_ERROR_REPORTS: 'false', DO_NOT_TRACK: '1', NO_COLOR: '1',
      WRANGLER_OUTPUT_FILE_PATH: 'out.ndjson', PATH: '/bin', CLOUDFLARE_API_TOKEN: 'carried-through-untouched',
    });
    expect(base.WRANGLER_OUTPUT_FILE_PATH).toBe('inherited.ndjson');
    expect(wranglerEnv(base).WRANGLER_OUTPUT_FILE_PATH).toBeUndefined();
    expect(wranglerEnv({ WRANGLER_OUTPUT_FILE_DIRECTORY: 'd' }).WRANGLER_OUTPUT_FILE_DIRECTORY).toBeUndefined();
  });

  it('finds the repo\'s own wrangler, or says how to install the pinned one outside the shared node_modules', () => {
    const found = resolveWranglerBin('D:/repo', () => true, {});
    expect(found.ok && found.bin.replaceAll('\\', '/')).toBe('D:/repo/node_modules/wrangler/bin/wrangler.js');
    expect(found.ok && found.source).toBe('repo');
    const missing = resolveWranglerBin('D:/repo', () => false, {});
    expect(!missing.ok && missing.error).toMatch(/npm ci --ignore-scripts/);
    expect(!missing.ok && missing.error).toMatch(/Never run npm install, npm ci or npm install --dry-run in the main tree/);
    expect(!missing.ok && missing.error).toMatch(/hidden lockfile/);
    expect(!missing.ok && missing.error).toMatch(/PYREFLY_WRANGLER_BIN/);
  });

  it('lets PYREFLY_WRANGLER_BIN name any copy of wrangler, so a preview needs neither a merge nor the shared node_modules', () => {
    const env = { PYREFLY_WRANGLER_BIN: 'D:/scratch/wrangler/bin/wrangler.js' };
    expect(resolveWranglerBin('D:/repo', () => true, env)).toEqual({ ok: true, bin: 'D:/scratch/wrangler/bin/wrangler.js', source: 'env', version: null, pinned: null });
    const absent = resolveWranglerBin('D:/repo', () => false, env);
    expect(!absent.ok && absent.error).toMatch(/PYREFLY_WRANGLER_BIN points at D:\/scratch\/wrangler\/bin\/wrangler\.js, which does not exist/);
  });

  it('reads whoami as "logged in or not" and keeps no email or account id', () => {
    const body = '{"loggedIn":true,"authType":"OAuth Token","email":"someone@example.com","accounts":[{"id":"a1"},{"id":"a2"}]}';
    const who = parseWhoami(0, body);
    expect(who).toEqual({ loggedIn: true, accounts: 2 });
    expect(JSON.stringify(who)).not.toMatch(/someone|a1/);
    expect(parseWhoami(1, '{"loggedIn":false}')).toEqual({ loggedIn: false, accounts: 0 });
    // `whoami --json` exits non-zero when not authenticated, and that exit status wins over whatever the body says
    expect(parseWhoami(1, '{"loggedIn":true,"accounts":[{"id":"a1"}]}')).toEqual({ loggedIn: false, accounts: 0 });
    expect(parseWhoami(null, '{"loggedIn":true}')).toEqual({ loggedIn: false, accounts: 0 });
    expect(parseWhoami(0, '{"loggedIn":false}')).toEqual({ loggedIn: false, accounts: 0 });
    expect(parseWhoami(0, 'nonsense')).toEqual({ loggedIn: false, accounts: 0 });
    expect(parseWhoami(0, undefined)).toEqual({ loggedIn: false, accounts: 0 });
  });
});

describe('where the pinned wrangler lives (no environment variable needed)', () => {
  const slash = (path: string) => path.replaceAll('\\', '/');
  const INSTALL = JSON.stringify({ version: '4.147.0', dir: 'D:/Tools/wrangler/4.147.0', bin: 'node_modules/wrangler/bin/wrangler.js' });
  const files = (extra: Record<string, string> = {}) => (path: string): string => {
    const p = slash(path);
    const known: Record<string, string> = {
      'D:/repo/package.json': JSON.stringify({ devDependencies: { wrangler: '4.147.0' } }),
      'D:/repo/tools/cloudflare/wrangler-install.json': INSTALL,
      'D:/Tools/wrangler/4.147.0/node_modules/wrangler/package.json': JSON.stringify({ name: 'wrangler', version: '4.147.0' }),
      ...extra,
    };
    if (p in known) return known[p] as string;
    throw new Error(`ENOENT ${p}`);
  };
  const present = (...paths: string[]) => (path: string) => paths.includes(slash(path));
  const REPO_BIN = 'D:/repo/node_modules/wrangler/bin/wrangler.js';
  const TOOLS_BIN = 'D:/Tools/wrangler/4.147.0/node_modules/wrangler/bin/wrangler.js';

  it('reads the pinned version from package.json, only when it is an exact version', () => {
    expect(readPinnedWranglerVersion('D:/repo', files())).toBe('4.147.0');
    expect(readPinnedWranglerVersion('D:/repo', files({ 'D:/repo/package.json': '{"devDependencies":{"wrangler":"^4.147.0"}}' }))).toBeNull();
    expect(readPinnedWranglerVersion('D:/repo', files({ 'D:/repo/package.json': '{}' }))).toBeNull();
    expect(readPinnedWranglerVersion('D:/repo', files({ 'D:/repo/package.json': 'nonsense' }))).toBeNull();
    expect(readPinnedWranglerVersion('D:/nowhere', files())).toBeNull();
  });

  it('reads the version of the wrangler package a bin belongs to, and the install the config names', () => {
    expect(readWranglerVersion(TOOLS_BIN, files())).toBe('4.147.0');
    expect(readWranglerVersion('D:/other/node_modules/wrangler/bin/wrangler.js', files())).toBeNull();
    const install = readWranglerInstall('D:/repo', files());
    expect(install && { version: install.version, bin: slash(install.bin) }).toEqual({ version: '4.147.0', bin: TOOLS_BIN });
    expect(readWranglerInstall('D:/repo', files({ 'D:/repo/tools/cloudflare/wrangler-install.json': '{"version":"4.147.0"}' }))).toBeNull();
    expect(readWranglerInstall('D:/nowhere', files())).toBeNull();
  });

  it('finds the pinned install outside the repo when the repo has none, with no environment variable', () => {
    const found = resolveWranglerBin('D:/repo', present(TOOLS_BIN), {}, files());
    expect(found.ok && slash(found.bin)).toBe(TOOLS_BIN);
    expect(found).toMatchObject({ ok: true, source: 'tools', version: '4.147.0', pinned: '4.147.0' });
  });

  it('prefers the repo\'s own node_modules when it holds the pinned version, and the environment variable over both', () => {
    const repoPkg = { 'D:/repo/node_modules/wrangler/package.json': JSON.stringify({ version: '4.147.0' }) };
    const both = resolveWranglerBin('D:/repo', present(REPO_BIN, TOOLS_BIN), {}, files(repoPkg));
    expect(both).toMatchObject({ ok: true, source: 'repo' });
    const env = { PYREFLY_WRANGLER_BIN: 'D:/scratch/wrangler/bin/wrangler.js' };
    const override = resolveWranglerBin('D:/repo', present(REPO_BIN, TOOLS_BIN, 'D:/scratch/wrangler/bin/wrangler.js'), env, files(repoPkg));
    expect(override).toMatchObject({ ok: true, source: 'env', bin: 'D:/scratch/wrangler/bin/wrangler.js', pinned: '4.147.0' });
  });

  it('skips a wrangler that is not the pinned version and says which, instead of deploying with it', () => {
    const wrong = { 'D:/repo/node_modules/wrangler/package.json': JSON.stringify({ version: '4.200.0' }) };
    const skipped = resolveWranglerBin('D:/repo', present(REPO_BIN, TOOLS_BIN), {}, files(wrong));
    expect(skipped).toMatchObject({ ok: true, source: 'tools', version: '4.147.0' });
    const none = resolveWranglerBin('D:/repo', present(REPO_BIN), {}, files(wrong));
    expect(!none.ok && none.error).toMatch(/is wrangler 4\.200\.0, but this repo pins 4\.147\.0/);
    expect(!none.ok && none.error).toMatch(/the pinned wrangler 4\.147\.0 was not found/);
    expect(!none.ok && none.error).toMatch(/wrangler\.js is missing/);
    const unreadable = resolveWranglerBin('D:/repo', present(TOOLS_BIN), {}, files({ 'D:/Tools/wrangler/4.147.0/node_modules/wrangler/package.json': 'broken' }));
    expect(!unreadable.ok && unreadable.error).toMatch(/\(version unreadable\)/);
  });

  it('takes an environment-named copy as it is and reports its version, even a different one', () => {
    const env = { PYREFLY_WRANGLER_BIN: 'D:/scratch/wrangler/bin/wrangler.js' };
    const read = files({ 'D:/scratch/wrangler/package.json': JSON.stringify({ version: '4.999.0' }) });
    const found = resolveWranglerBin('D:/repo', present('D:/scratch/wrangler/bin/wrangler.js'), env, read);
    expect(found).toMatchObject({ ok: true, source: 'env', version: '4.999.0', pinned: '4.147.0' });
  });

  it('does not enforce the pin when package.json cannot be read, which the fake roots of the other tests rely on', () => {
    const found = resolveWranglerBin('D:/nowhere', present('D:/nowhere/node_modules/wrangler/bin/wrangler.js'), {}, files());
    expect(found).toMatchObject({ ok: true, source: 'repo', pinned: null });
  });
});

describe('checkWranglerConfig: what a Workers run refuses before wrangler is asked to deploy', () => {
  const production = JSON.stringify({
    name: 'echoes-of-spira', compatibility_date: '2026-10-04', workers_dev: true, preview_urls: false,
    routes: [{ pattern: 'echoesofspira.com', custom_domain: true }], assets: { directory: '../../dist-release' },
  }, null, 2);
  const previewConfig = JSON.stringify({
    name: 'echoes-of-spira-preview', compatibility_date: '2026-10-04', workers_dev: true, preview_urls: false, assets: { directory: '../../dist-release' },
  }, null, 2);
  const productionRun = { name: 'echoes-of-spira', customDomain: 'echoesofspira.com' };
  const previewRun = { name: 'echoes-of-spira-preview', preview: true, customDomain: 'echoesofspira.com' };
  const edit = (text: string, change: (config: Record<string, unknown>) => void) => {
    const config = JSON.parse(text) as Record<string, unknown>;
    change(config);
    return JSON.stringify(config);
  };

  it('reads whole-line comments out of a JSONC config', () => {
    expect(parseWranglerConfigText('// one\n  // two\n{ "a": 1 }\n')).toEqual({ a: 1 });
    expect(() => parseWranglerConfigText('{ nope')).toThrow();
  });

  it('accepts the production config (one Custom Domain route) and the preview config (no routes)', () => {
    expect(checkWranglerConfig(`// comment\n${production}`, productionRun)).toEqual([]);
    expect(checkWranglerConfig(previewConfig, previewRun)).toEqual([]);
  });

  it('refuses a preview that gains any route, which would move the Custom Domain onto the preview Worker', () => {
    const withRoute = edit(previewConfig, (c) => { c.routes = [{ pattern: 'echoesofspira.com', custom_domain: true }]; });
    expect(checkWranglerConfig(withRoute, previewRun).join('\n')).toMatch(/must have no routes/);
    const withRoutePattern = edit(previewConfig, (c) => { c.routes = ['example.com/*']; });
    expect(checkWranglerConfig(withRoutePattern, previewRun).join('\n')).toMatch(/must have no routes/);
    // the production file, read as a preview, is exactly that mistake
    expect(checkWranglerConfig(production, previewRun).join('\n')).toMatch(/must have no routes/);
    expect(checkWranglerConfig(production, previewRun).join('\n')).toMatch(/name is "echoes-of-spira", but this run deploys the Worker echoes-of-spira-preview/);
  });

  it('refuses a production config whose route is not exactly the one Custom Domain', () => {
    const variants: unknown[] = [
      undefined, [], [{ pattern: 'www.echoesofspira.com', custom_domain: true }], ['echoesofspira.com'],
      [{ pattern: 'echoesofspira.com', custom_domain: true }, { pattern: 'www.echoesofspira.com', custom_domain: true }],
      [{ pattern: 'echoesofspira.com/*', zone_name: 'echoesofspira.com' }],
    ];
    for (const routes of variants) {
      const text = edit(production, (c) => { if (routes === undefined) delete c.routes; else c.routes = routes; });
      expect(checkWranglerConfig(text, productionRun).join('\n')).toMatch(/routes must be exactly/);
    }
    expect(checkWranglerConfig(production, { name: 'echoes-of-spira', customDomain: 'elsewhere.example' }).join('\n')).toMatch(/routes must be exactly/);
  });

  it('keeps workers.dev on, the previews off, the assets on the build and the Worker named for the run', () => {
    expect(checkWranglerConfig(edit(production, (c) => { delete c.workers_dev; }), productionRun).join('\n')).toMatch(/workers_dev must be true/);
    expect(checkWranglerConfig(edit(production, (c) => { c.workers_dev = false; }), productionRun).join('\n')).toMatch(/workers_dev must be true/);
    expect(checkWranglerConfig(edit(production, (c) => { c.preview_urls = true; }), productionRun).join('\n')).toMatch(/preview_urls must be false/);
    expect(checkWranglerConfig(edit(production, (c) => { c.assets = { directory: '../dist' }; }), productionRun).join('\n')).toMatch(/assets\.directory must be \.\.\/\.\.\/dist-release/);
    expect(checkWranglerConfig(edit(production, (c) => { c.name = 'something-else'; }), productionRun).join('\n')).toMatch(/name is "something-else"/);
  });

  it('refuses a key that would make the public config account-specific or give the Worker more than static assets', () => {
    const extras: [string, unknown][] = [['account_id', 'abc'], ['main', 'src/worker.js'], ['vars', { A: '1' }], ['kv_namespaces', []], ['route', 'example.com/*'], ['zone_id', 'z']];
    for (const [key, value] of extras) {
      const text = edit(production, (c) => { c[key] = value; });
      expect(checkWranglerConfig(text, productionRun).join('\n')).toMatch(new RegExp(`unexpected key\\(s\\) ${key}`));
    }
  });

  it('reports a config it cannot read instead of throwing', () => {
    expect(checkWranglerConfig('{ nope', productionRun)[0]).toMatch(/cannot be read/);
    expect(checkWranglerConfig('', productionRun)[0]).toMatch(/cannot be read/);
  });
});
