import './message-bar.css';
import { escapeHtml } from './html.ts';

/**
 * The top-left FFX battle message strip ("Tidus attacks!", "Seymour uses
 * Total Annihilation!"). Same rect and chrome as `HudMock`'s static mock
 * (`research/visual-bible.md` §3.1) — this is the real, data-driven version:
 * queued messages, auto-hide, and a bold lead word to match the mock's
 * `<b>first-word</b> rest` treatment.
 */
export interface MessageBarOptions {
  root: HTMLElement;
  /** How long a message stays up before the next queued one takes over, ms. */
  holdMs?: number;
}

interface QueuedMessage {
  text: string;
  holdMs: number;
}

export class MessageBar {
  readonly el: HTMLElement;

  private readonly defaultHoldMs: number;
  private queue: QueuedMessage[] = [];
  private remainingMs = 0;
  private mounted = false;

  constructor(private readonly opts: MessageBarOptions) {
    this.defaultHoldMs = opts.holdMs ?? 2200;
    this.el = document.createElement('div');
    this.el.className = 'mbar';
    this.el.dataset['role'] = 'message-bar';
    this.el.hidden = true;
  }

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
    return this.el.classList.contains('mbar--visible');
  }

  /** Show a message now, replacing whatever is queued after the current one. */
  show(text: string, holdMs = this.defaultHoldMs): void {
    this.queue = [{ text, holdMs }];
    this.remainingMs = 0;
    this.advanceQueue();
  }

  /** Queue a message to play after the current (and any already-queued) ones finish. */
  enqueue(text: string, holdMs = this.defaultHoldMs): void {
    this.queue.push({ text, holdMs });
    if (!this.visible) this.advanceQueue();
  }

  hide(): void {
    this.queue = [];
    this.remainingMs = 0;
    this.el.classList.remove('mbar--visible');
    this.el.hidden = true;
  }

  update(dt: number): void {
    if (!this.visible) return;
    this.remainingMs -= dt * 1000;
    if (this.remainingMs <= 0) this.advanceQueue();
  }

  private advanceQueue(): void {
    const next = this.queue.shift();
    if (!next) {
      this.el.classList.remove('mbar--visible');
      this.el.hidden = true;
      return;
    }
    this.el.hidden = false;
    this.render(next.text);
    this.remainingMs = next.holdMs;
    this.el.classList.add('mbar--visible');
  }

  private render(text: string): void {
    const [first, ...rest] = text.split(' ');
    this.el.innerHTML = `<b>${escapeHtml(first ?? '')}</b>${rest.length ? ` ${escapeHtml(rest.join(' '))}` : ''}`;
  }
}
