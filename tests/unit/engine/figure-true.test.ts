import { describe, expect, it } from 'vitest';
import { AdditiveBlending, CustomBlending, DstAlphaFactor, OneFactor, Vector2, ZeroFactor } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { maskBloomHighPass } from '../../../src/engine/BloomMask.ts';
import { GradeShader } from '../../../src/engine/shaders/GradeShader.ts';
import {
  FIGURE_TRUE_DEFAULT,
  FIGURE_TRUE_RIM_CUT,
  applyFigureTrue,
  bloomMaskFor,
  figureTrueOf,
  parseFigureTrue,
  rimQuiet,
  srgbDecode,
  srgbEncode,
} from '../../../src/engine/figureTrue.ts';

/**
 * r39-color (both games): a painted figure drawn true to its painting, behind a switch that is OFF by default.
 * The GLSL cannot run here; what can be pinned is the switch, the maths it applies, where the shader reads it, and what it moves in the renderer.
 */
describe('figureTrue', () => {
  it('is off by default, in the shader and in the default, so every frame is what it was', () => {
    expect(FIGURE_TRUE_DEFAULT).toBe(0);
    expect(GradeShader.uniforms.figureTrue.value).toBe(0);
  });

  it('reads ?figtrue= as an amount from 0 to 1 and ignores anything else', () => {
    expect(parseFigureTrue('')).toBeNull();
    expect(parseFigureTrue('?coach=off')).toBeNull();
    expect(parseFigureTrue('?figtrue=1')).toBe(1);
    expect(parseFigureTrue('?figtrue=0.6')).toBe(0.6);
    expect(parseFigureTrue('?figtrue=0')).toBe(0);
    expect(parseFigureTrue('?figtrue=7')).toBe(1);
    expect(parseFigureTrue('?figtrue=-2')).toBe(0);
    expect(parseFigureTrue('?figtrue=')).toBeNull();
    expect(parseFigureTrue('?figtrue=abc')).toBeNull();
  });

  it('applies the sRGB encode, the exact inverse of the decode a painted texture gets on the way in', () => {
    expect(srgbEncode(0)).toBe(0);
    expect(srgbEncode(1)).toBeCloseTo(1, 12);
    expect(srgbEncode(0.5)).toBeCloseTo(0.7354, 4);
    expect(srgbDecode(0.5)).toBeCloseTo(0.214, 4);
    for (let b = 0; b <= 255; b++) expect(Math.round(srgbEncode(srgbDecode(b / 255)) * 255)).toBe(b);
  });

  it('shows a painting its own colour with the switch on, and a darker, more saturated one with it off (the measured error)', () => {
    // A mid skin tone of a painted figure, as bytes. The sampler decodes it to linear; the chain keeps it linear; the grade writes it raw.
    const painting = [230, 180, 150];
    const lin = painting.map((b) => srgbDecode(b / 255));
    const off = lin.map((v) => Math.round(v * 255)); // today with a neutral grade: the linear value shown as if it were sRGB
    const on = lin.map((v) => Math.round(srgbEncode(v) * 255)); // figureTrue = 1
    expect(on).toEqual(painting);
    expect(off[0]).toBeLessThan(painting[0]! - 20); // every channel is darker ...
    expect(off[2]).toBeLessThan(painting[2]! - 60);
    const chroma = (c: number[]): number => Math.max(...c) - Math.min(...c);
    expect(chroma(off)).toBeGreaterThan(chroma(painting)); // ... and the spread between them, the colour, grows
  });

  it('reads the figure from the frame alpha (the bloom mask), gates on the switch, and runs before the grain and the vignette', () => {
    const src = GradeShader.fragmentShader;
    expect(src).toContain('uniform float figureTrue;');
    expect(src).toContain('figureTrue > 0.0 ? (1.0 - clamp(texel.a, 0.0, 1.0)) * figureTrue : 0.0');
    const at = src.indexOf('if (figm > 0.0)');
    expect(at).toBeGreaterThan(src.indexOf('lookAmount > 0.0'));
    expect(at).toBeLessThan(src.indexOf('film grain'));
    expect(at).toBeLessThan(src.indexOf('vignette (toward'));
    // the frame still leaves opaque: the alpha that carries the mask never reaches the canvas
    expect(src).toContain('gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);');
  });

  it('keeps the palette figure bloom mask until figures are drawn true, then takes all of it', () => {
    expect(bloomMaskFor(0, 0)).toBe(0);
    expect(bloomMaskFor(0.7, 0)).toBe(0.7);
    expect(bloomMaskFor(0, 0.2)).toBe(1);
    expect(bloomMaskFor(0.7, 1)).toBe(1);
  });

  it('cuts the rim light only as far as figures are drawn true', () => {
    expect(rimQuiet(0)).toBe(1);
    expect(rimQuiet(1)).toBeCloseTo(1 - FIGURE_TRUE_RIM_CUT, 12);
    expect(rimQuiet(0.5)).toBeCloseTo(1 - FIGURE_TRUE_RIM_CUT / 2, 12);
    expect(rimQuiet(9)).toBeCloseTo(1 - FIGURE_TRUE_RIM_CUT, 12);
    expect(rimQuiet(-3)).toBe(1);
  });

  it('moves the grade exemption, the bloom receiving mask and the figure bloom mask together, and puts all three back at 0', () => {
    const grade = new ShaderPass(GradeShader);
    const bloom = new UnrealBloomPass(new Vector2(64, 64), 1, 0.5, 0.5);
    maskBloomHighPass(bloom);
    const host = { gradePass: grade, bloomPass: bloom, palette: { figureBloomMask: 0.7 } };
    const mask = (): number => bloom.materialHighPassFilter.uniforms['figureMask']!.value as number;
    const blend = bloom.blendMaterial;
    const before = { blending: blend.blending, premultipliedAlpha: blend.premultipliedAlpha };

    applyFigureTrue(host, 0);
    expect(figureTrueOf(host)).toBe(0);
    expect(mask()).toBe(0.7);
    expect(blend.blending).toBe(AdditiveBlending);
    expect({ blending: blend.blending, premultipliedAlpha: blend.premultipliedAlpha }).toEqual(before); // three's own blend, untouched

    applyFigureTrue(host, 1);
    expect(figureTrueOf(host)).toBe(1);
    expect(mask()).toBe(1);
    expect(blend.blending).toBe(CustomBlending);
    expect(blend.blendSrc).toBe(DstAlphaFactor); // the bloom's light scaled by the frame alpha ...
    expect(blend.blendDst).toBe(OneFactor);
    expect(blend.blendSrcAlpha).toBe(ZeroFactor); // ... and the frame alpha (the mask) left exactly as it was
    expect(blend.blendDstAlpha).toBe(OneFactor);

    applyFigureTrue(host, 0.4);
    expect(figureTrueOf(host)).toBeCloseTo(0.4, 12);
    expect(blend.blending).toBe(CustomBlending);

    applyFigureTrue(host, 7);
    expect(figureTrueOf(host)).toBe(1);
    applyFigureTrue(host, -1);
    expect(figureTrueOf(host)).toBe(0);
    expect(mask()).toBe(0.7);
    expect({ blending: blend.blending, premultipliedAlpha: blend.premultipliedAlpha }).toEqual(before);
    bloom.dispose();
    grade.dispose();
  });
});
