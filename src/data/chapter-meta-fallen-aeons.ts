/**
 * Pause-screen and prebattle-tab metadata — Chapter XI, Fallen Aeons, on the Road to the
 * Farplane (FFX-2) [research/ffx2-fallen-aeons.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the aeons' action counter;
 * nothing here is true of an FFX chapter.
 *
 * - `title` "Fallen Aeons", `location` "Road to the Farplane": FA17 (picked). `subtitle` is the
 *   registered record's ("Three platforms, three of her own") trimmed at the listing to the pause
 *   card's 2-4 word tagline, and the `blurb` split into the card's two sentences: an agent's trim
 *   (inferred, not Bailey's words), flagged in D-187.
 * - `blurb`, `handwritten` and `tip` are our own words over the research's sourced facts (§2 the
 *   three platforms in order `[verified: 3 sources]`; §4.2 the first kill disarms Delta Attack
 *   `[verified: 4 sources]`; §4.3 Pain's statuses and stacking losses `[verified: 2 sources]`). The
 *   Remedy line is our engine's Remedy (`items/effects-status.ts`: Silence, Darkness, Itchy; FA10 a
 *   leaves the stat losses on). Holy, her one weakness, is not named: this preset learns no Holy.
 * - `quote` is line 11 of `docs/plans/fallen-aeons-story-draft.md`, an `[ORIGINAL]` line the
 *   seam between Shiva and the Sisters plays (`src/story/scripts/ffx2-fallen-aeons.ts`).
 * - `objectives`: the chain's two Save Sphere links (FA2 b), then the win.
 * - `heroArt` is the hero plate B (`pause/ch11-ffx2-fallen-aeons`, sha `ad4f3f109f53`), Bailey's pick
 *   of 2026-09-25 ("I'll go with all your recommendations", D-157), installed and locked
 *   (`docs/concepts/chapters/fallen-aeons/INSTALLED.md`, "Hero plate installed").
 *   `heroArtFallback`, Yuna's FFX-2 speaker portrait, shows only if the plate is missing.
 * - `snapshots` are the installed chapter art: plate A (O-3 A), Cindy's approved cast
 *   (`chapter:fallen-aeons-casts:2026-09-24`) and the possessed Anima (O-2 B).
 * - `musicKeys`: FA15 a, the field bed `scene-farplane`, `boss-ffx2-aeon` on all three links, then
 *   the FFX-2 fanfare.
 *
 * **Listed** 2026-09-26 with the chapter itself: it sits in `./chapter-meta.ts`'s `CHAPTER_META`
 * after Chapter X's, as the chapter sits after Chapter X in `CHAPTERS`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FFX2_FALLEN_AEONS_SHIPPED } from './chapter-fallen-aeons-ship.ts';

export const FALLEN_AEONS_META: ChapterMeta = {
  id: 'ffx2-fallen-aeons',
  gameLabel: 'FFX-2',
  numeral: 'XI',
  title: FFX2_FALLEN_AEONS_SHIPPED.title,
  subtitle: 'Three of Her Own',
  location: FFX2_FALLEN_AEONS_SHIPPED.location,
  blurb:
    'The road down into the Farplane runs over three stone platforms. ' +
    'On each waits an aeon Yuna once called, Shiva, then the Magus Sisters, then Anima, none of them her own any more.',
  heroArt: 'pause/ch11-ffx2-fallen-aeons',
  heroArtFallback: 'portraits/yuna-x2.png',
  quote: { text: "I know. That's what hurts.", speaker: 'Yuna' },
  handwritten: 'three platforms, three old friends',
  objectives: [
    // FA2 b: a Save Sphere restores HP and MP before each later link; FA3 b: a loss retries there.
    { id: 'get-past-shiva', label: 'Get past Shiva', rule: { kind: 'link-reached', link: 2 } },
    { id: 'get-past-the-sisters', label: 'Get past the Magus Sisters', rule: { kind: 'link-reached', link: 3 } },
    { id: 'defeat-anima', label: 'Defeat Anima', rule: { kind: 'victory' } },
  ],
  tip:
    'Delta Attack needs all three Sisters standing: bring any one of them down and it is gone for good. ' +
    'Against Anima, a Remedy clears the Silence, Darkness and Itchy that Pain leaves; its stat losses stay for the fight.',
  snapshots: [
    { image: 'backdrops/road-to-the-farplane.png', caption: 'the first platform' },
    { image: 'characters/cindy/cast.png', caption: 'the sisters, still together' },
    { image: 'characters/x2-anima/idle.png', caption: 'the last platform' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-farplane', 'boss-ffx2-aeon', 'victory-ffx2'],
};

export default FALLEN_AEONS_META;
