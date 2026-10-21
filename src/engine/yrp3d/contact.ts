/**
 * **The contact shadow under each figure** (the hidden 3D Bahamut chapter; FFX-2 only): a soft warm-dark disc on the floor under every figure (the look lab's `PARAMS.contact`), pushed a little away from the key light, so a figure
 * stands on the wet floor instead of floating above it. A radial alpha texture on a flat plane, drawn as a normal transparent mesh; no shadow map. It follows the figure's world position every frame (the presenter's lunge and
 * hop move the figure, and the disc goes with it), shrinks to nothing with the figure's opacity, and is hidden with it.
 *
 * {@link discAlpha} is the pure falloff (a test reads it); {@link discTexture} bakes it into a `DataTexture`.
 */

import { DataTexture, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, RGBAFormat, UnsignedByteType, Vector3, type Object3D } from 'three';
import { frameALights } from './look.ts';
import { PARTY_HEIGHT, YRP_BOSS_ID, type YrpId } from './layout.ts';
import { CONTACT } from './wetFloorShader.ts';

/** The disc's opacity at `d`, its distance from the centre as a share of its radius (0 centre, 1 edge): a power falloff, 1 at the centre, 0 at and beyond the edge. */
export function discAlpha(d: number): number {
  return Math.pow(Math.min(1, Math.max(0, 1 - d)), 1.6);
}

/** The disc's texture: white with the falloff in alpha, `size` square, linearly filtered. Free it with `dispose()`. */
export function discTexture(size = 128): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = ((x + 0.5) / size) * 2 - 1;
      const dy = ((y + 0.5) / size) * 2 - 1;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(discAlpha(Math.hypot(dx, dy)) * 255);
    }
  }
  const t = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  t.magFilter = t.minFilter = LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/** The disc's radius for a figure of `height` metres: `CONTACT.radius` per party height, three times that for the boss. */
export function discRadius(id: YrpId, height: number): number {
  return ((CONTACT.radius * height) / PARTY_HEIGHT) * (id === YRP_BOSS_ID ? CONTACT.bossRadius : 1);
}

/** One disc per figure, parented to a group. */
export class ContactShadows {
  private readonly discs = new Map<YrpId, Mesh>();
  private readonly texture = discTexture();
  private readonly geometry = new PlaneGeometry(2, 2);
  private readonly away: { x: number; z: number };
  private readonly at = new Vector3();

  constructor(parent: Object3D, ids: readonly YrpId[]) {
    const key = frameALights().dir.key;
    this.away = { x: -key[0] * CONTACT.push * 2, z: -key[2] * CONTACT.push * 2 }; // pushed away from the key
    for (const id of ids) {
      const mesh = new Mesh(this.geometry, new MeshBasicMaterial({ map: this.texture, color: CONTACT.colour, transparent: true, opacity: CONTACT.opacity, depthWrite: false, toneMapped: false }));
      mesh.name = `yrp-contact-${id}`;
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = -49; // just after the floor
      mesh.frustumCulled = false;
      parent.add(mesh);
      this.discs.set(id, mesh);
    }
  }

  /** The disc of `id` (a test's read). */
  get(id: YrpId): Mesh | undefined {
    return this.discs.get(id);
  }

  /** Put `id`'s disc under the figure whose root is `root` (its world position), sized to `height`, as opaque as `opacity` (0..1) of the usual, hidden when the figure is. */
  follow(id: YrpId, root: Object3D, height: number, opacity = 1): void {
    const mesh = this.discs.get(id);
    if (!mesh) return;
    root.getWorldPosition(this.at);
    const r = discRadius(id, height);
    mesh.scale.set(r, r, 1);
    mesh.position.set(this.at.x + this.away.x, CONTACT.lift, this.at.z + this.away.z);
    mesh.visible = root.visible && opacity > 0.002;
    (mesh.material as MeshBasicMaterial).opacity = CONTACT.opacity * Math.min(1, Math.max(0, opacity));
  }

  dispose(): void {
    for (const mesh of this.discs.values()) {
      (mesh.material as MeshBasicMaterial).dispose();
      mesh.removeFromParent();
    }
    this.discs.clear();
    this.geometry.dispose();
    this.texture.dispose();
  }
}
