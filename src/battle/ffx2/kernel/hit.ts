/**
 * FFX-2 hit / evade kernel: `pp_hit_determine`, the function that decides, for every target of one
 * action, whether each hit lands, misses or has no effect.
 *
 * **Game case: FFX-2 only** (FFX's hit check is a different function in a different exe; see
 * `src/battle/ffx/kernel/hit.ts`). Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * function 0x00641500 (callees: the stream selector 0x0061adb0, the generator 0x0061e270, `pp_is_aided_chr`
 * 0x00624bc0, the 64-bit CRT helpers and the float-to-int helper). Spec:
 * `research/re-ffx2-hit-status.md` section 2. Pure, no DOM, no engine types (AGENTS.md rule 1); not wired
 * into the engine. Randomness comes from a `draw(stream)` callback (see `./rng.ts`); the arithmetic of the
 * eight formulas is in `./hitFormulas.ts`.
 *
 * What the function does for each target `t` in the action's target mask, visited in ascending slot
 * order, with `f` = the command's accuracy formula (command row +0x14, bits 3 to 5):
 *
 * 1. Forced outcomes (formulas 1 and 2 only). If the target's ROOT character is asleep, petrified or
 *    stopped, the hit is forced. Otherwise, if the command is physical-only and the target has the
 *    "Evade & Counter" ability, the hit is forced to miss. A target in hit reaction is forced to be hit.
 *    A record that has been re-rolled `limit` times (ActionRec +0xa6 >= +0xa7) is forced to miss.
 * 2. The roll and the threshold, per formula (the draw is made here, from the ATTACKER's purpose-1
 *    stream; formula 0 and the Bribe command 0x31da draw nothing).
 * 3. An "immune" result (resist byte 255 for formulas 3 to 5, the Bribe-immune flag for 6) is result 2
 *    and skips the compare, but the draw has already been made.
 * 4. Otherwise it is a hit when `(roll < threshold or forced-hit) and not forced-miss`, result 0, else
 *    a miss, result 1. The threshold may be negative or above 100; there is no clamp.
 *
 * Then the hits per target are planned: `hits` (the override when it is above 0, else the command's
 * byte) for every target in the mask, or, for a command that spreads its hits over random targets
 * (`flags_misc & 0x4000`), one random target per hit from fixed stream 5.
 *
 * What is NOT here: the outer loop over linked ActionRecs (the engine calls this once per record), the
 * write of the union mask into the attacker, and the Reflect redirect (`pp_reflect_redirect`).
 */

import { at, smod } from './intops.ts';
import { planHits } from './hitPlan.ts';
import {
  COMMAND_BRIBE_FREE_ROLL,
  aidScale,
  bribeAccuracy,
  darknessBase,
  raceThreshold,
  resistThreshold,
  sexticThreshold,
} from './hitFormulas.ts';
import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';

export { pickRandomTarget } from './hitPlan.ts';

export {
  COMMAND_BRIBE_FREE_ROLL,
  DAMAGE_FLAG_MAGICAL,
  DAMAGE_FLAG_PHYSICAL,
  MISC_FLAG_DARKNESS,
  MISC_FLAG_RANDOM_TARGETS,
  STATUS1_DARKNESS,
  accuracyFormulaOf,
} from './hitFormulas.ts';

/** `ActionRec` result codes (byte at +0x31+t). */
export const HitResult = { Hit: 0, Miss: 1, NoEffect: 2 } as const;
export type HitResultValue = (typeof HitResult)[keyof typeof HitResult];

/** The attacker: Chr fields `pp_hit_determine` reads. */
export interface HitAttacker {
  /** Battle slot id (0 to 30): selects the hit stream, `rngStreamForChr(id, 1)`. */
  id: number;
  /** Chr +0x380 (s32). */
  level: number;
  /** Chr +0x39b (u8). */
  luck: number;
  /** Chr +0x39d (u8): the Accuracy stat, the base of formula 2. */
  acc: number;
  /** Chr +0x443 (s8): Accuracy stage. */
  accStage: number;
  /** Chr +0x445 (s8): Luck stage. */
  luckStage: number;
  /** Status word 1 (Chr +0x434) bit 0x10: Darkness. */
  darkness: boolean;
}

/** The command row fields `pp_hit_determine` reads. */
export interface HitCommand {
  /** ActionRec +0xa4 (u16): the command id. 0x31da is the Bribe that skips its roll. */
  id: number;
  /** Accuracy formula, 0 to 7: `(flags_misc >> 3) & 7`. */
  formula: number;
  /** `flags_misc & 0x40`: Darkness lowers this command's accuracy. */
  darknessApplies: boolean;
  /** Row +0x2a (u8): the base of formula 1. */
  accuracy: number;
  /** Row +0x2b (u8): the power in formulas 3 to 5. */
  power: number;
  /** Row +0x2c (u8): hits per target. */
  hits: number;
  /** `(flags_damage & 3) == 1`: physical and not magical. */
  physicalOnly: boolean;
  /** `flags_misc & 0x4000`: spread the hits over random targets. */
  randomTargets: boolean;
}

/** ActionRec fields. */
export interface HitAction {
  /** +0xa6 (u8): how many times this record has been re-determined. */
  repeatCount: number;
  /** +0xa7 (u8): the limit; the command start sets 0 and 3. */
  repeatLimit: number;
  /** +0xb0 (s32): the amount, the gil offered by a Bribe. */
  amount: number;
  /** The caller's `hitsOverride` (an int; only a value above 0 replaces the command's hits). */
  hitsOverride: number;
}

/** One target: the Chr fields the function reads, with the owner-chr state already resolved. */
export interface HitTarget {
  /** Battle slot id, 0 to 30. */
  id: number;
  /** Chr +0x380 (s32); treated as 1 when below 1. */
  level: number;
  /** Chr +0x39b, +0x39c (u8). */
  luck: number;
  eva: number;
  /** Chr +0x444 (s8): Evasion stage; +0x445 (s8): Luck stage. */
  evaStage: number;
  luckStage: number;
  /**
   * The ROOT chr's state (the chr named by Chr +0x16, which is the target itself for an ordinary
   * unit): status word 1 bit 4 (Sleep), bit 2 (Petrify), and the byte at +0x43e (Stop).
   */
  asleep: boolean;
  petrified: boolean;
  stopped: boolean;
  /** Chr +0x650 bit 8: "Evade & Counter" (physical-only commands always miss it). */
  evadesPhysical: boolean;
  /** Chr +0xd98 or +0xd99 non-zero: in hit reaction (always hit). */
  inHitReaction: boolean;
  /** `pp_is_aided_chr`: a player-side monster, whose threshold is scaled by (aid + 1) / 4. */
  aided: boolean;
  /** Chr +0x384 (s32): max HP, the divisor of formula 6. */
  maxHp: number;
  /** Chr +0x67c (s32): the Bribe amount accumulated so far (formula 6). */
  accumulated: number;
  /** Chr +0x3a7 bit 1: immune to Bribe (formula 6). */
  bribeImmune: boolean;
  /** Resist bytes: Eject +0x40e (f 3), Death +0x404 (f 4), Petrify +0x405 (f 5); 255 = immune. */
  resistEject: number;
  resistDeath: number;
  resistPetrify: number;
  /** Chr +0x66b (u8): the resist byte of formula 7. */
  resistSextic: number;
}

/** Debug switches and the aid count. All off / default in the retail game. */
export interface HitOptions {
  /** VA 0x00df68ce: every hit lands. */
  debugForceHit?: boolean;
  /** VA 0x00df68cf: every hit misses. */
  debugForceMiss?: boolean;
  /** VA 0x011b85c4 (a short): the aid count, 0 to 5; default 3 (x1). Only aided targets use it. */
  aidCount?: number;
}

/** The decision for one target. */
export interface HitTargetResult {
  id: number;
  result: HitResultValue;
  /** The roll compared (the constant 128 for formulas 3 to 5), or `null` for formula 0. */
  roll: number | null;
  /** The threshold compared, or `null` for formula 0. */
  threshold: number | null;
  forceHit: boolean;
  forceMiss: boolean;
  /** The target was immune (result 2, no compare made), before any random-target override. */
  immune: boolean;
  /** The stream drawn from, or `null` when this target made no draw. */
  stream: number | null;
  /** The raw 31-bit draw, or `null`. */
  rawDraw: number | null;
  /** Formula 6 only: the values stored back on the target at +0x67c and +0x680. */
  bribe?: { accumulated: number; threshold: number };
}

/** The decision for a whole action. */
export interface HitActionResult {
  targets: HitTargetResult[];
  /** ActionRec +0x2c, +0x2d, +0x2e (bytes). */
  hitCount: number;
  missCount: number;
  noEffectCount: number;
  /** ActionRec +0x2b (byte): the total number of hits planned. */
  hitsPlanned: number;
  /** ActionRec +0x6f+t, in the same order as `targets`: hits planned per target. */
  perTargetHits: number[];
  /** The function's return value: the union of the target bits (u32). */
  mask: number;
}

const DEFAULT_AID_COUNT = 3;

/**
 * Decide ONE target (the body of `pp_hit_determine`'s per-target loop). Makes at most one draw.
 */
export function rollHit(
  attacker: HitAttacker,
  command: HitCommand,
  action: HitAction,
  target: HitTarget,
  draw: Ffx2Draw,
  options: HitOptions = {},
): HitTargetResult {
  const f = command.formula & 7;
  let forceHit = options.debugForceHit === true;
  let forceMiss = options.debugForceMiss === true;
  let immune = false;
  let roll = 0;
  let threshold = 0;
  let stream: number | null = null;
  let rawDraw: number | null = null;
  let bribe: { accumulated: number; threshold: number } | undefined;
  const hitStream = rngStreamForChr(attacker.id, Ffx2RngKind.Hit);
  const drawHit = (): number => {
    stream = hitStream;
    rawDraw = drawValue(draw, hitStream);
    return rawDraw;
  };

  if (f === 1 || f === 2) {
    if (target.asleep || target.petrified || target.stopped) {
      forceHit = true;
    } else if (!forceHit && command.physicalOnly && target.evadesPhysical) {
      forceMiss = true;
    }
    if (target.inHitReaction) forceHit = true;
    if ((action.repeatLimit & 0xff) <= (action.repeatCount & 0xff)) forceMiss = true;
  }

  switch (f) {
    case 0:
      // Never rolls: the compare is made with the hit forced.
      return {
        id: target.id,
        result: forceMiss ? HitResult.Miss : HitResult.Hit,
        roll: null,
        threshold: null,
        forceHit: true,
        forceMiss,
        immune: false,
        stream: null,
        rawDraw: null,
      };
    case 1:
    case 2: {
      roll = smod(drawHit(), 101);
      let base = f === 1 ? command.accuracy & 0xff : attacker.acc & 0xff;
      if (command.darknessApplies && attacker.darkness) base = darknessBase(base);
      threshold = raceThreshold({
        base,
        attackerLuck: attacker.luck,
        attackerAccStage: attacker.accStage,
        attackerLuckStage: attacker.luckStage,
        targetLuck: target.luck,
        targetEva: target.eva,
        targetEvaStage: target.evaStage,
        targetLuckStage: target.luckStage,
      });
      if (target.aided) threshold = aidScale(threshold, options.aidCount ?? DEFAULT_AID_COUNT);
      break;
    }
    case 3:
    case 4:
    case 5: {
      const resist = f === 3 ? target.resistEject : f === 4 ? target.resistDeath : target.resistPetrify;
      roll = 0x80;
      immune = (resist & 0xff) === 0xff;
      const d7f = drawHit() & 0x7f;
      threshold = resistThreshold(attacker.level, target.level, command.power, resist, d7f);
      break;
    }
    case 6: {
      immune = target.bribeImmune;
      bribe = bribeAccuracy(command.id, target.accumulated, action.amount, target.maxHp);
      threshold = bribe.threshold;
      if (command.id === COMMAND_BRIBE_FREE_ROLL) {
        roll = 0;
      } else {
        if ((action.amount | 0) < 1) forceMiss = true;
        roll = drawHit() & 0xff;
      }
      break;
    }
    default: {
      // f === 7
      threshold = sexticThreshold(attacker.level, target.level, target.resistSextic);
      roll = drawHit() & 0x3ff;
      break;
    }
  }

  const out: HitTargetResult = {
    id: target.id,
    result: HitResult.Miss,
    roll,
    threshold,
    forceHit,
    forceMiss,
    immune,
    stream,
    rawDraw,
  };
  if (bribe) out.bribe = bribe;
  if (immune) {
    out.result = HitResult.NoEffect;
    return out;
  }
  out.result = (roll < threshold || forceHit) && !forceMiss ? HitResult.Hit : HitResult.Miss;
  return out;
}

/**
 * `pp_hit_determine` for one ActionRec: decide every target (ascending slot order), then plan the hits.
 *
 * The targets array is the set of bits in the record's target mask. The hits per target are the
 * override when it is above 0 (a signed compare), else the command's byte; each is truncated to a
 * byte, as is the total.
 */
export function determineHits(
  attacker: HitAttacker,
  command: HitCommand,
  action: HitAction,
  targets: readonly HitTarget[],
  draw: Ffx2Draw,
  options: HitOptions = {},
): HitActionResult {
  const ordered = [...targets].sort((a, b) => a.id - b.id);
  for (let i = 1; i < ordered.length; i++) {
    if (at(ordered, i).id === at(ordered, i - 1).id) throw new RangeError(`duplicate target slot ${at(ordered, i).id}`);
  }
  const results: HitTargetResult[] = [];
  let hitCount = 0;
  let missCount = 0;
  let noEffectCount = 0;
  let mask = 0;
  for (const target of ordered) {
    if (target.id < 0 || target.id > 30) throw new RangeError(`target slot ${target.id} is outside 0..30`);
    mask |= 1 << target.id;
    const r = rollHit(attacker, command, action, target, draw, options);
    results.push(r);
    if (r.result === HitResult.Hit) hitCount += 1;
    else if (r.result === HitResult.Miss) missCount += 1;
    else noEffectCount += 1;
  }

  const hits = (action.hitsOverride | 0) < 1 ? command.hits & 0xff : action.hitsOverride | 0;
  const plan = planHits(
    ordered.map((t) => t.id),
    hits,
    command.randomTargets,
    draw,
  );
  if (command.randomTargets) {
    // Every target that received no hit is a miss, whatever it had been decided to be.
    for (let i = 0; i < ordered.length; i++) if (at(plan.perTarget, i) === 0) at(results, i).result = HitResult.Miss;
  }
  return {
    targets: results,
    hitCount: hitCount & 0xff,
    missCount: missCount & 0xff,
    noEffectCount: noEffectCount & 0xff,
    hitsPlanned: plan.total & 0xff,
    perTargetHits: plan.perTarget,
    mask: mask >>> 0,
  };
}
