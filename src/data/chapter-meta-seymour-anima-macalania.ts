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
 * Bailey approves its art.
 *
 * `heroArt`/`heroArtFallback`/snapshot images point at art already rendered
 * to `public/art/` from the chapter's engine-and-data pass (`074a198`) — that
 * pass shipped combat sprites, not this screen's close-up, so `heroArt` has
 * no file yet and the screen falls back to the existing portrait, same
 * convention every other chapter's `heroArt` follows before its own close-up
 * is painted. These are CANDIDATE assets (`docs/target/targets.json`): none
 * of Macalania's art is Bailey-approved yet.
 *
 * `musicKeys` name the cues the chapter actually routes today
 * (`./chapter-seymour-anima-macalania.ts` `music`): Chapter 1's
 * `scene-gagazet` and `boss-seymour` as a recorded stopgap, plus the shared
 * `victory-ffx`. The chapter's own two cues (`scene-macalania-temple`,
 * `boss-seymour-macalania`, preflight §6.3) are new compositions that do not
 * exist yet; when the audio track lands them, swap both here and there.
 */

import type { ChapterMeta } from './chapter-meta.ts';

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
  heroArt: 'pause/ch7-seymour-anima-macalania',
  heroArtFallback: 'portraits/seymour.png',
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
  musicKeys: ['scene-gagazet', 'boss-seymour', 'victory-ffx'],
};

export default SEYMOUR_ANIMA_MACALANIA_META;
