/**
 * The script stat setter in the FFX-2 engine (re-parity RC9, lane X2-E, rows XE4 and XE5; **FFX-2 only**): what the game's boss scripts write through `btlSetStat` and the engine now does.
 *
 * Built (note FFX2-G05): the Vegnagun Core's death entry (XE4: both Bulwarks to 0 hit points, no knock-out routine) and the death patterns every boss script writes at init
 * (XE5: 0 falls and can be raised, any other value leaves the battle at its KO and blocks Auto-Life), plus the one init Agility (the Head's 110) now going through the setter.
 * Left out, each pinned below so the day it changes the pin says so: the invincibility of Ormi and Logos and Leblanc's Agility in the combo (XE1, XE2) and the Act III
 * revives (XE3), which all live inside the window of No Love Lost, whose length the engine does not have.
 *
 * The expectations are written from the game's side: `tests/fixtures/parity/ffx2/stat_setter_usage.json` holds the compiled calls of the 36 boss packages (the group spec, the stat id, the
 * value). The oracle below applies them with its own two-line rule (a slot number names that slot, `chr_own` the script's own; an id-1 call sets the hit points) and imports no
 * kernel, no adapter and no engine code but the engine under test.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command, EnemyGroupDef } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { applyHpDelta } from '../../src/battle/ffx2/resolve-hp.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { isTargetable, validTargetIds } from '../../src/battle/ffx2/targeting.ts';
import { runDeathEntries } from '../../src/battle/ffx2/engineHooks.ts';
import { applyStat } from '../../src/battle/ffx2/adapt/stat-setter.ts';
import { DEATH_PATTERN_OF_ROW, deathPatternOf, leavesOnDeath } from '../../src/battle/ffx2/adapt/death-patterns.ts';
import { GROUP_OWN, StatId, chrMonster, storedValue } from '../../src/battle/ffx2/kernel/stat-setter.ts';
import { ATTACK_TRACK, DEFENSE_TRACK, UPGRADE_LEVELS } from '../../src/data/ffx2/enemies/experiment-levels.ts';
import { ACTION_TIME_ALL_FFX2 } from '../../src/battle/ffx2/action-time.ts';
import { ENEMY_GROUPS, ENEMY_GROUPS_BY_ID } from '../../src/data/ffx2/enemies/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { ABILITIES } from '../../src/data/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';

interface Usage {
  packages: Record<string, Array<[worker: number, fn: number, spec: number, id: number, value: number | null]>>;
}
const usage = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/stat_setter_usage.json', import.meta.url)), 'utf8')) as Usage;

const options = () => ({
  abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
  items: itemRegistryFrom(Object.values(data.ITEMS)),
  dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
  garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
  minigames: false,
});

interface Battle {
  engine: FFX2Engine;
  units: Record<string, Ffx2Unit>;
  state: BattleState;
}

/** A battle of the real formation `groupId` against the Chapter V party. */
function battle(groupId: string, seed = 1): Battle {
  const engine = new FFX2Engine(options());
  const group = ENEMY_GROUPS_BY_ID[groupId] as EnemyGroupDef;
  engine.init({ game: 'ffx2', party: farplaneBuild, enemies: group, triggers: [], seed, condition: 'scripted', canEscape: false });
  const state = engine.state() as BattleState;
  return { engine, units: state.combatants as Record<string, Ffx2Unit>, state };
}

const ctxOf = (b: Battle): Parameters<typeof applyHpDelta>[0] => (b.engine as unknown as { resolveCtx(): Parameters<typeof applyHpDelta>[0] }).resolveCtx();
const unit = (b: Battle, id: string): Ffx2Unit => b.units[id] as Ffx2Unit;
/** The events the engine has resolved but not yet handed out (it hands them out in `nextDecision`): a direct call to the knock-out path adds to them. */
const drafts = (b: Battle): Array<{ type: string; [k: string]: unknown }> => (b.engine as unknown as { drafts: Array<{ type: string; [k: string]: unknown }> }).drafts;
/** The hit that takes `id` to 0 (a damage of its whole HP), as the engine's knock-out path sees it; returns the events it produced. */
const kill = (b: Battle, id: string, by?: string): Array<{ type: string; [k: string]: unknown }> => {
  const from = drafts(b).length;
  applyHpDelta(ctxOf(b), unit(b, id), unit(b, id).hp, by);
  return drafts(b).slice(from);
};

/** The script pass that follows an action or a logic step: the death entries the knock-outs requested run (`engineHooks.ts#runDeathEntries`, which the engine calls at the end of `afterAction` and of `runLogicStep`). */
const drain = (b: Battle): void => runDeathEntries(Object.values(b.units), (u) => (b.engine as unknown as { aiContext(u: Ffx2Unit): never }).aiContext(u));
/** A knock-out and the script pass after it, as the engine runs them at the end of an action. */
const killAndAnswer = (b: Battle, id: string, by?: string): Array<{ type: string; [k: string]: unknown }> => {
  const events = kill(b, id, by);
  drain(b);
  return events;
};

// ---------------------------------------------------------------------------------------------------------------------------------------
// The oracle: the compiled calls of a package's death entry (worker 0, function 6), applied by a two-line rule

interface Slot {
  hp: number;
  alive: boolean;
}

/** The game's slot of each unit of the battle, written out again: the party 0 to 14 in build order, the enemies 15 to 30 by their `slot` then position. */
function gameSlots(b: Battle): Map<number, string> {
  const out = new Map<number, string>();
  const units = Object.values(b.units);
  units.filter((u) => u.side === 'party').forEach((u, i) => out.set(i, u.id));
  units.filter((u) => u.side === 'enemy').sort((a, c) => a.slot - c.slot).forEach((u, i) => out.set(15 + i, u.id));
  return out;
}

function deathEntryOracle(pkg: string, ownerSlot: number, world: Map<number, Slot>): void {
  for (const [worker, fn, spec, id, value] of usage.packages[pkg] ?? []) {
    if (worker !== 0 || fn !== 6 || id !== StatId.hp || value === null) continue;
    const target = spec === -13 ? ownerSlot : spec;
    const slot = world.get(target);
    if (slot !== undefined) slot.hp = value; // the setter stores the number and runs no knock-out routine: nothing else changes
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('XE4: the Vegnagun Core\'s death entry sets both Bulwarks to 0 hit points and runs no knock-out for them (FFX2-G05 3.6, m287)', () => {
  it('the compiled entry is two calls: chr_mon2 and chr_mon3, hit points, 0 (the only death entry in the shipped packages that does this)', () => {
    const calls = usage.packages['m287']!.filter(([w, fn]) => w === 0 && fn === 6);
    expect(calls.map(([, , spec, id, value]) => [spec, id, value])).toEqual([[16, StatId.hp, 0], [17, StatId.hp, 0]]);
    expect(chrMonster(2)).toBe(16);
    expect(chrMonster(3)).toBe(17);
    const writers = Object.entries(usage.packages).filter(([, c]) => c.some(([w, fn, spec, id, v]) => w === 0 && fn === 6 && id === StatId.hp && spec !== -13 && v === 0));
    expect(writers.map(([p]) => p)).toEqual(['m287']);
  });

  it('the Core falls with both Bulwarks up: they stand at 0 hit points, alive, with no knock-out event and no status; the Core is dead', () => {
    const b = battle('vegnagun-body');
    const world = new Map<number, Slot>([...gameSlots(b)].map(([slot, id]) => [slot, { hp: unit(b, id).hp, alive: unit(b, id).alive }]));
    deathEntryOracle('m287', 15, world);
    const events = killAndAnswer(b, 'vegnagun-body', 'yuna');
    for (const [slot, id] of gameSlots(b)) {
      if (id === 'vegnagun-body') continue;
      expect(unit(b, id).hp, `${id} (slot ${slot})`).toBe(world.get(slot)?.hp);
    }
    expect(unit(b, 'bulwark-r')).toMatchObject({ hp: 0, alive: true });
    expect(unit(b, 'bulwark-l')).toMatchObject({ hp: 0, alive: true });
    expect(unit(b, 'bulwark-r').statuses['ko']).toBeUndefined();
    expect(unit(b, 'vegnagun-body')).toMatchObject({ hp: 0, alive: false });
    expect(events.filter((e) => e['targetId'] === 'bulwark-r' || e['targetId'] === 'bulwark-l')).toEqual([]);
    expect(events.filter((e) => e.type === 'ko').map((e) => e['targetId'])).toEqual(['vegnagun-body']);
  });

  it('property: over the Bulwarks\' states (full, hurt, down, one down) the engine ends where the compiled calls say, for 120 seeded situations', () => {
    for (let seed = 1; seed <= 120; seed += 1) {
      const b = battle('vegnagun-body', seed);
      const rights = [3000, 1, 1234, 0][seed % 4] as number;
      const lefts = [3000, 2999, 0, 777][Math.floor(seed / 4) % 4] as number;
      for (const [id, hp] of [['bulwark-r', rights], ['bulwark-l', lefts]] as const) {
        unit(b, id).hp = hp;
        if (hp === 0) {
          unit(b, id).alive = false;
          applyStatus(unit(b, id), { status: 'ko', chance: 255, duration: 0 });
        }
      }
      const world = new Map<number, Slot>([...gameSlots(b)].map(([slot, id]) => [slot, { hp: unit(b, id).hp, alive: unit(b, id).alive }]));
      deathEntryOracle('m287', 15, world);
      killAndAnswer(b, 'vegnagun-body');
      for (const [slot, id] of gameSlots(b)) {
        if (id === 'vegnagun-body') continue;
        expect({ hp: unit(b, id).hp, alive: unit(b, id).alive }, `seed ${seed} ${id}`).toEqual(world.get(slot));
      }
    }
  });

  it('a Bulwark already down stays down: 0 stored over 0, no revival, no second knock-out', () => {
    const b = battle('vegnagun-body');
    unit(b, 'bulwark-r').hp = 0;
    unit(b, 'bulwark-r').alive = false;
    applyStatus(unit(b, 'bulwark-r'), { status: 'ko', chance: 255, duration: 0 });
    const events = killAndAnswer(b, 'vegnagun-body');
    expect(unit(b, 'bulwark-r')).toMatchObject({ hp: 0, alive: false });
    expect(events.filter((e) => e.type === 'ko' || e.type === 'revive').map((e) => e.type)).toEqual(['ko']);
  });

  it('a hit that lands on a Bulwark at 0 hit points after that runs the knock-out routine, as the game does (the damage pipeline is unchanged)', () => {
    const b = battle('vegnagun-body');
    killAndAnswer(b, 'vegnagun-body');
    const from = drafts(b).length;
    applyHpDelta(ctxOf(b), unit(b, 'bulwark-r'), 5, 'rikku');
    const events = drafts(b).slice(from);
    expect(events.some((e) => e.type === 'ko' && e['targetId'] === 'bulwark-r')).toBe(true);
    expect(events.some((e) => e.type === 'part-destroyed')).toBe(true);
    expect(unit(b, 'bulwark-r')).toMatchObject({ hp: 0, alive: false });
  });

  it('only the Core\'s knock-out runs it: a Bulwark falling touches nothing, and no other script of the chain defines a death entry', () => {
    const b = battle('vegnagun-body');
    kill(b, 'bulwark-r');
    expect(unit(b, 'vegnagun-body')).toMatchObject({ hp: 33040, alive: true });
    expect(unit(b, 'bulwark-l')).toMatchObject({ hp: 3000, alive: true });
    const withEntry = ENEMY_GROUPS.flatMap((g) => [...g.enemies, ...(g.parts ?? [])]).filter((e) => aiScriptFor(e.aiScriptId).onDeath !== undefined).map((e) => e.id);
    expect(withEntry).toEqual(['vegnagun-body']);
  });

  it('every way the Core falls reaches the entry: damage, the Death status, and a hit in a party member\'s own action', () => {
    for (const how of ['damage', 'death-status'] as const) {
      const b = battle('vegnagun-body');
      if (how === 'damage') killAndAnswer(b, 'vegnagun-body', 'paine');
      else {
        const core = unit(b, 'vegnagun-body');
        core.immunities = {};
        applyHpDelta(ctxOf(b), core, core.hp, 'rikku'); // the Death status lands through the same routine (`resolve-status.ts`)
        drain(b);
      }
      expect(unit(b, 'bulwark-r').hp, how).toBe(0);
      expect(unit(b, 'bulwark-l').hp, how).toBe(0);
    }
  });

  it('the Head link\'s Redoubts and the Leg link\'s Nodes are not touched when their Head or Leg falls', () => {
    const head = battle('vegnagun-head');
    kill(head, 'vegnagun-head');
    expect(unit(head, 'redoubt-r').hp).toBe(unit(head, 'redoubt-r').stats.maxHp);
    const leg = battle('vegnagun-leg');
    kill(leg, 'vegnagun-leg');
    expect(unit(leg, 'node-a').hp).toBe(unit(leg, 'node-a').stats.maxHp);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('XE4 timing: the death entry is a request that runs after the action in flight has applied every result (the entry runner starts a script worker; FFX2-G05 3.6, read from the code)', () => {
  it('a later result of the same action on a Bulwark lands as usual; the entry then takes it to 0', () => {
    const b = battle('vegnagun-body');
    kill(b, 'vegnagun-body', 'yuna'); // the request
    expect(unit(b, 'vegnagun-body').deathPending).toBeDefined();
    expect(unit(b, 'bulwark-r').hp).toBe(3000);
    applyHpDelta(ctxOf(b), unit(b, 'bulwark-r'), 2000, 'yuna'); // an all-enemy move's next target, in the same action
    expect(unit(b, 'bulwark-r')).toMatchObject({ hp: 1000, alive: true });
    drain(b);
    expect(unit(b, 'bulwark-r')).toMatchObject({ hp: 0, alive: true });
    expect(unit(b, 'vegnagun-body').deathPending).toBeUndefined();
  });

  it('a result of the same action that would have taken a Bulwark to 0 still knocks it out (the entry has not run), and the entry stores 0 over its 0', () => {
    const b = battle('vegnagun-body');
    kill(b, 'vegnagun-body');
    const events = (() => {
      const from = drafts(b).length;
      applyHpDelta(ctxOf(b), unit(b, 'bulwark-l'), 3500, 'paine');
      return drafts(b).slice(from);
    })();
    expect(events.some((e) => e.type === 'ko' && e['targetId'] === 'bulwark-l')).toBe(true);
    drain(b);
    expect(unit(b, 'bulwark-l')).toMatchObject({ hp: 0, alive: false });
  });

  it('the entry runs once: a second pass finds nothing, and the monsters that did not fall have nothing pending', () => {
    const b = battle('vegnagun-body');
    kill(b, 'vegnagun-body');
    drain(b);
    unit(b, 'bulwark-r').hp = 500;
    drain(b);
    expect(unit(b, 'bulwark-r').hp).toBe(500);
    for (const u of Object.values(b.units)) expect(u.deathPending, u.id).toBeUndefined();
  });

  it('knocking out a girl requests nothing (no script), and a monster whose script has no death entry leaves nothing pending after the pass', () => {
    const b = battle('vegnagun-body');
    kill(b, 'yuna', 'bulwark-r');
    expect(unit(b, 'yuna').deathPending).toBeUndefined();
    kill(b, 'bulwark-l');
    expect(unit(b, 'bulwark-l').deathPending).toBeDefined();
    drain(b);
    expect(unit(b, 'bulwark-l').deathPending).toBeUndefined();
  });

  it('through the engine turn loop: a girl kills the Core in her action, and when that action returns the Bulwarks stand at 0 hit points, alive, and the Core is dead (12 seeds)', () => {
    let killed = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const b = battle('vegnagun-body', seed);
      unit(b, 'vegnagun-body').hp = 1;
      let events: BattleEvent[] = [];
      for (let i = 0; i < 20_000 && unit(b, 'vegnagun-body').alive; i += 1) {
        const d = b.engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') b.engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
          events = b.engine.submit(row === undefined ? ({ kind: 'defend', targets: [] } as Command) : ({ ...row.command, targets: ['vegnagun-body'] } as Command));
        }
      }
      if (unit(b, 'vegnagun-body').alive) continue;
      killed += 1;
      expect(events.some((e) => e.type === 'ko' && (e as { targetId: string }).targetId === 'vegnagun-body'), `seed ${seed}`).toBe(true);
      expect(unit(b, 'bulwark-r'), `seed ${seed}`).toMatchObject({ hp: 0, alive: true });
      expect(unit(b, 'bulwark-l'), `seed ${seed}`).toMatchObject({ hp: 0, alive: true });
      expect(events.filter((e) => e.type === 'ko').length, `seed ${seed}`).toBe(1);
    }
    expect(killed).toBe(12);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('XE5: the death pattern every boss script writes at init (FFX2-G05 3.10)', () => {
  /** What each package's init writes: the one value its first actor's `setdeathpat` call carries (a package whose actors disagree is left out). */
  const expected = new Map<number, number>();
  for (const [pkg, calls] of Object.entries(usage.packages)) {
    const values = new Set(calls.filter(([, fn, , id]) => fn === 0 && id === StatId.deathPattern).map(([, , , , v]) => v as number));
    if (values.size === 1) expected.set(Number(pkg.slice(1)), [...values][0] as number);
  }

  it('the oracle table has the note\'s 36 packages less the two it cannot give a value (m195 writes none, m328\'s two actors disagree)', () => {
    expect(expected.size).toBe(34);
    expect(expected.has(195)).toBe(false);
    expect(expected.has(328)).toBe(false);
    const counts = new Map<number, number>();
    for (const v of expected.values()) counts.set(v, (counts.get(v) ?? 0) + 1);
    expect([...counts].sort((a, c) => a[0] - c[0])).toEqual([[0, 4], [1, 21], [2, 6], [4, 3]]);
  });

  it('every shipped enemy of every formation carries the byte its package writes; one the note did not read (and the arena Trema) carries none', () => {
    const seen = new Set<number>();
    for (const group of ENEMY_GROUPS) {
      const b = battle(group.id);
      for (const def of [...group.enemies, ...(group.parts ?? [])]) {
        const record = def.ffx2Record;
        const u = unit(b, def.id);
        if (record === undefined) {
          expect(u.deathPattern, `${group.id}/${def.id} has no monster row`).toBeUndefined();
          continue;
        }
        // The Oversoul Paragon has no compiled package; the note reads its pattern from the source text (`o152.src`): 1, the same as `m152`.
        const want = record.table === 2 && record.row === 152 ? 1 : expected.get(record.row);
        expect(u.deathPattern, `${group.id}/${def.id} (row ${record.table}/${record.row})`).toBe(want);
        if (want !== undefined) seen.add(record.row + (record.table === 2 ? 1000 : 0));
        expect(deathPatternOf(u), `${group.id}/${def.id}`).toBe(want);
      }
    }
    // every package the note read that the engine has an enemy for is covered: the 34 less m293 (an inert second Shuyin that is out of the battle), plus the Oversoul's row
    const rowsInEngine = [...expected.keys()].filter((row) => row !== 293);
    for (const row of rowsInEngine) expect(seen.has(row), `package m${row} has an engine enemy`).toBe(true);
    expect(seen.has(1152)).toBe(true);
  });

  it('the table in the engine is exactly the packages\' values: 34 rows, none invented', () => {
    const rows = Object.entries(DEATH_PATTERN_OF_ROW);
    expect(rows.length).toBe(34);
    for (const [key, value] of rows) {
      const [table, row] = key.split('/').map(Number) as [number, number];
      expect(value, key).toBe(table === 2 ? 1 : expected.get(row));
    }
  });

  it('the Bulwarks and Redoubts are the monsters that can be raised (pattern 0); the Nodes, the Tail, the Leg, the Body and the Head cannot', () => {
    const b = battle('vegnagun-body');
    expect([unit(b, 'bulwark-r').deathPattern, unit(b, 'bulwark-l').deathPattern]).toEqual([0, 0]);
    expect(unit(b, 'vegnagun-body').deathPattern).toBe(1);
    const head = battle('vegnagun-head');
    expect([unit(head, 'redoubt-r').deathPattern, unit(head, 'redoubt-l').deathPattern, unit(head, 'vegnagun-head').deathPattern]).toEqual([0, 0, 1]);
    const leg = battle('vegnagun-leg');
    expect([unit(leg, 'node-a').deathPattern, unit(leg, 'node-b').deathPattern, unit(leg, 'node-c').deathPattern, unit(leg, 'vegnagun-leg').deathPattern]).toEqual([4, 4, 4, 1]);
    expect(leavesOnDeath(unit(b, 'bulwark-r'))).toBe(false);
    expect(leavesOnDeath(unit(leg, 'node-a'))).toBe(true);
    expect(leavesOnDeath({})).toBe(false);
  });

  it('a girl carries none (a party slot is left alone) and her Auto-Life works as it always did', () => {
    const b = battle('vegnagun-body');
    expect(unit(b, 'yuna').deathPattern).toBeUndefined();
    applyStatus(unit(b, 'yuna'), { status: 'auto-life', chance: 255, duration: 0 });
    const events = kill(b, 'yuna', 'bulwark-r');
    expect(events.some((e) => e.type === 'revive' && e['cause'] === 'auto-life')).toBe(true);
    expect(unit(b, 'yuna')).toMatchObject({ alive: true });
  });

  it('Auto-Life on a monster that can be raised revives it; on one that leaves the battle it does not, and the corpse keeps the status', () => {
    const body = battle('vegnagun-body');
    applyStatus(unit(body, 'bulwark-r'), { status: 'auto-life', chance: 255, duration: 0 });
    const revived = kill(body, 'bulwark-r');
    expect(revived.some((e) => e.type === 'revive' && e['cause'] === 'auto-life')).toBe(true);
    expect(unit(body, 'bulwark-r')).toMatchObject({ alive: true });

    const leg = battle('vegnagun-leg');
    applyStatus(unit(leg, 'node-a'), { status: 'auto-life', chance: 255, duration: 0 });
    const gone = kill(leg, 'node-a');
    expect(gone.some((e) => e.type === 'revive')).toBe(false);
    expect(gone.some((e) => e.type === 'ko')).toBe(true);
    expect(unit(leg, 'node-a')).toMatchObject({ alive: false });
    expect(unit(leg, 'node-a').statuses['auto-life']).toBeDefined();
  });

  it('a monster that fell with a pattern other than 0 is not a target of anything, a revival included; one that can be raised is (a Raise finds it)', () => {
    const leg = battle('vegnagun-leg');
    kill(leg, 'node-a');
    expect(isTargetable(unit(leg, 'node-a'), true)).toBe(false);
    expect(isTargetable(unit(leg, 'node-a'), false)).toBe(false);
    expect(isTargetable(unit(leg, 'node-b'), true)).toBe(true);
    const body = battle('vegnagun-body');
    kill(body, 'bulwark-r');
    expect(isTargetable(unit(body, 'bulwark-r'), true)).toBe(true);
    expect(isTargetable(unit(body, 'bulwark-r'), false)).toBe(false);
    const ids = validTargetIds(Object.values(body.units), unit(body, 'vegnagun-body'), { targeting: 'single-ally', flags: ['can-target-dead'] });
    expect(ids).toContain('bulwark-r');
    const legIds = validTargetIds(Object.values(leg.units), unit(leg, 'vegnagun-leg'), { targeting: 'single-ally', flags: ['can-target-dead'] });
    expect(legIds).not.toContain('node-a');
    expect(legIds).toContain('node-b');
  });

  it('the Head revives its Redoubts through the whole fight: a Redoubt that fell is a target of Acta Est Fabula and Full-Life, as before', () => {
    const head = battle('vegnagun-head');
    kill(head, 'redoubt-r');
    expect(isTargetable(unit(head, 'redoubt-r'), true)).toBe(true);
    expect(unit(head, 'redoubt-r').deathPattern).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('the existence flag (stat 224): which monsters leave the battle-end evaluation (closes FFX2-G10 open question 9)', () => {
  it('the units the engine treats as parts (never present, so they never gate a victory) are exactly the monsters whose init writes the existence flag as 0', () => {
    const clears = (pkg: string): boolean => (usage.packages[pkg] ?? []).some(([w, fn, spec, id, v]) => w === 0 && fn === 0 && spec === -13 && id === StatId.existFlag && v === 0);
    const checked: string[] = [];
    for (const group of ENEMY_GROUPS) {
      const b = battle(group.id);
      for (const def of [...group.enemies, ...(group.parts ?? [])]) {
        const record = def.ffx2Record;
        if (record === undefined || record.table !== 1) continue;
        const pkg = `m${record.row}`;
        if (usage.packages[pkg] === undefined || pkg === 'm293' || pkg === 'm195') continue;
        checked.push(def.id);
        expect(unit(b, def.id).flags.isPart === true, `${group.id}/${def.id} (${pkg})`).toBe(clears(pkg));
      }
    }
    // the Nodes, the Bulwarks and the Redoubts are the parts; the Tail, Leg, Body, Head, Shuyin and every other boss of the 36 packages are present
    expect(checked.filter((id) => ENEMY_GROUPS.some((g) => (g.parts ?? []).some((p) => p.id === id) && g.id.startsWith('vegnagun'))).sort()).toEqual(['bulwark-l', 'bulwark-r', 'node-a', 'node-b', 'node-c', 'redoubt-l', 'redoubt-r']);
    expect(checked.length).toBeGreaterThan(28);
    // the two packages with no engine unit: the inert second Shuyin (out of the battle, existence and cursor off) and the Experiment's parts
    expect(clears('m293') && clears('m195')).toBe(true);
    expect((usage.packages['m293'] ?? []).some(([, , , id, v]) => id === StatId.inBattle && v === 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('ids 11 to 14: the stat tracks of the Experiment body are what its init writes, through the clamp of the setter (a 0 is stored as 1)', () => {
  it('the five Attack levels write Strength 112, 130, 155, 180, 215 and Magic 0, 20, 45, 72, 100; the five Defense levels write Vitality and Spirit 0, 50, 100, 150, 205', () => {
    const writes = (id: number): number[] => (usage.packages['m194'] ?? []).filter(([w, fn, , i]) => w === 0 && fn === 0 && i === id).map(([, , , , v]) => v as number);
    const stored = (id: number): number[] => writes(id).map((v) => storedValue('clamp1', v));
    expect(stored(StatId.str)).toEqual(UPGRADE_LEVELS.map((level) => ATTACK_TRACK[level].str));
    expect(stored(StatId.mag)).toEqual(UPGRADE_LEVELS.map((level) => ATTACK_TRACK[level].mag));
    expect(stored(StatId.vit)).toEqual(UPGRADE_LEVELS.map((level) => DEFENSE_TRACK[level].def));
    expect(stored(StatId.spirit)).toEqual(UPGRADE_LEVELS.map((level) => DEFENSE_TRACK[level].mdef));
    expect(writes(StatId.mag)[0]).toBe(0); // the script writes 0, the setter stores 1: the data already says 1
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('the init Agility goes through the setter (the Head\'s 110) and the setter\'s adapter refuses what the engine does not model', () => {
  it('the Head opens on Agility 110 (m290, worker 0, function 0), as the RC3 init hook always made it; its phase-2 68 is the same script\'s later write', () => {
    const calls = usage.packages['m290']!.filter(([w, , spec, id]) => w === 0 && spec === -13 && id === StatId.dex);
    expect(calls.map(([, fn, , , v]) => [fn, v])).toEqual([[0, 110], [2, 68]]);
    const b = battle('vegnagun-head');
    expect(unit(b, 'vegnagun-head').stats.agi).toBe(110);
    expect(unit(b, 'vegnagun-head').atb.required).toBeGreaterThan(0);
  });

  it('applyStat reaches the units the spec names, returns the kernel\'s count, and leaves a girl alone for a death pattern', () => {
    const b = battle('vegnagun-body');
    const units = Object.values(b.units);
    const core = unit(b, 'vegnagun-body');
    expect(applyStat(units, core, StatId.hp, chrMonster(2), 123).count).toBe(1);
    expect(unit(b, 'bulwark-r').hp).toBe(123);
    expect(unit(b, 'bulwark-l').hp).toBe(3000);
    expect(applyStat(units, core, StatId.deathPattern, 0, 5).count).toBe(1); // slot 0 is Yuna: counted, not written
    expect(unit(b, 'yuna').deathPattern).toBeUndefined();
    expect(applyStat(units, core, StatId.dex, GROUP_OWN, 0).writes[0]?.value).toBe(1); // 0 is stored as 1
    expect(core.stats.agi).toBe(1);
    expect(applyStat(units, core, StatId.hp, 31, 7)).toMatchObject({ count: 0 }); // nobody is slot 31
  });

  it('refuses a store the engine has no field for, a write to a girl, and an owner that is not in the battle', () => {
    const b = battle('vegnagun-body');
    const units = Object.values(b.units);
    const core = unit(b, 'vegnagun-body');
    expect(() => applyStat(units, core, StatId.exp, GROUP_OWN, 100)).toThrow(/no field for Chr\+0x69c/);
    expect(() => applyStat(units, core, StatId.dex, 0, 100)).toThrow(/monsters only/);
    expect(() => applyStat(units, { ...core, id: 'ghost' } as Ffx2Unit, StatId.hp, GROUP_OWN, 1)).toThrow(/not one of the battle/);
  });

  it('a hit-point write that would revive a dead monster in place is refused (row XE3 is not built)', () => {
    const b = battle('vegnagun-body');
    const units = Object.values(b.units);
    const bulwark = unit(b, 'bulwark-r');
    bulwark.alive = false;
    bulwark.hp = 0;
    applyStatus(bulwark, { status: 'ko', chance: 255, duration: 0 });
    expect(() => applyStat(units, unit(b, 'vegnagun-body'), StatId.hp, chrMonster(2), 1)).toThrow(/not built/);
    expect(() => applyStat(units, unit(b, 'vegnagun-body'), StatId.hp, chrMonster(2), 0)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('what is NOT built, and the engine fact each row waits for (XE1, XE2, XE3, XE6) — these pins change on purpose when X2-A / X2-C / X2-G land', () => {
  const NLL = ['x2-nll-1', 'x2-nll-2', 'x2-nll-3'];

  it('the Act III death entries and the combo stat writes exist in the compiled packages exactly as the plan says (m245, m250, m253)', () => {
    const entry = (pkg: string, fn: number): Array<[number, number, number | null]> => usage.packages[pkg]!.filter(([w, f]) => w === 0 && f === fn).map(([, , spec, id, v]) => [spec, id, v]);
    expect(entry('m245', 6)).toEqual([[-13, StatId.hp, 1]]);
    expect(entry('m250', 6)).toEqual([[-13, StatId.hp, 1]]);
    expect(entry('m253', 6)).toEqual([[-13, StatId.hp, 1], [15, StatId.invincible, 0], [16, StatId.invincible, 0]]);
    const action = entry('m253', 2).filter(([, id]) => id === StatId.invincible || id === StatId.dex);
    expect(action).toEqual([[15, 90, 0], [16, 90, 0], [17, 90, 0], [-13, 15, 53], [-13, 15, 254], [15, 90, 1], [16, 90, 1]]);
  });

  it('XE3: the Act III trio\'s scripts define no death entry, and the setter adapter would refuse the revive if one asked for it', () => {
    for (const id of ['ffx2-leblanc-ormi', 'ffx2-leblanc-logos', 'ffx2-leblanc']) expect(aiScriptFor(id).onDeath, id).toBeUndefined();
  });

  it('XE1 and XE2 need the combo to have a length: the three linked parts cost 0 ATB and 0 charge, so Agility cannot change their recovery or cast, and no formation of Chapter VI gives an action any time', () => {
    for (const id of NLL) {
      const ability = ABILITIES[id];
      expect(ability, id).toBeDefined();
      const row = ability?.ffx2Record;
      expect(row, id).toBeDefined();
      expect([row?.costAtb, row?.costCast], id).toEqual([0, 0]);
    }
    expect(ACTION_TIME_ALL_FFX2).toBe(false);
    for (const id of ['ffx2-leblanc-entrance', 'ffx2-leblanc-logos-room', 'ffx2-leblanc-last-room']) {
      expect(ENEMY_GROUPS_BY_ID[id], id).toBeDefined();
      expect(ENEMY_GROUPS_BY_ID[id]?.actionTimeSeconds, id).toBeUndefined();
    }
  });

  it('XE6: the engine has no Mix, so the Hero Drink Mix figure (15 counts) has no row to sit on; the item row keeps its 20 counts', () => {
    expect(ABILITIES['x2-item-hero-drink']?.statusEffects?.[0]).toMatchObject({ status: 'invincible', duration: 20 });
    expect(Object.keys(ABILITIES).filter((id) => /mix/i.test(id) && /hero|miracle/i.test(id))).toEqual([]);
  });

  it('id 173 (EXP) is written by six packages, in the arena scenes only (FFX2-G03 4.11): the setter adapter does not map it, so no shipped chapter reward moves', () => {
    const writers = Object.entries(usage.packages).filter(([, c]) => c.some(([, , , id]) => id === StatId.exp)).map(([p]) => p).sort();
    expect(writers).toEqual(['m152', 'm167', 'm169', 'm171', 'm172', 'm173']);
  });
});
