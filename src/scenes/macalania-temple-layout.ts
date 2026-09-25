// ---------------------------------------------------------------------------
// Macalania Temple — the party layout options (Chapter VII, FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. The FFX Ink & Gold command stack
// covers the party at the first menu when the party stands on Chapter I's arc
// from before D-041 (the R13-04 / PR-0002 defect class). Bailey fixed that
// class twice with a layout pick (D-041, D-144); for Chapter VII the sheet is
// `docs/concepts/chapters/macalania/unlock/party-layout/` (current, A, B
// recommended, C), and the pick is still open (`MACALANIA_OPEN_PICKS`,
// 'party-layout', in `src/data/chapter-macalania-ship.ts`).
//
// Every option is built here as staging data, so the pick lands as ONE
// constant, {@link MACALANIA_PARTY_LAYOUT}. It stays `'current'` (today's
// staging, unchanged) until Bailey picks: AGENTS.md rules 9 and 10. The
// chapter is behind its lock line until then, and the ship-layer test refuses
// the unlock while this constant is still `'current'`.
//
// Staging only, no game data: positions are world units measured live on the
// sheet (`data-*.json`), not numbers from the game.

import type { SceneStaging } from './types.ts';

type Spot3 = [number, number, number];

/** The options on the party-layout sheet. */
export type MacalaniaPartyLayoutId = 'current' | 'a' | 'b' | 'c';

/** One option: the three active party slots (Tidus, Yuna, Rikku) and its staging switches. */
export interface MacalaniaPartyLayout {
  /** Slots 0-2, in the build's `activeSlots` order: Tidus, Yuna, Rikku. */
  readonly party: readonly [Spot3, Spot3, Spot3];
  /** The staging switches the option needs (`holdParty`, and `enemySpots` for B). */
  readonly staging: Pick<SceneStaging, 'holdParty' | 'enemySpots'>;
  /** What the sheet measured for it at the first menu, 1600x900 (README table). */
  readonly measured: string;
}

/**
 * The four options, exactly as staged and measured on the sheet
 * (`party-layout/layouts.json`, README "Options").
 */
export const MACALANIA_PARTY_LAYOUTS: Readonly<Record<MacalaniaPartyLayoutId, MacalaniaPartyLayout>> = {
  /** Today's: Chapter I's pre-D-041 arc, not held (the relaxation moves it each run). */
  current: {
    party: [
      [-1.55, 0, 1.55],
      [-2.95, 0, 0.25],
      [-1.05, 0, -1.05],
    ],
    staging: {},
    measured: 'Tidus 47% head+torso under the rows (vis 0.43), Yuna 64% (vis 0.27)',
  },
  /** A: the party re-laid right of the stack, held; the fiends stay where the solver puts them. */
  a: {
    party: [
      [-0.3, 0, 1.6],
      [-1.0, 0, -0.9],
      [0.8, 0, 0.3],
    ],
    staging: { holdParty: true },
    measured: 'party 0% under the rows; Yuna 0.42 and Guardian A 0.45 read as one cluster',
  },
  /** B (recommended on the sheet): A's arc spread, held, with the three fiends pinned one step right and back. */
  b: {
    party: [
      [0.0, 0, 1.8],
      [-0.9, 0, 0.2],
      [1.3, 0, 0.9],
    ],
    staging: {
      holdParty: true,
      enemySpots: {
        'guado-guardian-a': [1.0, 0, -3.6],
        'seymour-macalania': [2.5, 0, -5.8],
        'guado-guardian-b': [3.6, 0, -1.8],
      },
    },
    measured: 'party 0% under the rows (Yuna vis 0.65); Seymour whole-box 0.44, face and upper robe clear',
  },
  /** C: Chapter I's approved D-041 arc, copied as is, held. */
  c: {
    party: [
      [-1.31, 0, 1.55],
      [0.3, 0, 1.0],
      [-0.61, 0, -1.05],
    ],
    staging: { holdParty: true },
    measured: 'Tidus still 26% under the rows (vis 0.63); Rikku in front of Guardian A',
  },
};

/**
 * **The one line Bailey's pick changes.** `'current'` until the party-layout
 * pick is answered and recorded in `docs/target/decisions.json`; then the
 * picked id, and `'party-layout'` leaves `MACALANIA_OPEN_PICKS`.
 */
export const MACALANIA_PARTY_LAYOUT: MacalaniaPartyLayoutId = 'current';

/** The layout the scene stands on. */
export function macalaniaPartyLayout(id: MacalaniaPartyLayoutId = MACALANIA_PARTY_LAYOUT): MacalaniaPartyLayout {
  return MACALANIA_PARTY_LAYOUTS[id];
}
