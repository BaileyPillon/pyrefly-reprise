/**
 * SFX parity: the compiled per-event rules of both games (`eventCuesFfx.ts`, `eventCuesFfx2.ts`), and the names the
 * hooks give the recorded originals. Compiled once at load; `battleVoice.ts` `voiceEvents` reads them.
 *
 * Game case (AGENTS.md rule 14): each game has its own rule list and `eventPlan` only reads the asking game's, so an
 * FFX-2 chapter can never resolve an FFX event or the reverse.
 */

import { compileRules, type EventGame, type EventRule, type Hook } from './eventCues.ts';
import { FFX_HOOKS } from './eventCuesFfx.ts';
import { FFX2_HOOKS } from './eventCuesFfx2.ts';

export const EVENT_HOOKS: Readonly<Record<EventGame, readonly Hook[]>> = { ffx: FFX_HOOKS, ffx2: FFX2_HOOKS };

export const EVENT_RULES: Readonly<Record<EventGame, readonly EventRule[]>> = {
  ffx: compileRules(FFX_HOOKS),
  ffx2: compileRules(FFX2_HOOKS),
};

/** Every recorded-original name a game's hooks give, with the spec rows that name it (a cue may answer one row from several hooks). */
export function eventCueNames(game: EventGame): ReadonlyMap<string, readonly string[]> {
  const out = new Map<string, string[]>();
  for (const h of EVENT_HOOKS[game]) {
    if (h.cue === null) continue;
    const rows = out.get(h.cue) ?? [];
    if (!rows.includes(h.row)) rows.push(h.row);
    out.set(h.cue, rows);
  }
  return out;
}
