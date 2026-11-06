/**
 * Georapella (floor 3, scene `stbv03_228`), the Precepts Guard (floor 3, `stbv03_227`) and the first Baralai (floor 7, `stbv06_229`) of the hidden chapter "The Guardians of the Bevelle Underground", NORMAL versions.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll: the scripts `m262`, `m263` and `m175`** (`research/re-ffx2-bevelle-underground.md` §6.2 to §6.4, the RE lane of 2026-11-06, decoded from the shipped sources and
 * checked against the compiled workers; the chapter lane read the three sources again for the search semantics, which is where this file departs from the note's prose, said below), in our own words. A poll is one call of the
 * action entry; each script answers every poll with one command, except that the Precepts Guard and Baralai sometimes queue two (the second is kept and returned at the next poll, the Den of Woe shade's way).
 *
 * ```
 * Georapella, once at the start:  a draw random() mod 4 stores the counter (0 to 3)        (made at the first poll, as Chac's)
 * Georapella, each poll:          MP below 25 (never: it has 9,999): Osmose on the girl with the most MP
 *                                 otherwise the counter gains 1:  1 Thundaga, 2 Waterga, 3 Firaga, else (4) counter := 0 and Blizzaga     (each on the party)
 *
 * Precepts Guard, each poll:      MP below 35 (never): Osmose on the girl with the most MP
 *                                 random() mod 3 = 0:  Demi on the party                       (the poll ends: 33.3 percent)
 *                                 else r = random() mod 5:
 *                                   r = 0:  if some girl lacks Poison: a search over the living, then Bio on a living girl who lacks Reflect (a near-weighted pick; none: no Bio)
 *                                   r = 1:  Slow on the party
 *                                   r != 1: if some girl lacks Reflect: r = 2 Death, r = 3 Osmose, else (0 or 4) Drain, on a living girl picked uniformly
 *                                 (r = 0 does BOTH: the Bio is queued first and the Drain after it)
 *
 * Baralai, each poll:             below a quarter of his HP (HP < max / 4): random() mod 4 = 0 queues an Absorb on a living girl and the poll goes on
 *                                 the hit count is 10 or more: it goes to 0 and Drill Shot goes to the girl who made the latest result on him if she lives, else a living girl; no cycle step
 *                                 otherwise the cycle counter gains 1:  1 Attack, 2 Attack, 3 Glint (the party), 4 Chain Attack x3 (Yuna, Rikku, Paine; one girl alive: an Attack),
 *                                 5 Attack, 6 Looming Glacier (the not-stopped girl with the most MP), else (7) counter := 0 and Demi on the party, or an Attack below 40 MP
 *                                 the reaction entry adds 1 to the hit count for every result applied to him by anyone but himself
 * ```
 *
 * **Where this file reads the sources, not the note** (said once, pinned by the AI test): (a) the Precepts Guard's Bio goes to **any living girl without Reflect**, not only a girl who also lacks Poison: the source tests
 * "does some girl lack Poison" with a search whose pick it throws away, then searches the living for a girl lacking Reflect. (b) Every **discarded search** still draws from the search stream when it had two or more candidates
 * ({@link spendSearchDraw}); the Precepts Guard's Death, Osmose and Drain test "does some girl lack Reflect" the same way. These change which numbers come next, never what a move does.
 *
 * **RNG** [RE §6.6]: `random() mod n` is stream 2 ({@link scriptModCtx}); the searches are stream 4, a draw only with two or more candidates ({@link searchNear}, {@link searchUniform}).
 *
 * **Positions** (the near-weighted `searchr` needs where everyone stands): Georapella's scene ships a start-position file (the girls at (-43, 29), (-50, 10), (-27, 43), Georapella at (4.4, -3.2); [RE §5.2]), so
 * {@link GEORAPELLA_SCENE} is the game's own. **`[inferred]` stand-ins**: the Precepts Guard's and Baralai's scenes ship EMPTY position files, so the Precepts Guard uses Georapella's (the same floor and map family) and Baralai uses
 * the Bahamut scene's (`stbv05_229`, the same dungeon; `SCENES.bahamut`): one named constant each to replace when the default placement of those maps is read. The alternative is a uniform search ({@link searchUniform}).
 * The boss faces the middle of the party ({@link searchNear}'s own assumption).
 *
 * **Reflect**: the Ga spells, Death, Bio, Slow and Drain are reflectable in the game; the engine has no Reflect redirect (`kernel/hit.ts`, a known gap, `docs/handoff/ch-maesters.md` T0 finding 1), so a girl with Reflect is only a
 * gate for the Precepts Guard's tests. Disclosed, not tuned.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { type Scene, SCENES, girls, lacking, maxHpDiv, scriptModCtx, searchNear, searchUniform, spendSearchDraw } from './script-rolls.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file names the same strings through `src/data/bevelle-guardians-ids.ts`, a test pins them). */
export const GEORAPELLA_SCRIPT = 'x2-georapella';
export const PRECEPTS_GUARD_SCRIPT = 'x2-precepts-guard';
export const BARALAI_SCRIPT = 'x2-baralai';

/** The ability ids (the data file `bevelle-guardians-abilities.ts` owns the rows; a test pins these against it). */
export const GUARDIAN_ABILITY = {
  thundaga: 'x2-georapella-thundaga',
  waterga: 'x2-georapella-waterga',
  firaga: 'x2-georapella-firaga',
  blizzaga: 'x2-georapella-blizzaga',
  georapellaOsmose: 'x2-georapella-osmose',
  demi: 'x2-precepts-guard-demi',
  bio: 'x2-precepts-guard-bio',
  slow: 'x2-precepts-guard-slow',
  death: 'x2-precepts-guard-death',
  preceptsOsmose: 'x2-precepts-guard-osmose',
  drain: 'x2-precepts-guard-drain',
  attack: 'x2-baralai-attack',
  chainAttack: 'x2-baralai-chain-attack',
  glint: 'x2-baralai-glint',
  loomingGlacier: 'x2-baralai-looming-glacier',
  drillShot: 'x2-baralai-drill-shot',
  baralaiDemi: 'x2-baralai-demi',
  absorb: 'x2-baralai-absorb',
} as const;

/** AI memory keys. */
export const GEORAPELLA_STARTED = 'georapellaStarted';
export const GEORAPELLA_COUNTER = 'georapellaCounter';
export const PRECEPTS_QUEUED = 'preceptsQueued';
export const BARALAI_TURN = 'baralaiTurn';
export const BARALAI_HITS = 'baralaiHits';
export const BARALAI_LAST_ATTACKER = 'baralaiLastAttacker';
export const BARALAI_COUNT_NINE_CALLED = 'baralaiCountNineCalled';
export const BARALAI_QUEUED = 'baralaiQueued';

/** Georapella `[RE §6.2]`: the start draw's modulus, the Osmose line (MP below this) and the number of spells in the ring. */
export const GEORAPELLA_START_MODULUS = 4;
export const GEORAPELLA_OSMOSE_BELOW_MP = 25;
/** The ring in counter order: value 1, 2, 3, then 4 (which resets the counter). */
export const GEORAPELLA_RING = [GUARDIAN_ABILITY.thundaga, GUARDIAN_ABILITY.waterga, GUARDIAN_ABILITY.firaga, GUARDIAN_ABILITY.blizzaga] as const;
/** The Precepts Guard `[RE §6.3]`: the Osmose line, the first draw's modulus (0 is Demi) and the second's (r). */
export const PRECEPTS_OSMOSE_BELOW_MP = 35;
export const PRECEPTS_DEMI_MODULUS = 3;
export const PRECEPTS_DEMI_ROLL = 0;
export const PRECEPTS_ROLL_MODULUS = 5;
export const PRECEPTS_ROLL_BIO = 0;
export const PRECEPTS_ROLL_SLOW = 1;
export const PRECEPTS_ROLL_DEATH = 2;
export const PRECEPTS_ROLL_OSMOSE = 3;
/** Baralai `[RE §6.4]`: Drill Shot at this many results (the Den of Woe shade's is 8), the low-HP line (HP below max / this), its draw, the Demi line (MP below this is an Attack instead). */
export const DRILL_SHOT_AT = 10;
export const LOW_HP_DIV = 4;
export const ABSORB_MODULUS = 4;
export const ABSORB_ROLL = 0;
export const DEMI_FROM_MP = 40;
export const CYCLE_LENGTH = 7;
/** The `script-trigger` name emitted once, the first time Baralai's count reaches the number before the Drill Shot (BG4: the one callout; the game shows no counter). */
export const BARALAI_COUNT_NINE = 'baralai-count-nine';

/** Georapella's room: the game's own start positions [RE §5.2] (`pos_stbv03_228`: the girls Yuna, Rikku, Paine and the boss, x and z). */
export const GEORAPELLA_SCENE: Scene = { boss: { x: 4.4, z: -3.2 }, girls: [{ x: -43, z: 29 }, { x: -50, z: 10 }, { x: -27, z: 43 }] };
/** `[inferred]` The Precepts Guard's room ships an empty position file: Georapella's stands in (the same floor and map family). */
export const PRECEPTS_GUARD_SCENE: Scene = GEORAPELLA_SCENE;
/** `[inferred]` Baralai's room ships an empty position file: the Bahamut scene's (`stbv05_229`, the same dungeon) stands in. */
export const BARALAI_SCENE: Scene = SCENES.bahamut;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** The unit with the most of `key` among `pool`: a first near-weighted search whose pick is thrown away, then the units tied for the highest searched near-weighted (`searchr(.., stat, max)`). */
function highest(ctx: AiContext, pool: readonly Ffx2Unit[], key: (u: Ffx2Unit) => number, scene: Scene): Ffx2Unit | undefined {
  searchNear(ctx.rng, pool, scene); // the first search makes its draw and the script discards it
  if (pool.length === 0) return undefined;
  const top = Math.max(...pool.map(key));
  return searchNear(ctx.rng, pool.filter((u) => key(u) === top), scene);
}

/** Keep the poll's second command for the next poll (the engine runs one command a turn on this base; the game runs the batch without a gap). */
function queue(unit: Ffx2Unit, slot: string, command: Command): void {
  if (command.kind !== 'ability') return;
  setMem(unit, slot, `${command.id}|${command.targets.join(',')}`);
}

function takeQueued(unit: Ffx2Unit, slot: string): Command | null {
  const raw = unit.aiMemory?.[slot];
  if (typeof raw !== 'string' || raw === '') return null;
  setMem(unit, slot, '');
  const [id, targets] = raw.split('|') as [string, string | undefined];
  return use(id, targets ? targets.split(',') : []);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Georapella [m262]
// ---------------------------------------------------------------------------------------------------------------------------------

/** Georapella, one poll. */
export const x2GeorapellaScript: AiScript = {
  id: GEORAPELLA_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    // The start-up entry (a draw `random() mod 4` for the counter), made at the first poll (see the header).
    if (mem(self, GEORAPELLA_STARTED) === 0) {
      setMem(self, GEORAPELLA_STARTED, 1);
      setMem(self, GEORAPELLA_COUNTER, scriptModCtx(ctx, GEORAPELLA_START_MODULUS));
    }
    if (self.mp < GEORAPELLA_OSMOSE_BELOW_MP) {
      const target = highest(ctx, party, (u) => u.mp, GEORAPELLA_SCENE);
      return use(GUARDIAN_ABILITY.georapellaOsmose, target ? [target.id] : []);
    }
    // The counter gains 1 first; 1 to 3 are three of the spells, anything else is Blizzaga and the counter goes back to 0.
    const counter = mem(self, GEORAPELLA_COUNTER) + 1;
    if (counter >= GEORAPELLA_RING.length) {
      setMem(self, GEORAPELLA_COUNTER, 0);
      return use(GEORAPELLA_RING[GEORAPELLA_RING.length - 1]!, []);
    }
    setMem(self, GEORAPELLA_COUNTER, counter);
    return use(GEORAPELLA_RING[counter - 1]!, []);
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// The Precepts Guard [m263]
// ---------------------------------------------------------------------------------------------------------------------------------

/** The Precepts Guard, one poll. */
export const x2PreceptsGuardScript: AiScript = {
  id: PRECEPTS_GUARD_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const queued = takeQueued(self, PRECEPTS_QUEUED);
    if (queued !== null) return queued;

    if (self.mp < PRECEPTS_OSMOSE_BELOW_MP) {
      const target = highest(ctx, party, (u) => u.mp, PRECEPTS_GUARD_SCENE);
      return use(GUARDIAN_ABILITY.preceptsOsmose, target ? [target.id] : []);
    }
    if (scriptModCtx(ctx, PRECEPTS_DEMI_MODULUS) === PRECEPTS_DEMI_ROLL) return use(GUARDIAN_ABILITY.demi, []);

    const r = scriptModCtx(ctx, PRECEPTS_ROLL_MODULUS);
    let first: Command | null = null;
    let second: Command | null = null;

    if (r === PRECEPTS_ROLL_BIO) {
      // "Does some girl lack Poison?": a search whose pick is thrown away.
      const unpoisoned = lacking(party, 'poison');
      spendSearchDraw(ctx.rng, unpoisoned.length);
      if (unpoisoned.length > 0) {
        spendSearchDraw(ctx.rng, party.length); // searchr(all, alive): the candidate set of the next search, its pick thrown away
        const target = searchNear(ctx.rng, lacking(party, 'reflect'), PRECEPTS_GUARD_SCENE);
        if (target) first = use(GUARDIAN_ABILITY.bio, [target.id]);
      }
    }

    if (r === PRECEPTS_ROLL_SLOW) {
      second = use(GUARDIAN_ABILITY.slow, []);
    } else {
      // "Does some girl lack Reflect?": a search whose pick is thrown away; if one does, a uniform living girl takes Death, Osmose or Drain.
      const unreflected = lacking(party, 'reflect');
      spendSearchDraw(ctx.rng, unreflected.length);
      if (unreflected.length > 0) {
        const target = searchUniform(ctx.rng, party);
        const id = r === PRECEPTS_ROLL_DEATH ? GUARDIAN_ABILITY.death : r === PRECEPTS_ROLL_OSMOSE ? GUARDIAN_ABILITY.preceptsOsmose : GUARDIAN_ABILITY.drain;
        second = use(id, target ? [target.id] : []);
      }
    }

    if (first !== null && second !== null) {
      queue(self, PRECEPTS_QUEUED, second);
      return first;
    }
    return first ?? second;
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Baralai, the first one [m175]
// ---------------------------------------------------------------------------------------------------------------------------------

/** The girl in formation slot `slot`, or undefined. */
function inSlot(party: readonly Ffx2Unit[], slot: number): Ffx2Unit | undefined {
  return party.find((u) => u.slot === slot);
}

/** The first of the slots that has a living girl: the Chain Attack's fall-back order. */
function firstLiving(party: readonly Ffx2Unit[], order: readonly number[]): string {
  for (const slot of order) {
    const unit = inSlot(party, slot);
    if (unit !== undefined) return unit.id;
  }
  return party[0]!.id;
}

/** The three Chain Attacks' girls, strike by strike: Yuna (else Paine, else Rikku), Rikku (else Paine, else Yuna), Paine (else Yuna, else Rikku). */
export function chainAttackTargets(party: readonly Ffx2Unit[]): string[] {
  return [firstLiving(party, [0, 2, 1]), firstLiving(party, [1, 2, 0]), firstLiving(party, [2, 0, 1])];
}

/** An Attack on a near-weighted living girl. */
function attackOn(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  const target = searchNear(ctx.rng, party, BARALAI_SCENE);
  return use(GUARDIAN_ABILITY.attack, target ? [target.id] : []);
}

/** The Drill Shot: the girl who made the latest result on him if she lives, else a near-weighted living girl. The count goes back to 0. */
function drillShot(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  const self = ctx.self;
  setMem(self, BARALAI_HITS, 0);
  const last = self.aiMemory?.[BARALAI_LAST_ATTACKER];
  const target = party.find((u) => u.id === last) ?? searchNear(ctx.rng, party, BARALAI_SCENE);
  return use(GUARDIAN_ABILITY.drillShot, target ? [target.id] : []);
}

/** The cycle: the counter gains 1, then by value 1 to 6; 7 (the default branch) sends it back to 0. */
function cycleMove(ctx: AiContext, party: readonly Ffx2Unit[]): Command | null {
  const self = ctx.self;
  const turn = mem(self, BARALAI_TURN) + 1;
  setMem(self, BARALAI_TURN, turn >= CYCLE_LENGTH ? 0 : turn);
  switch (turn) {
    case 1:
    case 2:
    case 5:
      return attackOn(ctx, party);
    case 3:
      return use(GUARDIAN_ABILITY.glint, []);
    case 4:
      return party.length === 1 ? use(GUARDIAN_ABILITY.attack, [party[0]!.id]) : use(GUARDIAN_ABILITY.chainAttack, chainAttackTargets(party));
    case 6: {
      const target = highest(ctx, lacking(party, 'stop'), (u) => u.mp, BARALAI_SCENE);
      return target ? use(GUARDIAN_ABILITY.loomingGlacier, [target.id]) : null; // every girl already stopped: no command
    }
    default:
      return self.mp < DEMI_FROM_MP ? attackOn(ctx, party) : use(GUARDIAN_ABILITY.baralaiDemi, []);
  }
}

/**
 * Baralai, each poll, in the script's order. (1) Below a quarter of his HP and `random() % 4 = 0`: queue an Absorb and go on. (2) Hit count 10 or more: the Drill Shot, no cycle step. (3) Else the next step of the
 * seven-step cycle. The second command of a two-command poll is returned at the next poll.
 */
export const x2BaralaiScript: AiScript = {
  id: BARALAI_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const queued = takeQueued(self, BARALAI_QUEUED);
    if (queued !== null) return queued;

    let first: Command | null = null;
    if (self.hp < maxHpDiv(self, LOW_HP_DIV) && scriptModCtx(ctx, ABSORB_MODULUS) === ABSORB_ROLL) {
      const target = searchNear(ctx.rng, party, BARALAI_SCENE);
      if (target) first = use(GUARDIAN_ABILITY.absorb, [target.id]);
    }
    const second = mem(self, BARALAI_HITS) >= DRILL_SHOT_AT ? drillShot(ctx, party) : cycleMove(ctx, party);
    if (first === null) return second;
    if (second !== null) queue(self, BARALAI_QUEUED, second);
    return first;
  },

  /** The reaction entry: +1 per result applied to him by another character; the latest attacker is the Drill Shot's. */
  onResults(ctx, report) {
    const n = mem(ctx.self, BARALAI_HITS) + report.count;
    setMem(ctx.self, BARALAI_HITS, n);
    if (report.lastAttackerId !== undefined) setMem(ctx.self, BARALAI_LAST_ATTACKER, report.lastAttackerId);
    if (n >= DRILL_SHOT_AT - 1 && !mem(ctx.self, BARALAI_COUNT_NINE_CALLED)) {
      setMem(ctx.self, BARALAI_COUNT_NINE_CALLED, 1);
      ctx.emit({ type: 'script-trigger', name: BARALAI_COUNT_NINE, payload: { who: ctx.self.id } });
    }
  },
};

/** The three scripts, for the registry (`./index.ts`). */
export const bevelleGuardiansScripts: readonly AiScript[] = [x2GeorapellaScript, x2PreceptsGuardScript, x2BaralaiScript];
