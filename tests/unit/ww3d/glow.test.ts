/**
 * **The cast aura** (`src/engine/ww3d/glow.ts`, the `uToonGlow` cell of `toon.ts` and `toonify.ts`; the hidden Wind Waker chapter, FFX-2 only): phase 2's glow was an emissive fill at 0.5 that turned the girls into cream
 * ghosts (stills 29 to 31) and washed Valefor pale gold for the whole charge (55 to 58, 66 to 68). The aura is now a thin toon rim in the spell's colour, pulsing, with a faint fill under it. Pinned here: the parameters,
 * the colours by spell, the pulse, that the shader draws a band and nothing else, and that each figure has a cell of its own.
 */
import { Color, Mesh, MeshBasicMaterial, SphereGeometry, Vector4 } from 'three';
import { describe, expect, it } from 'vitest';

import { BOSS_RIM, DEFAULT_RIM, GLOW_FILL, RIM_SHAPE_BOSS, RIM_SHAPE_GIRL, PULSE_HZ, PULSE_LOW, RIM_GAIN, RISE_SECONDS, fillAmount, glowLevel, rimPulse, rimStrength, spellRim } from '../../../src/engine/ww3d/glow.ts';
import { TOON_PARS, createToonUniforms, makeToonMaterial } from '../../../src/engine/ww3d/toon.ts';
import { driveToon, toonify } from '../../../src/engine/ww3d/toonify.ts';

const lum = (c: readonly [number, number, number]): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

describe('the parameters', () => {
  it('keeps almost none of phase 2\'s emissive fill (it was 0.5): the fill under the rim cannot hide a face or a costume', () => {
    expect(GLOW_FILL).toBeLessThanOrEqual(0.1);
    expect(fillAmount(1)).toBeCloseTo(GLOW_FILL, 12);
    expect(fillAmount(0)).toBe(0);
    expect(fillAmount(-3)).toBe(0);
    expect(fillAmount(9)).toBeCloseTo(GLOW_FILL, 12);
  });

  it('pulses between its low and 1, about twice a second, and never to nothing while it is on', () => {
    expect(PULSE_HZ).toBeGreaterThan(1);
    expect(PULSE_HZ).toBeLessThan(3);
    let lo = 9;
    let hi = -9;
    for (let t = 0; t < 2; t += 0.01) {
      lo = Math.min(lo, rimPulse(t));
      hi = Math.max(hi, rimPulse(t));
    }
    expect(lo).toBeCloseTo(PULSE_LOW, 2);
    expect(hi).toBeCloseTo(1, 2);
    expect(PULSE_LOW).toBeGreaterThan(0.4);
  });

  it('rises over a quarter second to a held level, and the strength is the level times the pulse times the gain', () => {
    expect(glowLevel(0)).toBe(0);
    expect(glowLevel(RISE_SECONDS / 2)).toBeCloseTo(0.5, 9);
    expect(glowLevel(RISE_SECONDS)).toBe(1);
    expect(glowLevel(10)).toBe(1);
    expect(glowLevel(-1)).toBe(0);
    expect(rimStrength(1, 0.25)).toBeCloseTo(rimPulse(0.25) * RIM_GAIN, 12);
    expect(rimStrength(0, 3)).toBe(0);
    expect(rimStrength(0.5, 3)).toBeCloseTo(0.5 * rimPulse(3) * RIM_GAIN, 12);
  });
});

describe('the colours', () => {
  it('follow the spell: fire orange, ice pale blue, lightning yellow, water blue, a cure green-white, Protect gold, Shell violet, anything else a warm gold', () => {
    const [fr, , fb] = spellRim('fire');
    expect(fr).toBeGreaterThan(fb + 0.5);
    const ice = spellRim('blizzard');
    expect(ice[2]).toBeGreaterThan(ice[0]);
    const bolt = spellRim('thunder');
    expect(bolt[0]).toBeGreaterThan(0.7);
    expect(bolt[1]).toBeGreaterThan(0.7);
    expect(bolt[2]).toBeLessThan(0.4);
    const water = spellRim('water');
    expect(water[2]).toBeGreaterThan(water[0] + 0.5);
    const cure = spellRim('cure');
    expect(cure[1]).toBeGreaterThan(cure[0]);
    const protect = spellRim('x2-bulwark-right-protect');
    expect(protect[0]).toBeGreaterThan(protect[2] + 0.4);
    const shell = spellRim('shell');
    expect(shell[2]).toBeGreaterThan(shell[1]);
    expect(spellRim(undefined)).toEqual(DEFAULT_RIM);
    expect(spellRim('something-else-entirely')).toEqual(DEFAULT_RIM);
    expect(spellRim('FIRE')).toEqual(spellRim('fire'));
    expect(BOSS_RIM[0]).toBeGreaterThan(BOSS_RIM[2] + 0.4); // Valefor's charge is warm
  });

  it('are bright, never white: a full rim added to a lit surface stays a thin halo, not a bloom of the whole figure', () => {
    for (const id of ['fire', 'blizzard', 'thunder', 'water', 'cure', 'protect', 'shell', 'haste', 'holy', undefined]) {
      const c = spellRim(id);
      for (const v of c) expect(v).toBeLessThanOrEqual(1);
      expect(lum(c)).toBeGreaterThan(0.2);
    }
    for (const v of BOSS_RIM) expect(v).toBeLessThanOrEqual(1);
    expect(RIM_GAIN).toBeLessThanOrEqual(1);
  });
});

describe('the shader and the cells', () => {
  it('draws the aura as two hard steps of the silhouette mixed over the lit colour: it reads N.V and the cell, and writes nothing else', () => {
    expect(TOON_PARS).toContain('uniform vec4 uToonGlow;');
    expect(TOON_PARS).toMatch(/glowInner\s*=\s*1\.0\s*-\s*smoothstep/); // smoothsteps of N.V: bands at the silhouette, not a fill
    expect(TOON_PARS).toMatch(/glowOuter\s*=\s*1\.0\s*-\s*smoothstep/);
    expect(TOON_PARS).toContain('glowBand * uToonGlow.a');
    // the lit colour (under the ceiling) is mixed toward the spell's colour by the band times the strength: no strength, or off the band, leaves the lit colour exactly as it was
    const line = TOON_PARS.split('\n').find((l) => l.includes('reflectedLight.indirectDiffuse +='))!;
    expect(line).toContain('mix( min( col, vec3( uToonCeil ) )');
    expect(line.indexOf('uToonCeil')).toBeLessThan(line.indexOf('uToonGlow'));
    expect(createToonUniforms().uToonGlow.value.w).toBe(0); // off unless a figure turns it on
  });

  it('gives each figure a cell of its own, off at first, and driving one never moves another', () => {
    const u = createToonUniforms();
    const a = new Mesh(new SphereGeometry(1, 4, 3), new MeshBasicMaterial());
    const b = new Mesh(new SphereGeometry(1, 4, 3), new MeshBasicMaterial());
    const sa = toonify(a, u);
    const sb = toonify(b, u);
    expect(sa.glow).not.toBe(sb.glow);
    expect(sa.glow).not.toBe(u.uToonGlow);
    expect(sa.glow.value.w).toBe(0);
    const base = { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 1 };
    driveToon(sa, { ...base, rim: { colour: [1, 0.5, 0.1], strength: 0.8 } });
    expect(sa.glow.value.toArray()).toEqual([1, 0.5, 0.1, 0.8]);
    expect(sb.glow.value.w).toBe(0);
    expect(u.uToonGlow.value.w).toBe(0);
    driveToon(sa, base); // no rim: the strength goes to zero (the colour is left, it is not drawn)
    expect(sa.glow.value.w).toBe(0);
    expect(sa.glow.value instanceof Vector4).toBe(true);
    // every material of the figure shares that cell, so one write lights them all
    const mat = a.material as unknown as { userData: { uniforms: Record<string, { value: unknown }> } };
    expect(mat.userData.uniforms['uToonGlow']).toBe(sa.glow);
  });

  it("gives Valefor steps half as wide as a girl's: her wings and thin legs stand edge-on over much of her body, and the first capture washed her teal to olive", () => {
    expect(RIM_SHAPE_BOSS[1]).toBeLessThan(RIM_SHAPE_GIRL[0]); // even her lighter outer step is thinner than a girl's strong band
    expect(RIM_SHAPE_BOSS[0]).toBeLessThan(RIM_SHAPE_BOSS[1]);
    expect(RIM_SHAPE_GIRL[0]).toBeLessThan(RIM_SHAPE_GIRL[1]);
    expect(RIM_SHAPE_GIRL[1]).toBeLessThanOrEqual(0.6); // a thin rim, never the surface
    expect(TOON_PARS).toContain('uniform vec2 uToonGlowShape;');
    expect(TOON_PARS).toContain('smoothstep( uToonGlowShape.x - glowW');
    const u = createToonUniforms();
    const sa = toonify(new Mesh(new SphereGeometry(1, 4, 3), new MeshBasicMaterial()), u);
    const sb = toonify(new Mesh(new SphereGeometry(1, 4, 3), new MeshBasicMaterial()), u);
    expect(sa.glowShape).not.toBe(sb.glowShape);
    driveToon(sa, { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 1, rim: { colour: [1, 1, 1], strength: 1, shape: RIM_SHAPE_BOSS } });
    expect(sa.glowShape.value.toArray()).toEqual([...RIM_SHAPE_BOSS]);
    expect(sb.glowShape.value.toArray()).toEqual([...RIM_SHAPE_GIRL]); // another figure's cell is untouched
  });

  it('a material made for the stage reads the shared cell, which stays off', () => {
    const u = createToonUniforms();
    const m = makeToonMaterial(u, {});
    expect((m.userData['uniforms'] as typeof u).uToonGlow.value.w).toBe(0);
  });
});
