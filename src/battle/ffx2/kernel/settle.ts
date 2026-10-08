/**
 * The FFX-2 per-target damage orchestrator, second half: what happens to the three damage numbers after the
 * status rolls and before the result buffer is written. See `pipeline.ts` for the first half and the
 * orchestrator's whole order.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the tail of
 * the orchestrator at 0x6172c0. Spec: `research/re-ffx2-damage.md` section 2. Not wired into the engine.
 *
 * ORDER (HP, MP and ATB are each treated the same unless a step says otherwise):
 *
 *     the group 2 status pass drops the ATB delta when a Haste or Slow roll failed to land
 *     ->  a Petrified target that this hit did not Shatter takes nothing
 *     ->  a target with the "no ATB damage" special flag takes no ATB damage
 *     ->  ALL-TARGET HALVING (Cmd.flags_target & 0x80 and ActionRec+0x27 != 0): each number / 2, toward zero
 *     ->  a hit that inflicts Death on a living target replaces the damage (everything zero)
 *     ->  Damage 9999 attacker status: an HP number from 1 to 9998 becomes 9999, -1 to -9998 becomes -9999
 *     ->  the limit: each number clamped to -cap..cap, cap 9999 (99999 with the Break Damage Limit auto-ability
 *         or Cmd.flags_damage & 0x80; Cmd.flags_damage & 0x40 forces 9999)
 *
 * So the halving comes AFTER Shell, Protect, Defense and every immunity (they all live in the first half), and
 * the limit comes last, so a halved hit is capped at the limit, not at twice the limit.
 */

import { clamp, div2, u8 } from './int32.ts';
import {
  CLASS_ATB,
  CLASS_HP,
  type ClassDamage,
  type DamageResult,
  type PipelineInput,
  type StatusPhaseOutcome,
} from './pipeline-types.ts';

/** The damage limit that applies to this command from this attacker (9999 or 99999). */
export function damageCap(autoAbilities652: number, flagsDamage: number): number {
  let cap = (autoAbilities652 & 1) !== 0 ? 99999 : 9999;
  if ((flagsDamage & 0x80) !== 0) cap = 99999;
  else if ((flagsDamage & 0x40) !== 0) cap = 9999;
  return cap;
}

/** The Damage 9999 attacker status: a small HP number snaps to the magic figure, keeping its sign. */
export function snapDamage9999(hp: number): number {
  if (hp >= 1 && hp <= 9998) return 9999;
  if (hp <= -1 && hp >= -9998) return -9999;
  return hp;
}

/** Apply the tail of the orchestrator to the numbers {@link computeClassDamage} produced. */
export function settleDamage(c: ClassDamage, input: PipelineInput, outcome: StatusPhaseOutcome = {}): DamageResult {
  const { cmd, attacker, target } = input;
  let { hp, mp, atb, flags, surviving, blocked } = c;

  if (c.gate) {
    if (outcome.hasteSlowFailed === true) atb = 0;

    if (outcome.resultHasPetrify === true && (target.status1 & 2) !== 0 && outcome.shattered !== true) {
      hp = 0;
      mp = 0;
      atb = 0;
      surviving = 0;
    }

    if ((flags & CLASS_ATB) !== 0 && (u8(target.special) & 0x40) !== 0) atb = 0;

    if ((cmd.flagsTarget & 0x80) !== 0 && input.allTargets) {
      hp = div2(hp);
      mp = div2(mp);
      atb = div2(atb);
    }

    if ((target.status1 & 1) === 0 && outcome.resultHasDeath === true) {
      hp = 0;
      mp = 0;
      atb = 0;
      flags &= ~7;
      surviving = 0;
      blocked = 0;
    }
  }

  const shown = (attacker.status1 & 0x4000) !== 0 && (flags & CLASS_HP) !== 0 ? snapDamage9999(hp) : hp;
  const cap = damageCap(attacker.autoAbilities652, cmd.flagsDamage);
  return {
    gate: c.gate,
    hp: clamp(shown, -cap, cap),
    mp: clamp(mp, -cap, cap),
    atb: clamp(atb, -cap, cap),
    flags,
    surviving,
    blocked,
    chain: c.chain,
    backAttack: c.backAttack,
    critical: c.critical,
    estimate: c.estimate,
    cap,
  };
}
