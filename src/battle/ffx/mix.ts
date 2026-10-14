/**
 * Rikku's Mix in the engine: the game's resolver run on the party's bag, with the game's auto-target for the result (re-parity RC7, lane FFX-H;
 * **FFX only**).
 *
 * What the game does (private note FFX-G05 sections 3.1 to 3.6, `kernel/mix.ts`): any two items make a result (the chart is complete); **both ingredients
 * are consumed when the Mix resolves**, before the result's target is looked for; the result's target is picked by the game's auto-target from the result's
 * own record (the opposing side or the own side; one candidate by the single picker on stream 4, or one occupied group by the group pick, one draw on
 * stream 5), and the Mix is learned only when it found one. A Mix that finds nobody costs the ingredients, spends **no** Overdrive gauge (the cost fields are
 * cleared) and ends the turn.
 *
 * {@link resolveMixAction} is the engine's side of it: it lays the bag out as the game's slots, runs the kernel's resolver (the deduction, the
 * lookup, the target pick through `kernel/legal-set.ts#autoTargetMask`, the learn bit), and writes the counts back.
 *
 * - **The group of a monster** (`Chr+0x504` and 7) is not modelled (it is unread for our chapters, note open question 4), so every combatant of a side is
 *   in group 0 and a group result takes the whole side, as it does in a game whose enemies share a group. The draw is still made: one stream-5 draw per
 *   group result, as the game makes it, so what follows draws as the game's does.
 * - **A user the game has no slot for** (a test rig's) has no auto-target to run: its result keeps the targeting of its own record
 *   (`resolveTargets`), the ingredients are still consumed, and nothing is learned from a pick that was not made.
 */

import type { AbilityDef, CombatantId, FFXCombatant, ItemId } from '../common/types.ts';
import { autoTargetMask } from './kernel/legal-set.ts';
import { mixResolve, mixCommandIndex, mixResultCommand, ITEM_COMMAND_ID } from './kernel/mix.ts';
import { MIX_RESULT_IDS, MIX_RESULT_TARGET_WORD } from './kernel/mix-table.ts';
import { type PickFn, type TargetCommand } from './kernel/target-world.ts';
import { type Ctx, abilityOf } from './state.ts';
import { bagOfStock, itemNumber, writeBack } from './adapt/bag.ts';
import { chainSlotOf, chainWorld, idsOf } from './adapt/target-world.ts';

/** What a resolved Mix came to. */
export interface MixOutcome {
  /** The result's ability; when the game's auto-target ran, `extra.groupTarget` says the targets are exactly those it picked. */
  def: AbilityDef;
  /** The game's command id of the result (0x308b to 0x30ca). */
  command: number;
  /** Who the auto-target picked, ascending by slot (empty when it found nobody, or when the user has no game slot). */
  targets: CombatantId[];
  /** The auto-target found nobody: both ingredients are gone, and nothing else happens (no gauge, no hit, no learn). */
  failed: boolean;
  /** Whether the result was recorded as discovered. */
  learned: boolean;
}

/**
 * The rank a Mix that finds no target charges. **Not established**: the executor's action-end routine adds a delay for the failed request from a rank byte
 * that nothing on this path writes (FFX-G05 section 3.6, open question 11). Until that is read or seen live the result's own rank, 6, is used: it is
 * the one number the repo's research gives a Mix (`research/ffx-combat-core.md` section 5.9: a Mix "still delays Rikku"). It has never fired on any
 * shipped line (a Mix needs an Overdrive and a side with nobody to aim at).
 */
export const MIX_FAILED_RANK = 6;

/** The command words of a Mix result for the auto-target: `Cmd+0x1a` from the table, the ordinary-actor usage bit on, no spread, one hit. */
function resultCommand(index: number): TargetCommand {
  const word = MIX_RESULT_TARGET_WORD[index] as number;
  return { b1a: word & 0xff, b1b: (word >> 8) & 0xff, misc: 0, b20: 0, hits: 1 };
}

/** The picker the auto-target draws through: `value % count` on the stream, over slots (the single pick) or group numbers (the group pick). */
function pickerOf(ctx: Ctx): PickFn {
  return (stream, items) => ctx.rng.on(stream).pick(items.map((n) => ({ slot: n, id: undefined }))).slot;
}

/**
 * Resolve a Mix of `itemA` and `itemB` for `user`: consume the ingredients, find the result and its targets, learn it. Returns `undefined` when either item is not
 * one of the chart's 112 (nothing is consumed then) or the result's ability is not registered.
 */
export function resolveMixAction(ctx: Ctx, user: FFXCombatant, itemA: ItemId, itemB: ItemId): MixOutcome | undefined {
  const a = itemNumber(itemA);
  const b = itemNumber(itemB);
  if (a === undefined || b === undefined) return undefined;
  const command = mixResultCommand(a, b);
  const index = mixCommandIndex(command);
  if (index === undefined) return undefined;
  const base = abilityOf(ctx, MIX_RESULT_IDS[index] as string);
  if (base === undefined) return undefined;

  const slot = chainSlotOf(ctx, user);
  const world = chainWorld(ctx, user, base, false);
  const bag = bagOfStock(ctx.rt.inventory);
  // a user with no game slot makes no pick, so nothing is learned: it gets a scratch array, the party's is left alone
  const shared = slot === undefined ? new Array<number>(16).fill(0) : (ctx.rt.mixShared ??= new Array<number>(16).fill(0));
  let mask = 0;
  const out = mixResolve(
    // The record the menu would have built is not read by the resolver; the Mix command and the Item command in front of the two picks stand in for it.
    { loading: false, resolved: false, animating: false, user: slot ?? 0, slots: 2, fields: [0x311e, ITEM_COMMAND_ID, a, b], bag, shared },
    (resultId) => {
      mask = slot === undefined ? 1 : autoTargetMask(world.slots, slot, resultId, -1, resultCommand(index), pickerOf(ctx));
      return mask;
    },
  );
  writeBack(ctx, bag, [itemA, itemB]);
  if (out.ret === 1) return { def: base, command, targets: [], failed: true, learned: false };
  const picked = slot !== undefined;
  const def: AbilityDef = picked ? { ...base, extra: { ...(base.extra ?? {}), groupTarget: true } } : base;
  return { def, command, targets: picked ? idsOf(world, mask) : [], failed: false, learned: out.learned && picked };
}

/**
 * What a Mix that found nobody to aim at comes to in the action loop. Both ingredients are already gone (the resolver deducts before it looks for a target),
 * the gauge is kept (nothing calls `spendOverdrive`: the game clears the cost fields on this path), no hit lands and nothing is learned, and the turn is spent
 * with a delay of {@link MIX_FAILED_RANK}. The message is the game's "Mix failed!" (battle text row 0x17).
 */
export function mixFailed(ctx: Ctx): { rank: number; damageDealt: 0 } {
  ctx.emit({ type: 'message', text: 'Mix failed!', kind: 'system' });
  return { rank: MIX_FAILED_RANK, damageDealt: 0 };
}
