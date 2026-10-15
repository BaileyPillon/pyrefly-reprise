import type { MinigameResult, TimingResult } from '../../../battle/common/types.ts';
import {
  SWORDPLAY_CATEGORIES,
  type SwordplayFrame,
  type SwordplayGeometry,
  swordplayFraction,
  swordplayFrame,
  swordplayGeometry,
  swordplayStart,
  swordplayWindowFractions,
} from '../../../battle/ffx/kernel/minigame-swordplay.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { FrameDriver } from './frameDriver.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { DeviceTracker, markTappable, zoneInstruction } from './overlayInput.ts';
import { num, str } from './params.ts';

/**
 * The bar the overlay plays: the engine's published numbers (`battle/ffx/adapt/minigame.ts#swordplayParams`), else the move's own from the
 * game's table. A bare call (a demo, a test: `{ name, timerMs }`) plays Spiral Cut. `timerMs` is the limit when it is given.
 */
export function swordplayGeometryFor(params: Record<string, unknown>): SwordplayGeometry {
  const category = num(params['category'], 0x20);
  const base = swordplayGeometry(SWORDPLAY_CATEGORIES.includes(category) ? category : 0x20);
  return {
    limit: num(params['timerMs'], base.limit * 1000) / 1000,
    speed: num(params['speed'], base.speed),
    width: base.width,
    x0: num(params['x0'], base.x0),
    bar: num(params['bar'], base.bar),
    lo: num(params['windowLo'], base.lo),
    hi: num(params['windowHi'], base.hi),
  };
}

/**
 * Tidus — Swordplay [visual-bible §3.11.1], restyled onto Ink & Gold's
 * `.ig-minigame__bar`/`__zone`/`__cursor` (`docs/handoff/ink-and-gold/
 * Swordplay.dc.html` is this overlay's own approved mock): a cursor bouncing
 * over a bar with a highlighted gold zone; the zone narrows and the cursor
 * speeds up for stronger Overdrives. **FFX only.**
 *
 * ## The game's controller, a frame at a time (re-parity RC9, lane FFX-A; Bailey 2026-10-11, plan question Q3, D-765)
 *
 * The marker is no longer a smooth real-time slide: it moves a whole step every 1/30 s frame (11, 12, 13 and 14 units on a 275-unit bar for
 * the four moves) and the gold zone is the game's narrower, centred window (8.7, 7.3, 7.3 and 6.5 percent of the bar), both from
 * `battle/ffx/kernel/minigame-swordplay.ts`, which the game's own machine code was run against (`FFX-G01` section 6.2). What is drawn is what
 * is judged: a press is seen by the next frame, which tests the marker as it stands on screen. The look (slab, bar, ring, words) is unchanged.
 *
 * A press outside the zone is not a failure: the cursor goes back to the far left and sweeps again, and only the limit running out fails
 * [ffx-combat-core §5.3 rule 1, `[verified: 2 sources]`, and the kernel]. The result carries the controller frame the press was seen in
 * (`TimingResult.frame`) and the time left as the game computes it, `limit - frame / 30` seconds.
 *
 * ## Every input can press (PR-0360, FFX only)
 *
 * The press is the abstract `confirm`. The keyboard (`Enter`, `Space`, `Z`) and the pad (button 0) reach it
 * through `RawInputWatcher` as before; a **tap or a click anywhere on the slab** is the same press
 * (`pointerdown`, as Trigger Happy's slab, `ffx2/TriggerHappy.ts`), so a phone no longer resolves the Fail
 * row at timer expiry. The zone, the marker speed and the timer are the Overdrive's own and are not touched.
 * The subtitle names the control in use (`PRESS ENTER` / `PRESS CROSS` / `TAP` / `CLICK` in the gold zone).
 */
export function openTidusTiming(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const geom = swordplayGeometryFor(params);
  const timerMs = geom.limit * 1000;
  const name = str(params['name'], 'Slice & Dice');

  const overlay = new OverdriveOverlay();
  markTappable(overlay.el, true);
  root.appendChild(overlay.el);
  const device = new DeviceTracker((d) => {
    overlay.el.dataset['input'] = d.device;
    overlay.setInstruction(zoneInstruction(d));
  });
  overlay.el.dataset['input'] = device.current.device;
  overlay.open({ title: name, mechanic: 'Swordplay', instruction: zoneInstruction(device.current), timerMs, showBonus: true });
  overlay.bodyEl.innerHTML = `
    <div class="ig-minigame__bar" data-role="bar">
      <div class="ig-minigame__zone"></div>
      <div class="ig-minigame__cursor" data-role="cursor"></div>
      <div class="ig-minigame__labels"><span class="ig-minigame__label">MISS</span><span class="ig-minigame__label">HIT</span></div>
    </div>`;
  const barEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="bar"]')!;
  const cursorEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="cursor"]')!;
  // The window is centred on the bar and the bar's CSS is in percent: start and width as shares of the 275-unit bar.
  const zone = swordplayWindowFractions(geom);
  barEl.style.setProperty('--ig-zone-start', `${(zone.start * 100).toFixed(2)}%`);
  barEl.style.setProperty('--ig-zone-width', `${(zone.width * 100).toFixed(2)}%`);

  return new Promise<MinigameResult>((resolve) => {
    const state = swordplayStart(geom);
    let settled = false;
    let pressQueued = false;
    const setCursor = (): void => {
      cursorEl.style.left = `${(swordplayFraction(state, geom) * 100).toFixed(2)}%`;
    };

    const finish = async (end: Extract<SwordplayFrame, { done: true }>): Promise<void> => {
      if (settled) return;
      settled = true;
      driver.stop();
      watcher.detach();
      overlay.el.removeEventListener('pointerdown', onPointer);
      setCursor();
      const timing: TimingResult = { success: end.grade === 1, timeRemainingMs: end.grade === 1 ? end.a * 1000 : 0, timerMs, frame: end.frame };
      await (timing.success ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'tidus-timing', timing });
    };

    /** One controller frame: the press queued since the last one is seen now. */
    const driver = new FrameDriver(
      () => overlay.elapsedMs(),
      () => {
        const pressed = pressQueued;
        pressQueued = false;
        const end = swordplayFrame(state, geom, pressed);
        if (end.done) void finish(end);
        else setCursor();
      },
    );

    /** The one press, from a key, the pad or a tap on the slab: seen by the next frame, after the frames already due have gone by. */
    const confirm = (): void => {
      if (settled) return;
      driver.catchUp();
      if (!settled) pressQueued = true;
    };
    const watcher = new RawInputWatcher((b, source) => {
      if (b !== 'confirm' || settled) return;
      device.note(source);
      confirm();
    });
    // A finger or a click anywhere on the slab is the confirm press (PR-0360). `pointerdown`, like a key's `keydown`: no lift to wait for.
    const onPointer = (e: PointerEvent): void => {
      if (settled || e.button > 0) return;
      e.preventDefault();
      device.note('pointer', e.pointerType);
      confirm();
    };
    overlay.el.addEventListener('pointerdown', onPointer);

    // The ring runs out at the limit: the frames still due go by, then the frame that finds the limit gone ends it.
    overlay.startTimer(timerMs, () => {
      driver.pump();
      if (!settled) driver.forceFrame();
    });
    watcher.attach();
    driver.start();
    setCursor();
  });
}
