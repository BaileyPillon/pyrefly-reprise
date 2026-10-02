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
import { keyRescale, twirlKeysOf, twirlPlan, twirlStepMs, twirlTimes, TWIRL_WEIGHT } from '../../src/engine/fx/mix/twirl.ts';
import { cropRect, splashSource } from '../../src/engine/fx/mix/splash.ts';
import { slabTop } from '../../src/engine/fx/mix/odBanner.ts';
import { shotScore } from '../../src/engine/fx/mix/heldShots.ts';
import type { Field } from '../../src/engine/fx/mix/clearance.ts';

describe('the twirl-key slot (FFX-2 only)', () => {
  it('finds no keys for a figure without them, so that change plays today\'s flourish', () => {
    expect(twirlKeysOf(['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'])).toEqual([]);
    expect(twirlPlan('yuna-white-mage', 'yuna-gunner', () => ['idle', 'attack'])).toEqual([]);
  });

  it('orders a figure\'s keys start, going, mid, forming, end, then others by name', () => {
    expect(twirlKeysOf(['idle', 'twirl-end', 'twirl-mid', 'twirl-2', 'twirl-forming', 'twirl-start', 'twirl-10', 'twirl-going'])).toEqual([
      'twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end', 'twirl-2', 'twirl-10',
    ]);
  });

  // The installed layout (D-322, 2026-10-02): each dressphere holds the keys painted in it; the ribbons under Gunner.
  const installed: Record<string, string[]> = {
    'yuna-white-mage': ['idle', 'twirl-start', 'twirl-going', 'twirl-forming', 'twirl-end'],
    'yuna-gunner': ['idle', 'twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end'],
    'yuna-black-mage': ['idle', 'twirl-start', 'twirl-going', 'twirl-forming', 'twirl-end'],
    'rikku-white-mage': ['idle', 'twirl-forming', 'twirl-end'],
    'rikku-thief': ['idle', 'twirl-start', 'twirl-going'],
    'rikku-gunner': ['idle', 'twirl-mid'],
    'paine-warrior': ['idle', 'twirl-start'],
  };
  const of = (id: string): string[] | null => installed[id] ?? null;
  const ids = Object.keys(installed);
  const names = (plan: { figure: string; key: string }[]): string[] => plan.map((k) => `${k.figure}/${k.key}`);

  it('plays the old dressphere\'s start and going, her ribbons, then the new one\'s forming and manifest (Chapter IV, Yuna)', () => {
    expect(names(twirlPlan('yuna-white-mage', 'yuna-gunner', of, ids))).toEqual([
      'yuna-white-mage/twirl-start', 'yuna-white-mage/twirl-going', 'yuna-gunner/twirl-mid', 'yuna-gunner/twirl-forming', 'yuna-gunner/twirl-end',
    ]);
  });

  it('takes her ribbons from any figure of hers when neither dressphere holds them, never another girl\'s', () => {
    expect(names(twirlPlan('yuna-white-mage', 'yuna-black-mage', of, ids))).toEqual([
      'yuna-white-mage/twirl-start', 'yuna-white-mage/twirl-going', 'yuna-gunner/twirl-mid', 'yuna-black-mage/twirl-forming', 'yuna-black-mage/twirl-end',
    ]);
    expect(names(twirlPlan('paine-warrior', 'paine-gunner', of, ids))).toEqual(['paine-warrior/twirl-start']);
  });

  it('never plays the new dressphere\'s own start or the old one\'s manifest, and skips a part that is not painted', () => {
    // Rikku Thief -> White Mage (Chapter VI): no start is painted in White Mage, no manifest in Thief.
    expect(names(twirlPlan('rikku-thief', 'rikku-white-mage', of, ids))).toEqual([
      'rikku-thief/twirl-start', 'rikku-thief/twirl-going', 'rikku-gunner/twirl-mid', 'rikku-white-mage/twirl-forming', 'rikku-white-mage/twirl-end',
    ]);
    expect(names(twirlPlan('rikku-white-mage', 'rikku-thief', of, ids))).toEqual(['rikku-gunner/twirl-mid']);
  });

  it('sizes a key painted for another dressphere by the two idles, so it stands as tall as it was painted', () => {
    // Yuna White Mage's idle (baselineY 1167) against Gunner's (1178): the White Mage start shown on the Gunner figure.
    expect(keyRescale({ baselineY: 1167 }, { baselineY: 1178 })).toBeCloseTo(1178 / 1167, 6);
    expect(keyRescale({ baselineY: 1000, scale: 1.2 }, { baselineY: 1000, scale: 0.8 })).toBeCloseTo(1.5, 6);
    expect(keyRescale({ baselineY: 900 }, { baselineY: 900 })).toBe(1);
    expect(keyRescale(null, { baselineY: 900 })).toBe(1);
  });

  it('fits inside today\'s 0.8 s beat (Active ATB: never added to it), each part for its share of the step clock', () => {
    const t = twirlTimes(3);
    expect(t.at).toEqual([0, 213, 427]);
    expect(t.end).toBeLessThanOrEqual(800);
    const five = twirlTimes(5, 800, ['twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end'].map((k) => TWIRL_WEIGHT[k]!));
    expect(five.at).toEqual([0, 107, 213, 373, 480]);
    expect(five.end).toBe(640);
  });

  it('a long frame (the new outfit uploading) slows the twirl instead of skipping a key', () => {
    expect(twirlStepMs(1 / 60)).toBeCloseTo(16.667, 2);
    expect(twirlStepMs(0.09)).toBeCloseTo(33.333, 2); // a 90 ms frame moves the clock two frames, not past the 107 ms start key
    expect(twirlStepMs(0)).toBe(0); // __pyrefly.fx.freeze: the clock holds
    expect(twirlStepMs(-1)).toBe(0);
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
