/**
 * The status pips on the FFX party plate and the CTB tiles: which ones, in what order, what colour.
 * **FFX only** (`src/ui/ffx`; FFX-2 has its own HUD and no Zombie).
 *
 * fb-0929 (Bailey's friend: "Hi potion killed kimahri instead of healing"): the party plate drew
 * the first six statuses in the order they landed, all in one sky blue. Chapter I opens with
 * Kimahri's Mighty Guard, which alone puts six on him (Protect, Shell and the four Nul-spells), so
 * the Zombie that Seymour's Lance of Atrophy adds next was the seventh and never drawn, and the
 * player healed a Zombie they had no way to see. The documented intent is a Zombie icon in its own
 * colour (research/visual-bible.md, "Status icons": Zombie chip `#A8C48A`; Lance of Atrophy
 * "leaving the green Zombie icon"). The plate now orders its pips as the CTB list always has, most
 * alarming first (`battle/ffx/turnQueue.ts` ICON_PRIORITY), and colours them from the same table.
 */

import type { AnyCombatant, StatusId } from '../../battle/common/types.ts';
import { ICON_PRIORITY } from '../../battle/ffx/turnQueue.ts';

/** research/visual-bible.md "Status icons": each status's glyph colour. */
export const STATUS_DOT_COLOR: Partial<Record<StatusId, string>> = {
  haste: '#7ee8b0',
  slow: '#b48fe0',
  protect: '#9fc4e8',
  shell: '#c8a0f0',
  reflect: '#ffe08a',
  regen: '#8be8b0',
  poison: '#a8d84a',
  silence: '#c8c8c8',
  darkness: '#8e8e9e',
  sleep: '#9fc4e8',
  zombie: '#a8c48a',
  berserk: '#f28a6a',
  petrify: '#b4ae9e',
  curse: '#c04ac0',
  'auto-life': '#fff0a8',
  doom: '#c7343c',
};

/** How many pips fit on a party plate row (`.ffx-stat__statuses`, unchanged since Ink & Gold). */
export const PLATE_PIP_LIMIT = 6;

/**
 * A combatant's statuses for the plate: the {@link ICON_PRIORITY} ones first in that order, then
 * the rest in the order they landed, KO left out, at most {@link PLATE_PIP_LIMIT}.
 */
export function platePipIds(c: AnyCombatant, limit = PLATE_PIP_LIMIT): StatusId[] {
  const present = (Object.keys(c.statuses) as StatusId[]).filter((k) => c.statuses[k] !== undefined && k !== 'ko');
  const ranked = ICON_PRIORITY.filter((s) => present.includes(s));
  const rest = present.filter((s) => !ranked.includes(s));
  return [...ranked, ...rest].slice(0, limit);
}

/** "zombie" -> "Zombie", "auto-life" -> "Auto-Life": the pip's hover title. */
export function statusLabel(s: StatusId): string {
  return s.replace(/(^|-)([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}
