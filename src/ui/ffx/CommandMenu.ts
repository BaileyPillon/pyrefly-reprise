import type { AnyCombatant, AtbSnapshot, AvailableCommand, Command, CombatantId, TurnPreview } from '../../battle/common/types.ts';
import {
  buildTopRows,
  computeMenuWindow,
  firstEnabledCmdIndex,
  firstEnabledIndex,
  reticleKind,
  resolveTargetMode,
  rowEnabled,
  type TopGroupRow,
  type TopRow,
} from './CommandMenuLogic.ts';
import type { Projector } from './DamageNumbers.ts';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';
import { TargetCursor, type TargetEntry } from './TargetCursor.ts';

export { buildTopRows, computeMenuWindow, resolveTargetMode } from './CommandMenuLogic.ts';
export type { MenuWindow, TargetResolution, TopDirectRow, TopGroupRow, TopRow } from './CommandMenuLogic.ts';

/** Ink & Gold sets no fixed panel height for `.ig-cmd-stack` (unlike the old
 * boxed FFX command window) -- with real ability lists now landing, a group
 * can run well past what the 640x360 stage can show at once, so only a
 * window of rows renders at a time (`computeMenuWindow`). */
const MAX_VISIBLE_ROWS = 6;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** `.ig-cmd__cursor`'s inline SVG, per `slabs.css`'s comment on that class. */
const CURSOR_SVG = '<svg class="ig-cmd__cursor" viewBox="0 0 12 16" aria-hidden="true"><path d="M1 1 L11 8 L1 15 Z" fill="#0B0A12"/></svg>';

interface RowVM {
  label: string;
  enabled: boolean;
  overdrive: boolean;
  trigger: boolean;
  /** Right-aligned tag: "READY" for a full Overdrive, an MP cost, an item count, or a charge count. */
  badge?: string;
}

function topRowVM(row: TopRow): RowVM {
  if (row.kind === 'direct') {
    const isTrigger = row.cmd.command.kind === 'trigger';
    return {
      label: row.cmd.label,
      enabled: row.cmd.enabled,
      overdrive: false,
      trigger: isTrigger,
      badge: isTrigger ? triggerBadge(row.cmd) : row.cmd.mpCost > 0 ? String(row.cmd.mpCost) : undefined,
    };
  }
  const overdrive = row.category === 'overdrive';
  const enabled = rowEnabled(row);
  return {
    label: row.label,
    enabled,
    overdrive,
    trigger: false,
    badge: overdrive ? (enabled ? 'READY' : undefined) : String(row.items.length),
  };
}

function subRowVM(cmd: AvailableCommand): RowVM {
  return {
    label: cmd.label,
    enabled: cmd.enabled,
    overdrive: cmd.category === 'overdrive',
    trigger: false,
    badge: cmd.mpCost > 0 ? String(cmd.mpCost) : undefined,
  };
}

function triggerBadge(cmd: AvailableCommand): string | undefined {
  const extra = (cmd.command as { extra?: Record<string, unknown> }).extra;
  const remaining = typeof extra?.['chargesRemaining'] === 'number' ? (extra['chargesRemaining'] as number) : null;
  return remaining === null ? undefined : `×${remaining}`;
}

export interface CommandMenuOpenOptions {
  actorId: CombatantId;
  commands: AvailableCommand[];
  previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot;
  combatants: Record<CombatantId, AnyCombatant>;
  setHelp: (text: string) => void;
}

/**
 * Command stack, restyled onto Ink & Gold's `.ig-cmd-stack`/`.ig-cmd`
 * (`src/ui/inkgold/slabs.css`, spec "Components" > "Command stack"): a
 * single cascading ivory stack rather than the old two-panel top+submenu
 * layout -- the mockups (`A-ink-and-gold-battle.jpg`) show one list where
 * choosing a category (Skill, Magic...) replaces the stack's own contents,
 * not a second panel beside it. A group with exactly one enabled entry
 * (most characters' single Overdrive move) resolves straight from the top
 * level instead of opening a one-item stack, matching the mock's flat
 * "OVERDRIVE -- READY" row.
 */
export class CommandMenu {
  readonly stackEl: HTMLElement;
  readonly breadcrumbEl: HTMLElement;
  readonly targetCursor = new TargetCursor();

  private state: 'top' | 'sub' | 'target' = 'top';
  private rows: TopRow[] = [];
  private topIndex = 0;
  private subIndex = 0;
  private preTargetState: 'top' | 'sub' = 'top';
  private opts: CommandMenuOpenOptions | null = null;
  private resolve: ((cmd: Command) => void) | null = null;
  private readonly watcher = new RawInputWatcher((b) => this.onButton(b));
  private unwireClicks: (() => void) | null = null;

  constructor() {
    this.stackEl = document.createElement('div');
    this.stackEl.className = 'ig-cmd-stack';
    this.stackEl.hidden = true;
    this.breadcrumbEl = document.createElement('div');
    this.breadcrumbEl.className = 'ffx-cmd-breadcrumb';
    this.breadcrumbEl.hidden = true;
  }

  setProjector(project: Projector): void {
    this.targetCursor.setProjector(project);
  }

  open(opts: CommandMenuOpenOptions): Promise<Command> {
    this.opts = opts;
    this.rows = buildTopRows(opts.commands);
    this.topIndex = firstEnabledIndex(this.rows);
    this.subIndex = 0;
    this.state = 'top';
    this.stackEl.hidden = false;
    this.watcher.attach();
    this.unwireClicks = wireClicks(this.stackEl, (action) => this.onAction(action));
    this.renderStack();
    this.updateHelpAndPreview();
    return new Promise<Command>((resolve) => {
      this.resolve = resolve;
    });
  }

  private finish(command: Command): void {
    this.watcher.detach();
    this.unwireClicks?.();
    this.targetCursor.hide();
    this.stackEl.hidden = true;
    this.breadcrumbEl.hidden = true;
    this.opts?.previewRank(null);
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(command);
  }

  // ------------------------------------------------------------------- input

  private onButton(b: UiButton): void {
    if (this.state === 'target') return this.onTargetButton(b);
    if (this.state === 'sub') return this.onSubButton(b);
    return this.onTopButton(b);
  }

  private onTopButton(b: UiButton): void {
    if (b === 'up' || b === 'down') {
      this.moveTop(b === 'up' ? -1 : 1);
    } else if (b === 'confirm') {
      this.chooseTop(this.topIndex);
    }
  }

  private onSubButton(b: UiButton): void {
    const group = this.rows[this.topIndex];
    if (group?.kind !== 'group') return;
    if (b === 'up' || b === 'down') {
      this.moveSub(group, b === 'up' ? -1 : 1);
    } else if (b === 'confirm') {
      this.chooseSub(group, this.subIndex);
    } else if (b === 'cancel') {
      this.state = 'top';
      this.breadcrumbEl.hidden = true;
      this.renderStack();
      this.updateHelpAndPreview();
    }
  }

  private onTargetButton(b: UiButton): void {
    if (b === 'left' || b === 'up') {
      this.targetCursor.setActiveIndex(this.targetCursor.index - 1);
      this.updateTargetHelp(this.targetCursor.activeEntry);
    } else if (b === 'right' || b === 'down') {
      this.targetCursor.setActiveIndex(this.targetCursor.index + 1);
      this.updateTargetHelp(this.targetCursor.activeEntry);
    } else if (b === 'confirm') {
      this.confirmTarget();
    } else if (b === 'cancel') {
      this.targetCursor.hide();
      this.state = this.preTargetState;
      this.renderStack();
      this.updateHelpAndPreview();
    }
  }

  // ------------------------------------------------------------------ top

  private moveTop(dir: 1 | -1): void {
    if (!this.rows.length) return;
    let i = this.topIndex;
    for (let n = 0; n < this.rows.length; n++) {
      i = (i + dir + this.rows.length) % this.rows.length;
      if (rowEnabled(this.rows[i]!)) break;
    }
    this.topIndex = i;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  private onAction(action: string): void {
    const i = Number(action);
    if (Number.isNaN(i)) return;
    if (this.state === 'sub') {
      const group = this.rows[this.topIndex];
      if (group?.kind !== 'group') return;
      this.subIndex = i;
      this.renderStack();
      this.updateHelpAndPreview();
      this.chooseSub(group, i);
      return;
    }
    this.topIndex = i;
    this.renderStack();
    this.updateHelpAndPreview();
    this.chooseTop(i);
  }

  private chooseTop(i: number): void {
    const row = this.rows[i];
    if (!row) return;
    if (!rowEnabled(row)) return this.shake();
    if (row.kind === 'group') {
      // A single enabled choice needs no submenu hop -- matches the mock's
      // flat "OVERDRIVE -- READY" row (most characters have exactly one
      // usable Overdrive move).
      if (row.items.length === 1) {
        this.resolveCommand(row.items[0]!);
        return;
      }
      this.state = 'sub';
      this.subIndex = firstEnabledCmdIndex(row.items);
      this.breadcrumbEl.hidden = false;
      this.breadcrumbEl.textContent = row.label;
      this.renderStack();
      this.updateHelpAndPreview();
      return;
    }
    this.resolveCommand(row.cmd);
  }

  // ------------------------------------------------------------------ sub

  private moveSub(group: TopGroupRow, dir: 1 | -1): void {
    let i = this.subIndex;
    for (let n = 0; n < group.items.length; n++) {
      i = (i + dir + group.items.length) % group.items.length;
      if (group.items[i]!.enabled) break;
    }
    this.subIndex = i;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  private chooseSub(group: TopGroupRow, i: number): void {
    const cmd = group.items[i];
    if (!cmd) return;
    if (!cmd.enabled) return this.shake();
    this.resolveCommand(cmd);
  }

  // -------------------------------------------------------------- targeting

  private pendingCmd: AvailableCommand | null = null;

  private resolveCommand(cmd: AvailableCommand): void {
    const resolution = resolveTargetMode(cmd);
    if (resolution.mode !== 'choose') {
      // Safe by construction: `resolution.targets` is `[]` for every command
      // kind whose own `Command.targets` type is the empty tuple (Defend,
      // Switch, Escape, Dismiss, Summon, Spherechange never offer >0
      // `validTargets`), so the runtime shape always matches `Command` even
      // though the generic spread below cannot express that statically.
      this.finish({ ...cmd.command, targets: resolution.targets } as Command);
      return;
    }
    const combatants = this.opts!.combatants;
    const entries: TargetEntry[] = resolution.candidates.map((id) => ({
      id,
      name: combatants[id]?.name ?? id,
      kind: reticleKind(id, this.opts!.actorId, combatants),
    }));
    this.pendingCmd = cmd;
    this.preTargetState = this.state === 'sub' ? 'sub' : 'top';
    this.state = 'target';
    this.targetCursor.showSingle(entries, 0);
    this.updateTargetHelp(entries[0] ?? null);
  }

  private confirmTarget(): void {
    const id = this.targetCursor.activeTargetId;
    const cmd = this.pendingCmd;
    if (!id || !cmd) return;
    this.targetCursor.hide();
    this.finish({ ...cmd.command, targets: [id] } as Command);
  }

  // ------------------------------------------------------------------ render

  private renderStack(): void {
    if (this.state === 'sub') {
      const group = this.rows[this.topIndex];
      if (group?.kind === 'group') {
        this.renderRows(group.items.map(subRowVM), this.subIndex);
        return;
      }
    }
    this.renderRows(this.rows.map(topRowVM), this.topIndex);
  }

  private renderRows(vms: RowVM[], selectedIndex: number): void {
    const { start, end } = computeMenuWindow(vms.length, selectedIndex, MAX_VISIBLE_ROWS);
    const rows = vms
      .slice(start, end)
      .map((vm, localI) => {
        const i = start + localI;
        const selected = i === selectedIndex;
        const cls = [
          'ig-cmd',
          selected ? 'ig-cmd--selected' : '',
          !vm.enabled ? 'ig-cmd--disabled' : '',
          vm.overdrive ? 'ig-cmd--overdrive' : '',
          vm.trigger ? 'ffx-cmd--trigger' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const cursor = selected ? CURSOR_SVG : '';
        const badge = vm.badge !== undefined ? `<span class="ig-cmd__ready">${escapeHtml(vm.badge)}</span>` : '';
        return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${localI})" data-ui-action="${i}">${cursor}<span>${escapeHtml(vm.label)}</span>${badge}</div>`;
      })
      .join('');
    const moreAbove = start > 0 ? '<div class="ffx-cmd-more">▲</div>' : '';
    const moreBelow = end < vms.length ? '<div class="ffx-cmd-more">▼</div>' : '';
    this.stackEl.innerHTML = moreAbove + rows + moreBelow;
  }

  private updateHelpAndPreview(): void {
    if (!this.opts) return;
    if (this.state === 'top') {
      const row = this.rows[this.topIndex];
      const cmd = row?.kind === 'direct' ? row.cmd : null;
      this.opts.setHelp(cmd?.help ?? cmd?.disabledReason ?? (row?.kind === 'group' ? `Open the ${row.label} menu.` : ''));
      this.opts.previewRank(cmd);
      return;
    }
    if (this.state === 'sub') {
      const group = this.rows[this.topIndex];
      const cmd = group?.kind === 'group' ? group.items[this.subIndex] : null;
      this.opts.setHelp(cmd?.help ?? cmd?.disabledReason ?? '');
      this.opts.previewRank(cmd ?? null);
    }
  }

  private updateTargetHelp(entry: TargetEntry | null): void {
    if (!this.opts || !entry) return;
    const c = this.opts.combatants[entry.id];
    this.opts.setHelp(c?.sensorText ?? entry.name);
  }

  private shake(): void {
    this.stackEl.classList.remove('ffx-cmd-stack--shake');
    void this.stackEl.offsetWidth;
    this.stackEl.classList.add('ffx-cmd-stack--shake');
  }
}
