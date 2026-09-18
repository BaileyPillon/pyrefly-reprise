/**
 * The FFX-2 prep menu's registered panels.
 *
 * Until now there were none: `PartyPrepScreen` fell back to its own stat sheet
 * for every X-2 chapter, and `src/ui/ffx2/PartyPrep.ts` (the dressphere /
 * Garment Grid / accessories menu) was never wired into the shell at all. This
 * module is the registration point that was missing, and it starts with the
 * one tab that is game-agnostic — the chapter briefing, the same component the
 * FFX side registers (`src/ui/ffx/party-prep/ChapterPanel.ts`).
 *
 * Whoever adopts `mountFFX2PartyPrep` into the Ink & Gold frame adds its tabs
 * here beside this one, with `fullScreen: false` so they compose into the
 * shell rather than replacing it.
 *
 * Imported for its side effect from `src/ui/ffx/party-prep/index.ts`, which is
 * the single prep-registration module `main.ts` loads.
 */

import { registerPrepPanel } from '../../../app/screens/PartyPrepScreen.ts';
import { makeChapterPanel } from '../../ffx/party-prep/ChapterPanel.ts';

registerPrepPanel(makeChapterPanel('ffx2'));
