// @vitest-environment jsdom
/**
 * PR-0360 and PR-0361 (FFX only, release 39): Bushido and Swordplay answer a finger and a click, and the
 * Bushido chips name the control of the device in use.
 *
 * Round 21, real runs on the live site (release 38): at 390x844 seven taps on the Shooting Star overlay gave
 * `{success:false, correctInputs:0, timeRemainingMs:0}` and the move auto-resolved the Fail row, because both
 * overlays read input only through `RawInputWatcher` (keyboard and pad) and the slab inherits the HUD layer's
 * `pointer-events: none`. The chips printed PlayStation symbols only, so a keyboard player was never told that
 * Circle is Esc or that release 38's Square is K. `ffx2/TriggerHappy.ts` (FOC37-02) solved the same pair for FFX-2;
 * these tests pin the FFX twin, route by route, the way the page drives each one: real `KeyboardEvent`s on `window`,
 * the Gamepad API polled from `requestAnimationFrame`, `PointerEvent`s on the slab.
 *
 * The Overdrive's own sequence, zone and timer are NOT touched: the sequences come from `data/ffx/overdrives/inputs.ts`
 * (length sourced, order our estimate), and every case here resolves through the same `stepAuronSequence` /
 * `pressTidusTiming` the keys use.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MinigameResult } from '../../src/battle/common/types.ts';
import { BUSHIDO_SEQUENCES } from '../../src/data/ffx/overdrives/inputs.ts';
import { openAuronSequence } from '../../src/ui/ffx/minigames/AuronSequence.ts';
import { openWakkaReels } from '../../src/ui/ffx/minigames/WakkaReels.ts';
import { openTidusTiming } from '../../src/ui/ffx/minigames/TidusTiming.ts';
import {
  DeviceTracker,
  KEY_CAP,
  PAD_GLYPH,
  chipFace,
  guessDevice,
  namesKeys,
  pressWord,
  sequenceInstruction,
  zoneInstruction,
  type DeviceState,
} from '../../src/ui/ffx/minigames/overlayInput.ts';
import { RawInputWatcher, forgetPlayerDevice, lastPlayerDevice, setRawInputSuspended, type UiButton } from '../../src/ui/ffx/rawInput.ts';

// ---------------------------------------------------------------- helpers

const BUTTONS: readonly UiButton[] = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle', 'square', 'l1', 'r1'];
/** `KeyboardEvent.code` of the key each cap names (the table this file pins `KEY_CAP` against). */
const CODE_OF_CAP: Record<string, string> = { Enter: 'Enter', Esc: 'Escape', Q: 'KeyQ', K: 'KeyK', F: 'KeyF', R: 'KeyR', '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };
const TOUCH: DeviceState = { device: 'pointer', pointerKind: 'touch' };
const MOUSE: DeviceState = { device: 'pointer', pointerKind: 'mouse' };
const KEYS: DeviceState = { device: 'keyboard', pointerKind: 'mouse' };
const PAD: DeviceState = { device: 'gamepad', pointerKind: 'mouse' };

function keydown(code: string, init: KeyboardEventInit = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true, ...init }));
}

function pointerdown(el: Element, pointerType: string, init: PointerEventInit = {}): PointerEvent {
  const e = new PointerEvent('pointerdown', { pointerType, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
}

function makePad(): { pad: Gamepad; set(index: number, down: boolean): void } {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 } as unknown as Gamepad;
  return { pad, set: (i, down) => { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; } };
}

function stubPads(pads: Array<Gamepad | null>): void {
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
}

function stubCoarsePointer(coarse: boolean): void {
  window.matchMedia = ((query: string) => ({ matches: coarse && query.includes('coarse'), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

async function tapPad(set: (i: number, down: boolean) => void, index: number): Promise<void> {
  set(index, true);
  await vi.advanceTimersByTimeAsync(40);
  set(index, false);
  await vi.advanceTimersByTimeAsync(40);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  forgetPlayerDevice();
});

afterEach(() => {
  setRawInputSuspended(false);
  vi.useRealTimers();
  delete (navigator as { getGamepads?: unknown }).getGamepads;
  delete (window as { matchMedia?: unknown }).matchMedia;
  document.body.innerHTML = '';
});

// ------------------------------------------------------- the pure words and faces

describe('the chip faces and the words follow the device (PR-0361)', () => {
  it('every button has a symbol and a key, and the table covers exactly the buttons the watcher can report', () => {
    expect(Object.keys(PAD_GLYPH).sort()).toEqual([...BUTTONS].sort());
    expect(Object.keys(KEY_CAP).sort()).toEqual([...BUTTONS].sort());
  });

  it('every key the overlay names is a key the real watcher reads as that button', () => {
    const seen: string[] = [];
    const watcher = new RawInputWatcher((b, source) => seen.push(`${b}:${source}`));
    watcher.attach();
    for (const b of BUTTONS) {
      const cap = KEY_CAP[b];
      const code = CODE_OF_CAP[cap];
      expect(code, `no key code for the cap ${cap}`).toBeDefined();
      keydown(code!);
    }
    watcher.detach();
    expect(seen).toEqual(BUTTONS.map((b) => `${b}:keyboard`));
  });

  it("every symbol the overlay names is the pad button the real watcher reads as that button (standard mapping)", async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const seen: string[] = [];
    const watcher = new RawInputWatcher((b, source) => seen.push(`${b}:${source}`));
    watcher.attach();
    // The glyph the overlay shows for each face button is the PlayStation name of standard index 0, 1, 2, 3 and the shoulders 4, 5.
    const INDEX_OF: Array<[UiButton, number]> = [['confirm', 0], ['cancel', 1], ['square', 2], ['triangle', 3], ['l1', 4], ['r1', 5], ['up', 12], ['down', 13], ['left', 14], ['right', 15]];
    for (const [b, i] of INDEX_OF) {
      await tapPad(set, i);
      expect(seen.at(-1)).toBe(`${b}:gamepad`);
    }
    watcher.detach();
    expect(PAD_GLYPH.confirm).toBe('✕');
    expect(PAD_GLYPH.cancel).toBe('○');
    expect(PAD_GLYPH.square).toBe('□');
    expect(PAD_GLYPH.triangle).toBe('△');
  });

  it('a keyboard or a mouse sees the key first and the symbol beside it; arrows are just the arrow', () => {
    for (const d of [KEYS, MOUSE]) {
      expect(chipFace('triangle', d)).toEqual({ main: 'Q', sub: '△', aria: 'Triangle, key Q' });
      expect(chipFace('cancel', d)).toEqual({ main: 'Esc', sub: '○', aria: 'Circle, key Esc' });
      expect(chipFace('square', d)).toEqual({ main: 'K', sub: '□', aria: 'Square, key K' });
      expect(chipFace('confirm', d)).toEqual({ main: 'Enter', sub: '✕', aria: 'Cross, key Enter' });
      expect(chipFace('l1', d)).toEqual({ main: 'F', sub: 'L1', aria: 'L1, key F' });
      expect(chipFace('r1', d)).toEqual({ main: 'R', sub: 'R1', aria: 'R1, key R' });
      expect(chipFace('left', d)).toEqual({ main: '←', sub: '', aria: 'Left' });
    }
  });

  it('a pad and a finger see the symbol alone (a finger taps it; a pad presses it)', () => {
    for (const d of [PAD, TOUCH]) {
      expect(namesKeys(d)).toBe(false);
      expect(chipFace('square', d)).toEqual({ main: '□', sub: '', aria: 'Square' });
      expect(chipFace('confirm', d)).toEqual({ main: '✕', sub: '', aria: 'Cross' });
    }
  });

  it('a token the table does not know keeps the old two-letter fallback on every device', () => {
    for (const d of [KEYS, PAD, TOUCH, MOUSE]) expect(chipFace('zz', d)).toEqual({ main: 'ZZ', sub: '', aria: 'zz' });
  });

  it('the words say ENTER, CROSS, CLICK or TAP, as Trigger Happy says R, R1, CLICK, TAP', () => {
    expect(pressWord(KEYS)).toBe('enter');
    expect(pressWord(PAD)).toBe('cross');
    expect(pressWord(MOUSE)).toBe('click');
    expect(pressWord(TOUCH)).toBe('tap');
    expect(pressWord({ device: 'pointer', pointerKind: 'pen' })).toBe('tap');
    expect(sequenceInstruction(KEYS)).toBe('enter the sequence');
    expect(sequenceInstruction(PAD)).toBe('enter the sequence');
    expect(sequenceInstruction(MOUSE)).toBe('click the sequence');
    expect(sequenceInstruction(TOUCH)).toBe('tap the sequence');
    expect(zoneInstruction(KEYS)).toBe('press enter in the gold zone');
    expect(zoneInstruction(PAD)).toBe('press cross in the gold zone');
    expect(zoneInstruction(MOUSE)).toBe('click in the gold zone');
    expect(zoneInstruction(TOUCH)).toBe('tap in the gold zone');
  });
});

// ------------------------------------------------------------- device detection

describe('which device the first frame is worded for (TriggerHappy\'s guess, then what the player just used)', () => {
  it('a touch screen, else a connected pad, else the keyboard', () => {
    expect(guessDevice()).toEqual({ device: 'keyboard', pointerKind: 'mouse' });
    stubPads([makePad().pad]);
    expect(guessDevice().device).toBe('gamepad');
    stubCoarsePointer(true);
    expect(guessDevice()).toEqual({ device: 'pointer', pointerKind: 'touch' });
  });

  it('the input the player used last wins the guess: a pad that is plugged in but not used is not believed', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    expect(guessDevice().device).toBe('gamepad'); // before any press
    const w = new RawInputWatcher(() => undefined);
    w.attach();
    pointerdown(document.body, 'mouse'); // the player clicks in the menu
    expect(lastPlayerDevice()).toEqual({ device: 'pointer', pointerKind: 'mouse' });
    expect(guessDevice()).toEqual({ device: 'pointer', pointerKind: 'mouse' });
    await tapPad(set, 0);
    expect(lastPlayerDevice()?.device).toBe('gamepad'); // then they pick the pad up
    expect(guessDevice().device).toBe('gamepad');
    pointerdown(document.body, 'touch');
    expect(guessDevice()).toEqual({ device: 'pointer', pointerKind: 'touch' });
    w.detach();
  });

  it('a synthetic key (the phone HUD sends Confirm and Back as keydown events) is a tap, not a keyboard', () => {
    const w = new RawInputWatcher(() => undefined);
    w.attach();
    pointerdown(document.body, 'touch');
    keydown('Enter'); // dispatched, so untrusted: what `phoneBattleText.sendKey` does
    expect(lastPlayerDevice()).toEqual({ device: 'pointer', pointerKind: 'touch' });
    w.detach();
  });

  it('the tracker changes the words only when the device really changes', () => {
    const changes: string[] = [];
    const t = new DeviceTracker((d) => changes.push(`${d.device}/${d.pointerKind}`));
    expect(t.current.device).toBe('keyboard');
    t.note('keyboard');
    expect(changes).toEqual([]);
    t.note('pointer', 'touch');
    t.note('pointer', 'touch');
    t.note('pointer', 'mouse');
    t.note('gamepad');
    expect(changes).toEqual(['pointer/touch', 'pointer/mouse', 'gamepad/mouse']);
  });
});

// ------------------------------------------------------------- the Bushido overlay

describe('Bushido: every input answers, and the chips say what to press (PR-0360, PR-0361)', () => {
  const SHOOTING_STAR = BUSHIDO_SEQUENCES['shooting-star']!; // triangle, circle, square, circle, left, right, cross (our estimate, GameFAQs)

  const open = (sequence: readonly string[] = SHOOTING_STAR, timerMs = 3000) => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openAuronSequence(root, { name: 'Shooting Star', timerMs, sequence: [...sequence] }).then((r) => (result = r));
    const slab = root.querySelector<HTMLElement>('.ffx-mg')!;
    const chips = (): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('[data-role="chips"] .ig-minigame__key')];
    const face = (): string[] => chips().map((c) => c.textContent ?? '');
    const subtitle = (): string => root.querySelector('.ig-minigame__subtitle')?.textContent ?? '';
    const done = (): number => chips().filter((c) => c.classList.contains('ig-minigame__key--done')).length;
    const wrong = (): number[] => chips().flatMap((c, i) => (c.classList.contains('ffx-mg-key--wrong') ? [i] : []));
    const tap = (i: number, kind = 'touch'): PointerEvent => pointerdown(chips()[i]!, kind);
    return { root, slab, chips, face, subtitle, done, wrong, tap, result: () => result };
  };

  it('on a keyboard each chip prints its key with the PlayStation symbol beside it, so K is named (round 21 could not tell)', () => {
    const o = open();
    expect(o.slab.dataset['input']).toBe('keyboard');
    expect(o.subtitle()).toBe('BUSHIDO · ENTER THE SEQUENCE');
    expect(o.face()).toEqual(['Q△', 'Esc○', 'K□', 'Esc○', '←', '→', 'Enter✕']);
    expect(o.chips().map((c) => c.dataset['btn'])).toEqual([...SHOOTING_STAR]); // the Overdrive's own order, untouched
    expect(o.chips().map((c) => c.getAttribute('aria-label'))).toEqual(['Triangle, key Q', 'Circle, key Esc', 'Square, key K', 'Circle, key Esc', 'Left', 'Right', 'Cross, key Enter']);
    expect(o.chips().every((c) => c.getAttribute('role') === 'button')).toBe(true);
  });

  it('every key the chips name, pressed for real, completes Shooting Star (a run using only what the overlay says)', async () => {
    const o = open();
    for (const label of ['Q', 'Esc', 'K', 'Esc', '←', '→', 'Enter']) {
      keydown(CODE_OF_CAP[label]!);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(1000);
    const r = o.result();
    expect(r?.kind).toBe('auron-sequence');
    if (r?.kind !== 'auron-sequence') return;
    expect(r.sequence.success).toBe(true);
    expect(r.sequence.correctInputs).toBe(7);
  });

  it('a finger: seven taps on the chips in order complete it, with the full correctInputs (the round 21 acceptance check)', async () => {
    const o = open();
    for (let i = 0; i < SHOOTING_STAR.length; i++) {
      o.tap(i, 'touch');
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(1000);
    const r = o.result();
    expect(r?.kind).toBe('auron-sequence');
    if (r?.kind !== 'auron-sequence') return;
    expect(r.sequence.success).toBe(true);
    expect(r.sequence.correctInputs).toBe(7);
    expect(r.sequence.timeRemainingMs).toBeGreaterThan(0);
  });

  it('after the first tap the words and the chips switch to a finger: TAP THE SEQUENCE, the symbols alone', () => {
    const o = open();
    o.tap(0, 'touch');
    expect(o.slab.dataset['input']).toBe('pointer');
    expect(o.subtitle()).toBe('BUSHIDO · TAP THE SEQUENCE');
    expect(o.face()).toEqual(['△', '○', '□', '○', '←', '→', '✕']);
    expect(o.done()).toBe(1);
  });

  it('a mouse: clicks complete it, the words say CLICK and the chips keep naming the keys beside the pointer', async () => {
    const o = open();
    for (let i = 0; i < SHOOTING_STAR.length; i++) {
      o.tap(i, 'mouse');
      if (i === 0) {
        expect(o.subtitle()).toBe('BUSHIDO · CLICK THE SEQUENCE');
        expect(o.face()[0]).toBe('Q△');
      }
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toMatchObject({ kind: 'auron-sequence', sequence: { success: true, correctInputs: 7 } });
  });

  it('a wrong tap is a wrong press: the missed chip flashes, the progress goes back to input 1, the attempt goes on', async () => {
    const o = open();
    o.tap(0);
    o.tap(1);
    expect(o.done()).toBe(2);
    o.tap(5); // the right arrow where input 3 (square) is expected
    expect(o.done()).toBe(0);
    expect(o.wrong()).toEqual([2]);
    await vi.advanceTimersByTimeAsync(300);
    expect(o.wrong()).toEqual([]);
    expect(o.result()).toBeUndefined();
    for (let i = 0; i < SHOOTING_STAR.length; i++) { o.tap(i); await vi.advanceTimersByTimeAsync(100); }
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toMatchObject({ kind: 'auron-sequence', sequence: { success: true, correctInputs: 7 } });
  });

  it('a tap is the press of that chip\'s BUTTON, so a second Circle chip also answers a Circle that is due', () => {
    const o = open();
    o.tap(0); // triangle
    o.tap(3); // the second circle chip: the button due is circle, so it counts
    expect(o.done()).toBe(2);
    expect(o.wrong()).toEqual([]);
  });

  it('a press on the slab but not on a chip, or with a secondary mouse button, does nothing', () => {
    const o = open();
    pointerdown(o.slab, 'touch');
    pointerdown(o.root.querySelector('.ig-minigame__title')!, 'mouse');
    pointerdown(o.chips()[0]!, 'mouse', { button: 2 });
    expect(o.done()).toBe(0);
    expect(o.wrong()).toEqual([]);
    expect(o.face()[0]).toBe('Q△'); // and it did not even count as the mouse
  });

  it('a pad: the chips are the symbols, the words say nothing about keys, and the pad presses answer', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const o = open();
    expect(o.slab.dataset['input']).toBe('gamepad');
    expect(o.face()).toEqual(['△', '○', '□', '○', '←', '→', '✕']);
    for (const index of [3, 1, 2, 1, 14, 15, 0]) await tapPad(set, index);
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toMatchObject({ kind: 'auron-sequence', sequence: { success: true, correctInputs: 7 } });
  });

  it('on a touch screen the first frame already says TAP, before any press', () => {
    stubCoarsePointer(true);
    const o = open();
    expect(o.slab.dataset['input']).toBe('pointer');
    expect(o.subtitle()).toBe('BUSHIDO · TAP THE SEQUENCE');
    expect(o.face()[0]).toBe('△');
  });

  it('the input used to reach the overlay words its first frame: a pad plugged in but a click in the menu reads CLICK', () => {
    stubPads([makePad().pad]);
    const w = new RawInputWatcher(() => undefined);
    w.attach();
    pointerdown(document.body, 'mouse');
    w.detach();
    const o = open();
    expect(o.subtitle()).toBe('BUSHIDO · CLICK THE SEQUENCE');
  });

  it('the other Bushidos keep their own order and length, each chip a button (Dragon Fang 8, Tornado 6)', async () => {
    for (const id of ['dragon-fang', 'banishing-blade', 'tornado'] as const) {
      const seq = BUSHIDO_SEQUENCES[id]!;
      const o = open(seq);
      expect(o.chips().map((c) => c.dataset['btn'])).toEqual([...seq]);
      for (let i = 0; i < seq.length; i++) { o.tap(i); await vi.advanceTimersByTimeAsync(80); }
      await vi.advanceTimersByTimeAsync(1000);
      expect(o.result()).toMatchObject({ kind: 'auron-sequence', sequence: { success: true, correctInputs: seq.length } });
      document.body.innerHTML = '';
    }
  });

  it('with no input at all it still fails only at the timer, as the Fail row with no time left (unchanged)', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(3000 + 500);
    expect(o.result()).toEqual({ kind: 'auron-sequence', sequence: { success: false, correctInputs: 0, timeRemainingMs: 0 } });
  });

  it('a tap after the attempt has settled is ignored', async () => {
    const o = open();
    for (let i = 0; i < SHOOTING_STAR.length; i++) { o.tap(i); await vi.advanceTimersByTimeAsync(60); }
    const slab = o.slab;
    const chip = o.chips()[0]!;
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toBeDefined();
    expect(() => pointerdown(chip, 'touch')).not.toThrow(); // the overlay is gone; nothing listens
    expect(slab.isConnected).toBe(false);
  });

  it('the slab takes pointer events (it is marked), and the chips are sized for a finger by the stylesheet', () => {
    const o = open();
    expect(o.slab.classList.contains('ffx-mg--tap')).toBe(true);
    expect(o.slab.classList.contains('ffx-mg--tap-slab')).toBe(false); // Bushido's answer is a chip, not the whole slab
  });
});

// ------------------------------------------------------------- the Swordplay overlay

describe('Swordplay: a tap or a click anywhere on the slab is the confirm press (PR-0360)', () => {
  // The overlay's defaults: a 360 px bar, gold zone 180 +/- 22 px, 340 px/s; dead centre 529 ms into a sweep.
  const CENTRE_MS = Math.round((180 / 340) * 1000);

  const open = () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openTidusTiming(root, { name: 'Spiral Cut', timerMs: 3000 }).then((r) => (result = r));
    const slab = root.querySelector<HTMLElement>('.ffx-mg')!;
    const bar = root.querySelector<HTMLElement>('[data-role="bar"]')!;
    const cursor = (): number => parseFloat((root.querySelector<HTMLElement>('[data-role="cursor"]')!.style.left || '0').replace('%', ''));
    const subtitle = (): string => root.querySelector('.ig-minigame__subtitle')?.textContent ?? '';
    return { root, slab, bar, cursor, subtitle, result: () => result };
  };

  it('names the control in use: PRESS ENTER on a keyboard, PRESS CROSS on a pad, TAP on a finger, CLICK on a mouse', () => {
    expect(open().subtitle()).toBe('SWORDPLAY · PRESS ENTER IN THE GOLD ZONE');
    document.body.innerHTML = '';
    stubPads([makePad().pad]);
    expect(open().subtitle()).toBe('SWORDPLAY · PRESS CROSS IN THE GOLD ZONE');
    document.body.innerHTML = '';
    delete (navigator as { getGamepads?: unknown }).getGamepads;
    stubCoarsePointer(true);
    expect(open().subtitle()).toBe('SWORDPLAY · TAP IN THE GOLD ZONE');
    document.body.innerHTML = '';
    stubCoarsePointer(false);
    const o = open();
    pointerdown(o.bar, 'mouse');
    expect(o.subtitle()).toBe('SWORDPLAY · CLICK IN THE GOLD ZONE');
  });

  it('a finger in the gold zone resolves the success, with the time left at the tap (the round 21 acceptance check)', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(CENTRE_MS);
    pointerdown(o.slab, 'touch');
    await vi.advanceTimersByTimeAsync(1000);
    const r = o.result();
    expect(r?.kind).toBe('tidus-timing');
    if (r?.kind !== 'tidus-timing') return;
    expect(r.timing.success).toBe(true);
    expect(r.timing.timerMs).toBe(3000);
    expect(r.timing.timeRemainingMs).toBeGreaterThan(3000 - CENTRE_MS - 40);
    expect(r.timing.timeRemainingMs).toBeLessThanOrEqual(3000 - CENTRE_MS + 40);
  });

  it('a click on the bar (a child of the slab) is the same press', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(CENTRE_MS);
    pointerdown(o.bar, 'mouse');
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toMatchObject({ kind: 'tidus-timing', timing: { success: true } });
  });

  it('a tap outside the zone is a miss, not a failure: the marker goes back to the far left and the sweep restarts', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(100);
    pointerdown(o.slab, 'touch');
    expect(o.cursor()).toBe(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(o.result()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(CENTRE_MS - 100); // the restarted marker is centred about now
    pointerdown(o.slab, 'touch');
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toMatchObject({ kind: 'tidus-timing', timing: { success: true } });
  });

  it('with no press at all it fails only at the timer, with no time left (unchanged)', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(3500);
    expect(o.result()).toEqual({ kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs: 3000 } });
  });

  it('a secondary mouse button does not press; Enter and a pad Cross still do', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(CENTRE_MS);
    pointerdown(o.slab, 'mouse', { button: 2 });
    expect(o.result()).toBeUndefined();
    keydown('Enter');
    await vi.advanceTimersByTimeAsync(1000);
    expect(o.result()).toMatchObject({ kind: 'tidus-timing', timing: { success: true } });

    document.body.innerHTML = '';
    const { pad, set } = makePad();
    stubPads([pad]);
    const p = open();
    await vi.advanceTimersByTimeAsync(CENTRE_MS - 40);
    await tapPad(set, 0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(p.result()).toMatchObject({ kind: 'tidus-timing', timing: { success: true } });
  });

  it('the slab is marked as a whole-slab target', () => {
    const o = open();
    expect(o.slab.classList.contains('ffx-mg--tap')).toBe(true);
    expect(o.slab.classList.contains('ffx-mg--tap-slab')).toBe(true);
  });
});

// ------------------------------------------------------------- scope

describe('only the two overlays that answer a pointer take pointer events', () => {
  it('Wakka\'s reels are not marked, so the layer keeps its `pointer-events: none` there (not part of PR-0360)', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    void openWakkaReels(root, { name: 'Slots', timerMs: 20000 });
    expect(root.querySelector('.ffx-mg')?.classList.contains('ffx-mg--tap')).toBe(false);
  });

  it('the stylesheet gives pointer events to `.ffx-mg--tap` only, and sizes the chips for a finger under `(pointer: coarse)`', () => {
    const css = readFileSync('src/ui/ffx/minigames/overdrive-minigames.css', 'utf8');
    expect(css).toMatch(/\.ig-minigame\.ffx-mg\.ffx-mg--tap\s*\{[^}]*pointer-events:\s*auto/);
    expect(css).toMatch(/touch-action:\s*manipulation/);
    // no rule that gives every `.ffx-mg` slab pointer events
    expect(css).not.toMatch(/\.ig-minigame\.ffx-mg\s*\{[^}]*pointer-events:\s*auto/);
    const coarse = css.slice(css.indexOf('@media (pointer: coarse)'));
    expect(coarse).toMatch(/min-width:\s*calc\(56px \/ var\(--lb-scale, 1\)\)/);
    expect(coarse).toMatch(/height:\s*calc\(50px \/ var\(--lb-scale, 1\)\)/);
  });
});
