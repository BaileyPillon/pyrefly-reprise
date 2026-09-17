/**
 * Independent verification pass (critic): do wrong tactics still lose, and does
 * the winning line stay inside canon?
 *
 * Same harness as tests/unit/strategy-chapter2.test.ts.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MAX_DECISIONS = 30_000;
const SEEDS = [1, 7, 42, 20260916];

function newEngine(seed: number, party: FFXPartyBuild = zanarkandBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('yunalesca group missing');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

/** Naive: mash Attack, nothing else. Falls back to Defend if Attack is not offered. */
function naive(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  if (row) return { kind: 'attack', targets: row.validTargets[0] ? [row.validTargets[0]] : [] };
  const def = d.commands.find((c) => c.command.kind === 'defend' && c.enabled);
  if (def) return def.command;
  const any = d.commands.find((c) => c.enabled);
  return any ? (any.validTargets[0] ? ({ ...any.command, targets: [any.validTargets[0]] } as Command) : any.command) : { kind: 'defend', targets: [] };
}

function cureOnSight(
  engine: ReturnType<typeof newEngine>,
  d: Extract<Decision, { kind: 'player-input' }>,
): Command | null {
  const state = engine.state();
  const zombie = state.activeIds
    .map((id) => state.combatants[id])
    .find((c) => c !== undefined && c.alive && c.statuses['zombie'] !== undefined);
  if (!zombie) return null;
  const cure: AvailableCommand | undefined = d.commands.find(
    (c) => c.enabled && (c.label === 'Holy Water' || c.label === 'Remedy') && c.validTargets.includes(zombie.id),
  );
  return cure ? ({ ...cure.command, targets: [zombie.id] } as Command) : null;
}

function deepCureStock(): FFXPartyBuild {
  return {
    ...zanarkandBuild,
    inventory: zanarkandBuild.inventory.map((i) => (i.itemId === 'holy-water' ? { ...i, count: 99 } : i)),
  };
}

interface Analysis {
  outcome: string | undefined;
  decisions: number;
  formsReached: number;
  bossHp: number;
  cures: number;
  megaDeathKos: number;
  megaDeathKosOnZombie: string[];
  curagaKos: number;
  formIIISummons: number;
  formIIISwitches: number;
  totalSummons: number;
  breakUses: string[];
  partyReflectForm1: number;
  partyReflectForm23: string[];
  lastPartyDeathAbility: string;
}

function drive(
  seed: number,
  pick: (engine: ReturnType<typeof newEngine>, d: Extract<Decision, { kind: 'player-input' }>) => Command,
  party: FFXPartyBuild = zanarkandBuild,
): Analysis {
  const engine = newEngine(seed, party);
  let outcome: string | undefined;
  let decisions = 0;
  let cures = 0;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    decisions++;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind !== 'player-input') continue;
    const cmd = pick(engine, d);
    if ((cmd as { __cure?: boolean }).__cure) cures++;
    engine.submit(cmd);
  }

  const state = engine.state();
  const partyIds = new Set(
    Object.values(state.combatants)
      .filter((c) => c.side === 'party')
      .map((c) => c.id),
  );

  const a: Analysis = {
    outcome,
    decisions,
    formsReached: 1,
    bossHp: state.combatants['yunalesca']?.hp ?? 0,
    cures,
    megaDeathKos: 0,
    megaDeathKosOnZombie: [],
    curagaKos: 0,
    formIIISummons: 0,
    formIIISwitches: 0,
    totalSummons: 0,
    breakUses: [],
    partyReflectForm1: 0,
    partyReflectForm23: [],
    lastPartyDeathAbility: '',
  };

  let form = 1;
  let lastAbility = '';
  let lastActor = '';
  const zombie = new Set<string>();

  for (const ev of state.log) {
    if (ev.type === 'form-change' && ev.enemyId === 'yunalesca') {
      form = ev.formIndex + 1;
      a.formsReached = Math.max(a.formsReached, form);
    }
    if (ev.type === 'action-start') {
      lastAbility = String(ev.abilityId ?? ev.command.kind ?? '');
      lastActor = ev.actorId;
      if (partyIds.has(ev.actorId) && /break$/i.test(lastAbility)) a.breakUses.push(`form${form}:${ev.actorId}:${lastAbility}`);
    }
    if (ev.type === 'status-add') {
      if (ev.status === 'zombie') zombie.add(ev.targetId);
      if (ev.status === 'reflect' && partyIds.has(ev.targetId)) {
        if (form === 1) a.partyReflectForm1++;
        else a.partyReflectForm23.push(`form${form}:${ev.targetId}:by ${lastActor}/${lastAbility}`);
      }
    }
    if (ev.type === 'status-remove' && ev.status === 'zombie') zombie.delete(ev.targetId);
    if (ev.type === 'summon') {
      a.totalSummons++;
      if (form === 3) a.formIIISummons++;
    }
    if (ev.type === 'switch' && form === 3) a.formIIISwitches++;
    if (ev.type === 'ko') {
      if (lastAbility === 'mega-death') {
        a.megaDeathKos++;
        if (zombie.has(ev.targetId)) a.megaDeathKosOnZombie.push(`${ev.targetId} (form ${form})`);
      }
      if (/curaga|cura|curae/i.test(lastAbility)) a.curagaKos++;
      if (partyIds.has(ev.targetId)) a.lastPartyDeathAbility = lastAbility;
    }
  }
  return a;
}

describe('critic verification', () => {
  for (const seed of SEEDS) {
    it(`naive plain-attack LOSES (seed ${seed})`, () => {
      const a = drive(seed, (_e, d) => naive(d));
      console.log(`NAIVE seed ${seed}:`, JSON.stringify(a));
      expect(a.outcome).toBeDefined();
      expect(a.outcome).not.toBe('victory');
    });
  }

  for (const seed of SEEDS) {
    it(`cure-Zombie-first LOSES, stock inventory (seed ${seed})`, () => {
      const a = drive(seed, (e, d) => {
        const c = cureOnSight(e, d);
        if (c) return Object.assign(c, { __cure: true });
        return intendedStrategy(d.actorId, d.commands, e) ?? attack(d);
      });
      console.log(`CURE-STOCK seed ${seed}:`, JSON.stringify(a));
      expect(a.outcome).toBeDefined();
      expect(a.outcome).not.toBe('victory');
    });
  }

  for (const seed of SEEDS) {
    it(`cure-Zombie-first LOSES, deep cure stock (seed ${seed})`, () => {
      const a = drive(
        seed,
        (e, d) => {
          const c = cureOnSight(e, d);
          if (c) return Object.assign(c, { __cure: true });
          return intendedStrategy(d.actorId, d.commands, e) ?? attack(d);
        },
        deepCureStock(),
      );
      console.log(`CURE-DEEP seed ${seed}:`, JSON.stringify(a));
      expect(a.outcome).toBeDefined();
      expect(a.outcome).not.toBe('victory');
    });
  }

  for (const seed of SEEDS) {
    it(`intended strategy canon audit (seed ${seed})`, () => {
      const a = drive(seed, (e, d) => intendedStrategy(d.actorId, d.commands, e) ?? attack(d));
      console.log(`INTENDED seed ${seed}:`, JSON.stringify(a));
      expect(a.outcome).toBeDefined();
    });
  }
});
