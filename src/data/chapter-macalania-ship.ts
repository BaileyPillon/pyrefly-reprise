/**
 * Chapter VII — Seymour and Anima, Macalania Temple: **what the unlock still waits on**, and the one
 * place each of Bailey's picks lands in code.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Macalania Temple, human-form Seymour, the Guado
 * Guardians (`research/ffx-seymour-anima-macalania.md`). No FFX-2 chapter reads this module.
 *
 * **The switch.** The chapter is registered and playable (`__pyrefly.gotoChapter`), and chapter
 * select shows it as a COMING card while `'seymour-anima-macalania'` is in
 * `src/app/screens/frontend/comingChapters.ts`'s `LOCKED_CHAPTER_IDS`. Deleting that one line is
 * the unlock, and nothing else in code has to change with it (rehearsed with real keys, the lock
 * removed in the page only: `docs/handoff/chapter-macalania.md`, "Unlock rehearsal").
 *
 * **Settled (no pick owed):** every battle painting and the backdrop (D-141, locked as
 * `chapter:macalania:2026-09-25`), Anima's folder (D-108 / D-150, locked as
 * `chapter:macalania-anima:2026-09-25`), the stone look (D-149), Petrify option A (D-141), the
 * battle cue "The Courtesy" (D-048), the Guardian's bloom (masked on this stage,
 * `MACALANIA_FIGURE_BLOOM_MASK`), the speaker portrait (D-065), and two of the three picks the ship
 * layer prepared, both answered by Bailey on 2026-09-25 ~18:30 EDT, verbatim "All your
 * recommendations":
 * - **The pause plate redo: A2** (the recommendation was A2 if an independent judge passes it,
 *   otherwise A; the judge passed A2 at 7.4, `docs/concepts/chapters/macalania/pause-plate-redo/
 *   JUDGE-A2.md`). Installed over `public/art/pause/macalania.*` in place, so `heroArt` does not
 *   change, and locked as `chapter:macalania-pause:2026-09-25` in `docs/target/approved-hashes.json`.
 * - **The party layout: B** (`docs/concepts/chapters/macalania/unlock/party-layout/sheet.jpg`): the
 *   party re-laid right of the FFX command stack and held, the three ground fiends pinned one step
 *   right and back. It lands as `MACALANIA_PARTY_LAYOUT = 'b'` in
 *   `src/scenes/macalania-temple-layout.ts`.
 *
 * **Open with Bailey (one pick):**
 * - **The scene cue** (`scene-macalania-temple`, preflight §6.3): three sketches A/B/C at the top
 *   of `docs/audio/audition.html` (rule 13: Bailey judges by ear). The picked sketch is composed
 *   into a registered track, and then {@link MACALANIA_SCENE_CUE} names it. That one constant is
 *   what the chapter's `music.scene`, the pre-battle `music()` step and the meta's `musicKeys`
 *   read, so they cannot disagree. **The chapter stays locked until this pick lands** (Bailey,
 *   2026-09-25).
 */

/** Chapter I's scene cue, played here as a recorded stopgap until the pick lands. */
export const MACALANIA_SCENE_CUE_STAND_IN = 'scene-gagazet';

/** The preflight's name for the chapter's own scene cue (§6.3); not a registered track yet. */
export const MACALANIA_SCENE_CUE_PLANNED = 'scene-macalania-temple';

/**
 * The cue Chapter VII's scenes play (prep, the pre-battle scene's opening). The stand-in until
 * Bailey's sketch pick is composed and registered; then this becomes
 * {@link MACALANIA_SCENE_CUE_PLANNED}. A test pins that it always names a registered track.
 */
export const MACALANIA_SCENE_CUE: string = MACALANIA_SCENE_CUE_STAND_IN;

/** One pick the unlock waits on, and where its candidates are. */
export interface MacalaniaOpenPick {
  readonly id: 'pause-plate' | 'scene-cue' | 'party-layout';
  readonly decision: string;
  readonly candidates: string;
  readonly lands: string;
}

/**
 * The picks only Bailey can make; the driver deletes the lock line once none is left. The pause
 * plate (A2) and the party layout (B) were answered on 2026-09-25; the scene cue is still open.
 */
export const MACALANIA_OPEN_PICKS: readonly MacalaniaOpenPick[] = [
  {
    id: 'scene-cue',
    decision: 'plan §6.3 scene-macalania-temple (by ear, rule 13)',
    candidates: 'docs/audio/audition.html (macalania-scene section, sketches 2026-09-24 A/B/C)',
    lands: 'MACALANIA_SCENE_CUE in src/data/chapter-macalania-ship.ts, after the track is registered',
  },
];
