/**
 * **Making a loaded model anime** (the hidden anime chapter; FFX-2 only): the cel counterpart of `./toonify.ts`. Every mesh under a root gets the cel material (`./cel.ts`) in place of the file's own, keeping the
 * base-colour map, the side and the transparency (the normal map is dropped: a flat cel read), casts shadows, and is never frustum-culled. A girl (a skinned mesh with `Head` and `head_end` bones) also gets her face
 * mask and smoothed head normals (`./faceMask.ts`) and an inverted-hull outline with a zero width inside the face (`./outline.ts`); Valefor and the weapons get a plain hull (Valefor's bends with her wings).
 *
 * The set it returns is a `ToonSet` (`./toonify.ts`): `driveToon` drives its colour, glow and opacity exactly as it drives a Wind Waker figure's (the hit flash, the cast aura, the stone grey, the fade), and its `extras`
 * fade the hulls with the figure and free them with it. {@link createCelRig} builds the look's uniforms once and the `ModelShading` a model is handed (`./model.ts`).
 *
 * Needs three.js only. Game case: FFX-2 only.
 */

import { BufferAttribute, Vector2, Vector4, type IUniform, type Material, type Mesh, type MeshToonMaterial, type Object3D, type SkinnedMesh, type Texture } from 'three';
import { CEL_LOOKS, createCelUniforms, makeCelMaterial, type CelLook, type CelLookName, type CelOptions, type CelUniforms } from './cel.ts';
import { hullWeights, measureFace } from './faceMask.ts';
import { ANIME_PROP_SPECS, ANIME_WEAPON_SCALE } from './animeLayout.ts';
import type { WwId } from './layout.ts';
import type { ModelShading } from './model.ts';
import { addOutline, createOutlineUniforms, type OutlineUniforms } from './outline.ts';
import type { ShaderLike } from './toon.ts';
import { withUniforms, type ToonUniforms } from './toon.ts';
import type { Channels, SetExtras, ToonEntry, ToonSet, ToonifyOptions } from './toonify.ts';

type MapKey = 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap' | 'emissiveMap' | 'bumpMap' | 'displacementMap';
const UNREAD_MAPS: readonly MapKey[] = ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];

/** Close the bitmaps of the maps the cel material never reads, so a 4096 px normal map does not sit in memory for nothing. */
function releaseUnread(src: Material): void {
  const m = src as unknown as Partial<Record<MapKey, Texture | null>>;
  for (const k of UNREAD_MAPS) {
    const t = m[k];
    if (t) {
      t.dispose();
      const img = t.image as { close?: () => void } | undefined;
      img?.close?.();
    }
  }
}

/** A look's uniforms and outline, made once and shared by every figure of the scene. */
export interface CelStyle {
  readonly look: CelLook;
  readonly uniforms: CelUniforms;
  /** The outline's uniforms, or null for no outlines (`?outline=0` in the lab). */
  readonly outline: OutlineUniforms | null;
}

export interface CelifyOptions extends ToonifyOptions {
  /** The figure's id: the face fit is the girl's own (`./faceMask.ts` `FACE_FIT`). */
  readonly id?: WwId | string;
}

/** The part of a source material a cel copy keeps. */
interface SourceMaterial {
  map?: Texture | null;
  side?: number;
  transparent?: boolean;
  opacity?: number;
  alphaTest?: number;
}

/** Replace every material under `root` with a cel one over `style`; adds the hulls; returns the set. */
export function celify(root: Object3D, style: CelStyle, opts: CelifyOptions = {}): ToonSet {
  const glow: IUniform<Vector4> = { value: new Vector4(1, 0.78, 0.3, 0) };
  const glowShape: IUniform<Vector2> = { value: new Vector2(0.34, 0.5) };
  const uniforms = withUniforms(style.uniforms as unknown as ToonUniforms, { uToonGlow: glow, uToonGlowShape: glowShape });
  const entries: ToonEntry[] = [];
  const meshes: Mesh[] = [];
  const hulls: Mesh[] = [];
  const made = new Map<Material, MeshToonMaterial>();
  const found: Mesh[] = [];
  root.traverse((o) => {
    if ((o as Mesh).isMesh) found.push(o as Mesh); // collect first: the hulls are added beside the meshes
  });
  for (const mesh of found) {
    meshes.push(mesh);
    mesh.castShadow = opts.cast ?? true;
    mesh.receiveShadow = opts.receive ?? true;
    mesh.frustumCulled = opts.cull === true;
    if (opts.depthMaterial) mesh.customDepthMaterial = opts.depthMaterial;
    const skinned = (mesh as Partial<SkinnedMesh>).isSkinnedMesh === true;
    const face = skinned && opts.id !== undefined ? measureFace(root, mesh as SkinnedMesh, String(opts.id)) : null;
    if (!mesh.geometry.attributes['aFace']) mesh.geometry.setAttribute('aFace', new BufferAttribute(new Float32Array(mesh.geometry.attributes['position']!.count), 1)); // a mesh with no face still reads the attribute
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const out = list.map((src) => {
      let cel = made.get(src);
      if (!cel) {
        const s = src as unknown as SourceMaterial;
        if (s.map) s.map.anisotropy = 8;
        cel = makeCelMaterial(uniforms, {
          map: s.map ?? null,
          ...(s.side !== undefined ? { side: s.side as NonNullable<CelOptions['side']> } : {}),
          transparent: s.transparent ?? false,
          opacity: s.opacity ?? 1,
          alphaTest: s.alphaTest ?? 0,
          ...(opts.cacheKey !== undefined ? { cacheKey: opts.cacheKey } : {}),
          ...(opts.onVertex ? { onVertex: opts.onVertex } : {}),
        });
        releaseUnread(src);
        made.set(src, cel);
        entries.push({ material: cel, base: cel.color.clone() });
      }
      return cel;
    });
    if (style.outline && (face || !skinned)) {
      const hull = addOutline(mesh, style.outline, {
        force: true,
        weights: face ? hullWeights(face.mask, style.look.faceThin) : null,
        normals: face ? face.originalNormals : null,
        extraVertex: opts.onVertex ? hullVertex(opts.onVertex) : null,
      });
      if (hull) hulls.push(hull);
    }
    mesh.material = Array.isArray(mesh.material) ? out : out[0]!;
  }
  const extras: SetExtras = {
    drive(c: Channels): void {
      const fading = c.opacity < 0.999;
      for (const h of hulls) {
        const m = h.material as Material;
        if (m.transparent !== fading || m.opacity !== c.opacity) {
          m.transparent = fading;
          m.opacity = c.opacity;
        }
      }
    },
    dispose(): void {
      for (const h of hulls) {
        h.removeFromParent();
        h.geometry.dispose(); // the hull's geometry is its own (a clone), unlike the file's
        (h.material as Material).dispose();
      }
      hulls.length = 0;
    },
  };
  return { entries, meshes, opacity: 1, glow, glowShape, extras };
}

/**
 * The hull's vertex hook for a figure with a vertex hook of its own (Valefor's wing flap, `./wing.ts`): the same patch the main material takes, then the hull's own normal bent with the wing (the hull pushes along `normal`,
 * which the wing's patch does not bend on a program without skinning).
 */
function hullVertex(onVertex: (shader: ShaderLike) => void): (shader: ShaderLike) => void {
  return (shader) => {
    onVertex(shader);
    shader.vertexShader = shader.vertexShader.replace('vec3 hullN = normal;', () => 'vec3 hullN = wfBendNormal( position, normal );');
  };
}

/** The shading a scene hands its models: the look's uniforms, the `ModelShading` that makes figures and weapons cel, and what to free. */
export interface CelRig {
  readonly look: CelLookName;
  readonly style: CelStyle;
  readonly shading: ModelShading;
  dispose(): void;
}

/** Build the look's uniforms and outline once, and the shading that uses them. `outline` false leaves the figures without hulls. */
export function createCelRig(name: CelLookName, opts: { outline?: boolean } = {}): CelRig {
  const look = CEL_LOOKS[name];
  const uniforms = createCelUniforms(look);
  const outline = opts.outline === false ? null : createOutlineUniforms(look.outline);
  const style: CelStyle = { look, uniforms, outline };
  const shading: ModelShading = {
    figure: (scene, id, o) => celify(scene, style, { ...o, id }),
    props: { specs: ANIME_PROP_SPECS, swapScale: ANIME_WEAPON_SCALE, shade: (object) => void celify(object, style, { receive: false }) },
  };
  return {
    look: name,
    style,
    shading,
    dispose(): void {
      (uniforms.uARamp.value as Texture).dispose();
    },
  };
}
