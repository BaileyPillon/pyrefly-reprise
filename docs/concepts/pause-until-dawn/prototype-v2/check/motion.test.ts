import { describe, expect, it } from 'vitest';
import { PortraitStateMachine } from '../src/state.ts';
import { chestOffsetPx, headSwayPx, PLATE_IPD_PX, HEAD_WIDTH_PX } from '../src/motion.ts';

const DT = 1 / 60;
const p95 = (v: number[]) => {
  const s = v.map(Math.abs).sort((a, b) => a - b);
  return s[Math.floor(0.95 * (s.length - 1))]!;
};

function run(seconds: number, targetDeg = 0, seed = 11) {
  const sm = new PortraitStateMachine({ headSway: seed, blink: seed + 1, expression: seed + 2 });
  sm.setYawRange(-85, 85);
  sm.setGazeTarget(targetDeg / 85, 0);
  for (let i = 0; i < 120; i++) sm.update(DT);
  const out = { cx: [] as number[], cy: [] as number[], hx: [] as number[], hy: [] as number[], yaw: [] as number[] };
  for (let i = 0; i < seconds / DT; i++) {
    const f = sm.update(DT);
    const [cx, cy] = chestOffsetPx(f.chestSample, f.chestSampleX);
    const [hx, hy] = headSwayPx(f.headSample[0], f.headSample[1]);
    out.cx.push(cx); out.cy.push(cy); out.hx.push(hx); out.hy.push(hy); out.yaw.push(f.yawDeg - targetDeg);
  }
  return out;
}

describe('v3.2 idle motion against the spec (section 11)', () => {
  const r = run(1200);
  // v3.3: the chest is checked by the spec's own measure (5.5 s windows) below; a p95 of |x| is not what section 6 means by +-
  it('head sway: +-1.5-3 % of head width on BOTH axes, vertical about equal to horizontal', () => {
    const hx = p95(r.hx) / HEAD_WIDTH_PX * 100;
    const hy = p95(r.hy) / HEAD_WIDTH_PX * 100;
    for (const v of [hx, hy]) {
      expect(v).toBeGreaterThanOrEqual(1.5);
      expect(v).toBeLessThanOrEqual(3);
    }
    expect(hy / hx).toBeGreaterThan(0.7);
    expect(hy / hx).toBeLessThan(1.4);
  });
  it('the idle yaw wander stays small (p95 under 2 degrees), so a held 40 degree target is not overshot by the check\'s 8.7', () => {
    expect(p95(r.yaw)).toBeLessThan(2);
    const held = run(300, 40, 21);
    expect(Math.max(...held.yaw)).toBeLessThan(3.5);
  });
});

/**
 * The spec's own method (section 6): in each ~5.5 s idle window, "+-" is half
 * the peak-to-peak; the head is measured in the IMAGE frame (it rides the
 * chest), the chest on its own. Median over 1200 s of windows.
 */
function windows(v: number[], seconds = 5.5): number[] {
  const n = Math.round(seconds / DT);
  const out: number[] = [];
  for (let s = 0; s + n <= v.length; s += n) {
    const w = v.slice(s, s + n);
    out.push((Math.max(...w) - Math.min(...w)) / 2);
  }
  return out.sort((a, b) => a - b);
}
const median = (v: number[]) => v[Math.floor(v.length / 2)]!;

describe('v3.3 idle motion by the spec section 6 method (5.5 s windows, half peak-to-peak)', () => {
  const r = run(1200, 0, 7);
  const hx = r.hx.map((v, i) => v + r.cx[i]!);
  const hy = r.hy.map((v, i) => v + r.cy[i]!);
  const m = {
    chestX: (median(windows(r.cx)) / PLATE_IPD_PX) * 100,
    chestY: (median(windows(r.cy)) / PLATE_IPD_PX) * 100,
    headX: (median(windows(hx)) / HEAD_WIDTH_PX) * 100,
    headY: (median(windows(hy)) / HEAD_WIDTH_PX) * 100,
  };
  it('chest: +-3.6 % IPD across, +-2.9 % up and down (median window within 25 %), across larger than up/down', () => {
    // eslint-disable-next-line no-console
    console.log('[motion windows]', JSON.stringify(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, +v.toFixed(2)]))));
    expect(m.chestX).toBeGreaterThan(3.6 * 0.75);
    expect(m.chestX).toBeLessThan(3.6 * 1.25);
    expect(m.chestY).toBeGreaterThan(2.9 * 0.75);
    expect(m.chestY).toBeLessThan(2.9 * 1.25);
    expect(m.chestX).toBeGreaterThan(m.chestY);
  });
  it('head in the image: +-1.5-3 % of head width on both axes, vertical about equal to horizontal', () => {
    for (const v of [m.headX, m.headY]) {
      expect(v).toBeGreaterThanOrEqual(1.5);
      expect(v).toBeLessThanOrEqual(3);
    }
    expect(m.headY / m.headX).toBeGreaterThan(0.7);
    expect(m.headY / m.headX).toBeLessThan(1.4);
  });
});

