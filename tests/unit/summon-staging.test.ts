/**
 * PR-0181 (FFX only): the summoned aeon replaces the whole party on the field, and the party comes
 * back when it leaves (research/ffx-combat-core.md §6.1, verified: 2 sources; the engine already
 * does this, `battle/ffx/aeons.ts` freezeParty / thawParty). The presenter now shows it.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';
import { statusRowIds } from '../../src/ui/ffx/fieldRows.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup() {
  const stage = new FakeStage(['tidus', 'yuna', 'kimahri'], ['seymour-flux']);
  const presenter = new BattlePresenter({ stage, sleep: noSleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  const alpha = (id: string): number => (stage.actor(id) as unknown as { alpha: number }).alpha;
  return { stage, play, alpha };
}

describe('PR-0181: summon staging', () => {
  it('the party leaves the field as the aeon arrives, at alpha 1 on the middle slot', async () => {
    const { stage, play, alpha } = setup();
    await play([{ type: 'summon', aeonId: 'bahamut', combatantId: 'bahamut', ownerId: 'yuna' }]);
    expect(stage.calls).toContain('add:bahamut=bahamut');
    expect(alpha('bahamut')).toBe(1);
    for (const id of ['tidus', 'yuna', 'kimahri']) expect(alpha(id), id).toBe(0);
    expect(alpha('seymour-flux')).toBe(1);
  });

  for (const reason of ['command', 'ko', 'banished'] as const) {
    it(`the party comes back when the aeon leaves (${reason})`, async () => {
      const { stage, play, alpha } = setup();
      await play([{ type: 'summon', aeonId: 'valefor', combatantId: 'valefor', ownerId: 'yuna' }]);
      await play([{ type: 'dismiss', combatantId: 'valefor', reason }]);
      expect(stage.calls).toContain('remove:valefor');
      for (const id of ['tidus', 'yuna', 'kimahri']) expect(alpha(id), id).toBe(1);
    });
  }
});

describe('PR-0181: the HUD rows swap to the aeon', () => {
  it("shows the aeon's row alone while it is out, the party's otherwise", () => {
    expect(statusRowIds({ activeIds: ['tidus', 'yuna', 'kimahri'], aeonId: 'bahamut' })).toEqual(['bahamut']);
    expect(statusRowIds({ activeIds: ['tidus', 'yuna', 'kimahri'], aeonId: null })).toEqual(['tidus', 'yuna', 'kimahri']);
  });
});

describe('PR-0181: nothing else brings the party back while the aeon is out', () => {
  it('heldOffStage names the party until the aeon leaves', async () => {
    const { stage, play } = setup();
    const { heldOffStage } = await import('../../src/engine/SummonStaging.ts');
    await play([{ type: 'summon', aeonId: 'ifrit', combatantId: 'ifrit', ownerId: 'yuna' }]);
    expect([...heldOffStage(stage)].sort()).toEqual(['kimahri', 'tidus', 'yuna']);
    await play([{ type: 'dismiss', combatantId: 'ifrit', reason: 'ko' }]);
    expect(heldOffStage(stage).size).toBe(0);
  });
});
