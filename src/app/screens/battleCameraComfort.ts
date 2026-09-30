/**
 * fb2-0929 camera comfort, the battle screen's half (both games; the preset's
 * `originals` is FFX only, `CameraPreset.ts`).
 *
 * - {@link battleLayoutProjector}: the HUD's fighter-dodging panels (the move
 *   advisor card, the strategy guide's rail, the coach line) are laid out
 *   against the shot the camera is settling on (`BattleCamera.restCamera`), so
 *   they hold still while the camera moves. Measured live on release 31a: the
 *   card jumped 100-140 px mid-move in Chapter I and drifted 7 px a frame in
 *   Chapter IV (`docs/handoff/fb2-0929-camera.md`).
 * - {@link battleCameraPreset}: the comfort preset the stage's camera plays,
 *   `current` (untouched) unless `?cam=` or `window.__pyrefly.cam()` says so.
 */

import type { BattleCamera } from '../../engine/BattleCamera.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import type { LayoutProjector } from '../../engine/HudPort.ts';
import { cameraPresetFor, type CameraPresetSpec } from '../../engine/CameraPreset.ts';

export function battleLayoutProjector(stage: () => PaintedStage | null, camera: BattleCamera, preset?: () => CameraPresetSpec): LayoutProjector {
  return {
    point: (id, anchor) => stage()?.project(id, anchor, camera.restCamera()) ?? null,
    rect: (id) => stage()?.projectRect(id, camera.restCamera()) ?? null,
    labelsAtRest: () => preset?.().labelsAtRest === true,
  };
}

export function battleCameraPreset(game: string): () => CameraPresetSpec {
  return () => cameraPresetFor(game);
}
