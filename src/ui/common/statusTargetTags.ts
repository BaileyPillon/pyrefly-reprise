/**
 * Status display, the **target's statuses while aiming** (Bailey's pick O3, 2026-09-29):
 *
 * - **FFX-2 (O1):** the top help line lists the targeted unit's status icons, FFX-2's own place for
 *   them (`research/status-display.md` §3: "The icons are shown in the top help line next to the
 *   name of the unit being targeted" [single source: X2-CORE §6.1]): "ATTACK Physical damage |
 *   Bahamut [Doom 3]". On the phone, in the target card.
 * - **O3, both games:** a red DOOM n tag on the target tag (FFX-2's TARGET plate; FFX's name plate
 *   says it through its own note, `targetCursorParts.ts` `noteHtml`). On the phone the card carries
 *   the same tags, and FFX's ZOMBIE tag.
 *
 * Doom's count is the engine's (`iconCountOf`: FFX `turnsRemaining`; FFX-2 carries no turn count
 * for Doom, only a tick clock, so its tag shows a count only when the engine gives one).
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { iconCountOf, statusIconRowHtml } from './statusIcons.ts';
import { iconIdsOf, type StatusGame } from './statusLooks.ts';
import { escapeHtml } from './statusWords.ts';

/** A red tag: "ZOMBIE", "DOOM 3". */
export function redTagHtml(text: string): string {
  return `<span class="sttag"><span>${escapeHtml(text)}</span></span>`;
}

/** The O3 tags for one target: FFX's ZOMBIE on a living Zombie ally, and DOOM n (both). Pure. */
export function targetTagTexts(game: StatusGame, c: BattleState['combatants'][string] | undefined): string[] {
  if (!c || !c.alive) return [];
  const out: string[] = [];
  const st = c.statuses as Record<string, { turnsRemaining?: number | null; charges?: number | null; stacks?: number } | undefined>;
  if (game === 'ffx' && c.side !== 'enemy' && st['zombie']) out.push('ZOMBIE');
  if (st['doom']) {
    const n = iconCountOf('doom', st['doom']);
    out.push(n === null ? 'DOOM' : `DOOM ${n}`);
  }
  return out;
}

/** The icons FFX-2's help line shows for a target (every status it has an icon for). Pure. */
export function targetIconsHtml(game: StatusGame, c: BattleState['combatants'][string] | undefined, max = 6): string {
  if (!c) return '';
  const ids = iconIdsOf(game, c.statuses);
  return ids.length ? `<span class="sti-row">${statusIconRowHtml(game, ids, c.statuses as never, max)}</span>` : '';
}

/** Keeps the aimed target's icons and tags on the help band, the TARGET plate and the phone card. */
export class StatusTargetTags {
  private key = '';

  constructor(private readonly game: StatusGame) {}

  update(hud: HTMLElement | null, state: BattleState | null, aimed: readonly CombatantId[]): void {
    if (!hud) return;
    const id = aimed.length === 1 ? aimed[0]! : null;
    const c = id ? state?.combatants[id] : undefined;
    const tags = targetTagTexts(this.game, c);
    const icons = this.game === 'ffx2' ? targetIconsHtml('ffx2', c) : '';
    const key = `${id}|${tags.join(',')}|${icons.length}|${icons}`;
    const changed = key !== this.key;
    this.key = key;
    const tagHtml = tags.map(redTagHtml).join('');

    // FFX-2's help line: "| Bahamut [icons]" after the command's own words.
    if (this.game === 'ffx2') {
      const band = hud.querySelector<HTMLElement>('.ffx2-cmd-info');
      this.slot(band, 'stband', c && id ? `<span class="stband__name">${escapeHtml(c.name)}</span>${icons}` : '', changed);
      // FFX-2's TARGET plate: the DOOM tag beside it.
      this.slot(hud.querySelector<HTMLElement>('.ffx2-tplate'), 'stplate', tagHtml, changed);
    }
    // The phone's target card (both games): icons (FFX-2) and the red tags.
    const cardText = hud.querySelector<HTMLElement>('.phud-card__text');
    this.slot(cardText, 'stcard', `${icons}${tagHtml}`, changed);
  }

  private slot(host: HTMLElement | null, cls: string, html: string, changed: boolean): void {
    if (!host) return;
    let el = host.querySelector<HTMLElement>(`:scope > .${cls}`);
    if (!html) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('span');
      el.className = cls;
      host.appendChild(el);
      changed = true;
    }
    if (changed || el.dataset['html'] !== html) {
      el.dataset['html'] = html;
      el.innerHTML = html;
    }
  }

  clear(hud: HTMLElement | null): void {
    this.key = '';
    for (const el of hud?.querySelectorAll('.stband, .stplate, .stcard') ?? []) el.remove();
  }
}
