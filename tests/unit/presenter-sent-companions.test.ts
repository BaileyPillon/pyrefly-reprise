/**
 * VP-1001-28 (FFX only, Chapter I): Mortiorchis stood fully opaque through
 * Seymour Flux's death and the victory camera. The mount is one creature with
 * him (research/ffx-seymour-flux.md §5) and goes with his pyrefly dissolve.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { SENT_WITH } from '../../src/engine/SentCompanions.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup(enemies: string[]) {
  const stage = new FakeStage(['tidus', 'yuna', 'kimahri'], enemies);
  const presenter = new BattlePresenter({ stage, sleep: noSleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, play };
}

describe('a fused part is sent with its master', () => {
  it('lists only Chapter I today', () => {
    expect(SENT_WITH).toEqual({ 'seymour-flux': ['mortiorchis'] });
  });

  it('Seymour Flux dies: Mortiorchis dissolves after him and both leave before the victory', async () => {
    const { stage, play } = setup(['seymour-flux', 'mortiorchis']);
    await play([
      { type: 'ko', targetId: 'seymour-flux' },
      { type: 'victory' } as Unsequenced<BattleEvent>,
    ]);
    const dissolveFlux = stage.calls.findIndex((c) => c.startsWith('dissolve') && c.endsWith(':seymour-flux'));
    const dissolveMount = stage.calls.findIndex((c) => c.startsWith('dissolve') && c.endsWith(':mortiorchis'));
    expect(dissolveFlux).toBeGreaterThanOrEqual(0);
    expect(dissolveMount).toBeGreaterThan(dissolveFlux);
    expect(stage.calls).toContain('remove:mortiorchis');
    expect(stage.calls).toContain('remove:seymour-flux');
    expect(stage.calls.indexOf('remove:mortiorchis')).toBeLessThan(stage.calls.indexOf('pose=victory:tidus'));
    expect(stage.staged()).not.toContain('mortiorchis');
  });

  it('killing Mortiorchis alone sends nobody else', async () => {
    const { stage, play } = setup(['seymour-flux', 'mortiorchis']);
    await play([{ type: 'ko', targetId: 'mortiorchis' }]);
    expect(stage.calls.some((c) => c.startsWith('dissolve') && c.endsWith(':seymour-flux'))).toBe(false);
    expect(stage.calls).not.toContain('remove:seymour-flux');
  });

  it('a fiend with no companions dissolves alone, as before', async () => {
    const { stage, play } = setup(['dr-goon', 'fem-goon']);
    await play([{ type: 'ko', targetId: 'dr-goon' }]);
    expect(stage.calls.some((c) => c.startsWith('dissolve') && c.endsWith(':fem-goon'))).toBe(false);
  });
});
