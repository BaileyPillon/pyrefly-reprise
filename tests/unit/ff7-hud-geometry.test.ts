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

  it("lays the status window's columns at FF7's u as fractions of the width (spec §5.2; the purist review's item 11)", () => {
    const R = g.right;
    const hx = 1600 / 320;
    // HP 720, current ends 860, max ends 1020; MP ends 1180 (line from 1035); LIMIT 1195-1375; TIME 1385-1565.
    expect([R.hp0, R.curEnd, R.maxEnd, R.mpLine0, R.mpEnd, R.limitX, R.timeX].map((x) => Math.round(x))).toEqual([720, 860, 1020, 1035, 1180, 1195, 1385]);
    expect(R.gaugeW).toBeCloseTo(36 * hx, 6); // 180 px: gauge widths use the horizontal scale
    expect(R.gaugeH).toBeCloseTo(9 * u, 6); // 36 px
    expect(R.timeX - (R.limitX + R.gaugeW)).toBeCloseTo(2 * hx, 6);
    // No hole between HP and MP: the 16:9 slack is shared out, MP starts 3 u after HP's max.
    expect((R.mpLine0 - R.maxEnd) / hx).toBeCloseTo(3, 6);
    expect([R.hdr.mp, R.hdr.limit, R.hdr.time].map((x) => Math.round(x))).toEqual([1055, 1200, 1400]);
  });

  it('draws header caps at 3 u against the 8 u body cap (the stills read about 0.44 with the edge)', () => {
    expect(g.cap / 900).toBeCloseTo(0.0357, 3); // 3.6 % of the height (§7 item 12)
    expect((g.hdrCap + 2 * g.hdrEdge) / g.cap).toBeLessThan(0.5);
  });

  it('opens the command window at FF7s measured 72 to 131 u (360 to 655 px, text at 390), over the names window, 4 u below the band (§7 item 8)', () => {
    const c = g.cmd.r;
    expect([Math.round(c.x), Math.round(c.x + c.w), Math.round(g.cmd.cols[0]!)]).toEqual([360, 655, 390]);
    expect(c.x + c.w).toBeCloseTo(g.left.barrierRight, 6);
    expect(g.list.cols.map((x) => Math.round(x))).toEqual([390, 650, 870]); // columns at 78, 130, 174 u
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
