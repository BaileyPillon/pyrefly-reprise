/**
 * Layout choices for the results panel that depend on how much it has to
 * print: the ITEMS row's size and the ledger's and party list's density.
 * DOM-free, re-exported from `./resultsMath.ts` (split out for the 400-line
 * house rule, AGENTS.md rule 7). Both games.
 */

/**
 * Past this many characters the ITEMS row is set a size down
 * (`.rres__v--items-long`), so a long list still fits the ledger's two-line
 * budget instead of running into the party rows below it.
 */
export const ITEMS_LONG_CHARS = 26;

/** How tightly the ledger and the party list are set. See {@link resultsDensity}. */
export interface ResultsDensity {
  ledger: 'normal' | 'compact';
  party: 'normal' | 'compact' | 'tight';
}

/*
 * The two blocks' geometry in the 640x360 design units `results.css` is written
 * in: the ledger hangs from 152, the party list stands on 360 - 24.89. A ledger
 * row is about 36 units (25.34 compact); a member row is its face plus the gap.
 */
const LEDGER_TOP = 152;
const PARTY_BOTTOM = 360 - 24.89;
const LEDGER_ROW = { normal: 36, compact: 25.34 } as const;
const MEMBER_ROW = { normal: [21.33, 5.33], compact: [16, 2.67], tight: [13.33, 1.78] } as const;

/**
 * How much taller a two-line `.rres__v--items-long` row measures than an
 * ordinary `LEDGER_ROW` entry, keyed by ledger level (measured live in
 * Chrome at 640x360, `docs/screenshots/results/drops-four-fixed.png`'s repro:
 * a normal-ledger row already budgets more than a wrapped items row needs
 * (its smaller font more than pays for the second line), so `normal` gets no
 * extra; a **compact** row does not, and a wrapped items line measured
 * ~27.35 units against the compact budget's 25.34 — about 2 units short.
 * Rounded up for a margin of error across fonts/renderers instead of hugging
 * the exact measured value.
 */
const ITEMS_LONG_EXTRA = { normal: 0, compact: 2.5 } as const;

/**
 * The loosest setting at which the party list does not climb into the ledger.
 *
 * Both are absolute blocks, so a fourth member (a switch-in earns AP in FFX)
 * pushed the list up through the ITEMS row: Macalania's results, critic pass on
 * 62b4927. The ledger gives way first (it already had a compact form for
 * FFX-2's four rows), then the member rows. Both games.
 *
 * `itemsLong` (the same `dropsLabel(...).length > ITEMS_LONG_CHARS` test
 * `ledgerValueClass` uses) tells this the ITEMS row may wrap to the two lines
 * `.rres__v--items-long`'s `-webkit-line-clamp: 2` allows, which a **compact**
 * ledger's smaller row budget does not fully cover (`ITEMS_LONG_EXTRA`) — a
 * five-drop haul (`Ability Distiller, Silver Hourglass, Lightning Marble,
 * Tetra Elemental, Speed Distiller`) at four party members measured a 1.4-unit
 * clearance without this term, thin enough that a different font stack could
 * lose it. Folding the extra into the same search this function already runs
 * lets a long list step down to a tighter party density exactly like a fifth
 * or sixth member does, rather than trusting a coincidental fit.
 */
export function resultsDensity(ledgerRows: number, members: number, itemsLong = false): ResultsDensity {
  const partyHeight = (level: ResultsDensity['party']): number => {
    const [face, gap] = MEMBER_ROW[level];
    return face * members + gap * Math.max(0, members - 1);
  };
  for (const party of ['normal', 'compact', 'tight'] as const) {
    for (const ledger of ['normal', 'compact'] as const) {
      if (ledger === 'normal' && ledgerRows > 3) continue;
      const ledgerHeight =
        LEDGER_ROW[ledger] * ledgerRows + (itemsLong ? ITEMS_LONG_EXTRA[ledger] : 0);
      if (LEDGER_TOP + ledgerHeight <= PARTY_BOTTOM - partyHeight(party)) return { ledger, party };
    }
  }
  return { ledger: 'compact', party: 'tight' };
}

/** The ledger value's classes: a count, the ITEMS list, or a long ITEMS list. */
export function ledgerValueClass(items: string | null): string {
  if (items === null) return 'rres__v';
  return `rres__v rres__v--items${items.length > ITEMS_LONG_CHARS ? ' rres__v--items-long' : ''}`;
}
