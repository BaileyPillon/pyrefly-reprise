/**
 * Chapter XV — the Den of Woe, the three shades (FFX-2). Proposed scene tag **E15**. Tonal tier:
 * FFX-2 with the jokes rationed down, the most mournful FFX-2 chapter we have.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. FFX-2 cutscene grammar (writing-bible §2.2):
 * three-beat banter (Rikku sets up, Yuna reacts, Paine ends it), sincerity for one exchange at
 * most. Voices: Yuna §1.14, Rikku §1.15, Paine §1.16; this is Paine's past, so she speaks least
 * and last where the Crimson Squad is concerned.
 *
 * ## Where the lines come from
 *
 * Every line is `docs/plans/gippal-story-draft.md`, numbered there and here, unchanged. The
 * **events** are canon (research `ffx2-gippal-den-of-woe.md` §1.1, §2, §3, §6.2); **the wording
 * is ours**, every line `[ORIGINAL]`: no game line is quoted or reworked. Bailey's picks followed
 * (2026-09-25, "I'll go with all your recommendations", D-148): **GP1 b** the three shades, no
 * duels with the possessed Rikku and Paine; **GP13 a** the shades are silent, the girls carry every
 * line; **GP14 a** Yuna narrates the open; **GP15** the callouts.
 *
 * ## Where each beat fires
 *
 * - **Pre** (lines 1 to 8): Yuna's narration (`narrate`, the Trema precedent), lines 1 and 2 over
 *   black, 3 and 4 as the cave comes up; then the centre of the cave. Then `battleStart()`. The
 *   draft puts lines 3 and 4 over the approved Shuyin portrait; `narrate` carries no portrait, so
 *   they play over the cave (disclosed in the handoff; a `say` with a borrowed portrait would put
 *   Yuna's name over Shuyin's face).
 * - **Entrances**: each shade's first moment on the field is `hp-below` at `fraction: 1` (the
 *   Shuyin precedent: there is no "enters the field" trigger). No results or seam between links
 *   (GP3 a: the chain carries everything).
 * - **Baralai's count at 7** is emitted by his AI the first time, once
 *   (`src/battle/ffx2/ai/den-of-woe.ts`, {@link DEN_OF_WOE_AI_TRIGGERS}).
 * - **Gippal below a third** is `hp-below` at `1 / 3`; **the first Mortar** and **Lightfall** are
 *   `ability-used`.
 * - **The last shade falls** (Paine's "Enough. Let them rest.") opens the post: Nooj's KO ends the
 *   battle, so it plays as the Den goes quiet, before line 9.
 * - **Post** (lines 9 to 16): out of the Den. The one sincere exchange is lines 12 to 14;
 *   `results()` after line 15, the house pattern.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, narrate, results, say } from '../dsl.ts';

/** Names the Den AI emits (`src/battle/ffx2/ai/den-of-woe.ts` `BARALAI_COUNT_SEVEN`), each with a callout below. */
export const DEN_OF_WOE_AI_TRIGGERS = ['baralai-count-seven'] as const;

/** The combatant and ability ids the triggers name (`src/data/ffx2/enemies/den-of-woe.ts`). */
const BARALAI = 'shade-baralai';
const GIPPAL = 'shade-gippal';
const NOOJ = 'shade-nooj';
const MORTAR = 'x2-den-gippal-mortar';
const LIGHTFALL = 'x2-den-nooj-lightfall';

// --------------------------------------------------------------------------- pre

/** Lines 1 to 8: Yuna's narration, then the centre of the cave. */
const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400), // the record's field bed (placeholder, GP16)
  camera('reveal', 0),
  narrate('Ten old spheres. Paine\'s recordings, every one.'), // 1
  narrate('Together they opened a door in the ravine.'), // 2
  fade('clear', 1100),
  narrate('Inside, the pyreflies remembered someone else.'), // 3
  narrate('A boy, a machine, and a song cut short.'), // 4
  camera('idle', 900),
  beat(900),
  say('paine', 'This place is dangerous. Stay close.'), // 5
  say('rikku-x2', 'Um, the glowy things are staring.'), // 6
  say('yuna-x2', "They're not just pyreflies. They're... feelings."), // 7
  say('paine', 'Theirs. I know those shapes.'), // 8
  battleStart(),
];

// ------------------------------------------------------------------ callouts

/** One callout: a single line under the beat budget (8 s), always auto-advancing. */
function callout(line: ReturnType<typeof say>): StoryScript {
  return [{ ...line, auto: line.auto ?? 1800 }];
}

const MID_SCRIPTS: Record<string, StoryScript> = {
  // Link 1, Baralai (sorrow).
  'baralai-entrance': [
    say('rikku-x2', "That's Baralai! Isn't it...?", { auto: 1600 }), // the draft's "! ...Isn't it?", the ellipsis moved for the house lint
    say('paine', "What's left of him.", { auto: 1600 }),
  ],
  // GP15: his counter at 7, one blow before Drill Shot (research §4.2), once.
  'baralai-count-seven': callout(say('rikku-x2', "He's counting us! One more and—")),
  // Link 2, Gippal (anger). The chain carries everything, no results between (GP3 a).
  'gippal-entrance': [
    say('rikku-x2', "Gippal? He'd never pick a fight with me.", { auto: 1600 }),
    say('paine', 'This one would.', { auto: 1400 }),
  ],
  // GP15: below a third his cycle breaks (research §4.1).
  'gippal-third': callout(say('yuna-x2', "His pattern's gone. Watch everything now!")),
  // GP15 / GP7 a: the first Mortar; nothing is learned, the Gun Mage already has it.
  'gippal-mortar': callout(say('rikku-x2', 'Ooh, Mortar! A Gun Mage could use that.')),
  // Link 3, Nooj (despair).
  'nooj-entrance': [
    say('yuna-x2', 'Nooj too. All three of them.', { auto: 1600 }),
    say('paine', "...Of course. He'd go first.", { auto: 1600 }),
  ],
  // GP15: Lightfall, 5,000 to everyone, once (research §4.3).
  'nooj-lightfall': callout(say('rikku-x2', 'Big light! Big, big light! Hold on!')),
};

const MID: MidBattleTrigger[] = [
  { id: 'baralai-entrance', when: { type: 'hp-below', who: BARALAI, fraction: 1 }, once: true, script: 'baralai-entrance' },
  { id: 'gippal-entrance', when: { type: 'hp-below', who: GIPPAL, fraction: 1 }, once: true, script: 'gippal-entrance' },
  { id: 'gippal-third', when: { type: 'hp-below', who: GIPPAL, fraction: 1 / 3 }, once: true, script: 'gippal-third' },
  { id: 'gippal-mortar', when: { type: 'ability-used', who: GIPPAL, ability: MORTAR }, once: true, script: 'gippal-mortar' },
  { id: 'nooj-entrance', when: { type: 'hp-below', who: NOOJ, fraction: 1 }, once: true, script: 'nooj-entrance' },
  { id: 'nooj-lightfall', when: { type: 'ability-used', who: NOOJ, ability: LIGHTFALL }, once: true, script: 'nooj-lightfall' },
];

// ---------------------------------------------------------------------- post

/** The last shade falls, then lines 9 to 16: out of the Den (research §6.2 beat 7). */
const POST: StoryScript = [
  say('paine', 'Enough. Let them rest.'), // GP15, the last shade falls
  music('scene-bevelle-underground', 1200),
  camera('reveal', 900),
  beat(1000),
  say('rikku-x2', "We're out! Everybody's out, right?"), // 9
  say('yuna-x2', "Those weren't them. It was Shuyin, feeling through them."), // 10
  say('rikku-x2', "So the squad didn't hate each other."), // 11
  say('yuna-x2', 'Paine... are you okay?'), // 12
  say('paine', 'Two years I thought they chose it.'), // 13
  say('paine', "Baralai's still carrying him. I'll get him back."), // 14
  say('rikku-x2', "Okay. Team hug. Paine, you're in the middle."), // 15
  results(),
  say('paine', 'No.'), // 16
];

/** Chapter XV's story layer: the scripts the registered record carries (`src/data/chapter-den-of-woe-ship.ts`). */
export const ffx2DenOfWoeScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};

export default ffx2DenOfWoeScripts;
