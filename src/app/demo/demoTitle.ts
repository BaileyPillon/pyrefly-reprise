/**
 * THE TITLE, AT THE BOOTH (release 61, the conference demo; Bailey, 2026-10-21, decision 169n and 169o; both games, demo mode only).
 *
 * `TitleScreen` calls this when it opens in demo mode. It does two things: it puts the QR code in the title's corner, and it counts the idle seconds: 60 of them with no key, click, touch, wheel,
 * mouse movement or pad button start the attract loop (`demoAttract.ts`). Both end with the screen (`dispose`). Nothing here runs outside demo mode, and a title that is already leaving (Start was pressed)
 * never starts the reel.
 *
 * With the booth screens on (`boothSwitch.ts`: `?booth=new`, or `?pack=demo`) the 60 s count puts the Echo attract card over the title instead (`boothAttract.ts`, lane "booth", decision 188b):
 * "Pick up the controller". The reel stays behind `?attract=reel`. While the card is up, and for a moment after the press that takes it away, the title ignores its own input ({@link DemoTitle.holding}).
 */

import type { App } from '../App.ts';
import { demoModeOn } from '../demoMode.ts';
import { ATTRACT_AFTER_MS, IdleClock, padActive, watchActivity } from './demoIdle.ts';
import { attractRunner } from './attractHook.ts';
import { mountQrPlate } from './demoQr.ts';
import { attractIsCard } from './boothSwitch.ts'; // the booth screens (lane "booth", decision 188b): the 60 s idle puts the Echo attract card over the title instead of starting the reel
import { AttractCard } from './boothAttract.ts';

export interface DemoTitle {
  /** Per frame: poll the pads and start the reel when the title has been left alone long enough. `busy` is true while the title is doing something else (advancing, a panel up). */
  update(busy: boolean): void;
  /** Seconds of idleness so far (the debug snapshot). */
  idleSeconds(): number;
  /** The attract card is up, or was a moment ago: the title does nothing with its input, so the press that wakes the card never also starts the game. */
  holding(): boolean;
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
  let card: AttractCard | null = null;
  return {
    update(busy) {
      if (started) {
        card?.pollPads(); // the card is up: a pad press wakes it on this very frame, however short the tap (the card's own timer is the backstop)
        return;
      }
      if (padActive(navigator.getGamepads?.() ?? null)) clock.touch(now());
      if (busy) {
        clock.touch(now());
        return;
      }
      if (!clock.expired(now(), afterMs)) return;
      if (attractIsCard()) {
        // The booth screens: the Echo painting with "Pick up the controller", over the title. Any press takes it away, and the title counts again from then.
        started = true;
        const shown = new AttractCard(app.uiRoot);
        card = shown;
        shown.show();
        void shown.done.then(() => {
          clock.touch(now());
          started = false;
        });
        return;
      }
      const run = attractRunner(); // handed in by main.ts: the title does not import the reel (`attractHook.ts`)
      if (!run) return;
      started = true;
      void run(app)
        .then((r) => {
          // A press while the art was still loading: the title never went, so it counts the idle seconds again from now.
          if (!r.left) started = false;
          clock.touch(now());
        })
        .catch(() => {
          started = false; // the reel failed to start: the title stays, and counts again
          clock.touch(now());
        });
    },
    idleSeconds: () => Math.round(clock.idleMs(now()) / 100) / 10,
    holding: () => card?.holding() ?? false,
    dispose() {
      card?.dispose();
      card = null;
      stop();
      qr.remove();
    },
  };
}
