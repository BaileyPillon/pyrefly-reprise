/**
 * `tools/deploy-pages.mjs` and the release name (Bailey, 2026-10-08: "The release name is stamped by the deploy tool: a
 * `--release=<name>` flag in tools/deploy-pages.mjs, passed as PYREFLY_RELEASE, defined in vite.config.ts as
 * __PYREFLY_RELEASE__, and logged as `release=` in docs/deploys.log ... deploy-pages.mjs refuses to deploy when the newest
 * note is not the --release being deployed. A unit test pins the format.").
 *
 * What is pinned: the gate's decisions (a missing, wrong, unwritten or invalid release refuses; a preview is stamped
 * `Preview` and asks nothing), the log lines (a trailing `release=`, and the old lines unchanged without one), the way the
 * name travels (`tools/build-stamp.mjs`: the environment variable, the validation, the define in `vite.config.ts`), and in
 * the tool's own source that the gate runs BEFORE the Cloudflare login and the build, and that the build is handed the name.
 * The tool's `--dry-run` was run by hand for the same refusal (the handoff records it): it takes a minute of audio QA, too
 * long for a unit test.
 *
 * Game case: both (delivery tooling, no gameplay).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PREVIEW_RELEASE as APP_PREVIEW } from '../../src/app/changelog/buildInfo.ts';
import { RELEASE_NAME } from '../../src/app/changelog/releaseNotes.ts';
import { PREVIEW_RELEASE, RELEASE_ENV, RELEASE_NAME_PATTERN, isReleaseName, releaseFromEnv } from '../../tools/build-stamp.mjs';
import { formatLegacyLogLine, formatPreviewLogLine } from '../../tools/deploy-host.mjs';
import { formatDeployLogLine } from '../../tools/deploy-pages.mjs';
import { NOTES_FILE, checkReleaseForDeploy, decideRelease, loadReleaseNotes } from '../../tools/release-notes.mjs';

const REPO = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(REPO, rel), 'utf8');

const OK = { newest: '39.5', problems: [] as string[] };

describe('decideRelease: what a deploy may carry', () => {
  it('lets a release go when its name is the newest note and the notes are valid', () => {
    const d = decideRelease({ requested: '39.5', preview: false, ...OK });
    expect(d).toMatchObject({ ok: true, release: '39.5' });
  });

  it('refuses a deploy that names no release, and says how to name it', () => {
    for (const requested of [undefined, true, '', '   ']) {
      const d = decideRelease({ requested, preview: false, ...OK });
      expect(d.ok, String(requested)).toBe(false);
      if (!d.ok) {
        expect(d.error).toMatch(/--release=<name>/);
        expect(d.error).toMatch(/PYREFLY_RELEASE/);
        expect(d.error).toContain('39.5'); // the newest note, as the example
      }
    }
  });

  it('refuses a name that is not a release name', () => {
    for (const requested of ['v39.5', '39.5-rc', 'Preview', 'latest', '39..5']) {
      const d = decideRelease({ requested, preview: false, ...OK });
      expect(d.ok, requested).toBe(false);
      if (!d.ok) expect(d.error).toMatch(/not a release name/);
    }
  });

  it('refuses a release whose note is not the newest, naming both, and tells the person to write the note first', () => {
    const d = decideRelease({ requested: '39.6', preview: false, ...OK });
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.error).toContain('--release=39.6');
      expect(d.error).toContain('39.5');
      expect(d.error).toMatch(/Write the 39\.6 note first/);
      expect(d.error).toMatch(/three to six lines/);
    }
    // an older name is refused the same way: the newest note must be THIS release
    expect(decideRelease({ requested: '39.4.2', preview: false, ...OK }).ok).toBe(false);
  });

  it('refuses while the notes themselves are not valid, listing every problem', () => {
    const d = decideRelease({ requested: '39.5', preview: false, newest: '39.5', problems: ['release "39.5": has 2 line(s)', 'release "39.4": a line is repeated'] });
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.error).toMatch(/not valid/);
      expect(d.error).toContain('has 2 line(s)');
      expect(d.error).toContain('a line is repeated');
    }
  });

  it('refuses a list with no note at all', () => {
    const d = decideRelease({ requested: '39.5', preview: false, newest: null, problems: [] });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.error).toMatch(/no note at all/);
  });

  it('stamps a preview `Preview`, asks for no note, and ignores a --release given with it', () => {
    for (const requested of [undefined, true, '39.5', 'nonsense']) {
      const d = decideRelease({ requested, preview: true, newest: null, problems: ['anything'] });
      expect(d, String(requested)).toMatchObject({ ok: true, release: PREVIEW_RELEASE });
    }
    const ignored = decideRelease({ requested: '39.5', preview: true, ...OK });
    expect(ignored.ok && ignored.line).toMatch(/is ignored/);
  });
});

describe('checkReleaseForDeploy reads the real notes file', () => {
  it('finds the notes where the tool says, and the newest is 39.4.2 today', async () => {
    expect(NOTES_FILE).toBe('src/app/changelog/releaseNotes.ts');
    const mod = await loadReleaseNotes(REPO);
    expect(mod.newestRelease(mod.RELEASE_NOTES)).toBe('39.4.2');
    expect(mod.validateReleaseNotes(mod.RELEASE_NOTES)).toEqual([]);
  });

  it('lets 39.4.2 go (its note is the newest) and refuses 39.5 until its note is written', async () => {
    expect(await checkReleaseForDeploy({ root: REPO, requested: '39.4.2', preview: false })).toMatchObject({ ok: true, release: '39.4.2' });
    const next = await checkReleaseForDeploy({ root: REPO, requested: '39.5', preview: false });
    expect(next.ok).toBe(false);
    if (!next.ok) expect(next.error).toMatch(/Write the 39\.5 note first/);
    expect((await checkReleaseForDeploy({ root: REPO, requested: undefined, preview: false })).ok).toBe(false);
    expect((await checkReleaseForDeploy({ root: REPO, requested: true, preview: false })).ok).toBe(false);
  });

  it('stamps a preview without reading a note, and refuses a tree whose notes cannot be read', async () => {
    expect(await checkReleaseForDeploy({ root: REPO, requested: undefined, preview: true })).toMatchObject({ ok: true, release: 'Preview' });
    const nowhere = resolve(REPO, 'no-such-tree');
    expect(await checkReleaseForDeploy({ root: nowhere, requested: '39.5', preview: true })).toMatchObject({ ok: true, release: 'Preview' });
    const unreadable = await checkReleaseForDeploy({ root: nowhere, requested: '39.5', preview: false });
    expect(unreadable.ok).toBe(false);
    if (!unreadable.ok) expect(unreadable.error).toMatch(/could not read the player notes/);
  });
});

describe('the name on its road: tools/build-stamp.mjs', () => {
  it('names the environment variable once, and the title and the notes use the same shape and the same preview word', () => {
    expect(RELEASE_ENV).toBe('PYREFLY_RELEASE');
    expect(PREVIEW_RELEASE).toBe('Preview');
    expect(APP_PREVIEW).toBe(PREVIEW_RELEASE);
    expect(RELEASE_NAME_PATTERN.source).toBe(RELEASE_NAME.source);
  });

  it('reads the release from the environment: none is empty, a name or Preview stands, anything else stops the build', () => {
    expect(releaseFromEnv({})).toBe('');
    expect(releaseFromEnv({ PYREFLY_RELEASE: '' })).toBe('');
    expect(releaseFromEnv({ PYREFLY_RELEASE: '  39.5 ' })).toBe('39.5');
    expect(releaseFromEnv({ PYREFLY_RELEASE: '39.4.2' })).toBe('39.4.2');
    expect(releaseFromEnv({ PYREFLY_RELEASE: 'Preview' })).toBe('Preview');
    for (const bad of ['39,5', 'v39', 'preview', '39.5 beta', '<b>']) expect(() => releaseFromEnv({ PYREFLY_RELEASE: bad }), bad).toThrow(/not a release name/);
    expect(isReleaseName('39.5')).toBe(true);
    expect(isReleaseName('Preview')).toBe(false);
    expect(isReleaseName(39.5)).toBe(false);
  });
});

describe('the log lines carry release= (and the old lines are unchanged without it)', () => {
  const base = { isoNow: '2026-10-09T01:03:34.000Z', mainSha: 'a021787a', bundleHash: 'cUSnFK7q', artFileCount: 3947 };

  it('docs/deploys.log: a trailing release= after host= and override=, and exactly the old line without one', () => {
    const old = formatDeployLogLine({ ...base, status: 'ok', overrideUsed: true, host: 'cloudflare' });
    expect(old).toBe('2026-10-09T01:03:34.000Z\tmain=a021787a\tbundle=cUSnFK7q\tartFiles=3947\tstatus=ok\toverride=owner\thost=cloudflare\n');
    const now = formatDeployLogLine({ ...base, status: 'ok', overrideUsed: true, host: 'cloudflare', release: '39.4.2' });
    expect(now).toBe(old.replace('\n', '\trelease=39.4.2\n'));
    // the readers of this log match \tstatus=ok and \tmain= and ignore the rest
    expect(now).toMatch(/\tstatus=ok\t/);
    expect(now).toMatch(/\tmain=a021787a\t/);
    expect(formatDeployLogLine({ ...base, status: 'ok', release: '39.5' })).toBe('2026-10-09T01:03:34.000Z\tmain=a021787a\tbundle=cUSnFK7q\tartFiles=3947\tstatus=ok\trelease=39.5\n');
    expect(formatDeployLogLine({ ...base, status: 'ok', release: null })).not.toContain('release=');
  });

  it('the preview and legacy logs take it too, and are unchanged without it', () => {
    const preview = { ...base, host: 'cloudflare', kind: 'workers', site: 'echoes-of-spira-preview', url: 'https://example.invalid/' };
    expect(formatPreviewLogLine(preview)).not.toContain('release=');
    expect(formatPreviewLogLine({ ...preview, release: 'Preview' })).toMatch(/\tstatus=preview\t.*\trelease=Preview\n$/);
    expect(formatPreviewLogLine({ ...preview, overrideUsed: true, release: 'Preview' })).toMatch(/\toverride=owner\trelease=Preview\n$/);
    const legacy = { ...base, host: 'github', url: 'https://example.invalid/old/' };
    expect(formatLegacyLogLine(legacy)).not.toContain('release=');
    expect(formatLegacyLogLine({ ...legacy, release: '39.5' })).toMatch(/\tstatus=legacy\t.*\trelease=39\.5\n$/);
  });
});

describe('tools/deploy-pages.mjs is wired to it', () => {
  const src = read('tools/deploy-pages.mjs');

  it('checks the release BEFORE the Cloudflare login and before anything is built', () => {
    const gate = src.indexOf('await checkReleaseForDeploy(');
    const login = src.indexOf('checkCloudflareLogin({ root: ROOT');
    const preflight = src.indexOf('// ---- 1. Preflight');
    const build = src.indexOf("runNpx(['vite', 'build'");
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(login);
    expect(gate).toBeLessThan(preflight);
    expect(gate).toBeLessThan(build);
  });

  it('refuses for real and only reports under --dry-run, and a preview is told to the check', () => {
    expect(src).toMatch(/requested: args\.release, preview: PREVIEW/);
    expect(src).toMatch(/if \(!DRY_RUN\) fail\(releaseCheck\.error\);/);
    expect(src).toMatch(/NOTE \(dry run only\): a real run would refuse this/);
  });

  it('hands the build the name in PYREFLY_RELEASE, explicitly, every time', () => {
    expect(src).toMatch(/import \{ RELEASE_ENV \} from '\.\/build-stamp\.mjs';/);
    expect(src).toMatch(/\[RELEASE_ENV\]: RELEASE/);
  });

  it('writes the release into every record it makes: the log, the preview log and the legacy log', () => {
    expect(src).toMatch(/formatDeployLogLine\(\{[^}]*release \}\)/);
    expect(src).toMatch(/overrideUsed: ownerOverrideUsed, release: RELEASE,\r?\n\s*\}\)\);/);
    expect(src).toMatch(/recordLegacyDeploy\(\{[^}]*release: RELEASE,/);
    expect((src.match(/ownerOverrideChangedArea, release: RELEASE/g) ?? []).length).toBe(2);
  });

  it('documents --release= in its header and in docs/DEV.md', () => {
    expect(src).toMatch(/--release=\s+REQUIRED for every deploy that is not a --preview/);
    expect(read('docs/DEV.md')).toMatch(/--release=<name>/);
  });
});

