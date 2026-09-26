// @vitest-environment jsdom
/**
 * "Guide's pick" is only printed beside the move the guide's NEXT names on the
 * board it is showing (critic round 13 PR-0169).
 *
 * Live Chapter V showed "Light Curtain -> the party GUIDE'S PICK" beside a
 * guide reading "NEXT YUNA Pray -> the party": the card is computed once per
 * decision, the guide re-reads every `sync`, and in FFX-2 the board moves under
 * an open menu. The badge claims the guide's endorsement, so it goes when the
 * two disagree.
 *
 * **Game case: both** (shared card; observed in FFX-2, where the clock runs
 * under an open menu).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleState, Command } from '../../src/battle/common/types.ts';
import type { AdvisorView, MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';

let fakeView: AdvisorView | null = null;
vi.mock('../../src/engine/tactics/advisor.ts', async (orig) => {
  const real = await orig<typeof import('../../src/engine/tactics/advisor.ts')>();
  return { ...real, buildAdvisorView: () => fakeView };
});

const { MoveAdvisor } = await import('../../src/ui/common/MoveAdvisor.ts');
const { guideAgrees, withGuideBadge } = await import('../../src/ui/common/advisorGuideBadge.ts');

function firstDecision() {
  const { engine } = harnessFor('ffx2-vegnagun-shuyin', 1);
  for (let i = 0; i < 2000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { state: engine.state(), decision: { actorId: d.actorId, commands: d.commands } };
    engine.tick?.(100);
  }
  throw new Error('no decision');
}

function tacticView(command: Command, actorId: string): AdvisorView {
  const s = {
    command,
    label: 'Pray',
    menu: 'White Magic',
    targetId: null,
    targetName: 'the party',
    effect: '',
    estimate: null,
    mpCost: 0,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: false,
    reason: 'A reason',
    cite: '',
    score: 1,
    source: 'tactic',
  } as unknown as MoveSuggestion;
  return { actorId, actorName: 'Yuna', suggestions: [s], note: '' } as unknown as AdvisorView;
}

/** The same board with Yuna at half HP: the Chapter V tactic's pick moves off Pray. */
function hurt(state: Readonly<BattleState>): BattleState {
  const s = structuredClone(state) as BattleState;
  const yuna = s.combatants['yuna']!;
  yuna.hp = Math.floor(yuna.stats.maxHp / 2);
  return s;
}

afterEach(() => {
  document.body.innerHTML = '';
  fakeView = null;
});

describe('Guide’s pick agrees with the guide (PR-0169)', () => {
  it('agrees on the board it was computed on, and not once the tactic moves', () => {
    const { state, decision } = firstDecision();
    const pick = recommendedCommand(state, decision)!;
    const view = tacticView(pick, decision.actorId);
    expect(guideAgrees(state, decision, view)).toBe(true);
    const later = hurt(state);
    expect(recommendedCommand(later, decision)).not.toEqual(pick); // precondition
    expect(guideAgrees(later, decision, view)).toBe(false);
    expect(withGuideBadge(view, false).suggestions[0]!.source).toBe('simulated');
  });

  it('the mounted card drops the badge on the sync where the guide stops agreeing', () => {
    const { state, decision } = firstDecision();
    const pick = recommendedCommand(state, decision)!;
    fakeView = tacticView(pick, decision.actorId);
    const stage = document.createElement('div');
    document.body.append(stage);
    const card = new MoveAdvisor({
      game: 'ffx2',
      anchors: { left: 0, right: 640, bottom: 0 },
      readVisible: () => true,
      writeVisible: () => {},
    });
    card.mount(stage);
    card.showDecision(decision.actorId, decision.commands, state);
    expect(stage.querySelector('.mad__badge')).not.toBeNull();
    card.sync(hurt(state));
    expect(stage.querySelector('.mad__badge')).toBeNull();
    expect(stage.querySelector('.mad__label')?.textContent).toBe('Pray'); // the move stays
    card.sync(state);
    expect(stage.querySelector('.mad__badge')).not.toBeNull();
    card.unmount();
  });
});
