/**
 * **The camera-program VM** (`src/engine/ffxcam/vm.ts`, `expr.ts`, `calls.ts`, `book.ts`): FFX's camera scripts run in logic steps over the solver. Synthetic programs only (rule 8).
 *
 * Pins:
 *
 * 1. **control flow and time**: set / jmp / jt / jf / switch / ret; `wait(n)` called at step k resumes at k + n; `camWait` and `refWait` go on at k + n + 1; a request kills the thread and runs the
 *    new program up to its first wait while a move the old one armed keeps running;
 * 2. **branches on the world**: a battle variable, a host property (BattleDistance's place), the operators of the expression language;
 * 3. **randomness**: a shot switch draws only from the PRESENTATION source, per stream, deterministically per seed, and the battle's RNG and `Math.random` are never touched;
 * 4. **camReq** is a tail call, and an unanswered tag changes nothing;
 * 5. **nothing throws**: an unknown call or query is counted, logged once and ignored; known no-ops are counted apart; a runaway program is stopped; a request chain is cut;
 * 6. the program book's candidate order (formation before common, the command's worker first).
 *
 * Game case: FFX only.
 */
import { describe, expect, it, vi } from 'vitest';

import { SeededRng } from '../../src/battle/common/rng.ts';
import { ProgramBook } from '../../src/engine/ffxcam/book.ts';
import { FormationHost } from '../../src/engine/ffxcam/formation.ts';
import { PresentationRandom } from '../../src/engine/ffxcam/host.ts';
import { CameraSolver } from '../../src/engine/ffxcam/solver.ts';
import { CameraVm } from '../../src/engine/ffxcam/vm.ts';
import { D2R, TestHost, bin, call, jf, jmp, jt, near, prog, q, ret, rig, run, set, setreg, sw, tagsOf, v } from './helpers/ffxcamKit.ts';

const refX = (r: ReturnType<typeof rig>, n: number): number[] => run(r.vm, n).map((p) => p.ref[0]);

describe('control flow', () => {
  it('set, jf, jmp and ret: a branch on a battle variable', () => {
    const P = prog('p', [jf(bin('==', v('battle:0x10'), 1), 3), call('refSetPos', 1, 1, 1), jmp(4), call('refSetPos', 2, 2, 2), ret()]);
    const a = rig([P]);
    a.vm.vars.set('battle:0x10', 1);
    a.vm.start(P);
    near(a.vm.pose().ref, [1, 1, 1]);
    const b = rig([P]);
    b.vm.start(P); // unset variables read 0
    near(b.vm.pose().ref, [2, 2, 2]);
  });

  it('switch: the matching case, else the default', () => {
    const P = prog('p', [sw(v('battle:0x4'), [[1, 1], [2, 3]], 5), call('refSetPos', 10, 0, 0), ret(), call('refSetPos', 20, 0, 0), ret(), call('refSetPos', 99, 0, 0), ret()]);
    for (const [value, x] of [[1, 10], [2, 20], [9, 99]] as const) {
      const r = rig([P]);
      r.vm.vars.set('battle:0x4', value);
      r.vm.start(P);
      expect(r.vm.pose().ref[0], `value ${value}`).toBe(x);
    }
  });

  it('jt jumps when true, falls through when false', () => {
    const P = prog('p', [jt(v('battle:0x1'), 3), call('refSetPos', 1, 0, 0), ret(), call('refSetPos', 2, 0, 0), ret()]);
    const on = rig([P]);
    on.vm.vars.set('battle:0x1', 5);
    on.vm.start(P);
    expect(on.vm.pose().ref[0]).toBe(2);
    const off = rig([P]);
    off.vm.start(P);
    expect(off.vm.pose().ref[0]).toBe(1);
  });

  it('registers are the thread\'s own; variables are shared; private variables belong to the worker', () => {
    const w0a = prog('w0.fa', [setreg('I0', 4), set('battle:0x1', bin('*', { reg: 'I0' }, 2)), set('private:0x0', 5), ret()], { script: 's', worker: 0 });
    const w0b = prog('w0.fb', [set('battle:0x2', v('private:0x0')), set('battle:0x3', { reg: 'I0' }), ret()], { script: 's', worker: 0 });
    const w1 = prog('w1.fa', [set('battle:0x4', v('private:0x0')), ret()], { script: 's', worker: 1 });
    const r = rig([w0a, w0b, w1]);
    r.vm.start(w0a);
    r.vm.start(w0b);
    r.vm.start(w1);
    expect(r.vm.vars.get('battle:0x1')).toBe(8);
    expect(r.vm.vars.get('battle:0x2')).toBe(5); // the same worker's private cell
    expect(r.vm.vars.get('battle:0x3')).toBe(0); // a new thread has fresh registers
    expect(r.vm.vars.get('battle:0x4')).toBe(0); // another worker's private cell is its own
  });

  it('falls off the end of a program without a ret, and halt ends it', () => {
    const P = prog('p', [call('refSetPos', 1, 0, 0)]);
    const H = prog('h', [call('refSetPos', 2, 0, 0), { op: 'halt' }, call('refSetPos', 3, 0, 0)]);
    const r = rig([P, H]);
    r.vm.start(P);
    expect(r.vm.running).toBe(false);
    r.vm.start(H);
    expect(r.vm.running).toBe(false);
    expect(r.vm.pose().ref[0]).toBe(2);
  });

  it('starts at the program\'s entry, which need not be the first instruction', () => {
    const P = prog('p', [call('refSetPos', 1, 0, 0), ret(), call('refSetPos', 2, 0, 0), ret()], { entryIndex: 2 });
    const r = rig([P]);
    r.vm.start(P);
    expect(r.vm.pose().ref[0]).toBe(2);
  });
});

describe('time', () => {
  it('wait(n) called at step k resumes at step k + n; a later wait counts from the step it was called in', () => {
    const P = prog('p', [call('refSetPos', 1, 0, 0), call('wait', 2), call('refSetPos', 2, 0, 0), call('wait', 2), call('refSetPos', 3, 0, 0), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    expect(refX(r, 6)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('wait(0) and a negative wait do not wait', () => {
    const P = prog('p', [call('wait', 0), call('wait', -4), call('refSetPos', 5, 0, 0), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    expect(r.vm.pose().ref[0]).toBe(5);
  });

  it('camWait goes on one step after the move\'s last evaluation: armed at step k with n steps, resumes at k + n + 1', () => {
    const P = prog('p', [call('camSetPos', 0, 0, 0), call('camMove', 5), call('camSetPos', 10, 0, 0), call('camWait'), call('refSetPos', 7, 7, 7), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    const refs = run(r.vm, 8).map((p) => p.ref[0]);
    expect(refs).toEqual([0, 0, 0, 0, 0, 0, 7, 7]); // step 6 = 0 + 5 + 1
    expect(r.vm.running).toBe(false);
  });

  it('refWait waits on the look-at\'s move, and does not wait on a move that is not there', () => {
    const P = prog('p', [call('refSetPos', 0, 0, 0), call('refMove', 3), call('refSetPos', 8, 0, 0), call('refWait'), call('camSetPos', 5, 5, 5), call('camWait'), call('camSetPos', 6, 6, 6), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    const eyes = run(r.vm, 6).map((p) => p.eye[0]);
    expect(eyes).toEqual([0, 0, 0, 0, 6, 6]); // refWait releases at step 3 + 1; the camWait after it has nothing to wait for
  });

  it('a request kills the thread: the old program\'s later instructions never run, but the move it armed keeps going', () => {
    const slow = prog('slow', [call('refSetPos', 0, 0, 0), call('refMove', 10), call('refSetPos', 100, 0, 0), call('wait', 100), call('refSetPos', -1, 0, 0), ret()]);
    const quick = prog('quick', [ret()]);
    const r = rig([slow, quick], tagsOf({ 1: 'quick' }));
    r.vm.start(slow);
    run(r.vm, 3);
    expect(r.vm.request({ tags: [1] })?.id).toBe('quick');
    expect(r.vm.programId).toBe('quick');
    const xs = refX(r, 12);
    expect(xs[xs.length - 1]).toBe(100); // the move ran to its end, and the slow program's refSetPos(-1) never happened
    expect(r.vm.idle).toBe(true);
  });

  it('a request with no handler starts nothing and leaves the thread alone', () => {
    const P = prog('p', [call('wait', 3), call('refSetPos', 4, 0, 0), ret()]);
    const r = rig([P], tagsOf({ 1: 'p' }));
    r.vm.start(P);
    expect(r.vm.request({ tags: [99] })).toBeUndefined();
    expect(r.vm.programId).toBe('p');
    expect(refX(r, 4)).toEqual([0, 0, 0, 4]);
  });

  it('runToEnd runs until nothing is running and no move is armed, and returns the steps it took', () => {
    const P = prog('p', [call('refSetPos', 0, 0, 0), call('refMove', 4), call('refSetPos', 10, 0, 0), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    expect(r.vm.idle).toBe(false); // the move is armed
    expect(r.vm.runToEnd()).toBe(5); // t = 0..4
    near(r.vm.pose().ref, [10, 0, 0]);
    expect(r.vm.runToEnd()).toBe(0);
  });
});

describe('queries and operators', () => {
  it('asks the host, which answers by name; a property read picks a branch', () => {
    const host = new TestHost();
    const P = prog('p', [jt(bin('==', q('readBtlChrProperty', 20, 30), 3), 3), call('refSetPos', 1, 0, 0), ret(), call('refSetPos', 87, 0, 0), ret()]);
    const near_ = rig([P], {}, host);
    host.answers.set('readBtlChrProperty', 0);
    near_.vm.start(P);
    expect(near_.vm.pose().ref[0]).toBe(1);
    host.answers.set('readBtlChrProperty', 3);
    near_.vm.start(P);
    expect(near_.vm.pose().ref[0]).toBe(87);
  });

  it('answers camGetRoll (degrees) and camGetScrDpt from the solver', () => {
    const P = prog('p', [call('camSetRoll', 30), call('camSetScrDpt', 700), set('battle:0x1', q('camGetRoll')), set('battle:0x2', q('camGetScrDpt')), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    expect(r.vm.vars.get('battle:0x1')).toBeCloseTo(30, 9);
    expect(r.vm.vars.get('battle:0x2')).toBe(700);
  });

  it('evaluates the operators as C does: booleans are 1 and 0, mod is the remainder, bitwise works on integers', () => {
    const cases: Array<[string, ReturnType<typeof bin>, number]> = [
      ['+', bin('+', 7, bin('*', 3, 2)), 13],
      ['-', bin('-', 3, 5), -2],
      ['mod', bin('mod', 17, 5), 2],
      ['mod by zero', bin('mod', 17, 0), 0],
      ['==', bin('==', 3, 3), 1],
      ['!=', bin('!=', 3, 3), 0],
      ['<', bin('<', 2, 3), 1],
      ['>', bin('>', 2, 3), 0],
      ['<=', bin('<=', 3, 3), 1],
      ['>=', bin('>=', 2, 3), 0],
      ['and', bin('and', 1, 0), 0],
      ['or', bin('or', 1, 0), 1],
      ['|', bin('|', 6, 1), 7],
      ['&', bin('&', 6, 3), 2],
      ['^', bin('^', 6, 3), 5],
      ['<<', bin('<<', 1, 3), 8],
      ['>>', bin('>>', 16, 2), 4],
      ['!', { op: '!', x: 5 } as never, 0],
      ['! of 0', { op: '!', x: 0 } as never, 1],
      ['neg', { op: 'neg', x: 4 } as never, -4],
      ['~', { op: '~', x: 0 } as never, -1],
    ];
    const P = prog('p', [...cases.map(([, e], i) => set(`battle:0x${i}`, e)), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    for (const [i, [name, , want]] of cases.entries()) expect(r.vm.vars.get(`battle:0x${i}`), name).toBe(want);
  });

  it('and / or evaluate both operands (queries have no side effects)', () => {
    const host = new TestHost();
    const P = prog('p', [set('battle:0x1', bin('or', 1, q('probe-or'))), set('battle:0x2', bin('and', 0, q('probe-and'))), ret()]);
    const r = rig([P], {}, host);
    r.vm.start(P);
    expect(host.asked).toContain('probe-or');
    expect(host.asked).toContain('probe-and');
  });
});

describe('randomness is the presentation\'s own', () => {
  /** A shot switch of three cases, as the spell cameras have: `camRand(0) mod 3`. */
  const SHOT = prog('shot', [
    sw(bin('mod', q('camRand', 0), 3), [[0, 1], [1, 3], [2, 5]], 7),
    call('refSetPos', 10, 0, 0),
    ret(),
    call('refSetPos', 20, 0, 0),
    ret(),
    call('refSetPos', 30, 0, 0),
    ret(),
    ret(),
  ]);

  it('takes the case the draw selects: the raw draw mod 3', () => {
    const host = new TestHost();
    host.rolls = [0, 1, 2, 4, 5, 9];
    const r = rig([SHOT], {}, host);
    const picked: number[] = [];
    for (let i = 0; i < 6; i++) {
      r.vm.start(SHOT);
      picked.push(r.vm.pose().ref[0]);
    }
    expect(picked).toEqual([10, 20, 30, 20, 30, 10]);
  });

  it('draws from the host\'s presentation source: stream 14 + (n & 1) for camRand, stream 2 for GetRandomValue', () => {
    const P = prog('p', [set('battle:0x1', q('camRand', 0)), set('battle:0x2', q('camRand', 1)), set('battle:0x3', q('camRand', 2)), set('battle:0x4', q('GetRandomValue')), ret()]);
    const random = new PresentationRandom(7);
    const r = rig([P], {}, new FormationHost({ random }));
    r.vm.start(P);
    expect(random.drawsOf(14)).toBe(2);
    expect(random.drawsOf(15)).toBe(1);
    expect(random.drawsOf(2)).toBe(1);
    expect(random.draws).toBe(4);
    for (const k of [1, 2, 3, 4]) {
      const x = r.vm.vars.get(`battle:0x${k}`) as number;
      expect(Number.isInteger(x) && x >= 0 && x < 2 ** 31, `draw ${k} is a raw 31-bit integer`).toBe(true);
    }
  });

  /** The shot chosen in each of `n` runs under `seed`. */
  function choices(seed: number, n: number): number[] {
    const r = rig([SHOT], {}, new FormationHost({ random: new PresentationRandom(seed) }));
    return Array.from({ length: n }, () => {
      r.vm.start(SHOT);
      return r.vm.pose().ref[0];
    });
  }

  it('is deterministic per seed and differs between seeds, and every case comes up', () => {
    expect(choices(1234, 60)).toEqual(choices(1234, 60));
    expect(choices(1234, 60)).not.toEqual(choices(4321, 60));
    expect(new Set(choices(99, 60))).toEqual(new Set([10, 20, 30]));
  });

  it('never touches the battle\'s RNG, nor Math.random', () => {
    const battle = new SeededRng(42);
    const control = new SeededRng(42);
    const before = battle.saveState();
    const spy = vi.spyOn(Math, 'random');
    try {
      choices(42, 200); // the same seed as the battle's: still its own state
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
    expect(battle.saveState()).toBe(before);
    for (let i = 0; i < 5; i++) expect(battle.next()).toBe(control.next()); // the battle's next draws are exactly what they would have been
  });

  it('each stream is independent of what the others drew, and the streams differ from one another under one seed', () => {
    const a = new PresentationRandom(5);
    const b = new PresentationRandom(5);
    for (let i = 0; i < 10; i++) a.next(2);
    expect(a.next(14)).toBe(b.next(14));
    const first = (stream: number): number[] => {
      const r = new PresentationRandom(5);
      return Array.from({ length: 6 }, () => r.next(stream));
    };
    expect(first(14)).not.toEqual(first(15));
    expect(first(14)).not.toEqual(first(2));
    expect(first(14)).toEqual(first(14));
  });
});

describe('camReq', () => {
  const B = prog('b', [call('refSetPos', 5, 5, 5), ret()]);

  it('from a camera program is a tail call: nothing after it runs', () => {
    const A = prog('a', [call('camReq', 1, 28), call('refSetPos', 99, 99, 99), ret()]);
    const r = rig([A, B], tagsOf({ 28: 'b' }));
    r.vm.start(A);
    near(r.vm.pose().ref, [5, 5, 5]);
    expect(r.started).toEqual(['a', 'b']);
  });

  it('with a slot argument of 0 or 1 reaches the camera handler alike', () => {
    for (const slot of [0, 1]) {
      const A = prog('a', [call('camReq', slot, 28), ret()]);
      const r = rig([A, B], tagsOf({ 28: 'b' }));
      r.vm.start(A);
      expect(r.started, `slot ${slot}`).toEqual(['a', 'b']);
    }
  });

  it('with a tag nobody answers changes nothing: the program goes on', () => {
    const A = prog('a', [call('camReq', 1, 77), call('refSetPos', 9, 9, 9), ret()]);
    const r = rig([A, B], tagsOf({ 28: 'b' }));
    r.vm.start(A);
    near(r.vm.pose().ref, [9, 9, 9]);
    expect(r.started).toEqual(['a']);
  });

  it('a ping-pong of requests is cut, with one warning', () => {
    const X = prog('x', [call('camReq', 1, 2)]);
    const Y = prog('y', [call('camReq', 1, 1)]);
    const r = rig([X, Y], tagsOf({ 1: 'x', 2: 'y' }));
    r.vm.start(X);
    expect(r.started.length).toBeLessThanOrEqual(33);
    expect(r.warnings.filter((w) => /chained/.test(w))).toHaveLength(1);
  });
});

describe('the program book', () => {
  const mk = (id: string): ReturnType<typeof prog> => prog(id, [ret()]);

  it('tries the formation before the common script, the command\'s worker first, then each tag in order', () => {
    const book = new ProgramBook([mk('form-worker'), mk('form-26'), mk('common-29'), mk('common-worker')], { 'f:65:66': 'form-worker', 'f:0:26': 'form-26', 'c:0:29': 'common-29', 'c:65:66': 'common-worker' }, ['f', 'c']);
    expect(book.candidates({ tags: [29, 26], command: 0x3042 })).toEqual(['f:65:66', 'f:0:29', 'f:0:26', 'c:65:66', 'c:0:29', 'c:0:26']);
    expect(book.resolve({ tags: [29, 26], command: 0x3042 })?.id).toBe('form-worker'); // the command worker is asked first
    expect(book.resolve({ tags: [29, 26] })?.id).toBe('form-26'); // the formation answers 26 before the common script's 29 is reached
    expect(book.resolve({ tags: [29] })?.id).toBe('common-29'); // nothing in the formation: the common script
    expect(book.resolve({ tags: [30] })).toBeUndefined();
  });

  it('picks the worker slot by the command id\'s top nibble, with the tag the id\'s low twelve bits', () => {
    const book = new ProgramBook([], {}, ['f']);
    expect(book.candidates({ tags: [], command: 0x2003 })).toEqual(['f:68:3']);
    expect(book.candidates({ tags: [], command: 0x3042 })).toEqual(['f:65:66']);
    expect(book.candidates({ tags: [], command: 0x4001 })).toEqual(['f:71:1']);
    expect(book.candidates({ tags: [], command: 0x6061 })).toEqual(['f:74:97']);
    expect(book.candidates({ tags: [], command: 0x1000 })).toEqual([]); // no worker for that class
  });

  it('skips a tag whose program is not loaded, and exposes what it holds', () => {
    const book = new ProgramBook([mk('a')], { 'f:0:1': 'ghost', 'f:0:2': 'a' }, ['f']);
    expect(book.resolve({ tags: [1, 2] })?.id).toBe('a');
    expect(book.size).toBe(1);
    expect(book.ids()).toEqual(['a']);
    expect(book.get('a')?.id).toBe('a');
    expect(book.get('nope')).toBeUndefined();
  });
});

describe('nothing throws', () => {
  it('counts an unknown call or query, warns once per name, and carries on (a query answers 0)', () => {
    const P = prog('p', [
      call('bogusCall', 1),
      call('bogusCall', 2),
      call('bogusCall', 3),
      set('battle:0x1', q('bogusQuery', 1)),
      set('battle:0x2', q('bogusQuery', 2)),
      call('refSetPos', 1, 2, 3),
      ret(),
    ]);
    const r = rig([P]);
    expect(() => r.vm.start(P)).not.toThrow();
    near(r.vm.pose().ref, [1, 2, 3]); // the program went on after them
    expect(r.vm.stats.unknownCalls.get('bogusCall')).toBe(3);
    expect(r.vm.stats.unknownQueries.get('bogusQuery')).toBe(2);
    expect(r.vm.vars.get('battle:0x1')).toBe(0);
    expect(r.warnings).toHaveLength(2);
    expect(r.warnings.some((w) => /bogusCall/.test(w))).toBe(true);
    expect(r.warnings.some((w) => /bogusQuery/.test(w))).toBe(true);
  });

  it('counts the known calls that have nothing to do with the camera apart from the unknown ones, and does not warn', () => {
    const P = prog('p', [call('print?', 5), call('btlSetUpVectorFlag', 1), call('btlSetUpVectorFlag', 0), call('camBlur', 60), call('loadBattleVoiceLine', 1), call('refSetPos', 1, 0, 0), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    expect(r.vm.stats.ignored.get('btlSetUpVectorFlag')).toBe(2);
    expect(r.vm.stats.ignored.get('print?')).toBe(1);
    expect(r.vm.stats.ignored.get('camBlur')).toBe(1);
    expect(r.vm.stats.unknownCalls.size).toBe(0);
    expect(r.vm.stats.handled.get('refSetPos')).toBe(1);
    expect(r.warnings).toEqual([]);
  });

  it('forwards writeBtlChrProperty to the host when it can take it, and ignores it when it cannot', () => {
    const host = new TestHost();
    const P = prog('p', [call('writeBtlChrProperty', -7, 216, 0), ret()]);
    const a = rig([P], {}, host);
    a.vm.start(P);
    expect(host.writes).toEqual([[-7, 216, 0]]);
    const bare = { select: () => [], actor: () => undefined, query: () => undefined, random: () => 0 };
    const solver = new CameraSolver(bare);
    const vm = new CameraVm({ solver, book: new ProgramBook([P], {}, ['s']), host: bare, warn: () => undefined });
    expect(() => vm.start(P)).not.toThrow();
  });

  it('stops a program that runs on without waiting, with one warning, and the VM goes on being usable', () => {
    const LOOP = prog('loop', [call('refSetPos', 1, 0, 0), jmp(0)]);
    const OK = prog('ok', [call('refSetPos', 2, 0, 0), ret()]);
    const r = rig([LOOP, OK]);
    expect(() => r.vm.start(LOOP)).not.toThrow();
    expect(r.vm.running).toBe(false);
    expect(r.warnings.filter((w) => /without waiting/.test(w))).toHaveLength(1);
    r.vm.start(OK);
    expect(r.vm.pose().ref[0]).toBe(2);
    expect(() => run(r.vm, 3)).not.toThrow();
  });

  it('a loop that waits is fine: a program may be as long-lived as it likes', () => {
    const LOOP = prog('loop', [call('refSetPos', 1, 0, 0), call('wait', 2), jmp(0)]);
    const r = rig([LOOP]);
    r.vm.start(LOOP);
    expect(() => run(r.vm, 50)).not.toThrow();
    expect(r.vm.running).toBe(true);
    expect(r.warnings).toEqual([]);
  });

  it('an empty argument list and missing variables read 0', () => {
    const P = prog('p', [call('refSetPos'), call('camMove'), set('battle:0x1', v('battle:0xffff')), ret()]);
    const r = rig([P]);
    expect(() => r.vm.start(P)).not.toThrow();
    near(r.vm.pose().ref, [0, 0, 0]);
  });
});

describe('the calls that write the rig', () => {
  it('all four angle units are degrees in the script: camSetPolar and camSetRoll', () => {
    const P = prog('p', [call('refSetPos', 0, 0, 0), call('camSetPolar', 90, 0, 10), call('camSetRoll', 90), ret()]);
    const r = rig([P]);
    r.vm.start(P);
    r.vm.tick();
    near(r.vm.pose().eye, [0, 0, 10], 1e-9);
    expect(r.vm.pose().roll).toBeCloseTo(90 * D2R, 12);
  });

  it('every move call blends: the Cos, Polar and Acc variants of both points are armed by their names', () => {
    for (const name of ['camMove', 'camMoveCos', 'camMovePolar', 'camMovePolarCos', 'camMoveAcc', 'camMovePolarAcc']) {
      const P = prog('p', [call('refSetPos', 0, 0, 0), call('camSetPolar', 0, 0, 100), call(name, 5, 2, 5, 0), call('camSetPolar', 90, 0, 100), ret()]);
      const r = rig([P]);
      r.vm.start(P);
      expect(r.solver.busy(1), name).toBe(true);
      r.vm.runToEnd();
      near(r.vm.pose().eye, [0, 0, 100], 1e-9);
    }
    for (const name of ['refMove', 'refMoveCos', 'refMovePolar', 'refMovePolarCos', 'refMoveAcc', 'refMovePolarAcc']) {
      const P = prog('p', [call('refSetPos', 0, 0, 0), call(name, 5, 2, 5, 0), call('refSetPos', 50, 0, 0), ret()]);
      const r = rig([P]);
      r.vm.start(P);
      expect(r.solver.busy(0), name).toBe(true);
    }
  });
});
