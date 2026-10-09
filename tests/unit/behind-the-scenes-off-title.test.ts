// @vitest-environment jsdom
/**
 * BEHIND THE SCENES with its switch OFF, on the real title screen (Bailey, 2026-10-08: "When off, the entry, its key and its
 * page are ABSENT ... Nothing about it may be reachable in a public build."). `behind-the-scenes-off.test.ts` pins the
 * constant and proves the bundle holds none of the page; this drives the real `TitleScreen` and the real `Input` in jsdom
 * and shows that nothing a player, or a stray call, can do opens it: not the T key, not a `title:bts` action, not the
 * panel's own `open('bts')`, and nothing is claimed or drawn.
 *
 * Game case: both (the title is the front door of FFX and FFX-2 alike).
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { Input } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { BTS_LIVE } from '../../src/app/changelog/behindTheScenes.ts';
import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { TitleInfo } from '../../src/app/screens/frontend/titleInfo.ts';

const detach: (() => void)[] = [];
afterEach(() => {
  while (detach.length) detach.pop()?.();
  document.body.innerHTML = '';
});

async function showTitle(): Promise<{ input: Input; screen: TitleScreen; root: HTMLElement }> {
  const uiRoot = document.body.appendChild(document.createElement('div'));
  const slot = new Map<string, string>([[SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings: { reduceMotion: true }, seenCoach: [], flags: {} })]]);
  const input = new Input({ pointerRoot: uiRoot, keyboardTarget: window });
  input.attach();
  detach.push(() => input.detach());
  const app = {
    uiRoot,
    input,
    save: new SaveStore(SAVE_KEY, { getItem: (k) => slot.get(k) ?? null, setItem: (k, v) => void slot.set(k, v), removeItem: (k) => void slot.delete(k) }),
    fade: () => Promise.resolve(),
  };
  const screen = new TitleScreen();
  screen.app = app as unknown as App;
  screen.root = uiRoot.appendChild(document.createElement('div'));
  await screen.enter();
  return { input, screen, root: screen.root };
}

const press = (code: string, init: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
};

describe('with the switch off, on the real title screen', () => {
  it('runs with the switch off (this file means nothing otherwise)', () => {
    expect(BTS_LIVE).toBe(false);
  });

  it('draws no entry for it, in either title, with or without the briefing chip', async () => {
    const { screen, root } = await showTitle();
    expect(root.querySelector('[data-action="title:bts"]')).toBeNull();
    expect(root.innerHTML).not.toMatch(/behind the scenes/i);
    expect(root.querySelectorAll('.fe-hint__entry')).toHaveLength(1);
    expect(root.querySelector('.fe-hint__entry')?.getAttribute('data-action')).toBe('title:changelog');
    screen.exit();
  });

  it('does nothing on T, with or without a modifier: nothing opens, nothing is claimed, the title carries on', async () => {
    const { input, screen, root } = await showTitle();
    press('KeyT');
    press('KeyT', { shiftKey: true });
    press('KeyT', { repeat: true });
    await new Promise((r) => setTimeout(r, 150));
    expect(root.querySelector('.fe-info')).toBeNull();
    expect(input.keyboardClaimed).toBe(false);
    expect((screen.snapshot()['info'] as { open: string | null }).open).toBeNull();
    expect(screen.snapshot()['advancing']).toBe(false);
    screen.exit();
  });

  it('does nothing for a title:bts action, the one a click on a missing entry would send', async () => {
    const { input, screen, root } = await showTitle();
    input.injectAction('title:bts');
    input.update();
    screen.handleInput(input);
    input.endFrame();
    await new Promise((r) => setTimeout(r, 150));
    expect(root.querySelector('.fe-info')).toBeNull();
    expect(input.keyboardClaimed).toBe(false);
    expect(screen.snapshot()['advancing']).toBe(false);
    screen.exit();
  });

  it('does nothing when the panel itself is asked for it, and still opens the changelog afterwards', async () => {
    const { input, screen, root } = await showTitle();
    const info = new TitleInfo(root, { input } as unknown as App);
    info.open('bts');
    await new Promise((r) => setTimeout(r, 150));
    expect(info.openKind).toBeNull();
    expect(root.querySelector('.fe-info')).toBeNull();
    expect(input.keyboardClaimed).toBe(false);
    info.open('changelog');
    expect(info.openKind).toBe('changelog');
    info.dispose();
    expect(input.keyboardClaimed).toBe(false);
    screen.exit();
  });

  it('asks for no module of the page and no picture of it while the title is up (nothing to load: the page is not in the build)', async () => {
    const { screen, root } = await showTitle();
    const urls = [...root.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '');
    expect(urls.filter((u) => /\/bts\//.test(u))).toEqual([]);
    expect(document.getElementById('bts-styles')).toBeNull();
    screen.exit();
  });
});
