import type { AnyCombatant, AtbSnapshot, AvailableCommand, Command, CombatantId, TurnPreview } from '../../battle/common/types.ts';
import {
  buildTopRows,
  computeMenuWindow,
  firstEnabledCmdIndex,
  firstEnabledIndex,
  reticleKind,
  resolveTargetMode,
  rowEnabled,
  switchRowIndex,
  switchTargetId,
  type TopGroupRow,
  type TopRow,
} from './CommandMenuLogic.ts';
import type { Projector } from './DamageNumbers.ts';
import { portraitChipHtml, tintFor, wirePortraitFallbacks } from './portraits.ts';
import { setMenuOwnsCancel } from '../common/menuCancel.ts';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';
import { TargetCursor, type TargetEntry } from './TargetCursor.ts';

export { buildTopRows, computeMenuWindow, resolveTargetMode, switchTargetId } from './CommandMenuLogic.ts';
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

/** Keeps `.ig-cmd__ready`'s layout role (it is what pushes the tag right). */
function badgeHtml(badge: RowBadge | undefined): string {
  if (!badge) return '';
  const cls = `ig-cmd__ready ffx-cmd__badge ffx-cmd__badge--${badge.kind}`;
  const body = badge.kind === 'mp' ? `${escapeHtml(badge.text)}<i>MP</i>` : escapeHtml(badge.text);
  return `<span class="${cls}">${body}</span>`;
}

/**
 * Right-aligned tag on a row. `kind` drives the styling, because the same
 * glyph height that reads fine as ivory-on-ink "READY" was illegible as a
 * bare MP numeral on the ivory/gold row faces (`.ffx-cmd__badge*` in
 * ffx-hud.css re-colours it per state and prints the MP unit, so "8" can
 * never be mistaken for an item count).
 */
interface RowBadge {
  kind: 'mp' | 'ready' | 'count';
  text: string;
}

interface RowVM {
  label: string;
  enabled: boolean;
  overdrive: boolean;
  trigger: boolean;
  /** A group row: draws the "opens a list" chevron. */
  group: boolean;
  badge?: RowBadge;
  /** Portrait chip for a reserve member in the Switch list. */
  portrait?: { key: string | undefined; name: string };
}

function topRowVM(row: TopRow): RowVM {
  if (row.kind === 'direct') {
    const isTrigger = row.cmd.command.kind === 'trigger';
    const badge = isTrigger ? triggerBadge(row.cmd) : mpBadge(row.cmd);
    return {
      label: row.cmd.label,
      enabled: row.cmd.enabled,
      overdrive: false,
      trigger: isTrigger,
      group: false,
      ...(badge ? { badge } : {}),
    };
  }
  const overdrive = row.category === 'overdrive';
  const enabled = rowEnabled(row);
  const badge: RowBadge | undefined = overdrive
    ? enabled
      ? { kind: 'ready', text: 'READY' }
      : undefined
    : { kind: 'count', text: `×${row.items.length}` };
  return {
    label: row.label,
    enabled,
    overdrive,
    trigger: false,
    group: true,
    ...(badge ? { badge } : {}),
  };
}

function subRowVM(cmd: AvailableCommand, group: TopGroupRow, combatants: Record<CombatantId, AnyCombatant>): RowVM {
  const badge = mpBadge(cmd);
  const vm: RowVM = {
    label: cmd.label,
    enabled: cmd.enabled,
    overdrive: cmd.category === 'overdrive',
    trigger: false,
    group: false,
    ...(badge ? { badge } : {}),
  };
  if (group.role !== 'switch') return vm;
  const benched = switchTargetId(cmd);
  const c = benched ? combatants[benched] : undefined;
  return { ...vm, portrait: { key: c?.portraitKey, name: c?.name ?? cmd.label } };
}

function groupHelp(row: TopGroupRow): string {
  return row.role === 'switch'
    ? 'Swap in a reserve member (L1 / Q). The member coming in takes this turn.'
    : `Open the ${row.label} menu.`;
}

function mpBadge(cmd: AvailableCommand): RowBadge | undefined {
  return cmd.mpCost > 0 ? { kind: 'mp', text: String(cmd.mpCost) } : undefined;
}

function triggerBadge(cmd: AvailableCommand): RowBadge | undefined {
  const extra = (cmd.command as { extra?: Record<string, unknown> }).extra;
  const remaining = typeof extra?.['chargesRemaining'] === 'number' ? (extra['chargesRemaining'] as number) : null;
  return remaining === null ? undefined : { kind: 'count', text: `×${remaining}` };
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

  private stateValue: 'top' | 'sub' | 'target' = 'top';

  /**
   * Accessor rather than a plain field so that **every** transition publishes
   * whether Esc currently belongs to this menu — `setMenuOwnsCancel`, which
   * `BattleScreen.canPauseOnCancel` reads to decide if Esc may open the pause.
   *
   * A field plus a call at each assignment would have missed one: `openTarget`
   * sets `'target'` and goes straight to the reticle without touching
   * `renderStack()`, so publishing from the renderer would have left Esc
   * looking free while the player was mid-targeting.
   */
  private get state(): 'top' | 'sub' | 'target' {
    return this.stateValue;
  }

  private set state(value: 'top' | 'sub' | 'target') {
    this.stateValue = value;
    setMenuOwnsCancel(value !== 'top');
  }

  private suspended = false;
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
    // Clicking a reticle (any candidate, not only the keyboard-highlighted
    // one) selects it and confirms through the exact same path Enter does —
    // mouse and keyboard can never resolve a different Command this way.
    this.targetCursor.setOnClick((id) => this.tryConfirmTargetById(id));
  }

  setProjector(project: Projector): void {
    this.targetCursor.setProjector(project);
  }

  open(opts: CommandMenuOpenOptions): Promise<Command> {
    // A menu still pending here lost the `Promise.race` in
    // `BattlePresenter.chooseCommand` (an `autoBattle()` strategy answered for
    // the player) and its promise was abandoned. Drop its input hooks before
    // the new one attaches its own.
    if (this.resolve) {
      this.watcher.detach();
      this.unwireClicks?.();
      this.resolve = null;
    }
    this.suspended = false;
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
    this.suspended = false;
    // No menu is open any more, so Esc is nobody's back button until the next
    // one opens. Without this a decision taken from a submenu would leave the
    // flag true and Esc dead for the rest of the battle.
    setMenuOwnsCancel(false);
    this.watcher.detach();
    this.unwireClicks?.();
    this.targetCursor.hide();
    this.stackEl.hidden = true;
    this.breadcrumbEl.hidden = true;
    // The decision is over: the stack, its breadcrumb *and* its help line all
    // go with it. Leaving the help line up was how "Open the White Magic
    // menu." stayed on screen through the boss's answering attack
    // (docs/screenshots/47-boss-attack.png).
    this.opts?.setHelp('');
    this.opts?.previewRank(null);
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(command);
  }

  // --------------------------------------------------------------- suspend

  /**
   * Take an open menu off screen because the decision it belongs to is no
   * longer the player's — an `action-start` is resolving, so either the
   * command was already submitted or a strategy answered for the player
   * (`BattlePresenter.chooseCommand` races the HUD promise against
   * `setAutoPlay`'s pick and simply abandons the loser). Before this, the
   * stack and its help line sat over the boss's answering attack
   * (docs/screenshots/47-boss-attack.png).
   *
   * Deliberately reversible rather than a teardown: the promise may still be
   * the one thing the presenter is waiting on, so the watcher stays attached
   * and the next button press brings the menu straight back instead of
   * deadlocking the fight. Targeting is left alone — a reticle on screen
   * means the player is mid-decision either way.
   */
  suspend(): void {
    if (!this.resolve || this.suspended || this.state === 'target') return;
    this.suspended = true;
    this.stackEl.hidden = true;
    this.breadcrumbEl.hidden = true;
    this.opts?.setHelp('');
  }

  private resume(): boolean {
    if (!this.suspended) return false;
    this.suspended = false;
    this.stackEl.hidden = false;
    this.breadcrumbEl.hidden = this.state !== 'sub';
    this.renderStack();
    this.updateHelpAndPreview();
    return true;
  }

  // ------------------------------------------------------------------- input

  private onButton(b: UiButton): void {
    if (this.resume()) return;
    if (this.state === 'target') return this.onTargetButton(b);
    if (this.state === 'sub') return this.onSubButton(b);
    return this.onTopButton(b);
  }

  private onTopButton(b: UiButton): void {
    if (b === 'up' || b === 'down') {
      this.moveTop(b === 'up' ? -1 : 1);
    } else if (b === 'confirm') {
      this.chooseTop(this.topIndex);
    } else if (b === 'l1' || b === 'r1' || b === 'triangle') {
      // Party swap is its own affordance, not a verb in the list: L1/LB opens
      // it in FFX [visual-bible §3.3, "The Switch flow", verified], and the
      // roster strip's own marker is the triangle. Both jump straight to the
      // Switch row's reserve list; the row itself stays for mouse players.
      this.openSwitchList();
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
      // usable Overdrive move). The reserve list is the exception: a swap
      // always shows who is coming in, even with one member benched.
      if (row.items.length === 1 && row.role !== 'switch') {
        this.resolveCommand(row.items[0]!);
        return;
      }
      this.openGroup(i, row);
      return;
    }
    this.resolveCommand(row.cmd);
  }

  private openGroup(i: number, row: TopGroupRow): void {
    this.topIndex = i;
    this.state = 'sub';
    this.subIndex = firstEnabledCmdIndex(row.items);
    this.breadcrumbEl.hidden = false;
    this.breadcrumbEl.textContent = row.label;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  /** L1 / triangle from the top level: straight into the reserve list. */
  private openSwitchList(): void {
    const i = switchRowIndex(this.rows);
    const row = i >= 0 ? this.rows[i] : undefined;
    if (!row || row.kind !== 'group' || !rowEnabled(row)) return this.shake();
    this.openGroup(i, row);
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

  /**
   * Lets another click surface (the CTB tile of the combatant being aimed
   * at) confirm a target through this same path, without exposing `state`/
   * `pendingCmd` to callers. A no-op — returns `false` — outside targeting or
   * for an id that isn't a current candidate.
   */
  tryConfirmTargetById(id: CombatantId): boolean {
    if (this.state !== 'target') return false;
    if (!this.targetCursor.setActiveById(id)) return false;
    this.confirmTarget();
    return true;
  }

  // ------------------------------------------------------------------ render

  private renderStack(): void {
    if (this.state === 'sub') {
      const group = this.rows[this.topIndex];
      if (group?.kind === 'group') {
        const combatants = this.opts?.combatants ?? {};
        this.renderRows(
          group.items.map((cmd) => subRowVM(cmd, group, combatants)),
          this.subIndex,
        );
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
          vm.portrait ? 'ffx-cmd--member' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const cursor = selected ? CURSOR_SVG : '';
        const face = vm.portrait
          ? `<span class="ffx-cmd__face">${portraitChipHtml(vm.portrait.key, vm.portrait.name, tintFor('party'))}</span>`
          : '';
        const chevron = vm.group ? '<span class="ffx-cmd__chev" aria-hidden="true">▸</span>' : '';
        return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${localI})" data-ui-action="${i}">${cursor}${face}<span class="ffx-cmd__label">${escapeHtml(vm.label)}</span>${chevron}${badgeHtml(vm.badge)}</div>`;
      })
      .join('');
    const moreAbove = start > 0 ? '<div class="ffx-cmd-more">▲</div>' : '';
    const moreBelow = end < vms.length ? '<div class="ffx-cmd-more">▼</div>' : '';
    this.stackEl.innerHTML = moreAbove + rows + moreBelow;
    wirePortraitFallbacks(this.stackEl);
  }

  private updateHelpAndPreview(): void {
    if (!this.opts) return;
    if (this.state === 'top') {
      const row = this.rows[this.topIndex];
      const cmd = row?.kind === 'direct' ? row.cmd : null;
      this.opts.setHelp(cmd?.help ?? cmd?.disabledReason ?? (row?.kind === 'group' ? groupHelp(row) : ''));
      this.opts.previewRank(cmd);
      return;
    }
    if (this.state === 'sub') {
      const group = this.rows[this.topIndex];
      const cmd = group?.kind === 'group' ? group.items[this.subIndex] : null;
      const swap = group?.kind === 'group' && group.role === 'switch' && cmd ? `${cmd.label} takes this turn on entering the fight.` : null;
      this.opts.setHelp(cmd?.help ?? swap ?? cmd?.disabledReason ?? '');
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
