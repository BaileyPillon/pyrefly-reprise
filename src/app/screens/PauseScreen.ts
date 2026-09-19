/**
 * The pause menu.
 *
 * A full-bleed painted close-up of whoever this chapter is about, a column of
 * commands down the left, and the chapter's dossier down the right — the
 * "Until Dawn / Memories Eternal" layout translated into Ink & Gold
 * (`docs/handoff/presentation-ink-and-gold.md`; approved chrome in
 * `docs/screenshots/mockups/A-*.jpg`). The art is the screen; the chrome sits
 * on it in ink and paper slabs and never boxes it in.
 *
 * ## What it is, structurally
 *
 * An **overlay**, pushed with {@link App.pushOverlay}. The battle underneath
 * keeps being drawn every frame and stops being ticked — see that method for
 * why that falls out of the existing loop rather than needing a freeze flag.
 * The one thing the loop cannot freeze is `BattlePresenter`, which runs on its
 * own awaits; `BattleScreen` freezes that by gating the `sleep` it hands the
 * presenter, and hands this screen the gate's open/close through
 * {@link PauseScreenOptions.onPause}.
 *
 * ## Focus
 *
 * Two levels, and Esc means "up one":
 *
 * - `menu` — the left column has the cursor. Moving it *previews* the right
 *   panel (landing on MUSIC PLAYER shows the jukebox) without committing, the
 *   way the reference screen does. Esc closes the pause.
 * - `panel` — Confirm on a row that owns a panel moves the cursor into it, so
 *   Up/Down scroll the track list or the options rows. Esc goes back to `menu`.
 *
 * That is the whole reason `BattleScreen` only opens this on Esc "when no
 * submenu is open": Esc is a back button at three different depths here and in
 * the battle HUD, and exactly one of them can own it at a time.
 *
 * ## The keyboard, while this is up
 *
 * This screen can now open over a live command menu, and that menu is still
 * listening on `window` underneath it. So `enter()` takes an exclusive claim
 * (`Input.claimKeyboard`) for as long as the overlay lives: every keydown stops
 * in `app/Input.ts`'s capture-phase listener and the menu below never sees it.
 * The claim's callback is also how `H` — a key with no abstract button — reaches
 * this screen at all.
 *
 * ## Panels hidden
 *
 * `H` (or Triangle, or the HIDE PANELS row) drops every slab and leaves the
 * painting, with one faint line bottom-left. The player asked for it to look at
 * the art, so "hidden" really does mean the scrim and the vignette too; the only
 * thing left over the painting is the line that says how to get back. Remembered
 * in `Settings.pausePanelsHidden`.
 */

import type { BattleEvent, BattleState } from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';
import { getChapterMeta, type ChapterMeta } from '../../data/chapter-meta.ts';
import { audio } from '../../audio/index.ts';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { createFullBleedStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import {
  ControlsHint,
  PAUSE_HINTS,
  PAUSE_PANEL_HINTS,
  type ControlHintItem,
} from '../../ui/common/ControlsHint.ts';
import { MusicPlayer } from '../../ui/common/MusicPlayer.ts';
import { PhotoMode } from '../../ui/common/PhotoMode.ts';
import {
  dossierHtml,
  mountHeroArt,
  snapshotsHtml,
  wireImageFallbacks,
} from '../../ui/common/chapterPanel.ts';
import {
  encounterProgress,
  evaluateObjectives,
  type ObjectiveContext,
} from '../../ui/common/chapterObjectives.ts';
import {
  TEXT_SPEEDS,
  VOLUME_STEP,
  optionRows,
  optionsTabHtml,
  partyCardsHtml,
  partyTabHtml,
} from './PauseScreenPanels.ts';
import '../../ui/common/pause-screen.css';

/** Which panel the right-hand column is showing. */
export type PausePanel = 'details' | 'options' | 'party' | 'music';

/** One row of the left command column. */
interface MenuRow {
  id: string;
  label: string;
  /** Moving onto this row previews this panel. */
  panel: PausePanel;
  /** Confirm enters the panel instead of firing an action. */
  entersPanel?: boolean;
  /** A row whose value is shown on the right of the label (STRATEGY GUIDE). */
  value?: () => string;
}

export interface PauseScreenOptions {
  chapter: Chapter;
  /** Live battle state, or null when the pause is opened over a cutscene. */
  state?: () => Readonly<BattleState> | null;
  /** The ordered event log. Defaults to `state().log`. */
  log?: () => readonly BattleEvent[];
  /** Which link of a chained chapter is live, 1-based. Defaults to 1. */
  links?: () => number;
  /** How many formations the chapter chains through, for ENCOUNTER PROGRESS. */
  chainLength?: number;
  /**
   * Freeze / thaw whatever the App loop cannot. `BattleScreen` passes its
   * presenter gate; `CutsceneScreen` passes nothing and relies on the loop.
   */
  onPause?: (paused: boolean) => void;
  /** Extra rows to splice in above CHAPTER SELECT — the cutscene's "Skip scene". */
  extraRows?: Array<{ id: string; label: string; run: () => void }>;
  /** RESTART ENCOUNTER. Omitted (and the row hidden) when there is nothing to restart. */
  onRestart?: () => void;
  onChapterSelect?: () => void;
  onQuitToTitle?: () => void;
  /** Called when the player closes the menu. The owner pops the overlay. */
  onResume: () => void;
}

/** How far the pause menu ducks the music under itself. */
const PAUSE_DUCK = 0.35;

/**
 * Clear air between the foot of the frame's content and the top of the hint
 * strip, in CSS px. See {@link PauseScreen.measureHintBand}.
 *
 * Not a `clamp()`: it is the gap between two slabs, not a piece of type, and
 * it reads the same at 640x480 as it does at 4K.
 */
const HINT_BAND_GAP = 10;

/**
 * How much room the frame must reserve at its foot for the hint strip, given
 * where the strip actually landed.
 *
 * Split out of {@link PauseScreen.measureHintBand} so the arithmetic — which
 * is the whole of two of Bailey's defects — can be pinned without a browser.
 *
 * The frame is `inset: 0`, so its bottom edge is the viewport's; its
 * `padding-top` is `--pause-pad-y` by construction and its `padding-bottom` is
 * `calc(--pause-pad-y + --pause-hint-band)`. The content therefore ends at
 * `viewportHeight - padTop - band`, and for that to clear the strip by
 * {@link HINT_BAND_GAP} the band has to be at least
 * `viewportHeight - hintTop - padTop + gap`.
 *
 * In the compact layout the same number is the frame's `bottom` offset rather
 * than its padding, which is the same reservation measured from the same edge.
 */
export function hintBandPx(viewportHeight: number, hintTop: number, padTop: number, gap = HINT_BAND_GAP): number {
  if (!Number.isFinite(viewportHeight) || !Number.isFinite(hintTop) || !Number.isFinite(padTop)) return 0;
  return Math.max(0, Math.ceil(viewportHeight - hintTop - padTop + gap));
}

/**
 * The hint strip's extra entry for the panel toggle.
 *
 * Declared here rather than in `ControlsHint.ts` (another agent's file) and
 * spliced onto the shared sets locally — the same trick `GUIDE_HINT_ITEM` uses
 * from the other direction.
 */
const HIDE_HINT_ITEM: ControlHintItem = {
  label: 'hide panels',
  keyboard: 'H',
  gamepad: 'Triangle',
  pointer: 'Hide',
  action: 'pause:panels',
};

export class PauseScreen extends Screen {
  readonly name = 'pause';

  private readonly opts: PauseScreenOptions;
  private readonly meta: ChapterMeta | undefined;
  private stage: Stage | null = null;
  /** Themed wrapper for the chrome that lives outside the letterboxed stage. */
  private chrome: HTMLElement | null = null;
  private hint: ControlsHint | null = null;
  private music: MusicPlayer | null = null;
  private photo: PhotoMode | null = null;
  /** Screen roots hidden for the duration of photo mode. See {@link enterPhotoMode}. */
  private hiddenUnder: HTMLElement[] = [];

  private rows: MenuRow[] = [];
  private index = 0;
  private focus: 'menu' | 'panel' = 'menu';
  private panel: PausePanel = 'details';
  private optionIndex = 0;
  /** Set once, so a double Esc cannot resume twice. */
  private closing = false;
  /** Every slab is hidden and the painting is the whole screen. */
  private panelsHidden = false;
  /** The one line left over the art while {@link panelsHidden}. */
  private bareHint: HTMLElement | null = null;
  /** Releases the exclusive keyboard claim taken in {@link enter}. */
  private releaseKeyboard: (() => void) | null = null;
  /** Watches the hint strip so the frame reserves its *measured* height. */
  private hintWatch: ResizeObserver | null = null;
  /** Torn down with the screen; see {@link watchHintBand}. */
  private onViewportResize: (() => void) | null = null;

  constructor(opts: PauseScreenOptions) {
    super();
    this.opts = opts;
    this.meta = getChapterMeta(opts.chapter.id);
  }

  // ------------------------------------------------------------------ enter

  override enter(): void {
    installInkGoldStyles();
    this.opts.onPause?.(true);
    // The pause music sits *under* the menu rather than replacing it: the
    // fight's theme keeps playing, quietly, which is what makes the menu feel
    // like a held breath instead of a different screen.
    audio.duck(PAUSE_DUCK, 0.2);
    audio.playSfx('menu-page');

    // Take the keyboard away from anything below — see the class doc. The
    // callback is this screen's only route to keys that have no abstract
    // button, which today is `H`.
    this.releaseKeyboard = this.app.input.claimKeyboard(this.onClaimedKey);

    this.panelsHidden = this.app.save.settings.pausePanelsHidden;
    this.rows = this.buildRows();
    this.root.className = 'screen';
    // Not a letterboxed stage. The painting has to be the whole window at any
    // aspect, and a 640x360 stage can only ever be 16:9 — which is what put
    // ink bars down both sides of Bailey's 2000x1012 screenshot. The stage's
    // `scale()` was the other half of the same defect: it rasterised every
    // glyph at 640x360 and resampled it up, so the chrome read as a
    // low-resolution image however large its font sizes were. See
    // `createFullBleedStage` and the header of `pause-screen.css`.
    this.stage = createFullBleedStage(this.root, 'pause');
    this.stage.el.classList.add('ig');
    if (this.opts.chapter.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');

    this.stage.stage.innerHTML = this.frameHtml();

    const heroImg = this.stage.stage.querySelector<HTMLImageElement>('[data-role="hero"]');
    if (heroImg && this.meta) mountHeroArt(heroImg, this.meta);

    // The hint strips mount on the **screen root**, not inside the stage.
    // `controls-hint.css` is authored in device pixels precisely because it
    // normally sits outside a 640x360 stage; putting it inside one would scale
    // it by the letterbox factor on top of its own sizes and print a footer
    // two and a half times too big.
    //
    // They still need the Ink & Gold tokens, and those are declared on `.ig` —
    // which is on the stage they are deliberately *not* inside. So they get
    // their own themed wrapper, or an FFX-2 chapter would print a gold footer
    // under a pink screen.
    this.chrome = document.createElement('div');
    this.chrome.className = 'pause__chrome ig';
    if (this.opts.chapter.game === 'ffx2') this.chrome.classList.add('ig--ffx2');
    this.root.appendChild(this.chrome);

    this.hint = new ControlsHint({ root: this.chrome, items: [...PAUSE_HINTS, HIDE_HINT_ITEM] });
    this.hint.mount();
    this.hint.el.classList.add('pause__hint');

    // The line that survives HIDE PANELS. Built once and shown/hidden rather
    // than created on demand, so the toggle costs no layout. It lives on the
    // same device-pixel chrome wrapper as the hint strip, for the same reason.
    this.bareHint = document.createElement('div');
    this.bareHint.className = 'pause__bare-hint';
    this.bareHint.innerHTML =
      '<b data-action="pause:panels" role="button" tabindex="0">H</b> show panels' +
      ' <span>&middot;</span> <b data-action="cancel" role="button" tabindex="0">Esc</b> resume';
    this.chrome.appendChild(this.bareHint);

    this.renderMenu();
    this.renderPanel();
    this.renderParty();
    this.applyPanelsHidden();
    this.watchHintBand();
  }

  // ------------------------------------------------------------- hint band

  /**
   * Reserve exactly as much room at the foot of the frame as the hint strip
   * actually takes — measured, not guessed.
   *
   * The strip is not in the frame's grid. It mounts on `.pause__chrome`, a
   * sibling layer, because `controls-hint.css` belongs to another track and is
   * authored against the screen root (see the `ControlsHint` mount in
   * {@link enter}). So the frame has to *reserve* a band for it, and the first
   * pass reserved a `clamp()` guess at one.
   *
   * A guess is wrong at some size, and it was wrong at several: 13.7px of the
   * strip's ink was printed over the foot of all three party cards at 800x600,
   * and the dossier ran 8.5px under it at 640x480 and 720x540 — reduced, in the
   * 640x480 case, to a 43.9px sliver reading `FFX · I` before it was cut. The
   * strip's height is not a function of the viewport the way a clamp assumes:
   * it is a wrapping flex row of chips whose count changes with the panel
   * (`setItems`), so the same window can want one band or three.
   *
   * There is no loop to worry about: the band only changes the frame's bottom
   * padding, and the strip is `position: fixed` outside the frame, so nothing
   * the band does can change what was measured.
   */
  private measureHintBand(): void {
    const frame = this.stage?.stage.querySelector<HTMLElement>('.pause__frame');
    const hint = this.hint?.el;
    if (!frame || !hint) return;
    const rect = hint.getBoundingClientRect();
    // Panels are hidden: the strip is `display: none` and so is the frame.
    // Keep the last good band rather than collapsing the reservation to zero
    // and reflowing the whole stack for a layer nobody can see.
    if (rect.height < 1) return;
    // `padding-top` is `--pause-pad-y` by construction, and the frame is
    // `inset: 0`, so its bottom edge is the viewport's. Written this way
    // rather than as `rect.height + gap` so it stays correct even if the
    // strip's own anchoring changes in the file that owns it.
    const padTop = Number.parseFloat(getComputedStyle(frame).paddingTop) || 0;
    frame.style.setProperty('--pause-hint-band', `${hintBandPx(window.innerHeight, rect.top, padTop)}px`);
  }

  /** Measure now, and again whenever the strip rewraps or the window moves. */
  private watchHintBand(): void {
    this.measureHintBand();
    const hint = this.hint?.el;
    if (hint && typeof ResizeObserver === 'function') {
      this.hintWatch = new ResizeObserver(() => this.measureHintBand());
      this.hintWatch.observe(hint);
    }
    this.onViewportResize = (): void => this.measureHintBand();
    window.addEventListener('resize', this.onViewportResize);
  }

  /**
   * The command column.
   *
   * RESTART ENCOUNTER is omitted rather than greyed out when the owner gave no
   * `onRestart` (the cutscene pause has no encounter to restart): a menu row
   * that can never do anything is worse than one that is not there.
   */
  private buildRows(): MenuRow[] {
    const rows: MenuRow[] = [{ id: 'resume', label: 'Resume', panel: 'details' }];
    if (this.opts.onRestart) rows.push({ id: 'restart', label: 'Restart Encounter', panel: 'details' });
    rows.push({
      id: 'guide',
      label: 'Strategy Guide',
      panel: 'details',
      value: () => (this.app.save.settings.guideVisible ? 'ON' : 'OFF'),
    });
    rows.push({
      id: 'panels',
      // The label is the *action*, not the state — "HIDE PANELS" while they are
      // up, "SHOW PANELS" once they are not (which is only ever read from the
      // bottom-left line, since the row itself is hidden along with everything
      // else; it still flips so a pad player tabbing back sees the truth).
      label: this.panelsHidden ? 'Show Panels' : 'Hide Panels',
      panel: 'details',
    });
    rows.push({ id: 'options', label: 'Options', panel: 'options', entersPanel: true });
    rows.push({ id: 'details', label: 'Encounter Details', panel: 'details' });
    rows.push({ id: 'party', label: 'Party', panel: 'party', entersPanel: true });
    rows.push({ id: 'music', label: 'Music Player', panel: 'music', entersPanel: true });
    for (const extra of this.opts.extraRows ?? []) {
      rows.push({ id: extra.id, label: extra.label, panel: 'details' });
    }
    if (this.opts.onChapterSelect) rows.push({ id: 'chapter-select', label: 'Chapter Select', panel: 'details' });
    if (this.opts.onQuitToTitle) rows.push({ id: 'quit', label: 'Quit to Title', panel: 'details' });
    return rows;
  }

  /** The static frame: art, wordmark, the two columns, the bottom strip. */
  private frameHtml(): string {
    const meta = this.meta;
    const chapter = this.opts.chapter;
    const gameLine = chapter.game === 'ffx2' ? 'FINAL FANTASY X-2' : 'FINAL FANTASY X';
    const quote = meta
      ? `<blockquote class="pause__quote">
           <span class="pause__quote-text">&ldquo;${escapeHtml(meta.quote.text)}&rdquo;</span>
           <cite class="pause__quote-who">${escapeHtml(meta.quote.speaker)}</cite>
           <span class="pause__hand">${escapeHtml(meta.handwritten)}</span>
         </blockquote>`
      : '';

    // Three layers of painting, then one grid of chrome. The chrome is wrapped
    // because the grid needs a single element to be — and because
    // `.pause--bare` hides the painting's siblings by direct-child rule, so
    // "every slab at once" has to be one child.
    //
    // The wordmark, the menu and the quote are wrapped again, in `.pause__rail`:
    // they are one column, and as three separate grid areas the quote could be
    // (and on an 800x600 window was) laid out backwards over the menu when the
    // window ran out of height. Flex items cannot overlap. See the note on
    // `.pause__frame` in `pause-screen.css`.
    return `
      <div class="pause__art"><img class="pause__art-img" data-role="hero" alt=""></div>
      <div class="pause__scrim"></div>
      <div class="pause__grain" aria-hidden="true"></div>
      <div class="pause__vignette"></div>

      <div class="pause__frame">
        <div class="pause__rail">
          <div class="pause__brand">
            <div class="pause__wordmark">PYREFLY REPRISE</div>
            <div class="pause__game">${gameLine}</div>
          </div>

          <nav class="pause__menu" data-role="menu" aria-label="Paused"></nav>
          ${quote}
        </div>

        <section class="pause__panel cpanel cpanel--fluid" data-role="panel"></section>

        <div class="pause__party" data-role="party"></div>
        <div class="pause__snaps cpanel cpanel--fluid">${meta ? snapshotsHtml(meta) : ''}</div>
      </div>
    `;
  }

  // --------------------------------------------------------------- rendering

  private renderMenu(): void {
    const el = this.stage?.stage.querySelector('[data-role="menu"]');
    if (!el) return;
    el.innerHTML = this.rows
      .map((row, i) => {
        const sel = i === this.index;
        const value = row.value?.();
        return `<div class="pause__row${sel ? ' pause__row--sel' : ''}${
          this.focus === 'panel' && sel ? ' pause__row--dim' : ''
        }" data-action="pause:row:${escapeHtml(row.id)}" role="button" tabindex="0" aria-current="${sel}">
          <span class="pause__row-label">${escapeHtml(row.label.toUpperCase())}</span>
          ${value ? `<span class="pause__row-value">${escapeHtml(value)}</span>` : ''}
        </div>`;
      })
      .join('');

    /*
     * Keep the cursor in view.
     *
     * On a short window (`@media (max-height: 700px)`) the menu is a scroll
     * container: ten real commands do not fit in 600px of screen alongside a
     * wordmark and the party strip, and scrolling them is the one answer that
     * neither shrinks the type below its floor nor hides a row the player can
     * still activate. `block: 'nearest'` scrolls only when the row is actually
     * out of view, so nothing moves on a window with room.
     */
    const sel = el.querySelector('.pause__row--sel');
    if (sel && typeof sel.scrollIntoView === 'function') {
      sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  /** The live context every objective and the progress row is evaluated against. */
  private context(): ObjectiveContext {
    const state = this.opts.state?.() ?? null;
    return {
      state,
      log: this.opts.log?.() ?? state?.log ?? [],
      links: this.opts.links?.() ?? 1,
    };
  }

  private renderPanel(): void {
    const el = this.stage?.stage.querySelector<HTMLElement>('[data-role="panel"]');
    if (!el) return;

    // The jukebox owns a real element with its own cursor, so it is mounted
    // once and hidden rather than re-rendered into a string like the others.
    if (this.panel !== 'music') {
      this.music?.dispose();
      this.music = null;
    }

    el.dataset['panel'] = this.panel;

    if (this.panel === 'options') {
      el.innerHTML = optionsTabHtml(this.app.save.settings, this.optionIndex);
      return;
    }
    if (this.panel === 'party') {
      el.innerHTML = partyTabHtml(this.opts.state?.() ?? null);
      wireImageFallbacks(el);
      return;
    }
    if (this.panel === 'music') {
      if (!this.music) {
        el.innerHTML = '';
        this.music = new MusicPlayer({ root: el, chapterKeys: this.chapterMusicKeys() });
      }
      return;
    }

    const meta = this.meta;
    if (!meta) {
      el.innerHTML = `<div class="pause__empty">${escapeHtml(this.opts.chapter.title)}</div>`;
      return;
    }
    const ctx = this.context();
    el.innerHTML = dossierHtml(meta, {
      sceneKey: this.opts.chapter.sceneKey,
      statuses: evaluateObjectives(meta.objectives, ctx),
      playTimeMs: this.app.save.playTime(this.opts.chapter.id),
      progress: encounterProgress(
        ctx,
        this.opts.chainLength !== undefined ? { chainLength: this.opts.chainLength } : {},
      ),
      // The three polaroids live along the bottom of this screen, not in the
      // column — see `DossierOptions.snapshots`.
      snapshots: false,
    });
  }

  /** Cue names this chapter uses, for the jukebox's "this fight" group. */
  private chapterMusicKeys(): string[] {
    const music = this.opts.chapter.music;
    const fromChapter = [music.scene, music.battle, music.phase2, music.victory, music.post];
    return [...new Set([...(this.meta?.musicKeys ?? []), ...fromChapter])].filter(
      (k): k is string => typeof k === 'string' && k.length > 0,
    );
  }

  private renderParty(): void {
    const el = this.stage?.stage.querySelector('[data-role="party"]');
    if (!el) return;
    el.innerHTML = partyCardsHtml(this.opts.state?.() ?? null);
  }

  // ------------------------------------------------------------------- input

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);

    if (this.photo) {
      this.handlePhotoInput(input);
      return;
    }

    for (const action of input.actions) this.handleAction(action);

    // Triangle (pad Y, or Shift/Tab/Q) is the pad's HIDE PANELS. `H` comes in
    // through the keyboard claim instead — it has no abstract button, and
    // adding one to `app/Input.ts` for a single screen's toggle would put a
    // global binding in a file thirty agents import.
    if (input.justPressed('triangle')) {
      this.togglePanels();
      return;
    }

    // With the panels down the only things that answer are the toggle and the
    // two ways out; arrows and Confirm would be moving a cursor nobody can see.
    if (this.panelsHidden) {
      if (input.justPressed('cancel') || input.justPressed('start')) this.close();
      return;
    }

    // F (mapped to `l1`) drops every piece of chrome and hands the camera over.
    if (input.justPressed('l1')) {
      this.enterPhotoMode();
      return;
    }

    if (this.focus === 'panel') {
      this.handlePanelInput(input);
      return;
    }

    if (input.justPressed('down')) this.moveMenu(1);
    if (input.justPressed('up')) this.moveMenu(-1);
    if (input.justPressed('confirm')) this.activate(this.rows[this.index]);
    // Esc / Circle and Start both close from the top level: Start is what
    // opened it, and a menu that a button opens should close on the same
    // button. `Escape` is also the battle HUD's back button, which is why
    // `BattleScreen` will not open this while a command menu owns it.
    if (input.justPressed('cancel') || input.justPressed('start')) this.close();
  }

  private handlePanelInput(input: InputSnapshot): void {
    if (input.justPressed('cancel') || input.justPressed('start')) {
      this.focus = 'menu';
      this.hint?.setItems(PAUSE_HINTS);
      audio.playSfx('cancel');
      this.renderMenu();
      this.renderPanel();
      return;
    }

    if (this.panel === 'music' && this.music) {
      if (input.justPressed('down')) {
        this.music.move(1);
        audio.playSfx('cursor-move');
      }
      if (input.justPressed('up')) {
        this.music.move(-1);
        audio.playSfx('cursor-move');
      }
      if (input.justPressed('confirm')) this.music.confirm();
      return;
    }

    if (this.panel === 'options') {
      const rows = optionRows(this.app.save.settings);
      if (input.justPressed('down')) {
        this.optionIndex = (this.optionIndex + 1) % rows.length;
        audio.playSfx('cursor-move');
        this.renderPanel();
      }
      if (input.justPressed('up')) {
        this.optionIndex = (this.optionIndex - 1 + rows.length) % rows.length;
        audio.playSfx('cursor-move');
        this.renderPanel();
      }
      if (input.justPressed('right')) this.adjustOption(1);
      if (input.justPressed('left')) this.adjustOption(-1);
      if (input.justPressed('confirm')) this.adjustOption(1);
    }
  }

  private handlePhotoInput(input: InputSnapshot): void {
    if (input.justPressed('cancel') || input.justPressed('l1') || input.actions.includes('photo:exit')) {
      this.exitPhotoMode();
    }
  }

  /**
   * `H`, straight off the keyboard claim.
   *
   * Edge-only and chord-guarded for the same reason the strategy guide's `G`
   * is: a held key or a Ctrl+H must not flip the chrome. The claim already
   * filters chords out, but this handler is the one that would have to change
   * if that ever stopped being true.
   */
  private readonly onClaimedKey = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyH' || e.repeat) return;
    if (this.photo || this.closing) return;
    this.togglePanels();
  };

  /** Flip HIDE / SHOW PANELS and remember the answer. */
  private togglePanels(): void {
    if (this.photo) return;
    this.panelsHidden = !this.panelsHidden;
    this.app.save.setSettings({ pausePanelsHidden: this.panelsHidden });
    audio.playSfx('menu-page');
    // The row's label is its action, so it has to be rebuilt, not re-rendered.
    this.rows = this.buildRows();
    if (this.index >= this.rows.length) this.index = 0;
    this.renderMenu();
    this.applyPanelsHidden();
  }

  /**
   * Put the chrome up or take it away.
   *
   * One class on the stage does the work; the CSS owns which children go. The
   * hint strip and the bottom-left line swap over here rather than in CSS
   * because the strip mounts on the screen root, outside the stage — see the
   * `ControlsHint` mount in {@link enter}.
   */
  private applyPanelsHidden(): void {
    // On the inner 640x360 element, which is what the slabs are children of.
    this.stage?.stage.classList.toggle('pause--bare', this.panelsHidden);
    if (this.hint) this.hint.el.style.display = this.panelsHidden ? 'none' : '';
    if (this.bareHint) this.bareHint.style.display = this.panelsHidden ? '' : 'none';
    // Coming back from HIDE PANELS the strip is laid out again, possibly
    // wrapped differently from when it went away (the panel may have changed
    // underneath, and with it the chip count). Re-reserve from the new one.
    if (!this.panelsHidden) this.measureHintBand();
  }

  private handleAction(action: string): void {
    if (action === 'photo:exit') return; // handled in photo mode
    if (action === 'pause:panels') {
      this.togglePanels();
      return;
    }
    if (action === 'cancel' && this.panelsHidden) {
      this.close();
      return;
    }
    if (this.music?.handleAction(action)) return;
    if (action.startsWith('pause:row:')) {
      const id = action.slice('pause:row:'.length);
      const i = this.rows.findIndex((r) => r.id === id);
      if (i < 0) return;
      this.index = i;
      this.panel = this.rows[i]!.panel;
      audio.playSfx('cursor-move');
      this.renderMenu();
      this.renderPanel();
      this.activate(this.rows[i]);
      return;
    }
    if (action.startsWith('pause:opt:')) {
      const id = action.slice('pause:opt:'.length);
      const i = optionRows(this.app.save.settings).findIndex((r) => r.id === id);
      if (i < 0) return;
      this.optionIndex = i;
      this.focus = 'panel';
      this.panel = 'options';
      this.adjustOption(1);
    }
  }

  private moveMenu(dir: 1 | -1): void {
    const n = this.rows.length;
    if (n === 0) return;
    this.index = (this.index + dir + n) % n;
    const next = this.rows[this.index]!.panel;
    audio.playSfx('cursor-move');
    if (next !== this.panel) {
      this.panel = next;
      this.renderPanel();
    }
    this.renderMenu();
  }

  /**
   * Fire the selected row.
   *
   * A row that owns a panel moves focus into it instead of doing anything —
   * the panel is already on screen from the cursor preview, so Confirm's job
   * is only to say "and now Up/Down belong to that".
   */
  private activate(row: MenuRow | undefined): void {
    if (!row) return;
    audio.playSfx('confirm');

    if (row.entersPanel) {
      this.focus = 'panel';
      this.hint?.setItems(PAUSE_PANEL_HINTS);
      this.renderMenu();
      return;
    }

    switch (row.id) {
      case 'resume':
        this.close();
        return;
      case 'details':
        this.panel = 'details';
        this.renderPanel();
        return;
      case 'panels':
        this.togglePanels();
        return;
      case 'guide': {
        const next = !this.app.save.settings.guideVisible;
        this.app.save.setSettings({ guideVisible: next });
        this.renderMenu();
        return;
      }
      case 'restart':
        this.opts.onRestart?.();
        return;
      case 'chapter-select':
        this.opts.onChapterSelect?.();
        return;
      case 'quit':
        this.opts.onQuitToTitle?.();
        return;
      default: {
        const extra = this.opts.extraRows?.find((e) => e.id === row.id);
        extra?.run();
      }
    }
  }

  /**
   * Nudge one option.
   *
   * Volumes and text speed step; the two toggles flip regardless of direction,
   * which is what makes Confirm work on them as well as Left/Right. Every
   * write goes through `SaveStore.setSettings` (so it persists) *and* through
   * `AudioManager` where the mixer needs telling — a volume the player can see
   * but not hear would be a worse bug than no options menu at all.
   */
  private adjustOption(dir: 1 | -1): void {
    const rows = optionRows(this.app.save.settings);
    const row = rows[this.optionIndex];
    if (!row) return;
    const save = this.app.save;
    const settings = save.settings;
    const clamp01 = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;

    switch (row.id) {
      case 'masterVolume': {
        const value = clamp01(settings.masterVolume + dir * VOLUME_STEP);
        save.setSettings({ masterVolume: value });
        audio.setMasterVolume(value);
        break;
      }
      case 'musicVolume': {
        const value = clamp01(settings.musicVolume + dir * VOLUME_STEP);
        save.setSettings({ musicVolume: value });
        audio.setMusicVolume(value);
        break;
      }
      case 'sfxVolume': {
        const value = clamp01(settings.sfxVolume + dir * VOLUME_STEP);
        save.setSettings({ sfxVolume: value });
        audio.setSfxVolume(value);
        break;
      }
      case 'textSpeed': {
        const i = TEXT_SPEEDS.indexOf(settings.textSpeed as (typeof TEXT_SPEEDS)[number]);
        const next = TEXT_SPEEDS[Math.min(TEXT_SPEEDS.length - 1, Math.max(0, (i < 0 ? 2 : i) + dir))];
        save.setSettings({ textSpeed: next ?? 1 });
        break;
      }
      case 'ffx2Atb':
        save.setSettings({ ffx2Atb: settings.ffx2Atb === 'active' ? 'wait' : 'active' });
        break;
      case 'guideVisible':
        save.setSettings({ guideVisible: !settings.guideVisible });
        break;
      default:
        return;
    }
    audio.playSfx('cursor-move');
    this.renderPanel();
    this.renderMenu();
  }

  // -------------------------------------------------------------- photo mode

  private enterPhotoMode(): void {
    if (this.photo || !this.stage) return;
    this.photo = new PhotoMode({
      camera: this.app.renderer.camera,
      // The chrome to hide is everything inside the stage; the one hint photo
      // mode keeps goes on the screen root beside it, both so it survives that
      // hiding rule and so it is sized in device pixels like the strip it
      // replaces (see the `ControlsHint` mount above).
      chrome: this.stage.stage,
      root: this.chrome ?? this.root,
      onExit: () => this.exitPhotoMode(),
    });
    this.hideScreensBelow();
    this.hint?.unmount();
    // Photo mode has its own one-line hint; two of them stacked would be a
    // mess, and this one names keys photo mode does not answer.
    if (this.bareHint) this.bareHint.style.display = 'none';
    audio.playSfx('menu-page');
  }

  private exitPhotoMode(): void {
    if (!this.photo) return;
    this.photo.dispose();
    this.photo = null;
    this.restoreScreensBelow();
    this.hint?.mount();
    this.applyPanelsHidden();
    audio.playSfx('cancel');
  }

  /**
   * Hide the frozen screen's own DOM for the duration of photo mode.
   *
   * `PhotoMode` only hides the chrome it is handed — this screen's stage. The
   * battle HUD is not in it: `BattleScreen` mounts the HUD, the damage
   * numerals, the message bar and the strategy guide into *its* screen root
   * (`app/screens/BattleScreen.ts`), a sibling `div` under `App.uiRoot`, and
   * the pause root only covers it because it sits at a higher `z-index`. Take
   * the pause chrome away and the frozen HUD reappears on top of the
   * turntable — a mid-swing damage numeral and a guide panel in every photo.
   *
   * Hiding the screen roots underneath costs nothing visually: the diorama is
   * drawn by the renderer's own canvas, which is not inside any of them.
   */
  private hideScreensBelow(): void {
    for (const screen of this.app.screens) {
      if (screen === this) continue;
      const el = screen.root;
      if (!el || el.style.visibility === 'hidden') continue;
      el.style.visibility = 'hidden';
      this.hiddenUnder.push(el);
    }
  }

  private restoreScreensBelow(): void {
    for (const el of this.hiddenUnder) el.style.visibility = '';
    this.hiddenUnder = [];
  }

  // ------------------------------------------------------------------- frame

  override update(dt: number): void {
    // Photo mode is the only thing on this screen that animates; everything
    // else is static until the player presses something.
    const input = this.app.input;
    this.photo?.update(dt, {
      left: input.pressed('left'),
      right: input.pressed('right'),
      up: input.pressed('up'),
      down: input.pressed('down'),
      // Z is `confirm` in `app/Input.ts` (alongside Enter and Space), and photo
      // mode has nothing to confirm — so in here that whole button is the zoom,
      // which is what makes the brief's "Z zoom" true without remapping
      // anything. R1 doubles it for a pad.
      zoom: input.pressed('confirm') || input.pressed('r1'),
    });
  }

  /**
   * Draw nothing of our own, so `App` keeps re-drawing the frozen battle
   * underneath. See {@link App.pushOverlay}.
   */
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
      this.enterPhotoMode();
      return true;
    }
    if (name === 'pause:photo-off') {
      this.exitPhotoMode();
      return true;
    }
    if (name === 'pause:panels' || name === 'pause:panels:hide' || name === 'pause:panels:show') {
      const want = name === 'pause:panels' ? !this.panelsHidden : name === 'pause:panels:hide';
      if (want !== this.panelsHidden) this.togglePanels();
      return true;
    }
    if (name.startsWith('pause:panel:')) {
      const panel = name.slice('pause:panel:'.length) as PausePanel;
      const i = this.rows.findIndex((r) => r.panel === panel && r.entersPanel !== undefined);
      this.panel = panel;
      if (i >= 0) this.index = i;
      this.renderMenu();
      this.renderPanel();
      return true;
    }
    return false;
  }

  override snapshot(): Record<string, unknown> {
    const ctx = this.context();
    return {
      chapter: this.opts.chapter.id,
      rows: this.rows.map((r) => r.id),
      row: this.rows[this.index]?.id ?? null,
      focus: this.focus,
      panel: this.panel,
      panelsHidden: this.panelsHidden,
      photo: this.photo?.snapshot() ?? null,
      music: this.music?.nowPlaying ?? null,
      playTimeMs: this.app.save.playTime(this.opts.chapter.id),
      objectives: this.meta ? evaluateObjectives(this.meta.objectives, ctx) : [],
      progress: encounterProgress(
        ctx,
        this.opts.chainLength !== undefined ? { chainLength: this.opts.chainLength } : {},
      ),
    };
  }

  override exit(): void {
    // Give the keyboard back before anything else: a command menu underneath
    // is still open and is about to be the player's again.
    this.releaseKeyboard?.();
    this.releaseKeyboard = null;
    this.hintWatch?.disconnect();
    this.hintWatch = null;
    if (this.onViewportResize) window.removeEventListener('resize', this.onViewportResize);
    this.onViewportResize = null;
    this.bareHint?.remove();
    this.bareHint = null;
    this.photo?.dispose();
    this.photo = null;
    // Closing the menu straight out of photo mode must not leave the battle
    // HUD invisible behind it.
    this.restoreScreensBelow();
    this.music?.dispose();
    this.music = null;
    this.hint?.unmount();
    this.hint = null;
    this.chrome?.remove();
    this.chrome = null;
    this.stage?.destroy();
    this.stage = null;
    audio.unduck(0.35);
    this.opts.onPause?.(false);
  }
}
