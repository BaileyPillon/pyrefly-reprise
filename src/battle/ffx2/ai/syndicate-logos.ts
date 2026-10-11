/**
 * Logos in Chateau Leblanc (Chapter VI, Acts II and III) and the two goons of Act I. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI lane C (2026-10-10): the scripts are the game's own** (`m249`, `m250`, `m135`, `m138`, read in
 * `research/re-ffx2-ai-leblanc-den-ixion.md` sections 3.4 and 3.6, rows G1 to G3 and K1 and K2 of section 8). They
 * replace the earlier reconstruction (a three-turn loop of two Double Shots and a Roulette-or-Hail coin flip, labelled
 * AUTHORED because no script was then known). Every pick is a uniform choice among the living girls.
 *
 * Logos, a counter that counts every poll:
 *
 * - **Act II** (`m249`): counter 1 to 3 a **1H Pistol** (our Double Shot, two hits), counter 4 resets the counter and is
 *   **Russian Roulette** on a girl. No Hail of Bullets in this room (his list there does not have it).
 * - **Act III** (`m250`): counter 1 to 5, `random() % 4 = 0` a **Hail of Bullets** on the party (25%), else a Pistol
 *   (75%); counter 6 resets and is Russian Roulette.
 *
 * Russian Roulette is five rows with equal chance (Death 30, Curse 100, Silence 100, Petrify 30, Poison 100; a blank
 * sixth is unreachable and there is no Eject): the pick is the engine's, one draw from the command record's `pickOne`
 * list (`adapt/command.ts`), the script's `random() % 5` in the same order and with the same odds.
 *
 * The goons (Act I): **Dr. Goon** attacks a girl every poll. **Fem-Goon**: `random() % 4 = 0` an Attack on an unpetrified
 * girl; else if her MP is under 13 an Attack; else if all three girls are below half their maximum HP (a fallen girl
 * counts) one single-target spell on the girl with the lowest current HP; else `random() % 2`: 0 one single-target
 * spell on a uniform girl, 1 one party-wide base spell. Overall 25% Attack, 37.5% each. She has no Fan Slap of her own
 * (the Attack is her row 0x4000).
 */

import type { Command } from '../../common/types.ts';
import type { AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { extremeId, girls, pickId, scriptMod } from './script-rolls.ts';

/** Memory key: Logos' counter (`mf_turn`). */
export const LOGOS_TURN = 'logosTurn';

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Act II (`m249`): Pistol, Pistol, Pistol, Russian Roulette. */
export const logosActIIScript: AiScript = {
  id: 'ffx2-leblanc-logos-act2',
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const turn = mem(ctx.self, LOGOS_TURN) + 1;
    if (turn <= 3) {
      setMem(ctx.self, LOGOS_TURN, turn);
      return use('x2-logos-double-shot', pickId(ctx.rng, party));
    }
    setMem(ctx.self, LOGOS_TURN, 0);
    return use('x2-logos-russian-roulette', pickId(ctx.rng, party));
  },
};

/** Act III (`m250`): five turns of 25% Hail of Bullets, else Pistol; then Russian Roulette. */
export const logosScript: AiScript = {
  id: 'ffx2-leblanc-logos',
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const turn = mem(ctx.self, LOGOS_TURN) + 1;
    if (turn <= 5) {
      setMem(ctx.self, LOGOS_TURN, turn);
      if (scriptMod(ctx.rng, 4) === 0) return use('x2-logos-hail-of-bullets', []);
      return use('x2-logos-double-shot', pickId(ctx.rng, party));
    }
    setMem(ctx.self, LOGOS_TURN, 0);
    return use('x2-logos-russian-roulette', pickId(ctx.rng, party));
  },
};

/** Dr. Goon (`m135`): an Attack on a girl, every poll. */
export const drGoonScript: AiScript = {
  id: 'ffx2-leblanc-dr-goon',
  decide(ctx) {
    const party = girls(ctx);
    return party.length === 0 ? null : use('x2-goon-strike', pickId(ctx.rng, party));
  },
};

/** The single-target and party-wide spell the `% 4` of her script picks, in the script's own order. */
const FEM_GOON_SINGLE = ['x2-fem-goon-fira', 'x2-fem-goon-thundara', 'x2-fem-goon-watera', 'x2-fem-goon-blizzara'] as const;
const FEM_GOON_PARTY = ['x2-fem-goon-fire', 'x2-fem-goon-thunder', 'x2-fem-goon-water', 'x2-fem-goon-blizzard'] as const;
/** She Attacks instead of casting under this much MP (`m138.src:85`). */
export const FEM_GOON_ATTACK_BELOW_MP = 13;

/** Fem-Goon (`m138`), the table above. */
export const femGoonScript: AiScript = {
  id: 'ffx2-leblanc-fem-goon',
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    const unpetrified = party.filter((u) => !u.statuses.petrify);
    if (scriptMod(ctx.rng, 4) === 0) return use('x2-leblanc-fan-slap', pickId(ctx.rng, unpetrified));
    if (self.mp < FEM_GOON_ATTACK_BELOW_MP) return use('x2-leblanc-fan-slap', pickId(ctx.rng, unpetrified));
    const all: Ffx2Unit[] = ctx.units.filter((u) => u.side === 'party');
    if (all.length > 0 && all.every((u) => u.hp < Math.floor(u.stats.maxHp / 2))) {
      const weakest = extremeId(ctx.rng, party, (u) => u.hp, 'min'); // the script searches first, then rolls the spell
      return use(FEM_GOON_SINGLE[scriptMod(ctx.rng, 4)]!, weakest);
    }
    if (scriptMod(ctx.rng, 2) === 0) {
      const girl = pickId(ctx.rng, party);
      return use(FEM_GOON_SINGLE[scriptMod(ctx.rng, 4)]!, girl);
    }
    return use(FEM_GOON_PARTY[scriptMod(ctx.rng, 4)]!, []);
  },
};
