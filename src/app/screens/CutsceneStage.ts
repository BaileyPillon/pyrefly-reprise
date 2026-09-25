import './cutsceneStage.css';
import { artUrl } from '../../engine/PaintedArt.ts';
import type { HideActorStep, ShowActorStep, StoryScript } from '../../story/dsl.ts';
import { cutsceneFigure, figureBox, figuresIn, type CutsceneFigure, type FigureBox } from './cutsceneFigures.ts';
import { isStagedFx, spawnPyreflies, spawnSendingArc } from './cutsceneFx.ts';

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
}

export class CutsceneStage {
  /** Holds the figures, the effects and (mounted by the screen) the dialogue box. What `shake` moves. */
  readonly shakeEl: HTMLElement;
  private readonly figuresEl: HTMLElement;
  private readonly fxEl: HTMLElement;
  private readonly flashEl: HTMLElement;
  private readonly figures = new Map<string, HTMLElement>();
  private readonly timers = new Set<number>();

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
    this.shakeEl.append(this.figuresEl, this.fxEl);
    this.flashEl = doc.createElement('div');
    this.flashEl.className = 'cutscene__flash';
  }

  mount(): void {
    this.root.append(this.shakeEl, this.flashEl);
  }

  unmount(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers.clear();
    this.figures.clear();
    this.shakeEl.remove();
    this.flashEl.remove();
  }

  /**
   * Build, off stage, every figure `script` brings on, so each painting is
   * loading while the screen fades in rather than popping in late.
   */
  prepare(script: StoryScript): void {
    for (const actor of figuresIn(script)) this.figureEl(actor);
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
    const fig = cutsceneFigure(step.actor);
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
    const fig: CutsceneFigure | undefined = at ? cutsceneFigure(at) : undefined;
    return figureBox(fig, w, h);
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

  private figureEl(actor: string): HTMLElement | null {
    const existing = this.figures.get(actor);
    if (existing) return existing;
    const fig = cutsceneFigure(actor);
    if (!fig) return null;
    const doc = this.root.ownerDocument;
    const el = doc.createElement('div');
    el.className = 'cutscene__figure';
    el.dataset['actor'] = actor;
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
    this.figures.set(actor, el);
    return el;
  }
}
