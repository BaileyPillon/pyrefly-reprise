/**
 * Test 13, the replay half, of the FFX-2 Special look (step C2; game case: FFX-2 only in what is seen): the recorded bursts and the hand-written ones played through the REAL presenter, with the stage
 * double answering `actor(id)` through `formHandleOf` (so a part's reaction goes through `FormActorHandle` and the main's through the hit-gated figure) and the form's own `gate` flipped by the
 * presenter's `noteSpecial`. A new file beside `special-reactions.test.ts` (the pure table), not an edit of it.
 *
 * Held here: a part casts and the figure shows `cast`; two or three plates hit in one enemy action make ONE `hurt` (a first blow on a part then on the main, the reverse, all three; the next
 * `action-start` re-opens the gate; a blow after `action-end` is a first blow again; the numerals still print three times); a heal on a part is the green flash and no hurt; a miss is the hop; a
 * Petrify on a part or on the main alone does not stone the figure; a part's knock-out puts nothing on the figure; the main's Auto-Life is exactly one green flash and, with an ability id on the girl's
 * latest action, no `statusFxLanding` at the entry's `status-add`; only a part's status, petrify on the main and auto-life on the main are routed. Both part-mark modes.
 *
 * Fails without the feature: the gate case (two shakes) and the routed-status cases.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { PaintedActor } from '../../src/engine/PaintedActor.ts';
import { setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { formHandleOf, setSpecialLook, setStageForm, type StageForm } from '../../src/engine/SpecialStaging.ts';
import { FakeActor, FakeDamageNumbers, FakeStage } from './helpers/FakeStage.ts';
import { loadLog, rig, type LogFile } from './helpers/specialPlayback.ts';

/** A figure that keeps the arguments of its flashes. */
class Fig extends FakeActor {
  readonly flashes: Array<[number | undefined, number | undefined, number | undefined]> = [];
  readonly told: string[] = [];
  override flash(colour?: number | string, ms?: number, peak?: number): void {
    super.flash();
    this.flashes.push([colour as number | undefined, ms, peak]);
  }
  noteStatus(status: string, on: boolean): void {
    this.told.push(`${status}:${on}`);
  }
}

/** The stage double of the replay: the main's and the parts' actors come through the registry, as `PaintedStage.actor` does. */
class FormStage extends FakeStage {
  constructor() {
    super(['yuna', 'rikku', 'paine'], ['bahamut']);
    for (const id of ['yuna', 'rikku', 'paine']) this.actors.set(id, new Fig(id, this.calls));
  }
  override actor(id: string) {
    const own = { get: (k: string) => (this.actors.has(k) ? { actor: this.actors.get(k) as unknown as PaintedActor } : undefined) };
    return formHandleOf(this, id, own) ?? super.actor(id);
  }
  override setForm(form: StageForm | null): void {
    super.setForm(form);
    setStageForm(this, form);
  }
}

afterEach(() => {
  setSpecialLook(null);
  setFxMode(null);
  setFxChapter(undefined);
});

const RIGHT = 'floral-fallal-right-pistil';
const LEFT = 'floral-fallal-left-pistil';
let seq = 1000;
const ev = (e: Record<string, unknown>): BattleEvent => ({ seq: seq++, ...e }) as unknown as BattleEvent;
const strike = (targetId: string, amount = 100): BattleEvent => ev({ type: 'damage', targetId, sourceId: 'bahamut', amount, element: 'none', affinity: 'normal', crit: false, hitIndex: 0, hitCount: 1 });
const start = (actorId: string, targets: string[], kind = 'ability'): BattleEvent => ev({ type: 'action-start', actorId, command: { kind, id: 'x', targets }, abilityId: 'x', abilityName: 'X', targets });
const end = (actorId: string): BattleEvent => ev({ type: 'action-end', actorId });

async function formUp(mark: 'a' | 'b' = 'a') {
  setSpecialLook({ mark });
  const stage = new FormStage();
  const numerals = new FakeDamageNumbers();
  const entry = loadLog('entry-yuna');
  const r = rig(entry, { damageNumbers: numerals }, stage);
  await r.play([entry.events.find((e) => e.type === 'spherechange')!]);
  stage.calls.length = 0;
  const fig = stage.actors.get('yuna') as Fig;
  fig.flashes.length = 0; // the reveal's own flash is the entry's
  fig.told.length = 0;
  return { r, stage, numerals, fig, entry };
}

describe.each(['a', 'b'] as const)('the reactions, part mark (%s)', (mark) => {
  it('a part casts: the figure shows cast', async () => {
    const { r, stage } = await formUp(mark);
    await r.play([start(RIGHT, ['bahamut'])]);
    expect(stage.calls).toContain('pose=cast:yuna');
    expect(stage.calls.filter((c) => c === 'pose=attack:yuna')).toEqual([]);
  });

  it('two or three plates hit in one enemy action: one hurt (one shake, one recoil), in either order, and three numerals', async () => {
    for (const order of [[RIGHT, 'yuna'], ['yuna', RIGHT], [RIGHT, 'yuna', LEFT], ['yuna', LEFT, RIGHT]]) {
      const { r, stage, numerals } = await formUp(mark);
      await r.play([start('bahamut', order), ...order.map((id) => strike(id)), end('bahamut')]);
      expect(stage.calls.filter((c) => c === 'shake:yuna'), order.join()).toHaveLength(1);
      expect(stage.calls.filter((c) => c === 'recoil:yuna'), order.join()).toHaveLength(1);
      expect(numerals.shown, 'the numerals still print per plate').toHaveLength(order.length);
    }
  });

  it('the next action re-opens the gate, and a blow after the action (a poison tick) is a first blow again', async () => {
    const { r, stage } = await formUp(mark);
    await r.play([start('bahamut', [RIGHT, 'yuna']), strike(RIGHT), strike('yuna'), end('bahamut'), start('bahamut', ['yuna']), strike('yuna'), end('bahamut'), strike(LEFT)]);
    expect(stage.calls.filter((c) => c === 'shake:yuna')).toHaveLength(3);
  });

  it('turn-start, action-end and a part\'s stance land on the figure\'s idle', async () => {
    const { r, stage } = await formUp(mark);
    await r.play([start(RIGHT, ['bahamut']), end(RIGHT)]);
    expect(stage.calls.lastIndexOf('pose=idle:yuna')).toBeGreaterThan(stage.calls.indexOf('pose=cast:yuna'));
  });

  it('a heal on a part is the green flash and no hurt; a miss is the hop only', async () => {
    const { r, stage, fig } = await formUp(mark);
    const heal = loadLog('heal-on-part-synthetic').events[0]!;
    await r.play([heal]);
    expect(fig.flashes.some(([c]) => c === 0x9dffc4)).toBe(true);
    expect(stage.calls.some((c) => c.startsWith('pose=hurt'))).toBe(false);
    stage.calls.length = 0;
    await r.play([ev({ type: 'miss', targetId: RIGHT, sourceId: 'bahamut', reason: 'evaded', hitIndex: 0 })]);
    expect(stage.calls).toContain('hop:yuna');
    expect(stage.calls.some((c) => c.startsWith('pose=hurt'))).toBe(false);
  });

  it('a part Petrified: the figure is not stone, and neither when only the main is', async () => {
    const { r, stage, fig } = await formUp(mark);
    for (const id of [RIGHT, LEFT, 'yuna']) await r.play([ev({ type: 'status-add', targetId: id, sourceId: 'bahamut', status: 'petrify', instance: { id: 'petrify' } })]);
    expect(stage.calls.some((c) => c.startsWith('stone='))).toBe(false);
    expect(fig.told).toEqual([]);
  });

  it('a part falls: nothing reaches the figure (no pose, no lie-down, no fade)', async () => {
    const { r, stage } = await formUp(mark);
    await r.play([ev({ type: 'ko', targetId: RIGHT, sourceId: 'bahamut' })]);
    expect(stage.calls.filter((c) => c.endsWith(':yuna') && !c.startsWith('pose=idle'))).toEqual([]);
    expect(stage.calls.some((c) => c.startsWith('lieDown') || c.startsWith('fade='))).toBe(false);
  });

  it('a part at low HP does not put the figure in critical: a status on a part never reaches it', async () => {
    const { r, fig } = await formUp(mark);
    await r.play([loadLog('status-on-part-synthetic').events[0]!, ev({ type: 'status-add', targetId: RIGHT, sourceId: 'bahamut', status: 'critical', instance: { id: 'critical' } })]);
    expect(fig.told).toEqual([]);
  });
});

describe('the main\'s Auto-Life and the routed statuses', () => {
  it('Auto-Life added at the entry is one violet status flash, and no statusFxLanding lands on the figure even when her latest action carries an ability id', async () => {
    setFxMode('new');
    setFxChapter('ffx2-bahamut');
    const land = vi.fn(() => 0);
    const stage = new FormStage();
    (stage.vfx as { land?: unknown }).land = land;
    const entry = loadLog('entry-yuna');
    const r = rig(entry, {}, stage);
    await r.play([start('yuna', ['bahamut'], 'ability'), end('yuna')]); // her latest action carries an ability id with a status piece
    land.mockClear();
    await r.play(entry.events.filter((e) => e.type === 'spherechange' || e.type === 'status-add'));
    expect(land, 'nothing from the status effect lands at the entry').not.toHaveBeenCalled();
    const fig = stage.actors.get('yuna') as Fig;
    expect(fig.flashes.filter(([c]) => c === 0xc9a6ff)).toHaveLength(1);
    // the control: an ordinary status-add on a girl OUTSIDE a form does call it, so the case above proves something
    const plain = new FormStage();
    (plain.vfx as { land?: unknown }).land = land;
    const r2 = rig(entry, {}, plain);
    await r2.play([start('yuna', ['bahamut'], 'ability'), ev({ type: 'status-add', targetId: 'yuna', sourceId: 'yuna', status: 'haste', instance: { id: 'haste' } })]);
    expect(land).toHaveBeenCalled();
  });

  it('the main\'s Auto-Life consumed and the revive: exactly one green flash on the figure', async () => {
    const { r, fig } = await formUp('a');
    const log: LogFile = loadLog('autolife-main');
    r.use(log);
    await r.play(log.events.filter((e) => e.type === 'status-remove' || e.type === 'revive'));
    expect(fig.flashes.filter(([c]) => c === 0x9dffc4)).toHaveLength(1);
  });

  it('only a part\'s status, petrify on the main and auto-life added to the main are routed; every other status on the main plays today\'s lines', async () => {
    const { r, fig } = await formUp('a');
    await r.play([ev({ type: 'status-add', targetId: 'yuna', sourceId: 'bahamut', status: 'poison', instance: { id: 'poison' } })]);
    expect(fig.told).toEqual(['poison:true']);
    expect(fig.flashes.at(-1)?.[0]).toBe(0xc9a6ff);
    await r.play([ev({ type: 'status-remove', targetId: 'yuna', status: 'poison', reason: 'expired' })]);
    expect(fig.told).toEqual(['poison:true', 'poison:false']);
  });

  it('no part id ever reaches the party KO path: a part\'s knock-out adds no pose and no flash to any girl', async () => {
    const { r, stage, fig } = await formUp('a');
    await r.play([ev({ type: 'ko', targetId: LEFT, sourceId: 'bahamut' })]);
    expect(fig.flashes).toEqual([]);
    expect(stage.calls.some((c) => c.startsWith('pose=ko'))).toBe(false);
  });
});
