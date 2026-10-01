import type { MinigameResult, TimingResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { expireTidusTiming, pressTidusTiming, tidusCursorPosition } from './logic.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
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
 */
export function openTidusTiming(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], 3000);
  const barWidth = num(params['barWidth'], 360);
  const zoneHalfWidth = num(params['zoneHalfWidth'], 22);
  const speed = num(params['speedPxPerSec'], 340);
  const name = str(params['name'], 'Slice & Dice');

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({ title: name, mechanic: 'Swordplay', instruction: 'confirm in the gold zone', timerMs, showBonus: true });
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
    const watcher = new RawInputWatcher((b) => {
      if (b !== 'confirm' || settled) return;
      const press = pressTidusTiming({ elapsedMs: overlay.elapsedMs(), sweepStartMs, barWidth, zoneHalfWidth, speedPxPerSec: speed, timerMs });
      if (press.kind === 'miss') {
        sweepStartMs = press.sweepStartMs; // the marker returns to the far left; the timer keeps running
        setCursor(0);
        return;
      }
      if (press.kind === 'hit') setCursor(press.cursorPos);
      void finish(press.timing);
    });

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
      await (timing.success ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'tidus-timing', timing });
    };

    overlay.startTimer(timerMs, () => void finish(expireTidusTiming(timerMs)));
    watcher.attach();
    animate();
  });
}
