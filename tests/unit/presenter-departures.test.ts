/**
 * Departure kinds (fix10c, presenter part 2): Evrae falls out of the sky
 * (D-031, FFX only), Leblanc, Logos and Ormi yield (D-035, FFX-2 only), every
 * other enemy is still sent in pyreflies. And none of them may hold the
 * victory event queued behind the last KO (critic round 02 #01).
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { DEPARTURE_KINDS, departureKindOf } from '../../src/engine/BattlePresenterDepartures.ts';
import { fallVeilAmount } from '../../src/scenes/evrae-airship-fall.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup(enemies: string[]) {
  const stage = new FakeStage(['yuna', 'rikku'], enemies);
  const presenter = new BattlePresenter({ stage, sleep: noSleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, play };
}

describe('departure kinds', () => {
  it('names Evrae falls-away and every Syndicate copy yields; everyone else dissolves', () => {
    expect(departureKindOf('evrae')).toBe('falls-away');
    for (const id of ['leblanc', 'logos', 'ormi', 'ormi-entrance', 'ormi-logos-room', 'logos-room']) {
      expect(departureKindOf(id)).toBe('yields');
    }
    for (const id of ['dr-goon', 'fem-goon', 'seymour-flux', 'cid', 'yunalesca']) {
      expect(departureKindOf(id)).toBe('dissolve');
    }
    expect(Object.keys(DEPARTURE_KINDS)).toHaveLength(7);
  });

  it('Evrae falls: moved and faded out, never dissolved, then removed', async () => {
    const { stage, play } = setup(['evrae']);
    await play([{ type: 'ko', targetId: 'evrae' }]);
    expect(stage.calls).toContain('moveTo:evrae');
    expect(stage.calls).toContain('fade=0:evrae');
    expect(stage.calls.some((c) => c.startsWith('dissolve'))).toBe(false);
    expect(stage.calls).toContain('remove:evrae');
  });

  it('Ormi yields: stands in idle, steps back and fades, never dissolved', async () => {
    const { stage, play } = setup(['ormi', 'dr-goon']);
    await play([{ type: 'ko', targetId: 'ormi' }]);
    expect(stage.calls).toContain('pose=idle:ormi');
    expect(stage.calls).toContain('moveTo:ormi');
    expect(stage.calls).toContain('fade=0:ormi');
    expect(stage.calls.some((c) => c.startsWith('dissolve') && c.endsWith(':ormi'))).toBe(false);
    expect(stage.calls).toContain('remove:ormi');
  });

  it('a Goon beside them is still sent in pyreflies', async () => {
    const { stage, play } = setup(['ormi', 'dr-goon']);
    await play([{ type: 'ko', targetId: 'dr-goon' }]);
    expect(stage.calls).toContain('dissolve=1:dr-goon');
    expect(stage.calls).toContain('remove:dr-goon');
  });

  it('the victory queued behind the last departure still plays', async () => {
    const { stage, play } = setup(['leblanc']);
    await play([
      { type: 'ko', targetId: 'leblanc' },
      { type: 'victory' } as Unsequenced<BattleEvent>,
    ]);
    expect(stage.calls).toContain('remove:leblanc');
    expect(stage.calls).toContain('pose=victory:yuna');
  });
});

describe('the cloud Evrae falls through', () => {
  it('is absent while Evrae holds its spot and full once it has dropped', () => {
    expect(fallVeilAmount(0)).toBe(0);
    expect(fallVeilAmount(0.2)).toBe(0);
    expect(fallVeilAmount(-3)).toBe(0);
    expect(fallVeilAmount(1)).toBeGreaterThan(0);
    expect(fallVeilAmount(3)).toBe(1);
  });
});
