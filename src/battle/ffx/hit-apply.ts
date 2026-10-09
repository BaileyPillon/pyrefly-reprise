/**
 * One hit of one action against one target: ask the game's kernels what it does, then carry it out in the engine.
 *
 * Split out of `abilities.ts` (re-parity W1; **FFX only**). `adapt/hit.ts#resolveHit` runs the game's per-hit
 * pipeline (the Nul check, the hit roll, the base damage of every class, the modifier chain, the critical roll,
 * the status infliction, Delay and Threaten, the cap) with the draws in the game's order. This module wraps that in the
 * engine's own business around a hit: Reflect and Cover, the events, the HP / MP / CTB application, revival, the drain
 * heal, the Overdrive gauges and the scripted extras.
 *
 * **Statuses (re-parity W2).** The game keeps one hit record per target per action and every hit of the action edits it:
 * the record starts as the target's status words as the action began, the infliction step reads the LIVE words
 * (unchanged until the action is over) and edits the record, and the record is written back after the damage is applied.
 * {@link HitScope.records} is that record. `adapt/status.ts#runStatusStep` is the game's infliction step, run from inside
 * the hit pipeline where the game runs it (after the damage classes, so its draws follow theirs); `adapt/status-apply.ts`
 * carries the record's changes out on the engine's combatant after the damage, with the events the engine always emitted.
 */

import type { AbilityDef, CombatantId, ElementId, FFXCombatant, StatusId } from '../common/types.ts';
import { idiv } from './math.ts';
import { type Ctx, has, hasFlag, isAlive, onField, rtOf } from './state.ts';
import { type HitDraws } from './adapt/draws.ts';
import { engineDamageClass } from './adapt/command.ts';
import { resolveHit } from './adapt/hit.ts';
import { applyMpDelta, dealDamage, healOutsideChain, reviveActor } from './hp.ts';
import { bouncesOffReflect, removeStatus } from './statuses.ts';
import { addCtb, tickSpeedOf } from './adapt/ctb.ts';
import { PermBit, type StatusRecord } from './kernel/status-types.ts';
import { type LiveStatus, type StatusStepOutput, liveOf, recordOf, runStatusStep } from './adapt/status.ts';
import { type Before, applyStatusStep } from './adapt/status-apply.ts';
import { buffByte, stackBytes } from './adapt/status.ts';
import { redirectTarget, reflectBounceTarget } from './targeting.ts';
import {
  onDamageDealt,
  onDamageTaken,
  onFlatTrigger,
  onHealDealt,
  TACTICIAN_STATUSES,
  VICTIM_STATUSES,
} from './overdrive.ts';
import { runScriptedExtra } from './scripted.ts';
import type { ResolveOptions } from './abilities.ts';

/** The game's hit record of one target for one action: the live words it reads, and the record its hits edit. */
export interface ActionRecord {
  /** The target's permanent word, counters and extra word as the action began (the infliction step's "already has it" reads). */
  live: LiveStatus;
  /** The record, after the target's earlier hits of this action. */
  record: StatusRecord;
}

/** Everything the hits of one action share, and the two running figures they add to. */
export interface HitScope {
  ctx: Ctx;
  user: FFXCombatant;
  def: AbilityDef;
  options: ResolveOptions;
  draws: HitDraws;
  /** The element the damage events name. */
  primaryElement: ElementId;
  /** How many hits the whole action makes in all (targets times hits), for the events. */
  totalHits: number;
  /** Index of the next hit, advanced once per hit whatever came of it. */
  hitIndex: number;
  /** Total HP damage dealt so far (positive only). */
  totalDealt: number;
  /** The rank of the action in progress: Threaten's delay is made of the recovery this rank costs the user. */
  rank: number;
  /** The hit record of each target the action has touched, made when its first hit starts. */
  records: Map<CombatantId, ActionRecord>;
}

/** A new scope's empty record book. */
export function newRecordBook(): Map<CombatantId, ActionRecord> {
  return new Map();
}

/** The hit record of `target` for this action: the snapshot of its status words taken at its first hit. */
function recordFor(scope: HitScope, target: FFXCombatant): ActionRecord {
  let book = scope.records.get(target.id);
  if (!book) {
    book = { live: liveOf(target), record: recordOf(target) };
    scope.records.set(target.id, book);
  }
  return book;
}

/** Write the Nul counters the hit's Nul check ticked back onto the target's statuses, dropping a spent one. */
function writeBackNul(ctx: Ctx, target: FFXCombatant, nul: { tide: number; blaze: number; shock: number; frost: number }): void {
  const pairs: Array<[StatusId, number]> = [
    ['nultide', nul.tide],
    ['nulblaze', nul.blaze],
    ['nulshock', nul.shock],
    ['nulfrost', nul.frost],
  ];
  for (const [status, counter] of pairs) {
    const inst = target.statuses[status];
    if (!inst || inst.permanent) continue;
    if (counter <= 0) removeStatus(ctx, target, status, 'consumed');
    else inst.charges = counter;
  }
}

/** Resolve one hit on `rawTarget`. The engine's Reflect, Cover and Provoke come first, as they always did. */
export function resolveOneHit(scope: HitScope, rawTarget: FFXCombatant): void {
  const { ctx, user, def, options } = scope;
  let target = redirectTarget(ctx, user, rawTarget, def);

  // Reflect bounces a single-target reflectable spell to the other side.
  if (bouncesOffReflect(def, target)) {
    const bounced = reflectBounceTarget(ctx, target);
    if (!bounced) {
      ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'nullified' });
      scope.hitIndex++;
      return;
    }
    onFlatTrigger(ctx, target, 'rook', 'rook');
    target = bounced;
  }

  const row = options.rowFor?.(target) ?? def; // this target's row: DmgCon and rider (od5); draws nothing
  const targetRt = rtOf(ctx, target.id);
  const book = recordFor(scope, target);
  // What the status step starts from, before anything of this hit is applied: the record, and the stacks and buff flags
  // the stage-buff step and the buff write-back change on the character itself.
  const before: Before = { record: book.record, stacks: stackBytes(target), buff: buffByte(target) };
  const made: { step?: StatusStepOutput } = {};
  const report = resolveHit(
    {
      // The damage chain alone may read another actor's stat block [ffx-seymour-flux §5.4] — see `ResolveOptions.statsUser`.
      actor: user,
      statsUser: options.statsUser ?? user,
      target,
      row,
      ...(options.power !== undefined ? { power: options.power } : {}),
      ...(options.timing ? { timing: options.timing } : {}),
      ...(options.gilSpent !== undefined ? { gilSpent: options.gilSpent } : {}),
      targetCtb: targetRt.ctb,
      targetTick: tickSpeedOf(target),
      isCounter: options.isCounter === true || hasFlag(def, 'is-counter'),
    },
    scope.draws,
    // The infliction step, run by the pipeline once the hit has landed and its damage classes have drawn (`HitIo.status`).
    (command) => {
      made.step = runStatusStep(
        { ctx, user, target, def: row, command, rank: scope.rank, live: book.live, record: book.record },
        scope.draws.modulus,
      );
      return made.step.outcome;
    },
  );

  // The Nul check: the game ticks the counters of a nullified hit, and only of that.
  if (report.outcome === 'nullified') {
    writeBackNul(ctx, target, report.nul);
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'nullified' });
    onFlatTrigger(ctx, target, 'rook', 'rook');
    scope.hitIndex++;
    return;
  }
  // `misses-if-target-alive` (Phoenix Down) whiffs on a living target — but a living **Zombie** is still
  // processed, and killed [ffx-combat-core §12.3]: the game's "no effect" answer, which draws nothing.
  if (report.outcome === 'noEffect') {
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'wrong-state' });
    scope.hitIndex++;
    return;
  }
  if (report.outcome === 'miss') {
    ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'evaded' });
    onFlatTrigger(ctx, target, 'dancer', 'dancer');
    scope.hitIndex++;
    return;
  }

  const [hpAmount, mpAmount, ctbAmount] = report.amounts;
  const crit = report.crit;
  const step = made.step;
  let skipHp = false;

  // The Death bit of the record decides the engine's two Death outcomes. A cleansing command (Life, Full-Life, Phoenix Down)
  // takes it off a dead target (a revival) and puts it ON a Zombie, which kills it [`kernel/status-inflict.ts`, VA 0x0078ae00];
  // the kernel has already zeroed the damage of a hit that newly kills (VA 0x0078c480).
  const wasDead = (before.record.perm & PermBit.Death) !== 0;
  const nowDead = step !== undefined && (step.result.record.perm & PermBit.Death) !== 0;
  const revived = step !== undefined && wasDead && !nowDead;
  const newlyDead = step !== undefined && !wasDead && nowDead;

  // A revival stands the target up with the hit's restoring amount (half its maximum when the command computes none).
  // A KO'd Zombie comes back still a Zombie; a revival never reaches an unrevivable target.
  if (revived) {
    skipHp = true;
    if (!isAlive(target) && onField(target)) {
      const restore = Math.abs(hpAmount) || idiv(target.stats.maxHp, 2);
      if (reviveActor(ctx, target, restore, def.id)) {
        onHealDealt(ctx, user, target, restore);
      } else {
        ctx.emit({ type: 'miss', targetId: target.id, sourceId: user.id, reason: 'immune' });
      }
    }
  } else if (newlyDead && hasFlag(def, 'heals') && hasFlag(def, 'can-target-dead')) {
    // A revival effect on a living Zombie kills it: no number, the KO is the effect (carried out with the statuses below).
    skipHp = true;
  }

  if (!skipHp) {
    // The CTB class (Haste and Slow rescale the counter through their own formula-0xd amount; a Delay Attack or Buster adds
    // its multiple of the target's tick speed): the live class bit 4 of the result word, applied as the exe's SubCtb does,
    // `clamp(counter + amount, 0, 255)`.
    if ((report.resultMask & 4) !== 0 && ctbAmount !== 0) addCtb(ctx, target, ctbAmount);

    // The MP class: restores (Ether) or drains (Osmose, Lancet), and the drainer gains what was taken.
    if ((report.classes & 2) !== 0 && mpAmount !== 0) {
      const drained = applyMpDelta(ctx, target, mpAmount, user.id);
      if (hasFlag(def, 'drains-mp') || def.formula === 'lancet') applyMpDelta(ctx, user, -Math.abs(drained), user.id);
    }

    // The HP class.
    if ((report.classes & 1) !== 0 && hpAmount !== 0) {
      dealDamage(ctx, target, hpAmount, {
        sourceId: user.id,
        element: scope.primaryElement,
        affinity: report.affinity,
        crit,
        hitIndex: scope.hitIndex,
        hitCount: scope.totalHits,
        ...(report.capped ? { capped: true } : {}),
      });
      if (hpAmount > 0) {
        // A physical hit WAKES a sleeper [ffx-combat-core §4.2; the shipped
        // status record says it in as many words —
        // `data/ffx/statuses/core.ts` sleep: "Physical damage wakes the
        // sleeper; magic damage does not", and its `curedBy` lists "any
        // physical hit"]. This is additive and it closes a soft-lock, not
        // just a fidelity gap: `state.ts canAct` drops a sleeper out of the
        // CTB queue entirely, and `ticks.ts onTurnEnd` is the only place
        // the counters tick — so a sleeping actor never reaches a
        // turn end and its 3-turn Sleep never counts down. Measured in
        // Chapter 3: one Yu Pagoda Curse put Tidus to sleep on turn 17 of a
        // 204-turn battle and he never acted again.
        if (def.damageType === 'physical' && has(target, 'sleep')) {
          removeStatus(ctx, target, 'sleep', 'expired');
        }
        scope.totalDealt += hpAmount;
        onDamageTaken(ctx, target, hpAmount, user.side === 'enemy');
        onDamageDealt(ctx, user, def, hpAmount);
        if (hasFlag(def, 'drains')) {
          healOutsideChain(ctx, user, hpAmount, 'drain', user.id);
        }
      } else {
        onHealDealt(ctx, user, target, -hpAmount);
      }
    } else if (((report.classes | engineDamageClass(def)) & 1) !== 0 && def.formula !== 'none' && isAlive(target)) {
      // **A connecting hit that computes to zero is still a hit, and FFX puts
      // the number on the screen.** `immune_to_percentage_damage` enemies
      // "take 0 from Percentage Total / Percentage Current"
      // [ffx-combat-core §291], and a Fury spell whose damage constant is 0 —
      // Bio Fury, Death Fury — is authored `power: 0` on purpose
      // [§5.7]: the cast is the *carrier* for a rider, not a blank.
      //
      // Suppressing the event made three shipped Overdrive rows invisible:
      // Bio Fury, Death Fury and Demi Fury each spent a full gauge and
      // emitted nothing but `action-start` / `overdrive-gauge{spent}` /
      // `action-end`, which reads exactly like a broken button. `formula:
      // 'none'` is excluded because those actions never ran a damage chain at
      // all (Steal, Use, Cheer) and have no number to show.
      dealDamage(ctx, target, 0, {
        sourceId: user.id,
        element: scope.primaryElement,
        affinity: report.affinity,
        crit,
        hitIndex: scope.hitIndex,
        hitCount: scope.totalHits,
      });
    }
  }

  // The statuses the infliction step put in the hit record, written back after the damage, in the decompile's order: the
  // words and counters, the stage buffs, the buff flags, then a Death (Auto-Life, forms) or an Eject (the target leaves the
  // field) the record carries. A petrified monster always shatters because Petrify on a monster puts Death and Eject in the
  // record itself, and the shatter roll against an already petrified target is the step's own (`Cmd+0x2c`).
  if (step) {
    const applied = applyStatusStep(ctx, user, target, def, before, step);
    book.record = step.result.record;
    for (const status of applied.added) {
      if (TACTICIAN_STATUSES.includes(status) && target.side === 'enemy') onFlatTrigger(ctx, user, 'tactician', 'tactician');
      if (VICTIM_STATUSES.includes(status) && user.side === 'enemy') onFlatTrigger(ctx, target, 'victim', 'victim');
    }
  }

  runScriptedExtra(ctx, user, def, target, hpAmount);
  scope.hitIndex++;
}
