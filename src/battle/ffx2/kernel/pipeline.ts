/**
 * The FFX-2 per-target damage orchestrator, first half: the HP, MP and ATB damage classes up to the point
 * where the status rolls take over. The second half (halving, the limit, the status-phase zeroing) is
 * `settle.ts`; `damageTarget` here runs both.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function
 * 0x6172c0 (the older copy has it at 0x6172e0), with the base formula 0x61b910 ({@link baseDamage}), the
 * critical roll 0x617210, the element step 0x618780 ({@link elementMod}) and the aid scale 0x616e40. Spec:
 * `research/re-ffx2-damage.md` section 2. Not wired into the engine.
 *
 * ORDER of the HP class, as the instructions run it (each step feeds the next):
 *
 *     base formula (draws the variance)  ->  aid scale  ->  critical x2 (rolls)  ->  Berserk x5/4
 *     ->  Booster x3/2  ->  item doublers  ->  species killers x4 per bit  ->  back attack x2 (physical)
 *     ->  chain (chain+28)/20 (only for a positive hit on a chained target)  ->  element ladder
 *     ->  percent-formula immunity  ->  Shell /2 (magical) or Protect /2 (physical) and the Defense
 *     clamp to +/-1 (physical)  ->  immunity bytes (positive hits only)
 *
 * then, in `settle.ts`, all-target halving, the Damage 9999 snap and the limit. The MP class runs only the
 * base formula, aid scale, Booster, item doublers, species killers, the cap by the target's current MP and
 * the immunity bytes. The ATB class runs only the base formula, the aid scale and the immunity bytes.
 * Division rules: every `/ n` rounds toward zero, every product wraps at 32 bits ({@link ./int32.ts}).
 *
 * Draws, in order (all from the attacker's mode-0 stream, one value each): the HP class variance, the
 * critical roll when the command can crit, the MP class variance, the ATB class variance. A class that the
 * command does not use draws nothing; a preview draws nothing; power 0 skips all three classes.
 */

import { baseDamage, type BaseDamageInput } from './damage.ts';
import { elementMod } from './element.ts';
import { chainAdjusted } from './apply.ts';
import { add, div2, div4, mul, mul3div2, s8, u8, u16 } from './int32.ts';
import {
  CLASS_ATB,
  CLASS_HP,
  CLASS_MP,
  RESULT_CRITICAL,
  RESULT_DEFENSE_CLAMP,
  RESULT_PROTECT,
  RESULT_SHELL,
  type ClassDamage,
  type DamageResult,
  type PipelineCommand,
  type PipelineHooks,
  type PipelineInput,
  type PipelineTarget,
  type StatusPhaseOutcome,
} from './pipeline-types.ts';
import { settleDamage } from './settle.ts';

/**
 * The target gate at the top of the orchestrator. A target that fails it gets no damage at all:
 * it must be in the battle (except for commands 0x3181 and 0x31ea), must be dead if flags_misc has 0x40000,
 * must be alive unless flags_target has 0x40, and must not have `Chr+0x5ac == 1` unless flags_target has 0x400.
 */
export function targetGate(cmd: PipelineCommand, target: PipelineTarget): boolean {
  const dead = s8(target.dead);
  const inBattle = cmd.id === 0x3181 || cmd.id === 0x31ea || u8(target.inBattle) !== 0;
  return (
    inBattle &&
    ((cmd.flagsMisc & 0x40000) === 0 || dead !== 0) &&
    ((cmd.flagsTarget & 0x40) !== 0 || dead === 0) &&
    ((cmd.flagsTarget & 0x400) !== 0 || u8(target.flag5ac) !== 1)
  );
}

/**
 * The ATB pool the ATB class damages (exe 0x634940 then 0x634900): a target that is charging an action gives
 * its remaining charge and the charge maximum; if that maximum is 0, or it is not charging, the remaining
 * recovery and the recovery maximum. Remaining values below 0 read as 0.
 */
export function atbValues(pool: {
  charging: boolean;
  chargeRemaining: number;
  chargeMax: number;
  recoveryRemaining: number;
  recoveryMax: number;
}): { current: number; max: number } {
  if (pool.charging && pool.chargeMax !== 0) {
    return { current: Math.max(0, pool.chargeRemaining) | 0, max: pool.chargeMax | 0 };
  }
  return { current: Math.max(0, pool.recoveryRemaining) | 0, max: pool.recoveryMax | 0 };
}

/**
 * The aid scale (exe 0x616e40): for formulas 0 to 3 and 9 only, each aided character on either side scales
 * the damage by (aidCount + 1) / 4. With the default aid count 3 that is exactly x1; it is inactive in an
 * ordinary party-versus-monsters fight.
 */
export function aidScale(formula: number, attackerAided: boolean, targetAided: boolean, aidCount: number, damage: number): number {
  if (formula < 0 || (formula > 3 && formula !== 9)) return damage;
  let d = damage;
  if (attackerAided) d = div4(mul(add(aidCount, 1), d));
  if (targetAided) d = div4(mul(add(aidCount, 1), d));
  return d;
}

const DEFAULT_AID_COUNT = 3;

/** The command's element mask: its own byte, OR-ed with the weapon element when it uses the character's properties. */
function elementMask(input: PipelineInput): number {
  const { cmd, attacker } = input;
  return (cmd.flagsMisc & 0x10000) !== 0 ? u8(attacker.weaponElement) | u8(cmd.element) : u8(cmd.element);
}

/** One call of the base formula with the argument layout the orchestrator uses. */
function baseCall(
  input: PipelineInput,
  formula: number,
  poolHp: number,
  poolMaxHp: number,
  preview: boolean,
  hooks: PipelineHooks,
): number {
  const { cmd, attacker, target } = input;
  const call: BaseDamageInput = {
    attackerId: attacker.id,
    targetId: target.id,
    cmd: { misc: cmd.flagsMisc, damage: cmd.flagsDamage },
    formula,
    power: u8(cmd.power),
    amount: input.amount,
    preview,
    user: {
      hp: attacker.hp,
      maxHp: attacker.maxHp,
      mp: attacker.mp,
      maxMp: attacker.maxMp,
      str: u8(attacker.str),
      strStage: s8(attacker.strStage),
      mag: u8(attacker.mag),
      magStage: s8(attacker.magStage),
      level: attacker.level,
    },
    target: {
      hp: poolHp,
      maxHp: poolMaxHp,
      def: u8(target.def),
      defStage: s8(target.defStage),
      mdef: u8(target.mdef),
      mdefStage: s8(target.mdefStage),
    },
    records: input.records,
    ...(input.delay !== undefined ? { delay: input.delay } : {}),
  };
  return baseDamage(call, hooks.draw);
}

/** Booster (x3/2), the item doublers and the species killers: the steps the HP and MP classes share. */
function sharedBoosts(input: PipelineInput, damage: number, mask: number): number {
  const { cmd, attacker, target } = input;
  const abilities = u16(attacker.autoAbilities650);
  let d = damage;
  if ((abilities & 0x20) !== 0 && (u8(cmd.category) === 1 || u8(cmd.category) === 2)) d = mul3div2(d);
  if ((cmd.id & 0xfffff000) === 0x2000) {
    if ((cmd.flagsDamage & 0x10) === 0) {
      const master = mask === 0 ? abilities & 0x400 : abilities & 0x200;
      if (master !== 0) d = add(d, d);
    } else if ((abilities & 0x100) !== 0 && (u8(cmd.formula) === 5 || u8(cmd.formula) === 7)) {
      d = add(d, d);
    }
  }
  const species = u16(target.species);
  const killer = u16(cmd.speciesKiller);
  for (let bit = 0; bit < 16; bit++) {
    if (((species >> bit) & 1) !== 0 && ((killer >> bit) & 1) !== 0) d = d << 2;
  }
  return d;
}

/** The immunity bytes of the target for one damage class (positive hits only): Invincible, or the physical / magical byte. */
function isImmune(cmd: PipelineCommand, target: PipelineTarget): boolean {
  const cls = cmd.flagsDamage & 3;
  const byClass = cls === 1 ? u8(target.immunePhysical) : cls === 2 ? u8(target.immuneMagical) : 0;
  return u8(target.invincible) !== 0 || byClass !== 0;
}

/**
 * Everything the orchestrator computes before the status phase: the three damage classes, their modifiers,
 * the flag word and the counters. The HP, MP and ATB numbers are NOT halved or capped yet ({@link settleDamage}).
 */
export function computeClassDamage(input: PipelineInput, hooks: PipelineHooks): ClassDamage {
  const { cmd, attacker, target, preview } = input;
  const formula = u8(cmd.formula);
  const aidCount = input.aidCount ?? DEFAULT_AID_COUNT;
  const aid = (d: number): number => aidScale(formula, attacker.aided === true, target.aided === true, aidCount, d);

  let hp = 0;
  let mp = 0;
  let atb = 0;
  let flags = 0;
  let surviving = 0;
  let blocked = 0;
  let chain = 0;
  let backAttack = false;
  let critical = false;
  const gate = targetGate(cmd, target);

  if (gate) {
    surviving = u8(cmd.damageClass);
    let classes = surviving;
    let atbFormula = formula;
    if ((cmd.flagsMisc & 0x3000) !== 0) {
      classes |= CLASS_ATB;
      atbFormula = 0x18;
    }
    flags = classes;
    const mask = elementMask(input);
    const cls = cmd.flagsDamage & 3;

    if (u8(cmd.power) !== 0) {
      if ((classes & CLASS_HP) !== 0) {
        let d = aid(baseCall(input, formula, target.hp, target.maxHp, preview, hooks));
        if (!preview && (cmd.flagsDamage & 4) !== 0 && hooks.rollCrit()) {
          d = mul(d, 2);
          flags |= RESULT_CRITICAL;
          critical = true;
        }
        if ((attacker.status1 & 0x80) !== 0) d = div4(mul(d, 5)); // Berserk: x5/4
        d = sharedBoosts(input, d, mask);
        if (cls === 1 && input.backAttack) {
          d = add(d, d); // back attack: x2, physical only
          backAttack = true;
        }
        if (d > 0 && u8(target.chain) !== 0) {
          chain = u8(target.chain);
          d = chainAdjusted(chain, d); // chain: (counter + 28) / 20
        }
        let e = elementMod(target.affinities, mask, d);
        if (e > 0 && (formula === 7 || formula === 4) && (u8(target.special) & 1) !== 0) {
          surviving &= ~CLASS_HP;
          e = 0;
          blocked = 1; // an assignment in the game; blocked is still 0 here
        }
        if (cls === 2 && u8(target.shell) !== 0) {
          e = div2(e);
          flags |= RESULT_SHELL;
        }
        if (cls === 1) {
          if (u8(target.protect) !== 0) {
            e = div2(e);
            flags |= RESULT_PROTECT;
          }
          if ((target.status1 & 0x200) !== 0) {
            // Defense: a physical hit lands for exactly 1 (or heals exactly 1).
            if (e > 0) {
              flags |= RESULT_DEFENSE_CLAMP;
              e = 1;
            } else if (e < 0) {
              flags |= RESULT_DEFENSE_CLAMP;
              e = -1;
            }
          }
        }
        if (e > 0 && isImmune(cmd, target)) {
          surviving &= ~CLASS_HP;
          blocked += 1;
          e = 0;
        }
        hp = e;
      }

      if ((flags & CLASS_MP) !== 0) {
        let d = aid(baseCall(input, formula, target.mp, target.maxMp, preview, hooks));
        d = sharedBoosts(input, d, mask);
        if (d > 0) {
          if (target.mp < d) d = target.mp; // MP damage cannot exceed the MP the target has
          if (d > 0 && isImmune(cmd, target)) {
            surviving &= ~CLASS_MP;
            blocked += 1;
            d = 0;
          }
        }
        mp = d;
      }

      if ((flags & CLASS_ATB) !== 0) {
        surviving &= ~CLASS_ATB;
        const d = aid(baseCall(input, atbFormula, target.atb.current, target.atb.max, preview, hooks));
        atb = d;
        if (d > 0 && isImmune(cmd, target)) {
          surviving &= ~CLASS_ATB;
          blocked += 1;
          atb = 0;
        }
      }
    }
  }

  // The estimate runs for every call, gate or not: the plain base formula in preview mode on the HP pool.
  const estimate = baseCall(input, formula, target.hp, target.maxHp, true, hooks);
  return { gate, hp, mp, atb, flags, surviving, blocked, chain, backAttack, critical, estimate };
}

/** The whole orchestrator: {@link computeClassDamage} then {@link settleDamage} with the status phase's outcome. */
export function damageTarget(input: PipelineInput, hooks: PipelineHooks, outcome: StatusPhaseOutcome = {}): DamageResult {
  const classes = computeClassDamage(input, hooks);
  return settleDamage(classes, input, outcome);
}
