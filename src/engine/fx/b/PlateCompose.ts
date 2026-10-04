import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Texture,
  UnsignedByteType,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';

/**
 * Option B "Living Paintings", release 39: the depth plates at the painting's own master resolution, composed on the GPU.
 *
 * The cut (`plateMaths.cutPlates`: the depth thresholds, the feathered alphas, the push-pull fill under the nearer plates) is
 * done once at the painting's approved width, as before. A 2x master of the painting (5376x3072, `backdrops/<key>@2x.png`) then
 * lays its own pixels over that cut: a plate's colour is the master wherever the plate above does not cover it completely, and
 * the working-resolution fill (soft by nature: an average of the plate's own pixels) where it does; its alpha is the working
 * alpha, bilinear. Done as one full-screen pass per plate into a render target of the master's size, so four 5376x3072 plates
 * cost four draw calls, no CPU copy of the 66 MB each and no second push-pull at 16 million pixels.
 *
 * At rest the stack composites to the 2x painting exactly as the 1x stack composites to the approved one. Game case: both
 * (shared plumbing); the cut is each room's own.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uPaint;
  uniform sampler2D uWork;
  uniform sampler2D uAbove;
  uniform float uHasAbove;
  uniform float uSolid;
  varying vec2 vUv;
  void main() {
    vec4 w = texture2D(uWork, vUv);
    float above = uHasAbove > 0.5 ? texture2D(uAbove, vUv).a : 0.0;
    vec3 paint = texture2D(uPaint, vUv).rgb;
    float fill = step(uSolid, above);
    gl_FragColor = vec4(mix(paint, w.rgb, fill), w.a);
  }
`;

export interface ComposedPlates {
  targets: WebGLRenderTarget[];
  textures: Texture[];
}

/**
 * Compose one render target per plate. `work` are the plates at working resolution, rows bottom-up (GL order), RGBA, straight
 * alpha, exactly the bytes the 1x path uploads; `paint` is the master image (any `texImage2D` source); the targets are
 * `scale` times the working size. The caller owns the targets (`dispose()` them) and the textures belong to them.
 */
export function composeHiPlates(
  renderer: WebGLRenderer,
  paint: TexImageSource,
  work: { w: number; h: number; plates: Uint8Array[] },
  scale: number,
  solid = 0.999,
): ComposedPlates {
  const paintTex = new Texture(paint as HTMLImageElement);
  paintTex.colorSpace = SRGBColorSpace;
  paintTex.generateMipmaps = false;
  paintTex.minFilter = LinearFilter;
  paintTex.magFilter = LinearFilter;
  paintTex.needsUpdate = true;
  const workTex = work.plates.map((bytes) => {
    const t = new DataTexture(bytes, work.w, work.h, RGBAFormat, UnsignedByteType);
    t.colorSpace = SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = LinearFilter;
    t.magFilter = LinearFilter;
    t.needsUpdate = true;
    return t;
  });
  const material = new ShaderMaterial({
    uniforms: {
      uPaint: { value: paintTex },
      uWork: { value: workTex[0] },
      uAbove: { value: workTex[0] },
      uHasAbove: { value: 0 },
      uSolid: { value: solid },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(1, 1), material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const targets: WebGLRenderTarget[] = [];
  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  renderer.autoClear = true;
  try {
    for (let k = 0; k < workTex.length; k++) {
      const rt = new WebGLRenderTarget(Math.round(work.w * scale), Math.round(work.h * scale), {
        type: UnsignedByteType,
        format: RGBAFormat,
        colorSpace: SRGBColorSpace,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: true,
        minFilter: LinearMipmapLinearFilter,
        magFilter: LinearFilter,
      });
      material.uniforms['uWork']!.value = workTex[k];
      material.uniforms['uAbove']!.value = workTex[k + 1] ?? workTex[k];
      material.uniforms['uHasAbove']!.value = workTex[k + 1] ? 1 : 0;
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      targets.push(rt);
    }
  } finally {
    renderer.setRenderTarget(prevTarget);
    renderer.autoClear = prevAutoClear;
    quad.geometry.dispose();
    material.dispose();
    paintTex.dispose();
    for (const t of workTex) t.dispose();
  }
  return { targets, textures: targets.map((t) => t.texture) };
}
