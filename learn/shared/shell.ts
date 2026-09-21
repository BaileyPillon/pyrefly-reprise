/**
 * `mountExplorer`: mounts the nine pattern elements
 * (`docs/concepts/atlas/REFERENCE.md`) into `root` and wires them to one
 * `Store` — the single entry point every learning site (A/B/C) calls. See
 * `docs/plans/learning-sites.md` "The shared explorer engine".
 */

import type { Piece, Specimen } from './model.ts';
import { accentForGame } from './model.ts';
import { createStore, initialExplorerState } from './store.ts';
import type { Store } from './store.ts';
import { buildIndex, search } from './search.ts';
import type { SearchIndex } from './search.ts';
import { renderPanel } from './panel.ts';
import type { PresetTab } from './panel.ts';
import { renderSlider } from './slider.ts';
import type { SliderLabels } from './slider.ts';
import { renderCard } from './card.ts';
import type { CardAction } from './card.ts';
import { renderRail } from './rail.ts';
import { renderSwitcher } from './switcher.ts';
import type { SwitcherEntry, SwitcherHandle } from './switcher.ts';
import { renderStage } from './stage.ts';
import type { StagePainterFactory } from './stage.ts';
import { renderHint } from './hint.ts';
import { installFonts } from './urls.ts';
import { highlightNumbers } from './text.ts';
import { requireEl } from './dom.ts';

export type { SwitcherEntry } from './switcher.ts';
export type { PresetTab } from './panel.ts';
export type { CardAction } from './card.ts';

export interface MountExplorerOptions {
  readonly theme: 'paper' | 'studio' | 'cinema';
  readonly siteName: string;
  readonly siteTagline: string;
  readonly specimens: readonly SwitcherEntry[];
  readonly initialSpecimenId: string;
  readonly getSpecimen: (id: string) => Specimen;
  readonly onSpecimenChange?: (id: string) => void;
  readonly presetTabs?: readonly PresetTab[];
  readonly systemBlurbs?: Readonly<Record<string, string>>;
  readonly sliderLabels?: SliderLabels;
  readonly secondaryAction?: (specimen: Specimen, piece: Piece | undefined) => CardAction | undefined;
  readonly renderCardExtra?: (host: HTMLElement, specimen: Specimen, piece: Piece) => void | (() => void);
  /** A site's own stage painter (site B). Omitted, the stage picks the authored or generic one itself. */
  readonly createStagePainter?: StagePainterFactory;
  readonly credits?: string;
}

export interface ExplorerHandle {
  readonly store: Store;
  setSpecimen(id: string): void;
  destroy(): void;
}

const SHELL_HTML = `
  <div class="pyx-viewport">
    <div class="pyx-canvas">
      <div class="pyx-stage" data-slot="stage"></div>
      <div class="pyx-title" data-slot="title">
        <div class="pyx-caps pyx-title__eyebrow" data-title-eyebrow></div>
        <h1 class="pyx-title__name" data-title-name></h1>
        <div class="pyx-title__facts" data-title-facts></div>
      </div>
      <div class="pyx-switcher" data-slot="switcher"></div>
      <div class="pyx-search" data-slot="search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>
        <input type="search" class="pyx-search__input" placeholder="Find a piece" aria-label="Search">
        <b class="pyx-kbd">/</b>
        <div class="pyx-search__results pyx-hidden" data-search-results></div>
      </div>
      <div class="pyx-rail" data-slot="rail"></div>
      <div class="pyx-panel" data-slot="panel"></div>
      <div class="pyx-slider" data-slot="slider"></div>
      <div class="pyx-card" data-slot="card"></div>
      <div data-slot="hint"></div>
    </div>
  </div>
`;

function qs(root: HTMLElement, slot: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (el === null) throw new Error(`shell.ts: missing slot "${slot}"`);
  return el;
}

export function mountExplorer(root: HTMLElement, options: MountExplorerOptions): ExplorerHandle {
  installFonts();

  root.innerHTML = SHELL_HTML;
  const canvas = requireEl(root, '.pyx-canvas');
  canvas.setAttribute('data-pyx-theme', options.theme);

  const stageHost = qs(root, 'stage');
  const titleEyebrow = root.querySelector<HTMLElement>('[data-title-eyebrow]')!;
  const titleName = root.querySelector<HTMLElement>('[data-title-name]')!;
  const titleFacts = root.querySelector<HTMLElement>('[data-title-facts]')!;
  const switcherHost = qs(root, 'switcher');
  const searchHost = qs(root, 'search');
  const searchInput = searchHost.querySelector<HTMLInputElement>('.pyx-search__input')!;
  const searchResults = searchHost.querySelector<HTMLElement>('[data-search-results]')!;
  const railHost = qs(root, 'rail');
  const panelHost = qs(root, 'panel');
  const sliderHost = qs(root, 'slider');
  const cardHost = qs(root, 'card');
  const hintHost = qs(root, 'hint');

  const store = createStore(initialExplorerState);

  let currentId = options.initialSpecimenId;
  let currentSpecimen = options.getSpecimen(currentId);
  let searchIndex: SearchIndex = buildIndex(currentSpecimen);
  let teardownSpecimenParts: () => void = () => {};

  function paintTitle(): void {
    titleEyebrow.textContent = `${options.siteName} · ${options.siteTagline}`;
    titleName.textContent = currentSpecimen.title;
    titleFacts.innerHTML = highlightNumbers(currentSpecimen.factsLine);
    canvas.setAttribute('data-pyx-accent', accentForGame(currentSpecimen.game));
  }

  function mountSpecimenParts(): void {
    const panelDestroy = renderPanel(panelHost, currentSpecimen, store, {
      presetTabs: options.presetTabs,
      systemBlurbs: options.systemBlurbs,
    });
    const sliderDestroy = renderSlider(sliderHost, store, {
      labels: options.sliderLabels,
      visibleCount: () => currentSpecimen.pieces.filter((p) => !store.getState().hiddenSystems.has(p.systemId)).length,
    });
    const cardDestroy = renderCard(cardHost, currentSpecimen, store, {
      secondaryAction: options.secondaryAction,
      renderExtra: options.renderCardExtra,
    });
    const stageHandle = renderStage(stageHost, currentSpecimen, store, {
      ...(options.createStagePainter !== undefined ? { createPainter: options.createStagePainter } : {}),
    });
    const railDestroy = renderRail(railHost, store, stageHandle.camera);

    teardownSpecimenParts = () => {
      panelDestroy();
      sliderDestroy();
      cardDestroy();
      stageHandle.destroy();
      railDestroy();
    };
  }

  function closeSearch(): void {
    searchResults.classList.add('pyx-hidden');
    searchResults.innerHTML = '';
  }

  function paintSearchResults(query: string): void {
    const ids = search(searchIndex, query, 8);
    if (ids.length === 0) {
      closeSearch();
      return;
    }
    searchResults.classList.remove('pyx-hidden');
    searchResults.innerHTML = ids
      .map((id) => {
        const piece = currentSpecimen.pieces.find((p) => p.id === id);
        if (piece === undefined) return '';
        const system = currentSpecimen.systems.find((s) => s.id === piece.systemId);
        return `<button type="button" class="pyx-search__result" data-result-id="${id}" data-result-system="${piece.systemId}">${piece.name}<span>${system?.name ?? ''}</span></button>`;
      })
      .join('');
  }

  searchInput.addEventListener('input', () => paintSearchResults(searchInput.value));
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.length > 0) paintSearchResults(searchInput.value);
  });
  searchResults.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-result-id]');
    if (button === null) return;
    const pieceId = button.dataset['resultId'];
    const systemId = button.dataset['resultSystem'];
    if (pieceId !== undefined && systemId !== undefined) {
      store.dispatch({ type: 'select', pieceId, systemId });
    }
    searchInput.value = '';
    closeSearch();
    searchInput.blur();
  });
  document.addEventListener('click', (event) => {
    if (!searchHost.contains(event.target as Node)) closeSearch();
  });

  function onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const editable = target.matches('input, textarea, [contenteditable="true"]');

    if (event.key === '/' && !editable) {
      event.preventDefault();
      searchInput.focus();
      return;
    }
    if (event.key === 'Escape') {
      if (document.activeElement === searchInput && searchInput.value.length > 0) {
        searchInput.value = '';
        closeSearch();
        return;
      }
      store.dispatch({ type: 'escape' });
    }
  }
  document.addEventListener('keydown', onKeydown);

  const switcherHandle: SwitcherHandle = renderSwitcher(switcherHost, options.specimens, currentId, {
    onSelect: (id) => setSpecimen(id),
  });
  const hintDestroy = renderHint(hintHost, store, { credits: options.credits ?? 'Unofficial fan tribute' });

  function setSpecimen(id: string): void {
    if (id === currentId) return;
    const entry = options.specimens.find((s) => s.id === id);
    if (entry === undefined || !entry.enabled) return;

    teardownSpecimenParts();
    currentId = id;
    currentSpecimen = options.getSpecimen(id);
    searchIndex = buildIndex(currentSpecimen);
    store.dispatch({ type: 'reset' });
    paintTitle();
    switcherHandle.setCurrent(id);
    mountSpecimenParts();
    options.onSpecimenChange?.(id);
  }

  paintTitle();
  mountSpecimenParts();

  return {
    store,
    setSpecimen,
    destroy(): void {
      teardownSpecimenParts();
      switcherHandle.destroy();
      hintDestroy();
      document.removeEventListener('keydown', onKeydown);
      root.innerHTML = '';
    },
  };
}
