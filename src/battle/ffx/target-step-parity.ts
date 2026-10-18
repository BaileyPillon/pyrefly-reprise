/**
 * **Target-step parity** (re-parity RC11, lane "FFX target parity"; **FFX only**; handoff `docs/handoff/re-parity-rc11-ffx-target-parity.md`, plan `docs/plans/re-parity-rc11-ffx-target-parity-review.md`).
 *
 * One switch, {@link TARGET_STEP_PARITY}, **on as shipped (r55 RE, Bailey 2026-10-18) with `cursorStartFoe` (t3b) and `sideSwitch` (t5) left off**: while it is off no menu row carries a `targetStep` and nothing about the command menu, the strategies or a battle changes. While it is on the
 * FFX engine publishes, for each row, the target step the original shows (`AvailableCommand.targetStep`), and the HUD (`src/ui/ffx/loneTarget.ts`, `targetStepUi.ts`) reads it. Legality
 * (`validTargets`) and resolution are untouched, so a strategy, the advisor or the coach, which read `validTargets` only, cannot be moved by it.
 *
 * The original (`FFX.exe`, Steam build 25501027; research note `FFX-G11e`, readers 0x89A330, 0x89A860, 0x89ABD0, 0x898640, 0x89A58F and 0x89D390): a pick the resolver answers 0xFE pushes a target
 * level that never looks at the candidate count; the record's target word (`kernel/target-words.ts`) says whether a step follows, which side shows first, the mode, whether the side may be
 * switched and whether the dead may be chosen. The items, each switchable on its own through {@link TargetStepItem}:
 *
 * | Item | Rule |
 * |---|---|
 * | `selfStep` | a self-only command with the step bit (mode 3: Guard, Sentinel, the aeon Shield and Boost) opens a cursor on the user and waits; Talk (0x3105, foe side first, single) opens a cursor on the foes |
 * | `overdriveStep` | a command that picks a random foe (the party Overdrives, the reels, the Gems) has the step bit with the foe side first: one valid foe opens a cursor |
 * | `cursorStart` | ally side first opens on the user's own entry; a record that may target the dead opens on the first KO'd ally in party order |
 * | `cursorStartFoe` | foe side first opens on index 0 of the foe list (formation order, `ctx.state.enemyIds`, the game's actor numbers 20 and up) |
 * | `sideSwitch` | a record with the side-switch bit lets the cursor switch to the other side; `switchTo` lists that side. Legality moves, so it is its own item |
 * | `openerOne` | a one-entry opener opens its list (HUD only, `targetStepUi.ts`; the Overdrive group only for Tidus, Kimahri, Auron, Wakka and Lulu) |
 * | `copycat` | Copycat is self-only with the step bit: its row is `self`, not `single-any` |
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { AbilityDef, AvailableCommand, CombatantId, FFXCombatant, TargetStep } from '../common/types.ts';
import { type Ctx, alliesOf, enemies, isAlive, onField, targetable, tryActor } from './state.ts';
import { reachesFoesAtRange, reachesTarget } from './targeting.ts';
import { targetSpecOf, type TargetWordSpec } from './kernel/target-words.ts';

/** The items of the plan, by name. */
export type TargetStepItem = 'selfStep' | 'overdriveStep' | 'cursorStart' | 'cursorStartFoe' | 'sideSwitch' | 'openerOne' | 'copycat';

/** The one switch, as shipped by r55 RE: `on: true` with `cursorStartFoe` and `sideSwitch` skipped. `on: false` and every FFX menu is as before. `skip` lists items to leave off while the switch is on. */
export const TARGET_STEP_PARITY: { on: boolean; skip: TargetStepItem[] } = { on: true, skip: ['cursorStartFoe', 'sideSwitch'] };

/** Is this item's parity rule in force right now? */
export function targetStepParity(item: TargetStepItem): boolean {
  return TARGET_STEP_PARITY.on && !TARGET_STEP_PARITY.skip.includes(item);
}

/** Set the switch (and, optionally, the items to leave off); the returned function puts both back as they were. */
export function setTargetStepParity(on: boolean, skip: readonly TargetStepItem[] = []): () => void {
  const before = { on: TARGET_STEP_PARITY.on, skip: [...TARGET_STEP_PARITY.skip] };
  TARGET_STEP_PARITY.on = on;
  TARGET_STEP_PARITY.skip = [...skip];
  return () => {
    TARGET_STEP_PARITY.on = before.on;
    TARGET_STEP_PARITY.skip = before.skip;
  };
}

/** Copycat's command record (the game's self-only copy command). */
export const COPYCAT_RECORD_ID = 0x3028;

const sameSide = (user: FFXCombatant, c: FFXCombatant): boolean => (c.side === 'enemy') === (user.side === 'enemy');

/** The living (or, when the record may target the dead, any on-field) targetable foes, in formation order. */
function foeList(ctx: Ctx): CombatantId[] {
  return enemies(ctx).filter((c) => targetable(c) && isAlive(c)).map((c) => c.id);
}

/**
 * A row the menu has no cursor for today (a self row, a trigger, a hand-built order): the step its record asks for, or `undefined`. Mode 3 is the user alone; mode 0 with the foe side first
 * (Talk) is the foes; mode 2 on the ally side (Combine powers) rings every ally at once when `group` is allowed.
 */
export function recordStep(ctx: Ctx, user: FFXCombatant, recordId: number, group = false): TargetStep | undefined {
  if (!TARGET_STEP_PARITY.on || user.side === 'enemy') return undefined;
  const spec = targetSpecOf(recordId);
  if (spec === undefined || !spec.step || !targetStepParity('selfStep')) return undefined;
  if (spec.mode === 3) return { candidates: [user.id], start: user.id };
  if (spec.mode === 0 && spec.foeFirst) {
    const foes = foeList(ctx);
    return foes.length > 0 ? { candidates: foes, start: foes[0]! } : undefined;
  }
  if (group && spec.mode === 2 && !spec.foeFirst) {
    const allies = alliesOf(ctx, user).filter((c) => targetable(c) && isAlive(c)).map((c) => c.id);
    return allies.length > 0 ? { candidates: allies, start: user.id, group: true } : undefined;
  }
  return undefined;
}

/** Where a single-target cursor opens among `candidates` (in list order), by the record's side and the dead bit; `undefined` when the item for that case is off. */
function startFor(ctx: Ctx, user: FFXCombatant, candidates: readonly CombatantId[], spec: TargetWordSpec): CombatantId | undefined {
  const mine = candidates.filter((id) => {
    const c = tryActor(ctx, id);
    return c !== undefined && sameSide(user, c);
  });
  if (!spec.foeFirst) {
    if (!targetStepParity('cursorStart') || mine.length === 0) return undefined;
    // A record that may target the dead, and a KO'd ally on the list: the first KO'd ally in list order (0x89A58F to 0x89A5FF). Otherwise the user's own entry (0x898640).
    const fallen = spec.canTargetDead ? mine.find((id) => { const c = tryActor(ctx, id); return c !== undefined && !isAlive(c); }) : undefined;
    return fallen ?? (mine.includes(user.id) ? user.id : mine[0]);
  }
  if (!targetStepParity('cursorStartFoe')) return undefined;
  return candidates.find((id) => !mine.includes(id));
}

/** The candidates on the other side of a single-side row, when its record lets the cursor switch to it. */
function otherSide(ctx: Ctx, user: FFXCombatant, def: AbilityDef, row: AvailableCommand, spec: TargetWordSpec): CombatantId[] {
  if (row.targeting === 'single-enemy') {
    return alliesOf(ctx, user).filter((c) => targetable(c) && (spec.canTargetDead ? onField(c) : isAlive(c))).map((c) => c.id);
  }
  if (!reachesFoesAtRange(ctx, user, def)) return [];
  return enemies(ctx).filter((c) => targetable(c) && isAlive(c) && reachesTarget(ctx, user, def, c)).map((c) => c.id);
}

/**
 * The target step of a menu row, or `undefined` while the switch is off, when the record has no step bit, or when nothing in it differs from the row's old behaviour. Called for every ability,
 * Overdrive and item row (`commands.ts#withAim`).
 */
export function targetStepFor(ctx: Ctx, user: FFXCombatant, def: AbilityDef, row: AvailableCommand): TargetStep | undefined {
  if (!TARGET_STEP_PARITY.on || user.side === 'enemy') return undefined;
  const recordId = def.record?.id; // the party's plain Attack carries the 0x3000 record too (the engine registry's core ability)
  const spec = targetSpecOf(recordId);
  if (spec === undefined || recordId === undefined || !spec.step) return undefined;
  const t = row.targeting;
  if (t === 'self') return recordStep(ctx, user, recordId);
  if (t === 'random-enemy') {
    if (!targetStepParity('overdriveStep') || !spec.foeFirst || row.validTargets.length === 0) return undefined;
    const start = targetStepParity('cursorStartFoe') ? row.validTargets[0] : undefined;
    return { candidates: [...row.validTargets], ...(start !== undefined ? { start } : {}) };
  }
  if ((t !== 'single-enemy' && t !== 'single-ally' && t !== 'single-any') || spec.mode !== 0 || row.validTargets.length === 0) return undefined;
  const start = startFor(ctx, user, row.validTargets, spec);
  const other = t !== 'single-any' && spec.switchable && targetStepParity('sideSwitch') ? otherSide(ctx, user, def, row, spec) : [];
  if (start === undefined && other.length === 0) return undefined;
  return { candidates: [...row.validTargets], ...(start !== undefined ? { start } : {}), ...(other.length > 0 ? { switchTo: other } : {}) };
}

/**
 * Item `copycat`: Copycat's record is self-only with the step bit, so while the item is on its row is a `self` row aimed at its user, not the `single-any` row the catalog carries. No shipped
 * chapter gives anyone Copycat. The row is changed in place.
 */
export function applyCopycatSelf(user: FFXCombatant, def: AbilityDef, row: AvailableCommand): void {
  if (!targetStepParity('copycat') || def.record?.id !== COPYCAT_RECORD_ID) return;
  row.targeting = 'self';
  row.validTargets = [user.id];
  delete row.preferredTargets;
}
