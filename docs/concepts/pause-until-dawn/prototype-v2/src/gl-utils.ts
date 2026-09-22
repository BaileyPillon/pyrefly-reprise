/** Small WebGL2 plumbing shared by `renderer.ts` and `post.ts`. No `three` — this prototype is plain WebGL2, same as v1. */

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`shader compile failed: ${log ?? 'unknown error'}`);
  }
  return shader;
}

export function linkProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) throw new Error('createProgram failed');
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`program link failed: ${log ?? 'unknown error'}`);
  }
  return program;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load image: ${url}`));
    img.src = url;
  });
}

export function createTextureFromImage(gl: WebGL2RenderingContext, image: TexImageSource): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('createTexture failed');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // FIX (living-portrait-v2 fix pass): this was `true`. Every draw in
  // renderer.ts samples the texture straight (`vec4 c = texture(uTex, vUV)`,
  // `fragColor = vec4(c.rgb, c.a * uOpacity)`) and blends with
  // `gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` -- both are the STRAIGHT-
  // alpha convention (the blend equation itself supplies the one multiply by
  // alpha). Uploading with PREMULTIPLY_ALPHA true had the browser multiply
  // each texel's RGB by its own alpha ONCE on upload, and the straight-alpha
  // blend equation multiplies by alpha AGAIN -- any pixel with partial alpha
  // (every soft-feathered cut edge these layer PNGs have: headCore, hairBack,
  // hairFront, the eye apertures, the strands, the earring) got darkened by
  // alpha^2 instead of alpha. Invisible at full opacity (alpha=1: 1^2 == 1)
  // or full transparency (0^2 == 0), which is why the seam only shows at a
  // texture's own soft edges, not its interior or the fully-clear canvas
  // around it -- and why it reads as a "box" following the rectangular crop
  // each layer file is stored in (that crop's OWN border is exactly where
  // its alpha ramps through the partial range). Confirmed by re-rendering
  // frontal alone (a=q34-left, b=frontal at opacity 1, zero contribution
  // from any other key) with this flag false: the seam is gone; a plain
  // `sharp` composite of the same layer files (no WebGL, no premultiply
  // involved) never showed it either, which is what pointed here.
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

export interface FrameBufferTarget {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
}

export function createFramebufferTarget(gl: WebGL2RenderingContext, width: number, height: number): FrameBufferTarget {
  const tex = gl.createTexture();
  if (!tex) throw new Error('createTexture failed');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error('createFramebuffer failed');
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, width, height };
}

/** A full-canvas grid mesh: `cols`x`rows` quads, positions in clip space [-1,1], UVs in [0,1]. */
export function buildGridMesh(
  cols: number,
  rows: number,
): { positions: Float32Array; uvs: Float32Array; indices: Uint16Array } {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= cols; x++) {
      const u = x / cols;
      const v = y / rows;
      positions.push(u * 2 - 1, 1 - v * 2);
      uvs.push(u, v);
    }
  }
  const indices: number[] = [];
  const stride = cols + 1;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const a = y * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices) };
}
