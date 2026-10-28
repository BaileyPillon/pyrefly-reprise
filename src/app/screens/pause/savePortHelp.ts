/**
 * The help line of each row of the SAVE FILE page (`savePortPage.ts`): one short note that follows the cursor, and in the
 * confirm view the comparison of what the chosen file holds with what the save holds now. Plain text (the page sets it with
 * `textContent`; the newlines are kept by the stylesheet), so nothing from a file can become markup.
 *
 * Game case: both (shared pause chrome).
 */

import type { SaveStore } from '../../SaveData.ts';
import { describeSummary, type Accepted } from '../../savePort.ts';
import { currentSummary, undoPreview } from '../../savePortFlow.ts';

export type SavePortRowId = 'export' | 'import' | 'undo' | 'replace' | 'keep';

/** The help for row `id`; `file` is the accepted file in the confirm view, else null. */
export function savePortHelp(id: SavePortRowId, save: SaveStore, file: Accepted | null): { t: string; b: string } {
  switch (id) {
    case 'export':
      return {
        t: 'Export save',
        b: 'Keeps your progress and settings as a small file you can store, back up or open on another device. Nothing leaves this device unless you move the file yourself.',
      };
    case 'import':
      return {
        t: 'Import save',
        b: 'Choose a save file you exported earlier. You will see what it holds and be asked before anything is replaced, and your current save is kept so you can undo it until you close the game. Close any other tab of the game first.',
      };
    case 'undo': {
      const back = undoPreview(save);
      return {
        t: 'Undo import',
        b: `Puts back the save you had just before the last import${back ? ` (${describeSummary(back)})` : ''}. Anything you played since then is not kept.`,
      };
    }
    case 'keep':
    case 'replace': {
      if (!file) return { t: 'Replace your save?', b: '' };
      return {
        t: 'Replace your save?',
        b:
          `THE FILE HOLDS\n${describeSummary(file.summary)}\n\nYOUR SAVE NOW\n${describeSummary(currentSummary(save))}\n\n` +
          (file.older ? 'This file was made by an older version of the game and will be brought up to date. ' : '') +
          'Replacing swaps all of your progress and settings for the file’s. You can undo it here until you close the game.',
      };
    }
  }
}
