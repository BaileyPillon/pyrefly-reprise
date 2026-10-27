// @vitest-environment jsdom
/**
 * The FFX-2 ATB bars that run (MF-07 / TB-03, motion-fluidity pass lane L3; game case: FFX-2 only: the ATB HUD; look change, so behind `?atbbars=smooth`, default today's bars).
 *
 * Today the Active pump hands the HUD a snapshot 20 times a second and the HUD rewrites both columns with `innerHTML`: the bar ratchets about 4 px every 62 ms and a CSS animation inside a
 * rebuilt row starts again with every rebuild. With the word on, a column is rebuilt only when its structure changed, the fill is a full-width bar scaled by `transform` on its existing
 * element, and `FFX2BattleHud.update(dt)` writes the fill each drawn frame from the last snapshot and its rate.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AGE_CAP_MS, AtbLive, HOLD_BACK, LEAD_MAX, Running, atbBarsSmooth, ease, scaleStyle, setAtbBarsSmooth, shimmerDelay, structure } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { partyRowHtml } from '../../src/ui/ffx2/PartyRows.ts';
import type { AtbSnapshot, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';

afterEach(() => {
  setAtbBarsSmooth(null);
  document.body.innerHTML = '';
});

describe('Running: a fill that runs between two snapshots', () => {
  it('is the snapshot until a second one gives it a rate, then runs at that rate', () => {
    const r = new Running();
    r.feed(0.2, 1000, 0);
    expect(r.shown(30)).toBeCloseTo(0.2, 9); // no rate yet
    r.feed(0.23, 1050, 50); // 0.03 in 50 ms of the engine clock
    expect(r.shown(50)).toBeCloseTo(0.23, 9);
    expect(r.shown(66.7)).toBeCloseTo(0.23 + 0.03 * (16.7 / 50), 6);
    expect(r.shown(100)).toBeCloseTo(0.26, 6); // one pump step on
  });

  it('never runs on past the cap (a held clock sends no snapshot) and never above 1', () => {
    const r = new Running();
    r.feed(0.5, 0, 0);
    r.feed(0.52, 50, 50);
    expect(r.shown(50 + 10_000)).toBeCloseTo(0.52 + (0.02 / 50) * AGE_CAP_MS, 9);
    const f = new Running();
    f.feed(0.98, 0, 0);
    f.feed(0.99, 20, 20);
    expect(f.shown(500)).toBe(1);
  });

  it('a snapshot that lands a hair behind what is drawn is not drawn as a step back; a real drop snaps', () => {
    const r = new Running();
    r.feed(0.5, 0, 0);
    r.feed(0.51, 50, 50); // 0.0002 per ms
    const drawn = r.shown(100); // 0.52
    r.feed(0.5195, 100, 100); // truth a hair behind the extrapolation
    expect(r.shown(100)).toBeGreaterThanOrEqual(drawn - 1e-12);
    expect(drawn - 0.5195).toBeLessThanOrEqual(HOLD_BACK);
    // the action spent the bar
    r.feed(0.02, 150, 150);
    expect(r.shown(150)).toBeCloseTo(0.02, 9);
    expect(r.shown(170)).toBeCloseTo(0.02, 9); // and no rate is carried across the drop
  });

  it('the same snapshot again (a vitals redraw) keeps the running estimate; a gap longer than 500 ms of the engine clock is not a rate', () => {
    const r = new Running();
    r.feed(0.1, 0, 0);
    r.feed(0.12, 50, 50);
    const at60 = r.shown(60);
    r.feed(0.12, 50, 60); // the same snapshot, redrawn
    expect(r.shown(60)).toBeCloseTo(at60, 12);
    r.feed(0.4, 1000, 1000); // a pause between
    expect(r.shown(1010)).toBeCloseTo(0.4, 9);
  });
});

describe('ease(): the bar that is drawn between the extrapolated values', () => {
  /** The pump as it is: the engine's gauge moves in logic steps of 1000/29.97 ms, the HUD is handed a snapshot every 50 ms, the screen draws every 1000/hz. A 246 px bar fills in 8.8 s. */
  function run(hz: number, eased: boolean, heldFrom = Infinity): number[] {
    const STEP_MS = 1000 / 29.97;
    const perMs = 1 / 8800;
    const r = new Running();
    const drawn: number[] = [];
    let prev = -1;
    let nextSnap = 0;
    const dt = 1000 / hz;
    for (let t = 0, i = 0; t < 3000; t += dt, i++) {
      while (nextSnap <= t) { // a pump step: the gauge as the engine has it at that moment (none while the clock is held)
        if (nextSnap >= heldFrom) { nextSnap += 50; continue; }
        r.feed(Math.floor(nextSnap / STEP_MS) * STEP_MS * perMs, nextSnap, t);
        nextSnap += 50;
      }
      const target = r.shown(t);
      prev = eased ? ease(prev, target, dt, r.speed) : target;
      drawn.push(prev);
    }
    return drawn;
  }
  const steps = (d: number[]): number[] => d.slice(30).map((v, i) => (v - d[29 + i]!) * 246); // px a frame once the model has warmed up

  it('the extrapolation alone holds a frame in every few (a snapshot lands a hair behind it); the eased bar moves on every frame, at 60, 120 and 144 Hz', () => {
    for (const hz of [60, 120, 144]) {
      const raw = steps(run(hz, false));
      const eased = steps(run(hz, true));
      expect(raw.filter((s) => s < 1e-6).length).toBeGreaterThan(0); // the held frames
      expect(eased.filter((s) => s < 1e-6).length).toBe(0);
      expect(Math.min(...eased)).toBeGreaterThanOrEqual(0); // never a step back
      expect(Math.max(...eased)).toBeLessThanOrEqual(1); // 1 px or less a frame
    }
  });

  it('a held clock (no snapshots: Wait under a submenu, an effect playing) stops the bar within a few frames, at 60, 120 and 144 Hz', () => {
    for (const hz of [60, 120, 144]) {
      const d = run(hz, true, 1500);
      const at = (ms: number): number => d[Math.round((ms * hz) / 1000)]!;
      expect(at(2200)).toBeCloseTo(at(2990), 9); // standing still well before the end of the hold
      expect(at(2990)).toBeLessThanOrEqual((1500 + AGE_CAP_MS) / 8800 + LEAD_MAX); // and no further past the model than its cap plus the lead
    }
  });

  it('a spent bar and a full bar are drawn at once; a drawn bar is never taken back for a snapshot a hair behind', () => {
    expect(ease(0.6, 0.02, 16.7)).toBe(0.02); // the action spent it
    expect(ease(0.97, 1, 16.7)).toBe(1); // the ready flash
    expect(ease(-1, 0.4, 16.7)).toBe(0.4); // nothing drawn yet
    expect(ease(0.5, 0.497, 16.7, 0.00012)).toBeGreaterThan(0.5); // a hair behind: it creeps on, not back and not flat
    expect(ease(0.5, 0.49, 16.7, 0.00012)).toBe(0.5); // further behind than one logic step: it waits for the model, it does not run on
    expect(ease(0.5, 0.5, 16.7, 0)).toBe(0.5); // a held clock: it stays
  });
});

describe('structure(): the markup without what moves', () => {
  it('equal when only the fill, the charge, the shimmer phase or the pulse phase differ; unequal when a figure or a class does', () => {
    const girl = ffx2Girl('yuna');
    const bar = (fill: number, ready = false, charge: number | null = null): AtbSnapshot['bars'][number] => ({ actorId: 'yuna', fill, required: 16000, ready, charge, state: 'normal' });
    const html = (b: AtbSnapshot['bars'][number], hp = 1000): string => partyRowHtml({ ...girl, hp }, b, { actingId: null, index: 0, live: { fill: b.fill } });
    expect(structure(html(bar(0.31)))).toBe(structure(html(bar(0.32))));
    expect(structure(html(bar(1, true)))).toBe(structure(html(bar(1, true)).replace(/animation-delay:-\d+ms/, 'animation-delay:-3ms')));
    expect(structure(html(bar(0.5, false, 0.1)))).toBe(structure(html(bar(0.5, false, 0.7))));
    expect(structure(html(bar(0.5)))).not.toBe(structure(html(bar(0.5), 900))); // HP
    expect(structure(html(bar(0.5)))).not.toBe(structure(html(bar(1, true)))); // READY
    expect(structure(html(bar(0.5)))).not.toBe(structure(html(bar(0.5, false, 0.1)))); // a charge appears
  });

  it('the live markup is a full-width bar scaled from its left edge; today\'s is a width in percent', () => {
    const girl = ffx2Girl('yuna');
    const b = { actorId: 'yuna', fill: 0.4, required: 16000, ready: false, charge: 0.25, state: 'normal' } as const;
    const today = partyRowHtml(girl, b, { actingId: null, index: 0 });
    const live = partyRowHtml(girl, b, { actingId: null, index: 0, live: { fill: 0.4 } });
    expect(today).toContain('class="ffx2atb__fill" style="width:40%"');
    expect(today).toContain('class="ffx2atb__charge" style="width:25%"');
    expect(live).toContain(`class="ffx2atb__fill" style="${scaleStyle(0.4)}"`);
    expect(live).toContain(`class="ffx2atb__charge" style="${scaleStyle(0.25)}"`);
    expect(scaleStyle(0.4)).toBe('width:100%;transform:scaleX(0.4000);transform-origin:0 50%');
    expect(shimmerDelay(1234)).toBe(';animation-delay:-234ms');
  });
});

describe('the switch word', () => {
  it('is off unless ?atbbars=smooth, and a test can force it', () => {
    expect(atbBarsSmooth('')).toBe(false);
    expect(atbBarsSmooth('?atbbars=today')).toBe(false);
    expect(atbBarsSmooth('?atbbars=smooth')).toBe(true);
    expect(atbBarsSmooth('?pack=demo')).toBe(false);
    setAtbBarsSmooth(true);
    expect(atbBarsSmooth('')).toBe(true);
  });
});

function ffx2Girl(id: string): FFX2Combatant {
  return {
    id, name: id, side: 'party', spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000, mp: 80, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [], controller: 'player', alive: true, removed: false,
    slot: 0, flags: {}, level: 10,
    dresspheres: { current: 'gunner', owned: ['gunner'], garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: {} },
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 }, accessories: [], chainCount: 0, chainWindowTicks: 0,
  } as FFX2Combatant;
}
const stateOf = (hp = 1000): BattleState =>
  ({
    game: 'ffx2', combatants: { yuna: { ...ffx2Girl('yuna'), hp } }, activeIds: ['yuna'], reserveIds: [], enemyIds: [], aeonId: null,
    turn: 1, ticks: 0, log: [], nextSeq: 1, triggers: [], firedTriggerIds: [], result: null, seed: 1, flags: {},
  }) as BattleState;
const snapAt = (ms: number, fill: number, ready = false): AtbSnapshot =>
  ({ elapsedMs: ms, bars: [{ actorId: 'yuna', fill, required: 16000, ready, charge: null, state: 'normal' }] }) as AtbSnapshot;

describe('the real FFX2BattleHud under an open menu: 20 snapshots a second', () => {
  let root: HTMLElement;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });
  const mount = (): FFX2BattleHud => {
    const hud = new FFX2BattleHud();
    hud.mount(root);
    return hud;
  };
  const row = (): HTMLElement | null => root.querySelector<HTMLElement>('.ig-stat[data-actor-id="yuna"]');
  const fill = (): HTMLElement => root.querySelector<HTMLElement>('.ffx2atb__fill')!;

  it('today: every snapshot replaces the row (the 16 Hz rebuild) and the fill is a width that steps', () => {
    setAtbBarsSmooth(false);
    const hud = mount();
    hud.sync(stateOf(), snapAt(0, 0.1));
    const first = row()!;
    hud.syncGauges(snapAt(50, 0.12));
    expect(row()).not.toBe(first); // replaced
    expect(fill().style.width).toBe('12%');
  });

  it('smooth: the row is the same element across snapshots; the fill is a transform the frame loop writes, 1 px or less a frame at 144 Hz', () => {
    setAtbBarsSmooth(true);
    const hud = mount();
    hud.sync(stateOf(), snapAt(0, 0.1));
    const first = row()!;
    const f0 = fill();
    hud.syncGauges(snapAt(50, 0.1 + 0.0075)); // 0.15 of a bar a second
    expect(row()).toBe(first); // kept
    expect(fill()).toBe(f0);
    expect(fill().style.width).toBe('100%');

    const xs: number[] = [];
    let ms = 50;
    for (let i = 0; i < 12; i++) {
      hud.update(1 / 144); // a drawn frame
      ms += 1000 / 144;
      if (i % 7 === 6) hud.syncGauges(snapAt(Math.round(ms), 0.1 + 0.0075 + (0.15 * (ms - 50)) / 1000)); // the pump's step
      xs.push(parseFloat(/scaleX\(([\d.]+)\)/.exec(fill().style.transform)![1]!));
    }
    const track = 132; // the widest runway, px
    const steps = xs.slice(1).map((v, i) => (v - xs[i]!) * track);
    expect(Math.max(...steps)).toBeLessThanOrEqual(1); // never more than a pixel between two drawn frames
    expect(Math.min(...steps)).toBeGreaterThanOrEqual(0);
    expect(new Set(xs.map((v) => v.toFixed(4))).size).toBeGreaterThanOrEqual(10); // a new value (almost) every frame, not every 9th
    expect(row()).toBe(first); // still the same element
  });

  it('smooth: a figure that changes (HP, READY) rebuilds the row once, and the new row is bound', () => {
    setAtbBarsSmooth(true);
    const hud = mount();
    hud.sync(stateOf(), snapAt(0, 0.9));
    const first = row()!;
    hud.sync(stateOf(900), snapAt(50, 0.91));
    expect(row()).not.toBe(first); // HP changed
    const second = row()!;
    hud.syncGauges(snapAt(100, 1, true));
    expect(row()).not.toBe(second); // READY changed
    expect(root.querySelector('.ffx2atb--ready')).not.toBeNull();
    expect(root.querySelector<HTMLElement>('.ffx2atb--ready')!.style.animationDelay).toMatch(/^-\d+ms$/); // the shimmer keeps the page-clock phase
    const ready = row()!;
    hud.syncGauges(snapAt(150, 1, true));
    expect(row()).toBe(ready); // and then it is left alone
    hud.update(1 / 60);
    expect(fill().style.transform).toBe('scaleX(1.0000)');
  });
});

describe('AtbLive: the per-frame write', () => {
  it('writes only what moved, and not before it is bound', () => {
    const live = new AtbLive();
    const bar = { actorId: 'yuna', fill: 0.2, required: 16000, ready: false, charge: null, state: 'normal' } as const;
    live.feed('yuna', bar, 0);
    live.feed('yuna', { ...bar, fill: 0.23 }, 50);
    live.tick(1 / 60); // nothing bound: nothing to write
    const host = document.createElement('div');
    host.innerHTML = '<div class="ig-stat" data-actor-id="yuna"><i class="ffx2atb__fill"></i></div>';
    live.bind(host);
    const el = host.querySelector<HTMLElement>('.ffx2atb__fill')!;
    expect(el.style.transform).toMatch(/^scaleX\(0\.2/);
    const before = el.style.transform;
    live.tick(0); // a frame of no time changes nothing
    expect(el.style.transform).toBe(before);
    live.tick(1 / 60);
    expect(el.style.transform).not.toBe(before);
  });
});
