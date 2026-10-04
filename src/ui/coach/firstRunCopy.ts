/**
 * The guided first run's words and seen-ids (fb2-0929 O2, Bailey's pick 2026-09-29:
 * "I'll go with all of your recommendations please"; `docs/target/decisions.json` D-289).
 *
 * Every line is the approved mockup's, word for word
 * (`docs/concepts/fb2-0929/onboard/option.html`, `o2-step*-*.jpg`). Each step has a
 * pointer wording and a touch wording, swapped by `(pointer: coarse)` the way the coach
 * line's own ENTER / TAP foot is (`coach-taps.css`).
 *
 * Step 3 has no quote of its own: it wears Auron's approved first-command line
 * (`coachCopy.ts` `ffx-turn-order`) unchanged, so one voice speaks (the brief).
 *
 * Game case: steps 1 and 2 **both** (the board and party prep are shared); step 3
 * **FFX only** (Chapter I is FFX, and the line it joins is FFX's holding line).
 *
 * Pure data: no DOM, no save store.
 */

/** The three seen-ids, stored in the save's existing `seenCoach` list. */
export type FirstRunId = 'firstrun-board' | 'firstrun-prep' | 'firstrun-battle';

export const FIRST_RUN_IDS: readonly FirstRunId[] = ['firstrun-board', 'firstrun-prep', 'firstrun-battle'];

/** One step's words. `quote` is null for step 3, which wears the approved coach line. */
export interface FirstRunStep {
  readonly id: FirstRunId;
  readonly n: 1 | 2 | 3;
  readonly quote: string | null;
  /** The plain line under the quote: pointer wording, then touch wording. */
  readonly line: { readonly pointer: string; readonly touch: string };
  /** Step 3 only: the gold instruction under the plain line. */
  readonly act: { readonly pointer: string; readonly touch: string } | null;
}

export const FIRST_RUN_STEPS: readonly [FirstRunStep, FirstRunStep, FirstRunStep] = [
  {
    id: 'firstrun-board',
    n: 1,
    quote: '“Start with the first one.”',
    line: {
      pointer: 'Click its picture to begin. The others wait on the board.',
      touch: 'Tap its picture to begin. The other fights wait on the board.',
    },
    act: null,
  },
  {
    id: 'firstrun-prep',
    n: 2,
    quote: '“Your party is ready.”',
    line: { pointer: 'The tabs are for later. Start the battle.', touch: 'Tabs are for later. Tap START BATTLE.' },
    act: null,
  },
  {
    id: 'firstrun-battle',
    n: 3,
    quote: null,
    line: { pointer: 'Your turn.', touch: 'Your turn.' },
    act: { pointer: 'Pick ATTACK, then pick who it hits.', touch: 'Tap ATTACK, then tap who it hits.' },
  },
];

/**
 * Step 1's quote when the chapter on the plate is not Chapter I (judgment call M of critic round 21,
 * PR-0289; Bailey 2026-10-04, "all your recommendations"). D-289's approved line, "Start with the first
 * one.", stays exactly as it is whenever Chapter I is the selected chapter, which is where a first run
 * begins; once the cursor moves to any other chapter "the first one" would point at a row that is not
 * the plate's, so the card says "this one" instead. Text only: the card's place is unchanged.
 */
export const FIRST_RUN_BOARD_QUOTE_OTHER = '“Start with this one.”';

/**
 * Which quote step 1 wears for the chapter on the plate (`.fe-hero`'s `data-chapter-number`, the chapter's
 * number in the registry: 1 is Chapter I). Chapter I, or a plate that does not say (no number), keeps the
 * approved line; any other chapter says "this one". Both games: the board is shared.
 */
export function firstRunBoardQuote(chapterNumber: number | null | undefined): string {
  const approved = FIRST_RUN_STEPS[0].quote ?? FIRST_RUN_BOARD_QUOTE_OTHER;
  if (chapterNumber === null || chapterNumber === undefined || !Number.isFinite(chapterNumber)) return approved;
  return chapterNumber === 1 ? approved : FIRST_RUN_BOARD_QUOTE_OTHER;
}

/** The eyebrow over every step: the speaker and the count. */
export function firstRunEyebrow(n: 1 | 2 | 3): string {
  return `Auron · ${n} of 3`;
}

/** The skip words: the key on a pointer screen, "Tap here" on a touch screen. */
export const FIRST_RUN_SKIP = { pointer: 'Esc', touch: 'Tap here', rest: 'skip the guide' } as const;
