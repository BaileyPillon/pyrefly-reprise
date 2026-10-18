/**
 * **The engine refuses a row the menu draws greyed with no reason** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; plumbing, `src/battle/ffx/submit-guard.ts`; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`).
 *
 * The rc11 check found that a hand-submitted greyed Escape spent the turn and a knocked-out aeon's Summon was taken. The rows the game draws greyed with no word (`MENU_DRAW_PARITY`: item c a knocked-out or
 * recovering aeon, item d a blocked Escape, Flee or Switch, item b a Cursed Overdrive) are refused at the engine's door with the turn kept open. A row greyed *with* a reason is a refusal the executor already announces
 * with a message and is left to it. With the parity switch off no menu holds a reasonless greyed row the engine took, so no play changes.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import { submittedRowGreyed } from '../../src/battle/ffx/submit-guard.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { actor, ctxOf, engineFor, menuOf } from './helpers/menuParityDrive.ts';
import type { FFXEngine } from '../../src/battle/ffx/index.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

let restore: (() => void) | undefined;
afterEach(() => {
  restore?.();
  restore = undefined;
});
const parityOn = (): void => {
  restore = setMenuDrawParity(true);
};

/** Pass turns with Defend until it is `who`'s; returns that decision. */
function turnOf(engine: FFXEngine, who: string): Input {
  for (let i = 0; i < 400; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('over');
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no turn of ' + who);
}
const asCommand = (row: AvailableCommand): Command => ({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] }) as Command;
const rowsOf = (d: Input, kind: string): AvailableCommand[] => d.commands.filter((c) => c.command.kind === kind);

describe('a blocked Escape and Flee (item d) are refused at the engine\'s door, the turn kept open', () => {
  it('parity on, Chapter I: the greyed Escape and Flee rows carry no reason; submitting either returns no event, keeps Tidus\'s turn and the log as it was', async () => {
    parityOn();
    const engine = await engineFor('seymour-flux');
    const d = turnOf(engine, 'tidus');
    const escapes = rowsOf(d, 'escape');
    expect(escapes.length).toBeGreaterThanOrEqual(2); // Escape (single) and Flee (party)
    for (const row of escapes) {
      expect(row.enabled).toBe(false);
      expect(row.disabledReason).toBeUndefined();
      const before = engine.state().log.length;
      expect(engine.submit(asCommand(row)), String(row.label)).toEqual([]);
      expect(engine.state().log.length).toBe(before);
      const again = engine.nextDecision();
      expect(again.kind).toBe('player-input');
      expect((again as Input).actorId).toBe('tidus');
    }
  });

  it('parity off, Chapter I: Flee is greyed "Can\'t escape" with its reason, and a submit is announced by the executor as it always was ("Can\'t escape!")', async () => {
    const engine = await engineFor('seymour-flux');
    const d = turnOf(engine, 'tidus');
    const flee = rowsOf(d, 'escape')[0]!;
    expect(flee.enabled).toBe(false);
    expect(flee.disabledReason).toBe("Can't escape");
    const events = engine.submit(asCommand(flee));
    expect(events.some((e) => e.type === 'message' && e.text === "Can't escape!")).toBe(true);
  });
});

describe('a knocked-out or recovering aeon\'s Summon (item c) is refused at the engine\'s door', () => {
  it('parity on, Chapter III link 2 with Valefor down: the row is greyed with no reason; a submit returns no event and Yuna is asked again with the same menu', async () => {
    parityOn();
    const engine = await engineFor('braskas-final-aeon', 'possessed-ifrit');
    const valefor = ctxOf(engine).rt.aeonRoster.get('valefor')!;
    valefor.hp = 0;
    valefor.alive = false;
    valefor.aeon!.reviveCountdown = 8;
    const d = turnOf(engine, 'yuna');
    const row = rowsOf(d, 'summon').find((r) => r.label === 'Valefor')!;
    expect(row.enabled).toBe(false);
    expect(row.disabledReason).toBeUndefined();
    expect(engine.submit(asCommand(row))).toEqual([]);
    const again = engine.nextDecision() as Input;
    expect(again.kind).toBe('player-input');
    expect(again.actorId).toBe('yuna');
    expect(again.commands.map((c) => `${c.label}:${c.enabled}`)).toEqual(d.commands.map((c) => `${c.label}:${c.enabled}`));
    const live = rowsOf(again, 'summon').find((r) => r.label === 'Ifrit')!;
    expect(live.enabled).toBe(true);
    expect(engine.submit(asCommand(live)).some((e) => e.type === 'summon')).toBe(true);
  });

  it('parity off: the knocked-out aeon has no row at all, so the guard has nothing to say (the engine is as it was)', async () => {
    const engine = await engineFor('braskas-final-aeon', 'possessed-ifrit');
    const valefor = ctxOf(engine).rt.aeonRoster.get('valefor')!;
    valefor.hp = 0;
    valefor.alive = false;
    valefor.aeon!.reviveCountdown = 8;
    const d = turnOf(engine, 'yuna');
    expect(rowsOf(d, 'summon').some((r) => r.label === 'Valefor')).toBe(false);
    const ctx = ctxOf(engine);
    expect(submittedRowGreyed(ctx, actor(engine, 'yuna'), { kind: 'summon', id: 'valefor', targets: [] })).toBe(false);
  });
});

describe('the guard leaves everything else alone', () => {
  it('an enabled row is never refused, on every row of every party member of a handful of chapters, parity on and off', async () => {
    for (const on of [false, true]) {
      if (on) parityOn();
      for (const ch of ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'isaaru-via-purifico']) {
        const engine = await engineFor(ch);
        for (const who of [...ctxOf(engine).state.activeIds]) {
          for (const row of menuOf(engine, who)) {
            if (row.enabled) expect(submittedRowGreyed(ctxOf(engine), actor(engine, who), row.command), `${ch} ${who} ${row.label} parity ${on}`).toBe(false);
          }
        }
      }
      restore?.();
      restore = undefined;
    }
  });

  it('a row greyed with a reason is not this guard\'s: Evrae\'s refused order still gets its own message', async () => {
    parityOn();
    const engine = await engineFor('evrae-airship');
    const d = turnOf(engine, 'tidus');
    const order = d.commands.find((c) => c.command.kind === 'trigger' && !c.enabled && c.disabledReason !== undefined)!;
    expect(order).toBeDefined();
    expect(submittedRowGreyed(ctxOf(engine), actor(engine, 'tidus'), order.command)).toBe(false);
  });

  it('a command with no row on the menu is not refused by the guard (Defend where it is on, a scripted turn)', async () => {
    parityOn();
    const engine = await engineFor('seymour-flux');
    turnOf(engine, 'tidus');
    expect(submittedRowGreyed(ctxOf(engine), actor(engine, 'tidus'), { kind: 'summon', id: 'nobody', targets: [] })).toBe(false);
    expect(Object.keys(ENEMY_GROUPS_BY_ID).length).toBeGreaterThan(0);
  });

  it('an enemy actor is never checked', async () => {
    parityOn();
    const engine = await engineFor('seymour-flux');
    turnOf(engine, 'tidus');
    const enemy = Object.values(engine.state().combatants).find((c) => c.side === 'enemy')!;
    expect(submittedRowGreyed(ctxOf(engine), enemy as never, { kind: 'escape', targets: [], extra: { mode: 'single' } })).toBe(false);
  });
});
