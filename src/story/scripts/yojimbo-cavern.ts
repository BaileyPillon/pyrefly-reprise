/**
 * Chapter IX — Yojimbo, in the Cavern of the Stolen Fayth (FFX). Proposed
 * scene tag **E9** (grim tier, like E1, E2 and E4).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Lady Ginnem, Lulu's first
 * summoner, the stolen fayth and the sending are FFX's, at FFX's point in the
 * story (the first walk through the Calm Lands, after Bevelle and before
 * Gagazet; `research/ffx-yojimbo.md` §5.1). FFX cutscene grammar
 * (`research/writing-bible.md` §2.1); the FFX-2 register does not apply.
 *
 * ## Where the lines come from
 *
 * Every line is the draft in `docs/plans/yojimbo-story-draft.md`, numbered 1
 * to 32 there and here, unchanged. The **events** are canon (research §6.2,
 * beats 1 to 5, `[verified: 2 sources]`); **the wording is ours** and no line
 * quotes or reworks the game's script [AGENTS.md rule 8]. The draft's own
 * recommended options are the ones built:
 *
 * - **G-1**: Lady Ginnem stays **silent**. No source gives her words, and she
 *   has no approved portrait, so she never speaks here.
 * - **L-1**: Lulu's one raised line is in the post scene (line 31), per
 *   writing-bible §1.6 ("exactly once per arc when grief cracks through").
 * - **No victory quips**: E9 is grim tier, so §5.4 suppresses the light ones.
 *
 * ## Not built, on purpose
 *
 * - **The four mid-battle callouts** (gauge crosses 50 %, "Zanmato next turn",
 *   Doom lands, an aeon takes Zanmato). Bailey said yes to them (D-068) on the
 *   promise that he reads the story draft first; that read has not happened,
 *   so `mid` and `midScripts` stay empty.
 * - **The haggle and the hiring** (research §7): no hiring this release
 *   (D-052). The post scene ends as Yuna goes on to the fayth.
 * - **Tidus's narration interlude**: the draft leaves it out.
 *
 * ## The exit (D-076)
 *
 * Yojimbo and Daigoro are recalled together at the kill, like Anima (our
 * reading: no source describes the exit), which the presenter plays
 * (`src/engine/BattlePresenterRecall.ts`). Lady Ginnem stays on the field
 * until Yuna sends her, which is the first beat of `post` below.
 *
 * ## Music
 *
 * - **Beats 1 and 2** (the cave mouth and the walk in) play `scene-gagazet`
 *   as a **stand-in**: the cave's own location theme has no cue of ours
 *   (research §6.1 names it; the plan's `scene-cavern` is optional and
 *   unbuilt), and Chapter VII uses the same stand-in the same way.
 * - **From beat 3** (the pyreflies gather) the chapter's own cue,
 *   `boss-yojimbo` ("The Summoner's Sorrow", O-6 sketch A, Bailey's pick,
 *   D-063), starts on its solo-cello opening and carries through
 *   `battleStart()` into the fight: research §6.4 puts "Lulu's Theme" under
 *   Ginnem's scene **and** the battle `[verified: 2 sources]`, and this cue is
 *   ours in that slot. The formation's start cue names the same track, so the
 *   battle does not restart it (`AudioManager.playMusic` skips a track that is
 *   already playing).
 * - **The post scene** opens by fading the battle cue to silence. The sending
 *   plays unscored; the victory fanfare starts on its own at `results()`.
 *
 * Portraits: Lulu, Wakka, Tidus, Auron, Rikku, Kimahri and Yuna all have
 * approved portraits. Every one of the seven guardians is in the Cavern
 * (research §5.2), whichever three are fighting.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  flash,
  fx,
  hideActor,
  music,
  results,
  say,
  sfx,
  shake,
  wait,
} from '../dsl.ts';

/**
 * Lady Ginnem's combatant id, mirrored from `src/data/ffx/enemies/yojimbo.ts`
 * (`GINNEM_ID`). Mirrored rather than imported: `src/story/**` does not reach
 * into `src/data/ffx/**`, as in the other chapters.
 */
const GINNEM = 'ginnem';

export const yojimboCavernScripts: ChapterScripts = {
  pre: [
    music('scene-gagazet', 1400), // stand-in: see the file header
    camera('idle', 0),
    fade('clear', 1100),
    sfx('wind-gust'),
    wait(1200),

    // --- Beat 1 — Gorge Bottom, under the bridge -------------------------
    // Wind off the Calm Lands. Lulu stops a step short of the cave mouth.
    say('lulu', 'There is a fayth inside. And fiends.'), // 1
    say('wakka', 'Wait. This is the place, ya? Where you and her...'), // 2
    say('lulu', 'Yes.'), // 3
    say('tidus', 'Her who?'), // 4
    say('lulu', 'The first summoner I guarded. She died in there.'), // 5
    beat(1600), // Lulu does not move. The others go in; she follows.

    // --- Beat 2 — partway in --------------------------------------------
    say('lulu', 'The fayth was taken from a temple. Long ago.'), // 6
    say('auron', 'No fayth, no training. No training, no Final Aeon.'), // 7
    say('rikku', 'So whoever stole it saved somebody. Good.'), // 8
    say('wakka', "...Can't say I hate that."), // 9
    beat(1500), // Cut to Yuna. She does not answer.

    // --- Beat 3 — the far chamber ---------------------------------------
    // Pyreflies gather in the dark into a woman in a summoner's robes.
    // Research §6.4: this is where "Lulu's Theme" begins; ours is the cue.
    music('boss-yojimbo', 1800),
    camera('idle', 1400),
    fx('pyreflies-rising', GINNEM),
    wait(1400),
    say('kimahri', 'Unsent.'), // 10
    say('lulu', '...Lady Ginnem.', { emotion: 'pained' }), // 11
    say('tidus', 'You know her?'), // 12
    say('lulu', 'I was her guardian. Her only one.'), // 13
    say('lulu', 'I was too young to keep her alive.', { emotion: 'sad' }), // 14

    // --- Beat 4 — the sending, broken -----------------------------------
    // Yuna steps forward and raises her staff: the first turn of the sending.
    fx('sending-dance', 'yuna'),
    wait(1200),
    // Ginnem lifts one hand. A shock wave throws the sending apart.
    flash(160),
    shake(9, 520),
    say('yuna', "She won't let me send her.", { emotion: 'surprised' }), // 15
    say('auron', "Then there's nothing left of her to ask."), // 16
    say('lulu', 'No. There is one thing left.'), // 17
    say('lulu', 'I still owe her a guardian.'), // 18
    say('lulu', 'Stand back, Yuna. This one is mine.', { emotion: 'determined' }), // 19
    // The air behind Ginnem splits. Yojimbo steps through, and the dog.
    battleStart(),
  ],

  post: [
    // Yojimbo and Daigoro are already gone (recalled together at the kill,
    // D-076). Ginnem remains, still.
    music(null, 1200),
    camera('idle', 900),
    beat(1600),

    // --- Beat 5 — the sending holds -------------------------------------
    fx('sending-dance', 'yuna'),
    wait(1400),
    fx('pyreflies-rising', GINNEM),
    hideActor(GINNEM, 1600),
    beat(1400),
    say('yuna', "She's gone. Truly, this time.", { emotion: 'sad' }), // 20
    say('lulu', '...'), // 21
    say('lulu', 'I thought this would hurt more.'), // 22
    // The scene's one light line, placed before the crack (draft note).
    say('wakka', 'You were good, Lu. You were really good.'), // 23
    say('lulu', 'Wakka.'), // 24
    say('wakka', "I'm just sayin'. Stronger than before, ya?"), // 25
    say('lulu', 'Perhaps.'), // 26
    // Understate for four lines, one unguarded line, cut within two
    // (writing-bible §2.1).
    say('tidus', 'Were you with her the whole way?'), // 27
    say('lulu', 'Not the whole way. That was the problem.'), // 28
    say('auron', 'You finished it.'), // 29
    say('lulu', 'Yes. I did.'), // 30
    say('lulu', 'I was supposed to finish it THEN!', { emotion: 'pained' }), // 31
    beat(2000), // Nobody answers. Lulu turns away and steadies herself.
    say('lulu', '...Go on, Yuna. The fayth is waiting for you.'), // 32
    beat(1200),
    results(),
  ],

  // E9 is grim tier: §5.4 suppresses the light quips, and the draft writes none.
  victoryQuips: {},
  // The four callouts are held until Bailey reads the draft (D-068).
  mid: [],
  midScripts: {},
};

export default yojimboCavernScripts;
