/**
 * **The Sanctuary Keeper's script** (FFX only; the hidden Sanctuary Keeper chapter, number 39): the monster file `m128` as the game's own bytecode runs it (`research/re-ffx-sanctuary-keeper.md` section 4, "RE 4": read from the
 * file and run in the earlier lanes' interpreter). **No number here is ours**; the rules and their sources are `./sanctuary-keeper-rules.ts`, the rows `data/ffx/enemies/sanctuary-keeper-abilities.ts`.
 *
 * ## The Keeper's turn (RE 4.2), once per Keeper turn
 *
 * 1. The support move of the turn is worked out ({@link supportMoveOf}): Curaga on itself, replaced by Regen, Esuna, Protect or the Reflect branch (each later one beating the earlier). This is done on **every** turn, because
 *    the Reflect branch's picks draw, and the game draws them whether or not the cycle then uses the move.
 * 2. The cycle state (a flag, `sk.cycle`) picks the move and, for states 0 to 3, discards the support move:
 *
 * | State | Move | Target | Next |
 * |---:|---|---|---:|
 * | 0 (the first turn and every sixth after) | **Photon Wings** | the whole front line | 1 |
 * | 1 | **Attack** | the front-line member with the **highest HP** (tie: random) | 2 |
 * | 2 | **Attack** | a random living front-line member | 3 |
 * | 3 | **Mana Breath**, MAG 40 | a random living front-line member | 4 |
 * | 4 and 5 | the support move of step 1, MAG 180 | as step 1 | 5, 0 |
 *
 * ## When it is hit (RE 4.3), once per action per target, in this order
 *
 * 1. If the user is the Keeper itself (its own Curaga, Regen and the rest, or the Haste it casts): **stop**; no count, nothing below.
 * 2. **With Slow on it**: Haste, queued as a counter, on a front-line member who holds Reflect if there is one (the Haste bounces onto the Keeper), otherwise on itself.
 * 3. **The phase moves** ({@link advancePhase}): 30,000, 20,000 and 10,000 raise the phase (and the area the stage shows) to 1, 2 and 3. `preTurn` runs the same moves, so HP lost to Poison counts too.
 * 4. **The sweep fuse**: if the action's damage class includes HP (`HitReport.affectsHp`: a hit, a spell, an item, a heal; **not** Bio, Reflect, Protect, Slow, Scan) the count goes up one; if it now exceeds 2 plus a draw modulo 5
 *    the Keeper queues **Tail Sweep** on the whole front line (Delay Buster, Haste removed) and the count returns to 0. The draw is taken on every counted action.
 *
 * What it queues is a free counter of its owner, filtered by the engine as the game's queue does (`./hit-gates.ts#react`): not while it cannot act, not in answer to a hit that is itself a reaction (a counter-attack, an Auto-item),
 * and not when it already has a reaction waiting. The count and the phase move whether or not the command is accepted.
 *
 * ## The deviations, said (rule 6: none of them is a number)
 *
 * - **MAG is written per move, not per turn.** The script writes 180 at the top of every turn and a post-turn handler writes 40 back; the Attack and Photon Wings read no MAG, so the engine writes 180 for a support move
 *   and 40 for everything else (`{@link SUPPORT_MAG}`, `{@link BREATH_MAG}`), which reads the same.
 * - **The "area" is a flag** (`sk.phase`, the same number): the game writes it to all seven characters and the four areas hold identical coordinates, so nothing moves; the camera cue is the stage's, owed to Bailey's pick.
 * - **MP.** The player's rows carry their MP costs; the engine takes them from the Keeper's 256 (no source says a monster runs dry, and the engine never refuses an AI command for MP).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has } from '../state.ts';
import { gameMod, highestHpLiving, livingFrontLine, randomLiving } from './game-rolls.ts';
import { react, reactionAim } from './hit-gates.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import { registerScriptHooks, type HitReport, type UsedCommand } from './hooks.ts';
import {
  BREATH_MAG,
  CYCLE_ATTACK_HIGHEST,
  CYCLE_ATTACK_RANDOM,
  CYCLE_BREATH,
  CYCLE_LENGTH,
  CYCLE_SUPPORT_A,
  CYCLE_SUPPORT_B,
  CYCLE_WINGS,
  SK_COUNT_FLAG,
  SK_CYCLE_FLAG,
  SK_ROWS,
  SK_SCRIPT,
  SUPPORT_MAG,
  SWEEP_FUSE_BASE,
  SWEEP_FUSE_MODULUS,
  advancePhase,
  flagNumber,
  reflectHolder,
  supportMoveOf,
} from './sanctuary-keeper-rules.ts';

export * from './sanctuary-keeper-rules.ts';

/** The plain Attack (the enemy's own `plainAttack`, monster command 0x6000) on one front-line member. */
function attackOn(target: FFXCombatant | undefined): Command | null {
  return target === undefined ? null : { kind: 'attack', targets: [target.id] };
}

/** One Keeper turn (RE 4.2). */
export function keeperTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  if (livingFrontLine(ctx).length === 0) return null;
  const support = supportMoveOf(ctx, self); // worked out every turn: its picks draw in the game's order, used or not
  const state = flagNumber(ctx, SK_CYCLE_FLAG) % CYCLE_LENGTH;
  ctx.state.flags[SK_CYCLE_FLAG] = (state + 1) % CYCLE_LENGTH;
  self.stats.mag = state === CYCLE_SUPPORT_A || state === CYCLE_SUPPORT_B ? SUPPORT_MAG : BREATH_MAG;
  switch (state) {
    case CYCLE_WINGS:
      return use(ai, SK_ROWS.photonWings, livingFrontLine(ctx).map((c) => c.id));
    case CYCLE_ATTACK_HIGHEST:
      return attackOn(highestHpLiving(ctx));
    case CYCLE_ATTACK_RANDOM:
      return attackOn(randomLiving(ctx));
    case CYCLE_BREATH: {
      const victim = randomLiving(ctx);
      return victim === undefined ? null : use(ai, SK_ROWS.manaBreath, [victim.id]);
    }
    default:
      return use(ai, support.id, support.targets);
  }
}

/** The phase moves at the Keeper's own turn start too (RE 4.3 `preTurn`), so HP lost to Poison moves the phase. */
function keeperPreTurn(ctx: Ctx, self: FFXCombatant): void {
  advancePhase(ctx, self);
}

/** The Keeper hears it was hit (RE 4.3), once per action per target. */
function keeperOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, report: HitReport): void {
  if (self.hp <= 0 || !self.alive) return; // dead: nothing (no sweep from a body)
  if (used.user.id === self.id) return; // its own Curaga, Regen, Haste and the rest: stop, no count (RE 4.3 item 1)
  const keeperAi = aiContextFor(ctx, self);

  if (has(self, 'slow')) {
    // Slowed: Haste on a front-line member who holds Reflect (it bounces onto the Keeper), else on itself.
    const holder = reflectHolder(ctx);
    react(ctx, self, reactionAim(ctx, used.user), use(keeperAi, SK_ROWS.haste, [(holder ?? self).id]));
  }

  advancePhase(ctx, self);

  if (!report.affectsHp) return; // Bio, Reflect, Protect, Slow, Scan, a miss with no HP class: no count, no sweep
  const count = flagNumber(ctx, SK_COUNT_FLAG) + 1;
  const fuse = SWEEP_FUSE_BASE + gameMod(ctx, SWEEP_FUSE_MODULUS); // the draw is taken on every counted action
  if (count > fuse) {
    ctx.state.flags[SK_COUNT_FLAG] = 0;
    react(ctx, self, reactionAim(ctx, used.user), use(keeperAi, SK_ROWS.tailSweep, livingFrontLine(ctx).map((c) => c.id)));
  } else ctx.state.flags[SK_COUNT_FLAG] = count;
}

registerAiScript(SK_SCRIPT, keeperTurn);
registerScriptHooks(SK_SCRIPT, { preTurn: keeperPreTurn, onHit: keeperOnHit });
