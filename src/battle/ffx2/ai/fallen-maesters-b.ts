/**
 * Concherer (floor 60, scene `stbv09_226`) and Chac (floor 80, `stbv09_225`) of the hidden chapter "The Fallen Maesters", NORMAL versions. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll: the scripts `m232` and `m239`** (`research/re-ffx2-fallen-maesters.md` §7.4 and §7.5, the RE session of 2026-10-19, decoded from the shipped sources and checked
 * against the compiled workers), in our own words.
 *
 * ```
 * Concherer, each poll (its record carries a permanent Shell and Protect):
 *   shell broken:   Attack on a living girl, near-weighted (stream 4); no draw of stream 2
 *   shell intact:   random() mod 4 (stream 2): 0 Gunk on a living girl (uniform), 1 Megaton Press on a living girl (uniform), 2 or 3 Attack (near-weighted)
 *   the reaction (once per result applied to it): a result of 10,000 HP or more while the shell is intact breaks it: DEF and MDEF are stored as 0, which the game's setter turns into 1,
 *                   and "Broken shell" is shown; from then on only Attacks (no Press, no Gunk).
 *
 * Chac, at the start: random() mod 4 sets the poll counter to 0, 1, 2 or 3. Each poll, the counter gains 1 FIRST, then:
 *   counter at least 6:   Heaven's Cataract on the whole party; counter := 0     (the first on poll 6, 5, 4 or 3, then every sixth)
 *   otherwise: alive = the number of living girls (a petrified girl counts as living), stone = the number of petrified girls:
 *      alive - stone = 1 exactly:   Attack on a living girl, near-weighted, THE PETRIFIED INCLUDED
 *      otherwise random() mod 3:    0 Attack (the same pick); 1 or 2 Stony Glare on a living girl who is NOT petrified, near-weighted
 * ```
 *
 * **The shell break is measured on one result.** The game's reaction entry runs once per result and reads that result's HP damage; here the script reads the HP lost since the previous result
 * (`onResult` runs after the result's HP is in, once per strike that lands; nothing else changes Concherer's HP in between: it is immune to Poison and the percent formulas, and has no Regen). It is the same number
 * with no edit to the four capped host files the preflight listed (`docs/handoff/ch-maesters.md`). A strike that is clamped by the HP left cannot show more than the HP left, which cannot matter: it kills.
 *
 * **Chac's start draw is made at her first poll** (the engine has no battle-start hook for a script, and no other script draws on stream 2 before it), as Zarich's is in `./angra-mainyu.ts`.
 *
 * **RNG** [RE §7.7]: `random() mod n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates. Positions are `[inferred]`: see {@link MAESTERS_SCENE}.
 */

import type { Command } from '../../common/types.ts';
import type { AbilityDef } from '../../common/types.ts';
import type { AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { applyStat } from '../adapt/stat-setter.ts';
import { GROUP_OWN, StatId } from '../kernel/stat-setter.ts';
import { girls, scriptModCtx, searchNear, searchUniform } from './script-rolls.ts';
import { MAESTERS_SCENE } from './fallen-maesters-a.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file names the same strings through `src/data/fallen-maesters-ids.ts`, a test pins them). */
export const CONCHERER_SCRIPT = 'x2-concherer';
export const CHAC_SCRIPT = 'x2-chac';

/** The ability ids (the data file `fallen-maesters-abilities.ts` owns the rows; a test pins these against it). */
export const MAESTERS_B_ABILITY = {
  conchererAttack: 'x2-concherer-attack',
  megatonPress: 'x2-concherer-megaton-press',
  gunk: 'x2-concherer-gunk',
  brokenShell: 'x2-concherer-broken-shell',
  chacAttack: 'x2-chac-attack',
  stonyGlare: 'x2-chac-stony-glare',
  heavensCataract: 'x2-chac-heavens-cataract',
} as const;

/** AI memory keys. */
export const SHELL_BROKEN = 'conchererShellBroken';
export const LAST_HP = 'conchererLastHp';
export const CHAC_STARTED = 'chacStarted';
export const CHAC_COUNTER = 'chacPolls';

/** Concherer `[RE §7.4]`: the draw's modulus, what each value is, and the result that breaks the shell. */
export const CONCHERER_ROLL_MODULUS = 4;
export const CONCHERER_ROLL_GUNK = 0;
export const CONCHERER_ROLL_PRESS = 1;
export const SHELL_BREAKS_AT = 10000;
/** The stored value of the break: 0, which the game's setter turns into 1 (`kernel/stat-setter.ts` `clamp1`). */
export const SHELL_BROKEN_STAT = 0;
/** Chac `[RE §7.5]`: the start draw's modulus, the Cataract's poll, the roll's modulus and what each value is. */
export const CHAC_START_MODULUS = 4;
export const CATARACT_AT_POLL = 6;
export const CHAC_ROLL_MODULUS = 3;
export const CHAC_ROLL_ATTACK = 0;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Concherer, one poll. */
export const x2ConchererScript: AiScript = {
  id: CONCHERER_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // Shell broken: only Attacks, near-weighted, and no draw of stream 2.
    if (mem(self, SHELL_BROKEN) === 1) {
      const pick = searchNear(ctx.rng, party, MAESTERS_SCENE);
      return use(MAESTERS_B_ABILITY.conchererAttack, pick ? [pick.id] : []);
    }
    const roll = scriptModCtx(ctx, CONCHERER_ROLL_MODULUS);
    if (roll === CONCHERER_ROLL_GUNK || roll === CONCHERER_ROLL_PRESS) {
      const pick = searchUniform(ctx.rng, party);
      return use(roll === CONCHERER_ROLL_GUNK ? MAESTERS_B_ABILITY.gunk : MAESTERS_B_ABILITY.megatonPress, pick ? [pick.id] : []);
    }
    const pick = searchNear(ctx.rng, party, MAESTERS_SCENE);
    return use(MAESTERS_B_ABILITY.conchererAttack, pick ? [pick.id] : []);
  },

  /** The reaction entry: once per result applied to Concherer (`internal.ts` `onResult`). The HP lost since the last result is this result's damage. */
  onResult(ctx, _source: Ffx2Unit, _ability: AbilityDef) {
    const self = ctx.self;
    const before = mem(self, LAST_HP, self.stats.maxHp);
    setMem(self, LAST_HP, self.hp);
    if (mem(self, SHELL_BROKEN) === 1) return;
    if (before - self.hp < SHELL_BREAKS_AT) return;
    setMem(self, SHELL_BROKEN, 1);
    applyStat([...ctx.units], self, StatId.vit, GROUP_OWN, SHELL_BROKEN_STAT); // DEF := 0, stored as 1
    applyStat([...ctx.units], self, StatId.spirit, GROUP_OWN, SHELL_BROKEN_STAT); // MDEF := 0, stored as 1
    ctx.emit({ type: 'message', text: "Concherer's shell breaks!", kind: 'system' }); // the "Broken shell" row (0x40bb), which has no effect, is the presentation
  },
};

/** The number of the living girls who are petrified (a petrified girl is alive). */
function stoneCount(party: readonly Ffx2Unit[]): number {
  return party.filter((g) => g.statuses['petrify'] !== undefined).length;
}

/** Chac, one poll. */
export const x2ChacScript: AiScript = {
  id: CHAC_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // The start-up entry (a draw `random() mod 4` for the poll counter), made at the first poll (see the file header).
    if (mem(self, CHAC_STARTED) === 0) {
      setMem(self, CHAC_STARTED, 1);
      setMem(self, CHAC_COUNTER, scriptModCtx(ctx, CHAC_START_MODULUS));
    }
    // The counter gains 1 first; at 6 or more it is reset and Heaven's Cataract goes to the whole party.
    const counter = mem(self, CHAC_COUNTER) + 1;
    if (counter >= CATARACT_AT_POLL) {
      setMem(self, CHAC_COUNTER, 0);
      return use(MAESTERS_B_ABILITY.heavensCataract, []);
    }
    setMem(self, CHAC_COUNTER, counter);
    const stone = stoneCount(party);
    // Exactly one girl alive and not stone: a plain Attack, on any living girl (the stone ones are candidates).
    if (party.length - stone === 1) {
      const pick = searchNear(ctx.rng, party, MAESTERS_SCENE);
      return use(MAESTERS_B_ABILITY.chacAttack, pick ? [pick.id] : []);
    }
    if (scriptModCtx(ctx, CHAC_ROLL_MODULUS) === CHAC_ROLL_ATTACK) {
      const pick = searchNear(ctx.rng, party, MAESTERS_SCENE);
      return use(MAESTERS_B_ABILITY.chacAttack, pick ? [pick.id] : []);
    }
    // Stony Glare: a living girl who is not petrified.
    const pick = searchNear(ctx.rng, party.filter((g) => g.statuses['petrify'] === undefined), MAESTERS_SCENE);
    return pick ? use(MAESTERS_B_ABILITY.stonyGlare, [pick.id]) : null; // no girl left who is not stone: no command
  },
};

/** The two scripts, for the registry (`./index.ts`). */
export const fallenMaestersBScripts: readonly AiScript[] = [x2ConchererScript, x2ChacScript];
