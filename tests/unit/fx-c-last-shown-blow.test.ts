/**
 * The finishing-blow accent follows the last blow the action SHOWS, not the last one it calculated (FFX only; release 53, the driver's item on RC10's hit-order lane).
 *
 * Since RC10 an action that hits several targets calculates every hit target by target but replays the hits round by round (`battle/ffx/hit-order.ts#runInRounds`), and each damage event
 * keeps the index it was CALCULATED at. `SpectacleRules.planHit` used to key the Overdrive's finishing accent (the heavy hit-stop, the impact frame, the trauma and the camera kick) on
 * `hitIndex >= hitCount - 1`, which is the last calculated hit: with unequal hit counts (Lulu's Fire Fury over two foes that take five and two hits) that hit is the FOURTH of seven shown, and
 * the blow shown last got nothing. The presenter now reads the burst it is playing (`presenterHooks.ts#isLastShownBlow`) and tells `planHit` which blow is the last one shown.
 *
 * FFX-2 is untouched: its events are shown in the order they were calculated, `planHit` keeps the index rule for it, and a test below pins that.
 */
import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { fxActionOpen, fxHit, isLastShownBlow, type FxStagePort } from '../../src/engine/fx/c/presenterHooks.ts';
import { planHit, type HitInfo, type SpectacleFlags } from '../../src/engine/fx/c/SpectacleRules.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;

const flags = (o: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, ...o });

let seq = 0;
const dmg = (targetId: string, hitIndex: number, hitCount: number, o: Partial<Damage> = {}): Damage =>
  ({ type: 'damage', seq: seq++, targetId, sourceId: 'lulu', amount: 900, element: 'fire', crit: false, hitIndex, hitCount, ...o }) as Damage;
const start = (actorId = 'lulu'): BattleEvent => ({ type: 'action-start', seq: seq++, actorId, command: { kind: 'overdrive' }, abilityName: 'Fire Fury', targets: [] }) as unknown as BattleEvent;
const end = (actorId = 'lulu'): BattleEvent => ({ type: 'action-end', seq: seq++, actorId }) as BattleEvent;
const miss = (targetId: string): BattleEvent => ({ type: 'miss', seq: seq++, targetId, sourceId: 'lulu', reason: 'evaded' }) as BattleEvent;

/**
 * Fire Fury over two foes, A taking five hits and B two (calculated A0..A4 = 0..4, B = 5..6, seven in all), shown round by round: A0, B5, A1, B6, A2, A3, A4.
 * The last CALCULATED hit (index 6) is the second blow of B, shown fourth.
 */
function fireFury(): BattleEvent[] {
  return [start(), dmg('a', 0, 7), dmg('b', 5, 7), dmg('a', 1, 7), dmg('b', 6, 7), dmg('a', 2, 7), dmg('a', 3, 7), dmg('a', 4, 7), end()];
}

describe('the last blow an action shows (FFX)', () => {
  it('is the last one replayed, not the one with the highest calculation index (Fire Fury over foes taking 5 and 2 hits)', () => {
    const events = fireFury();
    const lasts = events.map((_, at) => (events[at]!.type === 'damage' ? isLastShownBlow(events, at) : null));
    expect(lasts).toEqual([null, false, false, false, false, false, false, true, null]);
    // The index rule it replaces fired on the fourth blow shown (calculation index 6 of 7) and on nothing after it.
    const old = events.filter((e): e is Damage => e.type === 'damage').map((e) => e.hitIndex >= e.hitCount - 1);
    expect(old).toEqual([false, false, false, true, false, false, false]);
  });

  it('is the only blow of a single hit, and the last of an even spread (round-robin, two foes of two hits)', () => {
    const one = [start(), dmg('a', 0, 1), end()];
    expect(isLastShownBlow(one, 1)).toBe(true);
    const even = [start(), dmg('a', 0, 4), dmg('b', 2, 4), dmg('a', 1, 4), dmg('b', 3, 4), end()];
    expect(even.map((_, at) => (even[at]!.type === 'damage' ? isLastShownBlow(even, at) : null))).toEqual([null, false, false, false, true, null]);
  });

  it('skips what is not a blow: a miss, an IMMUNE or zero number and a heal are not shown as hits, so the last blow that lands takes the accent', () => {
    const events = [start(), dmg('a', 0, 4), dmg('b', 2, 4), dmg('a', 1, 4), miss('b'), dmg('a', 9, 4, { amount: 0 }), dmg('a', 9, 4, { affinity: 'immune' }), dmg('a', 9, 4, { amount: -300 }), end()];
    expect(events.map((_, at) => (events[at]!.type === 'damage' ? isLastShownBlow(events, at) : null))).toEqual([null, false, false, true, null, true, true, true, null]);
  });

  it('stops at the end of its own action: the next action\'s blows, and another actor\'s counter inside it, do not take the accent away', () => {
    const events = [start(), dmg('a', 0, 2), dmg('a', 1, 2), dmg('lulu', 0, 1, { sourceId: 'a' }), end(), start('rikku'), dmg('a', 0, 1, { sourceId: 'rikku' }), end('rikku')];
    expect(isLastShownBlow(events, 2)).toBe(true); // her last blow: the counter after it is another source's
    expect(isLastShownBlow(events, 1)).toBe(false);
    expect(isLastShownBlow(events, 3)).toBe(true); // the counter is the last of its own source
    expect(isLastShownBlow(events, 6)).toBe(true);
  });
});

describe('planHit keys the finishing accent on the blow shown last (FFX), and keeps the index rule for FFX-2', () => {
  const hit = (o: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: false, hitIndex: 0, hitCount: 1, big: true, speed: 'normal', ...o });

  it('FFX: the accent lands on the blow told to be last and not on the highest calculation index', () => {
    const mid = planHit('ffx', hit({ hitIndex: 6, hitCount: 7, lastShown: false }), flags()); // the 4th shown
    const last = planHit('ffx', hit({ hitIndex: 4, hitCount: 7, lastShown: true }), flags()); // the 7th shown
    expect(mid.freezeMs).toBe(0);
    expect(mid.impactFrame).toBeNull();
    expect(mid.kick).toBe(0);
    expect(mid.trauma).toBeLessThan(last.trauma);
    expect(last.freezeMs).toBe(85);
    expect(last.impactFrame).toBe('full');
    expect(last.kick).toBeGreaterThan(0);
  });

  it('FFX: with nothing said about the order, the index rule stands (a stage with no burst, a test rig)', () => {
    expect(planHit('ffx', hit({ hitIndex: 6, hitCount: 7 }), flags()).impactFrame).toBe('full');
    expect(planHit('ffx', hit({ hitIndex: 4, hitCount: 7 }), flags()).impactFrame).toBeNull();
  });

  it('FFX-2 never reads it: the hits of a girl\'s chain are shown in the order they were calculated, and her accent is still the index rule', () => {
    expect(planHit('ffx2', hit({ hitIndex: 6, hitCount: 7, lastShown: false }), flags()).impactFrame).toBe('full');
    expect(planHit('ffx2', hit({ hitIndex: 4, hitCount: 7, lastShown: true }), flags()).impactFrame).toBeNull();
  });

  it('an ordinary move that is not an Overdrive has no finishing accent either way', () => {
    expect(planHit('ffx', hit({ big: false, hitIndex: 4, hitCount: 7, lastShown: true }), flags()).impactFrame).toBeNull();
  });
});

describe('fxHit hands the stage the order of the burst being played', () => {
  /** A context that plays `events` and a port that records what each blow was told. */
  function rig(events: readonly BattleEvent[]): { ctx: EventCtx; told: Array<{ hitIndex: number; lastShown: boolean | undefined }>; at: (i: number) => void } {
    const told: Array<{ hitIndex: number; lastShown: boolean | undefined }> = [];
    const fx: FxStagePort = {
      enabled: () => true,
      hit: (o) => {
        told.push({ hitIndex: o.hitIndex, lastShown: o.lastShown });
        return { freezeMs: 0, shook: false };
      },
    };
    const ctx = { stage: { fx }, deps: {}, speed: () => 'normal', burst: { events, at: 0 } } as unknown as EventCtx;
    return { ctx, told, at: (i) => { (ctx as { burst: { events: readonly BattleEvent[]; at: number } }).burst = { events, at: i }; } };
  }

  it('tells each blow of Fire Fury whether it is the last shown (only the seventh)', async () => {
    const events = fireFury();
    const { ctx, told, at } = rig(events);
    await fxActionOpen(ctx, events[0] as Extract<BattleEvent, { type: 'action-start' }>);
    events.forEach((e, i) => {
      if (e.type !== 'damage') return;
      at(i);
      fxHit(ctx, e, false);
    });
    expect(told.map((t) => t.hitIndex)).toEqual([0, 5, 1, 6, 2, 3, 4]);
    expect(told.map((t) => t.lastShown)).toEqual([false, false, false, false, false, false, true]);
  });

  it('says nothing when the burst is not the one in hand (the event is not at the burst\'s position): the stage keeps the index rule', () => {
    const events = fireFury();
    const { ctx, told } = rig(events); // `at` stays 0, the action-start
    fxHit(ctx, events[1] as Damage, false);
    expect(told).toEqual([{ hitIndex: 0, lastShown: undefined }]);
  });
});
