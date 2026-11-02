/**
 * Aranea (floor 20, scene `stbv09_228`) and the Black Elemental (floor 40, `stbv09_227`) of the hidden chapter "The Fallen Maesters", NORMAL versions. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll: the scripts `m221` and `m069`** (`research/re-ffx2-fallen-maesters.md` §7.2 and §7.3, the RE session of 2026-10-19, decoded from the shipped sources and
 * checked against the compiled workers), in our own words. A poll is one call of the action entry; both scripts answer every poll with one command.
 *
 * ```
 * Aranea, each poll. The poll counter gains 1 FIRST, then:
 *   counter at least 5:   Gooey End on the whole party; counter := 0          (so polls 5, 10, 15 ...)
 *   otherwise:            random() mod 4 (stream 2): 0 Spider Bite, 1 to 3 Attack,
 *                         on one living girl picked NEAR-WEIGHTED (stream 4)   (Bite 25 percent, Attack 75)
 *
 * Black Elemental, each poll. The turn counter gains 1 FIRST, then:
 *   1  HP below max / 3 (3,333):  random() mod 4: 0 = Absorb on the living girl with the most HP (see below); 1 to 3 go on
 *   2  turn counter at least 3:   counter := 0; Magic Up counter at most 4: it gains 1 and the poll is Magic Up on itself (five casts: polls 3, 6, 9, 12, 15);
 *                                 above 4: the mix
 *   3  otherwise                  the mix
 *   the mix:  random() mod 2:
 *        0:  a living girl WITHOUT Berserk, near-weighted: Berserk on her; none: random() mod 2: 0 Ultima on the party, 1 Flare on a living girl (uniform)
 *        1:  random() mod 3: 0 Ultima on the party, 1 or 2 Flare on a living girl (uniform)
 *   (with a girl lacking Berserk the poll is Berserk 50, Flare 33.3, Ultima 16.7 percent; with every girl Berserk, Ultima 41.7 and Flare 58.3)
 * ```
 *
 * **Absorb's target** is two searches: a first near-weighted `searchr` over the living girls makes its draw and is thrown away (only with two or more girls), then the girls tied for the highest current HP are
 * searched near-weighted. An Absorb poll shifts the Black Elemental's rhythm by one (the turn counter has already gained its 1).
 *
 * **RNG** [RE §7.7]: `random() mod n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates ({@link searchNear}, {@link searchUniform}).
 *
 * **Positions `[inferred]`**: the four floor scenes ship no start positions ([RE §5.1]: the `pos_` entries of `stbv09_225` to `_228` are empty; the default placement of the shared battle map is not read), so the
 * near-weighted search needs a stand-in. {@link MAESTERS_SCENE} is Trema's own scene (`stbv09_229`, the same battle-map family: the boss at (-25, 0), Yuna (30, 0), Rikku (25, 18), Paine (25, -18)), one named
 * constant to replace when the RE session reads the default placement (the sensitivity is the Angra Mainyu note's: a shift of the origin moves a share by points, the facing assumption most). The alternative, a uniform
 * search, is `searchUniform` and a one-line change. The boss faces the middle of the party ({@link searchNear}'s own assumption).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { type Scene, lacking, maxHpDiv, scriptModCtx, searchNear, searchUniform, girls } from './script-rolls.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/fallen-maesters.ts` names the same strings through `src/data/fallen-maesters-ids.ts`, a test pins them). */
export const ARANEA_SCRIPT = 'x2-aranea';
export const BLACK_ELEMENTAL_SCRIPT = 'x2-black-elemental';

/** The ability ids (the data file `fallen-maesters-abilities.ts` owns the rows; a test pins these against it). */
export const MAESTERS_A_ABILITY = {
  araneaAttack: 'x2-aranea-attack',
  spiderBite: 'x2-aranea-spider-bite',
  gooeyEnd: 'x2-aranea-gooey-end',
  absorb: 'x2-black-elemental-absorb',
  ultima: 'x2-black-elemental-ultima',
  flare: 'x2-black-elemental-flare',
  berserk: 'x2-black-elemental-berserk',
  magicUp: 'x2-black-elemental-magic-up',
} as const;

/** AI memory keys. */
export const ARANEA_COUNTER = 'araneaPolls';
export const BLACK_ELEMENTAL_TURNS = 'blackElementalTurns';
export const BLACK_ELEMENTAL_MAGIC_UPS = 'blackElementalMagicUps';

/** Aranea `[RE §7.2]`: Gooey End on every fifth poll; the draw's modulus and the value that is the Bite. */
export const GOOEY_END_AT_POLL = 5;
export const ARANEA_ROLL_MODULUS = 4;
export const ARANEA_ROLL_BITE = 0;
/** The Black Elemental `[RE §7.3]`. */
export const MAGIC_UP_EVERY = 3;
export const MAGIC_UP_LAST_COUNT = 4; // a Magic Up is cast while the counter is at most this, so five are cast
export const ABSORB_BELOW_MAX_DIV = 3; // HP below max / 3
export const ABSORB_ROLL_MODULUS = 4;
export const ABSORB_ROLL = 0;
export const MIX_MODULUS = 2;
export const MIX_BERSERK_BRANCH = 0;
export const MIX_NO_BERSERK_MODULUS = 2;
export const MIX_OTHER_MODULUS = 3;

/**
 * **`[inferred]` The room**: Trema's scene (`stbv09_229`, the same battle-map family as the four floors; [RE §5.1]): the boss at (-25, -0), Yuna (30, 0), Rikku (25, 18), Paine (25, -18). See the header.
 * Shared by the four scripts (`./fallen-maesters-b.ts` imports it).
 */
export const MAESTERS_SCENE: Scene = { boss: { x: -25, z: 0 }, girls: [{ x: 30, z: 0 }, { x: 25, z: 18 }, { x: 25, z: -18 }] };

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Aranea, one poll. */
export const x2AraneaScript: AiScript = {
  id: ARANEA_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // The poll counter gains 1 first; at 5 it is reset and she casts Gooey End on the whole party.
    const counter = mem(self, ARANEA_COUNTER) + 1;
    if (counter >= GOOEY_END_AT_POLL) {
      setMem(self, ARANEA_COUNTER, 0);
      return use(MAESTERS_A_ABILITY.gooeyEnd, []);
    }
    setMem(self, ARANEA_COUNTER, counter);
    const bite = scriptModCtx(ctx, ARANEA_ROLL_MODULUS) === ARANEA_ROLL_BITE;
    const pick = searchNear(ctx.rng, party, MAESTERS_SCENE);
    return use(bite ? MAESTERS_A_ABILITY.spiderBite : MAESTERS_A_ABILITY.araneaAttack, pick ? [pick.id] : []);
  },
};

/** The living girl with the most HP: a first near-weighted search whose pick is thrown away, then the girls tied for the highest HP searched near-weighted. */
function highestHpGirl(ctx: AiContext, party: readonly Ffx2Unit[]): Ffx2Unit | undefined {
  searchNear(ctx.rng, party, MAESTERS_SCENE); // the first search makes its draw and the script discards it
  if (party.length === 0) return undefined;
  const top = Math.max(...party.map((g) => g.hp));
  return searchNear(ctx.rng, party.filter((g) => g.hp === top), MAESTERS_SCENE);
}

/** A living girl for Flare, uniformly. */
function flareOn(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  const pick = searchUniform(ctx.rng, party);
  return use(MAESTERS_A_ABILITY.flare, pick ? [pick.id] : []);
}

/** The Black Elemental's mix (step 4). */
function mix(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  if (scriptModCtx(ctx, MIX_MODULUS) === MIX_BERSERK_BRANCH) {
    const target = searchNear(ctx.rng, lacking(party, 'berserk'), MAESTERS_SCENE);
    if (target) return use(MAESTERS_A_ABILITY.berserk, [target.id]);
    // Every living girl already has Berserk.
    return scriptModCtx(ctx, MIX_NO_BERSERK_MODULUS) === 0 ? use(MAESTERS_A_ABILITY.ultima, []) : flareOn(ctx, party);
  }
  return scriptModCtx(ctx, MIX_OTHER_MODULUS) === 0 ? use(MAESTERS_A_ABILITY.ultima, []) : flareOn(ctx, party);
}

/** The Black Elemental, one poll. */
export const x2BlackElementalScript: AiScript = {
  id: BLACK_ELEMENTAL_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // The turn counter gains 1 first.
    const turns = mem(self, BLACK_ELEMENTAL_TURNS) + 1;
    setMem(self, BLACK_ELEMENTAL_TURNS, turns);
    // 1: below a third of its HP, one poll in four is Absorb on the girl with the most HP.
    if (self.hp < maxHpDiv(self, ABSORB_BELOW_MAX_DIV) && scriptModCtx(ctx, ABSORB_ROLL_MODULUS) === ABSORB_ROLL) {
      const target = highestHpGirl(ctx, party);
      return use(MAESTERS_A_ABILITY.absorb, target ? [target.id] : []);
    }
    // 2: the schedule, every third poll until five Magic Ups are cast.
    if (turns >= MAGIC_UP_EVERY) {
      setMem(self, BLACK_ELEMENTAL_TURNS, 0);
      const casts = mem(self, BLACK_ELEMENTAL_MAGIC_UPS);
      if (casts <= MAGIC_UP_LAST_COUNT) {
        setMem(self, BLACK_ELEMENTAL_MAGIC_UPS, casts + 1);
        return use(MAESTERS_A_ABILITY.magicUp, [self.id]);
      }
    }
    // 3: the mix.
    return mix(ctx, party);
  },
};

/** The two scripts, for the registry (`./index.ts`). */
export const fallenMaestersAScripts: readonly AiScript[] = [x2AraneaScript, x2BlackElementalScript];
