/**
 * PR-0208 (critic round 13): **the advisor card names the exact enemy it
 * means.**
 *
 * Chapter III's first link has two Yu Pagodas. The CTB tile and the target
 * cursor's name plate tell them apart with the letter FFX gives duplicates
 * ("Yu Pagoda A" / "Yu Pagoda B", `src/battle/ffx/letterTags.ts`), but the
 * card printed "Slow → Yu Pagoda" for the advisor's own top row, Slow on
 * `yu-pagoda-right`. A player (and the live harness) following it picked the
 * first match, the Pagoda already slowed, from command 8 on; the pinned seed-1
 * real-key run ended in the engine stalemate.
 *
 * The card's `targetName` and the strategy panel's NEXT line now carry the
 * same letter the tile and the name plate show, read from the one rule.
 *
 * Game case: **FFX only.** The letters are FFX's CTB-tile / name-plate
 * convention; FFX-2's HUD names its own duplicate parts and its card is
 * untouched (asserted below).
 */

import { describe, expect, it } from 'vitest';
import type { BattleState, Command, CombatantId, FFXBattleEngine } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { targetDisplayName } from '../../src/engine/tactics/targetLabel.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function bfa(seed: number) {
  const chapter = getChapter('braskas-final-aeon')!;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party: chapter.buildRef,
    enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return engine;
}

/** The letter the CTB tile shows for `id`, straight off the engine's forecast. */
function tileLetter(engine: ReturnType<typeof bfa>, id: CombatantId): string | undefined {
  const rows = (engine as unknown as FFXBattleEngine).predictTurnOrder(16);
  return rows.find((r) => r.actorId === id)?.letterTag;
}

describe('PR-0208: the Chapter III card letters the Yu Pagoda it means', () => {
  it('both Pagodas carry a distinct letter, and it is the CTB tile\'s', () => {
    const engine = bfa(1);
    engine.nextDecision();
    const state = engine.state() as BattleState;
    const left = targetDisplayName(state, 'yu-pagoda-left');
    const right = targetDisplayName(state, 'yu-pagoda-right');
    expect(left).toMatch(/^Yu Pagoda [AB]$/);
    expect(right).toMatch(/^Yu Pagoda [AB]$/);
    expect(left).not.toBe(right);
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      const letter = tileLetter(engine, id);
      if (letter) expect(targetDisplayName(state, id)).toBe(`Yu Pagoda ${letter}`);
    }
    // A unique enemy and a party member keep their plain names.
    expect(targetDisplayName(state, 'tidus')).toBe(state.combatants['tidus']!.name);
    const boss = state.enemyIds.find((id) => !id.startsWith('yu-pagoda'))!;
    expect(targetDisplayName(state, boss)).toBe(state.combatants[boss]!.name);
  });

  it('an FFX-2 board is never lettered by this rule', () => {
    const engine = bfa(1);
    engine.nextDecision();
    const state = { ...(engine.state() as BattleState), game: 'ffx2' } as BattleState;
    expect(targetDisplayName(state, 'yu-pagoda-left')).toBe('Yu Pagoda');
    expect(targetDisplayName(state, 'yu-pagoda-right')).toBe('Yu Pagoda');
  });

  it('seed 1, following the card: every Pagoda it names is lettered, matching its target id', () => {
    clearAdvisorCache();
    const engine = bfa(1);
    let named = 0;
    for (let i = 0; i < 4000 && named < 6; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const state = engine.state() as BattleState;
      const view = buildAdvisorView(state, d, { ffxContent: content, planner: true });
      const top = view?.suggestions[0];
      for (const s of view?.suggestions ?? []) {
        if (!s.targetId?.startsWith('yu-pagoda')) continue;
        named += 1;
        const letter = tileLetter(engine, s.targetId);
        expect(s.targetName, `turn ${state.turn}`).toMatch(/^Yu Pagoda [AB]$/);
        if (letter) expect(s.targetName).toBe(`Yu Pagoda ${letter}`);
      }
      const next = buildGuideView(state, d)?.next;
      if (next?.targetId?.startsWith('yu-pagoda')) {
        expect(next.targetName, `guide turn ${state.turn}`).toBe(targetDisplayName(state, next.targetId));
        expect(next.targetName).toMatch(/^Yu Pagoda [AB]$/);
      }
      const r = d.commands.find((c) => c.enabled && c.validTargets.length > 0)!;
      engine.submit(top?.command ?? ({ ...r.command, targets: [r.validTargets[0]!] } as Command));
    }
    expect(named).toBeGreaterThan(0);
  }, 60_000);
});
