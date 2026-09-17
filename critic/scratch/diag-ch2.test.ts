/** Scratch diagnostic: where does the intended strategy die against Yunalesca? */
import { describe, it } from 'vitest';
import type { Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = (process.env.SEEDS ?? '1,7,42,20260916').split(',').map(Number);
const TAIL = Number(process.env.TAIL ?? 0);

function newEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: zanarkandBuild, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

describe('diag', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}`, () => {
      const engine = newEngine(seed);
      const picks: string[] = [];
      let outcome: string | undefined;
      let decisions = 0;
      for (let i = 0; i < 30000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind === 'player-input') {
          decisions++;
          const cmd = intendedStrategy(d.actorId, d.commands, engine);
          const boss = engine.state().combatants['yunalesca'] as FFXCombatant;
          const label = cmd ? (('id' in cmd ? String(cmd.id) : cmd.kind)) : 'DECLINED';
          picks.push(`[F${(boss.enemy?.formIndex ?? 0) + 1} hp${boss.hp}] ${d.actorId} -> ${label} @${(cmd?.targets ?? []).join(',')}`);
          engine.submit(cmd ?? attack(d));
        }
      }
      // damage attribution
      const party = new Set(['tidus','yuna','auron','wakka','lulu','kimahri','rikku']);
      let form = 1;
      const dmgToHerByForm: Record<number, number> = {1:0,2:0,3:0};
      const healHerByForm: Record<number, number> = {1:0,2:0,3:0};
      const koByForm: Record<number, number> = {1:0,2:0,3:0};
      const perAbility: Record<string, {n:number; total:number}> = {};
      const partyDmgBySrcAbility: Record<string, {n:number; total:number}> = {};
      let lastAbility = '';
      let lastActor = '';
      const tail: string[] = [];
      const log = engine.state().log as Array<Record<string, any>>;
      for (const ev of log) {
        if (ev.type === 'form-change' && ev.enemyId === 'yunalesca') form = ev.formIndex + 1;
        if (ev.type === 'action-start') { lastAbility = String(ev.abilityName ?? ev.abilityId ?? ev.command?.kind ?? '?'); lastActor = ev.actorId; }
        if (ev.type === 'damage' && ev.targetId === 'yunalesca') {
          if (ev.amount > 0) { dmgToHerByForm[form]! += ev.amount;
            const k = `${lastActor}:${lastAbility}`;
            perAbility[k] ??= {n:0,total:0}; perAbility[k].n++; perAbility[k].total += ev.amount;
          } else healHerByForm[form]! += -ev.amount;
        }
        if (ev.type === 'heal' && ev.targetId === 'yunalesca') healHerByForm[form]! += ev.amount ?? 0;
        if (ev.type === 'ko' && party.has(ev.targetId)) {
          koByForm[form]! += 1;
          const k = `F${form} ${lastActor}:${lastAbility}`;
          partyDmgBySrcAbility[k] ??= {n:0,total:0}; partyDmgBySrcAbility[k].n++;
        }
      }
      // tail of log (form III)
      let f3 = log.findIndex((e:any) => e.type === 'form-change' && e.formIndex === 2);
      if (f3 < 0) f3 = Math.max(0, log.length - 400);
      for (const ev of log.slice(f3)) {
        if (ev.type === 'action-start') tail.push(`  ${ev.actorId} uses ${ev.abilityName ?? (ev.command as any)?.kind} -> ${(ev.targets??[]).join(',')}`);
        else if (ev.type === 'damage') tail.push(`    dmg ${ev.targetId} ${ev.amount}`);
        else if (ev.type === 'heal') tail.push(`    heal ${ev.targetId} +${ev.amount} (${ev.cause})`);
        else if (ev.type === 'ko') tail.push(`    *** KO ${ev.targetId}`);
        else if (ev.type === 'revive') tail.push(`    revive ${ev.targetId} hp${ev.hp}`);
        else if (ev.type === 'status-add') tail.push(`    +${ev.status} ${ev.targetId}`);
        else if (ev.type === 'status-remove') tail.push(`    -${ev.status} ${ev.targetId} (${ev.reason})`);
        else if (ev.type === 'miss') tail.push(`    miss ${ev.sourceId}->${ev.targetId} (${ev.reason})`);
        else if (ev.type === 'form-change') tail.push(`== FORM ${ev.formIndex+1}`);
      }
      const st = engine.state();
      console.log(`\n### seed ${seed} outcome=${outcome} decisions=${decisions} formsReached=${form} bossHp=${st.combatants['yunalesca']!.hp}`);
      console.log('dmgToHer', JSON.stringify(dmgToHerByForm), 'healedHer', JSON.stringify(healHerByForm), 'partyKO', JSON.stringify(koByForm));
      console.log('party damage sources:', JSON.stringify(perAbility));
      console.log('KO credited to:', JSON.stringify(partyDmgBySrcAbility));
      if (TAIL) {
        console.log('--- last picks ---'); console.log(picks.slice(-TAIL).join('\n'));
        console.log('--- form III log tail ---'); console.log(tail.slice(-TAIL*4).join('\n'));
      }
    });
  }
});
