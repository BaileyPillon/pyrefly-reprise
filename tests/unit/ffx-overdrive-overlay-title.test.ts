// @vitest-environment jsdom
/**
 * od4 (FFX only): the Bushido and Swordplay overlays are titled with the
 * Overdrive the player chose, read from that ability record's own `name`.
 *
 * Before: `minigameParams` published `{ abilityId, timerMs, inputs }` for every
 * Bushido row and `{ abilityId, timerMs, travelMs, zonePercent }` for every
 * Swordplay row, with no `name`, so the overlays fell back to their defaults:
 * real keys in Chapter II titled Shooting Star "Dragon Fang" and Spiral Cut
 * "Slice & Dice". After: the request carries `name: def.name` and the title
 * follows `abilityId` for every row. Timers, input counts and the button
 * order are unchanged (the HD order is still open:
 * `research/ffx-overdrive-input-rules-2026-09-30.md` D1-D5).
 *
 * The request comes from the real engine (no auto-resolve, so it stops on the
 * `minigame-request`), and its params open the real overlay.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, MinigameKind } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { openMinigame } from '../../src/ui/ffx/minigames/index.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

const rowsOf = (table: Record<string, AbilityDef>, kind: MinigameKind): AbilityDef[] =>
  Object.values(table).filter((d) => d.minigame === kind);
const BUSHIDO = rowsOf(AURON, 'auron-sequence');
const SWORDPLAY = rowsOf(TIDUS, 'tidus-timing');

/** The `minigame-request` the real engine emits when `who` fires `def` with no minigame result attached. */
function requestFor(who: 'tidus' | 'auron', def: AbilityDef): Extract<BattleEvent, { type: 'minigame-request' }> {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(1);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus', ...(who === 'tidus' ? { overdrive: od } : {}) }), member({ id: 'auron', ...(who === 'auron' ? { overdrive: od } : {}) }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999 })] },
    }),
  );
  for (let i = 0; i < 200; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input' || d.actorId === who) break;
    engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'] };
  const req = engine.submit(cmd).find((e): e is Extract<BattleEvent, { type: 'minigame-request' }> => e.type === 'minigame-request');
  if (!req) throw new Error(`${def.id}: no minigame-request`);
  return req;
}

describe('the data the title is read from', () => {
  it('has all four Bushido rows and all four Swordplay rows, each with its own name', () => {
    expect(BUSHIDO.map((d) => d.name)).toEqual(['Dragon Fang', 'Shooting Star', 'Banishing Blade', 'Tornado']);
    expect(SWORDPLAY.map((d) => d.name)).toEqual(['Spiral Cut', 'Slice & Dice', 'Energy Rain', 'Blitz Ace']);
  });
});

describe('the overlay title follows abilityId (real engine request -> real overlay)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const cases: Array<[string, 'tidus' | 'auron', AbilityDef]> = [
    ...BUSHIDO.map((d): [string, 'auron', AbilityDef] => [d.name, 'auron', d]),
    ...SWORDPLAY.map((d): [string, 'tidus', AbilityDef] => [d.name, 'tidus', d]),
  ];

  it.each(cases)('%s', async (name, who, def) => {
    const req = requestFor(who, def);
    expect(req.kind).toBe(def.minigame);
    expect(req.params['abilityId']).toBe(def.id);
    expect(req.params['name']).toBe(name);
    // Unchanged by od4: Bushido 4 000 ms and 7 inputs; Swordplay its published timer. od5: Tornado 3 000 ms (D-312).
    if (who === 'auron') expect(req.params).toMatchObject({ timerMs: def.id === 'tornado' ? 3000 : 4000, inputs: 7 });
    else expect(req.params).toMatchObject({ travelMs: 1400, zonePercent: 22 });

    const root = document.createElement('div');
    document.body.appendChild(root);
    let settled = false;
    void openMinigame(root, req.kind, req.params).then(() => (settled = true));
    expect(root.querySelector('.ig-minigame__title')?.textContent).toBe(name);
    expect(root.querySelector('.ig-minigame__subtitle')?.textContent).toMatch(who === 'auron' ? /^BUSHIDO/ : /^SWORDPLAY/);
    await vi.advanceTimersByTimeAsync(Number(req.params['timerMs']) + 3000); // let it expire and close
    expect(settled).toBe(true);
  });
});
