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
  parsePagesProjectNames,
  parseWhoami,
  parseWranglerOutput,
  pickDeployEntry,
  pickDeployedUrls,
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

  it('finds the repo\'s own wrangler, or says to run npm install (never npm ci)', () => {
    const found = resolveWranglerBin('D:/repo', () => true, {});
    expect(found.ok && found.bin.replaceAll('\\', '/')).toBe('D:/repo/node_modules/wrangler/bin/wrangler.js');
    const missing = resolveWranglerBin('D:/repo', () => false, {});
    expect(!missing.ok && missing.error).toMatch(/npm install/);
    expect(!missing.ok && missing.error).toMatch(/Never `npm ci`/);
  });

  it('lets PYREFLY_WRANGLER_BIN name any copy of wrangler, so a preview needs neither a merge nor the shared node_modules', () => {
    const env = { PYREFLY_WRANGLER_BIN: 'D:/scratch/wrangler/bin/wrangler.js' };
    expect(resolveWranglerBin('D:/repo', () => true, env)).toEqual({ ok: true, bin: 'D:/scratch/wrangler/bin/wrangler.js' });
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
