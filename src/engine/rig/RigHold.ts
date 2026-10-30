/**
 * THE HELD POSE OF A RIG'S CUT (rigs-v3, review fix M1, 2026-10-29; both games, shared plumbing; a rig drawn by pose on the party's side, behind `?partyrigs=`).
 *
 * The painting set never cuts from the standing figure to the lying one: the two paintings CROSS over 75 ms on the capped curve (`PoseBlend.koCross`: the standing one 1 - s, the lying one s squared) under a dust puff.
 * A rig's `ko` key is another pose of the same bones, and the KO run's cut (`RigKoHost.flip`) snapped the bones and swapped the pieces' images on one frame: the head and the pelvis stay continuous (the run lines
 * their heads up before the cut) but the feet, the sword and the hands jump 0.4 to 0.9 of the figure's own height (22 to 43 percent of it, measured on the real `tidus-v2` and `rikku-dark-knight-v2`
 * files; v2 moved them by 0.15 at most), and a revive's head popped 0.38 (21 percent) in one frame.
 *
 * The bones cannot cross (one skeleton, one pose at a time), so the cross is done on the OUTGOING side: at the cut the pieces as they are drawn this instant are copied, vertices and all, onto
 * a frozen second set of meshes that hangs where the plane stood (its position, turn and scale at that frame), and the live pieces go on to the new key. For the length of the cross the frozen
 * set fades out on `koCross`'s outgoing curve while the live pieces come up on the incoming one; then the frozen set is gone. The first frame drawn after the cut is the figure of the last frame
 * (outgoing 0.78 for a 75 ms cross at 60 Hz, incoming 0.05), so nothing moves in the frame of the cut that the painting set's cross would not.
 *
 * The meshes and their materials are made once per part and reused (the materials share the actor's uniform cells by reference, as the variant ghost's do, so a flash, a tint, a dim or a dissolve reaches the
 * held pose exactly as it reaches the live one); each hold copies the part's skinned positions into a geometry of its own and gives it back when the cross ends.
 */
import { BufferAttribute, BufferGeometry, Group, Sphere, Vector3, type Mesh, type ShaderMaterial } from 'three';
import { koCross } from '../PoseBlend.ts';
import { GHOST_DZ, makeGhost, pointGhost, type GhostEnv, type Look, type PartRt } from './RigGhost.ts';
import { HIDDEN } from './RigPartState.ts';

interface Held {
  mesh: Mesh;
  material: ShaderMaterial;
  /** The frozen copy of the part's skinned positions while a hold runs (given back when it ends). */
  geo: BufferGeometry | null;
  /** True when the part was drawn at the freeze (a hidden part has nothing to hold). */
  on: boolean;
}

export class RigHold {
  /** The share of the live pieces and of the frozen ones that show now (1 and 0 with no hold). */
  kIn = 1;
  kOut = 0;
  private group: Group | null = null;
  private readonly held = new Map<PartRt, Held>();
  private t = 0;
  private ms = 0;

  /** True while a hold is fading. */
  get active(): boolean {
    return this.ms > 0;
  }

  /**
   * Freeze the pieces as drawn now and start the cross, `ms` of real time. Call it BEFORE the key changes (the live pieces' positions are the last frame's skin) and before the plane moves.
   * A hold already running is replaced (the figure drawn now, ghosts and all, is what was seen).
   */
  begin(env: GhostEnv, parts: readonly PartRt[], lookOf: (p: PartRt) => Look, ms: number): void {
    if (!(ms > 0)) return;
    this.end();
    const parent = env.plane.parent;
    if (!parent) return;
    const group = (this.group ??= new Group());
    if (group.parent !== parent) parent.add(group);
    group.name = `${env.plane.name}~held`;
    group.position.copy(env.plane.position);
    group.quaternion.copy(env.plane.quaternion);
    group.scale.copy(env.plane.scale);
    for (const p of parts) {
      let h = this.held.get(p);
      if (!h) {
        const g = makeGhost({ ...env, plane: group }, p);
        h = { mesh: g.mesh, material: g.material, geo: null, on: false };
        this.held.set(p, h);
      }
      h.on = p.state !== HIDDEN && p.mesh.visible;
      h.mesh.visible = false;
      if (!h.on) continue;
      const look = lookOf(p);
      pointGhost(env, h, look);
      const geo = new BufferGeometry();
      geo.setAttribute('position', new BufferAttribute(Float32Array.from(look.pos), 3));
      geo.setAttribute('uv', new BufferAttribute(look.src.uvs, 2));
      geo.setIndex(new BufferAttribute(look.src.triangles, 1));
      geo.boundingSphere = new Sphere(new Vector3(0, 0, 0), 1);
      h.mesh.geometry = geo;
      h.geo = geo;
      h.mesh.renderOrder = p.mesh.renderOrder;
      h.mesh.position.z = p.mesh.position.z - GHOST_DZ;
    }
    this.t = 0;
    this.ms = ms;
    this.kIn = 0;
    this.kOut = 1;
  }

  /** Move the cross on by `realMs` (a hit-stop never freezes a half-mixed pair of figures). */
  advance(realMs: number): void {
    if (this.ms <= 0) return;
    this.t += realMs > 0 && Number.isFinite(realMs) ? realMs / this.ms : 0;
    if (this.t >= 1) {
      this.end();
      return;
    }
    const k = koCross(this.t);
    this.kIn = k.to;
    this.kOut = k.from;
  }

  /** The actor's opacity onto the frozen set (the live pieces get `alpha * kIn` from the figure). */
  apply(alpha: number, on: boolean): void {
    const show = on && this.ms > 0 && this.kOut > 0.001;
    if (this.group) this.group.visible = show;
    for (const h of this.held.values()) {
      h.material.uniforms['opacity']!.value = alpha * this.kOut;
      h.mesh.visible = show && h.on;
    }
  }

  /** Every material of the frozen set (the figure's bloom follows the actor's). */
  materials(): ShaderMaterial[] {
    return [...this.held.values()].map((h) => h.material);
  }

  /** The cross is over (or replaced): the live pieces are whole again and the frozen geometry goes. */
  end(): void {
    this.ms = 0;
    this.t = 0;
    this.kIn = 1;
    this.kOut = 0;
    for (const h of this.held.values()) {
      h.mesh.visible = false;
      h.geo?.dispose();
      h.geo = null;
    }
    if (this.group) this.group.visible = false;
  }

  dispose(): void {
    this.end();
    for (const h of this.held.values()) h.material.dispose();
    this.held.clear();
    this.group?.removeFromParent();
    this.group = null;
  }
}
