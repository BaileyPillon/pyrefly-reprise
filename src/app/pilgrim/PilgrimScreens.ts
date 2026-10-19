/**
 * **The Pilgrimage's three screens** (hidden prototype, FFX only; Bailey, 2026-10-18, decision 122): the road, the boon pick and the run-over page. The markup is `./pilgrimMarkup.ts`; this file is the keys, the
 * clicks and the cursor. Each screen is an ordinary `Screen` that exposes `done`, as the flow's own screens do, and `./PilgrimFlow.ts` awaits it.
 *
 * Keys (the abstract buttons of `app/Input.ts`, so a pad and a keyboard act the same): the road, Enter begins and Esc goes back; the boon pick, Left and Right move in a row, Up and Down change row, Enter takes the card (and
 * then walks to the road) and Esc twice leaves the run; the run-over page, Enter is Again and Esc is Chapter select. A click or a tap on a card takes it, on a stop picks it, on a button presses it.
 *
 * Game case: FFX only.
 */

import './pilgrim.css';
import '../screens/frontend/frontend.css';
import '../screens/frontend/chapter-select-c.css';
import { Screen } from '../Screen.ts';
import { readSetting } from '../SaveData.ts';
import { chapterSelectCue } from '../saveFrontend.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { ControlsHint, type ControlHintItem } from '../../ui/common/ControlsHint.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import type { ChapterId } from '../../data/encounters.ts';
import { washUrl } from './pilgrimArt.ts';
import { boonHtml, overHtml, routeHtml, type BoonView } from './pilgrimMarkup.ts';
import { PILGRIM_FIRST_CHAPTER } from './route.ts';
import { chooseRoad, currentStop, leaveRun, nextOptions, pickBoon, summarize, type RunState } from './runState.ts';
import type { PilgrimRecord, RunKept } from './runStore.ts';

/** The shared shape: a root with the board's wash, a body that is repainted, a controls strip, and a `done`. */
abstract class PilgrimScreen<T> extends Screen {
  readonly done: Promise<T>;
  private resolveDone!: (v: T) => void;
  private settled = false;
  protected hint: ControlsHint | null = null;
  protected body: HTMLElement | null = null;

  constructor() {
    super();
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve;
    });
  }

  protected settle(v: T): void {
    if (this.settled) return;
    this.settled = true;
    this.resolveDone(v);
  }

  /** What `done` answers if the screen is torn down before the player chose (the pause menu's exits). */
  protected abstract readonly fallback: T;
  protected abstract hints(): ControlHintItem[];
  /** The chapter whose scene is the wash; null for no wash. */
  protected abstract washChapter(): ChapterId | null;
  protected abstract paint(): void;

  override enter(): void {
    installInkGoldStyles();
    this.root.className = 'screen fe ig pgx';
    const wash = this.washChapter();
    const url = wash ? washUrl(wash) : null;
    this.root.innerHTML = `${url ? `<div class="fe-cselect__wash" style="background-image:url(${url})"></div><div class="fe-cselect__veil"></div>` : ''}<div data-role="body"></div>`;
    this.body = this.root.querySelector('[data-role="body"]');
    this.hint = new ControlsHint({ root: this.root, items: this.hints() });
    this.hint.mount();
    this.paint();
    // PR-0466 (release 56): the run's screens follow OPTIONS > PRESENTATION > CHAPTER MUSIC like the board (an unknown value plays B).
    void audio.playMusic(chapterSelectCue(readSetting('chapterSelectMusic')), { fade: 1.2 }).catch(() => undefined);
    void this.app.fade('clear', 500);
  }

  override exit(): void {
    this.hint?.unmount();
    this.root.innerHTML = '';
    this.settle(this.fallback);
  }
}

// ------------------------------------------------------------------ (a) the road

/** How the road screen ended. */
export type RouteChoice = 'begin' | 'leave';

export class PilgrimRouteScreen extends PilgrimScreen<RouteChoice> {
  readonly name = 'pilgrim-route';
  protected readonly fallback: RouteChoice = 'leave';
  private readonly onResize = (): void => this.drawLinks();

  constructor(private readonly record: PilgrimRecord) {
    super();
  }

  protected hints(): ControlHintItem[] {
    return [
      { keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click the button', touch: 'Tap the button', label: 'begin', action: 'pg:begin' },
      { keyboard: 'Esc', gamepad: 'Circle', pointer: 'Esc', label: 'back', action: 'cancel' },
    ];
  }

  protected washChapter(): ChapterId {
    return PILGRIM_FIRST_CHAPTER;
  }

  protected paint(): void {
    if (this.body) this.body.innerHTML = routeHtml(this.record);
    window.addEventListener('resize', this.onResize, { passive: true });
    requestAnimationFrame(() => this.drawLinks());
    window.setTimeout(() => this.drawLinks(), 400); // the plates settle after the first frame
  }

  /** The road's links, drawn from where the cards landed (a fork is a Y: both stops of a tier join both of the next). */
  private drawLinks(): void {
    const tree = this.root.querySelector<HTMLElement>('[data-role="tree"]');
    const svg = this.root.querySelector<SVGSVGElement>('[data-role="links"]');
    if (!tree || !svg) return;
    const base = tree.getBoundingClientRect();
    if (base.width === 0 || getComputedStyle(svg).display === 'none') return;
    const tiers = [...tree.querySelectorAll<HTMLElement>('.pgx-tier')].map((t) => [...t.querySelectorAll<HTMLElement>('.pgx-node')]);
    let d = '';
    for (let t = 0; t < tiers.length - 1; t++) {
      for (const a of tiers[t]!) {
        for (const b of tiers[t + 1]!) {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const x1 = ra.right - base.left;
          const y1 = ra.top + ra.height * 0.4 - base.top;
          const x2 = rb.left - base.left;
          const y2 = rb.top + rb.height * 0.4 - base.top;
          const mx = (x1 + x2) / 2;
          const cls = b.classList.contains('pgx-node--elite') ? 'elite' : t === 0 ? 'go' : '';
          d += `<path class="${cls}" d="M${x1.toFixed(1)} ${y1.toFixed(1)} C ${mx.toFixed(1)} ${y1.toFixed(1)}, ${mx.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
        }
      }
    }
    svg.setAttribute('viewBox', `0 0 ${base.width.toFixed(1)} ${base.height.toFixed(1)}`);
    svg.innerHTML = d;
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    if (input.actions.includes('pg:begin') || input.consume('confirm') || input.consume('start')) {
      audio.playSfx('confirm');
      this.settle('begin');
    } else if (input.consume('cancel') || input.actions.includes('cancel')) {
      audio.playSfx('cancel');
      this.settle('leave');
    }
  }

  override trigger(name: string): boolean {
    if (name !== 'confirm') return false;
    this.settle('begin');
    return true;
  }

  override exit(): void {
    window.removeEventListener('resize', this.onResize);
    super.exit();
  }

  override snapshot(): Record<string, unknown> {
    return { screen: 'pilgrim-route', stops: this.root.querySelectorAll('.pgx-node').length };
  }
}

// ------------------------------------------------------------ (b) the boon pick

/** What the boon screen answers: the run, now on its next fight, or that the player left. */
export interface BoonChoice {
  readonly run: RunState;
  readonly left: boolean;
}

export class PilgrimBoonScreen extends PilgrimScreen<BoonChoice> {
  readonly name = 'pilgrim-boons';
  protected readonly fallback: BoonChoice;
  private run: RunState;
  private view: BoonView = { zone: 'boons', boonSel: 0, roadSel: 0, notice: '' };
  private leaving = false;

  constructor(run: RunState, private readonly now: () => number = Date.now) {
    super();
    this.run = run;
    this.fallback = { run: leaveRun(run, now()), left: true };
  }

  protected hints(): ControlHintItem[] {
    return [
      { keyboard: 'Left/Right', gamepad: 'D-pad', pointer: 'Click a card', touch: 'Tap a card', label: 'choose' },
      { keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click', touch: 'Tap', label: 'take it', action: 'confirm' },
      { keyboard: 'Esc twice', gamepad: 'Circle twice', pointer: 'Esc twice', touch: null, label: 'leave the road', action: 'cancel' },
    ];
  }

  protected washChapter(): ChapterId {
    return currentStop(this.run).chapter;
  }

  protected paint(): void {
    if (this.body) this.body.innerHTML = boonHtml(this.run, this.view);
  }

  /** Light the cursor's card without repainting the page. */
  private select(): void {
    const v = this.view;
    this.root.querySelectorAll('[data-boon]').forEach((el, i) => el.classList.toggle('pgx-card--sel', v.zone === 'boons' && i === v.boonSel));
    this.root.querySelectorAll('.pgx-fork').forEach((el, i) => el.classList.toggle('pgx-fork--sel', v.zone === 'road' && i === v.roadSel));
    const go = this.root.querySelector('.pgx-main .pgx-btn span:last-child');
    const next = nextOptions(this.run)[v.roadSel] ?? nextOptions(this.run)[0];
    if (go && next) go.textContent = `On to ${next.title}`;
  }

  private note(text: string): void {
    this.view = { ...this.view, notice: text };
    const el = this.root.querySelector('[data-role="notice"]');
    if (el) el.textContent = text;
  }

  private picking(): boolean {
    return this.run.phase === 'boons';
  }

  private take(index: number): void {
    const next = pickBoon(this.run, index);
    if (next === this.run) return;
    audio.playSfx('confirm');
    this.run = next;
    this.view = this.picking() ? { zone: 'boons', boonSel: 0, roadSel: 0, notice: '' } : { zone: 'road', boonSel: 0, roadSel: 0, notice: '' };
    this.paint();
  }

  private go(): void {
    if (this.picking()) return this.note('Take a boon first.');
    const stop = nextOptions(this.run)[this.view.roadSel];
    if (!stop) return;
    audio.playSfx('confirm');
    this.settle({ run: chooseRoad(this.run, stop.id), left: false });
  }

  private move(delta: number): void {
    const v = this.view;
    const count = v.zone === 'boons' ? this.run.offers.length : nextOptions(this.run).length || 1;
    const at = v.zone === 'boons' ? v.boonSel : v.roadSel;
    const to = Math.min(count - 1, Math.max(0, at + delta));
    if (to === at) return;
    audio.playSfx('cursor-move');
    this.view = v.zone === 'boons' ? { ...v, boonSel: to, notice: '' } : { ...v, roadSel: to, notice: '' };
    this.select();
  }

  private zone(zone: 'boons' | 'road'): void {
    if (this.view.zone === zone || (zone === 'boons' && !this.picking())) return;
    audio.playSfx('cursor-move');
    this.view = { ...this.view, zone };
    this.select();
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    for (const action of input.actions) {
      const pick = /^pg:pick:(\d+)$/.exec(action);
      const road = /^pg:road:(\d+)$/.exec(action);
      if (pick) this.take(Number(pick[1]));
      else if (road && !this.picking()) {
        this.view = { ...this.view, zone: 'road', roadSel: Number(road[1]), notice: '' };
        this.select();
      } else if (road) this.note('Take a boon first.');
      else if (action === 'pg:go') this.go();
    }
    if (input.consume('left')) this.move(-1);
    else if (input.consume('right')) this.move(1);
    else if (input.consume('down')) this.zone('road');
    else if (input.consume('up')) this.zone('boons');
    if (input.consume('confirm') || input.consume('start') || input.actions.includes('confirm')) {
      if (this.view.zone === 'boons' && this.picking()) this.take(this.view.boonSel);
      else this.go();
    }
    if (input.consume('cancel') || input.actions.includes('cancel')) {
      if (!this.leaving) {
        this.leaving = true;
        this.note('Press Esc again to leave the road. The run ends.');
      } else this.settle({ run: leaveRun(this.run, this.now()), left: true });
    }
  }

  override trigger(name: string): boolean {
    if (name === 'confirm') {
      this.take(this.view.boonSel);
      return true;
    }
    return false;
  }

  override snapshot(): Record<string, unknown> {
    return { screen: 'pilgrim-boons', phase: this.run.phase, offers: [...this.run.offers], pack: [...this.run.pack], zone: this.view.zone, boonSel: this.view.boonSel, roadSel: this.view.roadSel, owed: this.run.owed };
  }
}

// ----------------------------------------------------------- (d) the run is over

export type OverChoice = 'again' | 'leave';

export class PilgrimOverScreen extends PilgrimScreen<OverChoice> {
  readonly name = 'pilgrim-over';
  protected readonly fallback: OverChoice = 'leave';
  private focus: OverChoice = 'again';

  constructor(private readonly run: RunState, private readonly kept: RunKept, private readonly now: () => number = Date.now) {
    super();
  }

  protected hints(): ControlHintItem[] {
    return [
      { keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click a button', touch: 'Tap a button', label: 'again', action: 'pg:again' },
      { keyboard: 'Esc', gamepad: 'Circle', pointer: 'Esc', label: 'chapter select', action: 'cancel' },
    ];
  }

  protected washChapter(): null {
    return null;
  }

  protected paint(): void {
    if (this.body) this.body.innerHTML = overHtml(this.run, summarize(this.run, this.now()), this.kept.previousBest, this.kept.newBest);
    this.markFocus();
  }

  private markFocus(): void {
    this.root.querySelector('[data-action="pg:again"]')?.classList.toggle('pgx-btn--focus', this.focus === 'again');
    this.root.querySelector('[data-action="pg:leave"]')?.classList.toggle('pgx-btn--focus', this.focus === 'leave');
  }

  override handleInput(input: InputSnapshot): void {
    this.hint?.handleInput(input);
    if (input.actions.includes('pg:again')) return this.settle('again');
    if (input.actions.includes('pg:leave') || input.actions.includes('cancel')) return this.settle('leave');
    if (input.consume('left') || input.consume('right')) {
      this.focus = this.focus === 'again' ? 'leave' : 'again';
      audio.playSfx('cursor-move');
      this.markFocus();
    }
    if (input.consume('confirm') || input.consume('start')) {
      audio.playSfx('confirm');
      this.settle(this.focus);
    } else if (input.consume('cancel')) {
      audio.playSfx('cancel');
      this.settle('leave');
    }
  }

  override trigger(name: string): boolean {
    if (name !== 'confirm') return false;
    this.settle(this.focus);
    return true;
  }

  override snapshot(): Record<string, unknown> {
    const s = summarize(this.run, this.now());
    return { screen: 'pilgrim-over', end: s.end, won: s.won, reached: s.reached, boonsUsed: s.boonsUsed, newBest: this.kept.newBest, focus: this.focus };
  }
}
