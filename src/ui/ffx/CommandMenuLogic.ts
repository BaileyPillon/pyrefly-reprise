import type { AbilityCategory, AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import type { ReticleKind } from './TargetCursor.ts';

const CATEGORY_LABEL: Partial<Record<AbilityCategory, string>> = {
  attack: 'Attack',
  skill: 'Skill',
  special: 'Special',
  blackmagic: 'Black Magic',
  whitemagic: 'White Magic',
  summon: 'Summon',
  overdrive: 'Overdrive',
  aeon: 'Aeon',
  item: 'Items',
};

/** Command kinds that resolve on their own — never a list of abilities to pick from. */
const DIRECT_KINDS = new Set<Command['kind']>(['attack', 'defend', 'switch', 'escape', 'trigger', 'dismiss']);

export interface TopDirectRow {
  kind: 'direct';
  cmd: AvailableCommand;
}
export interface TopGroupRow {
  kind: 'group';
  category: AbilityCategory;
  label: string;
  items: AvailableCommand[];
}
export type TopRow = TopDirectRow | TopGroupRow;

/**
 * Groups the engine's flat `AvailableCommand[]` into the command window's
 * top-level rows [visual-bible §3.3]: a command whose `Command.kind` is
 * self-contained (Attack, Defend, Switch, Escape, Talk, Dismiss) is its own
 * row; everything else (abilities, items, Overdrives, Summon) is bucketed by
 * `category` into a submenu, in first-seen order, so the engine's own
 * ordering drives the menu layout with no UI-side re-derivation.
 */
export function buildTopRows(commands: AvailableCommand[]): TopRow[] {
  const rows: TopRow[] = [];
  const groups = new Map<string, TopGroupRow>();
  for (const cmd of commands) {
    if (DIRECT_KINDS.has(cmd.command.kind)) {
      rows.push({ kind: 'direct', cmd });
      continue;
    }
    let group = groups.get(cmd.category);
    if (!group) {
      group = { kind: 'group', category: cmd.category, label: CATEGORY_LABEL[cmd.category] ?? capitalize(cmd.category), items: [] };
      groups.set(cmd.category, group);
      rows.push(group);
    }
    group.items.push(cmd);
  }
  return rows;
}

export type TargetResolution =
  | { mode: 'none'; targets: CombatantId[] }
  | { mode: 'auto'; targets: CombatantId[] }
  | { mode: 'choose'; candidates: CombatantId[] };

/**
 * Whether a chosen row still needs the player to pick a target.
 *
 * Assumption (undocumented by the engine contract, called out in
 * `docs/CONTRACT-CHANGES.md`): `AvailableCommand.command.targets` arrives
 * already resolved (non-empty) for anything the player does not choose —
 * self, all-enemies, all-allies, random-* — and empty when the player must
 * pick one of `validTargets`.
 */
export function resolveTargetMode(cmd: AvailableCommand): TargetResolution {
  if (cmd.command.targets.length > 0) return { mode: 'none', targets: cmd.command.targets };
  if (cmd.validTargets.length === 0) return { mode: 'none', targets: [] };
  if (cmd.validTargets.length === 1) return { mode: 'auto', targets: cmd.validTargets };
  return { mode: 'choose', candidates: cmd.validTargets };
}

export function reticleKind(targetId: CombatantId, actorId: CombatantId, combatants: Record<CombatantId, AnyCombatant>): ReticleKind {
  if (targetId === actorId) return 'self';
  const c = combatants[targetId];
  return c?.side === 'enemy' ? 'enemy' : 'ally';
}

export function rowEnabled(row: TopRow): boolean {
  if (row.kind === 'direct') return row.cmd.enabled;
  return row.items.some((i) => i.enabled);
}

export function firstEnabledIndex(rows: TopRow[]): number {
  const i = rows.findIndex(rowEnabled);
  return i >= 0 ? i : 0;
}

export function firstEnabledCmdIndex(items: AvailableCommand[]): number {
  const i = items.findIndex((c) => c.enabled);
  return i >= 0 ? i : 0;
}

function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export interface MenuWindow {
  /** Index of the first row rendered, inclusive. */
  start: number;
  /** Index one past the last row rendered, exclusive. */
  end: number;
}

/**
 * Which slice of a (possibly long) row list to render so the selected row is
 * always visible without showing every row at once — real ability lists run
 * well past what the 640x360 stage can show in one screen (`docs/handoff/
 * presentation-ink-and-gold.md` sets no fixed panel height for `.ig-cmd-
 * stack`, unlike the old boxed FFX command window). Centers the selection
 * within the window when there's room on both sides, clamped to the ends —
 * a smooth scrolling window rather than discrete pages, so arrow-key
 * navigation never jumps.
 */
export function computeMenuWindow(total: number, selectedIndex: number, maxVisible: number): MenuWindow {
  if (total <= maxVisible) return { start: 0, end: total };
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(0, Math.min(selectedIndex - half, total - maxVisible));
  return { start, end: start + maxVisible };
}
