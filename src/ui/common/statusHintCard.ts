/**
 * Status display O3 (Bailey's pick, 2026-09-29): **the guide card's cure hint** — "GUIDE [ZOMBIE]
 * Healing turns into damage on a Zombie, and a Phoenix Down would KO him outright. Holy Water or a
 * Remedy cures it; Esuna does not." (the approved `options/o3-*.jpg`).
 *
 * While a decision is open and a living party member carries a status with a sourced rule
 * (`statusWords.ts`: FFX Zombie, Sleep, Silence, Curse; FFX-2 Sleep, Silence, Curse), the card says
 * the rule. The mockup shows it in the strategy guide's slot with the guide folded (G). With the guide
 * open it stands in the guide column's own slot (`.sgd__slot`, the first row of `.sgd__stack`), a card
 * of its own above the sheet, **not** a block of the guide's document (R38, 2026-10-03: the guide is a
 * scrolling reading sheet and the card no longer lives in it): the column is a flex column, so the sheet
 * gives the card its height and takes it back, and nothing in the document is re-fitted, cut or paged.
 * The slot is inside the column the rail has always had, so the card covers exactly what the old in-panel
 * card covered, and nothing more. No guide for the encounter: it stands alone.
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
 * card in it, to opacity 0. While it is faded a solo copy stands in the card's own stage slot (the
 * guide-folded slot); the copy in the guide keeps its place, so the column never moves.
 * PR-0302 repair (desktop, guide open): where the 14-px floor leaves the sheet too little room beside the
 * full card ({@link guideSqueezed}: FFX at 1280 px wide), the card carries the rule's one-sentence form,
 * and if even that is too much it stands alone in the column and the sheet steps aside while it is up.
 *
 * R3942 (Bailey, 2026-10-08, "I'll go with all your recommendations"; the Chapter IV card pick, option 1; FFX-2 only,
 * phone only): the phone card is ONE row, the status chip then "Paine: Holy Water, Esuna, Remedy" (`CureHint.line`,
 * class `sthint--line`), 31 px tall where the two-line sentence card was 73. At the real sizes the giants study picked
 * (Bahamut 70 percent on a phone) the girls stand low, and the three-row card sat on their legs (Chapter IV, Yuna's share
 * hidden: 52 percent at 390x844 and 98 at 375x667, live 8 and 65, now 6 and 38). The text stays 14.2 px, the card stays
 * docked 6 px above the party chips, no figure moves: the card's top edge is simply 42 px lower (22 on a 430-wide phone,
 * where the sentence fitted two rows). FFX's phone card and every desktop card are unchanged. Numbers and pictures:
 * `docs/handoff/r3942-stage.md`, last section.
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
export function hintCardHtml(hints: readonly CureHint[], phone: boolean, oneLine = false): string {
  const first = hints[0];
  if (!first) return '';
  // R3942 (FFX-2 phone, Bailey 2026-10-08): one row, the chip then "Paine: Holy Water, Esuna, Remedy". No "GUIDE" word: the chip is the
  // card's label, and the row has no room for both at 14.2 px. A hint with no `line` keeps the sentence.
  if (phone && oneLine && first.line !== undefined) return `<div class="sthint__head"><i>${first.label}</i></div><div class="sthint__body">${first.line}</div>`;
  const body = phone ? first.short : hints[1] ? `${first.html} ${hints[1].short}` : first.html;
  return `<div class="sthint__head">GUIDE <i>${first.label}</i></div><div class="sthint__body">${body}</div>`;
}

/** Does this phone card take the one-row form? FFX-2's phone card only (FFX's keeps its two-line sentence), and only for a hint that has one. Pure. */
export function oneLineCard(game: StatusGame, hints: readonly CureHint[], phone: boolean): boolean {
  return phone && game === 'ffx2' && hints[0]?.line !== undefined;
}

/** The least the sheet may be left to show beside the card, in layout (stage-grid) px: two lines of its type and its padding. */
export const MIN_SHEET_HEIGHT = 26;

/**
 * PR-0302 repair, for the slot: does the card leave the guide's column too little room? The sheet is a flex
 * item that shrinks behind the card, so it never runs past the column on its own; it is squeezed when it has
 * more to scroll than it shows and shows less than {@link MIN_SHEET_HEIGHT}, or when the column's contents (the
 * card, whose height nothing can shrink) overflow the box the column is capped at. Layout px, so TEXT SIZE's
 * `scale` and the stage's letterbox scale are both outside it; a box with no layout (jsdom, hidden) is never
 * squeezed.
 */
export function guideSqueezed(guide: HTMLElement): boolean {
  const stack = guide.querySelector<HTMLElement>('.sgd__stack');
  const panel = guide.querySelector<HTMLElement>('.sgd__panel');
  if (!stack || !panel || stack.hidden || panel.hidden) return false;
  const overflow = stack.scrollHeight - stack.offsetHeight > 1;
  const cramped = panel.offsetHeight > 0 && panel.scrollHeight > panel.clientHeight + 1 && panel.clientHeight < MIN_SHEET_HEIGHT;
  return stack.offsetHeight > 0 && (overflow || cramped);
}

export class StatusHintCard {
  readonly el: HTMLElement;
  /** PR-0304: the stand-in shown in the stage slot while the guide (and the hint in it) is faded. */
  readonly solo: HTMLElement;
  private html = '';
  /** PR-0302 repair: the in-guide card is in its one-sentence form (see `update`), for `compactKey`. */
  private compact = false;
  private compactKey = '';
  /** U2: even the one-sentence card leaves the sheet too little room, so the card stands alone in the guide's column. */
  private alone: HTMLElement | null = null;
  private overFrames = 0;

  /** `help`: the player's BATTLE HELP switch (the save's `battleHelp`), read every frame. */
  constructor(private readonly game: StatusGame, private readonly help: () => boolean = battleHelpOn) {
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
    // R3942 (FFX-2 phone only): the one-row card. The class is set before the card docks, so the dock measures the one-row height.
    const line = oneLineCard(this.game, hints, phone);
    const full = open && this.help() ? hintCardHtml(hints, phone, line) : '';
    const slot = stage && guide && !guide.hidden && !guide.classList.contains('sgd--off') && !phone
      ? guide.querySelector<HTMLElement>('.sgd__slot')
      : null;
    // PR-0302 repair: a new card, a resize or another TEXT SIZE starts from the full rule again.
    const key = slot && full ? `${full}|${innerWidth}x${innerHeight}|${document.documentElement.dataset['textSize'] ?? ''}` : '';
    if (key !== this.compactKey) {
      this.compactKey = key;
      this.compact = false;
      this.stand(null);
    }
    this.show(this.compact ? hintCardHtml(hints, true) : full);
    this.el.classList.toggle('sthint--phone', phone);
    this.el.classList.toggle('sthint--line', line && full !== '');
    if (phone && full) this.dockPhone(stage);
    if (!stage) return;
    if (slot) {
      if (this.el.parentElement !== slot) slot.appendChild(this.el);
      this.el.classList.add('sthint--slot');
      // The sheet is a flex item that shrinks behind the card, so it never runs past its column on its own. Where
      // the full rule leaves it too little to read (the 14-px floor at 1280 px wide), the card carries the rule's
      // one-sentence form (the phone card's). Measured before the frame paints, and kept for this card: one switch,
      // never a flicker.
      if (!this.compact && full && guideSqueezed(guide!)) {
        this.compact = true;
        this.show(hintCardHtml(hints, true));
      }
      // U2 (PR-0291, FFX only): where even the one-sentence card leaves the sheet too little room, the card stands
      // alone in the column and the sheet steps aside while it is up, as the approved O3 frame draws it. Two frames
      // in a row (the sheet re-lays out a frame after the card changes). Latched for this card; cleared when the
      // card goes.
      if (this.compact && !this.alone && full && guideSqueezed(guide!)) {
        if (++this.overFrames >= 2) this.stand(guide);
      } else if (!this.compact || this.alone) this.overFrames = 0;
    } else {
      this.stand(null);
      if (this.el.parentElement !== stage) stage.appendChild(this.el);
      this.el.classList.remove('sthint--slot');
    }
    const html = this.html;
    const solo = html !== '' && !!slot?.closest(`.${GUIDE_FADE_CLASS}`);
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

  /** Put the card alone in `guide` (hiding its sheet, `status-o3.css`), or give the guide back. */
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
