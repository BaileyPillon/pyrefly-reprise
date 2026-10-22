/**
 * Release 62, decision 173a (Bailey, 2026-10-22 ~00:00 EDT; **FFX-2 only**: Chapter IV's Bevelle underground, the HD-2D bold look): the cathedral is alive, like Chapter I's stage. Dust motes drift in the cyan skylight
 * beam, the four lamps' flames flicker and throw moving light, and a hit sends a soft ring across the polished floor's reflection. Off with CLASSIC / `?look=off` (it runs inside the bold pass) and with LOW EFFECTS.
 *
 *  1. the recipe and the rule that decides when it runs;
 *  2. the maths the shader mirrors: the flicker's depth and mean, a mote's life, a ring's travel and fade;
 *  3. the hit cell (`StageImpacts`): costs nothing unless asked for;
 *  4. `LookLiving`: the uniforms it writes for a real camera and painting, the quality tiers, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, the live tweaks, the rings from real hits.
 */
import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { LIVING_QUALITY, MAX_MOTES, MAX_RIPPLES, ROOM_LIVING, hash21, lampFlicker, livingRecipe, livingWanted, moteAt, rippleLife, rippleWave, vnoise } from '../../src/engine/look/living/LivingConfig.ts';
import { LookLiving, type LivingFrame, type LivingUniforms } from '../../src/engine/look/living/LookLiving.ts';
import { impactsState, impactsWanted, noteImpact, takeImpacts } from '../../src/engine/look/living/StageImpacts.ts';
import { LIVING_GLSL_DECL, LIVING_GLSL_END, LIVING_GLSL_FUNCS, LIVING_GLSL_TOP, LIVING_UNIFORMS } from '../../src/engine/look/living/LivingShader.ts';
import { LookBoldShader } from '../../src/engine/look/LookBoldShader.ts';

const was = eyeCandy.env;
afterEach(() => {
  eyeCandy.env = was;
  impactsWanted(false);
});
const env = (over: Partial<ReturnType<typeof was>>): void => {
  eyeCandy.env = () => ({ ...was(), ...over });
};

describe('1. the recipe', () => {
  it('only the Bevelle underground has one, and it is FFX-2\'s', () => {
    expect(Object.keys(ROOM_LIVING)).toEqual(['bevelle-underground']);
    expect(livingRecipe('bevelle-underground')!.game).toBe('ffx2');
    expect(livingRecipe('gagazet')).toBeNull(); // Chapter I has its own stage (release 61)
    expect(livingRecipe('toString')).toBeNull();
  });

  it('runs inside the HD-2D (or cinematic) bold look and nowhere else: anime, subtle, no look and other rooms get none', () => {
    expect(livingWanted('hd2d', 'bold', 'bevelle-underground')).toBe(true);
    expect(livingWanted('cinematic', 'bold', 'bevelle-underground')).toBe(true);
    expect(livingWanted('anime', 'bold', 'bevelle-underground')).toBe(false);
    expect(livingWanted('hd2d', 'subtle', 'bevelle-underground')).toBe(false);
    expect(livingWanted(null, 'bold', 'bevelle-underground')).toBe(false); // CLASSIC and ?look=off
    expect(livingWanted('hd2d', 'bold', 'gagazet')).toBe(false);
  });

  it('the recipe names the three things: a beam on the painting, the lamps, the floor\'s rings', () => {
    const r = livingRecipe('bevelle-underground')!;
    expect(r.beam!.top[1]).toBeLessThan(r.beam!.bottom[1]); // from the rose windows at the top of the painting down the hall
    expect(r.beam!.halfBottom).toBeGreaterThan(r.beam!.halfTop); // it widens as it falls
    expect(r.motes).toBeGreaterThan(8);
    expect(r.motes).toBeLessThanOrEqual(MAX_MOTES);
    expect(r.lamps!.amp).toBeGreaterThan(0);
    expect(r.lamps!.amp).toBeLessThan(0.5); // a flicker, not a strobe
    expect(r.ripple!.decay).toBeGreaterThan(0);
  });

  it('the quality tiers drop motes and rings, and LOW keeps no dust and no ring', () => {
    expect(LIVING_QUALITY.high).toEqual({ motes: 1, lamps: 1, ripples: 3 });
    expect(LIVING_QUALITY.medium.motes).toBeLessThan(1);
    expect(LIVING_QUALITY.medium.ripples).toBeLessThan(LIVING_QUALITY.high.ripples);
    expect(LIVING_QUALITY.low.motes).toBe(0);
    expect(LIVING_QUALITY.low.ripples).toBe(0);
    expect(MAX_RIPPLES).toBe(3);
  });
});

describe('2. the maths the shader mirrors', () => {
  it('the hash and the noise are in 0..1 and smooth', () => {
    for (let i = 0; i < 200; i++) {
      const h = hash21(i * 1.37, i * 0.71);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      const n = vnoise(i * 0.31, i * 0.17);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(vnoise(3.0, 2.0) - vnoise(3.001, 2.0))).toBeLessThan(0.01);
  });

  it('a lamp\'s flicker stays within 1 +- amp, averages to about 1, and moves (a flame, not a lamp that is simply on)', () => {
    const amp = 0.2;
    let lo = Infinity;
    let hi = -Infinity;
    let sum = 0;
    let n = 0;
    let moved = 0;
    let prev = lampFlicker(0, 0, amp);
    for (let t = 0; t < 120; t += 1 / 30) {
      const f = lampFlicker(t, 0, amp);
      lo = Math.min(lo, f);
      hi = Math.max(hi, f);
      sum += f;
      n++;
      moved += Math.abs(f - prev);
      prev = f;
    }
    expect(lo).toBeGreaterThanOrEqual(1 - amp - 1e-9);
    expect(hi).toBeLessThanOrEqual(1 + amp + 1e-9);
    expect(sum / n).toBeGreaterThan(0.95);
    expect(sum / n).toBeLessThan(1.05);
    expect(hi - lo).toBeGreaterThan(amp * 0.8); // it uses most of its range
    expect(moved / n).toBeGreaterThan(0.004); // it is not still
    expect(moved / n).toBeLessThan(amp * 0.5); // and no frame jumps by a strobe's step
  });

  it('the four lamps do not flicker together, and amp 0 is a steady lamp', () => {
    const at = [0, 1, 2, 3].map((j) => lampFlicker(5.5, j, 0.2));
    expect(new Set(at.map((v) => v.toFixed(3))).size).toBeGreaterThanOrEqual(3);
    for (let t = 0; t < 10; t += 0.7) expect(lampFlicker(t, 2, 0)).toBe(1);
  });

  it('a mote is born dark at the top of the beam, rises into its light, is brightest on the axis and fades out near the bottom', () => {
    for (let i = 0; i < MAX_MOTES; i++) {
      for (let t = 0; t < 60; t += 0.37) {
        const m = moteAt(i, t);
        expect(m.s).toBeGreaterThanOrEqual(0);
        expect(m.s).toBeLessThan(1);
        expect(Math.abs(m.a)).toBeLessThan(1.1);
        expect(m.bright).toBeGreaterThanOrEqual(0);
        expect(m.bright).toBeLessThanOrEqual(1.0001);
        if (m.s < 0.02 || m.s > 0.995) expect(m.bright).toBeLessThan(0.1);
      }
    }
    // on average the motes near the axis are brighter than those near the edge
    let axis = 0;
    let edge = 0;
    let na = 0;
    let ne = 0;
    for (let i = 0; i < MAX_MOTES; i++) {
      for (let t = 0; t < 120; t += 0.5) {
        const m = moteAt(i, t);
        if (Math.abs(m.a) < 0.3) (axis += m.bright), na++;
        else if (Math.abs(m.a) > 0.6) (edge += m.bright), ne++;
      }
    }
    expect(axis / na).toBeGreaterThan(edge / ne);
  });

  it('each mote runs its own cycle (11 to 25 seconds), so the beam is never a loop of one', () => {
    const ss = Array.from({ length: MAX_MOTES }, (_, i) => moteAt(i, 7).s);
    expect(new Set(ss.map((s) => s.toFixed(2))).size).toBeGreaterThan(MAX_MOTES * 0.7);
    for (let i = 0; i < 6; i++) {
      const a = moteAt(i, 3).s;
      const b = moteAt(i, 3.5).s;
      const rate = (((b - a) % 1) + 1) % 1; // share of the beam crossed in half a second
      expect(rate).toBeGreaterThan(0.5 / 26);
      expect(rate).toBeLessThan(0.5 / 10);
    }
  });

  const rp = ROOM_LIVING['bevelle-underground']!.ripple!;
  it('a ring is nothing before the hit, travels outward at its speed, and fades: gone in about two and a half seconds', () => {
    expect(rippleWave(-0.1, 0.1, 1, rp)).toBe(0);
    expect(rippleWave(0.5, 0.1, 0, rp)).toBe(0);
    // the envelope follows the ring out: at age a the wave is strongest near rad = a * speed
    const peakRad = (age: number): number => {
      let best = 0;
      let at = 0;
      for (let r = 0; r < 1.2; r += 0.002) {
        const w = Math.abs(rippleWave(age, r, 1, rp));
        if (w > best) [best, at] = [w, r];
      }
      return at;
    };
    expect(Math.abs(peakRad(0.4) - 0.4 * rp.speed)).toBeLessThan(0.06);
    expect(peakRad(1.0)).toBeGreaterThan(peakRad(0.4));
    const amp = (age: number): number => {
      let best = 0;
      for (let r = 0; r < 1.2; r += 0.002) best = Math.max(best, Math.abs(rippleWave(age, r, 1, rp)));
      return best;
    };
    expect(amp(0.3)).toBeGreaterThan(amp(1.2));
    expect(amp(1.2)).toBeGreaterThan(amp(2.4));
    expect(amp(rippleLife(rp) + 0.2)).toBeLessThan(0.03);
    expect(rippleLife(rp)).toBeGreaterThan(1.5);
    expect(rippleLife(rp)).toBeLessThan(3);
    // a heavy hit is stronger by its strength factor
    expect(amp(0.4)).toBeGreaterThan(0); // (the sine is zero exactly on the ring; its strength shows beside it)
    let strong = 0;
    let light = 0;
    for (let r = 0; r < 0.6; r += 0.002) {
      strong = Math.max(strong, Math.abs(rippleWave(0.4, r, 1, rp)));
      light = Math.max(light, Math.abs(rippleWave(0.4, r, 0.72, rp)));
    }
    expect(strong).toBeGreaterThan(light * 1.3);
  });
});

describe('3. the hit cell', () => {
  it('does nothing unless the look asked for hits: no note is kept', () => {
    impactsWanted(false);
    noteImpact({}, true);
    expect(impactsState()).toEqual({ wanted: false, waiting: 0 });
    expect(takeImpacts()).toHaveLength(0);
  });

  it('keeps the last eight, in order, empties when taken, and drops what waits when turned off', () => {
    impactsWanted(true);
    const actors = Array.from({ length: 11 }, () => ({}));
    actors.forEach((a, i) => noteImpact(a, i % 2 === 0));
    expect(impactsState().waiting).toBe(8);
    const got = takeImpacts();
    expect(got.map((g) => g.actor)).toEqual(actors.slice(3));
    expect(got[0]!.heavy).toBe(false); // actors[3] was a light one
    expect(impactsState().waiting).toBe(0);
    noteImpact({}, false);
    impactsWanted(false);
    expect(impactsState().waiting).toBe(0);
  });
});

// ------------------------------------------------------------------ LookLiving

type V4 = { x: number; y: number; z: number; w: number; set(x: number, y: number, z: number, w: number): void };
const v4 = (): V4 => ({ x: 0, y: 0, z: 0, w: 0, set(x, y, z, w) { Object.assign(this, { x, y, z, w }); } });
interface TU {
  uLiv: { value: V4 };
  uBeamA: { value: V4 };
  uBeamB: { value: V4 };
  uBeamC: { value: V4 };
  uRip: { value: V4[] };
  uRipP: { value: V4 };
  uRipG: { value: number };
  uLamp: { value: V4 };
  uLampC: { value: { set(): void } };
}
function uniforms(): TU {
  return {
    uLiv: { value: v4() },
    uBeamA: { value: v4() },
    uBeamB: { value: v4() },
    uBeamC: { value: v4() },
    uRip: { value: [v4(), v4(), v4()] },
    uRipP: { value: v4() },
    uRipG: { value: 0 },
    uLamp: { value: v4() },
    uLampC: { value: { set: () => undefined } },
  };
}

/** The Bevelle painting as the scene lays it: a wide plane behind the stage, a camera looking at it. */
function painting(): { mesh: Mesh; camera: PerspectiveCamera } {
  const mesh = new Mesh(new PlaneGeometry(82, 46.9), new MeshBasicMaterial());
  mesh.position.set(0, 12, -48);
  mesh.updateMatrixWorld(true);
  const camera = new PerspectiveCamera(32, 16 / 9, 0.1, 400);
  camera.position.set(0, 4, 22);
  camera.lookAt(0, 8, 0);
  camera.updateMatrixWorld(true);
  return { mesh, camera };
}

function frame(over: Omit<Partial<LivingFrame>, 'u'> & { u: TU }): LivingFrame {
  const { mesh, camera } = painting();
  return { key: 'bevelle-underground', mesh, camera, time: 5, quality: 'high', aspect: 16 / 9, feet: new Map(), tweak: (_k, d) => d, ...over, u: over.u as unknown as LivingUniforms };
}

describe('4. LookLiving', () => {
  it('writes the beam for a real camera and painting: the top above the bottom, the beam wider at the bottom, the motes at the recipe\'s count, the lamps lit', () => {
    const u = uniforms();
    const L = new LookLiving();
    expect(L.update(frame({ u }))).toBe(true);
    expect(u.uLiv.value.x).toBe(1);
    expect(u.uLiv.value.y).toBe(ROOM_LIVING['bevelle-underground']!.motes);
    expect(u.uBeamA.value.y).toBeGreaterThan(u.uBeamA.value.w); // top.y above bottom.y on the frame
    expect(Number.isFinite(u.uBeamA.value.x)).toBe(true);
    expect(u.uBeamB.value.y).toBeGreaterThan(u.uBeamB.value.x);
    expect(u.uBeamB.value.z).toBeGreaterThan(0);
    expect(u.uBeamB.value.w).toBeCloseTo(2.7 / 900, 6);
    expect(u.uLamp.value.x).toBeGreaterThan(0);
    expect(u.uLiv.value.w).toBeCloseTo(ROOM_LIVING['bevelle-underground']!.lamps!.amp, 6); // the flicker's depth
    expect(L.stats.on).toBe(true);
  });

  it('a room with no recipe, the master tweaked to 0, or LOW EFFECTS: the master is zero (the pass is what it was) and the hit cell is off', () => {
    const u = uniforms();
    const L = new LookLiving();
    expect(L.update(frame({ u, key: 'gagazet' }))).toBe(false);
    expect(u.uLiv.value.x).toBe(0);
    expect(L.update(frame({ u, tweak: (k, d) => (k === 'living' ? 0 : d) }))).toBe(false);
    expect(u.uLiv.value.x).toBe(0);
    expect(impactsState().wanted).toBe(false);
    env({ lowEffects: true });
    expect(L.update(frame({ u }))).toBe(false);
    expect(u.uLiv.value.x).toBe(0);
    expect(L.stats.on).toBe(false);
  });

  it('the tiers: medium keeps part of the dust and two rings, low no dust and no rings (the lamps stay, at half)', () => {
    const rec = ROOM_LIVING['bevelle-underground']!;
    const u = uniforms();
    const L = new LookLiving();
    L.update(frame({ u, quality: 'medium' }));
    expect(u.uLiv.value.y).toBe(Math.round(rec.motes * LIVING_QUALITY.medium.motes));
    L.update(frame({ u, quality: 'low' }));
    expect(u.uLiv.value.y).toBe(0);
    expect(u.uLiv.value.x).toBe(1);
    expect(u.uLamp.value.x).toBeCloseTo(rec.lamps!.spill * 0.5, 6);
    expect(impactsState().wanted).toBe(false); // no rings wanted: no hit is kept
  });

  it('a hit starts a ring at that figure\'s feet; the ring ages with the look\'s clock, three at most, and is gone by its life', () => {
    const u = uniforms();
    const L = new LookLiving();
    const yuna = {};
    const rikku = {};
    const feet = new Map<object, readonly [number, number]>([[yuna, [0.3, 0.2]], [rikku, [0.45, 0.18]]]);
    L.update(frame({ u, feet, time: 10 }));
    expect(impactsState().wanted).toBe(true);
    noteImpact(yuna, true);
    L.update(frame({ u, feet, time: 10.1 }));
    expect(u.uLiv.value.z).toBe(1);
    expect(u.uRip.value[0]).toMatchObject({ x: 0.3, y: 0.2, w: 1 });
    expect(u.uRip.value[0]!.z).toBeCloseTo(0, 6);
    L.update(frame({ u, feet, time: 10.6 }));
    expect(u.uRip.value[0]!.z).toBeCloseTo(0.5, 6);
    expect(u.uRip.value[1]!.z).toBeLessThan(0); // an unused slot reads "not there"
    // a second and a third hit; a fourth pushes the oldest out
    noteImpact(rikku, false);
    L.update(frame({ u, feet, time: 10.7 }));
    expect(u.uRip.value[0]).toMatchObject({ x: 0.45, w: 0.72 });
    noteImpact(yuna, false);
    noteImpact(rikku, false);
    L.update(frame({ u, feet, time: 10.8 }));
    expect(u.uLiv.value.z).toBe(3);
    noteImpact(yuna, true);
    L.update(frame({ u, feet, time: 10.9 }));
    expect(u.uLiv.value.z).toBe(3);
    // all gone by their life
    L.update(frame({ u, feet, time: 10.9 + rippleLife(ROOM_LIVING['bevelle-underground']!.ripple!) + 0.1 }));
    expect(u.uLiv.value.z).toBe(0);
    expect(u.uRip.value.every((r) => r.z < 0)).toBe(true);
  });

  it('a hit on a figure the look cannot place (hidden, lying, not in its list) starts nothing', () => {
    const u = uniforms();
    const L = new LookLiving();
    L.update(frame({ u }));
    noteImpact({}, true);
    L.update(frame({ u }));
    expect(u.uLiv.value.z).toBe(0);
  });

  it('REDUCE MOTION: the lamps hold steady (depth 0) and no ring is ever started', () => {
    env({ reduceMotion: true });
    const u = uniforms();
    const L = new LookLiving();
    const a = {};
    L.update(frame({ u, feet: new Map([[a, [0.3, 0.2]]]) }));
    noteImpact(a, true);
    L.update(frame({ u, feet: new Map([[a, [0.3, 0.2]]]) }));
    expect(u.uLiv.value.w).toBe(0);
    expect(u.uLiv.value.z).toBe(0);
    expect(u.uLiv.value.y).toBeGreaterThan(0); // the dust hangs where it is (the look's clock has stopped)
    expect(impactsState().wanted).toBe(false);
  });

  it('REDUCE FLASHES: the lamps\' flicker is a third as deep', () => {
    const rec = ROOM_LIVING['bevelle-underground']!.lamps!;
    const u = uniforms();
    const L = new LookLiving();
    L.update(frame({ u }));
    const full = u.uLiv.value.w;
    env({ reduceFlashes: true });
    L.update(frame({ u }));
    expect(u.uLiv.value.w).toBeCloseTo(full * 0.33, 6);
    expect(full).toBeCloseTo(rec.amp, 6);
  });

  it('the live tweaks take one part away each (living.beam, living.lamps, living.ripple)', () => {
    const u = uniforms();
    const L = new LookLiving();
    L.update(frame({ u, tweak: (k, d) => (k === 'living.beam' ? 0 : d) }));
    expect(u.uLiv.value.y).toBe(0);
    L.update(frame({ u, tweak: (k, d) => (k === 'living.lamps' ? 0 : d) }));
    expect(u.uLiv.value.w).toBe(0);
    expect(u.uLamp.value.x).toBe(0);
    L.update(frame({ u, tweak: (k, d) => (k === 'living.ripple' ? 0 : d) }));
    expect(impactsState().wanted).toBe(false);
  });

  it('off() puts the master and every ring to zero and the hit cell off', () => {
    const u = uniforms();
    const L = new LookLiving();
    L.update(frame({ u }));
    L.off(u as unknown as LivingUniforms);
    expect(u.uLiv.value.x).toBe(0);
    expect(u.uRip.value.every((r) => r.z < 0)).toBe(true);
    expect(impactsState().wanted).toBe(false);
  });
});

describe('5. the shader', () => {
  it('the bold pass carries the uniforms and the four chunks, each guarded by the master so a zero master is the old frame', () => {
    for (const name of Object.keys(LIVING_UNIFORMS)) expect(Object.keys(LookBoldShader.uniforms)).toContain(name);
    const frag = LookBoldShader.fragmentShader;
    expect(frag).toContain(LIVING_GLSL_DECL.trim());
    expect(frag).toContain(LIVING_GLSL_FUNCS.trim());
    expect(frag).toContain(LIVING_GLSL_TOP.trim());
    expect(frag).toContain(LIVING_GLSL_END.trim());
    expect(LIVING_GLSL_TOP).toContain('uLiv.x > 0.001');
    expect(LIVING_GLSL_END).toContain('uLiv.x > 0.001');
    expect(LookBoldShader.uniforms.uLiv.value.x).toBe(0);
    // the ring bends the reflection's sample, and the TOP chunk comes before the figure mask is read, so a bent pixel is judged on what it now is
    expect(frag.indexOf(LIVING_GLSL_TOP.trim())).toBeLessThan(frag.indexOf('float fig = 1.0 - clamp(src.a'));
    expect(frag).toContain('ro.x * 2.5');
    expect(frag).toContain('ro.y * 2.0');
  });

  it('the dust is drawn behind the figures and the ring never bends a figure\'s own pixels', () => {
    expect(LIVING_GLSL_END).toMatch(/fig < 0\.5/);
    expect(LIVING_GLSL_END).toMatch(/\(1\.0 - fig\)/);
    expect(LIVING_GLSL_TOP).toContain('src.a > 0.98 && s2.a > 0.98');
  });
});
