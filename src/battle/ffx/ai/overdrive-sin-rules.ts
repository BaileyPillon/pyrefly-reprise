/**
 * **Overdrive Sin** (link 4 of the assault from the *Fahrenheit*): the clock,
 * the pulls, Gaze, and the scripted Game Over.
 *
 * Source: `research/ffx-sin.md` §3.4 (the rows), §5.4 (the clock and Gaze, with
 * the reference pseudocode this file follows) and §10 (the open conflicts). The
 * plan it is built to is `docs/concepts/chapters/sin-2026-09-27/README.md`
 * (concept A reached through B: link 4 first, unlisted behind a switch).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3]: CTB, aeons, the
 * airship range, a turn clock ending in a scripted Game Over. Nothing here is
 * imported by `src/battle/ffx2/**`.
 *
 * ## The shape
 *
 * ```
 * Sin's turns 1, 2, 3   "Drawn to Sin."  The ship is FAR: only Wakka, magic and
 *                       long-range rows reach (Evrae's reach gate, reused).
 *                       After the third pull the ship is NEAR.
 * turns 4 .. LAST-1     the mouth opens in stages; no action row (a pose).
 * turn LAST             Giga-Graviton, then a scripted Game Over that Auto-Life
 *                       and an aeon on the field cannot stop.
 * any time              Gaze, as a counter, after six party targetings (an
 *                       aeon's count double): the whole party, one status.
 * ```
 *
 * ## Reuse of the Evrae range state
 *
 * The FAR/NEAR gap is Evrae's `state.flags['airship.range']`, read by
 * `targeting.ts#reachesFoesAtRange`, so what reaches at FAR is exactly §4.3 of
 * the Evrae research (Blk and Wht Magic, Lancet, long-range rows, Wakka's
 * blitzball), which is what §5.4 here says ("Wakka, magic and long-range rows
 * only") `[verified: 5 sources]` for the three pulls. There is **no Trigger
 * Command** in this link (§3.5 `[verified: 3 sources]`): `airshipOrderAvailable`
 * refuses an order when Cid is not on the field, and Cid is not in this
 * formation (`overdrive_sin` = [sin_3], §0 header `[decompiled]`).
 *
 * ## Owner decisions and estimates carried here (each one line from flipping)
 *
 * | # | What | Switch | Status |
 * |---|---|---|---|
 * | S-1 | Giga-Graviton on Sin's **13th** turn | {@link GIGA_GRAVITON_TURN} | **open**; our estimate after bover_87 (GameFAQs); Gestahl reads 12 ({@link GIGA_GRAVITON_TURN_GESTAHL}). Bailey: "13th by default"; the Steam check is his to schedule |
 * | S-16 | Which Gaze fires: uniform among Petrify / Confuse / Zombie | {@link GAZE_VARIANTS} | `[unsourced]`, our estimate |
 * | S-28 | Use and Wakka's Overdrive reach after the 2nd pull | not built | `[single source: Gestahl]`; Wakka's Overdrive reaches at FAR anyway (his blitzball) |
 * | — | An aeon's targeting counts 2 toward the six | {@link GAZE_AEON_WEIGHT} | our reading of "six times by the party, three times by an aeon" (§5.4 `[verified: 2 sources]`) |
 * | — | The six-count resets after each Gaze | {@link GAZE_RESETS_ON_FIRE} | `[derived]` from "every sixth attack" (§5.4) |
 * | — | Mouth stages over the melee turns | {@link mouthStage} | presentation only, our estimate (the wiki shows three stages and "fully open", no turn numbers) |
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { AIRSHIP_RANGE, markEvraeRuntime } from './evrae-rules.ts';

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
// Sourced constants and the labelled estimates
// ---------------------------------------------------------------------------

/** §5.4 [verified: 5 sources] — turns 1, 2 and 3 are "Drawn to Sin." at FAR. */
export const PULL_TURNS = 3;

/**
 * **S-1, OPEN.** Giga-Graviton on Sin's 13th turn: bover_87 (GameFAQs, the
 * Remaster-era guide) reads 3 approach + 9 opening, then Giga-Graviton. Our
 * estimate and Bailey's default (2026-09-27, "Giga-Graviton on Sin's 13th turn
 * by default"). Settled only by a check in the Steam HD Remaster.
 */
export const GIGA_GRAVITON_TURN = 13;
/** S-1's other reading: Gestahl counts 3 pulls + 7 + 1 full, "Sin's twelfth turn is Game Over". */
export const GIGA_GRAVITON_TURN_GESTAHL = 12;

/** §5.4 [verified: 2 sources — bover_87, wiki]: Gaze after six party targetings. */
export const GAZE_THRESHOLD = 6;
/** "three times by an aeon" (§5.4): an aeon's targeting counts double. Our reading. */
export const GAZE_AEON_WEIGHT = 2;
/** §5.4 [derived] from "every sixth attack". */
export const GAZE_RESETS_ON_FIRE = true;
/** S-16 `[unsourced]`: a uniform pick among the three party Gazes. Our estimate. */
export const GAZE_VARIANTS: readonly string[] = [SIN_GAZE_PETRIFY, SIN_GAZE_CONFUSE, SIN_GAZE_ZOMBIE];

/** The estimates, as data, so the handoff, a guide and the tests can print them. */
export const OVERDRIVE_SIN_ASSUMPTIONS = [
  { id: 'S-1', claim: "Giga-Graviton on Sin's 13th turn (open: 12 or 13)", value: GIGA_GRAVITON_TURN },
  { id: 'S-16', claim: 'Gaze picks Petrify, Confuse or Zombie uniformly (unsourced)', value: GAZE_VARIANTS.length },
  { id: 'S-28', claim: 'Use reaching after the 2nd pull is not built (single source)', value: false },
  { id: 'gaze-aeon', claim: 'An aeon targeting Sin counts 2 toward the six', value: GAZE_AEON_WEIGHT },
] as const;

// ---------------------------------------------------------------------------
// Battle-scoped flags (every key prefixed `sin.`; nothing else writes one)
// ---------------------------------------------------------------------------

/** Sin's own turns taken so far (the clock). */
export const SIN_TURN = 'sin.turn';
/** The turn Giga-Graviton comes on (S-1); read from here so a bench can measure 12 against 13. */
export const SIN_LAST_TURN = 'sin.gigaGravitonTurn';
/** Sin's turns left before Giga-Graviton, for the HUD clock. */
export const SIN_TURNS_LEFT = 'sin.turnsLeft';
/** The Gaze count toward {@link GAZE_THRESHOLD}. */
export const SIN_GAZE = 'sin.gazeCounter';
/** 0 during the pulls, 1-3 opening, 4 fully open (presentation, our estimate). */
export const SIN_MOUTH = 'sin.mouthStage';
/** Tells `markEvraeRuntime` which enemy counts party targetings in a battle without Evrae. */
export const AIRSHIP_COUNTS_TARGETINGS = 'airship.countsTargetings';

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
 * The mouth's stage on Sin's turn `n` of `last` (presentation only, our
 * estimate): 0 through the pulls; stages 1, 2, 3 spread evenly over the melee
 * turns; 4, "fully open", on the turn before Giga-Graviton (the wiki gallery's
 * order, no turn numbers sourced).
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
 * Open the clock and the gap. §5.4: the fight opens with the ship FAR
 * `[verified: 5 sources]` (the pulls are what close it). Wakka's blitzball
 * reaches across it and Sin counts being targeted (for Gaze); both marks are
 * made by `markEvraeRuntime`, which a rebuilt preview runtime calls too.
 */
export function applyOverdriveSinSetup(ctx: Ctx): void {
  const sin = tryActor(ctx, OVERDRIVE_SIN_ID);
  if (!sin || sin.enemy?.aiScriptId !== OVERDRIVE_SIN_SCRIPT) return;
  ctx.state.flags[AIRSHIP_RANGE] = 'far';
  ctx.state.flags[AIRSHIP_COUNTS_TARGETINGS] = OVERDRIVE_SIN_ID;
  ctx.state.flags[SIN_TURN] = 0;
  ctx.state.flags[SIN_LAST_TURN] = GIGA_GRAVITON_TURN;
  ctx.state.flags[SIN_TURNS_LEFT] = GIGA_GRAVITON_TURN;
  ctx.state.flags[SIN_GAZE] = 0;
  ctx.state.flags[SIN_MOUTH] = 0;
  markEvraeRuntime(ctx.state.flags, ctx.rt.actors);
}

// ---------------------------------------------------------------------------
// Gaze — collected from `ai/reactions.ts#collectBossCounters`
// ---------------------------------------------------------------------------

/**
 * §5.4's `onTargeted`, once per player-side action that named Sin (a miss and a
 * status-only command count; `overdrive.ts#onTargeted` bumps the count before
 * the first hit). An aeon's action counts {@link GAZE_AEON_WEIGHT}. At the
 * threshold Sin answers with Gaze: the aeon version while an aeon holds the
 * field, otherwise one of the three party versions (S-16).
 *
 * `collectBossCounters` has already refused an enemy-side attacker and a
 * counter's own action.
 */
export function collectOverdriveSinCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
): Array<{ actorId: CombatantId; abilityId: string; cause: string }> {
  if (!isOverdriveSinBattle(ctx)) return [];
  const sin = tryActor(ctx, OVERDRIVE_SIN_ID);
  if (!sin || !isAlive(sin)) return [];
  const rt = rtOf(ctx, OVERDRIVE_SIN_ID);
  const targetings = rt.partyTargetings ?? 0;
  const seen = typeof rt.ai['seenTargetings'] === 'number' ? (rt.ai['seenTargetings'] as number) : 0;
  rt.ai['seenTargetings'] = targetings;
  if (targetings <= seen) return [];

  const count = num(ctx, SIN_GAZE) + (attacker.side === 'aeon' ? GAZE_AEON_WEIGHT : 1);
  if (count < GAZE_THRESHOLD) {
    ctx.state.flags[SIN_GAZE] = count;
    return [];
  }
  ctx.state.flags[SIN_GAZE] = GAZE_RESETS_ON_FIRE ? 0 : count;
  const abilityId = ctx.state.aeonId !== null ? SIN_GAZE_AEON : ctx.rng.pick(GAZE_VARIANTS);
  return [{ actorId: OVERDRIVE_SIN_ID, abilityId, cause: 'script' }];
}
