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
 */

import type { StoryScript } from '../../story/dsl.ts';
import {
  createNoopDialoguePort,
  CutsceneRunner,
  type CutscenePorts,
  type DialoguePort,
} from '../../story/runner/CutsceneRunner.ts';
import { DialogueBox } from '../../ui/common/DialogueBox.ts';
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
  /** Resolve every line immediately, for a run with no human in it. */
  setAutoAdvance(on: boolean): void;
  dispose(): void;
}

const sleepMs = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, Math.max(0, ms)));

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
   * Under auto-battle nobody presses Confirm, so a `say` step would block the
   * whole battle on a line that never advances — the exact hang that stalled
   * Seymour Flux at his first Zombie trigger. Swapping in the no-op port keeps
   * the beat's camera moves, poses and VFX and drops only the waiting.
   */
  const noop = createNoopDialoguePort();
  let autoAdvance = false;
  const dialogue: DialoguePort = {
    say: (step) => (autoAdvance ? noop.say(step) : box.say(step)),
    narrate: (step) => (autoAdvance ? noop.narrate(step) : box.narrate(step)),
    choice: (step) => (autoAdvance ? noop.choice(step) : box.choice(step)),
  };

  const actor = (id: string | undefined): ReturnType<BattleStage['actor']> =>
    id ? opts.stage.actor(id) : undefined;

  const ports: CutscenePorts = {
    dialogue,
    camera: (rig, ms) => opts.stage.camera.moveTo(rig, ms),
    fx: (key, at) => opts.stage.vfx.play(key, at ?? 'screen'),
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
    sfx: (key) => opts.audio?.playSfx(key),
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

  return {
    async play(script: StoryScript): Promise<void> {
      // Nothing to show when every line resolves instantly.
      box.el.hidden = autoAdvance;
      try {
        runner.reset();
        await runner.run(script);
      } catch (err) {
        console.warn('[cutscene] a mid-battle script failed; resuming the battle', err);
      } finally {
        box.el.hidden = true;
      }
    },
    update: (dt) => box.update(dt),
    handleInput: (input) => box.handleInput(input),
    skip: () => runner.skip(),
    setAutoAdvance: (on) => {
      autoAdvance = on;
      if (on) runner.skip();
    },
    dispose: () => box.unmount(),
  };
}
