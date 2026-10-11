/**
 * **The camera-program VM**: runs FFX's battle-camera scripts (`./ir.ts`) one logic step at a time over the solver (`./solver.ts`).
 *
 * One **camera thread**, like the engine's: a request (`./book.ts`) names a tag, the first program with a handler starts, and starting **kills whatever the thread was running** and runs the new
 * program at once up to its first wait (`SPEC.md` section 5). What the old program had armed keeps running: a move belongs to the camera, not to the script.
 *
 * **A logic step** is `tick()`: the script phase (a waiting thread counts down, a `camWait` polls the camera), then the solver once. Every frame count in the scripts is a logic step; the director
 * turns real time into steps (`./director.ts`).
 *
 * - `wait(n)` called at step k resumes at step k + n (the step it was called in does not count down).
 * - `camWait()` / `refWait()` block while a move is armed on the eye (including its roll and lens) / the look-at: a move armed at step k with n steps is evaluated through step k + n, and the script
 *   goes on at step k + n + 1.
 * - `camReq(slot, tag)` from a camera program is a **tail call**: the requesting program is the thread being reset, so nothing after it runs. A tag nobody answers does nothing and the program goes on.
 *   (A scene driver's `camReq`, which in the engine starts the camera function and lets the driver go on, is therefore a tail call here too: the director does not run the drivers.)
 * - Branches read the battle variables (`battle:0xNNN`, shared by every program and assumed 0 at the start), thread registers and **queries**, which go to the host (`./host.ts`). The VM answers four
 *   itself: `camRand` and `GetRandomValue` from the host's PRESENTATION random source (never the battle RNG), `camGetRoll` and `camGetScrDpt` from the solver.
 * - **Nothing throws.** An unknown call or query is counted, logged once (`warn`, by default a dev `console.warn`) and ignored (a query answers 0); a program that runs more than
 *   `maxInstructions` without waiting is stopped and logged.
 *
 * Pure: no DOM, no `three`. Game case: FFX only.
 */

import { INERT_CALLS, SOLVER_CALLS } from './calls.ts';
import { evaluate, type EvalEnv } from './expr.ts';
import type { CameraHost } from './host.ts';
import type { CallIns, Expr, Ins, JmpIns, JumpIfIns, Program, SetIns, SetRegIns, SwitchIns } from './ir.ts';
import type { CameraRequest, ProgramBook } from './book.ts';
import { EYE, REF, type CameraPose, type CameraSolver } from './solver.ts';

/** How many instructions a program may run in one go (between two waits) before it is stopped. The longest real program has 1,464 instructions in all. */
export const DEFAULT_MAX_INSTRUCTIONS = 50_000;

/** How many requests may chain inside one start (a `camReq` that answers a `camReq`...) before the chain is cut. */
const MAX_CHAIN = 32;

/** Counts of what the VM did with every call and query, for tests and the report on a program set. */
export interface VmStats {
  /** Calls that wrote the rig or ran in the VM, by name. */
  readonly handled: Map<string, number>;
  /** Known calls with no effect on the camera, by name. */
  readonly ignored: Map<string, number>;
  readonly unknownCalls: Map<string, number>;
  /** Queries the host or the VM answered, by name. */
  readonly queries: Map<string, number>;
  readonly unknownQueries: Map<string, number>;
}

export interface VmOptions {
  readonly solver: CameraSolver;
  readonly book: ProgramBook;
  readonly host: CameraHost;
  /** Called when a program starts (a request, or a `camReq` from another program). */
  readonly onStart?: (program: Program, step: number) => void;
  /** Where a one-off warning goes. Default: `console.warn` in a dev build, nowhere in a production one. */
  readonly warn?: (message: string) => void;
  readonly maxInstructions?: number;
}

interface Thread {
  readonly program: Program;
  pc: number;
  /** Steps still to wait; above 0 the thread is asleep. */
  wait: number;
  /** The step `wait` was called in: its first count-down is the next step. */
  waitStep: number;
  block: 'cam' | 'ref' | null;
  done: boolean;
  readonly regs: Map<string, number>;
}

const bump = (m: Map<string, number>, k: string): number => {
  const n = (m.get(k) ?? 0) + 1;
  m.set(k, n);
  return n;
};

const defaultWarn = (message: string): void => {
  if (import.meta.env.DEV) console.warn(message);
};

export class CameraVm implements EvalEnv {
  /** Battle-wide variables by address (`battle:0x240`), and the savedata flags; unset reads 0. Public: the director seeds and reads them (`battle:0x4` selects Pull back or Move in). */
  readonly vars = new Map<string, number>();
  readonly stats: VmStats = { handled: new Map(), ignored: new Map(), unknownCalls: new Map(), queries: new Map(), unknownQueries: new Map() };

  private readonly solver: CameraSolver;
  private readonly book: ProgramBook;
  private readonly host: CameraHost;
  private readonly onStart: ((program: Program, step: number) => void) | undefined;
  private readonly warnFn: (message: string) => void;
  private readonly maxInstructions: number;
  private readonly warned = new Set<string>();
  private thread: Thread | null = null;
  private current: Thread | null = null; // the thread whose instruction is being evaluated (registers, private variables)
  private pending: Program | null = null; // a `camReq` asked for this program
  private stepNo = 0;

  constructor(opts: VmOptions) {
    this.solver = opts.solver;
    this.book = opts.book;
    this.host = opts.host;
    this.onStart = opts.onStart;
    this.warnFn = opts.warn ?? defaultWarn;
    this.maxInstructions = opts.maxInstructions ?? DEFAULT_MAX_INSTRUCTIONS;
  }

  // -------------------------------------------------------------- the thread

  /** The logic steps run so far. */
  get steps(): number {
    return this.stepNo;
  }

  /** A program is running or asleep. */
  get running(): boolean {
    return this.thread !== null && !this.thread.done;
  }

  /** Nothing is running and no move is armed: the camera is where it will stay (a recipe still follows its actors). */
  get idle(): boolean {
    return !this.running && !this.solver.busy(REF) && !this.solver.busy(EYE);
  }

  /** The id of the program on the thread (running or finished), for tests and logs. */
  get programId(): string | undefined {
    return this.thread?.program.id;
  }

  /** Kill the camera thread and run `program` from its entry up to its first wait. The camera itself is not reset. */
  start(program: Program): void {
    let next: Program | null = program;
    for (let hops = 0; next !== null && hops < MAX_CHAIN; hops++) {
      const thread: Thread = { program: next, pc: next.entryIndex, wait: 0, waitStep: this.stepNo, block: null, done: false, regs: new Map() };
      this.thread = thread;
      this.onStart?.(next, this.stepNo);
      next = this.run(thread);
    }
    if (next !== null) this.warnOnce('chain', `[ffxcam] ${next.id}: more than ${MAX_CHAIN} requests chained; the chain was cut`);
  }

  /** Resolve a request against the book and start its program; undefined (and nothing started) when no script answers. */
  request(req: CameraRequest): Program | undefined {
    const program = this.book.resolve(req);
    if (program) this.start(program);
    return program;
  }

  /** One logic step: the script phase, then the solver once. Returns the step's pose. */
  tick(): CameraPose {
    this.scriptPhase();
    this.solver.step();
    this.stepNo += 1;
    return this.solver.pose();
  }

  /** The camera as it stands (the last step's, or the last `Set*`'s hard cut). */
  pose(): CameraPose {
    return this.solver.pose();
  }

  /** Tick until the camera is idle (or `maxSteps`); the number of steps run. Zero when it already is. */
  runToEnd(maxSteps = 6000): number {
    let n = 0;
    while (!this.idle && n < maxSteps) {
      this.tick();
      n += 1;
    }
    if (!this.idle) this.warnOnce('runaway-end', `[ffxcam] ${this.programId ?? 'the camera'} did not finish in ${maxSteps} steps`);
    return n;
  }

  // ------------------------------------------------------------ script phase

  private scriptPhase(): void {
    const th = this.thread;
    if (!th || th.done) return;
    if (th.wait > 0) {
      if (th.waitStep === this.stepNo) return; // called this very step: counting starts next step
      th.wait -= 1;
      if (th.wait > 0) return;
    }
    if (th.block === 'cam') {
      if (this.solver.busy(EYE)) return;
      th.block = null;
    } else if (th.block === 'ref') {
      if (this.solver.busy(REF)) return;
      th.block = null;
    }
    const next = this.run(th);
    if (next) this.start(next);
  }

  /** Run `th` until it waits, ends, or asks for another program (returned). */
  private run(th: Thread): Program | null {
    this.current = th;
    let budget = this.maxInstructions;
    while (!th.done && th.wait === 0 && th.block === null) {
      if (budget-- <= 0) {
        th.done = true;
        this.warnOnce(`budget:${th.program.id}`, `[ffxcam] ${th.program.id} ran ${this.maxInstructions} instructions without waiting; it was stopped`);
        break;
      }
      const ins = th.program.code[th.pc];
      if (!ins) {
        th.done = true; // fell off the end
        break;
      }
      th.pc += 1;
      this.exec(th, ins);
      if (this.pending) {
        const next = this.pending;
        this.pending = null;
        th.done = true; // a tail call: nothing after the request runs
        return next;
      }
    }
    return null;
  }

  private exec(th: Thread, ins: Ins): void {
    switch (ins.op) {
      case 'set': {
        const s = ins as SetIns;
        this.vars.set(this.varKey(th, s.var), this.eval(s.expr));
        return;
      }
      case 'setreg': {
        const s = ins as SetRegIns;
        th.regs.set(s.reg, this.eval(s.expr));
        return;
      }
      case 'jmp':
        th.pc = (ins as JmpIns).to;
        return;
      case 'jt':
      case 'jf': {
        const j = ins as JumpIfIns;
        if ((this.eval(j.cond) !== 0) === (ins.op === 'jt')) th.pc = j.to;
        return;
      }
      case 'switch': {
        const s = ins as SwitchIns;
        const v = this.eval(s.expr);
        th.pc = s.cases.find((c) => c[0] === v)?.[1] ?? s.default;
        return;
      }
      case 'ret':
      case 'halt':
        th.done = true;
        return;
      default:
        this.call(th, ins as CallIns);
    }
  }

  private call(th: Thread, ins: CallIns): void {
    const name = ins.op;
    const a = ins.args.map((e) => this.eval(e));
    switch (name) {
      case 'wait': {
        const n = Math.trunc(a[0] ?? 0);
        if (n > 0) {
          th.wait = n;
          th.waitStep = this.stepNo;
        }
        break;
      }
      case 'camWait':
        if (this.solver.busy(EYE)) th.block = 'cam';
        break;
      case 'refWait':
        if (this.solver.busy(REF)) th.block = 'ref';
        break;
      case 'camReq': {
        const program = this.book.forTag(a[1] ?? 0);
        if (program) this.pending = program;
        break;
      }
      case 'writeBtlChrProperty':
        this.host.write?.(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0);
        break;
      default: {
        const handler = SOLVER_CALLS[name];
        if (handler) {
          handler(this.solver, a);
        } else if (INERT_CALLS.has(name)) {
          bump(this.stats.ignored, name);
          return;
        } else {
          if (bump(this.stats.unknownCalls, name) === 1) this.warnOnce(`call:${name}`, `[ffxcam] ${th.program.id}: unknown call "${name}" ignored`);
          return;
        }
      }
    }
    bump(this.stats.handled, name);
  }

  // ----------------------------------------------------------- expressions

  private eval(e: Expr): number {
    return evaluate(e, this);
  }

  /** `private:` variables belong to a worker, not to the program: the four scene drivers of one worker share them. */
  private varKey(th: Thread, name: string): string {
    return name.startsWith('private:') ? `${th.program.script}.w${th.program.worker}.${name}` : name;
  }

  variable(name: string): number {
    return this.vars.get(this.current ? this.varKey(this.current, name) : name) ?? 0;
  }

  register(name: string): number {
    return this.current?.regs.get(name) ?? 0;
  }

  query(name: string, args: readonly number[]): number {
    let answer: number | undefined;
    switch (name) {
      case 'camRand':
        answer = this.host.random(14 + ((args[0] ?? 0) & 1)); // FFX: battle stream 14 + (n & 1), here the presentation's own
        break;
      case 'GetRandomValue':
        answer = this.host.random(2);
        break;
      case 'camGetScrDpt':
        answer = this.solver.scrDpt;
        break;
      case 'camGetRoll':
        answer = this.solver.rollDeg;
        break;
      default:
        answer = this.host.query(name, args);
    }
    if (answer === undefined) {
      if (bump(this.stats.unknownQueries, name) === 1) this.warnOnce(`query:${name}`, `[ffxcam] unknown query "${name}" answers 0`);
      return 0;
    }
    bump(this.stats.queries, name);
    return answer;
  }

  private warnOnce(key: string, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    this.warnFn(message);
  }
}
