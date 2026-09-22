/**
 * Everything the remade pause screen puts on screen, and nothing about input.
 *
 * `PauseScreen.ts` owns the lifecycle, the keyboard claim and what a press
 * means. This owns the DOM: the four painting layers, the tab strip, the two
 * columns, the objective line and the two prompts — plus the model behind each
 * of them, so a test can ask "what rows does the OPTIONS tab have here" without
 * a screen, an `App` or a battle.
 *
 * The split is the same one `PartyPrepContent.ts` makes, and it is what keeps
 * both halves under the house 400-line cap.
 */

import type { BattleState, GameId, TurnPreview } from '../../../battle/common/types.ts';
import type { Chapter } from '../../../data/encounters.ts';
import type { ChapterMeta } from '../../../data/chapter-meta.ts';
import type { SaveStore } from '../../SaveData.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { MusicPlayer } from '../../../ui/common/MusicPlayer.ts';
import { battleHelpOn, onboardingLive } from '../../../ui/coach/coachState.ts';
import {
  encounterProgress,
  evaluateObjectives,
  type ObjectiveContext,
  type ObjectiveStatus,
} from '../../../ui/common/chapterObjectives.ts';
import { PortraitStage } from './PortraitStage.ts';
import { chromeSideForCombatant, plateIdFor } from './plates.ts';
import { buildTabs, memberIdOf, type PauseTab } from './tabs.ts';
import { memberColumns } from './meters.ts';
import {
  chapterColumns,
  controlsColumns,
  guideColumns,
  optionsColumns,
  type PanelColumn,
  type PanelRow,
} from './panels.ts';
import { backHtml, baselineHtml, columnsHtml, fromMeters, fromPanels, objectiveHtml, tabsHtml } from './markup.ts';

export interface PauseViewDeps {
  chapter: Chapter;
  meta: ChapterMeta | undefined;
  save: SaveStore;
  state: () => Readonly<BattleState> | null;
  context: () => ObjectiveContext;
  chainLength?: number;
  /** The CTB forecast, FFX only. `null` when the host cannot supply one. */
  turnOrder: () => readonly TurnPreview[] | null;
  canRestart: boolean;
  canChapterSelect: boolean;
  canQuit: boolean;
  extraRows: readonly { id: string; label: string }[];
}

/** Which tab is up, where the cursor is. */
export interface PauseFocus {
  tabId: string;
  focus: 'tabs' | 'body';
  rowId: string | null;
}

export class PauseView {
  readonly portrait: PortraitStage;
  music: MusicPlayer | null = null;
  tabs: PauseTab[] = [];

  private readonly root: HTMLElement;
  private readonly deps: PauseViewDeps;
  /** The last member tab visited: a fixed tab keeps that member's painting. */
  private plateMemberId: string | null = null;

  constructor(root: HTMLElement, deps: PauseViewDeps) {
    this.root = root;
    this.deps = deps;
    root.innerHTML = this.frameHtml();
    this.portrait = new PortraitStage({
      root: this.q('art') ?? root,
      reduceMotion: deps.save.settings.reduceMotion,
    });
    this.tabs = buildTabs(deps.state());
  }

  private get game(): GameId {
    return this.deps.chapter.game;
  }

  private q(role: string): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(`[data-role="${role}"]`);
  }

  /** The static layers. Everything else is rendered into the `data-role` holes. */
  private frameHtml(): string {
    const game = this.game === 'ffx2' ? 'Final Fantasy X-2' : 'Final Fantasy X';
    return `
      <div class="pause__art" data-role="art"></div>
      <div class="pause__tint" aria-hidden="true"></div>
      <div class="pause__falloff" aria-hidden="true"></div>
      <div class="pause__vig" aria-hidden="true"></div>
      <div class="pause__grain" aria-hidden="true"></div>

      <div class="pause__ui" data-role="ui">
        <div class="pause__brand">Pyrefly Reprise &middot; ${escapeHtml(game)}</div>
        <nav class="pause__tabs" data-role="tabs" role="tablist" aria-label="Paused"></nav>
        <div class="pause__body" data-role="body"></div>
        <div class="pause__obj" data-role="obj"></div>
        <div class="pause__prompts" data-role="prompts">${backHtml()}</div>
      </div>
      <div class="pause__baseline" data-role="baseline">${baselineHtml()}</div>
    `;
  }

  // -------------------------------------------------------------- rendering

  /** Redraw everything from the live state. Returns the focus, corrected. */
  render(at: PauseFocus): PauseFocus {
    this.tabs = buildTabs(this.deps.state());
    let tabId = at.tabId;
    if (!this.tabs.some((t) => t.id === tabId)) tabId = this.tabs[0]?.id ?? 'chapter';

    const memberId = memberIdOf(tabId);
    if (memberId) this.plateMemberId = memberId;

    const tabsEl = this.q('tabs');
    if (tabsEl) tabsEl.innerHTML = tabsHtml(this.tabs, tabId);
    this.scrollActiveTabIntoView(tabId);

    this.renderPlate();
    const rowId = this.renderBody({ ...at, tabId });
    this.renderObjective();
    return { tabId, focus: at.focus, rowId };
  }

  /**
   * FOC-02 (`critic/reviews/5e92289…-focused.json`): at 390x844 the strip is
   * `overflow-x: auto` (`.pause__swipe`) with a `scrollWidth` well past its
   * `clientWidth`, and nothing ever moved `scrollLeft` — Guide, Options,
   * Controls and Music were each *selected* while sitting outside the 350px
   * window. `tabsHtml` rebuilds the strip's markup from scratch on every
   * render, so the element this scrolls is always the one just inserted, never
   * a stale reference from the previous tab.
   */
  private scrollActiveTabIntoView(tabId: string): void {
    const el = this.q('tabs')?.querySelector<HTMLElement>(`[data-tab="${tabId}"]`);
    if (!el || typeof el.scrollIntoView !== 'function') return;
    el.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: this.deps.save.settings.reduceMotion ? 'auto' : 'smooth',
    });
  }

  /**
   * The painting, and which side the chrome stands on.
   *
   * A fixed tab keeps the last member's plate, so CHAPTER or OPTIONS never
   * blanks the screen and the mirror does not flip under a tab change that had
   * nothing to do with the art.
   */
  private renderPlate(): void {
    const state = this.deps.state();
    const memberId = this.plateMemberId ?? state?.activeIds[0] ?? null;
    if (memberId) this.portrait.show(plateIdFor(memberId, this.game), memberId);
    else if (this.deps.meta) this.portrait.show(this.deps.meta.heroArt.replace(/^pause\//, ''));
    const side = memberId ? chromeSideForCombatant(memberId, this.game) : 'left';
    this.root.classList.toggle('pause--mirror', side === 'right');
  }

  /** Returns the row id the cursor ended on, which may not be the one asked for. */
  private renderBody(at: PauseFocus): string | null {
    const el = this.q('body');
    if (!el) return at.rowId;
    if (at.tabId !== 'music') {
      this.music?.dispose();
      this.music = null;
    }
    el.dataset['tab'] = at.tabId;

    const memberId = memberIdOf(at.tabId);
    if (memberId) {
      const state = this.deps.state();
      const c = state?.combatants[memberId];
      el.innerHTML = c
        ? columnsHtml(
            fromMeters(
              memberColumns(c, state, this.game, {
                turnOrder: this.deps.turnOrder(),
                atbMode: this.deps.save.settings.ffx2Atb,
              }),
            ),
          )
        : '';
      return null;
    }

    if (at.tabId === 'music') {
      if (!this.music) {
        el.innerHTML = '';
        this.music = new MusicPlayer({ root: el, chapterKeys: this.chapterMusicKeys() });
      }
      return null;
    }

    const columns = this.panelColumns(at.tabId);
    const selectable = columns.flatMap((c) => c.rows.filter((r) => r.selectable));
    const rowId = selectable.some((r) => r.id === at.rowId) ? at.rowId : (selectable[0]?.id ?? null);
    el.innerHTML = columnsHtml(fromPanels(columns, at.focus === 'body' ? rowId : null));
    return rowId;
  }

  /**
   * The big line: the first objective that is not yet done, or the last once
   * they all are. The thing the player paused to check is never more than zero
   * clicks away, on every tab.
   */
  private renderObjective(): void {
    const el = this.q('obj');
    if (!el) return;
    const meta = this.deps.meta;
    if (!meta) {
      el.innerHTML = objectiveHtml(this.deps.chapter.title, this.deps.chapter.title);
      return;
    }
    const rows = this.objectives();
    const current = rows.find((o) => !o.done) ?? rows[rows.length - 1];
    // "CHAPTER n · location, or the battle tally in a chained chapter"
    // (options.json, contentMap.bottomLeft). Chapter 3 is four battles and
    // chapter 5 is five; the other three have no tally to print, and a
    // one-formation "BOSS HP 100%" here would only repeat the CHAPTER tab.
    const chained = (this.deps.chainLength ?? 1) > 1;
    const progress = chained ? this.progress() : null;
    const eyebrow =
      `Chapter ${meta.numeral} · ${meta.location} — ${meta.subtitle}` +
      (progress ? ` · ${progress.label}` : '');
    el.innerHTML = objectiveHtml(eyebrow, current?.label ?? meta.title);
  }

  // ----------------------------------------------------------------- model

  /** The rows of whichever fixed tab is named. */
  panelColumns(tabId: string): PanelColumn[] {
    switch (tabId) {
      case 'options':
        return optionsColumns({
          settings: this.deps.save.settings,
          battleHelpOn: onboardingLive() ? battleHelpOn() : null,
          canRestart: this.deps.canRestart,
          canChapterSelect: this.deps.canChapterSelect,
          canQuit: this.deps.canQuit,
          extraRows: this.deps.extraRows,
        });
      case 'controls':
        return controlsColumns();
      case 'guide':
        return guideColumns(this.deps.meta, this.deps.save.settings.guideVisible);
      default:
        return chapterColumns({
          meta: this.deps.meta,
          objectives: this.objectives(),
          progress: this.progress(),
          playTimeMs: this.deps.save.playTime(this.deps.chapter.id),
          sceneKey: this.deps.chapter.sceneKey,
          state: this.deps.state(),
          game: this.game,
        });
    }
  }

  /** The selectable rows of a fixed tab, flattened across both columns. */
  bodyRows(tabId: string): PanelRow[] {
    if (memberIdOf(tabId) || tabId === 'music') return [];
    return this.panelColumns(tabId).flatMap((c) => c.rows.filter((r) => r.selectable));
  }

  objectives(): ObjectiveStatus[] {
    const meta = this.deps.meta;
    return meta ? evaluateObjectives(meta.objectives, this.deps.context()) : [];
  }

  progress(): ReturnType<typeof encounterProgress> {
    return encounterProgress(
      this.deps.context(),
      this.deps.chainLength !== undefined ? { chainLength: this.deps.chainLength } : {},
    );
  }

  private chapterMusicKeys(): string[] {
    const music = this.deps.chapter.music;
    const fromChapter = [music.scene, music.battle, music.phase2, music.victory, music.post];
    return [...new Set([...(this.deps.meta?.musicKeys ?? []), ...fromChapter])].filter(
      (k): k is string => typeof k === 'string' && k.length > 0,
    );
  }

  // ------------------------------------------------------------- the rest

  /** `H`: every line goes, the painting stays. */
  setBare(bare: boolean): void {
    this.root.classList.toggle('pause--bare', bare);
  }

  get mirrored(): boolean {
    return this.root.classList.contains('pause--mirror');
  }

  /** The chrome photo mode hides, and the line it hides with it. */
  get chrome(): HTMLElement {
    return this.q('ui') ?? this.root;
  }

  setBaselineVisible(on: boolean): void {
    const el = this.q('baseline');
    if (!el) return;
    if (on) el.style.removeProperty('display');
    else el.style.display = 'none';
  }

  /** What is on screen, for the debug API and the e2e specs. */
  snapshot(at: PauseFocus): Record<string, unknown> {
    return {
      tabs: this.tabs.map((t) => t.id),
      tab: at.tabId,
      focus: at.focus,
      row: at.rowId,
      mirrored: this.mirrored,
      portrait: this.portrait.snapshot(),
      music: this.music?.nowPlaying ?? null,
      objectives: this.objectives(),
      progress: this.progress(),
    };
  }

  dispose(): void {
    this.music?.dispose();
    this.music = null;
    this.portrait.dispose();
  }
}
