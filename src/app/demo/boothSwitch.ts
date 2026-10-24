/**
 * THE BOOTH SCREENS SWITCH (conference demo, lane "booth"; Bailey, 2026-10-22 ~22:20 to 22:50 EDT, decision 188b "Mixed read (Recommended)" and 189: the end card and the attract card in the Echo painting look,
 * the press page and the trailer led by the game; both games: the front door is shared plumbing, nothing here touches a fight).
 *
 * What it turns on, in demo mode only (`?demo=1`, `app/demoMode.ts`):
 *
 *  - the END CARD: the demo's "Thanks for playing" card after a won fight is the Echo painting held with a slow push, words left, the QR and the address right (`boothCards.ts`), instead of the cream plate;
 *  - the ATTRACT CARD: after 60 s of nobody at the title, the Echo painting with "Pick up the controller" and "Press any button" (`boothAttract.ts`), instead of the self-playing reel (decision 169n; the reel comes
 *    back with `?attract=reel`).
 *
 * | address | the booth screens |
 * |---|---|
 * | nothing | off: release 62's thanks card and attract reel, exactly |
 * | `?booth=new` | on (in demo mode) |
 * | `?pack=demo` | on (the shared key every demo piece answers to) |
 * | `?pack=demo&booth=today` | off (the A/B: the demo pack with today's cards) |
 * | `?pack=demo&attract=reel` | the end card on, the 60 s idle still plays the reel |
 *
 * The press page (`public/press/index.html`) and the standalone card address (`?card=end`, `?card=attract`) are new and have no today: they simply exist.
 *
 * Pure: no DOM but the address, no `three`.
 */
import { packDemo, queryWord } from '../../engine/motion/DemoGate.ts';
import { demoModeOn } from '../demoMode.ts';

export type BoothMode = 'new' | 'today';
export type BoothCard = 'end' | 'attract';

/** `?booth=new|today` and `?pack=demo` from a search string (pure): `today` (the default) unless `booth=new`, or `pack=demo` with no `booth=today`. */
export function boothModeFromSearch(search: string | undefined): BoothMode {
  if (search === undefined) return 'today';
  const w = queryWord(search, 'booth');
  if (w === 'today' || w === 'off') return 'today';
  return w === 'new' || w === 'on' || packDemo(search) ? 'new' : 'today';
}

/** `?card=end|attract` from a search string: the standalone card the page opens on instead of the title, or null. */
export function boothCardFromSearch(search: string | undefined): BoothCard | null {
  const w = queryWord(search, 'card');
  return w === 'end' || w === 'attract' ? w : null;
}

/** `?attract=reel` from a search string: the idle count starts release 61's reel even with the booth screens on. */
export function attractReelFromSearch(search: string | undefined): boolean {
  return queryWord(search, 'attract') === 'reel';
}

let mode: BoothMode | null = null;

const here = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** The switch as the page asked for it. Read once. */
export function boothMode(): BoothMode {
  if (mode === null) mode = boothModeFromSearch(here());
  return mode;
}

/** Tests and `__pyrefly.booth(...)`: force the mode (`null` reads the address again). */
export function setBoothMode(value: BoothMode | null): void {
  mode = value;
}

/** Are the new end card and attract card showing, in demo mode? The one question every piece asks. */
export function boothNewOn(): boolean {
  return boothMode() === 'new' && demoModeOn();
}

/** Does the 60 s idle start the card (true) or release 61's reel (false)? */
export function attractIsCard(): boolean {
  return boothNewOn() && !attractReelFromSearch(here());
}
