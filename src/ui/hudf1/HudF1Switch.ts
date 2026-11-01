/**
 * THE F1 HUD SWITCH (conference demo, lane "hud-f1"; Bailey 2026-10-23 ~10:15, item 193: the HUD finish "F1 Brushed slab", the refined Ink & Gold on the "Clear Stage" layout;
 * his decisions 191 "I want to keep today's hud but refine that more" and 192: Less on screen, Bigger cleaner text, Painterly finish, Steps back in action).
 *
 * **Default: OFF.** With no address key, and in every unit test, {@link hudF1On} answers false and every hook falls through to today's HUD. It turns on when ALL of these hold:
 *
 * 1. the address carries `?hud=f1`, or the shared key `?pack=demo` (`?hud=today` wins over the pack, for A/B captures);
 * 2. the running chapter is one the treatment reaches (`DemoGate.isTreatedChapter(id, 'hud')`): Chapter I (`seymour-flux`, FFX), Chapter IV (`ffx2-bahamut`, FFX-2) and, since release 69, Chapter VI (`ffx2-leblanc`, FFX-2; `?treated=pack` takes it
 *    back to release 68's), named by the battle screen as the battle sets up (`engine/motion/DemoGate.ts`). Every other chapter keeps today's HUD, whatever the address says.
 * 3. TEXT SIZE no longer ends it (a11y-text, 2026-10-29, round 30b PR-0559). Release 67 stepped down to today's HUD at 115 and 130 (hud-f1 review M5: the layout is authored at one size, and the hero and the
 *    cue sat on the first verb at the larger sizes), and that made the type SMALLER than at 100: F1's command labels are 12 grid px and its party names 12.5, against today's 9.8 and 9.3, so 115 drew 28 px
 *    labels where 100 drew 30 (Chapter I, 1600 x 900) and Chapter IV's party names went 31, 27, 30. Now the F1 HUD stays and GROWS with the setting (`hudf1-textsize.css`: every zone grows from the corner it is
 *    pinned to, the left column about its foot, as `text-size.css` does for today's panels). {@link F1_GROWS_WITH_TEXT_SIZE} is the one line to put release 67's behaviour back, and `?f1text=today` does it for a
 *    page. Read from the two attributes `app/applyComfort.ts` puts on <html>. **Two chapters step down at 130** ({@link F1_TEXT_CEILING}: Chapter IX and Chapter XII, whose own panels do not fit the band the grown slab leaves; `?f1text=grow` beats it).
 *
 * Game case (AGENTS.md rule 14): BOTH games, presentation only (no number, ability, turn order or fight rule changes); WHICH layout plays is the chapter's game: FFX (CTB) has the turn strip and
 * the command block on the left, FFX-2 (ATB) has no turn strip, ATB bars on the cards and everything mirrored to the right with the slant flipped and the pink accent.
 *
 * Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { demoChapter, demoGameOf, isTreatedChapter, packDemo, queryWord } from '../../engine/motion/DemoGate.ts';

export type HudF1Mode = 'f1' | 'today';

let mode: HudF1Mode | null = null;
const listeners = new Set<() => void>();

/** `?hud=f1|today` and `?pack=demo` from a search string (pure): `today` (the default) unless `hud=f1`, or `pack=demo` with no `hud=today`. */
export function hudF1ModeFromSearch(search: string | undefined): HudF1Mode {
  if (search === undefined) return 'today';
  const hud = queryWord(search, 'hud');
  if (hud === 'today') return 'today';
  return hud === 'f1' || packDemo(search) ? 'f1' : 'today';
}

const here = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** The switch as the page asked for it. Read once. */
export function hudF1Mode(): HudF1Mode {
  if (mode === null) mode = hudF1ModeFromSearch(here());
  return mode;
}

/** Tests, the switchboard and `__pyrefly.hudF1(...)`: force the mode (`null` reads the address again). Listeners hear of a change. */
export function setHudF1Mode(value: HudF1Mode | null): void {
  const before = hudF1Mode();
  mode = value;
  if (hudF1Mode() !== before) for (const l of listeners) l();
}

/** Something that must re-read the switch when it flips at run time (the HUD's root class). Returns the way to stop listening. */
export function onHudF1Change(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Does the F1 HUD grow with TEXT SIZE (a11y-text, PR-0559; both games)? ON: it stays up at 115 and 130 and `hudf1-textsize.css` grows its zones. `false` is release 67's: today's HUD takes over at 115 and 130.
 * The page's own word `?f1text=today` beats it (for A/B captures), `?f1text=grow` forces it on.
 */
export const F1_GROWS_WITH_TEXT_SIZE = true;

export type HudF1TextMode = 'grow' | 'today';
let textMode: HudF1TextMode | null = null;

/** `?f1text=today|grow` from a search string (pure): the word if it is one, else the constant's answer. */
export function hudF1TextModeFromSearch(search: string | undefined): HudF1TextMode {
  const w = queryWord(search, 'f1text');
  if (w === 'today' || w === 'grow') return w;
  return F1_GROWS_WITH_TEXT_SIZE ? 'grow' : 'today';
}

/** The text-size mode as the page asked for it. Read once; tests and tools force it with {@link setHudF1TextMode}. */
export function hudF1TextMode(): HudF1TextMode {
  if (textMode === null) textMode = hudF1TextModeFromSearch(here());
  return textMode;
}

/** Tests and tools: force the mode (`null` reads the address again). Listeners hear of a change, as they do for the switch itself. */
export function setHudF1TextMode(value: HudF1TextMode | null): void {
  const before = hudF1TextMode();
  textMode = value;
  if (hudF1TextMode() !== before) for (const l of listeners) l();
}

/**
 * The largest TEXT SIZE (percent) at which the F1 HUD plays in a chapter whose own panel meets the grown F1 slab (review of `booth-b4`, 2026-10-31, finding c1; FFX only, rule 14: FFX-2 has no panel of this kind). Above it the chapter
 * keeps today's HUD, as release 69 draws it there, exactly as `?f1text=today` does for every chapter. Why: `hudf1-chapters.css` lays the Zanmato gauge (Chapter IX, `yojimbo-cavern`) and the Omnis disc strip (Chapter XII,
 * `seymour-omnis`) in the band between the boss ribbon and the turn strip, which grow toward each other with the setting: the band is 277 grid px at 100, 229 at 115 and 181 at 130, and the panels are 191 and 185 wide, so at
 * 130 the gauge reaches 7.4 grid px (about 30 px at 2560 x 1440) into the ribbon's end and 8.0 into the strip's box, the Omnis strip 9.2 into the ribbon's: a regression against the live site in an accessibility setting, with nothing
 * to measure the fix against but a mockup (rule 9). At 100 and 115 both clear. Lifts when a narrower gauge and strip are picked from a mockup (then delete the row). Keyed by chapter id, read with `hasOwnProperty`.
 */
export const F1_TEXT_CEILING: Readonly<Record<string, number>> = Object.freeze({
  'yojimbo-cavern': 115,
  'seymour-omnis': 115,
});

/** TEXT SIZE in force, in percent: the larger of the two attributes `app/applyComfort.ts` puts on <html>; an absent or unreadable one counts as 100 (as in a unit test). */
function textSizeNow(): number {
  const d = document.documentElement.dataset;
  const read = (v: string | undefined): number => {
    const n = Number(v ?? 100);
    return Number.isFinite(n) && n > 0 ? n : 100;
  };
  return Math.max(read(d['textSize']), read(d['textSizeWide']));
}

/** True when the page itself asked, with `?f1text=grow`, for the F1 HUD at every size in every chapter: it beats {@link F1_TEXT_CEILING} (for the A/B captures that measure what the ceiling hides). */
function f1TextForced(): boolean {
  return queryWord(here(), 'f1text') === 'grow';
}

/**
 * True when the F1 HUD may draw at the current TEXT SIZE: in a chapter on {@link F1_TEXT_CEILING} only up to its ceiling (unless the page forces it); else always while it grows with the setting, or only at 100 (an absent
 * attribute, as in a unit test, counts as 100).
 */
export function hudF1TextSizeOk(): boolean {
  if (typeof document === 'undefined') return true;
  const id = demoChapter();
  if (id !== undefined && Object.prototype.hasOwnProperty.call(F1_TEXT_CEILING, id) && textSizeNow() > F1_TEXT_CEILING[id]! && !f1TextForced()) return false;
  if (hudF1TextMode() === 'grow') return true;
  const d = document.documentElement.dataset;
  return (d['textSize'] ?? '100') === '100' && (d['textSizeWide'] ?? '100') === '100';
}

/** True when the F1 HUD plays now: switched on, in a demo chapter, at TEXT SIZE 100. */
export function hudF1On(): boolean {
  return hudF1Mode() === 'f1' && isTreatedChapter(demoChapter(), 'hud') && hudF1TextSizeOk();
}

/** The game of the running demo chapter, or undefined outside the demo chapters. */
export function hudF1Game(): 'ffx' | 'ffx2' | undefined {
  const c = demoChapter();
  return isTreatedChapter(c, 'hud') ? demoGameOf(c) : undefined;
}

/** The F1 damage numeral's size against the glass numeral's (`proNumbers.sizeFactor`; `hudf1-numbers.css`: Cormorant's figures are shorter than Exo 2's at one font-size, and the mockup draws it at 230 px). [ours] */
export const F1_DAMAGE_K = 1.6;

/** The provisional choices and the motion numbers (mutable on purpose: `__pyrefly.hudF1Tune(key, value)` flips one live for a capture). */
export interface HudF1Tune {
  ribbonStaysInAction: boolean;
  stepBackAt: 'action-start';
  floorPx: number;
  slimDropsOd: boolean;
  finish: boolean;
  edgeCalm: boolean;
  slimAnimates: boolean;
  slideOutMs: number;
  slideBackMs: number;
  backAfterEndMs: number;
  backMaxWaitMs: number;
}

/**
 * THE PROVISIONAL CHOICES (the build draws them as the F1 mockup does; Bailey judges them on the test build, so each is ONE LINE here).
 * Listed in `docs/handoff/hud-f1.md`.
 */
export const HUD_F1_TUNE: HudF1Tune = {
  /** 1. The boss ribbon stays up during an action (the mockup keeps it, with the 1 percent bite showing). `false` slides it up and out with the rest. */
  ribbonStaysInAction: true,
  /** 2. The step-back starts at the action's start (after the target is confirmed, as the presenter signals it). */
  stepBackAt: 'action-start',
  /** 3. The text floor for the cue and the prompts, in px at 2560 x 1440 (the mockup: 28; the alternative the notes name for a 27-inch booth monitor: 32). */
  floorPx: 28,
  /** 4. The slim party cards (during an action) drop the Overdrive bar and the /max numbers (`hudf1-act.css`; `false` is not wired to CSS yet: the bar's rule is one line there). */
  slimDropsOd: true,
  /** 5. The F1 "Brushed slab" finish (baked edge masks and paint textures, `hudf1-finish.css`). `false` leaves the flat slabs of the Clear Stage layout (the fallback if the booth's GPU minds the masks). */
  finish: true,
  /** 6. Calm edges: the ends of the ivory rows eaten a few px instead of a finger deep (the risk the notes name: torn masking tape). */
  edgeCalm: false,
  /** 7. The party cards ANIMATE their height into the slim form (220 ms, layout every frame for three masked cards). `false` snaps them (the content already swaps at once): one line to flip if the booth GPU hitches in a step-back (hud-f1 review: the frame cost of the step-back is unproven, +1 ms mean in the windows on a shared machine). */
  slimAnimates: true,
  /** The slide out at an action's start, ms (ease-in; the CSS transition in `hudf1-act.css` carries the same number). */
  slideOutMs: 170,
  /** The slide back, ms (ease-out; the CSS carries it). */
  slideBackMs: 220,
  /** The wait after an action's end before the block comes back, ms (and never before the damage numbers have gone). */
  backAfterEndMs: 220,
  /** The most the return may wait for a damage number to clear, ms. */
  backMaxWaitMs: 1500,
};
