// @vitest-environment jsdom
/**
 * How the player's Magus Sisters (three aeons out together) and a taken aeon are shown (FFX only; the hidden Last Summoning): the stage puts each Sister on her own slot, the HUD gives each her own status row and keeps the
 * camera on all three, the preload counts all three, and Yuna's Summon list marks what Yu Yevon has taken. Every one of these folds is inert for any battle with one aeon out or none (the existing PR-0181 tests pin those).
 */
import { describe, expect, it } from 'vitest';
import type { AnyCombatant, AvailableCommand, BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { framedIds } from '../../src/ui/common/phoneFraming.ts';
import { statusRowIds } from '../../src/ui/ffx/fieldRows.ts';
import { badgeHtml, subRowVM } from '../../src/ui/ffx/commandMenuRows.ts';
import type { TopGroupRow } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { TAKEN_REASON } from '../../src/data/ffx/last-summoning-ids.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

describe('three aeons out together: the stage', () => {
  it('puts Sandy on the first slot, Cindy on the middle one and Mindy on the last (the live line’s spots, Chapter XXVII’s), and every other aeon on the middle slot', async () => {
    const stage = new FakeStage(['tidus', 'yuna', 'auron'], ['possessed-valefor']);
    const slots: Array<[string, number]> = [];
    const add = stage.addCombatant.bind(stage);
    stage.addCombatant = async (id, opts) => {
      slots.push([id, opts.slot]);
      return add(id, opts);
    };
    const presenter = new BattlePresenter({ stage, sleep: noSleep });
    const events: Array<Unsequenced<BattleEvent>> = [
      { type: 'summon', aeonId: 'cindy', combatantId: 'cindy', ownerId: 'yuna' },
      { type: 'summon', aeonId: 'sandy', combatantId: 'sandy', ownerId: 'yuna' },
      { type: 'summon', aeonId: 'mindy', combatantId: 'mindy', ownerId: 'yuna' },
    ];
    await presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(slots).toEqual([['cindy', 1], ['sandy', 0], ['mindy', 2]]);
    for (const id of ['tidus', 'yuna', 'auron']) expect((stage.actor(id) as unknown as { alpha: number }).alpha, id).toBe(0); // the party is off the field

    const single = new FakeStage(['tidus', 'yuna', 'auron'], ['possessed-valefor']);
    const seen: number[] = [];
    const addOne = single.addCombatant.bind(single);
    single.addCombatant = async (id, opts) => {
      seen.push(opts.slot);
      return addOne(id, opts);
    };
    await new BattlePresenter({ stage: single, sleep: noSleep }).play([{ type: 'summon', aeonId: 'anima', combatantId: 'anima', ownerId: 'yuna', seq: 0 } as BattleEvent]);
    expect(seen).toEqual([1]);
  });
});

describe('three aeons out together: the HUD rows and the camera', () => {
  const party = ['tidus', 'yuna', 'auron'];

  it('gives each Sister her own status row, one aeon its own alone, and the party its rows when none is out', () => {
    expect(statusRowIds({ activeIds: party, aeonId: 'cindy', aeonIds: ['cindy', 'sandy', 'mindy'] })).toEqual(['cindy', 'sandy', 'mindy']);
    expect(statusRowIds({ activeIds: party, aeonId: 'bahamut' })).toEqual(['bahamut']);
    expect(statusRowIds({ activeIds: party, aeonId: null })).toEqual(party);
    expect(statusRowIds({ activeIds: party, aeonId: null, aeonIds: [] })).toEqual(party);
  });

  const board = (extra: Partial<BattleState>): BattleState =>
    ({
      game: 'ffx',
      activeIds: party,
      enemyIds: ['possessed-valefor'],
      combatants: { 'possessed-valefor': { hp: 10, flags: {} } as unknown as AnyCombatant },
      flags: {},
      ...extra,
    }) as unknown as BattleState;

  it('keeps the camera on all three Sisters while they stand in for the party', () => {
    const ids = framedIds(board({ aeonId: 'cindy', aeonIds: ['cindy', 'sandy', 'mindy'] }), 'cindy').map(([id]) => id);
    expect(ids).toEqual(['cindy', 'sandy', 'mindy', 'possessed-valefor']);
    expect(framedIds(board({ aeonId: 'bahamut' }), 'bahamut').map(([id]) => id)).toEqual(['bahamut', 'possessed-valefor']);
    expect(framedIds(board({ aeonId: null }), 'tidus').map(([id]) => id)).toEqual([...party, 'possessed-valefor']);
  });
});

describe('Yuna’s Summon list marks what Yu Yevon has taken', () => {
  const group = { kind: 'group', label: 'Summon', category: 'summon', role: 'normal', items: [] } as unknown as TopGroupRow;
  const summon = (label: string, enabled: boolean, disabledReason?: string): AvailableCommand =>
    ({ command: { kind: 'summon', id: label.toLowerCase(), targets: [] }, label, category: 'summon', mpCost: 0, enabled, ...(disabledReason ? { disabledReason } : {}), validTargets: [] }) as AvailableCommand;

  it('shows TAKEN on a greyed row whose reason is Yu Yevon’s, and nothing on a held aeon', () => {
    const taken = subRowVM(summon('Valefor', false, TAKEN_REASON), group, {});
    expect(taken.badge).toEqual({ kind: 'taken', text: 'TAKEN' });
    expect(badgeHtml(taken.badge)).toContain('ffx-cmd__badge--taken');
    expect(badgeHtml(taken.badge)).toContain('TAKEN');
    expect(subRowVM(summon('Ifrit', true), group, {}).badge).toBeUndefined();
  });

  it('leaves every other greyed row as it was: Chapter XIV’s mirror lock, a Silenced spell, a row with no reason', () => {
    expect(subRowVM(summon('Valefor', false, 'Mirror of Grothia'), group, {}).badge).toBeUndefined();
    expect(subRowVM(summon('Valefor', false), group, {}).badge).toBeUndefined();
    const spell = { command: { kind: 'ability', id: 'firaga', targets: [] }, label: 'Firaga', category: 'blackmagic', mpCost: 30, enabled: false, disabledReason: TAKEN_REASON, validTargets: [] } as unknown as AvailableCommand;
    expect(subRowVM(spell, group, {}).badge).toEqual({ kind: 'mp', text: '30' }); // only a Summon row carries the mark
  });
});
