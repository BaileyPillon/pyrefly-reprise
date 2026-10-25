/**
 * The GPU half of the fight prebuild (lane "prebuild", 2026-10-24; both games; the conference demo only): get a parked figure's paintings UP and its programs BUILT while the title or the picker is on screen.
 *
 * What the battle's entry paid for each figure, measured on the served r63-play build (headless GPU Chromium, 2560 x 1440): its pose paintings uploaded on the frame that first drew them (17 to 80 ms each, 223 MB in the
 * first 2.4 s of Chapter I), the breathing-rig read of each painting (`getImageData`, 30 to 40 ms each, five of them), and its programs linked and first used (the figures' planes, shadow discs, rings). All of it is the
 * same work with the same inputs; here it is done early, a piece at a time, each piece its own task (none over about 100 ms), looking at the pad before every one (the caller's `pause`), and never inside a draw:
 *
 * 1. **Paintings.** Every texture the figure holds goes up with `initTexture`, idle first, one per task (the pose set of the fight's first seconds, and the rest: a fight uses most of them).
 * 2. **Breathing reads.** `prewarmBreathRig` for each painting, one per task (cached by the painting; the battle's first sight of a pose then reads nothing).
 * 3. **Programs.** The figures are put in the scene for one synchronous draw per program family into the composer's own buffer (never the canvas, the post chain not run), everything else in the scene hidden for
 *    that draw, and taken out again before the draw returns, so no other code ever sees them there. After each draw a fence (`gpuSettled`) is polled, so the stall of a program's first use stays in the GPU process.
 *
 * Nothing about a figure changes: no pose is set, nothing is moved, the same textures and materials are used by the battle (`FigureCache.ts`).
 */
import type { Object3D, Scene, Texture } from 'three';
import type { PaintedActor } from '../../engine/PaintedActor.ts';
import { prewarmBreathRig } from '../../engine/fx/mix/breathRig.ts';
import { readExtents } from '../../engine/look/AlphaPrime.ts';
import { primeAlpha } from '../../engine/fx/mix/geometry.ts';
import { programFamily, type WarmupRenderer } from '../screens/BattleScreenWarmup.ts';
import { fenceContext, gpuSettled, nextTask, type Part } from '../screens/warmupPacing.ts';

/** Figures whose paintings and programs are already up (a second pass over the same object does nothing). */
const warmed = new WeakSet<object>();

export interface DrawStats {
  textures: number;
  /** The decoded size of what went up, in megabytes (width x height x 4, a third more for the mip chain). */
  uploadedMB: number;
  slices: number;
  longestTaskMs: number;
}

export const newDrawStats = (): DrawStats => ({ textures: 0, uploadedMB: 0, slices: 0, longestTaskMs: 0 });

const sizeMB = (t: Texture): number => {
  const img = t.image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | null;
  const w = img?.naturalWidth || img?.width || 0;
  const h = img?.naturalHeight || img?.height || 0;
  return (w * h * 4 * 1.33) / (1024 * 1024);
};

const stamp = (): number => (typeof performance !== 'undefined' ? performance.now() : 0);

/** Is this figure already up? */
export function isWarmed(actor: PaintedActor): boolean {
  return warmed.has(actor);
}

/**
 * Upload one figure's paintings, each in a task of its own: its idle painting (`which: 'idle'`, the first sight of every figure and what the first frames draw) or all the others (`'rest'`, the poses of the
 * fight's turns). `more` is asked between pieces: false stops (a fight was picked). The idle painting's breathing read goes with it.
 */
export async function uploadFigure(r: WarmupRenderer, actor: PaintedActor, pause: (ms?: number) => Promise<void>, more: () => boolean, stats: DrawStats, which: 'idle' | 'rest' = 'idle'): Promise<boolean> {
  const gl = r.renderer;
  const all = actor.heldTextures().filter((t) => (t as Texture & { isRenderTargetTexture?: boolean }).isRenderTargetTexture !== true);
  const textures = which === 'idle' ? all.slice(0, 1) : all.slice(1);
  for (const t of textures) {
    if (!more()) return false;
    const t0 = stamp();
    try {
      gl.initTexture?.(t);
    } catch {
      /* the draw uploads it, as before */
    }
    const ms = stamp() - t0;
    stats.textures++;
    stats.uploadedMB += sizeMB(t);
    stats.longestTaskMs = Math.max(stats.longestTaskMs, ms);
    await (ms > 4 ? pause(8) : nextTask());
    if (more()) {
      // the reads the fight makes the first time it draws this painting: the breathing field (idle's now; the other poses' too, each its own task), then, for the other poses, the look's extents and the low-resolution alpha
      const img = t.image as (CanvasImageSource & { width?: number }) | null;
      if (img) {
        const r0 = stamp();
        try {
          await prewarmBreathRig(img);
        } catch {
          /* the battle reads it itself */
        }
        stats.longestTaskMs = Math.max(stats.longestTaskMs, stamp() - r0);
        await pause(12);
      }
      if (which === 'rest' && more()) {
        const r1 = stamp();
        readExtents(t);
        stats.longestTaskMs = Math.max(stats.longestTaskMs, stamp() - r1);
        await pause(12);
        if (more()) {
          const r2 = stamp();
          primeAlpha(t as unknown as { uuid: string; image?: unknown });
          stats.longestTaskMs = Math.max(stats.longestTaskMs, stamp() - r2);
          await pause(12);
        }
      }
    }
  }
  return true;
}

/** The meshes (anything with a material) under `root`, visible or not. */
function renderables(root: Object3D): Part[] {
  const out: Part[] = [];
  root.traverse((o) => {
    if ((o as Part).material) out.push(o as Part);
  });
  return out;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const go = (): void => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
    setTimeout(go, 120);
  });
}

/**
 * Build the programs of parts that are already in the scene (r64-fixes: a parked room's dressing, `LivingPark.ts`): one draw per program family into the composer's buffer, everything else in the scene hidden
 * for that draw, then put back, a fence polled after each. Only the parts' own visible meshes are drawn (a hidden one is a program the room does not use). True when every slice was made.
 */
export async function drawParts(r: WarmupRenderer, scene: Scene, parts: readonly Object3D[], more: () => boolean, stats: DrawStats): Promise<boolean> {
  const gl = r.renderer;
  const target = r.composer?.readBuffer;
  if (typeof gl?.render !== 'function' || !target || parts.length === 0) return false;
  const ctx = fenceContext(gl.getContext?.());
  const families = new Map<string, Part[]>();
  for (const root of parts) for (const o of renderables(root)) {
    if (!o.visible) continue;
    const key = programFamily(o);
    const list = families.get(key);
    if (list) list.push(o);
    else families.set(key, [o]);
  }
  try {
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(target);
    try {
      await Promise.race([Promise.all(parts.map((p) => (gl.compileAsync as (o: Object3D, c: unknown, s?: Object3D) => Promise<unknown>)(p, r.camera, scene))), new Promise((resolve) => setTimeout(resolve, 2500))]);
    } finally {
      gl.setRenderTarget(previous);
    }
  } catch {
    /* the draws below build them */
  }
  for (const members of families.values()) {
    if (!more()) return false;
    const t0 = stamp();
    const mine = new Set(members);
    const was = new Map<Part, boolean>();
    const previous = gl.getRenderTarget();
    try {
      for (const o of renderables(scene)) {
        was.set(o, o.visible);
        o.visible = mine.has(o);
      }
      gl.setRenderTarget(target);
      gl.render!(scene, r.camera);
    } finally {
      gl.setRenderTarget(previous);
      for (const [o, v] of was) o.visible = v;
    }
    stats.slices++;
    stats.longestTaskMs = Math.max(stats.longestTaskMs, stamp() - t0);
    if (ctx) await gpuSettled(ctx);
    await nextFrame();
  }
  return true;
}

/**
 * Build the figures' programs: one draw per program family into the composer's buffer. Each draw is synchronous: the figures go into `scene`, the rest of the scene is hidden but the family's meshes, the draw is
 * made, everything is put back. `more` is asked between slices. Marks the figures warmed when every slice was made.
 */
export async function drawFigures(r: WarmupRenderer, scene: Scene, actors: readonly PaintedActor[], more: () => boolean, stats: DrawStats): Promise<boolean> {
  const gl = r.renderer;
  const target = r.composer?.readBuffer;
  if (typeof gl?.render !== 'function' || !target || actors.length === 0) return false;
  const ctx = fenceContext(gl.getContext?.());
  // The families, over every mesh of every figure (a plane not showing yet and the turn ring are programs the fight needs too).
  const families = new Map<string, Part[]>();
  for (const a of actors) for (const o of renderables(a)) {
    const key = programFamily(o);
    const list = families.get(key);
    if (list) list.push(o);
    else families.set(key, [o]);
  }
  // Start the compiles of all of them at once, in the GPU process, with the scene's lights and fog and the composer's target bound as the draw will have them.
  try {
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(target);
    try {
      await Promise.race([Promise.all(actors.map((a) => (gl.compileAsync as (o: Object3D, c: unknown, s?: Object3D) => Promise<unknown>)(a, r.camera, scene))), new Promise((resolve) => setTimeout(resolve, 2500))]);
    } finally {
      gl.setRenderTarget(previous);
    }
  } catch {
    /* the draws below build them */
  }
  const sliceDraw = (members: ReadonlySet<Part>): void => {
    const previous = gl.getRenderTarget();
    const attached: Object3D[] = [];
    const was = new Map<Part, boolean>();
    try {
      for (const a of actors) {
        if (a.parent !== scene) {
          scene.add(a);
          attached.push(a);
        }
      }
      for (const o of renderables(scene)) {
        was.set(o, o.visible);
        o.visible = members.has(o);
      }
      gl.setRenderTarget(target);
      gl.render!(scene, r.camera);
    } finally {
      gl.setRenderTarget(previous);
      for (const [o, v] of was) o.visible = v;
      for (const a of attached) scene.remove(a);
    }
  };
  for (const members of families.values()) {
    if (!more()) return false;
    const t0 = stamp();
    sliceDraw(new Set(members));
    stats.slices++;
    stats.longestTaskMs = Math.max(stats.longestTaskMs, stamp() - t0);
    if (ctx) await gpuSettled(ctx);
    await nextFrame();
  }
  for (const a of actors) warmed.add(a);
  return true;
}
