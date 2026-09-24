/**
 * Destructible parts that have **no figure of their own**.
 *
 * Vegnagun's Bulwarks sit on the body painting's own legs, its Redoubts on the
 * head painting's tusk and jaw, and its Nodes hang far overhead, off the top of
 * the frame (Bailey's picks Bulwark C*, Redoubt C*, Node C, 2026-09-24, D-044;
 * plan `docs/plans/vegnagun-parts-wiring.md`). None of them gets a painting, so
 * the stage must not draw the hooded-cone placeholder for them (PR-0095). Each
 * still needs a **position**: the target cursor, damage numbers, the turn ring
 * and the selection accent all read one.
 *
 * A scene publishes a table of {@link PartAnchor}s keyed by combatant id. The
 * stage then stages that combatant figure-less, keeps it out of the formation
 * solver and the projected-overlap pass, and re-places it every frame from its
 * parent's live actor, so breathe, sway and a hop carry the ring with them.
 *
 * GAME-AWARE (AGENTS.md rule 14): the plumbing is **both** games and inert for
 * every scene that publishes no table; the only table today is the Farplane's
 * (Chapter 5, **FFX-2 only**).
 *
 * The math here is pure (no DOM, no renderer), so it is unit-tested directly;
 * {@link PartRings} is the small three.js layer the stage drives.
 */

import {
  AdditiveBlending,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  type Camera,
  type Object3D,
} from 'three';

/** Where a part lives on its parent's painting, in the painting's own pixels. */
export interface OnParentAnchor {
  mode: 'onParent';
  /** The ring's centre, `[x, y]` in the parent's idle painting, from its top-left corner as painted. */
  px: [x: number, y: number];
  /**
   * The parent painting's size and feet line (its sidecar). With the live plane
   * the stage maps a pixel through the plane itself; the proportions are the
   * fallback before the painting has loaded, and what the pure tests use.
   */
  paint: { width: number; height: number; baselineY: number; contentTop: number };
  /** The chest point the cursor and the damage numbers aim at, when it differs from the ring. */
  chestPx?: [x: number, y: number];
  /** The ring: `ground` lies flat on the floor (a foot), otherwise it stands upright facing the camera. */
  ring: { radius: number; ground: boolean };
}

/** A part hung in the air relative to its parent's feet, typically off-frame (the Nodes). */
export interface OverheadAnchor {
  mode: 'overhead';
  /** World offset from the parent's position. None of these numbers is game data. */
  offset: [dx: number, y: number, dz: number];
}

export type PartAnchor = OnParentAnchor | OverheadAnchor;

/** A scene's anchors, keyed by combatant id (Right and Left are told apart by id, never by slot). */
export type PartAnchors = Readonly<Record<string, PartAnchor>>;

/** What the anchor math needs to know about the parent actor. */
export interface ParentPose {
  x: number;
  y: number;
  z: number;
  /** World height, feet to top of content (`PaintedActor.height`). */
  height: number;
  /** True when the parent's plane is drawn flipped; `u` then counts from the right. */
  mirrored?: boolean;
  /**
   * The live plane: normalised painting coordinates (`u` from the left, `t`
   * from the top) to a world point. Carries the plane's own offset, mirror,
   * lunge and bob, which the proportional fallback cannot know.
   */
  toWorld?: (u: number, t: number) => [number, number, number];
}

/** How far toward the camera an on-parent ring is pulled, so it draws in front of the painting. */
export const RING_FORWARD = 0.05;

/**
 * The world point an anchored part stands on.
 *
 * `which` picks the ring point (default) or the chest point; an overhead anchor
 * has only one point.
 */
export function anchorPoint(
  anchor: PartAnchor,
  parent: ParentPose,
  which: 'ring' | 'chest' = 'ring',
): [number, number, number] {
  if (anchor.mode === 'overhead') {
    const [dx, y, dz] = anchor.offset;
    return [parent.x + dx, parent.y + y, parent.z + dz];
  }
  const [px, py] = which === 'chest' && anchor.chestPx ? anchor.chestPx : anchor.px;
  const { width: pw, height: ph, baselineY, contentTop } = anchor.paint;
  if (parent.toWorld) {
    const [x, y, z] = parent.toWorld(px / pw, py / ph);
    return [x, y, z + RING_FORWARD];
  }
  const span = Math.max(1, baselineY - contentTop);
  const u = px / pw;
  const v = (baselineY - py) / span;
  const width = (parent.height * pw) / span;
  return [
    parent.x + ((parent.mirrored ? 1 - u : u) - 0.5) * width,
    parent.y + v * parent.height,
    parent.z + RING_FORWARD,
  ];
}

/** The anchor for `id`, or undefined when the scene gave none. */
export function anchorFor(anchors: PartAnchors | undefined, id: string): PartAnchor | undefined {
  return anchors ? anchors[id] : undefined;
}

/** Violet, the fiend turn-ring colour the C* mock used. */
export const PART_RING_COLOUR = 0xc8a0ff;

interface RingEntry {
  mesh: Mesh;
  anchor: OnParentAnchor;
  /** 1 while the part is alive, eased to 0 once it is KO'd. */
  level: number;
  alive: boolean;
}

/**
 * The persistent rings that mark a figure-less part on its parent (the C* mock):
 * a flat ellipse round a Bulwark's foot, an upright one round a Redoubt's tusk or
 * jaw. Shown while the part is alive; a KO'd part's ring fades out and the
 * parent painting stays.
 */
export class PartRings {
  private readonly rings = new Map<string, RingEntry>();

  constructor(private readonly root: Object3D) {}

  /** Add (or replace) the ring for `id`. Overhead anchors get none: they are off-frame. */
  add(id: string, anchor: PartAnchor): void {
    this.remove(id);
    if (anchor.mode !== 'onParent') return;
    const mat = new MeshBasicMaterial({
      color: PART_RING_COLOUR,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const r = anchor.ring.radius;
    const mesh = new Mesh(new RingGeometry(r * 0.86, r, 48), mat);
    mesh.name = `part-ring:${id}`;
    mesh.renderOrder = 7;
    if (anchor.ring.ground) mesh.rotation.x = -Math.PI / 2;
    this.root.add(mesh);
    this.rings.set(id, { mesh, anchor, level: 1, alive: true });
  }

  setAlive(id: string, alive: boolean): void {
    const e = this.rings.get(id);
    if (e) e.alive = alive;
  }

  /** Re-place and fade every ring. `parentOf` returns the live parent, or undefined when it has left. */
  update(dt: number, parentOf: (id: string) => ParentPose | undefined, camera: Camera | null): void {
    for (const [id, e] of this.rings) {
      const parent = parentOf(id);
      const target = e.alive && parent ? 1 : 0;
      const k = Math.min(1, dt * 4);
      e.level += (target - e.level) * k;
      const mat = e.mesh.material as MeshBasicMaterial;
      mat.opacity = 0.62 * e.level;
      e.mesh.visible = e.level > 0.02 && !!parent;
      if (!parent) continue;
      const [x, y, z] = anchorPoint(e.anchor, parent);
      e.mesh.position.set(x, e.anchor.ring.ground ? parent.y + 0.03 : y, z);
      if (e.anchor.ring.ground) e.mesh.scale.set(1, 0.46, 1);
      else if (camera) e.mesh.quaternion.copy(camera.quaternion);
    }
  }

  /** What the debug snapshot and the tests read back. */
  snapshot(): Array<{ id: string; visible: boolean; opacity: number; at: [number, number, number] }> {
    return [...this.rings.entries()].map(([id, e]) => ({
      id,
      visible: e.mesh.visible,
      opacity: +(e.mesh.material as MeshBasicMaterial).opacity.toFixed(3),
      at: [e.mesh.position.x, e.mesh.position.y, e.mesh.position.z],
    }));
  }

  remove(id: string): void {
    const e = this.rings.get(id);
    if (!e) return;
    this.rings.delete(id);
    e.mesh.removeFromParent();
    e.mesh.geometry.dispose();
    (e.mesh.material as MeshBasicMaterial).dispose();
  }

  dispose(): void {
    for (const id of [...this.rings.keys()]) this.remove(id);
  }
}
