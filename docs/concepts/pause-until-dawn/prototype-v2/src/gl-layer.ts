/**
 * The three GPU programs the v3 renderer needs: a placed, straight-alpha
 * layer quad (box on the plate canvas + a pixel offset + opacity + a light
 * gain); the same layer drawn through a triangle mesh (`warp/mesh.ts`: each
 * vertex carries where it samples the painting and where it lands on screen,
 * so a key's features move onto the interpolated landmarks); and a
 * full-screen pass that either copies one target or mixes two (the yaw blend
 * of two COMPLETE, already-warped composites, so the pinned body never
 * double-exposes and no key's crop ever shows through another's).
 */
import { linkProgram } from './gl-utils.ts';
import type { PixelBox } from './layers.ts';

const LAYER_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos; // unit quad corners, 0..1 (x right, y down)
uniform vec4 uBox;      // x, y, w, h in canvas px
uniform vec2 uOffset;   // canvas px
uniform vec2 uCanvas;   // canvas size px
out vec2 vUV;
void main() {
  vec2 px = uBox.xy + aPos * uBox.zw + uOffset;
  vec2 ndc = vec2(px.x / uCanvas.x * 2.0 - 1.0, 1.0 - px.y / uCanvas.y * 2.0);
  vUV = aPos;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const LAYER_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uOpacity;
uniform float uGain;
out vec4 fragColor;
void main() {
  vec4 c = texture(uTex, vUV);
  fragColor = vec4(c.rgb * uGain, c.a * uOpacity);
}`;

const WARP_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aSrc; // where this vertex samples the painting (plate px)
layout(location = 1) in vec2 aDst; // where it lands on screen (plate px)
uniform vec4 uBox;
uniform vec2 uOffset;
uniform vec2 uCanvas;
out vec2 vUV;
void main() {
  vec2 px = aDst + uOffset;
  vUV = (aSrc - uBox.xy) / uBox.zw; // affine per triangle: an exact piecewise-affine warp
  gl_Position = vec4(px.x / uCanvas.x * 2.0 - 1.0, 1.0 - px.y / uCanvas.y * 2.0, 0.0, 1.0);
}`;

const WARP_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uOpacity;
uniform float uGain;
out vec4 fragColor;
void main() {
  // the mesh covers the whole canvas; outside this layer's own box there is nothing to draw
  vec2 inside = step(vec2(0.0), vUV) * step(vUV, vec2(1.0));
  vec4 c = texture(uTex, clamp(vUV, 0.0, 1.0));
  fragColor = vec4(c.rgb * uGain, c.a * uOpacity * inside.x * inside.y);
}`;

const FULL_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

const MIX_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uW;
out vec4 fragColor;
void main() {
  fragColor = vec4(mix(texture(uA, vUV).rgb, texture(uB, vUV).rgb, uW), 1.0);
}`;

/**
 * Coverage-aware blend of two PREMULTIPLIED head passes (one per key, each
 * already warped onto the shared landmarks). Where both keys have paint it
 * is the plain mix; where only one has (a silhouette that differs: a
 * profile's nose past the three-quarter's cheek), that key's paint fills the
 * pixel instead of fading against whatever is behind, which is what made a
 * turned-away outline read as a ghost. Alpha runs from A's at w = 0 to B's at
 * w = 1 exactly, bulging toward the union in between.
 */
const UNION_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uW;
uniform float uUnion; // 1: bulge toward the union; 0: the exact premultiplied lerp
out vec4 fragColor;
void main() {
  vec4 a = texture(uA, vUV);
  vec4 b = texture(uB, vUV);
  float cov = (1.0 - uW) * a.a + uW * b.a;
  if (cov < 1e-4) { fragColor = vec4(0.0); return; }
  vec3 rgb = ((1.0 - uW) * a.rgb + uW * b.rgb) / cov; // straight colour of whatever paint is here
  float lin = cov;
  float uni = max(a.a, b.a);
  float alpha = lin + (uni - lin) * 4.0 * uW * (1.0 - uW) * uUnion;
  fragColor = vec4(rgb * alpha, alpha);
}`;

export class LayerGL {
  private readonly gl: WebGL2RenderingContext;
  private readonly layerProg: WebGLProgram;
  private readonly mixProg: WebGLProgram;
  private readonly warpProg: WebGLProgram;
  private readonly unionProg: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly warpVao: WebGLVertexArrayObject;
  private readonly warpBuf: WebGLBuffer;
  private warpVerts = 0;
  private readonly u: Record<string, WebGLUniformLocation | null>;
  private readonly w: Record<string, WebGLUniformLocation | null>;
  private readonly m: Record<string, WebGLUniformLocation | null>;

  constructor(gl: WebGL2RenderingContext, private readonly canvasW: number, private readonly canvasH: number) {
    this.gl = gl;
    this.layerProg = linkProgram(gl, LAYER_VERT, LAYER_FRAG);
    this.mixProg = linkProgram(gl, FULL_VERT, MIX_FRAG);
    this.warpProg = linkProgram(gl, WARP_VERT, WARP_FRAG);
    this.unionProg = linkProgram(gl, FULL_VERT, UNION_FRAG);
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('createVertexArray failed');
    this.vao = vao;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    const wvao = gl.createVertexArray();
    const wbuf = gl.createBuffer();
    if (!wvao || !wbuf) throw new Error('warp buffers failed');
    this.warpVao = wvao;
    this.warpBuf = wbuf;
    gl.bindVertexArray(wvao);
    gl.bindBuffer(gl.ARRAY_BUFFER, wbuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    const wp = this.warpProg;
    this.w = Object.fromEntries(['uBox', 'uOffset', 'uCanvas', 'uTex', 'uOpacity', 'uGain'].map((n) => [n, gl.getUniformLocation(wp, n)]));
    const lp = this.layerProg;
    this.u = Object.fromEntries(['uBox', 'uOffset', 'uCanvas', 'uTex', 'uOpacity', 'uGain'].map((n) => [n, gl.getUniformLocation(lp, n)]));
    const mp = this.mixProg;
    this.m = Object.fromEntries(['uA', 'uB', 'uW'].map((n) => [n, gl.getUniformLocation(mp, n)]));
  }

  /**
   * Straight-alpha "over" into whatever target is bound; the target stays
   * opaque. `warp` (from `PairWarp.vertexData`) routes every following
   * non-pinned `draw` through that mesh; null draws plain placed quads.
   */
  beginLayers(warp: Float32Array | null = null): void {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    this.warpVerts = 0;
    if (warp) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.warpBuf);
      gl.bufferData(gl.ARRAY_BUFFER, warp, gl.DYNAMIC_DRAW);
      this.warpVerts = warp.length / 4;
      gl.useProgram(this.warpProg);
      gl.uniform2f(this.w.uCanvas!, this.canvasW, this.canvasH);
      gl.uniform1i(this.w.uTex!, 0);
    }
    gl.useProgram(this.layerProg);
    gl.uniform2f(this.u.uCanvas!, this.canvasW, this.canvasH);
    gl.uniform1i(this.u.uTex!, 0);
  }

  /** `pinned` layers (the body) never warp: they are the same pixels in every key. */
  draw(tex: WebGLTexture, box: PixelBox, offset: readonly [number, number] = [0, 0], opacity = 1, gain = 1, pinned = false): void {
    if (opacity <= 0.001) return;
    const gl = this.gl;
    const warped = this.warpVerts > 0 && !pinned;
    const u = warped ? this.w : this.u;
    gl.useProgram(warped ? this.warpProg : this.layerProg);
    gl.bindVertexArray(warped ? this.warpVao : this.vao);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform4f(u.uBox!, box[0], box[1], box[2], box[3]);
    gl.uniform2f(u.uOffset!, offset[0], offset[1]);
    gl.uniform1f(u.uOpacity!, Math.min(1, opacity));
    gl.uniform1f(u.uGain!, gain);
    if (warped) gl.drawArrays(gl.TRIANGLES, 0, this.warpVerts);
    else gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Full-screen: mix(a, b, w) into the bound target (w = 0 copies a). */
  mix(a: WebGLTexture, b: WebGLTexture, w: number): void {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    gl.useProgram(this.mixProg);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b);
    gl.uniform1i(this.m.uA!, 0);
    gl.uniform1i(this.m.uB!, 1);
    gl.uniform1f(this.m.uW!, w);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.activeTexture(gl.TEXTURE0);
  }

  /**
   * Premultiplied mix of two passes, composited "over" the bound target:
   * `union` for two warped head passes, the exact lerp for two bodies.
   */
  mixUnion(a: WebGLTexture, b: WebGLTexture, w: number, union = true): void {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.unionProg);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b);
    const p = this.unionProg;
    gl.uniform1i(gl.getUniformLocation(p, 'uA'), 0);
    gl.uniform1i(gl.getUniformLocation(p, 'uB'), 1);
    gl.uniform1f(gl.getUniformLocation(p, 'uW'), w);
    gl.uniform1f(gl.getUniformLocation(p, 'uUnion'), union ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.activeTexture(gl.TEXTURE0);
  }

  dispose(): void {
    this.gl.deleteProgram(this.layerProg);
    this.gl.deleteProgram(this.mixProg);
    this.gl.deleteProgram(this.warpProg);
    this.gl.deleteProgram(this.unionProg);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteVertexArray(this.warpVao);
    this.gl.deleteBuffer(this.warpBuf);
  }
}
