/**
 * Parity tests for the player's Yojimbo kernel (`src/battle/ffx/kernel/yojimbo.ts`, `kernel/aeon-request.ts`; re-parity lane FFX-K row K2,
 * **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027, the battle system script's worker 59 and the exe's small pieces (note FFX-G08 sections 2 to 4). The
 * hand-worked cases state each rule in this file's own terms and several are the note's own tables (4.1 to 4.4); the last blocks replay
 * `yojimbo_natives.json`, `yojimbo_script.json` and `aeon_requests.json`, stratified subsets of runs of the game's own code against an
 * independent model (144,839 emulator vectors, 39,998 script VM runs and 60,000 requester vectors; 0 mismatches in the full sets, which the
 * lane's scratch runner replayed through the same helper).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type YojimboHost,
  type YojimboInputs,
  YojimboCommand as C,
  compatAdd,
  dismissEvent,
  freeAttackEvent,
  freeAttackWins,
  gilMotivation,
  payEvent,
  rollYojimboCommand,
  truncToInt32,
  turnStartRoll,
  wipeEvent,
} from '../../src/battle/ffx/kernel/yojimbo.ts';
import { EventKind, aeonSpecialRequest } from '../../src/battle/ffx/kernel/aeon-request.ts';
import {
  type CompatAddVector,
  type CompatRollVector,
  type RequestVector,
  type RollVector,
  type ScriptVector,
  replayCompatAdd,
  replayCompatRoll,
  replayRequests,
  replayRoll,
  replayYojimboScript,
} from './helpers/ffxKReplay.ts';

const fixture = <T>(name: string): T => JSON.parse(readFileSync(new URL(`../fixtures/parity/ffx/${name}`, import.meta.url), 'utf8')) as T;

const BASE: YojimboInputs = { compat: 128, given: 0, gil: 1_000_000, hire: 1, zanAll: 0, zanGroup: 0, odCur: 0, odMax: 20, curse: 0, turns: 1, reaction: 0 };
const input = (over: Partial<YojimboInputs>): YojimboInputs => ({ ...BASE, ...over });

/** A host that answers from a script: the draws in order, every pick finds a target unless told otherwise, every queueing succeeds unless told otherwise. */
function host(draws: number[], over: { noTarget?: readonly number[]; refuse?: boolean } = {}): YojimboHost & { picked: number[]; used: () => number } {
  let used = 0;
  const picked: number[] = [];
  return {
    picked,
    used: () => used,
    draw: () => {
      const d = draws[used++];
      if (d === undefined) throw new Error('the script drew more than the test gave it');
      return d;
    },
    target: (c) => (picked.push(c), !(over.noTarget ?? []).includes(c)),
    perform: () => over.refuse !== true,
  };
}

describe('the command roll (0x7a7b90)', () => {
  it('the sum of the two arguments chooses: below 32 Daigoro, 32 to 47 Kozuka, 48 to 62 Wakizashi on one, 63 to 79 on all, 80 and up Zanmato', () => {
    const at = (s: number): number => rollYojimboCommand(s, 0);
    expect([-1000, 0, 31].map(at)).toEqual([C.Daigoro, C.Daigoro, C.Daigoro]);
    expect([32, 47].map(at)).toEqual([C.Kozuka, C.Kozuka]);
    expect([48, 62].map(at)).toEqual([C.WakizashiOne, C.WakizashiOne]);
    expect([63, 79].map(at)).toEqual([C.WakizashiAll, C.WakizashiAll]);
    expect([80, 81, 140].map(at)).toEqual([C.Zanmato, C.Zanmato, C.Zanmato]);
  });

  it('the two arguments are added as 32-bit integers (a float argument is cut toward zero first; a value out of range is the most negative integer)', () => {
    expect(rollYojimboCommand(0x7fffffff, 1)).toBe(C.Daigoro); // wraps negative
    expect(truncToInt32(79.9)).toBe(79);
    expect(truncToInt32(-0.5)).toBe(-0);
    expect(truncToInt32(Number.NaN)).toBe(-2147483648);
    expect(truncToInt32(Number.POSITIVE_INFINITY)).toBe(-2147483648);
    expect(truncToInt32(3e9)).toBe(-2147483648);
    expect(rollYojimboCommand(truncToInt32(Number.POSITIVE_INFINITY), 63)).toBe(C.Daigoro);
  });
});

describe('the compatibility', () => {
  it('is clamped to 0..255 on every change', () => {
    expect([compatAdd(250, 4), compatAdd(255, 1), compatAdd(2, -3), compatAdd(0, -20), compatAdd(128, 3)]).toEqual([254, 255, 0, 0, 131]);
  });
});

describe('the turn-start free-attack roll (0x792120)', () => {
  it('wins when (draw & 0xFF) < compatibility div 4: 0 of 256 at 0 to 3, 1 at 4, 12 at 50, 32 at 128, 50 at 200, 63 at 255', () => {
    const wins = (compat: number): number => {
      let n = 0;
      for (let d = 0; d < 256; d++) if (freeAttackWins(compat, d)) n++;
      return n;
    };
    expect([0, 3, 4, 50, 128, 200, 255].map(wins)).toEqual([0, 0, 1, 12, 32, 50, 63]);
    expect(freeAttackWins(128, 0x1ff)).toBe(false); // only the low byte counts: 0xff
    expect(freeAttackWins(128, 0x100)).toBe(true); // low byte 0
  });

  it('only Yojimbo draws; every other character returns its own signed byte (1 for a monster slot)', () => {
    let drew = 0;
    const draw = (): number => (drew++, 0);
    expect(turnStartRoll(0xe, 0, 128, draw)).toBe(1);
    expect(drew).toBe(1);
    expect(turnStartRoll(0xe, 0, 0, draw)).toBe(0);
    expect(turnStartRoll(0x14, 1, 255, draw)).toBe(1);
    expect(turnStartRoll(8, 0, 255, draw)).toBe(0);
    expect(turnStartRoll(3, 0xff, 255, draw)).toBe(-1); // the byte is signed
    expect(drew).toBe(2);
  });
});

describe('the free attack (event 0): the command by compatibility (table 4.1)', () => {
  /** How many of the 64 values of the low six bits give each command, in the order Daigoro, Kozuka, Wakizashi one, Wakizashi all, Zanmato. */
  function spread(compat: number): number[] {
    const out = [0, 0, 0, 0, 0];
    for (let b = 0; b < 64; b++) {
      const run = freeAttackEvent(input({ compat, zanGroup: 0 }), host([b]));
      out[[C.Daigoro, C.Kozuka, C.WakizashiOne, C.WakizashiAll, C.Zanmato].indexOf(run.command)]!++;
    }
    return out;
  }

  it('matches the note\'s table row by row', () => {
    expect(spread(0)).toEqual([32, 16, 15, 1, 0]);
    expect(spread(64)).toEqual([16, 16, 15, 17, 0]);
    expect(spread(100)).toEqual([7, 16, 15, 17, 9]);
    expect(spread(128)).toEqual([0, 16, 15, 17, 16]);
    expect(spread(160)).toEqual([0, 8, 15, 17, 24]);
    expect(spread(192)).toEqual([0, 0, 15, 17, 32]);
    expect(spread(255)).toEqual([0, 0, 0, 17, 47]);
  });

  it('a Zanmato is replaced by Wakizashi on all when the pick finds no group or the group has a Zanmato byte above 0', () => {
    const plain = freeAttackEvent(input({ compat: 255 }), host([63]));
    expect(plain.command).toBe(C.Zanmato);
    const boss = freeAttackEvent(input({ compat: 255, zanGroup: 3 }), host([63]));
    expect(boss.command).toBe(C.WakizashiAll);
    expect(boss.compat).toBe(255); // +3 clamps
    const none = freeAttackEvent(input({ compat: 200 }), host([63], { noTarget: [C.Zanmato] }));
    expect(none.command).toBe(C.WakizashiAll);
    expect(none.compat).toBe(203);
    expect(none.trace.filter((s) => s[0] === 'target').map((s) => s[1])).toEqual([C.Zanmato, C.WakizashiAll]);
  });

  it('takes one draw, no gil, no hire answer and no gauge bonus', () => {
    const run = freeAttackEvent(input({ compat: 128, odCur: 20, odMax: 20, hire: 0 }), host([40]));
    expect(run.draws).toBe(1);
    expect(run.gaugeBonus).toBe(false);
    expect(run.trace[0]).toEqual(['draw']);
  });
});

describe('the compatibility deltas', () => {
  const after = (cmd: number, over: Partial<YojimboInputs> = {}, h?: ReturnType<typeof host>): number => freeAttackEvent(input({ compat: 100, ...over }), h ?? host([cmdB(cmd, 100)])).compat;
  /** A low-six-bit value that makes the free-attack roll give `cmd` at this compatibility (a = compat div 4). */
  function cmdB(cmd: number, compat: number): number {
    for (let b = 0; b < 64; b++) if (rollYojimboCommand(Math.trunc(compat / 4), b) === cmd) return b;
    throw new Error('no such draw');
  }

  it('Daigoro -1, Kozuka 0, Wakizashi one +1, Wakizashi all +3, Zanmato +4', () => {
    expect(after(C.Daigoro, { compat: 20 }, host([cmdB(C.Daigoro, 20)]))).toBe(19);
    expect(after(C.Kozuka)).toBe(100);
    expect(after(C.WakizashiOne)).toBe(101);
    expect(after(C.WakizashiAll)).toBe(103);
    expect(after(C.Zanmato, { compat: 255 }, host([63]))).toBe(255);
    expect(freeAttackEvent(input({ compat: 200 }), host([63])).compat).toBe(204);
  });

  it('Daigoro with no target is Kozuka (picked again, 0); it changes nothing when the command could not be queued', () => {
    const b = cmdB(C.Daigoro, 20);
    const run = freeAttackEvent(input({ compat: 20 }), host([b], { noTarget: [C.Daigoro] }));
    expect(run.command).toBe(C.Kozuka);
    expect(run.compat).toBe(20);
    const refused = freeAttackEvent(input({ compat: 200 }), host([cmdB(C.WakizashiOne, 200)], { refuse: true }));
    expect(refused.queued).toBe(false);
    expect(refused.compat).toBe(200);
    expect(refused.trace.some((s) => s[0] === 'set' && s[1] === 273)).toBe(false);
  });

  it('a regular reaction becomes a headshake for Daigoro and a nod for Zanmato; Pay opens the event with a regular one', () => {
    const run = payEvent(input({ given: 1, gil: 1, compat: 0 }), host([0]));
    expect(run.command).toBe(C.Daigoro);
    expect(run.reaction).toBe(3);
    const big = payEvent(input({ given: 1_000_000, gil: 1_000_000, compat: 128 }), host([0]));
    expect(big.command).toBe(C.Zanmato);
    expect(big.reaction).toBe(2);
  });

  it('Dismiss as his first action costs 3; after any parsed action it costs nothing; being knocked out while out costs 10', () => {
    expect(dismissEvent(100, 0).compat).toBe(97);
    expect(dismissEvent(100, 1).compat).toBe(100);
    expect(dismissEvent(100, 255).trace).toEqual([]);
    expect(dismissEvent(2, 0).compat).toBe(0);
    expect(wipeEvent(100).compat).toBe(90);
    expect(wipeEvent(4).compat).toBe(0);
  });
});

describe('Pay (event 9): the payment becomes a motivation number', () => {
  it('the gil part is 4 for every doubling of the payment from 8 gil (note table 4.2)', () => {
    const rows: Array<[number, number]> = [[1, 0], [7, 0], [8, 4], [16, 8], [100, 16], [1_000, 28], [10_000, 44], [100_000, 56], [524_288, 68], [5_000_000, 80], [10_000_000, 84], [99_999_999, 96]];
    for (const [gil, part] of rows) expect(gilMotivation(gil), `${gil} gil`).toBe(part);
  });

  /** The command Pay gives for payment `gil` (all of the gil) with the low six bits `b`. */
  const payCommand = (over: Partial<YojimboInputs>, b: number): number => payEvent(input({ gil: over.given, ...over }), host([b, 0])).command;

  it('no monster penalty, answer 1: the smallest payment at which Zanmato can come out (draw 63) and is certain (draw 0), note table 4.3', () => {
    const rows: Array<[number, number, number, number, number]> = [
      // compatibility, possible from, certain from, possible from with a full gauge, certain from with a full gauge
      [0, 128, 4_194_304, 1, 131_072],
      [50, 32, 2_097_152, 1, 65_536],
      [128, 16, 524_288, 1, 16_384],
      [200, 1, 131_072, 1, 4_096],
      [255, 1, 65_536, 1, 2_048],
    ];
    for (const [compat, possible, certain, possibleFull, certainFull] of rows) {
      const zan = (gil: number, b: number, full: boolean): boolean => payCommand({ compat, given: gil, odCur: full ? 20 : 0, odMax: 20 }, b) === C.Zanmato;
      expect(zan(possible, 63, false), `compat ${compat}: possible at ${possible}`).toBe(true);
      if (possible > 1) expect(zan(possible - 1, 63, false), `compat ${compat}: not possible just below`).toBe(false);
      expect(zan(certain, 0, false), `compat ${compat}: certain at ${certain}`).toBe(true);
      expect(zan(certain - 1, 0, false), `compat ${compat}: not certain just below`).toBe(false);
      expect(zan(possibleFull, 63, true), `compat ${compat}: full gauge possible at ${possibleFull}`).toBe(true);
      expect(zan(certainFull, 0, true), `compat ${compat}: full gauge certain at ${certainFull}`).toBe(true);
      expect(zan(certainFull - 1, 0, true), `compat ${compat}: full gauge not certain just below`).toBe(false);
    }
  });

  it('a monster with a Zanmato byte divides the first-pass number (answers 0 and 1: by L + 1; answer 2: 0.8 then by (L + 3) div 3)', () => {
    // By hand: 1,000,000 gil is 2^19 or more, so the gil part is 4 x (19 - 2) = 68; compatibility 128 adds 128 div 10 = 12; no monster, so 80.
    expect(gilMotivation(1_000_000) + 12).toBe(80);
    const first = (hire: number, zan: number): number => {
      const run = payEvent(input({ given: 1_000_000, gil: 1_000_000, hire, zanAll: zan, compat: 128 }), host([0, 0]));
      const roll = run.trace.find((s) => s[0] === 'roll');
      return roll?.[0] === 'roll' ? roll[1] : NaN;
    };
    expect(first(1, 0)).toBe(80);
    expect([1, 2, 3, 4].map((z) => first(1, z))).toEqual([40, 26, 20, 16]); // 80 / (L + 1), cut toward zero
    // answer 2: 80 x 0.8 = 64, then divided by (L + 3) div 3, which is 1 for L 0 to 2 and 2 for L 3 to 5
    expect([0, 1, 2, 3, 4, 5].map((z) => first(2, z))).toEqual([64, 64, 64, 32, 32, 32]);
    // answer 0 with the whole of the gil paid: x (75 + 50) / 100 = 1.25
    expect(first(0, 0)).toBe(100);
    // answer 0 with a tenth of the gil paid: x (75 + 5) / 100 = 0.8; V = 68 + 12 = 80 -> 64
    const tenth = payEvent(input({ given: 1_000_000, gil: 10_000_000, hire: 0, compat: 128 }), host([0]));
    const roll = tenth.trace.find((s) => s[0] === 'roll');
    expect(roll?.[0] === 'roll' ? roll[1] : NaN).toBe(64);
  });

  it('a boss: when the first roll is not Zanmato the script rolls again with the penalty removed, and a Zanmato of the second roll becomes Wakizashi on all', () => {
    // compat 128, 100,000 gil, answer 1, byte 3: first-pass V = 17 (table 4.4); the first draw 0 gives 17 -> Daigoro.
    const run = payEvent(input({ given: 100_000, gil: 100_000, zanAll: 3, compat: 128 }), host([0, 63]));
    expect(run.draws).toBe(2);
    // second pass: V = 56 + 12 = 68, + draw 63 = 131 -> Zanmato -> Wakizashi on all
    expect(run.command).toBe(C.WakizashiAll);
    expect(run.trace.filter((s) => s[0] === 'draw')).toHaveLength(2);
    // the table's Zanmato count out of 64 first draws: 1 of 64 at 100,000 and 8 at 10,000,000 (compat 128)
    const zanCount = (given: number): number => {
      let n = 0;
      for (let b = 0; b < 64; b++) {
        const r = payEvent(input({ given, gil: given, zanAll: 3, compat: 128 }), host([b, 0]));
        const first = r.trace.find((s) => s[0] === 'roll');
        if (first?.[0] === 'roll' && first[3] === C.Zanmato) n++;
      }
      return n;
    };
    expect([100_000, 1_000_000, 10_000_000, 99_999_999].map(zanCount)).toEqual([1, 4, 8, 11]);
  });

  it('a full gauge adds 20 after the division and is taken again in the second pass; a Cursed Yojimbo gets nothing', () => {
    const full = payEvent(input({ given: 100_000, gil: 100_000, zanAll: 3, compat: 128, odCur: 20, odMax: 20 }), host([0, 0]));
    const sets = full.trace.filter((s) => s[0] === 'set' && s[1] === 312);
    expect(sets).toHaveLength(2);
    expect(full.gaugeBonus).toBe(true);
    const rolls = full.trace.filter((s) => s[0] === 'roll');
    expect(rolls[0]?.[0] === 'roll' ? rolls[0][1] : NaN).toBe(37); // table 4.4: with a full gauge V = 37
    const cursed = payEvent(input({ given: 100_000, gil: 100_000, zanAll: 3, compat: 128, odCur: 20, odMax: 20, curse: 1 }), host([0, 0]));
    expect(cursed.gaugeBonus).toBe(false);
  });

  it('a payment of 0 is the "pay nothing" branch: a headshake, compatibility -20, Yojimbo\'s own Dismiss requested, no draw', () => {
    const run = payEvent(input({ given: 0, compat: 90 }), host([]));
    expect(run.trace).toEqual([['set', 277, 1], ['set', 277, 3], ['set', 273, -20], ['perform', -13, 0x3057]]);
    expect(run.compat).toBe(70);
    expect(run.reaction).toBe(3);
    expect(run.draws).toBe(0);
    expect(payEvent(input({ given: -5, compat: 10 }), host([])).compat).toBe(0);
  });

  it('answer 0 with a positive payment and no gil never ends in the game: the kernel refuses it', () => {
    expect(() => payEvent(input({ given: 1, gil: 0, hire: 0 }), host([0, 0]))).toThrow(RangeError);
    // the other answers handle it (a ratio is not formed)
    expect(payEvent(input({ given: 1, gil: 0, hire: 1 }), host([0, 0])).draws).toBe(1);
  });
});

describe('the special-action requester (0x7b2980)', () => {
  it('Yojimbo: Pay asks for event 9 with the entry and a pending mark; his Dismiss asks for event 10 with neither', () => {
    expect(aeonSpecialRequest(0xe, 0, [0x3123, 0xffff])).toEqual({ kind: EventKind.Pay, fifth: 0, withEntry: true, pending: true });
    expect(aeonSpecialRequest(0xe, 0, [0x3057, 0xffff])).toEqual({ kind: EventKind.Dismiss, fifth: 2, withEntry: false, pending: false });
    expect(aeonSpecialRequest(0xe, 0, [0x3000, 0x3056])).toBeNull(); // the other aeons' Dismiss is not his
    expect(aeonSpecialRequest(0xe, 1, [0x3123, 0xffff])).toBeNull(); // a source type other than 0 is passed over
  });

  it('a Sister: 0x3124 to 0x312B are events 13 to 20; a Sister\'s Pay is nothing; any other character is passed over', () => {
    for (const who of [0xf, 0x10, 0x11]) for (let c = 0x3124; c <= 0x312b; c++) expect(aeonSpecialRequest(who, 0, [c, 0]), `${who} ${c}`).toEqual({ kind: 13 + (c - 0x3124), fifth: 0, withEntry: true, pending: true });
    expect(aeonSpecialRequest(0xf, 0, [0x3123, 0x312c])).toBeNull();
    expect(aeonSpecialRequest(0x8, 0, [0x3124, 0x3124])).toBeNull();
  });
});

describe('replays of the game\'s own code (stratified subsets; the full sets were replayed through the same helper)', () => {
  it('RollYojimboCommand: integer, float-tagged and special bit patterns', () => {
    const f = fixture<{ counts: { roll: number }; roll: RollVector[] }>('yojimbo_natives.json');
    const t = replayRoll(f.roll);
    expect(t.first).toEqual([]);
    expect(t.bad).toBe(0);
    expect(t.n).toBeGreaterThan(5000);
    expect(f.counts.roll).toBe(57839);
  });

  it('the turn-start roll and the compatibility add', () => {
    const f = fixture<{ counts: { compatRoll: number; compatAdd: number }; compatRoll: CompatRollVector[]; compatAdd: CompatAddVector[] }>('yojimbo_natives.json');
    const a = replayCompatRoll(f.compatRoll);
    const b = replayCompatAdd(f.compatAdd);
    expect(a.first).toEqual([]);
    expect(b.first).toEqual([]);
    expect([a.bad, b.bad]).toEqual([0, 0]);
    expect(a.n).toBeGreaterThan(10000);
    expect(b.n).toBe(2000);
    expect([f.counts.compatRoll, f.counts.compatAdd]).toEqual([60000, 20000]);
  });

  it('the player-side script on the game VM: Pay, the free attack, Dismiss and the wipe', () => {
    const f = fixture<{ counts: Record<string, number>; runs: ScriptVector[] }>('yojimbo_script.json');
    const t = replayYojimboScript(f.runs);
    expect(t.first).toEqual([]);
    expect(t.bad).toBe(0);
    expect(t.n).toBeGreaterThan(1400);
    expect(Object.values(f.counts).reduce((a, b) => a + b, 0)).toBe(39998);
    // the subset reaches every branch: both passes, every hire answer, a boss, a full gauge
    const pay = f.runs.filter((r) => r[0] === 2);
    expect(pay.some((r) => r[2].filter((s) => s[0] === 'draw').length === 2)).toBe(true);
    expect([0, 1, 2, 3].every((h) => pay.some((r) => r[1][5] === h))).toBe(true);
    expect(pay.some((r) => r[2].some((s) => s[0] === 'set' && s[1] === 312))).toBe(true);
  });

  it('the requester', () => {
    const f = fixture<{ counts: { all: number }; vectors: RequestVector[] }>('aeon_requests.json');
    const t = replayRequests(f.vectors);
    expect(t.first).toEqual([]);
    expect(t.bad).toBe(0);
    expect(t.n).toBeGreaterThan(4000);
    expect(f.counts.all).toBe(60000);
  });
});
