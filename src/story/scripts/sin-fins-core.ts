/**
 * Chapter XVII — **Sin: the Fins and the Core** (FFX), the story layer.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]. The cast is FFX's on the
 * *Fahrenheit* after Zanarkand: the seven guardians, Cid and Brother. Nothing here touches an FFX-2 speaker
 * (Brother speaks as `'brother'`, the FFX pilot with a name plate and no portrait, never `'brother-x2'`:
 * plan §3.5).
 *
 * Sources: the beats are research §9.2 beats 1 to 8 (`[verified: 2 sources]` for the structure), which are
 * themselves paraphrased on purpose. **Every line below is original** [AGENTS.md rule 8], in the writing
 * bible's voices (research/writing-bible.md §1, grammar §2.1): no line is quoted from the game or a guide.
 * Tidus's line about having the ball (beat 7) is our own paraphrase of the beat, in our words (plan REVIEW,
 * "should change": keep it a paraphrase). No lore beyond the beat sheet is invented: Shelinda is told of,
 * not staged; the fin is torn away by the ship's cannon; one guardian jumps and the rest follow.
 *
 * ## The beats, and where each one is
 *
 *   pre  1  The Hymn plan: Lulu reasons it; Wakka and Rikku both claim it (the scene's one light beat).
 *   pre  2  Setting out: the Hymn on the ship's speakers; Brother, halting, asks Tidus to look after Rikku.
 *   pre  3  The deck: Spira singing. Tidus throws Yuna's Gagazet sphere overboard; she smiles (a stage beat).
 *   pre  4  Sin answers: the shockwave and the pull (a stage beat).
 *   pre  5  Cid sees the shine at the arm's base; Brother says they are being pulled in. Battle.
 *   mid  6  The Left Fin falls: the cannon takes it; Cid, the other side (a chain seam).
 *   mid  7  The Right Fin falls: the gun is broken, Cid calls everyone in, Tidus refuses, Wakka jumps first
 *           and the rest follow (a chain seam).
 *   post 8  Sinfall, told on the bridge: Yuna knows it will come back; Tidus, the one inside; Cid, the gun.
 *
 * Mid callouts (writing-bible §5.2, one per state line): the first "Core gathers energy." on the Left Fin, the
 * Trigger Command asks (Tidus asks, Rikku asks her father, Cid answers: plan §3.3, Chapter VIII's order of
 * speakers), Genais entering its shell, and Genais falling.
 *
 * **Staging placeholders, labelled** (plan §3.1, §3.3): every beat plays on the deck plate (the chapter's
 * placeholder scene); the story plates (the cannon on a fin, the jump, Sinfall) are on the art list and
 * not picked, so those beats are words over the deck. **Music stand-ins** (plan §3.6, D-209, THEMES.md
 * "Owed cues"): `scene-fahrenheit` and `boss-evrae` stand in for the owed assault cue.
 *
 * **Not wired, named:** Cid's whoop as the ship moves waits on the order's own event from package F's Cid
 * script; the ask and his "wait" answer fire on the order itself.
 *
 * **Two rules every `mid` entry obeys** [`src/story/registry.ts`]: `id === script`, and every `say` in a
 * mid-battle script carries an explicit `auto`. `tests/unit/chapters/sin-story.test.ts` pins both, the lint,
 * and the budgets (a seam gets `SEAM_BUDGET_MS`, a callout `MID_SCRIPT_BUDGET_MS`).
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  flash,
  music,
  results,
  say,
  setPose,
  sfx,
  shake,
  wait,
} from '../dsl.ts';

/** The two chain seams (a fin torn away between links): the budget `SEAM_BUDGET_MS` applies to these. */
export const SIN_FINS_CORE_SEAMS = ['left-fin-down', 'right-fin-down'] as const;

export const sinFinsCoreScripts: ChapterScripts = {
  pre: [
    music('scene-fahrenheit', 1400), // stand-in (THEMES.md, owed: the assault cue)
    camera('idle', 0),
    fade('clear', 1100),
    sfx('machina-whir'),
    wait(1200),

    // --- Beat 1 — the Hymn plan ---------------------------------------------
    say('lulu', 'Sin grows calm when it hears the Hymn.'),
    say('lulu', 'So we let it hear the Hymn. And strike while it listens.'),
    beat(1300),
    say('wakka', "Hey, that's what I said, ya? More or less."),
    say('rikku', 'Nuh-uh! I said it first! Way first!'),
    say('lulu', 'Neither of you said it.'),
    beat(1200),
    say('rikku', 'Anyway! Shelinda is telling everyone.'),
    say('rikku', 'When a flying ship goes over, all of Spira sings.'),

    // --- Beat 2 — setting out --------------------------------------------------
    sfx('cursor-move'),
    say('cid', 'Speakers on. Let the whole sky hear it.'),
    say('brother', 'Sin! There! Brother sees it first! Brother!'),
    say('tidus', 'We get inside it. Through the mouth, if it opens.'),
    say('tidus', "And if it won't, we make our own way in."),
    say('auron', 'Hmph.'),
    beat(1300),
    say('brother', 'Tidus. My sister...'),
    beat(1400),
    say('brother', 'You will look after her. Yes?'),
    beat(1200),
    say('tidus', 'Yeah. I will.'),
    say('brother', 'Good! Now I fly! Everybody hold on to something!'),

    // --- Beat 3 — the deck -----------------------------------------------------
    sfx('wind-gust'),
    wait(1200),
    say('rikku', 'Listen! Down there... they really are singing.'),
    say('lulu', 'All of Spira. The same song, for once.'),
    say('none', "Tidus throws Yuna's sphere from Gagazet over the rail."),
    beat(1400),
    say('none', 'Yuna watches it fall. Then she smiles.'),
    beat(1600),

    // --- Beat 4 — Sin answers --------------------------------------------------
    shake(12, 900),
    flash(160),
    say('none', 'Sin answers. The air folds inward, then bursts apart.'),
    say('kimahri', 'Sky is falling toward it.'),

    // --- Beat 5 — the shine at the arm's base ----------------------------------
    music('boss-evrae', 900), // stand-in battle cue (THEMES.md, owed: the assault cue)
    shake(10, 700),
    camera('action', 600),
    say('cid', 'There! Something shines at the base of that arm!'),
    say('brother', 'It pulls us! We are being pulled in!'),
    say('cid', "Then we hit it where it shines. Hang on!"),
    battleStart(),
  ],
  post: [
    // --- Beat 8 — Sinfall, told on the bridge ---------------------------------
    music(null, 900),
    camera('victory', 700),
    beat(1200),
    say('none', 'Sin plows into the outskirts of Bevelle as the sun goes down.'),
    beat(1600),
    say('yuna', 'It is not over. It will rise again.'),
    say('tidus', "Yeah. So we beat the one inside it."),
    beat(1300),
    say('cid', 'Then I fix the gun. Nobody touch anything.'),
    results(),
  ],
  victoryQuips: {
    // writing-bible §5.4, the Grim tier only: this is not a victory, and Sin will rise.
    tidus: ['...Okay. Next one.', 'It is not down. Not really.', 'Keep moving.'],
    yuna: ['It will come back.', 'Not yet. Soon.'],
    auron: ["It isn't over.", 'Hmph. It will rise.'],
    wakka: ['...Ya. Okay. Ya.', 'That was just its back, ya?'],
    lulu: ["Don't celebrate yet.", 'It is still out there.'],
    kimahri: ['Kimahri remembers.', 'Sin still breathes.'],
    rikku: ['...Can we not do that again?', 'Please tell me that was the hard part.'],
  },
  mid: [
    // The Fin's telegraph, taught once (writing-bible §5.2: one callout per state line).
    { id: 'fin-core-glows', when: { type: 'ability-used', who: 'left-fin', ability: 'sin-fin-gathers' }, once: true, script: 'fin-core-glows' },
    // The Trigger Command asks (plan §3.3: Tidus asks, Rikku asks her father, Cid answers "wait").
    { id: 'order-tidus-in', when: { type: 'ability-used', who: 'tidus', ability: 'close-in' }, once: true, script: 'order-tidus-in' },
    { id: 'order-tidus-out', when: { type: 'ability-used', who: 'tidus', ability: 'pull-back' }, once: true, script: 'order-tidus-out' },
    { id: 'order-rikku', when: { type: 'ability-used', who: 'rikku', ability: 'pull-back' }, once: true, script: 'order-rikku' },
    // Beat 6, the first chain seam: the cannon takes the Left Fin.
    { id: 'left-fin-down', when: { type: 'ko', who: 'left-fin' }, once: true, script: 'left-fin-down' },
    // Beat 7, the second chain seam: the gun breaks, and the party jumps.
    { id: 'right-fin-down', when: { type: 'ko', who: 'right-fin' }, once: true, script: 'right-fin-down' },
    // Link 3 opens (the first action on Genais), then its shell, then its fall.
    { id: 'genais-guards', when: { type: 'hp-below', who: 'sinspawn-genais', fraction: 1 }, once: true, script: 'genais-guards' },
    { id: 'genais-shells', when: { type: 'ability-used', who: 'sinspawn-genais', ability: 'sin-genais-shell-in' }, once: true, script: 'genais-shells' },
    { id: 'genais-falls', when: { type: 'ko', who: 'sinspawn-genais' }, once: true, script: 'genais-falls' },
  ],
  midScripts: {
    'fin-core-glows': [
      camera('action', 300),
      say('rikku', "Its core's glowing! That's bad, right?", { auto: 1300, fallback: [{ who: 'tidus', text: "The core's glowing! Something's coming!" }] }),
      say('auron', 'Get the ship out of reach.', { auto: 1300, fallback: [{ who: 'lulu', text: 'Get the ship out of reach. Now.' }] }),
      camera('idle', 300),
    ],
    'order-tidus-in': [
      say('tidus', 'Cid! Take us in close!', { auto: 1200 }),
      say('cid', 'Give me a second!', { auto: 1100 }),
    ],
    'order-tidus-out': [
      say('tidus', 'Cid! Back us off!', { auto: 1200 }),
      say('cid', 'Hold your horses!', { auto: 1100 }),
    ],
    'order-rikku': [
      say('rikku', 'Pops! Get us out of here!', { auto: 1200 }),
      say('cid', 'Wait a moment, girl!', { auto: 1100 }),
    ],
    'left-fin-down': [
      sfx('explosion'),
      flash(140),
      shake(12, 800),
      say('none', "The Fahrenheit's cannon tears the fin away.", { auto: 1800 }),
      say('cid', 'One arm down! Now the other side!', { auto: 1500 }),
      say('wakka', 'Other side? It has two of those?!', { auto: 1400, fallback: [{ who: 'rikku', text: 'Other side?! It has two of those?!' }] }),
    ],
    'right-fin-down': [
      sfx('explosion'),
      flash(140),
      shake(14, 900),
      say('none', 'The second fin tears away. The main gun sparks and dies.', { auto: 1900 }),
      say('cid', "Gun's broken! Everybody inside, now!", { auto: 1500 }),
      beat(1200),
      say('tidus', "No. We've got the ball now.", { auto: 1400 }),
      say('tidus', 'Nobody hands it back at a time like this.', { auto: 1600 }),
      beat(1200),
      say('wakka', 'Ya. I was hoping you would say that.', { auto: 1500 }),
      say('none', 'Wakka jumps onto Sin. One by one, the rest follow.', { auto: 1900 }),
      setPose('tidus', 'ready'),
    ],
    'genais-guards': [
      say('kimahri', 'Something guards the core.', { auto: 1300, fallback: [{ who: 'auron', text: 'It guards the core. Mind it.' }] }),
    ],
    'genais-shells': [
      say('lulu', "It's hiding. And the core is waking.", { auto: 1400, fallback: [{ who: 'yuna', text: 'It is hiding. The core is waking!' }] }),
    ],
    'genais-falls': [
      say('auron', 'Now. The core.', { auto: 1200, fallback: [{ who: 'tidus', text: "Now! Go for the core!" }] }),
    ],
  },
};

export default sinFinsCoreScripts;
