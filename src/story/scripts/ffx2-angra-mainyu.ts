/**
 * Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-15: "Implement the unimplemented chapters please." and "Implement the unimplemented chapters end-to-end please. It needs to be a finished product." The writing follows the
 * writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to
 * one short exchange, which the jokes then restore).
 *
 * The beats are the research's (`research/ffx2-angra-mainyu.md` §1, `[search: 2 to 3 sources]`), in our own words:
 *
 * 1. **pre**: the dig, the sandstorm over the Cactuar Nation calmed by the ten Gatekeepers, the fiend driven out of it and turning on the camp, the girls knowing it from the dig sites (it threw them out
 *    there), its two arms, Yuna's go-call to hold the camp.
 * 2. **mid-battle callouts** (two short interrupts): the first Perdition's Flame (it needs both arms: the lesson, §4.1) and the first Full-Life on an arm (the arms come back, §3.1).
 * 3. **post**: the fiend sinks into the sand with its arms, the camp is safe; one short sincere beat, the joke restored; the Ribbon it leaves (its drop, §2.1).
 *
 * **Every line is ours**: no line of the game's dialogue is quoted (no transcript is in the repo and none is needed). Nhadala and the camp's diggers are named by the sources and not staged (no
 * portrait of hers exists in the approved set). **Speakers**: the girls with their approved FFX-2 portraits (`yuna-x2`, `rikku-x2`, `paine`); the narration is a stage direction with no name plate.
 *
 * **Music** (rule 13: existing cues only): the FFX-2 field bed under the scenes; the fight is the formation's cue, `boss-ffx2-fallen-aeons` (research §8). The post scene opens in silence.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, music, results, say, shake, wait } from '../dsl.ts';
import { ANGRA_ABILITY, ANGRA_ID } from '../../data/angra-mainyu-ids.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'The Bikanel Desert. Over the Cactuar Nation, the sandstorm has finally died.'), // ours: the ten Gatekeepers found (research §1 beat 2)
  say('rikku-x2', 'Ten little Gatekeepers, one big calm. Go, cactuars!'), // ours: Rikku sets up
  say('paine', 'Calm for them.'), // ours: Paine kills it
  shake(10, 500),
  say('none', 'Whatever the storm was hiding has been driven out of it, and it is crossing the dunes toward the dig.'), // ours: it turns on the camp (§1 beat 3)
  say('yuna-x2', 'That is the thing from the dig sites. The one that kept throwing us out.'), // ours: the earlier encounters (§1 beat 1)
  say('rikku-x2', 'And it brought friends. Two of them. Attached.'), // ours: the two arms
  say('paine', 'Arms. With minds of their own.'), // ours
  beat(700),
  say('yuna-x2', 'The diggers are still in the camp. We hold it here.'), // ours: the go-call
  say('paine', 'Then we hold it.'), // ours
  battleStart(),
];

// --------------------------------------------------------------------------- mid

/** The first Perdition's Flame: fire from everywhere, and only while both arms stand. */
const FIRST_FLAME = 'first-perditions-flame';
/** The first arm raised by Full-Life. */
const FIRST_REVIVE = 'first-arm-revived';

const MID: MidBattleTrigger[] = [
  { id: FIRST_FLAME, when: { type: 'ability-used', who: ANGRA_ID, ability: ANGRA_ABILITY.perditionsFlame }, once: true, script: FIRST_FLAME },
  { id: FIRST_REVIVE, when: { type: 'ability-used', who: ANGRA_ID, ability: ANGRA_ABILITY.fullLife }, once: true, script: FIRST_REVIVE },
];

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The Flame needs both arms (research §4.1): Rikku reacts, Paine names the answer without naming the button.
  [FIRST_FLAME]: [
    say('rikku-x2', 'Fire from everywhere! Who aimed that?!', { auto: 1500 }),
    say('paine', 'Both arms were up. Keep them down.', { auto: 1500 }),
  ],
  // An arm comes back (§3.1): Yuna sees it, Paine shrugs it off.
  [FIRST_REVIVE]: [
    say('yuna-x2', 'It brought the arm back!', { auto: 1300 }),
    say('paine', 'Then we cut it down again.', { auto: 1400 }),
  ],
};

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The fiend sinks into the sand, and its arms go down with it.', { auto: 1900 }), // ours
  say('rikku-x2', 'Nhadala owes us so much digging time for this.', { auto: 1700 }), // ours: Rikku sets up
  say('yuna-x2', 'The camp is safe. That is enough for me.', { auto: 1600 }), // ours: the one sincere beat (writing bible §2.2)
  say('paine', 'For now.', { auto: 900 }), // ours: Paine closes it
  beat(600),
  say('rikku-x2', 'Ooh, it left something shiny behind. A ribbon?', { auto: 1700 }), // ours: the Ribbon it drops (research §2.1)
  say('paine', 'Wear it, then.', { auto: 1000 }), // ours: the joke returns
  wait(900),
];

/** The chapter's story layer: the calmed storm, the fiend at the camp, two callouts, and the close. */
export const ffx2AngraMainyuScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
