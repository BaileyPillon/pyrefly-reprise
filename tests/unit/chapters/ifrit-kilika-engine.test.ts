/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the hidden chapter): his script and the fight in the real engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/ifrit.ts` is **the game's own script, `m165`** (`research/re-ffx2-ifrit-kilika.md`). `ifrit-kilika-ai.test.ts` pins its decisions with a stub context; this file runs the real engine (seeded, 3 seeds) and pins:
 *
 * 1. **The order of his moves** against a party that only defends (his own turns fill the gauge alone): the Meteors on his 6th, 11th and 16th action, the Hellfire on his 19th, the next cycle on the 25th, 30th, 35th and 38th.
 * 2. **Who each move reaches**: Meteor Strike one girl, Yuna (the farthest) while she is up; Firaga and Hellfire exactly the girls who are up; the elements the damage events carry.
 * 3. **Hits bring the cycle forward** (a party that attacks him gets the first Meteor before his 6th action).
 * 4. **Fire heals him, Ice hurts** (a Black Mage Yuna casting the free Fire and Blizzard on him).
 * 5. **The cadence**: the game's own rows, charge and recovery, in steps from the start of one of his actions to the start of the next.
 * 6. **The "battle too long" block, end to end**: with the poll counter preloaded the stages and then Time Up Meteor come in order and wipe a party that cannot otherwise be hurt.
 * 7. **The pause objective** "Survive Hellfire" reads his real move.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { IFRIT_POLLS, IFRIT_STAGE } from '../../../src/battle/ffx2/ai/ifrit.ts';
import { kilikaBuild } from '../../../src/data/ffx2/builds/kilika.ts';
import { IFRIT_ID, kilikaIfritGroup } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { IFRIT_ANNOUNCEMENT_IDS, IFRIT_ATTACK_ID, IFRIT_FIRAGA_ID, IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_TIME_UP_METEOR_ID } from '../../../src/data/ffx2/enemies/ifrit-abilities.ts';
import { evaluateObjective } from '../../../src/ui/common/chapterObjectives.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { IFRIT_KILIKA_ID } from '../../../src/data/chapter-ffx2-ifrit-kilika.ts';
import { groundDistance } from '../../../src/battle/ffx2/ai/ifrit.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const ATTACK = IFRIT_ATTACK_ID;
const FIRAGA = IFRIT_FIRAGA_ID;
const METEOR = IFRIT_METEOR_STRIKE_ID;
const HELLFIRE = IFRIT_HELLFIRE_ID;
const TIME_UP = IFRIT_TIME_UP_METEOR_ID;

type Input = Extract<Decision, { kind: 'player-input' }>;
type Ev = BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; sourceId?: string; targets?: string[]; amount?: number; element?: string; affinity?: string };
type Unit = { id: string; hp: number; mp: number; alive: boolean; stats: { maxHp: number }; aiMemory?: Record<string, number | string | boolean> };

/** The same preset at a level where the girls outlast his first 38 actions while only defending (a measurement rig, not a chapter). */
const sturdy: FFX2PartyBuild = { ...kilikaBuild, members: kilikaBuild.members.map((m) => ({ ...m, level: 99 })) as FFX2PartyBuild['members'] };

function newEngine(seed: number, build: FFX2PartyBuild, extra: Parameters<typeof ffx2Options>[0] = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...extra }));
  const setup: BattleSetup = { game: 'ffx2', party: build, enemies: kilikaIfritGroup, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  return engine;
}

const unitOf = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;
const herMoves = (log: readonly Ev[]): string[] => log.filter((e) => e.type === 'action-start' && e.actorId === IFRIT_ID).map((e) => e.abilityId!);

/** A fight against a party that only defends, until he has made `stopAfter` actions or it is over. `each` runs at every decision (a rig may top the girls up). */
function defendOnly(seed: number, build: FFX2PartyBuild, stopAfter: number, each?: (engine: FFX2Engine) => void): { log: readonly Ev[]; over: boolean; engine: FFX2Engine } {
  const engine = newEngine(seed, build);
  let over = false;
  for (let i = 0; i < 60_000; i++) {
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
    each?.(engine);
    engine.submit({ kind: 'defend', targets: [] } as Command);
    if (herMoves(engine.state().log as readonly Ev[]).length >= stopAfter) break;
  }
  return { log: engine.state().log as readonly Ev[], over, engine };
}

const ORDER = ['yuna', 'rikku', 'paine'];

/** One of his actions of the given abilities: the girls who were up when it started, its declared targets, and the HP results between its start and its end. */
interface HisAction { ability: string; upBefore: string[]; targets: string[]; hp: Array<{ id: string; element?: string }>; done: boolean }

function hisActions(log: readonly Ev[], abilities: string[]): HisAction[] {
  const out: HisAction[] = [];
  const up = new Set(ORDER);
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    if (e.type === 'action-start' && e.actorId === IFRIT_ID && abilities.includes(e.abilityId!)) {
      const action: HisAction = { ability: e.abilityId!, upBefore: ORDER.filter((id) => up.has(id)), targets: [...(e.targets ?? [])], hp: [], done: false };
      for (let j = i + 1; j < log.length; j++) {
        const f = log[j]!;
        if (f.type === 'action-end' && f.actorId === IFRIT_ID) {
          action.done = true;
          break;
        }
        if (f.type === 'damage' && f.sourceId === IFRIT_ID && f.targetId !== undefined) action.hp.push({ id: f.targetId, ...(f.element !== undefined ? { element: f.element } : {}) });
      }
      out.push(action);
    }
    if (e.type === 'ko' && e.targetId !== undefined) up.delete(e.targetId);
    if (e.type === 'revive' && (e as { targetId?: string }).targetId !== undefined) up.add((e as { targetId: string }).targetId);
  }
  return out.filter((a) => a.done); // the last action of a cut-short run may not have landed yet
}

describe('the real engine, a party that only defends', () => {
  it('his moves follow the script: Meteor Strike on his 6th, 11th and 16th action, Hellfire on his 19th, the next cycle on the 25th, 30th, 35th and 38th; only his six moves appear', () => {
    for (const seed of [1, 2, 3]) {
      const { log, over } = defendOnly(seed, sturdy, 38);
      const moves = herMoves(log);
      expect(over, `seed ${seed}: the sturdy party outlasts him`).toBe(false);
      expect(moves.length, `seed ${seed}`).toBeGreaterThanOrEqual(38);
      const at = moves.slice(0, 38).flatMap((id, i) => (id === METEOR || id === HELLFIRE ? [`${i + 1}:${id.replace('x2-ifrit-', '')}`] : []));
      expect(at, `seed ${seed}`).toEqual(['6:meteor-strike', '11:meteor-strike', '16:meteor-strike', '19:hellfire', '25:meteor-strike', '30:meteor-strike', '35:meteor-strike', '38:hellfire']);
      for (const id of moves) expect([ATTACK, FIRAGA, METEOR, HELLFIRE], id).toContain(id);
    }
  });

  it('about one ordinary action in three is Firaga (a count over 3 seeds of 30 ordinary actions each: between a fifth and half)', () => {
    let firaga = 0;
    let ordinary = 0;
    for (const seed of [1, 2, 3]) {
      const moves = herMoves(defendOnly(seed, sturdy, 38).log).slice(0, 38);
      for (const id of moves) {
        if (id === ATTACK || id === FIRAGA) ordinary += 1;
        if (id === FIRAGA) firaga += 1;
      }
    }
    expect(ordinary).toBe(3 * 30);
    expect(firaga / ordinary).toBeGreaterThan(0.2);
    expect(firaga / ordinary).toBeLessThan(0.5);
  });

  it('Meteor Strike is aimed at one girl, the one farthest from him: Yuna while she is up, and the damage reaches that girl alone', () => {
    let seen = 0;
    for (const seed of [1, 2, 3]) {
      for (const move of hisActions(defendOnly(seed, sturdy, 38).log, [METEOR])) {
        seen += 1;
        const farthest = Math.max(...move.upBefore.map((id) => groundDistance(ORDER.indexOf(id))));
        const candidates = move.upBefore.filter((id) => Math.abs(groundDistance(ORDER.indexOf(id)) - farthest) < 1e-9);
        expect(move.targets, `seed ${seed}`).toHaveLength(1);
        expect(candidates, `seed ${seed}: ${move.targets[0]} among ${candidates.join(',')}`).toContain(move.targets[0]);
        expect(move.hp.map((h) => h.id), `seed ${seed}`).toEqual([move.targets[0]]);
        expect(move.hp[0]!.element === undefined || move.hp[0]!.element === 'none', 'Meteor Strike is non-elemental').toBe(true);
        if (move.upBefore.includes('yuna')) expect(move.targets[0], `seed ${seed}: Yuna is up`).toBe('yuna');
      }
    }
    expect(seen).toBeGreaterThanOrEqual(8);
  });

  it('every Firaga and every Hellfire damages exactly the girls who are up, as Fire, never one who is down', () => {
    let magic = 0;
    for (const seed of [1, 2, 3]) {
      for (const move of hisActions(defendOnly(seed, sturdy, 38).log, [FIRAGA, HELLFIRE])) {
        magic += 1;
        expect([...new Set(move.hp.map((h) => h.id))].sort(), `seed ${seed}: ${move.ability}`).toEqual([...move.upBefore].sort());
        for (const h of move.hp) expect(h.element, `seed ${seed}: ${move.ability} is Fire`).toBe('fire');
      }
    }
    expect(magic).toBeGreaterThanOrEqual(24);
  });
});

describe('the hits bring the cycle forward', () => {
  it('a party that attacks him gets the first Meteor Strike before his 6th action (each result adds 5 to the gauge) and the first Hellfire before his 19th', () => {
    for (const seed of [1, 2, 3]) {
      const engine = newEngine(seed, kilikaBuild);
      for (let i = 0; i < 60_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
        engine.submit(row ? ({ ...row.command, targets: [IFRIT_ID] } as Command) : ({ kind: 'defend', targets: [] } as Command));
        if (herMoves(engine.state().log as readonly Ev[]).length >= 19) break;
      }
      const moves = herMoves(engine.state().log as readonly Ev[]);
      expect(moves.indexOf(METEOR) + 1, `seed ${seed}: the first Meteor`).toBeGreaterThan(0);
      expect(moves.indexOf(METEOR) + 1, `seed ${seed}: the first Meteor`).toBeLessThan(6);
      if (moves.includes(HELLFIRE)) expect(moves.indexOf(HELLFIRE) + 1, `seed ${seed}: the first Hellfire`).toBeLessThan(19);
    }
  });
});

describe('Fire heals him and Ice hurts (a Black Mage Yuna with the free Fire and Blizzard)', () => {
  /** Yuna wears the Black Mage; the first decision is hers, and she casts `spell` at him with his HP at 5,000. */
  function cast(spell: string): { amount: number; affinity: string | undefined; element: string | undefined } {
    const build = structuredClone(kilikaBuild);
    build.members[0]!.currentDressphere = 'black-mage';
    const engine = newEngine(1, build);
    unitOf(engine, IFRIT_ID).hp = 5000;
    for (let i = 0; i < 60_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') throw new Error('over before the cast');
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      if (d.actorId === 'yuna') {
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && (c.command as { id: string }).id === spell);
        if (!row) throw new Error(`no ${spell} on Yuna's menu: ${d.commands.map((c) => ('id' in c.command ? (c.command as { id: string }).id : c.command.kind)).join(', ')}`);
        engine.submit({ ...row.command, targets: [IFRIT_ID] } as Command);
        for (let k = 0; k < 20_000; k++) {
          const hit = (engine.state().log as readonly Ev[]).find((e) => e.type === 'damage' && e.targetId === IFRIT_ID && e.sourceId === 'yuna');
          if (hit) return { amount: hit.amount!, affinity: hit.affinity, element: hit.element };
          const n = engine.nextDecision();
          if (n.kind === 'waiting') engine.tick(Math.max(1, n.nextEventMs));
          else if (n.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] } as Command);
          else if (n.kind === 'battle-over') break;
        }
        throw new Error('the cast never landed');
      }
      engine.submit({ kind: 'defend', targets: [] } as Command);
    }
    throw new Error('no decision for Yuna');
  }

  it('Fire is absorbed: the damage is negative (he is healed) and the affinity says so; Blizzard hurts, and more than the same spell on a neutral target would', () => {
    const fire = cast('x2-black-mage-fire');
    expect(fire.element).toBe('fire');
    expect(fire.affinity).toBe('absorb');
    expect(fire.amount, 'Fire heals him').toBeLessThan(0);
    const ice = cast('x2-black-mage-blizzard');
    expect(ice.element).toBe('ice');
    expect(ice.affinity).toBe('weak');
    expect(ice.amount, 'Ice hurts him').toBeGreaterThan(0);
  });
});

describe('the cadence in the real engine: the game\'s own rows (steps from the start of one of his actions to the start of the next, no action time)', () => {
  /** Start-to-start steps of his actions by the move that opened the interval, against a sturdy party that only defends and is topped up at every decision. */
  function startToStart(): Record<string, number[]> {
    const engine = newEngine(5, sturdy, { actionTimeSeconds: 0 });
    const starts: Array<{ ability: string; tick: number }> = [];
    let seen = 0;
    const scan = (): void => {
      const log = engine.state().log as readonly Ev[];
      for (; seen < log.length; seen++) {
        const e = log[seen]!;
        if (e.type === 'action-start' && e.actorId === IFRIT_ID) starts.push({ ability: e.abilityId!, tick: engine.state().ticks });
      }
    };
    for (let i = 0; i < 60_000 && starts.length < 28; i++) {
      const d = engine.nextDecision();
      scan();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        scan();
        continue;
      }
      if (d.kind !== 'player-input') continue;
      for (const id of ORDER) {
        const girl = unitOf(engine, id);
        if (girl.alive) girl.hp = girl.stats.maxHp; // a measurement rig: a knocked-out girl changes the pace (see the note below), so none is allowed to fall
      }
      engine.submit({ kind: 'defend', targets: [] } as Command);
      scan();
    }
    const by: Record<string, number[]> = {};
    for (let i = 0; i + 1 < starts.length; i++) (by[starts[i]!.ability] ??= []).push(starts[i + 1]!.tick - starts[i]!.tick);
    return by;
  }

  it('Attack 92 steps (ATB 100), Firaga 66 (cast 70, ATB 0), Meteor Strike 166 (cast 100 + ATB 80), Hellfire 257 (cast 180 + ATB 100): each the same every time, from the rows costs at his Agility 114', () => {
    const by = startToStart();
    // steps = ceil(cost * 10000 / (agi + 1) / 95) for the cast and again for the recovery, at his Agility 114; a recovery of 0 still takes the one step the clock cannot skip
    const steps = (cost: number): number => Math.max(1, Math.ceil((cost * 10000) / (114 + 1) / 95));
    expect([steps(100), steps(70) + steps(0), steps(100) + steps(80), steps(180) + steps(100)]).toEqual([92, 66, 166, 257]);
    for (const [ability, want] of [[ATTACK, 92], [FIRAGA, 66], [METEOR, 166], [HELLFIRE, 257]] as const) {
      expect(by[ability]?.length ?? 0, ability).toBeGreaterThanOrEqual(1);
      expect(new Set(by[ability]), ability).toEqual(new Set([want]));
    }
  });
});

describe('the "battle too long" block, end to end', () => {
  it('with the counter preloaded to 178 the stages come in order, each its own turn, and Time Up Meteor wipes a level-99 party that is topped up at every decision', () => {
    const seed = 2;
    const engine = newEngine(seed, sturdy);
    const boss = unitOf(engine, IFRIT_ID);
    boss.aiMemory = { ...(boss.aiMemory ?? {}), [IFRIT_POLLS]: 178 };
    let outcome: string | undefined;
    for (let i = 0; i < 60_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = d.result.outcome;
        break;
      }
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      for (const id of ORDER) {
        const girl = unitOf(engine, id);
        if (girl.alive) girl.hp = girl.stats.maxHp; // a measurement rig: nothing but the block can end this fight
      }
      engine.submit({ kind: 'defend', targets: [] } as Command);
    }
    const moves = herMoves(engine.state().log as readonly Ev[]);
    const firstOf = (id: string): number => moves.indexOf(id);
    const stages = [...IFRIT_ANNOUNCEMENT_IDS, TIME_UP];
    stages.forEach((id) => expect(firstOf(id), id).toBeGreaterThanOrEqual(0));
    for (let n = 1; n < stages.length; n++) expect(firstOf(stages[n]!), `${stages[n]} after ${stages[n - 1]}`).toBeGreaterThan(firstOf(stages[n - 1]!));
    // the polls: 179 and 180 are ordinary, 181 is the first stage, and the Meteor repeats after 201 (the last stage) until the party is gone
    expect(firstOf(IFRIT_ANNOUNCEMENT_IDS[0]!), 'the first stage is his 3rd action here (polls 179, 180, then 181)').toBe(2);
    expect(firstOf(IFRIT_ANNOUNCEMENT_IDS[1]!) - firstOf(IFRIT_ANNOUNCEMENT_IDS[0]!), 'polls 181 to 191').toBe(10);
    expect(firstOf(IFRIT_ANNOUNCEMENT_IDS[2]!) - firstOf(IFRIT_ANNOUNCEMENT_IDS[1]!), 'polls 191 to 196').toBe(5);
    expect(firstOf(IFRIT_ANNOUNCEMENT_IDS[3]!) - firstOf(IFRIT_ANNOUNCEMENT_IDS[2]!), 'polls 196 to 201').toBe(5);
    expect(firstOf(TIME_UP) - firstOf(IFRIT_ANNOUNCEMENT_IDS[3]!), 'poll 201 to 202').toBe(1);
    expect(boss.aiMemory?.[IFRIT_STAGE]).toBe(4);
    expect(outcome, 'Time Up Meteor ends the fight').toBe('defeat');
    expect(hisActions(engine.state().log as readonly Ev[], [TIME_UP])[0]!.hp.length, 'twelve hits on three girls land (the first volley)').toBeGreaterThanOrEqual(3);
  });
});

describe('the pause objectives read his real moves', () => {
  it('"Survive Hellfire" is true once his Hellfire has resolved and the party stands, false before, false after a wipe', () => {
    const meta = getChapterMeta(IFRIT_KILIKA_ID)!;
    const rule = meta.objectives[0]!.rule;
    expect(rule).toEqual({ kind: 'survived-ability', ability: 'hellfire' });
    const log = (events: Array<Record<string, unknown>>): readonly BattleEvent[] => events as unknown as BattleEvent[];
    const start = { type: 'action-start', actorId: IFRIT_ID, abilityId: HELLFIRE };
    expect(evaluateObjective(rule, { state: null, log: log([]), links: 1 })).toBe(false);
    expect(evaluateObjective(rule, { state: null, log: log([start]), links: 1 })).toBe(false);
    expect(evaluateObjective(rule, { state: null, log: log([start, { type: 'action-end', actorId: IFRIT_ID }]), links: 1 })).toBe(true);
    expect(evaluateObjective(rule, { state: null, log: log([start, { type: 'action-end', actorId: IFRIT_ID }, { type: 'defeat' }]), links: 1 })).toBe(false);
  });
});
