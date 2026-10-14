/**
 * Valefor at Besaid (FFX-2 Chapter 3, the hidden chapter): her script and the fight in the real engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Her own AI script (`m164`) is not decompiled yet, so `src/battle/ffx2/ai/valefor.ts` is the research's description (`research/ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources]`) on the engine's
 * action counter; this file pins that reading (each rule tagged `[model]` in `docs/plans/ch-besaid-valefor-review.md` §2 and §3 is named as one below) so that a script read, when it lands,
 * changes exactly the tests it contradicts:
 *
 * 1. **The decision table** (a stub context, exact draws): AC read before the poll's own gain; Energy Ray on the marks 30 and 60, once each per cycle, no draw; Energy Blast at 100, AC back to 0 and
 *    both marks re-armed; otherwise `random() mod 3`, 0 Sonic Wings and 1 or 2 Normal Attack; a volley that passes both marks gives two Rays in a row; the reaction entry adds 5 per result.
 * 2. **The two positional moves** (preflight §4): Sonic Wings goes to the **back of the formation** (the highest slot among the living; Ormi's owner-approved stand-in D-018/q3) and draws nothing;
 *    Energy Ray reaches **every living girl** in the fixed formation, exactly as Energy Blast does, and never a girl who is down.
 * 3. **The real engine**: the order of her moves against a party that only defends (her own actions raise the counter: Rays on her 6th and 12th, the Blast on her 21st, the next cycle's Rays on
 *    her 27th and 33rd), Sonic Wings takes MP and never HP, and every Ray and Blast damages exactly the girls who are up.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { mem, setMem } from '../../../src/battle/ffx2/internal.ts';
import { AC, acOf } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import {
  VALEFOR_ABILITY,
  VALEFOR_AC_PER_ACTION,
  VALEFOR_AC_PER_RESULT,
  VALEFOR_RAY_30_FIRED,
  VALEFOR_RAY_60_FIRED,
  VALEFOR_RAY_MARKS,
  VALEFOR_SCRIPT,
  VALEFOR_SONIC_WINGS_ROLL,
  x2ValeforScript,
} from '../../../src/battle/ffx2/ai/valefor.ts';
import { besaidBuild } from '../../../src/data/ffx2/builds/besaid.ts';
import { besaidValeforGroup, VALEFOR_ID } from '../../../src/data/ffx2/enemies/valefor.ts';
import { evaluateObjective } from '../../../src/ui/common/chapterObjectives.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { VALEFOR_BESAID_ID } from '../../../src/data/chapter-ffx2-valefor-besaid.ts';
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

/** One poll that makes a plain Normal Attack on Yuna: roll 1 (`1 mod 3`), pick draw 0. */
const SWING: [number, number] = [1, 0];

describe('the counter and the marks (a stub context, exact draws)', () => {
  it('the constants are the research\'s: +5 an action, +5 a result, Rays on 30 and 60, the Overdrive at 100, Sonic Wings on roll 0 of 3', () => {
    expect([VALEFOR_AC_PER_ACTION, VALEFOR_AC_PER_RESULT]).toEqual([5, 5]);
    expect([...VALEFOR_RAY_MARKS]).toEqual([30, 60]);
    expect(VALEFOR_SONIC_WINGS_ROLL).toBe(0);
  });

  it('with nothing but her own actions the counter reaches 30 on her 6th, 60 on her 12th and 100 on her 20th: Ray, Ray, Blast on her 6th, 12th and 21st poll, then the same cycle again', () => {
    const b = valefor();
    const order: string[] = [];
    for (let poll = 1; poll <= 42; poll++) {
      const draws = b.rng.calls.length;
      b.rng.drain(); // a Ray or a Blast draws nothing, so the values queued for a swing would be left over
      const c = b.poll(...SWING);
      order.push(b.id(c)!);
      const specials = ([RAY, BLAST] as string[]).includes(b.id(c)!);
      expect(b.rng.calls.length - draws, `poll ${poll} draws`).toBe(specials ? 0 : 2); // a Ray or a Blast draws nothing; a swing draws the roll and the target
    }
    const specialsAt = order.flatMap((id, i) => (id === RAY || id === BLAST ? [`${i + 1}:${id.replace('x2-valefor-energy-', '')}`] : []));
    expect(specialsAt).toEqual(['6:ray', '12:ray', '21:blast', '27:ray', '33:ray', '42:blast']);
    expect(order.filter((id) => id === ATTACK)).toHaveLength(42 - 6);
  });

  it('AC is read before the poll\'s own gain: at 95 the poll gains to 100 and swings; the next poll is the Blast, AC back to 0 and both marks re-armed', () => {
    const b = valefor();
    setMem(b.self, AC, 95);
    setMem(b.self, VALEFOR_RAY_30_FIRED, 1);
    setMem(b.self, VALEFOR_RAY_60_FIRED, 1);
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(100);
    expect(b.id(b.poll())).toBe(BLAST);
    expect(acOf(b.self)).toBe(0);
    expect([mem(b.self, VALEFOR_RAY_30_FIRED), mem(b.self, VALEFOR_RAY_60_FIRED)]).toEqual([0, 0]);
    expect(b.targets(b.poll(...SWING))).toEqual(['yuna']);
    expect(acOf(b.self)).toBe(5);
  });

  it('a volley that passes both marks at once gives two Rays on her next two turns, the lower mark first, then a swing (no extra Ray)', () => {
    const b = valefor();
    setMem(b.self, AC, 65); // e.g. a ten-hit command: 13 results of 5
    expect(b.id(b.poll())).toBe(RAY);
    expect([mem(b.self, VALEFOR_RAY_30_FIRED), mem(b.self, VALEFOR_RAY_60_FIRED)]).toEqual([1, 0]);
    expect(b.id(b.poll())).toBe(RAY);
    expect([mem(b.self, VALEFOR_RAY_30_FIRED), mem(b.self, VALEFOR_RAY_60_FIRED)]).toEqual([1, 1]);
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(80); // 65 + three gains of 5
  });

  it('draws nothing for a Ray or a Blast, and no living girl means no move at all', () => {
    const b = valefor();
    setMem(b.self, AC, 25);
    const before = b.rng.calls.length;
    expect(b.id(b.poll())).toBe(RAY);
    expect(b.rng.calls.length).toBe(before);
    for (const girl of b.girls) girl.alive = false;
    expect(b.poll()).toBeNull();
  });
});

describe('the reaction entry: +5 for every result applied to her (the sibling aeons\' reading, tagged [model])', () => {
  it('each result from a girl adds 5; one from herself, or while she is stopped, asleep or petrified, adds nothing', () => {
    const b = valefor();
    const onResult = x2ValeforScript.onResult!;
    const girl = b.girls[0];
    for (let i = 1; i <= 4; i++) {
      onResult(b.ctx, girl, { id: 'attack' } as never);
      expect(acOf(b.self)).toBe(5 * i);
    }
    onResult(b.ctx, b.self, { id: ATTACK } as never);
    expect(acOf(b.self)).toBe(20);
    for (const status of ['stop', 'sleep', 'petrify', 'confuse', 'berserk', 'eject']) {
      const c = valefor();
      (c.self.statuses as Record<string, unknown>)[status] = { turns: 3 };
      onResult(c.ctx, c.girls[0], { id: 'attack' } as never);
      expect(acOf(c.self), status).toBe(0);
    }
  });

  it('a hit crosses a mark: from 28 one result makes 33, and her next poll is the Ray of the 30 mark', () => {
    const b = valefor();
    setMem(b.self, AC, 28);
    x2ValeforScript.onResult!(b.ctx, b.girls[1], { id: 'x2-white-mage-cure' } as never);
    expect(acOf(b.self)).toBe(33);
    expect(b.id(b.poll())).toBe(RAY); // AC 38 after her own gain, over the 30 mark and the flag clear
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
  });
});

describe('the mix: one in three is Sonic Wings, two in three a Normal Attack', () => {
  it('over 300 consecutive rolls (every residue 100 times) exactly 100 are Sonic Wings, each on the back of the formation', () => {
    const b = valefor();
    let wings = 0;
    for (let roll = 0; roll < 300; roll++) {
      setMem(b.self, AC, 0);
      setMem(b.self, VALEFOR_RAY_30_FIRED, 0);
      setMem(b.self, VALEFOR_RAY_60_FIRED, 0);
      b.rng.drain(); // Sonic Wings uses one draw, so the target value queued for an Attack would be left over
      const c = b.poll(roll, 0);
      if (b.id(c) === WINGS) {
        wings++;
        expect(roll % 3).toBe(0);
        expect(b.targets(c)).toEqual(['paine']);
      } else {
        expect(b.id(c)).toBe(ATTACK);
        expect(roll % 3).not.toBe(0);
      }
    }
    expect(wings).toBe(100);
  });

  it('Normal Attack picks a uniform living girl (the draw modulo the girls up, in slot order); with one girl up it draws nothing for the target', () => {
    const picks = [0, 1, 2].map((draw) => {
      const b = valefor();
      return b.targets(b.poll(1, draw))[0];
    });
    expect(picks).toEqual(['yuna', 'rikku', 'paine']);
    const b = valefor();
    b.girls[1].alive = false;
    b.girls[2].alive = false;
    const before = b.rng.calls.length;
    expect(b.targets(b.poll(1))).toEqual(['yuna']);
    expect(b.rng.calls.length - before).toBe(1); // the roll only
  });
});

describe('the positional model (preflight §4): Sonic Wings on the back of the formation, drawing nothing', () => {
  it('the furthest girl is the highest slot among the living: Paine, then Rikku, then Yuna', () => {
    const b = valefor();
    const wings = (): string[] => b.targets(b.poll(0)); // roll 0: Sonic Wings; nothing else is drawn
    setMem(b.self, AC, 0);
    const before = b.rng.calls.length;
    expect(wings()).toEqual(['paine']);
    expect(b.rng.calls.length - before).toBe(1); // the roll, and no draw for the target
    setMem(b.self, AC, 0);
    b.girls[2].alive = false;
    expect(wings()).toEqual(['rikku']);
    setMem(b.self, AC, 0);
    b.girls[1].alive = false;
    expect(wings()).toEqual(['yuna']);
  });

  it('a girl who has been removed from the field is not "furthest" either', () => {
    const b = valefor();
    b.girls[2].removed = true;
    expect(b.targets(b.poll(0))).toEqual(['rikku']);
  });
});

// ------------------------------------------------------------------ the real engine

type Input = Extract<Decision, { kind: 'player-input' }>;
type Ev = BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; amount?: number };

/** A fight against a party that only defends (it applies no result to her, so her counter rises on her own actions alone). */
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

/** The same preset at a level where the girls outlast 40 of her actions while only defending (a measurement rig, not a chapter). */
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
  it('her moves follow the counter: Energy Ray on her 6th and 12th action, Energy Blast on her 21st, the next Rays on her 27th and 33rd, the next Blast on her 42nd', () => {
    for (const seed of [1, 2, 3]) {
      const { log, over } = defendOnly(seed, sturdy, 42);
      const moves = herMoves(log);
      expect(over, `seed ${seed}: the sturdy party outlasts her`).toBe(false);
      expect(moves.length, `seed ${seed}`).toBeGreaterThanOrEqual(42);
      const at = moves.flatMap((id, i) => (id === RAY || id === BLAST ? [`${i + 1}:${id.replace('x2-valefor-energy-', '')}`] : []));
      expect(at.slice(0, 6), `seed ${seed}`).toEqual(['6:ray', '12:ray', '21:blast', '27:ray', '33:ray', '42:blast']);
      for (const id of moves) expect([ATTACK, WINGS, RAY, BLAST], id).toContain(id);
    }
  });

  it('Sonic Wings takes MP and never HP, from the back of the formation: the highest slot among the girls who are up', () => {
    let landed = 0;
    let onRikku = 0;
    for (let seed = 1; seed <= 12; seed++) {
      for (const move of hersByAction(defendOnly(seed, besaidBuild, 60).log, [WINGS])) {
        expect(move.hp, `seed ${seed}: Sonic Wings did HP damage`).toEqual([]);
        expect(move.mp.length, `seed ${seed}: one MP result at most`).toBeLessThanOrEqual(1);
        const furthest = [...ORDER].reverse().find((id) => move.upBefore.includes(id));
        for (const id of move.mp) {
          expect(id, `seed ${seed}: Sonic Wings' target`).toBe(furthest);
          landed += 1;
          if (id === 'rikku') onRikku += 1;
        }
      }
    }
    expect(landed, 'at least a few Sonic Wings landed on MP').toBeGreaterThanOrEqual(8);
    expect(onRikku, 'with Paine down the back of the formation is Rikku').toBeGreaterThanOrEqual(1);
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
    expect(magic).toBeGreaterThanOrEqual(10);
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
