/**
 * The two GPU programs the v3 renderer needs: a placed, straight-alpha layer
 * quad (box on the plate canvas + a pixel offset + opacity + a light gain),
 * and a full-screen pass that either copies one target or mixes two (the
 * yaw cross-dissolve of two COMPLETE composites, so the pinned body never
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

export class LayerGL {
  private readonly gl: WebGL2RenderingContext;
  private readonly layerProg: WebGLProgram;
  private readonly mixProg: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly u: Record<string, WebGLUniformLocation | null>;
  private readonly m: Record<string, WebGLUniformLocation | null>;

  constructor(gl: WebGL2RenderingContext, private readonly canvasW: number, private readonly canvasH: number) {
    this.gl = gl;
    this.layerProg = linkProgram(gl, LAYER_VERT, LAYER_FRAG);
    this.mixProg = linkProgram(gl, FULL_VERT, MIX_FRAG);
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
    const lp = this.layerProg;
    this.u = Object.fromEntries(['uBox', 'uOffset', 'uCanvas', 'uTex', 'uOpacity', 'uGain'].map((n) => [n, gl.getUniformLocation(lp, n)]));
    const mp = this.mixProg;
    this.m = Object.fromEntries(['uA', 'uB', 'uW'].map((n) => [n, gl.getUniformLocation(mp, n)]));
  }

  /** Straight-alpha "over" into whatever target is bound; the target stays opaque. */
  beginLayers(): void {
    const gl = this.gl;
    gl.useProgram(this.layerProg);
    gl.bindVertexArray(this.vao);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(this.u.uCanvas!, this.canvasW, this.canvasH);
    gl.uniform1i(this.u.uTex!, 0);
    gl.activeTexture(gl.TEXTURE0);
  }

  draw(tex: WebGLTexture, box: PixelBox, offset: readonly [number, number] = [0, 0], opacity = 1, gain = 1): void {
    if (opacity <= 0.001) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform4f(this.u.uBox!, box[0], box[1], box[2], box[3]);
    gl.uniform2f(this.u.uOffset!, offset[0], offset[1]);
    gl.uniform1f(this.u.uOpacity!, Math.min(1, opacity));
    gl.uniform1f(this.u.uGain!, gain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

  dispose(): void {
    this.gl.deleteProgram(this.layerProg);
    this.gl.deleteProgram(this.mixProg);
    this.gl.deleteVertexArray(this.vao);
  }
}
