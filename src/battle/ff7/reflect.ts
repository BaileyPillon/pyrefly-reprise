/**
 * The Reflect bounce (hidden chapter 44, Jenova LIFE): a reflectable spell aimed at a fighter that holds Reflect
 * turns on its caster.
 *
 * - **Where it goes.** Back at the **caster** when the caster is an opponent of the holder; at a **random
 *   living opponent of the holder** when an ally of the holder cast it [LE formulas 6.6, from Fergusson BM; the
 *   bounce target is the note's Q1b, `[single source]`]. Aqualung cast by Jenova at a party member that holds
 *   Reflect therefore lands on Jenova, and her Water absorb **heals** her.
 * - **How hard.** The hit is an automatic one [core §3.2: "a reflectable action against Reflect"] and the damage
 *   is recomputed against the new target (LE 6.6; the split already applied is not undone, so `performAbility`
 *   keeps the split it worked out for the original target list).
 * - **How often.** One spell turns at most {@link REFLECT_MAX_BOUNCES} times, which only matters when two Reflect
 *   holders face each other [LE 6.6: "up to four bounces per casting per character"]. The **status is not spent**:
 *   that is the note's reading of the `[conflict]` (chapter 44's note, section 6), a labelled estimate.
 * - **What turns.** Only an ability flagged `reflectable` (data); Reflect itself, Demi, Comet, Ultima, summons and
 *   items are not [LE 6.6].
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.** With no Reflect holder in the fight this never changes a target
 * and draws nothing (the Guard Scorpion slice).
 */

import type { Ff7Combatant } from '../common/types.ts';
import type { Ff7AbilityDef } from './defs.ts';
import { living, opponentSide, type Ff7Env } from './internal.ts';
import { hasStatus } from './statuses.ts';

/** One spell turns at most this many times [LE formulas 6.6: single source]. */
export const REFLECT_MAX_BOUNCES = 4;

/** Where an aimed hit actually lands. */
export interface ReflectLanding {
  /** The fighter the hit lands on. */
  target: Ff7Combatant;
  /** The Reflect holder that turned it last, or null when it was not turned. */
  holder: Ff7Combatant | null;
  /** How many times it turned. */
  bounces: number;
}

/** Where a spell turned by `holder`'s Reflect goes: the caster if an opponent, else one draw among the holder's opponents. */
function bounceTarget(env: Ff7Env, user: Ff7Combatant, holder: Ff7Combatant): Ff7Combatant | null {
  if (user.side !== holder.side && user.alive && !user.removed) return user;
  const pool = living(env.state, opponentSide(holder));
  if (pool.length === 0) return null;
  return pool[env.rng.int(0, pool.length - 1)] ?? null;
}

/** Follow `aimed` through any Reflect it holds; a spell that is not reflectable lands where it was aimed. */
export function reflectLanding(env: Ff7Env, user: Ff7Combatant, ability: Ff7AbilityDef, aimed: Ff7Combatant): ReflectLanding {
  let target = aimed;
  let holder: Ff7Combatant | null = null;
  let bounces = 0;
  while (ability.reflectable === true && target.alive && hasStatus(target, 'reflect') && bounces < REFLECT_MAX_BOUNCES) {
    const next = bounceTarget(env, user, target);
    if (!next) break;
    holder = target;
    target = next;
    bounces++;
  }
  return { target, holder, bounces };
}
