/**
 * Pause-screen and prebattle-tab metadata — The Leblanc Syndicate, Chateau
 * Leblanc (FFX-2 Chapter 2 narratively, Chapter 6 in display order)
 * [research/ffx2-leblanc-syndicate.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * **Wired into `./chapter-meta.ts` by the integrator, 2026-09-22**
 * (`docs/target/decisions.json` D-018 answers the chapter-number question
 * this file's own header used to flag as open). `id: 'ffx2-leblanc'` and
 * `numeral: 'VI'` now typecheck against the real `ChapterMeta` shape — both
 * unions were widened in `./encounters.ts` and `./chapter-meta.ts` in the
 * same commit that registers this file, so the draft-relaxed type this file
 * used to export is gone; this is a real `ChapterMeta`.
 *
 * `heroArt`/`heroArtFallback`/snapshot images point at art already rendered
 * to `public/art/` by the chapter's first art pass — `production.md` in
 * `docs/concepts/chapters/leblanc/` flags that pass **CANDIDATE, not
 * approved** (`docs/target/approved-hashes.json`), so these paths exist on
 * disk today but are not a claim that the pictures are final.
 *
 * `musicKeys` names the cues this chapter's `Chapter.music` record and its
 * story script actually use — Chapter 4's `scene-bevelle-underground` /
 * `boss-ffx2-aeon` (no dedicated Leblanc cue exists yet; see the class doc on
 * `FFX2_LEBLANC` in `./encounters.ts`) plus the shared `victory-ffx2` fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';

/**
 * Chapter 6 — The Leblanc Syndicate, Chateau Leblanc.
 * Beats: `research/ffx2-leblanc-syndicate.md` §9.2. Strategies: §5.4 (kill
 * order), §4.4 (Dispel vs. Not-So-Mighty Guard).
 */
export const FFX2_LEBLANC_META: ChapterMeta = {
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
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-aeon', 'victory-ffx2'],
};

export default FFX2_LEBLANC_META;
