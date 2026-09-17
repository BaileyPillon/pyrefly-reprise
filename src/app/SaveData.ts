/**
 * Versioned localStorage save data.
 *
 * Nothing here is authoritative for a battle; it only records progress,
 * settings and unlocked flavour. Reads never throw: a corrupt or absent blob
 * falls back to defaults, and an older `version` goes through {@link migrate}.
 */

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'pyrefly-reprise:save:v1';

/**
 * A stored best time under this is not a play session — it is fallout from
 * the `best-time-flow` defect, where `BattleScreenFlow.runChapter` recorded
 * the raw wall clock before the Results panel's plausibility floor applied,
 * so an automated run at `speed: 'skip'` (every animation wait collapses to
 * zero) could write a sub-second "best time" that Chapter Select then
 * printed. `ui/common/resultsMath.ts`'s own floor (`MIN_PLAUSIBLE_WALL_CLOCK_MS`,
 * 1000 ms) is what the fixed code now checks a run against *before* ever
 * recording it; this constant is deliberately more conservative (5 s, not
 * 1 s) because it instead has to clean up saves already written by the
 * broken code, where the corrupt value could be the tick-based estimate
 * `clearTimeMs` falls back to (still small for a short automated fight)
 * rather than the raw millisecond count.
 */
export const IMPLAUSIBLE_BEST_TIME_MS = 5000;

export interface ChapterRecord {
  /** Chapter id from `data/encounters.ts`. */
  id: string;
  cleared: boolean;
  /** Best clear time in milliseconds, or null if never cleared. */
  bestTimeMs: number | null;
  /** Fewest turns taken on a clear, or null. */
  bestTurns: number | null;
  attempts: number;
}

export interface Settings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  /** Battle message speed multiplier; 1 = normal. */
  textSpeed: number;
  /** Skip cutscenes already seen. */
  skipSeenCutscenes: boolean;
  /** Reduce bloom/particles for weaker machines. */
  lowEffects: boolean;
  reduceMotion: boolean;
}

export interface SaveData {
  version: number;
  /** ms since epoch of the last write. */
  updatedAt: number;
  chapters: Record<string, ChapterRecord>;
  /** Ids of unlocked optional banter / bestiary entries. */
  unlocked: string[];
  settings: Settings;
  /** Free-form flags other systems can set without a schema change. */
  flags: Record<string, number | string | boolean>;
}

export function defaultSettings(): Settings {
  return {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.9,
    textSpeed: 1,
    skipSeenCutscenes: false,
    lowEffects: false,
    reduceMotion:
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    updatedAt: 0,
    chapters: {},
    unlocked: [],
    settings: defaultSettings(),
    flags: {},
  };
}

/**
 * Drop a chapter's stored best time if it is implausibly short
 * ({@link IMPLAUSIBLE_BEST_TIME_MS}) — leftover fallout from the
 * `best-time-flow` defect. The clear itself still happened (`cleared` and
 * `bestTurns` are left alone); only the untrustworthy timing is discarded,
 * so the next real clear can set a fresh, honest best time.
 */
function sanitizeChapters(chapters: Record<string, ChapterRecord>): Record<string, ChapterRecord> {
  const out: Record<string, ChapterRecord> = {};
  for (const [id, rec] of Object.entries(chapters)) {
    out[id] =
      rec.bestTimeMs !== null && rec.bestTimeMs < IMPLAUSIBLE_BEST_TIME_MS
        ? { ...rec, bestTimeMs: null }
        : rec;
  }
  return out;
}

/** Bring an older blob up to {@link SAVE_VERSION}. */
export function migrate(raw: Partial<SaveData> & { version?: number }): SaveData {
  const base = defaultSave();
  const out: SaveData = {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    chapters: sanitizeChapters({ ...base.chapters, ...(raw.chapters ?? {}) }),
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    flags: { ...base.flags, ...(raw.flags ?? {}) },
    unlocked: Array.isArray(raw.unlocked) ? [...raw.unlocked] : [],
  };
  return out;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function safeStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    const probe = '__pyrefly_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/**
 * The save file. One instance lives on {@link App}; screens read and write
 * through it and call {@link save} when something meaningful changes.
 */
export class SaveStore {
  private data: SaveData;
  private readonly storage: StorageLike | null;
  private readonly key: string;

  constructor(key = SAVE_KEY, storage: StorageLike | null = safeStorage()) {
    this.key = key;
    this.storage = storage;
    this.data = this.load();
  }

  /** Current in-memory save. Mutate through the helpers, not directly. */
  get value(): Readonly<SaveData> {
    return this.data;
  }

  get settings(): Readonly<Settings> {
    return this.data.settings;
  }

  load(): SaveData {
    if (!this.storage) return defaultSave();
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (typeof parsed !== 'object' || parsed === null) return defaultSave();
      return migrate(parsed);
    } catch {
      return defaultSave();
    }
  }

  save(): boolean {
    this.data.updatedAt = Date.now();
    if (!this.storage) return false;
    try {
      this.storage.setItem(this.key, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.data = defaultSave();
    try {
      this.storage?.removeItem(this.key);
    } catch {
      /* storage unavailable; in-memory reset still applies */
    }
  }

  // ------------------------------------------------------------- accessors

  chapter(id: string): ChapterRecord {
    const existing = this.data.chapters[id];
    if (existing) return existing;
    const fresh: ChapterRecord = {
      id,
      cleared: false,
      bestTimeMs: null,
      bestTurns: null,
      attempts: 0,
    };
    this.data.chapters[id] = fresh;
    return fresh;
  }

  recordAttempt(id: string): void {
    this.chapter(id).attempts += 1;
    this.save();
  }

  recordClear(id: string, timeMs: number, turns: number): void {
    const rec = this.chapter(id);
    rec.cleared = true;
    if (rec.bestTimeMs === null || timeMs < rec.bestTimeMs) rec.bestTimeMs = timeMs;
    if (rec.bestTurns === null || turns < rec.bestTurns) rec.bestTurns = turns;
    this.save();
  }

  isCleared(id: string): boolean {
    return this.data.chapters[id]?.cleared ?? false;
  }

  unlock(id: string): void {
    if (!this.data.unlocked.includes(id)) {
      this.data.unlocked.push(id);
      this.save();
    }
  }

  isUnlocked(id: string): boolean {
    return this.data.unlocked.includes(id);
  }

  setSettings(patch: Partial<Settings>): void {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  }

  setFlag(key: string, value: number | string | boolean): void {
    this.data.flags[key] = value;
    this.save();
  }

  getFlag(key: string): number | string | boolean | undefined {
    return this.data.flags[key];
  }

  /** Plain object for the debug API / e2e assertions. */
  snapshot(): SaveData {
    return JSON.parse(JSON.stringify(this.data)) as SaveData;
  }
}
