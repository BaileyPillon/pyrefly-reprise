/**
 * `window.__pyrefly.procam(on?)`: the PRO CAMERA's switch and state for captures and checks (lane "pro-camera"; both games, Chapter I and Chapter IV only; never a player path).
 *
 * `procam()` returns what the address and the setters say, whether the running chapter counts, the layer's counters (runs played, frames, the widest never-crop dolly), the run in flight with its
 * clock and the pose last drawn, the FFX-2 follower's candidate and weight, and the director's log of shots (beat, what, when). `procam(true | false)` forces the camera on or off for what
 * starts from now on (`undefined` hands it back to the address). `procamPlay(name)` is not here: a shot is played by a beat of the fight, never from the console.
 */
import { proCamConfigured, proCamGame, proCamOn, proDofOn, castShotChoice, setProCam } from '../engine/procam/ProCamSwitch.ts';
import { proDebug } from '../engine/procam/ProDirector.ts';
import type { ProLayer } from '../engine/procam/ProLayer.ts';

interface Battle {
  scene?: { battleCamera?: { proLayer?: ProLayer | null; camera: { fov: number; position: { x: number; y: number; z: number } } } };
}

export function installProCamDebug(api: Record<string, unknown>): void {
  api['procam'] = (on?: boolean): Record<string, unknown> => {
    if (on !== undefined) setProCam(on);
    const bc = ((api as { battle?: () => Battle | null }).battle?.() ?? null)?.scene?.battleCamera;
    const layer = bc?.proLayer ?? null;
    const d = proDebug.director;
    return {
      configured: proCamConfigured(),
      on: proCamOn(),
      game: proCamGame(),
      dof: proDofOn(),
      castShot: castShotChoice(),
      layer: layer ? { active: layer.active, runId: layer.runId, clock: Math.round(layer.clock), pose: layer.pose, stats: layer.stats, aspect: layer.aspect } : null,
      follower: d?.followerState() ?? null,
      played: d?.played ?? 0,
      log: d?.log.slice(-40) ?? [],
      camera: bc ? { fov: bc.camera.fov, pos: [bc.camera.position.x, bc.camera.position.y, bc.camera.position.z] } : null,
    };
  };
}
