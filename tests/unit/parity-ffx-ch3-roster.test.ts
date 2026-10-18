/**
 * **Chapter III's roster removal** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; switch `CH3_ROSTER_REMOVAL`, default OFF; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`).
 *
 * The game (`FFX-G11c` section 7, `research/re-ffx-last-summoning.md` sections 2 and 5): the field event `sins0700` removes the chosen aeon from the party (removePartyMember, call 0xCB)
 * **before** it launches that aeon's possession battle, so in every later battle the aeon has no record and is absent from Yuna's Summon list and Grand Summon's picker; with none left the
 * Summon and Grand Summon openers are drawn greyed (-3).
 *
 * 1. **A model of the game**, written from the note's table with no import from the engine: the aeons on the list in each of our fixed links.
 * 2. **The data**: exactly Chapter III's six later links carry \`rosterRemoved\`, equal to the model; the hidden Last Summoning's groups carry none.
 * 3. **Switch OFF**: the field is inert (all five aeons in every link, no flag written, a link played with the field taken off is identical event for event).
 * 4. **Switch ON**: each link's lists equal the model (Summon rows, the picker, Grand Summon's row), a submitted Summon or Grand Summon that names a removed aeon is refused with no event and the turn
 *    kept open, another aeon still comes, a fork sees the same, and every combination with the script lock \`SCRIPT_COMMAND_DISABLES\` shows what the plan's table says (the roster removal wins).
 * 5. **The hidden Last Summoning** is the same removal by another mechanism and does not move with the switch.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleSetup, Command, Decision, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { grandSummonEntries } from '../../src/battle/ffx/pickerParams.ts';
import { availableAeons } from '../../src/battle/ffx/aeons.ts';
import { defaultGrandSummonAeon, grandSummonChoices } from '../../src/battle/ffx/aeon-duel.ts';
import { commandRefused, setScriptCommandDisables } from '../../src/battle/ffx/formation-commands.ts';
import { CH3_ROSTER_REMOVAL, ROSTER_REMOVED_PREFIX, aeonRosterRemoved, rosterEmptied, setCh3RosterRemoval } from '../../src/battle/ffx/roster-removal.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { lastSummoningGroup } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { OFFERING_KEYS, type OfferingKey, linkGroupId, yuYevonGroupId } from '../../src/data/ffx/last-summoning-ids.ts';
import { firstLinkSetup, newEngine as newLastSummoningEngine, playOrder } from './helpers/lastSummoningDrive.ts';
import { onLastSummoningBoard } from '../../src/engine/tactics/lookup.ts';
import { MENU_DRAW_PARITY, setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import { TAKEN_REASON } from '../../src/data/ffx/last-summoning-ids.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

// ---------------------------------------------------------------------------------------------------------------------- 1. the model of the game (no engine import)

/** The five aeons of the build in Yuna's list order, and Chapter III's links in the fixed chain (D-651): each possessed copy is the aeon of the same place. */
const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] as const;
const LINKS = ['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'yu-yevon'] as const;
const LABEL: Readonly<Record<string, string>> = { valefor: 'Valefor', ifrit: 'Ifrit', ixion: 'Ixion', shiva: 'Shiva', bahamut: 'Bahamut' };

/** `FFX-G11c` section 7's table: the event removes the link's aeon (and every earlier link's) before the fight; Yu Yevon comes after all five. */
function modelRemoved(linkIndex: number): string[] {
  return AEONS.slice(0, Math.min(linkIndex + 1, AEONS.length)) as unknown as string[];
}
const modelList = (linkIndex: number): string[] => AEONS.filter((a) => !modelRemoved(linkIndex).includes(a));

describe('the model of the game: what Yuna may summon in each of our links', () => {
  it('Ifrit, Ixion, Shiva, Bahamut in link 2; Ixion, Shiva, Bahamut in link 3; Shiva, Bahamut in link 4; Bahamut in link 5; none in link 6 and against Yu Yevon', () => {
    expect(modelList(0)).toEqual(['ifrit', 'ixion', 'shiva', 'bahamut']);
    expect(modelList(1)).toEqual(['ixion', 'shiva', 'bahamut']);
    expect(modelList(2)).toEqual(['shiva', 'bahamut']);
    expect(modelList(3)).toEqual(['bahamut']);
    expect(modelList(4)).toEqual([]);
    expect(modelList(5)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- helpers

const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
const defend = (): Command => ({ kind: 'defend', targets: [] });
const grand = (aeonId: string): Command => ({ kind: 'overdrive', id: 'grand-summon', targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId } } }) as Command;

function engineAt(group: EnemyGroupDef, seed = 1): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}
const linkEngine = (id: string, seed = 1): BattleEngine => engineAt(ENEMY_GROUPS_BY_ID[id]!, seed);

/** Pass every other turn with Defend until it is Yuna's; returns that decision. */
function turnOf(engine: BattleEngine, who = 'yuna'): Input {
  for (let i = 0; i < 400; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('the battle ended before ' + who + "'s turn");
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    engine.submit(defend());
  }
  throw new Error('no turn of ' + who);
}

const summonRows = (d: Input): AvailableCommand[] => d.commands.filter((c) => c.command.kind === 'summon');
const labelsOf = (d: Input): string[] => summonRows(d).map((r) => r.label);
const grandRow = (d: Input): AvailableCommand | undefined => d.commands.find((c) => c.command.kind === 'overdrive' && c.label === 'Grand Summon');
const yunaOf = (engine: BattleEngine): FFXCombatant => engine.state().combatants['yuna'] as FFXCombatant;
const flagKeys = (engine: BattleEngine): string[] => Object.keys(engine.state().flags).filter((k) => k.startsWith(ROSTER_REMOVED_PREFIX));

/** Yuna's turn with a full Overdrive gauge, so Grand Summon's row is on the menu. */
function fullGaugeTurn(engine: BattleEngine): Input {
  turnOf(engine);
  yunaOf(engine).overdrive!.gauge = 100;
  const d = engine.nextDecision();
  if (d.kind !== 'player-input') throw new Error('Yuna lost her turn');
  return d;
}

let restore: Array<() => void> = [];
afterEach(() => {
  for (const r of restore.reverse()) r();
  restore = [];
});
const rosterOn = (): void => void restore.push(setCh3RosterRemoval(true));
const scriptOn = (): void => void restore.push(setScriptCommandDisables(true));

// ---------------------------------------------------------------------------------------------------------------------- 2. the data

describe('the data: which groups carry the field', () => {
  it('Chapter III\'s six later links carry exactly the model; no other group of the game carries it', () => {
    LINKS.forEach((id, i) => {
      expect(ENEMY_GROUPS_BY_ID[id]!.rosterRemoved, id).toEqual(modelRemoved(i));
    });
    const carriers = Object.values(ENEMY_GROUPS_BY_ID).filter((g) => g.rosterRemoved !== undefined).map((g) => g.id);
    expect(carriers.sort()).toEqual([...LINKS].sort());
    expect(ENEMY_GROUPS_BY_ID['braskas-final-aeon']!.rosterRemoved).toBeUndefined(); // link 1: nothing is removed yet
  });

  it('the hidden Last Summoning builds its groups on its own and carries none (its removal is the lock, with the words)', () => {
    const order: OfferingKey[] = [...OFFERING_KEYS];
    const ids = [linkGroupId(['valefor']), linkGroupId(order.slice(0, 3)), linkGroupId(order), yuYevonGroupId(order), 'last-summoning:open'];
    for (const id of ids) {
      const g = lastSummoningGroup(id);
      expect(g, id).not.toBeNull();
      expect(g!.rosterRemoved, id).toBeUndefined();
    }
    for (const lock of lastSummoningGroup(linkGroupId(['valefor', 'ifrit']))!.lockedAeons ?? []) expect(lock.removed).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- 3. switch off

describe('the switch is off, and off the field is inert', () => {
  it('CH3_ROSTER_REMOVAL.on is false, no flag is written, and every later link lists all five aeons enabled in the Summon list and the picker', () => {
    expect(CH3_ROSTER_REMOVAL.on).toBe(false);
    for (const link of LINKS) {
      const engine = linkEngine(link);
      const d = turnOf(engine);
      expect(labelsOf(d), link).toEqual(AEONS.map((a) => LABEL[a]));
      expect(summonRows(d).every((r) => r.enabled), link).toBe(true);
      expect(grandSummonEntries(ctxOf(engine)).map((e) => e.id), link).toEqual([...AEONS]);
      expect(flagKeys(engine), link).toEqual([]);
      expect(rosterEmptied(ctxOf(engine)), link).toBe(false);
    }
  });

  it('a link played with the field taken off its group is identical to the shipped link, event for event', () => {
    for (const link of LINKS) {
      const shipped = ENEMY_GROUPS_BY_ID[link]!;
      const { rosterRemoved: _taken, ...stripped } = shipped;
      void _taken;
      const play = (g: EnemyGroupDef): string => {
        const engine = engineAt(g, 7);
        for (let i = 0; i < 160; i += 1) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') break;
          if (d.kind !== 'player-input') continue;
          const row = d.commands.find((c) => c.enabled && c.command.kind === 'summon') ?? d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled)!;
          engine.submit({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command);
        }
        return JSON.stringify(engine.state().log);
      };
      expect(play(stripped as EnemyGroupDef), link).toBe(play(shipped));
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------- 4. switch on

describe('the switch is on: the aeons the event removed are absent from the later links', () => {
  it('each link\'s Summon rows and Grand Summon picker are the model\'s list, enabled, in the list\'s order; no row is greyed and none says why', () => {
    rosterOn();
    LINKS.forEach((link, i) => {
      const engine = linkEngine(link);
      const d = turnOf(engine);
      expect(labelsOf(d), link).toEqual(modelList(i).map((a) => LABEL[a]));
      for (const r of summonRows(d)) {
        expect(r.enabled, `${link} ${r.label}`).toBe(true);
        expect(r.disabledReason, `${link} ${r.label}`).toBeUndefined();
      }
      const entries = grandSummonEntries(ctxOf(engine));
      expect(entries.map((e) => e.id), link).toEqual(modelList(i));
      expect(entries.every((e) => e.enabled === undefined), link).toBe(true);
      expect(grandSummonChoices(ctxOf(engine)), link).toEqual(modelList(i));
      expect(availableAeons(ctxOf(engine)).map((a) => a.id), link).toEqual(modelList(i));
      expect(flagKeys(engine), link).toEqual(modelRemoved(i).map((a) => ROSTER_REMOVED_PREFIX + a));
    });
  });

  it('the removed aeons stay in the roster (the possessed copy\'s stats are read from it): nothing is deleted, only left off the lists', () => {
    rosterOn();
    const engine = linkEngine('possessed-shiva');
    turnOf(engine);
    const ctx = ctxOf(engine);
    expect([...ctx.rt.aeonRoster.keys()]).toEqual([...AEONS]);
    for (const a of ['valefor', 'ifrit', 'ixion', 'shiva']) expect(aeonRosterRemoved(ctx, a), a).toBe(true);
    expect(aeonRosterRemoved(ctx, 'bahamut')).toBe(false);
  });

  it('a submitted Summon of the link\'s own aeon, or of an earlier link\'s, is refused with no event and the turn kept open; a Summon of an aeon still held comes', () => {
    rosterOn();
    for (const [i, link] of LINKS.slice(0, 4).entries()) {
      const engine = linkEngine(link);
      const d = turnOf(engine);
      for (const gone of modelRemoved(i)) {
        expect(engine.submit({ kind: 'summon', id: gone, targets: [] } as Command), `${link} ${gone}`).toEqual([]);
        const again = engine.nextDecision();
        expect(again.kind, `${link} ${gone}`).toBe('player-input');
        expect((again as Input).actorId, `${link} ${gone}`).toBe('yuna');
        expect(labelsOf(again as Input), `${link} ${gone}`).toEqual(labelsOf(d));
      }
      const held = modelList(i)[0]!;
      const events = engine.submit({ kind: 'summon', id: held, targets: [] } as Command);
      expect(events.some((e) => e.type === 'summon' && (e as { aeonId?: string }).aeonId === held), link).toBe(true);
    }
  });

  it('the pure rule: a Grand Summon naming a removed aeon is refused, one naming a held aeon (or none yet) is not', () => {
    rosterOn();
    const engine = linkEngine('possessed-ixion');
    turnOf(engine);
    const ctx = ctxOf(engine);
    const yuna = yunaOf(engine);
    for (const gone of ['valefor', 'ifrit', 'ixion']) expect(commandRefused(ctx, yuna, grand(gone)), gone).toBe(true);
    for (const held of ['shiva', 'bahamut', '']) expect(commandRefused(ctx, yuna, grand(held)), held).toBe(false);
    expect(commandRefused(ctx, yuna, { kind: 'summon', id: 'valefor', targets: [] } as Command)).toBe(true);
    expect(commandRefused(ctx, yuna, { kind: 'summon', id: 'bahamut', targets: [] } as Command)).toBe(false);
    expect(defaultGrandSummonAeon(ctx)).toBe('shiva'); // the headless roll lands on a held aeon
  });

  it('a Grand Summon through the engine: a removed aeon is refused and keeps the gauge, a held one comes', () => {
    rosterOn();
    const engine = linkEngine('possessed-ifrit');
    fullGaugeTurn(engine);
    expect(engine.submit(grand('valefor'))).toEqual([]);
    expect(yunaOf(engine).overdrive!.gauge).toBe(100);
    const events = engine.submit(grand('bahamut'));
    expect(events.some((e) => e.type === 'summon' && (e as { aeonId?: string }).aeonId === 'bahamut')).toBe(true);
    expect(yunaOf(engine).overdrive!.gauge).toBe(0);
  });

  it('with no aeon left (link 6 and Yu Yevon) there is no Summon row and Grand Summon is a greyed row that a submit refuses; the picker is empty', () => {
    rosterOn();
    for (const link of ['possessed-bahamut', 'yu-yevon']) {
      const engine = linkEngine(link);
      const d = fullGaugeTurn(engine);
      expect(summonRows(d), link).toEqual([]);
      const row = grandRow(d);
      expect(row, link).toBeDefined();
      expect(row!.enabled, link).toBe(false);
      expect(row!.disabledReason, link).toBeUndefined();
      expect(rosterEmptied(ctxOf(engine)), link).toBe(true);
      expect(grandSummonEntries(ctxOf(engine)), link).toEqual([]);
      expect(engine.submit({ ...row!.command, targets: [] } as Command), link).toEqual([]);
      expect(engine.submit(grand('')), link).toEqual([]);
      expect(yunaOf(engine).overdrive!.gauge, link).toBe(100);
    }
  });

  it('Grand Summon is an enabled row whenever an aeon is left (link 5 has Bahamut)', () => {
    rosterOn();
    const d = fullGaugeTurn(linkEngine('possessed-shiva'));
    expect(grandRow(d)!.enabled).toBe(true);
  });

  it('a fork of the battle sees the same lists (the flags live in state.flags)', () => {
    rosterOn();
    const engine = linkEngine('possessed-ixion');
    const fork = (engine as unknown as { fork: (seed: number) => BattleEngine }).fork(99);
    expect(labelsOf(turnOf(fork))).toEqual(['Shiva', 'Bahamut']);
    expect(labelsOf(turnOf(engine))).toEqual(['Shiva', 'Bahamut']);
  });

  it('the rest of the menu is untouched: the same non-Summon rows in the same order', () => {
    const off = turnOf(linkEngine('possessed-ifrit'));
    rosterOn();
    const on = turnOf(linkEngine('possessed-ifrit'));
    const strip = (rows: AvailableCommand[]): string[] => rows.filter((r) => r.command.kind !== 'summon').map((r) => `${r.command.kind}:${r.label}:${r.enabled}`);
    expect(strip(on.commands)).toEqual(strip(off.commands));
  });

  it('the real chain carries the field: a link set up the way the chain loop sets it (setupForNextLink) lists the model\'s aeons', () => {
    rosterOn();
    const firstEngine = linkEngine('braskas-final-aeon');
    const setup: BattleSetup = { game: 'ffx', party: dreamsEndBuild, enemies: ENEMY_GROUPS_BY_ID['braskas-final-aeon']!, triggers: [], seed: 1, condition: 'normal', canEscape: false };
    // every aeon alive and recovered, as a route that holds them back reaches the next link
    const next = setupForNextLink(setup, ENEMY_GROUPS_BY_ID['possessed-ifrit']!, firstEngine.state(), 2);
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({ ...setup, ...next });
    expect(labelsOf(turnOf(engine))).toEqual(['Ixion', 'Shiva', 'Bahamut']);
  });
});

describe('the two switches together: what a player sees in each link', () => {
  const seen = (link: string): string[] => {
    const engine = linkEngine(link);
    const d = turnOf(engine);
    const rows = summonRows(d).map((r) => `${r.label}${r.enabled ? '' : '(grey)'}`);
    const picker = grandSummonEntries(ctxOf(engine)).map((e) => `${e.id}${e.enabled === false ? '(grey)' : ''}`);
    return [rows.join(','), picker.join(',')];
  };

  it('R off, S off: all five; R off, S on: the copy\'s own aeon greyed with no reason and four enabled', () => {
    for (const link of LINKS) {
      const all = AEONS.map((a) => LABEL[a]).join(',');
      expect(seen(link)[0], link).toBe(all);
    }
    scriptOn();
    LINKS.slice(0, 5).forEach((link, i) => {
      const expected = AEONS.map((a, j) => `${LABEL[a]}${j === i ? '(grey)' : ''}`).join(',');
      expect(seen(link)[0], link).toBe(expected);
    });
    expect(seen('yu-yevon')[0]).toBe(AEONS.map((a) => LABEL[a]).join(',')); // no script lock in his fight
  });

  it('R on, with S off or on: the same lists, the removal wins and the script lock adds nothing', () => {
    rosterOn();
    const withoutS = LINKS.map((l) => seen(l));
    scriptOn();
    const withS = LINKS.map((l) => seen(l));
    expect(withS).toEqual(withoutS);
    expect(withoutS.map((s) => s[0])).toEqual(LINKS.map((_, i) => modelList(i).map((a) => LABEL[a]).join(',')));
  });
});

// ---------------------------------------------------------------------------------------------------------------------- 5. the hidden Last Summoning does not move with the switch

describe('the hidden Last Summoning is the same removal by another mechanism and does not move with the switch', () => {
  it('three links, same seeds: the event logs are identical off and on', async () => {
    const run = async (): Promise<string[]> => {
      const r = await playOrder(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters'], 3, { stopAfter: 3 });
      return r.links.map((l) => `${l.group}:${l.outcome}:${l.turns}:${l.ticks}:${l.summoned.join(',')}`);
    };
    const off = await run();
    rosterOn();
    const on = await run();
    expect(on).toEqual(off);
    expect(on.length).toBe(3);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------------- 6. MENU_DRAW_PARITY, item summon: the hidden Last Summoning shows no row for an aeon the event removed

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
