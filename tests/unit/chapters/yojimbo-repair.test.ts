/**
 * Yojimbo core, repair pass (2026-09-24, FFX only) — pins the three things the
 * verifier found:
 *
 * 1. An explicitly submitted target the menu never offers (Ginnem, Daigoro:
 *    `flags.untargetable`, B3) no longer lands. `targeting.ts#resolveTargets`
 *    used to check only `onField` for an explicit pick, so
 *    `submit({ kind: 'attack', targets: ['daigoro'] })` KO'd the dog. The
 *    FFX-2 engine already refused it (`ffx2/targeting.ts#isTargetable`).
 * 2. The battle-start card names the first enemy that is neither hidden nor a
 *    part (`BattleScreen.showBattleStart`); it read "Lady Ginnem". The
 *    formation is now listed boss-first, slots unchanged.
 * 3. House rule 7: `encounters.ts` grew past 400 lines; every file this track
 *    owns stays under it.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID['yojimbo-cavern']!;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: yojimboCavernBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

type Input = Extract<Decision, { kind: 'player-input' }>;

function firstInput(engine: BattleEngine): Input {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no player turn');
}

describe('Repair 1 — an explicit target the menu never offers does not land (FFX engine)', () => {
  for (const bystander of ['ginnem', 'daigoro']) {
    it(`Attack submitted at '${bystander}' strikes Yojimbo instead, on 20 seeds`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const engine = newEngine(seed);
        const d = firstInput(engine);
        const attack = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
        expect(attack?.validTargets).toEqual(['yojimbo']);
        const hpBefore = engine.state().combatants[bystander]!.hp;
        const from = engine.state().log.length;
        engine.submit({ kind: 'attack', targets: [bystander] } as Command);
        const st = engine.state();
        expect(st.combatants[bystander]!.hp).toBe(hpBefore);
        expect(st.combatants[bystander]!.alive).toBe(true);
        const hit = st.log
          .slice(from)
          .filter((e) => e.type === 'damage' || e.type === 'miss')
          .map((e) => (e as { targetId?: string }).targetId);
        expect(hit.length).toBeGreaterThan(0);
        expect(hit.every((id) => id === 'yojimbo')).toBe(true);
      }
    });
  }

  it('a same-side explicit pick is unchanged: Cure names the ally it was aimed at', () => {
    const engine = newEngine(3);
    let d = firstInput(engine);
    // Answer turns with Defend until Yuna is up, then aim Cure at Kimahri.
    for (let i = 0; i < 40 && d.actorId !== 'yuna'; i++) {
      engine.submit({ kind: 'defend', targets: [] });
      d = firstInput(engine);
    }
    expect(d.actorId).toBe('yuna');
    const from = engine.state().log.length;
    engine.submit({ kind: 'ability', id: 'cure', targets: ['kimahri'] } as Command);
    const heal = engine.state().log
      .slice(from)
      .filter((e) => e.type === 'heal' || e.type === 'damage')
      .map((e) => (e as { targetId?: string }).targetId);
    expect(heal).toEqual(['kimahri']);
  });
});

describe('Repair 2 — the battle-start headline is Yojimbo', () => {
  it("the first enemy that is neither hidden nor a part (BattleScreen.showBattleStart's rule) is Yojimbo", () => {
    const st = newEngine(1).state();
    const boss = st.enemyIds
      .map((id) => st.combatants[id])
      .find((c) => c && !c.removed && !c.flags.hidden && !c.flags.isPart);
    expect(boss?.id).toBe('yojimbo');
    expect(boss?.name).toBe('Yojimbo');
  });

  it("the chapter record's formation lists the boss first (chapterGrid reads enemies[0])", () => {
    expect(getChapter('yojimbo-cavern')?.enemyGroupRef.enemies[0]?.id).toBe('yojimbo');
  });
});

describe('Repair 3 — house rule 7: every file this track touches is under 400 lines', () => {
  const files = [
    'src/data/encounters.ts',
    'src/data/chapters-unlisted.ts',
    'src/data/chapter-yojimbo-cavern.ts',
    'src/data/ffx/enemies/yojimbo.ts',
    'src/data/ffx/enemies/yojimbo-abilities.ts',
    'src/data/ffx/builds/yojimbo-cavern.ts',
    'src/battle/ffx/orders.ts',
    'src/battle/ffx/targeting.ts',
    'src/battle/ffx/state.ts',
    'src/battle/ffx/turnQueue.ts',
    'src/battle/ffx/execute.ts',
    'src/battle/ffx/ai/yojimbo.ts',
    'src/battle/ffx/ai/yojimbo-rules.ts',
  ];
  for (const f of files) {
    it(f, () => {
      const lines = readFileSync(new URL(`../../../${f}`, import.meta.url), 'utf8').split(/\r?\n/);
      if (lines.at(-1) === '') lines.pop();
      expect(lines.length).toBeLessThan(400);
    });
  }

  it('encounters.ts still re-exports the unlisted list; Yojimbo left it when listed (2026-09-24)', () => {
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).not.toContain('yojimbo-cavern');
    expect(getChapter('yojimbo-cavern')?.number).toBe(9);
  });
});
