/**
 * The one-line hint strip, bottom left, plus the credits line, bottom right
 * (`docs/concepts/atlas/REFERENCE.md` items 1 and 9). The hint's drag verb
 * flips from "tilt" to "pan" once the subject has settled into its
 * inventory grid at `explode` 1, matching the drag behaviour itself.
 */

import type { Store } from './store.ts';

export interface HintOptions {
  readonly credits: string;
  readonly onSourcesClick?: () => void;
}

export function renderHint(host: HTMLElement, store: Store, options: HintOptions): () => void {
  host.innerHTML = `
    <div class="pyx-hint">
      <span class="pyx-hint__drag">Drag to tilt</span>
      <i>·</i><span>Scroll to zoom</span>
      <i>·</i><span class="pyx-hint__act">Click a piece to inspect</span>
    </div>
    <div class="pyx-credits">Unofficial fan tribute <i>·</i> <button type="button" class="pyx-link pyx-credits__sources">sources &amp; credits</button></div>
  `;

  const dragEl = host.querySelector<HTMLElement>('.pyx-hint__drag');
  const sourcesBtn = host.querySelector<HTMLButtonElement>('.pyx-credits__sources');
  if (dragEl === null || sourcesBtn === null) {
    throw new Error('hint.ts: template markup missing an expected element');
  }
  const creditsLine = host.querySelector<HTMLElement>('.pyx-credits');
  if (creditsLine !== null) {
    creditsLine.childNodes[0]!.textContent = `${options.credits} `;
  }

  function paint(): void {
    const settled = store.getState().explode >= 0.999;
    dragEl!.textContent = settled ? 'Drag to pan' : 'Drag to tilt';
  }

  if (options.onSourcesClick !== undefined) {
    sourcesBtn.addEventListener('click', options.onSourcesClick);
  }

  const unsubscribe = store.subscribe(paint);
  paint();

  return () => {
    unsubscribe();
    host.innerHTML = '';
  };
}
