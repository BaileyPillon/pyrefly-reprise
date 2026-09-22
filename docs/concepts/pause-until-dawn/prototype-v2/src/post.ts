/**
 * The post pass: focus falloff (sharp face, softer hair/background),
 * shadow-weighted temporal grain, and the asymmetric grade. Runs once per
 * frame over the scene `renderer.ts` composited into an offscreen texture.
 */
import { RIG_CONSTANTS } from './constants.ts';
import { FULLSCREEN_VERT, POST_FRAG } from './shaders.ts';
import { linkProgram } from './gl-utils.ts';
import type { HeadBox } from './rig.ts';

export interface PostParams {
  headBox: HeadBox;
  timeSeconds: number;
  reducedMotion: boolean;
  width: number;
  height: number;
}

export class PostPass {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly uScene: WebGLUniformLocation | null;
  private readonly uTexel: WebGLUniformLocation | null;
  private readonly uHeadBox: WebGLUniformLocation | null;
  private readonly uTime: WebGLUniformLocation | null;
  private readonly uGrainAmount: WebGLUniformLocation | null;
  private readonly uReduced: WebGLUniformLocation | null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = linkProgram(gl, FULLSCREEN_VERT, POST_FRAG);
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('createVertexArray failed');
    this.vao = vao;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // A single clip-space triangle that covers the screen (cheaper than a quad).
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.uScene = gl.getUniformLocation(this.program, 'uScene');
    this.uTexel = gl.getUniformLocation(this.program, 'uTexel');
    this.uHeadBox = gl.getUniformLocation(this.program, 'uHeadBox');
    this.uTime = gl.getUniformLocation(this.program, 'uTime');
    this.uGrainAmount = gl.getUniformLocation(this.program, 'uGrainAmount');
    this.uReduced = gl.getUniformLocation(this.program, 'uReduced');
  }

  /** Draws to whatever framebuffer is currently bound (the canvas by default). */
  apply(sceneTexture: WebGLTexture, params: PostParams): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(this.uScene, 0);
    gl.uniform2f(this.uTexel, 1 / params.width, 1 / params.height);
    gl.uniform4f(this.uHeadBox, params.headBox.x, params.headBox.y, params.headBox.w, params.headBox.h);
    gl.uniform1f(this.uTime, params.timeSeconds);
    const grainFrac = (RIG_CONSTANTS.image.grainPctMin + RIG_CONSTANTS.image.grainPctMax) / 2 / 100;
    gl.uniform1f(this.uGrainAmount, grainFrac);
    gl.uniform1f(this.uReduced, params.reducedMotion ? 1 : 0);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}
