// @vitest-environment jsdom
/**
 * The build number on the title screen (Bailey, 2026-10-08: "build number should be shown on the title screen"; option A,
 * "Release <name> · <8-char sha>" small in a corner, "dev and preview builds show the sha alone or 'Preview'").
 *
 * Pinned here: what the chip says for each kind of build, that it is escaped, that it is inside the tap plate and takes no
 * pointer input, where the stylesheet puts it (bottom right on a desktop window, top right on a phone and below 1330 px
 * wide, under the painted rule on The Echo, clear of the "we've moved" note), and how the release gets from `--release`
 * through `vite.config.ts` into `__PYREFLY_RELEASE__`. The pictures and the measured positions are the browser proof
 * (docs/screenshots/r395-int/title-changelog/).
 *
 * Game case: both (the title is the front door of FFX and FFX-2 alike).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { PREVIEW_RELEASE, SHA_LENGTH, buildTagHtml, buildTagText, parseBuildInfo, readBuildInfo } from '../../src/app/changelog/buildInfo.ts';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';

const REPO = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(REPO, rel), 'utf8');
const parse = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('parseBuildInfo', () => {
  it('keeps a release name and the first 8 characters of a commit', () => {
    expect(parseBuildInfo('39.4.2', 'a021787a1c2d3e4f')).toEqual({ release: '39.4.2', sha: 'a021787a' });
    expect(SHA_LENGTH).toBe(8);
    expect(parseBuildInfo('39.5', '1B607287')).toEqual({ release: '39.5', sha: '1b607287' });
  });

  it('knows Preview, and leaves out anything that is not a release name or a commit', () => {
    expect(parseBuildInfo('Preview', 'a021787a').release).toBe(PREVIEW_RELEASE);
    for (const bad of ['', '  ', 'dev', 'v39.5', '<b>', null, undefined]) expect(parseBuildInfo(bad, 'a021787a').release, String(bad)).toBeNull();
    for (const bad of ['unknown', '', 'xyz', 'abc', null, undefined]) expect(parseBuildInfo('39.5', bad).sha, String(bad)).toBeNull();
  });

  it('reads nothing under vitest, where the build defines do not exist', () => {
    expect(readBuildInfo()).toEqual({ release: null, sha: null });
  });
});

describe('the chip', () => {
  it('reads "Release 39.4.2 · a021787a" for a stamped build', () => {
    const info = parseBuildInfo('39.4.2', 'a021787a');
    expect(buildTagText(info)).toBe('Release 39.4.2 · a021787a');
    const chip = parse(buildTagHtml(info)).querySelector('[data-build-tag]')!;
    expect(chip.classList.contains('fe-title__build')).toBe(true);
    expect(chip.textContent).toBe('Release 39.4.2·a021787a');
    expect(chip.querySelector('.fe-title__build-lead b')?.textContent).toBe('39.4.2');
    expect(chip.querySelector('.fe-title__build-sha')?.textContent).toBe('a021787a');
    expect(chip.querySelector('.fe-title__build-dot')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reads "Preview · <commit>" for a preview deploy, and the commit alone for a dev server', () => {
    expect(buildTagText(parseBuildInfo('Preview', 'a021787a'))).toBe('Preview · a021787a');
    expect(buildTagText(parseBuildInfo('', 'a021787a'))).toBe('a021787a');
    const alone = parse(buildTagHtml(parseBuildInfo(null, 'a021787a'))).querySelector('[data-build-tag]')!;
    expect(alone.querySelector('.fe-title__build-lead')).toBeNull();
    expect(alone.querySelector('.fe-title__build-dot')).toBeNull();
    expect(alone.textContent).toBe('a021787a');
    const release = parse(buildTagHtml(parseBuildInfo('39.5', null))).querySelector('[data-build-tag]')!;
    expect(release.querySelector('.fe-title__build-sha')).toBeNull();
    expect(release.textContent).toBe('Release 39.5');
  });

  it('draws nothing when there is neither a release nor a commit (a source archive with no git)', () => {
    expect(buildTagHtml(parseBuildInfo(null, null))).toBe('');
    expect(buildTagHtml(parseBuildInfo('unknown', 'unknown'))).toBe('');
    expect(buildTagText(parseBuildInfo(null, null))).toBe('');
  });

  it('escapes whatever it is given (the parse already refuses markup; this is the second lock)', () => {
    const html = buildTagHtml({ release: '39.5', sha: 'a021787a' });
    expect(html).not.toContain('<script');
    const evil = buildTagHtml({ release: '<img src=x onerror=1>', sha: '"><b>' });
    expect(evil).not.toContain('<img');
    expect(evil).not.toContain('"><b>');
  });
});

describe('in the title markup', () => {
  it('is inside the tap plate, after the hint row, and carries no action of its own', () => {
    const root = parse(titleMarkup({ briefingChip: false, build: parseBuildInfo('39.4.2', 'a021787a') }));
    const plate = root.querySelector('.fe-title__tap[data-action="confirm"]')!;
    const chip = plate.querySelector('[data-build-tag]')!;
    expect(chip).not.toBeNull();
    expect(chip.closest('[data-action]')).toBe(plate);
    expect(chip.hasAttribute('data-action')).toBe(false);
    const hint = plate.querySelector('.fe-hint')!;
    expect(hint.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.contains(chip)).toBe(false);
  });

  it('is on both title paintings, and absent from the markup when there is no build to show', () => {
    for (const art of ['farplane', 'echo'] as const) {
      const root = parse(titleMarkup({ briefingChip: true, art, build: parseBuildInfo('39.4.2', 'a021787a') }));
      expect(root.querySelectorAll('[data-build-tag]'), art).toHaveLength(1);
    }
    expect(parse(titleMarkup({ briefingChip: true, build: parseBuildInfo(null, null) })).querySelector('[data-build-tag]')).toBeNull();
    // omitted: read from the defines, which do not exist under vitest, so there is no chip
    expect(parse(titleMarkup({ briefingChip: true })).querySelector('[data-build-tag]')).toBeNull();
  });
});

describe('title-info.css puts the chip where Bailey picked', () => {
  const css = read('src/app/screens/frontend/title-info.css');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = (selector: string, from = 0): string => {
    const at = code.indexOf(selector, from);
    expect(at, selector).toBeGreaterThanOrEqual(0);
    return code.slice(code.indexOf('{', at) + 1, code.indexOf('}', at));
  };

  it('is bottom right on a desktop window, takes no pointer input, and is small and quiet', () => {
    const base = rule('.fe-title__build {');
    expect(base).toMatch(/position:\s*absolute/);
    expect(base).toMatch(/right:\s*calc\(46 \* var\(--fe-k\)\)/);
    expect(base).toMatch(/bottom:\s*calc\(26 \* var\(--fe-k\)\)/);
    expect(base).toMatch(/pointer-events:\s*none/);
    expect(base).toMatch(/font-size:\s*max\(var\(--fe-fs-floor\),\s*calc\(13 \* var\(--fe-k\)\)\)/);
  });

  it('sits under the painted rule on The Echo, as the hint row does', () => {
    expect(rule('.fe-title--echo .fe-title__build {')).toMatch(/bottom:\s*calc\(12 \* var\(--fe-k\)\)/);
  });

  it('goes to the top right on a phone and below 1330 px wide, and under the "we\'ve moved" note when there is one', () => {
    const phone = code.slice(code.indexOf('@media (max-width: 760px), (max-aspect-ratio: 3 / 4) {'));
    expect(phone).toMatch(/\.fe-title__build\s*\{[^}]*top:\s*calc\(14 \* var\(--fe-k\)\);[^}]*bottom:\s*auto;[^}]*right:\s*calc\(14 \* var\(--fe-k\)\)/);
    const narrow = code.slice(code.indexOf('@media (max-width: 1330px) and (min-width: 761px) and (min-aspect-ratio: 3 / 4)'));
    expect(narrow).toMatch(/\.fe-title__build\s*\{[^}]*top:\s*calc\(22 \* var\(--fe-k\)\);[^}]*bottom:\s*auto;[^}]*right:\s*calc\(34 \* var\(--fe-k\)\)/);
    expect(code).toMatch(/\.fe:has\(\.fe-title__moved\) \.fe-title__build\s*\{\s*top:\s*calc\(112 \* var\(--fe-k\)\)/);
    expect(code).toMatch(/\.fe:has\(\.fe-title__moved\) \.fe-title__build\s*\{\s*top:\s*calc\(92 \* var\(--fe-k\)\)/);
  });
});

describe('the release reaches the build through vite.config.ts', () => {
  const saved = process.env['PYREFLY_RELEASE'];
  afterEach(() => {
    if (saved === undefined) delete process.env['PYREFLY_RELEASE'];
    else process.env['PYREFLY_RELEASE'] = saved;
  });

  const defines = async (): Promise<Record<string, string>> => {
    const mod = (await import('../../vite.config.ts')) as { default: (env: { command: string; mode: string }) => { define: Record<string, string> } };
    return mod.default({ command: 'build', mode: 'production' }).define;
  };

  it('defines __PYREFLY_RELEASE__ from PYREFLY_RELEASE, as a string the title reads', async () => {
    process.env['PYREFLY_RELEASE'] = '39.4.2';
    const d = await defines();
    expect(JSON.parse(d['__PYREFLY_RELEASE__']!)).toBe('39.4.2');
    process.env['PYREFLY_RELEASE'] = 'Preview';
    expect(JSON.parse((await defines())['__PYREFLY_RELEASE__']!)).toBe('Preview');
  });

  it('defines it empty for a dev server or a hand-run build, so the title shows the commit alone', async () => {
    delete process.env['PYREFLY_RELEASE'];
    const d = await defines();
    expect(JSON.parse(d['__PYREFLY_RELEASE__']!)).toBe('');
    expect(JSON.parse(d['__PYREFLY_BUILD_SHA__']!)).toMatch(/^([0-9a-f]{8}|unknown)$/);
  });

  it('stops the build on a name that would read wrong on the live title', async () => {
    process.env['PYREFLY_RELEASE'] = '39,5';
    await expect(defines()).rejects.toThrow(/not a release name/);
  });
});
