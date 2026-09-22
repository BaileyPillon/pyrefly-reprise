import '../../ui/common/results.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import type { BattleResult } from '../../battle/common/types.ts';
import { getChapter, type ChapterId } from '../../data/encounters.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { portraitImgHtml } from '../../ui/common/portrait.ts';
import { partyFaceHtml } from '../../ui/common/partyFace.ts';
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
  pickVictoryQuip,
  resultsHeroBox,
  type ResultsMemberRow,
} from '../../ui/common/resultsMath.ts';

/** How long the gil/AP counters take to roll up to their final value [visual-bible §3.8 step 6]. */
const COUNT_UP_MS = 1150;

/** What the player asked for from the panel. Only a defeat offers a choice. */
export type ResultsChoice = 'continue' | 'retry' | 'chapter-select';

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

/** One printed row of the spoils ledger. */
type LedgerLine =
  /** A number that rolls up with the reveal. */
  | { kind: 'count'; key: string; value: number; detail?: string }
  /** A settled value (a time, a turn count) — no roll-up. */
  | { kind: 'text'; key: string; value: string; detail?: string }
  /** The drops, set as a printed list rather than a tally. */
  | { kind: 'items'; key: string; value: string; detail?: string };

/** The two things the defeat panel offers, in cursor order. */
const DEFEAT_ACTIONS: ReadonlyArray<{ choice: ResultsChoice; label: string }> = [
  { choice: 'retry', label: 'RETRY' },
  { choice: 'chapter-select', label: 'CHAPTER SELECT' },
];

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
  private readonly victory: boolean;
  private readonly rows: ResultsMemberRow[];
  /** Filled in by `enter()`, from the record as it stood before this clear. */
  private wasNewBest = false;
  private readonly quip: string | undefined;
  /** FFX pays in AP, FFX-2 in EXP. The ledger heading is labelled from this. */
  private readonly awardUnit: 'AP' | 'EXP';
  /** The real clear time, not the engine's unadvanced `elapsedMs`. */
  private readonly clearMs: number;
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

    const game = chapter?.buildRef.game ?? 'ffx';
    this.awardUnit = game === 'ffx' ? 'AP' : 'EXP';
    this.clearMs = clearTimeMs(opts.result, opts.elapsedMs, game);
    this.rows = buildMemberRows(chapter, opts.result);

    // A quip is a victory register. Printing "…Okay. Next one." under a
    // 200 px "Defeat" was the tonal bug this screen was rebuilt for.
    this.quip =
      this.victory && !this.silent
        ? pickVictoryQuip(chapter?.scriptsRef.victoryQuips[this.rows[0]?.id ?? ''] ?? undefined)
        : undefined;
  }

  override enter(): void {
    installInkGoldStyles();
    this.stage = createStage(this.root, 'rres');
    this.stage.el.classList.add('ig');
    const chapter = getChapter(this.opts.chapterId);
    if (chapter?.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');
    if (this.silent) this.stage.el.classList.add('rres--silent');
    if (!this.victory) this.stage.el.classList.add('rres--defeat');

    // The wedge, the standing figure and the caption never change once the
    // screen is up; only the ledger's numbers roll, so `refresh()` rewrites
    // just `.rres__page` and leaves the artwork alone.
    const caption = chapter
      ? `${escapeHtml(chapter.location.toUpperCase())} &middot; ${this.victory ? 'CLEARED' : 'FELL'}`
      : '';
    this.stage.stage.innerHTML = `
      <div class="rres__ink">${this.heroHtml()}</div>
      <div class="rres__stripe"></div>
      <div class="rres__caption">${caption}</div>
      <div class="rres__page"></div>
    `;

    const record = this.app.save.chapter(this.opts.chapterId);
    if (this.victory) {
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
    this.resolveDone();
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
   * The figure in the wedge. A win stands the leader's portrait there; a loss
   * uses their fallen pose, falling back through `hurt` -> `ko` -> no art at
   * all rather than grinning at the player under the word "Defeat".
   *
   * Reads the leader from the chapter build (`leaderId`), not `rows[0]`
   * (PR-0003): the row list can legitimately be empty or reordered by AP
   * eligibility, and the fallen pose must render regardless.
   */
  /**
   * The victory portrait, face-cropped into {@link RESULTS_HERO_FRAME} from
   * the measured `face-crops.json` geometry (PR-0078: the previous markup let
   * the browser's intrinsic-ratio sizing land the image wherever it fell and
   * the wedge's `overflow: hidden` clipped whatever missed, which is how a win
   * was celebrated with one eye). `manualCrop: true` is load-bearing — without
   * it {@link refineFaceCrop}'s DOM sweep adopts this `<img>` on its own next
   * frame and overwrites the box below with its square-tile percentage math.
   */
  private victoryHeroHtml(leader: string): string {
    const box = resultsHeroBox(leader);
    const style =
      `position:absolute;left:${box.left.toFixed(2)}px;top:${box.top.toFixed(2)}px;` +
      `width:${box.width.toFixed(2)}px;height:${box.height.toFixed(2)}px;max-width:none;object-fit:fill`;
    const img = portraitImgHtml(leader, '', { style, manualCrop: true }).replace('<img ', '<img class="rres__hero" ');
    if (!img) return '';
    return `<div class="rres__hero-frame">${img}</div>`;
  }

  private heroHtml(): string {
    const leader = leaderId(getChapter(this.opts.chapterId));
    if (!leader) return '';
    if (this.victory) {
      return this.victoryHeroHtml(leader);
    }
    const hurt = artUrl(`art/characters/${leader}/hurt.png`);
    const ko = artUrl(`art/characters/${leader}/ko.png`);
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
        detail: `×${this.rows.length} PARTY`,
      },
    ];
    // FFX-2 pays EXP to the girl and AP to the dressphere she is wearing, so
    // both belong on the ledger [ffx2-combat-core §3.0] — but a formation that
    // pays no AP gets no row, rather than a printed zero.
    if (this.awardUnit === 'EXP' && result.ap > 0) {
      lines.push({ kind: 'count', key: 'AP', value: result.ap, detail: 'PER DRESSPHERE' });
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
    const p = this.countProgress();

    const heading = this.victory ? (this.silent ? 'Results' : 'Victory') : 'Defeat';

    const tags: string[] = [];
    if (this.victory && this.opts.result.overkilled.length > 0) {
      tags.push(`OVERKILL ×${this.opts.result.overkilled.length}`);
    }
    if (this.wasNewBest) tags.push('NEW BEST');

    const ledgerHtml = this.ledger
      .map((line) => {
        const value =
          line.kind === 'count' ? formatNumber(Math.round(line.value * p)) : escapeHtml(line.value);
        const valueClass = line.kind === 'items' ? 'rres__v rres__v--items' : 'rres__v';
        const detail = line.detail ? `<div class="rres__d">${escapeHtml(line.detail)}</div>` : '';
        return `<div class="rres__line">
            <div class="rres__k">${escapeHtml(line.key)}</div>
            <div class="${valueClass}">${value}</div>
            ${detail}
          </div>`;
      })
      .join('');

    page.innerHTML = `
      <div class="rres__head">
        <div class="rres__chip">RESULTS &middot; ${escapeHtml(formatClearTime(this.clearMs))}</div>
        <div class="rres__heading">${heading}</div>
        <div class="rres__rule-row">
          <div class="rres__rule"></div>
          ${tags.map((t) => `<span class="rres__tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        ${this.quip ? `<div class="rres__quip">${escapeHtml(this.quip)}</div>` : ''}
      </div>

      <div class="rres__ledger${this.ledger.length > 3 ? ' rres__ledger--compact' : ''}">${ledgerHtml}</div>

      <div class="rres__party">${this.membersHtml(p)}</div>
      ${this.victory ? this.confirmHtml() : this.actionsHtml()}
    `;
    this.stage.el.classList.add('rres--visible');
  }

  private membersHtml(p: number): string {
    return this.rows
      .map((row) => {
        // The initial is the face's fallback, not its alternative: a portrait
        // that 404s removes its own <img> and reveals the letter underneath.
        // `partyFaceHtml` is the same dressphere/`-x2`-aware ladder the pause
        // screen and battle HUD climb (LIVE-A2-1, docs/handoff/fix3-ffx2-hud-prep.md) —
        // this row used to ask only `portraits/<row.id>.png`, right for FFX,
        // a gap for FFX-2.
        const face = `<span>${escapeHtml(row.name.charAt(0).toUpperCase())}</span>${partyFaceHtml({
          id: row.id,
          name: row.name,
          dressphere: row.dressphere,
        })}`;
        const levelHtml =
          this.victory && row.levelDelta > 0 && p >= 1
            ? `<span class="rres__level-up">+${row.levelDelta} ${escapeHtml(row.levelUnit)}</span>`
            : '';
        const award = this.victory
          ? `<span class="rres__member-ap">+${formatNumber(Math.round(row.award * p))}<small>${row.awardUnit}</small></span>`
          : '';
        return `
          <div class="rres__member">
            <div class="rres__face">${face}</div>
            <div class="rres__member-text">
              <div class="rres__member-line">
                <span class="rres__member-name">${escapeHtml(row.name)}</span>
                ${levelHtml}
              </div>
              <div class="rres__member-detail">${escapeHtml(row.detail)}</div>
            </div>
            ${award}
          </div>
        `;
      })
      .join('');
  }

  private confirmHtml(): string {
    return `<div class="rres__confirm" data-action="confirm"><span>CONFIRM ▸</span></div>`;
  }

  private actionsHtml(): string {
    const slabs = DEFEAT_ACTIONS.map((action, i) => {
      const selected = i === this.actionIndex ? ' rres__action--selected' : '';
      return `<div class="rres__action${selected}" data-action="results:${action.choice}" role="button" tabindex="0"><span>${action.label}</span></div>`;
    }).join('');
    return `<div class="rres__actions">${slabs}</div>`;
  }
}
