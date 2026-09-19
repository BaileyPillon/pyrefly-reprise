/**
 * The FFX-2 chain counter — `research/visual-bible.md` §4.6.
 *
 * Split out of `FFX2BattleHud` (already well over the project's 400-line cap)
 * when the chip was brought to spec. What shipped before was a single rotated
 * tag reading `CHAIN ×2.00`: the *multiplier*, on one line, with no numeral and
 * no `CHAIN` label. §4.6 asks for a **big numeral with the word CHAIN beneath
 * it**, a scale-pop and a burst of petal-motes on every increment, three
 * escalation tiers, and a decay when the chain breaks. All of that is here.
 *
 * The multiplier has not been thrown away — it rides along on the label as
 * `CHAIN ×2.00`, because the count is what the spec draws big but the
 * multiplier is what the player is actually buying with it.
 *
 * **FFX-2 only.** FFX has no chain mechanic and emits no `chain` event.
 *
 * Like the damage numerals, this lives on the HUD's *unscaled* overlay and
 * every size is quoted in the 640x360 design grid then multiplied by the
 * letterbox scale, so it matches the chrome at any viewport.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import { placeSlab, type SlabRect } from './intentPlacement.ts';

/** How long a chip survives with no further increment. */
export const CHAIN_HOLD_MS = 1400;

/** §4.6's escalation thresholds. */
const WARM_AT = 5;
const HOT_AT = 10;
const FLASH_AT = 20;

/** §4.6 decay: "shrinks to 0.6x and fades over 0.4 s". */
const BREAK_MS = 400;

/**
 * §4.6's pop peak — the `scale()` at 50% of `@keyframes ffx2-chain-pop` in
 * `ffx2-hud.css`.
 *
 * ## Why this number is here at all
 *
 * The first version of this file measured `el.offsetWidth/offsetHeight` — the
 * **layout** box — handed that to {@link placeSlab}, and then added
 * `.ffx2chain--pop`, which scales the chip to 1.45 about its centre on *every*
 * increment. The solver had therefore never seen the box the player sees. Live
 * at the 50% keyframe the painted slab measured 242.4x137 against a 167x95
 * layout box and sat 9.3 px above the overlay, clipped away by `.ffx2hud`'s
 * `overflow: hidden`.
 *
 * ## Why reserving the whole peak was the wrong answer
 *
 * The next version made the chip an empty box the size of the peak with the
 * slab centred inside it. That box is 2.1x the slab's area and it is reserved
 * for the whole 1.4 s hold, not just the 0.18 s of the pop, and because it is
 * centred its **bottom** lands `0.225 * bh - 8 * scale` px *below* the head it
 * anchors to. The chained enemy therefore became an obstacle to the chip's own
 * anchor, and {@link placeSlab} — which only ever searches downward — evicted
 * the counter to the far side of the stage: measured 116.8 px below Bahamut's
 * head and 333 px to its left at 1280x720, 229 px and 661 px at 2560x1440, in
 * 32 of 32 probe cells. A chain counter that is not beside the enemy it counts
 * has stopped doing its job, and §4.6 is explicit that it is anchored
 * "top-right of the enemy being chained".
 *
 * ## What happens now
 *
 * The chip is the slab: {@link placeSlab} solves for the **layout** box, so the
 * anchor is the one §4.6 asks for. The 0.18 s peak is allowed to overhang, and
 * {@link choosePopOrigin} picks the `transform-origin` that makes it overhang
 * into whatever room there is — never off the overlay (the clipping the critic
 * photographed stays fixed, and is asserted), and over as little of the board
 * as the geometry allows. At 1280x720 the peak is 137 px tall against 107 px of
 * headroom above Bahamut's head, so *some* transient overhang is arithmetic,
 * not a choice; where it goes is the choice.
 *
 * Exported so `tests/unit/ui-ffx2-chain-flourish.test.ts` can assert this
 * constant and the CSS keyframe have not drifted apart.
 */
export const CHAIN_POP_SCALE = 1.45;

/** The `transform-origin` fractions {@link choosePopOrigin} may pick from. */
const ORIGIN_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

function rectOverlap(a: SlabRect, b: SlabRect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * The box the slab paints at the 50% keyframe, given a `transform-origin`.
 *
 * Scaling by `s` about a fraction `f` of the box keeps the point at `f` still,
 * so the box grows by `(s - 1) * size * f` on the near side and
 * `(s - 1) * size * (1 - f)` on the far one.
 */
export function popPeakRect(
  box: { left: number; top: number; w: number; h: number },
  origin: { x: number; y: number },
): SlabRect {
  const gx = (CHAIN_POP_SCALE - 1) * box.w;
  const gy = (CHAIN_POP_SCALE - 1) * box.h;
  return {
    left: box.left - gx * origin.x,
    right: box.left + box.w + gx * (1 - origin.x),
    top: box.top - gy * origin.y,
    bottom: box.top + box.h + gy * (1 - origin.y),
  };
}

/**
 * Where to grow from, so the pop is not clipped and covers as little as it can.
 *
 * Leaving the overlay is weighted far above covering a panel because the
 * overlay clips (`.ffx2hud { overflow: hidden }`): a peak that leaves it is not
 * drawn at all, which is the defect the pass-1 critic photographed. Ties go to
 * the centre, which is what §4.6 draws when there is room for it.
 *
 * Pure, and exported, so the placement can be asserted without a browser.
 */
export function choosePopOrigin(
  box: { left: number; top: number; w: number; h: number },
  obstacles: readonly SlabRect[],
  layer: { width: number; height: number },
): { x: number; y: number } {
  const frame: SlabRect = { left: 0, top: 0, right: layer.width, bottom: layer.height };
  const peakArea = box.w * box.h * CHAIN_POP_SCALE * CHAIN_POP_SCALE;
  let best = { x: 0.5, y: 0.5 };
  let bestScore = Infinity;
  for (const y of ORIGIN_STEPS) {
    for (const x of ORIGIN_STEPS) {
      const peak = popPeakRect(box, { x, y });
      const outside = peakArea - rectOverlap(peak, frame);
      let cover = 0;
      for (const o of obstacles) cover += rectOverlap(peak, o);
      const score = outside * 1000 + cover + (Math.abs(x - 0.5) + Math.abs(y - 0.5));
      if (score >= bestScore) continue;
      bestScore = score;
      best = { x, y };
    }
  }
  return best;
}

export interface ChainCounterDeps {
  /**
   * The HUD's unscaled overlay, in viewport pixels. A getter, not the element:
   * `FFX2BattleHud` builds its overlay in `mount()`, long after its fields are
   * initialised, so a captured reference would be `undefined` forever.
   */
  overlay: () => HTMLElement;
  /** Current letterbox scale. */
  scale: () => number;
  /** Where the chained enemy's head is, in viewport pixels. */
  point: (id: CombatantId) => { x: number; y: number };
  /**
   * Everything on the board the chip may not cover, in viewport pixels — the
   * HUD's own panels and every living fighter, minus the chip itself.
   *
   * §4.6 anchors the popup to the enemy, which was fine when it was an 11 px
   * tag; at §4.6's real size (a 28 px numeral over a 10 px label, ~50 grid px
   * tall) the same anchor puts it across the boss and across the enemy-intent
   * slab. It keeps its anchor when the spot is free and steps aside when it is
   * not, using the same solver the intent slab steers with.
   */
  obstacles: () => readonly SlabRect[];
  /** The overlay's own size in viewport pixels. */
  layer: () => { width: number; height: number };
}

/** The escalation class for a chain length, per §4.6. */
export function chainTier(count: number): string {
  if (count >= HOT_AT) return 'ffx2chain--hot';
  if (count >= WARM_AT) return 'ffx2chain--warm';
  return '';
}

export class ChainCounter {
  private hideTimer = 0;
  private el: HTMLElement | null = null;

  constructor(private readonly deps: ChainCounterDeps) {}

  /**
   * Draw the chain at `count`. `count <= 0` means the chain broke, which §4.6
   * gives its own decay rather than a silent removal — the player needs to see
   * that they lost it, since the multiplier they were building went with it.
   */
  show(targetId: CombatantId, count: number, multiplier: number): void {
    window.clearTimeout(this.hideTimer);
    if (count <= 0) {
      this.break_();
      return;
    }
    const scale = this.deps.scale();
    if (!this.el) {
      this.el = document.createElement('div');
      this.deps.overlay().appendChild(this.el);
    }
    const el = this.el;
    // §4.6 anchors the popup "top-right of the enemy being chained". The offset
    // scales with the stage so it stays put at any viewport size, and it clears
    // the damage numerals' own ladder — which climbs up and to the *right* from
    // the chest anchor (`damageLadder.computeHitOffset`) — by starting above
    // the head instead of level with the hits.
    el.style.setProperty('--ffx2-scale', String(scale));
    // The tier is on before the measurement (it changes no metrics, but nothing
    // here should depend on that); `--pop` and `--flash` are deliberately left
    // off until after the reflow below, because re-assigning a class list that
    // already carries them restarts nothing and both are per-increment
    // animations. See the flash note in `ffx2-hud.css`.
    el.className = `ffx2-chain-chip ${chainTier(count)}`.trim();
    el.innerHTML = `
      <div class="ffx2chain__body">
        <span class="ffx2chain__n">${count}</span>
        <span class="ffx2chain__label">CHAIN <b>&times;${multiplier.toFixed(2)}</b></span>
        <span class="ffx2chain__motes">${motesHtml()}</span>
      </div>`;
    // Measure the *body* with the chip's own size cleared, so it shrink-wraps:
    // the slab's size depends on the numeral's digit count and on the scale, so
    // it cannot be known up front.
    el.style.width = '';
    el.style.height = '';
    const body = el.firstElementChild as HTMLElement | null;
    const bw = body?.offsetWidth ?? 0;
    const bh = body?.offsetHeight ?? 0;
    el.style.width = `${bw}px`;
    el.style.height = `${bh}px`;
    const anchor = this.deps.point(targetId);
    const layer = this.deps.layer();
    const obstacles = this.deps.obstacles();
    const edge = 6 * scale;
    // "Top-right of the enemy being chained" (§4.6), sitting clear above the
    // head rather than across the face. The box handed to the solver is the
    // slab's own layout box — see CHAIN_POP_SCALE for why reserving the peak
    // instead cost the counter its anchor.
    const natural = { left: anchor.x + 12 * scale, top: anchor.y - bh - 8 * scale };
    const placed = placeSlab(natural, { w: bw, h: bh }, obstacles, layer, edge);
    el.style.left = `${placed.left}px`;
    el.style.top = `${placed.top}px`;
    // Grow the pop into whatever room the placement left, never off the overlay.
    const origin = choosePopOrigin({ left: placed.left, top: placed.top, w: bw, h: bh }, obstacles, layer);
    el.style.setProperty('--ffx2-ox', `${origin.x * 100}%`);
    el.style.setProperty('--ffx2-oy', `${origin.y * 100}%`);
    // Restart the pop, the mote burst and the flash on every increment.
    void el.offsetWidth;
    if (count >= FLASH_AT) el.classList.add('ffx2chain--flash');
    el.classList.add('ffx2chain--pop');
    this.hideTimer = window.setTimeout(() => this.break_(), CHAIN_HOLD_MS);
  }

  /** Tear the chip down, decay animation and all. */
  private break_(): void {
    const el = this.el;
    if (!el) return;
    this.el = null;
    // Drops `.ffx2-chain-chip` entirely: see the CSS note on `.ffx2chain-broke`.
    // The counter is gone the instant the chain is, and what is left on screen
    // for 0.4 s is only its decay.
    el.className = 'ffx2chain-broke';
    window.setTimeout(() => el.remove(), BREAK_MS);
  }

  /** Drop the chip immediately — for `unmount`, where no animation can finish. */
  dispose(): void {
    window.clearTimeout(this.hideTimer);
    this.el?.remove();
    this.el = null;
  }
}

/** §4.6: "a ring of 6 petal-motes bursts outward" on each increment. */
function motesHtml(): string {
  return Array.from({ length: 6 }, (_, i) => `<i style="--ffx2-a:${(i * 360) / 6}deg"></i>`).join('');
}
