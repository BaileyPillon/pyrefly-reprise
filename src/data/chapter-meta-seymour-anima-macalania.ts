/**
 * Pause-screen and prebattle-tab metadata — Seymour and Anima, Macalania
 * Temple (FFX) [research/ffx-seymour-anima-macalania.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Nothing here is true of FFX-2.
 *
 * **Status: written, green, and deliberately registered nowhere**, for the
 * same reason `src/data/chapter-meta-ffx2-leblanc.ts` was before its
 * integrator commit (`c473de8`): `./chapter-meta.ts`'s `CHAPTER_META` array
 * carries a hard length-parity assertion against `CHAPTERS`
 * (`tests/unit/chapter-meta.test.ts`) that fails until `src/data/encounters.ts`
 * (a contract file) widens `ChapterId` to include `'seymour-anima-macalania'`
 * and adds the chapter record — integrator-only work
 * (`docs/plans/chapter-macalania-review.md` §8.1). `DraftChapterMeta` relaxes
 * only `id` and `numeral` to `string`; every other field is the real,
 * unrelaxed `ChapterMeta` shape, so once the integrator widens `ChapterId`
 * and picks a numeral this object typechecks with no further edit — exactly
 * the same contract the Leblanc draft used.
 *
 * `heroArt`/`heroArtFallback`/snapshot images point at art already rendered
 * to `public/art/` from the chapter's engine-and-data pass (`074a198`) — that
 * pass shipped combat sprites, not this screen's close-up, so `heroArt` has
 * no file yet and the screen falls back to the existing portrait, same
 * convention every other chapter's `heroArt` follows before its own close-up
 * is painted. These are CANDIDATE assets (`docs/target/targets.json`): none
 * of Macalania's art is Bailey-approved yet (`docs/handoff/NOW.md`, "Macalania
 * art was not started" — the pause and portrait pieces here were rendered
 * earlier, for the chapter tile and character sheet, not as a finished pass).
 *
 * `musicKeys` name the two cues `src/story/scripts/seymour-anima-macalania.ts`
 * already calls by id (`scene-macalania-temple` at line 103,
 * `boss-seymour-macalania` at line 181) — neither is a registered `MusicKey`
 * in `src/audio/tracks/index.ts` yet, so they are owed the same way
 * `ffx2-leblanc`'s two cues were before Track H landed — plus the shared
 * `victory-ffx` fanfare every other FFX chapter uses.
 */

import type { ChapterMeta } from './chapter-meta.ts';

type DraftChapterMeta = Omit<ChapterMeta, 'id' | 'numeral'> & { id: string; numeral: string };

/**
 * Seymour and Anima — Macalania Temple.
 * Beats: `research/ffx-seymour-anima-macalania.md` §9 (scene), §5 (three
 * acts). Strategies: §7 (the numbered player-strategy table cited row by row
 * below).
 */
export const SEYMOUR_ANIMA_MACALANIA_META: DraftChapterMeta = {
  id: 'seymour-anima-macalania',
  gameLabel: 'FFX',
  numeral: 'IV',
  title: 'Seymour and Anima',
  subtitle: 'The Second Refusal',
  location: 'Macalania Temple',
  blurb:
    'Seymour offers the pilgrimage a second time, and this time he does not ask — he calls Anima up ' +
    "through the chamber floor to make the answer for him. What she does to a party is not what she " +
    'does to the aeon summoned to stand in front of them, and the fight is built entirely out of that gap.',
  heroArt: 'pause/ch4-seymour-anima-macalania',
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
  musicKeys: ['scene-macalania-temple', 'boss-seymour-macalania', 'victory-ffx'],
};

export default SEYMOUR_ANIMA_MACALANIA_META;
