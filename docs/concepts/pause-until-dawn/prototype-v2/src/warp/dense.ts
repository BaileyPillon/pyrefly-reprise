/**
 * v4.1: the dense, feature-registered warp between two adjacent yaw keys
 * (`tools/gen/rig-flow.py`, `artMeta.v4.flow`). The v4 check found the
 * sparse 25-landmark mesh registered the face's frame but nothing between
 * the points, so every paint change showed two irises, two lash lines, two
 * jaw lines. Here each pair has a midpoint grid (every 8 px) whose vertices
 * carry their texel in both keys, measured by optical flow on top of the
 * landmark map:
 *
 *   pA, pB   the vertex's texel in the lower-yaw key and in the higher
 *   headW    1 on the head, 0 at the frame and the shoulder pins
 *
 * At bracket weight g a vertex is drawn at (1 - g) pA + g pB (+ the chest and
 * headW times the head's own sway). Key A samples at pA, key B at pB, so at
 * g = 0 key A is its own painting to the texel, at g = 1 key B is, and in
 * between both land on the same features. The interpolation runs on the GPU
 * from static buffers (one upload per pair, not per frame).
 */
import { linkProgram } from '../gl-utils.ts';

export interface FlowMeta {
  nx: number;
  ny: number;
  /** "lowId|highId" -> the .bin file (float32 LE, 5 per vertex: pA.x, pA.y, pB.x, pB.y, headW). */
  pairs: Record<string, string>;
}

export function readFlow(artMeta: unknown): FlowMeta | null {
  const f = (artMeta as { v4?: { flow?: FlowMeta } } | undefined)?.v4?.flow;
  return f && f.nx > 1 && f.ny > 1 && f.pairs ? f : null;
}

/** What `LayerGL.draw` needs to route a head layer through a dense pair mesh this frame. */
export interface DenseDraw {
  vao: WebGLVertexArrayObject;
  count: number;
  /** Bracket weight: 0 = the lower-yaw key's geometry, 1 = the higher's. */
  g: number;
  /** Plate px added to every vertex (the chest). */
  chest: readonly [number, number];
  /** Plate px added in proportion to headW (the head's own sway). */
  sway: readonly [number, number];
}

export const DENSE_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aSrc;  // this key's texel (plate px)
layout(location = 1) in vec2 aDst0; // the lower-yaw key's texel = where the vertex sits at g = 0
layout(location = 2) in vec2 aDst1; // the higher-yaw key's texel = where it sits at g = 1
layout(location = 3) in float aHeadW;
uniform vec4 uBox;
uniform vec2 uOffset;
uniform vec2 uCanvas;
uniform float uG;
uniform vec2 uChest;
uniform vec2 uSway;
out vec2 vUV;
void main() {
  vec2 px = mix(aDst0, aDst1, uG) + uChest + aHeadW * uSway + uOffset;
  vUV = (aSrc - uBox.xy) / uBox.zw;
  gl_Position = vec4(px.x / uCanvas.x * 2.0 - 1.0, 1.0 - px.y / uCanvas.y * 2.0, 0.0, 1.0);
}`;

/** Two triangles per grid cell, sharing the cell's diagonal from top-left to bottom-right. */
export function gridIndices(nx: number, ny: number): Uint32Array {
  const out = new Uint32Array((nx - 1) * (ny - 1) * 6);
  let o = 0;
  for (let y = 0; y < ny - 1; y++) {
    for (let x = 0; x < nx - 1; x++) {
      const i = y * nx + x;
      out.set([i, i + 1, i + nx, i + 1, i + nx + 1, i + nx], o);
      o += 6;
    }
  }
  return out;
}

/** Floats per vertex in the pair files, and in one side's interleaved GL buffer. */
export const FLOW_FLOATS = 5;
export const SIDE_FLOATS = 7;

/** Interleaves one side's vertex buffer: src (this key's texel), dst0, dst1, headW. */
export function sideVertices(data: Float32Array, side: 'a' | 'b'): Float32Array {
  const n = data.length / FLOW_FLOATS;
  const out = new Float32Array(n * SIDE_FLOATS);
  for (let i = 0; i < n; i++) {
    const s = i * FLOW_FLOATS;
    const o = i * SIDE_FLOATS;
    out[o] = data[s + (side === 'a' ? 0 : 2)]!;
    out[o + 1] = data[s + (side === 'a' ? 1 : 3)]!;
    out[o + 2] = data[s]!;
    out[o + 3] = data[s + 1]!;
    out[o + 4] = data[s + 2]!;
    out[o + 5] = data[s + 3]!;
    out[o + 6] = data[s + 4]!;
  }
  return out;
}

interface PairGL {
  a: WebGLVertexArrayObject;
  b: WebGLVertexArrayObject;
}

/** Owns the dense pair meshes on the GPU; `draw(key side)` hands `LayerGL` a `DenseDraw`. */
export class DenseMeshes {
  readonly program: WebGLProgram;
  readonly uniforms: Record<string, WebGLUniformLocation | null>;
  private readonly pairs = new Map<string, PairGL>();
  private readonly buffers: WebGLBuffer[] = [];
  private readonly vaos: WebGLVertexArrayObject[] = [];
  private count = 0;

  constructor(private readonly gl: WebGL2RenderingContext, fragSrc: string) {
    this.program = linkProgram(gl, DENSE_VERT, fragSrc);
    this.uniforms = Object.fromEntries(
      ['uBox', 'uOffset', 'uCanvas', 'uTex', 'uOpacity', 'uGain', 'uExt', 'uG', 'uChest', 'uSway'].map((n) => [n, gl.getUniformLocation(this.program, n)]),
    );
  }

  async load(base: string, meta: FlowMeta): Promise<void> {
    const gl = this.gl;
    const idx = gridIndices(meta.nx, meta.ny);
    this.count = idx.length;
    const ibo = gl.createBuffer();
    if (!ibo) throw new Error('createBuffer failed');
    this.buffers.push(ibo);
    const n = meta.nx * meta.ny;
    for (const [pair, file] of Object.entries(meta.pairs)) {
      const buf = await (await fetch(base + file)).arrayBuffer();
      const data = new Float32Array(buf);
      if (data.length !== n * FLOW_FLOATS) throw new Error(`${file}: ${data.length} floats, expected ${n * FLOW_FLOATS}`);
      const make = (side: 'a' | 'b'): WebGLVertexArrayObject => {
        const vao = gl.createVertexArray();
        const vbo = gl.createBuffer();
        if (!vao || !vbo) throw new Error('dense buffers failed');
        this.vaos.push(vao);
        this.buffers.push(vbo);
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, sideVertices(data, side), gl.STATIC_DRAW);
        const stride = SIDE_FLOATS * 4;
        [[0, 2, 0], [1, 2, 8], [2, 2, 16], [3, 1, 24]].forEach(([loc, size, off]) => {
          gl.enableVertexAttribArray(loc!);
          gl.vertexAttribPointer(loc!, size!, gl.FLOAT, false, stride, off!);
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        return vao;
      };
      this.pairs.set(pair, { a: make('a'), b: make('b') });
    }
  }

  has(lowId: string, highId: string): boolean {
    return this.pairs.has(`${lowId}|${highId}`);
  }

  /** The dense draw for `keyId` inside the pair (lowId, highId) at weight g; null when the rig has no such pair. */
  draw(lowId: string, highId: string, keyId: string, g: number, chest: readonly [number, number], sway: readonly [number, number]): DenseDraw | null {
    const p = this.pairs.get(`${lowId}|${highId}`);
    if (!p || (keyId !== lowId && keyId !== highId)) return null;
    return { vao: keyId === lowId ? p.a : p.b, count: this.count, g, chest, sway };
  }

  dispose(): void {
    const gl = this.gl;
    for (const v of this.vaos) gl.deleteVertexArray(v);
    for (const b of this.buffers) gl.deleteBuffer(b);
    gl.deleteProgram(this.program);
  }
}
