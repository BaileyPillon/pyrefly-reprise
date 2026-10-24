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
 *
 * r64 (item 200i, Bailey 2026-10-24, the driver's call under "I'll go with all your recommendations"; both games): with the booth screens on (`boothSwitch.ts`), 60 s with nobody at the picker (no key, click, touch, wheel, real
 * mouse movement, pad button or stick: the idle clock of `demoIdle.ts`) takes the booth back to the title, exactly as Esc does, and the title's own minute then puts the attract card up. With `?booth=today` / `?pack=off` the picker waits for ever, as before.
 */

import { ChapterSelectScreen, type ChapterSelectScreenOptions } from '../screens/ChapterSelectScreen.ts';
import { BoardDoors } from '../screens/frontend/chapterDoors.ts';
import { buildChapterTiles, type ChapterTile, type ClearedLookup } from '../screens/frontend/chapterGrid.ts';
import { lastBoardChapter } from '../screens/frontend/boardFocus.ts';
import { CHAPTERS } from '../../data/encounters.ts';
import type { ControlHintItem } from '../../ui/common/ControlsHint.ts';
import { DEMO_FIGHTS, otherDemoFight } from './demoFlow.ts';
import { IdleClock, PICKER_IDLE_MS, noteIdleReturn, padActive, watchActivity } from './demoIdle.ts';
import { boothNewOn } from './boothSwitch.ts';
import { mountControlsCard } from './demoControls.ts';
import { mountQrPlate } from './demoQr.ts';
import { noteDemoFocus, warmDemoFights } from './demoWarm.ts';
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

/** How long the picker stands before the stages are built behind it: the cards have painted, a visitor's first move is not an instant. */
export const WARM_AFTER_MS = 1200;

export class DemoBoardScreen extends ChapterSelectScreen {
  constructor(opts: ChapterSelectScreenOptions = {}) {
    super({ tiles: demoTiles, hints: DEMO_HINTS, initialIndex: demoStartIndex(), ...opts });
    this.doors = new NoDoors();
  }

  /** r63-play (the overnight fix of the skeptic's M1): the fight the cursor rests on has its stage built first, since it is the one the next press picks (read a few times a second off the board's own snapshot). */
  override update(dt: number): void {
    super.update(dt);
    this.checkIdle();
    if (++this.focusTick % 6 !== 0) return;
    const id = this.snapshot()['selectedId'];
    if (typeof id === 'string' && id !== this.focusNoted) {
      this.focusNoted = id;
      noteDemoFocus(id);
    }
  }

  /** r64: nobody has been at the picker for {@link PICKER_IDLE_MS}: leave for the title (the flow reads a `null` pick as Esc). A pad raises no DOM event, so it is read here, every frame. */
  private checkIdle(): void {
    const idle = this.idle;
    if (idle === null) return;
    const t = performance.now();
    if (padActive(typeof navigator === 'undefined' ? null : (navigator.getGamepads?.() ?? null))) idle.touch(t);
    if (!idle.expired(t, PICKER_IDLE_MS)) return;
    this.stopIdle();
    noteIdleReturn(t); // r63-rc (201c): the title that opens next starts its clock run out, so the attract card goes up at once
    this.settle(null);
  }

  private stopIdle(): void {
    this.stopWatch?.();
    this.stopWatch = null;
    this.idle = null;
  }

  private idle: IdleClock | null = null;
  private stopWatch: (() => void) | null = null;
  private focusTick = 0;
  private focusNoted: string | null = null;

  /** No hidden chapters at the booth: no key listener, no label taps, no phone field. */
  protected override armDoor(): void {
    this.doors = new NoDoors();
  }

  override enter(): void {
    super.enter();
    this.root.classList.add('fe-cselect--demo');
    const eyebrow = this.root.querySelector('.fe-cselect__eyebrow');
    if (eyebrow) eyebrow.innerHTML = '<i></i>Choose your fight';
    mountControlsCard((this.root.querySelector('.fe-cselect__scroll') as HTMLElement | null) ?? this.root); // R62 (173d): three lines under the cards, with the pad's glyphs; the strip under them is hidden by `demo.css`
    mountQrPlate(this.root, 'picker');
    if (boothNewOn()) {
      const idle = new IdleClock(performance.now());
      this.idle = idle;
      this.stopWatch = watchActivity(() => idle.touch(performance.now()));
    }
    // Release 62 (PR-0481): the fights' stages are built behind the picker (a stage the last fight used up is built again here), a moment after the cards have painted
    this.warmTimer = setTimeout(() => void warmDemoFights(this.app), WARM_AFTER_MS);
  }

  override exit(): void {
    if (this.warmTimer !== null) clearTimeout(this.warmTimer);
    this.warmTimer = null;
    this.stopIdle();
    super.exit();
  }

  private warmTimer: ReturnType<typeof setTimeout> | null = null;
}
