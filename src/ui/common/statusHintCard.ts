/**
 * Status display O3 (Bailey's pick, 2026-09-29): **the guide card's cure hint** — "GUIDE [ZOMBIE]
 * Healing turns into damage on a Zombie, and a Phoenix Down would KO him outright. Holy Water or a
 * Remedy cures it; Esuna does not." (the approved `options/o3-*.jpg`).
 *
 * While a decision is open and a living party member carries a status with a sourced rule
 * (`statusWords.ts`: FFX Zombie, Sleep, Silence, Curse; FFX-2 Sleep, Silence, Curse), the card says
 * the rule. The mockup shows it in the strategy guide's slot with the guide folded (G); with the
 * guide open it rides at the top of the guide's own panel, so the guide's fit counts it as chrome
 * (`StrategyGuide.refit`) and the two never overlap. No guide for the encounter: it stands alone.
 *
 * Game case: both, each game's own cure table (rule 14). A status with no sourced rule: no card.
 *
 * PR-0282 (critic round 18): it is coaching, so it follows BATTLE HELP like the other coaching
 * surfaces (off: no card). On the upright phone it never covers a command row or the TIP line:
 * at the command menu it docks just above the party chips, at the target step under the target
 * card (the mockup's order). On the desktop FFX HUD the move advisor's solver treats the card
 * as an obstacle (`hudAvoidSelectors.ts`), so the NEXT BEST MOVE card moves down, never under it.
 *
 * Round 18b. PR-0303 (FFX phone): under the target card only when it fits above the target step's
 * "Tap another ally to switch" line; otherwise the command menu's slot above the party chips, so it
 * never covers that line or CONFIRM. PR-0304 (FFX-2 desktop, guide open): FFX-2's ATB plays actions
 * while a menu is open, and A-15's fade (`ui/ffx2/actionFade.ts`) takes the guide's stack, and the
 * hint in it, to opacity 0. While it is faded a solo copy stands in the hint's own stage slot (the
 * guide-folded slot); the copy in the guide keeps its place, so the guide's fit never moves.
 * PR-0302 repair (desktop, guide open): where the 14-px floor makes the in-guide card push the
 * guide's column over a command row (FFX at 1280 px wide), the card carries the rule's one-sentence
 * form for that card ({@link guideOverCommands}); TEXT SIZE no longer multiplies the floor in the guide.
 */

import type { BattleState, CombatantId, StatusId } from '../../battle/common/types.ts';
import type { StatusGame } from './statusLooks.ts';
import { cureHint, hintStatuses, type CureHint } from './statusWords.ts';
import { battleHelpOn } from '../coach/coachState.ts';

/** Phone: the gap kept between the card and what it docks against, CSS px. */
const PHONE_GAP = 6;
/** FFX-2's A-15 fade class (`ui/ffx2/actionFade.ts` ACTION_FADE_CLASS; pinned by status-o3-hint-place.test.ts). */
export const GUIDE_FADE_CLASS = 'ffx2-actfade';

/** The hints a party carries now, most alarming status first, then party order. Pure. */
export function partyHints(game: StatusGame, state: BattleState | null, partyIds?: readonly CombatantId[]): CureHint[] {
  if (!state || state.result) return [];
  const ids = partyIds ?? Object.keys(state.combatants).filter((id) => state.combatants[id]?.side === 'party');
  const out: CureHint[] = [];
  for (const status of hintStatuses(game)) {
    for (const id of ids) {
      const c = state.combatants[id];
      if (!c || !c.alive || c.removed || c.side !== 'party') continue;
      if (!c.statuses[status as StatusId]) continue;
      const hint = cureHint(game, status, c.name, id);
      if (hint) out.push(hint);
    }
  }
  return out;
}

/** The card's inner HTML: the first hint in full, a second one short. Phone: the first, short. Pure. */
export function hintCardHtml(hints: readonly CureHint[], phone: boolean): string {
  const first = hints[0];
  if (!first) return '';
  const body = phone ? first.short : hints[1] ? `${first.html} ${hints[1].short}` : first.html;
  return `<div class="sthint__head">GUIDE <i>${first.label}</i></div><div class="sthint__body">${body}</div>`;
}

/** The clearance kept between the guide's column and the first command row under it, CSS px. */
export const GUIDE_CMD_GAP = 0;

/**
 * PR-0302 repair: does the guide's column (its slab, which can run past the stack's max-height, and
 * the MORE row) reach within {@link GUIDE_CMD_GAP} of a command row it sits over? Rendered rects,
 * so TEXT SIZE's `scale` and the stage's letterbox scale are both counted. Every command row in the
 * stage, open submenus included; a box with no layout (jsdom, hidden) never counts.
 *
 * U2 (PR-0291, FFX only): the command window's help slab (`.ffx-cmd-info`, the red Zombie warning
 * while one is aimed) counts as a row. It sits between the guide and the stack, and the guide's
 * first block shows whatever its chrome, so the full-size card pushed that block's NEXT line under
 * the slab at 1600x900.
 */
export function guideOverCommands(guide: HTMLElement, stage: HTMLElement): boolean {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const el of guide.querySelectorAll<HTMLElement>('.sgd__stack, .sgd__panel, .sgd__more')) {
    if (el.hidden) continue;
    const r = el.getBoundingClientRect();
    if (!(r.height > 0)) continue;
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
  }
  if (bottom === -Infinity) return false;
  for (const row of stage.querySelectorAll<HTMLElement>('.ig-cmd, .ffx-cmd-info')) {
    const r = row.getBoundingClientRect();
    if (!(r.height > 0) || r.right <= left || r.left >= right) continue;
    if (r.bottom > top && r.top < bottom + GUIDE_CMD_GAP) return true;
  }
  return false;
}

export class StatusHintCard {
  readonly el: HTMLElement;
  /** PR-0304: the stand-in shown in the stage slot while the guide (and the hint in it) is faded. */
  readonly solo: HTMLElement;
  private html = '';
  /** PR-0302 repair: the in-guide card is in its one-sentence form (see `update`), for `compactKey`. */
  private compact = false;
  private compactKey = '';
  /** U2: even the one-sentence card leaves the guide's column over a row or the help slab, so the card stands alone in it. */
  private alone: HTMLElement | null = null;
  private overFrames = 0;

  /** `help`: the player's BATTLE HELP switch (the save's `battleHelp`), read every frame. */
  constructor(game: StatusGame, private readonly help: () => boolean = battleHelpOn) {
    this.el = document.createElement('div');
    this.el.className = `sthint sthint--${game}`;
    this.el.dataset['role'] = 'status-hint';
    this.el.hidden = true;
    this.solo = document.createElement('div');
    this.solo.className = `sthint sthint--${game} sthint--solo`;
    this.solo.dataset['role'] = 'status-hint-solo';
    this.solo.hidden = true;
  }

  /**
   * Per frame. `stage` is the HUD's 640x360 stage; `guide` its strategy guide (`.sgd`), if any.
   * `open`: a decision is open. `phone`: the upright-phone layout is on.
   */
  update(hints: readonly CureHint[], open: boolean, stage: HTMLElement | null, guide: HTMLElement | null, phone: boolean): void {
    const full = open && this.help() ? hintCardHtml(hints, phone) : '';
    const panel = stage && guide && !guide.hidden && !guide.classList.contains('sgd--off') && !phone
      ? guide.querySelector<HTMLElement>('.sgd__panel')
      : null;
    // PR-0302 repair: a new card, a resize or another TEXT SIZE starts from the full rule again.
    const key = panel && full ? `${full}|${innerWidth}x${innerHeight}|${document.documentElement.dataset['textSize'] ?? ''}` : '';
    if (key !== this.compactKey) {
      this.compactKey = key;
      this.compact = false;
      this.stand(null);
    }
    this.show(this.compact ? hintCardHtml(hints, true) : full);
    this.el.classList.toggle('sthint--phone', phone);
    if (phone && full) this.dockPhone(stage);
    if (!stage) return;
    if (panel) {
      if (this.el.parentElement !== panel) panel.insertBefore(this.el, panel.firstChild);
      this.el.classList.add('sthint--inguide');
      // The guide shows at least its first block whatever its chrome (StrategyGuide.refit), so a
      // card grown by the 14-px floor pushes the guide's column down over the first command row
      // at 1280 px wide. There the card carries the rule's one-sentence form (the phone card's).
      // Measured before the frame paints, and kept for this card: one switch, never a flicker.
      if (!this.compact && full && guideOverCommands(guide!, stage)) {
        this.compact = true;
        this.show(hintCardHtml(hints, true));
      }
      // U2 (PR-0291, FFX only): the guide shows at least its first block whatever its chrome, so on a short rail the
      // one-sentence card still left that block's NEXT line under the Zombie warning slab at 1600x900. Two frames in
      // a row (the guide re-fits a frame after the card changes), and the card stands alone in the guide's slot, as the
      // approved O3 frame draws it. Latched for this card; cleared when the card goes.
      if (this.compact && !this.alone && full && guideOverCommands(guide!, stage)) {
        if (++this.overFrames >= 2) this.stand(guide);
      } else if (!this.compact || this.alone) this.overFrames = 0;
    } else {
      this.stand(null);
      if (this.el.parentElement !== stage) stage.appendChild(this.el);
      this.el.classList.remove('sthint--inguide');
    }
    const html = this.html;
    const solo = html !== '' && !!panel?.closest(`.${GUIDE_FADE_CLASS}`);
    if (solo && this.solo.innerHTML !== html) this.solo.innerHTML = html;
    if (solo && this.solo.parentElement !== stage) stage.appendChild(this.solo);
    this.solo.hidden = !solo;
  }

  /**
   * Phone: under the target card when one is up (the mockup's order); at the command menu just
   * above the party chips, clear of the TIP line and the command grid (PR-0282); else the CSS
   * default, which is the same chips-top slot from the layout's own geometry.
   */
  private dockPhone(host: HTMLElement | null): void {
    const card = host?.querySelector<HTMLElement>('.phud-card');
    const r = card && !card.hidden ? card.getBoundingClientRect() : null;
    let top = '';
    let bottom = '';
    // PR-0303: the first of the tap line and the Back / Confirm bar that is laid out bounds the slot.
    const below = ['.phud-target__hint', '.phud-target__bar'].map((s) => host?.querySelector<HTMLElement>(s)?.getBoundingClientRect())
      .find((b) => b !== undefined && b.height > 0);
    if (r && r.height > 0 && (!below || r.bottom + 4 + this.el.getBoundingClientRect().height <= below.top - 4)) {
      top = `${Math.round(r.bottom + 4)}px`;
      bottom = 'auto';
    } else {
      const chips = host?.querySelector<HTMLElement>('.ig-stat-list')?.getBoundingClientRect();
      const viewH = document.documentElement.clientHeight || innerHeight;
      if (chips && chips.height > 0 && viewH > 0) bottom = `${Math.round(viewH - chips.top + PHONE_GAP)}px`;
    }
    if (this.el.style.top !== top) this.el.style.top = top;
    if (this.el.style.bottom !== bottom) this.el.style.bottom = bottom;
  }

  /** Put the card alone in `guide` (hiding its body and MORE row, `status-o3.css`), or give the guide back. */
  private stand(guide: HTMLElement | null): void {
    if (this.alone === guide) return;
    this.alone?.classList.remove('sgd--hint-alone');
    this.alone = guide;
    guide?.classList.add('sgd--hint-alone');
    this.overFrames = 0;
  }

  private show(html: string): void {
    if (html !== this.html) {
      this.html = html;
      this.el.innerHTML = html;
    }
    this.el.hidden = html === '';
  }

  dispose(): void {
    this.stand(null);
    this.el.remove();
    this.solo.remove();
  }
}
