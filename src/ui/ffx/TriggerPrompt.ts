import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { portraitChipHtml, tintFor, wirePortraitFallbacks } from './portraits.ts';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';

/**
 * The pre-battle Trigger Command prompt [visual-bible §3.12.1]: one row per
 * eligible speaker plus a "say nothing" skip row. `FFXBattleHud` routes here
 * instead of the normal command stack whenever every offered command is a
 * `trigger` (covers both this pre-battle case and BFA's in-battle Talk,
 * though the latter renders inline in the command stack instead -- see
 * `CommandMenu`'s `.ffx-cmd--trigger` styling). Reuses `.ig-cmd-stack`/
 * `.ig-cmd` rather than inventing a bespoke frame for a two-encounter,
 * few-rows-only prompt.
 */
export class TriggerPrompt {
  readonly el: HTMLElement;
  readonly headerEl: HTMLElement;
  private index = 0;
  private commands: AvailableCommand[] = [];
  private resolve: ((c: Command) => void) | null = null;
  private readonly watcher = new RawInputWatcher((b) => this.onButton(b));
  private unwireClicks: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ig-cmd-stack';
    this.el.hidden = true;
    this.headerEl = document.createElement('div');
    this.headerEl.className = 'ffx-cmd-breadcrumb';
    this.headerEl.textContent = 'TRIGGER COMMAND';
    this.headerEl.hidden = true;
  }

  open(commands: AvailableCommand[], combatants: Record<CombatantId, AnyCombatant>): Promise<Command> {
    this.commands = commands;
    this.index = 0;
    this.el.hidden = false;
    this.headerEl.hidden = false;
    this.render(combatants);
    this.watcher.attach();
    this.unwireClicks = wireClicks(this.el, (action) => this.choose(Number(action)));
    return new Promise<Command>((resolve) => {
      this.resolve = resolve;
    });
  }

  private onButton(b: UiButton): void {
    if (b === 'up' || b === 'down') {
      this.index = (this.index + (b === 'up' ? -1 : 1) + this.commands.length) % this.commands.length;
      this.render();
    } else if (b === 'confirm') {
      this.choose(this.index);
    }
  }

  private choose(i: number): void {
    const cmd = this.commands[i];
    if (!cmd) return;
    this.watcher.detach();
    this.unwireClicks?.();
    this.el.hidden = true;
    this.headerEl.hidden = true;
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(cmd.command);
  }

  private render(combatants: Record<CombatantId, AnyCombatant> = {}): void {
    const rows = this.commands
      .map((cmd, i) => {
        const speakerId = cmd.command.targets[0];
        const speaker = speakerId ? combatants[speakerId] : undefined;
        const isSkip = cmd.validTargets.length === 0 && cmd.command.targets.length === 0;
        const face = speaker ? `<span class="ffx-trigger__face">${portraitChipHtml(speaker.portraitKey, speaker.name, tintFor('party'))}</span>` : '';
        const selected = i === this.index;
        const cls = ['ig-cmd', 'ffx-cmd--trigger', selected ? 'ig-cmd--selected' : '', isSkip ? 'ig-cmd--disabled' : ''].filter(Boolean).join(' ');
        const bonus = cmd.help ? `<span class="ig-cmd__ready">${escapeHtml(cmd.help)}</span>` : '';
        return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${i})" data-ui-action="${i}">${face}<span>${escapeHtml(cmd.label)}</span>${bonus}</div>`;
      })
      .join('');
    this.el.innerHTML = rows;
    wirePortraitFallbacks(this.el);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
