/**
 * THE ENDING, THE PLAN (lane "pro-staging"; Bailey 2026-10-22: win "Victory freeze frame" - "a held freeze frame on the last blow, then the results"; loss "quick retry" - "a caption and a retry card that keep the
 * scene"). Pure: one function of the clock gives every layer's strength (`ui/common/proStage/EndingView.ts` draws it), so a test can read it at any instant.
 *
 * Victory (the options book's `victory-defeat` V1, "Freeze and cheer"), all `[ours]` except where marked:
 *  - FREEZE: the last blow lands and the frame HOLDS (`FREEZE_HOLD_MS`, half a second: the book's number for the held beat): the field's clock is stopped (the feel lane's hit-stop clock, `FxStagePort.freeze`), a white
 *    flash opens and falls, a shock ring leaves the boss's chest, the HUD goes out; then the boss goes up in light as it always did;
 *  - TITLE: a quiet VICTORY and the foe's name, top right, as the party's cheer begins (FFX, the cheer's own length is the real clip's: `data/motion/realMotion.ts` `poseMs`, Tidus 3,666.7 ms PROVEN) or as the
 *    party stands (FFX-2 Chapter IV: the sources withhold the pose, the fanfare and the quip after Bahamut, `research/ffx-vs-ffx2-presentation.md` 2.2 and the writing bible E6 / 5.4, so nothing is celebrated; FFX Chapter II, since release 69: nobody poses in Zanarkand, 2.1);
 *  - PULL-BACK (the `hold` victory kind, either game): the silent pull-back stays as the transition: letterbox bars close in and the camera draws back into the results; it is a transition, not a pose. FFX-2 Chapter IV plays it (no pose after Bahamut) and, since release 69, FFX Chapter II does (nobody poses in Zanarkand, `research/ffx-vs-ffx2-presentation.md` 2.1; 2.2 says both games use the same device, withholding the celebration when the story is grave). [ours] as a transition; recorded as driver call (f) in `docs/handoff/booth-ffx-yunalesca.md`.
 * Defeat (the book's D3, "Overlay that keeps the scene"): the scene stays under a light dim while the last member falls and a caption drops in; the card and its two choices are the flow's overlay
 * (`app/screens/ProDefeatScreen.ts`).
 */

export type EndGame = 'ffx' | 'ffx2';

/** How long the last blow holds, ms: half a second (the book's number). */
export const FREEZE_HOLD_MS = 520;
/** The flash: rise and fall, ms; the peak (a glow under REDUCE FLASHES). */
export const END_FLASH_IN_MS = 40;
export const END_FLASH_OUT_MS = 320;
export const END_FLASH_PEAK = 0.85;
/** The shock ring's travel, ms, and how far it goes (a share of the frame's height). */
export const SHOCK_MS = 780;
export const SHOCK_REACH = 0.9;
/** The HUD goes out over this long at the last blow, ms. */
export const HUD_OUT_MS = 160;
/** The title's fade in, ms. */
export const TITLE_MS = 640;
/** The defeat dim and the caption: how long each takes to arrive, ms (the book: the card is ready 1.2 s after the last fall begins). */
export const DIM_MS = 700;
export const CAPTION_DELAY_MS = 320;
export const CAPTION_MS = 520;
/** The letterbox of the FFX-2 pull-back: a share of the frame's height, each bar. */
export const PULL_BAR_SHARE = 0.085;
/** FFX-2 Chapter IV's stand-down lasts at least this long, ms: the live build's own 2,366 ms (`victory-defeat/NOTES.md`, "What the real frames showed" 2) rounded up. */
export const STAND_DOWN_MIN_MS = 2400;

/** The clock marks of an ending, in ms on the layer's clock; null = that beat has not come. */
export interface EndMarks {
  freezeAt: number | null;
  freezeMs: number;
  titleAt: number | null;
  pullAt: number | null;
  pullMs: number;
  fallAt: number | null;
  /** REDUCE FLASHES: the flash is a glow. */
  tame: boolean;
  /** REDUCE MOTION: the shock ring does not travel. */
  calm: boolean;
  /** The playback speed's factor on the defeat's dim and caption (1 normal, 0.32 fast; the card is the flow's and comes when the presenter is done, so these keep up with it). */
  scale: number;
}

export interface EndFrame {
  /** The white flash's alpha. */
  flash: number;
  /** The shock ring: its progress 0..1 (`-1` = none now) and its alpha. */
  shock: number;
  shockAlpha: number;
  /** The HUD's strength, 1 normal, 0 gone. */
  hud: number;
  /** The title's strength. */
  title: number;
  /** The pull-back's letterbox, 0..1 of its full height. */
  bars: number;
  /** The defeat dim and caption. */
  dim: number;
  caption: number;
  alive: boolean;
}

const clamp01 = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const smooth = (x: number): number => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export const emptyEnd = (): EndMarks => ({ freezeAt: null, freezeMs: FREEZE_HOLD_MS, titleAt: null, pullAt: null, pullMs: 1200, fallAt: null, tame: false, calm: false, scale: 1 });

export function endFrame(now: number, m: EndMarks): EndFrame {
  let flash = 0;
  let shock = -1;
  let shockAlpha = 0;
  let hud = 1;
  if (m.freezeAt !== null) {
    const t = now - m.freezeAt;
    if (t >= 0) {
      const peak = m.tame ? 0.3 : END_FLASH_PEAK;
      flash = t < END_FLASH_IN_MS ? (t / END_FLASH_IN_MS) * peak : peak * (1 - smooth((t - END_FLASH_IN_MS) / END_FLASH_OUT_MS));
      const s = t / SHOCK_MS;
      if (s < 1 && !m.calm) {
        shock = s;
        shockAlpha = Math.pow(1 - s, 1.5) * 0.9;
      }
      hud = 1 - smooth(t / HUD_OUT_MS);
    }
  }
  const title = m.titleAt === null ? 0 : smooth((now - m.titleAt) / TITLE_MS);
  const bars = m.pullAt === null ? 0 : smooth((now - m.pullAt) / Math.max(1, m.pullMs));
  const sc = Math.max(0.05, m.scale);
  const dim = m.fallAt === null ? 0 : smooth((now - m.fallAt) / (DIM_MS * sc));
  const caption = m.fallAt === null ? 0 : smooth((now - m.fallAt - CAPTION_DELAY_MS * sc) / (CAPTION_MS * sc));
  if (m.titleAt !== null) hud = Math.min(hud, 1 - title); // the title comes with the HUD going out, whether or not a freeze opened the beat (a menu open at the last blow skips the freeze)
  if (m.fallAt !== null) hud = Math.min(hud, 1 - dim); // the party falls: the HUD goes out with the light, the card that follows is the flow's
  const alive = m.freezeAt !== null || m.titleAt !== null || m.pullAt !== null || m.fallAt !== null;
  return { flash, shock, shockAlpha, hud, title, bars, dim, caption, alive };
}

/** The cheer's length for FFX: the longest real clip among the party figures still standing (`realVictoryOf(...).poseMs`), at least `floor` ms; the house hold when none is known. */
export function cheerHoldMs(poseMs: ReadonlyArray<number | undefined>, floor: number): number {
  let ms = floor;
  for (const p of poseMs) if (p !== undefined && Number.isFinite(p) && p > ms) ms = p;
  return ms;
}
