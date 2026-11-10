/**
 * **Neslug's script** (FFX only; the hidden Gauntlet chapter's act 8, the Monster Arena's Original of every area creation, monster file `m105`, 4,000,000 HP), as the game's own bytecode runs it
 * (`research/re-ffx-monster-arena-creations.md` 3.2, "RE n": 3,632 bytes of code, read from the disassembly and run in the earlier lanes' interpreter, `[disasm] [run]`). **No number here is ours.** The rows are
 * `data/ffx/enemies/gauntlet-abilities.ts` (its own Attack, Megaton, Slime and the three shell rows) and the party's own Curaga; the record is `data/ffx/enemies/gauntlet.ts`.
 *
 * ## Three states (`v1`), changed by what hits it (`onHit`), never by its turn
 *
 * | `v1` | State | Its turn |
 * |---|---|---|
 * | 0 | **out** | the mix below |
 * | 1 | **in its shell**: **NullPhysical on** (every physical blow does nothing: the engine's `immune-to-physical-damage`, the `Chr+0x5b8` word's bit 0x20), **Regen 255** (permanent, not dispellable) | **Curaga on itself**; once its HP is **above 3/4** of the maximum it **Emerges** (NullPhysical and Regen off, `v1 = 0`) |
 * | 2 | **the shell broken**: NullPhysical and Regen off, **Agility 120** (from 43: a turn every 12 CTB) | the same mix, at the new speed |
 *
 * **The hit that changes it** (after the damage, before the death check, once per action; a lethal blow does nothing): out (0) -> HP **below 1/4** of the maximum: a forced **Broken shell.**, NullPhysical and Regen off, Agility 120, `v1 = 2` (it
 * skips the shell); else HP **below 1/2**: a forced **Hides in shell.**, NullPhysical on, Regen 255, `v1 = 1`. In the shell (1) -> HP **below 1/4**: a forced **Emerges from shell.** and a forced **Broken shell.**, the same writes, `v1 = 2`.
 * In the broken shell (2) a hit by **command 0x203F, the Purifying Salt** (the item; `v4` is never written, so the test is always true) sets its **Defense and Magic Defense to 1**. The maxima are integers (`maxHP * 1 / 4`, `* 1 / 2`, `* 3 / 4`).
 *
 * ## The mix (states 0 and 2: one draw `GetRandomValue() mod 3`)
 *
 * | Draw | What it does |
 * |---|---|
 * | 0 | **Attack** on the front-line member with the **most MP** (the two-call idiom: `findMatchingChr(front, alive)`, whose pick is drawn and dropped, then `findMatchingChr(MatchingGroup, MP, Highest)`) |
 * | 1 | **Megaton** on one random living member (Confuse 254) -- but **if Valefor stands in the front line it Attacks instead**, and the Attack goes at `v0`, **the target it last picked** (no new pick: the script never writes `v0` on that branch) |
 * | 2 | **Slime** on the whole front line (Poison, Silence, Slow 254, Armor Break and Mental Break 255) if at least one living member is **not Slow**; if everyone is slowed, the Attack of draw 0 |
 *
 * **The preTurn hook** (`v5`): at the start of its turn, below 1/2 of its HP and not below 1/4, with its motion level not 1 (the shell animation not playing), it sets `v5`; its turn is then spent on a **Hides in shell.** with no state
 * change at all (a Poison tick or a Doom countdown can take it under half without a hit; the next hit does the real thing).
 *
 * ## Deviations, said (none is a number)
 *
 * - The death handler (`f6`: Broken shell., a texture change and a forced Death row in every state) is a scene; the engine's victory is the death, so it is not modelled (stage 1 kept the three Death rows in the fixture, not in play).
 * - NullPhysical is the engine's `immune-to-physical-damage` flag (`../adapt/words.ts#specialWord`), a physical blow dealing 0; the game's property 265 is read as that word's bit: the tests run it (a blow does nothing, a spell hurts).
 * - The motion level the preTurn test reads is kept as a memory slot (`NESLUG_MOTION`): 1 once a Hides in shell. has been performed, 0 once it has Emerged.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, rtOf } from '../state.ts';
import { removeStatus } from '../statuses.ts';
import { actorNumber, frontLine, gameMod, livingFrontLine, pickActor, randomLiving } from './game-rolls.ts';
import { type HitReport, type UsedCommand, queueReaction, registerScriptHooks } from './hooks.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, NESLUG_STATE_FLAG, setImmunityFlag } from './gauntlet-rules.ts';

/** The turn's draw is `mod 3` (RE n 3.2). */
export const NESLUG_MIX_MODULO = 3;
/** Agility the broken shell writes (from 43). */
export const NESLUG_BROKEN_AGI = 120;
/** The item whose use on the broken shell takes its defences down: Purifying Salt (command 0x203F). */
export const NESLUG_SALT_ROW = 'purifying-salt';
/** The party's Valefor, the actor number 8 the Megaton branch looks for (`countChrOverlap(FrontlineChars, 8)`). */
export const NESLUG_VALEFOR = 'valefor';
/** The memory slots: `v1` (the state), `v5` (hide on the next turn), `v0` (the last pick, an actor number; 255 for none) and the motion level the preTurn test reads. */
export const NESLUG_STATE = 'gauntlet.neslug.state';
export const NESLUG_HIDE_PENDING = 'gauntlet.neslug.hidePending';
export const NESLUG_TARGET = 'gauntlet.neslug.target';
export const NESLUG_MOTION = 'gauntlet.neslug.motion';

/** `maxHP * 1 / 4`, `* 1 / 2` and `* 3 / 4` in integers. */
export const neslugQuarter = (maxHp: number): number => Math.floor((maxHp * 1) / 4);
export const neslugHalf = (maxHp: number): number => Math.floor((maxHp * 1) / 2);
export const neslugThreeQuarters = (maxHp: number): number => Math.floor((maxHp * 3) / 4);

const REGEN = { id: 'regen' as const, turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };

/** `v0` after a pick: the picked actor's number, or 255 (`findMatchingChr` found nobody). */
function remember(ctx: Ctx, memory: AiContext['memory'], picked: FFXCombatant | undefined): void {
  memory[NESLUG_TARGET] = picked === undefined ? 255 : actorNumber(ctx, picked.id);
}

/** `findMatchingChr(front, alive)` (its pick drawn and dropped) then `findMatchingChr(MatchingGroup, MP, Highest)`: the living member with the most MP, a tie one picker draw. */
function highestMpLiving(ctx: Ctx): FFXCombatant | undefined {
  const pool = livingFrontLine(ctx);
  pickActor(ctx, pool);
  const top = pool.reduce((best, c) => Math.max(best, c.mp), -1);
  return pickActor(ctx, pool.filter((c) => c.mp === top));
}

/** The Attack at one member, remembering the pick as `v0`. */
function attackAt(ai: AiContext, target: FFXCombatant | undefined): Command | null {
  remember(ai.ctx, ai.memory, target);
  return target === undefined ? null : use(ai, ROW.neslugAttack, [target.id]);
}

/** The Attack at the stale `v0` (the Valefor branch): a lost turn when that actor is not a living target of the front line. */
function attackAtLast(ai: AiContext): Command | null {
  const last = num(ai.memory, NESLUG_TARGET, 0);
  const target = livingFrontLine(ai.ctx).find((c) => actorNumber(ai.ctx, c.id) === last);
  return target === undefined ? null : use(ai, ROW.neslugAttack, [target.id]);
}

/** The mix of states 0 and 2 (RE n 3.2). */
export function neslugMixTurn(ai: AiContext): Command | null {
  const { ctx, memory } = ai;
  const draw = gameMod(ctx, NESLUG_MIX_MODULO);
  if (draw === 0) return attackAt(ai, highestMpLiving(ctx));
  if (draw === 1) {
    if (frontLine(ctx).some((c) => c.id === NESLUG_VALEFOR)) {
      pickActor(ctx, livingFrontLine(ctx)); // `findMatchingChr(front, alive)`, the result dropped
      return attackAtLast(ai);
    }
    const victim = randomLiving(ctx);
    remember(ctx, memory, victim);
    return victim === undefined ? null : use(ai, ROW.megaton, [victim.id]);
  }
  const unslowed = livingFrontLine(ctx).filter((c) => !has(c, 'slow'));
  pickActor(ctx, unslowed); // `findMatchingChr(front, Slow, Not)`: the matched set, its pick dropped
  const anyone = pickActor(ctx, unslowed); // `v0 = findMatchingChr(MatchingGroup, alive)`: 255 when nobody is unslowed
  remember(ctx, memory, anyone);
  if (anyone === undefined) return attackAt(ai, highestMpLiving(ctx));
  return use(ai, ROW.slime, livingFrontLine(ctx).map((c) => c.id));
}

/** Publish the state for the scene and the advisor. */
function setState(ctx: Ctx, memory: AiContext['memory'], state: 0 | 1 | 2): void {
  memory[NESLUG_STATE] = state;
  ctx.state.flags[NESLUG_STATE_FLAG] = state;
}

/** NullPhysical and Regen 255 on (the shell) or off (out, or broken). */
function setShellWrites(ctx: Ctx, self: FFXCombatant, on: boolean): void {
  setImmunityFlag(self, 'immune-to-physical-damage', on);
  if (on) {
    self.statuses['regen'] = { ...REGEN };
    ctx.emit({ type: 'status-add', targetId: self.id, status: 'regen', instance: { ...REGEN } });
  } else {
    removeStatus(ctx, self, 'regen', 'cured');
  }
}

/** A state row as the game's `forcePerformCommand(Self, row)`: queued whatever the owner's state. */
function forceRow(ai: AiContext, row: string): void {
  queueReaction(ai.ctx, ai.self.id, use(ai, row, [ai.self.id]), { forced: true, keepsControl: true });
}

/** One Neslug turn (RE n 3.2). */
export function neslugTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  if (num(memory, NESLUG_HIDE_PENDING) === 1) {
    memory[NESLUG_HIDE_PENDING] = 0;
    memory[NESLUG_MOTION] = 1;
    return use(ai, ROW.hidesInShell, [self.id]); // the animation alone: no state is written
  }
  if (num(memory, NESLUG_STATE) === 1) {
    if (self.hp > neslugThreeQuarters(self.stats.maxHp)) {
      setShellWrites(ctx, self, false);
      setState(ctx, memory, 0);
      memory[NESLUG_MOTION] = 0;
      return use(ai, ROW.emergesFromShell, [self.id]);
    }
    return use(ai, ROW.curaga, [self.id]);
  }
  return neslugMixTurn(ai);
}

/** `preTurn`: below half and not below a quarter, with the shell animation not playing, it will spend its turn on the animation. */
export function neslugPreTurn(ctx: Ctx, self: FFXCombatant): void {
  const memory = rtOf(ctx, self.id).ai;
  const max = self.stats.maxHp;
  if (self.hp < neslugHalf(max) && self.hp >= neslugQuarter(max) && num(memory, NESLUG_MOTION) !== 1) memory[NESLUG_HIDE_PENDING] = 1;
}

/** The shell breaks: NullPhysical and Regen off, Agility 120 (after an Emerges row if it was in the shell). */
function breakShell(ai: AiContext, fromShell: boolean): void {
  const { ctx, self, memory } = ai;
  if (fromShell) forceRow(ai, ROW.emergesFromShell);
  forceRow(ai, ROW.brokenShell);
  setShellWrites(ctx, self, false);
  self.stats.agi = NESLUG_BROKEN_AGI;
  setState(ctx, memory, 2);
  if (fromShell) memory[NESLUG_MOTION] = 0;
}

/** Neslug hears the action's hit, after the damage and before the death check (RE n 3.2). */
export function neslugOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, _report: HitReport): void {
  if (self.hp <= 0) return; // the blow that killed it
  const ai = aiContextFor(ctx, self);
  const { memory } = ai;
  const state = num(memory, NESLUG_STATE);
  const max = self.stats.maxHp;
  if (state === 0) {
    if (self.hp < neslugQuarter(max)) breakShell(ai, false);
    else if (self.hp < neslugHalf(max)) {
      forceRow(ai, ROW.hidesInShell);
      setShellWrites(ctx, self, true);
      setState(ctx, memory, 1);
      memory[NESLUG_MOTION] = 1;
    }
  } else if (state === 1) {
    if (self.hp < neslugQuarter(max)) breakShell(ai, true);
  } else if (used.def.id === NESLUG_SALT_ROW) {
    self.stats.def = 1; // `DEF := 1` and `MDF := 1` (properties 10 and 12), for good
    self.stats.mdef = 1;
  }
}

registerAiScript(GAUNTLET_SCRIPTS.neslug, neslugTurn);
registerScriptHooks(GAUNTLET_SCRIPTS.neslug, { preTurn: neslugPreTurn, onHit: neslugOnHit });
