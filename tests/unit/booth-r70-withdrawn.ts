/**
 * THE CHAPTERS THE r70 VERDICT PASS TOOK BACK OFF `TREATED_CHAPTERS` (2026-10-31, `docs/handoff/booth-b3.md` section 12; both games: IX and XII are FFX only, V and XI FFX-2 only). A helper, not a test file.
 *
 * **All four came back in release 71's batch 4, the r71 verdict pass (2026-10-31, `docs/handoff/booth-b4.md` section 12) took IX and XII (FFX only) off the list AGAIN, and the `r72-hud` lane (2026-11-01, `docs/handoff/r72-hud.md`) put IX and XII back: `WITHDRAWN_R70` held ONE chapter after that, Chapter XVIII (`sin-face`, FFX only), which the second focused review of the release 71 candidate (R71-C1) took off the list on 2026-11-01 (`booth-b4-r71-sin-face-off.test.ts`) and the `r73-fast` lane put back (2026-11-01, `docs/handoff/r73-fast.md`): the table is EMPTY now (it keeps its first pass's name and is the one the next withdrawal fills):** IX and XII (FFX only) came back in `booth-ffx-b4-hud` (`docs/handoff/booth-ffx-b4-hud.md`: the F1 HUD's
 * layout against their panels was fixed; the r71 browser read found two more overlaps, which `r72-hud` fixed in turn), V and XI (FFX-2 only) in `booth-ffx2-b4-sky` (`docs/handoff/booth-ffx2-b4-sky.md`) with the look held; the two FFX-2 chapters are named in {@link RETURNED_R71}, and {@link itPlays}
 * gates a case on a piece the chapter does not hold (the follower cases of Chapter XI wait for its `cam` hold to lift).**
 *
 * Their rows stay in every table (look, arena, rim, holds, the follower's) and the lane tests that pin what the treatment does in them stay too: each such case is gated with {@link itIf} or {@link describeIf}, which run it while the chapter is on
 * `DemoGate.TREATED_CHAPTERS` and skips it while it is off. Putting one line back therefore turns the lane's own cases back on with no edit, and a regression in the built-but-unread rows shows at that moment.
 */
import { describe, it } from 'vitest';
import { PIECE_HOLDS, TREATED_CHAPTERS, type TreatedPiece } from '../../src/engine/motion/DemoGate.ts';

/** The chapters withdrawn now (none: the r72-hud lane put Chapters IX and XII, FFX only, back on the list and r73-fast put Chapter XVIII, `sin-face`, FFX only, back), each with the game it is (rule 14) and the one-line reason the verdict gave (also the `NOT_YET` text of `booth-treated-chapters.test.ts`). */
export const WITHDRAWN_R70: Readonly<Record<string, { readonly game: 'ffx' | 'ffx2'; readonly why: string }>> = Object.freeze({
  // EMPTY since r73-fast (2026-11-01): Chapter XVIII (`sin-face`, FFX only), the last entry, came back on the list (`docs/handoff/r73-fast.md`: the hops were the house strike at the fast playback speed, kept at its normal length now). The next withdrawal fills this table, with its reason and its lift.
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
    held: ['cam', 'breath', 'moments'], // r72 (`r72-sky`): the look and the arena play with grade C by default (Bailey's pick from stills); release 71 held `hd2d` and `arena` too, and `?skygrade=today` puts them back (`PieceHoldsSky.ts`)
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
