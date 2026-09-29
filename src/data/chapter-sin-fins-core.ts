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
 * ## Listed (2026-09-29), on the driver's picks
 *
 * Listed as Chapter XVII, after Chapter XVI, on **D-279**: Bailey delegated Sin's paintings, the countdown
 * display and the music to the driver ("Your picks (Recommended)"), and can swap any of them later. What each
 * field is:
 *
 * - `title` — D-270's working title (Q13). `subtitle`, `location`, `blurb` — our own summaries of research
 *   §1.1, §1.2, §9.1 and §9.2 beats 1 to 7 (no line is quoted).
 * - `sceneKey: 'sin-fahrenheit-flight'` — the driver's plate (late afternoon over the cloud sea;
 *   `src/scenes/evrae-airship-sin.ts`), on Chapter VIII's deck. **Link III (Sin's back, `[single source]`) stays on
 *   it**, labelled: a per-link scene swap is a new seam (`EnemyGroupDef` has no scene key; plan Q6), and the
 *   `sin-back` painting waits for it. A missing plate falls back to Evrae's deck painting.
 * - The enemies' art — the driver's picks (Fin A both arms, Genais A, Core A), by `spriteKey`; the grey boss
 *   silhouette shows until the files are installed.
 * - `music` — **stand-in** FFX cues, labelled (agents cannot hear, rule 13): the owed assault cue is Bailey's
 *   to judge by ear (plan §3.6, D-209).
 */

import type { Chapter } from './encounters.ts';
import { sinFinsCoreScripts } from '../story/scripts/sin-fins-core.ts';
import { sinFinsCoreBuild } from './ffx/builds/sin-fahrenheit.ts';
import { sinLeftFinGroup } from './ffx/enemies/sin-fins.ts';

/** Chapter XVII, listed 2026-09-29 (`./encounters.ts` `CHAPTERS`). */
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
  sceneKey: 'sin-fahrenheit-flight', // D-279 (the driver's pick); link III stays on it, see the file header
  thumbnailKey: 'chapter-sin-fins-core',
  buildRef: sinFinsCoreBuild, // D-264, plus Tidus's and Rikku's orders to Cid (§4 [verified: 4 sources])
  enemyGroupRef: sinLeftFinGroup,
  scriptsRef: sinFinsCoreScripts,
  music: {
    // STAND-IN FFX cues, labelled, until the owed assault cue (plan §3.6; D-279: the driver's stand-ins).
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
