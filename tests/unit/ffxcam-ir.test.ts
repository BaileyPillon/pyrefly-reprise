/**
 * **The camera-program IR** (`src/engine/ffxcam/ir.ts`): what a program must look like to be run, and what is refused.
 *
 * Synthetic programs only (rule 8: the real ones are never in the repo). Pins: a minimal program validates and is normalised (addresses and aliases dropped, float constants made float32, integers
 * untouched); every malformed shape is refused with a reason rather than run (a jump outside the program, an expression that is not an expression, a non-finite constant, an over-deep or over-long
 * program); nothing throws.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { checkProgram, IR_FORMAT, MAX_EXPR_DEPTH, MAX_INSTRUCTIONS } from '../../src/engine/ffxcam/ir.ts';

const base = (code: unknown[], over: Record<string, unknown> = {}): unknown => ({ format: IR_FORMAT, id: 't.w1.f0', entryIndex: 0, code, ...over });
const problemOf = (raw: unknown): string => {
  const c = checkProgram(raw);
  if ('program' in c) throw new Error('expected a problem');
  return c.problem;
};

describe('a valid program', () => {
  it('is accepted, with the worker and script it names and the entry it starts at', () => {
    const c = checkProgram(base([{ op: 'jmp', to: 2 }, { op: 'ret' }, { op: 'ret' }], { entryIndex: 1, script: 'hiku', worker: 3 }));
    expect('program' in c && c.program).toMatchObject({ id: 't.w1.f0', entryIndex: 1, script: 'hiku', worker: 3 });
  });

  it('keeps every instruction kind: set, setreg, jmp, jt, jf, switch, ret, halt and a call', () => {
    const c = checkProgram(
      base([
        { i: 0, a: '0x10', op: 'set', var: 'battle:0x4', as: 'v0', expr: 1 },
        { op: 'setreg', reg: 'I0', expr: { call: 'chosenCommand', args: [] } },
        { op: 'jt', cond: { op: '==', l: { var: 'battle:0x4', as: 'v0' }, r: 1 }, to: 4 },
        { op: 'jf', cond: { op: '!', x: { reg: 'I0' } }, to: 4 },
        { op: 'switch', expr: { reg: 'I0' }, cases: [[0, 5], [1, 6]], default: 6 },
        { op: 'camSetPolar', args: [-90, 0, { op: '*', l: 2, r: { var: 'battle:0x8' } }] },
        { op: 'halt' },
      ]),
    );
    expect('program' in c).toBe(true);
    if (!('program' in c)) return;
    expect(c.program.code.map((i) => i.op)).toEqual(['set', 'setreg', 'jt', 'jf', 'switch', 'camSetPolar', 'halt']);
    expect(c.program.code[0]).toEqual({ op: 'set', var: 'battle:0x4', expr: 1 }); // the address and the alias are not kept
    expect(c.program.code[2]).toEqual({ op: 'jt', cond: { op: '==', l: { var: 'battle:0x4' }, r: 1 }, to: 4 });
  });

  it('allows a jump to the end (one past the last instruction)', () => {
    expect('program' in checkProgram(base([{ op: 'jmp', to: 1 }]))).toBe(true);
  });

  it('makes float constants float32 and leaves integers alone', () => {
    const c = checkProgram(base([{ op: 'camSetRoll', args: [0.1] }, { op: 'camGetRealPos', args: [1644167504, 0.5] }, { op: 'ret' }]));
    if (!('program' in c)) throw new Error('expected a program');
    const [first, second] = c.program.code as unknown as Array<{ args: number[] }>;
    expect(first?.args[0]).toBe(Math.fround(0.1));
    expect(first?.args[0]).not.toBe(0.1);
    expect(second?.args).toEqual([1644167504, 0.5]); // a pointer-sized integer is not a float32 and keeps its value; 0.5 is exact
  });

  it('treats a missing argument list on a call as no arguments', () => {
    const c = checkProgram(base([{ op: 'camResetMove' }, { op: 'ret' }]));
    expect('program' in c && c.program.code[0]).toEqual({ op: 'camResetMove', args: [] });
  });
});

describe('what is refused, with a reason', () => {
  it.each([
    ['null', null, /not an object/],
    ['an array', [], /not an object/],
    ['the wrong format', { format: 'ffx-cam-ir/2', id: 'x', code: [{ op: 'ret' }] }, /format/],
    ['no id', { format: IR_FORMAT, code: [{ op: 'ret' }] }, /id/],
    ['an empty id', { format: IR_FORMAT, id: '', code: [{ op: 'ret' }] }, /id/],
    ['no code', { format: IR_FORMAT, id: 'x' }, /code/],
    ['empty code', { format: IR_FORMAT, id: 'x', code: [] }, /code/],
  ])('%s', (_name, raw, reason) => {
    expect(problemOf(raw)).toMatch(reason);
  });

  it('an entry outside the program', () => {
    expect(problemOf(base([{ op: 'ret' }], { entryIndex: 1 }))).toMatch(/entryIndex/);
    expect(problemOf(base([{ op: 'ret' }], { entryIndex: -1 }))).toMatch(/entryIndex/);
    expect(problemOf(base([{ op: 'ret' }], { entryIndex: 0.5 }))).toMatch(/entryIndex/);
  });

  it('a jump outside the program, in every instruction that jumps', () => {
    expect(problemOf(base([{ op: 'jmp', to: 2 }]))).toMatch(/jump target/);
    expect(problemOf(base([{ op: 'jmp', to: -1 }]))).toMatch(/jump target/);
    expect(problemOf(base([{ op: 'jt', cond: 1, to: 9 }]))).toMatch(/jump target/);
    expect(problemOf(base([{ op: 'jf', cond: 1, to: 1.5 }]))).toMatch(/jump target/);
    expect(problemOf(base([{ op: 'switch', expr: 1, cases: [[0, 9]], default: 0 }]))).toMatch(/jump target/);
    expect(problemOf(base([{ op: 'switch', expr: 1, cases: [[0, 0]], default: 7 }]))).toMatch(/jump target/);
  });

  it('structural instructions that are malformed', () => {
    expect(problemOf(base([{ op: 'set', expr: 1 }]))).toMatch(/set has no variable/);
    expect(problemOf(base([{ op: 'setreg', reg: '', expr: 1 }]))).toMatch(/setreg has no register/);
    expect(problemOf(base([{ op: 'switch', expr: 1, default: 0 }]))).toMatch(/case list/);
    expect(problemOf(base([{ op: 'switch', expr: 1, cases: [[0]], default: 0 }]))).toMatch(/\[value, target\]/);
    expect(problemOf(base([{ op: 'camMove', args: 5 }]))).toMatch(/arguments/);
    expect(problemOf(base(['ret']))).toMatch(/not an object with an op/);
    expect(problemOf(base([{ op: '' }]))).toMatch(/not an object with an op/);
  });

  it('an expression that is not one', () => {
    expect(problemOf(base([{ op: 'camMove', args: ['120'] }]))).toMatch(/neither a number nor an object/);
    expect(problemOf(base([{ op: 'camMove', args: [{ op: '**', l: 1, r: 2 }] }]))).toMatch(/op "\*\*"/);
    expect(problemOf(base([{ op: 'camMove', args: [{ op: '+', l: 1 }] }]))).toMatch(/not a variable, register, query or operator/);
    expect(problemOf(base([{ op: 'camMove', args: [{ nothing: true }] }]))).toMatch(/not a variable, register, query or operator/);
    expect(problemOf(base([{ op: 'camMove', args: [Number.NaN] }]))).toMatch(/not finite/);
    expect(problemOf(base([{ op: 'camMove', args: [Number.POSITIVE_INFINITY] }]))).toMatch(/not finite/);
  });

  it('an expression nested deeper than the limit, and a program longer than it', () => {
    let deep: unknown = 1;
    for (let i = 0; i < MAX_EXPR_DEPTH + 2; i++) deep = { op: '+', l: deep, r: 1 };
    expect(problemOf(base([{ op: 'camMove', args: [deep] }]))).toMatch(/nested deeper/);
    expect(problemOf(base(Array.from({ length: MAX_INSTRUCTIONS + 1 }, () => ({ op: 'ret' }))))).toMatch(/over the/);
  });

  it('never throws, whatever it is handed', () => {
    for (const raw of [undefined, 0, 'x', true, { code: 'no' }, { format: IR_FORMAT, id: 'x', code: [{ op: 'jmp' }] }]) expect(() => checkProgram(raw)).not.toThrow();
  });
});
