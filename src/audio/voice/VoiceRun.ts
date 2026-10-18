/**
 * One recorded line, from the moment the box asks for it to the moment it is over.
 *
 * A run is created the instant a line starts printing, usually with its buffer already decoded (the director warms the next few
 * lines of a scene), sometimes still on its way. It starts the source when the buffer is in hand, keeps the clock the box needs to
 * decide when a spoken line may auto-advance (`holdMs`), fades out when Confirm or a skip stops it, and can be paused and resumed
 * (an `AudioBufferSourceNode` cannot pause, so a resume starts a fresh source at the offset).
 *
 * A voice failure is never a wait: a buffer that never arrives, arrives too late to make sense, or finds the context asleep ends
 * the run as `failed`, and `holdMs()` answers 0 from then on. A wall-clock watchdog covers a context whose clock stalls mid-line.
 * Everything is driven by the audio clock (`ctx.currentTime`) and an injected wall clock, so the tests move time by hand.
 *
 * `hooks.onEnd` fires exactly once per run, however it ends; `heard` says whether the source ever started (and so whether the
 * music was ducked for it). Game case: both (shared plumbing).
 */

import { VOICE_ADVANCE_FADE_MS, VOICE_TAIL_MS, type VoicePlayback } from '../../story/voice/voicePort.ts';

export type RunState = 'loading' | 'playing' | 'paused' | 'ended' | 'stopped' | 'failed';

export interface RunHooks {
  /** The source started (or restarted after a pause): duck the music. */
  onStart(run: VoiceRun): void;
  /** The run is over for good: `why` is `ended`, `stopped` or `failed:<reason>`. */
  onEnd(run: VoiceRun, why: string): void;
}

/** A buffer that lands later than this after the line began is dropped: a voice that starts a second into a line is worse than none. */
export const MAX_LATE_MS = 1200;
/** Beyond its remaining length plus this much wall-clock time, a playing run is treated as finished (a context whose clock stalled). */
export const WATCHDOG_SLACK_MS = 2500;
/** A short ramp when pausing, so the cut does not click. */
const PAUSE_FADE_S = 0.015;

export class VoiceRun implements VoicePlayback {
  state: RunState = 'loading';
  /** True once the source has started at least once. */
  heard = false;
  /** Why a run that did not play to the end failed: `late`, `missing`, `suspended`, `stalled`. */
  failReason: string | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private readonly createdAt: number;
  private startedWall = 0;
  private startedCtx = 0;
  private offsetMs = 0;
  private endedCtx = 0;
  /** Paused while the file was still on its way: it waits for `resume()` instead of starting behind the menu. */
  private holdOnArrival = false;

  constructor(
    readonly id: string,
    readonly durationMs: number,
    private readonly ctx: AudioContext,
    private readonly destination: AudioNode,
    buffer: Promise<AudioBuffer | null>,
    private readonly hooks: RunHooks,
    private readonly now: () => number,
  ) {
    this.createdAt = now();
    void buffer.then((b) => this.onBuffer(b));
  }

  // ------------------------------------------------------------- the clock

  private lengthMs(): number {
    return this.buffer ? this.buffer.duration * 1000 : this.durationMs;
  }

  /** Milliseconds of the recording already played. */
  elapsedMs(): number {
    if (this.state === 'playing') return Math.min(this.lengthMs(), this.offsetMs + (this.ctx.currentTime - this.startedCtx) * 1000);
    return this.offsetMs;
  }

  holdMs(): number {
    switch (this.state) {
      case 'loading':
        return this.now() - this.createdAt > MAX_LATE_MS ? this.fail('late') : this.durationMs + VOICE_TAIL_MS;
      case 'playing': {
        // A context that is not running, or whose clock stopped, must not hold a line for a voice that is not progressing.
        if (this.ctx.state !== 'running') return this.fail('suspended');
        // Wall time since this stretch began may not pass what the stretch should take (the recording from its offset) by more than the slack.
        if (this.now() - this.startedWall > this.lengthMs() - this.offsetMs + WATCHDOG_SLACK_MS) return this.fail('stalled');
        // The source may not have reported its end yet (a busy main thread): the tail then counts from the recording's own end.
        const left = this.lengthMs() - (this.offsetMs + (this.ctx.currentTime - this.startedCtx) * 1000);
        return left > 0 ? left + VOICE_TAIL_MS : Math.max(0, VOICE_TAIL_MS + left);
      }
      case 'paused':
        return Math.max(0, this.lengthMs() - this.offsetMs) + VOICE_TAIL_MS;
      case 'ended':
        return Math.max(0, VOICE_TAIL_MS - (this.ctx.currentTime - this.endedCtx) * 1000);
      default:
        return 0;
    }
  }

  // ----------------------------------------------------------------- start

  private onBuffer(buffer: AudioBuffer | null): void {
    if (this.state !== 'loading') return; // stopped (or failed) while the file was on its way
    if (!buffer) return void this.fail('missing');
    if (this.now() - this.createdAt > MAX_LATE_MS) return void this.fail('late');
    if (this.ctx.state !== 'running') return void this.fail('suspended');
    this.buffer = buffer;
    if (this.holdOnArrival) {
      this.state = 'paused';
      this.offsetMs = 0;
      return;
    }
    this.startSource(0);
  }

  private startSource(offsetMs: number): void {
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = this.buffer;
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(this.destination);
    source.onended = () => this.onSourceEnded(source);
    this.source = source;
    this.gain = gain;
    this.offsetMs = offsetMs;
    this.startedCtx = this.ctx.currentTime;
    this.startedWall = this.now();
    this.state = 'playing';
    this.heard = true;
    source.start(this.ctx.currentTime, offsetMs / 1000);
    this.hooks.onStart(this);
  }

  private onSourceEnded(source: AudioBufferSourceNode): void {
    if (this.state !== 'playing' || source !== this.source) return;
    this.state = 'ended';
    this.endedCtx = this.ctx.currentTime;
    this.source = null;
    this.release(source, this.gain);
    this.gain = null;
    this.hooks.onEnd(this, 'ended');
  }

  // --------------------------------------------------------- stop and pause

  /** Stop with a fade (0 = at once). Safe to call twice. */
  stop(fadeMs: number = VOICE_ADVANCE_FADE_MS): void {
    if (this.state === 'ended' || this.state === 'stopped' || this.state === 'failed') return;
    this.finish('stopped', 'stopped', fadeMs / 1000);
  }

  pause(): void {
    if (this.state === 'loading') this.holdOnArrival = true;
    if (this.state !== 'playing') return;
    this.offsetMs = this.elapsedMs();
    this.state = 'paused';
    const source = this.source;
    const gain = this.gain;
    this.source = null;
    this.gain = null;
    if (source && gain) this.fadeAndRelease(source, gain, PAUSE_FADE_S);
  }

  resume(): void {
    if (this.state === 'loading') this.holdOnArrival = false;
    if (this.state !== 'paused' || !this.buffer) return;
    if (this.ctx.state !== 'running') return void this.fail('suspended');
    this.startSource(this.offsetMs);
  }

  /** End the run as failed (once). Answers 0 so `holdMs` can `return this.fail(...)`. */
  private fail(reason: string): number {
    if (this.state === 'ended' || this.state === 'stopped' || this.state === 'failed') return 0;
    this.failReason = reason;
    this.finish('failed', `failed:${reason}`, VOICE_ADVANCE_FADE_MS / 1000);
    return 0;
  }

  private finish(state: 'stopped' | 'failed', why: string, fadeSeconds: number): void {
    const source = this.source;
    const gain = this.gain;
    this.state = state;
    this.source = null;
    this.gain = null;
    if (source && gain) this.fadeAndRelease(source, gain, fadeSeconds);
    this.hooks.onEnd(this, why);
  }

  private fadeAndRelease(source: AudioBufferSourceNode, gain: GainNode, seconds: number): void {
    const t = this.ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + seconds);
      source.onended = () => this.release(source, gain);
      source.stop(t + seconds + 0.005);
    } catch {
      this.release(source, gain);
    }
  }

  private release(source: AudioBufferSourceNode, gain: GainNode | null): void {
    try {
      source.onended = null;
      source.disconnect();
      gain?.disconnect();
    } catch {
      /* already disconnected */
    }
  }
}
