import './enemy-intent-overflow.css';
import { escapeHtml } from './html.ts';

/**
 * The enemy-intent panel's MORE affordance (round 09 PR-0010).
 *
 * `src/ui/common/EnemyIntent.ts` caps its body at `MAX_HEIGHT_FRACTION` of the
 * frame (round 02 #14: an uncapped slab covered 47% of a 562px window) and,
 * past that cap, used to just fade with a 6px mask and no way to read the
 * rest. Round 09's repro: at Yunalesca turn 1 the third counter bullet — "the
 * Blind counter never fires", the rule that decides whether the fight is
 * winnable — is sliced mid-glyph at the panel edge, and the only way to reach
 * it was a mouse wheel over the panel; no key, no pad button.
 *
 * `src/ui/common/StrategyGuide.ts` already answers the identical shape of
 * question with a MORE row bound to `KeyG`, so this mirrors that affordance
 * rather than inventing a new one — a chip reporting how much is hidden, in
 * its own row below the clipped content rather than painted over it. It
 * differs from the guide in one way on purpose: the guide is read at leisure
 * and *paginates* through hidden blocks on a press; this panel is read in the
 * two seconds before a hit lands, so holding the key **expands the panel to
 * its full height** instead, and releasing it restores the cap (and the fade)
 * — nothing to page through, nothing to lose track of.
 *
 * ## Why `KeyJ`
 *
 * Checked against every binding this codebase has before picking it:
 * `src/app/Input.ts`'s `KEY_MAP` (arrows/WASD, confirm, cancel, triangle,
 * `E`/`C` for start, `M`/`V` for select, `R`/`F` for the shoulders),
 * `StrategyGuide.ts`'s `G`, `MoveAdvisor.ts`'s `N`, `SensorPanel.ts`'s `I`,
 * `src/app/screens/pause/keys.ts`'s `H`, and `TitleScreen.ts`'s `B`. None of
 * them claim `J`, in either game.
 *
 * The pad button is standard-gamepad **6** — L2 / ZL2 on a DualShock or Xbox
 * pad. `Input.ts`'s `PAD_MAP` leaves it unmapped, and no other panel polls it
 * (the panel's own toggle is button 3, the guide's is 2, the advisor's is 7).
 */
export const OVERFLOW_KEY = 'KeyJ';
export const OVERFLOW_KEY_LABEL = 'J';
export const OVERFLOW_PAD_BUTTON = 6;
export const OVERFLOW_PAD_LABEL = 'L2';

/**
 * How many of the body's rows (a bullet, a heading, a damage line, the charge
 * row) have any part of themselves past `cap`.
 *
 * Measured in `offsetTop`/`offsetHeight`, not `getBoundingClientRect`: `cap`
 * is quoted in the body's own unscaled px (see `EnemyIntent.ts`'s
 * `MAX_HEIGHT_FRACTION` comment — the panel carries a `transform: scale(...)`
 * that `getBoundingClientRect` would fold back in, but `offsetTop` does not).
 * `bodyEl` itself is unpositioned, so it shares its children's `offsetParent`
 * (the panel), which is what makes `child.offsetTop - bodyEl.offsetTop` a
 * same-reference-frame row position without needing the panel's own geometry
 * at all.
 *
 * A row counts as hidden the moment *any* of it crosses `cap` — the exact
 * defect round 09 named is a row sliced mid-glyph, not a row that has fully
 * scrolled off, so "hidden" has to mean "not fully visible", not "not visible
 * at all".
 */
export function countHiddenRows(bodyEl: HTMLElement, cap: number): number {
  const base = bodyEl.offsetTop;
  const rows = bodyEl.querySelectorAll<HTMLElement>('li, p, h4, .eint__charge');
  let hidden = 0;
  for (const row of rows) {
    if (row.offsetTop - base + row.offsetHeight > cap + 0.5) hidden++;
  }
  return hidden;
}

/**
 * The chip itself: a row appended below `.eint__body`, in normal flow rather
 * than absolutely positioned over it (the same reason `strategy-guide.css`
 * gives for `.sgd__more`) so it can never paint over the very glyph it is
 * reporting on. Owns its own key/pad listeners and DOM node; `EnemyIntent.ts`
 * only asks it to {@link EnemyIntentOverflow.sync} after computing the cap and
 * whether the body overflows it, and reads {@link EnemyIntentOverflow.expanded}
 * to decide whether to lift the cap.
 */
export class EnemyIntentOverflow {
  readonly el: HTMLDivElement;
  private heldByKey = false;
  private heldByPad = false;
  private attached = false;

  constructor() {
    // A `<div>`, not a `<button>` (round 09 repair): this row is read with
    // the bound key or pad button only — it has no click/tap handler, and
    // never will (holding is the whole design, see the class doc above), so
    // giving it button semantics and a hand cursor was itself the bug a
    // repair-pass review caught: it looked pressable on a mouse or phone and
    // did nothing. `role="status"`/`aria-live` name what it actually is, a
    // live readout, not a control.
    this.el = document.createElement('div');
    this.el.className = 'eint__more';
    this.el.dataset['role'] = 'enemy-intent-more';
    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-live', 'polite');
    this.el.hidden = true;
  }

  /** Is the body currently lifted past its cap? */
  get expanded(): boolean {
    return this.heldByKey || this.heldByPad;
  }

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    // Round 09 repair: a real `keyup` never arrives if the window loses focus
    // while the key is held (alt-tab, a devtools click, a pad rebind dialog),
    // which left the panel stuck expanded — `src/app/Input.ts` clears its own
    // held keys on `blur` for the same reason, so this mirrors that guard
    // rather than inventing a second convention for it.
    window.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.heldByKey = false;
    this.heldByPad = false;
  }

  /** Per-frame: a pad button has no `keyup`, so it is polled like the panel's own toggle. */
  pollPad(): void {
    let down = false;
    try {
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (pad?.connected && pad.buttons[OVERFLOW_PAD_BUTTON]?.pressed) down = true;
      }
    } catch {
      down = false;
    }
    this.heldByPad = down;
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== OVERFLOW_KEY || e.ctrlKey || e.metaKey || e.altKey) return;
    this.heldByKey = true;
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (e.code !== OVERFLOW_KEY) return;
    this.heldByKey = false;
  };

  private readonly onBlur = (): void => {
    this.heldByKey = false;
  };

  /**
   * Recompute the chip after `EnemyIntent.ts`'s `layout()` has set the body's
   * `max-height` for this frame. `cap` is always the *collapsed* cap (never
   * `Infinity`), so the reported count answers "how much is hidden right
   * now, if you let go" even while the key is held.
   */
  sync(bodyEl: HTMLElement, cap: number, overflowing: boolean, gamepad: boolean): void {
    this.el.classList.toggle('eint__more--expanded', this.expanded);
    if (!overflowing) {
      this.el.hidden = true;
      return;
    }
    this.el.hidden = false;
    const hidden = countHiddenRows(bodyEl, cap);
    const key = gamepad ? OVERFLOW_PAD_LABEL : OVERFLOW_KEY_LABEL;
    const verb = this.expanded ? 'showing all' : `+${hidden} more`;
    this.el.innerHTML = `<b>${escapeHtml(key)}</b><span> hold &middot; ${escapeHtml(verb)}</span>`;
  }
}
