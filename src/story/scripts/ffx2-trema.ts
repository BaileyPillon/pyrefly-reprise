/**
 * Chapter XIII — Trema, Cloister 100 of the Via Infinito (FFX-2). Proposed scene tag **E13**
 * (the Omnis draft takes E12). Tonal tier: FFX-2 buoyant on the way down, one sincere seam at
 * the end (Yuna's answer).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. FFX-2 cutscene grammar (writing-bible §2.2):
 * Yuna narrates the open, three-beat banter (Rikku sets up, Yuna reacts, Paine ends it),
 * sincerity for one exchange at most. Voices: Yuna §1.14, Rikku §1.15, Paine §1.16.
 *
 * ## Where the lines come from
 *
 * Every line is `docs/plans/trema-story-draft.md`, numbered there and here, unchanged. The
 * **events** are canon (research §2 and §7); **the wording is ours**: no game line is quoted or
 * reworked and no Hymn of the Fayth lyric is used (TR13, rule 8). Bailey's picks followed
 * (2026-09-25, "I'll go with all your recommendations"): **TR13** callouts at their sourced
 * moments, **TR14 a** Yuna opens, the Cloister 0 stranger in two lines, Trema revealed only
 * after Paragon, no Kinderguardian portraits; **TR15** no illusion of Zanarkand; **O-2 yes**
 * the link staged as a short scene.
 *
 * ## Two shapes, one module ({@link tremaScriptsFor})
 *
 * The chapter's shape is read from its data (`src/data/trema-shape.ts`):
 *
 * - **Paragon, then Trema (TR1 a):** Trema is revealed by the link seam `paragon-falls`, fired
 *   off Paragon's KO. Its `camera(TREMA_LINK_RIG)` is the cue the Cloister 100 scene starts the
 *   kill link on (`src/scenes/cloister-100-link.ts`: the old man appears and breaks Paragon
 *   into pyreflies). Paragon's first Big Bang gets Paine's callout when that Paragon has one.
 * - **Trema alone (TR1 b):** no Paragon, so no seam, no kill link and no Big Bang callout.
 *   Trema's reveal moves into `pre`, before `battleStart()`, as the draft's option-2 variant.
 *
 * The callouts on Trema are the AI's own `script-trigger` names (`trema-meteor-1`,
 * `trema-meteor-2`, `trema-ultima`; `src/battle/ffx2/ai/trema.ts`), plus two `mid` triggers:
 * his entrance (`hp-below` at `fraction: 1`, the Shuyin precedent: there is no "enters the
 * field" trigger) and the first Beguiling Mire (the move that Stops, research §4.2).
 *
 * ## The exit
 *
 * Trema is beaten and stays on his feet (`'held'`, `BattlePresenterDepartures.ts`). In `post`
 * he answers Yuna and fades away (research §2 step 4: he "fades away"). No pyreflies: the
 * sources say he fades, so he fades.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, hideActor, music, narrate, results, say, showActor, wait } from '../dsl.ts';

/** The shape the scripts follow (`src/data/trema-shape.ts`, mirrored so `src/story` stays out of `src/data`). */
export interface TremaStoryShape {
  readonly paragonLink: boolean;
  readonly paragonBigBang: boolean;
  /** Paragon's combatant id, when there is a Paragon link. */
  readonly paragonId?: string;
  /** Trema's combatant id. */
  readonly tremaId: string;
}

/**
 * The camera rig the link seam cuts to, which the Cloister 100 scene publishes and watches for
 * (`CLOISTER_LINK_RIG` in `src/scenes/cloister-100-rigs.ts`; a test pins the two together).
 */
export const TREMA_LINK_RIG = 'trema-link';

/** The link seam's name: a trigger id, and its script's key. */
export const TREMA_LINK_SEAM = 'paragon-falls';

/** Names the Trema AI emits (`src/battle/ffx2/ai/trema.ts`), each with a callout below. */
export const TREMA_AI_TRIGGERS = ['trema-meteor-1', 'trema-meteor-2', 'trema-ultima'] as const;

/** Beguiling Mire, the move that Stops (`src/data/ffx2/enemies/trema-abilities.ts`). */
const MIRE = 'trema-beguiling-mire';

// --------------------------------------------------------------------------- pre

/** Yuna's narration and the bottom-floor banter, lines 1 to 7. */
const OPENING: StoryScript = [
  music('scene-bevelle-underground', 1400), // TR16 a: "The Bevelle Underground" (research §6.3)
  camera('idle', 0),
  fade('clear', 1100),
  narrate('Under Bevelle, a dungeon goes down a hundred floors.'), // 1
  narrate('At the top, a stranger told the kids a story.'), // 2
  narrate('A man walked down there a year ago.'), // 3
  narrate('He never came back up.'), // 4
  beat(1200),
  say('rikku-x2', 'Floor one hundred! Rikku, still alive, reporting!'), // 5
  say('yuna-x2', 'Um... is that a good sign or a bad one?'), // 6
  say('paine', "Ask me after. Something's waiting."), // 7
];

/** Lines 11 to 18: who he is, why he broke the spheres, and his challenge. */
function reveal(auto?: number): StoryScript {
  const o = auto === undefined ? {} : { auto };
  return [
    say('yuna-x2', "You're the one from the top floor.", o), // 11
    say('trema', 'I founded New Yevon. You may call me Trema.', o), // 12
    say('paine', 'The man who never came back.', o), // 13
    say('trema', 'I came down with every sphere we gathered.', o), // 14
    say('trema', 'And I broke them. Every one.', o), // 15
    say('yuna-x2', "Why? They were people's memories.", o), // 16
    say('trema', 'Memories are weights. Put them down, and you rise.', o), // 17
    say('trema', 'You carried yours a hundred floors. Show me what they bought.', o), // 18
  ];
}

// ------------------------------------------------------------------- the link

/**
 * The seam between the links (O-2 yes), fired off Paragon's KO. No combat is in flight, so it
 * may run long (the seam budget, `src/story/registry.ts`). The camera move is the scene's cue:
 * the old man appears in his cast pose and breaks the standing Paragon into pyreflies while
 * Rikku is still celebrating, then he walks to the boss spot and speaks.
 */
function linkSeam(): StoryScript {
  return [
    camera(TREMA_LINK_RIG, 700),
    say('rikku-x2', "It's down! We did it! We... huh?", { auto: 1400 }), // 9
    wait(1400), // the kill link plays under it (cloister-100-link.ts): he appears, Paragon breaks apart
    say('trema', 'Forgive the interruption. It had served its purpose.', { auto: 1400 }), // 10
    // Ten lines inside the seam budget (26 s, `src/story/registry.ts`): 1.2 s holds, the floor of
    // writing-bible §2.1's 1.2 to 2.0 s.
    ...reveal(1200),
    camera('idle', 700),
  ];
}

// ------------------------------------------------------------------ callouts

/** One callout: a single line under the beat budget (8 s), always auto-advancing. */
function callout(line: ReturnType<typeof say>): StoryScript {
  return [{ ...line, auto: line.auto ?? 1800 }];
}

function midFor(shape: TremaStoryShape): { mid: MidBattleTrigger[]; midScripts: Record<string, StoryScript> } {
  const t = shape.tremaId;
  const mid: MidBattleTrigger[] = [];
  const midScripts: Record<string, StoryScript> = {
    // Trema's entrance, as his link opens (TR13).
    'trema-entrance': callout(say('rikku-x2', "Okay, new plan. Don't die.")),
    // The first Stop: his first Beguiling Mire (TR13).
    // Draft line "Can't... move... not now!" with one ellipsis, the house lint's cap (`lintScript`).
    'trema-first-stop': callout(say('rikku-x2', "Can't move... not now!")),
    // His HP triggers, emitted by his AI (TR13).
    'trema-meteor-1': callout(say('paine', 'Heads up. Literally.')),
    'trema-meteor-2': callout(say('yuna-x2', 'Again? Everyone, hold on!')),
    'trema-ultima': callout(say('trema', 'Let go. It is easier.')),
  };
  if (shape.paragonLink && shape.paragonId) {
    const p = shape.paragonId;
    mid.push({ id: TREMA_LINK_SEAM, when: { type: 'ko', who: p }, once: true, script: TREMA_LINK_SEAM });
    midScripts[TREMA_LINK_SEAM] = linkSeam();
    midScripts['paragon-mourned'] = callout(say('yuna-x2', 'That thing... it used to be somebody.')); // 8
    mid.push({ id: 'paragon-mourned', when: { type: 'hp-below', who: p, fraction: 1 }, once: true, script: 'paragon-mourned' });
    if (shape.paragonBigBang) {
      // Paragon's first Big Bang (TR13).
      midScripts['paragon-big-bang'] = callout(say('paine', "It hits back. Don't give it a reason."));
      mid.push({ id: 'paragon-big-bang', when: { type: 'ability-used', who: p, ability: 'paragon-big-bang' }, once: true, script: 'paragon-big-bang' });
    }
  }
  mid.push({ id: 'trema-entrance', when: { type: 'hp-below', who: t, fraction: 1 }, once: true, script: 'trema-entrance' });
  mid.push({ id: 'trema-first-stop', when: { type: 'ability-used', who: t, ability: MIRE }, once: true, script: 'trema-first-stop' });
  return { mid, midScripts };
}

// ---------------------------------------------------------------------- post

/** Lines 19 to 24: Yuna's answer, he fades, the banter comes back. */
function post(tremaId: string): StoryScript {
  return [
    music(null, 1200),
    showActor(tremaId, { ms: 0, facing: -1 }),
    camera('idle', 900),
    beat(1400),
    // The chapter's one sincere exchange (writing-bible §2.2: one, four lines at most).
    say('trema', 'Why do you fight, if not to forget?'), // 19
    say('yuna-x2', 'For what I made with them. Every day of it.'), // 20
    say('trema', 'Then you are freer than I ever was.'), // 21
    // He fades away (research §2 step 4). No pyreflies: the sources say he fades.
    hideActor(tremaId, 2400),
    beat(1600),
    narrate('He smiled, I think. Then he was gone.'), // 22
    say('rikku-x2', 'So... is that a Garment Grid? Dibs!'), // 23
    results(),
    say('paine', 'Hole in the floor. Out.'), // 24
  ];
}

/** The chapter's story layer for `shape`. */
export function tremaScriptsFor(shape: TremaStoryShape): ChapterScripts {
  const { mid, midScripts } = midFor(shape);
  const pre: StoryScript = shape.paragonLink
    ? [...OPENING, battleStart()]
    : [
        // Option 2 variant (the draft's "Trema alone" section): no Paragon, so he is waiting.
        ...OPENING,
        showActor(shape.tremaId, { ms: 1200, facing: -1 }),
        beat(1000),
        ...reveal(),
        battleStart(),
      ];
  return { pre, post: post(shape.tremaId), victoryQuips: {}, mid, midScripts };
}

/** The picks as built today: Paragon (normal), then Trema. */
export const ffx2TremaScripts: ChapterScripts = tremaScriptsFor({
  paragonLink: true,
  paragonBigBang: true,
  paragonId: 'paragon',
  tremaId: 'trema',
});
