import {
  HalfFloatType,
  NearestFilter,
  NoBlending,
  RGBAFormat,
  SRGBColorSpace,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

/**
 * Prefiltered mip levels for the painted textures (the crispness options round, option E).
 *
 * The driver builds a texture's chain by averaging 2x2 texels (a box filter), and trilinear sampling then blends two of those
 * levels: both soften, and the blend at a fractional level is the blurriest of all. This rewrites levels 1..n of an uploaded
 * texture with a Lanczos-3 two-times decimation of the level above it, done on the GPU: the alpha is weighted in (a texel under
 * a transparent edge no longer drags its colour into the figure's rim), the colour is filtered in linear light (the sRGB texture
 * decodes on read, the sRGB target encodes on write), and an anti-ringing clamp keeps the dark ink lines free of halos.
 * Level 0, the approved painting, is never touched, and neither is any file: this runs at draw time, per texture, once.
 *
 * Original shader code (AGENTS.md rule 8).
 */
const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D tSrc;
  uniform int uLevel;      // the source level to read
  uniform vec2 uDir;
  uniform float uScale;    // source texels per output texel along the axis
  uniform float uRing;     // anti-ringing amount 0..1
  uniform float uFinal;    // 1 on the vertical pass: un-premultiply on the way out

  float sinc(float x) {
    x *= 3.14159265;
    return abs(x) < 1e-5 ? 1.0 : sin(x) / x;
  }

  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    bool horiz = uDir.x > 0.5;
    ivec2 size = textureSize(tSrc, uLevel);
    int n = horiz ? size.x : size.y;
    float c = horiz ? float(p.x) : float(p.y);
    float xs = (c + 0.5) * uScale - 0.5;
    float R = 3.0 * uScale;
    int i0 = int(ceil(xs - R));
    int i1 = int(floor(xs + R));
    vec4 acc = vec4(0.0);
    float wsum = 0.0;
    vec4 mn = vec4(1e9);
    vec4 mx = vec4(-1e9);
    for (int k = 0; k < 40; k++) {
      int i = i0 + k;
      if (i > i1) break;
      float d = float(i) - xs;
      float x = abs(d / uScale);
      float w = x < 3.0 ? sinc(x) * sinc(x / 3.0) : 0.0;
      ivec2 q = horiz ? ivec2(clamp(i, 0, n - 1), p.y) : ivec2(p.x, clamp(i, 0, n - 1));
      vec4 t = texelFetch(tSrc, q, uLevel);
      // The first pass reads straight alpha and weights the colour by it; the second reads what the first wrote (premultiplied).
      vec4 v = uFinal > 0.5 ? t : vec4(t.rgb * t.a, t.a);
      acc += w * v;
      wsum += w;
      if (abs(d) <= 0.5 * uScale + 1e-3) {
        mn = min(mn, v);
        mx = max(mx, v);
      }
    }
    vec4 r = acc / max(wsum, 1e-6);
    if (uRing > 0.0 && mx.x >= mn.x) r = mix(r, clamp(r, mn, mx), uRing);
    r = max(r, vec4(0.0));
    if (uFinal > 0.5) {
      r.a = clamp(r.a, 0.0, 1.0);
      r.rgb = r.a > 1e-4 ? clamp(r.rgb / r.a, 0.0, 1.0) : vec3(0.0);
    }
    gl_FragColor = r;
  }
`;

export interface PrefilterStats {
  textures: number;
  levels: number;
  ms: number;
}

/** What the filter works on: a plain 2D texture whose chain exists on the GPU (uploaded with mipmaps, or a render target's texture). */
function size(tex: Texture): { w: number; h: number } | null {
  const img = (tex.image ?? tex.source?.data) as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | null;
  const w = Number(img?.naturalWidth || img?.width || 0);
  const h = Number(img?.naturalHeight || img?.height || 0);
  return w > 1 && h > 1 ? { w, h } : null;
}

export class MipPrefilter {
  private readonly material: ShaderMaterial;
  private readonly quad: FullScreenQuad;
  private tmp: WebGLRenderTarget | null = null;
  private out: WebGLRenderTarget | null = null;
  readonly stats: PrefilterStats = { textures: 0, levels: 0, ms: 0 };

  constructor(private readonly renderer: WebGLRenderer) {
    this.material = new ShaderMaterial({
      name: 'MipPrefilter',
      uniforms: {
        tSrc: { value: null },
        uLevel: { value: 0 },
        uDir: { value: { x: 1, y: 0 } },
        uScale: { value: 2 },
        uRing: { value: 0.5 },
        uFinal: { value: 0 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  private target(kind: 'tmp' | 'out', w: number, h: number, srgb: boolean): WebGLRenderTarget {
    const cur = kind === 'tmp' ? this.tmp : this.out;
    if (cur && cur.width === w && cur.height === h && (kind === 'tmp' || (cur.texture.colorSpace === SRGBColorSpace) === srgb)) return cur;
    cur?.dispose();
    const rt =
      kind === 'tmp'
        ? new WebGLRenderTarget(w, h, { type: HalfFloatType, format: RGBAFormat, depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter })
        : new WebGLRenderTarget(w, h, {
            type: UnsignedByteType,
            format: RGBAFormat,
            colorSpace: srgb ? SRGBColorSpace : undefined,
            depthBuffer: false,
            minFilter: NearestFilter,
            magFilter: NearestFilter,
          });
    if (kind === 'tmp') this.tmp = rt;
    else this.out = rt;
    return rt;
  }

  /** Rewrite levels 1..n of `tex` (already uploaded: this uploads it if it is not). False when the texture is not one this can serve. */
  apply(tex: Texture, ring = 0.5): boolean {
    const dim = size(tex);
    const kind = tex as Texture & { isCompressedTexture?: boolean; isDataTexture?: boolean; isCubeTexture?: boolean };
    if (!dim || kind.isCompressedTexture || kind.isDataTexture || kind.isCubeTexture) return false;
    const t0 = performance.now();
    const r = this.renderer;
    if (!tex.isRenderTargetTexture) r.initTexture(tex);
    const levels = Math.floor(Math.log2(Math.max(dim.w, dim.h))) + 1;
    const srgb = tex.colorSpace === SRGBColorSpace;
    const prevTarget = r.getRenderTarget();
    const prevAuto = r.autoClear;
    r.autoClear = false;
    const u = this.material.uniforms;
    u['uRing']!.value = ring;
    try {
      for (let l = 1; l < levels; l++) {
        const sw = Math.max(1, dim.w >> (l - 1));
        const sh = Math.max(1, dim.h >> (l - 1));
        const dw = Math.max(1, dim.w >> l);
        const dh = Math.max(1, dim.h >> l);
        const tmp = this.target('tmp', dw, sh, srgb);
        const out = this.target('out', dw, dh, srgb);
        // horizontal: level l-1 of the texture into tmp (premultiplied, half float)
        u['tSrc']!.value = tex;
        u['uLevel']!.value = l - 1;
        (u['uDir']!.value as { x: number; y: number }).x = 1;
        (u['uDir']!.value as { x: number; y: number }).y = 0;
        u['uScale']!.value = sw / dw;
        u['uFinal']!.value = 0;
        r.setRenderTarget(tmp);
        this.quad.render(r);
        // vertical: tmp into the sRGB target, un-premultiplied
        u['tSrc']!.value = tmp.texture;
        u['uLevel']!.value = 0;
        (u['uDir']!.value as { x: number; y: number }).x = 0;
        (u['uDir']!.value as { x: number; y: number }).y = 1;
        u['uScale']!.value = sh / dh;
        u['uFinal']!.value = 1;
        r.setRenderTarget(out);
        this.quad.render(r);
        r.copyTextureToTexture(out.texture, tex, null, null, 0, l);
        this.stats.levels++;
      }
    } finally {
      r.setRenderTarget(prevTarget);
      r.autoClear = prevAuto;
    }
    this.stats.textures++;
    this.stats.ms += performance.now() - t0;
    return true;
  }

  /** Put the driver's own chain (a 2x2 box average) back on an uploaded texture: the `gpu` setting of the round. False if it is not on the GPU yet. */
  restore(tex: Texture): boolean {
    const props = this.renderer.properties.get(tex) as { __webglTexture?: WebGLTexture };
    const handle = props.__webglTexture;
    if (!handle) return false;
    const gl = this.renderer.getContext();
    this.renderer.state.bindTexture(gl.TEXTURE_2D, handle);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.renderer.state.unbindTexture();
    return true;
  }

  /** Set the anisotropy of an uploaded texture now (a version bump would re-upload it and rebuild its chain). */
  setAnisotropy(tex: Texture, n: number): boolean {
    tex.anisotropy = n;
    const props = this.renderer.properties.get(tex) as { __webglTexture?: WebGLTexture };
    const handle = props.__webglTexture;
    const ext = this.renderer.extensions.get('EXT_texture_filter_anisotropic') as { TEXTURE_MAX_ANISOTROPY_EXT: number } | null;
    if (!handle || !ext) return false;
    const gl = this.renderer.getContext();
    this.renderer.state.bindTexture(gl.TEXTURE_2D, handle);
    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, n);
    this.renderer.state.unbindTexture();
    return true;
  }

  /** A checksum of one level of an uploaded 2D texture (read back through a framebuffer): the test that a chain is what it was. */
  checksum(tex: Texture, level: number): string | null {
    const props = this.renderer.properties.get(tex) as { __webglTexture?: WebGLTexture };
    const handle = props.__webglTexture;
    const dim = size(tex);
    if (!handle || !dim) return null;
    const w = Math.max(1, dim.w >> level);
    const h = Math.max(1, dim.h >> level);
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const fb = gl.createFramebuffer();
    const prev = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, handle, level);
    let out: string | null = null;
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let a = 0;
      let b = 0;
      for (let i = 0; i < px.length; i++) {
        a = (a + px[i]!) % 65521;
        b = (b + a) % 65521;
      }
      out = `${w}x${h}:${((b << 16) | a) >>> 0}`;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
    gl.deleteFramebuffer(fb);
    return out;
  }

  /** What the GPU really holds for a texture: its anisotropy parameter, its filters and its size (the JS property of a render target's texture never reaches GL). */
  inspect(tex: Texture): { aniso: number | null; min: number; mag: number; w: number; h: number; rt: boolean } | null {
    const props = this.renderer.properties.get(tex) as { __webglTexture?: WebGLTexture };
    const handle = props.__webglTexture;
    const ext = this.renderer.extensions.get('EXT_texture_filter_anisotropic') as { TEXTURE_MAX_ANISOTROPY_EXT: number } | null;
    const dim = size(tex);
    if (!handle || !dim) return null;
    const gl = this.renderer.getContext();
    this.renderer.state.bindTexture(gl.TEXTURE_2D, handle);
    const out = {
      aniso: ext ? (gl.getTexParameter(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT) as number) : null,
      min: gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER) as number,
      mag: gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER) as number,
      w: dim.w,
      h: dim.h,
      rt: !!tex.isRenderTargetTexture,
    };
    this.renderer.state.unbindTexture();
    return out;
  }

  dispose(): void {
    this.tmp?.dispose();
    this.out?.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
