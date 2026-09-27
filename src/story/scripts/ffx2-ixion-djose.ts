/**
 * Ixion at Djose (FFX-2 Chapter 3 finale): the story layer, **a script stub**.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-09-27, "all your recommendations": concept A of
 * `docs/concepts/chapters/ixion-djose-2026-09-27/README.md`. This file is the **order** of concept A's close
 * and nothing more: every line is a **placeholder stage direction** in our own words over research
 * `research/ffx2-ixion-djose.md` §7's sourced beats. The dialogue is unsourced (IX-13) and will be written
 * separately (`research/writing-bible.md`); no game line is quoted. There is no new art: nothing is staged
 * (no `showActor`), so the scene is the chapter's placeholder diorama behind the dialogue box. The music under
 * the Abyss is Bailey's call by ear (rule 13), so the stub plays none.
 *
 * Order (concept A; research §2 steps 5-8 and §7.2):
 * 1. `results()`: the mission is complete (Unwavering Guard, §3.1).
 * 2. The fall (§7.1): the girls look into the hole where the fayth stood; Ixion rises and charges; Rikku and
 *    Paine leap aside and Yuna goes into the hole (`[verified: 4 sources]`, one dissent, IX-6: knocked in).
 * 3. The Abyss (§7.2 steps 1-10): the white void, the Songstress dress, Shuyin mistaking her for Lenne,
 *    Vegnagun, the embrace, Nooj and Gippal, Baralai revealed, Crimson Spheres 2 and 3, alone.
 * 4. **The four whistles** (§7.2 step 11, `[verified: 7 sources]`): a playable beat, research Q5 (a). The
 *    placeholder input is four one-option choices; each whistle records `ixionWhistles` (1 to 4).
 * 5. She wakes in the Bevelle Underground (§7.2 step 12, IX-7).
 */

import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, choice, fade, results, say, setFlag } from '../dsl.ts';

/** The script flag the whistle beat counts up (1 to 4). */
export const IXION_WHISTLE_FLAG = 'ixionWhistles';
/** The number of whistles the sources give `[verified: 7 sources]`. */
export const IXION_WHISTLES = 4;

const stage = (text: string) => say('none', `(Placeholder) ${text}`);

/** One whistle: the placeholder input, then the light it calls. */
function whistle(n: number): StoryScript {
  return [
    choice(`ixionWhistle${n}`, [{ label: '(Whistle)', value: n }]),
    setFlag(IXION_WHISTLE_FLAG, n),
    stage(n < IXION_WHISTLES ? 'A small light answers, a little nearer.' : 'The light runs ahead. She follows it.'),
  ];
}

const post: StoryScript = [
  results(),
  // The fall (§7.1).
  stage('The girls look down the hole where the fayth stood.'),
  stage('Ixion rises and charges. Rikku and Paine leap aside.'),
  stage('Yuna is thrown into the hole.'),
  fade('white', 1400),
  // The Farplane Abyss (§7.2 steps 1-10).
  stage('A white void. Yuna lands in her Songstress dress.'),
  stage('A young man steps out of the fog. He looks like him.'),
  stage('He calls her Lenne. He speaks of Vegnagun.'),
  stage('He holds her, and she cannot move.'),
  stage('Nooj and Gippal arrive. The young man is Baralai.'),
  stage('He goes deeper. They hand her two spheres, for Paine.'),
  stage('They follow him down. Yuna is alone, and kneels.'),
  beat(1600),
  // The four whistles (§7.2 step 11), a playable beat (Q5 a).
  ...whistle(1),
  ...whistle(2),
  ...whistle(3),
  ...whistle(4),
  fade('black', 1400),
  // §7.2 step 12 (IX-7: the Bevelle Underground, 4 to 1).
  stage('She wakes in the Bevelle Underground.'),
];

/** The chapter's story layer: open the battle, then concept A's close as a stub. */
export const ffx2IxionDjoseScripts: ChapterScripts = {
  pre: [battleStart()],
  post,
  victoryQuips: {},
  mid: [],
  midScripts: {},
};
