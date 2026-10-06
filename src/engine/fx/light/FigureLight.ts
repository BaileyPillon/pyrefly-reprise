import { Color, Group, Matrix4, Vector2, Vector3, type Mesh, type Object3D, type PerspectiveCamera, type Scene, type ShaderMaterial, type Texture } from 'three';
import { eyeCandy } from '../EyeCandy.ts';
import { setMixPatch } from '../mix/patch.ts';
import type { Actor } from '../mix/geometry.ts';
import { backdropMap, buildField, findBackdrop, findKey, newBackdropMap, type BackdropField, type BackdropMap } from './backdropField.ts';
import { lightState, lightStats, tuned } from './lightFlags.ts';
import { patchLight } from './lightShader.ts';
import { makeOverlayGroup, SlotOverlay } from './overlay.ts';
import { PoseLights } from './poseData.ts';
import { atLuma, makeShared, makeSlotCells, pickKeys, writeKeys, writeTune, type Shared, type SlotCells } from './lightCells.ts';
import { ROOMS, type RoomLight } from './rooms.ts';

/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): the per-frame driver. Called by the MAX mix after the rig has placed the camera and
 * before the render; with `?light` absent it is never built, with the look switched to 0 it hands every figure's shader back.
 *
 * Per frame and per painted plane it writes the numbers the injected block (`lightShader.ts`) reads: where the plane sits on
 * the screen, the room's two nearest keys as directions in the PLANE's own axes (so a mirrored plane still lights from the
 * right side of the screen), the blurred backdrop, the pose's normal map and face box. Per scene it builds the backdrop's
 * colour field once and, for a room with no hand-confirmed light (`rooms.ts`), finds a key in it.
 *
 * Presentation only (rule 1); it reads figures and writes their materials' uniforms and its own overlay group, never an actor's
 * state. Game case: both (shared plumbing, the room's light is data); FFX gets the anamorphic streak and FFX-2 the four-point star.
 */

type Slot = { mesh: Mesh; material: ShaderMaterial; pose: string };
type Guts = Actor & { slots?: Slot[]; poses?: Map<string, { url?: string }> };

interface SlotRec {
  mat: ShaderMaterial;
  cells: SlotCells;
  overlay: SlotOverlay;
}

const v3 = new Vector3();
const w3 = new Vector3();
const world = new Matrix4();
const planeSize = new Vector2();
const haloShift = new Vector2();
const haloRing = new Vector2();
const starCol = new Color();
const haloCol = new Color();

export class FigureLight {
  private readonly group: Group = makeOverlayGroup();
  private readonly poses = new PoseLights();
  private readonly preloaded = new WeakSet<object>();
  private readonly recs = new Map<ShaderMaterial, SlotRec>();
  private readonly shared: Shared = makeShared();
  private readonly bmap: BackdropMap = newBackdropMap();
  private field: BackdropField | null = null;
  private backdrop: Mesh | null = null;
  private room: RoomLight | null = null;
  private roomName = '';
  private time = 0;
  private checkBackdrop = 0;
  private cost = 0;
  private costN = 0;

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly game: 'ffx' | 'ffx2',
  ) {
    scene.add(this.group);
  }

  /** The room's light: the hand-confirmed one, else a key found in the backdrop's own colour field. */
  private roomOf(): RoomLight | null {
    const name = this.scene.name;
    if (this.room && name === this.roomName) return this.room;
    const known = ROOMS[name];
    if (known) {
      this.room = known;
    } else if (this.field) {
      const k = findKey(this.field);
      const pal = (this.scene.userData as { backdropPalette?: { sky?: number; ground?: number; bounce?: number } } | undefined)?.backdropPalette;
      this.room = {
        keys: [{ at: k.at, col: k.col, w: 0.9, front: 0.45 }],
        ambient: pal?.sky ?? 0x44507a,
        sky: pal?.sky ?? 0xcfd8ff,
        bounce: pal?.bounce ?? pal?.ground ?? 0xb0b8d0,
        halo: 0.5,
        wrap: 1,
      };
    } else {
      return null;
    }
    this.roomName = name;
    lightStats.room = known ? name : `${name} (found)`;
    return this.room;
  }

  private slotRec(mat: ShaderMaterial, renderOrder: number): SlotRec | null {
    let r = this.recs.get(mat);
    if (r) return r;
    if (!patchLight(mat.fragmentShader)) return null; // not the painted figure's shader
    const cells = makeSlotCells(this.shared);
    for (const [k, c] of Object.entries(cells)) mat.uniforms[k] = c;
    setMixPatch(mat, 'light', true);
    const u = mat.uniforms;
    r = { mat, cells, overlay: new SlotOverlay(this.group, u['map']!, u['opacity']!, renderOrder) };
    this.recs.set(mat, r);
    return r;
  }

  /** Hand every figure's shader back (the program compiles as before once no patch is left) and hide the layers. */
  private release(): void {
    for (const r of this.recs.values()) {
      setMixPatch(r.mat, 'light', false);
      for (const k of Object.keys(r.cells)) delete (r.mat.uniforms as Record<string, unknown>)[k];
      r.overlay.dispose(this.group);
    }
    this.recs.clear();
  }

  private visibleChain(o: Object3D): boolean {
    for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  }

  update(dt: number, actors: readonly Actor[]): void {
    const t0 = performance.now();
    const mode = lightState.mode;
    if (mode === 0) {
      if (this.recs.size) this.release();
      this.cost += performance.now() - t0;
      return;
    }
    const sh = this.shared;
    sh.mode.value = mode;
    sh.k.value = lightState.strength;
    this.time += dt;
    sh.time.value = eyeCandy.reduceMotion ? 0 : this.time;
    // The backdrop: its colour field (once per painting) and where it sits on the screen (every frame).
    this.checkBackdrop -= dt;
    if (!this.backdrop || (this.checkBackdrop <= 0 && !this.field)) {
      this.checkBackdrop = 0.5;
      this.backdrop = findBackdrop(this.scene);
    }
    const map = (this.backdrop?.material as { map?: Texture | null } | undefined)?.map ?? null;
    if (map && (!this.field || this.field.from !== map.uuid)) {
      this.field?.tex.dispose();
      this.field = buildField(map);
      this.room = null;
    }
    this.camera.updateMatrixWorld();
    const cam = this.camera;
    const aspect = cam.aspect || 16 / 9;
    if (this.backdrop) {
      backdropMap(this.backdrop, cam, this.bmap);
      sh.backM.value.set(this.bmap.m[0], this.bmap.m[1], this.bmap.m[2], this.bmap.m[3]);
      sh.backO.value.set(this.bmap.o[0], this.bmap.o[1]);
    }
    sh.back.value = this.field?.tex ?? null;
    const room = this.roomOf();
    if (!room) {
      this.cost += performance.now() - t0;
      return;
    }
    const amb = atLuma(room.ambient, 0.5);
    const sky = atLuma(room.sky, 1, 0.45);
    const bounce = atLuma(room.bounce, 1, 0.45);
    let nSlots = 0, nNormals = 0, nDomes = 0, nStars = 0, nHalos = 0;
    const rows: string[] = [];
    const wantRows = this.costN % 30 === 0; // the per-slot report for a capture, a few times a second at most
    for (const a of actors as Guts[]) {
      const slots = a.slots;
      if (!slots) continue;
      // The figure's place on the screen, and the two keys that matter most to it.
      a.getWorldPosition(v3);
      v3.y += a.worldHeight * 0.5;
      v3.project(cam);
      const keys = pickKeys(room.keys, this.bmap, v3.x, v3.y, aspect);
      if (mode === 2 && a.poses && !this.preloaded.has(a)) {
        this.poses.preload([...a.poses.values()].map((p) => p.url));
        if (a.poses.size && this.poses.ready()) this.preloaded.add(a);
      }
      const aws = a.getWorldScale(w3);
      const heightW = a.worldHeight * aws.y;
      for (const s of slots) {
        const rec = this.slotRec(s.material, s.mesh.renderOrder);
        if (!rec) continue;
        const uni = s.material.uniforms;
        const on = this.visibleChain(s.mesh) && ((uni['opacity']?.value as number) ?? 1) > 0.02;
        if (!on) {
          rec.overlay.hide();
          continue;
        }
        nSlots++;
        const c = rec.cells;
        s.mesh.updateWorldMatrix(true, false);
        world.copy(s.mesh.matrixWorld);
        s.mesh.getWorldScale(w3);
        planeSize.set(Math.abs(w3.x), Math.abs(w3.y));
        c.lgSize.value.copy(planeSize);
        c.lgBand.value = tuned('band', 0.034) * heightW;
        // Where the plane sits on the screen: NDC at its uv (0,0), and over one uv step in x and in y.
        for (const [u, v, out] of [[0, 0, c.lgN0.value], [1, 0, c.lgNx.value], [0, 1, c.lgNy.value]] as const) {
          v3.set(u - 0.5, v - 0.5, 0).applyMatrix4(world).project(cam);
          out.set(v3.x, v3.y);
        }
        c.lgNx.value.sub(c.lgN0.value);
        c.lgNy.value.sub(c.lgN0.value);
        writeKeys(c, keys, aspect, amb, sky, bounce);
        // The pose: face box, normal map, stars.
        const url = a.poses?.get(s.pose)?.url ?? a.poseUrls?.[s.pose];
        const tex = (uni['map']?.value as Texture | null) ?? null;
        const pl = this.poses.get(url, tex, mode === 2);
        const h = c.lgHead.value;
        if (pl.head) h.set(pl.head[0], pl.head[1], pl.head[2], pl.head[3]);
        else h.set(0, 0, 0, 0);
        c.lgFace.value = pl.face * tuned('face', 0.9);
        c.lgNormal.value = pl.normal;
        c.lgHasN.value = pl.normal ? 1 : 0;
        if (mode === 2) pl.normal ? nNormals++ : nDomes++;
        if (wantRows) rows.push(`${a.name}:${s.pose}:${pl.key ?? '-'}:n${pl.normal ? 1 : 0}:h${pl.head ? 1 : 0}:g${pl.glints.length}`);
        writeTune(c, mode, room);
        // The layers beyond the silhouette.
        const key = keys[0]!;
        const texH = Math.max(1, (tex?.image as { height?: number } | undefined)?.height ?? 1024);
        const texPerWorld = texH / Math.max(planeSize.y, 1e-3);
        haloShift.set(c.lgDirA.value.x, c.lgDirA.value.y).multiplyScalar(tuned('haloShift', 0.03) * heightW).divide(planeSize);
        haloRing.set(tuned('haloReach', 0.05) * heightW, tuned('haloReach', 0.05) * heightW).divide(planeSize);
        starCol.copy(key.col).multiplyScalar(0.6).addScalar(0.4);
        haloCol.copy(key.col).multiplyScalar(key.w);
        const dissolving = ((uni['dissolve']?.value as number) ?? 0) > 0;
        const r = rec.overlay.write({
          show: true,
          world,
          size: planeSize,
          heightW: heightW * tuned('starSize', 1.35),
          starPts: pl.glints,
          starCol,
          starK: tuned('star', 0.9) * lightState.strength,
          starStyle: this.game === 'ffx2' ? 1 : 0,
          time: sh.time.value,
          haloOn: mode === 3 && !dissolving,
          haloCol,
          haloK: tuned('halo', 0.55) * room.halo * lightState.strength,
          haloShift,
          haloLod: Math.log2(Math.max(1, tuned('haloBlur', 0.045) * heightW * texPerWorld)),
          haloRing,
        });
        if (r.star) nStars++;
        if (r.halo) nHalos++;
      }
    }
    lightStats.figures = actors.length;
    lightStats.slots = nSlots;
    lightStats.normals = nNormals;
    lightStats.domes = nDomes;
    lightStats.stars = nStars;
    lightStats.halos = nHalos;
    if (wantRows) lightStats.rows = rows;
    this.cost += performance.now() - t0;
    this.costN++;
    lightStats.frames = this.costN;
    lightStats.updateMs = this.costN ? +(this.cost / this.costN).toFixed(4) : 0;
  }

  stats(): Record<string, unknown> {
    return { slots: this.recs.size, room: this.roomName, updateMs: this.costN ? +(this.cost / this.costN).toFixed(4) : 0 };
  }

  dispose(): void {
    this.release();
    this.scene.remove(this.group);
    this.field?.tex.dispose();
    this.field = null;
  }
}
