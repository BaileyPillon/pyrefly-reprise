/**
 * CAMERA LAB: the switch rows, shared by the panel and the in-battle popover.
 * Pure strings (no DOM): a row is a label, its options, and which one is on.
 */

import type { LabChapterId, LabSwitches } from '../../engine/lab/LabTypes.ts';
import { LAB_CHAPTERS } from '../../engine/lab/labChapters.ts';

export type LabRowId = 'chapter' | 'style' | 'views' | 'menu' | 'target';

export interface LabRowSpec {
  id: LabRowId;
  label: string;
  hint?: string;
  /** The key that flips it in battle (none for the chapter). */
  key?: string;
  options: Array<{ value: string; text: string }>;
}

export const SWITCH_ROWS: readonly LabRowSpec[] = [
  { id: 'style', label: 'Style', key: '1', options: [{ value: 'persona', text: 'Persona' }, { value: 'clair', text: 'Clair Obscur' }] },
  { id: 'views', label: 'Views', key: '2', hint: 'rear paintings', options: [{ value: 'on', text: 'Rear paintings' }, { value: 'off', text: "Today's paintings" }] },
  { id: 'menu', label: 'Menu', key: '3', hint: 'phones keep the panel', options: [{ value: 'hero', text: 'At the hero' }, { value: 'panel', text: "Today's panel" }] },
  { id: 'target', label: 'Target cut', key: '4', hint: 'Clair Obscur, FFX', options: [{ value: 'on', text: 'On' }, { value: 'off', text: 'Off' }] },
];

export const CHAPTER_ROW: LabRowSpec = {
  id: 'chapter',
  label: 'Chapter',
  options: (Object.keys(LAB_CHAPTERS) as LabChapterId[]).map((id) => ({ value: id, text: LAB_CHAPTERS[id].title })),
};

/** The value a row shows for these switches. */
export function rowValue(id: LabRowId, sw: Readonly<LabSwitches>, chapter: LabChapterId): string {
  switch (id) {
    case 'chapter':
      return chapter;
    case 'style':
      return sw.style;
    case 'views':
      return sw.views ? 'on' : 'off';
    case 'menu':
      return sw.menuAtHero ? 'hero' : 'panel';
    case 'target':
      return sw.targetCut ? 'on' : 'off';
  }
}

/** The switch patch for picking `value` on a row (the chapter row patches nothing). */
export function patchFor(id: LabRowId, value: string): Partial<LabSwitches> {
  switch (id) {
    case 'style':
      return { style: value === 'clair' ? 'clair' : 'persona' };
    case 'views':
      return { views: value === 'on' };
    case 'menu':
      return { menuAtHero: value === 'hero' };
    case 'target':
      return { targetCut: value === 'on' };
    default:
      return {};
  }
}

/** The patch that flips a switch row to its other option. */
export function flipPatch(id: LabRowId, sw: Readonly<LabSwitches>): Partial<LabSwitches> {
  const row = SWITCH_ROWS.find((r) => r.id === id);
  if (!row) return {};
  const now = rowValue(id, sw, 'seymour-flux');
  const next = row.options.find((o) => o.value !== now) ?? row.options[0]!;
  return patchFor(id, next.value);
}

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** One row's HTML; each option is a button whose `data-action` the screen or the chip reads. */
export function rowHtml(row: LabRowSpec, value: string, focus: boolean, actionPrefix: string): string {
  const keyNote = row.key ? ` <small>key ${row.key}${row.hint ? ` · ${esc(row.hint)}` : ''}</small>` : row.hint ? ` <small>${esc(row.hint)}</small>` : '';
  const opts = row.options
    .map(
      (o) =>
        `<button type="button" class="lab-opt${o.value === value ? ' lab-opt--on' : ''}" data-action="${actionPrefix}:${row.id}:${o.value}" aria-pressed="${o.value === value}">${esc(o.text)}</button>`,
    )
    .join('');
  return `<div class="lab-row${focus ? ' lab-row--focus' : ''}" data-row="${row.id}"><div class="lab-row__label">${esc(row.label)}${keyNote}</div><div class="lab-opts">${opts}</div></div>`;
}
