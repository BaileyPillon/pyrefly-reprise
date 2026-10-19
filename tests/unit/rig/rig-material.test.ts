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
