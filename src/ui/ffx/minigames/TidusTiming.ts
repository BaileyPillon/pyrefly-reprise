import type { MinigameResult, TimingResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { expireTidusTiming, pressTidusTiming, swordplayGeometry, tidusCursorPosition } from './logic.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { DeviceTracker, markTappable, zoneInstruction } from './overlayInput.ts';
import { num, str } from './params.ts';

/**
 * Tidus — Swordplay [visual-bible §3.11.1], restyled onto Ink & Gold's
 * `.ig-minigame__bar`/`__zone`/`__cursor` (`docs/handoff/ink-and-gold/
 * Swordplay.dc.html` is this overlay's own approved mock): a ping-pong
 * cursor over a bar with a highlighted gold zone; the zone narrows and the
 * cursor speeds up for stronger Overdrives, tuned per-Overdrive by the
 * caller's `params` (`zoneHalfWidth`, `speedPxPerSec`) rather than
 * hard-coded here. Pixel math stays internal (it feeds the pure resolver in
 * `logic.ts`); only the CSS custom properties driving `.ig-minigame__bar`
 * are percentages.
 *
 * A press outside the zone is not a failure: the cursor goes back to the far
 * left and sweeps again, and only timer expiry fails [ffx-combat-core §5.3
 * rule 1, `[verified: 2 sources]`; `pressTidusTiming`]. FFX only.
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
  const timerMs = num(params['timerMs'], 3000);
  const barWidth = num(params['barWidth'], 360);
  // The Overdrive's own zone and marker speed (`zonePercent`, `travelMs`: PR-0308); the pixel params are the demo's.
  const { zoneHalfWidth, speedPxPerSec: speed } = swordplayGeometry(params, barWidth);
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
  barEl.style.setProperty('--ig-zone-start', `${(((barWidth / 2 - zoneHalfWidth) / barWidth) * 100).toFixed(2)}%`);
  barEl.style.setProperty('--ig-zone-width', `${((zoneHalfWidth * 2) / barWidth) * 100}%`);

  return new Promise<MinigameResult>((resolve) => {
    let rafId = 0;
    let settled = false;
    let sweepStartMs = 0;
    /** The one press, from a key, the pad or a tap on the slab. */
    const confirm = (): void => {
      if (settled) return;
      const press = pressTidusTiming({ elapsedMs: overlay.elapsedMs(), sweepStartMs, barWidth, zoneHalfWidth, speedPxPerSec: speed, timerMs });
      if (press.kind === 'miss') {
        sweepStartMs = press.sweepStartMs; // the marker returns to the far left; the timer keeps running
        setCursor(0);
        return;
      }
      if (press.kind === 'hit') setCursor(press.cursorPos);
      void finish(press.timing);
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

    const setCursor = (pos: number): void => {
      cursorEl.style.left = `${((pos / barWidth) * 100).toFixed(2)}%`;
    };

    const animate = (): void => {
      setCursor(tidusCursorPosition(overlay.elapsedMs() - sweepStartMs, barWidth, speed));
      rafId = requestAnimationFrame(animate);
    };

    const finish = async (timing: TimingResult): Promise<void> => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(rafId);
      watcher.detach();
      overlay.el.removeEventListener('pointerdown', onPointer);
      await (timing.success ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'tidus-timing', timing });
    };

    overlay.startTimer(timerMs, () => void finish(expireTidusTiming(timerMs)));
    watcher.attach();
    animate();
  });
}
