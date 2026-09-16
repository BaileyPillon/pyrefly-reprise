/**
 * Ink & Gold — the turn-start portrait cut-in.
 *
 * Spec (docs/handoff/presentation-ink-and-gold.md, "Screens" > "Turn cut-in"
 * and "Motion & camera"): a 620x880 @1440 ivory slab holds the actor's
 * portrait, an 8px gold stripe on its trailing edge, a 300px serif ghost of
 * their name behind it at 16% gold, and a `YOUR TURN · CTB n OF m` label
 * above their name at bottom-left. It "slams in from the left in 180ms,
 * overshoots to -24deg skew and settles at -12deg".
 *
 * Command rows are NOT part of this — the spec places the command stack
 * beside the cut-in (`large command stack at 640,176`), and it's live,
 * selection-driven UI that belongs to whoever owns the HUD. Same for the
 * "ink .82 info slab" describing the selected ability: it depends on live
 * menu state this module never sees. Both can be built with `.ig-cmd-stack
 * --lg` and `.ig-cutin__info*` from slabs.css to match this cut-in visually.
 *
 * `side: 'right'` is this module's mirror for the FFX-2 variant (spec "Not
 * mocked yet": "cut-ins from the right") — an approximation, since no FFX-2
 * mockup exists to quote exact numbers from; see the final report / README.
 */

import './tokens.css';
import './slabs.css';
import { prefersReducedMotion } from './wipe.ts';

export type CutInSide = 'left' | 'right';

export interface TurnCutInOptions {
  /** Actor name, shown as both the bottom-left title and the ghost behind the slab. */
  name: string;
  /** Portrait image src for the slab's tall crop. */
  portraitUrl: string;
  /** The variable part of the turn label, e.g. "CTB 1 OF 3". Rendered as `YOUR TURN · ${ctbLabel}`. */
  ctbLabel: string;
  /** Which edge the slab slams in from. 'right' is the FFX-2 mirror. Default 'left'. */
  side?: CutInSide;
}

export interface TurnCutInHandle {
  /** The mounted root element, appended to `root`. */
  readonly el: HTMLElement;
  /** Plays the exit motion (or removes instantly under reduced motion) and resolves once gone. */
  dismiss(): Promise<void>;
}

/** Spec: "slams in ... in 180ms". Split into a fast overshoot phase and a short settle phase. */
const SLAM_MS = 180;
const SLAM_OVERSHOOT_MS = 120;
const SLAM_SETTLE_MS = SLAM_MS - SLAM_OVERSHOOT_MS;
/** Not specified by the spec (only the entrance carries a quoted duration); this module's own choice. */
const DISMISS_MS = 150;

const REST_SKEW_DEG = -12; // --ig-slab-skew
const OVERSHOOT_SKEW_DEG = -24; // spec: "overshoots to -24deg skew"

/** Logical px @ spec-px/2.25 — see tokens.css's authoring-convention note. */
const GEOM = {
  slabLeft: -40, // -90
  slabTop: -13.33, // -30
  slabWidth: 275.56, // 620
  slabHeight: 391.11, // 880
  portraitLeft: 26.67, // 60
  portraitHeight: 417.78, // 940
  stripeLeft: 227.56, // 512
  stripeWidth: 3.56, // 8
  ghostLeft: 208.89, // 470
  ghostTop: 26.67, // 60
  ghostFontSize: 133.33, // 300
  labelLeft: 26.67, // 60
  labelBottom: 26.67, // 60
} as const;

/** Mirrors a left-edge x-coordinate (measured from the frame's left) for the 'right' side. */
function mirrorX(leftPx: number, widthPx: number, frameWidth = 640): number {
  return frameWidth - leftPx - widthPx;
}

/**
 * Mounts the cut-in over `root` and plays its entrance. Reduced motion skips
 * straight to the settled pose (spec: "instant cut" convention used
 * throughout this module, matching wipe.ts).
 */
export function showTurnCutIn(root: HTMLElement, opts: TurnCutInOptions): TurnCutInHandle {
  const side: CutInSide = opts.side ?? 'left';
  const reduced = prefersReducedMotion();
  const doc = root.ownerDocument;

  const el = doc.createElement('div');
  el.className = 'ig-cutin';
  el.dataset['side'] = side;

  const ghost = doc.createElement('div');
  ghost.className = 'ig-cutin__ghost';
  ghost.textContent = opts.name;
  ghost.style.fontSize = `${GEOM.ghostFontSize}px`;
  ghost.style.letterSpacing = '-0.03em';
  positionMirrored(ghost, side, GEOM.ghostLeft, GEOM.ghostTop, 'top');

  const slab = doc.createElement('div');
  slab.className = 'ig-cutin__slab';
  slab.style.width = `${GEOM.slabWidth}px`;
  slab.style.height = `${GEOM.slabHeight}px`;
  positionMirrored(slab, side, GEOM.slabLeft, GEOM.slabTop, 'top', GEOM.slabWidth);

  const portrait = doc.createElement('img');
  portrait.className = 'ig-cutin__portrait';
  portrait.src = opts.portraitUrl;
  portrait.alt = '';
  portrait.style.left = `${GEOM.portraitLeft}px`;
  portrait.style.top = '0';
  portrait.style.height = `${GEOM.portraitHeight}px`;
  portrait.style.transform = `skewX(${mirroredDeg(side, -REST_SKEW_DEG)}deg)`; // counter-skews the slab
  slab.append(portrait, makeFade(doc));

  const stripe = doc.createElement('div');
  stripe.className = 'ig-cutin__stripe';
  stripe.style.width = `${GEOM.stripeWidth}px`;
  stripe.style.height = `${GEOM.slabHeight}px`;
  positionMirrored(stripe, side, GEOM.stripeLeft, GEOM.slabTop, 'top', GEOM.stripeWidth);
  mirrorSkew(stripe, side, REST_SKEW_DEG);

  const label = doc.createElement('div');
  label.className = 'ig-cutin__label';
  positionMirrored(label, side, GEOM.labelLeft, GEOM.labelBottom, 'bottom');
  const ctb = doc.createElement('div');
  ctb.className = 'ig-cutin__ctb';
  ctb.textContent = `YOUR TURN · ${opts.ctbLabel}`;
  const name = doc.createElement('div');
  name.className = 'ig-cutin__name';
  name.textContent = opts.name;
  label.append(ctb, name);

  el.append(ghost, slab, stripe, label);
  root.appendChild(el);

  if (reduced) {
    mirrorSkew(slab, side, REST_SKEW_DEG);
  } else {
    animateEntrance(slab, side);
  }

  return {
    el,
    dismiss: () => dismiss(el, slab, side, reduced),
  };
}

function makeFade(doc: Document): HTMLElement {
  const fade = doc.createElement('div');
  fade.className = 'ig-cutin__fade';
  return fade;
}

/**
 * Sets the vertical anchor (`top` or `bottom`) plus `left`/`right`, mirroring
 * the horizontal offset to the opposite edge for `side: 'right'`.
 */
function positionMirrored(
  el: HTMLElement,
  side: CutInSide,
  leftPx: number,
  verticalPx: number,
  verticalSide: 'top' | 'bottom',
  widthPx = 0,
): void {
  el.style[verticalSide] = `${verticalPx}px`;
  if (side === 'left') {
    el.style.left = `${leftPx}px`;
  } else {
    el.style.right = `${mirrorX(leftPx, widthPx)}px`;
  }
}

/** Mirrors a skew angle (in degrees) for the 'right' side; identity for 'left'. */
function mirroredDeg(side: CutInSide, deg: number): number {
  return side === 'right' ? -deg : deg;
}

/** Applies `skewX`, mirrored for the 'right' side. */
function mirrorSkew(el: HTMLElement, side: CutInSide, deg: number): void {
  el.style.transform = `skewX(${mirroredDeg(side, deg)}deg)`;
}

/** Slide-in-and-overshoot, per spec: 180ms total, settle skew in the last 60ms. */
function animateEntrance(slab: HTMLElement, side: CutInSide): void {
  const offscreen = side === 'right' ? '100%' : '-100%';
  const overshootDeg = mirroredDeg(side, OVERSHOOT_SKEW_DEG);
  const restDeg = mirroredDeg(side, REST_SKEW_DEG);

  slab.style.transition = 'none';
  slab.style.transform = `translateX(${offscreen}) skewX(${overshootDeg}deg)`;
  void slab.getBoundingClientRect(); // force layout before animating away from the line above

  slab.style.transition = `transform ${SLAM_OVERSHOOT_MS}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
  slab.style.transform = `translateX(0%) skewX(${overshootDeg}deg)`;

  window.setTimeout(() => {
    slab.style.transition = `transform ${SLAM_SETTLE_MS}ms ease-out`;
    slab.style.transform = `translateX(0%) skewX(${restDeg}deg)`;
  }, SLAM_OVERSHOOT_MS);
}

function dismiss(el: HTMLElement, slab: HTMLElement, side: CutInSide, reduced: boolean): Promise<void> {
  if (reduced) {
    el.remove();
    return Promise.resolve();
  }
  const offscreen = side === 'right' ? '100%' : '-100%';
  const restDeg = mirroredDeg(side, REST_SKEW_DEG);
  return new Promise<void>((resolve) => {
    slab.style.transition = `transform ${DISMISS_MS}ms ease-in`;
    slab.style.transform = `translateX(${offscreen}) skewX(${restDeg}deg)`;
    window.setTimeout(() => {
      el.remove();
      resolve();
    }, DISMISS_MS);
  });
}
