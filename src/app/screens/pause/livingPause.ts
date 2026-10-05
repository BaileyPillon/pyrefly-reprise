/**
 * What the pause hands the living portrait: the switches, and where to look (D-143, D-321).
 *
 * - **Switches.** The face lives only while LIVING PAINTINGS is on (the look row and its EYE CANDY master, and `?fx=`) and
 *   REDUCE MOTION is off (the OPTIONS row or the OS). Anything else is today's static plate: no driver, no parts loaded.
 *   The state is polled with the gaze, so a switch flipped on the EYE CANDY page takes effect at once.
 * - **Gaze.** The eyes follow the highlighted row (when the cursor is in a tab's rows) or else the active tab, with no
 *   extra input ({@link highlightPoint} to `PortraitStage.setGaze`, a point in the painting's frame).
 *
 * Game case: both (shared plumbing). Presentation only: no engine state, no RNG (rule 1).
 */

import { eyeCandy } from '../../../engine/fx/EyeCandy.ts';
import { eyeCandyOn } from '../../../engine/fx/eyeCandyFlags.ts';
import { prefersReducedMotion } from '../../../ui/common/transitions/reduceMotion.ts';
import { LivingPortraitDriver } from './LivingPortraitDriver.ts';
import { framePoint, type Point } from './livingGaze.ts';
import type { Scale } from './livingParts.ts';
import type { PortraitStage } from './PortraitStage.ts';

/** How often the switches and the highlight are read (ms): the eyes' own spring does the smoothing. */
const POLL_MS = 140;

/** LIVING PAINTINGS on and REDUCE MOTION off. `reduceMotion` is the settings row; the OS preference is read here too. */
export function livingOn(reduceMotion: boolean): boolean {
  return eyeCandy.enabled('b') && eyeCandyOn('livingPaintings') && !reduceMotion && !prefersReducedMotion();
}

/** The part scale for this device: the phone and LOW EFFECTS tiers take the 1x parts. */
export function livingScale(): Scale {
  return eyeCandy.tier === 'full' ? '2x' : '1x';
}

/** The highlighted row, else the active tab, as a point in the painting's frame; null when neither is laid out. */
export function highlightPoint(root: ParentNode, art: HTMLElement): Point | null {
  const el = root.querySelector<HTMLElement>('.pause__row--sel') ?? root.querySelector<HTMLElement>('.pause__tab--on');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const f = art.getBoundingClientRect();
  if (!(r.width > 0) || !(r.height > 0) || !(f.width > 0)) return null;
  return framePoint(r, f);
}

export class LivingPause {
  private driver: LivingPortraitDriver | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private last: Point = { x: NaN, y: NaN };

  constructor(
    private readonly stage: PortraitStage,
    private readonly root: HTMLElement,
    private readonly art: HTMLElement,
    private readonly reduceMotion: () => boolean,
  ) {}

  /** Attach or detach to match the switches, and aim the eyes. Called after every render and on a short poll. */
  sync(): void {
    if (this.timer === null && typeof setInterval === 'function') this.timer = setInterval(() => this.sync(), POLL_MS);
    const on = livingOn(this.reduceMotion());
    if (on && !this.driver) {
      const driver = new LivingPortraitDriver({ enabled: () => livingOn(this.reduceMotion()), scale: livingScale });
      this.driver = driver;
      this.last = { x: NaN, y: NaN };
      this.stage.attachDriver(driver);
    } else if (!on && this.driver) {
      this.stage.detachDriver();
      this.driver = null;
    }
    if (!this.driver) return;
    const p = highlightPoint(this.root, this.art);
    if (p && (Math.abs(p.x - this.last.x) > 0.004 || Math.abs(p.y - this.last.y) > 0.004 || Number.isNaN(this.last.x))) {
      this.last = p;
      this.stage.setGaze(p.x, p.y);
    }
  }

  /** The driver's state, for tests and captures. */
  snapshot(): Record<string, unknown> | null {
    return this.driver?.snapshot() ?? null;
  }

  dispose(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.driver = null; // the stage disposes it with itself
  }
}
