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
 *   One more rule rides on this look (pc-residues, PR-0517, FFX-2's Paine Warrior, Yuna White Mage and Rikku Warrior; `ReadyIdentity.ts`): a dress whose ready painting is another figure holds the idle painting
 *   through the menu and the wind-up under `v1a`, `v1b` and `v3`, wherever this look plays (`stanceNow()` is not `today`); `?readyid=today` turns that one rule off.
 * - `?swapcause=today|cut|blend3|pick` (MF-06, both games, default `pick` since release 67; `today` is release 66's) and `?swapclass=a,b,...` (default every class): the swaps that have a cause on screen (the contact, the hit, the glow, the toss,
 *   the critical stance) or settle at rest (the return home, the recoveries): `cut` a cut inside the smear on the cause, `blend3` a 50 ms three-frame blend, `pick` the cut where the moment has a cover
 *   and the 50 ms blend where it has none AND the two drawings are close (not a big change: `SmearPlan.isBigChange`); two drawings that share nothing keep today's blend at rest, because a 50 ms blend of
 *   them is the head crossing 70 to 150 px in two frames (the harness reads it as a swap jerk). The pure `blend3` word is the plan's V2 arm and blends every class, big or small.
 *
 * - `?swapscope=all` (MF-22, default `pack`): the stance and cause looks play in ANY chapter, not only the two pack chapters, so another chapter can be measured with the rules on, one at a time
 *   (PR-0522). Release 67 flips the two LOOKS to Bailey's picks in the two pack chapters; it does not widen the gate (the scope stays `pack`), and the pack-only reach of both words is unchanged.
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
let scope: 'pack' | 'all' | null = null;

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

/** `?swapscope=all` from a search string (pure): `all` only with the pack on; else `pack`. */
export function scopeFromSearch(search: string | undefined): 'pack' | 'all' {
  return queryWord(search, 'swapscope') === 'all' && packDemo(search) ? 'all' : 'pack';
}

export function swapScope(): 'pack' | 'all' {
  return (scope ??= scopeFromSearch(searchOf()));
}

/** Tests and `window.__pyrefly.swapSwitch(...)`: force the scope (`null` reads the address again). */
export function setSwapScope(v: 'pack' | 'all' | null): void {
  scope = v;
}

/** True when the looks above play in the running chapter: a pack chapter, or any chapter under `?swapscope=all`. */
export function swapsInScope(): boolean {
  return swapScope() === 'all' || isDemoChapter(demoChapter());
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
