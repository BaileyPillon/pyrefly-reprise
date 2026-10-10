/**
 * The hidden Sinspawn Gui chapter, Mushroom Rock Road (FFX; Operation Mi'ihen): the scene before the first fight, the seam between the two fights and the scene after the second.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Ridge, Operation Mi'ihen and Seymour's one fight at the party's side are FFX's (`research/ffx-sinspawn-gui.md` sections 1 and 8).
 * FFX cutscene grammar and the voices of `research/writing-bible.md` (section 1.9 for Seymour: long balanced clauses, "Lady Yuna", courteous condescension, mercy language; section 2.1:
 * understate for three or four lines, then one unguarded line, then cut away). **The events are canon, paraphrased in the research (section 8.2 beats 1 to 6); every line is ours** and
 * quotes nothing of the game's script [AGENTS.md rule 8]. Seymour is the man who has not yet been crossed: his menace is courtesy, and he says nothing that is only true after Macalania.
 *
 * ## What is here, and the driver's pick it follows
 *
 * The concept pick is Concept A, "Two Rounds on the Ridge" (`docs/plans/ch-gui-review.md`): the seam between the two fights is **a white-out and three plain lines of Tidus**, not a beam in
 * real time (the first fight ends; the field is struck white; the second opens on the ruined camp with the guest hour). `pre` is ten lines, the seam three, `post` nine.
 *
 * ## Not built, on purpose
 *
 * - **Painted stills at the seam** (the rising, the cannons, the beam): the battle's cutscene ports have no backdrop step, and the stills are an optional art pass (`new-chapters-picks.md`,
 *   item 5). The white-out stands in for them.
 * - **Victory quips**: the fight is grim, so the light ones are suppressed (writing bible section 5.4).
 *
 * ## Wiring
 *
 * - The seam is a mid-battle script on **the first body's KO** (`GUI_SEAM`): it plays between the two formations, after the fight is won and before the next is staged. Like the
 *   Experiment's story this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); the runner's deadline reads the script itself
 *   (`midBattleDeadlineMs`), and `tests/unit/chapters/sinspawn-gui-story.test.ts` audits the lint, the budget (`SEAM_BUDGET_MS`) and the trigger-to-script agreement.
 * - One callout (`gui-head-shakes`) answers the head's first shake in each fight: Auron's ten words (`charge-started` on the head, once a battle).
 * - Music: the chapter's scene cue plays under `pre` and `post` (the record's `music.scene`, a stand-in); the first fight's cue (`boss-dread`) starts at `battleStart()` and the formation's own
 *   start cue names it, so the battle does not restart it.
 */

import type { ChapterScripts } from '../dsl.ts';
import { backdrop, battleStart, beat, camera, fade, flash, fx, hideActor, music, narrate, parallel, results, say, shake, wait } from '../dsl.ts';

/** The first body's combatant id and the seam it ends on, mirrored from `src/data/ffx/sinspawn-gui-ids.ts` (the story layer does not reach into the data layer). */
const GUI_BODY = 'sinspawn-gui';
const GUI_HEAD = 'sinspawn-gui-head';
export const GUI_SEAM = 'gui-falls';
export const GUI_HEAD_CALLOUT = 'gui-head-shakes';
export const GUI_REQUIEM_CALLOUT = 'gui-requiem-ready';
const SEYMOUR = 'seymour-macalania';
/** The head and the arms are alive when the body falls and the battle is won: the seam takes them off the field first. */
const GUI_PARTS = ['sinspawn-gui-head', 'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'] as const;
/** The second fight's plate, mirrored from `src/data/ffx/sinspawn-gui-ids.ts` (`MUSHROOM_ROCK_RUINED_PLATE`; the story layer does not reach into the data layer): the post scene is the ruined camp. */
const RUINED_PLATE = 'mushroom-rock-road-ruined';

export const sinspawnGuiScripts: ChapterScripts = {
  pre: [
    // --- The Ridge, before the cage opens -------------------------------------------------
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    say('tidus', 'So the plan is a cage, and then we wait?'), // 1
    say('auron', 'Sin comes for its own. They only have to wait.'), // 2
    say(SEYMOUR, 'Hope is a kind of courage, Lady Yuna. I would not take it from them.'), // 3
    say('yuna', 'You do not think it will work.'), // 4
    say(SEYMOUR, 'I think they are brave. It is not quite the same thing.'), // 5
    beat(1500),
    // The cage groans. Nobody has touched it.
    shake(8, 900),
    say('wakka', "That wasn't supposed to happen, ya?"), // 6
    say('lulu', 'No.'), // 7
    say('auron', 'Weapons. Now.'), // 8
    say('tidus', 'Everybody stay behind me!'), // 9
    say('kimahri', 'Kimahri stands in front.'), // 10
    battleStart(),
  ],

  post: [
    // --- The ruined camp, after the guest hour --------------------------------------------
    music(null, 900),
    backdrop(RUINED_PLATE, 0), // the guest hour was fought in the ruined camp, and so is this
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('yuna', 'Is everyone here? Is everyone...'), // 1
    say('auron', 'Those who can answer. Count the rest later.'), // 2
    say(SEYMOUR, 'You fought with great courage, Lady Yuna.'), // 3
    say(SEYMOUR, 'If Spira asks more of you, I will gladly stand beside you.'), // 4
    say('yuna', 'Thank you, Maester Seymour. I will remember it.'), // 5
    beat(1500),
    say('tidus', "He's awfully polite for someone who just fought a monster."), // 6
    say('auron', 'Politeness keeps people at arm\'s length.'), // 7
    say('yuna', 'Auron. He helped us.'), // 8
    say('auron', 'Yes. He did.'), // 9
    results(),
  ],

  victoryQuips: {},

  mid: [
    // The first body falls: the seam. The next fight is staged after it (the chain flow); the beam itself is never shown.
    { id: GUI_SEAM, when: { type: 'ko', who: GUI_BODY }, once: true, script: GUI_SEAM },
    // The head's first shake in a fight: Auron's callout (ten words at most, writing bible section 3 E6).
    { id: GUI_HEAD_CALLOUT, when: { type: 'charge-started', who: GUI_HEAD }, once: true, script: GUI_HEAD_CALLOUT },
    // The guest hour only (Seymour is no combatant of the first fight): his gauge reaches 100 and Requiem is ready; he says so in his own voice, once.
    { id: GUI_REQUIEM_CALLOUT, when: { type: 'overdrive', who: 'seymour' }, once: true, script: GUI_REQUIEM_CALLOUT },
  ],

  midScripts: {
    // --- The seam: a white-out and three plain lines (Concept A). About 15 s, hands off. -------
    [GUI_SEAM]: [
      music(null, 900),
      camera('idle', 700),
      fx('pyreflies-rising', GUI_BODY),
      parallel(...GUI_PARTS.map((id) => hideActor(id, 700))), // the head and the arms go with it
      wait(1100),
      // Tidus tells it in the past tense, over the white.
      fade('white', 3600),
      narrate('The cannons all fired at once. It did not even slow down.', 2200),
      shake(10, 700),
      fade('white', 3000),
      narrate('Then the light came, and the beach was not there any more.', 2200),
      wait(500),
      narrate('I never felt myself fall.', 2000),
      // Cover for the next formation being staged under it.
      flash(1200, '#ffffff'),
      wait(700),
    ],
    // Auron if he is on the field (always, in the second fight); in the first fight the player picks three of six, so any of the others says it (PR-0037: only a fielded character speaks mid-battle).
    [GUI_REQUIEM_CALLOUT]: [say(SEYMOUR, 'It is time. Stand clear, Lady Yuna.', { auto: 1600 })],
    [GUI_HEAD_CALLOUT]: [
      say('auron', 'The head is shaking! Hit it now!', {
        auto: 1400,
        fallback: [{ who: 'tidus' }, { who: 'lulu' }, { who: 'wakka' }, { who: 'kimahri' }, { who: 'yuna' }],
      }),
    ],
  },
};

export default sinspawnGuiScripts;
