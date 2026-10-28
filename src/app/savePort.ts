/**
 * PORTABLE SAVES (ChatGPT point 9; the saves lane of 2026-10-28): the save as a file a player keeps, and the check
 * that decides whether a file is one.
 *
 * This is the SAVE-DATA CLASS (AGENTS.md "Release": a deep review before it goes public). It changes nothing in how
 * the game reads or writes its save today: it only builds a file from a copy of the save, and reads a file into a
 * migrated copy. Putting that copy into the store is `savePortFlow.ts` (and `SaveStore.replaceWith`); nothing in this
 * module touches storage, the DOM or the store. Pure: `text -> result`, `save -> text`.
 *
 * ## The file
 *
 * ```json
 * { "format": "echoes-of-spira-save", "formatVersion": 1, "saveVersion": 1,
 *   "exportedAt": "2026-10-28T16:00:00.000Z", "checksum": "sha256:<64 hex>", "save": { ...the save... } }
 * ```
 *
 * `checksum` is the SHA-256 of the canonical JSON of `save` (`savePortSha256.ts`: keys sorted, so the engine and the
 * key order do not matter). It catches a truncated, damaged or hand-edited file; it is not a lock.
 *
 * ## What a read refuses, in this order, and never touches the current save for
 *
 *  1. `too-large`: more than {@link MAX_SAVE_FILE_BYTES} (a real save is a few KB);
 *  2. `not-json`: not JSON, or JSON that is not an object (a leading byte-order mark is allowed);
 *  3. `not-a-save-file`: the `format` word is not ours (another game's file, a bare copy of the stored blob, a list);
 *  4. `newer-file`: a `formatVersion` this build does not know; `newer-save`: a `saveVersion` above {@link SAVE_VERSION}.
 *     Checked BEFORE the checksum, because a newer build may hash differently;
 *  5. `malformed`: a field of the envelope, or of the save inside it, with the wrong type or an impossible value
 *     (strict where `migrate` is lenient: `migrate` spreads a string into a map and throws on a null chapter record);
 *  6. `corrupt`: the checksum is not the one the save hashes to.
 *
 * An accepted file goes through the SAME `migrate` a reload uses, so an older save is upgraded exactly as a stored
 * one would be. Keys the build does not know are dropped at the top of the save, and kept in `settings` only as plain
 * values (a newer build at the same version number may have added a setting).
 *
 * Game case: both games (shared plumbing, `SaveData.ts`).
 */

import { SAVE_VERSION, defaultSettings, migrate, type SaveData } from './SaveData.ts';
import { canonicalJson, sha256Hex } from './savePortSha256.ts';

export const SAVE_FILE_FORMAT = 'echoes-of-spira-save';
export const SAVE_FILE_VERSION = 1;
/** A real save is a few KB; this is generous, and exists so a wrong file is refused before it is parsed. */
export const MAX_SAVE_FILE_BYTES = 512 * 1024;
export const CHECKSUM_PREFIX = 'sha256:';

const MAX_CHAPTERS = 200;
const MAX_LIST = 2000;
const MAX_FLAGS = 2000;
const MAX_SETTINGS = 300;
const MAX_ID = 200;
const MAX_TEXT = 1000;

export type RefusalCode = 'too-large' | 'not-json' | 'not-a-save-file' | 'newer-file' | 'newer-save' | 'malformed' | 'corrupt';

export interface Refusal {
  ok: false;
  code: RefusalCode;
  /** One plain sentence for the player. */
  message: string;
  /** Where it went wrong (a field path), for the debug line; absent for the codes that need none. */
  detail?: string;
}

/** What a save holds, in the few numbers a player can compare before replacing one with another. */
export interface SaveSummary {
  cleared: number;
  attempted: number;
  playTimeMs: number;
  unlocked: number;
  /** ms since epoch of the last write; 0 = never written. */
  updatedAt: number;
}

export interface Accepted {
  ok: true;
  /** The file's save, migrated to this build's schema, ready for `SaveStore.replaceWith`. */
  save: SaveData;
  summary: SaveSummary;
  /** When the file says it was made, or null. */
  exportedAt: string | null;
  /** The save version the file carries. */
  fileSaveVersion: number;
  /** True when the file's save version is older than this build's. */
  older: boolean;
}

const MESSAGES: Record<RefusalCode, string> = {
  'too-large': 'That file is too big to be a save file.',
  'not-json': 'That file cannot be read as a save file.',
  'not-a-save-file': 'That is not an Echoes of Spira save file.',
  'newer-file': 'That save file was made by a newer version of the game. Update the game and try again.',
  'newer-save': 'That save file was made by a newer version of the game. Update the game and try again.',
  malformed: 'That save file is damaged or incomplete.',
  corrupt: 'That save file does not match its checksum: it was changed or damaged after it was saved.',
};

const refuse = (code: RefusalCode, detail?: string): Refusal => (detail === undefined ? { ok: false, code, message: MESSAGES[code] } : { ok: false, code, message: MESSAGES[code], detail });

// ------------------------------------------------------------------ summary

export function summarizeSave(save: Readonly<SaveData>): SaveSummary {
  const records = Object.values(save.chapters ?? {});
  let playTimeMs = 0;
  for (const r of records) if (Number.isFinite(r.playTimeMs) && r.playTimeMs > 0) playTimeMs += r.playTimeMs;
  return {
    cleared: records.filter((r) => r.cleared === true).length,
    attempted: records.filter((r) => r.cleared === true || r.attempts > 0).length,
    playTimeMs,
    unlocked: Array.isArray(save.unlocked) ? save.unlocked.length : 0,
    updatedAt: Number.isFinite(save.updatedAt) ? save.updatedAt : 0,
  };
}

/** `1 H 12 M`, `42 M`, `UNDER A MINUTE`. */
export function formatPlayTime(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return 'UNDER A MINUTE';
  const h = Math.floor(minutes / 60);
  return h > 0 ? `${h} H ${minutes % 60} M` : `${minutes} M`;
}

const two = (n: number): string => String(n).padStart(2, '0');

/** `2026-10-28` in the player's own time zone. */
export function localDate(ms: number): string {
  const d = new Date(Number.isFinite(ms) ? ms : 0);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/** `3 CLEARED · 1 H 12 M PLAYED · LAST SAVED 2026-10-27`: one line a player can compare. */
export function describeSummary(s: SaveSummary): string {
  const saved = s.updatedAt > 0 ? `LAST SAVED ${localDate(s.updatedAt)}` : 'NEVER SAVED';
  return `${s.cleared} CLEARED · ${formatPlayTime(s.playTimeMs)} PLAYED · ${saved}`;
}

// ------------------------------------------------------------------- export

/** `echoes-of-spira-save-2026-10-28.json` (the player's local date). */
export function saveFileName(now: number): string {
  return `echoes-of-spira-save-${localDate(now)}.json`;
}

/**
 * The file text for `save`: the envelope above, two-space indented, one trailing newline. The checksum is taken over
 * a JSON round trip of the save, so it is the hash of exactly what a reader will parse back.
 */
export function buildSaveFile(save: Readonly<SaveData>, now: number): string {
  const copy = JSON.parse(JSON.stringify(save)) as SaveData;
  const when = new Date(Number.isFinite(now) ? now : 0);
  return (
    JSON.stringify(
      {
        format: SAVE_FILE_FORMAT,
        formatVersion: SAVE_FILE_VERSION,
        saveVersion: copy.version,
        exportedAt: when.toISOString(),
        checksum: CHECKSUM_PREFIX + sha256Hex(canonicalJson(copy)),
        save: copy,
      },
      null,
      2,
    ) + '\n'
  );
}

// ----------------------------------------------------------------- validate

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID;
/** Keys that name a prototype slot: never accepted as the key of a map the game writes into. */
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const okKey = (k: string): boolean => k.length > 0 && k.length <= MAX_ID && !BAD_KEYS.has(k);
/** A string, a finite number, a boolean or null: nothing nested. */
const isPlain = (v: unknown): boolean => (typeof v === 'string' ? v.length <= MAX_TEXT : typeof v === 'number' ? Number.isFinite(v) : typeof v === 'boolean' || v === null);
const VOLUMES = new Set(['masterVolume', 'musicVolume', 'sfxVolume', 'voiceVolume']);

function stringList(v: unknown, path: string): string | null {
  if (!Array.isArray(v)) return path;
  if (v.length > MAX_LIST) return `${path} (too long)`;
  return v.every(isId) ? null : `${path} (an entry)`;
}

function chapterIssue(id: string, rec: unknown): string | null {
  const at = `chapters.${id}`;
  if (!isObj(rec)) return at;
  if ('id' in rec && !isId(rec['id'])) return `${at}.id`;
  if (typeof rec['cleared'] !== 'boolean') return `${at}.cleared`;
  for (const k of ['bestTimeMs', 'bestTurns']) if (rec[k] !== null && !isNum(rec[k])) return `${at}.${k}`;
  if (!isNum(rec['attempts'])) return `${at}.attempts`;
  if ('playTimeMs' in rec && !isNum(rec['playTimeMs'])) return `${at}.playTimeMs`;
  // A key this build does not know (a newer build at the same version number) rides along only as a plain value.
  for (const k of Object.keys(rec)) if (!okKey(k) || !isPlain(rec[k])) return `${at}.${k.slice(0, 40)}`;
  return null;
}

function settingsIssue(settings: Obj): string | null {
  const keys = Object.keys(settings);
  if (keys.length > MAX_SETTINGS) return 'settings (too many)';
  const known = defaultSettings() as unknown as Obj;
  for (const k of keys) {
    const v = settings[k];
    const at = `settings.${k}`;
    if (!okKey(k)) return at;
    // Plain values only: nothing in the settings is nested, and a nested value would be carried into the store unchecked.
    if (typeof v === 'string' ? v.length > MAX_TEXT : typeof v === 'number' ? !Number.isFinite(v) : typeof v !== 'boolean') return at;
    if (k in known && typeof v !== typeof known[k]) return at;
    if (VOLUMES.has(k) && !isNum(v, 0, 1)) return at;
    if (k === 'textSpeed' && !isNum(v, 0.01, 16)) return at;
    if (k === 'ffx2Atb' && v !== 'active' && v !== 'wait') return at;
    if (k === 'ffx2AtbSpeed' && v !== 'slow' && v !== 'normal' && v !== 'fast') return at;
  }
  return null;
}

/**
 * The first thing wrong with `raw` as the save inside a file, as a field path, or null when it can go to `migrate`.
 * Optional (older saves lack them): `updatedAt`, `unlocked`, `seenCoach`, `settings`, `flags`. A field that is there
 * must be right; one that is `null` is wrong.
 */
export function saveIssue(raw: unknown, fileSaveVersion: number): string | null {
  if (!isObj(raw)) return 'save';
  if (raw['version'] !== fileSaveVersion) return 'save.version';
  if ('updatedAt' in raw && !isNum(raw['updatedAt'])) return 'save.updatedAt';
  const chapters = raw['chapters'];
  if (!isObj(chapters)) return 'save.chapters';
  const ids = Object.keys(chapters);
  if (ids.length > MAX_CHAPTERS) return 'save.chapters (too many)';
  for (const id of ids) {
    if (!okKey(id)) return `save.chapters (a key)`;
    const issue = chapterIssue(id, chapters[id]);
    if (issue) return `save.${issue}`;
  }
  for (const k of ['unlocked', 'seenCoach']) {
    if (k in raw) {
      const issue = stringList(raw[k], `save.${k}`);
      if (issue) return issue;
    }
  }
  if ('settings' in raw) {
    if (!isObj(raw['settings'])) return 'save.settings';
    const issue = settingsIssue(raw['settings']);
    if (issue) return `save.${issue}`;
  }
  if ('flags' in raw) {
    const flags = raw['flags'];
    if (!isObj(flags)) return 'save.flags';
    const keys = Object.keys(flags);
    if (keys.length > MAX_FLAGS) return 'save.flags (too many)';
    for (const k of keys) {
      const v = flags[k];
      const bad = !okKey(k) || (typeof v === 'string' ? v.length > MAX_TEXT : typeof v === 'number' ? !Number.isFinite(v) : typeof v !== 'boolean');
      if (bad) return `save.flags.${k.slice(0, 40)}`;
    }
  }
  return null;
}

// --------------------------------------------------------------------- read

/** Is `value` no deeper than `limit` levels of object or array? Iterative, so a hostile file cannot overflow the stack. */
export function withinDepth(value: unknown, limit: number): boolean {
  const stack: Array<[unknown, number]> = [[value, 1]];
  while (stack.length > 0) {
    const [v, depth] = stack.pop()!;
    if (typeof v !== 'object' || v === null) continue;
    if (depth > limit) return false;
    for (const child of Array.isArray(v) ? v : Object.values(v)) stack.push([child, depth + 1]);
  }
  return true;
}
/** A real save is four levels deep (save, chapters, a record, a value); this leaves room for a newer build's extras. */
const MAX_DEPTH = 12;

/**
 * Read a save file's text. Pure; never throws; never touches a store. See the module note for the order of refusals.
 */
export function readSaveFile(text: string): Accepted | Refusal {
  try {
    return readSaveFileUnguarded(text);
  } catch {
    // Belt and braces: a read must never throw into the page, whatever the file holds.
    return refuse('malformed', 'unexpected');
  }
}

function readSaveFileUnguarded(text: string): Accepted | Refusal {
  if (typeof text !== 'string') return refuse('not-json');
  if (text.length > MAX_SAVE_FILE_BYTES) return refuse('too-large');
  let file: unknown;
  try {
    file = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    return refuse('not-json');
  }
  if (!isObj(file)) return refuse('not-json');
  if (file['format'] !== SAVE_FILE_FORMAT) return refuse('not-a-save-file');

  const formatVersion = file['formatVersion'];
  if (typeof formatVersion !== 'number' || !Number.isInteger(formatVersion) || formatVersion < 1) return refuse('malformed', 'formatVersion');
  if (formatVersion > SAVE_FILE_VERSION) return refuse('newer-file');
  const saveVersion = file['saveVersion'];
  if (typeof saveVersion !== 'number' || !Number.isInteger(saveVersion) || saveVersion < 0) return refuse('malformed', 'saveVersion');
  if (saveVersion > SAVE_VERSION) return refuse('newer-save');

  const checksum = file['checksum'];
  if (typeof checksum !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(checksum)) return refuse('malformed', 'checksum');
  const exportedAt = file['exportedAt'];
  if (exportedAt !== undefined && (typeof exportedAt !== 'string' || exportedAt.length > 64)) return refuse('malformed', 'exportedAt');

  if (!withinDepth(file['save'], MAX_DEPTH)) return refuse('malformed', 'save (nesting)');
  const issue = saveIssue(file['save'], saveVersion);
  if (issue) return refuse('malformed', issue);
  if (CHECKSUM_PREFIX + sha256Hex(canonicalJson(file['save'])) !== checksum) return refuse('corrupt');

  const raw = file['save'] as Obj;
  const known: Partial<SaveData> = {
    version: saveVersion,
    chapters: raw['chapters'] as SaveData['chapters'],
    ...('updatedAt' in raw ? { updatedAt: raw['updatedAt'] as number } : {}),
    ...('unlocked' in raw ? { unlocked: raw['unlocked'] as string[] } : {}),
    ...('seenCoach' in raw ? { seenCoach: raw['seenCoach'] as string[] } : {}),
    ...('settings' in raw ? { settings: raw['settings'] as SaveData['settings'] } : {}),
    ...('flags' in raw ? { flags: raw['flags'] as SaveData['flags'] } : {}),
  };
  let save: SaveData;
  try {
    save = migrate(known);
  } catch {
    return refuse('malformed', 'save (migration)');
  }
  return {
    ok: true,
    save,
    summary: summarizeSave(save),
    exportedAt: typeof exportedAt === 'string' ? exportedAt : null,
    fileSaveVersion: saveVersion,
    older: saveVersion < SAVE_VERSION,
  };
}
