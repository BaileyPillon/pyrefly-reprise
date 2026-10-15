import type { MinigameResult } from '../../../battle/common/types.ts';
import { type BushidoFrame, Pad, bushidoFrame, bushidoStart } from '../../../battle/ffx/kernel/minigame-bushido.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { FrameDriver } from './frameDriver.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { DeviceTracker, chipFace, markTappable, sequenceInstruction } from './overlayInput.ts';
import { arr, escapeHtml, num, str } from './params.ts';

/** How long the missed chip keeps the wrong colour after a reset (the overlay's own 240 ms flash length). */
const WRONG_MARK_MS = 240;

/** The pad word each of the overlay's button names stands for (the PS2 layout the game's pad word keeps; `confirm` is Cross, `cancel` is Circle). */
const WORD_OF_BUTTON: Readonly<Record<string, number>> = {
  up: Pad.Up,
  down: Pad.Down,
  left: Pad.Left,
  right: Pad.Right,
  confirm: Pad.Cross,
  cancel: Pad.Circle,
  triangle: Pad.Triangle,
  square: Pad.Square,
  l1: Pad.L1,
  r1: Pad.R1,
};
/** A name the table does not know (a sequence from loose params) never matches any press. */
const NEVER = 0x10000;

/**
 * Auron — Bushido [visual-bible §3.11.2], restyled onto Ink & Gold's
 * `.ig-minigame__bar--sequence`/`__key` ("Other minigame overlays ... follow
 * the Swordplay slab pattern", `presentation-ink-and-gold.md` "Screens"):
 * enter a button sequence before the move's timer expires. The sequence is the
 * Overdrive's own: `params.sequence`, from the ability's `extra.minigameParams`
 * (`data/ffx/overdrives/inputs.ts`: Dragon Fang 8 inputs, Shooting Star
 * and Banishing Blade 7, Tornado 6, in the game's order); the 7-chip default is for demo screens only.
 *
 * ## The game's controller, a frame at a time (re-parity RC9, lane FFX-A; Bailey 2026-10-11, plan question Q1, D-763)
 *
 * The run is judged by `battle/ffx/kernel/minigame-bushido.ts`, which the game's own machine code was run against (`FFX-G01` section 6.3):
 * once every 1/30 s frame the pad's pressed word is compared as a whole word with the next word of the sequence. A press that is not
 * that word, two buttons within one frame included, sends the progress back to input 1 and the attempt goes on (`research/ffx-overdrive-
 * input-rules-2026-09-30.md` Q1, now a fact of the exe); the wrong press is not tried as input 1. The missed chip flashes the existing
 * `ffx-mg-key--wrong` colour while every chip returns to unlit, then the mark clears. The timer keeps running through the reset. Failure
 * is only the timer running out, which resolves the Fail row with no bonus (PR-0267). The result carries the controller frame the last
 * input was seen in (`SequenceResult.frame`) and the time left as the game computes it, `limit - frame / 30` seconds. FFX only.
 *
 * ## Every input can answer, and every chip names its control (PR-0360, PR-0361; FFX only)
 *
 * The sequence and its order are the Overdrive's own and are not touched here (the order is the game's, from the exe). What changed in
 * PR-0360 and 0361 is how a player answers and what the chips say (`overlayInput.ts` has the table):
 *
 * - **Keyboard and pad** go through `RawInputWatcher` as before.
 * - **Mouse and touch**: each chip is a button. A press on chip `i` is the press of
 *   `sequence[i]`, the same abstract button a key or a pad button sends, so a tap runs the identical
 *   controller: the wrong chip resets, the full run succeeds with `correctInputs` = the length.
 * - **The chips name the input in use**: a keyboard or mouse sees the key (`Q`, `Esc`, `K`, `Enter`)
 *   with its PlayStation symbol beside it, a pad sees the symbol, a finger sees big symbols to tap.
 *   Round 21 could not tell a player that Square (release 38's Shooting Star) is K.
 */
export function openAuronSequence(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], 4000);
  const sequence = arr<string>(params['sequence'], ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle']);
  const name = str(params['name'], 'Dragon Fang');
  const move = { limit: timerMs / 1000, words: sequence.map((b) => WORD_OF_BUTTON[b] ?? NEVER) };

  const overlay = new OverdriveOverlay();
  markTappable(overlay.el);
  root.appendChild(overlay.el);
  const device = new DeviceTracker(() => refresh());
  overlay.open({ title: name, mechanic: 'Bushido', instruction: sequenceInstruction(device.current), timerMs, showBonus: true });
  overlay.bodyEl.innerHTML = `<div class="ig-minigame__bar ig-minigame__bar--sequence" data-role="chips"></div>`;
  const chipsEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="chips"]')!;

  const state = bushidoStart();
  let wrongIndex: number | null = null;

  const renderChips = (): void => {
    chipsEl.innerHTML = sequence
      .map((token, i) => {
        const cls = ['ig-minigame__key', 'ffx-mg-key'];
        if (wrongIndex !== null && i === wrongIndex) cls.push('ffx-mg-key--wrong');
        else if (i < state.index) cls.push('ig-minigame__key--done');
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
    /** The buttons pressed since the last frame, as the pad's pressed word (two at once are one word that matches nothing). */
    let pending = 0;

    const finish = async (end: Extract<BushidoFrame, { done: true }>): Promise<void> => {
      if (settled) return;
      settled = true;
      driver.stop();
      window.clearTimeout(clearWrong);
      watcher.detach();
      overlay.el.removeEventListener('pointerdown', onPointer);
      wrongIndex = null;
      renderChips();
      const success = end.grade === 1;
      const sequenceResult = {
        success,
        correctInputs: success ? sequence.length : state.index,
        // A sequence that never completed earns no §5.2 bonus [ffx-combat-core §5.5; PR-0267].
        timeRemainingMs: success ? end.a * 1000 : 0,
        frame: end.frame,
      };
      await (success ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'auron-sequence', sequence: sequenceResult });
    };

    /** One controller frame: the word pressed since the last frame is compared now. */
    const driver = new FrameDriver(
      () => overlay.elapsedMs(),
      () => {
        const word = pending;
        pending = 0;
        const before = state.index;
        const step = bushidoFrame(state, move, word);
        if (step.done) {
          void finish(step);
          return;
        }
        if (word === 0) return;
        window.clearTimeout(clearWrong);
        wrongIndex = step.wrong ? before : null;
        renderChips();
        if (wrongIndex !== null) clearWrong = window.setTimeout(() => { if (!settled) { wrongIndex = null; renderChips(); } }, WRONG_MARK_MS);
      },
    );

    /** One abstract button, from a key, a pad or a chip: seen by the next frame, after the frames already due have gone by. */
    const press = (b: string): void => {
      if (settled) return;
      driver.catchUp();
      if (!settled) pending |= WORD_OF_BUTTON[b] ?? NEVER;
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

    // The ring runs out at the limit: the frames still due go by, then the frame that finds the limit gone ends it.
    overlay.startTimer(timerMs, () => {
      driver.pump();
      if (!settled) driver.forceFrame();
    });
    watcher.attach();
    driver.start();
  });
}
