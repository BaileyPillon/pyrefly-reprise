/**
 * **Evrae, on the foredeck of the *Fahrenheit*** — the airship range state, the
 * queued order, the missile economy, the two phases and the three counters.
 *
 * Source: `research/ffx-evrae-airship.md` §2 (Cid), §3 (the action rows), §4
 * (the distance mechanic), §5 (the AI script). The paper preflight this track
 * was built to is `docs/plans/chapter-evrae-review.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. §0.4 of the research fences it in
 * as many words: the airship distance mechanic "has no X-2 counterpart", and
 * neither do Trigger Commands, the three-active / three-reserve bench or the
 * `Use` economy this fight is balanced around. Nothing here is imported by
 * `src/battle/ffx2/**` or `src/data/ffx2/**`; the absence test is
 * `tests/unit/chapters/evrae-engine.test.ts`. The *capabilities* the script
 * leans on — the non-combatant turn-taker, the reach gate, the trigger-id
 * dispatch, the status-landed counter hook, the targeted counter — are general
 * additive plumbing in `src/battle/ffx/**` and are "both" per
 * `critic/CHECKS.md` CHK-020, but every one of them is inert until
 * `state.flags['airship.range']` exists, which only this encounter sets.
 *
 * ---
 *
 * ## The shape
 *
 * ```
 * One boolean: the ship is NEAR Evrae or FAR from it. It opens NEAR.
 *
 * NEAR  Evrae: Attack, Attack, Inhale, Poison Breath, loop.
 *       Player: everything reaches.  Cid: does nothing.
 * FAR   Evrae: Photon Spray (8 hits, a fresh target each).
 *       Player: magic, Lancet and Wakka's physical attacks reach. Nothing else.
 *       Cid: fires one of three Guided Missile volleys.
 *
 * A Trigger Command from Tidus or Rikku costs THAT CHARACTER'S TURN, is queued,
 * and is executed on CID'S NEXT TURN instead of a volley. Last order wins.
 * One course change therefore costs one party turn + one Cid turn + one volley.
 *
 * phase 2 at HP < 10,667: Evrae Hastes itself (recovery 30 -> 15 AND the
 *       pending counter halved), stops using Stone Gaze, and answers being
 *       targeted at FAR with Swooping Scythe, which drags it back to NEAR.
 * ```
 *
 * **§4.5 is the encounter's best rule.** In phase 2 the Poison Breath dodge
 * fails *because you attacked*: targeting Evrae at all while FAR makes it Swoop
 * and close, so the breath resolves. The correct play is to do nothing, on
 * purpose.
 *
 * ## Owner-approved decisions carried by this file
 *
 * Bailey, 2026-09-21 ("Yes to all recommendations", "Yes to these too"). Each is
 * **AUTHORED**, not canon, and each is one line from being flipped. See
 * {@link EVRAE_ASSUMPTIONS}.
 *
 * | # | Decision | Switch |
 * |---|---|---|
 * | C-7 / G-1 | A Trigger Command is rank 3 | {@link ORDER_RANK} |
 * | C-7 / G-2 | A redundant order still burns Cid's turn | {@link REDUNDANT_ORDER_BURNS_TURN} |
 * | C-12 / G-5 | Swooping Scythe is phase 2 only | {@link SWOOP_PHASE_TWO_ONLY} |
 * | C-1 / G-3 | Aggro counter 6, +1 magic / +2 physical, resets on fire, once per action | {@link GAZE_THRESHOLD} and friends |
 * | C-14 / G-8 | **Keep** the Reflected self-Haste — it lands on a random party member | {@link KEEP_REFLECTED_SELF_HASTE} |
 * | C-13 / G-7 | **Do not** ship "delaying Evrae advances the Haste phase" | {@link DELAY_ADVANCES_HASTE_PHASE} |
 * | C-4 | Threaten defaults to immune | `threatenChance: 0` in the data file |
 *
 * The two order ids are `'pull-back'` and `'close-in'`, exactly as the owner
 * named them. **Player-facing labels are deliberately NOT set here**: the order
 * widget is C-11, a new interface flavour that needs a mockup and Bailey's
 * approval before anything renders it [AGENTS.md rule 9].
 */

import type { CombatantId, FFXCombatant, StatusId } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, rtOf, tryActor } from '../state.ts';

// ---------------------------------------------------------------------------
// Ids — duplicated from the data file on purpose: `src/battle/**` must not
// import `src/data/**` (the engine is handed its content through the registry).
// ---------------------------------------------------------------------------

export const EVRAE_ID = 'evrae';
/** `turnQueue.ts#tieBreakRank` already ranks the id `'cid'` last [ffx-combat-core §1.6]. */
export const CID_ID = 'cid';
export const EVRAE_GROUP_ID = 'evrae-airship';

export const EVRAE_SCRIPT = 'evrae';
export const CID_SCRIPT = 'cid-fahrenheit';

/** The two Trigger Command ids [owner, 2026-09-21]. Labels come with the widget. */
export const ORDER_PULL_BACK = 'pull-back';
export const ORDER_CLOSE_IN = 'close-in';

/** §4.2 [verified: 3 sources] — Tidus and Rikku, and only them. */
export const ORDER_OWNERS: readonly CombatantId[] = ['tidus', 'rikku'];

/** §4.3 [verified: 2 sources] — the blitzball is a ranged weapon, a *character* property. */
export const RANGED_WEAPON_ACTORS: readonly CombatantId[] = ['wakka'];

// ---------------------------------------------------------------------------
// Sourced constants
// ---------------------------------------------------------------------------

/** §1.1 [verified: 2 sources]. */
export const EVRAE_MAX_HP = 32_000;
/** §5.4 [verified: 2 sources] — 1/3 of the bar; the wiki states the figure itself. */
export const HASTE_THRESHOLD = 10_667;
/** §4.6 [verified: 2 sources] — three volleys, then an announcement, then silence. */
export const MISSILE_COUNT = 3;
/** §4.4 — Attack, Attack, Inhale, Poison Breath [verified: 2 sources]. */
export const NEAR_CYCLE_LENGTH = 4;

/** Ability ids this script selects; the data file must ship all seven. */
export const EVRAE_ATTACK = 'evrae-attack';
export const EVRAE_SWOOPING_SCYTHE = 'evrae-swooping-scythe';
export const EVRAE_POISON_BREATH = 'evrae-poison-breath';
export const EVRAE_STONE_GAZE = 'evrae-stone-gaze';
export const EVRAE_PHOTON_SPRAY = 'evrae-photon-spray';
export const EVRAE_INHALE = 'evrae-inhale';
export const EVRAE_OUT_OF_BREATH_RANGE = 'evrae-out-of-breath-range';
export const EVRAE_HASTE = 'evrae-haste';
export const CID_GUIDED_MISSILES = 'cid-guided-missiles';

// ---------------------------------------------------------------------------
// AUTHORED decisions — owner-approved 2026-09-21, none of them canon
// ---------------------------------------------------------------------------

/**
 * **AUTHORED (C-7 / G-1).** The manoeuvre has **no action row at all** (§3.2),
 * so neither the Trigger Command's rank nor Cid's is in the data. Rank 3 is the
 * ordinary default and it is the reading that makes the three-resource cost
 * honest. This is the single number the fight's difficulty is most sensitive to
 * — R2 in the preflight — so it is a named constant from day one.
 */
export const ORDER_RANK = 3;

/**
 * **AUTHORED (C-7 / G-2).** Ordering "Close in" while already NEAR still
 * consumes Cid's turn, and therefore still costs a volley. `[derived]`; it is
 * the reading that keeps the cost honest.
 */
export const REDUNDANT_ORDER_BURNS_TURN = true;

/**
 * **AUTHORED (C-12 / G-5).** Swooping Scythe is **phase 2 only**. The wiki
 * frames it as phase-2 behaviour, GamerGuides lists it unqualified. §5.4's own
 * reasoning is the tie-breaker: phase-2-only gives the phase change a distinct
 * silhouette.
 */
export const SWOOP_PHASE_TWO_ONLY = true;

/**
 * **AUTHORED (C-1 / G-3).** The Stone Gaze aggro counter is `[single source:
 * wiki]` for the threshold and the increments, and the wiki says nothing at all
 * about the other three rules. All four are surfaced here rather than buried,
 * because §5.3's derived consequence — *fighting at range also slows the
 * petrify clock*, because FAR is magic-and-Wakka only, i.e. +1 a turn instead
 * of +2 — is only legible if the counter is visible.
 */
export const GAZE_THRESHOLD = 6;
export const GAZE_PHYSICAL = 2;
export const GAZE_MAGIC = 1;
export const GAZE_RESETS_ON_FIRE = true;
export const GAZE_COUNTS_MULTI_HIT_ONCE = true;

/**
 * **OWNER DECISION (C-14 / G-8), 2026-09-21: keep it.**
 *
 * Evrae's Haste is `affected_by_reflect` and self-targeted, and
 * `targeting.ts#reflectBounceTarget` picks a random living member of the
 * *opposite* side with no self-target special case — so Reflect on Evrae turns
 * its self-Haste into a **free Haste on a random party member**. No source
 * states it; it falls out of our own core [§6.5]. The owner chose to keep it,
 * so it is pinned by a test rather than left to chance. Suppressing it would be
 * a data change — drop `reflectable` from `evrae-haste` — not a code one.
 */
export const KEEP_REFLECTED_SELF_HASTE = true;

/**
 * **OWNER DECISION (C-13 / G-7), 2026-09-21: do not implement.**
 *
 * The wiki claims that delaying Evrae before 1/3 makes it enter the Haste phase
 * sooner, with the mechanism unstated. §5.6 is unambiguous that an invisible
 * penalty on the player's tempo tool "is a trap, not a decision". Evrae remains
 * the only boss in the anthology that can be delayed, and delaying it is purely
 * good for the player. Recorded, not shipped.
 */
export const DELAY_ADVANCES_HASTE_PHASE = false;

/**
 * **AUTHORED (C-1).** What counts as a "regular attack" for the aggro counter.
 * §5.3's own recommendation: "regular" most naturally excludes Cid's script
 * action and the utility commands, so Lancet, Steal, the Breaks and every
 * status-only command are out. Cid is excluded for free — `collectBossCounters`
 * returns early on an enemy-side attacker.
 */
export const REGULAR_ATTACK_CATEGORIES: readonly string[] = ['attack', 'blackmagic', 'skill', 'overdrive'];

/** The decisions, as data, so the guide and the end-state board can print them. */
export const EVRAE_ASSUMPTIONS = [
  { id: 'C-7', claim: 'A Trigger Command is rank 3', value: ORDER_RANK },
  { id: 'C-7b', claim: "A redundant order still burns Cid's turn", value: REDUNDANT_ORDER_BURNS_TURN },
  { id: 'C-12', claim: 'Swooping Scythe is phase 2 only', value: SWOOP_PHASE_TWO_ONLY },
  { id: 'C-1', claim: 'Stone Gaze aggro: 6, +1 magic / +2 physical, resets on fire, once per action', value: GAZE_THRESHOLD },
  { id: 'C-14', claim: 'Reflect turns the self-Haste into a free party Haste', value: KEEP_REFLECTED_SELF_HASTE },
  { id: 'C-13', claim: 'Delaying Evrae does NOT advance the Haste phase', value: DELAY_ADVANCES_HASTE_PHASE },
] as const;

// ---------------------------------------------------------------------------
// Battle-scoped flags, on `state.flags` so the HUD, a story trigger and the
// tactic can all read the airship state without reaching into engine internals.
// Every key is prefixed `airship.`; nothing outside this encounter writes one.
// ---------------------------------------------------------------------------

export const AIRSHIP_RANGE = 'airship.range';
export const AIRSHIP_ORDER = 'airship.order';
export const AIRSHIP_MISSILES = 'airship.missilesLeft';
export const AIRSHIP_OUT_OF_AMMO = 'airship.outOfAmmoAnnounced';
export const AIRSHIP_BREATH_CHARGED = 'airship.breathCharged';
export const AIRSHIP_PHASE = 'airship.phase';
export const AIRSHIP_HASTED = 'airship.hasted';
export const AIRSHIP_GAZE = 'airship.gazeCounter';
export const AIRSHIP_NEAR_STEP = 'airship.nearStep';
/** How many player actions have named Evrae, mirrored for the tactic and the HUD. */
export const AIRSHIP_TARGETINGS = 'airship.targetings';

export type Range = 'near' | 'far';

function num(ctx: Ctx, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** Which side of the sky the ship is on. `'near'` whenever the flag is unset. */
export function airshipRange(ctx: Ctx): Range {
  return ctx.state.flags[AIRSHIP_RANGE] === 'far' ? 'far' : 'near';
}

/** Phase 1 above 1/3 HP, phase 2 below it [§5.2, §5.4]. */
export function evraePhase(ctx: Ctx): 1 | 2 {
  return num(ctx, AIRSHIP_PHASE, 1) === 2 ? 2 : 1;
}

/** True while this battle is the Evrae encounter at all. A cheap guard. */
export function isEvraeBattle(ctx: Ctx): boolean {
  return ctx.state.flags[AIRSHIP_RANGE] !== undefined;
}

// ---------------------------------------------------------------------------
// Setup — called once from `setup.ts#buildBattle`; a no-op in every other battle
// ---------------------------------------------------------------------------

/**
 * Open the airship state and wire the two engine-internal capabilities this
 * encounter needs.
 *
 * - **Cid is a non-combatant.** He is on `side: 'enemy'` so he gets a CTB row
 *   and a tie-break rank, `untargetable` so he can never be selected, and
 *   `ActorRuntime.nonCombatant` so `engine.ts#checkEnd` does not wait for a
 *   410 HP man to die before awarding victory. Widening `Side` would have
 *   touched ~30 branch sites for one actor [preflight §4.2 E-1].
 * - **Wakka's blitzball is a ranged weapon** — a character property, not an
 *   action flag, so it lives on his runtime and is read only inside
 *   `targeting.ts#reachesAtRange` [§4.3, E-3].
 * - **Evrae counts being targeted**, which is what §4.5's Swooping Scythe
 *   reaction keys on. A miss and a status-only command both count; damage is
 *   not required.
 *
 * §4.1 `[single source: Jegged]` — the battle **opens at NEAR**.
 */
export function applyEvraeSetup(ctx: Ctx): void {
  const evrae = tryActor(ctx, EVRAE_ID);
  if (!evrae || evrae.enemy?.aiScriptId !== EVRAE_SCRIPT) return;

  ctx.state.flags[AIRSHIP_RANGE] = 'near';
  ctx.state.flags[AIRSHIP_ORDER] = '';
  ctx.state.flags[AIRSHIP_MISSILES] = MISSILE_COUNT;
  ctx.state.flags[AIRSHIP_OUT_OF_AMMO] = false;
  ctx.state.flags[AIRSHIP_BREATH_CHARGED] = false;
  ctx.state.flags[AIRSHIP_PHASE] = 1;
  ctx.state.flags[AIRSHIP_HASTED] = false;
  ctx.state.flags[AIRSHIP_GAZE] = 0;
  ctx.state.flags[AIRSHIP_NEAR_STEP] = 0;
  ctx.state.flags[AIRSHIP_TARGETINGS] = 0;

  for (const id of [EVRAE_ID, CID_ID, ...RANGED_WEAPON_ACTORS]) if (tryActor(ctx, id)) rtOf(ctx, id);
  if (tryActor(ctx, CID_ID)) rtOf(ctx, CID_ID).ai['missilesLeft'] = MISSILE_COUNT;
  markEvraeRuntime(ctx.state.flags, ctx.rt.actors);
}

/**
 * The three runtime marks this encounter needs (Evrae counts being targeted,
 * Cid is a non-combatant, Wakka's blitzball reaches), read off the published
 * state alone so **a rebuilt runtime gets them too**.
 *
 * `simulate.ts#runtimeFor` rebuilds the runtime a preview runs on from
 * `BattleState`, which does not carry `ActorRuntime`. Before this was shared,
 * the preview lost `rangedWeapon`, so Wakka's Attack at FAR (the one physical
 * swing that reaches, §4.3) previewed as nothing, the advisor's no-op guard
 * buried the chapter's own line under it, and a player following the card
 * stalled the fight at the stalemate guard on four seeds in five
 * (`tests/unit/chapters/evrae-advisor.test.ts`). A no-op in every other battle.
 */
export function markEvraeRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (flags[AIRSHIP_RANGE] === undefined) return;
  const evrae = actors.get(EVRAE_ID);
  if (evrae) evrae.countsPartyTargetings = true;
  const cid = actors.get(CID_ID);
  if (cid) cid.nonCombatant = true;
  for (const id of RANGED_WEAPON_ACTORS) {
    const rt = actors.get(id);
    if (rt) rt.rangedWeapon = true;
  }
}

// ---------------------------------------------------------------------------
// The queued order — the whole fight turns on it
// ---------------------------------------------------------------------------

/** True when submitting this order id right now would be accepted. */
export function airshipOrderAvailable(ctx: Ctx, talkerId: CombatantId): boolean {
  if (!isEvraeBattle(ctx)) return false;
  // §4.2 [verified: 3 sources] — Tidus and Rikku, and only them. A redundant
  // order stays legal on purpose: it is the cost that makes it a decision
  // [REDUNDANT_ORDER_BURNS_TURN].
  return ORDER_OWNERS.includes(talkerId);
}

/**
 * Queue an order. **Last order wins**, which falls straight out of a plain
 * assignment [§4.2, single source: wiki].
 *
 * It does **not** move the ship. Cid executes it on his next turn, in place of
 * a volley — that is the whole bargain.
 */
export function queueAirshipOrder(ctx: Ctx, talker: FFXCombatant, orderId: string): boolean {
  if (!airshipOrderAvailable(ctx, talker.id)) return false;
  const target: Range = orderId === ORDER_PULL_BACK ? 'far' : 'near';
  ctx.state.flags[AIRSHIP_ORDER] = target;
  return true;
}

/** The order waiting on Cid's next turn, if any. */
export function queuedOrder(ctx: Ctx): Range | null {
  const v = ctx.state.flags[AIRSHIP_ORDER];
  return v === 'far' || v === 'near' ? v : null;
}

/** Cid flies the manoeuvre. Consumes his turn whether or not the state changes. */
export function applyQueuedOrder(ctx: Ctx): void {
  const order = queuedOrder(ctx);
  if (order === null) return;
  ctx.state.flags[AIRSHIP_ORDER] = '';
  const redundant = airshipRange(ctx) === order;
  if (!redundant || REDUNDANT_ORDER_BURNS_TURN) {
    ctx.state.flags[AIRSHIP_RANGE] = order;
  }
}

/** Statuses the encounter's own copy reads; exported so the test can assert them. */
export const EVRAE_LANDABLE: readonly StatusId[] = ['slow', 'darkness', 'power-break', 'mental-break', 'reflect'];
