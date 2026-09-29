import './frontend/frontend.css';
import './frontend/chapter-select-c.css';
import { Screen } from '../Screen.ts';
import { BUTTONS, type InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import type { ChapterId } from '../../data/encounters.ts';
import { ControlsHint } from '../../ui/common/ControlsHint.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import {
  buildChapterTiles,
  groupChapterTiles,
  stepGroup,
  stepSelection,
  type ChapterTile,
} from './frontend/chapterGrid.ts';
import { asideHtml, heroHtml, proseHtml, railHtml } from './frontend/chapterCards.ts';
import { boardProgress, progressStripHtml } from './frontend/chapterProgress.ts';
import { initialBoardIndex, rememberBoardChapter } from './frontend/boardFocus.ts';
import { BoardWarmer } from './frontend/boardWarm.ts';
import { deferSrcs, heroPlates, mountLazyPlates } from './frontend/lazyPlates.ts';
import { SecretDoor } from './frontend/secretDoor.ts';
import { ff7ExperimentReady } from '../experiments/ff7Flag.ts';

/** Where the secret door leads: the hidden FF7 experiment (`data/chapter-ff7-guard-scorpion.ts`). */
const SECRET_CHAPTER: ChapterId = 'ff7-guard-scorpion';

export interface ChapterSelectScreenOptions {
  /** Called when the player confirms a card. The presenter wires the actual transition. */
  onSelect?: (id: ChapterId) => void;
  /** Called on cancel (defaults to nothing — some flows have nowhere to go back to). */
  onCancel?: () => void;
  initialIndex?: number;
}

/**
 * A mouse player gets the board's two-click rule in its own words: the first
 * click on a rail card brings it to the plate, the second — on the plate —
 * starts it. That is the behaviour `handleInput` has always had; nothing said
 * so, which is what made it read as a dead click.
 */
const HINTS = [
  { keyboard: 'Left/Right', gamepad: 'D-pad', pointer: 'Click a card', label: 'choose' },
  { keyboard: 'Up/Down', gamepad: 'D-pad', label: 'game' },
  { keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click the plate', label: 'begin', action: 'confirm' },
  { keyboard: 'Esc', gamepad: 'Circle', pointer: 'Esc', label: 'back', action: 'cancel' },
];

/**
 * A touch screen has no arrows and no Enter (the chapter-select-v2 critique:
 * "The controls strip on a phone still says UP/DOWN and ENTER"). The same
 * two-tap rule, in its own words; the back chip stays a button.
 */
const TOUCH_HINTS = [
  { keyboard: 'Tap a card', gamepad: 'D-pad', label: 'choose' },
  { keyboard: 'Tap the plate', gamepad: 'Cross', label: 'begin', action: 'confirm' },
  { keyboard: 'Tap here', gamepad: 'Circle', label: 'back', action: 'cancel' },
];

function isTouchScreen(): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/**
 * The board of the whole game: every listed encounter as its boss painted on
 * its own scene, in a fixed list of two game groups.
 *
 * Approved end state (D-183, Bailey 2026-09-25: "I'll go with C a victory
 * ribbon", then "All recommendations"): `docs/concepts/chapter-select-v2/`
 * option C. The list never changes shape (the selected card lights in place),
 * the coming card sits at its number's place, a beaten chapter wears the gold
 * ribbon, and the strip under the plate counts "N of M beaten".
 *
 * The list is derived from the chapter registry and the save
 * (`chapterGrid.ts`), so a chapter that lands lights up by itself and nothing
 * fake is ever written into `src/data` (hard rule 6).
 *
 * Game-aware (AGENTS.md rule 14): **both**. The board is shared plumbing; the
 * per-game half is the group heading and its accent, which is the existing
 * `.ig--ffx2` token swap.
 *
 * Full bleed rather than the old letterboxed 640x360 stage, for the reason
 * written down in `TitleScreen.ts`: Bailey's window is not 16:9.
 */
export class ChapterSelectScreen extends Screen {
  readonly name = 'chapter-select';

  /**
   * Resolves with the confirmed chapter, or `null` on cancel — satisfies the
   * `FlowScreen<ChapterId | null>` contract `BattleScreenFlow.ts` expects from
   * `registerFlowScreens({ chapterSelect: () => new ChapterSelectScreen() })`.
   * Firing independently of (and in addition to) `onSelect`/`onCancel` lets
   * this screen serve both the flow and a standalone debug/screenshot registration.
   */
  readonly done: Promise<ChapterId | null>;
  private resolveDone!: (id: ChapterId | null) => void;
  private settled = false;

  private hint: ControlsHint | null = null;
  private tiles: ChapterTile[] = [];
  private selected = 0;
  private confirming = false;
  /** The secret door (Bailey's approved option A); fed by keys, taps and pad buttons, shows nothing. */
  private door = new SecretDoor();
  private eyebrow: HTMLElement | null = null;
  /** A-3: the focused chapter's battle starts loading while its card is read. */
  private readonly warmer = new BoardWarmer();
  /** r29: the selected card's plate and wash, put up decoded (`lazyPlates.ts`). */
  private readonly showHero = heroPlates();

  constructor(private readonly opts: ChapterSelectScreenOptions = {}) {
    super();
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
  }

  override enter(): void {
    installInkGoldStyles();
    this.tiles = buildChapterTiles(this.app.save);
    // PR-0109: back on the chapter the player last chose (prep Esc, results CONFIRM, reload).
    this.selected = initialBoardIndex(this.tiles, this.opts.initialIndex);

    this.root.className = 'screen fe fe-cselect ig';
    // `__scroll` is the page on a phone (one scrolling column); on a desktop
    // window it is the full-bleed frame the absolute layout sits in.
    this.root.innerHTML = `
      <div class="fe-cselect__wash"></div>
      <div class="fe-cselect__veil"></div>
      <div class="fe-cselect__scroll">
        <div class="fe-cselect__eyebrow"><i></i>Chapter select</div>
        <div class="fe-cselect__board"></div>
        <div class="fe-rail"></div>
        <div class="fe-aside"></div>
      </div>
    `;
    this.hint = new ControlsHint({ root: this.root, items: isTouchScreen() ? TOUCH_HINTS : HINTS });
    this.hint.mount();
    this.armDoor();
    // The list is drawn once: after this only its selected mark moves.
    const rail = this.root.querySelector('.fe-rail');
    if (rail instanceof HTMLElement) {
      rail.innerHTML = railHtml(groupChapterTiles(this.tiles), this.tiles, this.selected, (id) => this.bestTime(id));
      mountLazyPlates(rail, this.selected); // r29: the strips in the idle lane, nearest first, up once decoded
    }
    this.refresh();
    void this.app.fade('clear', 500);
  }

  override exit(): void {
    this.disarmDoor();
    this.warmer.cancel();
    this.showHero([], null, null); // r29: the board's plates and faces stop competing with the chosen chapter
    this.hint?.unmount();
    this.root.innerHTML = '';
    this.settle(null);
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    if (this.confirming) return;
    // The door reads edges without consuming them, so the board below sees every press as before.
    for (const button of BUTTONS) if (input.justPressed(button) && this.door.feedButton(button, now()) === 'open') this.openDoor();
    if (this.confirming) return;

    if (input.consume('left')) this.move(-1);
    else if (input.consume('right')) this.move(1);
    else if (input.consume('up')) this.moveGroup(-1);
    else if (input.consume('down')) this.moveGroup(1);

    if (input.consume('confirm') || input.actions.includes('confirm')) this.confirm();
    else if (input.consume('cancel') || input.actions.includes('cancel')) this.cancel();

    for (const action of input.actions) {
      const m = /^fe-card-(\d+)$/.exec(action);
      if (!m?.[1]) continue;
      const index = Number(m[1]);
      if (!this.tiles[index]?.playable) continue;
      // The list is fixed, so this index is the card the player clicked, and
      // a second click on the selected card begins it, never its neighbour.
      if (index === this.selected) this.confirm();
      else {
        this.selected = index;
        audio.playSfx('cursor-move');
        this.refresh();
      }
    }
  }

  override trigger(name: string): boolean {
    if (name === 'confirm') {
      this.confirm();
      return true;
    }
    if (name.startsWith('select:')) {
      const id = name.slice('select:'.length);
      const index = this.tiles.findIndex((t) => t.id === id && t.playable);
      if (index < 0) return false;
      // Matches `StubChapterSelect`: picking by id also confirms it, so
      // `__pyrefly.trigger('select:seymour-flux')` jumps straight into the
      // chapter in one call.
      this.selected = index;
      this.refresh();
      this.confirm();
      return true;
    }
    return false;
  }

  override snapshot(): Record<string, unknown> {
    const tile = this.tiles[this.selected];
    const progress = boardProgress(this.tiles, this.selected);
    return {
      selectedIndex: this.selected,
      selectedId: tile?.id,
      tiles: this.tiles.length,
      coming: this.tiles.filter((t) => !t.playable).map((t) => t.id),
      cleared: this.tiles.filter((t) => t.cleared).map((t) => t.id),
      order: this.tiles.map((t) => t.id),
      beaten: progress.beaten,
      total: progress.total,
    };
  }

  // ------------------------------------------------------------------ nav

  private move(delta: number): void {
    const next = stepSelection(this.tiles, this.selected, delta);
    if (next === this.selected) return;
    this.selected = next;
    audio.playSfx('cursor-move');
    this.refresh();
    this.revealSelected();
  }

  private moveGroup(delta: number): void {
    const next = stepGroup(this.tiles, this.selected, delta);
    if (next === this.selected) return;
    this.selected = next;
    audio.playSfx('cursor-move');
    this.refresh();
    this.revealSelected();
  }

  /** On a phone the list scrolls with the page: keep a keyboard cursor in view. */
  private revealSelected(): void {
    const card = this.root.querySelector('.fe-card--sel');
    if (card instanceof HTMLElement && typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ block: 'nearest' });
    }
  }

  private bestTime(id: string): number | null {
    const tile = this.tiles.find((t) => t.id === id);
    return tile?.chapter ? this.app.save.chapter(id).bestTimeMs : null;
  }

  private confirm(): void {
    if (this.confirming) return;
    const tile = this.tiles[this.selected];
    // A COMING card is never the cursor's home, but a stray `confirm` action
    // from a click must not start a chapter that does not exist.
    if (!tile?.playable) return;
    this.confirming = true;
    audio.playSfx('confirm');
    const id = tile.id as ChapterId;
    rememberBoardChapter(id);
    (this.opts.onSelect ?? defaultOnSelect)(id);
    this.settle(id);
    // A standalone (non-flow) registration keeps living after confirm — the
    // flow instead replaces this screen, which resolves `confirming` moot.
    window.setTimeout(() => {
      this.confirming = false;
    }, 250);
  }

  // ---------------------------------------------------------- secret door

  /**
   * Listen for the door: letters on `window` (after `Input`'s capture listener,
   * so an overlay that claims the keyboard also shuts the door) and taps on the
   * "Chapter select" label, which `chapter-select-c.css` makes tappable with no
   * pointer, hover, press state or tap highlight. Nothing visible changes.
   */
  private armDoor(): void {
    this.door = new SecretDoor();
    window.addEventListener('keydown', this.onDoorKey);
    this.eyebrow = this.root.querySelector<HTMLElement>('.fe-cselect__eyebrow');
    this.eyebrow?.addEventListener('click', this.onDoorTap);
  }

  private disarmDoor(): void {
    window.removeEventListener('keydown', this.onDoorKey);
    this.eyebrow?.removeEventListener('click', this.onDoorTap);
    this.eyebrow = null;
  }

  private readonly onDoorKey = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || this.confirming) return;
    if (this.door.feedKey(e.key, now()) === 'open') this.openDoor();
  };

  private readonly onDoorTap = (): void => {
    if (!this.confirming && this.door.feedTap(now()) === 'open') this.openDoor();
  };

  /**
   * Through the door. With `FF7_EXPERIMENT_READY` off (the default until the FF7
   * engine and HUD exist) nothing happens at all. With it on, the board settles
   * on the hidden chapter **without** `rememberBoardChapter`, so the board never
   * reopens on an id it has no card for, and with no sound or sign (the success
   * flash is Bailey's pick, plan §2.2).
   */
  private openDoor(): void {
    if (this.confirming || !ff7ExperimentReady()) return;
    this.confirming = true;
    (this.opts.onSelect ?? defaultOnSelect)(SECRET_CHAPTER);
    this.settle(SECRET_CHAPTER);
    window.setTimeout(() => {
      this.confirming = false;
    }, 250);
  }

  private settle(id: ChapterId | null): void {
    if (this.settled) return;
    this.settled = true;
    this.resolveDone(id);
  }

  private cancel(): void {
    audio.playSfx('cancel');
    this.settle(null);
    this.opts.onCancel?.();
  }

  // --------------------------------------------------------------- render

  private refresh(): void {
    const tile = this.tiles[this.selected];
    if (!tile) return;
    this.warmer.focus(tile.playable ? tile.chapter : null);

    // FFX-2's half of the board carries the pyre-pink accent, the existing
    // token swap — never a new colour (presentation-ink-and-gold.md).
    this.root.classList.toggle('ig--ffx2', tile.game === 'ffx2');

    const wash = this.root.querySelector('.fe-cselect__wash');
    const washUrl = tile.sceneKey ? artUrl(`art/backdrops/${tile.sceneKey}.png`) : null;

    const best = this.bestTime(tile.id);
    const board = this.root.querySelector('.fe-cselect__board');
    if (board instanceof HTMLElement) {
      board.innerHTML =
        heroHtml(tile, this.selected, best) +
        progressStripHtml(boardProgress(this.tiles, this.selected)) +
        proseHtml(tile);
    }

    // The fixed list: only the selected mark moves (D-183).
    for (const card of this.root.querySelectorAll('.fe-card[data-card]')) {
      const on = card.getAttribute('data-action') === `fe-card-${this.selected}`;
      card.classList.toggle('fe-card--sel', on);
      if (on) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    }

    const aside = this.root.querySelector('.fe-aside');
    if (aside instanceof HTMLElement) {
      aside.innerHTML = deferSrcs(asideHtml(tile, best));
    }
    // r29 PR-0221: the plate, the faces and the wash at urgent, up decoded; the card left behind is demoted.
    const parts = [board, aside].filter((e): e is HTMLElement => e instanceof HTMLElement);
    this.showHero(parts, wash instanceof HTMLElement ? wash : null, washUrl);
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function defaultOnSelect(id: ChapterId): void {
  // eslint-disable-next-line no-console
  console.info(`[chapter-select] confirmed "${id}" — no onSelect wired; the presenter agent replaces this factory.`);
}
