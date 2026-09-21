/**
 * The chapters Bailey has approved but that have no data module yet.
 *
 * Bailey, 2026-09-19, approved three new encounters alongside the twelve
 * presentation changes: Seymour and Anima at Macalania Temple (FFX), Evrae on
 * the deck of the *Fahrenheit* (FFX), and the Leblanc Syndicate at Chateau
 * Leblanc (FFX-2, the canonical three-act Chapter 2 mission). The approved
 * showpiece board (`docs/concepts/polish/showpiece-frontend/after.png`) shows
 * the chapter grid as the board of *the whole game*, so the front end has to
 * hold eight cards today and light three of them up the day their data lands.
 *
 * **These are not chapters.** Nothing here is a `Chapter`, nothing here is
 * importable from `src/data`, and nothing here carries a stat, a party, a
 * formation or a script — AGENTS.md hard rule 6 ("never invent game data").
 * Each row is a *label*: the encounter's name and where it happens, both read
 * off the research document named in `research`, plus the painting the art
 * fleet has already approved for its silhouette when there is one.
 *
 * **They disappear by themselves.** `chapterGrid.ts` drops any row whose `id`
 * or `title` already exists in `CHAPTERS`, so the day `src/data/encounters.ts`
 * gains the real chapter, its card stops saying COMING and becomes playable
 * with no edit here. `tests/unit/frontend-chapter-grid.test.ts` pins that.
 *
 * Game-aware (AGENTS.md rule 14): FFX only for the first two rows, FFX-2 only
 * for the third, from the research files each row cites. The grid itself is
 * **both** — it is shared front-end plumbing.
 */

import type { GameId } from '../../../battle/common/types.ts';

/** One approved-but-unbuilt encounter, as the chapter grid shows it. */
export interface ComingChapter {
  /**
   * The id the real chapter is expected to take. Only ever compared against
   * `ChapterId`s — never written to a save, never handed to the flow.
   */
  readonly id: string;
  readonly game: GameId;
  /** The encounter's name, as the research document names it. */
  readonly title: string;
  /** Where it happens, in the same register as `Chapter.location`. */
  readonly location: string;
  /**
   * `public/art/characters/<key>/idle.png`, drawn as the ink silhouette when
   * the fleet has already approved a painting of this encounter's subject.
   * Empty when nothing is painted: the card then draws the locked plate.
   */
  readonly silhouetteKeys: readonly string[];
  /** The research document every field above was read from. */
  readonly research: string;
}

/**
 * The three approved encounters, in the order they will join their game group.
 *
 * Titles and locations are quoted from the research headers, not remembered:
 * - Macalania — "Seymour Guado, two Guado Guardians, and his aeon Anima, in
 *   the antechamber of the Chamber of the Fayth, Macalania Temple"
 *   (`research/ffx-seymour-anima-macalania.md` header).
 * - Evrae — "Evrae, guardian wyrm of Bevelle, fought from the open deck of the
 *   airship *Fahrenheit*" (`research/ffx-evrae-airship.md` header).
 * - Leblanc — "the **Chateau Leblanc 'Last Room'** (Guadosalam, Chapter 2)",
 *   built "as the **canonical three-act mission**"
 *   (`research/ffx2-leblanc-syndicate.md` §0 A1/A2).
 */
export const COMING_CHAPTERS: readonly ComingChapter[] = [
  {
    id: 'seymour-anima-macalania',
    game: 'ffx',
    title: 'Seymour and Anima',
    location: 'Macalania Temple — the antechamber',
    // The fleet has an approved Anima; Seymour Guado's own painting is the
    // unsent Flux body, which is a different fight and a spoiler here.
    silhouetteKeys: ['anima'],
    research: 'research/ffx-seymour-anima-macalania.md',
  },
  {
    id: 'evrae-airship',
    game: 'ffx',
    title: 'Evrae',
    location: 'Deck of the Fahrenheit — the approach to Bevelle',
    silhouetteKeys: [],
    research: 'research/ffx-evrae-airship.md',
  },
  {
    id: 'ffx2-leblanc-syndicate',
    game: 'ffx2',
    title: 'The Leblanc Syndicate',
    location: 'Chateau Leblanc — Guadosalam',
    silhouetteKeys: [],
    research: 'research/ffx2-leblanc-syndicate.md',
  },
] as const;
