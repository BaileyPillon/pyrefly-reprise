import './controls-hint.css';
import type { InputSnapshot } from '../../app/Input.ts';
import { escapeHtml } from './html.ts';

/** One hint entry, worded per input device so a gamepad player never sees "Enter". */
export interface ControlHintItem {
  label: string;
  keyboard: string;
  gamepad: string;
  /** Defaults to the keyboard wording. */
  pointer?: string;
}

export interface ControlsHintOptions {
  root: HTMLElement;
  items?: ControlHintItem[];
}

/** The small "Arrows navigate - Enter confirm" strip shared by the chapter-select/results/cutscene screens. */
export class ControlsHint {
  readonly el: HTMLElement;
  private items: ControlHintItem[];
  private lastDevice: InputSnapshot['lastDevice'] | null = null;
  private mounted = false;

  constructor(private readonly opts: ControlsHintOptions) {
    this.items = opts.items ?? [];
    this.el = document.createElement('div');
    this.el.className = 'chint';
    this.el.dataset['role'] = 'controls-hint';
    this.render('keyboard');
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

  setItems(items: ControlHintItem[]): void {
    this.items = items;
    this.lastDevice = null; // force a re-render even if the device hasn't changed
    this.render('keyboard');
  }

  /** Call once per frame (or from `handleInput`) so wording follows whichever device the player last touched. */
  handleInput(input: InputSnapshot): void {
    if (input.lastDevice === this.lastDevice) return;
    this.render(input.lastDevice);
  }

  private render(device: InputSnapshot['lastDevice']): void {
    this.lastDevice = device;
    const html = this.items
      .map((item) => {
        const keys = device === 'gamepad' ? item.gamepad : device === 'pointer' ? (item.pointer ?? item.keyboard) : item.keyboard;
        return `<span class="chint__item"><b>${escapeHtml(keys)}</b> ${escapeHtml(item.label)}</span>`;
      })
      .join('<span class="chint__sep">&middot;</span>');
    this.el.innerHTML = html;
  }
}
