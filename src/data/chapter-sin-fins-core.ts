/**
 * Chapter XVII — **Sin: the Fins and the Core**, the assault from the
 * *Fahrenheit* (FFX): links I to III on one party state, ending at Sinfall.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; `research/ffx-sin.md` §0.3]: CTB,
 * Cid's Trigger Command, the airship range, aeons, Armor and Mental Break.
 * None of it exists in FFX-2.
 *
 * Kept out of `./encounters.ts` for the house 400-line rule; the `Chapter`
 * import is type-only, so there is no runtime cycle.
 *
 * ## What Bailey decided
 *
 * **D-270** (2026-09-27 ~15:20 EDT, "all your recommendations"): concept C, two
 * chapters split where the game saves. This one covers the Left Fin, the Right
 * Fin, and Sinspawn Genais with Sin's Core, "as one continuous fight on one party
 * state". The chain is `sin-left-fin` → `sin-right-fin` → `sin-genais-core` by
 * `nextGroupId`; links 2 and 3 set `carriesPartyState`, so HP, MP, statuses,
 * gauges, aeon HP and items all carry (§1.2 `[verified: 3 sources]`). **D-264**:
 * the party is `sinFahrenheitBuild`, starting rested (after Rin's shop, §7.3), as
 * `sinFinsCoreBuild`: the same preset with Tidus's and Rikku's Trigger Command
 * back (the Fins' range fight is Evrae's, §4 `[verified: 4 sources]`).
 *
 * ## Registered, reachable, NOT listed (the switch)
 *
 * The record sits in `UNLISTED_CHAPTERS`: `getChapter` and
 * `window.__pyrefly.gotoChapter('sin-fins-core')` reach it by id; chapter select
 * shows **no card** and nothing counts it. Listing it is the switch
 * (`docs/plans/sin-two-chapters-plan.md` §6).
 *
 * Every field a player would see or hear is a **placeholder**, and says so:
 *
 * - `title` — D-270's working title; Bailey confirms it at listing (Q13).
 *   `subtitle`, `location`, `blurb` — our own summaries of research §1.1, §1.2,
 *   §9.1 and §9.2 beats 1 to 7 (no line is quoted).
 * - `sceneKey: 'evrae-airship-deck'` — **placeholder** (the same *Fahrenheit*
 *   deck; links 1 and 2 are on the outer deck in flight, §9.1). Link 3 is on
 *   Sin's back (`[single source]`), and it stays on the deck, labelled, until
 *   that backdrop is painted and picked (plan §3.1, Q6).
 * - The enemies' art — **placeholder**: the stage's grey boss silhouettes.
 * - `music` — **placeholder** FFX cues until the assault cue is written and
 *   picked by ear (rules 8 and 13; plan §3.6).
 * - `scriptsRef` — **placeholder** (`src/story/scripts/sin-fins-core.ts`, a stub
 *   package P fills).
 */

import type { Chapter } from './encounters.ts';
import { sinFinsCoreScripts } from '../story/scripts/sin-fins-core.ts';
import { sinFinsCoreBuild } from './ffx/builds/sin-fahrenheit.ts';
import { sinLeftFinGroup } from './ffx/enemies/sin-fins.ts';

/** Chapter 17 (unlisted: `./chapters-unlisted.ts`). */
export const SIN_FINS_CORE: Chapter = {
  id: 'sin-fins-core',
  game: 'ffx',
  number: 17, // D-270: the first of Sin's two chapters (XVIII is the Face)
  title: 'Sin: the Fins and the Core', // D-270's working title; Bailey confirms it at listing
  // research §1.2, summarised: three links with no rest between them.
  subtitle: 'Two arms, a shield and a core, with no rest between them',
  // research §9.1: links 1-2 on the outer deck in flight; link 3 on Sin's back [single source].
  location: 'Deck of the Fahrenheit, then Sin\'s back — in flight',
  // research §9.2 beats 1-7, summarised; no line quoted.
  blurb:
    'Spira sings the Hymn to hold Sin still while the Fahrenheit flies at it. ' +
    'It fights one fin, then the other, and then the party leaps onto Sin itself.',
  sceneKey: 'evrae-airship-deck', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-sin-fins-core',
  buildRef: sinFinsCoreBuild, // D-264, plus Tidus's and Rikku's orders to Cid (§4 [verified: 4 sources])
  enemyGroupRef: sinLeftFinGroup,
  scriptsRef: sinFinsCoreScripts, // PLACEHOLDER — see the file header
  music: {
    // PLACEHOLDER FFX cues until the owed assault cue (plan §3.6).
    scene: 'scene-fahrenheit',
    battle: 'boss-evrae',
    victory: 'victory-ffx',
  },
  // Duplicated from each enemy record's own `sensorText`, as the contract asks.
  sensorTexts: {
    'left-fin': 'When its core glows, Gravija follows. Distance turns it aside.',
    'right-fin': 'When its core glows, Gravija follows. Distance turns it aside.',
    'sinspawn-genais': 'It drinks the magic aimed at the core behind it.',
    'sin-core': 'It wakes and charges whenever Genais shelters in its shell.',
  },
};
