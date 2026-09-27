/**
 * **F1's opening camera** (FF7 only; Bailey, 2026-09-27, "I'll go with all of
 * your recommendations", accepting D-244's F1): after FF7's swirl has twisted
 * the frozen chapter select away (`ui/ff7/ff7Swirl.ts`), the field fades up
 * close on Guard Scorpion and the camera settles on the fixed view in about 2
 * s, then the band rises. The path is **our estimate**: the source says only
 * that FF7's default camera moves during battle (research/ff7-battle-staging.md §4).
 *
 * - A Confirm press (Enter, Space, Z, a tap or click) cuts straight to the fixed view.
 * - Reduced motion (the pause's setting or the OS) cuts: no camera move at all.
 *
 * It drives the scene's own `BattleCamera` (the FF7 stage's fixed-camera port
 * ignores every presenter move, by design), and only before the first turn:
 * `BattleScreen.showBattleStart` awaits it, and the fight waits behind it.
 */

import type { BattleCamera } from '../../engine/BattleCamera.ts';
import { prefersReducedMotion } from '../../ui/common/transitions/reduceMotion.ts';

/** The settle from the close shot to the fixed view, ms. Our estimate. */
export const FF7_OPENING_MS = 2000;
/** The band's rise after the camera settles, ms (the CSS transition in `ff7-hud.css`). */
export const FF7_BAND_RISE_MS = 420;

const CONFIRM = new Set(['Enter', 'NumpadEnter', ' ', 'z', 'Z']);

/** The FF7 HUD root while the opening plays (the band waits below the frame). */
function hudRoot(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('.ff7hud');
}

/** Play the opening. Resolves once the camera is on the fixed view and the band is up. */
export async function playFf7Opening(camera: BattleCamera, opts: { reduced?: boolean; ms?: number } = {}): Promise<void> {
  const reduced = opts.reduced ?? prefersReducedMotion();
  if (reduced || !camera.getRig('ff7-open')) {
    camera.snapTo('idle');
    return;
  }
  const hud = hudRoot();
  hud?.setAttribute('data-ff7-opening', '');
  camera.snapTo('ff7-open');
  let skip: () => void = () => {};
  const skipped = new Promise<void>((resolve) => (skip = resolve));
  const onKey = (e: KeyboardEvent): void => {
    if (CONFIRM.has(e.key)) skip();
  };
  const onPointer = (): void => skip();
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
  try {
    const moved = camera.moveTo('idle', opts.ms ?? FF7_OPENING_MS, 'cubicInOut');
    const which = await Promise.race([moved.then(() => 'moved' as const), skipped.then(() => 'skipped' as const)]);
    if (which === 'skipped') camera.snapTo('idle');
  } finally {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
    hud?.removeAttribute('data-ff7-opening');
  }
  await new Promise<void>((r) => setTimeout(r, FF7_BAND_RISE_MS));
}
