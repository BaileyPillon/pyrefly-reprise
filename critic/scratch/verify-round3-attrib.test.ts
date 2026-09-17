/**
 * Correct Mega Death attribution: only KOs BETWEEN an `action-start`(mega-death)
 * and its matching `action-end` are Mega Death's. The shipped test's
 * `lastAbility` heuristic never resets on `action-end`, so it credits Mega Death
 * with every later KO until the next action-start. Read-only.
 */
import { describe, it } from 'vitest';
import type { AvailableCommand, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = [1, 7, 42, 20260916];

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

/** True Mega Death KOs, plus whether the victim was Zombie in live state just before. */
function drive(seed: number, party: FFXPartyBuild, pick: (e: any, d: any) => Command) {
  const engine = newEngine(seed, party);
  const snaps: { at: number; z: Record<string, boolean> }[] = [];
  let outcome: string | undefined;
  for (let i = 0; i < 30_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
    if (d.kind === 'player-input') {
      const st = engine.state();
      const z: Record<string, boolean> = {};
      for (const id of st.activeIds) z[id] = st.combatants[id]?.statuses['zombie'] !== undefined;
      snaps.push({ at: st.log.length, z });
      engine.submit(pick(engine, d));
    }
  }
  const log = engine.state().log as any[];
  let inMega = false;
  let trueKos = 0;
  let onZombie = 0;
  const detail: string[] = [];
  let naiveKos = 0;
  let lastAbility = '';
  log.forEach((e, i) => {
    if (e.type === 'action-start') {
      lastAbility = String(e.abilityId ?? '');
      inMega = lastAbility === 'mega-death';
    }
    if (e.type === 'action-end') inMega = false;
    if (e.type === 'ko') {
      if (lastAbility === 'mega-death') naiveKos++;
      if (inMega) {
        trueKos++;
        const s = [...snaps].reverse().find((x) => x.at <= i);
        const wasZ = s?.z[e.targetId] === true;
        if (wasZ) onZombie++;
        detail.push(`${e.targetId}${wasZ ? ':ZOMBIE' : ':clean'}`);
      }
    }
  });
  return { outcome, trueKos, onZombie, naiveKos, detail, bossHp: engine.state().combatants['yunalesca']?.hp ?? 0 };
}

const intended = (e: any, d: any) => intendedStrategy(d.actorId, d.commands, e) ?? attack(d);
function cureOnSight(engine: any, d: any): Command | null {
  const st = engine.state();
  const z = st.activeIds.map((id: string) => st.combatants[id]).find((c: any) => c?.alive && c.statuses['zombie'] !== undefined);
  if (!z) return null;
  const cure: AvailableCommand | undefined = d.commands.find(
    (c: any) => c.enabled && (c.label === 'Holy Water' || c.label === 'Remedy') && c.validTargets.includes(z.id),
  );
  return cure ? ({ ...cure.command, targets: [z.id] } as Command) : null;
}
const cureFirstPressOn = (e: any, d: any): Command => {
  const c = cureOnSight(e, d);
  if (c) return c;
  const p = intendedStrategy(d.actorId, d.commands, e);
  return (p && p.kind === 'defend' ? attack(d) : p) ?? attack(d);
};
function deepCureStock(): FFXPartyBuild {
  return { ...zanarkandBuild, inventory: zanarkandBuild.inventory.map((i) => (i.itemId === 'holy-water' ? { ...i, count: 99 } : i)) };
}
function zombieproofBuild(): FFXPartyBuild {
  return {
    ...zanarkandBuild,
    members: zanarkandBuild.members.map((m) =>
      zanarkandBuild.activeSlots.includes(m.id)
        ? { ...m, equipment: { ...m.equipment, armor: { ...m.equipment.armor!, autoAbilities: ['zombieproof'] } } }
        : m,
    ),
  };
}

describe('true Mega Death attribution', () => {
  for (const s of SEEDS) {
    it(`seed ${s}`, () => {
      const w = drive(s, zanarkandBuild, intended);
      console.log(`WIN      seed ${s}: ${w.outcome} trueMegaDeathKos=${w.trueKos} onZombie=${w.onZombie} (shippedHeuristicWouldSay=${w.naiveKos}) ${JSON.stringify(w.detail)}`);
      const c = drive(s, deepCureStock(), cureFirstPressOn);
      console.log(`CURE-99  seed ${s}: ${c.outcome} bossHp=${c.bossHp} trueMegaDeathKos=${c.trueKos} onZombie=${c.onZombie} (shippedHeuristicWouldSay=${c.naiveKos}) ${JSON.stringify(c.detail)}`);
      const z = drive(s, zombieproofBuild(), intended);
      console.log(`ZPROOF   seed ${s}: ${z.outcome} bossHp=${z.bossHp} trueMegaDeathKos=${z.trueKos} (shippedHeuristicWouldSay=${z.naiveKos}) ${JSON.stringify(z.detail)}`);
    });
  }
});
