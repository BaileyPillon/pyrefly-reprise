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
 */

import type { NarrateStep, SayStep, StoryScript } from '../../story/dsl.ts';
import {
  createNoopDialoguePort,
  CutsceneRunner,
  type CutscenePorts,
  type DialoguePort,
} from '../../story/runner/CutsceneRunner.ts';
import { MID_LINE_HOLD_MS, midBattleDeadlineMs } from '../../story/registry.ts';
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
  /** Sleep hook, so a skipped or fast-forwarded battle stays responsive. */
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
  const wait = opts.sleep ?? sleepMs;
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

  /** The line as the box will really play it, with a hold it cannot sit past. */
  const timed = <T extends SayStep | NarrateStep>(step: T): T =>
    step.auto === undefined ? { ...step, auto: MID_LINE_HOLD_MS } : step;

  /** Worst case for one line, if the frame loop keeps running. */
  const lineDeadlineMs = (step: SayStep | NarrateStep): number =>
    typingDurationMs(step.text, opts.textSpeed ?? 1) + (step.auto ?? MID_LINE_HOLD_MS) + LINE_GRACE_MS;

  /** Play a line, but never wait on it longer than it can honestly take. */
  const speakSay = (step: SayStep): Promise<void> => {
    const line = timed(step);
    return Promise.race([box.say(line), wait(lineDeadlineMs(line))]);
  };
  const speakNarrate = (step: NarrateStep): Promise<void> => {
    const line = timed(step);
    return Promise.race([box.narrate(line), wait(lineDeadlineMs(line))]);
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
    camera: (rig, ms) => opts.stage.camera.moveTo(rig, ms),
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
      if (track) void opts.audio?.playMusic(track, { fade: fade ?? 1200 });
      else opts.audio?.stopMusic(fade ?? 800);
    },
    wait: (ms) => wait(ms),
    moveActor: (who, to, ms) => {
      const target = actor(who);
      if (!target || !('x' in to)) return;
      return target.moveTo({ x: to.x, y: to.y, z: to.z }, ms);
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
    showActor: (step) => {
      const target = actor(step.actor);
      target?.setAlpha(0);
      return target?.fadeTo(1, step.ms ?? 300);
    },
    hideActor: (step) => actor(step.actor)?.fadeTo(0, step.ms ?? 300),
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
      // The budget timer outlives a beat that finishes early — `opts.sleep` has
      // no cancel — so it is fenced by the beat it was started for. Without the
      // fence, beat A's leftover timer would skip beat B mid-sentence.
      const beat = ++beatsPlayed;
      let finished = false;
      let overran = false;
      try {
        runner.reset();
        // A beat must never be able to wedge a battle. On an overrun the
        // runner is *skipped*, not merely abandoned: `skip()` unblocks the step
        // in flight and lets the rest resolve at once, so the remaining poses,
        // flags and music still land and the box does not keep typing behind a
        // fight that has resumed without it.
        await Promise.race([
          runner.run(script).then(() => {
            finished = true;
          }),
          wait(deadline).then(async () => {
            // A beat that lands on the same tick as its own budget is not an
            // overrun: let anything already resolved settle before saying so.
            for (let i = 0; i < 4; i++) await Promise.resolve();
            if (finished || beat !== beatsPlayed || runner.skipped) return;
            overran = true;
            runner.skip();
          }),
        ]);
      } catch (err) {
        console.warn('[cutscene] a mid-battle script failed; resuming the battle', err);
      } finally {
        finished = true; // also covers the `catch` path above
        const name = playOpts?.name ?? '(unnamed)';
        if (overran && !overrunLogged.has(name)) {
          overrunLogged.add(name);
          console.error(
            `[cutscene] mid-battle beat "${name}" ran past its ${deadline}ms budget; ` +
              `cut short and resuming the battle (logged once per beat)`,
          );
        }
        opts.root.classList.remove(MIDBEAT_CLASS);
        box.hide();
        box.el.hidden = true;
      }
    },
    update: (dt) => box.update(dt),
    handleInput: (input) => box.handleInput(input),
    skip: () => runner.skip(),
    setAutoAdvance: (on, autoOpts) => {
      mode = !on ? 'manual' : autoOpts?.instant ? 'instant' : 'auto';
      // Only `'skip'` playback wants the beat in flight thrown away; plain
      // auto-battle still plays it, on its own timer.
      if (mode === 'instant') runner.skip();
    },
    dispose: () => box.unmount(),
  };
}
