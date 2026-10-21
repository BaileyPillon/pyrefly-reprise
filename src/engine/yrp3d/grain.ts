/**
 * **The brush grain** (the hidden 3D Bahamut chapter; FFX-2 only): the look lab's tileable 512 x 512 grain (`look-shaders.js`, `makeGrainTexture`), ported. R is a brush streak (a stretched noise at about 28 degrees), G a canvas
 * weave with tooth, B a fine isotropic noise. The wet floor's tiles take their tooth from B (`./wetFloor.ts`). Seeded, so it is the same every run.
 *
 * {@link grainData} is pure (a byte array a test can read); {@link makeGrainTexture} wraps it in a `DataTexture`. No DOM.
 */

import { DataTexture, NearestFilter, NoColorSpace, RGBAFormat, RepeatWrapping, UnsignedByteType } from 'three';

const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));

/** The RGBA bytes of a `size` x `size` grain, tileable. The default (512, seed 11) is the lab's. */
export function grainData(size = 512, seed = 11): Uint8Array {
  let s = seed >>> 0;
  const rnd = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const white = new Float32Array(size * size);
  for (let i = 0; i < white.length; i++) white[i] = rnd();
  const wrap = (v: number): number => ((v % size) + size) % size;
  const sample = (a: Float32Array, x: number, y: number): number => a[wrap(Math.round(y)) * size + wrap(Math.round(x))]!;
  const streak = (a: Float32Array, len: number, ang: number): Float32Array => {
    const out = new Float32Array(size * size);
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let acc = 0;
        for (let t = -len; t <= len; t++) acc += sample(a, x + dx * t, y + dy * t);
        out[y * size + x] = acc / (2 * len + 1);
      }
    }
    return out;
  };
  const blur = (a: Float32Array, r: number): Float32Array => {
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let acc = 0;
        let c = 0;
        for (let j = -r; j <= r; j++) {
          for (let i = -r; i <= r; i++) {
            acc += sample(a, x + i, y + j);
            c++;
          }
        }
        out[y * size + x] = acc / c;
      }
    }
    return out;
  };
  const norm = (a: Float32Array): Float32Array => {
    let m = 0;
    let v = 0;
    for (const x of a) m += x;
    m /= a.length;
    for (const x of a) v += (x - m) * (x - m);
    const sd = Math.sqrt(v / a.length) || 1;
    return a.map((x) => clamp(0.5 + ((x - m) / sd) * 0.18, 0, 1));
  };
  const fineStreak = norm(streak(white, 11, 0.49));
  const wide = norm(blur(streak(white, 5, 0.49), 3));
  const brush = fineStreak.map((x, i) => clamp(0.65 * x + 0.35 * wide[i]!, 0, 1));
  const tooth = norm(blur(white, 1));
  const weave = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tw = (rnd() - 0.5) * 0.4;
      const a = Math.sin(((x + tw) * Math.PI * 2) / 4) * 0.5 + Math.sin(((y + tw) * Math.PI * 2) / 4) * 0.5;
      weave[y * size + x] = clamp(0.5 + a * 0.2 + (tooth[y * size + x]! - 0.5) * 0.7, 0, 1);
    }
  }
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = Math.round(brush[i]! * 255);
    data[i * 4 + 1] = Math.round(weave[i]! * 255);
    data[i * 4 + 2] = Math.round(tooth[i]! * 255);
    data[i * 4 + 3] = 255;
  }
  return data;
}

/** The grain as a repeating, nearest-filtered, colour-space-free `DataTexture` (it holds numbers, not colours). Free it with `dispose()`. */
export function makeGrainTexture(size = 512, seed = 11): DataTexture {
  const tex = new DataTexture(grainData(size, seed), size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}
