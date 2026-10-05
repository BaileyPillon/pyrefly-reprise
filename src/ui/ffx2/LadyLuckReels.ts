import '../inkgold/index.ts';
import './minigames.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { InputSnapshot } from '../../app/Input.ts';
import type { ReelResult } from '../../battle/common/types.ts';
import { isCoarsePointer } from '../common/ControlsHint.ts';
import { RawInputWatcher, rawInputSuspended } from '../ffx/rawInput.ts';
import { symbolLabel, symbolSvg } from './ladyLuckSymbols.ts';
import {
  REEL_TIMER_MS,
  indexOnLine,
  layoutFrom,
  positionAt,
  snappedPosition,
  type ReelLayout,
} from './ladyLuckTiming.ts';

/**
 * Lady Luck: the reels [`ffx2-combat-core.md` §3.12, `visual-bible.md` §4.10.2], **timed by the press**.
 * **FFX-2 only.** Bailey's pick A of 2026-10-04 ("the slow strip", `docs/handoff/ladyluck-reels-a.md`).
 *
 * Each of the three reels is a strip of its six symbols in a fixed order, running at a constant rate
 * (`REEL_RATE`, 5 symbols a second, OUR ESTIMATE: no source gives these reels a rate). The player presses confirm three
 * times, one press per reel, and the press stops **the reel the pink arrow marks**, on **the symbol that is on the gold line
 * at that instant** (`ladyLuckTiming.ts`: the whole rule, pure and pinned by a test); the strip eases the last fraction of a
 * symbol onto it over 0.15 s. The stop order is random and shown by the arrow [§3.12 and the visual bible: without the marker
 * "the random order is indistinguishable from a bug"], and a safety timer (`REEL_TIMER_MS`, 12 s, OUR ESTIMATE) stops
 * every reel still running where it is. Nothing here reads the pay table: the three symbols go to the engine
 * (`ReelResult.symbols`, read left to right) and the engine decides three of a kind, a pair, a lone Cherry or the Dud, as before.
 *
 * What is random is the engine's, not the overlay's: the stop order and where each strip starts arrive on the
 * `minigame-request` (`params.stopOrder`, `params.phases`, drawn from the seeded stream, `src/battle/ffx2/minigames.ts`),
 * so the only thing a player's hands change is *when* they press. An overlay opened without them (a unit test, a bare mount)
 * draws them from `params.rng`, else `Math.random`.
 *
 * ## Three ways to press (FFX-2 only; the same three Trigger Happy has)
 *
 * The bound button is the abstract `confirm` of `app/Input.ts`:
 *
 * | Input    | Route                                                                          | Overlay says     |
 * |----------|--------------------------------------------------------------------------------|------------------|
 * | keyboard | `keydown` of Enter, NumpadEnter, Space or Z, the keys `Input.KEY_MAP` gives `confirm` | `PRESS ENTER TO STOP` |
 * | gamepad  | button 0, polled by the shared `RawInputWatcher` (`Input.PAD_MAP` `confirm`)     | `PRESS CROSS TO STOP` |
 * | pointer  | `pointerdown` on the slab: a finger (touch) or a click (mouse)                   | `TAP TO STOP` / `CLICK TO STOP` |
 *
 * (The game's own words for the confirm button: Enter on a keyboard, Cross on a pad, `ControlsHint.PAUSE_HINTS`.) The words
 * follow the input the player is using: the device they last pressed with, and before the first press the best guess
 * (a touch screen, else a connected pad, else the keyboard).
 *
 * The instant of a press is the event's own timestamp where the browser gives one (the moment the key went down, not the
 * moment this handler got to run), else the clock now. While the pause is open (`rawInputSuspended`) the reels and the timer
 * stand still and a press counts nothing, so a pause can neither cost a spin nor line one up.
 *
 * `createLadyLuckReels` is the fake-input core (`press()` stops the next reel with no real event needed, `press(atMs)`
 * names the instant; `params.now` replaces the clock); `mountLadyLuckReels` wires it for real play.
 */
export interface LadyLuckHandle {
  /**
   * Stop the next reel in the stop order. `atMs` names the instant, in ms since the spin began (the headless player and the
   * tests); omitted, it is now. No-op once all three have stopped.
   */
  press(atMs?: number): void;
  cancel(): void;
  readonly result: Promise<ReelResult>;
  readonly el: HTMLElement;
}

const DEFAULT_SYMBOLS = ['red7', 'bar', 'cherry'];
const TICK_MS = 33;
/** How long the slab stays up after the last stop, so the last strip's snap and the line it landed on are seen. */
const LINGER_MS = 300;
/** The centre symbol sits at this many cells from the top of a window 1.9 cells high (minigames.css `--reel-mid`). */
const MID = 0.45;

/** The input a press came from, named as `Input.lastDevice` names them. */
type Device = InputSnapshot['lastDevice'];

/** `KeyboardEvent.code`s `src/app/Input.ts` maps to `confirm`. */
const KEY_CODES: readonly string[] = ['Enter', 'NumpadEnter', 'Space', 'KeyZ'];

/** What the overlay tells each player to press. A mouse click is a click; a finger is a tap. */
function promptWord(device: Device, pointerKind: string): string {
  if (device === 'gamepad') return 'PRESS CROSS';
  if (device === 'pointer') return pointerKind === 'mouse' ? 'CLICK' : 'TAP';
  return 'PRESS ENTER';
}

function padConnected(): boolean {
  try {
    return Array.from(navigator.getGamepads?.() ?? []).some((p) => p !== null && p.connected);
  } catch {
    return false;
  }
}

/** The signed distance from `x` to the nearest copy of cell `k` on a strip of `n`, in cells: -n/2 up to n/2. */
function wrapped(x: number, k: number, n: number): number {
  return ((((x - k) % n) + n + n / 2) % n) - n / 2;
}

export function createLadyLuckReels(container: HTMLElement, params: Record<string, unknown>): LadyLuckHandle {
  const strip = Array.isArray(params['symbols']) && params['symbols'].length > 0 ? (params['symbols'] as string[]) : DEFAULT_SYMBOLS;
  const n = strip.length;
  const timerMs = typeof params['timerMs'] === 'number' ? (params['timerMs'] as number) : REEL_TIMER_MS;
  const rng = typeof params['rng'] === 'function' ? (params['rng'] as () => number) : Math.random;
  const clock =
    typeof params['now'] === 'function'
      ? (params['now'] as () => number)
      : (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const layout: ReelLayout = layoutFrom(params, rng, n);

  const stops: Array<string | null> = [null, null, null];
  /** Where each strip was, in symbols, the instant its reel was stopped; the snap starts from there. */
  const stoppedX: number[] = [0, 0, 0];
  /** How far into the spin (ms, pause excluded) each reel was stopped. */
  const stoppedAt: number[] = [0, 0, 0];
  let pressCount = 0;
  let done = false;
  let expired = false;
  let timer = 0;
  let raf = 0;
  /** True until the slab comes off the field: the painter runs while it is up, including the linger after the last stop. */
  let alive = true;

  const start = clock();
  // The pause stops the spin's clock: `elapsedAt` is the time the reels have actually run.
  let pausedSince: number | null = null;
  let pausedTotal = 0;
  const syncPause = (at: number): void => {
    if (rawInputSuspended()) pausedSince ??= at;
    else if (pausedSince !== null) {
      pausedTotal += at - pausedSince;
      pausedSince = null;
    }
  };
  const elapsedAt = (at: number): number => Math.max(0, (pausedSince ?? at) - start - pausedTotal);

  installInkGoldStyles();
  const el = document.createElement('div');
  el.className = 'ig ig--ffx2 ig-minigame ffx2-reels';
  el.dataset['t0'] = start.toFixed(2);
  el.dataset['layout'] = JSON.stringify({ strip, stopOrder: layout.stopOrder, phases: layout.phases, timerMs });
  container.appendChild(el);

  let resolveResult!: (r: ReelResult) => void;
  const result = new Promise<ReelResult>((res) => {
    resolveResult = res;
  });

  // Which of the three inputs can press here, and which one the words name.
  let device: Device = isCoarsePointer() ? 'pointer' : padConnected() ? 'gamepad' : 'keyboard';
  let pointerKind = isCoarsePointer() ? 'touch' : 'mouse';
  el.dataset['input'] = device;

  const cells = strip.map((id) => `<div class="ffx2-reels__cell" data-symbol="${id}">${symbolSvg(id)}</div>`).join('');
  const reelHtml = [0, 1, 2]
    .map(
      (i) => `<div class="ffx2-reels__reel" data-reel="${i}">
        <div class="ffx2-reels__arrow" aria-hidden="true">&#9660;</div>
        <div class="ffx2-reels__win" role="img" aria-label="Reel ${i + 1}">${cells}<div class="ffx2-reels__line"></div></div>
      </div>`,
    )
    .join('');
  el.innerHTML = `
    <div class="ig-minigame__head">
      <span class="ig-minigame__title">Lady Luck</span>
      <span class="ig-minigame__subtitle"></span>
    </div>
    <div class="ffx2-reels__time" aria-hidden="true"><i></i></div>
    <div class="ig-minigame__bar ig-minigame__bar--reel">${reelHtml}</div>
    <div class="ffx2-reels__warn">DUD: &minus;75% PARTY HP</div>
  `;
  const subtitle = el.querySelector<HTMLElement>('.ig-minigame__subtitle')!;
  const timeFill = el.querySelector<HTMLElement>('.ffx2-reels__time > i')!;
  const reelEls = Array.from(el.querySelectorAll<HTMLElement>('.ffx2-reels__reel'));
  const cellEls = reelEls.map((r) => Array.from(r.querySelectorAll<HTMLElement>('.ffx2-reels__cell')));
  const lineAttr = reelEls.map(() => '');

  const words = (): void => {
    subtitle.textContent = `${promptWord(device, pointerKind)} TO STOP`;
    el.dataset['input'] = device;
  };
  words();

  /** The reel the next press stops, or -1 once all three have. */
  const nextReel = (): number => (pressCount < 3 ? layout.stopOrder[pressCount]! : -1);

  /** Where reel `i`'s strip is drawn at `elapsedMs`: running, or settling onto the symbol its press picked. */
  const drawnX = (i: number, elapsedMs: number): number =>
    stops[i] === null ? positionAt(layout.phases[i]!, elapsedMs) : snappedPosition(stoppedX[i]!, elapsedMs - stoppedAt[i]!);

  const paint = (): void => {
    const at = clock();
    syncPause(at);
    const elapsedMs = elapsedAt(at);
    const next = nextReel();
    for (let i = 0; i < 3; i++) {
      const x = drawnX(i, elapsedMs);
      const cs = cellEls[i]!;
      for (let k = 0; k < n; k++) {
        const off = wrapped(x, k, n);
        const cell = cs[k]!;
        cell.style.transform = `translateY(calc(var(--reel-cell) * ${(MID + off).toFixed(4)}))`;
        cell.style.opacity = Math.max(0.12, 1 - 0.55 * Math.abs(off)).toFixed(3);
      }
      const online = strip[indexOnLine(x, n)] ?? '';
      if (lineAttr[i] !== online) {
        lineAttr[i] = online;
        reelEls[i]!.dataset['sym'] = online;
      }
      reelEls[i]!.classList.toggle('ffx2-reels__reel--armed', !done && i === next);
    }
    timeFill.style.width = `${Math.min(100, (elapsedMs / timerMs) * 100).toFixed(2)}%`;
  };

  const request = (cb: () => void): number =>
    typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(cb) : window.setTimeout(cb, 16);
  const unrequest = (id: number): void => {
    if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id);
    else window.clearTimeout(id);
  };
  const frame = (): void => {
    raf = 0;
    if (!alive) return;
    paint();
    raf = request(frame);
  };
  /** Take the slab off the field and stop painting it. */
  const remove = (): void => {
    alive = false;
    if (raf) unrequest(raf);
    raf = 0;
    el.remove();
  };

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
    el.style.pointerEvents = 'none'; // the slab lingers: a late tap belongs to what is under it
    el.dataset['armed'] = '';
    const finalSymbols: [string, string, string] = [stops[0] ?? strip[0]!, stops[1] ?? strip[0]!, stops[2] ?? strip[0]!];
    const threeOfAKind = finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2];
    el.classList.toggle('ffx2-reels--three', threeOfAKind);
    el.dataset['stops'] = finalSymbols.join(',');
    reelEls.forEach((r, i) => {
      r.dataset['state'] = 'stopped';
      r.querySelector('.ffx2-reels__win')!.setAttribute('aria-label', `Reel ${i + 1}: ${symbolLabel(finalSymbols[i]!)}`);
    });
    window.setTimeout(remove, LINGER_MS);
    const at = clock();
    syncPause(at);
    resolveResult({
      symbols: finalSymbols,
      threeOfAKind,
      timeRemainingMs: expired ? 0 : Math.max(0, timerMs - elapsedAt(at)),
    });
  };

  /** Stop reel `i` at `elapsedMs` into the spin, on whatever symbol is on the line then. */
  const stopReel = (i: number, elapsedMs: number): void => {
    const x = positionAt(layout.phases[i]!, elapsedMs);
    stops[i] = strip[indexOnLine(x, n)] ?? strip[0]!;
    stoppedX[i] = x;
    stoppedAt[i] = elapsedMs;
    reelEls[i]!.dataset['state'] = 'stopped';
    reelEls[i]!.dataset['sym'] = stops[i]!;
    reelEls[i]!.dataset['at'] = elapsedMs.toFixed(1); // the instant it was stopped, ms into the spin: what the browser checks read back
    lineAttr[i] = stops[i]!;
    pressCount++;
    el.dataset['armed'] = String(nextReel() >= 0 ? nextReel() : '');
  };

  /**
   * One press. `from` is the input it came from (omitted by the fake-input `press()`: the words stay as they are);
   * `instant` is the clock reading it happened at (the event's own timestamp where there is one), `atMs` an explicit
   * elapsed time (the headless player).
   */
  const press = (from?: Device, instant?: number, atMs?: number): void => {
    if (done || pressCount >= 3 || rawInputSuspended()) return;
    if (from) {
      device = from;
      words();
    }
    const at = instant ?? clock();
    syncPause(at);
    stopReel(layout.stopOrder[pressCount]!, atMs ?? elapsedAt(at));
    if (pressCount >= 3) finish();
  };

  /** A browser event's own time, when it is on this clock and recent; else the clock now. */
  const instantOf = (e: Event): number => {
    const now = clock();
    const ts = e.timeStamp;
    return typeof ts === 'number' && ts >= start && ts <= now && now - ts < 250 ? ts : now;
  };

  /** The safety timer: every reel still running stops where it is, at the moment the time ran out, not when this noticed. */
  const expire = (): void => {
    if (done) return;
    expired = true;
    while (pressCount < 3) stopReel(layout.stopOrder[pressCount]!, timerMs);
    finish();
  };

  const tick = (): void => {
    if (done) return;
    const at = clock();
    syncPause(at);
    if (pausedSince === null && elapsedAt(at) >= timerMs) {
      expire();
      return;
    }
    timer = window.setTimeout(tick, TICK_MS);
  };
  timer = window.setTimeout(tick, TICK_MS);

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (KEY_CODES.includes(e.code)) {
      e.preventDefault();
      press('keyboard', instantOf(e));
    }
  };
  window.addEventListener('keydown', onKey);

  // A tap on the slab (or a click): `.ffx2-reels` takes pointer events in `minigames.css`, its host layer does not.
  const onPointer = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType) pointerKind = e.pointerType;
    e.preventDefault();
    press('pointer', instantOf(e));
  };
  el.addEventListener('pointerdown', onPointer);

  // The pad is polled, not evented: the shared watcher reads `confirm` the way `Input` does (standard button 0).
  const pad = new RawInputWatcher((b) => { if (b === 'confirm') press('gamepad'); }, { keyboard: false });
  pad.attach();

  el.dataset['armed'] = String(nextReel());
  paint();
  raf = request(frame);

  return {
    press: (atMs?: number) => press(undefined, undefined, atMs),
    cancel: (): void => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      release();
      remove();
    },
    result,
    el,
  };
}

/** Real-play entry point used by `FFX2BattleHud.openMinigame`. */
export function mountLadyLuckReels(container: HTMLElement, params: Record<string, unknown>): Promise<ReelResult> {
  return createLadyLuckReels(container, params).result;
}
