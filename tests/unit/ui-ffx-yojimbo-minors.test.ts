// @vitest-environment jsdom
/**
 * Two minors from Chapter IX's end-to-end, proved against the real engine
 * where the engine is the cause (hard rule 3):
 *
 * - Kimahri's Ronso Rage overlay threw in `escapeHtml`: the engine sends the
 *   Rages as ability ids, and the overlay now takes that shape, names them from
 *   the ability table and opens on the Rage the menu already chose. FFX only.
 * - The advisor's forecast clause read "Daigoro is worth about 552"; it now
 *   says what the move does ("Daigoro bites for about 550"). Both games: the
 *   advisor's wording is shared.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import { openKimahriRage } from '../../src/ui/ffx/minigames/index.ts';
import { incomingText } from '../../src/engine/tactics/advisor-eval.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

function newEngine(autoResolveMinigames: boolean): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID['yojimbo-cavern'];
  if (!group) throw new Error('yojimbo-cavern missing');
  const engine = createFFXEngine({ content, autoResolveMinigames });
  engine.init({ game: 'ffx', party: yojimboCavernBuild, enemies: group, triggers: [], seed: 14, condition: 'normal', canEscape: false });
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (c) {
      c.stats.maxHp = 99_999;
      c.hp = 99_999;
    }
  }
  return engine;
}

/** Kimahri Dooms Yojimbo on his first turn; everyone else defends. */
function drive(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 4000): void {
  let doomed = false;
  const choose = (d: Input): Command => {
    if (!doomed && d.actorId === 'kimahri') {
      doomed = true;
      return { kind: 'overdrive', id: 'doom', targets: ['yojimbo'] };
    }
    return { kind: 'defend', targets: [] };
  };
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Kimahri — Ronso Rage takes the Rages the way the engine sends them', () => {
  it("opens on the engine's own minigame request, names the Rages, starts on the menu's choice and resolves it", async () => {
    const engine = newEngine(false);
    let request: Extract<BattleEvent, { type: 'minigame-request' }> | undefined;
    drive(engine, (e) => {
      request = (e.state().log as BattleEvent[]).find(
        (ev): ev is Extract<BattleEvent, { type: 'minigame-request' }> => ev.type === 'minigame-request',
      );
      return request !== undefined;
    });
    expect(request?.kind).toBe('kimahri-rage');
    const params = request!.params;
    // The engine's shape: ability ids, not rows.
    expect((params['rages'] as unknown[]).every((r) => typeof r === 'string')).toBe(true);
    expect(params['rages']).toContain('doom');

    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, params);
    const rows = [...root.querySelectorAll('.ffx-mg-list__row')].map((r) => r.textContent);
    expect(rows).toContain('Doom');
    expect(root.querySelector('.ffx-mg-list__row--selected')?.textContent).toBe('Doom');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(pending).resolves.toMatchObject({ kind: 'kimahri-rage', rage: { rageId: 'doom' } });
  });
});

describe("the advisor's forecast clause says what the move does", () => {
  it('Daigoro bites; everything else hits; a spread move says the number is a total', () => {
    expect(incomingText('Daigoro', 552, 1)).toBe('Daigoro bites for about 550');
    expect(incomingText('Lance of Atrophy', 755, 1)).toBe('Lance of Atrophy hits for about 760');
    expect(incomingText('Zanmato', 29_997, 3)).toBe('Zanmato hits for about 30,000 in all');
    expect(incomingText('Kozuka', 88, 1)).toBe('Kozuka hits for about 88');
  });
});

describe("the advisor's placement counts the submenu's name as part of the command window", () => {
  it('unionOf spans the stack and the breadcrumb above it, and ignores a hidden one', async () => {
    const { unionOf } = await import('../../src/ui/ffx/hudPlacementKeys.ts');
    const stack = { left: 30, top: 284, right: 190, bottom: 334 };
    const crumb = { left: 30, top: 268, right: 96, bottom: 278 };
    expect(unionOf(stack, crumb)).toEqual({ left: 30, top: 268, right: 190, bottom: 334 });
    expect(unionOf(stack, null)).toEqual(stack);
    expect(unionOf(null, null)).toBeNull();
  });
});
