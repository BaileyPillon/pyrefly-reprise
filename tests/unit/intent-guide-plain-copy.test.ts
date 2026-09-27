/**
 * Player-facing intent and guide copy is plain English (CHK-007; critic round 13
 * PR-0026 and PR-0027).
 *
 * Before: the Chapter I guide led its Haste hint with engine notation ("Haste
 * is ctb x 8/16"), and the Yunalesca counter line carried unrendered markdown
 * ("the target *she* last picked"). Both are shown verbatim on screen.
 *
 * **Game case: FFX only** for both lines (Chapter I and II are FFX chapters);
 * the sweeps run over every guide and every FFX enemy group, which is where
 * this copy lives.
 */

import { describe, expect, it } from 'vitest';
import type { FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle } from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { countersFor, predictEnemyIntents } from '../../src/battle/ffx/intent.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { GUIDES } from '../../src/data/guides/index.ts';
import { EVRAE_GUIDE } from '../../src/data/guides/evrae.ts';

function allGuideText(): string[] {
  const out: string[] = [];
  for (const g of [...GUIDES, EVRAE_GUIDE]) {
    for (const r of g.rules) out.push(r.text, r.short);
    for (const h of g.hints) out.push(h.text);
    for (const p of g.phases) out.push(p.label, p.note);
    for (const w of g.watch) out.push(w.payload, w.advice);
  }
  return out.filter((s): s is string => typeof s === 'string');
}

describe('guide copy (PR-0026)', () => {
  it('no guide line uses CTB engine notation', () => {
    for (const t of allGuideText()) expect(t, t).not.toMatch(/ctb\s*[x×*]/i);
  });

  it('the Chapter I Haste hint says what Haste does in player terms', () => {
    const haste = GUIDES[0]!.hints.find((h) => h.when.labels?.includes('Haste'));
    expect(haste?.text).toMatch(/Haste roughly doubles/);
  });
});

describe('intent counter copy (PR-0027)', () => {
  it('no FFX counter line carries markdown asterisks, for every Yunalesca form', () => {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const ctx = buildBattle(
      {
        game: 'ffx',
        party: zanarkandBuild,
        enemies: ENEMY_GROUPS_BY_ID['yunalesca']!,
        triggers: [],
        seed: 1,
        condition: 'scripted',
        canEscape: false,
      },
      new SeededRng(1),
      content,
      () => {},
    );
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    for (const form of [0, 1, 2]) {
      if (her.enemy) her.enemy.formIndex = form;
      for (const line of countersFor(ctx, her)) expect(line, `form ${form}`).not.toContain('*');
    }
  });

  it('no predicted intent in any FFX group carries a markdown asterisk', () => {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    for (const [id, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
      const ctx = buildBattle(
        { game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 3, condition: 'scripted', canEscape: false },
        new SeededRng(3),
        content,
        () => {},
      );
      const text = JSON.stringify(predictEnemyIntents(ctx));
      expect(text, id).not.toMatch(/\*[A-Za-z][^*"]*\*/);
    }
  });
});
