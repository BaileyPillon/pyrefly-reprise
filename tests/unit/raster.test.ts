import { describe, expect, it } from 'vitest';

import type { Frame, ShapeOp, SpriteDef } from '../../src/sprites/format.ts';
import { frameDuration, stateDurations } from '../../src/sprites/format.ts';
import { opaqueCount, parseColour, rasterize, rasterizeAll, scaleRaster } from '../../src/sprites/raster.ts';
import { tidus } from '../../src/sprites/characters/tidus.ts';

/** Minimal sprite scaffold: 16x16, three flat colours, no outline or shading. */
function def(frame: Frame, extra: Partial<SpriteDef> = {}): SpriteDef {
  return {
    name: 'test',
    size: [16, 16],
    anchor: [8, 15],
    palette: { a: '#ff0000', b: '#00ff00', L: '#ffffff', D: '#000000', t: 'transparent' },
    defaultState: 'idle',
    states: { idle: [frame] },
    ...extra,
  };
}

function at(r: { width: number; data: Uint8ClampedArray }, x: number, y: number): number[] {
  const i = (y * r.width + x) * 4;
  return [r.data[i]!, r.data[i + 1]!, r.data[i + 2]!, r.data[i + 3]!];
}

const RED = [255, 0, 0, 255];
const GREEN = [0, 255, 0, 255];
const CLEAR = [0, 0, 0, 0];

describe('rasterize — shapes', () => {
  it('fills a rect at exactly w*h pixels', () => {
    const r = rasterize(def({ ops: [{ op: 'rect', x: 3, y: 4, w: 5, h: 4, color: 'a' }] }), {
      ops: [{ op: 'rect', x: 3, y: 4, w: 5, h: 4, color: 'a' }],
    });
    expect(r.width).toBe(16);
    expect(r.height).toBe(16);
    expect(opaqueCount(r)).toBe(20);
    expect(at(r, 3, 4)).toEqual(RED);
    expect(at(r, 7, 7)).toEqual(RED);
    expect(at(r, 8, 7)).toEqual(CLEAR);
    expect(at(r, 3, 3)).toEqual(CLEAR);
  });

  it('strokes a rect border only when fill is false', () => {
    const frame: Frame = { ops: [{ op: 'rect', x: 2, y: 2, w: 6, h: 5, color: 'a', fill: false }] };
    const r = rasterize(def(frame), frame);
    expect(opaqueCount(r)).toBe(6 * 5 - 4 * 3);
    expect(at(r, 4, 4)).toEqual(CLEAR);
  });

  it('fills a midpoint ellipse with odd diameters', () => {
    const frame: Frame = { ops: [{ op: 'ellipse', cx: 8, cy: 8, rx: 3, ry: 3, color: 'a' }] };
    const r = rasterize(def(frame), frame);
    // 7 + 2*5 + 2*5 + 2*1 — the classic r=3 disc
    expect(opaqueCount(r)).toBe(29);
    expect(at(r, 8, 5)).toEqual(RED);
    expect(at(r, 8, 4)).toEqual(CLEAR);
    expect(at(r, 5, 8)).toEqual(RED);
    expect(at(r, 11, 8)).toEqual(RED);
    // symmetric about both axes
    for (let d = 1; d <= 3; d++) expect(at(r, 8 - d, 8)).toEqual(at(r, 8 + d, 8));
  });

  it('fills a polygon with the even-odd rule, boundary included', () => {
    const frame: Frame = {
      ops: [{ op: 'poly', points: [[2, 2], [6, 2], [6, 6], [2, 6]], color: 'a' }],
    };
    const r = rasterize(def(frame), frame);
    expect(opaqueCount(r)).toBe(25); // inclusive 5x5 square
    expect(at(r, 2, 2)).toEqual(RED);
    expect(at(r, 6, 6)).toEqual(RED);
    expect(at(r, 7, 6)).toEqual(CLEAR);
  });

  it('leaves an even-odd hole where a single path doubles back', () => {
    // Outer square, seam, inner square: even-odd empties the middle.
    const frame: Frame = {
      ops: [
        {
          op: 'poly',
          points: [[2, 2], [12, 2], [12, 12], [2, 12], [2, 2], [5, 5], [9, 5], [9, 9], [5, 9], [5, 5]],
          color: 'a',
          strokeEdges: false,
        },
      ],
    };
    const r = rasterize(def(frame), frame);
    expect(at(r, 3, 7)).toEqual(RED);
    expect(at(r, 10, 7)).toEqual(RED);
    expect(at(r, 7, 7)).toEqual(CLEAR);
  });

  it('erases with a transparent palette key', () => {
    const frame: Frame = {
      ops: [
        { op: 'rect', x: 2, y: 2, w: 8, h: 8, color: 'a' },
        { op: 'rect', x: 4, y: 4, w: 3, h: 3, color: 't' },
      ],
    };
    const r = rasterize(def(frame), frame);
    expect(at(r, 3, 3)).toEqual(RED);
    expect(at(r, 5, 5)).toEqual(CLEAR);
    expect(opaqueCount(r)).toBe(64 - 9);
  });

  it('draws Bresenham lines that touch both endpoints', () => {
    const frame: Frame = { ops: [{ op: 'line', x1: 2, y1: 2, x2: 9, y2: 5, color: 'a' }] };
    const r = rasterize(def(frame), frame);
    expect(at(r, 2, 2)).toEqual(RED);
    expect(at(r, 9, 5)).toEqual(RED);
    expect(opaqueCount(r)).toBe(8); // one pixel per x step
  });

  it('mirrors ops across the vertical centre', () => {
    const frame: Frame = {
      ops: [{ op: 'mirror', ops: [{ op: 'rect', x: 1, y: 3, w: 2, h: 2, color: 'a' }] }],
    };
    const r = rasterize(def(frame), frame);
    expect(at(r, 1, 3)).toEqual(RED);
    expect(at(r, 14, 3)).toEqual(RED); // 15 - 1
    expect(at(r, 13, 4)).toEqual(RED); // 15 - 2
    expect(opaqueCount(r)).toBe(8);
  });
});

describe('rasterize — outline', () => {
  const frame: Frame = { ops: [{ op: 'rect', x: 4, y: 4, w: 5, h: 4, color: 'a' }], outline: 'D' };

  it('adds a 1px outline outside the silhouette without eating pixels', () => {
    const r = rasterize(def(frame), frame);
    // 20 body pixels + a 4-neighbour ring of 2*(5+4) = 18
    expect(opaqueCount(r)).toBe(38);
    expect(at(r, 4, 4)).toEqual(RED); // corner of the shape is untouched
    expect(at(r, 4, 3)).toEqual([0, 0, 0, 255]); // outline above
    expect(at(r, 3, 4)).toEqual([0, 0, 0, 255]); // outline left
    expect(at(r, 3, 3)).toEqual(CLEAR); // diagonals stay clear
  });

  it('honours per-shape outline colour keys', () => {
    const f: Frame = {
      ops: [{ op: 'rect', x: 4, y: 4, w: 4, h: 4, color: 'a', outline: 'b' }],
      outline: 'D',
    };
    const r = rasterize(def(f), f);
    expect(at(r, 4, 3)).toEqual(GREEN);
  });

  it('skips shapes flagged outline: false', () => {
    const f: Frame = { ops: [{ op: 'rect', x: 4, y: 4, w: 4, h: 4, color: 'a', outline: false }], outline: 'D' };
    const r = rasterize(def(f), f);
    expect(opaqueCount(r)).toBe(16);
  });
});

describe('rasterize — shading', () => {
  it('lights the rim facing the light and darkens the far rim', () => {
    const f: Frame = {
      ops: [{ op: 'rect', x: 4, y: 4, w: 6, h: 6, color: 'a' }],
      shading: { light: 'left', lightKey: 'L', shadeKey: 'D' },
    };
    const r = rasterize(def(f), f);
    expect(at(r, 4, 6)).toEqual([255, 255, 255, 255]); // lit rim
    expect(at(r, 9, 6)).toEqual([0, 0, 0, 255]); // shadow rim
    expect(at(r, 6, 6)).toEqual(RED); // interior untouched
    expect(at(r, 6, 4)).toEqual(RED); // rims are 1px and directional only
  });

  it('tints by strength when no shade keys are given', () => {
    const f: Frame = {
      ops: [{ op: 'rect', x: 4, y: 4, w: 4, h: 4, color: 'a' }],
      shading: { light: 'left', strength: 0.5 },
    };
    const r = rasterize(def(f), f);
    const lit = at(r, 4, 5);
    expect(lit[1]).toBeGreaterThan(100); // red mixed halfway to white
    expect(lit[0]).toBe(255);
  });

  it('skips shapes flagged shade: false', () => {
    const f: Frame = {
      ops: [{ op: 'rect', x: 4, y: 4, w: 4, h: 4, color: 'a', shade: false }],
      shading: { light: 'left', lightKey: 'L', shadeKey: 'D' },
    };
    const r = rasterize(def(f), f);
    expect(at(r, 4, 5)).toEqual(RED);
  });
});

describe('rasterize — overlays and layers', () => {
  it('places pixel overlays exactly, after shading', () => {
    const f: Frame = {
      ops: [{ op: 'rect', x: 2, y: 2, w: 10, h: 10, color: 'a' }],
      shading: { light: 'left', lightKey: 'L', shadeKey: 'D' },
      overlays: [{ x: 4, y: 5, rows: ['.b.', 'b.b'] }],
    };
    const r = rasterize(def(f), f);
    expect(at(r, 5, 5)).toEqual(GREEN);
    expect(at(r, 4, 5)).toEqual(RED);
    expect(at(r, 4, 6)).toEqual(GREEN);
    expect(at(r, 6, 6)).toEqual(GREEN);
    expect(at(r, 5, 6)).toEqual(RED);
  });

  it('composes a frame from a named base plus deltas', () => {
    const base: Frame = { ops: [{ op: 'rect', x: 2, y: 2, w: 4, h: 4, color: 'a' }] };
    const frame: Frame = {
      base: [{ frame: 'body', offset: [1, 0] }],
      ops: [{ op: 'rect', x: 10, y: 10, w: 2, h: 2, color: 'b' }],
    };
    const d = def(frame, { frames: { body: base } });
    const r = rasterize(d, frame);
    expect(at(r, 3, 2)).toEqual(RED); // base shifted +1 in x
    expect(at(r, 2, 2)).toEqual(CLEAR);
    expect(at(r, 10, 10)).toEqual(GREEN);
  });

  it('offsets every layer when the frame itself is offset', () => {
    const base: Frame = { ops: [{ op: 'rect', x: 2, y: 2, w: 2, h: 2, color: 'a' }] };
    const frame: Frame = { base: 'body', offset: [3, 1] };
    const r = rasterize(def(frame, { frames: { body: base } }), frame);
    expect(at(r, 5, 3)).toEqual(RED);
    expect(at(r, 2, 2)).toEqual(CLEAR);
  });

  it('rejects cyclic and missing base frames', () => {
    const a: Frame = { base: 'b', ops: [] };
    const b: Frame = { base: 'a', ops: [] };
    expect(() => rasterize(def(a, { frames: { a, b } }), a)).toThrow(/cyclic/);
    const lost: Frame = { base: 'nope', ops: [] };
    expect(() => rasterize(def(lost), lost)).toThrow(/not in def.frames/);
  });

  it('renders rows frames one character per pixel', () => {
    const frame: Frame = { rows: ['.a.', 'aba'] };
    const r = rasterize(def(frame), frame);
    expect(at(r, 1, 0)).toEqual(RED);
    expect(at(r, 0, 0)).toEqual(CLEAR);
    expect(at(r, 1, 1)).toEqual(GREEN);
    expect(opaqueCount(r)).toBe(4);
  });
});

describe('rasterize — determinism and errors', () => {
  it('produces byte-identical output for the same input', () => {
    const a = rasterizeAll(tidus);
    const b = rasterizeAll(tidus);
    for (const state of Object.keys(a)) {
      a[state]!.forEach((r, i) => {
        expect(Array.from(r.data)).toEqual(Array.from(b[state]![i]!.data));
      });
    }
  });

  it('throws on a colour key that is not in the palette', () => {
    const frame: Frame = { ops: [{ op: 'rect', x: 1, y: 1, w: 2, h: 2, color: 'Z' } as ShapeOp] };
    expect(() => rasterize(def(frame), frame)).toThrow(/not in the palette/);
  });

  it('parses every accepted colour form', () => {
    expect(parseColour('#f00')).toEqual([255, 0, 0, 255]);
    expect(parseColour('#00ff00')).toEqual([0, 255, 0, 255]);
    expect(parseColour('#0000ff80')).toEqual([0, 0, 255, 128]);
    expect(parseColour('transparent')).toBeNull();
    expect(() => parseColour('#xyz')).toThrow();
  });

  it('upscales nearest-neighbour without resampling', () => {
    const frame: Frame = { ops: [{ op: 'rect', x: 0, y: 0, w: 1, h: 1, color: 'a' }] };
    const r = scaleRaster(rasterize(def(frame), frame), 4);
    expect(r.width).toBe(64);
    expect(at(r, 3, 3)).toEqual(RED);
    expect(at(r, 4, 0)).toEqual(CLEAR);
  });
});

describe('tidus', () => {
  it('rasterises every state at the party sprite size', () => {
    const all = rasterizeAll(tidus);
    expect(Object.keys(all).sort()).toEqual(['attack', 'hurt', 'idle', 'ko', 'ready', 'victory']);
    for (const [state, frames] of Object.entries(all)) {
      expect(frames.length, state).toBeGreaterThan(0);
      for (const r of frames) {
        expect([r.width, r.height]).toEqual([48, 64]);
        expect(opaqueCount(r)).toBeGreaterThan(200);
      }
    }
    expect(all['idle']!.length).toBe(2);
    expect(all['attack']!.length).toBe(3);
  });

  it('stays inside the palette budget and never touches the canvas edge', () => {
    expect(Object.keys(tidus.palette).length).toBeLessThanOrEqual(24);
    for (const frames of Object.values(rasterizeAll(tidus))) {
      for (const r of frames) {
        for (let x = 0; x < r.width; x++) {
          expect(at(r, x, 0)[3], `top row x=${x}`).toBe(0);
          expect(at(r, x, r.height - 1)[3], `bottom row x=${x}`).toBe(0);
        }
        for (let y = 0; y < r.height; y++) {
          expect(at(r, 0, y)[3], `left col y=${y}`).toBe(0);
          expect(at(r, r.width - 1, y)[3], `right col y=${y}`).toBe(0);
        }
      }
    }
  });

  it('exposes usable frame timings', () => {
    expect(frameDuration(tidus, tidus.states['idle']![0]!)).toBe(520);
    expect(stateDurations(tidus, 'attack')).toEqual([170, 110, 220]);
    expect(frameDuration(tidus, tidus.states['ready']![0]!)).toBe(200); // falls back to fps 5
  });
});
