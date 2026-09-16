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
