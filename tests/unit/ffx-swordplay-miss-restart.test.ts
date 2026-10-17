// @vitest-environment jsdom
/**
 * od2 (FFX only): a Swordplay mis-press is not a failure, and a failed
 * Swordplay earns no §5.2 timing bonus.
 *
 * `research/ffx-combat-core.md` §5.3 rule 1 `[verified: 2 sources]`: "A miss is
 * not a failure. If the player misses, the marker will return to its default
 * position (far left of the meter) and start moving again. ... Failure is
 * timer expiry, not a bad press." Rule 3: "timer expiry selects the distinct
 * weaker "fail" row".
 *
 * Before this fix the overlay resolved on the first press, so a wrong press
 * about 6 ms in reached the engine as `{success:false, timeRemainingMs:2994}`,
 * and `timingBonusFrom` still paid the remaining time: on the fixture board a
 * failed Spiral Cut dealt 529 against 485 for a correct press with 200 ms left.
 *
 * Since re-parity RC9 (lane FFX-A, FFX only) the marker is the game's own controller, a frame at a time (`kernel/minigame-swordplay.ts`, proven against
 * the machine code in `parity-ffx-minigames.test.ts`): a press is seen by the NEXT 1/30 s frame, a miss sends the marker back to the left end and the
 * move goes on, only the limit running out fails, and the result carries the frame.
 *
 * The overlay runs for real here (jsdom, fake clock, real `keydown` events on
 * the window, the same `RawInputWatcher` the game uses); the damage runs the
 * real engine.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine, timingBonusFrom } from '../../src/battle/ffx/index.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { swordplayFrame, swordplayGeometry, swordplayStart } from '../../src/battle/ffx/kernel/minigame-swordplay.ts';
import { openTidusTiming } from '../../src/ui/ffx/minigames/TidusTiming.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

describe('the Swordplay controller: a miss restarts the sweep, only the limit fails [§5.3 rule 1]', () => {
  const g = swordplayGeometry(0x20); // Spiral Cut: window [243, 267], 11 units a frame from 118

  it('a press outside the window is a miss: the marker goes back to the left end and the move goes on', () => {
    const s = swordplayStart(g);
    expect(swordplayFrame(s, g, true)).toEqual({ done: false }); // frame 1: the marker stands at 118, outside the window
    expect(s.misses).toBe(1);
    expect(s.pos).toBe(118 + 11); // restarted at 118 and moved one step
  });

  it('after a miss the window is timed from the restart, not from the opening', () => {
    // a miss in frame 6 restarts the marker: it is judged at 118 + 11 j in frame 6 + j, so the window [243, 267] is reached in frames 18 and 19
    const s = swordplayStart(g);
    for (let f = 1; f <= 5; f++) swordplayFrame(s, g, false);
    swordplayFrame(s, g, true); // frame 6: a miss
    for (let f = 7; f <= 17; f++) expect(swordplayFrame(s, g, false)).toEqual({ done: false });
    expect(swordplayFrame(s, g, true)).toEqual({ done: true, grade: 1, a: Math.fround(3 - 18 / 30), frame: 18 }); // 118 + 11 x 12 = 250
    // the same press 12 frames after the opening would have hit anyway; one timed off the OLD sweep (frame 38) misses on the restarted one
    const t = swordplayStart(g);
    for (let f = 1; f <= 5; f++) swordplayFrame(t, g, false);
    swordplayFrame(t, g, true);
    for (let f = 7; f <= 37; f++) swordplayFrame(t, g, false);
    expect(swordplayFrame(t, g, true)).toEqual({ done: false }); // frame 38: the old sweep's window, the restarted marker is at 118 + 11 x 32 reflected
  });

  it('a press past the limit is the expiry fail, with no time left', () => {
    const s = swordplayStart(g);
    for (let f = 1; f <= 90; f++) swordplayFrame(s, g, false);
    expect(swordplayFrame(s, g, true)).toEqual({ done: true, grade: 0, a: 0, frame: 91 }); // frame 91 finds A = 0 before it looks at the press
  });
});

describe('the real overlay with real keys: miss -> restart -> hit or expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const press = (): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' }));
  };
  const open = () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openTidusTiming(root, { name: 'Spiral Cut', timerMs: 3000 }).then((r) => (result = r));
    const cursor = (): number => parseFloat((root.querySelector<HTMLElement>('[data-role="cursor"]')!.style.left || '0').replace('%', ''));
    return { root, cursor, result: () => result };
  };

  it('a mis-press at ~6 ms does not resolve; the cursor goes back to the far left; the limit then ends it as a fail', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(6);
    press();
    await vi.advanceTimersByTimeAsync(60); // frame 1 (due at 33 ms, run on the next animation frame) sees the press: a miss, the marker restarts at 118 and steps to 129
    expect(o.cursor()).toBeCloseTo(((129 - 118) / 275) * 100, 1); // 4 percent
    await vi.advanceTimersByTimeAsync(100);
    expect(o.result()).toBeUndefined(); // still playing
    expect(o.root.querySelector('.ffx-mg--fail')).toBeNull();
    await vi.advanceTimersByTimeAsync(3500); // past the 3 000 ms limit and the 400 ms of flash + close
    expect(o.result()).toEqual({ kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs: 3000, frame: 91 } });
  });

  it('a mis-press then a correct press resolves the success, with the time left at the frame the correct press was seen in', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(6);
    press(); // miss in frame 1: the marker restarts, and is judged at 118 + 11 j in frame 1 + j
    await vi.advanceTimersByTimeAsync(414); // t = 420 ms: frame 13 (due at 433 ms) will judge 118 + 11 x 12 = 250, inside [243, 267]
    press();
    await vi.advanceTimersByTimeAsync(1000);
    const r = o.result();
    expect(r?.kind).toBe('tidus-timing');
    if (r?.kind !== 'tidus-timing') return;
    expect(r.timing.success).toBe(true);
    expect(r.timing.frame).toBe(13);
    expect(r.timing.timeRemainingMs).toBeCloseTo(Math.fround(3 - 13 / 30) * 1000, 6); // 2566.67 ms
  });

  it('a mis-press late in the sweep restarts it from the left, so a press timed off the old sweep misses', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(700); // past the window on the way out
    press(); // seen by frame 22 (733 ms): a miss, restart
    await vi.advanceTimersByTimeAsync(1000 - 700); // t = 1000 ms, frame 30: the restarted marker is at 129 + 8 x 11 = 217, the old sweep's would be elsewhere
    expect(o.cursor()).toBeLessThan(40); // (217 - 118) / 275 = 36 percent
    press(); // frame 31 judges 217: a miss on the restarted sweep, still no resolution
    await vi.advanceTimersByTimeAsync(50);
    expect(o.result()).toBeUndefined();
  });
});

/** Tidus's Overdrive on a fixed seeded board (one 99 999 HP dummy), the real engine. */
function fire(def: AbilityDef, result: MinigameResult): { amounts: number[]; tick: number } {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(1);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus', overdrive: od }), member({ id: 'auron' }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999 })] },
    }),
  );
  for (let i = 0; i < 200; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input' || d.actorId === 'tidus') break;
    engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'], extra: result };
  const events: BattleEvent[] = [];
  for (let i = 0; i < 5 && !events.some((e) => e.type === 'action-end'); i++) events.push(...engine.submit(cmd));
  const tick = engine.predictTurnOrder(30).find((p) => p.actorId === 'tidus')?.tickValue ?? -1;
  return { amounts: events.flatMap((e) => (e.type === 'damage' && e.sourceId === 'tidus' ? [e.amount] : [])), tick };
}
const timing = (success: boolean, timeRemainingMs: number, timerMs = 3000): MinigameResult => ({ kind: 'tidus-timing', timing: { success, timeRemainingMs, timerMs } });
const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

describe('a failed Swordplay earns no timing bonus [§5.2, §5.3; as PR-0267 for Bushido]', () => {
  it('timingBonusFrom pays 0 ms on any failed timing input, and the remaining time on a success', () => {
    const sc = TIDUS['spiral-cut']!;
    // RC9 lane FFX-B3 (FFX only): the payload also carries `scale`, the game's own A and B as float32 SECONDS (a failure: A = 0; a result with no frame: the float32
    // of its time left; FFX-G01 section 5). Before, it was these two milliseconds only. The proof is `parity-ffx-engine-od-results.test.ts`.
    expect(timingBonusFrom(timing(false, 2994), sc)).toEqual({ timeRemainingMs: 0, timerMs: 3000, scale: { a: 0, b: 3 } });
    expect(timingBonusFrom(timing(true, 2994), sc)).toEqual({ timeRemainingMs: 2994, timerMs: 3000, scale: { a: Math.fround(2.994), b: 3 } });
  });

  for (const def of Object.values(TIDUS)) {
    it(`${def.name}: a fail deals the same whatever the clock showed, and never out-damages a success`, () => {
      const timerMs = { 'blitz-ace': 2000 }[def.id] ?? 3000; // the game's limits: 3 s, Blitz Ace 2 s (it was 2.6 s for Energy Rain and 2.2 s for Blitz Ace)
      const expired = total(fire(def, timing(false, 0, timerMs)).amounts);
      expect(total(fire(def, timing(false, timerMs - 6, timerMs)).amounts)).toBe(expired);
      expect(total(fire(def, timing(true, 0, timerMs)).amounts)).toBeGreaterThanOrEqual(expired);
    });
  }
});
