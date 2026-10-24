/**
 * THE PRO-LOOK SWITCH (conference demo, lane "pro-look"; Bailey 2026-10-22, "I kind of want to take the ffx/ffx-2 that I know and love and put an expedition 33 kind of spin on it",
 * and his picks of that night from the options book: arena "Cinematic contrast" plus the Chapter IV plate-seam fix, hits "Ink and light" with the clean glass damage numbers, markers
 * "Classic, calm, clear").
 *
 * One switch, five pieces. **Default: OFF** (merging this changes nothing in the live game; with no address key, and in every unit test, {@link proLookOn} answers false and every hook falls
 * through to today's code). It turns on when ALL of these hold:
 *
 * 1. the address carries `?look=pro`, or the shared key `?pack=demo` (`?look=today` wins over the pack, for A/B captures);
 * 2. the running chapter is one of the two DEMO CHAPTERS, Chapter I (`seymour-flux`, FFX) or Chapter IV (`ffx2-bahamut`, FFX-2), named by the battle screen as the battle sets up
 *    (`motion/DemoGate.ts`). Every other chapter keeps today's frame, whatever the address says.
 *
 * `?look=` is also the demo-looks key (`LookConfig.parseLook`: hd2d, cinematic, anime, off); `pro` and `today` mean "no look key named" to it (the chapter's own default look plays, hd2d bold
 * today; under the pro arena, a cinematic bold grade) and any other value is the address choosing a look by hand, which wins for the ARENA piece only (hits, numbers and markers stay on).
 *
 * The pieces, each switchable by address (`?prooff=arena,seam,hits,numbers,markers`) and from the console (`__pyrefly.pro`):
 * - `arena`   "Cinematic contrast": one strong light per arena, the rest falls to deep shadow and haze (`look/pro/ProGrade.ts`, the bold pass's pro terms).
 * - `seam`    the Chapter IV plate's right edge blended and the floor steps blurred (FFX-2 only; the plate files are never edited).
 * - `hits`    "Ink and light": an ink stroke with a luminous core per weapon, a cross glint, ink drops with a gold rim, one shock ring (`spellfx/effects-pro-hit.ts`).
 * - `numbers` the glass damage numbers: tiers, a plus on heals, one rising number per multi-hit (`ui/common/proNumbers.ts`).
 * - `markers` the big FFX glove, the FFX-2 ring with the target name, the low-HP pulse, the KO wash and mark (`ui/common/proMarkers.ts`).
 *
 * Game case (AGENTS.md rule 14): the switch is both games; WHICH look plays is the chapter's game (FFX in Chapter I, FFX-2 in Chapter IV), and each piece says its own case.
 *
 * Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { demoChapter, demoGameOf, isDemoChapter, packDemo, proLanes, queryWord } from '../../motion/DemoGate.ts';

export type ProMode = 'pro' | 'today';
export type ProPiece = 'arena' | 'seam' | 'hits' | 'numbers' | 'markers';
export const PRO_PIECES: readonly ProPiece[] = ['arena', 'seam', 'hits', 'numbers', 'markers'];

let mode: ProMode | null = null;
let off: Set<ProPiece> | null = null;
const listeners = new Set<() => void>();

/** `?look=pro|today` and `?pack=demo` from a search string (pure): `today` (the default) unless `look=pro`, or `pack=demo` with no `look=today`. */
export function proModeFromSearch(search: string | undefined): ProMode {
  if (search === undefined) return 'today';
  const look = queryWord(search, 'look');
  const lanes = proLanes(search); // the r63 master word: `?pro=off` takes this lane back to today's, `?pro=on` turns it on without the pack
  if (look === 'today' || lanes === 'off') return 'today';
  return look === 'pro' || lanes === 'on' || packDemo(search) ? 'pro' : 'today';
}

/** The pieces `?prooff=` names, from a search string (pure; unknown words are ignored). */
export function proOffFromSearch(search: string | undefined): ProPiece[] {
  if (search === undefined) return [];
  const words = queryWord(search, 'prooff').split(',').map((w) => w.trim());
  return PRO_PIECES.filter((p) => words.includes(p));
}

/** Did the address choose a demo look by hand (`?look=hd2d|cinematic|anime|off`)? Then the pro ARENA stands aside: the address wins over the chapter's own look. */
export function addressChoseLook(search: string | undefined): boolean {
  if (search === undefined) return false;
  const look = queryWord(search, 'look');
  return look !== '' && look !== 'pro' && look !== 'today';
}

/** The Danger pulse's off switch from a search string (pure): `?dangerpulse=off` turns the low-HP row's pulse into a steady amber ring (the triangle stays); anything else leaves it on. A Settings row would set the same thing. */
export function dangerPulseFromSearch(search: string | undefined): 'on' | 'off' {
  return search !== undefined && queryWord(search, 'dangerpulse') === 'off' ? 'off' : 'on';
}

const here = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** The switch as the page asked for it. Read once. */
export function proMode(): ProMode {
  if (mode === null) mode = proModeFromSearch(here());
  return mode;
}

/** Tests, the switchboard and `__pyrefly.pro(...)`: force the mode (`null` reads the address again). Listeners (the look state re-reads the chapter's grade) hear of a change. */
export function setProMode(value: ProMode | null): void {
  const before = proMode();
  mode = value;
  if (proMode() !== before) for (const l of listeners) l();
}

/** Something that must re-read the switch when it flips at run time (the arena's grade). Returns the way to stop listening. */
export function onProChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function offSet(): Set<ProPiece> {
  if (off === null) off = new Set(proOffFromSearch(here()));
  return off;
}

/** Tests and `__pyrefly.proPiece(...)`: turn one piece off or on (`null` reads the address again). */
export function setProPiece(piece: ProPiece | null, on = true): void {
  if (piece === null) {
    off = null;
    return;
  }
  const had = offSet().has(piece);
  if (on) offSet().delete(piece);
  else offSet().add(piece);
  if (had === on) for (const l of listeners) l();
}

/** True when the pro look plays now: switched on, in a demo chapter. */
export function proLookOn(): boolean {
  return proMode() === 'pro' && isDemoChapter(demoChapter());
}

/** Does this piece play now: the pro look is on in a demo chapter and the address did not turn the piece off. */
export function proPieceOn(piece: ProPiece): boolean {
  return proLookOn() && !offSet().has(piece);
}

/** The pro ARENA for a chapter about to start (the battle names the chapter before the figures load, and the look asks before `demoChapter` is set on the first call): on, in that demo chapter, unless the address chose a look. */
export function proArenaFor(chapterId: string | undefined, search: string | undefined = here()): boolean {
  return proMode() === 'pro' && isDemoChapter(chapterId) && !offSet().has('arena') && !addressChoseLook(search);
}

/** The game of the running demo chapter, or undefined outside the demo chapters. */
export function proGame(): 'ffx' | 'ffx2' | undefined {
  const c = demoChapter();
  return isDemoChapter(c) ? demoGameOf(c) : undefined;
}
