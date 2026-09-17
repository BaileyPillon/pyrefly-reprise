/**
 * CRITIC VERIFICATION (read-only w.r.t. shipped code).
 *
 * 1. Naive plain-attack strategy must LOSE on the gate seeds.
 * 2. "Cure Zombie on sight" (item-based, stock inventory) — measured, reported.
 * 3. "Cure Zombie on sight" with an unlimited Holy Water stock — the sustained
 *    version §10.1 forbids. Must LOSE.
 * 4. Seed 1 winning log audit: Mega Death vs living Zombies, Form III aeon /
 *    switch, Break skills, party Reflect by form.
 */
import { describe, it } from 'vitest';
import type { AvailableCommand, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { attackStrategy, intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = [1, 7, 42, 20260916];
const MAX = 30_000;

function newEngine(seed: number, build: FFXPartyBuild = zanarkandBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: build, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

function run(seed: number, pick: (d: Extract<Decision, { kind: 'player-input' }>, engine: any) => Command | null, build?: FFXPartyBuild) {
  const engine = newEngine(seed, build);
  let outcome: string | undefined;
  let decisions = 0;
  for (let i = 0; i < MAX; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
    if (d.kind === 'player-input') { decisions++; engine.submit(pick(d, engine) ?? attack(d)); }
  }
  const st = engine.state();
  let forms = 1;
  for (const ev of st.log as any[]) if (ev.type === 'form-change' && ev.enemyId === 'yunalesca') forms = Math.max(forms, ev.formIndex + 1);
  return { outcome, decisions, forms, bossHp: st.combatants['yunalesca']?.hp, engine };
}

/** Wrap the shipped strategy: cure any Zombie on sight with Holy Water / Remedy. */
function cureZombieFirst(d: Extract<Decision, { kind: 'player-input' }>, engine: any): Command | null {
  const st = engine.state();
  const zombie = Object.values(st.combatants).find(
    (c: any) => c.side === 'party' && c.alive && !c.removed && c.statuses['zombie'] !== undefined,
  ) as any;
  if (zombie) {
    const row = d.commands.find((c: AvailableCommand) => {
      if (!c.enabled) return false;
      const id = 'id' in c.command ? String(c.command.id) : '';
      return (/holy.?water|remedy/i.test(id) || /holy ?water|remedy/i.test(c.label)) && c.validTargets.includes(zombie.id);
    });
    if (row) return { ...row.command, targets: [zombie.id] } as Command;
  }
  return intendedStrategy(d.actorId, d.commands, engine);
}

function bigStock(): FFXPartyBuild {
  return {
    ...zanarkandBuild,
    inventory: zanarkandBuild.inventory.map((s) => (s.itemId === 'holy-water' ? { ...s, count: 99 } : s)),
  };
}

describe('critic verification', () => {
  it('naive plain-attack loses on every gate seed', () => {
    for (const seed of SEEDS) {
      const r = run(seed, (d, e) => attackStrategy(d.actorId, d.commands, e));
      console.log(`ATTACK seed ${seed}: ${JSON.stringify({ outcome: r.outcome, decisions: r.decisions, forms: r.forms, bossHp: r.bossHp })}`);
    }
  });

  it('cure-Zombie-first, stock inventory', () => {
    for (const seed of SEEDS) {
      const r = run(seed, cureZombieFirst);
      console.log(`CURE-STOCK seed ${seed}: ${JSON.stringify({ outcome: r.outcome, decisions: r.decisions, forms: r.forms, bossHp: r.bossHp })}`);
    }
  });

  it('cure-Zombie-first, 99 Holy Waters (the sustained version)', () => {
    for (const seed of SEEDS) {
      const r = run(seed, cureZombieFirst, bigStock());
      console.log(`CURE-99 seed ${seed}: ${JSON.stringify({ outcome: r.outcome, decisions: r.decisions, forms: r.forms, bossHp: r.bossHp })}`);
    }
  });

  it('audits the seed 1 winning log', () => {
    const r = run(1, (d, e) => intendedStrategy(d.actorId, d.commands, e));
    console.log(`WIN seed 1: ${JSON.stringify({ outcome: r.outcome, forms: r.forms, bossHp: r.bossHp })}`);
    const log = r.engine.state().log as any[];

    // Track form + who is Zombie over time by replaying status events.
    let form = 1;
    let lastAbility = '';
    let lastActor = '';
    const zombies = new Set<string>();
    const megaDeathKos: string[] = [];
    const megaDeathKoOnZombie: string[] = [];
    const summonsByForm: Record<number, string[]> = { 1: [], 2: [], 3: [] };
    const switchesByForm: Record<number, string[]> = { 1: [], 2: [], 3: [] };
    const breaks: string[] = [];
    const partyReflectByForm: Record<number, string[]> = { 1: [], 2: [], 3: [] };
    const abilityUse: Record<string, number> = {};
    const partySide = new Set(
      Object.values(r.engine.state().combatants)
        .filter((c: any) => c.side === 'party')
        .map((c: any) => c.id as string),
    );

    for (const ev of log) {
      if (ev.type === 'form-change' && ev.enemyId === 'yunalesca') form = ev.formIndex + 1;
      if (ev.type === 'action-start') {
        lastAbility = String(ev.abilityId ?? ev.command?.kind ?? ev.abilityName ?? '?');
        lastActor = String(ev.actorId ?? '?');
        abilityUse[lastAbility] = (abilityUse[lastAbility] ?? 0) + 1;
        if (/^(armor|mental|magic|power)-break$|break/i.test(lastAbility) && partySide.has(lastActor)) breaks.push(`F${form} ${lastActor} ${lastAbility}`);
        if (ev.command?.kind === 'summon' || /^summon/i.test(lastAbility)) summonsByForm[form]!.push(`${lastActor}:${lastAbility}:${JSON.stringify(ev.command ?? {})}`);
        if (ev.command?.kind === 'switch' || /switch/i.test(lastAbility)) switchesByForm[form]!.push(`${lastActor}:${lastAbility}`);
      }
      if (ev.type === 'status-add') {
        const sid = String(ev.statusId ?? ev.status ?? '');
        const tid = String(ev.targetId ?? '');
        if (sid === 'zombie') zombies.add(tid);
        if (sid === 'reflect' && partySide.has(tid)) partyReflectByForm[form]!.push(`${tid} by ${lastActor}`);
      }
      if (ev.type === 'status-remove') {
        const sid = String(ev.statusId ?? ev.status ?? '');
        if (sid === 'zombie') zombies.delete(String(ev.targetId ?? ''));
      }
      if (ev.type === 'ko') {
        const tid = String(ev.targetId ?? ev.combatantId ?? '');
        if (lastAbility === 'mega-death') {
          megaDeathKos.push(`F${form} ${tid}${zombies.has(tid) ? ' (ZOMBIE!)' : ''}`);
          if (zombies.has(tid)) megaDeathKoOnZombie.push(tid);
        }
        zombies.delete(tid);
      }
      if (ev.type === 'revive' || ev.type === 'raise') { /* zombie persists per contract; ignore */ }
    }

    console.log('RAW status-add sample: ' + JSON.stringify(log.filter((e:any)=>e.type==='status-add').slice(0,3)));
    console.log('RAW reflect events: ' + JSON.stringify(log.filter((e:any)=>JSON.stringify(e).includes('reflect'))));
    console.log('RAW mega-death window: ' + JSON.stringify(log.map((e:any,i:number)=>[i,e]).filter(([i,e]:any)=>e.type==='action-start'&&String(e.abilityId)==='mega-death').map(([i]:any)=>log.slice(i,i+8))));
    console.log('RAW grand-summon: ' + JSON.stringify(log.filter((e:any)=>String(e.abilityId||'').includes('summon')||String(e.command&&e.command.kind||'').includes('summon')).slice(0,20)));
    console.log('EVENT TYPES: ' + JSON.stringify([...new Set(log.map((e: any) => e.type))]));
    console.log('MEGA DEATH KOs: ' + JSON.stringify(megaDeathKos));
    console.log('MEGA DEATH ON LIVING ZOMBIE: ' + JSON.stringify(megaDeathKoOnZombie));
    console.log('SUMMONS: ' + JSON.stringify(summonsByForm));
    console.log('SWITCHES: ' + JSON.stringify(switchesByForm));
    console.log('BREAKS: ' + JSON.stringify(breaks));
    console.log('PARTY REFLECT BY FORM: ' + JSON.stringify(partyReflectByForm));
    console.log('ABILITY USE: ' + JSON.stringify(Object.entries(abilityUse).sort((a, b) => b[1] - a[1])));
  });
});

describe('critic verification part 2', () => {
  it('proves the cure wrapper really fires, and locates the Form II boundary', () => {
    for (const seed of SEEDS) {
      const r = run(seed, cureZombieFirst, bigStock());
      const log = r.engine.state().log as any[];
      let hw = 0, rem = 0, mdKo = 0, last = '';
      const zom = new Set<string>();
      let zombieCuredEvents = 0;
      for (const ev of log) {
        if (ev.type === 'action-start') {
          last = String(ev.abilityId ?? ev.command?.id ?? '');
          if (last === 'holy-water') hw++;
          if (last === 'remedy') rem++;
        }
        if (ev.type === 'status-add' && ev.status === 'zombie') zom.add(String(ev.targetId));
        if (ev.type === 'status-remove' && ev.status === 'zombie') { zom.delete(String(ev.targetId)); zombieCuredEvents++; }
        if (ev.type === 'ko' && last === 'mega-death') mdKo++;
      }
      console.log(`CURE99-DETAIL seed ${seed}: ${JSON.stringify({ outcome: r.outcome, holyWaterUses: hw, remedyUses: rem, zombieRemovals: zombieCuredEvents, megaDeathKos: mdKo, bossHp: r.bossHp })}`);
    }
  });

  it('shows the seed 1 form boundaries vs the reflect dispels', () => {
    const r = run(1, (d, e) => intendedStrategy(d.actorId, d.commands, e));
    const log = r.engine.state().log as any[];
    const marks = log
      .map((e: any, i: number) => ({ i, e }))
      .filter(({ e }: any) => e.type === 'form-change' || (e.type === 'status-remove' && e.status === 'reflect') || (e.type === 'status-add' && e.status === 'reflect'))
      .map(({ e }: any) => `${e.seq}:${e.type}:${e.status ?? e.formIndex}:${e.targetId ?? e.enemyId}`);
    console.log('SEED1 FORM/REFLECT TIMELINE: ' + JSON.stringify(marks));
  });
});

describe('critic verification part 3', () => {
  it('dumps the Form II window while party Reflect is still up (seed 1)', () => {
    const r = run(1, (d, e) => intendedStrategy(d.actorId, d.commands, e));
    const log = r.engine.state().log as any[];
    const win = log.filter((e: any) => e.seq >= 373 && e.seq <= 412);
    for (const e of win) console.log('SEQ ' + JSON.stringify(e));
  });
});
