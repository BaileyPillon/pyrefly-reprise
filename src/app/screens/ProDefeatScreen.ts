/**
 * THE DEFEAT CARD THAT KEEPS THE SCENE (lane "pro-staging"; Bailey 2026-10-22: loss "quick retry" - "a caption and a retry card that keep the scene"; the options book's `victory-defeat` D3 "Overlay that keeps the scene").
 *
 * An overlay the flow pushes over the battle screen after a lost demo fight (`GameFlow.showResults`, with the staging's `ending` piece on): the battle screen stays up under it (`App.pushOverlay` freezes it and keeps
 * drawing it), dimmed, with the party where it fell and the caption the presenter dropped in ("The party has fallen", `ui/common/proStage/EndingView.ts`); this card sits at the bottom right and names the cause, the
 * turn, the attempt and the time, and offers the two choices TRY AGAIN (focused: one press) and OTHER FIGHT. Back (Esc, the pad's B) still leaves for the picker.
 *
 * **The second slab is worded for what it does (backlog 58, release 67; both games).** On the demo path (`ProDefeatOptions.otherFight`: demo mode, in one of the two demo fights, `demoDefeatPanel`) it is OTHER FIGHT and
 * starts the other fight. On the PUBLIC address it never did: the flow only starts a fight for a demo fight in demo mode, so the slab went to the chapter select. It reads CHAPTER SELECT there and gives the choice
 * `chapter-select`, the old defeat panel's own word for it. The first slab is TRY AGAIN on both paths.
 *
 * It keeps the old defeat panel's contract exactly: the same `ResultsChoice` words go to `onChoice`, the same input words choose (`confirm`, the d-pad, `cancel`, the click actions `results:retry` and
 * `results:other-fight`), the same demo hint strip is mounted, so the flow downstream (`noteDemoDefeatChoice`, `carryAfterDefeat`) is untouched. Game case (rule 14): both games, one design in two skins (FFX blue and
 * gold; FFX-2 pearl and rose, `.ig--ffx2`); the cause line is the foe's own latest move, whichever game it is from.
 */
import '../../ui/common/proStage/proDefeat.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { formatClearTime } from '../../ui/common/resultsMath.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { keyHint } from '../../ui/common/padGlyphs.ts';
import { mountDemoResultsHint } from '../demo/demoHints.ts';
import type { ControlsHint } from '../../ui/common/ControlsHint.ts';
import type { GameId } from '../../battle/common/types.ts';
import { takeDefeatNote } from '../../engine/pro/staging/DefeatNote.ts';
import type { ResultsChoice } from '../../ui/common/resultsPage.ts';

export interface ProDefeatOptions {
  game: GameId;
  /** The battle's turn count (`BattleResult.turns`), when the engine gave a result. */
  turns?: number | undefined;
  /** The fight's wall-clock length in ms. */
  elapsedMs: number;
  /** Which attempt this was, 1-based. */
  attempt: number;
  /** Called with the player's pick, as the old defeat panel did. */
  onChoice?: (choice: ResultsChoice) => void;
  /** The demo path (`demoDefeatPanel(chapter.id)`): the second slab is OTHER FIGHT, which starts the other fight. Absent or false (the public address): CHAPTER SELECT, which is what that slab does there. */
  otherFight?: boolean | undefined;
}

/** TRY AGAIN and OTHER FIGHT, in cursor order (the demo defeat panel's own two slabs and words): the demo path. */
export const PRO_DEFEAT_DEMO_ACTIONS: ReadonlyArray<{ choice: ResultsChoice; label: string }> = [
  { choice: 'retry', label: 'Try again' },
  { choice: 'other-fight', label: 'Other fight' },
];

/** TRY AGAIN and CHAPTER SELECT, in cursor order: the public address, where the second slab leaves for the chapter select (backlog 58). */
export const PRO_DEFEAT_PUBLIC_ACTIONS: ReadonlyArray<{ choice: ResultsChoice; label: string }> = [
  { choice: 'retry', label: 'Try again' },
  { choice: 'chapter-select', label: 'Chapter select' },
];

export class ProDefeatScreen extends Screen {
  readonly name = 'pro-defeat';
  readonly done: Promise<void>;
  private resolveDone!: () => void;
  private index = 0;
  private picked = false;
  private hint: ControlsHint | null = null;
  private buttons: HTMLElement[] = [];
  private readonly actions: ReadonlyArray<{ choice: ResultsChoice; label: string }>;

  constructor(private readonly o: ProDefeatOptions) {
    super();
    this.actions = o.otherFight === true ? PRO_DEFEAT_DEMO_ACTIONS : PRO_DEFEAT_PUBLIC_ACTIONS;
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
  }

  override enter(): void {
    const note = takeDefeatNote();
    const meta: string[] = [];
    if (this.o.turns !== undefined && this.o.turns > 0) meta.push(`Turn ${this.o.turns}`);
    meta.push(`Attempt ${this.o.attempt}`);
    if (this.o.elapsedMs > 0) meta.push(formatClearTime(this.o.elapsedMs));
    const root = this.root;
    root.classList.add('pdf-screen');
    root.innerHTML = `
      <div class="pdf ig${this.o.game === 'ffx2' ? ' ig--ffx2' : ''}" data-role="defeat-card">
        <div class="pdf__card">
          ${note?.cause ? `<div class="pdf__cause">Felled by ${escapeHtml(note.cause)}</div>` : '<div class="pdf__cause">The party has fallen</div>'}
          <div class="pdf__meta">${meta.map(escapeHtml).join('<i>&middot;</i>')}</div>
          <div class="pdf__row">
            ${this.actions.map(
              (a, i) =>
                `<button type="button" class="pdf__btn${i === 0 ? ' pdf__btn--first' : ''}" data-action="results:${a.choice}" data-index="${i}"><b class="pdf__key">${keyHint('Enter', 'Cross')}</b><span>${escapeHtml(a.label)}</span></button>`, // the confirm key's chip shows on the focused button only
            ).join('')}
          </div>
        </div>
      </div>`;
    this.buttons = [...root.querySelectorAll<HTMLElement>('.pdf__btn')];
    this.refresh();
    this.hint = mountDemoResultsHint(root, false);
  }

  override exit(): void {
    this.hint?.unmount();
    this.hint = null;
    this.resolveDone();
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    if (this.picked) return;
    const delta = (input.consume('right') || input.consume('down') ? 1 : 0) - (input.consume('left') || input.consume('up') ? 1 : 0);
    if (delta !== 0) {
      this.index = (this.index + delta + this.actions.length) % this.actions.length;
      audio.playSfx('cursor-move');
      this.refresh();
    }
    for (const a of this.actions) {
      if (input.actions.includes(`results:${a.choice}`)) return this.pick(a.choice);
    }
    if (input.consume('confirm')) this.pick(this.actions[this.index]!.choice);
    else if (input.consume('cancel') || input.actions.includes('cancel')) this.pick('chapter-select');
  }

  override trigger(name: string): boolean {
    if (name === 'results:retry' || name === 'retry') return (this.pick('retry'), true);
    if (name === 'results:other-fight') return (this.pick(this.actions[1]!.choice), true); // on the public address the second slab is the chapter select, whatever asked for it by the demo's word
    if (name === 'results:chapter-select') return (this.pick('chapter-select'), true);
    return false;
  }

  override snapshot(): Record<string, unknown> {
    return { kind: 'pro-defeat', index: this.index, picked: this.picked };
  }

  private refresh(): void {
    this.buttons.forEach((b, i) => b.classList.toggle('is-focus', i === this.index));
  }

  private pick(choice: ResultsChoice): void {
    if (this.picked) return;
    this.picked = true;
    audio.playSfx('confirm');
    this.o.onChoice?.(choice);
    this.resolveDone();
  }
}
