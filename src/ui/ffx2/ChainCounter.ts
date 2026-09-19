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

/** How long a chip survives with no further increment. */
export const CHAIN_HOLD_MS = 1400;

/** §4.6's escalation thresholds. */
const WARM_AT = 5;
const HOT_AT = 10;
const FLASH_AT = 20;

/** §4.6 decay: "shrinks to 0.6x and fades over 0.4 s". */
const BREAK_MS = 400;

export interface ChainCounterDeps {
  /**
   * The HUD's unscaled overlay, in viewport pixels. A getter, not the element:
   * `FFX2BattleHud` builds its overlay in `mount()`, long after its fields are
   * initialised, so a captured reference would be `undefined` forever.
   */
  overlay: () => HTMLElement;
  /** Current letterbox scale. */
  scale: () => number;
  /** Where the chained enemy is, in viewport pixels. */
  point: (id: CombatantId) => { x: number; y: number };
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
    const anchor = this.deps.point(targetId);
    el.style.left = `${anchor.x + 34 * scale}px`;
    el.style.top = `${anchor.y - 22 * scale}px`;
    el.style.setProperty('--ffx2-scale', String(scale));
    el.className = `ffx2-chain-chip ${chainTier(count)} ${count >= FLASH_AT ? 'ffx2chain--flash' : ''}`.replace(/\s+/g, ' ').trim();
    el.innerHTML = `
      <span class="ffx2chain__n">${count}</span>
      <span class="ffx2chain__label">CHAIN <b>&times;${multiplier.toFixed(2)}</b></span>
      <span class="ffx2chain__motes">${motesHtml()}</span>`;
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
