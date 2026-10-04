// @vitest-environment jsdom
/**
 * D-359 (Bailey, 2026-10-03: "The guide and next move advisor are completely separate entities"): the move advisor
 * card carries no "Guide's pick" tag, in either game and at every density.
 *
 * The tag used to compare the advisor's lead row with the strategy guide's NEXT line (critic round 13 PR-0169 made it
 * withdraw itself the moment the two disagreed). Once the guide becomes a document of its own, that comparison is a
 * claim about something the card does not own, so the card stopped making it. The advisor's data keeps
 * `MoveSuggestion.source` (nothing on the card reads it); the card, its density ladder and both stylesheets lost the
 * tag, and `advisorGuideBadge.ts` is gone.
 *
 * This file used to pin the tag's behaviour (it printed on the move the guide named and went away on the sync where
 * the guide stopped naming it). It now pins that there is no tag to print.
 *
 * **Game case: both** [AGENTS.md rule 14]: the card is shared UI, and each battle HUD (FFX and FFX-2) mounts its own
 * copy of it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Command, GameId } from '../../src/battle/common/types.ts';
import type { AdvisorView, MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { makeFakeBattleState, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

let fakeView: AdvisorView | null = null;
vi.mock('../../src/engine/tactics/advisor.ts', async (orig) => {
  const real = await orig<typeof import('../../src/engine/tactics/advisor.ts')>();
  return { ...real, buildAdvisorView: () => fakeView };
});

const { MAX_DENSITY, MoveAdvisor, cardHtml } = await import('../../src/ui/common/MoveAdvisor.ts');

/** A row the chapter tactic picked (the case that used to wear the tag), or a plain simulated one. */
function row(label: string, source: MoveSuggestion['source']): MoveSuggestion {
  return {
    command: { type: 'ability', abilityId: 'cura' } as unknown as Command,
    label,
    menu: 'White Magic',
    targetId: null,
    targetName: 'the party',
    effect: 'Restores the whole party',
    estimate: null,
    mpCost: 10,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: false,
    reason: 'The party is hurt',
    cite: '',
    score: 1,
    source,
  } as unknown as MoveSuggestion;
}

function view(): AdvisorView {
  return {
    actorId: 'tidus',
    actorName: 'Tidus',
    suggestions: [row('Cura', 'tactic'), row('Hastega', 'simulated')],
    note: '',
  } as unknown as AdvisorView;
}

const TAG = /guide.?s pick|chapter line|mad__badge/i;

afterEach(() => {
  document.body.innerHTML = '';
  fakeView = null;
});

describe('the advisor card prints no "Guide’s pick" tag (D-359)', () => {
  for (const game of ['ffx', 'ffx2'] as const satisfies readonly GameId[]) {
    it(`${game}: a mounted card whose lead the chapter tactic picked carries no tag`, () => {
      fakeView = view();
      const stage = document.createElement('div');
      document.body.append(stage);
      const card = new MoveAdvisor({
        game,
        anchors: { left: 0, right: 640, bottom: 0 },
        readVisible: () => true,
        writeVisible: () => {},
      });
      card.mount(stage);
      card.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
      expect(stage.querySelector('.mad__label')?.textContent).toBe('Cura'); // the lead is on the card
      expect(stage.querySelector('.mad__badge')).toBeNull();
      expect(stage.textContent ?? '').not.toMatch(TAG);
      card.unmount();
    });
  }

  it('no density prints it, from the full card to the phone-compact one', () => {
    for (let d = 0; d <= MAX_DENSITY; d++) {
      const html = cardHtml(view(), d as Parameters<typeof cardHtml>[1]);
      expect(html, `density ${d}`).not.toMatch(TAG);
      expect(html, `density ${d}`).toContain('Cura'); // the move itself stays at every rung
    }
  });

  it('the card does not read the guide: a new board changes nothing on it', () => {
    fakeView = view();
    const stage = document.createElement('div');
    document.body.append(stage);
    const card = new MoveAdvisor({
      game: 'ffx2',
      anchors: { left: 0, right: 640, bottom: 0 },
      readVisible: () => true,
      writeVisible: () => {},
    });
    card.mount(stage);
    card.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    const before = stage.querySelector('[data-role="move-advisor-card"]')!.innerHTML;
    const later = makeFakeBattleState();
    for (const c of Object.values(later.combatants)) c.hp = Math.max(1, Math.floor(c.hp / 2));
    card.sync(later);
    expect(stage.querySelector('[data-role="move-advisor-card"]')!.innerHTML).toBe(before);
    card.unmount();
  });
});

describe('what carried the tag is gone', () => {
  const read = (f: string): string => readFileSync(f, 'utf8');

  it('the badge module no longer exists, and the card imports nothing from the guide', () => {
    expect(existsSync('src/ui/common/advisorGuideBadge.ts')).toBe(false);
    const src = read('src/ui/common/MoveAdvisor.ts');
    expect(src).not.toMatch(/advisorGuideBadge|withGuideBadge|guideAgrees|tactics\/guide/);
    expect(src).not.toMatch(/mad__badge/);
  });

  it('neither stylesheet styles or hides a .mad__badge', () => {
    for (const f of ['src/ui/common/move-advisor.css', 'src/ui/common/phone-battle-parts.css']) {
      expect(read(f), f).not.toMatch(/mad__badge/);
    }
  });
});
