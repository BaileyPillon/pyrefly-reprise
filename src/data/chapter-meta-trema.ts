/**
 * Pause-screen and prebattle-tab metadata — Chapter XIII, Trema, on Cloister 100 of the Via
 * Infinito (FFX-2) [research/ffx2-trema.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, Garment Grids; nothing here
 * is true of an FFX chapter.
 *
 * - `title` "Trema", `location` "Via Infinito — Cloister 100": TR17 (picked).
 * - `subtitle`, `blurb`, `handwritten` and `tip` are our own words over the research's sourced
 *   facts (§2 the shape; §4.2 the HP triggers, `[verified: 4 sources]`; §3.1 his immunities).
 *   **Every line must stay true for every option on the options sheet**
 *   (`docs/plans/trema-options-2026-09-25.md`), so the lines that depend on the chapter's shape
 *   come from {@link tremaMetaFor} and the shape read off the chapter data
 *   (`./trema-shape.ts`): the Paragon objective and the Paragon sentence of the blurb exist
 *   only with a Paragon link.
 * - `quote` is line 17 of `docs/plans/trema-story-draft.md`, an `[ORIGINAL]` line in Trema's
 *   voice, which both story variants play (`src/story/scripts/ffx2-trema.ts`).
 * - `heroArt` is Trema's hero plate B (`pause/ch13-trema`), Bailey's pick of 2026-09-25 ("I'll go
 *   with all your recommendations"), installed and locked (`docs/concepts/chapters/trema/hero-plate/`).
 *   `heroArtFallback`, Yuna's approved FFX-2 speaker portrait, shows only if the plate is missing.
 * - `snapshots` are the installed, LOCKED art (TR18): the O-3 B plate and the O-1 A / O-2 A
 *   paintings (`docs/concepts/chapters/trema/INSTALLED.md`).
 * - `musicKeys`: TR16 a, `scene-bevelle-underground` (the walk down and Paragon) and
 *   `boss-ffx2-aeon` (the stand-in for Trema until a `boss-trema` is picked), then the FFX-2
 *   fanfare.
 *
 * **Listed** 2026-09-25 with the chapter itself: it sits last in `./chapter-meta.ts`'s
 * `CHAPTER_META`, as the chapter sits last in `CHAPTERS`.
 */

import type { ChapterMeta, ChapterObjective } from './chapter-meta.ts';
import type { TremaShape } from './trema-shape.ts';
import { FFX2_TREMA_SHIPPED, shapeOfChapter } from './chapter-trema-ship.ts';

const METEOR: ChapterObjective = {
  // Research §4.2 [verified: 4 sources]: below 1/2 and below 1/4 of his HP, once each.
  id: 'survive-meteor',
  label: 'Survive Meteor',
  rule: { kind: 'survived-ability', ability: 'trema-meteor' },
};

const WIN: ChapterObjective = { id: 'defeat-trema', label: 'Defeat Trema', rule: { kind: 'victory' } };

/** The chapter's pause-screen card for `shape`. */
export function tremaMetaFor(shape: TremaShape): ChapterMeta {
  const first: ChapterObjective = shape.paragonLink
    ? // Research §1.1 [verified: 5 sources]: Paragon first, then Trema with no heal between.
      { id: 'beat-paragon', label: 'Get past Paragon', rule: { kind: 'link-reached', link: 2 } }
    : // Research §4.2 [verified: 2 sources for the 1/6 line, T-1]: Ultima below a sixth.
      { id: 'survive-ultima', label: 'Survive Ultima', rule: { kind: 'survived-ability', ability: 'trema-ultima' } };
  const blurb = shape.paragonLink
    ? 'A hundred floors under Bevelle, something that was once a lord of Yevon guards the last room. ' +
      'Beat it, and the man who founded New Yevon steps out to finish it himself, then asks what your memories are worth.'
    : 'A hundred floors under Bevelle, the man who founded New Yevon waits in the last room. ' +
      'He broke every sphere he carried down, and now he wants to see what your memories are worth.';
  return {
    id: 'ffx2-trema',
    gameLabel: 'FFX-2',
    numeral: 'XIII',
    title: 'Trema',
    subtitle: 'A Hundred Floors Down',
    location: 'Via Infinito — Cloister 100',
    blurb,
    heroArt: 'pause/ch13-trema',
    heroArtFallback: 'portraits/yuna-x2.png',
    quote: { text: 'Memories are weights. Put them down, and you rise.', speaker: 'Trema' },
    handwritten: 'he broke every last sphere',
    objectives: [first, METEOR, WIN],
    tip:
      'Nothing sticks to Trema: no status, no stat change, no Gravity. ' +
      'When his HP falls below a half, and again below a quarter, Meteor comes down on the party, so be healed before you cross those lines.',
    snapshots: [
      { image: 'backdrops/via-infinito.png', caption: 'the hundredth floor' },
      shape.paragonLink
        ? { image: 'characters/paragon/idle.png', caption: 'what guards the last room' }
        : { image: 'characters/trema/cast.png', caption: 'his hand raised' },
      { image: 'characters/trema/idle.png', caption: 'the founder, robe torn' },
    ],
    focalCharacterId: 'yuna',
    musicKeys: ['scene-bevelle-underground', 'boss-ffx2-aeon', 'victory-ffx2'],
  };
}

/** Chapter XIII's card, for the shape its registered record has. */
export const TREMA_META: ChapterMeta = tremaMetaFor(shapeOfChapter(FFX2_TREMA_SHIPPED));

export default TREMA_META;
