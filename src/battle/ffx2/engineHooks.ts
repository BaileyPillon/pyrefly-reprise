/**
 * Pieces of `FFX2Engine`'s turn bookkeeping that need no engine state of their
 * own, split out of `engine.ts` (house rule 7; that file had grown past 700
 * lines). Pure: no DOM, no `three`, randomness only through the engine's seeded
 * `Rng`. Byte-identical to the inline versions (`ffx2-atb-golden.test.ts`).
 */

import type { BattleState, CombatantId, Command, Rng } from '../common/types.ts';
import type { AbilityRegistry, AiContext, EventDraft, Ffx2Unit } from './internal.ts';
import { advanceStatuses } from './statuses.ts';
import { applyHpDelta, heal, resolveAbility, type ResolveContext } from './resolve.ts';
import { berserkCommand, type MenuContext } from './targeting.ts';
import { aiScriptFor } from './ai/index.ts';

type Emit = (draft: EventDraft) => void;

/** Regen and Poison payouts plus status expiries, for one sub-step. */
export function payStatusClocks(
  units: Ffx2Unit[],
  step: number,
  emit: Emit,
  ctx: ResolveContext,
  aiContext?: (unit: Ffx2Unit) => AiContext,
): void {
  for (const unit of units) {
    if (!unit.alive) continue;
    const hpBefore = unit.hp;
    const payouts: number[] = [];
    const delta = advanceStatuses(unit, step, emit, (amount) => payouts.push(amount));
    if (delta > 0) {
      emit({
        type: 'damage',
        targetId: unit.id,
        amount: delta,
        element: 'none',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      });
      applyHpDelta(ctx, unit, delta);
    } else if (delta < 0) {
      heal(ctx, unit, -delta, 'regen');
    }
    if (payouts.length > 0 && unit.side === 'enemy' && aiContext) notifyRegen(unit, hpBefore, payouts, aiContext);
  }
}

/**
 * Tell a script once per Regen payout that **healed** (Chapter XI's Sisters:
 * "AC += 5 ... when Regen heals her", research ffx2-fallen-aeons §4.2). A payout
 * that lands at full HP heals nothing and is not counted; two payouts in one
 * clock step count twice. HP is walked payout by payout from the step's start,
 * so a step that tops her up counts only the payouts that still had room.
 * Poison in the same step is ignored here (no Sister takes Poison). Only a
 * script that defines `onRegen` reacts, so every earlier chapter is unchanged.
 */
function notifyRegen(
  unit: Ffx2Unit,
  hpBefore: number,
  payouts: readonly number[],
  aiContext: (unit: Ffx2Unit) => AiContext,
): void {
  const onRegen = aiScriptFor(unit.enemy?.aiScriptId).onRegen;
  if (!onRegen) return;
  let hp = hpBefore;
  for (const amount of payouts) {
    const gained = Math.min(unit.stats.maxHp, hp + amount) - hp;
    hp += gained;
    if (gained > 0) onRegen(aiContext(unit), gained);
  }
}

export function aiContextFor(
  self: Ffx2Unit,
  units: Ffx2Unit[],
  rng: Rng,
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
export function berserkTurnCommand(actor: Ffx2Unit, menu: MenuContext, rng: Rng, emit: Emit): Command {
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
  for (const [targetId, amount] of damageTotals(produced, actor)) {
    const unit = units.find((u) => u.id === targetId);
    if (!unit || unit.side !== 'enemy') continue;
    aiScriptFor(unit.enemy?.aiScriptId).onDamaged?.(aiContext(unit), actor.id, amount);
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
 * The engine's post-action AI hooks, in their fixed order (moved out of `engine.ts#afterAction`,
 * house rule 7; byte-identical): `onDamaged`, `onTargeted`, every enemy's `onTurnResolved`,
 * then the out-of-turn counters. `produced` is re-read before each step, as the inline code
 * did, so a hook that emits is seen by the steps after it.
 */
export function runAfterActionHooks(produced: () => EventDraft[], actor: Ffx2Unit, env: CounterEnv): void {
  notifyEnemiesDamaged(produced(), actor, env.units, env.aiContext);
  notifyEnemiesTargeted(produced(), actor, env.units, env.aiContext);
  for (const unit of env.units) {
    if (unit.side !== 'enemy') continue;
    aiScriptFor(unit.enemy?.aiScriptId).onTurnResolved?.(env.aiContext(unit), actor);
  }
  runCounters(produced(), actor, env); // Paragon's Big Bang (TR12 b)
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
    if (!command || command.kind !== 'ability') continue;
    const ability = env.abilities.get(command.id);
    if (!ability) continue;
    env.emit({ type: 'action-start', actorId: unit.id, command, abilityId: ability.id, abilityName: ability.name, targets: command.targets });
    resolveAbility(env.resolveCtx(), unit, ability, command.targets, { isCounter: true });
    env.emit({ type: 'action-end', actorId: unit.id });
  }
}
