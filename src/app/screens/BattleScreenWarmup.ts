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
 * before.
 *
 * **R61 (PR-0481, the conference demo): the first draw is sliced.** Measured in headless GPU Chromium on a cold page (CPU profile of each frame gap,
 * `docs/handoff/r61-booth.md`): the one first draw below stalls 0.8 to 1.0 s in Chapters I and IV, almost all of it `getProgramInfoLog` waiting for
 * the scene's five or six biggest programs to finish building their GPU executables one after the other (a Phong with shadows alone is 210 to 240 ms, Chapter IV's
 * plume 270 ms). It lands under the swirl, but it is one gap of nearly a second. {@link drawSliced} draws the scene once per program family (the other
 * families hidden for that draw, the field not yet shown), a frame apart, so the same stalls land one at a time (the largest is one program, about 0.25 s)
 * and the final complete draw finds every program built. Nothing is drawn that was not drawn before, nothing is left hidden (restored in a `finally`), and
 * what a battle looks like from its first shown frame is the same.
 *
 * Game case: both (shared presentation plumbing).
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
  type Texture,
  type Object3D,
  type WebGLRenderTarget,
} from 'three';

import { fenceContext, gpuSettled, uploadTextures, type Part } from './warmupPacing.ts';
export { gpuSettled } from './warmupPacing.ts';

/** The slice of `engine/Renderer.ts` this needs. */
export interface WarmupRenderer {
  readonly renderer: {
    getRenderTarget(): WebGLRenderTarget | null;
    setRenderTarget(target: WebGLRenderTarget | null): void;
    compileAsync(scene: Object3D, camera: Camera): Promise<unknown>;
    /** The raw WebGL render, used by {@link drawSlicedOffscreen} only (a stand-in without it has nothing to warm that way). */
    render?(scene: Object3D, camera: Camera): void;
    /** {@link drawSlicedOffscreen} only: the texture upload of one texture, and the GL context its fences are made on (a stand-in without them is drawn as before). */
    initTexture?(texture: Texture): void;
    getContext?(): unknown;
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
      await drawSliced(r, scene);
    } catch {
      /* the loop's own first frame draws it instead */
    }
  }
  return { ms: Math.round(performance.now() - t0), finished };
}

/** Longest to wait for a frame between slices (a hidden page may never run `requestAnimationFrame`). */
const SLICE_FRAME_MS = 120;
/** At most this many slices; the final complete draw takes whatever is left. */
const MAX_SLICES = 14;


function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const go = (): void => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
    setTimeout(go, SLICE_FRAME_MS);
  });
}

/** The program family a drawable belongs to, as far as three keys one: the material's type and defines, the shadow flags and, for a custom shader, its source's size. */
export function programFamily(o: Part): string {
  const m = (Array.isArray(o.material) ? o.material[0] : o.material) as (Material & { defines?: Record<string, unknown>; fragmentShader?: string; vertexShader?: string }) | undefined;
  if (!m) return '?';
  const flags = o as Object3D & { receiveShadow?: boolean; castShadow?: boolean; isInstancedMesh?: boolean; isPoints?: boolean };
  return [
    m.type,
    m.defines ? Object.keys(m.defines).sort().join(',') : '',
    m.fragmentShader ? `${m.vertexShader?.length ?? 0}/${m.fragmentShader.length}` : '',
    flags.receiveShadow ? 'rs' : '',
    flags.castShadow ? 'cs' : '',
    flags.isInstancedMesh ? 'im' : '',
    flags.isPoints ? 'pt' : '',
    m.transparent ? 'tr' : '',
  ].join('|');
}

/**
 * Draw the field once per program family, a frame apart, then once complete. The field is not shown yet (the caller sets `fieldShown` after), so hiding a drawable for
 * one synchronous draw is invisible to the player and to every other piece of code (JavaScript does not interleave), and each slice puts the visibility back before it waits.
 */
export async function drawSliced(r: WarmupRenderer, scene: Scene): Promise<void> {
  if (!r.render) return;
  await sliceDraw(scene, () => r.render!(scene, r.camera));
}

/**
 * Release 62 (PR-0481, the conference demo): the same slices, drawn into the composer's own buffer and never the screen, for a scene that is built and kept behind the picker
 * (`app/demo/demoWarm.ts`). The target is the one the battle's scene pass draws into (the same colour space, so the same programs); the post chain is not run and nothing reaches the canvas.
 */
export async function drawSlicedOffscreen(r: WarmupRenderer, scene: Scene): Promise<void> {
  const gl = r.renderer;
  const target = r.composer?.readBuffer;
  if (typeof gl?.render !== 'function' || !target) return;
  const ctx = fenceContext(gl.getContext?.());
  const uploaded = new WeakSet<object>();
  await sliceDraw(
    scene,
    () => {
      const previous = gl.getRenderTarget();
      try {
        gl.setRenderTarget(target);
        gl.render!(scene, r.camera);
      } finally {
        gl.setRenderTarget(previous);
      }
    },
    {
      // r63-play (the overnight fix of the skeptic's M1; both games). Measured behind the title in headless GPU Chromium, each family's first draw stopped the page for 95 to 370 ms: a texture
      // upload (up to 80 ms for a figure's, 293 ms for a 5376 x 3072 backdrop master: one call each) and then the next family's first use of its program, whose log query waits in the GPU process
      // for the executables the draw before it was still building. The textures go up one at a time (a task each, none sharing a task with a draw), and after each draw the page waits on a fence
      // (a poll that does not block) before it touches the next program, so the stalls stay in the GPU process and the page keeps running. The same programs are built, the same textures uploaded.
      before: (members) => uploadTextures(gl, members, uploaded),
      after: ctx ? () => gpuSettled(ctx) : undefined,
    },
  );
}

/** What a paced slice does around its draw (the offscreen warm only): before it, with the family's drawables; after it, before the frame wait. */
interface SliceHooks {
  before?: (members: readonly Part[]) => Promise<void>;
  after?: (() => Promise<void>) | undefined;
}

/** Draw the scene once per program family (the others hidden for that draw), a frame apart, then once complete: `draw` is one render. */
async function sliceDraw(scene: Scene, draw: () => void, hooks: SliceHooks = {}): Promise<void> {
  const parts: Part[] = [];
  scene.traverse((o) => {
    if (o.visible && (o as Part).material) parts.push(o as Part);
  });
  const families = new Map<string, Part[]>();
  for (const o of parts) {
    const key = programFamily(o);
    const list = families.get(key);
    if (list) list.push(o);
    else families.set(key, [o]);
  }
  if (families.size > 1) {
    let slices = 0;
    for (const members of families.values()) {
      if (slices++ >= MAX_SLICES) break;
      const mine = new Set(members);
      if (hooks.before) await hooks.before(members);
      const hidden = parts.filter((o) => !mine.has(o));
      for (const o of hidden) o.visible = false;
      try {
        draw();
      } finally {
        for (const o of hidden) o.visible = true;
      }
      if (hooks.after) await hooks.after();
      await nextFrame();
    }
  }
  draw();
  if (hooks.after) await hooks.after();
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

/** Passes of the post chain that have already been compiled (a pass the demo look adds after the first battle is compiled the first time a battle wants it). */
const warmedPasses = new WeakSet<object>();

/**
 * The composer's own passes (bloom, tilt-shift, grade, and the demo look's when a look is on), each once.
 *
 * Nothing draws through the composer before the first battle (the title, the
 * board and prep are DOM), so its dozen programs used to compile inside the
 * first battle frame, under the battle-start card. Each pass material goes on
 * a stand-in quad and compiles with the target that pass really draws into:
 * the composer's buffer, or the screen for the last pass.
 */
function postChainOnce(r: WarmupRenderer): Promise<unknown>[] {
  const passes = (r.composer.passes ?? []).filter((p) => !warmedPasses.has(p));
  if (!passes.length) return [];
  for (const p of passes) warmedPasses.add(p);
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
