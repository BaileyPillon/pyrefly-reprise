/**
 * The Experiment's chosen levels, kept in **session memory only** (FFX-2 only; chapter "The Experiment").
 *
 * The brief (Bailey's delegation, 2026-10-10): the chapter's pre-battle choice must not change the save schema, because a save-data change forces a deep
 * review before deploy. So the choice is a module-level value here: it survives a retry after a defeat (the prep screen opens again on the same levels), a
 * restart of the encounter and a return to the board, and it is gone on a reload, when the chapter opens on `DEFAULT_EXPERIMENT_LEVELS` again.
 * Nothing here touches `localStorage`, `SaveData` or the experiments' store.
 *
 * It lives in `src/data` rather than `src/app` because the chapter record reads it (`../../chapter-ffx2-experiment.ts`: its `enemyGroupRef` is an accessor
 * that follows this choice) and the data layer imports nothing from the app. The prep tab writes it (`src/ui/ffx2/party-prep/ExperimentPanel.ts`).
 */

import {
  DEFAULT_EXPERIMENT_LEVELS,
  UPGRADE_TRACKS,
  isUpgradeLevel,
  sameLevels,
  withLevel,
  type ExperimentLevels,
  type UpgradeLevel,
  type UpgradeTrack,
} from './experiment-levels.ts';

let current: ExperimentLevels = DEFAULT_EXPERIMENT_LEVELS;
const listeners = new Set<(levels: ExperimentLevels) => void>();

/** The levels the next fight uses. */
export function experimentLevels(): ExperimentLevels {
  return current;
}

/** Choose all three levels. Anything that is not a level 1 to 5 on a track leaves that track as it was. */
export function setExperimentLevels(next: Partial<Record<UpgradeTrack, number>>): ExperimentLevels {
  let merged = current;
  for (const track of UPGRADE_TRACKS) {
    const level = next[track];
    if (isUpgradeLevel(level)) merged = withLevel(merged, track, level);
  }
  return commit(merged);
}

/** Choose one track's level. */
export function setExperimentLevel(track: UpgradeTrack, level: UpgradeLevel): ExperimentLevels {
  return commit(withLevel(current, track, level));
}

/** Back to the default (a new session, or a test's start). */
export function resetExperimentLevels(): ExperimentLevels {
  return commit(DEFAULT_EXPERIMENT_LEVELS);
}

/** Hear about a change (the prep tab redraws on it). Returns the way to stop. */
export function onExperimentLevels(listener: (levels: ExperimentLevels) => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function commit(next: ExperimentLevels): ExperimentLevels {
  if (sameLevels(next, current)) return current;
  current = next;
  for (const l of [...listeners]) l(current);
  return current;
}
