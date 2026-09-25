/**
 * Chapter XIV — Isaaru, the last chamber of the Via Purifico beneath Bevelle
 * (FFX). Proposed scene tag **E14** (the draft's; grim tier, like E1, E2, E4
 * and E9).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Isaaru the summoner, his three
 * aeons and Yuna's are FFX's, at FFX's point in the story (after the trial at
 * Bevelle, before the Highbridge; `research/ffx-isaaru-bevelle.md` §6.1, §8).
 * FFX cutscene grammar (`research/writing-bible.md` §2.1); in FFX-2 Isaaru is a
 * tour guide and nobody summons.
 *
 * ## Where the lines come from
 *
 * Every line is `docs/plans/isaaru-story-draft.md`, numbered 1 to 24 there and
 * here, unchanged. The **events** are canon (research §8.2, `[verified: 3
 * sources]` on the story position); **the wording is ours**: no line quotes or
 * reworks the game's script [AGENTS.md rule 8], and Isaaru's three battle
 * cries are written fresh. Maester **Kinoc** gave the order (research I-9: the
 * script over the wiki's Mika). Bailey's picks followed (2026-09-25, "I'll go
 * with all your recommendations", D-147): **B14 a** Yuna has found Auron, Lulu
 * and Kimahri, who stand in the scene and never fight; **B15 a** Tidus's
 * past-tense narration, as Yuna later told it; **B17** the mid-battle callouts.
 * The draft's five "react to" questions were answered by the same yes, so each
 * is built as the draft recommends: lines 13 and 16 kept, line 22 as written,
 * the cries on, one quiet victory quip.
 *
 * ## The callouts (B17) and how each fires
 *
 * - **Link 1's cry and lock line** close `pre`, right before `battleStart()`:
 *   he calls Grothia in front of her, and she finds her Ifrit will not come.
 * - **Links 2 and 3** open on a seam fired off the previous aeon's KO (the
 *   Vegnagun `tail-down` precedent): his cry, then her lock line.
 * - **The Hellfire warning** (Lulu) fires after the first action of link 1
 *   resolves (`hp-below` Grothia at `fraction: 1`, the Shuyin precedent: no
 *   trigger watches a summon). Grothia opens with a full gauge (research §4.1),
 *   so it lands before his first Hellfire whoever moves first.
 * - **Not built here, owed to the listing step:** Kimahri's "count reads 1"
 *   and Lulu's "last aeon" lines. Neither moment is a trigger the story can
 *   watch (no condition reads a flag or the Summon list), so each needs the
 *   Isaaru AI to emit a named `script-trigger`, and every AI-emitted name must
 *   be on `src/story/registry.ts`'s `AI_EMITTED_TRIGGERS`, which gains this
 *   chapter's key only when the chapter is listed (the Trema precedent). The
 *   count itself is on screen all the while (the AI's telegraph, B20).
 *
 * ## The exit
 *
 * Each of his aeons breaks into pyreflies at its KO (B19, the engine's
 * dissolve). Isaaru never falls: he is a bystander with no turn (B8). The post
 * scene's beat says he kneels, but he has one painting, the O-1 A idle, so the
 * stage shows him standing on his own spot (a kneeling pose is not painted).
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, hideActor, music, narrate, results, say, showActor, wait } from '../dsl.ts';

/**
 * Combatant ids, mirrored from `src/data/ffx/enemies/isaaru.ts` (`src/story`
 * does not reach into `src/data`; `isaaru-ship.test.ts` pins them equal).
 */
export const ISAARU_STORY_IDS = { isaaru: 'isaaru', grothia: 'grothia', pterya: 'pterya', spathi: 'spathi' } as const;

/** The two seams between the links: trigger ids, and their scripts' keys. */
export const ISAARU_SEAMS = { pterya: 'pterya-called', spathi: 'spathi-called' } as const;

/** One callout: a single line under the mid-battle budget (8 s), always auto-advancing. */
function callout(line: ReturnType<typeof say>): StoryScript {
  return [{ ...line, auto: line.auto ?? 1800 }];
}

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  // --- Interlude, over black (B15 a) ------------------------------------
  narrate('Yuna told me about the maze later. Some of it.'), // 1
  narrate('They split us up and dropped her in the dark alone.'), // 2
  narrate('The walls were cold, she said. The light was red.'), // 3
  narrate("I figured she'd been waiting for someone to find her."), // 4
  narrate("She wasn't. She was the one doing the finding."), // 5
  wait(900),

  // --- Beat 4, the red-lit hallway -------------------------------------
  // Stand-in cue until B21's "Still Water" is sketched and picked by ear (rule 13).
  music('scene-gagazet', 1400),
  camera('intro', 0),
  fade('clear', 1200),
  wait(900),
  say('kimahri', 'Red light. Kimahri does not like it.'), // 6
  say('auron', 'The way out is ahead. Keep walking.'), // 7

  // --- Beat 5, the final chamber ----------------------------------------
  // A man in a dark coat at the far end, alone, between them and the way up. He bows first.
  showActor(ISAARU_STORY_IDS.isaaru, { ms: 1200, facing: -1 }),
  camera('idle', 1100),
  beat(1200),
  say('isaaru', 'Lady Yuna. I prayed it would be anyone but you.'), // 8
  say('yuna', "Isaaru... You're here to stop us."), // 9
  say('isaaru', 'Maester Kinoc sent me. The traitors may not leave.'), // 10
  say('yuna', 'You know what they say we did.'), // 11
  say('isaaru', 'I know what the temple says. For me, that is enough.'), // 12
  say('isaaru', "Even for Lord Braska's daughter. I am sorry."), // 13
  beat(900), // Lulu looks past him at the empty chamber.
  say('lulu', 'Where are your brothers?'), // 14
  say('isaaru', 'Far from here. This, I will do alone.'), // 15
  beat(1400), // Kimahri's grip tightens on his spear. Auron does not move.
  say('auron', 'Summoner against summoner. We stand back.'), // 16
  say('isaaru', 'Forgive me, Lady Yuna.'), // 17
  beat(1000), // She does not answer. She raises her staff. So does he.

  // --- Link 1's card and lock line (B17) -------------------------------
  music('boss-yojimbo', 1200), // B21 = b's stand-in boss cue, as the record has it
  say('isaaru', 'Grothia! Close the way!'),
  say('yuna', "His Ifrit answers the same fayth. Mine won't come."),
  battleStart(),
];

// ---------------------------------------------------------------------- seams

/** A link's opening, between the formations: his cry, then her lock line. */
function seam(cry: string, lock: string): StoryScript {
  return [camera('enemy', 700), say('isaaru', cry, { auto: 1600 }), camera('idle', 700), say('yuna', lock, { auto: 1800 })];
}

const MID_SCRIPTS: Record<string, StoryScript> = {
  [ISAARU_SEAMS.pterya]: seam('Pterya. Rise, and hold her here.', "Valefor... You can't come to me while he holds you."),
  [ISAARU_SEAMS.spathi]: seam('Spathi... let this be the last.', 'Not Bahamut. Not against himself.'),
  // Link 1: Grothia's gauge is full at the start (research §4.1), so Hellfire is his first move with an aeon out.
  'grothia-ready': callout(say('lulu', 'Yuna. His aeon is ready. Guard first.')),
};

const MID: MidBattleTrigger[] = [
  { id: ISAARU_SEAMS.pterya, when: { type: 'ko', who: ISAARU_STORY_IDS.grothia }, once: true, script: ISAARU_SEAMS.pterya },
  { id: ISAARU_SEAMS.spathi, when: { type: 'ko', who: ISAARU_STORY_IDS.pterya }, once: true, script: ISAARU_SEAMS.spathi },
  { id: 'grothia-ready', when: { type: 'hp-below', who: ISAARU_STORY_IDS.grothia, fraction: 1 }, once: true, script: 'grothia-ready' },
];

// ---------------------------------------------------------------------- post

const POST: StoryScript = [
  // --- Beat 7, after Spathi falls ---------------------------------------
  music(null, 1200),
  showActor(ISAARU_STORY_IDS.isaaru, { ms: 0, facing: -1 }),
  camera('victory', 900),
  beat(1600), // Isaaru kneels. The last pyreflies thin out. Yuna goes to him, hands already glowing.
  say('isaaru', 'No. Please. Keep that for the road ahead.'), // 18
  say('yuna', 'Isaaru...', { emotion: 'sad' }), // 19
  say('lulu', 'Yuna. We have to go.'), // 20
  say('isaaru', 'The way up is behind me. Go quickly.'), // 21
  beat(1600), // Yuna bows to him, deep and slow. He returns it from his knees.
  say('auron', 'Go home, summoner. Your road ends here.'), // 22
  beat(1200), // He does not answer. They climb toward the light.
  hideActor(ISAARU_STORY_IDS.isaaru, 1200),
  fade('black', 1400),

  // --- Interlude, over the stairs: the hand-off to the Highbridge (Chapter X)
  narrate('The stairs came out on the bridge, in the wind.'), // 23
  narrate("We were already there. I didn't ask what it cost her."), // 24
  wait(900),
  results(),
];

/** Chapter XIV's story layer. */
export const isaaruScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  // E14 is grim tier (§5.4): the light quips are suppressed; one quiet line for Yuna, the only one fighting.
  victoryQuips: { yuna: ["...I'm sorry, Isaaru."] },
  mid: MID,
  midScripts: MID_SCRIPTS,
};

export default isaaruScripts;
