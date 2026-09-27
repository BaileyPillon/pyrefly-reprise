/**
 * What every option-B effect shares: the target it is drawn on, the cast mark
 * under it (the two game skins) and the slash band. Ported from the mock's
 * `fx-lib.js` and `fx-b.js` (docs/concepts/spell-fx-2026-09-26/).
 */

import type { FxDrawList } from './FxDrawList.ts';
import { clamp, env, lerp, outCubic } from './fxMath.ts';

/**
 * A combatant on screen, in CSS pixels: its painted rectangle, the centre the
 * spells aim at (45 % down), the foot point, `sc` (its height over 360, the
 * mock's unit) and `k`, the viewport over 1600x900 for the few lengths the mock
 * wrote in plate pixels (line widths, bolt jitter).
 */
export interface FxTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  fx: number;
  fy: number;
  sc: number;
  k: number;
  /** A group effect's landing point (Mega Flare: the party's centre), in CSS pixels. */
  party?: { x: number; y: number };
}

export function targetFromRect(r: { x: number; y: number; w: number; h: number }, k: number): FxTarget {
  return { x: r.x, y: r.y, w: r.w, h: r.h, cx: r.x + r.w / 2, cy: r.y + r.h * 0.45, fx: r.x + r.w / 2, fy: r.y + r.h * 0.97, sc: r.h / 360, k };
}

/** The accent of each game's chrome: FFX gold, FFX-2 pink. */
export const accentOf = (o: FxDrawList): string => (o.game === 'ffx2' ? '#F7B6D9' : '#E3B94A');

/**
 * The cast mark under the target, one per game [ours, from each game's chrome;
 * research/ffx-vs-ffx2-presentation.md §9 row 2, "one motion language, two
 * skins"]: FFX a gold ring with eight points (visual-bible §1.1's Yevon-glyph
 * ring idea), FFX-2 a pink ring with four-point sparkles at its quarters.
 */
export function castMark(o: FxDrawList, T: FxTarget, t: number, t0 = 0, t1 = 0.9): void {
  const a = env(t, t0, t1, 0.12, 0.3);
  if (!a) return;
  const u = outCubic((t - t0) / 0.35);
  const rx = 120 * T.sc;
  const col = accentOf(o);
  const was = o.add;
  o.add = false;
  o.ring(T.fx, T.fy, rx, 4 * T.k, col, a * 0.9, 0.28, u, 'cast-ring');
  const pts = o.game === 'ffx2' ? 4 : 8;
  for (let i = 0; i < pts; i++) {
    const ang = -Math.PI / 2 + (i / pts) * Math.PI * 2;
    if (ang > -Math.PI / 2 + Math.PI * 2 * u) continue;
    o.sprite(o.bit, col, T.fx + Math.cos(ang) * rx, T.fy + Math.sin(ang) * rx * 0.28, (o.game === 'ffx2' ? 34 : 16) * T.sc, a, 0, 'cast-point');
  }
  o.add = was;
}

/** The mock's `slash`: three layered bands whose head sweeps from a0 toward a1. */
export function slash(o: FxDrawList, T: FxTarget, t: number, t0: number, dur: number, a0: number, a1: number, R: number, edge: string): void {
  const prog = clamp((t - t0) / dur);
  const fade = env(t, t0, t0 + dur + 0.3, 0.001, 0.3);
  if (!prog || !fade) return;
  const aEnd = lerp(a0, a1, outCubic(prog));
  o.add = true;
  for (const [w, col, al] of [[3.2, edge, 0.35], [1.6, edge, 0.8], [0.7, '#FFFFFF', 1]] as const) {
    o.arc(T.cx, T.cy, R, a0, aEnd, 26 * T.sc * w, col, al * fade);
  }
  o.add = false;
}
