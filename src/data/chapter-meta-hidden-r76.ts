/**
 * The pause-screen metadata of the hidden chapters of release 76 and after (2026-11-06), in chapter-number order, gathered here so `./chapter-meta.ts` (at the house 400 lines) takes the whole group with one import and
 * one spread and a later chapter adds its record to this list and not to that file.
 *
 * Game case: shared plumbing (both). Each record is its chapter's: FFX only for the Dark Aeons (34), Penance (35), the Flooded Ways (36), the Sanctuary Keeper (39) and Spherimorph (41); FFX-2 only for the Bevelle Guardians (37), the Farplane Cup (38) and Yuna's Ballad (40).
 *
 * `chapter-meta.ts` spreads {@link HIDDEN_R76_META} at the end of `UNLISTED_CHAPTER_META`. The `ChapterMeta` import is type-only, so there is no cycle.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { DARK_AEONS_META } from './chapter-meta-dark-aeons.ts';
import { PENANCE_META } from './chapter-meta-penance.ts';
import { FLOODED_WAYS_META } from './chapter-meta-flooded-ways.ts';
import { BEVELLE_GUARDIANS_META } from './chapter-meta-ffx2-bevelle-guardians.ts';
import { FARPLANE_CUP_META } from './chapter-meta-ffx2-farplane-cup.ts';
import { SANCTUARY_KEEPER_META } from './chapter-meta-sanctuary-keeper.ts';
import { YUNAS_BALLAD_META } from './chapter-meta-ffx2-yunas-ballad.ts';
import { SPHERIMORPH_META } from './chapter-meta-spherimorph.ts';

/** The hidden chapters' metadata, by chapter number: 34 the Dark Aeons, 35 Penance, 36 the Flooded Ways, 37 the Bevelle Guardians (FFX-2), 38 the Farplane Cup (FFX-2), 39 the Sanctuary Keeper, 40 Yuna's Ballad (FFX-2), 41 Spherimorph (FFX). */
export const HIDDEN_R76_META: readonly ChapterMeta[] = [DARK_AEONS_META, PENANCE_META, FLOODED_WAYS_META, BEVELLE_GUARDIANS_META, FARPLANE_CUP_META, SANCTUARY_KEEPER_META, YUNAS_BALLAD_META, SPHERIMORPH_META];
