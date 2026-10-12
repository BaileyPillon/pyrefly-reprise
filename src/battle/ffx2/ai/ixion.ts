/**
 * Ixion at Djose Temple (the FFX-2 Chapter 3 finale). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI lane C (2026-10-10): the script is the game's own** (`m166`, read in
 * `research/re-ffx2-ai-leblanc-den-ixion.md` section 5, rows I1 to I5 of section 8). Three hidden variables, all 0 at
 * the start: the action counter (AC), the energy flag and the cycle counter. Each poll, in this order:
 *
 * 1. AC at least 100 and the energy flag clear: the flag is set and he uses **Recharge** on himself.
 * 2. AC at least 100 and the flag set: the flag is cleared, **AC goes to 0** and he uses **Thor's Hammer** on the party.
 * 3. AC below 100: the cycle counter gains 1. When it reaches 3 it goes back to 0, AC gains 10 and he uses
 *    **Aerospark** on a living girl.
 * 4. Otherwise (the counter is 1 or 2): AC gains 5, then `random() % 4`: 0 is **Thundara** on the party, else an
 *    **Attack** on a living girl. (3 Attack to 1 Thundara; the wiki's 2 to 1 is not what the script does.)
 *
 * AC is read before the poll's own gain. **Rows 1 and 2 leave the cycle counter alone**, so after the Hammer the cycle
 * carries on from where it was (our earlier "restart at step 1" was an estimate the script answers). The reaction
 * entry adds **5 to AC for every result another character applies to him**: each landing strike (a two-hit command
 * that lands is 10), one for a miss however many strikes it had, one for a no-effect result, a Steal or a status move
 * included; never his own Recharge, never a tick (`results-tally.ts`, `AiScript.onResults`). It replaces the earlier
 * "+5 once per party action aimed at him". Hits taken between Recharge and the Hammer are lost with the reset; hits
 * taken after the Hammer's poll count towards the next cycle. His MP (9,999) is read by nothing: "Recharge" is the
 * telegraph, not a refill.
 *
 * Kept as the earlier build had them: Attack and Aerospark pick a girl uniformly where the game weights by closeness and
 * facing (needs positions, `script-rolls.ts`); the action time (`DJOSE_ACTION_TIME_SECONDS`, D-269) waits for batch W4.
 */

import type { Command } from '../../common/types.ts';
import type { AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc } from './fallen-aeons.ts';
import { girls, pickId, scriptMod } from './script-rolls.ts';

/** AI memory: where the basic cycle stands (0, 1, 2: the counter before this poll's gain; 2 means Aerospark is next). */
export const IXION_STEP = 'ixionStep';
/** AI memory: the energy flag, 1 once Recharge has gone off, until Thor's Hammer follows. */
export const IXION_HAMMER_NEXT = 'ixionHammerNext';
/** The `script-trigger` name emitted as he picks Recharge (the story layer's hook for the tell). */
export const IXION_RECHARGE_TRIGGER = 'ixion-recharge';

/** AC gained by an Attack or a Thundara poll, by an Aerospark poll, and per result he receives (m166.src:100-132). */
export const IXION_AC_PER_ACTION = 5;
export const IXION_AC_AEROSPARK = 10;
export const IXION_AC_PER_RESULT = 5;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

export const x2IxionScript: AiScript = {
  id: 'x2-ixion',
  decide(ctx) {
    const self = ctx.self;
    // Rows 1 and 2: AC read before this poll's own gain. They leave the cycle counter alone.
    if (acOf(self) >= AC_OVERDRIVE) {
      if (mem(self, IXION_HAMMER_NEXT) === 0) {
        setMem(self, IXION_HAMMER_NEXT, 1);
        ctx.emit({ type: 'script-trigger', name: IXION_RECHARGE_TRIGGER, payload: { who: self.id } });
        return use('x2-ixion-recharge', []);
      }
      setMem(self, IXION_HAMMER_NEXT, 0);
      setMem(self, AC, 0);
      return use('x2-ixion-thors-hammer', []);
    }
    // Rows 3 and 4: the cycle counter gains 1 and, at 3, goes back to 0 with the Aerospark.
    const counter = mem(self, IXION_STEP) + 1;
    if (counter >= 3) {
      setMem(self, IXION_STEP, 0);
      bumpAc(self, IXION_AC_AEROSPARK);
      return use('x2-ixion-aerospark', pickId(ctx.rng, girls(ctx)));
    }
    setMem(self, IXION_STEP, counter);
    bumpAc(self, IXION_AC_PER_ACTION);
    if (scriptMod(ctx.rng, 4) === 0) return use('x2-ixion-thundara', []);
    return use('x2-ixion-attack', pickId(ctx.rng, girls(ctx)));
  },
  /** The reaction entry: +5 to AC for every result another character applies to him. */
  onResults(ctx, report) {
    bumpAc(ctx.self, IXION_AC_PER_RESULT * report.count);
  },
};
