/**
 * The onboarding copy deck: Auron's briefing and every first-use line.
 *
 * ## Why every word lives in one file
 *
 * `docs/plans/onboarding-review.md` OPTIONAL 18: roughly two dozen lines of
 * teaching prose scattered through UI components get reviewed never. Here they
 * are one deck, read once against `research/writing-bible.md` (original text,
 * exactly in character, never a transcript from the retail games) and grepped
 * once for CHK-007's forbidden vocabulary — no section marks, no research ids,
 * no camelCase, and no bare "CTB" or "ATB", which are developer and community
 * names and appear on none of Bailey's approved frames
 * (`docs/plans/onboarding-review.md` REQUIRED 14).
 *
 * ## Game-aware (AGENTS.md hard rule 14)
 *
 * Decided from `research/ffx-vs-ffx2-presentation.md`, not from memory.
 *
 * - **FFX only** ({@link FFX_MARKS}) — Auron's voice, and a line may *hold the
 *   decision* until one confirm press. §9 row 3: the turn-order preview is true
 *   for FFX and **not** true for FFX-2, and FFX's engine waits for input by
 *   definition, so holding there freezes nothing that was running.
 * - **FFX-2 only** ({@link FFX2_MARKS}) — Rikku's voice, and a line may
 *   **never** hold anything. §4.2 / FC-4: the gauge is a four-phase pipeline
 *   (green fill → command input → purple charge → execution and recovery) that
 *   is running the whole time; §4.3 / FC-5: that charge segment is canon's own
 *   answer to "what will this cost me". Freezing it to teach is the one thing
 *   X-2 never does.
 * - **Both** — the briefing, the seen-set and the off switch. Shared plumbing
 *   is "both" (`critic/CHECKS.md` CHK-020); the content differs, the machinery
 *   does not.
 *
 * Pure data and pure functions: no DOM, no save store, no `three`. The one
 * exception is {@link playableChapterCount}, which reads the chapter registry
 * and its unlock rule (`data/encounters.ts`, `app/screens/frontend/comingChapters.ts`)
 * to count fights for {@link BRIEFING_LINES}' first line — both are plain data
 * modules, so this stays free of DOM, save store and `three`.
 */

import type { GameId } from '../../battle/common/types.ts';
import { CHAPTERS } from '../../data/encounters.ts';
import { LOCKED_CHAPTER_IDS } from '../../app/screens/frontend/comingChapters.ts';

/** Every teaching surface that is shown once and then never again. */
export type CoachMarkId =
  | 'briefing'
  | 'ffx-turn-order'
  | 'ffx-overdrive'
  | 'ffx-aeon'
  | 'ffx2-gauge'
  | 'ffx2-dressphere'
  | 'ffx2-chain';

/** One first-use line. */
export interface CoachMark {
  id: CoachMarkId;
  /** Which game it belongs to. Never shown in the other one. */
  game: GameId;
  /** Printed over the line, in the colour of that game's chrome. */
  speaker: 'Auron' | 'Rikku';
  /** The line itself, in that character's voice. */
  body: string;
  /**
   * `true` when the line waits for one confirm press before the command menu
   * opens. **FFX only, always** — see the game-aware note above.
   */
  holds: boolean;
  /** How long a non-blocking line stays up before it fades on its own, in ms. */
  fadeMs: number;
}

/**
 * The briefing's four lines, exactly as Bailey approved them on the frame
 * `docs/concepts/onboarding/c-aurons-briefing/c1-briefing.png`.
 *
 * The emphasised halves are the two clocks: FFX waits, FFX-2 does not. That is
 * the whole point of putting one shared surface in front of a board that mixes
 * chapters from both games — a friend who has played neither needs to know they
 * are two games before the list makes sense
 * (`docs/plans/onboarding-review.md`, "Missing", last bullet).
 */
export interface BriefingLine {
  /** Plain text before the emphasis. */
  lead: string;
  /** The half that is set in gold. Empty when the line has none. */
  strong: string;
  /** Plain text after the emphasis. */
  tail: string;
}

export const BRIEFING_SPEAKER = 'Auron';

/** Word forms for a small count, capitalised, the way the briefing's first line reads it. */
const COUNT_WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen',
  'Nineteen', 'Twenty',
];

/** A capitalised number word for `n` (`'Eight'`), or the digits themselves past twenty. */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** What {@link playableChapterCount} needs of a chapter registry — `CHAPTERS` satisfies it. */
export interface ChapterCountRegistry {
  readonly chapters?: readonly { readonly id: string }[];
  readonly locked?: ReadonlySet<string>;
}

/**
 * How many fights a player can actually pick from chapter select right now:
 * every chapter registered in `data/encounters.ts` **minus** the ones
 * `LOCKED_CHAPTER_IDS` still holds back as a locked COMING card
 * (`app/screens/frontend/chapterGrid.ts`'s own `playable` rule — a registered
 * chapter is `playable: true` unless its id is locked, and an unregistered one
 * never reaches `CHAPTERS` at all, hard rule 6). Defaults to the real
 * registries; a test passes its own, the same pattern
 * `chapterGrid.ts`'s `buildChapterTiles` uses.
 */
export function playableChapterCount(registry: ChapterCountRegistry = {}): number {
  const chapters = registry.chapters ?? CHAPTERS;
  const locked = registry.locked ?? LOCKED_CHAPTER_IDS;
  return chapters.filter((c) => !locked.has(c.id)).length;
}

/**
 * The briefing's four lines, exactly as Bailey approved them on the frame
 * `docs/concepts/onboarding/c-aurons-briefing/c1-briefing.png`.
 *
 * The emphasised halves are the two clocks: FFX waits, FFX-2 does not. That is
 * the whole point of putting one shared surface in front of a board that mixes
 * chapters from both games — a friend who has played neither needs to know they
 * are two games before the list makes sense
 * (`docs/plans/onboarding-review.md`, "Missing", last bullet).
 *
 * **The first line's count is not written here.** Bailey, 2026-09-25, after
 * the driver's proposal: *"Auron's onboarding lines mention 5 fights and now
 * there's more than that."* D-136 supersedes the hard-coded "Five" with
 * {@link playableChapterCount}, read at import time — the count is exactly the
 * chapter-select board's own `playable` tiles, both games together, so it
 * moves by itself the day a chapter unlocks or gets listed and this file never
 * needs a hand again. "That is all this is." and the rest of the line are
 * unchanged — only the number word does.
 */
export const BRIEFING_LINES: readonly BriefingLine[] = [
  { lead: `“${countWord(playableChapterCount())} fights. That is all this is.`, strong: '', tail: '' },
  { lead: 'In mine, ', strong: 'nothing moves until you move', tail: ' —' },
  { lead: 'read the list, take your time.', strong: '', tail: '' },
  { lead: 'In hers, ', strong: 'the clock does not wait', tail: '.”' },
];

/**
 * The fourth line under FFX-2's **Wait** mode — **Bailey's pick, verbatim**
 * (2026-09-24, *"I'll go with all of your recommendations full speed"*: draft
 * 2a of `docs/concepts/coach/wait-split-lines.md`, D-121). It replaced the
 * agent's inferred "the clock holds while you choose", which the Wait split
 * (`battle/ffx2/active.ts` `DEFAULT_WAIT_SPLIT`) made untrue: the clock runs
 * at the top-level command list and holds once a list is open or a target is
 * being aimed at. The gold half is his approved C1 wording, word for word; the
 * four plain words after it make it true under Wait.
 *
 * **The tail changed again, 2026-09-25 (D-136).** Bailey: *"Calling the
 * command menu a list a little weird don't you think?"* D-121's tail, "A list
 * stops it.", is superseded by "Choosing a command stops it." — same claim,
 * true of the same clock, worded around the actual verb the player performs
 * rather than the on-screen thing D-121 named. The gold half is unchanged.
 *
 * His approved line is shown only when `Settings.ffx2Atb` is `'active'`.
 * FFX-2 only in content; lines 1-3 never change.
 */
export const BRIEFING_WAIT_LINE: BriefingLine = {
  lead: 'In hers, ',
  strong: 'the clock does not wait',
  tail: '. Choosing a command stops it.”',
};

/**
 * The X-2 clock the coach's words must be true of (`coachState.ffx2CoachClock`):
 * Active, Wait's split (the default), or `'hold'`, Wait forced back to the old
 * whole-menu hold by the `?wait=hold` comparison switch (`app/waitSplitSwitch.ts`).
 * Bailey's three Wait lines (D-121) say the top-level list runs, which is false
 * under the hold, so the hold shows the pre-split Wait lines, which were written
 * for exactly that clock. Only a URL switch reaches `'hold'`; no player does.
 */
export type Ffx2CoachClock = 'active' | 'wait' | 'hold';

/**
 * The fourth line under `?wait=hold`: the Wait line this build shipped before the
 * split (D-029 follow-up 3, the agent's draft, never Bailey's pick), true of the
 * old hold, where nothing moves while any command menu is open.
 */
export const BRIEFING_HOLD_LINE: BriefingLine = {
  lead: 'In hers, ',
  strong: 'the clock holds while you choose',
  tail: '.”',
};

/** The four lines for the player's X-2 clock: Bailey's words under Active, his Wait line under Wait. */
export function briefingLines(clock: Ffx2CoachClock): readonly BriefingLine[] {
  if (clock === 'active') return BRIEFING_LINES;
  return [...BRIEFING_LINES.slice(0, 3), clock === 'hold' ? BRIEFING_HOLD_LINE : BRIEFING_WAIT_LINE];
}

/** How long the briefing runs if nobody touches anything, in milliseconds. */
export const BRIEFING_MS = 20_000;

/**
 * The FFX-2 first-turn coach badge (round 09 PR-0046, reopened).
 *
 * `CoachMark.ts` printed `'Nothing paused &middot; gauges running'` for every
 * FFX-2 mark, whatever the save's clock mode. That is Bailey's approved C3
 * wording and it is true under **Active** (Bailey's 2026-09-21 pick, D-009) —
 * the FFX-2 engine genuinely keeps ticking with a command menu open. D-029
 * made **Wait** the default again on 2026-09-23, and under Wait the claim is
 * false: the engine holds every gauge for as long as a command menu stays
 * open (`docs/handoff/ffx2-wait-mode.md` §1;
 * `tests/unit/ffx2-wait-mode.test.ts` "6 s with a menu open — no tick").
 *
 * {@link COACH_RUNNING_BADGE_WAIT} is **Bailey's pick, verbatim** (2026-09-24,
 * draft 3a of `docs/concepts/coach/wait-split-lines.md`, D-121), replacing the
 * agent's inferred "Menu's up · gauges holding", which the Wait split made
 * untrue: on the top-level list the gauges run. It keeps "gauges running" from
 * his Active badge and states a rule, not a status, because the badge stays up
 * for its whole fade even after the player opens a list.
 *
 * **Reworded again, 2026-09-25 (D-136)**, alongside {@link BRIEFING_WAIT_LINE}
 * and {@link FFX2_GAUGE_BODY_WAIT}: Bailey did not want "list" standing in for
 * the command menu, so D-121's "a list holds them" is superseded by "a command
 * holds them" — same rule, same clock, worded around the choice the player
 * makes rather than the menu it opens.
 *
 * FFX-2 only — `CoachMark.ts` never shows this badge for an FFX mark.
 */
export const COACH_RUNNING_BADGE_ACTIVE = 'Nothing paused &middot; gauges running';
export const COACH_RUNNING_BADGE_WAIT = 'Gauges running &middot; a command holds them';
/** Under `?wait=hold` only: the pre-split Wait badge (the agent's draft), true of the old hold. */
export const COACH_RUNNING_BADGE_HOLD = 'Menu&rsquo;s up &middot; gauges holding';

/** The FFX-2 running badge for the clock in force ({@link Ffx2CoachClock}). */
export function coachRunningBadge(clock: Ffx2CoachClock): string {
  if (clock === 'active') return COACH_RUNNING_BADGE_ACTIVE;
  return clock === 'hold' ? COACH_RUNNING_BADGE_HOLD : COACH_RUNNING_BADGE_WAIT;
}

/**
 * FFX's lines. Auron, and each one holds the decision until a confirm press.
 *
 * Keyed by **mechanic**, not by chapter (`docs/plans/onboarding-review.md`
 * REQUIRED 1): the line fires the first time the situation is genuinely real,
 * so a player who opens the board and picks Chapter 3 is taught the same things
 * as one who starts at Chapter 1, and nothing here waits on the unbuilt
 * Macalania chapter.
 */
export const FFX_MARKS: readonly CoachMark[] = [
  {
    id: 'ffx-turn-order',
    game: 'ffx',
    speaker: 'Auron',
    body: '“He moves after you. Not before. Use it.”',
    holds: true,
    fadeMs: 0,
  },
  {
    id: 'ffx-overdrive',
    game: 'ffx',
    speaker: 'Auron',
    body: '“You have taken enough. Spend it — an Overdrive never misses.”',
    holds: true,
    fadeMs: 0,
  },
  {
    id: 'ffx-aeon',
    game: 'ffx',
    speaker: 'Auron',
    body: '“Call the aeon. It fights alone, and it takes the blows meant for her.”',
    holds: true,
    fadeMs: 0,
  },
];

/**
 * `ffx2-gauge`'s body under each of FFX-2's clock modes (D-029 follow-up 4,
 * Bailey 2026-09-23). {@link FFX2_GAUGE_BODY_ACTIVE} is the original line,
 * true only under Active — every character really does "go at once". Under
 * Wait that is backwards advice, since the whole point of the mode is that
 * nobody moves while a list is open (`docs/handoff/ffx2-wait-mode.md` §1).
 * Commit 21f6270 (earlier the same day) skipped the whole mark under Wait
 * rather than invent the missing wording (hard rule 9: "never invent"
 * extends to teaching copy, not just game numbers). Bailey has since picked
 * one of three offered drafts, verbatim ("Wait line 1" —
 * `docs/target/decisions.json`). The Wait split then made "nobody moves while
 * you're picking" untrue on the top-level list, where she is picking and the
 * clock runs, so on 2026-09-24 Bailey took draft 1a of
 * `docs/concepts/coach/wait-split-lines.md` (D-121), verbatim: every phrase of
 * his D-030 pick, with the calm moved inside a list, where it is true. The
 * bubble goes up as the top-level list opens, and it tells the player what to
 * do there. `CoachLayer.chooseCommand` shows the mark
 * under **both** modes now, reading whichever body is true through
 * {@link ffx2GaugeBody}, and marks it seen the first time it is shown — in
 * whichever mode that was.
 *
 * **Reworded again, 2026-09-25 (D-136).** Bailey, answering the driver's
 * proposal: *"Calling the command menu a list a little weird don't you
 * think?"* D-121's "Open a list and take your time" is superseded by "Pick a
 * command and take your time" — the same instruction, true of the same clock,
 * without naming the on-screen list.
 */
export const FFX2_GAUGE_BODY_ACTIVE = "“Bar's full, she's up — don't wait for me, we all go at once!”";
export const FFX2_GAUGE_BODY_WAIT = "“Bar's full, she's up! Pick a command and take your time, nobody moves.”";
/**
 * Under `?wait=hold` only: Bailey's D-030 Wait pick, verbatim, which he chose
 * for the old whole-menu hold and which is true of it (nobody moves while any
 * menu is open, the top-level list included).
 */
export const FFX2_GAUGE_BODY_HOLD = "“Bar's full, she's up! Take your time, nobody moves while you're picking.”";

/**
 * `ffx2-gauge`'s body for the save's current clock mode — the only line in
 * the deck whose text itself changes with the mode; every other mark's body
 * is fixed. Mirrors {@link briefingLines} and {@link coachRunningBadge}.
 */
export function ffx2GaugeBody(clock: Ffx2CoachClock): string {
  if (clock === 'active') return FFX2_GAUGE_BODY_ACTIVE;
  return clock === 'hold' ? FFX2_GAUGE_BODY_HOLD : FFX2_GAUGE_BODY_WAIT;
}

/**
 * FFX-2's lines. Rikku, and **not one of them holds anything** — they are
 * rendered beside the running party rows and fade on their own while all three
 * gauges keep filling.
 */
export const FFX2_MARKS: readonly CoachMark[] = [
  {
    id: 'ffx2-gauge',
    game: 'ffx2',
    speaker: 'Rikku',
    body: FFX2_GAUGE_BODY_ACTIVE,
    holds: false,
    fadeMs: 5200,
  },
  {
    id: 'ffx2-dressphere',
    game: 'ffx2',
    speaker: 'Rikku',
    // The cost is canon and it is steep: `research/ffx2-combat-core.md` §4.2,
    // "the spherechange **consumes the whole turn**. The ATB gauge is spent and
    // refills from empty" `[verified: 2 sources]`, and the destination must be
    // "one link away". The first draft of this line said "swap any time — it
    // costs her nothing", which is true only of MP and teaches a first-timer to
    // throw away turns in the two hardest chapters (PR-0047). The build's own
    // FFX-2 menu already says the true thing: `ui/ffx2/CommandMenu.ts` styles
    // the Change row as an Overdrive "because §4.5 costs the whole turn".
    body: '“New dress, new moves — but it eats her whole turn, bar back to empty! One step on the grid, so pick the gate that pays.”',
    holds: false,
    fadeMs: 5200,
  },
  {
    id: 'ffx2-chain',
    game: 'ffx2',
    speaker: 'Rikku',
    body: '“Keep hitting the same one! The count climbs, and so does the hurt.”',
    holds: false,
    fadeMs: 5200,
  },
];

/** Every mark in the deck, both games. */
export const ALL_MARKS: readonly CoachMark[] = [...FFX_MARKS, ...FFX2_MARKS];

/**
 * Every id the seen-set can hold, the briefing included.
 *
 * `app/SaveData.ts`'s migration reads this to mark an existing save's owner a
 * veteran, which is why the list lives in the copy deck and not beside the
 * save schema: adding a line adds its id here and nowhere else.
 */
export const ALL_COACH_IDS: readonly CoachMarkId[] = ['briefing', ...ALL_MARKS.map((m) => m.id)];

/**
 * The marks that belong to one game.
 *
 * The guard hard rule 14 asks for: a chapter only ever sees its own game's
 * deck, so an FFX line can never appear in an X-2 chapter and the other way
 * round. `tests/unit/ui-coach-copy.test.ts` asserts both directions.
 */
export function marksFor(game: GameId): readonly CoachMark[] {
  return game === 'ffx' ? FFX_MARKS : FFX2_MARKS;
}

/** One mark by id, or null. */
export function markById(id: string): CoachMark | null {
  return ALL_MARKS.find((m) => m.id === id) ?? null;
}

/** The voice a game teaches in. FFX speaks as Auron, FFX-2 as Rikku. */
export function speakerFor(game: GameId): 'Auron' | 'Rikku' {
  return game === 'ffx' ? 'Auron' : 'Rikku';
}
