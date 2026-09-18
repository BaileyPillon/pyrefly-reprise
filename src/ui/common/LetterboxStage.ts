/**
 * Shared 640x360 authoring-grid letterbox helper.
 *
 * Every FFX-chrome screen in this project (`HudMock`, and now `ChapterSelectScreen`
 * / `ResultsScreen` / the in-cutscene `DialogueBox`) is authored against the
 * 640x360 logical canvas from `research/visual-bible.md` §3.0 and scaled with a
 * single `min(w/640, h/360)` transform. `HudMock` inlines this; this module
 * pulls it out so every consumer of the grid gets identical letterboxing
 * instead of five slightly-different reimplementations.
 */

export const STAGE_W = 640;
export const STAGE_H = 360;

export interface Stage {
  /** Outer element — position:absolute, inset:0, overflow hidden. Append this to a screen root. */
  readonly el: HTMLElement;
  /** Inner 640x360 element every rect is authored against. Append children here. */
  readonly stage: HTMLElement;
  /** Recompute the letterbox transform. Call on resize; called once on mount. */
  layout(): void;
  /** Detach the resize listener. */
  destroy(): void;
}

/**
 * Build a letterboxed 640x360 stage inside `root`. `className` is applied to
 * the outer element (e.g. for that screen's own CSS token scope); the inner
 * stage always gets `<className>__stage` in addition to a shared class hook.
 */
export function createStage(root: HTMLElement, className: string): Stage {
  const el = document.createElement('div');
  el.className = className;

  const stage = document.createElement('div');
  stage.className = `${className}__stage lb-stage`;
  stage.style.position = 'absolute';
  stage.style.top = '0';
  stage.style.left = '0';
  stage.style.width = `${STAGE_W}px`;
  stage.style.height = `${STAGE_H}px`;
  stage.style.transformOrigin = '0 0';

  el.appendChild(stage);
  root.appendChild(el);

  const layout = (): void => {
    const rect = el.getBoundingClientRect();
    const w = rect.width || root.clientWidth || window.innerWidth;
    const h = rect.height || root.clientHeight || window.innerHeight;
    const scale = Math.min(w / STAGE_W, h / STAGE_H) || 1;
    const x = (w - STAGE_W * scale) / 2;
    const y = (h - STAGE_H * scale) / 2;
    stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  };

  const onResize = (): void => layout();
  window.addEventListener('resize', onResize, { passive: true });
  layout();

  return {
    el,
    stage,
    layout,
    destroy: () => window.removeEventListener('resize', onResize),
  };
}

/**
 * The same two-element shape as {@link createStage}, with **no** 640x360 grid
 * and **no** scale transform: the inner element simply fills its parent.
 *
 * The pause overlay needs this. Its hero painting is meant to be the whole
 * window, and inside a letterboxed stage it could only ever be 16:9 — on
 * Bailey's 2000x1012 window that printed ink bars down both sides of the
 * painting (`docs/handoff/fix3-pause.md`). The transform was the second half
 * of the same defect: every glyph on the screen was rasterised at 640x360 and
 * then blown up by `scale(2.81)`, which is why the chrome read as a
 * low-resolution image rather than as type. Chromium rasterises a scaled layer
 * once at its own resolution and resamples it; the only cure is not to scale
 * the layer.
 *
 * Consumers of this one author in **viewport-relative units** (`clamp()` on
 * `vw`/`vh`), not in grid px — there is no grid to be relative to. `layout()`
 * is a no-op and nothing listens for resize, because CSS is doing the work.
 *
 * Everything else is deliberately identical, including the `lb-stage` class on
 * the inner element, so rules that key off it (photo mode's
 * `[data-photo='on']`) and tests that query `.<name>__stage` keep working.
 */
export function createFullBleedStage(root: HTMLElement, className: string): Stage {
  const el = document.createElement('div');
  el.className = className;

  const stage = document.createElement('div');
  stage.className = `${className}__stage lb-stage`;
  stage.style.position = 'absolute';
  stage.style.inset = '0';

  el.appendChild(stage);
  root.appendChild(el);

  return {
    el,
    stage,
    layout: () => {},
    destroy: () => {},
  };
}
