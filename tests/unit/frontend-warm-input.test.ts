// @vitest-environment jsdom
/**
 * PR-0405 (round 25, both games, one shared front end): the briefing's and the board's paintings are asked for at the player's
 * first key or pointer input, not when the title appears.
 *
 * Round 25 measured 29.7 MB of art arriving in the 4.5 seconds after the title was ready, before anyone had touched anything
 * (121 MB in the first 24 s). The title now loads what it draws; everything else waits for the first key, press, touch, wheel or
 * pointer movement, or for the press that leaves the title (a pad press raises no DOM event, so `advance` starts it itself).
 *
 * `tests/unit/load-time-gates.test.ts` and `load-time-preload.test.ts` keep pinning WHAT is asked for and in what order (the
 * opening card first, every other card's faces next); this file pins WHEN.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/inkgold/index.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/ui/inkgold/index.ts')>();
  return { ...real, playWipe: vi.fn(async (_root: unknown, opts?: { onCover?: () => void }) => { opts?.onCover?.(); }) };
});

import type { App } from '../../src/app/App.ts';
import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { DEFAULT_PREFETCH_MODE, FIRST_INPUT_EVENTS, PREFETCH_MODES, armFrontEndWarm, beginFrontEndWarm, boardArtUrls, briefingArtUrls, prefetchModeFrom, startFrontEndWarm } from '../../src/app/screens/frontendWarm.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';
import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';

const made: string[] = [];
const save = { isCleared: () => false, chapter: () => ({ bestTimeMs: null }) };
const BOARD_ART = /art\/(backdrops|characters|portraits)\//;

beforeEach(() => {
  made.length = 0;
  resetImageWarm();
  setArtManifest(null); // no manifest to read: every request goes ahead, none is filtered out
  class FakeImage {
    decoding = '';
    private s = '';
    get src(): string {
      return this.s;
    }
    set src(v: string) {
      this.s = v;
      made.push(v);
    }
    decode(): Promise<void> {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
});
afterEach(() => {
  window.history.replaceState({}, '', '/');
  // Whatever a test left armed must not fire in the next one.
  startFrontEndWarm({ save } as never, false);
  vi.unstubAllGlobals();
  resetImageWarm();
  resetArtManifest();
});

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 5));
const boardRequests = (): string[] => made.filter((u) => BOARD_ART.test(u));

describe('armFrontEndWarm', () => {
  it('asks for nothing until an input, whatever the time', async () => {
    const target = new EventTarget();
    armFrontEndWarm({ save } as never, () => false, target);
    await flush();
    await new Promise((r) => setTimeout(r, 60));
    expect(made).toEqual([]);
  });

  it.each(FIRST_INPUT_EVENTS)('a %s is the first input: the opening card first, then the rest, once', async (type) => {
    const target = new EventTarget();
    armFrontEndWarm({ save } as never, () => false, target);
    target.dispatchEvent(new Event(type));
    await flush();
    const { first } = boardArtUrls(save as never);
    expect(boardRequests().length).toBeGreaterThan(first.length); // the rest follows the opening card
    expect(boardRequests()[0]).toBe(first[0]);
    const count = made.length;
    target.dispatchEvent(new Event(type));
    target.dispatchEvent(new Event('keydown'));
    await flush();
    expect(made.length, 'a second input starts nothing again').toBe(count);
  });

  it('is the key, the press, the touch, the wheel and the pointer moving, and nothing else', () => {
    expect([...FIRST_INPUT_EVENTS].sort()).toEqual(['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel']);
    const target = new EventTarget();
    armFrontEndWarm({ save } as never, () => false, target);
    for (const type of ['keyup', 'pointerup', 'click', 'resize', 'focus', 'visibilitychange']) target.dispatchEvent(new Event(type));
    expect(made).toEqual([]);
  });

  it('asks whether the briefing is due when the input comes, not when the title appeared', async () => {
    const target = new EventTarget();
    let due = false;
    armFrontEndWarm({ save } as never, () => due, target);
    due = true; // the player dismissed nothing yet, but the save said so by the time they pressed a key
    target.dispatchEvent(new Event('keydown'));
    await flush();
    expect(made.slice(0, 2)).toEqual(briefingArtUrls());
  });

  it('can be cancelled, and arming twice (the title entered again) leaves one wait, not two', async () => {
    const target = new EventTarget();
    const cancel = armFrontEndWarm({ save } as never, () => false, target);
    cancel();
    target.dispatchEvent(new Event('keydown'));
    await flush();
    expect(made).toEqual([]);

    const again = new EventTarget();
    armFrontEndWarm({ save } as never, () => false, target);
    armFrontEndWarm({ save } as never, () => false, again);
    target.dispatchEvent(new Event('keydown')); // the first arm was replaced by the second
    await flush();
    expect(made).toEqual([]);
    again.dispatchEvent(new Event('pointermove'));
    await flush();
    expect(boardRequests().length).toBeGreaterThan(0);
  });

  it('startFrontEndWarm (a pad press, a trigger) starts it at once and ends the wait', async () => {
    const target = new EventTarget();
    armFrontEndWarm({ save } as never, () => true, target);
    startFrontEndWarm({ save } as never, true);
    await flush();
    expect(made.slice(0, 2)).toEqual(briefingArtUrls());
    const count = made.length;
    target.dispatchEvent(new Event('keydown'));
    await flush();
    expect(made.length).toBe(count);
  });
});

describe('the prefetch mode', () => {
  it('reads ?prefetch= from the address, and falls back to the default for anything else', () => {
    expect([...PREFETCH_MODES]).toEqual(['now', 'first', 'defer']);
    expect(prefetchModeFrom('?prefetch=now')).toBe('now');
    expect(prefetchModeFrom('?coach=off&prefetch=first')).toBe('first');
    expect(prefetchModeFrom('?prefetch=defer')).toBe('defer');
    for (const junk of ['', '?', '?prefetch=', '?prefetch=later', '?prefetch=NOW', '?other=now']) expect(prefetchModeFrom(junk), junk).toBe(DEFAULT_PREFETCH_MODE);
    expect(prefetchModeFrom('?prefetch=zzz', 'first')).toBe('first');
  });

  it('now: the next screen and the whole board are asked for as soon as the title is up (r42 and before)', async () => {
    const target = new EventTarget();
    beginFrontEndWarm({ save } as never, () => false, 'now', target);
    await flush();
    const { first, rest } = boardArtUrls(save as never);
    expect(boardRequests()[0]).toBe(first[0]);
    expect(boardRequests().length).toBeGreaterThan(first.length);
    expect(rest.some((u) => made.includes(u))).toBe(true);
  });

  it('first: only the next screen\'s first paint (the opening card) at once, the rest of the board at the first input', async () => {
    const target = new EventTarget();
    beginFrontEndWarm({ save } as never, () => false, 'first', target);
    await flush();
    const { first, rest } = boardArtUrls(save as never);
    expect(boardRequests()).toEqual(first);
    expect(rest.some((u) => made.includes(u))).toBe(false);
    target.dispatchEvent(new Event('keydown'));
    await flush();
    expect(rest.some((u) => made.includes(u))).toBe(true);
  });

  it('first, with the briefing due: its two paintings lead, and the board\'s opening card follows', async () => {
    beginFrontEndWarm({ save } as never, () => true, 'first', new EventTarget());
    await flush();
    expect(made.slice(0, 2)).toEqual(briefingArtUrls());
    const { first, rest } = boardArtUrls(save as never);
    expect(made.slice(2, 2 + first.length)).toEqual(first);
    // and the rest of the board still waits for the first input (Chapter III's plate is the briefing's own backdrop, so it is the one overlap)
    expect(rest.filter((u) => !briefingArtUrls().includes(u)).some((u) => made.includes(u))).toBe(false);
  });

  it('defer: nothing at all until the first input', async () => {
    const target = new EventTarget();
    beginFrontEndWarm({ save } as never, () => true, 'defer', target);
    await flush();
    expect(made).toEqual([]);
    target.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(made.slice(0, 2)).toEqual(briefingArtUrls());
  });
});

describe('the title screen', () => {
  class FakeApp {
    readonly uiRoot = document.createElement('div');
    readonly save = save;
    fade(): Promise<void> {
      return Promise.resolve();
    }
    startFlow = vi.fn(async () => undefined);
  }

  /** The title up, as `?prefetch=<mode>` has it (no mode: the default). */
  async function titleUp(mode?: string): Promise<{ title: TitleScreen; app: FakeApp }> {
    window.history.replaceState({}, '', mode ? `/?prefetch=${mode}` : '/');
    document.body.innerHTML = '';
    const app = new FakeApp();
    document.body.appendChild(app.uiRoot);
    const title = new TitleScreen();
    title.app = app as unknown as App;
    title.root = document.createElement('div');
    app.uiRoot.appendChild(title.root);
    await title.enter();
    return { title, app };
  }

  it('by default the title asks for everything at once, as the live build does (the deferring modes are switched on by ?prefetch= or the one constant)', async () => {
    expect(DEFAULT_PREFETCH_MODE).toBe('now');
    const { title } = await titleUp();
    await flush();
    const { first, rest } = boardArtUrls(save as never);
    expect(boardRequests()[0]).toBe(first[0]);
    expect(rest.some((u) => made.includes(u))).toBe(true);
    title.exit();
  });

  it('?prefetch=defer: draws and loads its own plate, and asks for none of the board\'s or briefing\'s paintings while nothing is touched', async () => {
    const { title } = await titleUp('defer');
    await new Promise((r) => setTimeout(r, 80));
    expect(boardRequests(), 'board or briefing art before any input').toEqual([]);
    title.exit();
  });

  it('?prefetch=now asks for everything at once (r42 and before)', async () => {
    const { title } = await titleUp('now');
    await flush();
    expect(boardRequests().length).toBeGreaterThan(boardArtUrls(save as never).first.length);
    title.exit();
  });

  it('deferred, a key press anywhere starts them: the opening card first', async () => {
    const { title } = await titleUp('defer');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
    await flush();
    const { first } = boardArtUrls(save as never);
    expect(boardRequests()[0]).toBe(first[0]);
    title.exit();
  });

  it('deferred, the pointer moving over the title starts them', async () => {
    const { title } = await titleUp('defer');
    window.dispatchEvent(new Event('pointermove', { bubbles: true }));
    await flush();
    expect(boardRequests().length).toBeGreaterThan(0);
    title.exit();
  });

  it('deferred, the press that leaves the title starts them with no DOM event (a pad, a trigger), and the hold for the next screen is unchanged', async () => {
    const { title, app } = await titleUp('defer');
    expect(boardRequests()).toEqual([]);
    expect(title.trigger('confirm')).toBe(true);
    await new Promise((r) => setTimeout(r, 80));
    expect(boardRequests().length).toBeGreaterThan(0);
    expect(app.startFlow).toHaveBeenCalled(); // the wipe ran and the flow started: nothing waits on the input that did not before
    title.exit();
  });
});
