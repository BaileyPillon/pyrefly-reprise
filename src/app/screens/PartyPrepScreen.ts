/**
 * The prep step between choosing a chapter and fighting it.
 *
 * This is a **shell**. It owns the frame, the tab strip, the keyboard routing
 * and the "begin" / "back" contract with the flow; the panels inside it — FFX's
 * Party / Sphere Grid / Equipment / Items / Overdrive modes, FFX-2's Garment
 * Grid and dresspheres — are built by the UI agents and plugged in with
 * {@link registerPrepPanel}.
 *
 * A chapter with no panels registered is still playable: the shell shows the
 * party as it comes out of the build and Enter starts the fight.
 *
 * COMPOSING INTO THE FRAME. The shell draws the approved Ink & Gold frame —
 * backdrop, roster column, tab strip, START BATTLE, field slots — and a panel
 * that sets `fullScreen: false` supplies only the body on the ivory sheet.
 * Register one panel per tab: each gets its own container, so returning to a
 * visited tab shows that tab, not whichever was drawn last. The roster cursor
 * is the shell's; a panel hears about it through `ctx.memberId` at mount and
 * `selectMember()` afterwards.
 */

import '../../ui/common/party-prep.css';
import type { GameId } from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import type { FlowScreen } from './BattleScreenFlow.ts';
import { createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { romanNumeral } from '../../ui/common/roman.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { rosterHtml, slotsHtml, statSheetHtml } from './PartyPrepContent.ts';
import { artUrl } from '../../engine/PaintedArt.ts';

/** One tab in the prep menu, supplied by a UI agent. */
export interface PrepPanel {
  /** Tab id, unique per game. */
  id: string;
  /** Tab label, e.g. `'Sphere Grid'`. */
  label: string;
  /** Which game's prep menu this belongs to. */
  game: GameId;
  /** Display order, low first. */
  order?: number;
  /**
   * `true`: the panel is a whole menu, not a tab — it draws its own header and
   * tab strip and wants the screen to itself, and the shell renders no chrome.
   *
   * `false`: the panel composes into the shell's frame and draws only its body,
   * even when it is the only panel registered for its game.
   *
   * Omitted: a game with exactly one registered panel is treated as
   * full-screen (the original rule, kept so existing panels are unchanged);
   * with two or more, each is a tab in the frame.
   */
  fullScreen?: boolean;
  /**
   * Build the panel's DOM into its own container. Called once, when the tab is
   * first opened; after that the container is shown and hidden, never rebuilt.
   * `memberId` is the roster member selected at that moment.
   */
  mount(root: HTMLElement, ctx: PrepPanelContext): void;
  unmount?(): void;
  /** Returns true when the panel consumed the input. */
  handleInput?(input: InputSnapshot): boolean;
  /**
   * The roster cursor moved (Up/Down or a click on the column). Called for
   * every mounted panel, visible or not, so a tab is already current when the
   * player switches to it. Composing panels only.
   */
  selectMember?(memberId: string): void;
  /**
   * A control the open tab adds to the shell's hint line right now, or null
   * for none (PR-0127: the CHAPTER tab's PG UP / PG DN scroll, shown only
   * while one of its columns has more copy). Read after every input frame and
   * tab change; the line is rewritten only when the answer changes.
   */
  hint?(): { keys: string; label: string } | null;
}

/** What a panel is told when it mounts. */
export interface PrepPanelContext {
  chapter: Chapter;
  /** Id of the roster member selected when the panel mounted. */
  memberId: string;
}

const panels: PrepPanel[] = [];

/** Add a prep panel. UI agents call this once at module load. */
export function registerPrepPanel(panel: PrepPanel): void {
  const i = panels.findIndex((p) => p.id === panel.id && p.game === panel.game);
  if (i >= 0) panels[i] = panel;
  else panels.push(panel);
}

/** Panels registered for a game, in display order. */
export function prepPanelsFor(game: GameId): PrepPanel[] {
  return panels.filter((p) => p.game === game).sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

export interface PartyPrepScreenOptions {
  chapter: Chapter;
}

export class PartyPrepScreen extends Screen implements FlowScreen<boolean> {
  readonly name = 'party-prep';
  readonly done: Promise<boolean>;

  private resolve!: (begin: boolean) => void;
  private settled = false;
  /** How the screen was left, for the debug snapshot and e2e. */
  private outcome: 'begin' | 'back' | null = null;
  private readonly chapter: Chapter;
  private tabs: PrepPanel[] = [];
  private index = 0;
  private readonly mounted = new Set<string>();
  private body: HTMLElement | null = null;
  private stage: Stage | null = null;
  /** Which roster member the sheet is showing. Up/Down moves it. */
  private member = 0;

  constructor(opts: PartyPrepScreenOptions) {
    super();
    this.chapter = opts.chapter;
    this.done = new Promise((r) => {
      this.resolve = r;
    });
  }

  private settle(begin: boolean): void {
    if (this.settled) return;
    this.settled = true;
    this.outcome = begin ? 'begin' : 'back';
    this.resolve(begin);
  }

  override enter(): void {
    installInkGoldStyles();
    this.tabs = prepPanelsFor(this.chapter.game);
    this.root.className = 'screen';

    if (this.ownsWholeScreen) {
      // The registered menu draws its own frame; the shell gets out of the way
      // rather than boxing a full-screen design inside a second one.
      this.root.innerHTML = '<div data-role="body" style="position:absolute;inset:0"></div>';
      this.body = this.root.querySelector('[data-role="body"]');
      this.renderBody();
      void this.app.fade('clear', 400);
      return;
    }

    this.stage = createStage(this.root, 'prep');
    this.stage.el.classList.add('ig');
    if (this.chapter.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');

    this.stage.stage.innerHTML = `
      <div class="prep__wash" style="background-image:url(${artUrl(`art/backdrops/${this.chapter.sceneKey}.png`)})"></div>
      <div class="prep__veil"></div>

      <div class="prep__eyebrow">
        <span class="prep__eyebrow-rule"></span>
        <span class="prep__eyebrow-label">PARTY PREP</span>
      </div>
      <div class="prep__where">${romanNumeral(this.chapter.number)} &middot; ${escapeHtml(
        this.chapter.title.toUpperCase(),
      )} &mdash; ${escapeHtml(this.chapter.location.toUpperCase())}</div>

      <div class="prep__roster" data-role="roster"></div>
      <div class="prep__tabs" data-role="tabs"></div>
      <div class="prep__sheet"><div class="prep__sheet-inner" data-role="body"></div></div>
      <div class="prep__hint">
        <b>&#9650; &#9660;</b> PARTY &nbsp;&middot;&nbsp; <b>&#9664; &#9654;</b> TABS
        &nbsp;&middot;&nbsp; <span class="prep__hint-act" data-action="prep:begin" role="button" tabindex="0"><b>ENTER</b> BEGINS THE BATTLE</span>
        &nbsp;&middot;&nbsp; <span class="prep__hint-act" data-action="prep:back" role="button" tabindex="0"><b>ESC</b> BACK</span><span data-role="panel-hint"></span>
      </div>

      <div class="prep__start" data-action="prep:begin">
        <span><span class="prep__start-tri"></span>START BATTLE</span>
      </div>
      <div class="prep__slots">${slotsHtml(this.chapter.buildRef)}</div>
    `;

    this.body = this.stage.stage.querySelector('[data-role="body"]');
    this.renderRoster();
    this.renderTabs();
    this.renderBody();
    void this.app.fade('clear', 400);
  }

  /** The open tab's own control on the hint line (see {@link PrepPanel.hint}). */
  private panelHintHtml = '';
  private renderPanelHint(): void {
    const slot = this.root.querySelector<HTMLElement>('[data-role="panel-hint"]');
    if (!slot) return;
    const h = this.tabs[this.index]?.hint?.() ?? null;
    const html = h ? ` &nbsp;&middot;&nbsp; <b>${escapeHtml(h.keys)}</b> ${escapeHtml(h.label)}` : '';
    if (html === this.panelHintHtml) return;
    this.panelHintHtml = html;
    slot.innerHTML = html;
  }

  /**
   * True when a registered panel is a whole menu and owns the frame: any panel
   * says `fullScreen: true`, or it is the game's only panel and has not opted
   * into the frame with `fullScreen: false`.
   */
  private get ownsWholeScreen(): boolean {
    if (this.tabs.some((t) => t.fullScreen === true)) return true;
    return this.tabs.length === 1 && this.tabs[0]!.fullScreen !== false;
  }

  /** The member id under the roster cursor. */
  private get memberId(): string {
    return this.chapter.buildRef.members[this.member]?.id ?? '';
  }

  private renderTabs(): void {
    const strip = this.root.querySelector('[data-role="tabs"]');
    if (!strip) return;
    if (!this.tabs.length) {
      // No panels registered yet: the shell's own member sheet IS the tab.
      strip.innerHTML = `<div class="prep__tab" aria-selected="true">STATS</div>`;
      return;
    }
    strip.innerHTML = this.tabs
      .map(
        (t, i) =>
          `<div class="prep__tab" aria-selected="${i === this.index}" data-action="prep:tab:${t.id}">${escapeHtml(
            t.label.toUpperCase(),
          )}</div>`,
      )
      .join('');
  }

  /** The roster column: every member the chapter lets the player look at. */
  private renderRoster(): void {
    const col = this.root.querySelector('[data-role="roster"]');
    if (!col) return;
    col.innerHTML = rosterHtml(this.chapter.buildRef, this.member);
  }

  private renderBody(): void {
    const body = this.body;
    if (!body) return;
    const panel = this.tabs[this.index];
    if (!panel) {
      body.classList.remove('prep__sheet-inner--panel');
      body.innerHTML = statSheetHtml(this.chapter.buildRef, this.member);
      return;
    }

    // A full-screen panel owns `body` outright; there is only ever one.
    if (this.ownsWholeScreen) {
      if (!this.mounted.has(panel.id)) {
        body.replaceChildren();
        panel.mount(body, { chapter: this.chapter, memberId: this.memberId });
        this.mounted.add(panel.id);
      }
      return;
    }

    // Composing panels each keep their own container, shown and hidden rather
    // than rebuilt — otherwise a second visit to a tab would find the DOM of
    // whichever tab was mounted last.
    body.classList.add('prep__sheet-inner--panel');
    const containers = [...body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && 'panel' in el.dataset);
    let container = containers.find((el) => el.dataset['panel'] === panel.id);
    if (!container) {
      container = document.createElement('div');
      container.className = 'prep__panel';
      container.dataset['panel'] = panel.id;
      body.appendChild(container);
      containers.push(container);
    }
    for (const el of containers) el.hidden = el !== container;
    if (!this.mounted.has(panel.id)) {
      panel.mount(container, { chapter: this.chapter, memberId: this.memberId });
      this.mounted.add(panel.id);
    }
  }

  override handleInput(input: InputSnapshot): void {
    const panel = this.tabs[this.index];
    const consumed = panel?.handleInput?.(input) ?? false;
    this.renderPanelHint();
    if (consumed) return;

    // Clicks and taps on the frame arrive as `data-action` names, which are
    // exactly this screen's trigger names (START BATTLE, a roster row, a tab).
    for (const action of input.actions) {
      if (action === 'prep:begin') audio.playSfx('confirm');
      else if (action === 'prep:back') audio.playSfx('cancel');
      else if (action.startsWith('prep:member-') || action.startsWith('prep:tab:')) audio.playSfx('cursor-move');
      this.trigger(action);
    }

    if (this.tabs.length > 1) {
      if (input.justPressed('right')) this.move(1);
      if (input.justPressed('left')) this.move(-1);
    }
    // Up/Down walks the roster column, which the shell's own sheet follows.
    if (input.justPressed('down')) this.moveMember(1);
    if (input.justPressed('up')) this.moveMember(-1);
    if (input.justPressed('confirm') || input.justPressed('start')) {
      audio.playSfx('confirm');
      this.settle(true);
    }
    if (input.justPressed('cancel')) {
      audio.playSfx('cancel');
      this.settle(false);
    }
  }

  private move(dir: 1 | -1): void {
    const n = this.tabs.length;
    this.index = (this.index + dir + n) % n;
    audio.playSfx('cursor-move');
    this.renderTabs();
    this.renderBody();
    this.renderPanelHint();
  }

  /** Move the roster cursor and repoint the sheet at whoever it lands on. */
  private moveMember(dir: 1 | -1): void {
    const n = this.chapter.buildRef.members.length;
    if (n <= 1) return;
    this.member = (this.member + dir + n) % n;
    audio.playSfx('cursor-move');
    this.onMemberChanged();
  }

  /** Redraw the column, then the shell's own sheet or every mounted panel. */
  private onMemberChanged(): void {
    this.renderRoster();
    if (!this.tabs.length) {
      this.renderBody();
      return;
    }
    for (const panel of this.tabs) {
      if (this.mounted.has(panel.id)) panel.selectMember?.(this.memberId);
    }
  }

  override trigger(name: string): boolean {
    if (name === 'prep:begin') {
      this.settle(true);
      return true;
    }
    if (name === 'prep:back') {
      this.settle(false);
      return true;
    }
    if (name.startsWith('prep:member-')) {
      const i = Number(name.slice('prep:member-'.length));
      if (!Number.isInteger(i) || i < 0 || i >= this.chapter.buildRef.members.length) return false;
      this.member = i;
      this.onMemberChanged();
      return true;
    }
    if (name.startsWith('prep:tab:')) {
      const i = this.tabs.findIndex((t) => t.id === name.slice(9));
      if (i < 0) return false;
      this.index = i;
      this.renderTabs();
      this.renderBody();
      return true;
    }
    return false;
  }

  override exit(): void {
    for (const panel of this.tabs) {
      if (this.mounted.has(panel.id)) panel.unmount?.();
    }
    this.mounted.clear();
    this.stage?.destroy();
    this.stage = null;
    this.settle(false);
  }

  override snapshot(): Record<string, unknown> {
    return {
      chapter: this.chapter.id,
      game: this.chapter.game,
      tabs: this.tabs.map((t) => t.id),
      tab: this.tabs[this.index]?.id ?? null,
      member: this.chapter.buildRef.members[this.member]?.id ?? null,
      outcome: this.outcome,
      panelsRegistered: this.tabs.length,
    };
  }
}
