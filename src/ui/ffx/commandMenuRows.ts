import type { AnyCombatant, AvailableCommand, CombatantId } from '../../battle/common/types.ts';
import { isOpenerGroup, rowEnabled, switchTargetId, type TopGroupRow, type TopRow } from './CommandMenuLogic.ts';
import { commandHelpText } from './commandHelp.ts';
import { portraitChipHtml, tintFor } from './portraits.ts';
import { opensList } from './targetStepUi.ts';
import { TAKEN_REASON } from '../../data/ffx/last-summoning-ids.ts'; // a module with no imports of its own

/**
 * The FFX command stack's row view-models and the small HTML pieces a row is
 * drawn from, on their own so `CommandMenu.ts` keeps only the stack's
 * behaviour. Pure: no DOM, nothing stateful.
 */

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** `.ig-cmd__cursor`'s inline SVG, per `slabs.css`'s comment on that class. */
export const CURSOR_SVG = '<svg class="ig-cmd__cursor" viewBox="0 0 12 16" aria-hidden="true"><path d="M1 1 L11 8 L1 15 Z" fill="#0B0A12"/></svg>';

/** Keeps `.ig-cmd__ready`'s layout role (it is what pushes the tag right). */
export function badgeHtml(badge: RowBadge | undefined): string {
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
export interface RowBadge {
  kind: 'mp' | 'ready' | 'count' | 'taken';
  text: string;
}

export interface RowVM {
  label: string;
  enabled: boolean;
  overdrive: boolean;
  trigger: boolean;
  /** A group row: draws the "opens a list" chevron. */
  group: boolean;
  badge?: RowBadge;
  /** Portrait chip for a reserve member in the Switch list. */
  portrait?: { key: string | undefined; name: string };
  /** Why a greyed row is greyed ("Not enough MP", "Silenced"): a short line on a phone tile, where the keyboard cursor that would read it does not exist. */
  reason?: string;
}

/** A greyed row's reason as its own line (`ffx-cmd__reason`: shown on a phone tile only, hidden by the desktop stylesheet). */
export function reasonHtml(reason: string | undefined): string {
  return reason ? `<span class="ffx-cmd__reason">${escapeHtml(reason)}</span>` : '';
}

/**
 * The stack's rows from `start` up to (not including) `end`: one `.ig-cmd` per view-model, cascading right by its place in the window, the selected one carrying the
 * cursor. `data-ui-action` is the row's index in the whole list (`CommandMenu.onAction`).
 */
export function rowsHtml(vms: readonly RowVM[], start: number, end: number, selectedIndex: number): string {
  return vms
    .slice(start, end)
    .map((vm, localI) => {
      const i = start + localI;
      const selected = i === selectedIndex;
      const cls = ['ig-cmd', selected ? 'ig-cmd--selected' : '', !vm.enabled ? 'ig-cmd--disabled' : '', vm.overdrive ? 'ig-cmd--overdrive' : '', vm.trigger ? 'ffx-cmd--trigger' : '', vm.portrait ? 'ffx-cmd--member' : '']
        .filter(Boolean)
        .join(' ');
      const cursor = selected ? CURSOR_SVG : '';
      const face = vm.portrait ? `<span class="ffx-cmd__face">${portraitChipHtml(vm.portrait.key, vm.portrait.name, tintFor('party'))}</span>` : '';
      const chevron = vm.group ? '<span class="ffx-cmd__chev" aria-hidden="true">▸</span>' : '';
      return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${localI})" data-ui-action="${i}">${cursor}${face}<span class="ffx-cmd__label">${escapeHtml(vm.label)}</span>${chevron}${badgeHtml(vm.badge)}${reasonHtml(vm.reason)}</div>`;
    })
    .join('');
}

export function topRowVM(row: TopRow): RowVM {
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
    : row.role === 'switch'
      ? benchBadge(row)
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

/** The Switch row's count is the bench; the one greyed row a forbidden Switch with an empty bench gets (`MENU_DRAW_PARITY` item d) names nobody and carries no count. */
function benchBadge(row: TopGroupRow): RowBadge | undefined {
  const benched = row.items.filter((c) => switchTargetId(c)).length;
  return benched > 0 ? { kind: 'count', text: `×${benched}` } : undefined;
}

export function subRowVM(cmd: AvailableCommand, group: TopGroupRow, combatants: Record<CombatantId, AnyCombatant>): RowVM {
  // The hidden Last Summoning (FFX only): an aeon Yu Yevon has taken stays on Yuna's list, greyed, and says so (the cursor skips a greyed row, so its reason would never be read).
  const taken = !cmd.enabled && cmd.category === 'summon' && cmd.disabledReason === TAKEN_REASON;
  const badge: RowBadge | undefined = taken ? { kind: 'taken', text: 'TAKEN' } : mpBadge(cmd);
  const vm: RowVM = {
    label: cmd.label,
    enabled: cmd.enabled,
    overdrive: cmd.category === 'overdrive',
    trigger: false,
    group: false,
    ...(badge ? { badge } : {}),
    ...(!cmd.enabled && !taken && cmd.disabledReason ? { reason: cmd.disabledReason } : {}),
  };
  if (group.role !== 'switch') return vm;
  const benched = switchTargetId(cmd);
  const c = benched ? combatants[benched] : undefined;
  return { ...vm, portrait: { key: c?.portraitKey, name: c?.name ?? cmd.label } };
}

/**
 * What a *category* row says.
 *
 * A group the stack resolves flat — one enabled entry, which is most
 * characters' Overdrive — describes that entry instead of offering to open a
 * list the player will never see (`chooseTop`). Round 02 #27.
 */
export function groupHelp(row: TopGroupRow, actorId?: CombatantId): string {
  if (row.role === 'switch') return 'Swap in a reserve member (L1 / Q). The member coming in takes this turn.';
  const only = row.items.length === 1 && (row.items[0]!.enabled || !isOpenerGroup(row)) && !opensList(row, actorId) ? row.items[0] : undefined; // an opener whose one entry is greyed still opens its list
  if (only) return commandHelpText(only) || `Open the ${row.label} menu.`;
  return `Open the ${row.label} menu.`;
}

function mpBadge(cmd: AvailableCommand): RowBadge | undefined {
  return cmd.mpCost > 0 ? { kind: 'mp', text: String(cmd.mpCost) } : undefined;
}

function triggerBadge(cmd: AvailableCommand): RowBadge | undefined {
  const extra = (cmd.command as { extra?: Record<string, unknown> }).extra;
  const remaining = typeof extra?.['chargesRemaining'] === 'number' ? (extra['chargesRemaining'] as number) : null;
  return remaining === null ? undefined : { kind: 'count', text: `×${remaining}` };
}
