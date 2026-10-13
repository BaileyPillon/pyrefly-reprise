/**
 * The engine's side of `parity-ffx-engine-reactions.test.ts` (re-parity RC4 lane F; **FFX only**): a generated fight
 * (`ffxEngineReactions.ts`) run through the engine's own functions, and what they produced.
 */

import type { SeededRng } from '../../../src/battle/common/rng.ts';
import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import {
  type Member,
  type Outcome,
  type Seen,
  type Situation,
  type Words,
  ITEM_ID,
  ITEM_NUMBER,
  REACTION_ITEMS,
  contextOf,
  recordOfWords,
  syncStatuses,
} from './ffxEngineReactions.ts';

/** The engine functions under test, handed in by the test. */
export interface EngineDrive {
  reactToHit: (ctx: Ctx, target: FFXCombatant, hit: { hpBefore: number; hpDamage: number; before: Words; after: Words; woke: boolean }) => void;
  koActor: (ctx: Ctx, target: FFXCombatant) => void;
  drain: (ctx: Ctx, keepDeaths: boolean) => void;
}

/** Run a situation through the engine's own functions: the hit's reactions, the death check, the end-of-action drain. */
export function runEngine(sit: Situation, rng: SeededRng, run: EngineDrive): Outcome {
  const { ctx, byId, events } = contextOf(sit, rng);
  const words = new Map<string, Words>(sit.members.map((m) => [m.id, m.words]));
  const memberOf = new Map(sit.members.map((m) => [m.id as string, m]));
  for (const m of sit.members) syncStatuses(byId.get(m.id) as FFXCombatant, m.words, m.given);
  for (const step of sit.steps) {
    if (step.kind === 'hit') {
      const c = byId.get(step.who) as FFXCombatant;
      // the equipment words survive a KO in the game (the engine drops its permanent instances); put them back before the hit
      syncStatuses(c, words.get(step.who) as Words, (memberOf.get(step.who) as Member).given);
      run.reactToHit(ctx, c, {
        hpBefore: c.hp,
        hpDamage: step.hpDamage,
        before: recordOfWords(words.get(step.who) as Words),
        after: recordOfWords(step.after),
        woke: step.woke,
      });
      c.hp = Math.max(0, c.hp - step.hpDamage);
      words.set(step.who, step.after);
      syncStatuses(c, step.after, (memberOf.get(step.who) as Member).given);
    } else if (step.kind === 'kill') {
      const c = byId.get(step.who) as FFXCombatant;
      run.koActor(ctx, c);
      if (c.alive) {
        // revived by Auto-Life: the KO reset clears Zombie and Scan with the rest (RC5); only the Eject marker stays (the engine's stand-in for the separate ejected flag)
        const prev = words.get(step.who) as Words;
        const reset: Words = { perm: 0, counters: new Array<number>(13).fill(0), extra: prev.extra & 0x100 };
        words.set(step.who, reset);
        syncStatuses(c, reset, (memberOf.get(step.who) as Member).given);
      }
    } else {
      run.drain(ctx, step.keep);
    }
  }
  const seen: Seen[] = events
    .filter((e) => e['type'] === 'counter')
    .map((e) => ({ user: e['actorId'] as string, target: e['targetId'] as string, item: ITEM_NUMBER[e['abilityId'] as string] as number, cause: e['cause'] as string }));
  const bag: Record<number, number> = {};
  for (const item of REACTION_ITEMS) bag[item] = ctx.rt.inventory.get(ITEM_ID[item] as string) ?? 0;
  return { seen, bag };
}
