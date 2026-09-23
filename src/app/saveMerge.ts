/**
 * Two open tabs of the game, one save (CHK-024-LIVE-1, 2026-09-23).
 *
 * Every tab builds its own `SaveStore`, keeps the whole save in memory and
 * writes the whole blob back. Before this module the last tab to write won: a
 * second tab still in a battle flushes its play time every
 * `PLAY_TIME_FLUSH_MS`, and each flush put back its own stale copy of every
 * setting, so a Master Volume changed in the first tab (or a clear, an
 * attempt, a coaching line seen) was undone within seconds. Measured on the
 * live release 10 with real keys: three of three trials lost the change with a
 * second tab in battle, none of six with one tab.
 *
 * The fix is a three-way merge at write time; the schema is unchanged. `base`
 * is what this tab last read or wrote, `theirs` what the slot holds now,
 * `ours` what this tab is about to write. While the slot still holds `base`
 * (every write of a one-tab session) `ours` is written untouched, as before.
 * Otherwise each field keeps the other tab's value unless this tab changed it
 * since `base`:
 *
 * - settings and flags, per key: ours where ours differs from base, else theirs;
 * - `unlocked` and `seenCoach`: the union (neither shrinks outside `reset`);
 * - each chapter: attempts and play time add this tab's growth since `base`
 *   to theirs; `cleared` is either; best time and best turns take the smaller.
 *
 * An empty or unreadable slot is not merged with: ours is written, as before.
 * Its own module because `SaveData.ts` is over the house line cap. Both games
 * (shared plumbing).
 */

import type { ChapterRecord, SaveData } from './SaveData.ts';

type Migrate = (raw: Partial<SaveData>) => SaveData;
type Slot = Pick<Storage, 'getItem' | 'setItem'>;

function parse(raw: string | null, migrate: Migrate): SaveData | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? migrate(parsed as Partial<SaveData>) : null;
  } catch {
    return null;
  }
}

/** Theirs, with every key this tab changed since base taken from ours. */
function changedKeys<T extends object>(ours: T, base: T, theirs: T): T {
  const o = ours as unknown as Record<string, unknown>;
  const b = base as unknown as Record<string, unknown>;
  const out = { ...(theirs as unknown as Record<string, unknown>) };
  for (const k of Object.keys(o)) if (o[k] !== b[k]) out[k] = o[k];
  return out as unknown as T;
}

const union = (a: unknown, b: unknown): string[] => [
  ...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].filter((x): x is string => typeof x === 'string')),
];

const smaller = (a: number | null, b: number | null): number | null =>
  a === null ? b : b === null ? a : Math.min(a, b);

const growth = (ours: number, base: number | undefined): number => Math.max(0, ours - (base ?? 0));

function mergeChapter(ours: ChapterRecord | undefined, base: ChapterRecord | undefined, theirs: ChapterRecord | undefined): ChapterRecord {
  if (!theirs) return ours!;
  if (!ours) return theirs;
  return {
    ...theirs,
    cleared: theirs.cleared || ours.cleared,
    bestTimeMs: smaller(theirs.bestTimeMs, ours.bestTimeMs),
    bestTurns: smaller(theirs.bestTurns, ours.bestTurns),
    attempts: theirs.attempts + growth(ours.attempts, base?.attempts),
    playTimeMs: theirs.playTimeMs + growth(ours.playTimeMs, base?.playTimeMs),
  };
}

/**
 * What this tab should write, given what the slot holds now (`stored`) and
 * what it held when this tab last read or wrote it (`lastRaw`). Returns `ours`
 * itself when there is nothing to merge.
 */
export function mergeOtherTab(stored: string | null, lastRaw: string | null, ours: SaveData, migrate: Migrate): SaveData {
  if (stored === null || stored === lastRaw) return ours;
  const theirs = parse(stored, migrate);
  if (!theirs) return ours;
  // A tab that booted on an empty (or unreadable) slot started from the defaults.
  const base = parse(lastRaw, migrate) ?? migrate({});
  const chapters: Record<string, ChapterRecord> = {};
  for (const id of new Set([...Object.keys(theirs.chapters), ...Object.keys(ours.chapters)])) {
    chapters[id] = mergeChapter(ours.chapters[id], base.chapters[id], theirs.chapters[id]);
  }
  return {
    ...theirs,
    version: ours.version,
    updatedAt: ours.updatedAt,
    chapters,
    unlocked: union(theirs.unlocked, ours.unlocked),
    seenCoach: union(theirs.seenCoach, ours.seenCoach),
    settings: changedKeys(ours.settings, base.settings, theirs.settings),
    flags: changedKeys(ours.flags, base.flags, theirs.flags),
  };
}

/**
 * Merge with the slot, write, and hand back what was written. `null` when the
 * slot threw (quota, a locked-down profile): nothing is adopted and the next
 * write merges again from the same `lastRaw`, so nothing is counted twice.
 */
export function writeMerged(
  slot: Slot,
  key: string,
  lastRaw: string | null,
  ours: SaveData,
  migrate: Migrate,
): { data: SaveData; json: string } | null {
  try {
    const data = mergeOtherTab(slot.getItem(key), lastRaw, ours, migrate);
    const json = JSON.stringify(data);
    slot.setItem(key, json);
    return { data, json };
  } catch {
    return null;
  }
}
