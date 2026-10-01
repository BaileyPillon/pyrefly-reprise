import type { MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher, type UiButton } from '../rawInput.ts';
import { resolveAuronSequence, stepAuronSequence } from './logic.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, bool, num, str } from './params.ts';

const GLYPH: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  confirm: '✕',
  cancel: '○',
  triangle: '△',
  l1: 'L1',
  r1: 'R1',
};

/** How long the missed chip keeps the wrong colour after a reset (the overlay's own 240 ms flash length). */
const WRONG_MARK_MS = 240;

/**
 * Auron — Bushido [visual-bible §3.11.2], restyled onto Ink & Gold's
 * `.ig-minigame__bar--sequence`/`__key` ("Other minigame overlays ... follow
 * the Swordplay slab pattern", `presentation-ink-and-gold.md` "Screens"):
 * enter a button sequence before a 4 000 ms timer expires.
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
 */
export function openAuronSequence(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], 4000);
  const sequence = arr<string>(params['sequence'], ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle']);
  const name = str(params['name'], 'Dragon Fang');
  const targetImmuneToRider = params['targetImmuneToRider'] === undefined ? undefined : bool(params['targetImmuneToRider'], false);

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({ title: name, mechanic: 'Bushido', instruction: 'enter the sequence', timerMs, showBonus: true });
  overlay.bodyEl.innerHTML = `<div class="ig-minigame__bar ig-minigame__bar--sequence" data-role="chips"></div>`;
  const chipsEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="chips"]')!;

  const renderChips = (correctSoFar: number, wrongIndex: number | null): void => {
    chipsEl.innerHTML = sequence
      .map((token, i) => {
        const cls = ['ig-minigame__key'];
        if (wrongIndex !== null && i === wrongIndex) cls.push('ffx-mg-key--wrong');
        else if (i < correctSoFar) cls.push('ig-minigame__key--done');
        return `<div class="${cls.join(' ')}">${GLYPH[token] ?? token.slice(0, 2).toUpperCase()}</div>`;
      })
      .join('');
  };
  renderChips(0, null);

  return new Promise<MinigameResult>((resolve) => {
    let correctSoFar = 0;
    let settled = false;
    let clearWrong = 0;
    const watcher = new RawInputWatcher((b: UiButton) => {
      if (settled) return;
      window.clearTimeout(clearWrong);
      const step = stepAuronSequence(sequence, correctSoFar, b);
      const wrongAt = step.wrong ? correctSoFar : null;
      correctSoFar = step.correctSoFar; // 0 after a wrong press: start over; the timer keeps running [estimate]
      renderChips(correctSoFar, wrongAt);
      if (wrongAt !== null) clearWrong = window.setTimeout(() => { if (!settled) renderChips(correctSoFar, null); }, WRONG_MARK_MS);
      if (step.done) void finish();
    });

    const finish = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      window.clearTimeout(clearWrong);
      watcher.detach();
      const elapsedMs = overlay.elapsedMs();
      const sequenceResult = resolveAuronSequence({
        sequenceLength: sequence.length,
        correctInputs: correctSoFar,
        elapsedMs,
        timerMs,
        ...(targetImmuneToRider !== undefined ? { targetImmuneToRider } : {}),
      });
      await (sequenceResult.success ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'auron-sequence', sequence: sequenceResult });
    };

    overlay.startTimer(timerMs, () => void finish());
    watcher.attach();
  });
}
