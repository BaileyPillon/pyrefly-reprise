/**
 * **The Dark Aeons' ids, formation table and registry status** (FFX only; the hidden Mirror Aeons chapter; `docs/plans/ch-mirror-aeons-review.md` section 4). The Dark aeons' AI is `./dark-aeons.ts` (written from the
 * reverse-engineering session's note `research/re-ffx-dark-aeons.md`) and the player's Yojimbo and Magus Sisters are the same session's lane FFX-K (`../adapt/yojimbo.ts`, `../adapt/sisters.ts`, `../aeon-commands.ts`); this
 * file is the place both share the ids and the formation table. The battle layer imports no `src/data` (hard rule 1), so the ids and the formation table are copied here and
 * `tests/unit/chapters/mirror-aeons-data.test.ts` pins that the copies equal `data/ffx/mirror-aeons-ids.ts`.
 *
 * | What | Where |
 * |---|---|
 * | **The four scripts and the dog** (ids `DARK_SCRIPTS`) | registered by `./dark-aeons.ts`, imported in `./index.ts`; they branch on the flag `DARK_BATTLE_ID_FLAG` |
 * | **The starting state** (every sister's gauge, Dark Yojimbo's, the dog taking no turns) | written by `./dark-aeons-setup.ts` from `DARK_FORMATIONS` below, once, when the battle is built (100 per sister in the two trios, RE note 2.5 and 5.1; 0 elsewhere) |
 * | **Dark Yojimbo's tier fill** (+6, +10, +16, +20, +26 a turn, +2 per hit) | published as the flag `DARK_GAUGE_PER_TURN_FLAG`; his script adds it after every turn of his own, Zanmato's included |
 * | **The dog's bite** | the order row's `extra.orderedAim` (`../orders.ts`): the bite's victim is the note's stream-4 pick |
 *
 * **Not modelled:** the ambushed start of the first Yojimbo tier (the monster's own write lands after the opening counters and changes the intro only: RE note 2.2, 4.1; the bench starts every fight normal).
 *
 * `darkAeonsSeamStatus` answers "which scripts are registered" from the live registry, and `tests/unit/chapters/mirror-aeons-seams.test.ts` is the record of it (a half-registered set fails loudly).
 */

import { getAiScript } from './types.ts';


/** The AI script ids the four Dark enemies and the dog carry (`data/ffx/mirror-aeons-ids.ts`). */
export const DARK_SCRIPTS = {
  cindy: 'dark-sister-cindy',
  sandy: 'dark-sister-sandy',
  mindy: 'dark-sister-mindy',
  yojimbo: 'dark-yojimbo',
  daigoro: 'dark-daigoro',
} as const;

/** The combatant ids (`data/ffx/mirror-aeons-ids.ts`). */
export const DARK_IDS = {
  cindy: 'dark-cindy',
  sandy: 'dark-sandy',
  mindy: 'dark-mindy',
  yojimbo: 'dark-yojimbo',
  daigoro: 'dark-daigoro',
} as const;

/** The flags `applyDarkAeonsSetup` publishes on `BattleState.flags` for the scripts: the game's battle id, and (Dark Yojimbo only) the gauge each of his turns adds. */
export const DARK_BATTLE_ID_FLAG = 'dark.battleId';
export const DARK_GAUGE_PER_TURN_FLAG = 'dark.gaugePerTurn';

/** One formation as the battle layer sees it: the game's battle id, who stands in it, every sister's starting gauge, and (Yojimbo) the tier's per-turn fill. */
export interface DarkFormation {
  readonly battleId: number;
  readonly startGauge: number;
  readonly gaugePerTurn?: number;
}

/** Group id to formation: RE section 3 (battle ids, trio start gauges) and section 4.1 (the tier fill). Copies of `data/ffx/mirror-aeons-ids.ts`, pinned equal by a test. */
export const DARK_FORMATIONS: Readonly<Record<string, DarkFormation>> = {
  'mirror-sisters-kino00_70': { battleId: 0x00dc0046, startGauge: 100 },
  'mirror-sisters-kino01_70': { battleId: 0x00dd0046, startGauge: 100 },
  'mirror-sisters-kino01_71': { battleId: 0x00dd0047, startGauge: 0 },
  'mirror-sisters-kino01_72': { battleId: 0x00dd0048, startGauge: 0 },
  'mirror-sisters-kino05_70': { battleId: 0x00e10046, startGauge: 0 },
  'mirror-sisters-kino05_71': { battleId: 0x00e10047, startGauge: 0 },
  'mirror-sisters-kino00_70-g0': { battleId: 0x00dc0046, startGauge: 0 }, // OUR adjustment: the faithful trio's battle id with the gauges started at 0 (`SISTER_ADJUSTED_FORMATIONS`)
  'mirror-yojimbo-nagi05_70': { battleId: 0x01ae0046, startGauge: 0, gaugePerTurn: 6 },
  'mirror-yojimbo-nagi05_71': { battleId: 0x01ae0047, startGauge: 0, gaugePerTurn: 10 },
  'mirror-yojimbo-nagi05_72': { battleId: 0x01ae0048, startGauge: 0, gaugePerTurn: 16 },
  'mirror-yojimbo-nagi05_73': { battleId: 0x01ae0049, startGauge: 0, gaugePerTurn: 20 },
  'mirror-yojimbo-nagi05_74': { battleId: 0x01ae004a, startGauge: 0, gaugePerTurn: 26 },
};

/** Which seams are filled right now, read from the live registry. */
export interface DarkSeamStatus {
  /** The three sister scripts registered. */
  readonly sisters: boolean;
  /** Dark Yojimbo's script registered. */
  readonly yojimbo: boolean;
  /** The dog's script registered (its bite on Yojimbo's order). */
  readonly daigoro: boolean;
}

export function darkAeonsSeamStatus(): DarkSeamStatus {
  return {
    sisters: [DARK_SCRIPTS.cindy, DARK_SCRIPTS.sandy, DARK_SCRIPTS.mindy].every((id) => getAiScript(id) !== undefined),
    yojimbo: getAiScript(DARK_SCRIPTS.yojimbo) !== undefined,
    daigoro: getAiScript(DARK_SCRIPTS.daigoro) !== undefined,
  };
}

/** True when every Dark script the chapter names is registered (the bench's gate). Partial sets are `false`; the seams test fails on them. */
export function darkScriptsLanded(): boolean {
  const s = darkAeonsSeamStatus();
  return s.sisters && s.yojimbo;
}
