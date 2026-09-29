/**
 * Chapter XVIII — **Sin: the Face** (FFX), the story layer.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]. The cast is FFX's on the
 * *Fahrenheit* over Bevelle: the guardians, Cid and Brother (the FFX pilot, `'brother'`, a name plate with no
 * portrait; never `'brother-x2'`, plan §3.5).
 *
 * Sources: research §9.2 beats 9 to 11 (`[verified: 2 sources]` for the structure), paraphrased on purpose.
 * **Every line below is original** [AGENTS.md rule 8], in the writing bible's voices (§1) and grammar (§2.1).
 * No lore beyond the beat sheet is invented.
 *
 * ## The beats, and where each one is
 *
 *   pre  9  Yuna on the deck: does it hurt him; Yu Yevon joins a summoned aeon, small at first, so they might
 *           win without the Final Summoning; she asks Tidus not to go away. **Not the "Yes." beat**: the
 *           request is hers (plan §3.3). Rikku calls them.
 *   pre  10 Evenfall: Sin rises with wings over Bevelle; Auron, Jecht is waiting; the gun is still broken;
 *           Tidus, take us in; Brother, halting, promises; Kimahri's last line; Tidus calls to his father.
 *   mid     The mouth lines are the AI's own (`battle/ffx/ai/overdrive-sin.ts`, placeholder copy); one party
 *           callout rides the first pull.
 *   post 11 Breaking Through: the ship dives into the open mouth; a Farplane-like passage with a glimpse of
 *           Seymour, who says nothing. Tidus narrates (past tense, after the high, writing-bible §1.2).
 *
 * **Placeholders, labelled** (plan §3.1, §3.3, §3.6): the deck plate stands in for the deck over Bevelle at
 * dusk and for the Evenfall and Breaking Through plates (the art list); `scene-fahrenheit` and `boss-evrae`
 * stand in for the owed countdown cue (THEMES.md "Owed cues", S-21, D-209).
 *
 * **Not wired, named:** the plan puts the party callout at the mouth's third stage. No trigger condition reads
 * a flag, and the stage is a `message` from the AI, not an ability, so a stage-3 callout needs an AI-emitted
 * `script-trigger` in `overdrive-sin.ts` (the `AI_EMITTED_TRIGGERS` pattern, outside this package's files).
 * Until then the one callout rides the first "Drawn to Sin.", which is where the clock starts.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  music,
  narrate,
  results,
  say,
  sfx,
  shake,
  wait,
} from '../dsl.ts';

export const sinFaceScripts: ChapterScripts = {
  pre: [
    music('scene-fahrenheit', 1400), // stand-in (THEMES.md, owed: the countdown cue)
    camera('idle', 0),
    fade('clear', 1100),
    sfx('wind-gust'),
    wait(1200),

    // --- Beat 9 — Yuna on the deck --------------------------------------------
    say('yuna', 'Tidus. Do you think it hurts him?'),
    say('tidus', 'The old man?'),
    beat(1300),
    say('yuna', 'Being Sin. All this time.'),
    beat(1800), // He does not answer. That is the answer.
    say('yuna', 'Yu Yevon joins the aeon that is summoned.'),
    say('yuna', 'Small at first. It grows from there.'),
    say('yuna', 'If we are quick, we may not need the Final Summoning.'),
    say('tidus', "Then we're quick."),
    beat(1400),
    say('yuna', 'Tidus. Please... do not go away.'),
    beat(1600),
    say('rikku', "Yunie! Tidus! Something's happening to Sin!"),

    // --- Beat 10 — Evenfall ------------------------------------------------------
    shake(8, 700),
    sfx('wind-gust'),
    camera('action', 900),
    say('none', 'Over Bevelle, Sin rises again. Now it has wings.'),
    beat(1300),
    say('auron', 'He is waiting for you.'),
    say('cid', "Main gun's still dead. No covering fire this time."),
    say('tidus', 'Then take us in. All the way in.'),
    say('cid', 'Right up to its teeth. Brother, fly!'),
    say('brother', 'I will... I will get you there!'),
    beat(1200),
    say('kimahri', 'Kimahri is ready.'),
    music('boss-evrae', 900), // stand-in battle cue (THEMES.md, owed: the countdown cue)
    shake(11, 700),
    say('tidus', "Hey, old man! I'm coming!", { emotion: 'determined' }),
    battleStart(),
  ],
  post: [
    // --- Beat 11 — Breaking Through ------------------------------------------
    music(null, 900),
    camera('victory', 700),
    beat(1200),
    shake(10, 900),
    say('none', 'The mouth is open. The Fahrenheit dives straight in.'),
    fade('black', 1100),
    narrate('Inside, it was quiet. Almost like the Farplane.'),
    narrate('Lights drifted past us in the dark.'),
    narrate('For a moment one of them was Seymour. He said nothing.'),
    narrate('I thought the worst of it was behind us.'),
    wait(1500),
    results(),
  ],
  victoryQuips: {
    // writing-bible §5.4, the Grim tier only: the way in is open, and nothing is over.
    tidus: ['...Okay. Next one.', "We're in. Now it starts."],
    yuna: ['May they rest.', 'We are almost there.'],
    auron: ["It isn't over.", 'Hmph. Inside, then.'],
    wakka: ['...Ya. Okay. Ya.', 'Straight down its throat, ya?'],
    lulu: ["Don't celebrate yet.", 'The door is open. That is all.'],
    kimahri: ['Kimahri remembers.', 'Kimahri goes in first.'],
    rikku: ['...Can we not do that again?', 'Inside Sin. Great. Just great.'],
  },
  mid: [
    // The first pull: the clock starts (see the header for why not the mouth's third stage).
    { id: 'sin-first-pull', when: { type: 'ability-used', who: 'overdrive-sin', ability: 'overdrive-sin-drawn' }, once: true, script: 'sin-first-pull' },
  ],
  midScripts: {
    'sin-first-pull': [
      say('auron', 'It is pulling us in. Use the time.', { auto: 1400, fallback: [{ who: 'lulu', text: 'It is pulling us in. Use the time.' }] }),
    ],
  },
};

export default sinFaceScripts;
