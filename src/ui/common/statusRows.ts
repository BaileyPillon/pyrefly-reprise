/**
 * Status display O2 "at a glance" (part of Bailey's pick O3, 2026-09-29): **the icon rows on the
 * HUD's own plates**, and O3's one-word captions. The HUD row builders call these; the markup is
 * `statusIcons.ts`' icon, the geometry is `status-rows.css`, sized from the approved mockups
 * (`docs/concepts/status-display-0929/options/src/gen.mjs`).
 *
 * Game case (AGENTS.md rule 14):
 * - **FFX:** round medallions right-aligned under the Overdrive gauge (the plate's one empty band),
 *   and beside turn-list names. FFX has no standing icons (research/status-display.md §1), so this
 *   is our deliberate addition, keyed to FFX's own on-figure cues.
 * - **FFX-2:** square tags in place of the old text chips (`PSN`, `SIL`...), and a STATUS tab under
 *   a boss's bar. FFX-2 has an icon for every status (§3, W-X2icon); this puts that idea in a second
 *   place, drawn fresh (rule 8).
 * - **Both:** red rim = the status hurts its holder, teal = it helps; KO and the engine's hidden
 *   bookkeeping statuses never show (`iconIdsOf` lists only statuses with an icon).
 *
 * Pure string builders: no DOM, no engine writes (rule 1).
 */

import './status-rows.css';
import type { AnyCombatant, StatusId } from '../../battle/common/types.ts';
import { statusIconRowHtml } from './statusIcons.ts';
import { captionOf, iconIdsOf, type StatusGame } from './statusLooks.ts';

type Statuses = Parameters<typeof statusIconRowHtml>[2];

/** How many icons fit before a "+n" chip: FFX's plate band and FFX-2's row both hold five (O2). */
export const ROW_MAX = 5;
/** The turn list's band beside a name holds three. */
export const CTB_MAX = 3;

/** The statuses a combatant shows as icons now (none once KO'd: a fallen unit's row says KO). */
export function rowIconIds(game: StatusGame, c: AnyCombatant | undefined): StatusId[] {
  if (!c || !c.alive) return [];
  return iconIdsOf(game, c.statuses as Partial<Record<string, unknown>>);
}

function row(game: StatusGame, c: AnyCombatant | undefined, cls: string, max: number): string {
  const ids = rowIconIds(game, c);
  if (!c || ids.length === 0) return '';
  return `<span class="${cls} sti-row">${statusIconRowHtml(game, ids, c.statuses as Statuses, max)}</span>`;
}

/** FFX party plate: medallions under the Overdrive gauge. */
export function ffxPlateIconsHtml(c: AnyCombatant | undefined, extra = ''): string {
  const html = row('ffx', c, 'ffx-stat__statuses', ROW_MAX);
  if (!html) return extra ? `<span class="ffx-stat__statuses sti-row">${extra}</span>` : '';
  return extra ? html.replace(/<\/span>$/, `${extra}</span>`) : html;
}

/** FFX turn list: medallions beside the name (desktop), on the tile's corner (phone). */
export function ffxCtbIconsHtml(c: AnyCombatant | undefined): string {
  return row('ffx', c, 'ffx-ctb-statuses', CTB_MAX);
}

/** FFX-2 party row: square tags where the text chips were. */
export function ffx2RowTagsHtml(c: AnyCombatant | undefined): string {
  return row('ffx2', c, 'ffx2party__tags', ROW_MAX);
}

/** FFX-2 boss: the STATUS tab under the bar (with Doom's count when the engine carries one). */
export function ffx2BossTabHtml(c: AnyCombatant | undefined): string {
  const ids = rowIconIds('ffx2', c);
  if (!c || ids.length === 0) return '';
  return `<div class="ststab"><span class="ststab__label">STATUS</span><span class="sti-row">${statusIconRowHtml('ffx2', ids, c.statuses as Statuses, ROW_MAX)}</span></div>`;
}

/** O3: the one-word caption where a status changes what a member can do ("ASLEEP"). */
export function captionHtml(game: StatusGame, c: AnyCombatant | undefined): string {
  if (!c || !c.alive) return '';
  const text = captionOf(game, c.statuses as Partial<Record<string, unknown>>);
  return text ? `<em class="stcap">${text}</em>` : '';
}
