/**
 * THE SWAP SWITCHES OF THE MOTION-FLUIDITY PASS (lane L1 "poses and swaps"; Bailey, 2026-10-26 ~13:45 EDT: "I need an additional pass for motion, motion fluidity, animations etc please", with every
 * decision delegated to the driver). Items MF-01, MF-05 and MF-06 of the fluidity plan (`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`). Pure: no `three`, no DOM but the address of the page.
 *
 * Every look is an address word on ONE build; the clips are made by changing the word, never the build. **Release 67 (the driver's call under Bailey's delegation, 2026-10-28; his to overturn) made
 * Bailey's picks the defaults: `?stance` reads `v1a` and `?swapcause` reads `pick`** ({@link STANCE_DEFAULT}, {@link CAUSE_DEFAULT}: ONE line each to change). **`?stance=today` and `?swapcause=today` are
 * release 66's look, exactly** (an address that names them, or a page with the pack off, a phone or a tablet, or no page at all). The B words
 * (`?stance`, `?swapcause`, `?swapclass`) play in the two pack chapters only (Chapter I `seymour-flux`, FFX; Chapter IV `ffx2-bahamut`, FFX-2: `DemoGate`), with the pack on (`?pack=off` keeps release 62's),
 * because the planner and the smear they ride on play only there (`?swapscope=all`, MF-22, widens it). `?interlude` does NOT depend on the pack: it plays in all seven FFX-2 chapters (confirmed on Trema) and
 * under `?pack=off`; it is a turn-start rule (`KeyPoses.readyCarriesIntoCastOrItem`), not a smear.
 *
 * - `?interlude=all|attack` (MF-01, FFX-2 only, **no look change, ON**): `all` (the default) holds a girl's menu `ready` through the turn start into her own attack, cast or item; `attack` is post-flicker's
 *   attack-only hold (the "before" of MF-01).
 * - `?stance=today|v1a|v1b|v3` (MF-05, both games, default `v1a` since release 67; `today` is release 66's): the idle-to-ready change at turn start. `v1a`: the menu keeps the idle painting (the ring and the lean of the ready STANCE stay), and
 *   `ready` is shown only as an attack's wind-up painting. `v1b`: no ready painting anywhere (the wind-up is played on the idle painting). `v3`: today's two paintings, the change a 50 ms three-frame blend.
 * - `?swapcause=today|cut|blend3|pick` (MF-06, both games, default `pick` since release 67; `today` is release 66's) and `?swapclass=a,b,...` (default every class): the swaps that have a cause on screen (the contact, the hit, the glow, the toss,
 *   the critical stance) or settle at rest (the return home, the recoveries): `cut` a cut inside the smear on the cause, `blend3` a 50 ms three-frame blend, `pick` the cut where the moment has a cover
 *   and the 50 ms blend where it has none AND the two drawings are close (not a big change: `SmearPlan.isBigChange`); two drawings that share nothing keep today's blend at rest, because a 50 ms blend of
 *   them is the head crossing 70 to 150 px in two frames (the harness reads it as a swap jerk). The pure `blend3` word is the plan's V2 arm and blends every class, big or small.
 *
 * - `?swapscope=pack|wide|all` (MF-22, default {@link SCOPE_DEFAULT}, `pack` until the browser measurement of the wide rules has been read): where the stance and cause looks play. `pack` is the two pack chapters
 *   (release 67's reach). `wide` is EVERY chapter except the ones named in {@link SCOPE_EXCEPTIONS}, each with its written reason (the word the default flips to: ONE line, `SCOPE_DEFAULT`). `all` is every chapter,
 *   exceptions included: the measuring word, so a chapter on the exception list can still be run with the rules on (PR-0522). Release 67 flips the two LOOKS to Bailey's picks in the two pack chapters; it does
 *   not widen the gate. `today` is `pack`. All three need the pack on (`?pack=off`, a phone or a tablet read `pack`).
 *
 * Game case (AGENTS.md rule 14): the switches are both games except `?interlude` (FFX-2 only: FFX's turn start comes before the menu). Read once, like the other URL switches (`SmearSwitch.ts`).
 */
import { demoChapter, isDemoChapter, packDemo, queryWord } from './DemoGate.ts';

export type InterludeMode = 'all' | 'attack';
export type StanceMode = 'today' | 'v1a' | 'v1b' | 'v3';
export type CauseMode = 'today' | 'cut' | 'blend3' | 'pick';

/**
 * THE TWO PICKS AS DEFAULTS (release 67; Bailey's look choices of 2026-10-28, the driver's call under his delegation): what `?stance` and `?swapcause` read when the address does not name a value they know,
 * in a page where the pack is on (a pack chapter, a desktop-class screen, no `?pack=off`). Change a pick by changing the letter on its line; `today` is release 66's look and is always a word.
 */
export const STANCE_DEFAULT: StanceMode = 'v1a';
export const CAUSE_DEFAULT: CauseMode = 'pick';

/** Where the stance and cause looks play (MF-22): the two pack chapters, every chapter but the named exceptions, or every chapter. */
export type SwapScope = 'pack' | 'wide' | 'all';

/**
 * THE WIDE SCOPE, READY TO FLIP (MF-22; the lane pc-scope, 2026-10-28; Bailey's delegation of 2026-10-28: "i'll go with all your recommendations and decision-making for the next couple days"): what `?swapscope`
 * reads when the address does not name a value. `pack` today, so release 67 plays exactly where release 66's words played. The driver flips it to `wide` (ONE line) after the browser measurement of
 * `docs/handoff/pc-scope.md` (all 19 chapters with `?swapscope=all`, then `wide`) is read and `SCOPE_EXCEPTIONS` is settled.
 */
export const SCOPE_DEFAULT: SwapScope = 'pack';

/**
 * The chapters `wide` reaches: the nineteen listed ones (`src/data/encounters.ts` CHAPTER_IDS, in play order), by name. A hidden or experimental chapter (the 3D fayth chapter, the Wind Waker and Leblanc
 * experiments) is NOT here, so it keeps release 67's look until someone decides otherwise; a twentieth listed chapter fails `tests/unit/pc-scope-swap-scope.test.ts` until it is added here or named in
 * {@link SCOPE_EXCEPTIONS}. `all` reaches every chapter id, listed or not (it is the measuring word).
 */
export const WIDE_CHAPTERS: readonly string[] = [
  'seymour-flux', 'yunalesca', 'braskas-final-aeon',
  'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc',
  'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus',
  'ffx2-fallen-aeons', 'seymour-omnis', 'ffx2-trema', 'isaaru-via-purifico', 'ffx2-den-of-woe', 'ffx2-ixion-djose',
  'sin-fins-core', 'sin-face', 'mirror-aeons',
];

/**
 * Chapters the wide scope leaves at release 67's look, each with the written reason and what lifts it (chapter id from `src/data/encounters.ts`). `?swapscope=all` ignores this list. An entry goes when the job
 * named in its reason has been run and read; an id that is not a chapter fails `tests/unit/pc-scope-swap-scope.test.ts`.
 */
export const SCOPE_EXCEPTIONS: Readonly<Record<string, string>> = {
  yunalesca:
    'FFX, the big foe: the rules-on run of 2026-10-27 (mf-l1-swaps handoff, MF-22) took ghost frames a minute from 287 to 98 but swap jerks of 40 px or more from 9 to 25 (worst 62 to 155 px): the moving-figure cuts the planner makes across heads 0.41 to 0.44 of the height apart (Yunalesca attack to cast, Auron follow to idle). Lifts when `?cutanchor=on` (MF-18) has been run there (jobs/wide-yunalesca.json) and no swap jerk of 40 px or more is left outside a named cut.',
};

/** The swaps MF-06 names, each by what is happening on screen (`SwapClass.ts` reads them off the pair of paintings). */
export type SwapClass = 'contact' | 'home' | 'hit' | 'recover' | 'glow' | 'castEnd' | 'toss' | 'itemEnd' | 'critical' | 'criticalOut';
export const SWAP_CLASSES: readonly SwapClass[] = ['contact', 'home', 'hit', 'recover', 'glow', 'castEnd', 'toss', 'itemEnd', 'critical', 'criticalOut'];
/** The classes whose moment has a cover on screen (the contact flash and hit-stop, the hit, the cast glow, the toss, the critical stance's flash): `pick` cuts these and blends the rest. */
export const COVERED: ReadonlySet<SwapClass> = new Set<SwapClass>(['contact', 'hit', 'glow', 'toss', 'critical']);
/** How a swap is made: today's blend, a cut inside the smear, or the 50 ms three-frame blend. */
export type SwapHow = 'today' | 'cut' | 'blend3';

/** The length of a designed three-frame blend, real ms (3 frames at 60 Hz; the same time at 120 or 144 Hz). */
export const BLEND3_MS = 50;

let interlude: InterludeMode | null = null;
let stance: StanceMode | null = null;
let cause: CauseMode | null = null;
let classes: ReadonlySet<SwapClass> | null = null;
let scope: SwapScope | null = null;

const searchOf = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** `?interlude=` from a search string (pure): `attack` or the default `all`. */
export function interludeFromSearch(search: string | undefined): InterludeMode {
  return queryWord(search, 'interlude') === 'attack' ? 'attack' : 'all';
}

/** `?stance=` from a search string (pure): with the pack off, `today` (release 66's look, whatever the word); with it on, the word it names (`today`, `v1a`, `v1b`, `v3`), else {@link STANCE_DEFAULT}. */
export function stanceFromSearch(search: string | undefined): StanceMode {
  if (!packDemo(search)) return 'today';
  const w = queryWord(search, 'stance');
  return w === 'today' || w === 'v1a' || w === 'v1b' || w === 'v3' ? w : STANCE_DEFAULT;
}

/** `?swapcause=` from a search string (pure): with the pack off, `today` (release 66's look, whatever the word); with it on, the word it names (`today`, `cut`, `blend3`, `pick`), else {@link CAUSE_DEFAULT}. */
export function causeFromSearch(search: string | undefined): CauseMode {
  if (!packDemo(search)) return 'today';
  const w = queryWord(search, 'swapcause');
  return w === 'today' || w === 'cut' || w === 'blend3' || w === 'pick' ? w : CAUSE_DEFAULT;
}

/** `?swapclass=a,b` from a search string (pure): the classes named; every class when the word is not given. A word that names none that exist (a typo) turns NONE on, never everything (review F-6). */
export function classesFromSearch(search: string | undefined): ReadonlySet<SwapClass> {
  const word = queryWord(search, 'swapclass');
  if (!word) return new Set(SWAP_CLASSES);
  return new Set(word.split(',').map((s) => s.trim()).filter((s): s is SwapClass => (SWAP_CLASSES as readonly string[]).includes(s)));
}

/** `?swapscope=` from a search string (pure): with the pack off, `pack`; with it on, the word it names (`pack`, `wide`, `all`; `today` is `pack`), else {@link SCOPE_DEFAULT}. */
export function scopeFromSearch(search: string | undefined): SwapScope {
  if (!packDemo(search)) return 'pack';
  const w = queryWord(search, 'swapscope');
  return w === 'today' ? 'pack' : w === 'pack' || w === 'wide' || w === 'all' ? w : SCOPE_DEFAULT;
}

export function swapScope(): SwapScope {
  return (scope ??= scopeFromSearch(searchOf()));
}

/** Tests and `window.__pyrefly.swapSwitch(...)`: force the scope (`null` reads the address again). */
export function setSwapScope(v: SwapScope | null): void {
  scope = v;
}

/** True when chapter `id` is named in {@link SCOPE_EXCEPTIONS}: the wide scope leaves it at release 67's look. */
export function scopeExcepted(id: string | undefined): boolean {
  return id !== undefined && Object.prototype.hasOwnProperty.call(SCOPE_EXCEPTIONS, id);
}

/** Do the looks above play in chapter `id` under `scope`? A pack chapter always; every chapter id under `all`; under `wide` a listed chapter ({@link WIDE_CHAPTERS}) that is not an exception (no chapter named: no). */
export function chapterInScope(id: string | undefined, within: SwapScope = swapScope()): boolean {
  if (isDemoChapter(id) || within === 'all') return true;
  return within === 'wide' && id !== undefined && WIDE_CHAPTERS.includes(id) && !scopeExcepted(id);
}

/** True when the looks above play in the running chapter (`chapterInScope` for the chapter the battle screen named). */
export function swapsInScope(): boolean {
  return chapterInScope(demoChapter());
}

export function interludeMode(): InterludeMode {
  return (interlude ??= interludeFromSearch(searchOf()));
}
export function stanceMode(): StanceMode {
  return (stance ??= stanceFromSearch(searchOf()));
}
export function causeMode(): CauseMode {
  return (cause ??= causeFromSearch(searchOf()));
}
export function causeClasses(): ReadonlySet<SwapClass> {
  return (classes ??= classesFromSearch(searchOf()));
}

/** Tests and `window.__pyrefly.swapSwitch(...)`: force a switch (`null` reads the address again). */
export function setInterludeMode(v: InterludeMode | null): void {
  interlude = v;
}
export function setStanceMode(v: StanceMode | null): void {
  stance = v;
}
export function setCauseMode(v: CauseMode | null, only?: readonly SwapClass[] | null): void {
  cause = v;
  if (only !== undefined) classes = only === null ? null : new Set(only);
}

/** The stance look that plays NOW: the asked-for one in a pack chapter, `today` anywhere else. */
export function stanceNow(): StanceMode {
  return swapsInScope() ? stanceMode() : 'today';
}

/** True when the menu keeps the idle painting (`v1a`, `v1b`): the ready STANCE (ring, lean) without the ready painting. */
export function menuKeepsIdle(): boolean {
  const s = stanceNow();
  return s === 'v1a' || s === 'v1b';
}

/** True when the attack's wind-up is played on the idle painting too (`v1b`: no ready painting anywhere). */
export function windUpOnIdle(): boolean {
  return stanceNow() === 'v1b';
}

/** How a swap of this class is made NOW. A class not asked for, a mode `today`, or a chapter outside the pack is today's blend. */
export function swapHow(cls: SwapClass | null): SwapHow {
  if (cls === null || !swapsInScope()) return 'today';
  const mode = causeMode();
  if (mode === 'today' || !causeClasses().has(cls)) return 'today';
  if (mode === 'pick') return COVERED.has(cls) ? 'cut' : 'blend3';
  return mode;
}
