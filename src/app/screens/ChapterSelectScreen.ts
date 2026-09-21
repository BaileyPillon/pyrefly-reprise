import './frontend/frontend.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
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
 * The board of the whole game: every encounter as its boss's ink silhouette,
 * in two game groups.
 *
 * Approved end state:
 * `docs/concepts/polish/showpiece-frontend/chapter-select.png` — "every card
 * carries its boss as a silhouette, so the board reads as five encounters
 * rather than five thumbnails" (`card.json`). The base look is the approved
 * tile `docs/screenshots/mockups/A-chapter-select.jpg`.
 *
 * It holds **eight**: the five built chapters plus the three Bailey approved on
 * 2026-09-19 (Macalania and Evrae for FFX, Chateau Leblanc for FFX-2), which
 * ride as locked COMING cards until their data lands. The list is derived from
 * the chapter registry (`chapterGrid.ts`), so a chapter that lands lights up by
 * itself and nothing fake is ever written into `src/data` (hard rule 6).
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

  constructor(private readonly opts: ChapterSelectScreenOptions = {}) {
    super();
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
  }

  override enter(): void {
    installInkGoldStyles();
    this.tiles = buildChapterTiles(this.app.save);
    const wanted = this.opts.initialIndex ?? 0;
    this.selected = this.tiles[wanted]?.playable ? wanted : this.tiles.findIndex((t) => t.playable);
    if (this.selected < 0) this.selected = 0;

    this.root.className = 'screen fe fe-cselect ig';
    this.root.innerHTML = `
      <div class="fe-cselect__wash"></div>
      <div class="fe-cselect__veil"></div>
      <div class="fe-cselect__eyebrow"><i></i>Chapter select</div>
      <div class="fe-cselect__board"></div>
      <div class="fe-rail"></div>
      <div class="fe-aside"></div>
    `;
    this.hint = new ControlsHint({ root: this.root, items: HINTS });
    this.hint.mount();
    this.refresh();
    void this.app.fade('clear', 500);
  }

  override exit(): void {
    this.hint?.unmount();
    this.root.innerHTML = '';
    this.settle(null);
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
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
    return {
      selectedIndex: this.selected,
      selectedId: tile?.id,
      tiles: this.tiles.length,
      coming: this.tiles.filter((t) => !t.playable).map((t) => t.id),
      cleared: this.tiles.filter((t) => t.cleared).map((t) => t.id),
    };
  }

  // ------------------------------------------------------------------ nav

  private move(delta: number): void {
    const next = stepSelection(this.tiles, this.selected, delta);
    if (next === this.selected) return;
    this.selected = next;
    audio.playSfx('cursor-move');
    this.refresh();
  }

  private moveGroup(delta: number): void {
    const next = stepGroup(this.tiles, this.selected, delta);
    if (next === this.selected) return;
    this.selected = next;
    audio.playSfx('cursor-move');
    this.refresh();
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
    (this.opts.onSelect ?? defaultOnSelect)(id);
    this.settle(id);
    // A standalone (non-flow) registration keeps living after confirm — the
    // flow instead replaces this screen, which resolves `confirming` moot.
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

    // FFX-2's half of the board carries the pyre-pink accent, the existing
    // token swap — never a new colour (presentation-ink-and-gold.md).
    this.root.classList.toggle('ig--ffx2', tile.game === 'ffx2');

    const wash = this.root.querySelector('.fe-cselect__wash');
    if (wash instanceof HTMLElement) {
      wash.style.backgroundImage = tile.sceneKey
        ? `url(${artUrl(`art/backdrops/${tile.sceneKey}.png`)})`
        : 'none';
    }

    const board = this.root.querySelector('.fe-cselect__board');
    if (board instanceof HTMLElement) {
      board.innerHTML = heroHtml(tile, this.selected) + proseHtml(tile);
    }

    const rail = this.root.querySelector('.fe-rail');
    if (rail instanceof HTMLElement) {
      rail.innerHTML = railHtml(groupChapterTiles(this.tiles), this.tiles, this.selected);
    }

    const aside = this.root.querySelector('.fe-aside');
    if (aside instanceof HTMLElement) {
      const record = tile.chapter ? this.app.save.chapter(tile.id) : null;
      aside.innerHTML = asideHtml(tile, record?.bestTimeMs ?? null);
    }
  }
}

function defaultOnSelect(id: ChapterId): void {
  // eslint-disable-next-line no-console
  console.info(`[chapter-select] confirmed "${id}" — no onSelect wired; the presenter agent replaces this factory.`);
}
