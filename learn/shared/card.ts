/**
 * The detail card, right side (`docs/concepts/atlas/REFERENCE.md` item 5):
 * tabs, a fact row with the cite, an honesty chip, Isolate / Show
 * everything, Clear selection, and two per-site hooks — an "extra" render
 * slot (site B draws its live control there) and an optional secondary
 * action beside Isolate (site A: "Fight this chapter").
 *
 * With nothing selected the card falls back to a plain specimen summary
 * (title, `factsLine`, a nudge to pick a piece) rather than going empty.
 */

import type { Piece, PieceCardTab, Specimen, TabSection } from './model.ts';
import type { Store } from './store.ts';
import { visiblePieces } from './store.ts';
import { escapeHtml, highlightNumbers } from './text.ts';

export interface CardAction {
  readonly label: string;
  readonly href: string;
}

export interface CardOptions {
  /** e.g. site A's "Fight this chapter". `piece` is `undefined` on the idle (nothing-selected) card. Return undefined to omit the action. */
  readonly secondaryAction?: (specimen: Specimen, piece: Piece | undefined) => CardAction | undefined;
  /** Site B's live-control slot. Called each time the card renders a selected piece; an optional returned cleanup runs before the next render. */
  readonly renderExtra?: (host: HTMLElement, specimen: Specimen, piece: Piece) => void | (() => void);
}

function tabSectionsHtml(sections: readonly TabSection[]): string {
  return sections
    .map(
      (section) => `
      <div class="pyx-answer">
        ${section.heading !== undefined ? `<div class="pyx-answer__lab">${escapeHtml(section.heading)}</div>` : ''}
        <div class="pyx-answer__tx">${escapeHtml(section.text)}</div>
        <div class="pyx-answer__ci">${escapeHtml(section.cite)}</div>
      </div>`,
    )
    .join('');
}

function tabBodyHtml(tab: PieceCardTab): string {
  const body = tab.body.length > 0 ? `<p class="pyx-card__tabtext">${escapeHtml(tab.body)}</p>` : '';
  const sections = tab.sections !== undefined && tab.sections.length > 0 ? tabSectionsHtml(tab.sections) : '';
  return body + sections;
}

/** `'34,200 HP'` -> a big number and a small unit, the way the frame's chain rows set them. */
function splitValue(value: string): { readonly big: string; readonly small: string } {
  const match = /^(.*\S)\s+(\S+)$/.exec(value);
  return match === null ? { big: value, small: '' } : { big: match[1] ?? value, small: match[2] ?? '' };
}

function actionHtml(secondary: CardAction | undefined): string {
  if (secondary === undefined) return '';
  return `<div class="pyx-actions"><a class="pyx-btn pyx-btn--ghost" href="${escapeHtml(secondary.href)}" target="_blank" rel="noopener"><span>${escapeHtml(secondary.label)}</span></a></div>`;
}

/**
 * The nothing-selected card. A specimen that brings its own `idle`
 * (`SpecimenIdle`) gets the approved frame's structural read — the chain of
 * battles in order, each with its level and HP — and everything else falls
 * back to the plain summary.
 */
function idleHtml(specimen: Specimen, secondary: CardAction | undefined): string {
  const idle = specimen.idle;
  if (idle === undefined) {
    return `
    <div class="pyx-card__bar"></div>
    <div class="pyx-card__in">
      <div class="pyx-card__eb"><span class="pyx-caps">Nothing selected</span></div>
      <h2 class="pyx-card__name">${escapeHtml(specimen.title)}</h2>
      <p class="pyx-card__body">${highlightNumbers(specimen.factsLine)}.</p>
      <p class="pyx-card__kind">Click a piece on the stage, or search, to see what this project knows about it.</p>
      ${actionHtml(secondary)}
    </div>`;
  }

  const rows = idle.rows
    .map((row, i) => {
      const value = splitValue(row.value);
      const sub = row.sub !== undefined ? `<div class="pyx-chain__pl">${escapeHtml(row.sub)}</div>` : '';
      return `<div class="pyx-chain__r">
        <span class="pyx-chain__i">${i + 1}</span>
        <div><div class="pyx-chain__nm">${escapeHtml(row.label)}</div>${sub}</div>
        <div class="pyx-chain__hp">${escapeHtml(value.big)}${value.small.length > 0 ? `<small>${escapeHtml(value.small)}</small>` : ''}</div>
      </div>`;
    })
    .join('');

  return `
    <div class="pyx-card__bar"></div>
    <div class="pyx-card__in pyx-chain">
      <div class="pyx-caps pyx-chain__eb">${escapeHtml(idle.eyebrow)}</div>
      <p class="pyx-chain__lede">${escapeHtml(idle.body)}</p>
      ${rows}
      <div class="pyx-chain__src">${idle.note !== undefined ? `${escapeHtml(idle.note)} ` : ''}${escapeHtml(idle.cite)}</div>
      ${actionHtml(secondary)}
    </div>`;
}

function detailHtml(piece: Piece, isolated: boolean): string {
  const card = piece.card;
  const activeTabId = card.tabs[0]?.id ?? '';
  return `
    <div class="pyx-card__bar" data-bar></div>
    <div class="pyx-card__in">
      <div class="pyx-card__eb">
        <span class="pyx-caps" data-eyebrow>${escapeHtml(card.eyebrow)}</span>
        ${card.honesty !== undefined ? `<span class="pyx-honest">${escapeHtml(card.honesty)}</span>` : ''}
      </div>
      <h2 class="pyx-card__name">${escapeHtml(piece.name)}</h2>
      <p class="pyx-card__body">${escapeHtml(card.body)}</p>
      <div class="pyx-card__kind">${escapeHtml(card.claimKind)}</div>
      ${
        card.tabs.length > 1
          ? `<div class="pyx-dtabs" role="tablist">
              ${card.tabs
                .map(
                  (tab) =>
                    `<button type="button" class="pyx-dtab${tab.id === activeTabId ? ' pyx-dtab--on' : ''}" data-tab-id="${escapeHtml(tab.id)}" role="tab">${escapeHtml(tab.label)}</button>`,
                )
                .join('')}
            </div>`
          : ''
      }
      <div class="pyx-card__tabcontent" data-tab-content>${card.tabs[0] !== undefined ? tabBodyHtml(card.tabs[0]) : ''}</div>
      <div class="pyx-facts-row">
        ${card.facts.map((fact) => `<div><div class="pyx-facts-row__l">${escapeHtml(fact.label)}</div><div class="pyx-facts-row__v">${escapeHtml(fact.value)}</div></div>`).join('')}
      </div>
      <div class="pyx-facts-note">${escapeHtml(card.cite)}</div>
      <div class="pyx-card__extra" data-extra></div>
      <div class="pyx-actions">
        <button type="button" class="pyx-btn pyx-btn--primary" data-isolate-toggle><span>${isolated ? 'Show everything' : 'Isolate'}</span></button>
      </div>
      <div class="pyx-clear"><button type="button" class="pyx-link" data-clear>Clear selection</button></div>
    </div>`;
}

export function renderCard(host: HTMLElement, specimen: Specimen, store: Store, options: CardOptions = {}): () => void {
  let currentPieceId: string | null = null;
  let currentIsolatedId: string | null = null;
  let extraCleanup: (() => void) | void = undefined;

  function findPiece(id: string): Piece | undefined {
    return specimen.pieces.find((p) => p.id === id);
  }

  function teardownExtra(): void {
    if (typeof extraCleanup === 'function') extraCleanup();
    extraCleanup = undefined;
  }

  function paint(): void {
    const state = store.getState();
    teardownExtra();
    currentIsolatedId = state.isolatedId;

    if (state.selectedId === null) {
      currentPieceId = null;
      host.className = 'pyx-card pyx-card--idle';
      host.innerHTML = idleHtml(specimen, options.secondaryAction?.(specimen, undefined));
      return;
    }

    const piece = findPiece(state.selectedId);
    if (piece === undefined) {
      currentPieceId = null;
      host.className = 'pyx-card pyx-card--idle';
      host.innerHTML = idleHtml(specimen, undefined);
      return;
    }

    currentPieceId = piece.id;
    const isolated = state.isolatedId === piece.id;
    host.className = 'pyx-card pyx-card--detail';
    host.innerHTML = detailHtml(piece, isolated);
    wireDetail(piece);
  }

  function activateTab(piece: Piece, tabId: string): void {
    const tab = piece.card.tabs.find((t) => t.id === tabId);
    const content = host.querySelector<HTMLElement>('[data-tab-content]');
    if (tab === undefined || content === null) return;
    content.innerHTML = tabBodyHtml(tab);
    host.querySelectorAll('.pyx-dtab').forEach((el) => el.classList.toggle('pyx-dtab--on', el.getAttribute('data-tab-id') === tabId));
  }

  function wireDetail(piece: Piece): void {
    host.querySelectorAll<HTMLButtonElement>('[data-tab-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['tabId'];
        if (id !== undefined) activateTab(piece, id);
      });
    });

    host.querySelector('[data-isolate-toggle]')?.addEventListener('click', () => {
      const state = store.getState();
      if (state.isolatedId === piece.id) {
        store.dispatch({ type: 'showEverything' });
      } else {
        store.dispatch({ type: 'isolate', pieceId: piece.id });
      }
    });

    host.querySelector('[data-clear]')?.addEventListener('click', () => {
      store.dispatch({ type: 'showEverything' });
      store.dispatch({ type: 'clearSelection' });
    });

    const bar = host.querySelector<HTMLElement>('[data-bar]');
    const system = specimen.systems.find((s) => s.id === piece.systemId);
    if (bar !== null && system !== undefined) {
      bar.style.background = system.colour;
      const eyebrow = host.querySelector<HTMLElement>('[data-eyebrow]');
      if (eyebrow !== null) eyebrow.style.color = system.colour;
    }

    const secondary = options.secondaryAction?.(specimen, piece);
    if (secondary !== undefined) {
      const actions = host.querySelector<HTMLElement>('.pyx-actions');
      if (actions !== null) {
        const a = document.createElement('a');
        a.className = 'pyx-btn pyx-btn--ghost';
        a.href = secondary.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = `<span>${escapeHtml(secondary.label)}</span>`;
        actions.appendChild(a);
      }
    }

    if (options.renderExtra !== undefined) {
      const extraHost = host.querySelector<HTMLElement>('[data-extra]');
      if (extraHost !== null) extraCleanup = options.renderExtra(extraHost, specimen, piece) ?? undefined;
    }
  }

  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    // Re-render whenever the selected or isolated piece identity changes (the Isolate/Show
    // everything button's own label depends on isolatedId even when selectedId is unchanged —
    // isolating the already-selected piece changes only isolatedId), or the visible set shifts
    // under a still-selected piece.
    if (state.selectedId !== currentPieceId || state.isolatedId !== currentIsolatedId) {
      paint();
      return;
    }
    if (state.selectedId !== null) {
      const stillVisible = visiblePieces(specimen, state).some((p) => p.id === state.selectedId);
      if (!stillVisible) paint();
    }
  });
  paint();

  return () => {
    unsubscribe();
    teardownExtra();
    host.innerHTML = '';
  };
}
