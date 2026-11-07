/**
 * **Shinryu's script** (FFX only; the hidden Shinryu chapter): the Monster Arena's deep-water dragon (monster file `m283`), as the game's own bytecode runs it (`research/re-ffx-shinryu.md` section 2, "RE 2": 478 bytes of
 * code in one worker, read from the file and run in the earlier lanes' interpreter, `[R]` and `[H]`). **No number here is ours**; the rows are `data/ffx/enemies/shinryu-abilities.ts`, the record `data/ffx/enemies/shinryu.ts`.
 *
 * ## The turn (RE 2)
 *
 * One draw, `GetRandomValue() mod 3` (the battle generator's script stream, `./game-rolls.ts#gameMod`):
 *
 * | Draw | Move |
 * |---|---|
 * | 0 | **Shining** on the front line (eight hits of power 9, each on a random member: `shinryu-abilities.ts`) |
 * | 1 | **Eraser** (Petrify 255) on one living member **if more than one is alive**, else an **Attack** on the living one |
 * | 2 | **Attack** on one living member |
 *
 * So the split is exactly 1/3 each with two or three alive, and with one alive it is Shining 1/3 and Attack 2/3 (`t-shinryu.out.txt` of the note: draws 0..59). A target is `findMatchingChr(front line, alive)`: the
 * living, targetable members, one picked by the picker stream only when two or more qualify (`./game-rolls.ts#randomLiving`). The turn writes no state, keeps no counter and has no phase.
 *
 * ## When it is hit (RE 2)
 *
 * **If the action took any HP (`LastDamageTakenHP` above 0), a counter Attack on the last attacker.** A zero-damage action, a miss and a heal do not; there is no physical-only test, no cap per round and no phase (the Jegged
 * line "will counterattack regular attacks" is the guide's summary of this rule). It is a free action (`./hit-gates.ts#react`): a counter never triggers another counter, a second hit event in one action (a Doublecast)
 * draws one answer, and the killing blow draws none (its owner is gone). The hook keeps no state.
 *
 * **Not here:** the formation's own script is camera work and poses (RE 6 C1) and sets nothing; the water rule (a landed Petrify shatters a party member) is the formation's flag (`EnemyGroupDef.inWater`) and the status
 * step's, shared with the Flooded Ways (`adapt/status.ts`).
 */

import type { Command } from '../../common/types.ts';
import { gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { react } from './hit-gates.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';

/** The combatant, the script and the three rows (copies of `data/ffx/shinryu-ids.ts`, which the battle layer does not import; `shinryu-data.test.ts` pins that they agree). */
export const SHINRYU_ID = 'shinryu';
export const SHINRYU_SCRIPT = 'shinryu';
export const SHINRYU_ROWS = {
  attack: 'shinryu-attack', // 0x40F0
  eraser: 'shinryu-eraser', // 0x40F6
  shining: 'shinryu-shining', // 0x40BF
} as const;

/** The turn's draw is `mod 3` (RE 2). */
export const SHINRYU_ROLL_MODULO = 3;

/** One Shinryu turn (RE 2). */
export function shinryuTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const roll = gameMod(ctx, SHINRYU_ROLL_MODULO);
  if (roll === 0) return use(ai, SHINRYU_ROWS.shining, []);
  const victim = randomLiving(ctx);
  if (victim === undefined) return null; // nobody left to aim at (the battle is over)
  // Eraser only while more than one member is alive (`isAlive` of the front line compared with 1); the one-alive case is the plain Attack.
  if (roll === 1 && livingFrontLine(ctx).length > 1) return use(ai, SHINRYU_ROWS.eraser, [victim.id]);
  return use(ai, SHINRYU_ROWS.attack, [victim.id]);
}

/** Shinryu's `onHit`: a counter Attack on whoever dealt HP damage (RE 2). */
export function shinryuHit(event: HitEvent): void {
  const { ctx, target, attacker } = event;
  if (event.lastDamage <= 0 || target.hp <= 0) return; // a miss, a heal, a zero-damage action, or the blow that killed it
  if (attacker.side === 'enemy') return;
  react(ctx, target, attacker.id, use(aiContextFor(ctx, target), SHINRYU_ROWS.attack, [attacker.id]));
}

registerAiScript(SHINRYU_SCRIPT, shinryuTurn);
registerHitScript(SHINRYU_SCRIPT, shinryuHit);
