/** Was Tidus REALLY Zombie when Mega Death killed him on seed 42? Log-truth, read-only. */
import { describe, it } from 'vitest';
import type { Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

function newEngine(seed: number, party: FFXPartyBuild = zanarkandBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}
function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const t = row?.validTargets[0];
  return { kind: 'attack', targets: t ? [t] : [] };
}

/**
 * Drives the shipped strategy and, at EVERY player-input decision, reads live
 * engine state for who is alive + Zombie. Then, for each Mega Death KO in the
 * log, reports the LAST live snapshot taken before it.
 */
function run(seed: number) {
  const engine = newEngine(seed);
  const snaps: { at: number; who: Record<string, string> }[] = [];
  for (let i = 0; i < 30_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') {
      const st = engine.state();
      const who: Record<string, string> = {};
      for (const id of st.activeIds) {
        const c = st.combatants[id];
        if (c) who[id] = `${c.alive ? 'alive' : 'dead'}/${c.statuses['zombie'] ? 'ZOMBIE' : 'clean'}/hp${c.hp}`;
      }
      snaps.push({ at: st.log.length, who });
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? attack(d));
    }
  }
  const log = engine.state().log as any[];
  let lastAbility = '';
  log.forEach((e, i) => {
    if (e.type === 'action-start') lastAbility = String(e.abilityId ?? '');
    if (e.type === 'ko' && lastAbility === 'mega-death') {
      const s = [...snaps].reverse().find((x) => x.at <= i);
      console.log(`seed ${seed} MEGA-DEATH KO of ${e.targetId} at log[${i}]; last live snapshot log[${s?.at}]: ${JSON.stringify(s?.who)}`);
    }
  });
  // every zombie status event for the actives, to see the churn
  const z = log.filter((e) => (e.type === 'status-add' || e.type === 'status-remove') && e.status === 'zombie');
  console.log(`seed ${seed} zombie events: ${z.length}; last 6: ${JSON.stringify(z.slice(-6).map((e) => `${e.type}:${e.targetId}:${e.reason ?? ''}`))}`);
}

describe('probe2', () => {
  for (const s of [1, 7, 42, 20260916]) it(`seed ${s}`, () => run(s));
});
