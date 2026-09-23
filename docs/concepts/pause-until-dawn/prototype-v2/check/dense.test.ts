import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLOW_FLOATS, SIDE_FLOATS, gridIndices, readFlow, sideVertices } from '../src/warp/dense.ts';

/** v4.1: the dense pair meshes (tools/gen/rig-flow.py) are whole, fold-free at every weight, and exact at the keys. */
const ART = new URL('../art/', import.meta.url);
const rig = JSON.parse(readFileSync(new URL('rig.json', ART), 'utf8'));
const flow = readFlow(rig.artMeta)!;
const keys = [...rig.keys].sort((a: { yawDeg: number }, b: { yawDeg: number }) => a.yawDeg - b.yawDeg) as Array<{ id: string; yawDeg: number }>;

function load(file: string): Float32Array {
  const b = readFileSync(new URL(file, ART));
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

describe('v4.1 dense pair meshes', () => {
  it('covers every adjacent pair of keys', () => {
    for (let i = 1; i < keys.length; i++) expect(flow.pairs[`${keys[i - 1]!.id}|${keys[i]!.id}`], keys[i]!.id).toBeTruthy();
  });

  it('no triangle turns over at any bracket weight (21 samples)', () => {
    const idx = gridIndices(flow.nx, flow.ny);
    for (const file of Object.values(flow.pairs)) {
      const d = load(file);
      expect(d.length).toBe(flow.nx * flow.ny * FLOW_FLOATS);
      let folded = 0;
      for (let s = 0; s <= 20; s++) {
        const g = s / 20;
        const P = (i: number): [number, number] => {
          const o = i * FLOW_FLOATS;
          return [d[o]! + (d[o + 2]! - d[o]!) * g, d[o + 1]! + (d[o + 3]! - d[o + 1]!) * g];
        };
        for (let t = 0; t < idx.length; t += 3) {
          const [a, b, c] = [P(idx[t]!), P(idx[t + 1]!), P(idx[t + 2]!)];
          const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
          if (area <= 0) folded++;
        }
      }
      expect(folded, file).toBe(0);
    }
  });

  it('draws each key as painted at its own end of the bracket (texel = screen position)', () => {
    for (const file of Object.values(flow.pairs)) {
      const d = load(file);
      const a = sideVertices(d, 'a');
      const b = sideVertices(d, 'b');
      for (let i = 0; i < flow.nx * flow.ny; i += 97) {
        const o = i * SIDE_FLOATS;
        // side a samples its own texel and sits there at g = 0; side b at g = 1
        expect(a[o]).toBe(a[o + 2]);
        expect(a[o + 1]).toBe(a[o + 3]);
        expect(b[o]).toBe(b[o + 4]);
        expect(b[o + 1]).toBe(b[o + 5]);
      }
    }
  });

  it('keeps the frame: the left, top and right canvas edges never move across the frame line', () => {
    for (const file of Object.values(flow.pairs)) {
      const d = load(file);
      for (let y = 0; y < flow.ny; y++) {
        for (const x of [0, flow.nx - 1]) {
          const o = (y * flow.nx + x) * FLOW_FLOATS;
          expect(Math.abs(d[o]! - d[o + 2]!), `${file} x-edge`).toBeLessThan(0.5);
        }
      }
      for (let x = 0; x < flow.nx; x++) {
        const o = x * FLOW_FLOATS;
        expect(Math.abs(d[o + 1]! - d[o + 3]!), `${file} top edge`).toBeLessThan(0.5);
      }
    }
  });
});
