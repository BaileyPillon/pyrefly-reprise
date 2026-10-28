/**
 * The SAVE FILE page the OPTIONS tab's SAVE FILE row opens (portable saves, ChatGPT point 9; the saves lane of
 * 2026-10-28): EXPORT SAVE, IMPORT SAVE and, once an import has happened, UNDO IMPORT. Behind the address word
 * `?saveport=on`, default OFF (`savePortSwitch.ts`): with the word off the row is not printed and this page is never built.
 *
 * Built like the PRESENTATION page (`presentationPage.ts`), in the EYE CANDY page's classes and stylesheet, so it is
 * their sibling and wears the same Ink & Gold look: it takes the place of the two OPTIONS columns, leaves the tab strip,
 * the painting and the brand line where they were, and has its own `Esc BACK` prompt. A help line per row on the right
 * (on a desktop window) or at the foot (on a phone), and one status line under the rows.
 *
 * ## How it behaves
 *
 *  - **EXPORT SAVE** hands the browser the save as a file (`savePortFlow.exportCurrent`: read-only).
 *  - **IMPORT SAVE** opens the browser's file chooser. The chosen file is checked (`readSaveFile`: size, JSON, format
 *    word, versions, shape, checksum). A refused file says why on the status line and nothing is touched. An accepted
 *    one switches the page to a CONFIRM view: what the file holds beside what the save holds now, and two rows,
 *    KEEP MY SAVE (the cursor starts there) and REPLACE MY SAVE. Nothing is replaced until REPLACE MY SAVE is chosen,
 *    and Esc, a tab change or closing the pause drops the file unread.
 *  - **UNDO IMPORT** (only while an import can be undone) puts the save from just before the last import back.
 *    The earlier saves are kept in memory for the session, five deep (`savePortFlow.ts`).
 *
 * The browser only opens a file chooser for a real key press, click or tap; a game pad press is not one. The page asks
 * (`navigator.userActivation`) and, when the press was a pad's, says to use the keyboard or a click instead.
 *
 * Input (`PauseOverlays.pageInput` hands it the frame): Up / Down walk the rows, wrapping; Confirm and a tap act.
 * Left and Right do nothing (no row here steps a value).
 *
 * Game case: both games. A save is one file for the whole product (`SaveData.ts`), so every line here is true of FFX
 * and of FFX-2 alike. The accents are the pause's own `--pu-accent`: gold under FFX, pyre pink under FFX-2.
 */

import { audio } from '../../../audio/index.ts';
import type { InputSnapshot } from '../../Input.ts';
import type { SaveStore } from '../../SaveData.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { MAX_SAVE_FILE_BYTES, readSaveFile, type Accepted } from '../../savePort.ts';
import { commitImport, currentSummary, exportCurrent, undoImport, undoSteps } from '../../savePortFlow.ts';
import { browserDownload, browserOpenPicker, browserReadText } from './savePortBrowser.ts';
import { savePortHelp, type SavePortRowId } from './savePortHelp.ts';
import { EYE_CANDY_OPEN_CLASS } from './eyeCandyPage.ts';
import '../../../ui/common/pause-eye-candy.css';
import '../../../ui/common/pause-save-port.css';

/** The `data-action` of the page's `Esc BACK` prompt. */
export const SAVE_PORT_CLOSE_ACTION = 'pause:sp:close';
/** The `data-action` prefix of a row: a click or tap acts on it. */
export const SAVE_PORT_ROW_ACTION = 'pause:sp:row:';

export type { SavePortRowId };

export interface SavePortDeps {
  now: () => number;
  /** Hand the browser a file to keep. False when it would not. */
  download: (filename: string, text: string) => boolean;
  /** Open the file chooser on `input`. False when the browser would not (it wants a key press, click or tap, not a pad). */
  openPicker: (input: HTMLInputElement) => boolean;
  /** Read a chosen file's text. */
  readText: (file: File) => Promise<string>;
  /** The save under the page changed (a replace, an undo): redraw whatever shows it. */
  changed: () => void;
}

interface RowView {
  id: SavePortRowId;
  label: string;
  value: string;
  warn?: boolean;
}

interface Status {
  tone: 'ok' | 'bad' | 'info';
  text: string;
}

export class SavePortPage {
  private readonly root: HTMLElement;
  private readonly save: SaveStore;
  private readonly deps: SavePortDeps;
  private readonly layer: HTMLElement;
  private readonly fileInput: HTMLInputElement;
  private mode: 'menu' | 'confirm' = 'menu';
  private at: SavePortRowId = 'export';
  private status: Status | null = null;
  private pending: Accepted | null = null;
  private busy = false;
  private disposed = false;

  /** @param root the pause view's root: the element the `pause--*` classes live on. */
  constructor(root: HTMLElement, save: SaveStore, deps: Partial<SavePortDeps> = {}) {
    this.root = root;
    this.save = save;
    this.deps = {
      now: () => Date.now(),
      download: browserDownload,
      openPicker: browserOpenPicker,
      readText: browserReadText,
      changed: () => {},
      ...deps,
    };
    const host = root.querySelector<HTMLElement>('[data-role="ui"]') ?? root;
    this.layer = document.createElement('div');
    this.layer.className = 'pause__ec-layer';
    this.layer.dataset['role'] = 'savefile';
    this.layer.innerHTML = this.frameHtml();
    this.fileInput = this.layer.querySelector<HTMLInputElement>('[data-role="sp-file"]')!;
    this.fileInput.addEventListener('change', this.onFile);
    this.layer.addEventListener('click', this.onClick);
    host.appendChild(this.layer);
    root.classList.add(EYE_CANDY_OPEN_CLASS);
    this.render();
  }

  /** The selected row's id. */
  get row(): SavePortRowId {
    return this.at;
  }

  // ------------------------------------------------------------------- rows

  private rows(): RowView[] {
    if (this.mode === 'confirm') {
      return [
        { id: 'keep', label: 'KEEP MY SAVE', value: '' },
        { id: 'replace', label: 'REPLACE MY SAVE', value: '', warn: true },
      ];
    }
    const rows: RowView[] = [
      { id: 'export', label: 'EXPORT SAVE', value: `${currentSummary(this.save).cleared} CLEARED` },
      { id: 'import', label: 'IMPORT SAVE', value: 'FROM A FILE' },
    ];
    const steps = undoSteps(this.save);
    if (steps > 0) rows.push({ id: 'undo', label: 'UNDO IMPORT', value: steps === 1 ? '1 STEP' : `${steps} STEPS` });
    return rows;
  }

  // ------------------------------------------------------------------ input

  /** One frame of input that the page owns (moves, acts, taps). Closing is the caller's. */
  input(input: InputSnapshot): void {
    if (this.busy || this.disposed) return;
    for (const a of input.actions) {
      if (!a.startsWith(SAVE_PORT_ROW_ACTION)) continue;
      const id = a.slice(SAVE_PORT_ROW_ACTION.length) as SavePortRowId;
      if (!this.rows().some((r) => r.id === id)) continue;
      this.at = id;
      this.act(id);
    }
    if (input.justPressed('down')) this.move(1);
    if (input.justPressed('up')) this.move(-1);
    if (input.justPressed('confirm')) this.act(this.at);
  }

  private move(dir: 1 | -1): void {
    const rows = this.rows();
    const i = Math.max(0, rows.findIndex((r) => r.id === this.at));
    this.at = rows[(i + dir + rows.length) % rows.length]!.id;
    audio.playSfx('cursor-move');
    this.render();
  }

  private act(id: SavePortRowId): void {
    switch (id) {
      case 'export':
        return this.doExport();
      case 'import':
        return this.doImport();
      case 'undo':
        return this.doUndo();
      case 'replace':
        return this.doReplace();
      case 'keep':
        return this.doKeep();
    }
  }

  private say(tone: Status['tone'], text: string): void {
    this.status = { tone, text };
  }

  private doExport(): void {
    const out = exportCurrent(this.save, this.deps.now());
    if (!out.ok) {
      audio.playSfx('cancel');
      this.say('bad', 'Your save cannot be made into a file: part of it is damaged. Nothing was saved.');
    } else if (this.deps.download(out.filename, out.text)) {
      audio.playSfx('confirm');
      this.say('ok', `Your browser was given ${out.filename}. Keep it somewhere safe.`);
    } else {
      audio.playSfx('cancel');
      this.say('bad', 'The browser would not save the file.');
    }
    this.render();
  }

  private doImport(): void {
    if (this.deps.openPicker(this.fileInput)) {
      audio.playSfx('confirm');
      this.say('info', 'Choose a save file.');
    } else {
      audio.playSfx('cancel');
      this.say('bad', 'The browser opens its file chooser only for a key press, a click or a tap: use Enter on the keyboard, or click or tap IMPORT SAVE.');
    }
    this.render();
  }

  /**
   * A pointer or touch on IMPORT SAVE opens the chooser here, inside the click, not from the next frame's polled input: Safari
   * (and any browser that wants the chooser opened from the gesture's own call stack) refuses a `click()` made a frame later.
   * That row therefore carries no `data-action` (the `Input` never sees its clicks, so nothing opens it twice); Enter and Confirm
   * still reach it through `input()`.
   */
  private readonly onClick = (e: Event): void => {
    const row = e.target instanceof Element ? e.target.closest('[data-row="import"]') : null;
    if (!row || this.busy || this.disposed || this.mode !== 'menu') return;
    this.at = 'import';
    this.doImport();
  };

  private readonly onFile = (): void => {
    const file = this.fileInput.files?.[0];
    this.fileInput.value = ''; // the same file can be chosen again
    if (!file || this.disposed) return;
    if (file.size > MAX_SAVE_FILE_BYTES) {
      this.say('bad', 'That file is too big to be a save file.');
      this.render();
      return;
    }
    this.busy = true;
    this.say('info', 'Reading the file…');
    this.render();
    this.deps.readText(file).then(
      (text) => this.afterRead(text),
      () => this.afterRead(null),
    );
  };

  private afterRead(text: string | null): void {
    if (this.disposed) return;
    this.busy = false;
    const read = text === null ? null : readSaveFile(text);
    if (!read) {
      audio.playSfx('cancel');
      this.say('bad', 'The browser could not read that file.');
    } else if (!read.ok) {
      audio.playSfx('cancel');
      this.say('bad', read.message);
    } else {
      this.pending = read;
      this.mode = 'confirm';
      this.at = 'keep'; // the safe choice first
      this.say('info', 'Check what the file holds, then choose.');
    }
    this.render();
  }

  private doReplace(): void {
    const file = this.pending;
    this.pending = null;
    this.mode = 'menu';
    if (!file) return this.render();
    if (commitImport(this.save, file, this.deps.now())) {
      audio.playSfx('confirm');
      this.at = 'undo';
      this.say('ok', 'Save replaced. UNDO IMPORT puts your earlier save back until you close the game.');
      this.deps.changed();
    } else {
      audio.playSfx('cancel');
      this.at = 'import';
      this.say('bad', 'The browser would not let the game write the save. Nothing was changed.');
    }
    this.render();
  }

  private doKeep(): void {
    this.pending = null;
    this.mode = 'menu';
    this.at = 'import';
    audio.playSfx('cancel');
    this.say('info', 'Nothing was changed.');
    this.render();
  }

  private doUndo(): void {
    if (undoImport(this.save, this.deps.now())) {
      audio.playSfx('confirm');
      this.say('ok', 'Your earlier save is back.');
      this.deps.changed();
      if (undoSteps(this.save) === 0) this.at = 'export';
    } else {
      audio.playSfx('cancel');
      this.say('bad', 'The browser would not let the game write the save. Nothing was changed.');
    }
    this.render();
  }

  // ---------------------------------------------------------------- markup

  private frameHtml(): string {
    const help = (where: string): string =>
      `<div class="pause__ec-help pause__ec-help--${where} pause__sp-help" data-role="sp-help-${where}">` +
      '<span class="pause__ec-help-t"></span><span class="pause__ec-help-b"></span><span class="pause__ec-help-g"></span></div>';
    return (
      `<section class="pause__ec" role="dialog" aria-label="Save file">` +
      `<h3 class="pause__ec-h">Save file<b>Keep your progress as a file</b></h3>` +
      `<div class="pause__ec-scroll" data-role="sp-scroll"><div class="pause__ec-cols">` +
      `<div class="pause__ec-col"><div data-role="sp-rows"></div>` +
      `<p class="pause__sp-status" data-role="sp-status" role="status" aria-live="polite"></p></div>` +
      `<div class="pause__ec-col">${help('desk')}</div></div></div>${help('phone')}` +
      `<input type="file" class="pause__sp-file" data-role="sp-file" accept=".json,application/json" tabindex="-1" aria-hidden="true"></section>` +
      `<div class="pause__back pause__ec-back" data-action="${SAVE_PORT_CLOSE_ACTION}" role="button" tabindex="0">` +
      `<span class="pause__key">Esc</span>Back</div>` +
      `<div class="pause__hide pause__ec-hint" aria-hidden="true">` +
      `<span class="pause__ec-hint-desk">Up / Down&nbsp;&nbsp;move&nbsp;&nbsp;&middot;&nbsp;&nbsp;Enter&nbsp;&nbsp;choose</span>` +
      `<span class="pause__ec-hint-phone">Tap a row to choose it</span></div>`
    );
  }

  /** Redraw the rows, the status and the help line from the live save; the cursor keeps its place. */
  render(): void {
    if (this.disposed) return;
    const rows = this.rows();
    if (!rows.some((r) => r.id === this.at)) this.at = rows[0]!.id;
    const html = rows
      .map((r) => {
        const sel = r.id === this.at;
        return (
          `<div class="pause__row pause__row--word pause__row--cmd pause__ec-row${sel ? ' pause__row--sel' : ''}${r.warn ? ' pause__sp-row--warn' : ''}" data-row="${r.id}"` +
          `${r.id === 'import' ? '' : ` data-action="${SAVE_PORT_ROW_ACTION}${r.id}"`} role="button" tabindex="${sel ? 0 : -1}">` +
          `<span class="pause__k">${escapeHtml(r.label)}</span>` +
          `<span class="pause__v">${escapeHtml(r.value)}</span></div>`
        );
      })
      .join('');
    const host = this.layer.querySelector<HTMLElement>('[data-role="sp-rows"]');
    if (host) host.innerHTML = html;
    const status = this.layer.querySelector<HTMLElement>('[data-role="sp-status"]');
    if (status) {
      status.textContent = this.status?.text ?? '';
      status.dataset['tone'] = this.status?.tone ?? '';
    }
    const help = savePortHelp(this.at, this.save, this.pending);
    for (const where of ['desk', 'phone']) {
      const el = this.layer.querySelector<HTMLElement>(`[data-role="sp-help-${where}"]`);
      if (!el) continue;
      el.querySelector('.pause__ec-help-t')!.textContent = help.t;
      el.querySelector('.pause__ec-help-b')!.textContent = help.b;
      el.querySelector('.pause__ec-help-g')!.textContent = 'Both games.';
    }
    // Focus follows the cursor, for a screen reader and a Tab key, as the other pages do.
    const sel = this.layer.querySelector<HTMLElement>('.pause__row--sel');
    sel?.focus({ preventScroll: true });
    sel?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  /** What the page shows, for the debug API and the tests. */
  snapshot(): Record<string, unknown> {
    return {
      open: true,
      mode: this.mode,
      row: this.at,
      rows: this.rows().map((r) => ({ id: r.id, label: r.label, value: r.value })),
      status: this.status ? { ...this.status } : null,
      file: this.pending ? { ...this.pending.summary, older: this.pending.older, exportedAt: this.pending.exportedAt } : null,
      undoSteps: undoSteps(this.save),
      busy: this.busy,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.pending = null;
    this.fileInput.removeEventListener('change', this.onFile);
    this.layer.removeEventListener('click', this.onClick);
    this.layer.remove();
    this.root.classList.remove(EYE_CANDY_OPEN_CLASS);
  }
}
