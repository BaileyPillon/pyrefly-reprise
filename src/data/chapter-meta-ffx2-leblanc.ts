/**
 * Pause-screen and prebattle-tab metadata — The Leblanc Syndicate, Chateau
 * Leblanc (FFX-2 Chapter 2) [research/ffx2-leblanc-syndicate.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * **Not wired into `./chapter-meta.ts`.** That file's `CHAPTER_META` array is
 * integrator-only [docs/plans/chapter-leblanc-review.md §8, track I] —
 * `tests/unit/chapter-meta.test.ts` asserts `CHAPTER_META.length ===
 * CHAPTERS.length` and cross-checks every entry's `musicKeys` against a real
 * `Chapter.music` record, both of which only exist once
 * `src/data/encounters.ts` (a contract file) registers this chapter. Same
 * shape as `src/data/guides/ffx2-leblanc.ts` and
 * `src/engine/tactics/ffx2-leblanc.ts`: built standalone, wired in the
 * integrator's single commit.
 *
 * The integrator's addition to `./chapter-meta.ts`:
 *
 * ```ts
 * import { FFX2_LEBLANC_META } from './chapter-meta-ffx2-leblanc.ts';
 * // ...appended to CHAPTER_META, in play order:
 * FFX2_LEBLANC_META,
 * ```
 *
 * Two fields need a decision this track cannot make and are typed loosely
 * here rather than guessed:
 *
 * - `numeral` — `ChapterMeta.numeral` is `'I' | 'II' | 'III' | 'IV' | 'V'`,
 *   closed over the five chapters that exist today. This chapter's number and
 *   select-order slot is still an open question
 *   (`docs/handoff/chapter-leblanc-engine.md` §8, item 5). `'VI'` below is a
 *   placeholder assuming it slots in after Vegnagun; the integrator sets the
 *   real value once Bailey answers, and widens the union the same commit it
 *   widens `ChapterId`.
 * - `id` — `ChapterMeta.id` is `ChapterId`, from the contract file
 *   `src/data/encounters.ts`, which does not carry `'ffx2-leblanc'` yet.
 *
 * `DraftChapterMeta` relaxes only those two fields to `string`; everything
 * else is checked against the real `ChapterMeta` shape.
 *
 * `heroArt`/`heroArtFallback`/snapshot images point at art already rendered
 * to `public/art/` by the chapter's first art pass — `production.md` in
 * `docs/concepts/chapters/leblanc/` flags that pass **CANDIDATE, not
 * approved** (`docs/target/approved-hashes.json`), so these paths exist on
 * disk today but are not a claim that the pictures are final.
 */

import type { ChapterMeta } from './chapter-meta.ts';

type DraftChapterMeta = Omit<ChapterMeta, 'id' | 'numeral'> & { id: string; numeral: string };

/**
 * Chapter — The Leblanc Syndicate, Chateau Leblanc.
 * Beats: `research/ffx2-leblanc-syndicate.md` §9.2. Strategies: §5.4 (kill
 * order), §4.4 (Dispel vs. Not-So-Mighty Guard).
 *
 * No victory quip/pose decision has been made for this chapter (unlike
 * Chapter 4's documented suppression) — `musicKeys` below name the three
 * cues `docs/plans/chapter-leblanc-review.md` §8 Track H still owes
 * (`boss-leblanc`, `scene-chateau-leblanc`) plus the shared
 * `victory-ffx2` cue Chapter 5 already registers.
 */
export const FFX2_LEBLANC_META: DraftChapterMeta = {
  id: 'ffx2-leblanc',
  gameLabel: 'FFX-2',
  numeral: 'VI',
  title: 'Leblanc',
  subtitle: 'A Farce, Armed',
  location: 'Chateau Leblanc, Guadosalam',
  blurb:
    'Three stolen uniforms get the girls through the front door of a mansion playing dress-up as a rival crew, ' +
    'right up until the ambush underground turns real. What they walk out with matters more than either side ' +
    'realizes yet.',
  heroArt: 'pause/ffx2-leblanc',
  heroArtFallback: 'portraits/leblanc.png',
  quote: {
    text: "Darling, you didn't win. You simply arrived when I'd already decided to be finished.",
    speaker: 'Leblanc',
  },
  handwritten: 'the massage was the funniest part',
  objectives: [
    {
      id: 'survive-russian-roulette',
      label: 'Survive Russian Roulette',
      rule: { kind: 'survived-ability', ability: 'russian-roulette' },
    },
    {
      id: 'dispel-not-so-mighty-guard',
      label: "Dispel Leblanc's Not-So-Mighty Guard",
      rule: { kind: 'status-cured', status: 'protect' },
    },
    {
      id: 'defeat-the-leblanc-syndicate',
      label: 'Defeat the Leblanc Syndicate',
      rule: { kind: 'victory' },
    },
  ],
  tip: "Dispel her Not-So-Mighty Guard the moment it lands — it's Protect, Shell and Regen on all three at once, and it comes back roughly every 21 seconds if you let it.",
  snapshots: [
    { image: 'backdrops/leblanc-last-room.png', caption: "the Syndicate's real workplace" },
    { image: 'characters/leblanc/idle.png', caption: 'beaten, never humiliated' },
    { image: 'characters/ormi/idle.png', caption: 'loses again, shows up anyway' },
  ],
  focalCharacterId: 'leblanc',
  musicKeys: ['scene-chateau-leblanc', 'boss-leblanc', 'victory-ffx2'],
};

export default FFX2_LEBLANC_META;
