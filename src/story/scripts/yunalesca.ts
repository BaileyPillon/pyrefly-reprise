/**
 * Chapter 2 scripts — Lady Yunalesca (Zanarkand Dome, The Beyond). Scene tag E2.
 *
 * Source: `research/writing-bible.md` §3 E2, §4.1, §5.4 (grim column).
 *
 * Canonical beats, all present below: the pyrefly memory of Braska, Jecht and a
 * young, two-eyed Auron; Zaon's empty statue and the herald; Yunalesca explains
 * the cycle and the price of the Final Aeon; she offers Yuna the same bargain
 * she gave Braska; Auron says what she did to him; Yuna refuses. Yunalesca is
 * one of only two characters permitted to state the game's thesis aloud
 * [writing-bible §1.0 rule 3].
 *
 * **She is not evil and must not be written as evil** [writing-bible §1.10].
 * Every line she has here is true, warm, and offered as care. She never taunts,
 * never raises her voice, and never lies — that is what makes the scene work.
 *
 * The **"Yes." beat** is used at most once per encounter [writing-bible §2.1] —
 * this is the encounter where it belongs, inverted: the same rhythm, the
 * opposite word. Do not decorate it.
 *
 * The herald is a ghost with no name plate, so its two lines are `'none'`
 * (a system/stage voice) rather than a speaker [dsl.ts `SpeakerId`].
 *
 * Mid-battle beats wired below:
 *   - `form-change` to form II and to form III: she is crueller each time, and
 *     the player needs to hear the fight change shape.
 *   - `status-applied` Zombie on a party member: the core lesson is that
 *     **staying Zombie is correct** going into form III [ffx-yunalesca §10.1].
 *     One line, not a tutorial.
 *   - `hp-below` 25% in the last form: the only moment she admits anything.
 *
 * Mega Death's telegraph is a battle-side state banner [writing-bible §5.2];
 * its single party callout rides the form III script rather than a second
 * trigger, so the overlay never carries two callouts at once.
 *
 * Every trigger here keeps `id === script` and every mid-battle `say` carries
 * an explicit `auto` — the two invariants `src/story/registry.ts` tests. Both
 * were broken here: `yunalesca-first-zombie` and `yunalesca-last-quarter`
 * pointed at scripts registered under a different key, so the presenter logged
 * `no mid-battle script for trigger` and fought on, and `yunalesca-form-2` sat
 * on a line waiting for a Confirm until the 30 s budget abandoned the beat.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  fx,
  hideActor,
  music,
  narrate,
  results,
  say,
  setPose,
  sfx,
  showActor,
  wait,
} from '../dsl.ts';

export const yunalescaScripts: ChapterScripts = {
  pre: [
    music('scene-zanarkand-dome', 1200),
    camera('idle', 0),
    fade('clear', 1000),

    // --- The pyrefly memory. Ten years ago, three men, one bad plan. -------
    fx('pyrefly-memory'),
    showActor('braska', { ms: 900 }),
    showActor('jecht', { ms: 900 }),
    showActor('young-auron', { ms: 900 }),
    say('braska', 'Thank you for coming this far with me.'),
    say('jecht', "Don't get soft on me now, Braska."),
    say('young-auron', 'My lord. There has to be another way.'),
    say('braska', 'If there is, I never found it.'),
    say('jecht', 'Then we go in loud. Like always.'),
    beat(1800),
    hideActor('braska', 800),
    hideActor('jecht', 800),
    hideActor('young-auron', 800),
    beat(1400),
    say('tidus', 'That was my old man. And Braska. And you.'),
    say('auron', 'Ten years ago.'),
    say('auron', 'Keep walking.'),

    // --- The chamber. Zaon's statue is empty and nobody says so first. -----
    camera('idle', 1400),
    sfx('dome-echo'),
    say('none', "The statue's empty, you see."),
    say('none', 'Has been for ages. Nobody tells you that part.'),
    say('wakka', 'Empty? But the temple said the Final Aeon—'),
    say('lulu', 'The temple says a great many things.'),

    // --- Yunalesca. -------------------------------------------------------
    showActor('yunalesca', { at: { slot: 0, side: 'enemy' }, ms: 1200 }),
    say('yunalesca', "You've walked a long way to be disappointed."),
    say('yunalesca', 'Come closer, child.'),
    say('yuna', "Lady Yunalesca. I've come for the Final Aeon."),
    say('yunalesca', 'Then choose one of them. One you love.'),
    say('yunalesca', 'That is the price. It always was.'),
    beat(2000), // Cut across every guardian's face. No one speaks.

    say('kimahri', 'Kimahri.'),
    say('wakka', 'No. Me. Take me, ya?'),
    say('wakka', "I'm no good at the rest of it anyway."),

    say('yunalesca', 'Your father stood where you are standing.'),
    say('yunalesca', 'He chose quickly. He was kind about it.'),
    beat(1600),
    say('yunalesca', 'And when the Aeon becomes Sin, another comes.'),
    say('yunalesca', 'And another. I have lost count.'),
    say('tidus', 'Wait. Becomes Sin? Say that again.', { emotion: 'surprised' }),
    say('rikku', "That's the plan? That's the whole plan?"),
    say('rikku', 'Forever?'),

    say('yunalesca', 'Hope is comforting.'), // [ICONIC QUOTE] — 3 words.
    beat(1400),
    say('yunalesca', 'It is also how I keep them walking.'),

    say('auron', 'She killed me for asking that.'),
    say('auron', 'Ten years ago. Right there.'),

    // The inverted "Yes." beat. Long silence, staff lowered, then lifted.
    setPose('yuna', 'idle'),
    beat(2000),
    setPose('yuna', 'ready'),
    say('yuna', 'No.', { emotion: 'determined' }),

    say('yunalesca', 'Then you will die out there, in despair.'),
    say('yunalesca', 'I would rather it were here. And gentle.'),
    music('boss-yunalesca', 900),
    camera('action', 700),
    battleStart(),
  ],
  post: [
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),

    // She does not fall. She thins, like frost in sun.
    camera('idle', 900),
    fx('yunalesca-thinning', 'yunalesca'),
    say('yunalesca', 'There. Now no one can summon it.'),
    say('yunalesca', 'Not ever again.'),
    say('yunalesca', 'I hope you find something better.'),
    say('yunalesca', 'I never could.'),
    hideActor('yunalesca', 1600),
    fx('pyreflies-rising'),
    wait(2500),

    say('wakka', "So that's it. Sin's still out there."),
    say('wakka', 'And we got nothing.'),
    say('rikku', "We got a no. That's not nothing."),
    say('lulu', "It's very close to nothing."),
    say('yuna', "It's a start."),
    say('yuna', "I'd rather start with nothing than end with this."),
    beat(1400),
    say('kimahri', 'Yuna chose. Kimahri follows.'),

    say('tidus', 'Auron. Ten years ago.'),
    say('tidus', 'You said she killed you.'),
    say('auron', 'Hmph.'),
    beat(1600),
    say('auron', "Now you're asking the right questions."),
    say('tidus', "That's not an answer!", { emotion: 'angry' }),
    beat(1800), // He walks out. He does not answer.

    fade('black', 1200),
    narrate('That was the day we threw away the only plan.'),
    narrate('I remember the quiet on the walk down.'),
    narrate('I thought I was scared for Spira.'),
    narrate('She looked lighter than she had in weeks.'),
    wait(1400),
  ],
  victoryQuips: {
    // §5.4 — E2 is grim; the light variants are suppressed.
    tidus: ['...Okay. Next one.', 'So what do we do now?'],
    yuna: ['May they rest.', 'A thousand years of this.'],
    auron: ["It isn't over.", 'Now it begins.'],
    wakka: ['...Ya. Okay. Ya.', "I got nothin', brudda."],
    lulu: ["Don't celebrate yet.", 'We just lost our only plan.'],
    kimahri: ['Kimahri remembers.', 'Kimahri follows Yuna.'],
    rikku: ['...Can we not do that again?', 'That lady was scary-sad.'],
  },
  mid: [
    {
      // Form indices are 0-based; form 1 is her second shape.
      id: 'yunalesca-form-2',
      when: { type: 'form-change', who: 'yunalesca', form: 1 },
      once: true,
      script: 'yunalesca-form-2',
    },
    {
      id: 'yunalesca-form-3',
      when: { type: 'form-change', who: 'yunalesca', form: 2 },
      once: true,
      script: 'yunalesca-form-3',
    },
    {
      // Hellbiter's first Zombie. The lesson is: stay that way.
      id: 'yunalesca-first-zombie',
      when: { type: 'status-applied', who: 'tidus', status: 'zombie' },
      once: true,
      script: 'yunalesca-first-zombie',
    },
    {
      // Mega Death has already resolved when this plays, so the line has to
      // read as a eulogy whether or not the party is still standing.
      id: 'yunalesca-mega-death',
      when: { type: 'ability-used', who: 'yunalesca', ability: 'mega-death' },
      once: true,
      script: 'yunalesca-mega-death',
    },
    {
      id: 'yunalesca-last-quarter',
      when: { type: 'hp-below', who: 'yunalesca', fraction: 0.25 },
      once: true,
      script: 'yunalesca-last-quarter',
    },
  ],
  midScripts: {
    'yunalesca-form-2': [
      camera('action', 400),
      fx('form-change', 'yunalesca'),
      say('yunalesca', 'You are making this longer than it needs to be.', { auto: 1400 }),
      camera('idle', 400),
    ],
    'yunalesca-form-3': [
      camera('action', 500),
      fx('form-change', 'yunalesca'),
      say('yunalesca', 'Very well. No more kindness.', { auto: 1200 }),
      // The single callout paired with the Mega Death telegraph banner.
      say('auron', 'Stay as you are. Do not let her cure you.', { auto: 1400 }),
      camera('idle', 500),
    ],
    'yunalesca-first-zombie': [
      say('rikku', "Everybody's grey! Is that bad?!", { auto: 1200 }),
      say('lulu', 'Stay grey. Her kindness kills the living.', { auto: 1400 }),
    ],
    'yunalesca-mega-death': [
      say('yunalesca', 'Rest now. All of you.', { auto: 1200 }),
      say('yunalesca', 'At once.', { auto: 1000 }),
    ],
    'yunalesca-last-quarter': [
      camera('action', 600),
      say('yunalesca', 'A thousand years.', { auto: 1200 }),
      beat(1400),
      say('yunalesca', 'You are the first to say no.', { auto: 1400 }),
      camera('idle', 600),
    ],
  },
};

export default yunalescaScripts;
