/**
 * The enemy-intent slab's Provoked line says what the engine does (FFX only: `src/battle/ffx/intent.ts`; FFX-2's intent code is a different file and has no such line).
 *
 * Since re-parity RC9 slice G-c a monster whose record's forced-action word is 0 (nearly every boss of the story chapters: `kernel/forced-action-table.ts`) has no default attack, so its
 * Provoked turn is dropped (`forced-turn.ts`). The slab used to say "it spends its turn attacking whoever provoked it" for every monster. It still says so for a monster that has a default
 * attack, says that the turn is lost for one that has none, and says nothing for a monster that keeps control of its script when Provoked (`adapt/target-world.ts#keepsControlWhenProvoked`).
 */
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { BattleEvent, EnemyGroupDef, FFXCombatant, StatusInstance } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle } from '../../src/battle/ffx/index.ts';
import { defaultAttackOf } from '../../src/battle/ffx/adapt/target-world.ts';
import { predictEnemyIntent } from '../../src/battle/ffx/intent.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { lastSummoningGroup } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { linkGroupId } from '../../src/data/ffx/last-summoning-ids.ts';

function ctxOf(group: EnemyGroupDef, seed: number): Ctx {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  let seq = 0;
  return buildBattle({ game: 'ffx', party: gagazetBuild, enemies: group, triggers: [], seed, condition: 'scripted', canEscape: false }, new SeededRng(seed), reg, (e) => {
    void ({ ...e, seq: seq++ } as BattleEvent);
  });
}

/** Provoke the enemy (the provoker is the first party member) and read the slab's notes. */
function provokedNotes(ctx: Ctx, enemyId: string): string {
  const enemy = ctx.state.combatants[enemyId] as FFXCombatant;
  const provoke: StatusInstance = { id: 'provoke', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, sourceId: ctx.state.activeIds[0] };
  enemy.statuses['provoke'] = provoke;
  return predictEnemyIntent(ctx, enemyId)!.notes.join(' | ');
}

const PROVOKED = /^Provoked — /m;

describe('the Provoked line of the enemy-intent slab', () => {
  it('says a boss with no default attack of its own loses its turn (Seymour Flux: word 0)', () => {
    const ctx = ctxOf(ENEMY_GROUPS_BY_ID['seymour-flux']!, 7);
    expect(defaultAttackOf(ctx.state.combatants['seymour-flux'] as FFXCombatant)).toBe(0);
    const notes = provokedNotes(ctx, 'seymour-flux');
    expect(notes).toContain('Provoked — it has no attack of its own, so it loses its turn');
    expect(notes).not.toContain('attacking whoever provoked it');
  });

  it('still says a monster with a default attack spends its turn on the provoker (an aeon of the Last Summoning the game record is not matched for: 0x3000)', () => {
    const ctx = ctxOf(lastSummoningGroup(linkGroupId(['ifrit']))!, 3);
    expect(defaultAttackOf(ctx.state.combatants['possessed-ifrit'] as FFXCombatant)).toBe(0x3000);
    const notes = provokedNotes(ctx, 'possessed-ifrit');
    expect(notes).toContain('Provoked — it spends its turn attacking whoever provoked it');
    expect(notes).not.toContain('loses its turn');
  });

  it('says nothing for a monster that keeps control of its script when Provoked (Braska’s Final Aeon)', () => {
    const ctx = ctxOf(ENEMY_GROUPS_BY_ID['braskas-final-aeon']!, 4);
    expect(provokedNotes(ctx, 'braskas-final-aeon')).not.toMatch(PROVOKED);
  });
});
