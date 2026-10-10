/**
 * Which stat Up/Down statuses land on each part of the Vegnagun chain
 * [research/ffx2-vegnagun-shuyin.md §3.1-3.5, every row `[verified: 2 sources]`].
 * FFX-2 only (Chapter 5).
 *
 * This is the chapter's Break-routing puzzle, and the Bulwarks are its odd ones
 * out: §3.3's "Right Bulwark / Left Bulwark" table ends its Immune row with
 * "Acc/Eva/Luck Up-Down, Doom, Delay, Interrupt, Fractional. **Str/Mag/Def/MDef
 * Up-Down all land.**" The shipped record used to spread the chain's shared
 * `STAT_MOD_IMMUNITY_5` into the Bulwarks, which blocked Str and Mag Up-Down on
 * them while its own comment said they land. The shared constant is right for
 * the Tail, the Leg, the Nodes and the Core, so the table below pins every part
 * and not only the two that were wrong: "fixing" the Bulwarks by editing that
 * constant must turn this file red.
 *
 * The engine reads the byte as `resist >= 255` = blocked (`battle/ffx2/resolve.ts`
 * `applyRiders`), so "lands" here means exactly what the engine means by it, and
 * the last case proves it on the real engine with the shipped party.
 */

import { describe, expect, it } from 'vitest';
import type {
  Command,
  EnemyDef,
  FFX2Combatant,
  FFX2MemberBuild,
  FFX2PartyBuild,
} from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
  statLevel,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { computeDamage } from './helpers/ffx2Damage.ts';

/** The eight statuses the four Breaks and their Up counterparts apply. */
const EIGHT = ['str-up', 'str-down', 'mag-up', 'mag-down', 'def-up', 'def-down', 'mdef-up', 'mdef-down'] as const;
const DEF_MDEF = ['def-up', 'def-down', 'mdef-up', 'mdef-down'] as const;
const ACC_EVA_LUCK = ['accu-up', 'accu-down', 'eva-up', 'eva-down', 'luck-up', 'luck-down'] as const;

function partsOf(groupId: string): EnemyDef[] {
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`no enemy group "${groupId}"`);
  return [...group.enemies, ...(group.parts ?? [])];
}

function part(groupId: string, id: string): EnemyDef {
  const found = partsOf(groupId).find((e) => e.id === id);
  if (!found) throw new Error(`no part "${id}" in "${groupId}"`);
  return found;
}

/** Same predicate as `applyRiders`: a byte of 255 (or more) blocks, anything less can land. */
function landing(def: EnemyDef, statuses: readonly string[]): string[] {
  const bytes = def.immunities as Record<string, number | undefined>;
  return statuses.filter((s) => (bytes[s] ?? 0) < 255);
}

describe('the Bulwarks: Str/Mag/Def/MDef Up-Down all land [§3.3, verified: 2 sources]', () => {
  for (const id of ['bulwark-r', 'bulwark-l']) {
    it(`${id}: all eight of Str/Mag/Def/MDef Up-Down land`, () => {
      expect(landing(part('vegnagun-body', id), EIGHT)).toEqual([...EIGHT]);
    });

    it(`${id}: Acc/Eva/Luck Up-Down, Reflect, Haste, Slow and Stop stay blocked`, () => {
      expect(landing(part('vegnagun-body', id), [...ACC_EVA_LUCK, 'reflect', 'haste', 'slow', 'stop'])).toEqual([]);
    });
  }
});

describe('every other part of the chain keeps its own row [§3.1-3.5, verified: 2 sources]', () => {
  // [group, part, which of the eight land, research row]
  const rows: Array<[string, string, readonly string[], string]> = [
    ['vegnagun-tail', 'vegnagun-tail', DEF_MDEF, '§3.1 "Not immune: Reflect, Def Up/Down, MDef Up/Down"'],
    ['vegnagun-leg', 'vegnagun-leg', DEF_MDEF, '§3.2 "as Tail plus Reflect; not immune to Def/MDef Up-Down"'],
    ['vegnagun-leg', 'node-a', [], '§3.2 "as Leg plus Def Up/Down and MDef Up/Down"'],
    ['vegnagun-leg', 'node-b', [], '§3.2 Nodes are statistically identical'],
    ['vegnagun-leg', 'node-c', [], '§3.2 Nodes are statistically identical'],
    ['vegnagun-body', 'vegnagun-body', ['def-up', 'def-down'], '§3.3 "as Leg, plus MDef Up/Down; Def Up/Down still lands"'],
    ['vegnagun-head', 'vegnagun-head', [], '§3.4 "all Str/Mag/Def/MDef/Acc/Eva/Luck Up-Down"'],
    ['vegnagun-head', 'redoubt-r', DEF_MDEF, '§3.4 "as Head minus Def/MDef Up-Down (those land)"'],
    ['vegnagun-head', 'redoubt-l', DEF_MDEF, '§3.4 "as Head minus Def/MDef Up-Down (those land)"'],
    ['shuyin', 'shuyin', [], '§3.5 "all Str/Mag/Def/MDef/Acc/Eva/Luck Up-Down"'],
  ];

  for (const [groupId, id, lands, cite] of rows) {
    it(`${id}: ${lands.length === 0 ? 'none of the eight land' : `${lands.join(', ')} land`}`, () => {
      expect(landing(part(groupId, id), EIGHT), cite).toEqual([...lands]);
    });
  }

  it('the chain is twelve parts, and only the two Bulwarks take Str or Mag Up-Down', () => {
    const all = ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin'].flatMap(partsOf);
    expect(all).toHaveLength(12);
    for (const status of ['str-up', 'str-down', 'mag-up', 'mag-down']) {
      const open = all.filter((e) => landing(e, [status]).length === 1).map((e) => e.id);
      expect(open, status).toEqual(['bulwark-r', 'bulwark-l']);
    }
  });
});

describe('on the real engine, Power Break lands Str Down on a Bulwark [§3.3]', () => {
  /** The shipped Chapter 5 party, with Paine in the Warrior sphere her build already owns (Power Break learned). */
  const asWarrior = (m: FFX2MemberBuild): FFX2MemberBuild =>
    m.id === 'paine' ? { ...m, currentDressphere: 'warrior' } : m;
  const [first, second, third] = farplaneBuild.members;
  const party: FFX2PartyBuild = { ...farplaneBuild, members: [asWarrior(first), asWarrior(second), asWarrior(third)] };

  function engineOnBody(): FFX2Engine {
    const engine = new FFX2Engine({
      abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
      items: itemRegistryFrom(Object.values(data.ITEMS)),
      dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
      garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
      minigames: false,
    });
    engine.setSeed(7);
    engine.init({
      game: 'ffx2',
      party,
      enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-body']!,
      triggers: [],
      seed: 7,
      condition: 'normal',
      canEscape: false,
    });
    return engine;
  }

  /** Everyone defends until Paine's turn; she Power Breaks `targetId`. Returns the log from her submit on. */
  function powerBreak(engine: FFX2Engine, targetId: string): Array<Record<string, unknown>> {
    for (let i = 0; i < 2000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      if (d.actorId !== 'paine') {
        engine.submit({ kind: 'defend', targets: [] });
        continue;
      }
      const row = d.commands.find((c) => c.label === 'Power Break');
      expect(row, 'Paine the Warrior must be offered Power Break').toBeDefined();
      expect(row!.enabled, row!.disabledReason).toBe(true);
      expect(row!.validTargets).toContain(targetId);
      const from = engine.state().log.length;
      engine.submit({ ...row!.command, targets: [targetId] } as Command);
      // Power Break has a charge time, so run on until the action itself has resolved.
      for (let j = 0; j < 2000; j++) {
        const log = engine.state().log as unknown as Array<Record<string, unknown>>;
        const fired = log.slice(from).some((e) => e['type'] === 'action-end' && e['actorId'] === 'paine');
        if (fired) return log.slice(from);
        const next = engine.nextDecision();
        if (next.kind === 'battle-over') return log.slice(from);
        if (next.kind === 'waiting') engine.tick(Math.max(1, next.nextEventMs));
        else if (next.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      throw new Error('Power Break never resolved');
    }
    throw new Error('Paine never got a turn');
  }

  const strDownOn = (log: Array<Record<string, unknown>>, targetId: string) =>
    log.filter((e) => e['type'] === 'status-add' && e['status'] === 'str-down' && e['targetId'] === targetId);

  it('lands on the Right Bulwark', () => {
    const engine = engineOnBody();
    const log = powerBreak(engine, 'bulwark-r');
    expect(strDownOn(log, 'bulwark-r')).toHaveLength(1);
    expect(engine.state().combatants['bulwark-r']!.statuses['str-down']).toBeDefined();
  });

  /**
   * §3 header: "every offensive ability the Bulwarks own is `fractional` ... The Bulwarks' Level, Strength and
   * Magic are therefore **dead stats** for damage purposes". So the Break landing is faithful and changes no number:
   * the same counter from the same Bulwark, with and without the Str Down it now carries.
   */
  it('and moves none of the Bulwark’s own damage, because every offensive move it owns is fractional', () => {
    const engine = engineOnBody();
    powerBreak(engine, 'bulwark-r');
    const state = engine.state();
    const broken = state.combatants['bulwark-r'] as FFX2Combatant;
    expect(statLevel(broken, 'str-down')).toBeGreaterThan(0);
    const clean = { ...broken, statuses: {} } as FFX2Combatant;
    const paine = state.combatants['paine'] as FFX2Combatant;

    const offensive = part('vegnagun-body', 'bulwark-r')
      .abilityIds.map((id) => data.ABILITIES[id as keyof typeof data.ABILITIES]!)
      .filter((a) => a.formula !== 'none');
    expect(offensive.map((a) => a.name)).toEqual([
      'Hostile activity detected', 'Physical attack detected', 'Magical attack detected',
    ]);
    for (const ability of offensive) {
      expect(ability.formula, ability.name).toBe('fractional');
      // Re-parity W3: "Magical attack detected" is the game's MP-class row (damage class 2), so its fraction comes off MP and
      // the hit's HP number is 0; the other two rows come off HP. Either pool counts as "its own damage".
      const hit = (user: FFX2Combatant) => {
        const out = computeDamage({ user, target: paine, ability, chainCount: 0, crit: false, randomRoll: 256 });
        return out.amount + out.mp;
      };
      expect(hit(clean), ability.name).toBeGreaterThan(0);
      expect(hit(broken), ability.name).toBe(hit(clean));
    }
  });

  it('still does not land on the Core, which keeps the shared block', () => {
    const engine = engineOnBody();
    const log = powerBreak(engine, 'vegnagun-body');
    expect(log.some((e) => e['type'] === 'damage' && e['targetId'] === 'vegnagun-body')).toBe(true);
    expect(strDownOn(log, 'vegnagun-body')).toHaveLength(0);
    expect(engine.state().combatants['vegnagun-body']!.statuses['str-down']).toBeUndefined();
  });
});
