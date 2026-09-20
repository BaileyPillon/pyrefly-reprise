/**
 * Chapter 3, part 2 — Yu Yevon [ffx-bfa-yu-yevon §3].
 *
 * Half his scheduled turns are a scripted do-nothing, so Gravija — which takes
 * exactly 75% of *every* combatant's current HP, his own included, and can never
 * KO — lands roughly every 36 ticks.
 *
 * The fight is the **Curaga counting rule**: he fires at most one Curaga per
 * player-side action that damaged him, evaluated after that action has fully
 * resolved. Hits, targets and spells inside one command are irrelevant, which
 * is why Doublecast nets a clean 9 999 and a twelve-hit Attack Reels nets its
 * whole total minus one. Poison ticks, his own Gravija self-damage and a
 * Pagoda's Power Wave never count, and a counter never triggers a counter.
 *
 * The party carries a permanent, fayth-granted Auto-Life from the possessed-aeon
 * fights onward, which is what makes this unlosable.
 */

import type { Command } from '../../common/types.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

const IDLE = 'yy.idle';
const CURAGA_COUNT = 'yy.curagaCount';
const PENDING = 'yy.pendingScript';

/** Curagas fired before the Osmose / Ultima pair [ffx-bfa-yu-yevon §3.4]. */
export const YU_YEVON_CURAGA_THRESHOLD = 7;

export const yuYevonAi = (ai: AiContext): Command | null => {
  const party = ai.ctx.state.activeIds.slice();

  // The Osmose -> Ultima pair queued by the Curaga counter.
  const pending = num(ai.memory, PENDING, 0);
  if (pending === 1) {
    ai.memory[PENDING] = 2;
    return use(ai, 'osmose', party);
  }
  if (pending === 2) {
    ai.memory[PENDING] = 0;
    ai.memory[CURAGA_COUNT] = 0;
    return use(ai, 'ultima', party);
  }

  // Alternate a scripted no-op with Gravija.
  const idle = num(ai.memory, IDLE, 0);
  ai.memory[IDLE] = idle === 0 ? 1 : 0;
  if (idle === 0) return null;
  // Gravija "removes exactly 75% of current HP from **every target on the
  // field** — including Yu Yevon himself" [ffx-bfa-yu-yevon §3.3, verified: 2
  // sources]. "Every target on the field" is every target: the two Yu Pagodas
  // are on it too, and leaving them out of the list was what kept them topped
  // up while they healed him, so the attrition route §3.5 documents could never
  // land. The record already carries `targeting: 'all'` and
  // `extra.includesUser`, so an empty target list lets `targeting.ts` expand it
  // to the whole field rather than the hand-built party-plus-self list.
  return use(ai, 'gravija', []);
};

/**
 * The counter hook: one Curaga per damaging player **action**.
 *
 * Returns the counter command, or `null` when nothing should fire. The engine
 * calls this once per resolved action, never per hit and never for a counter.
 */
export function yuYevonCounter(ai: AiContext): Command | null {
  const count = num(ai.memory, CURAGA_COUNT, 0) + 1;
  ai.memory[CURAGA_COUNT] = count;
  if (count >= YU_YEVON_CURAGA_THRESHOLD) ai.memory[PENDING] = 1;
  return use(ai, 'curaga', [ai.self.id]);
}

registerAiScript('yu-yevon', yuYevonAi);
