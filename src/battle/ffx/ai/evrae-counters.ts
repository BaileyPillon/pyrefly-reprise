/**
 * **Evrae's three answers** — the 1/3-HP self-Haste, the counter-Haste on Slow,
 * and Swooping Scythe on being targeted at range.
 *
 * Split out of `./evrae-rules.ts` for the 400-line house limit [AGENTS.md hard
 * rule 7], not because there is a seam in the design: everything here reads the
 * constants and flags that file owns, and `./evrae.ts` re-exports both so one
 * import reaches the whole encounter.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]; see `./evrae-rules.ts` for the
 * fence and the absence test.
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, rtOf, tryActor } from '../state.ts';
import { resolveAbility } from '../abilities.ts';
import {
  AIRSHIP_GAZE,
  AIRSHIP_HASTED,
  AIRSHIP_PHASE,
  AIRSHIP_RANGE,
  AIRSHIP_TARGETINGS,
  EVRAE_HASTE,
  EVRAE_ID,
  EVRAE_SWOOPING_SCYTHE,
  GAZE_COUNTS_MULTI_HIT_ONCE,
  GAZE_MAGIC,
  GAZE_PHYSICAL,
  GAZE_RESETS_ON_FIRE,
  GAZE_THRESHOLD,
  HASTE_THRESHOLD,
  REGULAR_ATTACK_CATEGORIES,
  SWOOP_PHASE_TWO_ONLY,
  airshipRange,
  evraePhase,
  isEvraeBattle,
} from './evrae-rules.ts';

function num(ctx: Ctx, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

// ---------------------------------------------------------------------------
// Phase hook — evaluated after every action, from `engine.ts#afterAction`
// ---------------------------------------------------------------------------

/**
 * The 1/3-HP self-Haste [§5.4, verified: 2 sources].
 *
 * A hook rather than a counter, because **Guided Missiles must trip it too**
 * `[single source: wiki]` and `collectBossCounters` deliberately returns early
 * on an enemy-side attacker. One implementation, both damage sources.
 *
 * It is cast as the real `evrae-haste` row rather than by attaching the status
 * directly, because the row is `reflectable` and that is the whole of C-14: on
 * a Reflected Evrae the Haste bounces onto a random living party member.
 * Resolving it here costs no CTB, which is exactly what `Counter Self` means.
 *
 * A no-op in every other battle.
 */
export function runEvraePhaseHooks(ctx: Ctx): void {
  if (!isEvraeBattle(ctx)) return;
  const evrae = tryActor(ctx, EVRAE_ID);
  if (!evrae || !isAlive(evrae)) return;
  if (evraePhase(ctx) === 2) return;
  if (evrae.hp >= HASTE_THRESHOLD) return;

  ctx.state.flags[AIRSHIP_PHASE] = 2;
  castEvraeHaste(ctx, evrae, 'threshold');
}

/** Evrae's `Counter Self` Haste — 0 CTB, out of turn order [§3.3 note 1]. */
export function castEvraeHaste(ctx: Ctx, evrae: FFXCombatant, cause: string): void {
  const def = ctx.content.ability(EVRAE_HASTE);
  if (!def) return;
  ctx.state.flags[AIRSHIP_HASTED] = true;
  ctx.emit({ type: 'counter', actorId: evrae.id, targetId: evrae.id, abilityId: EVRAE_HASTE, cause });
  resolveAbility(ctx, evrae, def, [evrae.id]);
}

// ---------------------------------------------------------------------------
// Counters — collected from `ai/reactions.ts#collectBossCounters`
// ---------------------------------------------------------------------------

/** §5.3 — what increments the petrify clock, and by how much. */
function gazeIncrement(def: AbilityDef): number {
  if (def.formula === 'none') return 0;
  if (!REGULAR_ATTACK_CATEGORIES.includes(def.category)) return 0;
  return def.damageType === 'physical' ? GAZE_PHYSICAL : GAZE_MAGIC;
}

/** True when the aggro counter has reached the threshold and Stone Gaze is due. */
export function stoneGazeDue(ctx: Ctx): boolean {
  return evraePhase(ctx) === 1 && num(ctx, AIRSHIP_GAZE, 0) >= GAZE_THRESHOLD;
}

/** Spend the aggro counter. `resetOnFire` is an AUTHORED tunable [C-1]. */
export function spendStoneGazeCounter(ctx: Ctx): void {
  if (GAZE_RESETS_ON_FIRE) ctx.state.flags[AIRSHIP_GAZE] = 0;
}

/**
 * Everything Evrae answers a **player** action with, in one place.
 *
 * `collectBossCounters` has already refused an enemy-side attacker, a counter's
 * own action and a Threatened enemy before this is reached, so all three of
 * those rules are inherited rather than re-implemented.
 *
 * Three answers, and one bookkeeping side effect:
 *
 * 1. **The aggro counter** (§5.3) — +2 for a regular physical, +1 for a regular
 *    magical, once per action however many hits it landed. It fires no command;
 *    Evrae spends it on its own next melee slot.
 * 2. **Counter-Haste on Slow** (§5.5, verified: 2 sources) — landing Slow on an
 *    already-Hasted Evrae is answered immediately. This is the reason the
 *    status-landed hook exists at all: Tidus's Slow uses the `ctb` formula and
 *    may or may not emit a `damage` event on the same action, so keying it off
 *    damage would have been seed-dependent [preflight §4.2 E-5].
 * 3. **Swooping Scythe on being targeted at FAR in phase 2** (§5.5, verified: 2
 *    sources) — and it **drags the fight back to NEAR**, which is §4.5's trap:
 *    the Poison Breath dodge fails because you attacked. Self-limiting, because
 *    the range it closes is the condition it fired on.
 */
export function collectEvraeCounters(
  ctx: Ctx,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
  statusAddedEnemyIds: readonly CombatantId[],
): Array<{ actorId: CombatantId; abilityId: string; cause: string }> {
  const out: Array<{ actorId: CombatantId; abilityId: string; cause: string }> = [];
  if (!isEvraeBattle(ctx)) return out;
  const evrae = tryActor(ctx, EVRAE_ID);
  if (!evrae || !isAlive(evrae)) return out;

  // How many player actions have named Evrae, counted by `overdrive.ts#onTargeted`
  // before the first hit resolves, so a miss and a status-only command count too.
  const rt = rtOf(ctx, EVRAE_ID);
  const targetings = rt.partyTargetings ?? 0;
  const seen = typeof rt.ai['seenTargetings'] === 'number' ? (rt.ai['seenTargetings'] as number) : 0;
  const wasTargeted = targetings > seen;
  rt.ai['seenTargetings'] = targetings;
  ctx.state.flags[AIRSHIP_TARGETINGS] = targetings;

  // 1. The petrify clock.
  if (damagedEnemyIds.includes(EVRAE_ID)) {
    const step = gazeIncrement(def);
    if (step > 0 && GAZE_COUNTS_MULTI_HIT_ONCE) {
      ctx.state.flags[AIRSHIP_GAZE] = num(ctx, AIRSHIP_GAZE, 0) + step;
    }
  }

  // 2. Slow landing on an already-Hasted Evrae.
  if (statusAddedEnemyIds.includes(EVRAE_ID) && ctx.state.flags[AIRSHIP_HASTED] === true && has(evrae, 'slow')) {
    castEvraeHaste(ctx, evrae, 'counter-slow');
  }

  // 3. Targeted while FAR in phase 2.
  const swoopLegal = !SWOOP_PHASE_TWO_ONLY || evraePhase(ctx) === 2;
  if (wasTargeted && swoopLegal && airshipRange(ctx) === 'far') {
    ctx.state.flags[AIRSHIP_RANGE] = 'near';
    out.push({ actorId: EVRAE_ID, abilityId: EVRAE_SWOOPING_SCYTHE, cause: 'script' });
  }
  return out;
}
