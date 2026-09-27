/**
 * Vegnagun's parts open differently (A-2, FFX-2 only): "a black hole sucking
 * in the screen" instead of the shatter (`research/ffx-vs-ffx2-presentation.md`
 * §1.2, FF Wiki *Vegnagun*, single source; visual-bible §1.18). A roughly
 * 0.6 s radial pinch of the held frame into a point, draining its colour to
 * nothing, then the battle fades up out of the black.
 *
 * **Built OFF.** Bailey named the implosion in words and there is no picture
 * of it yet, so it ships only after he has seen its first frames beside the
 * tile (the plan's A-2 row). {@link IMPLOSION_ENABLED} is false and nothing
 * calls it; the Vegnagun seams keep today's entry until his yes. No `three`.
 */

import type { EntryPlayer } from './entryOverlay.ts';

/** The switch Bailey's yes turns on (A-2). Off: nothing plays the implosion. */
export const IMPLOSION_ENABLED = false;
/** The pinch into the point. */
export const IMPLOSION_PINCH_MS = 600;
/** The battle fading up out of the black. */
export const IMPLOSION_FADE_MS = 420;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export function implosionPlayer(w: number, h: number): EntryPlayer {
  const cx = w / 2;
  const cy = h * 0.45;
  const total = IMPLOSION_PINCH_MS + IMPLOSION_FADE_MS;
  return {
    className: 'pf-entry--implosion',
    // The whole move plays after the battle is ready: the pinch, then the fade.
    introMs: 0,
    outMs: total,
    outro(ctx, frame, t) {
      const ms = t * total;
      const p = clamp01(ms / IMPLOSION_PINCH_MS);
      const f = clamp01((ms - IMPLOSION_PINCH_MS) / IMPLOSION_FADE_MS);
      ctx.clearRect(0, 0, w, h);
      // The black the screen is pulled into, fading up into the battle once it is gone.
      ctx.fillStyle = `rgba(0,0,0,${1 - f})`;
      ctx.fillRect(0, 0, w, h);
      if (p >= 1) return;
      const e = p * p * p; // slow at the rim, fast at the throat
      const s = 1 - e;
      const reach = Math.hypot(w, h) / 2;
      ctx.save();
      // The hole's mouth, in screen space: a circle closing on the point.
      ctx.beginPath();
      ctx.arc(cx, cy, reach * (1 - Math.pow(p, 1.4)), 0, Math.PI * 2);
      ctx.clip();
      // The picture pulled in and twisted as it goes.
      ctx.translate(cx, cy);
      ctx.rotate(e * 2.2);
      ctx.scale(s, s);
      ctx.translate(-cx, -cy);
      ctx.filter = `saturate(${(1 - p).toFixed(3)}) brightness(${(1 - 0.35 * p).toFixed(3)})`;
      ctx.drawImage(frame, 0, 0, w, h);
      ctx.restore();
      ctx.filter = 'none';
      // The rim of the hole, darkening in.
      const g = ctx.createRadialGradient(cx, cy, Math.max(1, Math.hypot(w, h) * 0.5 * s * 0.7), cx, cy, Math.hypot(w, h) * 0.5);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${0.85 * p})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  };
}
