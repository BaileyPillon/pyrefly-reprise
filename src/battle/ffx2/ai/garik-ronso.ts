/**
 * Garik Ronso and the Ronso Youths at the top of Mt. Gagazet (FFX-2 Chapter 3, the mission "Battle Blockade"; the hidden chapter "Garik Ronso"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The scripts are the game's own** (`m182` and `m181`, `research/re-ffx2-garik-ronso.md` section 2: the shipped plain-text AI sources, which equal the compiled workers in their queued command ids, their `random() % n`
 * moduli and their two scene constants). Both read the scene: the same two monsters act one way in the hostile fight (`mtgz10_228`) and another in the friendly bout (`mtgz10_229`). **This build has four scripts, one per
 * monster and scene** (the engine's AI context carries no scene flag; each group's enemies name their script): the data picks the script and the script is the game's branch for that scene. A poll is one call of the action entry;
 * `random() % n` is stream 2, a target search stream 4 (nothing is drawn below two candidates); the scenes ship no start positions, so the near-weighted `searchr` is the uniform pick, as in every other script of this kind.
 *
 * - **Garik, hostile** [m182.src, scene 228]: each poll first counts the poll for the "battle too long" block (below), then raises his turn counter (it starts at **0**; Bane Lance polls count too) and tests, in this order:
 *   1. **Bane Lance** on the first of Yuna, Rikku and Paine, in that order, **whose current dressphere is Black Mage and who does not already carry Curse**;
 *   2. else, with the counter at **7 or more**: counter 0 and **Mighty Guard on every monster** (Garik and both Youths);
 *   3. else a draw `random() % 4`: **0** is **Blind** on a girl without Darkness (if every living girl is already dark, a plain **Attack** on a living girl); **1 to 3** are a plain **Attack** on a living girl.
 *   So at rest he attacks three polls in four and blinds one in four until every girl is dark, guards on his 7th, 14th and 21st poll, and curses a Black Mage the moment one is without Curse. (Curse in FFX-2 is "cannot change
 *   dressphere"; a cursed Black Mage stays one.)
 * - **Garik, friendly** [m182.src, scene 229]: his counter starts at **3**; each poll: counter + 1, then **8 or more: counter 0 and Shell on himself**; **exactly 4: Protect on himself**; else a plain **Attack** on a living girl.
 *   The cycle is eight polls: **Protect, Attack x3, Shell, Attack x3**, from his first poll. No Bane Lance, no Blind, no Mighty Guard, no draw.
 * - **The Ronso Youth, hostile** [m181.src, scene 228]: a draw `random() % 8`: **0** is **MP Blowout** on the girl with the most MP (the script's group "own target" is unmapped, research U3: read as every living girl, the
 *   one with the greatest MP, ties broken by a search), else a plain **Attack** on a living girl. **Friendly**: **Attack** only.
 *
 * **The "battle too long" block** [both scripts, no friendly guest]. A counter rises by one each poll, **only while no friendly guest stands with the girls** (the script tests the count of "friend player" characters; none appears
 * in this mission, so the test is modelled as "no party unit other than Yuna, Rikku and Paine", `[estimate]` on the exact test, research U4). On the poll that takes it past **180** (Garik) or **140** (a Youth) he shows the
 * first announcement, past **190** / **150** the second, past **195** / **155** the third and past **200** / **160** the fourth; then **Time Up Meteor** (power 200, 12 hits, everyone) on every poll. Each announcement is its own
 * poll (nothing else happens on it and his turn counter does not rise), so Garik's stages come on polls 181, 191, 196 and 201 and the Meteor on 202 and every one after, a Youth's on 141, 151, 156 and 161 and 162. A normal fight is
 * a few dozen of his actions; no play reaches it (the bench pins that) and a test drives the script alone to pin the thresholds. `RONSO_TOO_LONG_BLOCK_ON` turns it off again.
 *
 * **Not built** (picks GA4, GA10): the Gun Mage's Mighty Guard learning beat of the guides (Confuse on Garik) is a strategy and not a script, and the engine leaves a Confused monster to its script (`adapt/confusion.ts`), so the
 * easy Garik's "only after being Confused" is not reachable here either way.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import {
  GARIK_ATTACK_ID,
  GARIK_BANE_LANCE_ID,
  GARIK_BLIND_ID,
  GARIK_MIGHTY_GUARD_ID,
  GARIK_PROTECT_ID,
  GARIK_SHELL_ID,
  RONSO_ANNOUNCEMENT_IDS,
  RONSO_TIME_UP_METEOR_ID,
  YOUTH_ATTACK_ID,
  YOUTH_MP_BLOWOUT_ID,
} from '../../../data/ffx2/enemies/garik-ronso-abilities.ts';
import { GARIK_FRIENDLY_SCRIPT_ID, GARIK_HOSTILE_SCRIPT_ID, YOUTH_FRIENDLY_SCRIPT_ID, YOUTH_HOSTILE_SCRIPT_ID } from '../../../data/garik-ronso-ids.ts';
import { girls, lacking, pickFrom, pickId, scriptMod } from './script-rolls.ts';

/** Garik's hostile draw `random() % 4` (m182.src): 0 is Blind, the other three values are the plain Attack. */
export const GARIK_DRAW_MODULUS = 4;
/** His turn counter reaches this and Mighty Guard comes (hostile): the 7th poll. */
export const GARIK_GUARD_AT = 7;
/** The friendly Garik's counter starts here, so his first poll makes it 4: Protect. */
export const GARIK_BOUT_START = 3;
/** The friendly counter at which he casts Shell on himself and starts over. */
export const GARIK_BOUT_SHELL_AT = 8;
/** The friendly counter at which he casts Protect on himself. */
export const GARIK_BOUT_PROTECT_AT = 4;
/** The Youth's hostile draw `random() % 8` (m181.src): 0 is MP Blowout. */
export const YOUTH_DRAW_MODULUS = 8;

/** The polls past which each stage of the "battle too long" block shows (`>` each, in the order of the announcements) and past which Time Up Meteor repeats, `[script]`: Garik, then a Youth. */
export const GARIK_TOO_LONG_POLLS: readonly [number, number, number, number] = [180, 190, 195, 200];
export const YOUTH_TOO_LONG_POLLS: readonly [number, number, number, number] = [140, 150, 155, 160];
/** The block is live in these scenes; false turns it off. */
export const RONSO_TOO_LONG_BLOCK_ON = true;

/** AI memory: the turn counter of Garik (`mf_turn`), the "battle too long" poll counter (`n_action`) and stage (`keikoku`, 0 to 4). */
export const RONSO_TURN = 'ronsoTurn';
export const RONSO_POLLS = 'ronsoPolls';
export const RONSO_STAGE = 'ronsoStage';

/** The girls (the party's three ids), in the order the script checks them for a Black Mage; any other party unit counts as a friendly guest for the block's counter. */
export const GIRL_ORDER = ['yuna', 'rikku', 'paine'] as const;
const GIRL_IDS: ReadonlySet<string> = new Set(GIRL_ORDER);

/** The dressphere whose wearer Bane Lance hunts. */
export const BANE_LANCE_DRESSPHERE = 'black-mage';

function use(id: string, targets: string[] = []): Command {
  return { kind: 'ability', id, targets };
}

/** True while a friendly guest stands with the girls (a party unit that is not Yuna, Rikku or Paine): the block's counter does not rise then. */
function guestPresent(ctx: AiContext): boolean {
  return ctx.units.some((u) => u.side === 'party' && !GIRL_IDS.has(u.id));
}

/**
 * The "battle too long" block for this poll: the command it queues, or null when it queues none. Counts the poll, then (in the script's own order) Time Up Meteor once the last stage has shown, else the next stage's
 * announcement when its poll count has been passed.
 */
export function tooLong(ctx: AiContext, polls: readonly [number, number, number, number]): Command | null {
  if (!RONSO_TOO_LONG_BLOCK_ON || guestPresent(ctx)) return null;
  const self = ctx.self;
  const count = mem(self, RONSO_POLLS) + 1;
  setMem(self, RONSO_POLLS, count);
  const stage = mem(self, RONSO_STAGE);
  if (count > polls[3] && stage === 4) return use(RONSO_TIME_UP_METEOR_ID);
  for (let s = 3; s >= 0; s--) {
    if (count > polls[s]! && stage === s) {
      setMem(self, RONSO_STAGE, s + 1);
      return use(RONSO_ANNOUNCEMENT_IDS[s]!);
    }
  }
  return null;
}

/** The first of Yuna, Rikku and Paine, in that order, who is alive, wears Black Mage and carries no Curse: the one Bane Lance goes to (`searchr(chr_<girl>, stat_curse, not)`, girl by girl). */
export function baneLanceTarget(party: readonly Ffx2Unit[]): Ffx2Unit | undefined {
  for (const id of GIRL_ORDER) {
    const girl = party.find((u) => u.id === id);
    if (girl !== undefined && girl.dresspheres?.current === BANE_LANCE_DRESSPHERE && girl.statuses['curse'] === undefined) return girl;
  }
  return undefined;
}

/**
 * Garik, the hostile fight (scene 228). The counter is raised before anything is tested, and the poll that casts Mighty Guard is the one that finds it at 7.
 * RNG `[script]`: `random() % 4` only when no Black Mage waits for the lance and no guard is due; a target search draws only with two or more candidates.
 */
export const garikHostileScript: AiScript = {
  id: GARIK_HOSTILE_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, GARIK_TOO_LONG_POLLS);
    if (escalation !== null) return escalation;
    const self = ctx.self;
    const turn = mem(self, RONSO_TURN) + 1;
    setMem(self, RONSO_TURN, turn);
    const wizard = baneLanceTarget(party);
    if (wizard !== undefined) return use(GARIK_BANE_LANCE_ID, [wizard.id]);
    if (turn >= GARIK_GUARD_AT) {
      setMem(self, RONSO_TURN, 0);
      return use(GARIK_MIGHTY_GUARD_ID);
    }
    if (scriptMod(ctx.rng, GARIK_DRAW_MODULUS) === 0) {
      const lit = lacking(party, 'darkness');
      if (lit.length > 0) return use(GARIK_BLIND_ID, pickId(ctx.rng, lit));
    }
    return use(GARIK_ATTACK_ID, pickId(ctx.rng, party));
  },
};

/** Garik, the friendly bout (scene 229): Protect, Attack x3, Shell, Attack x3, from the first poll (the counter starts at 3). No draw. */
export const garikFriendlyScript: AiScript = {
  id: GARIK_FRIENDLY_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, GARIK_TOO_LONG_POLLS);
    if (escalation !== null) return escalation;
    const self = ctx.self;
    const turn = mem(self, RONSO_TURN, GARIK_BOUT_START) + 1;
    setMem(self, RONSO_TURN, turn);
    if (turn >= GARIK_BOUT_SHELL_AT) {
      setMem(self, RONSO_TURN, 0);
      return use(GARIK_SHELL_ID, [self.id]);
    }
    if (turn === GARIK_BOUT_PROTECT_AT) return use(GARIK_PROTECT_ID, [self.id]);
    return use(GARIK_ATTACK_ID, pickId(ctx.rng, party));
  },
};

/** The living girl(s) with the most MP; ties keep every tied girl and one is picked among them (one search, a draw only with two or more). */
export function mostMpGirl(ctx: AiContext, party: readonly Ffx2Unit[]): string[] {
  const best = Math.max(...party.map((u) => u.mp));
  const pick = pickFrom(ctx.rng, party.filter((u) => u.mp === best));
  return pick === undefined ? [] : [pick.id];
}

/** The Ronso Youth, the hostile fight (scene 228): one in eight MP Blowout on the girl with the most MP, else a plain Attack. */
export const youthHostileScript: AiScript = {
  id: YOUTH_HOSTILE_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, YOUTH_TOO_LONG_POLLS);
    if (escalation !== null) return escalation;
    if (scriptMod(ctx.rng, YOUTH_DRAW_MODULUS) === 0) return use(YOUTH_MP_BLOWOUT_ID, mostMpGirl(ctx, party));
    return use(YOUTH_ATTACK_ID, pickId(ctx.rng, party));
  },
};

/** The Ronso Youth, the friendly bout (scene 229): an Attack on a living girl, nothing else. */
export const youthFriendlyScript: AiScript = {
  id: YOUTH_FRIENDLY_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const escalation = tooLong(ctx, YOUTH_TOO_LONG_POLLS);
    if (escalation !== null) return escalation;
    return use(YOUTH_ATTACK_ID, pickId(ctx.rng, party));
  },
};

export const garikRonsoScripts: readonly AiScript[] = [garikHostileScript, garikFriendlyScript, youthHostileScript, youthFriendlyScript];
