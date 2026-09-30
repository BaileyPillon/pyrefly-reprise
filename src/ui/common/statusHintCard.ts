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
 */

import type { BattleState, CombatantId, StatusId } from '../../battle/common/types.ts';
import type { StatusGame } from './statusLooks.ts';
import { cureHint, hintStatuses, type CureHint } from './statusWords.ts';

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

  constructor(game: StatusGame) {
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
    const html = open ? hintCardHtml(hints, phone) : '';
    if (html !== this.html) {
      this.html = html;
      this.el.innerHTML = html;
    }
    this.el.hidden = html === '';
    this.el.classList.toggle('sthint--phone', phone);
    if (phone) this.dockUnderCard(stage);
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

  /** Phone: under the target card when one is up (the mockup's order), else the CSS default. */
  private dockUnderCard(host: HTMLElement | null): void {
    const card = host?.querySelector<HTMLElement>('.phud-card');
    const r = card && !card.hidden ? card.getBoundingClientRect() : null;
    const top = r && r.height > 0 ? `${Math.round(r.bottom + 4)}px` : '';
    if (this.el.style.top !== top) this.el.style.top = top;
    this.el.style.bottom = top ? 'auto' : '';
  }

  dispose(): void {
    this.el.remove();
  }
}
