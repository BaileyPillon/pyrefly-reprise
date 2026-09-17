/**
 * Status chips for the FFX-2 party rows.
 *
 * The row used to abbreviate a status by slicing its id — `'curse'.slice(0, 2)`
 * gave `CU`, which reads as a rendering fault rather than as a status, and the
 * Up/Down family collapsed into five identical pairs (`ST`, `MA`, `DE`, `AC`,
 * `EV`) because they all share their first two letters with their opposite.
 *
 * So the glyphs are authored, not derived: three characters at most (the chip
 * is 10px tall at the 640x360 authoring grid, per `research/visual-bible.md`
 * §4.3's "10x10 px chips"), with the stack arrows carrying the Up/Down sign so
 * `STR▲` and `STR▼` can never be confused for each other. Anything not in the
 * table falls back to the first three letters, which is only ever reached by a
 * status this table has not caught up with — and three letters of a real word
 * still reads as a word.
 */

import type { StatusId } from '../../battle/common/types.ts';

/** Short glyph per status. Uppercase, <= 3 characters plus an optional arrow. */
const GLYPHS: Partial<Record<StatusId, string>> = {
  // shared, X-2 rules
  ko: 'KO',
  petrify: 'PTR',
  poison: 'PSN',
  silence: 'SIL',
  sleep: 'SLP',
  darkness: 'DRK',
  slow: 'SLW',
  haste: 'HST',
  berserk: 'BSK',
  confuse: 'CNF',
  doom: 'DOM',
  curse: 'CRS',
  eject: 'EJT',
  protect: 'PRO',
  shell: 'SHL',
  reflect: 'RFL',
  regen: 'RGN',
  'auto-life': 'LIF',
  // X-2 only, positive
  invincible: 'INV',
  'null-magic': 'NUM',
  'null-physical': 'NUP',
  spellspring: 'SPR',
  'str-up': 'STR▲',
  'mag-up': 'MAG▲',
  'def-up': 'DEF▲',
  'mdef-up': 'MDF▲',
  'accu-up': 'ACC▲',
  'eva-up': 'EVA▲',
  'luck-up': 'LCK▲',
  // X-2 only, negative
  stop: 'STP',
  itchy: 'ITC',
  pointless: 'EXP0',
  'str-down': 'STR▼',
  'mag-down': 'MAG▼',
  'def-down': 'DEF▼',
  'mdef-down': 'MDF▼',
  'accu-down': 'ACC▼',
  'eva-down': 'EVA▼',
  'luck-down': 'LCK▼',
};

/** Statuses that help. Everything else chips in the warning colour. */
const GOOD = new Set<string>([
  'haste', 'protect', 'shell', 'reflect', 'regen', 'auto-life', 'invincible',
  'null-magic', 'null-physical', 'spellspring',
  'str-up', 'mag-up', 'def-up', 'mdef-up', 'accu-up', 'eva-up', 'luck-up',
]);

/**
 * Hidden bookkeeping statuses the engine uses to carry an instantaneous effect.
 * They never sit on a combatant long enough to mean anything to a player, and
 * `shattering` in particular is documented as a hidden consequence of Petrify.
 */
const HIDDEN = new Set<string>(['delay-effect', 'action-cancel', 'shattering']);

export interface StatusChip {
  id: string;
  glyph: string;
  good: boolean;
  /** Stack level for the Up/Down family (0-10); 0 elsewhere. Drawn as a superscript. */
  stacks: number;
}

/**
 * The chips one party row should draw, capped at `max`.
 *
 * §4.3 allows five; this row is capped at **four** because it is 170px wide
 * rather than the spec's 348px (the panel shrank when it moved off the actors —
 * see `ffx2-hud.css`), and a fifth three-letter chip is what starts pushing the
 * MP figure out of the row again.
 */
export function statusChipsFor(
  statuses: Partial<Record<string, { stacks?: number }>>,
  max = 4,
): StatusChip[] {
  const out: StatusChip[] = [];
  for (const id of Object.keys(statuses)) {
    if (HIDDEN.has(id)) continue;
    const glyph = GLYPHS[id as StatusId] ?? id.slice(0, 3).toUpperCase();
    out.push({ id, glyph, good: GOOD.has(id), stacks: statuses[id]?.stacks ?? 0 });
    if (out.length >= max) break;
  }
  return out;
}

/** `title` doubles as the full name on hover, so the glyph never has to carry it alone. */
export function statusChipsHtml(chips: StatusChip[]): string {
  return chips
    .map((c) => {
      const level = c.stacks > 0 ? `<i>${c.stacks}</i>` : '';
      const mod = c.good ? ' ffx2-status-chip--good' : '';
      return `<span class="ffx2-status-chip${mod}" title="${c.id}">${c.glyph}${level}</span>`;
    })
    .join('');
}
