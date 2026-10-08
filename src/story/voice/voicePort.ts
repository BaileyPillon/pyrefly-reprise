/**
 * The dialogue box's side of the voice: a small port, so the box (and the mid-battle runner) never touch Web Audio.
 *
 * `DialogueBox` asks the port to `begin` a recording when a line starts printing and asks the playback how long the line must still
 * be held; `src/audio/voice/VoiceDirector.ts` is the real port, a test supplies a fake. Nothing here imports the DOM or three.
 *
 * Rules the port keeps (docs/audio/voice-integration-design.md sections 3 to 5):
 *  - a voice failure is never a wait: no recording, voice off, a context that is not running, a skipped scene and a decode that
 *    fails all answer `null` / `0`, and the line shows and advances exactly as it did before voice existed;
 *  - a spoken line is never cut by its own timer: the box holds `holdMs()` past the text's own hold, and releases it the moment the
 *    voice ends, is stopped, or fails;
 *  - advancing or skipping stops the voice (a 60 ms fade); a line never talks over the next one.
 */

import type { VoiceLineRequest } from './voiceKey.ts';

export type { VoiceLineRequest } from './voiceKey.ts';

/** Silence held after the last syllable before a voiced line may auto-advance, in milliseconds. */
export const VOICE_TAIL_MS = 200;
/** The fade when Confirm or a skip stops a line mid-sentence. */
export const VOICE_ADVANCE_FADE_MS = 60;

/** One recording being played (or waiting to play) for one line. */
export interface VoicePlayback {
  /** The recording's length in milliseconds, from the manifest. */
  readonly durationMs: number;
  /** How long the line should still be held for this voice: the unplayed part plus {@link VOICE_TAIL_MS}; 0 once it finished, was stopped or failed. */
  holdMs(): number;
  /** Stop with a short fade (0 = at once). Safe to call twice. */
  stop(fadeMs?: number): void;
}

export interface VoicePort {
  /**
   * How long a line needs to be held, from its start, for its voice (recording plus tail), or 0 when it would not be spoken
   * (no recording, voice off or muted, audio not running). The mid-battle budgets use it; it never starts anything.
   */
  spokenMs(req: VoiceLineRequest): number;
  /** Start the recording for a line, or `null` when it has none or cannot play now. Stops whatever was speaking. */
  begin(req: VoiceLineRequest): VoicePlayback | null;
  /** Stop whatever is speaking (skip, teardown). */
  stop(fadeMs?: number): void;
}

/**
 * The same port, silent while `isGated()` is true. The runner keeps calling `dialogue.say` after a skip (only its wait is raced
 * away), so a screen gates its voice on `runner.skipped` to stop a skipped scene from starting a recording per remaining line.
 */
export function gatedVoice(port: VoicePort, isGated: () => boolean): VoicePort {
  return {
    spokenMs: (req) => (isGated() ? 0 : port.spokenMs(req)),
    begin: (req) => (isGated() ? null : port.begin(req)),
    stop: (fadeMs) => port.stop(fadeMs),
  };
}
