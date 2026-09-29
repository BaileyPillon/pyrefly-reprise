/**
 * **Advisor v4 on the main thread.** It owns the worker, starts a search whenever the next board
 * is fixed, and at menu open hands the card either the finished answer for that exact board or
 * nothing (then the card is v3's, computed as it always was). It never waits and never changes a
 * card after it is drawn: the card is read once, at menu open [AGENTS.md rule 9; the method
 * check §6.4].
 *
 * When a search starts (FFX):
 *
 *  - **at a press** (`boardFixed`, after `submit`): in CTB nothing the player does before the next
 *    menu changes that menu's board, so the worker plays its copy on to it and searches while the
 *    turns animate. Not while an Overdrive picker is pending: the player's input decides that one,
 *    and the search starts after it, at the re-submit.
 *  - **at a battle's or a link's start** (`boardFixed`, after `init`), for the first menu.
 *  - **at menu open** when neither of those left a search for this board (a menu re-opened after
 *    backing out of an Overdrive picker). Its answer cannot reach this menu's card; it serves the
 *    same board if it opens again before the search is cancelled.
 *
 * Cancelled when the menu closes (its board is gone once the command is pressed), when a newer
 * board is fixed, at `dispose`, and by the time cap (the worker's own, and a terminate here a
 * second later if the worker stops answering).
 *
 * Game case: FFX only (`./wiring.ts` attaches it to FFX battles only).
 */

import type { AvailableCommand, BattleState, CombatantId } from '../../battle/common/types.ts';
import type { FFXEngine } from '../../battle/ffx/index.ts';
import type { AdvisorView } from '../../engine/tactics/advisor.ts';
import { boardKey } from '../../engine/tactics/advisor-v4/key.ts';
import type { BudgetName } from '../../engine/tactics/advisor-v4/presets.ts';
import type { FromWorker, SearchStats, ToWorker } from './protocol.ts';

/** What the host needs of a worker (a real `Worker`, or the tests' in-process fake). */
export interface WorkerLike {
  postMessage(msg: ToWorker): void;
  terminate(): void;
  onmessage: ((e: { data: FromWorker }) => void) | null;
  onerror?: ((e: unknown) => void) | null;
}

export interface HostOptions {
  spawn(): WorkerLike | null;
  budget: BudgetName;
  capMs: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
}

/** The measurements the browser timing reads (`window.__pyreflyAdvisorV4.stats`). */
export interface HostStats {
  budget: BudgetName;
  jobs: number;
  results: number;
  /** Menus opened, and how many found their board's answer ready. */
  opened: number;
  ready: number;
  /** Menus whose card showed a v4 switch. */
  shownSwitched: number;
  none: Record<string, number>;
  /** Host-side kills of a worker that stopped answering. */
  killed: number;
  /** Main-thread ms spent handing the copy to the worker, per job. */
  postMs: number[];
  /** Main-thread ms of `cardFor` at menu open. */
  cardForMs: number[];
  /** Wall ms from a job's start to its answer arriving. */
  answerMs: number[];
  /** For ready menus: ms the answer had been waiting; for the others: ms the job had run. */
  leadMs: number[];
  lagMs: number[];
  /** The worker's own breakdown, per answer. */
  worker: SearchStats[];
}

interface Running {
  job: number;
  startedAt: number;
  timer: unknown;
}

interface Done {
  key: string;
  view: AdvisorView | null;
  switched: boolean;
  at: number;
}

/** Seconds the host gives a silent worker past its own cap before terminating it. */
const GRACE_MS = 1_000;
/** Answers kept (the last few boards). */
const KEEP = 4;

export class AdvisorV4Host {
  private worker: WorkerLike | null = null;
  private job = 0;
  private running: Running | null = null;
  private readonly done: Done[] = [];
  private engine: FFXEngine | null = null;
  private disposed = false;
  readonly stats: HostStats;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (t: unknown) => void;

  constructor(private readonly opts: HostOptions) {
    this.now = opts.now ?? (() => performance.now());
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>));
    this.stats = {
      budget: opts.budget, jobs: 0, results: 0, opened: 0, ready: 0, shownSwitched: 0, none: {}, killed: 0,
      postMs: [], cardForMs: [], answerMs: [], leadMs: [], lagMs: [], worker: [],
    };
  }

  /** The live battle this host copies from (read only: `transferable`). */
  bind(engine: FFXEngine): void {
    this.engine = engine;
  }

  /** The next board is fixed (after a press, a battle's or a link's start): search it now. */
  boardFixed(): void {
    if (this.disposed || !this.engine) return;
    this.cancelRunning();
    this.start(this.engine);
  }

  /**
   * The menu opened on this board: its finished card, or `null` (then the card is v3's). Called
   * once per menu, by `MoveAdvisor.compute`.
   */
  cardFor(state: Readonly<BattleState>, decision: { actorId: CombatantId; commands: readonly AvailableCommand[] }): AdvisorView | null {
    const t0 = this.now();
    const key = boardKey(state, decision.actorId, decision.commands);
    this.stats.opened += 1;
    const hit = this.done.find((d) => d.key === key) ?? null;
    if (hit) {
      this.stats.ready += 1;
      if (hit.switched) this.stats.shownSwitched += 1;
      this.stats.leadMs.push(t0 - hit.at);
    } else {
      if (this.running) this.stats.lagMs.push(t0 - this.running.startedAt);
      else if (this.engine && !this.disposed) this.start(this.engine);
    }
    this.stats.cardForMs.push(this.now() - t0);
    return hit?.view ?? null;
  }

  /** The menu closed: its board is gone, so the search for it stops. */
  closed(): void {
    this.cancelRunning();
  }

  dispose(): void {
    this.disposed = true;
    this.cancelRunning();
    this.worker?.terminate();
    this.worker = null;
  }

  private ensureWorker(): WorkerLike | null {
    if (this.worker) return this.worker;
    const w = this.opts.spawn();
    if (!w) return null;
    w.onmessage = (e) => this.onAnswer(e.data);
    if ('onerror' in w) w.onerror = () => this.kill('error');
    this.worker = w;
    return w;
  }

  private start(engine: FFXEngine): void {
    const w = this.ensureWorker();
    if (!w) return;
    const job = ++this.job;
    const t0 = this.now();
    try {
      w.postMessage({ type: 'search', job, snapshot: engine.transferable(), budget: this.opts.budget, capMs: this.opts.capMs, advance: true });
    } catch (err) {
      // A copy that cannot be made is a card v3 answers; the battle never notices.
      console.warn('[advisor-v4] the search could not start', err);
      this.count('error');
      return;
    }
    this.stats.postMs.push(this.now() - t0);
    this.stats.jobs += 1;
    const timer = this.setTimer(() => this.kill('timeout'), this.opts.capMs + GRACE_MS);
    this.running = { job, startedAt: t0, timer };
  }

  private cancelRunning(): void {
    if (!this.running) return;
    this.clearTimer(this.running.timer);
    this.worker?.postMessage({ type: 'cancel', job: this.running.job });
    this.running = null;
  }

  /** A worker that stopped answering: terminated, and a fresh one spawned for the next job. */
  private kill(reason: string): void {
    if (this.running) this.clearTimer(this.running.timer);
    this.running = null;
    this.worker?.terminate();
    this.worker = null;
    this.stats.killed += 1;
    this.count(reason);
  }

  private count(reason: string): void {
    this.stats.none[reason] = (this.stats.none[reason] ?? 0) + 1;
  }

  private onAnswer(msg: FromWorker): void {
    const current = this.running?.job === msg.job ? this.running : null;
    if (current) {
      this.clearTimer(current.timer);
      this.running = null;
      this.stats.answerMs.push(this.now() - current.startedAt);
    }
    if (msg.type === 'none') {
      this.count(msg.reason);
      if (msg.reason === 'error') console.warn('[advisor-v4] the search failed', msg.message);
      return;
    }
    this.stats.worker.push(msg.stats);
    // An answer for a job that was cancelled or superseded is not for the board in front of anyone.
    if (!current) return;
    this.stats.results += 1;
    this.done.unshift({ key: msg.key, view: msg.view, switched: msg.switched, at: this.now() });
    this.done.length = Math.min(this.done.length, KEEP);
  }
}
