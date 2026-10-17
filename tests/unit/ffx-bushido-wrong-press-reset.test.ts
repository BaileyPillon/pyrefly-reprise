// @vitest-environment jsdom
/**
 * od3 (FFX only): a wrong Bushido press sends the progress back to input 1 and
 * the attempt goes on; only timer expiry fails. Since re-parity RC9 (lane FFX-A, FFX only) the rule is the one of the game's own controller
 * (`kernel/minigame-bushido.ts`, proven against the machine code in `parity-ffx-minigames.test.ts`): a press is compared once a frame (1/30 s) as a whole word,
 * and a seen press changes the chips at the next frame.
 *
 * `research/ffx-overdrive-input-rules-2026-09-30.md` Q1, reset-to-start
 * `[verified: 3 sources]` (GF-PF, GF-HD, AF): "if an incorrect button is
 * pressed, you must start the sequence over" (GF-PF); "if you make a mistake,
 * you must start over from the beginning" and "otherwise there is no penalty"
 * (GF-HD). The timer running on through the reset is `[estimate]` (no source
 * describes the timer at the reset). A fail resolves the Fail row with no §5.2
 * bonus (PR-0267, `ffx-bushido-fail-bonus.test.ts`).
 *
 * Before this fix a wrong press ended the attempt at once (visual-bible
 * §3.11.2's old authored rule): real keys in Chapter II, three correct inputs
 * then a wrong one ~400 ms in, reached the engine as `{success:false,
 * correctInputs:3, timeRemainingMs:0}` and Dragon Fang dealt the Fail row.
 *
 * The overlay runs for real here (jsdom, fake clock, real `keydown` events on
 * the window, the same `RawInputWatcher` the game uses); the damage runs the
 * real engine.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, Command, Decision, MinigameResult, SequenceResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { openAuronSequence } from '../../src/ui/ffx/minigames/AuronSequence.ts';
import { Pad, type BushidoMove, bushidoFrame, bushidoStart } from '../../src/battle/ffx/kernel/minigame-bushido.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

// The overlay's default sequence (what `minigameParams` plays today: it publishes no `sequence`).
const SEQ = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle'] as const;
const KEY: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', cancel: 'KeyX', triangle: 'KeyQ', l1: 'KeyF', r1: 'KeyR' };

const WORD: Record<string, number> = { up: Pad.Up, down: Pad.Down, left: Pad.Left, right: Pad.Right, confirm: Pad.Cross, cancel: Pad.Circle, triangle: Pad.Triangle, l1: Pad.L1, r1: Pad.R1 };
const MOVE: BushidoMove = { limit: 4, words: SEQ.map((b) => WORD[b] as number) };

/** Feed the buttons one a frame; returns the controller's state after the last one and what the last frame said. */
function feed(buttons: readonly string[], start = bushidoStart()) {
  let last: ReturnType<typeof bushidoFrame> = { done: false, wrong: false };
  for (const b of buttons) last = bushidoFrame(start, MOVE, WORD[b] as number);
  return { state: start, last };
}

describe('the controller: a wrong press resets to input 1 and the attempt continues [Q1, now a fact of the exe]', () => {
  it('a wrong press mid-sequence goes back to input 1 and is not the end of the attempt', () => {
    const r = feed(['up', 'down', 'left', 'down']);
    expect(r.last).toEqual({ done: false, wrong: true });
    expect(r.state.index).toBe(0);
  });

  it('a wrong first press stays at input 1, still not done', () => {
    const r = feed(['triangle']);
    expect(r.last).toEqual({ done: false, wrong: true });
    expect(r.state.index).toBe(0);
  });

  it('the wrong press itself does not count as input 1 even when it is that button', () => {
    const r = feed(['up', 'down', 'left', 'up']); // input 4 is right; up is input 1 but does not start the run again
    expect(r.last).toEqual({ done: false, wrong: true });
    expect(r.state.index).toBe(0);
  });

  it('after a reset the full correct sequence completes', () => {
    const r0 = feed(['up', 'down', 'left', 'down']);
    expect(r0.state.index).toBe(0);
    const r1 = feed(SEQ, r0.state);
    expect(r1.last).toMatchObject({ done: true, grade: 1 });
  });

  it('two buttons in one frame are one word that matches nothing: a wrong press', () => {
    const s = bushidoStart();
    bushidoFrame(s, MOVE, Pad.Up);
    expect(bushidoFrame(s, MOVE, Pad.Down | Pad.Left)).toEqual({ done: false, wrong: true });
    expect(s.index).toBe(0);
  });

  it('a reset left unfinished fails at the limit with no time remaining (PR-0267): frame 121 of a 4 s move, A = 0', () => {
    const s = bushidoStart();
    let r = feed(['up', 'down', 'left', 'down'], s).last;
    for (let f = 5; f <= 121; f++) r = bushidoFrame(s, MOVE, 0);
    expect(r).toEqual({ done: true, grade: 0, a: 0, frame: 121 });
  });
});

describe('the real overlay with real keys: wrong press -> reset -> success or expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const press = (button: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY[button], key: KEY[button] }));
  };
  const open = () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openAuronSequence(root, { name: 'Dragon Fang', timerMs: 4000, sequence: [...SEQ] }).then((r) => (result = r));
    const chips = () => [...root.querySelectorAll<HTMLElement>('[data-role="chips"] .ig-minigame__key')];
    const done = (): number => chips().filter((c) => c.classList.contains('ig-minigame__key--done')).length;
    const wrong = (): number[] => chips().flatMap((c, i) => (c.classList.contains('ffx-mg-key--wrong') ? [i] : []));
    return { root, done, wrong, result: () => result };
  };
  const enter = async (buttons: readonly string[], gapMs: number): Promise<void> => {
    for (const b of buttons) {
      press(b);
      await vi.advanceTimersByTimeAsync(gapMs);
    }
  };

  it('a wrong press does not resolve: every chip returns to unlit, the missed chip flashes the wrong colour, then clears', async () => {
    const o = open();
    await enter(['up', 'down', 'left'], 100);
    expect(o.done()).toBe(3);
    press('down'); // wrong: input 4 is "right"; the next frame (within 1/30 s) sees it
    await vi.advanceTimersByTimeAsync(40);
    expect(o.done()).toBe(0);
    expect(o.wrong()).toEqual([3]);
    expect(o.root.querySelector('.ffx-mg--fail')).toBeNull();
    await vi.advanceTimersByTimeAsync(300);
    expect(o.wrong()).toEqual([]);
    expect(o.done()).toBe(0);
    expect(o.result()).toBeUndefined(); // still playing
  });

  it('a wrong press then the full sequence succeeds, with the time left at the last correct input (the timer ran on through the reset)', async () => {
    const o = open();
    await enter(['up', 'down', 'left'], 100); // 300 ms
    press('down'); // wrong at 300 ms
    await vi.advanceTimersByTimeAsync(100); // 400 ms
    await enter(SEQ.slice(0, 6), 100); // 1 000 ms
    press(SEQ[6]); // the last correct input at 1 000 ms
    await vi.advanceTimersByTimeAsync(1000);
    const r = o.result();
    expect(r?.kind).toBe('auron-sequence');
    if (r?.kind !== 'auron-sequence') return;
    expect(r.sequence.success).toBe(true);
    expect(r.sequence.correctInputs).toBe(7);
    // 4 000 - 1 000 = 3 000, measured from the opening, not from the reset: the last press at 1 000 ms is seen by frame 31, A = 4 - 31/30 s.
    expect(r.sequence.frame).toBe(31);
    expect(r.sequence.timeRemainingMs).toBeCloseTo(Math.fround(4 - 31 / 30) * 1000, 6);
  });

  it('a wrong press and then nothing fails only at the timer, as the Fail row with no time remaining', async () => {
    const o = open();
    await enter(['up', 'down', 'left'], 100);
    press('down');
    await vi.advanceTimersByTimeAsync(3000); // 3 300 ms: still open
    expect(o.result()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1200); // past 4 000 ms and the 400 ms of flash + close
    expect(o.result()).toEqual({ kind: 'auron-sequence', sequence: { success: false, correctInputs: 0, timeRemainingMs: 0, frame: 121 } }); // the frame that finds 4 s gone
  });

  it('several wrong presses in a row keep the attempt open; a full sequence after them still succeeds', async () => {
    const o = open();
    await enter(['triangle', 'up', 'up', 'r1'], 100); // wrong, right, wrong, wrong
    expect(o.done()).toBe(0);
    expect(o.result()).toBeUndefined();
    await enter(SEQ, 100);
    await vi.advanceTimersByTimeAsync(600);
    const r = o.result();
    expect(r?.kind === 'auron-sequence' && r.sequence.success).toBe(true);
  });
});

/** Dragon Fang on a fixed seeded board (one 99 999 HP dummy), the real engine. */
function fang(sequence: SequenceResult): number {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), AURON['dragon-fang']!]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(1);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: ['dragon-fang'] };
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus' }), member({ id: 'auron', overdrive: od }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999 })] },
    }),
  );
  for (let i = 0; i < 200; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input' || d.actorId === 'auron') break;
    engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  const cmd: Command = { kind: 'overdrive', id: 'dragon-fang', targets: ['dummy'], extra: { kind: 'auron-sequence', sequence } };
  const events: BattleEvent[] = [];
  for (let i = 0; i < 5 && !events.some((e) => e.type === 'action-end'); i++) events.push(...engine.submit(cmd));
  return events.reduce((sum, e) => (e.type === 'damage' && e.sourceId === 'auron' ? sum + e.amount : sum), 0);
}

describe('what reaches the engine after a reset', () => {
  it('reset then expiry deals exactly the no-press Fail row; reset then completion deals the success with its bonus', () => {
    const expiry = fang({ success: false, correctInputs: 0, timeRemainingMs: 0 });
    const noPress = fang({ success: false, correctInputs: 0, timeRemainingMs: 0, frame: 121 });
    const retried = fang({ success: true, correctInputs: 7, timeRemainingMs: 3000, frame: 30 });
    const slowSuccess = fang({ success: true, correctInputs: 7, timeRemainingMs: 0 });
    expect(noPress).toBe(expiry);
    expect(retried).toBeGreaterThan(slowSuccess);
    expect(slowSuccess).toBeGreaterThan(expiry);
  });
});
