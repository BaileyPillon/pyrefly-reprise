/**
 * The **Active ATB pump**: the presenter's side of FFX-2's running clock.
 *
 * `BattlePresenter` parks on `HudPort.chooseCommand` in its `'player-input'`
 * branch. Under **Wait** — the default since Bailey's D-029 (2026-09-22, *"I
 * want the default to be wait mode instead of active mode please"*) — the
 * gauges stand still for as long as a player reads the menu, as they did before
 * Active existed (`critic/rounds/round-05.md` PR-0046, ticks 8189 → 8189 over
 * 2013 ms with the Chapter 4 menu open). Under **Active** (D-009's build) this
 * pump hands the engine **real elapsed time**, one clamped step at a time. The
 * pump runs for every FFX-2 menu and asks the mode each step (property 7), so
 * the pause menu's X-2 BATTLE row lands on the very next step either way.
 *
 * **Shared plumbing, inert for FFX** (AGENTS.md rule 14 / CHK-020): one
 * presenter serves both engines, and the pump only runs for an engine that
 * offers `tick` *and* `inputValid`. FFX's engine offers neither, so its input
 * branch is byte-for-byte what it was — `tests/unit/ffx-no-active-clock.test.ts`
 * is the absence test.
 *
 * Six properties the shape below buys, each of which would otherwise be a
 * defect (`docs/plans/ffx2-active-atb-review.md` §4.5; the sixth is
 * `docs/plans/ffx2-active-menu-review.md` §4):
 *
 * 1. **Pause freezes the ATB.** The wait is the presenter's `baseSleep`, which
 *    is `BattleScreen.pauseGate` — it parks while the overlay is up. No new
 *    pause plumbing, and no ATB burned behind a pause menu.
 * 2. **`fast` and `skip` do not distort the game clock.** `dt` is read from a
 *    real clock, never from `PUMP_MS`, and the wait is `baseSleep` rather than
 *    the speed-scaled `sleep`. Under `'skip'` the waits collapse to zero, so
 *    almost no wall-clock time passes and an e2e or critic capture consumes
 *    almost no ATB.
 * 3. **A hidden tab cannot wipe the party.** `MAX_STEP_MS` clamps a throttled
 *    timer or a long GC pause; without it, ten seconds in another tab would
 *    arrive as ten seconds of enemy turns in one step.
 * 4. **Ordering stays exact at any pump period.** `FFX2Engine.tick` sub-steps
 *    to the next scheduled event, so `PUMP_MS` changes only how smoothly the
 *    bars move and how promptly an enemy action interrupts — never the order
 *    and never the outcome.
 * 5. **An animation does not pay the clock**, which is §1.5's "Automatic Wait"
 *    reached structurally rather than by authoring a list of animations: `play`
 *    is awaited inside the loop and `last` is **reset after it returns**, so
 *    the animation's own duration is never handed to the engine. Getting that
 *    one line wrong silently doubles the difficulty of both chapters.
 * 6. **An open menu keeps its owner.** The pump never hands the menu to a
 *    different girl: it stops only when the menu settles or its owner can no
 *    longer answer at all, and a chain lock is not that (see {@link PumpStop}).
 *    FFX-2 only; `tests/unit/ffx2-active-menu.test.ts` pins it through the
 *    real presenter.
 * 7. **Wait hands the engine nothing, and a flip lands on the open menu.**
 *    {@link runMenuClock} parks a Wait menu on "answered, or the mode changed"
 *    — no pump, no spin, no `tick` — and a pump whose engine is switched to
 *    Wait mid-menu (the pause's X-2 BATTLE row) stops at its next step without
 *    calling `tick`, returning `'held'`. The pause-close hook wakes a parked
 *    menu (`BattlePresenter.atbModeChanged`), so a flip to ACTIVE runs the
 *    clock under the menu that was open under the pause, not only from the
 *    next one (the Wait-mode verifier's ch. 4 seed 3 capture). Nothing read in
 *    Wait is ever banked: a pump's first step measures from its own start. The
 *    engine refuses a Wait tick under a menu on its own as well
 *    (`src/battle/ffx2/active.ts` `clockHeldByMenu`). The HUD's mode chip is
 *    told the mode at every one of these transitions (`HudPort.setAtbMode`).
 *    `tests/unit/ffx2-wait-mode.test.ts`, `ffx2-wait-mode-repair.test.ts`;
 *    `docs/plans/ffx2-wait-mode-review.md` §4.
 * 8. **Wait's split (§1.5): the top list runs, a submenu holds.** Under Wait
 *    the engine's own `clockHeld()` decides, not the mode: the HUD reports the
 *    cursor's level (`HudPort.onMenuLevel`), the presenter tells the engine and
 *    wakes a parked menu, and the pump runs at the top list exactly as it runs
 *    under Active. A menu nobody reports on stays held. Going deeper mid-step
 *    drops at most one step (<= {@link PUMP_MS}) of top-list time; nothing is
 *    banked. And the pause's own time is never handed over: the pause-close hook
 *    bumps an epoch, and a step that spans one ticks nothing (it used to hand
 *    over the {@link MAX_STEP_MS} clamp, a leak the split makes reachable under
 *    Wait). `tests/unit/ffx2-wait-split-presenter.test.ts`;
 *    `docs/plans/ffx2-wait-split-review.md`.
 */

import type { AtbSnapshot, BattleEvent, CombatantId, Command } from '../battle/common/types.ts';
import type { PlayResult } from './BattlePresenterPorts.ts';

/**
 * AUTHORED (presentation only, not game data — hard rule 6). 20 Hz: enough for
 * a bar that also carries a ~100 ms CSS transition, cheap enough that one
 * snapshot and two row renders per step are invisible in a frame budget.
 */
export const PUMP_MS = 50;

/**
 * AUTHORED (presentation only). The largest jump a hidden tab, a GC pause or a
 * slow art load may hand the engine in one go. Neither constant can change an
 * outcome — see property 4 above.
 */
export const MAX_STEP_MS = 250;

/** The slice of the FFX-2 engine the pump needs, structurally. */
export interface ActiveClockEngine {
  tick(ms: number, opts?: { throughInput?: boolean }): BattleEvent[];
  inputValid(actorId: CombatantId): boolean;
  gaugeSnapshot(): AtbSnapshot;
  /**
   * FFX-2's Config ATB mode (§1.5). Optional: an engine without it reads as
   * `'active'`, the pump exactly as it was before Wait existed.
   */
  atbMode?(): 'wait' | 'active';
  /**
   * Whether an open menu holds the clock right now: the engine's one truth
   * (Wait, and with the split only below the top list). Optional: an engine
   * without it reads as "held whenever the mode is Wait", the pre-split rule.
   */
  clockHeld?(): boolean;
  /** Where the open menu's cursor is, from the HUD (`HudPort.onMenuLevel`). */
  setMenuLevel?(level: 'top' | 'deep'): void;
}

/**
 * An engine that runs an Active clock **for the menu opening now**, or `null`.
 *
 * This is the FFX/FFX-2 fork for the whole feature, in one place: FFX has no
 * `tick` at all, so its input branch never starts a pump. Asked once per menu,
 * so it is also the Wait fork (D-029): an FFX-2 engine in Wait holds its clock
 * while the menu is open, there is nothing to pump, and the presenter takes the
 * plain pre-Active path. (A pump that only idled would spin on an unscaled
 * sleep that resolves at once — the `'skip'` speed, every test double.) A flip
 * to Active in the pause lands from the next menu; a flip to Wait lands on the
 * very next pump step (property 7).
 */
export function activeClockEngine(engine: unknown): ActiveClockEngine | null {
  const e = clockEngine(engine);
  return e && modeOf(e) === 'active' ? e : null;
}

/**
 * An engine that **has** an ATB clock (FFX-2), whatever its mode, or `null`
 * (FFX: no `tick`, so its input branch is byte-for-byte the pre-Active one).
 */
export function clockEngine(engine: unknown): ActiveClockEngine | null {
  const e = engine as Partial<ActiveClockEngine> | null;
  if (!e || typeof e.tick !== 'function' || typeof e.inputValid !== 'function') return null;
  if (typeof e.gaugeSnapshot !== 'function') return null;
  return e as ActiveClockEngine;
}

/** The engine's Config ATB mode; an engine without `atbMode` reads as Active. */
export function modeOf(engine: ActiveClockEngine): 'wait' | 'active' {
  return engine.atbMode?.() === 'wait' ? 'wait' : 'active';
}

/** Whether the open menu holds the clock (property 8); the mode alone for an engine that cannot say. */
export function clockHeldNow(engine: ActiveClockEngine): boolean {
  return engine.clockHeld ? engine.clockHeld() : modeOf(engine) === 'wait';
}

/** Why the pump stopped. */
export type PumpStop =
  /** The menu settled (a command was picked, or the loop was abandoned). */
  | 'settled'
  /**
   * The owner can no longer answer: KO, Stop, Sleep, Petrify, Berserk, battle
   * over. **Not** a §1.7 chain lock (critic round 08 PR-0080): a chained girl
   * keeps her menu, the next ready girl waits behind her in the ATB rows, and a
   * command she confirms while chained is held by the engine and fires as her
   * when the window closes (`src/battle/ffx2/active.ts` `ownsInput`,
   * `HeldCommand`). Tearing the menu down there replaced her list in place with
   * somebody else's in 262 ms, cursor on row 0, no keypress.
   */
  | 'invalidated'
  /**
   * The clock holds from here, the menu still open and still hers: the engine
   * was switched to **Wait** under it (property 7), or the cursor went below
   * the top list under Wait's split (property 8).
   */
  | 'held';

export interface ActivePumpDeps {
  engine: ActiveClockEngine;
  /** Whose menu is open. */
  actorId: CombatantId;
  /** True once the menu promise has settled; the pump stops asking. */
  settled: () => boolean;
  /** True once the presenter has been torn down. */
  aborted: () => boolean;
  /** The presenter's **unscaled** sleep — the pause gate. */
  sleep: (ms: number) => Promise<void>;
  /** Real elapsed time. Tests inject a fake clock. */
  now: () => number;
  /** The presenter's own `play`, so an enemy turn animates exactly as it does elsewhere. */
  play: (events: BattleEvent[]) => Promise<PlayResult>;
  /** Cheap gauge-only HUD refresh (never a full `sync`, which re-predicts intent). */
  syncGauges: (snapshot: AtbSnapshot) => void;
  /**
   * Bumped by the pause-close hook (`BattlePresenter.atbModeChanged`). A step
   * whose wait spans a change ticks nothing (property 8). Optional: without it
   * a pause hands over at most {@link MAX_STEP_MS}, as before.
   */
  epoch?: () => number;
}

/**
 * Run the clock for as long as the command menu is open.
 *
 * Serialised on purpose: no second step starts inside `play`, so events never
 * interleave and the event log stays the single ordered truth.
 */
export async function runActivePump(deps: ActivePumpDeps): Promise<PumpStop> {
  let last = deps.now();

  for (;;) {
    if (deps.settled() || deps.aborted()) return 'settled';
    const epoch = deps.epoch?.();
    await deps.sleep(PUMP_MS);
    if (deps.settled() || deps.aborted()) return 'settled';

    // Properties 7 and 8: switched to Wait mid-menu (D-029), or below the top
    // list under Wait's split — the clock holds from here.
    if (clockHeldNow(deps.engine)) return 'held';

    // Property 8: the wait spanned a pause. Its time is not the fight's.
    if (deps.epoch && deps.epoch() !== epoch) {
      last = deps.now();
      continue;
    }

    const at = deps.now();
    const dt = Math.min(Math.max(0, at - last), MAX_STEP_MS);
    last = at;

    const events = deps.engine.tick(dt, { throughInput: true });
    if (events.length > 0) {
      await deps.play(events);
      // Property 5. Measured from *after* the animation, never through it.
      last = deps.now();
      if (deps.aborted()) return 'settled';
    } else {
      deps.syncGauges(deps.engine.gaugeSnapshot());
    }

    // A command that arrived while we were playing ends the pump — but
    // `'settled'` here means only "stop the clock", never "this command is
    // good". The burst we just played may have KO'd, Stopped or chained the
    // menu's owner in the very step that delivered her answer, and submitting
    // it then used to execute her command as a *different* girl (wave-1a
    // verifier, ch. 4 seed 7: `rikku:Power Break`). The caller re-checks
    // `inputValid` before it submits, and `FFX2Engine.submit` refuses an owner
    // who cannot act — this loop deliberately does not decide that here, so a
    // command and an invalidation racing in the same step can only ever end in
    // a refusal, never in a stolen turn.
    if (deps.settled()) return 'settled';
    if (!deps.engine.inputValid(deps.actorId)) return 'invalidated';
  }
}

export interface MenuClockDeps extends ActivePumpDeps {
  /** The menu's own answer (the HUD raced against the auto-play interrupt). */
  decided: Promise<Command>;
  /**
   * Resolves the next time the clock may have to start: the Config mode may
   * have changed (the pause closing, `BattlePresenter.atbModeChanged`), the
   * cursor came back to the top list (property 8), or the presenter is torn down.
   */
  modeChanged: () => Promise<void>;
  /** Tell the HUD's mode chip the truth (`HudPort.setAtbMode`). Never throws. */
  showMode: (mode: 'wait' | 'active') => void;
}

/** How an FFX-2 menu ended: an answer, or the pump's reason for stopping. */
export type MenuClockOutcome =
  /** `ran`: the clock ran under this menu at some point (Active, before or after a flip). */
  | { readonly command: Command; readonly ran: boolean }
  | { readonly stop: Exclude<PumpStop, 'held'> };

/**
 * The clock under one open FFX-2 command menu, in **either** Config mode, for
 * as long as it is open (property 7).
 *
 * - **Wait**: nothing ticks. The menu waits on its answer or on a mode change,
 *   whichever comes first — never on a spin (an idle pump on the presenter's
 *   unscaled sleep would resolve at once under `'skip'` and in every test
 *   double, and hung the suite once).
 * - **Active**: {@link runActivePump}, exactly as before.
 * - A flip either way under the open menu lands at once on that same menu, and
 *   the menu keeps its owner (property 6): nothing here re-asks anyone.
 */
export async function runMenuClock(deps: MenuClockDeps): Promise<MenuClockOutcome> {
  let ran = false;
  const answered = deps.decided.then((command) => ({ command }) as const);
  for (;;) {
    deps.showMode(modeOf(deps.engine));
    if (clockHeldNow(deps.engine)) {
      const woke = await Promise.race([answered, deps.modeChanged().then(() => null)]);
      if (woke) return { command: woke.command, ran };
      if (deps.aborted()) return { stop: 'settled' };
      if (deps.settled()) return { stop: 'settled' };
      continue;
    }
    ran = true;
    // Refresh the bars as the clock starts, so a pause flip shows at once.
    deps.syncGauges(deps.engine.gaugeSnapshot());
    const outcome = await Promise.race([answered, runActivePump(deps).then((stop) => ({ stop }) as const)]);
    if ('command' in outcome) return { command: outcome.command, ran };
    if (outcome.stop !== 'held') return { stop: outcome.stop };
  }
}

/**
 * Wire the HUD's menu-level reports to the engine for one FFX-2 menu (property
 * 8): each report is handed to the engine, then the waker restarts a parked
 * menu so the clock can start the moment the cursor is back on the top list.
 * Returns the menu's teardown: unsubscribe, and forget the waker's parked
 * menu. A HUD without `onMenuLevel` leaves the menu held, and FFX (no clock
 * engine, `null`) only gets the teardown. Call it **before**
 * `HudPort.chooseCommand`, whose first render reports `'top'`.
 */
export function followMenuLevel(
  hud: { onMenuLevel?(listener: (level: 'top' | 'deep') => void): () => void } | undefined,
  engine: ActiveClockEngine | null,
  waker: MenuWaker,
): () => void {
  const done = (off: () => void) => (): void => {
    off();
    waker.clear();
  };
  if (!hud?.onMenuLevel || !engine?.setMenuLevel) return done(() => undefined);
  try {
    return done(
      hud.onMenuLevel((level) => {
        engine.setMenuLevel?.(level);
        waker.wake();
      }),
    );
  } catch (err) {
    console.warn('[presenter] HUD onMenuLevel threw', err);
    return done(() => undefined);
  }
}

/**
 * Parks an FFX-2 menu in {@link runMenuClock} and wakes it: on a menu-level
 * report ({@link followMenuLevel}), and on every pause close ({@link resumed},
 * which also bumps the {@link epoch} that stops a pump step spanning the pause
 * from handing its time to the clock, property 8). One per presenter.
 */
export class MenuWaker {
  /** Bumped at every pause close (`ActivePumpDeps.epoch`). */
  epoch = 0;
  private wakeFn: (() => void) | null = null;

  /** Resolves at the next {@link wake} (`MenuClockDeps.modeChanged`). */
  park(): Promise<void> {
    return new Promise<void>((wake) => (this.wakeFn = wake));
  }

  /** Restart a parked menu, if one is. */
  wake(): void {
    const wake = this.wakeFn;
    this.wakeFn = null;
    wake?.();
  }

  /** The pause closed (the Config mode may have changed): bump the epoch, then wake. */
  resumed(): void {
    this.epoch += 1;
    this.wake();
  }

  /** The menu is over; forget its waker without calling it. */
  clear(): void {
    this.wakeFn = null;
  }
}
