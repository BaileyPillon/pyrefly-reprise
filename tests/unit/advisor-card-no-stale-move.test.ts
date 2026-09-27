// @vitest-environment jsdom
/**
 * FOC22-02, the card half: when a decision has nothing the advisor may name,
 * the card is hidden, and it must not keep the last decision's move in its DOM.
 *
 * The focused review's Chapter XI route read "Remedy in Item" off the card for
 * 314 decisions while the menu offered only CHANGE: the card element was hidden,
 * but `.mad__move` still held the previous girl's pick, so anything that reads
 * the card (a harness, a screen reader walking a stale subtree, the next
 * render's signature) read advice for a board that was gone.
 *
 * Game case: both (the card component is shared; the board that reached it is
 * FFX-2's).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { MoveAdvisor } from '../../src/ui/common/MoveAdvisor.ts';
import { makeFakeBattleState, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

const live: MoveAdvisor[] = [];
afterEach(() => {
  for (const a of live.splice(0)) a.unmount();
  document.body.innerHTML = '';
});

function mount(): { advisor: MoveAdvisor; stage: HTMLElement } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const advisor = new MoveAdvisor({
    game: 'ffx',
    anchors: { left: 196, right: 414, bottom: 26 },
    readVisible: () => true,
    writeVisible: () => undefined,
  });
  advisor.mount(stage);
  live.push(advisor);
  return { advisor, stage };
}

describe('the advisor card never keeps a stale move (FOC22-02)', () => {
  it('a decision with nothing to name empties the card as well as hiding it', () => {
    const { advisor, stage } = mount();
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    expect(advisor.view()).not.toBeNull();
    expect(stage.querySelectorAll('.mad__move').length).toBeGreaterThan(0);

    // No rows at all: `buildAdvisorView` has nothing legal to say.
    advisor.showDecision('tidus', [], makeFakeBattleState());
    expect(advisor.view()).toBeNull();
    const root = stage.querySelector<HTMLElement>('[data-role="move-advisor"]')!;
    expect(root.hidden).toBe(true);
    expect(stage.querySelectorAll('.mad__move').length).toBe(0);
  });

  it('closing the decision empties the card too, and the next decision paints afresh', () => {
    const { advisor, stage } = mount();
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    advisor.clearDecision();
    expect(stage.querySelectorAll('.mad__move').length).toBe(0);
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    expect(stage.querySelectorAll('.mad__move').length).toBeGreaterThan(0);
  });
});
