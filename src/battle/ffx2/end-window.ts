/**
 * The battle-end commit window (re-parity RC8, lane X2-K, row XK2; **FFX-2 only**).
 *
 * The game does not end a fight the moment its evaluation says so. The evaluation runs every logic step; the first non-zero answer closes every command menu and
 * opens a window in which the commands already QUEUED run out; only when no queue and no magic execution is left is the evaluation made once more, and a
 * non-zero answer then is committed (the result byte is set, what never started is dropped and refunded), while a zero answer (a revive or Auto-Life landed inside the
 * window) cancels the end and the battle goes on. `kernel/battle-end-commit.ts` is that machine; this class drives it for the engine.
 *
 * What the engine does inside the window: no menu is offered and no enemy script is polled (nothing new is queued), a cast on the purple bar keeps counting down and
 * fires, a command held for a chain lock fires, and the result is built when the machine commits. A unit whose owner is asleep, petrified or Stopped does not hold the
 * window (the game's own exclusion). **A safety cap** ends a window that has run for {@link END_DRAIN_CAP_STEPS} logic steps (about two minutes) by dropping what is
 * left: it is an engine guard against a hang, not a game number, and the measurement counts the times it is reached (expected: never).
 *
 * The kernel's result code is mapped onto the engine's outcome in `adapt/battle-end.ts`. Draws: none.
 */

import type { BattleState } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { EndCallee, EndPhase, commitStep, newEndMachine, type EndMachine } from './kernel/battle-end-commit.ts';
import { evaluateEnd, inFlightSides, newEndBuffers, queuedWork, runningWork } from './adapt/battle-end.ts';

/** A window that has stayed open this many logic steps (3,600 is two minutes at 29.97 a second) is closed by force. */
export const END_DRAIN_CAP_STEPS = 3600;

/** What the engine counts about its windows (read by the measurement; not part of any shared contract). */
export interface EndWindowStats {
  /** Ends evaluated non-zero while the fight was running: the window opened. */
  opened: number;
  /** Windows that closed by the end lapsing (a revive or Auto-Life landed inside it). */
  lapsed: number;
  /** Windows that committed the end. */
  committed: number;
  /** The logic steps the committed windows stayed open, summed, and the longest one. */
  waitedSteps: number;
  maxWaited: number;
  /** Casts in flight at the moment each window opened, by side. */
  inFlight: { party: number; enemy: number };
  /** The windows closed by the safety cap. */
  capped: number;
  /** The last result code committed. */
  lastCode: number;
}

/** What one pass of the window needs from the engine. */
export interface EndEnv {
  units: readonly Ffx2Unit[];
  state: BattleState;
  /** The battle's logic step counter. */
  ticks: number;
  /** A confirmed command is held back for a chain lock. */
  held: boolean;
  /** A timed-input overlay is suspended on a command. */
  awaiting: boolean;
  /** Close this unit's open command menu (the game's `0x634010`). */
  closeMenu(unit: Ffx2Unit): void;
  /** Drop every cast that never started or never finished, with refunds (the game's `0x62c5c0`). */
  dropQueued(): void;
}

export class EndWindow {
  machine: EndMachine = newEndMachine();
  stats: EndWindowStats = { opened: 0, lapsed: 0, committed: 0, waitedSteps: 0, maxWaited: 0, inFlight: { party: 0, enemy: 0 }, capped: 0, lastCode: 0 };
  private openedAt = 0;
  private readonly buf = newEndBuffers();

  /** Is a window open (the end evaluated, not yet committed or lapsed)? */
  get open(): boolean {
    return this.machine.phase !== EndPhase.Running;
  }

  /** A copy for a forked engine (the advisor's look-ahead). */
  clone(): EndWindow {
    const c = new EndWindow();
    c.machine = { ...this.machine };
    c.stats = { ...this.stats, inFlight: { ...this.stats.inFlight } };
    c.openedAt = this.openedAt;
    return c;
  }

  /**
   * One pass of the post-battle machine (the engine calls it after every logic step and every action). Returns the committed result code (1 to 4), or 0 while the
   * fight goes on or the window is still draining.
   */
  pass(env: EndEnv): number {
    const m = this.machine;
    const before = m.phase;
    m.stepEval = evaluateEnd(env.units, env.state, m.result, this.buf) & 0xff;
    const forced = this.open && env.ticks - this.openedAt > END_DRAIN_CAP_STEPS;
    commitStep(m, (address, ...args) => {
      switch (address) {
        case EndCallee.closeMenu: {
          const unit = env.units.find((u) => u.gauge.slot === args[0]);
          if (unit !== undefined) env.closeMenu(unit);
          return 0;
        }
        case EndCallee.queueCount:
          return forced ? 0 : queuedWork(env.units, env.held, env.awaiting);
        case EndCallee.magicRunning:
          return forced ? 0 : runningWork(env.units);
        case EndCallee.evaluate:
          return evaluateEnd(env.units, env.state, m.result, this.buf);
        case EndCallee.dropQueued:
          env.dropQueued();
          return 0;
        default:
          return 0; // the script jobs, the selection byte, script event 4 and the rest are presentation
      }
    });
    if (before === EndPhase.Running && m.phase !== EndPhase.Running) {
      this.stats.opened += 1;
      this.openedAt = env.ticks;
      const sides = inFlightSides(env.units);
      this.stats.inFlight.party += sides.party;
      this.stats.inFlight.enemy += sides.enemy;
    }
    if (before === EndPhase.Draining && m.phase === EndPhase.Running) this.stats.lapsed += 1;
    if (m.phase >= EndPhase.Commit && m.phase < 0x80) {
      this.stats.committed += 1;
      const waited = Math.max(0, env.ticks - this.openedAt);
      this.stats.waitedSteps += waited;
      this.stats.maxWaited = Math.max(this.stats.maxWaited, waited);
      if (forced) this.stats.capped += 1;
      this.stats.lastCode = m.result;
      return m.result;
    }
    return 0;
  }
}
