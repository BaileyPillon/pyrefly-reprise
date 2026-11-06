/**
 * **The anime cel material** (`src/engine/ww3d/cel.ts`; the hidden anime chapter, FFX-2 only), pinned without a GPU: the fragment and vertex patch is run against three's own shader chunks (so a three upgrade that
 * moves a line the patch needs fails here and not in the browser), the three looks are one table with the survey's characters (Genshin soft and default, Guilty Gear razor-edged and flat, the blend between), every uniform
 * the program declares exists, and the cast aura and the ceiling keep the Wind Waker toon's names so the skin drives a cel figure unchanged.
 */
import { MeshToonMaterial, ShaderLib } from 'three';
import { describe, expect, it, vi } from 'vitest';

import {
  CEL_FRAG,
  CEL_LOOKS,
  CEL_LOOK_NAMES,
  CEL_PARS,
  DEFAULT_CEL_LOOK,
  createCelUniforms,
  lookFromSearch,
  makeCelMaterial,
  makeRamp,
  patchCelShader,
} from '../../../src/engine/ww3d/cel.ts';
import { paletteFor } from '../../../src/engine/ww3d/post.ts';
import { TOON_CEILING, TOON_VARIANTS, createToonUniforms, type ShaderLike } from '../../../src/engine/ww3d/toon.ts';

/** A program as three hands it to `onBeforeCompile`: the real toon material's source. */
const toonProgram = (): ShaderLike => ({ vertexShader: ShaderLib['toon']!.vertexShader, fragmentShader: ShaderLib['toon']!.fragmentShader, uniforms: {} });

describe('the patch against three\'s own chunks', () => {
  it('finds every include and the shadow line, swaps in the cel, adds the face attribute and the uniforms', () => {
    const u = createCelUniforms(CEL_LOOKS.genshin);
    const shader = toonProgram();
    expect(patchCelShader(shader, u)).toEqual({ ok: true, problems: [] });
    expect(shader.fragmentShader).toContain('RE_Direct_Toon');
    expect(shader.fragmentShader).toContain('gCelLit');
    expect(shader.fragmentShader, 'the sun\'s shadow is thresholded into the band, as the toon does').toContain('gToonShadow = ( directLight.visible && receiveShadow ) ? toonShadowBand( getShadow(');
    expect(shader.fragmentShader, 'the whole outgoing colour is held at the ceiling').toContain('outgoingLight = min( outgoingLight, vec3( uToonCeil ) );');
    expect(shader.fragmentShader).not.toContain('#include <lights_toon_pars_fragment>');
    expect(shader.fragmentShader).not.toContain('#include <lights_toon_fragment>');
    expect(shader.vertexShader).toContain('attribute float aFace;');
    expect(shader.vertexShader).toContain('vFace = aFace;');
    expect(Object.keys(shader.uniforms).sort()).toEqual(Object.keys(u).sort());
  });

  it('declares no uniform the look does not make, and the look makes none the program does not declare', () => {
    const declared = [...CEL_PARS.matchAll(/^uniform\s+\w+\s+(\w+);/gm)].map((m) => m[1]!).sort();
    expect(declared).toEqual(Object.keys(createCelUniforms(CEL_LOOKS.gg)).sort());
  });

  it('leaves the program untouched, and says why, when a chunk it needs is missing', () => {
    const shader: ShaderLike = { vertexShader: '', fragmentShader: 'void main() {}', uniforms: {} };
    const r = patchCelShader(shader, createCelUniforms(CEL_LOOKS.genshin));
    expect(r.ok).toBe(false);
    expect(r.problems.length).toBeGreaterThan(0);
    expect(shader.fragmentShader).toBe('void main() {}');
    expect(shader.vertexShader).toBe('');
    expect(Object.keys(shader.uniforms)).toEqual([]);
  });

  it('keeps the Wind Waker toon\'s names for the ceiling and the cast aura, so `driveToon` and the skin drive a cel figure unchanged', () => {
    const cel = createCelUniforms(CEL_LOOKS.genshin);
    const toon = createToonUniforms();
    for (const name of ['uToonCeil', 'uToonGlow', 'uToonGlowShape']) {
      expect(cel[name], name).toBeDefined();
      expect(CEL_PARS, name).toContain(name);
      expect(cel[name]!.value, name).toEqual(toon[name]!.value);
    }
    expect(cel.uToonCeil.value).toBe(TOON_CEILING);
    expect(CEL_FRAG).toContain('material.diffuseColor');
  });
});

describe('the three looks are one table', () => {
  it('has genshin, gg and blend, genshin the default (the survey\'s recommendation: Bailey has not chosen)', () => {
    expect(CEL_LOOK_NAMES).toEqual(['genshin', 'gg', 'blend']);
    expect(Object.keys(CEL_LOOKS)).toEqual(['genshin', 'gg', 'blend']);
    expect(DEFAULT_CEL_LOOK).toBe('genshin');
  });

  it('names no brand in a look\'s label (the labels ship in the public bundle; the title test of exp-anime.test.ts covers the chapter\'s title, this the table\'s strings)', () => {
    for (const look of Object.values(CEL_LOOKS)) expect(look.label).not.toMatch(/genshin|guilty|gear|strive|arc system|mihoyo|hoyoverse/i);
    expect(Object.values(CEL_LOOKS).map((l) => l.label)).toEqual(['Soft cel', 'Hard cel', 'Blend: soft light, hard shadows and lines']);
  });

  it('reads the look from ?look=, and anything else (or nothing) is the default', () => {
    expect(lookFromSearch('')).toBe('genshin');
    expect(lookFromSearch('?look=gg')).toBe('gg');
    expect(lookFromSearch('?look=blend')).toBe('blend');
    expect(lookFromSearch('?look=genshin')).toBe('genshin');
    expect(lookFromSearch('?look=painted')).toBe('genshin'); // the comparison is the scene's switch, not a look
    expect(lookFromSearch('?look=toString')).toBe('genshin'); // not a key of the table
    expect(lookFromSearch('?look=')).toBe('genshin');
  });

  it('keeps each look\'s character: Genshin a soft terminator and a ramp, Guilty Gear a razor terminator and ONE flat shadow, the blend Guilty Gear\'s lines on Genshin\'s light', () => {
    const { genshin, gg, blend } = CEL_LOOKS;
    expect(genshin.at[1], 'terminator width').toBeGreaterThan(gg.at[1] * 5);
    expect(blend.at[1]).toBeLessThan(genshin.at[1]);
    expect(genshin.flat[0], 'no flat mode').toBe(0);
    expect(gg.flat[0]).toBeGreaterThan(0);
    expect(blend.flat).toEqual(gg.flat);
    expect(genshin.outline.width).toBeLessThan(gg.outline.width / 2);
    expect(blend.outline, 'the blend\'s lines are Guilty Gear\'s exactly').toEqual(gg.outline);
    expect(gg.shade[2], 'a narrow rim').toBeLessThan(genshin.shade[2]);
    for (const look of Object.values(CEL_LOOKS)) {
      expect(look.outline.width, look.label).toBeGreaterThan(0);
      expect(look.faceThin).toBeGreaterThan(0);
      expect(look.faceThin).toBeLessThan(1);
    }
  });

  it('takes the Wind Waker toon\'s stage row for the temple: Genshin and the blend the HD row with bloom, Guilty Gear the classic row with none; the palette\'s bloom stays above the ceiling', () => {
    expect([CEL_LOOKS.genshin.stage, CEL_LOOKS.blend.stage, CEL_LOOKS.gg.stage]).toEqual(['hd', 'hd', 'classic']);
    for (const look of Object.values(CEL_LOOKS)) {
      expect(TOON_VARIANTS[look.stage], look.label).toBeDefined();
      if (look.stage !== 'classic') expect(paletteFor(look.stage).bloomThreshold).toBeGreaterThan(TOON_CEILING); // classic has no bloom: its threshold is moot
    }
    expect(paletteFor(CEL_LOOKS.gg.stage).bloomStrength).toBe(0);
    expect(paletteFor(CEL_LOOKS.genshin.stage).bloomStrength).toBeGreaterThan(0);
  });
});

describe('the ramp', () => {
  it('is 64 x 1: the first pixel the first stop, the last the last, in between a blend, alpha opaque', () => {
    for (const look of Object.values(CEL_LOOKS)) {
      const tex = makeRamp(look.ramp);
      const d = tex.image.data as Uint8Array;
      expect([tex.image.width, tex.image.height]).toEqual([64, 1]);
      expect(d.length).toBe(64 * 4);
      for (let c = 0; c < 3; c++) {
        expect(d[c], look.label).toBe(Math.round(255 * look.ramp[0]![1][c]!));
        expect(d[63 * 4 + c], look.label).toBe(Math.round(255 * look.ramp.at(-1)![1][c]!));
      }
      for (let i = 0; i < 64; i++) expect(d[i * 4 + 3]).toBe(255);
      tex.dispose();
    }
  });

  it('Genshin\'s shadow lightens toward the terminator and never goes grey or black (a lilac, every channel over 0.45)', () => {
    const d = makeRamp(CEL_LOOKS.genshin.ramp).image.data as Uint8Array;
    for (let i = 1; i < 64; i++) expect(d[i * 4]! + d[i * 4 + 1]! + d[i * 4 + 2]!, `pixel ${i}`).toBeGreaterThanOrEqual(d[(i - 1) * 4]! + d[(i - 1) * 4 + 1]! + d[(i - 1) * 4 + 2]!);
    for (let i = 0; i < 64; i++) for (let c = 0; c < 3; c++) expect(d[i * 4 + c]!, `pixel ${i}`).toBeGreaterThan(0.45 * 255);
  });
});

describe('the material', () => {
  it('is a stock MeshToonMaterial (skinning, fog, shadows and the colour map keep working) with its own program key, a wing variant of it, and the patch run on compile', () => {
    const u = createCelUniforms(CEL_LOOKS.gg);
    const plain = makeCelMaterial(u, { color: 0x123456 });
    expect(plain).toBeInstanceOf(MeshToonMaterial);
    expect(plain.userData['ww']).toBe('cel');
    expect(plain.customProgramCacheKey()).toBe('ww-cel-v1');
    expect(makeCelMaterial(u, { cacheKey: '-wing' }).customProgramCacheKey()).toBe('ww-cel-v1-wing');
    const onVertex = vi.fn();
    const m = makeCelMaterial(u, { onVertex });
    const shader = toonProgram();
    m.onBeforeCompile(shader as never, undefined as never);
    expect(shader.fragmentShader).toContain('gCelLit');
    expect(onVertex).toHaveBeenCalledTimes(1);
    expect(onVertex.mock.calls[0]![0]).toBe(shader);
  });

  it('logs and goes on as the stock toon when the patch cannot be made', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const m = makeCelMaterial(createCelUniforms(CEL_LOOKS.genshin));
    m.onBeforeCompile({ vertexShader: '', fragmentShader: '', uniforms: {} } as never, undefined as never);
    expect(err).toHaveBeenCalledTimes(1);
    expect(String(err.mock.calls[0]![0])).toMatch(/cel patch failed/);
    err.mockRestore();
  });
});
