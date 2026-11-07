/**
 * The Youth League Tournament (Mushroom Rock Road, Chapter 5: seven fights in a row): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15, Fallen Maesters FM6 and Farplane Cup precedent).** The chapter is hidden behind a typed word, so nothing here is on the board; the words are the release
 * driver's, written under Bailey's blanket yes of 2026-11-06, and every line is ours. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter,
 * Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore).
 *
 * The beats are the research's (`research/re-ffx2-youth-league-tournament.md` §2, §5, §8): a bracket of seven bouts down the road, Yaibal first, Elma and Lucil at the end; Yaibal looks after Yuna (the script says so);
 * the last three bouts have only talk between them; a loss anywhere sends the party back to the start of the road, and the tournament is over when Lucil falls. **The game's dialogue is not in the files and is not quoted.**
 *
 * 1. **pre**: the road, the banners, the bracket, the first opponent.
 * 2. **six barks** (a bark is a mid-battle script that plays at an act's fall: the last of its fighters going down), one after each of acts 1 to 6, each a short interrupt with the player's hands off. The party is carried
 *    whole from act to act (pick YL3), so the bracket does NOT mend anyone, and the first barks say so.
 * 3. **mid-battle callouts** (three, each a short interrupt): Yaibal's first Phoenix Down (he looks after Yuna), Elma's guard on her line, Lucil's first Harbinger.
 * 4. **post**: Lucil falls; the closing speech; one short sincere exchange; the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits; the narration is a stage direction in the box with no name plate (`'none'`) and
 * is the only voice the League has (the three named fighters have no speaker portrait yet: preflight YL10). **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2
 * chapters' bed; each fight is the formation's cue (`data/ffx2/enemies/youth-league.ts`, `boss-ffx2-fallen-aeons`, a flagged stand-in). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { ACT_ENEMY_IDS, X2_ELMA_ID, X2_LUCIL_ID, X2_YAIBAL_ID, YL_SEAM_IDS } from '../../data/youth-league-ids.ts';
import { YL_ABILITY } from '../../data/ffx2/enemies/youth-league-abilities-base.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Mushroom Rock Road, banners on the cliff, and a bracket chalked on a board by the gate.'), // ours: the place
  say('none', 'Seven bouts in all, and a young man with a sword who wants to start the first.'), // ours: the bracket (RE §0: seven fights)
  say('rikku-x2', 'A tournament! With bunting! We are so winning this.'), // ours: Rikku sets up
  say('yuna-x2', 'It is for the Youth League, Rikku. We are guests.'), // ours: Yuna reacts
  say('paine', 'Guests who are in the bracket.'), // ours: Paine kills it
  shake(5, 360),
  say('none', 'Yaibal brings the sword up with both hands and grins. Two recruits step in beside him.'), // ours: act 1 (Yaibal with two Warriors)
  say('rikku-x2', 'He looks nice. Is he nice?'), // ours
  say('paine', 'Nice people hit too.'), // ours
  beat(500),
  say('yuna-x2', 'Together. And watch your potions: nobody refills them.'), // ours: the bracket does not mend anyone (pick YL3)
  battleStart(),
];

// --------------------------------------------------------------------------- barks

/** Act 1 to act 2. Hands off, short: the bracket is unbroken (YL3), so the line says nobody is mended. */
const BARK_1: StoryScript = [
  say('none', 'Yaibal bows and steps off the sand. Two mages and a veteran file in, chanting.', { auto: 2100 }), // ours: act 1 falls; act 2 (two Mages and a Veteran)
  say('rikku-x2', 'Do we get a heal?', { auto: 900 }), // ours
  say('paine', 'No.', { auto: 600 }), // ours: nothing is mended between the bouts
];

const BARK_2: StoryScript = [
  say('none', 'The mages bow, a little shakily. The veteran does not.', { auto: 1600 }), // ours: act 2 falls
  say('yuna-x2', 'Still standing. Everyone count.', { auto: 1200 }), // ours
  say('none', 'A warrior and two veterans take the sand.', { auto: 1400 }), // ours: act 3
];

const BARK_3: StoryScript = [
  say('none', 'The veterans salute with their blades and leave without being told.', { auto: 1700 }), // ours: act 3 falls
  say('rikku-x2', 'They are so polite!', { auto: 800 }), // ours
  say('none', 'Two slashers and a master, from the quick end of the League.', { auto: 1600 }), // ours: act 4 (two Slashers and a Master)
];

const BARK_4: StoryScript = [
  say('none', 'The master lifts a hand to the crowd. The crowd answers.', { auto: 1600 }), // ours: act 4 falls
  say('paine', 'Four veterans next. Let them come to you.', { auto: 1400 }), // ours: Paine, a hint and no more
  say('none', 'Four of them, shoulder to shoulder.', { auto: 1200 }), // ours: act 5 (four Veterans)
];

const BARK_5: StoryScript = [
  say('none', 'The last veteran sits down on the sand, laughing.', { auto: 1500 }), // ours: act 5 falls
  say('yuna-x2', 'No pause. Here comes the next.', { auto: 1100 }), // ours: the unbroken run
  say('none', 'Elma walks out with two veterans and a sack of grenades.', { auto: 1700 }), // ours: act 6 (Elma 279)
];

const BARK_6: StoryScript = [
  say('none', 'Elma folds her arms, then her hands, then bows. One name is left on the board.', { auto: 1800 }), // ours: act 6 falls
  say('paine', 'Whoever counts to five.', { auto: 800 }), // ours: Lucil's rhythm as a hunch
  say('none', 'Lucil steps out alone and does not hurry.', { auto: 1400 }), // ours: act 7
];

// --------------------------------------------------------------------------- mid

const FIRST_PHOENIX = 'first-phoenix-down';
const FIRST_GUARD = 'first-guard';
const FIRST_HARBINGER = 'first-harbinger';

/** The act's last fighter: the one whose fall ends the act (all fighters down). The six barks fire on the KO of the act's whole line. */
const actFallen = (act: number): MidBattleTrigger['when'] => ({ type: 'all-ko', ids: [...ACT_ENEMY_IDS[act]!] });

const MID: MidBattleTrigger[] = [
  { id: FIRST_PHOENIX, when: { type: 'ability-used', who: X2_YAIBAL_ID, ability: YL_ABILITY.phoenixDown }, once: true, script: FIRST_PHOENIX },
  { id: YL_SEAM_IDS[0], when: actFallen(0), once: true, script: YL_SEAM_IDS[0] },
  { id: YL_SEAM_IDS[1], when: actFallen(1), once: true, script: YL_SEAM_IDS[1] },
  { id: YL_SEAM_IDS[2], when: actFallen(2), once: true, script: YL_SEAM_IDS[2] },
  { id: YL_SEAM_IDS[3], when: actFallen(3), once: true, script: YL_SEAM_IDS[3] },
  { id: YL_SEAM_IDS[4], when: actFallen(4), once: true, script: YL_SEAM_IDS[4] },
  { id: FIRST_GUARD, when: { type: 'ability-used', who: X2_ELMA_ID, ability: YL_ABILITY.guard }, once: true, script: FIRST_GUARD },
  { id: YL_SEAM_IDS[5], when: actFallen(5), once: true, script: YL_SEAM_IDS[5] },
  { id: FIRST_HARBINGER, when: { type: 'ability-used', who: X2_LUCIL_ID, ability: YL_ABILITY.harbinger }, once: true, script: FIRST_HARBINGER },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'Lucil sets her blade down on the sand and the whole road goes quiet, then loud.', { auto: 2200 }), // ours: Lucil falls; the tournament is over
  flash(200, '#fff3c8'),
  say('none', 'The board by the gate is chalked clean to the last line. The Youth League has had its day.', { auto: 2400 }), // ours: the closing speech, as a stage direction (no quotation)
  say('yuna-x2', 'They fought like people who were glad to be here.', { auto: 2000 }), // ours: the one sincere beat begins (writing bible §2.2: at most three lines)
  say('paine', 'They fought like people who still have a road to hold.', { auto: 1900 }), // ours
  say('yuna-x2', 'Then it was a good day.', { auto: 1300 }), // ours
  beat(700),
  say('rikku-x2', 'Do we get a trophy? A banner? Anything shiny?', { auto: 1700 }), // ours: the joke returns
  say('none', 'Yaibal hands Yuna a potion, a very small one, and runs before anyone can thank him.', { auto: 2400 }), // ours: his care for Yuna, the one thing the script gave him
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [YL_SEAM_IDS[0]]: BARK_1,
  [YL_SEAM_IDS[1]]: BARK_2,
  [YL_SEAM_IDS[2]]: BARK_3,
  [YL_SEAM_IDS[3]]: BARK_4,
  [YL_SEAM_IDS[4]]: BARK_5,
  [YL_SEAM_IDS[5]]: BARK_6,

  // Yaibal's first Phoenix Down: he raises Yuna (RE §5.1: he revives and heals her and does it for no other girl).
  [FIRST_PHOENIX]: [
    say('rikku-x2', 'He just helped Yuna up!', { auto: 1100 }),
    say('paine', 'Only Yuna. Keep that in mind.', { auto: 1400 }),
  ],
  // Elma's first Not-So-Mighty Guard: Shell, Protect and Regen over her whole line.
  [FIRST_GUARD]: [
    say('yuna-x2', 'Her whole line is shielded!', { auto: 1200 }),
    say('paine', 'Strip it, or hit through it.', { auto: 1200 }),
  ],
  // Lucil's first Harbinger: damage and Doom on one girl.
  [FIRST_HARBINGER]: [
    say('rikku-x2', 'That felt like a countdown!', { auto: 1200 }),
    say('paine', 'It is. Fifth beat. Finish her, or raise her.', { auto: 1500 }),
  ],
};

/** The chapter's story layer: the road and the bracket, six barks, three callouts and the close. */
export const ffx2YouthLeagueScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
