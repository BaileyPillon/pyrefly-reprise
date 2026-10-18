/**
 * **MENU_DRAW_PARITY, item `summon`: the hidden Last Summoning shows no row for an aeon the event removed** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; default OFF; handoff
 * `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`; the Chapter III half is `parity-ffx-ch3-roster.test.ts`). The locks of the Last Summoning's links stand for aeons the field event took out of the party
 * (`lockedAeons[].removed`); with the item on the Summon list builds no row for them, where it drew a greyed "Taken by Yu Yevon" row. The lock, the legality, the flags the board test reads and the
 * switch-off path are unchanged.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleSetup, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { grandSummonEntries } from '../../src/battle/ffx/pickerParams.ts';
import { defaultGrandSummonAeon } from '../../src/battle/ffx/aeon-duel.ts';
import { setCh3RosterRemoval } from '../../src/battle/ffx/roster-removal.ts';
import { MENU_DRAW_PARITY, setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { lastSummoningGroup } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { OFFERING_KEYS, type OfferingKey, TAKEN_REASON, yuYevonGroupId } from '../../src/data/ffx/last-summoning-ids.ts';
import { onLastSummoningBoard } from '../../src/engine/tactics/lookup.ts';
import { firstLinkSetup, newEngine as newLastSummoningEngine, playOrder } from './helpers/lastSummoningDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const LINKS = ['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'yu-yevon'] as const;
const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
const linkEngine = (id: string, seed = 1): BattleEngine => {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: ENEMY_GROUPS_BY_ID[id]!, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
};

/** Pass every other turn with Defend until it is Yuna's; returns that decision. */
function turnOf(engine: BattleEngine, who = 'yuna'): Input {
  for (let i = 0; i < 400; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('the battle ended before ' + who + "'s turn");
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no turn of ' + who);
}
const summonRows = (d: Input): AvailableCommand[] => d.commands.filter((c) => c.command.kind === 'summon');

let restore: Array<() => void> = [];
afterEach(() => {
  for (const r of restore.reverse()) r();
  restore = [];
});

describe('MENU_DRAW_PARITY (summon): a removed aeon of the hidden Last Summoning has no row; the lock, the legality and the board test are unchanged', () => {
  const ALL: OfferingKey[] = [...OFFERING_KEYS];
  const rowsOf = (engine: BattleEngine): AvailableCommand[] => summonRows(turnOf(engine));
  const parityOn = (skip: Parameters<typeof setMenuDrawParity>[1] = []): void => void restore.push(setMenuDrawParity(true, skip));

  it('off (ships): the taken aeon is a greyed row that says "Taken by Yu Yevon"; on: the row is gone, the others are as before', async () => {
    expect(MENU_DRAW_PARITY.on).toBe(false);
    const { setup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
    const off = rowsOf(newLastSummoningEngine(setup));
    const taken = off.find((r) => r.label === 'Valefor')!;
    expect([taken.enabled, taken.disabledReason]).toEqual([false, TAKEN_REASON]);
    parityOn();
    const on = rowsOf(newLastSummoningEngine(setup));
    expect(on.map((r) => r.label)).toEqual(off.filter((r) => r.label !== 'Valefor').map((r) => r.label));
    for (const r of on) expect([r.label, r.enabled, r.disabledReason]).toEqual([r.label, off.find((o) => o.label === r.label)!.enabled, off.find((o) => o.label === r.label)!.disabledReason]);
  });

  it('with every aeon taken (the Yu Yevon link) there is no Summon row on; off, every aeon is a greyed "Taken by Yu Yevon" row', async () => {
    const { setup } = await firstLinkSetup(['valefor'], 3);
    const yuLink: BattleSetup = { ...setup, enemies: lastSummoningGroup(yuYevonGroupId(ALL))! };
    const off = rowsOf(newLastSummoningEngine(yuLink));
    expect(off.length).toBeGreaterThan(0);
    expect(off.every((r) => !r.enabled && r.disabledReason === TAKEN_REASON)).toBe(true);
    parityOn();
    expect(rowsOf(newLastSummoningEngine(yuLink))).toEqual([]);
  });

  it('the board is still the Last Summoning board on and off (the locks flags tell it, never a row), and Chapter III never looks like it with every switch on', async () => {
    parityOn();
    restore.push(setCh3RosterRemoval(true));
    const { setup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
    const board = newLastSummoningEngine(setup);
    turnOf(board);
    expect(onLastSummoningBoard(board.state())).toBe(true);
    for (const link of LINKS) {
      const engine = linkEngine(link);
      turnOf(engine);
      expect(onLastSummoningBoard(engine.state()), link).toBe(false);
    }
  });

  it('legality is unchanged: a Summon naming the taken aeon, the picker and the default roll are the same on and off', async () => {
    const { setup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
    const probe = (): string => {
      const engine = newLastSummoningEngine(setup);
      turnOf(engine);
      const refused = engine.submit({ kind: 'summon', id: 'valefor', targets: [] } as Command);
      const picker = grandSummonEntries(ctxOf(engine)).map((e) => `${e.id}:${e.enabled}`);
      return JSON.stringify({ refused, picker, roll: defaultGrandSummonAeon(ctxOf(engine)), again: engine.nextDecision().kind });
    };
    const off = probe();
    parityOn();
    expect(probe()).toBe(off);
    expect(JSON.parse(off).refused.map((e: { type: string; text?: string }) => e.type + ':' + e.text)).toEqual(['message:Taken by Yu Yevon']); // the executor's refusal, in the lock's words, on and off alike
  });

  it('three links, same seeds: the event logs are identical off and on', async () => {
    const run = async (): Promise<string[]> => {
      const r = await playOrder(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters'], 3, { stopAfter: 3 });
      return r.links.map((l) => `${l.group}:${l.outcome}:${l.turns}:${l.ticks}:${l.summoned.join(',')}`);
    };
    const off = await run();
    parityOn();
    expect(await run()).toEqual(off);
  }, 120_000);

  it('skip "summon" leaves the row as it was', async () => {
    parityOn(['summon']);
    const { setup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
    expect(rowsOf(newLastSummoningEngine(setup)).find((r) => r.label === 'Valefor')!.disabledReason).toBe(TAKEN_REASON);
  });
});
