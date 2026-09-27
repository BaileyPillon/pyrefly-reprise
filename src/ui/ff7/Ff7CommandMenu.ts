/**
 * The FF7 command window's controller (FF7 only): keys, taps, the target
 * finger, the Esc claim and the Wait level. The rules live in the pure
 * `ff7MenuModel.ts`; the drawing in `ff7MenuHtml.ts`.
 *
 * Keys (the app's own map, as the FFX-2 menu reads them): arrows move; Enter,
 * Space or Z confirm; Esc, X or Backspace cancel; **H is SELECT**, the help
 * window [spec §3.5, §5.9]. Taps: a command row chooses it; a figure moves the
 * finger to it and a second tap confirms; an unmarked strip beside the window's
 * left or right edge moves the finger to Change or Defend, a second tap chooses
 * it (our estimate of a touch way to FF7's "press left / right"); a tap on the scene while a list or
 * the target step is open backs out one step (a touch stand-in for cancel,
 * our estimate). The field is never lit or dimmed: FF7 marks a target with the
 * finger alone (spec §8: no bracket).
 */

import type { AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from '../ffx/cancelClaim.ts';
import type { Ff7Geometry, Rect } from './ff7Geometry.ts';
import { menuHtml, targetCursorsHtml, targetHitsHtml, type MenuContext } from './ff7MenuHtml.ts';
import {
  aimedTargets,
  chooseRow,
  chooseSlot,
  menuLevel,
  openMenu,
  step,
  tapEdge,
  tapTarget,
  type EdgeKind,
  type Ff7MenuState,
  type MenuInput,
  type StepResult,
} from './ff7MenuModel.ts';

const KEYS: Record<string, MenuInput> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'confirm', NumpadEnter: 'confirm', Space: 'confirm', KeyZ: 'confirm',
  Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel',
  KeyH: 'help',
};

export interface CommandMenuDeps {
  /** Where the menu windows, the finger on a target and the tap areas go. */
  layer: HTMLElement;
  geometry: () => Ff7Geometry;
  context: () => MenuContext;
  /** A figure's painted box on screen, when the field offers one. */
  targetRect: (id: CombatantId) => Rect | null;
  /** A figure's chest point, when there is no box. */
  targetPoint: (id: CombatantId) => { x: number; y: number } | null;
  /** Called after every change (the help line and the Wait level listen). */
  onChange?: (state: Ff7MenuState | null) => void;
}

export class Ff7CommandMenu {
  private st: Ff7MenuState | null = null;
  private resolve: ((c: Command) => void) | null = null;
  private readonly levelListeners = new Set<(level: 'top' | 'deep') => void>();
  private readonly onKey = (e: KeyboardEvent): void => this.key(e);
  private readonly onClick = (e: MouseEvent): void => this.click(e);

  constructor(private readonly deps: CommandMenuDeps) {
    deps.layer.addEventListener('click', this.onClick);
  }

  get state(): Ff7MenuState | null {
    return this.st;
  }

  get isOpen(): boolean {
    return this.st !== null;
  }

  /** Open the window for one fighter's turn; resolves with the chosen command. */
  open(commands: readonly AvailableCommand[]): Promise<Command> {
    this.close();
    this.st = openMenu(commands);
    releaseCancel(); // Esc belongs to the pause on the four slots
    window.addEventListener('keydown', this.onKey);
    this.changed();
    return new Promise<Command>((resolve) => {
      this.resolve = resolve;
    });
  }

  /** Tear the window down; an open promise is abandoned, never resolved (HudPort.closeCommandMenu). */
  close(): void {
    if (!this.st) return;
    window.removeEventListener('keydown', this.onKey);
    this.st = null;
    this.resolve = null;
    releaseCancel();
    this.changed();
  }

  destroy(): void {
    this.close();
    this.deps.layer.removeEventListener('click', this.onClick);
    this.levelListeners.clear();
  }

  /** One press, as the keyboard sends it (tests call this too). Returns whether the menu used it. */
  press(input: MenuInput): boolean {
    if (!this.st) return false;
    return this.apply(step(this.st, input, (ids) => this.order(ids)), input === 'cancel');
  }

  /** Subscribe to the Wait level ('top' on the four slots, 'deep' in a list or aiming). */
  onLevel(listener: (level: 'top' | 'deep') => void): () => void {
    this.levelListeners.add(listener);
    if (this.st) listener(menuLevel(this.st));
    return () => this.levelListeners.delete(listener);
  }

  /**
   * The "Limit" letter colour step, in place: the slot's letters are recoloured, nothing is rebuilt,
   * so a tap that lands between two steps still finds the row it pressed (a rebuild every 100 ms
   * swapped the element out from under a touch). False when there is no such label to recolour.
   */
  recolourLimit(colours: readonly string[]): boolean {
    const spans = this.deps.layer.querySelectorAll<HTMLElement>('.ff7-slot[data-slot="0"] span');
    if (!this.st || spans.length === 0) return false;
    spans.forEach((span, i) => {
      const c = colours[i];
      if (c && span.style.color !== c) span.style.color = c;
    });
    return true;
  }

  /** Redraw (a resize, a change of state). */
  render(): void {
    const layer = this.deps.layer;
    if (!this.st) {
      layer.innerHTML = '';
      return;
    }
    const g = this.deps.geometry();
    const deep = menuLevel(this.st) === 'deep';
    const aimed = aimedTargets(this.st).flatMap((id) => {
      const p = this.fingertip(id, g);
      return p ? [{ id, ...p }] : [];
    });
    const hits = this.st.view === 'target'
      ? this.st.targets.flatMap((id) => {
        const r = this.hitRect(id, g);
        return r ? [{ id, ...r }] : [];
      })
      : [];
    layer.innerHTML = (deep ? '<div class="ff7-scrim" data-scrim="1"></div>' : '') +
      menuHtml(g, this.st, this.deps.context()) + targetCursorsHtml(g, aimed) + targetHitsHtml(hits);
  }

  // ------------------------------------------------------------------ input

  private key(e: KeyboardEvent): void {
    const input = KEYS[e.code];
    if (!input || !this.st) return;
    if (this.press(input)) e.preventDefault();
  }

  private click(e: MouseEvent): void {
    if (!this.st) return;
    const el = (e.target as Element | null)?.closest?.('[data-slot],[data-row],[data-target],[data-edge],[data-scrim]') as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const order = (ids: CombatantId[]): CombatantId[] => this.order(ids);
    const d = el.dataset;
    if (d['target'] !== undefined) this.apply(tapTarget(this.st, d['target']), false);
    else if (d['edge'] !== undefined && this.st.view === 'top') this.apply(tapEdge(this.st, d['edge'] as EdgeKind), false);
    else if (d['slot'] !== undefined && this.st.view === 'top') this.apply(chooseSlot(this.st, Number(d['slot']), order), false);
    else if (d['row'] !== undefined && this.st.view !== 'top' && this.st.view !== 'target') this.apply(chooseRow(this.st, Number(d['row']), order), false);
    else if (d['scrim'] !== undefined) this.press('cancel');
  }

  private apply(r: StepResult, fromCancel: boolean): boolean {
    if (!this.st) return false;
    const before = menuLevel(this.st);
    this.st = r.state;
    if (r.done) {
      const resolve = this.resolve;
      const cmd = r.done;
      this.close();
      resolve?.(cmd);
      return true;
    }
    const after = menuLevel(this.st);
    if (after === 'deep') claimCancel();
    else if (before === 'deep') (fromCancel ? releaseCancelAfterPress : releaseCancel)();
    this.changed();
    return r.handled;
  }

  private changed(): void {
    this.render();
    const level = this.st ? menuLevel(this.st) : 'top';
    for (const l of this.levelListeners) l(level);
    this.deps.onChange?.(this.st);
  }

  // ---------------------------------------------------------------- targets

  /** Valid targets left to right on screen; ids with no position keep their order at the end. */
  private order(ids: CombatantId[]): CombatantId[] {
    const g = this.deps.geometry();
    const x = (id: CombatantId): number => this.fingertip(id, g)?.x ?? Number.POSITIVE_INFINITY;
    return ids.map((id, i) => ({ id, i, x: x(id) })).sort((a, b) => a.x - b.x || a.i - b.i).map((e) => e.id);
  }

  /** Where the fingertip touches a figure: a fifth of the way into its box, half way down [our estimate]. */
  private fingertip(id: CombatantId, g: Ff7Geometry): { x: number; y: number } | null {
    const r = this.deps.targetRect(id);
    if (r && r.w > 0) return { x: r.x + r.w * 0.2, y: r.y + r.h * 0.5 };
    const p = this.deps.targetPoint(id);
    return p ? { x: p.x - 4 * g.s, y: p.y } : null;
  }

  private hitRect(id: CombatantId, g: Ff7Geometry): Rect | null {
    const r = this.deps.targetRect(id);
    if (r && r.w > 0) return r;
    const p = this.deps.targetPoint(id);
    const half = 12 * g.s;
    return p ? { x: p.x - half, y: p.y - half * 1.5, w: 2 * half, h: 3 * half } : null;
  }
}
