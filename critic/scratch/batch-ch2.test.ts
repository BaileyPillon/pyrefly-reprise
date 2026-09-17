/** Scratch: win rate of the shipped strategy over many seeds. */
import { describe, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = (process.env.SEEDS ?? Array.from({ length: 96 }, (_, i) => 1 + i * 37).join(','))
  .split(',').map(Number);

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  return { kind: 'attack', targets: row?.validTargets[0] ? [row.validTargets[0]!] : [] };
}

describe('batch', () => {
  it('win rate', () => {
    const lines: string[] = [];
    let wins = 0;
    for (const seed of SEEDS) {
      const content = new FFXContentRegistry();
      content.addAbilities(ALL_ABILITIES);
      content.addItems(Object.values(ITEMS));
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
      let outcome: string | undefined;
      let decisions = 0;
      for (let i = 0; i < 30000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind === 'player-input') { decisions++; engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? attack(d)); }
      }
      let forms = 1;
      let megaKos = 0; let lastAb = ''; let summons = 0; let confuseAdds = 0; let triples = 0; const burst = new Set<string>();
      const pd = { 1: 0, 2: 0, 3: 0 } as Record<number, number>;
      let f = 1;
      for (const e of engine.state().log as any[]) {
        if (e.type === 'form-change' && e.enemyId === 'yunalesca') { forms = Math.max(forms, e.formIndex + 1); f = e.formIndex + 1; }
        if (e.type === 'action-start') {
          lastAb = String(e.abilityId ?? '');
          if (String(e.abilityName ?? '') === 'Summon' || String(e.abilityId ?? '') === 'summon') summons++;
          if (lastAb === 'phoenix-down') pd[f] = (pd[f] ?? 0) + 1;
        }
        if (e.type === 'ko' && lastAb === 'mega-death') megaKos++;
        if (e.type === 'status-add' && e.status === 'confuse') { confuseAdds++; burst.add(e.targetId); }
        if (e.type === 'action-start') { if (burst.size >= 3) triples++; burst.clear(); }
      }
      const hp = engine.state().combatants['yunalesca']!.hp;
      if (outcome === 'victory') wins++;
      lines.push(`${seed}${outcome === 'victory' ? 'W' : 'L' + hp}`);
    }
    console.log(`WINS ${wins}/${SEEDS.length} :: ${lines.join(' ')}`);
  });
});
