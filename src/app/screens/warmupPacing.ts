/**
 * The pacing of a warm's draws (r63-play, the overnight fix of the skeptic's M1; both games): the textures one at a time and a fence between draws. Used by `BattleScreenWarmup.ts`'s offscreen warm (the demo's stages built behind the title and the picker).
 */
import type { Material, Object3D, Texture } from 'three';

/** A drawable with a material. */
export type Part = Object3D & { material?: Material | Material[] };

/** The slice of the three renderer the texture step uses. */
export interface InitTextureHost {
  initTexture?(texture: Texture): void;
}

export const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The textures a drawable's material holds (own properties and a shader material's uniforms), each once. */
export function texturesOf(o: Part, into: Set<Texture>): void {
  for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
    for (const v of Object.values(m as unknown as Record<string, unknown>)) {
      const t = v as Texture | null;
      if (t && t.isTexture === true) into.add(t);
    }
    const uniforms = (m as unknown as { uniforms?: Record<string, { value?: unknown }> }).uniforms;
    if (uniforms) {
      for (const u of Object.values(uniforms)) {
        const t = u?.value as Texture | null | undefined;
        if (t && t.isTexture === true) into.add(t);
      }
    }
  }
}

/** Upload the family's textures one at a time; a task boundary after any upload that took long, so no two big uploads share one. */
export async function uploadTextures(gl: InitTextureHost, members: readonly Part[], done: WeakSet<object>): Promise<void> {
  if (typeof gl.initTexture !== 'function') return;
  const all = new Set<Texture>();
  for (const o of members) texturesOf(o, all);
  for (const t of all) {
    if (done.has(t) || (t as Texture & { isRenderTargetTexture?: boolean }).isRenderTargetTexture === true) continue;
    done.add(t);
    const t0 = performance.now();
    try {
      gl.initTexture(t);
    } catch {
      /* the draw uploads it, as before */
    }
    if (performance.now() - t0 > 4) await nextTask();
  }
}

/** The part of a WebGL2 context a fence needs. */
export interface FenceGl {
  fenceSync(condition: number, flags: number): unknown;
  getSyncParameter(sync: unknown, pname: number): unknown;
  deleteSync(sync: unknown): void;
  flush(): void;
  readonly SYNC_GPU_COMMANDS_COMPLETE: number;
  readonly SYNC_STATUS: number;
  readonly SIGNALED: number;
}

export function fenceContext(ctx: unknown): FenceGl | null {
  const c = ctx as Partial<FenceGl> | null | undefined;
  return c && typeof c.fenceSync === 'function' && typeof c.getSyncParameter === 'function' && typeof c.deleteSync === 'function' && typeof c.flush === 'function' ? (c as FenceGl) : null;
}

/** Longest the page waits for the GPU to finish a slice's draw (a driver that never signals must not hold the warm). */
const SETTLE_CAP_MS = 600;

/**
 * Resolves when the GPU has finished everything drawn so far, polling a fence a few milliseconds apart. The poll is a status read that returns at once (measured: 0.0 ms behind a draw whose
 * executable took 300 ms to build); what blocks the page is a query that needs an answer from the GPU process behind that work.
 */
export async function gpuSettled(gl: FenceGl, capMs = SETTLE_CAP_MS): Promise<void> {
  let sync: unknown = null;
  try {
    sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
  } catch {
    return;
  }
  if (!sync) return;
  const t0 = performance.now();
  try {
    while (performance.now() - t0 < capMs) {
      if (gl.getSyncParameter(sync, gl.SYNC_STATUS) === gl.SIGNALED) return;
      await new Promise<void>((resolve) => setTimeout(resolve, 6));
    }
  } catch {
    /* a lost context: the draw that follows says so */
  } finally {
    try {
      gl.deleteSync(sync);
    } catch {
      /* gone with the context */
    }
  }
}



