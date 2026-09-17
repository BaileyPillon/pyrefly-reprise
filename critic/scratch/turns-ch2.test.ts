/** Scratch: what party turns in each form are spent on. */
import { describe, it } from 'vitest';
import type { Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = (process.env.SEEDS ?? '1,5,12').split(',').map(Number);

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  return { kind: 'attack', targets: row?.validTargets[0] ? [row.validTargets[0]!] : [] };
}

describe('turns', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}`, () => {
      const content = new FFXContentRegistry();
      content.addAbilities(ALL_ABILITIES);
      content.addItems(Object.values(ITEMS));
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
      const byForm: Record<number, Record<string, number>> = { 1: {}, 2: {}, 3: {} };
      let outcome: string | undefined;
      let mpMin = 999;
      for (let i = 0; i < 30000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind !== 'player-input') continue;
        const boss = engine.state().combatants['yunalesca'] as FFXCombatant;
        const f = (boss.enemy?.formIndex ?? 0) + 1;
        const cmd = intendedStrategy(d.actorId, d.commands, engine);
        const label = cmd ? ('id' in cmd ? String((cmd as any).id) : cmd.kind) : 'DECLINED';
        const key = `${d.actorId}:${label}`;
        byForm[f]![key] = (byForm[f]![key] ?? 0) + 1;
        const yy = engine.state().combatants['yuna'];
        if (yy && yy.alive) mpMin = Math.min(mpMin, yy.mp);
        engine.submit(cmd ?? attack(d));
      }
      const st = engine.state();
      console.log(`\n### seed ${seed} ${outcome} hp=${st.combatants['yunalesca']!.hp} yunaMPmin=${mpMin}`);
      for (const f of [1,2,3]) {
        const e = Object.entries(byForm[f]!).sort((a,b)=>b[1]-a[1]);
        console.log(` F${f} (${e.reduce((s,x)=>s+x[1],0)} turns): ${e.map(([k,v])=>`${k}=${v}`).join(' ')}`);
      }
    });
  }
});
