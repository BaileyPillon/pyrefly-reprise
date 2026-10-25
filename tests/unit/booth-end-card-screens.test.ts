// @vitest-environment jsdom
/**
 * THE END CARD AS A SCREEN (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b; both games, demo mode only; `src/app/demo/demoThanks.ts`, `BoothCardScreen.ts`).
 *
 *  1. the demo's "Thanks for playing" card after a won fight is the Echo end card with the booth screens on (the painting, the thanks line, the picked frame's words, the QR) and release 62's cream card with them off;
 *     it ends exactly as it always did: a press after the guard, a click, or the timer; a press inside the guard is taken;
 *  2. the standalone cards (`?card=end`, `?card=attract`) stand until a press after the guard, then go on to the title; a press inside the guard is taken; nothing else moves.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from '../../src/app/App.ts';
import type { Button, InputSnapshot } from '../../src/app/Input.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { setBoothMode } from '../../src/app/demo/boothSwitch.ts';
import { BoothCardScreen, CARD_GUARD_MS } from '../../src/app/demo/BoothCardScreen.ts';
import { THANKS_GUARD_MS, THANKS_MS, DemoThanksScreen } from '../../src/app/demo/demoThanks.ts';
import { boothQrSvg } from '../../src/app/demo/demoQr.ts';

beforeEach(() => {
  setDemoMode(true);
  setBoothMode('new');
});
afterEach(() => {
  setDemoMode(null);
  setBoothMode(null);
  document.body.innerHTML = '';
});

function snapshot(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const edges = new Set(pressed);
  return {
    pressed: (b) => edges.has(b),
    justPressed: (b) => edges.has(b),
    justReleased: () => false,
    consume: (b) => edges.delete(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: true,
    lastDevice: 'gamepad',
  };
}

function wire<T extends { app: App; root: HTMLElement }>(screen: T, goto = vi.fn(() => Promise.resolve(true))): { screen: T; root: HTMLElement; goto: typeof goto } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { fade: () => Promise.resolve(), uiRoot: document.body, goto } as unknown as App;
  screen.root = root;
  return { screen, root, goto };
}

describe('the thanks card as the Echo end card', () => {
  const open = (chapterId: string): { screen: DemoThanksScreen; root: HTMLElement; ended: () => boolean } => {
    const { screen, root } = wire(new DemoThanksScreen({ chapterId }));
    screen.enter();
    let over = false;
    void screen.done.then(() => (over = true));
    return { screen, root, ended: () => over };
  };

  it.each([['seymour-flux'], ['ffx2-bahamut']])('draws the painting, the thanks, the picked frame\'s words and the QR for %s, and not the cream card', (id) => {
    const { root } = open(id);
    expect(root.classList.contains('demo-thanks--booth')).toBe(true);
    expect(root.querySelector('.booth-end--after')).not.toBeNull();
    expect(root.querySelector('.demo-thanks__card')).toBeNull();
    const text = root.textContent ?? '';
    expect(text).toContain('Thanks for playing');
    expect(text).toContain('An unofficial fan tribute');
    expect(text).toContain('Scan to play');
    expect(text).toContain('echoesofspira.com');
    const code = document.createElement('div');
    code.innerHTML = boothQrSvg(); // parsed the way the page parsed it, so the two serialise alike
    expect(root.querySelector('.booth-qr')!.innerHTML).toBe(code.innerHTML);
    expect(root.querySelector('img')?.getAttribute('src')).toMatch(/art\/title\/echo\./);
    expect(root.dataset['action']).toBe('thanks:end'); // a click or a tap anywhere still ends it
  });

  it('is release 62\'s cream card with the booth screens off', () => {
    setBoothMode('today');
    const { root } = open('seymour-flux');
    expect(root.querySelector('.demo-thanks__card')).not.toBeNull();
    expect(root.querySelector('.booth-end')).toBeNull();
  });

  it('ends on the timer, a press after the guard or a click, and takes a press inside the guard', async () => {
    const flush = async (): Promise<void> => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    };
    const timer = open('seymour-flux');
    timer.screen.update(THANKS_MS / 1000 + 0.01);
    await flush();
    expect(timer.ended()).toBe(true);

    const press = open('seymour-flux');
    const early = snapshot(['confirm']);
    press.screen.handleInput(early);
    expect(early.justPressed('confirm')).toBe(false); // taken
    await flush();
    expect(press.ended()).toBe(false);
    press.screen.update(THANKS_GUARD_MS / 1000 + 0.01);
    press.screen.handleInput(snapshot(['confirm']));
    await flush();
    expect(press.ended()).toBe(true);

    const click = open('ffx2-bahamut');
    expect(click.screen.trigger('thanks:end')).toBe(true);
    await flush();
    expect(click.ended()).toBe(true);
  });
});

describe('the standalone cards', () => {
  it.each([['end', '.booth-end', 'booth-end'], ['attract', '.booth-attract', 'booth-attract']] as const)('the %s card stands alone on the screen', (kind, selector, name) => {
    const { screen, root } = wire(new BoothCardScreen(kind));
    screen.enter();
    expect(screen.name).toBe(name);
    expect(root.querySelector(selector)).not.toBeNull();
    expect(root.querySelector('.booth-end--after')).toBeNull(); // the booth loop's own card carries no "Thanks for playing"
    expect(root.dataset['action']).toBe('card:next');
  });

  it('takes a press inside the guard, then goes on to the title on the next press, once', async () => {
    const { screen, goto } = wire(new BoothCardScreen('end'));
    screen.enter();
    const early = snapshot(['confirm']);
    screen.handleInput(early);
    expect(early.justPressed('confirm')).toBe(false);
    expect(goto).not.toHaveBeenCalled();
    screen.update(CARD_GUARD_MS / 1000 + 0.01);
    screen.handleInput(snapshot(['confirm']));
    screen.handleInput(snapshot(['confirm']));
    await Promise.resolve();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith('title');
  });

  it('goes on from a click or a tap too, but not inside the guard', () => {
    const { screen, goto } = wire(new BoothCardScreen('attract'));
    screen.enter();
    expect(screen.trigger('card:next')).toBe(true);
    expect(goto).not.toHaveBeenCalled();
    screen.update(CARD_GUARD_MS / 1000 + 0.01);
    expect(screen.trigger('card:next')).toBe(true);
    expect(goto).toHaveBeenCalledWith('title');
    expect(screen.trigger('something-else')).toBe(false);
  });
});
