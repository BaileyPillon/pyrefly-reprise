/**
 * Chapter VII — Seymour and Anima, Macalania Temple: **the picks the unlock waited on**, and the one
 * place each of them lands in code.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Macalania Temple, human-form Seymour, the Guado
 * Guardians (`research/ffx-seymour-anima-macalania.md`). No FFX-2 chapter reads this module.
 *
 * **Unlocked 2026-09-29.** The chapter was registered and playable (`__pyrefly.gotoChapter`) while
 * chapter select showed it as a COMING card, because `'seymour-anima-macalania'` was in
 * `src/app/screens/frontend/comingChapters.ts`'s `LOCKED_CHAPTER_IDS`. That line is gone now, the
 * one-line unlock rehearsed with real keys in `docs/handoff/chapter-macalania.md` ("Unlock
 * rehearsal"), once the last pick below landed.
 *
 * **Settled:** every battle painting and the backdrop (D-141, locked as
 * `chapter:macalania:2026-09-25`), Anima's folder (D-108 / D-150, locked as
 * `chapter:macalania-anima:2026-09-25`), the stone look (D-149), Petrify option A (D-141), the
 * battle cue "The Courtesy" (D-048), the Guardian's bloom (masked on this stage,
 * `MACALANIA_FIGURE_BLOOM_MASK`), the speaker portrait (D-065), and the three picks the ship layer
 * prepared:
 * - **The pause plate redo: A2** (Bailey, 2026-09-25 ~18:30 EDT, "All your recommendations"; the
 *   judge passed A2 at 7.4, `docs/concepts/chapters/macalania/pause-plate-redo/JUDGE-A2.md`).
 *   Installed over `public/art/pause/macalania.*` in place, locked as
 *   `chapter:macalania-pause:2026-09-25` in `docs/target/approved-hashes.json`.
 * - **The party layout: B** (the same answer; `docs/concepts/chapters/macalania/unlock/party-layout/
 *   sheet.jpg`): `MACALANIA_PARTY_LAYOUT = 'b'` in `src/scenes/macalania-temple-layout.ts`.
 * - **The scene cue: sketch A "The Frozen Temple" in remaster R1 "focus"** (D-278, superseding
 *   D-190). Bailey, 2026-09-28 ~22:45 EDT: "ok well when you come back with r1, r2, and r3, i'll go
 *   with your pick for chapter VII, godspeed." The driver's pick, made from measurements and the
 *   sketch briefs, not by ear (rule 13); Bailey can swap it. Registered as the track
 *   `scene-macalania-temple` (`src/audio/tracks/scene-macalania-temple.ts`, the shipped MP3 from
 *   `tools/audio/remaster-ship.py`), and {@link MACALANIA_SCENE_CUE} names it. That one constant is
 *   what the chapter's `music.scene`, the pre-battle `music()` step and the meta's `musicKeys` read,
 *   so they cannot disagree.
 */

/** Chapter I's scene cue, which Chapter VII played as a recorded stopgap until its own cue landed. */
export const MACALANIA_SCENE_CUE_STAND_IN = 'scene-gagazet';

/** The preflight's name for the chapter's own scene cue (§6.3); registered on 2026-09-29 (D-278). */
export const MACALANIA_SCENE_CUE_PLANNED = 'scene-macalania-temple';

/**
 * The cue Chapter VII's scenes play (prep, the pre-battle scene's opening): the chapter's own
 * `scene-macalania-temple`. A test pins that it always names a registered track.
 */
export const MACALANIA_SCENE_CUE: string = MACALANIA_SCENE_CUE_PLANNED;

/** One pick the unlock waited on, and where its candidates are. */
export interface MacalaniaOpenPick {
  readonly id: 'pause-plate' | 'scene-cue' | 'party-layout';
  readonly decision: string;
  readonly candidates: string;
  readonly lands: string;
}

/**
 * The picks still open before the unlock. Empty: the pause plate (A2) and the party layout (B)
 * were answered on 2026-09-25, the scene cue on 2026-09-29 (D-278), and the lock line is deleted.
 */
export const MACALANIA_OPEN_PICKS: readonly MacalaniaOpenPick[] = [];
