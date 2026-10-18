/**
 * The voice, as the game uses it: one port for the dialogue box, the mid-battle runner and the results screen.
 *
 * It owns a chapter's manifest and buffers (`VoiceBank`), starts a `VoiceRun` for a line that has a recording, ducks the music
 * under it, keeps the next lines of a scene decoded ahead of the box, and answers the budgets (`spokenMs`). It never creates an
 * AudioContext (only a player's gesture does), never queues a line across an unlock, and answers `null` for anything it cannot
 * play right now: the line then shows and advances as it always did.
 *
 * Mix (docs/audio/THEMES.md "Duck, do not fight"): the music drops 3.5 dB under a spoken line (120 ms attack) and returns over 400 ms
 * after the last line of a run; lines less than 600 ms apart keep the duck so the music does not pump between the lines of one exchange.
 *
 * Game case: both for the plumbing; a chapter is voiced only if its game is in `GAMES_WITH_VOICE` (FFX today) AND it has a manifest.
 */

import type { Step } from '../../story/dsl.ts';
import { keyFor, type VoiceLineRequest } from '../../story/voice/voiceKey.ts';
import { gameHasVoice, partOfId, type ChapterVoiceManifest } from '../../story/voice/voiceManifest.ts';
import { VOICE_ADVANCE_FADE_MS, VOICE_TAIL_MS, type VoicePlayback, type VoicePort } from '../../story/voice/voicePort.ts';
import { VoiceBank } from './VoiceBank.ts';
import { VoiceRun, type RunHooks } from './VoiceRun.ts';

/** What the director needs from the mixer (`AudioManager` satisfies it; a test supplies a fake). */
export interface VoiceHost {
  readonly context: AudioContext | null;
  readonly voiceDestination: AudioNode | null;
  readonly voiceEnabled: boolean;
  unlock(): boolean;
  duck(amount?: number, seconds?: number): void;
  unduck(seconds?: number): void;
}

export interface VoiceClock {
  now(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
}

/** -3.5 dB on the duck bus, 120 ms in, 400 ms out, held 600 ms after the last line of a run. */
export const VOICE_DUCK_GAIN = 0.668;
export const VOICE_DUCK_ATTACK_S = 0.12;
export const VOICE_DUCK_RELEASE_S = 0.4;
export const VOICE_DUCK_HOLD_MS = 600;
/** How many voiced lines past the one being said are kept decoded. */
export const VOICE_LOOKAHEAD = 4;
const LOG_LIMIT = 40;

export interface PlayLog {
  id: string;
  at: number;
  heard: boolean;
  why: string;
}

/** Say and narrate keys of a script in play order, through `parallel` and both legs of `ifFlag`. */
export function scriptKeys(script: readonly Step[]): string[] {
  const keys: string[] = [];
  const walk = (steps: readonly Step[]): void => {
    for (const s of steps) {
      if (s.type === 'say') keys.push(keyFor({ who: s.who, text: s.text, ...(s.voiceKey ? { voiceKey: s.voiceKey } : {}) }));
      else if (s.type === 'narrate') keys.push(keyFor({ who: 'narrator', text: s.text }));
      else if (s.type === 'parallel') walk(s.steps);
      else if (s.type === 'ifFlag') {
        walk(s.then);
        walk(s.else ?? []);
      }
    }
  };
  walk(script);
  return keys;
}

export class VoiceDirector implements VoicePort {
  private chapter: string | null = null;
  private token = 0;
  private current: VoiceRun | null = null;
  private ducked = false;
  private releaseTimer: unknown = null;
  private queue: string[] = [];
  private cursor = 0;
  private warmed = false;
  private readonly pauseReasons = new Set<string>();
  private readonly plays: PlayLog[] = [];
  private asked = 0;
  private started = 0;

  constructor(
    private readonly host: VoiceHost,
    private readonly bank: VoiceBank<AudioBuffer>,
    private readonly clock: VoiceClock,
  ) {}

  private readonly hooks: RunHooks = {
    onStart: () => {
      this.started++;
      this.holdDuck();
    },
    onEnd: (run, why) => {
      if (this.current === run) this.current = null;
      this.plays.push({ id: run.id, at: Math.round(this.clock.now()), heard: run.heard, why });
      if (this.plays.length > LOG_LIMIT) this.plays.shift();
      if (run.heard) this.releaseDuckSoon();
    },
  };

  // --------------------------------------------------------------- chapter

  /**
   * A chapter run begins (`app/voiceChapter.ts`): fetch its manifest and warm its mid-battle and victory lines. A game without
   * voice asks for nothing at all. Returns the function that ends it (a later chapter has already replaced this one: then it does nothing).
   */
  beginChapter(chapter: string, game: string | undefined): () => void {
    this.endChapter();
    if (!gameHasVoice(game)) return () => {};
    this.chapter = chapter;
    const token = ++this.token;
    void this.bank.loadChapter(chapter).then((manifest) => {
      if (token === this.token && manifest) this.warmChapter(manifest);
    });
    return () => {
      if (token === this.token) this.endChapter();
    };
  }

  private endChapter(): void {
    this.token++;
    this.current?.stop(VOICE_ADVANCE_FADE_MS);
    this.chapter = null;
    this.queue = [];
    this.cursor = 0;
    this.warmed = false;
    this.bank.pin([]);
  }

  /** Pin and decode the chapter's mid-battle and victory lines: a beat has to start with no latency. */
  private warmChapter(manifest: ChapterVoiceManifest): void {
    const files = new Set<string>();
    for (const entry of Object.values(manifest.lines)) {
      const part = partOfId(entry.id);
      if (part === 'mid' || part === 'quip') files.add(entry.file);
    }
    this.bank.pin(files);
    if (!this.host.context) return; // decode needs the context; the first line of the scene tries again
    this.warmed = true;
    for (const file of files) void this.bank.ensure(file);
  }

  /** The scene's lines, in order, so the next few are decoded before the box reaches them. */
  prefetchScript(script: readonly Step[]): void {
    this.queue = scriptKeys(script);
    this.cursor = 0;
    if (!this.chapter) return;
    void this.bank.loadChapter(this.chapter).then(() => this.prefetchAhead(VOICE_LOOKAHEAD + 1)); // the first line and the four after it
  }

  /** Decode the next `count` voiced lines of the scene, counting from the one after the line being said; lines with no recording are skipped over. */
  private prefetchAhead(count: number): void {
    if (!this.chapter || !this.host.context) return;
    let ahead = 0;
    for (let i = this.cursor; i < this.queue.length && ahead < count; i++) {
      const entry = this.bank.entry(this.chapter, this.queue[i] ?? '');
      if (!entry) continue;
      ahead++;
      void this.bank.ensure(entry.file);
    }
  }

  // ------------------------------------------------------------------ port

  private canSpeak(): boolean {
    return this.chapter !== null && this.host.voiceEnabled && this.host.context?.state === 'running' && this.host.voiceDestination !== null;
  }

  spokenMs(req: VoiceLineRequest): number {
    if (!this.canSpeak()) return 0;
    const entry = this.bank.entry(this.chapter, keyFor(req));
    return entry ? entry.ms + VOICE_TAIL_MS : 0;
  }

  begin(req: VoiceLineRequest): VoicePlayback | null {
    if (!this.chapter || !this.host.voiceEnabled) return null;
    const key = keyFor(req);
    const entry = this.bank.entry(this.chapter, key);
    if (!entry) return null;
    const ctx = this.host.context;
    if (!ctx) return null; // never create a context here: only a player's gesture may
    const running = (): boolean => ctx.state === 'running';
    if (!running()) {
      this.host.unlock(); // a resumed tab: try once; a line is never queued across the unlock
      if (!running()) return null;
    }
    const destination = this.host.voiceDestination;
    if (!destination) return null;
    this.current?.stop(VOICE_ADVANCE_FADE_MS); // a line never talks over the next one
    const at = this.queue.indexOf(key, this.cursor);
    if (at >= 0) this.cursor = at + 1;
    if (!this.warmed) this.retryWarm();
    this.prefetchAhead(VOICE_LOOKAHEAD);
    this.asked++;
    const run = new VoiceRun(entry.id, entry.ms, ctx, destination, this.bank.ensure(entry.file), this.hooks, () => this.clock.now());
    this.current = run;
    if (this.pauseReasons.size > 0) run.pause();
    return run;
  }

  stop(fadeMs: number = VOICE_ADVANCE_FADE_MS): void {
    this.current?.stop(fadeMs);
  }

  private retryWarm(): void {
    const manifest = this.chapter ? this.bank.manifest(this.chapter) : null;
    if (manifest) this.warmChapter(manifest);
  }

  // ----------------------------------------------------------------- pause

  /** The pause overlay opening, or the tab hiding: freeze the line where it is and hold the duck release. */
  setPaused(paused: boolean, reason = 'overlay'): void {
    if (paused) this.pauseReasons.add(reason);
    else this.pauseReasons.delete(reason);
    if (this.pauseReasons.size > 0) {
      this.current?.pause();
      // The pause menu ducks and unducks the music itself; this run's release would fight it.
      this.cancelRelease();
      this.ducked = false;
    } else {
      this.current?.resume();
    }
  }

  // --------------------------------------------------------------- ducking

  private holdDuck(): void {
    this.cancelRelease();
    if (this.ducked) return;
    this.ducked = true;
    this.host.duck(VOICE_DUCK_GAIN, VOICE_DUCK_ATTACK_S);
  }

  private releaseDuckSoon(): void {
    if (!this.ducked) return;
    this.cancelRelease();
    this.releaseTimer = this.clock.setTimer(() => {
      this.releaseTimer = null;
      if (this.current && this.current.state === 'playing') return; // another line began in the meantime
      this.ducked = false;
      this.host.unduck(VOICE_DUCK_RELEASE_S);
    }, VOICE_DUCK_HOLD_MS);
  }

  private cancelRelease(): void {
    if (this.releaseTimer !== null) this.clock.clearTimer(this.releaseTimer);
    this.releaseTimer = null;
  }

  // ----------------------------------------------------------------- debug

  /** The hook-up, provable without ears: `audio.debug().voice`. */
  debug(): Record<string, unknown> {
    return {
      chapter: this.chapter,
      enabled: this.host.voiceEnabled,
      contextState: this.host.context?.state ?? null,
      ducked: this.ducked,
      paused: [...this.pauseReasons],
      asked: this.asked,
      started: this.started,
      current: this.current ? { id: this.current.id, state: this.current.state, holdMs: Math.round(this.current.holdMs()) } : null,
      cache: this.bank.stats(),
      plays: this.plays.slice(),
    };
  }
}
