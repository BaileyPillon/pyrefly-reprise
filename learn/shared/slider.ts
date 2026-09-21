/**
 * The explode slider, bottom centre — "the signature"
 * (`docs/concepts/atlas/REFERENCE.md` item 4). A native `<input type=range>`
 * sits transparently over the drawn track so dragging, clicking and the
 * arrow keys all work for free; the bed/fill/ticks/knob underneath are
 * repainted from the store on every change.
 */

import type { Store } from './store.ts';
import { requireEl } from './dom.ts';

export interface SliderLabels {
  /** `explode` 0. Default "Assembled". */
  readonly start?: string;
  /** `explode` 1. Default "Every piece". */
  readonly end?: string;
  /** One line under the ends, e.g. "drag to take the boss apart". */
  readonly plain?: string;
  /** State caption for a given `explode` (0..1) and the specimen's total visible piece count. Defaults to "Whole subject" / "Separated parts" / "Inventory · N pieces". */
  readonly stateFor?: (explode: number, visibleCount: number) => string;
}

export interface SliderOptions {
  readonly labels?: SliderLabels;
  readonly visibleCount: () => number;
}

const TICKS = [0, 25, 50, 75, 100];

function defaultState(explode: number, count: number): string {
  if (explode <= 0) return 'Whole subject';
  if (explode >= 1) return `Inventory · ${count} pieces`;
  return 'Separated parts';
}

export function renderSlider(host: HTMLElement, store: Store, options: SliderOptions): () => void {
  const labels = options.labels ?? {};
  const startLabel = labels.start ?? 'Assembled';
  const endLabel = labels.end ?? 'Every piece';
  const plainLabel = labels.plain ?? 'drag to take it apart';
  const stateFor = labels.stateFor ?? defaultState;

  host.innerHTML = `
    <div class="pyx-slider__main">
      <div class="pyx-slider__top"><span class="pyx-caps pyx-slider__what">Pull it apart</span><span class="pyx-caps pyx-slider__state"></span></div>
      <div class="pyx-slider__track">
        <div class="pyx-slider__bed"></div>
        <div class="pyx-slider__fill"></div>
        ${TICKS.map((t) => `<i class="pyx-slider__tick" style="left:${t}%"></i>`).join('')}
        <div class="pyx-slider__knob"></div>
        <input type="range" class="pyx-slider__input" min="0" max="100" step="1" value="0" aria-label="Explode: how far apart the pieces are pulled">
      </div>
      <div class="pyx-slider__ends">
        <span class="pyx-end pyx-slider__start">${startLabel}</span>
        <span class="pyx-slider__plain">${plainLabel}</span>
        <span class="pyx-end pyx-slider__end">${endLabel}</span>
      </div>
    </div>
    <div class="pyx-slider__side">
      <span class="pyx-pct"><span class="pyx-pct__n">0</span><small>%</small></span>
      <div class="pyx-slider__ctl">
        <button type="button" class="pyx-btn-reset">Reset</button>
        <label class="pyx-labels"><span class="pyx-tog"></span>Labels</label>
      </div>
    </div>
  `;

  const input = requireEl<HTMLInputElement>(host, '.pyx-slider__input');
  const fill = requireEl(host, '.pyx-slider__fill');
  const knob = requireEl(host, '.pyx-slider__knob');
  const pct = requireEl(host, '.pyx-pct__n');
  const stateEl = requireEl(host, '.pyx-slider__state');
  const startEl = requireEl(host, '.pyx-slider__start');
  const endEl = requireEl(host, '.pyx-slider__end');
  const resetBtn = requireEl<HTMLButtonElement>(host, '.pyx-btn-reset');
  const labelsToggle = requireEl<HTMLLabelElement>(host, '.pyx-labels');

  function paint(): void {
    const state = store.getState();
    const percent = Math.round(state.explode * 100);
    input.value = String(percent);
    fill.style.width = `${percent}%`;
    knob.style.left = `${percent}%`;
    pct.textContent = String(percent);
    stateEl.textContent = stateFor(state.explode, options.visibleCount());
    startEl.classList.toggle('pyx-end--dim', percent > 0);
    endEl.classList.toggle('pyx-end--dim', percent < 100);
    labelsToggle.querySelector('.pyx-tog')?.classList.toggle('pyx-tog--off', !state.labels);
  }

  input.addEventListener('input', () => {
    store.dispatch({ type: 'setExplode', explode: Number(input.value) / 100 });
  });
  resetBtn.addEventListener('click', () => {
    store.dispatch({ type: 'setExplode', explode: 0 });
  });
  labelsToggle.addEventListener('click', (event) => {
    event.preventDefault();
    store.dispatch({ type: 'toggleLabels' });
  });

  const unsubscribe = store.subscribe(paint);
  paint();

  return () => {
    unsubscribe();
    host.innerHTML = '';
  };
}
