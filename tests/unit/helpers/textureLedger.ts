/**
 * **A ledger of the textures a scene puts on the GPU and the ones it frees, with no GL** (release 75 second code pass, the driver's decision 1; the retry-count tests of the hidden 3D chapters:
 * `ffx-retry-leak.test.ts` FFX, `ww3d/retry-leak.test.ts` FFX-2; `yrp3d/retry-leak.test.ts` is the first of the family and keeps its own copy of these).
 *
 * The renderer gives a skinned mesh's `Skeleton` a bone texture on the first draw (`Skeleton.computeBoneTexture`, which needs no context), and everything frees a texture through `Texture.prototype.dispose`
 * (a material's map, `Skeleton.dispose`). So a test can "draw" a model by hand, count what it made, run the teardown and ask which of those are still alive: that is the number `renderer.info.memory.textures`
 * climbs by on a retry when something is not freed.
 */
import { Bone, BoxGeometry, DataTexture, Float32BufferAttribute, Group, MeshStandardMaterial, Skeleton, SkinnedMesh, Texture, Uint16BufferAttribute, type Mesh, type Object3D } from 'three';
import { afterAll, beforeAll, afterEach } from 'vitest';

/** A 2D context that accepts every call (an actor paints a placeholder canvas; jsdom has no canvas), as `skin.test.ts` does. */
export function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return canvas;
      if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
      if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
      if (prop === 'measureText') return () => ({ width: 10 });
      return () => stub;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

/** The textures freed so far (`Texture.prototype.dispose` is spied for the file's tests, and the spy is taken off after them). Call from the top level of a test file. */
export function useTextureLedger(): { readonly freed: ReadonlySet<Texture>; alive(made: Iterable<Texture>): Texture[]; label(t: Texture): string } {
  const freed = new Set<Texture>();
  const realDispose = Texture.prototype.dispose;
  beforeAll(() => {
    Texture.prototype.dispose = function (this: Texture): void {
      freed.add(this);
      realDispose.call(this);
    };
  });
  afterAll(() => {
    Texture.prototype.dispose = realDispose;
  });
  afterEach(() => freed.clear());
  return {
    freed,
    alive: (made) => [...made].filter((t) => !freed.has(t)),
    label: (t) => `${t.constructor.name}:${t.name || t.uuid}`,
  };
}

/** A one-pixel texture. */
export function pixel(name = ''): DataTexture {
  const t = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.name = name;
  t.needsUpdate = true;
  return t;
}

/** Every skinned mesh at or below `root`. */
export function skinnedUnder(root: Object3D): SkinnedMesh[] {
  const out: SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) out.push(o as SkinnedMesh);
  });
  return out;
}

/** What the renderer does on the first draw of a skinned mesh: its skeleton makes a bone texture. Returns the bone texture of every skinned mesh at or below `root`, one per mesh (meshes of one skeleton repeat it). */
export function drawSkinned(root: Object3D): Texture[] {
  const out: Texture[] = [];
  for (const mesh of skinnedUnder(root)) {
    if (mesh.skeleton.boneTexture === null) mesh.skeleton.computeBoneTexture();
    if (mesh.skeleton.boneTexture) out.push(mesh.skeleton.boneTexture);
  }
  return out;
}

/** The textures a draw of `root` puts on the GPU: each skinned mesh's bone texture, and every texture its materials hold. */
export function onGpu(root: Object3D): Set<Texture> {
  const set = new Set<Texture>(drawSkinned(root));
  root.traverse((o) => {
    const material = (o as Mesh).material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
    if (!material) return;
    for (const m of Array.isArray(material) ? material : [material]) {
      for (const value of Object.values(m)) if ((value as Texture | null)?.isTexture === true && (value as Texture).isRenderTargetTexture !== true) set.add(value as Texture);
    }
  });
  return set;
}

export interface SkinnedFigureOptions {
  /** The names of the skinned meshes (each gets a material with a colour map of its own). */
  readonly parts: readonly string[];
  /** Extra bones, by name, under the root bone (a hand a weapon hangs under). */
  readonly bones?: readonly string[];
  /** Add a normal map to each material too (a file's other maps). */
  readonly normalMaps?: boolean;
}

/** A fake figure file: a bone chain and one skinned mesh per part on ONE skeleton (the way a glTF skin is shared by the meshes that use it), each mesh with a material holding its own colour map. */
export function skinnedFigure(opts: SkinnedFigureOptions): Group {
  const scene = new Group();
  const root = new Bone();
  root.name = 'SkeletonNode_0';
  const bones = [root];
  for (const name of opts.bones ?? []) {
    const bone = new Bone();
    bone.name = name;
    bone.position.set(0.5, 1.2, 0);
    root.add(bone);
    bones.push(bone);
  }
  scene.add(root);
  const skeleton = new Skeleton(bones);
  for (const name of opts.parts) {
    const mesh = skinnedPart(name, opts.normalMaps === true);
    scene.add(mesh);
    mesh.bind(skeleton);
  }
  scene.updateMatrixWorld(true);
  return scene;
}

/** One skinned mesh (a box weighted to the first bone) whose material holds a colour map of its own, and a normal map when asked. Not yet bound to a skeleton. */
export function skinnedPart(name: string, normalMaps = false): SkinnedMesh {
  const geometry = new BoxGeometry(0.6, 2, 0.4);
  geometry.translate(0, 1, 0);
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)), 4));
  const mesh = new SkinnedMesh(geometry, new MeshStandardMaterial({ map: pixel(`${name}-colour`), ...(normalMaps ? { normalMap: pixel(`${name}-normal`) } : {}) }));
  mesh.name = name;
  return mesh;
}
