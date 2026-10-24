// @vitest-environment jsdom
/**
 * THE TITLE AT THE BOOTH (release 61, the conference demo; Bailey, 2026-10-21, decisions 169n and 169o; both games, demo mode only; `src/app/demo/demoTitle.ts`, `attractHook.ts`).
 *
 * Claims: outside demo mode the title gets nothing (no plate, no clock, no reel); in demo mode it gets the QR plate on the UI layer and counts the idle seconds; the reel starts once, at 60 s of no one
 * (a key, a busy title or a pad button starts the count over); a reel that never left the title (a press while its art loaded) lets the title count again; a title with no reel handed in shows the plate and starts nothing.
 * The title's module graph does not contain the reel (`attractHook.ts`).
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { attractRunner, setAttractRunner } from '../../src/app/demo/attractHook.ts';
import { setBoothMode } from '../../src/app/demo/boothSwitch.ts';
import { enterDemoTitle } from '../../src/app/demo/demoTitle.ts';
import { ATTRACT_AFTER_MS } from '../../src/app/demo/demoIdle.ts';

let now = 0;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  now = 1000;
  setBoothMode('today'); // r64 (item 200b): the booth screens are on by default; these claims are release 61's REEL, which is what `?pack=off` / `?booth=today` keep (the card is booth-attract.test.ts's)
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  document.body.innerHTML = '<div id="ui"></div>';
});
afterEach(() => {
  setBoothMode(null);
  setDemoMode(null);
  setAttractRunner(null);
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const appOf = (): never => ({ uiRoot: document.getElementById('ui') }) as never;

describe('the booth title', () => {
  it('is nothing outside demo mode: no plate, no clock', () => {
    setDemoMode(false);
    expect(enterDemoTitle(appOf())).toBeNull();
    expect(document.querySelector('.demo-qr')).toBeNull();
  });

  it('puts the QR plate on the UI layer, and takes it away with the title', () => {
    setDemoMode(true);
    const t = enterDemoTitle(appOf())!;
    const plate = document.querySelector('.demo-qr--title');
    expect(plate).not.toBeNull();
    expect(plate!.parentElement!.id).toBe('ui'); // not inside the title's root: the title rewrites that when its picture changes
    t.dispose();
    expect(document.querySelector('.demo-qr')).toBeNull();
  });

  it('starts the reel once, at 60 s of nobody there', async () => {
    setDemoMode(true);
    const run = vi.fn(() => new Promise<{ left: boolean }>(() => undefined));
    setAttractRunner(run);
    const t = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS - 1;
    t.update(false);
    expect(run).not.toHaveBeenCalled();
    now += 1;
    t.update(false);
    t.update(false);
    await flush();
    expect(run).toHaveBeenCalledTimes(1);
    t.dispose();
  });

  it('a key, a busy title (Start was pressed, a panel is up) or a pad button starts the count over', () => {
    setDemoMode(true);
    const run = vi.fn(() => new Promise<{ left: boolean }>(() => undefined));
    setAttractRunner(run);
    const t = enterDemoTitle(appOf())!;
    now += 50_000;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    now += 50_000;
    t.update(false);
    expect(run).not.toHaveBeenCalled(); // 50 s since the key
    now += 5_000;
    t.update(true); // busy: the count starts over
    now += 59_000;
    t.update(false);
    expect(run).not.toHaveBeenCalled();
    vi.stubGlobal('navigator', { getGamepads: () => [{ connected: true, buttons: [{ pressed: true }], axes: [0, 0] }] });
    now += 5_000;
    t.update(false); // a pad button: starts over again
    vi.unstubAllGlobals();
    now += 59_000;
    t.update(false);
    expect(run).not.toHaveBeenCalled();
    now += 2_000;
    t.update(false);
    expect(run).toHaveBeenCalledTimes(1);
    t.dispose();
  });

  it('a reel that never left the title lets it count again; one that did leave does not restart', async () => {
    setDemoMode(true);
    const results = [{ left: false }, { left: true }];
    const run = vi.fn(async () => results.shift()!);
    setAttractRunner(run);
    const t = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS;
    t.update(false);
    await flush();
    expect(run).toHaveBeenCalledTimes(1);
    t.update(false); // counted again from the moment the reel gave back the title
    expect(run).toHaveBeenCalledTimes(1);
    now += ATTRACT_AFTER_MS;
    t.update(false);
    await flush();
    expect(run).toHaveBeenCalledTimes(2);
    now += ATTRACT_AFTER_MS * 3;
    t.update(false); // the title went: this DemoTitle is done
    expect(run).toHaveBeenCalledTimes(2);
    t.dispose();
  });

  it('a reel that fails to start is not a stuck title: it counts again', async () => {
    setDemoMode(true);
    const run = vi.fn().mockRejectedValueOnce(new Error('no')).mockImplementation(() => new Promise<{ left: boolean }>(() => undefined));
    setAttractRunner(run);
    const t = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS;
    t.update(false);
    await flush();
    now += ATTRACT_AFTER_MS;
    t.update(false);
    await flush();
    expect(run).toHaveBeenCalledTimes(2);
    t.dispose();
  });

  it('with no reel handed in it shows the plate and starts nothing', () => {
    setDemoMode(true);
    expect(attractRunner()).toBeNull();
    const t = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS * 2;
    expect(() => t.update(false)).not.toThrow();
    expect(document.querySelector('.demo-qr--title')).not.toBeNull();
    t.dispose();
  });
});

describe('the title does not import the reel', () => {
  it('neither TitleScreen, demoTitle nor attractHook names the attract module or the battle screen', () => {
    for (const f of ['src/app/screens/TitleScreen.ts', 'src/app/demo/demoTitle.ts', 'src/app/demo/attractHook.ts']) {
      const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(code, f).not.toMatch(/from '[^']*demoAttract\.ts'|import\(\s*'[^']*demoAttract/);
      expect(code, f).not.toMatch(/from '[^']*BattleScreen\.ts'/);
    }
  });

  it('main.ts is what hands the reel in', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toMatch(/setAttractRunner\(runAttract\)/);
  });
});
