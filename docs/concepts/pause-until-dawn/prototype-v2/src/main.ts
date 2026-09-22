/**
 * Wiring for the standalone prototype page (`index.html`). Not part of the
 * driver seam — the real pause screen instantiates `LivingPortraitDriver`
 * itself and calls `mount` with its own plate element
 * (`src/app/screens/pause/PortraitStage.ts`).
 */
import { LivingPortraitDriver } from './driver.ts';

function setLegendVisible(el: HTMLElement, visible: boolean): void {
  el.style.display = visible ? 'block' : 'none';
}

function main(): void {
  const stage = document.getElementById('stage');
  const plate = document.getElementById('plate') as HTMLImageElement | null;
  const legend = document.getElementById('legend');
  if (!stage || !plate || !legend) throw new Error('index.html is missing #stage, #plate or #legend');

  // `?timeScale=N` speeds up the idle clocks so blink/mouth events (whose
  // natural intervals run several seconds) can be caught in a short capture
  // window. Debug-only, opt-in, unused by the real pause screen.
  const timeScaleParam = new URLSearchParams(location.search).get('timeScale');
  const debugTimeScale = timeScaleParam ? Number.parseFloat(timeScaleParam) : undefined;

  const driver = new LivingPortraitDriver({
    assetBaseUrl: './art/',
    rigUrl: './art/rig.json',
    debugTimeScale,
  });

  const start = () => {
    driver.mount(plate, 'yuna-x2');
    // eslint-disable-next-line no-console
    console.log('[living-portrait-v2] mounted');
  };
  if (plate.complete) start();
  else plate.addEventListener('load', start, { once: true });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') setLegendVisible(legend, legend.style.display === 'none');
  });

  // Exposed for the browser verification pass and for manual poking in devtools.
  (window as unknown as { __livingPortrait: LivingPortraitDriver }).__livingPortrait = driver;
}

main();
