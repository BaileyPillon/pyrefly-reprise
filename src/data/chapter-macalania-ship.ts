/**
 * Chapter VII — Seymour and Anima, Macalania Temple: **what the unlock still waits on**, and the one
 * place each of Bailey's three open picks lands in code.
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
 * `MACALANIA_FIGURE_BLOOM_MASK`), the speaker portrait (D-065).
 *
 * **Open with Bailey (three picks, all prepared):**
 * 1. **The pause plate redo** (D-141 excepted it): options A, A2, B, C on
 *    `docs/concepts/chapters/macalania/unlock/pause-plate-redo.jpg`. The pick installs over
 *    `public/art/pause/macalania.*` in place, so `heroArt` does not change.
 * 2. **The scene cue** (`scene-macalania-temple`, preflight §6.3): three sketches A/B/C at the top
 *    of `docs/audio/audition.html` (rule 13: Bailey judges by ear). The picked sketch is composed
 *    into a registered track, and then {@link MACALANIA_SCENE_CUE} names it. That one constant is
 *    what the chapter's `music.scene`, the pre-battle `music()` step and the meta's `musicKeys`
 *    read, so they cannot disagree.
 * 3. **The party layout** (found 2026-09-25 by the ship frames, the R13-04 / PR-0002 defect class):
 *    the scene's party arc is Chapter I's from before D-041 and is not held, so the FFX command
 *    stack covers Yuna's and Tidus's heads and torsos at the first menu. Options current, A, B
 *    (recommended), C on `docs/concepts/chapters/macalania/unlock/party-layout/sheet.jpg`, measured
 *    live. All four are built as staging data in `src/scenes/macalania-temple-layout.ts`
 *    (repair cycle 1, 2026-09-25); the pick lands as one constant there, `MACALANIA_PARTY_LAYOUT`,
 *    which stays `'current'` until Bailey picks. The unlock test refuses the lock line's removal
 *    while it is still `'current'`.
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

/** The picks only Bailey can make; the driver deletes the lock line once all three are in. */
export const MACALANIA_OPEN_PICKS: readonly MacalaniaOpenPick[] = [
  {
    id: 'pause-plate',
    decision: 'D-141 (pause plate excepted, redo)',
    candidates: 'docs/concepts/chapters/macalania/unlock/pause-plate-redo.jpg',
    lands: 'public/art/pause/macalania.* (install in place; lock in approved-hashes.json)',
  },
  {
    id: 'scene-cue',
    decision: 'plan §6.3 scene-macalania-temple (by ear, rule 13)',
    candidates: 'docs/audio/audition.html (macalania-scene section, sketches 2026-09-24 A/B/C)',
    lands: 'MACALANIA_SCENE_CUE in src/data/chapter-macalania-ship.ts, after the track is registered',
  },
  {
    id: 'party-layout',
    decision: 'D-041 / D-144 recipe for a new chapter (R13-04 class: party under the FFX command stack)',
    candidates: 'docs/concepts/chapters/macalania/unlock/party-layout/sheet.jpg',
    lands: "MACALANIA_PARTY_LAYOUT in src/scenes/macalania-temple-layout.ts (all four options built; set the picked id)",
  },
];
