/**
 * **Braska's Final Aeon follows his own script** (re-parity, AI lane B; FFX only; Chapter III, link 1).
 *
 * The decision tables are `research/re-ffx-ai-yunalesca-bfa.md` section 3 (m132 in `sins06_00`); the engine rule they rely on
 * is section 1.1, `onHit` once per target per sub-action before the death check. Rows B1 to B7 of the note's section 9:
 *
 *   B1 the Overdrive gauge: +2 or +3 on his turn, +5 per hit event, +20 per Pagoda Power Wave, no randomness
 *   B2 the move weights (1/3, 1/5 + 2/5 + 2/5, 1/3) and the Blade Blitz opener of the second form
 *   B3 phase 2 latches once a hit leaves him below half of the second form
 *   B4 the opener is consumed on the first second-form turn even when an Overdrive or Talk replaces the action
 *   B5 the Overdrive test reads the gauge as his last hook left it, so the turn it reaches 100 is not the Overdrive turn
 *   B6 the Overdrive targets (one random living actor, not petrified for Triumphant Grasp; the front line for the Shot)
 *   B7 Talk sets a flag; the gauge clears and the pending Overdrive is cancelled when his next turn starts
 *
 * Plus the exact odds from all 65,536 draws, the transformation through the engine's hit events, and the order of the draws.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import {
  advanceForm,
  aiContextFor,
  applyStatus,
  chooseAiCommand,
  resolveAbility,
  summonAeon,
} from '../../src/battle/ffx/index.ts';
import { consumeBfaTalk, bfaTalkCharges, triggerHandler } from '../../src/battle/ffx/ai/index.ts';
import { scriptGauge } from '../../src/battle/ffx/ai/braskas-final-aeon.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const BOSS = 'braskas-final-aeon';
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);
const PARTY = ['tidus', 'yuna', 'auron'];

type Bfa = LiveBattle & { boss: FFXCombatant; mem: Record<string, number | string | boolean>; rng: ScriptedRng };

/** Link 1 of Chapter III on the shipped data, in the given phase, the second form's opener already spent. */
function bfa(phase: 0 | 1 | 2 = 0): Bfa {
  const live = liveBattle(BOSS);
  const boss = live.at(BOSS);
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  if (phase >= 1) {
    advanceForm(live.ctx, boss);
    live.ctx.state.flags['bfa.form2Opened'] = true;
  }
  const mem = rtOf(live.ctx, BOSS).ai;
  if (phase === 2) mem['bfa.phase2'] = true;
  return { ...live, boss, mem, rng };
}

const gaugeOf = (t: Bfa): unknown => t.ctx.state.flags['bfa.gauge'];

/** A fixed blow of `power x 50` per hit (capped at 9,999) that cannot miss, to take HP down through the engine. */
function blow(power: number, hits = 1, id = 'blow'): AbilityDef {
  return ability({
    id: `${id}-${power}x${hits}`, name: id, category: 'skill', formula: 'fixed-no-variance', power, damageType: 'physical',
    hits, canMiss: false, targeting: 'single-enemy',
  });
}

describe('Braska’s Final Aeon, the first form (m132 @0x030B)', () => {
  it('rolls GetRandomValue mod 3 first and picks a random living actor second: Jecht Beam on 0, Left Arm Strike otherwise', () => {
    for (const raw of [0, 1, 2, 3, 40000, 65535]) {
      const t = bfa();
      t.rng.feed(raw, 1);
      const command = chooseAiCommand(t.ctx, t.boss);
      expect([idOf(command), targetsOf(command)], `raw ${raw}`).toEqual([raw % 3 === 0 ? 'jecht-beam' : 'left-arm-strike', ['yuna']]);
      expect(t.rng.calls, 'the roll, then a pick among three').toEqual([[0, 0xffff], [0, 2]]);
    }
  });

  it('picks without a draw when one actor is left, and from the living only (KO’d actors are not candidates)', () => {
    const t = bfa();
    for (const id of ['tidus', 'auron']) {
      t.at(id).alive = false;
      t.at(id).statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    t.rng.feed(1);
    expect(targetsOf(chooseAiCommand(t.ctx, t.boss))).toEqual(['yuna']);
    expect(t.rng.calls).toEqual([[0, 0xffff]]);
  });

  it('adds 2 to the gauge on his own turn in the first form, and the gauge is the property he and the HUD read', () => {
    const t = bfa();
    chooseAiCommand(t.ctx, t.boss);
    expect(gaugeOf(t)).toBe(2);
    chooseAiCommand(t.ctx, t.boss);
    expect(gaugeOf(t)).toBe(4);
    expect(t.events.filter((e) => e.type === 'overdrive-gauge').map((e) => (e.type === 'overdrive-gauge' ? e.to : -1))).toEqual([2, 4]);
  });
});

describe('Braska’s Final Aeon, the second form (m132 @0x0364) and the third phase (@0x03F8)', () => {
  it('phase 1: mod 5 = 0 Jecht Beam, 2 or 4 Blade Blitz on the whole front line (no pick), 1 or 3 Left Arm Strike 2; +3', () => {
    const expected: Record<number, [string, string[], number]> = {
      0: ['jecht-beam', ['yuna'], 2],
      1: ['left-arm-strike-2', ['yuna'], 2],
      2: ['blade-blitz', PARTY, 1],
      3: ['left-arm-strike-2', ['yuna'], 2],
      4: ['blade-blitz', PARTY, 1],
    };
    for (const [residue, [move, targets, draws]] of Object.entries(expected)) {
      const t = bfa(1);
      t.rng.feed(Number(residue) + 5, 1);
      const command = chooseAiCommand(t.ctx, t.boss);
      expect([idOf(command), targetsOf(command)], `residue ${residue}`).toEqual([move, targets]);
      expect(t.rng.calls.length, `residue ${residue}: Blade Blitz aims at the front line and draws nothing`).toBe(draws);
      expect(gaugeOf(t)).toBe(3);
    }
  });

  it('phase 2: mod 3 = 0 Jecht Beam, otherwise Blade Blitz on the front line; +3', () => {
    for (const raw of [0, 1, 2, 3]) {
      const t = bfa(2);
      t.rng.feed(raw, 2);
      const command = chooseAiCommand(t.ctx, t.boss);
      expect([idOf(command), targetsOf(command)]).toEqual(raw % 3 === 0 ? ['jecht-beam', ['auron']] : ['blade-blitz', PARTY]);
      expect(gaugeOf(t)).toBe(3);
    }
  });

  it('opens the second form with Blade Blitz on the front line whatever the roll, both draws still taken (B4)', () => {
    const t = bfa(1);
    t.ctx.state.flags['bfa.form2Opened'] = false;
    t.rng.feed(0, 1); // would be Jecht Beam on Yuna
    const opener = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(opener), targetsOf(opener)]).toEqual(['blade-blitz', PARTY]);
    expect(t.rng.calls, 'the roll and the pick are drawn before the opener replaces them').toEqual([[0, 0xffff], [0, 2]]);
    t.rng.set(0, 1);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'the opener is spent').toBe('jecht-beam');
  });

  it('spends the opener on the first second-form turn even when an Overdrive replaces the action (B4)', () => {
    const t = bfa(1);
    t.ctx.state.flags['bfa.form2Opened'] = false;
    t.ctx.state.flags['bfa.gauge'] = 100;
    t.rng.feed(2, 1, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('triumphant-grasp-2');
    t.rng.set(0, 1);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'the next turn rolls like any other').toBe('jecht-beam');
  });

  it('latches phase 2 once a hit leaves him below 60,000, and healing back above does not undo it (B3)', () => {
    const t = bfa(1);
    t.boss.hp = 60_001;
    resolveAbility(t.ctx, t.at('tidus'), blow(1), [BOSS]);
    expect(t.boss.hp).toBeLessThan(60_000);
    expect(t.mem['bfa.phase2']).toBe(true);
    t.boss.hp = 100_000;
    t.rng.feed(2, 0);
    const command = chooseAiCommand(t.ctx, t.boss);
    expect(idOf(command), 'phase 2 table: a non-zero residue of mod 3 is Blade Blitz, not Left Arm Strike 2').toBe('blade-blitz');
  });

  it('keeps phase 1 at exactly 60,000 and while the pool is above it (the test is strictly below)', () => {
    const t = bfa(1);
    t.boss.hp = 70_000;
    resolveAbility(t.ctx, t.at('tidus'), blow(1), [BOSS]);
    const dealt = 70_000 - t.boss.hp;
    expect(dealt).toBeGreaterThan(0);
    t.boss.hp = 60_000 + dealt; // the same blow now leaves exactly 60,000
    resolveAbility(t.ctx, t.at('tidus'), blow(1), [BOSS]);
    expect(t.boss.hp).toBe(60_000);
    expect(t.mem['bfa.phase2']).toBeUndefined();
    resolveAbility(t.ctx, t.at('tidus'), blow(1), [BOSS]);
    expect(t.mem['bfa.phase2'], 'the next blow leaves him below it: phase 2').toBe(true);
  });
});

describe('the Overdrive branch (m132 @0x046A) and the stored gauge (B5, B6)', () => {
  it('spends a full property gauge on Triumphant Grasp, or its second form, on one random living actor; the gauge returns to 0', () => {
    for (const [phase, move, draws] of [[0, 'triumphant-grasp', [2, 0, 2]], [1, 'triumphant-grasp-2', [1, 0, 2]]] as const) {
      const t = bfa(phase);
      t.ctx.state.flags['bfa.gauge'] = 100;
      t.rng.feed(...draws); // the phase roll (a Left Arm Strike), its pick (Tidus), then the Overdrive's pick (Auron)
      const command = chooseAiCommand(t.ctx, t.boss);
      expect([idOf(command), targetsOf(command)]).toEqual([move, ['auron']]);
      expect(t.rng.calls.length, 'the phase roll and pick are drawn first, then the Overdrive pick').toBe(3);
      expect(gaugeOf(t), 'the Overdrive replaces the turn, and the turn’s own gain with it').toBe(0);
    }
  });

  it('never picks a petrified actor for Triumphant Grasp (the Not-Petrify search), with no draw for the lone survivor', () => {
    const t = bfa();
    for (const id of ['tidus', 'yuna']) applyStatus(t.ctx, undefined, t.at(id), { status: 'petrify', chance: 255, duration: 254 });
    t.ctx.state.flags['bfa.gauge'] = 100;
    t.rng.feed(1, 0);
    const command = chooseAiCommand(t.ctx, t.boss);
    expect(targetsOf(command)).toEqual(['auron']);
    expect(t.rng.calls.filter(([, hi]) => hi < 0xffff).map(([, hi]) => hi), 'one pick for the phase move among the three, none for the Overdrive').toEqual([2]);
  });

  it('spends it on Ultimate Jecht Shot on the whole front line in phase 2', () => {
    const t = bfa(2);
    t.ctx.state.flags['bfa.gauge'] = 100;
    t.rng.feed(1);
    const command = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(command), targetsOf(command)]).toEqual(['ultimate-jecht-shot', PARTY]);
    expect(t.rng.calls, 'a Blade Blitz roll, which aims at the front line, then the Shot, which does too: one draw in all').toEqual([[0, 0xffff]]);
  });

  it('spends it on Jecht Bomber, or its second form, on the aeon while one holds the field', () => {
    for (const [phase, move] of [[0, 'jecht-bomber'], [1, 'jecht-bomber-2'], [2, 'jecht-bomber-2']] as const) {
      const t = bfa(phase);
      summonAeon(t.ctx, 'yuna', 'valefor');
      t.ctx.state.flags['bfa.gauge'] = 100;
      const command = chooseAiCommand(t.ctx, t.boss);
      expect([idOf(command), targetsOf(command)], `phase ${phase}`).toEqual([move, ['valefor']]);
    }
  });

  it('tests the gauge as his last hook left it: the turn it reaches 100 is not an Overdrive turn, the next one is (B5)', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 98;
    t.rng.feed(1, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('left-arm-strike');
    expect(gaugeOf(t), '98 + 2').toBe(100);
    t.rng.set(1, 0, 1);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('triumphant-grasp');
    expect(gaugeOf(t)).toBe(0);
    t.rng.set(1, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('left-arm-strike');
  });

  it('clamps the gauge at 100 when a turn’s gain carries it past', () => {
    const t = bfa(1);
    t.ctx.state.flags['bfa.gauge'] = 99;
    chooseAiCommand(t.ctx, t.boss);
    expect(gaugeOf(t)).toBe(100);
  });
});

describe('the gauge through hit events (m132 f6 @0x05FF)', () => {
  const hit = (t: Bfa): void => void resolveAbility(t.ctx, t.at('tidus'), t.ctx.content.ability('attack')!, [BOSS]);
  const wave = (t: Bfa, pagoda = 'yu-pagoda-left'): void =>
    void resolveAbility(t.ctx, t.at(pagoda), t.ctx.content.ability('power-wave-bfa')!, [BOSS]);

  it('adds 5 for every action that reaches him, a miss included, and 20 for a Pagoda’s Power Wave', () => {
    const t = bfa();
    hit(t);
    expect(gaugeOf(t)).toBe(5);
    wave(t);
    expect(gaugeOf(t)).toBe(25);
    wave(t, 'yu-pagoda-right');
    expect(gaugeOf(t)).toBe(45);
    t.rng.set(100, 100, 100, 100); // every percent roll is 100: the hit misses
    applyStatus(t.ctx, undefined, t.at('tidus'), { status: 'darkness', chance: 255, duration: 3 });
    hit(t);
    expect(t.events.some((e) => e.type === 'miss'), 'the swing missed').toBe(true);
    expect(gaugeOf(t), 'a miss is still a hit event').toBe(50);
  });

  it('takes the Power Wave’s +20 from his hook, not from the ability row (one rider, not two)', () => {
    const t = bfa();
    wave(t);
    expect(gaugeOf(t)).toBe(20);
    expect(t.events.filter((e) => e.type === 'overdrive-gauge').length).toBe(1);
  });

  it('clamps at 100, and a Power Wave at a full gauge adds only the ordinary 5', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 90;
    wave(t);
    expect(gaugeOf(t)).toBe(100);
    wave(t);
    expect(gaugeOf(t)).toBe(100);
  });

  it('makes the NEXT turn the Overdrive when a hit fills the gauge (B5 through hits)', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 95;
    hit(t);
    expect(gaugeOf(t)).toBe(100);
    t.rng.feed(1, 0, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('triumphant-grasp');
  });

  it('a Power Wave on a Zombie Braska’s Final Aeon is 1,500 damage that strips the Zombie, and still pays the +20', () => {
    // The strategy line keeps Zombie on him so the Pagodas hurt their own boss (the heal is inverted); the gauge is paid
    // by the hit event either way, since his hook does not look at the HP result of a Power Wave.
    const t = bfa();
    t.boss.hp = 40_000;
    t.boss.statuses['zombie'] = { id: 'zombie', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    wave(t);
    expect(t.boss.hp).toBe(38_500);
    expect(t.boss.statuses['zombie']).toBeUndefined();
    expect(gaugeOf(t)).toBe(20);
  });

  it('does not touch the gauge for an action that never reached him', () => {
    const t = bfa();
    resolveAbility(t.ctx, t.at('tidus'), t.ctx.content.ability('attack')!, ['yu-pagoda-left']);
    expect(gaugeOf(t)).toBeUndefined();
  });
});

describe('the transformation (m132 f7 @0x06E3)', () => {
  it('refills him to 120,000 with Strength 50 after the action’s last hit, keeps the gauge and writes no turn order', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 40;
    const before = [t.boss, ...PARTY.map((id) => t.at(id))].map((c) => rtOf(t.ctx, c.id).ctb);
    resolveAbility(t.ctx, t.at('tidus'), blow(200, 12), [BOSS]);
    expect(t.boss.enemy?.formIndex).toBe(1);
    expect([t.boss.hp, t.boss.stats.maxHp, t.boss.stats.str]).toEqual([120_000, 120_000, 50]);
    expect(t.events.filter((e) => e.type === 'damage' && e.targetId === BOSS), 'every hit of the action landed on the first form').toHaveLength(12);
    expect(t.events.filter((e) => e.type === 'form-change')).toHaveLength(1);
    expect([t.boss, ...PARTY.map((id) => t.at(id))].map((c) => rtOf(t.ctx, c.id).ctb), 'his script writes no CTB (unlike Yunalesca’s)').toEqual(before);
    expect(t.mem['bfa.phase2']).toBeUndefined();
  });

  it('leaves the gain of the hit that transformed him in the script’s own number, not in the gauge everyone reads (m132 @0x06F8)', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 40;
    resolveAbility(t.ctx, t.at('tidus'), blow(200, 12), [BOSS]);
    expect(gaugeOf(t), 'the property copy is written after the transformation check returns').toBe(40);
    expect(scriptGauge(t.ctx, t.boss), 'the running number has the +5').toBe(45);
    resolveAbility(t.ctx, t.at('tidus'), blow(1), [BOSS]);
    expect(gaugeOf(t), 'the next hook copies the running number: 45 + 5').toBe(50);
  });

  it('does the same for the hit that first leaves the second form below half (the latch returns before the copy)', () => {
    const t = bfa(1);
    t.ctx.state.flags['bfa.gauge'] = 10;
    t.boss.hp = 60_020;
    resolveAbility(t.ctx, t.at('tidus'), blow(1), [BOSS]);
    expect(t.mem['bfa.phase2']).toBe(true);
    expect([gaugeOf(t), scriptGauge(t.ctx, t.boss)]).toEqual([10, 15]);
  });

  it('a stale property can hide a full gauge for one turn: the running number is ahead but the test reads the older copy', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 96;
    resolveAbility(t.ctx, t.at('tidus'), blow(200, 12), [BOSS]); // transforms: running 101 -> 100, property still 96
    expect([gaugeOf(t), scriptGauge(t.ctx, t.boss)]).toEqual([96, 100]);
    t.ctx.state.flags['bfa.form2Opened'] = true;
    t.rng.feed(1, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'the stored 96 is not a full gauge').toBe('left-arm-strike-2');
    expect(gaugeOf(t), 'the turn copies 100 + 3, clamped').toBe(100);
  });

  it('dies for good when the second form falls: no further form exists and nothing refills him', () => {
    const t = bfa(1);
    t.boss.hp = 5_000;
    resolveAbility(t.ctx, t.at('tidus'), blow(200, 3), [BOSS]);
    expect([t.boss.alive, t.boss.hp]).toEqual([false, 0]);
  });

  it('the first form’s killing blow does not count as an overkill (it is refilled)', () => {
    const t = bfa();
    resolveAbility(t.ctx, t.at('tidus'), blow(200, 12), [BOSS]);
    expect(t.events.some((e) => e.type === 'damage' && e.targetId === BOSS && e.overkill === true)).toBe(false);
  });
});

describe('Talk (m132 f5 @0x05E8; the scenes of sins06_00)', () => {
  it('the first two Talks set a flag and change nothing else; the third is dialogue only', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 70;
    const ai = aiContextFor(t.ctx, t.boss);
    expect(consumeBfaTalk(ai)).toBe(true);
    expect(t.ctx.state.flags['bfa.talkPending']).toBe(true);
    expect(gaugeOf(t), 'nothing happens to the gauge when Talk resolves').toBe(70);
    expect(consumeBfaTalk(ai)).toBe(true);
    expect(consumeBfaTalk(ai)).toBe(false);
    expect(bfaTalkCharges(ai)).toBe(3);
  });

  it('on his next turn the gauge is cleared, the pending Overdrive cancelled and the turn lost, after the phase draws (B7)', () => {
    const t = bfa();
    t.ctx.state.flags['bfa.gauge'] = 100;
    consumeBfaTalk(aiContextFor(t.ctx, t.boss));
    t.rng.feed(1, 0, 0);
    const turn = chooseAiCommand(t.ctx, t.boss);
    expect(turn, 'the turn ends on an empty action').toBeNull();
    expect(gaugeOf(t)).toBe(0);
    expect(t.ctx.state.flags['bfa.talkPending']).toBe(false);
    expect(t.rng.calls.length, 'the phase roll, its pick and the Overdrive pick were all drawn before Talk replaced them').toBe(3);
    t.rng.set(1, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'the turn after that is an ordinary one').toBe('left-arm-strike');
    expect(gaugeOf(t)).toBe(2);
  });

  it('is offered through the trigger table twice and answers false the third time', () => {
    const t = bfa();
    const talk = triggerHandler('talk')!;
    const tidus = t.at('tidus');
    expect(talk.available(t.ctx, tidus)).toBe(true);
    expect(talk.apply(t.ctx, tidus)).toBe(true);
    expect(talk.apply(t.ctx, tidus)).toBe(true);
    expect(talk.available(t.ctx, tidus)).toBe(false);
    expect(talk.apply(t.ctx, tidus)).toBe(false);
  });
});

describe('the exact odds of each phase table, from all 65,536 values of the 16-bit draw', () => {
  /** How often each move comes up over every possible `GetRandomValue()`. */
  function tally(phase: 0 | 1 | 2): Record<string, number> {
    const t = bfa(phase);
    const counts: Record<string, number> = {};
    for (let raw = 0; raw <= 0xffff; raw++) {
      t.ctx.state.flags['bfa.gauge'] = 0;
      t.rng.set(raw, 0);
      const id = idOf(chooseAiCommand(t.ctx, t.boss));
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }

  it('phase 0 (mod 3): Jecht Beam 21,846 (33.33%), Left Arm Strike 43,690', () => {
    expect(tally(0)).toEqual({ 'jecht-beam': 21_846, 'left-arm-strike': 43_690 });
  });

  it('phase 1 (mod 5): Jecht Beam 13,108 (20.00%), Blade Blitz 26,214 (40.00%), Left Arm Strike 2 26,214 (40.00%)', () => {
    expect(tally(1)).toEqual({ 'jecht-beam': 13_108, 'blade-blitz': 26_214, 'left-arm-strike-2': 26_214 });
  });

  it('phase 2 (mod 3): Jecht Beam 21,846 (33.33%), Blade Blitz 43,690 (66.67%)', () => {
    expect(tally(2)).toEqual({ 'jecht-beam': 21_846, 'blade-blitz': 43_690 });
  });
});
