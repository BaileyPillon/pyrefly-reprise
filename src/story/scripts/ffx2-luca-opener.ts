/**
 * The Luca Opener (Logos and Ormi, then Leblanc, on the docks of Luca; FFX-2's Chapter 1): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15 precedent; the Maesters' FM6, the Bevelle Guardians' BG14).** The chapter is hidden behind a typed word, so nothing here is on the board; the words are the
 * chapter lane's, written under Bailey's blanket yes of 2026-11-06, and every line is ours. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter,
 * Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore). The Syndicate is the comic relief of the whole game (the bible's Leblanc, Logos and
 * Ormi lines): Ormi is large and earnest, Logos is dry, Leblanc is imperious.
 *
 * The beats are the sources': the girls leave the concert at Luca and are met on the docks by the Leblanc Syndicate, Logos and Ormi first; Rikku steals from both; after them Yuna gets the Songstress dressphere back, and
 * Leblanc, in Yuna's own gown, is next (`research/re-ffx2-luca-opener.md` section 2, Jegged's "Luca" page). The game's dialogue is not in the files and is not quoted. Nothing here claims Leblanc's name for the singer of
 * the concert: the concert fight (the look-alike) is not built (LO1), so the pre scene says only that someone has been wearing Yuna's gown.
 *
 * 1. **pre**: the quay, the two men, the first fight.
 * 2. **one seam** (a mid-battle script that plays at act 1's fall, the `all-ko` of Logos and Ormi): the sphere comes back to Yuna and its light closes the scrapes (no Save Sphere card plays between the acts, so the line says why the
 *    girls are whole again), the Songstress, Leblanc steps out. About 14 seconds with the player's hands off.
 * 3. **mid-battle callouts** (three, each a short interrupt): Logos' one Potion, Ormi's first shield throw, Leblanc's first Thunder.
 * 4. **post**: Leblanc's fall; the results first; one sincere exchange; the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits, the Syndicate with theirs; the narration is a stage direction in the box with no
 * name plate (`'none'`). **Music** (rule 13: nothing new, existing cues): the field bed is `scene-chateau-leblanc` (the Syndicate's), each fight is the chapter record's `boss-leblanc`, both flagged stand-ins, Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, music, results, say, shake, wait } from '../dsl.ts';
import { LUCA_ACT_1_IDS, LUCA_POTION_TRIGGER, LUCA_SEAM_1, LUCA_SHIELD_TRIGGER, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID } from '../../data/luca-opener-ids.ts';
import { LUCA_LEBLANC_THUNDER_ID, LUCA_LOGOS_POTION_ID, LUCA_ORMI_PITCH_ID } from '../../data/ffx2/enemies/luca-opener-abilities.ts';

/** The callout of Leblanc's first Thunder: its trigger id (an `ability-used` condition, so the engine fires it; no AI emits it). */
export const LUCA_THUNDER_TRIGGER = 'luca-leblanc-thunder';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-chateau-leblanc', 1400),
  say('none', 'Luca, the third harbour. Crates, gulls, and two men in Syndicate coats standing on the quay.'), // ours: the place and the first fight's pair
  say('rikku-x2', 'The concert was the hard part. Why are they still here?'), // ours: Rikku sets up
  say('yuna-x2', 'I think they want a word about the dress.'), // ours: Yuna reacts; someone has been wearing hers
  say('paine', 'Two of them. Three of us.'), // ours: Paine kills it
  shake(5, 360),
  say('ormi', 'The boss says this is her harbour.'), // ours: Ormi, large and earnest
  say('logos', 'And that you owe her a gown. Naturally.'), // ours: Logos, dry
  say('none', 'The big one lifts a shield. The thin one lifts a pistol.'), // ours: the two kits
  say('rikku-x2', 'Steal first! Apologise never!'), // ours
  beat(500),
  say('yuna-x2', 'Together. And nobody gets hurt.'), // ours
  battleStart(),
];

// --------------------------------------------------------------------------- seam

/**
 * The seam from Logos and Ormi to Leblanc: act 1's fall. Authored as a hands-off beat; every `say` carries its own `auto`. About 14 seconds.
 * The Songstress comes back to Yuna here (the sources: she "gets the Songstress dressphere back" after this fight), and the sphere's light is the reason the girls are whole again.
 */
const SEAM_1: StoryScript = [
  say('none', 'The shield rolls to a stop. A sphere slips from the crates into Yuna’s hand, and its light closes every scrape.', { auto: 2600 }), // ours: both fall; the Songstress returns; why the girls are whole again
  say('yuna-x2', 'My old dress. It came back.', { auto: 1300 }), // ours: Yuna reacts
  say('none', 'A third figure steps onto the quay, in a gown Yuna knows very well.', { auto: 2000 }), // ours: Leblanc, in Yuna's gown
  say('leblanc', 'Do admire it. I have had so much practice.', { auto: 1800 }), // ours: imperious
  say('paine', 'Same gown. Smaller stage.', { auto: 1300 }), // ours: Paine kills it
];

// --------------------------------------------------------------------------- mid

const MID: MidBattleTrigger[] = [
  { id: LUCA_POTION_TRIGGER, when: { type: 'ability-used', who: X2_LUCA_LOGOS_ID, ability: LUCA_LOGOS_POTION_ID }, once: true, script: LUCA_POTION_TRIGGER },
  { id: LUCA_SHIELD_TRIGGER, when: { type: 'ability-used', who: X2_LUCA_ORMI_ID, ability: LUCA_ORMI_PITCH_ID }, once: true, script: LUCA_SHIELD_TRIGGER },
  { id: LUCA_SEAM_1, when: { type: 'all-ko', ids: [...LUCA_ACT_1_IDS] }, once: true, script: LUCA_SEAM_1 },
  { id: LUCA_THUNDER_TRIGGER, when: { type: 'ability-used', who: X2_LUCA_LEBLANC_ID, ability: LUCA_LEBLANC_THUNDER_ID }, once: true, script: LUCA_THUNDER_TRIGGER },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'Leblanc sits down on a crate with great dignity and no breath at all.', { auto: 2000 }), // ours: she falls, with dignity
  say('leblanc', 'That is the last time I share a harbour with a choir.', { auto: 2100 }), // ours: imperious
  say('yuna-x2', 'We only wanted to sing.', { auto: 1400 }), // ours: the one sincere beat
  say('paine', 'So did she.', { auto: 1100 }), // ours: rationed sincerity (writing bible §2.2: at most three lines)
  beat(700),
  say('rikku-x2', 'Two harbour fights and not one apology. Best day ever.', { auto: 2400 }), // ours: the joke returns
  say('none', 'Out past the breakwater, the gulls go back to arguing about fish.', { auto: 1800 }), // ours: the tease: nothing here is the end of anything
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [LUCA_SEAM_1]: SEAM_1,

  // Logos' one Potion: Ormi is nearly gone, and the thin one throws him the one mend he has.
  [LUCA_POTION_TRIGGER]: [
    say('rikku-x2', 'He is healing the wall!', { auto: 1200 }),
    say('paine', 'He has one Potion. Make it not matter.', { auto: 1500 }),
  ],
  // Ormi's first shield throw: it goes at whoever stands farthest back.
  [LUCA_SHIELD_TRIGGER]: [
    say('paine', 'The shield goes for whoever stands farthest.', { auto: 1500 }),
    say('rikku-x2', 'Hey! I like it here!', { auto: 1000 }),
  ],
  // Leblanc's first Thunder: the fourth blow, at whoever has the most life.
  [LUCA_THUNDER_TRIGGER]: [
    say('rikku-x2', 'Three swings and a spell!', { auto: 1100 }),
    say('paine', 'It goes for whoever has most life. Count it.', { auto: 1600 }),
  ],
};

/** The chapter's story layer: the quay and the first fight, one seam, three callouts, and the close. */
export const ffx2LucaOpenerScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
