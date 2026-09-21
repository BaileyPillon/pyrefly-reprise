/**
 * The systems/components panel, left (`docs/concepts/atlas/REFERENCE.md`
 * item 3): one row per `System` with a colour dot, name, count and on/off
 * toggle, optional preset tabs, and a footer with the total visible count
 * and a Hide all / Show all link.
 */

import type { Specimen, System } from './model.ts';
import type { Store } from './store.ts';
import { escapeHtml } from './text.ts';

export interface PresetTab {
  readonly label: string;
  readonly systemIds: readonly string[];
}

export interface PanelOptions {
  readonly presetTabs?: readonly PresetTab[];
  /** Optional one-line caption shown under a system's name, keyed by system id. */
  readonly systemBlurbs?: Readonly<Record<string, string>>;
}

function allSystemIds(specimen: Specimen): string[] {
  return specimen.systems.map((s) => s.id);
}

function visibleCount(specimen: Specimen, hidden: ReadonlySet<string>): number {
  return specimen.pieces.filter((p) => !hidden.has(p.systemId)).length;
}

function rowHtml(system: System, hidden: boolean, blurb: string | undefined): string {
  return `
    <div class="pyx-sys${hidden ? ' pyx-sys--off' : ''}" data-system-id="${escapeHtml(system.id)}">
      <span class="pyx-sys__dot" style="background:${escapeHtml(system.colour)}"></span>
      <div class="pyx-sys__nm">${escapeHtml(system.name)}</div>
      <span class="pyx-sys__ct">${system.count}</span>
      <button type="button" class="pyx-sys__tog" role="switch" aria-checked="${hidden ? 'false' : 'true'}"
        aria-label="Show or hide ${escapeHtml(system.name)}" data-toggle-system="${escapeHtml(system.id)}"></button>
      ${blurb !== undefined ? `<div class="pyx-sys__pl">${escapeHtml(blurb)}</div>` : ''}
    </div>`;
}

/** Mounts the panel into `host` and wires it to `store`. Returns an unsubscribe/cleanup function. */
export function renderPanel(host: HTMLElement, specimen: Specimen, store: Store, options: PanelOptions = {}): () => void {
  const tabs = options.presetTabs ?? [];

  host.innerHTML = `
    <div class="pyx-panel__head"><span class="pyx-caps">Systems</span><span class="pyx-panel__num pyx-num">${specimen.systems.length}</span></div>
    ${
      tabs.length > 0
        ? `<div class="pyx-panel__tabs" role="tablist">
            <button type="button" class="pyx-tab pyx-tab--on" data-preset="all" role="tab" aria-selected="true">All</button>
            ${tabs
              .map(
                (tab, i) =>
                  `<button type="button" class="pyx-tab" data-preset="${i}" role="tab" aria-selected="false">${escapeHtml(tab.label)}</button>`,
              )
              .join('')}
          </div>`
        : ''
    }
    <div class="pyx-panel__list"></div>
    <div class="pyx-panel__foot"><span><b class="pyx-num pyx-panel__visible">0</b> pieces visible</span>
      <button type="button" class="pyx-link pyx-panel__hideall">Hide all</button></div>
  `;

  const list = host.querySelector<HTMLElement>('.pyx-panel__list');
  const visibleEl = host.querySelector<HTMLElement>('.pyx-panel__visible');
  const hideAllBtn = host.querySelector<HTMLButtonElement>('.pyx-panel__hideall');
  if (list === null || visibleEl === null || hideAllBtn === null) {
    throw new Error('panel.ts: template markup missing an expected element');
  }

  function paint(): void {
    const state = store.getState();
    if (list === null || visibleEl === null || hideAllBtn === null) return;
    list.innerHTML = specimen.systems.map((system) => rowHtml(system, state.hiddenSystems.has(system.id), options.systemBlurbs?.[system.id])).join('');
    visibleEl.textContent = String(visibleCount(specimen, state.hiddenSystems));
    const allHidden = specimen.systems.every((s) => state.hiddenSystems.has(s.id));
    hideAllBtn.textContent = allHidden ? 'Show all' : 'Hide all';
  }

  function onClick(event: Event): void {
    const target = event.target as HTMLElement;
    const toggleId = target.closest<HTMLElement>('[data-toggle-system]')?.dataset['toggleSystem'];
    if (toggleId !== undefined) {
      store.dispatch({ type: 'toggleSystem', systemId: toggleId });
      return;
    }
    const presetBtn = target.closest<HTMLElement>('[data-preset]');
    if (presetBtn !== null) {
      const preset = presetBtn.dataset['preset'];
      if (preset === undefined) return;
      host.querySelectorAll('.pyx-tab').forEach((el) => el.classList.toggle('pyx-tab--on', el === presetBtn));
      host.querySelectorAll('.pyx-tab').forEach((el) => el.setAttribute('aria-selected', el === presetBtn ? 'true' : 'false'));
      if (preset === 'all') {
        store.dispatch({ type: 'showAll' });
      } else {
        const tab = tabs[Number(preset)];
        if (tab !== undefined) {
          store.dispatch({ type: 'showOnly', allSystemIds: allSystemIds(specimen), visibleSystemIds: tab.systemIds });
        }
      }
    }
  }

  host.addEventListener('click', onClick);
  hideAllBtn.addEventListener('click', () => {
    const state = store.getState();
    const allHidden = specimen.systems.every((s) => state.hiddenSystems.has(s.id));
    store.dispatch(allHidden ? { type: 'showAll' } : { type: 'hideAll', allSystemIds: allSystemIds(specimen) });
  });

  const unsubscribe = store.subscribe(paint);
  paint();

  return () => {
    unsubscribe();
    host.removeEventListener('click', onClick);
    host.innerHTML = '';
  };
}
