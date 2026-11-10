/**
 * Test 2 of the FFX-2 Special look (step A; game case: FFX-2 only in what is seen; the optional HUD members and the coach forwards are plumbing for both games, inert while the
 * switch `specialDressUp` is OFF): the held list and the Wait chip, from the presenter's side (the holder) and the HUD's side (the mounted FFX2BattleHud).
 *
 * Removal: drop the HUD's `held` line in `renderParty` and every held-row assertion below fails.
 */

import { describe, expect, it, vi } from 'vitest';
import { createPartyHold, type HoldHud } from '../../src/engine/SpecialPartyHold.ts';

type Call = string;
function fakeHud(opts: { throws?: Array<keyof HoldHud> } = {}): { hud: HoldHud; calls: Call[] } {
  const calls: Call[] = [];
  const maybe = (name: keyof HoldHud): void => {
    if (opts.throws?.includes(name)) throw new Error(`${name} threw`);
  };
  const hud: HoldHud = {
    holdRows: (ids) => {
      calls.push(`holdRows:${ids === null ? 'null' : ids.join(',')}`);
      maybe('holdRows');
    },
    showAtbChip: (on) => {
      calls.push(`showAtbChip:${on}`);
      maybe('showAtbChip');
    },
    setAtbMode: (mode) => {
      calls.push(`setAtbMode:${mode}`);
      maybe('setAtbMode');
    },
  };
  return { hud, calls };
}

describe('the holder (the presenter\'s side)', () => {
  it('holds each list in turn, and is active from the first', () => {
    const { hud, calls } = fakeHud();
    const hold = createPartyHold(hud);
    expect(hold.active).toBe(false);
    hold.rows(['yuna', 'rikku', 'paine']);
    expect(hold.active).toBe(true);
    hold.rows(['yuna']);
    hold.rows(['floral-fallal-right-pistil', 'yuna', 'floral-fallal-left-pistil']);
    expect(calls).toEqual(['holdRows:yuna,rikku,paine', 'holdRows:yuna', 'holdRows:floral-fallal-right-pistil,yuna,floral-fallal-left-pistil']);
  });

  it("chip(true, 'wait') sets the mode to Wait and then shows the chip; chip(false, mode) sets the mode, then hides the chip, and the rows stay held", () => {
    const { hud, calls } = fakeHud();
    const hold = createPartyHold(hud);
    hold.rows(['a', 'b', 'c']);
    calls.length = 0;
    hold.chip(true, 'wait');
    expect(calls).toEqual(['setAtbMode:wait', 'showAtbChip:true']);
    calls.length = 0;
    hold.chip(false, 'active');
    expect(calls).toEqual(['setAtbMode:active', 'showAtbChip:false']);
    expect(hold.active).toBe(true);
    calls.length = 0;
    hold.chip(false);
    expect(calls).toEqual(['showAtbChip:false']); // no mode given: none set
  });

  it('release drops the list, hides the chip, restores the Config\'s mode, then runs ONE full sync; a second release does nothing', () => {
    const { hud, calls } = fakeHud();
    const sync = vi.fn(() => calls.push('syncFull'));
    const hold = createPartyHold(hud);
    hold.rows(['a', 'b', 'c']);
    hold.chip(true, 'wait');
    calls.length = 0;
    hold.release('active', sync);
    expect(calls).toEqual(['holdRows:null', 'setAtbMode:active', 'showAtbChip:false', 'syncFull']);
    expect(hold.active).toBe(false);
    hold.release('active', sync);
    hold.release('wait', sync);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(4);
  });

  it('release from a finally, after a thrown error, is safe; release with nothing held does nothing', () => {
    const { hud, calls } = fakeHud();
    const sync = vi.fn();
    const idle = createPartyHold(hud);
    idle.release('wait', sync);
    expect(calls).toEqual([]);
    expect(sync).not.toHaveBeenCalled();

    const hold = createPartyHold(hud);
    expect(() => {
      try {
        hold.rows(['a']);
        throw new Error('the beat failed');
      } finally {
        hold.release('active', sync);
      }
    }).toThrow('the beat failed');
    expect(sync).toHaveBeenCalledTimes(1);
    expect(calls.slice(-3)).toEqual(['holdRows:null', 'setAtbMode:active', 'showAtbChip:false']);
  });

  it('a chip shown with no list held is still undone by release', () => {
    const { hud, calls } = fakeHud();
    const hold = createPartyHold(hud);
    hold.chip(true, 'wait');
    calls.length = 0;
    hold.release('active', () => {});
    expect(calls).toEqual(['holdRows:null', 'setAtbMode:active', 'showAtbChip:false']);
  });

  it('a HUD that throws, or lacks the members, never stops the battle: each call is wrapped and the rest still run', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { hud, calls } = fakeHud({ throws: ['holdRows', 'showAtbChip', 'setAtbMode'] });
    const sync = vi.fn();
    const hold = createPartyHold(hud);
    expect(() => {
      hold.rows(['a']);
      hold.chip(true, 'wait');
      hold.release('active', sync);
    }).not.toThrow();
    expect(sync).toHaveBeenCalledTimes(1); // the full sync still ran
    expect(calls).toContain('holdRows:null');
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[0])).toContain('[presenter]');
    warn.mockRestore();

    for (const missing of [null, undefined, {} as HoldHud]) {
      const bare = createPartyHold(missing);
      const s = vi.fn();
      expect(() => {
        bare.rows(['a']);
        bare.chip(true);
        bare.chip(false, 'wait');
        bare.release('wait', s);
      }).not.toThrow();
      expect(s).toHaveBeenCalledTimes(1);
    }
  });
});
