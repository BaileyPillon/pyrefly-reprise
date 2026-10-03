import { afterEach, describe, expect, it } from 'vitest';
import { Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, Texture } from 'three';
import { DRIFT_FFX, DRIFT_FFX2, driftAt } from '../../src/engine/fx/b/CameraDrift.ts';
import { FOCUS_GAMMA, FOCUS_MAX_BIAS, driftExtent, followTransform, focusAmounts, focusWeight, plateBiases } from '../../src/engine/fx/b/focusMaths.ts';
import { DriftRig } from '../../src/engine/fx/b/DriftRig.ts';
import { PlateFocus, focusDial } from '../../src/engine/fx/b/PlateFocus.ts';
import { ROOMS } from '../../src/engine/fx/b/ambient/index.ts';
import { roomPlays } from '../../src/engine/fx/b/ambient/room.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { setEyeCandyProvider } from '../../src/engine/fx/eyeCandyFlags.ts';

// A-7 "Backdrops with a floor and a sky": the plate defocus aimed at the party's plate.
// Game case: both (shared plumbing, per-room cap); the FFX and FFX-2 drift specs are both exercised.

afterEach(() => {
  setEyeCandyProvider(null);
  eyeCandy.setSub('focus', true);
  eyeCandy.setDial('focus', 1);
  eyeCandy.set('b', true);
});

describe('plate defocus maths (focusMaths)', () => {
  it('gives the focus plate 0 and the farthest plate 1, in between by inverse distance', () => {
    // Gagazet: the reference camera 11 units out, plates at z -46, -36, -26, -16.
    const d = [57, 47, 37, 27];
    const a = focusAmounts(d, 3);
    expect(a[3]).toBe(0);
    expect(a[0]).toBeCloseTo(1, 10);
    expect(a[1]!).toBeLessThan(a[0]!);
    expect(a[2]!).toBeLessThan(a[1]!);
    // 1/27 - 1/37 and 1/27 - 1/47 against 1/27 - 1/57, to the card's 0.85 power.
    expect(a[2]).toBeCloseTo(Math.pow((1 / 27 - 1 / 37) / (1 / 27 - 1 / 57), FOCUS_GAMMA), 10);
  });

  it('blurs a plate in front of the focus too, and survives one plate or equal distances', () => {
    const a = focusAmounts([57, 27, 12], 1);
    expect(a[1]).toBe(0);
    expect(a[0]!).toBeGreaterThan(0);
    expect(a[2]!).toBeGreaterThan(0);
    expect(focusAmounts([30], 0)).toEqual([0]);
    expect(focusAmounts([30, 30, 30], 2)).toEqual([0, 0, 0]);
  });

  it('is 0 with no camera offset: the resting frame is the approved painting', () => {
    expect(driftExtent({ x: 0, y: 0, z: 0 }, DRIFT_FFX)).toBe(0);
    expect(focusWeight(0)).toBe(0);
    const biases = plateBiases(focusAmounts([57, 47, 37, 27], 3), focusWeight(0), FOCUS_MAX_BIAS, 1);
    expect(biases.every((b) => b === 0)).toBe(true);
  });

  it('reaches its cap at the extreme of the swing and never passes it, in both games', () => {
    for (const spec of [DRIFT_FFX, DRIFT_FFX2]) {
      let top = 0;
      for (let t = 0; t < 400; t += 0.25) top = Math.max(top, driftExtent(driftAt(t, spec, 1), spec));
      expect(top).toBeGreaterThan(0.95);
      expect(top).toBeLessThanOrEqual(1);
    }
    expect(focusWeight(1)).toBe(1);
    const a = focusAmounts([57, 47, 37, 27], 3);
    expect(Math.max(...plateBiases(a, 1, FOCUS_MAX_BIAS, 1))).toBeCloseTo(FOCUS_MAX_BIAS, 10);
  });

  it('rises smoothly and never falls as the camera goes out', () => {
    let prev = -1;
    for (let e = 0; e <= 1.0001; e += 0.02) {
      const w = focusWeight(e);
      expect(w).toBeGreaterThanOrEqual(prev);
      prev = w;
    }
    expect(focusWeight(0.2)).toBe(0);
    expect(focusWeight(0.85)).toBe(1);
  });

  it('scales with the strength dial and goes to nothing at 0', () => {
    const a = [1, 0.5, 0];
    expect(plateBiases(a, 1, 2, 0).every((b) => b === 0)).toBe(true);
    expect(plateBiases(a, 1, 2, 0.5)).toEqual([1, 0.5, 0]);
    expect(plateBiases(a, -1, 2, 1).every((b) => b === 0)).toBe(true);
  });
});

function plates(n: number, floored: boolean): Mesh[] {
  return Array.from({ length: n }, (_, i) => {
    const flo = floored && i === n - 1;
    const mat = flo ? new ShaderMaterial() : new MeshBasicMaterial({ map: new Texture() });
    return new Mesh(new PlaneGeometry(1, 1), mat);
  });
}

const FRAG = 'varying vec2 vMapUv;\nvoid main() {\n  vec4 diffuseColor = vec4(1.0);\n  #include <map_fragment>\n  gl_FragColor = diffuseColor;\n}';
function compile(mesh: Mesh): { fragmentShader: string; uniforms: Record<string, { value: number }> } {
  const shader = { fragmentShader: FRAG, uniforms: {} as Record<string, { value: number }> };
  (mesh.material as MeshBasicMaterial).onBeforeCompile(shader as never, undefined as never);
  return shader;
}

describe('plate defocus on the plates (PlateFocus)', () => {
  it('puts a mip bias in each upright plate\'s own sample and leaves the projected floor alone', () => {
    const meshes = plates(4, true);
    const f = new PlateFocus(meshes, [57, 47, 37, 12], true);
    expect(f.focusPlate).toBe(2); // the nearest upright plate; the floor is the focus plane itself
    const s0 = compile(meshes[0]!);
    expect(s0.fragmentShader).toContain('texture2D( map, vMapUv, uFxPlateBias )');
    expect(s0.fragmentShader).toContain('uniform float uFxPlateBias;');
    expect(s0.uniforms['uFxPlateBias']).toBeDefined();
    expect((meshes[3]!.material as ShaderMaterial).onBeforeCompile.toString()).not.toContain('uFxPlateBias');
  });

  it('is exactly the old sampling at rest, then biases the far plate most', () => {
    const meshes = plates(4, false);
    const f = new PlateFocus(meshes, [57, 47, 37, 27], false, { max: 2 });
    const uni = meshes.map((m) => compile(m).uniforms['uFxPlateBias']!);
    f.update(null, DRIFT_FFX, 1);
    expect(uni.map((u) => u.value)).toEqual([0, 0, 0, 0]);
    f.update({ x: DRIFT_FFX.lateral * 1.18, y: 0, z: 0 }, DRIFT_FFX, 1);
    expect(uni[0]!.value).toBeCloseTo(2, 6);
    expect(uni[0]!.value).toBeGreaterThan(uni[1]!.value);
    expect(uni[1]!.value).toBeGreaterThan(uni[2]!.value);
    expect(uni[3]!.value).toBe(0);
    f.update({ x: DRIFT_FFX.lateral, y: 0, z: 0 }, DRIFT_FFX, 0);
    expect(uni.map((u) => u.value)).toEqual([0, 0, 0, 0]);
  });

  it('gives the programs back when it goes (the plates sample as they did)', () => {
    const meshes = plates(3, false);
    const mats = meshes.map((m) => m.material as MeshBasicMaterial);
    const before = mats.map((m) => m.onBeforeCompile);
    const f = new PlateFocus(meshes, [57, 47, 37], false);
    expect(mats[0]!.onBeforeCompile).not.toBe(before[0]);
    f.dispose();
    mats.forEach((m, i) => expect(m.onBeforeCompile).toBe(before[i]));
  });

  it('gives every plate the same program (one compile, one uniform each)', () => {
    const meshes = plates(3, false);
    new PlateFocus(meshes, [57, 47, 37], false);
    const keys = meshes.map((m) => (m.material as MeshBasicMaterial).customProgramCacheKey());
    expect(new Set(keys).size).toBe(1);
  });
});

describe('plate defocus switches (focusDial)', () => {
  it('plays on the desktop and half-plays on the phone tier', () => {
    expect(focusDial(false, 'full')).toBe(1);
    expect(focusDial(false, 'phone')).toBeCloseTo(0.8, 10);
  });

  it('is still under REDUCE MOTION and the flat fallback under LOW EFFECTS', () => {
    expect(focusDial(true, 'full')).toBe(0);
    expect(focusDial(false, 'low')).toBe(0);
  });

  it('answers the LIVING PAINTINGS row of the EYE CANDY seam, the sub-switch and the dial', () => {
    setEyeCandyProvider((k) => k !== 'livingPaintings');
    expect(focusDial(false, 'full')).toBe(0);
    setEyeCandyProvider(null);
    eyeCandy.setSub('focus', false);
    expect(focusDial(false, 'full')).toBe(0);
    eyeCandy.setSub('focus', true);
    eyeCandy.setDial('focus', 0);
    expect(focusDial(false, 'full')).toBe(0);
    eyeCandy.setDial('focus', 2);
    expect(focusDial(false, 'full')).toBe(2);
  });
});

describe('plate defocus per room (game-aware)', () => {
  it('keeps every room\'s cap sane, so the painting stays legible', () => {
    for (const room of Object.values(ROOMS)) {
      const max = room.focus?.max ?? FOCUS_MAX_BIAS;
      expect(max).toBeGreaterThanOrEqual(0);
      expect(max).toBeLessThanOrEqual(3);
    }
  });
});

describe('A-7 plates-only rooms (game-aware)', () => {
  const only = Object.values(ROOMS).filter((r) => r.platesOnly);
  const GAME: Record<string, 'ffx' | 'ffx2'> = {
    'zanarkand-dome': 'ffx',
    'dreams-end': 'ffx',
    'garden-of-pain': 'ffx',
    'leblanc-last-room': 'ffx2',
    'via-infinito': 'ffx2',
    'den-of-woe': 'ffx2',
    farplane: 'ffx2',
    'via-purifico': 'ffx',
  };

  it('covers the far-backdrop rooms, each with its own game (Zanarkand, Dream\'s End, the Garden: FFX; Farplane, Leblanc, Via Infinito, Den: FFX-2)', () => {
    expect(only.map((r) => r.key).sort()).toEqual(Object.keys(GAME).sort());
    for (const r of only) expect(r.game).toBe(GAME[r.key]);
  });

  it('carries no lamps, weather, haze, arcs or lightning (what floats in a room is the canon table\'s call, A-6)', () => {
    for (const r of only) {
      expect(r.lamps).toEqual({});
      expect(r.fields).toEqual([]);
      expect(r.haze).toEqual([]);
      expect(r.arcs).toBeUndefined();
      expect(r.lightning).toBeUndefined();
      expect(r.lampDust).toBeUndefined();
      expect(r.reflect).toBeUndefined();
    }
  });

  it('stands every plate in front of the painting and at least 12 units behind the fighters\' back row', () => {
    for (const r of only) {
      for (const z of r.plates.z) {
        expect(z).toBeGreaterThan(-60);
        expect(z).toBeLessThanOrEqual(-6);
      }
      const zs = r.plates.z;
      for (let i = 1; i < zs.length; i++) expect(zs[i]!).toBeGreaterThan(zs[i - 1]!);
    }
  });
});

describe('A-7 per-room drift scale', () => {
  it('scales the drift amplitude, keeps its periods, and a room at 1 uses the tuned spec as is', () => {
    const full = new DriftRig({ camera: {} as never, rigName: () => 'idle', battleCamera: {} as never }, 'ffx');
    expect(full.spec).toBe(DRIFT_FFX);
    const half = new DriftRig({ camera: {} as never, rigName: () => 'idle', battleCamera: {} as never }, 'ffx2', 0.5);
    expect(half.spec.lateral).toBeCloseTo(DRIFT_FFX2.lateral * 0.5, 10);
    expect(half.spec.periods).toEqual(DRIFT_FFX2.periods);
  });

  it('keeps every drift scale in (0, 1], and the defocus reaches its cap on the scaled drift', () => {
    for (const r of Object.values(ROOMS)) {
      const s = r.drift ?? 1;
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(1);
    }
    const half = { ...DRIFT_FFX, lateral: DRIFT_FFX.lateral * 0.5, vertical: DRIFT_FFX.vertical * 0.5, dolly: DRIFT_FFX.dolly * 0.5 };
    let top = 0;
    for (let t = 0; t < 400; t += 0.25) top = Math.max(top, driftExtent(driftAt(t, half, 1), half));
    expect(top).toBeGreaterThan(0.95);
  });
});

describe('A-7 flat fallback under LOW EFFECTS', () => {
  it('keeps a plates-only room flat on the low tier and leaves the older rooms on their own low tier', () => {
    expect(roomPlays(ROOMS['dreams-end']!, true, 'low')).toBe(false);
    expect(roomPlays(ROOMS['dreams-end']!, true, 'full')).toBe(true);
    expect(roomPlays(ROOMS['dreams-end']!, true, 'phone')).toBe(true);
    expect(roomPlays(ROOMS['dreams-end']!, false, 'full')).toBe(false);
    expect(roomPlays(ROOMS['gagazet']!, true, 'low')).toBe(true);
  });
});

describe('A-7 plates follow a scene that scales and lifts the painting (the Farplane colossus links)', () => {
  // The reference camera at (0, 3.3, 11); the painting plane at z -48, centre y -2.8, 78 wide (the Farplane's numbers).
  const cam = { x: 0, y: 3.3, z: 11 };
  const Z = -48;
  const CY = 3.2;
  const point = (u: number, v: number, sx: number, sy: number, lift: number): { x: number; y: number } => ({ x: (u - 0.5) * 78 * sx, y: CY + lift + (0.5 - v) * 44 * sy });

  it('is the plates own at rest', () => {
    expect(followTransform(0.8, 1.5, 1, 1, 0)).toEqual({ sx: 0.8, sy: 0.8, y: 1.5 });
  });

  it('keeps a painting point and its plate point on one ray from the reference camera, at any scale and lift', () => {
    for (const [sx, sy, lift] of [[1, 1, 0], [1.8, 1.8, 6], [1.3, 1.5, -2]] as const) {
      for (const z of [-38, -26, -14]) {
        const k = (cam.z - z) / (cam.z - Z);
        const baseY = cam.y + (CY - cam.y) * k;
        const t = followTransform(k, baseY, sx, sy, lift);
        for (const [u, v] of [[0.1, 0.2], [0.5, 0.5], [0.9, 0.8]] as const) {
          const p = point(u, v, sx, sy, lift); // on the painting plane, z = Z
          // the plate's point for the same (u, v): its own mesh is 78 x 44 scaled by (t.sx, t.sy), centred at (cx, t.y)
          const cx = cam.x * (1 - k);
          const q = { x: cx + (u - 0.5) * 78 * t.sx, y: t.y + (0.5 - v) * 44 * t.sy };
          // the ray from the camera through p crosses z at: cam + (p - cam) * (cam.z - z) / (cam.z - Z)
          const r = { x: cam.x + (p.x - cam.x) * k, y: cam.y + (p.y - cam.y) * k };
          expect(q.x).toBeCloseTo(r.x, 8);
          expect(q.y).toBeCloseTo(r.y, 8);
        }
      }
    }
  });
});
