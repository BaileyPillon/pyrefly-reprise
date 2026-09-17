/**
 * Browser-side audio front end.
 *
 * Nothing is created until the first user gesture (browsers refuse to start an
 * AudioContext before one). Music is synthesised by `render.ts` inside a Web
 * Worker and cached as an AudioBuffer with exact loop points; on unlock, the
 * queued music's render is posted to that worker first so it never waits
 * behind SFX warm-up. SFX are warmed the same way, off the main thread, but a
 * few cues at a time (see SfxWarmer.ts) so a later music request only ever
 * waits behind one small chunk — falling back to a time-sliced main-thread
 * render if Workers are unavailable or the worker dies mid-batch. Either way,
 * `playSfx` on a cue that isn't warmed yet renders it on the main thread on
 * demand, exactly as before. No audio files are fetched — every sound is
 * generated code.
 */

import { MusicLoader } from './MusicLoader.ts';
import { TRACK_BLURBS, hasTrack, trackNames } from './tracks/index.ts';
import { SFX, SFX_GROUPS, renderSfx, resolveSfx, sfxNames } from './sfx/index.ts';
import { orderSfxForWarmup, warmSfxViaWorker } from './SfxWarmer.ts';

export interface AudioManagerOptions {
  masterVolume?: number;
  musicVolume?: number;
  sfxVolume?: number;
  /** Render music in a Worker (default true; falls back to the main thread). */
  useWorker?: boolean;
}

export interface PlayMusicOptions {
  /** Crossfade time in seconds (default 1.2). */
  fade?: number;
  /** Restart even if this track is already playing. */
  restart?: boolean;
  /** Per-track gain, default 1. */
  volume?: number;
}

export interface PlaySfxOptions {
  volume?: number;
  /** -1 left .. 1 right. */
  pan?: number;
  /** Playback-rate multiplier; 1.06 ≈ a semitone up. */
  pitch?: number;
  /** Seconds to wait before the cue fires. */
  delay?: number;
}

interface MusicSlot {
  name: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private duckBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private loader: MusicLoader;
  private sfxCache = new Map<string, AudioBuffer>();
  private current: MusicSlot | null = null;
  private fading: MusicSlot[] = [];
  private masterVolume: number;
  private musicVolume: number;
  private sfxVolume: number;
  private muted = false;
  private warmed = false;
  private queuedMusic: { name: string; options: PlayMusicOptions } | null = null;
  private musicRequestId = 0;

  constructor(options: AudioManagerOptions = {}) {
    this.masterVolume = options.masterVolume ?? 0.9;
    this.musicVolume = options.musicVolume ?? 0.7;
    this.sfxVolume = options.sfxVolume ?? 0.9;
    this.loader = new MusicLoader(options.useWorker ?? true);
  }

  get ready(): boolean {
    return this.ctx !== null;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get currentMusic(): string | null {
    return this.current?.name ?? null;
  }

  /**
   * Create the AudioContext. Must be called from a user gesture handler;
   * `installUnlockListeners()` wires that up for you.
   */
  unlock(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return true;
    }
    const Ctor: typeof AudioContext | undefined =
      typeof window === 'undefined'
        ? undefined
        : window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.duckBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.masterVolume;
    this.musicBus.gain.value = this.musicVolume;
    this.duckBus.gain.value = 1;
    this.sfxBus.gain.value = this.sfxVolume;
    this.musicBus.connect(this.duckBus);
    this.duckBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(ctx.destination);
    // Post the queued track's render to the worker before SFX warm-up starts,
    // so the title theme's first request lands ahead of it in the worker's
    // (single-threaded, FIFO) message queue and doesn't wait behind the bank.
    if (this.queuedMusic) {
      const queued = this.queuedMusic;
      this.queuedMusic = null;
      void this.playMusic(queued.name, queued.options);
    }
    this.warmSfx();
    return true;
  }

  /** One-shot listeners that unlock audio on the first real interaction. */
  installUnlockListeners(target: EventTarget | null = typeof window === 'undefined' ? null : window): void {
    if (!target) return;
    const handler = (): void => {
      if (this.unlock()) {
        for (const type of ['pointerdown', 'keydown', 'touchstart']) {
          target.removeEventListener(type, handler);
        }
      }
    };
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      target.addEventListener(type, handler);
    }
  }

  // ---------------------------------------------------------------- music ---

  /** Render tracks ahead of time so `playMusic` starts instantly. */
  async preload(names: string[] = trackNames()): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    await Promise.all(names.map((name) => this.loader.load(ctx, name)));
  }

  async playMusic(name: string, options: PlayMusicOptions = {}): Promise<void> {
    if (!hasTrack(name)) throw new Error(`Unknown track "${name}"`);
    if (!this.ctx) {
      // Remember the request; it starts as soon as the player touches something.
      this.queuedMusic = { name, options };
      return;
    }
    if (this.current?.name === name && !options.restart) return;
    // Rendering can take a second; if another screen asks for different music
    // while we wait, that newer request wins and this one is dropped.
    const request = ++this.musicRequestId;
    const looped = await this.loader.load(this.ctx, name);
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || request !== this.musicRequestId) return;
    const fade = Math.max(0.01, options.fade ?? 1.2);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.volume ?? 1), now + fade);
    const source = ctx.createBufferSource();
    source.buffer = looped.buffer;
    source.loop = true;
    source.loopStart = looped.loopStart;
    source.loopEnd = looped.loopEnd;
    source.connect(gain);
    gain.connect(this.musicBus);
    source.start(now);
    if (this.current) this.fadeOutSlot(this.current, fade);
    this.current = { name, source, gain };
  }

  stopMusic(fade = 0.8): void {
    this.musicRequestId++;
    if (this.current) this.fadeOutSlot(this.current, fade);
    this.current = null;
    this.queuedMusic = null;
  }

  /** Dip the music (dialogue, a summon, a victory sting) and bring it back. */
  duck(amount = 0.35, seconds = 0.15): void {
    if (!this.ctx || !this.duckBus) return;
    const now = this.ctx.currentTime;
    this.duckBus.gain.cancelScheduledValues(now);
    this.duckBus.gain.setValueAtTime(this.duckBus.gain.value, now);
    this.duckBus.gain.linearRampToValueAtTime(Math.max(0, amount), now + seconds);
  }

  unduck(seconds = 0.5): void {
    if (!this.ctx || !this.duckBus) return;
    const now = this.ctx.currentTime;
    this.duckBus.gain.cancelScheduledValues(now);
    this.duckBus.gain.setValueAtTime(this.duckBus.gain.value, now);
    this.duckBus.gain.linearRampToValueAtTime(1, now + seconds);
  }

  private fadeOutSlot(slot: MusicSlot, fade: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    slot.gain.gain.cancelScheduledValues(now);
    slot.gain.gain.setValueAtTime(Math.max(0.0001, slot.gain.gain.value), now);
    slot.gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    slot.source.stop(now + fade + 0.05);
    this.fading.push(slot);
    slot.source.onended = () => {
      slot.source.disconnect();
      slot.gain.disconnect();
      this.fading = this.fading.filter((s) => s !== slot);
    };
  }

  // ------------------------------------------------------------------ sfx ---

  /** Warm the SFX bank off the main thread, a few cues at a time (see
   *  SfxWarmer.ts for the chunking/priority order and why), falling back to
   *  a time-sliced main-thread render if Workers are unavailable or the
   *  worker dies mid-batch. */
  warmSfx(): void {
    if (this.warmed || !this.ctx) return;
    this.warmed = true;
    const names = orderSfxForWarmup(SFX_GROUPS);
    const worker = this.loader.getWorker();
    if (!worker) {
      this.warmSfxOnMainThread(names);
      return;
    }
    warmSfxViaWorker(worker, names, this.ctx.sampleRate, {
      cacheBuffer: (name, left, right) => this.cacheSfxBuffer(name, left, right),
      renderOnMainThread: (remaining) => this.warmSfxOnMainThread(remaining),
    });
  }

  /** Original fallback: synthesise a few cues at a time so the frame never stalls. */
  private warmSfxOnMainThread(names: string[]): void {
    let index = 0;
    const step = (): void => {
      const deadline = Date.now() + 6;
      while (index < names.length && Date.now() < deadline) {
        this.getSfxBuffer(names[index++]!);
      }
      if (index < names.length) setTimeout(step, 0);
    };
    setTimeout(step, 0);
  }

  /** Build an AudioBuffer from a worker's rendered cue and cache it — overwriting
   *  harmlessly if `playSfx` already rendered this cue on the main thread first. */
  private cacheSfxBuffer(name: string, left: Float32Array, right: Float32Array): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const buffer = ctx.createBuffer(2, left.length, ctx.sampleRate);
    buffer.getChannelData(0).set(left);
    buffer.getChannelData(1).set(right);
    this.sfxCache.set(name, buffer);
  }

  private getSfxBuffer(name: string): AudioBuffer | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    const cached = this.sfxCache.get(name);
    if (cached) return cached;
    const rendered = renderSfx(name, ctx.sampleRate);
    const buffer = ctx.createBuffer(2, rendered.left.length, ctx.sampleRate);
    buffer.getChannelData(0).set(rendered.left);
    buffer.getChannelData(1).set(rendered.right);
    this.sfxCache.set(name, buffer);
    return buffer;
  }

  playSfx(name: string, options: PlaySfxOptions = {}): void {
    // Aliases (an ability's authored `sfxKey`) resolve to the real cue, so the
    // buffer cache is keyed once per sound, not once per name for it.
    const cue = resolveSfx(name);
    if (cue === undefined) throw new Error(`Unknown sfx "${name}"`);
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const buffer = this.getSfxBuffer(cue);
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = options.pitch ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = options.volume ?? 1;
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, options.pan ?? 0));
    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxBus);
    source.start(ctx.currentTime + Math.max(0, options.delay ?? 0));
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      panner.disconnect();
    };
  }

  // ---------------------------------------------------------------- mixer ---

  setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.master && !this.muted) this.master.gain.value = this.masterVolume;
  }

  setMusicVolume(value: number): void {
    this.musicVolume = Math.max(0, Math.min(1, value));
    if (this.musicBus) this.musicBus.gain.value = this.musicVolume;
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value));
    if (this.sfxBus) this.sfxBus.gain.value = this.sfxVolume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : this.masterVolume;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Everything the debug overlay / `window.__pyrefly` needs to know. */
  debug(): {
    ready: boolean;
    sampleRate: number | null;
    playing: string | null;
    muted: boolean;
    volumes: { master: number; music: number; sfx: number };
    tracks: Array<{ name: string; about: string; cached: boolean }>;
    sfx: Array<{ name: string; about: string; cached: boolean }>;
  } {
    return {
      ready: this.ready,
      sampleRate: this.ctx?.sampleRate ?? null,
      playing: this.currentMusic,
      muted: this.muted,
      volumes: { master: this.masterVolume, music: this.musicVolume, sfx: this.sfxVolume },
      tracks: trackNames().map((name) => ({
        name,
        about: TRACK_BLURBS[name] ?? '',
        cached: this.loader.has(name),
      })),
      sfx: sfxNames().map((name) => ({
        name,
        about: SFX[name]?.about ?? '',
        cached: this.sfxCache.has(name),
      })),
    };
  }

  dispose(): void {
    this.stopMusic(0.05);
    this.loader.dispose();
    this.sfxCache.clear();
    void this.ctx?.close();
    this.ctx = null;
  }
}

/** Shared instance — the game only ever needs one. */
export const audio = new AudioManager();
