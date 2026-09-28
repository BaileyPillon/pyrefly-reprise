/**
 * Chapter XVI — Ixion at Djose (FFX-2 Chapter 3 finale): the story layer.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-09-27, "all your recommendations": concept A of
 * `docs/concepts/chapters/ixion-djose-2026-09-27/README.md` (D-265), in the research's order
 * (`research/ffx2-ixion-djose.md` §2 steps 3-8, §7.1, §7.2):
 *
 * 1. **pre**: the Machine Faction's temple full of fiends, Gippal missing (§1.1), the top of the stairs, and
 *    Rikku's opening line (§7.3), then the fight.
 * 2. **post**: `results()` first (mission complete, §2 step 5; the girls pose, §8 item 8), then the fall
 *    (§7.1: Ixion rises and charges, Rikku and Paine leap aside, Yuna goes into the hole, `[verified: 4 sources]`,
 *    one dissent IX-6), the Farplane Abyss over one plate (§7.2 steps 1-10), **the four whistles** as a playable
 *    beat (§7.2 step 11, `[verified: 7 sources]`; Q5 a), and the wake in the Bevelle Underground (step 12, IX-7).
 *
 * **What is quoted and what is ours.** The Abyss dialogue is unsourced (IX-13: no transcript exists), so the
 * lines are ours, written over the sourced beats; each carries its beat in a comment. Only three lines are the
 * game's own words, each quoted by the research: Rikku's "This can't be happening." (§7.3, `[verified: 2 sources]`),
 * Yuna's "I'm all alone." (§7.3, `[verified: 6 sources]`) and Gippal's "take care of things topside" (§7.2
 * step 9, the wiki, `[single source]`). They are marked `VERBATIM` below; every other line is marked `ours`.
 *
 * **Speakers and portraits.** Shuyin, Baralai and Gippal speak with their approved portraits
 * (`docs/target/approved-hashes.json`). Nooj's portrait on disk is not approved, so his lines are text-only
 * ({@link TEXT_ONLY}: a key with no painting, so the box shows his name and no face).
 *
 * **Plates** (`../../data/ixion-plates.ts`): the Chamber (the chapter's scene, a stand-in), the Abyss (a
 * stand-in), the Bevelle Underground (the approved Chapter 4 plate), swapped by the DSL's `backdrop()` step.
 *
 * **Music** (rule 13: nothing new, existing cues by their sourced mood): the field bed `scene-bevelle-underground`
 * (the FFX-2 fallback bed, Chapter VI's precedent); the Abyss `scene-farplane` (the game plays "The Farplane
 * Abyss" there, §6.3 `[single source]`); the wake `scene-bevelle-underground` (the place itself). The whistle is
 * the existing `whistle-answer` cue. Bailey's call by ear.
 */

import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { backdrop, battleStart, beat, choice, fade, flash, music, narrate, results, say, setFlag, sfx, shake, wait } from '../dsl.ts';
import { DJOSE_ABYSS_PLATE, DJOSE_WAKE_PLATE } from '../../data/ixion-plates.ts';

/** The `script-trigger` names Ixion's AI emits (`src/battle/ffx2/ai/ixion.ts`, `IXION_RECHARGE_TRIGGER`). */
export const IXION_AI_TRIGGERS = ['ixion-recharge'] as const;

/** The script flag the whistle beat counts up (1 to 4). */
export const IXION_WHISTLE_FLAG = 'ixionWhistles';
/** The number of whistles the sources give `[verified: 7 sources]`. */
export const IXION_WHISTLES = 4;
/** The whistle's menu row: a single confirm press. */
export const IXION_WHISTLE_LABEL = '(Whistle)';

/**
 * A portrait key with no painting: the box shows the speaker's name and no face. For Nooj, whose portrait on
 * disk is not approved (the brief; `docs/target/approved-hashes.json` has none).
 */
export const TEXT_ONLY = 'text-only';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('rikku-x2', "Gippal's missing, and his temple's full of fiends."), // ours: §1.1, an Al Bhed tells Rikku
  say('paine', "They're pouring out of the top. The Chamber."), // ours: §1.1, out of the Chamber of the Fayth
  say('yuna-x2', "The Chamber of the Fayth. That's Ixion's."), // ours: §1.1, §2 step 3
  beat(1000),
  say('none', 'At the top of the stairs, the aeon turns on them.'), // ours: §2 step 3
  say('rikku-x2', "This can't be happening."), // VERBATIM, §7.3 [verified: 2 sources]
  battleStart(),
];

// ---------------------------------------------------------------------- whistles

const LIGHT = ['A small gold light answers.', 'The light comes nearer.', 'It waits for her now.', 'It runs ahead, over a bridge of light.'];

/** One whistle (§7.2 step 11): the prompt is one confirm press; the whistle answers and the light grows. */
function whistle(n: number): StoryScript {
  return [
    choice(`ixionWhistle${n}`, [{ label: IXION_WHISTLE_LABEL, value: n }]),
    setFlag(IXION_WHISTLE_FLAG, n),
    sfx('whistle-answer'),
    flash(220 + n * 120, '#fff1b8'),
    say('none', LIGHT[n - 1]!), // ours: the yellow, ghost-like figure (bremen, single source); the bridge after four
  ];
}

// ---------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // §2 step 5: mission complete; the girls pose (§8 item 8)

  // The fall (§7.1).
  music(null, 800),
  say('yuna-x2', "Where the fayth stood, there's only a hole."), // ours: §6.1, §7.1 the girls look in
  say('rikku-x2', "Don't lean over it. Please don't lean over it."), // ours
  say('paine', 'Behind you!'), // ours: §7.1 Ixion rises
  shake(14, 700),
  say('none', 'Ixion rises and charges. Rikku and Paine leap aside.'), // ours: §7.1 [verified: 4 sources]
  flash(260, '#e8e0ff'),
  say('rikku-x2', 'Yunie!'), // ours: Yuna goes into the hole
  fade('white', 1400),

  // The Farplane Abyss (§7.2 steps 1-10).
  backdrop(DJOSE_ABYSS_PLATE, 0),
  music('scene-farplane', 1800),
  wait(1000),
  fade('clear', 1800),
  narrate('I fell a long way. Everything was white.'), // ours: step 1
  narrate('I woke in the Songstress dress. The Farplane.'), // ours: steps 1-2 [verified: 3 sources]
  narrate('Someone walked out of the fog. For a moment it was him.'), // ours: step 3
  say('shuyin', 'Lenne.'), // step 4: he calls her Lenne [verified: 5 sources]
  say('shuyin', "It's me. Shuyin. I couldn't protect you."), // ours: steps 4-5
  say('shuyin', 'This world failed us. Vegnagun will end it.'), // ours: step 5
  narrate('He held me, and I could not move at all.'), // ours: step 6 (the Ultimania via Ryu_Kaze)
  narrate('The love I felt was not mine. It was hers.'), // ours: step 6 (the wiki)
  say('gippal', 'Let her go!'), // ours: step 7, Nooj and Gippal arrive
  say('nooj', 'Baralai. We know you are in there.', { portrait: TEXT_ONLY }), // ours: step 7
  narrate('The face changed. It was never him. It was Baralai.'), // ours: step 7 [verified: 4 sources]
  say('baralai', '...'), // step 7: possessed; he says nothing of his own here
  say('none', 'Baralai turns and walks deeper into the Farplane.'), // ours: step 8 [verified: 3 sources]
  say('gippal', 'Two spheres. They belong to Paine.'), // ours: step 9, Crimson Spheres 2 and 3, for Paine
  say('nooj', "We'll bring him back.", { portrait: TEXT_ONLY }), // ours: step 9, they go after him
  say('gippal', 'Take care of things topside.'), // VERBATIM, step 9 (the wiki's Gippal page) [single source]
  say('none', 'They follow him down, and the fog closes.'), // ours: step 9
  beat(1600),
  say('yuna-x2', "I'm all alone."), // VERBATIM, §7.3 / step 10 [verified: 6 sources]
  beat(1400),

  // The four whistles (step 11), a playable beat (Q5 a).
  ...whistle(1),
  ...whistle(2),
  ...whistle(3),
  ...whistle(4),
  fade('white', 1600),

  // She wakes in the Bevelle Underground (step 12, IX-7: 4 to 1).
  backdrop(DJOSE_WAKE_PLATE, 0),
  music('scene-bevelle-underground', 1600),
  fade('clear', 1600),
  narrate('I woke in the Bevelle Underground, where Vegnagun had been.'), // ours: step 12 [verified: 4 sources]
  narrate('Two spheres in my hands, and somebody had answered.'), // ours
  wait(1200),
];

/** The chapter's story layer: the opening, the fight, then concept A's close. */
export const ffx2IxionDjoseScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: [],
  // Ixion's AI emits this as he picks Recharge. The tell is the HUD's banner (the game shows the name, nothing
  // more: research §4.2, "the 'Recharge' name is the only warning"), so the beat itself says nothing.
  midScripts: { 'ixion-recharge': [] },
};
