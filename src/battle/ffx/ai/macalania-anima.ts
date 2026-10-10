/**
 * **Anima at Macalania Temple, as her script runs her** (m125; re-parity; `research/re-ffx-ai-seymour.md`
 * section 3.6; D-14, D-15). **Game case: FFX only.**
 *
 * ## The turn (`onTurn`)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | her first turn (arrival flag 128) | the Summon Anima marker (no hits) is queued first, and the turn **carries on** into the rows below |
 * | 2 | her Overdrive gauge is at 100 or more | **Oblivion** on the whole front line; the gauge goes to 0 |
 * | 3 | the cycle index is 0 or 2 | **Boost** on herself |
 * | 4 | the cycle index is 1 or 3 | **Pain** at a random living member; **the gauge gains 5** |
 * | 5 | always, after queueing | the index becomes `(index + 1) mod 4` |
 *
 * Rows 2 to 4 are alternatives: an Oblivion turn is neither a Boost nor a Pain, **but it still takes its place in
 * the cycle** (the index moves on every turn), so the Boost / Pain beat is counted in turns, not in casts.
 * The gauge moves in two places only: +5 on each Pain and **+5 for every action that reaches her**, once per action
 * however many hits, a miss and a heal included (her `onHit`). Nothing for the turn itself, nothing for Boost.
 * Her gauge mode is "aeons only", so damage taken fills nothing.
 *
 * Her first-turn marker is a command with no hits and no cost; the engine has no row for it and the arrival
 * announcement (`./macalania-acts.ts`) is its only trace.
 */

import type { Command } from '../../common/types.ts';
import { livingFriendlies } from '../state.ts';
import { setGauge } from '../overdrive.ts';
import { type AiContext, use } from './types.ts';
import { type ScriptHooks, registerScriptHooks } from './hooks.ts';
import { pickMatching } from './script-random.ts';
import {
  ANIMA_GAUGE_FULL,
  ANIMA_GAUGE_STEP,
  ANIMA_MACALANIA_SCRIPT,
  MAC_ANIMA_ARRIVAL,
  MAC_ANIMA_CYCLE,
  flagNum,
} from './macalania-rules.ts';

export const animaMacalaniaAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  const self = ai.self;

  // Her first turn (arrival flag 128) also queues the Summon Anima marker, which has no hits and no cost, and then
  // carries on; the flag is spent here (the script moves it through 240 to 255, a caption's bookkeeping).
  if (flagNum(ctx, MAC_ANIMA_ARRIVAL, 255) === 128) ctx.state.flags[MAC_ANIMA_ARRIVAL] = 255;

  const cycle = flagNum(ctx, MAC_ANIMA_CYCLE, 0) % 4;
  ctx.state.flags[MAC_ANIMA_CYCLE] = (cycle + 1) % 4;

  const gauge = self.overdrive?.gauge ?? 0;
  if (gauge >= ANIMA_GAUGE_FULL) {
    setGauge(ctx, self, 0, 'oblivion');
    return use(ai, 'anima-oblivion', []);
  }
  if (cycle === 0 || cycle === 2) return use(ai, 'anima-boost', [self.id]);
  const victim = pickMatching(ctx, livingFriendlies(ctx));
  setGauge(ctx, self, gauge + ANIMA_GAUGE_STEP, 'anima-pain');
  return use(ai, 'anima-pain-boss', victim ? [victim.id] : []);
};

registerScriptHooks(ANIMA_MACALANIA_SCRIPT, {
  // +5 for every action that reaches her, once per action per target (a miss, a heal and a status-only move count).
  onHit: (ctx, self) => {
    if (self.overdrive) setGauge(ctx, self, self.overdrive.gauge + ANIMA_GAUGE_STEP, 'targeted');
  },
} satisfies ScriptHooks);
