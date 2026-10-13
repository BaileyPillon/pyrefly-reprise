/**
 * **Expression evaluation** for the camera-program VM (`./vm.ts`): numbers, variables, registers, queries and the operators C has, over `number`.
 *
 * Booleans are 1 and 0. `mod` is the C remainder on integers (a zero divisor gives 0 rather than NaN: a script bug must cost a shot, never the page). `and` and `or` evaluate both operands, as the
 * engine's do (queries have no side effects; the one that draws, `camRand`, only ever stands alone as `(camRand(0) mod n)`). The bitwise operators work on 32-bit integers.
 *
 * Pure. Game case: FFX only.
 */

import type { Expr } from './ir.ts';

/** What an expression reads from outside itself. */
export interface EvalEnv {
  variable(name: string): number;
  register(name: string): number;
  /** A query by name with its arguments already evaluated. */
  query(name: string, args: readonly number[]): number;
}

const truth = (b: boolean): number => (b ? 1 : 0);

export function evaluate(e: Expr, env: EvalEnv): number {
  if (typeof e === 'number') return e;
  if ('var' in e) return env.variable(e.var);
  if ('reg' in e) return env.register(e.reg);
  if ('call' in e) return env.query(e.call, e.args.map((a) => evaluate(a, env)));
  if ('x' in e) {
    const x = evaluate(e.x, env);
    return e.op === '!' ? truth(x === 0) : e.op === 'neg' ? -x : ~Math.trunc(x);
  }
  const a = evaluate(e.l, env);
  const b = evaluate(e.r, env);
  switch (e.op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case 'mod': {
      const d = Math.trunc(b);
      return d === 0 ? 0 : Math.trunc(a) % d;
    }
    case '==':
      return truth(a === b);
    case '!=':
      return truth(a !== b);
    case '<':
      return truth(a < b);
    case '>':
      return truth(a > b);
    case '<=':
      return truth(a <= b);
    case '>=':
      return truth(a >= b);
    case 'and':
      return truth(a !== 0 && b !== 0);
    case 'or':
      return truth(a !== 0 || b !== 0);
    case '|':
      return Math.trunc(a) | Math.trunc(b);
    case '&':
      return Math.trunc(a) & Math.trunc(b);
    case '^':
      return Math.trunc(a) ^ Math.trunc(b);
    case '<<':
      return Math.trunc(a) << Math.trunc(b);
    case '>>':
      return Math.trunc(a) >> Math.trunc(b);
  }
}
