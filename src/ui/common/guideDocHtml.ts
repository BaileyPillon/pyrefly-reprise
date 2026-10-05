import type { DocBlock, DocLootRow, GuideDoc } from '../../data/guides/doc-types.ts';
import { escapeHtml } from './html.ts';

/**
 * A guide document as the markup the reading sheet scrolls (`StrategyGuide.ts`).
 *
 * Every block of text is a **unit** (`.sgd__u`): a paragraph is one unit, every item of a list is its own,
 * a stat table is one stacked unit per enemy. The first unit of every block carries
 * `data-block="<index>"`, which is how the sheet finds the block it opens on (`./guideDoc.ts`). Nothing is
 * hidden or cut by the layout; the units are simply the document's boxes, in order.
 */

const U = 'sgd__u';

/** The text of a paragraph or a list item, in one inner block. */
const t = (text: string): string => `<span class="sgd__t">${escapeHtml(text)}</span>`;

const li = (text: string, block: number): string =>
  `<li class="${U}"${block >= 0 ? ` data-block="${block}"` : ''}>${t(text)}</li>`;

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
        `<div class="${U} sgd__doc-head" ${mark}><p class="sgd__title">${escapeHtml(b.title)}</p>` +
        `${b.tag ? `<p class="sgd__tag">${escapeHtml(b.tag)}</p>` : ''}</div>`
      );
    case 'p':
      return `<p class="${U} sgd__p" ${mark}>${t(b.text)}</p>`;
    case 'lead':
      return `<p class="${U} sgd__lead" ${mark}>${escapeHtml(b.text)}</p>`;
    case 'h3':
      return `<h4 class="${U} sgd__h3" ${mark}>${escapeHtml(b.text)}</h4>`;
    case 'ul':
    case 'ol':
      return listHtml(b.t, b.items, i);
    case 'field':
      return `<p class="${U} sgd__field" ${mark}><span class="sgd__flabel">${escapeHtml(b.label)}:</span> ${escapeHtml(b.value)}</p>`;
    case 'list':
      return `<p class="${U} sgd__flabel sgd__listlabel" ${mark}>${escapeHtml(b.label)}:</p>${listHtml('ul', b.items, -1)}`;
    case 'loot':
      return b.rows.map((r, k) => lootHtml(r, k === 0 ? i : -1)).join('');
    case 'table':
      return (
        `<p class="${U} sgd__thead" ${mark}>${b.head.map(escapeHtml).join(' / ')}</p>` +
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
