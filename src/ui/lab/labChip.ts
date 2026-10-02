/**
 * CAMERA LAB: the chip at the top of a lab fight, and the switches it opens.
 *
 * The chip names the lab state and its keys; a click (or `L`) opens the switches; `1`-`4` flip
 * STYLE, VIEWS, MENU and TARGET CUT at once (none of these keys is the game's: `Input.ts` maps
 * letters and arrows, the pause takes P, H, F, Q, E; the HUD panels take G, I, J, N). Every
 * switch is a button too, for a phone or a mouse. Never takes keyboard focus.
 */

import { labSession } from '../../engine/lab/LabSession.ts';
import type { LabGame, LabSwitches } from '../../engine/lab/LabTypes.ts';
import { SWITCH_ROWS, flipPatch, patchFor, rowHtml, rowValue, type LabRowId } from './labRows.ts';

const KEY_ROW: Readonly<Record<string, LabRowId>> = { Digit1: 'style', Digit2: 'views', Digit3: 'menu', Digit4: 'target' };

export class LabChip {
  readonly el: HTMLElement;
  private readonly pop: HTMLElement;
  private readonly unsub: () => void;

  constructor(
    root: HTMLElement,
    private readonly game: LabGame,
  ) {
    this.el = document.createElement('div');
    this.el.className = `lab-chip ig${game === 'ffx2' ? ' ig--ffx2' : ''}`;
    this.el.dataset['role'] = 'camera-lab-chip';
    this.el.setAttribute('role', 'button');
    this.el.addEventListener('mousedown', (e) => e.preventDefault());
    this.el.addEventListener('click', () => this.toggle());
    this.pop = document.createElement('div');
    this.pop.className = `lab-pop ig${game === 'ffx2' ? ' ig--ffx2' : ''}`;
    this.pop.hidden = true;
    this.pop.addEventListener('mousedown', (e) => e.preventDefault());
    this.pop.addEventListener('click', (e) => this.onPopClick(e));
    root.append(this.el, this.pop);
    window.addEventListener('keydown', this.onKey);
    this.unsub = labSession().onChange(() => this.render());
    this.render();
  }

  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyL') {
      this.toggle();
      return;
    }
    const row = KEY_ROW[e.code];
    if (row) labSession().set(flipPatch(row, labSession().switches));
  };

  private onPopClick(e: MouseEvent): void {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]');
    const m = btn ? /^lab-pop:([a-z]+):(.+)$/.exec(btn.dataset['action'] ?? '') : null;
    if (m) labSession().set(patchFor(m[1] as LabRowId, m[2]!));
    if (btn?.dataset['action'] === 'lab-pop-close') this.toggle(false);
  }

  toggle(open = this.pop.hidden): void {
    this.pop.hidden = !open;
    this.render();
  }

  private render(): void {
    const sw: Readonly<LabSwitches> = labSession().switches;
    const style = sw.style === 'clair' ? 'Clair Obscur' : 'Persona';
    const target = sw.style === 'clair' && this.game === 'ffx' ? (sw.targetCut ? 'on' : 'off') : 'n/a';
    this.el.innerHTML =
      `<b>CAMERA LAB · TEST</b><span>${style}</span><span>views ${sw.views ? 'rear' : 'today'}</span>` +
      `<span>menu ${sw.menuAtHero ? 'hero' : 'panel'}</span><span>target cut ${target}</span>` +
      `<span class="lab-chip__keys">L switches · 1 style · 2 views · 3 menu · 4 target</span>`;
    if (this.pop.hidden) return;
    const rows = SWITCH_ROWS.map((r) => rowHtml(r, rowValue(r.id, sw, 'seymour-flux'), false, 'lab-pop')).join('');
    this.pop.innerHTML = `${rows}<div class="lab-pop__foot">Takes effect on the next cut${this.game === 'ffx2' ? ' (FFX-2: never while a menu is open)' : ''}.
      <button type="button" class="lab-opt" data-action="lab-pop-close">Close (L)</button></div>`;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKey);
    this.unsub();
    this.el.remove();
    this.pop.remove();
  }
}
