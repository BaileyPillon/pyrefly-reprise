/**
 * One action's hits, through the kernels proven against FFX-2.exe (re-parity W3; **FFX-2 only**).
 *
 * The game resolves a command in two stages (`research/re-ffx2-damage.md`, `research/re-ffx2-hit-status.md`):
 *
 * 1. **Hit determination, once per record** (`pp_hit_determine`, `kernel/hit.ts`): every target of the action, in
 *    ascending slot order, gets its accuracy roll for the command's accuracy formula; then the hits are planned (every
 *    target takes the command's hit count, or, for a random-target command, each hit is dealt to one target from fixed
 *    stream 5). A target that misses takes no strike at all; the engine says so once.
 * 2. **Strikes, one per hit event** (`pp_action_hit_event`): at each hit event every target with hits left takes one
 *    strike, in ascending slot order. One strike is `pp_dmg_calc_target`: the damage classes (base formula and its
 *    variance draw, the critical roll, the modifier chain, the element ladder, Shell/Protect/Defense, immunities), then
 *    the status rolls (every status with a chance byte, group 1 then group 2), the shatter roll on a Petrified target,
 *    the Bribe reward, the all-target halving and the damage limit, then Steal and Pilfer Gil; and the result is applied
 *    (HP with the chain counter, MP, statuses, the stolen item or gil).
 *
 * The engine keeps its one seeded stream: `adapt/draws.ts` takes one engine draw per kernel draw, in the order the
 * kernels ask. `adapt/inputs.ts` builds the kernel inputs from the units; `adapt/command.ts` the command row.
 * The ATB class is computed (its variance draw is consumed) but not applied: the ATB, charge and recovery path is
 * batch W4's.
 */

import type { AbilityDef, Affinity, ElementId } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { MISC_NEEDS_DEAD, TARGET_ALL, type ResolvedCommand } from './adapt/command.ts';
import { critDraw, hitDraw, statusDraw, varianceDraw } from './adapt/draws.ts';
import {
  assignSlotIds,
  hitAttacker,
  hitTarget,
  pipelineAttacker,
  pipelineTarget,
  startStatusResult,
  statByte,
  statusAttacker,
  statusTarget,
} from './adapt/inputs.ts';
import { has, luckStage, statusWord1 } from './adapt/words.ts';
import { bumpChain, chainBefore, chainMultiplier } from './chain.ts';
import { rollCritical, type CritInput } from './kernel/crit.ts';
import { elementLadder } from './kernel/element.ts';
import { HitResult, determineHits } from './kernel/hit.ts';
import { computeClassDamage } from './kernel/pipeline.ts';
import { CLASS_HP, CLASS_MP, type PipelineHooks, type PipelineInput, type StatusPhaseOutcome } from './kernel/pipeline-types.ts';
import { settleDamage } from './kernel/settle.ts';
import { SHATTER_SET_BITS, rollCommandStatuses, rollShatter } from './kernel/status.ts';
import type { StatusOutcome, StatusResult } from './kernel/statusTypes.ts';
import { afterRevive, applyHpDelta, heal, type ResolveContext } from './resolve-hp.ts';
import { applyStatusResult, rollEngineRiders } from './resolve-status.ts';
import { applyBribeReward, applyPilferGil, applyStealItem, type TheftEnv } from './steal.ts';

/** What the caller of `resolveAbility` hands the strikes beyond the ability. */
export interface StrikeOptions {
  /** A minigame outcome that replaces the row's hit count (Trigger Happy, a dice roll). */
  hitsOverride?: number;
  /** The gil offered: a Bribe's amount, Spare Change's gil (`ActionRec+0xb0`). */
  gilSpent?: number;
}

/** The three save-record fields the base formulas 0xd, 0x16 and 0x17 read: not pinned in the game's code, 0. */
const ZERO_RECORDS = { attackerF40: 0, attackerF44: 0, targetF44: 0 } as const;

const ELEMENT_OF_BIT: ReadonlyArray<readonly [number, ElementId]> = [
  [1, 'fire'],
  [2, 'ice'],
  [4, 'lightning'],
  [8, 'water'],
  [0x10, 'gravity'],
  [0x20, 'holy'],
];

/** The element a damage event prints: the ability's first, else the row's first bit. */
function eventElement(ability: AbilityDef, command: ResolvedCommand): ElementId {
  const own = ability.element.find((e) => e !== 'none');
  if (own !== undefined) return own;
  const mask = command.pipeline.element;
  return ELEMENT_OF_BIT.find(([bit]) => (mask & bit) !== 0)?.[1] ?? 'none';
}

/** The affinity label of a hit, from the same ladder the pipeline ran (a pure re-read: no draw). */
function affinityLabel(target: ReturnType<typeof pipelineTarget>, mask: number): Affinity {
  const outcome = elementLadder(target.affinities, mask, 100).outcome;
  if (outcome === 'weak') return 'weak';
  if (outcome === 'half') return 'resist';
  if (outcome === 'null') return 'immune';
  if (outcome === 'absorb') return 'absorb';
  return 'normal';
}

/** Everything one action's strikes share. */
interface Env {
  ctx: ResolveContext;
  user: Ffx2Unit;
  ability: AbilityDef;
  command: ResolvedCommand;
  ids: Map<Ffx2Unit, number>;
  /** The player chose to hit all targets of a command that can: the all-target halving (`ActionRec+0x27`). */
  allTargets: boolean;
  gilSpent: number;
  /** Total hit events of the action, for the presenter's pacing. */
  hitCount: number;
  /** Next `hitIndex`. */
  index: number;
  theft: TheftEnv;
}

/**
 * One strike on one target: `pp_dmg_calc_target` and the application of its result. Returns the HP number applied
 * (positive damage, negative healing).
 */
function strike(env: Env, target: Ffx2Unit): number {
  const { ctx, user, ability, command } = env;
  const attackerId = env.ids.get(user) ?? 0;
  const targetId = env.ids.get(target) ?? 0;
  const noChain = ability.extra?.['noChain'] === true; // Lady Luck's Dud: a penalty that cannot kill opens no chain
  const before = noChain ? 0 : chainBefore(target);

  // The limit is 99999 when the attacker carries Break Damage Limit (a girl's gate or accessory) or the row forces it (0x80). The monster
  // rows' cap bit is absent on a dozen moves the FAQs say break the limit (Mega Flare, Tail Beam, Final Impact...) and the layout read so
  // far gives a monster no such word, so the cast's authored flag stands in for the attacker's word (research/re-ffx2-commands.md section 9).
  const breaksLimit = ctx.breaksDamageLimit(user) || ability.flags.includes('always-break-damage-limit');

  const input: PipelineInput = {
    cmd: command.pipeline,
    attacker: pipelineAttacker(user, attackerId, breaksLimit),
    target: pipelineTarget(target, targetId, before),
    amount: env.gilSpent,
    allTargets: env.allTargets,
    preview: false,
    backAttack: false, // the engine has no facing: "never a back attack"
    records: ZERO_RECORDS,
  };
  const critInput: CritInput = {
    canCrit: true, // the pipeline asks only when the row can crit
    fixedChance: (command.pipeline.flagsDamage & 8) !== 0,
    critByte: command.record.critByte,
    attackerSlot: attackerId,
    attackerLuck: statByte(user.stats.luck),
    attackerLuckStage: luckStage(user),
    targetLuck: statByte(target.stats.luck),
    targetLuckStage: luckStage(target),
    alwaysCritical: has(user, 'guaranteed-critical'),
  };
  const hooks: PipelineHooks = {
    draw: varianceDraw(ctx.rng),
    rollCrit: () => rollCritical(critInput, 0, critDraw(ctx.rng)).critical,
  };
  const classes = computeClassDamage(input, hooks);
  if (!classes.gate) {
    // The game does nothing to a target that fails the gate. A revival aimed at someone standing says so.
    if ((command.pipeline.flagsMisc & MISC_NEEDS_DEAD) !== 0 && target.alive) {
      ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
      env.index += 1;
    }
    return 0;
  }

  // --- the status rolls: every status with a chance byte, group 1 then group 2 ---------------------------------
  const petrified = has(target, 'petrify');
  const hasStatuses = command.status.chance1.some((c) => c !== 0) || command.status.chance2.some((c) => c !== 0);
  let result: StatusResult | undefined;
  let log: StatusOutcome[] = [];
  let zeroAtbDelta = false;
  if (hasStatuses) {
    const rolled = rollCommandStatuses(
      statusAttacker(user, attackerId),
      statusTarget(target, targetId),
      command.status,
      startStatusResult(target, (command.pipeline.flagsMisc & 0x800) !== 0),
      statusDraw(ctx.rng),
    );
    result = rolled.result;
    log = rolled.log;
    zeroAtbDelta = rolled.zeroAtbDelta;
  }
  // --- the shatter roll on a Petrified target ------------------------------------------------------------------
  const shatter = rollShatter(petrified, command.shatter, attackerId, statusDraw(ctx.rng));
  if (shatter.shattered) {
    const base = result ?? startStatusResult(target, false);
    result = { ...base, statusSet: (base.statusSet | SHATTER_SET_BITS) >>> 0 };
  }
  // --- the Bribe reward, then the settled numbers (halving, Death replaces damage, the limit) ------------------
  if (command.bribe) applyBribeReward(env.theft, target);
  const resultSet = result?.statusSet ?? statusWord1(target);
  const outcome: StatusPhaseOutcome = {
    hasteSlowFailed: zeroAtbDelta,
    resultHasDeath: (resultSet & 1) !== 0,
    resultHasPetrify: (resultSet & 2) !== 0,
    shattered: shatter.shattered,
  };
  const settled = settleDamage(classes, input, outcome);
  let hp = settled.hp;
  if (ability.extra?.['cannotKill'] === true && hp > 0 && hp >= target.hp) hp = Math.max(0, target.hp - 1); // Bullseye

  // --- apply: HP (with the chain), MP, then statuses, then theft -----------------------------------------------
  const wasAlive = target.alive;
  const index = env.index;
  env.index += 1;
  if ((settled.flags & CLASS_HP) !== 0) {
    const immune = (command.pipeline.damageClass & CLASS_HP) !== 0 && (settled.surviving & CLASS_HP) === 0 && settled.blocked > 0;
    if (immune) {
      ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
    } else {
      if (hp > 0 && !noChain) {
        ctx.emit({ type: 'chain', targetId: target.id, count: before, multiplier: chainMultiplier(before) });
        bumpChain(target, before, classes.critical);
      }
      if (wasAlive) {
        ctx.emit({
          type: 'damage',
          targetId: target.id,
          sourceId: user.id,
          amount: hp,
          element: eventElement(ability, command),
          affinity: affinityLabel(input.target, command.pipeline.element),
          crit: classes.critical,
          hitIndex: index,
          hitCount: env.hitCount,
          ...(Math.abs(hp) >= settled.cap ? { capped: true } : {}),
        });
      }
      applyHpDelta(ctx, target, hp, user.id);
      if (command.absorbs && hp > 0) heal(ctx, user, hp, 'drain');
    }
  }
  if ((settled.flags & CLASS_MP) !== 0 && settled.mp !== 0) {
    const mpBefore = target.mp;
    target.mp = Math.max(0, Math.min(target.stats.maxMp, mpBefore - settled.mp));
    const moved = mpBefore - target.mp;
    if (moved > 0) {
      ctx.emit({ type: 'mp-damage', targetId: target.id, sourceId: user.id, amount: moved });
      if (command.absorbs) {
        const userBefore = user.mp;
        user.mp = Math.min(user.stats.maxMp, userBefore + moved);
        if (user.mp > userBefore) ctx.emit({ type: 'mp-heal', targetId: user.id, sourceId: target.id, amount: user.mp - userBefore });
      }
    } else if (moved < 0) {
      ctx.emit({ type: 'mp-heal', targetId: target.id, sourceId: user.id, amount: -moved });
    }
  }
  if (result !== undefined) applyStatusResult(ctx, user, target, ability, command, result);
  rollEngineRiders(ctx, user, target, ability, command);
  if (!wasAlive && target.alive) afterRevive(ctx, target, ability.id);
  // A status-only action on a target immune to every status it carried says so (a rider on a damaging hit stays quiet).
  if (hasStatuses && command.pipeline.power === 0 && log.some((l) => l.immune) && !log.some((l) => l.applied || l.removed)) {
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
  }
  if (command.stealsItem) applyStealItem(env.theft, command, user, target);
  if (command.stealsGil) applyPilferGil(env.theft, user, target);
  return hp;
}

/**
 * Run an action's hits against `pool` (the targets the caller resolved). Returns the total HP number dealt (signed),
 * so an AI script can log it.
 */
export function runStrikes(
  ctx: ResolveContext,
  user: Ffx2Unit,
  ability: AbilityDef,
  command: ResolvedCommand,
  pool: readonly Ffx2Unit[],
  options: StrikeOptions = {},
): number {
  const ids = assignSlotIds(ctx.units);
  const idOf = (u: Ffx2Unit): number => ids.get(u) ?? 0;
  const targets = [...pool].sort((a, b) => idOf(a) - idOf(b));
  const gilSpent = Math.max(0, Math.trunc(options.gilSpent ?? 0));
  const theft: TheftEnv = { state: ctx.state, rng: ctx.rng, items: ctx.items, emit: ctx.emit };

  // A Bribe spends the gil offered, hit or miss. The party's wallet is a flag the host sets; without one the offer is free.
  if (command.bribe && gilSpent > 0 && ctx.state !== undefined) {
    const wallet = ctx.state.flags['gil'];
    if (typeof wallet === 'number') ctx.state.flags['gil'] = Math.max(0, wallet - gilSpent);
  }

  const determined = determineHits(
    hitAttacker(user, idOf(user)),
    command.hit,
    { repeatCount: 0, repeatLimit: 3, amount: gilSpent, hitsOverride: options.hitsOverride ?? 0 },
    targets.map((t) => hitTarget(t, idOf(t))),
    hitDraw(ctx.rng, command.accuracyFormula, targets),
  );
  determined.targets.forEach((r, i) => {
    const t = targets[i];
    if (t !== undefined && r.bribe !== undefined) {
      t.bribeAccumulated = r.bribe.accumulated;
      t.bribeThreshold = r.bribe.threshold;
    }
  });

  // Hit events: how many strikes each target takes, and how many hit events the presenter paces.
  const planned = determined.perTargetHits;
  let hitCount = 0;
  determined.targets.forEach((r, i) => {
    const n = planned[i] ?? 0;
    if (n > 0) hitCount += r.result === HitResult.Hit ? n : 1;
  });
  const env: Env = {
    ctx,
    user,
    ability,
    command,
    ids,
    allTargets:
      user.side === 'party' && (command.record.flagsTarget & TARGET_ALL) !== 0 && ability.targeting.startsWith('all'),
    gilSpent,
    hitCount,
    index: 0,
    theft,
  };

  const done = targets.map(() => 0);
  const rounds = planned.reduce((m, n) => Math.max(m, n), 0);
  let total = 0;
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const result = determined.targets[i];
      const n = planned[i] ?? 0;
      if (target === undefined || result === undefined || n === 0 || (done[i] ?? 0) >= n) continue;
      if (result.result !== HitResult.Hit) {
        // One miss (or no-effect) per target however many hits were planned.
        done[i] = n;
        ctx.emit({
          type: 'miss',
          targetId: target.id,
          sourceId: user.id,
          reason: result.result === HitResult.NoEffect ? 'immune' : 'evaded',
        });
        env.index += 1;
        continue;
      }
      done[i] = (done[i] ?? 0) + 1;
      total += strike(env, target);
    }
  }
  return total;
}
