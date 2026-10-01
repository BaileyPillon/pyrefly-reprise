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
 * The overlay runs for real here (jsdom, fake clock, real `keydown` events on
 * the window, the same `RawInputWatcher` the game uses); the damage runs the
 * real engine.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine, timingBonusFrom } from '../../src/battle/ffx/index.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { expireTidusTiming, pressTidusTiming } from '../../src/ui/ffx/minigames/logic.ts';
import { openTidusTiming } from '../../src/ui/ffx/minigames/TidusTiming.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

// The overlay's defaults: a 360 px bar, gold zone 180 +/- 22 px, 340 px/s.
const BAR = { barWidth: 360, zoneHalfWidth: 22, speedPxPerSec: 340, timerMs: 3000 };
/** 180 px from the far left at 340 px/s: the cursor is dead centre this long into a sweep. */
const CENTRE_MS = Math.round((180 / 340) * 1000); // 529

describe('pressTidusTiming: a miss restarts the sweep, only expiry fails [§5.3 rule 1]', () => {
  it('a press outside the zone is a miss that restarts the sweep at the press time', () => {
    const p = pressTidusTiming({ ...BAR, elapsedMs: 6, sweepStartMs: 0 });
    expect(p).toMatchObject({ kind: 'miss', sweepStartMs: 6 });
  });

  it('after a miss the zone is timed from the restart, not from the opening', () => {
    // 1006 ms after opening the original sweep would be at 342 px (a miss); the restarted one is centred.
    expect(pressTidusTiming({ ...BAR, elapsedMs: 1006, sweepStartMs: 0 }).kind).toBe('miss');
    const hit = pressTidusTiming({ ...BAR, elapsedMs: 477 + CENTRE_MS, sweepStartMs: 477 });
    expect(hit.kind).toBe('hit');
    if (hit.kind === 'hit') expect(hit.timing).toEqual({ success: true, timeRemainingMs: 3000 - 477 - CENTRE_MS, timerMs: 3000 });
  });

  it('a press at or past the timer is the expiry fail, with no time left', () => {
    expect(pressTidusTiming({ ...BAR, elapsedMs: 3000, sweepStartMs: 2471 })).toEqual({ kind: 'expired', timing: expireTidusTiming(3000) });
    expect(expireTidusTiming(2200)).toEqual({ success: false, timeRemainingMs: 0, timerMs: 2200 });
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

  it('a mis-press at ~6 ms does not resolve; the cursor goes back to the far left; the timer then expires as a fail', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(6);
    press();
    expect(o.cursor()).toBe(0); // back at the far left
    await vi.advanceTimersByTimeAsync(100);
    expect(o.result()).toBeUndefined(); // still playing
    expect(o.root.querySelector('.ffx-mg--fail')).toBeNull();
    await vi.advanceTimersByTimeAsync(3500); // past the 3 000 ms timer and the 400 ms of flash + close
    expect(o.result()).toEqual({ kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs: 3000 } });
  });

  it('a mis-press then a correct press resolves the success, with the time left at the correct press', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(6);
    press(); // miss: the sweep restarts at ~6 ms
    await vi.advanceTimersByTimeAsync(CENTRE_MS);
    press(); // the restarted cursor is at the centre now; the next test separates the two sweeps
    await vi.advanceTimersByTimeAsync(1000);
    const r = o.result();
    expect(r?.kind).toBe('tidus-timing');
    if (r?.kind !== 'tidus-timing') return;
    expect(r.timing.success).toBe(true);
    expect(r.timing.timeRemainingMs).toBeGreaterThan(3000 - 6 - CENTRE_MS - 40);
    expect(r.timing.timeRemainingMs).toBeLessThanOrEqual(3000 - 6 - CENTRE_MS + 40);
  });

  it('a mis-press late in the sweep restarts it from the left, so a press timed off the old sweep misses', async () => {
    const o = open();
    await vi.advanceTimersByTimeAsync(700); // past the zone (238 px)
    press(); // miss, restart at 700
    await vi.advanceTimersByTimeAsync(1006 - 700 - 6); // 1000 ms in: the old sweep would be at 340 px, the new at ~102 px
    expect(o.cursor()).toBeLessThan(40); // 102/360 = 28 %
    press(); // a miss on the restarted sweep, still no resolution
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
    expect(timingBonusFrom(timing(false, 2994), sc)).toEqual({ timeRemainingMs: 0, timerMs: 3000 });
    expect(timingBonusFrom(timing(true, 2994), sc)).toEqual({ timeRemainingMs: 2994, timerMs: 3000 });
  });

  for (const def of Object.values(TIDUS)) {
    it(`${def.name}: a fail deals the same whatever the clock showed, and never out-damages a success`, () => {
      const timerMs = { 'energy-rain': 2600, 'blitz-ace': 2200 }[def.id] ?? 3000;
      const expired = total(fire(def, timing(false, 0, timerMs)).amounts);
      expect(total(fire(def, timing(false, timerMs - 6, timerMs)).amounts)).toBe(expired);
      expect(total(fire(def, timing(true, 0, timerMs)).amounts)).toBeGreaterThanOrEqual(expired);
    });
  }
});
