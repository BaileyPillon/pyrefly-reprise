/**
 * The Yu Pagodas, their turn and their `onHit` (`research/re-ffx-ai-yunalesca-bfa.md` section 4, m173 and m174; **FFX only**).
 *
 * The two scripts are the same program with three differences: which Pagoda is its partner, the roll that picks Curse over
 * Osmose when the partner is down (Curse above 30 for m173, above 70 for m174), and a battle variable only the first link
 * reads. m173 is the third formation slot (chr 22), here `yu-pagoda-right`; m174 is chr 21, `yu-pagoda-left`.
 *
 * **Their turn.** While the partner is up the Pagoda heals the main enemy with Power Wave: Braska's Final Aeon, always; a
 * possessed aeon only while that aeon's Overdrive gauge is below 100, otherwise it repeats whatever it queued last turn (the
 * script keeps its target and command in two private variables, `v5` and `v6`, and queues them whatever they hold); Yu
 * Yevon, always (row P1). While the partner is down it attacks the party instead: a random living actor, Curse or Osmose by
 * the roll above, target first (row P2).
 *
 * **Their death.** A Pagoda is never really dead. Its `onHit` adds every positive `LastDamageTakenHP` it takes to a pool
 * (heals never subtract; Yojimbo's Zanmato sets the pool to its current maximum); when a hit leaves it at 0 HP its maximum
 * becomes that pool, so it comes back with the damage it absorbed in the life that just ended, overkill included, and the
 * pool compounds from life to life (row P4). It then hides: untargetable, off the turn bar, and for the next two or three of
 * its own turns (a draw, 50.03% three) or just the next one if it is Slowed (row P3) it only counts down; on the last of them
 * it reappears and the turn is spent. The engine keeps a hidden Pagoda out of the queue instead of letting it take empty
 * turns, and arms the same instant: when its counter reaches the first of those turns, plus a rank-3 recovery for each of the
 * others (`hp.ts#scheduleRevivalAt`).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { koActor, scheduleRevivalAt } from '../hp.ts';
import { type HitEvent, registerHitScript } from '../hit-hooks.ts';
import { type Ctx, has, isAlive, rtOf, tryActor } from '../state.ts';
import { recoveryTicks } from '../turnQueue.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

/** The pool absorbed in the current life (v7). The maximum HP is the pool of the life in hand (v8). */
const ABSORBED = 'pagoda.absorbed';
/** The target and command its last turn left (v5, v6). */
const LAST_TARGET = 'pagoda.target';
const LAST_COMMAND = 'pagoda.command';
/** A possessed aeon's Overdrive gauge, in its actor memory (`possessed-aeons.ts`). */
const AEON_GAUGE = 'aeon.gauge';

/** Yojimbo's Zanmato, the one command that resets the pool (`usedCommand() == 0x30E2`). */
const ZANMATO = 'zanmato';

/** `GetRandomValue() mod 100 > n` picks Curse: 30 (69.0%) for m173, 70 (29.0%) for m174. */
function curseAbove(self: FFXCombatant): number {
  return self.id === 'yu-pagoda-left' ? 70 : 30;
}

/** The enemy a Pagoda heals: the first one that is not a part (Braska's Final Aeon, the possessed aeon, Yu Yevon). */
function mainEnemy(ctx: Ctx): FFXCombatant | undefined {
  return ctx.state.enemyIds.map((id) => tryActor(ctx, id)).find((c): c is FFXCombatant => c !== undefined && !c.flags.isPart);
}

/** The other Pagoda. */
function partnerOf(ctx: Ctx, self: FFXCombatant): FFXCombatant | undefined {
  return ctx.state.enemyIds
    .map((id) => tryActor(ctx, id))
    .find((c): c is FFXCombatant => c !== undefined && c.id !== self.id && c.flags.isPart === true);
}

export const yuPagodaAi = (ai: AiContext): Command | null => {
  const { ctx, self, memory } = ai;
  const partner = partnerOf(ctx, self);
  const main = mainEnemy(ctx);

  if (partner !== undefined && isAlive(partner) && main !== undefined) {
    if (main.id === 'braskas-final-aeon') {
      memory[LAST_TARGET] = main.id;
      memory[LAST_COMMAND] = 'power-wave-bfa';
    } else if (main.id.startsWith('possessed-')) {
      // Only while the aeon's gauge is below 100; at 100 the previous turn's target and command are queued again.
      if (num(rtOf(ctx, main.id).ai, AEON_GAUGE, 0) < 100) {
        memory[LAST_TARGET] = main.id;
        memory[LAST_COMMAND] = 'power-wave-aeon';
      }
    } else {
      memory[LAST_TARGET] = main.id;
      memory[LAST_COMMAND] = 'power-wave-aeon';
    }
  } else {
    const target = randomLiving(ctx);
    memory[LAST_TARGET] = target?.id ?? '';
    memory[LAST_COMMAND] = gameMod(ctx, 100) > curseAbove(self) ? 'yu-pagoda-curse' : 'osmose';
  }

  const command = memory[LAST_COMMAND];
  const target = memory[LAST_TARGET];
  if (typeof command !== 'string' || typeof target !== 'string' || target === '') return null;
  return use(ai, command, [target]);
};

/**
 * Its `onHit` (m173 f3 @0x03FD): the pool, then the "destruction". The engine settles nothing for it afterwards: this hook
 * either leaves it standing or has already taken it off the field and armed its return.
 */
function yuPagodaHit(event: HitEvent): void {
  const { ctx, target: pagoda, attacker, def } = event;
  const memory = rtOf(ctx, pagoda.id).ai;
  let absorbed = num(memory, ABSORBED, 0);
  if (def.id === ZANMATO) absorbed = pagoda.stats.maxHp;
  else if (!event.affectsHp) return;
  else if (event.lastDamage > 0) absorbed += event.lastDamage;
  memory[ABSORBED] = absorbed;
  if (pagoda.hp !== 0) return;

  // Destroyed: back with what it absorbed in this life, hidden for its next two or three turns (one if it is Slowed).
  memory[ABSORBED] = 0;
  const turns = has(pagoda, 'slow') ? 1 : 2 + (gameMod(ctx, 100) < 50 ? 1 : 0);
  const untilFirstTurn = rtOf(ctx, pagoda.id).ctb;
  const recovery = recoveryTicks(pagoda, 3);
  koActor(ctx, pagoda, attacker.id);
  scheduleRevivalAt(ctx, pagoda.id, ctx.state.ticks + untilFirstTurn + (turns - 1) * recovery, Math.max(1, absorbed));
}

for (const id of ['yu-pagoda', 'yu-pagoda-bfa', 'yu-pagoda-aeon']) {
  registerAiScript(id, yuPagodaAi);
  registerHitScript(id, yuPagodaHit, { managesHp: true });
}
