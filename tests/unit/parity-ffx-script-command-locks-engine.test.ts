/**
 * **The monster-script locks on the engine** (re-parity RC10, lane "FFX script command locks"; **FFX only**; the model of the game and the data are
 * `parity-ffx-script-command-locks.test.ts`; the handoff is `docs/handoff/re-parity-rc10-ffx-script-command-locks.md`).
 *
 * Chapter III's five possession links are the only shipped fights that reach a monster script's lock: each possessed copy takes its own aeon from Yuna
 * (`setCommandDisabled(1, <the aeon's id>, 0)` at its init). The switch `SCRIPT_COMMAND_DISABLES` is **off**; so this file proves both states:
 *
 * - **Off** (the shipped state): the field is inert. Yuna's menu in each link holds all five aeons, the Grand Summon picker lists all five, and a link played with the field
 *   taken off the group is identical, event for event, to the shipped one.
 * - **On**: in each link the copy's own aeon is not on Yuna's Summon list (the row is not built), is not a Grand Summon choice, and a submitted Summon of it (or a Grand Summon that names it) is
 *   refused with the turn kept open; every other aeon is as before; a fork sees the same; the Last Summoning (which locks the same aeon with `lockedAeons`) is identical in both states.
 * - **A 0x3xxx row** (no shipped fight reaches one; the other eight scripts are in fights no chapter fights) sets the same flags a formation's row sets: a synthetic group shows it.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleEvent, Command, Decision, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { grandSummonEntries } from '../../src/battle/ffx/pickerParams.ts';
import { SCRIPT_COMMAND_DISABLES, commandRefused, menuCommandOf, setScriptCommandDisables } from '../../src/battle/ffx/formation-commands.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { firstLinkSetup, newEngine as newLastSummoningEngine, playOrder } from './helpers/lastSummoningDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const LINKS = ['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut'] as const;
/** The aeon each link's copy is, in Yuna's Summon list order. */
const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] as const;
const LABEL: Readonly<Record<string, string>> = { valefor: 'Valefor', ifrit: 'Ifrit', ixion: 'Ixion', shiva: 'Shiva', bahamut: 'Bahamut' };

const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
const defend = (): Command => ({ kind: 'defend', targets: [] });

function engineAt(group: EnemyGroupDef, seed = 1): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}
const linkEngine = (id: string, seed = 1): BattleEngine => engineAt(ENEMY_GROUPS_BY_ID[id]!, seed);

/** Pass every other turn with Defend until it is Yuna's (or `who`'s); returns that decision. */
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
const yunaOf = (engine: BattleEngine): FFXCombatant => engine.state().combatants['yuna'] as FFXCombatant;

let restore: (() => void) | undefined;
afterEach(() => {
  restore?.();
  restore = undefined;
});

describe('the switch is off, and off the field is inert', () => {
  it('SCRIPT_COMMAND_DISABLES.on is false', () => {
    expect(SCRIPT_COMMAND_DISABLES.on).toBe(false);
  });

  it('in each of the five links Yuna\'s Summon list is all five aeons, enabled, and so is the Grand Summon picker', () => {
    for (const link of LINKS) {
      const engine = linkEngine(link);
      const d = turnOf(engine);
      expect(labelsOf(d), link).toEqual(AEONS.map((a) => LABEL[a]));
      expect(summonRows(d).every((r) => r.enabled), link).toBe(true);
      expect(grandSummonEntries(ctxOf(engine)).map((e) => e.id), link).toEqual([...AEONS]);
    }
  });

  it('a link played with the field taken off its group is identical to the shipped link, event for event', () => {
    for (const link of LINKS) {
      const shipped = ENEMY_GROUPS_BY_ID[link]!;
      expect(shipped.scriptCommandDisables, link).toBeDefined();
      const { scriptCommandDisables: _taken, ...stripped } = shipped;
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

describe('the switch is on: each possessed copy takes its own aeon from Yuna', () => {
  it('in each link the copy\'s aeon is not on the Summon list or in the Grand Summon picker, and the other four are', () => {
    restore = setScriptCommandDisables(true);
    for (const [i, link] of LINKS.entries()) {
      const engine = linkEngine(link);
      const d = turnOf(engine);
      const others = AEONS.filter((_, j) => j !== i);
      expect(labelsOf(d), link).toEqual(others.map((a) => LABEL[a]));
      expect(summonRows(d).every((r) => r.enabled), link).toBe(true);
      expect(grandSummonEntries(ctxOf(engine)).map((e) => e.id), link).toEqual(others);
    }
  });

  it('a submitted Summon of the copy\'s aeon is refused with no event and the turn kept open; another aeon still comes', () => {
    restore = setScriptCommandDisables(true);
    for (const [i, link] of LINKS.entries()) {
      const engine = linkEngine(link);
      const d = turnOf(engine);
      const own = AEONS[i]!;
      expect(engine.submit({ kind: 'summon', id: own, targets: [] } as Command), link).toEqual([]);
      const again = engine.nextDecision();
      expect(again.kind, link).toBe('player-input');
      expect((again as Input).actorId, link).toBe('yuna');
      expect(labelsOf(again as Input), link).toEqual(labelsOf(d));
      const other = AEONS[(i + 1) % AEONS.length]!;
      const events: BattleEvent[] = engine.submit({ kind: 'summon', id: other, targets: [] } as Command);
      expect(events.some((e) => e.type === 'summon' && (e as { aeonId?: string }).aeonId === other), link).toBe(true);
    }
  });

  it('the pure rule: a Grand Summon that names the copy\'s aeon is refused, one that names another aeon (or none yet) is not', () => {
    restore = setScriptCommandDisables(true);
    const engine = linkEngine('possessed-ixion');
    turnOf(engine);
    const ctx = ctxOf(engine);
    const yuna = yunaOf(engine);
    const grand = (aeonId: string): Command => ({ kind: 'overdrive', id: 'grand-summon', targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId } } }) as Command;
    expect(commandRefused(ctx, yuna, grand('ixion'))).toBe(true);
    expect(commandRefused(ctx, yuna, grand('valefor'))).toBe(false);
    expect(commandRefused(ctx, yuna, grand(''))).toBe(false);
    expect(commandRefused(ctx, yuna, { kind: 'summon', id: 'ixion', targets: [] } as Command)).toBe(true);
    expect(commandRefused(ctx, yuna, { kind: 'summon', id: 'shiva', targets: [] } as Command)).toBe(false);
    expect(menuCommandOf(ctx, { kind: 'summon', id: 'ixion', targets: [] } as Command)).toBeUndefined(); // an aeon's availability, not a menu command
  });

  it('a fork of the battle sees the same list (the flags live in state.flags)', () => {
    restore = setScriptCommandDisables(true);
    const engine = linkEngine('possessed-shiva');
    const fork = (engine as unknown as { fork: (seed: number) => BattleEngine }).fork(99);
    const d = turnOf(engine);
    const fd = turnOf(fork);
    expect(labelsOf(fd)).toEqual(labelsOf(d));
    expect(labelsOf(fd)).not.toContain('Shiva');
  });

  it('an aeon that is out already and the rest of the menu are untouched: Yuna keeps Summon, Grand Summon, Attack and Defend, only the one row is gone', () => {
    const off = turnOf(linkEngine('possessed-ifrit'));
    restore = setScriptCommandDisables(true);
    const on = turnOf(linkEngine('possessed-ifrit'));
    const strip = (rows: AvailableCommand[]): string[] => rows.filter((r) => r.command.kind !== 'summon').map((r) => `${r.command.kind}:${r.label}:${r.enabled}`);
    expect(strip(on.commands)).toEqual(strip(off.commands));
    expect(on.commands.length).toBe(off.commands.length - 1);
  });
});

describe('the hidden Last Summoning is the same lock the other way and does not move with the switch', () => {
  it('three links, same seeds: the event logs are identical off and on, and the copy\'s aeon is a greyed "Taken by Yu Yevon" row in both', async () => {
    const run = async (): Promise<string[]> => {
      const r = await playOrder(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters'], 3, { stopAfter: 3 });
      return r.links.map((l) => `${l.group}:${l.outcome}:${l.turns}:${l.ticks}:${l.summoned.join(',')}`);
    };
    const taken = async (): Promise<string> => {
      const { setup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
      const row = summonRows(turnOf(newLastSummoningEngine(setup))).find((r) => r.label === 'Valefor');
      return `${row?.enabled}:${row?.disabledReason}`;
    };
    const off = await run();
    const offRow = await taken();
    restore = setScriptCommandDisables(true);
    const on = await run();
    const onRow = await taken();
    expect(on).toEqual(off);
    expect(on.length).toBe(3);
    expect(offRow).toBe('false:Taken by Yu Yevon');
    expect(onRow).toBe(offRow);
  }, 120_000);
});

describe('a 0x3xxx row sets the formation\'s flags (synthetic: no shipped fight reaches one)', () => {
  const synthetic = (): EnemyGroupDef => ({
    ...ENEMY_GROUPS_BY_ID['possessed-valefor']!,
    scriptCommandDisables: [
      { who: 'tidus', command: 0x3000 }, // Attack
      { who: 'yuna', command: 0x3116 }, // White Magic
      { who: 'everyone', command: 0x3001 }, // Item
    ],
  });
  const kinds = (d: Input): string[] => d.commands.map((c) => c.command.kind);

  it('off: the rows are all there; on: Tidus has no Attack, Yuna no White Magic, nobody an Item, and a submitted Attack of Tidus is refused', () => {
    const offEngine = engineAt(synthetic());
    const tidusOff = turnOf(offEngine, 'tidus');
    expect(kinds(tidusOff)).toContain('attack');
    expect(kinds(tidusOff)).toContain('item');

    restore = setScriptCommandDisables(true);
    const engine = engineAt(synthetic());
    const tidus = turnOf(engine, 'tidus');
    expect(kinds(tidus)).not.toContain('attack');
    expect(kinds(tidus)).not.toContain('item');
    expect(tidus.commands.length).toBeGreaterThan(0);
    const foe = ctxOf(engine).state.enemyIds[0]!;
    expect(engine.submit({ kind: 'attack', targets: [foe] } as Command)).toEqual([]);
    expect((engine.nextDecision() as Input).actorId).toBe('tidus');
    engine.submit(defend());
    const yuna = turnOf(engine, 'yuna');
    expect(yuna.commands.some((c) => c.category === 'whitemagic')).toBe(false);
    expect(kinds(yuna)).not.toContain('item');
    // the synthetic row names no aeon: Yuna's Summon list is untouched
    expect(labelsOf(yuna)).toEqual(AEONS.map((a) => LABEL[a]));
  });
});
