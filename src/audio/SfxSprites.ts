/**
 * The two pre-rendered SFX sprites and the choice between them.
 *
 * The first sprite (`manifest.sfx`, `public/audio/sfx/sprite.mp3`) is the bank the game has always
 * played: every first-bank cue, rendered offline. The second (`manifest.sfxV2`,
 * `public/audio/sfx/sprite-v2.mp3`) is the recorded set of D-302 (`./sfxV2/cues.ts`), addressed as
 * `v2:<name>`. Both are fetched and decoded after unlock, in parallel, and neither is ever waited
 * for: a v2 cue asked for before its sprite has decoded plays its first-bank stand-in, and a
 * first-bank cue before the first sprite has decoded is synthesised (`AudioManager.playSfx`).
 *
 * Also keeps the last few plays (what was asked, what played, from where) for the debug surface
 * (`AudioManager.debug().sfxLog`, `window.__pyrefly.audioDebug()`), which is how the hookup is
 * proven in a browser without ears (AGENTS.md rule 13).
 *
 * Game case: shared plumbing (both); FF7 and the game-less screens only ever touch the first sprite.
 */

import { hasPrerenderedSfx, resolveAudioUrl, type AudioManifest, type SfxCue, type SfxSprite } from './manifest.ts';
import { isV2Key, v2Fallback, v2Name } from './sfxV2/cues.ts';

export interface SpriteSlice {
  buffer: AudioBuffer;
  cue: SfxCue;
}

export interface SfxPlayRecord {
  /** `AudioContext.currentTime` it starts at (the ask plus any delay). */
  t: number;
  /** The key the caller passed. */
  asked: string;
  /** The key that played (after voicing and fallback). */
  played: string;
  /** Where the sound came from. */
  via: 'v2' | 'sprite' | 'synth';
  volume: number;
}

const LOG_SIZE = 4000;

export class SfxSprites {
  private v1: AudioBuffer | null = null;
  private v2: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;
  readonly log: SfxPlayRecord[] = [];

  /** Fetch and decode both sprites once; never throws (a sprite that fails leaves its fallback in charge). */
  load(ctx: AudioContext, manifest: AudioManifest | null, baseUrl: string): Promise<void> {
    if (this.loading) return this.loading;
    if (!manifest || typeof fetch !== 'function') {
      this.loading = Promise.resolve();
      return this.loading;
    }
    const one = async (sprite: SfxSprite | null, set: (b: AudioBuffer) => void): Promise<void> => {
      if (!sprite) return;
      try {
        const response = await fetch(resolveAudioUrl(baseUrl, sprite.file));
        if (!response.ok) return;
        set(await ctx.decodeAudioData(await response.arrayBuffer()));
      } catch {
        // The fallback covers it.
      }
    };
    this.loading = Promise.all([
      one(manifest.sfx, (b) => (this.v1 = b)),
      one(manifest.sfxV2, (b) => (this.v2 = b)),
    ]).then(() => undefined);
    return this.loading;
  }

  /**
   * The slice for `key`: a `v2:` key from the second sprite when it has decoded, otherwise `null`
   * with `fallback` naming the first-bank cue to play instead; a first-bank cue from the first sprite
   * when it has decoded.
   */
  pick(manifest: AudioManifest | null, key: string): { slice: SpriteSlice | null; fallback: string | null } {
    if (isV2Key(key)) {
      const cue = manifest?.sfxV2?.cues[v2Name(key)];
      if (this.v2 && cue) return { slice: { buffer: this.v2, cue }, fallback: null };
      return { slice: null, fallback: v2Fallback(key) };
    }
    const cue = this.v1 && hasPrerenderedSfx(manifest, key) ? manifest!.sfx!.cues[key]! : null;
    return { slice: cue ? { buffer: this.v1!, cue } : null, fallback: null };
  }

  /** Settles when the sprite load that is running (or has run) has finished; at once when none has started. */
  whenLoaded(): Promise<void> {
    return this.loading ?? Promise.resolve();
  }

  record(entry: SfxPlayRecord): void {
    this.log.push(entry);
    if (this.log.length > LOG_SIZE) this.log.splice(0, this.log.length - LOG_SIZE);
  }

  get decoded(): { v1: boolean; v2: boolean } {
    return { v1: this.v1 !== null, v2: this.v2 !== null };
  }

  clear(): void {
    this.v1 = null;
    this.v2 = null;
    this.loading = null;
    this.log.length = 0;
  }
}
