import '../inkgold/index.ts';
import './minigames.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { TriggerHappyResult } from '../../battle/common/types.ts';

/**
 * Gunner — Trigger Happy [`ffx2-combat-core.md` §3.1, `visual-bible.md` §4.10.1]:
 * mash the bound key within a window (1.8 / 2.2 / 2.6 s at Lv.1/2/3), one hit
 * per press, each hit self-chaining.
 *
 * Composes the shared Ink & Gold `.ig-minigame` shell (pink `.ig--ffx2`
 * variant) — no dedicated Trigger Happy mock exists, so per
 * `presentation-ink-and-gold.md`'s "Screens" note ("other minigame overlays
 * follow the Swordplay slab pattern") this reuses `.ig-minigame__ring` for
 * the countdown and `.ig-minigame__bonus` for the hit count, replacing only
 * the timing-zone bar (mash has no hit zone) with a plain drain fill.
 *
 * `createTriggerHappy` is the fake-input-friendly core: `press()` registers a
 * hit synchronously with no DOM event round-trip, which is what a unit test
 * wants. `mountTriggerHappy` is the thin real-play wrapper `FFX2BattleHud`
 * calls from `openMinigame`, adding a real keydown listener bound to the same
 * key `Input.ts` maps to `r1` (`KeyR` / `PageDown`).
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
        <span class="ig-minigame__subtitle">MASH R1</span>
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

  const finish = (): void => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    window.removeEventListener('keydown', onKey);
    window.setTimeout(() => el.remove(), 300);
    resolveResult({ hits });
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

  const press = (): void => {
    if (done) return;
    hits = Math.min(MAX_HITS, hits + 1);
    const elapsed = Date.now() - start;
    render(Math.max(0, 1 - elapsed / windowMs));
    el.classList.remove('ffx2-trigger--pop');
    void el.offsetWidth;
    el.classList.add('ffx2-trigger--pop');
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (e.code === 'KeyR' || e.code === 'PageDown') {
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
    result,
    el,
  };
}

/** Real-play entry point used by `FFX2BattleHud.openMinigame`. */
export function mountTriggerHappy(container: HTMLElement, params: Record<string, unknown>): Promise<TriggerHappyResult> {
  return createTriggerHappy(container, params).result;
}
