/**
 * fb-0929 guard (Bailey's friend: "Hi potion killed kimahri instead of healing"): **an item heal
 * never lowers HP unless the target is a living Zombie.** FFX only (Zombie is FFX's status;
 * research/ffx-combat-core.md: "HP-restoring items *damage* a Zombie for the same amount; revival
 * items *kill* it").
 *
 * This is not the fix; the engine was already right (the investigation's 400-seed sweep found no
 * counter-example, `docs/handoff/fb-0929-hipotion.md`). It pins that down on Chapter I, with the
 * random restorative policy the investigation used, so a later change to the heal path cannot
 * quietly turn a Hi-Potion into damage on a character who is not a Zombie.
 */
import { describe, expect, it } from 'vitest';
import type { BattleState, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

const RESTORATIVES = ['Potion', 'Hi-Potion', 'X-Potion', 'Mega-Potion', 'Phoenix Down', 'Mega Phoenix', 'Elixir', 'Al Bhed Potion'];

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Chapter I: restoratives on Kimahri and the party (FFX only)', () => {
  it('HP falls, or a KO follows, only on a living Zombie; and a living Zombie is hurt', () => {
    const chapter = getChapter('seymour-flux')!;
    const wrong: string[] = [];
    let zombieUses = 0;
    let uses = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rnd = mulberry(seed * 7919);
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.setSeed(seed);
      engine.init({ game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!, triggers: [], seed, condition: 'normal', canEscape: false } as never);
      for (let i = 0; i < 2000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const state = engine.state() as BattleState;
        const rows = d.commands.filter((c) => c.enabled && c.category === 'item' && RESTORATIVES.includes(c.label) && c.validTargets.length > 0);
        if (rows.length > 0 && rnd() < 0.45) {
          const r = rows[Math.floor(rnd() * rows.length)]!;
          const party = r.validTargets.filter((t) => state.combatants[t]?.side === 'party');
          const pool = party.length > 0 ? party : r.validTargets;
          const one = pool.includes('kimahri') && rnd() < 0.5 ? 'kimahri' : pool[Math.floor(rnd() * pool.length)]!;
          const targets = r.targeting === 'all-allies' ? [...r.validTargets] : [one];
          const before = JSON.parse(JSON.stringify(state)) as BattleState;
          engine.submit({ ...r.command, targets } as Command);
          const after = engine.state() as BattleState;
          for (const t of targets) {
            const b = before.combatants[t] as FFXCombatant;
            const a = after.combatants[t] as FFXCombatant;
            if (b.side !== 'party') continue;
            uses++;
            const livingZombie = b.alive && b.statuses['zombie'] !== undefined;
            const hurt = a.hp < b.hp || (b.alive && !a.alive);
            if (livingZombie) zombieUses++;
            if (hurt !== livingZombie) wrong.push(`seed ${seed} ${r.label} -> ${t}: ${b.hp} -> ${a.hp} (${Object.keys(b.statuses).join(',')})`);
          }
          continue;
        }
        engine.submit(recommendedCommand(state, d) ?? ({ kind: 'defend', targets: [] } as Command));
      }
    }
    expect(uses).toBeGreaterThan(300);
    expect(zombieUses).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  }, 60_000);
});
