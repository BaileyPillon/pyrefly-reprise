/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, "Pest Control"; the hidden chapter "Ifrit at Kilika Temple"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own script, `m165`** (`research/re-ffx2-ifrit-kilika.md` §2 and §3: the shipped plain-text AI source, which equals the compiled worker in its queued command ids, its `random() mod 3` and its scene
 * constant, and whose constants 7, 5, 30, 60, 90, 100 and 180/190/195/200 were checked in the worker's disassembly). It is the fallen aeons' action-counter pattern (`research/ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources]`: AC +7 when he
 * acts, +5 when he is hit, Meteor Strike on crossing 30, 60 and 90, Hellfire at 100) with its numbers, and one detail no guide states: **neither Meteor Strike nor Hellfire adds to the gauge**. One gauge and a Meteor count, **no HP
 * phases** (it reads none of his own HP, MP or statuses), and **a "battle too long" block that is live in this scene** (Valefor's is not). Each poll, in this order `[script]`:
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 0 | the poll counter, which counts only while no friendly guest is in the party, passes 200 / 200 / 195 / 190 / 180 | the escalation (below); Time Up Meteor on everyone every poll once the last stage is shown |
 * | 1 | gauge at least 100 | gauge := 0 and Meteors := 0; **Hellfire** on every girl |
 * | 2 | else gauge at least 90 and fewer than 3 Meteors fired | one more Meteor; **Meteor Strike** on the girl farthest from him (no gauge gain) |
 * | 3 | else gauge at least 60 (and under 90) and fewer than 2 fired | the same |
 * | 4 | else gauge at least 30 (and under 60) and none fired | the same |
 * | 5 | else (an ordinary action) gauge + 7, then `random() mod 3` | 0 **Firaga** on every girl; 1 or 2 **Attack** on a near-weighted living girl |
 *
 * **The gauge is read BEFORE the turn's own gain**, and the Meteor and Hellfire turns add nothing, so with nobody hitting him a cycle is **19 actions: 15 ordinary, three Meteors (the 6th, 11th and 16th), the Hellfire (the 19th)**
 * (gauge 35 at the 6th, 63 at the 11th, 91 at the 16th, 105 at the 19th). Every result applied to him (a landing strike, a miss or a no-effect result, never his own) adds 5 through the reaction handler (`resultGauge(5)`; he is
 * immune to every status that would switch the handler off, so its guard only filters his own results), which brings the cycle forward. RNG `[script]`: `random()` on stream 2, **one draw per ordinary action only**; the target searches on
 * stream 4 (a search over fewer than two candidates draws nothing).
 *
 * **Targets, from the Kilika Temple trial's start positions** (`./script-rolls.ts` `SCENES.kilika`, `pos_klyt11_229.psc`; the engine tracks no later movement, as for every other boss that uses `searchr`):
 *
 * - **Attack**: the near-weighted pick of a living girl (`searchNear`): at the start Yuna 41.9 percent, Rikku 29.1, Paine 29.0 (the same positions as Besaid's).
 * - **Meteor Strike**: one search over the living, targetable girls, keeping those at the **greatest 2-D ground distance**: a single farthest girl draws nothing, ties keep every tied girl and the pick among them is near-weighted
 *   (one draw). **The body radii are not read**, so which girls are tied at the start is `[inferred]` (Valefor's disclosure, the same geometry): this engine takes the positions as they are, so **Yuna while she is up** (53.00 against
 *   52.39), and with Yuna down Rikku and Paine (exactly tied).
 * - **Firaga and Hellfire**: the whole party.
 *
 * **The "battle too long" block** [`research/re-ffx2-ifrit-kilika.md` §3]. A counter rises by one each poll, **only while no friendly guest stands with the girls** (the script tests the count of "friend player" characters;
 * none appears in this mission, so the test is modelled as "no party unit other than Yuna, Rikku and Paine", `[estimate]` on the exact test, research U1), and only in this scene (the scene constant matches here, so it is always
 * true). On the poll that takes it past **180** he shows the first announcement, past **190** the second, past **195** the third and past **200** the fourth; then **Time Up Meteor** (power 200, 12 hits, everyone) on every poll.
 * Each announcement is its own poll (nothing else happens on it), so the stages come on polls 181, 191, 196 and 201, and the Meteor on 202 and every one after. At 19 actions a cycle poll 180 is the tenth Hellfire: no play reaches it
 * (the bench pins that), and a test drives the script alone to pin the thresholds. `IFRIT_TOO_LONG_BLOCK_ON` turns it off again.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc, resultGauge } from './fallen-aeons.ts';
import { SCENES, girls, scriptModCtx, searchNear } from './script-rolls.ts';

/** The script id (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/ifrit.ts` names the same string, a test pins it). */
export const IFRIT_SCRIPT = 'x2-ifrit';

/** The ability ids (the data file `ifrit-abilities.ts` owns the rows; `src/battle/**` imports no `src/data/**`, so a test pins these against it). */
export const IFRIT_ABILITY = {
  attack: 'x2-ifrit-attack',
  firaga: 'x2-ifrit-firaga',
  meteorStrike: 'x2-ifrit-meteor-strike',
  hellfire: 'x2-ifrit-hellfire',
  timeUpMeteor: 'x2-ifrit-time-up-meteor',
} as const;

/** The four announcements in the order the script shows them. */
export const IFRIT_ANNOUNCEMENTS: readonly [string, string, string, string] = ['x2-ifrit-angry', 'x2-ifrit-furious', 'x2-ifrit-about-to-blow', 'x2-ifrit-ends-now'];

/** AI memory: Meteor Strikes fired since the last Hellfire (the script's counter: 0 to 3). */
export const IFRIT_METEORS_FIRED = 'ifritMeteors';
/** AI memory: the "battle too long" poll counter (the script's `n_action`) and its stage (the script's `keikoku`: 0 to 4). */
export const IFRIT_POLLS = 'ifritPolls';
export const IFRIT_STAGE = 'ifritStage';

/** The gauge marks `[script]`: the Meteors at 30, 60 and 90, each answering the mark when fewer than 1, 2 and 3 have been fired; Hellfire is {@link AC_OVERDRIVE}. */
export const IFRIT_METEOR_MARKS: readonly [number, number, number] = [30, 60, 90];
/** Meteor Strikes per cycle. */
export const IFRIT_METEORS_PER_CYCLE = 3;
/** The gauge gained by an ordinary action, and per result applied to him `[script]`. */
export const IFRIT_AC_PER_ACTION = 7;
export const IFRIT_AC_PER_RESULT = 5;
/** The modulus of the ordinary draw and the roll value that is Firaga: 1 of 3, so the Attack gets the other 2 of 3 `[script]`. */
export const IFRIT_ORDINARY_MODULUS = 3;
export const IFRIT_FIRAGA_ROLL = 0;
/** The polls past which each stage of the "battle too long" block shows (`>` each, in the order of {@link IFRIT_ANNOUNCEMENTS}), and the poll past which Time Up Meteor repeats `[script]`. */
export const IFRIT_TOO_LONG_POLLS: readonly [number, number, number, number] = [180, 190, 195, 200];
/** The block is live in this scene; false turns it off (the Valefor chapter's route, where the scene constant does not match). */
export const IFRIT_TOO_LONG_BLOCK_ON = true;

/** The girls (the party's three ids); any other party unit counts as a friendly guest for the block's counter. */
const GIRL_IDS: ReadonlySet<string> = new Set(['yuna', 'rikku', 'paine']);

/** Ifrit's room: the boss and the girls' start positions (`pos_klyt11_229.psc`, `[script]`). */
export const IFRIT_SCENE = SCENES.kilika;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** The ground distance from the boss to the girl at party slot `slot`, in the game's units, from the scene's start positions. */
export function groundDistance(slot: number): number {
  const girl = IFRIT_SCENE.girls[slot] ?? IFRIT_SCENE.girls[0];
  return Math.hypot(girl.x - IFRIT_SCENE.boss.x, girl.z - IFRIT_SCENE.boss.z);
}

/**
 * "The character furthest away": the living girl(s) at the greatest ground distance (Yuna at the start); an unambiguous extreme draws nothing, exact ties are near-weighted (`searchNear`),
 * one draw among two or more. `[script]`, from the Kilika scene's own start positions.
 */
export function furthestGirl(ctx: AiContext): string[] {
  const alive = girls(ctx);
  if (alive.length === 0) return [];
  const farthest = Math.max(...alive.map((u) => groundDistance(u.slot)));
  const tied = alive.filter((u) => Math.abs(groundDistance(u.slot) - farthest) < 1e-9);
  const pick = searchNear(ctx.rng, tied, IFRIT_SCENE);
  return pick === undefined ? [] : [pick.id];
}

/** The Attack's target: the near-weighted pick of a living girl (one draw with two or more). `[script]`. */
export function attackTarget(ctx: AiContext): string[] {
  const pick = searchNear(ctx.rng, girls(ctx), IFRIT_SCENE);
  return pick === undefined ? [] : [pick.id];
}

/** True while a friendly guest stands with the girls (a party unit that is not Yuna, Rikku or Paine): the block's counter does not rise then. */
function guestPresent(ctx: AiContext): boolean {
  return ctx.units.some((u) => u.side === 'party' && !GIRL_IDS.has(u.id));
}

/**
 * The "battle too long" block for this poll: the command it queues, or null when it queues none. Counts the poll, then (in the script's own order) Time Up Meteor once the last stage has shown, else the next stage's
 * announcement when its poll count has been passed.
 */
function tooLong(ctx: AiContext): Command | null {
  if (!IFRIT_TOO_LONG_BLOCK_ON || guestPresent(ctx)) return null;
  const self = ctx.self;
  const polls = mem(self, IFRIT_POLLS) + 1;
  setMem(self, IFRIT_POLLS, polls);
  const stage = mem(self, IFRIT_STAGE);
  const [first, second, third, fourth] = IFRIT_TOO_LONG_POLLS;
  if (polls > fourth && stage === 4) return use(IFRIT_ABILITY.timeUpMeteor, []);
  if (polls > fourth && stage === 3) {
    setMem(self, IFRIT_STAGE, 4);
    return use(IFRIT_ANNOUNCEMENTS[3], []);
  }
  if (polls > third && stage === 2) {
    setMem(self, IFRIT_STAGE, 3);
    return use(IFRIT_ANNOUNCEMENTS[2], []);
  }
  if (polls > second && stage === 1) {
    setMem(self, IFRIT_STAGE, 2);
    return use(IFRIT_ANNOUNCEMENTS[1], []);
  }
  if (polls > first && stage === 0) {
    setMem(self, IFRIT_STAGE, 1);
    return use(IFRIT_ANNOUNCEMENTS[0], []);
  }
  return null;
}

export const x2IfritScript: AiScript = {
  id: IFRIT_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    if (girls(ctx).length === 0) return null;
    // 0: the "battle too long" block comes first, before the gauge is read.
    const escalation = tooLong(ctx);
    if (escalation !== null) return escalation;
    // The gauge as it stands: a turn's own gain comes only in the ordinary branch below.
    const gauge = acOf(self);
    const fired = mem(self, IFRIT_METEORS_FIRED);
    // 1: Hellfire resets the gauge and the Meteor count.
    if (gauge >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      setMem(self, IFRIT_METEORS_FIRED, 0);
      return use(IFRIT_ABILITY.hellfire, []);
    }
    // 2 to 4: a Meteor Strike answers the highest mark the gauge has reached while that mark's quota is unmet (90: fewer than 3 fired, 60: fewer than 2, 30: none); a gauge that jumps past two marks gives its Meteors on
    // consecutive polls. Once the band's quota is met the turn is an ordinary one, whatever the lower marks say.
    const band = gauge >= IFRIT_METEOR_MARKS[2] ? 3 : gauge >= IFRIT_METEOR_MARKS[1] ? 2 : gauge >= IFRIT_METEOR_MARKS[0] ? 1 : 0;
    if (band > 0 && fired < band) {
      setMem(self, IFRIT_METEORS_FIRED, fired + 1);
      return use(IFRIT_ABILITY.meteorStrike, furthestGirl(ctx));
    }
    // 5: an ordinary action: the gauge gains 7, then one in three Firaga on every girl, else an Attack on a near-weighted girl.
    bumpAc(self, IFRIT_AC_PER_ACTION);
    if (scriptModCtx(ctx, IFRIT_ORDINARY_MODULUS) === IFRIT_FIRAGA_ROLL) return use(IFRIT_ABILITY.firaga, []);
    return use(IFRIT_ABILITY.attack, attackTarget(ctx));
  },
  ...resultGauge(IFRIT_AC_PER_RESULT),
};

