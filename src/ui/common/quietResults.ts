/**
 * QUIETER RESULTS for one fight (release 61, the conference demo build; FFX-2 only, Chapter IV, Bahamut).
 *
 * Bailey, 2026-10-21 ~00:15 EDT (decision 168d), his pick "Quieter results for this fight (Recommended)": the FFX-2 Bahamut chapter's results get a softer cue and a neutral or sombre
 * Rikku portrait, everything else unchanged (review issues PR-0482 and PR-0485). Game case: FFX-2 ONLY, from the sources: `research/ffx-vs-ffx2-presentation.md` section 2.2 (the girls do
 * not pose at all after Bahamut, FF Wiki "Final Fantasy X-2 victory poses"; both games withhold the celebration when the story is grave), and the chapter's own post scene ("No victory pose.
 * No fanfare. The music simply stops", `story/scripts/ffx2-bahamut.ts`). No FFX chapter and no other FFX-2 chapter is listed here, so every other results screen is exactly what it was.
 *
 * What it changes, and only with the assets the game already has:
 *
 *  - **The cue.** Chapter IV's results play `pause` instead of `victory-bahamut`. `pause` is the quietest cue in the library (`docs/audio/THEMES.md` row 3, "The game holding its breath":
 *    the hymn's bars 1 to 8, a solo soprano on the tune over a tenor drone at 0.25, no alto, no bass, no percussion; E Aeolian, 46 bpm; `public/audio/manifest.json`: 49.96 s, intro 5.217 s,
 *    loop to 46.957 s; the cue of the pause menu, shared by both games), and it is the project's own named stand-in for exactly this slot (`audio/tracks/index.ts`: `victory-bahamut` falls
 *    back to `pause`, "sparse and calm"). `victory-bahamut` (76 bpm, a solo piano, a string swell and a cello, a minor key that "opens toward the major", brief VB-A) stays in the library,
 *    untouched, so going back is deleting one entry of {@link QUIET_RESULTS}. Nobody here heard either (hard rule 13): Bailey can judge them by ear.
 *  - **The Rikku portrait.** On the results ledger Rikku's face tile is her X-2 portrait (`portraits/rikku-x2.png`), a wide grin. No Rikku portrait in the game is neutral or sombre (every
 *    plate in `public/art/portraits` was drawn "cheerful grin", and so are her pause plate and her Thief idle), so the tile shows the head of her DARK KNIGHT painting instead: the
 *    dressphere she wears in this very chapter (`ffx2/builds/bevelle.ts`), an existing painting whose face is calm and closed-mouthed (no teeth), cropped by the measured `face-crops.json` row
 *    "Chapter 4 and 5's Rikku". It is the body layer of the same face ladder (`partyFace.ts`) with the portrait rung left out. The results wedge is Yuna (the chapter's leader) and is unchanged.
 *
 * The post-battle dialogue is not touched ("...Yunie." still shows Rikku's dialogue portrait): that is a story scene, not the results screen.
 *
 * No `three`, no DOM; pure data.
 */

/** What one fight's quiet results change. */
export interface QuietResults {
  /** The music cue the results screen plays on a WIN, instead of the chapter's own `music.victory`. A defeat keeps its own cue (`defeat-ffx2`). */
  readonly cue: string;
  /** Party members (build ids) whose results face is the head of their dressphere's painting rather than their grinning portrait, on a win and on a loss. */
  readonly bodyFaces: readonly string[];
}

/** Chapter id to what it changes. Chapter IV only: every chapter not named here is untouched. */
export const QUIET_RESULTS: Readonly<Record<string, QuietResults>> = {
  'ffx2-bahamut': { cue: 'pause', bodyFaces: ['rikku'] },
};

/** The quiet-results record of a chapter, or null for every other chapter (and for none). */
export function quietResultsOf(chapterId: string | undefined): QuietResults | null {
  return chapterId !== undefined && Object.prototype.hasOwnProperty.call(QUIET_RESULTS, chapterId) ? QUIET_RESULTS[chapterId]! : null;
}
