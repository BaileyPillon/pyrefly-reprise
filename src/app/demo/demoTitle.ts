/**
 * THE TITLE, AT THE BOOTH (release 61, the conference demo; Bailey, 2026-10-21, decision 169n and 169o; both games, demo mode only).
 *
 * `TitleScreen` calls this when it opens in demo mode. It does two things: it puts the QR code in the title's corner, and it counts the idle seconds: 60 of them with no key, click, touch, wheel,
 * mouse movement or pad button start the attract loop (`demoAttract.ts`). Both end with the screen (`dispose`). Nothing here runs outside demo mode, and a title that is already leaving (Start was pressed)
 * never starts the reel.
 */

import type { App } from '../App.ts';
import { demoModeOn } from '../demoMode.ts';
import { ATTRACT_AFTER_MS, IdleClock, padActive, watchActivity } from './demoIdle.ts';
import { runAttract } from './demoAttract.ts';
import { mountQrPlate } from './demoQr.ts';

export interface DemoTitle {
  /** Per frame: poll the pads and start the reel when the title has been left alone long enough. `busy` is true while the title is doing something else (advancing, a panel up). */
  update(busy: boolean): void;
  /** Seconds of idleness so far (the debug snapshot). */
  idleSeconds(): number;
  dispose(): void;
}

/** Null outside demo mode. */
export function enterDemoTitle(app: App, afterMs = ATTRACT_AFTER_MS): DemoTitle | null {
  if (!demoModeOn()) return null;
  const now = (): number => performance.now();
  const clock = new IdleClock(now());
  const stop = watchActivity(() => clock.touch(now()));
  // On the page's UI layer, not inside the title's own root: the title rewrites its root when the player changes the title picture (release 61's T key, `TitleScreen.mountArt`), which would take the plate with it.
  const qr = mountQrPlate(app.uiRoot, 'title');
  let started = false;
  return {
    update(busy) {
      if (started) return;
      if (padActive(navigator.getGamepads?.() ?? null)) clock.touch(now());
      if (busy) {
        clock.touch(now());
        return;
      }
      if (!clock.expired(now(), afterMs)) return;
      started = true;
      void runAttract(app).then((r) => {
        // A press while the art was still loading: the title never went, so it counts the idle seconds again from now.
        if (!r.left) started = false;
        clock.touch(now());
      });
    },
    idleSeconds: () => Math.round(clock.idleMs(now()) / 100) / 10,
    dispose() {
      stop();
      qr.remove();
    },
  };
}
