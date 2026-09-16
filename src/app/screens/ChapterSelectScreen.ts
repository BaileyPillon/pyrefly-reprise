import '../../ui/common/chapter-select.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { CHAPTERS, type Chapter, type ChapterId } from '../../data/encounters.ts';
import { createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { ControlsHint } from '../../ui/common/ControlsHint.ts';
import { backdropImgHtml } from '../../ui/common/portrait.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { romanNumeral } from '../../ui/common/roman.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { formatClearTime } from '../../ui/common/resultsMath.ts';

function bossNames(chapter: Chapter): string {
  return chapter.enemyGroupRef.enemies.map((e) => e.name).join(' + ');
}

function recommendedParty(chapter: Chapter): string {
  const build = chapter.buildRef;
  if (build.game === 'ffx') {
    return build.activeSlots.map((id) => build.members.find((m) => m.id === id)?.name ?? id).join(', ');
  }
  return build.members.map((m) => m.name).join(', ');
}

export interface ChapterSelectScreenOptions {
  /** Called when the player confirms a card. The presenter wires the actual transition. */
  onSelect?: (id: ChapterId) => void;
  /** Called on cancel (defaults to nothing — some flows have nowhere to go back to). */
  onCancel?: () => void;
  initialIndex?: number;
}

const HINTS = [
  { keyboard: 'Left/Right', gamepad: 'D-pad', label: 'choose' },
  { keyboard: 'Enter', gamepad: 'Cross', label: 'select' },
  { keyboard: 'Esc', gamepad: 'Circle', label: 'back' },
];

/**
 * Five sphere cards in a shallow arc (`research/visual-bible.md` §5.3):
 * cursor left/right re-centres the arc on the newly selected card, confirm
 * emits the chosen {@link ChapterId} via `onSelect`. Cleared/best-time comes
 * from `App.save`; thumbnails from `public/art/backdrops/<sceneKey>.png`.
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

  private stage: Stage | null = null;
  private hint: ControlsHint | null = null;
  private selected: number;
  private confirming = false;

  constructor(private readonly opts: ChapterSelectScreenOptions = {}) {
    super();
    this.selected = Math.min(CHAPTERS.length - 1, Math.max(0, opts.initialIndex ?? 0));
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
  }

  override enter(): void {
    installInkGoldStyles();
    this.stage = createStage(this.root, 'cselect');
    // `.ig` scopes the Ink & Gold tokens this screen's CSS reads.
    this.stage.el.classList.add('ig');
    this.stage.stage.innerHTML = `
      <div class="cselect__wash"></div>
      <div class="cselect__veil"></div>
      <div class="ig-surface">
        <div class="ig-surface__grain"></div>
        <div class="ig-surface__vignette"></div>
      </div>
      <div class="cselect__eyebrow"><i></i>CHAPTER SELECT</div>
      <div class="cselect__arc"></div>
      <div class="cselect__rail"></div>
    `;
    this.hint = new ControlsHint({ root: this.root, items: HINTS });
    this.hint.mount();
    this.refresh();
    void this.app.fade('clear', 500);
  }

  override exit(): void {
    this.hint?.unmount();
    this.stage?.destroy();
    this.settle(null);
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    if (this.confirming) return;

    if (input.consume('left')) this.move(-1);
    else if (input.consume('right')) this.move(1);

    if (input.consume('confirm') || input.actions.includes('confirm')) this.confirm();
    else if (input.consume('cancel')) this.cancel();

    for (const action of input.actions) {
      const m = /^cselect-card-(\d+)$/.exec(action);
      if (!m?.[1]) continue;
      const index = Number(m[1]);
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
      const index = CHAPTERS.findIndex((c) => c.id === id);
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
    return { selectedIndex: this.selected, selectedId: CHAPTERS[this.selected]?.id };
  }

  // ------------------------------------------------------------------ nav

  private move(delta: number): void {
    const n = CHAPTERS.length;
    this.selected = ((this.selected + delta) % n + n) % n;
    audio.playSfx('cursor-move');
    this.refresh();
  }

  private confirm(): void {
    if (this.confirming) return;
    this.confirming = true;
    audio.playSfx('confirm');
    const chapter = CHAPTERS[this.selected];
    if (chapter) {
      (this.opts.onSelect ?? defaultOnSelect)(chapter.id);
      this.settle(chapter.id);
    }
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

  /**
   * Fixed slots for the four unselected chapters, logical px (the mockup's
   * 680/960 x 150/190/330/370 at 1440). Fixed, so picking a different chapter
   * swaps which painting is in the hero slab rather than sliding a carousel.
   */
  private static readonly CARD_SLOTS: ReadonlyArray<{ left: number; top: number }> = [
    { left: 302.22, top: 66.67 },
    { left: 426.67, top: 84.44 },
    { left: 302.22, top: 146.67 },
    { left: 426.67, top: 164.44 },
  ];

  private refresh(): void {
    if (!this.stage) return;
    const chapter = CHAPTERS[this.selected];
    if (!chapter) return;

    const wash = this.stage.stage.querySelector('.cselect__wash') as HTMLElement | null;
    if (wash) wash.style.backgroundImage = `url(${artUrl(`art/backdrops/${chapter.sceneKey}.png`)})`;

    const arc = this.stage.stage.querySelector('.cselect__arc') as HTMLElement;
    const others = CHAPTERS.map((c, i) => ({ c, i })).filter(({ i }) => i !== this.selected);
    arc.innerHTML = [
      this.heroHtml(chapter, this.selected),
      ...others.map(({ c, i }, slot) => this.cardHtml(c, i, slot)),
    ].join('');

    const rail = this.stage.stage.querySelector('.cselect__rail') as HTMLElement;
    rail.innerHTML = this.railHtml(chapter);
  }

  /** The selected chapter: the big bordered slab with its painting. */
  private heroHtml(chapter: Chapter, index: number): string {
    const record = this.app.save.chapter(chapter.id);
    return `
      <div class="cselect__hero" data-action="cselect-card-${index}" role="button" tabindex="0">
        ${backdropImgHtml(chapter.sceneKey, chapter.title)}
        <div class="cselect__hero-ramp"></div>
        ${record.cleared ? '<div class="cselect__cleared" title="Cleared">&#10003;</div>' : ''}
        <div class="cselect__hero-label">
          <div class="cselect__hero-chapter">CHAPTER ${romanNumeral(chapter.number)}</div>
          <div class="cselect__hero-name">${escapeHtml(chapter.title)}</div>
        </div>
      </div>
    `;
  }

  /** One unselected chapter in slot `slot` (0-3). */
  private cardHtml(chapter: Chapter, index: number, slot: number): string {
    const pos = ChapterSelectScreen.CARD_SLOTS[slot] ?? { left: 302.22, top: 66.67 };
    const record = this.app.save.chapter(chapter.id);
    return `
      <div class="cselect__card" data-action="cselect-card-${index}" role="button" tabindex="0"
           style="left:${pos.left}px;top:${pos.top}px">
        ${backdropImgHtml(chapter.sceneKey, chapter.title)}
        <div class="cselect__card-ramp"></div>
        ${record.cleared ? '<div class="cselect__cleared" title="Cleared">&#10003;</div>' : ''}
        <div class="cselect__card-label">
          <span class="cselect__card-num">${romanNumeral(chapter.number)}</span>
          <span class="cselect__card-name">${escapeHtml(chapter.title.toUpperCase())}</span>
        </div>
      </div>
    `;
  }

  /** The ivory information slab under the cards. */
  private railHtml(chapter: Chapter): string {
    const record = this.app.save.chapter(chapter.id);
    const badge = chapter.game === 'ffx' ? 'CTB' : 'ATB';
    const best = record.bestTimeMs !== null ? formatClearTime(record.bestTimeMs) : '--:--';
    return `
      <div class="cselect__info">
        <div class="cselect__info-inner">
          <div class="cselect__info-head">
            <span class="cselect__info-title">${escapeHtml(chapter.location)}</span>
            <span class="cselect__badge">${badge}</span>
            <span class="cselect__info-location">${escapeHtml(chapter.title.toUpperCase())}</span>
          </div>
          <div class="cselect__info-premise">${escapeHtml(chapter.subtitle)}</div>
          <div class="cselect__info-meta">
            <span><b>BOSS</b>${escapeHtml(bossNames(chapter))}</span>
            <span><b>PARTY</b>${escapeHtml(recommendedParty(chapter))}</span>
            <span><b>BEST</b>${record.cleared ? best : 'Not cleared'}</span>
          </div>
        </div>
      </div>
    `;
  }
}

function defaultOnSelect(id: ChapterId): void {
  // eslint-disable-next-line no-console
  console.info(`[chapter-select] confirmed "${id}" — no onSelect wired; the presenter agent replaces this factory.`);
}
