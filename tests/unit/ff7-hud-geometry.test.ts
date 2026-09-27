/**
 * The FF7 battle HUD's geometry against FF7's measured picture
 * (`docs/plans/ff7-hud-faithful-a-spec.md` §3.2, §7) and the three repairs the
 * A+ fidelity review asked for (right-window spacing, small headers, the phone
 * command window). Game case: FF7 only.
 */
import { describe, expect, it } from 'vitest';

import { FF7_PHONE_LAYOUT, ff7Geometry, isPhoneShape } from '../../src/ui/ff7/ff7Geometry.ts';

describe('desktop 1600 x 900', () => {
  const g = ff7Geometry(1600, 900);
  const u = g.s;

  it('is the stretch rule: sizes at 900 / 224 px per u', () => {
    expect(g.mode).toBe('desk');
    expect(u).toBeCloseTo(900 / 224, 6);
  });

  it('puts the band at 71.0 % to 95.1 % of the height, split at 42.5 % (±1 %), with the black strip below (§7 item 3)', () => {
    expect(g.bandL.y / 900).toBeCloseTo(0.71, 2);
    expect((g.bandL.y + g.bandL.h) / 900).toBeCloseTo(0.951, 2);
    expect(Math.abs((g.bandL.x + g.bandL.w) / 1600 - 0.425)).toBeLessThan(0.01);
    expect(g.strip).toBeCloseTo(g.bandL.y + g.bandL.h, 6);
    expect((g.bandR.x - (g.bandL.x + g.bandL.w)) / (1600 / 320)).toBeCloseTo(3, 6); // FF7's 3 u gap
  });

  it("keeps FF7's spacing in the status window's right cluster: MP 3 u, LIMIT 2 u, TIME 6 u from the edge", () => {
    const R = g.right;
    const edge = g.bandR.x + g.bandR.w;
    expect((R.limitX - R.mpEnd) / u).toBeCloseTo(3, 6);
    expect((R.timeX - (R.limitX + R.gaugeW)) / u).toBeCloseTo(2, 6);
    expect((edge - (R.timeX + R.gaugeW)) / u).toBeCloseTo(6, 6);
    expect(R.gaugeW / R.gaugeH).toBeCloseTo(4, 6); // 36 x 9 u
    expect((R.mpEnd - R.mpLine0) / u).toBeCloseTo(29, 6);
    // HP keeps its place at the left; the stretch slack sits between HP and MP.
    expect(R.hp0).toBeCloseTo(144 * 5, 6);
    expect(R.mpLine0).toBeGreaterThan(R.maxEnd);
  });

  it('draws header caps at 3 u against the 8 u body cap (the stills read about 0.44 with the edge)', () => {
    expect(g.cap / 900).toBeCloseTo(0.0357, 3); // 3.6 % of the height (§7 item 12)
    expect((g.hdrCap + 2 * g.hdrEdge) / g.cap).toBeLessThan(0.5);
  });

  it('opens the command window 59 u wide, over the names window, 4 u below the band (§7 item 8)', () => {
    const c = g.cmd.r;
    expect(c.w / u).toBeCloseTo(59, 6);
    expect(c.x + c.w).toBeCloseTo(g.left.barrierRight, 6);
    expect((c.y + c.h - (g.bandL.y + g.bandL.h)) / (900 / 224)).toBeCloseTo(4, 6);
    expect(g.cmd.rows[1]! - g.cmd.rows[0]!).toBeCloseTo(12 * (900 / 224), 6);
  });

  it('makes the top message window 89 % wide (§7 item 11)', () => {
    expect(g.msg.w / 1600).toBeCloseTo(286 / 320, 3);
  });
});

describe('phone 390 x 844, layout A (stacked, 2.05 px/u; `?ff7phone=a`)', () => {
  const g = ff7Geometry(390, 844, 'a');

  it('is an upright phone and uses one scale for both band windows', () => {
    expect(isPhoneShape(390, 844)).toBe(true);
    expect(isPhoneShape(844, 390)).toBe(false);
    expect(g.mode).toBe('phone');
    expect(g.bandR.w).toBeCloseTo(181 * g.s, 6);
    expect(g.bandL.w).toBeCloseTo(134 * g.s, 6);
  });

  it('keeps every window inside the 390 px frame', () => {
    for (const r of [g.msg, g.bandL, g.bandR, g.cmd.r, g.list.r, g.mpWin, g.lim.r]) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(390);
    }
  });

  it('lets the command window overlap only the names window, never the status headers (§7 item 16)', () => {
    const c = g.cmd.r;
    expect(c.y + c.h).toBeLessThanOrEqual(g.bandL.y + g.bandL.h + 0.001);
    expect(c.y + c.h).toBeLessThan(g.bandR.y);
    expect(g.right.hdrBase - g.hdrCap).toBeGreaterThan(c.y + c.h);
  });

  it('gives command slots at least 44 px for a thumb', () => {
    expect(g.cmd.rows[1]! - g.cmd.rows[0]!).toBeGreaterThanOrEqual(44);
  });

  it("keeps FF7's column layout exact inside the status window", () => {
    const R = g.right;
    expect((R.limitX - R.mpEnd) / g.s).toBeCloseTo(3, 6);
    expect((R.timeX - (R.limitX + R.gaugeW)) / g.s).toBeCloseTo(2, 6);
    expect((g.bandR.x + g.bandR.w - (R.timeX + R.gaugeW)) / g.s).toBeCloseTo(6, 6);
    expect((R.mpLine0 - R.maxEnd) / g.s).toBeCloseTo(3, 6); // 204 -> 207 u
  });
});

describe('phone 390 x 844, layout B (the default: names on the status rows, 1.64 px/u)', () => {
  const g = ff7Geometry(390, 844);

  it('is the default, at 1.64 px per u, the status window across the width', () => {
    expect(FF7_PHONE_LAYOUT).toBe('b');
    expect(g.s).toBeCloseTo(1.64, 6);
    expect(g.bandR.w).toBe(390 - 16);
    expect(g.bandL.w).toBeCloseTo(134 * g.s, 6);
  });

  it('puts each name at the left of its status row, before the HP field', () => {
    const R = g.right;
    expect(R.nameX).toBeDefined();
    expect(R.nameX!).toBeGreaterThan(g.bandR.x);
    expect(R.hp0 - R.nameX!).toBeGreaterThan(8 * g.cap * 0.5); // room for "Barret"
    expect(R.maxEnd).toBeLessThan(R.mpLine0);
  });

  it('keeps every window inside the frame, the command window over the names window only, 44 px slots', () => {
    for (const r of [g.msg, g.bandL, g.bandR, g.cmd.r, g.list.r, g.mpWin, g.lim.r]) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(390);
    }
    expect(g.cmd.r.y + g.cmd.r.h).toBeLessThan(g.bandR.y);
    expect(g.cmd.rows[1]! - g.cmd.rows[0]!).toBeGreaterThanOrEqual(44);
  });

  it("keeps FF7's spacing in the right-hand cluster", () => {
    const R = g.right;
    expect((R.limitX - R.mpEnd) / g.s).toBeCloseTo(3, 6);
    expect((R.timeX - (R.limitX + R.gaugeW)) / g.s).toBeCloseTo(2, 6);
    expect((g.bandR.x + g.bandR.w - (R.timeX + R.gaugeW)) / g.s).toBeCloseTo(6, 6);
  });
});

describe('a 4:3 window', () => {
  it('never lets the right cluster run into the HP field', () => {
    const g = ff7Geometry(1200, 900);
    expect(g.right.mpLine0).toBeGreaterThanOrEqual(g.right.maxEnd);
  });
});
