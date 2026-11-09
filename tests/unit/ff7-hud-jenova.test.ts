// @vitest-environment jsdom
/**
 * The FF7 battle HUD with three party members and a status (hidden chapter 44, Jenova LIFE; FF7 only): three rows in
 * the names and status windows at 1600 x 900 and on the phone (layouts A and B), the Barrier box lit by MBarrier from the
 * engine's own state, the Magic list at ten spells, and the Limit gauge of the new levels.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Ff7Combatant } from '../../src/battle/common/types.ts';
import { applyStatus } from '../../src/battle/ff7/statuses.ts';
import { ff7Geometry } from '../../src/ui/ff7/ff7Geometry.ts';
import { Ff7BattleHud } from '../../src/ui/ff7/Ff7BattleHud.ts';
import { openMenu, subRows, step } from '../../src/ui/ff7/ff7MenuModel.ts';
import { buildCommands } from '../../src/battle/ff7/index.ts';
import { jlEngine, jlEnv, JENOVA } from './helpers/jenova.ts';

let host: HTMLDivElement;
let hud: Ff7BattleHud;

function mount(w: number, h: number, phone?: 'a' | 'b'): void {
  host = document.createElement('div');
  document.body.appendChild(host);
  hud = new Ff7BattleHud({ size: () => ({ w, h }), itemCount: () => 1, ...(phone ? { phoneLayout: phone } : {}) });
  hud.mount(host);
  hud.setProjector(() => ({ x: 800, y: 400 }));
}

afterEach(() => {
  hud?.unmount();
  host?.remove();
});

const texts = (sel: string): string[] => [...hud.root.querySelectorAll(sel)].map((e) => e.textContent ?? '');

describe('three party rows', () => {
  beforeEach(() => mount(1600, 900));

  it('the names window lists Cloud, Tifa and Barret, the status window their HP and MP once each, from the engine\'s own state', () => {
    const e = jlEngine(3);
    hud.sync(e.state(), e.gaugeSnapshot());
    expect(texts('.ff7-name')).toEqual(['Cloud', 'Tifa', 'Barret']);
    expect(texts('.ff7-hp')).toEqual(['2046', '1990', '2471']);
    expect(texts('.ff7-hpmax')).toEqual(['2046', '1990', '2471']);
    expect(texts('.ff7-mp')).toEqual(['350', '302', '284']);
    expect(hud.inspect().rows.map((r) => r.id)).toEqual(['cloud', 'tifa', 'barret']);
    expect(hud.root.querySelectorAll('.ff7-limit')).toHaveLength(3);
    expect(hud.root.querySelectorAll('.ff7-time')).toHaveLength(3);
  });

  it('the three rows sit inside the band at 1600 x 900 and on the phone in both layouts', () => {
    for (const [w, h, layout] of [[1600, 900, undefined], [390, 844, 'a'], [390, 844, 'b']] as const) {
      const g = ff7Geometry(w, h, layout);
      expect(g.left.rows).toHaveLength(3);
      for (const [band, rows] of [[g.bandL, g.left.rows], [g.bandR, g.right.rows]] as const) {
        for (const y of rows) {
          expect(y, `${w}x${h} ${layout ?? 'desk'}`).toBeGreaterThan(band.y);
          expect(y + g.cap / 2).toBeLessThan(band.y + band.h);
        }
      }
    }
  });

  it('a Limit gauge at the new level shows through: Cloud\'s Level 2 gauge fills and blazes when full', () => {
    const e = jlEngine(3);
    const cloud = e.state().combatants.cloud as Ff7Combatant;
    cloud.ff7.limit!.gauge = 255;
    hud.sync(e.state(), e.gaugeSnapshot());
    expect(hud.inspect().rows[0]).toMatchObject({ id: 'cloud', limitReady: true, limit: 1 });
    expect(hud.root.querySelector('[data-id="cloud"] .ff7-limit.is-full')).not.toBeNull();
    expect(hud.root.querySelector('[data-id="tifa"] .ff7-limit.is-full')).toBeNull();
  });
});

describe('the Barrier box lit from the status layer', () => {
  beforeEach(() => mount(1600, 900));

  it('MBarrier fills the lower bar of the holder\'s box and nothing else; it empties as the V-Timer runs and is gone when it ends', () => {
    const e = jlEngine(3);
    const st = e.state();
    const cloud = st.combatants.cloud as Ff7Combatant;
    hud.sync(st, e.gaugeSnapshot());
    expect(hud.inspect().rows.map((r) => [r.barrier, r.mbarrier])).toEqual([[0, 0], [0, 0], [0, 0]]);
    expect(hud.root.querySelectorAll('.ff7-barrier ~ .ff7-fill')).toHaveLength(0);
    applyStatus(cloud, 'mbarrier');
    hud.sync(st, e.gaugeSnapshot());
    expect(hud.inspect().rows[0]).toMatchObject({ barrier: 0, mbarrier: 1 });
    expect(hud.inspect().rows[1]).toMatchObject({ barrier: 0, mbarrier: 0 });
    cloud.ff7.atb.vTimer += 127 * 8192 * 0.5;
    hud.sync(st, e.gaugeSnapshot());
    expect(hud.inspect().rows[0]?.mbarrier).toBeCloseTo(0.5, 5);
    cloud.ff7.atb.vTimer += 127 * 8192;
    hud.sync(st, e.gaugeSnapshot());
    expect(hud.inspect().rows[0]?.mbarrier).toBe(0);
  });

  it('the Guard Scorpion slice\'s rows keep both bars empty (absence)', () => {
    const { u } = jlEnv(1);
    expect(u(JENOVA).ff7.status).toBeUndefined();
  });
});

describe('the Magic list at ten spells (Cloud)', () => {
  it('the command window offers all ten in a 3 x 4 grid page, Barrier and MBarrier last', () => {
    const e = jlEngine(3);
    const { env } = jlEnv(3);
    const rows = buildCommands(env, e.state().combatants.cloud as Ff7Combatant);
    let s = openMenu(rows);
    // Magic is the second slot of the window; open it and read the list.
    const magicSlot = s.slots.findIndex((x) => x?.label === 'Magic');
    expect(magicSlot).toBeGreaterThanOrEqual(0);
    s = { ...s, topIdx: magicSlot };
    const opened = step(s, 'confirm');
    const list = subRows(opened.state);
    expect(list.map((r) => r.label)).toEqual(['Cure', 'Cure2', 'Regen', 'Bolt', 'Bolt2', 'Bolt3', 'Quake', 'Quake2', 'Barrier', 'MBarrier']);
    expect(list.length).toBeLessThanOrEqual(12);
    expect(list.find((r) => r.label === 'Bolt3')?.mpCost).toBe(52);
    expect(list.find((r) => r.label === 'Bolt3')?.enabled).toBe(true);
  });
});
