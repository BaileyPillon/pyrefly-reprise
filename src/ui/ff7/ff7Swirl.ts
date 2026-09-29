/**
 * **F1: FF7's swirl into battle** (FF7 only; Bailey, 2026-09-27, "I'll go with
 * all of your recommendations", accepting D-244's F1). FF7 enters a fight by
 * grabbing the field screen and applying a rotating, zooming distortion
 * (written sources: a beetle-psx issue #199 and a Steam thread, cited by
 * Lifestream Encore's research; not re-checked here); ours enters from chapter
 * select, so the frozen board is what twists: about 1 s of twist and zoom,
 * lightening, then a cut to black, the battle swapped in under the black, and
 * the field fading up (the opening camera then settles, `BattleScreenFf7Opening.ts`).
 *
 * How: the whole page (`#app`: the board's canvas and its DOM together) gets
 * an SVG displacement filter whose map is a vortex, drawn once in a 128 px
 * canvas, plus a CSS turn and zoom; nothing is captured and nothing retail is
 * used (every value is ours). Reduced motion, or a skipped playback, cuts
 * straight to the battle. Only the FF7 experiment calls it; every chapter keeps
 * the house swirl.
 */

import { prefersReducedMotion } from '../common/transitions/reduceMotion.ts';

/** The twist, the cut to black and the fade up, ms. Our estimate (the sheet: 0.4 s twisting, 1.0 s full twist and cut). */
export const FF7_SWIRL_MS = { twist: 1000, black: 120, fadeUp: 360 } as const;

const FILTER_ID = 'ff7-swirl-filter';
/** Largest displacement in the map, as a fraction of the element (the map encodes -K..K as 0..1). */
const K = 0.5;

/** A vortex map: each texel says where to sample, `angle(r) = 2.6 (1 - r)^2` radians round the centre. */
export function vortexMap(size = 128): string | null {
  const c = typeof document === 'undefined' ? null : document.createElement('canvas');
  const g = c?.getContext('2d');
  if (!c || !g) return null;
  c.width = c.height = size;
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / size - 0.5;
      const py = (y + 0.5) / size - 0.5;
      const r = Math.min(1, Math.hypot(px, py) / 0.5);
      const a = 2.6 * (1 - r) * (1 - r);
      const qx = px * Math.cos(a) - py * Math.sin(a);
      const qy = px * Math.sin(a) + py * Math.cos(a);
      const i = (y * size + x) * 4;
      img.data[i] = Math.round(255 * Math.max(0, Math.min(1, 0.5 + (qx - px) / (2 * K))));
      img.data[i + 1] = Math.round(255 * Math.max(0, Math.min(1, 0.5 + (qy - py) / (2 * K))));
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

function ensureFilter(): SVGFEDisplacementMapElement | null {
  const existing = document.getElementById(FILTER_ID)?.querySelector('feDisplacementMap');
  if (existing) return existing as SVGFEDisplacementMapElement;
  const map = vortexMap();
  if (!map) return null;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML =
    `<filter id="${FILTER_ID}" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">` +
    `<feImage href="${map}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map"/>` +
    '<feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.appendChild(svg);
  return svg.querySelector('feDisplacementMap');
}

const frame = (): Promise<number> => new Promise((r) => requestAnimationFrame(r));
const ease = (u: number): number => u * u * (3 - 2 * u);

export interface Ff7SwirlOptions {
  /** Cut at once (playback `'skip'`); reduced motion cuts too. */
  instant?: boolean;
  /** Swap the battle in, under the black; the fade up waits for it. */
  onCover: () => Promise<unknown>;
  /**
   * r29 PR-0222: the battle's art loading (`battlePreload`). The twisted board holds on screen
   * until it settles, at most {@link FF7_HOLD_MAX_MS}, so a cold load is not 20-30 s of pure black.
   */
  hold?: Promise<unknown>;
}

/** Longest the twisted board holds for the art before the cut to black (then the swap waits as before). */
export const FF7_HOLD_MAX_MS = 30000;

/** Twist the frozen board away, cut to black, swap, fade up. Resolves once the field is visible. */
export async function playFf7Swirl(root: HTMLElement, opts: Ff7SwirlOptions): Promise<void> {
  if (opts.instant || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
    await opts.onCover();
    return;
  }
  const target = (root.parentElement as HTMLElement | null) ?? root;
  const disp = ensureFilter();
  const black = document.createElement('div');
  black.className = 'ff7-swirl-black';
  black.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:900';
  document.body.appendChild(black);
  const prior = { filter: target.style.filter, transform: target.style.transform, origin: target.style.transformOrigin };
  target.style.transformOrigin = '50% 50%';
  document.documentElement.dataset['ff7Swirl'] = 'twist';
  const t0 = performance.now();
  for (;;) {
    const u = Math.min(1, (performance.now() - t0) / FF7_SWIRL_MS.twist);
    const e = ease(u);
    disp?.setAttribute('scale', String(2 * K * e));
    target.style.filter = `${disp ? `url(#${FILTER_ID}) ` : ''}brightness(${(1 + 1.6 * e * e).toFixed(3)}) saturate(${(1 - 0.5 * e).toFixed(3)})`;
    target.style.transform = `rotate(${(220 * e * e).toFixed(2)}deg) scale(${(1 + 0.9 * e).toFixed(3)})`;
    if (u >= 1) break;
    await frame();
  }
  if (opts.hold) {
    document.documentElement.dataset['ff7Swirl'] = 'hold';
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([opts.hold.catch(() => undefined), new Promise((r) => (timer = setTimeout(r, FF7_HOLD_MAX_MS)))]);
    clearTimeout(timer);
  }
  black.style.opacity = '1';
  document.documentElement.dataset['ff7Swirl'] = 'black';
  await frame();
  target.style.filter = prior.filter;
  target.style.transform = prior.transform;
  target.style.transformOrigin = prior.origin;
  disp?.setAttribute('scale', '0');
  try {
    await opts.onCover();
  } finally {
    await new Promise((r) => setTimeout(r, FF7_SWIRL_MS.black));
    black.style.transition = `opacity ${FF7_SWIRL_MS.fadeUp}ms ease-out`;
    black.style.opacity = '0';
    document.documentElement.dataset['ff7Swirl'] = 'fade';
    await new Promise((r) => setTimeout(r, FF7_SWIRL_MS.fadeUp + 30));
    black.remove();
    delete document.documentElement.dataset['ff7Swirl'];
  }
}
