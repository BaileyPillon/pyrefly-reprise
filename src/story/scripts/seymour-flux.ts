/**
 * Chapter 1 scripts — Seymour Flux (Mt. Gagazet, the Prominence). Scene tag E1.
 *
 * Source: `research/writing-bible.md` §3 E1 (canonical beat map, 22 pre-battle
 * lines, post-battle lines), §4.1 (banter bank), §5.4 (victory quips — use the
 * **grim** column here).
 *
 * Non-negotiable canonical beats [writing-bible §3 E1] — all present below:
 *   Pre 3  Kimahri charges — the loudest he is in the entire game.
 *   Pre 4  Seymour tells Kimahri precisely how the Ronso died.
 *   Pre 5  **Seymour reveals Jecht is Sin and offers Tidus the bargain.**
 *          This is the chapter's thematic hinge; do not cut it.
 *   Pre 6  Yuna refuses; Tidus refuses to be bought with his father.
 *   Post 11 Tidus and Auron tell Yuna that Sin is Jecht.
 *   Post 12 The Fayth Scar.
 *   Post 13 The fayth boy: Tidus and Dream Zanarkand are a dream.
 *
 * Staging note: the Prominence is **daylight, overcast, snow-scoured**. The
 * famous Gagazet sunset is at the summit, after the Sanctuary Keeper — do not
 * borrow it.
 *
 * Two climaxes, in this order [writing-bible §3 E1]: Auron's half-step (the
 * chapter turns) then Yuna's withheld prayer gesture (the scene turns). The
 * narration interlude is the chapter's **last** beat, never the first — §2.1
 * places narration after an emotional high, so `pre` opens cold on wind.
 *
 * Mechanics hooks this chapter needs:
 *   - A pre-battle **Talk** trigger command: Kimahri -> +10 STR, Yuna ->
 *     +10 MDEF for this battle [visual-bible §3.12.1]. That is a
 *     `TriggerCommand`, fired from the battle screen, not a story step.
 *   - Mortiorchis's two-stage telegraph is a battle event, not a script — but
 *     pair each state line with **one** party callout [writing-bible §5.2].
 *     `mortiorchis-first-charge` below is that one callout; the banner is the
 *     data agent's `Mortiorchis enters Auto-Attack Mode`.
 *
 * **Two rules every `mid` entry in this project obeys** — see
 * `src/story/registry.ts`, which tests both:
 *   1. `id === script`. The engine emits `script-trigger` with the trigger's
 *      **id** (`battle/ffx/triggers.ts`), and the presenter looks the script up
 *      by that name, so a trigger whose `script` differs from its `id` is a
 *      beat that can never play.
 *   2. Every `say` carries an explicit `auto`. A mid-battle script runs inside
 *      a live fight on a 30 s presenter budget; a line that waits on a Confirm
 *      that never comes wedges the beat until it is abandoned.
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
  shake,
  showActor,
  wait,
} from '../dsl.ts';

export const seymourFluxScripts: ChapterScripts = {
  pre: [
    // The Prominence. Wind only — no score under the bodies [§3 E1 line 1].
    music(null, 600),
    camera('idle', 0),
    fade('clear', 900),
    sfx('wind-high-altitude'),
    wait(1200),

    say('kimahri', 'Kimahri knows this one. And this one.', { emotion: 'pained' }),
    beat(1800), // Nobody answers. He finds Biran. Then Yenke. Then Kelk.
    setPose('kimahri', 'kneel'),
    beat(1400),

    showActor('seymour', { at: { slot: 0, side: 'enemy' }, ms: 700, facing: -1 }),
    say('seymour', 'They held the gate. All of them.'),
    say('seymour', 'For you, Lady Yuna.', { emotion: 'smug' }),

    // Pre 3 — Kimahri charges. No line, no warning, spear first.
    setPose('kimahri', 'attack'),
    sfx('kimahri-roar'),
    camera('action', 240),
    shake(8, 320),
    setPose('auron', 'point'), // Auron catches his arm and is dragged a stride.
    beat(1600),
    setPose('kimahri', 'idle'),

    // Pre 4 — how they died, and that he was late.
    say('seymour', 'Late, Ronso. They called your name.'),
    say('seymour', 'You were on the wrong side of the mountain.'),
    beat(1200),

    say('wakka', 'You did this? To them?', { emotion: 'angry' }),
    say('seymour', 'They refused comfort. I offered it anyway.'),
    say('tidus', "That's not comfort. That's a pile of bodies.", { emotion: 'angry' }),

    // Pre 5 — the hinge. He is offering, not taunting.
    say('seymour', 'Ah. The son of Jecht.'), // [ICONIC QUOTE] — 5 words.
    say('seymour', 'You talk about him when you think no one listens.'),
    music('scene-gagazet', 1600), // A low sting arrives under the reveal.
    say('seymour', 'So let me give you what no one else will.'),
    say('seymour', 'Your father is Sin.'),
    // Auron's half-step. Too late to stop it, and it is the confirmation.
    camera('idle', 700),
    setPose('auron', 'ready'),
    beat(2000),
    say('tidus', "...You're lying.", { emotion: 'surprised' }),
    beat(1400),
    say('tidus', "Auron. Tell him he's lying."),
    beat(1800), // Auron does not. That silence is the answer.

    say('seymour', 'Kill Sin, and you free him.'),
    say('seymour', 'I am offering you your father back.'),

    // Pre 6 — both refusals.
    say('yuna', 'No.'),
    beat(1500),
    say('yuna', "You don't get to hand me a reason."),
    say('tidus', "He's not a bargaining chip. He's my old man."),
    say('lulu', "Yuna. Don't listen."),
    say('lulu', 'He talks to keep you standing still.'),

    say('seymour', 'Spira is a wound that will not close.'),
    say('seymour', 'I am the bandage.'),

    // The scene turns: she reaches for the staff where she would bow.
    setPose('yuna', 'ready'),
    beat(1600),
    say('yuna', 'No. Not this time.', { emotion: 'determined' }),

    // The Mortiorchis unfolds out of the snow beneath him and he sits.
    music('boss-seymour', 900),
    fx('mortiorchis-unfold', 'seymour'),
    shake(12, 900),
    camera('action', 600),
    say('seymour', 'Then your hope ends here.'),
    say('auron', 'Enough talk. Move.'),
    battleStart(),
  ],
  post: [
    // The tally card first, then the chapter keeps going and gets worse.
    music(null, 800),
    camera('victory', 700),
    beat(1200),
    results(),

    // `showResults()` (`src/app/screens/BattleScreenFlow.ts`) starts
    // `victory-ffx` on its own once the tally shows, and the `music(null,
    // 800)` above only reaches the results() marker — the fanfare it starts
    // then bled uncut through the failed sending and the "Sin is Jecht"
    // reveal (same bug as Chapter VIII's beat 9, fixed in 80672bf, and
    // Chapter 2's aftermath). Cut it again here, right as the scene resumes
    // past the tally.
    music(null, 300),

    // --- Scene A — the sending that fails [§3 E1 post 1–12] ---------------
    setPose('seymour', 'kneel'),
    fx('pyreflies-stalled', 'seymour'),
    camera('idle', 900),
    setPose('yuna', 'cast'),
    fx('sending-dance', 'yuna'),
    beat(1800),
    say('seymour', "You can't send what refuses to go."),
    say('seymour', "Spira's sorrow is patient, Lady Yuna."),
    say('seymour', 'So am I.'),
    hideActor('seymour', 0), // He is simply gone. Snow fills the space.
    sfx('wind-gust'),
    beat(1600),
    setPose('yuna', 'idle'),
    say('yuna', "...I couldn't.", { emotion: 'sad' }),
    say('wakka', "Hey. That's not on you, ya?"),
    // The longest hold in the chapter. Kimahri kneels and says nothing.
    setPose('kimahri', 'kneel'),
    wait(3000),
    // Rikku starts to say something bright, and doesn't.
    setPose('rikku', 'ready'),
    beat(1400),
    setPose('rikku', 'idle'),
    say('auron', 'We keep climbing.'),
    say('tidus', "That's it? We just walk past them?"),
    say('auron', 'Yes.'),
    beat(1500), // He walks.

    // --- Scene B — "Sin is Jecht" [§3 E1 post 13–19] ----------------------
    fade('black', 900),
    fx('pyreflies-rising'),
    fade('clear', 900),
    camera('idle', 0),
    beat(1200), // Higher up the trail. Tidus has stopped them.
    say('tidus', 'Yuna. The thing Seymour said.'),
    beat(1400),
    say('tidus', "It's true."),
    say('yuna', '...Which thing.'),
    say('auron', 'Sin is Jecht.'),
    beat(1600),
    say('auron', "I've known since Zanarkand."),
    say('auron', 'I let you walk anyway.'),
    beat(1800), // Wakka and Lulu look at each other. Neither of them knew.
    say('yuna', "...I'm sorry.", { emotion: 'sad' }),
    say('tidus', "Don't. You're the one who has to swing."),

    // --- Scene C — the Fayth Scar and the dream [§3 E1 post 20–28] --------
    fade('black', 900),
    fade('clear', 1200),
    camera('idle', 1800),
    sfx('fayth-hum'),
    wait(1600),
    say('lulu', 'The people of Zanarkand. All of them.'),
    say('lulu', 'Still dreaming.'),
    say('wakka', '...A thousand years of this?'),
    beat(1600), // The others move on. Only Tidus sees the boy.
    showActor('fayth-boy', { ms: 900 }),
    say('fayth-boy', 'You know what we dream about.'),
    say('fayth-boy', 'A city. A sea. A boy who plays blitzball.'),
    say('tidus', '...Say it straight.'),
    say('fayth-boy', 'You are a dream.'),
    say('fayth-boy', 'Your father was a dream. Zanarkand is a dream.'),
    hideActor('fayth-boy', 700),
    beat(2000),

    // Tidus, retrospective. Nothing is resolved and nothing is offered.
    fade('black', 1200),
    narrate('We climbed the rest of the way in the dark.'),
    narrate('Nobody talked.'),
    narrate('I kept counting the ones we left behind.'),
    narrate('Then I stopped counting.'),
    wait(1400),
  ],
  victoryQuips: {
    // §5.4 — E1 is a grim encounter, so the light variants are suppressed.
    tidus: ['...Okay. Next one.', "That didn't feel like winning.", 'Keep moving.'],
    yuna: ['May they rest.', 'I will remember all of them.'],
    auron: ["It isn't over.", 'Nothing is finished here.'],
    wakka: ['...Ya. Okay. Ya.', "Don't feel much like cheerin'."],
    lulu: ["Don't celebrate yet.", 'Count them later.'],
    kimahri: ['Kimahri remembers.', 'Ronso do not forget.'],
    rikku: ['...Can we not do that again?', "I'm okay. I'm okay."],
  },
  mid: [
    {
      id: 'seymour-half',
      when: { type: 'hp-below', who: 'seymour-flux', fraction: 0.5 },
      once: true,
      script: 'seymour-half',
    },
    {
      // The first time the servant stops attacking and starts counting.
      id: 'mortiorchis-first-charge',
      when: { type: 'charge-started', who: 'mortiorchis' },
      once: true,
      script: 'mortiorchis-first-charge',
    },
    {
      // Lance of Atrophy lands. The lesson is one line, not a tutorial.
      id: 'first-zombie',
      when: { type: 'status-applied', who: 'tidus', status: 'zombie' },
      once: true,
      script: 'first-zombie',
    },
    {
      // He casts it as a kindness, which is the whole character
      // [writing-bible §3 E1 callouts].
      id: 'seymour-lance',
      when: { type: 'ability-used', who: 'seymour-flux', ability: 'lance-of-atrophy' },
      once: true,
      script: 'seymour-lance',
    },
  ],
  midScripts: {
    'seymour-half': [
      camera('action', 400),
      say('seymour', 'Good. Struggle.', { auto: 1000 }),
      say('seymour', 'It makes the rest feel earned.', { auto: 1300 }),
      camera('idle', 400),
    ],
    'mortiorchis-first-charge': [
      camera('action', 300),
      fx('mortiorchis-charge', 'mortiorchis'),
      say('auron', "It's charging. End this.", { auto: 1100 }),
      camera('idle', 300),
    ],
    'first-zombie': [
      say('rikku', "Eeew! Yunie, don't heal him!", { auto: 1200 }),
      say('lulu', "He's turned. Cures will kill him now.", { auto: 1400 }),
    ],
    'seymour-lance': [
      say('seymour', 'Let it in.', { auto: 1000 }),
      say('seymour', "It's quieter on the other side.", { auto: 1300 }),
    ],
  },
};

export default seymourFluxScripts;
