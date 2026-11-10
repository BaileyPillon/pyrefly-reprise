// @vitest-environment jsdom
/**
 * Test 2 of the FFX-2 Special look (step A; game case: FFX-2 only in what is seen; the optional HUD members and the coach forwards are plumbing for both games, inert while the
 * switch `specialDressUp` is OFF): the held list and the Wait chip, from the presenter's side (the holder) and the HUD's side (the mounted FFX2BattleHud).
 *
 * Removal: drop the HUD's `held` line in `renderParty` and every held-row assertion below fails.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, BattleState, FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { createPartyHold, type HoldHud } from '../../src/engine/SpecialPartyHold.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { bahamutGroup, chapterIV, formUp } from './helpers/specialFormState.ts';
import { openSpecial, unit } from './helpers/specialDrive.ts';

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

// ---------------------------------------------------------------------------------------------------------------------------------
// The HUD's side: a real FFX2BattleHud mounted, a real engine with a girl in her Special
// ---------------------------------------------------------------------------------------------------------------------------------

describe('the mounted FFX2BattleHud under a held list', () => {
  const GIRLS: readonly string[] = ['yuna', 'rikku', 'paine'];
  let root: HTMLElement;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    setAtbBarsSmooth(false);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setAtbBarsSmooth(null);
    document.body.innerHTML = '';
  });

  const ids = (): string[] => [...root.querySelectorAll<HTMLElement>('.ffx2hud__party .ig-stat')].map((e) => e.dataset['actorId'] as string);
  const column = (): string => root.querySelector('.ffx2hud__party')!.innerHTML;
  const mounted = () => {
    const up = formUp('yuna');
    const hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(up.state as BattleState, up.snapshot);
    return { up, hud, parts: [...up.state.activeIds] };
  };

  it("draws the engine's activeIds (the three parts) until a list is held, and the held list at once when it is set", () => {
    const { hud, parts } = mounted();
    expect(parts).toEqual(['yuna', 'floral-fallal-right-pistil', 'floral-fallal-left-pistil']);
    expect(ids()).toEqual(parts);
    hud.holdRows(GIRLS);
    expect(ids()).toEqual(GIRLS);
    hud.holdRows(['yuna']);
    expect(ids()).toEqual(['yuna']);
  });

  it("sync, syncVitals, syncGauges, an atb event and the flourish's closing redraw each draw the HELD rows", async () => {
    const { up, hud } = mounted();
    hud.holdRows(GIRLS);
    hud.sync(up.state as BattleState, up.snapshot);
    expect(ids(), 'sync').toEqual(GIRLS);
    hud.holdRows(['yuna']);
    hud.syncVitals(up.state as BattleState);
    expect(ids(), 'syncVitals').toEqual(['yuna']);
    hud.holdRows(GIRLS);
    hud.syncGauges(up.snapshot);
    expect(ids(), 'syncGauges').toEqual(GIRLS);
    hud.holdRows(['yuna', 'paine']);
    void hud.onEvent({ type: 'atb', snapshot: up.snapshot } as unknown as BattleEvent);
    expect(ids(), 'atb event').toEqual(['yuna', 'paine']);
    hud.holdRows(GIRLS);
    await hud.onEvent({ type: 'spherechange', who: 'yuna', from: 'gunner', to: 'thief', gatesCrossed: [] } as unknown as BattleEvent);
    expect(ids(), "the flourish's closing redraw").toEqual(GIRLS);
  });

  it('in the smooth bar look (the default) the held list is drawn and released the same way: a changed list is a changed structure, never skipped as "only a bar moved"', () => {
    setAtbBarsSmooth(true);
    const { up, hud, parts } = mounted();
    expect(ids()).toEqual(parts);
    hud.holdRows(GIRLS);
    expect(ids()).toEqual(GIRLS);
    hud.syncGauges(up.snapshot); // a bar-only update keeps the held rows
    expect(ids()).toEqual(GIRLS);
    hud.holdRows(null);
    expect(ids()).toEqual(parts);
  });

  it('syncQueued draws nothing of the party: the held rows already on the DOM are left untouched', () => {
    const { up, hud } = mounted();
    hud.holdRows(GIRLS);
    const before = column();
    hud.syncQueued(up.state as BattleState);
    expect(column()).toBe(before);
    expect(ids()).toEqual(GIRLS);
  });

  it('holdRows(null) then a full sync draws the live parts again', () => {
    const { up, hud, parts } = mounted();
    hud.holdRows(GIRLS);
    hud.holdRows(null);
    hud.sync(up.state as BattleState, up.snapshot);
    expect(ids()).toEqual(parts);
  });

  it("with the hold up, a full sync draws the main's row with the form's pools, never the old dress's (which differ)", () => {
    const { up, hud } = mounted();
    hud.holdRows(GIRLS);
    hud.sync(up.state as BattleState, up.snapshot);
    const main = up.state.combatants['yuna'] as FFX2Combatant;
    const text = root.querySelector('.ig-stat[data-actor-id="yuna"] .ig-stat__value:not(.ig-stat__value--mp)')!.textContent;
    expect(text).toBe(`${Math.max(0, main.hp)}/${main.stats.maxHp}`);
    const old = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1 });
    expect(unit(old, 'yuna').stats.maxHp, "the form's maximum is not the old dress's").not.toBe(main.stats.maxHp);
  });

  it('showAtbChip shows and hides the Wait/Active chip outside a live cursor; setAtbMode names it', () => {
    const { hud } = mounted();
    const chip = root.querySelector<HTMLElement>('.ffx2-atbmode')!;
    hud.setAtbMode('wait');
    hud.showAtbChip(true);
    expect(chip.hidden).toBe(false);
    expect(chip.textContent).toBe('WAIT — ATB HELD');
    hud.showAtbChip(false);
    expect(chip.hidden).toBe(true);
  });

  it("the holder drives the real HUD: the lists in turn, then release (also from a finally and from a thrown error) puts the live parts and the Config's mode back, once", () => {
    const { up, hud, parts } = mounted();
    const hold = createPartyHold(hud);
    let syncs = 0;
    const syncFull = (): void => {
      syncs += 1;
      hud.sync(up.state as BattleState, up.snapshot);
    };
    hold.rows(GIRLS);
    expect(ids()).toEqual(GIRLS);
    hold.chip(true, 'wait');
    hold.rows(['yuna']);
    expect(ids()).toEqual(['yuna']);
    hold.rows(parts);
    expect(() => {
      try {
        throw new Error('the beat threw');
      } finally {
        hold.release('active', syncFull);
      }
    }).toThrow('the beat threw');
    expect(ids()).toEqual(parts);
    hold.release('active', syncFull); // a second release (the abort path) does nothing
    expect(syncs).toBe(1);
    expect(root.querySelector<HTMLElement>('.ffx2-atbmode')!.hidden).toBe(true);
  });

  it('with the hold never used, the column is what it was: the pinned Chapter IV column (the OFF pin)', () => {
    const chapter = getChapter('ffx2-bahamut')!;
    const engine = new FFX2Engine(ffx2Options());
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: chapter.buildRef as FFX2PartyBuild, enemies: chapter.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const hud = new FFX2BattleHud();
    hud.mount(root);
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    hud.sync(engine.state() as BattleState, engine.gaugeSnapshot());
    const pinned = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'specials', 'off-pins', 'hud-party-column.json'), 'utf8')) as Record<string, string>;
    expect(column()).toBe(pinned['ffx2-bahamut/today']);
  });
});

describe('the CoachedHud wrapper forwards both members (a wrapper that leaves one out hides it from the presenter)', () => {
  it('holdRows and showAtbChip reach the inner HUD, and a HUD without them is not an error', () => {
    const calls: string[] = [];
    const inner = {
      holdRows: (ids: readonly string[] | null) => calls.push(`holdRows:${ids === null ? 'null' : ids.join(',')}`),
      showAtbChip: (on: boolean) => calls.push(`showAtbChip:${on}`),
    } as unknown as HudPort;
    const hud = withCoach('ffx2', inner);
    hud.holdRows?.(['yuna', 'rikku']);
    hud.holdRows?.(null);
    hud.showAtbChip?.(true);
    expect(calls).toEqual(['holdRows:yuna,rikku', 'holdRows:null', 'showAtbChip:true']);
    const bare = withCoach('ffx2', {} as unknown as HudPort);
    expect(() => {
      bare.holdRows?.(['yuna']);
      bare.showAtbChip?.(false);
    }).not.toThrow();
  });
});
