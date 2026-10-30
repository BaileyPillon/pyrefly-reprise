/**
 * `window.__pyrefly.art`: the art tiers' debug and measurement seam (release 39; captures and checks only, never a player path).
 *
 * - `stats()`: (release 68, lane "budgets-2": `memory`, the decoded-painting cache and the lighting-map cache with what the last fight's end released, and `hold`, the phone's foreground-first books)
 *   the live stage's governor (what each figure holds, the resident megabytes, the upgrades, the masters being uploaded ahead of their
 *   swap and the stager's own counters, release 39.1) plus the device class and budget the engine is running under;
 * - `tier(cls | null)`: force a device class (`phone`, `low`, `mid`, `high`), as `?arttier=` does;
 * - `force(scale | null)`: pin every painting loaded from now on to one master (`?artscale=`); the governor stands down;
 * - `stage(on | null)`: the staged uploads (release 39.1) on or off for the next battle's stage, as `?stage=off` does;
 * - `aa(mode)`: the anti-aliasing (`off`, `smaa`, `msaa`), as `?aa=` does;
 * - `plan()`: run the stage's look-ahead (every rig, the held shots by size) now;
 * - `shots()`: every painting the party holds with its painted height in approved texels (the held shots' sizes are arithmetic on it);
 * - `rigs()`: every battle-camera rig, at rest and pushed in, with the magnification each drawn figure would have from it.
 */
import type { App } from '../app/App.ts';
import { artBudget, bufferWidth, deviceClass, forcedArtScale, setArtTier, setForcedArtScale, setStagedUploads } from '../engine/ArtDevice.ts';
import type { DeviceClass } from '../engine/ArtBudget.ts';
import type { AaMode } from '../engine/PostAa.ts';
import type { StageArt } from '../engine/StageArt.ts';
import { thumbStats } from '../engine/look/AlphaThumb.ts';
import { extentsReads } from '../engine/look/AlphaPrime.ts';
import { memoryBooks } from '../engine/LeaveRelease.ts';
import { holdBooks } from '../engine/LoadHold.ts';

/** The names of the GL programs the renderer has linked (three's `info.programs`), in link order: which program a long frame's `getProgramInfoLog` was waiting for. */
function programNames(app: App): string[] {
  const r = (app.renderer.renderer as unknown as { info?: { programs?: Array<{ name?: string; id?: number }> | null } }).info;
  return (r?.programs ?? []).map((p) => `${p.id ?? '?'}:${p.name ?? '?'}`);
}

/** three's own count of what the renderer holds on the GPU (geometries, textures) and the programs it has linked: the memory job reads it at every board to see which of them grows with the visits. */
function glMemory(app: App): { geometries: number; textures: number; programs: number } | null {
  const info = (app.renderer.renderer as unknown as { info?: { memory?: { geometries?: number; textures?: number }; programs?: unknown[] | null } }).info;
  return info?.memory ? { geometries: info.memory.geometries ?? 0, textures: info.memory.textures ?? 0, programs: info.programs?.length ?? 0 } : null;
}

export function installArtDebug(api: Record<string, unknown>, app: App): void {
  const stageArt = (): StageArt | null => (app.current as unknown as { stage?: { art?: StageArt } } | null)?.stage?.art ?? null;
  api['art'] = {
    stats: () => ({ device: deviceClass(), budget: artBudget(), bufferWidth: bufferWidth(), pinned: forcedArtScale(), aa: app.renderer.aaMode, governor: stageArt()?.stats() ?? null, alpha: { ...thumbStats(), extents: { ...extentsReads } }, programs: programNames(app), memory: memoryBooks(), hold: holdBooks(), gl: glMemory(app) }),
    tier: (cls: DeviceClass | null) => setArtTier(cls),
    force: (scale: number | null) => setForcedArtScale(scale),
    stage: (on: boolean | null) => setStagedUploads(on), // release 39.1: the staged uploads on or off for the next stage, as `?stage=off` does
    aa: (mode: AaMode) => app.renderer.setAa(mode),
    plan: () => stageArt()?.plan(),
    rigs: () => stageArt()?.rigReport() ?? null,
    shots: () => stageArt()?.shotTable() ?? null,
  };
}
