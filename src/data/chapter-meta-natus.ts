/**
 * Pause-screen and prebattle-tab metadata — Chapter X, Seymour Natus, on the
 * Highbridge of Bevelle (FFX) [research/ffx-seymour-natus-highbridge.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, Banish, Trigger
 * Commands and the FFX status set; research §0.3: FFX-2 has no Natus, no
 * Mortibody and no Highbridge boss.
 *
 * - `title` "Seymour Natus" and `location`: B1 (D-077), the chapter record's own.
 * - `subtitle`, `blurb`, `handwritten` and `tip` are our own words over the
 *   research's sourced facts (§8.2 beats 7-9; §1.1 Defense 0; §3 and §5
 *   Break then the Claw's shatter; §4.3 Haste on all three calls Desperado,
 *   so the line is §6.3 row 7, Haste only two: Tidus and Auron).
 * - `quote` is line 19 of `docs/plans/natus-story-draft.md`, an `[ORIGINAL]`
 *   line in Kimahri's voice (writing-bible §1.7), and the line the pre scene
 *   (`src/story/scripts/seymour-natus.ts`) actually plays.
 * - `heroArt` is the installed hero plate B (D-156, judge-locked):
 *   `public/art/pause/ch10-seymour-natus.png`. `heroArtFallback` is Kimahri's
 *   approved portrait: the chapter's hook is his stand (research §8.3).
 * - `snapshots` are the installed Chapter X art: the Highbridge plate (O-3 C,
 *   D-095), Natus's hero cast (D-126) and Mortibody's idle (O-2 A, D-094).
 * - `objectives` follow the research's sourced strategies (§6.3): Soften the
 *   stone before the Claw lands (strategy 4, §5), live through phase 3's
 *   Flare, and the win. The choice of these three rows is **ours** (the plan
 *   names none); each rule is one `src/ui/common/chapterObjectives.ts`
 *   already answers.
 * - `musicKeys` are the cues the chapter plays: `scene-gagazet` (the record's
 *   stand-in under the narration), `boss-seymour-macalania` (B15's stand-in,
 *   D-091, until a Natus cue is picked by ear) and the shared `victory-ffx`.
 *
 * **Listed** 2026-09-25 with the chapter itself: it sits in `./chapter-meta.ts`'s
 * `CHAPTER_META` after Chapter IX's, as the chapter sits after Chapter IX in `CHAPTERS`.
 */

import type { ChapterMeta } from './chapter-meta.ts';

/** Chapter X — Seymour Natus, the north end of the Highbridge of Bevelle. */
export const NATUS_META: ChapterMeta = {
  id: 'seymour-natus',
  gameLabel: 'FFX',
  numeral: 'X',
  title: 'Seymour Natus',
  subtitle: 'The Guardians Turn Back',
  location: 'Highbridge of Bevelle — before the Main Gate',
  blurb:
    'Seymour waits at the end of the bridge with Maester Kinoc dead at his feet, offering Yuna death as a mercy. ' +
    'Kimahri stands his ground alone, and the others turn back for him.',
  heroArt: 'pause/ch10-seymour-natus',
  heroArtFallback: 'portraits/kimahri.png',
  quote: {
    text: 'Yuna goes. Kimahri stays.',
    speaker: 'Kimahri',
  },
  handwritten: 'nobody is left behind here',
  objectives: [
    {
      // Strategy 4 [§6.3, verified: 2 sources]: a Soft or Esuna at once, before
      // the Claw's 90 % shatter [§3, §5, decompiled].
      id: 'soften-the-stone',
      label: 'Soften the stone',
      rule: { kind: 'status-cured', status: 'petrify' },
    },
    {
      // Phase 3 [§4.1, verified: 3 sources]: Flare on one guardian, about 2,000 [§3.3].
      id: 'survive-flare',
      label: 'Survive Flare',
      rule: { kind: 'survived-ability', ability: 'natus-flare' },
    },
    {
      id: 'defeat-natus',
      label: 'Defeat Seymour Natus',
      rule: { kind: 'victory' },
    },
  ],
  tip: 'He has no Defense, so every swing lands in full. Soften a stone guardian at once, and Haste only Tidus and Auron.',
  snapshots: [
    { image: 'backdrops/bevelle-highbridge.png', caption: 'the city lit at night' },
    { image: 'characters/seymour-natus/cast.png', caption: 'no longer a man' },
    { image: 'characters/mortibody/idle.png', caption: 'Mortibody always comes back' },
  ],
  focalCharacterId: 'kimahri',
  musicKeys: ['scene-gagazet', 'boss-seymour-macalania', 'victory-ffx'],
};

export default NATUS_META;
