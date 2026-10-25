/**
 * `window.__pyrefly.hudF1(mode?)` and `.hudF1On()`: the F1 HUD's switch for captures and checks (lane "hud-f1"; `ui/hudf1/HudF1Switch.ts`).
 *
 * `hudF1()` returns `'f1'` or `'today'` (from `?hud=f1` / `?pack=demo`, default today); `hudF1('f1' | 'today')` sets it live (the HUD re-reads it at once and puts its class on or takes it off). The F1 HUD plays only in
 * the demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `hudF1On()` is the answer for the running chapter. `hudF1Tune(key, value)` flips one of the provisional choices live
 * (`HUD_F1_TUNE`: `ribbonStaysInAction`, `floorPx`, `slimDropsOd`, `finish`) for captures; the HUD reads them when it next applies the switch (`hudF1('today')` then `hudF1('f1')`).
 */
import { HUD_F1_TUNE, hudF1Mode, hudF1On, setHudF1Mode, type HudF1Mode } from '../ui/hudf1/HudF1Switch.ts';
import { f1Cost } from '../ui/hudf1/HudF1.ts';

export function installHudF1Debug(api: Record<string, unknown>): void {
  api['hudF1'] = (mode?: HudF1Mode): HudF1Mode => {
    if (mode === 'f1' || mode === 'today') setHudF1Mode(mode);
    return hudF1Mode();
  };
  api['hudF1On'] = (): boolean => hudF1On();
  /** `hudF1Cost(true)` starts recording the layer's own per-frame main-thread cost, `hudF1Cost(false)` stops, and `hudF1Cost()` returns and clears the samples (ms). */
  api['hudF1Cost'] = (on?: boolean): number[] => {
    if (typeof on === 'boolean') f1Cost.profile = on;
    const s = f1Cost.samples;
    f1Cost.samples = [];
    return s;
  };
  api['hudF1Tune'] = (key: string, value?: unknown): unknown => {
    const t = HUD_F1_TUNE as unknown as Record<string, unknown>;
    if (!(key in t)) return undefined;
    if (value !== undefined && typeof value === typeof t[key]) t[key] = value;
    return t[key];
  };
}
