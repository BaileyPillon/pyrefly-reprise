/**
 * The mid-battle cutscene runner, wired to the live battle stage.
 *
 * `MidBattleTrigger`s are the beats that make an encounter a scene rather than
 * a stat check — Seymour naming what he did to the Ronso, Yunalesca answering a
 * refusal — and every one of them was dead content: the presenter paused on a
 * `script-trigger`, found no runner, logged a line and carried on.
 *
 * Two things were in the way. `CutsceneRunner` exposes **`run(script)`**, not
 * the `play()` the presenter's port asks for, so the duck-type check never
 * matched it; and it takes a `CutscenePorts` bundle that nobody constructed.
 * This module supplies both: the adapter, and ports backed by the battle that
 * is already on screen — the same camera rigs, actors, VFX and audio the
 * presenter drives, plus `ui/common`'s dialogue box over the top.
 *
 * Pre- and post-battle scripts do **not** come through here: those are a whole
 * screen (`CutsceneScreen`, registered by `ui/common` through
 * `registerFlowScreens`), with their own staging and letterboxing.
 *
 * ## A mid-battle beat is not a cutscene
 *
 * This is the whole difference, and getting it wrong is what produced the
 * Bahamut capture with thirty seconds of empty screen:
 *
 * - **The HUD stays up.** A beat interrupts a fight the player is still in the
 *   middle of; the CTB list, the party bars and the enemy's charge state are
 *   the context the line is *about*. The scene dims, it does not disappear —
 *   the same 35% the shop and the FFX-2 Switch strip use over a live scene
 *   [`research/visual-bible.md` §3.3, §3.14]. The only place the bible authors
 *   the HUD sliding off is the Overdrive overlay (§3.11.0), which is not this.
 *   The dimming is `.battle-midbeat` in `ui/common/cutscene.css`; the presenter
 *   no longer calls `HudPort.setVisible(false)` at all.
 * - **The line still shows, and it still ends.** Under auto-battle nobody
 *   presses Confirm, so every line is given an `auto` it may not have been
 *   written with ({@link MID_LINE_HOLD_MS}) and is raced against its own
 *   deadline, rather than swapped for a silent no-op port that showed the
 *   player nothing.
 * - **The beat is capped.** {@link midBattleDeadlineMs} — eight seconds for a
 *   beat, a seam's own authored length for a seam. On an overrun the runner is
 *   skipped (which really ends it, rather than leaving it playing behind a
 *   presenter that has given up on it) and one line is logged per script name.
 *
 * `'skip'` playback is the one case that still shows nothing: there is no
 * viewer, and an e2e chapter run cannot afford eight seconds a beat.
 *
 * ## Two clocks, and which one the budget is on
 *
 * A beat's animations run on **scene time**: `BattleCamera.moveTo` tweens
 * through `update(dt)`, and `App` clamps `dt` at `1/20 s`, so a
 * `camera('action', 400)` needs at least eight rendered frames however long
 * those frames take. The budget used to be plain wall clock, so under
 * SwiftShader (the gallery, the sweep, CI) an authored 400 ms move could cost
 * seconds of real time and the beat lost a race it was never given a fair shot
 * at — three of the five chapters logged an overrun on every automated run.
 *
 * So the budget is spent out of the same clock the animation is: `update(dt)`
 * ticks it ({@link MidBattleCutscenes.update}). Wall clock only comes back as a
 * **stall guard** — if no frame has arrived for {@link FRAME_STALL_MS} the loop
 * has stopped underneath the beat (a paused capture, a backgrounded tab) and
 * scene time will never advance again, so the wall-clock reading is allowed to
 * end it rather than wedge the fight.
 *
 * Under `'skip'` there is no budget at all, because there is nothing to
 * outrun: the runner is put in {@link CutsceneRunner.setInstant}, every wait
 * collapses to zero and every camera move lands as a snap.
 */

import type { NarrateStep, SayStep, StoryScript } from '../../story/dsl.ts';
import {
  createNoopDialoguePort,
  CutsceneRunner,
  type CutscenePorts,
  type DialoguePort,
} from '../../story/runner/CutsceneRunner.ts';
import { MID_LINE_HOLD_MS, midBattleDeadlineMs } from '../../story/registry.ts';
import { fadeMsToSec } from '../../audio/AudioManager.ts';
import { DialogueBox } from '../../ui/common/DialogueBox.ts';
import { typingDurationMs } from '../../ui/common/typewriter.ts';
import '../../ui/common/cutscene.css';
import type { BattleStage, CutsceneRunnerPort } from '../../engine/BattlePresenterPorts.ts';
import type { AudioPort } from '../../engine/BattlePresenterPorts.ts';
import type { InputSnapshot } from '../Input.ts';

export interface MidBattleCutsceneOptions {
  /** Where the dialogue box mounts. The battle screen's root. */
  root: HTMLElement;
  /** The live field, for camera moves, actor poses and VFX. */
  stage: BattleStage;
  audio?: AudioPort | null;
  /** `SaveData.settings.textSpeed`. */
  textSpeed?: number;
  /**
   * Wall-clock sleep hook, so a skipped or fast-forwarded battle stays
   * responsive and a test can own the clock.
   *
   * Only ever used for real time: the beat's own budget is spent in scene time
   * (see the module header), and under `'skip'` every wait collapses to zero
   * before it reaches this at all.
   */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * A runner the presenter can use, plus the per-frame hooks the dialogue box
 * needs. The battle screen owns the lifetime and forwards `update`/`handleInput`.
 */
export interface MidBattleCutscenes extends CutsceneRunnerPort {
  update(dt: number): void;
  handleInput(input: InputSnapshot): void;
  /** Fast-forward the line in flight. */
  skip(): void;
  /**
   * Advance lines without input, for a run with no human in it.
   *
   * `instant` is the `'skip'` playback speed: resolve everything at once and
   * show nothing. Without it the beat still plays, and still reads, on its own
   * timer — which is what an auto-battle capture or a hands-off demo wants.
   */
  setAutoAdvance(on: boolean, opts?: { instant?: boolean }): void;
  dispose(): void;
}

const sleepMs = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, Math.max(0, ms)));

/**
 * Class on the battle root while a beat plays. Dims the HUD; see
 * `ui/common/cutscene.css`.
 */
export const MIDBEAT_CLASS = 'battle-midbeat';

/**
 * Slack over a line's own typing-plus-hold before the beat stops waiting on it.
 *
 * The dialogue box advances itself from `update(dt)`, so a line can only
 * outlast this if the frame loop has stopped underneath it (a stalled capture,
 * a backgrounded tab). Then the beat moves on rather than eating the whole
 * script budget on one line.
 */
export const LINE_GRACE_MS = 600;

/**
 * Real time with no `update(dt)` at all before a scene-time budget gives up on
 * the frame loop and lets the wall clock end the beat.
 *
 * Generous next to a frame: even SwiftShader on the five-chapter sweep renders
 * well inside this, so it only ever fires for a loop that has genuinely
 * stopped (`App.stop()` mid-capture, a backgrounded tab). Without it a beat
 * whose budget is scene time could never end at all once the frames stop, and
 * a beat must never be able to wedge a battle.
 */
export const FRAME_STALL_MS = 500;

/** Script names already logged for an overrun, so a repeating trigger logs once. */
const overrunLogged = new Set<string>();

/** Test hook: forget which overruns have been logged. */
export function resetMidBattleOverrunLog(): void {
  overrunLogged.clear();
}

/**
 * Build the runner. Never throws: a chapter whose script names an actor that
 * is not on the field simply skips that step rather than stopping the battle.
 */
export function createMidBattleCutscenes(opts: MidBattleCutsceneOptions): MidBattleCutscenes {
  const realWait = opts.sleep ?? sleepMs;
  const box = new DialogueBox({
    root: opts.root,
    ...(opts.textSpeed !== undefined ? { textSpeed: opts.textSpeed } : {}),
  });
  box.mount();
  // The box only belongs on screen while a beat is actually playing.
  box.el.hidden = true;

  /**
   * Which dialogue port the runner talks to.
   *
   * - `manual`: the box, waiting on Confirm or on the line's own `auto`.
   * - `auto`: the box, but no line may wait on input — every one gets an
   *   `auto` (its own, or {@link MID_LINE_HOLD_MS}) and its own deadline. This
   *   is auto-battle and the screenshot captures: there is a viewer, there is
   *   just nobody at the controller.
   * - `instant`: the no-op port. `'skip'` playback, where every animation wait
   *   collapses to zero and an e2e chapter has to finish inside its budget.
   *
   * `instant` used to be what *both* automated modes did, which is why an
   * automated Bahamut run showed no dialogue at all — and, with the HUD hidden
   * for the beat as well, no UI whatsoever.
   */
  const noop = createNoopDialoguePort();
  let mode: 'manual' | 'auto' | 'instant' = 'manual';

  /**
   * Every wait the beat itself takes — a `wait` step, a line's deadline, the
   * budget's stall guard — collapsed to nothing under `'skip'`.
   *
   * This is the half of the fix the screen cannot do for itself: the screen
   * injects a clock at construction, but the playback speed changes later
   * (`BattlePresenter.setSpeed`), so the collapse has to live where the mode
   * does.
   */
  const wait = (ms: number): Promise<void> => (mode === 'instant' ? Promise.resolve() : realWait(ms));

  /** `0` while `'skip'` is on, so a tween lands instead of playing. */
  const animMs = (ms: number): number => (mode === 'instant' ? 0 : ms);

  /**
   * Await an animation, unless `'skip'` is on — then the end state has already
   * been applied and waiting on a tween would cost the run rendered frames.
   */
  const settle = (p: void | Promise<void>): void | Promise<void> => (mode === 'instant' ? undefined : p);

  // ---------------------------------------------------------- the scene clock

  interface SceneWaiter {
    leftMs: number;
    resolve: () => void;
  }
  /** Budgets in flight, ticked by `update(dt)` on the same clock as the tweens. */
  const sceneWaiters = new Set<SceneWaiter>();
  /** `performance.now()` of the last frame. `-Infinity` until one arrives. */
  let lastFrameAt = Number.NEGATIVE_INFINITY;
  const nowMs = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /**
   * A deadline measured in **scene time** — the clock the beat's camera moves,
   * actor moves and typewriter are really advanced on.
   *
   * `cancel()` matters: `Promise.race` does not stop the loser, and a beat that
   * finished early must not leave its budget ticking into the next one.
   */
  function budget(ms: number): { reached: Promise<void>; cancel: () => void } {
    const waiter: SceneWaiter = { leftMs: ms, resolve: () => {} };
    const reached = new Promise<void>((resolve) => {
      waiter.resolve = (): void => {
        if (sceneWaiters.delete(waiter)) resolve();
      };
    });
    sceneWaiters.add(waiter);
    // The stall guard. Frames arriving means the beat is being paid for out of
    // scene time, which is the point; frames *stopping* means scene time is
    // never going to reach the deadline, so the wall clock ends it instead.
    const poll = (delay: number): void => {
      void realWait(delay).then(() => {
        if (!sceneWaiters.has(waiter)) return;
        if (nowMs() - lastFrameAt < FRAME_STALL_MS) {
          poll(FRAME_STALL_MS);
          return;
        }
        waiter.resolve();
      });
    };
    poll(ms);
    return { reached, cancel: () => void sceneWaiters.delete(waiter) };
  }

  /** The line as the box will really play it, with a hold it cannot sit past. */
  const timed = <T extends SayStep | NarrateStep>(step: T): T =>
    step.auto === undefined ? { ...step, auto: MID_LINE_HOLD_MS } : step;

  /** Worst case for one line, if the frame loop keeps running. */
  const lineDeadlineMs = (step: SayStep | NarrateStep): number =>
    typingDurationMs(step.text, opts.textSpeed ?? 1) + (step.auto ?? MID_LINE_HOLD_MS) + LINE_GRACE_MS;

  /**
   * Play a line, but never wait on it longer than it can honestly take.
   *
   * On the scene clock, like the beat's own budget: the box reveals its text
   * from `update(dt)`, so a line's honest length is a number of frames, not a
   * number of milliseconds of a renderer's bad day.
   */
  const raceLine = (played: Promise<void>, line: SayStep | NarrateStep): Promise<void> => {
    const cap = budget(lineDeadlineMs(line));
    return Promise.race([played, cap.reached]).finally(() => {
      cap.cancel();
    });
  };
  const speakSay = (step: SayStep): Promise<void> => {
    const line = timed(step);
    return raceLine(box.say(line), line);
  };
  const speakNarrate = (step: NarrateStep): Promise<void> => {
    const line = timed(step);
    return raceLine(box.narrate(line), line);
  };

  const dialogue: DialoguePort = {
    say: (step) => (mode === 'instant' ? noop.say(step) : mode === 'auto' ? speakSay(step) : box.say(step)),
    narrate: (step) =>
      mode === 'instant' ? noop.narrate(step) : mode === 'auto' ? speakNarrate(step) : box.narrate(step),
    // A `choice` mid-battle is a defect the story tests already fail on
    // (`blockingSteps`); if one reaches here with nobody to answer it, take the
    // first option rather than wedging the fight.
    choice: (step) => (mode === 'manual' ? box.choice(step) : noop.choice(step)),
  };

  const actor = (id: string | undefined): ReturnType<BattleStage['actor']> =>
    id ? opts.stage.actor(id) : undefined;

  const ports: CutscenePorts = {
    dialogue,
    // A camera move is the single most expensive thing a beat can ask for
    // under a software renderer: `BattleCamera.moveTo` tweens from `update(dt)`
    // with `dt` clamped at 1/20 s, so an authored 400 ms move cannot complete
    // in fewer than eight rendered frames however fast the clock runs. Under
    // `'skip'` nobody is looking at those frames, so the rig is *snapped* — the
    // same end state, at no cost, and with no tween left running into the
    // fight that resumes underneath it.
    camera: (rig, ms) => {
      if (mode === 'instant') {
        opts.stage.camera.snapTo(rig);
        return;
      }
      return opts.stage.camera.moveTo(rig, ms);
    },
    // Fire and forget, which is what the budget model already assumes: an `fx`
    // step is charged nothing because it "resolves as soon as the effect is
    // handed to the stage" [`story/registry.ts`]. `VfxPort.play` actually
    // resolves when the *effect* ends, so awaiting it charged the beat for
    // Bahamut's whole Mega Flare charge — which is how a four-second beat hit
    // an eight-second budget in a software-rendered capture. The effect still
    // plays; the line just stops waiting on it.
    fx: (key, at) => {
      void Promise.resolve(opts.stage.vfx.play(key, at ?? 'screen')).catch((err: unknown) => {
        console.warn(`[battle-cutscene] vfx "${key}" failed:`, err);
      });
    },
    music: (track, fade) => {
      // `fade` is the DSL's `MusicStep.fade`, authored in milliseconds
      // (`story/dsl.ts`); `AudioPort`/`AudioManager` want seconds (PR-0089).
      if (track) void opts.audio?.playMusic(track, { fade: fadeMsToSec(fade, 1200) });
      else opts.audio?.stopMusic(fadeMsToSec(fade, 800));
    },
    wait: (ms) => wait(ms),
    moveActor: (who, to, ms) => {
      const target = actor(who);
      if (!target || !('x' in to)) return;
      return settle(target.moveTo({ x: to.x, y: to.y, z: to.z }, animMs(ms)));
    },
    // Guarded, same policy as CutsceneScreen and the presenter's `cue()`. `SfxKey`
    // is a plain string, so tsc cannot catch an unregistered cue, and `playSfx`
    // throws on one. Unguarded, a single bad key in a mid-battle script would
    // throw mid-fight. That is exactly how every opening cutscene froze at its
    // first ambient sound until the story cues were composed.
    sfx: (key) => {
      try {
        opts.audio?.playSfx(key);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[battle-cutscene] sfx "${key}" skipped:`, err instanceof Error ? err.message.split('.')[0] : err);
      }
    },
    flash: (color, ms) => opts.stage.vfx.screenFlash(color ?? '#ffffff', ms),
    // The DSL measures shake in logical pixels; the camera takes world units.
    shake: (px, ms) => opts.stage.camera.shake(px / 60, ms),
    fadeScreen: (to, ms) => {
      const colour = to === 'white' ? '#ffffff' : to === 'black' ? '#000000' : 'transparent';
      opts.stage.vfx.screenFlash(colour, ms);
    },
    setPose: (step) => actor(step.actor)?.setPose(step.state),
    // A fade is a tween too, and a tween that is never awaited is a tween that
    // never gets applied. Under `'skip'` the alpha is set outright, so the
    // actor a later beat or the resumed fight sees is the one the script asked
    // for rather than whatever frame the fade happened to stop on.
    showActor: (step) => {
      const target = actor(step.actor);
      if (!target) return;
      if (mode === 'instant') {
        target.setAlpha(1);
        return;
      }
      target.setAlpha(0);
      return target.fadeTo(1, step.ms ?? 300);
    },
    hideActor: (step) => {
      const target = actor(step.actor);
      if (!target) return;
      if (mode === 'instant') {
        target.setAlpha(0);
        return;
      }
      return target.fadeTo(0, step.ms ?? 300);
    },
  };

  const runner = new CutsceneRunner(ports);
  /** Beats started, so a stale budget timer can tell whose it is. */
  let beatsPlayed = 0;

  return {
    async play(script: StoryScript, playOpts?: { midBattle?: boolean; name?: string }): Promise<void> {
      // Nothing to show when every line resolves instantly.
      box.el.hidden = mode === 'instant';
      // The HUD stays where it is; the scene behind the line just dims.
      if (playOpts?.midBattle !== false) opts.root.classList.add(MIDBEAT_CLASS);
      const deadline = midBattleDeadlineMs(script);
      // The budget outlives a beat that finishes early — its stall-guard timer
      // has no cancel — so it is fenced by the beat it was started for. Without
      // the fence, beat A's leftover timer would skip beat B mid-sentence.
      const beat = ++beatsPlayed;
      let finished = false;
      let overran = false;
      let cancelBudget: (() => void) | null = null;
      try {
        // `reset()` keeps the `'skip'` latch (`CutsceneRunner.setInstant`), so a
        // run at that speed starts *every* beat fast-forwarded, not just the
        // one that happened to be in flight when the speed was set.
        runner.reset();
        if (mode === 'instant') {
          // Nothing to race. Every timed step resolves at once, so the beat
          // costs a handful of microtasks and cannot overrun a budget it is
          // never measured against — which is the whole point of `'skip'`.
          await runner.run(script);
          finished = true;
        } else {
          // A beat must never be able to wedge a battle. On an overrun the
          // runner is *skipped*, not merely abandoned: `skip()` unblocks the
          // step in flight and lets the rest resolve at once, so the remaining
          // poses, flags and music still land and the box does not keep typing
          // behind a fight that has resumed without it.
          const cap = budget(deadline);
          cancelBudget = cap.cancel;
          await Promise.race([
            runner.run(script).then(() => {
              finished = true;
            }),
            cap.reached.then(async () => {
              // A beat that lands on the same tick as its own budget is not an
              // overrun: let anything already resolved settle before saying so.
              for (let i = 0; i < 4; i++) await Promise.resolve();
              if (finished || beat !== beatsPlayed || runner.skipped) return;
              overran = true;
              runner.skip();
            }),
          ]);
        }
      } catch (err) {
        console.warn('[cutscene] a mid-battle script failed; resuming the battle', err);
      } finally {
        finished = true; // also covers the `catch` path above
        cancelBudget?.();
        const name = playOpts?.name ?? '(unnamed)';
        if (overran && !overrunLogged.has(name)) {
          overrunLogged.add(name);
          const line =
            `[cutscene] mid-battle beat "${name}" ran past its ${deadline}ms budget; ` +
            `cut short and resuming the battle (logged once per beat)`;
          // Not `console.error`. An overrun is a pacing note, not a fault: the
          // fight carried on, the state landed, and every automated gate we
          // have — the sweep, the gallery report, CI — treats a `console.error`
          // as a failed run. A human's own playthrough still gets a warning,
          // because there it means a beat they were watching got cut off.
          if (mode === 'manual') console.warn(line);
          else console.info(line);
        }
        opts.root.classList.remove(MIDBEAT_CLASS);
        box.hide();
        box.el.hidden = true;
      }
    },
    update: (dt) => {
      // Scene time: the beat's budget and its line deadlines are spent here,
      // beside the tweens they are measuring.
      lastFrameAt = nowMs();
      if (sceneWaiters.size > 0) {
        const ms = Math.max(0, dt * 1000);
        for (const waiter of [...sceneWaiters]) {
          waiter.leftMs -= ms;
          if (waiter.leftMs <= 0) waiter.resolve();
        }
      }
      box.update(dt);
    },
    handleInput: (input) => box.handleInput(input),
    skip: () => runner.skip(),
    setAutoAdvance: (on, autoOpts) => {
      mode = !on ? 'manual' : autoOpts?.instant ? 'instant' : 'auto';
      // Only `'skip'` playback wants the beat in flight thrown away; plain
      // auto-battle still plays it, on its own timer. `setInstant` rather than
      // `skip` because the latch has to outlive the `reset()` every later beat
      // begins with — a one-shot skip bought exactly one cheap beat.
      runner.setInstant(mode === 'instant');
    },
    dispose: () => box.unmount(),
  };
}
