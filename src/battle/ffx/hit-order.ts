/**
 * The order the game applies an action's hits in, and the one recoil of an absorb command (re-parity RC10, lane FFX hit order; **FFX only**).
 *
 * What the game does (FFX.exe 0x007892e0, 0x0078d980, 0x0078f060; private note FFX-H01 sections 3.4, 3.6 and 3.7, 47 scripted scenarios on the game's own code):
 *
 * 1. The orchestrator **calculates** every hit of every target, one slot after another in ascending slot order, each slot's hits in a row (so every draw of the hit
 *    pipeline and of a Steal is in that order), and appends the user's recoil record last.
 * 2. The results driver then **applies** them round by round: one call visits every slot ascending and applies one hit per record, so call k applies hit k of every target
 *    that has one, and the user's recoil record (one pending hit on the user's slot) lands in call 1. A target's death check runs in the call that applies its last hit
 *    (lower slot first when two targets end together), so a target with fewer hits dies, with its loot, before a target with more.
 *
 * The engine has always calculated in the first order. It decided each target's death before the next target's hits were calculated, and ordered the deaths of a spread by
 * the index of the last hit in calculation order. This module keeps the calculation as it was (every hit still goes through `hit-apply.ts#resolveOneHit` in the game's
 * calculation order, so every draw is where it was) and **orders what the hits do to the log and to the dead** as the application does: the events each hit emits are
 * captured when the hit is made and replayed round by round, and a target's finish step (Tidus's counter update, the script's `onHit`, the death check) runs in the round of its
 * last hit. What is not modelled: HP and statuses are written when a hit is calculated, not when its round comes (the larger split of calculation from application is the
 * note's open item), so a lower slot's death handling sees the higher slot's last hits already written.
 *
 * `HIT_ORDER_ROUND_ROBIN` and `DRAIN_RECOIL_ONE_RECORD` are the rollback switches: `false` runs the code that was there before (`abilities.ts` keeps its three loops; `hit-apply.ts`
 * keeps its per-hit heal).
 */

import type { AbilityDef, FFXCombatant } from '../common/types.ts';
import { type Ctx, type EventInput, hasFlag } from './state.ts';
import { chainSlotOf } from './adapt/target-world.ts';
import { applyMpDelta, healOutsideChain } from './hp.ts';
import { recoilGain, recoilRecord } from './kernel/recoil.ts';
import type { HitScope } from './hit-apply.ts';

/** Apply an action's hits round by round, deaths in the round of each target's last hit (S1). `false`: each target's hits, then its death, as before. */
export const HIT_ORDER_ROUND_ROBIN = true;
/** Heal the user of an absorb command once, with the summed amounts, after every target (S2). `false`: hit by hit, as before. */
export const DRAIN_RECOIL_ONE_RECORD = true;

/** A target of the action and the hits it takes. */
export interface HitPass {
  target: FFXCombatant;
  hits: number;
}

/** The record flag the game keys the recoil on (the absorb bit, mask 0x100): Drain, Osmose, Lancet and their Furies. The engine's flags say the same. */
export function holdsAbsorbRecord(def: AbilityDef): boolean {
  return hasFlag(def, 'drains') || hasFlag(def, 'drains-mp') || def.formula === 'lancet';
}

/** The game slot of a combatant for ordering; a combatant with none (a test rig's) goes after every slotted one, keeping its place among its kind. */
function slotKey(ctx: Ctx, c: FFXCombatant): number {
  return chainSlotOf(ctx, c) ?? 0x7f;
}

/** The passes in the order the game visits the slots: ascending, stable. */
export function inSlotOrder<T extends { target: FFXCombatant }>(ctx: Ctx, passes: readonly T[]): T[] {
  return passes.map((p, i) => ({ p, i, k: slotKey(ctx, p.target) })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.p);
}

/** Run `run` with every event it emits held back; the events come back in order, and `emit` is the real one again whatever happened. */
export function captureEvents(ctx: Ctx, run: () => void): EventInput[] {
  const real = ctx.emit;
  const held: EventInput[] = [];
  ctx.emit = (event: EventInput): void => {
    held.push(event);
  };
  try {
    run();
  } finally {
    ctx.emit = real;
  }
  return held;
}

/**
 * The user's recoil, applied once: the sums of the whole action as the game's append step leaves them (`kernel/recoil.ts`). HP before MP, the game's class order.
 * A no-op for a scope that has no recoil (an action that is not an absorb command, a hand-built scope, the switch off).
 */
export function applyRecoil(scope: HitScope): void {
  const sums = scope.recoil;
  if (sums === undefined) return;
  const gain = recoilGain(recoilRecord(sums));
  const { ctx, user } = scope;
  if (gain.hp > 0) healOutsideChain(ctx, user, gain.hp, 'drain', user.id);
  if (gain.mp > 0) applyMpDelta(ctx, user, -gain.mp, user.id);
}

type Entry =
  | { kind: 'target'; slot: number; pass: HitPass; segments: EventInput[][] }
  | { kind: 'recoil'; slot: number };

/**
 * Run `passes` (the built targets and their hit counts) as the game does: calculate every hit target by target (events held), then replay round by round in slot order,
 * running `finish(target)` right after the replay of a target's last hit. The user's recoil, if the scope has one, is an entry of round 1 at the user's slot.
 */
export function runInRounds(scope: HitScope, passes: readonly HitPass[], resolve: (target: FFXCombatant) => void, finish: (target: FFXCombatant) => void): void {
  const { ctx, user } = scope;
  // 1. Calculation, in the order the passes came (the built order; the kernel's is ascending slot already). Each hit's events are held.
  const entries: Entry[] = [];
  for (const pass of passes) {
    const segments: EventInput[][] = [];
    for (let h = 0; h < pass.hits; h++) segments.push(captureEvents(ctx, () => resolve(pass.target)));
    entries.push({ kind: 'target', slot: slotKey(ctx, pass.target), pass, segments });
  }
  if (scope.recoil !== undefined) entries.push({ kind: 'recoil', slot: slotKey(ctx, user) });
  // 2. Application order: round by round, slots ascending (stable, so equal keys keep their calculation order).
  const ordered = entries.map((e, i) => ({ e, i })).sort((a, b) => a.e.slot - b.e.slot || a.i - b.i).map((x) => x.e);
  let rounds = 0;
  for (const e of ordered) if (e.kind === 'target') rounds = Math.max(rounds, e.pass.hits);
  for (let r = 0; r < rounds; r++) {
    for (const e of ordered) {
      if (e.kind === 'recoil') {
        if (r === 0) applyRecoil(scope);
        continue;
      }
      if (r >= e.pass.hits) continue;
      for (const event of e.segments[r] ?? []) ctx.emit(event);
      if (r === e.pass.hits - 1) finish(e.pass.target);
    }
  }
}
