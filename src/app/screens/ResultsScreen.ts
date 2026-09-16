import '../../ui/common/results.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import type { BattleResult } from '../../battle/common/types.ts';
import { getChapter, type ChapterId } from '../../data/encounters.ts';
import { createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { portraitImgHtml } from '../../ui/common/portrait.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import {
  apPerMember,
  formatClearTime,
  formatNumber,
  isNewBest,
  isSilentResultsChapter,
  itemLabel,
  pickVictoryQuip,
} from '../../ui/common/resultsMath.ts';

/** How long the gil/AP counters take to roll up to their final value [visual-bible §3.8 step 6]. */
const COUNT_UP_MS = 1150;

export interface ResultsScreenOptions {
  chapterId: ChapterId;
  result: BattleResult;
  /** Overrides the chapter's own silent-results rule (`ResultsStep.silent`, chapter 4 by default). */
  silent?: boolean;
  /** Called once the player dismisses the panel (or the auto-dismiss timer fires). */
  onContinue?: () => void;
}

interface MemberRow {
  id: string;
  name: string;
  /** AP in FFX, EXP in FFX-2 — {@link ResultsScreen.awardUnit} says which. */
  award: number;
  levelDelta: number;
  levelUnit: 'S.Lv' | 'Lv';
}

/**
 * The post-battle spoils panel (`research/visual-bible.md` §3.8): AP/gil/items
 * /overkill from a `BattleResult`, one row per active party member, and
 * Chapter 4's silent variant (no fanfare, muted styling, no victory quip)
 * [writing-bible §5.4]. Records the clear into `App.save` on `enter()`.
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
  private readonly silent: boolean;
  private readonly rows: MemberRow[];
  /** Filled in by `enter()`, once `App.save` is available, from the record about to be overwritten. */
  private wasNewBest = false;
  private readonly quip: string | undefined;
  /** FFX pays in AP, FFX-2 in EXP [BattleResult.ap / .exp]. The ledger and the
      per-member rows are labelled from this, so an FFX-2 clear never reports
      "0 AP" next to the EXP it actually earned. */
  private readonly awardUnit: 'AP' | 'EXP';
  private readonly awardTotal: number;

  private revealMs = 0;
  private dismissed = false;

  constructor(private readonly opts: ResultsScreenOptions) {
    super();
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
    const chapter = getChapter(opts.chapterId);
    this.silent = opts.silent ?? isSilentResultsChapter(opts.chapterId);

    const isFfx = chapter?.buildRef.game === 'ffx';
    this.awardUnit = isFfx ? 'AP' : 'EXP';
    this.awardTotal = isFfx ? opts.result.ap : opts.result.exp;

    // Written out rather than via `isFfx` so the union narrows on `buildRef`.
    const memberIds: string[] =
      chapter?.buildRef.game === 'ffx'
        ? [...chapter.buildRef.activeSlots]
        : (chapter?.buildRef.members.map((m) => m.id) ?? []);
    const awardByMember = apPerMember(this.awardTotal, memberIds);
    this.rows = memberIds.map((id) => {
      const name = chapter?.buildRef.members.find((m) => m.id === id)?.name ?? id;
      const levelUnit: MemberRow['levelUnit'] = isFfx ? 'S.Lv' : 'Lv';
      const levelDelta = isFfx
        ? (opts.result.sphereLevelsGained[id] ?? 0)
        : (opts.result.levelsGained?.[id] ?? 0);
      return { id, name, award: awardByMember[id] ?? this.awardTotal, levelDelta, levelUnit };
    });

    this.quip = this.silent
      ? undefined
      : pickVictoryQuip(chapter?.scriptsRef.victoryQuips[this.rows[0]?.id ?? ''] ?? undefined);
  }

  override enter(): void {
    installInkGoldStyles();
    this.stage = createStage(this.root, 'rres');
    this.stage.el.classList.add('ig');
    const chapter = getChapter(this.opts.chapterId);
    if (chapter?.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');
    if (this.silent) this.stage.el.classList.add('rres--silent');

    // The wedge, the standing portrait and the caption never change once the
    // screen is up; only the ledger's numbers roll, so `refresh()` rewrites
    // just `.rres__page` and leaves the artwork alone.
    // Set vertically down the right edge, so its length is bounded by the
    // frame's HEIGHT: location + outcome only, as the mockup has it.
    const caption = chapter
      ? `${escapeHtml(chapter.location.toUpperCase())} &middot; ${
          this.opts.result.outcome === 'victory' ? 'CLEARED' : 'FELL'
        }`
      : '';
    this.stage.stage.innerHTML = `
      <div class="rres__ink">${portraitImgHtml(this.rows[0]?.id, '')?.replace('<img ', '<img class="rres__hero" ')}</div>
      <div class="rres__stripe"></div>
      <div class="rres__caption">${caption}</div>
      <div class="rres__page"></div>
    `;

    if (this.opts.result.outcome === 'victory') {
      const previousBestMs = this.app.save.chapter(this.opts.chapterId).bestTimeMs;
      this.wasNewBest = isNewBest(previousBestMs, this.opts.result.elapsedMs);
      this.app.save.recordClear(this.opts.chapterId, this.opts.result.elapsedMs, this.opts.result.turns);
    } else {
      this.app.save.recordAttempt(this.opts.chapterId);
    }

    this.refresh();
    if (!this.silent) audio.playSfx('menu-open');
    void this.app.fade('clear', 400);
  }

  override exit(): void {
    this.stage?.destroy();
    this.resolveDone();
  }

  override handleInput(input: InputSnapshot): void {
    if (this.dismissed) return;
    if (input.consume('confirm') || input.actions.includes('confirm')) this.continue();
  }

  override update(dt: number): void {
    if (this.dismissed || this.silent || this.revealMs >= COUNT_UP_MS) return;
    this.revealMs += dt * 1000;
    this.refresh();
  }

  override trigger(name: string): boolean {
    if (name === 'results:continue' || name === 'continue') {
      this.continue();
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
    };
  }

  // -------------------------------------------------------------- actions

  private continue(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    audio.playSfx(this.silent ? 'menu-close' : 'confirm');
    this.opts.onContinue?.();
    // Resolve now (a native Promise's resolve is a no-op if called again from
    // `exit()`) rather than waiting for the flow to replace this screen — the
    // flow's `await screen.done` is what triggers that replace in the first place.
    this.resolveDone();
  }

  // --------------------------------------------------------------- render

  private countProgress(): number {
    if (this.silent) return 1;
    return Math.min(1, this.revealMs / COUNT_UP_MS);
  }

  private refresh(): void {
    if (!this.stage) return;
    const page = this.stage.stage.querySelector('.rres__page') as HTMLElement;
    const p = this.countProgress();
    const result = this.opts.result;

    const heading = result.outcome === 'victory' ? (this.silent ? 'Results' : 'Victory') : 'Defeat';

    // The chip carries what the old footer did: clear time, overkill, new best.
    const chipParts = ['RESULTS', formatClearTime(result.elapsedMs)];
    if (result.overkilled.length > 0) chipParts.push(`OVERKILL ×${result.overkilled.length}`);
    if (this.wasNewBest) chipParts.push('NEW BEST');

    const itemsHtml = result.drops.length
      ? `<div class="rres__line">
           <div class="rres__k">ITEMS</div>
           <div class="rres__v rres__v--items">${result.drops
             .map((d) => escapeHtml(itemLabel(d.itemId)) + (d.count > 1 ? ` ×${d.count}` : ''))
             .join(', ')}</div>
         </div>`
      : '';

    const membersHtml = this.rows
      .map((row) => {
        const award = Math.round(row.award * p);
        // The initial is the face's fallback, not its alternative: a portrait
        // that 404s removes its own <img> and reveals the letter underneath.
        const face = `<span>${escapeHtml(row.name.charAt(0).toUpperCase())}</span>${portraitImgHtml(row.id, '')}`;
        const levelHtml =
          row.levelDelta > 0 && p >= 1
            ? `<span class="rres__level-up">+${row.levelDelta} ${escapeHtml(row.levelUnit)}</span>`
            : '';
        return `
          <div class="rres__member">
            <div class="rres__face">${face}</div>
            <span class="rres__member-name">${escapeHtml(row.name)}</span>
            ${levelHtml}
            <span class="rres__member-ap">+${formatNumber(award)}<small>${this.awardUnit}</small></span>
          </div>
        `;
      })
      .join('');

    page.innerHTML = `
      <div class="rres__head">
        <div class="rres__chip">${chipParts.join(' &middot; ')}</div>
        <div class="rres__heading">${heading}</div>
        <div class="rres__rule"></div>
        ${this.quip ? `<div class="rres__quip">${escapeHtml(this.quip)}</div>` : ''}
      </div>

      <div class="rres__ledger">
        <div class="rres__line">
          <div class="rres__k">${this.awardUnit}</div>
          <div class="rres__v">${formatNumber(Math.round(this.awardTotal * p))}</div>
          <div class="rres__d">×${this.rows.length} PARTY</div>
        </div>
        <div class="rres__line">
          <div class="rres__k">GIL</div>
          <div class="rres__v">${formatNumber(Math.round(result.gil * p))}</div>
        </div>
        ${itemsHtml}
      </div>

      <div class="rres__party">${membersHtml}</div>
      <div class="rres__confirm" data-action="confirm"><span>CONFIRM ▸</span></div>
    `;
    this.stage.el.classList.add('rres--visible');
  }
}
