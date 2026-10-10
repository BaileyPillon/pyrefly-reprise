/**
 * **The Left Fin and the Right Fin** (Sin, links 1 and 2): constants, flags, setup, runtime marks and
 * `SIN_FINS_ASSUMPTIONS`.
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 5 (m136, m137 and Cid's order machinery m149 in `ssbt00_00`
 * and `ssbt01_00`, run in the note's interpreter over every draw and over all 16,384 buff layouts; re-parity AI lane C), which
 * replaced `research/ffx-sin.md` §4 to §5.2's wiki-derived rules and the labelled estimates of
 * `docs/plans/sin-two-chapters-plan.md` §2.3. The turn and the `onHit` are `./sin-fins.ts`; the scores and the Negation list are
 * `./sin-negation.ts`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3]: CTB, Cid's Trigger Command, aeons, the airship range. Every
 * function returns early without a Fin on the field, so no other battle changes (the FFX golden hashes).
 *
 * ## The shape
 *
 * ```
 * Both Fins open FAR (distance 3; their init writes it). Tidus or Rikku queue an order; Cid flies it on his next turn. No missiles.
 * Every hit event on the Fin (an action that reaches it, after its last hit, a miss too): its counter rises 1, or 2 while an aeon
 *   holds the field; its Negation roll follows (FAR: mod 100 < 80 with Mental Break; NEAR: the score).
 * Left  NEAR regular turn: GetRandomValue mod 3 <= hits, a draw every time -> Ram (33.334 / 66.667 / 100 % after 0 / 1 / 2+ hits)
 *       FAR: Smack above 6 hits, else motionless
 * Right NEAR: Ram above 3 hits, or always once latched; FAR: Smack above 4 hits (above 2 once latched); latched below 16,250 HP
 * NEAR only: three regular turns, "Core gathers energy.", then Gravija; a charge that resolves at FAR is the do-nothing Gravija.
 * ```
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, rtOf, tryActor } from '../state.ts';
import { AIRSHIP_ORDER, AIRSHIP_RANGE, ORDER_RANK, RANGED_WEAPON_ACTORS, REDUNDANT_ORDER_BURNS_TURN, markEvraeRuntime } from './evrae-rules.ts';
import { AIRSHIP_COUNTS_TARGETINGS } from './overdrive-sin-rules.ts';
import {
  SIN_CID_ID,
  SIN_FIN_CHARGED,
  SIN_FIN_HITS,
  SIN_FIN_IDS,
  SIN_FIN_LATCHED,
  SIN_FIN_NEGATION_GUARD,
  SIN_FIN_REGULAR_ACTS,
  SIN_LEFT_FIN_SCRIPT,
  SIN_NEGATION_TAKEN,
  SIN_RIGHT_FIN_SCRIPT,
} from './sin-ids.ts';

export * from './sin-negation.ts';

// ---------------------------------------------------------------------------
// The script's thresholds (the hit counter `v8` is tested as `> T`, so a hit count of T + 1 or more attacks)
// ---------------------------------------------------------------------------

/** m136 @0x2d7: the Left Fin's Ram test is `GetRandomValue() mod 3 <= hits`, a draw on every NEAR regular turn. */
export const LEFT_RAM_MODULUS = 3;
/** m136: the Left Fin Smacks at FAR once hit more than 6 times (7 or more). */
export const LEFT_FAR_HITS = 7;
/** m137: the Right Fin Rams at NEAR once hit more than 3 times (4 or more), no draw. */
export const RIGHT_NEAR_HITS = 4;
/** m137: the Right Fin Smacks at FAR once hit more than 4 times (5 or more). */
export const RIGHT_FAR_HITS = 5;
/** m137 @0x445: below `maxHP / 4` = 16,250 (strict) its phase flag is set, and never cleared. */
export const RIGHT_LATCH_HP = 16_250;
/** m137: latched, the FAR Smack needs only more than 2 hits (3 or more). */
export const RIGHT_LATCHED_FAR_HITS = 3;
/** m136, m137: regular NEAR turns (`v7` 0 to 2) before "Core gathers energy." (`v7` 3). */
export const REGULAR_ACTS_BEFORE_CHARGE = 3;
/** m136, m137 @0x47c: an aeon 8 to 14 on the field makes a hit event worth this much on the counter (else 1). */
export const AEON_HIT_WEIGHT = 2;
/** The Fins open FAR: their init writes BattleDistance := 3 (note 5.1). */
export const FINS_OPEN_RANGE: 'near' | 'far' = 'far';

/**
 * **Estimates and owner decisions carried by the Fin fights**, as data, so the handoff, the guide and the tests can print them.
 * (The wiki-derived rules of the old list — S-8, S-12, negation-slots, S-19, S-25, S-27, right-latch — are the script's now.)
 *
 * `seam-lineup` is package S's (REVIEW must-change 6): `BattleScreenSetup.carryFfx` keeps the build's `activeIds`, so links 2 and 3
 * reopen with **Tidus, Yuna and Auron in front**, whoever ended the previous link there. Research §1.2 is silent on it. It decides
 * who stands in front at FAR, which members Negation's slot weights read, and who is in front to give Cid orders. **Our
 * estimate**; bench B measures both readings.
 */
export const SIN_FINS_ASSUMPTIONS: ReadonlyArray<{ id: string; claim: string; value: unknown }> = [
  {
    id: 'seam-lineup',
    claim: "Links 2 and 3 reopen with the build's opening line-up (Tidus, Yuna, Auron), not the last link's front row (our estimate; research §1.2 is silent)",
    value: 'build',
  },
  {
    id: 'S-20',
    claim: "The game offers one Trigger Command at a time (Pull back at NEAR, Move in at FAR, Cancel while an order is pending); ours keeps two rows with 'last order wins' until Bailey says yes to a menu change (rule 9)",
    value: false,
  },
  {
    id: 'aeon-reach-far',
    claim: "At FAR an aeon's physical does not reach the Fin and its magic does, as the engine's reach gate decides for Evrae (the exact reach table would also admit the aeons' special commands)",
    value: 'engine-reach-gate',
  },
  { id: 'C-7', claim: "Carried from Evrae: an order is rank 3 and a redundant one still burns Cid's turn", value: { rank: ORDER_RANK, redundantBurns: REDUNDANT_ORDER_BURNS_TURN } },
];

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Setup and runtime marks
// ---------------------------------------------------------------------------

/**
 * Open the Fin fight: the ship FAR, no order queued, the counters at zero, and Evrae's marks (Cid a non-combatant, Wakka's
 * reach) through `markEvraeRuntime`. No missile rack is published (Cid fires none here). The formation has no start hook, so
 * the opening is the engine's. A no-op in every other battle.
 */
export function applySinFinsSetup(ctx: Ctx): void {
  const fin = finOnField(ctx);
  if (!fin) return;
  ctx.state.flags[AIRSHIP_RANGE] = FINS_OPEN_RANGE;
  ctx.state.flags[AIRSHIP_ORDER] = '';
  ctx.state.flags[AIRSHIP_COUNTS_TARGETINGS] = fin.id; // which Fin the HUD's plate names (sinHudModel.ts)
  ctx.state.flags[SIN_FIN_HITS] = 0;
  ctx.state.flags[SIN_FIN_REGULAR_ACTS] = 0;
  ctx.state.flags[SIN_FIN_CHARGED] = false;
  ctx.state.flags[SIN_FIN_LATCHED] = false;
  ctx.state.flags[SIN_FIN_NEGATION_GUARD] = false;
  ctx.state.flags[SIN_NEGATION_TAKEN] = '{}';
  for (const id of [fin.id, SIN_CID_ID, ...RANGED_WEAPON_ACTORS]) if (tryActor(ctx, id)) rtOf(ctx, id);
  markEvraeRuntime(ctx.state.flags, ctx.rt.actors);
}

/**
 * The runtime marks the Fin fights need, read off the published flags alone so a rebuilt preview runtime (`simulate.ts`) gets
 * them too: Cid takes no part in victory. A no-op without the Fin flags.
 */
export function markSinFinsRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (flags[SIN_FIN_HITS] === undefined) return;
  const cid = actors.get(SIN_CID_ID);
  if (cid) cid.nonCombatant = true;
}
