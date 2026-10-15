/**
 * **The seams for the reverse-engineering session's work** on the hidden Mirror Aeons chapter (FFX only; `docs/plans/ch-mirror-aeons-review.md` section 4). The chapter's lane writes **no boss AI and no summon
 * engine**; this file is where both plug in, and the one place that says which parts exist. The battle layer imports no `src/data` (hard rule 1), so the ids and the formation table are copied here and
 * `tests/unit/chapters/mirror-aeons-data.test.ts` pins that the copies equal `data/ffx/mirror-aeons-ids.ts`.
 *
 * ## What is RE's, and how it plugs in
 *
 * | Seam | Today | When it lands |
 * |---|---|---|
 * | **The Dark aeons' AI**: four scripts (one per Sister, one for Yojimbo) and the dog's bite | each enemy's `aiScriptId` is set (`DARK_SCRIPTS`); **no script is registered**, so the engine's own fallback is a plain Attack on the party (`ai/index.ts#chooseAiCommand`) | `registerAiScript(DARK_SCRIPTS.cindy, ...)` and the others, in a file RE adds and imports in `ai/index.ts`; the scripts branch on the game's **battle id**, which `applyDarkAeonsSetup` publishes as the flag `DARK_BATTLE_ID_FLAG` |
 * | **The starting state** the scripts' init writes (every sister's Overdrive gauge, Yojimbo's, the dog taking no turns) | written by `./dark-aeons-setup.ts`, from `DARK_FORMATIONS` below (100 per sister in the trio formations, RE section 4.2 and `research/re-ffx-dark-aeons.md` sections 2.5 and 5.1; 0 elsewhere: no script writes it, so the record's 0 stands, section 5.1 `[bytes]` `[run]`) | RE may replace it with the scripts' own init; the numbers are the same |
 * | **Dark Yojimbo's tier fill** (the gauge each of his turns adds: +6, +10, +16, +20, +26) | published as the flag `DARK_GAUGE_PER_TURN_FLAG` for the script to read | the script reads it |
 * | **Yuna's Yojimbo**: hire answer, compatibility, Pay, the free attack, the command roll, the first-action and knocked-out penalties (RE section 5.5, G08 section 3) | the aeon is in the build with the catalogue's four attack rows and Zanmato; `YOJIMBO_HIRE_ANSWER` and `YOJIMBO_START_COMPATIBILITY` are named estimates (`data/ffx/builds/mirror-aeons.ts`); **nothing reads them** | the engine's Yojimbo rules read the two constants |
 * | **Yuna's Magus Sisters**: one summon that brings three actors, orders, motivation, Combine powers, the wipe for three (RE sections 5.1 to 5.4, G08 section 6) | the three aeons are in the build with their own stats; the engine summons **one aeon** (`state.aeonId`), so the Sisters arrive one at a time through the ordinary summon | the three-aeon wiring over the kernel in `kernel/aeon-party.ts` |
 *
 * `darkAeonsSeamStatus` answers "which of these exist" from the live registry, and `tests/unit/chapters/mirror-aeons-seams.test.ts` has a block per seam that **skips until the seam is filled** and then runs by itself
 * (a half-registered set of scripts fails loudly instead).
 */

import { getAiScript } from './types.ts';

// TODO(RE) 1: register the four Dark scripts and the dog's (`registerAiScript(DARK_SCRIPTS.<name>, ...)`), branching on the flag `DARK_BATTLE_ID_FLAG`. The rule lists are in `research/re-ffx-dark-aeons.md`: the Sisters section 5.2, Dark Yojimbo sections 4.2 and 4.3, the dog section 4.4, and that note's corrections to the feasibility note (section 8 item 9: the Zanmato turn restarts the gauge at the tier's step, not at 0; Kozuka picks a random living front-line character). `tests/unit/chapters/mirror-aeons-seams.test.ts` then runs its sister and Yojimbo blocks by itself.
// TODO(RE) 2: Dark Yojimbo's tier fill is published as `DARK_GAUGE_PER_TURN_FLAG` (+6, +10, +16, +20, +26 a turn, +2 per hit taken: `research/re-ffx-dark-aeons.md` sections 4.2 and 4.3); the script reads it, the engine reads nothing.
// TODO(RE) 3: Yuna's Yojimbo (hire answer, compatibility, Pay, the free attack, the command roll, the penalties): `YOJIMBO_HIRE_ANSWER` and `YOJIMBO_START_COMPATIBILITY` in `data/ffx/builds/mirror-aeons.ts` are the two named values to read; `docs/handoff/ch-mirror-aeons.md` section 5 says what RE's lane FFX-K asks a build for when it lands.
// TODO(RE) 4: Yuna's Magus Sisters as ONE summon of three actors (orders, motivation, Combine powers, the wipe for three): today `state.aeonId` holds one aeon and the three arrive one at a time through the ordinary summon; the build will have to give the Sisters' start motivation (`docs/handoff/ch-mirror-aeons.md` section 5).
// TODO(RE) 5: the ambushed start of the first Yojimbo tier (`DARK_FORMATIONS['mirror-yojimbo-nagi05_70']`, `research/re-ffx-dark-aeons.md` sections 2.2 and 4.1), which changes the intro only.

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
