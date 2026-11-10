// @vitest-environment node
/**
 * The test word of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2; the word, its Vite define and the debug call are plumbing, inert for FFX and FF7).
 *
 * `?specials=on` (and `window.__pyrefly.specials(true)`) turn the Special dress-up on for the next battle, in a dev server and in a test preview build ONLY. A production build defines `__PYREFLY_SPECIALS__`
 * false, every branch that reads the address is then dead code, and none of the words reaches the bundle. The proof is the method of `behind-the-scenes-off.test.ts`: the module is BUNDLED in memory the
 * way the build does it, with the repo's own defines, once as production and once with the define swapped to true (the control that shows the method can see the words at all).
 *
 * Removal: drop the Vite define (`__PYREFLY_SPECIALS__`) in `vite.config.ts` and the production bundle (which then has no define to fold) finds the word.
 */

import { resolve } from 'node:path';
import { build } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { specialsDebug, specialsEngineOptions, specialsLookWord, specialsOn } from '../../src/app/specialsWord.ts';

const REPO = resolve(__dirname, '..', '..');
const WORD_FILE = resolve(REPO, 'src', 'app', 'specialsWord.ts').split('\\').join('/');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  specialsDebug(false);
});

describe('the word under vitest (no define: the typeof guard, no ReferenceError)', () => {
  it("specialsOn('?specials=on') is true and specialsOn('') is false", () => {
    expect(typeof (globalThis as { __PYREFLY_SPECIALS__?: unknown }).__PYREFLY_SPECIALS__).toBe('undefined');
    expect(specialsOn('?specials=on')).toBe(true);
    expect(specialsOn('?a=1&specials=on')).toBe(true);
    expect(specialsOn('?specials=on&specialsfit=larger')).toBe(true);
    expect(specialsOn('')).toBe(false);
    expect(specialsOn('?specials=off')).toBe(false);
    expect(specialsOn('?specialson')).toBe(false);
  });

  it('is read lazily: the address in force when the options are built decides, not the one at import time', () => {
    vi.stubGlobal('location', { search: '' });
    expect(specialsEngineOptions()).toEqual({});
    vi.stubGlobal('location', { search: '?specials=on' });
    expect(specialsEngineOptions()).toEqual({ specialDressUp: true });
  });

  it('the debug call turns it on for the next battle without the address, and false clears it; with no argument it reads', () => {
    expect(specialsOn('')).toBe(false);
    expect(specialsDebug()).toBe(false);
    expect(specialsDebug(true)).toBe(true);
    expect(specialsOn('')).toBe(true);
    expect(specialsDebug()).toBe(true);
    expect(specialsDebug(false)).toBe(false);
    expect(specialsOn('')).toBe(false);
  });

  it('the look words: all three keys come back, and an unknown value is dropped', () => {
    expect(specialsLookWord('?specials=on&specialsfit=larger&specialsmark=b&specialshold=short-always')).toEqual({ fit: 'larger', mark: 'b', hold: 'short-always' });
    expect(specialsLookWord('?specials=on&specialsfit=huge&specialsmark=z&specialshold=never')).toEqual({});
    expect(specialsLookWord('?specials=on&specialsfit=true')).toEqual({ fit: 'true' });
    expect(specialsLookWord('?specials=on&specialsfit=trial&specialshold=per-save&specialsmark=a')).toEqual({ fit: 'trial', mark: 'a', hold: 'per-save' });
    expect(specialsLookWord('')).toBeNull();
    expect(specialsLookWord('?specialsfit=larger')).toBeNull(); // a look word without the word itself is nothing
  });
});

describe('the production bundle holds none of the words (the Vite define)', () => {
  const ENTRY = `import { specialsDebug, specialsEngineOptions, specialsLookWord, specialsOn } from '${WORD_FILE}';
globalThis.__specialsProbe = [specialsOn(), specialsEngineOptions(), specialsLookWord(), specialsDebug(true)];
`;
  const WORDS = ['specialsfit', 'specialsmark', 'specialshold', 'specials=on'];

  async function bundle(define: Record<string, string>): Promise<string> {
    const result = await build({
      root: REPO,
      configFile: false,
      logLevel: 'error',
      base: '/',
      publicDir: false,
      define,
      plugins: [
        {
          name: 'specials-proof-entry',
          enforce: 'pre' as const,
          resolveId: (id: string) => (id === 'virtual:entry' ? '\0virtual:entry' : null),
          load: (id: string) => (id === '\0virtual:entry' ? ENTRY : null),
        },
      ],
      build: { write: false, minify: true, copyPublicDir: false, target: 'es2022', rollupOptions: { input: 'virtual:entry' } },
    });
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => ('output' in r ? r.output : []));
    return outputs.map((o) => (o.type === 'chunk' ? o.code : typeof o.source === 'string' ? o.source : '')).join('\n');
  }

  type ConfigFn = (env: { command: string; mode: string }) => { define: Record<string, string> };
  const configFor = async (env: { command: string; mode: string }): Promise<Record<string, string>> => ((await import('../../vite.config.ts')) as { default: ConfigFn }).default(env).define;
  const defines = (): Promise<Record<string, string>> => configFor({ command: 'build', mode: 'production' });

  it("the repo's own production define is false; the dev server and a build in the specials-test mode are true; the build reads no environment variable for it", async () => {
    expect((await defines())['__PYREFLY_SPECIALS__']).toBe('false');
    expect((await configFor({ command: 'serve', mode: 'development' }))['__PYREFLY_SPECIALS__']).toBe('true');
    expect((await configFor({ command: 'build', mode: 'specials-test' }))['__PYREFLY_SPECIALS__']).toBe('true');
    expect((await configFor({ command: 'build', mode: 'production' }))['__PYREFLY_SPECIALS__']).toBe('false');
    vi.stubEnv('PYREFLY_SPECIALS_TEST', '1'); // an environment variable left in a shell changes nothing
    expect((await defines())['__PYREFLY_SPECIALS__']).toBe('false');
  });

  it('with the production define the bundle holds none of the words; with the define true it holds them (the control)', async () => {
    const production = await bundle(await defines());
    expect(WORDS.filter((w) => production.includes(w))).toEqual([]);
    expect(production.length, 'the module is in the bundle at all').toBeGreaterThan(0);
    const control = await bundle({ ...(await defines()), __PYREFLY_SPECIALS__: 'true' });
    expect(WORDS.filter((w) => !control.includes(w))).toEqual([]);
  }, 120_000);
});
