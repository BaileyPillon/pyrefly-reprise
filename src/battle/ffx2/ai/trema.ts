/**
 * Trema, Chapter XIII link 2 (Cloister 100 of the Via Infinito). **FFX-2 only** [AGENTS.md
 * rule 14]. Research `research/ffx2-trema.md` §4.2, `[SinirothX]`; the HP triggers agree with
 * the wiki:
 *
 * ```
 * (1) 1/2 Dying Star, 1/8 Demi, 1/8 Flare, 1/12 Choking Mist, 1/12 Beguiling Mire, 1/12 Waning Moon
 * (2a) after Dying Star: Falling Leaf, then (3a) Thundering Wave, then back to (1)
 * (2b) after anything else: back to (1)
 * HP triggers (each fires once, at the next chance):
 *   HP < 1/2 max -> Meteor;  HP < 1/4 max -> Meteor;  HP < 1/6 max -> Ultima
 * ```
 *
 * The weights are drawn as one roll in 24ths (12 / 3 / 3 / 2 / 2 / 2). Each of the three
 * chain turns picks its own target (Split_Infinity: it "can land on one girl or be split").
 *
 * - **Triggers** are strict `<` ("below", the Vegnagun Tail precedent) and fire in their
 *   order, one per turn. A trigger due mid-chain goes first and the chain resumes after it;
 *   the sources do not order the two, `[estimate]`.
 * - **The MP gate** (TR4 = b, `[single source]` + `[conflict]` T-5): Demi needs 10 MP, Flare
 *   54 and Ultima 90 although Spellspring makes the cast itself free; Meteor needs none
 *   `[verified: 4 sources]`. A rolled spell he cannot afford fails and the turn passes; an
 *   Ultima trigger he cannot afford is spent. Neither fallback is in the sources, `[estimate]`.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

const CHAIN_STAGE = 'tremaChain';
const FIRED = 'tremaTriggers';

/** The three HP triggers, in firing order [§4.2]. */
export const TREMA_TRIGGERS = [
  { below: 1 / 2, id: 'trema-meteor' },
  { below: 1 / 4, id: 'trema-meteor' },
  { below: 1 / 6, id: 'trema-ultima' },
] as const;

function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** The MP the AI needs for a spell (the ability's own cost; Spellspring does not waive this check). */
export function tremaCanAfford(ctx: AiContext, id: string): boolean {
  return ctx.self.mp >= (ctx.ability(id)?.mpCost ?? 0);
}

/** Cast `id`, or pass the turn with a line when his MP has been drained below its cost. */
function cast(ctx: AiContext, id: string, targets: string[]): Command | null {
  if (tremaCanAfford(ctx, id)) return use(id, targets);
  const name = ctx.ability(id)?.name ?? id;
  ctx.emit({ type: 'message', text: `Trema lacks the MP for ${name}.`, kind: 'system' });
  return null;
}

/** How many HP triggers have fired so far, 0 to 3. */
export function tremaTriggersFired(unit: AiContext['self']): number {
  return mem(unit, FIRED);
}

export const tremaScript: AiScript = {
  id: 'trema',
  decide(ctx) {
    const self = ctx.self;
    const fired = mem(self, FIRED);
    const due = TREMA_TRIGGERS[fired];
    if (due && self.hp < self.stats.maxHp * due.below) {
      setMem(self, FIRED, fired + 1);
      // `trema-meteor-1`, `trema-meteor-2`, `trema-ultima`: the hooks for TR13's callouts.
      const name = due.id === 'trema-ultima' ? 'trema-ultima' : `trema-meteor-${fired + 1}`;
      ctx.emit({ type: 'script-trigger', name, payload: { who: self.id } });
      return cast(ctx, due.id, []);
    }

    const stage = mem(self, CHAIN_STAGE);
    if (stage === 1) {
      setMem(self, CHAIN_STAGE, 2);
      return use('trema-falling-leaf', randomGirl(ctx));
    }
    if (stage === 2) {
      setMem(self, CHAIN_STAGE, 0);
      return use('trema-thundering-wave', randomGirl(ctx));
    }

    const roll = ctx.rng.int(0, 23); // 24ths: 12 / 3 / 3 / 2 / 2 / 2
    if (roll < 12) {
      setMem(self, CHAIN_STAGE, 1);
      return use('trema-dying-star', randomGirl(ctx));
    }
    if (roll < 15) return cast(ctx, 'trema-demi', []);
    if (roll < 18) return cast(ctx, 'trema-flare', randomGirl(ctx));
    if (roll < 20) return use('trema-choking-mist', randomGirl(ctx));
    if (roll < 22) return use('trema-beguiling-mire', randomGirl(ctx));
    return use('trema-waning-moon', randomGirl(ctx));
  },
};
