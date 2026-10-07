/**
 * A chapter's voice manifest: which of its lines have a recording, where the file is, and how long it runs.
 *
 * `tools/audio/voice-ship.mjs` writes `public/audio/voice/<chapter>.json` beside `public/audio/voice/<chapter>/<line id>.mp3`;
 * the game fetches the manifest when an FFX chapter starts and the files as lines come up. Everything here is plain data and
 * arithmetic (no fetch, no Web Audio, no DOM), so the parser and the path rules are unit-tested without a browser.
 *
 * A manifest that is absent, malformed or served as an HTML fallback page parses to `null`: the chapter is then text only, which
 * is exactly how the game played before any voice existed. Erasable-only TypeScript (the Node tools import this file).
 *
 * Game case: both (shared plumbing). Only FFX chapters have a manifest today (Bailey picked the FFX voices of Tidus, Yuna and
 * Auron on 2026-10-07; FFX-2 Yuna and every other speaker are unvoiced until he picks); `gameHasVoice` keeps FFX-2 from even asking.
 */

/** Folder under `public/audio/` that holds every recording and manifest. */
export const VOICE_AUDIO_DIR = 'voice';

/** The games whose chapters may play recorded lines. FFX-2 joins this list the day Bailey picks its voices. */
export const GAMES_WITH_VOICE: readonly string[] = ['ffx'];

export function gameHasVoice(game: string | undefined): boolean {
  return game !== undefined && GAMES_WITH_VOICE.includes(game);
}

/** One recorded line. */
export interface VoiceLineEntry {
  /** The inventory's line id (`seymour-flux.pre.017`): the recording's name. A repeated line points at the first occurrence's file. */
  id: string;
  /** Path under `public/audio/voice/`, e.g. `seymour-flux/seymour-flux.pre.017.mp3`. */
  file: string;
  /** The recording's length in milliseconds, measured from the shipped file. */
  ms: number;
  /** The speaker id the line is keyed under. */
  who: string;
}

export interface ChapterVoiceManifest {
  version: 1;
  chapter: string;
  game: string;
  /** Keyed by `lineKey(who, text)` (or a `SayStep.voiceKey`). */
  lines: Record<string, VoiceLineEntry>;
}

/** Where a chapter's manifest sits, relative to `public/audio/`. */
export const chapterManifestPath = (chapter: string): string => `${VOICE_AUDIO_DIR}/${chapter}.json`;
/** Where a recording sits, relative to `public/audio/`. */
export const voiceFilePath = (file: string): string => `${VOICE_AUDIO_DIR}/${file}`;

/** A recording's file name may only climb down from the voice folder: lowercase letters, digits, dots, dashes, slashes, `.mp3`. */
const SAFE_FILE = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*\.mp3$/i;
const MIN_MS = 80;
const MAX_MS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when `file` is a safe relative path to an mp3 (no `..`, no scheme, no leading slash). */
export function isSafeVoiceFile(file: unknown): file is string {
  return typeof file === 'string' && SAFE_FILE.test(file) && !file.includes('..');
}

/**
 * Parse a chapter manifest defensively. A bad entry is dropped on its own (one corrupt line never silences the chapter);
 * a manifest that names another chapter, an unvoiced game, or has no usable line is `null`.
 */
export function parseChapterVoiceManifest(raw: unknown, expectChapter?: string): ChapterVoiceManifest | null {
  if (!isRecord(raw) || raw['version'] !== 1) return null;
  const chapter = raw['chapter'];
  const game = raw['game'];
  if (typeof chapter !== 'string' || typeof game !== 'string') return null;
  if (expectChapter !== undefined && chapter !== expectChapter) return null;
  if (!gameHasVoice(game)) return null;
  const linesRaw = raw['lines'];
  if (!isRecord(linesRaw)) return null;
  const lines: Record<string, VoiceLineEntry> = {};
  for (const [key, value] of Object.entries(linesRaw)) {
    if (!isRecord(value)) continue;
    const id = value['id'];
    const file = value['file'];
    const ms = value['ms'];
    const who = value['who'];
    if (typeof id !== 'string' || typeof who !== 'string' || !isSafeVoiceFile(file)) continue;
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < MIN_MS || ms > MAX_MS) continue;
    lines[key] = { id, file, ms: Math.round(ms), who };
  }
  return Object.keys(lines).length > 0 ? { version: 1, chapter, game, lines } : null;
}

/** Which part of a script an entry belongs to, from its id (`<chapter>.<part>.<NNN>`): `mid` and `quip` lines are warmed with the chapter. */
export function partOfId(id: string): 'pre' | 'post' | 'mid' | 'quip' | 'other' {
  const part = /^[^.]+\.([a-z]+)(?:-[^.]*)?\.\d{3}(?:\.fb\d+)?$/.exec(id)?.[1];
  return part === 'pre' || part === 'post' || part === 'mid' || part === 'quip' ? part : 'other';
}
