/**
 * Bahamut's AI [research/ffx2-bahamut.md §2.1, re-read from the game's own script by re-parity AI lane FFX-2 a:
 * research/re-ffx2-ai-bahamut-vegnagun.md section 2; the row-by-row tests are in parity-ffx2-ai-bahamut.test.ts].
 *
 * The script is the single most implementation-critical asset in that document:
 * a fully deterministic loop with **no HP-threshold trigger** for Mega Flare and
 * **no phase changes**. The countdown turns are the party's designated free-damage
 * window, and the reason the fight is winnable at Lv 20.
 *
 * Re-pinned for "game-script parity" (re-parity AI lane FFX-2 a): the Curse comes once, at the very first
 * action, not once per loop; the loop is six actions (Attack x3, Impulse x2, Mega Flare) with the countdown
 * between the second Impulse and Mega Flare; the countdown shows 5, 4, 3, 2 and then 1 with the cast.
 *
 * If any of these assertions start failing because someone added an HP trigger
 * "to make the fight more dynamic", the encounter has stopped being FFX-2's.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, newGauge, aiScriptFor, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import type { AiContext, EventDraft, Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { BattleEvent, Command } from '../../src/battle/common/types.ts';

function fakeUnit(id: string, side: 'party' | 'enemy'): Ffx2Unit {
  return {
    id, name: id, side, spriteKey: id,
    stats: { hp: 1000, mp: 0, str: 50, def: 30, mag: 30, mdef: 30, agi: 50, luck: 5, eva: 0, acc: 100, maxHp: 1000, maxMp: 0 },
    hp: 1000, mp: 0, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [],
    controller: side === 'party' ? 'player' : 'ai', alive: true, removed: false, slot: 0, flags: {},
    level: 24,
    atb: { ticks: 0, required: 10000, gauge: 0, charging: null, recovery: 0 },
    accessories: [], chainCount: 0, chainWindowTicks: 0, aiMemory: {}, gauge: newGauge(0),
  };
}

/** Run the script N times against a stubbed context and record what it chose. */
function runLoop(turns: number, mutate?: (self: Ffx2Unit, turn: number) => void) {
  const script = aiScriptFor('ffx2-bahamut');
  const self = fakeUnit('bahamut', 'enemy');
  const party = [fakeUnit('yuna', 'party'), fakeUnit('rikku', 'party'), fakeUnit('paine', 'party')];
  const rng = new SeededRng(99);
  const flags: Record<string, number | string | boolean> = {};
  const emitted: EventDraft[] = [];
  const chosen: Array<string | null> = [];

  const ctx: AiContext = {
    self,
    units: [self, ...party],
    rng,
    flags,
    ticks: 0,
    ability: (id) => defaultAbilities.get(id),
    party: () => party,
    allies: () => [],
    emit: (e) => emitted.push(e),
  };

  for (let i = 0; i < turns; i++) {
    mutate?.(self, i);
    const command: Command | null = script.decide(ctx);
    chosen.push(command && 'id' in command ? command.id : null);
  }
  return { chosen, emitted, self, flags };
}

/** The first action of the battle, then the six-action cycle that repeats. */
const OPENING = ['bahamut-curse'];
const CYCLE = [
  'attack',
  'attack',
  'attack',
  'impulse',
  'impulse',
  null, null, null, null, null, // the countdown: five turns that do nothing
  'mega-flare',
];

describe('Curse once, then the six-action cycle', () => {
  it('runs Curse once, then Attack x3, Impulse x2, five countdown turns, Mega Flare', () => {
    expect(runLoop(12).chosen).toEqual([...OPENING, ...CYCLE]);
  });

  it('wraps back to Attack, not to Curse, and repeats identically — the loop never resets', () => {
    expect(runLoop(1 + 2 * CYCLE.length).chosen).toEqual([...OPENING, ...CYCLE, ...CYCLE]);
  });

  it('has NO HP-threshold trigger: Mega Flare is purely counted', () => {
    // Drop Bahamut to 1 HP on turn 0 and the script must not deviate.
    const low = runLoop(12, (self, turn) => {
      if (turn === 0) self.hp = 1;
    });
    expect(low.chosen).toEqual([...OPENING, ...CYCLE]);
  });

  it('counts turns of his own on this base: one turn stands for one 150-poll step (a timer row for lane W4)', () => {
    // The game counts 5 x 150 AI polls on a running clock, so Slow, Haste and a long action do not change it; until the
    // engine's clock is the logic step the count is five of his turns and nothing the script reads moves it.
    const slowed = runLoop(12, (self) => {
      self.statuses['slow'] = { id: 'slow', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    });
    expect(slowed.chosen).toEqual([...OPENING, ...CYCLE]);
  });
});

describe('the Mega Flare countdown telegraph', () => {
  it('emits `charge` events reading 5, 4, 3, 2, 1, the 1 with the cast: the turns until the cast are 4 to 0', () => {
    const { emitted } = runLoop(12);
    const charges = emitted.filter((e) => e.type === 'charge') as Array<
      Extract<BattleEvent, { type: 'charge' }>
    >;
    expect(charges.map((c) => c.name)).toEqual(['5', '4', '3', '2', '1']);
    expect(charges.map((c) => c.turnsLeft)).toEqual([4, 3, 2, 1, 0]);
    expect(charges.every((c) => c.enemyId === 'bahamut')).toBe(true);
  });

  it('escalates the banner to stage 2 as the number gets small', () => {
    const { emitted } = runLoop(12);
    const charges = emitted.filter((e) => e.type === 'charge') as Array<
      Extract<BattleEvent, { type: 'charge' }>
    >;
    expect(charges.map((c) => c.stage)).toEqual([1, 1, 1, 2, 2]);
  });

  it('presents a NUMBER, not an invented English string', () => {
    // §2.6: no accessible source records the on-screen string for the X-2
    // version, so the countdown ships as a numeric badge and any English line
    // would be presenting a guess as canon.
    const { emitted } = runLoop(12);
    const charges = emitted.filter((e) => e.type === 'charge') as Array<
      Extract<BattleEvent, { type: 'charge' }>
    >;
    for (const charge of charges) expect(charge.name).toMatch(/^[0-9]$/);
  });

  it('exposes the live countdown on the encounter flags for the HUD', () => {
    const { flags } = runLoop(9); // Curse, A A A I I, then the countdown turns: silent, 5, 4
    expect(flags['bahamutCountdown']).toBe(4);
  });

  it('spends the five countdown turns doing nothing at all — five free party turns', () => {
    const { chosen } = runLoop(12);
    expect(chosen.slice(6, 11)).toEqual([null, null, null, null, null]);
  });
});

describe('through the engine', () => {
  it('telegraphs and then lands Mega Flare on the whole party', () => {
    const engine = new FFX2Engine({ minigames: false });
    engine.init(bahamutSetup(8));
    const events: BattleEvent[] = [];

    for (let i = 0; i < 6000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { events.push(...engine.tick(d.nextEventMs)); continue; }
      if (d.kind === 'resolved') { events.push(...d.events); continue; }
      // The party defends, so only Bahamut's script advances the fight.
      events.push(...engine.submit({ kind: 'defend', targets: [] }));
      if (events.some((e) => e.type === 'action-start' && e.abilityId === 'mega-flare')) break;
    }

    const charges = events.filter((e) => e.type === 'charge');
    expect(charges.length).toBeGreaterThanOrEqual(5);

    const megaFlare = events.find((e) => e.type === 'action-start' && e.abilityId === 'mega-flare');
    expect(megaFlare).toBeDefined();

    // The countdown must be over before the payload lands.
    const flareSeq = megaFlare?.seq ?? Infinity;
    expect(charges.filter((c) => c.seq < flareSeq).length).toBeGreaterThanOrEqual(5);
  });

  it('opens the fight with Curse, an attack on the player’s *systems*', () => {
    const engine = new FFX2Engine({ minigames: false });
    engine.init(bahamutSetup(8));
    const events: BattleEvent[] = [];
    for (let i = 0; i < 400; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { events.push(...engine.tick(d.nextEventMs)); continue; }
      if (d.kind === 'resolved') { events.push(...d.events); continue; }
      events.push(...engine.submit({ kind: 'defend', targets: [] }));
      if (events.some((e) => e.type === 'status-add' && e.status === 'curse')) break;
    }
    const cursed = events.find((e) => e.type === 'status-add' && e.status === 'curse');
    expect(cursed).toBeDefined();
    // X-2 Curse means "cannot spherechange". It is not the FFX Curse.
    if (cursed?.type !== 'status-add') return;
    const victim = engine.state().combatants[cursed.targetId];
    expect(victim?.statuses.curse?.permanent).toBe(true);
  });
});

describe('the other eight scripts are registered', () => {
  it('resolves every aiScriptId the FFX-2 data files ship', () => {
    const ids = [
      'ffx2-bahamut', 'vegnagun-tail', 'vegnagun-leg', 'vegnagun-node',
      'vegnagun-body', 'vegnagun-bulwark', 'vegnagun-head', 'vegnagun-redoubt', 'shuyin',
    ];
    for (const id of ids) expect(aiScriptFor(id).id, id).toBe(id);
  });

  it('degrades an unknown script to idle rather than throwing', () => {
    expect(aiScriptFor('not-a-real-boss').id).toBe('idle');
    expect(aiScriptFor(undefined).id).toBe('idle');
  });
});
