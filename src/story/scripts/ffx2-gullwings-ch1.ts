/**
 * Gullwings, Chapter 1 (Boris at the Floating Ruins, the Flame Dragon in Besaid's cave, the Guardian Beast in the Zanarkand Ruins, YSLS-Zero at Kilika's approach): the story layer of our hidden chapter. **FFX-2 only**
 * [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15 precedent; the Bevelle Guardians' BG14).** The chapter is hidden behind a typed word, so nothing here is on the board; the words are the chapter lane's, written
 * under Bailey's blanket yes of 2026-11-06, and every line is ours. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna
 * reacts, Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore). The tone is the Gullwings' first chapter: new at the work, a little pleased with themselves.
 *
 * The beats are the sources' (`research/re-ffx2-gullwings-chapter1.md` §2): the Floating Ruins on Mt. Gagazet after the Leblanc Syndicate race (Boris; the Black Mage dressphere comes after him), Besaid's cave (the Flame Dragon;
 * the White Mage dressphere comes after it), the Zanarkand Ruins (the Guardian Beast, on a pedestal) and Kilika's approach (YSLS-Zero, the "Awesome Sphere"; the last fight of the chapter). Nothing else of the missions' local plots
 * is staged, because the research names it and nothing more.
 *
 * 1. **pre**: the Floating Ruins, a sphere on the stones, Boris lowering himself from the arch.
 * 2. **three seams** (a seam is a mid-battle script that plays at a link's fall: Boris', the Flame Dragon's and the Guardian Beast's): the girls fly back to the Celsius and are patched up (no Save Sphere card plays
 *    between the acts, so the line says why they are whole again), the new dressphere where the game gives one, and the next hotspot. Each is about 11 to 13 seconds with the player's hands off.
 * 3. **mid-battle callouts** (five, each a short interrupt): Boris' Sticky End, the Flame Dragon's breath, the Guardian Beast's Curse and its Damocles Photon, and YSLS-Zero's Blast Punch. Rikku's, Yuna's and Paine's voices,
 *    naming the answer without naming the button.
 * 4. **post**: YSLS-Zero stops, the sphere, one sincere exchange, the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits; the narration is a stage direction in the box with no name plate (`'none'`).
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed; each fight is the formation's cue (`data/ffx2/enemies/gullwings-ch1.ts`, `boss-ffx2-fallen-aeons`, a
 * flagged stand-in). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, music, results, say, shake, wait } from '../dsl.ts';
import { GULLWINGS_SEAM_1, GULLWINGS_SEAM_2, GULLWINGS_SEAM_3, X2_BORIS_ID, X2_FLAME_DRAGON_ID, X2_GUARDIAN_BEAST_ID, X2_YSLS_ZERO_ID } from '../../data/gullwings-ch1-ids.ts';
import {
  BORIS_STICKY_END_ID,
  FLAME_DRAGON_FLAME_BREATH_ID,
  GUARDIAN_BEAST_CURSE_ID,
  GUARDIAN_BEAST_DAMOCLES_PHOTON_ID,
  YSLS_ZERO_BLAST_PUNCH_ID,
} from '../../data/ffx2/enemies/gullwings-ch1-abilities.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Mt. Gagazet, the Floating Ruins. The fog has lifted and the old stones are showing.'), // ours: the place (the research names the Floating Ruins at the peak)
  say('rikku-x2', 'We outran the Syndicate to get here. I am still a bit proud.'), // ours: Rikku sets up (the mission follows the Syndicate race)
  say('yuna-x2', 'Is that a sphere, on the stones?'), // ours: Yuna reacts
  say('paine', 'And a spider, on the sphere.'), // ours: Paine kills it
  shake(6, 400),
  say('none', 'A very large spider lowers itself from the arch, one thread at a time.'), // ours: Boris
  say('rikku-x2', 'Why are the first ones always spiders?'), // ours
  say('paine', 'It is not picky about fire or ice.'), // ours: the sourced answer (weak to both), said as a shrug
  beat(600),
  say('yuna-x2', 'Together, then. And nobody gets stuck.'), // ours: the go-call
  battleStart(),
];

// --------------------------------------------------------------------------- seams

/** The seam from Boris to the Flame Dragon: Boris' fall, the Black Mage dressphere, the flight to Besaid. About 12 seconds. */
const SEAM_1: StoryScript = [
  say('none', 'The spider curls up on the stones. The sphere is theirs, and the Celsius is a short flight away.', { auto: 2200 }), // ours: it falls, and why the girls are whole again (no Save Sphere card plays between the acts)
  say('none', 'A rest, a meal and a patched sleeve later, a new dress waits in the sphere.', { auto: 1900 }), // ours: patched up on the airship; the Black Mage dressphere is given here (the research)
  say('rikku-x2', 'A Black Mage! It comes with a hat!', { auto: 1400 }), // ours: Rikku sets up
  say('paine', 'Besaid next. Something is living in the cave.', { auto: 1700 }), // ours: the Flame Dragon in Besaid's cave
  say('yuna-x2', 'Then we had better say hello.', { auto: 1300 }), // ours
];

/** The seam from the Flame Dragon to the Guardian Beast: the dragon's fall, the White Mage dressphere, the flight to Zanarkand. About 12 seconds. */
const SEAM_2: StoryScript = [
  say('none', 'The dragon sags, and the cave smells of smoke and warm stone. Aboard the Celsius, every scorch is mended.', { auto: 2400 }), // ours: it falls, and why the girls are whole again
  say('yuna-x2', 'White Mage! Something kinder than a potion.', { auto: 1700 }), // ours: the White Mage dressphere is given here (the research)
  say('rikku-x2', 'Zanarkand next! The sphere is on a pedestal.', { auto: 1700 }), // ours: Rikku sets up (the Zanarkand Ruins, the sphere on the pedestal)
  say('paine', 'Something is always standing guard.', { auto: 1400 }), // ours: Paine kills it
];

/** The seam from the Guardian Beast to YSLS-Zero: the beast's fall, the curse lifting, the flight to Kilika. About 11 seconds. */
const SEAM_3: StoryScript = [
  say('none', 'The beast folds into the old stone, and the curse goes with it. The Celsius makes the girls whole again.', { auto: 2400 }), // ours: it falls, and why the girls are whole again
  say('rikku-x2', 'Last one! The Awesome Sphere, at Kilika!', { auto: 1700 }), // ours: Rikku sets up (the research names the Awesome Sphere and Kilika)
  say('paine', 'I do not trust anything called awesome.', { auto: 1700 }), // ours: Paine kills it
  say('yuna-x2', 'Nobody is trusting it. We are hitting it.', { auto: 1700 }), // ours
];

// --------------------------------------------------------------------------- mid

/** Boris' first Sticky End: the web on all three. */
const FIRST_STICKY_END = 'first-sticky-end';
/** The Flame Dragon's first Flame Breath. */
const FIRST_FLAME_BREATH = 'first-flame-breath';
/** The Guardian Beast's first Curse. */
const FIRST_CURSE = 'first-curse';
/** The Guardian Beast's first Damocles Photon. */
const FIRST_DAMOCLES_PHOTON = 'first-damocles-photon';
/** YSLS-Zero's first Blast Punch. */
const FIRST_BLAST_PUNCH = 'first-blast-punch';

const MID: MidBattleTrigger[] = [
  { id: FIRST_STICKY_END, when: { type: 'ability-used', who: X2_BORIS_ID, ability: BORIS_STICKY_END_ID }, once: true, script: FIRST_STICKY_END },
  { id: GULLWINGS_SEAM_1, when: { type: 'ko', who: X2_BORIS_ID }, once: true, script: GULLWINGS_SEAM_1 },
  { id: FIRST_FLAME_BREATH, when: { type: 'ability-used', who: X2_FLAME_DRAGON_ID, ability: FLAME_DRAGON_FLAME_BREATH_ID }, once: true, script: FIRST_FLAME_BREATH },
  { id: GULLWINGS_SEAM_2, when: { type: 'ko', who: X2_FLAME_DRAGON_ID }, once: true, script: GULLWINGS_SEAM_2 },
  { id: FIRST_CURSE, when: { type: 'ability-used', who: X2_GUARDIAN_BEAST_ID, ability: GUARDIAN_BEAST_CURSE_ID }, once: true, script: FIRST_CURSE },
  { id: FIRST_DAMOCLES_PHOTON, when: { type: 'ability-used', who: X2_GUARDIAN_BEAST_ID, ability: GUARDIAN_BEAST_DAMOCLES_PHOTON_ID }, once: true, script: FIRST_DAMOCLES_PHOTON },
  { id: GULLWINGS_SEAM_3, when: { type: 'ko', who: X2_GUARDIAN_BEAST_ID }, once: true, script: GULLWINGS_SEAM_3 },
  { id: FIRST_BLAST_PUNCH, when: { type: 'ability-used', who: X2_YSLS_ZERO_ID, ability: YSLS_ZERO_BLAST_PUNCH_ID }, once: true, script: FIRST_BLAST_PUNCH },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'YSLS-Zero stops, still humming. The Awesome Sphere sits quietly on its pedestal.', { auto: 2200 }), // ours: it falls
  say('yuna-x2', 'Four hotspots, and nobody fell off anything.', { auto: 1700 }), // ours: the one sincere beat (writing bible §2.2: at most three lines in a row)
  say('paine', 'Not today.', { auto: 1000 }), // ours
  beat(700),
  say('rikku-x2', 'Gullwings, chapter one: done! Do we get a certificate?', { auto: 2100 }), // ours: the joke returns
  say('paine', 'No.', { auto: 900 }), // ours: Paine kills it
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [GULLWINGS_SEAM_1]: SEAM_1,
  [GULLWINGS_SEAM_2]: SEAM_2,
  [GULLWINGS_SEAM_3]: SEAM_3,

  // Boris' first Sticky End: the web hits all three and may stop one. The answer is the item, not the button.
  [FIRST_STICKY_END]: [
    say('rikku-x2', 'Webbed! It got all of us!', { auto: 1300 }),
    say('paine', 'A Remedy frees whoever froze.', { auto: 1400 }),
  ],
  // The Flame Dragon's first breath: fire on all three, then the healthiest girl takes the claws.
  [FIRST_FLAME_BREATH]: [
    say('yuna-x2', 'It breathed on all three of us!', { auto: 1300 }),
    say('paine', 'Next it hits whoever is healthiest. Ice.', { auto: 1500 }),
  ],
  // The Guardian Beast's first Curse: a girl cannot change dress. The cure is the item.
  [FIRST_CURSE]: [
    say('yuna-x2', 'I cannot change my dress!', { auto: 1300 }),
    say('paine', 'Holy Water lifts a curse.', { auto: 1300 }),
  ],
  // The Guardian Beast's first Damocles Photon: half of everyone's maximum HP at once.
  [FIRST_DAMOCLES_PHOTON]: [
    say('rikku-x2', 'Half my life! Everyone’s!', { auto: 1400 }),
    say('paine', 'Shell halves it. Heal all three.', { auto: 1400 }),
  ],
  // YSLS-Zero's first Blast Punch: half of one girl's maximum HP, and it delays her. Its damage flags are 0: neither Protect nor Shell reduces it (the row), so the words do not send the player to either.
  [FIRST_BLAST_PUNCH]: [
    say('yuna-x2', 'That was half of me in one punch!', { auto: 1400 }),
    say('paine', 'No armour stops that one. Keep healing.', { auto: 1500 }),
  ],
};

/** The chapter's story layer: the Floating Ruins and the spider, three seams, five callouts, and the close. */
export const ffx2GullwingsCh1Scripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
