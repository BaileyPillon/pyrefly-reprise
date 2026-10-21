/**
 * **The Wind Waker toon material and the wing flap** (`src/engine/ww3d/toon.ts`, `wing.ts`, `toonify.ts`, `post.ts`; FFX-2 only), pinned without a GPU: the fragment patch is run against three's own shader chunks (so a three
 * upgrade that moves a line the patch needs fails here and not in the browser), the variants are the lab's numbers, the default is the approved `hd`, and the wing maths is the lab's.
 */
import { Color, Group, Mesh, MeshStandardMaterial, ShaderChunk, ShaderLib, SphereGeometry } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { paletteFor } from '../../../src/engine/ww3d/post.ts';
import {
  DEFAULT_VARIANT,
  TOON_CEILING,
  TOON_VARIANTS,
  applyVariant,
  createToonUniforms,
  makeToonMaterial,
  patchLightsBegin,
  patchToonShader,
  shadowTintLinear,
  toonFrom,
  variantFromSearch,
  withUniforms,
  type ShaderLike,
} from '../../../src/engine/ww3d/toon.ts';
import { disposeToon, driveToon, toonify } from '../../../src/engine/ww3d/toonify.ts';
import { AMP_ACTIVE, RATE_ACTIVE, WING, advanceFlap, createWingUniforms, makeWingDepthMaterial, patchWingVertex, wingBend } from '../../../src/engine/ww3d/wing.ts';

/** A program as three hands it to `onBeforeCompile`: the real toon material's source. */
const toonProgram = (): ShaderLike => ({ vertexShader: ShaderLib['toon']!.vertexShader, fragmentShader: ShaderLib['toon']!.fragmentShader, uniforms: {} });

describe('the fragment patch against three\'s own chunks', () => {
  it('finds the three includes and the one shadow line it changes, and adds the uniforms', () => {
    const u = createToonUniforms();
    const shader = toonProgram();
    const r = patchToonShader(shader, u);
    expect(r).toEqual({ ok: true, problems: [] });
    expect(shader.fragmentShader).toContain('RE_Direct_Toon');
    expect(shader.fragmentShader).toContain('gToonShadow = ( directLight.visible && receiveShadow ) ? toonShadowBand( getShadow(');
    expect(shader.fragmentShader).not.toContain('#include <lights_toon_pars_fragment>');
    expect(Object.keys(shader.uniforms).sort()).toEqual(Object.keys(u).sort());
    expect(patchLightsBegin(ShaderChunk['lights_fragment_begin'])).not.toBeNull();
  });

  it('leaves the program untouched, and says why, when a chunk it needs is missing', () => {
    const shader: ShaderLike = { vertexShader: '', fragmentShader: 'void main() {}', uniforms: {} };
    const r = patchToonShader(shader, createToonUniforms());
    expect(r.ok).toBe(false);
    expect(r.problems.length).toBeGreaterThan(0);
    expect(shader.fragmentShader).toBe('void main() {}');
    expect(Object.keys(shader.uniforms)).toEqual([]);
    expect(patchLightsBegin('nothing to see')).toBeNull();
  });

  it('clamps a lit surface just under the bloom\'s threshold, so only the glows bloom', () => {
    const shader = toonProgram();
    patchToonShader(shader, createToonUniforms());
    expect(shader.fragmentShader).toContain('min( col, vec3( uToonCeil ) )');
    expect(TOON_CEILING).toBeLessThan(1);
    expect(TOON_CEILING).toBeGreaterThan(0.95);
    for (const name of ['hd', 'hd-soft'] as const) expect(paletteFor(name).bloomThreshold).toBeGreaterThan(TOON_CEILING);
    expect(createToonUniforms().uToonCeil.value).toBe(TOON_CEILING);
  });

  it('is a material that patches itself when compiled, keeps its map and colour, and reports a failed patch', () => {
    const u = createToonUniforms();
    const m = makeToonMaterial(u, { color: 0x336699, cacheKey: '-x' });
    expect(m.userData['ww']).toBe('toon');
    expect(m.customProgramCacheKey()).toBe('ww-toon-v2-x');
    const shader = toonProgram();
    (m.onBeforeCompile as (s: unknown) => void)(shader);
    expect(shader.fragmentShader).toContain('RE_Direct_Toon');
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    (m.onBeforeCompile as (s: unknown) => void)({ vertexShader: '', fragmentShader: '', uniforms: {} });
    expect(err).toHaveBeenCalledOnce();
    err.mockRestore();
  });
});

describe('the variants are the lab\'s numbers, and HD is the default', () => {
  it('names hd, hd-soft and classic; hd is the default, Bailey\'s pick', () => {
    expect(Object.keys(TOON_VARIANTS)).toEqual(['hd', 'hd-soft', 'classic']);
    expect(DEFAULT_VARIANT).toBe('hd');
    expect(variantFromSearch('')).toBe('hd');
    expect(variantFromSearch('?ww=classic')).toBe('classic');
    expect(variantFromSearch('?ww=hd-soft')).toBe('hd-soft');
    expect(variantFromSearch('?ww=painted')).toBe('hd'); // the scene handles "painted" before it asks for a look
    expect(variantFromSearch('?ww=constructor')).toBe('hd'); // not an inherited property
  });

  it('has hd bloom 0.6 with a soft-edged terminator and a rim, classic no bloom and a razor-hard terminator', () => {
    const hd = TOON_VARIANTS['hd'];
    expect([hd.bloom, hd.bloomThreshold, hd.bloomRadius, hd.term, hd.termW, hd.shadowW, hd.rim, hd.sat]).toEqual([0.6, 1.0, 0.5, 0.15, 0.03, 0.1, 0.5, 1.15]);
    expect(TOON_VARIANTS['hd-soft'].bloom).toBe(0.3);
    const classic = TOON_VARIANTS['classic'];
    expect([classic.bloom, classic.termW, classic.rim, classic.sat]).toEqual([0, 0.002, 0, 1.32]);
  });

  it('sets the shared uniforms to a variant, and a copy with one cell changed keeps the rest shared', () => {
    const u = createToonUniforms();
    applyVariant(u, TOON_VARIANTS['classic']);
    expect(u.uToonBand.value.toArray()).toEqual([0.15, 0.002, 0.02, 0]);
    expect(u.uToonSat.value).toBe(1.32);
    expect(u.uToonRim.value.w).toBe(0);
    const stage = withUniforms(u, { uToonSat: { value: 1 } });
    expect(stage.uToonBand).toBe(u.uToonBand);
    expect(stage.uToonSat).not.toBe(u.uToonSat);
    applyVariant(u, TOON_VARIANTS['hd']);
    expect(stage.uToonBand.value.y).toBe(0.03); // the shared cell moved with the variant
    expect(u.uToonRim.value.w).toBe(0.5);
  });

  it('pulls white toward the tint by its strength: the shadow side stays bright and only the hue is cool', () => {
    const c = shadowTintLinear('#6a6fb5', 0.65);
    const srgb = { r: 0, g: 0, b: 0 };
    c.getRGB(srgb, 'srgb');
    expect(srgb.r).toBeCloseTo(1 - 0.65 * (1 - 0x6a / 255), 2);
    expect(srgb.b).toBeGreaterThan(srgb.r);
    expect(Math.min(srgb.r, srgb.g, srgb.b)).toBeGreaterThan(0.55);
    expect(shadowTintLinear('#000000', 0).equals(new Color(1, 1, 1))).toBe(true);
  });

  it('is a neutral palette that encodes (gamma 2.2), blooms by the variant and has no tilt-shift', () => {
    const p = paletteFor('hd');
    expect(p).toMatchObject({ gamma: [2.2, 2.2, 2.2], lift: [0, 0, 0], gain: [1, 1, 1], saturation: 1, vignette: 0, grain: 0, tiltMaxBlur: 0, bloomStrength: 0.6, bloomRadius: 0.5, bloomThreshold: 1.0 });
    expect(paletteFor('hd-soft').bloomStrength).toBe(0.3);
    expect(paletteFor('classic').bloomStrength).toBe(0);
    expect(paletteFor('hd').name).not.toBe(paletteFor('classic').name);
  });
});

describe('making a model toon', () => {
  it('replaces every material, keeps the colour and the map, casts and receives shadows and is never culled', () => {
    const u = createToonUniforms();
    const a = new Mesh(new SphereGeometry(1), new MeshStandardMaterial({ color: 0x884422 }));
    const b = new Mesh(new SphereGeometry(1), a.material); // two meshes on one material
    const root = new Group();
    root.add(a, b);
    const set = toonify(root, u, { receive: true });
    expect(set.meshes).toHaveLength(2);
    expect(set.entries).toHaveLength(1); // one toon material per source material
    expect(a.material).toBe(b.material);
    expect((a.material as unknown as { userData: { ww: string } }).userData.ww).toBe('toon');
    expect(a.castShadow && a.receiveShadow).toBe(true);
    expect(a.frustumCulled).toBe(false);
    expect((a.material as MeshStandardMaterial).color.getHex()).toBe(0x884422);
    expect(a.userData['srcMaterial']).toBeDefined();
  });

  it('drives the colour, the glow and the opacity, solid as an opaque material and faded as a transparent one', () => {
    const u = createToonUniforms();
    const mesh = new Mesh(new SphereGeometry(1), new MeshStandardMaterial({ color: 0xffffff }));
    const set = toonify(mesh, u);
    const toon = set.entries[0]!.material;
    driveToon(set, { colour: new Color(0.5, 1, 1), emissive: new Color(1, 1, 1), amount: 0.4, opacity: 1 });
    expect(toon.color.r).toBeCloseTo(0.5, 6);
    expect(toon.emissiveIntensity).toBe(0.4);
    expect(toon.transparent).toBe(false);
    driveToon(set, { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 0.4 });
    expect(toon.transparent).toBe(true);
    expect(toon.opacity).toBe(0.4);
    expect(set.opacity).toBe(0.4);
    disposeToon(set, true);
  });

  it('keeps the base-colour map of a source material and gives it anisotropy', () => {
    const src = new MeshStandardMaterial({ color: 0x00ff00 });
    const t = toonFrom(src, createToonUniforms());
    expect(t.color.getHex()).toBe(0x00ff00);
    expect(t.map).toBeNull();
  });
});

describe('Valefor\'s wing flap', () => {
  it('bends only the wings about the shoulder, weighted by distance from the body line and gated by height', () => {
    const wu = createWingUniforms();
    wu.uWing.value.y = Math.PI / 2; // the top of the stroke
    const body = wingBend({ x: WING.cx, y: 2.0, z: 0 }, wu);
    expect(body.weight).toBe(0);
    expect(body.x).toBeCloseTo(WING.cx, 10);
    const tail = wingBend({ x: WING.cx + 2.5, y: 0.4, z: -2 }, wu); // far out but low: the legs and the tail stay put
    expect(tail.weight).toBe(0);
    const right = wingBend({ x: WING.cx + 3, y: 2.0, z: 0 }, wu);
    const left = wingBend({ x: WING.cx - 3, y: 2.0, z: 0 }, wu);
    expect(right.weight).toBe(1);
    expect(right.angle).toBeCloseTo((WING.ampDeg * Math.PI) / 180, 10);
    expect(left.angle).toBeCloseTo(-right.angle, 10); // both wings rise together: the angle is signed by the side
    expect(right.y).toBeGreaterThan(2.0); // the tip goes up
    expect(left.y).toBeGreaterThan(2.0);
    wu.uWing.value.y = 0;
    expect(wingBend({ x: WING.cx + 3, y: 2.0, z: 0 }, wu).y).toBeCloseTo(2.0, 10); // at phase 0 the wings are level
  });

  it('flaps faster and wider as her activity rises, and the phase stays within a turn', () => {
    const rest = createWingUniforms();
    const busy = createWingUniforms();
    const p0 = advanceFlap(rest, 0.1, 0);
    const p1 = advanceFlap(busy, 0.1, 1);
    expect(p1 / p0).toBeCloseTo(RATE_ACTIVE, 6);
    expect(busy.uWing.value.x / rest.uWing.value.x).toBeCloseTo(1 + AMP_ACTIVE, 6);
    for (let i = 0; i < 400; i++) advanceFlap(busy, 0.1, 1);
    expect(busy.uWing.value.y).toBeLessThan(Math.PI * 2);
    advanceFlap(rest, 0.1, 7); // clamped to 1
    expect(rest.uWing.value.x).toBeCloseTo((WING.ampDeg * Math.PI) / 180 * (1 + AMP_ACTIVE), 10);
  });

  it('patches the vertex shader of the toon program (with the normal) and of the depth material (without)', () => {
    const wu = createWingUniforms();
    const toon = toonProgram();
    expect(patchWingVertex(toon, wu, true)).toEqual({ ok: true, problems: [] });
    expect(toon.vertexShader).toContain('transformed = wfBend( position );');
    expect(toon.vertexShader).toContain('objectNormal = wfBendNormal( position, objectNormal );');
    expect(Object.keys(toon.uniforms).sort()).toEqual(['uBoss', 'uWing']);
    const depth: ShaderLike = { vertexShader: ShaderLib['depth']!.vertexShader, fragmentShader: ShaderLib['depth']!.fragmentShader, uniforms: {} };
    expect(patchWingVertex(depth, wu, false)).toEqual({ ok: true, problems: [] });
    expect(depth.vertexShader).not.toContain('wfBendNormal( position');
    const bad: ShaderLike = { vertexShader: 'void main() {}', fragmentShader: '', uniforms: {} };
    expect(patchWingVertex(bad, wu, true).ok).toBe(false);
    expect(bad.vertexShader).toBe('void main() {}');
    expect(makeWingDepthMaterial(wu).customProgramCacheKey()).toBe('ww-wing-depth-v1');
  });
});
