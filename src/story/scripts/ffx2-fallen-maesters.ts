/**
 * The Fallen Maesters (the Via Infinito, floors 20, 40, 60 and 80): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (FM6: "drafting delegatable, shipping needs Bailey's read", the Gippal GP15 precedent).** The chapter is hidden behind a typed word, so nothing here is on the board; the
 * words are the release driver's, written under Bailey's blanket yes of 2026-11-02, and every line is ours. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the
 * three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore).
 *
 * The beats are the sources' (`research/ffx2-trema.md` §1.1 and §1.2, `[verified: 3 sources]` for the dungeon and `[wiki, single source]` for who each fiend was): the Via Infinito is the optional dungeon under Bevelle, a
 * Great Cloister every twenty floors with a boss in it, a blue glyph on every floor that fully heals the party, a hundred floors in all, with Trema and Paragon on the last. Who the four fiends "were" (a Maester of Yevon,
 * a lord of the Guado, a Grand Maester, the first summoner) is the wiki's, and is told **lightly and without names** (FM6's driver pick: the chapter tells the FFX people as a hint, one clause a floor, because the
 * single-source link between the monsters and the people is not Square Enix's own word; the alternative, naming Wen Kinoc, Jyscal Guado, Yo Mika and Yunalesca, is a one-line change per floor for Bailey to take).
 *
 * 1. **pre**: floor 20, the cloister, the glyph, the spider drops.
 * 2. **three seams** (a seam is a mid-battle script that plays at a link's fall: the fiend of floor 20, 40 and 60): the glyph heals the party (no Save Sphere card plays on these floors, so the line says why the girls
 *    are whole again), the next floor, the next fiend. Each is about 8 to 10 seconds with the player's hands off.
 * 3. **mid-battle callouts** (four, each a short interrupt): Aranea's first Gooey End, the Black Elemental's first Magic Up, Concherer's first Megaton Press, Chac's first Stony Glare. Rikku's, Yuna's and Paine's voices,
 *    naming the answer without naming the button.
 * 4. **post**: the last fiend of the four falls; one short sincere exchange (they all came down here wanting something); the joke restored; the hundredth floor is still down there.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits; the narration is a stage direction in the box with no name plate (`'none'`).
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed (and the game's own for the Cloister); each fight is the formation's cue
 * (`data/ffx2/enemies/fallen-maesters.ts`, `boss-ffx2-fallen-aeons`, a flagged stand-in). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { MAESTERS_SEAM_20, MAESTERS_SEAM_40, MAESTERS_SEAM_60, X2_ARANEA_ID, X2_BLACK_ELEMENTAL_ID, X2_CHAC_ID, X2_CONCHERER_ID } from '../../data/fallen-maesters-ids.ts';
import {
  ARANEA_GOOEY_END_ID,
  BLACK_ELEMENTAL_MAGIC_UP_ID,
  CHAC_STONY_GLARE_ID,
  CONCHERER_MEGATON_PRESS_ID,
} from '../../data/ffx2/enemies/fallen-maesters-abilities.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'The Via Infinito, twenty floors down. A round hall, a stair going lower, and a blue glyph humming on the stone.'), // ours: the place (a Great Cloister every twenty floors, a glyph on every floor)
  say('rikku-x2', 'Twenty floors. Only eighty to go. I am not counting.'), // ours: Rikku sets up
  say('yuna-x2', 'You are counting.'), // ours: Yuna reacts
  say('paine', 'Something else is.'), // ours: Paine kills it
  shake(6, 400),
  say('none', 'A spider drops from the vault and does not hurry.'), // ours: the first fiend
  say('none', 'Whoever it was, a Maester of Yevon went down these stairs once and kept going.'), // ours: the wiki-level hint at Wen Kinoc, unnamed
  say('rikku-x2', 'That is a very big spider.'), // ours
  say('paine', 'Then we stop it before the fifth bite.'), // ours: the sourced rhythm, four bites then the cloud, as a hunch
  beat(600),
  say('yuna-x2', 'Everyone stays close. The glyph will mend us after.'), // ours: the glyph heals (sourced)
  battleStart(),
];

// --------------------------------------------------------------------------- seams

/**
 * The seam from floor 20 to floor 40: Aranea's fall. Authored as a hands-off beat; every `say` carries its own `auto`. About 9 seconds.
 */
const SEAM_20: StoryScript = [
  say('none', 'The spider folds up and the hall goes quiet.', { auto: 1400 }), // ours: it falls
  flash(200, '#9fd8ff'),
  say('none', 'The glyph flares blue and closes every wound.', { auto: 1500 }), // ours: the glyph heals the party (the girls are whole again; no Save Sphere card plays on these floors)
  say('rikku-x2', 'Free refills! Twenty more floors?', { auto: 1300 }), // ours: Rikku sets up
  say('paine', 'Twenty more.', { auto: 900 }), // ours: Paine kills it
  say('none', 'Floor forty. Something small and black hangs in the air, shining like a mirror.', { auto: 2100 }), // ours: the Black Elemental and its reflect
  say('none', 'A lord of the Guado walked down here once.', { auto: 1500 }), // ours: the wiki-level hint at Jyscal Guado, unnamed
];

/** The seam from floor 40 to floor 60: the Black Elemental's fall. About 9 seconds. */
const SEAM_40: StoryScript = [
  say('none', 'The black thing breaks like glass and does not leave a mark.', { auto: 1500 }), // ours: it falls
  flash(200, '#9fd8ff'),
  say('none', 'The glyph mends the girls.', { auto: 1100 }), // ours: the glyph heals
  say('yuna-x2', 'It was so small. It almost got us.', { auto: 1400 }), // ours: Yuna reacts
  say('paine', 'Small is not weak.', { auto: 1000 }), // ours: Paine kills it
  say('none', 'Floor sixty. A hermit fiend sits in a shell the size of a house.', { auto: 2000 }), // ours: Concherer
  say('none', 'A Grand Maester came here once, and stayed.', { auto: 1500 }), // ours: the wiki-level hint at Yo Mika, unnamed
];

/** The seam from floor 60 to floor 80: Concherer's fall. About 9 seconds. */
const SEAM_60: StoryScript = [
  say('none', 'The shell cracks open and falls in pieces.', { auto: 1400 }), // ours: it falls
  flash(200, '#9fd8ff'),
  say('none', 'The glyph mends the girls once more.', { auto: 1200 }), // ours: the glyph heals
  say('rikku-x2', 'Two more of these and my legs give out.', { auto: 1500 }), // ours: Rikku sets up (floors 80 and 100 remain)
  say('yuna-x2', 'One. Then the last floor.', { auto: 1200 }), // ours: Yuna counts
  say('none', 'Floor eighty. A basilisk waits on the stair.', { auto: 1600 }), // ours: Chac
  say('none', 'It has the shape of a summoner from a thousand years ago.', { auto: 1700 }), // ours: the wiki-level hint at Lady Yunalesca, unnamed
];

// --------------------------------------------------------------------------- mid

/** The first Gooey End: Aranea's fifth action. */
const FIRST_GOOEY_END = 'first-gooey-end';
/** The first Magic Up: the Black Elemental's third action. */
const FIRST_MAGIC_UP = 'first-magic-up';
/** The first Megaton Press: Concherer's crushing blow. */
const FIRST_MEGATON_PRESS = 'first-megaton-press';
/** The first Stony Glare: Chac turns a girl to stone. */
const FIRST_STONY_GLARE = 'first-stony-glare';

const MID: MidBattleTrigger[] = [
  { id: FIRST_GOOEY_END, when: { type: 'ability-used', who: X2_ARANEA_ID, ability: ARANEA_GOOEY_END_ID }, once: true, script: FIRST_GOOEY_END },
  { id: MAESTERS_SEAM_20, when: { type: 'ko', who: X2_ARANEA_ID }, once: true, script: MAESTERS_SEAM_20 },
  { id: FIRST_MAGIC_UP, when: { type: 'ability-used', who: X2_BLACK_ELEMENTAL_ID, ability: BLACK_ELEMENTAL_MAGIC_UP_ID }, once: true, script: FIRST_MAGIC_UP },
  { id: MAESTERS_SEAM_40, when: { type: 'ko', who: X2_BLACK_ELEMENTAL_ID }, once: true, script: MAESTERS_SEAM_40 },
  { id: FIRST_MEGATON_PRESS, when: { type: 'ability-used', who: X2_CONCHERER_ID, ability: CONCHERER_MEGATON_PRESS_ID }, once: true, script: FIRST_MEGATON_PRESS },
  { id: MAESTERS_SEAM_60, when: { type: 'ko', who: X2_CONCHERER_ID }, once: true, script: MAESTERS_SEAM_60 },
  { id: FIRST_STONY_GLARE, when: { type: 'ability-used', who: X2_CHAC_ID, ability: CHAC_STONY_GLARE_ID }, once: true, script: FIRST_STONY_GLARE },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The basilisk turns to stone, and the stone to dust.', { auto: 1800 }), // ours: Chac falls
  say('yuna-x2', 'She looked like someone I once had to refuse.', { auto: 2000 }), // ours: Yuna, the one hint at the first summoner (FFX Chapter 2's Yunalesca), unnamed
  say('paine', 'They all came down here wanting something.', { auto: 1900 }), // ours: the one sincere beat begins (writing bible §2.2: at most four lines)
  say('yuna-x2', 'And never found it.', { auto: 1200 }), // ours
  say('paine', 'So we keep it short.', { auto: 1300 }), // ours
  beat(700),
  say('rikku-x2', 'Great. That was eighty floors. We have twenty left.', { auto: 2000 }), // ours: the joke returns
  say('none', 'Far below, the hundredth floor is still waiting.', { auto: 1800 }), // ours: the tease at Cloister 100 (Paragon, then Trema: Chapter XIII)
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [MAESTERS_SEAM_20]: SEAM_20,
  [MAESTERS_SEAM_40]: SEAM_40,
  [MAESTERS_SEAM_60]: SEAM_60,

  // Aranea's first Gooey End: Poison, Stop, and a drop in strength and magic. Rikku sets up, Paine counts.
  [FIRST_GOOEY_END]: [
    say('rikku-x2', 'Poison, and I cannot move!', { auto: 1400 }),
    say('paine', 'Four bites, then the cloud. Count.', { auto: 1400 }),
  ],
  // The Black Elemental's first Magic Up: it grows stronger every third action.
  [FIRST_MAGIC_UP]: [
    say('yuna-x2', 'It is getting stronger!', { auto: 1200 }),
    say('paine', 'Then be quick.', { auto: 1100 }),
  ],
  // Concherer's first Megaton Press: one blow that ignores armour.
  [FIRST_MEGATON_PRESS]: [
    say('rikku-x2', 'That one ignores armor!', { auto: 1200 }),
    say('paine', 'Crack the shell. Break the limit first.', { auto: 1500 }), // ours: the how (Break Damage Limit, The End's gates; the review of ch-maesters, major 1): the party does not start with the limit broken
  ],
  // Chac's first Stony Glare: a girl turns to stone, and a blow on stone destroys her.
  [FIRST_STONY_GLARE]: [
    say('yuna-x2', 'She is turning us to stone!', { auto: 1300 }),
    say('paine', 'Do not let anyone hit the stone.', { auto: 1400 }),
  ],
};

/** The chapter's story layer: the cloister and the spider, three seams, four callouts, and the close. */
export const ffx2FallenMaestersScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
