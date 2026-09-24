/**
 * Chapter 6 scripts — the Leblanc Syndicate, Chateau Leblanc. Scene tag **E8**.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Every beat, speaker and cue
 * here comes from `research/ffx2-leblanc-syndicate.md` §9 and §10.3 and from
 * `research/writing-bible.md` §1.14–1.16 / §2.2. Nothing in this file exists in
 * FFX: the speakers `leblanc` / `logos` / `ormi` / `brother-x2` are FFX-2-only
 * `SpeakerId`s, the cues are FFX-2-only music keys, and the absence test in
 * `tests/unit/story-ffx2-leblanc.test.ts` asserts that no FFX speaker and no
 * FFX chapter id appears anywhere in it.
 *
 * Sources: beats `ffx2-leblanc-syndicate.md` §9.2 (beats 3–15), voices §9.3
 * (Leblanc / Logos / Ormi) and `writing-bible.md` §1.14–1.16 (YRP), register
 * `writing-bible.md` §2.2, music `ffx2-leblanc-syndicate.md` §10.3, the staged
 * plan `docs/plans/chapter-leblanc-review.md` §7.
 *
 * Story knowledge state [writing-bible §0.3]: **FFX-2 Chapter 2**, mission
 * "Faking and Entering". The Gullwings are rivals-not-yet-allies of the
 * Syndicate, **Paine has not had her Crimson Squad reckoning**, and **nobody
 * has heard of Shuyin or Lenne**. The chapter *number* (6) is a display label;
 * do not let it leak into what the characters know.
 *
 * Emotional job: a farce about a stolen sphere that stops being a farce once.
 * Everything before beat 14 is comedy; **beat 14 lands without a joke**
 * [§9.2's note — this is the hinge of FFX-2's plot and nobody in the room
 * knows it].
 *
 * Three things this chapter must not do [§9.4, restated in the preflight §7]:
 * no transcripts — every line here is original; **do not moralise the trio** —
 * they are beaten and then pragmatically allied with, never redeemed; **do not
 * make Leblanc pathetic** — she is humiliated by circumstance and never by the
 * narrative, and her one unexplained kindness to Ormi late in the fight is the
 * whole character.
 *
 * Register [writing-bible §2.2]: three-beat banter (**Rikku sets up → Yuna
 * reacts → Paine kills it**), overlap written with em dashes, and **exactly one
 * sincere exchange** — Paine shutting the Crimson Sphere off in
 * `act-one-cleared`. The Vegnagun reveal in `post` is not banter and not
 * sincerity; it is the floor dropping.
 *
 * Victory: this chapter is the **tonal inverse of Chapter 4** [§10.3's
 * "contract with the Bahamut chapter", preflight §5 Q7]. The pose, the fanfare
 * and a full `victoryQuips` bank all come back, so `results(false)`.
 *
 * ## Wiring notes for the integrator (this file registers itself nowhere)
 *
 * - **Music keys, resolved by the integrator (2026-09-22).** No dedicated cue
 *   exists (named nowhere in `docs/plans/music-modern-sound.md` or
 *   `docs/audio/THEMES.md`); per the brief ("if none is named, the cue
 *   chapter 4 uses"), this file calls Chapter 4's `scene-bevelle-underground`
 *   / `boss-ffx2-aeon` for the scene/battle beds and `scene-farplane` for the
 *   beat-14 hush — real, already-registered `MUSIC_KEYS`, not invented ones.
 *   A future music track can compose this chapter's own cues instead.
 * - **Every `sfx()` and `fx()` key used here already exists** in the banks, so
 *   nothing new is owed on that side.
 * - **Combatant ids.** The enemy data files do not exist yet, so the ids the
 *   triggers key off are declared once, here, in {@link LEBLANC_COMBATANT_IDS}.
 *   Act III takes the bare names because it is the real fight; Acts I and II
 *   are suffixed because §12 of the research forbids mixing the bestiary
 *   records (#220/#227 are not #222/#228). **The data owner may rename them —
 *   if so, change them in this one constant and nowhere else.**
 * - **The two between-act beats are chain seams**, not in-fight interrupts:
 *   `act-one-cleared` and `act-two-cleared` play at a group boundary and run
 *   longer than {@link MID_SCRIPT_BUDGET_MS}. The integrator must list them in
 *   `CHAIN_SEAMS['ffx2-leblanc']` in `src/story/registry.ts`. The four Act III
 *   beats are ordinary interrupts and are budgeted under 8 s.
 * - Registry rule: `id === script` for every trigger, and **every mid-battle
 *   `say` carries an `auto`** so no beat can sit on a Confirm.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
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
  wait,
} from '../dsl.ts';

/**
 * The combatant ids this chapter's triggers key off, in one place.
 *
 * **Reconciled against the real data** by the integrator: the script agent's
 * proposed `ormi-act1` / `logos-act2` matched no shipped enemy record. The
 * real Act I / II "boss" ids — matching the guide's own ACT I / II `phases`
 * (`src/data/guides/ffx2-leblanc.ts`) — are `ormi-entrance` and `logos-room`.
 */
export const LEBLANC_COMBATANT_IDS = {
  /** Act I — Ormi, bestiary #220, with a Dr. Goon and a Fem-Goon. */
  ormiActOne: 'ormi-entrance',
  /** Act II — Logos, bestiary #227. */
  logosActTwo: 'logos-room',
  /** Act III — Leblanc, bestiary #231. */
  leblanc: 'leblanc',
  /** Act III — Logos, bestiary #228. */
  logos: 'logos',
  /** Act III — Ormi, bestiary #222. */
  ormi: 'ormi',
} as const;

/**
 * Ability ids the Act III beats watch for. **Reconciled against the real
 * data** by the integrator: the shipped id is `x2-leblanc-not-so-mighty-
 * guard`, not the proposed `x2-lb-not-so-mighty-guard`. `x2-nll-1` matched.
 */
export const LEBLANC_ABILITY_IDS = {
  notSoMightyGuard: 'x2-leblanc-not-so-mighty-guard',
  /** Stage 1 of the three-stage combo; stages 2 and 3 follow in one action. */
  noLoveLostStageOne: 'x2-nll-1',
} as const;

const C = LEBLANC_COMBATANT_IDS;
const A = LEBLANC_ABILITY_IDS;

const mid: MidBattleTrigger[] = [
  {
    // Chain seam, §9.2 beat 9. Ormi runs; the girls search Logos' room and
    // find Crimson Sphere 10. This is the chapter's one sincere exchange.
    id: 'act-one-cleared',
    when: { type: 'ko', who: C.ormiActOne },
    once: true,
    script: 'act-one-cleared',
  },
  {
    // Chain seam, §9.2 beat 11. The treasure room: their stolen half-sphere,
    // and Leblanc's matching half sitting beside it.
    id: 'act-two-cleared',
    when: { type: 'ko', who: C.logosActTwo },
    once: true,
    script: 'act-two-cleared',
  },
  {
    // Act III beat 1 [preflight §7]. The first fight in the game where
    // ignoring a buff visibly doubles the fight's length. Paine names the
    // answer without naming the button.
    id: 'first-not-so-mighty-guard',
    when: { type: 'ability-used', who: C.leblanc, ability: A.notSoMightyGuard },
    once: true,
    script: 'first-not-so-mighty-guard',
  },
  {
    // Act III beat 2. The combo announces itself, loudly and badly.
    id: 'first-no-love-lost',
    when: { type: 'ability-used', who: C.leblanc, ability: A.noLoveLostStageOne },
    once: true,
    script: 'first-no-love-lost',
  },
  {
    // Act III beat 3a. Killing either henchman switches No Love Lost off
    // [§5.4]. Leblanc notices out loud: the fight teaching its own target
    // priority. Two triggers, because she does not say the same thing about
    // the two of them — and because Ormi alone is the A2 trap.
    id: 'logos-down',
    when: { type: 'ko', who: C.logos },
    once: true,
    script: 'logos-down',
  },
  {
    id: 'ormi-down',
    when: { type: 'ko', who: C.ormi },
    once: true,
    script: 'ormi-down',
  },
];

export const ffx2LeblancScripts: ChapterScripts = {
  pre: [
    // No dedicated chateau cue exists yet (named nowhere in `docs/plans/
    // music-modern-sound.md` or `docs/audio/THEMES.md`) — integrator's
    // fallback to Chapter 4's scene cue, `src/data/encounters.ts`'s class doc.
    music('scene-bevelle-underground', 1200),
    camera('idle', 0),
    fade('clear', 900),

    // --- Beat 3: in the front door, in stolen uniforms. Nobody looks twice.
    say('rikku-x2', 'Pink. They rob us, and I have to wear pink.'),
    say('paine', 'It suits you.'),
    say('rikku-x2', 'It does not—'),
    say('yuna-x2', 'Um. Heads down. Walking.'),

    // --- Beat 4: Logos and Ormi assign the new "goons" their duties.
    camera('action', 900),
    say('logos', 'You three. Names later. Duties now.'),
    say('ormi', 'Little one. Terminals. Try not to break them.'),
    say('ormi', 'Tall one. Stand there and look expensive.'),
    say('paine', '...Fine.'),
    say('logos', 'And you. The boss wants her shoulders seen to.'),
    say('yuna-x2', 'Her... shoulders.', { emotion: 'surprised' }),
    say('rikku-x2', 'Best day. This is the best day.', { emotion: 'happy' }),

    // --- Beat 5: the massage. Yuna's most undignified scene in either game,
    // played entirely for comedy [§9.2 beat 5]. Her seam is the whole joke:
    // she is performing being carefree while kneading her rival's shoulders.
    camera('idle', 1100),
    say('leblanc', 'Lower, pet. No. Lower. Do they train you at all?'),
    say('yuna-x2', "Sorry. I'm new."),
    say('leblanc', "Everyone's new. Nobody's any good."),
    say('leblanc', 'Harder. I carry all of Spira on these shoulders.'),
    say('yuna-x2', "...Yes, ma'am.", { emotion: 'pained' }),
    beat(1600),
    say('leblanc', 'Mmh. You may stay.'),
    beat(1600), // She is asleep. Nobody moves for a moment.
    say('paine', "She's asleep."),
    say('rikku-x2', 'Yunie. Yunie, your face.', { emotion: 'happy' }),
    say('yuna-x2', 'We never speak of this.'),

    // --- Beat 6: sent to check the switch that opens the underground.
    say('logos', 'Dining room. Far left door. Check the switch.'),
    say('ormi', "And don't touch nothin'."),
    say('rikku-x2', 'Touch nothing. Got it.'),

    // --- Beat 7: Brother on the comm, at full volume. The cover is blown.
    sfx('machina-groan'),
    say('brother-x2', 'RIKKU! Rikku, do you copy? It is Brother!'),
    say('rikku-x2', 'Shh! Shh shh shh!'),
    say('brother-x2', 'I CANNOT HEAR YOU! SPEAK UP!'),
    say('rikku-x2', 'I said shush—'),
    say('brother-x2', 'YUNA! Are you massaging the enemy?!'),
    beat(1800),
    say('ormi', 'Wait. Wait, wait, wait. I know that voice.'),
    say('ormi', "That's — no. No! That's cheating, that is!", { emotion: 'angry' }),
    say('paine', "Cover's blown."),
    say('rikku-x2', 'Worth it.'),

    setPose('yuna-x2', 'ready'),
    // No dedicated boss cue exists yet — fallback to Chapter 4's, same reason
    // as the scene cue above.
    music('boss-ffx2-aeon', 1200),
    battleStart(),
  ],

  post: [
    // --- The flourish comes back. Chapter 4 suppressed all of this; this one
    // is its inverse [§10.3, preflight §5 Q7]: let them celebrate, loudly.
    music(null, 600),
    camera('victory', 900),
    setPose('yuna-x2', 'victory'),
    setPose('rikku-x2', 'victory'),
    setPose('paine', 'victory'),
    wait(1400),
    results(false),

    say('rikku-x2', "That's for robbing our airship!", { emotion: 'happy' }),
    say('paine', "You're posing."),
    say('rikku-x2', "I'm posing."),

    // --- Beat 13: she gives the sphere up rather than lose a fourth time.
    // Never pathetic: she is annoyed, not broken, and she keeps the last word.
    camera('idle', 900),
    say('leblanc', "Oh, don't gloat, pet. You'll crease."),
    say('leblanc', "Fine. Take it. I'd memorised the good part anyway."),
    say('yuna-x2', 'You had the other half. The whole time.'),
    say('leblanc', 'I had the *better* half, dearie.'),
    say('rikku-x2', 'Is she flirting with a sphere?'),
    say('paine', 'Play it.'),

    // --- Beat 14: THE JOKE STOPS HERE. No banter until the truce. [§9.2]
    // No dedicated hush cue exists yet — `scene-farplane` ("rest without
    // forgetting") is the project's other Vegnagun-adjacent ambient cue and
    // reads closer to this beat's mood than reusing the entrance cue again.
    music('scene-farplane', 1600),
    fx('pyrefly-memory'),
    camera('action', 1200),
    wait(2000),
    say('rikku-x2', 'What am I looking at?'),
    say('logos', "The scale is wrong. That's under Bevelle."),
    say('ormi', 'Under the temple? Under the whole city?'),
    say('leblanc', "It's called Vegnagun."),
    beat(1600),
    say('leblanc', 'Built to end a war. Never used. Never scrapped.'),
    say('yuna-x2', 'Then why is it moving?'),
    beat(2000), // Nobody answers. Hold on the six of them watching.
    say('paine', 'Something woke it up.'),

    // --- Beat 15: the truce. Two rival crews, one hole in the ground.
    // Leblanc's reason surfaces obliquely and is never explained [§9.3].
    camera('idle', 1200),
    say('leblanc', 'My crew goes down there. Today.'),
    say('yuna-x2', 'So does mine.'),
    say('leblanc', "Then don't slow me down, dearie."),
    say('rikku-x2', 'Did we just... team up?'),
    say('paine', "Don't say it out loud."),
    say('yuna-x2', 'Why today, Leblanc?'),
    beat(1600), // She does not answer the question that was asked.
    say('leblanc', 'Someone I am fond of is down there.'),
    say('leblanc', "That's all you're getting."),
    say('ormi', 'She means Noo—'),
    say('logos', 'Ormi.'),
    say('ormi', '...Right. Nobody. She means nobody.'),

    fade('black', 1400),
    say('rikku-x2', 'I still hate the pink.'),
    say('paine', 'Keep it. It suits you.'), // Callback with variation [§2.1].
    wait(1400),
  ],

  /**
   * Full bank, restored [§10.3, preflight §5 Q7]. At most 10 words each
   * [writing-bible §5.4]. Keyed by party member id, as Chapter 5 does.
   */
  victoryQuips: {
    yuna: ['We got it back.', 'That was... undignified. For everyone.', 'Mission complete!'],
    rikku: ['Gullwings one, Syndicate nothing!', 'Nobody robs us twice.', 'Can I keep the outfit?'],
    paine: ['Predictable.', 'They fight like they dress.', '...That was almost fun.'],
  },

  mid,

  midScripts: {
    // --- Chain seam. §9.2 beat 9 — the comedy briefly stops being funny.
    // Paine's reckoning is chapters away, so she shuts it down and explains
    // nothing. This is the chapter's one sincere exchange; banter resumes
    // immediately after, which is what makes it land [writing-bible §2.2].
    'act-one-cleared': [
      camera('action', 600),
      say('rikku-x2', 'He left his door open. Rude, and helpful.', { auto: 1400 }),
      say('rikku-x2', 'Dud sphere. Dud sphere. Dud— huh.', { auto: 1300 }),
      fx('pyrefly-memory'),
      wait(1400),
      say('paine', 'Turn that off.', { auto: 1100 }),
      say('yuna-x2', 'Paine? What is it?', { auto: 1200 }),
      say('paine', 'Turn it off.', { auto: 1400 }),
      wait(1600),
      say('rikku-x2', '...Okay. Next room.', { auto: 1300 }),
      camera('idle', 600),
    ],

    // --- Chain seam. §9.2 beat 11 — she had the other half all along.
    'act-two-cleared': [
      camera('action', 600),
      say('rikku-x2', "There! That's ours! That's our half!", { auto: 1300 }),
      say('yuna-x2', 'Rikku. Look what it is sitting next to.', { auto: 1400 }),
      wait(1400),
      say('paine', "She's had the other half the whole time.", { auto: 1400 }),
      say('rikku-x2', 'The WHOLE time?!', { auto: 1100 }),
      say('yuna-x2', "Then we'll ask her for it. Politely.", { auto: 1300 }),
      say('paine', 'No.', { auto: 1000 }),
      say('yuna-x2', '...Right. Not politely.', { auto: 1300 }),
      camera('idle', 600),
    ],

    // --- Act III beat 1. Three buffs at once; the fight doubles in length if
    // nobody answers. Name the shape, not the button [writing-bible §5.1].
    'first-not-so-mighty-guard': [
      say('leblanc', 'Not-So-Mighty Guard, darlings. Do keep up.', { auto: 1100 }),
      say('paine', 'Three layers. She just doubled this fight.', { auto: 1150 }),
      say('rikku-x2', 'So we peel them off! Dispel, Dispel!', { auto: 1300 }),
      say('paine', "Now you're thinking.", { auto: 1100 }),
    ],

    // --- Act III beat 2. The combo announces itself. A spectacle, not an
    // execution [§4.5] — so the trio get to be ridiculous while it winds up.
    'first-no-love-lost': [
      camera('action', 400),
      say('leblanc', 'Boys! The one we practised!', { auto: 900 }),
      say('ormi', 'The one we — oh! THAT one!', { auto: 900 }),
      say('logos', 'It has a name, Ormi. Use the name.', { auto: 1000 }),
      say('leblanc', 'No Love Lost!', { auto: 900 }),
      say('paine', 'Brace.', { auto: 900 }),
      camera('idle', 400),
    ],

    // --- Act III beat 3a. The combo is off the board and she says so. This
    // is the fight teaching its own target priority out loud [§5.4].
    'logos-down': [
      say('ormi', 'Logos! Logos, get up!', { auto: 1200 }),
      say('leblanc', "Leave him, lamb. He's resting.", { auto: 1300 }),
      say('leblanc', '...And there goes the routine.', { auto: 1400 }),
      say('paine', "Combo's gone. Ormi next.", { auto: 1200 }),
    ],

    // --- Act III beat 3b. Her one unexplained kindness [§9.3, "the seam"].
    // It is late, it is short, and nobody comments on it.
    'ormi-down': [
      say('ormi', 'Boss... I held the door.', { auto: 1100 }),
      say('leblanc', 'You did, lamb. Badly. But you did.', { auto: 1300 }),
      say('leblanc', 'Well. Nobody left to be clever with.', { auto: 1400 }),
      say('rikku-x2', 'No more combo! Go, go, go!', { auto: 1200 }),
    ],
  },
};

export default ffx2LeblancScripts;
