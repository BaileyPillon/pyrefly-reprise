import '../../ui/common/cutscene.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { fadeMsToSec } from '../../audio/AudioManager.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { getChapter, type ChapterId } from '../../data/encounters.ts';
import { battleStart, beat, camera, fx, music, narrate, say, type SpeakerId, type StoryScript } from '../../story/dsl.ts';
import {
  CutsceneRunner,
  createNoopPorts,
  type CutscenePorts,
  type CutsceneRunResult,
} from '../../story/runner/CutsceneRunner.ts';
import { DialogueBox } from '../../ui/common/DialogueBox.ts';
import { ControlsHint } from '../../ui/common/ControlsHint.ts';
import { romanNumeral } from '../../ui/common/roman.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { setPauseMusic } from '../../ui/common/pauseMusic.ts';
import { PauseScreen } from './PauseScreen.ts';
import { CutsceneStage } from './CutsceneStage.ts';

/**
 * One row, and it says what the keys actually do.
 *
 * Critic round 02 #30 measured runs of 13, 17, 29 and 36 consecutive Enter
 * presses changing nothing, because the script spends 38.6 s of Chapter 1's
 * opening inside `beat`/`wait` steps the dialogue box never sees — and the
 * strip advertised only ADVANCE, with SKIP SCENE buried as the eighth row of
 * the pause list. Enter now moves the script on at any point (see
 * {@link CutsceneScreen.handleInput}), holding it fast-forwards, and the strip
 * says both.
 */
const HINTS = [
  { keyboard: 'Enter', gamepad: 'Cross', label: 'advance', action: 'confirm' },
  { keyboard: 'Hold Enter', gamepad: 'Hold Cross', label: 'skip', pointer: 'Hold click' },
  // Esc opens the pause menu, which is where SKIP SCENE also lives.
  { keyboard: 'Esc', gamepad: 'Circle', label: 'menu', action: 'cancel' },
];

/**
 * How long Confirm has to be held before it stops advancing line by line and
 * starts fast-forwarding. Long enough that a firm tap on a slow frame is still
 * a tap.
 */
const HOLD_TO_SKIP_MS = 550;

/**
 * A tiny built-in script so `window.__pyrefly.goto('cutscene')` always has
 * something to play for screenshots even before a story agent's chapter
 * scripts are filled in — see `src/story/scripts/*.ts`'s `TODO(story-agent)`
 * placeholders. Not chapter content.
 */
export const DEMO_CUTSCENE_SCRIPT: StoryScript = [
  music('boss-dread'),
  camera('cutscene_low', 0),
  // Leads with a `say` (portrait + name tag) rather than the `narrate`
  // variant, so a plain `goto('cutscene')`/screenshot with no advance shows
  // the fuller of the two box styles by default.
  say('tidus', 'So... Auron, you seeing this?', { emotion: 'determined' }),
  say('auron', 'Something is waiting for us up ahead.', { emotion: 'determined' }),
  narrate('The Prominence, near the summit. This is where it happened.'),
  beat(1200),
  say('tidus', "Great. My favorite kind of hike.", { emotion: 'smug' }),
  fx('spark', 'seymour'),
  say('seymour', "You've come a long way, son of Jecht.", { emotion: 'neutral' }),
  beat(1400),
  say('yuna', 'Kimahri...', { emotion: 'sad' }),
  battleStart(),
];

export interface CutsceneScreenOptions {
  /** Drives the backdrop image and, unless `ports.music` is overridden, is left to the script's own `music()` steps. */
  chapterId?: ChapterId;
  /** Explicit backdrop scene key, overriding `chapterId`'s. */
  backdropKey?: string;
  /** Defaults to {@link DEMO_CUTSCENE_SCRIPT}. */
  script?: StoryScript;
  /** Speaker -> display name / portrait overrides, passed straight to `DialogueBox`. */
  nameFor?: (who: SpeakerId) => string;
  portraitFor?: (who: SpeakerId) => string | undefined;
  /** Speaker -> role-chip tag; defaults to `speakerRole` (see `src/ui/common/speaker-roles.ts`). */
  roleFor?: (who: SpeakerId) => string | undefined;
  /** Override or extend the default ports (camera/moveActor are no-ops; fx/showActor/hideActor act on `CutsceneStage`). */
  ports?: Partial<CutscenePorts>;
  /** Esc fast-forwards the script. Default true. */
  skippable?: boolean;
  /**
   * Fast-forward the whole script from the first frame — matches
   * `BattleScreenFlow.ts`'s `CutsceneScreenOptions.skip` (a cutscene the
   * player has already seen, or `SaveData.settings.skipSeenCutscenes`).
   * Instantaneous port calls (`music`, `sfx`, flags) still fire; only the
   * timed ones (dialogue, wait, camera, fx, moveActor) are skipped.
   */
  startSkipped?: boolean;
  /**
   * Index of the first step to play, from a previous run's
   * `CutsceneRunResult.resumeAt`. This is how a `post` script plays its
   * authored scenes *after* the results panel instead of being thrown away at
   * the `results()` marker (critic round 02 #04).
   */
  resumeFrom?: number;
  onBattleStart?: (transition: Extract<CutsceneRunResult, { type: 'battleStart' }>['transition']) => void;
  /** `resumeAt` is the step index the script stopped on; hand it back as {@link resumeFrom}. */
  onResults?: (silent: boolean, resumeAt: number) => void;
  /** Called when the script falls off the end with neither marker (a mid-battle-style script run as a standalone screen). */
  onEnd?: () => void;
}

/**
 * Runs a `StoryScript` through `CutsceneRunner`, presenting it with a
 * `DialogueBox` over a backdrop image. Figures, drawn effects, flash and shake
 * live on a DOM-only `CutsceneStage` (no Three.js here); camera and movement
 * are no-ops. Pass `ports` to wire a real presenter in without touching this file.
 */
export class CutsceneScreen extends Screen {
  readonly name = 'cutscene';

  /**
   * Resolves once the script finishes (for any reason — `battleStart()`,
   * `results()`, or falling off the end) — satisfies the `FlowScreen<void>`
   * contract `BattleScreenFlow.ts` expects from `registerFlowScreens({ cutscene: ... })`.
   */
  readonly done: Promise<void>;
  private resolveDone!: () => void;

  private dialogueBox: DialogueBox | null = null;
  private hint: ControlsHint | null = null;
  private runner: CutsceneRunner | null = null;
  private eyebrowEl: HTMLElement | null = null;
  private stage: CutsceneStage | null = null;
  private finished = false;
  private lastResult: CutsceneRunResult | null = null;
  /** The pause overlay while it is up. */
  private pauseScreen: PauseScreen | null = null;
  /** True while the script's own waits are held on the pause gate. */
  private scriptPaused = false;
  private pauseWaiters: Array<() => void> = [];
  /** Confirm still held as of the last `handleInput`. See {@link update}. */
  private confirmDown = false;
  /** How long it has been held, in ms. Past {@link HOLD_TO_SKIP_MS} it fast-forwards. */
  private confirmHeldMs = 0;

  constructor(private readonly opts: CutsceneScreenOptions = {}) {
    super();
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
  }

  override enter(): void {
    installInkGoldStyles();
    this.root.className = 'screen cutscene ig';
    const chapter = this.opts.chapterId ? getChapter(this.opts.chapterId) : undefined;
    const sceneKey = this.opts.backdropKey ?? chapter?.sceneKey;
    if (sceneKey) this.root.style.backgroundImage = `url(${artUrl(`art/backdrops/${sceneKey}.png`)})`;
    if (chapter?.game === 'ffx2') this.root.classList.add('ig--ffx2');

    // Chapter eyebrow, top-left: gold rule + `CHAPTER I  MT. GAGAZET - THE
    // PROMINENCE` [presentation-ink-and-gold.md, A-dialogue mockup].
    if (chapter) {
      this.eyebrowEl = document.createElement('div');
      this.eyebrowEl.className = 'cutscene__eyebrow';
      this.eyebrowEl.innerHTML = `<span class="cutscene__eyebrow-rule"></span><span class="cutscene__eyebrow-label">CHAPTER ${romanNumeral(
        chapter.number,
      )} &middot; ${escapeHtml(chapter.location.toUpperCase())}</span>`;
      this.root.appendChild(this.eyebrowEl);
    }

    // Backdrop, then the stage (figures, effects, and the box inside its shake layer), then the flash.
    this.stage = new CutsceneStage(this.root, { wait: (ms) => this.waitGate(ms), skipping: () => this.runner?.skipped === true });
    this.stage.mount();
    this.stage.prepare(this.opts.script ?? DEMO_CUTSCENE_SCRIPT);

    this.dialogueBox = new DialogueBox({
      root: this.stage.shakeEl,
      ...(this.opts.nameFor ? { nameFor: this.opts.nameFor } : {}),
      ...(this.opts.portraitFor ? { portraitFor: this.opts.portraitFor } : {}),
      ...(this.opts.roleFor ? { roleFor: this.opts.roleFor } : {}),
    });
    this.dialogueBox.mount();

    this.hint = new ControlsHint({ root: this.root, items: HINTS });
    this.hint.mount();

    this.runner = new CutsceneRunner(this.buildPorts());
    if (this.opts.startSkipped) this.runner.skip();
    void this.app.fade('clear', 500);
    void this.playScript();
  }

  override exit(): void {
    // Anything parked on the gate must be released, or a script that was
    // paused when the screen went away would never finish its `run()`.
    this.setScriptPaused(false);
    this.pauseScreen = null;
    this.hint?.unmount();
    this.dialogueBox?.unmount();
    this.stage?.unmount();
    this.eyebrowEl?.remove();
    this.resolveDone();
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);

    // Confirm, in order of who has a use for it:
    //
    // 1. the dialogue box, if a line is typing or waiting — it completes the
    //    reveal, then advances;
    // 2. otherwise the **script**, which is where the 38.6 s of `beat`/`wait`
    //    steps live. The box was the only reader, and it returns early when it
    //    has no line in flight, so every press between lines was swallowed
    //    (critic round 02 #30). `nudge()` releases the step in flight and
    //    nothing more, so the next one still plays at its authored length.
    //
    // Held, it stops being an advance and becomes a fast-forward: `nudge()`
    // every frame runs the rest of the scene at whatever speed the player's
    // thumb asks for, without throwing the scene away the way SKIP does.
    const box = this.dialogueBox;
    const boxBusy = box?.visible === true && box.awaitingAdvance;
    if (boxBusy) box?.handleInput(input);

    // The hold itself is measured on the frame clock in `update`; this only
    // records whether the key is still down.
    this.confirmDown = input.pressed('confirm');

    if (!boxBusy && (input.consume('confirm') || input.actions.includes('confirm'))) {
      audio.playSfx('cursor-move');
      this.runner?.nudge();
    }

    const skippable = this.opts.skippable ?? true;
    const backedOut = input.consume('cancel') || input.actions.includes('cancel');
    if (!backedOut && !input.justPressed('start')) return;

    // Esc used to skip the scene outright. It now opens the same pause menu
    // the battle uses, with SKIP SCENE as one entry on it — so the key that
    // throws away a cutscene is a menu choice rather than a reflex, and the
    // options, the music player and the chapter dossier are reachable from a
    // cutscene too. A screen with no chapter behind it (the demo script, a
    // bare `goto('cutscene')`) has no dossier to show and keeps the old
    // straight-to-skip behaviour.
    const chapter = this.opts.chapterId ? getChapter(this.opts.chapterId) : undefined;
    if (!chapter) {
      if (skippable && backedOut) this.runner?.skip();
      return;
    }
    if (this.pauseScreen) return;
    void this.openPause(chapter, skippable);
  }

  // ------------------------------------------------------------- the pause

  private async openPause(chapter: NonNullable<ReturnType<typeof getChapter>>, skippable: boolean): Promise<void> {
    if (this.pauseScreen || this.app.overlayActive) return;
    const screen = new PauseScreen({
      chapter,
      // A cutscene has no battle behind it, so the dossier's objectives all
      // read as untouched and ENCOUNTER PROGRESS has nothing to report —
      // which is the honest picture before the fight starts.
      onPause: (paused) => {
        this.setScriptPaused(paused);
        // Same hush as the battle's pause menu — see `ui/common/pauseMusic.ts`.
        setPauseMusic(audio, paused);
      },
      onResume: () => void this.closePause(),
      onChapterSelect: () => void this.app.goto('chapter-select'),
      onQuitToTitle: () => void this.app.goto('title'),
      ...(skippable
        ? {
            extraRows: [
              {
                id: 'skip-scene',
                label: 'Skip Scene',
                run: () => {
                  void this.closePause().then(() => this.runner?.skip());
                },
              },
            ],
          }
        : {}),
    });
    this.pauseScreen = screen;
    await this.app.pushOverlay(screen);
  }

  private async closePause(): Promise<void> {
    if (!this.pauseScreen) return;
    this.pauseScreen = null;
    await this.app.popOverlay();
  }

  /**
   * Hold the script's own timed waits.
   *
   * The dialogue typewriter already stops with the App loop (it ticks from
   * `update`, which an overlay suspends), but `CutsceneRunner`'s `wait` port
   * is a bare `setTimeout` and would keep counting behind the menu — so a
   * player who paused mid-beat would come back to a line that had already
   * advanced. Same gate shape as `BattleScreen.pauseGate`.
   */
  private setScriptPaused(paused: boolean): void {
    this.scriptPaused = paused;
    if (paused) return;
    const waiters = this.pauseWaiters;
    this.pauseWaiters = [];
    for (const resolve of waiters) resolve();
  }

  private waitGate(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        if (!this.scriptPaused) return resolve();
        this.pauseWaiters.push(resolve);
      }, ms);
    });
  }

  override update(dt: number): void {
    this.dialogueBox?.update(dt);

    // Held Confirm = fast-forward. Measured here rather than in `handleInput`
    // because this is the method with a clock, and a hold has to mean the same
    // length of time on a 144 Hz monitor as on a 30 fps one.
    if (!this.confirmDown) {
      this.confirmHeldMs = 0;
      return;
    }
    this.confirmHeldMs += dt * 1000;
    if (this.confirmHeldMs < HOLD_TO_SKIP_MS) return;
    this.runner?.nudge();
    this.dialogueBox?.forceAdvance();
  }

  override trigger(name: string): boolean {
    if (name === 'skip' || name === 'cutscene:skip') {
      this.runner?.skip();
      return true;
    }
    if (name === 'cutscene:advance') {
      this.dialogueBox?.forceAdvance();
      return true;
    }
    return false;
  }

  override snapshot(): Record<string, unknown> {
    return { finished: this.finished, result: this.lastResult, paused: this.pauseScreen !== null, cast: this.stage?.cast() ?? [] };
  }

  // ------------------------------------------------------------------ run

  private async playScript(): Promise<void> {
    if (!this.runner) return;
    const script = this.opts.script ?? DEMO_CUTSCENE_SCRIPT;
    const from = this.opts.resumeFrom ?? 0;
    const result = await this.runner.run(script, undefined, from > 0 ? { from } : {});
    this.lastResult = result;
    this.finished = true;

    if (result.type === 'battleStart') this.opts.onBattleStart?.(result.transition);
    else if (result.type === 'results') this.opts.onResults?.(result.silent, result.resumeAt);
    else this.opts.onEnd?.();

    // Resolve now rather than waiting for `exit()` — the flow's
    // `await screen.done` is what triggers the replace that would call it.
    this.resolveDone();
  }

  private buildPorts(): CutscenePorts {
    const stage = this.stage;
    if (!this.dialogueBox || !stage) throw new Error('CutsceneScreen: buildPorts() called before the stage and dialogue box exist.');
    const base = createNoopPorts({
      dialogue: this.dialogueBox,
      camera: () => {}, // no 3D scene owned here — the presenter/scene agent overrides via `opts.ports`.
      fx: (key, at) => stage.fx(key, at),
      showActor: (step) => stage.showActor(step),
      hideActor: (step) => stage.hideActor(step),
      music: (track, fade) => {
        // `fade` is the DSL's `MusicStep.fade`, authored in milliseconds
        // (`story/dsl.ts`); `AudioManager` wants seconds. PR-0089: this used to
        // forward the raw ms value, scheduling a multi-minute ramp instead of a
        // sub-two-second one, and `track === null` (stop the music) was
        // silently dropped instead of reaching `stopMusic`.
        if (track) void audio.playMusic(track, { fade: fadeMsToSec(fade, 1200) });
        else audio.stopMusic(fadeMsToSec(fade, 800));
      },
      wait: (ms) => this.waitGate(ms),
      moveActor: () => {},
      // A missing cue must cost a sound, never the scene. `playSfx` throws on
      // an unknown name, and the runner calls this synchronously mid-script:
      // unguarded, one bad key stopped every chapter's opening cutscene before
      // its first line. Same policy as the battle presenter's `cue()`.
      sfx: (key) => {
        try {
          audio.playSfx(key);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[cutscene] sfx "${key}" skipped:`, err instanceof Error ? err.message.split('.')[0] : err);
        }
      },
      flash: (color, ms) => stage.flash(color, ms),
      shake: (px, ms) => stage.shake(px, ms),
      fadeScreen: (to, ms) => this.app.fade(to === 'clear' ? 'clear' : 'opaque', ms),
    });
    return { ...base, ...this.opts.ports };
  }
}
