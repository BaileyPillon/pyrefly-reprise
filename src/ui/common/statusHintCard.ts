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
 */

import type { BattleState, CombatantId, StatusId } from '../../battle/common/types.ts';
import type { StatusGame } from './statusLooks.ts';
import { cureHint, hintStatuses, type CureHint } from './statusWords.ts';
import { battleHelpOn } from '../coach/coachState.ts';

/** Phone: the gap kept between the card and what it docks against, CSS px. */
const PHONE_GAP = 6;

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

export class StatusHintCard {
  readonly el: HTMLElement;
  private html = '';

  /** `help`: the player's BATTLE HELP switch (the save's `battleHelp`), read every frame. */
  constructor(game: StatusGame, private readonly help: () => boolean = battleHelpOn) {
    this.el = document.createElement('div');
    this.el.className = `sthint sthint--${game}`;
    this.el.dataset['role'] = 'status-hint';
    this.el.hidden = true;
  }

  /**
   * Per frame. `stage` is the HUD's 640x360 stage; `guide` its strategy guide (`.sgd`), if any.
   * `open`: a decision is open. `phone`: the upright-phone layout is on.
   */
  update(hints: readonly CureHint[], open: boolean, stage: HTMLElement | null, guide: HTMLElement | null, phone: boolean): void {
    const html = open && this.help() ? hintCardHtml(hints, phone) : '';
    if (html !== this.html) {
      this.html = html;
      this.el.innerHTML = html;
    }
    this.el.hidden = html === '';
    this.el.classList.toggle('sthint--phone', phone);
    if (phone && html) this.dockPhone(stage);
    if (!stage) return;
    const panel = guide && !guide.hidden && !guide.classList.contains('sgd--off') && !phone
      ? guide.querySelector<HTMLElement>('.sgd__panel')
      : null;
    if (panel) {
      if (this.el.parentElement !== panel) panel.insertBefore(this.el, panel.firstChild);
      this.el.classList.add('sthint--inguide');
    } else {
      if (this.el.parentElement !== stage) stage.appendChild(this.el);
      this.el.classList.remove('sthint--inguide');
    }
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
    if (r && r.height > 0) {
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

  dispose(): void {
    this.el.remove();
  }
}
