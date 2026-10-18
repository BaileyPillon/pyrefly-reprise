/**
 * **The shipped state of the FFX parity switches** (re-parity r55 RE; **FFX only**; Bailey, 2026-10-18, "I'll go with all of your recommendations", and for t6b "For t6b my answer is on").
 *
 * Release 55 turns the lanes' switches ON in the code, so the module defaults ARE the shipped game. This file does not pin or set any switch: every assertion reads the defaults a player gets.
 *
 * | Switch | Shipped | Left OFF |
 * |---|---|---|
 * | `MENU_DRAW_PARITY` | on: a `openers`, b `overdrive`, c `summon` (also Chapter 28's no-row rule), d `blocked`, e `talk` | f `cursor` (the resting cursor and the stand-in "no" cue), g `help` (Bailey's "H") |
 * | `TARGET_STEP_PARITY` | on: t1 `selfStep`, t2 `overdriveStep`, t3a `cursorStart`, t6 `openerOne` (a and b: the six lists and the five characters' Overdrive list), t7 `copycat` | t3b `cursorStartFoe`, t5 `sideSwitch` |
 * | `CH3_ROSTER_REMOVAL` | on | |
 * | `GRAND_SUMMON_KO_REFUSED` | on | |
 * | `SCRIPT_COMMAND_DISABLES` | off (moot: with the roster removal on it changes nothing, 0 differing logs) | |
 * | the submit guard | on (no flag) | |
 *
 * The behaviours below are the visible result of that table on the real engine's rows. The HUD half (real keys on the real `CommandMenu`) is `ui-ffx-shipped-switches.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Decision } from '../../src/battle/common/types.ts';
import type { FFXEngine } from '../../src/battle/ffx/index.ts';
import { MENU_DRAW_PARITY, menuParity, type MenuParityItem } from '../../src/battle/ffx/menu-draw-parity.ts';
import { TARGET_STEP_PARITY, targetStepParity, type TargetStepItem } from '../../src/battle/ffx/target-step-parity.ts';
import { CH3_ROSTER_REMOVAL } from '../../src/battle/ffx/roster-removal.ts';
import { GRAND_SUMMON_KO_REFUSED } from '../../src/battle/ffx/grand-summon-ko.ts';
import { SCRIPT_COMMAND_DISABLES } from '../../src/battle/ffx/formation-commands.ts';
import { grandSummonEntries } from '../../src/battle/ffx/pickerParams.ts';
import { actor, ctxOf, engineFor, menuOf } from './helpers/menuParityDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

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
const rowsOf = (rows: readonly AvailableCommand[], kind: string): AvailableCommand[] => rows.filter((c) => c.command.kind === kind);
const labels = (rows: readonly AvailableCommand[]): string[] => rows.map((r) => r.label);

describe('the shipped switches (module defaults, nothing set by the test)', () => {
  it('MENU_DRAW_PARITY: on, items a to e on, f (cursor) and g (help) off', () => {
    expect(MENU_DRAW_PARITY).toEqual({ on: true, skip: ['cursor', 'help'] });
    for (const item of ['openers', 'overdrive', 'summon', 'blocked', 'talk'] as MenuParityItem[]) expect(menuParity(item), item).toBe(true);
    for (const item of ['cursor', 'help'] as MenuParityItem[]) expect(menuParity(item), item).toBe(false);
  });

  it('TARGET_STEP_PARITY: on, all but cursorStartFoe (t3b) and sideSwitch (t5)', () => {
    expect(TARGET_STEP_PARITY).toEqual({ on: true, skip: ['cursorStartFoe', 'sideSwitch'] });
    for (const item of ['selfStep', 'overdriveStep', 'cursorStart', 'openerOne', 'copycat'] as TargetStepItem[]) expect(targetStepParity(item), item).toBe(true);
    for (const item of ['cursorStartFoe', 'sideSwitch'] as TargetStepItem[]) expect(targetStepParity(item), item).toBe(false);
  });

  it('the Chapter III roster removal and the Grand Summon refusal are on; the possessed copy\'s script lock stays off (moot with the removal on)', () => {
    expect(CH3_ROSTER_REMOVAL.on).toBe(true);
    expect(GRAND_SUMMON_KO_REFUSED.on).toBe(true);
    expect(SCRIPT_COMMAND_DISABLES.on).toBe(false);
  });
});

describe('Chapter I (Seymour Flux), shipped: Escape and Flee are greyed rows with no reason, Talk is the script\'s, and a hand-submitted blocked Escape is refused silently', () => {
  it('Tidus: an Escape row and Flee, both greyed with no reason; no Talk row; Yuna and Kimahri keep an enabled Talk', async () => {
    const engine = await engineFor('seymour-flux');
    const tidus = menuOf(engine, 'tidus');
    const escapes = rowsOf(tidus, 'escape');
    expect(escapes.length).toBeGreaterThanOrEqual(2);
    for (const row of escapes) {
      expect(row.enabled, String(row.label)).toBe(false);
      expect(row.disabledReason, String(row.label)).toBeUndefined();
    }
    expect(labels(tidus)).not.toContain("Can't escape");
    expect(tidus.some((r) => r.label === 'Talk')).toBe(false);
    for (const who of ['yuna', 'kimahri']) {
      const talk = menuOf(engine, who).find((r) => r.label === 'Talk');
      expect(talk?.enabled, who).toBe(true);
    }
  });

  it('submitting a blocked Escape by hand returns no event and keeps Tidus\'s turn (the guard; no "Can\'t escape!" roll)', async () => {
    const engine = await engineFor('seymour-flux');
    const d = turnOf(engine, 'tidus');
    const row = rowsOf(d.commands, 'escape')[0]!;
    const before = engine.state().log.length;
    expect(engine.submit({ ...row.command, targets: [] } as never)).toEqual([]);
    expect(engine.state().log.length).toBe(before);
    const again = engine.nextDecision();
    expect(again.kind).toBe('player-input');
    expect((again as Input).actorId).toBe('tidus');
  });

  it('target steps: a cure opens on the caster; an Attack carries no switch to the other side and no foe start (t3b and t5 are off)', async () => {
    const engine = await engineFor('seymour-flux');
    const yuna = menuOf(engine, 'yuna');
    const cure = yuna.find((r) => r.category === 'whitemagic' && r.targeting === 'single-ally' && r.enabled);
    expect(cure, 'a single-ally White Magic row of Yuna').toBeDefined();
    expect(cure!.targetStep?.start).toBe('yuna');
    const attack = menuOf(engine, 'tidus').find((r) => r.command.kind === 'attack');
    expect(attack).toBeDefined();
    expect(attack!.targetStep?.switchTo).toBeUndefined();
    expect(attack!.targetStep?.start).toBeUndefined();
  });
});

describe('Chapter II (Yunalesca), shipped: Guard opens a cursor on the user; there is no Talk row for Tidus', () => {
  it('Auron\'s Guard row carries a one-candidate step on Auron; Tidus has no Talk', async () => {
    const engine = await engineFor('yunalesca');
    const guard = menuOf(engine, 'auron').find((r) => r.label === 'Guard');
    expect(guard, 'Auron\'s Guard row').toBeDefined();
    expect(guard!.targetStep?.candidates).toEqual(['auron']);
    expect(guard!.targetStep?.start).toBe('auron');
    expect(menuOf(engine, 'tidus').some((r) => r.label === 'Talk')).toBe(false);
  });
});

describe('Chapter III, shipped: the aeons the field event removed leave the later links, and a knocked-out aeon is greyed and refused', () => {
  it('link 2 (Valefor\'s): Yuna\'s Summon list is Ifrit, Ixion, Shiva, Bahamut and so is the Grand Summon picker; link 6 (Bahamut\'s): no Summon row', async () => {
    const link2 = await engineFor('braskas-final-aeon', 'possessed-valefor');
    const d2 = turnOf(link2, 'yuna');
    expect(labels(rowsOf(d2.commands, 'summon'))).toEqual(['Ifrit', 'Ixion', 'Shiva', 'Bahamut']);
    expect(grandSummonEntries(ctxOf(link2)).map((e) => e.id)).toEqual(['ifrit', 'ixion', 'shiva', 'bahamut']);
    const link6 = await engineFor('braskas-final-aeon', 'possessed-bahamut');
    const d6 = turnOf(link6, 'yuna');
    expect(rowsOf(d6.commands, 'summon')).toEqual([]);
  });

  it('the Final Aeon with Valefor knocked out: Valefor is a greyed Summon row with no reason, the picker greys it, and a Grand Summon naming it is refused with the gauge kept', async () => {
    const engine = await engineFor('braskas-final-aeon');
    const valefor = ctxOf(engine).rt.aeonRoster.get('valefor')!;
    valefor.hp = 0;
    valefor.alive = false;
    valefor.aeon!.reviveCountdown = 8;
    const yuna = turnOf(engine, 'yuna');
    actor(engine, 'yuna').overdrive!.gauge = 100;
    const rows = menuOf(engine, 'yuna');
    const row = rows.find((r) => r.command.kind === 'summon' && r.label === 'Valefor');
    expect(row?.enabled).toBe(false);
    expect(row?.disabledReason).toBeUndefined();
    expect(yuna.actorId).toBe('yuna');
    expect(grandSummonEntries(ctxOf(engine)).find((e) => e.id === 'valefor')?.enabled).toBe(false);
    const grand = { kind: 'overdrive', id: 'grand-summon', targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: 'valefor' } } };
    expect(engine.submit(grand as never)).toEqual([]);
    expect(actor(engine, 'yuna').overdrive!.gauge).toBe(100);
    expect((engine.nextDecision() as Input).actorId).toBe('yuna');
  });
});
