import { describe, expect, it } from 'vitest';
import { NO_STAGE, ROOM_STAGE, STAGE_QUALITY, stageRecipe, stageWanted } from '../../src/engine/look/stage/StageConfig.ts';
import { NO_WIND, facetGlint, glintFresnel, glintReach, gustAt, gustShaft, gustThicken, hash21, layerSlidePx, windClock, type GlintView } from '../../src/engine/look/stage/StageMaths.ts';
import { calmStageWind, setStageWind, stageWind } from '../../src/engine/look/stage/StageWind.ts';

const GAG = ROOM_STAGE['gagazet']!;

describe('depth stage: the wind', () => {
  it('is calm and exactly 1x for a room with no wind', () => {
    for (const t of [0, 3, 17.3, 400]) expect(gustAt(t, NO_WIND)).toBe(0);
    expect(windClock(5, 0.016, 0.9, NO_WIND)).toBeCloseTo(5.016, 12);
    expect(gustThicken(0.9, NO_WIND)).toBe(1);
  });

  it('stays in 0..1, never hangs at 0, and has real gusts and real calms over two minutes', () => {
    let strong = 0;
    let calm = 0;
    let n = 0;
    let peaks = 0;
    let weakest = 1;
    let strongest = 0;
    for (let t = 0; t < 120; t += 0.05) {
      const g = gustAt(t, GAG.wind);
      expect(g).toBeGreaterThanOrEqual(0.08 - 1e-9);
      expect(g).toBeLessThanOrEqual(1 + 1e-9);
      if (g > 0.5) strong++;
      if (g < 0.2) calm++;
      n++;
      const prev = gustAt(t - 0.05, GAG.wind);
      const next = gustAt(t + 0.05, GAG.wind);
      if (g > prev && g >= next && g > 0.3) {
        peaks++;
        weakest = Math.min(weakest, g);
        strongest = Math.max(strongest, g);
      }
    }
    expect(strong / n).toBeGreaterThan(0.1); // gusts that matter ...
    expect(strong / n).toBeLessThan(0.4); // ... that do not blow all the time
    expect(calm / n).toBeGreaterThan(0.3); // and a calm between them
    expect(peaks).toBeGreaterThanOrEqual(9); // one about every 11 seconds: 10 or 11 in 120 s, none missing for long
    expect(strongest).toBeGreaterThan(0.85); // some are the full strength ...
    expect(weakest).toBeLessThan(0.65); // ... and some are not: never the same twice in a row
    expect(weakest).toBeGreaterThan(0.3); // but none is nothing
  });

  it('a gust is a bell: it leans in and eases out over about its length, never a step', () => {
    // find a crest, and check the half-height width is near `length` seconds and the slope is bounded (no flat top, no jump)
    let top = 0;
    let at = 0;
    for (let t = 25; t < 36; t += 0.01) {
      const g = gustAt(t, GAG.wind);
      if (g > top) {
        top = g;
        at = t;
      }
    }
    const half = 0.08 + (top - 0.08) / 2;
    let lo = at;
    while (gustAt(lo, GAG.wind) > half) lo -= 0.01;
    let hi = at;
    while (gustAt(hi, GAG.wind) > half) hi += 0.01;
    expect(hi - lo).toBeGreaterThan(GAG.wind.length * 0.6);
    expect(hi - lo).toBeLessThan(GAG.wind.length * 1.5);
    let steepest = 0;
    for (let t = 0; t < 60; t += 1 / 60) steepest = Math.max(steepest, Math.abs(gustAt(t + 1 / 60, GAG.wind) - gustAt(t, GAG.wind)) * 60);
    expect(steepest).toBeLessThan(0.7); // gust units a second: it takes more than a second to go from calm to the top
  });

  it('is deterministic and the phase moves it', () => {
    expect(gustAt(8.25, GAG.wind)).toBe(gustAt(8.25, GAG.wind));
    const a = gustAt(2, GAG.wind);
    const b = gustAt(2, { ...GAG.wind, phase: GAG.wind.phase + 5.5 });
    expect(Math.abs(a - b)).toBeGreaterThan(0.01);
  });

  it('a gust speeds the clock by 1 + speedUp at the peak, never backwards', () => {
    const w = { ...GAG.wind, speedUp: 1.6 };
    expect(windClock(10, 0.5, 0, w)).toBeCloseTo(10.5, 12);
    expect(windClock(10, 0.5, 1, w)).toBeCloseTo(10 + 0.5 * 2.6, 12);
    expect(windClock(10, -1, 1, w)).toBe(10);
    let c = 0;
    for (let i = 0; i < 600; i++) {
      const n = windClock(c, 1 / 60, gustAt(i / 60, w), w);
      expect(n).toBeGreaterThan(c);
      c = n;
    }
  });

  it('thickens streaks and mist at the peak and not at a calm', () => {
    expect(gustThicken(0, GAG.wind)).toBe(1);
    expect(gustThicken(1, GAG.wind)).toBeCloseTo(1 + GAG.wind.thicken, 12);
    expect(gustThicken(5, GAG.wind)).toBeCloseTo(1 + GAG.wind.thicken, 12); // clamped
  });

  it('brightens the moon shafts with the gust, and not at all in a room with no wind', () => {
    expect(gustShaft(0, GAG.wind)).toBe(1);
    expect(gustShaft(1, GAG.wind)).toBeCloseTo(1 + (GAG.wind.shaft ?? 0), 12);
    expect(gustShaft(1, GAG.wind)).toBeGreaterThan(1.1);
    expect(gustShaft(1, GAG.wind)).toBeLessThan(1.6); // a lift, not a flood
    expect(gustShaft(1, NO_WIND)).toBe(1);
  });

  it('the shared cell stands at calm and goes back to it', () => {
    expect(stageWind).toEqual({ gust: 0, speed: 1, thicken: 1, shaft: 1, density: 1 });
    setStageWind(0.7, 2.1, 1.6, 1.25);
    expect(stageWind.speed).toBe(2.1);
    expect(stageWind.shaft).toBe(1.25);
    calmStageWind();
    expect(stageWind).toEqual({ gust: 0, speed: 1, thicken: 1, shaft: 1, density: 1 });
  });
});

describe('depth stage: the moon on the ice', () => {
  // the eye 3.7 m up looking at the floor point 20 m ahead, the moon 60 m away and 6 m up, straight behind the point
  const unit = (v: [number, number, number]): [number, number, number] => {
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const aligned: GlintView = { from: unit([0, 3.7, 20]), to: unit([0, 6, -40]) };

  it('hashes into 0..1 and is deterministic', () => {
    for (let i = 0; i < 200; i++) {
      const h = hash21(i * 0.37, -i * 1.9);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
    expect(hash21(3, 4)).toBe(hash21(3, 4));
  });

  it('always stays in 0..1', () => {
    for (let i = 0; i < 400; i++) {
      const g = facetGlint(i, -i * 3, aligned, GAG.glint!.rough, GAG.glint!.width, i * 0.1, GAG.glint!.speed);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(1);
    }
  });

  it('a flat floor on the road throws the moon back, a floor off the road does not', () => {
    // a flat facet (rough 0): its normal is straight up, which is the half vector when the eye and the moon mirror each other about the vertical
    const mirror: GlintView = { from: unit([0, 3.7, 20]), to: unit([0, 3.7, -20]) };
    const on = facetGlint(4, 9, mirror, 0, 0.05, 0.3, 2);
    const off = facetGlint(4, 9, { from: unit([0, 3.7, 20]), to: unit([-30, 3.7, -5]) }, 0, 0.05, 0.3, 2);
    expect(on).toBeGreaterThan(0.3);
    expect(off).toBe(0);
  });

  it('a moon behind the eye lights nothing on the floor', () => {
    const behind: GlintView = { from: unit([0, 3.7, 20]), to: unit([0, 6, 40]) };
    let any = 0;
    for (let i = 0; i < 400; i++) any += facetGlint(i, i * 2, behind, 0.42, 0.05, 1, 2);
    expect(any).toBeLessThan(0.5);
  });

  it('a rougher floor makes a broader road (more facets shine off the line)', () => {
    const off: GlintView = { from: unit([0, 3.7, 20]), to: unit([-4, 3.7, -40]) }; // 5.7 degrees off the road
    const count = (rough: number): number => {
      let n = 0;
      for (let i = 0; i < 2000; i++) if (facetGlint(i, (i * 7) % 331, off, rough, 0.05, 1.7, 2) > 0.05) n++;
      return n;
    };
    expect(count(0.5)).toBeGreaterThan(count(0.12));
  });

  it('the sheen brightens toward the horizon: nothing straight down, everything at a grazing angle, and monotone between', () => {
    expect(glintFresnel(1)).toBe(0);
    expect(glintFresnel(0)).toBe(1);
    let prev = 2;
    for (let v = 0; v <= 1; v += 0.05) {
      const f = glintFresnel(v);
      expect(f).toBeLessThanOrEqual(prev);
      prev = f;
    }
    expect(glintFresnel(0.68)).toBeLessThan(0.02); // the floor at the party's feet barely shines
    expect(glintFresnel(0.15)).toBeGreaterThan(0.5); // the far ice shines
  });

  it('the early-out reach is a real cosine and narrows with a stiffer floor', () => {
    expect(glintReach(0.42, 0.05)).toBeLessThan(1);
    expect(glintReach(0.1, 0.05)).toBeGreaterThan(glintReach(0.42, 0.05));
    expect(glintReach(0, 0)).toBeCloseTo(1, 12);
  });
});

describe('depth stage: the layers', () => {
  it('a nearer layer slides further than a farther one, in proportion to the camera shift', () => {
    const a = layerSlidePx(0.4, 20, 48, 32, 16 / 9, 1600);
    const b = layerSlidePx(0.8, 20, 48, 32, 16 / 9, 1600);
    expect(b).toBeCloseTo(a * 2, 9);
    expect(layerSlidePx(0.4, 12, 48, 32, 16 / 9, 1600)).toBeGreaterThan(a);
    expect(layerSlidePx(0.4, 48, 48, 32, 16 / 9, 1600)).toBe(0);
  });

  it('the slide is a few pixels to a few tens of pixels at the live drift, not a jump cut', () => {
    // option B's lateral drift is 0.42 m; plates stand at 11.25 + 12..48 m from the reference camera
    const px = layerSlidePx(0.42, 11.25 + 12, 11.25 + 48, 32, 16 / 9, 1600);
    expect(px).toBeGreaterThan(3);
    expect(px).toBeLessThan(60);
  });
});

describe('depth stage: the recipe table', () => {
  it('Chapter I\'s room (FFX) has a recipe and an unknown room has none', () => {
    expect(stageRecipe('gagazet')).toBe(GAG);
    expect(GAG.game).toBe('ffx');
    expect(stageRecipe('bevelle-underground')).toBeNull();
    expect(stageRecipe('toString')).toBeNull(); // no prototype keys
    expect(stageRecipe('__proto__')).toBeNull();
    expect(NO_STAGE.glint).toBeNull();
  });

  it('runs only inside hd2d or cinematic at bold strength in a room that has a recipe', () => {
    expect(stageWanted('hd2d', 'bold', 'gagazet')).toBe(true);
    expect(stageWanted('cinematic', 'bold', 'gagazet')).toBe(true);
    expect(stageWanted('hd2d', 'subtle', 'gagazet')).toBe(false);
    expect(stageWanted('anime', 'bold', 'gagazet')).toBe(false);
    expect(stageWanted(null, 'bold', 'gagazet')).toBe(false); // ?look=off and CLASSIC
    expect(stageWanted('hd2d', 'bold', 'bevelle-underground')).toBe(false);
  });

  it('the tiers drop the glitter, the banks and the wind in order', () => {
    expect(STAGE_QUALITY.high.glint).toBe(1);
    expect(STAGE_QUALITY.medium.glint).toBeLessThan(STAGE_QUALITY.high.glint);
    expect(STAGE_QUALITY.low.glint).toBe(0);
    expect(STAGE_QUALITY.medium.density).toBeLessThanOrEqual(STAGE_QUALITY.high.density);
    expect(STAGE_QUALITY.low.density).toBeLessThanOrEqual(STAGE_QUALITY.medium.density);
    expect(STAGE_QUALITY.low.wind).toBeLessThan(STAGE_QUALITY.high.wind);
  });

  it('the glint spec is sane: the moon is on the painting, the colour a colour, the patch has a size', () => {
    const g = GAG.glint!;
    expect(g.moon[0]).toBeGreaterThan(0);
    expect(g.moon[0]).toBeLessThan(1);
    expect(g.moon[1]).toBeGreaterThan(0);
    expect(g.moon[1]).toBeLessThan(0.5);
    for (const c of g.color) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
    expect(g.cell).toBeGreaterThan(0.01);
    expect(g.radius).toBeGreaterThan(g.cell * 10);
  });
});
