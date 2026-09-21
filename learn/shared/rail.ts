/**
 * The view rail, right edge (`docs/concepts/atlas/REFERENCE.md` item 8).
 * Painted cutouts cannot orbit (AGENTS.md, the A frames say "Drag to tilt"),
 * so the rail exposes the drag mode's current state (Tilt while the subject
 * is still assembled/separated, Front once it has settled at 100% and drag
 * pans instead) plus zoom and a camera reset — separate from the slider's
 * own Reset, which only resets `explode`.
 */

import type { Store } from './store.ts';
import { requireEl } from './dom.ts';

export interface CameraControls {
  zoomIn(): void;
  zoomOut(): void;
  resetCamera(): void;
}

const ICONS: Record<string, string> = {
  tilt: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="4"/><path d="M12 3v18"/><path d="M18 9.5l3 2.5-3 2.5"/></svg>',
  front: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9 9h6v6H9z"/></svg>',
  closer: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5M8 11h6M11 8v6"/></svg>',
  wider: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5M8 11h6"/></svg>',
  reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v5h5"/></svg>',
  help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.1 1-1.1 1.8M12 17v.2"/></svg>',
};

export function renderRail(host: HTMLElement, store: Store, camera: CameraControls): () => void {
  host.innerHTML = `
    <button type="button" class="pyx-rail__btn" data-action="tilt">${ICONS['tilt']}<span>Tilt</span></button>
    <button type="button" class="pyx-rail__btn" data-action="front">${ICONS['front']}<span>Front</span></button>
    <button type="button" class="pyx-rail__btn" data-action="closer">${ICONS['closer']}<span>Closer</span></button>
    <button type="button" class="pyx-rail__btn" data-action="wider">${ICONS['wider']}<span>Wider</span></button>
    <button type="button" class="pyx-rail__btn" data-action="reset">${ICONS['reset']}<span>Reset</span></button>
    <button type="button" class="pyx-rail__btn" data-action="help" aria-expanded="false">${ICONS['help']}<span>Help</span></button>
    <div class="pyx-rail__help pyx-hidden" role="note">
      <p>Drag the stage to tilt it. Scroll or pinch to zoom. Click a piece to inspect it. Press Esc to back out, or "/" to search.</p>
    </div>
  `;

  const tiltBtn = requireEl<HTMLButtonElement>(host, '[data-action="tilt"]');
  const frontBtn = requireEl<HTMLButtonElement>(host, '[data-action="front"]');
  const helpBtn = requireEl<HTMLButtonElement>(host, '[data-action="help"]');
  const helpPanel = requireEl(host, '.pyx-rail__help');

  function paint(): void {
    const state = store.getState();
    const settled = state.explode >= 0.999;
    tiltBtn.classList.toggle('pyx-rail__btn--on', !settled);
    frontBtn.classList.toggle('pyx-rail__btn--on', settled);
  }

  function onClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-action]');
    if (button === null) return;
    switch (button.dataset['action']) {
      case 'tilt':
        store.dispatch({ type: 'setView', view: 'threeQuarter' });
        break;
      case 'front':
        store.dispatch({ type: 'setView', view: 'front' });
        break;
      case 'closer':
        camera.zoomIn();
        break;
      case 'wider':
        camera.zoomOut();
        break;
      case 'reset':
        camera.resetCamera();
        break;
      case 'help':
        helpPanel.classList.toggle('pyx-hidden');
        helpBtn.setAttribute('aria-expanded', helpPanel.classList.contains('pyx-hidden') ? 'false' : 'true');
        break;
      default:
        break;
    }
  }

  host.addEventListener('click', onClick);
  const unsubscribe = store.subscribe(paint);
  paint();

  return () => {
    unsubscribe();
    host.removeEventListener('click', onClick);
    host.innerHTML = '';
  };
}
