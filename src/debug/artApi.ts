/**
 * `window.__pyrefly.art`: the art tiers' debug and measurement seam (release 39; captures and checks only, never a player path).
 *
 * - `stats()`: the live stage's governor (what each figure holds, the resident megabytes, the upgrades, the masters being uploaded ahead of their
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

export function installArtDebug(api: Record<string, unknown>, app: App): void {
  const stageArt = (): StageArt | null => (app.current as unknown as { stage?: { art?: StageArt } } | null)?.stage?.art ?? null;
  api['art'] = {
    stats: () => ({ device: deviceClass(), budget: artBudget(), bufferWidth: bufferWidth(), pinned: forcedArtScale(), aa: app.renderer.aaMode, governor: stageArt()?.stats() ?? null }),
    tier: (cls: DeviceClass | null) => setArtTier(cls),
    force: (scale: number | null) => setForcedArtScale(scale),
    stage: (on: boolean | null) => setStagedUploads(on), // release 39.1: the staged uploads on or off for the next stage, as `?stage=off` does
    aa: (mode: AaMode) => app.renderer.setAa(mode),
    plan: () => stageArt()?.plan(),
    rigs: () => stageArt()?.rigReport() ?? null,
    shots: () => stageArt()?.shotTable() ?? null,
  };
}
