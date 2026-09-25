/**
 * Pause-screen and prebattle-tab metadata — Seymour and Anima, Macalania
 * Temple (FFX) [research/ffx-seymour-anima-macalania.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Nothing here is true of FFX-2.
 *
 * **Registered** in `./chapter-meta.ts`'s `CHAPTER_META` by the integrator
 * (`docs/handoff/chapter-macalania.md`), now a real `ChapterMeta`: the
 * `DraftChapterMeta` relaxation of `id`/`numeral` went away once
 * `src/data/encounters.ts` widened `ChapterId` and the chapter took number 7
 * (display order, after the six already registered — the D-018 rule Leblanc
 * followed). The chapter stays LOCKED as COMING on chapter select until
 * Bailey's three open picks land (`MACALANIA_OPEN_PICKS` in `./chapter-macalania-ship.ts`:
 * the pause plate, the scene cue and the party layout).
 *
 * `heroArt` is the installed pause plate, `public/art/pause/macalania.png`
 * (+ `.2x.webp`). It is the one Chapter VII painting D-141 did not approve: its
 * redo options wait on Bailey, and the pick installs over the same path, so this
 * id does not change. It used to name `pause/ch7-seymour-anima-macalania`, which
 * was never rendered (critic pass on 62b4927). `heroArtFallback` (shown only if
 * the plate fails to load) is the approved human-form speaker portrait
 * `portraits/seymour-macalania.png` (D-065), not the Flux-era `portraits/seymour.png`.
 *
 * `musicKeys` name the cues the chapter routes (`./chapter-seymour-anima-macalania.ts`
 * `music`): `MACALANIA_SCENE_CUE`, today Chapter 1's `scene-gagazet` as a recorded
 * stopgap for the unbuilt `scene-macalania-temple` (preflight §6.3), the chapter's
 * own battle cue `boss-seymour-macalania` (2026-09-24, FFX only), and the shared
 * `victory-ffx`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { MACALANIA_SCENE_CUE } from './chapter-macalania-ship.ts';

/**
 * Seymour and Anima — Macalania Temple.
 * Beats: `research/ffx-seymour-anima-macalania.md` §9 (scene), §5 (three
 * acts). Strategies: §7 (the numbered player-strategy table cited row by row
 * below).
 */
export const SEYMOUR_ANIMA_MACALANIA_META: ChapterMeta = {
  id: 'seymour-anima-macalania',
  gameLabel: 'FFX',
  numeral: 'VII',
  title: 'Seymour and Anima',
  subtitle: 'The Second Refusal',
  location: 'Macalania Temple',
  blurb:
    'Seymour offers the pilgrimage a second time, and this time he does not ask — he calls Anima up ' +
    "through the chamber floor to make the answer for him. What she does to a party is not what she " +
    'does to the aeon summoned to stand in front of them, and the fight is built entirely out of that gap.',
  heroArt: 'pause/macalania',
  heroArtFallback: 'portraits/seymour-macalania.png',
  quote: {
    text: 'You already know the ending. I am only asking you to stop pretending otherwise.',
    speaker: 'Seymour',
  },
  handwritten: 'she was chained the whole time',
  objectives: [
    {
      id: 'down-both-guardians',
      label: 'Down both Guado Guardians',
      rule: { kind: 'parts-downed', targetIds: ['guado-guardian-a', 'guado-guardian-b'] },
    },
    {
      id: 'survive-pain',
      label: "Survive Anima's Pain",
      rule: { kind: 'survived-ability', ability: 'anima-pain-boss' },
    },
    {
      id: 'defeat-seymour-and-anima',
      label: 'Defeat Seymour and Anima',
      rule: { kind: 'victory' },
    },
  ],
  tip: 'Steal from each Guardian once — it ends the 1,000 HP Auto-Potion counter and the Hi-Potion Seymour gets below 4,800 HP, and it costs nothing but a turn.',
  snapshots: [
    { image: 'backdrops/macalania-temple.png', caption: 'the chamber floor opens' },
    { image: 'characters/anima/idle.png', caption: 'chained, drawn up regardless' },
    { image: 'characters/seymour-macalania/idle.png', caption: 'unhurried, still unhurried' },
  ],
  focalCharacterId: 'seymour',
  musicKeys: [MACALANIA_SCENE_CUE, 'boss-seymour-macalania', 'victory-ffx'],
};

export default SEYMOUR_ANIMA_MACALANIA_META;
