/**
 * The PRESENTATION page the OPTIONS tab's PRESENTATION row opens (Bailey, 2026-10-08, "go with C": the
 * Options layout where one row opens a page holding TITLE SCREEN and CHAPTER MUSIC, in the EYE CANDY
 * page's classes and look, a help line per row; measured mock `D:/Tools/pyrefly-scratch/2026-10-08/options-layout/`,
 * frames in `docs/screenshots/r395-int/options-c/`).
 *
 * Built like the EYE CANDY page (`eyeCandyPage.ts`, D-317), in the same classes and the same stylesheet
 * (`pause-eye-candy.css`), so it is that page's sibling: it takes the place of the two OPTIONS columns and
 * the prompts, leaves the tab strip, the brand line, the painting and (on a desktop window) the objective
 * line where they were, and has its own `Esc BACK` prompt. Two rows, each with one help line.
 *
 * Input (`PauseOverlays.pageInput` hands it the frame): Up / Down walk the two rows, wrapping; Left and
 * Right step the focused row's value through its list (and wrap), Confirm and a tap step it forward. Every
 * write goes through `adjustSetting` (`settings.ts`), the same code the two list rows used before 39.5's
 * layout round, so the stored fields (`titleArt`, `chapterSelectMusic`; `saveFrontend.ts`) are unchanged:
 * the title draws the new painting the next time it is drawn, the board plays the new track the next time
 * it opens.
 *
 * Game case: both games. The title screen is the front door to both halves and the chapter-select board is
 * shared (`saveFrontend.ts`), so a row here is true of FFX and of FFX-2 alike. The accents are the pause's
 * own `--pu-accent`: gold under FFX, pyre pink under FFX-2.
 */

import { audio } from '../../../audio/index.ts';
import type { InputSnapshot } from '../../Input.ts';
import type { Settings, SaveStore } from '../../SaveData.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { CHAPTER_SELECT_LABELS, TITLE_ART_LABELS, chapterSelectMusicOf, titleArtOf } from '../../saveFrontend.ts';
import { adjustSetting } from './settings.ts';
import { EYE_CANDY_OPEN_CLASS } from './eyeCandyPage.ts';
import '../../../ui/common/pause-eye-candy.css';

/** The `data-action` of the page's `Esc BACK` prompt. */
export const PRESENTATION_CLOSE_ACTION = 'pause:pres:close';
/** The `data-action` prefix of a row: a click or tap steps it. */
export const PRESENTATION_ROW_ACTION = 'pause:pres:row:';

/** One row of the page: the setting it writes, its label, what it does and what it reads right now. */
interface PresentationRow {
  id: 'titleArt' | 'chapterSelectMusic';
  label: string;
  help: string;
  value: (s: Readonly<Settings>) => string;
}

/** The two rows, in the order Up and Down walk them (the order the list's two rows had). */
export const PRESENTATION_ROWS: readonly PresentationRow[] = [
  {
    id: 'titleArt',
    label: 'TITLE SCREEN',
    help: 'FARPLANE is the title painting you know: the airship over the Farplane shore. THE ECHO is Yuna kneeling in still water, with its own lettering. It shows the next time the title is drawn.',
    value: (s) => TITLE_ART_LABELS[titleArtOf(s.titleArt)],
  },
  {
    id: 'chapterSelectMusic',
    label: 'CHAPTER MUSIC',
    help: 'The track on the chapter select board. B is the piano, the one you know. A is a waltz. C is a harp with a wordless voice. It plays the next time the board opens.',
    value: (s) => CHAPTER_SELECT_LABELS[chapterSelectMusicOf(s.chapterSelectMusic)],
  },
];

export class PresentationPage {
  private readonly root: HTMLElement;
  private readonly save: SaveStore;
  private readonly layer: HTMLElement;
  private at: PresentationRow['id'] = PRESENTATION_ROWS[0]!.id;

  /** @param root the pause view's root: the element the `pause--*` classes live on. */
  constructor(root: HTMLElement, save: SaveStore) {
    this.root = root;
    this.save = save;
    const host = root.querySelector<HTMLElement>('[data-role="ui"]') ?? root;
    this.layer = document.createElement('div');
    this.layer.className = 'pause__ec-layer';
    this.layer.dataset['role'] = 'presentation';
    this.layer.innerHTML = this.frameHtml();
    host.appendChild(this.layer);
    root.classList.add(EYE_CANDY_OPEN_CLASS);
    this.render();
  }

  /** The selected row's id. */
  get row(): string {
    return this.at;
  }

  /** One frame of input that the page owns (moves, steps, taps). Closing is the caller's. */
  input(input: InputSnapshot): void {
    for (const a of input.actions) {
      if (!a.startsWith(PRESENTATION_ROW_ACTION)) continue;
      const id = a.slice(PRESENTATION_ROW_ACTION.length);
      const row = PRESENTATION_ROWS.find((r) => r.id === id);
      if (!row) continue;
      this.at = row.id;
      this.step(1, true);
    }
    if (input.justPressed('down')) this.move(1);
    if (input.justPressed('up')) this.move(-1);
    if (input.justPressed('right')) this.step(1, false);
    if (input.justPressed('left')) this.step(-1, false);
    if (input.justPressed('confirm')) this.step(1, true);
  }

  private move(dir: 1 | -1): void {
    const i = Math.max(0, PRESENTATION_ROWS.findIndex((r) => r.id === this.at));
    this.at = PRESENTATION_ROWS[(i + dir + PRESENTATION_ROWS.length) % PRESENTATION_ROWS.length]!.id;
    audio.playSfx('cursor-move');
    this.render();
  }

  /** @param press Confirm or a tap, not an arrow. */
  private step(dir: 1 | -1, press: boolean): void {
    if (!adjustSetting(this.save, this.at, dir, press)) return;
    audio.playSfx('cursor-move');
    this.render();
  }

  // ---------------------------------------------------------------- markup

  private frameHtml(): string {
    const help = (where: string): string =>
      `<div class="pause__ec-help pause__ec-help--${where}" data-role="pres-help-${where}">` +
      '<span class="pause__ec-help-t"></span><span class="pause__ec-help-b"></span><span class="pause__ec-help-g"></span></div>';
    return (
      `<section class="pause__ec" role="dialog" aria-label="Presentation">` +
      `<h3 class="pause__ec-h">Presentation<b>Title screen and chapter select</b></h3>` +
      `<div class="pause__ec-scroll" data-role="pres-scroll"><div class="pause__ec-cols">` +
      `<div class="pause__ec-col" data-role="pres-rows"></div>` +
      `<div class="pause__ec-col">${help('desk')}</div></div></div>${help('phone')}</section>` +
      `<div class="pause__back pause__ec-back" data-action="${PRESENTATION_CLOSE_ACTION}" role="button" tabindex="0">` +
      `<span class="pause__key">Esc</span>Back</div>` +
      `<div class="pause__hide pause__ec-hint" aria-hidden="true">` +
      `<span class="pause__ec-hint-desk">Up / Down&nbsp;&nbsp;move&nbsp;&nbsp;&middot;&nbsp;&nbsp;Left / Right&nbsp;&nbsp;change</span>` +
      `<span class="pause__ec-hint-phone">Tap a row to change it</span></div>`
    );
  }

  /** Redraw the rows and the help line from the live settings; the cursor keeps its place. */
  render(): void {
    const settings = this.save.settings;
    const rows = PRESENTATION_ROWS.map((r) => {
      const sel = r.id === this.at;
      return (
        `<div class="pause__row pause__row--word pause__row--cmd pause__ec-row${sel ? ' pause__row--sel' : ''}" data-row="${r.id}"` +
        ` data-action="${PRESENTATION_ROW_ACTION}${r.id}" role="button" tabindex="${sel ? 0 : -1}">` +
        `<span class="pause__k">${escapeHtml(r.label)}</span>` +
        `<span class="pause__v">${escapeHtml(r.value(settings))}</span></div>`
      );
    }).join('');
    const host = this.layer.querySelector<HTMLElement>('[data-role="pres-rows"]');
    if (host) host.innerHTML = rows;
    const at = PRESENTATION_ROWS.find((r) => r.id === this.at) ?? PRESENTATION_ROWS[0]!;
    for (const where of ['desk', 'phone']) {
      const el = this.layer.querySelector<HTMLElement>(`[data-role="pres-help-${where}"]`);
      if (!el) continue;
      el.querySelector('.pause__ec-help-t')!.textContent = at.label;
      el.querySelector('.pause__ec-help-b')!.textContent = at.help;
      el.querySelector('.pause__ec-help-g')!.textContent = 'Both games.';
    }
    // Focus follows the cursor, for a screen reader and a Tab key, as the EYE CANDY page's does.
    const sel = this.layer.querySelector<HTMLElement>('.pause__row--sel');
    sel?.focus({ preventScroll: true });
    sel?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  /** What the page shows, for the debug API and the tests. */
  snapshot(): Record<string, unknown> {
    const settings = this.save.settings;
    return {
      open: true,
      row: this.at,
      rows: PRESENTATION_ROWS.map((r) => ({ id: r.id, label: r.label, value: r.value(settings) })),
    };
  }

  dispose(): void {
    this.layer.remove();
    this.root.classList.remove(EYE_CANDY_OPEN_CLASS);
  }
}
