/**
 * CAMERA LAB: the panel (`?camera=lab` opens it instead of the title).
 *
 * Pick Chapter I (FFX, Seymour Flux) or Chapter IV (FFX-2, Bahamut), the style and the three
 * switches, then START: the chapter plays through the game's own flow (cutscenes skipped) with
 * the lab camera. PLAY TODAY'S VERSION plays the same chapter with today's camera.
 *
 * Keys: Up/Down pick a row, Left/Right change it, Enter starts, T plays today's version.
 * Everything is a button too (a phone or a mouse). Plain on purpose: a harness, labelled TEST
 * BUILD, never one of the game's screens. Game case (rule 14): both games, as a test.
 */

import { Screen } from '../../app/Screen.ts';
import type { InputSnapshot } from '../../app/Input.ts';
import { installInkGoldStyles } from '../inkgold/index.ts';
import { labSession } from '../../engine/lab/LabSession.ts';
import { LAB_CHAPTERS } from '../../engine/lab/labChapters.ts';
import type { LabChapterId } from '../../engine/lab/LabTypes.ts';
import { CHAPTER_ROW, SWITCH_ROWS, patchFor, rowHtml, rowValue, type LabRowSpec } from './labRows.ts';
import './lab.css';

export interface LabPick {
  chapter: LabChapterId;
  /** `lab` = the lab camera; `today` = the same chapter with today's camera. */
  mode: 'lab' | 'today';
}

const ROWS: readonly LabRowSpec[] = [CHAPTER_ROW, ...SWITCH_ROWS];

export class CameraLabScreen extends Screen {
  readonly name = 'camera-lab';
  readonly done: Promise<LabPick | null>;
  private resolve: ((p: LabPick | null) => void) | null = null;
  private focus = 0;
  private panel: HTMLElement | null = null;
  private onTodayKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyT' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) this.finish('today');
  };

  constructor() {
    super();
    this.done = new Promise((r) => (this.resolve = r));
  }

  override enter(): void {
    installInkGoldStyles();
    this.root.className = 'screen lab-screen ig';
    this.root.dataset['role'] = 'camera-lab';
    this.draw();
    void this.app.fade('clear', 300);
    window.addEventListener('keydown', this.onTodayKey);
  }

  override exit(): void {
    window.removeEventListener('keydown', this.onTodayKey);
    this.resolve?.(null);
    this.resolve = null;
  }

  private draw(): void {
    const s = labSession();
    const chapter = LAB_CHAPTERS[s.chapter];
    const rows = ROWS.map((r, i) => rowHtml(r, rowValue(r.id, s.switches, s.chapter), i === this.focus, 'lab:set')).join('');
    const flaws = chapter.flaws.map((f) => `<li>${f.replace(/</g, '&lt;')}</li>`).join('');
    const html = `
      <div class="lab-panel" role="dialog" aria-label="Camera lab">
        <h1 class="lab-title">Camera Lab <span class="lab-badge">TEST BUILD</span></h1>
        <p class="lab-sub">A playable test of the Clair Obscur / Persona battle camera (D-318), before any of it goes into the game.
          Not the game's camera: flip the switches here or mid-fight and play to the end.</p>
        ${rows}
        <div class="lab-actions">
          <button type="button" class="lab-btn lab-btn--go" data-action="lab:start">START</button>
          <button type="button" class="lab-btn" data-action="lab:today">PLAY TODAY'S VERSION</button>
        </div>
        <p class="lab-keys"><kbd>↑</kbd><kbd>↓</kbd> pick a row · <kbd>←</kbd><kbd>→</kbd> change it · <kbd>Enter</kbd> start ·
          <kbd>T</kbd> today's version. In battle: <kbd>L</kbd> opens the switches, <kbd>1</kbd> style · <kbd>2</kbd> views ·
          <kbd>3</kbd> menu · <kbd>4</kbd> target cut. The chip at the top of the fight is clickable.</p>
        <div class="lab-notes"><b>Candidate paintings</b> (never installed in the game; their known flaws):<ul>${flaws}</ul>
          FFX: the camera cuts between held shots on each beat. FFX-2: one held shot while a menu is open, cuts on actions only.</div>
      </div>`;
    if (!this.panel) {
      this.panel = document.createElement('div');
      this.panel.className = 'lab-panel-host';
      this.root.appendChild(this.panel);
    }
    this.panel.innerHTML = html;
  }

  private apply(rowId: string, value: string): void {
    const s = labSession();
    if (rowId === 'chapter') {
      if (value === 'seymour-flux' || value === 'ffx2-bahamut') s.setChapter(value);
    } else {
      s.set(patchFor(rowId as LabRowSpec['id'], value));
    }
    this.draw();
  }

  private step(dir: 1 | -1): void {
    const row = ROWS[this.focus]!;
    const s = labSession();
    const now = rowValue(row.id, s.switches, s.chapter);
    const i = row.options.findIndex((o) => o.value === now);
    const next = row.options[(i + dir + row.options.length) % row.options.length]!;
    this.apply(row.id, next.value);
  }

  private finish(mode: LabPick['mode']): void {
    const r = this.resolve;
    if (!r) return;
    this.resolve = null;
    r({ chapter: labSession().chapter, mode });
  }

  override handleInput(input: InputSnapshot): void {
    for (const a of input.actions) {
      if (a === 'lab:start') return this.finish('lab');
      if (a === 'lab:today') return this.finish('today');
      const m = /^lab:set:([a-z]+):(.+)$/.exec(a);
      if (m) {
        this.focus = Math.max(0, ROWS.findIndex((r) => r.id === m[1]));
        this.apply(m[1]!, m[2]!);
      }
    }
    if (input.justPressed('up')) {
      this.focus = (this.focus + ROWS.length - 1) % ROWS.length;
      this.draw();
    } else if (input.justPressed('down')) {
      this.focus = (this.focus + 1) % ROWS.length;
      this.draw();
    } else if (input.justPressed('left')) {
      this.step(-1);
    } else if (input.justPressed('right')) {
      this.step(1);
    } else if (input.consume('confirm')) {
      this.finish('lab');
    }
  }

  override snapshot(): Record<string, unknown> {
    const s = labSession();
    return { chapter: s.chapter, switches: { ...s.switches }, focus: ROWS[this.focus]?.id ?? null };
  }
}
