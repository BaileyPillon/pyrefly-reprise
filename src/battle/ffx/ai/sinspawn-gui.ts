/**
 * **Sinspawn Gui**, the Ridge of Mushroom Rock Road, as the game's own scripts run it (the hidden Sinspawn Gui chapter; re-parity; `research/re-ffx-ai-gui.md` "RE §n"). **Game case: FFX only.**
 *
 * ## The body's turn (`onTurn`, RE §5.2)
 *
 * | # | Condition | Action | Draw |
 * |---|---|---|---|
 * | 1 | both arms are down | the regrowth test: if `v13 > (rand mod 2) + 1` the arms grow back and `v13 := 0`, else `v13 += 1`; the turn goes on | one stream-2 draw each turn spent in this state |
 * | 2 | `v12 >= 2` | **Demi** on the whole front line; `v12 := 0` | none |
 * | 3 | otherwise | **Attack** on the Provoker if the body is Provoked, else on a random living member | the picker, one draw with two or more candidates (ascending actor number: Yuna, Auron, Seymour) |
 * | 4 | after 2 or 3 | `v12 += 1` | |
 * | 5 | the acceleration line `v11` is above the body's HP | `v12 += rand mod 2` | one stream-2 draw, after the command is chosen |
 *
 * That plays Attack, Attack, Demi, Attack, Demi... while the line is not crossed (fight 1 above 4,000 HP); under it, and in fight 2 from the first turn (the line is 12,000), a Demi can follow a Demi
 * (RE §5.2: turn two is a Demi half the time, tending to two thirds). The body keeps control of its script when Provoked, and its Demi is not redirected.
 *
 * ## The head (`onTurn`, `onHit`, RE §5.3)
 *
 * The head never attacks for itself. Its state `v3` cycles 1, 2, 3: **1** writes the relay selector `[04] := 1` and performs Special 1 on the body, **2** is the warning turn (no command; the head
 * shakes: a telegraph the player can read), **3** writes `[04] := 2` and performs Special 1 again. The body answers Special 1 in `onTargeted`: it picks a random living member and queues **Thunder** (selector 1)
 * or **Venom** (selector 2) at them as its own reaction (its Magic 20, no CTB cost). **A damaging hit on the head while it is in state 3 resets it to state 1: the Venom never comes** (RE §5.3, damage type
 * does not matter; a miss, a heal or a zero-damage action change nothing).
 *
 * ## The arms' shield (`onTargeted` and `onHit` of the body, RE §5.4)
 *
 * Before any damage, on every command that names the body: Defense, Defend and Armored are cleared, and then, **if the command affects HP and carries the physical flag and an arm lives, Defense becomes 100 and
 * Armored and Defend go on for that command only**; `onHit` clears them again. Spells, Overdrives, Lancet, Steal and items are never caught. **The arms** never act (no turn, hidden from the CTB list), are
 * Armored by record, and grow back together on the body's 3rd or 4th turn after both fell (`regrowArms`); their AP and gil are paid again for every death.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, livingFriendlies, rtOf, statusOf, tryActor } from '../state.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';
import { type HitReport, type ScriptHooks, type UsedCommand, queueEmit, queueReaction, registerScriptHooks } from './hooks.ts';
import { pickMatching, scriptMod } from './script-random.ts';
import {
  GUI_ACCEL_LINE,
  GUI_ARM_SCRIPT,
  GUI_BODY_SCRIPT,
  GUI_HEAD_SCRIPT,
  GUI_HEAD_STATE_FLAG,
  GUI_RELAY,
  GUI_SPECIAL_1_ID,
  GUI_VENOM_ID,
  MEM_ATTACKS,
  MEM_HEAD_STATE,
  MEM_REGROW,
  anArmLives,
  bothArmsDown,
  clearShield,
  guiBody,
  raiseShield,
  regrowArms,
  shieldCatches,
} from './sinspawn-gui-rules.ts';

export * from './sinspawn-gui-rules.ts';

/** The Provoker of a Provoked body, when it is still standing (the game aims the Attack at them; no picker draw). */
function provokerOf(ctx: Ctx, self: FFXCombatant): FFXCombatant | undefined {
  if (!has(self, 'provoke')) return undefined;
  const id = statusOf(self, 'provoke')?.sourceId;
  const provoker = id === undefined ? undefined : tryActor(ctx, id);
  return provoker !== undefined && provoker.alive && !provoker.removed ? provoker : undefined;
}

/** One body turn (RE §5.2). */
export function guiBodyAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;

  // 1. Both arms down: the regrowth test, one draw a turn; the turn goes on.
  if (bothArmsDown(ctx)) {
    const count = num(memory, MEM_REGROW);
    if (count > scriptMod(ctx, 2) + 1) {
      regrowArms(ctx);
      memory[MEM_REGROW] = 0;
    } else {
      memory[MEM_REGROW] = count + 1;
    }
  }

  // 2 and 3. Demi on everyone, or an Attack.
  let command: Command;
  if (num(memory, MEM_ATTACKS) >= 2) {
    command = use(ai, 'demi', []);
    memory[MEM_ATTACKS] = 0;
  } else {
    const provoker = provokerOf(ctx, self);
    const target = provoker ?? pickMatching(ctx, livingFriendlies(ctx));
    command = { kind: 'attack', targets: target ? [target.id] : [] };
  }

  // 4 and 5. The counter, and the extra step once the body is under the acceleration line.
  memory[MEM_ATTACKS] = num(memory, MEM_ATTACKS) + 1;
  if (num(ctx.state.flags as Record<string, number>, GUI_ACCEL_LINE) > self.hp) memory[MEM_ATTACKS] = num(memory, MEM_ATTACKS) + scriptMod(ctx, 2);
  return command;
}

/** One head turn (RE §5.3). */
export function guiHeadAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const body = guiBody(ctx);
  const state = num(memory, MEM_HEAD_STATE, 1);
  const rt = rtOf(ctx, self.id);

  if (state === 2) {
    // The warning turn: no command. The head shakes (a telegraph: the CTB pip and the banner); a damaging hit before the next turn stops the Venom.
    memory[MEM_HEAD_STATE] = 3;
    ctx.state.flags[GUI_HEAD_STATE_FLAG] = 3;
    rt.charge = { name: 'Shaking', turnsLeft: 1, stage: 1 };
    ctx.emit({ type: 'charge', enemyId: self.id, name: 'Shaking', turnsLeft: 1, stage: 1 });
    return null;
  }

  // States 1 and 3: the relay. The selector says which of the body's two reactions answers it.
  ctx.state.flags[GUI_RELAY] = state === 1 ? 1 : 2;
  memory[MEM_HEAD_STATE] = state === 1 ? 2 : 1;
  ctx.state.flags[GUI_HEAD_STATE_FLAG] = state === 1 ? 2 : 1;
  if (state !== 1) rt.charge = null; // the Venom turn: the telegraph is spent
  return body ? use(ai, GUI_SPECIAL_1_ID, [body.id]) : null;
}

/** The body hears a command name it, before any damage (RE §5.3 and §5.4). */
function onBodyTargeted(ctx: Ctx, self: FFXCombatant, used: UsedCommand): void {
  clearShield(self); // always, first

  // The head's Special 1: pick a random living member (drawn even when the selector is neither 1 nor 2), then Thunder or Venom at them, as the body's own reactions.
  if (used.def.id === GUI_SPECIAL_1_ID) {
    const victim = pickMatching(ctx, livingFriendlies(ctx));
    const selector = ctx.state.flags[GUI_RELAY];
    if (victim && (selector === 1 || selector === 2)) {
      queueReaction(ctx, self.id, { kind: 'ability', id: selector === 1 ? 'thunder' : GUI_VENOM_ID, targets: [victim.id] }, { keepsControl: true, byId: victim.id });
    }
    ctx.state.flags[GUI_RELAY] = 0;
    return;
  }

  // The shield: a physical command that affects HP, while an arm lives.
  if (shieldCatches(used.def, used.user) && anArmLives(ctx)) raiseShield(self);
}

/** The head took the action's hits: a damaging one in state 3 resets the cycle (RE §5.3). */
function onHeadHit(ctx: Ctx, self: FFXCombatant, _used: UsedCommand, report: HitReport): void {
  const memory = rtOf(ctx, self.id).ai;
  if (report.lastDamage <= 0 || num(memory, MEM_HEAD_STATE) !== 3) return;
  memory[MEM_HEAD_STATE] = 1;
  ctx.state.flags[GUI_HEAD_STATE_FLAG] = 1;
  rtOf(ctx, self.id).charge = null;
  queueEmit(ctx, { type: 'message', text: "Gui's head stops shaking", kind: 'system' });
}

registerScriptHooks(GUI_BODY_SCRIPT, {
  onTargeted: onBodyTargeted,
  onHit: (_ctx, self) => clearShield(self), // the shield is for one command
} satisfies ScriptHooks);
registerScriptHooks(GUI_HEAD_SCRIPT, { onHit: onHeadHit } satisfies ScriptHooks);

registerAiScript(GUI_BODY_SCRIPT, guiBodyAi);
registerAiScript(GUI_HEAD_SCRIPT, guiHeadAi);
registerAiScript(GUI_ARM_SCRIPT, () => null); // the arms never take a turn (`ordersOnly`); a script is registered so nothing falls back to a plain Attack
