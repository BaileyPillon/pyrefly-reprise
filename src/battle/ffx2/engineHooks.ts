/**
 * Pieces of `FFX2Engine`'s turn bookkeeping that need no engine state of their
 * own, split out of `engine.ts` (house rule 7; that file had grown past 700
 * lines). Pure: no DOM, no `three`, randomness only through the engine's seeded
 * `Rng`. Byte-identical to the inline versions (`ffx2-atb-golden.test.ts`).
 */

import type { BattleState, CombatantId, Command } from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import type { AbilityRegistry, AiContext, EventDraft, Ffx2Unit } from './internal.ts';
import { resolveAbility, type ResolveContext } from './resolve.ts';
import { berserkCommand, type MenuContext } from './menu.ts';
import { confusedTurn, type ConfusionEnv } from './adapt/confusion.ts';
import { Ffx2AtbState } from './kernel/atb-gauge.ts';
import { isConfusedGirl } from './statuses.ts';
import { aiScriptFor } from './ai/index.ts';
import { abilityPerformedBy } from './execute.ts';
import { takeResults } from './results-tally.ts';

type Emit = (draft: EventDraft) => void;

export function aiContextFor(
  self: Ffx2Unit,
  units: Ffx2Unit[],
  rng: BattleRng,
  state: BattleState,
  abilities: AbilityRegistry,
  emit: Emit,
): AiContext {
  return {
    self,
    units,
    rng,
    flags: state.flags,
    ticks: state.ticks,
    ability: (id) => abilities.get(id),
    party: () => units.filter((u) => u.side === 'party' && u.alive && !u.removed),
    allies: () => units.filter((u) => u.side === 'enemy' && u.alive && !u.removed && u.id !== self.id),
    emit,
  };
}

/**
 * The command a Berserked party turn takes, resolved without the player. [§2.8; PR-0045]
 *
 * `berserkCommand` returns an Attack, or a pass on a dressphere that has none
 * (the open sources question is documented there); either way the ATB slot is
 * spent, so Berserk runs down its own clock.
 *
 * PR-0052: she has no Attack to swing (§3.4-3.6's three dresspheres), and the
 * turn used to pass with nothing on screen at all — `performCommand`'s
 * no-ability branch emits only `action-end`, so a Berserked Paine on Lady Luck
 * simply lost her turn in silence. The turn still passes, because the sources
 * conflict about whether she swings anyway (see `berserkCommand`) and hard rule
 * 6 forbids inventing the damage row — but it is now *named*, through the
 * ordinary action banner and message path. FFX-2 only: FFX's Berserk is its own
 * status on its own engine.
 */
export function berserkTurnCommand(actor: Ffx2Unit, menu: MenuContext, rng: BattleRng, emit: Emit): Command {
  const command = berserkCommand(actor, menu, rng);
  if (command.kind === 'defend') {
    emit({ type: 'action-start', actorId: actor.id, command, abilityName: 'Berserk', targets: [] });
    emit({
      type: 'message',
      text: `${actor.name} is Berserk — no command is available; the turn passes.`,
      kind: 'status',
    });
  }
  return command;
}

/**
 * Tell every enemy that was hit by this action that it was hit.
 *
 * `AiScript.onDamaged` has existed in `internal.ts` since the FFX-2 scripts were
 * written and **nothing ever called it**, so three canon mechanics were silently
 * inert: the Core's one-slot attack log, which is the only thing that makes the
 * Bulwarks retaliate at all and which [ffx2-vegnagun-shuyin §3.3] calls "the
 * fight's whole identity"; the Nodes' colour machine, which §3.2 advances on
 * "(own turn resolves) **OR** (hit by any attack)"; and the Head's hit counter,
 * which fires Odi Et Amo (§3.4).
 *
 * Driven off the drafts this action produced rather than from inside
 * `resolve.ts`, so one action notifies each target once with the true total,
 * counters included, and the ordering of the event log is untouched.
 */
export function notifyEnemiesDamaged(
  produced: EventDraft[],
  actor: Ffx2Unit,
  units: Ffx2Unit[],
  aiContext: (unit: Ffx2Unit) => AiContext,
): void {
  const hitCounts = damageHits(produced, actor);
  for (const [targetId, amount] of damageTotals(produced, actor)) {
    const unit = units.find((u) => u.id === targetId);
    if (!unit || unit.side !== 'enemy') continue;
    aiScriptFor(unit.enemy?.aiScriptId).onDamaged?.(aiContext(unit), actor.id, amount, hitCounts.get(targetId) ?? 1);
  }
}

/**
 * Tell every enemy a party action was **aimed at** that it was attacked: once
 * per enemy per action, whatever the outcome — damage, a miss, an immune hit,
 * an absorbed element, a status landing or a Dispel. Read off the drafts this
 * action produced, like {@link notifyEnemiesDamaged}.
 *
 * Only scripts that define `onTargeted` react, and before Chapter XI none did,
 * so every earlier chapter's event log is unchanged. FFX-2 only. The reading is
 * the plan's FA8 a (`docs/plans/chapter-fallen-aeons-review.md`), a sourced
 * `[conflict]`: the wiki's Cindy and Mindy pages say "targeted", Sandy's and
 * Anima's say "receives damage".
 */
export function notifyEnemiesTargeted(
  produced: EventDraft[],
  actor: Ffx2Unit,
  units: Ffx2Unit[],
  aiContext: (unit: Ffx2Unit) => AiContext,
): void {
  if (actor.side !== 'party') return;
  const aimed = new Set<CombatantId>();
  for (const draft of produced) {
    const d = draft as { type: string; targetId?: CombatantId; sourceId?: CombatantId; reason?: string };
    if (!d.targetId) continue;
    const hostile =
      ((d.type === 'damage' || d.type === 'miss' || d.type === 'status-add' || d.type === 'mp-damage') &&
        d.sourceId === actor.id) ||
      (d.type === 'status-remove' && d.reason === 'dispelled');
    if (hostile) aimed.add(d.targetId);
  }
  for (const targetId of aimed) {
    const unit = units.find((u) => u.id === targetId);
    if (!unit || unit.side !== 'enemy') continue;
    aiScriptFor(unit.enemy?.aiScriptId).onTargeted?.(aiContext(unit), actor.id);
  }
}

/**
 * Tell every enemy that took results from this action how many, once (re-parity AI lane C; FFX-2 only). The game
 * runs a monster's reaction entry once per result applied to it (a landing strike each; one for a miss; one for a
 * no-effect result; never its own, `results-tally.ts`), and the two scripts that count them (Baralai's burst
 * counter, Ixion's action counter) only read the counter on their next poll, so one report after the action is the
 * same thing. The tally is emptied for every enemy whether or not its script listens, so it never carries over.
 */
export function notifyEnemiesResults(units: Ffx2Unit[], aiContext: (unit: Ffx2Unit) => AiContext): void {
  for (const unit of units) {
    if (unit.side !== 'enemy') continue;
    const report = takeResults(unit);
    if (report === undefined || !unit.alive) continue;
    aiScriptFor(unit.enemy?.aiScriptId).onResults?.(aiContext(unit), report);
  }
}

/**
 * The engine's post-action AI hooks, in their fixed order (moved out of `engine.ts#afterAction`,
 * house rule 7; byte-identical): `onDamaged`, `onTargeted`, `onResults`, every enemy's `onTurnResolved`,
 * then the out-of-turn counters. `produced` is re-read before each step, as the inline code
 * did, so a hook that emits is seen by the steps after it.
 */
export function runAfterActionHooks(produced: () => EventDraft[], actor: Ffx2Unit, env: CounterEnv): void {
  notifyEnemiesDamaged(produced(), actor, env.units, env.aiContext);
  notifyEnemiesTargeted(produced(), actor, env.units, env.aiContext);
  notifyEnemiesResults(env.units, env.aiContext);
  for (const unit of env.units) {
    if (unit.side !== 'enemy') continue;
    aiScriptFor(unit.enemy?.aiScriptId).onTurnResolved?.(env.aiContext(unit), actor);
  }
  runCounters(produced(), actor, env); // Paragon's Big Bang (TR12 b)
  runPartyActionAnswers(produced(), actor, env); // Oversoul Paragon, an OFF option (§12.2)
}

/**
 * `AiScript.onPartyAction` (FFX-2 only; Oversoul Paragon's copy-and-answer script, research
 * ffx2-trema §12.2, an option that ships OFF): after every party action, each living enemy whose
 * script defines the hook is told which ability the action used and whether it was aimed at it
 * (named as a target, or hit, missed or touched by it). A command it returns resolves at once as a
 * counter, exactly as {@link runCounters} resolves one. No shipped script defines the hook.
 */
function runPartyActionAnswers(produced: EventDraft[], actor: Ffx2Unit, env: CounterEnv): void {
  if (actor.side !== 'party') return;
  const start = produced.find((d) => d.type === 'action-start' && (d as { actorId?: CombatantId }).actorId === actor.id) as
    { abilityId?: string; targets?: CombatantId[] } | undefined;
  for (const unit of env.units) {
    if (unit.side !== 'enemy' || !unit.alive || unit.removed) continue;
    const script = aiScriptFor(unit.enemy?.aiScriptId);
    if (!script.onPartyAction) continue;
    const aimedAtSelf = Boolean(start?.targets?.includes(unit.id)) || produced.some((d) => {
      const x = d as { targetId?: CombatantId; sourceId?: CombatantId };
      return x.targetId === unit.id && x.sourceId === actor.id;
    });
    // A charged ability's `action-start` is in an earlier slice, so the ability comes from `execute.ts`.
    const abilityId = abilityPerformedBy(actor) ?? start?.abilityId;
    const command = script.onPartyAction(env.aiContext(unit), actor, { abilityId, aimedAtSelf });
    if (command && command.kind === 'ability') resolveAsCounter(env, unit, command);
  }
}

/** Resolve an out-of-turn command for `unit`: `action-start`, the ability as a counter, `action-end`, no ATB. */
function resolveAsCounter(env: CounterEnv, unit: Ffx2Unit, command: Extract<Command, { kind: 'ability' }>): void {
  const ability = env.abilities.get(command.id);
  if (!ability) return;
  env.emit({ type: 'action-start', actorId: unit.id, command, abilityId: ability.id, abilityName: ability.name, targets: command.targets });
  resolveAbility(env.resolveCtx(), unit, ability, command.targets, { isCounter: true });
  env.emit({ type: 'action-end', actorId: unit.id });
}

/** A counter a result set off, waiting for the action that caused it to end (`applied.ts`). */
export interface PendingCounter {
  target: Ffx2Unit;
  source: Ffx2Unit;
  cause: 'counterattack' | 'evade-and-counter' | 'magic-counter';
}

/**
 * **A girl's counters** (Berserker: Counterattack, Magic Counter, Evade & Counter; re-parity X2-D, FFX-2 only). The game queues the
 * girl's own Attack at the attacker as a system action (note FFX2-G04 3.6); the engine plays each one once the action that set it off
 * has ended, as a free action like an enemy's counter: `action-start`, her Attack at the source alone, the `counter` event, `action-end`,
 * and no change to her ATB (a system action is not her turn; the notes say nothing about a cost, `[estimate]`). A counter whose girl or
 * attacker has fallen in the meantime is dropped. Her blow reports to the enemy scripts as a party action's damage does (`onDamaged`,
 * `onTargeted`, the results tally) but is not a turn (`onTurnResolved` is not told) and sets off no counter of its own.
 */
export function runPartyCounters(
  queue: PendingCounter[],
  env: CounterEnv & { mark(): number; since(from: number): EventDraft[] },
): void {
  while (queue.length > 0) {
    const { target: girl, source, cause } = queue.shift() as PendingCounter;
    if (!girl.alive || girl.removed || !source.alive || source.removed) continue;
    const ability = env.abilities.get('attack');
    if (!ability) continue;
    const from = env.mark();
    const command: Command = { kind: 'attack', targets: [source.id] };
    env.emit({ type: 'action-start', actorId: girl.id, command, abilityId: ability.id, abilityName: ability.name, targets: [source.id] });
    resolveAbility(env.resolveCtx(), girl, ability, [source.id], { isCounter: true, counterCause: cause });
    env.emit({ type: 'action-end', actorId: girl.id });
    notifyEnemiesDamaged(env.since(from), girl, env.units, env.aiContext);
    notifyEnemiesTargeted(env.since(from), girl, env.units, env.aiContext);
    notifyEnemiesResults(env.units, env.aiContext);
  }
}

/** HP damage this action dealt, per target (an HP cost the caster paid is not a hit). */
function damageTotals(produced: EventDraft[], actor: Ffx2Unit): Map<CombatantId, number> {
  const totals = new Map<CombatantId, number>();
  for (const draft of produced) {
    if (draft.type !== 'damage') continue;
    const hit = draft as { targetId: CombatantId; amount: number };
    if (!(hit.amount > 0)) continue;
    // An HP *cost* is the caster paying for her own ability, not a hit on her.
    if (hit.targetId === actor.id && actor.side === 'party') continue;
    totals.set(hit.targetId, (totals.get(hit.targetId) ?? 0) + hit.amount);
  }
  return totals;
}

/** How many separate HP-damaging results this action put on each target (the game's reaction entry runs once per result). */
function damageHits(produced: EventDraft[], actor: Ffx2Unit): Map<CombatantId, number> {
  const counts = new Map<CombatantId, number>();
  for (const draft of produced) {
    if (draft.type !== 'damage') continue;
    const hit = draft as { targetId: CombatantId; amount: number };
    if (!(hit.amount > 0)) continue;
    if (hit.targetId === actor.id && actor.side === 'party') continue; // an HP cost is not a hit
    counts.set(hit.targetId, (counts.get(hit.targetId) ?? 0) + 1);
  }
  return counts;
}

/** What {@link runCounters} needs from the engine. */
export interface CounterEnv {
  units: Ffx2Unit[];
  abilities: AbilityRegistry;
  /** The mitigation class of the party action that just resolved (`flags.lastAttackClass`). */
  attackClass: string;
  aiContext(unit: Ffx2Unit): AiContext;
  resolveCtx(): ResolveContext;
  emit: Emit;
}

/**
 * **Out-of-turn counters** (`AiScript.counter`; FFX-2 only, Chapter XIII's Paragon).
 *
 * After a party action, every living enemy it damaged whose script defines `counter` is asked
 * once. A command it returns resolves at once as a counter (`isCounter`, which emits the
 * `counter` event): `action-start`, the ability, `action-end`, and **no** change to the
 * enemy's ATB, because a counter is not its turn. The sources call Paragon's Big Bang a
 * "Counter" [ffx2-trema §4.1, `[SinirothX]`]; the plan's TR12 = b took the immediate reading
 * over "on its next turn". Whether a counter waits out a chain lock is not in the sources:
 * it does not wait, `[estimate]`. No script defined `counter` before Chapter XIII, so every
 * other chapter's event log is unchanged.
 */
export function runCounters(produced: EventDraft[], actor: Ffx2Unit, env: CounterEnv): void {
  if (actor.side !== 'party') return;
  const hits = damageTotals(produced, actor);
  // A hit that takes only MP is still a hit (the wiki: a Mana Spring drain draws Big Bang).
  for (const draft of produced) {
    const d = draft as { type: string; targetId?: CombatantId; sourceId?: CombatantId; amount?: number };
    if (d.type !== 'mp-damage' || d.sourceId !== actor.id || !d.targetId || !((d.amount ?? 0) > 0)) continue;
    hits.set(d.targetId, (hits.get(d.targetId) ?? 0) + (d.amount ?? 0));
  }
  for (const [targetId, amount] of hits) {
    const unit = env.units.find((u) => u.id === targetId);
    if (!unit || unit.side !== 'enemy' || !unit.alive || unit.removed) continue;
    const script = aiScriptFor(unit.enemy?.aiScriptId);
    if (!script.counter) continue;
    const command = script.counter(env.aiContext(unit), actor, { amount, attackClass: env.attackClass });
    if (command && command.kind === 'ability') resolveAsCounter(env, unit, command);
  }
}

/** What an autopilot turn needs from the engine (re-parity RC9 lane X2-H). */
export interface AutopilotHost {
  readonly menu: MenuContext;
  readonly confusion: ConfusionEnv;
  readonly rng: BattleRng;
  readonly emit: Emit;
  /** The turn begins (`turn-start`). */
  begin(): void;
  /** Resolve the command as the actor. */
  perform(command: Command): void;
}

/**
 * One turn of a girl the player does not control. **FFX-2 only.** Berserk (the game's state 8) swings her Attack ({@link berserkTurnCommand});
 * Confusion (state 7) is her own pick of a command and a target by the game's rule (`adapt/confusion.ts`, `kernel/confusion-pick.ts`). Berserk wins
 * when both are on, as in the game (it removes Confusion when it lands). A Confusion pick that queues nothing (no candidate, or nobody to aim at) is not a
 * turn: the game's pick returns 0, her state goes back to IDLE and the next logic step asks again, so she stays idle here with the recovery she has.
 */
export function runAutopilot(actor: Ffx2Unit, host: AutopilotHost): void {
  if (!actor.statuses.berserk && isConfusedGirl(actor)) {
    const turn = confusedTurn(actor, host.confusion);
    if (turn === null) {
      actor.gauge.state = Ffx2AtbState.Idle;
      return;
    }
    host.begin();
    host.perform(turn.command);
    return;
  }
  host.begin();
  host.perform(berserkTurnCommand(actor, host.menu, host.rng, host.emit));
}
