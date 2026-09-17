/** Scratch: unbiased win-rate + loss forensics for Chapter 2. */
import { describe, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const N = Number(process.env.N ?? 200);
const START = Number(process.env.START ?? 1);
const SEEDS = process.env.SEEDS
  ? process.env.SEEDS.split(',').map(Number)
  : Array.from({ length: N }, (_, i) => START + i);

const WARD = process.env.WARD ?? '';
const PLAN: Record<string, string[]> = {
  tidus: ['hp-10', 'zombie-ward', 'confuse-ward'],
  yuna: ['magic-def-10', 'magic-def-5', 'zombie-ward', 'confuse-ward'],
  auron: ['hp-10', 'zombie-ward', 'dark-ward', 'confuse-ward'],
};
function variantBuild() {
  if (WARD === 'plan') {
    return {
      ...zanarkandBuild,
      members: zanarkandBuild.members.map((m: any) =>
        PLAN[m.id] ? { ...m, equipment: { ...m.equipment, armor: { ...m.equipment.armor, autoAbilities: PLAN[m.id]! } } } : m,
      ),
    } as any;
  }
  if (!WARD) return zanarkandBuild;
  const add: Record<string, string[]> = {
    tidus: WARD.includes('c') ? ['confuse-ward'] : [],
    yuna: WARD.includes('c') ? ['confuse-ward'] : [],
    auron: WARD.includes('c') ? ['confuse-ward'] : [],
  };
  if (WARD.includes('d')) { add['tidus']!.push('dark-ward'); add['auron']!.push('dark-ward'); add['yuna']!.push('silence-ward'); }
  return {
    ...zanarkandBuild,
    members: zanarkandBuild.members.map((m: any) => {
      if (!add[m.id]) return m;
      let abil: string[] = [...m.equipment.armor.autoAbilities, ...add[m.id]!];
      if (WARD.includes('z')) abil = abil.filter((a) => a !== 'zombie-ward');
      if (WARD.includes('x')) abil = abil.filter((a) => a !== 'death-ward' && a !== 'stone-ward');
      return { ...m, equipment: { ...m.equipment, armor: { ...m.equipment.armor, slots: Math.max(m.equipment.armor.slots, abil.length), autoAbilities: abil } } };
    }),
  } as any;
}

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  return { kind: 'attack', targets: row?.validTargets[0] ? [row.validTargets[0]!] : [] };
}

describe('bench', () => {
  it('win rate', () => {
    let wins = 0;
    const losses: string[] = [];
    let totConfuse = 0;
    let totFriendly = 0;
    const byCause: Record<string, number> = {};
    for (const seed of SEEDS) {
      const content = new FFXContentRegistry();
      content.addAbilities(ALL_ABILITIES);
      content.addItems(Object.values(ITEMS));
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: variantBuild(), enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
      let outcome: string | undefined;
      for (let i = 0; i < 30000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind === 'player-input') engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? attack(d));
      }
      let forms = 1; let lastAb = ''; let lastSrc = ''; let confuse = 0; let friendly = 0; let summons = 0;
      const PARTY = new Set(['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'rikku', 'kimahri']);
      const kos: Record<string, number> = {};
      for (const e of engine.state().log as any[]) {
        if (e.type === 'form-change' && e.enemyId === 'yunalesca') forms = Math.max(forms, e.formIndex + 1);
        if (e.type === 'action-start') { lastAb = String(e.abilityId ?? ''); lastSrc = String(e.sourceId ?? ''); if (e.command?.kind === 'summon' || lastAb === 'summon') summons++; }
        if (e.type === 'status-add' && e.status === 'confuse') confuse++;
        if (e.type === 'damage' && PARTY.has(String(e.targetId)) && PARTY.has(lastSrc) && lastSrc !== String(e.targetId) && e.amount > 0 && lastAb !== 'phoenix-down') friendly += e.amount;
        if (e.type === 'ko' && PARTY.has(String(e.targetId))) kos[lastAb] = (kos[lastAb] ?? 0) + 1;
      }
      totConfuse += confuse; totFriendly += friendly;
      const hp = engine.state().combatants['yunalesca']!.hp;
      if (outcome === 'victory') wins++;
      else {
        for (const [k, v] of Object.entries(kos)) byCause[k] = (byCause[k] ?? 0) + v;
        losses.push(`${seed}:f${forms}:${hp}:cf${confuse}:ff${friendly}:s${summons}`);
      }
    }
    console.log(`WINS ${wins}/${SEEDS.length} = ${(100 * wins / SEEDS.length).toFixed(1)}%  confuse/run ${(totConfuse / SEEDS.length).toFixed(1)}  friendlyFire/run ${(totFriendly / SEEDS.length).toFixed(0)}`);
    console.log('KO causes in losses:', JSON.stringify(byCause));
    console.log('LOSSES', losses.slice(0, 60).join(' '));
  });
});
