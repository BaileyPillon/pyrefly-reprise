/**
 * Pause-screen and prebattle-tab metadata — Chapter XV, the Den of Woe, the three shades under
 * Mushroom Rock Road (FFX-2) [research/ffx2-gippal-den-of-woe.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the FFX-2 status set; nothing
 * here is true of an FFX chapter.
 *
 * - `title` "The Den of Woe", `location`, `subtitle`: GP2 (picked), the registered record's.
 * - `blurb`, `handwritten` and `tip` are our own words over the research's sourced facts (§2 the
 *   three shades back to back with no break `[verified: 4 sources]`; §4.2 Baralai's counter and
 *   Drill Shot's three quarters of max HP; §4.3 Lightfall, 5,000 to everyone once near the end).
 *   The tip teaches the Hero Drink against Lightfall: Invincible is the sources' answer (§5, reached
 *   there with an Alchemist's Dark Matter), and the bag carries 3 Hero Drinks by Bailey's pick of
 *   2026-09-26 (`./ffx2/builds/den-of-woe.ts`, `[estimate]`). No Lightfall prep (dropped, same pick).
 * - `quote` is line 13 of `docs/plans/gippal-story-draft.md`, an `[ORIGINAL]` line the post plays
 *   (`src/story/scripts/ffx2-den-of-woe.ts`).
 * - `objectives`: the chain's two later links (no Save Sphere between, GP3 a), then the win.
 * - `heroArt` is the hero plate B (`pause/ch15-ffx2-den-of-woe`, sha `e75589cda3db`), Bailey's pick
 *   of 2026-09-25 ("I'll go with all your recommendations", D-158), installed and locked
 *   (`docs/concepts/chapters/gippal/INSTALLED.md`, "Hero plate installed"). Its face sits left
 *   (focal x 0.25), so the pause chrome takes the right (`screens/pause/plates.ts`, the unmeasured
 *   plate's fallback). `heroArtFallback`, Paine's FFX-2 plate, shows only if the plate is missing.
 * - `snapshots` are the installed chapter art: the O-3 A plate, Gippal's shade (judge-locked) and
 *   Nooj's shade (D-182, Bailey's option A).
 * - `musicKeys`: GP16 as the record has it, the field bed, the stand-in `boss-shuyin`, the FFX-2
 *   fanfare.
 *
 * **Unlisted**: it sits in `./chapter-meta.ts`'s `UNLISTED_CHAPTER_META` until the chapter is listed.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FFX2_DEN_OF_WOE_SHIPPED } from './chapter-den-of-woe-ship.ts';

export const DEN_OF_WOE_META: ChapterMeta = {
  id: 'ffx2-den-of-woe',
  gameLabel: 'FFX-2',
  numeral: 'XV',
  title: FFX2_DEN_OF_WOE_SHIPPED.title,
  subtitle: FFX2_DEN_OF_WOE_SHIPPED.subtitle,
  location: FFX2_DEN_OF_WOE_SHIPPED.location,
  blurb:
    "Paine's old recordings open a sealed cave under the ravine, where her squad once turned on each other. " +
    'The pyreflies there still hold what the survivors felt, and they rise as Baralai, Gippal and Nooj, one after another.',
  heroArt: 'pause/ch15-ffx2-den-of-woe',
  heroArtFallback: 'portraits/paine.png',
  quote: { text: 'Two years I thought they chose it.', speaker: 'Paine' },
  handwritten: 'three shades, no rest between',
  objectives: [
    // Research §2 [verified: 4 sources]: the shades come one after another, with no break.
    { id: 'get-past-baralai', label: 'Get past Baralai', rule: { kind: 'link-reached', link: 2 } },
    { id: 'get-past-gippal', label: 'Get past Gippal', rule: { kind: 'link-reached', link: 3 } },
    { id: 'defeat-nooj', label: 'Defeat Nooj', rule: { kind: 'victory' } },
  ],
  tip:
    'Nothing heals between the three shades. Baralai counts every blow and at eight hits back for three quarters of max HP. ' +
    'Near the end Nooj calls down Lightfall, 5,000 to everyone, once: a Hero Drink just before it makes a girl Invincible.',
  snapshots: [
    { image: 'backdrops/den-of-woe.png', caption: 'the sealed cave' },
    { image: 'characters/gippal-shade/idle.png', caption: 'his anger, two years old' },
    { image: 'characters/nooj-shade/idle.png', caption: 'the last to rise' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-shuyin', 'victory-ffx2'],
};

export default DEN_OF_WOE_META;
