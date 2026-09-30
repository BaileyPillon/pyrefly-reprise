/**
 * The guided first run's drawing: the slab markup and where each piece goes
 * (fb2-0929 O2, D-289). State and timing live in `firstRunGuide.ts`.
 *
 * Placement is the approved mockup's, measured from `option.html` against the live
 * anchors it was drawn on, and re-derived every frame from the live element so it
 * holds at any size:
 *
 * | step | desktop (wider than 900 px) | phone |
 * |---|---|---|
 * | 1 board | slab right of the picture, left chevron at its middle | slab under the picture, up chevron |
 * | 2 prep | slab left of START BATTLE, right chevron | slab above START BATTLE, down chevron |
 * | 3 battle | FFX's line right of ATTACK, left chevron, ring | FFX's line under the top band, down chevron over ATTACK, ring |
 *
 * Game case: both (step 3 is only ever reached in FFX, `firstRunGuide.ts`).
 */

import './first-run.css';
import { escapeHtml } from '../common/html.ts';
import { FIRST_RUN_SKIP, FIRST_RUN_STEPS, firstRunEyebrow, type FirstRunStep } from './firstRunCopy.ts';

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The phone rule, the same break the coach line's own layout uses (`coach.css`, 900 px). */
export function phoneLayout(): boolean {
  return (globalThis.innerWidth ?? 1600) <= 900;
}

const both = (w: { pointer: string; touch: string }): string =>
  w.pointer === w.touch
    ? escapeHtml(w.pointer)
    : `<span class="frg__pointer">${escapeHtml(w.pointer)}</span><span class="frg__touch">${escapeHtml(w.touch)}</span>`;

/**
 * One step's slab, inside its counter-skew. `quote` overrides the step's own
 * (step 3 passes Auron's approved first-command line, unchanged).
 */
export function slabHtml(step: FirstRunStep, quote: string | null = step.quote): string {
  const pips = [1, 2, 3].map((i) => `<span class="${i <= step.n ? 'on' : ''}"></span>`).join('');
  const act = step.act ? `<div class="frg__act">${both(step.act)}</div>` : '';
  const skip =
    `<span class="frg__skip" data-role="firstrun-skip" role="button" tabindex="-1">` +
    `<b class="frg__pointer">${FIRST_RUN_SKIP.pointer}</b><b class="frg__touch">${FIRST_RUN_SKIP.touch}</b> ${FIRST_RUN_SKIP.rest}</span>`;
  return (
    `<div class="frg__in">` +
    `<div class="frg__eyebrow">${escapeHtml(firstRunEyebrow(step.n))}</div>` +
    (quote ? `<div class="frg__quote">${escapeHtml(quote)}</div>` : '') +
    `<div class="frg__line">${both(step.line)}</div>${act}` +
    `<div class="frg__steps">${pips}</div>${skip}</div>`
  );
}

export const STEP_BOARD = FIRST_RUN_STEPS[0];
export const STEP_PREP = FIRST_RUN_STEPS[1];
export const STEP_BATTLE = FIRST_RUN_STEPS[2];

/** Where the slab and the chevron go for one target, in viewport pixels. */
export interface Placement {
  slab: { left: number; top: number; width: number };
  chev: { left: number; top: number; dir: 'up' | 'down' | 'left' | 'right' };
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Pure placement for a step, given the target's box, the slab's measured height
 * and the viewport. The constants are the mockup's (`option.html`, 1600x900 and
 * 390x844), expressed against the target instead of the frame.
 */
export function place(n: 1 | 2 | 3, t: Box, slabH: number, vw: number, vh: number, phone: boolean, bandBottom = 0): Placement {
  const cx = t.left + t.width / 2;
  const cy = t.top + t.height / 2;
  const right = t.left + t.width;
  const bottom = t.top + t.height;
  const fitTop = (top: number): number => clamp(top, 8, Math.max(8, vh - slabH - 8));
  if (phone) {
    const width = Math.min(330, vw - 60);
    const left = clamp(22, 8, Math.max(8, vw - width - 8));
    const chevX = clamp(cx - 18, 8, vw - 44);
    if (n === 1) return { slab: { left, top: fitTop(bottom + 49), width }, chev: { left: chevX, top: bottom + 13, dir: 'up' } };
    if (n === 2) return { slab: { left, top: fitTop(t.top - 133 - slabH), width }, chev: { left: chevX, top: t.top - 40, dir: 'down' } };
    return { slab: { left, top: fitTop(Math.max(bandBottom + 14, 8)), width }, chev: { left: chevX, top: t.top - 28, dir: 'down' } };
  }
  if (n === 2) {
    const width = 520;
    return {
      slab: { left: clamp(t.left - 63 - width, 8, vw - width - 8), top: fitTop(cy - slabH / 2), width },
      chev: { left: t.left - 37, top: cy - 18, dir: 'right' },
    };
  }
  const width = n === 1 ? 420 : 440;
  const gap = n === 1 ? 58 : 62;
  const lift = n === 1 ? 0.5 : 0.76;
  return {
    slab: { left: clamp(right + gap, 8, Math.max(8, vw - width - 8)), top: fitTop(cy - slabH * lift), width },
    chev: { left: right + (n === 1 ? 24 : 16), top: cy - 18, dir: 'left' },
  };
}

/** A viewport box of an element, or null when it is not on screen. */
export function onScreen(el: Element | null): Box | null {
  if (!el || !el.isConnected) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 3 || r.height < 3) return null;
  const vw = globalThis.innerWidth ?? 0;
  const vh = globalThis.innerHeight ?? 0;
  if (r.bottom <= 0 || r.right <= 0 || r.top >= vh || r.left >= vw) return null;
  const s = getComputedStyle(el);
  if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

const px = (el: HTMLElement, box: Partial<Box>): void => {
  if (box.left !== undefined) el.style.left = `${Math.round(box.left)}px`;
  if (box.top !== undefined) el.style.top = `${Math.round(box.top)}px`;
  if (box.width !== undefined) el.style.width = `${Math.round(box.width)}px`;
  if (box.height !== undefined) el.style.height = `${Math.round(box.height)}px`;
};

/**
 * The drawn pieces: one fixed layer holding the spot or ring, the chevron and
 * (steps 1 and 2) the slab. Step 3's slab is FFX's own line, placed by the guide.
 */
export class FirstRunLayer {
  readonly el: HTMLElement;
  private readonly mark: HTMLElement;
  private readonly chev: HTMLElement;
  readonly slab: HTMLElement;
  private shown: 0 | 1 | 2 | 3 = 0;

  constructor(onSkip: () => void) {
    const el = document.createElement('div');
    el.className = 'frg ig'; // .ig: the Ink & Gold token scope (fonts, skew, gold)
    el.dataset['role'] = 'firstrun';
    el.innerHTML = '<div class="frg__spot"></div><div class="frg__chev"></div><div class="frg__slab" role="status"></div>';
    this.el = el;
    this.mark = el.children[0] as HTMLElement;
    this.chev = el.children[1] as HTMLElement;
    this.slab = el.children[2] as HTMLElement;
    this.slab.addEventListener('click', (e) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-role="firstrun-skip"]')) return;
      e.stopPropagation();
      onSkip();
    });
    this.hide();
  }

  /**
   * Draw step `n` against `target`. Step 3's slab is FFX's own line: the caller
   * passes its height and places it from the answer.
   */
  draw(step: FirstRunStep, target: Box, bandBottom = 0, lineH = 0): Placement {
    const n = step.n;
    if (this.shown !== n) {
      this.shown = n;
      this.el.dataset['step'] = String(n);
      this.mark.className = n === 3 ? 'frg__ring' : 'frg__spot';
      this.slab.innerHTML = n === 3 ? '' : slabHtml(step);
      this.slab.style.display = n === 3 ? 'none' : '';
    }
    this.el.style.display = '';
    const pad = n === 3 ? 6 : 0;
    px(this.mark, { left: target.left - pad, top: target.top - pad, width: target.width + 2 * pad, height: target.height + 2 * pad });
    const phone = phoneLayout();
    const h = n === 3 ? lineH : this.slab.getBoundingClientRect().height;
    const p = place(n, target, h, globalThis.innerWidth, globalThis.innerHeight, phone, bandBottom);
    if (n !== 3) px(this.slab, p.slab);
    px(this.chev, { left: p.chev.left, top: p.chev.top });
    this.chev.dataset['dir'] = p.chev.dir;
    return p;
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  get step(): number {
    return this.el.style.display === 'none' ? 0 : this.shown;
  }
}
