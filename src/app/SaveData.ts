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
  /**
   * Total real time spent **playing** this chapter, in milliseconds, across
   * every attempt — the pause screen's PLAY TIME row.
   *
   * Deliberately not `bestTimeMs`, which is one clear's stopwatch and resets
   * to the best of them. This only ever grows, and it counts *played* time:
   * {@link SaveStore.addPlayTime} is fed from `BattleScreen.update`, which the
   * App loop stops calling the moment another screen (the pause overlay) is on
   * top. Time spent staring at the pause menu is therefore not play time,
   * which is the whole point of showing the number there.
   */
  playTimeMs: number;
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
  /**
   * Show the in-battle strategy guide (`src/ui/common/StrategyGuide.ts`).
   *
   * **Defaults to `true`**, so the panel is up the first time a chapter is
   * played and the player is told what the encounter was designed around
   * before they have to guess. It is a preference, not progress: once they
   * press G (or the panel's own chip) the answer is remembered here for every
   * later battle, including the ones they have not reached yet.
   */
  guideVisible: boolean;
  /**
   * FFX-2's ATB mode, the Active/Wait toggle from the original config menu —
   * `'active'` lets the gauges keep filling while a command menu is open,
   * `'wait'` freezes them until the command is chosen.
   *
   * Stored here (rather than per-chapter) because it is a preference, like
   * {@link Settings.guideVisible}: the player sets it once and every FFX-2
   * chapter honours it. The pause screen's OPTIONS row is what writes it.
   */
  ffx2Atb: 'active' | 'wait';
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
    guideVisible: true,
    ffx2Atb: 'active',
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
    // `playTimeMs` is younger than the oldest saves in the wild and there is
    // no honest way to reconstruct it, so a record without one starts at zero
    // rather than borrowing `bestTimeMs` (one clear is not a play history).
    const playTimeMs = Number.isFinite(rec.playTimeMs) && rec.playTimeMs > 0 ? rec.playTimeMs : 0;
    const bestTimeMs =
      rec.bestTimeMs !== null && rec.bestTimeMs < IMPLAUSIBLE_BEST_TIME_MS ? null : rec.bestTimeMs;
    out[id] = { ...rec, bestTimeMs, playTimeMs };
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
/**
 * Play time piles up in memory and is written out once this much of it is
 * unsaved. 5 s is short enough that a browser crash loses a trivial amount and
 * long enough that a 60 fps battle writes twelve times a minute, not 3 600.
 */
export const PLAY_TIME_FLUSH_MS = 5000;

/** Largest single {@link SaveStore.addPlayTime} delta that is believed. */
export const MAX_PLAY_TIME_STEP_MS = 1000;

export class SaveStore {
  private data: SaveData;
  private readonly storage: StorageLike | null;
  private readonly key: string;
  /** Play time added since the last write. See {@link SaveStore.addPlayTime}. */
  private unflushedPlayTimeMs = 0;

  constructor(key = SAVE_KEY, storage: StorageLike | null = safeStorage()) {
    this.key = key;
    this.storage = storage;
    this.data = this.load();
    activeStore = this;
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
    this.unflushedPlayTimeMs = 0;
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
      playTimeMs: 0,
    };
    this.data.chapters[id] = fresh;
    return fresh;
  }

  // --------------------------------------------------------- play time

  /**
   * Add played milliseconds to a chapter's running total.
   *
   * Called once per frame from `BattleScreen.update`, so it must not hit
   * `localStorage` once per frame: the total is accumulated in memory and
   * only written out once {@link PLAY_TIME_FLUSH_MS} of unsaved time has
   * piled up (or when {@link flushPlayTime} is called — the pause screen and
   * `BattleScreen.exit` both do, so the number the player is shown is the
   * number on disk).
   *
   * Non-finite and negative deltas are dropped rather than trusted: `dt`
   * comes from the frame clock, and a tab that was backgrounded for a minute
   * would otherwise book a minute of "play".  A single delta is also clamped
   * to {@link MAX_PLAY_TIME_STEP_MS}, which is well above `App`'s own
   * `maxDeltaSec` clamp and exists only so a caller that hands over a whole
   * elapsed span cannot inflate the total in one call.
   */
  addPlayTime(id: string, ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const delta = Math.min(ms, MAX_PLAY_TIME_STEP_MS);
    const rec = this.chapter(id);
    rec.playTimeMs += delta;
    this.unflushedPlayTimeMs += delta;
    if (this.unflushedPlayTimeMs >= PLAY_TIME_FLUSH_MS) this.flushPlayTime();
  }

  /** Write accumulated play time out now. No-op when nothing is pending. */
  flushPlayTime(): void {
    if (this.unflushedPlayTimeMs <= 0) return;
    this.unflushedPlayTimeMs = 0;
    this.save();
  }

  /** Total played milliseconds for one chapter. */
  playTime(id: string): number {
    return this.data.chapters[id]?.playTimeMs ?? 0;
  }

  /** Played milliseconds across every chapter. */
  totalPlayTime(): number {
    return Object.values(this.data.chapters).reduce((sum, rec) => sum + (rec.playTimeMs ?? 0), 0);
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

// ---------------------------------------------------------------------------
// The running app's store, for UI that is built outside the screen tree
// ---------------------------------------------------------------------------

/**
 * The most recently constructed {@link SaveStore}.
 *
 * `App` builds exactly one and hands it down to its screens, which is how
 * everything that lives in the screen tree reaches settings. The battle HUDs do
 * not: `BattleScreenWiring.createHud(game)` takes no arguments, and the HUD is
 * handed to the presenter as a bare `HudPort`. The strategy guide inside that
 * HUD still has a preference to remember, and it must remember it in **the same
 * blob the app writes** — a second `SaveStore` would hold a stale copy of every
 * other field and clobber it on the next `recordClear`.
 *
 * Registration happens in the constructor rather than from `App`, so the
 * dependency runs one way (`ui` reads `app/SaveData`, and `App` needs no line
 * about a HUD it does not own). A test that builds its own store simply becomes
 * the active one for that test file, which is what a test wants anyway.
 */
let activeStore: SaveStore | null = null;

/** The running app's save, when there is one. */
export function activeSave(): SaveStore | null {
  return activeStore;
}

/**
 * Read one boolean setting through {@link activeSave}, falling back to the
 * shipped default when no store exists yet (a HUD mounted in a unit test, a
 * mock screen, a browser with storage blocked).
 */
export function readSetting<K extends keyof Settings>(key: K): Settings[K] {
  return activeStore?.settings[key] ?? defaultSettings()[key];
}

/** Write one setting through {@link activeSave}. A no-op with no store. */
export function writeSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  activeStore?.setSettings({ [key]: value } as Partial<Settings>);
}
