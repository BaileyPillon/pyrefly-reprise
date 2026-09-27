/**
 * The FF7 command window as a pure state machine (FF7 only).
 *
 * No DOM: `Ff7CommandMenu.ts` draws whatever state this returns and feeds it
 * key presses and taps. Sources: `docs/plans/ff7-hud-faithful-a-spec.md` §3.5
 * and §5.8 (the official manual's "Battle Commands", tagged there).
 *
 * The four fixed slots [spec §3.2, measured]: **Attack** (or **Limit** while the
 * gauge is full [verified: S1, S3]), **Magic**, **Summon**, **Item**. A command
 * the fighter does not have leaves its slot blank, and the finger skips it
 * (the Guard Scorpion stills show Attack, Magic, blank, Item).
 *
 * How the FF7 engine's `AvailableCommand` rows map onto the slots (the contract
 * for the engine step, `docs/handoff/ff7-hud.md`): `command.kind` `'limit'` ->
 * Limit; `'attack'` -> Attack; `'ability'` in category `'blackmagic'` or
 * `'whitemagic'` -> Magic; `'summon'` (or category `'summon'`) -> Summon;
 * `'item'` -> Item. Any other row is not an FF7 battle command and is ignored.
 *
 * Wait [spec §3.7; S1, S2]: time stops in a submenu and while choosing a
 * target, so {@link menuLevel} reports `'deep'` there and `'top'` on the four
 * slots.
 */

import type { AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';

export type SlotLabel = 'Attack' | 'Limit' | 'Magic' | 'Summon' | 'Item';

export interface Ff7Slot {
  label: SlotLabel;
  rows: AvailableCommand[];
  /** False when every row under it is disabled (drawn grey). */
  enabled: boolean;
}

export type Ff7View = 'top' | 'magic' | 'item' | 'limit' | 'target';
export type SubView = 'magic' | 'item' | 'limit';

export interface Ff7MenuState {
  slots: ReadonlyArray<Ff7Slot | null>;
  view: Ff7View;
  /** Cursor on the four slots. */
  topIdx: number;
  /** Which list is open (or was, under a target step). */
  sub: SubView | null;
  subIdx: number;
  /** The row being aimed. */
  pending: AvailableCommand | null;
  /** Valid targets in on-screen order. */
  targets: CombatantId[];
  targetIdx: number;
  /** An All command: every target is chosen at once. */
  targetAll: boolean;
  /** SELECT's help window is on [spec §3.5]. */
  help: boolean;
}

export type MenuInput = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'help';

export interface StepResult {
  state: Ff7MenuState;
  /** Set when a command is final. */
  done?: Command;
  /** The press did nothing useful (a grey command, a blank): FF7 buzzes [our estimate of the sound, no sound here]. */
  refused?: boolean;
  /** False when the press was not the menu's (cancel on the four slots): the pause may take it. */
  handled: boolean;
}

const MAGIC_CATEGORIES = new Set(['blackmagic', 'whitemagic']);
/** Columns in the Magic list [spec §5.8, our estimate: three]. */
export const MAGIC_COLS = 3;

function slotOf(rows: AvailableCommand[], label: SlotLabel): Ff7Slot | null {
  return rows.length ? { label, rows, enabled: rows.some((r) => r.enabled) } : null;
}

/** The four fixed slots from the engine's rows. */
export function buildSlots(commands: readonly AvailableCommand[]): Array<Ff7Slot | null> {
  const of = (pred: (c: AvailableCommand) => boolean): AvailableCommand[] => commands.filter(pred);
  const limits = of((c) => c.command.kind === 'limit');
  const attack = of((c) => c.command.kind === 'attack');
  const first = limits.length ? slotOf(limits, 'Limit') : slotOf(attack, 'Attack');
  return [
    first,
    slotOf(of((c) => c.command.kind === 'ability' && MAGIC_CATEGORIES.has(c.category)), 'Magic'),
    slotOf(of((c) => c.command.kind === 'summon' || (c.command.kind === 'ability' && c.category === 'summon')), 'Summon'),
    slotOf(of((c) => c.command.kind === 'item'), 'Item'),
  ];
}

/** A fresh menu, the finger on the first command there is. */
export function openMenu(commands: readonly AvailableCommand[]): Ff7MenuState {
  const slots = buildSlots(commands);
  const first = slots.findIndex((s) => s !== null);
  return { slots, view: 'top', topIdx: Math.max(0, first), sub: null, subIdx: 0, pending: null, targets: [], targetIdx: 0, targetAll: false, help: false };
}

/** `'top'` on the four slots, `'deep'` in a list or the target step (Wait stops time there). */
export function menuLevel(state: Ff7MenuState): 'top' | 'deep' {
  return state.view === 'top' ? 'top' : 'deep';
}

/** Rows of the open list. */
export function subRows(state: Ff7MenuState): AvailableCommand[] {
  if (!state.sub) return [];
  const label: SlotLabel = state.sub === 'magic' ? 'Magic' : state.sub === 'item' ? 'Item' : 'Limit';
  return state.slots.find((s) => s?.label === label)?.rows ?? [];
}

/** The row under the finger (a list row, the pending row, or a slot's only row). */
export function highlighted(state: Ff7MenuState): AvailableCommand | null {
  if (state.view === 'target') return state.pending;
  if (state.view !== 'top') return subRows(state)[state.subIdx] ?? null;
  const slot = state.slots[state.topIdx];
  return slot && slot.rows.length === 1 ? (slot.rows[0] ?? null) : null;
}

/** The target ids the finger points at now. */
export function aimedTargets(state: Ff7MenuState): CombatantId[] {
  if (state.view !== 'target') return [];
  if (state.targetAll) return [...state.targets];
  const id = state.targets[state.targetIdx];
  return id ? [id] : [];
}

function stepTop(state: Ff7MenuState, dir: 1 | -1): Ff7MenuState {
  const n = state.slots.length;
  for (let k = 1; k <= n; k++) {
    const i = (state.topIdx + dir * k + n * k) % n;
    if (state.slots[i]) return { ...state, topIdx: i };
  }
  return state;
}

const ALL_TARGETING = new Set(['all-enemies', 'all-allies', 'all', 'random-enemy', 'random-ally']);

/**
 * Aim a chosen row: straight to `done` when it needs no choice (self, or no
 * legal target to pick), otherwise the target step. `order` puts the valid
 * targets in on-screen order (left to right); the finger opens on the first
 * preferred target, else the first.
 */
function aim(state: Ff7MenuState, row: AvailableCommand, order: (ids: CombatantId[]) => CombatantId[]): StepResult {
  if (!row.enabled) return { state, refused: true, handled: true };
  const valid = order([...row.validTargets]);
  if (row.targeting === 'self' || valid.length === 0) {
    return { state, done: { ...row.command, targets: [...row.validTargets] } as Command, handled: true };
  }
  const all = row.targeting !== undefined && ALL_TARGETING.has(row.targeting);
  const pref = row.preferredTargets?.find((id) => valid.includes(id));
  return {
    state: { ...state, view: 'target', pending: row, targets: valid, targetAll: all, targetIdx: pref ? valid.indexOf(pref) : 0 },
    handled: true,
  };
}

function openSub(state: Ff7MenuState, sub: SubView): Ff7MenuState {
  return { ...state, view: sub, sub, subIdx: 0 };
}

/** Move within the open list: Magic is a 3-column grid, Item and Limit one column. */
function stepSub(state: Ff7MenuState, input: 'up' | 'down' | 'left' | 'right'): Ff7MenuState {
  const n = subRows(state).length;
  if (!n) return state;
  const cols = state.sub === 'magic' ? MAGIC_COLS : 1;
  const d = input === 'up' ? -cols : input === 'down' ? cols : input === 'left' ? -1 : 1;
  if (cols === 1 && (input === 'left' || input === 'right')) return state;
  const next = state.subIdx + d;
  return { ...state, subIdx: next < 0 ? next + Math.ceil(n / cols) * cols : next >= n ? next % cols : next };
}

/** One press. `order` sorts target ids left to right on screen (identity when there is no field). */
export function step(state: Ff7MenuState, input: MenuInput, order: (ids: CombatantId[]) => CombatantId[] = (ids) => ids): StepResult {
  if (input === 'help') return { state: { ...state, help: !state.help }, handled: true };
  switch (state.view) {
    case 'top': {
      if (input === 'up' || input === 'left') return { state: stepTop(state, -1), handled: true };
      if (input === 'down' || input === 'right') return { state: stepTop(state, 1), handled: true };
      if (input === 'cancel') return { state, handled: false };
      return chooseSlot(state, state.topIdx, order);
    }
    case 'magic':
    case 'item':
    case 'limit': {
      if (input === 'cancel') return { state: { ...state, view: 'top', sub: null, subIdx: 0 }, handled: true };
      if (input === 'confirm') return chooseRow(state, state.subIdx, order);
      const moved = stepSub(state, input);
      return { state: moved.subIdx < subRows(moved).length ? moved : state, handled: true };
    }
    case 'target': {
      if (input === 'cancel') return { state: { ...state, view: state.sub ?? 'top', pending: null, targets: [], targetAll: false }, handled: true };
      if (input === 'confirm') return confirmTarget(state);
      if (state.targetAll || state.targets.length < 2) return { state, handled: true };
      const d = input === 'up' || input === 'left' ? -1 : 1;
      const n = state.targets.length;
      return { state: { ...state, targetIdx: (state.targetIdx + d + n) % n }, handled: true };
    }
  }
}

/** Choose slot `i` (the confirm key on it, or a tap). */
export function chooseSlot(state: Ff7MenuState, i: number, order: (ids: CombatantId[]) => CombatantId[] = (ids) => ids): StepResult {
  const slot = state.slots[i];
  if (!slot) return { state, refused: true, handled: true };
  const at = { ...state, topIdx: i };
  if (!slot.enabled) return { state: at, refused: true, handled: true };
  if (slot.label === 'Magic') return { state: openSub(at, 'magic'), handled: true };
  if (slot.label === 'Item') return { state: openSub(at, 'item'), handled: true };
  if (slot.label === 'Limit') return { state: openSub(at, 'limit'), handled: true };
  const row = slot.rows[0];
  return row ? aim(at, row, order) : { state: at, refused: true, handled: true };
}

/** Choose row `i` of the open list. */
export function chooseRow(state: Ff7MenuState, i: number, order: (ids: CombatantId[]) => CombatantId[] = (ids) => ids): StepResult {
  const row = subRows(state)[i];
  if (!row) return { state, refused: true, handled: true };
  return aim({ ...state, subIdx: i }, row, order);
}

/** Confirm the target step. */
export function confirmTarget(state: Ff7MenuState): StepResult {
  const targets = aimedTargets(state);
  if (!state.pending || !targets.length) return { state, refused: true, handled: true };
  return { state, done: { ...state.pending.command, targets } as Command, handled: true };
}

/** A tap on a target: the first tap moves the finger there, a tap on the aimed one confirms. */
export function tapTarget(state: Ff7MenuState, id: CombatantId): StepResult {
  if (state.view !== 'target') return { state, handled: false };
  const i = state.targets.indexOf(id);
  if (i < 0) return { state, refused: true, handled: true };
  if (state.targetAll || i === state.targetIdx) return confirmTarget(state);
  return { state: { ...state, targetIdx: i }, handled: true };
}
