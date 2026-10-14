/**
 * Valefor at Besaid (FFX-2 Chapter 3, the hidden chapter): her script and the fight in the real engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/valefor.ts` is **the game's own script, `m164`** (the RE session's review of 2026-10-14: "RE review 2026-10-14, m164, row 164, pos_bsyt05_229"; the first build was the
 * research's description, `research/ffx2-fallen-aeons.md` §7.1). What this file pins, each fact tagged `[script]` where the review gives it:
 *
 * 1. **The decision table** (a stub context, exact draws): the gauge is read BEFORE the turn's own gain and the Ray and Blast turns add nothing; the Blast at 100 resets the gauge and the Rays-fired
 *    counter; the Ray at 60 while fewer than 2 Rays have gone, and at 30 while none has; otherwise an attack-class turn adds 5 and rolls `random() mod 3` (0 Sonic Wings, 1 or 2 Normal Attack), one draw
 *    per such turn; with nobody hitting her the Rays come on her 7th and 14th turn and the Blast on her 23rd; the reaction adds 5 per result.
 * 2. **The targets, from the Besaid scene's start positions** (`pos_bsyt05_229`: the boss at (0, 26), Yuna (0, -27), Rikku (-12, -25), Paine (12, -25)): the Attack is a near-weighted pick (Yuna 41.9
 *    percent, Rikku 29.1, Paine 29.0); Sonic Wings goes to the greatest ground distance (Yuna, 53.00 against 52.39), an unambiguous extreme drawing nothing and exact ties near-weighted; Energy Ray and
 *    Energy Blast reach every living girl.
 * 3. **The moves' classes**: Energy Ray is magical (Shell applies), **Energy Blast is neither physical nor magical (neither Shell nor Protect reduces it)**, Sonic Wings is physical and never misses.
 * 4. **The real engine**: against a party that only defends (her own turns fill the gauge alone) her moves follow the script to the turn, Sonic Wings takes MP and never HP from the farthest girl, and every Ray
 *    and Blast damages exactly the girls who are up.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { mem, setMem } from '../../../src/battle/ffx2/internal.ts';
import { resolveCommand, accuracyFormula } from '../../../src/battle/ffx2/adapt/command.ts';
import { AC, acOf } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { SCENES, damageBits, pickIndexByWeights, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  VALEFOR_ABILITY,
  VALEFOR_AC_PER_ACTION,
  VALEFOR_AC_PER_RESULT,
  VALEFOR_RAYS_FIRED,
  VALEFOR_RAYS_PER_CYCLE,
  VALEFOR_RAY_MARKS,
  VALEFOR_SCENE,
  VALEFOR_SCRIPT,
  VALEFOR_SONIC_WINGS_ROLL,
  groundDistance,
  x2ValeforScript,
} from '../../../src/battle/ffx2/ai/valefor.ts';
import { besaidBuild } from '../../../src/data/ffx2/builds/besaid.ts';
import { besaidValeforGroup, VALEFOR_ID, x2Valefor } from '../../../src/data/ffx2/enemies/valefor.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import { evaluateObjective } from '../../../src/ui/common/chapterObjectives.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { VALEFOR_BESAID_ID } from '../../../src/data/chapter-ffx2-valefor-besaid.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const ATTACK = VALEFOR_ABILITY.attack;
const WINGS = VALEFOR_ABILITY.sonicWings;
const RAY = VALEFOR_ABILITY.energyRay;
const BLAST = VALEFOR_ABILITY.energyBlast;

/** A fresh bench: Valefor (slot 0) against Yuna, Rikku and Paine, on her script. */
function valefor(): Bench {
  const self = enemy(VALEFOR_ID, 8430, { mp: 9999 });
  return bench(self, VALEFOR_SCRIPT);
}

/** One attack-class poll that makes a Normal Attack on Yuna: roll 1 (`1 mod 3`), target draw 0 (the first weight). */
const SWING: [number, number] = [1, 0];

describe('the gauge and the marks (a stub context, exact draws) [script]', () => {
  it('the constants are the script\'s: +5 an attack-class turn, +5 a result, Rays at 30 and 60 (two a cycle), the Blast at 100, Sonic Wings on roll 0 of 3', () => {
    expect([VALEFOR_AC_PER_ACTION, VALEFOR_AC_PER_RESULT]).toEqual([5, 5]);
    expect([...VALEFOR_RAY_MARKS]).toEqual([30, 60]);
    expect(VALEFOR_RAYS_PER_CYCLE).toBe(2);
    expect(VALEFOR_SONIC_WINGS_ROLL).toBe(0);
  });

  it('with nobody hitting her the Rays come on her 7th and 14th turn and the Blast on her 23rd, then the same cycle again (30th, 37th, 46th); a Ray or a Blast draws nothing, a swing draws the roll and the target', () => {
    const b = valefor();
    const order: string[] = [];
    for (let poll = 1; poll <= 46; poll++) {
      const draws = b.rng.calls.length;
      b.rng.drain(); // a Ray or a Blast draws nothing, so the values queued for a swing would be left over
      const c = b.poll(...SWING);
      order.push(b.id(c)!);
      const special = ([RAY, BLAST] as string[]).includes(b.id(c)!);
      expect(b.rng.calls.length - draws, `poll ${poll} draws`).toBe(special ? 0 : 2);
    }
    const specialsAt = order.flatMap((id, i) => (id === RAY || id === BLAST ? [`${i + 1}:${id.replace('x2-valefor-energy-', '')}`] : []));
    expect(specialsAt).toEqual(['7:ray', '14:ray', '23:blast', '30:ray', '37:ray', '46:blast']);
    expect(order.filter((id) => id === ATTACK)).toHaveLength(46 - 6);
  });

  it('the gauge is read BEFORE the turn\'s own gain, and a Ray or Blast turn adds nothing: at 30 the Ray leaves it at 30; at 95 the next turn gains to 100 and swings, and the turn after is the Blast', () => {
    const b = valefor();
    setMem(b.self, AC, 30);
    expect(b.id(b.poll())).toBe(RAY);
    expect(acOf(b.self)).toBe(30);
    expect(mem(b.self, VALEFOR_RAYS_FIRED)).toBe(1);
    const c = valefor();
    setMem(c.self, AC, 95);
    setMem(c.self, VALEFOR_RAYS_FIRED, 2);
    expect(c.id(c.poll(...SWING))).toBe(ATTACK);
    expect(acOf(c.self)).toBe(100);
    expect(c.id(c.poll())).toBe(BLAST);
    expect([acOf(c.self), mem(c.self, VALEFOR_RAYS_FIRED)]).toEqual([0, 0]); // the Blast resets the gauge and the Rays-fired counter
    expect(c.targets(c.poll(...SWING))).toEqual(['yuna']);
    expect(acOf(c.self)).toBe(5);
  });

  it('between the marks with one Ray gone the turn is an attack-class turn (no third Ray): at 45 with one Ray fired the gauge gains to 50', () => {
    const b = valefor();
    setMem(b.self, AC, 45);
    setMem(b.self, VALEFOR_RAYS_FIRED, 1);
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(50);
    expect(mem(b.self, VALEFOR_RAYS_FIRED)).toBe(1);
  });

  it('a gauge that jumps past both marks (a ten-hit volley) gives two Rays on her next two turns, then an attack-class turn; the gauge itself does not move on the Ray turns', () => {
    const b = valefor();
    setMem(b.self, AC, 65);
    expect(b.id(b.poll())).toBe(RAY);
    expect(mem(b.self, VALEFOR_RAYS_FIRED)).toBe(1);
    expect(b.id(b.poll())).toBe(RAY);
    expect(mem(b.self, VALEFOR_RAYS_FIRED)).toBe(2);
    expect(acOf(b.self)).toBe(65);
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(70);
  });

  it('draws nothing for a Ray or a Blast, and no living girl means no move at all', () => {
    const b = valefor();
    setMem(b.self, AC, 30);
    const before = b.rng.calls.length;
    expect(b.id(b.poll())).toBe(RAY);
    expect(b.rng.calls.length).toBe(before);
    for (const girl of b.girls) girl.alive = false;
    expect(b.poll()).toBeNull();
  });
});

describe('the reaction entry: +5 for every result applied to her [script]', () => {
  it('each result from a girl adds 5; one from herself adds nothing', () => {
    const b = valefor();
    const onResult = x2ValeforScript.onResult!;
    for (let i = 1; i <= 4; i++) {
      onResult(b.ctx, b.girls[0], { id: 'attack' } as never);
      expect(acOf(b.self)).toBe(5 * i);
    }
    onResult(b.ctx, b.self, { id: ATTACK } as never);
    expect(acOf(b.self)).toBe(20);
  });

  it('a hit crosses a mark: from 28 one result makes 33, and her next turn is the Ray (the gauge as it stands, 33), then a swing', () => {
    const b = valefor();
    setMem(b.self, AC, 28);
    x2ValeforScript.onResult!(b.ctx, b.girls[1], { id: 'x2-white-mage-cure' } as never);
    expect(acOf(b.self)).toBe(33);
    expect(b.id(b.poll())).toBe(RAY);
    expect(acOf(b.self)).toBe(33);
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(38);
  });
});

describe('the mix: one in three is Sonic Wings, two in three a Normal Attack [script]', () => {
  it('over 300 consecutive rolls (every residue 100 times) exactly 100 are Sonic Wings, each on Yuna, the farthest girl, with no draw for the target', () => {
    const b = valefor();
    let wings = 0;
    for (let roll = 0; roll < 300; roll++) {
      setMem(b.self, AC, 0);
      setMem(b.self, VALEFOR_RAYS_FIRED, 0);
      b.rng.drain(); // Sonic Wings uses one draw, so the target value queued for an Attack would be left over
      const before = b.rng.calls.length;
      const c = b.poll(roll, 0);
      if (b.id(c) === WINGS) {
        wings++;
        expect(roll % 3).toBe(0);
        expect(b.targets(c)).toEqual(['yuna']);
        expect(b.rng.calls.length - before, 'the roll and nothing else').toBe(1);
      } else {
        expect(b.id(c)).toBe(ATTACK);
        expect(roll % 3).not.toBe(0);
        expect(b.rng.calls.length - before, 'the roll and the target').toBe(2);
      }
    }
    expect(wings).toBe(100);
  });
});

describe('the targets, from the Besaid scene\'s start positions [script]', () => {
  it('the scene is the game\'s `pos_bsyt05_229`: the boss at (0, 26), Yuna (0, -27), Rikku (-12, -25), Paine (12, -25)', () => {
    expect(VALEFOR_SCENE).toBe(SCENES.besaid);
    expect(VALEFOR_SCENE.boss).toEqual({ x: 0, z: 26 });
    expect(VALEFOR_SCENE.girls).toEqual([{ x: 0, z: -27 }, { x: -12, z: -25 }, { x: 12, z: -25 }]);
    expect(groundDistance(0)).toBeCloseTo(53.0, 2);
    expect(groundDistance(1)).toBeCloseTo(52.39, 2);
    expect(groundDistance(2)).toBeCloseTo(52.39, 2);
  });

  it('the Attack\'s weights give Yuna 41.9 percent, Rikku 29.1 and Paine 29.0 (the whole range of one draw: 597, 415 and 414 of 1,426 values)', () => {
    const weights = sceneWeights(VALEFOR_SCENE, [0, 1, 2]);
    expect(weights).toEqual([596, 415, 415]);
    const counts = [0, 0, 0];
    for (let raw = 0; raw < 1426; raw++) counts[pickIndexByWeights(raw, weights)]! += 1;
    expect(counts).toEqual([597, 415, 414]);
    expect(counts.map((n) => Math.round((1000 * n) / 1426) / 10)).toEqual([41.9, 29.1, 29.0]);
  });

  it('the Attack picks by those weights: the draws 0 and 596 are Yuna, 597 and 1,011 Rikku, 1,012 and 1,425 Paine; with one girl up it draws nothing for the target', () => {
    const picks = [0, 596, 597, 1011, 1012, 1425].map((raw) => {
      const b = valefor();
      return b.targets(b.poll(1, raw))[0];
    });
    expect(picks).toEqual(['yuna', 'yuna', 'rikku', 'rikku', 'paine', 'paine']);
    const b = valefor();
    b.girls[1].alive = false;
    b.girls[2].alive = false;
    const before = b.rng.calls.length;
    expect(b.targets(b.poll(1))).toEqual(['yuna']);
    expect(b.rng.calls.length - before).toBe(1); // the roll only
  });

  it('Sonic Wings goes to the greatest ground distance: Yuna while she is up (no draw for the target); with Yuna down Rikku and Paine tie at 52.39 and the pick is near-weighted among the two (one draw)', () => {
    const up = valefor();
    const before = up.rng.calls.length;
    expect(up.targets(up.poll(0))).toEqual(['yuna']);
    expect(up.rng.calls.length - before).toBe(1);
    const weights = sceneWeights(VALEFOR_SCENE, [1, 2]);
    expect(weights).toEqual([415, 415]);
    const half = weights[0]!; // the first slot owns the extra value: raw mod 830 of 0..415 is Rikku, 416..829 Paine
    for (const [raw, who] of [[0, 'rikku'], [half, 'rikku'], [half + 1, 'paine'], [2 * half - 1, 'paine']] as const) {
      const b = valefor();
      b.girls[0].alive = false;
      const draws = b.rng.calls.length;
      expect(b.targets(b.poll(0, raw)), `draw ${raw}`).toEqual([who]);
      expect(b.rng.calls.length - draws, 'the roll and one target draw').toBe(2);
    }
    const lone = valefor();
    lone.girls[0].alive = false;
    lone.girls[1].alive = false;
    expect(lone.targets(lone.poll(0))).toEqual(['paine']); // one candidate left: no draw
    const removed = valefor();
    removed.girls[0].removed = true;
    removed.girls[2].alive = false;
    expect(removed.targets(removed.poll(0))).toEqual(['rikku']);
  });

  it('Energy Ray and Energy Blast name no target: they reach every living girl, as the targeting says (the whole party in the fixed formation)', () => {
    expect(ABILITIES[RAY]!.targeting).toBe('all-enemies');
    expect(ABILITIES[BLAST]!.targeting).toBe('all-enemies');
    const b = valefor();
    setMem(b.self, AC, 30);
    expect(b.targets(b.poll())).toEqual([]); // an all-enemies move carries no target list
  });
});

describe('the moves\' classes (the damage bits Shell and Protect read, and the hit check)', () => {
  const user = aiUnit(VALEFOR_ID, 'enemy', 8430, 0);
  user.enemy = { aiScriptId: VALEFOR_SCRIPT, formIndex: 0, forms: [], rewards: x2Valefor.rewards };

  it('Energy Ray is magical (Shell applies), Energy Blast is neither physical nor magical (neither Shell nor Protect reduces it), Sonic Wings and the Attack are physical (Protect applies)', () => {
    const bits = (id: string): number => damageBits(ABILITIES[id]!, user);
    expect(bits(RAY)).toBe(2);
    expect(bits(BLAST)).toBe(0);
    expect(bits(WINGS)).toBe(1);
    expect(bits(ATTACK)).toBe(1);
  });

  it('Sonic Wings never misses (accuracy formula 0) and takes MP only; the Ray and the Blast never miss; the plain Attack is the one move that rolls (accuracy formula 2)', () => {
    const accuracy = (id: string): number => accuracyFormula(resolveCommand(ABILITIES[id]!, user).record.flagsMisc);
    expect(accuracy(WINGS)).toBe(0);
    expect(accuracy(RAY)).toBe(0);
    expect(accuracy(BLAST)).toBe(0);
    expect(accuracy(ATTACK)).toBe(2);
    expect(resolveCommand(ABILITIES[WINGS]!, user).record.damageClass & 2, 'MP damage').toBe(2);
  });
});

// ------------------------------------------------------------------ the real engine

type Input = Extract<Decision, { kind: 'player-input' }>;
type Ev = BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; amount?: number };

/** A fight against a party that only defends (it applies no result to her, so her gauge rises on her own turns alone). */
function defendOnly(seed: number, build: FFX2PartyBuild, stopAfterHerActions: number): { log: readonly Ev[]; over: boolean } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const setup: BattleSetup = { game: 'ffx2', party: build, enemies: besaidValeforGroup, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  let over = false;
  for (let i = 0; i < 40_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      over = true;
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    void (d as Input);
    engine.submit({ kind: 'defend', targets: [] } as Command);
    const hers = (engine.state().log as readonly Ev[]).filter((e) => e.type === 'action-start' && e.actorId === VALEFOR_ID).length;
    if (hers >= stopAfterHerActions) break;
  }
  return { log: engine.state().log as readonly Ev[], over };
}

const herMoves = (log: readonly Ev[]): string[] => log.filter((e) => e.type === 'action-start' && e.actorId === VALEFOR_ID).map((e) => e.abilityId!);

/** The same preset at a level where the girls outlast 46 of her actions while only defending (a measurement rig, not a chapter). */
const sturdy: FFX2PartyBuild = { ...besaidBuild, members: besaidBuild.members.map((m) => ({ ...m, level: 99 })) as FFX2PartyBuild['members'] };

const ORDER = ['yuna', 'rikku', 'paine'];

/** One of her actions of the given abilities: the girls who were up when it started, and the HP and MP results between its start and its end. */
interface HerAction { ability: string; upBefore: string[]; hp: string[]; mp: string[] }

function hersByAction(log: readonly Ev[], abilities: string[]): HerAction[] {
  const out: HerAction[] = [];
  const up = new Set(ORDER);
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    if (e.type === 'action-start' && e.actorId === VALEFOR_ID && abilities.includes(e.abilityId!)) {
      const action: HerAction = { ability: e.abilityId!, upBefore: ORDER.filter((id) => up.has(id)), hp: [], mp: [] };
      for (let j = i + 1; j < log.length; j++) {
        const f = log[j]!;
        if (f.type === 'action-end' && f.actorId === VALEFOR_ID) break;
        if (f.type === 'damage') action.hp.push(String(f.targetId));
        if (f.type === 'mp-damage') action.mp.push(String(f.targetId));
      }
      out.push(action);
    }
    if (e.type === 'ko' && e.targetId !== undefined) up.delete(e.targetId);
    if (e.type === 'revive' && (e as { targetId?: string }).targetId !== undefined) up.add((e as { targetId: string }).targetId);
  }
  return out;
}

describe('the real engine, a party that only defends', () => {
  it('her moves follow the script: Energy Ray on her 7th and 14th action, Energy Blast on her 23rd, the next Rays on her 30th and 37th, the next Blast on her 46th', () => {
    for (const seed of [1, 2, 3]) {
      const { log, over } = defendOnly(seed, sturdy, 46);
      const moves = herMoves(log);
      expect(over, `seed ${seed}: the sturdy party outlasts her`).toBe(false);
      expect(moves.length, `seed ${seed}`).toBeGreaterThanOrEqual(46);
      const at = moves.flatMap((id, i) => (id === RAY || id === BLAST ? [`${i + 1}:${id.replace('x2-valefor-energy-', '')}`] : []));
      expect(at.slice(0, 6), `seed ${seed}`).toEqual(['7:ray', '14:ray', '23:blast', '30:ray', '37:ray', '46:blast']);
      for (const id of moves) expect([ATTACK, WINGS, RAY, BLAST], id).toContain(id);
    }
  });

  it('Sonic Wings takes MP and never HP, from the girl at the greatest ground distance among those up: Yuna, else Rikku or Paine (tied)', () => {
    let landed = 0;
    let onYuna = 0;
    let onTied = 0;
    for (let seed = 1; seed <= 12; seed++) {
      for (const move of hersByAction(defendOnly(seed, besaidBuild, 60).log, [WINGS])) {
        expect(move.hp, `seed ${seed}: Sonic Wings did HP damage`).toEqual([]);
        expect(move.mp.length, `seed ${seed}: one MP result at most`).toBeLessThanOrEqual(1);
        const farthest = Math.max(...move.upBefore.map((id) => groundDistance(ORDER.indexOf(id))));
        const candidates = move.upBefore.filter((id) => Math.abs(groundDistance(ORDER.indexOf(id)) - farthest) < 1e-9);
        for (const id of move.mp) {
          expect(candidates, `seed ${seed}: Sonic Wings' target ${id} among ${candidates.join(',')}`).toContain(id);
          landed += 1;
          if (id === 'yuna') onYuna += 1;
          else onTied += 1;
        }
      }
    }
    expect(landed, 'at least a few Sonic Wings landed on MP').toBeGreaterThanOrEqual(8);
    expect(onYuna, 'while Yuna is up she is the one it lands on').toBeGreaterThanOrEqual(4);
    expect(onTied, 'with Yuna down it lands on Rikku or Paine').toBeGreaterThanOrEqual(1);
  });

  it('every Energy Ray and Energy Blast damages exactly the girls who are up, never one who is down', () => {
    let magic = 0;
    let withADownGirl = 0;
    for (let seed = 1; seed <= 12; seed++) {
      for (const move of hersByAction(defendOnly(seed, besaidBuild, 60).log, [RAY, BLAST])) {
        magic += 1;
        expect([...new Set(move.hp)].sort(), `seed ${seed}: ${move.ability}`).toEqual([...move.upBefore].sort());
        if (move.upBefore.length < 3) withADownGirl += 1;
      }
    }
    expect(magic).toBeGreaterThanOrEqual(8);
    expect(withADownGirl, 'at least one Ray or Blast came with a girl already down').toBeGreaterThanOrEqual(1);
  });
});

describe('the pause objectives read her real moves', () => {
  it('"Survive Energy Blast" is true once her Energy Blast has resolved and the party stands, false before, false after a wipe', () => {
    const meta = getChapterMeta(VALEFOR_BESAID_ID)!;
    const rule = meta.objectives[0]!.rule;
    expect(rule).toEqual({ kind: 'survived-ability', ability: 'energy-blast' });
    const log = (events: Array<Record<string, unknown>>): readonly BattleEvent[] => events as unknown as BattleEvent[];
    const start = { type: 'action-start', actorId: VALEFOR_ID, abilityId: BLAST };
    expect(evaluateObjective(rule, { state: null, log: log([]), links: 1 })).toBe(false);
    expect(evaluateObjective(rule, { state: null, log: log([start]), links: 1 })).toBe(false);
    expect(evaluateObjective(rule, { state: null, log: log([start, { type: 'action-end', actorId: VALEFOR_ID }]), links: 1 })).toBe(true);
    expect(evaluateObjective(rule, { state: null, log: log([start, { type: 'action-end', actorId: VALEFOR_ID }, { type: 'defeat' }]), links: 1 })).toBe(false);
  });
});
