/**
 * The drift behind the title card.
 *
 * Approved end state: `docs/concepts/polish/showpiece-frontend/after.png` plus
 * its `motion.webm` — "the title screen becomes painted key art split into
 * parallax planes ... and pyreflies drifting up through the frame"
 * (`card.json`). The concept's `motion.html` drives the same three things this
 * module drives: a far plane, a near plane and the figures on the shore, each
 * offset by its own depth.
 *
 * Rules this obeys, because the card names them as the risk:
 * - **Slow.** The idle drift is a sine at {@link IDLE_PERIOD_S}; at full
 *   amplitude a plane crosses a few pixels a second. Nothing here can outrun
 *   the serif it sits behind.
 * - **Transforms only.** Every frame writes `transform` on the layers it owns
 *   and nothing else, so no frame costs a layout
 *   (`docs/plans/build-b-review.md` acceptance, item 1).
 * - **Reduced motion is a static composition**, not a slower one: the base
 *   transform is written once and the loop never starts.
 *
 * Pure enough to test in jsdom: the caller owns the clock, `update(dt)` is the
 * only thing that moves, and the transforms it writes are readable off
 * `el.style.transform`.
 */

/** One painted plane, with how far it moves relative to the input. */
export interface ParallaxLayer {
  readonly el: HTMLElement;
  /**
   * Depth multiplier. `0` is nailed to the frame, `1` is the front plane's
   * full travel. The concept's cut: far 0.35, near 1, figures 1.35.
   */
  readonly depth: number;
  /** Scale the layer is held at, so its edges never enter the frame. */
  readonly scale?: number;
  /** Extra offset in px applied before the drift, from the concept's plate cut. */
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export interface ParallaxOptions {
  readonly layers: readonly ParallaxLayer[];
  /** Static composition when true: the loop never runs. */
  readonly reduceMotion?: boolean;
  /** Travel in px of the front plane at full pointer deflection. Default 26. */
  readonly amplitudeX?: number;
  /** Vertical travel, deliberately smaller. Default 14. */
  readonly amplitudeY?: number;
}

/** Full sweep of the unattended drift, in seconds. Slow on purpose. */
const IDLE_PERIOD_S = 26;
/** How much of the amplitude the unattended drift uses. */
const IDLE_FRACTION = 0.55;
/** Seconds for the aim to travel most of the way to a new pointer position. */
const FOLLOW_TAU_S = 0.42;

function clamp1(v: number): number {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

/**
 * A drifting stack of planes.
 *
 * The caller feeds it aim from whatever device is in the player's hands —
 * {@link setPointer} for mouse and touch, {@link setStick} for a gamepad — and
 * calls {@link update} once a frame. With no aim at all it drifts on its own,
 * which is the state the screen is in for the first four seconds.
 */
export class ParallaxField {
  private readonly layers: readonly ParallaxLayer[];
  private readonly reduceMotion: boolean;
  private readonly ampX: number;
  private readonly ampY: number;

  /** Where the player is pointing, -1..1. */
  private aimX = 0;
  private aimY = 0;
  /** Where the planes actually are — chases the aim, never snaps to it. */
  private atX = 0;
  private atY = 0;
  private t = 0;

  constructor(opts: ParallaxOptions) {
    this.layers = opts.layers;
    this.reduceMotion = opts.reduceMotion === true;
    this.ampX = opts.amplitudeX ?? 26;
    this.ampY = opts.amplitudeY ?? 14;
    this.write();
  }

  /** Pointer position over the screen, in -1..1 from the centre. */
  setPointer(nx: number, ny: number): void {
    this.aimX = clamp1(nx);
    this.aimY = clamp1(ny);
  }

  /** Gamepad stick / dpad axes, in the same -1..1. A dead stick idles. */
  setStick(x: number, y: number): void {
    if (Math.abs(x) < 0.12 && Math.abs(y) < 0.12) return;
    this.aimX = clamp1(x);
    this.aimY = clamp1(y);
  }

  /** Advance by `dt` seconds and write the frame's transforms. */
  update(dt: number): void {
    if (this.reduceMotion) return;
    const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
    this.t += step;

    // Unattended drift, so the screen is alive before anyone touches it. It is
    // added to the aim rather than replaced by it: a player moving the mouse
    // still feels the sea breathing underneath.
    const phase = (this.t / IDLE_PERIOD_S) * Math.PI * 2;
    const idleX = Math.sin(phase) * IDLE_FRACTION;
    const idleY = Math.sin(phase * 0.61) * IDLE_FRACTION * 0.5;

    const k = step <= 0 ? 1 : 1 - Math.exp(-step / FOLLOW_TAU_S);
    this.atX += (this.aimX - this.atX) * k;
    this.atY += (this.aimY - this.atY) * k;

    this.write(clamp1(this.atX + idleX), clamp1(this.atY + idleY));
  }

  /** The current -1..1 offsets, for tests and the debug snapshot. */
  offset(): { x: number; y: number } {
    return { x: this.atX, y: this.atY };
  }

  private write(x = 0, y = 0): void {
    for (const layer of this.layers) {
      const dx = (layer.offsetX ?? 0) - x * this.ampX * layer.depth;
      const dy = (layer.offsetY ?? 0) - y * this.ampY * layer.depth;
      const scale = layer.scale ?? 1;
      layer.el.style.transform =
        `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale})`;
    }
  }
}

/**
 * Convert a pointer event's client position into the -1..1 the field wants.
 * Exported so the screen and its test agree on the mapping.
 */
export function normalisePointer(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const w = width > 0 ? width : 1;
  const h = height > 0 ? height : 1;
  return { x: clamp1((clientX / w) * 2 - 1), y: clamp1((clientY / h) * 2 - 1) };
}
