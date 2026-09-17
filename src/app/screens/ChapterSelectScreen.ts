import '../../ui/common/chapter-select.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { CHAPTERS, type Chapter, type ChapterId } from '../../data/encounters.ts';
import { createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { ControlsHint } from '../../ui/common/ControlsHint.ts';
import { backdropImgHtml, faceImgHtml } from '../../ui/common/portrait.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { romanNumeral } from '../../ui/common/roman.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { formatClearTime } from '../../ui/common/resultsMath.ts';

function bossNames(chapter: Chapter): string {
  return chapter.enemyGroupRef.enemies.map((e) => e.name).join(' + ');
}

/** The three who actually walk in — FFX's active slots, FFX-2's whole trio. */
function recommendedParty(chapter: Chapter): Array<{ id: string; name: string }> {
  const build = chapter.buildRef;
  if (build.game === 'ffx') {
    return build.activeSlots.flatMap((id) => {
      const m = build.members.find((x) => x.id === id);
      return m ? [{ id: m.id, name: m.name }] : [];
    });
  }
  return build.members.map((m) => ({ id: m.id, name: m.name }));
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
  { keyboard: 'Enter', gamepad: 'Cross', label: 'select', action: 'confirm' },
  { keyboard: 'Esc', gamepad: 'Circle', label: 'back', action: 'cancel' },
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
      <div class="cselect__aside"></div>
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
    else if (input.consume('cancel') || input.actions.includes('cancel')) this.cancel();

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
   * Fixed slots for the four unselected chapters, logical px. A single column
   * to the right of the hero (the mockup's 2x2 block left the frame's right
   * fifth empty once the dossier moved in beside it), so picking a different
   * chapter swaps which painting is in the hero slab rather than sliding a
   * carousel.
   */
  private static readonly CARD_SLOTS: ReadonlyArray<{ left: number; top: number }> = [
    { left: 293.33, top: 57.78 },
    { left: 293.33, top: 120 },
    { left: 293.33, top: 182.22 },
    { left: 293.33, top: 244.44 },
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

    const aside = this.stage.stage.querySelector('.cselect__aside') as HTMLElement;
    aside.innerHTML = this.asideHtml(chapter);
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
    const pos = ChapterSelectScreen.CARD_SLOTS[slot] ?? ChapterSelectScreen.CARD_SLOTS[0]!;
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

  /** The ivory information slab under the hero: what the chapter *is*. */
  private railHtml(chapter: Chapter): string {
    const badge = chapter.game === 'ffx' ? 'CTB' : 'ATB';
    return `
      <div class="cselect__info">
        <div class="cselect__info-inner">
          <div class="cselect__info-head">
            <span class="cselect__info-title">${escapeHtml(chapter.subtitle)}</span>
            <span class="cselect__badge">${badge}</span>
          </div>
          <div class="cselect__info-premise">${escapeHtml(chapter.blurb)}</div>
        </div>
      </div>
    `;
  }

  /**
   * The right-hand dossier: where, who you take, what you fight, how fast it
   * has been done. An ink slab mirroring the ivory one — same skew, the accent
   * on its outer (right) edge, so the frame reads as one spread instead of a
   * left-hand board with dead air beside it.
   */
  private asideHtml(chapter: Chapter): string {
    const record = this.app.save.chapter(chapter.id);
    const best = record.bestTimeMs !== null ? formatClearTime(record.bestTimeMs) : null;
    const party = recommendedParty(chapter)
      .map(
        (m) => `
          <div class="cselect__party-tile">
            <div class="cselect__face">${faceImgHtml(m.id, m.name)}<span>${escapeHtml(
              m.name.charAt(0).toUpperCase(),
            )}</span></div>
            <span class="cselect__party-name">${escapeHtml(m.name.toUpperCase())}</span>
          </div>
        `,
      )
      .join('');

    return `
      <div class="cselect__aside-inner">
        <div class="cselect__aside-block">
          <div class="cselect__aside-label">LOCATION</div>
          <div class="cselect__aside-place">${escapeHtml(chapter.location)}</div>
          <div class="cselect__aside-rule"></div>
        </div>
        <div class="cselect__aside-block">
          <div class="cselect__aside-label">BOSS</div>
          <div class="cselect__aside-boss">${escapeHtml(bossNames(chapter))}</div>
        </div>
        <div class="cselect__aside-block">
          <div class="cselect__aside-label">PARTY</div>
          <div class="cselect__party">${party}</div>
        </div>
        <div class="cselect__aside-block">
          <div class="cselect__aside-label">BEST</div>
          <div class="cselect__aside-best${best === null ? ' cselect__aside-best--none' : ''}">${
            best ?? 'NOT CLEARED'
          }</div>
        </div>
      </div>
    `;
  }
}

function defaultOnSelect(id: ChapterId): void {
  // eslint-disable-next-line no-console
  console.info(`[chapter-select] confirmed "${id}" — no onSelect wired; the presenter agent replaces this factory.`);
}
