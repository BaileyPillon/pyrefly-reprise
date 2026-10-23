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
import { SFX_DEFAULT_VOLUME, sfxBusGain, sfxMixFromUrl, type SfxMix } from './sfxMix.ts';
import { cutFading, retireSlot, startSlotRamp, type MusicSlot } from './musicSlot.ts';
import { hasPrerenderedMusic, hasPrerenderedSfx, parseManifest, resolveAudioUrl, type AudioManifest } from './manifest.ts';
import { MusicWarmHold } from './MusicWarm.ts';
import { SfxSprites, type SfxPick } from './SfxSprites.ts';
import { startSfxSource, type ParityVoice } from './sfxSource.ts';
import { sfxGame, voiceKey, type SfxGame } from './sfxV2/voicing.ts';
import { isV2Key } from './sfxV2/cues.ts';
import { packsFor } from './sfxV2/packs.ts';
import { beatDelaySeconds } from './sfxV2/beatTiming.ts';
import { RETIRED_V2_CUES } from './sfxV2/retired.ts';
import { audioNewConfigured, audioNewOn } from './pass/passSwitch.ts'; // the sound pass (conference demo, decision 184): off unless ?audio=new / ?pack=demo in Chapter I or IV
import { uiRowFor } from './pass/passRecipes.ts';
import { dbToGain, safetyCurve } from './pass/passMix.ts';
import { passLogPush, passNow } from './pass/passLog.ts';
import { noteBlowAt } from './pass/passMask.ts';
import { baseSkipFor, playLayers, scheduleDip, sliceOnsetMs } from './pass/passMixer.ts';
import { landingDelayMs } from './pass/passPlanner.ts';
import type { DipPlan, PassPlan } from './pass/passTypes.ts';

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
  /** Motion sounds (`sfxV2/motionCues.ts`): play only the first `trimMs` of the cue, in output time. Absent: the whole cue. */
  trimMs?: number;
  /** Motion sounds: fade out over the last `fadeMs` of the cue (or of its trim). Absent: no fade. */
  fadeMs?: number;
  /**
   * SFX parity, per event (`sfxV2/eventCues.ts`): the recorded originals to look up for this cue, in order, in the
   * running chapter's parity packs. Given (even empty), the packs are consulted for these names ONLY, so a stand-in
   * that many events share never plays another event's recording; the first one a decoded pack holds plays instead of
   * the stand-in. Absent: the key is looked up by its own name, as before. Ignored outside a chapter (no game).
   */
  events?: readonly string[];
  /** Originals (by name) whose playing covers this cue: when one is the original playing, this stand-in stays silent. */
  coveredBy?: readonly string[];
  /**
   * Phase 2 timing: ms from this ask to the beat the cue's peak belongs on. A recorded original with a measured
   * `peakMs` starts `beatMs - peakMs` later so its peak lands on the beat (`sfxV2/beatTiming.ts`); nothing else is moved.
   */
  beatMs?: number;
  /** The audio pass (`audio/pass/`): layers under this cue, a base that starts on its first audible sample. Honoured only while the pass is on; absent: today's cue exactly. */
  pass?: PassPlan;
}

export type { ParityVoice };


export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private musicBus: GainNode | null = null;
  private duckBus: GainNode | null = null;
  /** The audio pass: the music's dip before a big blow (between the music bus and the duck bus; unity unless a dip runs) and the master makeup before the limiter (unity with the pass off). */
  private dipBus: GainNode | null = null;
  private passTrim: GainNode | null = null;
  private safety: WaveShaperNode | null = null;
  private passMakeupDb = 0;
  private passBoothDb = 0;
  private sfxBus: GainNode | null = null;
  /** Recorded voice-over: into `master`, not through `duckBus`, so ducking the music never ducks a line (voice-integration-design.md section 3). */
  private voiceBus: GainNode | null = null;
  private voiceVolume = 0.9;
  private voiceOn = true;
  private voiceDebug: (() => unknown) | null = null;
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
  /** `?sfxmix=` comparison trim (fb-0929-sfx); the default `b` is the shipped D-293 mix. */
  private readonly sfxMix: SfxMix = sfxMixFromUrl();
  private muted = false;
  private warmed = false;
  private queuedMusic: { name: string; options: PlayMusicOptions } | null = null;
  private musicRequestId = 0;
  /** The cue the newest still-loading request is for (PR-0226). */
  private pendingMusic: string | null = null;
  private baseUrl: string;
  private synthOnly: boolean;
  private manifest: AudioManifest | null = null;
  private manifestLoad: Promise<void> | null = null;
  /** The SFX sprites (first bank, D-302's recorded set, the parity packs) and the play log (`SfxSprites.ts`). */
  private readonly sprites = new SfxSprites();
  /** The parity packs the running chapter asked for, loaded once the context and the manifest exist (`loadParityPacks`). */
  private wantedPacks: readonly string[] = [];
  /** The cues a chapter run warmed and has not yet played: an eviction leaves them decoded (`warmMusic`, PR-0373). */
  private readonly warmHold = new MusicWarmHold();

  constructor(options: AudioManagerOptions = {}) {
    this.masterVolume = options.masterVolume ?? 0.9;
    this.musicVolume = options.musicVolume ?? 0.7;
    // Matches the save's new-profile default (D-293); the save pushes its own level at boot.
    this.sfxVolume = options.sfxVolume ?? SFX_DEFAULT_VOLUME;
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

  /** The cue the mixer is heading for: a request still decoding, else the one queued before unlock, else the one playing. */
  get requestedMusic(): string | null {
    if (!this.ctx) return this.queuedMusic?.name ?? null;
    return this.pendingMusic ?? this.currentMusic;
  }

  /**
   * Create the AudioContext. Must be called from a user gesture handler;
   * `installUnlockListeners()` wires that up for you.
   */
  unlock(): boolean {
    if (this.ctx) {
      if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') void this.ctx.resume().catch(() => {});
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
    this.sfxBus.gain.value = sfxBusGain(this.sfxVolume, this.sfxMix);
    this.dipBus = ctx.createGain();
    this.dipBus.gain.value = 1;
    this.musicBus.connect(this.dipBus);
    this.dipBus.connect(this.duckBus);
    this.duckBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.voiceBus = ctx.createGain();
    this.voiceBus.gain.value = this.voiceGain();
    this.voiceBus.connect(this.master);

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
    this.passTrim = ctx.createGain();
    this.passTrim.gain.value = dbToGain(this.passMakeupDb + this.passBoothDb);
    this.master.connect(this.passTrim);
    this.passTrim.connect(limiter);
    if (audioNewConfigured()) {
      // The address asks for the sound pass: the limiter feeds a shaper (null curve = untouched) that only the pass's makeup turns on. A page that never asks keeps the plain path.
      this.safety = ctx.createWaveShaper();
      this.safety.curve = null;
      limiter.connect(this.safety);
      this.safety.connect(ctx.destination);
    } else {
      limiter.connect(ctx.destination);
    }
    if (this.passMakeupDb !== 0 || this.passBoothDb !== 0) this.applyPassTrim(); // a chapter run that began before the context existed

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
    // Armed until the context actually runs, not merely exists: a context created by a gesture
    // the browser does not count (a first touch on iOS, a pad) stays suspended, and only a later
    // counted one (`touchend`, `click`, a key) can resume it (hotfix-music-overlap).
    const types = ['pointerdown', 'pointerup', 'keydown', 'touchstart', 'touchend', 'click'];
    const disarm = (): void => {
      for (const type of types) target.removeEventListener(type, handler);
    };
    const handler = (): void => {
      if (!this.unlock()) return;
      if (this.ctx?.state === 'running') disarm();
    };
    for (const type of types) target.addEventListener(type, handler);
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
    // Rendering can take a second; if another screen asks for different music
    // while we wait, that newer request wins and this one is dropped. That
    // holds for a request for the cue already playing too: it returns early,
    // but only after cancelling any other cue still decoding (PR-0226: a
    // pause cue that landed after resume took the battle theme's slot).
    const request = ++this.musicRequestId;
    this.pendingMusic = null;
    if (this.current?.name === name && !options.restart) return;
    this.pendingMusic = name;
    // Wait for the manifest before choosing a route, or the very first cue of
    // the session would always synthesise while the file sat there unread.
    await this.loadManifest();
    if (request !== this.musicRequestId) return;
    const looped = await this.loader.load(this.ctx, name).finally(() => {
      if (request === this.musicRequestId) this.pendingMusic = null;
    });
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || request !== this.musicRequestId) return;
    const fade = Math.max(0.01, options.fade ?? 1.2);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const ramp = startSlotRamp(gain, now, fade, options.volume ?? 1);
    const source = ctx.createBufferSource();
    source.buffer = looped.buffer;
    source.loop = true;
    source.loopStart = looped.loopStart;
    source.loopEnd = looped.loopEnd;
    source.connect(gain);
    gain.connect(this.musicBus);
    source.start(now);
    // One track in the slot: anything still fading is cleared, the current one crossfades out
    // (hotfix-music-overlap, `musicSlot.ts`).
    cutFading(ctx, this.fading);
    if (this.current) this.fadeOutSlot(this.current, fade);
    this.current = { name, source, gain, ramp };
    // A decoded 90 second cue is ~30 MB of float samples. Keep the one
    // playing and the one most likely next; let the rest go. The likely next
    // are the ones the caller names, then the ones a chapter run warmed and
    // has not played yet (PR-0373): without them this start would throw away
    // the boss and victory cues fetched for it. A cue still on its way, or
    // that never had a file, is not in the cache and takes no place in it.
    this.warmHold.played(name);
    const owed = this.warmHold.keep(name).filter((cue) => this.loader.has(cue));
    this.loader.evict(name, [...(options.upcoming ?? []), ...owed]);
  }

  /**
   * PR-0373: a chapter run starts (its card was just confirmed on the board). Fetch and decode these cues now, in the
   * order given (scene, boss, victory), so that none waits on a fetch when the run asks for it. Plays nothing and changes
   * nothing that plays or when. Never awaited, never throws, never blocks input: the pre-rendered manifest is read first,
   * then each cue is fetched after the one before it. A cue with no rendered file is left alone (synthesising one early
   * is a render, not a fetch), and with the audio still locked nothing is fetched. The cues are kept decoded until they
   * are played or the returned function is called when the run ends (see `MusicWarm.ts`). Only the cues it is given.
   */
  warmMusic(names: readonly string[]): () => void {
    const token = this.warmHold.begin(names.filter((name) => hasTrack(name)));
    void this.fetchWarm(token, names);
    return () => this.warmHold.release(token);
  }

  private async fetchWarm(token: number, names: readonly string[]): Promise<void> {
    const ctx = this.ctx;
    if (!ctx || this.synthOnly) return;
    try {
      await this.loadManifest();
      for (const name of names) {
        // A newer run, the end of this one, or a rebuilt context stops the fetching at the next cue.
        if (!this.warmHold.isCurrent(token) || this.ctx !== ctx) return;
        if (!hasTrack(name) || !hasPrerenderedMusic(this.manifest, name) || this.loader.has(name)) continue;
        await this.loader.load(ctx, name).catch(() => undefined);
      }
    } catch {
      /* a warm is a favour to the player, never a failure */
    }
  }

  stopMusic(fade = 0.8): void {
    this.musicRequestId++;
    this.pendingMusic = null;
    if (this.ctx) cutFading(this.ctx, this.fading);
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
    // From the level the slot is really at, never `gain.value` (1.0 until rendered); a slot
    // never heard is stopped outright (hotfix-music-overlap, `musicSlot.ts`).
    retireSlot(ctx, slot, fade);
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
    void this.loadManifest().then(() => this.ctx && this.sprites.load(this.ctx, this.manifest, this.baseUrl)).then(() => this.fetchWantedPacks());
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

  playSfx(name: string, options: PlaySfxOptions = {}): void {
    // A chapter's game voices the menu set (`sfxV2/voicing.ts`); a `v2:` key is D-302's recorded set,
    // which stands in with its first-bank cue until its sprite has decoded (`SfxSprites.pick`).
    const game = sfxGame();
    const voiced = voiceKey(name, game);
    // The sound pass (decision 184; Chapter I and IV only, off by default): a menu cue takes its place in the menu family (one level and length per cue, `pass/passRecipes.ts` UI_FAMILY).
    const pass = audioNewOn();
    if (pass && game) {
      const row = uiRowFor(game, voiced);
      if (row) {
        options = { ...options, volume: (options.volume ?? 1) * dbToGain(row.gainDb), trimMs: row.trimMs, fadeMs: row.fadeMs };
        passLogPush({ kind: 'ui', cue: voiced, gainDb: row.gainDb, trimMs: row.trimMs });
      }
    }
    // SFX parity, per event: the recorded originals this cue asks for (only in a chapter run, rule 14). Given, the packs
    // are consulted for those names alone; a stand-in that another original covers stays silent (`coveredBy`).
    const events = game ? options.events : undefined;
    const hit = game && events && events.length > 0 ? this.sprites.pickEvent(this.manifest, events, game) : null;
    if (game && events && !hit && options.coveredBy) {
      const covering = this.sprites.pickEvent(this.manifest, options.coveredBy, game);
      if (covering) {
        this.sprites.record({ t: (this.ctx?.currentTime ?? 0) + Math.max(0, options.delay ?? 0), asked: name, played: covering.name, via: 'parity', volume: 0, covered: true });
        if (pass && options.pass) this.playPassThump(name, options); // the recorded original covers the blow, but a big blow still gets its low end (the pass)
        return;
      }
    }
    const v2: SfxPick = hit
      ? { slice: hit.slice, fallback: null, via: 'parity', gain: 1 }
      : isV2Key(voiced)
        ? this.sprites.pick(this.manifest, voiced, game, events === undefined)
        : { slice: null, fallback: null, via: null, gain: 1 };
    // Aliases (an ability's authored `sfxKey`) resolve to the real cue, so the
    // buffer cache is keyed once per sound, not once per name for it.
    const cue = hit ? hit.name : v2.slice ? voiced : resolveSfx(v2.fallback ?? voiced);
    if (cue === undefined) throw new Error(`Unknown sfx "${name}"`);
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;

    // Prefer a sprite when it has this cue AND it has already decoded. Never wait for it: a UI tick
    // that arrives 200 ms late is worse than a synthesised one that arrives now.
    const spriteCue = v2.slice ?? this.sprites.pick(this.manifest, cue).slice;
    const buffer = spriteCue ? spriteCue.buffer : this.getSfxBuffer(cue);
    if (!buffer) return;
    // Phase 2: a recorded original starts so that its peak lands on the beat the presenter named (`beatMs`); nothing else moves.
    const lead = v2.via === 'parity' && v2.slice ? beatDelaySeconds(v2.slice.cue, options.beatMs) : 0;
    const delay = Math.max(0, options.delay ?? 0) + lead;
    this.sprites.record({
      t: ctx.currentTime + delay,
      asked: name,
      played: cue,
      via: v2.slice ? (v2.via ?? 'v2') : spriteCue ? 'sprite' : 'synth',
      volume: options.volume ?? 1,
      ...(v2.slice && v2.gain !== 1 ? { trimDb: Math.round(200 * Math.log10(v2.gain)) / 10 } : {}),
      ...(lead > 0 ? { leadMs: Math.round(lead * 1000) } : {}),
    });
    // The caller's volume, times the P1 mix's per-cue trim for a v2 slice (`sfxV2/parityMix.ts`; 1 for everything else).
    const level = (options.volume ?? 1) * v2.gain;
    const plan = pass ? options.pass : undefined;
    if (!plan || !spriteCue) {
      startSfxSource(ctx, { dry: this.sfxDry ?? this.sfxBus!, send: this.sfxSend }, buffer, spriteCue, level, options, delay, false);
      return;
    }
    this.playPassed(ctx, name, cue, buffer, spriteCue, level, options, delay, plan);
  }

  /**
   * The audio pass's blow: the base cue starts at its first audible sample (a recorded dagger hit carries 168 ms of near-silence, so asked for at the contact it was heard 168 ms late) and its layers
   * are laid on that sample (`audio/pass/passMixer.ts`). The layers are slices of the v2 sprite and the first bank that have already decoded; one that has not is left out.
   */
  private playPassed(ctx: AudioContext, name: string, cue: string, buffer: AudioBuffer, slice: NonNullable<SfxPick['slice']>, level: number, options: PlaySfxOptions, delay0: number, plan: PassPlan): void {
    let delay = delay0;
    const skip = plan.baseSkip ? baseSkipFor(slice) : 0;
    const onset = sliceOnsetMs(slice);
    const audibleS = Math.max(0, onset - skip) / 1000;
    const outs = { dry: this.sfxDry ?? this.sfxBus!, send: this.sfxSend };
    // A spell's landing waits for the effect's mark (its own remaining wait less the silence still in front of the sound once the skip is taken); a blow's contact is where it was asked.
    delay += plan.landingMs ? landingDelayMs(plan.landingMs, Math.max(0, onset - skip)) / 1000 : 0;
    startSfxSource(ctx, outs, buffer, slice, level, skip > 0 ? { ...options, skipMs: skip } : options, delay, false);
    const played = playLayers(
      { ctx, dry: outs.dry, send: outs.send, slice: (key) => (key.startsWith('v2:') ? this.sprites.pick(this.manifest, key, null, false).slice : this.sprites.pick(this.manifest, key).slice) },
      plan.layers,
      level,
      audibleS,
      delay,
    );
    for (const p of played) this.sprites.record({ t: ctx.currentTime + p.atS, asked: name, played: p.key, via: p.key.startsWith('v2:') ? 'v2' : 'sprite', volume: p.volume, layer: p.role });
    noteBlowAt(passNow() + delay * 1000); // the motion sounds keep off the blow (`pass/passMask.ts`)
    passLogPush({ kind: 'hit', cue, ...(plan.landingMs ? { landingMs: plan.landingMs, delayMs: Math.round((delay - delay0) * 1000) } : {}), skipMs: Math.round(skip * 10) / 10, onsetMs: Math.round(onset * 10) / 10, audibleMs: Math.round(audibleS * 10000) / 10, big: plan.big ?? null, layers: played.map((p) => `${p.role}:${p.key}`) });
  }

  // ------------------------------------------------------------------ the sound pass ---

  /** A blow whose own cue is covered by a recorded original (Cross Cleave's 6 s sample) still gets the pass's thump, on the ask. */
  private playPassThump(name: string, options: PlaySfxOptions): void {
    const ctx = this.ctx;
    const plan = options.pass;
    if (!ctx || !this.sfxBus || !plan) return;
    const thump = plan.layers.filter((l) => l.role === 'thump');
    if (thump.length === 0) return;
    const delay = Math.max(0, options.delay ?? 0);
    const played = playLayers({ ctx, dry: this.sfxDry ?? this.sfxBus, send: this.sfxSend, slice: (key) => (key.startsWith('v2:') ? this.sprites.pick(this.manifest, key, null, false).slice : this.sprites.pick(this.manifest, key).slice) }, thump, options.volume ?? 1, 0, delay);
    for (const p of played) this.sprites.record({ t: ctx.currentTime + p.atS, asked: name, played: p.key, via: 'v2', volume: p.volume, layer: p.role });
    passLogPush({ kind: 'hit', cue: name, covered: true, big: plan.big ?? null, layers: played.map((p) => `${p.role}:${p.key}`) });
  }

  /**
   * Dip the music for a blow `aheadMs` away (the sound pass, `audio/pass/`): a gain on its own bus between the music bus and the duck bus, so the voice's and the pause menu's ducks are untouched.
   * Does nothing before the context exists or with the pass off.
   */
  musicDip(aheadMs: number, plan: DipPlan): void {
    if (!this.ctx || !this.dipBus || !audioNewOn()) return;
    scheduleDip(this.ctx, this.dipBus.gain, aheadMs, plan);
  }

  /** The master makeup (dB, before the limiter) the pass adds for a demo chapter run; 0 puts the master back exactly. */
  setPassMakeup(db: number): void {
    this.passMakeupDb = db;
    this.applyPassTrim();
  }

  /** The booth's whole-mix trim (dB) for the attract reel; 0 puts it back. */
  setPassBoothTrim(db: number): void {
    this.passBoothDb = db;
    this.applyPassTrim();
  }

  private applyPassTrim(): void {
    if (!this.ctx || !this.passTrim) return;
    const g = this.passTrim.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(dbToGain(this.passMakeupDb + this.passBoothDb), now, 0.08);
    if (this.safety) {
      // The makeup raises the peaks into the limiter, which overshoots its threshold: the safety shaper (a soft ceiling at -1.5 dBFS, 4x oversampled) bends what gets through. Off: a null curve passes the signal unchanged.
      const on = this.passMakeupDb > 0;
      this.safety.curve = on ? safetyCurve() : null;
      this.safety.oversample = on ? '4x' : 'none';
    }
  }

  /** What the pass holds right now, for `__pyrefly.audioPass()`: no shape the tests pin. */
  passState(): { on: boolean; makeupDb: number; boothDb: number; dip: number | null; trim: number | null } {
    return { on: audioNewOn(), makeupDb: this.passMakeupDb, boothDb: this.passBoothDb, dip: this.dipBus ? Math.round(this.dipBus.gain.value * 1000) / 1000 : null, trim: this.passTrim ? Math.round(this.passTrim.gain.value * 1000) / 1000 : null };
  }

  /**
   * SFX parity flow hooks (`sfxV2/flowSlots.ts`): play a recorded original and nothing else. The first of `events`
   * a decoded, active pack holds plays (looped inside its slice when `loop`); with none there is no sound at all,
   * because these moments have never had one (the encounter's shatter and fade-in, the results tally). Returns a
   * handle to stop it, or `null` when nothing played. Only in a chapter run (rule 14), never throws.
   */
  playParityOnly(events: readonly string[], options: PlaySfxOptions & { loop?: boolean } = {}): ParityVoice | null {
    const game = sfxGame();
    const ctx = this.ctx;
    if (!game || !ctx || !this.sfxBus) return null;
    const hit = this.sprites.pickEvent(this.manifest, events, game);
    if (!hit) return null;
    const delay = Math.max(0, options.delay ?? 0);
    this.sprites.record({ t: ctx.currentTime + delay, asked: events[0] ?? '', played: hit.name, via: 'parity', volume: options.volume ?? 1 });
    try {
      return startSfxSource(ctx, { dry: this.sfxDry ?? this.sfxBus, send: this.sfxSend }, hit.slice.buffer, hit.slice, options.volume ?? 1, options, delay, options.loop === true);
    } catch {
      return null;
    }
  }

  /**
   * SFX parity: a chapter run of `game` starts. Fetch the game's core pack and the chapter's boss packs (those the
   * manifest lists; none has to) and consult them first for `v2:` cues until {@link releaseParityPacks}. Never
   * awaited and never throws: a pack that has not decoded yet leaves the v2 slice, then the first-bank cue, playing,
   * so no cue is ever silent. Called by `sfxChapter` (`src/app/sfxGame.ts`), never at unlock, so the title, chapter
   * select and FF7 load nothing. Game case: both, each game its own packs (`sfxV2/packs.ts`).
   */
  loadParityPacks(game: SfxGame, chapterId: string | null): void {
    this.wantedPacks = packsFor(game, chapterId);
    this.sprites.setActivePacks(this.wantedPacks);
    this.fetchWantedPacks();
  }

  /** The chapter run ended: no pack is consulted until the next one (decoded buffers stay cached for a retry). */
  releaseParityPacks(): void {
    this.wantedPacks = [];
    this.sprites.setActivePacks([]);
  }

  private fetchWantedPacks(): void {
    if (!this.ctx || this.wantedPacks.length === 0) return; // not unlocked yet: `warmSfx` calls this once it is
    const ctx = this.ctx;
    void this.loadManifest().then(() => this.manifest && this.sprites.loadPacks(ctx, this.manifest, this.baseUrl, this.wantedPacks));
  }

  /**
   * PR-0326 (CHK-001 step 3): play `name` only from its pre-rendered sprite, never from the
   * synthesised stand-in `playSfx` falls back to before the sprite has decoded.
   *
   * The title's press-start cue is usually the very press that unlocks audio, so the sprite is
   * still being fetched and the cue used to be the arcade synth in every session. This waits for
   * the decode, at most `waitMs`, and plays nothing when it does not arrive or the sprite lacks
   * the cue. Where no sprite exists at all (no manifest: the synth-only build) the synth is the
   * design, not a fallback, so the cue plays as before. Resolves `true` when a cue was played.
   *
   * Game case: shared plumbing (both). FF7 and the game-less screens use the same bank.
   */
  async playSfxFromSprite(name: string, options: PlaySfxOptions = {}, waitMs = 1200): Promise<boolean> {
    if (!this.ctx) return false;
    await this.loadManifest();
    if (!this.manifest?.sfx) {
      this.playSfx(name, options);
      return true;
    }
    if (!this.sprites.decoded.v1) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([this.sprites.whenFirstBankLoaded(), new Promise<void>((resolve) => { timer = setTimeout(resolve, waitMs); })]);
      clearTimeout(timer);
    }
    const cue = resolveSfx(name);
    if (cue === undefined || !this.sprites.pick(this.manifest, cue).slice) return false;
    this.playSfx(name, options);
    return true;
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
    if (this.sfxBus) this.sfxBus.gain.value = sfxBusGain(this.sfxVolume, this.sfxMix);
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
  applySettings(settings: { masterVolume: number; musicVolume: number; sfxVolume: number; voiceVolume?: number; voiceOn?: boolean }): void {
    this.setMasterVolume(settings.masterVolume);
    this.setMusicVolume(settings.musicVolume);
    this.setSfxVolume(settings.sfxVolume);
    if (typeof settings.voiceVolume === 'number' && Number.isFinite(settings.voiceVolume)) this.setVoiceVolume(settings.voiceVolume);
    if (typeof settings.voiceOn === 'boolean') this.setVoiceOn(settings.voiceOn);
  }

  // ---------------------------------------------------------------- voice ---

  private voiceGain(): number {
    return this.voiceOn ? this.voiceVolume : 0;
  }

  setVoiceVolume(value: number): void {
    this.voiceVolume = Math.max(0, Math.min(1, value));
    if (this.voiceBus) this.voiceBus.gain.value = this.voiceGain();
  }

  /** The VOICE-OVER switch (OPTIONS): off keeps the voice bus silent and `voiceEnabled` false, so no line starts. */
  setVoiceOn(on: boolean): void {
    this.voiceOn = on;
    if (this.voiceBus) this.voiceBus.gain.value = this.voiceGain();
  }

  /** True when a recorded line would be heard: the switch is on and the voice slider is above zero. */
  get voiceEnabled(): boolean {
    return this.voiceOn && this.voiceVolume > 0;
  }

  /** Where a voice run connects (`null` until the context exists). Not through the duck bus. */
  get voiceDestination(): AudioNode | null {
    return this.voiceBus;
  }

  /** The base the manifest and every file resolve against (`resolveAudioUrl`). */
  get audioBaseUrl(): string {
    return this.baseUrl;
  }

  /** The voice director registers its block for `debug()` here (the hook-up is provable without ears). */
  setVoiceDebug(provider: (() => unknown) | null): void {
    this.voiceDebug = provider;
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
    /** The voice bus level in force (0 when VOICE-OVER is off), beside `volumes`, whose shape tests pin. */
    voiceVolume: number;
    /** The voice director's block: chapter, cache, the last plays (`audio/voice/VoiceDirector.ts`); `null` until it registers. */
    voice: unknown;
    /** The `?sfxmix=` option in force and the SFX bus gain it gives (fb-0929-sfx). */
    sfxMix: { option: string; trim: number; busGain: number };
    /**
     * The live gain of the current (fading-in) slot and every slot still
     * fading out, read straight off each `GainNode`. Added for PR-0089
     * (critic round 09): `playing` alone cannot show a stuck multi-minute
     * fade — a track can already be `current` while its gain is still near
     * `0.0001` seconds into a fade that was scheduled to take minutes.
     */
    music: { current: { name: string; gain: number } | null; fading: Array<{ name: string; gain: number }>; held: string[] };
    prerendered: { manifest: boolean; cues: number; sprite: boolean; spriteDecoded: boolean; v2: { cues: number; decoded: boolean; game: string | null; retired: number }; parity: { packs: string[]; active: string[]; decoded: string[] } };
    /** The last plays: asked, played, from where (`SfxSprites.ts`); the hookup's proof without ears. */
    sfxLog: SfxSprites['log'];
    tracks: Array<{ name: string; about: string; cached: boolean; source: string | null }>;
    sfx: Array<{ name: string; about: string; cached: boolean; prerendered: boolean }>;
  } {
    return {
      ready: this.ready,
      sampleRate: this.ctx?.sampleRate ?? null,
      playing: this.currentMusic,
      muted: this.muted,
      volumes: { master: this.masterVolume, music: this.musicVolume, sfx: this.sfxVolume },
      voiceVolume: this.voiceGain(),
      voice: this.voiceDebug?.() ?? null,
      sfxMix: { option: this.sfxMix.option, trim: this.sfxMix.trim, busGain: sfxBusGain(this.sfxVolume, this.sfxMix) },
      music: {
        current: this.current ? { name: this.current.name, gain: this.current.gain.gain.value } : null,
        fading: this.fading.map((s) => ({ name: s.name, gain: s.gain.gain.value })),
        held: this.warmHold.held(),
      },
      prerendered: {
        manifest: this.manifest !== null,
        cues: this.manifest ? Object.keys(this.manifest.music).length : 0,
        sprite: !!this.manifest?.sfx,
        spriteDecoded: this.sprites.decoded.v1,
        v2: { cues: Object.keys(this.manifest?.sfxV2?.cues ?? {}).length, decoded: this.sprites.decoded.v2, game: sfxGame(), retired: RETIRED_V2_CUES.length },
        parity: { packs: Object.keys(this.manifest?.sfxParity?.packs ?? {}), active: [...this.sprites.activePacks], decoded: this.sprites.decoded.packs },
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
      sfxLog: this.sprites.log.slice(),
    };
  }

  dispose(): void {
    this.stopMusic(0.05);
    this.loader.dispose();
    this.sfxCache.clear();
    this.sprites.clear();
    this.manifestLoad = null;
    this.convolver?.disconnect();
    this.sfxSend?.disconnect();
    this.sfxDry?.disconnect();
    this.voiceBus?.disconnect();
    this.voiceBus = null;
    this.limiter?.disconnect();
    void this.ctx?.close();
    this.ctx = null;
  }
}

/** Shared instance — the game only ever needs one. */
export const audio = new AudioManager();
