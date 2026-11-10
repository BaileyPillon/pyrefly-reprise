/**
 * **Earth Eater's script** (FFX only; the hidden Gauntlet chapter's act 4, the Monster Arena's first Original, monster file `m279`), as the game's own bytecode runs it
 * (`research/re-ffx-monster-arena-creations.md` 3.4, "RE n": 2,894 bytes of code, read from the file and run in the earlier lanes' interpreter with exact tallies, `[disasm] [run]`). **No number here is ours.** The rows are
 * `data/ffx/enemies/gauntlet-abilities.ts` (its own Attack, Megaton Punch and Gets up) and the party's own Flare; the record is `data/ffx/enemies/gauntlet.ts`; its **Reflect and Armored** are written at the start
 * (`./gauntlet-setup.ts`: Reflect is the record's start-up status word 0x20, Armored its flag byte).
 *
 * ## Standing (`v5` is 0)
 *
 * | | |
 * |---|---|
 * | **Its turn** | one draw `GetRandomValue() mod 2`: 0 = **Attack** on one random living member; 1 = **two Megaton Punches**, each on a member picked on its own (the second is queued behind the first as a follow-up of the same turn: a draw can pick the same member twice, and a member the first punch killed is no longer a target) |
 * | **Every hit it takes** that does HP damage | the damage joins a **running total** (`v8`, the action's `LastDamageTakenHP`, overkill included, a Doublecast or an Overdrive being one event each) and it answers with **one Megaton Punch** (Death 100) on a random living member |
 * | **The line** | the hit that takes the total **strictly past 100,000** (`v9`) knocks it down: **Armored off**, `v5 = 1`, the total back to 0, and **no reply to that hit** (its script returns) |
 *
 * ## Down (`v5` is 1)
 *
 * | | |
 * |---|---|
 * | **Its turns** | the first two do nothing (`v3` counts 0 to 2; a lost turn pays the default recovery); on the **third** it performs **Gets up.** on itself, Armored back on, the total and the counters back to 0 |
 * | **Every hit that does HP damage** | the total still adds up (it is reset when it stands), and it answers with a **Flare it casts at itself**: its own Reflect sends it to a random member of the party (2,355 to 2,660 each on the preset, Shell halves) |
 *
 * ## The gates the bytes do and do not have
 *
 * The `onHit` returns at once if its HP is 0 (the blow that killed it asks for nothing) or the action did no HP damage (a miss, a heal, a status). **It never tests `isCounterattackAllowed()`** (Cactuar King's and the
 * Greater Sphere's scripts do), so this file queues its answers itself instead of through `./hit-gates.ts#react`: the owner must be able to act (`canQueue`) and must not already have a reaction waiting (the game's queue
 * refuses a second), and nothing more. A reaction is a free action (no CTB). The two Megaton Punches of a turn are the other use of the queue here: nothing in the preset hits it from inside a reaction, so the difference
 * between the two readings does not show in this chapter.
 *
 * ## What the engine sees
 *
 * Two flags are published in `state.flags` for the scene and the advisor (`EATER_DOWN_FLAG`, `EATER_TOTAL_FLAG`); the script's own state is in the combatant's memory (`EATER_*` keys below).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, rtOf } from '../state.ts';
import { canQueue, gameMod, randomLiving } from './game-rolls.ts';
import { type HitReport, type UsedCommand, peekReactions, queueEmit, queueReaction, registerScriptHooks } from './hooks.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { EATER_DOWN_FLAG, EATER_TOTAL_FLAG, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, setArmored } from './gauntlet-rules.ts';

/** The standing turn's draw is `mod 2` (RE n 3.4): 0 is the Attack, 1 the two Megaton Punches. */
export const EATER_COIN_MODULO = 2;
export const EATER_ATTACK_DRAW = 0;
/** The running total of HP damage taken must pass this (strictly) to knock it down (`v9`, set at the start). */
export const EATER_KNOCK_DOWN_LINE = 100_000;
/** It stays down for this many of its own turns doing nothing; on the next one (`v3 == 2`) it gets up. */
export const EATER_TURNS_DOWN = 2;
/** The memory slots: `v5` (1 while down), `v3` (the turns spent down) and `v8` (the running total). */
export const EATER_DOWN = 'gauntlet.eater.down';
export const EATER_DOWN_TURNS = 'gauntlet.eater.downTurns';
export const EATER_TOTAL = 'gauntlet.eater.total';

/** The running total and its flag. */
function setTotal(ctx: Ctx, memory: AiContext['memory'], total: number): void {
  memory[EATER_TOTAL] = total;
  ctx.state.flags[EATER_TOTAL_FLAG] = total;
}

/** It stands up: the total and the counters back to 0, Armored back on (the `Gets up.` turn). */
function standUp(ctx: Ctx, self: FFXCombatant, memory: AiContext['memory']): void {
  memory[EATER_DOWN] = 0;
  memory[EATER_DOWN_TURNS] = 0;
  setTotal(ctx, memory, 0);
  ctx.state.flags[EATER_DOWN_FLAG] = false;
  setArmored(self, true);
}

/** The knock-down (the hit that took the total past the line): Armored off, down, the total back to 0. The banner follows the action's own events. */
function fallDown(ctx: Ctx, self: FFXCombatant, memory: AiContext['memory']): void {
  memory[EATER_DOWN] = 1;
  memory[EATER_DOWN_TURNS] = 0;
  setTotal(ctx, memory, 0);
  ctx.state.flags[EATER_DOWN_FLAG] = true;
  setArmored(self, false);
  queueEmit(ctx, { type: 'message', text: `${self.name} crashes to the ground`, kind: 'story' });
}

/** One Earth Eater turn (RE n 3.4). */
export function earthEaterTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  if (num(memory, EATER_DOWN) === 1) {
    const turns = num(memory, EATER_DOWN_TURNS);
    if (turns === EATER_TURNS_DOWN) {
      standUp(ctx, self, memory);
      return use(ai, ROW.getsUp, [self.id]);
    }
    memory[EATER_DOWN_TURNS] = turns + 1;
    return null; // queues nothing: the turn is lost
  }
  const coin = gameMod(ctx, EATER_COIN_MODULO);
  const first = randomLiving(ctx);
  if (first === undefined) return null; // nobody left to aim at (the battle is over)
  if (coin === EATER_ATTACK_DRAW) return use(ai, ROW.attack, [first.id]);
  const second = randomLiving(ctx); // picked now, as the script does, and queued behind the first punch
  if (second !== undefined) queueReaction(ctx, self.id, use(ai, ROW.megatonPunch, [second.id]), { keepsControl: true, byId: second.id, requiresAlive: second.id });
  return use(ai, ROW.megatonPunch, [first.id]);
}

/** A free action of its own that the bytes ask for from `onHit`: the owner must be able to act and not already have a reaction waiting. */
function answer(ctx: Ctx, self: FFXCombatant, aimId: string, command: Command): void {
  if (!canQueue(self)) return;
  if (peekReactions(ctx).some((r) => r.kind === 'command' && r.ownerId === self.id)) return;
  queueReaction(ctx, self.id, command, { keepsControl: true, byId: aimId, requiresAlive: aimId });
}

/** Earth Eater hears it was hit, after the damage and before the death check (RE n 3.4). */
export function earthEaterOnHit(ctx: Ctx, self: FFXCombatant, _used: UsedCommand, report: HitReport): void {
  if (self.hp <= 0) return; // HP 0: nothing
  const damage = report.lastDamage;
  if (damage <= 0) return; // a miss, a heal or a status: nothing
  const memory = rtOf(ctx, self.id).ai;
  const total = num(memory, EATER_TOTAL) + damage;
  setTotal(ctx, memory, total);
  const down = num(memory, EATER_DOWN) === 1;
  if (!down && total > EATER_KNOCK_DOWN_LINE) {
    fallDown(ctx, self, memory); // the crossing hit asks for nothing
    return;
  }
  const ai = aiContextFor(ctx, self);
  if (down) {
    answer(ctx, self, self.id, use(ai, ROW.flare, [self.id])); // its own Reflect bounces it onto the party
    return;
  }
  const victim = randomLiving(ctx);
  if (victim !== undefined) answer(ctx, self, victim.id, use(ai, ROW.megatonPunch, [victim.id]));
}

registerAiScript(GAUNTLET_SCRIPTS.earthEater, earthEaterTurn);
registerScriptHooks(GAUNTLET_SCRIPTS.earthEater, { onHit: earthEaterOnHit });
