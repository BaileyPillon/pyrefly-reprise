/**
 * Yaibal, Lucil and Elma of the hidden chapter "The Youth League Tournament" (Mushroom Rock Road; scripts `m183`, `m184` and `m279`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll** (`research/re-ffx2-youth-league-tournament.md` §5.1 to §5.3, read from the shipped plain-text AI sources and checked against the compiled workers by the research
 * lane: the sets of queued command ids and the `random() % n` moduli are equal), in our own words. A poll is one call of the action entry; every poll answers with one command. None of the three scripts has a reaction,
 * a menu, a targeted or a death entry, and none has a time-out block. The five League types' scripts are in `./youth-league-league.ts`.
 *
 * ```
 * Yaibal. Each poll:
 *   Yuna is KO'd:    random() mod 3:   0  Attack a living girl (a search)        1, 2  Phoenix Down on Yuna (a revive: 25 percent of her max HP)
 *   Yuna's HP is below a quarter of her max:  random() mod 3:
 *        0:  Attack Paine if she is alive, else Attack Rikku if she is alive, else Hi-Potion on Yuna (a fixed 1,000)      1, 2:  Hi-Potion on Yuna
 *   else:   random() mod 4:   0  the "Sorry" grenade on the party (468 to 529 a girl)     1, 2, 3  Attack a living girl
 *
 * Lucil (counters "turn", "potion", and one flag a Gem and for the Hourglass). Each poll, turn := turn + 1:
 *   turn is 5 or more:  turn := 0;  a girl who does not carry Doom (a search): Harbinger on her; none: Attack a living girl
 *   else, in this order, the first that fires ends the poll (a test whose condition holds draws one random() mod 8, a one-in-eight chance):
 *        HP below a quarter:  potion := potion + 1;  below 3: Hi-Potion on herself (so twice a fight at most; no draw)
 *        no Shell:  Lunar Curtain                    no Protect:  Light Curtain
 *        Fire Gem (once), Ice Gem (once), Lightning Gem (once), Water Gem (once)          Gold Hourglass (once)
 *        else Attack a living girl
 *
 * Elma (flag "guard" = 0 at the start). Each poll:
 *   guard is 0:  guard := 1;  Not-So-Mighty Guard on her whole side (herself and both Veterans)
 *   else:  a girl who has no Reflect (a search):
 *        none:  random() mod 3:  0 Attack a living girl     1, 2  Dispel on a living girl (a uniform search)
 *        else:  random() mod 11:  0 Fira  1 Blizzara  2 Thundara  3 Watera  (each on that girl)     4 Flash Bomb on the party     5 Confuse on that girl
 *               6 Hush Grenade on the party     7 Sleep on that girl     8 Osmose on the girl with the most MP     9, 10  Attack a living girl
 * ```
 *
 * **RNG** [RE §5]: `random() mod n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates ({@link pickFrom}); a test that does not hold draws nothing (the Maesters'
 * conditional-draw rule). **Positions `[inferred]`**: the seven scenes ship no start positions (RE §4), so the near-weighted search (`searchr`) is the uniform one here, as in the Tourist Trap and Leblanc scripts.
 * **Yaibal's care for Yuna** is read from the script alone (no guide mentions it); the chapter plays it as written (pick YL6: no fairness tweak).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { extremeId, girls, lacking, maxHpDiv, pickFrom, pickId, scriptModCtx } from './script-rolls.ts';
import { YL_ABILITY as A } from '../../../data/ffx2/enemies/youth-league-abilities-base.ts';
import { YL_SCRIPTS } from '../../../data/youth-league-ids.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/youth-league.ts` names the same strings through `src/data/youth-league-ids.ts`, a test pins them). */
export const YAIBAL_SCRIPT = YL_SCRIPTS.yaibal;
export const LUCIL_SCRIPT = YL_SCRIPTS.lucil;
export const ELMA_SCRIPT = YL_SCRIPTS.elma;

/** AI memory keys. */
export const LUCIL_TURN = 'ylLucilTurn';
export const LUCIL_POTION = 'ylLucilPotion';
export const LUCIL_FIRE = 'ylLucilFire';
export const LUCIL_COLD = 'ylLucilCold';
export const LUCIL_THUNDER = 'ylLucilThunder';
export const LUCIL_WATER = 'ylLucilWater';
export const LUCIL_SLOW = 'ylLucilSlow';
export const ELMA_GUARD = 'ylElmaGuard';

/** Yaibal [RE §5.1]: Yuna's quarter, the three draws' moduli. */
export const YAIBAL_YUNA_LOW_DIV = 4;
export const YAIBAL_DOWN_MODULUS = 3;
export const YAIBAL_LOW_MODULUS = 3;
export const YAIBAL_FULL_MODULUS = 4;
/** Lucil [RE §5.2]: the fifth poll, her quarter, the two potions, the one-in-eight tests. */
export const LUCIL_HARBINGER_AT = 5;
export const LUCIL_LOW_DIV = 4;
export const LUCIL_POTION_LIMIT = 3; // the counter reaching 3 stops the potions: two a fight
export const LUCIL_TEST_MODULUS = 8;
/** Elma [RE §5.3]: the two draws' moduli. */
export const ELMA_NONE_MODULUS = 3;
export const ELMA_MODULUS = 11;

/** The girls' ids (the party of the chapter; a test pins them). */
const YUNA = 'yuna';
const RIKKU = 'rikku';
const PAINE = 'paine';

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Attack a living girl (`searchr(chr_all_ply, stat_alive, nop)`: the uniform pick, no draw below two). */
function attackOne(ctx: AiContext, party: readonly Ffx2Unit[], id: string): Command {
  return use(id, pickId(ctx.rng, party));
}

/** The girl as the engine holds her, whatever her state. */
function girl(ctx: AiContext, id: string): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === id);
}

/** `getstat(chr_yuna, stat_death)`: she is down (a KO, not an Eject: an ejected girl is out of the fight but not dead). */
function isDown(unit: Ffx2Unit | undefined): boolean {
  return unit !== undefined && !unit.alive && unit.statuses['eject'] === undefined && !unit.removed;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Yaibal
// ---------------------------------------------------------------------------------------------------------------------------------

/** Yaibal, one poll. */
export const x2YaibalScript: AiScript = {
  id: YAIBAL_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    const yuna = girl(ctx, YUNA);
    if (isDown(yuna)) {
      if (scriptModCtx(ctx, YAIBAL_DOWN_MODULUS) === 0) return party.length === 0 ? null : attackOne(ctx, party, A.attack);
      return use(A.phoenixDown, [YUNA]);
    }
    if (yuna !== undefined && yuna.alive && yuna.hp < maxHpDiv(yuna, YAIBAL_YUNA_LOW_DIV)) {
      if (scriptModCtx(ctx, YAIBAL_LOW_MODULUS) === 0) {
        const paine = girl(ctx, PAINE);
        if (paine?.alive === true) return use(A.attack, [PAINE]);
        const rikku = girl(ctx, RIKKU);
        if (rikku?.alive === true) return use(A.attack, [RIKKU]);
      }
      return use(A.yaibalHiPotion, [YUNA]);
    }
    if (party.length === 0) return null;
    if (scriptModCtx(ctx, YAIBAL_FULL_MODULUS) === 0) return use(A.sorry, []);
    return attackOne(ctx, party, A.attack);
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Lucil
// ---------------------------------------------------------------------------------------------------------------------------------

/** One of the script's one-in-eight tests: the draw is made only when the test's own condition holds. */
function oneInEight(ctx: AiContext): boolean {
  return scriptModCtx(ctx, LUCIL_TEST_MODULUS) === 0;
}

/** Lucil, one poll. */
export const x2LucilScript: AiScript = {
  id: LUCIL_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const turn = mem(self, LUCIL_TURN) + 1;
    if (turn >= LUCIL_HARBINGER_AT) {
      setMem(self, LUCIL_TURN, 0);
      const bare = lacking(party, 'doom');
      if (bare.length === 0) return attackOne(ctx, party, A.lucilAttack);
      return use(A.harbinger, pickId(ctx.rng, bare));
    }
    setMem(self, LUCIL_TURN, turn);
    if (self.hp < maxHpDiv(self, LUCIL_LOW_DIV)) {
      const potions = mem(self, LUCIL_POTION) + 1;
      setMem(self, LUCIL_POTION, potions);
      if (potions < LUCIL_POTION_LIMIT) return use(A.lucilHiPotion, [self.id]);
    }
    if (self.statuses['shell'] === undefined && oneInEight(ctx)) return use(A.lunarCurtain, [self.id]);
    if (self.statuses['protect'] === undefined && oneInEight(ctx)) return use(A.lightCurtain, [self.id]);
    const once: ReadonlyArray<readonly [string, string]> = [
      [LUCIL_FIRE, A.fireGem],
      [LUCIL_COLD, A.iceGem],
      [LUCIL_THUNDER, A.lightningGem],
      [LUCIL_WATER, A.waterGem],
      [LUCIL_SLOW, A.goldHourglass],
    ];
    for (const [flag, id] of once) {
      if (mem(self, flag) === 0 && oneInEight(ctx)) {
        setMem(self, flag, 1);
        return use(id, []);
      }
    }
    return attackOne(ctx, party, A.lucilAttack);
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Elma
// ---------------------------------------------------------------------------------------------------------------------------------

/** Elma, one poll. */
export const x2ElmaScript: AiScript = {
  id: ELMA_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    if (mem(self, ELMA_GUARD) === 0) {
      setMem(self, ELMA_GUARD, 1);
      return use(A.guard, []);
    }
    const bare = lacking(party, 'reflect');
    const mark = pickFrom(ctx.rng, bare);
    if (mark === undefined) {
      if (scriptModCtx(ctx, ELMA_NONE_MODULUS) === 0) return attackOne(ctx, party, A.elmaAttack);
      const target = pickFrom(ctx.rng, party);
      return use(A.dispel, target ? [target.id] : []);
    }
    switch (scriptModCtx(ctx, ELMA_MODULUS)) {
      case 0:
        return use(A.fira, [mark.id]);
      case 1:
        return use(A.blizzara, [mark.id]);
      case 2:
        return use(A.thundara, [mark.id]);
      case 3:
        return use(A.watera, [mark.id]);
      case 4:
        return use(A.flashBomb, []);
      case 5:
        return use(A.confuse, [mark.id]);
      case 6:
        return use(A.hushGrenade, []);
      case 7:
        return use(A.sleep, [mark.id]);
      case 8:
        return use(A.osmose, extremeId(ctx.rng, party, (g) => g.mp, 'max'));
      default:
        return attackOne(ctx, party, A.elmaAttack);
    }
  },
};

/** The three scripts, for the registry (`./index.ts`). */
export const youthLeagueNamedScripts: readonly AiScript[] = [x2YaibalScript, x2LucilScript, x2ElmaScript];
