/**
 * The page's side of the motion sounds (`?motionsfx=on`; `engine/feel/MotionSfx.ts` decides, `engine/feel/MotionBeats.ts` is the seam, `audio/sfxV2/motionCues.ts` names the cues; both games).
 *
 * {@link installMotionSfx} registers the sink once at start-up. A beat reaches it from a figure or the presenter; the sink asks the planner (switch, game, speed, rate), and carries a
 * plan to `AudioManager.playSfx` as an ordinary effect: the SFX bus, the hall send, the master limiter, the player's SFX volume. A sound that cannot play is silence, never an error.
 * Every beat and what became of it is kept in {@link motionSfxLog} (the recorder, the tests and the audition read it).
 *
 * Nothing is stored and nothing leaves the page.
 */
import type { PlaySfxOptions } from '../audio/AudioManager.ts';
import { sfxGame } from '../audio/sfxV2/voicing.ts';
import { setMotionBeatSink, motionSfxSpeed, type MotionBeat } from '../engine/feel/MotionBeats.ts';
import { motionSfxOn } from '../engine/feel/FeelSwitch.ts';
import { newMotionMemory, planMotionSfx, type MotionMemory, type MotionPlan, type MotionRefusal } from '../engine/feel/MotionSfx.ts';

/** What the sink plays through and reads; the tests replace them. */
export interface MotionSfxDeps {
  audio: { playSfx(name: string, options?: PlaySfxOptions): void };
  on(): boolean;
  game(): 'ffx' | 'ffx2' | null;
  speed(): string;
  now(): number;
}

export interface MotionSfxRecord {
  at: number;
  beat: MotionBeat;
  /** `played`, or the gate that said no. */
  result: 'played' | MotionRefusal | 'error';
  plan?: MotionPlan;
}

const log: MotionSfxRecord[] = [];
const memory: MotionMemory = newMotionMemory();
let clock: (() => number) | null = null;

/** The recorder's stepper names its own clock, so the planner's rate limits and the log follow simulated time; `null` goes back to `performance.now()`. */
export function setMotionSfxClock(fn: (() => number) | null): void {
  clock = fn;
}

function now(): number {
  return clock ? clock() : typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** The last beats and what became of them (captures and tests). */
export function motionSfxLog(reset = false): MotionSfxRecord[] {
  const copy = log.slice();
  if (reset) log.length = 0;
  return copy;
}

/** Tests: forget the log, the memory and the clock. */
export function resetMotionSfxForTests(): void {
  log.length = 0;
  memory.last = {};
  memory.recent = [];
  clock = null;
}

/** Carry one beat to the sound. Returns what happened. */
export function playMotionBeat(beat: MotionBeat, deps: MotionSfxDeps): MotionSfxRecord['result'] {
  if (!deps.on()) return 'off'; // the live game: nothing is planned, nothing is kept
  const at = deps.now();
  let record: MotionSfxRecord;
  try {
    const answer = planMotionSfx(beat, { on: deps.on(), game: deps.game(), speed: deps.speed(), now: at }, memory);
    if (!answer.ok) {
      record = { at: Math.round(at), beat, result: answer.why };
    } else {
      const p = answer.plan;
      deps.audio.playSfx(p.key, { volume: p.volume, pitch: p.pitch, delay: p.delay, trimMs: p.trimMs, fadeMs: p.fadeMs });
      record = { at: Math.round(at), beat, result: 'played', plan: p };
    }
  } catch {
    record = { at: Math.round(at), beat, result: 'error' }; // an unknown cue or a context that will not play: silence
  }
  log.push(record);
  if (log.length > 120) log.shift();
  return record.result;
}

/** Register the sink once, at start-up; harmless when no switch ever turns the sounds on. */
export function installMotionSfx(audio: MotionSfxDeps['audio']): void {
  const deps: MotionSfxDeps = { audio, on: motionSfxOn, game: sfxGame, speed: motionSfxSpeed, now };
  setMotionBeatSink((beat) => void playMotionBeat(beat, deps));
}
