/**
 * Ixion at Djose Temple (the FFX-2 Chapter 3 finale). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Research `research/ffx2-ixion-djose.md` §4.2 `[SinirothX]`, prose matching on the wiki:
 *
 * ```
 * Basic pattern:
 * (1) 3/4 Normal Attack, 1/4 Thundara on all characters
 * (2) 3/4 Normal Attack, 1/4 Thundara on all characters
 * (3) Aerospark
 * (4) back to (1)
 * Action Count (AC):
 *   +5 when Ixion performs an attack   (+10 when it is Aerospark)
 *   +5 when Ixion is hit by an attack
 *   AC >= 100:  (1) Recharge
 *               (2) AC = 0 and Thor's Hammer
 * ```
 *
 * - The shape, the counter's increments and "Thor's Hammer is the next action after Recharge" are
 *   `[verified: 2 sources]` / `[verified: 3 sources]`. Recharge and Thor's Hammer are **two consecutive
 *   Ixion actions** (C3), so the party gets its ATB turns in between: that window is the tell.
 * - **F-8 `[conflict]`, settled for the build as 3/4 : 1/4, our estimate** (§4.3): the wiki's 2/3 : 1/3
 *   stays one flag away for the bench, `state.flags.ixionThundaraSplit = 'wiki'`.
 * - **"Hit" (Q4)**: the counter shares Chapter XI's machinery (`./fallen-aeons.ts`): FA8 a, every hostile
 *   action aimed at him, hit or miss, with `fallenAeonsAcTrigger = 'damaged'` as the switch to landed
 *   damage only. The research leans FA8 a for consistency with Chapter XI.
 * - **Unsourced (IX-12), labelled our estimate where a choice is forced:** Recharge and Thor's Hammer add
 *   nothing to the counter (the second zeroes it anyway; Anima's Oblivion precedent); after Thor's Hammer
 *   the cycle **restarts at step 1** (the research's own fallback); multi-hit and chain hits are not a
 *   question here, because the counter hears one notice per party action.
 */

import type { Command } from '../../common/types.ts';
import type { AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, attackedHooks, bumpAc, randomGirl } from './fallen-aeons.ts';

/** AI memory: where the basic cycle stands (0, 1, 2 = steps 1, 2, 3). */
export const IXION_STEP = 'ixionStep';
/** AI memory: 1 once Recharge has gone off, until Thor's Hammer follows. */
export const IXION_HAMMER_NEXT = 'ixionHammerNext';
/** The `script-trigger` name emitted as he picks Recharge (the story layer's hook for the tell). */
export const IXION_RECHARGE_TRIGGER = 'ixion-recharge';

/** The bench flag for F-8's other reading: `'wiki'` is 2/3 : 1/3 (the FF Wiki's prose). */
export const IXION_SPLIT_FLAG = 'ixionThundaraSplit';

/** +5 per attack, +10 for Aerospark, +5 when attacked (§4.2). */
export const IXION_AC_PER_ACTION = 5;
export const IXION_AC_AEROSPARK = 10;
export const IXION_AC_WHEN_ATTACKED = 5;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

export const x2IxionScript: AiScript = {
  id: 'x2-ixion',
  decide(ctx) {
    const self = ctx.self;
    // (2) AC = 0 and Thor's Hammer, the action after Recharge [verified: 3 sources].
    if (mem(self, IXION_HAMMER_NEXT) === 1) {
      setMem(self, IXION_HAMMER_NEXT, 0);
      setMem(self, AC, 0);
      setMem(self, IXION_STEP, 0); // IX-12: restart the cycle at step 1, our estimate
      return use('x2-ixion-thors-hammer', []);
    }
    // (1) Recharge at AC >= 100; the "Recharge" line is the only warning the game gives.
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, IXION_HAMMER_NEXT, 1);
      ctx.emit({ type: 'script-trigger', name: IXION_RECHARGE_TRIGGER, payload: { who: self.id } });
      return use('x2-ixion-recharge', []);
    }
    const step = mem(self, IXION_STEP);
    setMem(self, IXION_STEP, (step + 1) % 3);
    if (step === 2) {
      bumpAc(self, IXION_AC_AEROSPARK);
      return use('x2-ixion-aerospark', randomGirl(ctx));
    }
    // Steps 1 and 2: F-8. SinirothX 3/4 : 1/4 (our estimate); the wiki 2/3 : 1/3 behind the bench flag.
    const thundara = ctx.flags[IXION_SPLIT_FLAG] === 'wiki' ? ctx.rng.int(0, 2) === 2 : ctx.rng.int(0, 3) === 3;
    bumpAc(self, IXION_AC_PER_ACTION);
    return thundara ? use('x2-ixion-thundara', []) : use('x2-ixion-attack', randomGirl(ctx));
  },
  ...attackedHooks(IXION_AC_WHEN_ATTACKED),
};
