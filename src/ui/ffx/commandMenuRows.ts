import type { AnyCombatant, AvailableCommand, CombatantId } from '../../battle/common/types.ts';
import { rowEnabled, switchTargetId, type TopGroupRow, type TopRow } from './CommandMenuLogic.ts';
import { commandHelpText } from './commandHelp.ts';

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
  kind: 'mp' | 'ready' | 'count';
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

export function subRowVM(cmd: AvailableCommand, group: TopGroupRow, combatants: Record<CombatantId, AnyCombatant>): RowVM {
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

/**
 * What a *category* row says.
 *
 * A group the stack resolves flat — one enabled entry, which is most
 * characters' Overdrive — describes that entry instead of offering to open a
 * list the player will never see (`chooseTop`). Round 02 #27.
 */
export function groupHelp(row: TopGroupRow): string {
  if (row.role === 'switch') return 'Swap in a reserve member (L1 / Q). The member coming in takes this turn.';
  const only = row.items.length === 1 ? row.items[0] : undefined;
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
