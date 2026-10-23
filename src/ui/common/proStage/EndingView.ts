/**
 * THE ENDING, THE DRAWING (lane "pro-staging"; the plan is `engine/pro/staging/EndingPlan.ts`): the freeze on the last blow (a white flash, a shock ring out of the boss's chest, the HUD going out), the quiet VICTORY
 * title, the FFX-2 pull-back's letterbox and the defeat's dim and caption. All of it in the TOP layer (over the HUD, under the screen's own cut-ins); the field's own clock is stopped by the presenter
 * (`FxStagePort.freeze`), never here.
 */
import { SHOCK_REACH, PULL_BAR_SHARE, emptyEnd, endFrame, type EndFrame, type EndMarks } from '../../../engine/pro/staging/EndingPlan.ts';
import type { EndingCue } from '../../../engine/pro/staging/StagingPort.ts';
import type { ProStageOptions } from './ProStageLayer.ts';

export class EndingView {
  private marks: EndMarks = emptyEnd();
  private readonly flash: HTMLElement;
  private readonly shock: HTMLElement;
  private readonly title: HTMLElement;
  private readonly titleWord: HTMLElement;
  private readonly titleSub: HTMLElement;
  private readonly barTop: HTMLElement;
  private readonly barBottom: HTMLElement;
  private readonly dim: HTMLElement;
  private readonly caption: HTMLElement;
  private chest: { x: number; y: number } | null = null;
  /** The HUD's strength this frame, for the layer to fold into its own (1 when no ending is on). */
  hud = 1;
  last: EndFrame | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly o: ProStageOptions,
  ) {
    const doc = host.ownerDocument;
    const mk = (cls: string, parent: HTMLElement = host): HTMLElement => {
      const el = doc.createElement('div');
      el.className = cls;
      parent.appendChild(el);
      return el;
    };
    this.dim = mk('pst__dim');
    this.flash = mk('pst__flash');
    this.shock = mk('pst__shock');
    this.barTop = mk('pst__bar pst__bar--top');
    this.barBottom = mk('pst__bar pst__bar--bottom');
    this.title = mk('pst__title');
    this.titleWord = mk('pst__title-word', this.title);
    this.titleWord.textContent = 'Victory';
    this.titleSub = mk('pst__title-sub', this.title);
    this.caption = mk('pst__caption');
    this.caption.textContent = 'The party has fallen';
  }

  cue(c: EndingCue): void {
    const now = this.now;
    this.marks.tame = c.tame;
    this.marks.calm = c.calm;
    if (c.kind === 'freeze') {
      this.marks.freezeAt = now;
      this.marks.freezeMs = c.holdMs;
      this.chest = this.o.pointOf(c.boss, 'chest');
    } else if (c.kind === 'title') {
      this.marks.titleAt = now;
      const name = this.o.nameOf?.(c.boss);
      this.titleSub.textContent = name ? `${name} felled` : '';
    } else if (c.kind === 'pullback') {
      this.marks.pullAt = now;
      this.marks.pullMs = Math.max(1, c.ms);
    } else if (c.kind === 'fall') {
      this.marks.fallAt = now;
    }
  }

  /** The layer's clock; set by `update`. */
  private now = 0;

  update(now: number): void {
    this.now = now;
    const m = this.marks;
    if (!(m.freezeAt !== null || m.titleAt !== null || m.pullAt !== null || m.fallAt !== null)) return;
    const f = endFrame(now, m);
    this.last = f;
    this.hud = f.hud;
    this.flash.style.opacity = f.flash.toFixed(3);
    if (f.shock >= 0 && this.chest) {
      const H = this.host.clientHeight || 900;
      const d = Math.max(8, f.shock * H * SHOCK_REACH * 2);
      this.shock.style.cssText = `opacity:${f.shockAlpha.toFixed(3)};width:${d.toFixed(0)}px;height:${(d * 0.62).toFixed(0)}px;left:${this.chest.x.toFixed(0)}px;top:${this.chest.y.toFixed(0)}px;`;
    } else {
      this.shock.style.opacity = '0';
    }
    this.title.style.opacity = f.title.toFixed(3);
    this.title.style.transform = `translateY(${((1 - f.title) * -10).toFixed(1)}px)`;
    const bar = f.bars * PULL_BAR_SHARE * 100;
    this.barTop.style.height = `${bar.toFixed(2)}%`;
    this.barBottom.style.height = `${bar.toFixed(2)}%`;
    this.dim.style.opacity = f.dim.toFixed(3);
    this.caption.style.opacity = f.caption.toFixed(3);
    this.caption.style.transform = `translate(-50%, ${((1 - f.caption) * -14).toFixed(1)}px)`;
  }

  clear(): void {
    this.marks = emptyEnd();
    this.hud = 1;
    this.last = null;
    this.chest = null;
    for (const el of [this.flash, this.shock, this.title, this.dim, this.caption]) el.style.opacity = '0';
    this.barTop.style.height = '0';
    this.barBottom.style.height = '0';
  }

  /** Is an ending's layer showing something (the freeze's HUD-out, a title, bars, the dim)? */
  get active(): boolean {
    return this.last !== null && this.last.alive;
  }

  dispose(): void {
    for (const el of [this.flash, this.shock, this.title, this.dim, this.caption, this.barTop, this.barBottom]) el.remove();
  }
}
