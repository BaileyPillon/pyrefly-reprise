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
 *     turns** that burn an ATB slot [ffx2-vegnagun-shuyin §2]. The AI scripts
 *     emit `script-trigger` with their own names — `farplane-voice`,
 *     `shuyin-line-1`..`7`, `auron-halfway`, `jecht-no-overtime`,
 *     `vegnagun-tail-quarter`, `shuyin-taunt`, `shuyin-desperate` — so the
 *     **lines live in `midScripts` under exactly those names**, with no `mid`
 *     trigger in between. The register is the story agent's:
 *     **Jecht carries every rule** (Node colours, Bulwark retaliation), Auron
 *     gets structure, Braska gets feelings, and **Yuna never replies**
 *     [writing-bible §3 E7]. Keep them to 12 words and to one-shot pools.
 *   - The Head battle carries a real-time fail timer paired with a visible
 *     cannon charge. It gets exactly one urgency line, not a countdown chorus,
 *     and **no line treats a duration as a UI value** — reference the meter
 *     only, so nothing has to be rewritten when the engine pins the timer
 *     [writing-bible §3 E7]. The one number in the chapter, Shuyin's "four
 *     minutes", is the bible's own `[ORIGINAL]` taunt: he is goading, not
 *     reading the meter out.
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
  flash,
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
    say('brother-x2', 'YUNA!'),
    say('brother-x2', '...Yuna?'),
    say('brother-x2', 'Buddy, why is nobody yelling back at me?'),
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
      // The muzzle lights for the first time. The meter is the clock, and the
      // callouts read the meter rather than a clock [writing-bible §3 E7]. The
      // 50% checkpoint is Auron's, and it arrives from the AI script instead
      // (`auron-halfway` in `midScripts`).
      id: 'cannon-charging',
      when: { type: 'charge-started', who: 'vegnagun-head' },
      once: true,
      script: 'cannon-charging',
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
    // --- Chain seams. No combat is in flight during these: the link just
    // ended and the next one has not started. They are the only mid-battle
    // scripts allowed to run long, and even they stay inside the presenter's
    // 30 s abandon budget [src/story/registry.ts].
    'tail-down': [
      camera('idle', 700),
      say('rikku-x2', "And that's a tail.", { auto: 1000 }),
      say('paine', 'One piece. It has a lot of pieces.', { auto: 1100 }),
      // Leblanc's team is already scattered off the leg. Nodes hang far
      // overhead in forced perspective.
      camera('action', 1200),
      beat(1200),
      say('paine', 'She never had a chance up here.', { auto: 1100 }),
      say('rikku-x2', "Guess we're the ones with a leg up!", { auto: 1000 }),
      say('yuna-x2', 'Save it. All of it. For after.', { auto: 1100 }),
      music('boss-vegnagun', 600),
    ],
    'leg-down': [
      camera('idle', 700),
      say('rikku-x2', 'Did we get it? Tell me we got it.', { auto: 1000 }),
      say('paine', 'Looks that way.', { auto: 900 }),
      say('yuna-x2', 'Then shake a leg.', { auto: 1100 }),
      beat(1200), // Rikku is delighted. Paine is not.
      // The point of no return. Surface the save warning in the UI here, not
      // in dialogue [writing-bible §3 E7 beat 11].
      say('paine', "The torso team's pinned. I'm going.", { auto: 1100 }),
      beat(1400), // Paine exits frame. Hold on the empty path.
      say('ormi', 'Please — the boss is up there —', { auto: 1000 }),
      camera('action', 1400),
      say('yuna-x2', "...It's so big.", { auto: 1100 }),
      say('rikku-x2', 'Good news: no more climbing.', { auto: 1000 }),
      say('paine', 'Focus.', { auto: 900 }),
    ],
    'body-down': [
      camera('idle', 800),
      beat(1400), // Rikku sits down on the plating, entirely spent.
      say('paine', 'Hn.', { auto: 900 }),
      say('yuna-x2', "So where is he? Where's Shuyin?", { auto: 1100 }),
      // The single biggest scale shot in the chapter. Let the head keep
      // arriving after the player thinks it has finished arriving.
      camera('action', 2000),
      shake(10, 1600),
      wait(2000),
      say('shuyin', "Spira is finished. I'm only signing it.", { auto: 1300 }),
      // The jaw splits. The main cannon unveils. Behind them the severed tail
      // plants itself in the terrain — Vegnagun is drinking the Farplane.
      fx('cannon-unveil', 'vegnagun-head'),
      shake(8, 1200),
      say('paine', "It's charging. That's a charge.", { auto: 1100 }),
      say('yuna-x2', "Then we're faster.", { emotion: 'determined', auto: 1200 }),
      music('boss-vegnagun', 600),
    ],
    'head-down': [
      camera('idle', 900),
      say('rikku-x2', "Is it out? Tell me it's out of juice.", { auto: 1000 }),
      say('paine', "Maybe now he'll listen.", { auto: 1000 }),
      say('yuna-x2', 'Then I talk. That was always the plan.', { auto: 1200 }),
    ],
    // E5's confrontation. Trimmed against the 30 s budget: Shinra's second
    // line, Buddy's, Rikku's stammer and Shuyin's split "thousand years" pair
    // are folded away; the canonical order of what is left is untouched
    // [writing-bible §3 E5 pre-battle table].
    'shuyin-appears': [
      music(null, 900),
      camera('idle', 900),
      say('shinra', "Vegnagun's dead. Something's still down there.", { auto: 900 }),
      say('brother-x2', 'YUNA! Come up now! I am ordering it!', { auto: 900 }),
      // Baralai drops to his knees. Something steps out of him and keeps
      // standing. Nooj and Gippal drag him clear, off to frame-left.
      beat(1400),
      say('baralai', '...Forgive me. I was not myself.', { auto: 900 }),
      say('rikku-x2', 'That is Tidus. Why is that Tidus.', { auto: 900 }),
      say('paine', "It isn't.", { auto: 800 }),
      say('shuyin', 'Lenne?', { auto: 900 }),
      // The Songstress dressphere glows. Yuna's voice comes out doubled.
      fx('songstress-light', 'yuna-x2'),
      say('yuna-x2', "I'm here. I've been here the whole time.", {
        voiceKey: 'yuna-lenne-doubled',
        auto: 1000,
      }),
      say('yuna-x2', 'I never stopped being grateful.', {
        voiceKey: 'yuna-lenne-doubled',
        auto: 1000,
      }),
      beat(1200), // He almost takes a step. Then he looks properly.
      say('shuyin', "You wear her face. You don't get to use her voice.", { auto: 1000 }),
      say('shuyin', 'A thousand years. Not one of them ended.', { auto: 1000 }),
      say('yuna-x2', 'Then let us end this one. Please.', { auto: 1000 }),
      say('shuyin', "No. I'll end all of it.", { auto: 1000 }),
      music('boss-shuyin', 900),
      camera('action', 700),
    ],

    // --- Live-combat beats. Every one of these interrupts a fight in
    // progress, so they stay short and never wait on input.
    'cannon-charging': [
      fx('cannon-charge', 'vegnagun-head'),
      say('shinra', "The muzzle's live. That meter is your clock.", { auto: 1200 }),
      say('paine', 'Then we go faster.', { auto: 1000 }),
    ],
    'shuyin-half': [
      say('shuyin', 'Why are you still standing?', { auto: 1100 }),
      say('shuyin', 'Nobody stands this long.', { auto: 1200 }),
    ],
    'shuyin-low': [
      say('shuyin', 'I just wanted it to stop hurting.', { auto: 1200 }),
      say('shuyin', "That's all I ever—", { auto: 1100 }),
    ],

    // --- Farplane voices and Shuyin's cockpit lines.
    //
    // These are **not** wired through `mid`: the AI scripts emit
    // `script-trigger` with these names directly, so they never pass a
    // `MidBattleTrigger` at all [battle/ffx2/ai/vegnagun.ts,
    // vegnagun-head.ts, shuyin.ts]. They were the other half of the
    // presenter's "no mid-battle script for trigger" log. `registry.ts` keeps
    // the list of emitted names and the test fails if a new one appears
    // without a script.
    //
    // House rules [writing-bible §3 E7 "Farplane voice system"]: 12 words or
    // fewer, the three voices never address each other, Jecht carries every
    // rule, Auron carries structure, Braska carries feeling, and Yuna never
    // answers any of them.
    'farplane-voice-braska': [
      say('braska', 'You were always going to be braver than me.', { auto: 1300 }),
    ],
    'farplane-voice': [
      // The Leg's flavour slot fires more than once, so this has to be the
      // line worth hearing twice: the rule the fight is built on.
      say('jecht', "Forget the lights up top. The leg's the job.", { auto: 1200 }),
    ],
    'vegnagun-tail-quarter': [
      say('jecht', "That all it's got? Finish the thing.", { auto: 1100 }),
    ],
    'auron-halfway': [
      // The canonical 50% checkpoint. References the meter, never a number.
      say('auron', "Half charged. Whatever you're saving — spend it.", { auto: 1300 }),
    ],
    'jecht-no-overtime': [
      say('jecht', 'No overtime in this one, kid.', { auto: 1100 }),
    ],
    'shuyin-line-1': [
      say('shuyin', 'Let it fire.', { auto: 900 }),
      say('shuyin', 'Then nobody has to want anything.', { auto: 1200 }),
    ],
    'shuyin-line-2': [
      say('shuyin', 'A thousand years. You get four minutes.', { auto: 1200 }),
    ],
    'shuyin-line-3': [
      say('shuyin', 'The meter does not care how brave you are.', { auto: 1200 }),
    ],
    'shuyin-line-4': [
      say('shuyin', 'Nobody is coming. Nobody ever came.', { auto: 1200 }),
    ],
    'shuyin-line-5': [
      say('shuyin', 'You could stop. I would let you stop.', { auto: 1200 }),
    ],
    'shuyin-line-6': [
      say('shuyin', 'Almost quiet now. Can you feel it?', { auto: 1200 }),
    ],
    // Line seven is the loss state: the cannon fires and Spira ends. Four
    // lines and a long silence, never a montage [writing-bible §3 E7 defeat].
    'shuyin-line-7': [
      shake(12, 900),
      flash(900, '#ffffff'),
      say('shuyin', "There. Now it's quiet.", { auto: 1400 }),
      fade('white', 1200),
      wait(1600),
    ],
    // The E5 interrupt pools. The AI picks high/low by HP and passes the pool
    // index in the event payload, but the presenter looks scripts up by name
    // only — one line each until it can vary on the payload.
    'shuyin-taunt': [
      say('shuyin', 'You fight like someone who still wants something.', { auto: 1300 }),
    ],
    'shuyin-desperate': [
      say('shuyin', 'Stop singing. Stop singing.', { auto: 1200 }),
    ],
  },
};

export default ffx2VegnagunShuyinScripts;
