/**
 * **Test kit for the FFX camera replayer** (`src/engine/ffxcam/`): synthetic programs written in the IR (`ffx-cam-ir/1`) and a world to run them in. The director-side half (a recording sink, a
 * clock, fake shot contexts) is `./ffxcamDirectorKit.ts`.
 *
 * Rule 8 (AGENTS.md): the real programs are a transcription of FFX's scripts and never in the repo, not even as fixtures. Everything here is made up: the numbers mean nothing in the game, the
 * programs only exercise the machinery. The checks against the real programs (`ffxcam-local.test.ts`) read Bailey's own folder and skip without it.
 *
 * Game case: FFX only (the replayer is FFX's).
 */
import { ProgramBook } from '../../../src/engine/ffxcam/book.ts';
import type { ActorFrame, CameraHost } from '../../../src/engine/ffxcam/host.ts';
import { checkProgram, type Expr, type Program } from '../../../src/engine/ffxcam/ir.ts';
import { CameraSolver, type CameraPose } from '../../../src/engine/ffxcam/solver.ts';
import { CameraVm } from '../../../src/engine/ffxcam/vm.ts';

// ------------------------------------------------------------------ IR builders (what a transcription looks like)

type Raw = Record<string, unknown>;
export const call = (op: string, ...args: Expr[]): Raw => ({ op, args });
export const set = (variable: string, expr: Expr): Raw => ({ op: 'set', var: variable, expr });
export const setreg = (reg: string, expr: Expr): Raw => ({ op: 'setreg', reg, expr });
export const jmp = (to: number): Raw => ({ op: 'jmp', to });
export const jt = (cond: Expr, to: number): Raw => ({ op: 'jt', cond, to });
export const jf = (cond: Expr, to: number): Raw => ({ op: 'jf', cond, to });
export const sw = (expr: Expr, cases: Array<[number, number]>, dflt: number): Raw => ({ op: 'switch', expr, cases, default: dflt });
export const ret = (): Raw => ({ op: 'ret' });
export const v = (name: string): Expr => ({ var: name });
export const q = (name: string, ...args: Expr[]): Expr => ({ call: name, args });
export const bin = (op: string, l: Expr, r: Expr): Expr => ({ op, l, r }) as Expr;

/** A validated program from raw instructions (the JSON shape), or a thrown problem. */
export function prog(id: string, code: Raw[], extra: Raw = {}): Program {
  const checked = checkProgram({ format: 'ffx-cam-ir/1', id, entryIndex: 0, code, ...extra });
  if (!('program' in checked)) throw new Error(`${id}: ${checked.problem}`);
  return checked.program;
}

// ------------------------------------------------------------------ a world

/** A generic table-driven host: actors by character number, query answers by name, a scripted random list, and a log of what was asked. */
export class TestHost implements CameraHost {
  readonly frames = new Map<number, ActorFrame>();
  readonly answers = new Map<string, number>();
  readonly asked: string[] = [];
  readonly writes: Array<[number, number, number]> = [];
  rolls: number[] = [];
  groups = new Map<number, readonly number[]>();
  select(selector: number): readonly number[] {
    return this.groups.get(selector) ?? (selector >= 0 && this.frames.has(selector) ? [selector] : []);
  }
  actor(chr: number): ActorFrame | undefined {
    return this.frames.get(chr);
  }
  query(name: string): number | undefined {
    this.asked.push(name);
    return this.answers.get(name);
  }
  random(stream: number): number {
    this.asked.push(`random:${stream}`);
    return this.rolls.length > 0 ? (this.rolls.shift() as number) : 0;
  }
  write(selector: number, property: number, value: number): void {
    this.writes.push([selector, property, value]);
  }
}

export const frame = (x: number, y: number, z: number, over: Partial<ActorFrame> = {}): ActorFrame => ({ pos: [x, y, z], heading: 0, height: 60, width: 30, ...over });

export interface Rig {
  readonly solver: CameraSolver;
  readonly vm: CameraVm;
  readonly book: ProgramBook;
  readonly host: CameraHost;
  readonly started: string[];
  readonly warnings: string[];
}

/** A solver and VM over `programs`; `tags` maps `script:slot:tag` to program ids (script `s`, camera slot 0). */
export function rig(programs: Program[], tags: Record<string, string> = {}, host: CameraHost = new TestHost()): Rig {
  const solver = new CameraSolver(host);
  const book = new ProgramBook(programs, tags, ['s']);
  const started: string[] = [];
  const warnings: string[] = [];
  const vm = new CameraVm({ solver, book, host, onStart: (p) => started.push(p.id), warn: (m) => warnings.push(m) });
  return { solver, vm, book, host, started, warnings };
}

/** `tag -> id` in the camera-slot form the book wants. */
export const tagsOf = (m: Record<number, string>): Record<string, string> => Object.fromEntries(Object.entries(m).map(([tag, id]) => [`s:0:${tag}`, id]));

/** Tick `n` steps and return every step's pose. */
export function run(vm: CameraVm, n: number): CameraPose[] {
  return Array.from({ length: n }, () => vm.tick());
}

export const near = (a: readonly number[], b: readonly number[], eps = 1e-9): void => {
  for (let i = 0; i < b.length; i++) if (!(Math.abs((a[i] as number) - (b[i] as number)) <= eps)) throw new Error(`expected [${[...a].join(', ')}] to be near [${[...b].join(', ')}] (index ${i}, eps ${eps})`);
};

export const D2R = Math.PI / 180;
