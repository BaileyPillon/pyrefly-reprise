/**
 * PORTABLE SAVES, the part that touches the store (`savePort.ts` is the pure part): hand over the current save as a
 * file's text, put an accepted file's save in place of the current one, and put the earlier one back.
 *
 * The rules a deep review checks here:
 *
 *  - **Export is read-only.** It reads a copy of the in-memory save (play time not yet flushed included) and writes
 *    nothing: no storage write, no flush, no change to the store.
 *  - **Every file handed out reads back.** The text is read by `readSaveFile` before it is returned; a save the reader
 *    would refuse (a damaged value in memory, say a volume that is not a number) is not turned into a file the player
 *    would find out about only on another device.
 *  - **A replace is all or nothing.** `SaveStore.replaceWith` writes the slot first and swaps the in-memory save only
 *    after that write held; when it says no (no storage, quota, a locked-down profile) nothing changed, and no undo
 *    step is recorded.
 *  - **The old save is kept.** Before a replace, the save as it stands is stringified and pushed on an undo stack that
 *    lives as long as the store does (a `WeakMap` on the store: in memory, not in `localStorage`, so it adds no new
 *    key and ends with the page). The stack is {@link MAX_UNDO_STEPS} deep, so a second, wrong import does not cost
 *    the player the save they started from. An undo is itself a replace with the same guarantees, and pops its step
 *    only after the write held.
 *  - **The file's save is copied in**, never aliased: committing the same {@link Accepted} twice cannot share objects
 *    with the store.
 *
 * Two open tabs: a replace in one tab does not reach the other, whose next write merges its older copy into the
 * imported save (`saveMerge.ts`: clears are OR-ed, best times take the smaller). The page tells the player to close
 * other tabs first.
 *
 * Game case: both games (shared plumbing).
 */

import type { SaveData, SaveStore } from './SaveData.ts';
import { buildSaveFile, readSaveFile, saveFileName, summarizeSave, type Accepted, type SaveSummary } from './savePort.ts';

/** How many earlier saves an import can step back through. */
export const MAX_UNDO_STEPS = 5;

const undoStacks = new WeakMap<SaveStore, string[]>();

const stackOf = (store: SaveStore): string[] => {
  let s = undoStacks.get(store);
  if (!s) undoStacks.set(store, (s = []));
  return s;
};

export interface ExportedFile {
  ok: true;
  filename: string;
  text: string;
  summary: SaveSummary;
}

/** The save would not read back as a file; `detail` is the field path, for the debug line. */
export interface ExportRefusal {
  ok: false;
  detail: string;
}

/** The save as it stands, as a file that is checked to read back. Read-only. */
export function exportCurrent(store: SaveStore, now: number): ExportedFile | ExportRefusal {
  const save = store.value;
  const text = buildSaveFile(save, now);
  const check = readSaveFile(text);
  if (!check.ok) return { ok: false, detail: check.detail ?? check.code };
  return { ok: true, filename: saveFileName(now), text, summary: summarizeSave(save) };
}

/** What the player has now, in the few numbers the page compares. */
export function currentSummary(store: SaveStore): SaveSummary {
  return summarizeSave(store.value);
}

const copyAt = (save: Readonly<SaveData>, now: number): SaveData => ({ ...(JSON.parse(JSON.stringify(save)) as SaveData), updatedAt: now });

/**
 * Put `accepted.save` in place of the current save. False, with nothing changed and no undo step kept, when the
 * store would not write it.
 */
export function commitImport(store: SaveStore, accepted: Accepted, now: number): boolean {
  const before = JSON.stringify(store.value);
  if (!store.replaceWith(copyAt(accepted.save, now))) return false;
  const stack = stackOf(store);
  stack.push(before);
  while (stack.length > MAX_UNDO_STEPS) stack.shift();
  return true;
}

/** How many imports can still be undone. */
export function undoSteps(store: SaveStore): number {
  return undoStacks.get(store)?.length ?? 0;
}

/** What the next undo would put back, or null when there is nothing to undo. */
export function undoPreview(store: SaveStore): SaveSummary | null {
  const top = undoStacks.get(store)?.at(-1);
  if (top === undefined) return null;
  try {
    return summarizeSave(JSON.parse(top) as SaveData);
  } catch {
    return null;
  }
}

/** Put the save from just before the last import back. False, and the step kept, when there is none or the store would not write. */
export function undoImport(store: SaveStore, now: number): boolean {
  const stack = undoStacks.get(store);
  const top = stack?.at(-1);
  if (!stack || top === undefined) return false;
  let earlier: SaveData;
  try {
    earlier = JSON.parse(top) as SaveData;
  } catch {
    return false;
  }
  if (!store.replaceWith(copyAt(earlier, now))) return false;
  stack.pop();
  return true;
}
