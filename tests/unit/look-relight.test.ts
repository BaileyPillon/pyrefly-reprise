import { describe, expect, it } from 'vitest';
import { ORB_COLORS, POINT_KINDS, RELIGHT, keyDirection, normalMapUrl, pointEnvelope, pointFalloff, relightGain, rimDirection } from '../../src/engine/look/relight/RelightConfig.ts';

/** Demo looks, light on the paintings (dev flag only; both games): the maths the figure shader mirrors, the colours, the map URL. */
describe('the relight presets', () => {
  it('hd2d and cinematic relight the figures, anime stays flat', () => {
    expect(RELIGHT.hd2d).not.toBeNull();
    expect(RELIGHT.cinematic).not.toBeNull();
    expect(RELIGHT.anime).toBeNull();
  });

  it('keeps the painting as the base: a lift and shade of about a third, a floor well above black', () => {
    for (const p of [RELIGHT.hd2d!, RELIGHT.cinematic!]) {
      expect(p.key).toBeGreaterThanOrEqual(0.25);
      expect(p.key).toBeLessThanOrEqual(1.2);
      // a surface tilted by a third of the unit toward or away from the key lifts or shades the painting by a quarter to two fifths, never more
      for (const dk of [0.3, -0.3]) {
        const g = Math.abs(relightGain(0.5 + dk, 0.5, p) - 1);
        expect(g).toBeGreaterThanOrEqual(0.2);
        expect(g).toBeLessThanOrEqual(0.4);
      }
      expect(p.gainMin).toBeGreaterThanOrEqual(0.5);
      expect(p.gainMax).toBeLessThanOrEqual(1.5);
      expect(p.rimZ).toBeLessThan(0); // the rim comes from behind
      expect(p.keyZ).toBeGreaterThan(0);
    }
  });
});

describe('the gain', () => {
  const p = { key: 0.55, gainMin: 0.62, gainMax: 1.38 };

  it('is 1 where the surface faces the viewer as flat does, lifts what turns toward the key and shades what turns away', () => {
    expect(relightGain(0.5, 0.5, p)).toBe(1);
    expect(relightGain(0.9, 0.5, p)).toBeGreaterThan(1);
    expect(relightGain(-0.2, 0.5, p)).toBeLessThan(1);
  });

  it('never leaves the band, however extreme the normal', () => {
    expect(relightGain(1, -1, p)).toBe(p.gainMax);
    expect(relightGain(-1, 1, p)).toBe(p.gainMin);
    expect(p.gainMin).toBeGreaterThan(0.5);
  });
});

describe('the directions', () => {
  const len = (v: readonly number[]): number => Math.hypot(v[0]!, v[1]!, v[2]!);

  it('the key points toward the light on the screen, above and toward the viewer, unit length', () => {
    const k = keyDirection([0.2, 0.9], [0.5, 0.34], 16 / 9, 0.55);
    expect(len(k)).toBeCloseTo(1, 6);
    expect(k[0]).toBeLessThan(0); // the light is on the left
    expect(k[1]).toBeGreaterThan(0.2); // and above
    expect(k[2]).toBeGreaterThan(0); // and in front
    const r = keyDirection([0.9, 0.9], [0.5, 0.34], 16 / 9, 0.55);
    expect(r[0]).toBeGreaterThan(0);
  });

  it('a light straight over the party or on top of it still gives a usable direction', () => {
    for (const l of [[0.5, 0.34], [0.5, 0.95]] as const) {
      const k = keyDirection(l, [0.5, 0.34], 16 / 9, 0.5);
      expect(len(k)).toBeCloseTo(1, 6);
      expect(k.every(Number.isFinite)).toBe(true);
    }
  });

  it('the rim comes from behind, on the same side as the key', () => {
    const k = keyDirection([0.2, 0.9], [0.5, 0.34], 16 / 9, 0.55);
    const r = rimDirection([0.2, 0.9], [0.5, 0.34], 16 / 9, -0.75);
    expect(len(r)).toBeCloseTo(1, 6);
    expect(r[2]).toBeLessThan(0);
    expect(Math.sign(r[0])).toBe(Math.sign(k[0]));
  });
});

describe('the point lights', () => {
  it('colour each effect as the brief says: Fire orange, Thunder yellow-white, Blizzard cyan, the orb green', () => {
    const fire = POINT_KINDS['fire']!.color;
    expect(fire[0]).toBeGreaterThan(fire[1]);
    expect(fire[1]).toBeGreaterThan(fire[2]);
    const th = POINT_KINDS['thunder']!.color;
    expect(th[0]).toBeGreaterThan(0.9);
    expect(th[1]).toBeGreaterThan(0.9);
    expect(th[2]).toBeLessThan(th[1]);
    const ice = POINT_KINDS['ice']!.color;
    expect(ice[2]).toBeGreaterThan(ice[1]);
    expect(ice[1]).toBeGreaterThan(ice[0]);
    const orb = ORB_COLORS['heal']!;
    expect(orb[1]).toBeGreaterThan(orb[0]);
    expect(orb[1]).toBeGreaterThan(orb[2]);
  });

  it('every effect id the spell layer draws has a light', () => {
    for (const id of ['fire', 'ice', 'thunder', 'water', 'holy', 'cure', 'hit', 'spiral', 'megaflare', 'bloom']) expect(POINT_KINDS[id], id).toBeDefined();
  });

  it('the envelope rises, holds, decays to nothing and never goes negative', () => {
    const k = POINT_KINDS['fire']!;
    expect(pointEnvelope(-0.1, k)).toBe(0);
    expect(pointEnvelope(0, k)).toBe(0);
    expect(pointEnvelope(k.rise + k.hold * 0.5, k, 0)).toBeCloseTo(k.peak, 6);
    expect(pointEnvelope(k.rise + k.hold + k.decay * 0.5, k, 0)).toBeLessThan(k.peak);
    expect(pointEnvelope(k.rise + k.hold + k.decay + 0.01, k)).toBe(0);
    for (let t = -0.2; t < 3; t += 0.05) expect(pointEnvelope(t, k, 0.7)).toBeGreaterThanOrEqual(0);
  });

  it('thunder flickers hard', () => {
    const th = POINT_KINDS['thunder']!;
    const hold = th.rise + th.hold * 0.5;
    expect(pointEnvelope(hold, th, 1)).toBeLessThan(pointEnvelope(hold, th, 0) * 0.6);
  });

  it('the fall-off is 1 at the light, falls with distance and is gone at the edge of the reach', () => {
    expect(pointFalloff(0, 0.24)).toBe(1);
    expect(pointFalloff(0.1, 0.24)).toBeLessThan(1);
    expect(pointFalloff(0.1, 0.24)).toBeGreaterThan(pointFalloff(0.2, 0.24));
    expect(pointFalloff(0.24 * Math.sqrt(6), 0.24)).toBeCloseTo(0, 10);
    expect(pointFalloff(5, 0.24)).toBe(0);
  });
});

describe('the normal map URL', () => {
  it('sits next to the painting, by the master it was drawn from', () => {
    expect(normalMapUrl('/art/characters/tidus/idle.png', 1)).toBe('/art/characters/tidus/idle.normal.png');
    expect(normalMapUrl('/art/characters/tidus/idle.png', 2)).toBe('/art/characters/tidus/idle@2x.normal.png');
    expect(normalMapUrl('/art/characters/tidus/idle.png', 3)).toBe('/art/characters/tidus/idle@2x.normal.png');
    expect(normalMapUrl('/art/characters/tidus/idle.png', 4)).toBe('/art/characters/tidus/idle@2x.normal.png');
    expect(normalMapUrl('/art/characters/tidus/idle@2x.png', 2)).toBe('/art/characters/tidus/idle@2x.normal.png');
  });

  it('reads a base path, a shipped webp and a query', () => {
    expect(normalMapUrl('/pyrefly-reprise/art/characters/yuna/cast.webp', 1)).toBe('/pyrefly-reprise/art/characters/yuna/cast.normal.png');
    expect(normalMapUrl('/art/characters/yuna/cast.png?v=3', 2)).toBe('/art/characters/yuna/cast@2x.normal.png?v=3');
  });

  it('is null for anything that is not a painting under art/', () => {
    expect(normalMapUrl('/images/idle.png', 1)).toBeNull();
    expect(normalMapUrl('/art/characters/tidus/idle.json', 1)).toBeNull();
  });
});
