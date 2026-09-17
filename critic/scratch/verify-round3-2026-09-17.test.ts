/** INDEPENDENT VERIFICATION (critic round 3). Read-only: no src/ or tests/ file is touched. */
import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MAX_DECISIONS = 30_000;
const SEEDS = [1, 7, 42, 20260916];
const HUMANS = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'rikku', 'kimahri'];

function newEngine(seed: number, party: FFXPartyBuild = zanarkandBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('no group');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const t = row?.validTargets[0];
  return { kind: 'attack', targets: t ? [t] : [] };
}

function audit(engine: ReturnType<typeof newEngine>) {
  const log = engine.state().log;
  let form = 1;
  let lastAbility = '';
  let lastActor = '';
  const zombie = new Set<string>();
  const out = {
    megaDeathKos: 0,
    megaDeathKosOnZombie: 0,
    megaDeathKoDetail: [] as string[],
    summonsByForm: {} as Record<number, string[]>,
    switchesByForm: {} as Record<number, string[]>,
    breakUses: [] as string[],
    partyReflectByForm: {} as Record<number, string[]>,
    bossReflect: 0,
    partyActionsByAbility: {} as Record<string, number>,
  };
  for (const ev of log) {
    const e = ev as any;
    if (ev.type === 'form-change' && e.enemyId === 'yunalesca') form = e.formIndex + 1;
    if (ev.type === 'status-add') {
      const t = e.targetId as string;
      if (e.status === 'zombie') zombie.add(t);
      if (e.status === 'reflect') {
        if (HUMANS.includes(t)) (out.partyReflectByForm[form] ??= []).push(t);
        else out.bossReflect++;
      }
    }
    if (ev.type === 'status-remove' && e.status === 'zombie') zombie.delete(e.targetId);
    if (ev.type === 'action-start') {
      lastAbility = String(e.abilityId ?? e.command?.kind ?? '');
      lastActor = String(e.actorId ?? '');
      if (HUMANS.includes(lastActor)) {
        out.partyActionsByAbility[lastAbility] = (out.partyActionsByAbility[lastAbility] ?? 0) + 1;
        if (/break/i.test(lastAbility)) out.breakUses.push(`${lastActor}:${lastAbility}`);
      }
    }
    if (ev.type === 'summon') (out.summonsByForm[form] ??= []).push(e.aeonId);
    if (ev.type === 'switch') (out.switchesByForm[form] ??= []).push(`${e.outId}->${e.inId}`);
    if (ev.type === 'ko') {
      const t = e.targetId as string;
      if (lastAbility === 'mega-death') {
        out.megaDeathKos++;
        const wasZombie = zombie.has(t);
        if (wasZombie) out.megaDeathKosOnZombie++;
        out.megaDeathKoDetail.push(`form${form}:${t}${wasZombie ? ':ZOMBIE!' : ':clean'}`);
      }
      zombie.delete(t);
    }
  }
  return out;
}

function run(seed: number, party: FFXPartyBuild, pick: (e: any, d: any) => Command) {
  const engine = newEngine(seed, party);
  let outcome: string | undefined;
  let decisions = 0;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    decisions++;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'player-input') engine.submit(pick(engine, d));
  }
  let forms = 1;
  for (const e of engine.state().log) {
    if (e.type === 'form-change' && (e as any).enemyId === 'yunalesca') forms = Math.max(forms, (e as any).formIndex + 1);
  }
  return { outcome, decisions, forms, bossHp: engine.state().combatants['yunalesca']?.hp ?? 0, engine };
}

const intended = (e: any, d: any) => intendedStrategy(d.actorId, d.commands, e) ?? attack(d);

function cureOnSight(engine: any, d: any): Command | null {
  const state = engine.state();
  const z = state.activeIds
    .map((id: string) => state.combatants[id])
    .find((c: any) => c?.alive && c.statuses['zombie'] !== undefined);
  if (!z) return null;
  const cure: AvailableCommand | undefined = d.commands.find(
    (c: any) => c.enabled && (c.label === 'Holy Water' || c.label === 'Remedy') && c.validTargets.includes(z.id),
  );
  return cure ? ({ ...cure.command, targets: [z.id] } as Command) : null;
}

function deepCureStock(): FFXPartyBuild {
  return { ...zanarkandBuild, inventory: zanarkandBuild.inventory.map((i) => (i.itemId === 'holy-water' ? { ...i, count: 99 } : i)) };
}

const cureFirstPressOn = (e: any, d: any): Command => {
  const c = cureOnSight(e, d);
  if (c) return c;
  const p = intendedStrategy(d.actorId, d.commands, e);
  return (p && p.kind === 'defend' ? attack(d) : p) ?? attack(d);
};

const cureFirstPlain = (e: any, d: any): Command => cureOnSight(e, d) ?? intendedStrategy(d.actorId, d.commands, e) ?? attack(d);

const naive = (e: any, d: any): Command => attack(d);

describe('VERIFY: wrong tactics lose', () => {
  for (const seed of SEEDS) {
    it(`cure-Zombie-first (as shipped test) loses, seed ${seed}`, () => {
      const r = run(seed, deepCureStock(), cureFirstPressOn);
      const a = audit(r.engine);
      console.log(`CURE-99 seed ${seed}: ${r.outcome} forms=${r.forms} bossHp=${r.bossHp} mdKos=${a.megaDeathKos} mdOnZombie=${a.megaDeathKosOnZombie}`);
      expect(r.outcome).not.toBe('victory');
    });
    it(`cure-Zombie-first at SHIPPED inventory, seed ${seed}`, () => {
      const r = run(seed, zanarkandBuild, cureFirstPlain);
      const a = audit(r.engine);
      console.log(`CURE-SHIPPED seed ${seed}: ${r.outcome} forms=${r.forms} bossHp=${r.bossHp} mdKos=${a.megaDeathKos}`);
      expect(r.outcome).toBeDefined();
    });
    it(`naive plain-attack loses, seed ${seed}`, () => {
      const r = run(seed, zanarkandBuild, naive);
      const a = audit(r.engine);
      console.log(`NAIVE seed ${seed}: ${r.outcome} forms=${r.forms} bossHp=${r.bossHp} mdKos=${a.megaDeathKos} decisions=${r.decisions}`);
      expect(r.outcome).not.toBe('victory');
    });
  }
});

describe('VERIFY: the winning log is canon-clean', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed} audit`, () => {
      const r = run(seed, zanarkandBuild, intended);
      const a = audit(r.engine);
      console.log(`WIN seed ${seed}: ${r.outcome} forms=${r.forms} bossHp=${r.bossHp}`);
      console.log(`  megaDeath KOs=${a.megaDeathKos} onZombie=${a.megaDeathKosOnZombie} detail=${JSON.stringify(a.megaDeathKoDetail)}`);
      console.log(`  summonsByForm=${JSON.stringify(a.summonsByForm)} switchesByForm=${JSON.stringify(a.switchesByForm)}`);
      console.log(`  breakUses=${JSON.stringify(a.breakUses)} partyReflectByForm=${JSON.stringify(a.partyReflectByForm)} bossReflect=${a.bossReflect}`);
      if (seed === 1) console.log(`  seed1 party actions: ${JSON.stringify(a.partyActionsByAbility)}`);
      expect(r.outcome).toBe('victory');
    });
  }
});
