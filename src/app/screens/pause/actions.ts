/**
 * Firing one row of the pause screen.
 *
 * Everything the old left-hand command column could do is reachable from here.
 * `docs/concepts/pause-until-dawn/options.json` → `preservedFunctions` is the
 * list of what that column had and where each of its rows went, and
 * `tests/unit/pause-remake-functions.test.ts` walks all nineteen.
 *
 * A settings row is tried first, because Left / Right / Confirm all land here
 * and a volume has to step rather than fire.
 */

import { audio } from '../../../audio/index.ts';
import type { SaveStore } from '../../SaveData.ts';
import { battleHelpOn, setBattleHelp } from '../../../ui/coach/coachState.ts';
import { adjustSetting } from './settings.ts';

export interface PauseActionHost {
  save: SaveStore;
  /** Redraw after a row changed something it shows. */
  refresh: () => void;
  replayBriefing: () => void;
  onRestart?: (() => void) | undefined;
  onChapterSelect?: (() => void) | undefined;
  onQuitToTitle?: (() => void) | undefined;
  extraRows?: ReadonlyArray<{ id: string; run: () => void }> | undefined;
}

/** @param dir which way Left / Right pushed; Confirm passes 1. */
export function activateRow(host: PauseActionHost, id: string | null, dir: 1 | -1): void {
  if (id === null) return;
  if (adjustSetting(host.save, id, dir)) {
    audio.playSfx('cursor-move');
    host.refresh();
    return;
  }
  audio.playSfx('confirm');
  switch (id) {
    case 'battleHelp':
      setBattleHelp(!battleHelpOn());
      host.refresh();
      return;
    case 'briefing':
      host.replayBriefing();
      return;
    case 'restart':
      host.onRestart?.();
      return;
    case 'chapter-select':
      host.onChapterSelect?.();
      return;
    case 'quit':
      host.onQuitToTitle?.();
      return;
    default:
      host.extraRows?.find((e) => e.id === id)?.run();
  }
}
