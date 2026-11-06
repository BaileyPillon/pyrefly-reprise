/**
 * Auron, Tidus and Seymour of the hidden chapter "The Farplane Cup" (the Fiend Arena's fighters, scripts `m311`, `m317` and `m319`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll** (`research/re-ffx2-farplane-cup.md` §6.2 to §6.4, decoded from the shipped sources and checked against the compiled workers by the research lane: the sets of queued
 * command ids and the `random() % n` moduli are equal), in our own words. A poll is one call of the action entry; every poll answers with one command. None of the three scripts has a reaction, a menu, a targeted or a
 * death entry, and none has a time-out block.
 *
 * ```
 * Auron (counter "potion" = 0 at the start). Each poll:
 *   HP below max / 8 and the counter is 0:  X-Potion on himself (it heals at most 9,999); counter := 1                      (once a fight)
 *   else HP below max / 4:  random() mod 8:
 *        0:       Shooting Star on the first of Yuna, Rikku, Paine who is alive and whose Death resist byte is not 0;
 *                 if none passes: Shin Zantetsu on the whole party
 *        1, 5:    Mega-Potion on his own side
 *        2:       Shooting Star on a near-weighted living girl         3: Full Break on one          4: Dragon Fang on the party
 *        6, 7:    Attack on one
 *   else:  random() mod 6:  0 Shooting Star on one, 1 Dragon Fang on the party, 2 Full Break on one, 3 to 5 Attack on one
 *
 * Tidus (counter "count" = 0 at the start). Each poll:
 *   count is 0:  Blitz Ace on a near-weighted living girl; count := 1
 *   else, someone on his side lacks Haste (it is only him):   one with Reflect: Dispel Tonic on it (his record forbids Reflect); none: Hastega on his side
 *   else (he is hasted):  random() mod 4:
 *        0:  HP below max / 3: Mega-Potion (count + 1);   else Attack on one
 *        1:  HP below max / 3: Mega-Potion (count + 1);   else Spiral Cut on one (count + 1)
 *        2:  count above 4: Blitz Ace on one, count := 0; else Delay Buster on one (count + 1)
 *        3:  HP below max / 10: Hero Drink on himself (count + 1);   else Attack on one
 *
 * Seymour. Each poll, random() mod 8:
 *   0  Demi on the party
 *   1  HP below max / 2:  Curaga on himself (Dispel on himself instead if he has Reflect);   else Critical Attack on one
 *   2  HP below max / 2:  Drain Attack on one;   else Black Sky on the party
 *   3  HP below max / 2:  Absorb on one;   else Meteor on the party
 *   4  no Shell: Shell on himself (Dispel if Reflect);  no Protect: Protect (Dispel if Reflect);  else Break on one girl (pick DU10)
 *   5  Magic Up on himself until it has been cast 5 times, then Strength Up until 5 times, then Confuse on the party
 *   6  HP below max / 2:  Drain Attack on one;   else Slowga on the party
 *   7  HP below max / 4:  Ultima on the party;   else Dispel on the party
 * ```
 *
 * **The targets of the three rows the game aims at the party GROUP although their rows are single-target** (Dispel, Confuse and Break; RE §6.4, `[I]`): Dispel and Confuse go to the whole party (the abilities are
 * `all-enemies`, as the Oversoul Paragon's Dispel is), Break to ONE girl picked uniformly (its row is single-target and the research note says "the engine picks one"). Pick DU10, the driver's, his to overturn; the
 * alternative is all three fanned out to the party, a change to the `targeting` of one ability. **Death resist** (Auron's Shooting Star gate): the game's `stat_def_death` is read as the girl's Death resist byte (`[I]`, RE §6.2:
 * "unmapped whether non-zero means has any Death resistance or is not immune"), so Shooting Star (an Eject, the answer to a girl Death cannot touch) goes to the first Death-resistant girl and Shin Zantetsu (a Death at 80) to
 * the party when none resists. **Tidus's side**: his weapon prop (row 318) is visual and has no place in the formation, so "a monster on his side without Haste" is him alone.
 *
 * **RNG** [RE §6.1]: `random() mod n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates ({@link searchNear}, {@link searchUniform}).
 * **Positions `[inferred]`**: the cup has no formation row and so no start positions (RE §5), so the near-weighted search needs a stand-in: {@link CUP_SCENE} is Trema's own scene (`stbv09_229`, the same battle-map family:
 * the foe at (-25, 0), Yuna (30, 0), Rikku (25, 18), Paine (25, -18)), as the Fallen Maesters use it; one named constant to replace when the cup's real map is read. The alternative is a uniform search (`searchUniform`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { type Scene, girls, lacking, maxHpDiv, scriptModCtx, searchNear, searchUniform } from './script-rolls.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/farplane-cup.ts` names the same strings through `src/data/farplane-cup-ids.ts`, a test pins them). */
export const CUP_AURON_SCRIPT = 'x2-cup-auron';
export const CUP_TIDUS_SCRIPT = 'x2-cup-tidus';
export const CUP_SEYMOUR_SCRIPT = 'x2-cup-seymour';

/** The ability ids (the data file `farplane-cup-abilities.ts` owns the rows; a test pins these against it). */
export const CUP_MOVE = {
  auronAttack: 'x2-auron-attack',
  shootingStar: 'x2-auron-shooting-star',
  dragonFang: 'x2-auron-dragon-fang',
  fullBreak: 'x2-auron-full-break',
  shinZantetsu: 'x2-auron-shin-zantetsu',
  auronMegaPotion: 'x2-auron-mega-potion',
  auronXPotion: 'x2-auron-x-potion',
  tidusAttack: 'x2-tidus-attack',
  blitzAce: 'x2-tidus-blitz-ace',
  spiralCut: 'x2-tidus-spiral-cut',
  delayBuster: 'x2-tidus-delay-buster',
  hastega: 'x2-tidus-hastega',
  tidusMegaPotion: 'x2-tidus-mega-potion',
  heroDrink: 'x2-tidus-hero-drink',
  dispelTonic: 'x2-tidus-dispel-tonic',
  seymourAttack: 'x2-seymour-attack',
  demi: 'x2-seymour-demi',
  curaga: 'x2-seymour-curaga',
  dispel: 'x2-seymour-dispel',
  dispelSelf: 'x2-seymour-dispel-self',
  criticalAttack: 'x2-seymour-critical-attack',
  drainAttack: 'x2-seymour-drain-attack',
  blackSky: 'x2-seymour-black-sky',
  absorb: 'x2-seymour-absorb',
  meteor: 'x2-seymour-meteor',
  shell: 'x2-seymour-shell',
  protect: 'x2-seymour-protect',
  break: 'x2-seymour-break',
  magicUp: 'x2-seymour-magic-up',
  strengthUp: 'x2-seymour-strength-up',
  confuse: 'x2-seymour-confuse',
  slowga: 'x2-seymour-slowga',
  ultima: 'x2-seymour-ultima',
} as const;

/** AI memory keys. */
export const AURON_POTION = 'cupAuronPotion';
export const TIDUS_COUNT = 'cupTidusCount';
export const SEYMOUR_MAGIC_UPS = 'cupSeymourMagicUps';
export const SEYMOUR_STRENGTH_UPS = 'cupSeymourStrengthUps';

/** Auron [RE §6.2]: the X-Potion below an eighth (once), the low band below a quarter, the draws' moduli. */
export const AURON_POTION_BELOW_DIV = 8;
export const AURON_LOW_BELOW_DIV = 4;
export const AURON_LOW_MODULUS = 8;
export const AURON_HIGH_MODULUS = 6;
/** Tidus [RE §6.3]: the heal band (below a third), the Hero Drink band (below a tenth), the draw's modulus and the count Blitz Ace waits for. */
export const TIDUS_HEAL_BELOW_DIV = 3;
export const TIDUS_DRINK_BELOW_DIV = 10;
export const TIDUS_MODULUS = 4;
export const TIDUS_BLITZ_AFTER = 4; // the count must be ABOVE this
/** Seymour [RE §6.4]: the draw's modulus, the half and quarter bands, and the casts of each Up. */
export const SEYMOUR_MODULUS = 8;
export const SEYMOUR_HALF_DIV = 2;
export const SEYMOUR_QUARTER_DIV = 4;
export const SEYMOUR_UPS = 5;

/**
 * **`[inferred]` The room**: Trema's scene (`stbv09_229`, the same battle-map family as the Fiend Arena's neighbours; the cup has no positions of its own, RE §5): the foe at (-25, 0), Yuna (30, 0), Rikku (25, 18), Paine
 * (25, -18). See the header.
 */
export const CUP_SCENE: Scene = { boss: { x: -25, z: 0 }, girls: [{ x: 30, z: 0 }, { x: 25, z: 18 }, { x: 25, z: -18 }] };

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** A command at the near-weighted pick of a living girl (`searchr(chr_all_ply, stat_alive, nop)`). */
function onOne(ctx: AiContext, party: readonly Ffx2Unit[], id: string): Command {
  const pick = searchNear(ctx.rng, party, CUP_SCENE);
  return use(id, pick ? [pick.id] : []);
}

/** The monsters on the duelist's own side that are in the fight (the duelist alone: the weapon props are visual). */
function ownSide(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.side === 'enemy' && u.alive && !u.removed);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Auron
// ---------------------------------------------------------------------------------------------------------------------------------

/** The first of the girls, in the order Yuna, Rikku, Paine, who is alive and has a Death resist byte (`stat_def_death != 0`), or `undefined`. */
function deathResistant(party: readonly Ffx2Unit[]): Ffx2Unit | undefined {
  return party.find((g) => ((g.immunities['ko'] ?? 0) & 0xff) !== 0);
}

/** Auron, one poll. */
export const x2CupAuronScript: AiScript = {
  id: CUP_AURON_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // 1: below an eighth of his HP, once: an X-Potion on himself.
    if (self.hp < maxHpDiv(self, AURON_POTION_BELOW_DIV) && mem(self, AURON_POTION) === 0) {
      setMem(self, AURON_POTION, 1);
      return use(CUP_MOVE.auronXPotion, [self.id]);
    }
    // 2: below a quarter: the widened draw.
    if (self.hp < maxHpDiv(self, AURON_LOW_BELOW_DIV)) {
      switch (scriptModCtx(ctx, AURON_LOW_MODULUS)) {
        case 0: {
          const resistant = deathResistant(party);
          return resistant ? use(CUP_MOVE.shootingStar, [resistant.id]) : use(CUP_MOVE.shinZantetsu, []);
        }
        case 1:
        case 5:
          return use(CUP_MOVE.auronMegaPotion, []);
        case 2:
          return onOne(ctx, party, CUP_MOVE.shootingStar);
        case 3:
          return onOne(ctx, party, CUP_MOVE.fullBreak);
        case 4:
          return use(CUP_MOVE.dragonFang, []);
        default:
          return onOne(ctx, party, CUP_MOVE.auronAttack);
      }
    }
    // 3: a quarter or more.
    switch (scriptModCtx(ctx, AURON_HIGH_MODULUS)) {
      case 0:
        return onOne(ctx, party, CUP_MOVE.shootingStar);
      case 1:
        return use(CUP_MOVE.dragonFang, []);
      case 2:
        return onOne(ctx, party, CUP_MOVE.fullBreak);
      default:
        return onOne(ctx, party, CUP_MOVE.auronAttack);
    }
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Tidus
// ---------------------------------------------------------------------------------------------------------------------------------

/** Tidus, one poll. */
export const x2CupTidusScript: AiScript = {
  id: CUP_TIDUS_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const count = mem(self, TIDUS_COUNT);
    // The opening: Blitz Ace on a near-weighted girl, the count becomes 1.
    if (count === 0) {
      setMem(self, TIDUS_COUNT, 1);
      return onOne(ctx, party, CUP_MOVE.blitzAce);
    }
    // Someone on his side lacks Haste: re-haste (or strip a Reflect he cannot have).
    const side = ownSide(ctx);
    if (lacking(side, 'haste').length > 0) {
      const reflected = side.find((u) => u.statuses['reflect'] !== undefined);
      return reflected ? use(CUP_MOVE.dispelTonic, [reflected.id]) : use(CUP_MOVE.hastega, []);
    }
    // Hasted: the four-way draw.
    const low = self.hp < maxHpDiv(self, TIDUS_HEAL_BELOW_DIV);
    switch (scriptModCtx(ctx, TIDUS_MODULUS)) {
      case 0:
        if (low) {
          setMem(self, TIDUS_COUNT, count + 1);
          return use(CUP_MOVE.tidusMegaPotion, []);
        }
        return onOne(ctx, party, CUP_MOVE.tidusAttack);
      case 1:
        if (low) {
          setMem(self, TIDUS_COUNT, count + 1);
          return use(CUP_MOVE.tidusMegaPotion, []);
        }
        setMem(self, TIDUS_COUNT, count + 1);
        return onOne(ctx, party, CUP_MOVE.spiralCut);
      case 2:
        if (count > TIDUS_BLITZ_AFTER) {
          setMem(self, TIDUS_COUNT, 0);
          return onOne(ctx, party, CUP_MOVE.blitzAce);
        }
        setMem(self, TIDUS_COUNT, count + 1);
        return onOne(ctx, party, CUP_MOVE.delayBuster);
      default:
        if (self.hp < maxHpDiv(self, TIDUS_DRINK_BELOW_DIV)) {
          setMem(self, TIDUS_COUNT, count + 1);
          return use(CUP_MOVE.heroDrink, [self.id]);
        }
        return onOne(ctx, party, CUP_MOVE.tidusAttack);
    }
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Seymour
// ---------------------------------------------------------------------------------------------------------------------------------

/** Seymour, one poll. */
export const x2CupSeymourScript: AiScript = {
  id: CUP_SEYMOUR_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const halfDown = self.hp < maxHpDiv(self, SEYMOUR_HALF_DIV);
    const reflected = self.statuses['reflect'] !== undefined;
    switch (scriptModCtx(ctx, SEYMOUR_MODULUS)) {
      case 0:
        return use(CUP_MOVE.demi, []);
      case 1:
        if (halfDown) return reflected ? use(CUP_MOVE.dispelSelf, [self.id]) : use(CUP_MOVE.curaga, [self.id]);
        return onOne(ctx, party, CUP_MOVE.criticalAttack);
      case 2:
        return halfDown ? onOne(ctx, party, CUP_MOVE.drainAttack) : use(CUP_MOVE.blackSky, []);
      case 3:
        return halfDown ? onOne(ctx, party, CUP_MOVE.absorb) : use(CUP_MOVE.meteor, []);
      case 4:
        if (self.statuses['shell'] === undefined) return reflected ? use(CUP_MOVE.dispelSelf, [self.id]) : use(CUP_MOVE.shell, [self.id]);
        if (self.statuses['protect'] === undefined) return reflected ? use(CUP_MOVE.dispelSelf, [self.id]) : use(CUP_MOVE.protect, [self.id]);
        {
          const pick = searchUniform(ctx.rng, party); // pick DU10: the single-target Break goes to one girl
          return use(CUP_MOVE.break, pick ? [pick.id] : []);
        }
      case 5: {
        // The names are crossed in the source: the counter tested before Magic Up is the first one.
        const magic = mem(self, SEYMOUR_MAGIC_UPS);
        if (magic < SEYMOUR_UPS) {
          setMem(self, SEYMOUR_MAGIC_UPS, magic + 1);
          return use(CUP_MOVE.magicUp, [self.id]);
        }
        const strength = mem(self, SEYMOUR_STRENGTH_UPS);
        if (strength < SEYMOUR_UPS) {
          setMem(self, SEYMOUR_STRENGTH_UPS, strength + 1);
          return use(CUP_MOVE.strengthUp, [self.id]);
        }
        return use(CUP_MOVE.confuse, []);
      }
      case 6:
        return halfDown ? onOne(ctx, party, CUP_MOVE.drainAttack) : use(CUP_MOVE.slowga, []);
      default:
        return self.hp < maxHpDiv(self, SEYMOUR_QUARTER_DIV) ? use(CUP_MOVE.ultima, []) : use(CUP_MOVE.dispel, []);
    }
  },
};

/** The three scripts, for the registry (`./index.ts`). */
export const farplaneCupScripts: readonly AiScript[] = [x2CupAuronScript, x2CupTidusScript, x2CupSeymourScript];
