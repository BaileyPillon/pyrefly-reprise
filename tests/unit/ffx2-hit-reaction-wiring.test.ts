/**
 * **Re-parity lane X2-A, slice 1: the hit reaction, wired** (FFX-2 only; note FFX2-G01, live game 2026-10-13). The kernels and the data are pinned in
 * `parity-ffx2-hit-reaction.test.ts`; this file tests what the engine does with them: the window, the halved-tick span, the forced hit and Haste, per
 * body, the switch, and that every unit of every FFX-2 chapter is looked up (the two Bulwarks, which have no damage clip, keep today's window).
 */

import { describe, expect, it } from 'vitest';
import { advanceChainWindows, bumpChain, CHAIN_WINDOW_TICKS, CHAIN_WINDOW_TICKS_CRIT } from '../../src/battle/ffx2/index.ts';
import { CHAIN_WINDOW_PER_BODY, HIT_REACTION_STEPS } from '../../src/battle/ffx2/constants.ts';
import { bodyOf, inHitReaction, OLD_REACTION, reactionSpan, reactionWindow, withReactionKnobs } from '../../src/battle/ffx2/reaction.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';

describe('the data reaches every unit', () => {
  it('covers every unit of every FFX-2 chapter but the two Bulwarks, which have no damage clip', () => {
    const missing: string[] = [];
    for (const group of data.ENEMY_GROUPS) {
      const all = [...group.enemies, ...(((group as unknown as { parts?: typeof group.enemies }).parts) ?? [])];
      for (const e of all) {
        const unit = aiUnit(e.id, 'enemy');
        unit.enemy = { aiScriptId: e.aiScriptId, formIndex: 0, forms: e.forms, rewards: e.rewards, ...(e.ffx2Record ? { ffx2Record: e.ffx2Record } : {}) };
        if (bodyOf(unit) === null) missing.push(e.id);
      }
    }
    expect(missing.sort()).toEqual(['bulwark-l', 'bulwark-r']);
  });
});

function girl(id: 'yuna' | 'rikku' | 'paine', dressphere: string): Ffx2Unit {
  const u = aiUnit(id, 'party');
  u.dresspheres = { current: dressphere, owned: [dressphere], garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [dressphere] }, abilitiesLearned: {} };
  return u;
}

function monster(row: number, extra: Partial<NonNullable<Ffx2Unit['enemy']>> = {}): Ffx2Unit {
  const u = aiUnit(`row-${row}`, 'enemy');
  u.enemy = { aiScriptId: 'none', formIndex: 0, forms: [], rewards: { ap: 0, apOverkill: 0, gil: 0, stolenGil: 0, overkillThreshold: 0, exp: 0, drops: [] }, ffx2Record: { row, table: 1 } as never, ...extra } as never;
  return u;
}

function haste(u: Ffx2Unit): Ffx2Unit {
  u.statuses['haste'] = { id: 'haste', ticksRemaining: null } as never;
  return u;
}

describe('the switch and today\'s numbers', () => {
  it('is on, and 15 / 60 / 90 are what a body outside the data keeps', () => {
    expect(CHAIN_WINDOW_PER_BODY).toBe(true);
    expect(HIT_REACTION_STEPS).toBe(15);
    expect([CHAIN_WINDOW_TICKS, CHAIN_WINDOW_TICKS_CRIT]).toEqual([60, 90]);
    const unknown = aiUnit('stranger', 'enemy');
    expect([reactionWindow(unknown, false), reactionWindow(unknown, true), reactionSpan(unknown, false)]).toEqual([60, 90, 15]);
    const psychic = girl('yuna', 'psychic');
    expect(bodyOf(psychic)).toBeNull();
    expect(reactionWindow(psychic, false)).toBe(60);
  });

  it('with the knobs off every body is on today\'s numbers, whatever the data says', () => {
    const yuna = girl('yuna', 'mascot');
    const bahamut = monster(168);
    withReactionKnobs(OLD_REACTION, () => {
      for (const u of [yuna, bahamut]) expect([reactionWindow(u, false), reactionWindow(u, true), reactionSpan(u, false)]).toEqual([60, 90, 15]);
    });
  });
});

describe('the window is the body\'s damage clip, plus one step, at the animation speed', () => {
  it("the three live Mascot lengths: Yuna 31, Paine 37, a Hasted Rikku 15", () => {
    expect(reactionWindow(girl('yuna', 'mascot'), false)).toBe(31);
    expect(reactionWindow(girl('paine', 'mascot'), false)).toBe(37);
    expect(reactionWindow(haste(girl('rikku', 'mascot')), false)).toBe(15);
    expect(reactionSpan(girl('yuna', 'mascot'), false)).toBe(31);
  });

  it('a critical plays the heavier clip: Bahamut 52 and 82, Nooj 21 and 34, Mindy 61 and 61', () => {
    const w = (row: number) => [reactionWindow(monster(row), false), reactionWindow(monster(row), true)];
    expect(w(168)).toEqual([52, 82]);
    expect(w(258)).toEqual([21, 34]);
    expect(w(173)).toEqual([61, 61]);
    expect(w(260)).toEqual([31, 31]); // Chapter V's Shuyin
  });

  it('Haste halves the clip (rounded up), Slow leaves a damage clip alone, Stop and Petrify give no reaction', () => {
    const bahamut = monster(168);
    expect(reactionWindow(haste(monster(168)), false)).toBe(Math.ceil(51 / 2) + 1);
    bahamut.statuses['slow'] = { id: 'slow', ticksRemaining: null } as never;
    expect(reactionWindow(bahamut, false)).toBe(52);
    const stopped = monster(168);
    stopped.statuses['stop'] = { id: 'stop', ticksRemaining: null } as never;
    expect(reactionWindow(stopped, false)).toBe(0);
    const stone = girl('paine', 'warrior');
    stone.statuses['petrify'] = { id: 'petrify', ticksRemaining: null } as never;
    expect(reactionWindow(stone, true)).toBe(0);
  });

  it('a girl\'s window follows the dressphere she wears', () => {
    expect(reactionWindow(girl('yuna', 'gunner'), false)).toBe(31); // set 0x1, 30 frames
    expect(reactionWindow(girl('yuna', 'black-mage'), false)).toBe(36); // set 0x12, 35 frames
    expect(reactionWindow(girl('paine', 'warrior'), true)).toBe(33); // set 0x2b: the critical clip is 32
    expect(reactionWindow(girl('paine', 'warrior'), false)).toBe(36);
    expect(reactionWindow(girl('rikku', 'full-throttle'), false)).toBe(41); // the Special's body, slot 15: set 0x28, 40 frames
  });
});

describe('bumpChain, the chain events and the forced hit', () => {
  it('a hit opens the window at the body\'s length, raises the counter, and the window ends on the step the reaction does', () => {
    const t = monster(168);
    expect(bumpChain(t, 0, false)).toBe(1);
    expect(t.chainWindowTicks).toBe(52);
    const events: unknown[] = [];
    for (let step = 1; step <= 51; step += 1) {
      advanceChainWindows([t], 1, (e) => events.push(e));
      expect(t.chainWindowTicks, `step ${step}`).toBe(52 - step);
      expect(t.chainCount).toBe(1);
    }
    advanceChainWindows([t], 1, (e) => events.push(e));
    expect(t.chainWindowTicks).toBe(0);
    expect(t.chainCount).toBe(0);
    expect(events).toEqual([{ type: 'chain', targetId: t.id, count: 0, multiplier: 1 }]);
  });

  it('each hit restarts the window at its full length', () => {
    const t = monster(168);
    bumpChain(t, 0, false);
    for (let i = 0; i < 20; i += 1) advanceChainWindows([t], 1, () => undefined);
    expect(t.chainWindowTicks).toBe(32);
    expect(bumpChain(t, t.chainCount, true)).toBe(2);
    expect(t.chainWindowTicks).toBe(82);
  });

  it('a Stopped target has no window and its counter is cleared at once', () => {
    const t = monster(168);
    t.statuses['stop'] = { id: 'stop', ticksRemaining: null } as never;
    expect(bumpChain(t, 0, false)).toBe(0);
    expect(t.chainWindowTicks).toBe(0);
    // and a counter a target still holds when it is Stopped goes at the next step
    const u = monster(168);
    bumpChain(u, 0, false);
    u.statuses['stop'] = { id: 'stop', ticksRemaining: null } as never;
    const events: unknown[] = [];
    advanceChainWindows([u], 1, (e) => events.push(e));
    expect(u.chainCount).toBe(0);
    expect(events.length).toBe(1);
  });

  it('the forced hit follows the reaction for a body in the data, the window for any other', () => {
    const t = monster(168);
    expect(inHitReaction(t)).toBe(false);
    t.gauge.hitReaction = reactionSpan(t, false);
    bumpChain(t, 0, false);
    expect(inHitReaction(t)).toBe(true);
    t.gauge.hitReaction = 0;
    expect(inHitReaction(t)).toBe(false);
    const stranger = aiUnit('stranger', 'enemy');
    stranger.chainWindowTicks = 5;
    expect(inHitReaction(stranger)).toBe(true);
  });
});

describe('the switch off is the engine of the base (r52-rc plus the Chapter VI link opening), byte for byte', () => {
  // The first seeds of the golden arrays as pinned on the base 35aa31e77 (r52-rc 3c92b60cc plus the Chapter VI link opening; the Chapter IV and V rows equal r51-rc d6dc0bdd7's: release 50.1 plus the rewards,
  // stat-setter, confusion, Mix and grids lanes), before this lane: Chapter IV at zero decision time, seeds 1 to 5, and Chapter V, seeds 1 to 3. (On release 50, 6b638df95, they were 6baeab06549072aa ... and bc16d06c2b310e63 ...)
  const OLD_CH4_D0 = ['45734a8be5dd203c', '70e64552622c11e3', '52b166f112447102', 'ca9ad0689e657475', 'fdc102f04be24914'];
  const OLD_CH5_D0 = ['879b56fea2dcf126', '6653829069c3a0b6', '2d1beea724981df5'];

  it('Chapter IV and Chapter V reproduce the old event logs with the slice taken off', async () => {
    const { driveChapter4, driveChapter5, logHash } = await import('./helpers/ffx2ChapterDrive.ts');
    withReactionKnobs(OLD_REACTION, () => {
      expect(OLD_CH4_D0.map((_, i) => logHash(driveChapter4(i + 1, 0)))).toEqual(OLD_CH4_D0);
      expect(OLD_CH5_D0.map((_, i) => logHash(driveChapter5(i + 1, 0)))).toEqual(OLD_CH5_D0);
    });
  }, 120_000);

  it('and with the slice on the same seeds are other logs (the windows moved)', async () => {
    const { driveChapter4, logHash } = await import('./helpers/ffx2ChapterDrive.ts');
    expect(OLD_CH4_D0.map((_, i) => logHash(driveChapter4(i + 1, 0)))).not.toEqual(OLD_CH4_D0);
  }, 60_000);
});

describe('the measurement knobs take the slice apart', () => {
  const yuna = (): Ffx2Unit => girl('yuna', 'mascot');
  const bahamut = (): Ffx2Unit => monster(168);

  it('girls alone and monsters alone: one side per-body, the other on today\'s numbers', () => {
    withReactionKnobs({ girls: true }, () => {
      expect([reactionWindow(yuna(), false), reactionSpan(yuna(), false), reactionWindow(bahamut(), false), reactionSpan(bahamut(), false)]).toEqual([31, 31, 60, 15]);
    });
    withReactionKnobs({ monsters: true }, () => {
      expect([reactionWindow(yuna(), false), reactionSpan(yuna(), false), reactionWindow(bahamut(), false), reactionSpan(bahamut(), false)]).toEqual([60, 15, 52, 52]);
    });
  });

  it('XA2 alone: the windows stay 60 / 90, the halved-tick span and the forced hit follow the body\'s reaction', () => {
    withReactionKnobs({ coupling: true }, () => {
      const t = bahamut();
      expect([reactionWindow(t, false), reactionWindow(t, true), reactionSpan(t, false), reactionSpan(t, true)]).toEqual([60, 90, 52, 82]);
      t.chainWindowTicks = 60;
      t.gauge.hitReaction = 0;
      expect(inHitReaction(t)).toBe(false); // the window is open, the reaction is over
      t.gauge.hitReaction = 3;
      expect(inHitReaction(t)).toBe(true);
    });
  });

  it('XA7 alone: today\'s 60 / 90 / 15 are scaled by the animation ratio (Haste halves, Stop clears)', () => {
    withReactionKnobs({ ratio: true }, () => {
      expect([reactionWindow(bahamut(), false), reactionSpan(bahamut(), false)]).toEqual([60, 15]);
      const fast = haste(bahamut());
      expect([reactionWindow(fast, false), reactionWindow(fast, true), reactionSpan(fast, false)]).toEqual([30, 45, 8]);
      const stopped = bahamut();
      stopped.statuses['stop'] = { id: 'stop', ticksRemaining: null } as never;
      expect(reactionWindow(stopped, false)).toBe(0);
    });
  });

  it('one body measured alone: a row kept on today\'s window, or given other clips (Chapter V\'s Shuyin, row 260)', () => {
    const shuyin = monster(260);
    expect(reactionWindow(shuyin, false)).toBe(31);
    withReactionKnobs({ girls: true, monsters: true, keepRows: [260] }, () => expect([reactionWindow(shuyin, false), reactionSpan(shuyin, false), bodyOf(shuyin)]).toEqual([60, 15, null]));
    withReactionKnobs({ girls: true, monsters: true, clipsOfRow: { 260: [135, 135] } }, () => expect(reactionWindow(shuyin, false)).toBe(136));
    expect(reactionWindow(shuyin, false)).toBe(31); // the production knobs come back
  });
});
