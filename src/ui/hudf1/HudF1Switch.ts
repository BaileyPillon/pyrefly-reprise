/**
 * THE F1 HUD SWITCH (conference demo, lane "hud-f1"; Bailey 2026-10-23 ~10:15, item 193: the HUD finish "F1 Brushed slab", the refined Ink & Gold on the "Clear Stage" layout;
 * his decisions 191 "I want to keep today's hud but refine that more" and 192: Less on screen, Bigger cleaner text, Painterly finish, Steps back in action).
 *
 * **Default: OFF.** With no address key, and in every unit test, {@link hudF1On} answers false and every hook falls through to today's HUD. It turns on when ALL of these hold:
 *
 * 1. the address carries `?hud=f1`, or the shared key `?pack=demo` (`?hud=today` wins over the pack, for A/B captures);
 * 2. the running chapter is one of the two DEMO CHAPTERS, Chapter I (`seymour-flux`, FFX) or Chapter IV (`ffx2-bahamut`, FFX-2), named by the battle screen as the battle sets up
 *    (`engine/motion/DemoGate.ts`). Every other chapter keeps today's HUD, whatever the address says.
 *
 * Game case (AGENTS.md rule 14): BOTH games, presentation only (no number, ability, turn order or fight rule changes); WHICH layout plays is the chapter's game: FFX (CTB) has the turn strip and
 * the command block on the left, FFX-2 (ATB) has no turn strip, ATB bars on the cards and everything mirrored to the right with the slant flipped and the pink accent.
 *
 * Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { demoChapter, demoGameOf, isDemoChapter, packDemo, queryWord } from '../../engine/motion/DemoGate.ts';

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

/** True when the F1 HUD plays now: switched on, in a demo chapter. */
export function hudF1On(): boolean {
  return hudF1Mode() === 'f1' && isDemoChapter(demoChapter());
}

/** The game of the running demo chapter, or undefined outside the demo chapters. */
export function hudF1Game(): 'ffx' | 'ffx2' | undefined {
  const c = demoChapter();
  return isDemoChapter(c) ? demoGameOf(c) : undefined;
}

/** The provisional choices and the motion numbers (mutable on purpose: `__pyrefly.hudF1Tune(key, value)` flips one live for a capture). */
export interface HudF1Tune {
  ribbonStaysInAction: boolean;
  stepBackAt: 'action-start';
  floorPx: number;
  slimDropsOd: boolean;
  finish: boolean;
  edgeCalm: boolean;
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
  finish: false,
  /** 6. Calm edges: the ends of the ivory rows eaten a few px instead of a finger deep (the risk the notes name: torn masking tape). */
  edgeCalm: false,
  /** The slide out at an action's start, ms (ease-in; the CSS transition in `hudf1-act.css` carries the same number). */
  slideOutMs: 170,
  /** The slide back, ms (ease-out; the CSS carries it). */
  slideBackMs: 220,
  /** The wait after an action's end before the block comes back, ms (and never before the damage numbers have gone). */
  backAfterEndMs: 220,
  /** The most the return may wait for a damage number to clear, ms. */
  backMaxWaitMs: 1500,
};
