/**
 * The Guardians of the Bevelle Underground (Georapella and the Precepts Guard on floor 3, Baralai on floor 7): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15 precedent; the Maesters' FM6).** The chapter is hidden behind a typed word, so nothing here is on the board; the words are the chapter lane's, written
 * under Bailey's blanket yes of 2026-11-06, and every line is ours. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts,
 * Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore) and its Baralai (§1.20: courteous, careful, complete sentences, `Lady Yuna` always, apologises precisely and once, never
 * raises his voice).
 *
 * The beats are the sources': the Bevelle Underground is the Gullwings' way to Vegnagun, entered through the hole in the Chamber of the Fayth; **Baralai, Praetor of New Yevon, confronts them to stop anyone reaching
 * Vegnagun** and is beaten (`research/ffx2-bahamut.md` §5, `research/writing-bible.md` §6.2; the game has Paine fight him alone, and this chapter fields all three girls, as every fight of the chapters does: the draft
 * lets Paine step up first). Georapella and the Precepts Guard are guardians of the corridors with no story of their own; the draft gives them none.
 *
 * 1. **pre**: floor 3, the corridor, the first guardian rises.
 * 2. **two seams** (a seam is a mid-battle script that plays at a link's fall: Georapella's and the Precepts Guard's): the corridor mends the girls (no Save Sphere card plays between the acts, so the line says why they are
 *    whole again), the next guardian, then the stairs down to floor 7 and the man who waits there, **who is counting every blow** (BG4: the entrance line; the game shows no counter). Each is about 13 to 14 seconds with the
 *    player's hands off.
 * 3. **mid-battle callouts** (three, each a short interrupt): Georapella's first Ga spell, the Precepts Guard's first Death, and the hit count reaching nine on Baralai. Rikku's, Yuna's and Paine's voices, naming the answer
 *    without naming the button.
 * 4. **post**: Baralai falls and withdraws, as the story has him do; one short sincere exchange; the joke restored; Vegnagun is still down there.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits, Baralai with his; the narration is a stage direction in the box with no name plate (`'none'`).
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed; each fight is the formation's cue (`data/ffx2/enemies/bevelle-guardians.ts`, `boss-bahamut` for the
 * two guardians and `boss-den-of-woe` for Baralai, flagged stand-ins). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, music, results, say, shake, wait } from '../dsl.ts';
import { BARALAI_COUNT_NINE_TRIGGER, GUARDIANS_SEAM_1, GUARDIANS_SEAM_2, X2_GEORAPELLA_ID, X2_PRECEPTS_GUARD_ID } from '../../data/bevelle-guardians-ids.ts';
import { GEORAPELLA_THUNDAGA_ID, PRECEPTS_DEATH_ID } from '../../data/ffx2/enemies/bevelle-guardians-abilities.ts';

/** Names the Bevelle AI emits (`src/battle/ffx2/ai/bevelle-guardians.ts` `BARALAI_COUNT_NINE`), each with a callout below and NO entry in `mid` (the event's name is the script's key, as the Den of Woe's count of seven). */
export const BEVELLE_GUARDIANS_AI_TRIGGERS = [BARALAI_COUNT_NINE_TRIGGER] as const;

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Under Bevelle, the third floor down. A stone corridor, and a tall shape at the end of it, waiting.'), // ours: the place and the first guardian
  say('rikku-x2', 'It is just standing there. Why is it just standing there?'), // ours: Rikku sets up
  say('yuna-x2', 'Guarding something, I think.'), // ours: Yuna reacts
  say('paine', 'Then we are what it is guarding against.'), // ours: Paine kills it
  shake(6, 400),
  say('none', 'The shape lifts a hand, and the air begins to fill with colour.'), // ours: Georapella begins its ring of spells
  say('rikku-x2', 'Is it going to cast at all of us at once?'), // ours
  say('paine', 'Shell first. Then we hurt it.'), // ours: the sourced answer (Shell, a healer, Holy as the weakness)
  beat(600),
  say('yuna-x2', 'Stay together. We heal as we go.'), // ours
  battleStart(),
];

// --------------------------------------------------------------------------- seams

/**
 * The seam from Georapella to the Precepts Guard: Georapella's fall. Authored as a hands-off beat; every `say` carries its own `auto`. About 13 seconds.
 */
const SEAM_1: StoryScript = [
  say('none', 'The tall shape folds into the floor. The pyreflies close every wound.', { auto: 1800 }), // ours: it falls, and why the girls are whole again (no Save Sphere card plays between the acts)
  say('rikku-x2', 'Free refills! Is there another one?', { auto: 1100 }), // ours: Rikku sets up
  say('paine', 'There is always another one.', { auto: 1000 }), // ours: Paine kills it
  say('none', 'A second guardian steps out of the dark, and tries every curse it knows.', { auto: 1900 }), // ours: the Precepts Guard
  say('yuna-x2', 'Watch for the dark one. It reaches for lives.', { auto: 1400 }), // ours: Death in its list
];

/** The seam from the Precepts Guard to Baralai: the second guardian's fall, the stairs, the man. About 14 seconds. */
const SEAM_2: StoryScript = [
  say('none', 'The second guardian breaks. The pyreflies close every wound, and the stair goes down.', { auto: 2000 }), // ours: it falls, and why the girls are whole again
  say('rikku-x2', 'Floor seven. It smells of old metal.', { auto: 1000 }), // ours: Rikku sets up
  say('none', 'A man in the robes of Bevelle waits below, in no hurry at all.', { auto: 1600 }), // ours: Baralai, unnamed until he speaks
  say('baralai', 'Lady Yuna. I will not hurt you more than I must.', { auto: 1700 }), // ours: his register, courteous and exact (writing bible §1.20)
  say('paine', 'He counts every blow. The tenth one brings a drill.', { auto: 1500 }), // ours: the entrance line (BG4): the counter the game never shows; it names the rule and does not tell the player to hold back (BG16: counting measured worse than Protect and the Change)
];

// --------------------------------------------------------------------------- mid

/** Georapella's first Ga spell: the ring begins. */
const FIRST_GA = 'first-ga';
/** The Precepts Guard's first Death. */
const FIRST_DEATH = 'first-death';

const MID: MidBattleTrigger[] = [
  { id: FIRST_GA, when: { type: 'ability-used', who: X2_GEORAPELLA_ID, ability: GEORAPELLA_THUNDAGA_ID }, once: true, script: FIRST_GA },
  { id: GUARDIANS_SEAM_1, when: { type: 'ko', who: X2_GEORAPELLA_ID }, once: true, script: GUARDIANS_SEAM_1 },
  { id: FIRST_DEATH, when: { type: 'ability-used', who: X2_PRECEPTS_GUARD_ID, ability: PRECEPTS_DEATH_ID }, once: true, script: FIRST_DEATH },
  { id: GUARDIANS_SEAM_2, when: { type: 'ko', who: X2_PRECEPTS_GUARD_ID }, once: true, script: GUARDIANS_SEAM_2 },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'Baralai lowers the staff. He bows his head, and steps back into the dark.', { auto: 2000 }), // ours: he withdraws, as the story has him do
  say('baralai', 'Forgive me, Lady Yuna. I could not let you pass.', { auto: 2100 }), // ours: apologises precisely and once (writing bible §1.20)
  say('yuna-x2', 'You are afraid of what is down there.', { auto: 1700 }), // ours
  say('paine', 'So are we.', { auto: 1100 }), // ours: the one sincere beat (writing bible §2.2: at most three lines)
  beat(700),
  say('rikku-x2', 'Great. Two guardians and a Praetor. I could use a nap.', { auto: 2300 }), // ours: the joke returns (two guardians fought, then Baralai: the count was wrong in the first draft)
  say('none', 'Far below, something large turns over in its sleep.', { auto: 1800 }), // ours: the tease at Limbo (Bahamut, Chapter IV)
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [GUARDIANS_SEAM_1]: SEAM_1,
  [GUARDIANS_SEAM_2]: SEAM_2,

  // Georapella's first Ga spell: it hits all three, and it never stops. Shell and a healer are the answer.
  [FIRST_GA]: [
    say('rikku-x2', 'It hit all of us at once!', { auto: 1300 }),
    say('paine', 'Shell. Then keep healing.', { auto: 1200 }),
  ],
  // The Precepts Guard's first Death: a girl falls at once; a Phoenix Down raises her. The words say only that: the game's script passes Death over only when EVERY girl wears Reflect (`m263.src` 126 to 129), this build learns no Reflect (`builds/bevelle.ts`), and the engine has no Reflect redirect (handoff section 4, finding 5), so no line here claims a way to guard against it.
  [FIRST_DEATH]: [
    say('yuna-x2', 'It reaches for our lives!', { auto: 1200 }),
    say('paine', 'Raise her fast.', { auto: 1100 }),
  ],
  // Baralai's blow count reaches nine (BG4: the one callout; the game shows no counter): the next blow on him calls Drill Shot, and whoever lands it takes it. Emitted by the AI, once. The answer it gives is the measured one (BG16: Protect halves the shot, and holding the blows back costs more than it saves), never "stop at nine".
  [BARALAI_COUNT_NINE_TRIGGER]: [
    say('paine', 'Nine. The next blow calls the drill.', { auto: 1500 }),
    say('rikku-x2', 'Who takes it, then?', { auto: 1000 }),
    say('paine', 'Whoever lands it. Keep Protect up.', { auto: 1500 }),
  ],
};

/** The chapter's story layer: the corridor and the first guardian, two seams, three callouts, and the close. */
export const ffx2BevelleGuardiansScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
