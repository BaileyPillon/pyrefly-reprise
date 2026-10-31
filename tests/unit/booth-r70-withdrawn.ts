/**
 * THE CHAPTERS THE r70 VERDICT PASS TOOK BACK OFF `TREATED_CHAPTERS` THAT ARE STILL OFF (2026-10-31, `docs/handoff/booth-b3.md` section 12): V and XI, FFX-2 only. IX and XII (FFX only) left with them and came back in `booth-ffx-b4-hud` (`docs/handoff/booth-ffx-b4-hud.md`: the F1 HUD's layout against their panels is fixed), so they are no longer in this table. A helper, not a test file.
 *
 * Their rows stay in every table (look, arena, rim, holds, the follower's) and the lane tests that pin what the treatment does in them stay too: each such case is gated with {@link itIf} or {@link describeIf}, which run it while the chapter is on
 * `DemoGate.TREATED_CHAPTERS` and skips it while it is off. Putting one line back therefore turns the lane's own cases back on with no edit, and a regression in the built-but-unread rows shows at that moment.
 */
import { describe, it } from 'vitest';
import { TREATED_CHAPTERS } from '../../src/engine/motion/DemoGate.ts';

/** The chapters still withdrawn, each with the game it is (rule 14) and the one-line reason the verdict gave (also the `NOT_YET` text of `booth-treated-chapters.test.ts`). */
export const WITHDRAWN_R70: Readonly<Record<string, { readonly game: 'ffx' | 'ffx2'; readonly why: string }>> = Object.freeze({
  'ffx2-vegnagun-shuyin': {
    game: 'ffx2',
    why: "FFX-2: out of release 70 (r70 verdict): the HD-2D bold look clips the Farplane's sky to a flat white halo over the colossus frame (a major, introduced) and Shuyin's freeze cannot be read white on white; its rows and holds stay, unread",
  },
  'ffx2-fallen-aeons': {
    game: 'ffx2',
    why: "FFX-2: out of release 70 (r70 verdict): the same clipped halo on the Road's sky whenever the follower brings the spire's burst into frame (a major, introduced); its rows and holds stay, unread",
  },
});

/** Is this chapter on the treated list right now? (True for every chapter that was never withdrawn.) */
export function isListed(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id);
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
