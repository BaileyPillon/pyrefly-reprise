/**
 * THE SWAP SWITCHES OF THE MOTION-FLUIDITY PASS (lane L1 "poses and swaps"; Bailey, 2026-10-26 ~13:45 EDT: "I need an additional pass for motion, motion fluidity, animations etc please", with every
 * decision delegated to the driver). Items MF-01, MF-05 and MF-06 of the fluidity plan (`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`). Pure: no `three`, no DOM but the address of the page.
 *
 * Every look is an address word on ONE build and **every default is today's look**; the clips are made by changing the word, never the build. All of them play in the two pack chapters only (Chapter I
 * `seymour-flux`, FFX; Chapter IV `ffx2-bahamut`, FFX-2: `DemoGate`), with the pack on (`?pack=off` keeps release 62's), because the planner and the smear they ride on play only there (MF-22 widens it).
 *
 * - `?interlude=all|attack` (MF-01, FFX-2 only, **no look change, ON**): `all` (the default) holds a girl's menu `ready` through the turn start into her own attack, cast or item; `attack` is post-flicker's
 *   attack-only hold (the "before" of MF-01).
 * - `?stance=today|v1a|v1b|v3` (MF-05, both games, default `today`): the idle-to-ready change at turn start. `v1a`: the menu keeps the idle painting (the ring and the lean of the ready STANCE stay), and
 *   `ready` is shown only as an attack's wind-up painting. `v1b`: no ready painting anywhere (the wind-up is played on the idle painting). `v3`: today's two paintings, the change a 50 ms three-frame blend.
 * - `?swapcause=today|cut|blend3|pick` (MF-06, both games, default `today`) and `?swapclass=a,b,...` (default every class): the swaps that have a cause on screen (the contact, the hit, the glow, the toss,
 *   the critical stance) or settle at rest (the return home, the recoveries): `cut` a cut inside the smear on the cause, `blend3` a 50 ms three-frame blend, `pick` the cut where the moment has a cover
 *   and the blend where it has none.
 *
 * Game case (AGENTS.md rule 14): the switches are both games except `?interlude` (FFX-2 only: FFX's turn start comes before the menu). Read once, like the other URL switches (`SmearSwitch.ts`).
 */
import { demoChapter, isDemoChapter, packDemo, queryWord } from './DemoGate.ts';

export type InterludeMode = 'all' | 'attack';
export type StanceMode = 'today' | 'v1a' | 'v1b' | 'v3';
export type CauseMode = 'today' | 'cut' | 'blend3' | 'pick';

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

const searchOf = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** `?interlude=` from a search string (pure): `attack` or the default `all`. */
export function interludeFromSearch(search: string | undefined): InterludeMode {
  return queryWord(search, 'interlude') === 'attack' ? 'attack' : 'all';
}

/** `?stance=` from a search string (pure): the word, only with the pack on; else `today`. */
export function stanceFromSearch(search: string | undefined): StanceMode {
  const w = queryWord(search, 'stance');
  return (w === 'v1a' || w === 'v1b' || w === 'v3') && packDemo(search) ? w : 'today';
}

/** `?swapcause=` from a search string (pure): the word, only with the pack on; else `today`. */
export function causeFromSearch(search: string | undefined): CauseMode {
  const w = queryWord(search, 'swapcause');
  return (w === 'cut' || w === 'blend3' || w === 'pick') && packDemo(search) ? w : 'today';
}

/** `?swapclass=a,b` from a search string (pure): the classes named; every class when none is. */
export function classesFromSearch(search: string | undefined): ReadonlySet<SwapClass> {
  const named = queryWord(search, 'swapclass')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is SwapClass => (SWAP_CLASSES as readonly string[]).includes(s));
  return new Set(named.length ? named : SWAP_CLASSES);
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
  return isDemoChapter(demoChapter()) ? stanceMode() : 'today';
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
  if (cls === null || !isDemoChapter(demoChapter())) return 'today';
  const mode = causeMode();
  if (mode === 'today' || !causeClasses().has(cls)) return 'today';
  if (mode === 'pick') return COVERED.has(cls) ? 'cut' : 'blend3';
  return mode;
}
