/**
 * Status display O2/O3: one status icon, drawn fresh in SVG (AGENTS.md rule 8: never a retail
 * icon). FFX wears it as a **round medallion** (our addition: FFX has no standing icons, research
 * §1), FFX-2 as a **square tag** (FFX-2 has an icon for every status, W-X2icon). A red rim means
 * the status hurts the unit that has it, teal that it helps (the approved O2/O3 legend).
 *
 * The glyphs are the options round's own (`docs/concepts/status-display-0929/options/src/gen.mjs`)
 * plus the rest of the set in the same hand. Each is keyed to the sourced idea of the look
 * (bubbles for Poison, smoke for Zombie, Z's for Sleep, an ellipsis bubble for Silence) or, for a
 * stat change, to its name.
 */

import './status-icons.css';
import type { StatusId } from '../../battle/common/types.ts';
import { isHarmful, statusName, type StatusGame } from './statusLooks.ts';

const Z = 'font-family="Chakra Petch, sans-serif" font-weight="700"';
const SHIELD = 'M12 2.8l7.2 3v5.4c0 4.9-3.2 8.3-7.2 10-4-1.7-7.2-5.1-7.2-10V5.8z';

/** A stat glyph: three letters over an arrow. */
function stat(label: string, up: boolean, colour: string): string {
  const arrow = up ? 'M8 21l4-4 4 4' : 'M8 17l4 4 4-4';
  return `<text x="12" y="13" text-anchor="middle" ${Z} font-size="${label.length > 3 ? 7.4 : 9}" fill="${colour}">${label}</text>`
    + `<path d="${arrow}" fill="none" stroke="${colour}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const orb = (fill: string, edge: string): string =>
  `<circle cx="12" cy="12" r="7.5" fill="${fill}" stroke="${edge}" stroke-width="1.4"/><circle cx="9.4" cy="9.2" r="2.2" fill="#fff" opacity=".75"/>`;
const shield = (fill: string, inner: string): string => `<path d="${SHIELD}" fill="${fill}" stroke="#123a52" stroke-width="1.4"/>${inner}`;

const GLYPHS: Partial<Record<StatusId, string>> = {
  zombie: `<circle cx="7" cy="5" r="2.4" fill="#2a2a30"/><circle cx="11.5" cy="3.6" r="2.8" fill="#2a2a30"/><circle cx="16" cy="5" r="2.2" fill="#2a2a30"/><circle cx="12" cy="13" r="7" fill="#9fe38a" stroke="#1d3d17" stroke-width="1.4"/><circle cx="9.4" cy="12" r="1.5" fill="#12200f"/><circle cx="14.6" cy="12" r="1.5" fill="#12200f"/><path d="M8.3 16.2l1.2-1 1.2 1 1.3-1 1.2 1 1.2-1 1.2 1" fill="none" stroke="#12200f" stroke-width="1.2" stroke-linecap="round"/>`,
  poison: `<circle cx="8.5" cy="15" r="5" fill="#7fe36b" stroke="#1c4d18" stroke-width="1.3"/><circle cx="7" cy="13.3" r="1.4" fill="#effff0"/><circle cx="16" cy="8.5" r="3.6" fill="#7fe36b" stroke="#1c4d18" stroke-width="1.2"/><circle cx="15" cy="7.4" r="1" fill="#effff0"/><circle cx="17" cy="17.5" r="2.4" fill="#7fe36b" stroke="#1c4d18" stroke-width="1.1"/>`,
  protect: shield('#7fc6e8', '<path d="M12 5.2v14" stroke="#e8f7ff" stroke-width="1.6"/>'),
  shell: shield('#c3a6ff', '<circle cx="12" cy="11.5" r="3.4" fill="none" stroke="#f3ecff" stroke-width="1.6"/>'),
  reflect: `<path d="M12 2.5l8.5 9.5-8.5 9.5-8.5-9.5z" fill="#d7f3ff" stroke="#1d4b66" stroke-width="1.4"/><path d="M9 8.5l6 7M8 12l3 3.4" stroke="#5aa9d6" stroke-width="1.4"/>`,
  slow: `<path d="M6.5 3.5h11M6.5 20.5h11" stroke="#f3dc8c" stroke-width="1.8" stroke-linecap="round"/><path d="M7.5 4.2h9L12 12zM12 12l4.5 7.8h-9z" fill="#e3b94a" stroke="#5a3f0c" stroke-width="1.2" stroke-linejoin="round"/>`,
  haste: `<path d="M4.5 5.5l6.5 6.5-6.5 6.5M12 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="#ff7a5c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  sleep: `<text x="3" y="19" ${Z} font-size="15" fill="#cfe0ff" stroke="#1c2a55" stroke-width="0.8">Z</text><text x="13" y="11" ${Z} font-size="10" fill="#cfe0ff" stroke="#1c2a55" stroke-width="0.6">z</text>`,
  silence: `<path d="M4 5.5h16a1.8 1.8 0 0 1 1.8 1.8v8a1.8 1.8 0 0 1-1.8 1.8H11l-4.5 3.6.8-3.6H4a1.8 1.8 0 0 1-1.8-1.8v-8A1.8 1.8 0 0 1 4 5.5z" fill="#f4f1e8" stroke="#0b0a12" stroke-width="1.2"/><circle cx="8" cy="11.4" r="1.4" fill="#0b0a12"/><circle cx="12" cy="11.4" r="1.4" fill="#0b0a12"/><circle cx="16" cy="11.4" r="1.4" fill="#0b0a12"/>`,
  doom: `<circle cx="12" cy="12" r="8.6" fill="#3a0d12" stroke="#ff5a5a" stroke-width="1.8"/><path d="M12 12V6.5" stroke="#ff9a9a" stroke-width="1.6" stroke-linecap="round"/>`,
  curse: `<path d="M12 12.5a1.2 1.2 0 1 1 1.6-1.1 3 3 0 1 1-4.9-1.9 5 5 0 1 1 7.3 6.4" fill="none" stroke="#c09ae0" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="#6b4a86" stroke-width="1"/>`,
  darkness: `<path d="M6 17.5a4 4 0 0 1 .6-8 5.4 5.4 0 0 1 10.4-.6 4.2 4.2 0 0 1 .6 8.6z" fill="#1a1a22" stroke="#8a8aa0" stroke-width="1.2"/><circle cx="10" cy="13.6" r="1" fill="#8a8aa0"/><circle cx="14" cy="13.6" r="1" fill="#8a8aa0"/>`,
  confuse: `<path d="M7.5 3.5l1.3 3 3.2.3-2.4 2.1.7 3.1-2.8-1.6-2.8 1.6.7-3.1L3 6.8l3.2-.3z" fill="#ffe27a" stroke="#6a4a00" stroke-width=".8"/><path d="M16.5 10.5l1.3 3 3.2.3-2.4 2.1.7 3.1-2.8-1.6-2.8 1.6.7-3.1-2.4-2.1 3.2-.3z" fill="#ffe27a" stroke="#6a4a00" stroke-width=".8"/>`,
  berserk: `<path d="M12 2.5l2.2 5.4 5.6-1.6-3 5 4.7 3.4-5.8.6.6 5.8-4.3-4-4.3 4 .6-5.8-5.8-.6 4.7-3.4-3-5 5.6 1.6z" fill="#ff6a4a" stroke="#4a0a00" stroke-width="1"/>`,
  petrify: `<path d="M5 8l4-4.5h6.5L19.5 9 18 18l-6 3-6.5-3.5z" fill="#a9a398" stroke="#3a372f" stroke-width="1.3"/><path d="M10 7l2 5-2.5 4M12 12l4.5 1.5" fill="none" stroke="#3a372f" stroke-width="1.1"/>`,
  stop: `<circle cx="12" cy="12" r="8.4" fill="#dfe6f2" stroke="#3a4a66" stroke-width="1.4"/><path d="M9.2 8v8M14.8 8v8" stroke="#3a4a66" stroke-width="2.4" stroke-linecap="round"/>`,
  regen: `<path d="M12 6v12M6 12h12" stroke="#8be8b0" stroke-width="3.2" stroke-linecap="round"/><path d="M19.2 8.4A8 8 0 1 0 20 12" fill="none" stroke="#8be8b0" stroke-width="1.4"/>`,
  'auto-life': `<ellipse cx="12" cy="7" rx="7" ry="2.6" fill="none" stroke="#ffe79a" stroke-width="2"/><path d="M12 11v9M8.5 14.5h7" stroke="#fff4c8" stroke-width="2" stroke-linecap="round"/>`,
  nulblaze: orb('#ff5a3c', '#5a1206'),
  nulfrost: orb('#f2f6ff', '#4a5a7a'),
  nulshock: orb('#ffe04a', '#5a4a06'),
  nultide: orb('#4a8cff', '#0a2a66'),
  shield: shield('#4a7fc0', '<path d="M8 11h8" stroke="#e8f2ff" stroke-width="2"/>'),
  boost: `<path d="M6 13l6-6 6 6M6 19l6-6 6 6" fill="none" stroke="#ffb86a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  guard: shield('#9ac8b8', '<path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="#0b3a2e" stroke-width="1.8"/>'),
  sentinel: shield('#9ac8b8', '<path d="M12 7.5l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#0b3a2e"/>'),
  defend: shield('#9ac8b8', ''),
  provoke: `<path d="M12 3.5v11" stroke="#ff8a5c" stroke-width="3.4" stroke-linecap="round"/><circle cx="12" cy="19.2" r="2" fill="#ff8a5c"/>`,
  threaten: `<path d="M8.5 3.5v11M15.5 3.5v11" stroke="#ff5a5a" stroke-width="3" stroke-linecap="round"/><circle cx="8.5" cy="19.2" r="1.8" fill="#ff5a5a"/><circle cx="15.5" cy="19.2" r="1.8" fill="#ff5a5a"/>`,
  itchy: `<path d="M4 8q2-3 4 0t4 0 4 0 4 0M4 13q2-3 4 0t4 0 4 0 4 0M4 18q2-3 4 0t4 0 4 0 4 0" fill="none" stroke="#ffb0d8" stroke-width="1.6"/>`,
  pointless: `<text x="12" y="11" text-anchor="middle" ${Z} font-size="8" fill="#ffb0b0">EXP</text><text x="12" y="20.5" text-anchor="middle" ${Z} font-size="9" fill="#ffb0b0">=0</text>`,
  invincible: `<path d="M12 2.5l2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 16.2l-5.6 3.3 1.5-6.3L3 9l6.4-.5z" fill="#ffe27a" stroke="#6a4a00" stroke-width="1"/>`,
  'null-magic': `<circle cx="12" cy="12" r="8.4" fill="none" stroke="#c3a6ff" stroke-width="2"/><path d="M6 18L18 6" stroke="#c3a6ff" stroke-width="2"/><text x="12" y="15.6" text-anchor="middle" ${Z} font-size="9" fill="#f3ecff">M</text>`,
  'null-physical': `<circle cx="12" cy="12" r="8.4" fill="none" stroke="#7fc6e8" stroke-width="2"/><path d="M6 18L18 6" stroke="#7fc6e8" stroke-width="2"/><text x="12" y="15.6" text-anchor="middle" ${Z} font-size="9" fill="#e8f7ff">P</text>`,
  spellspring: `<text x="12" y="11" text-anchor="middle" ${Z} font-size="8" fill="#9fd8ff">MP</text><text x="12" y="20.5" text-anchor="middle" ${Z} font-size="9" fill="#9fd8ff">=0</text>`,
  'power-break': stat('STR', false, '#ff9a86'),
  'magic-break': stat('MAG', false, '#ff9a86'),
  'armor-break': stat('DEF', false, '#ff9a86'),
  'mental-break': stat('MDF', false, '#ff9a86'),
  cheer: stat('STR', true, '#8be8c8'),
  focus: stat('MAG', true, '#8be8c8'),
  aim: stat('ACC', true, '#8be8c8'),
  reflex: stat('EVA', true, '#8be8c8'),
  luck: stat('LCK', true, '#8be8c8'),
  jinx: stat('LCK', false, '#ff9a86'),
  'str-up': stat('STR', true, '#8be8c8'), 'mag-up': stat('MAG', true, '#8be8c8'), 'def-up': stat('DEF', true, '#8be8c8'),
  'mdef-up': stat('MDF', true, '#8be8c8'), 'accu-up': stat('ACC', true, '#8be8c8'), 'eva-up': stat('EVA', true, '#8be8c8'),
  'luck-up': stat('LCK', true, '#8be8c8'),
  'str-down': stat('STR', false, '#ff9a86'), 'mag-down': stat('MAG', false, '#ff9a86'), 'def-down': stat('DEF', false, '#ff9a86'),
  'mdef-down': stat('MDF', false, '#ff9a86'), 'accu-down': stat('ACC', false, '#ff9a86'), 'eva-down': stat('EVA', false, '#ff9a86'),
  'luck-down': stat('LCK', false, '#ff9a86'),
};

/** True when `status` has a drawn glyph (tests: every icon-set status must). */
export function hasGlyph(status: StatusId): boolean {
  return GLYPHS[status] !== undefined;
}

/** The glyph's inner SVG (the message line and the guide chip reuse it). */
export function glyphSvg(status: StatusId): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[status] ?? ''}</svg>`;
}

export interface IconOptions {
  /** A number in the corner: Doom's count, a stat level. */
  count?: number | null;
}

/** One icon: `.sti--round` (FFX) or `.sti--tag` (FFX-2), rimmed `--harm` or `--help`. */
export function statusIconHtml(game: StatusGame, status: StatusId, opts: IconOptions = {}): string {
  const shape = game === 'ffx' ? 'round' : 'tag';
  const tone = isHarmful(status) ? 'harm' : 'help';
  const n = opts.count;
  const num = typeof n === 'number' && Number.isFinite(n) ? `<b class="sti__n">${Math.max(0, Math.round(n))}</b>` : '';
  const name = statusName(status);
  return `<span class="sti sti--${shape} sti--${tone}" data-status="${status}" title="${name}" aria-label="${name}">${glyphSvg(status)}${num}</span>`;
}

/** The corner number a status carries: Doom's count, a stat level (FFX stacking buffs, FFX-2 Up/Down). */
export function iconCountOf(status: StatusId, inst: { turnsRemaining?: number | null; charges?: number | null; stacks?: number } | undefined): number | null {
  if (!inst) return null;
  if (status === 'doom') {
    const n = typeof inst.turnsRemaining === 'number' ? inst.turnsRemaining : typeof inst.charges === 'number' ? inst.charges : null;
    return n === null || !Number.isFinite(n) ? null : Math.max(0, n);
  }
  return typeof inst.stacks === 'number' && inst.stacks > 0 ? inst.stacks : null;
}

/** A row of icons for a combatant's statuses, capped at `max` with a "+n" chip for the rest. */
export function statusIconRowHtml(
  game: StatusGame,
  ids: readonly StatusId[],
  statuses: Partial<Record<string, { turnsRemaining?: number | null; charges?: number | null; stacks?: number } | undefined>>,
  max: number,
): string {
  const shown = ids.slice(0, max);
  const more = ids.length - shown.length;
  const icons = shown.map((s) => statusIconHtml(game, s, { count: iconCountOf(s, statuses[s]) })).join('');
  return icons + (more > 0 ? `<span class="sti sti--more" title="${ids.slice(max).map(statusName).join(', ')}">+${more}</span>` : '');
}
