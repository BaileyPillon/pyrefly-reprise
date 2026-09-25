// @vitest-environment jsdom
/**
 * Doom's countdown over the doomed head (`src/ui/ffx/DoomCounters.ts`).
 *
 * Chapter IX's end-to-end found Yojimbo doomed with no count anywhere on
 * screen. `research/ffx-combat-core.md` §4, Doom: "Countdown shown over the
 * head; decrements on the victim's turn (even asleep/skipped). At 0 → instant
 * KO." Proved against the **real engine** (hard rule 3): Kimahri's Doom on
 * Yojimbo, fed event by event, puts 5 over his head and counts it down on each
 * of his turns until the KO takes it off; a full sync reconciles with state.
 *
 * Game case: FFX only (the FFX HUD's numerals layer; Lady Ginnem's Yojimbo).
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import { DoomCounters, doomCountOf, doomNoteOf } from '../../src/ui/ffx/DoomCounters.ts';

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

describe("Doom's countdown over the doomed head (research/ffx-combat-core.md §4: 'Countdown shown over the head')", () => {
  it("shows the engine's count on Yojimbo and ticks it down on each of his turns until the KO takes it off", () => {
    const engine = newEngine(true);
    drive(engine, (e) => e.state().result !== null);
    const log = engine.state().log as BattleEvent[];

    const layer = new DoomCounters({ project: () => () => ({ x: 400, y: 200 }), scale: () => 2, avoid: () => [] });
    document.body.appendChild(layer.el);
    const seen: number[] = [];
    let sawRemoval = false;
    for (const e of log) {
      layer.onEvent(e);
      const n = layer.snapshot()['yojimbo'];
      if (n !== undefined && seen[seen.length - 1] !== n) seen.push(n);
      if (seen.length && n === undefined) sawRemoval = true;
    }
    // Five of his turns (`enemies/yojimbo.ts` doomTurns: 5), counted down to 0, then gone.
    expect(seen).toEqual([5, 4, 3, 2, 1, 0]);
    expect(sawRemoval).toBe(true);
    expect(layer.el.querySelector('[data-actor="yojimbo"]')).toBeNull();
    expect(engine.state().result?.outcome).toBe('victory');
  });

  it('reconciles with state: the number follows the status, and a decided battle clears the field', () => {
    const engine = newEngine(true);
    let landed = false;
    drive(engine, (e) => {
      landed = Boolean((e.state().combatants['yojimbo'] as FFXCombatant | undefined)?.statuses['doom']);
      return landed;
    });
    expect(landed).toBe(true);
    const layer = new DoomCounters({ project: () => () => ({ x: 400, y: 200 }), scale: () => 2, avoid: () => [] });
    document.body.appendChild(layer.el);
    const state = engine.state();
    layer.sync(state);
    const y = state.combatants['yojimbo'];
    expect(layer.snapshot()).toEqual({ yojimbo: 5 });
    expect(doomCountOf(y)).toBe(5);
    expect(doomNoteOf(y)).toBe('Doom 5');
    const el = layer.el.querySelector<HTMLElement>('[data-actor="yojimbo"]');
    expect(el?.textContent).toBe('5');
    expect(el?.hidden).toBe(false);
    expect(el?.getAttribute('aria-label')).toBe('Doom 5');
    // Nobody else is doomed, so nobody else carries a note.
    expect(doomNoteOf(state.combatants['lulu'])).toBeUndefined();

    layer.sync({ ...state, result: { outcome: 'victory' } } as typeof state);
    expect(layer.snapshot()).toEqual({});
  });

  it('hides the number while the figure is off the frame, and pushes it under a panel it would print across', () => {
    let point: { x: number; y: number } | null = null;
    const layer = new DoomCounters({
      project: () => () => point,
      scale: () => 1,
      avoid: () => [{ left: 350, top: 150, right: 450, bottom: 190 }],
    });
    document.body.appendChild(layer.el);
    layer.onEvent({ type: 'status-add', targetId: 'yojimbo', status: 'doom', instance: { id: 'doom', turnsRemaining: 5, ticksRemaining: null } } as unknown as BattleEvent);
    const el = layer.el.querySelector<HTMLElement>('[data-actor="yojimbo"]')!;
    expect(el.hidden).toBe(true);
    point = { x: 400, y: 200 };
    layer.update();
    expect(el.hidden).toBe(false);
    // Head at y 200: without the panel it would sit above 195; the panel ends at 190, so it drops to 193.
    expect(parseFloat(el.style.top)).toBeCloseTo(193, 0);
  });
});
