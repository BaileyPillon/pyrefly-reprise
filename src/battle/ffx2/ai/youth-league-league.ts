/**
 * The five League fighter types of the hidden chapter "The Youth League Tournament": the Warrior (`m210`), Veteran (`m211`), Slasher (`m193`), Mage (`m214`) and Master (`m215`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll** (`research/re-ffx2-youth-league-tournament.md` §5.4, read from the shipped plain-text AI sources and checked against the compiled workers). Yaibal, Lucil and
 * Elma are in `./youth-league.ts`. A poll is one call of the action entry; every poll answers with one command. None of the five has a reaction, a menu, a targeted or a death entry.
 *
 * ```
 * Warrior.  An own-side unit below a quarter of its max HP (a search, itself included):
 *             none:  Attack a living girl
 *             one:   this Warrior has been stolen from:  Attack a living girl;   else Hi-Potion on that unit
 * Veteran.  random() mod 5:   0  Critical Attack (always a critical, always hits) on the living girl with the LOWEST HP       1 to 4  Attack a living girl
 * Slasher.  random() mod 6:   0  Flash Bomb on the party (Darkness 50)                                                         1 to 5  Attack a living girl
 * Mage.     MP below 27:  Attack a living girl.   Else random() mod 5:
 *             0:  a girl who is not confused (a search):  Confuse on her;  none:  MP below 36: Attack,  else Demi on the party
 *             1 Fira   2 Watera   3 Blizzara   4 Thundara:   each draws random() mod 2: 0 one uniformly drawn living girl,  1 the whole party
 * Master.   At the start, once: random() mod 4 picks the element of the fight: 0 Thundara, 1 Fira, 2 Watera, 3 Blizzara.
 *           Each poll: MP below 12:  Attack a living girl.   Else random() mod 2: 0 its element on one uniformly drawn girl,  1 on the whole party
 * ```
 *
 * **The "battle too long" block of every League row** (an escalation of warnings and then a fixed 12,750 Self-Destruct Flare) is switched on by the scene it names (`kino01_226`, `kino01_227`, `klyt00_220` to
 * `_225`); none of the seven is one of them, so these scripts have no time-out (RE §7).
 *
 * **RNG** [RE §5]: `random() mod n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates ({@link pickFrom}); the pair "search, then the extreme of that set" draws
 * the first search too ({@link extremeId}). **The Master's element is drawn at its first poll** (the game draws it in the script's init entry, at the start of the battle; the engine has no init hook for a draw, and
 * the one number does not depend on when it is drawn, only which number the stream gives). **Positions `[inferred]`**: no start positions exist (RE §4), so the near-weighted search is the uniform one.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { extremeId, girls, lacking, maxHpDiv, pickFrom, pickId, scriptModCtx } from './script-rolls.ts';
import { YL_ABILITY as A } from '../../../data/ffx2/enemies/youth-league-abilities-base.ts';
import { YL_SCRIPTS } from '../../../data/youth-league-ids.ts';

export const WARRIOR_SCRIPT = YL_SCRIPTS.warrior;
export const VETERAN_SCRIPT = YL_SCRIPTS.veteran;
export const SLASHER_SCRIPT = YL_SCRIPTS.slasher;
export const MAGE_SCRIPT = YL_SCRIPTS.mage;
export const MASTER_SCRIPT = YL_SCRIPTS.master;

/** AI memory key of the Master's element (-1 until drawn). */
export const MASTER_ELEMENT = 'ylMasterElement';

/** The draws' moduli and thresholds [RE §5.4]. */
export const WARRIOR_QUARTER_DIV = 4;
export const VETERAN_MODULUS = 5;
export const SLASHER_MODULUS = 6;
export const MAGE_MP_FLOOR = 27;
export const MAGE_DEMI_MP_FLOOR = 36;
export const MAGE_MODULUS = 5;
export const MASTER_ELEMENT_MODULUS = 4;
export const MASTER_MP_FLOOR = 12;
export const COIN_MODULUS = 2;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Attack a living girl (`searchr(chr_all_ply, stat_alive, nop)`). */
function attackOne(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  return use(A.attack, pickId(ctx.rng, party));
}

/** The monsters on this fighter's own side that are in the fight (itself included). */
function ownSide(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.side === 'enemy' && u.alive && !u.removed);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Warrior, Veteran, Slasher
// ---------------------------------------------------------------------------------------------------------------------------------

/** The Warrior, one poll. */
export const x2WarriorScript: AiScript = {
  id: WARRIOR_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    const hurt = pickFrom(
      ctx.rng,
      ownSide(ctx).filter((u) => u.hp < maxHpDiv(u, WARRIOR_QUARTER_DIV)),
    );
    if (hurt === undefined || ctx.self.stolenFrom === true) return party.length === 0 ? null : attackOne(ctx, party);
    return use(A.hiPotion, [hurt.id]);
  },
};

/** The Veteran, one poll. */
export const x2VeteranScript: AiScript = {
  id: VETERAN_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    if (scriptModCtx(ctx, VETERAN_MODULUS) === 0) return use(A.criticalAttack, extremeId(ctx.rng, party, (g) => g.hp, 'min'));
    return attackOne(ctx, party);
  },
};

/** The Slasher, one poll. */
export const x2SlasherScript: AiScript = {
  id: SLASHER_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    if (scriptModCtx(ctx, SLASHER_MODULUS) === 0) return use(A.flashBomb, []);
    return attackOne(ctx, party);
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Mage and Master
// ---------------------------------------------------------------------------------------------------------------------------------

/** The four spells in the order of the Mage's draw 1 to 4 (Fira, Watera, Blizzara, Thundara), as ability ids: one girl, then the whole party. */
const MAGE_SPELLS: ReadonlyArray<readonly [string, string]> = [
  [A.fira, A.firaParty],
  [A.watera, A.wateraParty],
  [A.blizzara, A.blizzaraParty],
  [A.thundara, A.thundaraParty],
];

/** The Master's four elements by the draw: 0 Thundara, 1 Fira, 2 Watera, 3 Blizzara. */
const MASTER_SPELLS: ReadonlyArray<readonly [string, string]> = [
  [A.thundara, A.thundaraParty],
  [A.fira, A.firaParty],
  [A.watera, A.wateraParty],
  [A.blizzara, A.blizzaraParty],
];

/** `random() mod 2`, then one uniformly drawn girl (`searchr_nop`) or the whole party. */
function coin(ctx: AiContext, party: readonly Ffx2Unit[], pair: readonly [string, string]): Command {
  if (scriptModCtx(ctx, COIN_MODULUS) === 0) {
    const target = pickFrom(ctx.rng, party);
    return use(pair[0], target ? [target.id] : []);
  }
  return use(pair[1], []);
}

/** The Mage, one poll. */
export const x2MageScript: AiScript = {
  id: MAGE_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    if (self.mp < MAGE_MP_FLOOR) return attackOne(ctx, party);
    const roll = scriptModCtx(ctx, MAGE_MODULUS);
    if (roll === 0) {
      const clear = pickFrom(ctx.rng, lacking(party, 'confuse'));
      if (clear !== undefined) return use(A.confuse, [clear.id]);
      return self.mp < MAGE_DEMI_MP_FLOOR ? attackOne(ctx, party) : use(A.demi, []);
    }
    return coin(ctx, party, MAGE_SPELLS[roll - 1]!);
  },
};

/** The Master, one poll. */
export const x2MasterScript: AiScript = {
  id: MASTER_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    let element = mem(self, MASTER_ELEMENT, -1);
    if (element < 0) {
      element = scriptModCtx(ctx, MASTER_ELEMENT_MODULUS);
      setMem(self, MASTER_ELEMENT, element);
    }
    if (self.mp < MASTER_MP_FLOOR) return attackOne(ctx, party);
    return coin(ctx, party, MASTER_SPELLS[element]!);
  },
};

/** The five scripts, for the registry (`./index.ts`). */
export const youthLeagueLeagueScripts: readonly AiScript[] = [x2WarriorScript, x2VeteranScript, x2SlasherScript, x2MageScript, x2MasterScript];
