/**
 * `window.__pyrefly.crisp`: the crispness options round's runtime switch (scratch branch `crisp-options`; captures only).
 *
 * - `get()` / `set(patch)` / `preset(name)`: the config (`engine/crisp/CrispConfig.ts`); a preset is a whole end state (every lever,
 *   the texture ones included: the prefiltered mips are built or taken back on the textures already loaded);
 * - `flush()`: work off the prefiltered-mips queue now; `queued()` says how many wait;
 * - `report()`: the config, the pass list, the effective supersampling, the prefilter's own counters;
 * - `presets`: the names.
 */
import type { App } from '../app/App.ts';
import { CRISP_PRESETS, type CrispConfig } from '../engine/crisp/CrispConfig.ts';

export function installCrispDebug(api: Record<string, unknown>, app: App): void {
  api['crisp'] = {
    get: () => ({ ...app.renderer.crisp.cfg }),
    set: (patch: Partial<CrispConfig>) => ({ ...app.renderer.crisp.set(patch) }),
    preset: (name: string) => app.renderer.crisp.preset(name),
    flush: (max?: number) => app.renderer.crisp.flush(max),
    queued: () => app.renderer.crisp.queued,
    report: () => app.renderer.crisp.report(),
    inspect: () => app.renderer.crisp.inspect(),
    sums: () => app.renderer.crisp.sums(),
    presets: Object.keys(CRISP_PRESETS),
  };
}
