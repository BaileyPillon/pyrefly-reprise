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
import { renderHallImpulse } from './dsp/hall.ts';
import {
  hasPrerenderedSfx,
  parseManifest,
  resolveAudioUrl,
  sfxCue,
  type AudioManifest,
} from './manifest.ts';

export interface AudioManagerOptions {
  masterVolume?: number;
  musicVolume?: number;
  sfxVolume?: number;
  /** Render music in a Worker (default true; falls back to the main thread). */
  useWorker?: boolean;
  /** Where `public/` is served from; the manifest sits at `<base>audio/`. */
  baseUrl?: string;
  /** Skip the pre-rendered path entirely and always synthesise. */
  synthOnly?: boolean;
}

export interface PlayMusicOptions {
  /** Crossfade time in **seconds** (default 1.2). See {@link fadeMsToSec}. */
  fade?: number;
  /** Restart even if this track is already playing. */
  restart?: boolean;
  /** Per-track gain, default 1. */
  volume?: number;
  /**
   * Cues this screen is likely to ask for next (a chapter's battle theme, its
   * victory sting). They are kept decoded; everything else is dropped.
   */
  upcoming?: string[];
}

/**
 * Converts a fade duration authored in **milliseconds** (the DSL's
 * `MusicStep.fade`, `MusicPhaseCue.fadeMs`, and every other authored fade in
 * `docs/`/`src/data`/`src/story`) into the **seconds** that
 * {@link PlayMusicOptions.fade} and {@link AudioManager.stopMusic} expect.
 *
 * PR-0089 (critic round 09): every screen-level port that forwards an
 * authored fade to `AudioManager` (`CutsceneScreen.ts`,
 * `BattleScreenCutscenes.ts`, `BattleEncounterChain.ts`) was passing the raw
 * millisecond value straight through, so a `1200`-ms crossfade scheduled a
 * 1200-*second* ramp: the chapter-select waltz kept playing and every boss or
 * phase theme stayed near silent for the length of the fight. Route every
 * ms-authored fade through this one function at the port boundary so the unit
 * mismatch cannot recur file by file.
 */
export function fadeMsToSec(fadeMs: number | undefined, fallbackMs: number): number {
  return (fadeMs ?? fallbackMs) / 1000;
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
  private limiter: DynamicsCompressorNode | null = null;
  private musicBus: GainNode | null = null;
  private duckBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private sfxDry: GainNode | null = null;
  private sfxSend: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
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
  private baseUrl: string;
  private synthOnly: boolean;
  private manifest: AudioManifest | null = null;
  private manifestLoad: Promise<void> | null = null;
  private sfxSprite: AudioBuffer | null = null;
  private spriteLoad: Promise<void> | null = null;

  constructor(options: AudioManagerOptions = {}) {
    this.masterVolume = options.masterVolume ?? 0.9;
    this.musicVolume = options.musicVolume ?? 0.7;
    this.sfxVolume = options.sfxVolume ?? 0.9;
    this.baseUrl =
      options.baseUrl ??
      ((typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL) || '/');
    this.synthOnly = options.synthOnly ?? false;
    this.loader = new MusicLoader(options.useWorker ?? true, this.baseUrl);
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

    this.buildSfxReverb(ctx);

    // A master limiter, last before the speakers. The music is already
    // mastered offline, but a big spell landing over a boss tutti can still
    // push the sum past full scale, and clipping is the single most
    // "cheap game" artefact there is. Slow release so it never pumps.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.limiter = limiter;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);

    void this.loadManifest();
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

  /**
   * Put the sound effects in the same room as the music.
   *
   * The pre-rendered cues were mixed through the concert hall in
   * `dsp/hall.ts`, so a dry sword hit on top of them sounds pasted on — two
   * recordings from two places. This runs that same hall's impulse response
   * through a ConvolverNode on a send from the SFX bus, so a steel ring and
   * the strings behind it decay into one space.
   *
   * The impulse is generated here rather than downloaded: it is the same code
   * the offline mix used, it costs no bytes, and it cannot go out of sync with
   * the music's room. Roughly 30 ms of maths on unlock.
   */
  private buildSfxReverb(ctx: AudioContext): void {
    const sfxBus = this.sfxBus;
    if (!sfxBus) return;
    this.sfxDry = ctx.createGain();
    this.sfxDry.gain.value = 1;
    this.sfxDry.connect(sfxBus);
    try {
      const impulse = renderHallImpulse(ctx.sampleRate, 1.8, {
        rt60: 2.2,
        hfDamping: 2.8,
        preDelay: 0.019,
        earlyLevel: 0.55,
        lowCutHz: 95,
      });
      const buffer = ctx.createBuffer(2, impulse.left.length, ctx.sampleRate);
      buffer.getChannelData(0).set(impulse.left);
      buffer.getChannelData(1).set(impulse.right);
      const convolver = ctx.createConvolver();
      convolver.normalize = true;
      convolver.buffer = buffer;
      const send = ctx.createGain();
      // Modest: effects should sit IN the hall, not swim in it.
      send.gain.value = 0.22;
      send.connect(convolver);
      convolver.connect(sfxBus);
      this.convolver = convolver;
      this.sfxSend = send;
    } catch {
      // No ConvolverNode (or an unusually strict context): dry effects still
      // play, they just do not share the room.
      this.convolver = null;
      this.sfxSend = null;
    }
  }

  /**
   * Read `public/audio/manifest.json`, which says which cues were pre-rendered.
   *
   * Failure is expected and fine: before anyone has run `npm run audio:render`
   * there is no manifest at all, and the game synthesises everything exactly
   * as it did before. So this never throws and never blocks playback.
   */
  private loadManifest(): Promise<void> {
    if (this.manifestLoad) return this.manifestLoad;
    if (this.synthOnly || typeof fetch !== 'function') {
      this.manifestLoad = Promise.resolve();
      return this.manifestLoad;
    }
    this.manifestLoad = (async () => {
      try {
        const response = await fetch(resolveAudioUrl(this.baseUrl, 'manifest.json'));
        if (!response.ok) return;
        this.manifest = parseManifest(await response.json());
        this.loader.setManifest(this.manifest);
      } catch {
        // No manifest: synthesise everything, as before.
      }
    })();
    return this.manifestLoad;
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
    // Wait for the manifest before choosing a route, or the very first cue of
    // the session would always synthesise while the file sat there unread.
    await this.loadManifest();
    if (request !== this.musicRequestId) return;
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
    // A decoded 90 second cue is ~30 MB of float samples. Keep the one
    // playing and the one most likely next; let the rest go.
    this.loader.evict(name, options.upcoming ?? []);
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
    void this.loadManifest().then(() => this.loadSfxSprite());
    const names = this.warmupList();
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

  /**
   * Which cues to synthesise on startup.
   *
   * With no sprite this is the whole bank, as before. With one, most cues will
   * come from the sprite and warming them would be wasted work — but the
   * sprite has to be fetched and decoded first, and a menu tick fired in that
   * window still has to be instant. So we keep warming the head of the
   * priority order (the UI and flow cues a player meets in the first seconds)
   * as an immediate fallback, and let the sprite cover everything else.
   */
  private warmupList(): string[] {
    const ordered = orderSfxForWarmup(SFX_GROUPS);
    const sprite = this.manifest?.sfx;
    if (!sprite) return ordered;
    const head = ordered.slice(0, 24);
    const uncovered = ordered.filter((name) => !hasPrerenderedSfx(this.manifest, name));
    return [...new Set([...head, ...uncovered])];
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

  /**
   * Fetch and decode the pre-rendered SFX sprite.
   *
   * One sprite rather than ~150 files: a hundred and fifty requests costs more
   * than one two-megabyte download, and LAME's gapless header means a cue's
   * stored offset into the decoded buffer is accurate enough to play with
   * `start(when, offset, duration)`.
   */
  private loadSfxSprite(): Promise<void> {
    if (this.spriteLoad) return this.spriteLoad;
    const sprite = this.manifest?.sfx;
    const ctx = this.ctx;
    if (!sprite || !ctx || typeof fetch !== 'function') {
      this.spriteLoad = Promise.resolve();
      return this.spriteLoad;
    }
    this.spriteLoad = (async () => {
      try {
        const response = await fetch(resolveAudioUrl(this.baseUrl, sprite.file));
        if (!response.ok) return;
        this.sfxSprite = await ctx.decodeAudioData(await response.arrayBuffer());
      } catch {
        // Synthesised cues cover it.
      }
    })();
    return this.spriteLoad;
  }

  playSfx(name: string, options: PlaySfxOptions = {}): void {
    // Aliases (an ability's authored `sfxKey`) resolve to the real cue, so the
    // buffer cache is keyed once per sound, not once per name for it.
    const cue = resolveSfx(name);
    if (cue === undefined) throw new Error(`Unknown sfx "${name}"`);
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;

    // Prefer the pre-rendered sprite when it has this cue AND it has already
    // decoded. Never wait for it: a UI tick that arrives 200 ms late is worse
    // than a synthesised one that arrives now, so a cue fired before the
    // sprite lands simply uses the oscillator version.
    const spriteCue =
      this.sfxSprite && hasPrerenderedSfx(this.manifest, cue) ? sfxCue(this.manifest, cue) : null;
    const buffer = spriteCue ? this.sfxSprite : this.getSfxBuffer(cue);
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
    // Dry to the bus, and a send into the shared hall so effects sit in the
    // same room the music was mixed in.
    panner.connect(this.sfxDry ?? this.sfxBus);
    if (this.sfxSend) panner.connect(this.sfxSend);
    const when = ctx.currentTime + Math.max(0, options.delay ?? 0);
    if (spriteCue) source.start(when, spriteCue.offset, spriteCue.duration);
    else source.start(when);
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

  /**
   * Push a whole set of saved volumes into the mixer at once.
   *
   * The three setters below already do the right thing whether or not
   * `unlock()` has run yet — they update the field `unlock()` reads when it
   * builds the gain nodes, *and* push straight to a live node when one
   * already exists — so calling this once, as early as the save file is
   * available, is enough to cover both "at boot" and "after the context
   * unlocks": `unlock()` never resets these fields, it only reads them.
   * See `critic/rounds/round-03.md:377-388` (round 03 blocker #5) — the bug
   * this exists to close was that nothing but `PauseScreen` ever called the
   * setters at all, so a saved mute or a lowered volume never reached the
   * mixer until the player opened pause.
   */
  applySettings(settings: { masterVolume: number; musicVolume: number; sfxVolume: number }): void {
    this.setMasterVolume(settings.masterVolume);
    this.setMusicVolume(settings.musicVolume);
    this.setSfxVolume(settings.sfxVolume);
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
    /**
     * The live gain of the current (fading-in) slot and every slot still
     * fading out, read straight off each `GainNode`. Added for PR-0089
     * (critic round 09): `playing` alone cannot show a stuck multi-minute
     * fade — a track can already be `current` while its gain is still near
     * `0.0001` seconds into a fade that was scheduled to take minutes.
     */
    music: { current: { name: string; gain: number } | null; fading: Array<{ name: string; gain: number }> };
    prerendered: { manifest: boolean; cues: number; sprite: boolean; spriteDecoded: boolean };
    tracks: Array<{ name: string; about: string; cached: boolean; source: string | null }>;
    sfx: Array<{ name: string; about: string; cached: boolean; prerendered: boolean }>;
  } {
    return {
      ready: this.ready,
      sampleRate: this.ctx?.sampleRate ?? null,
      playing: this.currentMusic,
      muted: this.muted,
      volumes: { master: this.masterVolume, music: this.musicVolume, sfx: this.sfxVolume },
      music: {
        current: this.current ? { name: this.current.name, gain: this.current.gain.gain.value } : null,
        fading: this.fading.map((s) => ({ name: s.name, gain: s.gain.gain.value })),
      },
      prerendered: {
        manifest: this.manifest !== null,
        cues: this.manifest ? Object.keys(this.manifest.music).length : 0,
        sprite: !!this.manifest?.sfx,
        spriteDecoded: this.sfxSprite !== null,
      },
      tracks: trackNames().map((name) => ({
        name,
        about: TRACK_BLURBS[name] ?? '',
        cached: this.loader.has(name),
        // "prerendered" or "synth" — which route actually produced what is
        // in the cache, which is the first thing to check when a cue sounds
        // wrong in the browser but right in the offline audition.
        source: this.loader.sourceOf(name),
      })),
      sfx: sfxNames().map((name) => ({
        name,
        about: SFX[name]?.about ?? '',
        cached: this.sfxCache.has(name),
        prerendered: hasPrerenderedSfx(this.manifest, name),
      })),
    };
  }

  dispose(): void {
    this.stopMusic(0.05);
    this.loader.dispose();
    this.sfxCache.clear();
    this.sfxSprite = null;
    this.spriteLoad = null;
    this.manifestLoad = null;
    this.convolver?.disconnect();
    this.sfxSend?.disconnect();
    this.sfxDry?.disconnect();
    this.limiter?.disconnect();
    void this.ctx?.close();
    this.ctx = null;
  }
}

/** Shared instance — the game only ever needs one. */
export const audio = new AudioManager();
