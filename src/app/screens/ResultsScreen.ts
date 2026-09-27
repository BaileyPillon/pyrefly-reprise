import '../../ui/common/results.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import type { BattleResult } from '../../battle/common/types.ts';
import { getChapter, type ChapterId } from '../../data/encounters.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { createFullBleedStage, createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import {
  buildMemberRows,
  clearTimeMs,
  dropsLabel,
  formatClearTime,
  formatNumber,
  isNewBest,
  isSilentResultsChapter,
  leaderId,
  victoryHeroHtml,
  type ResultsMemberRow,
} from '../../ui/common/resultsMath.ts';
import { DEFEAT_ACTIONS, desktopPageHtml, pageHeading, type LedgerLine, type ResultsChoice, type ResultsPageModel } from '../../ui/common/resultsPage.ts';
import { isPhoneResults, phoneHeroFigure, phoneHeroHtml, phonePageHtml, phoneShellHtml, RESULTS_PHONE_QUERY } from '../../ui/common/resultsPhone.ts';
import { victoryLine, victoryTurn, wedgeFallenArt, wedgeFigureId, wedgePortraitId, type VictoryLine } from '../../ui/common/victoryLine.ts';

export type { ResultsChoice } from '../../ui/common/resultsPage.ts';

/** How long the gil/AP counters take to roll up to their final value [visual-bible §3.8 step 6]. */
const COUNT_UP_MS = 1150;

export interface ResultsScreenOptions {
  chapterId: ChapterId;
  result: BattleResult;
  /** Overrides the chapter's own silent-results rule (`ResultsStep.silent`, chapter 4 by default). */
  silent?: boolean;
  /**
   * Wall-clock length of the encounter, from `BattleScreenResult.elapsedMs`.
   * The FFX engine never advances `BattleResult.elapsedMs` (it only moves
   * inside `wait` effects, which that engine never emits), so without this the
   * header read `RESULTS · 0:00` after every FFX fight. See `clearTimeMs`.
   */
  elapsedMs?: number;
  /**
   * The chapter's best time **before** this clear was written. `GameFlow`
   * records the clear before it shows this panel, so the panel can no longer
   * read the old record itself and would never light `NEW BEST`.
   */
  previousBestMs?: number | null;
  /** Called once the player dismisses the panel. */
  onContinue?: () => void;
  /** Called with the player's pick. `'continue'` unless the defeat panel was used. */
  onChoice?: (choice: ResultsChoice) => void;
}

/**
 * The post-battle panel (`research/visual-bible.md` §3.8, Ink & Gold spec
 * `docs/handoff/presentation-ink-and-gold.md`).
 *
 * Three variants on one page:
 * - **Victory** — AP (FFX) or EXP + per-dressphere AP (FFX-2), gil, drops,
 *   the Overkill and New Best tags, and a per-member list carrying each
 *   member's Sphere Level / Level gain and where their progression now stands.
 * - **Silent** (chapter 4) — the same page with the flourish drained
 *   [writing-bible §5.4].
 * - **Defeat** — a sombre slab: no gold, no quip, no spoils, the leader's
 *   fallen pose sunk into the ink, and `RETRY` / `CHAPTER SELECT` in place of
 *   `CONFIRM`.
 *
 * On an upright phone all three leave the 640x360 letterbox for the
 * full-bleed phone page (PR-0001 option B, `ui/common/resultsPhone.ts`).
 */
export class ResultsScreen extends Screen {
  readonly name = 'results';

  /**
   * Resolves once the player dismisses the panel — satisfies the
   * `FlowScreen<void>` contract `BattleScreenFlow.ts` expects from
   * `registerFlowScreens({ results: (opts) => new ResultsScreen(...) })`.
   */
  readonly done: Promise<void>;
  private resolveDone!: () => void;

  private stage: Stage | null = null;
  /** Whether the stage up now is the phone page (PR-0001 B). */
  private phone = false;
  private phoneQuery: MediaQueryList | null = null;
  /** `LOCATION · CLEARED` / `· FELL`, escaped. */
  private caption = '';
  private readonly silent: boolean;
  private readonly victory: boolean;
  private readonly rows: ResultsMemberRow[];
  /** Filled in by `enter()`, from the record as it stood before this clear. */
  private wasNewBest = false;
  private quip: VictoryLine | undefined;
  /** FFX pays in AP, FFX-2 in EXP. The ledger heading is labelled from this. */
  private readonly awardUnit: 'AP' | 'EXP';
  /** The real clear time, not the engine's unadvanced `elapsedMs`. */
  private readonly clearMs: number;
  /** FF7's rows carry no house clear-time chip, NEW BEST or party-count tag (the FF7 purist review, item 7). */
  private readonly ff7: boolean;
  private ledger: LedgerLine[] = [];

  private revealMs = 0;
  private dismissed = false;
  private actionIndex = 0;
  private choice: ResultsChoice = 'continue';

  constructor(private readonly opts: ResultsScreenOptions) {
    super();
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
    const chapter = getChapter(opts.chapterId);
    this.silent = opts.silent ?? isSilentResultsChapter(opts.chapterId);
    this.victory = opts.result.outcome === 'victory';

    const game = chapter?.buildRef.game ?? 'ffx'; // FF7 pays EXP (and AP to Materia), like FFX-2's EXP ledger
    this.awardUnit = game === 'ffx' ? 'AP' : 'EXP';
    this.clearMs = clearTimeMs(opts.result, opts.elapsedMs, game);
    this.ff7 = game === 'ff7';
    this.rows = buildMemberRows(chapter, opts.result);
  }

  override enter(): void {
    installInkGoldStyles();
    const chapter = getChapter(this.opts.chapterId);
    // A quip is a victory register, never under "Defeat". PR-0021: the speaker rotates
    // with the save's attempts (both games); chosen first, as they stand in the wedge (VL-1).
    if (this.victory && !this.silent) {
      const banks = chapter?.scriptsRef.victoryQuips;
      const turn = victoryTurn(this.app.save.value.chapters);
      this.quip = victoryLine(banks, this.rows.map((r) => r.id), turn);
    }
    this.mountStage();
    // PR-0001 B: turning the phone (or resizing a window across the phone
    // query) swaps the page between its phone and desktop forms.
    this.phoneQuery = typeof window.matchMedia === 'function' ? window.matchMedia(RESULTS_PHONE_QUERY) : null;
    this.phoneQuery?.addEventListener?.('change', this.onLayoutChange);
    window.addEventListener('resize', this.onResize, { passive: true });

    const record = this.app.save.chapter(this.opts.chapterId);
    if (this.victory && !chapter?.experimental) { // an experiment never records into the save
      const previousBestMs =
        this.opts.previousBestMs !== undefined ? this.opts.previousBestMs : record.bestTimeMs;
      this.wasNewBest = isNewBest(previousBestMs, this.clearMs);
      this.app.save.recordClear(this.opts.chapterId, this.clearMs, this.opts.result.turns);
    }
    // The attempt itself is recorded by `GameFlow.runChapter` before the
    // battle starts; counting it again here doubled every defeat.
    this.ledger = this.buildLedger(record.attempts, record.bestTimeMs);

    // Nothing rolls up on a defeat — the panel is already settled when it lands.
    if (!this.victory) this.revealMs = COUNT_UP_MS;

    this.refresh();
    audio.playSfx(this.victory && !this.silent ? 'menu-open' : 'menu-close');
    void this.app.fade('clear', 400);
  }

  override exit(): void {
    this.stage?.destroy();
    this.phoneQuery?.removeEventListener?.('change', this.onLayoutChange);
    window.removeEventListener('resize', this.onResize);
    this.resolveDone();
  }

  /**
   * Build the stage for the window as it is now: today's 640x360 letterboxed
   * page, or on an upright phone the full-bleed page (PR-0001 B,
   * `resultsPhone.ts`). The painting and the caption never change once the
   * screen is up; only the numbers roll, so `refresh()` rewrites just
   * `.rres__page` and leaves the artwork alone.
   */
  private mountStage(): void {
    if (this.stage) {
      this.stage.destroy();
      this.stage.el.remove();
    }
    this.phone = isPhoneResults(window);
    this.stage = this.phone ? createFullBleedStage(this.root, 'rres') : createStage(this.root, 'rres');
    this.stage.el.classList.add('ig');
    const chapter = getChapter(this.opts.chapterId);
    if (chapter?.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');
    if (this.silent) this.stage.el.classList.add('rres--silent');
    if (!this.victory) this.stage.el.classList.add('rres--defeat');
    this.caption = chapter
      ? `${escapeHtml(chapter.location.toUpperCase())} &middot; ${this.victory ? 'CLEARED' : 'FELL'}`
      : '';
    if (this.phone) {
      this.stage.el.classList.add('rres--phone');
      const { width, height } = this.phoneSize();
      this.stage.stage.innerHTML = phoneShellHtml(phoneHeroHtml(phoneHeroFigure(getChapter(this.opts.chapterId), this.victory, this.quip), width, height));
      return;
    }
    this.stage.stage.innerHTML = `
      <div class="rres__ink">${this.heroHtml()}</div>
      <div class="rres__stripe"></div>
      <div class="rres__caption">${this.caption}</div>
      <div class="rres__page"></div>
    `;
  }

  private readonly onLayoutChange = (): void => {
    if (!this.stage || isPhoneResults(window) === this.phone) return;
    this.mountStage();
    this.refresh();
  };

  /** The phone's face crop is in screen px: re-place the painting when the screen changes size. */
  private readonly onResize = (): void => {
    if (!this.phone || !this.stage) return;
    const bleed = this.stage.stage.querySelector('.rresp__bleed');
    const { width, height } = this.phoneSize();
    if (bleed) bleed.innerHTML = phoneHeroHtml(phoneHeroFigure(getChapter(this.opts.chapterId), this.victory, this.quip), width, height);
  };

  private phoneSize(): { width: number; height: number } {
    const rect = this.stage?.el.getBoundingClientRect();
    return { width: rect?.width || window.innerWidth, height: rect?.height || window.innerHeight };
  }

  override handleInput(input: InputSnapshot): void {
    if (this.dismissed) return;

    if (this.victory) {
      if (input.consume('confirm') || input.actions.includes('confirm')) this.pick('continue');
      return;
    }

    // Defeat: a two-slab cursor. Either axis moves it; cancel is the way out.
    const delta =
      (input.consume('right') || input.consume('down') ? 1 : 0) -
      (input.consume('left') || input.consume('up') ? 1 : 0);
    if (delta !== 0) {
      this.actionIndex = (this.actionIndex + delta + DEFEAT_ACTIONS.length) % DEFEAT_ACTIONS.length;
      audio.playSfx('cursor-move');
      this.refresh();
    }
    for (const action of DEFEAT_ACTIONS) {
      if (input.actions.includes(`results:${action.choice}`)) {
        this.pick(action.choice);
        return;
      }
    }
    if (input.consume('confirm')) this.pick(DEFEAT_ACTIONS[this.actionIndex]!.choice);
    else if (input.consume('cancel')) this.pick('chapter-select');
  }

  override update(dt: number): void {
    if (this.dismissed || this.silent || this.revealMs >= COUNT_UP_MS) return;
    this.revealMs += dt * 1000;
    this.refresh();
  }

  override trigger(name: string): boolean {
    // `results:continue` stays the neutral "dismiss the panel" beat the
    // gallery and e2e already use: it never picks a defeat action, so the
    // flow keeps its old retry-from-prep behaviour for automated runs.
    if (name === 'results:continue' || name === 'continue') {
      this.pick('continue');
      return true;
    }
    if (name === 'results:retry' || name === 'results:chapter-select') {
      this.pick(name === 'results:retry' ? 'retry' : 'chapter-select');
      return true;
    }
    return false;
  }

  override snapshot(): Record<string, unknown> {
    return {
      chapterId: this.opts.chapterId,
      outcome: this.opts.result.outcome,
      silent: this.silent,
      dismissed: this.dismissed,
      clearMs: this.clearMs,
      newBest: this.wasNewBest,
      choice: this.choice,
      actionIndex: this.actionIndex,
      members: this.rows.map((r) => r.id),
    };
  }

  // -------------------------------------------------------------- actions

  private pick(choice: ResultsChoice): void {
    if (this.dismissed) return;
    this.dismissed = true;
    this.choice = choice;
    audio.playSfx(this.silent || !this.victory ? 'menu-close' : 'confirm');
    this.opts.onChoice?.(choice);
    this.opts.onContinue?.();
    // Resolve now (a native Promise's resolve is a no-op if called again from
    // `exit()`) rather than waiting for the flow to replace this screen — the
    // flow's `await screen.done` is what triggers that replace in the first place.
    this.resolveDone();
  }

  // --------------------------------------------------------------- content

  /**
   * The wedge's figure: a win stands the line's speaker (VL-1), else the leader; a
   * loss the leader's fallen pose, falling back through `hurt` -> `ko` -> no art at
   * all rather than grinning at the player under the word "Defeat".
   *
   * Reads the leader from the chapter build (`leaderId`), not `rows[0]`
   * (PR-0003): the row list can legitimately be empty or reordered by AP
   * eligibility, and the fallen pose must render regardless. The art is the
   * chapter's own game's (FOC17-01): an FFX-2 girl in her X-2 likeness or dressphere.
   */
  private heroHtml(): string {
    const chapter = getChapter(this.opts.chapterId);
    const figure = wedgeFigureId(this.victory, this.quip, leaderId(chapter));
    if (!figure) return '';
    if (this.victory) return victoryHeroHtml(wedgePortraitId(figure, chapter));
    const [hurt, ko] = wedgeFallenArt(chapter, figure).map((p) => artUrl(p));
    return `<img class="rres__hero rres__hero--fallen" src="${hurt}" data-fallback="${ko}" alt=""
      draggable="false" onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback='';}else{this.remove();}" />`;
  }

  /** The ledger rows: spoils on a win, the fight's record on a loss. */
  private buildLedger(attempts: number, bestTimeMs: number | null): LedgerLine[] {
    const result = this.opts.result;
    if (!this.victory) {
      return [
        { kind: 'text', key: 'TURNS', value: formatNumber(result.turns) },
        { kind: 'text', key: 'ATTEMPTS', value: formatNumber(Math.max(1, attempts)) },
        {
          kind: 'text',
          key: 'BEST',
          value: bestTimeMs === null ? '—' : formatClearTime(bestTimeMs),
          detail: bestTimeMs === null ? 'NEVER CLEARED' : undefined,
        },
      ];
    }

    const lines: LedgerLine[] = [
      {
        kind: 'count',
        key: this.awardUnit,
        value: this.awardUnit === 'AP' ? result.ap : result.exp,
        detail: this.ff7 ? undefined : `×${this.rows.length} PARTY`,
      },
    ];
    // FFX-2 pays EXP to the girl and AP to the dressphere she is wearing, so
    // both belong on the ledger [ffx2-combat-core §3.0] — but a formation that
    // pays no AP gets no row, rather than a printed zero.
    if (this.awardUnit === 'EXP' && result.ap > 0) {
      lines.push({ kind: 'count', key: 'AP', value: result.ap, detail: getChapter(this.opts.chapterId)?.game === 'ff7' ? 'PER MATERIA' : 'PER DRESSPHERE' }); // FF7: AP goes to each Materia [ff7-battle-core §11]
    }
    lines.push({ kind: 'count', key: 'GIL', value: result.gil });
    if (result.drops.length > 0) {
      lines.push({ kind: 'items', key: 'ITEMS', value: dropsLabel(result.drops) });
    }
    return lines;
  }

  // --------------------------------------------------------------- render

  private countProgress(): number {
    if (this.silent || !this.victory) return 1;
    return Math.min(1, this.revealMs / COUNT_UP_MS);
  }

  private refresh(): void {
    if (!this.stage) return;
    const page = this.stage.stage.querySelector('.rres__page') as HTMLElement;

    const tags: string[] = [];
    if (this.victory && this.opts.result.overkilled.length > 0) {
      tags.push(`OVERKILL ×${this.opts.result.overkilled.length}`);
    }
    if (this.wasNewBest && !this.ff7) tags.push('NEW BEST');

    const model: ResultsPageModel = {
      victory: this.victory,
      silent: this.silent,
      heading: pageHeading(this.victory, this.silent),
      clock: this.ff7 ? '' : formatClearTime(this.clearMs),
      tags,
      quip: this.quip,
      ledger: this.ledger,
      rows: this.rows,
      progress: this.countProgress(),
      actionIndex: this.actionIndex,
    };
    page.innerHTML = this.phone ? phonePageHtml(model, this.caption) : desktopPageHtml(model);
    this.stage.el.classList.add('rres--visible');
  }
}
