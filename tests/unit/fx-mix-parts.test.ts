/**
 * The MAX mix's parts that can be checked without a browser (D-316): the twirl-key slot (FFX-2 only;
 * no keys installed means today's flourish), the splash crops of approved paintings, the Overdrive
 * banner's height (FFX only), the defringe and breathing shader patches against the real painted
 * shaders, the chest rig, and the held shots' rules. Game case per test name.
 */
import { describe, expect, it } from 'vitest';
import { ShaderMaterial } from 'three';
import { paintedFragmentShader, paintedVertexShader } from '../../src/engine/shaders/PaintedShader.ts';
import { ejectDefringe, injectDefringe, setMixPatch } from '../../src/engine/fx/mix/patch.ts';
import { patchDefringe } from '../../src/engine/fx/mix/defringe.ts';
import { patchLiving } from '../../src/engine/fx/mix/livingShader.ts';
import { chestRig } from '../../src/engine/fx/mix/breathRig.ts';
import { twirlKeysOf, twirlSource, twirlTimes } from '../../src/engine/fx/mix/twirl.ts';
import { cropRect, splashSource } from '../../src/engine/fx/mix/splash.ts';
import { slabTop } from '../../src/engine/fx/mix/odBanner.ts';
import { shotScore } from '../../src/engine/fx/mix/heldShots.ts';
import type { Field } from '../../src/engine/fx/mix/clearance.ts';

describe('the twirl-key slot (FFX-2 only)', () => {
  it('finds no keys today, so a change plays today\'s flourish', () => {
    expect(twirlKeysOf(['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'])).toEqual([]);
    expect(twirlSource('yuna-white-mage', 'yuna-gunner', () => ['idle', 'attack'])).toBeNull();
  });

  it('plays start, mid and end in that order, then others by name', () => {
    expect(twirlKeysOf(['idle', 'twirl-end', 'twirl-mid', 'twirl-2', 'twirl-start', 'twirl-10'])).toEqual(['twirl-start', 'twirl-mid', 'twirl-end', 'twirl-2', 'twirl-10']);
  });

  it('looks under the new dressphere first, then the old one, then any figure of the same girl', () => {
    const states: Record<string, string[]> = { 'yuna-gunner': ['idle'], 'yuna-songstress': ['idle', 'twirl-start'], 'paine-warrior': ['twirl-start'] };
    const of = (id: string): string[] | null => states[id] ?? null;
    expect(twirlSource('yuna-white-mage', 'yuna-gunner', of, Object.keys(states))).toEqual({ figure: 'yuna-songstress', keys: ['twirl-start'] });
    expect(twirlSource('paine-gunner', 'paine-warrior', of, Object.keys(states))?.figure).toBe('paine-warrior');
  });

  it('fits inside today\'s 0.8 s beat (Active ATB: never added to it)', () => {
    const t = twirlTimes(3);
    expect(t.at).toEqual([0, 213, 427]);
    expect(t.end).toBeLessThanOrEqual(800);
  });
});

describe('splash art (both games)', () => {
  it('crops the approved painting the slab should show', () => {
    expect(splashSource('ffx2-bahamut', ['idle', 'hurt', 'splash'])).toEqual({ state: 'splash', box: 'whole' });
    expect(splashSource('anima', ['idle', 'overdrive'])).toEqual({ state: 'overdrive', box: 'whole' });
    expect(splashSource('tidus', ['idle', 'attack', 'cast'])).toEqual({ state: 'attack', box: 'upper' });
    expect(splashSource('lulu', ['idle', 'cast'])).toEqual({ state: 'cast', box: 'upper' });
    expect(splashSource('shade', ['idle'])).toBeNull(); // no approved painting to crop: today's slab
  });

  it('takes the upper body of an action painting and never upscales', () => {
    expect(cropRect({ x: 10, y: 20, w: 400, h: 1000 }, 'upper')).toEqual({ x: 10, y: 20, w: 400, h: 600 });
    expect(cropRect({ x: 10, y: 20, w: 400, h: 1000 }, 'whole')).toEqual({ x: 10, y: 20, w: 400, h: 1000 });
  });
});

describe('the Overdrive banner (FFX only)', () => {
  it('hangs where it always has when nobody stands there, and moves up when the actor does', () => {
    expect(slabTop({ w: 700, h: 100 }, 900, [{ l: 900, r: 1000, t: 400, b: 700 }])).toBe(0.5);
    expect(slabTop({ w: 700, h: 100 }, 900, [{ l: 400, r: 600, t: 380, b: 760 }])).toBe(0.22);
  });
});

describe('shader patches (both games)', () => {
  it('the defringe patches the real painted fragment shader and is inert at 0', () => {
    const p = patchDefringe(paintedFragmentShader);
    expect(p).not.toBeNull();
    expect(p).toContain('uniform float mixDefringe');
    expect(p).toContain('if (mixDefringe > 0.0)');
    expect(patchDefringe(p!)).toBeNull(); // once only
    expect(patchDefringe('void main() { gl_FragColor = vec4(1.0); }')).toBeNull(); // not a figure shader
  });

  it('the breathing patches the painted vertex shader and the sway shader alike', () => {
    expect(patchLiving(paintedVertexShader)).toContain('vec4(mixLive(position), 1.0)');
    const sway = 'uniform vec4 fxSway;\nvarying vec2 vUv;\nvoid main() {\n vec3 p = position;\n gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);\n}';
    expect(patchLiving(sway)).toContain('vec4(mixLive(p), 1.0)');
    expect(patchLiving(patchLiving(paintedVertexShader)!)).toBeNull();
  });

  it('one compile hook carries both patches in any order, and the material\'s own hook comes back with both off', () => {
    const mat = new ShaderMaterial({ vertexShader: paintedVertexShader, fragmentShader: paintedFragmentShader, uniforms: {} });
    const own = mat.onBeforeCompile;
    const compile = (): { vertexShader: string; fragmentShader: string } => {
      const shader = { vertexShader: mat.vertexShader, fragmentShader: mat.fragmentShader, uniforms: {} } as never as { vertexShader: string; fragmentShader: string };
      mat.onBeforeCompile(shader as never, null as never);
      return shader;
    };
    expect(injectDefringe(mat)?.value).toBe(1);
    setMixPatch(mat, 'live', true);
    expect(compile().fragmentShader).toContain('mixDefringe');
    expect(compile().vertexShader).toContain('mixLive');
    ejectDefringe(mat); // off first: the breathing patch must survive it
    expect(compile().fragmentShader).not.toContain('mixDefringe');
    expect(compile().vertexShader).toContain('mixLive');
    setMixPatch(mat, 'live', false);
    expect(mat.onBeforeCompile).toBe(own);
  });

  it('the chest rig breathes the chest and leaves the legs still', () => {
    const gw = 32;
    const gh = 48;
    const a = new Float32Array(gw * gh);
    for (let y = 2; y < 44; y++) for (let x = 11; x < 21; x++) a[y * gw + x] = 1; // a standing figure, rows bottom-up
    const r = chestRig(a, gw, gh)!;
    const [hip, chest, head] = r.land;
    expect(hip).toBeLessThan(chest);
    expect(chest).toBeLessThan(head);
    const at = (v: number): number => r.weights[Math.floor(v * gh) * gw + 16]!;
    expect(at(chest)).toBeGreaterThan(0.5);
    expect(at(0.15)).toBeLessThan(0.01); // the legs
  });
});

describe('the held shots\' rule (FFX hero shot, FFX-2 close shot)', () => {
  const f: Field = { W: 1600, H: 900, view: { l: 0, r: 1600, t: 0, b: 900 }, panels: [{ l: 1200, r: 1600, t: 600, b: 900 }] };
  const figs = [{ enemy: false }, { enemy: false }, { enemy: true }] as never[];

  it('passes a whole, clear subject with the other members whole and clear or wholly out', () => {
    expect(shotScore(0, [{ l: 600, r: 900, t: 200, b: 750 }, { l: 1700, r: 1900, t: 300, b: 700 }, { l: 1400, r: 1700, t: 100, b: 600 }], f, figs).ok).toBe(true);
  });

  it('fails when a member is half under a panel or cut by the frame\'s edge (Yuna under the rail, cut at the edge)', () => {
    expect(shotScore(0, [{ l: 600, r: 900, t: 200, b: 750 }, { l: 1300, r: 1500, t: 400, b: 800 }, { l: 0, r: 1, t: 0, b: 1 }], f, figs).ok).toBe(false);
    expect(shotScore(0, [{ l: 600, r: 900, t: 200, b: 750 }, { l: 1500, r: 1700, t: 100, b: 500 }, { l: 0, r: 1, t: 0, b: 1 }], f, figs).ok).toBe(false);
  });
});
