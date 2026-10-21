/**
 * THE FIGHT PICKER (release 61, the conference demo; Bailey, 2026-10-21, decision 169b/169c: "the visitor picks from a 2-card menu (Seymour Flux FFX, Bahamut FFX-2)"; demo mode only; Chapter I is FFX,
 * Chapter IV is FFX-2).
 *
 * It is the chapter board (`ChapterSelectScreen`) and nothing new: the same Ink & Gold cards, plates, dossier and controls strip, with the other cards taken away (`buildChapterTiles` is handed the two demo
 * chapters and no COMING rows), the hidden doors shut (a typed word, FF7's pad sequence and the label taps open nothing: a booth keyboard is in a stranger's reach), the board's own "N of M beaten" strip
 * hidden by a rule on `.fe-cselect--demo`, and the QR code in a corner.
 *
 * After a fight the cursor opens on the OTHER card (`otherDemoFight`), so the next visitor's first press starts the other fight. After a reset (`demoReset.ts`) the board's memory is gone and it opens on
 * the first card, Seymour Flux. Left/Right and Up/Down both cross between the two cards (the board wraps its playable cards), so a pad's D-pad needs no more than one direction.
 */

import { ChapterSelectScreen, type ChapterSelectScreenOptions } from '../screens/ChapterSelectScreen.ts';
import { BoardDoors } from '../screens/frontend/chapterDoors.ts';
import { buildChapterTiles, type ChapterTile, type ClearedLookup } from '../screens/frontend/chapterGrid.ts';
import { lastBoardChapter } from '../screens/frontend/boardFocus.ts';
import { CHAPTERS } from '../../data/encounters.ts';
import type { ControlHintItem } from '../../ui/common/ControlsHint.ts';
import { DEMO_FIGHTS, otherDemoFight } from './demoFlow.ts';
import { mountQrPlate } from './demoQr.ts';
import './demo.css';

/** The two cards: the real chapters, in the board's order, no COMING rows and nothing locked. */
export function demoTiles(save: ClearedLookup): ChapterTile[] {
  const chapters = DEMO_FIGHTS.flatMap((f) => CHAPTERS.filter((c) => c.id === f.id));
  return buildChapterTiles(save, { chapters, coming: [], locked: new Set() });
}

/** Where the cursor starts: the card after the one fought last, else the first. Pure but for the board's memory. */
export function demoStartIndex(): number {
  const other = otherDemoFight(lastBoardChapter());
  const at = other === null ? -1 : DEMO_FIGHTS.findIndex((f) => f.id === other);
  return at < 0 ? 0 : at;
}

/** The strip under the cards: a booth visitor needs four words (pad wording is the board's own: Cross is the confirm button, Circle the back button). */
export const DEMO_HINTS: ControlHintItem[] = [
  { keyboard: 'Left/Right', gamepad: 'D-pad', pointer: 'Click a card', label: 'choose' },
  { keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click the plate', label: 'fight', action: 'confirm' },
  { keyboard: 'Esc', gamepad: 'Circle', pointer: 'Esc', label: 'title', action: 'cancel' },
];

/** Doors that open nothing. */
export class NoDoors extends BoardDoors {
  override feedKey(): { now: null; next: null; claimed: false } {
    return { now: null, next: null, claimed: false };
  }
  override feedButton(): null {
    return null;
  }
  override feedTap(): null {
    return null;
  }
  override isRun(): boolean {
    return false;
  }
  override isOpen(): boolean {
    return false;
  }
}

export class DemoBoardScreen extends ChapterSelectScreen {
  constructor(opts: ChapterSelectScreenOptions = {}) {
    super({ tiles: demoTiles, hints: DEMO_HINTS, initialIndex: demoStartIndex(), ...opts });
    this.doors = new NoDoors();
  }

  /** No hidden chapters at the booth: no key listener, no label taps, no phone field. */
  protected override armDoor(): void {
    this.doors = new NoDoors();
  }

  override enter(): void {
    super.enter();
    this.root.classList.add('fe-cselect--demo');
    const eyebrow = this.root.querySelector('.fe-cselect__eyebrow');
    if (eyebrow) eyebrow.innerHTML = '<i></i>Choose your fight';
    mountQrPlate(this.root, 'picker');
  }
}
