/**
 * Pieces of `FFX2Engine`'s turn bookkeeping that need no engine state of their
 * own, split out of `engine.ts` (house rule 7; that file had grown past 700
 * lines). Pure: no DOM, no `three`, randomness only through the engine's seeded
 * `Rng`. Byte-identical to the inline versions (`ffx2-atb-golden.test.ts`).
 */

import type { BattleState, CombatantId, Command, Rng } from '../common/types.ts';
import type { AbilityRegistry, AiContext, EventDraft, Ffx2Unit } from './internal.ts';
import { advanceStatuses } from './statuses.ts';
import { applyHpDelta, heal, type ResolveContext } from './resolve.ts';
import { berserkCommand, type MenuContext } from './targeting.ts';
import { aiScriptFor } from './ai/index.ts';

type Emit = (draft: EventDraft) => void;

/** Regen and Poison payouts plus status expiries, for one sub-step. */
export function payStatusClocks(units: Ffx2Unit[], step: number, emit: Emit, ctx: ResolveContext): void {
  for (const unit of units) {
    if (!unit.alive) continue;
    const delta = advanceStatuses(unit, step, emit);
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
  const totals = new Map<CombatantId, number>();
  for (const draft of produced) {
    if (draft.type !== 'damage') continue;
    const hit = draft as { targetId: CombatantId; amount: number };
    if (!(hit.amount > 0)) continue;
    // An HP *cost* is the caster paying for her own ability, not a hit on her.
    if (hit.targetId === actor.id && actor.side === 'party') continue;
    totals.set(hit.targetId, (totals.get(hit.targetId) ?? 0) + hit.amount);
  }
  for (const [targetId, amount] of totals) {
    const unit = units.find((u) => u.id === targetId);
    if (!unit || unit.side !== 'enemy') continue;
    aiScriptFor(unit.enemy?.aiScriptId).onDamaged?.(aiContext(unit), actor.id, amount);
  }
}
