// @vitest-environment jsdom
/**
 * The advisor's `N HIDE MOVES` chip never stands alone (critic round 13 PR-0130
 * and PR-0110).
 *
 *  - PR-0130 (observed FFX): pressing E folds the card (the FFX HUD's safe-zone
 *    solver takes it down when the intent panel leaves no band) and the chip
 *    stayed mid-screen, still saying HIDE, over nothing. The chip now follows
 *    the card: while the advisor is on and the card is down, the chip is down.
 *  - PR-0110 (FFX-2): the first-turn coach card fades the advisor card out, and
 *    the chip's text showed through the coach's header. The chip now fades with
 *    the card while an FFX-2 coach line is up.
 *
 * **Game case: both** for the chip-follows-card rule (shared component; the
 * fold is an FFX HUD behaviour, and FFX-2 never hides the card while the
 * advisor is on, so nothing changes there). **FFX-2 only** for the coach rule,
 * mirroring `coach.css`, which fades the card only under an FFX-2 line.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdvisorView } from '../../src/engine/tactics/advisor.ts';

vi.mock('../../src/engine/tactics/advisor.ts', async (orig) => {
  const real = await orig<typeof import('../../src/engine/tactics/advisor.ts')>();
  const view = {
    actorId: 'tidus',
    actorName: 'Tidus',
    note: '',
    suggestions: [
      {
        command: { kind: 'attack', targets: ['seymour'] },
        label: 'Attack',
        menu: '',
        targetId: 'seymour',
        targetName: 'Seymour',
        effect: '',
        estimate: null,
        mpCost: 0,
        hitChance: 100,
        critChance: 0,
        statuses: [],
        cures: [],
        warning: '',
        isSwitch: false,
        reason: 'A reason',
        cite: '',
        score: 1,
        source: 'simulated',
      },
    ],
  } as unknown as AdvisorView;
  return { ...real, buildAdvisorView: () => view };
});

const { MoveAdvisor } = await import('../../src/ui/common/MoveAdvisor.ts');

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'move-advisor.css'), 'utf8');

afterEach(() => {
  document.body.innerHTML = '';
});

function mounted(on = true) {
  const stage = document.createElement('div');
  document.body.append(stage);
  let visible = on;
  const adv = new MoveAdvisor({
    game: 'ffx',
    anchors: { left: 0, right: 640, bottom: 0 },
    readVisible: () => visible,
    writeVisible: (v) => {
      visible = v;
    },
  });
  adv.mount(stage);
  adv.showDecision('tidus', [], { game: 'ffx', combatants: {} } as never);
  const card = stage.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
  const chip = stage.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]')!;
  return { adv, card, chip };
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('the chip follows the card (PR-0130)', () => {
  it('goes down when a HUD folds the card, and comes back with it', async () => {
    const { card, chip, adv } = mounted();
    expect(chip.hidden).toBe(false);
    card.hidden = true; // what FFXBattleHud.placeAdvisor does when E leaves no band
    await tick();
    expect(chip.hidden).toBe(true);
    card.hidden = false;
    await tick();
    expect(chip.hidden).toBe(false);
    adv.unmount();
  });

  it('stays up when the player put the card away (it is the way back)', async () => {
    const { adv, chip, card } = mounted();
    adv.setVisible(false);
    await tick();
    expect(card.hidden).toBe(true);
    expect(chip.hidden).toBe(false);
    adv.unmount();
  });

  it('the stylesheet honours [hidden] on the chip', () => {
    expect(SHEET).toMatch(/\.mad__toggle\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});

describe('the chip fades with the card under an FFX-2 coach line (PR-0110)', () => {
  it('move-advisor.css fades the chip while an FFX-2 coach line is up', () => {
    const rule = SHEET.match(/\[data-coach-mark-game='ffx2'\] \.mad__toggle\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/opacity:\s*0/);
    expect(rule![1]).toMatch(/pointer-events:\s*none/);
  });
});
