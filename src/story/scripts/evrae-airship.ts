/**
 * Chapter — Evrae, on the deck of the *Fahrenheit* (FFX). New scene tag **E8**.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. `research/ffx-evrae-airship.md`
 * §0.4 fences the whole encounter in — the airship distance mechanic "has no
 * X-2 counterpart" — and the cast here (the six guardians, Cid, Brother aboard
 * the *Fahrenheit* on the approach to Bevelle) is FFX's at a point in FFX's
 * story. Nothing in this file touches an FFX-2 speaker, an FFX-2 chapter or any
 * shared FFX-2 data; the absence case is the last block of
 * `tests/unit/chapters/evrae-script.test.ts`.
 *
 * Sources: beats from `docs/plans/chapter-evrae-review.md` §7 (which is
 * `research/ffx-evrae-airship.md` §12.4 / §12.5, `[verified: 2 sources]` for
 * beats 1, 2, 4, 5, 8, 9, 10, 11); voices and house style from
 * `research/writing-bible.md` §1 and §2.1. **Every line below is original**
 * [AGENTS.md rule 8] — no transcript, no guide prose. Auron's canonical remark
 * about the wyrm (§12.2) is deliberately *not* reused: only its register is.
 *
 * ## Who is on this deck, and who is not
 *
 * Present: **Tidus, Wakka, Lulu, Kimahri, Auron, Rikku** — three active, three
 * on the bench — plus **Cid** and **Brother** over the deck. Absent: **Yuna**,
 * who is in Bevelle (§9.1). Her absence is the chapter, so she has no line here
 * and neither does Seymour: post beat 11 (the wedding) is staged as Tidus's
 * retrospective narration rather than as dialogue, because the guardians are
 * not in that room yet and a scene cannot be voiced by people who are not in it.
 *
 * ## The beats, and where each one is
 *
 *   pre  1  Home is gone; the ship has no business flying.
 *   pre  2  Brother finds Yuna. Cid turns the ship. (§1.17 guardrail: **one**
 *           line of genuine terror, short and unfunny, then back to ridiculous.)
 *   pre  3  **The thesis, stated once:** no summoner, so nobody can heal.
 *   pre  4  Bevelle over the cloud line.
 *   pre  5  Something detaches from the city. It was already waiting.
 *   pre  6  Auron names it, dry.
 *   pre  7  **Cid's one-line tutorial:** move the ship or fire, never both.
 *   mid     Inhale / out of breath range / the Haste phase / the first petrify /
 *           Cid's first volley — one callout each [writing-bible §5.2].
 *   post 8  Evrae falls out of the sky. Anticlimax, deliberately.
 *   post 9  Bevelle's own guns open up. The victory is revoked.
 *   post 10 Tidus goes down the mooring chains alone.
 *   post 11 The wedding, as narration.
 *
 * **Two rules every `mid` entry in this project obeys** [`src/story/registry.ts`]:
 *   1. `id === script`. The engine emits `script-trigger` with the trigger's
 *      **id**, and the presenter looks the script up by that name.
 *   2. Every `say` in a mid-battle script carries an explicit `auto` — the
 *      presenter abandons a beat that waits on a Confirm that never comes.
 *
 * `music()` steps: the preflight reserves two NEW cues (`scene-fahrenheit`,
 * `boss-evrae`, §6 and §12.6), and neither exists — no composition, no row in
 * `docs/audio/THEMES.md`, and Bailey judges audio by ear (hard rule 13). An
 * unregistered cue throws in the cutscene runner
 * (`tests/unit/audio-story-cues.test.ts`), so the integrator routed Chapter
 * 1's `scene-gagazet` / `boss-seymour` in their place, the stopgap Chapter 7
 * uses. When the real cues land, swap the two calls back (and the chapter's
 * `music` and the formation's `musicCues`).
 *
 * `sfx()` steps: the writer's five requests are not in the SFX bank, so each
 * plays the nearest existing sound [`docs/handoff/chapter-evrae.md`]:
 * `airship-engine-loop` -> `machina-whir`, `comm-click` -> `cursor-move`,
 * `wyrm-fall` -> `ko-fall`, `cannon-report` -> `explosion`; `wind-gust` exists.
 *
 * **Registered** as Chapter 8 by the integrator (`src/story/registry.ts`,
 * `src/data/chapter-evrae-airship.ts`; `docs/handoff/chapter-evrae.md`).
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  flash,
  music,
  narrate,
  results,
  say,
  setPose,
  sfx,
  shake,
  wait,
} from '../dsl.ts';

export const evraeAirshipScripts: ChapterScripts = {
  pre: [
    // Full daylight, high altitude, open sky, engine noise under everything
    // [§12.1, §12.3]. No narration here: §2.1 places an interlude *after* an
    // emotional high, so the chapter opens cold on the deck.
    music('scene-gagazet', 1400), // stopgap for `scene-fahrenheit` (header)
    camera('idle', 0),
    fade('clear', 1100),
    sfx('machina-whir'), // requested: airship-engine-loop
    wait(1200),

    // --- Beat 1 — home is gone, and the Al Bhed are flying anyway ---------
    say('wakka', 'A thousand years under the sea. And she still flies.'),
    say('rikku', 'She flies because we fixed her. You are welcome.'),
    beat(1300),
    say('lulu', 'Everything they owned is behind us.'),
    beat(1500), // Rikku does not have a bright answer. That is the answer.
    say('rikku', '...Yeah. Behind us.', { emotion: 'sad' }),

    // --- Beat 2 — Brother finds her; Cid turns the ship -------------------
    sfx('cursor-move'), // requested: comm-click
    // Brother speaks Al Bhed and Rikku carries it across, as she does all
    // through FFX. See the handoff: this is uncertain line 1.
    say('brother', 'YUNA! Bevelle! They are marrying her to that man!'),
    say('rikku', 'He says Bevelle. He says within the hour.'),
    say('cid', 'Bevelle. Fine. Everybody hold on to something.'),
    say('cid', 'Nobody asked me twice. Nobody is going to have to.'),
    // §1.17's guardrail: one short, unfunny line of real fear for Yuna.
    beat(1200),
    say('brother', 'She is in there alone.'),
    beat(1600),
    say('brother', 'I am flying! Be quiet and be impressed!'),

    // --- Beat 3 — the thesis, stated once ---------------------------------
    say('tidus', 'Okay. Weapons, plan, go. What have we got?'),
    say('lulu', 'Six of us. No summoner.'),
    beat(1400), // Nobody argues with it. That is what makes it land.
    say('lulu', 'Nobody on this deck can heal anything.'),
    say('rikku', 'I have potions. Lots of potions. That... that is it.'),
    say('auron', 'Then ration them.'),

    // --- Beat 4 — Bevelle comes up over the cloud line --------------------
    camera('idle', 2200),
    sfx('wind-gust'),
    wait(1400),
    say('wakka', 'Whoa. Somebody built that on purpose, ya?'),
    beat(1300),
    say('kimahri', 'Too white. Nothing lives there.'),

    // --- Beat 5 — it was already up here ----------------------------------
    shake(5, 420),
    say('tidus', 'Something just came off the city.'),
    say('lulu', 'It is not scrambling.'),
    beat(1400),
    say('lulu', 'It was already up here. Waiting for us.'),

    // --- Beat 6 — Auron names it. Register, never the line [§12.2] --------
    say('auron', 'Bevelle keeps a dog on the step.'),
    say('auron', 'Hmph. Mind the teeth.'),

    // --- Beat 7 — the mechanic, as characterisation. One line. -----------
    music('boss-seymour', 900), // stopgap for `boss-evrae` (header)
    shake(11, 700),
    camera('action', 600),
    say('cid', 'Listen up! I can move this ship, or I can shoot!'),
    say('cid', 'Not both. You pick, and you pick fast!'),
    say('rikku', 'Pops! Just keep us in the air!'),
    battleStart(),
  ],
  post: [
    // The tally first; the chapter then takes the win back [§12.5 beat 9].
    music(null, 900),
    camera('victory', 700),
    beat(1200),
    results(),

    // --- Beat 8 — it falls. Not sent, not killed on screen. ---------------
    camera('idle', 900),
    sfx('ko-fall'), // requested: wyrm-fall
    wait(1600),
    say('wakka', 'It just... dropped.'),
    beat(1600),
    say('kimahri', 'It was told to stand there. It stood.'),
    say('tidus', 'That is it? We just won?'),
    beat(1300),
    say('auron', 'No.'),

    // --- Beat 9 — Bevelle opens up. The victory lasts a minute. ----------
    sfx('explosion'), // requested: cannon-report
    flash(140),
    shake(14, 900),
    say('cid', 'Incoming! That is the city shooting at us!'),
    say('cid', 'She is holed. I have to pull her off.'),
    say('rikku', 'We are not going in?', { emotion: 'surprised' }),
    say('cid', 'Not like this.'),
    beat(1600),

    // --- Beat 10 — the chains. Understate, one unguarded line, cut. ------
    say('tidus', 'Then get us over the roof. Once.'),
    say('lulu', 'You would be alone down there.'),
    beat(1400),
    say('tidus', 'Yeah.', { emotion: 'determined' }),
    beat(1500),
    say('wakka', 'Hey. Brudda.'),
    beat(1300), // He does not have the rest of it.
    say('wakka', '...Go get her.'),
    setPose('tidus', 'ready'),
    beat(1200),

    // --- Beat 11 — the wedding, from above, in past tense ----------------
    // Staged as narration: the guardians are not in that room yet, so nobody
    // in that room gets a line [§2.1 narration interlude, §1.2 template].
    fade('black', 1100),
    narrate('The chains were cold and they went on forever.'),
    narrate('Below us, Bevelle had already started ringing its bells.'),
    narrate('I remember thinking we were going to be in time.'),
    wait(1500),
  ],
  victoryQuips: {
    // §5.4's register. Not the grim column — this is an anticlimax, not a
    // funeral — but the win is small and everyone knows it. The Stonetouch /
    // Stone Ward joke (§1.4) belongs to Lulu, who notices the drop is the
    // counter to the thing that nearly killed them.
    tidus: ['Okay. Next one.', 'It was just doing its job.', 'Still flying. Good enough.'],
    wakka: ['Ya! That is how you do it!', 'Never fought nothin at this altitude.'],
    lulu: ['Stone Ward. Now that it is over.', 'Efficient. Next.'],
    rikku: ['Ha! Bad dog!', 'Can we land now? Please?'],
    auron: ['A guard. Nothing more.', 'The door is still shut.'],
    kimahri: ['It fell. Good.', 'Kimahri does not like the sky.'],
  },
  mid: [
    {
      // Inhale is one of only two enemy telegraphs in the anthology (§12.2)
      // and the player has exactly one turn. Teach the dodge, never a button.
      id: 'evrae-first-inhale',
      when: { type: 'ability-used', who: 'evrae', ability: 'evrae-inhale' },
      once: true,
      script: 'evrae-first-inhale',
    },
    {
      // The dodge worked. The player spent a turn on an order instead of on
      // damage — say so once, warmly, and never again.
      id: 'evrae-out-of-breath',
      when: { type: 'ability-used', who: 'evrae', ability: 'evrae-out-of-breath-range' },
      once: true,
      script: 'evrae-out-of-breath',
    },
    {
      // Phase 2. Evrae self-Hastes at 1/3 HP (10,667 of 32,000) and the
      // ship's tricks start failing [chapter-evrae-engine.md].
      id: 'evrae-haste-phase',
      when: { type: 'hp-below', who: 'evrae', fraction: 1 / 3 },
      once: true,
      script: 'evrae-haste-phase',
    },
    {
      // Stone Gaze lands. Rikku is right on a technical point, per her
      // guardrail (§1.15): the Al Bhed Potion is the cure, and it is the one
      // thing standing between a petrify and a Swooping Scythe shatter.
      id: 'evrae-first-petrify',
      when: { type: 'status-applied', who: 'tidus', status: 'petrify' },
      once: true,
      script: 'evrae-first-petrify',
    },
    {
      // The missile economy, once, on the first volley. The *out of ammo*
      // beat the preflight asks for is not wireable today — see the handoff.
      id: 'cid-first-volley',
      when: { type: 'ability-used', who: 'cid', ability: 'cid-guided-missiles' },
      once: true,
      script: 'cid-first-volley',
    },
  ],
  midScripts: {
    'evrae-first-inhale': [
      camera('action', 300),
      say('wakka', 'Its throat! Look at its throat!', { auto: 1200 }),
      say('auron', 'Out of its reach. Now.', { auto: 1200 }),
      camera('idle', 300),
    ],
    'evrae-out-of-breath': [
      say('rikku', 'It missed! It totally missed!', { auto: 1200 }),
      say('lulu', 'The distance did that. Not you.', { auto: 1400 }),
    ],
    'evrae-haste-phase': [
      camera('action', 300),
      say('tidus', 'It is faster. Why is it faster?', { auto: 1200 }),
      say('auron', 'It stopped guarding. Now it hunts.', { auto: 1400 }),
      camera('idle', 300),
    ],
    'evrae-first-petrify': [
      say('rikku', 'He is turning to stone! Hold still!', { auto: 1300 }),
      say('rikku', 'Al Bhed Potion. Trust me.', { auto: 1200 }),
    ],
    'cid-first-volley': [
      say('cid', 'Missiles away! Count them, they are not free!', { auto: 1500 }),
    ],
  },
};

export default evraeAirshipScripts;
