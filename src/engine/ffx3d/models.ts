/**
 * **Bailey's own converted FFX models, as three.js objects** (the hidden Fayth chapter's `ffx` skin; `docs/plans/fayth-3d.md`). Local only: the files are his copy of the game, converted on his PC to glTF binary,
 * served read-only by the dev server (`tools/vite-ffx-local.mjs`, `./localAssets.ts`) and loaded here. Nothing in this module is reachable from a production build: the scene reaches it through a dynamic
 * `import()` inside `import.meta.env.DEV`, and it loads nothing until the probe has found the folder.
 *
 * ## What the files are (converter notes: `D:\Tools\ffx-parity\assets\runtime\_checks\AXES.md`)
 *
 * - Every `.glb` is already rotated from FFX's frame to Y up (`(x, -y, -z)`, `./ffxWorld.ts`), so it loads unchanged and **its characters face +Z**. Units are FFX's own; nothing was rescaled.
 *   The game draws each file at a factor of its own (the stage x10, Evrae x4, the party x1): it is in the file (`scenes[0].extras.ffx.runtimeScale`, which three.js puts in `scene.userData`) and applied here to the
 *   model's root, together with {@link FFX_UNIT} that maps FFX units to the world. A model's root is therefore **in world units**, facing +Z, standing at its own origin.
 * - `<name>.glb` is the bind pose (a T-pose); `<name>-idle0.glb` is the same model posed at frame 0 of its battle idle, which is what a standing character looks like, so that is what the skin loads, and it
 *   falls back to the bind pose when the posed file is not there.
 * - A weapon is a file of its own (`weapons.json`: the file, the bone of the actor to put it under, and the local turn the root needs: the same half turn about X the actors carry).
 *
 * ## The material (chosen by looking, `docs/handoff/fayth-3d.md` phase 3)
 *
 * Every material is rebuilt as an **unlit `MeshBasicMaterial`**: the diffuse texture and, where the file has them, the vertex colours, cut out by `alphaTest` where the file asks for a mask, double-sided where it says so,
 * and **not fogged** (the scene's fog is tuned for the painted world's units). The game's own shader lights a character with one soft directional light and the HD stage with baked vertex colour; the texture is
 * already shaded by hand, so unlit is the faithful first answer and the one that cannot go dark in our lights. A lit look is a later question for Bailey (`docs/plans/fayth-3d.md`, phase 5).
 *
 * Game case: FFX only (the files are FFX's).
 */

import { Color, DoubleSide, Group, Mesh, MeshBasicMaterial, SkinnedMesh, type BufferGeometry, type Material, type Object3D, type Texture } from 'three';
import { FFX_UNIT } from './ffxWorld.ts';
import { ffxLocalUrl, type FfxLocalManifest } from './localAssets.ts';

/** One model: a root in world units that an actor can carry, and what the skin needs to fade and free it. */
export interface FfxModel {
  readonly id: string;
  /** Scaled to the world, facing +Z, standing at its own origin: parent it to the actor and turn it with `rotation.y`. */
  readonly root: Group;
  /** How far its highest point stands above its origin in the idle pose, world units (the actor's height for the HUD's head anchors). */
  readonly height: number;
  /** 1 is solid; below that every material is drawn blended at that opacity (a range shift's fade, a KO's). */
  setOpacity(alpha: number): void;
  dispose(): void;
}

/** The stage: the Fahrenheit, scaled to the world, and the sky bowl the skin keeps on the camera. */
export interface FfxStageModel {
  readonly root: Group;
  /** The vertex-coloured sky bowl (`sky` in the file), or null. It is meant to follow the camera. */
  readonly sky: Object3D | null;
  dispose(): void;
}

export interface FfxModels {
  readonly stage: FfxStageModel | null;
  /** By combatant id: only the actors whose files loaded. */
  readonly actors: Readonly<Record<string, FfxModel>>;
  /** What did not load, in words, for the log. */
  readonly problems: readonly string[];
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Sidecars and file names (pure)
// ---------------------------------------------------------------------------

/** `evrae/tidus.glb` to `evrae/tidus-idle0.glb`: the same model in its idle pose. */
export function idleFileOf(file: string): string {
  return file.replace(/\.glb$/i, '-idle0.glb');
}

/** The folder part of a manifest path with a trailing slash (`evrae/`), or nothing. */
export function folderOf(file: string): string {
  const i = file.lastIndexOf('/');
  return i < 0 ? '' : file.slice(0, i + 1);
}

/** One weapon, as the converter's `weapons.json` states it. */
export interface WeaponEntry {
  readonly file: string;
  /** The actor's bone to put the weapon under (`SkeletonNode_50`). */
  readonly attachNode: string;
  /** The weapon root's local rotation, `[x, y, z, w]`. */
  readonly rotation: readonly [number, number, number, number];
  readonly translation: readonly [number, number, number];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumbers = (v: unknown, n: number): v is number[] => Array.isArray(v) && v.length === n && v.every((x) => typeof x === 'number' && Number.isFinite(x));

/** The weapons by combatant id. An entry that is not of the right shape is dropped (that actor goes unarmed); the rest are kept. */
export function parseWeapons(raw: unknown): Record<string, WeaponEntry> {
  const out: Record<string, WeaponEntry> = {};
  if (!isRecord(raw)) return out;
  for (const [id, entry] of Object.entries(raw)) {
    if (!isRecord(entry)) continue;
    const { file, attachNode, attachLocalRotationQuat, attachLocalTranslation } = entry;
    if (typeof file !== 'string' || file === '' || typeof attachNode !== 'string' || attachNode === '') continue;
    const rotation = attachLocalRotationQuat === undefined ? [1, 0, 0, 0] : attachLocalRotationQuat; // the half turn about X is the converter's rule for every weapon
    const translation = attachLocalTranslation === undefined ? [0, 0, 0] : attachLocalTranslation;
    if (!isNumbers(rotation, 4) || !isNumbers(translation, 3)) continue;
    out[id] = { file, attachNode, rotation: [rotation[0]!, rotation[1]!, rotation[2]!, rotation[3]!], translation: [translation[0]!, translation[1]!, translation[2]!] };
  }
  return out;
}

/**
 * How far the highest point of each model stands above its origin in the idle pose, by combatant id, in FFX units (`poses.json`: `{ "<id>-idle0": { height, bbox_max: [x, y, z] } }`): `bbox_max`'s y, else `height`.
 * A party member's origin is at its feet, so this is its height; Evrae's origin is mid-body (its box runs from -14.6 below it to 19.6 above), so this is the head anchor's height, not the creature's size.
 * Anything of another shape is left out.
 */
export function parsePoseHeights(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(raw)) return out;
  const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  for (const [key, entry] of Object.entries(raw)) {
    const m = /^(.+)-idle0$/.exec(key);
    if (!m || !isRecord(entry)) continue;
    const top = Array.isArray(entry['bbox_max']) ? entry['bbox_max'][1] : undefined;
    const tall = positive(top) ? top : entry['height'];
    if (positive(tall)) out[m[1]!] = tall;
  }
  return out;
}

/** The factor the game draws a file at, from the scene extras `three` keeps in `userData` (`{ ffx: { runtimeScale } }`); 1 when it says nothing sensible. */
export function runtimeScaleOf(userData: unknown): number {
  const ffx = isRecord(userData) ? userData['ffx'] : undefined;
  const scale = isRecord(ffx) ? ffx['runtimeScale'] : undefined;
  return typeof scale === 'number' && Number.isFinite(scale) && scale > 0 ? scale : 1;
}

// ---------------------------------------------------------------------------
// Materials and disposal
// ---------------------------------------------------------------------------

/**
 * The unlit material for a loaded one: the diffuse map and tint, vertex colours when the mesh has them, the file's own cut-out threshold and sidedness, no fog. A material that is blended in the file stays blended and
 * does not write depth. Reads only the fields a glTF material has, so it takes the loader's `MeshStandardMaterial` and nothing else is needed.
 */
export function unlitMaterial(src: Material): MeshBasicMaterial {
  const s = src as Material & { map?: Texture | null; color?: Color };
  const material = new MeshBasicMaterial({
    name: src.name,
    map: s.map ?? null,
    color: s.color ? s.color.clone() : new Color(0xffffff),
    vertexColors: src.vertexColors,
    side: src.side === DoubleSide ? DoubleSide : src.side,
    alphaTest: src.alphaTest,
    transparent: src.transparent,
    opacity: src.opacity,
    depthWrite: src.depthWrite,
    fog: false,
  });
  material.userData['baseTransparent'] = src.transparent;
  if (material.map) material.map.anisotropy = 8; // the renderer clamps it to what the card has
  return material;
}

/** Every mesh below `root` takes the unlit material; returns what the caller must free later. Skinned meshes are never culled (their box is the bind pose's). */
function unlit(root: Object3D): { materials: MeshBasicMaterial[]; geometries: BufferGeometry[]; textures: Texture[] } {
  const swapped = new Map<Material, MeshBasicMaterial>();
  const geometries = new Set<BufferGeometry>();
  const textures = new Set<Texture>();
  const swap = (m: Material): MeshBasicMaterial => {
    let made = swapped.get(m);
    if (!made) {
      made = unlitMaterial(m);
      swapped.set(m, made);
      if (made.map) textures.add(made.map);
      m.dispose(); // the loader's material only; its texture lives on in the new one
    }
    return made;
  };
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material as Material);
    o.castShadow = false;
    o.receiveShadow = false;
    if (o instanceof SkinnedMesh) o.frustumCulled = false;
    geometries.add(o.geometry);
  });
  return { materials: [...new Set(swapped.values())], geometries: [...geometries], textures: [...textures] };
}

const freeAll = (parts: { materials: MeshBasicMaterial[]; geometries: BufferGeometry[]; textures: Texture[] }): void => {
  for (const g of parts.geometries) g.dispose();
  for (const m of parts.materials) m.dispose();
  for (const t of parts.textures) t.dispose();
};

/** What {@link shapeStage} is told: which meshes to draw, which of them to mirror in y, and which are the sky. Each is tested against a mesh's own name. */
export interface StageParts {
  /** Drawn and mirrored in y (`scale.y = -1` about the stage's origin). */
  readonly flipped: readonly RegExp[];
  /** Drawn as they are, and handed back as the sky. */
  readonly sky: readonly RegExp[];
}

/**
 * Keep only the parts of the converted stage the battle draws (`FFX_STAGE_PARTS`): the listed meshes are shown (the `flipped` ones mirrored in y), every other mesh is hidden, not removed. Returns how many
 * meshes are drawn, how many of those were mirrored, and the sky's meshes. Pure over the object graph: no renderer needed.
 */
export function shapeStage(root: Object3D, parts: StageParts): { drawn: number; flipped: number; sky: Mesh[] } {
  let drawn = 0;
  let flipped = 0;
  const sky: Mesh[] = [];
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const flip = parts.flipped.some((re) => re.test(o.name));
    const isSky = parts.sky.some((re) => re.test(o.name));
    o.visible = flip || isSky;
    if (!o.visible) return;
    drawn++;
    if (flip) {
      o.scale.y = -1;
      flipped++;
    }
    if (isSky) sky.push(o);
  });
  return { drawn, flipped, sky };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

type Loader ={ loadAsync(url: string): Promise<{ scene: Group }> };

async function loadJson(path: string): Promise<unknown> {
  try {
    const res = await fetch(ffxLocalUrl(path), { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function loadScene(loader: Loader, path: string): Promise<Group> {
  return (await loader.loadAsync(ffxLocalUrl(path))).scene;
}

/** The model of one actor, posed, with its weapon in hand when it has one. Throws when the file itself will not load. */
async function loadActor(loader: Loader, id: string, file: string, heights: Record<string, number>, weapon: WeaponEntry | undefined, problems: string[]): Promise<FfxModel> {
  let scene: Group;
  try {
    scene = await loadScene(loader, idleFileOf(file));
  } catch {
    scene = await loadScene(loader, file); // no posed file: the bind pose, which still stands
    problems.push(`${id}: no idle pose file, using the bind pose`);
  }
  const scale = runtimeScaleOf(scene.userData) * FFX_UNIT;
  const root = new Group();
  root.name = `ffx-${id}`;
  root.add(scene);
  root.scale.setScalar(scale);
  const parts = unlit(scene);
  if (weapon) {
    try {
      const held = await loadScene(loader, weapon.file);
      const bone = scene.getObjectByName(weapon.attachNode);
      if (!bone) throw new Error(`no bone ${weapon.attachNode}`);
      held.quaternion.fromArray(weapon.rotation);
      held.position.fromArray(weapon.translation);
      bone.add(held);
      const more = unlit(held);
      parts.materials.push(...more.materials);
      parts.geometries.push(...more.geometries);
      parts.textures.push(...more.textures);
    } catch (e) {
      problems.push(`${id}: weapon not attached (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  const tall = heights[id] ?? 0;
  const height = (tall > 0 ? tall : 18) * scale;
  return {
    id,
    root,
    height,
    setOpacity(alpha: number): void {
      const solid = alpha >= 0.999;
      for (const m of parts.materials) {
        m.opacity = solid ? 1 : alpha;
        m.transparent = !solid || m.userData['baseTransparent'] === true;
      }
    },
    dispose(): void {
      root.removeFromParent();
      freeAll(parts);
    },
  };
}

/**
 * Load every model the manifest names: the stage and each actor (and its weapon), in parallel. A file that will not load is left out and said in `problems`; the rest still stands. The glTF loader is imported
 * here, on demand, so a page that never reaches this (production, a dev server without the folder) never loads it.
 */
export async function loadFfxModels(manifest: FfxLocalManifest): Promise<FfxModels> {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader() as unknown as Loader;
  const problems: string[] = [];
  const actorFolder = Object.values(manifest.actors)[0]?.file ?? manifest.stage.file;
  const [weaponsRaw, posesRaw] = await Promise.all([loadJson(`${folderOf(actorFolder)}weapons.json`), loadJson(`${folderOf(actorFolder)}poses.json`)]);
  const weapons = parseWeapons(weaponsRaw);
  const heights = parsePoseHeights(posesRaw);

  const stagePromise = (async (): Promise<FfxStageModel | null> => {
    try {
      const scene = await loadScene(loader, manifest.stage.file);
      const root = new Group();
      root.name = 'ffx-stage';
      root.add(scene);
      root.scale.setScalar(runtimeScaleOf(scene.userData) * FFX_UNIT);
      const parts = unlit(scene);
      return { root, sky: scene.getObjectByName('sky') ?? null, dispose: () => (root.removeFromParent(), freeAll(parts)) };
    } catch (e) {
      problems.push(`stage: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  })();
  const actorPromises = Object.entries(manifest.actors).map(async ([id, actor]): Promise<[string, FfxModel] | null> => {
    try {
      return [id, await loadActor(loader, id, actor.file, heights, weapons[id], problems)];
    } catch (e) {
      problems.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  });
  const [stage, ...made] = await Promise.all([stagePromise, ...actorPromises]);
  const actors: Record<string, FfxModel> = {};
  for (const entry of made as Array<[string, FfxModel] | null>) if (entry) actors[entry[0]] = entry[1];
  return {
    stage,
    actors,
    problems,
    dispose(): void {
      stage?.dispose();
      for (const model of Object.values(actors)) model.dispose();
    },
  };
}
