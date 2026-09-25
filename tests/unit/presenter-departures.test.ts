/**
 * Departure kinds (fix10c, presenter part 2): Evrae falls out of the sky
 * (D-031, FFX only), Leblanc, Logos and Ormi yield (D-035, FFX-2 only), every
 * other enemy is still sent in pyreflies. And none of them may hold the
 * victory event queued behind the last KO (critic round 02 #01).
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { DEPARTURE_KINDS, FALL_SHRINK_TO, departureKindOf } from '../../src/engine/BattlePresenterDepartures.ts';
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
    // + Chapter XIII's paragon and trema, held (FFX-2); + Chapter X's mortibody and Chapter I's
    // mortiorchis, returns (FFX; research/ffx-seymour-flux.md §2.2 and §4.4)
    expect(Object.keys(DEPARTURE_KINDS)).toHaveLength(15);
    expect(departureKindOf('mortibody')).toBe('returns');
    expect(departureKindOf('mortiorchis')).toBe('returns');
  });

  // Chapter VII (FFX only, AGENTS.md rule 14): D-045 the Guado Guardians yield
  // like the Syndicate; D-046 Seymour falls and stays down. Anima is recalled by
  // her battle rule, never through this table.
  it('names the Guado Guardians yields and Seymour at Macalania body; Anima keeps no kind', () => {
    expect(departureKindOf('guado-guardian-a')).toBe('yields');
    expect(departureKindOf('guado-guardian-b')).toBe('yields');
    expect(departureKindOf('seymour-macalania')).toBe('body');
    expect(departureKindOf('anima-macalania')).toBe('dissolve');
  });

  it('a Guado Guardian yields: idle, steps back and fades, never dissolved, then removed', async () => {
    const { stage, play } = setup(['guado-guardian-a', 'seymour-macalania', 'guado-guardian-b']);
    await play([{ type: 'ko', targetId: 'guado-guardian-a' }]);
    expect(stage.calls).toContain('pose=idle:guado-guardian-a');
    expect(stage.calls).toContain('moveTo:guado-guardian-a');
    expect(stage.calls).toContain('fade=0:guado-guardian-a');
    expect(stage.calls.some((c) => c.startsWith('dissolve') && c.endsWith(':guado-guardian-a'))).toBe(false);
    expect(stage.calls).toContain('remove:guado-guardian-a');
  });

  it('Seymour falls and stays down: ko pose, no dissolve, no move, never removed; victory still plays', async () => {
    const { stage, play } = setup(['seymour-macalania']);
    await play([
      { type: 'ko', targetId: 'seymour-macalania' },
      { type: 'victory' } as Unsequenced<BattleEvent>,
    ]);
    expect(stage.calls).toContain('pose=ko:seymour-macalania');
    expect(stage.calls).toContain('lieDown:seymour-macalania');
    expect(stage.calls.some((c) => c.endsWith(':seymour-macalania') && /^(dissolve|moveTo|fade)/.test(c))).toBe(false);
    expect(stage.calls).not.toContain('remove:seymour-macalania');
    expect(stage.staged()).toContain('seymour-macalania');
    expect(stage.calls).toContain('pose=victory:yuna');
  });

  it('Evrae falls: moved and faded out, never dissolved, then removed', async () => {
    const { stage, play } = setup(['evrae']);
    await play([{ type: 'ko', targetId: 'evrae' }]);
    expect(stage.calls).toContain('moveTo:evrae');
    expect(stage.calls).toContain('fade=0:evrae');
    expect(stage.calls.some((c) => c.startsWith('dissolve'))).toBe(false);
    expect(stage.calls).toContain('remove:evrae');
  });

  // Chapter VIII e2e (commit 7119762f): the fall kept full size the whole way
  // down (research `ffx-evrae-airship.md` line 889 says "a shape getting
  // smaller"). FFX only — Evrae's fall is FFX's [AGENTS.md rule 14].
  it('Evrae shrinks as it falls, and a victory queued behind it still plays', async () => {
    const { stage, play } = setup(['evrae']);
    const evrae = stage.actors.get('evrae')!;
    await play([
      { type: 'ko', targetId: 'evrae' },
      { type: 'victory' } as Unsequenced<BattleEvent>,
    ]);
    expect(evrae.scale.x).toBeLessThan(1);
    expect(evrae.scale.x).toBeCloseTo(FALL_SHRINK_TO, 5);
    expect(stage.calls).toContain('remove:evrae');
    expect(stage.calls).toContain('pose=victory:yuna');
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
