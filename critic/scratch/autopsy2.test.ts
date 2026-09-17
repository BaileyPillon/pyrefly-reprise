/** Scratch: per-form autopsy of the shipped intended strategy vs Yunalesca. */
import { describe, it } from 'vitest';
import type { Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = (process.env.SEEDS ?? '1,7,42,20260916').split(',').map(Number);
const TAIL = Number(process.env.TAIL ?? 0);

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

describe('autopsy', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}`, () => {
      const content = new FFXContentRegistry();
      content.addAbilities(ALL_ABILITIES);
      content.addItems(Object.values(ITEMS));
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });

      let outcome: string | undefined;
      let turns = 0;
      const byForm: Record<number, Record<string, number>> = { 1: {}, 2: {}, 3: {} };
      const picks: string[] = [];
      for (let i = 0; i < 30000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind === 'player-input') {
          turns++;
          const cmd = intendedStrategy(d.actorId, d.commands, engine);
          const boss = engine.state().combatants['yunalesca'] as FFXCombatant;
          const f = (boss.enemy?.formIndex ?? 0) + 1;
          const label = cmd ? ('id' in cmd ? String(cmd.id) : cmd.kind) : 'DECLINED';
          byForm[f]![`${d.actorId}:${label}`] = (byForm[f]![`${d.actorId}:${label}`] ?? 0) + 1;
          picks.push(`[F${f} hp${boss.hp}] ${d.actorId} -> ${label} @${(cmd?.targets ?? []).join(',')}`);
          engine.submit(cmd ?? attack(d));
        }
      }

      const log = engine.state().log as Array<Record<string, any>>;
      let form = 1;
      const dmg: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      const healed: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      const ko: Record<number, string[]> = { 1: [], 2: [], 3: [] };
      const herActions: Record<number, Record<string, number>> = { 1: {}, 2: {}, 3: {} };
      let lastAbility = '', lastActor = '';
      const tail: string[] = [];
      for (const ev of log) {
        if (ev.type === 'form-change' && ev.enemyId === 'yunalesca') form = ev.formIndex + 1;
        if (ev.type === 'action-start') {
          lastAbility = String(ev.abilityName ?? ev.abilityId ?? ev.command?.kind ?? '?');
          lastActor = ev.actorId;
          if (ev.actorId === 'yunalesca') herActions[form]![lastAbility] = (herActions[form]![lastAbility] ?? 0) + 1;
        }
        if (ev.type === 'damage' && ev.targetId === 'yunalesca') {
          if (ev.amount > 0) dmg[form]! += ev.amount; else healed[form]! += -ev.amount;
        }
        if (ev.type === 'heal' && ev.targetId === 'yunalesca') healed[form]! += ev.amount ?? 0;
        if (ev.type === 'ko' && ev.targetId !== 'yunalesca') ko[form]!.push(`${ev.targetId}<-${lastActor}:${lastAbility}`);
      }
      let f3 = log.findIndex((e: any) => e.type === 'form-change' && e.formIndex === 2);
      if (f3 < 0) f3 = Math.max(0, log.length - 600);
      for (const ev of log.slice(f3)) {
        if (ev.type === 'action-start') tail.push(`  ${ev.actorId} uses ${ev.abilityName ?? (ev.command as any)?.kind} -> ${(ev.targets ?? []).join(',')}`);
        else if (ev.type === 'damage') tail.push(`    dmg ${ev.targetId} ${ev.amount}`);
        else if (ev.type === 'heal') tail.push(`    heal ${ev.targetId} +${ev.amount} (${ev.cause})`);
        else if (ev.type === 'ko') tail.push(`    *** KO ${ev.targetId}`);
        else if (ev.type === 'revive') tail.push(`    revive ${ev.targetId} hp${ev.hp}`);
        else if (ev.type === 'status-add') tail.push(`    +${ev.status} ${ev.targetId}`);
        else if (ev.type === 'status-remove') tail.push(`    -${ev.status} ${ev.targetId} (${ev.reason})`);
        else if (ev.type === 'miss') tail.push(`    miss ${ev.sourceId}->${ev.targetId} (${ev.reason})`);
        else if (ev.type === 'form-change') tail.push(`== FORM ${ev.formIndex + 1}`);
      }
      const st = engine.state();
      const inv = Object.fromEntries((st.inventory ?? []).map((e: any) => [e.itemId, e.count]));
      console.log(`\n### seed ${seed} outcome=${outcome} turns=${turns} bossHp=${st.combatants['yunalesca']!.hp}`);
      console.log('dmg', JSON.stringify(dmg), 'healedHer', JSON.stringify(healed));
      for (const f of [1, 2, 3]) {
        console.log(`F${f} party:`, JSON.stringify(byForm[f]));
        console.log(`F${f} her:`, JSON.stringify(herActions[f]));
        console.log(`F${f} KOs:`, JSON.stringify(ko[f]));
      }
      console.log('inventory left:', JSON.stringify(inv));
      if (TAIL) { console.log('--- F3 tail ---'); console.log(tail.slice(0, TAIL).join('\n')); }
    });
  }
});
