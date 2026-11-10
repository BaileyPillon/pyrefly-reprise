/**
 * Tests 1 and 2, the presenter halves, of the FFX-2 Special look (step C2; game case: FFX-2 only in what is seen; the call-ins are shared plumbing for both games and return at once while the
 * switch is OFF): the recorded bursts of `tests/fixtures/specials/logs/` replayed through the REAL `BattlePresenter` over `FakeStage` and `FakeHud` (`helpers/specialPlayback.ts`).
 *
 * Held here: the entry for each girl (the HUD's held list in the order the frames show, the chip, the other two girls fading off once, the form on the stage with its two stubs, the Special's painting
 * at the cut and not before; the plan's totals consumed through the recording sleep), the short entry, the exit, the fall with a part standing, the defeat with every part down (the hold is released with
 * no beat), the pieces of each step reaching `VfxPort.special?` once and in plan order, the stage without that member, an abort mid-entry, skip speed and reduce motion.
 *
 * Fails without the feature: every assertion (no `setForm`, no `holdRows`).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { exitPlan, fallPlan, fullPlan, shortPlan, type Girl } from '../../src/engine/SpecialBeatPlans.ts';
import { loadLog, partsOf, rig, type LogFile, type Rig } from './helpers/specialPlayback.ts';

const GIRLS = [
  { girl: 'yuna', special: 'floral-fallal', log: 'entry-yuna', total: 22000 },
  { girl: 'rikku', special: 'machina-maw', log: 'entry-rikku', total: 23000 },
  { girl: 'paine', special: 'full-throttle', log: 'entry-paine', total: 20000 },
] as const;

const change = (log: LogFile): BattleEvent => log.events.find((e) => e.type === 'spherechange')!;

/** A save's first-time answer: nothing seen (full), or `ids` seen (short). */
const seen = (ids: string[] = []) => {
  const marks: string[] = [];
  return { has: (id: string) => ids.includes(id), mark: (id: string) => marks.push(id), marks };
};

describe.each(GIRLS)('the full entry: $girl', ({ girl, special, log: name, total }) => {
  it('holds the girls, then her alone, then the parts at the cut and never before it; the chip is Wait from the field to the cut', async () => {
    const log = loadLog(name);
    const r = rig(log, { specialSeen: seen() });
    const [main, right, left] = partsOf(log);
    r.hud.hudLog.length = 0;
    await r.play([change(log)]);
    const hud = r.hud.hudLog.filter((l) => l !== 'sync');
    const girls = [girl, ...['yuna', 'rikku', 'paine'].filter((g) => g !== girl)].sort((a, b) => ['yuna', 'rikku', 'paine'].indexOf(a) - ['yuna', 'rikku', 'paine'].indexOf(b));
    expect(hud).toEqual([`hold:${girls.join(',')}`, 'mode:wait', 'chip:on', `hold:${girl}`, `hold:${main},${right},${left}`, 'mode:wait', 'chip:off']);
    const oneRow = r.hud.hudLog.indexOf(`hold:${girl}`);
    const cut = r.hud.hudLog.indexOf(`hold:${main},${right},${left}`);
    expect(r.hud.hudLog[oneRow + 1], 'a full sync follows the one-row swap').toBe('sync');
    expect(r.hud.hudLog.slice(cut).includes('sync'), 'and the cut').toBe(true);
    expect(r.hud.holdLog.slice(0, -1).every((rows) => rows !== null && rows.join() !== [main, right, left].join()), 'the parts appear only at the cut').toBe(true);
  });

  it('fades the two parked girls once, registers the form, stands two stubs and sets the Special\'s painting; the painting is not set before the reveal', async () => {
    const log = loadLog(name);
    const r = rig(log, { specialSeen: seen() });
    const [, right, left] = partsOf(log);
    const parked = ['yuna', 'rikku', 'paine'].filter((g) => g !== girl);
    r.stage.calls.length = 0;
    await r.play([change(log)]);
    for (const id of parked) expect(r.stage.calls.filter((c) => c === `fade=0:${id}`), `${id} fades once`).toHaveLength(1);
    const setForm = r.stage.calls.indexOf(`setForm:${girl}`);
    const art = r.stage.calls.indexOf(`setArt:${girl}=${girl}-${special}`);
    expect(setForm).toBeGreaterThanOrEqual(0);
    expect(r.stage.calls.slice(setForm, art + 1)).toEqual([`setForm:${girl}`, `add:${right}=`, `add:${left}=`, `setArt:${girl}=${girl}-${special}`]);
    expect(r.stage.calls.filter((c) => c.startsWith('setArt:')), 'one painting is set').toHaveLength(1);
    expect(r.stage.summonSlots.get(right)).toBe(3 + 2 * ['yuna', 'rikku', 'paine'].indexOf(girl));
    expect(r.stage.summonSlots.get(left)).toBe(4 + 2 * ['yuna', 'rikku', 'paine'].indexOf(girl));
    expect(r.stage.form?.gate, 'the form carries the hit gate').toEqual({ blocked: false });
  });

  it('consumes the plan\'s whole time through the recording sleep, less the 600 ms the HUD\'s flourish took', async () => {
    const log = loadLog(name);
    const r = rig(log, { specialSeen: seen() });
    r.sleeps.length = 0;
    await r.play([change(log)]);
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBe(total - 600);
    expect(fullPlan(girl as Girl).totalMs).toBe(total);
  });

  it('forwards every piece of every step to VfxPort.special once, in plan order, with the step\'s length', async () => {
    const log = loadLog(name);
    const r = rig(log, { specialSeen: seen() });
    const calls: Array<{ id: string; girl: string; ms: number }> = [];
    const original = r.stage.vfx.special!.bind(r.stage.vfx);
    r.stage.vfx.special = async (c) => { calls.push(c); return original(c); };
    await r.play([change(log)]);
    const plan = fullPlan(girl as Girl);
    const expected = plan.steps.flatMap((s) => (s.pieces ?? []).map((id) => ({ id, girl, ms: s.endMs - s.atMs })));
    expect(calls).toEqual(expected);
    expect(r.stage.calls.filter((c) => c.startsWith('special:')), 'and the stage double recorded them').toHaveLength(expected.length);
  });

  it('with no special member on the stage nothing throws and nothing is recorded', async () => {
    const log = loadLog(name);
    const r = rig(log, { specialSeen: seen() });
    delete (r.stage.vfx as { special?: unknown }).special;
    await expect(r.play([change(log)])).resolves.toBeDefined();
    expect(r.stage.calls.some((c) => c.startsWith('special:'))).toBe(false);
    expect(r.stage.calls).toContain(`setArt:${girl}=${girl}-${special}`);
  });
});

describe('the short entry', () => {
  it('leaves the chip as it was, holds the girls until its cut and does not mark the save', async () => {
    const log = loadLog('entry-yuna');
    const sp = seen(['special-yuna-floral-fallal']);
    const r = rig(log, { specialSeen: sp });
    const [main, right, left] = partsOf(log);
    r.hud.hudLog.length = 0;
    r.sleeps.length = 0;
    await r.play([change(log)]);
    expect(r.hud.hudLog.filter((l) => l !== 'sync')).toEqual(['hold:yuna,rikku,paine', `hold:${main},${right},${left}`]);
    expect(r.hud.chipLog, 'the chip is never shown or hidden').toEqual([]);
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBe(shortPlan('yuna').totalMs - 600);
    expect(sp.marks).toEqual([]);
    expect(r.stage.calls).toContain('setArt:yuna=yuna-floral-fallal');
  });
});

describe("the plan counts a step's own wait on the beat clock the sleeps run on", () => {
  /** A wall clock that jumps 5 s at every reading (a pause, a slow frame inside a step) beside a beat clock that is the recording sleep's. */
  function jumpy(beat: boolean) {
    let wall = 0;
    let rigRef: Rig | undefined;
    const r = rig(loadLog('entry-yuna'), { specialSeen: seen(), now: () => (wall += 5000), ...(beat ? { beatNow: () => rigRef?.clock.t ?? 0 } : {}) });
    rigRef = r;
    r.sleeps.length = 0;
    return r;
  }

  it('a jump in the wall clock inside a step does not shorten the later sleeps: the whole plan is still consumed', async () => {
    const r = jumpy(true);
    await r.play([change(loadLog('entry-yuna'))]);
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBe(22000 - 600);
  });

  it('the control: read on that jumping clock the same plan is cut short (this method can see the difference)', async () => {
    const r = jumpy(false);
    await r.play([change(loadLog('entry-yuna'))]);
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBeLessThan(22000 - 600);
  });
});

describe('the exit', () => {
  async function inForm() {
    const entry = loadLog('entry-yuna');
    const r = rig(entry, { specialSeen: seen() });
    await r.play([change(entry)]);
    const exit = loadLog('exit-yuna');
    r.use(exit);
    r.hud.hudLog.length = 0;
    r.stage.calls.length = 0;
    r.sleeps.length = 0;
    return { r, exit, entry };
  }

  it('holds the parts until 4000, hands the rows back, puts the chip back at 4500, sets the old dress, removes the stubs and the form, and brings the others back', async () => {
    const { r, exit, entry } = await inForm();
    const [, right, left] = partsOf(entry);
    const out = exit.events.find((e) => e.type === 'spherechange') as Extract<BattleEvent, { type: 'spherechange' }>;
    await r.play([out]);
    const hud = r.hud.hudLog.filter((l) => l !== 'sync');
    expect(hud).toEqual(['mode:wait', 'chip:on', 'hold:null', 'mode:wait', 'chip:off', 'mode:wait', 'chip:off']);
    expect(r.stage.calls).toContain(`setArt:yuna=yuna-${out.to}`);
    expect(r.stage.calls.slice(r.stage.calls.indexOf(`setArt:yuna=yuna-${out.to}`))).toEqual(expect.arrayContaining([`remove:${right}`, `remove:${left}`, 'setForm:null', 'fade=1:rikku', 'fade=1:paine']));
    expect(r.stage.form).toBeNull();
    // the figure went out dissolved (1) before the swap and the old-dress girl dissolves back in (0) after it, rather than popping in
    const swap = r.stage.calls.indexOf(`setArt:yuna=yuna-${out.to}`);
    expect(r.stage.calls.indexOf('dissolve=1:yuna'), 'out before the swap').toBeGreaterThan(-1);
    expect(r.stage.calls.indexOf('dissolve=1:yuna')).toBeLessThan(swap);
    expect(r.stage.calls.indexOf('dissolve=0:yuna'), 'back in after the swap').toBeGreaterThan(swap);
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBe(exitPlan().totalMs - 600);
  });
});

describe('the fall with a part standing, and the defeat with every part down', () => {
  it('keeps the hold to the swap, sets the old dress and the ko pose after it, lies the girl down only then, and gives the rows back', async () => {
    const entry = loadLog('entry-yuna');
    const r = rig(entry, { specialSeen: seen() });
    await r.play([change(entry)]);
    const fall = loadLog('fall-part-standing');
    r.use(fall);
    r.hud.hudLog.length = 0;
    r.stage.calls.length = 0;
    r.sleeps.length = 0;
    const before = fall.events.slice(0, fall.events.findIndex((e) => e.type === 'spherechange'));
    await r.play(before);
    expect(r.hud.hudLog.filter((l) => l.startsWith('hold:')), 'no rows move before the fall beat').toEqual([]);
    expect(r.stage.calls.filter((c) => c.startsWith('lieDown') || c.startsWith('pose=ko')), 'and the main does not lie down at her ko').toEqual([]);
    const out = fall.events.find((e) => e.type === 'spherechange') as Extract<BattleEvent, { type: 'spherechange' }>;
    r.sleeps.length = 0;
    await r.play([out]);
    expect(r.hud.hudLog.filter((l) => l !== 'sync')).toEqual(['mode:wait', 'chip:on', 'hold:null', 'mode:wait', 'chip:off', 'mode:wait', 'chip:off']);
    const art = r.stage.calls.indexOf(`setArt:yuna=yuna-${out.to}`);
    expect(art).toBeGreaterThan(-1);
    expect(r.stage.calls.indexOf('pose=ko:yuna'), 'the ko pose comes after the swap').toBeGreaterThan(art);
    expect(r.stage.calls).toContain('setForm:null');
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBe(fallPlan(false).totalMs - 600);
  });

  it('with every part down no beat plays: the hold and the form are released at the defeat', async () => {
    const entry = loadLog('entry-yuna');
    const r = rig(entry, { specialSeen: seen() });
    await r.play([change(entry)]);
    const defeat = loadLog('defeat-all-parts-down');
    r.use(defeat);
    r.hud.hudLog.length = 0;
    r.stage.calls.length = 0;
    const res = await r.play(defeat.events);
    expect(res.ended).toBe('defeat');
    expect(r.stage.calls.some((c) => c.startsWith('dissolve=')), 'no dissolve').toBe(false);
    expect(r.hud.holdLog.at(-1)).toBeNull();
    expect(r.stage.calls.at(-1) === 'setForm:null' || r.stage.calls.includes('setForm:null')).toBe(true);
  });
});

describe('an abort, skip speed and reduce motion', () => {
  it('abort() in the middle of an entry releases the hold and the chip', async () => {
    const log = loadLog('entry-yuna');
    const r = rig(log, { specialSeen: seen() });
    let n = 0;
    const baseSleeps = r.sleeps;
    const orig = baseSleeps.push.bind(baseSleeps);
    baseSleeps.push = (...a: number[]) => {
      if (++n === 3) r.presenter.abort();
      return orig(...a);
    };
    await r.play([change(log)]);
    expect(r.hud.holdLog.at(-1)).toBeNull();
    expect(r.hud.chipLog.at(-1)).toBe(false);
    expect(r.stage.calls.some((c) => c.startsWith('setArt:')), 'the painting was never set').toBe(false);
  });

  it('skip speed runs every step with no portrait and no error, and does not mark the save', async () => {
    const log = loadLog('entry-rikku');
    const sp = seen();
    const turnCutIn = vi.fn(async () => undefined);
    const r = rig(log, { specialSeen: sp, moments: { turnCutIn } as never });
    r.presenter.setSpeed('skip');
    await expect(r.play([change(log)])).resolves.toBeDefined();
    expect(turnCutIn).not.toHaveBeenCalled();
    expect(sp.marks).toEqual([]);
    expect(r.stage.calls).toContain('setArt:rikku=rikku-machina-maw');
    expect(r.hud.holdLog.at(-1)?.length).toBe(3);
  });

  it('reduce motion walks the reduced plan: a quarter of the time, no piece reaches the effects layer', async () => {
    const log = loadLog('entry-paine');
    const r = rig(log, { specialSeen: seen(), moments: { reduceMotion: () => true } as never });
    r.sleeps.length = 0;
    await r.play([change(log)]);
    expect(r.stage.calls.some((c) => c.startsWith('special:'))).toBe(false);
    expect(r.sleeps.reduce((a, b) => a + b, 0)).toBeLessThan(20000 * 0.25);
    expect(r.hud.holdLog.at(-1)?.length).toBe(3);
  });
});

describe('the HUD sync at the beats is the full sync', () => {
  // The main's row text and the 'never syncVitals' claim are asserted against a REAL FFX2BattleHud in special-presenter-submit.test.ts (this double only counts calls).
  it('syncs the full HUD right after the one-row hold and at the cut', async () => {
    const log = loadLog('entry-paine');
    const r = rig(log, { specialSeen: seen() });
    r.hud.hudLog.length = 0;
    await r.play([change(log)]);
    const swap = r.hud.hudLog.indexOf('hold:paine');
    const cut = r.hud.hudLog.indexOf(`hold:${partsOf(log).join(',')}`);
    expect(swap).toBeGreaterThan(-1);
    expect(cut).toBeGreaterThan(swap);
    expect(r.hud.hudLog[swap + 1]).toBe('sync');
    expect(r.hud.hudLog.slice(cut).includes('sync'), 'and the cut').toBe(true);
  });
});
