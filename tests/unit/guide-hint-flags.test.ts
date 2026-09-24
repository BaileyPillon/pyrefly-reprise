/**
 * `GuideHintMatch.flags` — the strategy guide's state-keyed hint matcher.
 *
 * `hintMatches` (`src/engine/tactics/guide.ts`) is exported for exactly this:
 * a hint whose truth depends on `BattleState.flags` (an AI script's or story
 * trigger's own encounter state, `types.ts` `GuideHintMatch.flags` doc comment)
 * rather than on the menu label alone. `src/data/guides/evrae.ts`'s "holds a
 * breath and the ship is FAR" hint is the motivating case: `harmlessTurn()`
 * can land on Potion / Eye Drops / Echo Screen from two different reasons in
 * `src/engine/tactics/evrae.ts` (the breath dodge, and the unrelated
 * nothing-reaches fallback), and the label is identical either way.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState, Command, CombatantId } from '../../src/battle/common/types.ts';
import type { ChapterGuide, GuideHint } from '../../src/data/guides/types.ts';
import { hintMatches } from '../../src/engine/tactics/guide.ts';

function ctxWith(flags: Record<string, number | string | boolean>) {
  const state = { combatants: {}, flags } as unknown as Readonly<BattleState>;
  const guide = { bossIds: [] } as unknown as ChapterGuide;
  return {
    label: 'potion',
    command: { kind: 'item', id: 'potion', targets: [] } as unknown as Command,
    actorId: 'rikku' as CombatantId,
    target: undefined,
    state,
    guide,
  };
}

const hint: GuideHint = {
  when: {
    labels: ['Potion', 'Eye Drops', 'Echo Screen'],
    flags: { 'airship.breathCharged': true, 'airship.range': 'far' },
  },
  text: 'the breath-dodge line',
  cite: 'ffx-evrae-airship §4.5',
};

describe('GuideHintMatch.flags', () => {
  it('matches when every listed flag equals the state', () => {
    expect(
      hintMatches(hint, ctxWith({ 'airship.breathCharged': true, 'airship.range': 'far' })),
    ).toBe(true);
  });

  it('does not match when the label fits but a breath is not charged (the fallback-item case)', () => {
    expect(
      hintMatches(hint, ctxWith({ 'airship.breathCharged': false, 'airship.range': 'far' })),
    ).toBe(false);
  });

  it('does not match when the label fits but the ship is NEAR', () => {
    expect(
      hintMatches(hint, ctxWith({ 'airship.breathCharged': true, 'airship.range': 'near' })),
    ).toBe(false);
  });

  it('does not match when a listed flag is simply absent from state.flags', () => {
    expect(hintMatches(hint, ctxWith({ 'airship.range': 'far' }))).toBe(false);
  });

  it('ignores flags the hint does not list', () => {
    const noFlagHint: GuideHint = { when: { labels: ['Cheer'] }, text: 't', cite: 'ffx-evrae-airship §4.3' };
    const ctx = { ...ctxWith({ anything: 'goes' }), label: 'cheer' };
    expect(hintMatches(noFlagHint, ctx)).toBe(true);
  });
});
