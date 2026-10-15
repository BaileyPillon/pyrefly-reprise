// @vitest-environment jsdom
/**
 * `RawInputWatcher`'s `edgeOnly` option (re-parity RC9, lane FFX-A; **FFX only**; opt-in, default off).
 *
 * Swordplay, Bushido and Fury read a press the way the game's pad word does: a button is NEWLY pressed once, when it goes down, and a key that is held
 * is not a stream of presses (`FFX-G01` sections 6.2 to 6.4; Fury's reader 0x00630CF0 is true only on the frame the bit rises). The shared watcher repeats a
 * held DIRECTION for menus (the keyboard's repeat events, a pad direction after a delay), so the three overlays ask for `edgeOnly`. This file pins both
 * halves: what the option changes, and that nothing else did (the default watcher reads input exactly as before), plus a guard that no other caller
 * has started using it without a review (the release driver owns the input layer).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RawInputWatcher, forgetPlayerDevice, type UiButton } from '../../src/ui/ffx/rawInput.ts';

// ---------------------------------------------------------------- helpers

function keydown(code: string, init: KeyboardEventInit = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true, ...init }));
}

/** A standard-mapping pad whose buttons the test presses and releases (0 confirm, 12 up, 13 down, 14 left, 15 right). */
function makePad(): { pad: Gamepad; set(index: number, down: boolean): void } {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 } as unknown as Gamepad;
  return { pad, set: (i, down) => { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; } };
}

function stubPads(pads: Array<Gamepad | null>): void {
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
}

/** A watcher that records every button it reports. */
function listen(opts: { edgeOnly?: boolean } = {}): { heard: UiButton[]; watcher: RawInputWatcher } {
  const heard: UiButton[] = [];
  const watcher = new RawInputWatcher((b) => heard.push(b), opts);
  watcher.attach();
  return { heard, watcher };
}

const watchers: RawInputWatcher[] = [];
const track = <T extends { watcher: RawInputWatcher }>(w: T): T => {
  watchers.push(w.watcher);
  return w;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  forgetPlayerDevice();
});

afterEach(() => {
  for (const w of watchers.splice(0)) w.detach();
  vi.useRealTimers();
  delete (navigator as { getGamepads?: unknown }).getGamepads;
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------- the keyboard

describe('the keyboard', () => {
  it('a default watcher repeats a held direction (menus) and never a held confirm: unchanged by RC9', () => {
    const { heard } = track(listen());
    keydown('ArrowLeft');
    for (let i = 0; i < 3; i++) keydown('ArrowLeft', { repeat: true });
    expect(heard).toEqual(['left', 'left', 'left', 'left']);
    heard.length = 0;
    keydown('Enter');
    for (let i = 0; i < 3; i++) keydown('Enter', { repeat: true });
    expect(heard).toEqual(['confirm']);
  });

  it('an edgeOnly watcher reports a held direction once, and the same key again when it is pressed anew', () => {
    const { heard } = track(listen({ edgeOnly: true }));
    keydown('ArrowLeft');
    for (let i = 0; i < 5; i++) keydown('ArrowLeft', { repeat: true });
    expect(heard, 'the key-down is a press, the auto-repeat is not').toEqual(['left']);
    keydown('ArrowLeft'); // released and pressed again (a new key-down, repeat false)
    expect(heard).toEqual(['left', 'left']);
  });

  it('edgeOnly never eats a press: every key that goes down is heard, held keys or not', () => {
    const { heard } = track(listen({ edgeOnly: true }));
    keydown('ArrowDown');
    keydown('ArrowDown', { repeat: true });
    keydown('ArrowRight'); // a second key goes down while the first is held
    keydown('ArrowDown', { repeat: true });
    keydown('KeyF');
    keydown('Enter');
    keydown('Enter', { repeat: true });
    expect(heard).toEqual(['down', 'right', 'l1', 'confirm']);
  });

  it('two watchers are independent: an edgeOnly one does not change a default one beside it', () => {
    const menu = track(listen());
    const overlay = track(listen({ edgeOnly: true }));
    keydown('ArrowUp');
    keydown('ArrowUp', { repeat: true });
    keydown('ArrowUp', { repeat: true });
    expect(menu.heard).toEqual(['up', 'up', 'up']);
    expect(overlay.heard).toEqual(['up']);
  });
});

// ---------------------------------------------------------------- the pad

describe('a pad', () => {
  it('a default watcher repeats a held direction after the delay, then at an interval (menus): unchanged by RC9', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const { heard } = track(listen());
    set(14, true); // d-pad left, held for a second
    await vi.advanceTimersByTimeAsync(1000);
    set(14, false);
    await vi.advanceTimersByTimeAsync(50);
    expect(heard.length, 'the press, then repeats').toBeGreaterThanOrEqual(5);
    expect(new Set(heard)).toEqual(new Set(['left']));
  });

  it('an edgeOnly watcher reports a held direction once however long it is held, and again after a release', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const { heard } = track(listen({ edgeOnly: true }));
    set(15, true); // d-pad right, held for two seconds
    await vi.advanceTimersByTimeAsync(2000);
    expect(heard).toEqual(['right']);
    set(15, false);
    await vi.advanceTimersByTimeAsync(50);
    set(15, true); // a new press
    await vi.advanceTimersByTimeAsync(50);
    expect(heard).toEqual(['right', 'right']);
  });

  it('a stick held past its dead zone is a held direction too: once under edgeOnly', async () => {
    const { pad } = makePad();
    (pad.axes as unknown as number[])[0] = -1; // stick pushed left
    stubPads([pad]);
    const edge = track(listen({ edgeOnly: true }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(edge.heard).toEqual(['left']);
  });

  it('a held confirm never repeats, with or without the option; each press is heard once', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const plain = track(listen());
    const edge = track(listen({ edgeOnly: true }));
    set(0, true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(plain.heard).toEqual(['confirm']);
    expect(edge.heard).toEqual(['confirm']);
  });
});

// ---------------------------------------------------------------- the option stays opt-in

describe('the option is opt-in and used only where the game reads a newly pressed button', () => {
  const root = join(process.cwd(), 'src');
  // every file that imports the watcher (24 at the time of writing) lives under src/ui or src/app, so those two folders are the scan: reading all of src/ (1,700 files) timed out at 15 s on a loaded machine
  const scanned = ['ui', 'app'].map((d) => join(root, d));
  const sources = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? sources(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
    });

  it('the only callers that pass edgeOnly are the three Overdrive overlays (the definition is rawInput.ts)', () => {
    const using = scanned
      .flatMap(sources)
      .filter((p) => /\bedgeOnly\b/.test(readFileSync(p, 'utf8')))
      .map((p) => relative(root, p).replace(/\\/g, '/'))
      .sort();
    expect(using).toEqual(['ui/ffx/minigames/AuronSequence.ts', 'ui/ffx/minigames/LuluFury.ts', 'ui/ffx/minigames/TidusTiming.ts', 'ui/ffx/rawInput.ts']);
  }, 30_000);

  it('each of the three overlays turns it on, and the default is off', () => {
    for (const file of ['TidusTiming', 'AuronSequence', 'LuluFury']) {
      const text = readFileSync(join(root, 'ui/ffx/minigames', `${file}.ts`), 'utf8');
      expect(text, file).toMatch(/\{ edgeOnly: true \}/);
    }
    const input = readFileSync(join(root, 'ui/ffx/rawInput.ts'), 'utf8');
    expect(input).toMatch(/this\.edgeOnly = opts\.edgeOnly === true;/);
  });
});
