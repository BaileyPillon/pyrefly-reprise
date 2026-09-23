import type { AbilityCategory, AnyCombatant, AvailableCommand, Command, CombatantId, Targeting } from '../../battle/common/types.ts';
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
const DIRECT_KINDS = new Set<Command['kind']>(['attack', 'escape', 'trigger', 'dismiss']);

/** Label of the synthetic group that holds every `switch` command. */
export const SWITCH_LABEL = 'Switch';

export interface TopDirectRow {
  kind: 'direct';
  cmd: AvailableCommand;
}
export interface TopGroupRow {
  kind: 'group';
  category: AbilityCategory;
  label: string;
  items: AvailableCommand[];
  /**
   * `'switch'` marks the synthetic reserve-list group. It is not an ability
   * category, and unlike a real one-entry group it always opens its list (a
   * party swap must show *who* is coming in, even with one member benched).
   */
  role?: 'switch';
}
export type TopRow = TopDirectRow | TopGroupRow;

/**
 * Canonical FFX top-level order [visual-bible §3.3, "Default command set"]:
 * Attack, the character command (Skill / Special), White Magic, Black Magic,
 * Item, Overdrive when the gauge is full, Summon for Yuna. Anything the
 * engine emits that isn't in the table keeps its engine order in the middle
 * of the list; Switch is always last because it is an affordance on the party
 * rather than an action on the field.
 */
const TOP_ORDER: Record<string, number> = {
  'kind:trigger': 0,
  'kind:attack': 1,
  skill: 2,
  special: 2,
  whitemagic: 3,
  blackmagic: 4,
  item: 5,
  overdrive: 6,
  summon: 7,
  aeon: 8,
  'kind:escape': 9,
  'kind:dismiss': 9,
  'role:switch': 10,
};
const ORDER_FALLBACK = 8.5;

function orderKey(row: TopRow): number {
  if (row.kind === 'direct') return TOP_ORDER[`kind:${row.cmd.command.kind}`] ?? ORDER_FALLBACK;
  if (row.role === 'switch') return TOP_ORDER['role:switch']!;
  return TOP_ORDER[row.category] ?? ORDER_FALLBACK;
}

/**
 * Groups the engine's flat `AvailableCommand[]` into the command window's
 * top-level rows [visual-bible §3.3]: a command whose `Command.kind` is
 * self-contained (Attack, Escape, Trigger, Dismiss) is its own row;
 * everything else (abilities, items, Overdrives, Summon) is bucketed by
 * `category` into a submenu. Two deliberate departures from a plain pass over
 * the engine's list:
 *
 * * **No Defend row.** FFX's command window is Attack / the character command
 *   / White Magic / Black Magic / Item / Overdrive / Summon — Defend is a
 *   base *action* (`ffx-combat-core` §1.3 ranks it 2, §4.2 defines its
 *   status) reached by an affordance, not a row in the list, and it never
 *   appears among the character skill lists of §7. The engine keeps emitting
 *   it (the `'defend'` auto-battle strategy in `BattlePresenterStrategies`
 *   picks it straight off `AvailableCommand[]`); the menu simply doesn't
 *   list it.
 * * **One Switch row.** The engine emits one `switch` command *per benched
 *   member*, which surfaced as bare name rows ("Auron") sitting among the
 *   verbs. They collapse into a single `Switch` group whose submenu is the
 *   reserve list, matching §3.3's "roster strip ... all seven characters
 *   appear as portraits" swap flow.
 */
export function buildTopRows(commands: AvailableCommand[]): TopRow[] {
  const rows: TopRow[] = [];
  const groups = new Map<string, TopGroupRow>();
  let switchGroup: TopGroupRow | null = null;
  for (const cmd of commands) {
    if (cmd.command.kind === 'defend') continue;
    if (cmd.command.kind === 'switch') {
      if (!switchGroup) {
        switchGroup = { kind: 'group', category: cmd.category, label: SWITCH_LABEL, items: [], role: 'switch' };
        rows.push(switchGroup);
      }
      switchGroup.items.push(cmd);
      continue;
    }
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
  // Stable by construction: `Array.prototype.sort` is specified stable, so
  // rows sharing an order key (Skill/Special, or anything unlisted) keep the
  // engine's own ordering.
  return rows.sort((a, b) => orderKey(a) - orderKey(b));
}

/** The benched member a `switch` command would bring in, for its portrait. */
export function switchTargetId(cmd: AvailableCommand): CombatantId | null {
  const extra = (cmd.command as { extra?: Record<string, unknown> }).extra;
  const inId = extra?.['inId'];
  return typeof inId === 'string' ? inId : null;
}

/** Index of the synthetic Switch group, or -1 — the L1/triangle affordance's jump target. */
export function switchRowIndex(rows: TopRow[]): number {
  return rows.findIndex((r) => r.kind === 'group' && r.role === 'switch');
}

export type TargetResolution =
  | { mode: 'none'; targets: CombatantId[] }
  | { mode: 'auto'; targets: CombatantId[] }
  | { mode: 'choose'; candidates: CombatantId[] }
  /** The command hits every one of these; the player confirms rather than picks. */
  | { mode: 'all'; targets: CombatantId[] };

/** Targeting values that hit everything they are legal against. */
const HITS_EVERYTHING = new Set<Targeting>(['all-enemies', 'all-allies', 'all']);

/**
 * Whether a chosen row still needs the player to pick a target — and, when it
 * does not, whether it lands on one target or on all of them.
 *
 * Assumption (undocumented by the engine contract, called out in
 * `docs/CONTRACT-CHANGES.md`): `AvailableCommand.command.targets` arrives
 * already resolved (non-empty) for anything the player does not choose —
 * self, random-* — and empty when the player must pick one of `validTargets`.
 *
 * The `'all'` case is new, and it is the defect in Bailey's Chapter 3 frame.
 * A party-wide cast (Hastega, a Mega-Potion, an all-enemy Overdrive) arrives
 * with an empty `command.targets` and three `validTargets`, which is exactly
 * what "pick one of these three" looks like — so the menu asked Tidus which
 * ally to Hastega, put a hairline bracket over one of them, and the engine
 * then (correctly) buffed all three. `AvailableCommand.targeting` is what
 * tells the two apart; when it is absent the old behaviour stands.
 *
 * GAME-AWARE (AGENTS.md rule 14): **both games.** Party-wide and all-enemy
 * commands exist in FFX (Hastega, Holy Water, an aeon's Overdrive) and in
 * FFX-2 (Cura on the party, Trigger Happy's spread), the menu logic is shared,
 * and this is a display bug in shared plumbing (critic CHK-020). Both engines
 * now publish `targeting`.
 */
export function resolveTargetMode(cmd: AvailableCommand): TargetResolution {
  if (cmd.command.targets.length > 0) return { mode: 'none', targets: cmd.command.targets };
  if (cmd.validTargets.length === 0) return { mode: 'none', targets: [] };
  if (cmd.targeting && HITS_EVERYTHING.has(cmd.targeting)) {
    return { mode: 'all', targets: cmd.validTargets };
  }
  if (cmd.validTargets.length === 1) return { mode: 'auto', targets: cmd.validTargets };
  return { mode: 'choose', candidates: cmd.validTargets };
}

/**
 * The second step of a **wrapper** row (`AvailableCommand.wrapsCategory`): the
 * list it opens, as a group the stack can render like any other submenu.
 *
 * FFX's Doublecast is the one shipped wrapper. §7.4 row 41 of
 * `research/ffx-combat-core.md` defines it as *"Two Blk Magic casts at a fixed
 * rank 3"*, so choosing it has to ask which Black Magic spell, and then that
 * spell's own target step asks where. Before this the menu read the row's
 * self-only `validTargets` as a finished aim (`resolveTargetMode` → `auto`)
 * and submitted `{ id: 'doublecast', targets: ['lulu'] }`: Firaga twice on
 * Lulu [critic round 09, PR-0125].
 *
 * The rows are the engine's own rows of that category, so each keeps its
 * `enabled`, `disabledReason` (Silenced, Not enough MP), `validTargets` and
 * `targeting` — the UI still never re-derives legality. `null` for a row that
 * wraps nothing.
 *
 * **FFX only** [AGENTS.md rule 14]: only the FFX engine publishes a wrapper row.
 */
export function wrappedGroup(wrapper: AvailableCommand, commands: readonly AvailableCommand[]): TopGroupRow | null {
  const category = wrapper.wrapsCategory;
  if (!category || wrapper.command.kind !== 'ability') return null;
  const items = commands.filter(
    (c) => c !== wrapper && c.category === category && c.command.kind === 'ability' && !c.wrapsCategory,
  );
  return { kind: 'group', category, label: wrapper.label, items };
}

/**
 * The command a wrapper submits once its wrapped row and that row's targets are
 * chosen: the wrapper's own id, the chosen row's id as `wrappedId`, and the
 * chosen targets — the shape `battle/ffx/doublecast.ts` reads and the Chapter 3
 * tactic already submits.
 */
export function wrapCommand(wrapper: AvailableCommand, chosen: AvailableCommand, targets: CombatantId[]): Command {
  if (wrapper.command.kind !== 'ability' || chosen.command.kind !== 'ability') {
    return { ...chosen.command, targets } as Command;
  }
  return { kind: 'ability', id: wrapper.command.id, wrappedId: chosen.command.id, targets };
}

/** The help line for a row inside a wrapper's list: what the wrapper adds, then the row. */
export function wrappedHelp(wrapper: AvailableCommand, rowHelp: string): string {
  const lead = `${wrapper.label}: cast twice, each cast pays its own MP`;
  return rowHelp ? `${lead} · ${rowHelp}` : lead;
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
