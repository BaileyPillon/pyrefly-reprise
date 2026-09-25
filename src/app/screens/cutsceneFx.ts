/**
 * The two story effects a cutscene draws for itself: pyreflies rising from a
 * figure, and the arc of a summoner's sending.
 *
 * **Game case: both.** An unsent's body disperses into pyreflies when it is
 * sent or destroyed, the same in FFX and FFX-2 (`research/ffx-vs-ffx2-presentation.md`,
 * the departures table, row "Unsent": "Same", `[verified: 2 sources]`), so the
 * effects are shared plumbing, drawn only where a script already asks for
 * them (that file: "pyreflies are not atmosphere"); which chapters now draw them is measured in
 * `tests/unit/cutscene-stage.test.ts`. Every other `fx()` key keeps the white
 * flash it has always had.
 *
 * DOM only, animated with the Web Animations API. Where `Element.animate` is
 * missing (jsdom) the pieces are still built and are removed on a timer, so a
 * test sees the same element count a browser does.
 */

import type { FigureBox } from './cutsceneFigures.ts';

/** The `fx()` keys a cutscene draws itself. */
export const STAGED_FX = ['pyreflies-rising', 'sending-dance'] as const;
export type StagedFx = (typeof STAGED_FX)[number];

export function isStagedFx(key: string): key is StagedFx {
  return (STAGED_FX as readonly string[]).includes(key);
}

/** Pale cyan, sea green, lilac, warm white: the mixed glow of a pyrefly swarm. */
const PYREFLY_TINTS = ['#bfe9ff', '#b8f5d8', '#d9c8ff', '#fff4d6', '#9fd8ff'];

/** How long the longest piece of each effect lives, in ms. */
export const FX_LIFETIME_MS: Record<StagedFx, number> = {
  'pyreflies-rising': 5600,
  'sending-dance': 2400,
};

/** Deterministic spread without the battle RNG (presentation only; never touches battle state). */
function spread(i: number, salt: number): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Animate `el`, or where the API is missing, just remove it when it would have finished. */
function play(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions & { duration: number; delay?: number }): void {
  if (typeof (el as HTMLElement).animate === 'function') {
    const anim = (el as HTMLElement).animate(frames, { fill: 'both', ...opts });
    anim.onfinish = () => el.remove();
    anim.oncancel = () => el.remove();
    return;
  }
  window.setTimeout(() => el.remove(), opts.duration + (opts.delay ?? 0));
}

/**
 * Pyreflies leaving a body: motes born across the figure, rising a third of
 * the screen with a slow sway, brightening and then gone. Returns how many were
 * spawned.
 */
export function spawnPyreflies(layer: HTMLElement, box: FigureBox, stageH: number): number {
  const reduced = prefersReducedMotion();
  const count = reduced ? 12 : 56;
  const doc = layer.ownerDocument;
  for (let i = 0; i < count; i++) {
    const mote = doc.createElement('span');
    mote.className = 'cutscene__pyrefly';
    const size = Math.max(4, stageH * (0.007 + 0.009 * spread(i, 1)));
    const x = box.cx + (spread(i, 2) - 0.5) * box.width * 0.7;
    // Born anywhere from the knees to the crown, more of them low.
    const y = box.feet - box.height * (0.12 + 0.8 * Math.pow(spread(i, 3), 1.4));
    const tint = PYREFLY_TINTS[i % PYREFLY_TINTS.length] ?? '#bfe9ff';
    mote.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;--mote:${tint}`;
    layer.appendChild(mote);
    const rise = stageH * (0.22 + 0.2 * spread(i, 4));
    const sway = (spread(i, 5) - 0.5) * stageH * 0.08;
    const duration = 2600 + 1800 * spread(i, 6);
    const delay = 1200 * spread(i, 7);
    play(
      mote,
      reduced
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }]
        : [
            { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
            { transform: `translate(calc(-50% + ${(sway * 0.6).toFixed(1)}px), calc(-50% - ${(rise * 0.35).toFixed(1)}px)) scale(1)`, opacity: 1, offset: 0.3 },
            { transform: `translate(calc(-50% - ${(sway * 0.4).toFixed(1)}px), calc(-50% - ${(rise * 0.7).toFixed(1)}px)) scale(0.9)`, opacity: 0.8, offset: 0.7 },
            { transform: `translate(calc(-50% + ${sway.toFixed(1)}px), calc(-50% - ${rise.toFixed(1)}px)) scale(0.5)`, opacity: 0 },
          ],
      { duration, delay, easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)' },
    );
  }
  return count;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * The sending: one arch of pale light, the trail of a staff swung through
 * the dance, drawn across the stage around `box` and then let go,
 * with a ring of light spreading on the floor under it.
 */
export function spawnSendingArc(layer: HTMLElement, box: FigureBox, stageW: number, stageH: number): number {
  const doc = layer.ownerDocument;
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cutscene__sending');
  svg.setAttribute('viewBox', `0 0 ${Math.round(stageW)} ${Math.round(stageH)}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const r = Math.min(stageW, stageH) * 0.34;
  const cx = box.cx;
  const cy = box.feet - box.height * 0.55;
  // One arch, low on one side, over the top, low on the other: the staff's swing.
  const d =
    `M ${(cx - r * 1.15).toFixed(1)} ${(cy + r * 0.6).toFixed(1)} ` +
    `C ${(cx - r * 0.75).toFixed(1)} ${(cy - r * 0.75).toFixed(1)}, ` +
    `${(cx + r * 0.75).toFixed(1)} ${(cy - r * 0.75).toFixed(1)}, ` +
    `${(cx + r * 1.15).toFixed(1)} ${(cy + r * 0.6).toFixed(1)}`;
  for (const cls of ['cutscene__sending-glow', 'cutscene__sending-core']) {
    const path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', cls);
    path.setAttribute('d', d);
    path.setAttribute('pathLength', '100');
    svg.appendChild(path);
    play(
      path,
      [
        { strokeDashoffset: 100, opacity: 1 },
        { strokeDashoffset: 0, opacity: 1, offset: 0.55 },
        { strokeDashoffset: 0, opacity: 0 },
      ],
      { duration: 2000, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    );
  }
  layer.appendChild(svg);
  window.setTimeout(() => svg.remove(), FX_LIFETIME_MS['sending-dance']);

  const ring = doc.createElement('span');
  ring.className = 'cutscene__sending-ring';
  const ringW = r * 1.8;
  ring.style.cssText = `left:${cx.toFixed(1)}px;top:${box.feet.toFixed(1)}px;width:${ringW.toFixed(1)}px;height:${(ringW * 0.22).toFixed(1)}px`;
  layer.appendChild(ring);
  play(
    ring,
    [
      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(0.7)', opacity: 0.9, offset: 0.35 },
      { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 0 },
    ],
    { duration: 1900, delay: 250, easing: 'ease-out' },
  );
  return 2;
}
