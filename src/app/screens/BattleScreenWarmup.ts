/**
 * Compile a battle field's shaders before its first frame, without freezing
 * the page (PR-0061).
 *
 * Measured on a production build (real GPU, Chapter 1): the first frame that
 * drew the freshly loaded diorama took 1.2 s, and 1.1-1.3 s of it was three.js
 * asking for program info logs, which forces each of the field's ~22 shader
 * programs to finish compiling and linking right there on the main thread. The
 * frames after it ran at 110-150 ms while the figures' own programs followed.
 *
 * `WebGLRenderer.compileAsync` starts the same compiles and then polls
 * `KHR_parallel_shader_compile` instead of blocking, so the GPU process
 * compiles while the page keeps running (the swirl and the battle-start card
 * stay smooth). The one trap: the composer draws the scene into its own
 * render target, whose linear output selects a different program than the
 * screen would, so the compile runs with that target bound, or the real first
 * frame would compile everything a second time.
 *
 * A ceiling keeps a driver without the extension (or a very slow one) from
 * holding the battle: past it, the first frame compiles what is left, as
 * before. Game case: both (shared presentation plumbing).
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Mesh,
  PCFShadowMap,
  PCFSoftShadowMap,
  Scene,
  type Camera,
  type Object3D,
  type WebGLRenderTarget,
} from 'three';

/** The slice of `engine/Renderer.ts` this needs. */
export interface WarmupRenderer {
  readonly renderer: {
    getRenderTarget(): WebGLRenderTarget | null;
    setRenderTarget(target: WebGLRenderTarget | null): void;
    compileAsync(scene: Object3D, camera: Camera): Promise<unknown>;
    readonly shadowMap?: { type: number };
  };
  readonly composer: { readonly readBuffer: WebGLRenderTarget; readonly passes?: readonly object[] };
  readonly camera: Camera;
  /** One frame through the post chain (`Renderer.render`). */
  render?(scene: Scene, camera?: Camera): void;
}

/** Options for {@link warmShaders}. */
export interface WarmShadersOptions {
  /** Longest to wait on the compile. */
  ceilingMs?: number;
  /**
   * Then draw one frame of it, while the swirl still covers the screen.
   *
   * On ANGLE's D3D11 back end a program reported complete still builds its
   * GPU executable on its first draw: measured, that first frame took 0.5 s
   * warm and 1.1 s on a fresh browser even after the compile had finished.
   * Drawn here, the stall lands under the full swirl cover instead of freezing
   * the battle-start card as it comes in.
   */
  draw?: boolean;
}

/** Longest the battle waits on the compile before drawing anyway. */
export const SHADER_WARM_CEILING_MS = 2500;

/**
 * Compile `scene` as the composer will draw it. Resolves when every program is
 * ready or at `ceilingMs`, with how long it took and whether it finished.
 */
export async function warmShaders(
  r: WarmupRenderer,
  scene: Object3D,
  opts: WarmShadersOptions = {},
): Promise<{ ms: number; finished: boolean }> {
  const ceilingMs = opts.ceilingMs ?? SHADER_WARM_CEILING_MS;
  const t0 = performance.now();
  const gl = r?.renderer;
  // A stand-in renderer (unit tests, a headless harness) has nothing to compile.
  if (typeof gl?.compileAsync !== 'function' || !r.composer?.readBuffer) return { ms: 0, finished: false };
  // three r186 swaps a `PCFSoftShadowMap` for `PCFShadowMap` inside its first
  // shadow pass, and the shadow type is part of every lit program's key: a
  // compile before that swap builds programs the first frame then throws away
  // (measured: 12 of Chapter 1's). Make the same swap first.
  if (gl.shadowMap && gl.shadowMap.type === PCFSoftShadowMap) gl.shadowMap.type = PCFShadowMap;
  let compiling: Promise<unknown>;
  try {
    compiling = Promise.all([
      compileWith(gl, r.composer.readBuffer, scene, r.camera),
      ...postChainOnce(r),
    ]);
  } catch {
    return { ms: 0, finished: false };
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ceiling = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), ceilingMs);
  });
  const finished = await Promise.race([compiling.then(() => true, () => false), ceiling]);
  if (timer !== undefined) clearTimeout(timer);
  if (opts.draw && scene instanceof Scene) {
    try {
      r.render?.(scene, r.camera);
    } catch {
      /* the loop's own first frame draws it instead */
    }
  }
  return { ms: Math.round(performance.now() - t0), finished };
}

/** Start compiling `obj` with `target` bound, as the pass that draws it will have it. */
function compileWith(
  gl: WarmupRenderer['renderer'],
  target: WebGLRenderTarget | null,
  obj: Object3D,
  camera: Camera,
): Promise<unknown> {
  const previous = gl.getRenderTarget();
  try {
    gl.setRenderTarget(target);
    return gl.compileAsync(obj, camera);
  } finally {
    gl.setRenderTarget(previous);
  }
}

/** Renderers whose post chain has already been compiled. */
const postWarmed = new WeakSet<object>();

/**
 * The composer's own passes (bloom, tilt-shift, grade), once per renderer.
 *
 * Nothing draws through the composer before the first battle (the title, the
 * board and prep are DOM), so its dozen programs used to compile inside the
 * first battle frame, under the battle-start card. Each pass material goes on
 * a stand-in quad and compiles with the target that pass really draws into:
 * the composer's buffer, or the screen for the last pass.
 */
function postChainOnce(r: WarmupRenderer): Promise<unknown>[] {
  const passes = r.composer.passes;
  if (!passes?.length || postWarmed.has(r.renderer)) return [];
  postWarmed.add(r.renderer);
  const offscreen = new Scene();
  const onscreen = new Scene();
  // The same attributes as three's `FullScreenQuad` (position and uv, no
  // normals): whether a geometry has normals is part of the program key.
  const quad = new BufferGeometry();
  quad.setAttribute('position', new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
  quad.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  for (const pass of passes) {
    const into = (pass as { renderToScreen?: boolean }).renderToScreen ? onscreen : offscreen;
    for (const value of Object.values(pass)) {
      for (const m of Array.isArray(value) ? value : [value]) {
        if (m instanceof Material) into.add(new Mesh(quad, m));
      }
    }
  }
  return [
    compileWith(r.renderer, r.composer.readBuffer, offscreen, r.camera),
    compileWith(r.renderer, null, onscreen, r.camera),
  ].map((p) => p.finally(() => quad.dispose()));
}
