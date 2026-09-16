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

/**
 * Auron — Bushido [visual-bible §3.11.2], restyled onto Ink & Gold's
 * `.ig-minigame__bar--sequence`/`__key` ("Other minigame overlays ... follow
 * the Swordplay slab pattern", `presentation-ink-and-gold.md` "Screens"):
 * enter a button sequence before a 4 000 ms timer expires. No partial
 * credit — a wrong input ends the attempt immediately.
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
    const watcher = new RawInputWatcher((b: UiButton) => {
      if (settled) return;
      const step = stepAuronSequence(sequence, correctSoFar, b);
      const wrongAt = step.wrong ? correctSoFar : null;
      correctSoFar = step.correctSoFar;
      renderChips(correctSoFar, wrongAt);
      if (step.done) void finish();
    });

    const finish = async (): Promise<void> => {
      if (settled) return;
      settled = true;
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
