/**
 * The party prep tab strip as a real tab list (release 68, lane ui-input; `app/focusContract.ts`).
 *
 * `PartyPrepScreen.renderTabs` drew bare `div`s with `aria-selected` and nothing else: no role, no way to focus one, nothing
 * tying a tab to the sheet it shows. Now each is `role="tab"` with `aria-selected`, an id, `aria-controls` the sheet and a
 * roving `tabindex` (the open tab is the strip's one tab stop and the screen's cursor, `data-cursor`); the sheet is
 * `role="tabpanel"` labelled by the open tab. Clicking a tab is still the `prep:tab:<id>` action and the arrows still move
 * the cursor; what is new is that Tab reaches the strip, and Enter on a Tab-focused control that is not the cursor presses it.
 *
 * Game case: both (the prep shell is shared plumbing).
 */

import { escapeHtml } from '../../../ui/common/html.ts';

export const PREP_PANEL_ID = 'prep-panel';

const tabId = (id: string): string => `prep-tab-${id}`;

export interface PrepTabLike {
  readonly id: string;
  readonly label: string;
}

/**
 * The strip's tabs. With no panel registered the shell's own member sheet is the one tab (STATS), so it is a real, selected tab
 * too and the CSS that keys on `aria-selected` has something to key on.
 */
export function prepTabsHtml(tabs: readonly PrepTabLike[], index: number): string {
  if (tabs.length === 0) {
    return `<div class="prep__tab" id="${tabId('stats')}" role="tab" aria-selected="true" aria-controls="${PREP_PANEL_ID}" tabindex="0">STATS</div>`;
  }
  return tabs
    .map((t, i) => {
      const on = i === index;
      return (
        `<div class="prep__tab" id="${escapeHtml(tabId(t.id))}" role="tab" aria-selected="${on}" aria-controls="${PREP_PANEL_ID}"` +
        ` tabindex="${on ? 0 : -1}"${on ? ' data-cursor' : ''} data-action="prep:tab:${escapeHtml(t.id)}">${escapeHtml(t.label.toUpperCase())}</div>`
      );
    })
    .join('');
}

/** Point the sheet at the tab that is open (its accessible name is the tab's). */
export function labelPrepPanel(body: HTMLElement | null, tabs: readonly PrepTabLike[], index: number): void {
  body?.setAttribute('aria-labelledby', tabId(tabs[index]?.id ?? 'stats'));
}
