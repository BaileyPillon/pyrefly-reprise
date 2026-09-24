/**
 * Chapter 4 scripts — Bahamut (Bevelle Underground, Limbo). Scene tag E6.
 *
 * Source: `research/writing-bible.md` §3 E6, §4.2 (YRP banter bank), §5.4.
 *
 * Story knowledge state [writing-bible §0.3]: write to **Chapter 2**. The
 * Gullwings are still allied-by-necessity with the Leblanc Syndicate, Paine has
 * not had her Crimson Squad reckoning, and Yuna has not yet learned what Shuyin
 * is. The chapter *number* is a label; do not let "Ch. 3" leak into what the
 * characters know.
 *
 * Emotional job: **Yuna killing what she once summoned — the only fight the
 * game forbids you to celebrate.**
 *
 * > **This chapter suppresses the entire victory flourish.** No victory pose,
 * > no fanfare, no Win-slot banter and no results flourish; the Results screen
 * > comes up silent [writing-bible §5.4]. That is why `results(true)` is used
 * > below and why `victoryQuips` is deliberately empty. **Do not fill it in.**
 *
 * Three things this chapter must not contain [writing-bible §3 E6]: a fayth
 * scene, any knowledge of Shuyin or Lenne, and a victory flourish. The unit
 * test asserts the first two by string search.
 *
 * **Bahamut has no dialogue and must never have any.** Every line is the party
 * talking *about* him; the silence is the mechanical proof that Yuna's plea
 * failed.
 *
 * Use the FFX-2 register [writing-bible §2.2]: three-beat banter (Rikku sets up
 * -> Yuna reacts -> Paine kills it), overlap with em dashes, and **exactly one**
 * sincere exchange before the banter resumes. Here the sincerity lands after
 * the fight, not before it — and the banter engine is switched off from the
 * moment Rikku identifies the shape until Leblanc's joke in the post-battle.
 *
 * Music: the battle slot for this chapter must carry the sorrowful Yuna
 * leitmotif ("Yuna's Ballad" in the original), **not** a boss theme
 * [writing-bible §3 E6]. `boss-ffx2-aeon` is that slot [CONTRACT-CHANGES §8].
 *
 * Trigger rules, tested by `src/story/registry.ts`: `id === script` (the engine
 * emits the **id** and the presenter looks the script up by it), and every
 * mid-battle `say` carries an `auto` so no beat can sit on a Confirm.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  fx,
  music,
  results,
  say,
  setPose,
  sfx,
  shake,
  wait,
} from '../dsl.ts';

export const ffx2BahamutScripts: ChapterScripts = {
  pre: [
    music('scene-bevelle-underground', 1200),
    camera('idle', 0),
    fade('clear', 900),

    // --- Banter on, all the way to the chamber door. ----------------------
    say('rikku-x2', 'Creepy hole, creepy ladder, creepy hallway.'),
    say('yuna-x2', "Um. That's a lot of creepy."),
    say('paine', "It's Bevelle."),
    say('ormi', "Boss, it's — it's big in here."),
    say('leblanc', "It's empty, you lump. That's worse."),

    // Something at the far end they took for architecture moves.
    sfx('machina-groan'),
    shake(6, 900),
    beat(1600),

    // --- Banter off. It stays off until Leblanc's joke in `post`. ---------
    say('rikku-x2', "That's not machina.", { emotion: 'surprised' }),
    beat(1400),
    say('rikku-x2', "That's an aeon."),

    // Yuna steps forward past everyone. Nobody stops her, which is its own
    // mistake [writing-bible §3 E6 beat 6 — the centre of the encounter].
    camera('action', 1100),
    say('yuna-x2', 'Bahamut.'),
    say('yuna-x2', "It's me. You know it's me."),
    // It turns its head. Pale blown-out eyes, no pupil. Nobody is home.
    beat(2000),
    say('yuna-x2', 'Please. You have to stop.', { emotion: 'pained' }),
    beat(2000), // It does not answer. It never answers.

    say('paine', "It's not in there, Yuna."),
    say('paine', "Fight. You don't get another option."),

    // She raises the guns. Her hands are not steady, and it should show.
    setPose('yuna-x2', 'ready'),
    beat(1400),
    music('boss-ffx2-aeon', 1400),
    battleStart(),
  ],
  post: [
    // It falls. No victory pose. No fanfare. The music simply stops.
    music(null, 700),
    camera('idle', 900), // Deliberately not the victory rig.
    wait(3000), // Hold on Yuna standing still.
    fx('pyreflies-cold', 'bahamut'),
    wait(2200), // She watches until the last one clears the ceiling.
    // She starts the sending gesture, catches herself, lowers her hand.
    setPose('yuna-x2', 'cast'),
    wait(1200),
    setPose('yuna-x2', 'idle'),

    // The tally comes up inside the silence, with nothing attached to it.
    results(true),

    say('rikku-x2', '...Yunie.'),
    say('yuna-x2', "I'm fine. Let's find the machine."),

    // They turn to the sanctum. It is empty. The hole is the whole shot.
    camera('action', 1400),
    wait(1800),
    say('rikku-x2', 'Did it do that? Did it dig its own way out?'),
    say('paine', "That size doesn't leave in a hurry."),
    say('paine', 'Not unless something called it.'),
    say('yuna-x2', "This isn't how it was supposed to be."),

    // Leblanc's joke is load-bearing: the banter engine comes back on here,
    // and it works because nobody laughs.
    say('leblanc', 'Well. Obviously it heard I was coming.'),
    say('leblanc', 'Logos. Ormi. Record all of it. Every hole.'),
    say('logos', '...Recording the hole. Naturally.'),
    beat(1400),

    // End the chapter on Yuna's line; Brother plays over black.
    say('yuna-x2', 'The Calm. I can feel it coming apart.'),
    fade('black', 1400),
    say('brother-x2', 'Everyone back to the ship. Now!'),
    say('brother-x2', 'No arguing! This is a Brother order!'),
    wait(1400),
  ],
  /** Deliberately empty — Chapter 4 serves no victory quips [writing-bible §5.4]. */
  victoryQuips: {},
  mid: [
    {
      // The one beat this fight gets. Bahamut's loop is deterministic, so the
      // callout is a teaching tool: the Countdown is a timer, not mercy.
      id: 'first-mega-flare-countdown',
      when: { type: 'charge-started', who: 'bahamut' },
      once: true,
      script: 'first-mega-flare-countdown',
    },
    {
      // The loop does not change; the party's reading of it does. Two more
      // callouts, both about him rather than to him [writing-bible §3 E4-X2].
      id: 'bahamut-half',
      when: { type: 'hp-below', who: 'bahamut', fraction: 0.5 },
      once: true,
      script: 'bahamut-half',
    },
    {
      id: 'bahamut-low',
      when: { type: 'hp-below', who: 'bahamut', fraction: 0.2 },
      once: true,
      script: 'bahamut-low',
    },
  ],
  midScripts: {
    'first-mega-flare-countdown': [
      camera('action', 400),
      fx('mega-flare-charge', 'bahamut'),
      say('paine', "It stopped. That's not mercy.", { auto: 1100 }),
      say('paine', "That's a timer.", { auto: 1100 }),
      camera('idle', 400),
    ],
    'bahamut-half': [
      say('rikku-x2', 'Is it — Yunie, is it slowing down?', { auto: 1200 }),
      say('paine', "No. It's counting.", { auto: 1100 }),
    ],
    'bahamut-low': [
      say('yuna-x2', "It's almost over.", { auto: 1100 }),
      say('yuna-x2', 'You can rest. You can rest.', { emotion: 'pained', auto: 1400 }),
    ],
  },
};

export default ffx2BahamutScripts;
