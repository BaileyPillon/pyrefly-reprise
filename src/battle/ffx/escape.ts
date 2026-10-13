/**
 * Escape and Flee (the party's special commands 0x3003 and 0x3018), moved out of `execute.ts` in re-parity RC7 lane L-CMD (FFX only).
 *
 * `research/re-ffx-command-gate.md` section 5, FFX-G07 findings 9 and 10:
 *
 * - **Escape** is rolled inside the command with **one draw** from the escaper's own mode-0 stream (`kernel/rolls.ts#escapeRoll`); the draw is
 *   spent in every case, in a battle that cannot be escaped as well. A success marks the escaper as gone and the Coward hook runs.
 * - **Flee** (the whole party) has no roll and no gate of its own. The command walks the active party and, for **each member that is in the
 *   battle, alive and not Petrified**, runs the Coward hook; a dead, Petrified or absent member is skipped by that loop (it still leaves the
 *   battle when the action ends).
 */

import type { FFXCombatant } from '../common/types.ts';
import { type Ctx, has, isAlive, tryActor } from './state.ts';
import { gaugeOnEscape } from './gauge.ts';
import { ejectActor } from './hp.ts';
import { escapeRoll } from './kernel/rolls.ts';
import { streamsOf } from './adapt/streams.ts';
import type { ExecutionResult } from './execute.ts';

/**
 * Escape: `draw & 255 < 191`, i.e. 74.6% [ffx-combat-core §1.8]. The roll is spent first, from the escaper's own mode 0 stream, even in a battle
 * that cannot be escaped (`research/re-ffx-rng-hit.md` section 6; `kernel/rolls.ts#escapeRoll`). Flee (the whole party) draws nothing here.
 */
export function tryEscape(ctx: Ctx, actor: FFXCombatant, party: boolean): ExecutionResult {
  const rolled = party ? true : escapeRoll(ctx.rt.canEscape ? 0 : 1, () => ctx.rng.on(streamsOf(ctx, actor).damage).int(0, 255));
  if (!ctx.rt.canEscape) {
    ctx.emit({ type: 'message', text: "Can't escape!", kind: 'system' });
    return { rank: 1, damageDealt: 0 };
  }
  // Flee always succeeds and ends the battle; Escape is per-character.
  const success = rolled;
  ctx.emit({ type: 'escape-attempt', actorId: actor.id, success, party });
  if (success && !party) ejectActor(ctx, actor, 'eject');
  // A successful flee runs the gauge's escape hook (Coward; `pp_BtlOdOnEscape`, VA 0x007b1090) for each member the game's loop visits: in the battle, alive and
  // not Petrified (FFX-G07 3.14, the Flee loop 0x007ada60). The escaper of a single Escape is the one acting, in the battle when the command is parsed, so it always runs.
  if (success) {
    const fled = party ? ctx.state.activeIds.map((id) => tryActor(ctx, id)).filter((c) => c !== undefined && isAlive(c) && !has(c, 'petrify')) : [actor];
    for (const c of fled) if (c && c.side !== 'enemy') gaugeOnEscape(ctx, c);
  }
  return { rank: party ? 2 : 1, damageDealt: 0 };
}
