/**
 * `window.__pyrefly.crisp`: the sharpness ladder's runtime switch (release 39; captures and QA only, nothing the game reads).
 * The ladder is automatic (device class, then the frame-time governor: `engine/crisp/CrispConfig.ts`, `FrameGovernor.ts`); these hold or
 * move it for a capture.
 *
 * - `report()`: the rung in force, whether it is pinned, the config, the device class and effects tier, the effective supersampling, the
 *   governor's windows and the composer's passes by name;
 * - `get()`: the config in force; `rung()`: its name;
 * - `preset(name)`: pin a named end state (`presets` lists them; the governor stands down); `set(patch)`: change single levers (pins);
 *   `unpin()`: hand the frame back to the device and the governor;
 * - `simulate(ms)`: add `ms` to every frame interval the governor reads (a simulated slow frame; `null` stops it).
 */
import type { App } from '../app/App.ts';
import { CRISP_PRESETS, type CrispConfig } from '../engine/crisp/CrispConfig.ts';

export function installCrispDebug(api: Record<string, unknown>, app: App): void {
  const rig = () => app.renderer.crisp;
  api['crisp'] = {
    report: () => rig().report(),
    get: () => ({ ...(rig().report()['cfg'] as CrispConfig) }),
    rung: () => rig().report()['rung'],
    preset: (name: string) => rig().preset(name),
    set: (patch: Partial<CrispConfig>) => rig().set(patch),
    unpin: () => rig().unpin(),
    simulate: (ms: number | null) => rig().simulate(ms),
    presets: Object.keys(CRISP_PRESETS),
  };
}
