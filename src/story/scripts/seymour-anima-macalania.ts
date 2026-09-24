/**
 * Chapter 6 scripts — Seymour + Anima, Macalania Temple antechamber.
 * New scene tag **E8** (the writing bible's §0.1 table predates this chapter;
 * `research/ffx-seymour-anima-macalania.md` §13 row 5 records that gap).
 *
 * **Game case: FFX only.** Every beat below comes from FFX's Macalania Temple
 * story (`research/ffx-seymour-anima-macalania.md` §9.6/§9.7,
 * `[verified: 2 sources]`); none of it is true of FFX-2, and nothing here is
 * shared plumbing. Hard rule 14. The absence test lives in
 * `tests/unit/chapters/macalania-story.test.ts` ("names no FFX-2 speaker").
 *
 * Sources:
 *   - `docs/plans/chapter-macalania-review.md` §7 — the beat list this file is
 *     written against, pre / mid / post.
 *   - `research/ffx-seymour-anima-macalania.md` §9.1 (the room), §9.6 (beats
 *     1–8), §9.7 (beats 9–14), §9.8 (the cue ids), §5.2–§5.4 (the three acts).
 *   - `research/writing-bible.md` §1.3 Yuna, §1.4 Auron, §1.5 Wakka, §1.6 Lulu,
 *     §1.7 Kimahri, §1.8 Rikku, §1.9 Seymour, §1.2 narration, §2.1 grammar.
 *
 * **Seymour's register here is pre-Flux**: courteous, not messianic. He has not
 * yet become the thing that kills a mountain; he is a High Priest who has done
 * one appalling thing and can explain it in a level voice. §1.9's "correct about
 * the diagnosis, monstrous about the cure" still holds — but quieter, and with
 * the honorific never dropped. Plan §7 calls this out as a writing-track item.
 *
 * **Speakers present in the scene, and only those** (the critic flagged absent
 * speakers elsewhere): Tidus, Yuna, Auron, Wakka, Lulu, Kimahri, Rikku,
 * Seymour. **Tromell has no `SpeakerId` and no painting** —
 * `docs/plans/chapter-macalania-review.md` §6.1 lists him as "NEW, and
 * optional… ask before commissioning". His post-battle lines are therefore
 * `'none'`, the no-name-plate register already used for Yunalesca's herald in
 * `yunalesca.ts`. If Bailey commissions a Tromell portrait, these four lines
 * move to a `'tromell'` speaker unchanged. See the handoff note.
 *
 * **The chapter framing** (§9.7, and the one thing the chapter says): this is
 * the Seymour fight the party **wins cleanly and loses completely**. The
 * mechanics rhyme with it — the boss you beat gets his whole bar back once.
 *
 * Staging: the antechamber is **ice pretending to be masonry**, translucent
 * where Gagazet is opaque, with the Chamber-of-the-Fayth door glowing through
 * the wall behind the enemy line [§9.1]. §9.1 also asks for a **held
 * establishing frame of the empty room** before any combatant walks into it —
 * that is the `wait(2000)` under the opening `fade('clear')`.
 *
 * `music()` steps: the preflight names two new cues (§6.3),
 * `scene-macalania-temple` and `boss-seymour-macalania`. Neither track exists
 * yet — Bailey judges by ear (hard rule 13) — and an unregistered cue throws
 * in the cutscene runner (`tests/unit/audio-story-cues.test.ts`), so the
 * integrator routed Chapter 1's `scene-gagazet` / `boss-seymour` in their
 * place. When the real cues land, swap the two calls back (and the chapter's
 * `music` and the formation's `musicCues`).
 *
 * The pre-battle **Trigger Commands** (Talk: Tidus +10 STR, Yuna +10 MDef,
 * Wakka +10 MDef, §9.6 beat 8) are `TriggerCommand`s fired from the battle
 * screen by `ai/macalania-rules.ts`, **not** story steps — same split as
 * Chapter 1's Kimahri/Yuna Talk.
 *
 * **Two rules every `mid` entry obeys** (`src/story/registry.ts` tests both):
 *   1. `id === script`, because the engine emits `script-trigger` with the
 *      trigger's **id** and the presenter looks the script up by that name.
 *   2. Every `say` in a mid script carries an explicit `auto` — a mid-battle
 *      beat runs inside a live fight on a 30 s presenter budget.
 *
 * **Not registered anywhere.** `src/story/registry.ts`, `src/story/index.ts`
 * and `src/data/encounters.ts` are integrator-only
 * [docs/plans/chapter-macalania-review.md §8.1]. The integrator adds this
 * chapter's key alongside `encounters.ts`, and `AI_EMITTED_TRIGGERS` gains an
 * empty entry — this chapter emits no AI-side script triggers.
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
  narrate,
  results,
  say,
  setPose,
  sfx,
  showActor,
  wait,
} from '../dsl.ts';

/**
 * Combatant ids, mirrored from
 * `src/data/ffx/enemies/seymour-anima-macalania.ts`. Mirrored rather than
 * imported: `src/story/**` is presentation-adjacent pure data and does not
 * reach into `src/data/ffx/**` in any of the five shipped chapters.
 */
const SEYMOUR = 'seymour-macalania';
const ANIMA = 'anima-macalania';
const GUARDIAN_A = 'guado-guardian-a';
const GUARDIAN_B = 'guado-guardian-b';

export const seymourAnimaMacalaniaScripts: ChapterScripts = {
  pre: [
    // §9.1 — the room is shown before it is fought in. Light through ice,
    // the Chamber door glowing behind the enemy line, and no one in it.
    // Integrator: the preflight's own cue (`scene-macalania-temple`, §6.3) is
    // an unbuilt composition, so this routes Chapter 1's scene cue until
    // Bailey picks one by ear [docs/handoff/chapter-macalania.md].
    music('scene-gagazet', 1400),
    camera('idle', 0),
    fade('clear', 1400),
    sfx('fayth-hum'),
    wait(2000),

    // Yuna is still inside the Chamber [§9.6 beat 5]. She is not in this scene
    // until beat 7, and nothing she would answer is said to her.
    hideActor('yuna', 0),

    // The ordinary line that defuses, per §2.1 — one per scene, and it is not
    // clever. Rikku on the architecture.
    say('rikku', 'The whole place is ice. Even the stairs. Rude.'),
    beat(1400),
    // Kimahri's line lands after the silence, never into it [§1.7]. The temple
    // stands on the frozen lake, so the water is literally there.
    say('kimahri', 'Kimahri hears water. Under floor.'),
    beat(1400),

    // §9.6 beat 4 — Tromell's gifts, off-screen, carried in on them.
    say('wakka', 'Tromell gave us armor. On the way in.'),
    say('wakka', 'He was proud of us, ya? Real proud.'),
    say('lulu', 'That is the worst part of it.'),
    beat(1600),

    // §9.6 beat 3 — the sphere. Nobody says Jyscal's name twice.
    say('tidus', 'We watched the sphere. All of it.'),
    say('lulu', 'Jyscal named his own murderer.'),
    say('rikku', 'And Yunie just... carried it. Alone.'),
    beat(1800),

    // §9.6 beat 5 — he does not enter. He was already waiting.
    showActor('seymour', { at: { slot: 0, side: 'enemy' }, ms: 900, facing: -1 }),
    say('seymour', 'Guardians. You are early.'),
    say('seymour', 'She is still in the Chamber. Shall we wait?'),

    say('tidus', 'You killed your father.', { emotion: 'angry' }),
    beat(1800), // He does not deny it. He considers the phrasing.

    // §9.6 beat 6 — he explains it, in a level voice, and it is coherent.
    say('seymour', 'Yes. In the spring. It took some time.'),
    say('seymour', 'He meant to die apologising to Spira.'),
    say('seymour', 'I would not let him leave like that.'),
    say('wakka', "Don't you sound reasonable. Not about that."),
    say('auron', 'Say nothing. Let him finish.'),

    // §9.6 beat 6, second half — he works out what she meant to do and hands
    // it to them, because taking it from her costs him nothing.
    say('seymour', 'She accepted me. It surprised her guardians.'),
    say('seymour', 'It did not surprise me.'),
    beat(1400),
    say('seymour', 'She came to be alone in a room with me.'),
    say('lulu', "Don't.", { emotion: 'angry' }),
    say('seymour', 'A summoner, a staff, and no witnesses.'),
    say('seymour', 'I admire it. Truly.'),

    // §9.6 beat 7 — she comes out of the Chamber. She has just received Shiva
    // and the seal is still on her. The mark is OUR mark, not the canon glyph
    // [§6.2 VFX, hard rule 8].
    // Integrator: no `chamber-door` sound exists; the stone-hall bell stands in.
    sfx('dome-echo'),
    showActor('yuna', { at: { slot: 3, side: 'party' }, ms: 900 }),
    fx('shiva-seal', 'yuna'),
    beat(1600),
    say('yuna', 'Maester Seymour.'), // The honorific, held one last time.
    say('seymour', 'Lady Yuna. They have told you what they think.'),
    beat(1400),
    say('seymour', 'Tell them they are wrong. I will wait.'),
    beat(2000), // She does not. That silence is the answer.

    // The climax: understate, then one unguarded line, then cut [§2.1].
    say('seymour', 'You came here to kill me.'),
    beat(1800),
    say('yuna', 'Yes.'), // The "Yes." beat — once per encounter, unqualified.
    beat(2000),

    say('seymour', 'Thank you. That was the last honest thing.'),

    // He stops pretending. The two retainers were always in the room.
    // Integrator: `boss-seymour-macalania` (§9.8, its own theme) does not
    // exist yet; Chapter 1's `boss-seymour` stands in, recorded as a stopgap.
    music('boss-seymour', 1000),
    showActor(GUARDIAN_A, { at: { slot: 1, side: 'enemy' }, ms: 600, facing: -1 }),
    showActor(GUARDIAN_B, { at: { slot: 2, side: 'enemy' }, ms: 600, facing: -1 }),
    setPose('yuna', 'ready'),
    camera('action', 700),
    say('auron', 'Guard her. Move.'),
    battleStart(),
  ],

  post: [
    // The tally first. Then the chapter takes it all back.
    music(null, 900),
    camera('victory', 800),
    beat(1400),
    results(),

    // `showResults()` (`src/app/screens/BattleScreenFlow.ts`) starts
    // `victory-ffx` on its own once the tally shows, and the `music(null,
    // 900)` above only reaches the results() marker — the fanfare it starts
    // then bled uncut through the flat, anticlimactic kill this chapter needs
    // (§9.7: "the party wins cleanly and loses completely"), the same bug as
    // Chapter VIII's beat 9 (fixed in 80672bf) and Chapter 2's aftermath. Cut
    // it again here, right as the scene resumes past the tally.
    music(null, 300),

    // §9.7 beat 9 — he is properly dead. Flat, anticlimactic, no speech, no
    // pyreflies. Flux dissolves; this one just stops.
    setPose(SEYMOUR, 'kneel'),
    camera('idle', 1000),
    beat(1600),
    setPose(SEYMOUR, 'ko'),
    beat(1800),
    say('tidus', "...That's it?"),
    say('auron', 'That is what it looks like.'),

    // §9.7 beat 10 — she kneels to send him, and gets three steps in.
    setPose('yuna', 'kneel'),
    beat(1400),
    setPose('yuna', 'cast'),
    fx('sending-dance', 'yuna'),
    beat(1600),

    // The Guado. Tromell speaks; no portrait, so no name plate [see header].
    sfx('footstep'), // integrator: no `guado-robes` sound exists
    say('none', 'Step away from Lord Seymour, Lady Summoner.'),
    say('none', 'You will not put hands on him again.'),
    setPose('yuna', 'idle'),
    say('yuna', 'He has to be sent. Please. Let me finish.'),
    say('none', 'He will be cared for. By his own people.'),
    beat(1600),

    // The sphere — the only evidence in Spira, and it takes one hand.
    say('none', 'And this. This was never yours.'),
    sfx('petrify-shatter'), // integrator: no `sphere-crack` sound exists
    flash(220),
    beat(1600),
    say('lulu', 'They just destroyed the only proof.'),
    say('none', 'Traitors, all of you. It will be announced.'),
    hideActor(SEYMOUR, 600),
    beat(1800),

    // §9.7 beat 11 — unsent, because she was not allowed to finish. The party
    // does not know that yet; Kimahri says the half of it they can know.
    say('yuna', "...I didn't send him.", { emotion: 'sad' }),
    say('kimahri', 'Then he does not rest.'),
    beat(1600),

    // §9.7 beat 12 — they run.
    say('rikku', 'Yunie. We have to go. Right now.'),
    say('auron', 'Down the ramp. Do not stop on the lake.'),
    beat(1500),

    // Tidus, retrospective: after the high, never before [§1.2, §2.1]. Past
    // tense, one concrete detail, one thing he believed and was wrong about.
    fade('black', 1200),
    narrate('We won that fight in about six minutes.'),
    narrate('Then they took the body, the sphere and our names.'),
    narrate('I kept waiting for someone official to fix it.'),
    narrate('That was the trick. There was nobody above him.'),
    wait(1600),
  ],

  victoryQuips: {
    // §5.4 — written, unlike Chapter 4's deliberate silence, but short. They
    // have just won and lost at the same time and none of them knows it yet.
    tidus: ['...We won, right?', 'Why does that feel bad?', 'Keep moving.'],
    yuna: ['He must be sent.', 'Let me do this properly.'],
    auron: ['It is not finished.', 'Now the hard part.'],
    wakka: ['...Ya. We did that.', 'Yevon is gonna hear about this, ya?'],
    lulu: ['Nobody will believe us.', 'Keep the sphere close.'],
    kimahri: ['Kimahri did not like him.', 'Room is colder now.'],
    rikku: ['Okay. Okay. That happened.', 'Can we leave? Please?'],
  },

  mid: [
    {
      // Act one -> two. He summons at 3,000 of 6,000 [§5.2; the engine's own
      // SUMMON_HP_THRESHOLD], so the fraction is exactly 0.5.
      id: 'mac-anima-summon',
      when: { type: 'hp-below', who: SEYMOUR, fraction: 0.5 },
      once: true,
      script: 'mac-anima-summon',
    },
    {
      // Act two. The first Boost — somebody reads the window out loud, once.
      id: 'mac-first-boost',
      when: { type: 'ability-used', who: ANIMA, ability: 'anima-boost' },
      once: true,
      script: 'mac-first-boost',
    },
    {
      // Act two -> three. Anima reaching 0 is what `macalania-rules.ts`
      // dismisses her on, and she is REMOVED rather than KO'd
      // (`anima.removed = true`), so there is no `ko` signal to key on and
      // `hp-below` at 0 is the correct hook: `c.hp <= floor(maxHp * 0)`.
      id: 'mac-seymour-restored',
      when: { type: 'hp-below', who: ANIMA, fraction: 0 },
      once: true,
      script: 'mac-seymour-restored',
    },
  ],

  midScripts: {
    'mac-anima-summon': [
      camera('action', 500),
      // She names what is arriving before the player sees it. She cannot name
      // Anima — Yuna does not own her yet, and §8.4's irony is that the
      // Destruction Sphere in THIS temple is one of the prerequisites.
      say('yuna', 'An aeon. He is summoning an aeon.', { auto: 1300 }),
      say('seymour', 'She has waited a long time for this.', { auto: 1400 }),
      camera('idle', 400),
    ],
    'mac-first-boost': [
      // §1.15's guardrail: let Rikku be right on a technical point. One line,
      // not a tutorial; Lulu supplies the consequence, not the instruction.
      say('rikku', "She's winding up! That wasn't a spell!", { auto: 1300 }),
      say('lulu', 'Whatever lands next lands twice as hard.', { auto: 1400 }),
    ],
    'mac-seymour-restored': [
      // An HP bar is not a progress bar. Auron says the chapter's thesis in
      // six words and does not explain it.
      say('wakka', "His bar — hey! It's all the way back!", { auto: 1300 }),
      say('auron', 'You killed his weapon. Not him.', { auto: 1500 }),
    ],
  },
};

export default seymourAnimaMacalaniaScripts;
