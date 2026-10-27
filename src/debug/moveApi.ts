/**
 * `window.__pyrefly.move(key?, value?)`: the switches of lane L2 "moves" of the motion-fluidity pass (`engine/motion/MoveSwitch.ts`) for captures and checks.
 *
 * `move()` returns every word in force (`{ hit: 'today', run: 'today', ... }`); `move('hit')` returns one; `move('hit', 'knock')` forces it for what starts from now on (returns the word in force; a word the
 * table does not list changes nothing); `move('hit', null)` reads the address again. A same-build A/B clip normally loads the page once per variant with the word in the address (`?hit=knock`); this is
 * for the places a recorder wants to flip one inside a fight. Nothing here writes game state.
 */
import { MOVE_WORDS, moveWord, moveWords, setMoveWord, type MoveKey } from '../engine/motion/MoveSwitch.ts';

export function installMoveDebug(api: Record<string, unknown>): void {
  api['move'] = (key?: string, value?: string | null): unknown => {
    if (key === undefined) return moveWords();
    if (!Object.prototype.hasOwnProperty.call(MOVE_WORDS, key)) return undefined;
    const k = key as MoveKey;
    if (value === null) setMoveWord(k, null);
    else if (typeof value === 'string') (setMoveWord as (a: MoveKey, b: string | null) => boolean)(k, value);
    return moveWord(k);
  };
}
