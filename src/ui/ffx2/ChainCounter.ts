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
 * `ffx2-hud.css`, and the reason this module reserves more room than the chip
 * appears to need.
 *
 * The first version of this file measured `el.offsetWidth/offsetHeight` — the
 * **layout** box — handed that to {@link placeSlab}, and then added
 * `.ffx2chain--pop`, which scales the chip to 1.45 about its centre on *every*
 * increment. The solver had therefore never seen the box the player sees. Live
 * at the 50% keyframe the painted slab measured 242.4x137 against a 167x95
 * layout box, sat 9.3 px above the overlay (clipped away by `.ffx2hud`'s
 * `overflow: hidden`), crossed Bahamut by 166.8x5.2 and covered the
 * enemy-intent slab by 33.8x102.8 — worse than the pre-fix state the handoff
 * recorded. It reproduced at every tier and every viewport, in both FFX-2
 * chapters, and the builder's own 40-sample matrix missed it because the pop
 * is 0.18 s of each increment and the samples landed between pops.
 *
 * The fix is structural rather than a fudge factor: the chip element is now an
 * empty box the size of the **peak**, the ink slab is an inner
 * `.ffx2chain__body` centred inside it, and the pop scales the body. So the
 * element the solver places, the element `FFX2BattleHud.intentObstacles`
 * measures as `.ffx2-chain-chip`, and the element any overlap probe reads are
 * all the same rectangle — and nothing painted can leave it at any point in
 * the animation.
 *
 * Exported so `tests/unit/ui-ffx2-chain-flourish.test.ts` can assert this
 * constant and the CSS keyframe have not drifted apart.
 */
export const CHAIN_POP_SCALE = 1.45;

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
    el.className = `ffx2-chain-chip ${chainTier(count)} ${count >= FLASH_AT ? 'ffx2chain--flash' : ''}`.replace(/\s+/g, ' ').trim();
    el.innerHTML = `
      <div class="ffx2chain__body">
        <span class="ffx2chain__n">${count}</span>
        <span class="ffx2chain__label">CHAIN <b>&times;${multiplier.toFixed(2)}</b></span>
        <span class="ffx2chain__motes">${motesHtml()}</span>
      </div>`;
    // Measure the *body* with the chip's own size cleared, so it shrink-wraps:
    // the slab's size depends on the numeral's digit count and on the scale, so
    // it cannot be known up front. Then reserve the peak box around it — see
    // CHAIN_POP_SCALE for why the layout box is not the box to place.
    el.style.width = '';
    el.style.height = '';
    const body = el.firstElementChild as HTMLElement | null;
    const bw = body?.offsetWidth ?? 0;
    const bh = body?.offsetHeight ?? 0;
    const w = Math.ceil(bw * CHAIN_POP_SCALE);
    const h = Math.ceil(bh * CHAIN_POP_SCALE);
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    // The body is centred in the reserved box, so the box sits half the reserve
    // further out on each axis than the body wants to be. Everything below is
    // expressed in the box's coordinates and the body follows it.
    const padX = (w - bw) / 2;
    const padY = (h - bh) / 2;
    const anchor = this.deps.point(targetId);
    const layer = this.deps.layer();
    const edge = 6 * scale;
    // "Top-right of the enemy being chained" (§4.6), sitting clear above the
    // head rather than across the face.
    const natural = { left: anchor.x + 12 * scale - padX, top: anchor.y - bh - 8 * scale - padY };
    const placed = placeSlab(natural, { w, h }, this.deps.obstacles(), layer, edge);
    el.style.left = `${placed.left}px`;
    el.style.top = `${placed.top}px`;
    // Restart the pop and the mote burst even when the class list did not change.
    void el.offsetWidth;
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
