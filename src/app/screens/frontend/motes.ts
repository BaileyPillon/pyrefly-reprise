/**
 * The pyreflies drifting up through the title frame.
 *
 * Approved end state: `docs/concepts/polish/showpiece-frontend/after.png` —
 * sixteen motes, sized and placed as the concept placed them, rising slowly
 * and breathing in and out. The positions below are the concept's own
 * 1920x1080 coordinates converted to fractions of the frame, so the built
 * screen puts a mote where the target has one at any window size.
 *
 * Same two rules as `parallax.ts`: **transforms only** inside the loop (the
 * base position is a one-time `left`/`top`, the motion is `translate3d`), and
 * **reduced motion is the still frame**, which is precisely what after.png is.
 *
 * The field is told its pixel size on resize rather than measuring itself, so
 * no frame reads layout.
 */

/** One mote, as the concept authored it, in fractions of the frame. */
interface MoteSeed {
  /** 0..1 across the frame. */
  readonly fx: number;
  /** 0..1 down the frame. */
  readonly fy: number;
  /** Diameter in px on the concept's 1920-wide plate. */
  readonly px: number;
  readonly opacity: number;
}

/** The concept's sixteen, in its own order (after.png, `.mote` spans). */
const SEEDS: readonly MoteSeed[] = [
  { fx: 0.3667, fy: 0.2185, px: 7, opacity: 0.85 },
  { fx: 0.426, fy: 0.3148, px: 12, opacity: 0.55 },
  { fx: 0.3188, fy: 0.3833, px: 5, opacity: 0.9 },
  { fx: 0.4792, fy: 0.2667, px: 9, opacity: 0.6 },
  { fx: 0.551, fy: 0.363, px: 16, opacity: 0.35 },
  { fx: 0.6156, fy: 0.2481, px: 6, opacity: 0.75 },
  { fx: 0.3938, fy: 0.4815, px: 10, opacity: 0.5 },
  { fx: 0.6635, fy: 0.4222, px: 8, opacity: 0.62 },
  { fx: 0.3479, fy: 0.5741, px: 14, opacity: 0.32 },
  { fx: 0.5833, fy: 0.5648, px: 6, opacity: 0.7 },
  { fx: 0.4583, fy: 0.1722, px: 5, opacity: 0.6 },
  { fx: 0.5167, fy: 0.463, px: 11, opacity: 0.45 },
  { fx: 0.7031, fy: 0.3148, px: 7, opacity: 0.55 },
  { fx: 0.3031, fy: 0.263, px: 9, opacity: 0.4 },
  { fx: 0.6333, fy: 0.6389, px: 18, opacity: 0.24 },
  { fx: 0.4094, fy: 0.65, px: 8, opacity: 0.5 },
];

const REFERENCE_W = 1920;
/** Smallest a mote is ever drawn, so it does not vanish on a phone. */
const MIN_PX = 3;
/** Rise, in fractions of the frame height per second. The concept's 7..20 px/s at 1080. */
const RISE_MIN = 7 / 1080;
const RISE_SPAN = 13 / 1080;

export interface MoteFieldOptions {
  /** Static frame when true — after.png itself. */
  readonly reduceMotion?: boolean;
  /** Draw fewer motes (the low-effects tier). Defaults to all sixteen. */
  readonly count?: number;
}

/**
 * The mote layer. Build it into a positioned container, call {@link resize} on
 * every resize and {@link update} once a frame.
 */
export class MoteField {
  private readonly els: HTMLElement[] = [];
  private readonly seeds: MoteSeed[] = [];
  private readonly reduceMotion: boolean;
  private w = REFERENCE_W;
  private h = 1080;
  private t = 0;

  constructor(
    private readonly container: HTMLElement,
    opts: MoteFieldOptions = {},
  ) {
    this.reduceMotion = opts.reduceMotion === true;
    const n = Math.max(0, Math.min(SEEDS.length, opts.count ?? SEEDS.length));
    for (let i = 0; i < n; i++) {
      const seed = SEEDS[i]!;
      const el = document.createElement('span');
      el.className = 'fe-mote';
      el.style.left = `${(seed.fx * 100).toFixed(3)}%`;
      el.style.top = `${(seed.fy * 100).toFixed(3)}%`;
      el.style.opacity = String(seed.opacity);
      container.appendChild(el);
      this.els.push(el);
      this.seeds.push(seed);
    }
    this.sizeMotes();
  }

  /** Tell the field how big its container is. Call on resize, never per frame. */
  resize(width: number, height: number): void {
    this.w = width > 0 ? width : REFERENCE_W;
    this.h = height > 0 ? height : 1080;
    this.sizeMotes();
  }

  /** Advance by `dt` seconds. A no-op under reduced motion. */
  update(dt: number): void {
    if (this.reduceMotion) return;
    const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
    this.t += step;
    for (let i = 0; i < this.els.length; i++) {
      const seed = this.seeds[i]!;
      const el = this.els[i]!;
      // A per-mote speed derived from its size, exactly as the concept did:
      // the big soft ones hang back, the small bright ones climb.
      const s = 0.4 + (seed.px % 7) / 7;
      const riseFrac = (RISE_MIN + s * RISE_SPAN) * this.t;
      // Wrap a full frame height plus a margin, so a mote leaves the top and
      // comes back in under the bottom instead of stopping.
      const span = seed.fy + 1.15;
      const y = -((riseFrac % span) * this.h);
      const x = Math.sin(this.t * 0.8 + i) * (5 + s * 9) * (this.w / REFERENCE_W);
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      el.style.opacity = (seed.opacity * (0.55 + 0.45 * Math.sin(this.t * 1.6 + i * 1.7))).toFixed(3);
    }
  }

  /** Remove every mote from the container. */
  dispose(): void {
    for (const el of this.els) el.remove();
    this.els.length = 0;
    this.seeds.length = 0;
  }

  /** How many motes are on screen — for the tests and the debug snapshot. */
  get size(): number {
    return this.els.length;
  }

  private sizeMotes(): void {
    const k = this.w / REFERENCE_W;
    for (let i = 0; i < this.els.length; i++) {
      const d = Math.max(MIN_PX, this.seeds[i]!.px * k);
      const el = this.els[i]!;
      el.style.width = `${d.toFixed(2)}px`;
      el.style.height = `${d.toFixed(2)}px`;
      el.style.marginLeft = `${(-d / 2).toFixed(2)}px`;
      el.style.marginTop = `${(-d / 2).toFixed(2)}px`;
    }
  }

  /** The container the motes were built into, for a caller that wants to hide it. */
  get root(): HTMLElement {
    return this.container;
  }
}
