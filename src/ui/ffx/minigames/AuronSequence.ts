import type { MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { resolveAuronSequence, stepAuronSequence } from './logic.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { DeviceTracker, chipFace, markTappable, sequenceInstruction } from './overlayInput.ts';
import { arr, escapeHtml, num, str } from './params.ts';

/** How long the missed chip keeps the wrong colour after a reset (the overlay's own 240 ms flash length). */
const WRONG_MARK_MS = 240;

/**
 * Auron — Bushido [visual-bible §3.11.2], restyled onto Ink & Gold's
 * `.ig-minigame__bar--sequence`/`__key` ("Other minigame overlays ... follow
 * the Swordplay slab pattern", `presentation-ink-and-gold.md` "Screens"):
 * enter a button sequence before a 4 000 ms timer expires. The sequence is the
 * Overdrive's own: `params.sequence`, from the ability's `extra.minigameParams`
 * (`data/ffx/overdrives/inputs.ts`, PR-0308: Dragon Fang 8 inputs, Shooting Star
 * and Banishing Blade 7, Tornado 6); the 7-chip default is for demo screens only.
 *
 * A wrong press sends the progress back to input 1 and the attempt goes on:
 * `research/ffx-overdrive-input-rules-2026-09-30.md` Q1 `[verified: 3
 * sources]`, "if an incorrect button is pressed, you must start the sequence
 * over" (GF-PF); `stepAuronSequence`. The missed chip flashes the existing
 * `ffx-mg-key--wrong` colour while every chip returns to unlit, then the mark
 * clears. The timer keeps running through the reset `[estimate]`: GF-HD calls
 * it "a fixed amount of time" and no source describes the timer at the reset.
 * Failure is only the timer running out, which resolves the Fail row with no
 * bonus (PR-0267). FFX only.
 *
 * ## Every input can answer, and every chip names its control (PR-0360, PR-0361; FFX only)
 *
 * The sequence and its order are the Overdrive's own and are not touched here (the order is our
 * estimate, GameFAQs', pending Bailey's Steam check). What changed is how a player answers and what
 * the chips say (`overlayInput.ts` has the table):
 *
 * - **Keyboard and pad** go through `RawInputWatcher` as before.
 * - **Mouse and touch**: each chip is a button. A press on chip `i` is the press of
 *   `sequence[i]`, the same abstract button a key or a pad button sends, so a tap runs the identical
 *   `stepAuronSequence`: the wrong chip resets, the full run succeeds with `correctInputs` = the length.
 * - **The chips name the input in use**: a keyboard or mouse sees the key (`Q`, `Esc`, `K`, `Enter`)
 *   with its PlayStation symbol beside it, a pad sees the symbol, a finger sees big symbols to tap.
 *   Round 21 could not tell a player that Square (release 38's Shooting Star) is K.
 */
export function openAuronSequence(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], 4000);
  const sequence = arr<string>(params['sequence'], ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle']);
  const name = str(params['name'], 'Dragon Fang');

  const overlay = new OverdriveOverlay();
  markTappable(overlay.el);
  root.appendChild(overlay.el);
  const device = new DeviceTracker(() => refresh());
  overlay.open({ title: name, mechanic: 'Bushido', instruction: sequenceInstruction(device.current), timerMs, showBonus: true });
  overlay.bodyEl.innerHTML = `<div class="ig-minigame__bar ig-minigame__bar--sequence" data-role="chips"></div>`;
  const chipsEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="chips"]')!;

  let correctSoFar = 0;
  let wrongIndex: number | null = null;

  const renderChips = (): void => {
    chipsEl.innerHTML = sequence
      .map((token, i) => {
        const cls = ['ig-minigame__key', 'ffx-mg-key'];
        if (wrongIndex !== null && i === wrongIndex) cls.push('ffx-mg-key--wrong');
        else if (i < correctSoFar) cls.push('ig-minigame__key--done');
        const face = chipFace(token, device.current);
        const sub = face.sub ? `<i class="ffx-mg-key__sub">${escapeHtml(face.sub)}</i>` : '';
        return (
          `<div class="${cls.join(' ')}" data-chip="${i}" data-btn="${escapeHtml(token)}" role="button" aria-label="${escapeHtml(face.aria)}">` +
          `<b class="ffx-mg-key__main">${escapeHtml(face.main)}</b>${sub}</div>`
        );
      })
      .join('');
  };
  /** The words and the chips follow the device in use (the same rule as Trigger Happy's `MASH R` / `MASH TAP`). */
  const refresh = (): void => {
    overlay.el.dataset['input'] = device.current.device;
    overlay.setInstruction(sequenceInstruction(device.current));
    renderChips();
  };
  overlay.el.dataset['input'] = device.current.device;
  renderChips();

  return new Promise<MinigameResult>((resolve) => {
    let settled = false;
    let clearWrong = 0;

    /** One abstract button, from a key, a pad or a chip. The one place the sequence advances. */
    const press = (b: string): void => {
      if (settled) return;
      window.clearTimeout(clearWrong);
      const step = stepAuronSequence(sequence, correctSoFar, b);
      wrongIndex = step.wrong ? correctSoFar : null;
      correctSoFar = step.correctSoFar; // 0 after a wrong press: start over; the timer keeps running [estimate]
      renderChips();
      if (wrongIndex !== null) clearWrong = window.setTimeout(() => { if (!settled) { wrongIndex = null; renderChips(); } }, WRONG_MARK_MS);
      if (step.done) void finish();
    };

    const watcher = new RawInputWatcher((b, source) => {
      if (settled) return;
      device.note(source);
      press(b);
    });

    // Mouse and touch: a press on chip i is the press of sequence[i] (PR-0360). `pointerdown`, not `click`: the
    // chips are rebuilt on every press, and a finger that lifts over a rebuilt chip would never click anything.
    const onPointer = (e: PointerEvent): void => {
      if (settled || e.button > 0) return;
      const chip = (e.target as Element | null)?.closest<HTMLElement>('[data-chip]');
      if (!chip || !chipsEl.contains(chip)) return;
      e.preventDefault();
      device.note('pointer', e.pointerType);
      press(sequence[Number(chip.dataset['chip'])] ?? '');
    };
    overlay.el.addEventListener('pointerdown', onPointer);

    const finish = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      window.clearTimeout(clearWrong);
      watcher.detach();
      overlay.el.removeEventListener('pointerdown', onPointer);
      const elapsedMs = overlay.elapsedMs();
      const sequenceResult = resolveAuronSequence({
        sequenceLength: sequence.length,
        correctInputs: correctSoFar,
        elapsedMs,
        timerMs,
      });
      await (sequenceResult.success ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'auron-sequence', sequence: sequenceResult });
    };

    overlay.startTimer(timerMs, () => void finish());
    watcher.attach();
  });
}
