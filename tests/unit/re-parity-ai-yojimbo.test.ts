/**
 * **Yojimbo follows his own script** (re-parity, AI lane C; FFX only; Chapter IX, the Cavern of the Stolen Fayth).
 *
 * The decision table is `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 3 (m288 in `nagi05_10`, run in the note's
 * interpreter over all 65,536 results of the shared random number); the engine rules it relies on are section 1.1
 * (`onHit` once per target per sub-action, after its last hit record, before the death check; what a hook queues is filtered
 * by `isCounterattackAllowed()`), 1.5 (the random sources) and 1.6 (the opening). Rows D-10 to D-14 of its section 8:
 *
 *   D-10 his first turn is a Summon aimed at the summoner; the gauge does not move
 *   D-11 the odds inside a band are exact: 80 to 99 W 25 / K 25 / D 50; 50 to 79 W 20 / K 20 / D 60; 25 to 49 K 25 / D 75
 *   D-12 Zanmato zeroes the gauge and the turn's common +2 then makes it 2
 *   D-13 the "+3" is a hit event: once per action per target after its last hit, a miss counts, counter-attacks and a Threatened
 *        Yojimbo do not charge it
 *   D-14 the opening: Yojimbo's CTB is 0 and each party counter is one tick later
 */

import { describe, expect, it } from 'vitest';
import type { Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { yojimboOdds, yojimboPool } from '../../src/battle/ffx/ai/yojimbo-rules.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const BOSS = 'yojimbo';
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const PARTY = ['lulu', 'kimahri', 'yuna'];

type Fight = LiveBattle & { boss: FFXCombatant; rng: ScriptedRng; mem: Record<string, number | string | boolean> };

function fight(): Fight {
  const live = liveBattle('yojimbo-cavern', { party: yojimboCavernBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, boss: live.at(BOSS), rng, mem: rtOf(live.ctx, BOSS).ai };
}

/** A fight past his Summon turn, the gauge set. */
function turns(gauge = 0): Fight {
  const t = fight();
  chooseAiCommand(t.ctx, t.boss);
  t.boss.overdrive!.gauge = gauge;
  t.rng.calls.length = 0;
  return t;
}

const gauge = (t: Fight): number => t.boss.overdrive!.gauge;
const swing = (t: Fight, who = 'lulu', id = 'attack'): void =>
  void resolveAbility(t.ctx, t.at(who), t.ctx.content.ability(id)!, [BOSS]);

describe('his first turn (D-10; m288 f2 @0x1DD, row 1)', () => {
  it('is a Summon aimed at Lady Ginnem, with no draw, and the gauge does not move (no +2)', () => {
    const t = fight();
    t.boss.overdrive!.gauge = 30;
    const first = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(first), [...first!.targets]]).toEqual(['yojimbo-summon', ['ginnem']]);
    expect(gauge(t)).toBe(30);
    expect(t.rng.calls).toEqual([]);
    t.boss.overdrive!.gauge = 0;
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'and his second turn is an ordinary one').toBe('yojimbo-daigoro');
  });

  it('resolves as an action that hurts nobody and does not charge his own gauge', () => {
    const t = fight();
    const result = executeCommand(t.ctx, t.boss, chooseAiCommand(t.ctx, t.boss)!, true);
    expect(result.damageDealt).toBe(0);
    expect(t.events.some((e) => e.type === 'damage' || e.type === 'miss')).toBe(false);
    expect(gauge(t), 'his own Summon is not a hit on him').toBe(0);
  });
});

describe('the odds inside each gauge band (D-11; rows 3 to 6), all 65,536 results', () => {
  /** Every raw result of `GetRandomValue()`, taken through his turn on a board with three living targets. */
  function tally(g: number): Map<string, number> {
    const t = turns(g);
    const counts = new Map<string, number>();
    for (let v = 0; v <= 0xffff; v++) {
      t.boss.overdrive!.gauge = g;
      t.rng.set(v, 0);
      const move = idOf(chooseAiCommand(t.ctx, t.boss));
      counts.set(move, (counts.get(move) ?? 0) + 1);
    }
    return counts;
  }

  it('80 to 99: Wakizashi 25.000, Kozuka 25.000, Daigoro 50.000 (mod 4)', () => {
    const counts = tally(80);
    expect(Object.fromEntries(counts)).toEqual({ 'yojimbo-wakizashi': 16_384, 'yojimbo-kozuka': 16_384, 'yojimbo-daigoro': 32_768 });
    expect(yojimboOdds(99).map((o) => o.of65536)).toEqual([16_384, 16_384, 32_768]);
  });

  it('50 to 79: Wakizashi 13,108, Kozuka 13,107, Daigoro 39,321 (mod 5: 20.001, 20.000, 59.999)', () => {
    const counts = tally(50);
    expect(Object.fromEntries(counts)).toEqual({ 'yojimbo-wakizashi': 13_108, 'yojimbo-kozuka': 13_107, 'yojimbo-daigoro': 39_321 });
    expect(yojimboOdds(79).map((o) => o.of65536)).toEqual([13_108, 13_107, 39_321]);
  });

  it('25 to 49: Kozuka 25, Daigoro 75 (mod 4); below 25 only Daigoro, with no draw', () => {
    expect(Object.fromEntries(tally(25))).toEqual({ 'yojimbo-kozuka': 16_384, 'yojimbo-daigoro': 49_152 });
    const t = turns(24);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('yojimbo-daigoro');
    expect(t.rng.calls, 'no GetRandomValue below 25').toEqual([]);
    expect(yojimboPool(24)).toEqual(['yojimbo-daigoro']);
  });

  it('a Wakizashi or Kozuka picks one living front-line member after the roll: a draw only with two or more standing', () => {
    const t = turns(80);
    t.rng.set(0, 2); // mod 4 = 0: Wakizashi; the pick answers index 2 of the party in ascending actor order (Yuna 1, Kimahri 3, Lulu 5)
    const wakizashi = chooseAiCommand(t.ctx, t.boss)!;
    expect([idOf(wakizashi), [...wakizashi.targets]]).toEqual(['yojimbo-wakizashi', ['lulu']]);
    expect(t.rng.calls).toEqual([[0, 0xffff], [0, 2]]);
    t.at('kimahri').alive = false;
    t.at('yuna').alive = false;
    t.rng.calls.length = 0;
    t.boss.overdrive!.gauge = 80;
    t.rng.set(1);
    const kozuka = chooseAiCommand(t.ctx, t.boss)!;
    expect([idOf(kozuka), [...kozuka.targets]]).toEqual(['yojimbo-kozuka', ['lulu']]);
    expect(t.rng.calls, 'one candidate, no pick').toEqual([[0, 0xffff]]);
  });
});

describe('the gauge across his turns (D-12; rows 2 and the join at @0x506)', () => {
  it('adds 2 after every ordinary turn, capped at 100, and fifty ordinary turns from 0 reach 100', () => {
    const t = turns(0);
    for (let i = 0; i < 50; i++) {
      expect(gauge(t), `before turn ${i + 1}`).toBe(2 * i);
      chooseAiCommand(t.ctx, t.boss);
    }
    expect(gauge(t)).toBe(100);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'the next ordinary turn is Zanmato').toBe('yojimbo-zanmato');
  });

  it('Zanmato zeroes the gauge, hits the whole front line, and the turn ends with the gauge at 2', () => {
    const t = turns(100);
    const zanmato = chooseAiCommand(t.ctx, t.boss)!;
    expect([idOf(zanmato), gauge(t)]).toEqual(['yojimbo-zanmato', 2]);
    const gaugeEvents = t.events.filter((e) => e.type === 'overdrive-gauge');
    expect(gaugeEvents.map((e) => (e.type === 'overdrive-gauge' ? [e.from, e.to, e.cause] : []))).toEqual([[100, 0, 'zanmato'], [0, 2, 'attacking']]);
  });

  it('a Zanmato on an aeon alone is the same row: the front line is the aeon', () => {
    const t = turns(100);
    t.ctx.state.aeonId = 'bahamut';
    const zanmato = chooseAiCommand(t.ctx, t.boss)!;
    expect(idOf(zanmato)).toBe('yojimbo-zanmato');
  });
});

describe('his onHit (D-13; m288 f3 @0x530)', () => {
  it('adds 3 once per action that reaches him, however many hits it lands', () => {
    const t = turns(10);
    swing(t);
    expect(gauge(t)).toBe(13);
    const volley = ability({ id: 'volley', name: 'volley', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', hits: 12, canMiss: false, targeting: 'single-enemy' });
    resolveAbility(t.ctx, t.at('lulu'), volley, [BOSS]);
    expect(gauge(t), 'twelve hits are one event').toBe(16);
  });

  it('counts a miss, a heal and a status-only action as well, and is capped at 100', () => {
    const t = turns(90);
    const poke = ability({ id: 'poke', name: 'poke', category: 'skill', targeting: 'single-enemy', canMiss: false });
    resolveAbility(t.ctx, t.at('lulu'), poke, [BOSS]);
    expect(gauge(t), 'a status-only action with a hit record').toBe(93);
    t.boss.hp -= 1_000;
    resolveAbility(t.ctx, t.at('yuna'), t.ctx.content.ability('cure')!, [BOSS]);
    expect(gauge(t), 'a heal').toBe(96);
    const whiff = ability({ id: 'whiff', name: 'whiff', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', targeting: 'single-enemy', accuracy: 0 });
    t.rng.set(255);
    resolveAbility(t.ctx, t.at('lulu'), whiff, [BOSS]);
    expect(gauge(t), 'a miss').toBe(99);
    swing(t);
    swing(t);
    expect(gauge(t), 'the cap').toBe(100);
  });

  it('is not charged by a party counter-attack (the attacker is running a reaction)', () => {
    const t = turns(10);
    t.ctx.rt.inReaction = true;
    swing(t);
    expect(gauge(t)).toBe(10);
  });

  it('is not charged while he is Threatened or asleep (he cannot counter)', () => {
    const t = turns(10);
    t.boss.statuses['threaten'] = { id: 'threaten', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    swing(t);
    expect(gauge(t)).toBe(10);
  });

  it('does not stop a blow that kills him: the hook has nothing to hold back', () => {
    const t = turns(10);
    t.boss.hp = 1;
    swing(t);
    expect(t.boss.alive).toBe(false);
  });
});

describe('the opening (D-14; the formation start hook @0x4BBF)', () => {
  it('writes his CTB 0 and adds one tick to each of the seven party counters', () => {
    const t = fight();
    expect(rtOf(t.ctx, BOSS).ctb).toBe(0);
    for (const id of [...PARTY, 'tidus', 'auron', 'wakka', 'rikku']) {
      expect(rtOf(t.ctx, id).ctb, id).toBeGreaterThanOrEqual(1);
    }
    expect(PARTY.every((id) => rtOf(t.ctx, id).ctb > rtOf(t.ctx, BOSS).ctb)).toBe(true);
  });
});
