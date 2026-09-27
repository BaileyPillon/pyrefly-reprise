/**
 * What the results page prints, and the desktop page's markup (`results.css`,
 * the 640x360 Ink & Gold page). Moved out of `ResultsScreen.ts` unchanged
 * (house rule 7: that file had passed 400 lines) when the phone page
 * (`resultsPhone.ts`, PR-0001 option B) became a second reader of the same
 * model. Both games: the results screen is shared plumbing.
 */

import { escapeHtml } from './html.ts';
import { partyFaceHtml } from './partyFace.ts';
import {
  formatNumber,
  ITEMS_LONG_CHARS,
  ledgerValueClass,
  resultsDensity,
  type ResultsMemberRow,
} from './resultsMath.ts';
import type { VictoryLine } from './victoryLine.ts';

/** What the player asked for from the panel. Only a defeat offers a choice. */
export type ResultsChoice = 'continue' | 'retry' | 'chapter-select';

/** One printed row of the spoils ledger. */
export type LedgerLine =
  /** A number that rolls up with the reveal. */
  | { kind: 'count'; key: string; value: number; detail?: string }
  /** A settled value (a time, a turn count) — no roll-up. */
  | { kind: 'text'; key: string; value: string; detail?: string }
  /** The drops, set as a printed list rather than a tally. */
  | { kind: 'items'; key: string; value: string; detail?: string };

/** The two things the defeat panel offers, in cursor order. */
export const DEFEAT_ACTIONS: ReadonlyArray<{ choice: ResultsChoice; label: string }> = [
  { choice: 'retry', label: 'RETRY' },
  { choice: 'chapter-select', label: 'CHAPTER SELECT' },
];

/** Everything one render of the page reads. */
export interface ResultsPageModel {
  victory: boolean;
  silent: boolean;
  /** `Victory`, `Results` (silent) or `Defeat`. */
  heading: string;
  /** The clear time, already formatted (`4:28`). */
  clock: string;
  /** OVERKILL ×n, NEW BEST. */
  tags: string[];
  quip: VictoryLine | undefined;
  ledger: LedgerLine[];
  rows: ResultsMemberRow[];
  /** The count-up's progress, 0..1. */
  progress: number;
  /** The defeat cursor. */
  actionIndex: number;
}

/** A ledger value as printed at this point of the count-up. */
export function ledgerValueText(line: LedgerLine, p: number): string {
  return line.kind === 'count' ? formatNumber(Math.round(line.value * p)) : escapeHtml(line.value);
}

/** The model's heading, tags and the like, from the screen's state. */
export function pageHeading(victory: boolean, silent: boolean): string {
  return victory ? (silent ? 'Results' : 'Victory') : 'Defeat';
}

/** The desktop page (`.rres__page`'s contents), as it has been since the Ink & Gold pass. */
export function desktopPageHtml(m: ResultsPageModel): string {
  const p = m.progress;
  // A wrapped `.rres__v--items-long` row (two lines) needs more room than a
  // normal-height ledger row budgets for in compact mode — see
  // `resultsDensity`'s own doc for the measured gap this closes.
  const itemsLine = m.ledger.find((line) => line.kind === 'items');
  const itemsLong = itemsLine !== undefined && itemsLine.value.length > ITEMS_LONG_CHARS;
  const density = resultsDensity(m.ledger.length, m.rows.length, itemsLong);
  const ledgerHtml = m.ledger
    .map((line) => {
      const value = ledgerValueText(line, p);
      const valueClass = ledgerValueClass(line.kind === 'items' ? line.value : null);
      const detail = line.detail ? `<div class="rres__d">${escapeHtml(line.detail)}</div>` : '';
      return `<div class="rres__line">
            <div class="rres__k">${escapeHtml(line.key)}</div>
            <div class="${valueClass}">${value}</div>
            ${detail}
          </div>`;
    })
    .join('');

  return `
      <div class="rres__head">
        <div class="rres__chip">RESULTS &middot; ${escapeHtml(m.clock)}</div>
        <div class="rres__heading">${m.heading}</div>
        <div class="rres__rule-row">
          <div class="rres__rule"></div>
          ${m.tags.map((t) => `<span class="rres__tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        ${m.quip ? `<div class="rres__quip" data-speaker="${escapeHtml(m.quip.speakerId)}">${escapeHtml(m.quip.line)}</div>` : ''}
      </div>

      <div class="rres__ledger rres__ledger--${density.ledger}">${ledgerHtml}</div>

      <div class="rres__party rres__party--${density.party}">${membersHtml(m)}</div>
      ${m.victory ? confirmHtml() : actionsHtml(m.actionIndex)}
    `;
}

/** A member's face: the initial under the painted layers (a 404 removes its own <img>). */
export function memberFaceHtml(row: ResultsMemberRow): string {
  // `partyFaceHtml` is the same dressphere/`-x2`-aware ladder the pause
  // screen and battle HUD climb (LIVE-A2-1, docs/handoff/fix3-ffx2-hud-prep.md).
  return `<span>${escapeHtml(row.name.charAt(0).toUpperCase())}</span>${partyFaceHtml({
    id: row.id,
    name: row.name,
    dressphere: row.dressphere,
  })}`;
}

function membersHtml(m: ResultsPageModel): string {
  const p = m.progress;
  return m.rows
    .map((row) => {
      const face = memberFaceHtml(row);
      const levelHtml =
        m.victory && row.levelDelta > 0 && p >= 1
          ? `<span class="rres__level-up">+${row.levelDelta} ${escapeHtml(row.levelUnit)}</span>`
          : '';
      const award = m.victory
        ? `<span class="rres__member-ap">+${formatNumber(Math.round(row.award * p))}<small>${row.awardUnit}</small></span>`
        : '';
      return `
          <div class="rres__member">
            <div class="rres__face">${face}</div>
            <div class="rres__member-text">
              <div class="rres__member-line">
                <span class="rres__member-name">${escapeHtml(row.name)}</span>
                ${levelHtml}
              </div>
              <div class="rres__member-detail">${escapeHtml(row.detail)}</div>
            </div>
            ${award}
          </div>
        `;
    })
    .join('');
}

function confirmHtml(): string {
  return `<div class="rres__confirm" data-action="confirm"><span>CONFIRM ▸</span></div>`;
}

function actionsHtml(actionIndex: number): string {
  const slabs = DEFEAT_ACTIONS.map((action, i) => {
    const selected = i === actionIndex ? ' rres__action--selected' : '';
    return `<div class="rres__action${selected}" data-action="results:${action.choice}" role="button" tabindex="0"><span>${action.label}</span></div>`;
  }).join('');
  return `<div class="rres__actions">${slabs}</div>`;
}
