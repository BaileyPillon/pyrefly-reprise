/**
 * **Grand Summon and a knocked-out aeon** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; switch `GRAND_SUMMON_KO_REFUSED`, default OFF; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`).
 *
 * The game: Grand Summon (0x3118) opens the same list 5 as Summon; each entry is resolved by the class-0 test (0x0079A080: HP above 0, availability byte set, left-battle clear, +0x6D8 clear). A knocked-out or
 * recovering aeon answers unavailable, the entry is drawn greyed and a confirm on it is refused (cue 3). The engine, with the switch off (the state of the tip before this lane), lists it as pickable and
 * **accepts** the pick: the gauge is spent, no aeon comes, the turn is gone. With the switch on the pick is refused with the turn kept open and the picker draws the entry greyed.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { pinSwitchesToPreR55 } from './helpers/pinPreR55Switches.ts';
import type { BattleEngine, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { grandSummonEntries } from '../../src/battle/ffx/pickerParams.ts';
import { defaultGrandSummonAeon } from '../../src/battle/ffx/aeon-duel.ts';
import { GRAND_SUMMON_KO_REFUSED, aeonKnockedOut, grandSummonKoRefused, setGrandSummonKoRefused } from '../../src/battle/ffx/grand-summon-ko.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { firstLinkSetup, newEngine as newLastSummoningEngine } from './helpers/lastSummoningDrive.ts';

pinSwitchesToPreR55(); // r55 RE: the four parity switches ship ON; this file was written for OFF and turns on what it exercises

type Input = Extract<Decision, { kind: 'player-input' }>;

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
const grand = (aeonId: string): Command => ({ kind: 'overdrive', id: 'grand-summon', targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId } } }) as Command;
const yunaOf = (engine: BattleEngine): FFXCombatant => engine.state().combatants['yuna'] as FFXCombatant;

/** Chapter III's second link with Valefor knocked out (a recovery count of 8, as a wipe in the Final Aeon leaves it) and Yuna's gauge full, on Yuna's turn. */
function linkWithValeforDown(): { engine: BattleEngine; input: Input } {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: ENEMY_GROUPS_BY_ID['possessed-ifrit']!, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  const valefor = ctxOf(engine).rt.aeonRoster.get('valefor')!;
  valefor.hp = 0;
  valefor.alive = false;
  valefor.aeon!.reviveCountdown = 8;
  for (let i = 0; i < 400; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('over');
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'yuna') {
      yunaOf(engine).overdrive!.gauge = 100;
      const again = engine.nextDecision();
      return { engine, input: again as Input };
    }
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no Yuna turn');
}

let restore: Array<() => void> = [];
afterEach(() => {
  for (const r of restore.reverse()) r();
  restore = [];
});

describe('the switch is off: the engine accepts a Grand Summon naming a knocked-out aeon and loses the gauge (the state of the tip)', () => {
  it('GRAND_SUMMON_KO_REFUSED.on is false; the picker lists the knocked-out aeon as pickable', () => {
    expect(GRAND_SUMMON_KO_REFUSED.on).toBe(false);
    const { engine } = linkWithValeforDown();
    const entries = grandSummonEntries(ctxOf(engine));
    expect(entries.map((e) => e.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    expect(entries.every((e) => e.enabled === undefined)).toBe(true);
  });

  it('naming it: three events (the gauge goes), no aeon comes, the turn is spent', () => {
    const { engine } = linkWithValeforDown();
    const events = engine.submit(grand('valefor'));
    expect(events.map((e) => e.type)).toEqual(['action-start', 'overdrive-gauge', 'action-end']);
    expect(yunaOf(engine).overdrive!.gauge).toBe(0);
    expect(engine.state().aeonId).toBeNull();
    expect(engine.nextDecision().kind).not.toBe('player-input'); // the turn went; the party acts again only after the others have
  });

  it('the pure rule does nothing while the switch is off', () => {
    const { engine } = linkWithValeforDown();
    expect(grandSummonKoRefused(ctxOf(engine), grand('valefor'))).toBe(false);
  });
});

describe('the switch is on: the game\'s refusal', () => {
  it('the pick is refused with no event and the turn kept open; the gauge is kept', () => {
    restore.push(setGrandSummonKoRefused(true));
    const { engine, input } = linkWithValeforDown();
    expect(engine.submit(grand('valefor'))).toEqual([]);
    const again = engine.nextDecision();
    expect(again.kind).toBe('player-input');
    expect((again as Input).actorId).toBe('yuna');
    expect((again as Input).commands.map((c) => c.label)).toEqual(input.commands.map((c) => c.label));
    expect(yunaOf(engine).overdrive!.gauge).toBe(100);
  });

  it('the picker draws the knocked-out entry greyed; the live ones are as before', () => {
    restore.push(setGrandSummonKoRefused(true));
    const { engine } = linkWithValeforDown();
    const entries = grandSummonEntries(ctxOf(engine));
    expect(entries.map((e) => e.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    expect(entries.map((e) => e.enabled)).toEqual([false, undefined, undefined, undefined, undefined]);
  });

  it('a live aeon still comes with the gauge spent; a bare Grand Summon (the headless roll) is not refused and the default roll skips the knocked-out aeon', () => {
    restore.push(setGrandSummonKoRefused(true));
    const { engine } = linkWithValeforDown();
    const ctx = ctxOf(engine);
    expect(grandSummonKoRefused(ctx, grand(''))).toBe(false);
    expect(grandSummonKoRefused(ctx, grand('ifrit'))).toBe(false);
    expect(grandSummonKoRefused(ctx, grand('valefor'))).toBe(true);
    expect(grandSummonKoRefused(ctx, { kind: 'summon', id: 'valefor', targets: [] } as Command)).toBe(false); // Summon's own rows are not this rule's
    expect(defaultGrandSummonAeon(ctx)).toBe('ifrit');
    const events = engine.submit(grand('ifrit'));
    expect(events.some((e) => e.type === 'summon' && (e as { aeonId?: string }).aeonId === 'ifrit')).toBe(true);
    expect(yunaOf(engine).overdrive!.gauge).toBe(0);
  });

  it('an aeon that fell in this battle (dismissed with a recovery count) is refused too', () => {
    restore.push(setGrandSummonKoRefused(true));
    const { engine } = linkWithValeforDown();
    const ctx = ctxOf(engine);
    const ifrit = ctx.rt.aeonRoster.get('ifrit')!;
    expect(aeonKnockedOut(ctx, 'ifrit')).toBe(false);
    ifrit.hp = 0;
    ifrit.alive = false;
    ifrit.aeon!.reviveCountdown = 12;
    expect(aeonKnockedOut(ctx, 'ifrit')).toBe(true);
    expect(engine.submit(grand('ifrit'))).toEqual([]);
    expect(aeonKnockedOut(ctx, 'nobody')).toBe(false); // an unknown key is not this rule's
  });

  it('Isaaru\'s aeon duel, which already leaves a knocked-out aeon out of the picker, is identical on and off', () => {
    const entriesOf = (): string => {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: ENEMY_GROUPS_BY_ID['isaaru-grothia']!, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      ctxOf(engine).rt.aeonRoster.get('shiva')!.hp = 0;
      return JSON.stringify(grandSummonEntries(ctxOf(engine)));
    };
    const off = entriesOf();
    restore.push(setGrandSummonKoRefused(true));
    expect(entriesOf()).toBe(off);
  });

  it('the Magus Sisters (the hidden Last Summoning) are one entry: it is greyed when any one of the three is down', async () => {
    restore.push(setGrandSummonKoRefused(true));
    const { setup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
    const board = newLastSummoningEngine(setup);
    const ctx = ctxOf(board);
    expect(aeonKnockedOut(ctx, 'cindy')).toBe(false);
    const mindy = ctx.rt.aeonRoster.get('mindy')!;
    mindy.hp = 0;
    mindy.alive = false;
    mindy.aeon!.reviveCountdown = 31;
    expect(aeonKnockedOut(ctx, 'cindy')).toBe(true);
    expect(grandSummonKoRefused(ctx, grand('cindy'))).toBe(true);
  });
});
