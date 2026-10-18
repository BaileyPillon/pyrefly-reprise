import type { MinigameResult } from '../../../battle/common/types.ts';
import { FuryController, type FuryPad } from '../../../battle/ffx/kernel/minigame-fury.ts';
import { FURY_LIMIT_SECONDS, FURY_MAX_CASTS, furyThresholds } from '../../../battle/ffx/kernel/minigame-fury-tables.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { FrameDriver } from './frameDriver.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, num, str } from './params.ts';

/** The thresholds the overlay plays: the engine's (`battle/ffx/adapt/minigame.ts#furyParams`), else Fire Fury's at the given Magic. */
function thresholdsFor(params: Record<string, unknown>, magic: number): number[] {
  const given = arr<number>(params['thresholds'], []);
  if (given.length === FURY_MAX_CASTS && given.every((n) => typeof n === 'number')) return given;
  return furyThresholds(num(params['variant'], 1), magic);
}

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
 * ## The game's digital rule (re-parity RC9, lane FFX-A; Bailey 2026-10-11, plan question Q2, D-764)
 *
 * The keyboard and the d-pad are the game's own fallback when no analog stick is present (`battle/ffx/kernel/minigame-fury.ts`, VA 0x00891B80,
 * run against the game's machine code, `FFX-G01` section 6.4): a **left press and a right press make one step**, and **two steps are worth
 * one rotation** (a cast is gained when the step counter plus one, halved, reaches the spell's next threshold). The game reads a button as NEWLY
 * pressed (VA 0x00630CF0 is true when the bit is set now and was not at the last poll: read from the code, VA 0x00631360), so a held key counts once and a
 * step needs a press on each side, in either order. How many rotations each cast costs is the game's table, by spell and by Lulu's Magic. It used to
 * count every alternate press as half a rotation (a step was one press, a rotation two) with an invented rotation cost. Two presses that arrive within
 * one 1/30 s frame are read as both newly pressed in the same poll, which sets neither flag; a step is also dropped when the 0.5 s stall clock clears a
 * left press whose right press has not come. An analog stick would turn the dial by quadrants (the controller handles it, tested) but this overlay has
 * no stick input: that would be a new input, left to the driver. The result reports `sweptDegrees = rotations x 360` (a digital pair of steps is one
 * rotation) and the casts the controller reached.
 */
export function openLuluFury(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], FURY_LIMIT_SECONDS * 1000);
  const magic = num(params['magic'], 20);
  const spellName = str(params['spellName'], 'Fira');
  const thresholds = thresholdsFor(params, magic);

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
    // The controller starts in play with its timer running, as the game stands after its three intro frames; no analog pad.
    const controller = new FuryController(thresholds, timerMs / 1000, false, false, true);
    let settled = false;
    let left = false;
    let right = false;

    const render = (): void => {
      const casts = controller.level;
      counterEl.textContent = `${casts}`;
      // How far into the next cast: the halved counter between this cast's threshold and the next one's.
      const from = thresholds[casts - 1] as number;
      const to = thresholds[casts] as number | undefined;
      const half = (controller.counter + 1) / 2;
      const sweepPct = casts >= FURY_MAX_CASTS || to === undefined ? 100 : Math.max(0, Math.min(100, ((half - from) / (to - from)) * 100));
      dialEl.style.setProperty('--ffx-sweep', `${sweepPct}%`);
    };

    const finish = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      driver.stop();
      watcher.detach();
      const fury = { sweptDegrees: controller.rotations() * 360, casts: controller.level };
      await overlay.flashSuccess();
      await overlay.close();
      resolve({ kind: 'lulu-fury', fury });
    };

    /** One battle frame: the controller's first call reads the presses seen since the last frame, the second call (after the extra pad poll) finds none new. */
    const driver = new FrameDriver(
      () => overlay.elapsedMs(),
      (frame) => {
        const sample: readonly [boolean, boolean] = [left, right];
        left = false;
        right = false;
        const first = controller.calls; // the call about to be made is the frame's first while the count still stands here
        const pad: FuryPad = { stick: () => [0x80, 0x80], buttons: () => (controller.calls === first ? sample : [false, false]) };
        controller.frame(frame / 30, pad);
        render();
        if (controller.done || controller.level >= FURY_MAX_CASTS) void finish();
      },
    );

    const watcher = new RawInputWatcher(
      (b) => {
        if (settled) return;
        if (b !== 'left' && b !== 'right') return;
        driver.catchUp();
        if (settled) return;
        if (b === 'left') left = true;
        else right = true;
      },
      { edgeOnly: true }, // the game reads Left and Right as newly pressed: a held direction does not repeat
    );

    // The ring runs out at the limit: the frames still due go by, then the frame that finds the limit gone ends it.
    overlay.startTimer(timerMs, () => {
      driver.pump();
      if (!settled) driver.forceFrame();
      if (!settled) void finish();
    });
    watcher.attach();
    driver.start();
    render();
  });
}
