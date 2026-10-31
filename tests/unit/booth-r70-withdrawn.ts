/**
 * THE CHAPTERS THE r70 VERDICT PASS TOOK BACK OFF `TREATED_CHAPTERS` (2026-10-31, `docs/handoff/booth-b3.md` section 12; both games: IX and XII are FFX only, V and XI FFX-2 only) THAT ARE STILL OFF IT. A helper, not a test file.
 *
 * **Chapters V (`ffx2-vegnagun-shuyin`) and XI (`ffx2-fallen-aeons`) came back in `booth-ffx2-b4-sky` (FFX-2 only, `docs/handoff/booth-ffx2-b4-sky.md`) with the look held, so only IX and XII are withdrawn now; the two that returned
 * are named in {@link RETURNED_R71}, and {@link itPlays} gates a case on a piece the chapter does not hold (the follower cases of Chapter XI wait for its `cam` hold to lift).**
 *
 * Their rows stay in every table (look, arena, rim, holds, the follower's) and the lane tests that pin what the treatment does in them stay too: each such case is gated with {@link itIf} or {@link describeIf}, which run it while the chapter is on
 * `DemoGate.TREATED_CHAPTERS` and skips it while it is off. Putting one line back therefore turns the lane's own cases back on with no edit, and a regression in the built-but-unread rows shows at that moment.
 */
import { describe, it } from 'vitest';
import { PIECE_HOLDS, TREATED_CHAPTERS, type TreatedPiece } from '../../src/engine/motion/DemoGate.ts';

/** The withdrawn chapters, each with the game it is (rule 14) and the one-line reason the verdict gave (also the `NOT_YET` text of `booth-treated-chapters.test.ts`). */
export const WITHDRAWN_R70: Readonly<Record<string, { readonly game: 'ffx' | 'ffx2'; readonly why: string }>> = Object.freeze({
  'yojimbo-cavern': {
    game: 'ffx',
    why: 'FFX: out of release 70 (r70 verdict): the Zanmato gauge panel ends against the F1 turn strip (a major, introduced, a regression against release 69); its rows and holds stay, unread',
  },
  'seymour-omnis': {
    game: 'ffx',
    why: "FFX: out of release 70 (r70 verdict): the Enemy Intent card clips the acting hero's HP numeral against the F1 party panel (a major, introduced, a regression against release 69); its rows and holds stay, unread",
  },
});

/**
 * The two chapters the r70 verdicts took off the list and `booth-ffx2-b4-sky` put back (FFX-2 only, rule 14), each with the r70 reason it left for and the pieces it comes back holding (the look: `hd2d` and `arena`, the two pieces that put light on the plate;
 * Chapter XI also the camera, whose follower crops Yuna where release 69's frame never does). The reasons are the verdict's own words, kept as the record of what the holds answer.
 */
export const RETURNED_R71: Readonly<Record<string, { readonly game: 'ffx2'; readonly was: string; readonly held: readonly string[] }>> = Object.freeze({
  'ffx2-vegnagun-shuyin': {
    game: 'ffx2',
    was: "FFX-2: out of release 70 (r70 verdict): the HD-2D bold look clips the Farplane's sky to a flat white halo over the colossus frame (a major, introduced) and Shuyin's freeze cannot be read white on white",
    held: ['hd2d', 'arena', 'cam', 'breath', 'moments'],
  },
  'ffx2-fallen-aeons': {
    game: 'ffx2',
    was: "FFX-2: out of release 70 (r70 verdict): the same clipped halo on the Road's sky whenever the follower brings the spire's burst into frame (a major, introduced)",
    held: ['hd2d', 'arena', 'cam', 'breath', 'moments'],
  },
});

/** Is this chapter on the treated list right now? (True for every chapter that was never withdrawn, and for the two that returned.) */
export function isListed(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id);
}

/**
 * `itPlays(id, piece)` is vitest's `it` while the chapter is on the list AND does not hold that piece, and `it.skip` otherwise: a case that needs a piece to play (Chapter XI's follower camera cases need `cam`) is written once and turns on, with no
 * edit, the day the hold is lifted.
 */
export const itPlays = (id: string, piece: TreatedPiece): typeof it => (playsPiece(id, piece) ? it : (it.skip as unknown as typeof it));

/** Does the treatment play this piece in this chapter, under the `all` scope: the chapter is listed and does not hold the piece. (The predicate behind {@link itPlays}.) */
export function playsPiece(id: string, piece: TreatedPiece): boolean {
  return isListed(id) && PIECE_HOLDS[id]?.[piece] === undefined;
}

/**
 * `itIf(id)` is vitest's `it` while the chapter is on the list and `it.skip` while it is off (the same for {@link describeIf}): `itIf('seymour-omnis')('plays the HUD', () => { ... })`. A case a lane wrote for a withdrawn chapter
 * therefore turns back on, with no edit, the day one line puts the chapter back.
 */
export const itIf = (id: string): typeof it => (isListed(id) ? it : (it.skip as unknown as typeof it));

/** `describe` while the chapter is on the list, `describe.skip` while it is off. */
export const describeIf = (id: string): typeof describe => (isListed(id) ? describe : (describe.skip as unknown as typeof describe));

/** The treated chapters of a list of ids: the ids still on the list, in order (a lane's `for (const id of [...])` loop reads this). */
export function stillListed<T extends string>(ids: readonly T[]): T[] {
  return ids.filter((id) => isListed(id));
}
