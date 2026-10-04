import '../inkgold/index.ts';
import './minigames.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { InputSnapshot } from '../../app/Input.ts';
import { SeededRng } from '../../battle/common/rng.ts';
import type { TriggerHappyResult } from '../../battle/common/types.ts';
import { rollTriggerHappy } from '../../battle/ffx2/minigames.ts';
import { isCoarsePointer } from '../common/ControlsHint.ts';
import { RawInputWatcher, rawInputSuspended } from '../ffx/rawInput.ts';

/**
 * Gunner — Trigger Happy [`ffx2-combat-core.md` §3.1, `visual-bible.md` §4.10.1]:
 * mash the bound button within a window (1.8 / 2.2 / 2.6 s at Lv.1/2/3), one hit
 * per press, each hit self-chaining.
 *
 * Composes the shared Ink & Gold `.ig-minigame` shell (pink `.ig--ffx2`
 * variant) — no dedicated Trigger Happy mock exists, so per
 * `presentation-ink-and-gold.md`'s "Screens" note ("other minigame overlays
 * follow the Swordplay slab pattern") this reuses `.ig-minigame__ring` for
 * the countdown and `.ig-minigame__bonus` for the hit count, replacing only
 * the timing-zone bar (mash has no hit zone) with a plain drain fill.
 *
 * ## Three ways to press (FOC37-02; FFX-2 only)
 *
 * The press count decides the damage (`battle/ffx2/minigames.ts`
 * `attachedResult`, release 37), so every input a player has must be able to
 * press. The bound button is the abstract `r1` of `app/Input.ts`:
 *
 * | Input    | Route                                                        | Overlay says |
 * |----------|--------------------------------------------------------------|--------------|
 * | keyboard | `keydown` of `KeyR` / `PageDown`, the keys `Input.KEY_MAP` gives `r1` | `MASH R`     |
 * | gamepad  | button 5 (`Input.PAD_MAP` `r1`), polled by the shared `RawInputWatcher` | `MASH R1`    |
 * | pointer  | `pointerdown` on the slab: a finger (touch) or a click (mouse) | `MASH TAP` / `MASH CLICK` |
 *
 * The words follow the input the player is using: the device they last pressed
 * with, and before the first press the best guess (a touch screen, else a
 * connected pad, else the keyboard), the same guess the other HUD hints make.
 * Enter registers nothing — it is not the bound button.
 *
 * A device with no way to press in this browser (no Gamepad API for a pad, no
 * Pointer Events for a finger) never resolves to a silent 0: it takes the
 * release-36 roll (`rollTriggerHappy`, 6 to 16), the answer every human got
 * before the count was honoured.
 *
 * `createTriggerHappy` is the fake-input-friendly core: `press()` registers a
 * hit synchronously with no DOM event round-trip, which is what a unit test
 * wants. `mountTriggerHappy` is the thin real-play wrapper `FFX2BattleHud`
 * calls from `openMinigame`; the three routes above are wired by the core so
 * both see them.
 */
export interface TriggerHappyHandle {
  /** Register one hit. No-op once the window has closed. */
  press(): void;
  /** Tear down without resolving a "real" result (unmount mid-battle). */
  cancel(): void;
  readonly result: Promise<TriggerHappyResult>;
  readonly el: HTMLElement;
}

const TICK_MS = 33;
const MAX_HITS = 16;

/** The input a press came from, named as `Input.lastDevice` names them. */
type Device = InputSnapshot['lastDevice'];

/** `KeyboardEvent.code`s `src/app/Input.ts` maps to `r1`. */
const KEY_CODES: readonly string[] = ['KeyR', 'PageDown'];

/** What the overlay tells each player to press. A mouse click is a click; a finger is a tap. */
function keyWord(device: Device, pointerKind: string): string {
  if (device === 'gamepad') return 'R1';
  if (device === 'pointer') return pointerKind === 'mouse' ? 'CLICK' : 'TAP';
  return 'R';
}

function padConnected(): boolean {
  try {
    return Array.from(navigator.getGamepads?.() ?? []).some((p) => p !== null && p.connected);
  } catch {
    return false;
  }
}

export function createTriggerHappy(container: HTMLElement, params: Record<string, unknown>): TriggerHappyHandle {
  const windowMs = typeof params['windowMs'] === 'number' ? (params['windowMs'] as number) : 1800;
  const paceHits = typeof params['paceHits'] === 'number' ? (params['paceHits'] as number) : 8;

  installInkGoldStyles();
  const el = document.createElement('div');
  el.className = 'ig ig--ffx2 ig-minigame ffx2-trigger';
  container.appendChild(el);

  let hits = 0;
  let done = false;
  let timer = 0;
  const start = Date.now();
  let resolveResult!: (r: TriggerHappyResult) => void;
  const result = new Promise<TriggerHappyResult>((res) => {
    resolveResult = res;
  });

  // Which of the three inputs can press here, and which one the words name.
  const heard: Readonly<Record<Device, boolean>> = {
    keyboard: true,
    gamepad: typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function',
    pointer: typeof window.PointerEvent === 'function',
  };
  let device: Device = isCoarsePointer() ? 'pointer' : padConnected() ? 'gamepad' : 'keyboard';
  let pointerKind = isCoarsePointer() ? 'touch' : 'mouse';
  el.dataset['input'] = device;

  const CIRC = 2 * Math.PI * 21;
  const ringHtml = (remainingFrac: number): string => `
    <svg viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="21" fill="none" stroke="#0B0A12" stroke-opacity="0.15" stroke-width="5"></circle>
      <circle cx="26" cy="26" r="21" fill="none" stroke="#F7B6D9" stroke-width="5"
        stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${(CIRC * (1 - remainingFrac)).toFixed(1)}"
        stroke-linecap="butt" transform="rotate(-90 26 26)"></circle>
    </svg>`;

  const render = (remainingFrac: number): void => {
    const hot = hits >= paceHits;
    el.innerHTML = `
      <div class="ig-minigame__head">
        <span class="ig-minigame__title">Trigger Happy</span>
        <span class="ig-minigame__subtitle">MASH ${keyWord(device, pointerKind)}</span>
        <span class="ig-minigame__meter">
          <span class="ig-minigame__ring">${ringHtml(remainingFrac)}</span>
          <span class="ig-minigame__bonus${hot ? ' ffx2-trigger__bonus--hot' : ''}">${hits} HIT${hits === 1 ? '' : 'S'}</span>
        </span>
      </div>
      <div class="ig-minigame__bar ffx2-trigger__bar">
        <div class="ffx2-trigger__pace" style="left:${Math.min(100, (paceHits / MAX_HITS) * 100)}%"></div>
        <div class="ffx2-trigger__fill${hot ? ' ffx2-trigger__fill--hot' : ''}" style="width:${Math.max(0, remainingFrac * 100).toFixed(1)}%"></div>
      </div>
    `;
  };
  render(1);

  const release = (): void => {
    window.removeEventListener('keydown', onKey);
    el.removeEventListener('pointerdown', onPointer);
    pad.detach();
  };

  const finish = (): void => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    release();
    el.style.pointerEvents = 'none'; // the slab lingers 300 ms: a late tap belongs to what is under it
    window.setTimeout(() => el.remove(), 300);
    // An input with no route here never answers 0: it gets the roll every human had before the count was read.
    const unheard = hits === 0 && !heard[device];
    resolveResult({ hits: unheard ? rollTriggerHappy(new SeededRng(start)) : hits });
  };

  const tick = (): void => {
    if (done) return;
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 1 - elapsed / windowMs);
    render(remaining);
    if (elapsed >= windowMs) {
      finish();
      return;
    }
    timer = window.setTimeout(tick, TICK_MS);
  };
  timer = window.setTimeout(tick, TICK_MS);

  /** One press. `from` is the input it came from (omitted by the fake-input `press()`: the words stay as they are). */
  const press = (from?: Device): void => {
    if (done || rawInputSuspended()) return;
    if (from) device = from;
    el.dataset['input'] = device;
    hits = Math.min(MAX_HITS, hits + 1);
    const elapsed = Date.now() - start;
    render(Math.max(0, 1 - elapsed / windowMs));
    el.classList.remove('ffx2-trigger--pop');
    void el.offsetWidth;
    el.classList.add('ffx2-trigger--pop');
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (KEY_CODES.includes(e.code)) {
      e.preventDefault();
      press('keyboard');
    }
  };
  window.addEventListener('keydown', onKey);

  // A tap on the slab (or a click): `.ffx2-trigger` takes pointer events in `minigames.css`, its host layer does not.
  const onPointer = (e: PointerEvent): void => {
    if (e.pointerType) pointerKind = e.pointerType;
    e.preventDefault();
    press('pointer');
  };
  el.addEventListener('pointerdown', onPointer);

  // The pad is polled, not evented: the shared watcher reads `r1` the way `Input` does (standard button 5).
  const pad = new RawInputWatcher((b) => { if (b === 'r1') press('gamepad'); }, { keyboard: false });
  pad.attach();

  return {
    press: () => press(),
    cancel: (): void => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      release();
      el.remove();
    },
    result,
    el,
  };
}

/** Real-play entry point used by `FFX2BattleHud.openMinigame`. */
export function mountTriggerHappy(container: HTMLElement, params: Record<string, unknown>): Promise<TriggerHappyResult> {
  return createTriggerHappy(container, params).result;
}
