/**
 * PR-0185's remainder (FFX only, Chapter IX): at 4:3 the `enemy` rig opens its
 * fov to keep 16:9's width, and tilts up by half of what it opened so its
 * bottom edge stays where it is at 16:9, keeping the party below the frame.
 */
import { describe, expect, it } from 'vitest';
import { CAVERN_DESIGN_ASPECT, CAVERN_WIDE_RIGS, cavernRigsFor, holdBottom, holdWidth } from '../../../src/scenes/cavern-stolen-fayth-rigs.ts';

type V = [number, number, number];
const pitchDeg = (p: V, l: V): number => (Math.atan2(l[1] - p[1], Math.hypot(l[0] - p[0], l[2] - p[2])) * 180) / Math.PI;

describe('holdBottom', () => {
  it('keeps the bottom edge ray of the 16:9 frame at 4:3', () => {
    const rig = CAVERN_WIDE_RIGS['enemy']!;
    const out = holdBottom(rig, 4 / 3, CAVERN_DESIGN_ASPECT);
    const bottom16x9 = pitchDeg(rig.position as V, rig.lookAt as V) - rig.fov! / 2;
    const bottom4x3 = pitchDeg(out.position as V, out.lookAt as V) - out.fov! / 2;
    expect(out.fov).toBeGreaterThan(rig.fov!);
    expect(bottom4x3).toBeCloseTo(bottom16x9, 2);
    expect(out.fov).toBe(holdWidth(rig, 4 / 3, CAVERN_DESIGN_ASPECT).fov);
  });

  it('changes nothing at 16:9 or wider', () => {
    expect(holdBottom(CAVERN_WIDE_RIGS['enemy']!, 16 / 9, CAVERN_DESIGN_ASPECT)).toBe(CAVERN_WIDE_RIGS['enemy']!);
    expect(cavernRigsFor(2)['enemy']).toBe(CAVERN_WIDE_RIGS['enemy']!);
  });

  it('applies to the enemy rig only; the others keep holdWidth', () => {
    const r = cavernRigsFor(4 / 3);
    expect(r['enemy']!.lookAt).not.toEqual(CAVERN_WIDE_RIGS['enemy']!.lookAt);
    expect(r.idle).toEqual(holdWidth(CAVERN_WIDE_RIGS.idle, 4 / 3, CAVERN_DESIGN_ASPECT));
  });
});
