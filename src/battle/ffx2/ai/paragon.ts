/**
 * Paragon, Chapter XIII link 1 (Cloister 100 of the Via Infinito). **FFX-2 only** [AGENTS.md
 * rule 14]. Research `research/ffx2-trema.md` §4.1, `[SinirothX]`, the wiki's and
 * Split_Infinity's prose agreeing:
 *
 * ```
 * (1) 1/4 each: Normal Attack 1 / 2 / 3 / 4
 * (2) 1/2 Normal Attack 5, 1/2 Genesis
 * (3) back to (1)
 * Counter: hit by any attack that Shell or Protect cannot reduce  ->  Big Bang
 * ```
 *
 * - **The counter** (TR12 = b) resolves at once through `AiScript.counter`
 *   (`engineHooks.ts#runCounters`). "An attack Shell or Protect cannot reduce" is the
 *   engine's `'none'` mitigation class (`execute.ts#attackClass`): Darkness, Charon, Mix,
 *   Target MP and every other `damageType: 'other'` action. A hit that only takes MP counts
 *   too: the wiki says draining him with a Mana Spring still draws Big Bang (plan Review,
 *   `[single source]`).
 * - **No idle Big Bang** (T-7): "if the party doesn't attack it for too long" is only in the
 *   Oversoul script; this is the normal form (TR7).
 * - **The MP gate** (TR4 = b, Review correction 2): in International / HD, draining his MP
 *   blocks Big Bang and Genesis (wiki, `[single source]`). No source gives either an MP cost,
 *   so "drained" is read as 0 MP. A blocked Genesis passes the turn and a blocked Big Bang is
 *   simply not cast; neither fallback is in the sources, `[estimate]`.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

const STEP = 'paragonStep';
const NORMAL_ATTACKS = [
  'paragon-attack-poison',
  'paragon-attack-itchy',
  'paragon-attack-confuse',
  'paragon-attack-pierce',
] as const;

function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Drained: International / HD, the wiki's reading (see the header). */
export function paragonDrained(ctx: AiContext): boolean {
  return ctx.self.mp <= 0;
}

export const paragonScript: AiScript = {
  id: 'paragon',
  decide(ctx) {
    const self = ctx.self;
    const step = mem(self, STEP);
    setMem(self, STEP, step === 0 ? 1 : 0);
    if (step === 0) {
      const id = NORMAL_ATTACKS[ctx.rng.int(0, 3)] ?? NORMAL_ATTACKS[0];
      return use(id, randomGirl(ctx));
    }
    if (ctx.rng.int(0, 1) === 1) {
      if (!paragonDrained(ctx)) return use('paragon-genesis', []);
      ctx.emit({ type: 'message', text: 'Paragon has no MP left for Genesis.', kind: 'system' });
      return null;
    }
    return use('paragon-attack-drain', randomGirl(ctx));
  },
  counter(ctx, _attacker, hit) {
    if (hit.attackClass !== 'none' || !(hit.amount > 0)) return null;
    if (paragonDrained(ctx)) return null;
    return use('paragon-big-bang', []);
  },
};
