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

import type { BattleState } from '../battle/common/types.ts';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  type Camera,
  type Object3D,
  type Texture,
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
  /**
   * The ring: `ground` lies flat on the floor (a foot), otherwise it stands
   * upright facing the camera. `squash` flattens an upright ring vertically
   * (1 = round; Vegnagun's colossus Bulwarks use {@link GROUND_RING_SQUASH},
   * the look of the picked frame).
   */
  ring: { radius: number; ground: boolean; squash?: number };
}

/** A part hung in the air relative to its parent's feet, typically off-frame (the Nodes). */
export interface OverheadAnchor {
  mode: 'overhead';
  /** World offset from the parent's position. None of these numbers is game data. */
  offset: [dx: number, y: number, dz: number];
  /**
   * **A ring flat on the floor at the anchor** (FFX only: the hidden Spectral Keeper's glyph platforms; a `decal` painting replaces the ring where the art is installed, r75-boss-art). Omitted, an overhead
   * anchor draws nothing (Vegnagun's Nodes and the Mortiphasm discs are off-frame or painted props). `radius` is in world units; the offset's `y` is the floor.
   * `litFlag` names a battle-state flag (`BattleState.flags`) that turns the ring amber while it is true (the Keeper's lit mines).
   */
  floorRing?: { radius: number; litFlag?: string; decal?: FloorDecal };
}

/** The pictures a floor ring's painting has, one per state. Only `unlit` is needed: it stands for every state the others leave out. */
export type DecalState = 'unlit' | 'occupied' | 'mined';

/**
 * **A painting that replaces a floor ring** (FFX only: the Spectral Keeper's glyph platforms and its aeon rock, r75-boss-art; the paintings are `art/decals/*.png`, square, the glyph's outer circle touching the edges, so the plane is the
 * ring's diameter wide). Each path is an `art/...png` path the stage's loader resolves. While the plain picture has not loaded, or has no file, the ring is drawn as before: a tree without the art plays exactly as it did.
 * `standing` names the battle-state flags that say who stands where (`plat.at.<member>` holds a platform number) and this decal's platform: the `occupied` picture shows while any of them equals it. The `mined` picture shows while the ring's `litFlag` is up.
 */
export interface FloorDecal {
  readonly unlit: string;
  readonly occupied?: string;
  readonly mined?: string;
  readonly standing?: { readonly flagPrefix: string; readonly platform: number };
}

/** Loads one decal painting (`art/...png` path): its texture, or null when the file is absent. Injected by the stage (`BattlePresenterStage.ts`), so this module imports no art loader. */
export type DecalLoader = (path: string) => Promise<Texture | null>;

/** Which of a decal's pictures shows: the mine's while the ring is lit, else the occupied one while somebody stands on the platform, else the plain one. Pure. */
export function decalStateOf(flags: Readonly<Record<string, unknown>> | undefined, floorRing: { litFlag?: string; decal?: FloorDecal }): DecalState {
  if (!flags) return 'unlit';
  if (floorRing.litFlag !== undefined && flags[floorRing.litFlag] === true) return 'mined';
  const at = floorRing.decal?.standing;
  if (at && Object.entries(flags).some(([key, value]) => key.startsWith(at.flagPrefix) && value === at.platform)) return 'occupied';
  return 'unlit';
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

/**
 * How flat a ground ring is drawn (its height over its width on screen). The
 * picked colossus frames (D-228) show the Bulwark rings upright but still at
 * this squash, because the mock stood a ground ring up without resetting it;
 * an upright anchor asks for it with `ring.squash`.
 */
export const GROUND_RING_SQUASH = 0.46;

/** Violet, the fiend turn-ring colour the C* mock used. */
export const PART_RING_COLOUR = 0xc8a0ff;
/** Amber, a floor ring that is lit (`floorRing.litFlag`: a glyph with a live mine). `[estimate]`, the look is Bailey's to judge. */
export const LIT_RING_COLOUR = 0xffa23a;
const LIT_RING = new Color(LIT_RING_COLOUR);

interface RingEntry {
  mesh: Mesh;
  anchor: PartAnchor;
  /** True for a ring flat on the floor (an on-parent foot ring, or an overhead anchor's floor ring). */
  ground: boolean;
  /** 1 while the part is alive, eased to 0 once it is KO'd. */
  level: number;
  alive: boolean;
  /** 0 to 1: how far the ring has eased to the lit colour (a floor ring whose `litFlag` is true). */
  lit: number;
  litNow: boolean;
  /** The colour has left the violet and is owed a reset once the glow has gone. */
  tinted: boolean;
  /** Which of a decal's pictures the battle state asks for (`decalStateOf`, set by `sync`); only a ring with a decal reads it. */
  want: DecalState;
  /** The painting that stands in for the ring, once its plain picture has loaded (`FloorDecal`); absent until then and for every ring without one. */
  decal?: { mesh: Mesh; maps: Partial<Record<DecalState, Texture>> };
}

/**
 * The persistent rings that mark a figure-less part on its parent (the C* mock):
 * a flat ellipse round a Bulwark's foot, an upright one round a Redoubt's tusk or
 * jaw. Shown while the part is alive; a KO'd part's ring fades out and the
 * parent painting stays.
 */
export class PartRings {
  private readonly rings = new Map<string, RingEntry>();

  constructor(
    private readonly root: Object3D,
    /** Loads a floor decal's painting; none given (the unit tests, a tree with no art), no decal is ever drawn and every ring stays a ring. */
    private readonly loadDecal?: DecalLoader,
  ) {}

  /** Add (or replace) the ring for `id`. An overhead anchor gets one only when it asks for a floor ring (`floorRing`); otherwise it is off-frame. */
  add(id: string, anchor: PartAnchor): void {
    this.remove(id);
    const ground = anchor.mode === 'onParent' ? anchor.ring.ground : anchor.floorRing !== undefined;
    const radius = anchor.mode === 'onParent' ? anchor.ring.radius : anchor.floorRing?.radius;
    if (radius === undefined) return;
    const mat = new MeshBasicMaterial({
      color: PART_RING_COLOUR,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(new RingGeometry(radius * 0.86, radius, 48), mat);
    mesh.name = `part-ring:${id}`;
    mesh.renderOrder = 7;
    if (ground) mesh.rotation.x = -Math.PI / 2;
    this.root.add(mesh);
    const entry: RingEntry = { mesh, anchor, ground, level: 1, alive: true, lit: 0, litNow: false, tinted: false, want: 'unlit' };
    this.rings.set(id, entry);
    const decal = anchor.mode === 'overhead' ? anchor.floorRing?.decal : undefined;
    if (decal && this.loadDecal) void this.attachDecal(id, entry, radius, decal, this.loadDecal);
  }

  /** Load the decal's pictures; when the plain one is there, lay its plane under the ring (the ring then hides). A file that is missing, or a ring removed meanwhile, leaves things as they were. */
  private async attachDecal(id: string, entry: RingEntry, radius: number, decal: FloorDecal, load: DecalLoader): Promise<void> {
    const maps: Partial<Record<DecalState, Texture>> = {};
    for (const state of ['unlit', 'occupied', 'mined'] as const) {
      const path = decal[state];
      if (!path) continue;
      const texture = await Promise.resolve().then(() => load(path)).catch(() => null);
      if (texture) maps[state] = texture;
    }
    if (this.rings.get(id) !== entry || !maps.unlit) return;
    const mat = new MeshBasicMaterial({ map: maps.unlit, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: DoubleSide });
    const mesh = new Mesh(new PlaneGeometry(radius * 2, radius * 2), mat);
    mesh.name = `part-decal:${id}`;
    mesh.renderOrder = 6; // under the ring (7): an amber ring may still be drawn over a decal that has no mine picture
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    this.root.add(mesh);
    entry.decal = { mesh, maps };
  }

  setAlive(id: string, alive: boolean): void {
    const e = this.rings.get(id);
    if (e) e.alive = alive;
  }

  /** Per frame from the stage: whether the part is alive, and whether its floor ring is lit (the anchor's `litFlag` is true in the battle's flags). Inert for a ring with no `litFlag`. */
  sync(id: string, state: Pick<BattleState, 'combatants' | 'flags'> | null | undefined): void {
    const e = this.rings.get(id);
    if (!e) return;
    e.alive = state?.combatants[id]?.alive !== false;
    const floorRing = e.anchor.mode === 'overhead' ? e.anchor.floorRing : undefined;
    const flag = floorRing?.litFlag;
    e.litNow = flag !== undefined && state?.flags[flag] === true;
    if (floorRing?.decal) e.want = decalStateOf(state?.flags, floorRing);
  }

  /** Re-place and fade every ring. `parentOf` returns the live parent, or undefined when it has left. */
  update(dt: number, parentOf: (id: string) => ParentPose | undefined, camera: Camera | null): void {
    for (const [id, e] of this.rings) {
      const parent = parentOf(id);
      const target = e.alive && parent ? 1 : 0;
      const k = Math.min(1, dt * 4);
      e.level += (target - e.level) * k;
      e.lit += ((e.litNow ? 1 : 0) - e.lit) * k;
      const mat = e.mesh.material as MeshBasicMaterial;
      mat.opacity = (0.62 + 0.33 * e.lit) * e.level;
      if (e.lit > 0.001 || e.tinted) {
        // only a lit floor ring ever leaves the violet; when the glow has gone the colour is put back exactly
        mat.color.setHex(PART_RING_COLOUR);
        if (e.lit > 0.001) mat.color.lerp(LIT_RING, e.lit);
        e.tinted = e.lit > 0.001;
      }
      e.mesh.visible = e.level > 0.02 && !!parent;
      const decal = e.decal;
      if (decal) {
        // The painting is the platform now: it takes the state's picture (the plain one stands for a state with none) and fades with the ring. The ring hides, except an amber one over a lit decal that has no mine picture (the rock).
        const dm = decal.mesh.material as MeshBasicMaterial;
        const map = decal.maps[e.want] ?? decal.maps.unlit ?? null;
        if (dm.map !== map) {
          dm.map = map;
          dm.needsUpdate = true;
        }
        dm.opacity = 0.96 * e.level;
        decal.mesh.visible = e.level > 0.02 && !!parent;
        if (!(e.litNow && !decal.maps.mined)) e.mesh.visible = false;
      }
      if (!parent) continue;
      const [x, y, z] = anchorPoint(e.anchor, parent);
      if (e.anchor.mode === 'overhead') {
        // A floor ring on an overhead anchor lies flat and round: the camera's own angle foreshortens it (no extra squash on top).
        e.mesh.position.set(x, y + 0.03, z);
        e.mesh.scale.set(1, 1, 1);
        decal?.mesh.position.set(x, y + 0.02, z);
        continue;
      }
      e.mesh.position.set(x, e.anchor.ring.ground ? parent.y + 0.03 : y, z);
      if (e.anchor.ring.ground) e.mesh.scale.set(1, GROUND_RING_SQUASH, 1);
      else {
        e.mesh.scale.set(1, e.anchor.ring.squash ?? 1, 1);
        if (camera) e.mesh.quaternion.copy(camera.quaternion);
      }
    }
  }

  /** What the debug snapshot and the tests read back. `decal` is there only for a ring whose painting has loaded: the picture it shows and whether it is drawn. */
  snapshot(): Array<{ id: string; visible: boolean; opacity: number; at: [number, number, number]; decal?: { state: DecalState; visible: boolean } }> {
    return [...this.rings.entries()].map(([id, e]) => ({
      id,
      visible: e.mesh.visible,
      opacity: +(e.mesh.material as MeshBasicMaterial).opacity.toFixed(3),
      at: [e.mesh.position.x, e.mesh.position.y, e.mesh.position.z],
      ...(e.decal ? { decal: { state: e.decal.maps[e.want] ? e.want : ('unlit' as const), visible: e.decal.mesh.visible } } : {}),
    }));
  }

  remove(id: string): void {
    const e = this.rings.get(id);
    if (!e) return;
    this.rings.delete(id);
    e.mesh.removeFromParent();
    e.mesh.geometry.dispose();
    (e.mesh.material as MeshBasicMaterial).dispose();
    if (e.decal) {
      e.decal.mesh.removeFromParent();
      e.decal.mesh.geometry.dispose();
      (e.decal.mesh.material as MeshBasicMaterial).dispose(); // the textures belong to the loader's cache and stay
    }
  }

  dispose(): void {
    for (const id of [...this.rings.keys()]) this.remove(id);
  }
}
