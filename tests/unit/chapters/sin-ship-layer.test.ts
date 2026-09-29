// @vitest-environment jsdom
/**
 * **The ship layer in Sin's chapters** (FFX only): what the *Fahrenheit*'s deck shows once Sin's fights publish
 * Evrae's range flag, and what it must not change.
 *
 * - **REVIEW must-change 3.** The range director binds Evrae (Chapter VIII) or a Fin (Chapter XVII) and
 *   nothing else: Overdrive Sin (Chapter XVIII) publishes the same `airship.range` and
 *   `airship.countsTargetings`, and its staging stays exactly what it was (no foe bound, no re-bind). Chapter
 *   VIII binds Evrae exactly as before (one bind, its own art id). Chapter XVII follows its chain.
 * - **REVIEW must-change 4.** The Trigger Command widget draws no pip strip when `airship.missiles` is absent
 *   (Cid fires no missiles at the Fins, S-19); Evrae, which always publishes it, keeps its three pips.
 */

import { Object3D } from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { AvailableCommand, BattleState, Command } from '../../../src/battle/common/types.ts';
import { attachAirshipBattle, rangeFoeOf } from '../../../src/app/screens/BattleScreenAirship.ts';
import { AirshipRangeDirector, attachAirshipRange } from '../../../src/scenes/evrae-airship-director.ts';
import { SIN_FACE_PHONE } from '../../../src/scenes/evrae-airship-subjects.ts';
import { AirshipOrderWidget } from '../../../src/ui/ffx/AirshipOrderWidget.ts';
import { AirshipOrders } from '../../../src/ui/ffx/AirshipOrders.ts';

// ---------------------------------------------------------------------------
// The director hook
// ---------------------------------------------------------------------------

/** A director with the real class (the hook finds it by `instanceof`) and recording stand-ins for its calls. */
function fakeDirector(): { director: AirshipRangeDirector; binds: unknown[][]; ranges: string[]; faces: unknown[] } {
  const binds: unknown[][] = [];
  const ranges: string[] = [];
  const faces: unknown[] = [];
  const director = Object.create(AirshipRangeDirector.prototype) as AirshipRangeDirector;
  let range = 'near';
  Object.defineProperty(director, 'current', { get: () => range });
  Object.assign(director, {
    bindCamera: vi.fn(),
    bindEvrae: vi.fn(async (...args: unknown[]) => {
      binds.push(args);
    }),
    sync: vi.fn((s: BattleState | null | undefined) => {
      const r = s?.flags['airship.range'];
      if (r === 'near' || r === 'far') range = r;
    }),
    setRange: vi.fn((r: string) => {
      ranges.push(r);
      range = r;
    }),
    stageFace: vi.fn((staging: unknown) => {
      faces.push(staging);
    }),
  });
  return { director, binds, ranges, faces };
}

function enemy(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { id, side: 'enemy', removed: false, flags: {}, ...extra };
}
const cid = enemy('cid', { flags: { untargetable: true, hideHpBar: true } });

function board(enemies: Record<string, unknown>[], flags: Record<string, unknown>): BattleState {
  return { game: 'ffx', flags, combatants: Object.fromEntries(enemies.map((e) => [e.id as string, e])) } as unknown as BattleState;
}

/** A stage whose actors can be swapped, as a chain's re-stage does. */
function fakeStage(ids: string[]) {
  const actors = new Map<string, object>(ids.map((id) => [id, { id }]));
  const removed: string[] = [];
  return {
    actors,
    removed,
    stage: {
      actor: (id: string) => actors.get(id) as never,
      removeCombatant: (id: string) => {
        removed.push(id);
        actors.delete(id);
      },
    },
  };
}

async function attach(state: BattleState, ids: string[]) {
  const scene = new Object3D();
  const d = fakeDirector();
  attachAirshipRange(scene, d.director);
  const s = fakeStage(ids);
  const hook = await attachAirshipBattle({ scene, battleCamera: {} as never }, s.stage, state);
  return { ...d, ...s, hook: hook! };
}

describe('the range director binds Evrae or a Fin, and nothing else', () => {
  it('the range foe is never Overdrive Sin, Genais or the Core', () => {
    expect(rangeFoeOf(board([enemy('overdrive-sin')], { 'airship.range': 'far', 'airship.countsTargetings': 'overdrive-sin' }))).toBeNull();
    expect(rangeFoeOf(board([enemy('sinspawn-genais'), enemy('sin-core')], {}))).toBeNull();
    expect(rangeFoeOf(board([enemy('evrae'), cid], { 'airship.range': 'near' }))).toBe('evrae');
    expect(rangeFoeOf(board([enemy('left-fin'), cid], { 'airship.range': 'far' }))).toBe('left-fin');
  });

  it('Chapter VIII: one bind of Evrae with its own art id, Cid removed, no re-bind on sync (unchanged)', async () => {
    const state = board([enemy('evrae'), cid], { 'airship.range': 'near', 'airship.missilesLeft': 3 });
    const t = await attach(state, ['evrae', 'cid']);
    expect(t.binds).toEqual([[t.actors.get('evrae')]]);
    expect(t.removed).toEqual(['cid']);
    for (const r of ['far', 'near', 'far']) t.hook.sync(board([enemy('evrae'), cid], { 'airship.range': r }));
    expect(t.binds).toHaveLength(1);
    expect(t.ranges).toEqual([]);
    expect(t.faces).toEqual([]); // no phone rigs for Evrae
  });

  it('Chapter XVIII (link 4): the head is never bound, before or after any sync (staging unchanged)', async () => {
    const flags = { 'airship.range': 'far', 'airship.countsTargetings': 'overdrive-sin', 'sin.turn': 0 };
    const t = await attach(board([enemy('overdrive-sin')], flags), ['overdrive-sin']);
    expect(t.binds).toEqual([[null]]);
    for (const r of ['far', 'far', 'near']) t.hook.sync(board([enemy('overdrive-sin')], { ...flags, 'airship.range': r }));
    expect(t.binds).toEqual([[null]]);
    expect(t.ranges).toEqual([]);
    expect(t.removed).toEqual([]);
    // C4-5: the phone's link 4 rigs (inert on the desktop, `sin-phone-staging.test.ts`), handed over once.
    expect(t.faces).toEqual([SIN_FACE_PHONE]);
  });

  it('Chapter XVII: binds the Left Fin, re-binds the Right Fin after the re-stage, lets go at link 3', async () => {
    const t = await attach(board([enemy('left-fin'), cid], { 'airship.range': 'far' }), ['left-fin', 'cid']);
    expect(t.binds).toEqual([[t.actors.get('left-fin'), 'left-fin']]);
    expect(t.removed).toEqual(['cid']);

    // The chain re-stages link 2: a new Fin actor and Cid drawn again.
    t.actors.clear();
    t.actors.set('right-fin', { id: 'right-fin' });
    t.actors.set('cid', { id: 'cid' });
    t.hook.sync(board([enemy('right-fin'), cid], { 'airship.range': 'far' }));
    expect(t.binds.at(-1)).toEqual([t.actors.get('right-fin'), 'right-fin']);
    expect(t.removed).toEqual(['cid', 'cid']);
    t.hook.sync(board([enemy('right-fin'), cid], { 'airship.range': 'far' }));
    expect(t.binds).toHaveLength(2);

    // Link 3, Sin's back: no range flag, no Fin. The director lets go and returns to the NEAR framing.
    t.actors.clear();
    t.actors.set('sinspawn-genais', {});
    t.actors.set('sin-core', {});
    t.hook.sync(board([enemy('sinspawn-genais'), enemy('sin-core')], {}));
    expect(t.binds.at(-1)).toEqual([null, undefined]);
    expect(t.ranges).toEqual(['near']);
  });
});

// ---------------------------------------------------------------------------
// The order widget
// ---------------------------------------------------------------------------

function trigger(id: 'pull-back' | 'close-in', enabled = true): AvailableCommand {
  return { label: id === 'pull-back' ? 'Pull back' : 'Close in', enabled, command: { kind: 'trigger', id, targets: [] }, validTargets: [] } as unknown as AvailableCommand;
}

describe('the Trigger Command widget without a missile rack', () => {
  it('no pip strip and no volley in the cost when volleysLeft is null (the Fins)', () => {
    const w = new AirshipOrderWidget();
    document.body.appendChild(w.el);
    void w.open([trigger('pull-back'), trigger('close-in')], 'far', null);
    expect(w.el.querySelector('.ffx-airship-order__pips')).toBeNull();
    expect(w.el.querySelector('.ffx-airship-order__left')).toBeNull();
    expect(w.el.textContent).not.toMatch(/volley/i);
    expect(w.el.textContent).toMatch(/Cid's next turn/);
    w.dispose();
  });

  it('Evrae keeps its three pips (a number is passed)', () => {
    const w = new AirshipOrderWidget();
    document.body.appendChild(w.el);
    void w.open([trigger('pull-back'), trigger('close-in')], 'near', 2);
    expect(w.el.querySelectorAll('.ffx-airship-order__pips i')).toHaveLength(3);
    expect(w.el.querySelectorAll('.ffx-airship-order__pip--live')).toHaveLength(2);
    expect(w.el.textContent).toMatch(/1 volley/);
    w.dispose();
  });

  it('AirshipOrders passes null when the flag is absent, and the rack when it is set', async () => {
    for (const [flags, pips] of [[{ 'airship.range': 'far' }, 0], [{ 'airship.range': 'far', 'airship.missilesLeft': 3 }, 3]] as const) {
      const orders = new AirshipOrders();
      document.body.appendChild(orders.el);
      const attack = { label: 'Attack', enabled: true, command: { kind: 'attack', targets: [] }, validTargets: [] } as unknown as AvailableCommand;
      void orders.choose([trigger('pull-back'), trigger('close-in'), attack], { flags } as unknown as BattleState, async (c) => c[0]!.command as Command);
      await Promise.resolve();
      await Promise.resolve();
      expect(orders.el.hidden).toBe(false);
      expect(orders.el.querySelectorAll('.ffx-airship-order__pips i')).toHaveLength(pips);
      orders.abandon();
      orders.dispose();
    }
  });
});
