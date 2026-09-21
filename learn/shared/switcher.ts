/**
 * The specimen switcher, top centre: one chip per specimen a site offers
 * (`docs/plans/learning-sites.md`; not part of either reference site, but
 * every one of this project's own approved frames shows one). A disabled
 * entry renders with an honest "not built yet" note instead of being left
 * out silently.
 */

import { escapeHtml } from './text.ts';

export interface SwitcherEntry {
  readonly id: string;
  /** Small caption above the name, e.g. "I · FFX". */
  readonly kicker: string;
  readonly title: string;
  /** Resolved thumbnail URL (already run through `artUrl`); omitted renders a plain initial instead. */
  readonly thumbUrl?: string;
  readonly enabled: boolean;
}

export interface SwitcherOptions {
  readonly onSelect: (id: string) => void;
}

export interface SwitcherHandle {
  /** Repaints the chip row with a different specimen marked current, without re-registering listeners. */
  setCurrent(id: string): void;
  destroy(): void;
}

function chipHtml(entry: SwitcherEntry, currentId: string): string {
  const on = entry.id === currentId;
  const thumb =
    entry.thumbUrl !== undefined
      ? `<span class="pyx-chip__thumb" style="background-image:url('${escapeHtml(entry.thumbUrl)}')"></span>`
      : `<span class="pyx-chip__thumb pyx-chip__thumb--blank">${escapeHtml(entry.title.charAt(0))}</span>`;
  return `
    <button type="button" class="pyx-chip${on ? ' pyx-chip--on' : ''}${entry.enabled ? '' : ' pyx-chip--disabled'}"
      data-specimen-id="${escapeHtml(entry.id)}" ${entry.enabled ? '' : 'disabled title="Not built yet"'}
      aria-current="${on ? 'true' : 'false'}">
      ${thumb}
      <span class="pyx-chip__meta">
        <span class="pyx-chip__k">${escapeHtml(entry.kicker)}</span>
        <span class="pyx-chip__n">${escapeHtml(entry.title)}</span>
      </span>
      ${entry.enabled ? '' : '<span class="pyx-chip__note">Not built yet</span>'}
    </button>`;
}

export function renderSwitcher(
  host: HTMLElement,
  entries: readonly SwitcherEntry[],
  currentId: string,
  options: SwitcherOptions,
): SwitcherHandle {
  function paint(id: string): void {
    host.innerHTML = entries.map((entry) => chipHtml(entry, id)).join('');
  }

  function onClick(event: Event): void {
    const target = event.target as HTMLElement;
    const chip = target.closest<HTMLButtonElement>('[data-specimen-id]');
    if (chip === null || chip.disabled) return;
    const id = chip.dataset['specimenId'];
    if (id !== undefined) options.onSelect(id);
  }

  host.addEventListener('click', onClick);
  paint(currentId);

  return {
    setCurrent: paint,
    destroy(): void {
      host.removeEventListener('click', onClick);
      host.innerHTML = '';
    },
  };
}
