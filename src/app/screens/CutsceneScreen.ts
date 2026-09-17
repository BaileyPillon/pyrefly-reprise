import '../../ui/common/cutscene.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
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

const HINTS = [
  { keyboard: 'Enter', gamepad: 'Cross', label: 'advance', action: 'confirm' },
  { keyboard: 'Esc', gamepad: 'Circle', label: 'skip', action: 'cancel' },
];

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
  /** Override or extend the default DOM-only ports (camera/fx/moveActor are no-ops by default — the scene/presenter agent injects real ones here). */
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
  onBattleStart?: (transition: Extract<CutsceneRunResult, { type: 'battleStart' }>['transition']) => void;
  onResults?: (silent: boolean) => void;
  /** Called when the script falls off the end with neither marker (a mid-battle-style script run as a standalone screen). */
  onEnd?: () => void;
}

/**
 * Runs a `StoryScript` through `CutsceneRunner`, presenting it with a
 * `DialogueBox` over a backdrop image. Camera/fx/actor movement are DOM-only
 * stand-ins (no Three.js here — that belongs to `src/engine/**`/`src/scenes/**`);
 * pass `ports` to wire the real presenter in without touching this file.
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
  private flashEl: HTMLElement | null = null;
  private shakeEl: HTMLElement | null = null;
  private finished = false;
  private lastResult: CutsceneRunResult | null = null;

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

    this.shakeEl = document.createElement('div');
    this.shakeEl.className = 'cutscene__shake';
    this.root.appendChild(this.shakeEl);

    this.flashEl = document.createElement('div');
    this.flashEl.className = 'cutscene__flash';
    this.root.appendChild(this.flashEl);

    this.dialogueBox = new DialogueBox({
      root: this.shakeEl,
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
    this.hint?.unmount();
    this.dialogueBox?.unmount();
    this.shakeEl?.remove();
    this.flashEl?.remove();
    this.eyebrowEl?.remove();
    this.resolveDone();
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    this.dialogueBox?.handleInput(input);
    const skippable = this.opts.skippable ?? true;
    if (skippable && (input.consume('cancel') || input.actions.includes('cancel'))) this.runner?.skip();
  }

  override update(dt: number): void {
    this.dialogueBox?.update(dt);
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
    return { finished: this.finished, result: this.lastResult };
  }

  // ------------------------------------------------------------------ run

  private async playScript(): Promise<void> {
    if (!this.runner) return;
    const script = this.opts.script ?? DEMO_CUTSCENE_SCRIPT;
    const result = await this.runner.run(script);
    this.lastResult = result;
    this.finished = true;

    if (result.type === 'battleStart') this.opts.onBattleStart?.(result.transition);
    else if (result.type === 'results') this.opts.onResults?.(result.silent);
    else this.opts.onEnd?.();

    // Resolve now rather than waiting for `exit()` — the flow's
    // `await screen.done` is what triggers the replace that would call it.
    this.resolveDone();
  }

  private buildPorts(): CutscenePorts {
    if (!this.dialogueBox) throw new Error('CutsceneScreen: buildPorts() called before the dialogue box exists.');
    const base = createNoopPorts({
      dialogue: this.dialogueBox,
      camera: () => {}, // no 3D scene owned here — the presenter/scene agent overrides via `opts.ports`.
      fx: () => this.flash(undefined, 90),
      music: (track, fade) => {
        if (track) void audio.playMusic(track, fade !== undefined ? { fade } : {});
      },
      wait: (ms) => new Promise((resolve) => window.setTimeout(resolve, ms)),
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
      flash: (color, ms) => this.flash(color, ms),
      shake: (px, ms) => this.shake(px, ms),
      fadeScreen: (to, ms) => this.app.fade(to === 'clear' ? 'clear' : 'opaque', ms),
    });
    return { ...base, ...this.opts.ports };
  }

  private flash(color: string | undefined, ms: number): Promise<void> {
    if (!this.flashEl) return Promise.resolve();
    this.flashEl.style.background = color ?? '#ffffff';
    this.flashEl.style.transitionDuration = '0ms';
    this.flashEl.style.opacity = '0.7';
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        if (!this.flashEl) return resolve();
        this.flashEl.style.transitionDuration = `${ms}ms`;
        this.flashEl.style.opacity = '0';
        window.setTimeout(resolve, ms);
      });
    });
  }

  private shake(px: number, ms: number): Promise<void> {
    const el = this.shakeEl;
    if (!el) return Promise.resolve();
    el.style.transition = `transform ${Math.max(30, ms / 8)}ms ease-in-out`;
    let ticks = 0;
    const maxTicks = 6;
    return new Promise((resolve) => {
      const step = (): void => {
        ticks++;
        const decay = 1 - ticks / maxTicks;
        const dx = (ticks % 2 === 0 ? 1 : -1) * px * decay;
        el.style.transform = ticks >= maxTicks ? '' : `translate(${dx.toFixed(1)}px, 0)`;
        if (ticks >= maxTicks) {
          resolve();
          return;
        }
        window.setTimeout(step, ms / maxTicks);
      };
      step();
    });
  }
}
