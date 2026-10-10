/**
 * **Overdrive Sin** (link 4 of the assault from the *Fahrenheit*): the clock, the pulls, Gaze, and the scripted Game Over
 * (re-parity AI lane C, **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 7 (m140 in `ssbt03_00`, run in the note's interpreter for its
 * first 14 turns and the Gaze counter for the party, an aeon and the Magus Sisters), which replaced `research/ffx-sin.md` §3.4
 * and §5.4's wiki-derived clock. The plan it is built to is `docs/concepts/chapters/sin-2026-09-27/README.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3]: CTB, aeons, the airship range, a turn clock ending in a scripted
 * Game Over. Nothing here is imported by `src/battle/ffx2/**`.
 *
 * ## The shape (the script's)
 *
 * ```
 * Sin's turns 1, 2, 3   "Drawn to Sin."  The ship's distance is 3 at the start and after pull 1, 1 after pull 2 (Use, the
 *                       items and Wakka's reels reach, melee does not), 0 after pull 3 (D-32).
 * turns 4 .. 11         the mouth opens in stages; no action (a pose), a rank-3 turn each.
 * turn 12               Giga-Graviton, then a scripted Game Over that Auto-Life and an aeon on the field cannot stop (D-31).
 * any hit event         Gaze: the count rises by 1 on EVERY hit event, from the first; once the pulls are over it fires above
 *                       5 with the party in front (a draw picks Zombie, Petrify or Confuse) or above 2 with an aeon 8 to 14
 *                       on the field (D-33).
 * ```
 *
 * ## Reuse of the Evrae range state
 *
 * The FAR/NEAR gap is Evrae's `state.flags['airship.range']`, read by `targeting.ts#reachesFoesAtRange`, so what reaches at
 * FAR is the Evrae research §4.3 (Blk and Wht Magic, Lancet, long-range rows, Wakka's blitzball). The distance after pull 2
 * is `airship.distance` = 1. There is **no Trigger Command** in this link (§3.5 `[verified: 3 sources]`): `airshipOrderAvailable`
 * refuses an order when Cid is not on the field, and Cid is not in this formation (`overdrive_sin` = [sin_3]).
 *
 * ## What stays an estimate or an owner decision
 *
 * | # | What | Status |
 * |---|---|---|
 * | S-1 | Giga-Graviton on Sin's turn **12** | **settled by the script** (it was the owner's placeholder 13, D-280, "to be corrected after a Steam check"; D-266) |
 * | — | The mouth's stage over the melee turns | presentation only, our estimate ({@link mouthStage}) |
 */

import { type Ctx, tryActor } from '../state.ts';
import { AIRSHIP_RANGE, markEvraeRuntime } from './evrae-rules.ts';
import { applyBossOpening } from './opening.ts';

// ---------------------------------------------------------------------------
// Ids — duplicated from the data file on purpose: `src/battle/**` must not
// import `src/data/**`.
// ---------------------------------------------------------------------------

export const OVERDRIVE_SIN_ID = 'overdrive-sin';
export const OVERDRIVE_SIN_SCRIPT = 'overdrive-sin';
export const OVERDRIVE_SIN_GROUP_ID = 'overdrive-sin';

export const SIN_DRAWN = 'overdrive-sin-drawn';
export const SIN_GAZE_PETRIFY = 'overdrive-sin-gaze-petrify';
export const SIN_GAZE_CONFUSE = 'overdrive-sin-gaze-confuse';
export const SIN_GAZE_ZOMBIE = 'overdrive-sin-gaze-zombie';
export const SIN_GAZE_AEON = 'overdrive-sin-gaze-aeon';
export const SIN_GIGA_GRAVITON = 'overdrive-sin-giga-graviton';

// ---------------------------------------------------------------------------
// The script's numbers
// ---------------------------------------------------------------------------

/** Turns 1, 2 and 3 are "Drawn to Sin." (the pulls). */
export const PULL_TURNS = 3;

/**
 * **S-1, settled by the script (D-31): Giga-Graviton is Sin's 12th turn**: 3 pulls, 8 mouth turns (4 to 11), then it fires. The
 * owner's placeholder was 13 (D-280, "our estimate, to be corrected after a Steam check"; the check D-266 asked for is answered
 * by the script, which the note ran).
 */
export const GIGA_GRAVITON_TURN = 12;
/** The other source's reading, kept as a name for the HUD's estimate line (off: `sinHudModel.ts#S1_OPEN`). */
export const GIGA_GRAVITON_TURN_GESTAHL = 12;

/** With the party in front the Gaze fires when the count is above this (6 hit events). */
export const GAZE_THRESHOLD = 6;
/** With an aeon 8 to 14 on the field it fires above this (3 hit events). */
export const GAZE_AEON_THRESHOLD = 3;
/** The party Gaze's three variants by `GetRandomValue() mod 3`: Zombie 21,846, Petrify 21,845, Confuse 21,845 of 65,536. */
export const GAZE_VARIANTS: readonly string[] = [SIN_GAZE_ZOMBIE, SIN_GAZE_PETRIFY, SIN_GAZE_CONFUSE];

/** The ship's distance at the start and after pull 1; after pull 2 it is {@link DISTANCE_AFTER_PULL_TWO}; after pull 3, 0. */
export const DISTANCE_AT_START = 3;
export const DISTANCE_AFTER_PULL_TWO = 1;

/** The estimates, as data, so the handoff, a guide and the tests can print them. */
export const OVERDRIVE_SIN_ASSUMPTIONS = [
  { id: 'S-1', claim: "Giga-Graviton on Sin's 12th turn (the script; D-280's placeholder was 13)", value: GIGA_GRAVITON_TURN },
] as const;

// ---------------------------------------------------------------------------
// Battle-scoped flags (every key prefixed `sin.`; nothing else writes one)
// ---------------------------------------------------------------------------

/** Sin's own turns taken so far (the clock). */
export const SIN_TURN = 'sin.turn';
/** The turn Giga-Graviton comes on; read from here so a bench can measure another length. */
export const SIN_LAST_TURN = 'sin.gigaGravitonTurn';
/** Sin's turns left before Giga-Graviton, for the HUD clock. */
export const SIN_TURNS_LEFT = 'sin.turnsLeft';
/** The Gaze count (`v3`): +1 on every hit event, zeroed when the Gaze fires. */
export const SIN_GAZE = 'sin.gazeCounter';
/** 0 during the pulls, 1-3 opening, 4 fully open (presentation, our estimate). */
export const SIN_MOUTH = 'sin.mouthStage';
/** Tells the Sin HUD which enemy is the counted foe in a battle without Evrae (the Fin plate reads it too). */
export const AIRSHIP_COUNTS_TARGETINGS = 'airship.countsTargetings';
/** The ship's BattleDistance as the reach gate reads it: 3, 1 or 0. Absent outside Sin's face, where the range alone decides. */
export const AIRSHIP_DISTANCE = 'airship.distance';

function num(ctx: Ctx, key: string, fallback = 0): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** True while this battle is Overdrive Sin's. */
export function isOverdriveSinBattle(ctx: Ctx): boolean {
  return ctx.state.flags[SIN_TURN] !== undefined;
}

/** The turn Giga-Graviton comes on in this battle (S-1). */
export function gigaGravitonTurn(ctx: Ctx): number {
  return num(ctx, SIN_LAST_TURN, GIGA_GRAVITON_TURN);
}

/**
 * The mouth's stage on Sin's turn `n` of `last` (presentation only, our estimate): 0 through the pulls; stages 1, 2, 3 spread
 * evenly over the melee turns; 4, "fully open", on the turn before Giga-Graviton (the wiki gallery's order, no turn numbers
 * sourced).
 */
export function mouthStage(n: number, last: number): number {
  if (n <= PULL_TURNS) return 0;
  if (n >= last - 1) return 4;
  const melee = Math.max(1, last - 1 - PULL_TURNS - 1);
  return Math.min(3, 1 + Math.floor(((n - PULL_TURNS - 1) * 3) / melee));
}

// ---------------------------------------------------------------------------
// Setup — called once from `setup.ts#buildBattle`; a no-op in every other battle
// ---------------------------------------------------------------------------

/**
 * Open the clock and the gap. The fight opens with the ship FAR, distance 3 (the pulls are what close it). Wakka's blitzball
 * reaches across it; the mark is made by `markEvraeRuntime`, which a rebuilt preview runtime calls too. The formation's start
 * hook (D-14): Sin at CTB 0 and each party counter one tick later.
 */
export function applyOverdriveSinSetup(ctx: Ctx): void {
  const sin = tryActor(ctx, OVERDRIVE_SIN_ID);
  if (!sin || sin.enemy?.aiScriptId !== OVERDRIVE_SIN_SCRIPT) return;
  ctx.state.flags[AIRSHIP_RANGE] = 'far';
  ctx.state.flags[AIRSHIP_DISTANCE] = DISTANCE_AT_START;
  ctx.state.flags[AIRSHIP_COUNTS_TARGETINGS] = OVERDRIVE_SIN_ID;
  ctx.state.flags[SIN_TURN] = 0;
  ctx.state.flags[SIN_LAST_TURN] = GIGA_GRAVITON_TURN;
  ctx.state.flags[SIN_TURNS_LEFT] = GIGA_GRAVITON_TURN;
  ctx.state.flags[SIN_GAZE] = 0;
  ctx.state.flags[SIN_MOUTH] = 0;
  markEvraeRuntime(ctx.state.flags, ctx.rt.actors);
  applyBossOpening(ctx, [OVERDRIVE_SIN_ID]);
}
