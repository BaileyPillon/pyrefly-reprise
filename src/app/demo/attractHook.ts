/**
 * THE ATTRACT LOOP'S DOOR (release 61, the conference demo; both games, demo mode only; `demoTitle.ts`, `demoAttract.ts`).
 *
 * The title starts the attract reel, and the reel is a whole battle screen's worth of code (`BattleScreen`, the presenter, the HUDs). The title must not import it: the title's own module graph is bundled on its
 * own by `tests/unit/behind-the-scenes-off.test.ts` (one chunk, none for the Behind the Scenes page) and loaded alone by several title tests under a 30 second cap. So the title asks this one-line module for the
 * runner, and `main.ts`, which imports the whole game anyway, hands it in. With no runner (a title mounted alone) a demo title shows its QR plate and never starts a reel.
 */

import type { App } from '../App.ts';

/** Play the reel; resolves when it is over. `left` is false when the title never went (a press while the first segment's art was loading). */
export type AttractRunner = (app: App) => Promise<{ left: boolean }>;

let runner: AttractRunner | null = null;

/** `main.ts` hands the reel in. `null` takes it away. */
export function setAttractRunner(next: AttractRunner | null): void {
  runner = next;
}

/** The reel, if one was handed in. */
export function attractRunner(): AttractRunner | null {
  return runner;
}
