/**
 * Chapter 5 scripts — the Vegnagun chain then Shuyin (Heart of the Farplane).
 * Scene tags E7 (the four-part chain) **and** E5 (Shuyin), plus the E5-CODA
 * Farplane Glen scene, which is not a battle.
 *
 * Source: `research/writing-bible.md` §3 E7, §3 E5, §3 E5-CODA, §4.2, §5.4.
 *
 * Structure: five battles with **no menu between** — Tail, Leg, Body, Head,
 * Shuyin. Every scene between them therefore lives in `midScripts`, fired off
 * the part that just died:
 *   - `pre`        Act 1 in Vegnagun's chamber, then the Tail call-out.
 *   - `tail-down`  after-Tail, then the Leg approach.
 *   - `leg-down`   after-Leg, the point of no return, then the Body approach.
 *   - `body-down`  after-Body, then **the head descends** — the biggest scale
 *                  shot in the chapter — and Shuyin's declaration.
 *   - `cannon-half` the single urgency line for the timed Head fight.
 *   - `head-down`  hands off to E5.
 *   - `shuyin-appears` the E5 confrontation, Songstress attempt included.
 *   - `post`       the Lenne release, the chapter card, then the Glen coda.
 *
 * E7's Win-slot lines are **scripted, not sampled**, because the limb-pun gag
 * has to run in order [writing-bible §5.4] — tail, leg up, shake a leg — and
 * the party letting Rikku keep doing it *is* their morale. They are in
 * `midScripts`, never in `victoryQuips`.
 *
 * Emotional job: taking the weapon apart instead of dying for it, then a
 * thousand years of unfinished grief.
 *
 * Presentation hooks:
 *   - Vegnagun battles open with a **black-hole suck-in**, not the shatter
 *     wipe: `battleStart('blackhole')` [visual-bible §1.18].
 *   - Braska, Auron and Jecht speak from the Farplane during the fights and
 *     Shuyin taunts from the cockpit. Those are **AI-driven no-action flavour
 *     turns** that burn an ATB slot [ffx2-vegnagun-shuyin §2] — they belong in
 *     the enemy ability data, not here, but the lines are the story agent's:
 *     **Jecht carries every rule** (Node colours, Bulwark retaliation), Auron
 *     gets structure, Braska gets feelings, and **Yuna never replies**
 *     [writing-bible §3 E7]. Keep them to 12 words and to one-shot pools.
 *   - The Head battle carries a real-time fail timer paired with a visible
 *     cannon charge. It gets exactly one urgency line, not a countdown chorus,
 *     and **no line ever names a duration** — reference the meter only.
 *   - The party **does not pose on victory** in the Farplane [visual-bible §2.5].
 *   - Shuyin's entrance uses `hp-below` at `fraction: 1` for the same reason
 *     Chapter 3's aeon entrances do: there is no "enters the field" trigger.
 *   - Lenne's song is **staging, not lyrics** [writing-bible §1.22] — it is a
 *     cue on the audio bus with her spoken lines landing inside it.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  choice,
  fade,
  fx,
  hideActor,
  ifFlag,
  music,
  narrate,
  results,
  say,
  setPose,
  sfx,
  shake,
  showActor,
  wait,
} from '../dsl.ts';

export const ffx2VegnagunShuyinScripts: ChapterScripts = {
  pre: [
    music('scene-farplane', 1400),
    camera('idle', 0),
    fade('clear', 1200),
    // The architecture has stopped being organic and become built. Vegnagun
    // fills the frame behind everyone.
    wait(1600),

    say('nooj', 'Baralai carries him.'),
    say('nooj', 'Wound Baralai enough and Shuyin jumps.'),
    say('nooj', 'Then he jumps into me. And I finish it.'),
    say('nooj', 'Both of us.'),
    beat(1600), // He says it flatly, like a schedule.

    // The thesis of the entire chapter. One word, on its own beat.
    say('yuna-x2', 'No.'),
    say('yuna-x2', "I've heard this plan before."),
    say('yuna-x2', 'I was the one dying in it.'),
    say('yuna-x2', "Spira doesn't need one more person to give up."),
    say('yuna-x2', "It's had enough."),

    // No visual source. Two voices out of the Farplane. Her head comes up.
    beat(1600),
    sfx('farplane-voices'),
    say('braska', "That's my daughter."),
    say('auron', 'Listen to her.'),
    beat(1400), // She does not answer them. Not once, in any of the five.

    say('yuna-x2', 'We take it apart.'),
    say('yuna-x2', "Piece by piece, until there's nowhere to hide."),
    say('yuna-x2', 'And then I talk to him.'),
    say('rikku-x2', 'So — Plan B. B for Big Dumb Machine.'),
    say('gippal', 'People built that thing.'),
    say('gippal', 'People can unbuild it.'),
    say('leblanc', 'Ugh. Fine.'),
    say('leblanc', "Don't tell the boys I agreed with you."),
    beat(1400), // Overhead shot, three team markers. They split.

    say('yuna-x2', 'Ready?'),
    say('rikku-x2', 'Ready to grab this thing by the tail!'),
    say('paine', '...Unfortunately, yes.'),
    music('boss-vegnagun', 900),
    battleStart('blackhole'),
  ],
  post: [
    // --- The Lenne release [writing-bible §3 E5 post] ---------------------
    music(null, 1000),
    camera('idle', 900),
    setPose('shuyin', 'kneel'),
    beat(1600), // He refuses to look up.
    say('yuna-x2', 'Listen to me. She asked me to—'),
    say('shuyin', "You're not her. Don't."),

    // Light lifts off the dressphere. Lenne stands separate from Yuna.
    fx('songstress-light', 'yuna-x2'),
    showActor('lenne', { ms: 1400 }),
    sfx('lenne-song'), // Song cue under, no lyrics. Staging, not words.
    beat(1600),
    say('lenne', 'You waited too long.'),
    say('lenne', "I'm sorry I made you wait."),
    say('shuyin', '...Lenne.', { emotion: 'pained' }),
    say('shuyin', 'A thousand years, and this is all we get?'),
    say('lenne', "This moment's enough."), // [ICONIC QUOTE] — 3 words.
    say('lenne', 'Rest with me.'),
    say('lenne', "You don't have to hold it anymore."),

    // They go together. The longest hold in the game.
    fx('pyreflies-rising'),
    hideActor('shuyin', 1600),
    hideActor('lenne', 1600),
    wait(3000),

    // Rikku is crying and trying to do it quietly, which she is bad at.
    beat(1600),
    say('paine', "...C'mere."), // Paine's respect-points payoff.
    say('yuna-x2', 'Um.'),
    beat(1400),
    say('yuna-x2', "Is it okay if I don't say anything?"),
    say('paine', "It's encouraged."),
    say('brother', 'YUNA!'),
    say('brother', '...Yuna?'),
    say('brother', 'Buddy, why is nobody yelling back at me?'),
    say('buddy', "Give 'em a minute, Brother."),
    say('buddy', 'Coordinates are holding.'),

    // The chapter card sits here, where the original puts it.
    results(),

    // --- E5-CODA — the Farplane Glen. Not a battle. ----------------------
    // Hard cut. Flowers, warm light, a long dolly and **no dialogue** before
    // the input window: the silence is the prompt's frame [writing-bible
    // §3 E5-CODA rule 2]. The source's press-X window is modelled as a choice
    // so the runner can telegraph it; both answers are dignified.
    fade('black', 1400),
    music('ending-ffx2', 1800),
    fade('clear', 1800),
    camera('idle', 0),
    wait(3200),
    choice('glen-whistle', [
      { label: '(Whistle)', value: 'whistle' },
      { label: '(Keep walking)', value: 'walk' },
    ]),
    ifFlag(
      'glen-whistle',
      [
        // A whistle comes back across the field. Yuna stops walking.
        sfx('whistle-answer'),
        beat(1800),
        showActor('fayth-boy', { ms: 1200 }),
        say('fayth-boy', 'You called. Somebody heard.'),
        say('fayth-boy', 'We can still find him, if you want us to.'),
        say('fayth-boy', 'Do you want to see him again?'),
        choice('glen-answer', [
          { label: 'Yes.', value: 'yes' },
          { label: 'No.', value: 'no' },
        ]),
        ifFlag(
          'glen-answer',
          [
            say('yuna-x2', 'Yes.'),
            beat(1600),
            say('fayth-boy', 'Okay.'),
            fade('white', 2000),
          ],
          [
            // The "No" branch is an ending, not a mistake. Write it whole.
            say('yuna-x2', 'No.'),
            say('yuna-x2', "He's already with me."),
            say('yuna-x2', 'Thank you for asking.'),
            beat(1600),
            fade('black', 1800),
          ],
          'yes',
        ),
      ],
      [
        // She keeps walking. Nobody answers, and the field stays quiet.
        beat(2000),
        fade('black', 1800),
      ],
      'whistle',
    ),

    // Yuna's chapter-narrator register: lighter than Tidus, forward-looking.
    narrate('We went down as far as the world goes.'),
    narrate('We came back up with almost everybody.'),
    narrate('Rikku talked the whole way. I let her.'),
    wait(1600),
  ],
  victoryQuips: {
    // §5.4 — end-of-chapter only, and quiet: this tally comes up after Lenne.
    // The inter-battle Win-slot lines are scripted in `midScripts`.
    yuna: ["...Let's go home.", "It's over. It's really over."],
    rikku: ["That one wasn't fun.", "I'm not crying. You're crying."],
    paine: ['...Yeah.', 'You held up. Both of you.'],
  },
  mid: [
    {
      id: 'tail-down',
      when: { type: 'ko', who: 'vegnagun-tail' },
      once: true,
      script: 'tail-down',
    },
    {
      id: 'leg-down',
      when: { type: 'ko', who: 'vegnagun-leg' },
      once: true,
      script: 'leg-down',
    },
    {
      id: 'body-down',
      when: { type: 'ko', who: 'vegnagun-body' },
      once: true,
      script: 'body-down',
    },
    {
      // The one urgency beat for the timed fight. The meter is the clock; no
      // line ever names a duration [writing-bible §3 E7].
      id: 'cannon-charging',
      when: { type: 'charge-started', who: 'vegnagun-head' },
      once: true,
      script: 'cannon-half',
    },
    {
      id: 'head-down',
      when: { type: 'ko', who: 'vegnagun-head' },
      once: true,
      script: 'head-down',
    },
    {
      // Shuyin steps out of Baralai. See the header note on `fraction: 1`.
      id: 'shuyin-appears',
      when: { type: 'hp-below', who: 'shuyin', fraction: 1 },
      once: true,
      script: 'shuyin-appears',
    },
    {
      id: 'shuyin-half',
      when: { type: 'hp-below', who: 'shuyin', fraction: 0.5 },
      once: true,
      script: 'shuyin-half',
    },
    {
      id: 'shuyin-low',
      when: { type: 'hp-below', who: 'shuyin', fraction: 0.2 },
      once: true,
      script: 'shuyin-low',
    },
  ],
  midScripts: {
    'tail-down': [
      camera('idle', 700),
      say('rikku-x2', "And that's a tail."),
      say('paine', 'One piece. It has a lot of pieces.'),
      // Leblanc's team is already scattered off the leg. Nodes hang far
      // overhead in forced perspective.
      camera('action', 1200),
      beat(1400),
      say('paine', 'She never had a chance up here.'),
      say('rikku-x2', "Guess we're the ones with a leg up!"),
      say('yuna-x2', 'Save it. All of it. For after.'),
      music('boss-vegnagun', 600),
    ],
    'leg-down': [
      camera('idle', 700),
      say('rikku-x2', 'Did we get it? Tell me we got it.'),
      say('paine', 'Looks that way.'),
      say('yuna-x2', 'Then shake a leg.'),
      beat(1400), // Rikku is delighted. Paine is not.
      // The point of no return. Surface the save warning in the UI here, not
      // in dialogue [writing-bible §3 E7 beat 11].
      say('paine', "The torso team's pinned. I'm going."),
      beat(1600), // Paine exits frame. Hold on the empty path.
      say('ormi', 'Please — the boss is up there —'),
      camera('action', 1400),
      say('yuna-x2', "...It's so big."),
      say('rikku-x2', 'Good news: no more climbing.'),
      say('paine', 'Focus.'),
    ],
    'body-down': [
      camera('idle', 800),
      beat(1600), // Rikku sits down on the plating, entirely spent.
      say('paine', 'Hn.'),
      say('yuna-x2', "So where is he? Where's Shuyin?"),
      // The single biggest scale shot in the chapter. Let the head keep
      // arriving after the player thinks it has finished arriving.
      camera('action', 2400),
      shake(10, 1600),
      wait(2600),
      say('shuyin', "Spira is finished. I'm only signing it."),
      // The jaw splits. The main cannon unveils. Behind them the severed tail
      // plants itself in the terrain — Vegnagun is drinking the Farplane.
      fx('cannon-unveil', 'vegnagun-head'),
      shake(8, 1200),
      say('paine', "It's charging. That's a charge."),
      say('yuna-x2', "Then we're faster.", { emotion: 'determined' }),
      music('boss-vegnagun', 600),
    ],
    'cannon-half': [
      fx('cannon-charge', 'vegnagun-head'),
      // Farplane voice, structural: Auron gets the checkpoint callout.
      say('auron', "Half charged. Whatever you're saving — spend it."),
    ],
    'head-down': [
      camera('idle', 900),
      say('rikku-x2', "Is it out? Tell me it's out of juice."),
      say('paine', "Maybe now he'll listen."),
      say('yuna-x2', 'Then I talk. That was always the plan.'),
    ],
    'shuyin-appears': [
      music(null, 900),
      camera('idle', 900),
      say('shinra', "Vegnagun's dead. Something's still down there."),
      say('shinra', 'Something small.'),
      say('brother', 'YUNA! Come up now! I am ordering it!'),
      say('buddy', "We're holding position. Take the time you need."),
      // Baralai drops to his knees. Something steps out of him and keeps
      // standing. Nooj and Gippal drag him clear, off to frame-left.
      beat(1800),
      say('baralai', '...Forgive me. I was not myself.'),
      say('rikku-x2', 'Okay. Okay okay okay.'),
      say('rikku-x2', 'That is Tidus. Why is that Tidus.'),
      say('paine', "It isn't."),
      say('shuyin', 'Lenne?'),
      // The Songstress dressphere glows. Yuna's voice comes out doubled.
      fx('songstress-light', 'yuna-x2'),
      say('yuna-x2', "I'm here. I've been here the whole time.", {
        voiceKey: 'yuna-lenne-doubled',
      }),
      say('yuna-x2', 'I never stopped being grateful.', {
        voiceKey: 'yuna-lenne-doubled',
      }),
      beat(1600), // He almost takes a step. Then he looks properly.
      say('shuyin', 'You wear her face.'),
      say('shuyin', "You don't get to use her voice."),
      say('shuyin', 'A thousand years.'),
      say('shuyin', 'Not one of them ended.'),
      say('yuna-x2', 'Then let us end this one. Please.'),
      say('shuyin', "No. I'll end all of it."),
      music('boss-shuyin', 900),
      camera('action', 700),
    ],
    'shuyin-half': [
      say('shuyin', 'Why are you still standing?'),
      say('shuyin', 'Nobody stands this long.'),
    ],
    'shuyin-low': [
      say('shuyin', 'I just wanted it to stop hurting.'),
      say('shuyin', "That's all I ever—"),
    ],
  },
};

export default ffx2VegnagunShuyinScripts;
