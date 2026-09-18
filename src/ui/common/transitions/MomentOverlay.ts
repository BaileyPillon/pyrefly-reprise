/**
 * The DOM half of a *moment*: letterbox bars, the Ink & Gold name slab and the
 * heartbeat vignette.
 *
 * Implements {@link MomentsPort}, so the presenter's `BattleMoments` — which
 * touches no DOM at all — can raise chrome without knowing this file exists.
 * Everything is one shallow tree appended to the battle screen's root and torn
 * down with it; nothing here reads engine state.
 *
 * Which piece serves which moment:
 *
 * | moment              | letterbox | slab              | vignette |
 * | ------------------- | --------- | ----------------- | -------- |
 * | boss reveal         | no        | `reveal` (right)  | no       |
 * | Overdrive           | yes       | `overdrive`       | no       |
 * | charge telegraph    | no        | `telegraph`       | yes      |
 *
 * The slab's geometry is deliberately *not* on the 640x360 authoring grid the
 * HUD uses: it is full-bleed chrome that has to reach the frame's edges at any
 * aspect ratio, so `transitions.css` sizes it in vh/vw with `clamp()`ed type.
 */

import './transitions.css';
import type { MomentsPort } from '../../../engine/BattlePresenterPorts.ts';

type SlabKind = 'reveal' | 'overdrive' | 'telegraph';

/** Default beats per minute for the telegraph throb, if a caller gives none. */
const DEFAULT_BPM = 84;
/** How long a slab takes to slam in / slide out. */
const SLAB_MOVE_MS = 260;
/** Anything shorter than this is not worth animating; the layer just snaps. */
const INSTANT_MS = 16;

export class MomentOverlay implements MomentsPort {
  readonly el: HTMLElement;

  private readonly slab: HTMLElement;
  private readonly slabTitle: HTMLElement;
  private readonly slabSub: HTMLElement;
  private readonly vig: HTMLElement;
  /** Timers for the slab's hold and exit, so a second slab cancels the first. */
  private slabTimers: number[] = [];
  private disposed = false;

  constructor(root: HTMLElement) {
    const doc = root.ownerDocument;
    this.el = doc.createElement('div');
    this.el.className = 'pf-mom';
    this.el.dataset['letterbox'] = '0';

    this.vig = doc.createElement('div');
    this.vig.className = 'pf-mom__vig';
    this.vig.dataset['on'] = '0';

    const top = doc.createElement('div');
    top.className = 'pf-mom__bar pf-mom__bar--top';
    const bottom = doc.createElement('div');
    bottom.className = 'pf-mom__bar pf-mom__bar--bottom';

    this.slab = doc.createElement('div');
    this.slab.className = 'pf-mom__slab';
    this.slab.dataset['on'] = '0';
    const content = doc.createElement('span');
    content.className = 'pf-mom__slab-content';
    this.slabSub = doc.createElement('span');
    this.slabSub.className = 'pf-mom__slab-sub';
    this.slabTitle = doc.createElement('span');
    this.slabTitle.className = 'pf-mom__slab-title';
    content.append(this.slabSub, this.slabTitle);
    this.slab.appendChild(content);

    // Vignette under the bars, slab over both: a name is the one thing in a
    // moment that must never be dimmed by the effect that framed it.
    this.el.append(this.vig, top, bottom, this.slab);
    root.appendChild(this.el);
  }

  // --------------------------------------------------------------- letterbox

  letterbox(on: boolean, ms = 260): Promise<void> {
    if (this.disposed) return Promise.resolve();
    const dur = Math.max(0, ms);
    this.el.style.setProperty('--pf-bar-ms', `${dur}ms`);
    this.el.dataset['letterbox'] = on ? '1' : '0';
    if (dur < INSTANT_MS) return Promise.resolve();
    return new Promise((resolve) => window.setTimeout(resolve, dur));
  }

  // -------------------------------------------------------------------- slab

  /**
   * Slam a name slab in, hold it, slide it out. Resolves once it is gone, so
   * a moment can `await` the plate before letting the payoff play.
   *
   * A `holdMs` of 0 (playback at `'fast'`, which collapses every hold) still
   * *shows* the slab for a frame rather than skipping it: at 'fast' the player
   * is watching, just impatiently, and a boss's name is information.
   */
  nameSlab(opts: {
    title: string;
    subtitle?: string;
    kind: SlabKind;
    holdMs?: number;
  }): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.clearSlabTimers();

    const hold = Math.max(0, opts.holdMs ?? 1200);
    const move = hold < INSTANT_MS ? 0 : SLAB_MOVE_MS;
    this.slab.className = `pf-mom__slab pf-mom__slab--${opts.kind}`;
    this.slab.style.setProperty('--pf-slab-ms', `${move}ms`);
    this.slabTitle.textContent = opts.title;
    this.slabSub.textContent = opts.subtitle ?? (opts.kind === 'telegraph' ? 'CHARGING' : '');
    this.slabSub.hidden = this.slabSub.textContent === '';
    this.slab.dataset['on'] = '1';

    if (hold < INSTANT_MS) {
      this.slab.dataset['on'] = '0';
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.slabTimers.push(
        window.setTimeout(() => {
          this.slab.dataset['on'] = '0';
          this.slabTimers.push(window.setTimeout(resolve, move));
        }, hold),
      );
    });
  }

  // ---------------------------------------------------------------- vignette

  /**
   * The heartbeat. `bpm` drives the CSS animation's period directly, so stage 2
   * of a charge (132 bpm — a frightened pulse) reads faster than stage 1 (84).
   */
  vignette(on: boolean, opts: { bpm?: number; colour?: string } = {}): void {
    if (this.disposed) return;
    if (!on) {
      this.vig.dataset['on'] = '0';
      return;
    }
    const bpm = Math.max(30, Math.min(220, opts.bpm ?? DEFAULT_BPM));
    this.vig.style.setProperty('--pf-vig-ms', `${Math.round(60000 / bpm)}ms`);
    if (opts.colour) this.vig.style.setProperty('--pf-vig-colour', opts.colour);
    this.vig.dataset['on'] = '1';
  }

  // ------------------------------------------------------------------- teardown

  /** Drop every layer, leaving the overlay mounted and reusable. */
  clear(): void {
    this.clearSlabTimers();
    this.el.dataset['letterbox'] = '0';
    this.slab.dataset['on'] = '0';
    this.vig.dataset['on'] = '0';
  }

  /** Clear and unmount. The battle screen calls this on exit. */
  dispose(): void {
    this.clear();
    this.disposed = true;
    this.el.remove();
  }

  private clearSlabTimers(): void {
    for (const t of this.slabTimers) window.clearTimeout(t);
    this.slabTimers = [];
  }
}

/** Mount a fresh overlay inside `root`. */
export function createMomentOverlay(root: HTMLElement): MomentOverlay {
  return new MomentOverlay(root);
}
