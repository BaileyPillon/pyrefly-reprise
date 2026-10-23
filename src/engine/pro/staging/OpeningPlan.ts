/**
 * THE OVERDRIVE OPENING, THE PLAN (lane "pro-staging"; Bailey 2026-10-22: the Overdrive opening "Expedition 33-style (a small name; the camera, timing and light carry the moment)" for FFX; FFX-2's ribbon-spiral Change
 * kept with a readable pearl name plate). Pure: one function of the clock (`ui/common/proStage/OpeningView.ts` draws it).
 *
 * FFX only (Overdrives belong to FFX and its CTB; `overdrive-dressphere/NOTES.md` Decision 1): where today's opening holds a big banner on the frame for 1.25 s, this one lets the camera push the move already makes
 * (`BattleMoments.overdriveStart`, the held 14 percent push) and a light change carry it: the arena lightens toward ivory with the caster kept in colour and lit, his name set small at his side, a glint along the blade, and a
 * white pop as the strike begins. All numbers `[ours]` (the book's timings for its option B, trimmed: nothing here is measured from the retail game, whose Overdrive opening is the effect's own and never recorded).
 *
 * The FFX-2 Change has no plan: the HUD's own flourish (the painted twirl and its ribbons, `ui/ffx2/SpherechangeFlourish.ts`) plays untouched and only its name plate is restyled to a readable pearl one
 * (`proStage.css`), for as long as the layer holds `data-pst-open` on the screen's root.
 */

/** How long the opening holds before the strike, ms (today's slab holds 1,250 plus its 260 ms moves): the book's option B holds 1,090 to its cut. */
export const OD_OPEN_HOLD_MS = 1000;
/** How long the Change's pearl plate has the screen's `data-pst-open` flag, ms: the flourish (800) and the plate's own hold (1,150) with a little over. */
export const CHANGE_OPEN_MS = 2100;

export interface OdMarks {
  at: number | null;
  holdMs: number;
  tame: boolean;
  /** Left of the frame or right: which side of the caster the name sits (the caster stands left on FFX's field; the name goes right of him). */
}

export interface OdFrame {
  /** The light change: the arena lightens toward ivory, the HUD sinks (0..1). */
  light: number;
  /** The small name's strength. */
  name: number;
  /** The glint along the blade (0..1 progress, -1 when none). */
  glint: number;
  /** The white pop as the strike begins. */
  flash: number;
  alive: boolean;
}

const clamp01 = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const smooth = (x: number): number => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export const emptyOd = (): OdMarks => ({ at: null, holdMs: OD_OPEN_HOLD_MS, tame: false });

export function odFrame(now: number, m: OdMarks): OdFrame {
  if (m.at === null) return { light: 0, name: 0, glint: -1, flash: 0, alive: false };
  const t = now - m.at;
  const H = Math.max(1, m.holdMs);
  const out = smooth((t - (H - 260)) / 360); // the light and the name leave over the last 260 ms and the 100 after it
  const light = smooth(t / 300) * (1 - out);
  const name = smooth((t - 160) / 260) * (1 - out);
  const g = (t - 0.62 * H) / (0.3 * H);
  const glint = g >= 0 && g <= 1 ? g : -1;
  const peak = m.tame ? 0.25 : 0.7;
  const flash = t >= H - 40 && t < H + 280 ? peak * (1 - smooth((t - (H - 40)) / 320)) : 0;
  return { light, name, glint, flash, alive: t < H + 380 };
}
