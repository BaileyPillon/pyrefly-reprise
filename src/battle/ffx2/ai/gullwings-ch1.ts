/**
 * Boris (the Floating Ruins' summit, scene `mtgz17_229`), the Flame Dragon (Besaid's cave, `bsil08_229`), the Guardian Beast (the Zanarkand Ruins, `dome08_229`) and YSLS-Zero (Kilika's approach, `klyt01_226`) of the
 * hidden chapter "Gullwings, Chapter 1", NORMAL versions. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll: the scripts `m132`, `m122`, `m162` and `m047`** (`research/re-ffx2-gullwings-chapter1.md` §3 and §5, the research lane of 2026-11-09, read from the shipped plain-text
 * sources, which equal their compiled workers in their queued command ids, their `random() % n` moduli and their scene constants), in our own words. A poll is one call of the action entry; each script answers every poll with
 * one command. None has a reaction entry that matters (the Flame Dragon's records the last hit's type and nothing reads it), an HP phase beyond the two named, or a status test beyond the Guardian Beast's Curse search.
 *
 * ```
 * every boss, first:   while no friendly guest stands with the girls the poll counter gains 1; past the boss's four marks it announces Angry, Furious, About to Blow and This Battle Ends Now (one poll each),
 *                      then Time Up Meteor on everyone every poll (the marks are in ../../../data/gullwings-ch1-ids.ts)
 * Boris:               polls 1 to 3: Spider Attack on a near-weighted living girl;  poll 4: Sticky End on all three, ONCE (a flag, not a loop: the guides say it loops, the compiled worker does not);
 *                      from poll 5, for ever:  random() mod 4 = 0 Spider Bite, else Spider Attack, each on a near-weighted living girl
 * Flame Dragon:        poll 1: Flame Breath on all three;  then, while its own HP is under 100: ONE more Flame Breath (once), then as below;
 *                      otherwise Attack on the living girl with the most current HP
 * Guardian Beast:      a beat counter gains 1 each poll;  HP under a third of its maximum (under 962):  at 4 or more Damocles Photon on all three and the beat resets, else Attack;
 *                      otherwise:  at 4 or more, Curse on a living girl who does not carry it (the beat resets), or an Attack when every girl does (the beat stays at 4 or more); under 4, Attack
 * YSLS-Zero:           one draw random() mod 4:  0 Haymaker on the living girl with the lowest current HP;
 *                      1  a second draw mod 2: 0 Blast Punch on the farthest girl, 1 Haymaker on the girl with the highest current HP;
 *                      2  a living girl is picked, then a third draw mod 3: 0 Blast Punch on the farthest girl, 1 Haymaker on the picked girl, 2 Attack (no cancel) on the picked girl;
 *                      3  Attack (the party-command row) on a living girl
 * ```
 *
 * **RNG** [RE note §1, §3]: `random() % n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates ({@link searchNear}, {@link searchUniform}, {@link extremePick}).
 * Every discarded search still draws (the Flame Dragon's and YSLS-Zero's "most" and "least" HP searches are each a first search over the living whose pick the script throws away, then a search for the extreme).
 *
 * **Positions.** Only Boris's scene ships a start-position file (the girls at (0, -45), (15, -45), (-15, -45), Boris at (0, 25): {@link SCENES} `boris`), so his picks are the game's own near-weighted `searchr`. The other
 * three scenes' files are **empty**, so every near-weighted pick in them is a uniform one here (the note's U2; the Tourist Trap and Leblanc notes do the same), and **YSLS-Zero's "farthest girl" is a uniform pick among the
 * living girls** (no positions, so all three are tied).
 *
 * **Where this file reads the sources, not the note** (said once, pinned by the AI test): the Guardian Beast's Curse target is a `searchr` over the girls without Curse, a random pick among them (the note says "the first
 * living girl"; the search is a draw, as every `searchr` is). The Beast's death row (0x40dc, an animation) and YSLS-Zero's `disable_move` (it stands still) are presentation and are not modelled. The Flame Dragon's Tail Smash
 * (0x40d9) is inside a commented-out block of its source and in no compiled worker: it is not built.
 *
 * **The "battle too long" block** is live in every act (each boss stands in its own scene, whose constant the worker tests), and no play reaches it (Boris acts about every other beat of the girls; the bench pins that the
 * longest fight is far under the first mark). {@link GULLWINGS_TOO_LONG_BLOCK_ON} turns it off in one line.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { SCENES, extremePick, girls, lacking, maxHpDiv, scriptModCtx, searchNear, searchUniform, spendSearchDraw } from './script-rolls.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/gullwings-ch1.ts` names the same strings through `src/data/gullwings-ch1-ids.ts`, a test pins them). */
export const BORIS_SCRIPT = 'x2-boris';
export const FLAME_DRAGON_SCRIPT = 'x2-flame-dragon';
export const GUARDIAN_BEAST_SCRIPT = 'x2-guardian-beast';
export const YSLS_ZERO_SCRIPT = 'x2-ysls-zero';

/** The ability ids (the data file `gullwings-ch1-abilities.ts` owns the rows; `src/battle/**` imports no `src/data/**`, so a test pins these against it). */
export const GULLWINGS_ABILITY = {
  spiderAttack: 'x2-boris-spider-attack',
  stickyEnd: 'x2-boris-sticky-end',
  spiderBite: 'x2-boris-spider-bite',
  flameDragonAttack: 'x2-flame-dragon-attack',
  flameBreath: 'x2-flame-dragon-flame-breath',
  guardianBeastAttack: 'x2-guardian-beast-attack',
  damoclesPhoton: 'x2-guardian-beast-damocles-photon',
  curse: 'x2-guardian-beast-curse',
  yslsAttack: 'x2-ysls-zero-attack',
  yslsAttackNoCancel: 'x2-ysls-zero-attack-no-cancel',
  blastPunch: 'x2-ysls-zero-blast-punch',
  haymaker: 'x2-ysls-zero-haymaker',
  timeUpMeteor: 'x2-gullwings-time-up-meteor',
} as const;

/** The four announcements in the order the scripts show them. */
export const GULLWINGS_ANNOUNCEMENTS: readonly [string, string, string, string] = ['x2-gullwings-angry', 'x2-gullwings-furious', 'x2-gullwings-about-to-blow', 'x2-gullwings-ends-now'];

/** The polls past which each stage of a boss's block shows (`>` each), per boss `[RE note §5]`; the data ids file names the same numbers and a test pins them. */
export const BORIS_TOO_LONG: readonly [number, number, number, number] = [135, 140, 145, 150];
export const FLAME_DRAGON_TOO_LONG: readonly [number, number, number, number] = [140, 150, 155, 160];
export const GUARDIAN_BEAST_TOO_LONG: readonly [number, number, number, number] = [180, 190, 195, 200];
export const YSLS_ZERO_TOO_LONG: readonly [number, number, number, number] = [135, 140, 145, 150];
/** The block is live in each boss's scene; false turns it off. */
export const GULLWINGS_TOO_LONG_BLOCK_ON = true;

/** AI memory keys. */
export const GW_POLLS = 'gwPolls';
export const GW_STAGE = 'gwStage';
export const BORIS_SPIDER_ATTACKS = 'borisSpiderAttacks';
export const BORIS_STICKY_USED = 'borisStickyUsed';
export const DRAGON_BREATH_1 = 'dragonFlame1';
export const DRAGON_BREATH_2 = 'dragonFlame2';
export const BEAST_TURN = 'beastTurn';

/** Boris `[RE note §3.1]`: Spider Attacks before Sticky End, the later draw's modulus and the roll that is the Bite. */
export const BORIS_OPENING_ATTACKS = 3;
export const BORIS_DRAW_MODULUS = 4;
export const BORIS_BITE_ROLL = 0;
/** The Flame Dragon `[RE note §3.2]`: its second Flame Breath comes the first time its own HP is under this. */
export const DRAGON_SECOND_BREATH_BELOW_HP = 100;
/** The Guardian Beast `[RE note §3.3]`: the beat (an Attack three times, then the special) and the fraction of its maximum HP below which the special is Damocles Photon. */
export const BEAST_BEAT = 4;
export const BEAST_PHOTON_BELOW_MAX_HP_DIV = 3;
/** YSLS-Zero `[RE note §3.4]`: the first draw's modulus, and the second and third. */
export const YSLS_FIRST_MODULUS = 4;
export const YSLS_SECOND_MODULUS = 2;
export const YSLS_THIRD_MODULUS = 3;

/** The girls (the party's three ids); any other party unit counts as a friendly guest for the block's counter. */
const GIRL_IDS: ReadonlySet<string> = new Set(['yuna', 'rikku', 'paine']);

/** Boris's room, the Floating Ruins' summit: the game's own start positions (`pos_mtgz17_229.psc`, [RE note §0]). */
export const BORIS_SCENE = SCENES.boris;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** True while a friendly guest stands with the girls (a party unit that is not Yuna, Rikku or Paine): the block's counter does not rise then. */
function guestPresent(ctx: AiContext): boolean {
  return ctx.units.some((u) => u.side === 'party' && !GIRL_IDS.has(u.id));
}

/**
 * The "battle too long" block for this poll: the command it queues, or null when it queues none. Counts the poll, then (in the script's own order) Time Up Meteor once the last stage has shown, else the next stage's announcement
 * when its poll count has been passed. Each announcement is its own poll (nothing else happens on it).
 */
export function tooLong(ctx: AiContext, marks: readonly [number, number, number, number]): Command | null {
  if (!GULLWINGS_TOO_LONG_BLOCK_ON || guestPresent(ctx)) return null;
  const self = ctx.self;
  const polls = mem(self, GW_POLLS) + 1;
  setMem(self, GW_POLLS, polls);
  const stage = mem(self, GW_STAGE);
  const [first, second, third, fourth] = marks;
  if (polls > fourth && stage === 4) return use(GULLWINGS_ABILITY.timeUpMeteor, []);
  if (polls > fourth && stage === 3) {
    setMem(self, GW_STAGE, 4);
    return use(GULLWINGS_ANNOUNCEMENTS[3], []);
  }
  if (polls > third && stage === 2) {
    setMem(self, GW_STAGE, 3);
    return use(GULLWINGS_ANNOUNCEMENTS[2], []);
  }
  if (polls > second && stage === 1) {
    setMem(self, GW_STAGE, 2);
    return use(GULLWINGS_ANNOUNCEMENTS[1], []);
  }
  if (polls > first && stage === 0) {
    setMem(self, GW_STAGE, 1);
    return use(GULLWINGS_ANNOUNCEMENTS[0], []);
  }
  return null;
}

/** A uniform pick of a living girl as a target list (the scenes with no position file): one draw with two or more, none with one. */
function anyGirl(ctx: AiContext, pool: readonly Ffx2Unit[] = girls(ctx)): string[] {
  const pick = searchUniform(ctx.rng, pool);
  return pick === undefined ? [] : [pick.id];
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Boris
// ---------------------------------------------------------------------------------------------------------------------------------

/** Boris, one poll. */
export const x2BorisScript: AiScript = {
  id: BORIS_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, BORIS_TOO_LONG);
    if (escalation !== null) return escalation;
    const target = (): string[] => {
      const pick = searchNear(ctx.rng, party, BORIS_SCENE);
      return pick === undefined ? [] : [pick.id];
    };
    const opening = mem(self, BORIS_SPIDER_ATTACKS);
    if (opening < BORIS_OPENING_ATTACKS) {
      const t = target();
      setMem(self, BORIS_SPIDER_ATTACKS, opening + 1);
      return use(GULLWINGS_ABILITY.spiderAttack, t);
    }
    if (mem(self, BORIS_STICKY_USED) === 0) {
      setMem(self, BORIS_STICKY_USED, 1);
      return use(GULLWINGS_ABILITY.stickyEnd, []);
    }
    const bite = scriptModCtx(ctx, BORIS_DRAW_MODULUS) === BORIS_BITE_ROLL;
    return use(bite ? GULLWINGS_ABILITY.spiderBite : GULLWINGS_ABILITY.spiderAttack, target());
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// The Flame Dragon
// ---------------------------------------------------------------------------------------------------------------------------------

/** The living girl with the most current HP: a first search over the living whose pick is thrown away, then the girls tied for the highest HP searched (uniformly: the scene's position file is empty). */
function healthiestGirl(ctx: AiContext): string[] {
  const pick = extremePick(ctx.rng, girls(ctx), (u) => u.hp, 'max');
  return pick === undefined ? [] : [pick.id];
}

/** The Flame Dragon, one poll. */
export const x2FlameDragonScript: AiScript = {
  id: FLAME_DRAGON_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    if (girls(ctx).length === 0) return null;
    const escalation = tooLong(ctx, FLAME_DRAGON_TOO_LONG);
    if (escalation !== null) return escalation;
    if (mem(self, DRAGON_BREATH_1) === 0) {
      setMem(self, DRAGON_BREATH_1, 1);
      return use(GULLWINGS_ABILITY.flameBreath, []);
    }
    if (self.hp < DRAGON_SECOND_BREATH_BELOW_HP && mem(self, DRAGON_BREATH_2) === 0) {
      setMem(self, DRAGON_BREATH_2, 1);
      return use(GULLWINGS_ABILITY.flameBreath, []);
    }
    return use(GULLWINGS_ABILITY.flameDragonAttack, healthiestGirl(ctx));
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// The Guardian Beast
// ---------------------------------------------------------------------------------------------------------------------------------

/** The Guardian Beast, one poll. */
export const x2GuardianBeastScript: AiScript = {
  id: GUARDIAN_BEAST_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, GUARDIAN_BEAST_TOO_LONG);
    if (escalation !== null) return escalation;
    const turn = mem(self, BEAST_TURN) + 1;
    setMem(self, BEAST_TURN, turn);
    const attack = (): Command => use(GULLWINGS_ABILITY.guardianBeastAttack, anyGirl(ctx, party));
    if (self.hp < maxHpDiv(self, BEAST_PHOTON_BELOW_MAX_HP_DIV)) {
      // Weak: the Curse of the beat becomes Damocles Photon on all three.
      if (turn >= BEAST_BEAT) {
        setMem(self, BEAST_TURN, 0);
        return use(GULLWINGS_ABILITY.damoclesPhoton, []);
      }
      return attack();
    }
    if (turn < BEAST_BEAT) return attack();
    // The beat's special: Curse on a girl who does not carry it; with all three cursed, an Attack and the beat stays at 4 or more.
    const uncursed = lacking(party, 'curse');
    if (uncursed.length === 0) return attack();
    setMem(self, BEAST_TURN, 0);
    return use(GULLWINGS_ABILITY.curse, anyGirl(ctx, uncursed));
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// YSLS-Zero
// ---------------------------------------------------------------------------------------------------------------------------------

/** YSLS-Zero, one poll. */
export const x2YslsZeroScript: AiScript = {
  id: YSLS_ZERO_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, YSLS_ZERO_TOO_LONG);
    if (escalation !== null) return escalation;
    const extreme = (key: 'max' | 'min'): string[] => {
      const pick = extremePick(ctx.rng, party, (u) => u.hp, key);
      return pick === undefined ? [] : [pick.id];
    };
    const first = scriptModCtx(ctx, YSLS_FIRST_MODULUS);
    if (first === 0) return use(GULLWINGS_ABILITY.haymaker, extreme('min'));
    if (first === 1) {
      // A search over the living whose pick is thrown away, then the second draw.
      const second = scriptModCtx(ctx, YSLS_SECOND_MODULUS);
      if (second === 0) {
        spendSearchDraw(ctx.rng, party.length);
        return use(GULLWINGS_ABILITY.blastPunch, anyGirl(ctx, party)); // the farthest girl: all tied in an empty scene
      }
      return use(GULLWINGS_ABILITY.haymaker, extreme('max'));
    }
    if (first === 2) {
      const picked = searchUniform(ctx.rng, party);
      const third = scriptModCtx(ctx, YSLS_THIRD_MODULUS);
      if (third === 0) return use(GULLWINGS_ABILITY.blastPunch, anyGirl(ctx, party)); // the farthest girl, a fresh search
      const targets = picked === undefined ? [] : [picked.id];
      return use(third === 1 ? GULLWINGS_ABILITY.haymaker : GULLWINGS_ABILITY.yslsAttackNoCancel, targets);
    }
    return use(GULLWINGS_ABILITY.yslsAttack, anyGirl(ctx, party));
  },
};

/** The four scripts, for the registry in `./index.ts`. */
export const gullwingsCh1Scripts: readonly AiScript[] = [x2BorisScript, x2FlameDragonScript, x2GuardianBeastScript, x2YslsZeroScript];
