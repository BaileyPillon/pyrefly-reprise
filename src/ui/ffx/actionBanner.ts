/**
 * PR-0180: the enemy's ability name, centred in the top HELP bar.
 *
 * Source: `research/observed-ffx-steam-2026-09-26.md` §2.2 (FFX Steam HD
 * Remaster, Spherimorph): when the boss cast Fire, the top HELP bar showed
 * "Fire", centred, for the span of the spell (about 1.5 to 2 s); its plain
 * physical attack showed no name at all. The method check
 * (`docs/plans/pr-0180-method-check.md`) built this behind a switch until that
 * source existed; it does now, so the bar is on.
 *
 * The ivory `.ig-banner` slab is not used: it keeps only the moments it carries
 * today (scripted lines, system messages). This bar is its own element, an ink
 * band in the telegraph's top-centre slot, and it holds the name only while the
 * action plays (`action-start` to `action-end`, or the next turn).
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only.** FFX-2 prints its own messages
 * (`src/ui/ffx2/battleMessage.ts`). The party half (does retail name a party
 * skill there too?) is unsourced (plan §9) and not built.
 */
import type { AnyCombatant, BattleEvent, CombatantId } from '../../battle/common/types.ts';

/** On by the Steam observation above. */
export const ENEMY_ACTION_NAMES_ENABLED = true;

/** The name the bar shows for this event, or `null` for none. */
export function actionHelpName(
  event: BattleEvent,
  combatants: Readonly<Record<CombatantId, AnyCombatant | undefined>> | undefined,
): string | null {
  if (event.type !== 'action-start') return null;
  if (event.command.kind === 'attack') return null;
  const name = event.abilityName?.trim();
  if (!name || name.toLowerCase() === 'attack') return null;
  if (combatants?.[event.actorId]?.side !== 'enemy') return null;
  return name;
}

export class ActionHelpBar {
  readonly el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-helpbar';
    this.el.dataset['role'] = 'action-help';
    this.el.setAttribute('aria-live', 'polite');
    this.el.hidden = true;
  }

  onEvent(event: BattleEvent, combatants: Readonly<Record<CombatantId, AnyCombatant | undefined>> | undefined): void {
    if (event.type === 'action-start') {
      const name = ENEMY_ACTION_NAMES_ENABLED ? actionHelpName(event, combatants) : null;
      if (name) this.show(name);
      else this.hide();
      return;
    }
    if (event.type === 'action-end' || event.type === 'turn-start' || event.type === 'victory' || event.type === 'defeat') this.hide();
  }

  /** The name currently on the bar, or `null`. For the debug snapshot and tests. */
  get text(): string | null {
    return this.el.hidden ? null : this.el.textContent;
  }

  hide(): void {
    this.el.hidden = true;
    this.el.textContent = '';
  }

  private show(name: string): void {
    this.el.textContent = name;
    this.el.hidden = false;
  }
}
