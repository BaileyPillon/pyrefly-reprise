/**
 * The presenter's half of the B1 spell effects: the numeral waits for the
 * spell to land (`VfxPort.land`), the effect knows which ability is on screen,
 * and a counter by someone else resolves by its element only. Both games.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { SPELL_WAIT_CAP_MS } from '../../src/engine/BattlePresenterSpellFx.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup(wait: number) {
  const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux', 'mortiorchis']);
  const lands: Array<{ at: string; o: Record<string, unknown> }> = [];
  const log: string[] = [];
  stage.vfx.land = (at, o) => {
    lands.push({ at, o: { ...o } });
    log.push(`land:${at}`);
    return wait;
  };
  const damageNumbers = new FakeDamageNumbers();
  const show = damageNumbers.show.bind(damageNumbers);
  damageNumbers.show = (n) => {
    log.push(`numeral:${n.kind}`);
    show(n);
  };
  const sleeps: number[] = [];
  const presenter = new BattlePresenter({
    stage,
    damageNumbers,
    messageBar: new FakeMessageBar(),
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
  });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { lands, log, sleeps, play };
}

const fireOnFlux: Array<Unsequenced<BattleEvent>> = [
  { type: 'action-start', actorId: 'yuna', command: { kind: 'ability', abilityId: 'fire', targets: ['seymour-flux'] } as never, abilityId: 'fire', abilityName: 'Fire', targets: ['seymour-flux'] },
  { type: 'damage', targetId: 'seymour-flux', sourceId: 'yuna', amount: 800, element: 'fire', crit: false, hitIndex: 0, hitCount: 1 },
  { type: 'action-end', actorId: 'yuna' },
];

describe('spell effects in the presenter', () => {
  it('asks the stage for the acting ability and waits for it to land before the numeral', async () => {
    const { lands, log, sleeps, play } = setup(500);
    await play(fireOnFlux);
    expect(lands).toHaveLength(1);
    expect(lands[0]).toMatchObject({ at: 'seymour-flux', o: { abilityId: 'fire', element: 'fire', heal: false, hitIndex: 0, targets: ['seymour-flux'] } });
    expect(typeof lands[0]!.o['action']).toBe('number');
    expect(sleeps).toContain(500);
    expect(log.indexOf('land:seymour-flux')).toBeLessThan(log.indexOf('numeral:damage'));
  });

  it('never waits longer than the cap', async () => {
    const { sleeps, play } = setup(5000);
    await play(fireOnFlux);
    expect(sleeps).toContain(SPELL_WAIT_CAP_MS);
    expect(sleeps).not.toContain(5000);
  });

  it('a heal lands too, flagged as one', async () => {
    const { lands, play } = setup(0);
    await play([
      { type: 'action-start', actorId: 'yuna', command: { kind: 'ability' } as never, abilityId: 'cure', abilityName: 'Cure', targets: ['tidus'] },
      { type: 'damage', targetId: 'tidus', sourceId: 'yuna', amount: -600, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
      { type: 'action-end', actorId: 'yuna' },
    ]);
    expect(lands[0]).toMatchObject({ at: 'tidus', o: { abilityId: 'cure', heal: true } });
  });

  it('a counter by someone else carries no ability id, and no action', async () => {
    const { lands, play } = setup(0);
    await play([
      fireOnFlux[0]!,
      { type: 'damage', targetId: 'yuna', sourceId: 'seymour-flux', amount: 300, element: 'ice', crit: false, hitIndex: 0, hitCount: 1 },
      fireOnFlux[2]!,
    ]);
    expect(lands[0]!.o['abilityId']).toBeUndefined();
    expect(lands[0]!.o['action']).toBeUndefined();
    expect(lands[0]!.o['element']).toBe('ice');
  });

  it('under ATB, a blow resolves by the action of whoever struck it, not the latest one (FFX-2)', async () => {
    const { lands, play } = setup(0);
    await play([
      { type: 'action-start', actorId: 'yuna', command: { kind: 'ability' } as never, abilityId: 'x2-black-mage-fira', abilityName: 'Fira', targets: ['seymour-flux'] },
      { type: 'action-start', actorId: 'seymour-flux', command: { kind: 'ability' } as never, abilityId: 'attack', abilityName: 'Attack', targets: ['tidus'] },
      { type: 'damage', targetId: 'seymour-flux', sourceId: 'yuna', amount: 800, element: 'fire', crit: false, hitIndex: 0, hitCount: 1 },
    ]);
    expect(lands[0]!.o['abilityId']).toBe('x2-black-mage-fira');
    expect(lands[0]!.o['targets']).toEqual(['seymour-flux']);
  });

  it('each action gets its own serial', async () => {
    const { lands, play } = setup(0);
    await play([...fireOnFlux, ...fireOnFlux]);
    expect(lands).toHaveLength(2);
    expect(lands[0]!.o['action']).not.toBe(lands[1]!.o['action']);
  });
});
