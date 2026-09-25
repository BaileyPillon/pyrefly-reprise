/**
 * Chapter XI — Fallen Aeons, the Road to the Farplane (FFX-2). Proposed scene tag **E11**
 * (the Yojimbo draft takes E9, the Natus draft E10). Tonal tier: FFX-2 buoyant with one
 * mournful seam (these were Yuna's aeons).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. FFX-2 cutscene grammar (writing-bible §2.2):
 * three-beat banter (Rikku sets up, Yuna reacts, Paine ends it), sincerity for one exchange at
 * most. Voices: Yuna §1.14, Rikku §1.15, Paine §1.16.
 *
 * ## Where the lines come from
 *
 * Every line is `docs/plans/fallen-aeons-story-draft.md`, numbered there and here, unchanged
 * except where a note says so (the house lint allows one ellipsis a line). The **events** are
 * canon (research §2 and §6.2); **the wording is ours**: no game line is quoted or reworked.
 * Bailey's picks followed (2026-09-24, "I'll go with your recommendations for all"): **FA16 a**
 * Yuna's opening line on each link and four callouts (Stop lands, the first sister falls, the
 * third Pain, Anima at half HP), no Farplane voices; **FA2 b / O-4 C** the Save Sphere between
 * links (the card itself is `src/app/screens/SaveSphereCard.ts`); **O-3 A + B** plate B as the
 * shot between links ({@link FALLEN_AEONS_LINKS_RIG}); **FA19** no Yojimbo.
 *
 * ## Where each beat fires
 *
 * - **Pre** (lines 1 to 7): the comm, the drop, the road. Then `battleStart()`.
 * - **Link 1:** Shiva's entrance (`hp-below` at `fraction: 1`, the Shuyin precedent: there is no
 *   "enters the field" trigger) carries line 8. **Stop lands** is `status-applied`, one trigger
 *   per girl: the draft's line is Rikku's own ("Can't move..."); Yuna's and Paine's are added.
 * - **Between 1 and 2** (lines 9 to 12, the chapter's one sincere exchange): the seam
 *   {@link FALLEN_AEONS_SEAM} on Shiva's KO, before the Save Sphere card. Its camera cut to the
 *   road-links rig is what shows plate B (`src/scenes/road-to-the-farplane.ts`).
 * - **Link 2:** the Sisters' entrance (on Sandy) carries line 13. **The first sister falls** is
 *   emitted by the Sisters' AI the turn Delta Attack is disarmed for good
 *   (`src/battle/ffx2/ai/magus-sisters.ts`, {@link FALLEN_AEONS_AI_TRIGGERS}): which sister falls
 *   first is the player's choice, so no single-combatant trigger can carry it.
 * - **Between 2 and 3** (lines 14 to 16): the Sisters' last KO ends the link and no trigger can
 *   name the last one, so the banter opens Anima's entrance, ahead of line 17, after the Save
 *   Sphere card.
 * - **Link 3:** **the third Pain** is emitted by Anima's AI as she picks it
 *   (`src/battle/ffx2/ai/fallen-aeons.ts`); **Anima at half HP** is `hp-below` at `0.5`.
 * - **Post** (lines 18 to 23): the Glen. `results()` after line 19, the house pattern.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, say } from '../dsl.ts';

/** The between-links rig the Road scene publishes and watches for (`ROAD_LINKS_RIG`; a test pins the two). */
export const FALLEN_AEONS_LINKS_RIG = 'road-links';

/** The seam between Shiva and the Sisters: a trigger id, and its script's key. */
export const FALLEN_AEONS_SEAM = 'shiva-falls';

/** Names the Chapter XI AIs emit (`src/battle/ffx2/ai/{magus-sisters,fallen-aeons}.ts`), each with a callout below. */
export const FALLEN_AEONS_AI_TRIGGERS = ['sisters-first-down', 'anima-third-pain'] as const;

/** The combatant ids the triggers name (`src/data/ffx2/enemies/fallen-aeons-road.ts`, `magus-sisters.ts`). */
const SHIVA = 'x2-shiva';
const SANDY = 'sandy';
const ANIMA = 'x2-anima';

// --------------------------------------------------------------------------- pre

/** Lines 1 to 7: the readout on the comm, then the road. */
const PRE: StoryScript = [
  music('scene-farplane', 1400), // FA15: the field bed
  camera('reveal', 0),
  fade('clear', 1100),
  say('shinra', 'Readings under the temple. The fayth are gone.'), // 1
  say('brother-x2', 'Nooj! Gippal! They went down there!'), // 2
  say('buddy', "Hole's under the statue. Straight down."), // 3
  say('yuna-x2', "Then that's our way in. Let's go."), // 4
  beat(1000),
  say('rikku-x2', 'A road made of floating rocks. Cozy.'), // 5
  say('yuna-x2', "It's the road to the Farplane."), // 6
  say('paine', "Then walk. Don't look down."), // 7
  battleStart(),
];

// ------------------------------------------------------------------ the seam

/**
 * Between 1 and 2: the one sincere exchange (writing-bible §2.2: exactly one, four lines at most),
 * on plate B. No combat is in flight (Shiva is down), so it may run past the in-fight beat budget.
 */
function shivaSeam(): StoryScript {
  return [
    camera(FALLEN_AEONS_LINKS_RIG, 0),
    beat(900),
    say('yuna-x2', 'She used to come when I called.', { auto: 1800 }), // 9
    say('paine', "She didn't choose this.", { auto: 1600 }), // 10
    say('yuna-x2', "I know. That's what hurts.", { auto: 1800 }), // 11
    say('rikku-x2', 'Okay. Hugs later. Road now.', { auto: 1600 }), // 12
    camera('idle', 0),
  ];
}

// ------------------------------------------------------------------ callouts

/** One callout: a single line under the beat budget (8 s), always auto-advancing. */
function callout(line: ReturnType<typeof say>): StoryScript {
  return [{ ...line, auto: line.auto ?? 1800 }];
}

const MID_SCRIPTS: Record<string, StoryScript> = {
  // Link 1 (research §6.2 beat 3: Yuna caught off guard).
  'shiva-entrance': callout(say('yuna-x2', 'Shiva? No... not you too.')), // 8
  // FA16: Stop lands, one line per girl it lands on. Draft "Can't... move... Yunie!" with one
  // ellipsis, the house lint's cap (`lintScript`), for Rikku. Measured (100 seeds, the intended
  // line): Stop landed on Yuna 7 times and never on a Dark Knight, so a Rikku-only callout would
  // never play; Yuna's and Paine's lines are ADDED, ours, and listed in the draft for Bailey.
  'stop-lands': callout(say('rikku-x2', "Can't move... Yunie!")),
  'stop-lands-yuna': callout(say('rikku-x2', "Yunie's frozen! Remedy, now!")),
  'stop-lands-paine': callout(say('paine', "Can't move. Get me a Remedy.")),
  [FALLEN_AEONS_SEAM]: shivaSeam(),
  // Link 2 (beat 5: her dismay that the Sisters fell too).
  'sisters-entrance': callout(say('yuna-x2', 'All three of you? Even you...')), // 13
  // FA16: the first sister falls; Delta Attack is gone from here (research §4.2, `[verified: 4 sources]`).
  'sisters-first-down': callout(say('paine', "One down. They can't combine now.")),
  // Between 2 and 3, then link 3 (beat 6: Yuna asks Anima's forgiveness). Four lines inside the 8 s
  // beat budget: holds of 1.2 to 1.4 s, inside writing-bible §2.1's 1.2 to 2.0 s.
  'anima-entrance': [
    say('rikku-x2', 'Three sisters. Totally unfair.', { auto: 1400 }), // 14
    say('yuna-x2', "We're three sisters too, sort of.", { auto: 1400 }), // 15
    say('paine', "We don't hover.", { auto: 1200 }), // 16
    say('yuna-x2', 'Anima... forgive me. Please.', { auto: 1400 }), // 17
  ],
  // FA16: the third Pain (its stat losses stack, research §4.3).
  'anima-third-pain': callout(say('yuna-x2', "Remedy! Don't let it pile up!")),
  // FA16: Anima at half HP.
  'anima-half': callout(say('paine', "She's breaking. Keep going.")),
};

const MID: MidBattleTrigger[] = [
  { id: 'shiva-entrance', when: { type: 'hp-below', who: SHIVA, fraction: 1 }, once: true, script: 'shiva-entrance' },
  { id: 'stop-lands', when: { type: 'status-applied', who: 'rikku', status: 'stop' }, once: true, script: 'stop-lands' },
  { id: 'stop-lands-yuna', when: { type: 'status-applied', who: 'yuna', status: 'stop' }, once: true, script: 'stop-lands-yuna' },
  { id: 'stop-lands-paine', when: { type: 'status-applied', who: 'paine', status: 'stop' }, once: true, script: 'stop-lands-paine' },
  { id: FALLEN_AEONS_SEAM, when: { type: 'ko', who: SHIVA }, once: true, script: FALLEN_AEONS_SEAM },
  { id: 'sisters-entrance', when: { type: 'hp-below', who: SANDY, fraction: 1 }, once: true, script: 'sisters-entrance' },
  { id: 'anima-entrance', when: { type: 'hp-below', who: ANIMA, fraction: 1 }, once: true, script: 'anima-entrance' },
  { id: 'anima-half', when: { type: 'hp-below', who: ANIMA, fraction: 0.5 }, once: true, script: 'anima-half' },
];

// ---------------------------------------------------------------------- post

/** Lines 18 to 23: the Glen (research §2), then back to the ship. */
const POST: StoryScript = [
  music('scene-farplane', 1200),
  camera('reveal', 900),
  beat(1200),
  say('yuna-x2', 'Rest now. All of you.'), // 18
  say('rikku-x2', 'Flowers? Down here?'), // 19
  results(),
  say('leblanc', 'Took you long enough, Gullwings.'), // 20
  say('ormi', 'Boss, they look tired.'), // 21
  say('logos', 'Supplies. For a price, naturally.'), // 22
  say('paine', 'Back to the ship. Then down.'), // 23
];

/** Chapter XI's story layer: the scripts the registered record carries (`src/data/chapter-fallen-aeons-ship.ts`). */
export const ffx2FallenAeonsScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};

export default ffx2FallenAeonsScripts;
