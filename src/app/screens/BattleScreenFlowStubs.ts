/**
 * The placeholder screens the chapter flow falls back to.
 *
 * Deliberately plain: enough structure and keyboard handling for the flow and
 * the e2e specs to run end to end, and no visual opinions that would fight the
 * real screens. `ui/common` replaces any of them by calling
 * `registerFlowScreens()` from `BattleScreenFlow.ts` — nothing here has to be
 * edited or deleted when it does.
 */

import type { InputSnapshot } from '../Input.ts';
import type { ChapterId } from '../../data/encounters.ts';
import { CHAPTERS } from '../../data/encounters.ts';
import type { StoryScript } from '../../story/dsl.ts';
import { audio } from '../../audio/index.ts';
import { Screen as ScreenBase } from '../Screen.ts';
import type {
  CutsceneScreenOptions,
  FlowScreen,
  ResultsScreenOptions,
} from './BattleScreenFlow.ts';

// ---------------------------------------------------------------------------
// Placeholder screens
//
// Deliberately plain: enough structure and keyboard handling for the flow and
// the e2e specs to run, and no visual opinions that would fight the real ones.
// ---------------------------------------------------------------------------

const STUB_STYLE_ID = 'pyrefly-flow-stub-style';
const STUB_CSS = `
.fstub { position:absolute; inset:0; display:grid; place-items:center; color:#dce7fa;
  font-family: var(--font-display, system-ui), system-ui, sans-serif; }
.fstub__inner { width:min(860px, 88vw); }
.fstub h1 { font-size:15px; letter-spacing:.32em; text-transform:uppercase; color:#8fb6e8; margin:0 0 18px; }
.fstub ol { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
.fstub li { padding:12px 16px; border:1px solid rgba(150,195,255,.18);
  background:linear-gradient(180deg, rgba(10,24,50,.62), rgba(3,7,16,.72)); border-radius:2px; }
.fstub li[aria-selected="true"] { border-color:#9fd8ff; box-shadow:0 0 0 1px rgba(159,216,255,.35) inset; }
.fstub li b { display:block; font-size:15px; letter-spacing:.06em; }
.fstub li span { font-size:11px; color:#8ea6c8; letter-spacing:.05em; }
.fstub li em { font-style:normal; color:#9df0d2; font-size:10px; letter-spacing:.2em; }
.fstub__box { padding:18px 22px; border:1px solid rgba(150,195,255,.22);
  background:linear-gradient(180deg, rgba(10,24,50,.82), rgba(3,7,16,.9)); border-radius:2px; min-height:96px; }
.fstub__who { font-size:10px; letter-spacing:.28em; text-transform:uppercase; color:#9df0d2; margin-bottom:8px; }
.fstub__line { font-size:16px; line-height:1.6; }
.fstub__hint { margin-top:14px; font-size:10px; letter-spacing:.2em; color:#6f86a8; text-transform:uppercase; }
.fstub dl { display:grid; grid-template-columns:auto 1fr; gap:6px 18px; font-size:13px; margin:0; }
.fstub dt { color:#8ea6c8; letter-spacing:.14em; font-size:10px; text-transform:uppercase; align-self:center; }
.fstub dd { margin:0; }
`;

function ensureStubStyle(): void {
  if (document.getElementById(STUB_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STUB_STYLE_ID;
  el.textContent = STUB_CSS;
  document.head.appendChild(el);
}

/** Placeholder chapter select: the five cards, arrow keys, confirm. */
export class StubChapterSelect extends ScreenBase implements FlowScreen<ChapterId | null> {
  readonly name = 'chapter-select';
  readonly done: Promise<ChapterId | null>;
  private resolve!: (id: ChapterId | null) => void;
  private index = 0;

  constructor() {
    super();
    this.done = new Promise((r) => {
      this.resolve = r;
    });
  }

  override enter(): void {
    ensureStubStyle();
    this.root.className = 'screen fstub';
    this.render_();
    void this.app.fade('clear', 400);
  }

  private render_(): void {
    const save = this.app.save;
    const items = CHAPTERS.map((c, i) => {
      const rec = save.value.chapters[c.id];
      const cleared = rec?.cleared ? '<em>cleared</em>' : '';
      return `<li aria-selected="${i === this.index}" data-id="${c.id}">
        <b>${c.number}. ${c.title}</b><span>${c.location}</span>${cleared}</li>`;
    }).join('');
    this.root.innerHTML = `<div class="fstub__inner"><h1>Select a chapter</h1>
      <ol>${items}</ol>
      <div class="fstub__hint">Up / Down &middot; Enter to begin &middot; Esc for the title</div></div>`;
  }

  override handleInput(input: InputSnapshot): void {
    const n = CHAPTERS.length;
    if (input.justPressed('down')) {
      this.index = (this.index + 1) % n;
      audio.playSfx('cursor-move');
      this.render_();
    }
    if (input.justPressed('up')) {
      this.index = (this.index + n - 1) % n;
      audio.playSfx('cursor-move');
      this.render_();
    }
    if (input.justPressed('confirm')) {
      audio.playSfx('confirm');
      this.resolve(CHAPTERS[this.index]!.id);
    }
    if (input.justPressed('cancel')) {
      audio.playSfx('cancel');
      this.resolve(null);
    }
  }

  /** `__pyrefly.trigger('select:seymour-flux')` picks a card without keys. */
  override trigger(name: string): boolean {
    if (!name.startsWith('select:')) return false;
    const id = name.slice(7);
    const i = CHAPTERS.findIndex((c) => c.id === id);
    if (i < 0) return false;
    this.index = i;
    this.resolve(CHAPTERS[i]!.id);
    return true;
  }

  override exit(): void {
    this.resolve(null);
  }

  override snapshot(): Record<string, unknown> {
    return { index: this.index, chapters: CHAPTERS.map((c) => c.id), stub: true };
  }
}

/** Placeholder cutscene: walks the script's spoken lines. */
export class StubCutscene extends ScreenBase implements FlowScreen<void> {
  readonly name = 'cutscene';
  readonly done: Promise<void>;
  private resolve!: () => void;
  private lines: Array<{ who: string; text: string }> = [];
  private index = 0;

  constructor(private readonly opts: CutsceneScreenOptions) {
    super();
    this.done = new Promise<void>((r) => {
      this.resolve = r;
    });
  }

  override enter(): void {
    ensureStubStyle();
    this.root.className = 'screen fstub';
    this.lines = collectLines(this.opts.script);
    if (this.opts.skip || !this.lines.length) {
      this.resolve();
      return;
    }
    this.render_();
    void this.app.fade('clear', 400);
  }

  private render_(): void {
    const line = this.lines[this.index];
    if (!line) return;
    this.root.innerHTML = `<div class="fstub__inner">
      <div class="fstub__box">
        <div class="fstub__who">${line.who === 'narrator' ? '' : line.who}</div>
        <div class="fstub__line">${escapeHtml(line.text)}</div>
      </div>
      <div class="fstub__hint">${this.index + 1} / ${this.lines.length} &middot; Enter &middot; Esc skips</div>
    </div>`;
  }

  private advance(): void {
    this.index++;
    if (this.index >= this.lines.length) this.resolve();
    else this.render_();
  }

  override handleInput(input: InputSnapshot): void {
    if (input.justPressed('confirm')) {
      audio.playSfx('cursor-move');
      this.advance();
    }
    if (input.justPressed('cancel') || input.justPressed('start')) this.resolve();
  }

  override trigger(name: string): boolean {
    if (name === 'cutscene:skip') {
      this.resolve();
      return true;
    }
    if (name === 'cutscene:advance') {
      this.advance();
      return true;
    }
    return false;
  }

  override exit(): void {
    this.resolve();
  }

  override snapshot(): Record<string, unknown> {
    return {
      phase: this.opts.phase,
      chapter: this.opts.chapter.id,
      line: this.index,
      lines: this.lines.length,
      stub: true,
    };
  }
}

/** Placeholder results screen. */
export class StubResults extends ScreenBase implements FlowScreen<void> {
  readonly name = 'results';
  readonly done: Promise<void>;
  private resolve!: () => void;

  constructor(private readonly opts: ResultsScreenOptions) {
    super();
    this.done = new Promise<void>((r) => {
      this.resolve = r;
    });
  }

  override enter(): void {
    ensureStubStyle();
    this.root.className = 'screen fstub';
    const r = this.opts.result;
    const rows = r
      ? `<dt>Outcome</dt><dd>${r.outcome}</dd>
         <dt>Turns</dt><dd>${r.turns}</dd>
         <dt>Time</dt><dd>${(r.elapsedMs / 1000).toFixed(1)}s</dd>
         <dt>AP</dt><dd>${r.ap}</dd>
         <dt>Gil</dt><dd>${r.gil}</dd>`
      : `<dt>Outcome</dt><dd>${this.opts.outcome}</dd>`;
    this.root.innerHTML = `<div class="fstub__inner"><h1>${this.opts.chapter.title}</h1>
      <div class="fstub__box"><dl>${rows}</dl></div>
      <div class="fstub__hint">Enter to continue</div></div>`;
    void this.app.fade('clear', 300);
  }

  override handleInput(input: InputSnapshot): void {
    if (input.justPressed('confirm') || input.justPressed('cancel')) this.resolve();
  }

  override trigger(name: string): boolean {
    if (name !== 'results:continue') return false;
    this.resolve();
    return true;
  }

  override exit(): void {
    this.resolve();
  }

  override snapshot(): Record<string, unknown> {
    return { chapter: this.opts.chapter.id, result: this.opts.result, stub: true };
  }
}

/** Pull the spoken lines out of a script, following `parallel` and `ifFlag`. */
function collectLines(script: StoryScript): Array<{ who: string; text: string }> {
  const out: Array<{ who: string; text: string }> = [];
  const walk = (steps: StoryScript): void => {
    for (const step of steps) {
      if (step.type === 'say') out.push({ who: step.who, text: step.text });
      else if (step.type === 'narrate') out.push({ who: 'narrator', text: step.text });
      else if (step.type === 'parallel') walk(step.steps);
      else if (step.type === 'ifFlag') walk(step.then);
    }
  };
  walk(script);
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}
