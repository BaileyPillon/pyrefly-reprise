/**
 * Every string of HTML the remade pause screen draws.
 *
 * Split from the screen for the same reason `PauseScreenPanels.ts` was split
 * from the old one: none of it touches screen state, so the copy, the row
 * order and the mirrored chrome can be asserted on without mounting anything.
 *
 * The shapes come straight from the approved frames
 * (`docs/concepts/pause-until-dawn/`): a thin tab strip with a shoulder glyph
 * at each end, hairline rows of `label · bar · value`, one big thin-serif line
 * bottom-left under a tiny eyebrow, and two prompts bottom-right. There are no
 * panels, boxes or cards anywhere in this file — that absence is the design.
 *
 * Pure: `data -> string`.
 */

import { escapeHtml } from '../../../ui/common/html.ts';
import type { MeterColumn, MeterRow } from './meters.ts';
import type { PanelColumn, PanelRow } from './panels.ts';
import type { PauseTab } from './tabs.ts';
import { artUrl } from '../../../engine/PaintedArt.ts';

/** The one row shape the renderer draws. Both columns funnel into it. */
export interface RenderRow {
  id: string;
  k: string;
  v: string;
  quiet?: string;
  fill: number | null;
  mark?: number | null;
  selectable?: boolean;
  selected?: boolean;
  rule?: boolean;
  done?: boolean;
  head?: boolean;
  cmd?: boolean;
}

export interface RenderColumn {
  id: string;
  heading: string;
  rows: RenderRow[];
  wide?: boolean;
  prose?: { text: string; who: string; hand: string };
  snaps?: readonly { image: string; caption: string }[];
}

const pct = (n: number): string => `${(Math.max(0, Math.min(1, n)) * 100).toFixed(1)}%`;

// ------------------------------------------------------------------- tabs

/**
 * The strip.
 *
 * `Q`/`L1` at the left end and `R1`/`E` at the right, exactly as the frames
 * draw them, because the two keys and the two shoulder buttons do the same
 * thing and a player should not have to find that out.
 */
export function tabsHtml(tabs: readonly PauseTab[], activeId: string): string {
  const items = tabs
    .map((t) => {
      const on = t.id === activeId;
      const cls = ['pause__tab'];
      if (on) cls.push('pause__tab--on');
      if (t.ko) cls.push('pause__tab--ko');
      const hp =
        t.hp === null
          ? ''
          : `<span class="pause__tabhp${t.hp < 0.3 ? ' pause__tabhp--low' : ''}">` +
            `<i style="width:${pct(t.hp)}"></i></span>`;
      const dot = t.dot ? '<span class="pause__dot"></span>' : '';
      return (
        `<button type="button" class="${cls.join(' ')}" role="tab" aria-selected="${on}"` +
        ` data-tab="${escapeHtml(t.id)}" data-action="pause:tab:${escapeHtml(t.id)}">` +
        `${escapeHtml(t.label)}${hp}${dot}</button>`
      );
    })
    .join('');
  return (
    `<span class="pause__bump pause__bump--l" aria-hidden="true"><b>Q</b><i>L1</i></span>` +
    `<span class="pause__swipe" data-role="swipe">${items}</span>` +
    `<span class="pause__bump pause__bump--r" aria-hidden="true"><i>R1</i><b>E</b></span>`
  );
}

// ----------------------------------------------------------------- columns

function rowHtml(r: RenderRow): string {
  if (r.rule) return '<div class="pause__row pause__row--rule"><span></span></div>';
  const cls = ['pause__row'];
  if (r.fill === null) cls.push('pause__row--word');
  if (r.selected) cls.push('pause__row--sel');
  if (r.done) cls.push('pause__row--done');
  if (r.head) cls.push('pause__row--head');
  if (r.cmd) cls.push('pause__row--cmd');
  const bar =
    r.fill === null
      ? '<span class="pause__bar"></span>'
      : `<span class="pause__bar"><i style="width:${pct(r.fill)}"></i>${
          typeof r.mark === 'number' ? `<s style="left:${pct(r.mark)}"></s>` : ''
        }</span>`;
  const value =
    `<span class="pause__v">${escapeHtml(r.v)}` +
    `${r.quiet ? `<em>${escapeHtml(r.quiet)}</em>` : ''}</span>`;
  const interactive = r.selectable
    ? ` role="button" tabindex="0" data-action="pause:row:${escapeHtml(r.id)}"`
    : '';
  return (
    `<div class="${cls.join(' ')}" data-row="${escapeHtml(r.id)}"${interactive}>` +
    `<span class="pause__k">${escapeHtml(r.k)}</span>${bar}${value}</div>`
  );
}

function proseHtml(p: { text: string; who: string; hand: string }): string {
  return (
    `<blockquote class="pause__quote"><span class="pause__quote-text">&ldquo;${escapeHtml(
      p.text,
    )}&rdquo;</span><cite class="pause__quote-who">${escapeHtml(p.who)}</cite>` +
    `<span class="pause__hand">${escapeHtml(p.hand)}</span></blockquote>`
  );
}

function snapsHtml(snaps: readonly { image: string; caption: string }[]): string {
  return (
    '<div class="pause__snaps">' +
    snaps
      .map(
        (s) =>
          `<figure class="pause__snap"><img alt="" loading="lazy" src="${escapeHtml(
            artUrl(`art/${s.image}`),
          )}"><figcaption>${escapeHtml(s.caption)}</figcaption></figure>`,
      )
      .join('') +
    '</div>'
  );
}

export function columnsHtml(columns: readonly RenderColumn[]): string {
  return columns
    .map((c) => {
      const cls = ['pause__col'];
      if (c.wide) cls.push('pause__col--wide');
      return (
        `<div class="${cls.join(' ')}" data-col="${escapeHtml(c.id)}">` +
        `<h3>${escapeHtml(c.heading)}</h3>` +
        c.rows.map(rowHtml).join('') +
        (c.prose ? proseHtml(c.prose) : '') +
        (c.snaps ? snapsHtml(c.snaps) : '') +
        '</div>'
      );
    })
    .join('');
}

// ------------------------------------------------------------- conversions

/** A meter column, ready to render. Meters are never selectable. */
export function fromMeters(columns: readonly MeterColumn[]): RenderColumn[] {
  return columns.map((c) => ({
    id: c.id,
    heading: c.heading,
    wide: c.id === 'fight',
    rows: c.rows.map(
      (r: MeterRow): RenderRow => ({
        id: r.id,
        k: r.k,
        v: r.v,
        fill: r.fill,
        ...(r.quiet === undefined ? {} : { quiet: r.quiet }),
        ...(r.mark === undefined || r.mark === null ? {} : { mark: r.mark }),
      }),
    ),
  }));
}

/** A panel column, ready to render, with one row marked as the cursor. */
export function fromPanels(columns: readonly PanelColumn[], selectedRowId: string | null): RenderColumn[] {
  return columns.map((c) => ({
    id: c.id,
    heading: c.heading,
    ...(c.wide ? { wide: true } : {}),
    ...(c.prose ? { prose: c.prose } : {}),
    ...(c.snaps ? { snaps: c.snaps } : {}),
    rows: c.rows.map(
      (r: PanelRow): RenderRow => ({
        id: r.id,
        k: r.label,
        v: r.value,
        fill: r.ratio,
        selectable: r.selectable,
        selected: r.selectable && r.id === selectedRowId,
        ...(r.rule ? { rule: true } : {}),
        ...(r.done ? { done: true } : {}),
        ...(r.head ? { head: true } : {}),
        ...(r.cmd ? { cmd: true } : {}),
      }),
    ),
  }));
}

// ------------------------------------------------------- objective and back

/** The chapter's current objective: one big thin-serif line under a tiny label. */
export function objectiveHtml(eyebrow: string, line: string): string {
  return (
    `<span class="pause__eyebrow">${escapeHtml(eyebrow)}</span>` +
    `<p class="pause__line">${escapeHtml(line)}</p>`
  );
}

/** `Esc RESUME`, with `H hide panels` under it. */
export function backHtml(): string {
  return (
    `<div class="pause__back" data-action="cancel" role="button" tabindex="0">` +
    `<span class="pause__key">Esc</span>Resume</div>` +
    `<div class="pause__hide" data-action="pause:panels" role="button" tabindex="0">` +
    `H&nbsp;&nbsp;hide panels</div>`
  );
}

/** The one line that survives `H`. */
export function baselineHtml(): string {
  return (
    '<b data-action="pause:panels" role="button" tabindex="0">H</b> show panels' +
    ' <span>&middot;</span> <b data-action="cancel" role="button" tabindex="0">Esc</b> resume'
  );
}
