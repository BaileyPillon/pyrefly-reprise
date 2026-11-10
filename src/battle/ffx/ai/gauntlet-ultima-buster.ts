/**
 * **The Ultima Buster, its Head and its two Arms** (FFX only; the hidden Gauntlet chapter's act 9, the Monster Arena's Original of five of every monster, monster files `m280`, `m272` and `m273` twice, 5,000,000 HP and
 * 80,000 each), as the game's own scripts run them (`research/re-ffx-monster-arena-creations.md` 3.1, "RE n": 3,153, 636 and 428 bytes of code and the arena formation `zzzz02_80`, `[disasm] [run]`). **No number here is
 * ours.** The rows are `data/ffx/enemies/gauntlet-abilities.ts` (Attack, Ultima, Contamination, the Head's relay Special 1).
 *
 * ## The body's turn (`v10`, a counter of turns)
 *
 * With **both Arms down** a regrowth test comes first (below). Then: if `v10 >= 2` it casts **Ultima on the whole front line and, behind it, an Attack** on one random living member, and `v10` starts again; otherwise one draw
 * `GetRandomValue() mod 2` decides **Attack** on a random member (1) or **Ultima** on the front line (0) (32,768 each of 65,536). `v10` goes up by one after every turn. So the first two turns are coin turns, the third is Ultima and an
 * Attack, then coin, forced, coin, forced: about three turns in four carry an Ultima and three in four an Attack. (A second variable, a threshold compared with its HP, is never written, so the extra step it would add never comes.)
 *
 * ## The Arms: the gate and the regrowth
 *
 * **The gate (`onTargeted`, before any damage, for every command that names the body):** its Defense is first written 0 and Defend and Armored cleared; then, **if the command affects HP and its damage type is physical (1; type 3 would
 * too) and at least one Arm is alive, Defense 255, Armored and Defend go on for that command**. Spells (type 2) and special commands (type 0: Overdrives, Steal, Lancet, items) are never caught. **`onHit` puts Defense 50 and Armored and
 * Defend off again.** With both Arms down the body is a Defense-0 target: a plain blow reaches the cap. **The Arms regrow:** each body turn spent with both Arms down runs the test `v11 > (draw mod 2) + 1` (one draw a turn while both are
 * down; `v11` counts up from 0): true on the third turn when the draw is even, always on the fourth, and then **the formation's scene revives and re-initialises both Arms at full HP** (`zzzz02_80`, scene B 1: `revive/reinitialize` of
 * actors 22 and 23; the research note called this variable inert because scenes were not run). The Head does not regrow. The Arms take no turns (no CTB bar) and are no part of the victory, nor is the Head: the body's death ends the fight.
 *
 * ## The Head's turns (AGI 80) and the relay
 *
 * A three-turn cycle `v2` (starts at 1): **1** writes the selector `[04] := 1` and performs **Special 1** on the body, **2** is the warning turn (no command; the Head shakes), **3** writes `[04] := 2` and performs Special 1 again. The body
 * answers Special 1 in `onTargeted`: it picks a random living member (always drawn) and, as its own free action, **Attacks** them (selector 1) or casts **Contamination** on them (2); the selector goes back to 0. **A damaging hit on the Head while
 * it is in state 3 (after the warning turn) sets it back to state 1: the Contamination never comes** (the Head's `onHit`; the research note lists the cycle but not the cancel). The Head's cycle is the same as Sinspawn Gui's, and the
 * body's two reactions are the same shape.
 *
 * ## Not modelled, said
 *
 * Command 0x30D1 (Hellfire, Ifrit's Overdrive) on the body re-hosts the parts so the Overdrive reaches them and plays a scene: a matter of the target group and of animation; the engine's all-enemies targeting already includes the parts.
 * The Head's and Arms' scenes (shaking, the destroyed-arm string) are presentation; the Head's shake is published as a charge telegraph and a flag, as Sinspawn Gui's is.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import { restorePart } from '../hp.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { canQueue, gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { type HitReport, type UsedCommand, queueEmit, queueReaction, registerScriptHooks } from './hooks.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { GAUNTLET_IDS as ID, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, UB_HEAD_STATE_FLAG, UB_RELAY_FLAG, setArmored } from './gauntlet-rules.ts';

/** The body's coin is `mod 2`: 1 is the Attack, 0 the Ultima. */
export const UB_COIN_MODULO = 2;
export const UB_ATTACK_DRAW = 1;
/** The forced turn comes when the counter has reached this (`v10 >= 2`). */
export const UB_FORCED_AT = 2;
/** What the gate and the hit write: the gate (255, Armored, Defend) and the Defense after every hit (50); a bare body is written 0 first. */
export const UB_GATE_DEF = 255;
export const UB_HIT_DEF = 50;
export const UB_BARE_DEF = 0;
/** The Arms' maximum HP (a revived Arm comes back whole) when the combatant does not say. */
export const UB_ARM_HP = 80_000;
/** The command the body's relay answer is keyed on (Special 1, 0x6001) and the selector values the Head writes. */
export const UB_RELAY_ATTACK = 1;
export const UB_RELAY_CONTAMINATION = 2;
/** The memory slots: the body's `v10` (turns) and `v11` (turns with both Arms down), the Head's `v2` (its cycle state, 1 to 3). */
export const UB_TURNS = 'gauntlet.ultimaBuster.turns';
export const UB_REGROW = 'gauntlet.ultimaBuster.regrow';
export const UB_HEAD_STATE = 'gauntlet.ultimaBuster.headState';

/** The Arms, as combatants (both, alive or not). */
export function ultimaBusterArms(ctx: Pick<Ctx, 'state'>): FFXCombatant[] {
  return [ID.ultimaBusterArmLeft, ID.ultimaBusterArmRight].map((id) => ctx.state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);
}
/** True when both Arms are down (`readBtlChrProperty(22, isAlive) == 0 and readBtlChrProperty(23, isAlive) == 0`). */
export const bothArmsDown = (ctx: Pick<Ctx, 'state'>): boolean => ultimaBusterArms(ctx).every((a) => !isAlive(a));
/** True when at least one Arm stands. */
export const anArmLives = (ctx: Pick<Ctx, 'state'>): boolean => ultimaBusterArms(ctx).some((a) => isAlive(a));

/** The formation's scene: both Arms re-initialised at full HP, statuses cleared, back in the battle. A loot roll they owed at their last death was paid then (they drop nothing). */
export function regrowArms(ctx: Ctx): void {
  for (const arm of ultimaBusterArms(ctx)) {
    if (isAlive(arm)) continue;
    ctx.rt.overkilled = ctx.rt.overkilled.filter((id) => id !== arm.id);
    restorePart(ctx, arm.id, arm.enemy?.forms[0]?.hp ?? UB_ARM_HP);
    arm.statuses = {};
  }
  ctx.emit({ type: 'message', text: "The Ultima Buster's arms grow back", kind: 'system' });
}

/** One body turn (RE n 3.1). */
export function ultimaBusterTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  if (bothArmsDown(ctx)) {
    const count = num(memory, UB_REGROW);
    if (count > gameMod(ctx, UB_COIN_MODULO) + 1) {
      memory[UB_REGROW] = 0;
      regrowArms(ctx);
    } else {
      memory[UB_REGROW] = count + 1;
    }
  }
  const front = livingFrontLine(ctx).map((c) => c.id);
  let command: Command | null;
  if (num(memory, UB_TURNS) >= UB_FORCED_AT) {
    const victim = randomLiving(ctx);
    if (victim !== undefined) {
      queueReaction(ctx, self.id, use(ai, ROW.attack, [victim.id]), { keepsControl: true, byId: victim.id, requiresAlive: victim.id }); // the second command of the turn, behind the Ultima
    }
    command = front.length === 0 ? null : use(ai, ROW.ultima, front);
    memory[UB_TURNS] = 0;
  } else if (gameMod(ctx, UB_COIN_MODULO) === UB_ATTACK_DRAW) {
    const victim = randomLiving(ctx);
    command = victim === undefined ? null : use(ai, ROW.attack, [victim.id]);
  } else {
    command = front.length === 0 ? null : use(ai, ROW.ultima, front);
  }
  memory[UB_TURNS] = num(memory, UB_TURNS) + 1;
  return command;
}

/** Does the gate catch this command? It affects HP and its damage type is physical (the record's low two bits 1 or 3). */
export function gateCatches(used: UsedCommand): boolean {
  const record = resolveCommand(used.def, used.user).record;
  const type = record.flagsDamage & 3;
  return (record.damageClass & 1) !== 0 && (type === 1 || type === 3);
}

/** The gate down: Defense written 0 (the body bare), Armored and Defend off. */
function lowerGate(c: FFXCombatant, def: number): void {
  c.stats.def = def;
  setArmored(c, false);
  delete c.statuses['defend'];
}

/** The gate up for the one command: Defense 255, Armored and Defend on (silently: it is no status the player reads). */
function raiseGate(c: FFXCombatant): void {
  c.stats.def = UB_GATE_DEF;
  setArmored(c, true);
  if (c.statuses['defend'] === undefined) c.statuses['defend'] = { id: 'defend', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** The body hears a command name it, before any damage (RE n 3.1). */
export function ultimaBusterOnTargeted(ctx: Ctx, self: FFXCombatant, used: UsedCommand): void {
  lowerGate(self, UB_BARE_DEF); // always, first
  if (used.def.id === ROW.special1) {
    // The Head's relay: a random living member is picked whatever the selector says, then the Attack or the Contamination is the body's own free action at them.
    const victim = randomLiving(ctx);
    const selector = ctx.state.flags[UB_RELAY_FLAG];
    if (victim !== undefined && canQueue(self)) {
      const row = selector === UB_RELAY_ATTACK ? ROW.attack : selector === UB_RELAY_CONTAMINATION ? ROW.contamination : undefined;
      if (row !== undefined) queueReaction(ctx, self.id, use(aiContextFor(ctx, self), row, [victim.id]), { keepsControl: true, byId: victim.id, requiresAlive: victim.id });
    }
    ctx.state.flags[UB_RELAY_FLAG] = 0;
    return;
  }
  if (gateCatches(used) && anArmLives(ctx)) raiseGate(self);
}

/** After the hit: Defense 50, Armored and Defend off (the gate is for one command). */
export function ultimaBusterOnHit(_ctx: Ctx, self: FFXCombatant): void {
  lowerGate(self, UB_HIT_DEF);
}

/** One Head turn (RE n 3.1). */
export function ultimaBusterHeadTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const body = tryActor(ctx, ID.ultimaBuster);
  const state = num(memory, UB_HEAD_STATE, 1);
  const rt = rtOf(ctx, self.id);
  if (state === 2) {
    // The warning turn: no command. The Head shakes (a telegraph the player can read); a damaging hit before its next turn cancels the Contamination.
    memory[UB_HEAD_STATE] = 3;
    ctx.state.flags[UB_HEAD_STATE_FLAG] = 3;
    rt.charge = { name: 'Shaking', turnsLeft: 1, stage: 1 };
    ctx.emit({ type: 'charge', enemyId: self.id, name: 'Shaking', turnsLeft: 1, stage: 1 });
    return null;
  }
  ctx.state.flags[UB_RELAY_FLAG] = state === 1 ? UB_RELAY_ATTACK : UB_RELAY_CONTAMINATION;
  memory[UB_HEAD_STATE] = state === 1 ? 2 : 1;
  ctx.state.flags[UB_HEAD_STATE_FLAG] = state === 1 ? 2 : 1;
  if (state !== 1) rt.charge = null; // the Contamination turn: the telegraph is spent
  return body === undefined ? null : use(ai, ROW.special1, [body.id]);
}

/** The Head took the action's hits: a damaging one in state 3 resets the cycle (the Contamination never comes). */
export function ultimaBusterHeadOnHit(ctx: Ctx, self: FFXCombatant, _used: UsedCommand, report: HitReport): void {
  const body = tryActor(ctx, ID.ultimaBuster);
  if (body === undefined || body.hp <= 0) return;
  const memory = rtOf(ctx, self.id).ai;
  if (report.lastDamage <= 0 || num(memory, UB_HEAD_STATE, 1) !== 3) return;
  memory[UB_HEAD_STATE] = 1;
  ctx.state.flags[UB_HEAD_STATE_FLAG] = 1;
  rtOf(ctx, self.id).charge = null;
  queueEmit(ctx, { type: 'message', text: "The Ultima Buster's head stops shaking", kind: 'system' });
}

registerAiScript(GAUNTLET_SCRIPTS.ultimaBuster, ultimaBusterTurn);
registerAiScript(GAUNTLET_SCRIPTS.ultimaBusterHead, ultimaBusterHeadTurn);
registerAiScript(GAUNTLET_SCRIPTS.ultimaBusterArm, () => null); // the Arms never take a turn (`ordersOnly`); a script is registered so nothing falls back to a plain Attack
registerScriptHooks(GAUNTLET_SCRIPTS.ultimaBuster, { onTargeted: ultimaBusterOnTargeted, onHit: ultimaBusterOnHit });
registerScriptHooks(GAUNTLET_SCRIPTS.ultimaBusterHead, { onHit: ultimaBusterHeadOnHit });
