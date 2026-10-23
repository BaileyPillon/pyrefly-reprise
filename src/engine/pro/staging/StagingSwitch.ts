/**
 * THE PRO-STAGING SWITCH (conference demo, lane "pro-staging"; Bailey 2026-10-22: "I kind of want to take the ffx/ffx-2 that I know and love and put an expedition 33 kind of spin on it"; every piece
 * below is one of his picks from the options book: boss big moves "Held breath, full painting", win "Victory freeze frame", loss "quick retry", the Overdrive opening "Expedition 33-style" and the
 * FFX-2 Change "ribbon spiral with a readable pearl name plate").
 *
 * `?staging=pro|today`, read once, like the other URL switches (`MomentsSwitch.ts`, `CurvesSwitch.ts`). The shared key `?pack=demo` turns it ON (`?staging=today` wins over the pack, for A/B captures).
 * **Default: OFF** (no address key, and in every unit test): with it off the game is the build this branched from (playtest-1022), byte for byte in behaviour. It acts only in the DEMO CHAPTERS,
 * Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), named by `BattleScreen` to `DemoGate.setDemoChapter`.
 *
 * Four pieces, each switchable apart (`?stagingoff=breath,card,ending,opening` takes the named ones back to today's, for A/B captures and for isolating a fault):
 *  - `breath`: the boss's big blow staged (Total Annihilation, FFX; Mega Flare, FFX-2): a small name and a rim at the wind-up, the arena draining toward ivory with the party kept clear, the blow, the lift;
 *  - `card`: the boss card as a full-bleed painting (both chapters);
 *  - `ending`: the victory freeze frame (both chapters; FFX has the party's cheer, FFX-2 stays silent) and the defeat card that keeps the scene;
 *  - `opening`: the FFX Overdrive opening (a small name, a push and a light change instead of the banner) and the FFX-2 Change's pearl name plate.
 *
 * Game case (AGENTS.md rule 14): the switch is both games (shared plumbing); WHICH look plays is read from the chapter's own game (`stagingGame`): FFX in Chapter I, FFX-2 in Chapter IV.
 * Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { demoChapter, demoGameOf, isDemoChapter, packDemo, queryWord, type DemoGame } from '../../motion/DemoGate.ts';

export type StagingMode = 'pro' | 'today';
export type StagingPiece = 'breath' | 'card' | 'ending' | 'opening';
export const STAGING_PIECES: readonly StagingPiece[] = ['breath', 'card', 'ending', 'opening'];

let mode: StagingMode | null = null;
let off: ReadonlySet<StagingPiece> | null = null;

/** `?staging=pro|today` and `?pack=demo` from a search string (pure): `today` (the default) unless `staging=pro`, or `pack=demo` with no `staging=today`. */
export function stagingModeFromSearch(search: string | undefined): StagingMode {
  if (search === undefined) return 'today';
  const staging = queryWord(search, 'staging');
  if (staging === 'today') return 'today';
  return staging === 'pro' || packDemo(search) ? 'pro' : 'today';
}

/** `?stagingoff=breath,card,...` from a search string (pure): the pieces taken back to today's. Unknown words are ignored. */
export function stagingOffFromSearch(search: string | undefined): ReadonlySet<StagingPiece> {
  const words = queryWord(search, 'stagingoff').split(/[\s,+]+/).filter(Boolean);
  return new Set(STAGING_PIECES.filter((p) => words.includes(p)));
}

const here = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** The switch as the page asked for it. Read once. */
export function stagingMode(): StagingMode {
  if (mode === null) mode = stagingModeFromSearch(here());
  return mode;
}

/** Tests, the switchboard and `window.__pyrefly.staging(...)`: force the mode (`null` reads the address again). */
export function setStagingMode(value: StagingMode | null): void {
  mode = value;
}

/** The pieces the address took back to today's. Read once. */
export function stagingOffPieces(): ReadonlySet<StagingPiece> {
  if (off === null) off = stagingOffFromSearch(here());
  return off;
}

/** Tests and `window.__pyrefly.staging(...)`: force one piece off (`true`) or on (`false`); `null` reads the address again. */
export function setStagingPieceOff(piece: StagingPiece | null, value = true): void {
  if (piece === null) {
    off = null;
    return;
  }
  const next = new Set(stagingOffPieces());
  if (value) next.add(piece);
  else next.delete(piece);
  off = next;
}

/** True when the pro staging plays now: switched on, in a demo chapter (the battle screen names it before the boss card is built: `DemoGate.setDemoChapter`). */
export function stagingOn(): boolean {
  return stagingMode() === 'pro' && isDemoChapter(demoChapter());
}

/** True when this piece plays now: the staging is on and the piece is not one the address took back. */
export function stagingPieceOn(piece: StagingPiece): boolean {
  return stagingOn() && !stagingOffPieces().has(piece);
}

/** Does this piece play for this chapter id? For the flow, which asks after the battle screen has cleared the shared chapter (the results, the defeat card): the switch is on and the chapter is a demo chapter. */
export function stagingPieceOnFor(piece: StagingPiece, chapterId: string | undefined): boolean {
  return stagingMode() === 'pro' && isDemoChapter(chapterId) && !stagingOffPieces().has(piece);
}

/** The game whose staging plays: the demo chapter's own (FFX in Chapter I, FFX-2 in Chapter IV). */
export function stagingGame(): DemoGame {
  return demoGameOf(demoChapter());
}
