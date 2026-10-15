/**
 * Biran and Yenke, the gate of Mt. Gagazet (FFX): the story layer of our hidden chapter. **FFX only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-15: "Implement the unimplemented chapters please." and "Implement the unimplemented chapters end-to-end please. It needs to be a finished product." The writing
 * follows the writing bible's FFX voice (`research/writing-bible.md` §1.7 for Kimahri: three to eight words, third person, concrete nouns, he speaks after a silence and one to
 * three times a scene; §2.1: one thought a line, understate for three or four lines, then one unguarded line, then cut). Biran and Yenke speak short and blunt, and call him
 * hornless, as the sources describe them (`research/ffx-biran-yenke.md` §1 and §7); no portrait of either exists, so their box shows the name plate and the role chip "Ronso".
 *
 * The beats are the research's (§1, `[search: 2 sources]`), in our own words:
 *
 * 1. **pre**: the gate, the elders letting Yuna pass, the two who have not moved, the old quarrel (Biran broke Kimahri's horn), Yuna's worry, Kimahri staying behind alone.
 * 2. **mid-battle callouts**: Kimahri on the first Bulldoze (they stand apart: the lesson of the guarding, §4.4; the fight's first Bulldoze is always Biran's, pinned by
 *    `tests/unit/chapters/biran-yenke-rules.test.ts`); Biran's Mighty Guard and Yenke's White Wind (the two Rages Lancet can take only after their use, §4.2, §4.5); each Ronso's answer to
 *    the other's fall (§4.3), keyed on the answer (Biran's Berserk, Yenke's Haste) so that only the one left standing ever speaks. Non-party voices always speak in a callout; Kimahri is
 *    the only member fielded.
 * 3. **post**: they accept the defeat with honour, and the Ronso will hold the gate behind the summoner (§1 beat 4).
 *
 * **Every line is ours**: no line of the game's dialogue is quoted (no transcript is in the repo and none is needed). Victory quips are suppressed: the post scene closes the duel.
 *
 * **Music** (rule 13: existing cues only): `scene-gagazet` under the scenes and the fight alike, as the game plays the mountain's own theme through the duel (§8); the post scene
 * opens in silence. Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, say, shake, wait } from '../dsl.ts';

/** Combatant and ability ids, mirrored from `src/data/ffx/biran-yenke-ids.ts` (the story layer does not reach into the data layer; the chapter's story test pins that they agree). */
export const BIRAN = 'biran-ronso';
export const YENKE = 'yenke-ronso';
export const BULLDOZE = 'ronso-bulldoze';
export const MIGHTY_GUARD = 'biran-mighty-guard';
export const MIGHTY_GUARD_SELF = 'biran-mighty-guard-self';
export const WHITE_WIND = 'yenke-white-wind';
export const WHITE_WIND_SELF = 'yenke-white-wind-self';
export const BERSERK = 'biran-berserk';
export const HASTE = 'haste';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-gagazet', 1400),
  camera('idle', 0),
  fade('clear', 1200),
  wait(500),
  say('none', 'The gate of Mt. Gagazet. Snow on the wind, and Ronso on every ledge.'), // ours: the place (§1 beat 1)
  say('none', 'The elders have let the summoner pass. Two Ronso have not moved.'), // ours: Kelk's leave given; Biran and Yenke stay (§1 beats 1, 2)
  say('biran', 'The summoner may climb. Not you, hornless.'), // ours: the old quarrel (§1 beat 2)
  say('yenke', 'The hornless one comes home. The mountain did not ask.'), // ours
  say('yuna', 'Kimahri...'), // ours: her worry, one word
  beat(1500),
  say('kimahri', 'Yuna goes on. Kimahri stays.'), // ours: after the silence (writing bible §1.7)
  say('biran', 'Two Ronso. One Kimahri. Good.'), // ours
  say('yenke', 'Show the mountain what is left of you.'), // ours
  shake(6, 360),
  beat(1100),
  say('kimahri', 'Kimahri answers alone.'), // ours: the go-line, the shortest (writing bible §2.1)
  battleStart(),
];

// --------------------------------------------------------------------------- mid

const FIRST_BULLDOZE = 'ronso-first-bulldoze';
const GUARD_RAISED = 'biran-mighty-guard-raised';
const GUARD_RAISED_ALONE = 'biran-mighty-guard-raised-alone';
const WIND_CALLED = 'yenke-white-wind-called';
const WIND_CALLED_ALONE = 'yenke-white-wind-called-alone';
const BIRAN_BERSERKS = 'biran-berserks';
const YENKE_HASTES = 'yenke-hastes';

const MID: MidBattleTrigger[] = [
  { id: FIRST_BULLDOZE, when: { type: 'ability-used', who: BIRAN, ability: BULLDOZE }, once: true, script: FIRST_BULLDOZE },
  { id: GUARD_RAISED, when: { type: 'ability-used', who: BIRAN, ability: MIGHTY_GUARD }, once: true, script: GUARD_RAISED },
  { id: GUARD_RAISED_ALONE, when: { type: 'ability-used', who: BIRAN, ability: MIGHTY_GUARD_SELF }, once: true, script: GUARD_RAISED_ALONE },
  { id: WIND_CALLED, when: { type: 'ability-used', who: YENKE, ability: WHITE_WIND }, once: true, script: WIND_CALLED },
  { id: WIND_CALLED_ALONE, when: { type: 'ability-used', who: YENKE, ability: WHITE_WIND_SELF }, once: true, script: WIND_CALLED_ALONE },
  // The answer to a fall, not the fall itself: a `ko` trigger would fire on the second fall too, and a fallen Ronso would speak. Only the one left standing casts these (§4.3).
  { id: BIRAN_BERSERKS, when: { type: 'ability-used', who: BIRAN, ability: BERSERK }, once: true, script: BIRAN_BERSERKS },
  { id: YENKE_HASTES, when: { type: 'ability-used', who: YENKE, ability: HASTE }, once: true, script: YENKE_HASTES },
];

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The first Bulldoze carries Biran away from Yenke: the guarding is broken (§4.4). Kimahri sees the opening.
  [FIRST_BULLDOZE]: [say('kimahri', 'Apart now. Good.', { auto: 1300 })],
  // Mighty Guard, once, below a quarter (§4.2): from now on Lancet can take it (§4.5).
  [GUARD_RAISED]: [say('biran', 'Ronso guard, hornless. Take it if you can.', { auto: 1900 })],
  [GUARD_RAISED_ALONE]: [say('biran', 'Ronso guard, hornless. Take it if you can.', { auto: 1900 })],
  // White Wind, once, below a quarter.
  [WIND_CALLED]: [say('yenke', 'The wind answers Ronso. Not you.', { auto: 1600 })],
  [WIND_CALLED_ALONE]: [say('yenke', 'The wind answers Ronso. Not you.', { auto: 1600 })],
  // The partner's fall (§4.3), answered on the survivor's next turn: Biran's Berserk, Yenke's Haste.
  [BIRAN_BERSERKS]: [say('biran', 'Yenke!', { auto: 900 }), say('biran', 'Now Biran stops holding back.', { auto: 1600 })],
  [YENKE_HASTES]: [say('yenke', 'Biran... then Yenke ends it fast.', { auto: 1700 })],
};

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The two Ronso lower their hands. The snow keeps falling.', { auto: 2000 }), // ours: they accept it (§1 beat 4)
  say('biran', 'Enough. The mountain has seen it.', { auto: 1600 }), // ours
  say('yenke', 'Kimahri fights like a Ronso.', { auto: 1500 }), // ours
  beat(900),
  say('yenke', 'A whole one.', { auto: 1300 }), // ours: the one unguarded line, the shortest (writing bible §2.1)
  say('kimahri', 'Kimahri climbs now.', { auto: 1300 }), // ours
  say('biran', 'Go. The Ronso hold the gate behind you.', { auto: 1900 }), // ours: the oath to guard the gate (§1 beat 4)
  wait(900),
];

/** The chapter's story layer: the gate, the duel's callouts, and the oath at the close. */
export const biranYenkeScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
