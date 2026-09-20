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
 * Pure data and pure functions: no DOM, no save store, no `three`.
 */

import type { GameId } from '../../battle/common/types.ts';

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

export const BRIEFING_LINES: readonly BriefingLine[] = [
  { lead: '“Five fights. That is all this is.', strong: '', tail: '' },
  { lead: 'In mine, ', strong: 'nothing moves until you move', tail: ' —' },
  { lead: 'read the list, take your time.', strong: '', tail: '' },
  { lead: 'In hers, ', strong: 'the clock does not wait', tail: '.”' },
];

/** How long the briefing runs if nobody touches anything, in milliseconds. */
export const BRIEFING_MS = 20_000;

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
 * FFX-2's lines. Rikku, and **not one of them holds anything** — they are
 * rendered beside the running party rows and fade on their own while all three
 * gauges keep filling.
 */
export const FFX2_MARKS: readonly CoachMark[] = [
  {
    id: 'ffx2-gauge',
    game: 'ffx2',
    speaker: 'Rikku',
    body: "“Bar's full, she's up — don't wait for me, we all go at once!”",
    holds: false,
    fadeMs: 5200,
  },
  {
    id: 'ffx2-dressphere',
    game: 'ffx2',
    speaker: 'Rikku',
    body: '“New dress, new moves! Swap any time — it costs her nothing.”',
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
