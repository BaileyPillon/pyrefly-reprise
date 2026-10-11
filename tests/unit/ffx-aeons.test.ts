/**
 * Aeons: the party freeze, Dismiss, the Grand Summon temporary gauge, and
 * Seymour's Banish [ffx-combat-core §6.1, §5.4, §6.5].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, FFXCombatant } from '../../src/battle/common/types.ts';
import {
  AEON_GEAR,
  banishAeon,
  buildBattle,
  type Ctx,
  dismissAeon,
  FFXContentRegistry,
  resolveTargets,
  spendOverdrive,
  summonAeon,
  validTargets,
} from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { advance } from '../../src/battle/ffx/turnQueue.ts';
import { ability, aeon, enemy, party, setup } from './ffx-fixtures.test.ts';
import { giveStatus, inflict } from './helpers/ffxStatus.ts';

function makeCtx(overrides: Partial<BattleSetup> = {}): { ctx: Ctx; events: BattleEvent[] } {
  const s = setup({
    party: party({ aeons: [aeon({ id: 'valefor' }), aeon({ id: 'bahamut' })] }),
    enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'seymour-flux', aiScriptId: 'seymour-flux' })] },
    ...overrides,
  });
  const events: BattleEvent[] = [];
  let seq = 0;
  const ctx = buildBattle(s, new SeededRng(s.seed), new FFXContentRegistry(), (e) => {
    events.push({ ...e, seq: seq++ } as BattleEvent);
  });
  return { ctx, events };
}

function at(ctx: Ctx, id: string): FFXCombatant {
  const c = ctx.state.combatants[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c as FFXCombatant;
}

describe('summoning (§6.1)', () => {
  // Re-parity W5 (FFX only): the game's party transitions (kernel/aeon-party.ts, proven in parity-ffx-aeon-party.test.ts). Nobody's
  // counter changes on the way out or back; the old thaw put every member's counter back as it was BEFORE the Summon, which erased
  // the summoner's recovery (Yuna at Agility 20 is charged 30 for it and acted again at once when the aeon left).
  it('replaces the whole active party and parks their counters: nothing moves on the way out or back', () => {
    const { ctx } = makeCtx();
    for (const id of ['tidus', 'yuna', 'auron']) {
      const rt = ctx.rt.actors.get(id);
      if (rt) rt.ctb = 17;
    }
    summonAeon(ctx, 'yuna', 'valefor');
    expect(ctx.state.aeonId).toBe('valefor');
    expect(ctx.rt.actors.get('valefor')?.ctb).toBe(0); // the aeon acts next

    // The party is off-stage, so the clock does not count it down: the aeon spends 40 ticks and the party still sits at 17.
    ctx.rt.actors.get('valefor')!.ctb = 40;
    advance(ctx);
    for (const id of ['tidus', 'yuna', 'auron']) {
      expect(ctx.rt.actors.get(id)?.ctb, id).toBe(17);
    }
    dismissAeon(ctx, 'command');
    for (const id of ['tidus', 'yuna', 'auron']) {
      expect(ctx.rt.actors.get(id)?.ctb, id).toBe(17);
    }
  });

  it('leaves the summoner paying the recovery of her Summon when the aeon goes', () => {
    const { ctx } = makeCtx();
    summonAeon(ctx, 'yuna', 'valefor');
    ctx.rt.actors.get('yuna')!.ctb = 30; // the Summon action charges the summoner after the aeon has arrived
    dismissAeon(ctx, 'command');
    expect(ctx.rt.actors.get('yuna')?.ctb).toBe(30);
  });

  it('makes the aeon the only present friendly target', () => {
    const { ctx } = makeCtx();
    summonAeon(ctx, 'yuna', 'valefor');
    const boss = at(ctx, 'seymour-flux');
    const attack = ability({ id: 'attack', power: 16, formula: 'strength', damageType: 'physical' });
    expect(validTargets(ctx, boss, attack)).toEqual(['valefor']);
    expect(resolveTargets(ctx, boss, attack, []).map((c) => c.id)).toEqual(['valefor']);
  });

  it('keeps HP, MP and statuses across a dismiss and re-summon', () => {
    const { ctx } = makeCtx();
    summonAeon(ctx, 'yuna', 'valefor');
    const valefor = at(ctx, 'valefor');
    valefor.hp = 1200;
    giveStatus(valefor, 'curse');
    dismissAeon(ctx, 'command');
    summonAeon(ctx, 'yuna', 'valefor');
    expect(at(ctx, 'valefor').hp).toBe(1200);
    expect(at(ctx, 'valefor').statuses['curse']).toBeDefined();
  });

  it('is immune to every negative status except Curse and Delay', () => {
    const { ctx } = makeCtx();
    const valefor = at(ctx, 'valefor');
    for (const status of ['ko', 'zombie', 'petrify', 'eject', 'sleep', 'doom', 'power-break'] as const) {
      expect(inflict(ctx, undefined, valefor, { status, chance: 254, duration: 254 }), status).toBe(false);
    }
    expect(inflict(ctx, undefined, valefor, { status: 'curse', chance: 254, duration: 254 })).toBe(true);
  });
});

describe("Seymour's Banish (§6.1, ffx-seymour-flux §4.5)", () => {
  it('removes an Eject-immune aeon, KOs it, zeroes the gauge and starts the countdown', () => {
    const { ctx, events } = makeCtx();
    summonAeon(ctx, 'yuna', 'valefor');
    const valefor = at(ctx, 'valefor');
    if (valefor.overdrive) valefor.overdrive.gauge = 80;

    // An ordinary Eject cannot touch it...
    expect(inflict(ctx, undefined, valefor, { status: 'eject', chance: 254, duration: 255 })).toBe(false);
    // ...but Banish bypasses Aeon Ribbon entirely.
    banishAeon(ctx, 'valefor');

    expect(ctx.state.aeonId).toBeNull();
    expect(valefor.removed).toBe(true);
    expect(valefor.alive).toBe(false);
    expect(valefor.overdrive?.gauge).toBe(0);
    // The wipe starts the count at one more than the record gives (Valefor 8): the battle's own save counts it down once.
    expect(valefor.aeon?.reviveCountdown).toBe(AEON_GEAR['valefor']!.recovery + 1);
    expect(events.some((e) => e.type === 'dismiss' && e.reason === 'banished')).toBe(true);
  });
});

describe('Grand Summon (§5.4, §6.5)', () => {
  it('spends a separate temporary gauge and leaves the banked one intact', () => {
    const { ctx } = makeCtx();
    const stored = ctx.rt.aeonRoster.get('bahamut');
    if (!stored?.overdrive) throw new Error('fixture');
    stored.overdrive.gauge = 100;

    summonAeon(ctx, 'yuna', 'bahamut', true);
    const bahamut = at(ctx, 'bahamut');
    expect(bahamut.aeon?.temporaryOverdrive).toBe(100);

    // First Overdrive burns the temporary pool; the banked 100 survives, so the
    // aeon can fire twice back to back.
    spendOverdrive(ctx, bahamut);
    expect(bahamut.aeon?.temporaryOverdrive).toBeNull();
    expect(bahamut.overdrive?.gauge).toBe(100);

    spendOverdrive(ctx, bahamut);
    expect(bahamut.overdrive?.gauge).toBe(0);
  });

  it('discards an unspent temporary gauge on dismissal rather than banking it', () => {
    const { ctx } = makeCtx();
    const stored = ctx.rt.aeonRoster.get('bahamut');
    if (!stored?.overdrive) throw new Error('fixture');
    stored.overdrive.gauge = 30;
    summonAeon(ctx, 'yuna', 'bahamut', true);
    dismissAeon(ctx, 'command');
    expect(at(ctx, 'bahamut').overdrive?.gauge).toBe(30);
    expect(at(ctx, 'bahamut').aeon?.temporaryOverdrive).toBeNull();
  });
});

describe('Curse', () => {
  it('stops an aeon gauge filling at all — the one status aeons are open to', () => {
    const { ctx } = makeCtx();
    summonAeon(ctx, 'yuna', 'valefor');
    const valefor = at(ctx, 'valefor');
    giveStatus(valefor, 'curse');
    const before = valefor.overdrive?.gauge ?? 0;
    // A Boost stance would normally accelerate the gauge; Curse zeroes the gain.
    inflict(ctx, undefined, valefor, { status: 'boost', chance: 255, duration: 1 });
    expect(valefor.overdrive?.gauge).toBe(before);
  });
});
