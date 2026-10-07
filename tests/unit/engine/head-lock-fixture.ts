/**
 * The fixture of the head-lock tests (`head-lock-actor.test.ts`, `head-lock-actor-edges.test.ts`; D-510, lane r394-headlock; both games).
 *
 * The REAL `PaintedActor` (its sizing, its registration shift, its rest placement of a lying body, its life layer and interim yaw) is built
 * headless with Yuna's real pose records (`docs/target/pose-measure.json`) and her real generated registration rows (FFX; her KO is laid by a
 * synthetic underside, the one thing a PNG would have given), put under real `PerspectiveCamera`s, and every head is read the way the continuity
 * harness reads it (`critic/runner/lib/continuity-pure.mjs`: the plane's four projected corners, the projective map, `headSizePx`), never through
 * the engine's own measure. "Perspective" is the stage-camera number of `docs/handoff/r392-size.md` section 4a: the idle plane's top edge over its
 * bottom edge on screen. The same Yuna with nothing holding her reads x1.041, x1.023 and x0.989 at perspectives 0.98, 1.00 and 1.04 (the evidence:
 * x1.04, x1.03 and x0.97 to 0.985).
 */
import { Matrix4, PerspectiveCamera, Texture } from 'three';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';
import { headSizePx, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import type { PoseMeta, PaintedTexture } from '../../../src/engine/PaintedArt.ts';
import type { PaintedActor as Actor, PaintedActorOptions } from '../../../src/engine/PaintedActor.ts';
import type { HeadBox } from '../../../src/engine/HeadLock.ts';

// a canvas the three side never uploads: the painted stand-ins and the shared noise, blob and ring textures need none in a test
vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

export const { PaintedActor } = await import('../../../src/engine/PaintedActor.ts');
export const { POSE_REGISTRATION } = await import('../../../src/engine/PoseRegistration.ts');
export const { HEAD_BAND, setHeadLockOff } = await import('../../../src/engine/HeadLock.ts');
export const { holdHeads } = await import('../../../src/engine/HeadLockStage.ts');
const { groundHullFromBottoms } = await import('../../../src/engine/PaintedRest.ts');
export type { Actor, HeadBox };

export const W = 1600;
export const H = 900;
/** The check's own tolerance, and what the lock must leave of it: a swap read at 3 percent fails, the lock holds it to a third of one percent. */
export const CHECK = 0.03;
export const HELD = 0.003;
export const PERSPECTIVES = [0.98, 1.0, 1.04];

const record = JSON.parse(readFileSync(resolve(__dirname, '..', '..', '..', 'docs', 'target', 'pose-measure.json'), 'utf8')) as {
  subjects: Record<string, { poses: Record<string, { size: [number, number]; baseline: number; current?: number }> }>;
};

/** Put the kill switch back (every test file's `afterEach`). */
export function reset(): void {
  setHeadLockOff(null);
  vi.restoreAllMocks();
}

// ------------------------------------------------------------------ the figure

/** A lying body's underside: it rises left to right, so the plane is rolled to rest on the edge under its centroid (a real KO is rolled the same way). */
function underside([w, h]: [number, number]): ReturnType<typeof groundHullFromBottoms> {
  const cols = 60;
  const bottoms = Array.from({ length: cols }, (_, i) => Math.round(h * 0.6 + (i / (cols - 1)) * h * 0.38));
  return groundHullFromBottoms(bottoms, { x: w * 0.5, y: h * 0.62 }, w / cols, 1);
}

/**
 * One of a subject's paintings as the loader would hand it: the record's size and baseline, the generated row's scale (a pose the table leaves alone keeps
 * the scale it has, the sidecar's or the KO table's: the record's `current`), its stance, feet row, upright and head box.
 */
export function painting(subject: string, pose: string, over: Partial<PoseMeta> = {}, url = `/art/characters/${subject}/${pose}.png`): PaintedTexture {
  const rec = record.subjects[subject]!.poses[pose]!;
  const row = POSE_REGISTRATION[subject]?.[pose] ?? {};
  const meta: PoseMeta = {
    width: rec.size[0],
    height: rec.size[1],
    baselineY: rec.baseline,
    ...((row.scale ?? rec.current) !== undefined ? { scale: (row.scale ?? rec.current)! } : {}),
    ...(row.feetRow !== undefined ? { anchorY: row.feetRow } : {}),
    ...(row.stanceX !== undefined ? { stanceX: row.stanceX } : {}),
    ...(row.upright ? { upright: true } : {}),
    ...(row.head ? { head: row.head } : {}),
    ...(pose === 'ko' ? { ground: underside(rec.size) ?? undefined } : {}),
    ...over,
  };
  return { texture: new Texture(), meta, placeholder: false, url };
}

export const POSES = ['idle', 'hurt', 'ko', 'victory'] as const;
export type Pose = (typeof POSES)[number];

export interface Build {
  /** Leave the breathing and the sway on (the idle's own life); off by default so a frame is the same frame. */
  alive?: boolean;
  life?: false;
  interimYaw?: false;
  side?: 'party' | 'enemy';
  artFacing?: PaintedActorOptions['artFacing'];
  /** An actor that shifts its poses by hand (FF7's Film set). */
  poseShiftPx?: Record<string, number>;
  over?: Partial<Record<Pose, Partial<PoseMeta>>>;
  urls?: Partial<Record<Pose, string>>;
  placeholder?: Pose[];
}

/** Yuna, as the stage stages her: the party faces +x, a little to the left of the middle. */
export function yuna(b: Build = {}): Actor {
  const actor = new PaintedActor({
    name: 'yuna',
    worldHeight: 1.82,
    side: b.side ?? 'party',
    ...(b.artFacing ? { artFacing: b.artFacing } : {}),
    ...(b.life === false ? { life: false as const } : {}),
    ...(b.interimYaw === false ? { interimYaw: false as const } : {}),
    ...(b.poseShiftPx ? { poseShiftPx: b.poseShiftPx } : {}),
    ...(b.alive ? {} : { breathe: false as const, sway: false as const }),
    shadow: false,
  });
  const poses: Record<string, PaintedTexture> = {};
  for (const p of POSES) {
    const tex = painting('yuna', p, b.over?.[p], b.urls?.[p]);
    poses[p] = b.placeholder?.includes(p) ? { ...tex, placeholder: true } : tex;
  }
  actor.adoptPoses(poses, 'idle');
  actor.position.set(-2, 0, 0);
  return actor;
}

// ------------------------------------------------------------------ the camera and the measure

/** The camera at `y` high, 8 units away, looking at a point 1 up the middle. */
export function cameraAt(y: number, z = 8): PerspectiveCamera {
  const cam = new PerspectiveCamera(28, W / H, 0.1, 200);
  cam.position.set(0, y, z);
  cam.lookAt(0, 1, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
}

export const viewOf = (cam: PerspectiveCamera): Matrix4 => new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);

export interface Slot {
  mesh: { matrixWorld: Matrix4; matrix: Matrix4; updateMatrix(): void };
  pose: string;
  fade: number;
  meta: PoseMeta & { head?: HeadBox };
  lock: number;
  subject: string | null;
  scale: { height: number; width: number; prone: boolean };
  base: unknown;
}
export const slotsOf = (a: Actor): [Slot, Slot] => (a as unknown as { slots: [Slot, Slot] }).slots;
export const slotOf = (a: Actor, pose: string): Slot => slotsOf(a).find((s) => s.pose === pose)!;

/** The probe's corners, projected onto the 1600x900 canvas, in the order the harness takes (`continuity-probe.mjs`). */
function corners(cam: PerspectiveCamera, world: Matrix4): number[] {
  const vp = viewOf(cam).elements;
  const m = world.elements;
  const q: number[] = [];
  for (const [lx, ly] of [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]] as const) {
    const x = m[0]! * lx + m[4]! * ly + m[12]!;
    const y = m[1]! * lx + m[5]! * ly + m[13]!;
    const z = m[2]! * lx + m[6]! * ly + m[14]!;
    const cx = vp[0]! * x + vp[4]! * y + vp[8]! * z + vp[12]!;
    const cy = vp[1]! * x + vp[5]! * y + vp[9]! * z + vp[13]!;
    const cw = vp[3]! * x + vp[7]! * y + vp[11]! * z + vp[15]!;
    q.push(((cx / cw) * 0.5 + 0.5) * W, (-(cy / cw) * 0.5 + 0.5) * H);
  }
  return q;
}

/** What CHK-026 reads for a plane: the head box's size on screen, in px at 1600 wide, through the plane the engine drew. */
export function headPx(a: Actor, cam: PerspectiveCamera, pose: string): number {
  a.updateMatrixWorld(true);
  const s = slotOf(a, pose);
  const h = s.meta.head!;
  return headSizePx(unitSquareToQuad(corners(cam, s.mesh.matrixWorld)), { u0: h[0], t0: h[1], u1: h[2], t1: h[3] });
}

/** The stage-camera number: the idle plane's top edge over its bottom edge on screen. */
export function perspectiveOf(a: Actor, cam: PerspectiveCamera): number {
  a.updateMatrixWorld(true);
  const q = corners(cam, slotOf(a, 'idle').mesh.matrixWorld);
  return Math.hypot(q[2]! - q[0]!, q[3]! - q[1]!) / Math.hypot(q[4]! - q[6]!, q[5]! - q[7]!);
}

/** The camera height that gives a stage camera of `perspective` (a higher camera looks down: the top edge is nearer and longer). */
export function cameraWithPerspective(perspective: number): PerspectiveCamera {
  const probe = yuna({ life: false, interimYaw: false });
  let lo = 0;
  let hi = 12;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (perspectiveOf(probe, cameraAt(mid)) < perspective) lo = mid;
    else hi = mid;
  }
  return cameraAt((lo + hi) / 2);
}

/** The swap the harness reads: the old and the new painting, through their own planes, in one frame. */
export const swapRatio = (a: Actor, cam: PerspectiveCamera, from: string, to: string): number => headPx(a, cam, to) / headPx(a, cam, from);

/** A frame of the game: the actor moves (`update`), the stage hands it the camera (`holdHeads`' own call), the world is composed. */
export function frame(a: Actor, cam: PerspectiveCamera, held = true): void {
  a.update(1 / 60);
  if (held) a.holdHead(viewOf(cam));
  a.updateMatrixWorld(true);
}

/** `from` showing, then a change of pose (the crossfade puts both planes in the frame, the way the harness reads a swap). */
export function swapping(a: Actor, cam: PerspectiveCamera, from: Pose, to: Pose, held = true): void {
  a.setPose(from, { immediate: true, force: true });
  if (held) a.holdHead(viewOf(cam));
  frame(a, cam, held);
  a.setPose(to, { force: true });
}
