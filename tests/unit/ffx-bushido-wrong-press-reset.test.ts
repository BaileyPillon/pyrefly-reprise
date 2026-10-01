// @vitest-environment jsdom
/**
 * od3 (FFX only): a wrong Bushido press sends the progress back to input 1 and
 * the attempt goes on; only timer expiry fails.
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
import { resolveAuronSequence, stepAuronSequence } from '../../src/ui/ffx/minigames/logic.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

// The overlay's default sequence (what `minigameParams` plays today: it publishes no `sequence`).
const SEQ = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle'] as const;
const KEY: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', cancel: 'KeyX', triangle: 'KeyQ', l1: 'KeyF', r1: 'KeyR' };

describe('stepAuronSequence: a wrong press resets to input 1 and the attempt continues [Q1, verified: 3 sources]', () => {
  it('a wrong press mid-sequence goes back to input 1 and is not the end of the attempt', () => {
    expect(stepAuronSequence(SEQ, 3, 'down')).toEqual({ correctSoFar: 0, wrong: true, done: false });
  });

  it('a wrong first press stays at input 1, still not done', () => {
    expect(stepAuronSequence(SEQ, 0, 'triangle')).toEqual({ correctSoFar: 0, wrong: true, done: false });
  });

  it('the wrong press itself does not count as input 1 even when it is that button [estimate]', () => {
    expect(stepAuronSequence(SEQ, 3, 'up')).toEqual({ correctSoFar: 0, wrong: true, done: false });
  });

  it('after a reset the full correct sequence completes', () => {
    let c = 0;
    for (const b of ['up', 'down', 'left', 'down']) c = stepAuronSequence(SEQ, c, b).correctSoFar;
    expect(c).toBe(0);
    let last = { correctSoFar: 0, wrong: false, done: false };
    for (const b of SEQ) {
      last = stepAuronSequence(SEQ, c, b);
      c = last.correctSoFar;
    }
    expect(last).toEqual({ correctSoFar: 7, wrong: false, done: true });
  });

  it('a reset left unfinished resolves at expiry as a fail with no time remaining (PR-0267)', () => {
    expect(resolveAuronSequence({ sequenceLength: 7, correctInputs: 0, elapsedMs: 4000, timerMs: 4000 })).toEqual({ success: false, correctInputs: 0, timeRemainingMs: 0 });
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
    press('down'); // wrong: input 4 is "right"
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
    // 4 000 - 1 000 = 3 000, measured from the opening, not from the reset.
    expect(r.sequence.timeRemainingMs).toBeGreaterThan(3000 - 40);
    expect(r.sequence.timeRemainingMs).toBeLessThanOrEqual(3000 + 40);
  });

  it('a wrong press and then nothing fails only at the timer, as the Fail row with no time remaining', async () => {
    const o = open();
    await enter(['up', 'down', 'left'], 100);
    press('down');
    await vi.advanceTimersByTimeAsync(3000); // 3 300 ms: still open
    expect(o.result()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1200); // past 4 000 ms and the 400 ms of flash + close
    expect(o.result()).toEqual({ kind: 'auron-sequence', sequence: { success: false, correctInputs: 0, timeRemainingMs: 0 } });
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
    const noPress = fang(resolveAuronSequence({ sequenceLength: 7, correctInputs: 0, elapsedMs: 4000, timerMs: 4000 }));
    const retried = fang(resolveAuronSequence({ sequenceLength: 7, correctInputs: 7, elapsedMs: 1000, timerMs: 4000 }));
    const slowSuccess = fang({ success: true, correctInputs: 7, timeRemainingMs: 0 });
    expect(noPress).toBe(expiry);
    expect(retried).toBeGreaterThan(slowSuccess);
    expect(slowSuccess).toBeGreaterThan(expiry);
  });
});
