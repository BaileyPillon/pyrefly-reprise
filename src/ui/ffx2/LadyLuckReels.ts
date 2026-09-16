import '../inkgold/index.ts';
import './minigames.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { ReelResult } from '../../battle/common/types.ts';

/**
 * Lady Luck — the reels [`ffx2-combat-core.md` §3.12, `visual-bible.md` §4.10.2]:
 * three reels spin in a **random stop order**; the player presses confirm
 * three times, one press per reel, stopping whichever reel is next in that
 * order. Pay-table interpretation (three-of-a-kind / pair / lone Cherry / Dud)
 * is the engine's job — this component only reports the three stopped
 * symbols, whether they all match, and the time left on the spin timer.
 *
 * Composes the shared Ink & Gold `.ig-minigame` shell (pink `.ig--ffx2`
 * variant) — per `presentation-ink-and-gold.md`'s note that overlays without
 * a dedicated mock "follow the Swordplay slab pattern", this reuses
 * `.ig-minigame__bar--reel`/`__reel`/`__reel--win` for the three cells.
 *
 * `createLadyLuckReels` is the fake-input core (`press()` stops the next reel
 * with no real key event needed); `mountLadyLuckReels` wires a real confirm
 * key for actual play.
 */
export interface LadyLuckHandle {
  /** Stop the next reel in the random order. No-op once all three have stopped. */
  press(): void;
  cancel(): void;
  readonly result: Promise<ReelResult>;
  readonly el: HTMLElement;
}

const DEFAULT_SYMBOLS = ['red7', 'bar', 'cherry'];
const TICK_MS = 33;

function shuffled3(rng: () => number): [number, number, number] {
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order as [number, number, number];
}

export function createLadyLuckReels(container: HTMLElement, params: Record<string, unknown>): LadyLuckHandle {
  const symbols = Array.isArray(params['symbols']) ? (params['symbols'] as string[]) : DEFAULT_SYMBOLS;
  const forcedStops = Array.isArray(params['forcedStops']) ? (params['forcedStops'] as string[]) : null;
  const forcedOrder = Array.isArray(params['stopOrder']) ? (params['stopOrder'] as number[]) : null;
  const timerMs = typeof params['timerMs'] === 'number' ? (params['timerMs'] as number) : 20000;
  const rng = typeof params['rng'] === 'function' ? (params['rng'] as () => number) : Math.random;

  const order = (forcedOrder as [number, number, number] | null) ?? shuffled3(rng);
  const stops: Array<string | null> = [null, null, null];
  let pressCount = 0;
  let done = false;
  let timer = 0;
  const start = Date.now();

  installInkGoldStyles();
  const el = document.createElement('div');
  el.className = 'ig ig--ffx2 ig-minigame ffx2-reels';
  container.appendChild(el);

  let resolveResult!: (r: ReelResult) => void;
  const result = new Promise<ReelResult>((res) => {
    resolveResult = res;
  });

  const render = (): void => {
    const nextReel = order[pressCount] ?? -1;
    const allStopped = pressCount >= 3;
    const win = allStopped && stops[0] === stops[1] && stops[1] === stops[2];
    const cells = [0, 1, 2]
      .map((i) => {
        const stopped = stops[i];
        const marker = i === nextReel ? '<div class="ffx2-reels__arrow">&#9660;</div>' : '';
        const symbol = stopped ?? symbols[i % symbols.length] ?? '?';
        return `<div class="ig-minigame__reel${win ? ' ig-minigame__reel--win' : ''}">${marker}${symbol}</div>`;
      })
      .join('');
    el.innerHTML = `
      <div class="ig-minigame__head">
        <span class="ig-minigame__title">Lady Luck</span>
        <span class="ig-minigame__subtitle">PRESS TO STOP</span>
      </div>
      <div class="ig-minigame__bar ig-minigame__bar--reel">${cells}</div>
      <div class="ffx2-reels__warn">DUD: &minus;75% PARTY HP</div>
    `;
  };
  render();

  const finish = (): void => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    const finalSymbols: [string, string, string] = [
      stops[0] ?? symbols[0] ?? '?',
      stops[1] ?? symbols[1] ?? '?',
      stops[2] ?? symbols[2] ?? '?',
    ];
    const threeOfAKind = finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2];
    const elapsed = Date.now() - start;
    window.setTimeout(() => el.remove(), 300);
    resolveResult({
      symbols: finalSymbols,
      threeOfAKind,
      timeRemainingMs: Math.max(0, timerMs - elapsed),
    });
  };

  const tick = (): void => {
    if (done) return;
    if (Date.now() - start >= timerMs) {
      // Timer ran out: snap every unstopped reel at random, like Wakka's reels.
      while (pressCount < 3) press();
      return;
    }
    timer = window.setTimeout(tick, TICK_MS);
  };
  timer = window.setTimeout(tick, TICK_MS);

  function press(): void {
    if (done || pressCount >= 3) return;
    const reelIndex = order[pressCount]!;
    const forced = forcedStops?.[pressCount];
    stops[reelIndex] = forced ?? symbols[Math.floor(rng() * symbols.length)] ?? symbols[0] ?? '?';
    pressCount++;
    render();
    if (pressCount >= 3) finish();
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ' || e.code === 'NumpadEnter') {
      e.preventDefault();
      press();
    }
  };
  window.addEventListener('keydown', onKey);

  return {
    press,
    cancel: (): void => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      el.remove();
    },
    result: result.finally(() => window.removeEventListener('keydown', onKey)),
    el,
  };
}

/** Real-play entry point used by `FFX2BattleHud.openMinigame`. */
export function mountLadyLuckReels(container: HTMLElement, params: Record<string, unknown>): Promise<ReelResult> {
  return createLadyLuckReels(container, params).result;
}
