import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PairWarp, mapPoint, type Pt } from '../src/warp/mesh.ts';
import { smootherstep } from '../src/motion.ts';

/**
 * v3.3: how far past the plate's right border the warp reaches for paint while
 * the FRONTAL painting is on screen. v4 ('warp' paint): the frontal is mixed
 * with the +-20 key and still painted while paintWeight < 1, i.e. up to 15
 * degrees (t 0.75 of the 0..20 bracket), plus the idle wander, the head's
 * sway and the chest's. The plate's side hair is cut
 * at x 831, so every pixel pulled from beyond it is invented: the v3.2 check
 * saw it as streaks, a reflection as chevrons. The right margin (rig-margins.py)
 * must cover the worst case.
 */
interface Key { id: string; yawDeg: number; landmarks: Pt[] }
const rig = JSON.parse(readFileSync(new URL('../art/rig.json', import.meta.url), 'utf8')) as {
  keys: Key[];
  artMeta: { v3: { warp: { frame: Pt[]; pins: Pt[] }; frontal: { layers: Array<{ name: string; box: number[] }> } } };
};
const byId = new Map(rig.keys.map((k) => [k.id, k]));
const fixed = [...rig.artMeta.v3.warp.frame, ...rig.artMeta.v3.warp.pins];

/** Largest pull (px past x 831) over the rows the plate's hair reaches the border, at one pose. */
function pullAt(yaw: number, head: Pt, chest: Pt): number {
  const f = byId.get('frontal')!;
  const other = byId.get(yaw < 0 ? 'v4-l20' : 'v4-r20')!;
  const w = new PairWarp(f.landmarks, other.landmarks, fixed);
  const g = smootherstep(Math.min(1, Math.abs(yaw) / Math.abs(other.yawDeg)));
  const dst = w.posed(g, head, chest);
  const src = w.source('a');
  let worst = 0;
  for (let y = 0; y <= 880; y += 8) {
    const p = mapPoint([831, y], dst, src, w.tris);
    if (p) worst = Math.max(worst, p[0] - 831);
  }
  return worst;
}

describe('the frontal painting never needs more than its right margin', () => {
  it('worst pull past x 831 across the frontal range, sway and chest included', () => {
    let worst = 0;
    for (const yaw of [-17, -15, -12, -8, -4, 4, 8, 12, 15, 17]) {
      for (const hx of [-14, 0, 14]) for (const hy of [-14, 0, 14]) for (const cx of [-10, 0, 10]) {
        worst = Math.max(worst, pullAt(yaw, [hx + cx, hy], [cx, 0]));
      }
    }
    const hairBack = rig.artMeta.v3.frontal.layers.find((l) => l.name === 'hairBack')!;
    const margin = hairBack.box[0]! + hairBack.box[2]! - 832;
    // eslint-disable-next-line no-console
    console.log('[border] worst pull past x 831:', worst.toFixed(1), 'px; hairBack right margin', margin);
    expect(worst).toBeLessThan(margin);
  });
});
