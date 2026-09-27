/**
 * PR-0178 (FFX only): the ally brackets drew across the command rows. The field cursor's layer is
 * clipped out where the command stack sits, so a bracket goes behind the stack (z-order by clip:
 * the stack lives in the letterboxed stage's own stacking context, method check PR-0019).
 */
import { describe, expect, it } from 'vitest';
import { stackClipPath } from '../../src/ui/ffx/bracketClip.ts';

describe('stackClipPath', () => {
  it('cuts each row out of the layer, in the layer\'s own coordinates', () => {
    const p = stackClipPath({ left: 0, top: 0, width: 1600, height: 900 }, [{ left: 70, top: 440, right: 560, bottom: 500 }, { left: 90, top: 510, right: 580, bottom: 570 }]);
    expect(p).toBe("path(evenodd, 'M0 0H1600V900H0Z M70 440H560V500H70Z M90 510H580V570H90Z')");
  });

  it('offsets by the layer origin and clamps to it', () => {
    const p = stackClipPath({ left: 100, top: 50, width: 800, height: 450 }, [{ left: 50, top: 300, right: 400, bottom: 600 }]);
    expect(p).toBe("path(evenodd, 'M0 0H800V450H0Z M0 250H300V450H0Z')");
  });

  it('no stack, or none overlapping the layer: no clip', () => {
    expect(stackClipPath({ left: 0, top: 0, width: 800, height: 450 }, [])).toBe('');
    expect(stackClipPath({ left: 0, top: 0, width: 800, height: 450 }, [{ left: 900, top: 0, right: 950, bottom: 40 }])).toBe('');
  });
});
