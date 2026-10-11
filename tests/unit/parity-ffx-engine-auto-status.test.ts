/**
 * **Engine-level parity, FFX equipment auto-statuses and SOS statuses** (re-parity RC4, lane FFX-E; **FFX only**).
 *
 * `parity-ffx-auto-status.test.ts` proves the apply / restore / toggle / sweep kernel against the game's machine code. This file proves the WIRING: a party
 * member wearing Auto-Shell, Auto-Haste, SOS Shell, SOS Regen or an SOS Nul in the engine's own battle context, driven through the engine's own HP changes,
 * KO, revive, casts and sweeps, ends every operation with the thirteen counters, the Regen clock and the HP that the game's own functions leave when the
 * same operations are done to a character structure in the emulator. The traces (`tests/fixtures/parity/ffx/auto_traces.json`) were recorded from the real
 * code: HP set and the weak-level byte refreshed (what a hit leaves), the per-action sweep (VA 0x007af4b0), the KO reset (0x0079a190), the Death-bit handler
 * that revives (0x00789160 to 0x0078d530), a counter cast by a spell and a counter that ran out. The engine side imports nothing of the kernel.
 *
 * Also here: the engine's own rules around the kernel (the SOS statuses switch at the sweep and not between two hits, `critical` stays the level read at
 * once, the events, a forked context, the Petrify that ends).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AutoAbilityId, FFXCombatant, StatusId } from '../../src/battle/common/types.ts';
import { dealDamage, koActor, reviveActor } from '../../src/battle/ffx/hp.ts';
import { refreshCriticalStatus, removeStatus } from '../../src/battle/ffx/statuses.ts';
import { cloneCtx } from '../../src/battle/ffx/intent.ts';
import { startAutoStatuses, sweepAutoStatuses, toggleAutoStatus } from '../../src/battle/ffx/adapt/auto-status.ts';
import { startOfTurn } from '../../src/battle/ffx/adapt/ticks.ts';
import { cloneData } from '../../src/battle/common/clone.ts';
import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { TEMPORAL_STATUS_IDS, temporalCounters } from '../../src/battle/ffx/adapt/status.ts';
import { type Ctx, rtOf } from '../../src/battle/ffx/state.ts';
import { FFXEngine, resolveAbility } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { ScriptedRng, contextOf } from './helpers/ffxEngineWiring.ts';
import { fighter, stats } from './ffx-fixtures.test.ts';

interface Step {
  op: 'start' | 'hp' | 'sweep' | 'ko' | 'revive' | 'cast' | 'lapse' | 'clock';
  hp?: number;
  slot?: number;
  turns?: number;
  ticks?: number;
  after: { counters: number[]; regenTicks: number; hp: number; weak: number; applied: number; perm: number };
}
interface Trace {
  id: number;
  gear: string[];
  maxHp: number;
  steps: Step[];
}

const traces = (JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/auto_traces.json', import.meta.url)), 'utf8')) as { traces: Trace[] }).traces;

const NUL_SLOTS = new Set([6, 7, 8, 9]);

/** A party member in the gear, at full HP, in a battle context with a dummy enemy. */
function rig(gear: readonly string[], maxHp: number, hp = maxHp): { ctx: Ctx; c: FFXCombatant; events: Array<Record<string, unknown>> } {
  const c = fighter({
    id: 'rikku',
    stats: stats({ hp: maxHp, maxHp, mp: 100, maxMp: 100 }),
    equipment: {
      weapon: { name: 'W', slots: 4, autoAbilities: gear.slice(0, 4) as AutoAbilityId[], bonusCrit: 0 },
      armor: { name: 'A', slots: 4, autoAbilities: gear.slice(4) as AutoAbilityId[], bonusCrit: 0 },
    },
  });
  c.hp = hp;
  const foe = fighter({ id: 'foe', side: 'enemy', stats: stats({ hp: 99999, maxHp: 99999 }) });
  const { ctx, events } = contextOf(c, foe, new ScriptedRng([1]), 0);
  return { ctx, c, events };
}

const countersOf = (c: FFXCombatant): number[] => temporalCounters(c);

function cast(c: FFXCombatant, slot: number, turns: number): void {
  const id = TEMPORAL_STATUS_IDS[slot] as StatusId;
  c.statuses[id] = NUL_SLOTS.has(slot)
    ? { id, turnsRemaining: null, ticksRemaining: null, charges: turns, stacks: 0, permanent: false }
    : { id, turnsRemaining: turns, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

describe('the engine ends every operation where the game\'s own functions leave the character (110 traces from the real code)', () => {
  it('there are traces to replay, with every kind of operation in them', () => {
    expect(traces.length).toBe(110);
    const ops = new Set(traces.flatMap((t) => t.steps.map((s) => s.op)));
    for (const op of ['start', 'hp', 'sweep', 'ko', 'revive', 'cast', 'lapse', 'clock']) expect(ops.has(op as Step['op']), op).toBe(true);
  });

  it('counters, Regen clock and HP after each operation equal the game\'s', () => {
    let steps = 0;
    let sawSos = 0;
    let sawRevive = 0;
    for (const t of traces) {
      const first = t.steps[0] as Step & { hp: number };
      const { ctx, c } = rig(t.gear, t.maxHp, first.hp);
      for (const s of t.steps) {
        const why = `trace ${t.id} (${t.gear.join(', ')}), op ${s.op} ${JSON.stringify({ hp: s.hp, slot: s.slot, turns: s.turns, ticks: s.ticks })}`;
        switch (s.op) {
          case 'start':
            startAutoStatuses(ctx, c);
            break;
          case 'hp':
            c.hp = s.hp as number;
            refreshCriticalStatus(ctx, c);
            break;
          case 'sweep':
            sweepAutoStatuses(ctx);
            break;
          case 'ko':
            koActor(ctx, c);
            break;
          case 'revive':
            expect(reviveActor(ctx, c, s.hp as number, 'test'), `${why} revives`).toBe(true);
            sawRevive += 1;
            break;
          case 'cast':
            cast(c, s.slot as number, s.turns as number);
            break;
          case 'lapse':
            removeStatus(ctx, c, TEMPORAL_STATUS_IDS[s.slot as number] as StatusId, 'expired');
            break;
          case 'clock':
            rtOf(ctx, c.id).regenTicks = s.ticks as number;
            break;
        }
        expect(countersOf(c).slice(3), `${why}: counters`).toEqual(s.after.counters.slice(3));
        expect(rtOf(ctx, c.id).regenTicks, `${why}: Regen clock`).toBe(s.after.regenTicks);
        expect(c.hp, `${why}: HP`).toBe(s.after.hp);
        if (s.after.counters.slice(3).some((n) => n === 255) && t.gear.some((g) => g.startsWith('sos-'))) sawSos += 1;
        steps += 1;
      }
    }
    expect(steps).toBeGreaterThan(900);
    expect(sawSos).toBeGreaterThan(100);
    expect(sawRevive).toBeGreaterThan(40);
  });
});

describe('the engine\'s own rules around the kernel', () => {
  it('SOS Shell comes on at the sweep that follows the hit, not between two hits, and `critical` is the level read at once', () => {
    const { ctx, c } = rig(['sos-shell'], 1000);
    startAutoStatuses(ctx, c);
    expect(c.statuses['shell']).toBeUndefined();
    // hit one takes Rikku to 600; hit two of the same action takes her to 400: the statuses have not moved
    dealDamage(ctx, c, 400, { element: 'none', crit: false, hitIndex: 0, hitCount: 2 });
    expect(c.statuses['critical']).toBeUndefined();
    dealDamage(ctx, c, 200, { element: 'none', crit: false, hitIndex: 1, hitCount: 2 });
    expect(c.hp).toBe(400);
    expect(c.statuses['critical']).toBeDefined(); // the level byte moves with the HP
    expect(c.statuses['shell']).toBeUndefined(); // the SOS set waits for the end of the action
    sweepAutoStatuses(ctx);
    expect(c.statuses['shell']).toMatchObject({ permanent: true, turnsRemaining: 255 });
  });

  it('the SOS set goes off again when the HP is back at half or more, and the events are the engine\'s usual', () => {
    const { ctx, c, events } = rig(['sos-shell', 'sos-nulblaze'], 1000, 400);
    startAutoStatuses(ctx, c); // silent, like the grant it replaces
    expect(events.filter((e) => String(e['type']).startsWith('status'))).toEqual([]);
    expect(c.statuses['shell']?.permanent).toBe(true);
    expect(c.statuses['nulblaze']).toMatchObject({ permanent: true, charges: null, turnsRemaining: null });
    c.hp = 500;
    refreshCriticalStatus(ctx, c);
    expect(toggleAutoStatus(ctx, c)).toBe(true);
    expect(c.statuses['shell']).toBeUndefined();
    expect(c.statuses['nulblaze']).toBeUndefined();
    expect(events.filter((e) => e['type'] === 'status-remove').map((e) => e['status']).sort()).toEqual(['nulblaze', 'shell']);
    expect(events.find((e) => e['type'] === 'status-remove')).toMatchObject({ targetId: 'rikku', reason: 'expired' });
    expect(toggleAutoStatus(ctx, c)).toBe(false); // nothing moved since
  });

  it('a character with no auto or SOS gear has no memory and nothing happens to it', () => {
    const { ctx, c } = rig(['strength-10', 'piercing'], 1000);
    startAutoStatuses(ctx, c);
    c.hp = 100;
    sweepAutoStatuses(ctx);
    expect(rtOf(ctx, c.id).auto).toBeUndefined();
    expect(Object.keys(c.statuses)).toEqual([]);
  });

  it('a permanent Auto-Haste comes with the battle, ends a Slow in progress and restarts the Regen clock; a KO takes it, a revive brings it back', () => {
    const { ctx, c } = rig(['auto-haste', 'auto-regen'], 1000);
    cast(c, 12, 5); // a Slow carried in
    rtOf(ctx, c.id).regenTicks = 77;
    startAutoStatuses(ctx, c);
    expect(c.statuses['haste']?.permanent).toBe(true);
    expect(c.statuses['regen']?.permanent).toBe(true);
    expect(c.statuses['slow']).toBeUndefined();
    expect(rtOf(ctx, c.id).regenTicks).toBe(0);
    koActor(ctx, c);
    expect(c.statuses['haste']).toBeUndefined();
    expect(c.statuses['regen']).toBeUndefined();
    rtOf(ctx, c.id).regenTicks = 90;
    reviveActor(ctx, c, 500, 'phoenix-down');
    expect(c.statuses['haste']?.permanent).toBe(true);
    expect(c.statuses['regen']?.permanent).toBe(true);
    expect(rtOf(ctx, c.id).regenTicks).toBe(0); // restore put Regen back to 0 and the apply saw it start again
  });

  it('a temporary Shell the wearer had before an SOS Shell came on is the one that comes back when the SOS set goes off (the game saves it)', () => {
    const { ctx, c } = rig(['sos-shell'], 1000);
    startAutoStatuses(ctx, c);
    cast(c, 3, 3); // a Shell cast at full HP
    c.hp = 300;
    sweepAutoStatuses(ctx);
    expect(c.statuses['shell']).toMatchObject({ permanent: true });
    c.hp = 900;
    sweepAutoStatuses(ctx);
    expect(c.statuses['shell']).toMatchObject({ permanent: false, turnsRemaining: 3 });
  });

  it('a status the previous link of a chain carried in, that the gear alone granted, is the gear\'s: dropped first, not saved as something to put back', () => {
    const { ctx, c } = rig(['sos-shell'], 1000, 300);
    c.statuses['shell'] = { id: 'shell', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    startAutoStatuses(ctx, c);
    expect(c.statuses['shell']?.permanent).toBe(true); // 300 of 1000: under half, the SOS Shell is on
    c.hp = 900;
    sweepAutoStatuses(ctx);
    expect(c.statuses['shell']).toBeUndefined(); // and it goes off for good; it was not a status of the wearer's own
  });

  it('a forked context (the advisor\'s dry run) keeps the memory and cannot change the battle\'s', () => {
    const { ctx, c } = rig(['sos-shell'], 1000);
    startAutoStatuses(ctx, c);
    c.hp = 300;
    const { ctx: copy } = cloneCtx(ctx);
    const twin = copy.state.combatants['rikku'] as FFXCombatant;
    sweepAutoStatuses(copy);
    expect(twin.statuses['shell']?.permanent).toBe(true);
    expect(c.statuses['shell']).toBeUndefined(); // the original did not sweep
    sweepAutoStatuses(ctx);
    expect(c.statuses['shell']?.permanent).toBe(true);
  });

  it('Auto-Life\'s revive brings the equipment statuses back too', () => {
    const { ctx, c } = rig(['auto-shell'], 1000);
    startAutoStatuses(ctx, c);
    c.statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    dealDamage(ctx, c, 1000, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    expect(c.alive).toBe(true);
    expect(c.hp).toBe(250); // a quarter
    expect(c.statuses['shell']?.permanent).toBe(true);
    expect(c.statuses['auto-life']).toBeUndefined();
  });
});

// ------------------------------------------------------------------------------------------------ the engine's own turn loop and the item path

describe('through the engine\'s real turn loop and item path', () => {
  it('Macalania: at every decision the SOS Shell of Rikku\'s Shell Targe is on exactly while she is under half HP (the sweep runs at the end of every action)', async () => {
    await registerBattleContent();
    const chapter = CHAPTERS.find((c) => c.id === 'seymour-anima-macalania');
    if (chapter === undefined) throw new Error('no Macalania chapter');
    let decisions = 0;
    let under = 0;
    let wearers = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const engine = new FFXEngine({ autoResolveMinigames: true });
      const setup = setupForChapter(chapter, seed);
      engine.setSeed(setup.seed);
      engine.init(setup);
      for (let step = 0; step < 4000; step++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'resolved' || d.kind === 'waiting') continue;
        for (const c of Object.values(engine.state().combatants) as FFXCombatant[]) {
          if (c.side !== 'party' || !c.equipment?.armor.autoAbilities.includes('sos-shell')) continue;
          wearers += 1;
          const isUnder = c.alive && c.hp > 0 && c.hp * 2 < c.stats.maxHp;
          expect(c.statuses['shell']?.permanent === true, `seed ${seed}, ${c.id} at ${c.hp}/${c.stats.maxHp}`).toBe(isUnder);
          decisions += 1;
          if (isUnder) under += 1;
        }
        const input = d;
        const row = input.commands.find((cmd) => cmd.enabled && cmd.command.kind === 'attack') ?? input.commands.find((cmd) => cmd.enabled);
        if (!row) break;
        const strategic = intendedStrategy(input.actorId, input.commands, engine as never);
        engine.submit(strategic ?? { ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as never);
      }
    }
    expect(wearers).toBeGreaterThan(0); // the build puts the Shell Targe on someone who is on the field
    expect(decisions).toBeGreaterThan(100);
    expect(under).toBeGreaterThan(10); // and she is under half at enough decisions for the check to mean something
  }, 120_000);

  it('a Petrify that ends puts the equipment statuses back (Petrify Grenade, then a Soft, on an Auto-Shell wearer)', async () => {
    await registerBattleContent();
    const grenade = ALL_ABILITIES.find((a) => a.id === 'petrify-grenade') as AbilityDef;
    const soft = ALL_ABILITIES.find((a) => a.id === 'soft') as AbilityDef;
    expect(grenade).toBeDefined();
    expect(soft).toBeDefined();
    const wearer = fighter({
      id: 'wearer',
      stats: stats({ hp: 1000, maxHp: 1000 }),
      equipment: { weapon: { name: 'W', slots: 1, autoAbilities: ['auto-shell'] }, armor: { name: 'A', slots: 1, autoAbilities: [] } },
    });
    const thrower = fighter({ id: 'thrower', side: 'enemy', stats: stats({ hp: 99999, maxHp: 99999 }) });
    const { ctx } = contextOf(wearer, thrower, new ScriptedRng([5, 5, 5, 5, 5, 5, 5, 5]), 0);
    startAutoStatuses(ctx, wearer);
    expect(wearer.statuses['shell']?.permanent).toBe(true);
    resolveAbility(ctx, thrower, grenade, [wearer.id]);
    expect(wearer.statuses['petrify']).toBeDefined();
    expect(wearer.statuses['shell']).toBeUndefined(); // Petrify landing wiped the counters
    resolveAbility(ctx, thrower, soft, [wearer.id]);
    expect(wearer.statuses['petrify']).toBeUndefined();
    expect(wearer.statuses['shell']?.permanent).toBe(true); // the Petrify process re-applies the gear's statuses when it ends
  });
});

describe('the other places the game switches the statuses', () => {
  it('a Regen payout at the start of a turn toggles its holder: healed past half, the SOS Shell goes off at once', () => {
    const { ctx, c } = rig(['sos-shell', 'auto-regen'], 1000, 400);
    startAutoStatuses(ctx, c);
    expect(c.statuses['shell']?.permanent).toBe(true);
    expect(c.statuses['regen']?.permanent).toBe(true);
    rtOf(ctx, c.id).regenTicks = 255; // pays (255 * 1000 >> 8) + 100 = 1095: back to full
    startOfTurn(ctx, c);
    expect(c.hp).toBe(1000);
    expect(c.statuses['shell']).toBeUndefined();
  });

  it('a permanent (fayth) Auto-Life stands the wearer up and the equipment statuses come back with it', () => {
    const { ctx, c } = rig(['auto-shell'], 1000);
    startAutoStatuses(ctx, c);
    c.statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    dealDamage(ctx, c, 1000, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    expect(c.alive).toBe(true);
    expect(c.statuses['auto-life']?.permanent).toBe(true);
    expect(c.statuses['shell']?.permanent).toBe(true);
  });
});

/** The chapter's party, every member in the given gear and HP, through the real setup (`buildBattle`). */
function battleWith(gear: (index: number) => { weapon: AutoAbilityId[]; armor: AutoAbilityId[]; hpFraction: number }): FFXCombatant[] {
  const chapter = CHAPTERS.find((c) => c.id === 'seymour-flux');
  if (chapter === undefined || chapter.buildRef.game !== 'ffx') throw new Error('no chapter to borrow a party from');
  const setup = setupForChapter(chapter, 1);
  const party = cloneData(setup.party) as FFXPartyBuild;
  party.members.forEach((m, i) => {
    const g = gear(i);
    m.equipment = { weapon: { ...m.equipment.weapon, autoAbilities: g.weapon }, armor: { ...m.equipment.armor, autoAbilities: g.armor } };
    m.hp = Math.max(1, Math.floor(m.stats.maxHp * g.hpFraction));
  });
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(1);
  engine.init({ ...setup, party });
  return (Object.values(engine.state().combatants) as FFXCombatant[]).filter((c) => c.side === 'party');
}

describe('through the real setup', () => {
  it('Auto-Haste and Auto-Regen are permanent from the first turn; an SOS Protect is on for a member who starts under half HP and off for one who starts full', async () => {
    await registerBattleContent();
    const party = battleWith((i) => (i === 0 ? { weapon: ['auto-haste', 'auto-regen'], armor: [], hpFraction: 1 } : i === 1 ? { weapon: ['sos-protect'], armor: [], hpFraction: 0.4 } : i === 2 ? { weapon: ['sos-protect'], armor: [], hpFraction: 1 } : { weapon: [], armor: [], hpFraction: 1 }));
    expect(party.length).toBeGreaterThanOrEqual(3);
    expect(party[0]?.statuses['haste']?.permanent).toBe(true);
    expect(party[0]?.statuses['regen']?.permanent).toBe(true);
    expect(party[1]?.statuses['protect']?.permanent).toBe(true);
    expect(party[1]?.statuses['critical']).toBeDefined();
    expect(party[2]?.statuses['protect']).toBeUndefined();
    expect(party[3]?.statuses['haste']).toBeUndefined();
  });
});
