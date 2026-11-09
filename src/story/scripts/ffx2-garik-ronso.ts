/**
 * Garik Ronso and the Ronso Youths at the top of Mt. Gagazet (FFX-2 Chapter 3, the mission "Battle Blockade"): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT FOR BAILEY TO READ before it ships.** Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06), "yes on all these too" and 2026-11-07 "ok keep going we have
 * full usage here". The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity
 * rationed to one short exchange, which the jokes then restore).
 *
 * The beats are the research's (`research/re-ffx2-garik-ronso.md` section 4, Jegged's Chapter 3 page: Garik has disabled the teleporters that would warp the party to the summit, so it climbs on foot; the fight starts shortly
 * after the cave; the mountain's Ronso remember how they were treated), in our own words:
 *
 * 1. **pre**: the summit, the lance across the path, Garik with the Youths of his clan, Yuna's plea, Paine's flat read.
 * 2. **mid-battle callouts** (each a short interrupt, once): **one per fight**, which is where the two outcomes' tones are told, because the story registry reads one static script per chapter: the hostile fight's first Mighty
 *    Guard (the whole side lights up) and first Bane Lance (the curse that keeps a Black Mage in her dress), the friendly bout's first Protect (he guards only himself: a bout, not a battle).
 * 3. **post**: the lance comes down, the teleporters will open, one short sincere exchange, and the joke restored. It reads true after either fight.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here (no transcript is in the repo and none is needed). Nothing is claimed that the research does not say.
 *
 * **Speakers.** The girls speak with their approved FFX-2 portraits (`yuna-x2`, `rikku-x2`, `paine`); Garik has no portrait and no speaker id, so his part is narration, a stage direction in the box with no name plate (`'none'`), as
 * Valefor's chapter does for its unnamed voices.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed; the fight is the formation's cue, `boss-ffx2-fallen-aeons` (`data/ffx2/enemies/garik-ronso.ts`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { GARIK_BANE_LANCE_ID, GARIK_MIGHTY_GUARD_ID, GARIK_PROTECT_ID } from '../../data/ffx2/enemies/garik-ronso-abilities.ts';
import { X2_GARIK_BOUT_ID, X2_GARIK_ID } from '../../data/garik-ronso-ids.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'The top of Mt. Gagazet. The wind drives the snow flat, and a lance lies across the only path.'), // ours: the place and the blockade (Jegged's mission, "Battle Blockade")
  say('rikku-x2', 'So that is who shut the teleporters.'), // ours: Rikku sets up
  say('none', 'Garik Ronso stands behind it, with the Youths of his clan at his shoulders.'), // ours
  say('yuna-x2', 'We only want to pass, Garik. No one here is your enemy.'), // ours: Yuna's plea
  shake(6, 360),
  flash(200, '#dbe9ff'),
  say('none', 'He says the mountain remembers how everyone has spoken to it, and that he will see for himself.'), // ours: the trust, as a line
  say('paine', 'He wants a fight.'), // ours: Paine kills it
  say('rikku-x2', 'He wants a conversation with a lance in it.'), // ours
  beat(700),
  say('yuna-x2', 'Then we answer him the only way he will hear.'), // ours: the go-call
  battleStart(),
];

// --------------------------------------------------------------------------- mid

/** The hostile fight's first Mighty Guard: his whole side lights up. */
const FIRST_GUARD = 'first-mighty-guard';
/** The hostile fight's first Bane Lance: the curse. */
const FIRST_LANCE = 'first-bane-lance';
/** The friendly bout's first Protect: he guards only himself. */
const FIRST_PROTECT = 'first-bout-protect';

const MID: MidBattleTrigger[] = [
  {
    id: FIRST_GUARD,
    when: { type: 'ability-used', who: X2_GARIK_ID, ability: GARIK_MIGHTY_GUARD_ID },
    once: true,
    script: FIRST_GUARD,
  },
  {
    id: FIRST_LANCE,
    when: { type: 'ability-used', who: X2_GARIK_ID, ability: GARIK_BANE_LANCE_ID },
    once: true,
    script: FIRST_LANCE,
  },
  {
    id: FIRST_PROTECT,
    when: { type: 'ability-used', who: X2_GARIK_BOUT_ID, ability: GARIK_PROTECT_ID },
    once: true,
    script: FIRST_PROTECT,
  },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'Garik lowers his lance. The wind drops, as if the mountain had been holding its breath.', { auto: 2000 }), // ours
  say('yuna-x2', 'Thank you for hearing us out.', { auto: 1300 }), // ours: the one sincere beat (writing bible §2.2: at most four lines)
  say('none', 'He tells them the teleporters will open again, and that the Ronso will remember them.', { auto: 2000 }), // ours
  say('paine', 'That went better than some of our conversations.', { auto: 1500 }), // ours: Paine closes the beat
  beat(700),
  say('rikku-x2', 'Did anybody else get frostbite? Or is it only me?', { auto: 1800 }), // ours: the joke returns
  say('paine', 'Only you.', { auto: 900 }), // ours: Paine kills it
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The hostile fight's first Mighty Guard: all of them at once. Rikku sets up, Paine names the answer without naming the button.
  [FIRST_GUARD]: [
    say('rikku-x2', 'Shell, Protect, Haste, everything, on all of them!', { auto: 1500 }),
    say('paine', 'Then we take them down one at a time.', { auto: 1200 }),
  ],
  // The first Bane Lance: a curse on whoever wears Black Mage. Yuna reacts, Paine says what it means.
  [FIRST_LANCE]: [
    say('yuna-x2', 'A curse! She cannot change her dress now!', { auto: 1400 }),
    say('paine', 'Then she stays as she is. No more Black Mage.', { auto: 1300 }),
  ],
  // The friendly bout's first Protect: he guards himself, and nobody else. A bout, not a battle.
  [FIRST_PROTECT]: [
    say('rikku-x2', 'He is only guarding himself. He is holding back!', { auto: 1500 }),
    say('yuna-x2', 'He is testing us, not hurting us.', { auto: 1200 }),
  ],
};

/** The chapter's story layer: the summit and the lance, the callouts of either fight, and the close. */
export const ffx2GarikRonsoScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
