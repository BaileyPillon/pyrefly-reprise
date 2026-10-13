/**
 * PR-0295 at phone width, option PREP-A "one long page" (Bailey, 2026-10-12, D-781; both games: the prep shell and
 * its eight tab panels are shared, the FFX and FFX-2 tabs differ). Target: `critic/scratch/prep-phone-options-2026-10-12/`
 * (the PREP-A frames), kept beside the build in `docs/screenshots/r43-prepphone/`.
 *
 * Under 600 CSS px wide each of the eight heavy tabs (FFX Stats, Equipment, Items, Overdrive; FFX-2 Dresspheres,
 * Stats, Accessories, Items) stops being the 640x360 board shrunk to a third of the width and becomes one scrolling
 * column: a sticky tab bar and faces, the member's name, then folding sections that keep a one-line digest when they
 * are folded. The panels print their desktop markup exactly as before and add one hidden host (`.prph`) beside it;
 * the stylesheets (`prep-phone-sections.css`, `prep-phone-parts.css`, `party-prep-phone-tabs.css`) show the host and hide the rest, and only
 * inside the phone query, so a desktop size is untouched by construction.
 *
 * This file is the markup half: pure `data -> HTML` helpers (no DOM, no state) that the panels' phone views share.
 * The behaviour half (folding, paging, expand-all) is `prepPhoneFold.ts`.
 */

import { escapeHtml } from './html.ts';

/**
 * The tabs that become the stacked page on a phone. CHAPTER and SPHERE GRID ship their own phone pages
 * (PR-0127 / D-295, keyed on `data-tab`); these six ids cover the eight panels of the two games
 * (`stats` and `items` exist in both).
 */
export const PHONE_PAGE_TABS: readonly string[] = ['stats', 'equipment', 'items', 'overdrive', 'dresspheres', 'accessories'];

/** True for a tab id that gets the stacked page. */
export function isPhonePageTab(id: string | null | undefined): boolean {
  return !!id && PHONE_PAGE_TABS.includes(id);
}

/** One folding section. Plain strings are escaped here; `head`, `titleHtml` and `body` are trusted markup the caller built. */
export interface SectionSpec {
  /** Stable inside the tab: a section keeps its open or folded state under this key across a redraw. */
  key: string;
  /** The small tracked label, e.g. `HP · MP`. */
  label: string;
  /** Secondary label, right of the label, e.g. `1 OF 3 SLOTS`. */
  aside?: string;
  /** A serif title under the label, e.g. an item's name. */
  title?: string;
  /** Markup for the title line when it is more than text (a tile and a name). */
  titleHtml?: string;
  /** What a folded section prints in place of its body: its numbers in one line. */
  digest?: string;
  open: boolean;
  /** Trusted markup. */
  body: string;
  /** Replaces the whole header (a dressphere row: tile, name, counts). Trusted markup. */
  head?: string;
  /** Inline custom properties on the section, e.g. `--job:#F7B6D9`. */
  style?: string;
}

/** The label, the aside, the title and the digest of an ordinary section header. */
function defaultHead(s: SectionSpec): string {
  return (
    `<span class="prph-k">${escapeHtml(s.label)}</span>` +
    (s.aside ? `<span class="prph-ks">${escapeHtml(s.aside)}</span>` : '') +
    (s.titleHtml ? `<span class="prph-t">${s.titleHtml}</span>` : s.title ? `<span class="prph-t">${escapeHtml(s.title)}</span>` : '') +
    (s.digest ? `<span class="prph-dg">${escapeHtml(s.digest)}</span>` : '')
  );
}

/** A section: a header that folds it, and the ivory body under it. The header is a button for a finger (the keys fold all). */
export function sectionHtml(s: SectionSpec): string {
  const row = s.head !== undefined;
  return (
    `<section class="prph-sec${row ? ' prph-sec--row' : ''}${s.open ? ' is-open' : ''}" data-fold="${escapeHtml(s.key)}"` +
    `${s.style ? ` style="${escapeHtml(s.style)}"` : ''}>` +
    `<div class="prph-sec__h" role="button" tabindex="0" aria-expanded="${s.open ? 'true' : 'false'}" data-fold-head>` +
    `${s.head ?? defaultHead(s)}<i class="prph-chev" aria-hidden="true"></i></div>` +
    `<div class="prph-sec__b">${s.body}</div></section>`
  );
}

/** A stat row: the label, then an optional "before" figure, the figure itself and an optional note ("+10% dmg"). */
export function statRowHtml(o: { label: string; base?: number | string; value: number | string; bonus?: string }): string {
  return (
    `<div class="prph-row"><span class="prph-l">${escapeHtml(o.label)}</span><span class="prph-v">` +
    `${o.base !== undefined ? `<span class="prph-base">${escapeHtml(String(o.base))}</span>` : ''}` +
    `<span class="prph-n">${escapeHtml(String(o.value))}</span>` +
    `${o.bonus ? `<span class="prph-bonus">${escapeHtml(o.bonus)}</span>` : ''}</span></div>`
  );
}

/** A gear slot: a filled slot names its ability (and what it does); an empty one says so. */
export function slotRowHtml(o: { label: string; effect?: string; filled: boolean }): string {
  return (
    `<div class="prph-slot ${o.filled ? 'is-on' : 'is-empty'}"><i class="prph-dot" aria-hidden="true"></i>` +
    `<span class="prph-ab">${escapeHtml(o.label)}</span>` +
    `${o.effect ? `<span class="prph-fx">${escapeHtml(o.effect)}</span>` : ''}</div>`
  );
}

/** A bag row: the name and how many. */
export function itemRowHtml(name: string, count: number): string {
  return `<div class="prph-item"><span class="prph-item__name">${escapeHtml(name)}</span><span class="prph-item__qty">&times;${count}</span></div>`;
}

/** The italic line under a page ("Equipment grants auto-abilities, ..."). */
export function noteHtml(text: string): string {
  return `<p class="prph-note">${escapeHtml(text)}</p>`;
}

/** A plain line of text inside a section body. */
export function lineHtml(text: string): string {
  return `<p class="prph-line">${escapeHtml(text)}</p>`;
}

/** A line that stands where a tab has nothing to list. */
export function emptyHtml(text: string): string {
  return `<p class="prph-empty">${escapeHtml(text)}</p>`;
}

/** A wrapped row of text chips (learned abilities). */
export function chipsHtml(labels: readonly string[]): string {
  return `<div class="prph-chips">${labels.map((l) => `<span class="prph-chip">${escapeHtml(l)}</span>`).join('')}</div>`;
}

/** The body of a section that is two columns of the same kind of cell. */
export function gridHtml(cells: readonly string[]): string {
  return `<div class="prph-grid">${cells.join('')}</div>`;
}

/** The sub-heading between sections ("OTHER DRESSPHERES · 9"): a tracked label and a rule. */
export function subHeadHtml(text: string): string {
  return `<div class="prph-sub">${escapeHtml(text)}</div>`;
}

/** WCAG relative luminance of a `#RRGGBB` colour (0 to 1). */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1]!, 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

/**
 * A dressphere's monogram tile in its job colour. The text flips to ivory on the dark ones (the page this is built to
 * drew it the same way); it is the Ink & Gold ink or paper token, never a new shade.
 */
export function tileHtml(abbr: string, colour: string): string {
  const ink = luminance(colour) < 0.179 ? 'var(--ig-paper)' : 'var(--ig-ink)';
  return `<span class="prph-tile" style="--job:${escapeHtml(colour)};--tile-ink:${ink}">${escapeHtml(abbr)}</span>`;
}

/** The member's name line: name, level label, level, and the role badge. */
export function whoHtml(o: { name: string; levelLabel: string; level: number | string; role?: string | undefined }): string {
  return (
    `<div class="prph-who"><em>${escapeHtml(o.name)}</em><span>${escapeHtml(o.levelLabel)}</span><b>${escapeHtml(String(o.level))}</b>` +
    `${o.role ? `<span class="prph-job">${escapeHtml(o.role.toUpperCase())}</span>` : ''}</div>`
  );
}

/** An up or down figure against the worn dressphere ("▲279", "▼99") or a dash when it is the same. */
export function deltaHtml(delta: number): string {
  if (delta === 0) return '<span class="prph-delta is-eq">&mdash;</span>';
  return `<span class="prph-delta ${delta > 0 ? 'is-up' : 'is-dn'}">${delta > 0 ? '&#9650;' : '&#9660;'}${Math.abs(delta)}</span>`;
}
