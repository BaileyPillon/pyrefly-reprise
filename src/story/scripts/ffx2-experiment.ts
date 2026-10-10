/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; the mission Masterpiece Theatre): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-10: "I'll add in those 2 chapter recommendations"; "i want those chapters added in over night while im sleep". The driver's pick: **concept B, the game's own
 * two-act Rematch** (research `concepts.md`). The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14-1.16 and §2.2: the three-beat banter, Rikku sets
 * up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore).
 *
 * The beats are the public sources' (`research/ffx2-experiment.md` §2.5, `[verified: GameFAQs HD guide 82362, wiki, Jegged]`), in our own words:
 *
 * 1. **pre**: the Faction's boast and dare, the rules (its power rises with the parts dug up in the desert, it breaks when beaten and can be rebuilt), and the readout, 1 / 1 / 1.
 * 2. **the seam** (`act-one-broken`, a chain seam, a mid-battle script that plays at Act I's fall): the first win, the cheeky line Paine whispers and Yuna delivers in Al Bhed, the
 *    technician's delight, **the rest** (one plain narration line: there is no Save Sphere at Djose, so the flow plays no card there; the engine still restores the party on entry to Act II),
 *    **the rebuild** (our compression of the game's hours of digging: each piece is installed the moment it is found), the readout again, 5 / 5 / 5, and the
 *    confession that the Faction overbuilt it and cannot stop it. It must fit {@link SEAM_BUDGET_MS}: a seam plays with the player's hands off.
 * 3. **mid-battle callouts** in Act II (two, each a short interrupt): the first Lifeslicer and the first Annihilator, in Paine's and Rikku's voices, naming the answer without naming the button.
 * 4. **post**: the crew's callback to its first boast, and **Paine's one sincere beat** (who taught her Al Bhed, and what changed her), the chapter's emotional point, then the run and the chase.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here (no transcript is in the repo and none is needed). The Al Bhed line Yuna speaks is stage direction only, not
 * invented Al Bhed. **Left out, on purpose:** the repair-manual prompt and the fight-or-walk prompt: a `choice` step is a defect in a mid-battle seam (the runner's rule), and "not yet"
 * has nowhere to go in a chain; the montage's three climbing gauges are narration lines here, not an overlay.
 *
 * **Speakers.** The girls speak with their approved FFX-2 portraits. The Faction's technician has no portrait and no speaker id of his own (the id list is a contract file), so his lines
 * are stage directions in the box with no name plate (`'none'`), as Chapter XVI's Abyss does for its unnamed voices.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed (the game's own Machine Faction theme has no cue of ours); each
 * act's fight is its formation's cue (`data/ffx2/enemies/experiment.ts`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, flash, music, results, say, sfx, shake, wait } from '../dsl.ts';
import { EXPERIMENT_ACTIONS } from '../../data/ffx2/enemies/experiment-levels.ts';
import { EXPERIMENT_ENEMY_ID, EXPERIMENT_PROTOTYPE_ID } from '../../data/ffx2/enemies/experiment.ts';

/** The `script-trigger` name that plays between the acts: Act I's fall. */
export const EXPERIMENT_SEAM = 'act-one-broken';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'The Machine Faction has taken over Djose Temple, and it has a surprise.'), // ours: the Faction's boast
  say('none', '"We built it ourselves," the lead technician says. "Nobody can beat it."'), // ours: built from desert parts, the dare
  say('paine', "That's a dare."), // ours: Paine hears the dare
  say('rikku-x2', "They want us to try! Obviously we're trying."), // ours: Rikku sets up
  say('none', '"It gets stronger with every part we dig up," he says. "Break it, and we rebuild it."'), // ours: the rules card
  say('yuna-x2', 'Um... how strong is it right now?'), // ours: Yuna reacts
  say('none', '"Attack one. Defense one. Special one. Barely a machine."'), // ours: the readout, 1 / 1 / 1
  say('paine', 'Then it is a warm-up.'), // ours: Paine kills it
  beat(800),
  say('yuna-x2', "Okay. Let's do it before I think about it too hard."), // ours (house sample line, writing bible §1.14)
  shake(8, 400),
  say('none', 'The machine lowers its head.'), // ours: it wakes
  battleStart(),
];

// ---------------------------------------------------------------------------- seam

/**
 * The chain seam between the acts: Act I's fall to the full weapon's entrance. Written to fit {@link SEAM_BUDGET_MS} (the runner cuts a seam at its own authored length plus a
 * short grace, capped at that budget); every `say` carries its own `auto`, so no beat sits on a Confirm. 24.1 seconds as authored by `scriptDurationMs` (typing included), 1.9 s under the budget; `tests/unit/chapters/experiment-story.test.ts` holds it there.
 */
const SEAM: StoryScript = [
  camera('action', 400),
  say('none', 'The machine folds in half. Smoke pours out.', { auto: 1200 }), // ours: it breaks
  say('rikku-x2', 'We trashed it! Ta-daaa!', { auto: 800 }), // ours: Rikku sets up
  say('none', 'Paine whispers. Yuna repeats it in Al Bhed, with a pose.', { auto: 1400 }), // ours: the cheeky line, stage direction only
  say('none', 'The technician laughs. "I will build something stronger."', { auto: 1500 }), // ours: he likes the attitude
  say('yuna-x2', 'He understood me?!', { auto: 800 }), // ours: Yuna is surprised
  flash(200, '#fff1b8'),
  // The rest between the acts, in one plain line (the driver, 2026-10-10: no Save Sphere card at Djose; the engine still restores the party on entry to Act II).
  say('none', 'The girls rest while the Machine Faction rebuilds the Experiment.', { auto: 1400 }),
  say('none', 'ATTACK 5. DEFENSE 5. SPECIAL 5.', { auto: 1200 }), // ours: the readout, 5 / 5 / 5 (our compression of the game's days of digging)
  shake(8, 300),
  say('none', '"We, um, got carried away. It will not listen to us."', { auto: 1400 }), // ours: the confession (our words over the sourced beat)
  say('paine', 'You built it. And cannot stop it?', { auto: 1200 }), // ours: Paine's flat reaction
  say('rikku-x2', 'Shame on you!', { auto: 800 }), // ours: Rikku scolds
  say('yuna-x2', 'There is only one thing to do.', { auto: 1100 }), // ours: Yuna's go-call
  camera('idle', 400),
];

// --------------------------------------------------------------------------- mid

const MID: MidBattleTrigger[] = [
  {
    id: EXPERIMENT_SEAM,
    when: { type: 'ko', who: EXPERIMENT_PROTOTYPE_ID },
    once: true,
    script: EXPERIMENT_SEAM,
  },
  {
    id: 'first-lifeslicer',
    when: { type: 'ability-used', who: EXPERIMENT_ENEMY_ID, ability: EXPERIMENT_ACTIONS.lifeslicer },
    once: true,
    script: 'first-lifeslicer',
  },
  {
    id: 'first-annihilator',
    when: { type: 'ability-used', who: EXPERIMENT_ENEMY_ID, ability: EXPERIMENT_ACTIONS.annihilator },
    once: true,
    script: 'first-annihilator',
  },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The machine goes dark. The crew peeks out from behind the crates.', { auto: 1800 }), // ours: it goes down for good
  say('none', '"You see?" the technician says. "Nobody beats the Experiment easily."', { auto: 2200 }), // ours: the callback to the first boast
  say('rikku-x2', 'We just did. Twice!', { auto: 1100 }), // ours: Rikku sets up
  say('paine', 'Whose side are you on?', { auto: 1100 }), // ours: Paine to the crew, who are cheering for the girls
  say('none', 'The crew cheers. Paine nods, dry as dust. "Thanks."', { auto: 1900 }), // ours: the dry thank-you
  beat(900),
  say('rikku-x2', 'Paine, who taught you Al Bhed anyway?', { auto: 1500 }), // ours: Rikku asks
  say('paine', 'Gippal. A little.', { auto: 1100 }), // ours: Paine answers short
  say('paine', 'I wanted a language that would stretch me.', { auto: 1700 }), // ours: the sincere beat begins (writing bible §2.2: at most four lines)
  say('paine', 'To see further, you open up.', { auto: 1500 }), // ours
  say('paine', 'Running with you two did that. Mostly by making me talk.', { auto: 2400 }), // ours
  say('yuna-x2', 'We thought we were bothering you.', { auto: 1500 }), // ours: Yuna answers
  say('paine', 'At first you were.', { auto: 1100 }), // ours: the joke returns
  sfx('confirm'),
  say('none', 'Yuna and Rikku giggle and run for the airship. Paine chases them.', { auto: 2200 }), // ours: the run and the chase
  say('none', 'Behind them the crew goes back to polishing the machine. Carefully, this time.', { auto: 2000 }), // ours: the Faction is not done
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [EXPERIMENT_SEAM]: SEAM,

  // Act II, the first Lifeslicer. Rikku sets up, Paine names the answer without naming the button.
  'first-lifeslicer': [
    say('rikku-x2', 'Whoa! That one takes everything she has!', { auto: 1500 }),
    say('paine', 'Keep a Phoenix Down ready.', { auto: 1300 }),
  ],

  // Act II, the first Annihilator. Yuna reacts, Paine says what to do next.
  'first-annihilator': [
    say('yuna-x2', 'It hit all of us!', { auto: 1200 }),
    say('paine', 'Heal. Then hit back.', { auto: 1300 }),
  ],
};

/** The chapter's story layer: the Faction's dare, Act I, the rebuild seam, the full weapon, and Paine's beat. */
export const ffx2ExperimentScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
