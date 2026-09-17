import { describe, it } from 'vitest';
import type { AvailableCommand, Command, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
function mk(seed: number, party: FFXPartyBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.init({ game: 'ffx', party, enemies: ENEMY_GROUPS_BY_ID['yunalesca'], triggers: [], seed, condition: 'normal', canEscape: false });
  return e;
}
function atk(d: any): Command {
  const r = d.commands.find((c: any) => c.command.kind === 'attack' && c.enabled);
  return { kind: 'attack', targets: r?.validTargets[0] ? [r.validTargets[0]] : [] };
}
function cureOnSight(engine: any, d: any): Command | null {
  const st = engine.state();
  const z = st.activeIds.map((i: string) => st.combatants[i]).find((c: any) => c?.alive && c.statuses['zombie'] !== undefined);
  if (!z) return null;
  const c: AvailableCommand | undefined = d.commands.find((x: any) => x.enabled && (x.label === 'Holy Water' || x.label === 'Remedy') && x.validTargets.includes(z.id));
  return c ? ({ ...c.command, targets: [z.id] } as Command) : null;
}
describe('cures + naive cause', () => {
  for (const seed of [1, 7, 42, 20260916]) {
    it(`seed ${seed}`, () => {
      // cure-first at SHIPPED stock: how many cures are physically possible?
      let e = mk(seed, zanarkandBuild);
      let cures = 0, outcome;
      for (let i = 0; i < 30000; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind !== 'player-input') continue;
        const c = cureOnSight(e, d);
        if (c) { cures++; e.submit(c); continue; }
        e.submit(intendedStrategy(d.actorId, d.commands, e) ?? atk(d));
      }
      console.log(`SHIPPED-STOCK seed ${seed}: ${outcome}, cures=${cures}`);
      // naive: what killed it?
      e = mk(seed, zanarkandBuild);
      for (let i = 0; i < 30000; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
        if (d.kind === 'player-input') e.submit(atk(d));
      }
      const log = e.state().log as any[];
      let last = '', kos: string[] = [], selfHeal = 0;
      for (const ev of log) {
        if (ev.type === 'action-start') last = String(ev.abilityId ?? '');
        if (ev.type === 'ko') kos.push(`${ev.targetId}<-${last}`);
        if (ev.type === 'damage' && ev.targetId === 'yunalesca' && ev.amount < 0) selfHeal += -ev.amount;
        if (ev.type === 'heal' && ev.targetId === 'yunalesca') selfHeal += ev.amount;
      }
      console.log(`NAIVE seed ${seed}: ${outcome}, selfHeal=${selfHeal}, partyKOs=${JSON.stringify(kos)}`);
    });
  }
});
