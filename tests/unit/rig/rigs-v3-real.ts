/**
 * The REAL pilot rigs under the real engine (rigs-v3 review, 2026-10-29: "no test uses the real rig geometry"): `tests/fixtures/rig/real/*.rig.json` are the bones, keys, landmarks, motion and gate of
 * `tidus-v2` and `rikku-dark-knight-v2` with each part's mesh cut down to a quad of its box (the skeleton, the pose of every key and so every landmark are the file's own; the pictures are not needed).
 * `traceKo` plays a fall and a revive of the real `RigActor` under the real `LivingFigure` at 60 Hz and reads the posed landmarks in world units after every frame (the figure is 1.82 tall).
 */
import { readFileSync } from 'node:fs';
import { Matrix4, Texture } from 'three';
import { painting } from '../engine/head-lock-fixture.ts';
import { RigActor, readRig, LivingFigure, ctxOf, FRAME, type RigActorT } from './rigs-v3-fixture.ts';

export const REAL = [
  { subject: 'tidus', folder: 'tidus-v2', game: 'ffx' as const },
  { subject: 'rikku-dark-knight', folder: 'rikku-dark-knight-v2', game: 'ffx2' as const },
];
export const LANDMARKS = ['head', 'pelvis', 'feet', 'tip', 'pommel', 'handA'] as const;
export type Landmark = (typeof LANDMARKS)[number];
export type Snap = Record<Landmark, [number, number]>;
export const HEIGHT = 1.82;

export async function realActor(subject: string, folder: string): Promise<RigActorT> {
  const file = JSON.parse(readFileSync(new URL(`../../fixtures/rig/real/${folder}.rig.json`, import.meta.url), 'utf8'));
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  const a = await RigActor.createRigged({ name: subject, worldHeight: HEIGHT, side: 'party', shadow: false, breathe: false, sway: false }, { data: r.data, base: `/art/rigs/${folder}`, idlePainting: painting(subject, 'idle'), loadTexture: async () => new Texture() });
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}

export interface Frame { i: number; key: string; roll: number; snap: Snap }
export interface Trace { frames: Frame[]; step(lm: Landmark, from?: number, to?: number): { d: number; i: number } }

/** Run `n` frames after `ask()`, one `LivingFigure.update` then one actor update each (the order the game steps them). */
export function stepper(a: RigActorT, game: 'ffx' | 'ffx2', over: Parameters<typeof ctxOf>[0] = {}) {
  const living = new LivingFigure(a);
  const slots = (): { slots: Array<{ mesh: { rotation: { z: number } } }>; active: number } => a as unknown as { slots: Array<{ mesh: { rotation: { z: number } } }>; active: number };
  const frame = (): void => {
    living.update(ctxOf({ dt: FRAME / 1000, realDt: FRAME / 1000, game, ...over }));
    a.update(FRAME / 1000, FRAME / 1000);
  };
  const snap = (): Snap => Object.fromEntries(LANDMARKS.map((n) => { const p = a.landmark(n)!; return [n, [p.x + a.position.x, p.y]]; })) as Snap;
  const roll = (): number => slots().slots[slots().active]!.mesh.rotation.z;
  const run = (n: number, ask: () => void): Trace => {
    ask();
    const frames: Frame[] = [{ i: -1, key: a.pose, roll: roll(), snap: snap() }];
    for (let i = 0; i < n; i++) {
      frame();
      frames.push({ i, key: a.pose, roll: roll(), snap: snap() });
    }
    return {
      frames,
      step(lm, from = 0, to = n - 1): { d: number; i: number } {
        let best = { d: 0, i: -1 };
        for (let k = Math.max(0, from) + 1; k <= Math.min(to, n - 1) + 1; k++) {
          const p = frames[k - 1]!.snap[lm], q = frames[k]!.snap[lm];
          const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (d > best.d) best = { d, i: frames[k]!.i };
        }
        return best;
      },
    };
  };
  return { living, frame, run, snap, roll };
}

/** The idle, a fall, a rest, a revive. Returns the two traces. */
export async function traceKo(subject: string, folder: string, game: 'ffx' | 'ffx2', over: Parameters<typeof ctxOf>[0] = {}, revivePose = 'idle'): Promise<{ fall: Trace; revive: Trace; actor: RigActorT; s: ReturnType<typeof stepper> }> {
  const a = await realActor(subject, folder);
  const s = stepper(a, game, over);
  for (let i = 0; i < 31; i++) s.frame();
  const fall = s.run(50, () => a.setPose('ko'));
  for (let i = 0; i < 30; i++) s.frame();
  const revive = s.run(40, () => a.setPose(revivePose));
  return { fall, revive, actor: a, s };
}

/** The frame (index in the run) at which the rig's key changed from `from`, or -1. */
export const keyChange = (t: Trace, from: string): number => t.frames.find((f) => f.key !== from)?.i ?? -1;

// ---------------------------------------------------------------- what is DRAWN (the meshes), not only where the bones are

type MeshLike = { name: string; visible: boolean; position: { z: number }; geometry: { getAttribute(n: string): { count: number; getX(i: number): number; getY(i: number): number; getZ(i: number): number } | undefined; index: { count: number } | null }; matrix: Matrix4; material: { uniforms: Record<string, { value: unknown }> }; updateMatrix(): void };
type NodeLike = { name: string; children: Array<NodeLike & MeshLike>; parent: (NodeLike & MeshLike) | null };

/** Every vertex of a mesh in the frame of the actor's `inner` group (the parent of the rig's plane and of the held group), flat xyz: the actor's own motion that frame is not in it. */
export function worldVerts(m: MeshLike & NodeLike): number[] {
  m.updateMatrix();
  m.parent!.updateMatrix();
  const e = new Matrix4().multiplyMatrices(m.parent!.matrix, m.matrix).elements;
  const a = m.geometry.getAttribute('position')!;
  const out: number[] = [];
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), y = a.getY(i), z = a.getZ(i);
    out.push(e[0]! * x + e[4]! * y + e[8]! * z + e[12]!, e[1]! * x + e[5]! * y + e[9]! * z + e[13]!, e[2]! * x + e[6]! * y + e[10]! * z + e[14]!);
  }
  return out;
}

/** What one drawn piece is: its world vertices, its opacity uniform, its z, the image it samples (the uniform's value, by identity), and the sizes of its uv and index buffers (a piece without them draws nothing or draws it wrong). */
export interface Drawn { verts: number[]; opacity: number; z: number; map: unknown; uvs: number; indices: number }
const drawn = (c: MeshLike & NodeLike): Drawn => ({ verts: worldVerts(c), opacity: c.material.uniforms['opacity']!.value as number, z: c.position.z, map: c.material.uniforms['map']?.value, uvs: c.geometry.getAttribute('uv')?.count ?? 0, indices: c.geometry.index?.count ?? 0 });
/** The live pieces now drawn (visible) by part name, and the held (frozen) ones; each with its world vertices and its opacity uniform. */
export function drawnNow(a: RigActorT): { live: Map<string, Drawn>; held: Map<string, Drawn>; heldGroupVisible: boolean | null } {
  const plane = a.figure.plane as unknown as NodeLike;
  const live = new Map<string, Drawn>();
  for (const c of plane.children) if (!c.name.endsWith('~ghost') && c.visible) live.set(c.name, drawn(c));
  const group = (plane.parent as NodeLike).children.find((c) => c.name.endsWith('~held')) as unknown as (NodeLike & { visible: boolean }) | undefined;
  const held = new Map<string, Drawn>();
  if (group) for (const c of group.children) if (c.visible) held.set(c.name.replace('~ghost', ''), drawn(c));
  return { live, held, heldGroupVisible: group ? group.visible : null };
}

/** The largest distance between corresponding vertices of two sets of world vertices. */
export const maxGap = (p: number[], q: number[]): number => {
  let m = 0;
  for (let i = 0; i + 2 < p.length; i += 3) m = Math.max(m, Math.hypot(p[i]! - q[i]!, p[i + 1]! - q[i + 1]!, p[i + 2]! - q[i + 2]!));
  return m;
};
