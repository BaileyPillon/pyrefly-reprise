/**
 * The pre-rendered SFX sprites and the choice between them: three sources, most specific first.
 *
 * 1. The parity packs (`manifest.sfxParity.packs`, `public/audio/sfx/parity-<pack>.mp3`, SFX parity 2026-10-10):
 *    recorded originals cut by game and by boss (`./sfxV2/packs.ts`), fetched when a chapter run starts
 *    (`loadPacks`, never at unlock, so the title, chapter select and FF7 load none) and consulted FIRST for a
 *    `v2:` key, in the order the chapter listed them (boss packs before the game's core pack).
 * 2. The v2 sprite (`manifest.sfxV2`, `public/audio/sfx/sprite-v2.mp3`), the recorded set of D-302
 *    (`./sfxV2/cues.ts`), addressed as `v2:<name>`; it takes the P1 mix's per-cue trim (`./sfxV2/parityMix.ts`).
 * 3. The first sprite (`manifest.sfx`, `public/audio/sfx/sprite.mp3`), the bank the game has always played:
 *    every first-bank cue, rendered offline, and the stand-in for any v2 cue the sources above cannot supply.
 *
 * All are fetched and decoded in the background and none is ever waited for: a v2 cue asked for before its
 * sprite has decoded plays its first-bank stand-in, and a first-bank cue before the first sprite has decoded
 * is synthesised (`AudioManager.playSfx`). So a cue is never silent, whatever has or has not loaded.
 *
 * Also keeps the last few plays (what was asked, what played, from where) for the debug surface
 * (`AudioManager.debug().sfxLog`, `window.__pyrefly.audioDebug()`), which is how the hookup is
 * proven in a browser without ears (AGENTS.md rule 13).
 *
 * Game case: shared plumbing (both); FF7 and the game-less screens only ever touch the first sprite.
 */

import { hasPrerenderedSfx, resolveAudioUrl, type AudioManifest, type SfxCue, type SfxSprite } from './manifest.ts';
import { isV2Key, v2Fallback, v2Name } from './sfxV2/cues.ts';
import { parityGain, type TrimGame } from './sfxV2/parityMix.ts';

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
  /** Where the sound came from: a parity pack, the v2 sprite, the first-bank sprite, or the synth. */
  via: 'parity' | 'v2' | 'sprite' | 'synth';
  volume: number;
  /** The P1 mix's trim in dB the v2 slice played with (`sfxV2/parityMix.ts`); absent when there was none. */
  trimDb?: number;
  /** Phase 2: ms the mixer waited so the recorded original's peak landed on the beat the presenter named; absent when it started on the ask. */
  leadMs?: number;
  /** A stand-in that stayed silent because the recorded original that covers it was the one playing (`played` names that original). */
  covered?: true;
}

/** What `pick` found for a key. */
export interface SfxPick {
  slice: SpriteSlice | null;
  /** The first-bank cue to play instead when `slice` is null for a `v2:` key. */
  fallback: string | null;
  /** Which source `slice` came from; `null` when there is none. */
  via: 'parity' | 'v2' | 'sprite' | null;
  /** Linear gain the source asks on top of the caller's volume: the P1 trim for a v2 slice, 1 for the rest. */
  gain: number;
}

const LOG_SIZE = 4000;

export class SfxSprites {
  private v1: AudioBuffer | null = null;
  private v2: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;
  /** Decoded parity packs by name, and the loads in flight (a pack is fetched once per page). */
  private readonly packs = new Map<string, AudioBuffer>();
  private readonly packLoads = new Map<string, Promise<void>>();
  /** The packs the running chapter consults, in lookup order (`./sfxV2/packs.ts`); empty outside a chapter run. */
  private active: readonly string[] = [];
  /** The first sprite's own load, which the first-bank cues (the title's press-start) wait on without waiting for the v2 set. */
  private firstBank: Promise<void> | null = null;
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
    this.firstBank = one(manifest.sfx, (b) => (this.v1 = b));
    this.loading = Promise.all([this.firstBank, one(manifest.sfxV2, (b) => (this.v2 = b))]).then(() => undefined);
    return this.loading;
  }

  /**
   * Fetch and decode the named parity packs (those the manifest lists and this page has not loaded yet). Never throws
   * and is never awaited by a caller that plays sound: a pack that has not arrived leaves the v2 slice in charge.
   */
  loadPacks(ctx: AudioContext, manifest: AudioManifest | null, baseUrl: string, names: readonly string[]): Promise<void> {
    if (!manifest || typeof fetch !== 'function') return Promise.resolve();
    const loads: Promise<void>[] = [];
    for (const name of names) {
      const sprite = manifest.sfxParity?.packs[name];
      if (!sprite) continue;
      let load = this.packLoads.get(name);
      if (!load) {
        load = (async () => {
          try {
            const response = await fetch(resolveAudioUrl(baseUrl, sprite.file));
            if (!response.ok) return;
            this.packs.set(name, await ctx.decodeAudioData(await response.arrayBuffer()));
          } catch {
            // The v2 slice or the first-bank stand-in covers it.
          }
        })();
        this.packLoads.set(name, load);
      }
      loads.push(load);
    }
    return Promise.all(loads).then(() => undefined);
  }

  /** The packs the running chapter consults, in lookup order; `[]` ends the run (the decoded buffers stay cached). */
  setActivePacks(names: readonly string[]): void {
    this.active = names;
  }

  /**
   * The slice for `key`.
   *
   * A `v2:` key: a parity pack's cue first (an active pack that has decoded and holds the name for this game, boss
   * packs before core), then the v2 sprite's slice once it has decoded, otherwise `null` with `fallback` naming the
   * first-bank cue to play instead. A first-bank cue: its slice from the first sprite when that has decoded.
   *
   * `game` is the chapter's game (`sfxGame()`); with none, no pack is consulted and no trim applies (rule 14: the
   * title, chapter select and FF7 hear exactly what they always did). `packs = false` skips the packs for a cue that
   * asked for its recorded originals by event name instead (`pickEvent`): the stand-in is then today's v2 slice.
   */
  pick(manifest: AudioManifest | null, key: string, game: TrimGame | null = null, packs = true): SfxPick {
    if (isV2Key(key)) {
      const name = v2Name(key);
      const parity = game && packs ? this.parityHit(manifest, name, game) : null;
      if (parity) return { slice: parity, fallback: null, via: 'parity', gain: 1 };
      const cue = manifest?.sfxV2?.cues[name];
      if (this.v2 && cue) return { slice: { buffer: this.v2, cue }, fallback: null, via: 'v2', gain: parityGain(game, name) };
      return { slice: null, fallback: v2Fallback(key), via: null, gain: 1 };
    }
    const cue = this.v1 && hasPrerenderedSfx(manifest, key) ? manifest!.sfx!.cues[key]! : null;
    return { slice: cue ? { buffer: this.v1!, cue } : null, fallback: null, via: cue ? 'sprite' : null, gain: 1 };
  }

  /**
   * The first recorded original `names` lists that an active, decoded pack holds for `game` (SFX parity, per event:
   * `sfxV2/eventCues.ts`). The names are tried in order, each across the packs in lookup order, so a chain
   * (`fire-3`, `fire-2`, `fire`) plays the closest original that exists. `null` when none is.
   */
  pickEvent(manifest: AudioManifest | null, names: readonly string[], game: TrimGame): { slice: SpriteSlice; name: string } | null {
    for (const name of names) {
      const slice = this.parityHit(manifest, name, game);
      if (slice) return { slice, name };
    }
    return null;
  }

  private parityHit(manifest: AudioManifest | null, name: string, game: TrimGame): SpriteSlice | null {
    for (const pack of this.active) {
      const buffer = this.packs.get(pack);
      const cue = manifest?.sfxParity?.packs[pack]?.cues[name];
      if (!buffer || !cue) continue;
      if (cue.game !== undefined && cue.game !== 'both' && cue.game !== game) continue;
      return { buffer, cue };
    }
    return null;
  }

  /** Settles when the first sprite's load (not the v2 set's) has finished; at once when none has started. */
  whenFirstBankLoaded(): Promise<void> {
    return this.firstBank ?? Promise.resolve();
  }

  record(entry: SfxPlayRecord): void {
    this.log.push(entry);
    if (this.log.length > LOG_SIZE) this.log.splice(0, this.log.length - LOG_SIZE);
  }

  get decoded(): { v1: boolean; v2: boolean; packs: string[] } {
    return { v1: this.v1 !== null, v2: this.v2 !== null, packs: [...this.packs.keys()] };
  }

  /** The packs the running chapter consults (`setActivePacks`). */
  get activePacks(): readonly string[] {
    return this.active;
  }

  clear(): void {
    this.v1 = null;
    this.v2 = null;
    this.packs.clear();
    this.packLoads.clear();
    this.active = [];
    this.loading = null;
    this.firstBank = null;
    this.log.length = 0;
  }
}
