import { describe, expect, it } from 'vitest';
import { paintedFragmentShader } from '../../../src/engine/shaders/PaintedShader.ts';
import { patchPaintedShader, SHADER_PATCHES } from '../../../src/engine/rig/RigMaterial.ts';

describe('the part shader is the game shader with seven patches', () => {
  it('every patch still applies to the live painted shader (a drift would send the stage back to the painting set, but a test should say so first)', () => {
    for (const [from] of SHADER_PATCHES) expect(paintedFragmentShader.includes(from), from).toBe(true);
    expect(() => patchPaintedShader(paintedFragmentShader)).not.toThrow();
  });

  it('the patched source reads the height above the ground and the figure coordinates, not the part UV, for the contact ramp, the bounce and the dissolve', () => {
    const s = patchPaintedShader(paintedFragmentShader);
    expect(s).toContain('smoothstep(0.0, max(0.01, contactBand), vH)');
    expect(s).toContain('smoothstep(0.0, max(0.08, contactBand * 4.2), vH)');
    expect(s).toContain('texture2D(noiseMap, vFig * vec2(1.6, 2.4))');
    expect(s).toContain('(1.0 - vH) * 0.34');
    expect(s).toContain('vH * 0.44');
    expect(s).not.toContain('contactBand), vUv.y)');
    expect(s).toContain('* mix(1.0, texture2D(rimMask, uv).r, rimOn) * rimGain');
    // the rest of the game's shader is untouched
    expect(s).toContain('const float FLASH_GAIN = 0.85;');
    expect(s).toContain('gl_FragColor = vec4(c, a * opacity);');
  });

  it('throws, naming the line, when the game shader no longer has one of them', () => {
    expect(() => patchPaintedShader(paintedFragmentShader.replace('float edge = clamp(a - inward, 0.0, 1.0);', 'float edge = 0.0;'))).toThrow(/painted shader changed: cannot find float edge/);
  });
});

describe('the part material, lit (release 61, the HD-2D look: `relight`)', () => {
  const base = async () => {
    const { Texture } = await import('three');
    const { makePartMaterial } = await import('../../../src/engine/rig/RigMaterial.ts');
    const t = new Texture();
    return { makePartMaterial, opts: { shared: {} as Record<string, { value: unknown }>, contactBand: { value: 0.1 }, map: t, rimMask: t, rimMode: 'off' as const, boxW: 10, boxH: 10, rimTexelK: 1 } };
  };

  it('is the game material, unchanged, unless it is asked to be lit: no define, no light uniform', async () => {
    const { makePartMaterial, opts } = await base();
    const m = makePartMaterial(opts);
    expect(m.defines?.['PAINTED_RELIGHT']).toBeUndefined();
    expect(m.uniforms['relightNormal']).toBeUndefined();
    expect(m.uniforms['relightAny']).toBeUndefined();
  });

  it('compiles the painted shader\'s relight block in when asked, with the shared light cells and an unbound (flat, off) normal', async () => {
    const { makePartMaterial, opts } = await base();
    const { relightCells } = await import('../../../src/engine/look/relight/FigureRelight.ts');
    const m = makePartMaterial({ ...opts, relight: true });
    expect(m.defines?.['PAINTED_RELIGHT']).toBe('');
    for (const k of Object.keys(relightCells)) expect(m.uniforms[k], k).toBe((relightCells as Record<string, unknown>)[k]);
    expect(m.uniforms['relightOn']!.value).toBe(0);
    expect(m.uniforms['relightNormal']!.value).toBeTruthy();
  });

  it('feeds the fragment block the varyings it reads: the plane\'s three axes in view space and the clip position, behind the same define', async () => {
    const { makePartMaterial, opts } = await base();
    const v = makePartMaterial(opts).vertexShader;
    for (const s of ['#ifdef PAINTED_RELIGHT', 'varying vec3 vNR;', 'varying vec3 vNU;', 'varying vec3 vNF;', 'varying vec4 vClip;', 'vClip = gl_Position;']) expect(v, s).toContain(s);
    expect(v.indexOf('vClip = gl_Position;')).toBeGreaterThan(v.indexOf('gl_Position = projectionMatrix')); // after the position it copies
    const f = makePartMaterial(opts).fragmentShader;
    expect(f).toContain('texture2D(relightNormal, uv)'); // the part's own uvs, the ones its colour is read with
  });
});
