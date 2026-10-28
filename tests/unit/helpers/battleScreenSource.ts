import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The battle screen's classes, lowest first. `BattleScreen` has been a chain of classes since 2026-10-28 (ChatGPT's point 8b, `docs/handoff/split-presenter.md`),
 * one file each, every layer calling only the layers below it. The tests that pin its wiring by reading its source read the whole chain through this:
 * the text is the old file's text, cut at the layers and put back in the order the layers stack (state, the pause, the card, the encounter, the frame).
 */
export const BATTLE_SCREEN_FILES = ['BattleScreenBase', 'BattleScreenPause', 'BattleScreenCard', 'BattleScreenEncounter', 'BattleScreen'] as const;

/** The source of the battle screen, newlines as LF. */
export function battleScreenSource(root: string = resolve(__dirname, '..', '..', '..')): string {
  return BATTLE_SCREEN_FILES.map((f) => readFileSync(resolve(root, 'src', 'app', 'screens', `${f}.ts`), 'utf8'))
    .join('\n')
    .replace(/\r\n/g, '\n');
}
