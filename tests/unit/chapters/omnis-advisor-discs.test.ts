/**
 * **Chapter XII: the advisor turns discs** (critic round 13 PR-0197).
 *
 * A hit on a Mortiphasm deals 0 and turns the disc at the turn's end, which a
 * one-command preview never reaches, so the state guard read the chapter's own
 * "Wakka hits a disc" row as a no-op and filed it last: a card-follower turned
 * no disc in four live attempts (and 0 of 40 bench runs). `advisor-omnis.ts`
 * reads the landed hit, and a turn that takes a -ga out of his next volley is
 * kept as the move it is.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { discTurnOf, gaCount } from '../../../src/engine/tactics/advisor-omnis.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function engineFor(seed: number) {
  const chapter = getChapter('seymour-omnis')!;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!, triggers: [], seed, condition: 'normal', canEscape: false } as never);
  return engine;
}

/** Follow the card's top row; count the disc turns it produced. */
function follow(seed: number): number {
  const engine = engineFor(seed);
  clearAdvisorCache();
  for (let i = 0; i < 60_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const top = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true })?.suggestions[0]?.command;
    engine.submit(top ?? ({ kind: 'defend', targets: [] } as Command));
  }
  return (engine.state().log as Array<{ type: string; cause?: string }>).filter((e) => e.type === 'affinity-change' && e.cause === 'part-turn').length;
}

describe('the Omnis advisor turns discs (PR-0197)', () => {
  it('counts -ga spells the way §4.1 does', () => {
    expect(gaCount(['fire', 'fire', 'fire', 'fire'])).toBe(4);
    expect(gaCount(['water', 'fire', 'fire', 'fire'])).toBe(3);
    expect(gaCount(['water', 'ice', 'fire', 'fire'])).toBe(0);
  });

  it('reads a landed physical hit on a disc as a left turn that takes a -ga away', () => {
    const engine = engineFor(1);
    const state = structuredClone(engine.state());
    state.flags['omnis.discs'] = 'fire,fire,fire,water';
    const outcome = { events: [{ type: 'damage', targetId: 'mortiphasm-1', amount: 0 }], ability: null } as never;
    const turn = discTurnOf(state, { kind: 'attack', targets: ['mortiphasm-1'] }, outcome);
    expect(turn?.direction).toBe('left');
    expect(turn?.after[0]).toBe('lightning'); // a blow steps back along the game's ring: Fire -> Thunder (O-7)
    expect(turn?.gaLost).toBe(3);
    // A spell steps forward: Fire -> Ice.
    const spell = discTurnOf(state, { kind: 'ability', id: 'blizzara', targets: ['mortiphasm-1'] }, { events: [{ type: 'damage', targetId: 'mortiphasm-1', amount: 0 }], ability: { damageType: 'magical' } } as never);
    expect(spell?.direction).toBe('right');
    expect(spell?.after[0]).toBe('ice');
    expect(spell?.gaLost).toBe(3);
    expect(discTurnOf(engine.state(), { kind: 'attack', targets: ['seymour-omnis'] }, { events: [{ type: 'damage', targetId: 'seymour-omnis', amount: 300 }] } as never)).toBeNull();
  });

  it('a card-follower turns a disc on every seed of five', () => {
    for (const seed of [1, 2, 3, 4, 5]) expect(follow(seed), `seed ${seed}`).toBeGreaterThan(0);
  }, 120_000);
});
