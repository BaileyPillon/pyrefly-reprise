/**
 * **The FFX target step, engine side** (re-parity RC11, lane "FFX target parity"; **FFX only**; switch `TARGET_STEP_PARITY`, default OFF; the HUD half is `ui-ffx-target-step-parity.test.ts`; the
 * handoff is `docs/handoff/re-parity-rc11-ffx-target-parity.md`).
 *
 * The first block is a **model of the game** written from `FFX-G11e` sections 1 to 3 (the record's target word, the builder 0x898640, the dead-first rule 0x89A58F) with no import from the engine;
 * the sweep compares every row the real engine offers in every chapter against it. The rest drives the real engine item by item, off and on and with the item skipped.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { pinSwitchesToPreR55 } from './helpers/pinPreR55Switches.ts';
import fixture from '../fixtures/parity/ffx/target_words.json';
import type { AvailableCommand, BattleEngine, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { TARGET_WORDS, decodeTargetWord, targetSpecOf } from '../../src/battle/ffx/kernel/target-words.ts';
import { TARGET_STEP_PARITY, recordStep, setTargetStepParity, targetStepFor, type TargetStepItem } from '../../src/battle/ffx/target-step-parity.ts';
import { abilityOf } from '../../src/battle/ffx/state.ts';
import { COMMAND_RECORDS_ITEMS } from '../../src/data/ffx/command-records/items.ts';
import { COMMAND_RECORDS_PLAYER } from '../../src/data/ffx/command-records/player.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { actor, ctxOf, engineFor, keyOf, menuOf, partyOf } from './helpers/menuParityDrive.ts';
import { firstLinkSetup, newEngine } from './helpers/lastSummoningDrive.ts';
import type { FFXEngine } from '../../src/battle/ffx/index.ts';

pinSwitchesToPreR55(); // r55 RE: the four parity switches ship ON; this file was written for OFF and turns on what it exercises

let restore: (() => void) | undefined;
const on = (skip: readonly TargetStepItem[] = []): void => {
  restore?.();
  restore = setTargetStepParity(true, skip);
};
afterEach(() => {
  restore?.();
  restore = undefined;
});
beforeAll(async () => {
  await engineFor('yunalesca');
});

/** The chapters with the airship range gap (a foe is out of reach for an item or a heal), where a side can be unreachable although alive. */
const RANGE_GAP = ['evrae-airship', 'sin-fins-core', 'sin-face', 'exp-fayth'];
const CHAPTERS = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico', 'sin-fins-core', 'sin-face', 'mirror-aeons', 'sinspawn-gui', 'exp-fayth', 'biran-yenke', 'last-summoning'];

/** KO a party member the way the engine reads it. */
function ko(engine: FFXEngine, id: string): void {
  const c = actor(engine, id);
  c.hp = 0;
  c.alive = false;
  c.statuses.ko = { id: 'ko', turnsRemaining: 254 } as never;
}
const rowOf = (rows: readonly AvailableCommand[], label: string): AvailableCommand => {
  const r = rows.find((x) => x.label === label);
  if (!r) throw new Error(`no row ${label} in ${rows.map((x) => x.label).join(', ')}`);
  return r;
};
/** Advance (the others defend) until it is `id`'s turn; the rows of that decision. */
function untilTurn(engine: FFXEngine, id: string): AvailableCommand[] {
  for (let i = 0; i < 200; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') break;
    if (d.actorId === id) return d.commands;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`no turn for ${id}`);
}
const fillOverdrive = (engine: FFXEngine, id: string): void => {
  actor(engine, id).overdrive!.gauge = 100;
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// The model of the game (FFX-G11e), with no import from the engine
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
interface ModelWord {
  step: boolean;
  foeFirst: boolean;
  mode: number;
  switchable: boolean;
  dead: boolean;
}
const modelWord = (w: number): ModelWord => ({ step: (w & 1) === 1, foeFirst: (w & 2) === 2, mode: (w >> 2) & 3, switchable: (w & 0x20) === 0x20, dead: (w & 0x40) === 0x40 });
interface Cand {
  id: string;
  side: 'party' | 'enemy';
  ko: boolean;
}
/** Where the cursor opens (0x898640, then 0x89A58F): ally side first = the user's own entry, or the first KO'd ally in list order when the dead may be chosen; foe side first = index 0 of the foes. */
function modelStart(w: ModelWord, cands: readonly Cand[], userId: string): string | undefined {
  const allies = cands.filter((c) => c.side === 'party');
  if (!w.foeFirst) {
    if (w.dead) {
      const fallen = allies.find((c) => c.ko);
      if (fallen) return fallen.id;
    }
    return allies.some((c) => c.id === userId) ? userId : allies[0]?.id;
  }
  return cands.find((c) => c.side === 'enemy')?.id;
}

describe('the model of the game: the target words', () => {
  it('pins the words G11e names (Guard, Sentinel, Defend, Copycat, Shield, Boost: step, ally side, mode 3)', () => {
    for (const id of [0x3021, 0x3022, 0x3023, 0x3028, 0x3054, 0x3055]) {
      expect(modelWord(0x58d), `0x${id.toString(16)}`).toEqual({ step: true, foeFirst: false, mode: 3, switchable: false, dead: false });
    }
    for (const id of [0x3022, 0x3023, 0x3028, 0x3054, 0x3055]) expect(TARGET_WORDS[id], `0x${id.toString(16)}`).toBe(0x58d);
  });

  it('pins the records the plan reads: Attack, Cure, Life, Phoenix Down, Talk, Slice and Dice, Combine powers, the seven self orders', () => {
    expect(TARGET_WORDS[0x3000]).toBe(0x633); // Attack: step, foe side, switchable
    expect(TARGET_WORDS[0x302b]).toBe(0x5b1); // Cure: step, ally side, switchable
    expect(TARGET_WORDS[0x3034]).toBe(0x5f1); // Life: + the dead
    expect(TARGET_WORDS[0x2006]).toBe(0x571); // Phoenix Down: step, ally side, switchable, the dead
    expect(TARGET_WORDS[0x3105]).toBe(0x593); // Talk: step, foe side, single, NOT mode 3 (G11b: Talk is 0x3105)
    expect(TARGET_WORDS[0x3061]).toBe(0x407); // Slice and Dice: step, foe side, group mode
    expect(TARGET_WORDS[0x3129]).toBe(0x589); // Combine powers: step, ally side, mode 2
    for (const id of [0x3124, 0x3125, 0x3126, 0x3127, 0x3128, 0x312a, 0x312b, 0x312c]) expect(modelWord(TARGET_WORDS[id]!).mode, `0x${id.toString(16)}`).toBe(3);
  });

  it('the table equals the fixture written from the research tables, and decodes like the model', () => {
    const table = Object.fromEntries(Object.entries(TARGET_WORDS).map(([id, w]) => ['0x' + Number(id).toString(16), '0x' + w.toString(16)]));
    expect(table).toEqual(fixture);
    for (const [id, w] of Object.entries(TARGET_WORDS)) {
      const d = decodeTargetWord(w);
      const m = modelWord(w);
      expect({ step: d.step, foeFirst: d.foeFirst, mode: d.mode, switchable: d.switchable, dead: d.canTargetDead }, `0x${Number(id).toString(16)}`).toEqual(m);
    }
  });

  it('holds a word for every player command and item record the project ships', () => {
    const missing = [...Object.entries(COMMAND_RECORDS_PLAYER), ...Object.entries(COMMAND_RECORDS_ITEMS)].filter(([, rec]) => TARGET_WORDS[rec.id] === undefined).map(([k]) => k);
    expect(missing).toEqual([]);
  });

  it('the dead bit is on exactly the revives the game lists (G11e: 0x3034, 0x3035, 0x30AF, 0x30B0, 0x30B4, 0x311F and the items 0x2006, 0x2007)', () => {
    const dead = Object.entries(TARGET_WORDS).filter(([, w]) => (w & 0x40) === 0x40).map(([id]) => Number(id));
    for (const id of [0x3034, 0x3035, 0x30af, 0x30b0, 0x30b4, 0x2006, 0x2007]) expect(dead).toContain(id);
    expect(dead.every((id) => id === 0x311f || [0x3034, 0x3035, 0x30af, 0x30b0, 0x30b4, 0x2006, 0x2007].includes(id))).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Off: nothing moves
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('switch off: no row carries a target step and the legality is the same', () => {
  it('is off by default, with no skipped item', () => {
    expect(TARGET_STEP_PARITY).toEqual({ on: false, skip: [] });
  });

  it('every row of every member of every chapter is free of targetStep, and recordStep answers nothing', async () => {
    for (const ch of CHAPTERS) {
      const engine = await engineFor(ch);
      for (const id of partyOf(engine)) {
        const rows = menuOf(engine, id);
        expect(rows.some((r) => r.targetStep !== undefined), `${ch} ${id}`).toBe(false);
        expect(recordStep(ctxOf(engine), actor(engine, id), 0x3022)).toBeUndefined();
      }
    }
  });

  it('setTargetStepParity returns the function that puts both back', () => {
    const back = setTargetStepParity(true, ['copycat']);
    expect(TARGET_STEP_PARITY).toEqual({ on: true, skip: ['copycat'] });
    back();
    expect(TARGET_STEP_PARITY).toEqual({ on: false, skip: [] });
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// On: the sweep against the model
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('switch on: every row of every member of every chapter against the model of the game', () => {
  it('legality is untouched (same rows, same validTargets, same enabled), and each step is what the model says', async () => {
    let stepRows = 0;
    for (const ch of CHAPTERS) {
      const engine = await engineFor(ch);
      for (const id of partyOf(engine)) {
        const before = menuOf(engine, id);
        on();
        const after = menuOf(engine, id);
        restore?.();
        restore = undefined;
        expect(after.map(keyOf), `${ch} ${id}: the rows`).toEqual(before.map(keyOf));
        expect(after.map((r) => [r.enabled, r.validTargets, r.targeting]), `${ch} ${id}: legality`).toEqual(before.map((r) => [r.enabled, r.validTargets, r.targeting]));
        const state = engine.state().combatants;
        const user = id;
        for (const row of after) {
          const cmd = row.command as { kind: string; id?: string };
          const recId = cmd.kind === 'attack' ? 0x3000 : (COMMAND_RECORDS_PLAYER[cmd.id ?? ''] ?? COMMAND_RECORDS_ITEMS[cmd.id ?? ''])?.id;
          const word = recId === undefined ? undefined : TARGET_WORDS[recId];
          const w = word === undefined ? undefined : modelWord(word);
          const step = row.targetStep;
          const t = row.targeting;
          const single = t === 'single-enemy' || t === 'single-ally' || t === 'single-any';
          // A row the model says opens a cursor the old menu skipped, or carries a start or a switch, has a step; one it says nothing about has none.
          const expectsStep =
            w !== undefined && w.step && ((single && w.mode === 0 && row.validTargets.length > 0) || (t === 'self' && (w.mode === 3 || (w.mode === 0 && w.foeFirst))) || (t === 'random-enemy' && w.foeFirst && row.validTargets.length > 0));
          if (!expectsStep || (t === 'self' && w!.mode === 0 && w!.foeFirst && !Object.values(state).some((c) => c.side === 'enemy' && c.alive))) {
            if (!expectsStep) expect(step, `${ch} ${id} ${row.label}: no step expected`).toBeUndefined();
            continue;
          }
          if (!step) throw new Error(`${ch} ${id} ${row.label}: the model says a step opens`);
          stepRows += 1;
          for (const c of step.candidates) expect(state[c], `${ch} ${id} ${row.label} ${c}`).toBeDefined();
          if (step.start !== undefined) expect(step.candidates, `${ch} ${id} ${row.label} start in candidates`).toContain(step.start);
          if (single) {
            expect(step.candidates, `${ch} ${id} ${row.label} candidates`).toEqual(row.validTargets);
            const cands: Cand[] = step.candidates.map((c) => ({ id: c, side: state[c]!.side === 'enemy' ? 'enemy' : 'party', ko: state[c]!.hp <= 0 }));
            expect(step.start, `${ch} ${id} ${row.label}: the start`).toBe(modelStart(w!, cands, user));
            if (step.switchTo) {
              expect(w!.switchable && t !== 'single-any', `${ch} ${id} ${row.label}: switchTo only for a switchable single-side record`).toBe(true);
              const firstIsFoe = state[step.candidates[0]!]!.side === 'enemy';
              for (const c of step.switchTo) expect(state[c]!.side === 'enemy', `${ch} ${id} ${row.label} switchTo ${c}`).toBe(!firstIsFoe);
            } else if (w!.switchable && t !== 'single-any' && !RANGE_GAP.includes(ch)) {
              // no other side to switch to: allowed only when that side has nobody the cursor could rest on
              const firstIsFoe = state[step.candidates[0]!]!.side === 'enemy';
              const other = Object.values(state).filter((c) => (c.side === 'enemy') !== firstIsFoe && c.alive && c.hp > 0 && !c.flags.untargetable && !c.flags.hidden && (c.side !== 'enemy' || (c.flags.battleDistance ?? 0) <= 0));
              expect(other.length, `${ch} ${id} ${row.label}: a switchable row with a live other side has switchTo`).toBe(0);
            }
          } else if (t === 'self' && w!.mode === 3) {
            expect(step, `${ch} ${id} ${row.label}`).toEqual({ candidates: [user], start: user });
          } else if (t === 'random-enemy') {
            expect(step.candidates, `${ch} ${id} ${row.label}`).toEqual(row.validTargets);
          }
        }
      }
    }
    expect(stepRows).toBeGreaterThan(500);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// t1: selfStep
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('t1 selfStep: a self-only command with the step bit opens a cursor on the user (FFX-G11e A7, A8)', () => {
  it("off: Auron's Guard and Sentinel carry no step (the menu commits them at once)", async () => {
    const engine = await engineFor('yunalesca');
    const rows = menuOf(engine, 'auron');
    for (const label of ['Guard', 'Sentinel']) expect(rowOf(rows, label).targetStep).toBeUndefined();
  });

  it("on: Guard and Sentinel carry a step whose only candidate is Auron, who the cursor opens on", async () => {
    const engine = await engineFor('yunalesca');
    on();
    const rows = menuOf(engine, 'auron');
    for (const label of ['Guard', 'Sentinel']) {
      const r = rowOf(rows, label);
      expect(r.targetStep, label).toEqual({ candidates: ['auron'], start: 'auron' });
      expect(r.validTargets, label).toEqual(['auron']); // legality untouched
    }
  });

  it('skipped: the item off leaves Guard as it was', async () => {
    const engine = await engineFor('yunalesca');
    on(['selfStep']);
    expect(rowOf(menuOf(engine, 'auron'), 'Guard').targetStep).toBeUndefined();
  });

  it("on: an aeon's Shield and Boost open a cursor on the aeon (records 0x3054, 0x3055)", async () => {
    const engine = await engineFor('seymour-flux');
    on();
    const yuna = menuOf(engine, 'yuna');
    const summon = rowOf(yuna, 'Valefor');
    engine.submit({ ...summon.command, targets: [] });
    let d = engine.nextDecision();
    for (let i = 0; i < 40 && !(d.kind === 'player-input' || (d as { actorId?: string }).actorId === 'valefor'); i += 1) d = engine.nextDecision();
    const aeonRows = menuOf(engine, 'valefor');
    for (const label of ['Shield', 'Boost']) expect(rowOf(aeonRows, label).targetStep, label).toEqual({ candidates: ['valefor'], start: 'valefor' });
  });

  it("on: the Magus Sisters' seven self orders open a cursor on the sister; Combine powers rings every ally (G11e: 0x3124 to 0x312B)", async () => {
    const engine = await engineFor('yunalesca');
    const ctx = ctxOf(engine);
    const user = actor(engine, 'yuna');
    expect(recordStep(ctx, user, 0x3124, true)).toBeUndefined(); // off
    on();
    for (const id of [0x3124, 0x3125, 0x3126, 0x3127, 0x3128, 0x312a, 0x312b]) expect(recordStep(ctx, user, id, true), `0x${id.toString(16)}`).toEqual({ candidates: ['yuna'], start: 'yuna' });
    expect(recordStep(ctx, user, 0x3129, true)).toEqual({ candidates: ['tidus', 'yuna', 'auron'], start: 'yuna', group: true });
    expect(recordStep(ctx, user, 0x3129, false)).toBeUndefined(); // a caller that does not allow a group gets none
  });

  it("on: the real Sisters' menu (the hidden Last Summoning): the self orders open a cursor on Cindy, Combine powers rings the three, Dismiss has none; off: none", async () => {
    type Input = Extract<Decision, { kind: 'player-input' }>;
    const turnOf = async (parity: boolean): Promise<AvailableCommand[]> => {
      restore?.();
      restore = undefined;
      if (parity) on();
      const { setup } = await firstLinkSetup(['valefor'], 4);
      const e: BattleEngine = newEngine(setup);
      const inputFor = (who: string): Input => {
        for (let i = 0; i < 600; i += 1) {
          const d = e.nextDecision();
          if (d.kind === 'player-input') {
            if (d.actorId === who) return d;
            e.submit({ kind: 'defend', targets: [] });
          }
        }
        throw new Error(`no input for ${who}`);
      };
      const call = inputFor('yuna').commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'cindy')!;
      e.submit({ ...call.command, targets: [] });
      return inputFor(e.state().aeonIds![0]!).commands;
    };
    const off = await turnOf(false);
    expect(off.some((r) => r.targetStep !== undefined)).toBe(false);
    const rows = await turnOf(true);
    expect(rowOf(rows, 'Free choice').targetStep).toEqual({ candidates: ['cindy'], start: 'cindy' });
    expect(rowOf(rows, 'Combine for the Delta Attack').targetStep).toEqual({ candidates: ['cindy', 'sandy', 'mindy'], start: 'cindy', group: true });
    expect(rowOf(rows, 'Dismiss').targetStep).toBeUndefined();
  });

  it("on: Talk (0x3105, foe side first) opens a cursor on the foes, not on the user; with cursorStartFoe on (as shipped since r60) it starts on formation index 0, with it skipped it carries no start", async () => {
    const engine = await engineFor('seymour-natus');
    on(); // every item, cursorStartFoe included (the shipped state for this item since r60)
    const talk = rowOf(menuOf(engine, 'tidus'), 'Talk');
    expect(talk.targeting).toBe('self');
    expect(talk.targetStep).toEqual({ candidates: ['seymour-natus', 'mortibody'], start: 'seymour-natus' });
    on(['cursorStartFoe']); // the item skipped (the r55 state, the OFF path kept as a regression check): the HUD opens where it does for every other foe command
    const shipped = rowOf(menuOf(engine, 'tidus'), 'Talk').targetStep!;
    expect(shipped.candidates).toEqual(['seymour-natus', 'mortibody']);
    expect(shipped).not.toHaveProperty('start');
  });

  it("the foe start of Talk, Pull back (0x3107) and Cancel order (0x3108) follows cursorStartFoe: formation index 0 on, no start off, the candidates the same", async () => {
    const engine = await engineFor('seymour-natus');
    const ctx = ctxOf(engine);
    const tidus = actor(engine, 'tidus');
    const foes = ['seymour-natus', 'mortibody'];
    for (const id of [0x3105, 0x3107, 0x3108]) {
      on();
      expect(recordStep(ctx, tidus, id), `0x${id.toString(16)} on`).toEqual({ candidates: foes, start: 'seymour-natus' });
      on(['cursorStartFoe']);
      const off = recordStep(ctx, tidus, id)!;
      expect(off.candidates, `0x${id.toString(16)} off`).toEqual(foes);
      expect(off, `0x${id.toString(16)} off`).not.toHaveProperty('start');
      on(['selfStep']);
      expect(recordStep(ctx, tidus, id), `0x${id.toString(16)} selfStep skipped`).toBeUndefined();
    }
  });

  it('on: the rows that commit at once still do: Flee, Doublecast, Grand Summon, Summon entries, the Defend row, Switch, Escape', async () => {
    const engine = await engineFor('braskas-final-aeon');
    on();
    for (const id of partyOf(engine)) {
      for (const r of menuOf(engine, id)) {
        if (['Flee', 'Doublecast', 'Grand Summon', 'Defend', 'Escape'].includes(r.label) || ['summon', 'defend', 'switch', 'escape'].includes(r.command.kind)) {
          expect(r.targetStep, `${id} ${r.label}`).toBeUndefined();
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// t2: overdriveStep
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('t2 overdriveStep: a random-foe command has the step even against one foe (FFX-G11e section 6 row 5)', () => {
  it("on: Tidus's Slice and Dice against one foe carries a one-candidate step; off: none", async () => {
    const engine = await engineFor('yunalesca');
    fillOverdrive(engine, 'tidus');
    const off = rowOf(menuOf(engine, 'tidus'), 'Slice & Dice');
    expect(off.targeting).toBe('random-enemy');
    expect(off.targetStep).toBeUndefined();
    on();
    const row = rowOf(menuOf(engine, 'tidus'), 'Slice & Dice');
    expect(row.targetStep).toEqual({ candidates: ['yunalesca'], start: 'yunalesca' });
    expect(row.validTargets).toEqual(['yunalesca']);
  });

  it('skipped: the item off leaves it', async () => {
    const engine = await engineFor('yunalesca');
    fillOverdrive(engine, 'tidus');
    on(['overdriveStep']);
    expect(rowOf(menuOf(engine, 'tidus'), 'Slice & Dice').targetStep).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// t3: cursorStart, cursorStartFoe; t4: revive with nobody KO'd
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('t3 cursorStart: where the cursor opens (FFX-G11e section 3)', () => {
  it("on: an ally-first command opens on the caster, whoever stands leftmost (Cure from Yuna, Potion from Auron)", async () => {
    const engine = await engineFor('yunalesca');
    on();
    expect(rowOf(menuOf(engine, 'yuna'), 'Cure').targetStep?.start).toBe('yuna');
    expect(rowOf(menuOf(engine, 'auron'), 'Potion').targetStep?.start).toBe('auron');
    expect(rowOf(menuOf(engine, 'tidus'), 'Potion').targetStep?.start).toBe('tidus');
  });

  it('on: a revive opens on the first KO\'d ally in party order, whoever casts it (Phoenix Down, Life)', async () => {
    const engine = await engineFor('yunalesca');
    ko(engine, 'yuna');
    ko(engine, 'auron');
    on();
    expect(rowOf(menuOf(engine, 'tidus'), 'Phoenix Down').targetStep?.start).toBe('yuna');
    const engine2 = await engineFor('yunalesca');
    ko(engine2, 'auron');
    on();
    expect(rowOf(menuOf(engine2, 'tidus'), 'Phoenix Down').targetStep?.start).toBe('auron');
    expect(rowOf(menuOf(engine2, 'yuna'), 'Life').targetStep?.start).toBe('auron');
  });

  it('on: Cure from a caster with a KO\'d ally still opens on the caster (the dead bit is not on Cure)', async () => {
    const engine = await engineFor('yunalesca');
    ko(engine, 'auron');
    on();
    expect(rowOf(menuOf(engine, 'yuna'), 'Cure').targetStep?.start).toBe('yuna');
  });

  it('skipped: with cursorStart off the ally start is left to the HUD (no start id)', async () => {
    const engine = await engineFor('yunalesca');
    on(['cursorStart']);
    expect(rowOf(menuOf(engine, 'yuna'), 'Cure').targetStep?.start).toBeUndefined();
    expect(rowOf(menuOf(engine, 'tidus'), 'Attack').targetStep?.start).toBe('yunalesca'); // the foe item is a separate one
  });
});

describe('t3 cursorStartFoe: a foe-first command opens on index 0 of the foe list (formation order)', () => {
  it('on: the first foe in formation order, not a screen position (Macalania: Guado Guardian A leads, Anima is last)', async () => {
    const engine = await engineFor('seymour-anima-macalania');
    on();
    const ids = ctxOf(engine).state.enemyIds;
    const row = rowOf(menuOf(engine, 'tidus'), 'Attack');
    expect(row.targetStep?.start).toBe(row.validTargets.find((c) => ids.includes(c)));
    expect(row.targetStep?.start).toBe(ids.find((c) => row.validTargets.includes(c)));
  });

  it('skipped: with cursorStartFoe off (the r55 state, kept as the OFF-path check) the foe start is left to the HUD', async () => {
    const engine = await engineFor('seymour-anima-macalania');
    on(['cursorStartFoe']);
    expect(rowOf(menuOf(engine, 'tidus'), 'Attack').targetStep?.start).toBeUndefined();
  });
});

describe('t4: a revive with nobody KO\'d is a normal row: cursor on the user, the pick commits, nothing happens, the cost is spent (FFX-G11e Q2.1)', () => {
  it('Life and Phoenix Down are enabled and list the living allies, off and on; the cursor opens on the user on', async () => {
    const engine = await engineFor('yunalesca');
    for (const label of ['Life', 'Phoenix Down']) {
      const off = rowOf(menuOf(engine, 'yuna'), label);
      expect(off.enabled, label).toBe(true);
      expect(off.validTargets, label).toEqual(expect.arrayContaining(['tidus', 'yuna', 'auron']));
    }
    on();
    for (const label of ['Life', 'Phoenix Down']) {
      const r = rowOf(menuOf(engine, 'yuna'), label);
      expect(r.enabled, label).toBe(true);
      expect(r.targetStep?.start, label).toBe('yuna');
      expect(r.targetStep?.candidates, label).toEqual(expect.arrayContaining(['tidus', 'yuna', 'auron']));
    }
  });

  it('Life on a living ally spends the MP and does nothing (a wrong-state miss), off and on', async () => {
    for (const parity of [false, true]) {
      const engine = await engineFor('yunalesca');
      if (parity) on();
      const life = rowOf(untilTurn(engine, 'yuna'), 'Life');
      const mp = actor(engine, 'yuna').mp;
      const hp = actor(engine, 'auron').hp;
      const events = engine.submit({ ...life.command, targets: ['auron'] } as Command);
      expect(events.some((e) => e.type === 'miss' && (e as { reason?: string }).reason === 'wrong-state'), `parity ${parity}`).toBe(true);
      expect(actor(engine, 'auron').hp, `parity ${parity}`).toBe(hp);
      expect(actor(engine, 'yuna').mp, `parity ${parity}`).toBe(mp - life.mpCost);
    }
  });

  it('Phoenix Down on a living ally spends the item and does nothing, off and on', async () => {
    for (const parity of [false, true]) {
      const engine = await engineFor('yunalesca');
      if (parity) on();
      const row = rowOf(untilTurn(engine, 'tidus'), 'Phoenix Down');
      const id = (row.command as { id: string }).id;
      const count = ctxOf(engine).rt.inventory.get(id) ?? 0;
      const events = engine.submit({ ...row.command, targets: ['auron'] } as Command);
      expect(events.some((e) => e.type === 'miss'), `parity ${parity}`).toBe(true);
      expect(ctxOf(engine).rt.inventory.get(id) ?? 0, `parity ${parity}`).toBe(count - 1);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// t5: sideSwitch
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('t5 sideSwitch: Attack and the spells may switch to the other side (FFX-G11e: the record\'s bit 5)', () => {
  it('off: no switchTo; on: Attack lists the party (the user included) and Cure lists the foes; single-any rows already hold both sides', async () => {
    const engine = await engineFor('yunalesca');
    expect(rowOf(menuOf(engine, 'tidus'), 'Attack').targetStep).toBeUndefined();
    on();
    const attack = rowOf(menuOf(engine, 'tidus'), 'Attack');
    expect(attack.targetStep?.switchTo).toEqual(['tidus', 'yuna', 'auron']);
    expect(attack.validTargets).toEqual(['yunalesca']); // legality in the row is unchanged
    expect(rowOf(menuOf(engine, 'yuna'), 'Cure').targetStep?.switchTo).toEqual(['yunalesca']);
    expect(rowOf(menuOf(engine, 'yuna'), 'Dispel').targetStep?.switchTo).toBeUndefined();
    expect(rowOf(menuOf(engine, 'tidus'), 'Phoenix Down').targetStep?.switchTo).toBeUndefined();
  });

  it('on: rows whose record has no switch bit carry none (Provoke, Steal, the Overdrives)', async () => {
    const engine = await engineFor('yunalesca');
    on();
    expect(rowOf(menuOf(engine, 'tidus'), 'Provoke').targetStep?.switchTo).toBeUndefined();
  });

  it('skipped: with sideSwitch off there is no switchTo', async () => {
    const engine = await engineFor('yunalesca');
    on(['sideSwitch']);
    expect(rowOf(menuOf(engine, 'tidus'), 'Attack').targetStep?.switchTo).toBeUndefined();
  });

  it('at the airship gap an item cannot be switched to the foe (it does not reach); near it can', async () => {
    const engine = await engineFor('evrae-airship');
    on();
    ctxOf(engine).state.flags['airship.range'] = 'far';
    expect(rowOf(menuOf(engine, 'tidus'), 'Hi-Potion').targetStep?.switchTo).toBeUndefined();
    ctxOf(engine).state.flags['airship.range'] = 'near';
    expect(rowOf(menuOf(engine, 'tidus'), 'Hi-Potion').targetStep?.switchTo).toEqual(['evrae']);
  });

  it('a record the rows do not match builds no step: a random-foe row whose record is ally side first, a single row whose record is a group mode, and an enemy user', async () => {
    const engine = await engineFor('yunalesca');
    on();
    const ctx = ctxOf(engine);
    const yuna = actor(engine, 'yuna');
    const cure = abilityOf(ctx, 'cure')!;
    const row = rowOf(menuOf(engine, 'yuna'), 'Cure');
    expect(targetStepFor(ctx, yuna, cure, row)).toBeDefined();
    expect(targetStepFor(ctx, yuna, cure, { ...row, targeting: 'random-enemy', validTargets: ['yunalesca'] })).toBeUndefined(); // 0x302B is ally side first
    expect(targetStepFor(ctx, yuna, { ...cure, record: { ...cure.record!, id: 0x30ac } }, row)).toBeUndefined(); // 0x30AC is a group mode record
    expect(recordStep(ctx, actor(engine, 'yunalesca'), 0x3022)).toBeUndefined(); // an enemy user never gets a player's step
  });

  it('the engine applies an Attack aimed at an ally (the cursor switched): that ally is hit, nothing else changes', async () => {
    const engine = await engineFor('yunalesca');
    on();
    const attack = rowOf(untilTurn(engine, 'tidus'), 'Attack');
    const hp = actor(engine, 'auron').hp;
    const events = engine.submit({ ...attack.command, targets: ['auron'] } as Command);
    expect(events.some((e) => e.type === 'damage' && (e as { targetId?: string }).targetId === 'auron')).toBe(true);
    expect(actor(engine, 'auron').hp).toBeLessThan(hp);
  });

  it('the shipped strategies never pick a switched target: every pick across chapters is a validTarget of its own row', async () => {
    on();
    for (const ch of ['yunalesca', 'seymour-natus', 'sin-fins-core', 'mirror-aeons']) {
      const engine = await engineFor(ch);
      for (let n = 0; n < 40; n += 1) {
        const d = engine.nextDecision();
        if (d.kind === 'resolved' || d.kind === 'waiting') continue;
        if (d.kind === 'battle-over') break;
        const pick = intendedStrategy(d.actorId, d.commands, engine);
        if (!pick) break;
        const row = d.commands.find((r) => r.command.kind === pick.kind && ((r.command as { id?: string }).id ?? '') === ((pick as { id?: string }).id ?? ''));
        for (const t of pick.targets) {
          const legal = row ? row.validTargets : [];
          const switched = row?.targetStep?.switchTo ?? [];
          if (switched.includes(t)) expect(legal, `${ch}: ${d.actorId} ${row?.label} picked a switched target`).toContain(t);
        }
        engine.submit(pick);
      }
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// t7: copycat
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('t7 copycat: the game\'s Copycat is self-only with the step bit (0x3028); the catalog has it single-any; no shipped chapter has it', () => {
  const addCopycat = (engine: FFXEngine): void => {
    const rikku = (engine.state().combatants as Record<string, FFXCombatant>)['tidus']!;
    rikku.learnedAbilityIds.push('copycat');
  };

  it('no chapter\'s first menu holds a Copycat row', async () => {
    for (const ch of CHAPTERS) {
      const engine = await engineFor(ch);
      for (const id of partyOf(engine)) expect(menuOf(engine, id).some((r) => r.label === 'Copycat'), `${ch} ${id}`).toBe(false);
    }
  });

  it('off: single-any over everyone; on: self over the user with a cursor on the user; skipped: single-any again', async () => {
    const engine = await engineFor('yunalesca');
    addCopycat(engine);
    const off = rowOf(menuOf(engine, 'tidus'), 'Copycat');
    expect(off.targeting).toBe('single-any');
    expect(off.validTargets.length).toBeGreaterThan(1);
    on();
    const row = rowOf(menuOf(engine, 'tidus'), 'Copycat');
    expect(row.targeting).toBe('self');
    expect(row.validTargets).toEqual(['tidus']);
    expect(row.targetStep).toEqual({ candidates: ['tidus'], start: 'tidus' });
    on(['copycat']);
    expect(rowOf(menuOf(engine, 'tidus'), 'Copycat').targeting).toBe('single-any');
  });
});

describe('the spec reader', () => {
  it('targetSpecOf answers nothing for an unknown record id and for none', () => {
    expect(targetSpecOf(undefined)).toBeUndefined();
    expect(targetSpecOf(0x4001)).toBeUndefined();
    expect(targetSpecOf(0x3022)).toEqual({ step: true, foeFirst: false, mode: 3, switchable: false, canTargetDead: false });
  });
});
