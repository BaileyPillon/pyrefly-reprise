/**
 * Angra Mainyu, Zarich and Tawrich in the full fight (FFX-2 Chapter 5, the mission "Showdown in the Sands"; the hidden chapter "Angra Mainyu"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll: the scripts `m268` (the body), `m269` (Zarich) and `m270` (Tawrich)** (`research/re-ffx2-angra-mainyu.md` §9.5, §9.7 and §9.8, the RE session of 2026-10-14,
 * decoded from the shipped sources and checked against the compiled scripts), in our own words. The first build was Jegged's summary of the fight (`research/ffx2-angra-mainyu.md` §4: Osmose when low on MP, Full-Life
 * on a fallen arm, Perdition's Flame on a clock, else Demi, Flare, Perdition's Flame or Curaga), which the script confirms in outline and replaces in every number. **Only the full fight is built** (the scenario level
 * 5 of the game's save counter: levels 1, 2 and 3 are the capped encounters of the Bikanel dig, which eject the party; their Unnatural Selection, HP carry-over and DEF/MDEF 255 are not here).
 *
 * ```
 * The body, each poll (the game polls a ready monster every step; a poll is NOT a turn). The Flame counter gains 1 FIRST, then:
 *   1   the first poll only      HP at least 80 percent of max (266,755):  Perdition's Flame on the whole party; counter := 8
 *   1b                           HP below it:                              NO command (it stays ready, polled again on the next step); counter stays at its +1
 *   2   MP below 200             Osmose on the whole party
 *   3   Tawrich is dead          Full-Life on Tawrich
 *   4   Zarich is dead           Full-Life on Zarich
 *   5   Flame counter at least 15  Perdition's Flame on the whole party; counter := 0
 *   6   otherwise                random() mod 5 (stream 2):
 *         0  Flare on the near-weighted pick of a living girl WITHOUT Reflect; if every living girl has Reflect, Dispel on one living girl picked uniformly (stream 4)
 *         1  Curaga on Zarich or Tawrich: a second draw random() mod 2 (0 Zarich, 1 Tawrich); it casts even at full health
 *         2  Bio on the whole party
 *         3, 4  Demi on the whole party (so Demi is 2 in 5)
 * Zarich, each poll:                                   Tawrich, each poll:
 *   start: one draw random() mod 4 sets her spell        the cycle counter gains 1;
 *          index; the cycle counter is set to 10         at least 8:  Bloody Breath on the whole party; counter := 0
 *   1  her MP below 100:  Glimmer of Despair             else:        Punch on the near-weighted pick of a living girl
 *   2  cycle counter +1 at least 7:  Glimmer; counter := 0     (seven Punches, then Bloody Breath: eight polls, starting with a Punch)
 *   3  else: spell index +1; 1 Firaga, 2 Waterga, 3 Thundaga, else (4) index := 0 and Blizzaga; one living girl picked uniformly (stream 4)
 * ```
 *
 * The Flame counter counts **polls**, the Osmose, Full-Life and empty polls included, and is tested after the other branches have declined, so a raise or an Osmose delays a due Flame by one poll each. With nothing
 * intervening the Flames are polls 1, 8, 23, 38, 53 and so on (the opening Flame sets the counter to 8, so the next is the 7th poll after it; after that every 15th). Zarich's first poll is Glimmer (the counter starts at
 * 10), then six spells, then Glimmer: a 7-poll cycle. **Nothing reacts to a hit** (the reaction, menu and targeted entries are empty); no hook is defined.
 *
 * **RNG** `[RE §9.10]`: `random() mod n` is the scripts' stream 2 ({@link scriptModCtx}), one draw each: the body's `mod 5` once per poll that reaches the roll (rows 1 to 5 draw nothing) and `mod 2` after a roll of 1;
 * Zarich's `mod 4` once at the start (**made at her first poll here: the engine has no battle-start hook for a script, and no other script draws on stream 2 before it**: the body's first poll draws nothing and its first
 * `mod 5` comes after the opening Flame's charge and rest, 11 seconds on, while her first poll comes within 2.2); Tawrich draws nothing. The target searches are stream 4, a draw only with two or more candidates:
 * the near-weighted `searchr` ({@link searchNear}: the body's Flare, candidates without Reflect, and Tawrich's Punch) and the uniform `searchr_nop` ({@link searchUniform}: Dispel and every one of Zarich's spells).
 * Full-Life and Curaga are aimed by monster id.
 *
 * **Positions** `[RE §8]`: the near-weighted weights need the scene's start positions, which ship: the body at (-45, -13) and Yuna (23, 29), Rikku (33, 11), Paine (32, -9) (`./script-rolls.ts` `SCENES.angra`, numbers only),
 * with the body facing the middle of the party (the earlier notes' worked example: Yuna 28.8, Rikku 41.7, Paine 29.5 percent; the facing is not shipped, and facing straight along +x would give 23.6 / 30.4 / 46.0:
 * the note's §8.3). **Tawrich's position is not known** (the rows read (0, 0) for both arms and the body's script links them to its model): **`[inferred]` his Punch is searched from the BODY's spot**, one constant,
 * {@link COMPANION_SEARCH_ORIGIN}, to change after the RE review.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AI_REPOLL, idleFor } from './idle.ts';
import { SCENES, type Placement, type Scene, girls, scriptModCtx, searchNear, searchUniform } from './script-rolls.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/angra-mainyu.ts` names the same strings, a test pins them). */
export const ANGRA_MAINYU_SCRIPT = 'x2-angra-mainyu';
export const ZARICH_SCRIPT = 'x2-zarich';
export const TAWRICH_SCRIPT = 'x2-tawrich';

/** The three bodies' combatant ids (`src/data/angra-mainyu-ids.ts`; `src/battle/**` imports no `src/data/**` here, so a test pins these against it). */
export const ANGRA_UNIT = { angra: 'x2-angra-mainyu', zarich: 'x2-zarich', tawrich: 'x2-tawrich' } as const;

/** The ability ids (the data file `angra-mainyu-abilities.ts` owns the rows; a test pins these against it). */
export const ANGRA_ABILITY = {
  flame: 'x2-angra-perditions-flame',
  osmose: 'x2-angra-osmose',
  fullLife: 'x2-angra-full-life',
  curaga: 'x2-angra-curaga',
  bio: 'x2-angra-bio',
  demi: 'x2-angra-demi',
  dispel: 'x2-angra-dispel',
  flare: 'x2-angra-flare',
  glimmer: 'x2-zarich-glimmer-of-despair',
  firaga: 'x2-zarich-firaga',
  waterga: 'x2-zarich-waterga',
  thundaga: 'x2-zarich-thundaga',
  blizzaga: 'x2-zarich-blizzaga',
  punch: 'x2-tawrich-punch',
  bloodyBreath: 'x2-tawrich-bloody-breath',
} as const;

/** AI memory keys. */
export const FLAME_COUNTER = 'angraFlame';
export const FIRST_POLL_DONE = 'angraFirstPoll';
export const ZARICH_STARTED = 'zarichStarted';
export const ZARICH_SPELL_INDEX = 'zarichSpell';
export const ZARICH_CYCLE = 'zarichCycle';
export const TAWRICH_CYCLE = 'tawrichCycle';

/** The body's numbers `[script, RE §9.5]`. */
export const FLAME_AT_COUNTER = 15;
export const FLAME_OPENING_COUNTER = 8;
/** The opening Flame needs at least this share of the maximum HP: `max x 8 / 10`, integer arithmetic (266,755 of 333,444). */
export const FIRST_POLL_HP_TENTHS = 8;
export const OSMOSE_BELOW_MP = 200;
/** The roll's modulus and what each value is. */
export const ROLL_MODULUS = 5;
export const ROLL_FLARE = 0;
export const ROLL_CURAGA = 1;
export const ROLL_BIO = 2;
/** Zarich `[RE §9.7]`. */
export const ZARICH_START_SPELL_MODULUS = 4;
export const ZARICH_START_CYCLE = 10;
export const ZARICH_GLIMMER_AT_CYCLE = 7;
export const ZARICH_GLIMMER_BELOW_MP = 100;
/** Tawrich `[RE §9.8]`: seven Punches, then Bloody Breath. */
export const TAWRICH_BREATH_AT_CYCLE = 8;

/** The room: the body and the girls' start positions (`pos_bika*_229.psc`, byte for byte the same in all five desert scenes, `[RE §8]`). */
export const ANGRA_SCENE: Scene = SCENES.angra;

/**
 * **`[inferred]` Where Tawrich's near-weighted Punch search is made from.** The rows give both arms the spot (0, 0) and the body's script links them to its model (the note's §8.2, §12 item 5), so neither
 * arm's own position is known; the **body's spot** stands in for both, as the driver ruled (2026-10-14). One constant. **The RE session's review left it `[inferred]` and measured how much it matters** (the shares of the three girls
 * as the near-weighted pick gives them): the body's spot gives 28.7 / 41.7 / 29.6 percent; a shift of 10 units either way moves each share by under 1 point; the origin (0, 0) gives 23.6 / 51.6 / 24.8; the facing assumption matters most
 * (the body facing +x gives 23.5 / 30.4 / 46.1). The handoff (`docs/handoff/ch-angra-mainyu.md` section 4) carries the same note.
 */
export const COMPANION_SEARCH_ORIGIN: Placement = SCENES.angra.boss;

/** The scene Tawrich's Punch is searched in: the girls' start positions, from {@link COMPANION_SEARCH_ORIGIN}. */
export const TAWRICH_SCENE: Scene = { boss: COMPANION_SEARCH_ORIGIN, girls: SCENES.angra.girls };

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** One of the other two bodies, by id (living or dead). */
function body(ctx: AiContext, id: string): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === id);
}

/** The body's first-poll test: HP at least `max x 8 / 10` (integer arithmetic). */
export function openingFlameAllowed(hp: number, maxHp: number): boolean {
  return hp >= Math.floor((maxHp * FIRST_POLL_HP_TENTHS) / 10);
}

/** Angra Mainyu, one poll. */
export const x2AngraMainyuScript: AiScript = {
  id: ANGRA_MAINYU_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    setMem(self, AI_REPOLL, 0);
    const party = girls(ctx);
    if (party.length === 0) return null;
    // The Flame counter gains 1 before anything else.
    const counter = mem(self, FLAME_COUNTER) + 1;
    setMem(self, FLAME_COUNTER, counter);

    // 1 and 1b: the first poll only.
    if (mem(self, FIRST_POLL_DONE) === 0) {
      setMem(self, FIRST_POLL_DONE, 1);
      if (openingFlameAllowed(self.hp, self.stats.maxHp)) {
        setMem(self, FLAME_COUNTER, FLAME_OPENING_COUNTER);
        return use(ANGRA_ABILITY.flame, []);
      }
      // 1b: no command; polled again on the very next step, the counter left at its +1. (Unreachable in the shipped fight: the body starts at full HP.)
      setMem(self, AI_REPOLL, 1);
      return idleFor(self, 1);
    }

    // 2: low on MP.
    if (self.mp < OSMOSE_BELOW_MP) return use(ANGRA_ABILITY.osmose, []);

    // 3 and 4: a fallen arm, Tawrich before Zarich.
    const tawrich = body(ctx, ANGRA_UNIT.tawrich);
    if (tawrich && !tawrich.alive) return use(ANGRA_ABILITY.fullLife, [tawrich.id]);
    const zarich = body(ctx, ANGRA_UNIT.zarich);
    if (zarich && !zarich.alive) return use(ANGRA_ABILITY.fullLife, [zarich.id]);

    // 5: the Flame clock.
    if (counter >= FLAME_AT_COUNTER) {
      setMem(self, FLAME_COUNTER, 0);
      return use(ANGRA_ABILITY.flame, []);
    }

    // 6: one roll of five.
    const roll = scriptModCtx(ctx, ROLL_MODULUS);
    if (roll === ROLL_FLARE) {
      const flarePick = searchNear(ctx.rng, party.filter((g) => !g.statuses['reflect']), ANGRA_SCENE);
      if (flarePick) return use(ANGRA_ABILITY.flare, [flarePick.id]);
      // Every living girl has Reflect: Dispel, on one of them, uniformly.
      const dispelPick = searchUniform(ctx.rng, party);
      return use(ANGRA_ABILITY.dispel, dispelPick ? [dispelPick.id] : []);
    }
    if (roll === ROLL_CURAGA) {
      const arm = scriptModCtx(ctx, 2) === 0 ? ANGRA_UNIT.zarich : ANGRA_UNIT.tawrich;
      return use(ANGRA_ABILITY.curaga, [arm]);
    }
    if (roll === ROLL_BIO) return use(ANGRA_ABILITY.bio, []);
    return use(ANGRA_ABILITY.demi, []); // rolls 3 and 4
  },
};

/** The four spells in the order her index goes round them (index 1 to 3, then 4 wraps to 0). */
const ZARICH_SPELLS = [ANGRA_ABILITY.firaga, ANGRA_ABILITY.waterga, ANGRA_ABILITY.thundaga, ANGRA_ABILITY.blizzaga] as const;

/** Zarich, one poll. */
export const x2ZarichScript: AiScript = {
  id: ZARICH_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // The start-up entry (a draw `random() mod 4` for the spell index, the cycle counter to 10), made at the first poll (see the file header).
    if (mem(self, ZARICH_STARTED) === 0) {
      setMem(self, ZARICH_STARTED, 1);
      setMem(self, ZARICH_SPELL_INDEX, scriptModCtx(ctx, ZARICH_START_SPELL_MODULUS));
      setMem(self, ZARICH_CYCLE, ZARICH_START_CYCLE);
    }
    // 1: her MP below 100 (reachable only if the party drains her: she pays 24 a Ga spell from 9,999).
    if (self.mp < ZARICH_GLIMMER_BELOW_MP) return use(ANGRA_ABILITY.glimmer, []);
    // 2: the cycle counter, tested after its own +1.
    const cycle = mem(self, ZARICH_CYCLE) + 1;
    setMem(self, ZARICH_CYCLE, cycle);
    if (cycle >= ZARICH_GLIMMER_AT_CYCLE) {
      setMem(self, ZARICH_CYCLE, 0);
      return use(ANGRA_ABILITY.glimmer, []);
    }
    // 3: the spell index goes up first; 1 Firaga, 2 Waterga, 3 Thundaga, otherwise (4) it returns to 0 and Blizzaga.
    let index = mem(self, ZARICH_SPELL_INDEX) + 1;
    let spell: string = ZARICH_SPELLS[index - 1] ?? ANGRA_ABILITY.blizzaga;
    if (index >= 4) {
      index = 0;
      spell = ANGRA_ABILITY.blizzaga;
    }
    setMem(self, ZARICH_SPELL_INDEX, index);
    const pick = searchUniform(ctx.rng, party);
    return use(spell, pick ? [pick.id] : []);
  },
};

/** Tawrich, one poll. */
export const x2TawrichScript: AiScript = {
  id: TAWRICH_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const cycle = mem(self, TAWRICH_CYCLE) + 1;
    setMem(self, TAWRICH_CYCLE, cycle);
    if (cycle >= TAWRICH_BREATH_AT_CYCLE) {
      setMem(self, TAWRICH_CYCLE, 0);
      return use(ANGRA_ABILITY.bloodyBreath, []);
    }
    const pick = searchNear(ctx.rng, party, TAWRICH_SCENE);
    return use(ANGRA_ABILITY.punch, pick ? [pick.id] : []);
  },
};

/** The three scripts, for the registry (`./index.ts`). */
export const angraMainyuScripts: readonly AiScript[] = [x2AngraMainyuScript, x2ZarichScript, x2TawrichScript];
