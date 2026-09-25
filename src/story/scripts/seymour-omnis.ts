/**
 * Chapter XII — Seymour Omnis, the Garden of Pain inside Sin (FFX). Proposed scene tag **E12**
 * (the draft's; Yojimbo, Natus and Fallen Aeons proposed E9 to E11, Trema E13). Tonal tier:
 * grim, like E1, so there are no victory quips (writing-bible §5.4).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. FFX cutscene grammar (writing-bible §2.1): Tidus
 * narrates the interlude in the past tense, the scene plays live, and the climax understates for
 * three or four lines, lets one line through, and cuts within two. Voices: Seymour §1.9, Tidus
 * §1.1 and §1.2, Yuna §1.3 (her one "Yes." beat is spent here), Auron §1.4, Wakka §1.5, Lulu §1.6.
 *
 * ## Where the lines come from
 *
 * Every line is `docs/plans/omnis-story-draft.md`, numbered there and here, unchanged, with the
 * draft's first choice wherever it offers an alternative (line 12 "Yes.", line 15 the bare
 * goodbye, line 1 alone). The **events** are canon (research §8.2, verified: 2 sources for beats 3
 * to 5); **the wording is ours**: no game line is quoted or reworked, and Seymour's iconic battle
 * line stays out (bible §1.9). Bailey's picks followed (2026-09-25, "I'll go with all your
 * recommendations", then "all recommendations please"): **B15** the callouts are in; **B16 = a**
 * one narration line for the dive, no airship fight; **B3 = a** no Anima, so no Anima line;
 * **B17 = c** Seymour speaks with his own Omnis portrait (portrait A, installed and locked).
 *
 * ## The callouts
 *
 * Every mid-battle line is keyed by a name the Omnis rules emit (`OMNIS_STORY_TRIGGERS`, mirrored
 * from `src/battle/ffx/ai/seymour-omnis-callouts.ts`; a test pins the two): the turn-one disc
 * lesson (Auron's, or Lulu's when she is on the field) and the lines before his first Dispel and
 * before each Ultima play **before** his action; the first disc turned (Wakka's line when he
 * turned it), the first glow, the first reset and the fall below 20,000 play as they happen. The
 * draft's one line that had no second voice (the first disc turned by someone other than Wakka)
 * drops Wakka's "ya" for Tidus: `It moved! Hit 'em, and they turn!`, our own variation.
 *
 * ## The exit
 *
 * Seymour is beaten and stays up (`'held'`, `BattlePresenterDepartures.ts`): the sources have him
 * fall to his knees and be sent (research §4.6, verified: 2 sources), so the post scene sends him.
 * There is no kneeling painting (INSTALLED.md: "His end is the sending, a story beat"), so he
 * stands in his battle idle while Yuna dances, then the pyreflies take him.
 */

import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, fx, hideActor, music, narrate, results, say, showActor, wait } from '../dsl.ts';

/** Seymour Omnis's combatant id, mirrored from `src/data/ffx/enemies/seymour-omnis.ts` (`OMNIS_ID`). */
export const OMNIS_ACTOR = 'seymour-omnis';

/**
 * The names the Omnis rules emit, each with its line below. Mirrored from
 * `src/battle/ffx/ai/seymour-omnis-callouts.ts` (`OMNIS_CALLOUTS`) so `src/story` stays out of
 * `src/battle`; `tests/unit/chapters/omnis-ship-story.test.ts` pins the two lists equal.
 */
export const OMNIS_STORY_TRIGGERS = {
  lesson: 'omnis-disc-lesson',
  lessonLulu: 'omnis-disc-lesson-lulu',
  turned: 'omnis-disc-turned',
  turnedWakka: 'omnis-disc-turned-wakka',
  glow: 'omnis-first-glow',
  dispel: 'omnis-before-dispel',
  ultima: 'omnis-before-ultima',
  reset: 'omnis-first-reset',
  low: 'omnis-below-20000',
} as const;

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  // Stand-in scene cue: the inside of Sin already has one (`scene-dreams-end`, Chapter III's
  // dungeon); the Garden's own music (research §8.4) is not written (B18, rule 13).
  music('scene-dreams-end', 1400),
  camera('idle', 0),
  // --- Interlude: the dive (B16 = a, one line) ------------------------
  // The draft says "over black"; the cutscene's black is a screen fade that also covers the
  // dialogue box, so the line plays as the Garden fades in (Chapter IX's opening shape).
  fade('clear', 1400),
  narrate('We flew into its mouth. The sea inside was red.'), // 1
  wait(600),

  // --- Beat 3: the Garden of Pain. Live ---------------------------------
  // A long flight of steps; the party climbs. Four great discs stand at the top, still.
  // Laughter from above. Seymour hovers before the discs, and they begin to turn.
  showActor(OMNIS_ACTOR, { ms: 1400, facing: -1 }),
  beat(1200),
  say(OMNIS_ACTOR, 'Welcome, Lady Yuna. Welcome into Sin.'), // 2
  say('tidus', 'You. Again. How are you even still here?'), // 3
  say(OMNIS_ACTOR, 'Sin chose me. I am part of it now, and I am learning it.'), // 4
  say(OMNIS_ACTOR, 'You struck down Yunalesca. There is no Final Aeon now.'), // 5
  say(OMNIS_ACTOR, 'Nothing is left in Spira that can end Sin. Only me.'), // 6
  beat(1400), // Cut to Yuna. She does not answer.
  say('tidus', "We can. That's what we came here to do."), // 7
  say(OMNIS_ACTOR, 'Then understand the price, son of Jecht.'), // 8
  say(OMNIS_ACTOR, "Your death is your father's life. Come and pay it."), // 9
  // Opening line-up Tidus, Yuna, Auron (B2 = a), every switch legal from turn one.
  battleStart(),
];

// ------------------------------------------------------------------ callouts

/** One callout: a single line under the beat budget (8 s), always auto-advancing. */
function callout(line: ReturnType<typeof say>): StoryScript {
  return [{ ...line, auto: line.auto ?? 1800 }];
}

const T = OMNIS_STORY_TRIGGERS;
const LESSON = 'The discs. Every one of them faces him with fire.';

const MID_SCRIPTS: Record<string, StoryScript> = {
  [T.lesson]: callout(say('auron', LESSON)),
  [T.lessonLulu]: callout(say('lulu', LESSON)),
  [T.turnedWakka]: callout(say('wakka', "It moved! Hit 'em, and they turn, ya?")),
  [T.turned]: callout(say('tidus', "It moved! Hit 'em, and they turn!")),
  [T.glow]: callout(say('auron', "He's gathering himself. Brace.")),
  [T.dispel]: callout(say(OMNIS_ACTOR, 'Your little blessings. Let me take them from you.')),
  [T.ultima]: callout(say(OMNIS_ACTOR, 'Rest now. All of you, together.')),
  [T.reset]: callout(say('tidus', 'They all changed colour. Start again!')),
  [T.low]: callout(say(OMNIS_ACTOR, 'Pain is a gift, Lady Yuna. I give it back to you.')),
};

// ---------------------------------------------------------------------- post

const POST: StoryScript = [
  // --- Beat 5: the sending (the pay-off of four Seymour chapters) -------
  // The discs stop. Seymour sinks on the top step. He is fading.
  music(null, 1200),
  showActor(OMNIS_ACTOR, { ms: 0, facing: -1 }),
  camera('idle', 900),
  beat(1600),
  say(OMNIS_ACTOR, 'So. This is how it ends for me.'), // 10
  say('wakka', "Yuna. Send him. Now, while he can't fight it."), // 11
  beat(1600), // Cut to Yuna. She looks at Seymour for a long moment.
  say('yuna', 'Yes.'), // 12
  // She raises her staff and begins the sending dance. Pyreflies lift from him.
  fx('sending-dance', 'yuna'),
  wait(1400),
  fx('pyreflies-rising', OMNIS_ACTOR),
  say(OMNIS_ACTOR, 'You think this ends the sorrow? It will outlive me.'), // 13
  say(OMNIS_ACTOR, 'It outlives everyone, Lady Yuna. Even you.'), // 14
  // He does not resist. He is gone. The dance ends. Silence.
  hideActor(OMNIS_ACTOR, 1800),
  beat(1800),
  say('yuna', '...Goodbye, Seymour.', { emotion: 'sad' }), // 15
  beat(1400), // Nobody speaks. Kimahri looks away from where he was.
  say('tidus', "Sin's next. My old man's waiting."), // 16
  say('auron', "Then don't keep him waiting."), // 17
  // Then Chapter III (Braska's Final Aeon, Dream's End) is next in story order.
  results(),
];

/** Chapter XII's story layer. */
export const seymourOmnisScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  // E12 is grim tier: writing-bible §5.4 suppresses the light quips, and the draft writes none.
  victoryQuips: {},
  // Every callout is AI-emitted (see the file header), so no `MidBattleTrigger` is needed.
  mid: [],
  midScripts: MID_SCRIPTS,
};

export default seymourOmnisScripts;
