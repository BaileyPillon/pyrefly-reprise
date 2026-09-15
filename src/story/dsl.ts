/**
 * The cutscene DSL.
 *
 * **This file is a contract.** Story agents author `StoryScript`s with the
 * builder helpers at the bottom; the runner in `src/story/` plays them; the
 * battle presenter pauses for the mid-battle ones. Like `battle/common/types.ts`
 * this module is pure data — no DOM, no Three.js — so scripts can be linted and
 * unit-tested headlessly.
 *
 * House style lives in `research/writing-bible.md`:
 * - 4–12 words per line; **hard cap 60 characters, 2 box-lines** (§2.1).
 * - At most one ellipsis per line; `...` as three periods, no space before.
 * - A `beat()` where an answer is owed is a line: allocate 1 200–2 000 ms.
 * - Battle strings are terse and name things rather than describing them (§5.1).
 */

import type { MidBattleTrigger, CameraRigId, MusicKey, SfxKey, VfxKey } from '../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Speakers
// ---------------------------------------------------------------------------

/**
 * Every speaker the five chapters can use [writing-bible §1].
 *
 * `'narrator'` is Tidus's **retrospective** register — past tense, 2–5 lines,
 * over black or a slow pan, placed after an emotional high, never before
 * [writing-bible §1.2]. It is deliberately distinct from `'tidus'`, who speaks
 * in the present tense inside the scene.
 */
export type SpeakerId =
  // --- FFX party ----------------------------------------------------------
  | 'tidus'
  | 'yuna'
  | 'auron'
  | 'wakka'
  | 'lulu'
  | 'kimahri'
  | 'rikku'
  // --- FFX antagonists and the dead ---------------------------------------
  | 'seymour'
  | 'yunalesca'
  | 'jecht'
  | 'braska'
  | 'yu-yevon'
  /** The Bahamut fayth, the child who explains the dream [writing-bible §1.23]. */
  | 'fayth-boy'
  // --- FFX supporting cast with staged presence [visual-bible §1.22] -------
  /** Yunalesca's husband, the first Final Aeon's vessel. */
  | 'zaon'
  /** Auron ten years ago: two-eyed, unscarred, in the Zanarkand Dome memory. */
  | 'young-auron'
  /** Ronso elder, killed holding the Gagazet gate. */
  | 'kelk'
  | 'biran'
  | 'yenke'
  /** The Mt. Gagazet merchant. */
  | 'wantz'
  // --- FFX-2 party --------------------------------------------------------
  /** FFX-2 Yuna. A separate voice and portrait set from `'yuna'` [writing-bible §1.14]. */
  | 'yuna-x2'
  /** FFX-2 Rikku [writing-bible §1.15]. */
  | 'rikku-x2'
  | 'paine'
  // --- FFX-2 airship crew (comm portraits only) ---------------------------
  | 'brother'
  | 'buddy'
  | 'shinra'
  // --- FFX-2 antagonists and supporting cast ------------------------------
  | 'shuyin'
  | 'lenne'
  | 'nooj'
  | 'baralai'
  | 'gippal'
  | 'leblanc'
  | 'logos'
  | 'ormi'
  /** The corrupted Bahamut in the Bevelle Underground — speaks only in roars and stage directions. */
  | 'bahamut'
  // --- special ------------------------------------------------------------
  /** Tidus's retrospective narration. Past tense. Rendered without a name plate. */
  | 'narrator'
  /** No speaker: a stage direction or a system line. */
  | 'none';

/** Portrait emotion variant. Falls back to `'neutral'` when a portrait lacks the state. */
export type Emotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'determined'
  | 'pained'
  | 'smug';

/** Named sprite pose a story step can put an actor into. Matches the sprite state machine. */
export type PoseState =
  | 'idle'
  | 'ready'
  | 'attack'
  | 'cast'
  | 'item'
  | 'hurt'
  | 'ko'
  | 'victory'
  | 'defend'
  /** Yevon prayer gesture — used as punctuation, not dialogue [writing-bible §2.1]. */
  | 'pray'
  | 'kneel'
  | 'point'
  | 'turn-away';

/** Where an actor can be moved to: a camera rig's marker, or a battle slot. */
export type StagePosition =
  | { rig: CameraRigId }
  | { slot: number; side: 'party' | 'enemy' }
  | { x: number; y: number; z: number };

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/** One dialogue line. */
export interface SayStep {
  type: 'say';
  /** Speaker id, or `'narrator'`. */
  who: SpeakerId;
  /** The line. Hard cap 60 characters per box-line, 2 lines per box. */
  text: string;
  /** Portrait key override. Defaults to the speaker's own portrait. */
  portrait?: string;
  emotion?: Emotion;
  /**
   * Auto-advance after this many milliseconds instead of waiting for input.
   * Use for overlapping FFX-2 banter (`Rikku: "So if we just—"`).
   */
  auto?: number;
  /** Optional VO/clip key for a future voice pass. Unused today. */
  voiceKey?: string;
}

/** Retrospective narration over black or a slow pan. Rendered without a name plate. */
export interface NarrateStep {
  type: 'narrate';
  text: string;
  auto?: number;
}

/** Branching choice. The picked option's `value` is stored under `resultKey` in the script flags. */
export interface ChoiceStep {
  type: 'choice';
  /** Prompt line, or omit to show only the options. */
  prompt?: string;
  options: Array<{
    /** Menu label. Same 60-character cap. */
    label: string;
    /** Value written to the flag. */
    value: string | number | boolean;
  }>;
  /** Flag name the result lands in; read it back with {@link IfFlagStep}. */
  resultKey: string;
}

/** Move an actor across the stage. */
export interface MoveStep {
  type: 'move';
  /** Actor id — a speaker id, or a combatant id during a mid-battle script. */
  actor: string;
  to: StagePosition;
  /** Travel time in milliseconds, 0–5 000. */
  ms: number;
  /** Easing name from `engine/Tween.ts`. Defaults to `cubicInOut`. */
  easing?: string;
}

/** Move the battle camera to a named rig. */
export interface CameraStep {
  type: 'camera';
  rig: CameraRigId;
  /** Transition time in milliseconds, 0–4 000. 0 snaps. */
  ms: number;
}

/** Play a one-shot VFX. */
export interface FxStep {
  type: 'fx';
  key: VfxKey;
  /** Actor id to play it on, or omit for screen-space. */
  at?: string;
}

/** Full-screen flash. */
export interface FlashStep {
  type: 'flash';
  /** CSS colour. Defaults to white. */
  color?: string;
  /** Duration in milliseconds, 40–1 200. */
  ms: number;
}

/** Camera shake. */
export interface ShakeStep {
  type: 'shake';
  /** Amplitude in logical pixels, 1–24. */
  px: number;
  /** Duration in milliseconds, 60–2 000. */
  ms: number;
}

/** Fade the full-screen overlay. */
export interface FadeStep {
  type: 'fade';
  /** `'black'` fades out, `'clear'` fades in. `'white'` for the Sending. */
  to: 'black' | 'clear' | 'white';
  /** Duration in milliseconds, 0–4 000. */
  ms: number;
}

/** Hold. Also the "reaction shot as a line" beat: allocate 1 200–2 000 ms. */
export interface WaitStep {
  type: 'wait';
  /** Milliseconds, 0–10 000. */
  ms: number;
}

/** Change the music. */
export interface MusicStep {
  type: 'music';
  /** Track key, or `null` to stop. */
  track: MusicKey | null;
  /** Crossfade in milliseconds, 0–4 000. */
  fade?: number;
}

/** One-shot sound effect. */
export interface SfxStep {
  type: 'sfx';
  key: SfxKey;
}

/** Bring an actor on stage. */
export interface ShowActorStep {
  type: 'showActor';
  actor: string;
  /** Sprite key. Defaults to the actor's registered sprite. */
  spriteKey?: string;
  at?: StagePosition;
  /** Fade-in milliseconds, 0–2 000. 0 pops. */
  ms?: number;
  /** Facing: 1 = right, -1 = left. */
  facing?: 1 | -1;
}

/** Take an actor off stage. */
export interface HideActorStep {
  type: 'hideActor';
  actor: string;
  /** Fade-out milliseconds, 0–2 000. */
  ms?: number;
}

/** Put an actor into a named sprite state. */
export interface SetPoseStep {
  type: 'setPose';
  actor: string;
  state: PoseState;
}

/** Run several steps at once and continue when the longest finishes. */
export interface ParallelStep {
  type: 'parallel';
  steps: Step[];
}

/** A jump target. */
export interface LabelStep {
  type: 'label';
  name: string;
}

/** Jump to a {@link LabelStep}. Guard tiny loops with a flag; the runner aborts after 1 000 jumps. */
export interface JumpStep {
  type: 'jump';
  /** Label name. */
  to: string;
  /** Only jump when this flag is truthy. Omit for an unconditional jump. */
  ifFlag?: string;
}

/** Write a script flag. Flags live for the chapter and are readable by `MidBattleTrigger` scripts. */
export interface SetFlagStep {
  type: 'setFlag';
  key: string;
  value: string | number | boolean;
}

/** Run `then` when `key` is truthy (or equals `equals`), otherwise `else`. */
export interface IfFlagStep {
  type: 'ifFlag';
  key: string;
  /** When given, compares for equality instead of truthiness. */
  equals?: string | number | boolean;
  then: Step[];
  else?: Step[];
}

/**
 * Marker: the pre-battle script ends here and the battle begins. The runner
 * hands control to the battle presenter. Only legal in a `pre` script.
 */
export interface BattleStartStep {
  type: 'battleStart';
  /** Optional battle-start transition override: `'shatter'` (default) or `'blackhole'` (Vegnagun) [visual-bible §1.18]. */
  transition?: 'shatter' | 'blackhole' | 'fade';
}

/**
 * Marker: the results screen comes up here. Only legal in a `post` script.
 * Chapter 4 (Bahamut) suppresses the flourish entirely — the results screen
 * comes up silent, with no victory pose and no fanfare [writing-bible §5.4].
 */
export interface ResultsStep {
  type: 'results';
  /** Suppress the victory pose, fanfare and quips. True for Chapter 4. */
  silent?: boolean;
}

/** Every step. */
export type Step =
  | SayStep
  | NarrateStep
  | ChoiceStep
  | MoveStep
  | CameraStep
  | FxStep
  | FlashStep
  | ShakeStep
  | FadeStep
  | WaitStep
  | MusicStep
  | SfxStep
  | ShowActorStep
  | HideActorStep
  | SetPoseStep
  | ParallelStep
  | LabelStep
  | JumpStep
  | SetFlagStep
  | IfFlagStep
  | BattleStartStep
  | ResultsStep;

/** Step type tags, for exhaustive switches in the runner. */
export type StepType = Step['type'];

/** A script is just an ordered list of steps. */
export type StoryScript = Step[];

/** Id of a script registered in `src/story/scripts/`. Mirrors the battle-side alias. */
export type StoryScriptRef = string;

/** A named, registered script. */
export interface RegisteredScript {
  id: StoryScriptRef;
  script: StoryScript;
}

/** Everything a chapter's story layer contributes. */
export interface ChapterScripts {
  /** Plays before the battle. Must end with a {@link BattleStartStep}. */
  pre: StoryScript;
  /** Plays after victory. Must contain a {@link ResultsStep}. */
  post: StoryScript;
  /**
   * Victory tally lines, keyed by party member id. At most 10 words each; three
   * per character per encounter tier. Grim encounters (E1, E2, E4) suppress the
   * light variants [writing-bible §5.4].
   */
  victoryQuips: Record<string, string[]>;
  /** Triggers that pause the battle presenter to play a short beat. */
  mid: MidBattleTrigger[];
  /**
   * Scripts the `mid` triggers reference, keyed by {@link MidBattleTrigger.script}.
   * Kept here so a chapter is one importable unit.
   */
  midScripts: Record<StoryScriptRef, StoryScript>;
}

// ---------------------------------------------------------------------------
// Builder helpers
//
// Every helper returns a plain object — there is no hidden state and no class,
// so a script is literally an array literal and diffs cleanly in review.
// ---------------------------------------------------------------------------

/** A dialogue line. `say('auron', 'It is not over.')` */
export function say(
  who: SpeakerId,
  text: string,
  opts: { portrait?: string; emotion?: Emotion; auto?: number; voiceKey?: string } = {},
): SayStep {
  return { type: 'say', who, text, ...opts };
}

/** Tidus's retrospective narration. Past tense, 2–5 lines per interlude. */
export function narrate(text: string, auto?: number): NarrateStep {
  return auto === undefined ? { type: 'narrate', text } : { type: 'narrate', text, auto };
}

/** A branching choice. */
export function choice(
  resultKey: string,
  options: ChoiceStep['options'],
  prompt?: string,
): ChoiceStep {
  return prompt === undefined
    ? { type: 'choice', options, resultKey }
    : { type: 'choice', prompt, options, resultKey };
}

/** Move an actor. */
export function move(actor: string, to: StagePosition, ms: number, easing?: string): MoveStep {
  return easing === undefined ? { type: 'move', actor, to, ms } : { type: 'move', actor, to, ms, easing };
}

/** Move the camera to a rig. */
export function camera(rig: CameraRigId, ms = 850): CameraStep {
  return { type: 'camera', rig, ms };
}

/** Play a VFX. */
export function fx(key: VfxKey, at?: string): FxStep {
  return at === undefined ? { type: 'fx', key } : { type: 'fx', key, at };
}

/** Full-screen flash. */
export function flash(ms = 160, color?: string): FlashStep {
  return color === undefined ? { type: 'flash', ms } : { type: 'flash', ms, color };
}

/** Camera shake. */
export function shake(px = 6, ms = 400): ShakeStep {
  return { type: 'shake', px, ms };
}

/** Fade the overlay. */
export function fade(to: FadeStep['to'], ms = 450): FadeStep {
  return { type: 'fade', to, ms };
}

/** Hold. */
export function wait(ms: number): WaitStep {
  return { type: 'wait', ms };
}

/**
 * The reaction-shot silence: a spoken line is answered by a cut to a silent
 * face, then a *different* character speaks [writing-bible §2.1]. Allocate real
 * time — do not let the box auto-advance.
 */
export function beat(ms = 1400): WaitStep {
  return { type: 'wait', ms };
}

/** Change or stop the music. */
export function music(track: MusicKey | null, fade?: number): MusicStep {
  return fade === undefined ? { type: 'music', track } : { type: 'music', track, fade };
}

/** One-shot SFX. */
export function sfx(key: SfxKey): SfxStep {
  return { type: 'sfx', key };
}

/** Bring an actor on stage. */
export function showActor(actor: string, opts: Omit<ShowActorStep, 'type' | 'actor'> = {}): ShowActorStep {
  return { type: 'showActor', actor, ...opts };
}

/** Take an actor off stage. */
export function hideActor(actor: string, ms?: number): HideActorStep {
  return ms === undefined ? { type: 'hideActor', actor } : { type: 'hideActor', actor, ms };
}

/** Set an actor's sprite state. */
export function setPose(actor: string, state: PoseState): SetPoseStep {
  return { type: 'setPose', actor, state };
}

/** Run steps together; continue when the longest finishes. */
export function parallel(...steps: Step[]): ParallelStep {
  return { type: 'parallel', steps };
}

/** A jump target. */
export function label(name: string): LabelStep {
  return { type: 'label', name };
}

/** Jump to a label, optionally gated on a flag. */
export function jump(to: string, ifFlag?: string): JumpStep {
  return ifFlag === undefined ? { type: 'jump', to } : { type: 'jump', to, ifFlag };
}

/** Write a chapter flag. */
export function setFlag(key: string, value: string | number | boolean): SetFlagStep {
  return { type: 'setFlag', key, value };
}

/** Branch on a chapter flag. */
export function ifFlag(
  key: string,
  then: Step[],
  otherwise?: Step[],
  equals?: string | number | boolean,
): IfFlagStep {
  const step: IfFlagStep = { type: 'ifFlag', key, then };
  if (otherwise !== undefined) step.else = otherwise;
  if (equals !== undefined) step.equals = equals;
  return step;
}

/** Hand control to the battle presenter. Ends a `pre` script. */
export function battleStart(transition?: BattleStartStep['transition']): BattleStartStep {
  return transition === undefined ? { type: 'battleStart' } : { type: 'battleStart', transition };
}

/** Bring up the results screen. `silent` suppresses the flourish (Chapter 4). */
export function results(silent = false): ResultsStep {
  return silent ? { type: 'results', silent } : { type: 'results' };
}

// ---------------------------------------------------------------------------
// Lint helpers (used by tests/unit and by the writer's checklist)
// ---------------------------------------------------------------------------

/** Hard cap from [writing-bible §2.1]: 60 characters per box-line, 2 lines per box. */
export const MAX_LINE_CHARS = 60;
/** Two box-lines per `say`, so 120 characters is the absolute ceiling for one step. */
export const MAX_SAY_CHARS = MAX_LINE_CHARS * 2;
/** Victory quips are at most 10 words [writing-bible §5.4]. */
export const MAX_QUIP_WORDS = 10;

/** One lint finding. */
export interface LineIssue {
  /** Index into the script. */
  index: number;
  /** What is wrong. */
  message: string;
}

/**
 * Check a script against the house style. Returns an empty array when clean.
 * Story agents should run this in their own unit test.
 */
export function lintScript(script: StoryScript): LineIssue[] {
  const issues: LineIssue[] = [];
  script.forEach((step, index) => {
    if (step.type !== 'say' && step.type !== 'narrate') return;
    const { text } = step;
    if (text.length > MAX_SAY_CHARS) {
      issues.push({ index, message: `line is ${text.length} chars, cap is ${MAX_SAY_CHARS}` });
    }
    const ellipses = text.split('...').length - 1;
    if (ellipses > 1) issues.push({ index, message: 'more than one ellipsis in a line' });
    if (text.includes(' ...')) issues.push({ index, message: 'space before an ellipsis' });
  });
  return issues;
}
