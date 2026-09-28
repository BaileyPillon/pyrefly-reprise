// @vitest-environment jsdom
/**
 * Chapter XVI, Ixion at Djose: the "Recharge" tell gets the FFX-2 HUD's battle banner (the check's one major,
 * 2026-09-27). **FFX-2 only** [AGENTS.md rule 14]: FFX names enemy moves on its own HELP bar (PR-0180).
 *
 * Proved by running the real FFX-2 engine to Ixion's Recharge (his counter set to 100 through the AI's own memory,
 * as the check did) and feeding the engine's own event log to the HUD.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { AC } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { setMem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { djoseIxionGroup, IXION_ID } from '../../../src/data/ffx2/enemies/ixion-djose.ts';
import { FFX2BattleHud } from '../../../src/ui/ffx2/FFX2BattleHud.ts';
import { FFX2_TOLD_ENEMY_MOVES, isToldEnemyMove } from '../../../src/ui/ffx2/toldMoves.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

/** Run the fight (everyone Defends) until Ixion starts `abilityId`; return the engine and every event so far. */
function untilIxion(abilityId: string, seed = 3, counterAt = 100): { engine: FFX2Engine; events: BattleEvent[] } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: djoseBuild, enemies: djoseIxionGroup, triggers: [], seed, condition: 'normal', canEscape: false });
  setMem(engine.state().combatants[IXION_ID] as unknown as Ffx2Unit, AC, counterAt);
  for (let i = 0; i < 5000; i++) {
    const log = engine.state().log;
    if (log.some((e) => e.type === 'action-start' && e.actorId === IXION_ID && e.abilityId === abilityId)) {
      return { engine, events: [...log] };
    }
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`Ixion never started ${abilityId}`);
}

const banner = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('[data-role="battle-message"]')!;
const nameOf = (root: HTMLElement): string => banner(root).querySelector('[data-role="name"]')!.textContent ?? '';
const chipOf = (root: HTMLElement): string => banner(root).querySelector('[data-role="chip"]')!.textContent ?? '';

describe('the told-move list', () => {
  it('holds exactly Ixion\'s Recharge (the one move a source says is read off the screen)', () => {
    expect([...FFX2_TOLD_ENEMY_MOVES]).toEqual(['x2-ixion-recharge']);
    expect(isToldEnemyMove('x2-ixion-recharge')).toBe(true);
    for (const no of ['x2-ixion-thors-hammer', 'x2-ixion-thundara', 'x2-ixion-attack', undefined]) expect(isToldEnemyMove(no)).toBe(false);
  });
});

describe('FFX2BattleHud: the Recharge banner (Chapter XVI)', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
  });
  afterEach(() => {
    hud.unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('shows "Ixion · Recharge" as the real engine starts Recharge, and never blocks playback', () => {
    const { engine, events } = untilIxion('x2-ixion-recharge');
    hud.sync(engine.state(), { elapsedMs: 0, bars: [] });
    const at = events.findIndex((e) => e.type === 'action-start' && e.actorId === IXION_ID && e.abilityId === 'x2-ixion-recharge');
    expect(at).toBeGreaterThanOrEqual(0);
    expect(banner(root).hidden).toBe(true);
    expect(hud.onEvent(events[at]!)).toBeUndefined();
    expect(banner(root).hidden).toBe(false);
    expect(nameOf(root)).toBe('Ixion');
    expect(chipOf(root)).toBe('Recharge');
  });

  it('stays hidden for his other moves and for the girls\' actions (only the tell is named)', () => {
    // His opening loop (Attack or Thundara, then Aerospark) from a zero counter, then Recharge and the Hammer.
    const loop = untilIxion('x2-ixion-aerospark', 3, 0);
    const hammer = untilIxion('x2-ixion-thors-hammer');
    const events = [...loop.events, ...hammer.events];
    expect(events.filter((e) => e.type === 'action-start' && e.actorId === IXION_ID).length).toBeGreaterThanOrEqual(4);
    hud.sync(hammer.engine.state(), { elapsedMs: 0, bars: [] });
    for (const e of events) {
      if (e.type !== 'action-start') continue;
      if (e.actorId === IXION_ID && e.abilityId === 'x2-ixion-recharge') continue;
      void hud.onEvent(e);
      expect(banner(root).hidden, `${e.actorId} ${e.abilityId ?? e.command.kind}`).toBe(true);
    }
  });
});
