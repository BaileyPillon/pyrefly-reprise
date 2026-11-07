/**
 * WHEN A PORTRAIT FILLS THE LEFT OF THE SCREEN: the switch (Bailey, 2026-11-06 13:10 ET: "when character portraits pop in and fill the left half of the screen its not really making sense to me why they pop up when
 * they do it just seems kind of random"; his pick on 2026-11-07 ~09:50 ET: "A: only on big moves", card `portraits-A`).
 *
 * Three modes, one address word (`?portraits=`), both games:
 * - `big` (the default): no portrait at a turn's start; a party member's BIG MOVE slams her or his portrait in and names the move (`BigMoves.ts`, `BigMoveCutIn.ts`).
 * - `turns`: how it was until release 76: the portrait on each party member's FIRST turn of each battle (`TurnCutIn.ts`), and nothing for a big move. The way back if Bailey wants the old behaviour.
 * - `off`: no portrait at all (a quiet record for captures and for anyone who finds even the big-move one too much).
 *
 * Pure: no `three`, no DOM but the address of the page (hard rule 1). Same shape as `look/pro/ProSwitch.ts`: read once, tests force it.
 */
import { queryWord } from './motion/DemoGate.ts';

export type PortraitMode = 'big' | 'turns' | 'off';

/** `?portraits=turns|off` from a search string (pure): `big` (the default) for anything else, including nothing. */
export function portraitModeFromSearch(search: string | undefined): PortraitMode {
  const word = queryWord(search, 'portraits');
  return word === 'turns' || word === 'off' ? word : 'big';
}

let mode: PortraitMode | null = null;

/** The mode as the page asked for it (read once), or as a test or the console set it. */
export function portraitMode(): PortraitMode {
  if (mode === null) mode = portraitModeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return mode;
}

/** Tests and `__pyrefly.portraits(...)`: force the mode (`null` reads the address again). The next turn or action reads it. */
export function setPortraitMode(value: PortraitMode | null): void {
  mode = value;
}
