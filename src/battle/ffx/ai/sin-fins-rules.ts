/**
 * **The Left Fin and the Right Fin** (Sin, links 1 and 2): constants, flags,
 * setup, counters, runtime marks and `SIN_FINS_ASSUMPTIONS`.
 *
 * Source: `research/ffx-sin.md` §4 (the range, Evrae's mechanic reused), §5.1
 * (the Left Fin, with the §5.1.4 pseudocode this file and `./sin-fins.ts` follow
 * step for step) and §5.2 (the Right Fin's differences). Plan:
 * `docs/plans/sin-two-chapters-plan.md` §2.3 and its REVIEW. Package S wrote the
 * signatures; package F filled them.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3]: CTB, Cid's Trigger
 * Command, aeons, the airship range. Every function returns early without a Fin
 * on the field, so no other battle changes (the FFX golden hashes).
 *
 * ## The shape
 *
 * ```
 * The ship opens FAR (S-8). Tidus or Rikku queue an order; Cid flies it on his
 * next turn (last order wins). Cid fires nothing (S-19).
 * Hits: every party action that names the Fin counts 1, an aeon's 2 (S-27);
 *       near and far share the count; it resets when the Fin attacks.
 * Left  NEAR attacks 33 / 67 / 100 % after 0 / 1 / 2+ hits (Ram, strong Delay)
 *       FAR  attacks from 7 hits (Smack); otherwise "Sin remains motionless."
 * Right NEAR from 4 hits, FAR from 5; under 16,250 HP it latches for good:
 *       NEAR always, FAR from 3.
 * NEAR only: 3 regular turns, "Core gathers energy.", then Gravija (75 % of
 *       current HP); a charge that resolves at FAR is the no-damage row.
 * Negation: a counter on being targeted (`./sin-negation.ts`, S-12).
 * ```
 *
 * ## Reuse of Evrae's range (FFX, `./evrae-rules.ts`)
 *
 * The setup publishes `airship.range`, `airship.order` and
 * `airship.countsTargetings`, so the reach gate (`targeting.ts#reachesFoesAtRange`),
 * the two order triggers, Wakka's ranged blitzball, Cid as a non-combatant and
 * the per-action targeting count all work unchanged through `markEvraeRuntime`.
 * The Evrae-only hooks stay inert: `applyEvraeSetup` and `runEvraePhaseHooks`
 * need Evrae on the field, `collectEvraeCounters` keys on the Evrae id, and the
 * missile rack (`airship.missilesLeft`) is never published here.
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, isAlive, livingFriendlies, rtOf, tryActor } from '../state.ts';
import { AIRSHIP_ORDER, AIRSHIP_RANGE, ORDER_RANK, RANGED_WEAPON_ACTORS, REDUNDANT_ORDER_BURNS_TURN, markEvraeRuntime } from './evrae-rules.ts';
import {
  SIN_CID_ID,
  SIN_FIN_CHARGED,
  SIN_FIN_HITS,
  SIN_FIN_IDS,
  SIN_FIN_LATCHED,
  SIN_FIN_NEGATION,
  SIN_FIN_NEGATION_FAR,
  SIN_FIN_REGULAR_ACTS,
  SIN_LEFT_FIN_SCRIPT,
  SIN_NEGATION_TAKEN,
  SIN_RIGHT_FIN_ID,
  SIN_RIGHT_FIN_SCRIPT,
  type SinCounter,
} from './sin-ids.ts';
import {
  NEGATION_DIVISOR_LEFT,
  NEGATION_DIVISOR_RIGHT,
  NEGATION_FAR_CHANCE,
  finNegationChance,
  publishNegationTaken,
} from './sin-negation.ts';

export * from './sin-negation.ts';

// ---------------------------------------------------------------------------
// Sourced constants
// ---------------------------------------------------------------------------

/** §5.1.1 [verified: 2 sources — bover_87, wiki]: the Left Fin's NEAR attack chance after 0, 1, 2+ hits (the wiki prints 66 for the middle one). */
export const LEFT_NEAR_ATTACK_CHANCE: readonly number[] = [0.33, 0.67, 1];
/** §5.1.1 [verified: 2 sources]: the Left Fin attacks at FAR only once hit this many times. */
export const LEFT_FAR_HITS = 7;
/** §5.2 [verified: 2 sources — wiki, bover_87]: the Right Fin at NEAR attacks only from this many hits. */
export const RIGHT_NEAR_HITS = 4;
/** §5.2 [verified: 2 sources]: the Right Fin at FAR attacks from this many hits. */
export const RIGHT_FAR_HITS = 5;
/** §5.2 [verified: 2 sources] for the line: below it (25 %) the Right Fin latches. */
export const RIGHT_LATCH_HP = 16_250;
/** §5.2 [single source: wiki]: latched, the FAR attack needs only this many hits. */
export const RIGHT_LATCHED_FAR_HITS = 3;
/** §5.2 [single source: wiki]: the latch holds even when healed back above the line. */
export const RIGHT_LATCH_STAYS = true;
/** §5.1.2 [verified: 3 sources]: regular NEAR actions before "Core gathers energy.". */
export const REGULAR_ACTS_BEFORE_CHARGE = 3;

// ---------------------------------------------------------------------------
// Labelled estimates (each one line from flipping)
// ---------------------------------------------------------------------------

/** **S-8 (our default):** the Fins open FAR. Gestahl says so explicitly; bover_87 is consistent (both GameFAQs). */
export const FINS_OPEN_RANGE: 'near' | 'far' = 'far';
/** **S-27 [single source: wiki]:** an aeon's action counts this many hits. */
export const AEON_HIT_WEIGHT = 2;
/** **S-25 [unsourced], our estimate:** the Gravija turn does not count toward the next three. */
export const GRAVIJA_COUNTS_AS_REGULAR = false;

/**
 * **Estimates carried by the Fin fights**, as data, so the handoff, the guide
 * and the tests can print them.
 *
 * `seam-lineup` is package S's (REVIEW must-change 6): `BattleScreenSetup.carryFfx`
 * keeps the build's `activeIds`, so links 2 and 3 reopen with **Tidus, Yuna and
 * Auron in front**, whoever ended the previous link there. Research §1.2 is
 * silent on it. It decides who stands in front at FAR, which members
 * Negation's leftmost and rightmost Protect weights read, and who is in front
 * to give Cid orders. **Our estimate**; bench B measures both readings.
 */
export const SIN_FINS_ASSUMPTIONS: ReadonlyArray<{ id: string; claim: string; value: unknown }> = [
  {
    id: 'seam-lineup',
    claim: "Links 2 and 3 reopen with the build's opening line-up (Tidus, Yuna, Auron), not the last link's front row (our estimate; research §1.2 is silent)",
    value: 'build',
  },
  { id: 'S-8', claim: 'The Fins open FAR (Gestahl explicit, bover_87 consistent; both GameFAQs; a labelled default)', value: FINS_OPEN_RANGE },
  {
    id: 'S-12',
    claim: "Negation's chance is the wiki's single-source formula as named tunables: NEAR max(0, c - 3) / 16 (Left) or / 12 (Right), FAR 80 % with Mental Break",
    value: { left: NEGATION_DIVISOR_LEFT, right: NEGATION_DIVISOR_RIGHT, far: NEGATION_FAR_CHANCE },
  },
  {
    id: 'negation-slots',
    claim: "Negation's 'rightmost' and 'leftmost' Protect weights read the last and first living member on the field (our estimate; may be a bitfield artefact, S-12)",
    value: 'slot-order',
  },
  { id: 'S-19', claim: 'Cid fires no missiles in the Fin fights: an unordered turn does nothing (Gestahl, single source)', value: 0 },
  { id: 'S-20', claim: "The wiki's 'cancel the previous order' is not built (single source; Q8)", value: false },
  { id: 'S-25', claim: 'The Gravija turn does not count toward the next three regular actions (unsourced, our estimate)', value: GRAVIJA_COUNTS_AS_REGULAR },
  { id: 'S-27', claim: "An aeon's action counts 2 on the Fins' hit counter (single source: wiki)", value: AEON_HIT_WEIGHT },
  {
    id: 'right-latch',
    claim: 'Latched Right Fin: FAR from 3 hits and the latch stays after healing (single source: wiki; the 16,250 line is verified: 2 sources)',
    value: { farHits: RIGHT_LATCHED_FAR_HITS, stays: RIGHT_LATCH_STAYS },
  },
  {
    id: 'aeon-reach-far',
    claim: "At FAR an aeon's physical does not reach the Fin and its magic does, as the engine's reach gate decides for Evrae (the sources are silent; REVIEW 13, Q list)",
    value: 'engine-reach-gate',
  },
  { id: 'C-7', claim: "Carried from Evrae: an order is rank 3 and a redundant one still burns Cid's turn", value: { rank: ORDER_RANK, redundantBurns: REDUNDANT_ORDER_BURNS_TURN } },
];

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

function num(ctx: Ctx, key: string): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : 0;
}

/** The Fin on the field in this battle (a Fin script on a Fin id), or `undefined`. */
export function finOnField(ctx: Ctx): FFXCombatant | undefined {
  for (const id of SIN_FIN_IDS) {
    const c = tryActor(ctx, id);
    const script = c?.enemy?.aiScriptId;
    if (c && (script === SIN_LEFT_FIN_SCRIPT || script === SIN_RIGHT_FIN_SCRIPT)) return c;
  }
  return undefined;
}

/** True while this battle is a Fin fight (the flags exist). */
export function isSinFinBattle(ctx: Ctx): boolean {
  return ctx.state.flags[SIN_FIN_HITS] !== undefined;
}

/** The Right Fin's latch (§5.2): set once it falls below the line, and it stays [single source: wiki]. */
export function updateRightFinLatch(ctx: Ctx, fin: FFXCombatant): boolean {
  if (fin.id !== SIN_RIGHT_FIN_ID) return false;
  if (ctx.state.flags[SIN_FIN_LATCHED] === true && RIGHT_LATCH_STAYS) return true;
  const latched = isAlive(fin) && fin.hp < RIGHT_LATCH_HP;
  ctx.state.flags[SIN_FIN_LATCHED] = latched;
  return latched;
}

// ---------------------------------------------------------------------------
// Setup and runtime marks
// ---------------------------------------------------------------------------

/**
 * Open the Fin fight: the ship FAR (S-8), no order queued, the Fin as the
 * counted foe, the counters at zero, and Evrae's marks (Cid a non-combatant,
 * Wakka's reach, the Fin counting targetings) through `markEvraeRuntime`.
 * No missile rack is published (S-19). A no-op in every other battle.
 */
export function applySinFinsSetup(ctx: Ctx): void {
  const fin = finOnField(ctx);
  if (!fin) return;
  ctx.state.flags[AIRSHIP_RANGE] = FINS_OPEN_RANGE;
  ctx.state.flags[AIRSHIP_ORDER] = '';
  ctx.state.flags['airship.countsTargetings'] = fin.id;
  ctx.state.flags[SIN_FIN_HITS] = 0;
  ctx.state.flags[SIN_FIN_REGULAR_ACTS] = 0;
  ctx.state.flags[SIN_FIN_CHARGED] = false;
  ctx.state.flags[SIN_FIN_LATCHED] = false;
  ctx.state.flags[SIN_NEGATION_TAKEN] = '{}';
  for (const id of [fin.id, SIN_CID_ID, ...RANGED_WEAPON_ACTORS]) if (tryActor(ctx, id)) rtOf(ctx, id);
  markEvraeRuntime(ctx.state.flags, ctx.rt.actors);
}

/**
 * The runtime marks the Fin fights need, read off the published flags alone so
 * a rebuilt preview runtime (`simulate.ts`) gets them too. `markEvraeRuntime`
 * (called first by `sin-setup.ts#markAirshipRuntime`) already makes every one of
 * them from `airship.range` and `airship.countsTargetings`; this re-asserts the
 * two the Fins cannot do without, so the Fin fight does not depend on that
 * order. A no-op without the Fin flags.
 */
export function markSinFinsRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (flags[SIN_FIN_HITS] === undefined) return;
  const counted = flags['airship.countsTargetings'];
  const fin = typeof counted === 'string' && SIN_FIN_IDS.includes(counted) ? actors.get(counted) : undefined;
  if (fin) fin.countsPartyTargetings = true;
  const cid = actors.get(SIN_CID_ID);
  if (cid) cid.nonCombatant = true;
}

// ---------------------------------------------------------------------------
// Counters: the hit counter and Negation
// ---------------------------------------------------------------------------

/**
 * The Fins' reactions to one player-side action (§5.1.4 `onTargeted`):
 *
 * 1. **The hit counter** (§5.1.1): +1 per action that named the Fin, +2 for an
 *    aeon's (S-27). A miss and a status-only command count (the Evrae count,
 *    bumped by `overdrive.ts#onTargeted` before the first hit).
 * 2. **The latch** (§5.2), checked as soon as a blow takes the Right Fin under.
 * 3. **Negation** (§5.1.3): NEAR, a roll at {@link finNegationChance} that
 *    strips both sides; FAR, 80 % with Mental Break, the Fin only.
 *
 * `collectBossCounters` has already refused an enemy-side attacker and a
 * counter's own action; `canCounter` drops the answer of a dead Fin.
 */
export function collectSinFinsCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
): SinCounter[] {
  void def;
  void damagedEnemyIds;
  if (!isSinFinBattle(ctx)) return [];
  const fin = finOnField(ctx);
  if (!fin || !isAlive(fin)) return [];
  updateRightFinLatch(ctx, fin);

  const rt = rtOf(ctx, fin.id);
  const targetings = rt.partyTargetings ?? 0;
  const seen = typeof rt.ai['seenTargetings'] === 'number' ? (rt.ai['seenTargetings'] as number) : 0;
  rt.ai['seenTargetings'] = targetings;
  if (targetings <= seen) return [];

  ctx.state.flags[SIN_FIN_HITS] = num(ctx, SIN_FIN_HITS) + (attacker.side === 'aeon' ? AEON_HIT_WEIGHT : 1);

  const chance = finNegationChance(ctx, fin.id);
  if (chance <= 0 || ctx.rng.next() >= chance) return [];
  const far = ctx.state.flags[AIRSHIP_RANGE] === 'far';
  publishNegationTaken(ctx, far ? [fin] : [...livingFriendlies(ctx), fin]);
  return [{ actorId: fin.id, abilityId: far ? SIN_FIN_NEGATION_FAR : SIN_FIN_NEGATION, cause: 'script' }];
}
