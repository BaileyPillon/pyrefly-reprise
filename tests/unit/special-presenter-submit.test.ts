// @vitest-environment jsdom
/**
 * Review fix R2-1 and R2-2 of the FFX-2 Special look (step C2's rules 2, 3 and 4; game case: FFX-2 only in what is seen; the call-ins are shared plumbing for both games and return at once while the
 * switch is OFF): the SUBMIT side of the presenter, which the replays of `special-presenter-sequence.test.ts` (they call `presenter.play()` directly) never reach.
 *
 * Held here, on the REAL FFX-2 engine with the switch on (`openSpecial` + `walkTo`, then the offered Special Dress Up row submitted through `presenter.submit`):
 * - `preSubmit` (`BattlePresenterCommands.submit`) holds the three girls' rows BEFORE the engine mutates `activeIds` and before any event of the burst reaches the HUD, once (the entry's own late fallback
 *   `if (!hold.active) hold.rows(girls)` must not be the one that does it); an ordinary Change, and a Special command with the switch off, hold nothing;
 * - with the form up, `run()` on the next link lets go (`releaseSpecial` at its top): the hold is released and the stage form dropped before anything else is drawn; so does a victory;
 * - a real `FFX2BattleHud` under the real presenter: the held rows are the girls' at the beat and the parts' at the cut, the main's row text carries the form's pools over the form's maxima from the live
 *   state (never the old dress's, which differ), and `syncVitals` is never what draws them.
 *
 * Removal: delete the `preSubmit` line in `BattlePresenterCommands.ts`, or the `releaseSpecial` line at the top of `BattlePresenter.run`, and the cases named for them fail.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, BattleState, Command, FFX2Combatant } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { PresenterDeps } from '../../src/engine/BattlePresenterPorts.ts';
import { setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { heldOffAll } from '../../src/engine/SummonStaging.ts';
import { FakeHud, FakeStage } from './helpers/FakeStage.ts';
import { loadLog, ScriptedFfx2Engine, stateOf } from './helpers/specialPlayback.ts';
import { bahamutGroup, chapterIV } from './helpers/specialFormState.ts';
import { openSpecial, specialRow, unit, walkTo } from './helpers/specialDrive.ts';

const GIRLS = ['yuna', 'rikku', 'paine'];

/** A save that has not seen any Special (the full entry plays). */
const unseen = () => ({ has: () => false, mark: () => undefined });

type Submitter = { submit(engine: unknown, command: Command): Promise<unknown> };

/** The real engine, walked to the offer of `girl`'s Special; the presenter over a stage double and `hud`, seeded from the engine's live state; and the offered command. */
function offered(girl: string, hud: PresenterDeps['hud'], opts: { specials?: boolean } = {}) {
  const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, immortal: true, specials: opts.specials ?? true });
  const walk = walkTo(engine, girl, { immortal: true });
  const row = walk.input ? specialRow(walk.input) : undefined;
  const stage = new FakeStage([...engine.state().activeIds], [...engine.state().enemyIds]);
  const clock = { t: 0 };
  const sleeps: number[] = [];
  const presenter = new BattlePresenter({
    stage,
    hud,
    sleep: (ms) => {
      sleeps.push(ms);
      clock.t += ms;
      return Promise.resolve();
    },
    now: () => clock.t,
    specialSeen: unseen(),
  });
  presenter.syncHud(engine as never);
  (presenter as unknown as { queuedEngine: unknown }).queuedEngine = engine;
  return { engine, presenter, stage, row, sleeps, submit: (command: Command) => (presenter as unknown as Submitter).submit(engine, command) };
}

/** A FakeHud that also logs each event the presenter announces, in order with the holds (`event:<type>`). */
function loggedHud(): FakeHud {
  const hud = new FakeHud();
  const original = hud.onEvent.bind(hud);
  hud.onEvent = (event: BattleEvent): void => {
    hud.hudLog.push(`event:${event.type}`);
    original(event);
  };
  return hud;
}

describe('preSubmit: the submit side holds the three girls before the burst', () => {
  it('the first hold is the three girls, set before the engine mutates activeIds and before any event reaches the HUD, and it is set once', async () => {
    const hud = loggedHud();
    const o = offered('yuna', hud);
    expect(o.row, 'the walk reached the offer of her Special').toBeDefined();
    expect(o.engine.state().activeIds).toEqual(GIRLS);
    hud.hudLog.length = 0;
    await o.submit(o.row!.command);
    expect(o.engine.state().activeIds, 'the engine did mutate activeIds inside submit').not.toEqual(GIRLS);
    const log = hud.hudLog;
    const firstHold = log.findIndex((l) => l.startsWith('hold:'));
    const firstEvent = log.findIndex((l) => l.startsWith('event:'));
    expect(log[firstHold], 'the first list held is the girls\', as the HUD listed them before the change').toBe('hold:yuna,rikku,paine');
    expect(firstEvent, 'the burst did reach the HUD').toBeGreaterThan(-1);
    expect(firstHold, 'the hold comes before the first event of the burst').toBeLessThan(firstEvent);
    expect(log.filter((l) => l === 'hold:yuna,rikku,paine'), 'and only once: the entry\'s late fallback did not hold them again').toHaveLength(1);
    const parts = o.engine.state().activeIds.join(',');
    expect(hud.holdLog.at(-1)?.join(',')).toBe(parts); // the cut: the form's three plates
  });

  it('an ordinary Change holds nothing', async () => {
    const hud = loggedHud();
    const o = offered('yuna', hud);
    hud.hudLog.length = 0;
    await o.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: 'thief', toNode: 0, gatesCrossed: [] } } as unknown as Command);
    expect(hud.hudLog.some((l) => l.startsWith('hold:')), 'no list held for a Change that is not the Special').toBe(false);
    expect(hud.chipLog).toEqual([]);
  });

  it('with the switch OFF the Special row is not offered, and a Special command sent anyway holds nothing', async () => {
    const hud = loggedHud();
    const o = offered('yuna', hud, { specials: false });
    expect(o.row, 'no Special row with the switch off').toBeUndefined();
    hud.hudLog.length = 0;
    const state = o.engine.state() as BattleState;
    expect(state.flags['specialDressUp']).toBeUndefined();
    const asked = { kind: 'spherechange', targets: [], extra: { toDressphere: 'floral-fallal', toNode: 0, gatesCrossed: [], specialDressUp: true } } as unknown as Command;
    try {
      await o.submit(asked); // the engine refuses it; what matters is that the presenter's call-in made no hold first
    } catch {
      /* the engine may throw on an unoffered command */
    }
    expect(hud.hudLog.some((l) => l.startsWith('hold:'))).toBe(false);
  });
});

/** The two parked girls are out of the held-off map (the x-ray and the strike reach read it) and were faded back in. */
function expectGirlsBack(o: { stage: FakeStage }): void {
  expect([...heldOffAll(o.stage)], 'nobody is held off the field any more').toEqual([]);
  expect(o.stage.calls).toEqual(expect.arrayContaining(['fade=1:rikku', 'fade=1:paine']));
}

describe('releaseSpecial: a new link, a victory and an abort let go of a form that is still up', () => {
  /** A girl in her Special through the real presenter: the form is on the stage and the three plates are held. */
  async function formUpThroughSubmit() {
    const hud = loggedHud();
    const o = offered('yuna', hud);
    await o.submit(o.row!.command);
    expect(o.stage.form, 'the form is up').not.toBeNull();
    expect(hud.holdLog.at(-1), 'and the plates are held').not.toBeNull();
    expect([...heldOffAll(o.stage)].sort(), 'and the other two girls are parked off the field').toEqual(['paine', 'rikku']);
    return { ...o, hud };
  }

  it('run() on the next link releases the hold and drops the stage form before it draws anything else', async () => {
    const o = await formUpThroughSubmit();
    o.hud.hudLog.length = 0;
    o.stage.calls.length = 0;
    const next = loadLog('entry-yuna');
    const engine = new ScriptedFfx2Engine([], stateOf(next.state));
    await o.presenter.run(engine as never);
    expect(o.hud.holdLog.at(-1), 'the held rows are let go').toBeNull();
    expect(o.stage.calls).toContain('setForm:null');
    expect(o.stage.form).toBeNull();
    expectGirlsBack(o);
    expect(o.hud.hudLog.find((l) => l.startsWith('hold:')), 'and it is the first thing the link does to the held list').toBe('hold:null');
    expect(o.hud.hudLog.indexOf('hold:null'), 'before the link\'s first sync').toBeLessThan(o.hud.hudLog.indexOf('sync'));
  });

  it('a victory releases it too (the engine ends a form silently at the battle\'s end)', async () => {
    const o = await formUpThroughSubmit();
    o.hud.hudLog.length = 0;
    o.stage.calls.length = 0;
    const result = { outcome: 'victory', turns: 9, elapsedTicks: 1, elapsedMs: 1, ap: 0, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {}, levelsGained: {} };
    const res = await o.presenter.play([{ type: 'victory', result, seq: 9999 } as unknown as BattleEvent]);
    expect(res.ended).toBe('victory');
    expect(o.hud.holdLog.at(-1)).toBeNull();
    expect(o.stage.form).toBeNull();
    expect(o.stage.calls).toContain('setForm:null');
    expectGirlsBack(o);
  });

  it('abort() releases it as well', async () => {
    const o = await formUpThroughSubmit();
    o.presenter.abort();
    expect(o.hud.holdLog.at(-1)).toBeNull();
    expect(o.stage.form).toBeNull();
    expectGirlsBack(o);
  });

  it('a release BEFORE the reveal (the abort comes after the others have faded, long before the figure takes its place) brings them back too', async () => {
    const o = offered('yuna', loggedHud());
    let aborted = false;
    const push = o.sleeps.push.bind(o.sleeps);
    o.sleeps.push = (...a: number[]): number => {
      if (!aborted && o.stage.calls.includes('fade=0:rikku')) {
        aborted = true;
        o.presenter.abort();
      }
      return push(...a);
    };
    await o.submit(o.row!.command);
    expect(aborted, 'the entry got as far as parking the others').toBe(true);
    expect(o.stage.calls.some((c) => c.startsWith('setForm:') && c !== 'setForm:null'), 'and never revealed the figure').toBe(false);
    expectGirlsBack(o);
  });
});

describe('a real FFX2BattleHud under the real presenter', () => {
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
  const rowText = (id: string): string => root.querySelector(`.ig-stat[data-actor-id="${id}"] .ig-stat__value:not(.ig-stat__value--mp)`)!.textContent!;

  it('the girls\' rows at the beat, the three plates at the cut, and the main\'s row text is the form\'s pools over the form\'s maxima from the live state, drawn by the full sync and never by syncVitals', async () => {
    const hud = new FFX2BattleHud();
    hud.mount(root);
    // every redraw call and what the column shows right after it, in call order
    const trace: Array<{ call: string; ids: string[] }> = [];
    const wrap = <K extends 'holdRows' | 'sync' | 'syncVitals'>(name: K, label: (args: Parameters<FFX2BattleHud[K]>) => string): void => {
      const original = hud[name].bind(hud) as (...a: unknown[]) => unknown;
      (hud as unknown as Record<string, unknown>)[name] = (...args: unknown[]): unknown => {
        const out = original(...args);
        trace.push({ call: label(args as Parameters<FFX2BattleHud[K]>), ids: ids() });
        return out;
      };
    };
    wrap('holdRows', ([rows]) => `hold:${rows ? rows.join(',') : 'null'}`);
    wrap('sync', () => 'sync');
    wrap('syncVitals', () => 'vitals');
    const o = offered('yuna', hud);
    hud.sync(o.engine.state() as BattleState, o.engine.gaugeSnapshot());
    const oldMax = unit(o.engine, 'yuna').stats.maxHp;
    expect(ids(), 'the column starts as the engine\'s three girls').toEqual(GIRLS);
    trace.length = 0;
    await o.submit(o.row!.command);
    const state = o.engine.state() as BattleState;
    const parts = [...state.activeIds];
    const main = state.combatants['yuna'] as FFX2Combatant;
    expect(main.stats.maxHp, 'her form\'s maximum is not the old dress\'s').not.toBe(oldMax);
    const calls = trace.map((t) => t.call);
    // the lists, in the order they were held: the girls (by preSubmit), her alone, the three plates (the cut); the column shows each the moment it is held
    const holds = trace.filter((t) => t.call.startsWith('hold:'));
    expect(holds.map((t) => t.call)).toEqual(['hold:yuna,rikku,paine', 'hold:yuna', `hold:${parts.join(',')}`]);
    expect(holds.map((t) => t.ids)).toEqual([GIRLS, ['yuna'], parts]);
    // a FULL sync follows the one-row swap and the cut, and syncVitals (which would redraw from the engine's own list) never ran between the first hold and the cut
    const swap = calls.indexOf('hold:yuna');
    const cut = calls.indexOf(`hold:${parts.join(',')}`);
    expect(calls[swap + 1], 'a full sync follows the one-row swap').toBe('sync');
    expect(calls[cut + 1], 'and the cut').toBe('sync');
    expect(calls.slice(0, cut + 2), 'the held stretch').not.toContain('vitals');
    // after the cut the column shows the parts, and the main's row is the live pools over the live maxima
    expect(ids()).toEqual(parts);
    expect(rowText('yuna')).toBe(`${Math.max(0, main.hp)}/${main.stats.maxHp}`);
  }, 60_000);
});
