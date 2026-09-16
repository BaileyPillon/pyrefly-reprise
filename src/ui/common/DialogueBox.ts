import './dialogue-box.css';
import type { InputSnapshot } from '../../app/Input.ts';
import type { ChoiceStep, NarrateStep, SayStep, SpeakerId } from '../../story/dsl.ts';
import type { DialoguePort } from '../../story/runner/CutsceneRunner.ts';
import { portraitImgHtml } from './portrait.ts';
import { speakerRole } from './speaker-roles.ts';
import { escapeHtml } from './html.ts';
import { autoAdvanceHoldMs, computeRevealCount, isFullyRevealed, typingDurationMs } from './typewriter.ts';

/**
 * FFX-style dialogue window: blue-to-black gradient chrome, a name tag, an
 * optional portrait (`public/art/portraits/<id>.png`, silently absent when
 * missing), typewriter reveal, advance-or-skip on `confirm`, an "auto mode"
 * that reads on by itself, and a `narrate` variant (Tidus's retrospective —
 * no name tag, italic, over a plain scrim) [visual-bible §3.9/§3.10,
 * writing-bible §1.2/§2.1].
 *
 * Implements {@link DialoguePort} directly, so a `CutsceneRunner` can drive it
 * with no adapter: `new CutsceneRunner({ dialogue: dialogueBox, ... })`.
 *
 * Presentation only — mount it, then call `handleInput`/`update` every frame
 * exactly like a `SpriteActor` (see `docs/ENGINE-API.md`'s frame contract).
 */
export interface DialogueBoxOptions {
  /** Where the box is mounted. Usually the screen's root element. */
  root: HTMLElement;
  /** Display label for a speaker id. Defaults to a title-cased id. */
  nameFor?: (who: SpeakerId) => string;
  /** Portrait key for a speaker id. Defaults to the id itself. */
  portraitFor?: (who: SpeakerId) => string | undefined;
  /**
   * The tracked tag beside the name (`Tidus [GUARDIAN]`). Defaults to
   * {@link speakerRole}; return `undefined` for a bare name.
   */
  roleFor?: (who: SpeakerId) => string | undefined;
  /** `SaveData.settings.textSpeed` multiplier; 1 = normal. */
  textSpeed?: number;
  /** Start in "auto mode" (advances without input once each line finishes typing). */
  autoMode?: boolean;
}

type TypingState = 'idle' | 'typing' | 'waiting';

interface ChoiceState {
  count: number;
  getSelected: () => number;
  move: (delta: number) => void;
  resolve: (index: number) => void;
}

const CHOICE_ACTION_RE = /^dbox-choice-(\d+)$/;

function defaultName(who: SpeakerId): string {
  if (who === 'none' || who === 'narrator') return '';
  return who
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export class DialogueBox implements DialoguePort {
  readonly el: HTMLElement;
  private readonly portraitEl: HTMLElement;
  private readonly nameEl: HTMLElement;
  private readonly roleEl: HTMLElement;
  private readonly textEl: HTMLElement;

  private textSpeed: number;
  private autoModeOn: boolean;
  private mounted = false;

  private typingState: TypingState = 'idle';
  private fullText = '';
  private elapsedMs = 0;
  private explicitAutoMs: number | undefined;
  private autoDeadline: number | null = null;
  private resolveAdvance: (() => void) | null = null;
  private choiceState: ChoiceState | null = null;

  constructor(private readonly opts: DialogueBoxOptions) {
    this.textSpeed = opts.textSpeed ?? 1;
    this.autoModeOn = opts.autoMode ?? false;

    this.el = document.createElement('div');
    this.el.className = 'dbox';
    this.el.dataset['role'] = 'dialogue-box';
    this.el.classList.toggle('dbox--auto', this.autoModeOn);
    this.el.innerHTML = `
      <div class="dbox__win" data-action="confirm">
        <div class="dbox__slab"></div>
        <div class="dbox__edge"></div>
        <div class="dbox__portrait"></div>
        <div class="dbox__body">
          <div class="dbox__name"><span class="dbox__speaker"></span><span class="dbox__role"></span></div>
          <div class="dbox__text"></div>
        </div>
        <div class="dbox__advance"></div>
        <div class="dbox__auto">AUTO</div>
      </div>
    `;
    this.portraitEl = this.el.querySelector('.dbox__portrait') as HTMLElement;
    this.nameEl = this.el.querySelector('.dbox__speaker') as HTMLElement;
    this.roleEl = this.el.querySelector('.dbox__role') as HTMLElement;
    this.textEl = this.el.querySelector('.dbox__text') as HTMLElement;
  }

  // ------------------------------------------------------------------ mount

  mount(): void {
    if (this.mounted) return;
    this.opts.root.appendChild(this.el);
    this.mounted = true;
  }

  unmount(): void {
    if (!this.mounted) return;
    this.el.remove();
    this.mounted = false;
  }

  get visible(): boolean {
    return this.el.classList.contains('dbox--visible');
  }

  /** Hide immediately and drop any in-flight advance/choice (used by skip-scene teardown). */
  hide(): void {
    this.el.classList.remove('dbox--visible', 'dbox--waiting', 'dbox--narrate', 'dbox--choice', 'dbox--no-portrait');
    this.typingState = 'idle';
    this.autoDeadline = null;
    this.choiceState = null;
    this.resolveAdvance = null;
  }

  setTextSpeed(speed: number): void {
    this.textSpeed = speed > 0 ? speed : 1;
  }

  setAutoMode(on: boolean): void {
    this.autoModeOn = on;
    this.el.classList.toggle('dbox--auto', on);
  }

  get autoMode(): boolean {
    return this.autoModeOn;
  }

  // --------------------------------------------------------- DialoguePort

  say(step: SayStep): Promise<void> {
    return this.beginLine({
      who: step.who,
      text: step.text,
      portrait: step.portrait,
      auto: step.auto,
      narrate: false,
    });
  }

  narrate(step: NarrateStep): Promise<void> {
    return this.beginLine({ who: 'narrator', text: step.text, auto: step.auto, narrate: true });
  }

  choice(step: ChoiceStep): Promise<string | number | boolean> {
    this.typingState = 'idle';
    this.resolveAdvance = null;
    this.el.classList.remove('dbox--narrate', 'dbox--waiting');
    this.el.classList.add('dbox--choice', 'dbox--no-portrait');
    this.nameEl.textContent = '';
    this.roleEl.textContent = '';
    this.roleEl.hidden = true;
    (this.nameEl.parentElement as HTMLElement).hidden = true;
    this.portraitEl.innerHTML = '';

    let selected = 0;
    const render = (): void => {
      const prompt = step.prompt ? `<div class="dbox__choice-prompt">${escapeHtml(step.prompt)}</div>` : '';
      const rows = step.options
        .map((o, i) => {
          const cls = i === selected ? 'dbox__choice-row dbox__choice-row--selected' : 'dbox__choice-row';
          return `<div class="${cls}" data-action="dbox-choice-${i}">${escapeHtml(o.label)}</div>`;
        })
        .join('');
      this.textEl.innerHTML = `${prompt}<div class="dbox__choice-list">${rows}</div>`;
    };
    render();
    this.show();

    return new Promise((resolve) => {
      this.choiceState = {
        count: step.options.length,
        getSelected: () => selected,
        move: (delta) => {
          selected = (selected + delta + step.options.length) % step.options.length;
          render();
        },
        resolve: (index) => {
          this.choiceState = null;
          this.el.classList.remove('dbox--choice');
          const value = step.options[index]?.value ?? step.options[0]?.value ?? '';
          resolve(value);
        },
      };
    });
  }

  // ------------------------------------------------------------------ frame

  handleInput(input: InputSnapshot): void {
    if (!this.visible) return;

    if (this.choiceState) {
      const choice = this.choiceState;
      if (input.consume('up') || input.consume('left')) choice.move(-1);
      else if (input.consume('down') || input.consume('right')) choice.move(1);
      else if (input.consume('confirm')) choice.resolve(choice.getSelected());
      for (const action of input.actions) {
        const m = CHOICE_ACTION_RE.exec(action);
        if (m?.[1] !== undefined) choice.resolve(Number(m[1]));
      }
      return;
    }

    if (this.typingState === 'idle') return;
    const pressed = input.consume('confirm') || input.actions.includes('confirm');
    if (pressed) this.advance();
  }

  /**
   * Do whatever a confirm press would do right now — skip the remaining
   * typewriter reveal, or complete the advance if already fully revealed.
   * Debug-API hook for `trigger('cutscene:advance')`; a mid-choice call picks
   * whatever option is currently highlighted.
   */
  forceAdvance(): void {
    if (this.choiceState) {
      this.choiceState.resolve(this.choiceState.getSelected());
      return;
    }
    if (this.typingState !== 'idle') this.advance();
  }

  private advance(): void {
    if (this.typingState === 'typing') {
      this.elapsedMs = typingDurationMs(this.fullText, this.textSpeed);
      this.renderRevealed();
      this.enterWaiting();
      return;
    }
    if (this.typingState === 'waiting') this.completeAdvance();
  }

  update(dt: number): void {
    if (this.typingState === 'typing') {
      this.elapsedMs += dt * 1000;
      this.renderRevealed();
      if (isFullyRevealed(this.fullText, this.elapsedMs, this.textSpeed)) this.enterWaiting();
    } else if (this.typingState === 'waiting') {
      if (this.autoDeadline !== null && performance.now() >= this.autoDeadline) this.completeAdvance();
    }
  }

  // ----------------------------------------------------------------- inner

  private beginLine(opts: {
    who: SpeakerId;
    text: string;
    portrait?: string;
    auto?: number;
    narrate: boolean;
  }): Promise<void> {
    this.fullText = opts.text;
    this.elapsedMs = 0;
    this.explicitAutoMs = opts.auto;
    this.typingState = 'typing';
    this.autoDeadline = null;

    this.el.classList.remove('dbox--waiting', 'dbox--choice');
    this.el.classList.toggle('dbox--narrate', opts.narrate);

    this.nameEl.textContent = opts.narrate ? '' : (this.opts.nameFor?.(opts.who) ?? defaultName(opts.who));
    (this.nameEl.parentElement as HTMLElement).hidden = !this.nameEl.textContent;
    const role = opts.narrate ? undefined : (this.opts.roleFor ?? speakerRole)(opts.who);
    this.roleEl.textContent = role ?? '';
    this.roleEl.hidden = !role;

    const portraitId = opts.narrate || opts.who === 'none' ? undefined : (opts.portrait ?? this.opts.portraitFor?.(opts.who) ?? opts.who);
    this.portraitEl.innerHTML = portraitImgHtml(portraitId);
    this.el.classList.toggle('dbox--no-portrait', opts.narrate || !portraitId);

    this.renderRevealed();
    this.show();

    return new Promise((resolve) => {
      this.resolveAdvance = resolve;
    });
  }

  private enterWaiting(): void {
    this.typingState = 'waiting';
    this.el.classList.add('dbox--waiting');
    if (this.explicitAutoMs !== undefined) {
      this.autoDeadline = performance.now() + this.explicitAutoMs;
    } else if (this.autoModeOn) {
      this.autoDeadline = performance.now() + autoAdvanceHoldMs(this.fullText);
    } else {
      this.autoDeadline = null;
    }
  }

  private completeAdvance(): void {
    this.typingState = 'idle';
    this.autoDeadline = null;
    this.el.classList.remove('dbox--waiting');
    const resolve = this.resolveAdvance;
    this.resolveAdvance = null;
    resolve?.();
  }

  private renderRevealed(): void {
    const n = computeRevealCount(this.fullText, this.elapsedMs, this.textSpeed);
    this.textEl.textContent = this.fullText.slice(0, n);
  }

  private show(): void {
    this.el.classList.add('dbox--visible');
  }
}
