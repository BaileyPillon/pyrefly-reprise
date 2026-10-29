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
 * - `?swapscope=pack|wide|all` (MF-22, default {@link SCOPE_DEFAULT}, `wide` since release 68): where the stance and cause looks play. `pack` is the two pack chapters (release 67's reach: `?swapscope=pack`
 *   brings it back). `wide` is EVERY chapter except the ones named in {@link SCOPE_EXCEPTIONS}, each with its written reason (fifteen of the nineteen since release 68; ONE line to change, `SCOPE_DEFAULT`). `all` is
 *   every chapter, exceptions included: the measuring word, so a chapter on the exception list can still be run with the rules on (PR-0522). Release 67 flipped the two LOOKS to Bailey's picks in the two pack
 *   chapters and did not widen the gate; release 68 widens it. `today` is `pack`. All three need the pack on (`?pack=off`, a phone or a tablet read `pack`).
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
 * THE WIDE SCOPE, FLIPPED (MF-22; release 68, the driver's call under Bailey's delegation of 2026-10-28: "i'll go with all your recommendations and decision-making for the next couple days"; his to overturn):
 * what `?swapscope` reads when the address does not name a value. `wide` since release 68, after the browser measurement of `docs/handoff/pc-scope.md` (all 19 chapters with `?swapscope=all`, 6,158 s of battle) was
 * read: fifteen of the nineteen chapters join (see-through time 52 to 76 percent lower in each joiner, swap jerks at or under round 30's but for Vegnagun's, which a waiver row explains) and the four in
 * {@link SCOPE_EXCEPTIONS} stay at release 67's look. `pack` is release 67's reach, and one line to go back (`?swapscope=pack` per address).
 */
export const SCOPE_DEFAULT: SwapScope = 'wide';

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
    'FFX, the big foe: the rules-on run of 2026-10-27 (mf-l1-swaps handoff, MF-22) took ghost frames a minute from 287 to 98 but swap jerks of 40 px or more from 9 to 25 (worst 62 to 155 px): the moving-figure cuts the planner makes across heads 0.41 to 0.44 of the height apart (Yunalesca attack to cast, Auron follow to idle). The wide run of release 68 (2026-10-28, seed 1, the whole 409 s fight) read it again: 13 swap jerks against 7 for round 30, worst 154 px. Held-chapters lane (2026-10-29), read offline from that run: all 13 are PLANNED cuts that the harness refuses to excuse by 0.1 to 1.9 percent (Yunalesca attack to cast 132 to 134 px against a cap of half her drawn height, 131.5; Auron follow to idle 154 against 153): a step of about 0.5 of the figure is what a cut across 0.41 to 0.44 of its height is. The 63 planned cuts over 120 px are the fight (Tidus attacks 20 times, each a ready to attack and an attack to follow at 125 to 131 px, and Auron returns 18 times), not a planner fault: Chapter I plans the same cuts, it just has few lunges (7 planned-cut jerks of 120 px or more in 384 s against 76 in 409 s). The chapter now carries its own cut-anchor word (CutAnchor.CUT_ANCHOR_CHAPTERS: on, the ?cutanchor=on of MF-18), which the model reads at 0 unexcused and 0 cuts over 120 px. Lifts when the job yunalesca-all (anchor on by the chapter word) has been run: no swap jerk of 40 px or more is left outside an excused planned cut and the anchored look has been judged in the clips (docs/handoff/pc-scope.md); the table entry travels with the chapter.',
  'evrae-airship':
    "FFX, Evrae: the wide run of release 68 (2026-10-28, seed 1) took ghost time a minute from 3,224 ms (round 30) to 1,088 but swap jerks from 2 to 11, and 12 in the repeat. 10 of the 11 are Evrae's own swaps, every pair, with the same 53 to 55 px head step (dy -50, dx 18) on cuts with no smear. Held-chapters lane (2026-10-29): two causes, both read offline. (1) The registration: his idle and idle-near are one painting with two head boxes 50 painting px apart, breath-charge's box sat 20 px above the same face and hurt's 46 px left of its eye: re-registered (the swap's step reads 35 to 37 px, from 53 to 55). (2) The rest: his heads travel 57 to 68 px between cast, hurt and idle (0.12 to 0.13 of his height) mostly UP AND DOWN, which the planner's big-change test (sideways only) cannot see, so the 50 ms blend stepped them: the chapter now keeps today's blend where two heads are 0.08 of his height apart in any direction (SwapSwitch.BLEND_HEAD_CHAPTERS). Lifts when a repeat run of the job evrae-airship-all reads no swap jerk of 40 px or more and at most round 30's 2 swap jerks of 24 px or more, with ghost time a minute at or under 0.7 of round 30's (2,257 ms).",
  'sin-face':
    "FFX, Sin's face: the wide run of release 68 (2026-10-28, seed 1) took ghost time a minute from 2,390 ms to 1,116, with 2 swap jerks against 1. Held-chapters lane (2026-10-29), read offline: Auron's lunge returns to his stance in one frame (224 px) but that return IS a planned cut (the log has its smear: style paint, 38 ms, heads 0.40 of his height apart); the harness refused to excuse it by 1.2 percent (224.4 px against a cap of half his drawn height, 221.8), because Auron is drawn 444 px tall in this frame. The second jerk is Auron's critical to victory, a 50 ms blend across heads 0.22 of his height apart straight up (60 px), which the planner's sideways-only test read as close: the chapter now keeps today's blend across 0.08 or more in any direction (SwapSwitch.BLEND_HEAD_CHAPTERS), and carries its own cut-anchor word (CutAnchor.CUT_ANCHOR_CHAPTERS: on), which the model reads at 224 down to 108 px, inside the cap. Lifts when the job sin-face-all (anchor on by the chapter word) reads no swap jerk of 40 px or more outside an excused planned cut and the anchored look has been judged in the clips (docs/handoff/pc-scope.md).",
  'ffx2-ixion-djose':
    "FFX-2, Ixion XVI: the wide run of release 68 (2026-10-28, seed 1) took ghost time a minute from 4,873 ms to 2,144, but run 1 had a snap (Paine idle to hurt, a plain hard cut, IoU 0.44), the repeat had none, and a KO kneel cut steps 146 px; swap jerks read 1 and 2 against 1. Held-chapters lane (2026-10-29), read offline: the snap is a hole in the recording, not in the game: 4,765 ms of frames (2017 to 2303) are missing across that swap and the hurt painting is already at 0.25 in the last frame before the gap, so the change was a blend whose frames were never recorded; the harness now says so (continuity-gaps.mjs, summary.motion.snapsGapExcused 1, snaps 0 over all 24 kept recordings changes nothing else). The kneel is a PLANNED cut (smear paint, 38 ms, cause critical: Rikku hurt to critical and back, heads 0.38 of her height apart sideways and 0.30 up): 146, 140 and 138 px against caps of 145.5, 132.6 and 137.6, over by 0.1 to 5.7 percent (three planned cuts in the two runs). Not touched in code: the anchor leaves a kneel's vertical part (the model reads 97 px, inside the cap) and FFX-2's sources are silent on a slide. Lifts when a third run has no snap and either the job ffx2-ixion-djose-all-anchor (?cutanchor=on) reads the kneel cuts inside their cap and the look is judged, or a repeat reads them inside it with no change.",
};

/**
 * THE 50 ms BLEND'S REACH, WHERE A HEAD TRAVELS UP AND DOWN (held-chapters lane, 2026-10-29; FFX only in effect: the two chapters below are FFX's; the driver's call under Bailey's delegation of 2026-10-28, his to
 * overturn). The planner keeps today's longer blend for a pair of drawings it calls a BIG change (`SmearPlan.isBigChange`: outlines under half shared, or heads 0.12 of the height apart SIDEWAYS), because the 50 ms
 * three-frame blend of two heads far apart steps the weighted head about 0.6 of their distance in one frame (its capped curve: the outgoing painting is nearly gone by the second frame). Sideways is all it
 * reads. A serpent's head dips and rears and a kneel to a victory pose is straight up, so Evrae's `cast>idle` and `hurt>idle` (heads 0.12 and 0.13 of his height apart, 0.04 and 0.09 of it sideways; coil
 * outlines that overlap 0.7) and Auron's `critical>victory` (0.22 up, 60 px in Sin's face) were blends of 50 ms across 55 to 60 px of head travel, the swap jerks that kept both chapters out of {@link WIDE_CHAPTERS}'s
 * reach in release 68. In the chapters named here a `pick` blend whose two heads are {@link BLEND3_HEAD_MAX} of the figure's height apart or more IN ANY DIRECTION (`SmearFacts.headDistance`) keeps
 * today's blend too: 0.6 x 0.08 of a 500 px figure is 24 px, the harness's own jerk line (`policy.json` `jerkMinPx`). Every other chapter is untouched (their numbers were measured with the sideways reading, and
 * victory to idle pairs in the FFX-2 joiners read the same way: `docs/handoff/held-chapters.md` has the census). The table is separate from {@link SCOPE_EXCEPTIONS} on purpose: lifting an exception must not drop it.
 */
export const BLEND3_HEAD_MAX = 0.08;
export const BLEND_HEAD_CHAPTERS: Readonly<Record<string, number>> = {
  'evrae-airship': BLEND3_HEAD_MAX,
  'sin-face': BLEND3_HEAD_MAX,
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

/** The whole head distance (a share of the figure's height) at which a `pick` blend keeps today's blend in chapter `id`, or null when the chapter reads the sideways distance only ({@link BLEND_HEAD_CHAPTERS}). */
export function blendHeadMax(id: string | undefined = demoChapter()): number | null {
  return id !== undefined && Object.prototype.hasOwnProperty.call(BLEND_HEAD_CHAPTERS, id) ? BLEND_HEAD_CHAPTERS[id]! : null;
}

/** True when two heads `distance` apart (a share of the height, any direction; null: not known) are too far for the 50 ms blend in the running chapter. */
export function blendTooFar(distance: number | null, id: string | undefined = demoChapter()): boolean {
  const max = blendHeadMax(id);
  return max !== null && distance !== null && Number.isFinite(distance) && distance >= max;
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
