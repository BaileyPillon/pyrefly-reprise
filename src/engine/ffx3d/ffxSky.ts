/**
 * **FFX's sky, for the hidden Fayth chapter's `ffx` skin** (FFX only; `docs/plans/fayth-3d.md`, phase 5a). Bailey's own converted files, local only, like the models: the stage's sky bowl is in `stage.glb`, the
 * cloud textures were exported beside it (`runtime\evrae\sky\`, `D:\Tools\ffx-parity\assets\tools\phyre2gltf\export_sky.py`). Nothing here is reachable from a production build (the scene reaches it through the
 * DEV-gated dynamic `import()`).
 *
 * ## What the map draws, as read from the files
 *
 * - **The bowl** (`sky` in the stage file; two meshes the map flags as sky): a lower hemisphere, with a horizon band whose alpha runs from 0 to 1, both vertex coloured from light blue at the horizon to navy, and both
 *   drawn with **one texel** of a tile texture. Through the game's shader (`out = tone(texel * vertex colour)`, `tone(c) = 2.1 * min(c, 0.4) + 1.08 * clamp(c, 0.4, 0.58) - 0.47`) that is a dusky blue sky, darker
 *   below. {@link bakeBowl} puts exactly that on the geometry (the first pictures brightened the converter's own colours by a guess).
 * - **The clouds are not in it.** The map lists four effect textures (`vfxtex`): lavender-white clouds, one with transparent holes, and a soft puff. The PS2 captures of the fight show a lavender cloud sea under and
 *   around the airship, which is what these are. The particle data that places them is not read, so {@link FfxSky} lays two world-fixed layers by eye against the capture: the streaky tile as the sea and
 *   the lighter one over it, a little above, so the layers slide against each other as the camera moves. They sit just under the hull, ride the camera horizontally (their texture coordinates are the world's, so they
 *   do not swim) and fade into the bowl before the camera's far plane.
 * - **The cube map** (`skies_cube`) is the environment the hull's shiny materials reflect, not the backdrop: not used here.
 *
 * Game case: FFX only (the files are FFX's).
 */

import { Color, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, NoColorSpace, PlaneGeometry, RepeatWrapping, TextureLoader, Vector2, Vector3, type BufferGeometry, type Object3D, type Texture } from 'three';
import { folderOf } from './models.ts';
import { ffxLocalUrl, isManifestPath, type FfxLocalManifest } from './localAssets.ts';

/** The game's tone curve for a colour channel (`PhyreDefaultLitShader`): a soft-kneed "times two", clamped to 0..1. */
export function tone(c: number): number {
  const out = 2.1 * Math.min(c, 0.4) + 1.08 * Math.min(0.58, Math.max(0.4, c)) - 0.47;
  return Math.min(1, Math.max(0, out));
}

/** What `sky.json` says that the skin needs: the bowl's texel (0 to 255 a channel) and the files of the cloud textures by tag. */
export interface SkySidecar {
  readonly texel: readonly [number, number, number];
  readonly clouds: Readonly<Record<string, string>>;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The sidecar the exporter writes, or null when it is not of that shape: a texel of three channels in 0..255, and cloud files that are safe paths. */
export function parseSkySidecar(raw: unknown): SkySidecar | null {
  if (!isRecord(raw) || !isRecord(raw['bowl']) || !isRecord(raw['clouds'])) return null;
  const texel = raw['bowl']['texel'];
  if (!Array.isArray(texel) || texel.length !== 3 || !texel.every((c) => typeof c === 'number' && Number.isFinite(c) && c >= 0 && c <= 255)) return null;
  const clouds: Record<string, string> = {};
  for (const [tag, entry] of Object.entries(raw['clouds'])) {
    const file = isRecord(entry) ? entry['file'] : undefined;
    if (typeof file === 'string' && isManifestPath(file)) clouds[tag] = file;
  }
  return { texel: [texel[0] as number, texel[1] as number, texel[2] as number], clouds };
}

/**
 * The bowl's vertex colours as the game shades them: each channel `tone(texel * vertex colour)`, the alpha kept. `raw` is the file's vertex colour as `_FFX_COLOR` stores it (the game keeps vertex colours at half
 * range, so a neutral 0.5), `texel` the bowl's one texel in 0..255. Returns a new array of the same length.
 */
export function bowlColours(raw: ArrayLike<number>, texel: readonly [number, number, number]): Float32Array {
  const out = new Float32Array(raw.length);
  for (let i = 0; i + 3 < raw.length; i += 4) {
    for (let c = 0; c < 3; c++) out[i + c] = tone((texel[c]! / 255) * raw[i + c]!);
    out[i + 3] = raw[i + 3]!;
  }
  return out;
}

/**
 * Re-colour the sky bowl: every mesh below `sky` that has the file's raw vertex colour (`_ffx_color`, which three.js's loader lower-cases) gets {@link bowlColours} as its colour, its material takes vertex
 * colours alone (no map, white tint), draws first and writes no depth (it is the backdrop). Returns how many meshes were re-coloured: a bowl with none of the attribute (a re-converted file, a test's stand-in) is left as it was.
 */
export function bakeBowl(sky: Object3D, texel: readonly [number, number, number]): number {
  let baked = 0;
  sky.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry as BufferGeometry;
    const raw = geometry.getAttribute('_ffx_color');
    if (!raw || raw.itemSize !== 4) return;
    const colours = bowlColours(raw.array as ArrayLike<number>, texel);
    geometry.setAttribute('color', new Float32BufferAttribute(colours, 4));
    for (const m of ([] as Array<MeshBasicMaterial>).concat(mesh.material as MeshBasicMaterial | MeshBasicMaterial[])) {
      m.map = null;
      m.color = new Color(1, 1, 1);
      m.vertexColors = true;
      m.depthWrite = false;
      m.needsUpdate = true;
    }
    mesh.renderOrder = -20;
    mesh.frustumCulled = false;
    baked++;
  });
  return baked;
}

// ---------------------------------------------------------------------------
// The cloud sea
// ---------------------------------------------------------------------------

/** One layer of the cloud sea. `[ours]`: placed by eye against the PS2 capture. */
export interface SkyLayer {
  /** Which exported cloud texture (`sky.json`'s tag). */
  readonly tag: string;
  /** World units below the floor the party stands on. */
  readonly below: number;
  /** World units one tile of the texture covers. */
  readonly tile: number;
  /** World units a second the clouds drift, x and z. */
  readonly drift: readonly [number, number];
  readonly opacity: number;
  /** A grey the texture is multiplied by before it is mixed (the tile's whites stay near white). */
  readonly tint: number;
  /** How much of the texture's own colour and contrast shows over {@link SKY_SEA}: 0 is the flat sea colour, 1 the texture. The capture's sea is far softer than the tile. */
  readonly contrast: number;
}

/** The sea's colour as the PS2 capture shows it (display values, measured on the left of `b2_ev76_0.png`: about 150, 158, 184 with little variation). `[ours]` */
export const SKY_SEA: readonly [number, number, number] = [0.59, 0.62, 0.72];

/** The layers, the sea first. */
export const SKY_LAYERS: readonly SkyLayer[] = [
  { tag: '12928', below: 15, tile: 90, drift: [0.8, 0.3], opacity: 1, tint: 1.15, contrast: 0.5 },
  { tag: '12864', below: 10, tile: 60, drift: [-0.5, 0.7], opacity: 0.55, tint: 1.1, contrast: 0.85 },
];

/** Where the layers fade out, world units from the camera: fully there up to `near`, gone at `far` (the camera's far plane is 400). */
export const SKY_FADE = { near: 140, far: 360 } as const;

/** The uniforms a layer's material patch reads and the sea updates. */
interface LayerUniforms {
  offset: { value: Vector2 };
  tile: { value: number };
  tint: { value: number };
  contrast: { value: number };
  sea: { value: Color };
  fadeNear: { value: number };
  fadeFar: { value: number };
}

/**
 * A `MeshBasicMaterial` patched to draw a world-fixed cloud layer: its texture is sampled at the fragment's world x and z (so the clouds do not swim as the camera moves and the plane follows it), mixed toward
 * the sea's own colour (`contrast`), hazier with distance, and faded out between {@link SKY_FADE}'s distances. A built-in material rather than a shader of our own, so the game's colour pipeline (the composer, the grade)
 * treats it as it treats every other surface.
 */
function layerMaterial(map: Texture, uniforms: LayerUniforms, opacity: number): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, side: DoubleSide, fog: false });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vWorld;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWorld;
uniform vec2 offset;
uniform float tile;
uniform float tint;
uniform float contrast;
uniform vec3 sea;
uniform float fadeNear;
uniform float fadeFar;`)
      .replace(
        '#include <map_fragment>',
        `vec4 cloud = texture2D(map, vWorld.xz / tile + offset);
        float reach = 1.0 - smoothstep(fadeNear, fadeFar, distance(vWorld.xz, cameraPosition.xz));
        vec3 mixed = mix(sea, cloud.rgb * tint, contrast);
        diffuseColor = vec4(mix(sea, mixed, mix(0.35, 1.0, reach)), cloud.a * opacity * reach); // far clouds lean toward the sea's own colour: haze`,
      );
  };
  return material;
}

interface Layer {
  readonly spec: SkyLayer;
  readonly mesh: Mesh;
  readonly uniforms: LayerUniforms;
  readonly material: MeshBasicMaterial;
}

export class FfxSky {
  /** Everything the sea is: add it to the scene. */
  readonly group = new Group();
  private readonly layers: Layer[] = [];
  private time = 0;

  /**
   * @param textures the cloud textures by tag; a layer whose texture is missing is left out
   * @param floorY the height of the floor the party stands on, world units
   */
  constructor(textures: Readonly<Record<string, Texture>>, floorY: number, specs: readonly SkyLayer[] = SKY_LAYERS) {
    this.group.name = 'ffx-clouds';
    for (const spec of specs) {
      const map = textures[spec.tag];
      if (!map) continue;
      map.wrapS = map.wrapT = RepeatWrapping;
      map.colorSpace = NoColorSpace; // display values, as the game's textures are
      map.anisotropy = 8;
      const uniforms: LayerUniforms = {
        offset: { value: new Vector2() },
        tile: { value: spec.tile },
        tint: { value: spec.tint },
        contrast: { value: spec.contrast },
        sea: { value: new Color(SKY_SEA[0], SKY_SEA[1], SKY_SEA[2]) }, // display values, like the textures it is mixed with
        fadeNear: { value: SKY_FADE.near },
        fadeFar: { value: SKY_FADE.far },
      };
      const material = layerMaterial(map, uniforms, spec.opacity);
      const mesh = new Mesh(new PlaneGeometry(2 * SKY_FADE.far, 2 * SKY_FADE.far), material);
      mesh.name = `ffx-clouds-${spec.tag}`;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = floorY - spec.below;
      mesh.renderOrder = -10; // before the translucent wing, so the sea shows through it
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.layers.push({ spec, mesh, uniforms, material });
    }
  }

  /** How many layers there are. */
  get count(): number {
    return this.layers.length;
  }

  /** Once a frame: the sea rides the camera horizontally (its texture is the world's, so it stays put) and drifts. */
  update(dt: number, camera: Vector3): void {
    this.time += dt;
    for (const { spec, mesh, uniforms } of this.layers) {
      mesh.position.x = camera.x;
      mesh.position.z = camera.z;
      uniforms.offset.value.set((spec.drift[0] * this.time) / spec.tile, (spec.drift[1] * this.time) / spec.tile);
    }
  }

  dispose(): void {
    for (const { mesh, material } of this.layers) {
      mesh.geometry.dispose();
      material.dispose();
    }
    this.layers.length = 0;
    this.group.removeFromParent();
  }
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export interface SkyAssets {
  readonly sidecar: SkySidecar;
  readonly textures: Readonly<Record<string, Texture>>;
}

/**
 * The sky assets beside the models (`<actor folder>/sky/sky.json` and the clouds it names), or null: no folder, no sidecar, or none of the textures loaded. Never throws; a texture that will not load is left out.
 */
export async function loadSkyAssets(manifest: FfxLocalManifest): Promise<SkyAssets | null> {
  const folder = `${folderOf(Object.values(manifest.actors)[0]?.file ?? manifest.stage.file)}sky/`;
  let raw: unknown = null;
  try {
    const res = await fetch(ffxLocalUrl(`${folder}sky.json`), { cache: 'no-store' });
    raw = res.ok ? await res.json() : null;
  } catch {
    return null;
  }
  const sidecar = parseSkySidecar(raw);
  if (!sidecar) return null;
  const loader = new TextureLoader();
  const textures: Record<string, Texture> = {};
  await Promise.all(
    Object.entries(sidecar.clouds).map(async ([tag, file]) => {
      try {
        textures[tag] = await loader.loadAsync(ffxLocalUrl(`${folder}${file}`));
      } catch {
        /* a texture that will not load costs its layer */
      }
    }),
  );
  return Object.keys(textures).length > 0 ? { sidecar, textures } : null;
}
