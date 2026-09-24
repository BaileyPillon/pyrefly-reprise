/**
 * **Chapter X — Seymour Natus and Mortibody: the rules the two scripts share.**
 *
 * Source: `research/ffx-seymour-natus-highbridge.md` §4 (the AI script),
 * `docs/plans/chapter-natus-review.md` §4.2 (the engine gaps N-G1 to N-G5)
 * and its Review section's corrections, and Bailey's answers to B6-B10
 * (2026-09-24, "I'll go with your recommendations for all").
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every key below lives under
 * `natus.` on `BattleState.flags`, and every function is a no-op unless the
 * Natus formation is on the board, so no other chapter changes.
 *
 * ## The phase is state, not HP (N-G2)
 *
 * `natus.phase` is stored, and only two things move it: **damage from an
 * action** (the counter collector, `reactions.ts`) and **Mortibsorption**
 * (the drain hook below). A Poison tick is neither, so Poison carrying him
 * past a line changes nothing until he is next hit — the rule that makes
 * "Poison and wait" a strategy [§4.2, verified: 2 sources for Poison, single
 * source for the drain half]. The scripts read the stored phase and never HP.
 *
 * - Phase 2 begins when his HP is **below 24,000**, phase 3 **below 12,000**:
 *   the wiki's word on both pages is "below" (the review corrected the
 *   research's `<=`).
 * - One action can cross both lines; both steps apply and the Protect counter
 *   fires **once**, on the first crossing [§4.6 `[estimate]`].
 * - **B8 = a (our estimate):** damage from *any* action moves the phase,
 *   including his own spells bounced back by Reflect (the Provoke + Reflect
 *   line). The wiki's rule is "direct damage"; the engine's other bosses
 *   answer the party only, so this is the one exception, and it is Natus's.
 */

import type { Command, CombatantId, ElementId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, tryActor } from '../state.ts';
import type { AiContext } from './types.ts';
import { use } from './types.ts';

/** Ids mirrored from `src/data/ffx/enemies/seymour-natus.ts` (the tests pin them equal). */
export const NATUS_ID = 'seymour-natus';
export const MORTIBODY_ID = 'mortibody';
export const NATUS_SCRIPT = 'seymour-natus';
export const MORTIBODY_SCRIPT = 'mortibody';

/** §4.1 + the review: phase 2 below this, phase 3 below {@link PHASE_3_BELOW}. */
export const PHASE_2_BELOW = 24_000;
export const PHASE_3_BELOW = 12_000;

/** Battle-scoped state, on `BattleState.flags` so a story trigger can read it. */
export const NATUS_PHASE = 'natus.phase';
/** Mortibody's place in the element rotation — its own key, not Macalania's `MAC_ELEMENT_STEP`. */
export const NATUS_ELEMENT_STEP = 'natus.elementStep';
/** The element Mortibody cast last: the combo Natus answers (N-G3). */
export const NATUS_LAST_ELEMENT = 'natus.lastElement';
/** Set once the 24,000 Protect counter has fired. */
export const NATUS_PROTECT_FIRED = 'natus.protectCountered';
/** Count of Talk lines spent, per character: `natus.talked.<id>`. */
const TALKED = 'natus.talked.';

type Element4 = Extract<ElementId, 'fire' | 'ice' | 'lightning' | 'water'>;

/**
 * **The phase-1 element order: Ice → Thunder → Water → Fire**, repeating
 * [§4.1 `[single source: GameFAQs]`, N-2]. Jegged says only "rotating through
 * each element". Built that way and labelled, per B7 = a; it is also Chapter
 * VII's sourced cycle.
 */
export const NATUS_ELEMENT_ORDER: readonly Element4[] = ['ice', 'lightning', 'water', 'fire'];

/** Mortibody's tier-1 row per element [§3.2]. */
export const MORTIBODY_TIER_ONE: Readonly<Record<Element4, string>> = {
  ice: 'mortibody-blizzard',
  lightning: 'mortibody-thunder',
  water: 'mortibody-water',
  fire: 'mortibody-fire',
};

/** Natus's Multi-ra row per element [§3.1]. */
export const NATUS_MULTI_RA: Readonly<Record<Element4, string>> = {
  ice: 'natus-multi-blizzara',
  lightning: 'natus-multi-thundara',
  water: 'natus-multi-watera',
  fire: 'natus-multi-fira',
};

export const NATUS_BREAK_ID = 'natus-break';
export const NATUS_FLARE_ID = 'natus-flare';
export const MORTIBODY_CLAW_ID = 'mortibody-shattering-claw';
export const MORTIBODY_DESPERADO_ID = 'mortibody-desperado';
export const MORTIBODY_CURA_ID = 'mortibody-cura';

/**
 * Every assumption this chapter's engine makes that no source settles, in one
 * place for the review and the tests. Each is labelled "our estimate" where a
 * player could read it.
 */
export const NATUS_ASSUMPTIONS = {
  /** N-2 / B7: the rotation order above is GameFAQs only. */
  elementOrder: 'single source (GameFAQs), built per B7 = a',
  /**
   * N-1 / B7: if Natus acts before Mortibody has cast in phase 1, he casts the
   * element the rotation is on (the one Mortibody would cast next).
   */
  natusFirst: 'our estimate (B7 = a)',
  /** B8 = a: his own reflected spells move his phase. */
  reflectedDamageMovesPhase: 'our estimate (B8 = a)',
  /** B6 = a: Desperado on Haste-on-all-three only; the buff-count ladder is not built. */
  desperadoTrigger: 'Haste on all three active members [verified: 3 sources]; ladder not built (B6 = a)',
  /** §4.1 special case (one spell when two are up and the left slot is KO'd): single source, not built. */
  oneSpellSpecialCase: 'not built (single source: wiki)',
} as const;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** True when the Natus formation is on the board at all. */
export function natusPresent(ctx: Ctx): boolean {
  return tryActor(ctx, NATUS_ID) !== undefined && ctx.state.enemyIds.includes(NATUS_ID);
}

/** The stored phase: 1 until an action (or the drain) moves it. Never read from HP. */
export function natusPhase(ctx: Ctx): 1 | 2 | 3 {
  const v = ctx.state.flags[NATUS_PHASE];
  return v === 2 || v === 3 ? v : 1;
}

/**
 * Move the stored phase after damage from an action or the drain. Returns the
 * counter it owes: **Protect on himself** the first time he crosses 24,000
 * [§4.1, §4.3, verified: 3 sources + the decompile's "Counter Self" target].
 */
export function stepNatusPhase(ctx: Ctx): Command[] {
  const natus = tryActor(ctx, NATUS_ID);
  if (!natus) return [];
  const out: Command[] = [];
  let phase = natusPhase(ctx);
  if (phase === 1 && natus.hp < PHASE_2_BELOW) {
    phase = 2;
    if (ctx.state.flags[NATUS_PROTECT_FIRED] !== true && isAlive(natus)) {
      ctx.state.flags[NATUS_PROTECT_FIRED] = true;
      out.push({ kind: 'ability', id: 'protect', targets: [natus.id] });
    }
  }
  if (phase === 2 && natus.hp < PHASE_3_BELOW) phase = 3;
  ctx.state.flags[NATUS_PHASE] = phase;
  return out;
}

/**
 * The counters one action owes Natus (the Protect at 24,000), for
 * `reactions.ts#collectBossCounters`. Empty unless the action actually damaged
 * him. Called before that collector's player-side guard, because B8 = a lets
 * his own reflected spells move the phase too.
 */
export function natusActionCounters(
  ctx: Ctx,
  damagedEnemyIds: readonly CombatantId[],
): { actorId: CombatantId; command: Command; cause: string }[] {
  if (!damagedEnemyIds.includes(NATUS_ID)) return [];
  return stepNatusPhase(ctx).map((command) => ({ actorId: NATUS_ID, command, cause: 'script' }));
}

// ---------------------------------------------------------------------------
// The combo, Desperado, Banish
// ---------------------------------------------------------------------------

/** The element the rotation is on: what Mortibody casts next [N-2]. */
export function rotationElement(ctx: Ctx): Element4 {
  const step = ctx.state.flags[NATUS_ELEMENT_STEP];
  const i = typeof step === 'number' ? step : 0;
  return NATUS_ELEMENT_ORDER[i % NATUS_ELEMENT_ORDER.length] as Element4;
}

/** Mortibody casts the rotation's element and steps it; Natus will answer in kind. */
export function castRotationElement(ctx: Ctx): Element4 {
  const e = rotationElement(ctx);
  const step = ctx.state.flags[NATUS_ELEMENT_STEP];
  ctx.state.flags[NATUS_ELEMENT_STEP] = (typeof step === 'number' ? step : 0) + 1;
  ctx.state.flags[NATUS_LAST_ELEMENT] = e;
  return e;
}

/**
 * The element Natus's Multi-ra uses: Mortibody's last spell (the combo,
 * [verified: 3 sources]); before Mortibody has cast, the rotation's current
 * element (N-1, our estimate).
 */
export function comboElement(ctx: Ctx): Element4 {
  const last = ctx.state.flags[NATUS_LAST_ELEMENT];
  if (typeof last === 'string' && (NATUS_ELEMENT_ORDER as readonly string[]).includes(last)) return last as Element4;
  return rotationElement(ctx);
}

/**
 * **Desperado is due** when all three active party members are Hasted
 * [§4.3, verified: 3 sources — wiki Mortibody, GameFAQs, Jegged]. B6 = a:
 * the wiki's 4-7-buff ladder (single source, what it counts unstated) is not
 * built. While an aeon holds the field the party is off-stage, so the rule
 * waits for them to return (our reading).
 */
export function desperadoDue(ctx: Ctx): boolean {
  if (ctx.state.aeonId) return false;
  const active = ctx.state.activeIds.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
  return active.length === 3 && active.every((c) => isAlive(c) && has(c, 'haste'));
}

/**
 * **Banish** once the aeon on the field has had its **one** turn [§4.3,
 * verified: 4 sources; the Chapter I gate `turnsTaken >= 1`]. Before that, he
 * takes a normal turn (aimed at the aeon, the only one standing).
 */
export function banishDue(ai: AiContext): string | null {
  const aeonId = ai.ctx.state.aeonId;
  if (!aeonId) return null;
  const rt = ai.ctx.rt.actors.get(aeonId);
  return rt && rt.turnsTaken >= 1 ? aeonId : null;
}

/** Build a command for one of this chapter's rows. */
export function natusUse(ai: AiContext, id: string, targets: CombatantId[] = []): Command {
  return use(ai, id, targets);
}

// ---------------------------------------------------------------------------
// Talk — this fight's own table [§6.2, verified: 4 sources]
// ---------------------------------------------------------------------------

/**
 * **Tidus +10 Strength, Auron +10 Strength, Yuna +10 Magic Defense**, once
 * each, for the battle. Natus-only: Macalania is Tidus / Yuna / Wakka and Flux
 * is Kimahri / Yuna — "do not share one table" (research §6.2). Stat points,
 * not a status, for the reason `seymour-flux.ts` gives (the cubic Strength
 * term reads real points).
 */
export const NATUS_TALK_BONUS: Readonly<Record<string, { readonly stat: 'str' | 'mdef'; readonly amount: number; readonly label: string }>> = {
  tidus: { stat: 'str', amount: 10, label: 'Strength' },
  auron: { stat: 'str', amount: 10, label: 'Strength' },
  yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
};

/** True for either actor of the Natus formation. */
export function isNatusScript(script: string): boolean {
  return script === NATUS_SCRIPT || script === MORTIBODY_SCRIPT;
}

/** Who still has a Talk line left, for the menu. */
export function natusTalkAvailable(ctx: Ctx, talkerId: string): boolean {
  if (!(talkerId in NATUS_TALK_BONUS)) return false;
  return ctx.state.flags[`${TALKED}${talkerId}`] !== true;
}

/** Spend `talker`'s one line. Returns false when there is nothing to say. */
export function consumeNatusTalk(ctx: Ctx, talker: FFXCombatant): boolean {
  const bonus = NATUS_TALK_BONUS[talker.id];
  if (!bonus || !natusTalkAvailable(ctx, talker.id)) return false;
  ctx.state.flags[`${TALKED}${talker.id}`] = true;
  talker.stats[bonus.stat] += bonus.amount;
  ctx.emit({ type: 'message', text: `${talker.name}: +${bonus.amount} ${bonus.label}`, kind: 'story' });
  return true;
}
