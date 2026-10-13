/**
 * PR-0295, PREP-A: the phone page of the four FFX-2 prep tabs (Dresspheres, Stats, Accessories, Items). FFX-2 only: it
 * has no Equipment or Overdrive tab, its stats are a function of (dressphere x level) only [ffx2-combat-core §5.1], and
 * its accent is pink (the shell repoints it). The FFX tabs' own views are `src/ui/ffx/party-prep/phoneViews.ts`.
 *
 * Every view is a pure function of a small model the panel builds from the numbers it already prints on the desktop
 * sheet (the engine's `dressphereStats()`, `accessoryEffect()`, the dressphere and Garment Grid tables, the bag), so the
 * phone page can never say what the desktop sheet does not. Nothing here is invented game data.
 */

import { escapeHtml } from '../../common/html.ts';
import {
  chipsHtml,
  deltaHtml,
  emptyHtml,
  gridHtml,
  itemRowHtml,
  lineHtml,
  noteHtml,
  sectionHtml,
  statRowHtml,
  subHeadHtml,
  tileHtml,
  whoHtml,
} from '../../common/prepPhoneKit.ts';
import { isOpen } from '../../common/prepPhoneFold.ts';

/** What the page remembers of each section: open or folded, by key (`prepPhoneFold.readOpen`). */
export type OpenState = ReadonlyMap<string, boolean>;

/** The line under the Stats page; the same words as the desktop sheet's (a test holds the two together). */
export const X2_STATS_NOTE = 'The dressphere and the level are the stats — all three girls are identical in the same sphere.';

/** The line under the Accessories page; the same words as the desktop sheet's. */
export const X2_ACCESSORY_NOTE = 'Accessories stop working inside a special dressphere.';

/** A girl's name line: name, level, and her job, which is the dressphere she is wearing. */
export function x2WhoHtml(o: { name: string; level: number; dressphere: string }): string {
  return whoHtml({ name: o.name, levelLabel: 'LV', level: o.level, role: o.dressphere.replace(/-/g, ' ') });
}

/** A dressphere as the tab draws it: its monogram, its job colour and its name. */
export interface SphereRef {
  abbr: string;
  colour: string;
  label: string;
}

// ------------------------------------------------------------- Dresspheres

/** The Garment Grid she carries: its name, what it does when equipped, its nodes (and where she stands) and its gates. */
export interface GridModel {
  name: string;
  equip: string;
  nodes: number;
  here: number;
  gates: ReadonlyArray<{ colour: string; passed: boolean }>;
}

export interface DresspheresPhone {
  who: { name: string; level: number; dressphere: string };
  worn: SphereRef & { commands: readonly string[] };
  learned: { names: readonly string[]; total: number; ap: readonly string[] };
  /** Null for a Grid the table has no row for. */
  grid: GridModel | null;
  owned: readonly SphereRef[];
}

function gridBody(g: GridModel): string {
  const nodes = Array.from({ length: g.nodes }, (_, i) => `<i class="prph-node${i === g.here ? ' is-here' : ''}"></i>`).join('');
  const gates = g.gates.length
    ? g.gates.map((x) => `<i class="prph-gate is-${escapeHtml(x.colour)}${x.passed ? ' is-passed' : ''}" title="${escapeHtml(x.colour)}${x.passed ? ' (passed)' : ''}"></i>`).join('')
    : '<span class="prph-line">no gates</span>';
  return `<div class="prph-strip">${nodes}<span class="prph-gates">${gates}</span></div>${lineHtml(g.equip)}`;
}

/** The Dresspheres tab: worn, learned, the Garment Grid and what else she owns, as four sections. */
export function x2DresspheresPhoneHtml(m: DresspheresPhone, open: OpenState): string {
  const commands = m.worn.commands.length ? m.worn.commands.join(' · ') : '—';
  const learnedLine = `${m.learned.names.length}/${m.learned.total}${m.learned.ap.length ? ` · ${m.learned.ap.join(' · ')}` : ''}`;
  const worn = sectionHtml({
    key: 'worn',
    label: 'WORN',
    aside: `LV ${m.who.level}`,
    titleHtml: `${tileHtml(m.worn.abbr, m.worn.colour)}<span>${escapeHtml(m.worn.label)}</span>`,
    digest: commands,
    open: isOpen(open, 'worn', true),
    body: lineHtml(commands),
  });
  const learned = sectionHtml({
    key: 'learned',
    label: 'LEARNED',
    aside: `${m.learned.names.length}/${m.learned.total}`,
    digest: learnedLine,
    open: isOpen(open, 'learned', true),
    body: (m.learned.ap.length ? lineHtml(m.learned.ap.join(' · ')) : '') + (m.learned.names.length ? chipsHtml(m.learned.names) : lineHtml('—')),
  });
  const grid = m.grid
    ? sectionHtml({
        key: 'grid',
        label: 'GARMENT GRID',
        title: m.grid.name,
        digest: `${m.grid.nodes} nodes · ${m.grid.equip}`,
        open: isOpen(open, 'grid', false),
        body: gridBody(m.grid),
      })
    : '';
  const owned = sectionHtml({
    key: 'owned',
    label: 'ALSO OWNED',
    aside: String(m.owned.length),
    digest: m.owned.length ? m.owned.map((o) => o.abbr).join(' · ') : 'none',
    open: isOpen(open, 'owned', false),
    body: m.owned.length
      ? `<div class="prph-owned">${m.owned.map((o) => `<span class="prph-own">${tileHtml(o.abbr, o.colour)}<span>${escapeHtml(o.label)}</span></span>`).join('')}</div>`
      : lineHtml('—'),
  });
  return x2WhoHtml(m.who) + worn + learned + grid + owned;
}

// ------------------------------------------------------------------- Stats

export interface StatsPhone {
  who: { name: string; level: number; dressphere: string };
  worn: { label: string };
  /** The worn block, in the desktop sheet's order (HP, MP, STR, MAG, DEF, MDEF, AGI, ACC, EVA, LUCK). */
  stats: ReadonlyArray<{ label: string; value: number }>;
  /** Every other dressphere she owns, each stat as the number she has now and what the sphere would change. */
  others: ReadonlyArray<SphereRef & { id: string; cells: ReadonlyArray<{ label: string; now: number; delta: number }> }>;
}

/** The Stats tab: the worn block, then every other dressphere as a folded row with how many stats it raises and lowers. */
export function x2StatsPhoneHtml(m: StatsPhone, open: OpenState): string {
  const worn = sectionHtml({
    key: 'worn',
    label: 'WORN',
    titleHtml: `${escapeHtml(m.worn.label)} · Lv ${m.who.level}`,
    digest: m.stats.map((s) => `${s.label} ${s.value}`).join(' · '),
    open: isOpen(open, 'worn', true),
    body: gridHtml(m.stats.map((s) => statRowHtml({ label: s.label, value: s.value }))),
  });
  const others = m.others
    .map((o) => {
      const up = o.cells.filter((c) => c.delta > 0).length;
      const down = o.cells.filter((c) => c.delta < 0).length;
      return sectionHtml({
        key: `s:${o.id}`,
        label: o.label,
        open: isOpen(open, `s:${o.id}`, false),
        style: `--job:${o.colour}`,
        head:
          `${tileHtml(o.abbr, o.colour)}<span class="prph-nm">${escapeHtml(o.label)}</span>` +
          `<span class="prph-ud"><span class="prph-ud__up">&#9650;${up}</span> <span class="prph-ud__dn">&#9660;${down}</span></span>`,
        body: gridHtml(
          o.cells.map(
            (c) => `<div class="prph-cell"><span class="prph-l">${escapeHtml(c.label)}</span><span class="prph-v"><em>${c.now}</em>${deltaHtml(c.delta)}</span></div>`,
          ),
        ),
      });
    })
    .join('');
  return (
    x2WhoHtml(m.who) +
    worn +
    (m.others.length ? subHeadHtml(`OTHER DRESSPHERES · ${m.others.length}`) + others : '') +
    noteHtml(X2_STATS_NOTE)
  );
}

// ------------------------------------------------------------- Accessories

export interface AccessoriesPhone {
  who: { name: string; level: number; dressphere: string };
  /** Two slots: null when empty, otherwise the accessory's name and its effect, one `STAT +N` part each (empty: no modelled effect). */
  slots: ReadonlyArray<{ name: string; parts: readonly string[] } | null>;
}

/** The Accessories tab: two slots, each a section with the accessory's name and one row per effect. */
export function x2AccessoriesPhoneHtml(m: AccessoriesPhone, open: OpenState): string {
  const sections = m.slots
    .map((slot, i) => {
      const key = `slot${i + 1}`;
      if (!slot) {
        return sectionHtml({ key, label: `SLOT ${i + 1}`, aside: 'EMPTY', digest: 'empty', open: isOpen(open, key, true), body: lineHtml('empty') });
      }
      const rows = slot.parts.length
        ? slot.parts
            .map((p) => {
              const cut = p.lastIndexOf(' ');
              return cut > 0 ? statRowHtml({ label: p.slice(0, cut), value: p.slice(cut + 1) }) : lineHtml(p);
            })
            .join('')
        : lineHtml('no modelled effect');
      return sectionHtml({ key, label: `SLOT ${i + 1}`, title: slot.name, digest: slot.parts.join(' · ') || 'no modelled effect', open: isOpen(open, key, true), body: rows });
    })
    .join('');
  return x2WhoHtml(m.who) + sections + noteHtml(X2_ACCESSORY_NOTE);
}

// ------------------------------------------------------------------- Items

/** The Items tab: the party bag, one row a kind, then the gil. Party-wide, so no name line. */
export function x2ItemsPhoneHtml(rows: ReadonlyArray<{ name: string; count: number }>, gil: number, open: OpenState): string {
  const total = rows.reduce((n, r) => n + r.count, 0);
  const bag = rows.length
    ? sectionHtml({
        key: 'items',
        label: 'ITEMS',
        aside: `${rows.length} KIND${rows.length === 1 ? '' : 'S'}`,
        digest: `${total} IN THE BAG`,
        open: isOpen(open, 'items', true),
        body: rows.map((r) => itemRowHtml(r.name, r.count)).join(''),
      })
    : emptyHtml('No items.');
  return bag + `<div class="prph-bar"><span class="prph-k">GIL</span><span class="prph-bar__v">${escapeHtml(gil.toLocaleString())}</span></div>`;
}
