/**
 * The pause menu, remade on the Until Dawn character screen.
 *
 * Bailey, 21 Sep 2026, shown `docs/concepts/pause-until-dawn/` with four
 * questions: *"B, yes, yes, yes"* — grade B "ours"; the text block sits on
 * whichever side of the painting is empty; the mocked meters are right; MUSIC
 * is its own tab. The approved target is the tile *"Pause remade on the Until
 * Dawn character screen"* in `docs/target/targets.json`; the six frames it
 * points at are what this screen is measured against, and
 * `docs/handoff/pause-remake.md` is how it was built.
 *
 * This half owns the lifecycle, the keyboard claim and what a press means.
 * `pause/PauseView.ts` owns everything on screen, `pause/PauseOverlays.ts`
 * photo mode and the replayed briefing.
 *
 * An **overlay** (`App.pushOverlay`): the battle underneath keeps being drawn
 * and stops being ticked, and `BattleScreen` freezes the presenter — and the
 * FFX-2 Active ATB clock with it — through `PauseScreenOptions.onPause`.
 *
 * Two focus levels, and Esc means "up one": `tabs` (Left/Right cycle, Down or
 * Confirm enters a tab that has rows, Esc resumes) and `body` (Up/Down walk
 * the rows, Left/Right adjust, Esc goes back to the strip). `Q`/`E` and
 * `L1`/`R1` cycle from either.
 *
 * The screen takes a keyboard claim for as long as it lives, so a command menu
 * still listening on `window` underneath never sees a key. It is also the only
 * route to `H` and to the keys `pause/keys.ts` re-points.
 */

import { getChapterMeta, type ChapterMeta } from '../../data/chapter-meta.ts';
import { audio } from '../../audio/index.ts';
import { Screen } from '../Screen.ts';
import type { Button, InputSnapshot } from '../Input.ts';
import { createFullBleedStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import type { ObjectiveContext } from '../../ui/common/chapterObjectives.ts';
import { PauseView, type PauseFocus } from './pause/PauseView.ts';
import { PauseOverlays } from './pause/PauseOverlays.ts';
import { cycleTab, memberIdOf } from './pause/tabs.ts';
import type { PanelRow } from './pause/panels.ts';
import { activateRow } from './pause/actions.ts';
import { pauseKeyIntent } from './pause/keys.ts';
import type { PauseScreenOptions } from './pause/options.ts';
export type { PauseScreenOptions } from './pause/options.ts';
import '../../ui/common/pause-screen.css';

/** How far the pause menu ducks the music under itself. */
const PAUSE_DUCK = 0.35;

export class PauseScreen extends Screen {
  readonly name = 'pause';

  private readonly opts: PauseScreenOptions;
  private readonly meta: ChapterMeta | undefined;
  private stage: Stage | null = null;
  private view: PauseView | null = null;
  private overlays: PauseOverlays | null = null;

  private at: PauseFocus = { tabId: 'chapter', focus: 'tabs', rowId: null };
  private closing = false;
  private panelsHidden = false;
  private releaseKeyboard: (() => void) | null = null;
  /**
   * Abstract buttons already answered raw this frame.
   *
   * The raw handler fires on keydown, before the frame's `handleInput`, and
   * drops the button it consumed so one press is not acted on twice.
   */
  private readonly suppressed = new Set<Button>();

  constructor(opts: PauseScreenOptions) {
    super();
    this.opts = opts;
    this.meta = getChapterMeta(opts.chapter.id);
  }

  // ------------------------------------------------------------------ enter

  override enter(): void {
    installInkGoldStyles();
    this.opts.onPause?.(true);
    audio.duck(PAUSE_DUCK, 0.2);
    audio.playSfx('menu-page');
    this.releaseKeyboard = this.app.input.claimKeyboard(this.onClaimedKey);

    this.panelsHidden = this.app.save.settings.pausePanelsHidden;
    this.root.className = 'screen';
    // Not a letterboxed stage: the painting has to be the whole window at any
    // aspect, and a 640x360 stage can only ever be 16:9.
    this.stage = createFullBleedStage(this.root, 'pause');
    this.stage.el.classList.add('ig');
    if (this.opts.chapter.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');

    this.view = new PauseView(this.stage.stage, {
      chapter: this.opts.chapter,
      meta: this.meta,
      save: this.app.save,
      state: () => this.opts.state?.() ?? null,
      context: () => this.context(),
      ...(this.opts.chainLength === undefined ? {} : { chainLength: this.opts.chainLength }),
      turnOrder: () => this.opts.turnOrder?.() ?? null,
      canRestart: this.opts.onRestart !== undefined,
      canChapterSelect: this.opts.onChapterSelect !== undefined,
      canQuit: this.opts.onQuitToTitle !== undefined,
      extraRows: this.opts.extraRows ?? [],
    });
    this.overlays = new PauseOverlays({
      app: this.app,
      self: this,
      chrome: () => this.view?.chrome ?? null,
      root: () => this.stage?.stage ?? null,
      setBaselineVisible: (on) => {
        this.view?.setBaselineVisible(on);
        if (on) this.view?.setBare(this.panelsHidden);
      },
      refresh: () => this.refresh(),
    });
    // "The active party member first": the leading tab is the first member on
    // the field, and it is the one the menu opens on.
    this.at = { tabId: this.view.tabs[0]?.id ?? 'chapter', focus: 'tabs', rowId: null };
    this.refresh();
    this.view.setBare(this.panelsHidden);
  }

  private context(): ObjectiveContext {
    const state = this.opts.state?.() ?? null;
    return { state, log: this.opts.log?.() ?? state?.log ?? [], links: this.opts.links?.() ?? 1 };
  }

  private refresh(): void {
    if (this.view) this.at = this.view.render(this.at);
  }

  // ------------------------------------------------------------------ input

  override handleInput(input: InputSnapshot): void {
    if (this.overlays?.briefingUp) return;
    if (this.overlays?.photoUp) {
      if (input.justPressed('cancel') || this.took(input, 'l1') || input.actions.includes('photo:exit')) {
        this.overlays.exitPhoto();
      }
      this.suppressed.clear();
      return;
    }

    for (const action of input.actions) this.handleAction(action);

    if (this.took(input, 'triangle')) {
      this.togglePanels();
      this.suppressed.clear();
      return;
    }
    if (this.panelsHidden) {
      if (input.justPressed('cancel') || this.took(input, 'start')) this.close();
      this.suppressed.clear();
      return;
    }
    if (this.took(input, 'l1')) this.cycle(-1);
    if (this.took(input, 'r1')) this.cycle(1);

    if (this.at.focus === 'body') this.bodyInput(input);
    else this.tabsInput(input);

    if (input.justPressed('cancel') || this.took(input, 'start')) {
      if (this.at.focus === 'body') this.leaveBody();
      else this.close();
    }
    this.suppressed.clear();
  }

  /** `justPressed`, unless the raw handler already answered that key this frame. */
  private took(input: InputSnapshot, button: Button): boolean {
    if (this.suppressed.has(button)) return false;
    return input.justPressed(button);
  }

  private tabsInput(input: InputSnapshot): void {
    if (input.justPressed('left')) this.cycle(-1);
    if (input.justPressed('right')) this.cycle(1);
    if (input.justPressed('down') || input.justPressed('confirm')) this.enterBody();
  }

  private bodyInput(input: InputSnapshot): void {
    const music = this.view?.music;
    if (this.at.tabId === 'music' && music) {
      if (input.justPressed('down')) {
        music.move(1);
        audio.playSfx('cursor-move');
      }
      if (input.justPressed('up')) {
        music.move(-1);
        audio.playSfx('cursor-move');
      }
      if (input.justPressed('confirm')) music.confirm();
      return;
    }
    const rows = this.rows();
    if (rows.length === 0) return;
    const at = Math.max(
      0,
      rows.findIndex((r) => r.id === this.at.rowId),
    );
    if (input.justPressed('down')) this.moveRow(rows, at, 1);
    if (input.justPressed('up')) this.moveRow(rows, at, -1);
    if (input.justPressed('right')) this.activate(this.at.rowId, 1);
    if (input.justPressed('left')) this.activate(this.at.rowId, -1);
    if (input.justPressed('confirm')) this.activate(this.at.rowId, 1);
  }

  private rows(): PanelRow[] {
    return this.view?.bodyRows(this.at.tabId) ?? [];
  }

  private moveRow(rows: PanelRow[], at: number, dir: 1 | -1): void {
    this.at = { ...this.at, rowId: rows[(at + dir + rows.length) % rows.length]!.id };
    audio.playSfx('cursor-move');
    this.refresh();
  }

  private enterBody(): void {
    if (this.at.tabId === 'music' && this.view?.music) {
      this.at = { ...this.at, focus: 'body' };
      audio.playSfx('confirm');
      return;
    }
    const rows = this.rows();
    if (rows.length === 0) return;
    const rowId = rows.some((r) => r.id === this.at.rowId) ? this.at.rowId : rows[0]!.id;
    this.at = { ...this.at, focus: 'body', rowId };
    audio.playSfx('confirm');
    this.refresh();
  }

  private leaveBody(): void {
    this.at = { ...this.at, focus: 'tabs' };
    audio.playSfx('cancel');
    this.refresh();
  }

  private cycle(dir: 1 | -1): void {
    const next = cycleTab(this.view?.tabs ?? [], this.at.tabId, dir);
    this.selectTab(next);
  }

  /** Jump straight to a tab (a click, a touch, a `trigger`). */
  private selectTab(id: string): void {
    if (id === this.at.tabId || !this.view?.tabs.some((t) => t.id === id)) return;
    this.at = { tabId: id, focus: 'tabs', rowId: null };
    audio.playSfx('cursor-move');
    this.refresh();
  }

  private handleAction(action: string): void {
    if (action === 'photo:exit') return;
    if (action === 'pause:panels') {
      this.togglePanels();
      return;
    }
    if (action === 'cancel' && this.panelsHidden) {
      this.close();
      return;
    }
    if (this.view?.music?.handleAction(action)) return;
    if (action.startsWith('pause:tab:')) {
      this.selectTab(action.slice('pause:tab:'.length));
      return;
    }
    if (action.startsWith('pause:row:')) {
      const id = action.slice('pause:row:'.length);
      if (!this.rows().some((r) => r.id === id)) return;
      this.at = { ...this.at, focus: 'body', rowId: id };
      this.activate(id, 1);
    }
  }

  private activate(id: string | null, dir: 1 | -1): void {
    activateRow(
      {
        save: this.app.save,
        refresh: () => this.refresh(),
        replayBriefing: () => void this.overlays?.replayBriefing(),
        onRestart: this.opts.onRestart,
        onChapterSelect: this.opts.onChapterSelect,
        onQuitToTitle: this.opts.onQuitToTitle,
        extraRows: this.opts.extraRows,
      },
      id,
      dir,
    );
  }

  private readonly onClaimedKey = (e: KeyboardEvent): void => {
    if (e.repeat || this.closing || this.overlays?.briefingUp) return;
    const { intent, suppress } = pauseKeyIntent(e.code, e.shiftKey);
    // A key that means nothing here but still carries an abstract button —
    // Shift, which `KEY_MAP` binds to `triangle`. Dropping it before anything
    // else looks at it is what stops "hold Shift, press Tab" from hiding the
    // whole chrome and leaving the Tab dead behind it (`pause/keys.ts`).
    if (intent === null) {
      if (suppress) this.suppressed.add(suppress);
      return;
    }
    if (intent === 'hide') {
      if (!this.overlays?.photoUp) this.togglePanels();
      return;
    }
    if (this.overlays?.photoUp) return;
    if (suppress) this.suppressed.add(suppress);
    if (intent === 'photo') {
      this.overlays?.enterPhoto();
      return;
    }
    // With the chrome down there is no strip to walk.
    if (this.panelsHidden) return;
    this.cycle(intent === 'tab-prev' ? -1 : 1);
  };

  private togglePanels(): void {
    if (this.overlays?.photoUp) return;
    this.panelsHidden = !this.panelsHidden;
    this.app.save.setSettings({ pausePanelsHidden: this.panelsHidden });
    audio.playSfx('menu-page');
    this.view?.setBare(this.panelsHidden);
  }

  // ------------------------------------------------------------------- frame

  override update(dt: number): void {
    this.overlays?.update(dt);
  }

  /** Draw nothing, so `App` keeps re-drawing the frozen battle underneath. */
  override render(): null {
    return null;
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    audio.playSfx('cancel');
    this.opts.onResume();
  }

  // ---------------------------------------------------------------- triggers

  override trigger(name: string): boolean {
    if (name === 'pause:close') {
      this.close();
      return true;
    }
    if (name === 'pause:photo') {
      this.overlays?.enterPhoto();
      return true;
    }
    if (name === 'pause:photo-off') {
      this.overlays?.exitPhoto();
      return true;
    }
    if (name === 'pause:panels' || name === 'pause:panels:hide' || name === 'pause:panels:show') {
      const want = name === 'pause:panels' ? !this.panelsHidden : name === 'pause:panels:hide';
      if (want !== this.panelsHidden) this.togglePanels();
      return true;
    }
    if (name.startsWith('pause:tab:')) {
      this.selectTab(name.slice('pause:tab:'.length));
      return true;
    }
    return false;
  }

  /** The `window.__pyrefly` debug view, and what the e2e specs assert on. */
  override snapshot(): Record<string, unknown> {
    return {
      chapter: this.opts.chapter.id,
      member: memberIdOf(this.at.tabId),
      rows: this.rows().map((r) => r.id),
      panelsHidden: this.panelsHidden,
      photo: this.overlays?.photoSnapshot() ?? null,
      playTimeMs: this.app.save.playTime(this.opts.chapter.id),
      ...(this.view?.snapshot(this.at) ?? {}),
    };
  }

  override exit(): void {
    // Give the keyboard back before anything else: a command menu underneath
    // is still open and is about to be the player's again.
    this.releaseKeyboard?.();
    this.releaseKeyboard = null;
    this.overlays?.dispose();
    this.overlays = null;
    this.view?.dispose();
    this.view = null;
    this.stage?.destroy();
    this.stage = null;
    audio.unduck(0.35);
    this.opts.onPause?.(false);
  }
}
