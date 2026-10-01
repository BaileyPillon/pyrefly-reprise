/**
 * **A plate's bottom edge carried below the frame** (VP-1001-30, FFX-2 only: Chapter XI).
 *
 * The Road to the Farplane's plate is framed so its upper rows sit exactly where the approved
 * Farplane plate's do (`road-to-the-farplane.ts`, width 100 at z -48, centre 8.8), which leaves its
 * bottom edge at y -19.8 while the resting camera's lowest ray meets the plate's plane near -21.1
 * (and the party rig's near -21.6): a flat violet band of scene background 25 to 30 px tall under
 * the stone at 1600x900. Moving or scaling the plate would move the approved sky.
 *
 * The skirt is a strip of the same painting directly under it, its rows mirrored about the bottom
 * edge, so the stone's own cracks and colour continue past the frame and the seam is the plate's
 * own last row. Nothing in the painting changes. Named as a backdrop layer, so eye candy A's
 * depth of field treats it as part of the plate.
 */
import { BufferAttribute, Mesh, MeshBasicMaterial, PlaneGeometry, type Group, type Texture } from 'three';

export interface SkirtSpec {
  /** The plate's width and height in world units, its centre's y and its z. */
  width: number;
  height: number;
  centreY: number;
  z: number;
  /** How far below the plate's bottom edge the skirt reaches, world units. */
  depth: number;
}

/** The skirt's geometry: a strip under the plate whose UVs mirror its bottom rows. Pure (no GPU). */
export function skirtGeometry(spec: SkirtSpec): PlaneGeometry {
  const g = new PlaneGeometry(spec.width, spec.depth);
  const uv = g.getAttribute('uv') as BufferAttribute;
  const reach = Math.min(1, spec.depth / spec.height);
  // PlaneGeometry's vertices: top row first (v = 1), then the bottom row (v = 0). The skirt's top
  // meets the plate's bottom edge (v = 0 in the painting) and runs down into rows above it again.
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? 0 : reach);
  uv.needsUpdate = true;
  return g;
}

/** Hang the skirt under the plate in `group`, sharing the plate's texture. Returns its disposer. */
export function addPlateSkirt(group: Group, map: Texture, spec: SkirtSpec): () => void {
  const geometry = skirtGeometry(spec);
  const material = new MeshBasicMaterial({ map, fog: false, depthWrite: false, toneMapped: false });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'backdrop-layer-skirt';
  mesh.position.set(0, spec.centreY - spec.height / 2 - spec.depth / 2, spec.z);
  mesh.renderOrder = -90;
  group.add(mesh);
  return () => {
    mesh.removeFromParent();
    geometry.dispose();
    material.dispose();
  };
}

/** The painting texture a `Backdrop` group drew its plate with, if any. */
export function plateTexture(group: Group): Texture | null {
  const main = group.getObjectByName('backdrop-painting') as Mesh | undefined;
  return ((main?.material as MeshBasicMaterial | undefined)?.map as Texture | null | undefined) ?? null;
}
