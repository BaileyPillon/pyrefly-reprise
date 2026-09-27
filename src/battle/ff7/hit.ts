/**
 * FF7 hit, Lucky Hit / Lucky Evade and critical chance [core §3.1 to §3.3,
 * single source: Fergusson BM §3.3].
 *
 * Game case: **FF7 only.** FF7 follows its own hit rules, not AGENTS.md rule 5
 * (FFX / FFX-2): Magic rolls too, it just reaches 100 for the slice's spells.
 * An action with `canMiss === false` (Search Scope) never calls these.
 *
 * **Draw order, fixed** (determinism, `docs/CONTRACTS.md` engine rules):
 * - physical: automatic hit → no draw; otherwise Lucky `Rnd(0..99)`, then the hit
 *   roll `Rnd(0..65535)`; on a hit, the critical roll `Rnd(0..65535)`.
 * - magical: automatic hit → no draw; otherwise the MD% roll `Rnd(0..99)`, then the
 *   hit roll `Rnd(0..99)`.
 * Two choices here are **our estimate** (the research gives the formulas, not the
 * draws): an automatic hit skips the Lucky roll, and the MD% roll is drawn even
 * against an enemy (which has no MD%, core §1.3, so it can never miss there).
 */

import type { Rng } from '../common/types.ts';
import { trunc } from './stats.ts';

/** `Random = [Rnd(0..65535) * 99 / 65535] + 1`, 1..100 [core §3.1, §3.3]. */
export function hitRandom(roll65535: number): number {
  return trunc((roll65535 * 99) / 65535) + 1;
}

// ---------------------------------------------------------------------------
// Physical [core §3.1]
// ---------------------------------------------------------------------------

/** What the physical hit formula reads. */
export interface Ff7PhysicalHitInput {
  attackerDex: number;
  /** Weapon At% for the Attack command, the action's PAt% otherwise (enemies, Limits). */
  atPct: number;
  attackerDfPct: number;
  targetDfPct: number;
  attackerFury?: boolean;
  attackerLck: number;
  targetLck: number;
  /** Lucky Evade exists only for a party member attacked by a non-party attacker. */
  attackerIsParty: boolean;
  targetIsParty: boolean;
  /**
   * Hit% 255 without a roll: back attack, an affinity from `affinityForcesHit`, the
   * target Death / Sleep / Confusion / Stop / Petrify / Manipulate / Paralysed, or
   * Covering. A 255 At% weapon is not one of these.
   */
  autoHit?: boolean;
}

/** `Hit% = [Dex / 4] + At% + AttackerDf% - TargetDf%`, Fury `- [Hit% * 3 / 10]`, floor 1 [core §3.1]. */
export function physicalHitPct(input: Omit<Ff7PhysicalHitInput, 'attackerLck' | 'targetLck' | 'attackerIsParty' | 'targetIsParty'>): number {
  if (input.autoHit) return 255;
  let hit = trunc(input.attackerDex / 4) + input.atPct + input.attackerDfPct - input.targetDfPct;
  if (input.attackerFury) hit = hit - trunc((hit * 3) / 10);
  return hit < 1 ? 1 : hit;
}

/** The Lucky step on one shared roll 0..99 [core §3.1]. Returns the new Hit% and which luck fired. */
export function applyLuck(
  hitPct: number,
  luckRoll: number,
  input: Pick<Ff7PhysicalHitInput, 'attackerLck' | 'targetLck' | 'attackerIsParty' | 'targetIsParty'>,
): { hitPct: number; lucky: 'hit' | 'evade' | null } {
  if (luckRoll < trunc(input.attackerLck / 4)) return { hitPct: 255, lucky: 'hit' };
  // Only a non-party attacker against a party member; enemies never Lucky Evade.
  if (!input.attackerIsParty && input.targetIsParty && luckRoll < trunc(input.targetLck / 4)) return { hitPct: 0, lucky: 'evade' };
  return { hitPct, lucky: null };
}

/** The final physical roll: hits if `Random < Hit%` [core §3.1]. A Hit% of 1 never lands; 101 or more always does. */
export function physicalHitLands(hitPct: number, roll65535: number): boolean {
  return hitRandom(roll65535) < hitPct;
}

/** A physical hit check's result. */
export interface Ff7HitResult {
  hit: boolean;
  hitPct: number;
  lucky: 'hit' | 'evade' | null;
}

/** Roll a physical hit (draws: Lucky, then the hit roll; none on an automatic hit). */
export function rollPhysicalHit(input: Ff7PhysicalHitInput, rng: Rng): Ff7HitResult {
  const base = physicalHitPct(input);
  if (input.autoHit) return { hit: true, hitPct: 255, lucky: null };
  const luck = applyLuck(base, rng.int(0, 99), input);
  const hit = physicalHitLands(luck.hitPct, rng.int(0, 65535));
  return { hit, hitPct: luck.hitPct, lucky: luck.lucky };
}

// ---------------------------------------------------------------------------
// Magical [core §3.2]
// ---------------------------------------------------------------------------

/** What the magical hit formula reads. */
export interface Ff7MagicHitInput {
  matPct: number;
  attackerLevel: number;
  targetLevel: number;
  /** Target MD%; 0 for every enemy [core §1.3]. */
  targetMdPct: number;
  attackerFury?: boolean;
  /**
   * Automatic hit besides MAt% 255: an affinity from `affinityForcesHit`, a reflectable
   * action against Reflect, or a no-status action against Death / Sleep / Confusion /
   * Stop / Petrify / Paralysed.
   */
  autoHit?: boolean;
}

/** True when the magical roll is skipped [core §3.2]. */
export function magicAutoHit(input: Pick<Ff7MagicHitInput, 'matPct' | 'autoHit'>): boolean {
  return input.matPct === 255 || input.autoHit === true;
}

/** `MAt%` after Fury, then `Hit% = MAt% + Lvl - [TargetLvl / 2] - 1` [core §3.2]. */
export function magicHitPct(input: Pick<Ff7MagicHitInput, 'matPct' | 'attackerLevel' | 'targetLevel' | 'attackerFury'>): number {
  let mat = input.matPct;
  if (input.attackerFury) mat = mat - trunc((mat * 3) / 10);
  return mat + input.attackerLevel - trunc(input.targetLevel / 2) - 1;
}

/** Roll a magical hit (draws: the MD% roll, then the hit roll; none on an automatic hit). */
export function rollMagicHit(input: Ff7MagicHitInput, rng: Rng): { hit: boolean; hitPct: number } {
  if (magicAutoHit(input)) return { hit: true, hitPct: 255 };
  const hitPct = magicHitPct(input);
  if (rng.int(0, 99) < input.targetMdPct) {
    rng.int(0, 99); // the hit roll is still drawn, so the stream never depends on MD% [estimate: draw order]
    return { hit: false, hitPct };
  }
  return { hit: rng.int(0, 99) < hitPct, hitPct };
}

// ---------------------------------------------------------------------------
// Critical [core §3.3] (Physical formula only)
// ---------------------------------------------------------------------------

/** `Crit% = [(Lck + Lvl - TargetLvl) / 4]` + the weapon's crit bonus (party only) [core §3.3]. */
export function critPct(attackerLck: number, attackerLevel: number, targetLevel: number, weaponBonus = 0): number {
  return trunc((attackerLck + attackerLevel - targetLevel) / 4) + weaponBonus;
}

/** Critical if `Random <= Crit%` [core §3.3]. */
export function critLands(critPctValue: number, roll65535: number): boolean {
  return hitRandom(roll65535) <= critPctValue;
}

/** Roll the critical (one draw). Call only after a physical hit landed. */
export function rollCritical(critPctValue: number, rng: Rng): boolean {
  return critLands(critPctValue, rng.int(0, 65535));
}
