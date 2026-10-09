/**
 * Chapter 3, part 2: Yu Yevon, his turn and his `onHit` (`research/re-ffx-ai-yunalesca-bfa.md` section 6, m176 in `sins07_10`;
 * **FFX only**).
 *
 * His turn (rows V1 to V3), in this order:
 *
 * 1. If the Osmose turn has been taken (`yy.osmosed`): Ultima on the front line, and the counter returns to 0.
 * 2. Else, on his very first turn only: nothing. That is the only idle turn there is.
 * 3. Else, with seven or more counters: Osmose on each of Character #1 to #3 who is alive and in the battle (the script
 *    queues one single-target action each, up to three in one turn; ours is one Osmose aimed at that group, `osmose` carries
 *    `extra.groupTarget`, which resolves each target in turn the same way), and the Osmose turn is taken.
 * 4. Else: Gravija on the front line plus himself. His two Yu Pagodas are not in the group.
 *
 * His reaction (`onHit`, V4 and V5): unless the last attacker is himself, a Power Wave first strips his Zombie and Reflect,
 * and then, if the sub-action left `LastDamageTakenHP` above 0, the counter goes up by one and he casts Curaga on himself.
 * One counter per sub-action that dealt him HP damage, whoever dealt it, and a Doublecast is two. His own Gravija and a
 * heal or a miss never count. A Pagoda's Power Wave on a Zombie Yu Yevon is 1,500 damage, so it counts, and the Curaga it
 * draws heals him because the Zombie has just been stripped. A Poison tick raises no hit event. The counter is reset only
 * by the Ultima turn, so counters taken between the Osmose turn and the Ultima turn are wasted.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type HitEvent, queueReaction, registerHitScript } from '../hit-hooks.ts';
import { isAlive, rtOf } from '../state.ts';
import { removeStatus } from '../statuses.ts';
import { canQueue, frontLine } from './game-rolls.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

const FIRST_DONE = 'yy.firstDone';
const COUNTER = 'yy.curagaCount';
const OSMOSED = 'yy.osmosed';

/** Counters it takes before the Osmose and Ultima pair [note section 6.2]. */
export const YU_YEVON_CURAGA_THRESHOLD = 7;

export const yuYevonAi = (ai: AiContext): Command | null => {
  const { ctx, self, memory } = ai;
  const front = frontLine(ctx).map((c) => c.id);

  if (memory[OSMOSED] === true) {
    memory[OSMOSED] = false;
    memory[COUNTER] = 0;
    return use(ai, 'ultima', front);
  }
  if (num(memory, FIRST_DONE, 0) === 0) {
    memory[FIRST_DONE] = 1;
    return null;
  }
  if (num(memory, COUNTER, 0) >= YU_YEVON_CURAGA_THRESHOLD) {
    memory[OSMOSED] = true;
    const party = front.filter((id) => ctx.state.activeIds.includes(id) && isAlive(ctx.state.combatants[id] as FFXCombatant));
    return party.length > 0 ? use(ai, 'osmose', party) : null;
  }
  return use(ai, 'gravija', [...front, self.id]);
};

/** His `onHit` (m176 f3 @0x01AF). */
function yuYevonHit(event: HitEvent): void {
  const { ctx, target: boss, attacker, def } = event;
  if (attacker.id === boss.id) return;
  if (def.id === 'power-wave-aeon') {
    removeStatus(ctx, boss, 'zombie', 'dispelled');
    removeStatus(ctx, boss, 'reflect', 'dispelled');
  }
  if (event.lastDamage <= 0) return;
  const memory = rtOf(ctx, boss.id).ai;
  memory[COUNTER] = num(memory, COUNTER, 0) + 1;
  if (!canQueue(boss)) return;
  const ai: AiContext = { ctx, self: boss, memory };
  queueReaction(ctx, { actorId: boss.id, targetId: boss.id, command: use(ai, 'curaga', [boss.id]), cause: 'script' });
}

registerAiScript('yu-yevon', yuYevonAi);
registerHitScript('yu-yevon', yuYevonHit);
