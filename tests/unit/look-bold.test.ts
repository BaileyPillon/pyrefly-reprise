import { describe, expect, it } from 'vitest';
import { LOOKS, parseLook } from '../../src/engine/look/LookConfig.ts';
import {
  BOLD_LOOKS,
  BOLD_RELIGHT,
  BOLD_FX,
  DEFAULT_ROOM_BOLD,
  ROOM_BOLD,
  applyH,
  baseExtents,
  driftPx,
  gateStep,
  invert3,
  lookParams,
  poolFromRect,
  reflectAmount,
  relightParams,
  roomBold,
  shadowAmount,
  squareToQuad,
} from '../../src/engine/look/LookBoldConfig.ts';
import { RELIGHT } from '../../src/engine/look/relight/RelightConfig.ts';
import { applyGrade, lutBytes, lutKey, recipeFor } from '../../src/engine/look/LookGrades.ts';
import { BOLD_ROOMS, applyHueBoosts, hueSat } from '../../src/engine/look/LookGradesBold.ts';

const PAL = { key: 0xffe0b0, sky: 0x30405a };

describe('bold strength: the address', () => {
  it('is subtle by default and bold only when asked', () => {
    expect(parseLook('?look=hd2d')).toMatchObject({ strength: 'subtle', drift: false });
    expect(parseLook('?look=hd2d&lookstrength=bold')).toMatchObject({ strength: 'bold', drift: false });
    expect(parseLook('?look=cinematic&lookstrength=BOLD&lookdrift=1')).toMatchObject({ strength: 'bold', drift: true });
    expect(parseLook('?look=hd2d&lookstrength=loud').strength).toBe('subtle');
    expect(parseLook('?look=hd2d&lookdrift=yes').drift).toBe(false);
  });
});

describe('bold strength: the tables', () => {
  it('subtle hands back pass 1\'s own objects, untouched', () => {
    for (const n of ['hd2d', 'cinematic', 'anime'] as const) expect(lookParams(n, 'subtle')).toBe(LOOKS[n]);
    for (const n of ['hd2d', 'cinematic'] as const) expect(relightParams(n, 'subtle')).toBe(RELIGHT[n]);
  });

  it('anime stays as it is at any strength', () => {
    expect(lookParams('anime', 'bold')).toBe(LOOKS.anime);
    expect(relightParams('anime', 'bold')).toBeNull();
  });

  it('bold pushes every number it is meant to push', () => {
    const s = LOOKS.hd2d;
    const b = BOLD_LOOKS.hd2d;
    expect(b.blur.far).toBeGreaterThan(s.blur.far * 1.5);
    expect(b.shaft.gain).toBeGreaterThan(s.shaft.gain * 2);
    expect(b.motes.size).toBeGreaterThan(s.motes.size);
    expect(b.motes.gain).toBeGreaterThan(s.motes.gain);
    expect(b.motes.glow ?? 0).toBeGreaterThan(0);
    expect(BOLD_LOOKS.cinematic.blur.far).toBeGreaterThan(LOOKS.cinematic.blur.far * 2);
    expect(BOLD_LOOKS.cinematic.shaft.gain).toBeGreaterThan(0); // pass 1's cinematic had none
    expect(BOLD_LOOKS.cinematic.fog.onFigures).toBeLessThan(LOOKS.cinematic.fog.onFigures); // never a veil over a face
    // the rim is the bold pass's; the first pass's compound pass draws none
    expect(BOLD_LOOKS.hd2d.rim.gain).toBe(0);
    expect(BOLD_LOOKS.cinematic.rim.gain).toBe(0);
    expect(BOLD_FX.hd2d.rim.gain).toBeGreaterThan(1);
  });

  it('the relight opens to a gain band of about 0.45 to 1.7, never to black', () => {
    for (const n of ['hd2d', 'cinematic'] as const) {
      const b = BOLD_RELIGHT[n];
      expect(b.gainMin).toBeGreaterThanOrEqual(0.4);
      expect(b.gainMin).toBeLessThanOrEqual(0.47);
      expect(b.gainMax).toBeGreaterThanOrEqual(1.65);
      expect(b.gainMax).toBeLessThanOrEqual(1.75);
      expect(b.key).toBeGreaterThan(RELIGHT[n]!.key);
      expect(b.rim).toBeGreaterThan(RELIGHT[n]!.rim);
      expect(b.point).toBeGreaterThan(RELIGHT[n]!.point);
      expect(b.reach).toBeGreaterThan(RELIGHT[n]!.reach);
    }
  });

  it('knows each demo room: Gagazet\'s snow floor is matte, the Bevelle cathedral floor glossy with four lamps', () => {
    expect(roomBold('gagazet').gloss).toBe(0);
    expect(roomBold('bevelle-underground').gloss).toBeGreaterThan(0.5);
    expect(roomBold('bevelle-underground').embers.length).toBe(4);
    for (const r of Object.values(ROOM_BOLD)) for (const [u, v] of r.embers) { expect(u).toBeGreaterThanOrEqual(0); expect(u).toBeLessThanOrEqual(1); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    expect(roomBold('some-other-room')).toBe(DEFAULT_ROOM_BOLD);
    expect(DEFAULT_ROOM_BOLD.gloss).toBe(0);
  });
});

describe('the frame to painting map', () => {
  it('maps the unit square onto a quad and back', () => {
    // a perspective quad: wider at the bottom than at the top
    const q = [0.1, 0.05, 0.9, 0.05, 0.8, 0.95, 0.2, 0.95];
    const m = squareToQuad(q);
    const corners: Array<[number, number]> = [[0, 0], [1, 0], [1, 1], [0, 1]];
    corners.forEach(([u, v], i) => {
      const [x, y] = applyH(m, u, v);
      expect(x).toBeCloseTo(q[i * 2]!, 9);
      expect(y).toBeCloseTo(q[i * 2 + 1]!, 9);
    });
    const inv = invert3(m);
    for (const [u, v] of [[0.3, 0.7], [0.5, 0.5], [0.9, 0.1]] as const) {
      const [x, y] = applyH(m, u, v);
      const [bu, bv] = applyH(inv, x, y);
      expect(bu).toBeCloseTo(u, 9);
      expect(bv).toBeCloseTo(v, 9);
    }
  });

  it('is affine for a rectangle, and the centre of a rectangle is the centre of the unit square', () => {
    const m = squareToQuad([0, 0, 2, 0, 2, 1, 0, 1]);
    expect(m.slice(6)).toEqual([0, 0, 1]);
    expect(applyH(invert3(m), 1, 0.5)).toEqual([0.5, 0.5]);
  });

  it('a singular map inverts to the identity rather than to NaN', () => {
    expect(invert3([1, 2, 3, 2, 4, 6, 0, 0, 0])).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });
});

describe('the base of a figure, read from its alpha', () => {
  it('finds the lowest opaque row, the whole width and the width of the base', () => {
    const w = 20;
    const h = 20;
    const a = new Uint8Array(w * h);
    // a wide head (rows 2..6, columns 4..15), a narrow body (rows 7..16, columns 8..11), feet (rows 17..18, columns 6..13)
    for (let y = 2; y <= 6; y++) for (let x = 4; x <= 15; x++) a[y * w + x] = 255;
    for (let y = 7; y <= 16; y++) for (let x = 8; x <= 11; x++) a[y * w + x] = 255;
    for (let y = 17; y <= 18; y++) for (let x = 6; x <= 13; x++) a[y * w + x] = 255;
    const e = baseExtents(a, w, h, 90, 0.1)!;
    expect(e.top).toBeCloseTo(2 / 20, 6);
    expect(e.bottom).toBeCloseTo(19 / 20, 6);
    expect(e.left).toBeCloseTo(4 / 20, 6);
    expect(e.right).toBeCloseTo(16 / 20, 6);
    expect(e.baseLeft).toBeCloseTo(6 / 20, 6);
    expect(e.baseRight).toBeCloseTo(14 / 20, 6);
    expect(e.baseRight - e.baseLeft).toBeLessThan(e.right - e.left);
  });

  it('is null for an empty painting and ignores faint alpha', () => {
    expect(baseExtents(new Uint8Array(100), 10, 10)).toBeNull();
    expect(baseExtents(new Uint8Array(100).fill(40), 10, 10)).toBeNull();
  });
});

describe('contact shadow and reflection strength', () => {
  it('a standing figure keeps its shadow, a lifted one fades, an invisible one has none', () => {
    expect(shadowAmount(0.8, 1, 0, 0)).toBeCloseTo(0.8, 9);
    expect(shadowAmount(0.8, 1, 1, 0)).toBeLessThan(0.3);
    expect(shadowAmount(0.8, 0, 0, 0)).toBe(0);
    expect(shadowAmount(0.8, 1, 0, 0.3)).toBeLessThan(0.8);
    expect(shadowAmount(0.8, 1, 0, 0.3)).toBeGreaterThan(0.3); // a hover is still grounded
  });

  it('a hovering figure has no reflection: it would read as a second figure', () => {
    expect(reflectAmount(1, 1, 0, 0)).toBe(1);
    expect(reflectAmount(1, 1, 0, 0.1)).toBe(0);
    expect(reflectAmount(1, 1, 0.5, 0)).toBeLessThan(0.4);
  });
});

describe('the floor pool under an effect', () => {
  it('sits at the target\'s feet and is sized to its width, within bounds', () => {
    const view = { w: 1600, h: 900 };
    const p = poolFromRect({ x: 600, y: 300, w: 200, h: 400 }, view);
    expect(p.u).toBeCloseTo(0.4375, 6);
    expect(p.v).toBeCloseTo(1 - (300 + 400 * 0.97) / 900, 6);
    expect(p.reach).toBeCloseTo((200 / 900) * 0.8, 6);
    expect(poolFromRect({ x: 0, y: 0, w: 4, h: 4 }, view).reach).toBe(0.09);
    expect(poolFromRect({ x: 0, y: 0, w: 1500, h: 4 }, view).reach).toBe(0.3);
  });
});

describe('the backdrop drift', () => {
  it('stays within its amplitude, slow, and still when the gate is shut', () => {
    let max = 0;
    for (let t = 0; t < 120; t += 0.25) max = Math.max(max, Math.abs(driftPx(t, 3, 24, 1)));
    expect(max).toBeLessThanOrEqual(3.0001);
    expect(max).toBeGreaterThan(2);
    for (let t = 0; t < 30; t += 1) expect(Math.abs(driftPx(t, 3, 24, 0))).toBe(0);
    // slow: a few hundredths of a pixel a frame at 60 fps
    expect(Math.abs(driftPx(10 + 1 / 60, 3, 24, 1) - driftPx(10, 3, 24, 1))).toBeLessThan(0.02);
  });

  it('the gate eases to a stop in about half a second and back', () => {
    let g = 1;
    for (let i = 0; i < 90; i++) g = gateStep(g, 0, 1 / 60, 0.5);
    expect(g).toBeLessThan(0.25);
    for (let i = 0; i < 180; i++) g = gateStep(g, 1, 1 / 60, 0.5);
    expect(g).toBeGreaterThan(0.95);
  });
});

describe('the bold grade', () => {
  it('hue boosts lift the hue they name and leave greys and other hues alone', () => {
    const orange = [0.95, 0.5, 0.15] as const;
    const boosted = applyHueBoosts(orange, [{ hue: 26, width: 32, sat: 1.5, lum: 1.3 }]);
    expect(hueSat(boosted).s).toBeGreaterThan(hueSat(orange).s);
    expect(boosted[0]).toBeGreaterThan(orange[0] - 1e-9);
    const grey = [0.4, 0.4, 0.4] as const;
    expect(applyHueBoosts(grey, [{ hue: 26, width: 32, sat: 1.5, lum: 1.3 }])).toEqual([0.4, 0.4, 0.4]);
    const blue = [0.2, 0.3, 0.9] as const;
    expect(applyHueBoosts(blue, [{ hue: 26, width: 32, sat: 1.5, lum: 1.3 }])).toEqual([0.2, 0.3, 0.9]);
  });

  it('keeps every output in range, hue wrap included', () => {
    const o = applyHueBoosts([1, 0.05, 0.1], [{ hue: 358, width: 40, sat: 2, lum: 2 }]);
    for (const c of o) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(1); }
    expect(hueSat([1, 0, 0]).h).toBe(0);
    expect(hueSat([0, 1, 0]).h).toBe(120);
    expect(hueSat([0, 0, 1]).h).toBe(240);
  });

  it('subtle is byte for byte pass 1\'s grade; bold is a different grade with its own cache key', () => {
    expect(lutKey('hd2d', 'ffx', 'gagazet', PAL)).toBe(lutKey('hd2d', 'ffx', 'gagazet', PAL, 'subtle'));
    expect(lutKey('hd2d', 'ffx', 'gagazet', PAL)).not.toContain('bold');
    expect(lutKey('hd2d', 'ffx', 'gagazet', PAL, 'bold')).toContain('bold');
    expect(lutKey('anime', 'ffx', 'gagazet', PAL, 'bold')).toBe(lutKey('anime', 'ffx', 'gagazet', PAL));
    const a = lutBytes('hd2d', 'ffx', 'gagazet', PAL);
    const b = lutBytes('hd2d', 'ffx', 'gagazet', PAL, 'subtle');
    expect(Buffer.compare(Buffer.from(a), Buffer.from(b))).toBe(0);
    const c = lutBytes('hd2d', 'ffx', 'gagazet', PAL, 'bold');
    expect(Buffer.compare(Buffer.from(a), Buffer.from(c))).not.toBe(0);
    expect(recipeFor('anime', 'ffx', 'gagazet', PAL, 'bold')).toEqual(recipeFor('anime', 'ffx', 'gagazet', PAL));
  });

  it('Chapter I stays luminous: bold hd2d brightens the icy blue and keeps its colour; cinematic is no longer the muddy 0.72', () => {
    const ice = [0.35, 0.65, 1.0] as const;
    const s = applyGrade(ice, recipeFor('hd2d', 'ffx', 'gagazet', PAL));
    const b = applyGrade(ice, recipeFor('hd2d', 'ffx', 'gagazet', PAL, 'bold'));
    const l = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
    expect(l(b)).toBeGreaterThan(l(s) * 0.98);
    expect(hueSat(b).s).toBeGreaterThan(0.45);
    expect(recipeFor('cinematic', 'ffx', 'gagazet', PAL, 'bold').sat).toBeGreaterThan(0.95);
    expect(recipeFor('cinematic', 'ffx', 'gagazet', PAL).sat).toBeLessThan(0.8);
  });

  it('Chapter IV: amber lamps stay warm against a cyan skylight, both pulled toward their own hue', () => {
    const r = recipeFor('hd2d', 'ffx2', 'bevelle-underground', PAL, 'bold');
    expect(r.hues?.length).toBe(2);
    const lamp = applyGrade([1.2, 0.55, 0.12], r);
    const sky = applyGrade([0.3, 0.8, 1.0], r);
    expect(hueSat(lamp).h).toBeGreaterThan(15);
    expect(hueSat(lamp).h).toBeLessThan(55);
    expect(hueSat(sky).h).toBeGreaterThan(170);
    expect(hueSat(sky).h).toBeLessThan(215);
    expect(BOLD_ROOMS.cinematic['bevelle-underground']!.recipe!.hues!.length).toBe(2);
  });
});
