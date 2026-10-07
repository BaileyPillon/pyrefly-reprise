import './cutsceneStage.css';
import { loadArtManifest, manifestKnowsAssetNow } from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import type { HideActorStep, SetPoseStep, ShowActorStep, StoryScript } from '../../story/dsl.ts';
import {
  cutsceneFigureIn,
  figureBox,
  figuresIn,
  type CutsceneFigure,
  type FigureBox,
  type PosePainting,
  type StoryPose,
} from './cutsceneFigures.ts';
import { isStagedFx, spawnPyreflies, spawnSendingArc } from './cutsceneFx.ts';
import { attachUnsentAura, type AuraHandle } from './cutsceneAura.ts';

/**
 * The stage a `CutsceneScreen` draws on: the layers between its backdrop and
 * its dialogue box, and the ports that act on them.
 *
 * Until this existed the screen drew every `fx()` as the same white flash and
 * ignored `showActor`/`hideActor` outright, so a scene whose whole point is a
 * figure leaving (Yuna sending Lady Ginnem, Chapter IX's post scene) was told
 * only in dialogue over an empty cave. It now honours, for every chapter:
 *
 * - **`showActor`** for a figure listed in `cutsceneFigures.ts` (anyone else
 *   is still a no-op: see that file for why);
 * - **`hideActor`** for any figure on stage: a fade that brightens and lifts,
 *   awaited for its `ms` like the battle stage's;
 * - **`fx('pyreflies-rising' | 'sending-dance', at)`** as drawn effects at the
 *   named figure, or mid-stage when it is not staged. Every other key keeps
 *   the 90 ms flash.
 *
 * **Game case: both** (shared plumbing, CHK-020). Which chapters' scenes this
 * changes is measured in `tests/unit/cutscene-stage.test.ts`.
 */

/** `showActor`/`hideActor` with no `ms`: the battle stage's default fade (`story/registry.ts`). */
const DEFAULT_ACTOR_FADE_MS = 300;

/** How long a staged kneel / fall takes to settle. */
const POSE_MS = 700;

/** The flash an `fx()` key with no drawn effect has always made. */
const FX_FLASH_MS = 90;

export interface CutsceneStageOptions {
  /**
   * The screen's pausable wait. A fade's `ms` is script time, so it holds
   * behind the pause menu like every other timed step. Defaults to a timer.
   */
  wait?: (ms: number) => Promise<void>;
  /** True while the scene is being skipped: effects are not worth drawing then. */
  skipping?: () => boolean;
  /**
   * The chapter's art namespace (`data/art/artNamespace.ts`; the experimental Leblanc chapter): a staged figure that namespace paints
   * stands on its own painting (`cutsceneFigureIn`). Absent: the base art, exactly as always.
   */
  artNamespace?: string;
}

export class CutsceneStage {
  /** Holds the figures, the effects and (mounted by the screen) the dialogue box. What `shake` moves. */
  readonly shakeEl: HTMLElement;
  private readonly figuresEl: HTMLElement;
  private readonly fxEl: HTMLElement;
  private readonly flashEl: HTMLElement;
  private readonly veilEl: HTMLElement;
  private veiledNow = false;
  private readonly figures = new Map<string, HTMLElement>();
  private readonly timers = new Set<number>();
  private readonly auras: AuraHandle[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly opts: CutsceneStageOptions = {},
  ) {
    const doc = root.ownerDocument;
    this.shakeEl = doc.createElement('div');
    this.shakeEl.className = 'cutscene__shake';
    this.figuresEl = doc.createElement('div');
    this.figuresEl.className = 'cutscene__figures';
    this.fxEl = doc.createElement('div');
    this.fxEl.className = 'cutscene__fx';
    this.veilEl = doc.createElement('div');
    this.veilEl.className = 'cutscene__veil';
    // Before the dialogue box, which `DialogueBox.mount` appends after it: see `veil()`.
    this.shakeEl.append(this.figuresEl, this.fxEl, this.veilEl);
    this.flashEl = doc.createElement('div');
    this.flashEl.className = 'cutscene__flash';
  }

  mount(): void {
    this.root.append(this.shakeEl, this.flashEl);
  }

  unmount(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers.clear();
    for (const a of this.auras) a.stop();
    this.auras.length = 0;
    this.figures.clear();
    this.shakeEl.remove();
    this.flashEl.remove();
  }

  /**
   * Build, off stage, every figure `script` brings on, so each painting is
   * loading while the screen fades in rather than popping in late.
   */
  prepare(script: StoryScript): void {
    const actors = figuresIn(script);
    for (const actor of actors) this.figureEl(actor);
    // Their story-pose paintings too (D-301), once the manifest says they are installed, so a kneel is not a pop-in.
    void loadArtManifest().then(() => {
      for (const actor of actors) {
        const fig = this.figureOf(actor);
        for (const pose of Object.keys(fig?.poses ?? {}) as StoryPose[]) {
          const p = fig ? paintedPose(fig, pose) : undefined;
          if (p) new Image().src = artUrl(p.art);
        }
      }
    });
  }

  /** True when `actor` is standing on the stage now. */
  onStage(actor: string): boolean {
    return this.figures.get(actor)?.classList.contains('is-on') === true;
  }

  /** Staged actors currently on stage, for snapshots. */
  cast(): string[] {
    return [...this.figures.keys()].filter((a) => this.onStage(a));
  }

  // ------------------------------------------------------------------ ports

  showActor(step: ShowActorStep): Promise<void> {
    const fig = this.figureOf(step.actor);
    if (!fig) return Promise.resolve();
    const el = this.figureEl(step.actor);
    if (!el) return Promise.resolve();
    const ms = step.ms ?? DEFAULT_ACTOR_FADE_MS;
    if (step.facing) el.classList.toggle('is-flipped', step.facing !== fig.artFacing);
    el.style.transitionDuration = `${ms}ms`;
    el.classList.remove('is-leaving');
    el.classList.add('is-on');
    return ms > 0 ? this.wait(ms) : Promise.resolve();
  }

  hideActor(step: HideActorStep): Promise<void> {
    const el = this.figures.get(step.actor);
    if (!el || !el.classList.contains('is-on')) return Promise.resolve();
    const ms = step.ms ?? DEFAULT_ACTOR_FADE_MS;
    el.style.transitionDuration = `${ms}ms`;
    el.classList.remove('is-on');
    el.classList.add('is-leaving');
    return ms > 0 ? this.wait(ms) : Promise.resolve();
  }

  /**
   * `setPose` on a staged figure. With its own painting for the pose (`poses`, D-301; installed, so
   * the art manifest lists it) the figure shows that painting on its own feet line and centre: the
   * kneel sinks where he stood, the fall's prone canvas lies there, and the old painting fades off
   * over it. Without one, a figure with `stagesUnpaintedPoses` (PR-0244) has its standing painting
   * lowered and dimmed for `kneel` and laid down for `ko`. Any other pose stands the idle up again.
   * Instant, like the runner's other zero-length steps; a figure posed before it is shown simply
   * fades in already down. Every other figure: no-op, as it always was.
   */
  setPose(step: SetPoseStep): void {
    const fig = this.figureOf(step.actor);
    if (!fig) return;
    const painting = paintedPose(fig, step.state);
    if (!painting && !fig.stagesUnpaintedPoses && !this.figures.get(step.actor)?.classList.contains('is-painted-pose')) return;
    const el = this.figureEl(step.actor);
    if (!el) return;
    el.style.transitionDuration = `${POSE_MS}ms`;
    this.paint(el, fig, painting);
    const staged = !painting && fig.stagesUnpaintedPoses === true;
    el.classList.toggle('is-kneel', staged && step.state === 'kneel');
    el.classList.toggle('is-ko', staged && step.state === 'ko');
  }

  /**
   * A drawn effect resolves as soon as it is handed to the stage, the way the
   * battle stage's does (`story/registry.ts`): the script's next `wait` or
   * `hideActor` plays under it.
   */
  fx(key: string, at?: string): Promise<void> {
    if (!isStagedFx(key)) return this.flash(undefined, FX_FLASH_MS);
    if (this.opts.skipping?.()) return Promise.resolve();
    const { w, h } = this.size();
    const box = this.anchor(at, w, h);
    if (key === 'pyreflies-rising') spawnPyreflies(this.fxEl, box, h);
    else spawnSendingArc(this.fxEl, box, w, h);
    return Promise.resolve();
  }

  flash(color: string | undefined, ms: number): Promise<void> {
    const el = this.flashEl;
    el.style.background = color ?? '#ffffff';
    el.style.transitionDuration = '0ms';
    el.style.opacity = '0.7';
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        el.style.transitionDuration = `${ms}ms`;
        el.style.opacity = '0';
        window.setTimeout(resolve, ms);
      });
    });
  }

  /** True while a script's `fade('black')` holds the scene under the veil. */
  get veiled(): boolean {
    return this.veiledNow;
  }

  /**
   * A script's `fade('black')` / `fade('clear')`: black over the backdrop, the
   * figures and the effects, **under** the dialogue box.
   *
   * The screen used to hand this to `App.fade`, whose `#fade` layer sits over
   * all of `#ui` (index.html, z-index 20 over 10), so every line narrated after
   * a fade to black played on a blank screen: Chapter I's epilogue, and the
   * close of Yunalesca, Braska's Final Aeon, Seymour and Anima, Evrae and
   * Isaaru. The veil lives in the shake layer just before the box (z 5 under
   * the box's 6, in the same stacking context even mid-shake), so the line
   * reads on black the way the scripts were written. The chapter eyebrow goes
   * under it too. `'white'` stays black, as it always drew here.
   * **Game case: both** (shared plumbing, CHK-020).
   */
  veil(on: boolean, ms: number): Promise<void> {
    this.veiledNow = on;
    const dur = `${Math.max(0, ms)}ms`;
    this.veilEl.style.transitionDuration = dur;
    this.root.style.setProperty('--cutscene-veil-ms', dur);
    this.veilEl.classList.toggle('is-on', on);
    this.root.classList.toggle('is-veiled', on);
    return ms > 0 ? this.wait(ms) : Promise.resolve();
  }

  shake(px: number, ms: number): Promise<void> {
    const el = this.shakeEl;
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

  // --------------------------------------------------------------- helpers

  /** Where an effect `at` an actor plays: on the staged figure, or mid-stage. */
  private anchor(at: string | undefined, w: number, h: number): FigureBox {
    const fig: CutsceneFigure | undefined = at ? this.figureOf(at) : undefined;
    return figureBox(fig, w, h);
  }

  /** The staged figure for `actor`: the base art's, or the chapter's art namespace's own painting of it (`cutsceneFigureIn`). */
  private figureOf(actor: string): CutsceneFigure | undefined {
    return cutsceneFigureIn(this.opts.artNamespace, actor);
  }

  private size(): { w: number; h: number } {
    const w = this.root.clientWidth || window.innerWidth || 1280;
    const h = this.root.clientHeight || window.innerHeight || 720;
    return { w, h };
  }

  private wait(ms: number): Promise<void> {
    if (this.opts.wait) return this.opts.wait(ms);
    return new Promise((resolve) => this.later(resolve, ms));
  }

  private later(fn: () => void, ms: number): void {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  /**
   * Put `painting` (or the idle, when undefined) on `el`, sized from its own sidecar numbers. A figure
   * already on stage leaves a copy of the old painting over the new one that fades off (`POSE_MS`).
   */
  private paint(el: HTMLElement, fig: CutsceneFigure, painting: PosePainting | undefined): void {
    const art = painting?.art ?? fig.art;
    if (el.dataset['art'] === art) return;
    if (el.classList.contains('is-on') && !this.opts.skipping?.()) {
      const ghost = el.cloneNode(true) as HTMLElement;
      ghost.classList.add('is-ghost');
      delete ghost.dataset['actor'];
      el.after(ghost);
      this.later(() => (ghost.style.opacity = '0'), 20);
      this.later(() => ghost.remove(), POSE_MS + 60);
    }
    el.dataset['art'] = art;
    el.classList.toggle('is-painted-pose', painting !== undefined);
    const { landscape: l, portrait: p } = fig;
    const k = painting?.heightOfIdle ?? 1;
    el.style.setProperty('--x-l', String(painting?.landscapeX ?? l.x));
    el.style.setProperty('--x-p', String(painting?.portraitX ?? p.x));
    el.style.setProperty('--h-l', String(l.height * k));
    el.style.setProperty('--h-p', String(p.height * k));
    el.style.setProperty('--baseline', String(painting?.baseline ?? fig.baseline));
    el.style.setProperty('--aspect', String(painting?.aspect ?? fig.aspect));
    const img = el.querySelector('img');
    if (img) img.src = artUrl(art);
  }

  private figureEl(actor: string): HTMLElement | null {
    const existing = this.figures.get(actor);
    if (existing) return existing;
    const fig = this.figureOf(actor);
    if (!fig) return null;
    const doc = this.root.ownerDocument;
    const el = doc.createElement('div');
    el.className = 'cutscene__figure';
    el.dataset['actor'] = actor;
    el.dataset['art'] = fig.art;
    el.classList.toggle('is-unsent', fig.unsent === true);
    const { landscape: l, portrait: p } = fig;
    el.style.cssText =
      `--x-l:${l.x};--feet-l:${l.feet};--h-l:${l.height};` +
      `--x-p:${p.x};--feet-p:${p.feet};--h-p:${p.height};` +
      `--baseline:${fig.baseline};--aspect:${fig.aspect}`;
    const img = doc.createElement('img');
    img.className = 'cutscene__figure-art';
    img.alt = '';
    img.decoding = 'async';
    img.src = artUrl(fig.art);
    el.appendChild(img);
    this.figuresEl.appendChild(el);
    if (fig.aura) this.auras.push(attachUnsentAura(el, fig.art));
    this.figures.set(actor, el);
    return el;
  }
}

/**
 * `fig`'s own painting for `pose`, only when the art manifest lists it (installed). No manifest yet, or not
 * listed: undefined, so the figure keeps its staging and nothing is requested that is not there.
 */
export function paintedPose(fig: CutsceneFigure, pose: string): PosePainting | undefined {
  const p = (fig.poses as Partial<Record<string, PosePainting>> | undefined)?.[pose];
  return p && manifestKnowsAssetNow(artUrl(p.art)) === true ? p : undefined;
}
