import { artUrl } from '../../engine/PaintedArt.ts';

/**
 * The cutscene screen's side of the DSL's `backdrop()` step (additive, 2026-09-27; shared plumbing, both games):
 * swap the painted plate behind the scene, crossfading.
 *
 * First user: Chapter XVI, Ixion at Djose (FFX-2 only): the fall cuts from the Chamber to the Farplane Abyss,
 * and Yuna wakes over the Bevelle Underground plate (research `ffx2-ixion-djose.md` §7.2 steps 1 and 12).
 *
 * How. The screen root carries the plate as its CSS background (`CutsceneScreen.enter`). A swap lays a
 * full-bleed layer with the new plate as the root's first child (under the stage, the box and the legibility
 * scrim, which are later children or `::after`), fades it in, then hands the plate to the root and removes the
 * layer. `ms <= 0` (or a skipped scene) cuts at once, so a fast-forward still ends on the right plate.
 *
 * The chapter eyebrow ("CHAPTER XVI · DJOSE TEMPLE ...") names the chapter's own place, so it steps out once the
 * scene has moved somewhere else.
 */
export function swapCutscenePlate(
  root: HTMLElement,
  key: string,
  ms: number,
  sleep: (ms: number) => Promise<void>,
  place?: string,
): Promise<void> {
  const url = `url(${artUrl(`art/backdrops/${key}.png`)})`;
  root.dataset['plate'] = key;
  nameEyebrowPlace(root, place);
  if (ms <= 0) {
    root.style.backgroundImage = url;
    return Promise.resolve();
  }
  const layer = document.createElement('div');
  layer.className = 'cutscene__plate';
  layer.dataset['plate'] = key;
  layer.style.cssText =
    `position:absolute;inset:0;pointer-events:none;background:${url} center 35% / cover no-repeat #04060b;` +
    `opacity:0;transition:opacity ${ms}ms ease-in-out;`;
  root.prepend(layer);
  // Next frame, so the transition runs from 0.
  requestAnimationFrame(() => {
    layer.style.opacity = '1';
  });
  return sleep(ms).then(() => {
    root.style.backgroundImage = url;
    layer.remove();
  });
}

/**
 * The eyebrow after a plate swap. With a `place` it keeps "CHAPTER V ·" and names the new place (PR-0230: the
 * Farplane Glen coda must not read as Vegnagun's chamber); without one the chapter's own place no longer
 * applies and the eyebrow steps out.
 */
function nameEyebrowPlace(root: HTMLElement, place: string | undefined): void {
  const eyebrow = root.querySelector<HTMLElement>('.cutscene__eyebrow');
  if (!eyebrow) return;
  const label = eyebrow.querySelector<HTMLElement>('.cutscene__eyebrow-label');
  const cut = label?.textContent?.indexOf('·') ?? -1;
  if (place && label && cut >= 0) {
    label.textContent = `${label.textContent!.slice(0, cut + 1)} ${place.toUpperCase()}`;
    eyebrow.removeAttribute('hidden');
    return;
  }
  eyebrow.setAttribute('hidden', '');
}
