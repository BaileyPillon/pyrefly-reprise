import type { MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { degreesPerCast, resolveFury } from './logic.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { num, str } from './params.ts';

/**
 * Lulu — Fury [visual-bible §3.11.4], restyled onto Ink & Gold's
 * `.ig-minigame` shell ("Other minigame overlays ... follow the Swordplay
 * slab pattern"): rotate for ~4s to cast a spell up to 16 times. No timing
 * damage bonus, so no `+%` readout and no ring colour ramp.
 *
 * Per `docs/CONTRACT-CHANGES.md` decision 9: the spell is chosen **before**
 * this overlay opens — the command menu lists each learned `<spell>-fury`
 * ability separately (derived from the `'fury'` marker ability's
 * `extra.resolvesToOneOf`), and that choice becomes `OverdriveCommand.id`.
 * This overlay only runs the rotation; it never picks a spell, and
 * `FuryResult` carries no spell field by design.
 *
 * Real analog-stick rotation needs a connected gamepad; the documented
 * **keyboard fallback** — alternating left/right presses count as a
 * half-rotation (180°) each [visual-bible §3.11.4] — is what this
 * implementation drives directly, so it works identically with keyboard,
 * gamepad d-pad taps, or mouse clicks on the dial.
 */
export function openLuluFury(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], 4000);
  const magic = num(params['magic'], 20);
  const spellName = str(params['spellName'], 'Fira');

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({ title: 'Fury', mechanic: 'Fury', instruction: 'alternate left/right to rotate', timerMs, showBonus: false });
  overlay.bodyEl.innerHTML = `
    <div class="ffx-mg-fury">
      <div class="ffx-mg-dial" data-role="dial"><div class="ffx-mg-dial__counter" data-role="counter">0</div></div>
      <div class="ffx-mg-fury__caption">${spellName.toUpperCase()}<small>/ 16 CASTS</small></div>
    </div>`;
  const dialEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="dial"]')!;
  const counterEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="counter"]')!;

  return new Promise<MinigameResult>((resolve) => {
    let sweptDegrees = 0;
    let lastDir: 'left' | 'right' | null = null;
    let settled = false;

    const render = (): void => {
      const casts = resolveFury(sweptDegrees, magic).casts;
      counterEl.textContent = `${casts}`;
      const need = degreesPerCast(magic, casts);
      const intoCurrent = sweptDegrees - sumDegrees(magic, casts);
      const sweepPct = casts >= 16 ? 100 : Math.min(100, (intoCurrent / need) * 100);
      dialEl.style.setProperty('--ffx-sweep', `${sweepPct}%`);
      if (casts >= 16) void finish();
    };

    const watcher = new RawInputWatcher((b) => {
      if (settled) return;
      if (b !== 'left' && b !== 'right') return;
      if (b !== lastDir) {
        sweptDegrees += 180;
        lastDir = b;
        render();
      }
    });

    const finish = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      const fury = resolveFury(sweptDegrees, magic);
      await overlay.flashSuccess();
      await overlay.close();
      resolve({ kind: 'lulu-fury', fury });
    };

    overlay.startTimer(timerMs, () => void finish());
    watcher.attach();
    render();
  });
}

function sumDegrees(magic: number, casts: number): number {
  let total = 0;
  for (let i = 0; i < casts; i++) total += degreesPerCast(magic, i);
  return total;
}
