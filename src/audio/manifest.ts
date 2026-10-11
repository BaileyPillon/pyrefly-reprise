/**
 * The pre-rendered audio manifest.
 *
 * `tools/audio/render.mjs` writes `public/audio/manifest.json`, listing every
 * cue it managed to render with sampled instruments. At runtime the game reads
 * it and, for any cue that is listed, fetches and decodes the MP3 instead of
 * synthesising it. Anything NOT listed still plays through the oscillator
 * voices exactly as before — the manifest is purely additive, so a half-
 * rendered manifest is a perfectly valid state and an absent one changes
 * nothing.
 *
 * Everything here is plain data and arithmetic: no fetch, no Web Audio, no
 * DOM. That is what lets the loop maths and the fallback rules be unit-tested
 * without a browser.
 */

export interface MusicEntry {
  /** Path relative to the manifest, e.g. "music/boss-seymour.mp3". */
  file: string;
  /** Loop points in seconds, measured on the rendered PCM. */
  loopStart: number;
  loopEnd: number;
  /** Total file duration in seconds, including the loop tail past loopEnd. */
  duration: number;
  bytes?: number;
  lufs?: number;
  truePeakDb?: number;
}

export interface SfxCue {
  /** Seconds into the sprite where this cue starts. */
  offset: number;
  /** How long to play, in seconds. */
  duration: number;
  /**
   * Parity-pack rows only (`sfxParity`, below): which game the cue belongs to (AGENTS.md rule 14). A pack is cut by
   * game, so a cue that names a different game than the chapter playing it is never found. Absent: any game.
   */
  game?: ParityGame;
  /** Parity-pack rows only: the mastered level (loudest 400 ms, K-weighted), which the audit holds to the row's target. */
  lufs?: number;
  /** Parity-pack rows only: the true peak after encoding, in dBTP. */
  truePeakDb?: number;
  /** Parity-pack rows only: the spec row this cue answers (`docs/audio/sfx-parity-plan.json`), for the record and the audit. */
  specRow?: string;
  /** Parity-pack rows only: ms from the cue's first sample to its first audible one, and to its peak (phase 2 timing). */
  onsetMs?: number;
  peakMs?: number;
}

/** The games a parity cue can belong to: one of the two, or both (the shared menu assets). */
export type ParityGame = 'ffx' | 'ffx2' | 'both';

export interface SfxSprite {
  file: string;
  duration: number;
  bytes?: number;
  cues: Record<string, SfxCue>;
}

/**
 * The third SFX source (SFX parity, 2026-10-10; `docs/handoff/sfx-parity.md`): recorded originals measured against
 * the games' own sound facts, cut into packs by game and by boss (`sfxV2/packs.ts`). A `v2:` cue is looked up here
 * first, then in the v2 sprite, then in the first bank, so a cue is never silent. An empty `packs` changes nothing.
 */
export interface SfxParity {
  packs: Record<string, SfxSprite>;
}

export interface AudioManifest {
  version: number;
  sampleRate: number;
  music: Record<string, MusicEntry>;
  sfx: SfxSprite | null;
  /** The recorded set of D-302 (`sfxV2/cues.ts`), a second sprite; `null` keeps every cue on the first. */
  sfxV2: SfxSprite | null;
  /** The parity packs, consulted before `sfxV2`; `{ packs: {} }` when none has shipped. */
  sfxParity: SfxParity;
}

export const EMPTY_MANIFEST: AudioManifest = {
  version: 1,
  sampleRate: 44100,
  music: {},
  sfx: null,
  sfxV2: null,
  sfxParity: { packs: {} },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finitePositive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Parse a manifest defensively.
 *
 * A malformed or truncated manifest must never break audio — it should just
 * mean "nothing is pre-rendered, synthesise it". So every entry is validated
 * individually and a bad one is dropped rather than throwing: a single cue
 * that failed to encode cannot take the other twenty with it.
 */
export function parseManifest(raw: unknown): AudioManifest {
  if (!isRecord(raw)) return EMPTY_MANIFEST;
  const music: Record<string, MusicEntry> = {};
  if (isRecord(raw.music)) {
    for (const [name, value] of Object.entries(raw.music)) {
      const entry = parseMusicEntry(value);
      if (entry) music[name] = entry;
    }
  }
  return {
    version: finitePositive(raw.version) ?? 1,
    sampleRate: finitePositive(raw.sampleRate) ?? 44100,
    music,
    sfx: parseSprite(raw.sfx),
    sfxV2: parseSprite(raw.sfxV2),
    sfxParity: parseParity(raw.sfxParity),
  };
}

/** A pack name is lower-case words joined by dashes (`ffx2-core`, `ffx2-leblanc`): it becomes a file name and a map key. */
const PACK_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseParity(value: unknown): SfxParity {
  const packs: Record<string, SfxSprite> = {};
  if (isRecord(value) && isRecord(value.packs)) {
    for (const [name, pack] of Object.entries(value.packs)) {
      if (!PACK_NAME.test(name)) continue;
      const sprite = parseSprite(pack, true);
      if (sprite) packs[name] = sprite;
    }
  }
  return { packs };
}

function parseMusicEntry(value: unknown): MusicEntry | null {
  if (!isRecord(value)) return null;
  if (typeof value.file !== 'string' || value.file.length === 0) return null;
  const loopStart = finitePositive(value.loopStart);
  const loopEnd = finitePositive(value.loopEnd);
  const duration = finitePositive(value.duration);
  if (loopStart === null || loopEnd === null || duration === null) return null;
  // A loop that ends before it starts, or runs past the file, is not usable.
  if (loopEnd <= loopStart || loopStart >= duration) return null;
  return {
    file: value.file,
    loopStart,
    loopEnd: Math.min(loopEnd, duration),
    duration,
    bytes: finitePositive(value.bytes) ?? undefined,
    lufs: typeof value.lufs === 'number' && Number.isFinite(value.lufs) ? value.lufs : undefined,
    truePeakDb:
      typeof value.truePeakDb === 'number' && Number.isFinite(value.truePeakDb)
        ? value.truePeakDb
        : undefined,
  };
}

function parseSprite(value: unknown, rich = false): SfxSprite | null {
  if (!isRecord(value)) return null;
  if (typeof value.file !== 'string' || value.file.length === 0) return null;
  const duration = finitePositive(value.duration);
  if (duration === null || !isRecord(value.cues)) return null;
  const cues: Record<string, SfxCue> = {};
  for (const [name, cue] of Object.entries(value.cues)) {
    if (!isRecord(cue)) continue;
    const offset = finitePositive(cue.offset);
    const dur = finitePositive(cue.duration);
    if (offset === null || dur === null || dur <= 0) continue;
    cues[name] = rich ? parseRichCue(cue, offset, dur) : { offset, duration: dur };
  }
  if (Object.keys(cues).length === 0) return null;
  return {
    file: value.file,
    duration,
    bytes: finitePositive(value.bytes) ?? undefined,
    cues,
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** A parity-pack cue keeps its record fields; the two older sprites' cues stay `{ offset, duration }` as they always were. */
function parseRichCue(cue: Record<string, unknown>, offset: number, duration: number): SfxCue {
  const out: SfxCue = { offset, duration };
  if (cue.game === 'ffx' || cue.game === 'ffx2' || cue.game === 'both') out.game = cue.game;
  const lufs = finiteNumber(cue.lufs);
  if (lufs !== undefined) out.lufs = lufs;
  const truePeakDb = finiteNumber(cue.truePeakDb);
  if (truePeakDb !== undefined) out.truePeakDb = truePeakDb;
  if (typeof cue.specRow === 'string' && cue.specRow.length > 0) out.specRow = cue.specRow;
  const onsetMs = finitePositive(cue.onsetMs);
  if (onsetMs !== null) out.onsetMs = onsetMs;
  const peakMs = finitePositive(cue.peakMs);
  if (peakMs !== null) out.peakMs = peakMs;
  return out;
}

/** Is there a pre-rendered file for this track? */
export function hasPrerenderedMusic(manifest: AudioManifest | null, name: string): boolean {
  return !!manifest && Object.prototype.hasOwnProperty.call(manifest.music, name);
}

export function musicEntry(manifest: AudioManifest | null, name: string): MusicEntry | null {
  if (!manifest) return null;
  return manifest.music[name] ?? null;
}

export function hasPrerenderedSfx(manifest: AudioManifest | null, name: string): boolean {
  return !!manifest?.sfx && Object.prototype.hasOwnProperty.call(manifest.sfx.cues, name);
}

export function sfxCue(manifest: AudioManifest | null, name: string): SfxCue | null {
  return manifest?.sfx?.cues[name] ?? null;
}

/** Resolve a manifest-relative path against the audio directory's URL. */
export function resolveAudioUrl(baseUrl: string, file: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}audio/${file}`;
}

export interface LoopPoints {
  loopStart: number;
  loopEnd: number;
}

/**
 * Clamp a manifest's loop points to what actually came back from the decoder.
 *
 * MP3 frames are 1152 samples, so a decoded buffer is very rarely the exact
 * length the encoder was handed, and browsers differ in how much of the
 * encoder delay and padding they strip. If `loopEnd` lands past the end of the
 * buffer, `AudioBufferSourceNode` silently ignores the loop and the music
 * stops dead at the end of the file — a bug that only shows up ninety seconds
 * in, which is the worst kind. So we always pull it back inside.
 *
 * The renderer's loop tail is what makes this safe: the three seconds after
 * `loopEnd` are a copy of the three seconds after `loopStart`, so shaving a
 * few milliseconds off the end still wraps onto matching material.
 */
export function clampLoopPoints(entry: MusicEntry, bufferDuration: number): LoopPoints {
  if (!Number.isFinite(bufferDuration) || bufferDuration <= 0) {
    return { loopStart: entry.loopStart, loopEnd: entry.loopEnd };
  }
  // One MP3 frame at 44.1 kHz, as a safety margin off the end.
  const margin = 1152 / 44100;
  const loopEnd = Math.min(entry.loopEnd, Math.max(0, bufferDuration - margin));
  const loopStart = Math.min(entry.loopStart, Math.max(0, loopEnd - margin));
  if (loopEnd <= loopStart) {
    // Degenerate (a very short or badly truncated file): loop the whole thing
    // rather than not looping at all.
    return { loopStart: 0, loopEnd: bufferDuration };
  }
  return { loopStart, loopEnd };
}

/**
 * Which cues to keep decoded.
 *
 * A decoded 90 second stereo AudioBuffer is about 30 MB of float samples, so
 * holding all twenty-one is a third of a gigabyte for no reason. The rule is
 * the current cue plus whatever is likely next — in practice the chapter's own
 * battle theme and its victory cue — and everything else is dropped.
 */
export function evictionPlan(
  cached: string[],
  current: string | null,
  upcoming: string[],
  keep = 3,
): string[] {
  const protectedSet = new Set<string>();
  if (current) protectedSet.add(current);
  for (const name of upcoming) {
    if (protectedSet.size >= keep) break;
    protectedSet.add(name);
  }
  return cached.filter((name) => !protectedSet.has(name));
}
