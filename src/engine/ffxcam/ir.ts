/**
 * **The camera-program IR** (`ffx-cam-ir/1`): the shape of one FFX battle-camera program, as the replayer (`./vm.ts`) runs it.
 *
 * FFX does not store its battle camera as keyframes. Every battle's camera is a small script (a "camera handler" in the formation's file, with fall-backs in a common one) run by the same VM as the
 * monster AI; the engine supplies the rig (an eye, a look-at, a roll and a lens value), the blends and the dispatch of numbered shot requests. The replayer runs those scripts, so this file is the
 * language they are written in, after they have been lifted to JSON on Bailey's PC (`D:\Tools\ffx-parity\camera\programs\`, `SPEC.md` section 2).
 *
 * **Rule 8 (AGENTS.md): no retail data in the repo.** The programs are a transcription of the game's scripts, so they are never in git, in `public/`, in `dist/` or on the site, not even as test
 * fixtures. `./load.ts` fetches them in a dev server from his local folder (`/__ffx-local/camera/...`); the tests use synthetic programs written in this same format, and the checks against the real
 * ones read his folder and skip without it. This file holds the format only: no number from any program.
 *
 * What a program is, in one paragraph: a flat list of instructions with absolute jump targets. `set` and `setreg` store into a battle-wide variable (`battle:0xNNN`, shared by every program) or a
 * thread-local register; `jmp`, `jt`, `jf` and `switch` branch; `ret` and `halt` end the program; every other `op` is a call (`camSetPolar`, `refMove`, `wait`, `camReq`...) with expression arguments, and
 * the call dictionary is `./vm.ts` and `./calls.ts`. Expressions are numbers, variables, registers, queries to the world (`readBtlChrProperty(20, 30)`) and the operators C has.
 *
 * Game case: FFX only (the format is the FFX scripts').
 */

export const IR_FORMAT = 'ffx-cam-ir/1';

/** A point or vector in FFX units: Y points down (a standing character is near y = -35; up is negative y). */
export type Vec3 = readonly [number, number, number];

/** Binary operators. `mod` is the C remainder; `and` and `or` evaluate both operands (queries have no side effects); `|`, `&`, `^`, `<<` and `>>` work on 32-bit integers. */
export type BinOp = '+' | '-' | '*' | 'mod' | '==' | '!=' | '<' | '>' | '<=' | '>=' | 'and' | 'or' | '|' | '&' | '^' | '<<' | '>>';
export type UnOp = '!' | 'neg' | '~';

/** A battle-wide, savedata or per-worker variable by its address (`battle:0x240`). The worker-local alias the transcription also carries (`as`) is dropped. */
export interface VarExpr {
  readonly var: string;
}
/** A thread-local register (`I0`..`I3`, `F0`..`F9`). */
export interface RegExpr {
  readonly reg: string;
}
/** A query to the world, evaluated where it stands. Side-effect free except the random ones, which draw from the presentation source. */
export interface QueryExpr {
  readonly call: string;
  readonly args: readonly Expr[];
}
export interface BinaryExpr {
  readonly op: BinOp;
  readonly l: Expr;
  readonly r: Expr;
}
export interface UnaryExpr {
  readonly op: UnOp;
  readonly x: Expr;
}
export type Expr = number | VarExpr | RegExpr | QueryExpr | BinaryExpr | UnaryExpr;

export interface SetIns {
  readonly op: 'set';
  readonly var: string;
  readonly expr: Expr;
}
export interface SetRegIns {
  readonly op: 'setreg';
  readonly reg: string;
  readonly expr: Expr;
}
export interface JmpIns {
  readonly op: 'jmp';
  readonly to: number;
}
/** Jump if the condition is true (`jt`) or false (`jf`); otherwise fall through. */
export interface JumpIfIns {
  readonly op: 'jt' | 'jf';
  readonly cond: Expr;
  readonly to: number;
}
/** Evaluate once; jump to the first case whose value equals it, else to `default`. */
export interface SwitchIns {
  readonly op: 'switch';
  readonly expr: Expr;
  readonly cases: readonly (readonly [number, number])[];
  readonly default: number;
}
export interface EndIns {
  readonly op: 'ret' | 'halt';
}
/** Any other `op`: a statement call with expression arguments. */
export interface CallIns {
  readonly op: string;
  readonly args: readonly Expr[];
}
export type Ins = SetIns | SetRegIns | JmpIns | JumpIfIns | SwitchIns | EndIns | CallIns;

/** One program, validated: jump targets are in range, expressions are well formed, float constants are float32 values. */
export interface Program {
  readonly format: typeof IR_FORMAT;
  /** `<script>.w<worker>.f<function>` for the real ones; anything unique for a synthetic one. */
  readonly id: string;
  /** The script (`hiku15_00`) and worker the program belongs to; only the per-worker `private:` variables use them. */
  readonly script: string;
  readonly worker: number;
  /** The index in `code` where execution starts (the code is in script-address order and jumps may go backwards). */
  readonly entryIndex: number;
  readonly code: readonly Ins[];
}

/** The size limits a program is held to: a runaway file is refused, not run. The longest real program has 1,464 instructions and the deepest expression is under ten levels. */
export const MAX_INSTRUCTIONS = 20_000;
export const MAX_EXPR_DEPTH = 48;
const MAX_CASES = 4096;

const BINARY_OPS: ReadonlySet<string> = new Set(['+', '-', '*', 'mod', '==', '!=', '<', '>', '<=', '>=', 'and', 'or', '|', '&', '^', '<<', '>>']);
const UNARY_OPS: ReadonlySet<string> = new Set(['!', 'neg', '~']);
/** The ops that are control flow and data, not calls. */
const STRUCTURAL: ReadonlySet<string> = new Set(['set', 'setreg', 'jmp', 'jt', 'jf', 'switch', 'ret', 'halt']);

class IrProblem extends Error {}

const bad = (why: string): never => {
  throw new IrProblem(why);
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A float constant as the script holds it: float32. Integers are left alone (a pointer-sized integer is not a float32 and must keep its value). */
const constant = (n: number): number => (Number.isInteger(n) ? n : Math.fround(n));

function readExpr(e: unknown, depth: number, where: string): Expr {
  if (depth > MAX_EXPR_DEPTH) return bad(`${where}: an expression is nested deeper than ${MAX_EXPR_DEPTH}`);
  if (typeof e === 'number') return Number.isFinite(e) ? constant(e) : bad(`${where}: a constant is not finite`);
  if (!isRecord(e)) return bad(`${where}: an expression is neither a number nor an object`);
  if (typeof e['var'] === 'string') return { var: e['var'] };
  if (typeof e['reg'] === 'string') return { reg: e['reg'] };
  if (typeof e['call'] === 'string') {
    const args = Array.isArray(e['args']) ? (e['args'] as unknown[]) : [];
    return { call: e['call'], args: args.map((a) => readExpr(a, depth + 1, where)) };
  }
  const op = e['op'];
  if (typeof op === 'string' && 'x' in e && UNARY_OPS.has(op)) return { op: op as UnOp, x: readExpr(e['x'], depth + 1, where) };
  if (typeof op === 'string' && BINARY_OPS.has(op) && 'l' in e && 'r' in e) return { op: op as BinOp, l: readExpr(e['l'], depth + 1, where), r: readExpr(e['r'], depth + 1, where) };
  return bad(`${where}: an expression is not a variable, register, query or operator${typeof op === 'string' ? ` (op "${op}")` : ''}`);
}

const readTarget = (v: unknown, length: number, where: string): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= length ? v : bad(`${where}: jump target ${JSON.stringify(v)} is outside the program (0..${length})`);

function readIns(raw: unknown, index: number, length: number): Ins {
  const where = `instruction ${index}`;
  if (!isRecord(raw) || typeof raw['op'] !== 'string' || raw['op'] === '') return bad(`${where}: not an object with an op`);
  const op = raw['op'];
  switch (op) {
    case 'set':
      if (typeof raw['var'] !== 'string' || raw['var'] === '') return bad(`${where}: set has no variable`);
      return { op, var: raw['var'], expr: readExpr(raw['expr'], 0, where) };
    case 'setreg':
      if (typeof raw['reg'] !== 'string' || raw['reg'] === '') return bad(`${where}: setreg has no register`);
      return { op, reg: raw['reg'], expr: readExpr(raw['expr'], 0, where) };
    case 'jmp':
      return { op, to: readTarget(raw['to'], length, where) };
    case 'jt':
    case 'jf':
      return { op, cond: readExpr(raw['cond'], 0, where), to: readTarget(raw['to'], length, where) };
    case 'switch': {
      const cases = raw['cases'];
      if (!Array.isArray(cases) || cases.length > MAX_CASES) return bad(`${where}: switch has no case list (or more than ${MAX_CASES})`);
      const pairs = cases.map((c): readonly [number, number] => {
        if (!Array.isArray(c) || c.length !== 2 || typeof c[0] !== 'number') return bad(`${where}: a switch case is not a [value, target] pair`);
        return [c[0], readTarget(c[1], length, where)];
      });
      return { op, expr: readExpr(raw['expr'], 0, where), cases: pairs, default: readTarget(raw['default'], length, where) };
    }
    case 'ret':
    case 'halt':
      return { op };
    default: {
      if (STRUCTURAL.has(op)) return bad(`${where}: ${op} is malformed`);
      const args = raw['args'] === undefined ? [] : raw['args'];
      if (!Array.isArray(args)) return bad(`${where}: ${op} has arguments that are not a list`);
      return { op, args: args.map((a) => readExpr(a, 0, where)) };
    }
  }
}

/**
 * Either the program, validated and normalised (the transcription's address fields dropped, float constants made float32), or the first thing wrong with `raw` in a few words. Pure: nothing is logged,
 * nothing throws.
 */
export function checkProgram(raw: unknown): { program: Program } | { problem: string } {
  try {
    if (!isRecord(raw)) return { problem: 'it is not an object' };
    if (raw['format'] !== IR_FORMAT) return { problem: `format is ${JSON.stringify(raw['format'])}, not "${IR_FORMAT}"` };
    const id = raw['id'];
    if (typeof id !== 'string' || id === '') return { problem: 'id is not a non-empty string' };
    const code = raw['code'];
    if (!Array.isArray(code) || code.length === 0) return { problem: `${id}: code is not a non-empty list` };
    if (code.length > MAX_INSTRUCTIONS) return { problem: `${id}: ${code.length} instructions is over the ${MAX_INSTRUCTIONS} limit` };
    const entry = raw['entryIndex'] === undefined ? 0 : raw['entryIndex'];
    if (typeof entry !== 'number' || !Number.isInteger(entry) || entry < 0 || entry >= code.length) return { problem: `${id}: entryIndex ${JSON.stringify(entry)} is outside the program` };
    const out = code.map((ins, i) => readIns(ins, i, code.length));
    const script = typeof raw['script'] === 'string' ? raw['script'] : '';
    const worker = typeof raw['worker'] === 'number' && Number.isInteger(raw['worker']) ? raw['worker'] : 0;
    return { program: { format: IR_FORMAT, id, script, worker, entryIndex: entry, code: out } };
  } catch (e) {
    if (e instanceof IrProblem) return { problem: e.message };
    throw e;
  }
}
