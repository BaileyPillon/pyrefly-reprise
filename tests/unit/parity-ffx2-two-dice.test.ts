/**
 * **RE parity RC10, FFX-2 only: Lady Luck's Two Dice rolls its dice** (lane `re-parity-rc10-x2-minigames`; row E10 of the gap scan of 2026-10-17; source FFX2-H04, a private working note: Two Dice 0x30EB deals power x level for as many hits as the dice add up to; the kernel is pinned in parity-ffx2-die.test.ts).
 *
 * Game case: FFX-2 only (Trigger Happy and Lady Luck are FFX-2 content; nothing here is read from FFX.exe).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { expectedMinigameHits, simulateFFX2Command } from '../../src/battle/ffx2/simulate.ts';
import { bevelleParty, enemy, group, member } from '../../src/battle/ffx2/fixtures.ts';
import { DIE_CYCLE_LENGTH, DIE_ROWS, DIE_TRANSIENT_CALLS, coldDieGenerator, dieFace, dieGeneratorInCycle, dieValue } from '../../src/battle/ffx2/kernel/die.ts';
import { DIE_STATE_FLAG, rollDice } from '../../src/battle/ffx2/dice.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { FFX2_COMMAND_RECORDS } from '../../src/data/ffx2/command-records/index.ts';
import type { AbilityRegistry } from '../../src/battle/ffx2/index.ts';
import type { BattleEvent, BattleSetup, BattleState, Command, FFX2PartyBuild, Rng } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';

/** The real ability catalog (with the game's command rows attached), the way `BattleScreen` injects it. */
const catalog: AbilityRegistry = { get: (id) => data.ABILITIES[id] };

function setupWith(seed = 1, hp = 200000): BattleSetup {
  return {
    game: 'ffx2',
    party: bevelleParty(24, 'first-steps'),
    enemies: group('minigame-fixture', [enemy('boss', 'Boss', 'none', { hp, maxHp: hp, mp: 0, maxMp: 0, agi: 1 })]),
    triggers: [],
    seed,
    condition: 'scripted',
    canEscape: false,
  };
}

function driveToYuna(engine: FFX2Engine): void {
  for (let i = 0; i < 400; i++) {
    const decision = engine.nextDecision();
    if (decision.kind === 'player-input') {
      if (decision.actorId === 'yuna') return;
      engine.submit({ kind: 'defend', targets: [] });
      continue;
    }
    if (decision.kind === 'waiting') {
      engine.tick(decision.nextEventMs);
      continue;
    }
    if (decision.kind !== 'resolved') break;
  }
  throw new Error('Yuna never got a turn');
}

interface FixtureRow {
  id: number; category: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number; critByte: number; accuracy: number;
  power: number; hits: number; shatter: number; element: number; killer: number; costAtb: number; costCast: number; costMp: number; status1: object; status2: object; statusTime: object;
}
const ROWS = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/lady_luck_rows.json', import.meta.url)), 'utf8')) as Record<string, FixtureRow>;
describe('Two Dice: the rows are the game\'s (FFX2-H04 4.3)', () => {
  it.each([
    ['x2-lady-luck-two-dice', '0x30eb', 4],
    ['x2-lady-luck-two-dice-pair', '0x317d', 0],
    ['x2-lady-luck-two-dice-ones', '0x317e', 0],
  ])('%s is row %s, field for field (the MP is the base row\'s alone)', (id, key, mp) => {
    const rec = FFX2_COMMAND_RECORDS[id]!;
    const row = ROWS[key]!;
    expect(rec).toMatchObject({
      id: row.id, category: row.category, flagsTarget: row.flagsTarget, flagsMisc: row.flagsMisc, flagsDamage: row.flagsDamage, damageClass: row.damageClass,
      formula: row.formula, critByte: row.critByte, accuracy: row.accuracy, power: row.power, hits: row.hits, shatter: row.shatter, element: row.element,
      killer: row.killer, costAtb: row.costAtb, costCast: row.costCast,
    });
    expect(row.costMp).toBe(mp);
    expect(data.ABILITIES[id]?.ffx2Record).toBe(rec);
  });

  it('the row is "power x level" (formula 0x12) with accuracy formula 0, so a die cast never misses', () => {
    expect(ROWS['0x30eb']!.formula).toBe(0x12);
    expect((ROWS['0x30eb']!.flagsMisc >> 3) & 7).toBe(0);
  });

  it('Two Dice is aimed at one enemy, as Trigger Happy is: both rows carry the same target flags (0x433)', () => {
    expect(ROWS['0x30eb']!.flagsTarget).toBe(0x433);
    expect(data.ABILITIES['x2-gunner-trigger-happy']!.ffx2Record!.flagsTarget).toBe(ROWS['0x30eb']!.flagsTarget);
    for (const id of ['x2-lady-luck-two-dice', 'x2-lady-luck-two-dice-pair', 'x2-lady-luck-two-dice-ones']) expect(data.ABILITIES[id]!.targeting, id).toBe(data.ABILITIES['x2-gunner-trigger-happy']!.targeting);
  });

  it('the powers the dice swap between: 2, then 4 for a pair of 2 to 6, then 40 for two ones', () => {
    expect([ROWS['0x30eb']!.power, ROWS['0x317d']!.power, ROWS['0x317e']!.power]).toEqual([2, 4, 40]);
    expect(DIE_ROWS.twoDice).toBe(ROWS['0x30eb']!.id);
    expect(DIE_ROWS.twoDicePair).toBe(ROWS['0x317d']!.id);
    expect(DIE_ROWS.twoDiceOnes).toBe(ROWS['0x317e']!.id);
  });
});

/** Yuna as a Lady Luck who has learned Two Dice, with a boss that has no defence to speak of and a great deal of HP. */
function dicePartyWith(): FFX2PartyBuild {
  const base = bevelleParty(24, 'first-steps');
  const yuna = { ...member('yuna', 'Yuna', 'lady-luck', 24, 'first-steps', ['lady-luck']), abilitiesLearned: { 'lady-luck': { learned: ['x2-lady-luck-two-dice'], ap: 0 } } };
  return { ...base, members: [yuna, base.members[1]!, base.members[2]!] };
}

function castTwoDice(seed: number, preload?: number, command: Command = { kind: 'ability', id: 'x2-lady-luck-two-dice', targets: ['boss'] } as Command): { events: BattleEvent[]; engine: FFX2Engine } {
  const engine = new FFX2Engine({ minigames: true, abilities: catalog });
  engine.init({ ...setupWith(seed), party: dicePartyWith() });
  if (preload !== undefined) (engine.state() as { flags: Record<string, number> }).flags[DIE_STATE_FLAG] = preload;
  driveToYuna(engine);
  const out = [...engine.submit(command)];
  for (let i = 0; i < 600 && !out.some((e) => e.type === 'action-end' && e.actorId === 'yuna'); i++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') out.push(...engine.tick(d.nextEventMs));
    else if (d.kind === 'resolved') out.push(...d.events);
    else if (d.kind === 'player-input') out.push(...engine.submit({ kind: 'defend', targets: [] }));
    else break;
  }
  return { events: out, engine };
}


const DICE_VECTORS = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/dice_vectors.json', import.meta.url)), 'utf8')) as { values: string };

/** The generator's state word before call `index` of the cold walk (0-based), by the kernel the die test pins against the note's model. */
function stateBefore(index: number): number {
  const gen = coldDieGenerator();
  for (let i = 0; i < index; i++) dieValue(gen);
  return gen.state;
}

/** The first call index, past the transient, where the walk's next two faces are `a` then `b` (found in the note's own value list, not by the kernel). */
function callWithFaces(a: number, b: number): number {
  const v = DICE_VECTORS.values;
  for (let i = 1500; i < v.length - 1; i++) if (Number(v[i]) + 1 === a && Number(v[i + 1]) + 1 === b) return i;
  throw new Error(`no call with faces ${a}, ${b}`);
}

const hitsOf = (events: readonly BattleEvent[]) => events.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.targetId === 'boss');

describe('Two Dice: the cast rolls two dice and plays that many hits (FFX2-H04 3.9; gap scan S13 row E10)', () => {
  it('a cast does something: damage on the target, between two and twelve hits', () => {
    const { events } = castTwoDice(3);
    const hits = hitsOf(events);
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits.length).toBeLessThanOrEqual(12);
    expect(hits.every((e) => e.amount > 0)).toBe(true);
  });

  // The faces are set by placing the generator, so the sum and the swap are known before the cast: mixed faces keep the base row, a pair of 2 to 6 plays the
  // power-4 row, two ones the power-40 row; the first hit of each is the row's power x her level (24), with no chain behind it yet.
  it.each([
    [3, 5, 8],
    [1, 2, 3],
    [6, 5, 11],
    [4, 4, 8],
    [2, 2, 4],
    [6, 6, 12],
    [1, 1, 2],
  ])('faces %i and %i play %i hits', (a, b, sum) => {
    const { events } = castTwoDice(1, stateBefore(callWithFaces(a, b)));
    expect(hitsOf(events)).toHaveLength(sum);
  });

  it('the swap rows are 2 times and 20 times the base row, per hit (power 4 and 40 against 2)', () => {
    const first = (a: number, b: number): number => hitsOf(castTwoDice(1, stateBefore(callWithFaces(a, b))).events)[0]!.amount;
    const mixed = first(3, 5);
    expect(mixed).toBeGreaterThan(0);
    expect(first(4, 4)).toBe(mixed * 2);
    expect(first(1, 1)).toBe(mixed * 20);
  });

  it('the MP is paid once, 4, whichever row the dice fire', () => {
    for (const [a, b] of [[3, 5], [4, 4], [1, 1]] as const) {
      const { engine } = castTwoDice(1, stateBefore(callWithFaces(a, b)));
      expect(engine.state().combatants['yuna']!.mp, `${a},${b}`).toBe(engine.state().combatants['yuna']!.stats.maxMp - 4);
    }
  });

  it('the generator moves two calls a cast and the battle holds it (the next cast continues the walk)', () => {
    const at = callWithFaces(3, 5);
    const { engine } = castTwoDice(1, stateBefore(at));
    expect(engine.state().flags[DIE_STATE_FLAG]).toBe(stateBefore(at + 2));
  });

  it('the first roll of a battle places the generator in its cycle with one draw of the engine-side stream, and it is a function of the seed', () => {
    const run = (seed: number) => {
      const { engine, events } = castTwoDice(seed);
      return { state: engine.state().flags[DIE_STATE_FLAG] as number, hits: hitsOf(events).length };
    };
    const a = run(5);
    expect(run(5)).toEqual(a); // same seed, same dice
    // the state it left is some place of the cycle plus the cast's two calls, and the hits are those two faces' sum
    const placed = Array.from({ length: 185 }, (_, pos) => pos).filter((pos) => {
      const gen = dieGeneratorInCycle(pos);
      const faces = [dieFace(gen), dieFace(gen)];
      return gen.state === a.state && faces[0]! + faces[1]! === a.hits;
    });
    expect(placed.length).toBeGreaterThanOrEqual(1);
    const seen = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) seen.add(run(seed).hits);
    expect(seen.size).toBeGreaterThan(4); // not one fixed roll
  });

  // The placement draw is the engine's own modelling choice (HANDOFF section 6 item 1): one draw of `rng.aux` at a battle's first roll, uniform over the 185 positions
  // of the game's cycle. A mutant that draws `aux.int(0, 90)` places the generator in half the cycle and survived the first mutation pass, so the range is pinned
  // here directly on the seam (`rollDice`), with a recording stand-in for the stream and then with real streams.
  describe('the placement draw spans all 185 positions of the cycle', () => {
    const twoDiceAbility = data.ABILITIES['x2-lady-luck-two-dice']!;
    const freshBattle = (): BattleState => ({ flags: {} } as unknown as BattleState);
    const recordingAux = (position: number): { aux: Rng; calls: Array<[number, number]> } => {
      const calls: Array<[number, number]> = [];
      const aux = { int: (lo: number, hi: number): number => { calls.push([lo, hi]); return position; } } as unknown as Rng;
      return { aux, calls };
    };

    it('the first roll asks the engine-side stream for exactly one integer from 0 to 184, and the next roll in the same battle asks for none', () => {
      const { aux, calls } = recordingAux(7);
      const state = freshBattle();
      rollDice(state, aux, catalog, twoDiceAbility);
      expect(calls).toEqual([[0, DIE_CYCLE_LENGTH - 1]]);
      expect(DIE_CYCLE_LENGTH - 1).toBe(184);
      rollDice(state, aux, catalog, twoDiceAbility);
      expect(calls).toHaveLength(1);
    });

    it('every position 0 to 184 is a start the engine can take: 185 different generators, each the game\'s walk that many calls into the cycle, after the roll\'s two calls', () => {
      const after = new Set<number>();
      for (let position = 0; position < DIE_CYCLE_LENGTH; position++) {
        const { aux } = recordingAux(position);
        const state = freshBattle();
        const roll = rollDice(state, aux, catalog, twoDiceAbility)!;
        expect(state.flags[DIE_STATE_FLAG], `position ${position}`).toBe(stateBefore(DIE_TRANSIENT_CALLS + position + 2));
        const gen = dieGeneratorInCycle(position);
        expect(roll.faces, `position ${position}`).toEqual([dieFace(gen), dieFace(gen)]);
        after.add(state.flags[DIE_STATE_FLAG] as number);
      }
      expect(after.size).toBe(DIE_CYCLE_LENGTH);
    });

    it('4,000 battles on real streams reach all 185 start positions (and nothing outside the cycle)', () => {
      const starts = new Set<number>();
      for (let seed = 1; seed <= 4000; seed++) {
        const state = freshBattle();
        rollDice(state, new SeededRng(seed), catalog, twoDiceAbility);
        starts.add(state.flags[DIE_STATE_FLAG] as number);
      }
      const expected = new Set<number>();
      for (let position = 0; position < DIE_CYCLE_LENGTH; position++) expected.add(stateBefore(DIE_TRANSIENT_CALLS + position + 2));
      expect(starts).toEqual(expected);
    });
  });

  it('a command that rolls no dice takes no draw and leaves no generator in the battle', () => {
    const { engine } = castTwoDice(5, undefined, { kind: 'attack', targets: ['boss'] });
    expect(engine.state().flags[DIE_STATE_FLAG]).toBeUndefined();
  });

  it('Two Dice never misses: the row\'s accuracy formula is 0 (no miss event on any of 40 seeds)', () => {
    for (let seed = 1; seed <= 40; seed++) expect(castTwoDice(seed).events.some((e) => e.type === 'miss')).toBe(false);
  });
});

describe('Two Dice: the preview of the advisor quotes the dice without rolling them', () => {
  const twoDice = { kind: 'ability', id: 'x2-lady-luck-two-dice', targets: ['boss'] } as Command;

  function ready(): FFX2Engine {
    const engine = new FFX2Engine({ minigames: true, abilities: catalog });
    engine.init({ ...setupWith(1), party: dicePartyWith() });
    driveToYuna(engine);
    return engine;
  }

  it('the estimate is the sum of two faces at the end of the roll policy: 3, 7 and 11 hits on the base row, and Trigger Happy keeps its 6, 11 and 16', () => {
    const dice = data.ABILITIES['x2-lady-luck-two-dice']!;
    expect(['min', 'mid', 'max'].map((p) => expectedMinigameHits(dice, p as 'min' | 'mid' | 'max'))).toEqual([3, 7, 11]);
    const th = data.ABILITIES['x2-gunner-trigger-happy']!;
    expect(['min', 'mid', 'max'].map((p) => expectedMinigameHits(th, p as 'min' | 'mid' | 'max'))).toEqual([6, 11, 16]);
    expect(expectedMinigameHits(data.ABILITIES['x2-lady-luck-bribe']!, 'mid')).toBeNull();
  });

  it('a preview plays that many hits on the copy, and never touches the live battle (no generator, no draw)', () => {
    const engine = ready();
    const flagsBefore = JSON.stringify(engine.state().flags);
    const hpBefore = engine.state().combatants['boss']!.hp;
    const hitsAt = (roll: 'min' | 'mid' | 'max'): number => simulateFFX2Command(engine.state(), 'yuna', twoDice, { roll, abilities: catalog })!.hits;
    expect([hitsAt('min'), hitsAt('mid'), hitsAt('max')]).toEqual([3, 7, 11]);
    expect(JSON.stringify(engine.state().flags)).toBe(flagsBefore);
    expect(engine.state().combatants['boss']!.hp).toBe(hpBefore);
    expect(engine.state().flags[DIE_STATE_FLAG]).toBeUndefined();
  });
});
