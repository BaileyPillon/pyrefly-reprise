/**
 * **Action time per command** (re-parity lane X2-A, row XA6 slice A; FFX-2 only; note FFX2-G11 sections 2, 3 and 6).
 *
 * The kernel (`kernel/action-span.ts`), the adapter (`action-span.ts`) and the data (`data/ffx2/action-frames.ts`) are checked here against numbers worked out BY HAND from the
 * data's own frame counts: three girls, three bosses, the casts, Haste, Slow, the precedence of the switches and the engine's executing countdown. The switch is OFF in
 * production; every case that needs it ON says so through `withActionSpanKnobs`. Switch-off equivalence with the base commit is `ffx2-action-span-off.test.ts`.
 *
 * The hand arithmetic (steps; one frame is one step at ratio 1.0; 29.97003 steps a second; the run distance is 52.4 field units):
 * - idle break = ceil(idle / 2); run-up = ceil((52.4 - startDist) / speed * 29.97003); attack = attack1_00. A girl always waits for the idle break; a monster only with `idle_wait`.
 * - Yuna, Mascot (set 0x8: idle 48, attack 8; speed 40, start 15): 24 + ceil(28.02) + 8 = 24 + 29 + 8 = 61.
 * - Rikku, Mascot (set 0x1c: idle 28, attack 6; speed 44, start 5): 14 + ceil(32.29) + 6 = 14 + 33 + 6 = 53. Hasted: 7 + ceil(16.14) + 3 = 7 + 17 + 3 = 27.
 * - Paine, Mascot (set 0x30: idle 36, attack 10; speed 38, start 15): 18 + ceil(29.50) + 10 = 18 + 30 + 10 = 58.
 * - Bahamut (set 0x10a8: no run bit, no idle_wait, attack 43): 43. Leblanc (0x1083: run_01, speed 70, start 20, attack 3): ceil(13.87) + 3 = 14 + 3 = 17.
 *   Trema (0x1127: run_00_01, idle_wait, idle 60, speed 50, start 10, attack 10): 30 + ceil(25.41) + 10 = 30 + 26 + 10 = 66.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { FALLEN_AEONS_CHAIN_ORDER } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { CORE_ABILITIES } from '../../src/battle/ffx2/abilities-core.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { ACTION_TIME_PER_COMMAND, actionTimeSteps } from '../../src/battle/ffx2/action-time.ts';
import { actionStepsFor, classAndEffect, commandSpanSteps, effectStepsOf, spanBodyOf, withActionSpanKnobs, type ActionContext, type ActionSpanKnobs } from '../../src/battle/ffx2/action-span.ts';
import { actionSpan, castClipOfClass, classRuns, idleBreakSteps, runUpSteps, SpanKind, spanKindOfClass, type SpanBody, type SpanInput } from '../../src/battle/ffx2/kernel/action-span.ts';
import {
  COMMAND_ROW_ACTION,
  EFFECT_STEPS_ENEMY_ESTIMATE,
  EFFECT_STEPS_PARTY_ESTIMATE,
  GIRL_ACTION_FRAMES,
  MEASURED_EFFECT_STEPS,
  MONSTER_ACTION_FRAMES,
  RUN_DISTANCE_ESTIMATE,
} from '../../src/data/ffx2/action-frames.ts';
import { GIRL_MOTION_SETS, MONSTER_MOTION_SET } from '../../src/data/ffx2/hit-reaction-frames.ts';
import { ABILITIES } from '../../src/data/ffx2/index.ts';

function girl(id: 'yuna' | 'rikku' | 'paine', dressphere: string): Ffx2Unit {
  const u = aiUnit(id, 'party');
  u.dresspheres = { current: dressphere, owned: [dressphere], garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [dressphere] }, abilitiesLearned: {} };
  return u;
}

function monster(row: number): Ffx2Unit {
  const u = aiUnit(`row-${row}`, 'enemy');
  u.enemy = { aiScriptId: 'none', formIndex: 0, forms: [], rewards: { ap: 0, apOverkill: 0, gil: 0, stolenGil: 0, overkillThreshold: 0, exp: 0, drops: [] }, ffx2Record: { row, table: 1 } as never };
  return u;
}

const status = (u: Ffx2Unit, id: string): Ffx2Unit => {
  (u.statuses as Record<string, unknown>)[id] = { id, ticksRemaining: null };
  return u;
};

/** A hand-made ability on a hand-made game row: only the row's id matters to the span (the record carries the cost). */
function abilityWithRecord(over: Partial<NonNullable<AbilityDef['ffx2Record']>> & { id: number }, base: AbilityDef = ABILITIES['x2-black-mage-fire'] as AbilityDef): AbilityDef {
  return { ...base, ffx2Record: { ...(base.ffx2Record as NonNullable<AbilityDef['ffx2Record']>), ...over } };
}

const FIRE = ABILITIES['x2-black-mage-fire'] as AbilityDef;
const ATTACK_CMD: Command = { kind: 'attack', targets: [] } as Command;
const ctxOf = (ability: AbilityDef, command: Command = { kind: 'ability', id: ability.id, targets: [] } as Command): ActionContext => ({ ability, command });

/** A plain Attack ability on the row the unit's own Attack runs on (the engine's generic `attack`). */
const ATTACK = CORE_ABILITIES.find((a) => a.id === 'attack');

describe('the kernel, by hand', () => {
  const body = (over: Partial<SpanBody> = {}): SpanBody => ({
    side: 'girl', idle: 48, attack: 8, castStart: 25, skillStart: 25, itemStart: 10, runs: true, runSpeed: 40, startDist: 15,
    waitAttack: false, waitCharge: false, waitGate: false, ...over,
  });
  const input = (over: Partial<SpanInput> = {}): SpanInput => ({
    kind: SpanKind.Attack, cls: 1, body: body(), stanceRatio: 0x100, actionRatio: 0x100, costCast: 0, effectSteps: 75, runDistance: 52.4, physical: true, casts: true, ...over,
  });

  it('the class table: physical, charge kind, nothing', () => {
    for (const c of [1, 0xd, 0x14, 0x1d, 0x25, 0x26, 0x2b]) expect(spanKindOfClass(c)).toBe(SpanKind.Attack);
    for (const c of [2, 3, 4, 0x15, 0x1c, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x29, 0x2c, 0x2f]) expect(spanKindOfClass(c)).toBe(SpanKind.Cast);
    for (const c of [0, 0x1e, 0x27, 0x28, 0x2a, 0x30, 0x31, 0x32, 5, 0xc]) expect(spanKindOfClass(c)).toBe(SpanKind.None);
    expect([1, 0xd, 0x14, 0x1d, 0x2b].every(classRuns)).toBe(true);
    expect([0x25, 0x26, 3].some(classRuns)).toBe(false);
    expect([2, 0x24].map(castClipOfClass)).toEqual(['item', 'item']);
    expect([4, 0x22, 0x29].map(castClipOfClass)).toEqual(['skill', 'skill', 'skill']);
    expect([3, 0x15, 0x1f].map(castClipOfClass)).toEqual(['magic', 'magic', 'magic']);
  });

  it('a girl\'s Attack is the idle break, the run-up and the attack clip: 24 + 29 + 8 = 61', () => {
    expect(idleBreakSteps(body(), 0x100)).toBe(24);
    expect(runUpSteps(body(), 52.4, 0x100)).toBe(29);
    expect(actionSpan(input())).toBe(61);
  });

  it('Haste halves the clip terms (24 -> 12, 29 -> 15, 8 -> 4 = 31); Slow doubles only the idle break; Stop owes nothing', () => {
    expect(actionSpan(input({ stanceRatio: 0x200, actionRatio: 0x200 }))).toBe(12 + 15 + 4);
    expect(actionSpan(input({ stanceRatio: 0x80 }))).toBe(48 + 29 + 8);
    expect(actionSpan(input({ stanceRatio: 0, actionRatio: 0 }))).toBe(0);
  });

  it('a monster waits for the idle break only with idle_wait, runs only with a run bit, and the gun and trainer attacks never run', () => {
    expect(actionSpan(input({ body: body({ side: 'monster', runs: false, waitAttack: false }) }))).toBe(8);
    expect(actionSpan(input({ body: body({ side: 'monster', runs: false, waitAttack: true }) }))).toBe(24 + 8);
    expect(actionSpan(input({ cls: 0x25 }))).toBe(24 + 8);
    expect(runUpSteps(body({ startDist: 60 }), 52.4, 0x100)).toBe(0); // already inside the attack-start distance
  });

  it('a cast is the effect length; with no countdown a girl adds the idle break and her cast-start clip; Haste does not touch the effect', () => {
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 3, costCast: 70 }))).toBe(75);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 2, costCast: 0 }))).toBe(24 + 10 + 75); // item_00 is 10 frames
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 3, costCast: 0 }))).toBe(24 + 25 + 75);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 3, costCast: 70, stanceRatio: 0x200, actionRatio: 0x200 }))).toBe(75);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 3, costCast: 0, stanceRatio: 0x200, actionRatio: 0x200 }))).toBe(12 + 13 + 75);
  });

  it('a monster\'s charge kind waits for the idle break with a start-wait bit (class 0x1F: at the gate, with magic_throw_wait)', () => {
    const m = (over: Partial<SpanBody>) => body({ side: 'monster', idle: 45, ...over });
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 0x15, costCast: 100, effectSteps: 94, body: m({ waitCharge: true }) }))).toBe(23 + 94);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 0x15, costCast: 100, effectSteps: 94, body: m({ waitCharge: false }) }))).toBe(94);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 0x1f, costCast: 0, effectSteps: 94, body: m({ waitCharge: true, waitGate: false }) }))).toBe(94);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 0x1f, costCast: 0, effectSteps: 94, body: m({ waitGate: true }) }))).toBe(23 + 94);
  });

  it('the two measurement switches take one side out; a command of no class owes nothing', () => {
    expect(actionSpan(input({ physical: false }))).toBe(0);
    expect(actionSpan(input({ kind: SpanKind.Cast, cls: 3, costCast: 70, casts: false }))).toBe(0);
    expect(actionSpan(input({ kind: SpanKind.None, cls: 0x27 }))).toBe(0);
  });
});

describe('the data', () => {
  it('has the clips for every girl set and monster set the hit reaction already knows', () => {
    for (const sets of Object.values(GIRL_MOTION_SETS)) for (const s of sets) expect(GIRL_ACTION_FRAMES[s], `girl set ${s.toString(16)}`).toBeDefined();
    for (const s of new Set(Object.values(MONSTER_MOTION_SET))) expect(MONSTER_ACTION_FRAMES[s], `monster set ${s.toString(16)}`).toBeDefined();
  });

  it('carries the hand-read numbers: the Mascots, Bahamut, Leblanc, Trema; and the three measured effects', () => {
    expect(GIRL_ACTION_FRAMES[0x8]).toEqual([48, 8, 25, 25, 10]);
    expect(GIRL_ACTION_FRAMES[0x1c]).toEqual([28, 6, 10, 10, 14]);
    expect(GIRL_ACTION_FRAMES[0x30]).toEqual([36, 10, 15, 15, 16]);
    expect(MONSTER_ACTION_FRAMES[0x10a8]?.slice(0, 2)).toEqual([45, 43]);
    expect(MONSTER_ACTION_FRAMES[0x1083]?.[5]).toBe(70);
    expect(MONSTER_ACTION_FRAMES[0x1127]?.[1]).toBe(10);
    expect(MEASURED_EFFECT_STEPS).toEqual({ 76: 75, 176: 94, 368: 84 });
    expect([EFFECT_STEPS_PARTY_ESTIMATE, EFFECT_STEPS_ENEMY_ESTIMATE, RUN_DISTANCE_ESTIMATE]).toEqual([75, 94, 52.4]);
  });

  it('knows the class of the rows that matter: Fire, the plain Attacks, No Love Lost (631), Lingering Gaze (176)', () => {
    expect(COMMAND_ROW_ACTION[0x30a5]).toEqual([3, 76]);
    expect(COMMAND_ROW_ACTION[0x302d]?.[0]).toBe(1);
    expect(COMMAND_ROW_ACTION[0x302c]?.[0]).toBe(0x25);
    expect(COMMAND_ROW_ACTION[0x40f6]).toEqual([0x1f, 631]);
    expect(COMMAND_ROW_ACTION[0x4020]).toEqual([0x15, 176]);
  });
});

describe('three girls and three bosses, by hand', () => {
  const attack = (u: Ffx2Unit): number => {
    expect(ATTACK).toBeDefined();
    return withActionSpanKnobs({ perCommand: true }, () => commandSpanSteps(u, ctxOf(ATTACK as AbilityDef, ATTACK_CMD)));
  };

  it('Yuna, Rikku and Paine in the Mascot dressphere: 61, 53 and 58 steps (Rikku Hasted: 27)', () => {
    expect(attack(girl('yuna', 'mascot'))).toBe(61);
    expect(attack(girl('rikku', 'mascot'))).toBe(53);
    expect(attack(girl('paine', 'mascot'))).toBe(58);
    expect(attack(status(girl('rikku', 'mascot'), 'haste'))).toBe(27);
  });

  it('Slow lengthens only the idle break (Yuna Mascot: 48 + 29 + 8 = 85), Haste halves every clip term (Yuna: 12 + 15 + 4 = 31), a Stopped girl plays nothing', () => {
    expect(attack(status(girl('yuna', 'mascot'), 'slow'))).toBe(48 + 29 + 8);
    expect(attack(status(girl('yuna', 'mascot'), 'haste'))).toBe(12 + 15 + 4);
    expect(attack(status(girl('yuna', 'mascot'), 'stop'))).toBe(0);
  });

  it('Bahamut 43, Leblanc 17, Trema 66 (their own plain Attack row 0x41da, class 1)', () => {
    const ability = abilityWithRecord({ id: 0x41da, costCast: 0 }, ATTACK ?? FIRE);
    const span = (row: number): number => withActionSpanKnobs({ perCommand: true }, () => commandSpanSteps(monster(row), ctxOf(ability, ATTACK_CMD)));
    expect(span(168)).toBe(43);
    expect(span(253)).toBe(17);
    expect(span(295)).toBe(66);
  });

  it('a body outside the data takes the labelled fallbacks (Yuna in a dressphere with no set: idle 40/2 = 20, attack 15; her Attack is the gun row, class 0x25, which never runs)', () => {
    const u = girl('yuna', 'psychic');
    expect(spanBodyOf(u).idle).toBe(40);
    expect(attack(u)).toBe(20 + 15);
  });
});

describe('casts', () => {
  const span = (u: Ffx2Unit, ability: AbilityDef): number => withActionSpanKnobs({ perCommand: true }, () => commandSpanSteps(u, ctxOf(ability)));

  it('a girl\'s Fire is the measured 75 (row 0x30a5, effect 76, cost 70: the countdown hides her cast-start clip)', () => {
    expect(classAndEffect(girl('yuna', 'black-mage'), ctxOf(FIRE))).toMatchObject({ cls: 3, effect: 76, costCast: 70 });
    expect(span(girl('yuna', 'black-mage'), FIRE)).toBe(75);
    expect(span(status(girl('paine', 'black-mage'), 'haste'), FIRE)).toBe(75);
  });

  it('an effect nobody measured takes the class default of the actor\'s side: 75 for a girl, 94 for an enemy', () => {
    expect(effectStepsOf(girl('yuna', 'mascot'), 999)).toBe(75);
    expect(effectStepsOf(monster(168), 999)).toBe(94);
    expect(effectStepsOf(monster(168), 176)).toBe(94);
    expect(effectStepsOf(monster(168), 368)).toBe(84);
  });

  it('Bahamut\'s special (class 0x15, cost 100): the idle break of a start-wait body (45/2 = 23) + the 94-step default = 117; Leblanc\'s No Love Lost (0x1F, magic_throw_wait): 14 + 94 = 108', () => {
    expect(span(monster(168), abilityWithRecord({ id: 0x4101, costCast: 200 }))).toBe(23 + 94); // Glint: class 0x15, effect 813
    expect(span(monster(253), abilityWithRecord({ id: 0x40f6, costCast: 0 }))).toBe(14 + 94);
  });
});

describe('the switches', () => {
  const ctx = ctxOf(FIRE);

  it('is OFF in production, and OFF it is exactly the flat time that was there', () => {
    expect(ACTION_TIME_PER_COMMAND).toBe(false);
    const u = girl('yuna', 'black-mage');
    expect(actionStepsFor(undefined, {}, u, ctx)).toBe(0);
    expect(actionStepsFor(undefined, { actionTimeSeconds: 3 }, u, ctx)).toBe(actionTimeSteps(undefined, { actionTimeSeconds: 3 }));
    expect(actionStepsFor(2, {}, u, ctx)).toBe(actionTimeSteps(2, {}));
  });

  it('ON, the span replaces a formation\'s flat 3 s (or keeps it with supersedeFormation off); an engine option always wins; a command that played nothing owes 0', () => {
    const u = girl('yuna', 'black-mage');
    const flags = { actionTimeSeconds: 3 };
    withActionSpanKnobs({ perCommand: true }, () => {
      expect(actionStepsFor(undefined, flags, u, ctx)).toBe(75);
      expect(actionStepsFor(undefined, flags, u, undefined)).toBe(0);
      expect(actionStepsFor(1, flags, u, ctx)).toBe(actionTimeSteps(1, flags));
    });
    withActionSpanKnobs({ perCommand: true, supersedeFormation: false }, () => {
      expect(actionStepsFor(undefined, flags, u, ctx)).toBe(actionTimeSteps(undefined, flags));
      expect(actionStepsFor(undefined, {}, u, ctx)).toBe(75);
    });
  });

  it('the recorder hears each span; the knobs come back after the run', () => {
    const heard: number[] = [];
    const u = girl('yuna', 'black-mage');
    withActionSpanKnobs({ perCommand: true, record: (_unit, steps) => heard.push(steps) }, () => actionStepsFor(undefined, {}, u, ctx));
    expect(heard).toEqual([75]);
    expect(actionStepsFor(undefined, {}, u, ctx)).toBe(0);
  });
});

describe('the engine', () => {
  /** Shiva's turn starts (cumulative steps), the girls defending, with Shiva's link (its formation's flat 3 s taken off) played under the given knobs. */
  function shivaTurns(knobs: Partial<ActionSpanKnobs>, seed = 3, count = 5): number[] {
    return withActionSpanKnobs(knobs, () => {
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'active' }));
      const group = { ...data.ENEMY_GROUPS_BY_ID[FALLEN_AEONS_CHAIN_ORDER[0]]!, actionTimeSeconds: 0 };
      engine.setSeed(seed);
      let clock = 0;
      engine.init({ game: 'ffx2', party: farplaneBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
      const starts: number[] = [];
      for (let i = 0; i < 5000 && starts.length < count; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        const events: BattleEvent[] = d.kind === 'waiting' ? engine.tick(d.nextEventMs) : d.kind === 'player-input' ? engine.submit({ kind: 'defend', targets: [] }) : d.events;
        for (const e of events) {
          if (e.type !== 'turn-start') continue;
          clock += e.elapsedTicks;
          if (e.actorId === 'x2-shiva') starts.push(clock);
        }
      }
      return starts;
    });
  }

  it('with the switch OFF, a battle plays as it did (the same turn starts as the knobs-off run)', () => {
    expect(shivaTurns({})).toEqual(shivaTurns({ perCommand: false }));
  });

  it('ON, the enemy\'s actions take their span: its later turns start later, the first one does not move', () => {
    const off = shivaTurns({});
    const on = shivaTurns({ perCommand: true });
    expect(on[0]).toBe(off[0]);
    expect(on.length).toBeGreaterThan(1);
    expect(on[1]!).toBeGreaterThan(off[1]!);
  });

  it('ON, the recorder hears every action of both sides and every span is a whole number of steps', () => {
    const heard: Array<[string, number]> = [];
    shivaTurns({ perCommand: true, record: (u, steps) => heard.push([u.side, steps]) }, 3, 4);
    expect(heard.some(([side]) => side === 'party')).toBe(true);
    expect(heard.some(([side]) => side === 'enemy')).toBe(true);
    expect(heard.every(([, n]) => Number.isInteger(n) && n >= 0)).toBe(true);
  });
});
