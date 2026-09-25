/**
 * Chapter X — Seymour Natus, on the Highbridge of Bevelle (FFX). Proposed scene
 * tag **E10** (grim tier, like E1; the draft's proposal).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The wedding, the trial, the Via
 * Purifico and the Highbridge are FFX's, straight after Chapter VIII's bells
 * (`research/ffx-seymour-natus-highbridge.md` §8.1, §8.2). FFX cutscene grammar
 * (`research/writing-bible.md` §2.1); the FFX-2 register does not apply.
 *
 * ## Where the lines come from
 *
 * Every line is the draft in `docs/plans/natus-story-draft.md`, numbered 1 to
 * 29 there and here, unchanged. The **events** are canon (research §8.2 beats
 * 1 to 10, paraphrased there); **the wording is ours** and no line quotes or
 * reworks the game's script [AGENTS.md rule 8]. Bailey's picks the draft
 * follows: **B11 = a** (Tidus's past-tense narration tells the wedding to the
 * Via Purifico; the Highbridge is staged live), **B12** (Seymour speaks with the
 * approved Macalania portrait, `seymour-macalania`, before he transforms; he
 * has no line after it in these two scenes), **B14 = no** (the Isaaru duel and
 * Evrae Altana are told, not staged). The draft's four open questions are built
 * as the draft wrote them: nine interlude lines, Yuna's line 22 carries the
 * climax, Auron's Talk line kept, the shatter line spoken.
 *
 * ## Not built, on purpose
 *
 * - **The mid-battle callouts** (B9: the three Talk exchanges, the Protect
 *   counter, the first Break, the first shatter, the Banish line, the third
 *   Haste). Bailey said yes to them "drafted in a story draft Bailey reads
 *   first" (D-085, the Yojimbo precedent D-068); that read is not recorded,
 *   so `mid` and `midScripts` stay empty until it is.
 * - **No victory quips**: E10 is grim tier, so §5.4 suppresses the light ones.
 *
 * ## Staging and music
 *
 * - The two interludes play over black (`fade('black')`), picking up where
 *   Chapter VIII's last narration stops, under the chapter's scene cue (the
 *   record's `music.scene`, a stand-in: no FFX Bevelle cue of ours exists).
 * - The Highbridge beats play over the picked plate (O-3 C, night, the city
 *   lit). The chapter's battle cue, `boss-seymour-macalania` (**B15's named
 *   stand-in** until a Natus cue is sketched and picked by ear, rules 8 and
 *   13), starts when Seymour comes through the gate and carries through
 *   `battleStart()`; the formation's own start cue names the same track, so
 *   the battle does not restart it.
 * - Natus's battle idle (the installed O-1 A painting) stands on the cutscene
 *   stage from the transformation (`app/screens/cutsceneFigures.ts`).
 * - The post scene fades the battle cue first; the campsite narration is
 *   unscored, and the victory fanfare starts on its own at `results()`.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  flash,
  fx,
  music,
  narrate,
  results,
  say,
  sfx,
  shake,
  showActor,
  wait,
} from '../dsl.ts';

/**
 * Natus's combatant id, mirrored from `src/battle/ffx/ai/seymour-natus-rules.ts`
 * (`NATUS_ID`). Mirrored rather than imported: `src/story/**` does not reach
 * into `src/battle/**`, as in the other chapters.
 */
const NATUS = 'seymour-natus';
/** The chapter's battle cue, the B15 stand-in (see the file header). */
const BATTLE_CUE = 'boss-seymour-macalania';

export const seymourNatusScripts: ChapterScripts = {
  pre: [
    // --- Interlude 1 — over black, where Chapter VIII's bells stop ---------
    fade('black', 0),
    wait(900),
    narrate('The bells were still going when we reached the steps.'), // 1
    narrate('They had rifles on us. She put her staff down.'), // 2
    narrate('He kissed her. Then he told them to shoot us.'), // 3
    narrate('She stepped off the edge, and Valefor caught her.'), // 4
    narrate("I thought that was the end of it. It wasn't close."), // 5
    beat(1200),

    // --- Interlude 2 — the trial and the Via Purifico, told -----------------
    narrate('They tried us in a room full of the dead.'), // 6
    narrate('Then they dropped us in the dark to get rid of us.'), // 7
    narrate('The water tasted like rust. We swam out anyway.'), // 8
    narrate('We found each other at the bridge. All of us.'), // 9

    // --- Beat 7 — the Highbridge, north end, before the Main Gate -----------
    camera('idle', 0),
    fade('clear', 1400),
    wait(600),
    // The two groups meet. Rikku runs the last few steps.
    say('rikku', "Yunie! You're okay! You're okay, right?"), // 10
    say('yuna', "I'm all right. I'm sorry I made you worry."), // 11
    say('wakka', "Nobody's okay. But everybody's here, ya?"), // 12
    // Footsteps from the gate: Seymour, unhurried, attendants behind him.
    music(BATTLE_CUE, 1800),
    sfx('footstep'),
    beat(1600),
    // He lets what he carries fall. It is Maester Kinoc. Nobody moves.
    say('auron', 'Kinoc.'), // 13
    say('seymour-macalania', 'He was afraid, so I gave him rest. It was a kindness.'), // 14
    say('seymour-macalania', 'Spira only knows how to hurt, Lady Yuna.'), // 15
    say('seymour-macalania', 'Come to Zanarkand with me. I will end all of it.'), // 16
    say('tidus', 'End it how? By becoming the thing that eats it?', { emotion: 'angry' }), // 17
    say('seymour-macalania', 'By becoming the only mercy Spira has left.', { emotion: 'smug' }), // 18

    // --- Beat 8 — Kimahri's stand ---------------------------------------------
    beat(1800), // Silence. Kimahri steps forward alone and plants his spear.
    say('kimahri', 'Yuna goes. Kimahri stays.', { emotion: 'determined' }), // 19
    // Seymour turns on his own attendants. Their pyreflies, and Kinoc's, pour into him.
    fx('pyreflies-rising'),
    wait(1200),
    flash(180),
    shake(10, 600),
    // What stands up is no longer shaped like a man.
    showActor(NATUS, { ms: 900, facing: -1 }),
    beat(1400),

    // --- Beat 9 — the retreat that turns round (the climax) ---------------------
    say('auron', 'Go. Now.'), // 20
    say('lulu', 'Yuna. Come.'), // 21
    beat(1600), // They run. Yuna slows, then stops. The others stop because she did.
    say('yuna', 'He is my guardian.', { emotion: 'determined' }), // 22
    say('tidus', 'Then so are we. All of us.'), // 23
    beat(1200), // They turn back together. Lulu looks at Auron; he almost smiles.
    say('auron', 'Hmph.'), // 24
    // Opening line-up Tidus, Yuna, Kimahri (B2 = a): the three who went back first.
    battleStart(),
  ],

  post: [
    // --- Interlude 3 — the Macalania Woods campsite, night (beat 10) ---------
    music(null, 1200),
    fade('black', 900),
    wait(700),
    narrate('We made camp under the trees, far from the city.'), // 25
    narrate("Nobody said much. The fire kept going out."), // 26
    narrate("Yuna prayed like always. I don't think it helped."), // 27
    narrate('Bevelle was shut to us after that.'), // 28
    narrate('So we went the only way left. The Calm Lands.'), // 29
    beat(1000),
    results(),
  ],

  // E10 is grim tier: §5.4 suppresses the light quips, and the draft writes none.
  victoryQuips: {},
  // The B9 callouts are held until Bailey reads the draft (D-085; see the header).
  mid: [],
  midScripts: {},
};

export default seymourNatusScripts;
