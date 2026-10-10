/**
 * **Evrae and Cid follow their own scripts** (re-parity, AI lane C; FFX only; Chapter VIII).
 *
 * The decision tables are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 2 (m119 Evrae, m149 Cid in `hiku15_00`, run in
 * the note's interpreter); the engine rules they rely on are section 1.1 (`onHit` once per action per target, before the death
 * check; only what a hook *queues* is filtered) and 1.3 (the reach of a command). Rows D-01 to D-09 and D-34 of its section 8:
 *
 *   D-01 the Haste line is 10,666 and strict (`HP < 10,666`)
 *   D-02 Delay Attack (+1) and Delay Buster (+3) start the Haste phase at 3: ON since Bailey's answer of 2026-10-09 (the owner
 *        decision C-13 had it off; a switch, `airship.delayAdvancesHaste`, still overrides it for one battle)
 *   D-03 the Stone Gaze counter takes the command's damage-formula byte: 1 is +2, 3 is +1, the rest 0
 *   D-04 the counter keeps firing after the Haste phase starts (a value above 5 fires once at the next Attack slot)
 *   D-05 his own FAR turn in the Haste phase is a Swooping Scythe, then he is NEAR and the order is gone
 *   D-06 a hit while FAR in the Haste phase is answered with the Scythe, distance 0, order cleared
 *   D-07 a hit while NEAR in the Haste phase with Slow on him is answered with Haste
 *   D-09 Cid's Agility is 11 (recovery 42)
 *   D-34 a party counter-attack still moves the counters; only the command it queues is dropped
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { recoveryTicks } from '../../src/battle/ffx/turnQueue.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { FORMULA_BYTE_OVERRIDES, gazeStepOf } from '../../src/battle/ffx/ai/command-formula.ts';
import { AIRSHIP_DELAY_SWITCH, EVRAE_ASSUMPTIONS, HASTE_THRESHOLD } from '../../src/battle/ffx/ai/evrae-rules.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { EVRAE_HASTE_THRESHOLD } from '../../src/data/ffx/enemies/evrae.ts';
import { fahrenheitBuild } from '../../src/data/ffx/builds/fahrenheit.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle, queuedCounters, takeQueuedCounters } from './helpers/aiScript.ts';
import gazeClasses from '../fixtures/parity/ffx/evrae-gaze-classes.json';

const BOSS = 'evrae';
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { boss: FFXCombatant; rng: ScriptedRng; flags: Record<string, unknown> };

function fight(): Fight {
  const live = liveBattle('evrae-airship', { party: fahrenheitBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, boss: live.at(BOSS), rng, flags: live.ctx.state.flags };
}

/** Run one action of `who` against Evrae; return the ability. */
function act(t: Fight, who: string, abilityId: string, targets: string[] = [BOSS]): AbilityDef {
  const def = t.ctx.content.ability(abilityId);
  if (!def) throw new Error(`no ability '${abilityId}'`);
  resolveAbility(t.ctx, t.at(who), def, targets);
  return def;
}

/** An action that deals exactly 50 HP damage per point of `power` (Fixed, no variance) and nothing else. */
function exact(power: number, extra: Partial<AbilityDef> = {}): AbilityDef {
  return ability({
    id: 'exact-test', name: 'exact', category: 'skill', formula: 'fixed-no-variance', power, damageType: 'other',
    targeting: 'single-enemy', canMiss: false, ...extra,
  });
}

const slow = { id: 'slow', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as const;
const queued = (t: Fight): string[] => queuedCounters(t.ctx).map((r) => idOf(r.command));

describe('his turn (D-05; m119 f2 @0x1D5)', () => {
  it('cycles Attack, Attack, Inhale, Poison Breath at NEAR, and the slot only moves at NEAR', () => {
    const t = fight();
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) seen.push(idOf(chooseAiCommand(t.ctx, t.boss)));
    expect(seen).toEqual([
      'evrae-attack', 'evrae-attack', 'evrae-inhale', 'evrae-poison-breath',
      'evrae-attack', 'evrae-attack', 'evrae-inhale', 'evrae-poison-breath',
    ]);
    t.flags['airship.range'] = 'far';
    for (let i = 0; i < 3; i++) expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'FAR in phase 1').toBe('evrae-photon-spray');
    expect(t.flags['airship.nearStep'], 'the slot did not move at FAR').toBe(0);
  });

  it('picks one living, targetable front-line member for the Attack slot, drawing only with two or more standing', () => {
    const t = fight();
    t.rng.set(2);
    const attack = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(attack), targetsOf(attack)], 'ascending actor order: Tidus 0, Wakka 4, Rikku 6').toEqual(['evrae-attack', ['rikku']]);
    expect(t.rng.calls).toEqual([[0, 2]]);
    t.at('wakka').alive = false;
    t.at('rikku').alive = false;
    t.rng.calls.length = 0;
    expect(targetsOf(chooseAiCommand(t.ctx, t.boss))).toEqual(['tidus']);
    expect(t.rng.calls, 'a lone candidate costs no draw').toEqual([]);
  });

  it('turns the Attack slot into Stone Gaze on the same pick when the counter is above 5, and spends it', () => {
    const t = fight();
    t.flags['airship.gazeCounter'] = 5;
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'five is not enough').toBe('evrae-attack');
    t.flags['airship.nearStep'] = 0;
    t.flags['airship.gazeCounter'] = 6;
    t.rng.set(1);
    t.rng.calls.length = 0;
    const gaze = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(gaze), targetsOf(gaze), t.flags['airship.gazeCounter']]).toEqual(['evrae-stone-gaze', ['wakka'], 0]);
    expect(t.rng.calls, 'one pick for Attack and Gaze alike').toHaveLength(1);
  });

  it('still fires a counter above 5 once the Haste phase has started (D-04)', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    t.flags['airship.gazeCounter'] = 7;
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('evrae-stone-gaze');
    expect(t.flags['airship.gazeCounter']).toBe(0);
  });

  it('whiffs a charged breath at FAR, and clears the charge (matched pair with Inhale)', () => {
    const t = fight();
    chooseAiCommand(t.ctx, t.boss);
    chooseAiCommand(t.ctx, t.boss);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('evrae-inhale');
    t.flags['airship.range'] = 'far';
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('evrae-out-of-breath-range');
    expect([t.flags['airship.breathCharged'], t.flags['airship.nearStep']]).toEqual([false, 0]);
  });

  it('Scythes on its own FAR turn in the Haste phase, then it is NEAR and the order is gone (D-05)', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    t.flags['airship.range'] = 'far';
    t.flags['airship.order'] = 'near';
    const scythe = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(scythe), t.flags['airship.range'], t.flags['airship.order']]).toEqual(['evrae-swooping-scythe', 'near', '']);
    expect(t.rng.calls, 'no pick, no roll').toEqual([]);
  });

  it('a charged breath still wins over the Scythe at FAR in the Haste phase (row 4 comes first)', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    t.flags['airship.range'] = 'far';
    t.flags['airship.breathCharged'] = true;
    t.flags['airship.nearStep'] = 3;
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('evrae-out-of-breath-range');
    expect(t.flags['airship.range'], 'the ship stays where it is').toBe('far');
  });
});

describe('his Stone Gaze counter (D-03; m119 f4 @0x3E8 rows 5)', () => {
  it('takes the command’s formula byte: 2 for 1, 1 for 3, 0 for the rest, once per action', () => {
    const rows: Array<[string, string, number]> = [
      ['attack', 'tidus', 2],
      ['delay-attack', 'tidus', 2],
      ['fire', 'lulu', 1],
      ['lancet', 'kimahri', 1],
      ['scan', 'lulu', 1],
      ['reflect', 'rikku', 1],
      ['slow', 'tidus', 0],
      ['cure', 'rikku', 0],
      ['cheer', 'tidus', 0],
    ];
    for (const [id, who, step] of rows) {
      const t = fight();
      act(t, who, id);
      expect(t.flags['airship.gazeCounter'], `${id} (+${step})`).toBe(step);
    }
  });

  it('counts a many-hit action once, and counts a miss', () => {
    const t = fight();
    act(t, 'tidus', 'attack');
    const volley = ability({ id: 'volley', name: 'volley', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', hits: 12, canMiss: false, targeting: 'single-enemy' });
    resolveAbility(t.ctx, t.at('tidus'), volley, [BOSS]);
    expect(t.flags['airship.gazeCounter']).toBe(2 + 2);
    const evade = ability({ id: 'whiff', name: 'whiff', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', targeting: 'single-enemy', accuracy: 0 });
    t.rng.set(255);
    resolveAbility(t.ctx, t.at('tidus'), evade, [BOSS]);
    expect(t.flags['airship.gazeCounter'], 'a hit record that missed is still an event').toBe(2 + 2 + 2);
  });

  it('stops counting once the Haste phase has started', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    act(t, 'tidus', 'attack');
    expect(t.flags['airship.gazeCounter']).toBe(0);
  });

  it('counts Cid’s missiles as nothing (byte 9) but they run the Haste test (D-01)', () => {
    const t = fight();
    t.boss.hp = HASTE_THRESHOLD; // 10,666 exactly: a missile volley takes it under the line
    resolveAbility(t.ctx, t.at('cid'), t.ctx.content.ability('cid-guided-missiles')!, [BOSS]);
    expect(t.flags['airship.gazeCounter']).toBe(0);
    expect(t.flags['airship.phase'], 'Guided Missiles trip the Haste').toBe(2);
    expect(queued(t)).toEqual(['evrae-haste']);
  });
});

describe('the Haste phase starts on the first hit event under 10,666 (D-01; rows 6, 1)', () => {
  it('is strict: 10,666 left is phase 1, 10,665 is the Haste phase', () => {
    expect(HASTE_THRESHOLD, 'maxHP 32,000 / 3 with integer division').toBe(10_666);
    expect(EVRAE_HASTE_THRESHOLD, 'the data file’s mirror').toBe(HASTE_THRESHOLD);
    const above = fight();
    above.boss.hp = 10_716;
    resolveAbility(above.ctx, above.at('tidus'), exact(1), [BOSS]);
    expect([above.boss.hp, above.flags['airship.phase']], 'exactly 10,666 left').toEqual([10_666, 1]);
    const under = fight();
    under.boss.hp = 10_715;
    resolveAbility(under.ctx, under.at('tidus'), exact(1), [BOSS]);
    expect([under.boss.hp, under.flags['airship.phase']], 'one point under').toEqual([10_665, 2]);
  });

  it('writes its flags and queues one Haste on himself; his own Haste’s hit event is the guard’s (v11)', () => {
    const t = fight();
    t.boss.hp = 10_700;
    resolveAbility(t.ctx, t.at('tidus'), exact(2), [BOSS]);
    expect([t.flags['airship.phase'], t.flags['airship.hasteGuard'], queued(t)]).toEqual([2, true, ['evrae-haste']]);
    const [haste] = takeQueuedCounters(t.ctx);
    t.ctx.rt.inReaction = true;
    executeCommand(t.ctx, t.boss, haste!.command, true);
    t.ctx.rt.inReaction = false;
    expect(t.boss.statuses['haste'], 'Hasted').toBeDefined();
    expect(t.flags['airship.hasteGuard'], 'the Haste’s own event cleared it and did nothing more').toBe(false);
    expect(queued(t)).toEqual([]);
  });

  it('a Threatened Evrae still moves the flags; the queue refuses the Haste (note a)', () => {
    const t = fight();
    t.boss.statuses['threaten'] = { ...slow, id: 'threaten' };
    t.boss.hp = 10_000;
    resolveAbility(t.ctx, t.at('tidus'), exact(1), [BOSS]);
    expect([t.flags['airship.phase'], t.flags['airship.hasteGuard'], queued(t)]).toEqual([2, true, []]);
  });

  it('a party counter-attack runs the hook (counters move) and queues nothing (D-34)', () => {
    const t = fight();
    t.ctx.rt.inReaction = true;
    act(t, 'tidus', 'attack');
    expect(t.flags['airship.gazeCounter'], 'the counter moved').toBe(2);
    t.boss.hp = 10_000;
    resolveAbility(t.ctx, t.at('tidus'), exact(1), [BOSS]);
    expect([t.flags['airship.phase'], queued(t)], 'the phase starts, the Haste is dropped').toEqual([2, []]);
  });
});

describe('Delay toward the Haste phase (D-02; the owner decision C-13, turned on by Bailey on 2026-10-09)', () => {
  it('is on: Delay Attack +1 and Delay Buster +3, three or more start the phase with no HP lost', () => {
    expect(EVRAE_ASSUMPTIONS.find((a) => a.id === 'C-13')?.value).toBe(true);
    const a = fight();
    act(a, 'tidus', 'delay-attack');
    act(a, 'tidus', 'delay-attack');
    expect([a.flags['airship.delayCount'], a.flags['airship.phase'], queued(a)], 'two Delay Attacks are 2: nothing yet').toEqual([2, 1, []]);
    act(a, 'tidus', 'delay-attack');
    expect([a.flags['airship.delayCount'], a.flags['airship.phase'], queued(a)], 'the third makes 3').toEqual([3, 2, ['evrae-haste']]);
    const b = fight();
    act(b, 'tidus', 'delay-buster');
    expect([b.flags['airship.delayCount'], b.flags['airship.phase'], b.boss.hp > 20_000, queued(b)], 'one Delay Buster is enough').toEqual([3, 2, true, ['evrae-haste']]);
  });

  it('counts a Delay Attack and a Delay Buster together (1 + 3)', () => {
    const t = fight();
    act(t, 'tidus', 'delay-attack');
    expect(t.flags['airship.phase']).toBe(1);
    act(t, 'tidus', 'delay-buster');
    expect([t.flags['airship.delayCount'], t.flags['airship.phase']]).toEqual([4, 2]);
  });

  it('stops counting in the Haste phase: later Delays move nothing', () => {
    const t = fight();
    act(t, 'tidus', 'delay-buster'); // the phase starts
    const count = t.flags['airship.delayCount'];
    act(t, 'tidus', 'delay-buster');
    expect([t.flags['airship.delayCount'], t.flags['airship.phase']]).toEqual([count, 2]);
  });

  it('is still a switch: a bench that sets it false gets the old rule, where three Delay Attacks and a Delay Buster start nothing', () => {
    const t = fight();
    t.flags[AIRSHIP_DELAY_SWITCH] = false;
    for (let i = 0; i < 3; i++) act(t, 'tidus', 'delay-attack');
    act(t, 'tidus', 'delay-buster');
    expect([t.flags['airship.delayCount'], t.flags['airship.phase'], queued(t)]).toEqual([1 + 1 + 1 + 3, 1, []]);
  });
});

describe('his reaction in the Haste phase (D-06, D-07; rows 2 to 4)', () => {
  it('answers a hit at FAR with the Scythe on the front line, sends the ship NEAR and clears the order', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    t.flags['airship.range'] = 'far';
    t.flags['airship.order'] = 'near';
    act(t, 'lulu', 'fire'); // magic reaches at FAR
    expect([t.flags['airship.range'], t.flags['airship.order'], queued(t)]).toEqual(['near', '', ['evrae-swooping-scythe']]);
  });

  it('keeps the writes even when the queue refuses the Scythe (a counter-attack caused the hit)', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    t.flags['airship.range'] = 'far';
    t.ctx.rt.inReaction = true;
    act(t, 'lulu', 'fire');
    expect([t.flags['airship.range'], queued(t)]).toEqual(['near', []]);
  });

  it('answers a hit at NEAR with Haste while Slow is on him, and with nothing otherwise', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    act(t, 'tidus', 'attack');
    expect(queued(t), 'nothing without Slow').toEqual([]);
    t.boss.statuses['slow'] = { ...slow };
    act(t, 'tidus', 'attack');
    expect(queued(t)).toEqual(['evrae-haste']);
  });

  it('needs a hit record: Pull back, Move in and Cancel raise no event (nothing in the engine to run)', () => {
    const t = fight();
    t.flags['airship.phase'] = 2;
    t.flags['airship.range'] = 'far';
    const before = JSON.stringify(t.flags);
    executeCommand(t.ctx, t.at('tidus'), { kind: 'trigger', id: 'close-in', targets: [] }, true);
    expect(queued(t)).toEqual([]);
    expect(JSON.parse(before)['airship.range']).toBe('far');
  });
});

describe('Cid (D-09)', () => {
  it('acts every 42 ticks: Agility 11, base 14, rank 3', () => {
    const t = fight();
    const cid = t.at('cid');
    expect(cid.stats.agi).toBe(11);
    expect(recoveryTicks(cid, 3)).toBe(42);
    expect(rtOf(t.ctx, 'cid').base).toBe(14);
  });
});

describe('the formula byte that fills the counter (D-03), against the game’s command table', () => {
  const byId = new Map<number, AbilityDef[]>();
  for (const a of ALL_ABILITIES) {
    if (a.record === undefined) continue;
    byId.set(a.record.id, [...(byId.get(a.record.id) ?? []), a]);
  }

  it('puts every shipped ability that carries a game record in the game’s class, and the fixture covers every shipped record', () => {
    const wrong: string[] = [];
    const user = { side: 'party' } as FFXCombatant;
    const table = gazeClasses as Record<string, number>;
    for (const [hex, want] of Object.entries(table)) {
      const id = Number(hex);
      for (const def of byId.get(id) ?? []) {
        const got = gazeStepOf(def, user);
        if (got !== want) wrong.push(`${def.id} ${hex}: ${got} not ${want}`);
      }
    }
    expect(wrong).toEqual([]);
    const uncovered = [...byId.keys()].filter((id) => table[`0x${id.toString(16)}`] === undefined);
    expect(uncovered, 'a shipped record the fixture (the game’s table, numbers only) does not hold').toEqual([]);
    expect(Object.keys(table).length).toBeGreaterThan(400);
  });

  it('carries only the records where our formula would put the command in another class', () => {
    expect(Object.keys(FORMULA_BYTE_OVERRIDES).length).toBeGreaterThan(40);
    for (const byte of Object.values(FORMULA_BYTE_OVERRIDES)) expect([1, 3]).toContain(byte);
  });
});
