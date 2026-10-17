/**
 * The enemy-intent slab's Berserk and Confuse lines say what the engine does (FFX only: `src/battle/ffx/intent.ts`; FFX-2's intent code is a different file and says only "Berserk — it can only auto-attack").
 *
 * Since re-parity RC9 slice G-c a monster whose record's forced-action word is 0 (nearly every boss of the story chapters: `kernel/forced-action-table.ts`) has no default attack, so its Berserk and
 * its Confuse turns are DROPPED exactly as its Provoked turn is (`forced-turn.ts`: the kernel answers "dropped" for word 0 whichever of the three queued it). The slab said "it can only auto-attack,
 * at the other side" for Berserk and "it strikes one of its own side, itself included" for Confuse for every monster. It still says so for a monster that has a default attack, and says that the turn
 * is lost for one that has none (the Provoked line has the same two readings: `ffx-intent-provoked-note.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { BattleEvent, EnemyGroupDef, FFXCombatant, StatusInstance } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle } from '../../src/battle/ffx/index.ts';
import { defaultAttackOf } from '../../src/battle/ffx/adapt/target-world.ts';
import { forcedTurn } from '../../src/battle/ffx/forced-turn.ts';
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

/** Put `status` on the enemy (the first party member is its source) and read the slab's notes. */
function notesWith(ctx: Ctx, enemyId: string, status: 'berserk' | 'confuse'): string {
  const enemy = ctx.state.combatants[enemyId] as FFXCombatant;
  const inst: StatusInstance = { id: status, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, sourceId: ctx.state.activeIds[0] };
  enemy.statuses[status] = inst;
  return predictEnemyIntent(ctx, enemyId)!.notes.join(' | ');
}

/** Per status: the line for a monster that has no attack of its own, and the line for one that has. */
const LINES = {
  berserk: { loses: 'Berserk — it has no attack of its own, so it loses its turn', spends: 'Berserk — it can only auto-attack, at the other side' },
  confuse: { loses: 'Confused — it has no attack of its own, so it loses its turn', spends: 'Confused — it strikes one of its own side, itself included, so this prediction is a guess' },
} as const;

describe('the Berserk and Confuse lines of the enemy-intent slab', () => {
  for (const status of ['berserk', 'confuse'] as const) {
    it(`${status}: a boss with no default attack of its own loses its turn (Seymour Flux: word 0), and the engine drops that turn`, () => {
      const ctx = ctxOf(ENEMY_GROUPS_BY_ID['seymour-flux']!, 7);
      const flux = ctx.state.combatants['seymour-flux'] as FFXCombatant;
      expect(defaultAttackOf(flux)).toBe(0);
      const notes = notesWith(ctx, 'seymour-flux', status);
      expect(notes).toContain(LINES[status].loses);
      expect(notes).not.toContain(LINES[status].spends);
      expect(forcedTurn(ctx, flux).kind).toBe('dropped'); // the line is true: the turn is dropped, not spent on anyone
    });

    it(`${status}: a monster with a default attack still spends its turn on a swing (an aeon of the Last Summoning, whose game record is not matched: 0x3000), and the engine aims it`, () => {
      const ctx = ctxOf(lastSummoningGroup(linkGroupId(['ifrit']))!, 3);
      const aeon = ctx.state.combatants['possessed-ifrit'] as FFXCombatant;
      expect(defaultAttackOf(aeon)).toBe(0x3000);
      const notes = notesWith(ctx, 'possessed-ifrit', status);
      expect(notes).toContain(LINES[status].spends);
      expect(notes).not.toContain('loses its turn');
      expect(forcedTurn(ctx, aeon).kind).toBe('attack');
    });
  }
});
