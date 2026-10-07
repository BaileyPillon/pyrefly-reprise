/**
 * The recording of the line the dialogue box is showing.
 *
 * Kept out of `DialogueBox.ts` so the box only has to say three things: a line began (`begin`), may it auto-advance yet
 * (`holding`), and the line is over (`stop`). Without a port, or when the port has no recording for the line, every call is a
 * no-op and the box behaves exactly as it did before voice existed.
 *
 * A voice failure is never a wait and never a crash: anything the port throws is swallowed here, and the line shows and advances
 * as it always did.
 */

import { VOICE_ADVANCE_FADE_MS, type VoiceLineRequest, type VoicePlayback, type VoicePort } from '../../story/voice/voicePort.ts';

export class LineVoice {
  private run: VoicePlayback | null = null;

  constructor(private readonly port: VoicePort | undefined) {}

  /** A line began printing: stop the last one (a line never talks over the next) and start this one's recording, if it has one. */
  begin(req: VoiceLineRequest): void {
    this.stop();
    try {
      this.run = this.port?.begin(req) ?? null;
    } catch {
      this.run = null;
    }
  }

  /** True while the line should still be held, past its own timer, for its voice. */
  holding(): boolean {
    try {
      return (this.run?.holdMs() ?? 0) > 0;
    } catch {
      this.run = null;
      return false;
    }
  }

  /** Advance, skip, hide or unmount: stop the voice with a short fade. */
  stop(fadeMs: number = VOICE_ADVANCE_FADE_MS): void {
    try {
      this.run?.stop(fadeMs);
    } catch {
      /* a voice that will not stop is not the box's problem */
    }
    this.run = null;
  }
}
