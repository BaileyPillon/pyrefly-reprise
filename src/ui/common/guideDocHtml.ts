import type { DocBlock, DocLootRow, GuideDoc } from '../../data/guides/doc-types.ts';
import { escapeHtml } from './html.ts';

/**
 * A guide document as the markup the panel pages through (`StrategyGuide.ts`).
 *
 * Every block of text is a **unit** (`.sgd__u`): the panel hides whole units rather than clamping a
 * height through the middle of one, so a line is never sliced. A paragraph is one unit, every item
 * of a list is its own, a stat table is one stacked unit per enemy. A unit that introduces what
 * follows (`head`, `lead`, `h3`, a list's label) carries `.sgd__kn` ("keep with next") so a page
 * never ends on it. A plain-text unit (a paragraph or a list item) is also **split** (`.sgd__split`,
 * its text in one `.sgd__t`): when the next whole unit does not fit the rest of a page the panel may
 * show its first lines there and the rest on the next page, always cutting between two lines, never
 * through one. The first unit of every block carries `data-block="<index>"`, which is how the panel
 * finds the block it opens on (`./guideDoc.ts`).
 */

const U = 'sgd__u';
const KN = 'sgd__kn';
const SPLIT = 'sgd__split';

/** The text of a split unit, in the one inner block the panel shifts to show a later part of it. */
const t = (text: string): string => `<span class="sgd__t">${escapeHtml(text)}</span>`;

const li = (text: string, block: number): string =>
  `<li class="${U} ${SPLIT}"${block >= 0 ? ` data-block="${block}"` : ''}>${t(text)}</li>`;

function listHtml(tag: 'ul' | 'ol', items: readonly string[], block: number): string {
  return `<${tag} class="sgd__${tag}">${items.map((t, k) => li(t, k === 0 ? block : -1)).join('')}</${tag}>`;
}

const row = (label: string, value: string): string =>
  `<p class="sgd__lrow"><span class="sgd__flabel">${escapeHtml(label)}:</span> ${escapeHtml(value)}</p>`;

function lootHtml(r: DocLootRow, block: number): string {
  return (
    `<div class="${U} sgd__loot"${block >= 0 ? ` data-block="${block}"` : ''}>` +
    `<p class="sgd__lname">${escapeHtml(r.enemy)}</p>${row('HP', r.hp)}${row('Steal', r.steal)}${row('Drop', r.drop)}</div>`
  );
}

function blockHtml(b: DocBlock, i: number): string {
  const mark = `data-block="${i}"`;
  switch (b.t) {
    case 'head':
      return (
        `<div class="${U} ${KN} sgd__doc-head" ${mark}><p class="sgd__title">${escapeHtml(b.title)}</p>` +
        `${b.tag ? `<p class="sgd__tag">${escapeHtml(b.tag)}</p>` : ''}</div>`
      );
    case 'p':
      return `<p class="${U} ${SPLIT} sgd__p" ${mark}>${t(b.text)}</p>`;
    case 'lead':
      return `<p class="${U} ${KN} sgd__lead" ${mark}>${escapeHtml(b.text)}</p>`;
    case 'h3':
      return `<h4 class="${U} ${KN} sgd__h3" ${mark}>${escapeHtml(b.text)}</h4>`;
    case 'ul':
    case 'ol':
      return listHtml(b.t, b.items, i);
    case 'field':
      return `<p class="${U} sgd__field" ${mark}><span class="sgd__flabel">${escapeHtml(b.label)}:</span> ${escapeHtml(b.value)}</p>`;
    case 'list':
      return `<p class="${U} ${KN} sgd__flabel sgd__listlabel" ${mark}>${escapeHtml(b.label)}:</p>${listHtml('ul', b.items, -1)}`;
    case 'loot':
      return b.rows.map((r, k) => lootHtml(r, k === 0 ? i : -1)).join('');
    case 'table':
      return (
        `<p class="${U} ${KN} sgd__thead" ${mark}>${b.head.map(escapeHtml).join(' / ')}</p>` +
        b.rows
          .map(
            (r) =>
              `<p class="${U} sgd__trow"><span class="sgd__flabel">${escapeHtml(r[0] ?? '')}:</span> ${escapeHtml(r.slice(1).join(' '))}</p>`,
          )
          .join('')
      );
    case 'hint':
      return (
        `<div class="${U} sgd__hint sgd__hint--${b.kind}" ${mark}><p class="sgd__hint-title">${escapeHtml(b.title)}</p>` +
        `<p class="sgd__hint-kind">${b.kind === 'warning' ? 'Warning' : 'Helpful Hint'}</p>` +
        `<p class="sgd__hint-text">${escapeHtml(b.text)}</p></div>`
      );
  }
}

/** The whole document, in order. */
export function docHtml(doc: GuideDoc): string {
  return doc.blocks.map((b, i) => blockHtml(b, i)).join('');
}
