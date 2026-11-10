/**
 * PR-0181 (FFX only): the summoned aeon replaces the whole party on the field, and the party comes
 * back when it leaves (research/ffx-combat-core.md §6.1, verified: 2 sources; the engine already
 * does this, `battle/ffx/aeons.ts` freezeParty / thawParty). The presenter now shows it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { heldOffStage, partyBack, partyOffStage } from '../../src/engine/SummonStaging.ts';
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

/**
 * Test 25, second half (FFX-2 Special look, step C1; the file is FFX only, the plumbing both games and inert): the three summon functions are untouched, and the held-off set they keep is
 * still what it was. THE PIN (written in the step-0 commit, before `SummonStaging.ts` is edited): the source text of the three bodies, read from the file; the behaviour below runs the old code.
 */
describe('Special look C1: the summon functions are exactly what they were', () => {
  const source = readFileSync(resolve(__dirname, '..', '..', 'src', 'engine', 'SummonStaging.ts'), 'utf8').replace(/\r\n/g, '\n');

  it('the source text of heldOffStage, partyOffStage and partyBack is unchanged', () => {
    expect(source).toContain(
      [
        'export function heldOffStage(stage: object): ReadonlySet<CombatantId> {',
        '  return held.get(stage) ?? new Set();',
        '}',
      ].join('\n'),
    );
    expect(source).toContain(
      [
        'export async function partyOffStage(stage: BattleStage, aeonId: CombatantId, ms = PARTY_SWAP_MS): Promise<void> {',
        '  const ids = partyOnStage(stage, aeonId);',
        '  held.set(stage, new Set(ids));',
        '  await Promise.all(ids.map((id) => stage.actor(id)?.fadeTo(0, ms)));',
        '}',
      ].join('\n'),
    );
    expect(source).toContain(
      [
        'export async function partyBack(stage: BattleStage, ms = PARTY_SWAP_MS): Promise<void> {',
        '  held.delete(stage);',
        '  await Promise.all(partyOnStage(stage).map((id) => stage.actor(id)?.fadeTo(1, ms)));',
        '}',
      ].join('\n'),
    );
  });

  it('partyOffStage sets the held set BEFORE it awaits the fades, and a second call replaces the first', async () => {
    const stage = new FakeStage(['tidus', 'yuna', 'kimahri'], ['seymour-flux']);
    const release: Array<() => void> = [];
    for (const id of ['tidus', 'yuna', 'kimahri']) {
      (stage.actor(id) as unknown as { fadeTo: () => Promise<void> }).fadeTo = () => new Promise<void>((r) => release.push(r));
    }
    const pending = partyOffStage(stage, 'bahamut');
    expect([...heldOffStage(stage)].sort(), 'populated while the fades are still pending').toEqual(['kimahri', 'tidus', 'yuna']);
    const again = partyOffStage(stage, 'yuna');
    expect([...heldOffStage(stage)].sort(), 'a second call replaces the set').toEqual(['kimahri', 'tidus']);
    for (const r of release) r();
    await Promise.all([pending, again]);
  });

  it('partyBack deletes the summon set', async () => {
    const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux']);
    await partyOffStage(stage, 'bahamut', 0);
    expect(heldOffStage(stage).size).toBe(2);
    await partyBack(stage, 0);
    expect(heldOffStage(stage).size).toBe(0);
  });
});
