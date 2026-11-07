/**
 * **The shore and the far mountains** (the hidden Wendigo chapter's 3D stage; FFX only): one ring of snowy ground round the ice, built once in code. From the ice's edge it rolls up in drifts, then climbs into a range of
 * ridged mountains that stand tallest to the north (behind the enemies, under the aurora) and to the east and west, and stay low to the south, behind the camera, so no flight is ever blocked. Vertex colours carry the
 * look: blue-white snow, darker rock on the steep and the ridged, and a cold light on the peaks; the stage's key, fill and rim light it and the scene's fog fades the far ones into the haze.
 *
 * `shoreHeight` is the pure height function (a test reads it: the ring is flat at the ice's edge and the north is the highest). Staging, not game data. Needs three.js; no DOM. Game case: FFX only.
 */

import { BufferAttribute, BufferGeometry, Color, Mesh, MeshStandardMaterial } from 'three';
import { ARENA } from './layout.ts';

/** A seeded value noise on a 2D lattice, 0..1. */
function hash(ix: number, iy: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  return hash(ix, iy) * (1 - u) * (1 - v) + hash(ix + 1, iy) * u * (1 - v) + hash(ix, iy + 1) * (1 - u) * v + hash(ix + 1, iy + 1) * u * v;
}
function fbm(x: number, y: number, octaves = 4): number {
  let s = 0;
  let a = 0.5;
  for (let i = 0; i < octaves; i++) {
    s += a * noise(x, y);
    x = x * 2.02 + 7.3;
    y = y * 2.02 + 3.1;
    a *= 0.5;
  }
  return s;
}
/** Ridged noise: sharp crests. */
function ridged(x: number, y: number): number {
  let s = 0;
  let a = 0.6;
  for (let i = 0; i < 4; i++) {
    s += a * (1 - Math.abs(noise(x, y) * 2 - 1));
    x = x * 2.1 + 5.2;
    y = y * 2.1 + 1.7;
    a *= 0.5;
  }
  return s;
}

/** The ground's height at (x, z) in metres, measured from the lake's middle: 0 inside the ice's edge, drifts to about 8 m, mountains to about 120 m in the north. */
export function shoreHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r <= ARENA.iceRadius) return 0;
  const a = Math.atan2(x, -z); // 0 is the north, -z
  const north = 0.5 + 0.5 * Math.cos(a); // 1 in the north, 0 in the south
  const side = Math.abs(Math.sin(a));
  const bias = 0.28 + 0.72 * Math.max(north, side * 0.75); // low behind the camera
  const drift = (1 - Math.exp(-(r - ARENA.iceRadius) / 14)) * (2.6 + 5.5 * fbm(x * 0.045, z * 0.045));
  const range = Math.pow(Math.max(0, (r - 70) / 190), 1.25);
  const mountain = range * (16 + 44 * ridged(x * 0.011 + 3, z * 0.011 + 8)) * bias * Math.min(1, range * 3);
  return drift + mountain;
}

export interface Shore {
  readonly mesh: Mesh;
  dispose(): void;
}

/** Build the ring: `segments` round it, `rings` out from the ice's edge to the outer radius. */
export function buildShore(segments = 220, rings = 70): Shore {
  const inner = ARENA.iceRadius - 1.5;
  const outer = 330;
  const positions = new Float32Array((segments + 1) * (rings + 1) * 3);
  const colours = new Float32Array(positions.length);
  const snow = new Color(0x31405c);
  const lit = new Color(0x8aa6cc);
  const rock = new Color(0x0c121e);
  const tmp = new Color();
  let k = 0;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const r = inner + (outer - inner) * Math.pow(t, 1.7); // dense near the ice, coarse far off
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.sin(a) * r;
      const z = -Math.cos(a) * r;
      const h = shoreHeight(x, z);
      positions[k] = x;
      positions[k + 1] = h - (r < ARENA.iceRadius ? 0.05 : 0);
      positions[k + 2] = z;
      const steep = Math.min(1, Math.max(0, ridged(x * 0.03, z * 0.03) - 0.55));
      tmp.copy(snow).lerp(lit, Math.min(1, h / 40)).lerp(rock, steep * Math.min(1, h / 25) * 0.7);
      colours[k] = tmp.r;
      colours[k + 1] = tmp.g;
      colours[k + 2] = tmp.b;
      k += 3;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      index.push(a, b, c, b, d, c); // wound so the normals point up
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, fog: true });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'lake-shore';
  mesh.frustumCulled = false;
  return {
    mesh,
    dispose(): void {
      geometry.dispose();
      material.dispose();
      mesh.removeFromParent();
    },
  };
}
