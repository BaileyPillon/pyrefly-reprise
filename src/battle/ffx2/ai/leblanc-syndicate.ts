/**
 * The Leblanc Syndicate — Chateau Leblanc, FFX-2 Chapter VI. Leblanc's own script and the registry of the room's scripts.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 * **Re-parity AI lane C (2026-10-10): the scripts are the game's own** (`m253` here; Ormi in `syndicate-ormi.ts`, Logos and
 * the two goons in `syndicate-logos.ts`), read in `research/re-ffx2-ai-leblanc-den-ixion.md` section 3, rows O, L, G and K
 * of section 8. The earlier build followed `research/ffx2-leblanc-syndicate.md` §5.3, §5.4 (a wiki reading of the same
 * script and an AUTHORED Logos); where they differ the script wins, and `docs/handoff/re-parity-ai-ffx2-c.md` lists each
 * difference. What the three facts that decide the fight become:
 *
 * 1. **No Love Lost is not a step of her cycle** (L1). A trio counter (it starts at 5, so her first poll makes it 6) gains 1
 *    each poll. At 8 or more, with Ormi and Logos both alive, she uses it (three commands in one action); the poll after
 *    it, with the counter still at 8 or more and the combo flag set, issues **nothing**, clears the flag and zeroes the
 *    counter (the next poll is the next step), so No Love Lost comes on her 3rd, 11th, 19th ... command. Her five-step
 *    cycle (Attack, spell or Osmose, Love Tap or White Wind, Attack, Mach Fan or a grenade) is never used up by it. With
 *    Ormi or Logos dead the counter stays at 8 or more and it never comes back.
 * 2. **Not-So-Mighty Guard is cast exactly twice** (L2): on her first command and on the 25th poll of the Guard counter
 *    (25 ordinary turns plus the No Love Losts before it), on all monsters; turn 5 of the cycle is a plain Attack.
 * 3. **Killing either henchman ends No Love Lost**; Ormi alone reaches Huggles; Leblanc alone keeps buffing.
 *
 * What stays as it was and why (listed in the handoff): her Attack target, which the game weights by closeness and facing,
 * is a uniform pick (L3, no positions); the combo's window of invincibility for Ormi and Logos, her Agility 254 and the
 * hit-points-to-1 death hooks (L6) need an action that has a length, which the engine's instant actions do not have (the
 * animation length belongs to batch W4), so the clean-up poll is folded into the next poll and nothing is made invincible.
 * `Ffx2EngineOptions.leblancScriptSinirothX` (PR-0106) is no longer read: its OFF reading was the wiki's, and the script
 * is the other one.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { drGoonScript, femGoonScript, logosActIIScript, logosScript } from './syndicate-logos.ts';
import { ormiActIIScript, ormiActIScript, ormiScript } from './syndicate-ormi.ts';
import { girls, pickId, scriptMod } from './script-rolls.ts';

/** The trio counter (`mf_firstAtack`) starts at 5, so her first poll makes it 6. */
const TRIO_START = 5;
/** No Love Lost needs the counter at 8 or more. */
export const NO_LOVE_LOST_AT = 8;
/** The Guard counter reaches this on the poll that casts the second Not-So-Mighty Guard. */
export const SECOND_GUARD_AT = 25;
/** She reaches for Osmose below this much MP (`m253.src:174`). */
export const OSMOSE_BELOW_MP = 15;

/** Memory keys, one per hidden variable of the script. */
export const MEM = { trio: 'trio', combo: 'combo', guard: 'guard', cycle: 'cycle' } as const;

/** Fira, Thundara, Blizzara, Watera: the order her `random() % 4` picks them in. */
const SPELLS = ['x2-leblanc-fira', 'x2-leblanc-thundara', 'x2-leblanc-blizzara', 'x2-leblanc-watera'] as const;

function use(id: string, targets: string[] = []): Command {
  return { kind: 'ability', id, targets };
}

/** The cycle's five steps (`mf_t` 0 to 4), after the trio and Guard branches have passed. */
function cycleStep(ctx: AiContext): Command {
  const self = ctx.self;
  const party = girls(ctx);
  const step = mem(self, MEM.cycle);
  setMem(self, MEM.cycle, (step + 1) % 5);
  switch (step) {
    case 0:
    case 3:
      return use('x2-leblanc-fan-slap', pickId(ctx.rng, party));
    case 1: {
      if (self.mp < OSMOSE_BELOW_MP) return use('x2-leblanc-osmose', pickId(ctx.rng, party));
      const spell = SPELLS[scriptMod(ctx.rng, 4)]!;
      return use(spell, pickId(ctx.rng, party));
    }
    case 2: {
      // A coin picks Ormi or Logos; that one alive gets Love Tap, else White Wind on all monsters.
      const favoured = scriptMod(ctx.rng, 2) === 0 ? 'ormi' : 'logos';
      return ctx.allies().some((u) => u.id === favoured) ? use('x2-leblanc-love-tap', [favoured]) : use('x2-leblanc-white-wind');
    }
    default: {
      const roll = scriptMod(ctx.rng, 5);
      return use(roll === 0 ? 'x2-leblanc-flash-bomb' : roll === 1 ? 'x2-leblanc-hush-grenade' : 'x2-leblanc-mach-fan');
    }
  }
}

export const leblancScript: AiScript = {
  id: 'ffx2-leblanc',
  decide(ctx) {
    const self = ctx.self;
    if (girls(ctx).length === 0) return null;

    let trio = mem(self, MEM.trio, TRIO_START) + 1;
    if (trio >= NO_LOVE_LOST_AT) {
      if (mem(self, MEM.combo) === 1) {
        // The poll after a No Love Lost issues nothing and zeroes the counter; she is polled again at the next step,
        // so it is folded into this call: the counter is 0, and this call is the poll after it.
        setMem(self, MEM.combo, 0);
        trio = 1;
      } else if (['ormi', 'logos'].every((id) => ctx.allies().some((u) => u.id === id))) {
        setMem(self, MEM.trio, trio);
        setMem(self, MEM.combo, 1);
        return use('x2-nll-1');
      }
    }
    setMem(self, MEM.trio, trio);

    // Not-So-Mighty Guard on all monsters: the first command, and the poll on which the Guard counter reaches 25.
    const guard = mem(self, MEM.guard);
    if (guard === 0) {
      setMem(self, MEM.guard, 1);
      return use('x2-leblanc-not-so-mighty-guard');
    }
    if (guard + 1 === SECOND_GUARD_AT) {
      setMem(self, MEM.guard, SECOND_GUARD_AT + 1);
      return use('x2-leblanc-not-so-mighty-guard');
    }
    setMem(self, MEM.guard, guard + 1);
    return cycleStep(ctx);
  },
};

export const leblancSyndicateScripts: readonly AiScript[] = [
  leblancScript,
  logosScript,
  logosActIIScript,
  ormiScript,
  ormiActIScript,
  ormiActIIScript,
  drGoonScript,
  femGoonScript,
];

export { drGoonScript, femGoonScript, logosActIIScript, logosScript, ormiActIIScript, ormiActIScript, ormiScript };

export default leblancSyndicateScripts;
