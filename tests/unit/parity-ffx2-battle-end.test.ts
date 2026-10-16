/**
 * Golden vectors for the FFX-2 battle-end kernel (`src/battle/ffx2/kernel/battle-end.ts`, `battle-end-commit.ts`): the evaluation (exe 0x0061ef70), the
 * post-battle machine that commits the end (0x0061e7a0) and the tail of the logic step (0x0061e440).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). A vector is the answer of the REAL game function: the
 * emulator harness (Unicorn) ran it on the live exe and recorded what it returned or wrote; for the two state machines every callee was a recorder that
 * returned a scripted value, so what is replayed is the machine's own decisions, the order and arguments of its calls and the bytes it writes. The three files are
 * a stratified pick of the runs of the checked note FFX2-G10 (20,000 vectors each, 0 mismatches against its independent model):
 *   battle_end_eval    1,376 of 20,000 evaluation worlds, every class (win, loss, escape, mixed, preset, gate, freeze) and every answer
 *   battle_end_commit  640 of 20,000 machine calls, up to three per (start phase, end phase, callee sequence) signature
 *   battle_end_tail    300 of 20,000 tail runs, up to three per (callee sequence, phase) signature
 * The engine-level behaviour (the window, the ledger's neighbour) is in `parity-ffx2-end-window.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BattleEndCode, evaluateBattleEnd, stepTail, type EndChar, type StepTailState, type StepTailWorld } from '../../src/battle/ffx2/kernel/battle-end.ts';
import { commitStep, newEndMachine, type EndMachine } from '../../src/battle/ffx2/kernel/battle-end-commit.ts';

function load<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url), 'utf8')) as T;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The evaluation

type PartyRow = [number, number, number, number, number, number] | null;
interface EvalVector {
  cls: string;
  g: [number, number, number, number, number, number];
  p: PartyRow[];
  m: Array<[number, number, number, number]>;
  out: number;
}
interface EvalFile { count: number; vectors: EvalVector[] }

function partyChar(row: PartyRow): EndChar | null {
  if (row === null) return null;
  return { exists: row[0] !== 0, party: row[1] !== 0, dead: row[2] !== 0, inBattle: row[3] !== 0, status: row[4] >>> 0, hp: row[5] };
}

function monsterChar(row: [number, number, number, number]): EndChar {
  return { inBattle: row[0] !== 0, exists: row[1] !== 0, dead: row[2] !== 0, status: row[3] >>> 0, party: true, hp: 1 };
}

function evaluate(v: EvalVector, overrides: Partial<{ preset: number; killed: number }> = {}): number {
  const [preset, frozen, killed, gateA, gateB, gateC] = v.g;
  return evaluateBattleEnd(
    { preset: overrides.preset ?? preset, frozen, killed: overrides.killed ?? killed, clockGate: gateA !== 0 || gateB !== 0 || gateC !== 0 },
    v.p.map(partyChar),
    v.m.map(monsterChar),
  );
}

describe('FFX-2 battle-end evaluation (0x0061ef70), harness vectors', () => {
  const file = load<EvalFile>('battle_end_eval.json');

  it('replays every vector of the fixture', () => {
    expect(file.vectors.length).toBe(file.count);
    expect(file.count).toBeGreaterThan(1300);
    let wrong = 0;
    const seen = new Set<number>();
    for (const v of file.vectors) {
      seen.add(v.out);
      if (evaluate(v) !== v.out) wrong += 1;
    }
    expect(wrong).toBe(0);
    // Every answer the function gives for the engine's purposes is there: running, party gone, won (both ways) and nobody left in battle.
    for (const code of [0, 1, 2, 3, 4]) expect(seen.has(code), `answer ${code}`).toBe(true);
  });

  it('a result byte, a frozen byte or a closed clock gate is returned unchanged, whatever the characters are', () => {
    for (const v of file.vectors.filter((x) => x.cls === 'preset' || x.cls === 'freeze' || x.cls === 'gate').slice(0, 300)) {
      const [preset, frozen, , a, b, c] = v.g;
      if (preset !== 0 || frozen !== 0 || a !== 0 || b !== 0 || c !== 0) expect(evaluate(v)).toBe(preset);
    }
  });

  it('is independent of the characters it does not read: a monster that is not in battle, not present or dead cannot hold the fight open', () => {
    // (Restated from the rules of the note, not from the vectors: this is the oracle the engine tests share.)
    const girl: EndChar = { exists: true, party: true, dead: false, inBattle: true, status: 0, hp: 100 };
    const live: EndChar = { exists: true, party: false, dead: false, inBattle: true, status: 0, hp: 100 };
    const globals = { preset: 0, frozen: 0, killed: 0, clockGate: false };
    expect(evaluateBattleEnd(globals, [girl, null, null], [live])).toBe(BattleEndCode.Running);
    for (const gone of [{ inBattle: false }, { exists: false }, { dead: true }, { status: 1 }, { status: 2 }]) {
      expect(evaluateBattleEnd(globals, [girl, null, null], [live, { ...live, ...gone }])).toBe(BattleEndCode.Running); // `live` still stands
      expect(evaluateBattleEnd(globals, [girl, null, null], [{ ...live, ...gone }])).toBe(BattleEndCode.Won); // it alone does not hold the fight open
    }
  });

  it('names the cases of the note: all-stone enemies are defeated, an ejected girl is alive but not in the battle, a sleeper and a dead-with-HP girl are alive', () => {
    const girl: EndChar = { exists: true, party: true, dead: false, inBattle: true, status: 0, hp: 100 };
    const foe: EndChar = { exists: true, party: false, dead: false, inBattle: true, status: 0, hp: 100 };
    const g = { preset: 0, frozen: 0, killed: 0, clockGate: false };
    // all petrified: won; one standing: not
    expect(evaluateBattleEnd(g, [girl, null, null], [{ ...foe, status: 2 }, { ...foe, status: 2 }])).toBe(BattleEndCode.Won);
    expect(evaluateBattleEnd(g, [girl, null, null], [{ ...foe, status: 2 }, foe])).toBe(BattleEndCode.Running);
    expect(evaluateBattleEnd({ ...g, killed: 1 }, [girl, null, null], [{ ...foe, status: 2 }])).toBe(BattleEndCode.WonRewarded);
    // an ejected (out of battle, alive) girl is not a loss; with nobody in battle the end is 3; a petrified one is not alive
    const ejected = { ...girl, inBattle: false };
    expect(evaluateBattleEnd(g, [ejected, null, null], [foe])).toBe(BattleEndCode.NobodyInBattle);
    expect(evaluateBattleEnd(g, [{ ...girl, status: 2 }, null, null], [foe])).toBe(BattleEndCode.PartyGone);
    expect(evaluateBattleEnd(g, [{ ...girl, dead: true, hp: 0 }, ejected, null], [foe])).toBe(BattleEndCode.NobodyInBattle);
    expect(evaluateBattleEnd(g, [{ ...girl, dead: true, hp: 0 }, { ...girl, status: 2 }, null], [foe])).toBe(BattleEndCode.PartyGone);
    // a girl in battle who sleeps (a status the evaluation does not read) still stands; the dead byte with HP above 0 counts alive but never in battle
    expect(evaluateBattleEnd(g, [{ ...girl, status: 0x4 }, null, null], [foe])).toBe(BattleEndCode.Running);
    expect(evaluateBattleEnd(g, [{ ...girl, dead: true, hp: 7 }, null, null], [foe])).toBe(BattleEndCode.NobodyInBattle);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// The two state machines

/** A callee host that answers from the vector's scripted values and logs every call, as the harness did. */
function scriptedHost(answers: Record<string, number[]>): { host: (address: number, ...args: number[]) => number; log: number[][] } {
  const counts = new Map<number, number>();
  const log: number[][] = [];
  const host = (address: number, ...args: number[]): number => {
    log.push([address, ...args.map((a) => a >>> 0)]);
    const k = counts.get(address) ?? 0;
    counts.set(address, k + 1);
    const list = answers['0x' + address.toString(16)];
    return list === undefined ? 0 : (list[Math.min(k, list.length - 1)] as number);
  };
  return { host, log };
}

interface MachineFile { keys: string[]; count: number; vectors: Array<{ s: number[]; r: Record<string, number[]>; l: number[][]; a: number[] }> }

/** The machine's bytes in the order of the fixture's keys, each with the width the harness compared it at. */
const MACHINE_FIELDS: Array<[keyof EndMachine, number]> = [
  ['holdoff', 0xff], ['countdown', 0xff], ['phase', 0xff], ['outcome', 0xff], ['stepEval', 0xff], ['clockGate', 0xff], ['steps', 0xff], ['fadeStep', 0xff],
  ['fadeLength', 0xff], ['overWait', 0xff], ['endDelay', 0xff], ['result', 0xff], ['winFlag', 0xff], ['lossFlag', 0xff], ['fadeFlag', 0xff], ['fadeWin', 0xff],
  ['fadeLose', 0xff], ['fadeEscape', 0xff], ['gameOverSkip', 0xff], ['c6', 0xff], ['x67', 0xff], ['x68', 0xff], ['pad', 0xff], ['sound', 0xffff],
  ['overlay', 0xffff], ['padHistory', 0xffffffff],
];

function machineFrom(values: readonly number[]): EndMachine {
  const m = newEndMachine();
  MACHINE_FIELDS.forEach(([name], i) => {
    m[name] = values[i] as number;
  });
  return m;
}

function machineBytes(m: EndMachine): number[] {
  return MACHINE_FIELDS.map(([name, mask]) => (m[name] & mask) >>> 0);
}

describe('FFX-2 post-battle machine (0x0061e7a0), harness vectors', () => {
  const file = load<MachineFile>('battle_end_commit.json');

  it('the fixture keys are the machine fields in order', () => {
    expect(file.keys).toEqual(['ae', 'af', 'phase', 'a2', 'a3', 'a4', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'ca', 'cb', 'cc', 'cd', 'c4', 'c6', 'x67', 'x68', 'r8474', 'r8480', 'r8482', 'r8478']);
  });

  it('replays every vector: the same bytes after, and the same callee calls in the same order with the same arguments', () => {
    expect(file.vectors.length).toBe(file.count);
    expect(file.count).toBeGreaterThan(600);
    let wrongBytes = 0;
    let wrongCalls = 0;
    const starts = new Set<number>();
    const ends = new Set<number>();
    for (const v of file.vectors) {
      const m = machineFrom(v.s);
      const { host, log } = scriptedHost(v.r);
      starts.add(((v.s[2] as number) & 0xff) >>> 0);
      commitStep(m, host);
      ends.add(m.phase & 0xff);
      if (JSON.stringify(machineBytes(m)) !== JSON.stringify(v.a.map((x, i) => (x & (MACHINE_FIELDS[i] as [string, number])[1]) >>> 0))) wrongBytes += 1;
      if (JSON.stringify(log) !== JSON.stringify(v.l)) wrongCalls += 1;
    }
    expect(wrongBytes).toBe(0);
    expect(wrongCalls).toBe(0);
    // The commit path (1, 2, 0x1a, 0x1b) and the cancel (2 back to 1) are in the sample.
    for (const phase of [1, 2, 0x1a, 0x1b]) expect(starts.has(phase), `start ${phase}`).toBe(true);
    expect(ends.has(0x1a) || ends.has(0x1b)).toBe(true);
    expect(ends.has(1)).toBe(true);
  });

  it('a clean pass of phase 1 commits in one call: 1, 2, 0x1a and 0x1b, the result byte is the evaluation, the menus close, the queues are dropped', () => {
    const m = newEndMachine();
    m.stepEval = BattleEndCode.Won;
    const calls: number[][] = [];
    const host = (address: number, ...args: number[]): number => {
      calls.push([address, ...args]);
      return address === 0x61ef70 ? BattleEndCode.Won : 0; // the evaluation answers 4 each time it is asked
    };
    commitStep(m, host);
    expect(m.result).toBe(BattleEndCode.Won);
    expect(m.phase).toBe(0x21); // the 4 branch of phase 0x1b: a hold of 30 steps, then the sequence
    expect(m.holdoff).toBe(0x1e);
    expect(calls.filter((c) => c[0] === 0x634010).length).toBe(0x1f); // every character's menu
    expect(calls.some((c) => c[0] === 0x62c5c0)).toBe(true); // the commit drops what never started
    expect(calls.some((c) => c[0] === 0x6203a0 && c[1] === 4)).toBe(true); // script event 4
  });

  it('phase 2 waits while anything is queued, and an evaluation of 0 after the drain cancels the end', () => {
    const base = (): EndMachine => {
      const m = newEndMachine();
      m.phase = 2;
      return m;
    };
    const waiting = base();
    commitStep(waiting, (a) => (a === 0x62c390 ? 1 : 0)); // a queued command
    expect(waiting.phase).toBe(2);
    const magic = base();
    commitStep(magic, (a) => (a === 0x644cc0 ? 1 : 0)); // a magic execution
    expect(magic.phase).toBe(2);
    const lapsed = base();
    commitStep(lapsed, () => 0); // drained, and the evaluation is 0 again: a revive landed
    expect(lapsed.phase).toBe(1);
    expect(lapsed.result).toBe(0);
    const committed = base();
    commitStep(committed, (a) => (a === 0x61ef70 ? 1 : 0));
    expect(committed.result).toBe(1);
  });
});

describe('FFX-2 logic-step tail (0x0061e440), harness vectors', () => {
  const file = load<{ keys: string[]; count: number; vectors: Array<{ s: number[]; w: [number, number]; r: Record<string, number[]>; l: number[][]; a: number[] }> }>('battle_end_tail.json');
  const FIELDS: Array<[keyof StepTailState, number]> = [
    ['phase', 0xff], ['queued', 0xff], ['outcome', 0xff], ['stepEval', 0xff], ['x67', 0xff], ['ab', 0xff], ['mode', 0xff], ['bb', 0xff], ['variantA', 0xff],
    ['variantB', 0xff], ['startGroup', 0xffff], ['map', 0xffff], ['pad', 0xffffffff], ['padPrev', 0xffffffff], ['steps', 0xffffffff], ['x6c', 0xffffffff],
    ['x70', 0xffffffff], ['quit', 0xffffffff], ['p64', 0xff],
  ];

  it('the fixture keys are the tail fields in order', () => {
    expect(file.keys).toEqual(['phase', 'a1', 'a2', 'a3', 'x67', 'ab', 'r98', 'bb', 'b14', 'b15', 'w12', 'w10', 'r74', 'r78', 'r70', 'x6c', 'x70', 'q00', 'p64']);
  });

  it('replays every vector: the same bytes after and the same calls, including the report to the event system and the teardown', () => {
    expect(file.vectors.length).toBe(file.count);
    let wrongBytes = 0;
    let wrongCalls = 0;
    let reports = 0;
    let teardowns = 0;
    for (const v of file.vectors) {
      const s = {} as StepTailState;
      FIELDS.forEach(([name], i) => {
        s[name] = v.s[i] as number;
      });
      const world: StepTailWorld = { groupShort: v.w[0], sub2: v.w[1] };
      const { host, log } = scriptedHost(v.r);
      stepTail(s, world, host);
      const got = FIELDS.map(([name, mask]) => (s[name] & mask) >>> 0);
      const want = v.a.map((x, i) => (x & (FIELDS[i] as [string, number])[1]) >>> 0);
      if (JSON.stringify(got) !== JSON.stringify(want)) wrongBytes += 1;
      if (JSON.stringify(log) !== JSON.stringify(v.l)) wrongCalls += 1;
      if (log.some((c) => c[0] === 0x71b640)) reports += 1;
      if (log.some((c) => c[0] === 0x6203a0 && c[1] === 7)) teardowns += 1;
    }
    expect(wrongBytes).toBe(0);
    expect(wrongCalls).toBe(0);
    expect(reports).toBeGreaterThan(20);
    expect(teardowns).toBeGreaterThan(10);
  });
});
